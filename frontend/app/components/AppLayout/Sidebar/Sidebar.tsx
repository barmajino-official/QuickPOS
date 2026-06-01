/**
 * @file Sidebar.tsx
 * @description Primary navigation rail. Shows only the links the signed-in staff
 *              member has permission for, the active user card, and a logout button.
 *              On screens below `md` it behaves as a slide-in drawer controlled by uiStore.
 *
 * @notes Permission gating mirrors ROUTE_PRIORITY in lib/permissions. Profile is
 *        always available. Tapping a link on mobile closes the drawer.
 */
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { useSessionStore } from '~/store/sessionStore';
import { useUiStore } from '~/store/uiStore';
import { NavItem } from './NavItem/NavItem';

import './Sidebar.css';

interface NavLink {
  label: string;
  to: string;
  perm: string | null;
  icon: ReactNode;
}

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', to: '/dashboard', perm: 'dashboard', icon: <svg {...ICON_PROPS}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg> },
  { label: 'Point of Sale', to: '/pos', perm: 'pos', icon: <svg {...ICON_PROPS}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg> },
  { label: 'Orders', to: '/orders', perm: 'orders', icon: <svg {...ICON_PROPS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" /></svg> },
  { label: 'Products', to: '/products', perm: 'products', icon: <svg {...ICON_PROPS}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12l8.73-5.04M12 22V12" /></svg> },
  { label: 'Brands', to: '/brands', perm: 'products', icon: <svg {...ICON_PROPS}><path d="M9 3H4a1 1 0 0 0-1 1v5l9 9 6-6-9-9z" /><circle cx="7" cy="7" r="1.2" /><path d="M14 6l7 7-5 5" /></svg> },
  { label: 'Categories', to: '/categories', perm: 'categories', icon: <svg {...ICON_PROPS}><path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83z" /><circle cx="7.5" cy="6.5" r="1" /></svg> },
  { label: 'Customers', to: '/customers', perm: 'customers', icon: <svg {...ICON_PROPS}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { label: 'Staff', to: '/staff', perm: 'staff', icon: <svg {...ICON_PROPS}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6M19 8v6" /></svg> },
];

export function Sidebar() {
  const staff = useSessionStore((s) => s.staff);
  const hasPermission = useSessionStore((s) => s.hasPermission);
  const clearSession = useSessionStore((s) => s.clearSession);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const closeSidebar = useUiStore((s) => s.closeSidebar);
  const navigate = useNavigate();

  const visibleLinks = NAV_LINKS.filter((link) => link.perm === null || hasPermission(link.perm));

  const handleLogout = () => {
    clearSession();
    closeSidebar();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div
        className={`sidebar_backdrop ${sidebarOpen ? 'sidebar_backdrop_open' : ''}`}
        onClick={closeSidebar}
      />

      <aside className={`sidebar ${sidebarOpen ? 'sidebar_open' : ''}`}>
        <div className="sidebar_brand">QuickPOS Pro</div>

        <nav className="sidebar_nav">
          {visibleLinks.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              label={link.label}
              icon={link.icon}
              onNavigate={closeSidebar}
            />
          ))}
        </nav>

        <div className="sidebar_footer">
          <Link to="/profile" className="sidebar_user" onClick={closeSidebar}>
            <div className="sidebar_avatar">
              {staff?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="sidebar_user_info">
              <span className="sidebar_user_name">{staff?.name}</span>
              <span className="sidebar_user_role">{staff?.role}</span>
            </div>
          </Link>

          <button className="btn btn-outline btn-sm sidebar_logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
