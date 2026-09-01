import { apiClient } from '../../../lib/apiClient';

/**
 * Sends an OTP to the specified email address.
 *
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const sendOtp = async (email) => {
  return apiClient('/auth/send-otp', {
    method: 'POST',
    body: { email },
  });
};

/**
 * Verifies an OTP and returns authentication payload (token and user).
 *
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const verifyOtp = async (email, otp) => {
  return apiClient('/auth/verify-otp', {
    method: 'POST',
    body: { email, otp },
  });
};

// Compatibility aliases
export const sendOtpApi = sendOtp;
export const verifyOtpApi = verifyOtp;
