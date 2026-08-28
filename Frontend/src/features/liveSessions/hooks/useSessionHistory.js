import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useTableData } from '../../../hooks/useTableData';
import { getSessionHistory } from '../api/sessionService';

export function useSessionHistory() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState('All');
  const [filters, setFilters] = useState({ station: [], chargePoint: [], timeRange: [] });

  const {
    data: paginatedSessions,
    setData: setPaginatedSessions,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    reload: reloadData,
  } = useTableData(
    (page, limit, search) => getSessionHistory(page, limit, search, activeTab, filters),
    [activeTab, filters],
    urlSearch
  );

  useEffect(() => {
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  const matchSession = (s, target) => {
    const targetId = target?.sessionId || target?.id;
    return (s.sessionId && s.sessionId === targetId) || (s.id && s.id === targetId);
  };

  useSocketEvents({
    "session:stopped": (stoppedSession) => {
      if (stoppedSession) {
        if (activeTab === 'All' || stoppedSession.status === activeTab || (activeTab === 'Completed' && stoppedSession.status === 'Stopped')) {
          setPaginatedSessions(prev => [stoppedSession, ...prev.filter(s => !matchSession(s, stoppedSession))]);
        } else {
          setPaginatedSessions(prev => prev.filter(s => !matchSession(s, stoppedSession)));
        }
      }
    },
    "session:updated": (updatedSession) => {
      if (updatedSession && updatedSession.status && updatedSession.status !== 'Ongoing') {
        if (activeTab === 'All' || updatedSession.status === activeTab || (activeTab === 'Completed' && updatedSession.status === 'Stopped')) {
          setPaginatedSessions(prev => [updatedSession, ...prev.filter(s => !matchSession(s, updatedSession))]);
        } else {
          setPaginatedSessions(prev => prev.filter(s => !matchSession(s, updatedSession)));
        }
      }
    }
  });

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const currentList = prev[category] || [];
      const updated = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [category]: updated };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ station: [], chargePoint: [], timeRange: [] });
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);

  return {
    activeTab,
    searchTerm,
    setSearchTerm,
    currentPage,
    loading,
    totalItems,
    totalPages,
    filteredSessions: paginatedSessions,
    paginatedSessions,
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
    activeFiltersCount,
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
