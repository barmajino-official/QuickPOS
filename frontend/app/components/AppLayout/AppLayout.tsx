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

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  usePermissionSync();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-base-200)]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  );
}
