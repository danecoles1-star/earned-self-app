import type { Goal, Snapshot } from "../data/types";
import { currentSchedule, definition } from "../data/domain";
import { displaySchedule } from "../data/time";
export function Paused({
  goal: g,
  navigate,
}: {
  goal: Goal;
  navigate: (p: string) => void;
}) {
  return (
    <section className="paused-card" aria-label="Challenge paused">
      <h2>Paused. Still yours.</h2>
      <p>Your preparation and Proof are saved. Dates stay as planned.</p>
      <button className="button" onClick={() => navigate("/decision/" + g.id)}>
        Review and resume
      </button>
      <button className="quiet" onClick={() => navigate("/manage")}>
        Review my plan
      </button>
    </section>
  );
}
export function ScheduleReview({
  goal: g,
  snapshot: s,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const pending = s.commitments.filter(
    (c) => c.goal_id === g.id && c.state === "active",
  );
  return (
    <section className="schedule-review">
      <h2>Review your scheduled work</h2>
      <p className="small">
        Resume keeps every date and commitment. Nothing is marked missed or
        completed. Update calendar events separately.
      </p>
      {pending.map((c) => {
        const t = currentSchedule(s, c.id);
        const outdated =
          !!t?.starts_at && new Date(t.starts_at).getTime() < Date.now();
        return (
          <div className="reflection-answer" key={c.id}>
            <strong>{definition(s, c.id, c.revision)?.action}</strong>
            <p>
              {displaySchedule(t?.local_date, t?.local_time, t?.time_zone)}
              {outdated ? " · Earlier date" : ""}
            </p>
            {c.milestone_id && (
              <button
                className="button secondary"
                onClick={() => navigate("/revise/" + g.id + "/" + c.id)}
              >
                Review this agreement
              </button>
            )}
          </div>
        );
      })}
      {!pending.length && (
        <p>No scheduled steps. Add a step in Plan before resuming.</p>
      )}
      <button className="quiet" onClick={() => navigate("/manage")}>
        Review milestone dates in Plan
      </button>
    </section>
  );
}
