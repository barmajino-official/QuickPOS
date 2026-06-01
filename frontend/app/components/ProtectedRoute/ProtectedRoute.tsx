/**
 * @file ProtectedRoute.tsx
 * @description Route guard requiring a valid session and an optional permission.
 *              Unauthenticated → /login. Authenticated but missing the required
 *              permission → the user's highest-priority allowed page (via getLandingPath).
 *
 * @receives children   – the page to render when access is granted
 * @receives permission – optional permission key required to view the page
 *
 * @notes Reads selectors individually from the session store so the guard only
 *        re-renders when the relevant slice changes.
 */
import { Navigate } from 'react-router';

import { useSessionStore } from '~/store/sessionStore';
import { getLandingPath, LOGIN_PATH } from '~/lib/permissions';

interface Props {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: Props) {
  const token = useSessionStore((s) => s.token);
  const staff = useSessionStore((s) => s.staff);
  const hasPermission = useSessionStore((s) => s.hasPermission);

  if (!token) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={getLandingPath(staff)} replace />;
  }

  return <>{children}</>;
}
