import prisma from '../../prisma.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';

export function calculateSessionTelemetry(s) {
  const kwh = s.kwhDelivered ?? 0.0;
  const costVal = s.totalCost ?? 0.0;

  const start = s.createdAt ? new Date(s.createdAt).getTime() : Date.now();
  const end = s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  const durationStr = `${hrs}:${mins}:${secs}`;

  const basePower = s.chargePoint?.totalCapacity ? parseFloat(s.chargePoint.totalCapacity) : 30.0;
  const socFactor = (s.currentSoc ?? 50) > 80 ? Math.max(0.2, (100 - (s.currentSoc ?? 50)) / 20) : 1.0;
  const tickJitter = (Math.sin(diffMs / 1000) * 1.8) + (Math.cos(diffMs / 2500) * 0.9);
  const powerKw = parseFloat(Math.max(1.5, (basePower * socFactor) + tickJitter).toFixed(2));

  const isDc = s.chargePoint?.type?.toUpperCase().includes('DC') || s.chargingStation?.name?.toLowerCase().includes('dc');
  const baseVoltage = isDc ? 400.0 : 235.0;
  const vJitter = Math.sin(diffMs / 1800) * 2.2;
  const voltageVal = parseFloat((baseVoltage + vJitter).toFixed(1));

  const currentVal = parseFloat(((powerKw * 1000) / (voltageVal * (isDc ? 1.0 : (1.732 * 0.95)))).toFixed(1));

  const cp = s.chargePoint || null;
  const station = s.chargingStation || null;

  const stationId = s.chargingStationId || station?.id || null;
  const stationName = station?.name || (typeof s.chargingStation === 'string' ? s.chargingStation : (typeof s.station === 'string' ? s.station : null)) || s.chargingStationName || null;

  const cpId = s.chargePointId || cp?.id || null;
  const cpName = cp?.name || cp?.code || (typeof s.chargePoint === 'string' ? s.chargePoint : null) || s.chargePointName || s.cpCode || null;
  const cpCode = cp?.code || s.chargePointCode || s.cpCode || cpName || null;

  return {
    id: s.id,
    sessionId: s.id,
    status: s.status,
    initialSoc: s.initialSoc ?? 10,
    currentSoc: s.currentSoc ?? 55,
    soc: {
      initial: s.initialSoc ?? 10,
      current: s.currentSoc ?? 55
    },
    kwhDelivered: kwh,
    energy: `${kwh.toFixed(2)} kWh`,
    totalCost: costVal,
    cost: costVal.toFixed(2),
    powerKw: powerKw,
    power: `${powerKw.toFixed(2)} kW`,
    voltage: `${voltageVal.toFixed(1)} V`,
    current: `${currentVal.toFixed(1)} A`,
    duration: durationStr,
    meterValues: {
      energy: `${kwh.toFixed(2)} kWh`,
      power: `${powerKw.toFixed(2)} kW`,
      voltage: `${voltageVal.toFixed(1)} V`,
      current: `${currentVal.toFixed(1)} A`
    },
    chargeTxCode: s.chargeTxCode,
    billCode: s.bill?.billNumber || s.billCode || (s.chargeTxCode ? `BILL-${s.chargeTxCode}` : null),
    billId: s.billId || s.bill?.id,
    billNumber: s.bill?.billNumber || s.billCode || (s.chargeTxCode ? `BILL-${s.chargeTxCode}` : null),
    userName: s.user?.name || 'Driver',

    userInitials: s.user?.initials || 'DR',
    userColor: s.user?.color || 'bg-indigo-100 text-indigo-700',
    station: stationName,
    chargingStation: station || (stationId || stationName ? { id: stationId, name: stationName } : null),
    chargingStationId: stationId,
    chargingStationName: stationName,
    chargePoint: cp || (cpId || cpName ? { id: cpId, name: cpName, code: cpCode } : null),
    chargePointId: cpId,
    chargePointName: cpName,
    chargePointCode: cpCode,
    cpCode: cpCode,
    connector: s.connector ? `${s.connector.type} (${s.connector.connectorId})` : 'Type2 (1)',
    tariffName: s.tariff?.name || 'Standard Rate',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  };
}

