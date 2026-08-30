import React from 'react';
import { ChevronRight } from 'lucide-react';
import SearchInput from '../../../components/ui/SearchInput';

export default function LiveSessionsToolbar({
  searchTerm,
  onSearchChange,
  onNavigateHistory
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50/90 text-emerald-800 border border-emerald-200/90 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-tight">Streaming Live Telemetry</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          onClear={() => onSearchChange({ target: { value: '' } })}
          placeholder="Search live sessions..."
          wrapperClassName="w-full sm:w-64"
        />

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
