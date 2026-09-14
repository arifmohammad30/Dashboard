import React from 'react';
import { Layers } from 'lucide-react';
import Select from '../../../components/ui/Select';
import TariffSectionCard from './TariffSectionCard';

/**
 * Tariff Basic Information Section Component
 * Handles tariff name input and status selection (Active, Draft, Inactive).
 */
export default function TariffBasicInfoSection({
  tariffName,
  setTariffName,
  status,
  setStatus,
  isViewMode
}) {
  return (
    <TariffSectionCard
      title="Basic Information"
      subtitle="Define the tariff title, status, and baseline properties."
      icon={Layers}
      badgeText="GENERAL"
      colorTheme="slate"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="tariffName" className="text-xs font-bold text-stone-700 mb-1.5 block">
            Tariff Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="tariffName"
            name="tariffName"
            type="text"
            disabled={isViewMode}
            value={tariffName}
            onChange={(e) => setTariffName(e.target.value)}
            placeholder="Enter tariff name (e.g. Public Charging Tariff)"
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        <div>
          <label htmlFor="status" className="text-xs font-bold text-stone-700 mb-1.5 block">
            Status <span className="text-rose-500">*</span>
          </label>
          <Select
            id="status"
            name="status"
            disabled={isViewMode}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={['Active', 'Draft', 'Inactive']}
            placeholder="Select Status"
            buttonClassName="py-2.5 px-3.5 text-xs bg-stone-50 border-stone-200"
          />
        </div>
      </div>
    </TariffSectionCard>
  );
}
