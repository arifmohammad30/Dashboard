import React from 'react';
import { Search, ChevronRight } from 'lucide-react';

export default function LiveSessionsToolbar({
  searchTerm,
  onSearchChange,
  onNavigateHistory
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Streaming Live Telemetry
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search live sessions..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={onNavigateHistory}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
        >
          <span>Session History</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
