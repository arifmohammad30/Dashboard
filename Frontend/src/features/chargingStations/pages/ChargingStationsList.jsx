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
  Globe,
  SearchX
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import DeleteModal from '../../../components/ui/DeleteModal';
import TableActions from '../../../components/ui/TableActions';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';

import {
  getChargingStations,
  getFilterOptions,
  deleteChargingStation,
  exportStations
} from '../api/chargingStationService';

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


  // 1. Modal & Deletion State

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // 2. Filter & Multi-Select State

  const [filters, setFilters] = useState({
    mobilityType: [],
    stationType: [],
    stage: []
  });

  const [filterOptions, setFilterOptions] = useState({
    mobilityType: [],
    stationType: [],
    stage: []
  });

  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [filterOptionsError, setFilterOptionsError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = React.useRef(null);


  // 3. Lifecycle: Load Filter Options & Setup Listeners

  // Fetch dynamic filter options (mobility types, station types, stages)
  // from backend with proper error handling
  const loadFilterOptions = async () => {
    setFilterOptionsLoading(true);
    setFilterOptionsError(null);

    try {
      const data = await getFilterOptions();

      setFilterOptions({
        mobilityType: data?.mobilityType || [],
        stationType: data?.stationType || [],
        stage: data?.stage || []
      });
    } catch (err) {
      console.error('Failed to load station filter options:', err);

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

      const updated = exists
        ? current.filter(v => v !== value)
        : [...current, value];

      return {
        ...prev,
        [category]: updated
      };
    });

    setCurrentPage(1);
  };

  // Compute total active filters count for badge display
  const activeFilterCount = Object.values(filters).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );


  // 4. Server-Side Paginated Table Data Hook

  const {
    data: stations,
    setData: setStations,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    reload: reloadData,
  } = useTableData(
    (page, limit, search) =>
      getChargingStations(page, limit, search, filters),
    [filters]
  );


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


  // 5. User Actions (Delete, Edit, Export)

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

      toast.success("Charging station deleted successfully", {
        code: 200
      });
    } catch (error) {
      console.error('Failed to delete charging station:', error);

      toast.error("Failed to delete charging station", {
        code: 500
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigate to edit station form with station state
  const handleEditClick = (e, cs) => {
    e.stopPropagation();

    navigate(`/charging-stations/edit/${cs.id}`, {
      state: {
        station: cs
      }
    });
  };

  // Trigger backend CSV export download
  const handleExportCSV = async () => {
    try {
      await exportStations(searchTerm);

      toast.success(
        "Charging station CSV export downloaded from backend server.",
        {
          title: 'Backend Export Complete',
          code: 200
        }
      );
    } catch (err) {
      console.error("Export error:", err);

      toast.error(
        err.message || "Failed to export charging station records",
        {
          title: err.title || "Export Error",
          code: err.code || 500
        }
      );
    }
  };


  // 6. Main UI Render

  return (
    <div className="flex flex-col gap-3 max-w-[1400px] w-full mx-auto pb-6">

      {/* Top Header Bar: Title, Subtitle, Export, Filter, & Add Station */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Charging Stations
          </h1>

          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Manage and monitor all your physical station locations.
          </p>
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
              className={`inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer ${activeFilterCount > 0
                  ? 'border-[#4DA944] text-[#30702a] bg-[#4DA944]/10'
                  : ''
                }`}
            >
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />

              <span className="leading-none">
                Filter
              </span>

              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-[#4DA944] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>


            {/* Filter Dropdown Drawer Panel */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-stone-200 shadow-2xl rounded-2xl p-4 z-30 space-y-4 animate-in fade-in zoom-in-95 duration-150">

                <div className="flex items-center justify-between border-b border-stone-100 pb-2">

                  <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Filters
                  </span>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setFilters({
                          mobilityType: [],
                          stationType: [],
                          stage: []
                        });

                        setCurrentPage(1);
                      }}
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

                  <>

                    {/* Mobility Type Filter Section */}
                    <FilterSection
                      title="Mobility Type"
                      options={filterOptions.mobilityType}
                      selected={filters.mobilityType}
                      onChange={(val) =>
                        handleFilterToggle('mobilityType', val)
                      }
                    />


                    {/* Station Type Filter Section */}
                    <FilterSection
                      title="Station Type"
                      options={filterOptions.stationType}
                      selected={filters.stationType}
                      onChange={(val) =>
                        handleFilterToggle('stationType', val)
                      }
                    />


                    {/* Deployment Stage Filter Section */}
                    <FilterSection
                      title="Stage"
                      options={filterOptions.stage}
                      selected={filters.stage}
                      onChange={(val) =>
                        handleFilterToggle('stage', val)
                      }
                    />

                  </>

                )}

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
            <span className="font-extrabold text-stone-900 text-xs">
              {totalItems}
            </span>

            total stations
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
                  <div className="flex items-center justify-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Actions
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Name
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Code
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Charge Points
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Total Capacity
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Station Type
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Mobility Type
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Created On

                    <span className="text-stone-400 font-bold ml-0.5">
                      ↓
                    </span>
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Latitude
                  </div>
                </th>

                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />
                    Longitude
                  </div>
                </th>

              </tr>

            </thead>


            {/* Table Body */}
            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">

              {/* Loading State */}
              {loading ? (

                <tr>
                  <td colSpan="10" className="px-5 py-24 text-center">

                    <div className="text-[#4DA944] flex flex-col items-center">

                      <Loader2 className="w-10 h-10 animate-spin mb-4" />

                      <p className="text-sm font-bold text-stone-500">
                        Loading charging stations...
                      </p>

                    </div>

                  </td>
                </tr>

              ) : error ? (

                /* API Error State */
                <tr>
                  <td colSpan="10" className="px-5 py-24 text-center">

                    <div className="flex flex-col items-center">

                      <div className="w-16 h-16 bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 rounded-full">
                        <X className="w-8 h-8 text-rose-500" />
                      </div>

                      <p className="text-sm font-bold text-stone-800">
                        {error.isNetworkError
                          ? 'Unable to connect to the server.'
                          : error.title || 'Failed to load charging stations.'}
                      </p>

                      <p className="text-xs text-stone-500 mt-1 max-w-md">
                        {error.message ||
                          'Something went wrong while loading charging stations.'}
                      </p>

                      <button
                        type="button"
                        onClick={reloadData}
                        className="mt-4 text-xs font-bold text-[#4DA944] hover:text-[#30702a] cursor-pointer"
                      >
                        Retry
                      </button>

                    </div>

                  </td>
                </tr>

              ) : stations.length === 0 ? (

                /* Empty State */
                <tr>
                  <td colSpan="10" className="px-4 py-16 text-center text-stone-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 mb-1">
                            <SearchX className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-stone-800 text-sm">No Matching Charging Stations</span>
                          <p className="text-xs text-stone-500">
                            No charging stations found matching &ldquo;<span className="font-semibold text-stone-700">{searchTerm}</span>&rdquo;.
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
                            <MapPin className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-stone-800 text-sm">No Charging Stations Found</span>
                          <p className="text-xs text-stone-500">
                            There are currently no charging stations configured in the system.
                          </p>
                        </>
                      )}
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
                      navigate(`/charging-stations/${row.id}`, {
                        state: {
                          station: row
                        }
                      });
                    }}
                    className="group hover:bg-[#F8FAFF] transition-colors duration-150 cursor-pointer"
                  >

                    {/* Action Buttons (Edit / Delete) */}
                    <td
                      className="px-4 py-3 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableActions
                        onEdit={(e) => handleEditClick(e, row)}
                        onDelete={(e) => handleDeleteClick(e, row)}
                        editPermission={PERMISSIONS.STATION_UPDATE}
                        deletePermission={PERMISSIONS.STATION_DELETE}
                      />
                    </td>


                    {/* Station Name */}
                    <td className="px-4 py-3">
                      <span className="text-stone-900 font-semibold text-[13px] cursor-pointer truncate max-w-[200px] inline-block transition-colors duration-200 group-hover:text-emerald-600">
                        {row.name}
                      </span>
                    </td>


                    {/* Station Code */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-rose-500 text-[12px] font-bold font-mono">
                        {row.code}
                      </span>
                    </td>


                    {/* Linked Charge Points Badge Cell */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ChargePointsCell
                        station={row}
                        navigate={navigate}
                      />
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