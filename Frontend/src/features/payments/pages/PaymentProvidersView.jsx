import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  HelpCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const PROVIDERS = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    logo: '💳',
    website: 'https://razorpay.com',
    desc: 'Accept payments via Razorpay payment gateway.',
    features: ['Create Payment', 'Verify Payment', 'Refund Payment', 'Get Payment Status', 'Webhook Support']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '⚡',
    website: 'https://stripe.com',
    desc: 'Global card processing & recurring billing platform.',
    features: ['Create Payment', 'Verify Payment', 'Refund Payment', 'Get Payment Status', 'Webhook Support']
  },
  {
    id: 'paytm',
    name: 'Paytm Business',
    logo: '📲',
    website: 'https://paytm.com',
    desc: 'India\'s QR code and mobile wallet payment gateway.',
    features: ['Create Payment', 'Verify Payment', 'Refund Payment', 'Get Payment Status', 'Webhook Support']
  },
  {
    id: 'phonepe',
    name: 'PhonePe PG',
    logo: '🟣',
    website: 'https://phonepe.com',
    desc: 'UPI intent and autopay recurring subscription billing.',
    features: ['Create Payment', 'Verify Payment', 'Refund Payment', 'Get Payment Status', 'Webhook Support']
  }
];

const INITIAL_GATEWAY_DATA = {
  razorpay: {
    displayName: 'Razorpay - GreenCharge',
    apiKey: 'rzp_test_98A1904F0123984A',
    apiSecret: 'w89XzK01948571049285019A',
    webhookSecret: 'whsec_90812490182409182409',
    webhookUrl: 'https://cms.greencharge.com/webhooks/razorpay',
    currency: 'INR',
    settlementCurrency: 'INR',
    description: 'Add any notes about this payment configuration...',
    environment: 'test',
    timeout: '10',
    retries: '3',
    autoCapture: true,
    autoRefund: true
  },
  stripe: {
    displayName: 'Stripe - GreenCharge',
    apiKey: 'pk_test_51Mz9081249018240',
    apiSecret: 'sk_test_90812490182409182409',
    webhookSecret: 'whsec_stripe_9081249018240',
    webhookUrl: 'https://cms.greencharge.com/webhooks/stripe',
    currency: 'USD',
    settlementCurrency: 'USD',
    description: 'Add any notes about this payment configuration...',
    environment: 'test',
    timeout: '15',
    retries: '3',
    autoCapture: true,
    autoRefund: true
  },
  paytm: {
    displayName: 'Paytm - GreenCharge',
    apiKey: 'PAYTM_MID_908124901',
    apiSecret: 'PAYTM_KEY_90812490182409',
    webhookSecret: 'whsec_paytm_9081249018',
    webhookUrl: 'https://cms.greencharge.com/webhooks/paytm',
    currency: 'INR',
    settlementCurrency: 'INR',
    description: 'Add any notes about this payment configuration...',
    environment: 'test',
    timeout: '5',
    retries: '2',
    autoCapture: true,
    autoRefund: true
  },
  phonepe: {
    displayName: 'PhonePe - GreenCharge',
    apiKey: 'PGMAT_9081249018240',
    apiSecret: 'PGKEY_908124901824091824',
    webhookSecret: 'whsec_phonepe_908124901',
    webhookUrl: 'https://cms.greencharge.com/webhooks/phonepe',
    currency: 'INR',
    settlementCurrency: 'INR',
    description: 'Add any notes about this payment configuration...',
    environment: 'test',
    timeout: '10',
    retries: '3',
    autoCapture: true,
    autoRefund: true
  }
};



