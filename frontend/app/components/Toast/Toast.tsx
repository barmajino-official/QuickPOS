/**
 * @file Toast.tsx
 * @description Global toast component that listens to uiStore and displays messages.
 */
import { useUiStore } from '~/store/uiStore';
import './Toast.css';

export function Toast() {
  const { toast, clearToast } = useUiStore();

  if (!toast) return null;

  return (
    <div className="toast toast-top toast-end z-50 animate-fade-up pr-6 pt-6">
      <div className={`alert alert-${toast.type} m3-elevation-3 shadow-lg rounded-box flex items-center justify-between gap-4 px-5 py-3 border-none min-w-[280px]`}>
        <span className="text-sm font-medium">{toast.message}</span>
        <button className="btn btn-ghost btn-sm btn-circle opacity-70 hover:opacity-100" onClick={clearToast}>✕</button>
      </div>
    </div>
  );
}
