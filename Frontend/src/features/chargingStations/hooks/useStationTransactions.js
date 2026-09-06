import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useSocketRoom } from '../../../hooks/useSocketRoom';
import { useTableData } from '../../../hooks/useTableData';
import { apiClient } from '../../../lib/apiClient';

// ----------------------------------------------------------------------
// Custom Hook: useStationTransactions
// ----------------------------------------------------------------------
// Manages paginated server-side charge session history and real-time
// WebSocket transaction event streams for a specific Charging Station.
export function useStationTransactions(station, propTransactions) {
  // Authoritative Charging Station primary ID
  const stationId = station?.id || station?.chargingStationId;

  // --------------------------------------------------------------------
  // 1. WebSocket Room Subscription
  // --------------------------------------------------------------------
  // Join targeted room 'chargingstation:<stationId>' with automatic unmount cleanup
  useSocketRoom(stationId ? `chargingstation:${stationId}` : null);

  // --------------------------------------------------------------------
  // 2. Paginated Data Fetching via useTableData
  // --------------------------------------------------------------------
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
      // If station ID is unavailable, fallback to prop transactions or empty
      if (!stationId) return { data: propTransactions || [], total: propTransactions?.length || 0, totalPages: 1 };
      
      // Request session history explicitly scoped by chargingStationId
      const res = await apiClient(`/api/live-sessions/history?chargingStationId=${encodeURIComponent(stationId)}&page=${page}&limit=${limit}&search=${encodeURIComponent(search || '')}`);
      return res || { data: [], total: 0, totalPages: 1 };
    },
    [stationId, propTransactions]
  );

  // --------------------------------------------------------------------
  // 3. Realtime WebSocket Events (Filtered to this station)
  // --------------------------------------------------------------------
  useSocketEvents({
    // New live session started at this charging station
    'session:created': (session) => {
      if (!session || !session.id) return;
      if (session.chargingStationId && session.chargingStationId !== stationId) return;
      setSessions(prev => {
        if (prev.some(s => s.id === session.id)) {
          return prev.map(s => s.id === session.id ? { ...s, ...session } : s);
        }
        return [session, ...prev];
      });
    },

    // In-progress session telemetry / status update
    'session:updated': (session) => {
      if (!session || !session.id) return;
      if (session.chargingStationId && session.chargingStationId !== stationId) return;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session } : s));
    },

    // Session completed or stopped
    'session:stopped': (session) => {
      if (!session || !session.id) return;
      if (session.chargingStationId && session.chargingStationId !== stationId) return;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session, status: session.status || 'Completed' } : s));
    }
  });

  // --------------------------------------------------------------------
  // 4. Return Paginated State & Controls
  // --------------------------------------------------------------------
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