export default function PaymentProvidersView() {
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedProvider, setSelectedProvider] = useState('razorpay');
  const [gatewayStore, setGatewayStore] = useState(INITIAL_GATEWAY_DATA);

  // Form Controls
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showAdditionalSettings, setShowAdditionalSettings] = useState(false);

  // Test Connection Diagnostics
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('not_tested');

  const currentProviderObj = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];
  const currentFormData = gatewayStore[selectedProvider];

  const handleFieldChange = (field, value) => {
    setGatewayStore(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        [field]: value
      }
    }));
  };

  const handleProviderSelect = (newProviderId) => {
    setSelectedProvider(newProviderId);
    setConnectionStatus('not_tested');
    toast.info(`Switched gateway provider configuration to ${PROVIDERS.find(p => p.id === newProviderId)?.name}`);
  };

  const handleSave = () => {
    toast.success(`${currentProviderObj.name} configuration saved successfully!`, { code: 200 });
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(currentFormData.webhookUrl);
    setCopiedUrl(true);
    toast.success('Webhook URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setConnectionStatus('testing');

    setTimeout(() => {
      setTestingConnection(false);
      setConnectionStatus('success');
      toast.success(`${currentProviderObj.name} connection test verified successfully!`, { code: 200 });
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1500px] w-full mx-auto pb-8">
      {/* 1. Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5.5 h-5.5 text-emerald-600" />
            Payment Integration
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Configure payment gateway settings for this tenant
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* 2. Main 3-Column Grid Layout (Tighter Spacing & Crisp Rectangular Borders) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Column 1: Left (Provider Selection & Provider Information) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Provider Selection */}
          <div className="bg-white border border-stone-200 rounded-md p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-100 pb-2.5">
              Provider Selection
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">Payment Provider</label>
              <div className="relative">
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderSelect(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md pl-3 pr-8 py-2 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition cursor-pointer appearance-none"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>

          {/* Card 2: Provider Information */}
          <div className="bg-white border border-stone-200 rounded-md p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-2.5">
              <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-base">
                {currentProviderObj.logo}
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs">{currentProviderObj.name}</h4>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              {currentProviderObj.desc}
            </p>

            <div>
              <a
                href={currentProviderObj.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>Website: {currentProviderObj.website}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <h5 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                Supported Features
              </h5>
              <ul className="space-y-1.5 text-xs font-semibold text-stone-700">
                {currentProviderObj.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Column 2: Center (Configuration Form) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-4.5 shadow-2xs space-y-4">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-100 pb-2.5">
              Configuration
            </h3>

            {/* Row 1: Environment & Display Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Environment</label>
                <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-md border border-stone-200">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('environment', 'test')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      currentFormData.environment === 'test'
                        ? 'bg-white text-emerald-700 border border-emerald-500 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Test Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('environment', 'live')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      currentFormData.environment === 'live'
                        ? 'bg-white text-orange-700 border border-orange-500 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Live Mode
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Display Name</label>
                <input
                  type="text"
                  value={currentFormData.displayName}
                  onChange={(e) => handleFieldChange('displayName', e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-md px-3 py-2 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Row 2: Key ID & Key Secret */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Key ID (apiKey)</label>
                <input
                  type="text"
                  value={currentFormData.apiKey}
                  onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-md px-3 py-2 text-xs font-mono font-bold text-stone-800 focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Key Secret (apiSecret)</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={currentFormData.apiSecret}
                    onChange={(e) => handleFieldChange('apiSecret', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-md pl-3 pr-9 py-2 text-xs font-mono font-bold text-stone-800 focus:outline-hidden focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Webhook Secret & Webhook URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Webhook Secret</label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={currentFormData.webhookSecret}
                    onChange={(e) => handleFieldChange('webhookSecret', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-md pl-3 pr-9 py-2 text-xs font-mono font-bold text-stone-800 focus:outline-hidden focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                  >
                    {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Webhook URL</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={currentFormData.webhookUrl}
                    className="w-full bg-stone-50 border border-stone-200 rounded-md pl-3 pr-9 py-2 text-[11px] font-mono font-bold text-stone-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    title="Copy Webhook URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: Currency & Settlement Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Currency</label>
                <div className="relative">
                  <select
                    value={currentFormData.currency}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-md pl-3 pr-8 py-2 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-emerald-500 transition cursor-pointer appearance-none"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">Settlement Currency</label>
                <div className="relative">
                  <select
                    value={currentFormData.settlementCurrency}
                    onChange={(e) => handleFieldChange('settlementCurrency', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-md pl-3 pr-8 py-2 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-emerald-500 transition cursor-pointer appearance-none"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">Description (Optional)</label>
              <textarea
                rows={2}
                value={currentFormData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Add any notes about this payment configuration..."
                className="w-full bg-white border border-stone-200 rounded-md p-2.5 text-xs font-medium text-stone-800 focus:outline-hidden focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Row 6: Additional Settings Accordion */}
            <div className="border border-stone-200 rounded-md overflow-hidden pt-0.5">
              <button
                type="button"
                onClick={() => setShowAdditionalSettings(!showAdditionalSettings)}
                className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-stone-100/80 flex items-center justify-between text-xs font-bold text-stone-700 transition cursor-pointer"
              >
                <span>Additional Settings</span>
                {showAdditionalSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdditionalSettings && (
                <div className="p-3.5 bg-white border-t border-stone-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-800">Auto-capture Payments</p>
                      <p className="text-[11px] text-stone-400">Automatically capture authorized transactions upon session start</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentFormData.autoCapture}
                      onChange={(e) => handleFieldChange('autoCapture', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <div>
                      <p className="text-xs font-bold text-stone-800">Auto-refund on Unused Energy</p>
                      <p className="text-[11px] text-stone-400">Process instant partial refund if session terminates early</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentFormData.autoRefund}
                      onChange={(e) => handleFieldChange('autoRefund', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Right (Test Connection & Configuration Guide) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Test Connection */}
          <div className="bg-white border border-stone-200 rounded-md p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-100 pb-2.5">
              Test Connection
            </h3>

            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Test your configuration to ensure the connection is working.
            </p>

            <button
              type="button"
              disabled={testingConnection}
              onClick={handleTestConnection}
              className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-emerald-600 text-emerald-700 font-bold rounded-md text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-60"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <div className="pt-1 flex items-center justify-between border-t border-stone-100 text-xs">
              <span className="font-bold text-stone-700">Connection Status</span>
              {connectionStatus === 'success' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400">
                  <span className="w-2 h-2 rounded-full bg-stone-300"></span>
                  Not tested yet
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Configuration Guide */}
          <div className="bg-white border border-stone-200 rounded-md p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-100 pb-2.5">
              Configuration Guide
            </h3>

            <ol className="space-y-2 text-xs font-medium text-stone-600">
              <li className="flex gap-2">
                <span className="font-bold text-stone-800">1.</span>
                <span>Login to your {currentProviderObj.name} account</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-stone-800">2.</span>
                <span>Go to Settings &gt; API Keys</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-stone-800">3.</span>
                <span>Copy Key ID and Key Secret</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-stone-800">4.</span>
                <span>Set up webhook for payment events</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-stone-800">5.</span>
                <span>Test the connection</span>
              </li>
            </ol>

            <div className="pt-2 border-t border-stone-100">
              <a
                href={currentProviderObj.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                <span>View {currentProviderObj.name} Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
