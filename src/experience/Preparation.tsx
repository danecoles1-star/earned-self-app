import { useState } from "react";
import type {
  Foundation,
  Goal,
  Milestone,
  Snapshot,
  User,
} from "../data/types";
import { currentAction, foundationKeys, ready } from "../data/domain";
import {
  useTextDraft,
  ScheduleFields,
  type Save,
} from "../components/PursuitScreens";
import { Page, Input, Help } from "./ui";
export function Preparation({
  goal,
  save,
  saving,
  navigate,
  snapshot,
}: {
  goal: Goal;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
  snapshot: Snapshot;
  user: User;
}) {
  const key = `earned-self:plan:${goal.owner_id}:${goal.id}:${goal.revision}`;
  const marker = "\n\nMy plan for the hard part:\n";
  const split = goal.constraints.lastIndexOf(marker);
  const { value, change, error } = useTextDraft<
    Foundation & { hardPart: string }
  >(key, {
    ...(Object.fromEntries(
      foundationKeys.map((k) => [k, goal[k as keyof Goal]]),
    ) as unknown as Foundation),
    constraints:
      split < 0 ? goal.constraints : goal.constraints.slice(0, split),
    hardPart: split < 0 ? "" : goal.constraints.slice(split + marker.length),
  });
  const initial = !goal.vision.trim()
    ? 0
    : !goal.words.trim()
      ? 1
      : !goal.outcome.trim()
        ? 2
        : !goal.meaning.trim()
          ? 3
          : 4;
  const [step, setStep] = useState(initial),
    [issue, setIssue] = useState("");
  const sequence = Array.from(
    { length: 10 - initial },
    (_, i) => i + initial,
  ).filter((i) => i !== 3 || !goal.meaning.trim());
  const fields = [
    [
      "vision",
      "Who will you become?",
      "Your future self",
      "I want to become someone who…",
    ],
    ["words", "Choose your challenge.", "My challenge", "I will…"],
    [
      "outcome",
      "Know the finish.",
      "Done means",
      "I will know I have done it when…",
    ],
    [
      "meaning",
      "Give it a reason.",
      "Why this matters",
      "This matters to me because…",
    ],
    [
      "constraints",
      "What could get in your way?",
      "What I need to plan for",
      "Time, energy, responsibilities…",
    ],
    [
      "capabilities",
      "Build what it takes.",
      "What I need to build",
      "I can already… I need to learn or build…",
    ],
    [
      "unknowns",
      "What needs an answer?",
      "My open questions",
      "I need to find out…",
    ],
  ] as const;
  const field = fields[step];
  const set = (k: keyof Foundation, v: unknown) => change({ ...value, [k]: v });
  const updateMilestone = (id: string, v: Partial<Milestone>) =>
    set(
      "milestones",
      value.milestones.map((m) => (m.id === id ? { ...m, ...v } : m)),
    );
  const add = () =>
    set("milestones", [
      ...value.milestones,
      {
        id: crypto.randomUUID(),
        title: "",
        criterion: "",
        localDate: "",
        localTime: "",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    ]);
  const advance = () => {
    setIssue("");
    if (step === 8) {
      try {
        ready({ ...value, affirmed: true });
      } catch (e) {
        setIssue((e as Error).message);
        return;
      }
    }
    setStep(sequence[sequence.indexOf(step) + 1]);
  };
  const outstanding = currentAction(snapshot, goal.id);
  if (outstanding || goal.status !== "draft")
    return (
      <Page
        title={
          outstanding
            ? "Finish the open loop."
            : "Your preparation is already committed."
        }
        dark={false}
        back={() => navigate("/app")}
        footer={
          <button
            className="button"
            onClick={() =>
              navigate(outstanding ? "/report/" + goal.id : "/manage")
            }
          >
            {outstanding ? "Report what happened" : "View my challenge"}
          </button>
        }
      >
        <p>
          {outstanding
            ? "Record what happened with your current step before changing your preparation."
            : "Your earlier agreement stays in your history. Review your challenge to choose what comes next."}
        </p>
        <p>Any preparation draft on this device has been kept.</p>
      </Page>
    );
  return (
    <Page
      title={
        field?.[1] ??
        (step === 7
          ? "How will you handle it?"
          : step === 8
            ? "Mark the turning points."
            : "Make this your commitment.")
      }
      sub={
        step === 8
          ? "Start with one milestone. Add more as your plan grows."
          : step === 9
            ? "Your direction. Your preparation. Your decision."
            : undefined
      }
      dark={step === 0 || step === 1 || step === 6}
      back={() =>
        sequence.indexOf(step) > 0
          ? setStep(sequence[sequence.indexOf(step) - 1])
          : navigate("/app")
      }
      progress={[sequence.indexOf(step) + 1, sequence.length]}
      footer={
        <>
          {(error || issue) && <p role="alert">{error || issue}</p>}
          {step < 9 ? (
            <button
              className="button"
              disabled={
                saving ||
                (field
                  ? !String(value[field[0]]).trim()
                  : step === 7
                    ? !(value.hardPart || "").trim()
                    : !value.milestones.length)
              }
              onClick={advance}
            >
              Continue
            </button>
          ) : (
            <button
              className="button"
              disabled={saving || !value.affirmed}
              onClick={() =>
                void save(
                  "plan",
                  {
                    ...Object.fromEntries(
                      foundationKeys.map((k) => [
                        k,
                        value[k as keyof Foundation],
                      ]),
                    ),
                    constraints:
                      value.constraints +
                      "\n\nMy plan for the hard part:\n" +
                      value.hardPart,
                    goalId: goal.id,
                    version: goal.version,
                  },
                  () => {
                    localStorage.removeItem(key);
                    navigate("/commitment/" + goal.id);
                  },
                )
              }
            >
              {saving ? "Saving…" : "Keep my preparation"}
            </button>
          )}
          <button
            className="quiet"
            disabled={saving}
            onClick={() => navigate("/app")}
          >
            Keep draft on this device
          </button>
        </>
      }
    >
      {step === 7 && (
        <>
          <p className="small">For {value.words}</p>
          <Input
            label="When it gets difficult"
            value={value.hardPart || ""}
            onChange={(hardPart) => change({ ...value, hardPart })}
            placeholder="If this gets in the way, I will…"
          />
          <Help
            ambition={value.words}
            field={`given your constraints (“${value.constraints}”), what will you do when the plan gets difficult? Name a practical response.`}
          />
        </>
      )}
      {field && (
        <>
          <Input
            label={field[2]}
            value={value[field[0]]}
            onChange={(v) => set(field[0], v)}
            placeholder={field[3]}
          />
          {(step === 4 || step === 6) && (
            <button
              className="quiet"
              onClick={() =>
                set(
                  field[0],
                  step === 4
                    ? "Nothing significant right now."
                    : "Nothing unresolved right now.",
                )
              }
            >
              {step === 4
                ? "Nothing significant right now"
                : "Nothing unresolved right now"}
            </button>
          )}
          {snapshot.supportMode === "guided" && (
            <p className="small">
              {step === 4
                ? "Consider the time and energy this challenge will need."
                : step === 5
                  ? "Start with your current ability, then name the gap."
                  : step === 6
                    ? "An unanswered question can become your next research action."
                    : "Use your own words. Your earlier answer is here to refine."}
            </p>
          )}
          <Help
            ambition={value.words}
            field={
              step === 4
                ? "what constraint could prevent your next step, and what room can you realistically make?"
                : step === 5
                  ? "what would a person able to do this already know or practice? Which part do you still need?"
                  : step === 6
                    ? "what specific fact, permission or resource do you need before moving forward?"
                    : "what would make this answer concrete enough that you could act on it?"
            }
          />
        </>
      )}
      {step === 8 && (
        <>
          {value.milestones.map((m, i) => (
            <section className="milestone-edit" key={m.id}>
              <h2>Milestone {i + 1}</h2>
              <Input
                label="A turning point"
                value={m.title}
                onChange={(v) => updateMilestone(m.id, { title: v })}
                placeholder="What will you be ready to do?"
              />
              <Input
                label="Evidence"
                value={m.criterion}
                onChange={(v) => updateMilestone(m.id, { criterion: v })}
                placeholder="How will you know?"
              />
              <ScheduleFields
                prefix={`Milestone ${i + 1} deadline`}
                value={m}
                required
                change={(v) => updateMilestone(m.id, v)}
              />
              <button
                className="quiet"
                onClick={() =>
                  set(
                    "milestones",
                    value.milestones.filter((v) => v.id !== m.id),
                  )
                }
              >
                Remove milestone {i + 1}
              </button>
            </section>
          ))}
          <button
            className="experience-choice"
            disabled={value.milestones.length >= 30}
            onClick={add}
          >
            Add a milestone
          </button>
        </>
      )}
      {step === 9 && (
        <>
          <h2>{value.vision}</h2>
          <p>{value.words}</p>
          <p>Done means: {value.outcome}</p>
          <p>
            {value.milestones.length} preparation{" "}
            {value.milestones.length === 1 ? "milestone" : "milestones"}
          </p>
          <label className="experience-choice">
            <input
              type="checkbox"
              checked={value.affirmed}
              onChange={(e) => set("affirmed", e.target.checked)}
            />
            This accomplishment is meaningful, demanding and worth preparing
            for.
          </label>
        </>
      )}
    </Page>
  );
}
