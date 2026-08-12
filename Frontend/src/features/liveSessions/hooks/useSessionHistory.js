import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { getLiveSessions } from '../api/sessionService';
import { mockSessionHistory } from '../data/mockSessionHistory';

export function useSessionHistory() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allSessions, setAllSessions] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    getLiveSessions()
      .then(list => {
        const combined = [...list.filter(s => s.status !== 'Ongoing'), ...mockSessionHistory];
        setAllSessions(combined);
      })
      .catch(() => {
        setAllSessions(mockSessionHistory);
      })
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSessions = useMemo(() => {
    return allSessions.filter(session => {
      if (session.status === 'Ongoing') return false;
      if (activeTab === 'Completed' && session.status !== 'Completed') return false;
      if (activeTab === 'Failed' && session.status !== 'Failed') return false;

      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      return (
        session.id?.toString().toLowerCase().includes(term) ||
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

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  return {
    activeTab,
    searchTerm,
    currentPage,
    loading,
    totalItems,
    totalPages,
    filteredSessions,
    paginatedSessions,
    handleSearch,
    handleTabChange,
    setCurrentPage
  };
}
