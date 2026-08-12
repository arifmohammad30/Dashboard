import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { getLiveSessions } from '../api/sessionService';
import { filterTableData } from '../../../utils/searchUtils';
import { getTxId, getBillCode } from '../utils/sessionFormatters';

export function useLiveSessions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    getLiveSessions()
      .then(data => setSessions(data || []))
      .catch(err => console.error("Failed to fetch initial sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  const matchSession = (s, target) => {
    const targetId = target?.sessionId || target?.id;
    return s.sessionId === targetId || s.id === targetId;
  };

  useSocketEvents({
    "session:updated": (updatedSession) => {
      const targetId = updatedSession?.sessionId || updatedSession?.id;
      if (import.meta.env.DEV) {
        console.log(`Socket.io UPDATE Session ${targetId}`, updatedSession);
      }
      setSessions(prev => {
        if (updatedSession.status && updatedSession.status !== 'Ongoing') {
          return prev.filter(s => !matchSession(s, updatedSession));
        }
        const index = prev.findIndex(s => matchSession(s, updatedSession));
        if (index !== -1) {
          const next = [...prev];
          next[index] = { ...prev[index], ...updatedSession };
          return next;
        }
        return [{ ...updatedSession }, ...prev];
      });
    },
    "session:created": (newSession) => {
      const targetId = newSession?.sessionId || newSession?.id;
      if (import.meta.env.DEV) {
        console.log(`Socket.io CREATED Session ${targetId}`, newSession);
      }
      setSessions(prev => {
        if (newSession.status && newSession.status !== 'Ongoing') return prev;
        const exists = prev.some(s => matchSession(s, newSession));
        if (exists) return prev;
        return [{ ...newSession }, ...prev];
      });
    },
    "session:stopped": (stoppedSession) => {
      const targetId = stoppedSession?.sessionId || stoppedSession?.id;
      if (import.meta.env.DEV) {
        console.log(`Socket.io STOPPED Session ${targetId}`, stoppedSession);
      }
      setSessions(prev => prev.filter(s => !matchSession(s, stoppedSession)));
    }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSessions = useMemo(() => {
    const ongoingOnly = sessions.filter(session => session.status === 'Ongoing');

    return filterTableData(ongoingOnly, debouncedSearchTerm, [
      'userName',
      'userInitials',
      'station',
      'chargePoint',
      (r) => (typeof r.connector === 'object' ? (r.connector?.type || r.connector?.name || '') : String(r.connector || '')),
      'status',
      (r) => getTxId(r.id),
      (r) => getBillCode(r.id)
    ]);
  }, [sessions, debouncedSearchTerm]);

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedSessions = useMemo(() => {
    return filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredSessions, currentPage, itemsPerPage]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  return {
    searchTerm,
    currentPage,
    loading,
    totalItems,
    totalPages,
    filteredSessions,
    paginatedSessions,
    handleSearch,
    setCurrentPage
  };
}
