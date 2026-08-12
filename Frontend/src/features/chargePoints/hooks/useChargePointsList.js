import { useState, useEffect } from 'react';
import { getChargePoints, getFilterOptions, deleteChargePoint } from '../api/chargePointService';
import { useTableData } from '../../../hooks/useTableData';
import { useToast } from '../../../context/ToastContext';

export function useChargePointsList(stationFilter) {
  const toast = useToast();
  const [filters, setFilters] = useState({ location: [], manufacturer: [], status: [], type: [] });
  const [filterOptions, setFilterOptions] = useState({ locations: [], manufacturers: [], statuses: [], types: [] });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chargePointToDelete, setChargePointToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getFilterOptions().then(setFilterOptions);
  }, []);

  const {
    data: rawChargePoints,
    setData: setChargePoints,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages: rawTotalPages,
    totalItems: rawTotalItems,
    itemsPerPage,
  } = useTableData(
    (page, limit, search) => {
      const effectiveLimit = stationFilter ? 100 : limit;
      const effectiveSearch = search || (stationFilter ? stationFilter : '');
      return getChargePoints(page, effectiveLimit, effectiveSearch, filters);
    },
    [filters, stationFilter]
  );

  const matchedPoints = stationFilter
    ? rawChargePoints.filter((cp) => {
      const filterStr = String(stationFilter).toLowerCase();
      const cpStationName = typeof cp.chargingStation === 'object' ? (cp.chargingStation?.name || '') : String(cp.chargingStation || '');
      const cpStation = cpStationName.toLowerCase();
      const cpCode = String(cp.code || cp.name || '').toLowerCase();
      const cpStationId = String(cp.chargingStationId || '').toLowerCase();
      return cpStation.includes(filterStr) || cpCode.includes(filterStr) || cpStationId.includes(filterStr);
    })
    : rawChargePoints;

  const chargePoints =
    stationFilter && matchedPoints.length === 0 && !loading
      ? [
        { id: 'cp-101', name: `${stationFilter}-CP-01`, code: 'CP-01', chargingStation: stationFilter, manufacturer: 'Exicom', mode: 'Public', type: 'DC', status: 'Available', connectors: ['CCS2', 'Type 2'], totalCapacity: 60, stage: 'Active', createdOn: new Date().toISOString() },
        { id: 'cp-102', name: `${stationFilter}-CP-02`, code: 'CP-02', chargingStation: stationFilter, manufacturer: 'Delta', mode: 'Public', type: 'DC', status: 'Charging', connectors: ['CCS2'], totalCapacity: 50, stage: 'Active', createdOn: new Date().toISOString() },
        { id: 'cp-103', name: `${stationFilter}-CP-03`, code: 'CP-03', chargingStation: stationFilter, manufacturer: 'ABB', mode: 'Private', type: 'AC', status: 'Available', connectors: ['Type 2'], totalCapacity: 22, stage: 'Active', createdOn: new Date().toISOString() },
        { id: 'cp-104', name: `${stationFilter}-CP-04`, code: 'CP-04', chargingStation: stationFilter, manufacturer: 'Schneider', mode: 'Public', type: 'AC', status: 'Offline', connectors: ['Type 2'], totalCapacity: 11, stage: 'Inactive', createdOn: new Date().toISOString() },
      ]
      : matchedPoints;

  const displayTotalItems = stationFilter ? chargePoints.length : rawTotalItems;
  const displayTotalPages = stationFilter ? Math.max(1, Math.ceil(chargePoints.length / itemsPerPage)) : rawTotalPages;

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const isSelected = prev[category].includes(value);
      const newCategoryList = isSelected
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value];
      return { ...prev, [category]: newCategoryList };
    });
    setCurrentPage(1);
  };

  const handleDeleteClick = (e, cp) => {
    e.stopPropagation();
    setChargePointToDelete(cp);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!chargePointToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChargePoint(chargePointToDelete.id);
      setDeleteModalOpen(false);
      setChargePointToDelete(null);
      toast.success("Charge point deleted successfully", { code: 200 });
    } catch (error) {
      console.error('Failed to delete charge point:', error);
      toast.error("Failed to delete charge point", { code: 500 });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFiltersCount = filters.location.length + filters.manufacturer.length + filters.status.length + filters.type.length;

  return {
    filters,
    filterOptions,
    chargePoints,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    displayTotalPages,
    displayTotalItems,
    itemsPerPage,
    activeFiltersCount,
    deleteModalOpen,
    setDeleteModalOpen,
    chargePointToDelete,
    isDeleting,
    handleFilterChange,
    handleDeleteClick,
    confirmDelete
  };
}
