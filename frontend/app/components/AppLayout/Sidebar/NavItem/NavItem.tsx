/**
 * @file NavItem.tsx
 * @description A single navigation link in the Sidebar. Shows an icon + label and
 *              highlights as an M3 pill when active.
 *
 * @receives to         – the route path this item links to
 * @receives label      – the visible link text
 * @receives icon       – the leading icon node
 * @receives onNavigate – called on click (used to close the mobile drawer)
 */
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';



interface Props {
  to: string;
  label: string;
  icon: ReactNode;
  onNavigate?: () => void;
}

export function NavItem({ to, label, icon, onNavigate }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--color-base-content)] rounded-full transition-colors duration-200 ease-[var(--m3-standard)] hover:[&:not(.m3-nav-pill-active)]:bg-[color-mix(in_srgb,var(--color-base-300)_35%,transparent)] ${isActive ? 'm3-nav-pill-active' : ''}`}
    >
      <span className="flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
