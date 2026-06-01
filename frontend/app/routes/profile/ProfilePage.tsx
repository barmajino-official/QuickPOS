/**
 * @file ProfilePage.tsx
 * @description Page component that displays the currently logged-in user's profile,
 *              including their personal details, role, and assigned permissions.
 *              Retrieves data exclusively from the global sessionStore.
 */

// 1. React core
import React from 'react';

// 2. Third-party libraries

// 3. Internal — API

// 4. Internal — Store
import { useSessionStore } from '~/store/sessionStore';

// 5. Internal — Components
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';

// 6. Internal — Types
import type { StaffProfile } from '~/types';

// 7. Styles (always last)
import './ProfilePage.css';

// --- Constants ---
const DEFAULT_AVATAR_CHAR = '?';
const UNKNOWN_VALUE = 'Not provided';

export default function ProfilePage() {
  const { staff } = useSessionStore();

  if (!staff) {
    return null;
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(staff.email);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <TopBar title="My Profile" />
        <div className="profile_page">
          <div className="profile_card">
            
            {/* Header Section */}
            <div className="profile_header">
              <div className="profile_avatar_wrapper">
                <div className="profile_avatar">
                  {getInitial(staff.name)}
                </div>
              </div>
              <div className="profile_header_info">
                <h2 className="profile_name">{staff.name}</h2>
                <span className="profile_role">{staff.role}</span>
              </div>
            </div>

            {/* Body Section */}
            <div className="profile_body">
              
              <div className="profile_section">
                <h3 className="profile_section_title">Contact Information</h3>
                <div className="profile_detail_grid">
                  <div className="profile_detail_item">
                    <span className="profile_detail_label">Email Address</span>
                    <span 
                      className="profile_detail_value cursor-pointer hover:text-primary transition-colors"
                      onClick={handleCopyEmail}
                      title="Click to copy"
                    >
                      {staff.email}
                    </span>
                  </div>
                  <div className="profile_detail_item">
                    <span className="profile_detail_label">Phone Number</span>
                    <span className="profile_detail_value">
                      {UNKNOWN_VALUE}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile_section">
                <h3 className="profile_section_title">System Access</h3>
                <div className="profile_detail_grid">
                  <div className="profile_detail_item">
                    <span className="profile_detail_label">Role</span>
                    <span className="profile_detail_value capitalize">{staff.role}</span>
                  </div>
                  <div className="profile_detail_item">
                    <span className="profile_detail_label">Member Since</span>
                    <span className="profile_detail_value">
                      {formatDate(staff.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile_section">
                <h3 className="profile_section_title">Assigned Permissions</h3>
                <div className="profile_permissions_wrapper">
                  {Object.entries(staff.permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <span key={key} className="badge badge-ghost profile_badge">
                        {key.toUpperCase()}
                      </span>
                    ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

// --- Helper Functions ---

/**
 * Extracts the first character of a name for the avatar.
 */
function getInitial(name: string): string {
  if (!name) return DEFAULT_AVATAR_CHAR;
  return name.charAt(0).toUpperCase();
}

/**
 * Formats an ISO date string into a readable date.
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return UNKNOWN_VALUE;
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
