import React from 'react';
import { Plus, Sliders, AlertCircle } from 'lucide-react';
import TimePicker12h from './TimePicker12h';
import SocPricingTable from './SocPricingTable';

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const iconColor = isPeak ? 'text-rose-600' : 'text-sky-600';
  const headerBg = isPeak ? 'bg-rose-50/70 border-rose-200/80' : 'bg-sky-50/70 border-sky-200/80';
  const borderCard = isPeak ? 'border-rose-200/90' : 'border-sky-200/90';
  const badgeBg = isPeak ? 'bg-rose-100 text-rose-800 border-rose-300/80' : 'bg-sky-100 text-sky-800 border-sky-300/80';
  const addBtnBg = isPeak ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700';
  const focusBorder = isPeak ? 'focus-within:border-rose-600' : 'focus-within:border-sky-600';
  const fieldAddonBg = isPeak ? 'group-focus-within/field:bg-rose-600' : 'group-focus-within/field:bg-sky-600';

  return (
    <div className={`bg-white border ${borderCard} rounded-2xl overflow-hidden shadow-2xs`}>
      <div className={`${headerBg} border-b px-6 py-4 flex items-center justify-between`}>
        <div>
          <h2 className={`text-base font-extrabold ${isPeak ? 'text-rose-950' : 'text-sky-950'} tracking-tight flex items-center gap-2`}>
            <Sliders className={`w-4 h-4 ${iconColor} stroke-[2.5]`} /> {type} Pricing
          </h2>
          <p className={`text-xs ${isPeak ? 'text-rose-700/90' : 'text-sky-700/90'} font-medium mt-0.5`}>
            {isPeak ? 'Higher rates applied during high-demand peak hours.' : 'Discounted rates applied during off-peak hours.'}
          </p>
        </div>
        {!isViewMode && (
          <button
            type="button"
            onClick={onAddPeriod}
            className={`px-3.5 py-1.5 ${addBtnBg} text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95`}
          >
            <Plus className="w-3.5 h-3.5" /> Add {type} Period
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {periods.length === 0 ? (
          <div className="p-3.5 text-center text-xs font-medium text-stone-400 bg-stone-50/80 border border-dashed border-stone-200 rounded-xl">
            No {type} periods configured. Normal pricing applies 24/7.
          </div>
        ) : (
          periods.map((period) => {
            const hasError = Boolean(periodErrors[period.id]);
            const errorMessage = periodErrors[period.id];

            return (
              <div
                key={period.id}
                className={`border rounded-xl overflow-hidden shadow-2xs transition-all ${
                  hasError
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
                        onClick={() => onRemovePeriod(period.id)}
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
                    <label className="text-xs font-bold text-stone-700 mb-1 block">Start Time</label>
                    <TimePicker12h
                      disabled={isViewMode}
                      value={period.startTime}
                      onChange={(val) => onUpdatePeriodField(period.id, 'startTime', val)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 mb-1 block">End Time</label>
                    <TimePicker12h
                      disabled={isViewMode}
                      value={period.endTime}
                      onChange={(val) => onUpdatePeriodField(period.id, 'endTime', val)}
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
                          onClick={() => onToggleDay(period.id, day)}
                          className={`h-8 min-w-[42px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
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
                  onAdd={() => onAddSocRange(period.id)}
                  onUpdate={(socId, field, val) => onUpdateSocRange(period.id, socId, field, val)}
                  onRemove={(socId) => onRemoveSocRange(period.id, socId)}
                  isViewMode={isViewMode}
                  themeColor={isPeak ? 'rose' : 'sky'}
                />

                {/* Energy & Time Pricing */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-extrabold text-stone-900 tracking-tight uppercase">Energy & Time Pricing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <label className="text-xs font-bold text-stone-700 block">Energy Price</label>
                      <div className={`group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs ${focusBorder} transition-colors`}>
                        <input
                          type="number"
                          min="0"
                          disabled={isViewMode}
                          value={period.energyPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && parseFloat(val) < 0) return;
                            onUpdatePeriodField(period.id, 'energyPrice', val);
                          }}
                          className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                        />
                        <span className={`px-3 py-2 bg-stone-100 ${fieldAddonBg} group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150`}>₹ / kWh</span>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <label className="text-xs font-bold text-stone-700 block">Time Price</label>
                      <div className={`group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs ${focusBorder} transition-colors`}>
                        <input
                          type="number"
                          min="0"
                          disabled={isViewMode}
                          value={period.timePrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && parseFloat(val) < 0) return;
                            onUpdatePeriodField(period.id, 'timePrice', val);
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
      </div>
    </div>
  );
}
