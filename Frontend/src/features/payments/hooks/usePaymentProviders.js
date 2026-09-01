import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../context/ToastContext';
import {
  getPaymentGatewayConfig,
  updatePaymentGatewayConfig,
  testGatewayConnection
} from '../api/paymentService';

// Default empty form state for unconfigured gateways
const INITIAL_FORM_STATE = {
  displayName: '',
  keyId: '',
  currency: 'INR',
  settlementCurrency: 'INR',
  description: '',
  autoCapture: true,
  autoRefund: true,
  webhookUrl: '',
  configured: false,
  active: false,
  hasKeySecret: false,
  hasWebhookSecret: false,
  connectionStatus: 'not_tested',
  lastTestedAt: null
};

// Custom hook managing payment gateway lifecycle, form inputs, credentials, and connection diagnostics
export function usePaymentProviders(defaultProvider = 'razorpay', defaultEnvironment = 0) {
  const toast = useToast();

  // Active provider and environment (0 = Test Mode, 1 = Live Mode)
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [environment, setEnvironment] = useState(defaultEnvironment);

  // Form data state
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Secret replacement fields
  const [newKeySecret, setNewKeySecret] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [isChangingKeySecret, setIsChangingKeySecret] = useState(false);
  const [isChangingWebhookSecret, setIsChangingWebhookSecret] = useState(false);

  // Loading and action flags
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Fetch gateway configuration for the selected provider and environment
  const fetchConfig = useCallback(async (env, provider) => {
    setIsChangingKeySecret(false);
    setIsChangingWebhookSecret(false);
    setNewKeySecret('');
    setNewWebhookSecret('');

    try {
      const data = await getPaymentGatewayConfig(provider, env);
      if (data) {
        setFormData({
          displayName: data.displayName || '',
          keyId: data.keyId || '',
          currency: data.currency || 'INR',
          settlementCurrency: data.settlementCurrency || 'INR',
          description: data.description || '',
          autoCapture: data.autoCapture !== undefined ? Boolean(data.autoCapture) : true,
          autoRefund: data.autoRefund !== undefined ? Boolean(data.autoRefund) : true,
          webhookUrl: data.webhookUrl || '',
          configured: Boolean(data.configured),
          active: Boolean(data.active),
          hasKeySecret: Boolean(data.hasKeySecret),
          hasWebhookSecret: Boolean(data.hasWebhookSecret),
          connectionStatus: data.connectionStatus || 'not_tested',
          lastTestedAt: data.lastTestedAt || null
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
    } catch (err) {
      console.error('[usePaymentProviders] Failed to load configuration:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch configuration on initial mount and when switching environment or provider
  useEffect(() => {
    fetchConfig(environment, selectedProvider);
  }, [environment, selectedProvider, fetchConfig]);

  // Update a single field in the form state
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Switch between Test Mode (0) and Live Mode (1)
  const handleEnvironmentSwitch = (newEnv) => {
    if (newEnv === environment) return;
    setEnvironment(newEnv);
  };

  // Save changes handler with validation and secret preservation
  const handleSave = async () => {
    // Validate display name
    if (!formData.displayName || !formData.displayName.trim()) {
      toast.error('Display Name is required', { code: 400 });
      return false;
    }

    // Validate Key ID if not yet configured
    if (!formData.configured && (!formData.keyId || !formData.keyId.trim())) {
      toast.error('Key ID is required to configure this gateway', { code: 400 });
      return false;
    }

    // Validate Key Secret if not yet configured
    if (!formData.hasKeySecret && (!newKeySecret || !newKeySecret.trim())) {
      toast.error('Key Secret is required to configure this gateway', { code: 400 });
      return false;
    }

    setIsSaving(true);
    try {
      // Build update payload
      const payload = {
        environment,
        displayName: formData.displayName.trim(),
        currency: formData.currency,
        settlementCurrency: formData.settlementCurrency,
        description: formData.description || '',
        autoCapture: Boolean(formData.autoCapture),
        autoRefund: Boolean(formData.autoRefund)
      };

      // Only send unmasked keyId
      if (formData.keyId && !formData.keyId.includes('****')) {
        payload.keyId = formData.keyId.trim();
      }

      // Only send secret when newly provided
      if (newKeySecret && newKeySecret.trim()) {
        payload.keySecret = newKeySecret.trim();
      }

      // Only send webhook secret when newly provided
      if (newWebhookSecret && newWebhookSecret.trim()) {
        payload.webhookSecret = newWebhookSecret.trim();
      }

      const res = await updatePaymentGatewayConfig(selectedProvider, payload);

      if (res) {
        setFormData((prev) => ({
          ...prev,
          displayName: res.displayName || prev.displayName,
          keyId: res.keyId || prev.keyId,
          currency: res.currency || prev.currency,
          settlementCurrency: res.settlementCurrency || prev.settlementCurrency,
          description: res.description !== undefined ? res.description : prev.description,
          autoCapture: res.autoCapture !== undefined ? Boolean(res.autoCapture) : prev.autoCapture,
          autoRefund: res.autoRefund !== undefined ? Boolean(res.autoRefund) : prev.autoRefund,
          configured: Boolean(res.configured),
          active: Boolean(res.active),
          hasKeySecret: Boolean(res.hasKeySecret),
          hasWebhookSecret: Boolean(res.hasWebhookSecret),
          webhookUrl: res.webhookUrl || prev.webhookUrl,
          connectionStatus: res.connectionStatus || prev.connectionStatus,
          lastTestedAt: res.lastTestedAt || prev.lastTestedAt
        }));

        setNewKeySecret('');
        setNewWebhookSecret('');
        setIsChangingKeySecret(false);
        setIsChangingWebhookSecret(false);
      }

      toast.success(`${environment === 0 ? 'Test' : 'Live'} Mode configuration saved successfully!`, { code: 200 });
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to save gateway configuration', { code: 500 });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Live connection test handler
  const handleTestConnection = async () => {
    setTestingConnection(true);

    try {
      const res = await testGatewayConnection(selectedProvider, environment);
      if (res && res.success) {
        setFormData((prev) => ({
          ...prev,
          connectionStatus: 'connected',
          lastTestedAt: res.lastTestedAt || new Date().toISOString()
        }));
        toast.success(res.message || 'Razorpay connection verified successfully!', { code: 200 });
      } else {
        setFormData((prev) => ({
          ...prev,
          connectionStatus: 'failed'
        }));
        toast.error(res?.message || 'Connection test failed', { code: 400 });
      }
    } catch (err) {
      setFormData((prev) => ({
        ...prev,
        connectionStatus: 'failed'
      }));
      toast.error(err.message || 'Connection test failed', { code: 500 });
    } finally {
      setTestingConnection(false);
    }
  };

  return {
    selectedProvider,
    setSelectedProvider,
    environment,
    setEnvironment,
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
    loading,
    isSaving,
    testingConnection,
    handleSave,
    handleTestConnection,
    refetch: () => fetchConfig(environment, selectedProvider)
  };
}
