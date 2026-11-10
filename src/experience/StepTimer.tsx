import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ring from "../assets/workshop/timer-ring.webp";
import type { SessionPart } from "../data/types";
type Clock = { elapsed: number; started: number | null };
export function elapsedTime(clock: Clock, now = Date.now()) {
  return Math.max(
    0,
    clock.elapsed + (clock.started === null ? 0 : now - clock.started),
  );
}
export function pauseTimer(identity: string, pausedAt = Date.now()) {
  const key = `earned-self:timer:${identity}`;
  try {
    const clock = JSON.parse(localStorage.getItem(key) || "null");
    if (
      clock &&
      Number.isFinite(clock.elapsed) &&
      Number.isFinite(clock.started)
    )
      localStorage.setItem(
        key,
        JSON.stringify({
          elapsed: elapsedTime(clock, Math.max(clock.started, pausedAt)),
          started: null,
        }),
      );
  } catch {}
}
export function StepTimer({
  identity,
  children,
  schedule,
  title,
  onRunningChange,
  parts,
}: {
  identity: string;
  children?: ReactNode;
  schedule?: ReactNode;
  title?: string;
  onRunningChange?: (running: boolean) => void;
  /** Prepared session parts: draws the segmented ring. */
  parts?: SessionPart[];
}) {
  const key = `earned-self:timer:${identity}`;
  const read = (): Clock => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      if (
        v &&
        Number.isFinite(v.elapsed) &&
        v.elapsed >= 0 &&
        (v.started === null || Number.isFinite(v.started))
      )
        return v;
    } catch {}
    return { elapsed: 0, started: null };
  };
  const [clock, setClock] = useState<Clock>(read);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  useEffect(() => {
    setClock(read());
    const sync = (e: StorageEvent) => {
      if (e.key === key) setClock(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    onRunningChange?.(clock.started !== null);
  }, [clock.started, onRunningChange]);
  const orbit = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      if (orbit.current) {
        const angle = media?.matches
          ? 35
          : 35 + ((elapsedTime(clock) % 16000) / 16000) * 360;
        orbit.current.style.transform = `rotate(${angle}deg)`;
      }
      if (clock.started !== null && !media?.matches)
        frame = requestAnimationFrame(paint);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      paint();
    };
    paint();
    media?.addEventListener("change", restart);
    return () => {
      cancelAnimationFrame(frame);
      media?.removeEventListener("change", restart);
    };
  }, [clock]);
  const seconds = Math.floor(elapsedTime(clock, now) / 1000);
  const display = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  const compactDisplay = seconds < 3600 ? display.slice(3) : display;
  const toggle = () => {
    const stamp = Date.now();
    const current = error ? clock : read();
    const next =
      current.started === null
        ? { ...current, started: stamp }
        : { elapsed: elapsedTime(current, stamp), started: null };
    setNow(stamp);
    setClock(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError("");
    } catch {
      setError("Timer cannot be saved on this device. Keep this page open.");
    }
  };
  const total = parts?.reduce((n, p) => n + p.minutes, 0) || 0;
  let current: { label: string; left: number; index: number } | null = null;
  if (parts && total) {
    let acc = 0;
    for (const [index, p] of parts.entries()) {
      acc += p.minutes * 60;
      if (seconds < acc) {
        current = {
          index,
          label: p.label,
          left: Math.ceil((acc - seconds) / 60),
        };
        break;
      }
    }
  }
  return (
    <div
      className="step-timer"
      data-running={clock.started !== null}
      data-parts={parts && total ? "true" : undefined}
    >
      {children && (
        <div className="timer-step-title">
          <span className="section-label">Current step</span>
          {children}
        </div>
      )}
      <div className="timer-face">
        <img className="timer-ring" src={ring} alt="" draggable={false} />
        {parts && total > 0 && (
          <SegmentRing parts={parts} total={total} seconds={seconds} />
        )}
        <span ref={orbit} className="timer-orbit" aria-hidden="true">
          <span className="timer-marker" />
        </span>
        <div className="timer-readout">
          {title && (
            <span className="timer-action-name" title={title}>
              {title}
            </span>
          )}
          <output
            className={seconds >= 3600 ? "timer-hours" : undefined}
            style={
              seconds >= 360000
                ? { fontSize: `${Math.max(14, 270 / compactDisplay.length)}px` }
                : undefined
            }
            aria-label="Elapsed time"
          >
            {compactDisplay}
          </output>
          <span className="timer-label">
            {parts && total
              ? current
                ? `${current.label} · ${current.left} min left`
                : "Planned time reached"
              : "Dedicated time"}
          </span>
          {schedule && <p className="timer-schedule">{schedule}</p>}
        </div>
      </div>
      {parts && total > 0 && (
        <ol className="timer-parts" aria-label="Session parts">
          {parts.map((p, i) => (
            <li
              key={i}
              aria-current={current?.index === i ? "step" : undefined}
            >
              {p.label} · {p.minutes} min
            </li>
          ))}
        </ol>
      )}
      <p className="timer-help" id="timer-help">
        Start the timer while you work. Check in when you finish.
      </p>
      <button className="button" onClick={toggle} aria-describedby="timer-help">
        {clock.started !== null
          ? "Pause timer"
          : clock.elapsed
            ? "Resume timer"
            : "Start timer"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

/** Ember ring split into the session's parts; each fills as time passes. */
function SegmentRing({
  parts,
  total,
  seconds,
}: {
  parts: SessionPart[];
  total: number;
  seconds: number;
}) {
  const size = 232;
  const r = 112;
  const c = 2 * Math.PI * r;
  const gap = parts.length > 1 ? 16 : 0;
  let offset = 0;
  let elapsed = seconds / 60;
  return (
    <svg
      className="timer-segments"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {parts.map((p, i) => {
        const arc = (p.minutes / total) * c;
        const partGap = Math.min(gap, arc / 2);
        const len = arc - partGap;
        const done = Math.max(0, Math.min(1, elapsed / p.minutes));
        elapsed -= p.minutes;
        const start = offset;
        offset += arc;
        return (
          <g key={i} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className="timer-seg-track"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0.01, len)} ${c}`}
              strokeDashoffset={-start}
            />
            {done > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                className="timer-seg-fill"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0.01, len * done)} ${c}`}
                strokeDashoffset={-start}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
