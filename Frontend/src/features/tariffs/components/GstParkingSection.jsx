import React from 'react';
import { Percent } from 'lucide-react';
import Select from '../../../components/ui/Select';

export default function GstParkingSection({
  gstPercentage,
  setGstPercentage,
  enableParkingFee,
  setEnableParkingFee,
  parkingFee,
  setParkingFee,
  parkingGracePeriod,
  setParkingGracePeriod,
  parkingChargeStarts,
  setParkingChargeStarts,
  isViewMode
}) {
  return (
    <div className="bg-white border border-blue-200/90 rounded-2xl overflow-hidden shadow-2xs">
      <div className="bg-blue-50/70 border-b border-blue-200/80 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-blue-950 tracking-tight flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-600 stroke-[2.5]" /> GST & Parking
          </h2>
          <p className="text-xs text-blue-700/90 font-medium mt-0.5">Configure taxes and parking charges for charging sessions.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300/80">
          TAXES & PARKING
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-stone-700 mb-1.5 block">
              GST Percentage (%) <span className="text-rose-500">*</span>
            </label>
            <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition-colors shadow-2xs">
              <input
                type="number"
                min="0"
                max="100"
                disabled={isViewMode}
                value={gstPercentage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== '' && (parseFloat(val) < 0 || parseFloat(val) > 100)) return;
                  setGstPercentage(val);
                }}
                placeholder="18"
                className="w-full px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:outline-none"
              />
              <span className="px-3 py-2.5 bg-stone-100 group-focus-within/field:bg-blue-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-stone-900 block">Enable Parking Fee</label>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">Charge idle/parking fees when charger is occupied.</p>
            </div>
            <input
              type="checkbox"
              disabled={isViewMode}
              checked={enableParkingFee}
              onChange={(e) => setEnableParkingFee(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {enableParkingFee && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Parking Fee</label>
              <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition-colors shadow-2xs">
                <input
                  type="number"
                  min="0"
                  disabled={isViewMode}
                  value={parkingFee}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== '' && parseFloat(val) < 0) return;
                    setParkingFee(val);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                />
                <span className="px-3 py-2 bg-stone-100 group-focus-within/field:bg-blue-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">₹ / min</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Grace Period</label>
              <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition-colors shadow-2xs">
                <input
                  type="number"
                  min="0"
                  disabled={isViewMode}
                  value={parkingGracePeriod}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== '' && parseFloat(val) < 0) return;
                    setParkingGracePeriod(val);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                />

                <span className="px-3 py-2 bg-stone-100 group-focus-within/field:bg-blue-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">min</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Parking Charge Starts</label>
              <Select
                disabled={isViewMode}
                value={parkingChargeStarts}
                onChange={(e) => setParkingChargeStarts(e.target.value)}
                options={['After Charging Completes', 'Immediately on Plug-in']}
                buttonClassName="py-2 px-3 text-xs bg-stone-50 border-stone-200"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