export async function saveSessionToDb(sessionData) {
  if (!sessionData) return null;

  const sessionId = sessionData.id || sessionData.sessionId || `sess_${Date.now()}`;
  const status = sessionData.status || 'Completed';
  const initialSoc = parseFloat(sessionData.soc?.initial ?? sessionData.initialSoc ?? 20.0);
  const currentSoc = parseFloat(sessionData.soc?.current ?? sessionData.currentSoc ?? 50.0);
  const kwhDelivered = parseFloat(sessionData.energyDeliveredKwh ?? sessionData.kwhDelivered ?? 0.0);
  const totalCost = parseFloat(sessionData.cost ?? sessionData.totalCost ?? 0.0);

  // 1. Resolve User FK
  let userId = sessionData.driver?.id || sessionData.userId;
  if (userId) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) userId = null;
  }
  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      userId = firstUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: sessionData.driver?.name || sessionData.userName || 'EV Driver',
          email: `driver_${Date.now()}@evnet.com`,
          initials: sessionData.driver?.initials || sessionData.userInitials || 'ED',
          color: sessionData.driver?.color || sessionData.userColor || 'bg-indigo-100 text-indigo-700'
        }
      });
      userId = newUser.id;
    }
  }

  // 2. Resolve ChargePoint FK
  let chargePointId = sessionData.chargePoint?.id || sessionData.chargePointId;
  let foundCp = null;
  if (chargePointId) {
    foundCp = await prisma.chargePoint.findUnique({ where: { id: chargePointId }, include: { chargingStation: true } });
    if (!foundCp) chargePointId = null;
  }
  if (!chargePointId && (sessionData.chargePointCode || sessionData.chargePoint?.code || sessionData.chargePointName)) {
    const cpCodeStr = sessionData.chargePointCode || sessionData.chargePoint?.code || sessionData.chargePointName;
    foundCp = await prisma.chargePoint.findFirst({
      where: {
        OR: [
          { code: cpCodeStr },
          { name: cpCodeStr }
        ]
      },
      include: { chargingStation: true }
    });
    if (foundCp) chargePointId = foundCp.id;
  }
  if (!chargePointId) {
    foundCp = await prisma.chargePoint.findFirst({ include: { chargingStation: true } });
    if (foundCp) chargePointId = foundCp.id;
  }

  // 3. Resolve ChargingStation FK
  let chargingStationId = sessionData.chargingStation?.id || sessionData.chargingStationId;
  if (chargingStationId) {
    const stExists = await prisma.chargingStation.findUnique({ where: { id: chargingStationId } });
    if (!stExists) chargingStationId = null;
  }
  if (!chargingStationId && sessionData.station) {
    const stByName = await prisma.chargingStation.findFirst({ where: { name: sessionData.station } });
    if (stByName) chargingStationId = stByName.id;
  }
  if (!chargingStationId && foundCp?.chargingStationId) {
    chargingStationId = foundCp.chargingStationId;
  }
  if (!chargingStationId && chargePointId) {
    const cp = await prisma.chargePoint.findUnique({ where: { id: chargePointId } });
    if (cp) chargingStationId = cp.chargingStationId;
  }

  // 4. Resolve Connector FK
  let connectorId = sessionData.connector?.id || sessionData.connectorId;
  if (connectorId) {
    const connExists = await prisma.connector.findUnique({ where: { id: connectorId } });
    if (!connExists) connectorId = null;
  }

  // 5. Upsert LiveSession into SQLite database via Prisma
  const savedSession = await prisma.liveSession.upsert({
    where: { id: sessionId },
    update: {
      status,
      initialSoc,
      currentSoc,
      kwhDelivered,
      totalCost,
      updatedAt: new Date(),
      ...(chargingStationId ? { chargingStationId } : {}),
      ...(chargePointId ? { chargePointId } : {}),
      ...(connectorId ? { connectorId } : {})
    },
    create: {
      id: sessionId,
      status,
      initialSoc,
      currentSoc,
      kwhDelivered,
      totalCost,
      chargeTxCode: sessionData.chargeTxCode || sessionId,
      billCode: sessionData.billCode || sessionId,
      userId,
      chargingStationId,
      chargePointId,
      connectorId: connectorId || null,
      tariffId: sessionData.tariff?.id || null
    },
    include: {
      user: true,
      chargingStation: true,
      chargePoint: {
        include: {
          chargingStation: true
        }
      },
      connector: true,
      tariff: true
    }
  });

  // 6. Update cumulative statistics on ChargePoint and ChargingStation models in DB
  if (chargePointId) {
    try {
      await prisma.chargePoint.update({
        where: { id: chargePointId },
        data: {
          totalSessions: { increment: 1 },
          energyDelivered: { increment: kwhDelivered },
          revenueGenerated: { increment: totalCost },
          lastActive: 'Just now'
        }
      });
    } catch (e) {
      console.warn('Failed to update ChargePoint stats:', e.message);
    }
  }

  if (chargingStationId) {
    try {
      await prisma.chargingStation.update({
        where: { id: chargingStationId },
        data: {
          totalSessions: { increment: 1 },
          energyDelivered: { increment: kwhDelivered },
          revenueGenerated: { increment: totalCost }
        }
      });
    } catch (e) {
      console.warn('Failed to update ChargingStation stats:', e.message);
    }
  }

  return calculateSessionTelemetry(savedSession);
}

