import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useSocketRoom } from '../../../hooks/useSocketRoom';
import { useTableData } from '../../../hooks/useTableData';
import { apiClient } from '../../../lib/apiClient';

export function useChargePointTransactions(cp) {
  const cpId = cp?.id;

  // Join targeted room chargepoint:<cpId> with automatic unmount cleanup
  useSocketRoom(cpId ? `chargepoint:${cpId}` : null);

  const {
    data: sessions,
    setData: setSessions,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
  } = useTableData(
    async (page, limit, search) => {
      if (!cpId) return { data: [], total: 0, totalPages: 1 };
      const res = await apiClient(`/api/live-sessions/history?chargePointId=${encodeURIComponent(cpId)}&page=${page}&limit=${limit}&search=${encodeURIComponent(search || '')}`);
      return res;
    },
    [cpId]
  );

  useSocketEvents({
    'session:created': (session) => {
      if (!session || !session.id) return;
      if (session.chargePointId && cpId && session.chargePointId !== cpId) return;
      setSessions(prev => {
        if (prev.some(s => s.id === session.id)) {
          return prev.map(s => s.id === session.id ? { ...s, ...session } : s);
        }
        return [session, ...prev];
      });
    },
    'session:updated': (session) => {
      if (!session || !session.id) return;
      if (session.chargePointId && cpId && session.chargePointId !== cpId) return;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session } : s));
    },
    'session:stopped': (session) => {
      if (!session || !session.id) return;
      if (session.chargePointId && cpId && session.chargePointId !== cpId) return;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session, status: session.status || 'Completed' } : s));
    }
  });

  return {
    sessions,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage
  };
}
