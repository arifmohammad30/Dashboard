import * as sessionService from './session.service.js';

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await sessionService.getSessionByIdFromDb(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
  } catch (err) {
    console.error("Error fetching session by ID:", err);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
}

export async function getSessionHistory(req, res) {
  try {
    const result = await sessionService.getSessionHistoryFromDb(req.query);
    const formatted = (result.data || []).map(s => ({
      id: s.id,
      userName: s.userName || s.user?.name || 'EV Driver',
      userInitials: s.userInitials || s.user?.initials || 'U',
      userColor: s.userColor || s.user?.color || 'bg-indigo-100 text-indigo-700',
      station: s.station || s.chargingStation?.name || '-',
      chargingStationId: s.chargingStationId,
      chargePoint: s.chargePointName || s.chargePoint?.name || '-',
      chargePointName: s.chargePointName || s.chargePoint?.name || '-',
      chargePointId: s.chargePointId,
      chargePointCode: s.chargePointCode || s.chargePoint?.code || '',
      connector: (s.connector && typeof s.connector === 'string' && !s.connector.startsWith('undefined'))
        ? s.connector
        : ((s.connector && typeof s.connector === 'object' && s.connector.type)
          ? `${s.connector.type} (${s.connector.connectorId || 1})`
          : `Type2 (${s.connectorId || 1})`),
      status: s.status,
      initialSoc: s.initialSoc ? (String(s.initialSoc).endsWith('%') ? s.initialSoc : `${s.initialSoc}%`) : '-',
      currentSoc: s.currentSoc ? (String(s.currentSoc).endsWith('%') ? s.currentSoc : `${s.currentSoc}%`) : '-',
      kwhDelivered: typeof s.kwhDelivered === 'number' ? s.kwhDelivered.toFixed(2) : (s.kwhDelivered || '0.00'),
      cost: typeof s.totalCost === 'number' ? s.totalCost.toFixed(2) : (s.cost || '0.00'),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));
    return res.json({
      data: formatted,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error("Error fetching session history:", err);
    return res.status(500).json({ error: "Failed to fetch session history" });
  }
}

export async function getLiveSessions(req, res) {
  try {
    const result = await sessionService.getLiveSessionsFromDb(req.query);
    const sessions = Array.isArray(result) ? result : (result.data || []);
    const formatted = sessions.map(s => ({
      id: s.id,
      userName: s.userName || s.user?.name || 'EV Driver',
      userInitials: s.userInitials || s.user?.initials || 'U',
      userColor: s.userColor || s.user?.color || 'bg-indigo-100 text-indigo-700',
      station: s.station || s.chargingStation?.name || '-',
      chargingStationId: s.chargingStationId,
      chargePoint: s.chargePointName || s.chargePoint?.name || '-',
      chargePointName: s.chargePointName || s.chargePoint?.name || '-',
      chargePointId: s.chargePointId,
      chargePointCode: s.chargePointCode || s.chargePoint?.code || '',
      connector: (s.connector && typeof s.connector === 'string' && !s.connector.startsWith('undefined'))
        ? s.connector
        : ((s.connector && typeof s.connector === 'object' && s.connector.type)
          ? `${s.connector.type} (${s.connector.connectorId || 1})`
          : `Type2 (${s.connectorId || 1})`),
      status: s.status,
      initialSoc: s.initialSoc ? (String(s.initialSoc).endsWith('%') ? s.initialSoc : `${s.initialSoc}%`) : '-',
      currentSoc: s.currentSoc ? (String(s.currentSoc).endsWith('%') ? s.currentSoc : `${s.currentSoc}%`) : '-',
      kwhDelivered: typeof s.kwhDelivered === 'number' ? s.kwhDelivered.toFixed(2) : (s.kwhDelivered || '0.00'),
      cost: typeof s.totalCost === 'number' ? s.totalCost.toFixed(2) : (s.cost || '0.00'),
      createdAt: s.createdAt
    }));
    
    if (Array.isArray(result)) {
      return res.json(formatted);
    }
    
    return res.json({
      data: formatted,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error("Error fetching live sessions:", err);
    return res.status(500).json({ error: "Failed to fetch live sessions" });
  }
}

export async function exportSessionHistoryCsv(req, res) {
  try {
    await sessionService.streamSessionHistoryCsv(res, req.query);
  } catch (err) {
    console.error("Error streaming CSV export:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to stream CSV export" });
    }
  }
}

export async function exportLogsCsv(req, res) {
  try {
    await sessionService.streamLogsCsv(res, req.query);
  } catch (err) {
    console.error("Error streaming logs CSV export:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to stream logs CSV export" });
    }
  }
}

export async function getSessionLogs(req, res) {
  try {
    const { id } = req.params;
    const result = await sessionService.getSessionLogsFromDb(id, req.query);
    return res.json(result);
  } catch (err) {
    console.error("Error fetching session logs:", err);
    return res.status(500).json({ error: "Failed to fetch session logs" });
  }
}
