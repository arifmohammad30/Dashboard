import React from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function DataTable({ 
  title,
  subtitle,
  totalItems, 
  searchTerm, 
  onSearchChange,
  headerActions,
  columns, 
  loading,
  children,
  emptyMessage = "No items found.",
  footer
}) {
  return (
    <div className="bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 rounded-[32px] overflow-hidden flex flex-col min-h-[180px]">
      
      {/* Table Header Row */}
      <div className="px-8 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/20 border-b border-white/40">
        
        {/* Left Side: Title / Count */}
        <div className="flex items-center gap-2 text-sm text-stone-600 font-medium px-4 py-2 rounded-lg bg-white border border-stone-200 shadow-sm">
          <span className="font-extrabold text-[#148296] text-base">{totalItems}</span> {subtitle || 'items'}
        </div>

        {/* Center: Search */}
        {onSearchChange !== undefined && (
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400 group-focus-within:text-[#1EB8D4] transition-colors" />
            </div>
            <input
              id="datatable-search-input"
              name="search"
              type="text"
              autoComplete="off"
              aria-label={`Search ${subtitle || 'items'}`}
              placeholder={`Search ${subtitle || 'items'}...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 border border-white/60 rounded-2xl leading-5 bg-white/50 backdrop-blur-md placeholder-stone-400 focus:outline-none focus:ring-0 focus:border-[#1EB8D4] focus:bg-white text-stone-800 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]"
            />
          </div>
        )}

        {/* Right Side: Custom Actions */}
        {headerActions && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {headerActions}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto scrollbar-none transform-gpu translate-z-0">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-[#F8FAFC] border-b border-stone-200">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`px-4 py-3 text-left text-[11px] font-bold text-stone-700 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#1EB8D4] animate-spin mb-4" />
                    <p className="text-stone-500 font-medium">Loading {subtitle || 'data'}...</p>
                  </div>
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-stone-400">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                    {searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-stone-200/80 bg-white/50 py-1">
          {footer}
        </div>
      )}
    </div>
  );
}
