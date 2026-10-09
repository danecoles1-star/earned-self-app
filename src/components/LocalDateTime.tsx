import { displayDate, displayTime } from "../data/time";

/** Keep the native control as the actual tap target while formatting the visible value. */
export function LocalDateTimeInput({
  id,
  kind,
  value,
  onChange,
  required,
}: {
  id: string;
  kind: "date" | "time";
  value: string;
  onChange: (s: string) => void;
  required: boolean;
}) {
  const formatted = (kind === "date" ? displayDate : displayTime)(value);
  return (
    <span className="local-datetime-control">
      <span
        className={"local-datetime-value" + (value ? "" : " empty")}
        aria-hidden="true"
      >
        {formatted || (kind === "date" ? "MM/DD/YYYY" : "hh:mm AM/PM")}
      </span>
      <svg
        aria-hidden="true"
        className="local-datetime-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {kind === "date" ? (
          <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4m10-4v4M3 10h18m-13 4h2m3 0h2m-7 4h2" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        )}
      </svg>
      <input
        id={id}
        type={kind}
        required={required}
        value={value}
        lang="en-US"
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            /* Native tap/focus remains available. */
          }
        }}
      />
    </span>
  );
}
