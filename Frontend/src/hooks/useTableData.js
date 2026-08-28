import { useState, useEffect, useCallback, useRef } from 'react';

export function useTableData(fetchCallback, dependencies = [], initialSearch = '') {
  const safeDeps = Array.isArray(dependencies) ? dependencies : [];
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCallbackRef = useRef(fetchCallback);
  useEffect(() => {
    fetchCallbackRef.current = fetchCallback;
  }, [fetchCallback]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchCallbackRef.current(currentPage, itemsPerPage, debouncedSearch);
      setData(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Failed to load table data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, ...safeDeps]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    setData,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    reload: loadData,
  };
}
