import { ALL_PERMISSIONS_LIST } from '../../../config/permissions';

/**
 * Frontend AuthUser Data Model Definition
 *
 * @typedef {Object} AuthUser
 * @property {string} id - Unique user ID
 * @property {string} [name] - Display name
 * @property {string} [email] - User email
 * @property {string} [role] - User role string from backend (for display only, NOT for permission logic)
 * @property {string[]} permissions - Array of granted permission string tokens
 */

/**
 * Development-only mock AuthUser instance.
 * Provides full permission access for local development when backend auth is disconnected or incomplete.
 */
export const DEV_MOCK_USER = {
  id: 'dev-user-001',
  name: 'Development Superuser',
  email: 'dev@evre.in',
  role: 'Dev Administrator',
  permissions: ALL_PERMISSIONS_LIST,
};

/**
 * Integration Adapter Boundary
 * Converts any backend authentication response into the standardized internal AuthUser model.
 *
 * @param {any} response - Backend response data (e.g. { user: {...}, token: "..." } or raw user object)
 * @returns {AuthUser|null} Formatted AuthUser object or null if invalid
 */
export function mapBackendUserToAuthUser(response) {
  if (!response) return null;

  // Extract nested user if response wraps it in { user, token }
  const rawUser = response.user || response.data?.user || response;

  if (typeof rawUser !== 'object') return null;

  const id = String(rawUser.id || rawUser._id || rawUser.email || 'user-unknown');
  const name = rawUser.name || rawUser.fullName || rawUser.email?.split('@')[0] || 'Authenticated User';
  const email = rawUser.email || '';
  const role = rawUser.role || rawUser.roleName || 'User';

  // Extract permissions array from response safely
  let permissions = [];
  if (Array.isArray(rawUser.permissions)) {
    permissions = rawUser.permissions.map(String);
  } else if (Array.isArray(response.permissions)) {
    permissions = response.permissions.map(String);
  }

  // Fallback for local development if permissions array is missing in backend response
  const isDevMode = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
  if (permissions.length === 0 && isDevMode) {
    console.warn(
      '[Auth Adapter] Backend did not return a permissions array. Using dev mock permissions fallback for local development.'
    );
    permissions = ALL_PERMISSIONS_LIST;
  }

  return {
    id,
    name,
    email,
    role,
    permissions,
  };
}
