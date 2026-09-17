import { useState, useEffect, useCallback } from 'react';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { getSessionLogs } from '../api/sessionService';

function safeJsonParse(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body) || {};
  } catch {
    return { raw: String(body) };
  }
}

// Custom hook managing  logs for a specific session or charge point
export function useSessionLogs({
  sessionId,
  sessionStatus,
  page = 1,
  limit = 15,
  search = '',
  commands = [],
  logTypes = []
} = {}) {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [logsList, setLogsList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatLogTimestamps = (log) => {
    if (log.createdAt) {
      try {
        const d = new Date(log.createdAt);
        return {
          recordedOn: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          fullTimestamp: d.toLocaleString()
        };
      } catch { }
    }
    return {
      recordedOn: log.recordedOn || '-',
      fullTimestamp: log.fullTimestamp || '-'
    };
  };

  // Fetch  logs scoped to this session from REST API
  const fetchLogs = useCallback(async () => {
    if (!sessionId) {
      setSessionInfo(null);
      setLogsList([]);
      setTotal(0);
      setTotalPages(1);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getSessionLogs(sessionId, {
        page,
        limit,
        search,
        commands,
        logTypes
      });

      if (res?.session) {
        setSessionInfo(res.session);
      }

      const logsArray = Array.isArray(res) ? res : (res?.data || []);
      const formatted = logsArray.map(log => {
        const { recordedOn, fullTimestamp } = formatLogTimestamps(log);
        return {
          id: log.id,
          command: log.command,
          direction: log.direction || 'INBOUND',
          messageId: log.messageId || '-',
          idTag: log.idTag || log.body?.idTag || '-',
          logType: log.logType || 'OCPP 1.6J',
          summary: log.summary || '',
          body: safeJsonParse(log.body),
          createdAt: log.createdAt,
          recordedOn,
          fullTimestamp
        };
      });

      setLogsList(formatted);
      const totalCount = res?.total ?? logsArray.length;
      setTotal(totalCount);
      setTotalPages(res?.totalPages ?? Math.max(1, Math.ceil(totalCount / limit)));
    } catch (err) {
      console.error('[useSessionLogs] Error fetching logs:', err);
      setError(err?.message || 'Failed to load telemetry logs');
    } finally {
      setLoading(false);
    }
  }, [sessionId, page, limit, search, commands, logTypes]);

  // Fetch logs whenever dependencies change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time socket updates matched by authoritative sessionId or charge point identifier
  useSocketEvents({
    "session:log": (incomingLog) => {
      if (!incomingLog || !sessionId) return;
      if (sessionStatus && sessionStatus !== 'Ongoing') return;

      // Match by sessionId or charge point code / id
      const currentId = String(sessionId).trim().toLowerCase();
      const incomingSessionId = incomingLog.sessionId ? String(incomingLog.sessionId).trim().toLowerCase() : null;
      const incomingCpCode = (incomingLog.chargePointCode || incomingLog.chargePointId)
        ? String(incomingLog.chargePointCode || incomingLog.chargePointId).trim().toLowerCase()
        : null;

      const isMatch = incomingSessionId === currentId || incomingCpCode === currentId;
      if (!isMatch) return;

      // Apply active filter criteria to incoming real-time logs
      if (commands.length > 0) {
        const matchesCommand = commands.some(cmd => incomingLog.command?.includes(cmd));
        if (!matchesCommand) return;
      }

      if (logTypes.length > 0) {
        const matchesType = logTypes.includes(incomingLog.logType || 'OCPP 1.6J');
        if (!matchesType) return;
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        const cmdStr = (incomingLog.command || '').toLowerCase();
        const msgStr = (incomingLog.messageId || '').toLowerCase();
        const idTagStr = (incomingLog.idTag || '').toLowerCase();
        const summaryStr = (incomingLog.summary || '').toLowerCase();
        const matchesSearch = cmdStr.includes(term) || msgStr.includes(term) || idTagStr.includes(term) || summaryStr.includes(term);
        if (!matchesSearch) return;
      }

      const { recordedOn, fullTimestamp } = formatLogTimestamps(incomingLog);
      const formattedLog = {
        id: incomingLog.id,
        command: incomingLog.command,
        direction: incomingLog.direction || 'INBOUND',
        messageId: incomingLog.messageId || '-',
        idTag: incomingLog.idTag || incomingLog.body?.idTag || '-',
        logType: incomingLog.logType || 'OCPP 1.6J',
        summary: incomingLog.summary || '',
        body: safeJsonParse(incomingLog.body),
        createdAt: incomingLog.createdAt,
        recordedOn,
        fullTimestamp
      };

      setTotal(prev => {
        const nextTotal = prev + 1;
        setTotalPages(Math.max(1, Math.ceil(nextTotal / limit)));
        return nextTotal;
      });

      // If viewing page 1, prepend live message
      if (page === 1) {
        setLogsList(prev => {
          if (prev.some(l => l.id === formattedLog.id || (l.messageId && l.messageId !== '-' && l.messageId === formattedLog.messageId && l.command === formattedLog.command))) {
            return prev;
          }
          const updated = [formattedLog, ...prev];
          return updated.length > limit ? updated.slice(0, limit) : updated;
        });
      }
    }
  });

  return {
    session: sessionInfo,
    logsList,
    total,
    totalPages,
    setLogsList,
    loading,
    error,
    isError: Boolean(error),
    reload: fetchLogs
  };
}
