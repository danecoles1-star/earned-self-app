// Redesign surfaces (November 2026): focus session, milestone earned,
// milestone tracker and tab icons. Copy and numbers come from saved data only.
import { useEffect, useState } from "react";
import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentReport,
  currentSchedule,
  definition,
} from "../data/domain";
import { displaySchedule } from "../data/time";
import { StepTimer } from "./StepTimer";

export function TabIcon({ name }: { name: "now" | "plan" | "proof" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "now" && (
        <path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 5v2M5 9l1.5 1.5M19 9l-1.5 1.5" />
      )}
      {name === "plan" && <path d="M3 20l6-12 4 7 3-4 5 9z" />}
      {name === "proof" && (
        <>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M9 12l2 2 4-4" />
        </>
      )}
    </svg>
  );
}

export function MountainMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 20l6-12 4 7 3-4 5 9z" />
    </svg>
  );
}

/** Milestones earned are recorded "milestone" events; nothing is inferred. */
export function earnedMilestones(s: Snapshot, g: Goal) {
  return new Set(
    s.events
      .filter((e) => e.goal_id === g.id && e.kind === "milestone")
      .map((e) => e.data.milestoneId),
  );
}

/** A comeback is a recorded step that followed a missed or partial one. */
export function comebacks(s: Snapshot, g: Goal) {
  const results = s.evidence
    .filter((e) => e.goal_id === g.id)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .map((e) => currentReport(s, e.id, e.revision)?.result);
  let count = 0;
  for (let i = 1; i < results.length; i++)
    if (results[i - 1] && results[i - 1] !== "done" && results[i]) count++;
  return count;
}

export function MilestoneTracker({
  goal: g,
  snapshot: s,
}: {
  goal: Goal;
  snapshot: Snapshot;
}) {
  const earned = earnedMilestones(s, g);
  const steps = s.evidence.filter((e) => e.goal_id === g.id).length;
  if (!g.milestones.length) return null;
  return (
    <section className="es-tracker" aria-label="Milestones">
      <ol className="es-tracker-path">
        {g.milestones.map((m, i) => {
          const done = earned.has(m.id);
          return (
            <li
              key={m.id}
              className={done ? "es-badge es-badge-earned" : "es-badge"}
              aria-label={`Milestone ${i + 1} of ${g.milestones.length}, ${done ? "earned" : "ahead"}: ${m.title}`}
              title={m.title}
            >
              {done ? <MountainMark /> : <span aria-hidden="true">{i + 1}</span>}
            </li>
          );
        })}
      </ol>
      <p className="es-tracker-totals">
        <span>
          <strong>
            {earned.size} of {g.milestones.length}
          </strong>{" "}
          milestones
        </span>
        <span>
          <strong>{steps}</strong> {steps === 1 ? "step" : "steps"} recorded
        </span>
        <span>
          <strong>{comebacks(s, g)}</strong>{" "}
          {comebacks(s, g) === 1 ? "comeback" : "comebacks"}
        </span>
      </p>
    </section>
  );
}

/** Keeps the screen awake while a session runs, where the browser allows it. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<Sentinel> };
    };
    if (!active || !nav.wakeLock) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      nav.wakeLock!
        .request("screen")
        .then((s) => {
          if (cancelled) void s.release();
          else sentinel = s;
        })
        .catch(() => {});
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}

export function FocusSession({
  goal: g,
  snapshot: s,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const c = currentAction(s, g.id)!;
  const d = definition(s, c.id, c.revision)!;
  const schedule = currentSchedule(s, c.id);
  const milestone = g.milestones.find((m) => m.id === c.milestone_id);
  const [running, setRunning] = useState(false);
  useWakeLock(running);
  return (
    <div className="es-focus">
      <header className="es-focus-header">
        <button
          className="es-icon-button"
          aria-label="Close session"
          onClick={() => navigate("/app")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="es-focus-meta">
          {displaySchedule(
            schedule?.local_date,
            schedule?.local_time,
            schedule?.time_zone,
          )}
        </span>
        <span className="es-icon-spacer" />
      </header>
      <main id="main" className="es-focus-main">
        <p className="es-eyebrow es-eyebrow-ember">How it goes</p>
        <h1 tabIndex={-1}>{d.action}</h1>
        {milestone && (
          <p className="es-focus-why">Toward: {milestone.title}</p>
        )}
        <dl className="es-focus-plan">
          {schedule?.location && (
            <div>
              <dt>Where</dt>
              <dd>{schedule.location}</dd>
            </div>
          )}
          <div>
            <dt>Done when</dt>
            <dd>{d.criterion}</dd>
          </div>
        </dl>
        <div className="es-focus-timer">
          <StepTimer
            key={c.id}
            identity={`${g.owner_id}:${c.id}:${c.revision}`}
            onRunningChange={setRunning}
          />
        </div>
        <p className="es-focus-note">
          Your screen stays on while the timer runs.
        </p>
      </main>
      <footer className="es-focus-footer">
        <button
          className="es-button es-button-light"
          onClick={() => navigate("/report/" + g.id)}
        >
          Finish and check in
        </button>
      </footer>
    </div>
  );
}

export function MilestoneEarned({
  goal: g,
  snapshot: s,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const event = s.events
    .filter((e) => e.goal_id === g.id && e.kind === "milestone")
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  const index = g.milestones.findIndex((m) => m.id === event?.data.milestoneId);
  const milestone = g.milestones[index];
  const steps = s.evidence.filter((e) => e.goal_id === g.id).length;
  return (
    <div className="es-earned">
      <main id="main" className="es-earned-main">
        <span className="es-earned-badge">
          <MountainMark size={40} />
        </span>
        <p className="es-eyebrow es-eyebrow-gold">
          {milestone
            ? `Milestone ${index + 1} of ${g.milestones.length} · earned`
            : "Milestone earned"}
        </p>
        <h1 tabIndex={-1}>{milestone?.title || "You reached a turning point."}</h1>
        {event?.data.detail && (
          <blockquote className="es-earned-quote">
            “{event.data.detail}”
          </blockquote>
        )}
        <dl className="es-earned-stats">
          <div>
            <dd>{steps}</dd>
            <dt>{steps === 1 ? "step recorded" : "steps recorded"}</dt>
          </div>
          <div>
            <dd>{comebacks(s, g)}</dd>
            <dt>{comebacks(s, g) === 1 ? "comeback" : "comebacks"}</dt>
          </div>
          <div>
            <dd>
              {earnedMilestones(s, g).size}/{g.milestones.length}
            </dd>
            <dt>milestones</dt>
          </div>
        </dl>
      </main>
      <footer className="es-earned-footer">
        <button
          className="es-button es-button-light"
          onClick={() => navigate("/proof")}
        >
          Keep it in Proof
        </button>
        <button
          className="es-text-button es-text-button-light"
          onClick={() => navigate("/wallpaper/" + g.id)}
        >
          Make it my lock screen
        </button>
        <button
          className="es-text-button es-text-button-light"
          onClick={() => navigate("/app")}
        >
          See what comes next
        </button>
      </footer>
    </div>
  );
}
