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

export default function LiveSessionsList() {
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
    <div className="flex flex-col gap-5 max-w-[1400px] w-full mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 mt-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Live Charging Sessions
          </h1>
          <p className="text-sm text-slate-900 mt-1 font-medium ml-1">Monitor real-time ongoing, stopped, and failed sessions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-2xl shadow-sm active:scale-95 transition-colors duration-200 text-sm">
            Today
            <ChevronDown className="w-4 h-4 text-blue-500" />
          </button>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-2xl shadow-sm active:scale-95 transition-colors duration-200 text-sm">
            <Filter className="w-4 h-4 text-violet-500" />
            Filter
          </button>
        </div>
      </div>

      {/* Main Glass Table Container */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_16px_50px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.9)_inset] rounded-[32px] overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-8 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/30 backdrop-blur-xl border-b border-white/60">

          <div className="flex items-center gap-2 text-sm text-stone-600 font-medium px-2 py-2 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-xs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab
                  ? tab === 'Ongoing' ? 'bg-emerald-50 text-emerald-700 shadow-md'
                    : tab === 'Failed' ? 'bg-rose-50 text-rose-700 shadow-md'
                      : 'bg-amber-50 text-amber-700 shadow-md'
                  : 'text-stone-600 hover:bg-white/60 hover:text-stone-800'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search sessions..."
              className="w-full pl-14 pr-5 py-3.5 bg-white/40 backdrop-blur-xl border border-white/80 shadow-xs focus:shadow-[0_0_25px_rgba(255,255,255,0.9)] focus:border-white focus:bg-white/70 rounded-2xl text-sm focus:outline-none text-stone-800 placeholder:text-stone-400 transition-all duration-300"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto flex-1 px-4 sm:px-8 pb-6 pt-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-white/30 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] border-b border-white/40">
                <th className="w-[15%] px-4 py-4 font-black text-indigo-950/70 text-[12px] uppercase tracking-wider rounded-l-2xl">
                  <div className="flex items-center gap-2 whitespace-nowrap"><UserIcon strokeWidth={2.5} className="w-4 h-4 text-indigo-400" /> User</div>
                </th>
                <th className="w-[25%] px-4 py-4 font-black text-blue-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><MapPin strokeWidth={2.5} className="w-4 h-4 text-blue-400" /> Charging Station</div>
                </th>
                <th className="w-[20%] px-4 py-4 font-black text-emerald-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Zap strokeWidth={2.5} className="w-4 h-4 text-emerald-400" /> Charge Point</div>
                </th>
                <th className="w-[15%] px-4 py-4 font-black text-purple-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Plug strokeWidth={2.5} className="w-4 h-4 text-purple-400" /> Connector</div>
                </th>
                <th className="w-[15%] px-4 py-4 font-black text-sky-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Activity strokeWidth={2.5} className="w-4 h-4 text-sky-400" /> Status</div>
                </th>
                <th className="w-[10%] px-4 py-4 font-black text-amber-950/70 text-[12px] uppercase tracking-wider text-right pr-6 rounded-r-2xl">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap"><BatteryCharging strokeWidth={2.5} className="w-4 h-4 text-amber-400" /> Power (kW)</div>
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
                      <div className="w-20 h-20 bg-white/40 backdrop-blur-md rounded-3xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)] border border-white/50 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-stone-400" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No {activeTab.toLowerCase()} sessions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((row) => (
                  <tr key={row.id} className="group bg-white/30 hover:bg-white/60 backdrop-blur-md border border-white/40 hover:border-white/90 shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 rounded-2xl cursor-pointer">
                    <td className="px-4 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold ${row.userColor} shadow-sm border border-white ring-1 ring-black/5`}>
                          {row.userInitials}
                        </div>
                        <span className="text-stone-800 font-bold text-[13px] transition-colors duration-200 group-hover:text-rose-500">
                          {row.userName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-blue-600 font-medium text-[13px] line-clamp-2 max-w-[280px]">
                        {row.station}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-stone-700 font-medium text-[13px]">
                        {row.chargePoint}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50/80 text-blue-700 border border-blue-200/50 shadow-sm whitespace-nowrap">
                        {row.connector}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {row.status === 'Ongoing' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50/80 text-emerald-600 border border-emerald-100 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                          Ongoing
                        </span>
                      )}
                      {row.status === 'Failed' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-50/80 text-rose-600 border border-rose-100 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                          Failed
                        </span>
                      )}
                      {row.status === 'Stopped' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-50/80 text-amber-600 border border-amber-100 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                          Stopped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right pr-8 rounded-r-2xl">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => e.stopPropagation()} className="p-2 text-stone-500 bg-white/80 border border-stone-200 hover:bg-stone-600 hover:text-white rounded-xl shadow-sm transition active:scale-95 duration-200">
                          <MoreVertical className="w-4 h-4" />
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
