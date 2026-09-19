import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useTableData } from '../../../hooks/useTableData';
import { getLiveSessions } from '../api/sessionService';

export function useLiveSessions() {
  const {
    data: sessions,
    setData: setSessions,
    loading,
    error,
    isError,
    reload: reloadData,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
  } = useTableData((page, limit, search) => getLiveSessions(page, limit, search));

  const matchSession = (s, target) => {
    if (!s || !target) return false;
    const targetId = typeof target === 'object' ? (target.sessionId || target.id) : target;
    if (!targetId) return false;
    const currentId = s.sessionId || s.id;
    return String(currentId).trim().toLowerCase() === String(targetId).trim().toLowerCase();
  };

  useSocketEvents({
    "session:updated": (updatedSession) => {
      console.log("updatedSession : ", updatedSession);
      if (!updatedSession) return;
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
      console.log("newSession : ", newSession);
      if (!newSession) return;
      setSessions(prev => {
        if (newSession.status && newSession.status !== 'Ongoing') return prev;
        const exists = prev.some(s => matchSession(s, newSession));
        if (exists) return prev;
        return [{ ...newSession }, ...prev];
      });
    },
    "session:stopped": (stoppedSession) => {
      console.log("stoppedSession : ", stoppedSession);
      if (!stoppedSession) return;
      setSessions(prev => prev.filter(s => !matchSession(s, stoppedSession)));
    }
  });

  return {
    searchTerm,
    currentPage,
    loading,
    error,
    isError,
    reload: reloadData,
    totalItems,
    totalPages,
    paginatedSessions: sessions,
    handleSearch: (e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
    },
    setCurrentPage
  };
}
