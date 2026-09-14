import React from 'react';
import { Plus, Sliders, AlertCircle } from 'lucide-react';
import TimePicker12h from './TimePicker12h';
import SocPricingTable from './SocPricingTable';
import TariffSectionCard from './TariffSectionCard';

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Special Time-of-Day (ToD) Period Section Component
 * Handles configuration for Peak (higher surge demand pricing) and Off-Peak (discounted night/weekend pricing) windows.
 * Includes time interval pickers, multi-day selectors (Mon-Sun), energy/time prices, nested SOC tiers, and visual overlap error badges.
 */
export default function SpecialPeriodSection({
  type = 'Peak', // 'Peak' | 'Off-Peak'
  periods = [],
  periodErrors = {},
  socErrors = {},
  onAddPeriod,
  onRemovePeriod,
  onToggleDay,
  onUpdatePeriodField,
  onAddSocRange,
  onUpdateSocRange,
  onRemoveSocRange,
  isViewMode
}) {
  const isPeak = type === 'Peak';

  const badgeBg = isPeak ? 'bg-rose-100 text-rose-800 border-rose-300/80' : 'bg-sky-100 text-sky-800 border-sky-300/80';
  const addBtnBg = isPeak ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700';
  const focusBorder = isPeak ? 'focus-within:border-rose-600' : 'focus-within:border-sky-600';
  const fieldAddonBg = isPeak ? 'group-focus-within/field:bg-rose-600' : 'group-focus-within/field:bg-sky-600';

  const addAction = !isViewMode ? (
    <button
      type="button"
      onClick={onAddPeriod}
      className={`px-3.5 py-1.5 ${addBtnBg} text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95`}
    >
      <Plus className="w-3.5 h-3.5" /> Add {type} Period
    </button>
  ) : null;

  return (
    <TariffSectionCard
      title={`${type} Pricing`}
      subtitle={isPeak ? 'Higher rates applied during high-demand peak hours.' : 'Discounted rates applied during off-peak hours.'}
      icon={Sliders}
      action={addAction}
      colorTheme={isPeak ? 'rose' : 'sky'}
    >
      {periods.length === 0 ? (
        <div className="p-3.5 text-center text-xs font-medium text-stone-400 bg-stone-50/80 border border-dashed border-stone-200 rounded-xl">
          No {type} periods configured. Normal pricing applies 24/7.
        </div>
      ) : (
        periods.map((period, periodIndex) => {
          const periodKey = period.id || `${type}_${periodIndex}`;
          const hasError = Boolean((period.id && periodErrors[period.id]) || periodErrors[periodKey]);
          const errorMessage = (period.id ? periodErrors[period.id] : null) || periodErrors[periodKey];

          return (
            <div
              key={periodKey}
              className={`border rounded-xl overflow-hidden shadow-2xs transition-all ${hasError
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                  : isPeak ? 'border-rose-200/80' : 'border-sky-200/80'
                }`}
            >
              <div className={`${hasError ? 'bg-rose-100/70 border-rose-300' : isPeak ? 'bg-rose-50/50 border-rose-200/80' : 'bg-sky-50/50 border-sky-200/80'} px-4 py-3 border-b flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold ${hasError ? 'text-rose-950' : isPeak ? 'text-rose-900' : 'text-sky-900'}`}>{period.title}</span>
                  {hasError && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Time Overlap Error
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${badgeBg}`}>{type.toUpperCase()}</span>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => onRemovePeriod(periodIndex)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {hasError && (
                <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-4 space-y-4 bg-white">
                {/* Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`start-time-${period.id || periodIndex}`} className="text-xs font-bold text-stone-700 mb-1 block">Start Time</label>
                    <TimePicker12h
                      id={`start-time-${period.id || periodIndex}`}
                      name={`start_time_${period.id || periodIndex}`}
                      disabled={isViewMode}
                      value={period.startTime}
                      onChange={(val) => onUpdatePeriodField(periodIndex, 'startTime', val)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`end-time-${period.id || periodIndex}`} className="text-xs font-bold text-stone-700 mb-1 block">End Time</label>
                    <TimePicker12h
                      id={`end-time-${period.id || periodIndex}`}
                      name={`end_time_${period.id || periodIndex}`}
                      disabled={isViewMode}
                      value={period.endTime}
                      onChange={(val) => onUpdatePeriodField(periodIndex, 'endTime', val)}
                    />
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className="text-xs font-bold text-stone-700 mb-1.5 block">Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_DAYS.map(day => {
                      const isSelected = period.days?.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isViewMode}
                          onClick={() => onToggleDay(periodIndex, day)}
                          className={`h-8 min-w-[42px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SOC Section */}
                <SocPricingTable
                  title="SOC Pricing"
                  socRanges={period.socRanges || []}
                  socErrors={socErrors}
                  errorKeyPrefix={period.id || `${type}_${periodIndex}`}
                  onAdd={() => onAddSocRange(periodIndex)}
                  onUpdate={(socIndex, field, val) => onUpdateSocRange(periodIndex, socIndex, field, val)}
                  onRemove={(socIndex) => onRemoveSocRange(periodIndex, socIndex)}
                  isViewMode={isViewMode}
                  themeColor={isPeak ? 'rose' : 'sky'}
                />

                {/* Energy & Time Pricing */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-extrabold text-stone-900 tracking-tight uppercase">Energy & Time Pricing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <label htmlFor={`energy-price-${period.id || periodIndex}`} className="text-xs font-bold text-stone-700 block">Energy Price</label>
                      <div className={`group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs ${focusBorder} transition-colors`}>
                        <input
                          id={`energy-price-${period.id || periodIndex}`}
                          name={`energy_price_${period.id || periodIndex}`}
                          type="number"
                          min="0"
                          disabled={isViewMode}
                          value={period.energyPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && parseFloat(val) < 0) return;
                            onUpdatePeriodField(periodIndex, 'energyPrice', val);
                          }}
                          className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                        />
                        <span className={`px-3 py-2 bg-stone-100 ${fieldAddonBg} group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150`}>₹ / kWh</span>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <label htmlFor={`time-price-${period.id || periodIndex}`} className="text-xs font-bold text-stone-700 block">Time Price</label>
                      <div className={`group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs ${focusBorder} transition-colors`}>
                        <input
                          id={`time-price-${period.id || periodIndex}`}
                          name={`time_price_${period.id || periodIndex}`}
                          type="number"
                          min="0"
                          disabled={isViewMode}
                          value={period.timePrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && parseFloat(val) < 0) return;
                            onUpdatePeriodField(periodIndex, 'timePrice', val);
                          }}
                          className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                        />

                        <span className={`px-3 py-2 bg-stone-100 ${fieldAddonBg} group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150`}>₹ / min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </TariffSectionCard>
  );
}
