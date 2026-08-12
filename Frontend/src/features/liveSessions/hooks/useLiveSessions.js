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

  useSocketEvents({
    sessionUpdated: (updatedSession) => {
      setSessions(prev => prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      ));
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
