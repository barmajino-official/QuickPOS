/**
 * @file permissions.ts
 * @description Permission-aware navigation helpers. Computes which route a staff
 *              member should land on after login, and where to send them when they
 *              hit a page they lack permission for.
 *
 * @receives staff – the authenticated StaffProfile (or null)
 *
 * @notes ROUTE_PRIORITY mirrors the sidebar order, so users land on the highest
 *        priority page they can access. Profile is open to everyone and is the
 *        ultimate fallback. getLandingPath never returns a page the user lacks
 *        permission for, so it is safe to use as a redirect target from a guard.
 */
import type { StaffProfile } from '~/types';

interface RouteRule {
  path: string;
  permission: string;
}

const ROUTE_PRIORITY: RouteRule[] = [
  { path: '/dashboard', permission: 'dashboard' },
  { path: '/pos', permission: 'pos' },
  { path: '/orders', permission: 'orders' },
  { path: '/products', permission: 'products' },
  { path: '/brands', permission: 'brands' },
  { path: '/categories', permission: 'categories' },
  { path: '/customers', permission: 'customers' },
  { path: '/staff', permission: 'staff' },
];

export const LOGIN_PATH = '/login';
export const PROFILE_PATH = '/profile';

export function getLandingPath(staff: StaffProfile | null): string {
  if (!staff) return LOGIN_PATH;

  const allowed = ROUTE_PRIORITY.find(
    (rule) => staff.permissions?.[rule.permission] === true,
  );

  return allowed ? allowed.path : PROFILE_PATH;
}
