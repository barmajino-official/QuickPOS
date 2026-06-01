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

import './NavItem.css';

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
      className={({ isActive }) => `nav_item ${isActive ? 'm3-nav-pill-active' : ''}`}
    >
      <span className="nav_item_icon">{icon}</span>
      <span className="nav_item_label">{label}</span>
    </NavLink>
  );
}
