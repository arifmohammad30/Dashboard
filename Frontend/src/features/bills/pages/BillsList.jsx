import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  FileText,
  FileCheck,
  Clock,
  Loader2
} from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import FilterSection from '../../../components/ui/FilterSection';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';
import { useBillsList } from '../hooks/useBillsList';

export default function BillsList() {
  const navigate = useNavigate();
  const {
    bills,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    pageSize,
    timeRange,
    setTimeRange,
    filters,
    isFilterOpen,
    setIsFilterOpen,
    filterRef,
    activeFiltersCount,
    handleFilterChange,
    handleDownloadCsv
  } = useBillsList();

  const handleOpenBill = (bill) => {
    navigate(`/bills/${encodeURIComponent(bill.billNumber || bill.id)}`, { state: { bill } });
  };

  const getAvatarStyle = (colorStr) => {
    if (!colorStr || colorStr.includes('bg-indigo-100')) return 'bg-indigo-600 text-white';
    if (colorStr.includes('bg-purple')) return 'bg-purple-600 text-white';
    if (colorStr.includes('bg-amber')) return 'bg-amber-600 text-white';
    if (colorStr.includes('bg-emerald')) return 'bg-emerald-600 text-white';
    if (colorStr.includes('bg-sky')) return 'bg-sky-600 text-white';
    if (colorStr.includes('bg-rose')) return 'bg-rose-600 text-white';
    if (colorStr.includes('bg-violet')) return 'bg-violet-600 text-white';
    return 'bg-indigo-600 text-white';
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1750px] w-full mx-auto pb-6 animate-in fade-in duration-200">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            All Bills
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            View and manage billing records, generated invoices, and transaction settlements.
          </p>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl text-xs shadow-2xs transition-colors duration-150 cursor-pointer"
            >
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>

          {/* Export Button */}
          <PermissionGuard permission={PERMISSIONS.BILL_EXPORT}>
            <ExportButton
              onExport={handleDownloadCsv}
              label="Export"
            />
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
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Filter Bills</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="space-y-4">
                  <FilterSection
                    title="Bill Status"
                    options={['Unpaid', 'Paid', 'Not Generated']}
                    selected={filters.billStatus}
                    onChange={(val) => handleFilterChange('billStatus', val)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Datatable Container */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[520px]">
        {/* Datatable Header Bar: Total Count + Search */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalRecords}</span> total billing records
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search by Bill Number, Driver, CP..."
          />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-none flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Bill Number
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Bill Status
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Transaction Status
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Charge Transaction
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Energy Delivered
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Applied Discount
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Fleet
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Method
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Driver
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Charge Point
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Generated On
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading bills...</p>
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-stone-400 mb-1">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No bill records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map((row) => {
                  const isPaid = row.billStatus === 'Paid';
                  const isUnpaid = row.billStatus === 'Unpaid' || row.billStatus === 'Generated';
                  const isCompleted = row.chargeTransactionStatus === 'Completed' || row.chargeTransactionStatus === 'Stopped';
                  const driverName = row.customerDriver?.name || row.driverName || '-';
                  const driverInitial = driverName !== '-' ? driverName.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleOpenBill(row)}
                      className="group hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Bill Number -> Indigo highlight */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-slate-900 font-extrabold font-mono text-[13px] group-hover:text-indigo-600 transition-colors cursor-pointer">
                          {row.billNumber}
                        </span>
                      </td>

                      {/* 2. Bill Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            Paid
                          </span>
                        ) : isUnpaid ? (
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-amber-50/90 text-amber-700 border border-amber-200/90 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Unpaid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold bg-stone-50 text-stone-500 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                            Not Generated
                          </span>
                        )}
                      </td>

                      {/* 3. Charge Transaction Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            {row.chargeTransactionStatus}
                          </span>
                        ) : isOngoing ? (
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                            Ongoing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {row.chargeTransactionStatus}
                          </span>
                        )}
                      </td>

                      {/* 4. Charge Transaction -> Sky highlight */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.chargeTransaction) {
                              navigate(`/session-history?search=${encodeURIComponent(row.chargeTransaction)}`);
                            }
                          }}
                          className="text-slate-700 font-bold font-mono text-xs group-hover:text-sky-600 transition-colors cursor-pointer text-left"
                        >
                          {row.chargeTransaction}
                        </button>
                      </td>

                      {/* 5. Energy Delivered */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-stone-700 font-medium">
                        {row.energyDelivered}
                      </td>

                      {/* 6. Applied Discount */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-stone-400 font-medium">
                        {row.appliedDiscount}
                      </td>

                      {/* 7. Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-stone-900">
                        ₹{Number(row.amount).toFixed(2)}
                      </td>

                      {/* 8. Fleet -> Violet highlight */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {row.fleet && row.fleet !== '-' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/fleets?search=${encodeURIComponent(row.fleet)}`);
                            }}
                            className="text-stone-700 font-semibold text-xs group-hover:text-violet-600 transition-colors cursor-pointer text-left"
                          >
                            {row.fleet}
                          </button>
                        ) : (
                          <span className="text-stone-400 font-medium">-</span>
                        )}
                      </td>

                      {/* 9. Method */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-stone-700 font-semibold">
                        {row.method}
                      </td>

                      {/* 10. Driver / User */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1EB8D4]/20 to-[#1EB8D4]/10 border border-[#1EB8D4]/30 text-[#148296] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {driverInitial}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-[#1EB8D4] transition-colors">
                              {row.customerDriver?.name || 'EV Driver'}
                            </span>
                            {row.customerDriver?.phone && (
                              <span className="text-[11px] text-stone-400 font-mono block">
                                {row.customerDriver.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 11. Invoice */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBill(row);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 group-hover:bg-indigo-50 group-hover:border-indigo-200 text-slate-700 group-hover:text-indigo-600 border border-slate-200/90 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                          <span>Invoice</span>
                        </button>
                      </td>

                      {/* 12. Charge Point -> Emerald highlight */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.chargePoint) {
                              navigate(`/charge-points/${encodeURIComponent(row.chargePoint)}`);
                            }
                          }}
                          className="text-stone-800 font-bold text-xs group-hover:text-cyan-600 transition-colors cursor-pointer text-left"
                        >
                          {row.chargePoint}
                        </button>
                      </td>

                      {/* 13. Generated on */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-stone-500 text-xs font-medium">
                        {row.generatedOn}
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
    </div>
  );
}
