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
    return res.json(result);
  } catch (err) {
    console.error("Error fetching session history:", err);
    return res.status(500).json({ error: "Failed to fetch session history" });
  }
}

export async function getLiveSessions(req, res) {
  try {
    const result = await sessionService.getLiveSessionsFromDb(req.query);
    return res.json(result);
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
