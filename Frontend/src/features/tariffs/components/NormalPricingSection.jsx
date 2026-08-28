import React from 'react';
import { Zap, Info } from 'lucide-react';
import SocPricingTable from './SocPricingTable';

export default function NormalPricingSection({
  normalEnergyPrice,
  setNormalEnergyPrice,
  normalTimePrice,
  setNormalTimePrice,
  normalSocRanges,
  socErrors = {},
  addNormalSocRange,
  updateNormalSocRange,
  removeNormalSocRange,
  isViewMode
}) {
  return (
    <div className="bg-white border border-emerald-200/90 rounded-2xl overflow-hidden shadow-2xs">
      <div className="bg-emerald-50/70 border-b border-emerald-200/80 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> Normal Pricing
          </h2>
          <p className="text-xs text-emerald-700/90 font-medium mt-0.5">Default fallback pricing when neither Peak nor Off-Peak period is active.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
          NORMAL
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-900 font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>Normal pricing is the fallback tariff.</strong> It is automatically used whenever current time does not match any Peak or Off-Peak period.</span>
        </div>

        <SocPricingTable
          title="SOC Pricing"
          socRanges={normalSocRanges}
          socErrors={socErrors}
          onAdd={addNormalSocRange}
          onUpdate={updateNormalSocRange}
          onRemove={removeNormalSocRange}
          isViewMode={isViewMode}
          themeColor="emerald"
        />

        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold text-stone-900 tracking-tight uppercase">Energy & Time Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-stone-700 block">Energy Price</label>
              <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-emerald-600 transition-colors">
                <input
                  type="number"
                  min="0"
                  disabled={isViewMode}
                  value={normalEnergyPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== '' && parseFloat(val) < 0) return;
                    setNormalEnergyPrice(val);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                />
                <span className="px-3 py-2 bg-stone-100 group-focus-within/field:bg-emerald-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">₹ / kWh</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-stone-700 block">Time Price</label>
              <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-emerald-600 transition-colors">
                <input
                  type="number"
                  min="0"
                  disabled={isViewMode}
                  value={normalTimePrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== '' && parseFloat(val) < 0) return;
                    setNormalTimePrice(val);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                />

                <span className="px-3 py-2 bg-stone-100 group-focus-within/field:bg-emerald-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">₹ / min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
