import { useState, useEffect, useCallback } from 'react';
import { getChargePointStats } from '../api/chargePointService';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useSocketRoom } from '../../../hooks/useSocketRoom';

export function useChargePointStats(cp) {
  const [timeRange, setTimeRange] = useState('Today');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const cpId = cp?.id;

  // Join targeted room chargepoint:<cpId> with automatic unmount cleanup
  useSocketRoom(cpId ? `chargepoint:${cpId}` : null);

  const fetchStats = useCallback(() => {
    if (!cpId) return;
    setLoading(true);
    getChargePointStats(cpId, timeRange)
      .then(res => {
        if (res) setStats(res);
      })
      .catch(err => {
        console.error('[useChargePointStats] Failed to fetch stats:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cpId, timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Directly handle room-delivered events to update Stats tab live
  useSocketEvents({
    'session:created': () => fetchStats(),
    'session:updated': () => fetchStats(),
    'session:stopped': () => fetchStats(),
    'chargePointUpdated': () => fetchStats()
  });

  return {
    timeRange,
    setTimeRange,
    stats,
    loading,
    refreshStats: fetchStats
  };
}
