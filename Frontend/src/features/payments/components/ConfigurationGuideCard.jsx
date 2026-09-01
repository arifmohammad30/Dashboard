import React from 'react';
import { ExternalLink } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';

// Card displaying quick setup steps and links to official documentation
export default function ConfigurationGuideCard({
  environment = 0,
  docsUrl = 'https://razorpay.com/docs/payments/server-integration/nodejs'
}) {
  return (
    <FormCard title="Configuration Guide">
      <div className="space-y-3">
        {/* Step-by-step numbered checklist */}
        <ol className="space-y-2 text-xs font-medium text-slate-600">
          <li className="flex gap-2">
            <span className="font-bold text-slate-800">1.</span>
            <span>Login to your <strong>{environment === 0 ? 'Razorpay Test' : 'Razorpay Live'}</strong> dashboard</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-slate-800">2.</span>
            <span>Go to <strong>Settings &gt; API Keys</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-slate-800">3.</span>
            <span>Copy Key ID and Secret into this form</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-slate-800">4.</span>
            <span>Click <strong>Save Changes</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-slate-800">5.</span>
            <span>Click <strong>Test Connection</strong> to verify</span>
          </li>
        </ol>

        {/* Documentation link */}
        <div className="pt-2 border-t border-slate-100">
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-[#4DA944] hover:text-[#3f8b37] inline-flex items-center gap-1 transition-colors"
          >
            <span>View Razorpay Documentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </FormCard>
  );
}
