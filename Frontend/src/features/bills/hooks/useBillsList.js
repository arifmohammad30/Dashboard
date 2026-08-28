import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBills, getBillById, exportBillsCsv } from '../api/billService';
import { useToast } from '../../../context/ToastContext';
import { useTableData } from '../../../hooks/useTableData';
import { useSocketEvents } from '../../../hooks/useSocketEvents';

export function useBillsList() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [timeRange, setTimeRange] = useState('All');
  const [filters, setFilters] = useState({ billStatus: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const {
    data: bills,
    setData: setBills,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: totalRecords,
    itemsPerPage: pageSize,
    reload
  } = useTableData(
    (page, limit, search) => getBills(page, limit, search || urlSearch, { ...filters, timeRange }),
    [filters, timeRange, urlSearch]
  );

  useEffect(() => {
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);


  useSocketEvents({
    "session:completed": async (payload) => {
      if (payload?.billId) {
        try {
          const newBill = await getBillById(payload.billId);
          if (newBill) {
            setBills(prev => [newBill, ...prev.filter(b => b.id !== newBill.id)]);
            toast.success(`New bill generated: ${newBill.billNumber}`, { code: 200 });
          }
        } catch (err) {
          console.error("Error fetching completed session bill:", err);
          reload();
        }
      }
    }
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (category, value) => {
    setFilters((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

  const handleDownloadCsv = async () => {
    try {
      await exportBillsCsv(searchTerm, filters);
      toast.success("Bills CSV downloaded successfully", { code: 200 });
    } catch (err) {
      toast.error("Failed to download bills", { code: 500 });
    }
  };

  return {
    bills,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    pageSize,
    timeRange,
    setTimeRange,
    filters,
    isFilterOpen,
    setIsFilterOpen,
    filterRef,
    activeFiltersCount,
    handleFilterChange,
    handleDownloadCsv
  };
}
