import type { Goal, Snapshot } from "../data/types";
import { useTextDraft, type Save } from "../components/PursuitScreens";
import { Input, Page } from "./ui";
export function pendingSteps(s: Snapshot, g: Goal) {
  return s.events.filter(
    (e) =>
      e.goal_id === g.id &&
      e.kind === "planned_step" &&
      !s.events.some(
        (d) =>
          d.goal_id === g.id &&
          d.kind === "decision" &&
          d.data.plannedStepId === e.data.stepId,
      ),
  );
}
export { MoveEditor as PlanStep } from "./Actions";
