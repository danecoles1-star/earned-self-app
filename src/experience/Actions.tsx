import { guidanceExample } from "./guidance";
import { Paused, ScheduleReview } from "./Paused";
import { LocalDateTimeInput } from "../components/LocalDateTime";
import { pauseTimer } from "./StepTimer";
import { useState } from "react";
import type { Goal, Snapshot, Result } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
  currentReport,
  ready,
} from "../data/domain";
import {
  ScheduleFields,
  useTextDraft,
  type Save,
} from "../components/PursuitScreens";
import { Art, Page, Input, Choice, Help } from "./ui";
import { checkRecurrence, repeatLabel } from "../data/recurrence";
import { displaySchedule, scheduledInstant } from "../data/time";
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
  const c = location.pathname.startsWith("/revise/")
      ? location.pathname.split("/")[3]
        ? s.commitments.find(
            (c) =>
              c.goal_id === g.id &&
              c.state === "active" &&
              c.id === location.pathname.split("/")[3],
          )
        : currentAction(s, g.id)
      : undefined,
    d = c && definition(s, c.id, c.revision),
    time = c && currentSchedule(s, c.id),
    m = currentMilestone(s, g);

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
    scope: "",
    reason: "",
    decision: "continue",
    milestoneId:
      new URLSearchParams(location.search).get("milestone") ||
      c?.milestone_id ||
      plannedStep?.data.milestoneId ||
      m?.id ||
      "",
    repeat: !!c?.recurrence,
    days: c?.recurrence?.days || [0, 1, 2, 3, 4, 5, 6],
    until: c?.recurrence?.until || "",
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

  const next = () => {
    setIssue("");
    if (c?.recurrence && !v.scope) {
      setIssue("Choose which repetitions to change.");
      return;
    }
    if (step === 1) {
      try {
        scheduledInstant(v.localDate, v.localTime, v.timeZone);
        checkRecurrence(
          c
            ? v.scope === "future"
              ? c.recurrence
              : null
            : v.repeat
              ? { days: v.days, until: v.until }
              : null,
          v.localDate,
        );
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
        ? {
            ...base,
            commitmentId: c.id,
            version: c.version,
            reason: v.reason,
            scope: c.recurrence ? v.scope : "occurrence",
          }
        : {
            ...base,
            id: v.id,
            milestoneId: v.milestoneId,
            recurrence: v.repeat ? { days: v.days, until: v.until } : null,
            ...(plannedStep ? { plannedStepId: plannedStep.data.stepId } : {}),
            decision: v.decision,
            reason: v.reason,
          },
      () => {
        localStorage.removeItem(key);
        navigate("/app");
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
              ? "Make time for it."
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
                    : "Save step"}
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
              <label>
                Milestone
                <select
                  disabled={!!c}
                  value={v.milestoneId}
                  onChange={(e) => set("milestoneId", e.target.value)}
                >
                  {g.milestones
                    .filter(
                      (m) =>
                        !s.events.some(
                          (e) =>
                            e.goal_id === g.id &&
                            e.kind === "milestone" &&
                            e.data.milestoneId === m.id,
                        ),
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                </select>
              </label>
              {c?.recurrence && (
                <fieldset className="recovery-scope">
                  <legend>Apply this change to</legend>
                  <Choice
                    selected={v.scope === "occurrence"}
                    onClick={() => set("scope", "occurrence")}
                  >
                    This occurrence only
                  </Choice>
                  <Choice
                    selected={v.scope === "future"}
                    onClick={() => set("scope", "future")}
                  >
                    This and future repetitions
                  </Choice>
                  <p className="small">
                    One occurrence keeps later repetitions on their original
                    action and schedule. Future repetitions keep your chosen
                    repeat days.
                  </p>
                </fieldset>
              )}
              <Input
                label="My next step"
                value={v.action}
                onChange={(v) => set("action", v)}
                placeholder="I will…"
              />
              <Input
                label={v.repeat ? "Each session is done when" : "Done means"}
                value={v.criterion}
                onChange={(v) => set("criterion", v)}
                placeholder="Describe the observable finish…"
              />
              {!c && (
                <fieldset className="repeat-controls">
                  <legend>How often?</legend>
                  <div className="choices">
                    <Choice
                      selected={!v.repeat}
                      onClick={() => change({ ...v, repeat: false })}
                    >
                      One-time
                    </Choice>
                    <Choice
                      selected={v.repeat}
                      onClick={() => change({ ...v, repeat: true })}
                    >
                      Repeat
                    </Choice>
                  </div>
                </fieldset>
              )}
              <p className="small">
                Describe the action you can complete. Your milestone tracks the
                progress it builds.
              </p>
              <Help
                example={
                  guidanceExample(g.words, "step") +
                  " Done means: " +
                  guidanceExample(g.words, "criterion")
                }
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
              {v.repeat && !c && (
                <fieldset className="repeat-controls">
                  <legend>Repeat on</legend>
                  <div className="weekday-options">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, n) => (
                        <button
                          type="button"
                          key={day}
                          aria-pressed={v.days.includes(n)}
                          onClick={() =>
                            change({
                              ...v,
                              days: v.days.includes(n)
                                ? v.days.filter((d) => d !== n)
                                : [...v.days, n].sort(),
                            })
                          }
                        >
                          {day}
                        </button>
                      ),
                    )}
                  </div>
                  <label>
                    End date (leave blank to repeat until stopped)
                    <LocalDateTimeInput
                      id="repeat-end"
                      kind="date"
                      required={false}
                      value={v.until}
                      onChange={(v) => set("until", v)}
                    />
                  </label>
                </fieldset>
              )}
              <p className="small">
                {repeatLabel(
                  c
                    ? c.recurrence
                    : v.repeat
                      ? { days: v.days, until: v.until }
                      : null,
                )}
              </p>
              {(!v.localDate || !v.localTime) && (
                <p>Choose a date and time to continue.</p>
              )}
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
              <p>{displaySchedule(v.localDate, v.localTime, v.timeZone)}</p>
              <p>{v.location}</p>
              <p>
                {repeatLabel(
                  c
                    ? c.recurrence
                    : v.repeat
                      ? { days: v.days, until: v.until }
                      : null,
                )}
              </p>
              {c && (
                <>
                  <p className="small">
                    {c.recurrence
                      ? v.scope === "occurrence"
                        ? "This occurrence only. Later repetitions keep their original action and schedule."
                        : "This and future repetitions. Your repeat days stay the same."
                      : "The earlier agreement stays in history."}
                  </p>
                  <p className="small">
                    Update any event you already added to your calendar
                    separately.
                  </p>
                </>
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
    (!c.milestone_id ||
      (!!v.reflection?.trim() && !!currentSchedule(s, c.id)?.starts_at)) &&
    (v.result === "done" || (v.prevented.trim() && v.adjustment.trim()));
  return (
    <Page
      title="Step check-in."
      sub="What did this step teach you?"
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
                  navigate(
                    v.result !== "done"
                      ? "/recovery/" + c.id
                      : v.reflection === "Ready to review my milestone"
                        ? "/milestone/" + g.id
                        : "/app",
                  );
                },
              );
            }}
          >
            {saving ? "Saving…" : "Save to Proof"}
          </button>
        </>
      }
    >
      {g.status === "paused" && (
        <p role="status">
          This challenge is paused. Only record work that already happened.
          Checking in does not resume it or change future dates.
        </p>
      )}
      <h2>{definition(s, c.id, c.revision)?.action}</h2>
      <p className="small">
        {displaySchedule(
          currentSchedule(s, c.id)?.local_date,
          currentSchedule(s, c.id)?.local_time,
          currentSchedule(s, c.id)?.time_zone,
        )}
      </p>
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
        <fieldset>
          <legend>How does your preparation feel?</legend>
          {["Keep preparing", "Ready to review my milestone"].map((label) => (
            <Choice
              key={label}
              selected={v.reflection === label}
              onClick={() => set("reflection", label)}
            >
              {label}
            </Choice>
          ))}
        </fieldset>
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
  const [remaining, setRemaining] = useState("");
  const remainingSteps = s.commitments.filter(
    (c) =>
      c.goal_id === g.id && c.milestone_id === m?.id && c.state === "active",
  );
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
              disabled={g.status !== "active"}
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
          <p>
            You can attempt this milestone when you feel ready. Review any
            unfinished steps before advancing.
          </p>
        )}
        {g.status !== "active" && (
          <>
            <p>
              {g.status === "paused"
                ? "This challenge is paused. Resume before attempting a milestone."
                : "Complete your preparation and schedule a step first."}
            </p>
            {g.status === "paused" && <Paused goal={g} navigate={navigate} />}
          </>
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
                (milestoneResult === "done" &&
                  remainingSteps.length > 0 &&
                  !remaining)
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
                    remaining,
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
            <p>
              Your unfinished preparation stays visible until you decide what to
              carry forward.
            </p>
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
          {milestoneResult === "done" && remainingSteps.length > 0 && (
            <label>
              Remaining steps and routines
              <select
                value={remaining}
                onChange={(e) => setRemaining(e.target.value)}
              >
                <option value="">Choose what happens next</option>
                <option value="stop">
                  End remaining steps and repetitions
                </option>
                {g.milestones.indexOf(m!) < g.milestones.length - 1 && (
                  <option value="carry">
                    Carry them into my next milestone
                  </option>
                )}
              </select>
              <p className="small">
                Previous check-ins stay in Proof. Ending future work does not
                mark it completed.
              </p>
            </label>
          )}
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
            : "Name what changed through doing the work."
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
                  () => {
                    if (status === "paused")
                      snapshot.commitments
                        .filter(
                          (c) => c.goal_id === g.id && c.state === "active",
                        )
                        .forEach((c) =>
                          pauseTimer(`${g.owner_id}:${c.id}:${c.revision}`),
                        );
                    navigate(completed ? "/proof/challenge/" + g.id : "/app");
                  },
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
      {g.status === "paused" && (
        <ScheduleReview goal={g} snapshot={snapshot} navigate={navigate} />
      )}
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
              <p className="small">The vision you chose</p>
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
