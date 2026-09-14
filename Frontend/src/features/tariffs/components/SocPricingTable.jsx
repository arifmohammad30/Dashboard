
import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

/**
 * State of Charge (SOC) Tiered Pricing Table Component
 * Enables fine-grained battery percentage pricing (e.g. 0-80% @ ₹14/kWh, 80-100% @ ₹18/kWh).
 * Includes inline boundary checks, overlap error display, add/delete range rows, and theme styling.
 */
export default function SocPricingTable({
  title = 'SOC Pricing',
  socRanges = [],
  socErrors = {},
  errorKeyPrefix = '',
  onAdd,
  onUpdate,
  onRemove,
  isViewMode = false,
  themeColor = 'emerald'
}) {
  const badgeColorClass =
    themeColor === 'rose'
      ? 'group-focus-within/field:text-rose-600'
      : themeColor === 'sky'
        ? 'group-focus-within/field:text-sky-600'
        : 'group-focus-within/field:text-emerald-600';

  const priceBadgeBg =
    themeColor === 'rose'
      ? 'group-focus-within/field:bg-rose-600'
      : themeColor === 'sky'
        ? 'group-focus-within/field:bg-sky-600'
        : 'group-focus-within/field:bg-emerald-600';

  const handleSocBoundChange = (index, field, rawValue) => {
    if (rawValue === '') {
      onUpdate(index, field, '');
      return;
    }

    let value = parseInt(rawValue, 10);

    if (Number.isNaN(value)) {
      return;
    }

    value = Math.min(100, Math.max(0, value));

    onUpdate(index, field, String(value));
  };

  const handlePriceChange = (index, rawValue) => {
    if (rawValue === '') {
      onUpdate(index, 'price', '');
      return;
    }

    const value = parseFloat(rawValue);

    if (Number.isNaN(value) || value < 0) {
      return;
    }

    onUpdate(index, 'price', rawValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-stone-900 tracking-tight uppercase">
          {title}
        </h3>

        {!isViewMode && (
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-1.5 bg-[#4DA944]/10 hover:bg-[#4DA944]/20 text-[#30702a] border border-[#4DA944]/30 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#4DA944]" />
            Add SOC Range
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
              {socRanges.map((range, index) => {
                const rowKey = range.id || `soc-row-${index}`;

                /*
                 * Existing rows use their backend ID.
                 * New rows use their current array index.
                 */
                const errorKey = range.id || `${errorKeyPrefix}_soc_${index}`;
                const errorMessage = socErrors[errorKey];
                const hasError = Boolean(errorMessage);

                return (
                  <React.Fragment key={rowKey}>
                    <tr className={hasError ? 'bg-rose-50/40' : ''}>
                      {/* SOC FROM */}
                      <td className="py-2 px-4">
                        <div className="group/field flex items-center gap-1.5 w-28">
                          <input
                            id={`soc-from-${range.id || index}`}
                            name={`soc_from_${range.id || index}`}
                            aria-label="SOC From %"
                            type="number"
                            min="0"
                            max="100"
                            disabled={isViewMode}
                            value={range.from}
                            onChange={(e) =>
                              handleSocBoundChange(
                                index,
                                'from',
                                e.target.value
                              )
                            }
                            className={`w-full px-2.5 py-1.5 bg-stone-50 border ${hasError
                              ? 'border-rose-400 text-rose-900 bg-rose-50'
                              : 'border-stone-200'
                              } rounded-lg text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none transition-colors`}
                          />

                          <span
                            className={`text-stone-400 ${badgeColorClass} font-bold text-xs transition-colors duration-150`}
                          >
                            %
                          </span>
                        </div>
                      </td>

                      {/* SOC TO */}
                      <td className="py-2 px-4">
                        <div className="group/field flex items-center gap-1.5 w-28">
                          <input
                            id={`soc-to-${range.id || index}`}
                            name={`soc_to_${range.id || index}`}
                            aria-label="SOC To %"
                            type="number"
                            min="0"
                            max="100"
                            disabled={isViewMode}
                            value={range.to}
                            onChange={(e) =>
                              handleSocBoundChange(
                                index,
                                'to',
                                e.target.value
                              )
                            }
                            className={`w-full px-2.5 py-1.5 bg-stone-50 border ${hasError
                              ? 'border-rose-400 text-rose-900 bg-rose-50'
                              : 'border-stone-200'
                              } rounded-lg text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none transition-colors`}
                          />

                          <span
                            className={`text-stone-400 ${badgeColorClass} font-bold text-xs transition-colors duration-150`}
                          >
                            %
                          </span>
                        </div>
                      </td>

                      {/* PRICE */}
                      <td className="py-2 px-4">
                        <div className="group/field flex items-center w-32 border border-stone-200 rounded-lg overflow-hidden bg-stone-50 focus-within:border-slate-800 focus-within:bg-white transition-colors">
                          <input
                            id={`soc-price-${range.id || index}`}
                            name={`soc_price_${range.id || index}`}
                            aria-label="SOC Price ₹"
                            type="number"
                            min="0"
                            disabled={isViewMode}
                            value={range.price}
                            onChange={(e) =>
                              handlePriceChange(index, e.target.value)
                            }
                            className="w-full px-2.5 py-2 bg-transparent text-xs font-bold focus:outline-none"
                          />

                          <span
                            className={`px-2 py-1.5 bg-stone-100 ${priceBadgeBg} group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-[11px] transition-colors duration-150`}
                          >
                            ₹
                          </span>
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="py-2 px-4 text-right">
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer p-1 rounded-md hover:bg-rose-50 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* ERROR */}
                    {hasError && (
                      <tr className="bg-rose-50/70 border-b border-rose-100">
                        <td
                          colSpan="4"
                          className="px-4 py-1.5 text-[11px] font-extrabold text-rose-700"
                        >
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{errorMessage}</span>
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

