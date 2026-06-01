/**
 * @file uiStore.ts
 * @description Zustand store for global UI state: toasts and the mobile sidebar drawer.
 *
 * @receives showToast    – queue a toast (auto-dismisses after TOAST_DURATION_MS)
 * @receives toggleSidebar – open/close the mobile navigation drawer
 * @receives closeSidebar  – force-close the drawer (used after navigating on mobile)
 *
 * @notes The sidebar flag only affects layout below the `md` breakpoint; on desktop
 *        the sidebar is always visible regardless of this value.
 */
import { create } from 'zustand';

const TOAST_DURATION_MS = 3000;

type ToastType = 'success' | 'error' | 'info';

interface UiState {
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  toast: null,
  showToast: (message:string, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((state) => (state.toast?.message === message ? { toast: null } : state));
    }, TOAST_DURATION_MS);
  },
  clearToast: () => set({ toast: null }),

  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
