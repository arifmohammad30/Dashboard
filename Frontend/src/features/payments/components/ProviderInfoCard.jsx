import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';

// Card displaying provider brand details, description, website link, and supported features
export default function ProviderInfoCard({ provider }) {
  if (!provider) return null;

  return (
    <FormCard title="Provider Information" bodyClassName="p-3.5">
      <div className="space-y-2.5">
        {/* Provider logo and name */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs">
            {provider.logo}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">{provider.name}</h4>
          </div>
        </div>

        {/* Short provider description */}
        <p className="text-[11px] text-slate-500 leading-normal font-normal">
          {provider.desc}
        </p>

        {/* External website link */}
        {provider.website && (
          <div>
            <a
              href={provider.website}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-[#1EB8D4] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>Website: {provider.website}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* List of supported payment features */}
        {provider.features && provider.features.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h5 className="text-[11px] font-semibold text-slate-700">
              Supported Features
            </h5>
            <ul className="space-y-1 text-[11px] text-slate-600 font-normal">
              {provider.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[#1EB8D4] shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FormCard>
  );
}