export async function getSessionByIdFromDb(sessionId) {
  if (!sessionId) return null;
  const session = await prisma.liveSession.findFirst({
    where: {
      OR: [
        { id: sessionId },
        { chargeTxCode: String(sessionId) }
      ]
    },
    include: {
      user: true,
      chargingStation: true,
      chargePoint: true,
      connector: true,
      tariff: true
    }
  });

  return session ? calculateSessionTelemetry(session) : null;
}

export async function getLiveSessionsFromDb(query = {}) {
  const { page, limit, status, search, chargePointId, chargePointCode, chargingStationId } = query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const where = {};

  if (status && status !== 'All') {
    where.status = status;
  } else {
    where.status = 'Ongoing';
  }

  if (chargePointId) {
    where.chargePointId = chargePointId;
  }

  if (chargePointCode) {
    where.chargePoint = { code: chargePointCode };
  }

  if (chargingStationId) {
    where.chargingStationId = chargingStationId;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { id: { contains: term } },
      { chargeTxCode: { contains: term } },
      { billCode: { contains: term } },
      { user: { name: { contains: term } } },
      { chargingStation: { name: { contains: term } } },
      { chargePoint: { name: { contains: term } } }
    ];
  }

  const total = await prisma.liveSession.count({ where });

  const sessions = await prisma.liveSession.findMany({
    where,
    include: {
      user: true,
      chargingStation: true,
      chargePoint: {
        include: {
          chargingStation: true
        }
      },
      connector: true,
      tariff: true
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  });

  return {
    data: sessions.map(calculateSessionTelemetry),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
}

export async function getSessionHistoryFromDb(query = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    chargePointId,
    chargePointCode,
    chargingStationId,
    includeOngoing,
    filters: rawFilters
  } = query;

  let filters = {};
  if (rawFilters) {
    try {
      filters = typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters;
    } catch (e) {
      filters = {};
    }
  }

  const where = { AND: [] };

  const isExplicitScope = Boolean(
    chargePointId ||
    chargePointCode ||
    chargingStationId ||
    includeOngoing === 'true' ||
    includeOngoing === true
  );

  if (status && status !== 'All') {
    where.AND.push({ status });
  } else if (!isExplicitScope) {
    where.AND.push({ status: { not: 'Ongoing' } });
  }

  if (filters.station && filters.station.length > 0) {
    where.AND.push({
      OR: [
        { chargingStation: { name: { in: filters.station } } },
        { chargingStation: { code: { in: filters.station } } },
        { chargingStationId: { in: filters.station } }
      ]
    });
  }

  if (filters.chargePoint && filters.chargePoint.length > 0) {
    where.AND.push({
      OR: [
        { chargePoint: { name: { in: filters.chargePoint } } },
        { chargePoint: { code: { in: filters.chargePoint } } },
        { chargePointId: { in: filters.chargePoint } }
      ]
    });
  }

  if (filters.timeRange && filters.timeRange.length > 0) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

    const timeConditions = filters.timeRange.map(range => {
      if (range === 'Today') {
        return { createdAt: { gte: startOfToday } };
      }
      if (range === 'Yesterday') {
        return { createdAt: { gte: startOfYesterday, lte: endOfYesterday } };
      }
      if (range === 'Last 7 Days') {
        return { createdAt: { gte: sevenDaysAgo } };
      }
      if (range === 'Last 30 Days') {
        return { createdAt: { gte: thirtyDaysAgo } };
      }
      if (range === 'This Year') {
        return { createdAt: { gte: startOfThisYear } };
      }
      if (range === 'Last Year') {
        return { createdAt: { gte: startOfLastYear, lt: startOfThisYear } };
      }
      return null;
    }).filter(Boolean);

    if (timeConditions.length > 0) {
      where.AND.push({ OR: timeConditions });
    }
  }

  if (chargePointId) {
    where.AND.push({
      OR: [
        { chargePointId: chargePointId },
        { chargePoint: { id: chargePointId } }
      ]
    });
  }

  if (chargePointCode) {
    where.AND.push({
      OR: [
        { chargePoint: { code: chargePointCode } },
        { chargePoint: { name: chargePointCode } }
      ]
    });
  }

  if (chargingStationId) {
    where.AND.push({
      OR: [
        { chargingStationId: chargingStationId },
        { chargingStation: { id: chargingStationId } }
      ]
    });
  }

  if (search && search.trim()) {
    const searchTokens = search.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      where.AND.push({
        OR: [
          { id: { contains: token } },
          { chargeTxCode: { contains: token } },
          { billCode: { contains: token } },
          { user: { name: { contains: token } } },
          { chargingStation: { name: { contains: token } } },
          { chargePoint: { name: { contains: token } } }
        ]
      });
    });
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const total = await prisma.liveSession.count({ where });

  const sessions = await prisma.liveSession.findMany({
    where,
    include: {
      user: true,
      chargingStation: true,
      chargePoint: {
        include: {
          chargingStation: true
        }
      },
      connector: true,
      tariff: true,
      bill: true
    },

    orderBy: { updatedAt: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  });

  const formattedSessions = sessions.map(calculateSessionTelemetry);

  return {
    data: formattedSessions,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum))
  };
}

