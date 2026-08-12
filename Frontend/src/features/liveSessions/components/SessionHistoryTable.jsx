import React from 'react';
import {
  Hash,
  User as UserIcon,
  MapPin,
  Layers,
  Plug,
  CheckCircle2,
  Battery,
  Activity,
  Zap,
  IndianRupee,
  FileText,
  Clock
} from 'lucide-react';
import SessionHistoryRow from './SessionHistoryRow';
import Pagination from '../../../components/ui/Pagination';

export default function SessionHistoryTable({
  sessions,
  loading,
  resolveStation,
  resolveChargePoint,
  onNavigateStation,
  onNavigateChargePoint,
  onNavigateLogs,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center text-stone-500 font-medium">
        Loading historical sessions data...
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[180px]">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
          <thead className="bg-[#F8FAFC] border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Txn Id</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> EV Driver</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Station</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Battery className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> SoC</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Telemetry</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Energy</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Cost</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Bill ID</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Date</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/70 bg-white">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="13" className="px-4 py-12 text-center text-stone-500 font-medium">
                  No historical session records match the criteria.
                </td>
              </tr>
            ) : (
              sessions.map((session, idx) => (
                <SessionHistoryRow
                  key={session.id || idx}
                  session={session}
                  resolveStation={resolveStation}
                  resolveChargePoint={resolveChargePoint}
                  onNavigateStation={onNavigateStation}
                  onNavigateChargePoint={onNavigateChargePoint}
                  onNavigateLogs={onNavigateLogs}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalItems > 0 && onPageChange && (
        <div className="border-t border-stone-200/80 bg-[#F8FAFC]/50 py-1">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
