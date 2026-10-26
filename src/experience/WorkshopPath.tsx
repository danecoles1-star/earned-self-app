import type { Goal, Snapshot } from "../data/types";
import { currentMilestone } from "../data/domain";
/** A real milestone count, never a fixed number of illustrated achievements. */
export function WorkshopPath({
  goal,
  snapshot,
  onReview,
}: {
  goal: Goal;
  snapshot: Snapshot;
  onReview: (id: string) => void;
}) {
  const current = ["completed", "changed_direction", "abandoned"].includes(
    goal.status,
  )
    ? undefined
    : currentMilestone(snapshot, goal);
  const done = goal.milestones.filter((m) =>
    snapshot.events.some(
      (e) =>
        e.goal_id === goal.id &&
        e.kind === "milestone" &&
        e.data.milestoneId === m.id,
    ),
  ).length;
  return (
    <section
      className="workshop-path route-map-stage"
      aria-label="Your milestone progression"
    >
      <div>
        <span className="section-label">
          {goal.status === "paused" ? "Paused" : "Your milestones"}
        </span>
        <p className="path-caption">
          {done} of {goal.milestones.length} milestones completed
        </p>
        {current ? (
          <button
            className="route-current"
            aria-current="step"
            aria-controls={"milestone-" + current.id}
            onClick={() => onReview(current.id)}
          >
            <small>
              {goal.status === "paused"
                ? "Paused milestone"
                : "Current milestone"}
            </small>
            <strong>{current.title}</strong>
          </button>
        ) : (
          <p>
            {goal.milestones.length
              ? "Your recorded milestones follow."
              : "Add a milestone to prepare for your challenge."}
          </p>
        )}
      </div>
    </section>
  );
}
