import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
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

import Pagination from '../../components/ui/Pagination';
import DeleteModal from '../../components/ui/DeleteModal';
import FilterSection from '../../components/ui/FilterSection';
import { getTariffs, addTariff, deleteTariff } from '../../services/tariffService';
import { useToast } from '../../context/ToastContext';
import { filterTableData } from '../../utils/searchUtils';

export default function TariffsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState({ type: [], gstPercentage: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // View Tariff Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [tariffToView, setTariffToView] = useState(null);

  // Modal States
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tariffToDelete, setTariffToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Tariffs
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTariffs();
      setTariffs(data);
    } catch (err) {
      console.error("Failed to load tariffs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter click outside
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
  };

  const activeFiltersCount = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

  // Advanced Tokenized Search & Filtering Engine
  const filteredTariffs = useMemo(() => {
    const categoryFiltered = tariffs.filter((t) => {
      const matchesType = filters.type.length === 0 || filters.type.includes(t.type);
      const matchesGst = filters.gstPercentage.length === 0 || filters.gstPercentage.some(g => t.gstPercentage.includes(g));
      return matchesType && matchesGst;
    });

    return filterTableData(categoryFiltered, searchTerm, [
      'name',
      'code',
      'type',
      'costingType',
      'chargingFee',
      'gstPercentage'
    ]);
  }, [tariffs, searchTerm, filters]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRecords = filteredTariffs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTariffs = filteredTariffs.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const changePageSize = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Add Tariff
  const handleCreateTariff = async (e) => {
    e.preventDefault();
    if (!newTariff.name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await addTariff({
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

  const handleDeleteConfirm = async () => {
    if (!tariffToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTariff(tariffToDelete.id);
      setTariffs(prev => prev.filter(t => t.id !== tariffToDelete.id));
      setDeleteModalOpen(false);
      setTariffToDelete(null);
      toast.success("Tariff structure deleted successfully", { code: 200 });
    } catch (err) {
      console.error("Failed to delete tariff:", err);
      toast.error("Failed to delete tariff structure", { code: 500 });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1700px] w-full mx-auto pb-6">
      {/* Top Title & Actions Bar */}
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
          <button
            onClick={() => toast.success("Tariffs data exported successfully", { code: 200 })}
            className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Export
          </button>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer"
            >
              <Filter className="w-4 h-4 text-violet-500" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-sky-400 to-indigo-500 text-white rounded-full text-[10px] ml-1 shadow-sm font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-3xl z-50 p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/40">
                  <h3 className="font-extrabold text-stone-800 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-violet-500" />
                    Refine Tariffs
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setFilters({ type: [], gstPercentage: [] })}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
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

          <button
            onClick={() => navigate('/tariffs/new')}
            className="flex items-center gap-2 px-4.5 py-2 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-colors duration-200 text-xs border border-orange-400/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Tariff
          </button>
        </div>
      </div>

      {/* Main Enterprise Table Container */}
      <div className="bg-[#F6F8FB] border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Top Info & Search Bar */}
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

        {/* Table Section */}
        <div className="overflow-x-auto flex-1 px-1.5 sm:px-2 pb-6 pt-0 transform-gpu translate-z-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead className="bg-[#F8FAFC] border-b border-stone-200/90 shadow-2xs">
              <tr className="bg-[#F8FAFC] border-b border-stone-200/90">
                <th className="px-4 py-2.5 text-center font-bold text-stone-600 text-[11px] uppercase tracking-wider rounded-l-xl whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Type</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Costing Type</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Applicable To</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Fee</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Parking Fee</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Idle Fee</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> SoC</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Starts At</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Square className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Ends At</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Weight</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On</div>
                </th>
                <th className="px-4 py-2.5 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-r-xl whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> GST Percentage</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="14" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading tariffs...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedTariffs.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-sky-400 mb-1">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No tariffs found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTariffs.map((t) => (
                  <tr
                    key={t.id}
                    className="group bg-white hover:bg-[#F9FBFF] border border-stone-200/80 hover:border-slate-300 shadow-2xs transition-colors duration-150 rounded-xl cursor-pointer"
                  >
                    {/* Actions Column (Edit Only - Visible on Hover) */}
                    <td className="px-4 py-3 text-center rounded-l-xl whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tariffs/edit/${t.id}`, { state: { tariff: t } });
                          }}
                          className="p-1.5 text-sky-600 bg-white/70 border border-sky-100 hover:bg-sky-500 hover:text-white rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200 cursor-pointer"
                          title="Edit Tariff"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Name (Click to View Tariff Details) */}
                    <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      setTariffToView(t);
                      setViewModalOpen(true);
                    }}>
                      <span className="text-sky-600 font-bold text-[13px] hover:text-sky-700 transition-colors duration-200 cursor-pointer">
                        {t.name}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/80">
                        {t.type || 'Default'}
                      </span>
                    </td>

                    {/* Costing Type */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-700 text-[13px] font-medium">{t.costingType}</span>
                    </td>

                    {/* Applicable To */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-700 text-[13px] font-medium">{t.applicableTo || 'All Fleets'}</span>
                    </td>

                    {/* Charging Fee */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-800 font-bold text-[13px]">{t.chargingFee}</span>
                    </td>

                    {/* Parking Fee */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-500 text-[13px] font-medium">{t.parkingFee}</span>
                    </td>

                    {/* Idle Fee */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-700 text-[13px] font-medium">{t.idleFee}</span>
                    </td>

                    {/* SoC */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-500 text-[13px] font-medium">{t.soc}</span>
                    </td>

                    {/* Starts At */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-700 text-[13px] font-medium">{t.startsAt}</span>
                    </td>

                    {/* Ends At */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-700 text-[13px] font-medium">{t.endsAt}</span>
                    </td>

                    {/* Weight */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-800 font-bold text-[13px]">{t.weight}</span>
                    </td>

                    {/* Created on */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-500 font-medium text-[12px]">{t.createdOn}</span>
                    </td>

                    {/* GST Percentage */}
                    <td className="px-4 py-3 text-left rounded-r-xl whitespace-nowrap">
                      <span className="text-stone-800 font-bold text-[13px]">{t.gstPercentage}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="shrink-0 border-t border-white/40 bg-white/20">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            pageSize={pageSize}
            onPageSizeChange={changePageSize}
            totalRecords={totalRecords}
          />
        </div>
      </div>

      {/* Add Tariff Modal */}
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

      {/* View Tariff Detail Modal */}
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
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Charging Fee</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.chargingFee}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">GST Percentage</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.gstPercentage}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Costing Type</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.costingType}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Applicable To</span>
                <span className="text-sm font-black text-sky-600">{tariffToView.applicableTo}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Parking Fee</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.parkingFee}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Idle Fee</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.idleFee}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Weight</span>
                <span className="text-sm font-black text-stone-800">{tariffToView.weight}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Created On</span>
                <span className="text-xs font-bold text-stone-700">{tariffToView.createdOn}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 mt-2 border-t border-stone-100">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && tariffToDelete && (
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setTariffToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={tariffToDelete.name}
          itemType="Tariff"
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
