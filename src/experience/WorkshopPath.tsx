import { useEffect, useState } from "react";
import type { Goal, Snapshot } from "../data/types";
import { currentMilestone } from "../data/domain";
import doors from "../assets/workshop/plan-doors.webp";
import walker from "../assets/workshop/walker.png";
/** The drawing is a window onto the real ordered milestones, never extra invented milestones. */
export function WorkshopPath({
  goal,
  snapshot,
  onReview,
}: {
  goal: Goal;
  snapshot: Snapshot;
  onReview: (id: string) => void;
}) {
  const current = currentMilestone(snapshot, goal);
  const currentIndex = current
    ? goal.milestones.findIndex((m) => m.id === current.id)
    : Math.max(0, goal.milestones.length - 1);
  const start = Math.floor(currentIndex / 3) * 3;
  const visible = goal.milestones.slice(start, start + 3);
  const position =
    visible.length === 1 ? 50 : [21, 50, 79][Math.max(0, currentIndex - start)];
  const key = `earned-self:workshop-path:${goal.owner_id}:${goal.id}`;
  const [shown, setShown] = useState(() => {
    try {
      const old = JSON.parse(sessionStorage.getItem(key) || "null");
      return old &&
        old.start === start &&
        old.id !== current?.id &&
        snapshot.events.some(
          (e) =>
            e.goal_id === goal.id &&
            e.kind === "milestone" &&
            e.data.milestoneId === old.id,
        )
        ? old.position
        : position;
    } catch {
      return position;
    }
  });
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    let frame = 0,
      timer: ReturnType<typeof setTimeout> | undefined;
    if (shown !== position) {
      frame = requestAnimationFrame(() => {
        setMoving(true);
        setShown(position);
      });
      timer = setTimeout(() => setMoving(false), 1100);
    }
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({ id: current?.id, position, start }),
      );
    } catch {
      /* Animation is optional; no planning data lives here. */
    }
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [position, current?.id, key]);

  if (!visible.length)
    return (
      <section className="workshop-path-empty">
        <h2>Make the way forward clear.</h2>
        <p>Add your first milestone after your first action.</p>
      </section>
    );
  return (
    <section
      className="workshop-path"
      aria-label="Current milestone illustration"
      data-moving={moving}
    >
      <h2 className="path-heading">Your milestones</h2>
      <div className="door-scene">
        <img src={doors} alt="" className="doors-art" />
        <div className="door-labels">
          {visible.map((m, i) => (
            <button
              key={m.id}
              onClick={() => onReview(m.id)}
              aria-current={m.id === current?.id ? "step" : undefined}
              style={{
                left: `${visible.length === 1 ? 50 : [21, 50, 79][i]}%`,
              }}
            >
              <span>{start + i + 1}</span>
              {m.title}
            </button>
          ))}
        </div>
        <span
          className="door-current"
          style={{ left: `${shown}%` }}
          aria-hidden="true"
        />
        <img
          src={walker}
          alt=""
          className="door-walker"
          style={{ left: `${shown}%` }}
        />
      </div>
      <p className="path-caption">
        {goal.status === "paused"
          ? "Paused"
          : goal.status === "completed"
            ? "Challenge completed"
            : current
              ? `Milestone ${currentIndex + 1} of ${goal.milestones.length}`
              : "Milestones recorded"}
      </p>
      {current && (
        <div className="workshop-milestone">
          <h2>{current.title}</h2>
          <p>{current.criterion}</p>
        </div>
      )}
    </section>
  );
}
