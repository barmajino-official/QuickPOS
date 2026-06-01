/**
 * @file AppLayout.tsx
 * @description Main application shell for authenticated routes: navigation sidebar
 *              plus a scrollable main content area. Also drives live permission sync
 *              so the UI reacts to admin permission changes without a re-login.
 *
 * @receives children – the page content to render in the main area
 */
import { Sidebar } from './Sidebar/Sidebar';
import { usePermissionSync } from '~/lib/usePermissionSync';
import './AppLayout.css';

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  usePermissionSync();

  return (
    <div className="app_layout">
      <Sidebar />
      <div className="app_main">
        {children}
      </div>
    </div>
  );
}
