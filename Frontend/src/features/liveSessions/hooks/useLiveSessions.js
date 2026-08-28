import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useTableData } from '../../../hooks/useTableData';
import { getLiveSessions } from '../api/sessionService';

export function useLiveSessions() {
  const {
    data: sessions,
    setData: setSessions,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    reload: reloadData,
  } = useTableData(
    async (page, limit, search) => {
      const res = await getLiveSessions(page, limit, search);
      console.log(' [Live Sessions HTTP Data Received]:', res);
      return res;
    }
  );

  const matchSession = (s, target) => {
    const targetId = target?.sessionId || target?.id;
    return s.sessionId === targetId || s.id === targetId;
  };

  useSocketEvents({
    "session:updated": (updatedSession) => {
      console.log(' [Live Sessions Socket Event: session:updated]:', updatedSession);
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
      console.log('[Live Sessions Socket Event: session:created]:', newSession);
      setSessions(prev => {
        if (newSession.status && newSession.status !== 'Ongoing') return prev;
        const exists = prev.some(s => matchSession(s, newSession));
        if (exists) return prev;
        return [{ ...newSession }, ...prev];
      });
    },
    "session:stopped": (stoppedSession) => {
      console.log(' [Live Sessions Socket Event: session:stopped]:', stoppedSession);
      setSessions(prev => prev.filter(s => !matchSession(s, stoppedSession)));
    }
  });

  return {
    searchTerm,
    currentPage,
    loading,
    totalItems,
    totalPages,
    filteredSessions: sessions,
    paginatedSessions: sessions,
    handleSearch: (e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
    },
    setCurrentPage
  };
}
