import prisma from '../../prisma.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';

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

  return await prisma.liveSession.findMany({
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
}

export async function streamSessionHistoryCsv(res, query = {}) {
  const { status, search } = query;
  const where = {};

  if (status && status !== 'All') {
    where.status = status;
  } else {
    // Exclude 'Ongoing' if retrieving session history default
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

  // Write CSV Headers
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

  // Batch cursor-based database streaming
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

