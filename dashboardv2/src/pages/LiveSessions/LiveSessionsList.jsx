import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  User as UserIcon,
  MapPin,
  Zap,
  Plug,
  Activity,
  BatteryCharging,
  Loader2
} from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import { apiClient } from '../../lib/apiClient';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useToast } from '../../context/ToastContext';

export default function LiveSessionsList() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const tabs = ['Ongoing', 'Failed', 'Stopped'];

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setLoading(true);
    apiClient('/livesessions')
      .then(data => setSessions(data || []))
      .catch(err => console.error("Failed to fetch initial sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  useSocketEvents({
    sessionUpdated: (updatedSession) => {
      setSessions(prev => prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      ));
    }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (session.status !== activeTab) return false;

      if (debouncedSearchTerm) {
        const searchTerms = debouncedSearchTerm.toLowerCase().split(' ').filter(Boolean);
        const searchableText = [
          session.userName,
          session.userInitials,
          session.station,
          session.chargePoint,
          session.connector,
          session.status
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      }
      return true;
    });
  }, [sessions, activeTab, debouncedSearchTerm]);

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  return (
    <div className="flex flex-col gap-3.5 max-w-[1400px] w-full mx-auto pb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Live Charging Sessions
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">Monitor real-time ongoing, stopped, and failed sessions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer">
            Today
            <ChevronDown className="w-4 h-4 text-blue-500" />
          </button>

          <button className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer">
            <Filter className="w-4 h-4 text-violet-500" />
            Filter
          </button>
        </div>
      </div>

      {/* Main Enterprise Table Container */}
      <div className="bg-[#F6F8FB] border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar (#FFFFFF) */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors duration-150 cursor-pointer ${
                  activeTab === tab
                    ? tab === 'Ongoing'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs'
                      : tab === 'Failed'
                        ? 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs'
                        : 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs'
                    : 'bg-transparent text-stone-600 border-transparent hover:bg-stone-100/70 hover:text-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search sessions..."
              className="w-full pl-14 pr-5 py-2.5 bg-white border border-stone-200/90 shadow-2xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 rounded-2xl text-xs font-medium focus:outline-none text-stone-800 placeholder:text-stone-400 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto flex-1 px-1.5 sm:px-2 pb-6 pt-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead className="sticky top-0 z-20 shadow-2xs">
              <tr className="bg-[#F8FAFC] border-b border-stone-200/90">
                <th className="w-[15%] px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-l-xl whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> User</div>
                </th>
                <th className="w-[25%] px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Station</div>
                </th>
                <th className="w-[20%] px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
                </th>
                <th className="w-[15%] px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector</div>
                </th>
                <th className="w-[15%] px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
                </th>
                <th className="w-[10%] px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider text-right pr-6 rounded-r-xl whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Power (kW)</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-24 text-center">
                    <div className="text-orange-400 flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-bold text-stone-500">Loading live sessions...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-24 text-center">
                    <div className="text-stone-400 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/40 border border-white/50 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-stone-400" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No {activeTab.toLowerCase()} sessions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((row) => (
                  <tr key={row.id} className="group bg-white hover:bg-[#F9FBFF] border border-stone-200/80 hover:border-slate-300 shadow-2xs transition-colors duration-150 rounded-xl cursor-pointer">
                    <td className="px-4 py-3 rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold ${row.userColor} shadow-sm border border-white ring-1 ring-black/5`}>
                          {row.userInitials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-stone-900 font-bold text-sm tracking-tight transition-colors">
                            {row.userName}
                          </span>
                          <span className="text-stone-400 text-xs font-medium">
                            {row.userId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sky-600 font-bold text-[13px] hover:text-sky-700 cursor-pointer">
                        {row.stationName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-700 font-medium text-[13px]">
                        {row.chargePoint}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200/80 whitespace-nowrap">
                        {row.connector}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'Ongoing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Ongoing
                        </span>
                      )}
                      {row.status === 'Failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Failed
                        </span>
                      )}
                      {row.status === 'Stopped' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Stopped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right pr-6 rounded-r-xl">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => { e.stopPropagation(); toast.info(`Session #${row.id} options`, { code: 200 }); }} className="p-1.5 text-stone-500 bg-white/80 border border-stone-200 hover:bg-stone-600 hover:text-white rounded-xl shadow-xs transition active:scale-95 duration-200 cursor-pointer">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
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
    </div>
  );
}
