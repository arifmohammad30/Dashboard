import React from 'react';
import FormCard from '../../../components/ui/FormCard';
import Select from '../../../components/ui/Select';

// Card allowing admin to select the active payment provider and see configuration status
export default function ProviderSelectionCard({
  providers = [],
  selectedProvider,
  onSelectProvider,
  configured = false,
  environment = 0
}) {
  return (
    <FormCard title="Provider Selection">
      <div className="space-y-3">
        {/* Provider dropdown selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Payment Provider</label>
          <Select
            options={providers.map((p) => ({ value: p.id, label: p.name }))}
            value={selectedProvider}
            onChange={(e) => onSelectProvider(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Configuration status indicator badge */}
        <div className="pt-0.5">
          {configured ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4DA944] animate-pulse"></span>
              Active ({environment === 0 ? 'Test' : 'Live'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              Not Configured ({environment === 0 ? 'Test' : 'Live'})
            </span>
          )}
        </div>
      </div>
    </FormCard>
  );
}
