import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import { useTableData } from '../../../hooks/useTableData';
import { getSessionHistory } from '../api/sessionService';

// Custom hook managing Session History audit log state, filters, pagination, and real-time socket events
export function useSessionHistory() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  // Active status tab: 'All', 'Completed', 'Failed'
  const [activeTab, setActiveTab] = useState('All');
  const [filters, setFilters] = useState({ station: [], chargePoint: [], timeRange: [] });

  // Server-side paginated table state managed by useTableData
  const {
    data: paginatedSessions,
    loading,
    error,
    isError,
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

  // Sync URL search query param if provided
  useEffect(() => {
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  // Real-time socket events: Trigger server re-fetch so pagination, total counts, and filters stay consistent
  useSocketEvents({
    // When a live session stops and moves into history
    "session:stopped": (stoppedSession) => {
      if (stoppedSession) {
        reloadData();
      }
    },
    // When a historical session is updated (e.g. billing generated, status finalized)
    "session:updated": (updatedSession) => {
      if (updatedSession?.status && updatedSession.status !== 'Ongoing') {
        reloadData();
      }
    }
  });

  // Handle category filter toggling (multi-select)
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

  // Clear all multi-select filters
  const clearFilters = () => {
    setFilters({ station: [], chargePoint: [], timeRange: [] });
    setCurrentPage(1);
  };

  // Count active filter selections
  const activeFiltersCount = Object.values(filters).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);

  return {
    activeTab,
    searchTerm,
    setSearchTerm,
    currentPage,
    loading,
    error,
    isError,
    reload: reloadData,
    totalItems,
    totalPages,
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
