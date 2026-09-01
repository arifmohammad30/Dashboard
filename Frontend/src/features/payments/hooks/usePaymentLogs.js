import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPaymentLogs } from '../api/paymentService';

export function usePaymentLogs(initialFilters = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    event: 'All',
    status: 'All',
    ...initialFilters
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentLogs(filters);
      setLogs(Array.isArray(data) ? data : data?.logs || []);
    } catch (err) {
      console.error('Failed to load payment logs:', err);
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const search = (filters.search || '').trim().toLowerCase();
      const matchesSearch =
        !search ||
        log.event?.toLowerCase().includes(search) ||
        log.transactionId?.toLowerCase().includes(search) ||
        log.sessionId?.toLowerCase().includes(search) ||
        log.message?.toLowerCase().includes(search);

      const matchesEvent = filters.event === 'All' || log.event === filters.event;
      const matchesStatus = filters.status === 'All' || log.status === filters.status;

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [logs, filters]);

  return {
    logs: filteredLogs,
    allLogs: logs,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchLogs
  };
}
