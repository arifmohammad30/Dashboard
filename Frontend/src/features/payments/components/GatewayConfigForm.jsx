import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';
import Select from '../../../components/ui/Select';

// Main gateway credentials, keys, currencies, and policy configuration form
export default function GatewayConfigForm({
  environment = 0,
  onEnvironmentSwitch,
  formData = {},
  onFieldChange,
  newKeySecret = '',
  setNewKeySecret,
  newWebhookSecret = '',
  setNewWebhookSecret,
  isChangingKeySecret = false,
  setIsChangingKeySecret,
  isChangingWebhookSecret = false,
  setIsChangingWebhookSecret,
  currencyOptions = [],
  onCopyWebhookUrl,
  copiedUrl = false
}) {
  // Local state for toggling password visibility and accordion
  const [showNewSecret, setShowNewSecret] = useState(false);
  const [showNewWebhookSecret, setShowNewWebhookSecret] = useState(false);
  const [showAdditionalSettings, setShowAdditionalSettings] = useState(false);

  return (
    <FormCard title="Configuration">
      <div className="space-y-4">
        
        {/* Row 1: Environment Selector & Display Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Environment</label>
            <div className="inline-flex p-1 bg-slate-50/90 rounded-2xl border border-stone-200/80 gap-1.5 w-full">
              {/* Test Mode Button (environment = 0) */}
              <button
                type="button"
                onClick={() => onEnvironmentSwitch(0)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
                  environment === 0
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${environment === 0 ? 'bg-[#4DA944]' : 'bg-stone-300'}`} />
                <span>Test Mode</span>
              </button>

              {/* Live Mode Button (environment = 1) */}
              <button
                type="button"
                onClick={() => onEnvironmentSwitch(1)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
                  environment === 1
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${environment === 1 ? 'bg-[#4DA944]' : 'bg-stone-300'}`} />
                <span>Live Mode</span>
              </button>
            </div>
          </div>

          {/* Merchant Display Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Display Name</label>
            <input
              type="text"
              value={formData.displayName || ''}
              onChange={(e) => onFieldChange('displayName', e.target.value)}
              placeholder={environment === 0 ? 'e.g. Razorpay (Test)' : 'e.g. Razorpay (Live)'}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#4DA944] focus:ring-2 focus:ring-[#4DA944]/15 transition"
            />
          </div>
        </div>

        {/* Row 2: Key ID & Key Secret */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Key ID Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">Key ID (apiKey)</label>
              {formData.configured && formData.keyId?.includes('****') && (
                <span className="text-[10px] font-bold text-slate-400">Masked</span>
              )}
            </div>
            <input
              type="text"
              value={formData.keyId || ''}
              onChange={(e) => onFieldChange('keyId', e.target.value)}
              placeholder={environment === 0 ? 'rzp_test_...' : 'rzp_live_...'}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#4DA944] focus:ring-2 focus:ring-[#4DA944]/15 transition"
            />
          </div>

          {/* Key Secret Field with Replace Flow */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">Key Secret (apiSecret)</label>
              {formData.hasKeySecret && !isChangingKeySecret && (
                <button
                  type="button"
                  onClick={() => setIsChangingKeySecret(true)}
                  className="text-[10px] font-bold text-[#4DA944] hover:text-[#3f8b37] cursor-pointer"
                >
                  Change Secret
                </button>
              )}
              {isChangingKeySecret && (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingKeySecret(false);
                    setNewKeySecret('');
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {formData.hasKeySecret && !isChangingKeySecret ? (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <span className="text-xs font-mono text-slate-500 tracking-wider">••••••••••••••••</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Lock className="w-3 h-3 text-[#4DA944]" />
                  Configured
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showNewSecret ? 'text' : 'password'}
                  value={newKeySecret}
                  onChange={(e) => setNewKeySecret(e.target.value)}
                  placeholder={formData.hasKeySecret ? 'Enter new Key Secret to replace' : 'Enter Razorpay Key Secret'}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-xs font-mono font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#4DA944] focus:ring-2 focus:ring-[#4DA944]/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewSecret(!showNewSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showNewSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Webhook Secret & Webhook URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Webhook Secret Field with Replace Flow */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">Webhook Secret</label>
              {formData.hasWebhookSecret && !isChangingWebhookSecret && (
                <button
                  type="button"
                  onClick={() => setIsChangingWebhookSecret(true)}
                  className="text-[10px] font-bold text-[#4DA944] hover:text-[#3f8b37] cursor-pointer"
                >
                  Change Secret
                </button>
              )}
              {isChangingWebhookSecret && (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingWebhookSecret(false);
                    setNewWebhookSecret('');
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {formData.hasWebhookSecret && !isChangingWebhookSecret ? (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <span className="text-xs font-mono text-slate-500 tracking-wider">••••••••••••••••</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Lock className="w-3 h-3 text-[#4DA944]" />
                  Configured
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showNewWebhookSecret ? 'text' : 'password'}
                  value={newWebhookSecret}
                  onChange={(e) => setNewWebhookSecret(e.target.value)}
                  placeholder={formData.hasWebhookSecret ? 'Enter new Webhook Secret' : 'Enter Webhook Secret (Optional)'}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-xs font-mono font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#4DA944] focus:ring-2 focus:ring-[#4DA944]/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewWebhookSecret(!showNewWebhookSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showNewWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Readonly Webhook Callback URL with Copy Action */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Webhook URL</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={formData.webhookUrl || ''}
                placeholder={formData.configured ? '' : 'Generated upon saving configuration'}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-[11px] font-mono font-semibold text-slate-600 select-all outline-none placeholder:text-slate-400"
              />
              {formData.webhookUrl && (
                <button
                  type="button"
                  onClick={onCopyWebhookUrl}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Copy Webhook URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#4DA944]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Currency & Settlement Currency Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Currency</label>
            <Select
              options={currencyOptions}
              value={formData.currency || 'INR'}
              onChange={(e) => onFieldChange('currency', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Settlement Currency</label>
            <Select
              options={currencyOptions}
              value={formData.settlementCurrency || 'INR'}
              onChange={(e) => onFieldChange('settlementCurrency', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Row 5: Operational Notes / Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Description (Optional)</label>
          <textarea
            rows={2}
            value={formData.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Add any operational notes about this payment configuration..."
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#4DA944] focus:ring-2 focus:ring-[#4DA944]/15 transition resize-none"
          />
        </div>

        {/* Row 6: Additional Settings Accordion for Auto-Capture & Auto-Refund */}
        <div className="border border-slate-200/90 rounded-xl overflow-hidden pt-0.5">
          <button
            type="button"
            onClick={() => setShowAdditionalSettings(!showAdditionalSettings)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <span>Additional Settings</span>
            {showAdditionalSettings ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showAdditionalSettings && (
            <div className="p-3.5 bg-white border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Auto-capture Payments</p>
                  <p className="text-[11px] text-slate-500 font-medium">Automatically capture authorized transactions upon session start</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoCapture ?? true}
                  onChange={(e) => onFieldChange('autoCapture', e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#4DA944] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">Auto-refund on Unused Energy</p>
                  <p className="text-[11px] text-slate-500 font-medium">Process instant partial refund if session terminates early</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoRefund ?? true}
                  onChange={(e) => onFieldChange('autoRefund', e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#4DA944] rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FormCard>
  );
}
