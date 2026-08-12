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
    station: s.chargingStation?.name || 'Station',
    chargePoint: s.chargePoint?.name || 'Charge Point',
    cpCode: s.chargePoint?.code || '',
    connector: s.connector ? `${s.connector.type} (${s.connector.connectorId})` : 'Type2 (1)',
    tariffName: s.tariff?.name || 'Standard Rate',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  };
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

