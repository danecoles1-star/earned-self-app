import { pauseTimer } from "./StepTimer";
import { useState } from "react";
import type { Goal, Snapshot, Result } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
  currentReport,
  isOverdue,
  ready,
} from "../data/domain";
import {
  ScheduleFields,
  useTextDraft,
  type Save,
} from "../components/PursuitScreens";
import { Art, Page, Input, Choice, Help } from "./ui";
import { scheduledInstant } from "../data/time";
type Props = {
  goal: Goal;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
};
export function MoveEditor({
  goal: g,
  snapshot: s,
  save,
  saving,
  navigate,
}: Props) {
  const plannedStep = s.events.find(
    (e) =>
      e.goal_id === g.id &&
      e.kind === "planned_step" &&
      e.data.stepId === location.pathname.split("/")[3],
  );
  const c = currentAction(s, g.id),
    d = c && definition(s, c.id, c.revision),
    time = c && currentSchedule(s, c.id),
    m = currentMilestone(s, g);
  const priorEntry = s.evidence.filter((e) => e.goal_id === g.id).at(-1);
  const prior =
    priorEntry && currentReport(s, priorEntry.id, priorEntry.revision);
  const key = `earned-self:move:${g.owner_id}:${g.id}:${c?.id || "new"}:${c?.revision || 0}:${plannedStep?.data.stepId || ""}`;
  const {
    value: v,
    change,
    error,
  } = useTextDraft(key, {
    id: crypto.randomUUID(),
    action: d?.action || plannedStep?.data.action || "",
    criterion: d?.criterion || plannedStep?.data.criterion || "",
    localDate: time?.local_date || "",
    localTime: time?.local_time?.slice(0, 5) || "",
    timeZone:
      time?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: time?.location || "",
    reason: "",
    decision: prior && prior.result !== "done" ? "recommit" : "continue",
  });
  const [step, setStep] = useState(0),
    [issue, setIssue] = useState("");
  const set = (field: string, value: string) =>
    change({ ...v, [field]: value });
  let blocked = "";
  try {
    ready(g);
  } catch (e) {
    blocked = (e as Error).message;
  }
  if (!blocked && (!m || !["draft", "active", "paused"].includes(g.status)))
    blocked = "Review your challenge before choosing another step.";
  if (c && (g.status === "draft" || !c.milestone_id))
    blocked =
      "Record what happened with your current step before preparing a scheduled action.";
  if (c && isOverdue(s, c.id))
    blocked = "Report what happened before changing this overdue agreement.";
  const next = () => {
    setIssue("");
    if (step === 1) {
      try {
        scheduledInstant(v.localDate, v.localTime, v.timeZone);
      } catch (e) {
        setIssue((e as Error).message);
        return;
      }
    }
    setStep(step + 1);
  };
  const submit = () => {
    const base = {
      goalId: g.id,
      action: v.action,
      criterion: v.criterion,
      localDate: v.localDate,
      localTime: v.localTime,
      timeZone: v.timeZone,
      location: v.location,
    };
    void save(
      c ? "reschedule" : "commitment",
      c
        ? { ...base, commitmentId: c.id, version: c.version, reason: v.reason }
        : {
            ...base,
            id: v.id,
            milestoneId: m!.id,
            ...(plannedStep ? { plannedStepId: plannedStep.data.stepId } : {}),
            decision: v.decision,
            reason: v.reason,
          },
      () => {
        localStorage.removeItem(key);
        navigate("/calendar/" + g.id);
      },
    );
  };
  return (
    <Page
      title={
        c
          ? "Revise the agreement."
          : step === 0
            ? "Choose your next step."
            : step === 1
              ? "Give it a place."
              : "Make it a commitment."
      }
      sub={
        step === 0
          ? "One preparation step toward your current milestone."
          : step === 1
            ? "When and where will you do it?"
            : "Review the agreement you are making."
      }
      dark={false}
      back={() => (step ? setStep(step - 1) : navigate("/app"))}
      progress={[step + 1, 3]}
      footer={
        blocked ? (
          <button
            className="button"
            onClick={() =>
              navigate(
                c
                  ? "/report/" + g.id
                  : g.status === "draft"
                    ? "/plan/" + g.id
                    : "/manage",
              )
            }
          >
            {c ? "Report what happened" : "Review my preparation"}
          </button>
        ) : (
          <>
            {(error || issue) && <p role="alert">{error || issue}</p>}
            <button
              className="button"
              disabled={
                saving ||
                (step === 0
                  ? !(v.action.trim() && v.criterion.trim())
                  : step === 1
                    ? !(
                        v.localDate &&
                        v.localTime &&
                        v.timeZone &&
                        v.location.trim()
                      )
                    : (!!c || v.decision !== "continue") && !v.reason.trim())
              }
              onClick={() => (step < 2 ? next() : submit())}
            >
              {saving
                ? "Saving…"
                : step < 2
                  ? "Continue"
                  : c
                    ? "Save revised agreement"
                    : g.status === "draft"
                      ? "Schedule this step"
                      : "Commit to this move"}
            </button>
          </>
        )
      }
    >
      {blocked ? (
        <p role="alert">{blocked}</p>
      ) : (
        <>
          {step === 0 && (
            <>
              <p className="small">{m?.title}</p>
              <Input
                label="My next step"
                value={v.action}
                onChange={(v) => set("action", v)}
                placeholder="I will…"
              />
              <Input
                label="Done means"
                value={v.criterion}
                onChange={(v) => set("criterion", v)}
                placeholder="Describe the observable finish…"
              />
              <Help
                ambition={g.words}
                field={`what action would give you evidence toward “${m?.criterion}”?`}
              />
            </>
          )}
          {step === 1 && (
            <>
              <ScheduleFields
                value={v}
                change={(patch) => change({ ...v, ...patch })}
              />
              <Input
                label="Where?"
                value={v.location}
                onChange={(v) => set("location", v)}
                placeholder="Where will you do it?"
              />
            </>
          )}
          {step === 2 && (
            <>
              <h2>{v.action}</h2>
              <p>Done means: {v.criterion}</p>
              <p>
                {v.localDate} · {v.localTime} · {v.timeZone}
              </p>
              <p>{v.location}</p>
              {c ? (
                <p className="small">The earlier agreement stays in Proof.</p>
              ) : (
                <label>
                  Your next decision
                  <select
                    value={v.decision}
                    onChange={(e) => set("decision", e.target.value)}
                  >
                    {(!prior || prior.result === "done") && (
                      <option value="continue">Continue preparation</option>
                    )}
                    <option value="recommit">
                      Recommit with a revised plan
                    </option>
                    <option value="change_approach">Change the approach</option>
                    <option value="address_blocker">Address a blocker</option>
                  </select>
                </label>
              )}
              {(c || v.decision !== "continue") && (
                <Input
                  label="What will change in this plan?"
                  value={v.reason}
                  onChange={(v) => set("reason", v)}
                />
              )}
            </>
          )}
        </>
      )}
    </Page>
  );
}
export function ReportMove({
  goal: g,
  snapshot: s,
  save,
  saving,
  navigate,
}: Props) {
  const c = currentAction(s, g.id)!;
  const key = `earned-self:report:${g.owner_id}:${c.id}`;
  const {
    value: v,
    change,
    error,
  } = useTextDraft(key, {
    result: "" as "" | Result,
    detail: "",
    prevented: "",
    adjustment: "",
    reflection: "",
  });
  const set = (field: string, value: string) =>
    change({ ...v, [field]: value });
  const valid =
    v.result &&
    v.detail.trim() &&
    (!c.milestone_id || !!v.reflection?.trim()) &&
    (v.result === "done" || (v.prevented.trim() && v.adjustment.trim()));
  return (
    <Page
      title="Step check-in."
      sub="Be honest. Keep what you learned."
      dark={false}
      back={() => navigate("/app")}
      footer={
        <>
          {error && <p role="alert">{error}</p>}
          <button
            className="button"
            disabled={saving || !valid}
            onClick={() => {
              pauseTimer(`${g.owner_id}:${c.id}:${c.revision}`);
              void save(
                "outcome",
                {
                  id: c.id,
                  goalId: g.id,
                  commitmentId: c.id,
                  version: c.version,
                  ...v,
                },
                (r) => {
                  localStorage.removeItem(key);
                  navigate("/proof/" + r.id);
                },
              );
            }}
          >
            {saving ? "Saving…" : "Save to Proof"}
          </button>
        </>
      }
    >
      <div className="choices">
        {(
          [
            ["done", "Done"],
            ["partly", "Partly"],
            ["did_not_happen", "Did not happen"],
          ] as const
        ).map(([result, label]) => (
          <Choice
            key={result}
            selected={v.result === result}
            onClick={() => set("result", result)}
          >
            {label}
          </Choice>
        ))}
      </div>
      <Input
        label="What happened?"
        value={v.detail}
        onChange={(v) => set("detail", v)}
        placeholder="Write a short, factual account…"
      />
      {c.milestone_id && (
        <Input
          label="What are you ready for next?"
          value={v.reflection || ""}
          onChange={(v) => set("reflection", v)}
          placeholder="What feels ready, and what needs more preparation?"
        />
      )}
      {v.result && v.result !== "done" && (
        <>
          <Input
            label="What prevented it?"
            value={v.prevented}
            onChange={(v) => set("prevented", v)}
          />
          <Input
            label="What will you change?"
            value={v.adjustment}
            onChange={(v) => set("adjustment", v)}
          />
        </>
      )}
    </Page>
  );
}
export function MilestoneComplete({
  goal: g,
  snapshot: s,
  save,
  saving,
  navigate,
}: Props) {
  const m = currentMilestone(s, g);
  const { value, change, error } = useTextDraft(
    `earned-self:milestone:${g.owner_id}:${m?.id}`,
    { detail: "" },
  );
  const [completed, setCompleted] = useState(false);
  const [readyToAttempt, setReadyToAttempt] = useState(false);
  const [milestoneResult, setMilestoneResult] = useState("done");
  if (!m && !completed) {
    const hasMilestones = g.milestones.length > 0;
    const canPrepare = g.status === "draft" && !currentAction(s, g.id);
    return (
      <Page
        title={
          hasMilestones ? "Every milestone reached." : "No milestones yet."
        }
        children={null}
        sub={
          hasMilestones
            ? "Return to your challenge to decide what comes next."
            : "Milestones mark the turning points in your preparation."
        }
        dark={false}
        back={() => navigate("/manage")}
        footer={
          <button
            className="button"
            onClick={() => navigate(canPrepare ? "/plan/" + g.id : "/manage")}
          >
            {canPrepare ? "Prepare my challenge" : "Return to my challenge"}
          </button>
        }
      />
    );
  }
  if (m && !readyToAttempt)
    return (
      <Page
        title="Ready to attempt this milestone?"
        sub="Review your preparation before you begin."
        dark={false}
        back={() => navigate("/app")}
        footer={
          <>
            <button
              className="button"
              disabled={g.status !== "active" || !!currentAction(s, g.id)}
              onClick={() => setReadyToAttempt(true)}
            >
              I’m ready
            </button>
            <button className="quiet" onClick={() => navigate("/app")}>
              Not yet · Return to Basecamp
            </button>
          </>
        }
      >
        <h2>{m.title}</h2>
        <p>{m.criterion}</p>
        {currentAction(s, g.id) && (
          <p>Check in on your current step before attempting the milestone.</p>
        )}
        {g.status !== "active" && (
          <p>Complete your preparation and schedule a step first.</p>
        )}
      </Page>
    );
  return (
    <Page
      title={completed ? "You reached a turning point." : "Did you reach it?"}
      sub={
        completed
          ? "Take a moment to recognize the work."
          : "Compare your work with the criterion you chose."
      }
      dark={completed}
      back={() => navigate("/manage")}
      footer={
        completed ? (
          <button className="button" onClick={() => navigate("/app")}>
            See what comes next
          </button>
        ) : (
          <>
            <button
              className="button"
              disabled={
                saving ||
                g.status !== "active" ||
                !m ||
                !value.detail.trim() ||
                !!currentAction(s, g.id)
              }
              onClick={() =>
                void save(
                  "milestone",
                  {
                    goalId: g.id,
                    version: g.version,
                    milestoneId: m!.id,
                    detail: value.detail,
                    result: milestoneResult,
                  },
                  () => {
                    localStorage.removeItem(
                      `earned-self:milestone:${g.owner_id}:${m!.id}`,
                    );
                    navigate(
                      milestoneResult === "done"
                        ? "/milestone-done/" + g.id
                        : "/proof",
                    );
                  },
                )
              }
            >
              Save milestone reflection
            </button>
            <button className="quiet" onClick={() => navigate("/app")}>
              Keep working
            </button>
          </>
        )
      }
    >
      {completed ? (
        <Art kind="path" />
      ) : (
        <>
          <h2>{m?.title || "All planned milestones are complete."}</h2>
          <p>{m?.criterion}</p>
          {g.status !== "active" && (
            <p>
              Return to your challenge and schedule a move before completing a
              milestone.
            </p>
          )}
          {currentAction(s, g.id) && (
            <p>Report your current step before completing the milestone.</p>
          )}
          <label>
            What happened?
            <select
              value={milestoneResult}
              onChange={(e) => setMilestoneResult(e.target.value)}
            >
              <option value="done">I accomplished it</option>
              <option value="attempted">
                I attempted it and need another try
              </option>
            </select>
          </label>
          <Input
            label="What happened and what did you learn?"
            value={value.detail}
            onChange={(detail) => change({ detail })}
            placeholder="Describe the evidence…"
          />
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </Page>
  );
}
export function Decision({ goal: g, snapshot, save, saving, navigate }: Props) {
  const [status, setStatus] = useState(""),
    [step, setStep] = useState(0);
  const {
    value: v,
    change,
    error,
  } = useTextDraft(`earned-self:decision:${g.owner_id}:${g.id}`, {
    detail: "",
    reflection: "",
    next: "",
  });
  const set = (field: string, value: string) =>
    change({ ...v, [field]: value });
  const completed = status === "completed";
  const outstanding = currentAction(snapshot, g.id);
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    g.status,
  );
  let prepared = true;
  try {
    ready(g);
  } catch {
    prepared = false;
  }
  const scheduled =
    outstanding && currentSchedule(snapshot, outstanding.id)?.starts_at;
  const blocked = ended
    ? "This ambition has ended. Its record stays in Proof."
    : completed && outstanding
      ? "Report your current step before completing this challenge."
      : completed && !prepared
        ? "Complete your preparation before recording this accomplishment."
        : status === "active" && (!scheduled || !prepared)
          ? "Schedule your next step before returning to active preparation."
          : "";
  const valid =
    !!v.detail.trim() &&
    (!completed || !!(v.reflection.trim() && v.next.trim()));
  return (
    <Page
      title={
        !status
          ? "Choose what comes next."
          : completed
            ? step === 0
              ? "Did you do what you set out to do?"
              : "Who are you now?"
            : status === "paused"
              ? "Make room to return."
              : status === "active"
                ? "Return with intention."
                : "Choose a new direction."
      }
      sub={
        completed
          ? step === 0
            ? "Look at the outcome and your Proof."
            : "Remember where you began. Name what changed."
          : undefined
      }
      dark={false}
      back={() => (status ? (setStatus(""), setStep(0)) : navigate("/manage"))}
      footer={
        blocked ? (
          <button
            className="button"
            onClick={() =>
              navigate(
                ended
                  ? "/new"
                  : outstanding
                    ? "/report/" + g.id
                    : g.status === "draft"
                      ? "/plan/" + g.id
                      : "/commitment/" + g.id,
              )
            }
          >
            {ended
              ? "Choose my next ambition"
              : outstanding
                ? "Report what happened"
                : g.status === "draft"
                  ? "Prepare my challenge"
                  : "Schedule my next step"}
          </button>
        ) : status ? (
          <>
            {error && <p role="alert">{error}</p>}
            <button
              className="button"
              disabled={
                saving || (completed && step === 0 ? !v.detail.trim() : !valid)
              }
              onClick={() => {
                if (completed && step === 0) {
                  setStep(1);
                  return;
                }
                void save(
                  "status",
                  { goalId: g.id, version: g.version, status, ...v },
                  () => navigate("/app"),
                );
              }}
            >
              {saving
                ? "Saving…"
                : completed && step === 0
                  ? "Continue"
                  : completed
                    ? "Confirm accomplishment"
                    : "Save my decision"}
            </button>
          </>
        ) : undefined
      }
    >
      {blocked ? (
        <p role="alert">{blocked}</p>
      ) : !status ? (
        <>
          {[
            ["paused", "Pause for now"],
            ["changed_direction", "Grow in a new direction"],
            ["completed", "I accomplished it"],
            ...(g.status === "paused"
              ? [["active", "Resume scheduled preparation"]]
              : []),
          ]
            .filter(([v]) => v !== g.status)
            .map(([v, label]) => (
              <Choice
                key={v}
                selected={false}
                onClick={() => {
                  setStep(0);
                  setStatus(v);
                }}
              >
                {label}
              </Choice>
            ))}
        </>
      ) : (
        <>
          {completed && step === 0 && (
            <>
              <h2>Your saved finish</h2>
              <p>{g.outcome}</p>
            </>
          )}
          {step === 0 && (
            <Input
              label={
                completed
                  ? "What actually happened?"
                  : "Why are you making this decision?"
              }
              value={v.detail}
              onChange={(v) => set("detail", v)}
            />
          )}{" "}
          {completed && step === 1 && (
            <>
              <p className="small">Where you began</p>
              <h2>{g.vision}</h2>
              <Input
                label="What has changed?"
                value={v.reflection}
                onChange={(v) => set("reflection", v)}
                placeholder="How do you see yourself now?"
              />
              <Input
                label="What will you carry forward?"
                value={v.next}
                onChange={(v) => set("next", v)}
                placeholder="Name what you want to keep…"
              />
            </>
          )}
        </>
      )}
    </Page>
  );
}
