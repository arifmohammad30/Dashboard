import React, { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';
import SearchInput from '../../../components/ui/SearchInput';
import ExportButton from '../../../components/ui/ExportButton';
import FilterSection from '../../../components/ui/FilterSection';

export default function SessionHistoryToolbar({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onExportCsv,
  filters = { station: [], chargePoint: [], connector: [], status: [] },
  onFilterChange,
  onClearFilters,
  activeFiltersCount = 0,
  stationOptions = [],
  cpOptions = []
}) {
  const tabs = ['All', 'Completed', 'Failed'];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stationsToRender = Array.isArray(stationOptions) ? stationOptions : [];
  const cpToRender = Array.isArray(cpOptions) ? cpOptions : [];

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
                    ? 'bg-white text-cyan-700 border-stone-200 shadow-2xs'
                    : 'bg-white text-rose-700 border-stone-200 shadow-2xs'
                : 'bg-transparent text-stone-600 border-transparent hover:bg-stone-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          onClear={() => onSearchChange({ target: { value: '' } })}
          placeholder="Search by User, Station, CP..."
          wrapperClassName="w-full sm:w-64"
        />

        <div className="relative" ref={filterRef}>
          <button
            type="button"
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 shadow-xl rounded-2xl z-50 p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                <h3 className="font-extrabold text-stone-800 flex items-center gap-2 text-xs">
                  <Filter className="w-4 h-4 text-violet-500" />
                  Refine Session History
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <FilterSection
                  title="Time Range"
                  options={['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days']}
                  selected={filters.timeRange || []}
                  onChange={(val) => onFilterChange('timeRange', val)}
                />
                <FilterSection
                  title="Charging Station"
                  options={stationsToRender}
                  selected={filters.station || []}
                  onChange={(val) => onFilterChange('station', val)}
                />
                <FilterSection
                  title="Charge Point"
                  options={cpToRender}
                  selected={filters.chargePoint || []}
                  onChange={(val) => onFilterChange('chargePoint', val)}
                />
              </div>
            </div>
          )}
        </div>

        <ExportButton
          onExport={onExportCsv}
          label="Export CSV"
        />
      </div>
    </div>
  );
}
