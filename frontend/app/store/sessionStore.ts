/**
 * @file sessionStore.ts
 * @description Zustand store for managing the authenticated user session.
 *              Persisted to localStorage so session survives reloads.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaffProfile } from '~/types';

interface SessionState {
  token: string | null;
  staff: StaffProfile | null;
  setSession: (token: string, staff: StaffProfile) => void;
  updateStaff: (staff: StaffProfile) => void;
  clearSession: () => void;
  hasPermission: (key: string) => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      staff: null,
      setSession: (token, staff) => set({ token, staff }),
      updateStaff: (staff) => set({ staff }),
      clearSession: () => set({ token: null, staff: null }),
      hasPermission: (key: string) => {
        const { staff } = get();
        return staff?.permissions?.[key] === true;
      },
    }),
    {
      name: 'pos_session',
    }
  )
);
