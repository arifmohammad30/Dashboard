import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Zap,
  Tag,
  Hash,
  MapPin,
  Factory,
  Activity,
  Settings2,
  QrCode,
  Shield,
  Cpu,
  Plug,
  Gauge,
  Clock,
  Calendar,
  CheckCircle2,
  Smartphone,
  SearchX
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import TableActions from '../../../components/ui/TableActions';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import DeleteModal from '../../../components/ui/DeleteModal';
import FilterSection from '../../../components/ui/FilterSection';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';

import { getChargePoints, getFilterOptions, deleteChargePoint, exportChargePoints } from '../api/chargePointService';
import { useTableData } from '../../../hooks/useTableData';
import { useToast } from '../../../context/ToastContext';
import { useSocketEvents } from '../../../hooks/useSocketEvents';
import ConnectorBadgesCell from '../components/ConnectorBadgesCell';
import { formatCreatedOn } from '../utils/formatters';

// Charge Points List View Component
export default function ChargePointsList({ chargingStationId, hideHeader = false }) {
  const navigate = useNavigate();
  const toast = useToast();

  // 1. Filter Drawer State
  const [filters, setFilters] = useState({ location: [], manufacturer: [], status: [], type: [] });
  const [filterOptions, setFilterOptions] = useState({ locations: [], manufacturers: [], statuses: [], types: [] });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [filterOptionsError, setFilterOptionsError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // 2. Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chargePointToDelete, setChargePointToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3. Lifecycle: Load Filter Options & Error Handling
  const loadFilterOptions = async () => {
    setFilterOptionsLoading(true);
    setFilterOptionsError(null);

    try {
      const data = await getFilterOptions();
      setFilterOptions({
        locations: data?.locations || [],
        manufacturers: data?.manufacturers || [],
        statuses: data?.statuses || [],
        types: data?.types || []
      });
    } catch (err) {
      console.error('Failed to load charge point filter options:', err);
      setFilterOptionsError({
        message: err.message || 'Failed to load filter options.'
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  // 4. Server-Side Paginated Table Data Hook
  const {
    data: chargePoints,
    setData: setChargePoints,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    reload: reloadData,
  } = useTableData(
    (page, limit, search) => {
      const activeFilters = { ...filters };
      if (chargingStationId) {
        activeFilters.chargingStationId = chargingStationId;
      }
      return getChargePoints(page, limit, search, activeFilters);
    },
    [filters, chargingStationId]
  );
 
   // Real-time WebSocket synchronization for charge point status and lifecycle events
   useSocketEvents({
     chargePointUpdated: (updatedCp) => {
       if (!updatedCp || !updatedCp.id) return;
       setChargePoints(prev =>
         prev.map(cp => (cp.id === updatedCp.id ? { ...cp, ...updatedCp } : cp))
       );
     },
     chargePointAdded: (newCp) => {
       if (!newCp) return;
       if (
         chargingStationId &&
         newCp.chargingStationId !== chargingStationId &&
         newCp.chargingStation?.id !== chargingStationId
       ) {
         return;
       }
       reloadData();
     },
     chargePointDeleted: (deletedId) => {
       if (!deletedId) return;
       setChargePoints(prev => prev.filter(cp => cp.id !== deletedId));
     }
   });

   // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle filter checkbox selection
  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const isSelected = prev[category]?.includes(value);
      const updatedList = isSelected
        ? prev[category].filter(item => item !== value)
        : [...(prev[category] || []), value];
      return { ...prev, [category]: updatedList };
    });
    setCurrentPage(1);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (e, cp) => {
    e.stopPropagation();
    setChargePointToDelete(cp);
    setDeleteModalOpen(true);
  };

  // Confirm and delete charge point via API
  const confirmDelete = async () => {
    if (!chargePointToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChargePoint(chargePointToDelete.id);
      await reloadData();
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

  // Count active filter selections for badge counter
  const activeFiltersCount = (filters.location?.length || 0) +
    (filters.manufacturer?.length || 0) +
    (filters.status?.length || 0) +
    (filters.type?.length || 0);

  // Reset all active filter selections
  const handleResetFilters = () => {
    setFilters({ location: [], manufacturer: [], status: [], type: [] });
    setCurrentPage(1);
  };

  // Search input handler
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Navigate to Edit page
  const handleEditClick = (e, cp) => {
    e.stopPropagation();
    console.log('%c⚡ [Edit Clicked] Fetching and editing charge point:', 'color: #F59E0B; font-weight: bold; font-size: 13px;', cp);
    navigate(`/charge-points/edit/${cp.id}`);
  };

  // Export charge points to CSV file
  const handleExportCSV = async () => {
    try {
      await exportChargePoints(searchTerm, filters);
      toast.success("Charge point CSV export downloaded", {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export charge point records", {
        title: err.title || "Export Error",
        code: err.code || 500
      });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1400px] w-full mx-auto pb-6">
      {/* Top Header: Title, Export, Filter, & Add Charge Point */}
      <div className={`flex flex-col md:flex-row md:items-center ${hideHeader ? 'justify-end' : 'justify-between'} gap-3 px-1 mt-0`}>
        {!hideHeader && (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Charge Points
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">Manage and monitor your charging infrastructure.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* CSV Export Button */}
          <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_EXPORT}>
            <ExportButton
              onExport={handleExportCSV}
              label="Export"
            />
          </PermissionGuard>

          {/* Filter Dropdown Button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer">
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="leading-none">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-[#4DA944] text-white rounded-full text-[10px] ml-1 font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Panel */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 shadow-xl rounded-2xl z-50 p-6 max-h-[70vh] overflow-y-auto">
                {/* Header & Reset Action */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <h3 className="font-extrabold text-stone-800 flex items-center gap-2 text-xs">
                    <Filter className="w-4 h-4 text-[#4DA944]" />
                    Filter Charge Points
                  </h3>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-[#4DA944] hover:text-[#30702a] cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {filterOptionsLoading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#4DA944]" />
                    <p className="text-xs font-medium text-stone-500">
                      Loading filter options...
                    </p>
                  </div>
                ) : filterOptionsError ? (
                  <div className="py-6 text-center">
                    <p className="text-xs font-semibold text-rose-600 mb-3">
                      {filterOptionsError.message}
                    </p>
                    <button
                      type="button"
                      onClick={loadFilterOptions}
                      className="text-xs font-bold text-[#4DA944] hover:text-[#30702a] cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <FilterSection
                      title="Status"
                      options={filterOptions.statuses}
                      selected={filters.status}
                      onChange={(val) => handleFilterChange('status', val)}
                    />
                    <FilterSection
                      title="Type"
                      options={filterOptions.types}
                      selected={filters.type}
                      onChange={(val) => handleFilterChange('type', val)}
                    />
                    <FilterSection
                      title="Manufacturer"
                      options={filterOptions.manufacturers}
                      selected={filters.manufacturer}
                      onChange={(val) => handleFilterChange('manufacturer', val)}
                    />
                    <FilterSection
                      title="Location"
                      options={filterOptions.locations}
                      selected={filters.location}
                      onChange={(val) => handleFilterChange('location', val)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Charge Point Button */}
          <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_CREATE}>
            <PrimaryButton
              onClick={() => navigate('/charge-points/new')}
              label="Add Charge Point"
            />
          </PermissionGuard>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Total Counter & Search Bar */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalItems}</span> total charge points
          </div>

          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            placeholder="Search points by name, location..."
          />
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto scrollbar-none flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200">
              <tr className="bg-[#F8FAFC]">
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Code</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Station</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Last Active</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stage</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Type</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector (Connector Id)</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Total Capacity</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Mode</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Factory className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> OEM</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Firmware Version</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> CP ID</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Third Party CP ID</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> QR Code ID</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Tariff Profile</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Mobility Type</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On</div>
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="19" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#4DA944] animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading charge points...</p>
                    </div>
                  </td>
                </tr>
              ) : chargePoints.length === 0 ? (
                <tr>
                  <td colSpan="19" className="px-4 py-16 text-center text-stone-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 mb-1">
                            <SearchX className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-stone-800 text-sm">No Matching Charge Points</span>
                          <p className="text-xs text-stone-500">
                            No charge points found matching &ldquo;<span className="font-semibold text-stone-700">{searchTerm}</span>&rdquo;.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setCurrentPage(1);
                            }}
                            className="mt-2 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Clear Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-emerald-50 text-[#4DA944] rounded-2xl mb-1 border border-emerald-200/80">
                            <Zap className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-stone-800 text-sm">No Charge Points Found</span>
                          <p className="text-xs text-stone-500">
                            There are currently no charge points configured in the system.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                chargePoints.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/charge-points/${row.id}`, { state: { chargePoint: row } })}
                    className="group hover:bg-[#F8FAFF] transition-colors duration-150 cursor-pointer"
                  >
                    {/* Actions Column (Edit / Delete) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <TableActions
                        onEdit={(e) => handleEditClick(e, row)}
                        onDelete={(e) => handleDeleteClick(e, row)}
                        editPermission={PERMISSIONS.CHARGE_POINT_UPDATE}
                        deletePermission={PERMISSIONS.CHARGE_POINT_DELETE}
                        showMore={true}
                      />
                    </td>

                    {/* Charge Point Name */}
                    <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/charge-points/${row.id}`, { state: { chargePoint: row } });
                    }}>
                      <span className={`text-stone-900 font-semibold text-[13px] transition-colors duration-200 ${(row.status === 'Available' || row.status === 'Charging' || (row.status !== 'Faulted' && row.stage === 'Active'))
                        ? 'group-hover:text-emerald-600'
                        : 'group-hover:text-rose-600'
                        }`}>
                        {row.name}
                      </span>
                    </td>

                    {/* Charge Point Code */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-rose-500 text-[12px] font-bold font-mono">{row.code}</span>
                    </td>

                    {/* Station Name & Link */}
                    <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      const stationId = row.chargingStation?.id;
                      if (stationId) {
                        navigate(`/charging-stations/${stationId}`, { state: { station: row.chargingStation } });
                      }
                    }}>
                      <span className="text-sky-600 font-bold text-[13px] hover:text-sky-800 transition-colors duration-200 cursor-pointer max-w-[250px] truncate block">
                        {row.chargingStation?.name || '-'}
                      </span>
                    </td>

                    {/* Live Status Badge */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      {(row.stage === 'Inactive' || row.stage === 'Offline' || row.status === 'Faulted') ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-red-50/90 text-red-700 border border-red-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          Faulted
                        </span>
                      ) : row.status === 'Charging' ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-blue-50/90 text-blue-700 border border-blue-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                          Charging
                        </span>
                      ) : row.status === 'Preparing' ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-amber-50/90 text-amber-800 border border-amber-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          Preparing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-emerald-50/90 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          Available
                        </span>
                      )}
                    </td>

                    {/* Last Active Timestamp */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-500 font-medium text-[12px]">{row.lastActive || '-'}</span>
                    </td>

                    {/* Operational Stage */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${row.stage === 'Active' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
                        row.stage === 'Inactive' ? 'bg-stone-100 text-stone-600 border-stone-200/80' :
                          'bg-amber-50/90 text-amber-800 border-amber-200/60'
                        }`}>
                        {row.stage || 'Active'}
                      </span>
                    </td>

                    {/* Hardware Type */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80 uppercase tracking-wider">
                        {row.type || 'NA'}
                      </span>
                    </td>

                    {/* Connectors Badges */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <ConnectorBadgesCell connectors={row.connectors} />
                    </td>

                    {/* Total Capacity (kW) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px]">{row.totalCapacity || '-'}</span>
                    </td>

                    {/* Access Mode */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px]">{row.mode || '-'}</span>
                    </td>

                    {/* OEM Manufacturer */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-700 font-bold text-[13px]">{row.manufacturer || row.oem || '-'}</span>
                    </td>

                    {/* Firmware Version */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px] font-mono">{row.firmwareVersion || '-'}</span>
                    </td>

                    {/* CP ID */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-[#30702a] text-[13px] font-bold font-mono">{row.code || row.cpId || '-'}</span>
                    </td>

                    {/* Third Party CP ID */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-500 font-mono text-[13px]">{row.thirdPartyCpId || '-'}</span>
                    </td>

                    {/* QR Code ID */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 text-[13px] font-medium font-mono">{row.qrCodeId || '-'}</span>
                    </td>

                    {/* Tariff Profile & Link */}
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      const tariffName = row.tariff?.name || '';
                      if (tariffName && tariffName !== '-') {
                        navigate(`/tariffs?search=${encodeURIComponent(tariffName)}`);
                      }
                    }}>
                      <span className="text-slate-600 hover:text-sky-600 font-semibold text-[13px] transition-colors duration-150 cursor-pointer inline-block max-w-[200px] truncate" title="View Tariff Record">
                        {row.tariff?.name || '-'}
                      </span>
                    </td>

                    {/* Mobility Type */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[12px]">{row.mobilityType || '-'}</span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3 text-center rounded-r-xl whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[12px]">{formatCreatedOn(row.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        {chargePoints.length > 0 && (
          <div className="border-t border-white/40 bg-white/20 pt-2 pb-4 rounded-b-[32px]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={chargePointToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
