import React from 'react';
import {
  Search,
  Filter,
  Plus,
  Loader2,

  Settings2,
  Building2,
  Hash,
  Users,
  Wallet,
  Calendar
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

import { useFleetsList } from '../hooks/useFleetsList';

export default function FleetsList() {
  const {
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
  } = useFleetsList();

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '₹0.00';
    const num = Number(val);
    const formatted = Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  const formatFleetDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1700px] w-full mx-auto pb-6">
      {/* Page Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Fleets
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Manage fleet operator accounts, driver allocations, and wallet balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportButton
            onExport={handleExportCSV}
            label="Export"
          />

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
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Filter Fleets</h3>
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
                    options={['Active', 'Inactive', 'Suspended']}
                    selected={filters.status}
                    onChange={(val) => handleFilterChange('status', val)}
                  />
                </div>
              </div>
            )}
          </div>

          <PermissionGuard permission={PERMISSIONS.FLEET_CREATE}>
            <PrimaryButton
              onClick={() => navigate('/fleets/new')}
              label="Add New"
            />
          </PermissionGuard>



        </div>
      </div>

      {/* Datatable Wrapper */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalRecords}</span> total fleets
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search by Name"
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
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Fleet name</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Operator Code</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Users className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" />Drivers</div>
                </th>
                <th className="px-4 py-3 text-right font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5"><Wallet className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Available Wallet Balance</div>
                </th>
                <th className="px-4 py-3 text-right font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap rounded-r-xl">
                  <div className="flex items-center justify-end gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#1EB8D4] animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading fleets...</p>
                    </div>
                  </td>
                </tr>
              ) : fleets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/40 border border-stone-200/60 flex items-center justify-center text-[#1EB8D4] mb-1">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No fleet records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                fleets.map((row) => {
                  const drivers = (row.driverCount === null || row.driverCount === undefined || row.driverCount === 0) ? '-' : row.driverCount;
                  const balanceVal = Number(row.availableWalletBalance || 0);

                  return (
                    <tr
                      key={row.id}
                      className="group hover:bg-[#F8FAFF] transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <TableActions
                          onEdit={(e) => {
                            e.stopPropagation();
                            navigate(`/fleets/edit/${row.id}`, { state: { fleet: row } });
                          }}
                          onDelete={(e) => handleDeleteClick(e, row)}
                          editPermission={PERMISSIONS.FLEET_UPDATE}
                          deletePermission={PERMISSIONS.FLEET_DELETE}
                          editTitle="Edit Fleet"
                          deleteTitle="Delete Fleet"
                        />
                      </td>


                      {/* 2. Fleet Name */}
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fleets/view/${row.id}`, { state: { fleet: row } });
                          }}
                          className="text-slate-900 font-semibold text-[13px] hover:text-[#148296] transition-colors duration-150 cursor-pointer"
                        >
                          {row.name}
                        </span>
                      </td>

                      {/* 3. Operator Code */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-stone-700 font-mono font-medium text-xs">{row.operatorCode || '-'}</span>
                      </td>

                      {/* 4. drivers */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-stone-700 font-medium text-xs">{drivers}</span>
                      </td>

                      {/* 5. Available Wallet Balance */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={`font-extrabold text-xs ${balanceVal < 0 ? 'text-rose-600' : balanceVal > 0 ? 'text-stone-800' : 'text-stone-700'}`}>
                          {formatCurrency(balanceVal)}
                        </span>
                      </td>

                      {/* 6. Created On */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-stone-500 text-xs font-medium">{formatFleetDate(row.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 border-t border-stone-200/80 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalRecords}
            itemsPerPage={pageSize}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Fleet Record"
        message={
          <>
            Are you sure you want to delete fleet <strong className="text-stone-900">{fleetToDelete?.name}</strong>? This action will permanently remove the operator record and cannot be undone.
          </>
        }
        loading={isDeleting}
      />
    </div>
  );
}
