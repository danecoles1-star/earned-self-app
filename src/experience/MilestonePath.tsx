import { useLayoutEffect, useRef, useState } from "react";
import type { Goal, Snapshot } from "../data/types";
import { currentMilestone } from "../data/domain";

/** Display only. Advancement comes exclusively from recorded milestone completion. */
export function MilestonePath({
  goal,
  snapshot,
  onReview,
}: {
  goal: Goal;
  snapshot: Snapshot;
  onReview?: (id: string) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const [curve, setCurve] = useState("");
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const bounds = list.getBoundingClientRect();
      const centers = Array.from(
        list.querySelectorAll<HTMLElement>(".path-marker"),
      ).map((marker) => {
        const rect = marker.getBoundingClientRect();
        // Layout coordinates remain correct when the app is visually scaled.
        const scale = bounds.height / list.offsetHeight || 1;
        return (rect.top + rect.height / 2 - bounds.top) / scale;
      });
      const points = [0, ...centers, list.offsetHeight];
      let d = "M 22 0";
      for (let i = 1; i < points.length; i++) {
        const start = points[i - 1],
          end = points[i],
          bend = i % 2 ? 40 : 4;
        d += ` C ${bend} ${start + (end - start) / 3}, ${bend} ${end - (end - start) / 3}, 22 ${end}`;
      }
      setCurve(d);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [goal.milestones]);
  const current = currentMilestone(snapshot, goal);
  if (!goal.milestones.length) return null;
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    goal.status,
  );
  const review = (id: string) => {
    if (onReview) {
      onReview(id);
      return;
    }
    const target = document.getElementById(
      "milestone-" + id,
    ) as HTMLDetailsElement | null;
    if (target) {
      target.open = true;
      target.scrollIntoView({ block: "start", behavior: "auto" });
      target.querySelector("summary")?.focus({ preventScroll: true });
    }
  };
  return (
    <nav className="journey-path" aria-label="Your milestone path">
      <svg className="journey-spine" aria-hidden="true" focusable="false">
        <path
          d={curve}
          fill="none"
          stroke="#5E7783"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <ol ref={listRef}>
        {goal.milestones.map((milestone, index) => {
          const done = snapshot.events.some(
            (e) =>
              e.goal_id === goal.id &&
              e.kind === "milestone" &&
              e.data.milestoneId === milestone.id,
          );
          const active = !ended && milestone.id === current?.id;
          const state = done
            ? "Completed"
            : active
              ? goal.status === "paused"
                ? "Paused milestone"
                : "Current milestone"
              : ended
                ? "Not completed"
                : "Upcoming";
          return (
            <li
              key={milestone.id}
              data-state={done ? "completed" : active ? "current" : "upcoming"}
            >
              <button
                type="button"
                onClick={() => review(milestone.id)}
                aria-current={active ? "step" : undefined}
                aria-controls={"milestone-" + milestone.id}
              >
                <span className="path-marker" aria-hidden="true" />
                <span className="path-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="path-copy">
                  <small>{state}</small>
                  <strong>{milestone.title}</strong>
                  <span>{milestone.criterion}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
