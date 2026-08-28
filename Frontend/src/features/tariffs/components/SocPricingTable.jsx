import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

export default function SocPricingTable({
  title = "SOC Pricing",
  socRanges = [],
  socErrors = {},
  onAdd,
  onUpdate,
  onRemove,
  isViewMode = false,
  themeColor = "emerald"
}) {
  const badgeColorClass = themeColor === 'rose'
    ? 'group-focus-within/field:text-rose-600'
    : themeColor === 'sky'
    ? 'group-focus-within/field:text-sky-600'
    : 'group-focus-within/field:text-emerald-600';

  const priceBadgeBg = themeColor === 'rose'
    ? 'group-focus-within/field:bg-rose-600'
    : themeColor === 'sky'
    ? 'group-focus-within/field:bg-sky-600'
    : 'group-focus-within/field:bg-emerald-600';

  const handleSocBoundChange = (socId, field, rawValue) => {
    if (rawValue === '') {
      onUpdate(socId, field, '');
      return;
    }
    let val = parseInt(rawValue, 10);
    if (isNaN(val)) return;
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    onUpdate(socId, field, String(val));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-stone-900 tracking-tight uppercase">{title}</h3>
        {!isViewMode && (
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-stone-600" /> Add SOC Range
          </button>
        )}
      </div>

      {socRanges.length === 0 ? (
        <div className="p-3 text-center text-xs font-medium text-stone-400 bg-stone-50/80 border border-dashed border-stone-200 rounded-xl">
          No SOC ranges configured (Flat energy rate applies to 0–100%).
        </div>
      ) : (
        <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
              <tr>
                <th className="py-2.5 px-4">SOC From</th>
                <th className="py-2.5 px-4">SOC To</th>
                <th className="py-2.5 px-4">Price</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800 font-medium bg-white">
              {socRanges.map(r => {
                const hasErr = Boolean(socErrors[r.id]);
                const errText = socErrors[r.id];

                return (
                  <React.Fragment key={r.id}>
                    <tr className={hasErr ? 'bg-rose-50/40' : ''}>
                      <td className="py-2 px-4">
                        <div className="group/field flex items-center gap-1.5 w-28">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={isViewMode}
                            value={r.from}
                            onChange={(e) => handleSocBoundChange(r.id, 'from', e.target.value)}
                            className={`w-full px-2.5 py-1.5 bg-stone-50 border ${hasErr ? 'border-rose-400 text-rose-900 bg-rose-50' : 'border-stone-200'} rounded-lg text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none transition-colors`}
                          />
                          <span className={`text-stone-400 ${badgeColorClass} font-bold text-xs transition-colors duration-150`}>%</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="group/field flex items-center gap-1.5 w-28">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={isViewMode}
                            value={r.to}
                            onChange={(e) => handleSocBoundChange(r.id, 'to', e.target.value)}
                            className={`w-full px-2.5 py-1.5 bg-stone-50 border ${hasErr ? 'border-rose-400 text-rose-900 bg-rose-50' : 'border-stone-200'} rounded-lg text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none transition-colors`}
                          />
                          <span className={`text-stone-400 ${badgeColorClass} font-bold text-xs transition-colors duration-150`}>%</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="group/field flex items-center w-32 border border-stone-200 rounded-lg overflow-hidden bg-stone-50 focus-within:border-slate-800 focus-within:bg-white transition-colors">
                          <input
                            type="number"
                            min="0"
                            disabled={isViewMode}
                            value={r.price}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== '' && parseFloat(val) < 0) return;
                              onUpdate(r.id, 'price', val);
                            }}
                            className="w-full px-2.5 py-1.5 bg-transparent text-xs font-bold focus:outline-none"
                          />

                          <span className={`px-2 py-1.5 bg-stone-100 ${priceBadgeBg} group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-[11px] transition-colors duration-150`}>₹</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => onRemove(r.id)}
                            className="text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer p-1 rounded-md hover:bg-rose-50 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                    {hasErr && (
                      <tr className="bg-rose-50/70 border-b border-rose-100">
                        <td colSpan="4" className="px-4 py-1.5 text-[11px] font-extrabold text-rose-700">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{errText}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
