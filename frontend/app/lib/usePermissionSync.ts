/**
 * @file usePermissionSync.ts
 * @description Keeps the cached session permissions fresh. Re-fetches the current
 *              staff profile from /api/auth/me on mount, on a fixed interval, and
 *              whenever the tab regains focus — then writes it back into sessionStore.
 *
 * @notes Permissions are authoritative on the backend (checked per request from the
 *        database). This hook simply keeps the UI (sidebar links, route guards) in
 *        sync so an admin's change is reflected within ~SYNC_INTERVAL_MS without the
 *        user logging out and back in. A failed sync is ignored here — a 401 is
 *        handled globally by the API client.
 */
import { useEffect } from 'react';

import { authApi } from '~/api/auth';
import { useSessionStore } from '~/store/sessionStore';
import type { StaffProfile } from '~/types';

const SYNC_INTERVAL_MS = 20000;

export function usePermissionSync() {
  const token = useSessionStore((s) => s.token);
  const updateStaff = useSessionStore((s) => s.updateStaff);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const sync = async () => {
      try {
        const me = (await authApi.me()) as StaffProfile;
        if (active && me) updateStaff(me);
      } catch {
        /* 401 is handled globally by the API client; ignore transient errors. */
      }
    };

    sync();
    const intervalId = setInterval(sync, SYNC_INTERVAL_MS);
    window.addEventListener('focus', sync);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', sync);
    };
  }, [token, updateStaff]);
}
