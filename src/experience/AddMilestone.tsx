import { guidanceExample } from "./guidance";
import { scheduledInstant } from "../data/time";
import { useState } from "react";
import type { Goal, Milestone } from "../data/types";
import { foundationKeys, ready } from "../data/domain";
import {
  ScheduleFields,
  useTextDraft,
  type Save,
} from "../components/PursuitScreens";
import { Page, Input, Help } from "./ui";
export function AddMilestone({
  goal,
  save,
  saving,
  navigate,
}: {
  goal: Goal;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
}) {
  const key = `earned-self:append:${goal.owner_id}:${goal.id}:${goal.revision}`;
  const { value, change, error } = useTextDraft<Milestone>(key, {
    id: crypto.randomUUID(),
    title: "",
    criterion: "",
    localDate: "",
    localTime: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [issue, setIssue] = useState("");
  const submit = () => {
    const milestones = [...goal.milestones, value];
    try {
      const target = scheduledInstant(
        value.localDate,
        value.localTime,
        value.timeZone,
      );
      const last = goal.milestones.at(-1);
      if (
        last &&
        target < scheduledInstant(last.localDate, last.localTime, last.timeZone)
      )
        throw new Error("Place this milestone after the previous milestone.");
      if (goal.status !== "draft") ready({ ...goal, milestones });
      setIssue("");
      void save(
        "plan",
        {
          goalId: goal.id,
          version: goal.version,
          ...Object.fromEntries(
            foundationKeys.map((k) => [k, goal[k as keyof Goal]]),
          ),
          milestones,
        },
        () => {
          localStorage.removeItem(key);
          navigate("/manage");
        },
      );
    } catch (e) {
      setIssue((e as Error).message);
    }
  };
  return (
    <Page
      title="Build toward your challenge."
      sub="Add the next milestone. Keep earlier agreements intact."
      dark={false}
      back={() => navigate("/app")}
      footer={
        <>
          <p role="alert">{error || issue}</p>
          <button
            className="button"
            disabled={
              saving ||
              !value.title.trim() ||
              !value.criterion.trim() ||
              !value.localDate ||
              !value.localTime
            }
            onClick={submit}
          >
            Save milestone
          </button>
        </>
      }
    >
      <Input
        label="Milestone"
        value={value.title}
        onChange={(title) => change({ ...value, title })}
        placeholder="What will you work up to?"
      />
      <Input
        label="What will success look like?"
        value={value.criterion}
        onChange={(criterion) => change({ ...value, criterion })}
      />
      <Help
        ambition={goal.words}
        field="Choose a turning point that demonstrates growing readiness."
        example={guidanceExample(goal.words, "milestone")}
      />
      <ScheduleFields
        prefix="Milestone target"
        required
        value={value}
        change={(v) => change({ ...value, ...v })}
      />
    </Page>
  );
}
