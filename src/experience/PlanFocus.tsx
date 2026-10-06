import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
} from "../data/domain";
import { displaySchedule } from "../data/time";
export function PlanFocus({
  goal: g,
  snapshot: s,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const m = currentMilestone(s, g),
    next = currentAction(s, g.id);
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    g.status,
  );
  if (!m || ended) return null;
  const steps = s.commitments
    .filter(
      (c) =>
        c.goal_id === g.id && c.milestone_id === m.id && c.state === "active",
    )
    .sort((a, b) => {
      if (a.id === next?.id) return -1;
      if (b.id === next?.id) return 1;
      const sa = currentSchedule(s, a.id),
        sb = currentSchedule(s, b.id);
      return `${sa?.local_date || "9999"} ${sa?.local_time || ""}`.localeCompare(
        `${sb?.local_date || "9999"} ${sb?.local_time || ""}`,
      );
    });
  return (
    <section
      className="plan-focus-stage"
      aria-label="Current milestone and next steps"
    >
      <span className="section-label">
        {g.status === "paused" ? "Paused milestone" : "Current milestone"}
      </span>
      <h2>{m.title}</h2>
      <p className="milestone-criterion">{m.criterion}</p>
      <ol className="focus-step-path">
        {steps.map((c, i) => {
          const time = currentSchedule(s, c.id);
          return (
            <li key={c.id} data-current={c.id === next?.id}>
              <button
                className="quiet"
                onClick={() =>
                  navigate(
                    c.id === next?.id ? "/app" : "/revise/" + g.id + "/" + c.id,
                  )
                }
              >
                <span className="section-label">
                  {g.status === "paused"
                    ? "Paused"
                    : i === 0
                      ? "Next step"
                      : "Up next"}
                </span>
                <strong>
                  {definition(s, c.id, c.revision)?.action ||
                    "Preparation step"}
                </strong>
                <small>
                  {displaySchedule(
                    time?.local_date,
                    time?.local_time,
                    time?.time_zone,
                  )}
                </small>
              </button>
            </li>
          );
        })}
        {!steps.length && (
          <li>
            <p>No preparation steps scheduled.</p>
          </li>
        )}
      </ol>
      <button className="button" onClick={() => navigate("/milestone/" + g.id)}>
        Review milestone
      </button>
      <div className="plan-create-actions">
        <button
          className="quiet"
          onClick={() => navigate("/add-step/" + g.id + "?milestone=" + m.id)}
        >
          Add step
        </button>
        <button
          className="quiet"
          onClick={() => navigate("/add-milestone/" + g.id)}
        >
          Add milestone
        </button>
      </div>
    </section>
  );
}
