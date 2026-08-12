import * as sessionService from './session.service.js';

export async function getLiveSessions(req, res) {
  try {
    const sessions = await sessionService.getLiveSessionsFromDb(req.query);
    const formatted = sessions.map(s => ({
      id: s.id,
      userName: s.user?.name || 'EV Driver',
      userInitials: s.user?.initials || 'U',
      userColor: s.user?.color || 'bg-indigo-100 text-indigo-700',
      station: s.chargingStation?.name || '-',
      chargingStationId: s.chargingStationId,
      chargePoint: s.chargePoint?.name || '-',
      chargePointId: s.chargePointId,
      connector: s.connector ? `${s.connector.type} (${s.connector.connectorId})` : 'Type2 (1)',
      status: s.status,
      initialSoc: s.initialSoc ? `${s.initialSoc}%` : '-',
      currentSoc: s.currentSoc ? `${s.currentSoc}%` : '-',
      kwhDelivered: (s.kwhDelivered || 0).toFixed(2),
      cost: (s.totalCost || 0).toFixed(2),
      createdAt: s.createdAt
    }));
    return res.json(formatted);
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

