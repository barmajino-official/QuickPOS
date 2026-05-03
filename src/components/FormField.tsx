// Shared form field components for consistent layout across all modals
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  hint?: string;
}

/** Single field with label, input slot, and inline error */
export function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-base-content/40">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-error font-medium flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/** Standard input CSS — keeps every input identical across pages */
export const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2 text-sm bg-base-100 border ${hasError ? "border-error focus:ring-error" : "border-base-300 focus:border-primary focus:ring-primary"} rounded-sm outline-none focus:ring-1 transition-colors text-base-content placeholder:text-base-content/30`;

/** Standardised modal wrapper */
interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formId: string;
  saving?: boolean;
  submitLabel: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function FormModal({
  title,
  onClose,
  onSubmit,
  formId,
  saving,
  submitLabel,
  children,
  size = "md",
}: ModalProps) {
  const maxW =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-base-100 rounded-md shadow-2xl w-full ${maxW} border border-base-300 max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-200/30 shrink-0">
          <h3 className="text-base font-bold text-base-content">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id={formId} onSubmit={onSubmit} noValidate>
            {children}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-base-300 bg-base-200/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost rounded-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="btn btn-sm btn-primary rounded-sm px-6 min-w-[100px]"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Section divider inside a form */
export function FormSection({ title }: { title: string }) {
  return (
    <div className="pt-1 pb-2 mb-1 border-b border-base-200">
      <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">
        {title}
      </p>
    </div>
  );
}
