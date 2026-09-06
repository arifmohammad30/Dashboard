import React from 'react';
import { Percent } from 'lucide-react';
import Select from '../../../components/ui/Select';
import TariffSectionCard from './TariffSectionCard';

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
    <TariffSectionCard
      title="GST & Parking"
      subtitle="Configure taxes and parking charges for charging sessions."
      icon={Percent}
      badgeText="TAXES & PARKING"
      colorTheme="blue"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="gstPercentage" className="text-xs font-bold text-stone-700 mb-1.5 block">
            GST Percentage (%) <span className="text-rose-500">*</span>
          </label>
          <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition-colors shadow-2xs">
            <input
              id="gstPercentage"
              name="gstPercentage"
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
            <label htmlFor="enableParkingFee" className="text-xs font-bold text-stone-900 block cursor-pointer">Enable Parking Fee</label>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">Charge idle/parking fees when charger is occupied.</p>
          </div>
          <input
            id="enableParkingFee"
            name="enableParkingFee"
            type="checkbox"
            disabled={isViewMode}
            checked={enableParkingFee}
            onChange={(e) => setEnableParkingFee(e.target.checked)}
            className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
          />
        </div>
      </div>

      {enableParkingFee && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-stone-200/80 animate-in fade-in duration-150">
          <div>
            <label htmlFor="parkingFee" className="text-xs font-bold text-stone-700 mb-1.5 block">Parking Fee (₹/hr)</label>
            <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition-colors shadow-2xs">
              <input
                id="parkingFee"
                name="parkingFee"
                type="number"
                min="0"
                disabled={isViewMode}
                value={parkingFee}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== '' && parseFloat(val) < 0) return;
                  setParkingFee(val);
                }}
                placeholder="50"
                className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
              />
              <span className="px-3 py-2 bg-stone-100 group-focus-within/field:bg-blue-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">₹ / hr</span>
            </div>
          </div>

          <div>
            <label htmlFor="parkingGracePeriod" className="text-xs font-bold text-stone-700 mb-1.5 block">Grace Period (Mins)</label>
            <div className="group/field flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition-colors shadow-2xs">
              <input
                id="parkingGracePeriod"
                name="parkingGracePeriod"
                type="number"
                min="0"
                disabled={isViewMode}
                value={parkingGracePeriod}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== '' && parseFloat(val) < 0) return;
                  setParkingGracePeriod(val);
                }}
                placeholder="15"
                className="w-full px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
              />
              <span className="px-3 py-2 bg-stone-100 group-focus-within/field:bg-blue-600 group-focus-within/field:text-white border-l border-stone-200 text-stone-500 font-bold text-xs whitespace-nowrap transition-colors duration-150">mins</span>
            </div>
          </div>

          <div>
            <label htmlFor="parkingChargeStarts" className="text-xs font-bold text-stone-700 mb-1.5 block">Parking Charge Starts</label>
            <Select
              id="parkingChargeStarts"
              name="parkingChargeStarts"
              disabled={isViewMode}
              value={parkingChargeStarts}
              onChange={(e) => setParkingChargeStarts(e.target.value)}
              options={['After Charging Completes', 'Immediately on Plug-in']}
              buttonClassName="py-2 px-3 text-xs bg-stone-50 border-stone-200"
            />
          </div>
        </div>
      )}
    </TariffSectionCard>
  );
}
