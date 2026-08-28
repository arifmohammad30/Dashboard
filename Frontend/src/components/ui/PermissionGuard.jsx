import React from 'react';
import { useAuthorization } from '../../features/auth/hooks/useAuthorization';

/**
 * Reusable UI Permission Guard Component.
 *
 * Renders child components ONLY if the authenticated user possesses the required permission(s).
 *
 * Examples:
 * <PermissionGuard permission={PERMISSIONS.STATION_DELETE}>
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * <PermissionGuard permissions={[PERMISSIONS.STATION_CREATE, PERMISSIONS.STATION_UPDATE]} requireAll={false}>
 *   <EditOrCreateButton />
 * </PermissionGuard>
 *
 * @param {Object} props
 * @param {string} [props.permission] - Single permission token required
 * @param {string[]} [props.permissions] - Array of permission tokens
 * @param {boolean} [props.requireAll=false] - If true, requires all permissions; if false, requires at least one
 * @param {React.ReactNode} props.children - Child UI element to render if authorized
 * @param {React.ReactNode} [props.fallback=null] - Optional element to render if unauthorized
 */
export default function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useAuthorization();

  if (isLoading) {
    return fallback;
  }

  let isAuthorized = false;

  if (permission) {
    isAuthorized = hasPermission(permission);
  } else if (Array.isArray(permissions) && permissions.length > 0) {
    isAuthorized = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    // If no permission specified, render by default
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return fallback;
  }

  return <>{children}</>;
}
