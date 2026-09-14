import React from 'react';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';

// Card executing live server-side connection diagnostics against the Razorpay API
export default function TestConnectionCard({
  environment = 0,
  configured = false,
  testingConnection = false,
  onTestConnection,
  connectionStatus = 'not_tested',
  lastTestedAt = null
}) {
  return (
    <FormCard title="Test Connection" bodyClassName="p-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-normal">
            Test stored credentials for <span className="font-semibold text-slate-700">{environment === 0 ? 'Test Mode' : 'Live Mode'}</span> to verify Razorpay connectivity.
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-slate-700">Status:</span>
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#30702a] bg-emerald-50 px-2 py-0.5 rounded-md border border-[#4DA944]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4DA944]"></span>
                Connected
              </span>
            ) : connectionStatus === 'failed' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Connection Failed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                Not Tested
              </span>
            )}

            {!configured && (
              <span className="text-[11px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Save credentials first
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          disabled={testingConnection || !configured}
          onClick={onTestConnection}
          className="py-1.5 px-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {testingConnection ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4DA944]" />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-[#4DA944] text-[#4DA944]" />
              <span>Test Connection</span>
            </>
          )}
        </button>
      </div>

      {lastTestedAt && (
        <p className="text-[10px] text-slate-400 font-normal mt-2 border-t border-slate-100 pt-1.5">
          Last tested: {new Date(lastTestedAt).toLocaleString()}
        </p>
      )}
    </FormCard>
  );
}
