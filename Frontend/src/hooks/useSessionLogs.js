import { useState, useEffect, useMemo } from 'react';
import { useSocketEvents } from './useSocketEvents';
import { apiClient } from '../lib/apiClient';

export function useSessionLogs({
  sessionData,
  cp,
  chargePointCode,
  targetId: customTargetId,
  refreshKey,
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

  const targetId = customTargetId || sessionData?.id || cp?.code || chargePointCode || cp?.id;

  const activeCpCode = useMemo(() => {
    const code = cp?.code || chargePointCode || sessionData?.chargePointCode ||
      (typeof sessionData?.chargePoint === 'object' ? (sessionData?.chargePoint?.code || sessionData?.chargePoint?.name) : null);
    return code ? String(code).trim().toLowerCase() : null;
  }, [cp, chargePointCode, sessionData]);

  const isLogForThisSession = (incomingLog) => {
    if (!incomingLog) return false;

    const logSessionId = incomingLog.sessionId ? String(incomingLog.sessionId).trim().toLowerCase() : null;
    const logCpCode = incomingLog.chargePointCode || incomingLog.body?.chargePointCode;
    const lowerLogCp = logCpCode ? String(logCpCode).trim().toLowerCase() : null;

    if (targetId && logSessionId && logSessionId === String(targetId).trim().toLowerCase()) {
      return true;
    }

    if (activeCpCode && lowerLogCp && (lowerLogCp === activeCpCode || lowerLogCp.includes(activeCpCode))) {
      return true;
    }

    if (!targetId && !activeCpCode) {
      return true;
    }

    return false;
  };

  const fetchLogs = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (search && search.trim()) params.append('search', search.trim());
      if (commands && commands.length > 0) params.append('commands', commands.join(','));
      if (logTypes && logTypes.length > 0) params.append('logTypes', logTypes.join(','));

      const res = await apiClient(`/api/live-sessions/${targetId}/logs?${params.toString()}`);

      const logsArray = Array.isArray(res) ? res : (res?.data || []);
      const formatted = logsArray.map(log => ({
        ...log,
        body: typeof log.body === 'string' ? (JSON.parse(log.body) || {}) : (log.body || {}),
        recordedOn: log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now',
        fullTimestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'
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
  };

  useEffect(() => {
    fetchLogs();
  }, [targetId, refreshKey, page, limit, search, commands, logTypes]);

  useSocketEvents({
    "session:log": (incomingLog) => {
      if (!incomingLog) return;
      if (sessionData?.status && sessionData.status !== 'Ongoing') return;
      if (isLogForThisSession(incomingLog)) {
        const formattedLog = {
          ...incomingLog,
          body: typeof incomingLog.body === 'string' ? (JSON.parse(incomingLog.body) || {}) : (incomingLog.body || {}),
          recordedOn: incomingLog.createdAt ? new Date(incomingLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (incomingLog.recordedOn || 'Just now'),
          fullTimestamp: incomingLog.createdAt ? new Date(incomingLog.createdAt).toLocaleString() : (incomingLog.fullTimestamp || 'Just now')
        };

        setTotal(prev => {
          const nextTotal = prev + 1;
          setTotalPages(Math.max(1, Math.ceil(nextTotal / limit)));
          return nextTotal;
        });

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
