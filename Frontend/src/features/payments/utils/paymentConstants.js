// Supported payment gateway providers list
export const PAYMENT_PROVIDERS = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    logo: '💳',
    website: 'https://razorpay.com',
    docsUrl: 'https://razorpay.com/docs/payments/server-integration/nodejs',
    desc: 'Accept payments via Razorpay payment gateway.',
    features: ['Create Payment', 'Verify Payment', 'Refund Payment', 'Get Payment Status', 'Webhook Support']
  }
];

// Supported processing and settlement currency options
export const PAYMENT_CURRENCIES = [
  { value: 'INR', label: 'INR (Indian Rupee - ₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' }
];

// Payment event filter categories for logs
export const PAYMENT_LOG_EVENTS = [
  'All',
  'PAYMENT_CAPTURED',
  'PAYMENT_FAILED',
  'REFUND_PROCESSED',
  'WEBHOOK_RECEIVED',
  'AUTH_REQUEST'
];

// Payment transaction status types for logs
export const PAYMENT_STATUS_TYPES = [
  'All',
  'SUCCESS',
  'FAILED',
  'PENDING',
  'REFUNDED'
];
