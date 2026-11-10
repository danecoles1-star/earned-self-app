// The Now card: a preview of the prepared step experience with one clear
// action. Shared by the app and the homepage preview so they always match.
import type { ReactNode } from "react";
import type { PreparedStep, SessionPart, Snapshot } from "../data/types";

export type NowCardState = "ready" | "later" | "missed" | "unscheduled";

export type { SessionPart };

const dotClass: Record<NowCardState, string> = {
  ready: "es-dot-ember",
  later: "es-dot-gold",
  missed: "es-dot-mineral",
  unscheduled: "es-dot-mineral",
};

export function NowCard({
  state,
  image,
  imagePosition = "50% 30%",
  tag,
  when,
  title,
  parts,
  action,
  onAction,
  disabled,
  secondary,
  foot,
  inert,
}: {
  state: NowCardState;
  image: string;
  imagePosition?: string;
  tag: string;
  when?: string;
  title: string;
  parts?: SessionPart[];
  action: string;
  onAction?: () => void;
  disabled?: boolean;
  secondary?: ReactNode;
  foot?: string;
  /** Static preview (homepage): renders the action as a span. */
  inert?: boolean;
}) {
  const play = (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
    </svg>
  );
  return (
    <section
      className={`es-now-card es-now-${state}`}
      aria-labelledby={inert ? undefined : "today-step"}
    >
      <div className="es-now-media">
        <img
          src={image}
          alt=""
          style={{ objectPosition: imagePosition }}
          draggable={false}
        />
        <span className="es-now-tag">
          <i className={dotClass[state]} aria-hidden="true" />
          {tag}
        </span>
      </div>
      <div className="es-now-body">
        {when && <p className="es-now-when">{when}</p>}
        <h2 id={inert ? undefined : "today-step"}>{title}</h2>
        {!!parts?.length && (
          <ul className="es-now-parts" aria-label="Session parts">
            {parts.map((p, i) => (
              <li key={i}>
                {p.label} · {p.minutes} min
              </li>
            ))}
          </ul>
        )}
        {inert ? (
          <span className="es-begin">
            {play}
            {action}
          </span>
        ) : (
          <button className="es-begin" disabled={disabled} onClick={onAction}>
            {play}
            {action}
          </button>
        )}
        {secondary}
        {foot && <p className="es-now-foot">{foot}</p>}
      </div>
    </section>
  );
}

export function totalMinutes(parts?: SessionPart[]) {
  return parts?.reduce((n, p) => n + p.minutes, 0) || 0;
}

/** The prepared experience for a step revision, if the pipeline has made one. */
export function preparedStep(
  s: Snapshot,
  commitmentId: string | undefined,
  revision: number | undefined,
): PreparedStep | null {
  if (!commitmentId) return null;
  const p = s.prepared?.find(
    (x) =>
      x.commitment_id === commitmentId && x.commitment_revision === revision,
  );
  if (!p) return null;
  const parts = (Array.isArray(p.parts) ? p.parts : []).filter(
    (x) =>
      x &&
      typeof x.label === "string" &&
      x.label.trim() &&
      Number.isFinite(x.minutes) &&
      x.minutes > 0,
  );
  const image =
    p.image_url && /^(\/(?!\/)|https:\/\/|blob:|data:image\/)/.test(p.image_url)
      ? p.image_url
      : null;
  return { ...p, parts, image_url: image };
}

/** "Today · 6:30 AM", "Tonight · 10:00 PM", "Tomorrow · …", "Thursday · …". */
export function friendlyWhen(
  startsAt: string | null | undefined,
  now = new Date(),
) {
  if (!startsAt) return "";
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return "";
  const day = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(now)) / 86400000);
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const label =
    diff === 0
      ? d.getHours() >= 17
        ? "Tonight"
        : "Today"
      : diff === 1
        ? "Tomorrow"
        : diff === -1
          ? "Yesterday"
          : diff > 1 && diff < 7
            ? d.toLocaleDateString(undefined, { weekday: "long" })
            : d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
  return `${label} · ${time}`;
}
