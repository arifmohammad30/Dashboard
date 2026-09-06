import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Loader2,
  Settings2,
  Tag,
  Layers,
  Activity,
  Clock,
  Percent,
  Users,
  MapPin,
  Sliders
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import DeleteModal from '../../../components/ui/DeleteModal';
import FilterSection from '../../../components/ui/FilterSection';
import TableActions from '../../../components/ui/TableActions';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';

import { useToast } from '../../../context/ToastContext';
import { getDiscounts, deleteDiscount } from '../api/discountService';

export default function DiscountsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const filterRef = useRef(null);

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    type: []
  });

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDiscountsData = async () => {
    setLoading(true);
    try {
      const data = await getDiscounts(searchTerm);
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load discounts:', err);
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscountsData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      const current = prev[filterType] || [];
      const exists = current.includes(value);
      const next = exists ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [filterType]: next };
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = (filters.status?.length || 0) + (filters.type?.length || 0);

  // Apply filters locally
  const filteredDiscounts = discounts.filter((d) => {
    const effectiveStatus = d.status || 'Active';

    if (filters.status.length > 0 && !filters.status.includes(effectiveStatus)) {
      return false;
    }
    if (filters.type.length > 0 && !filters.type.includes(d.type)) {
      return false;
    }
    return true;
  });

  // Calculate pagination slice
  const totalRecords = filteredDiscounts.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedDiscounts = filteredDiscounts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDeleteClick = (discount) => {
    setDiscountToDelete(discount);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!discountToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDiscount(discountToDelete.id);
      toast.success(`Discount "${discountToDelete.name}" deleted successfully`, { code: 200 });
      setDiscounts((prev) => prev.filter((d) => d.id !== discountToDelete.id));
      setDeleteModalOpen(false);
      setDiscountToDelete(null);
    } catch (err) {
      console.error('Failed to delete discount:', err);
      toast.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (discounts.length === 0) return;
    const headers = ['Name', 'Type', 'Status', 'Condition Type', 'User Access', 'Fleets Access', 'Created On'];
    const rows = discounts.map((d) => [
      `"${d.name || ''}"`,
      `"${d.type || ''}"`,
      `"${d.status || ''}"`,
      `"${d.conditionType || 'OR'}"`,
      `"${d.userAccess || 'All'}"`,
      `"${d.fleetsAccess || 'All'}"`,
      `"${d.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `discounts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
      );
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1700px] w-full mx-auto pb-6 animate-in fade-in duration-200">
      {/* Page Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Discounts
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Manage promotional discount offers, tariff rate reductions, and access control rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PermissionGuard permission={PERMISSIONS.DISCOUNT_EXPORT}>
            <ExportButton onExport={handleExportCSV} label="Export" />
          </PermissionGuard>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer"
            >
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="leading-none">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-[#1EB8D4] text-slate-950 rounded-full text-[10px] ml-1 font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Filter Discounts</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>

                <div className="space-y-6">
                  <FilterSection
                    title="Status"
                    options={['Active', 'Inactive']}
                    selected={filters.status}
                    onChange={(val) => handleFilterChange('status', val)}
                  />
                  <FilterSection
                    title="Type"
                    options={['Percentage Discounts', 'Fixed Amount', 'Discounted Tariff Rates']}
                    selected={filters.type}
                    onChange={(val) => handleFilterChange('type', val)}
                  />
                </div>
              </div>
            )}
          </div>

          <PermissionGuard permission={PERMISSIONS.DISCOUNT_CREATE}>
            <PrimaryButton onClick={() => navigate('/discounts/new')} label="Add New" />
          </PermissionGuard>
        </div>
      </div>

      {/* Datatable Wrapper */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Datatable Toolbar */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalRecords}</span> total discounts
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            placeholder="Search by Name or Status..."
          />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-none flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap rounded-l-xl">
                  <div className="flex items-center justify-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Type
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Condition
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> User Access
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Fleets Access
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stations Access
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap rounded-r-xl">
                  <div className="flex items-center justify-end gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#1EB8D4] animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading discounts...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedDiscounts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/40 border border-stone-200/60 flex items-center justify-center text-[#1EB8D4] mb-1">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDiscounts.map((row) => {
                  const isActive = row.status === 'Active';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <TableActions
                          onEdit={() => navigate(`/discounts/edit/${row.id}`)}
                          onDelete={() => handleDeleteClick(row)}
                          editPermission={PERMISSIONS.DISCOUNT_UPDATE}
                          deletePermission={PERMISSIONS.DISCOUNT_DELETE}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-left whitespace-nowrap font-bold text-sky-600 hover:text-sky-700 cursor-pointer" onClick={() => navigate(`/discounts/edit/${row.id}`)}>
                        {row.name}
                      </td>

                      <td className="px-4 py-3.5 text-left whitespace-nowrap text-stone-700 font-medium">
                        {row.type || 'Percentage Discounts'}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {row.conditionType || 'OR'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-left whitespace-nowrap text-stone-600">
                        {row.userAccess === 'Selected' ? (
                          <span className="font-bold text-indigo-600">Selected Users</span>
                        ) : (
                          <span className="font-medium text-stone-500">All Users</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-left whitespace-nowrap text-stone-600">
                        {row.fleetsAccess === 'Selected' ? (
                          <span className="font-bold text-violet-600">Selected Fleets</span>
                        ) : (
                          <span className="font-medium text-stone-500">All Fleets</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-left whitespace-nowrap text-stone-600">
                        {row.chargingStationsAccess === 'Selected' ? (
                          <span className="font-bold text-sky-600">Selected Stations</span>
                        ) : (
                          <span className="font-medium text-stone-500">All Stations</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap text-stone-500">
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Shared Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={totalRecords}
          pageSize={pageSize}
        />
      </div>

      {/* Shared Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDiscountToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Discount Offer"
        message={`Are you sure you want to delete "${discountToDelete?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
