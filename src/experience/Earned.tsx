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
import { preparedStep, totalMinutes } from "./NowCard";

/** Tab icons: the Earned Self mark (Now), folded map (Plan) and cairn (Proof). */
export function TabIcon({ name }: { name: "now" | "plan" | "proof" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "now" && (
        <g strokeWidth="2">
          {/* The Earned Self mark: a path stepping up, ember at the step */}
          <path d="M2.9 9.8A9.6 9.6 0 0 1 20.9 9.9" />
          <path d="M3.2 13.9a9.6 9.6 0 0 0 17.9 1.3" />
          <path d="M20.9 9.9h-5c-.6 0-1 .4-1 1s-.4 1-1 1" />
          <path d="M13.9 11.9h-4.5" stroke="#FF5B36" />
          <path d="M9.4 11.9c-.6 0-1 .4-1 1s-.4 1-1 1H3.2" />
        </g>
      )}
      {name === "plan" && (
        <>
          {/* Folded map with a route to a pin */}
          <path d="M3 6.5 8.5 4l6 2.5L20.5 4v13.5L14.5 20l-6-2.5L3 20z" />
          <path d="M8.5 4v13.5M14.5 6.5V20" strokeOpacity="0.55" />
          <circle cx="5.9" cy="15.4" r="1.1" fill="currentColor" stroke="none" />
          <path d="M8 14.6c1.3-.9 2.6-.6 3.8-1.2" strokeDasharray="1.4 1.8" />
          <path
            d="M16.9 13s-2.3-2.3-2.3-4a2.3 2.3 0 0 1 4.6 0c0 1.7-2.3 4-2.3 4z"
            fill="currentColor"
            fillOpacity="0.22"
          />
        </>
      )}
      {name === "proof" && (
        <>
          {/* Cairn: three stacked stones marking the trail walked */}
          <path
            d="M3.6 20.6c-.9-.6-.8-2 .2-2.8 1-.8 2.7-1.3 4.5-1.4h7.4c1.9.1 3.6.6 4.4 1.6.6.8.5 1.9-.4 2.6z"
            fill="currentColor"
            fillOpacity="0.22"
          />
          <path d="M6.4 15.1c-.8-.5-.7-1.7.3-2.5.9-.7 2.3-1 3.8-1h3c1.7.1 3 .6 3.4 1.5.4.9-.1 1.7-.9 2z" />
          <path d="M10 10.5c-.7-.6-.4-1.8.6-2.4.8-.5 2-.6 3.1-.4 1.1.2 1.9.9 1.9 1.7 0 .6-.4 1-1 1.1z" />
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
  const prepared = preparedStep(s, c.id, c.revision);
  const parts = prepared?.parts;
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
          {parts?.length
            ? `${totalMinutes(parts)} min · ${parts.length} ${parts.length === 1 ? "part" : "parts"}`
            : displaySchedule(
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
            parts={parts}
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
