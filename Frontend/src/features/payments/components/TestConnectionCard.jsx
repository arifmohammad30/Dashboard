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
    <FormCard title="Test Connection">
      <div className="space-y-3">
        {/* Descriptive guidance */}
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Test stored credentials for <strong>{environment === 0 ? 'Test Mode' : 'Live Mode'}</strong> to verify connectivity with Razorpay.
        </p>

        {/* Action button triggering POST /api/payments/gateways/:provider/test-connection */}
        <button
          type="button"
          disabled={testingConnection || !configured}
          onClick={onTestConnection}
          className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-[#4DA944] text-[#30702a] font-bold rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testingConnection ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4DA944]" />
              <span>Pinging Razorpay API...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-[#4DA944] text-[#4DA944]" />
              <span>Test {environment === 0 ? 'Test' : 'Live'} Connection</span>
            </>
          )}
        </button>

        {/* Warning banner when credentials are not yet saved */}
        {!configured && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>Save credentials first to test connection.</span>
          </div>
        )}

        {/* Status display row */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-700">Connection Status</span>
          {connectionStatus === 'connected' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-[#4DA944]"></span>
              Connected
            </span>
          ) : connectionStatus === 'failed' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              Not tested yet
            </span>
          )}
        </div>

        {/* Timestamp of the last test execution */}
        {lastTestedAt && (
          <div className="text-[11px] text-slate-400 font-medium text-right">
            Last tested: {new Date(lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </FormCard>
  );
}
