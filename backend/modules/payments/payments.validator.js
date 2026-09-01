// Validator for payment gateway configuration payloads
export function validateGatewayConfig(data) {
  const errors = [];

  // Environment must be integer 0 (Test) or 1 (Live)
  const env = Number(data.environment);
  if (![0, 1].includes(env)) {
    errors.push('Environment must be either 0 (Test Mode) or 1 (Live Mode)');
  }

  // Display name is required
  if (!data.displayName || typeof data.displayName !== 'string' || !data.displayName.trim()) {
    errors.push('Display name is required');
  }

  // Currency validation
  if (data.currency && typeof data.currency !== 'string') {
    errors.push('Invalid currency code');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validator for test-connection requests
export function validateTestConnection(data) {
  const errors = [];

  // Environment must be integer 0 (Test) or 1 (Live)
  const env = Number(data.environment);
  if (![0, 1].includes(env)) {
    errors.push('Environment must be either 0 (Test Mode) or 1 (Live Mode)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
