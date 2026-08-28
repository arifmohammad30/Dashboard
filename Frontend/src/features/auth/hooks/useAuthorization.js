import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Centralized Authorization Hook.
 *
 * ALL permission checks throughout the application MUST consume this hook or helper API.
 * Component-level checks MUST NEVER evaluate hardcoded role strings (e.g. user.role === "ADMIN").
 *
 * DENY-BY-DEFAULT PRINCIPLE:
 * If user authentication is initializing, user is null, or permissions array is unavailable,
 * all permission checks return false (access denied safely).
 */
export function useAuthorization() {
  const { user, isAuthenticated, isLoading } = useAuth();

  /**
   * Safely extract the permissions array from AuthUser state.
   */
  const userPermissions = useMemo(() => {
    if (!user || !Array.isArray(user.permissions)) {
      return [];
    }
    return user.permissions;
  }, [user]);

  /**
   * Check if user possesses a single specific permission.
   *
   * @param {string} permission - The permission token to check (e.g., 'station:create')
   * @returns {boolean} True if permission is granted, false otherwise.
   */
  const hasPermission = useCallback(
    (permission) => {
      // If no permission token is required by the caller, allow access.
      if (!permission) return true;

      // Deny safely if permissions are unavailable or user is not authenticated.
      if (!isAuthenticated || !user || userPermissions.length === 0) {
        return false;
      }

      return userPermissions.includes(permission);
    },
    [isAuthenticated, user, userPermissions]
  );

  /**
   * Check if user possesses AT LEAST ONE permission from an array of permissions.
   *
   * @param {string[]} permissions - Array of permission tokens
   * @returns {boolean} True if user has any of the permissions, false otherwise.
   */
  const hasAnyPermission = useCallback(
    (permissions) => {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return true;
      }

      if (!isAuthenticated || !user || userPermissions.length === 0) {
        return false;
      }

      return permissions.some((perm) => userPermissions.includes(perm));
    },
    [isAuthenticated, user, userPermissions]
  );

  /**
   * Check if user possesses ALL permissions in an array of permissions.
   *
   * @param {string[]} permissions - Array of permission tokens required
   * @returns {boolean} True if user has all specified permissions, false otherwise.
   */
  const hasAllPermissions = useCallback(
    (permissions) => {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return true;
      }

      if (!isAuthenticated || !user || userPermissions.length === 0) {
        return false;
      }

      return permissions.every((perm) => userPermissions.includes(perm));
    },
    [isAuthenticated, user, userPermissions]
  );

  return {
    user,
    role: user?.role || null,
    permissions: userPermissions,
    isAuthenticated,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * Pure helper function for checking permissions outside of React components/hooks.
 *
 * @param {import('../utils/authAdapter').AuthUser|null} user - AuthUser object
 * @param {string} permission - Permission token
 * @returns {boolean}
 */
export function checkPermission(user, permission) {
  if (!permission) return true;
  if (!user || !Array.isArray(user.permissions) || user.permissions.length === 0) {
    return false;
  }
  return user.permissions.includes(permission);
}
