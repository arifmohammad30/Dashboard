import { TEMPORARY_USERS } from './auth.config.js';

// In-memory store for OTP records: email -> { otp: string, expiresAt: number }
const otpStore = new Map();

// Default development OTP fallback
export const DEFAULT_DEV_OTP = '123456';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Sends/generates an OTP for the given email address and logs raw data to console.
 *
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export async function sendOtp(email) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Invalid request');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = TEMPORARY_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate 6-digit random OTP code
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with expiration
  otpStore.set(normalizedEmail, {
    otp: generatedOtp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });

  // Print raw response data to backend console
  console.log({
    email: normalizedEmail,
    otp: generatedOtp,
    role: user.role,
  });

  return {
    message: 'OTP sent successfully',
  };
}

/**
 * Verifies an OTP and returns authentication payload matching the API contract.
 *
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ token: string, user: Object }>}
 */
export async function verifyOtp(email, otp) {
  if (!email || !otp || typeof email !== 'string') {
    const error = new Error('Invalid request');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const user = TEMPORARY_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const otpRecord = otpStore.get(normalizedEmail);

  // Check expiration if record exists
  if (otpRecord && Date.now() > otpRecord.expiresAt) {
    otpStore.delete(normalizedEmail);
    const error = new Error('OTP expired');
    error.statusCode = 401;
    throw error;
  }

  // Validate OTP
  const expectedOtp = otpRecord ? otpRecord.otp : DEFAULT_DEV_OTP;
  if (cleanOtp !== expectedOtp && cleanOtp !== DEFAULT_DEV_OTP) {
    const error = new Error('Invalid OTP');
    error.statusCode = 401;
    throw error;
  }

  // OTP verified - clear from store
  otpStore.delete(normalizedEmail);

  // Generate development access token
  const token = `temp_token_${user.id}_${Date.now()}`;

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  };
}
