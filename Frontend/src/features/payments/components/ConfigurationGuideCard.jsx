import React from 'react';
import { ExternalLink } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';

// Card displaying quick setup steps and links to official documentation
export default function ConfigurationGuideCard({
  environment = 0,
  docsUrl = 'https://razorpay.com/docs/payments/server-integration/nodejs'
}) {
  return (
    <FormCard title="Configuration Guide" bodyClassName="p-3.5">
      <div className="space-y-2">
        {/* Step-by-step numbered checklist */}
        <ol className="space-y-1 text-[11px] font-normal text-slate-600">
          <li className="flex gap-1.5">
            <span className="font-semibold text-slate-700">1.</span>
            <span>Log in to your <span className="font-semibold text-slate-700">{environment === 0 ? 'Test' : 'Live'}</span> dashboard</span>
          </li>
          <li className="flex gap-1.5">
            <span className="font-semibold text-slate-700">2.</span>
            <span>Go to <span className="font-semibold text-slate-700">Settings &gt; API Keys</span></span>
          </li>
          <li className="flex gap-1.5">
            <span className="font-semibold text-slate-700">3.</span>
            <span>Copy Key ID and Secret into this form</span>
          </li>
          <li className="flex gap-1.5">
            <span className="font-semibold text-slate-700">4.</span>
            <span>Click <span className="font-semibold text-slate-700">Save Changes</span></span>
          </li>
          <li className="flex gap-1.5">
            <span className="font-semibold text-slate-700">5.</span>
            <span>Click <span className="font-semibold text-slate-700">Test Connection</span> to verify</span>
          </li>
        </ol>

        {/* Documentation link */}
        <div className="pt-2 border-t border-slate-100">
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-[#4DA944] hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <span>View Razorpay Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </FormCard>
  );
}
