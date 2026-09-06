import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { usePaymentProviders } from '../hooks/usePaymentProviders';
import ProviderSelectionCard from '../components/ProviderSelectionCard';
import ProviderInfoCard from '../components/ProviderInfoCard';
import GatewayConfigForm from '../components/GatewayConfigForm';
import TestConnectionCard from '../components/TestConnectionCard';
import ConfigurationGuideCard from '../components/ConfigurationGuideCard';
import PrimaryButton from '../../../components/ui/PrimaryButton';
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
    <div className="flex flex-col gap-3 max-w-[1500px] w-full mx-auto pb-4">
      {/* 1. Top Header Row with Title and Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Payment Integration
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Configure payment gateway settings and credentials for this tenant
          </p>
        </div>

        {/* Save button using global PrimaryButton */}
        <PrimaryButton
          onClick={handleSave}
          disabled={isSaving}
          isSubmitting={isSaving}
          loadingText="Saving..."
          isEditMode={true}
          editLabel="Save Changes"
          icon={Check}
        />
      </div>

      {/* 2. Main Swapped & Compact Single-Frame 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column: Provider Selector, Info & Configuration Guide (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-3">
          <ProviderSelectionCard
            providers={PAYMENT_PROVIDERS}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            configured={formData.configured}
            environment={environment}
          />

          <ProviderInfoCard provider={currentProviderObj} />

          <ConfigurationGuideCard
            environment={environment}
            docsUrl={currentProviderObj.docsUrl}
          />
        </div>

        {/* Right Column: Test Connection Diagnostic (ON TOP) & Gateway Config Form (BELOW) (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-3">
          <TestConnectionCard
            environment={environment}
            configured={formData.configured}
            testingConnection={testingConnection}
            onTestConnection={handleTestConnection}
            connectionStatus={formData.connectionStatus}
            lastTestedAt={formData.lastTestedAt}
          />

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
      </div>
    </div>
  );
}
