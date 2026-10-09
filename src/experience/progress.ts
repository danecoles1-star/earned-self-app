import type { Snapshot } from "../data/types";
import { currentReport } from "../data/domain";

/** Counts recorded completions only, using the latest report for each occurrence. */
export function completedProgress(
  snapshot: Snapshot,
  goalIds = snapshot.goals.map((g) => g.id),
) {
  const ids = new Set(goalIds);
  const steps = new Set(
    snapshot.evidence
      .filter(
        (e) =>
          ids.has(e.goal_id) &&
          currentReport(snapshot, e.id, e.revision)?.result === "done",
      )
      .map((e) => e.commitment_id),
  ).size;
  const milestones = new Set(
    snapshot.events
      .filter(
        (e) =>
          ids.has(e.goal_id) && e.kind === "milestone" && e.data.milestoneId,
      )
      .map((e) => `${e.goal_id}:${e.data.milestoneId}`),
  ).size;
  const challenges = new Set(
    snapshot.goals
      .filter((g) => ids.has(g.id) && g.status === "completed")
      .map((g) => g.id),
  ).size;
  return { steps, milestones, challenges };
}
