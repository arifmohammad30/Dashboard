import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to manage server-side table data, search debouncing, pagination, and error states.
 */
export function useTableData(
  fetchCallback,
  dependencies = [],
  initialSearch = '',
  options = {}
) {
  const {
    debounceMs = 300,
    itemsPerPage: defaultItemsPerPage = 10,
    autoFetch = true
  } = options;

  // Ensure safe dependencies array
  const safeDeps = Array.isArray(dependencies) ? dependencies : [];

  // Table & pagination states
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Keep reference to latest fetch callback to prevent unnecessary recreations
  const fetchCallbackRef = useRef(fetchCallback);
  useEffect(() => {
    fetchCallbackRef.current = fetchCallback;
  }, [fetchCallback]);

  // Debounce search input and reset to page 1 on new search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Main function to fetch table data
  const loadData = useCallback(
    async (customPage = null, customSearch = null) => {
      const pageToFetch = customPage !== null ? customPage : currentPage;
      const searchToFetch = customSearch !== null ? customSearch : debouncedSearch;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchCallbackRef.current(
          pageToFetch,
          itemsPerPage,
          searchToFetch
        );

        let parsedData = [];
        let parsedTotal = 0;
        let parsedTotalPages = 1;

        // Handle array response
        if (Array.isArray(response)) {
          parsedData = response;
          parsedTotal = response.length;
          parsedTotalPages = Math.max(1, Math.ceil(response.length / itemsPerPage));
        }
        // Handle object response { data, total, totalPages }
        else if (response && typeof response === 'object') {
          parsedData = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.items)
              ? response.items
              : [];

          parsedTotal =
            typeof response.total === 'number'
              ? response.total
              : typeof response.count === 'number'
                ? response.count
                : parsedData.length;

          parsedTotalPages =
            typeof response.totalPages === 'number'
              ? response.totalPages
              : Math.max(1, Math.ceil(parsedTotal / itemsPerPage));
        }

        setData(parsedData);
        setTotalItems(parsedTotal);
        setTotalPages(parsedTotalPages);
      } catch (err) {
        console.error('[useTableData] API Error:', err);

        setError({
          message: err.message,
          code: err.code || 500,
          title: err.title || 'Error',
          isNetworkError: Boolean(err.isNetworkError),
          raw: err
        });

        setData([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage, debouncedSearch, ...safeDeps]
  );

  // Auto-fetch data on initial mount and whenever dependencies change
  useEffect(() => {
    if (autoFetch) {
      loadData();
    }
  }, [loadData, autoFetch]);

  return {
    // Data & loading states
    data,
    setData,
    loading,

    // Error handling
    error,
    isError: Boolean(error),
    clearError: () => setError(null),

    // Search
    searchTerm,
    setSearchTerm,
    debouncedSearch,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,

    // Actions
    reload: loadData,
    retry: loadData
  };
}

export default useTableData;