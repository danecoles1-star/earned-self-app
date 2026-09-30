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
export function PlanStep({
  goal,
  snapshot,
  save,
  saving,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
}) {
  const milestones = goal.milestones.filter(
    (m) =>
      !snapshot.events.some(
        (e) =>
          e.goal_id === goal.id &&
          e.kind === "milestone" &&
          e.data.milestoneId === m.id,
      ),
  );
  const key = `earned-self:planned-step:${goal.owner_id}:${goal.id}`;
  const { value, change, error } = useTextDraft(key, {
    id: crypto.randomUUID(),
    milestoneId: milestones[0]?.id || "",
    action: "",
    criterion: "",
  });
  return (
    <Page
      title="Add a preparation step."
      sub="One useful action toward a milestone. Schedule it when you make it your current step."
      dark={false}
      back={() => navigate("/app")}
      footer={
        <>
          <p role="alert">{error}</p>
          <button
            className="button"
            disabled={
              saving ||
              !value.action.trim() ||
              !value.criterion.trim() ||
              !milestones.some((m) => m.id === value.milestoneId)
            }
            onClick={() =>
              void save("planned_step", { goalId: goal.id, ...value }, () => {
                localStorage.removeItem(key);
                navigate("/manage");
              })
            }
          >
            Save step to plan
          </button>
        </>
      }
    >
      {milestones.length ? (
        <>
          <label>
            Milestone
            <select
              value={value.milestoneId}
              onChange={(e) =>
                change({ ...value, milestoneId: e.target.value })
              }
            >
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="What will you do?"
            value={value.action}
            onChange={(action) => change({ ...value, action })}
          />
          <Input
            label="What will be done?"
            value={value.criterion}
            onChange={(criterion) => change({ ...value, criterion })}
          />
        </>
      ) : (
        <>
          <p>Add your first milestone to organize its preparation steps.</p>
          <button
            className="button"
            onClick={() => navigate("/add-milestone/" + goal.id)}
          >
            Add milestone
          </button>
        </>
      )}
    </Page>
  );
}