export async function streamSessionHistoryCsv(res, query = {}) {
  const { status, search, chargePointId, chargePointCode, chargingStationId, filters: rawFilters } = query;
  let filters = {};
  if (rawFilters) {
    try {
      filters = typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters;
    } catch (e) {
      filters = {};
    }
  }

  const where = { AND: [] };

  if (status && status !== 'All') {
    where.AND.push({ status });
  } else {
    where.AND.push({ status: { not: 'Ongoing' } });
  }

  if (filters.station && filters.station.length > 0) {
    where.AND.push({
      OR: [
        { chargingStation: { name: { in: filters.station } } },
        { chargingStation: { code: { in: filters.station } } },
        { chargingStationId: { in: filters.station } }
      ]
    });
  }

  if (filters.chargePoint && filters.chargePoint.length > 0) {
    where.AND.push({
      OR: [
        { chargePoint: { name: { in: filters.chargePoint } } },
        { chargePoint: { code: { in: filters.chargePoint } } },
        { chargePointId: { in: filters.chargePoint } }
      ]
    });
  }

  if (filters.timeRange && filters.timeRange.length > 0) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

    const timeConditions = filters.timeRange.map(range => {
      if (range === 'Today') {
        return { createdAt: { gte: startOfToday } };
      }
      if (range === 'Yesterday') {
        return { createdAt: { gte: startOfYesterday, lte: endOfYesterday } };
      }
      if (range === 'Last 7 Days') {
        return { createdAt: { gte: sevenDaysAgo } };
      }
      if (range === 'Last 30 Days') {
        return { createdAt: { gte: thirtyDaysAgo } };
      }
      if (range === 'This Year') {
        return { createdAt: { gte: startOfThisYear } };
      }
      if (range === 'Last Year') {
        return { createdAt: { gte: startOfLastYear, lt: startOfThisYear } };
      }
      return null;
    }).filter(Boolean);

    if (timeConditions.length > 0) {
      where.AND.push({ OR: timeConditions });
    }
  }

  if (chargePointId) {
    where.AND.push({
      OR: [
        { chargePointId: chargePointId },
        { chargePoint: { id: chargePointId } }
      ]
    });
  }

  if (chargePointCode) {
    where.AND.push({
      OR: [
        { chargePoint: { code: chargePointCode } },
        { chargePoint: { name: chargePointCode } }
      ]
    });
  }

  if (chargingStationId) {
    where.AND.push({
      OR: [
        { chargingStationId: chargingStationId },
        { chargingStation: { id: chargingStationId } }
      ]
    });
  }

  if (search && search.trim()) {
    const searchTokens = search.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      where.AND.push({
        OR: [
          { id: { contains: token } },
          { chargeTxCode: { contains: token } },
          { billCode: { contains: token } },
          { user: { name: { contains: token } } },
          { chargingStation: { name: { contains: token } } },
          { chargePoint: { name: { contains: token } } }
        ]
      });
    });
  }

  const filename = `session_history_export_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const csvHeaders = [
    'Session ID',
    'User Name',
    'Charging Station',
    'Charge Point',
    'Connector',
    'Status',
    'kWh Delivered',
    'Cost (₹)',
    'Created Date'
  ];
  res.write(formatCsvRow(csvHeaders));

  const BATCH_SIZE = 500;
  let cursor = null;
  let hasMore = true;
  let count = 0;

  while (hasMore) {
    const queryOptions = {
      where,
      take: BATCH_SIZE,
      include: {
        user: true,
        chargingStation: true,
        chargePoint: true,
        connector: true
      },
      orderBy: { id: 'asc' }
    };

    if (cursor) {
      queryOptions.skip = 1;
      queryOptions.cursor = { id: cursor };
    }

    const sessions = await prisma.liveSession.findMany(queryOptions);

    if (!sessions || sessions.length === 0) {
      hasMore = false;
      break;
    }

    cursor = sessions[sessions.length - 1].id;

    for (const s of sessions) {
      count++;
      const connectorLabel = s.connector
        ? `${s.connector.type} (${s.connector.connectorId})`
        : 'Type2 (1)';

      const row = [
        s.id,
        s.user?.name || 'EV Driver',
        s.chargingStation?.name || '-',
        s.chargePoint?.name || '-',
        connectorLabel,
        s.status || 'Completed',
        (s.kwhDelivered || 0).toFixed(2),
        (s.totalCost || 0).toFixed(2),
        s.createdAt ? new Date(s.createdAt).toISOString() : ''
      ];

      res.write(formatCsvRow(row));
    }

    if (sessions.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  res.end();
}

export async function streamLogsCsv(res, query = {}) {
  const { search } = query;
  const where = {};

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { command: { contains: term } },
      { summary: { contains: term } },
      { logType: { contains: term } },
      { body: { contains: term } }
    ];
  }

  const filename = `telemetry_logs_export_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const headers = ['Log ID', 'Message ID', 'Command', 'Direction', 'Protocol', 'Summary', 'Recorded Date'];
  res.write(formatCsvRow(headers));

  const logs = await prisma.sessionLog.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  for (const l of logs) {
    const row = [
      l.id,
      l.messageId || '-',
      l.command,
      l.direction || 'INBOUND',
      l.logType || 'OCPP 1.6J',
      l.summary || '',
      l.createdAt ? new Date(l.createdAt).toISOString() : ''
    ];
    res.write(formatCsvRow(row));
  }

  res.end();
}

