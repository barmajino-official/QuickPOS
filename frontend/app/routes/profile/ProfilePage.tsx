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
        <div className="p-4 sm:p-6 lg:p-8 w-full" style={{ animation: 'fadeUp 0.5s var(--m3-emphasized) both' }}>
          <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm border border-[var(--color-base-300)]">
            
            {/* Header Section */}
            <div className="p-8 border-b border-[var(--color-base-300)] flex items-center gap-6">
              <div className="flex items-center justify-center">
                <div className="bg-[var(--color-primary)] text-[var(--color-primary-content)] rounded-full w-24 h-24 flex items-center justify-center font-bold text-4xl shadow-sm">
                  {getInitial(staff.name)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-[var(--color-base-content)]">{staff.name}</h2>
                <span className="text-sm text-[var(--color-neutral)] uppercase tracking-widest font-medium">{staff.role}</span>
              </div>
            </div>

            {/* Body Section */}
            <div className="p-8 space-y-8">
              
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-[var(--color-base-content)]">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[var(--color-neutral)] uppercase tracking-wide">Email Address</span>
                    <span 
                      className="text-base text-[var(--color-base-content)] font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={handleCopyEmail}
                      title="Click to copy"
                    >
                      {staff.email}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[var(--color-neutral)] uppercase tracking-wide">Phone Number</span>
                    <span className="text-base text-[var(--color-base-content)] font-medium">
                      {UNKNOWN_VALUE}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-[var(--color-base-content)]">System Access</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[var(--color-neutral)] uppercase tracking-wide">Role</span>
                    <span className="text-base text-[var(--color-base-content)] font-medium capitalize">{staff.role}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[var(--color-neutral)] uppercase tracking-wide">Member Since</span>
                    <span className="text-base text-[var(--color-base-content)] font-medium">
                      {formatDate(staff.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-[var(--color-base-content)]">Assigned Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(staff.permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <span key={key} className="badge badge-ghost bg-[var(--color-base-200)] text-[var(--color-neutral)] border-[var(--color-base-300)] font-medium px-4 py-3">
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
