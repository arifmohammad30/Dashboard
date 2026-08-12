import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { getLiveSessions } from '../api/sessionService';
import { getGlobalCompletedSessions, subscribeGlobalCompletedSessions } from '../../../lib/socketClient';

export function useSessionHistory() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allSessions, setAllSessions] = useState([]);
  const itemsPerPage = 10;

  const matchSession = (s, target) => {
    const targetId = target?.sessionId || target?.id;
    return (s.sessionId && s.sessionId === targetId) || (s.id && s.id === targetId);
  };

  const mergeSessions = (dbList, completedList) => {
    const combined = [...completedList];
    (dbList || []).forEach(item => {
      if (item.status !== 'Ongoing' && !combined.some(c => matchSession(c, item))) {
        combined.push(item);
      }
    });
    return combined;
  };

  useEffect(() => {
    setLoading(true);
    getLiveSessions()
      .then(list => {
        const historyOnly = (list || []).filter(s => s.status !== 'Ongoing');
        const liveCompleted = getGlobalCompletedSessions();
        setAllSessions(mergeSessions(historyOnly, liveCompleted));
      })
      .catch(() => {
        setAllSessions(getGlobalCompletedSessions());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeGlobalCompletedSessions((liveCompleted) => {
      setAllSessions(prev => mergeSessions(prev, liveCompleted));
    });
    return unsubscribe;
  }, []);

  useSocketEvents({
    "session:stopped": (stoppedSession) => {
      setAllSessions(prev => [stoppedSession, ...prev.filter(s => !matchSession(s, stoppedSession))]);
    },
    "session:updated": (updatedSession) => {
      if (updatedSession.status && updatedSession.status !== 'Ongoing') {
        setAllSessions(prev => [updatedSession, ...prev.filter(s => !matchSession(s, updatedSession))]);
      }
    }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSessions = useMemo(() => {
    return allSessions.filter(session => {
      if (session.status === 'Ongoing') return false;
      if (activeTab === 'Completed' && session.status !== 'Completed') return false;
      if (activeTab === 'Failed' && session.status !== 'Failed') return false;

      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      const sId = session.sessionId || session.id || '';
      return (
        sId.toString().toLowerCase().includes(term) ||
        session.userName?.toLowerCase().includes(term) ||
        session.station?.toLowerCase().includes(term) ||
        session.chargePoint?.toLowerCase().includes(term)
      );
    });
  }, [allSessions, activeTab, debouncedSearchTerm]);

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, currentPage, itemsPerPage]);

  return {
    activeTab,
    searchTerm,
    currentPage,
    loading,
    totalItems,
    totalPages,
    filteredSessions,
    paginatedSessions,
    handleSearch: (e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
    },
    handleTabChange: (tab) => {
      setActiveTab(tab);
      setCurrentPage(1);
    },
    setCurrentPage
  };
}
