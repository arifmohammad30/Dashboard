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

// Custom hook managing telemetry / OCPP logs for a specific session
export function useSessionLogs({
  sessionId,
  sessionStatus,
  page = 1,
  limit = 15,
  search = '',
  commands = [],
  logTypes = []
} = {}) {
  const [logsList, setLogsList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch telemetry logs scoped to this session from REST API
  const fetchLogs = useCallback(async () => {
    if (!sessionId) {
      setLogsList([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    try {
      const res = await getSessionLogs(sessionId, {
        page,
        limit,
        search,
        commands,
        logTypes
      });

      const logsArray = Array.isArray(res) ? res : (res?.data || []);
      const formatted = logsArray.map(log => ({
        ...log,
        body: safeJsonParse(log.body),
        recordedOn: log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-',
        fullTimestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'
      }));

      setLogsList(formatted);
      const totalCount = res?.total ?? logsArray.length;
      setTotal(totalCount);
      setTotalPages(res?.totalPages ?? Math.max(1, Math.ceil(totalCount / limit)));
    } catch (err) {
      console.error('[useSessionLogs] Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, page, limit, search, commands, logTypes]);

  // Fetch logs whenever dependencies change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time socket updates matched strictly by authoritative sessionId
  useSocketEvents({
    "session:log": (incomingLog) => {
      if (!incomingLog || !sessionId) return;
      if (sessionStatus && sessionStatus !== 'Ongoing') return;

      // Match strictly by sessionId
      const incomingSessionId = incomingLog.sessionId ? String(incomingLog.sessionId).trim().toLowerCase() : null;
      const currentSessionId = String(sessionId).trim().toLowerCase();

      if (incomingSessionId === currentSessionId) {
        const formattedLog = {
          ...incomingLog,
          body: safeJsonParse(incomingLog.body),
          recordedOn: incomingLog.createdAt ? new Date(incomingLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-',
          fullTimestamp: incomingLog.createdAt ? new Date(incomingLog.createdAt).toLocaleString() : '-'
        };

        setTotal(prev => {
          const nextTotal = prev + 1;
          setTotalPages(Math.max(1, Math.ceil(nextTotal / limit)));
          return nextTotal;
        });

        // If on page 1, prepend live message
        if (page === 1) {
          setLogsList(prev => {
            if (prev.some(l => l.id === formattedLog.id || (l.messageId && l.messageId === formattedLog.messageId && l.command === formattedLog.command))) {
              return prev;
            }
            const updated = [formattedLog, ...prev];
            return updated.length > limit ? updated.slice(0, limit) : updated;
          });
        }
      }
    }
  });

  return {
    logsList,
    total,
    totalPages,
    setLogsList,
    loading,
    reload: fetchLogs
  };
}
