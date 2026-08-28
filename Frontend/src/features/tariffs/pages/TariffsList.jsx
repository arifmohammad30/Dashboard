import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Filter,
  Plus,
  Loader2,
  Settings2,

  Tag,
  Zap,
  CreditCard,
  Users,
  IndianRupee,
  Car,
  Clock,
  Gauge,
  Play,
  Square,
  Layers,
  Calendar,
  Percent,
  X,
  Check,
  Eye,
  Info
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import FilterSection from '../../../components/ui/FilterSection';
import TableActions from '../../../components/ui/TableActions';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';

import { getTariffs, createTariff, exportTariffs } from '../api/tariffService';

import { useToast } from '../../../context/ToastContext';
import { useTableData } from '../../../hooks/useTableData';

export default function TariffsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('id') || searchParams.get('search') || '';

  const [filters, setFilters] = useState({ type: [], gstPercentage: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [tariffToView, setTariffToView] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTariff, setNewTariff] = useState({
    name: '',
    type: 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: '12',
    parkingFee: 'NA',
    idleFee: '0',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: '1',
    gstPercentage: '18'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  const {
    data: tariffs,
    setData: setTariffs,
    loading,
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

  const handleCreateTariff = async (e) => {
    e.preventDefault();
    if (!newTariff.name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createTariff({
        name: newTariff.name.trim(),
        type: newTariff.type,
        costingType: newTariff.costingType,
        applicableTo: newTariff.applicableTo,
        chargingFee: `₹${newTariff.chargingFee} / kWh`,
        parkingFee: newTariff.parkingFee,
        idleFee: newTariff.idleFee === '0' ? '₹0 / min' : `₹${newTariff.idleFee} / min`,
        soc: newTariff.soc,
        startsAt: newTariff.startsAt,
        endsAt: newTariff.endsAt,
        weight: Number(newTariff.weight) || 1,
        gstPercentage: `${newTariff.gstPercentage} %`
      });

      setTariffs(prev => [created, ...prev]);
      setAddModalOpen(false);
      setNewTariff({
        name: '',
        type: 'Default',
        costingType: 'Charging Only',
        applicableTo: 'All Fleets',
        chargingFee: '12',
        parkingFee: 'NA',
        idleFee: '0',
        soc: 'NA',
        startsAt: 'NA',
        endsAt: 'NA',
        weight: '1',
        gstPercentage: '18'
      });
    } catch (err) {
      console.error("Failed to create tariff:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


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
                <span className="flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] ml-1 font-bold">
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

                <div className="space-y-6">
                  <FilterSection
                    title="Tariff Type"
                    options={['Default', 'ToD', 'Event', 'SoC']}
                    selected={filters.type}
                    onChange={(val) => handleFilterChange('type', val)}
                  />
                  <FilterSection
                    title="GST Percentage"
                    options={['18 %', '0 %']}
                    selected={filters.gstPercentage}
                    onChange={(val) => handleFilterChange('gstPercentage', val)}
                  />
                </div>
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

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tariffs by name..."
              className="w-full pl-14 pr-5 py-2.5 bg-white border border-stone-200/90 shadow-2xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 rounded-2xl text-xs font-medium focus:outline-none text-stone-800 placeholder:text-stone-400 transition-colors duration-150"
            />
          </div>
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
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading tariffs...</p>
                    </div>
                  </td>
                </tr>
              ) : tariffs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-orange-500 mb-1">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No tariffs found.</p>
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
                      className="group hover:bg-stone-50/80 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <TableActions
                          onEdit={(e) => {
                            e.stopPropagation();
                            navigate(`/tariffs/edit/${t.id}`, { state: { tariff: t } });
                          }}
                          editTitle="Edit Tariff"
                          editPermission={PERMISSIONS.TARIFF_UPDATE}
                          deletePermission={PERMISSIONS.TARIFF_DELETE}
                        />
                      </td>



                      {/* 2. Tariff (Name + Code) */}
                      <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => {
                        e.stopPropagation();
                        setTariffToView(t);
                        setViewModalOpen(true);
                      }}>
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold text-[13px] hover:text-orange-600 transition-colors duration-150 cursor-pointer">
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActive
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

      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <h2 className="text-lg font-black text-stone-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-500" /> Create New Tariff
              </h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTariff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Tariff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DLF Park Place DC"
                  value={newTariff.name}
                  onChange={(e) => setNewTariff({ ...newTariff, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Type</label>
                  <select
                    value={newTariff.type}
                    onChange={(e) => setNewTariff({ ...newTariff, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Default">Default</option>
                    <option value="ToD">ToD</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Charging Fee (₹ / kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTariff.chargingFee}
                    onChange={(e) => setNewTariff({ ...newTariff, chargingFee: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">GST Percentage</label>
                  <select
                    value={newTariff.gstPercentage}
                    onChange={(e) => setNewTariff({ ...newTariff, gstPercentage: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="18">18 %</option>
                    <option value="0">0 %</option>
                    <option value="5">5 %</option>
                    <option value="12">12 %</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Weight</label>
                  <input
                    type="number"
                    value={newTariff.weight}
                    onChange={(e) => setNewTariff({ ...newTariff, weight: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Tariff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && tariffToView && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-800">{tariffToView.name}</h2>
                  <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5 mt-0.5">
                    Type: <span className="text-sky-600 font-extrabold">{tariffToView.type}</span>
                  </span>
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
              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Tariff Code</span>
                <span className="text-xs font-mono font-extrabold text-slate-800">{tariffToView.code || '-'}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Status</span>
                <span className="text-xs font-black text-emerald-600">{tariffToView.status || 'Active'}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Base Energy Fee (Normal)</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.chargingFee}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">GST Percentage</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.gstPercentage}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Peak Periods</span>
                <span className="text-xs font-extrabold text-rose-600">
                  {tariffToView.pricingConfig?.peakPeriods?.length > 0 ? `${tariffToView.pricingConfig.peakPeriods.length} Period(s)` : 'None'}
                </span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Off-Peak Periods</span>
                <span className="text-xs font-extrabold text-sky-600">
                  {tariffToView.pricingConfig?.offPeakPeriods?.length > 0 ? `${tariffToView.pricingConfig.offPeakPeriods.length} Period(s)` : 'None'}
                </span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Parking Fee</span>
                <span className="text-xs font-extrabold text-stone-800">{tariffToView.parkingFee}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Created On</span>
                <span className="text-xs font-bold text-stone-700">{tariffToView.createdOn}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  navigate(`/tariffs/edit/${tariffToView.id}`, { state: { tariff: tariffToView } });
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Tariff
              </button>
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
