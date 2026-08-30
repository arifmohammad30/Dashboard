import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthorization } from '../features/auth/hooks/useAuthorization';
import UnauthorizedPage from './ui/UnauthorizedPage';


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
