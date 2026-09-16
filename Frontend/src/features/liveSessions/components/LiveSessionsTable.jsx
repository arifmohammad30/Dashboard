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
  Clock,
  Radio,
  SearchX
} from 'lucide-react';
import LiveSessionsRow from './LiveSessionsRow';
import Pagination from '../../../components/ui/Pagination';

export default function LiveSessionsTable({
  sessions,
  loading,
  searchTerm = '',
  onResetSearch,
  onNavigateStation,
  onNavigateChargePoint,
  onNavigateLogs,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange
}) {
  if (loading && (!sessions || sessions.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center text-stone-500 font-medium flex flex-col items-center justify-center gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-stone-600">Loading active charging sessions...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[180px]">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
          <thead className="bg-[#F8FAFC] border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> EV Driver</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Station</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Txn Id</div>
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
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Duration</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/70 bg-white">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-4 py-16 text-center text-stone-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    {searchTerm ? (
                      <>
                        <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 mb-1">
                          <SearchX className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-stone-800 text-sm">No Matching Live Sessions</span>
                        <p className="text-xs text-stone-500">
                          No active sessions found matching &ldquo;<span className="font-semibold text-stone-700">{searchTerm}</span>&rdquo;.
                        </p>
                        {onResetSearch && (
                          <button
                            onClick={onResetSearch}
                            className="mt-2 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Clear Search
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-emerald-50 text-[#4DA944] rounded-2xl mb-1 border border-emerald-200/80">
                          <Radio className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-stone-800 text-sm">No Active Live Sessions</span>
                        <p className="text-xs text-stone-500">
                          There are currently no active charging sessions streaming telemetry.
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((session, idx) => (
                <LiveSessionsRow
                  key={session.id || idx}
                  session={session}
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