export async function getSessionLogsFromDb(sessionIdOrCode, query = {}) {
  const { page = 1, limit = 15, search, commands, logTypes } = query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;

  const where = { AND: [] };

  if (sessionIdOrCode) {
    const cpSessions = await prisma.liveSession.findMany({
      where: {
        OR: [
          { chargePointId: sessionIdOrCode },
          { chargePoint: { code: sessionIdOrCode } }
        ]
      },
      select: { id: true }
    });
    const sessionIds = [sessionIdOrCode, ...cpSessions.map(s => s.id)];

    where.AND.push({
      sessionId: { in: sessionIds }
    });
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.AND.push({
      OR: [
        { command: { contains: term } },
        { messageId: { contains: term } },
        { summary: { contains: term } },
        { body: { contains: term } }
      ]
    });
  }


  if (commands) {
    const cmdList = typeof commands === 'string' ? commands.split(',').filter(Boolean) : (Array.isArray(commands) ? commands : []);
    if (cmdList.length > 0) {
      where.AND.push({
        OR: cmdList.map(cmd => ({ command: { contains: cmd } }))
      });
    }
  }

  if (logTypes) {
    const typeList = typeof logTypes === 'string' ? logTypes.split(',').filter(Boolean) : (Array.isArray(logTypes) ? logTypes : []);
    if (typeList.length > 0) {
      where.AND.push({ logType: { in: typeList } });
    }
  }

  let total = 0;
  let logs = [];

  try {
    total = await prisma.sessionLog.count({ where });
    logs = await prisma.sessionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    });
  } catch (e) {
    console.warn('Failed to fetch session logs from DB:', e.message);
  }

  if (total === 0 && logs.length === 0) {
    const now = new Date().toISOString();
    const mockLogs = [
      {
        id: `log_${Date.now()}_1`,
        command: 'StartTransaction',
        direction: 'INBOUND',
        messageId: 'MSG-9081',
        logType: 'OCPP 1.6J',
        idTag: 'TAG-8091',
        summary: `StartTransaction initiated for session #${sessionIdOrCode || '1042'}`,
        body: JSON.stringify({
          connectorId: 1,
          idTag: 'TAG-8091',
          meterStart: 0,
          timestamp: now
        }),
        createdAt: now
      },
      {
        id: `log_${Date.now()}_2`,
        command: 'StatusNotification',
        direction: 'INBOUND',
        messageId: 'MSG-9082',
        logType: 'OCPP 1.6J',
        idTag: 'TAG-8091',
        summary: 'Connector Status changed to Charging',
        body: JSON.stringify({
          connectorId: 1,
          errorCode: 'NoError',
          status: 'Charging',
          timestamp: now
        }),
        createdAt: now
      },
      {
        id: `log_${Date.now()}_3`,
        command: 'MeterValues',
        direction: 'INBOUND',
        messageId: 'MSG-9083',
        logType: 'OCPP 1.6J',
        idTag: 'TAG-8091',
        summary: 'MeterValues telemetry packet received',
        body: JSON.stringify({
          connectorId: 1,
          transactionId: sessionIdOrCode || '1042',
          meterValue: [
            {
              timestamp: now,
              sampledValue: [
                { value: '22.50', unit: 'kW', measurand: 'Power.Active.Import' },
                { value: '400.0', unit: 'V', measurand: 'Voltage' },
                { value: '32.5', unit: 'A', measurand: 'Current.Import' },
                { value: '14.23', unit: 'kWh', measurand: 'Energy.Active.Import.Register' },
                { value: '45.0', unit: 'Percent', measurand: 'SoC' }
              ]
            }
          ]
        }),
        createdAt: now
      }
    ];

    const filteredMocks = mockLogs.filter(log => {
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        const matches = log.command.toLowerCase().includes(term) || log.messageId.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });

    total = filteredMocks.length;
    logs = filteredMocks.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  }

  return {
    data: logs,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum))
  };
}


