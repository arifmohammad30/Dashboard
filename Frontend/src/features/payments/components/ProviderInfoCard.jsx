import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';

// Card displaying provider brand details, description, website link, and supported features
export default function ProviderInfoCard({ provider }) {
  if (!provider) return null;

  return (
    <FormCard title="Provider Information">
      <div className="space-y-3">
        {/* Provider logo and name */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base">
            {provider.logo}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">{provider.name}</h4>
          </div>
        </div>

        {/* Short provider description */}
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {provider.desc}
        </p>

        {/* External website link */}
        {provider.website && (
          <div>
            <a
              href={provider.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#4DA944] hover:text-[#3f8b37] flex items-center gap-1 transition-colors"
            >
              <span>Website: {provider.website}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* List of supported payment features */}
        {provider.features && provider.features.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Supported Features
            </h5>
            <ul className="space-y-1.5 text-xs font-semibold text-slate-600">
              {provider.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4DA944] shrink-0" />
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
