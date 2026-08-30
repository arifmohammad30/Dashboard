import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';


export function useAuthorization() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const userPermissions = useMemo(() => {
    if (!user || !Array.isArray(user.permissions)) {
      return [];
    }
    return user.permissions;
  }, [user]);


  const hasPermission = useCallback(
    (permission) => {

      if (!permission) return true;

      // Deny safely if permissions are unavailable or user is not authenticated.
      if (!isAuthenticated || !user || userPermissions.length === 0) {
        return false;
      }

      return userPermissions.includes(permission);
    },
    [isAuthenticated, user, userPermissions]
  );

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


export function checkPermission(user, permission) {
  if (!permission) return true;
  if (!user || !Array.isArray(user.permissions) || user.permissions.length === 0) {
    return false;
  }
  return user.permissions.includes(permission);
}
