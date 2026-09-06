import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import FormCard from '../../../components/ui/FormCard';
import Select from '../../../components/ui/Select';
import SegmentedToggle from '../../../components/ui/SegmentedToggle';

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
    <FormCard title="Configuration" bodyClassName="p-3.5">
      <div className="space-y-2.5">
        
        {/* Row 1: Environment Selector & Display Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <div className="space-y-1">
            <div className="h-5 flex items-center">
              <span className="text-xs font-semibold text-slate-700 block">Environment</span>
            </div>
            <SegmentedToggle
              fullWidth={true}
              options={[
                { value: 0, label: 'Test Mode' },
                { value: 1, label: 'Live Mode' }
              ]}
              value={environment}
              onChange={onEnvironmentSwitch}
            />
          </div>

          {/* Merchant Display Name Input */}
          <div className="space-y-1">
            <div className="h-5 flex items-center">
              <label htmlFor="displayName" className="text-xs font-semibold text-slate-700 block cursor-pointer">Display Name</label>
            </div>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName || ''}
              onChange={(e) => onFieldChange('displayName', e.target.value)}
              placeholder={environment === 0 ? 'e.g. Razorpay (Test)' : 'e.g. Razorpay (Live)'}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-[#1EB8D4] focus:ring-1 focus:ring-[#1EB8D4]/20 focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Row 2: Key ID & Key Secret */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Key ID Field */}
          <div className="space-y-1">
            <div className="h-5 flex items-center justify-between">
              <label htmlFor="keyId" className="text-xs font-semibold text-slate-700 block cursor-pointer">Key ID (apiKey)</label>
              {formData.configured && formData.keyId?.includes('****') && (
                <span className="text-[10px] font-medium text-slate-400">Masked</span>
              )}
            </div>
            <input
              id="keyId"
              name="keyId"
              type="text"
              value={formData.keyId || ''}
              onChange={(e) => onFieldChange('keyId', e.target.value)}
              placeholder={environment === 0 ? 'rzp_test_...' : 'rzp_live_...'}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-mono font-medium focus:bg-white focus:border-[#1EB8D4] focus:ring-1 focus:ring-[#1EB8D4]/20 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Key Secret Field with Replace Flow */}
          <div className="space-y-1">
            <div className="h-5 flex items-center justify-between">
              <label htmlFor="newKeySecret" className="text-xs font-semibold text-slate-700 block cursor-pointer">Key Secret (apiSecret)</label>
              {formData.hasKeySecret && !isChangingKeySecret && (
                <button
                  type="button"
                  onClick={() => setIsChangingKeySecret(true)}
                  className="text-xs font-semibold text-[#1EB8D4] hover:underline cursor-pointer"
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
                  className="text-xs font-normal text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {formData.hasKeySecret && !isChangingKeySecret ? (
              <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 shadow-2xs">
                <span className="text-xs font-mono text-slate-500 tracking-wider font-medium">••••••••••••••••</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#148296] bg-cyan-50 px-2 py-0.5 rounded-md border border-[#1EB8D4]/20">
                  <Lock className="w-3 h-3 text-[#1EB8D4]" />
                  Configured
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="newKeySecret"
                  name="newKeySecret"
                  type={showNewSecret ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={newKeySecret}
                  onChange={(e) => setNewKeySecret(e.target.value)}
                  placeholder={formData.hasKeySecret ? 'Enter new Key Secret to replace' : 'Enter Razorpay Key Secret'}
                  className="w-full pl-3.5 pr-9 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-mono font-medium focus:bg-white focus:border-[#1EB8D4] focus:ring-1 focus:ring-[#1EB8D4]/20 focus:outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewSecret(!showNewSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer z-10"
                >
                  {showNewSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Webhook Secret & Webhook URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Webhook Secret Field with Replace Flow */}
          <div className="space-y-1">
            <div className="h-5 flex items-center justify-between">
              <label htmlFor="newWebhookSecret" className="text-xs font-semibold text-slate-700 block cursor-pointer">Webhook Secret</label>
              {formData.hasWebhookSecret && !isChangingWebhookSecret && (
                <button
                  type="button"
                  onClick={() => setIsChangingWebhookSecret(true)}
                  className="text-xs font-semibold text-[#1EB8D4] hover:underline cursor-pointer"
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
                  className="text-xs font-normal text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {formData.hasWebhookSecret && !isChangingWebhookSecret ? (
              <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 shadow-2xs">
                <span className="text-xs font-mono text-slate-500 tracking-wider font-medium">••••••••••••••••</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#148296] bg-cyan-50 px-2 py-0.5 rounded-md border border-[#1EB8D4]/20">
                  <Lock className="w-3 h-3 text-[#1EB8D4]" />
                  Configured
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="newWebhookSecret"
                  name="newWebhookSecret"
                  type={showNewWebhookSecret ? 'text' : 'password'}
                  autoComplete="off"
                  value={newWebhookSecret}
                  onChange={(e) => setNewWebhookSecret(e.target.value)}
                  placeholder={formData.hasWebhookSecret ? 'Enter new Webhook Secret' : 'Enter Webhook Secret (Optional)'}
                  className="w-full pl-3.5 pr-9 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-mono font-medium focus:bg-white focus:border-[#1EB8D4] focus:ring-1 focus:ring-[#1EB8D4]/20 focus:outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewWebhookSecret(!showNewWebhookSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer z-10"
                >
                  {showNewWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Readonly Webhook Callback URL with Copy Action */}
          <div className="space-y-1">
            <div className="h-5 flex items-center justify-between">
              <label htmlFor="webhookUrl" className="text-xs font-semibold text-slate-700 block cursor-pointer">Webhook URL</label>
            </div>
            <div className="relative">
              <input
                id="webhookUrl"
                name="webhookUrl"
                type="text"
                readOnly
                value={formData.webhookUrl || ''}
                placeholder={formData.configured ? '' : 'Generated upon saving configuration'}
                className="w-full pl-3.5 pr-9 py-2 bg-slate-50 border border-stone-200 text-slate-600 rounded-xl text-xs font-mono font-medium select-all outline-none shadow-2xs placeholder:text-slate-400"
              />
              {formData.webhookUrl && (
                <button
                  type="button"
                  onClick={onCopyWebhookUrl}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
                  title="Copy Webhook URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1EB8D4]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Currency & Settlement Currency Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="h-5 flex items-center">
              <label htmlFor="currency" className="text-xs font-semibold text-slate-700 block cursor-pointer">Currency</label>
            </div>
            <Select
              id="currency"
              name="currency"
              options={currencyOptions}
              value={formData.currency || 'INR'}
              onChange={(e) => onFieldChange('currency', e.target.value)}
              className="w-full"
              buttonClassName="py-2 px-3.5 bg-stone-50 border-stone-200"
            />
          </div>

          <div className="space-y-1">
            <div className="h-5 flex items-center">
              <label htmlFor="settlementCurrency" className="text-xs font-semibold text-slate-700 block cursor-pointer">Settlement Currency</label>
            </div>
            <Select
              id="settlementCurrency"
              name="settlementCurrency"
              options={currencyOptions}
              value={formData.settlementCurrency || 'INR'}
              onChange={(e) => onFieldChange('settlementCurrency', e.target.value)}
              className="w-full"
              buttonClassName="py-2 px-3.5 bg-stone-50 border-stone-200"
            />
          </div>
        </div>

        {/* Row 5: Operational Notes / Description */}
        <div className="space-y-1">
          <label htmlFor="description" className="text-xs font-semibold text-slate-700 block cursor-pointer">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={formData.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Add any operational notes about this payment configuration..."
            className="w-full p-3.5 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-[#1EB8D4] focus:ring-1 focus:ring-[#1EB8D4]/20 focus:outline-none transition-all shadow-2xs resize-none"
          />
        </div>

        {/* Row 6: Additional Settings Accordion for Auto-Capture & Auto-Refund */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden pt-0.5">
          <button
            type="button"
            onClick={() => setShowAdditionalSettings(!showAdditionalSettings)}
            className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-100/60 flex items-center justify-between text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <span>Additional Settings</span>
            {showAdditionalSettings ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showAdditionalSettings && (
            <div className="p-3.5 bg-white border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="autoCapture" className="text-xs font-semibold text-slate-800 cursor-pointer block">Auto-capture Payments</label>
                  <p className="text-xs text-slate-500 font-normal">Automatically capture authorized transactions upon session start</p>
                </div>
                <input
                  id="autoCapture"
                  name="autoCapture"
                  type="checkbox"
                  checked={formData.autoCapture ?? true}
                  onChange={(e) => onFieldChange('autoCapture', e.target.checked)}
                  className="w-4 h-4 accent-[#1EB8D4] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div>
                  <label htmlFor="autoRefund" className="text-xs font-semibold text-slate-800 cursor-pointer block">Auto-refund on Unused Energy</label>
                  <p className="text-xs text-slate-500 font-normal">Process instant partial refund if session terminates early</p>
                </div>
                <input
                  id="autoRefund"
                  name="autoRefund"
                  type="checkbox"
                  checked={formData.autoRefund ?? true}
                  onChange={(e) => onFieldChange('autoRefund', e.target.checked)}
                  className="w-4 h-4 accent-[#1EB8D4] rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FormCard>
  );
}
