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
    <FormCard title="Provider Selection" bodyClassName="p-3.5">
      <div className="space-y-2">
        {/* Provider dropdown selector */}
        <div className="space-y-1">
          <label htmlFor="active-payment-provider" className="text-xs font-semibold text-slate-700 block">Payment Provider</label>
          <Select
            id="active-payment-provider"
            name="paymentProvider"
            options={providers.map((p) => ({ value: p.id, label: p.name }))}
            value={selectedProvider}
            onChange={(e) => onSelectProvider(e.target.value)}
            className="w-full"
            buttonClassName="py-2 px-3 text-xs bg-stone-50 border-stone-200"
          />
        </div>

        {/* Configuration status indicator badge */}
        <div className="pt-0.5">
          {configured ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#148296]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1EB8D4]"></span>
              Active ({environment === 0 ? 'Test Mode' : 'Live Mode'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              Not Configured ({environment === 0 ? 'Test Mode' : 'Live Mode'})
            </span>
          )}
        </div>
      </div>
    </FormCard>
  );
}
