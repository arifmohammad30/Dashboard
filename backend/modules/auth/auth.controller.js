import * as authService from './auth.service.js';

/**
 * Controller endpoint handler for POST /api/auth/send-otp
 */
export async function sendOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const result = await authService.sendOtp(email);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ message: err.message || 'Failed to send OTP' });
  }
}

/**
 * Controller endpoint handler for POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const authResult = await authService.verifyOtp(email, otp);
    return res.status(200).json(authResult);
  } catch (err) {
    const statusCode = err.statusCode || 401;
    return res.status(statusCode).json({ message: err.message || 'Authentication failed' });
  }
}
