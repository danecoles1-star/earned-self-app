// Shared notices (November 2026): the save/error toast, the "kept on this
// device" line and empty states. One look everywhere, in light and dark.
import type { ReactNode } from "react";

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.6 2.6L16 9.5" />
    </svg>
  );
}

/** Tells the member their draft is safe without claiming an account save. */
export function DraftKept({
  label = "Draft kept on this device",
}: {
  label?: string;
}) {
  return (
    <p className="es-kept">
      <Check />
      <span>{label}</span>
    </p>
  );
}

const tone = (notice: string) =>
  /^Saving/.test(notice)
    ? "saving"
    : /^Not saved|could not|fail/i.test(notice)
      ? "failed"
      : notice
        ? "saved"
        : "idle";

/** The one place save and error messages appear. The status region is always
 * present so screen readers announce each change. */
export function Notices({
  notice,
  error,
  onDismiss,
}: {
  notice: string;
  error: string;
  onDismiss: () => void;
}) {
  return (
    <div className="global-status es-toasts">
      <p className="live-status es-toast" role="status" data-tone={tone(notice)}>
        {notice}
      </p>
      {error && (
        <div className="es-toast es-toast-error">
          <p className="notice error" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="es-toast-close"
            aria-label="Dismiss message"
            onClick={onDismiss}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/** A calm placeholder for a screen or section with nothing in it yet. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="es-empty">
      <span className="es-empty-mark" aria-hidden="true" />
      <h2>{title}</h2>
      {children && <div className="es-empty-body">{children}</div>}
      {action}
    </section>
  );
}
