import * as authService from './auth.service.js';

/**
 * Controller endpoint handler for POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const authResult = await authService.authenticateUser(email, password);
    return res.status(200).json(authResult);
  } catch (err) {
    const statusCode = err.statusCode || 401;
    return res.status(statusCode).json({ message: err.message || 'Invalid email or password' });
  }
}
