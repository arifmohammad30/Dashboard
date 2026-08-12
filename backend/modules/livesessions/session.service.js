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

  return {
    id: s.id,
    status: s.status,
    initialSoc: s.initialSoc ?? 10,
    currentSoc: s.currentSoc ?? 55,
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
    billCode: s.billCode,
    userName: s.user?.name || 'Driver',
    userInitials: s.user?.initials || 'DR',
    userColor: s.user?.color || 'bg-indigo-100 text-indigo-700',
    station: s.chargingStation?.name || (typeof s.chargingStation === 'string' ? s.chargingStation : (typeof s.station === 'string' ? s.station : 'Station')),
    chargingStation: s.chargingStation,
    chargingStationId: s.chargingStationId || s.chargingStation?.id,
    chargingStationName: s.chargingStation?.name || (typeof s.chargingStation === 'string' ? s.chargingStation : (typeof s.station === 'string' ? s.station : 'Station')),
    chargePoint: s.chargePoint,
    chargePointId: s.chargePointId || s.chargePoint?.id,
    chargePointName: s.chargePoint?.name || (typeof s.chargePoint === 'string' ? s.chargePoint : 'Charge Point'),
    chargePointCode: s.chargePoint?.code || s.cpCode || s.chargePointCode || '',
    cpCode: s.chargePoint?.code || s.cpCode || s.chargePointCode || '',
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
  if (chargePointId) {
    const cpExists = await prisma.chargePoint.findUnique({ where: { id: chargePointId } });
    if (!cpExists) chargePointId = null;
  }
  if (!chargePointId && (sessionData.chargePointCode || sessionData.chargePoint?.code)) {
    const cpCodeStr = sessionData.chargePointCode || sessionData.chargePoint?.code;
    const cpByCode = await prisma.chargePoint.findUnique({ where: { code: cpCodeStr } });
    if (cpByCode) chargePointId = cpByCode.id;
  }
  if (!chargePointId) {
    const firstCp = await prisma.chargePoint.findFirst();
    if (firstCp) chargePointId = firstCp.id;
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
      updatedAt: new Date()
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
      chargePoint: true,
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

export async function getLiveSessionsFromDb(query = {}) {
  const { status, search } = query;
  const where = {};

  if (status && status !== 'All') {
    where.status = status;
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

  const sessions = await prisma.liveSession.findMany({
    where,
    include: {
      user: true,
      chargingStation: true,
      chargePoint: true,
      connector: true,
      tariff: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return sessions.map(calculateSessionTelemetry);
}

export async function streamSessionHistoryCsv(res, query = {}) {
  const { status, search } = query;
  const where = {};

  if (status && status !== 'All') {
    where.status = status;
  } else {

    where.status = { not: 'Ongoing' };
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

