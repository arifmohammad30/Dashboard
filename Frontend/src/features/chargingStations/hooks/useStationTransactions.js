import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useSocketRoom } from '../../../hooks/useSocketRoom';
import { useTableData } from '../../../hooks/useTableData';
import { apiClient } from '../../../lib/apiClient';

export function useStationTransactions(station, propTransactions) {
  const stationId = station?.id || station?.chargingStationId;
  const stationName = station?.name;

  // Join targeted room chargingstation:<stationId> with automatic unmount cleanup
  useSocketRoom(stationId ? `chargingstation:${stationId}` : null);

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
      if (!stationId && !stationName) return { data: propTransactions || [], total: propTransactions?.length || 0, totalPages: 1 };
      const queryStr = stationId
        ? `chargingStationId=${encodeURIComponent(stationId)}`
        : `search=${encodeURIComponent(stationName)}`;
      const res = await apiClient(`/api/live-sessions/history?${queryStr}&page=${page}&limit=${limit}&search=${encodeURIComponent(search || '')}`);
      return res || { data: [], total: 0, totalPages: 1 };
    },
    [stationId, stationName, propTransactions]
  );

  // Directly process events delivered to this charging station room
  useSocketEvents({
    'session:created': (session) => {
      if (!session || !session.id) return;
      setSessions(prev => {
        if (prev.some(s => s.id === session.id)) {
          return prev.map(s => s.id === session.id ? { ...s, ...session } : s);
        }
        return [session, ...prev];
      });
    },
    'session:updated': (session) => {
      if (!session || !session.id) return;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session } : s));
    },
    'session:stopped': (session) => {
      if (!session || !session.id) return;
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
