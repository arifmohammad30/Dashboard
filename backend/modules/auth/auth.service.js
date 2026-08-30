import { TEMPORARY_USERS } from './auth.config.js';

/**
 * Authenticates user against temporary credentials store.
 * Isolated helper function for generating authentication tokens.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function authenticateUser(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = TEMPORARY_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate temporary JWT-style token string
  const token = `temp_token_${user.id}_${Date.now()}`;

  // Return structure required by frontend contract
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
