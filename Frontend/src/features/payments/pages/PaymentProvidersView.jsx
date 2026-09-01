import React, { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { usePaymentProviders } from '../hooks/usePaymentProviders';
import ProviderSelectionCard from '../components/ProviderSelectionCard';
import ProviderInfoCard from '../components/ProviderInfoCard';
import GatewayConfigForm from '../components/GatewayConfigForm';
import TestConnectionCard from '../components/TestConnectionCard';
import ConfigurationGuideCard from '../components/ConfigurationGuideCard';
import { PAYMENT_PROVIDERS, PAYMENT_CURRENCIES } from '../utils/paymentConstants';

// Main view component for configuring tenant payment gateways
export default function PaymentProvidersView() {
  const toast = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Consume state and actions from the payment providers custom hook
  const {
    selectedProvider,
    setSelectedProvider,
    environment,
    handleEnvironmentSwitch,
    formData,
    handleFieldChange,
    newKeySecret,
    setNewKeySecret,
    newWebhookSecret,
    setNewWebhookSecret,
    isChangingKeySecret,
    setIsChangingKeySecret,
    isChangingWebhookSecret,
    setIsChangingWebhookSecret,
    isSaving,
    testingConnection,
    handleSave,
    handleTestConnection
  } = usePaymentProviders('razorpay', 0);

  // Find metadata for the currently selected provider
  const currentProviderObj = PAYMENT_PROVIDERS.find((p) => p.id === selectedProvider) || PAYMENT_PROVIDERS[0];

  // Copy webhook URL to clipboard with visual confirmation
  const handleCopyWebhookUrl = () => {
    if (!formData.webhookUrl) return;
    navigator.clipboard.writeText(formData.webhookUrl);
    setCopiedUrl(true);
    toast.success('Webhook URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1500px] w-full mx-auto pb-8">
      {/* 1. Top Header Row with Title and Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Payment Integration
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure payment gateway settings and credentials for this tenant
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#4DA944] hover:bg-[#43953b] text-white font-bold rounded-xl text-xs shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Main 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Column 1: Left (Provider Selection & Branding) */}
        <div className="lg:col-span-3 space-y-4">
          <ProviderSelectionCard
            providers={PAYMENT_PROVIDERS}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            configured={formData.configured}
            environment={environment}
          />

          <ProviderInfoCard provider={currentProviderObj} />
        </div>

        {/* Column 2: Center (Configuration Form) */}
        <div className="lg:col-span-6 space-y-4">
          <GatewayConfigForm
            environment={environment}
            onEnvironmentSwitch={handleEnvironmentSwitch}
            formData={formData}
            onFieldChange={handleFieldChange}
            newKeySecret={newKeySecret}
            setNewKeySecret={setNewKeySecret}
            newWebhookSecret={newWebhookSecret}
            setNewWebhookSecret={setNewWebhookSecret}
            isChangingKeySecret={isChangingKeySecret}
            setIsChangingKeySecret={setIsChangingKeySecret}
            isChangingWebhookSecret={isChangingWebhookSecret}
            setIsChangingWebhookSecret={setIsChangingWebhookSecret}
            currencyOptions={PAYMENT_CURRENCIES}
            onCopyWebhookUrl={handleCopyWebhookUrl}
            copiedUrl={copiedUrl}
          />
        </div>

        {/* Column 3: Right (Test Connection & Checklist Guide) */}
        <div className="lg:col-span-3 space-y-4">
          <TestConnectionCard
            environment={environment}
            configured={formData.configured}
            testingConnection={testingConnection}
            onTestConnection={handleTestConnection}
            connectionStatus={formData.connectionStatus}
            lastTestedAt={formData.lastTestedAt}
          />

          <ConfigurationGuideCard
            environment={environment}
            docsUrl={currentProviderObj.docsUrl}
          />
        </div>
      </div>
    </div>
  );
}
