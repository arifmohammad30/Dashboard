import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Loader2,
  Settings2,
  Edit,
  Tag,
  Zap,
  CreditCard,
  IndianRupee,
  Clock,
  Layers,
  Calendar,
  Percent,
  X,
  SearchX
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import FilterSection from '../../../components/ui/FilterSection';
import TableActions from '../../../components/ui/TableActions';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import DeleteModal from '../../../components/ui/DeleteModal';
import { PERMISSIONS } from '../../../config/permissions';

import { getTariffs, getFilterOptions, deleteTariff, exportTariffs } from '../api/tariffService';

import { useToast } from '../../../context/ToastContext';
import { useTableData } from '../../../hooks/useTableData';

/**
 * Tariffs List & Management View Component
 * Displays a paginated, filterable table of all EV charging tariff profiles.
 * Supports searching, multi-select filtering, viewing details, and navigation to the tariff editor.
 */
export default function TariffsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('name') || '';

  // 1. Filter Drawer State
  const [filters, setFilters] = useState({ type: [], gstPercentage: [] });
  const [filterOptions, setFilterOptions] = useState({ types: [], gstPercentages: [] });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [filterOptionsError, setFilterOptionsError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Load dynamic filter options with robust error handling
  const loadFilterOptions = async () => {
    setFilterOptionsLoading(true);
    setFilterOptionsError(null);
    try {
      const data = await getFilterOptions();
      if (data) {
        setFilterOptions({
          types: data.types || [],
          gstPercentages: data.gstPercentages || []
        });
      }
    } catch (err) {
      console.error('Failed to load tariff filter options:', err);
      setFilterOptionsError(err);
      toast.error(err.message || 'Failed to load filter options', {
        title: err.title || 'Filter Error',
        code: err.code || 500
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  // 2. View & Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [tariffToView, setTariffToView] = useState(null);

  // 3. Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tariffToDelete, setTariffToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3. Server-Side Paginated Table Data Hook
  const {
    data: tariffs,
    setData: setTariffs,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: totalRecords,
    itemsPerPage: pageSize,
    reload: loadData,
  } = useTableData(
    (page, limit, search) => getTariffs(page, limit, search, filters),
    [filters]
  );

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch, setSearchTerm]);

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

  const handleExportCSV = async () => {
    try {
      await exportTariffs(searchTerm, filters);
      toast.success("Tariff CSV export downloaded from backend server.", {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export tariff structures", {
        title: err.title || "Export Error",
        code: err.code || 500
      });
    }
  };

  // 4. Delete Handlers
  const handleDeleteClick = (e, tariff) => {
    e.stopPropagation();
    setTariffToDelete(tariff);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tariffToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTariff(tariffToDelete.id);
      await loadData();
      setDeleteModalOpen(false);
      setTariffToDelete(null);
      toast.success('Tariff plan deleted successfully', {
        title: 'Tariff Deleted',
        code: 200
      });
    } catch (error) {
      console.error('Failed to delete tariff:', error);
      toast.error(error.message || 'Failed to delete tariff plan', {
        title: error.title || 'Delete Error',
        code: error.code || 500
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1700px] w-full mx-auto pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            All Tariffs
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Configure, manage, and monitor your charging fee structures & rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PermissionGuard permission={PERMISSIONS.TARIFF_EXPORT}>
            <ExportButton
              onExport={handleExportCSV}
              label="Export"
            />
          </PermissionGuard>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer"
            >
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="leading-none">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-[#4DA944] text-white rounded-full text-[10px] ml-1 font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 shadow-xl rounded-2xl z-50 p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                  <h3 className="font-extrabold text-stone-800 flex items-center gap-2 text-xs">
                    <Filter className="w-4 h-4 text-violet-500" />
                    Refine Tariffs
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setFilters({ type: [], gstPercentage: [] })}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {filterOptionsLoading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#4DA944]" />
                    <p className="text-xs font-medium text-stone-500">Loading filter options...</p>
                  </div>
                ) : filterOptionsError ? (
                  <div className="py-6 text-center">
                    <p className="text-xs font-semibold text-rose-600 mb-3">
                      {filterOptionsError.message || 'Failed to load filter options'}
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
                      title="Tariff Type"
                      options={filterOptions.types}
                      selected={filters.type}
                      onChange={(val) => handleFilterChange('type', val)}
                    />
                    <FilterSection
                      title="GST Percentage"
                      options={filterOptions.gstPercentages}
                      selected={filters.gstPercentage}
                      onChange={(val) => handleFilterChange('gstPercentage', val)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <PermissionGuard permission={PERMISSIONS.TARIFF_CREATE}>
            <PrimaryButton
              onClick={() => navigate('/tariffs/new')}
              label="Add New Tariff"
            />
          </PermissionGuard>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalRecords}</span> total tariffs
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search tariffs by name..."
          />
        </div>

        <div className="overflow-x-auto scrollbar-none flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap rounded-l-xl">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Tariff</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Type</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Energy Rate</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> GST</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Pricing</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap rounded-r-xl">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Updated</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#4DA944] animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading tariffs...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                /* API Error State */
                <tr>
                  <td colSpan="8" className="px-5 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 rounded-full">
                        <X className="w-8 h-8 text-rose-500" />
                      </div>
                      <p className="text-sm font-bold text-stone-800">
                        {error.isNetworkError
                          ? 'Unable to connect to the server.'
                          : error.title || 'Failed to load tariffs.'}
                      </p>
                      <p className="text-xs text-stone-500 mt-1 max-w-md">
                        {error.message || 'Something went wrong while loading tariff records.'}
                      </p>
                      <button
                        type="button"
                        onClick={loadData}
                        className="mt-4 text-xs font-bold text-[#4DA944] hover:text-[#30702a] cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : tariffs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-16 text-center text-stone-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 mb-1">
                            <SearchX className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-stone-800 text-sm">No Matching Tariffs</span>
                          <p className="text-xs text-stone-500">
                            No tariffs found matching &ldquo;<span className="font-semibold text-stone-700">{searchTerm}</span>&rdquo;.
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
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-stone-800 text-sm">No Tariffs Found</span>
                          <p className="text-xs text-stone-500">
                            There are currently no tariff plans or pricing structures configured.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tariffs.map((t) => {
                  const status = t.status || 'Active';
                  const isActive = status === 'Active';

                  const typeClass = t.type === 'ToD'
                    ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                    : 'bg-slate-100 text-slate-700 border-slate-200/80';

                  const config = t.pricingConfig || {};
                  const hasTod = (config.peakPeriods?.length > 0) || (config.offPeakPeriods?.length > 0);
                  const hasSoc = (config.normalPricing?.socRanges?.length > 0) ||
                    (config.peakPeriods?.some(p => p.socRanges?.length > 0)) ||
                    (config.offPeakPeriods?.some(p => p.socRanges?.length > 0));

                  let pricingSummary = 'Flat';
                  if (hasTod && hasSoc) pricingSummary = 'ToD + SOC';
                  else if (hasTod) pricingSummary = 'ToD';
                  else if (hasSoc) pricingSummary = 'SOC';

                  const pricingTagClass = pricingSummary === 'ToD + SOC'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                    : pricingSummary === 'ToD'
                      ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                      : pricingSummary === 'SOC'
                        ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                        : 'bg-stone-100 text-stone-600 border-stone-200/80';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setTariffToView(t);
                        setViewModalOpen(true);
                      }}
                      className="group hover:bg-stone-50/80 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <TableActions
                          onEdit={(e) => {
                            e.stopPropagation();
                            navigate(`/tariffs/edit/${t.id}`, { state: { tariff: t } });
                          }}
                          onDelete={(e) => handleDeleteClick(e, t)}
                          editTitle="Edit Tariff"
                          deleteTitle="Delete Tariff"
                          editPermission={PERMISSIONS.TARIFF_UPDATE}
                          deletePermission={PERMISSIONS.TARIFF_DELETE}
                        />
                      </td>

                      {/* 2. Tariff (Name + Code) */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold text-[13px] group-hover:text-indigo-600 transition-colors duration-150">
                            {t.name}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-stone-400">
                            {t.code}
                          </span>
                        </div>
                      </td>

                      {/* 3. Type */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeClass}`}>
                          {t.type || 'Default'}
                        </span>
                      </td>

                      {/* 4. Status */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-stone-100 text-stone-600 border-stone-200/80'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          {status}
                        </span>
                      </td>

                      {/* 5. Energy Rate */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span className="text-slate-900 font-semibold text-[13px]">{t.chargingFee}</span>
                      </td>


                      {/* 6. GST */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-100/90 text-stone-700 font-mono text-[11px] font-bold border border-stone-200/70">
                          {t.gstPercentage}
                        </span>
                      </td>

                      {/* 7. Pricing Summary */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${pricingTagClass}`}>
                          {pricingSummary}
                        </span>
                      </td>

                      {/* 8. Updated */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span className="text-stone-500 text-xs font-medium">{t.createdOn}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-white/40 bg-white/20">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalRecords}
            itemsPerPage={pageSize}
          />
        </div>
      </div>



      {viewModalOpen && tariffToView && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xl max-w-xl w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-800">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{tariffToView.name}</h2>
                  <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5 mt-0.5">
                    Type: <span className="text-slate-900 font-extrabold">{tariffToView.type || 'Default'}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition cursor-pointer active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Tariff Code</span>
                <span className="text-xs font-mono font-bold text-slate-900">{tariffToView.code || '-'}</span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Status</span>
                <span className="text-xs font-bold text-emerald-700">{tariffToView.status || 'Active'}</span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Base Energy Fee (Normal)</span>
                <span className="text-xs font-black text-slate-900">{tariffToView.chargingFee}</span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">GST Percentage</span>
                <span className="text-xs font-black text-slate-900">{tariffToView.gstPercentage}</span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Peak Periods</span>
                <span className="text-xs font-bold text-rose-700">
                  {tariffToView.pricingConfig?.peakPeriods?.length > 0 ? `${tariffToView.pricingConfig.peakPeriods.length} Period(s)` : 'None'}
                </span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Off-Peak Periods</span>
                <span className="text-xs font-bold text-sky-700">
                  {tariffToView.pricingConfig?.offPeakPeriods?.length > 0 ? `${tariffToView.pricingConfig.offPeakPeriods.length} Period(s)` : 'None'}
                </span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Parking Fee</span>
                <span className="text-xs font-bold text-slate-900">{tariffToView.parkingFee || '-'}</span>
              </div>

              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">Created On</span>
                <span className="text-xs font-bold text-stone-700">{tariffToView.createdOn || '-'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-stone-200/70">
              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  navigate(`/tariffs/edit/${tariffToView.id}`, { state: { tariff: tariffToView } });
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Tariff
              </button>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-slate-700 font-bold rounded-lg text-xs border border-stone-200 hover:border-stone-300 transition active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTariffToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Tariff Plan"
        itemName={tariffToDelete?.name}
        isDeleting={isDeleting}
      />

    </div>
  );
}
