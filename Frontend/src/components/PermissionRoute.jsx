import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthorization } from '../features/auth/hooks/useAuthorization';
import UnauthorizedPage from './ui/UnauthorizedPage';

/**
 * Reusable Route Authorization Component.
 *
 * Enforces permission requirements on application routes.
 *
 * Behavior:
 * 1. If auth is loading -> render loading spinner.
 * 2. If user is not authenticated -> redirect to login (saving requested location).
 * 3. If authenticated AND has required permission -> render children (or Outlet).
 * 4. If authenticated BUT permission is missing -> render 403 UnauthorizedPage.
 *
 * @param {Object} props
 * @param {string} [props.permission] - Required permission token
 * @param {string[]} [props.permissions] - Array of required permission tokens
 * @param {boolean} [props.requireAll=false] - If true, requires all permissions; if false, requires any
 * @param {React.ReactNode} [props.children] - Child page/element to render
 */
export default function PermissionRoute({
  permission,
  permissions,
  requireAll = false,
  children,
}) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-indigo-600"></div>
      </div>
    );
  }

  // 1. Not authenticated -> Redirect to login flow safely
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Evaluate permission requirement
  let isAuthorized = false;

  if (permission) {
    isAuthorized = hasPermission(permission);
  } else if (Array.isArray(permissions) && permissions.length > 0) {
    isAuthorized = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    // If route specifies no permission, authenticated access is sufficient
    isAuthorized = true;
  }

  // 3. Authenticated but permission missing -> Fail safely to 403 Unauthorized page
  if (!isAuthorized) {
    const missingToken = permission || (Array.isArray(permissions) ? permissions.join(', ') : 'Required Permission');
    return <UnauthorizedPage permission={missingToken} />;
  }

  // 4. Authorized -> Render requested route component
  return <>{children}</>;
}
