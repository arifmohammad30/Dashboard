import { apiClient } from '../../../lib/apiClient';

// Fetch the payment gateway configuration for a specific provider and environment
// Endpoint: GET /api/payments/gateways/:provider?environment=0|1
export async function getPaymentGatewayConfig(provider = 'razorpay', environment = 0) {
  const res = await apiClient(`/payments/gateways/${provider}?environment=${environment}`);
  return res?.data !== undefined ? res.data : res;
}

// Save / update the payment gateway configuration for the selected environment
// Endpoint: PUT /api/payments/gateways/:provider
export async function updatePaymentGatewayConfig(provider = 'razorpay', configData = {}) {
  const res = await apiClient(`/payments/gateways/${provider}`, {
    method: 'PUT',
    body: JSON.stringify(configData)
  });
  return res?.data !== undefined ? res.data : res;
}

// Test connectivity using stored credentials for the specified environment
// Endpoint: POST /api/payments/gateways/:provider/test-connection
export async function testGatewayConnection(provider = 'razorpay', environment = 0) {
  return await apiClient(`/payments/gateways/${provider}/test-connection`, {
    method: 'POST',
    body: JSON.stringify({ environment: Number(environment) })
  });
}
