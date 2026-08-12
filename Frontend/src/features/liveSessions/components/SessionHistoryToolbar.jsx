import React from 'react';
import { Search } from 'lucide-react';
import ExportButton from '../../../components/ui/ExportButton';

export default function SessionHistoryToolbar({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onExportCsv
}) {
  const tabs = ['All', 'Completed', 'Failed'];

  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Status Tabs (Original Enterprise Pill Design) */}
      <div className="bg-stone-100/80 p-1 rounded-xl flex items-center gap-1 border border-stone-200/60 shadow-inner w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors duration-150 cursor-pointer ${
              activeTab === tab
                ? tab === 'All'
                  ? 'bg-white text-sky-700 border-stone-200 shadow-2xs'
                  : tab === 'Completed'
                    ? 'bg-white text-emerald-700 border-stone-200 shadow-2xs'
                    : 'bg-white text-rose-700 border-stone-200 shadow-2xs'
                : 'bg-transparent text-stone-600 border-transparent hover:bg-stone-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by User, Station, CP..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-all"
          />
        </div>

        <ExportButton
          onExport={onExportCsv}
          label="Export CSV"
        />
      </div>
    </div>
  );
}
