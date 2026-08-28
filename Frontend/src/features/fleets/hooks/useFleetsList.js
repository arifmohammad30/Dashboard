import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFleets, deleteFleet, exportFleets } from '../api/fleetService';
import { useToast } from '../../../context/ToastContext';
import { useTableData } from '../../../hooks/useTableData';

export function useFleetsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [filters, setFilters] = useState({ status: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fleetToDelete, setFleetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: fleets,
    setData: setFleets,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: totalRecords,
    itemsPerPage: pageSize,
    reload: loadData
  } = useTableData(
    (page, limit, search) => getFleets(page, limit, search, filters),
    [filters],
    urlSearch
  );

  useEffect(() => {
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

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

  const handleDeleteClick = (e, fleet) => {
    e.stopPropagation();
    setFleetToDelete(fleet);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fleetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFleet(fleetToDelete.id);
      setFleets((prev) => prev.filter((item) => item.id !== fleetToDelete.id));
      setDeleteModalOpen(false);
      setFleetToDelete(null);
      toast.success("Fleet deleted successfully", { code: 200 });
    } catch (err) {
      console.error("Failed to delete fleet:", err);
      toast.error(err.message || "Failed to delete fleet", { code: 500 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportFleets(searchTerm, filters);
      toast.success("Fleets CSV export downloaded from backend server.", {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export fleet records", {
        title: err.title || "Export Error",
        code: err.code || 500
      });
    }
  };

  return {
    navigate,
    fleets,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    pageSize,
    filters,
    isFilterOpen,
    setIsFilterOpen,
    filterRef,
    activeFiltersCount,
    handleFilterChange,
    deleteModalOpen,
    setDeleteModalOpen,
    fleetToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExportCSV
  };
}
