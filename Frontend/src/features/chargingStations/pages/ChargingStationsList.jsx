import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Activity,
  Tag,
  Hash,
  Settings2,
  BatteryCharging,
  DollarSign,
  Zap,
  Loader2,
  MapPin,
  X,
  Info,
  Check,
  ChevronDown,
  ChevronRight,
  Building2,
  Navigation,
  Calendar,
  Globe
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import DeleteModal from '../../../components/ui/DeleteModal';
import TableActions from '../../../components/ui/TableActions';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';

import { getChargingStations, getFilterOptions, deleteChargingStation, exportStations } from '../api/chargingStationService';
import { useTableData } from '../../../hooks/useTableData';
import { useToast } from '../../../context/ToastContext';
import FilterSection from '../../../components/ui/FilterSection';
import ChargePointsCell from '../components/ChargePointsCell';


// Charging Stations List & Management Table View

export default function ChargingStationsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // --------------------------------------------------------------------
  // 1. Modal & Deletion State
  // --------------------------------------------------------------------
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick-view modal state for inspecting station details
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [stationToView, setStationToView] = useState(null);

  // --------------------------------------------------------------------
  // 2. Filter & Multi-Select State
  // --------------------------------------------------------------------
  const [filters, setFilters] = useState({ mobilityType: [], stationType: [], stage: [] });
  const [filterOptions, setFilterOptions] = useState({ mobilityType: [], stationType: [], stage: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = React.useRef(null);

  // --------------------------------------------------------------------
  // 3. Lifecycle: Load Filter Options & Setup Listeners
  // --------------------------------------------------------------------
  // Fetch dynamic filter options (mobility types, station types, stages) from backend
  useEffect(() => {
    getFilterOptions()
      .then((data) => {
        if (data) {
          setFilterOptions({
            mobilityType: data.mobilityType || [],
            stationType: data.stationType || [],
            stage: data.stage || []
          });
        }
      })
      .catch((err) => console.error('Failed to load station filter options:', err));
  }, []);

  // Handle outside-clicks to automatically close the filter dropdown drawer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle selection for a specific filter category
  const handleFilterToggle = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      const exists = current.includes(value);
      const updated = exists ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [category]: updated };
    });
    setCurrentPage(1);
  };

  // Compute total active filters count for badge display
  const activeFilterCount = Object.values(filters).reduce((acc, arr) => acc + (arr?.length || 0), 0);

  // --------------------------------------------------------------------
  // 4. Server-Side Paginated Table Data Hook
  // --------------------------------------------------------------------
  const {
    data: stations,
    setData: setStations,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    reload: reloadData,
  } = useTableData((page, limit, search) => getChargingStations(page, limit, search, filters), [filters]);

  // Synchronize URL search parameter with search state
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams, setSearchTerm]);

  // Handle debounced or typed search input changes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // --------------------------------------------------------------------
  // 5. User Actions (Delete, Edit, Export)
  // --------------------------------------------------------------------
  // Open delete confirmation modal
  const handleDeleteClick = (e, cs) => {
    e.stopPropagation();
    setStationToDelete(cs);
    setDeleteModalOpen(true);
  };

  // Confirm and execute station deletion via REST API
  const confirmDelete = async () => {
    if (!stationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChargingStation(stationToDelete.id);
      await reloadData();
      setDeleteModalOpen(false);
      setStationToDelete(null);
      toast.success("Charging station deleted successfully", { code: 200 });
    } catch (error) {
      console.error('Failed to delete charging station:', error);
      toast.error("Failed to delete charging station", { code: 500 });
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigate to edit station form with station state
  const handleEditClick = (e, cs) => {
    e.stopPropagation();
    navigate(`/charging-stations/edit/${cs.id}`, { state: { station: cs } });
  };

  // Trigger backend CSV export download
  const handleExportCSV = async () => {
    try {
      await exportStations(searchTerm);
      toast.success("Charging station CSV export downloaded from backend server.", {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export charging station records", {
        title: err.title || "Export Error",
        code: err.code || 500
      });
    }
  };

  // --------------------------------------------------------------------
  // 6. Main UI Render
  // --------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-3 max-w-[1400px] w-full mx-auto pb-6">
      {/* Top Header Bar: Title, Subtitle, Export, Filter, & Add Station */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Charging Stations
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">Manage and monitor all your physical station locations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export to CSV Button */}
          <PermissionGuard permission={PERMISSIONS.STATION_EXPORT}>
            <ExportButton
              onExport={handleExportCSV}
              label="Export"
            />
          </PermissionGuard>

          {/* Filter Popover Trigger & Dropdown Menu */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer ${activeFilterCount > 0 ? 'border-[#1EB8D4] text-[#148296] bg-[#1EB8D4]/10' : ''
                }`}
            >
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="leading-none">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-[#1EB8D4] text-slate-950 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Drawer Panel */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-stone-200 shadow-2xl rounded-2xl p-4 z-30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-xs font-black text-stone-900 uppercase tracking-wider">Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setFilters({ mobilityType: [], stationType: [], stage: [] });
                        setCurrentPage(1);
                      }}
                      className="text-[11px] font-bold text-[#1EB8D4] hover:text-[#148296] cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Mobility Type Filter Section */}
                <FilterSection
                  title="Mobility Type"
                  options={filterOptions.mobilityType}
                  selected={filters.mobilityType}
                  onChange={(val) => handleFilterToggle('mobilityType', val)}
                />

                {/* Station Type Filter Section */}
                <FilterSection
                  title="Station Type"
                  options={filterOptions.stationType}
                  selected={filters.stationType}
                  onChange={(val) => handleFilterToggle('stationType', val)}
                />

                {/* Deployment Stage Filter Section */}
                <FilterSection
                  title="Stage"
                  options={filterOptions.stage}
                  selected={filters.stage}
                  onChange={(val) => handleFilterToggle('stage', val)}
                />
              </div>
            )}
          </div>

          {/* Add New Station Primary Button */}
          <PermissionGuard permission={PERMISSIONS.STATION_CREATE}>
            <PrimaryButton
              onClick={() => navigate('/charging-stations/new')}
              label="Add Station"
            />
          </PermissionGuard>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Search & Total Record Counter Bar */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalItems}</span> total stations
          </div>

          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            placeholder="Search stations by name, location..."
          />
        </div>

        {/* Scrollable Table View */}
        <div className="overflow-x-auto scrollbar-none flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200">
              <tr className="bg-[#F8FAFC]">
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Code</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Points</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Total Capacity</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Station Type</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Mobility Type</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On <span className="text-stone-400 font-bold ml-0.5">↓</span></div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Latitude</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Longitude</div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {/* Loading State */}
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-24 text-center">
                    <div className="text-[#1EB8D4] flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-bold text-stone-500">Loading charging stations...</p>
                    </div>
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan="10" className="px-5 py-24 text-center">
                    <div className="text-stone-500 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/40 border border-white/50 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-stone-400" />
                      </div>
                      <p className="text-sm font-bold">No charging stations found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Populated Station Data Rows */
                stations.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      // Navigate to station details page using authoritative station ID
                      navigate(`/charging-stations/${row.id}`, { state: { station: row } });
                    }}
                    className="group hover:bg-[#F8FAFF] transition-colors duration-150 cursor-pointer"
                  >
                    {/* Action Buttons (Edit / Delete) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <TableActions
                        onEdit={(e) => handleEditClick(e, row)}
                        onDelete={(e) => handleDeleteClick(e, row)}
                        editPermission={PERMISSIONS.STATION_UPDATE}
                        deletePermission={PERMISSIONS.STATION_DELETE}
                      />
                    </td>
                    {/* Station Name */}
                    <td className="px-4 py-3">
                      <span className="text-stone-900 font-semibold text-[13px] cursor-pointer truncate max-w-[200px] inline-block transition-colors duration-200 group-hover:text-cyan-600">
                        {row.name}
                      </span>
                    </td>
                    {/* Station Code */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-rose-500 text-[12px] font-bold font-mono">{row.code}</span>
                    </td>
                    {/* Linked Charge Points Badge Cell */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ChargePointsCell station={row} navigate={navigate} />
                    </td>
                    {/* Total Power Capacity */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-700">
                      {row.totalCapacity || '-'}
                    </td>
                    {/* Station Category / Type */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-600">
                      {row.stationType || '-'}
                    </td>
                    {/* Mobility Classification */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-600">
                      {row.mobilityType || '-'}
                    </td>
                    {/* Created Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                      {row.createdOn || '-'}
                    </td>
                    {/* GPS Latitude */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600 text-[11px]">
                      {row.latitude || '-'}
                    </td>
                    {/* GPS Longitude */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600 text-[11px]">
                      {row.longitude || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls */}
        {!loading && stations.length > 0 && (
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

      {/* Quick-View Station Details Modal */}
      {viewModalOpen && stationToView && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1EB8D4]/10 border border-[#1EB8D4]/20 flex items-center justify-center text-[#148296]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-800">{stationToView.name}</h2>
                  <span className="text-xs font-bold text-[#148296] font-mono">{stationToView.code}</span>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 col-span-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Associated Charge Point</span>
                {stationToView.chargePointId ? (
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      navigate(`/charge-points/${stationToView.chargePointId}`);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-50 hover:bg-emerald-600 text-cyan-700 hover:text-white border border-cyan-200/80 rounded-xl font-bold text-xs transition-colors duration-200 cursor-pointer group mt-1"
                  >
                    <Zap className="w-4 h-4 text-cyan-500 group-hover:text-white transition-colors" />
                    <span>{stationToView.chargePointName || stationToView.chargePointId}</span>
                  </button>
                ) : (
                  <span className="text-stone-400 font-normal text-xs italic block mt-1">No charge points linked</span>
                )}
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Total Sessions</span>
                <span className="text-base font-black text-stone-800">{stationToView.totalSessions?.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Revenue Generated</span>
                <span className="text-base font-black text-stone-800">₹{stationToView.revenueGenerated?.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Energy Delivered</span>
                <span className="text-base font-black text-stone-800">{stationToView.energyDelivered?.toLocaleString()} kWh</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 mt-2 border-t border-stone-100">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Close Station Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={stationToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}

