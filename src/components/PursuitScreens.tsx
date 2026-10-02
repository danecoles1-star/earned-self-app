import { LocalDateTimeInput } from "./LocalDateTime";
import { displaySchedule } from "../data/time";
import { useEffect, useState } from "react";
import {
  currentAction,
  currentMilestone,
  currentReport,
  currentSchedule,
  definition,
  foundationKeys,
  isOverdue,
  ready,
} from "../data/domain";
import { scheduledInstant } from "../data/time";
import {
  resultLabel,
  stateLabel,
  type Command,
  type Foundation,
  type Goal,
  type Receipt,
  type Result,
  type Snapshot,
  type User,
} from "../data/types";
export type Save = (
  kind: Command["kind"],
  payload: Record<string, unknown>,
  after?: (r: Receipt) => void,
) => Promise<void>;
type Props = {
  goal: Goal;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
  user?: User;
};
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Save could not be confirmed.";
export function Field({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  const id = label.replace(/\W/g, "");
  return (
    <>
      <label htmlFor={id}>
        {label}
        {optional ? " (optional)" : ""}
      </label>
      <textarea
        id={id}
        value={value}
        required={!optional}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}
export function useTextDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        return stored && typeof stored === "object"
          ? { ...initial, ...stored }
          : initial;
      } catch {
        return initial;
      }
    }),
    [error, setError] = useState("");
  const change = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
      setError("");
    } catch {
      setError(
        "This device could not retain your unsaved draft. Keep this page open until you save.",
      );
    }
  };
  return { value, change, error };
}
export function FoundationFields({
  value,
  change,
}: {
  value: Foundation;
  change: (v: Foundation) => void;
}) {
  return (
    <>
      {(
        [
          ["vision", "Who do you want to become?"],
          [
            "words",
            "What significant accomplishment would move you toward that vision?",
          ],
          ["outcome", "What would completing it look like?"],
          ["meaning", "Why this matters now"],
          ["constraints", "Important constraints or risks"],
          ["capabilities", "Capabilities to develop"],
          ["unknowns", "Important unknowns to resolve"],
        ] as const
      ).map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={value[key]}
          onChange={(v) => change({ ...value, [key]: v })}
          optional
        />
      ))}
      <p className="muted">
        Complete each part before activating. If there are no known constraints
        or unknowns, say so.
      </p>
      <label className="choice">
        <input
          type="checkbox"
          checked={value.affirmed}
          onChange={(e) => change({ ...value, affirmed: e.target.checked })}
        />
        This accomplishment is meaningful, demanding and worth preparing for.
      </label>
    </>
  );
}
const blankTime = () => ({
  localDate: "",
  localTime: "",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});
export function ScheduleFields({
  value,
  change,
  prefix = "Action",
  required = true,
}: {
  value: { localDate: string; localTime: string; timeZone: string };
  change: (v: {
    localDate: string;
    localTime: string;
    timeZone: string;
  }) => void;
  prefix?: string;
  required?: boolean;
}) {
  return (
    <div className="schedule-fields">
      <div className="fields-row">
        {(
          [
            ["localDate", "date", "date"],
            ["localTime", "time", "time"],
          ] as const
        ).map(([k, label, type]) => (
          <div key={k}>
            <label htmlFor={prefix + k}>
              {prefix} {label}
            </label>
            <LocalDateTimeInput
              id={prefix + k}
              kind={type}
              required={required}
              value={value[k]}
              onChange={(v) => change({ ...value, [k]: v })}
            />
          </div>
        ))}
      </div>
      <label htmlFor={prefix + "zone"}>{prefix} time zone</label>
      <input
        id={prefix + "zone"}
        value={value.timeZone}
        required={required}
        onChange={(e) => change({ ...value, timeZone: e.target.value })}
      />
      <p className="muted">
        {value.localDate && value.localTime
          ? displaySchedule(value.localDate, value.localTime, value.timeZone)
          : "Choose a date and time. Your schedule stays in this time zone."}
      </p>
    </div>
  );
}
const when = (s: {
  local_date: string | null;
  local_time: string | null;
  time_zone: string | null;
}) =>
  s.local_date
    ? displaySchedule(s.local_date, s.local_time, s.time_zone)
    : "Earlier agreement had no schedule";
const milestoneWhen = (m: Goal["milestones"][number]) =>
  when({
    local_date: m.localDate,
    local_time: m.localTime,
    time_zone: m.timeZone,
  });
export function PlanEditor({ goal, save, saving, navigate }: Props) {
  const key = `earned-self:plan:${goal.owner_id}:${goal.id}:${goal.revision}`;
  const { value, change, error } = useTextDraft<Foundation>(
    key,
    Object.fromEntries(
      foundationKeys.map((k) => [k, goal[k as keyof Goal]]),
    ) as unknown as Foundation,
  );
  return (
    <main id="main" className="workspace narrow">
      <p className="eyebrow">Draft pursuit</p>
      <h1 tabIndex={-1}>Make the plan real.</h1>
      <p className="intro">
        Choose something that will demand more of you. Build the preparation it
        deserves.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(
            "plan",
            { ...value, goalId: goal.id, version: goal.version },
            () => {
              localStorage.removeItem(key);
              navigate("/app");
            },
          );
        }}
      >
        <fieldset disabled={saving}>
          <FoundationFields value={value} change={change} />
          <h2>Ordered preparation milestones</h2>
          <p>
            Define what each milestone achieves. Put its deadline on the
            calendar.
          </p>
          {value.milestones.map((m, i) => (
            <section className="milestone-editor" key={m.id}>
              <h3>Milestone {i + 1}</h3>
              <Field
                label={`Milestone ${i + 1} title`}
                value={m.title}
                optional
                onChange={(title) =>
                  change({
                    ...value,
                    milestones: value.milestones.map((v) =>
                      v.id === m.id ? { ...v, title } : v,
                    ),
                  })
                }
              />
              <Field
                label={`Milestone ${i + 1} completion criteria`}
                value={m.criterion}
                optional
                onChange={(criterion) =>
                  change({
                    ...value,
                    milestones: value.milestones.map((v) =>
                      v.id === m.id ? { ...v, criterion } : v,
                    ),
                  })
                }
              />
              <ScheduleFields
                prefix={`Milestone ${i + 1} deadline`}
                required={false}
                value={m}
                change={(v) =>
                  change({
                    ...value,
                    milestones: value.milestones.map((x) =>
                      x.id === m.id ? { ...x, ...v } : x,
                    ),
                  })
                }
              />
              <div className="actions">
                <button
                  className="text-button"
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const milestones = [...value.milestones];
                    [milestones[i - 1], milestones[i]] = [
                      milestones[i],
                      milestones[i - 1],
                    ];
                    change({ ...value, milestones });
                  }}
                >
                  Move milestone {i + 1} earlier
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    change({
                      ...value,
                      milestones: value.milestones.filter((x) => x.id !== m.id),
                    })
                  }
                >
                  Remove milestone {i + 1}
                </button>
              </div>
            </section>
          ))}
          <button
            type="button"
            className="secondary"
            disabled={value.milestones.length >= 30}
            onClick={() =>
              change({
                ...value,
                milestones: [
                  ...value.milestones,
                  {
                    id: crypto.randomUUID(),
                    title: "",
                    criterion: "",
                    ...blankTime(),
                  },
                ],
              })
            }
          >
            Add milestone
          </button>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <button className="button">
              {saving ? "Saving…" : "Save preparation draft"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/app")}
            >
              Back to pursuit
            </button>
          </div>
          <p className="muted">
            Saving a draft does not activate the pursuit. A complete plan and
            scheduled next action are required.
          </p>
        </fieldset>
      </form>
    </main>
  );
}
const decisions = {
  continue: "Continue preparation",
  recommit: "Recommit with a revised plan",
  change_approach: "Change the approach",
  address_blocker: "Address a blocker",
};
export function CommitmentEditor({
  goal,
  snapshot,
  save,
  saving,
  navigate,
}: Props) {
  const current = currentAction(snapshot, goal.id),
    m = currentMilestone(snapshot, goal),
    schedule = current && currentSchedule(snapshot, current.id),
    def = current && definition(snapshot, current.id, current.revision);
  const key = `earned-self:action:v2:${goal.owner_id}:${goal.id}:${current?.id ?? "new"}:${current?.revision ?? 0}`;
  const latest = snapshot.evidence.filter((e) => e.goal_id === goal.id).at(-1),
    prior = latest && currentReport(snapshot, latest.id, latest.revision);
  const { value, change, error } = useTextDraft(key, {
    id: crypto.randomUUID(),
    action: def?.action ?? "",
    criterion: def?.criterion ?? "",
    localDate: schedule?.local_date ?? "",
    localTime: schedule?.local_time?.slice(0, 5) ?? "",
    timeZone: schedule?.time_zone ?? blankTime().timeZone,
    location: schedule?.location ?? "",
    decision: prior && prior.result !== "done" ? "recommit" : "continue",
    reason: "",
  });
  const [issue, setIssue] = useState("");
  let planIssue = "";
  try {
    ready(goal);
  } catch (e) {
    planIssue = message(e);
  }
  const blocked =
    !!planIssue ||
    !m ||
    !["draft", "active", "paused"].includes(goal.status) ||
    (!!current && isOverdue(snapshot, current.id));
  return (
    <main id="main" className="workspace narrow">
      <p className="eyebrow">{goal.vision}</p>
      <h1 tabIndex={-1}>
        {current ? "Revise the agreement." : "Put the work on the calendar."}
      </h1>
      <h2>{goal.words}</h2>
      <p>
        Preparation milestone: {m?.title ?? "All planned milestones completed"}
      </p>
      {m && <p>Deadline: {milestoneWhen(m)}</p>}
      {blocked ? (
        <div className="notice">
          <p>
            {planIssue ||
              (current && isOverdue(snapshot, current.id)
                ? "Your commitment needs an update. Report what happened before committing again."
                : "Review the pursuit and choose what comes next.")}
          </p>
          <button
            className="button"
            onClick={() =>
              navigate(goal.status === "draft" ? "/plan/" + goal.id : "/app")
            }
          >
            {goal.status === "draft"
              ? "Complete the preparation plan"
              : "Back to pursuit"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIssue("");
            const common = {
              goalId: goal.id,
              action: value.action,
              criterion: value.criterion,
              localDate: value.localDate,
              localTime: value.localTime,
              timeZone: value.timeZone,
              location: value.location,
            };
            void save(
              current ? "reschedule" : "commitment",
              current
                ? {
                    ...common,
                    commitmentId: current.id,
                    version: current.version,
                    reason: value.reason,
                  }
                : {
                    ...common,
                    id: value.id,
                    milestoneId: m!.id,
                    decision: value.decision,
                    reason: value.reason,
                  },
              () => {
                localStorage.removeItem(key);
                navigate("/app");
              },
            );
          }}
        >
          <fieldset disabled={saving}>
            <Field
              label="Your next action"
              value={value.action}
              onChange={(action) => change({ ...value, action })}
            />
            <Field
              label="Action done means"
              value={value.criterion}
              onChange={(criterion) => change({ ...value, criterion })}
            />
            <ScheduleFields
              value={value}
              change={(v) => change({ ...value, ...v })}
            />
            <Field
              label="Location"
              optional
              value={value.location}
              onChange={(location) => change({ ...value, location })}
            />
            {!current && (
              <>
                <label htmlFor="decision">Your next decision</label>
                <select
                  id="decision"
                  value={value.decision}
                  onChange={(e) =>
                    change({ ...value, decision: e.target.value })
                  }
                >
                  {Object.entries(decisions)
                    .filter(
                      ([k]) =>
                        !(prior && prior.result !== "done" && k === "continue"),
                    )
                    .map(([k, v]) => (
                      <option value={k} key={k}>
                        {v}
                      </option>
                    ))}
                </select>
              </>
            )}
            {(current || value.decision !== "continue") && (
              <Field
                label="What will change in this plan?"
                value={value.reason}
                onChange={(reason) => change({ ...value, reason })}
              />
            )}
            {current && (
              <p className="notice">
                The earlier agreement stays in Proof. Changing this date does
                not report a result.
              </p>
            )}
            {(issue || error) && <p role="alert">{issue || error}</p>}
            <div className="actions">
              <button className="button">
                {saving
                  ? "Saving…"
                  : current
                    ? "Save revised agreement"
                    : goal.status === "draft"
                      ? "Activate pursuit"
                      : "Commit to this action"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => navigate("/app")}
              >
                Back to pursuit
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </main>
  );
}
export function ReportAction({
  goal,
  snapshot,
  save,
  saving,
  navigate,
}: Props) {
  const c = currentAction(snapshot, goal.id)!;
  const [result, setResult] = useState<Result | null>(null);
  const key = `earned-self:report:${goal.owner_id}:${c.id}`;
  const { value, change, error } = useTextDraft(key, {
    detail: "",
    prevented: "",
    adjustment: "",
  });
  return (
    <div className="report-action">
      <h3>
        {isOverdue(snapshot, c.id)
          ? "Your commitment needs an update."
          : "What actually happened?"}
      </h3>
      <p>
        {isOverdue(snapshot, c.id)
          ? "Overdue and unreported. Only you can say what happened."
          : "Report the result when you know it."}
      </p>
      <div className="status-row">
        {(["done", "partly", "did_not_happen"] as Result[]).map((r) => (
          <button
            key={r}
            className="secondary"
            disabled={saving}
            aria-pressed={result === r}
            onClick={() => setResult(r)}
          >
            {resultLabel[r]}
          </button>
        ))}
      </div>
      {result && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save(
              "outcome",
              {
                id: c.id,
                goalId: goal.id,
                commitmentId: c.id,
                version: c.version,
                result,
                ...value,
              },
              (r) => {
                localStorage.removeItem(key);
                navigate("/proof/" + r.id);
              },
            );
          }}
        >
          <fieldset disabled={saving}>
            {result !== "done" && (
              <>
                <p className="accountability-prompt">
                  You committed to this because it matters to you. It didn’t
                  happen as planned. What prevented it, and what will you change
                  before committing again?
                </p>
                <Field
                  label="What prevented it?"
                  value={value.prevented}
                  onChange={(prevented) => change({ ...value, prevented })}
                />
                <Field
                  label="What will you change?"
                  value={value.adjustment}
                  onChange={(adjustment) => change({ ...value, adjustment })}
                />
              </>
            )}
            <Field
              label="What happened"
              value={value.detail}
              onChange={(detail) => change({ ...value, detail })}
            />
            {error && <p role="alert">{error}</p>}
            <button className="button">Save preparation result</button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
export function Pursuit(props: Props) {
  const { goal: g, snapshot: s, save, saving, navigate } = props;
  const c = currentAction(s, g.id),
    d = c && definition(s, c.id, c.revision),
    schedule = c && currentSchedule(s, c.id),
    m = currentMilestone(s, g);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const [milestoneDetail, setMilestoneDetail] = useState(""),
    [status, setStatus] = useState("paused"),
    [detail, setDetail] = useState(""),
    [reflection, setReflection] = useState(""),
    [next, setNext] = useState("");
  const [deadlineId, setDeadlineId] = useState(m?.id ?? ""),
    [deadline, setDeadline] = useState(blankTime),
    [reason, setReason] = useState("");
  const changes = s.events.filter(
    (e) =>
      e.goal_id === g.id &&
      (e.kind === "reschedule" || e.kind === "milestone_schedule"),
  ).length;
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    g.status,
  );
  const completion = [...s.events]
    .reverse()
    .find(
      (e) =>
        e.goal_id === g.id && e.kind === "status" && e.data.to === "completed",
    );
  return (
    <>
      <p className="eyebrow">Who you want to become</p>
      <h1 className="goal-quote" tabIndex={-1}>
        {g.vision || "Your vision is taking shape."}
      </h1>
      <p className="eyebrow">Your major accomplishment</p>
      <h2 className="accomplishment">
        {g.words || "Define the accomplishment worth preparing for."}
      </h2>
      <p className="member-text">{g.outcome}</p>
      {g.status === "draft" ? (
        <section className="notice">
          <h2>Draft pursuit</h2>
          <p>
            Your ambition needs a complete preparation plan and a scheduled next
            action before it becomes active.
          </p>
          <div className="actions">
            <button
              className="button"
              onClick={() => navigate("/plan/" + g.id)}
            >
              Build the preparation plan
            </button>
            <button
              className="secondary"
              onClick={() => navigate("/commitment/" + g.id)}
            >
              Schedule first action
            </button>
          </div>
        </section>
      ) : (
        <div className="pursuit-grid">
          <section className="milestone-focus">
            <p className="eyebrow">
              {m
                ? "Current preparation milestone"
                : "Preparation plan reviewed"}
            </p>
            <h2>{m?.title ?? "All planned milestones completed."}</h2>
            {m && (
              <>
                <p>{m.criterion}</p>
                <p className="muted">Deadline: {milestoneWhen(m)}</p>
                {Date.parse(
                  scheduledInstant(m.localDate, m.localTime, m.timeZone),
                ) < Date.now() && (
                  <p className="accountability-prompt">
                    Milestone deadline passed. Completion remains unreported.
                  </p>
                )}
              </>
            )}
            {c && d ? (
              <div className="action-focus">
                <p className="eyebrow">Next scheduled action</p>
                <h3>{d.action}</h3>
                <p>Done means: {d.criterion}</p>
                <p>
                  {schedule
                    ? when(schedule)
                    : "Earlier agreement had no schedule"}
                </p>
                {schedule?.location && <p>{schedule.location}</p>}
              </div>
            ) : (
              !ended && (
                <>
                  <p>Put the next preparation action on the calendar.</p>
                  {m && (
                    <button
                      className="button"
                      disabled={saving}
                      onClick={() => navigate("/commitment/" + g.id)}
                    >
                      Schedule next action
                    </button>
                  )}
                </>
              )
            )}
          </section>
          <aside className="proof-aside">
            <p className="eyebrow">Current accountability status</p>
            <h3>{stateLabel[g.status]}</h3>
            {g.status === "paused" && (
              <p>
                Paused deliberately. Earlier agreements and unreported work stay
                visible.
              </p>
            )}
            {changes > 0 && (
              <p className="accountability-prompt">
                The date changed {changes} {changes === 1 ? "time" : "times"}.{" "}
                {ended
                  ? "Earlier agreements remain in Proof."
                  : "The work is still waiting. Choose a workable plan, address a blocker, or pause deliberately."}
              </p>
            )}
            <button className="text-button" onClick={() => navigate("/proof")}>
              Review your Proof
            </button>
          </aside>
        </div>
      )}
      {c && (
        <>
          <ReportAction key={c.id} {...props} />
          {!ended && (
            <button
              className="text-button"
              disabled={saving}
              onClick={() => navigate("/commitment/" + g.id)}
            >
              Revise action and schedule
            </button>
          )}
        </>
      )}
      {!c && m && g.status === "active" && (
        <details className="inline-help">
          <summary>Complete this preparation milestone</summary>
          <p>Completion means: {m.criterion}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(
                "milestone",
                {
                  goalId: g.id,
                  version: g.version,
                  milestoneId: m.id,
                  detail: milestoneDetail,
                },
                () => setMilestoneDetail(""),
              );
            }}
          >
            <fieldset disabled={saving}>
              <Field
                label="What completed this milestone?"
                value={milestoneDetail}
                onChange={setMilestoneDetail}
              />
              <button className="button">Complete milestone and advance</button>
            </fieldset>
          </form>
          <p>
            Completing preparation does not complete your major accomplishment.
          </p>
        </details>
      )}
      {!ended && g.status !== "draft" && (
        <details className="inline-help">
          <summary>Revise a milestone deadline</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(
                "milestone_schedule",
                {
                  goalId: g.id,
                  version: g.version,
                  milestoneId: deadlineId,
                  ...deadline,
                  reason,
                },
                () => setReason(""),
              );
            }}
          >
            <fieldset disabled={saving}>
              <label htmlFor="deadlineMilestone">Unfinished milestone</label>
              <select
                id="deadlineMilestone"
                value={deadlineId}
                onChange={(e) => setDeadlineId(e.target.value)}
              >
                <option value="">Choose a milestone</option>
                {g.milestones
                  .filter(
                    (v) =>
                      !s.events.some(
                        (e) =>
                          e.goal_id === g.id &&
                          e.kind === "milestone" &&
                          e.data.milestoneId === v.id,
                      ),
                  )
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
              </select>
              <ScheduleFields
                prefix="Revised milestone deadline"
                value={deadline}
                change={setDeadline}
              />
              <Field
                label="Why is this deadline changing?"
                value={reason}
                onChange={setReason}
              />
              <button className="button">Save revised deadline</button>
            </fieldset>
          </form>
          <p>The original deadline and every change remain in Proof.</p>
        </details>
      )}
      {completion && (
        <section className="chapter">
          <h2>You did it. Now look at what it took.</h2>
          <p>{completion.data.detail}</p>
          <h3>Your reflection</h3>
          <p>{completion.data.reflection}</p>
          <h3>What comes next</h3>
          <p>{completion.data.next}</p>
          <button className="button" onClick={() => navigate("/proof")}>
            See the full story in Proof
          </button>
        </section>
      )}
      {!ended && (
        <details className="inline-help">
          <summary>Choose the pursuit’s next state</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(
                "status",
                {
                  goalId: g.id,
                  version: g.version,
                  status,
                  detail,
                  reflection,
                  next,
                },
                () => {
                  setDetail("");
                  setReflection("");
                  setNext("");
                },
              );
            }}
          >
            <fieldset disabled={saving}>
              <label htmlFor="pursuitState">Your decision</label>
              <select
                id="pursuitState"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="paused" disabled={g.status === "paused"}>
                  Pause the pursuit
                </option>
                <option value="changed_direction">Change direction</option>
                <option value="completed">
                  Complete the major accomplishment
                </option>
                <option value="abandoned">
                  Abandon this pursuit — my choice of wording
                </option>
                {g.status === "paused" && (
                  <option value="active">Resume scheduled preparation</option>
                )}
              </select>
              <Field
                label={
                  status === "completed"
                    ? "What actually happened at the major accomplishment?"
                    : "Why are you making this decision?"
                }
                value={detail}
                onChange={setDetail}
              />
              {status === "completed" && (
                <>
                  <p>Defined outcome: {g.outcome}</p>
                  <Field
                    label="Your own reflection"
                    value={reflection}
                    onChange={setReflection}
                  />
                  <Field
                    label="What comes next?"
                    value={next}
                    onChange={setNext}
                  />
                </>
              )}
              <button className="button">Save pursuit decision</button>
            </fieldset>
          </form>
        </details>
      )}
      <details className="inline-help">
        <summary>Your preparation plan</summary>
        <p>Why now: {g.meaning}</p>
        <p>Constraints or risks: {g.constraints}</p>
        <p>Capabilities: {g.capabilities}</p>
        <p>Unknowns: {g.unknowns}</p>
        <ol>
          {g.milestones.map((v) => (
            <li key={v.id}>
              <strong>{v.title}</strong>
              <p>{v.criterion}</p>
              <p>{milestoneWhen(v)}</p>
            </li>
          ))}
        </ol>
      </details>
      <button
        className="text-button"
        disabled={saving}
        onClick={() => navigate("/start")}
      >
        Start another pursuit
      </button>
    </>
  );
}
function GoalProof({
  goal: g,
  snapshot: s,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const original = s.goalHistory.find((h) => h.goal_id === g.id),
    completion = [...s.events]
      .reverse()
      .find(
        (e) =>
          e.goal_id === g.id &&
          e.kind === "status" &&
          e.data.to === "completed",
      );
  return (
    <section className="chapter">
      <p className="eyebrow">{stateLabel[g.status]}</p>
      <h2>{g.words || "Draft accomplishment"}</h2>
      <div className="proof-passage">
        <p className="eyebrow">Original vision and starting words</p>
        <blockquote>
          {original?.vision || "Vision not yet written at the start."}
        </blockquote>
        <p className="member-text">
          {original?.words || "Accomplishment not yet written at the start."}
        </p>
        {original?.meaning && <p>{original.meaning}</p>}
        <p className="eyebrow">Defined outcome</p>
        <p>{g.outcome || "Not yet defined."}</p>
      </div>
      <h3>Preparation followed through on, missed or changed</h3>
      {s.commitments
        .filter((c) => c.goal_id === g.id)
        .map((c) => {
          const d = definition(s, c.id, c.revision),
            e = s.evidence.find((e) => e.commitment_id === c.id),
            r = e && currentReport(s, e.id, e.revision);
          return (
            <article className="proof-attempt" key={c.id}>
              <p className="eyebrow">
                Preparation ·{" "}
                {r
                  ? resultLabel[r.result]
                  : isOverdue(s, c.id)
                    ? "Overdue and unreported"
                    : "Unreported"}
              </p>
              <h3>{d?.action}</h3>
              <p>
                Milestone:{" "}
                {g.milestones.find((m) => m.id === c.milestone_id)?.title ??
                  "Earlier commitment, before structured planning"}
              </p>
              <details>
                <summary>Original agreement and schedule history</summary>
                {s.definitions
                  .filter((v) => v.commitment_id === c.id)
                  .sort((a, b) => a.revision - b.revision)
                  .map((v) => (
                    <div key={v.revision}>
                      <p>
                        Agreement {v.revision}: {v.action}
                      </p>
                      <p>Done means: {v.criterion}</p>
                      {s.schedules
                        .filter(
                          (x) =>
                            x.commitment_id === c.id &&
                            x.commitment_revision === v.revision,
                        )
                        .map((x) => (
                          <p key={x.id}>
                            {when(x)} ·{" "}
                            {x.state === "superseded"
                              ? "Earlier schedule"
                              : "Latest schedule"}
                          </p>
                        ))}
                    </div>
                  ))}
              </details>
              {r?.prevented && <p>What prevented it: {r.prevented}</p>}
              {r?.adjustment && <p>What will change: {r.adjustment}</p>}
              {r?.detail && <p>{r.detail}</p>}
              {r?.reflection && (
                <>
                  <p className="eyebrow">Member reflection</p>
                  <p>{r.reflection}</p>
                </>
              )}
              {e && (
                <button
                  className="text-button"
                  onClick={() => navigate("/proof/" + e.id)}
                >
                  Open preparation Proof
                </button>
              )}
            </article>
          );
        })}
      <h3>Milestones, changes and returns</h3>
      {s.events
        .filter((e) => e.goal_id === g.id)
        .map((e) => (
          <article className="proof-event" key={e.id}>
            <p className="eyebrow">
              {e.kind === "milestone"
                ? "Milestone completed"
                : e.kind === "status"
                  ? stateLabel[e.data.to as keyof typeof stateLabel]
                  : e.kind === "milestone_schedule"
                    ? "Milestone deadline changed"
                    : e.kind === "reschedule"
                      ? "Action agreement changed"
                      : decisions[e.data.decision as keyof typeof decisions]}
            </p>
            {e.data.milestoneId && (
              <p>
                {g.milestones.find((m) => m.id === e.data.milestoneId)?.title}
              </p>
            )}
            <p>{e.data.detail}</p>
            <small>{new Date(e.recorded_at).toLocaleString()}</small>
          </article>
        ))}
      {completion && (
        <div className="proof-passage chapter-after">
          <p className="eyebrow">Major accomplishment completed</p>
          <h3>You did it. Now look at what it took.</h3>
          <p>{completion.data.detail}</p>
          <p className="eyebrow">Your own reflection</p>
          <p>{completion.data.reflection}</p>
          <p className="eyebrow">The deliberate next choice</p>
          <p>{completion.data.next}</p>
        </div>
      )}
      <details className="inline-help">
        <summary>Starting words, plan revisions and deadline history</summary>
        {s.goalHistory
          .filter((h) => h.goal_id === g.id)
          .map((h) => (
            <section key={h.revision}>
              <h3>Plan {h.revision}</h3>
              <p>{h.vision}</p>
              <p>{h.words}</p>
              <p>Defined outcome: {h.outcome}</p>
              <p>Why now: {h.meaning}</p>
              <p>Constraints: {h.constraints}</p>
              <p>Capabilities: {h.capabilities}</p>
              <p>Unknowns: {h.unknowns}</p>
              <ol>
                {h.milestones.map((m) => (
                  <li key={m.id}>
                    {m.title} · {m.criterion} · {milestoneWhen(m)}
                  </li>
                ))}
              </ol>
            </section>
          ))}
      </details>
    </section>
  );
}
export function Proof({
  snapshot,
  navigate,
}: {
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  return (
    <main id="main" className="workspace">
      <p className="eyebrow">
        Your ambition. Your work. What actually happened.
      </p>
      <h1 tabIndex={-1}>Your Proof.</h1>
      <p className="intro">
        Preparation, accomplishments and your own reflections. Every miss,
        change and return stays part of the story.
      </p>
      {!snapshot.goals.length ? (
        <p>No Proof yet. Begin with a pursuit that matters to you.</p>
      ) : (
        snapshot.goals.map((g) => (
          <GoalProof
            key={g.id}
            goal={g}
            snapshot={snapshot}
            navigate={navigate}
          />
        ))
      )}
      <button className="button" onClick={() => navigate("/app")}>
        Back to pursuit
      </button>
    </main>
  );
}
export function ProofDetail({
  entryId,
  snapshot: s,
  save,
  saving,
  navigate,
}: {
  entryId: string;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
  user?: User;
}) {
  const e = s.evidence.find((v) => v.id === entryId)!,
    r = currentReport(s, e.id, e.revision)!,
    g = s.goals.find((v) => v.id === e.goal_id)!,
    d = definition(s, e.commitment_id, e.commitment_revision)!;
  const key = `earned-self:reflection:${g.owner_id}:${e.id}:${e.revision}`,
    { value, change, error } = useTextDraft(key, {
      detail: r.detail ?? "",
      reflection: r.reflection ?? "",
    });
  return (
    <main id="main" className="workspace narrow">
      <p className="eyebrow">Preparation Proof · {resultLabel[r.result]}</p>
      <h1 tabIndex={-1}>
        {r.result === "done"
          ? "You completed what you committed to."
          : "The result is part of your Proof."}
      </h1>
      <h2>{d.action}</h2>
      <p>Building toward: {g.words}</p>
      <p>Done means: {d.criterion}</p>
      {r.prevented && <p>What prevented it: {r.prevented}</p>}
      {r.adjustment && <p>What will change: {r.adjustment}</p>}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          void save(
            "detail",
            { goalId: g.id, evidenceId: e.id, version: e.version, ...value },
            () => localStorage.removeItem(key),
          );
        }}
      >
        <fieldset disabled={saving}>
          <Field
            label="What happened"
            optional
            value={value.detail}
            onChange={(detail) => change({ ...value, detail })}
          />
          <Field
            label="Your reflection"
            optional
            value={value.reflection}
            onChange={(reflection) => change({ ...value, reflection })}
          />
          {error && <p role="alert">{error}</p>}
          <button className="button">Save reflection or detail</button>
        </fieldset>
      </form>
      <details className="inline-help">
        <summary>Report and reflection revisions</summary>
        {s.reports
          .filter((v) => v.evidence_id === e.id)
          .map((v) => (
            <section key={v.revision}>
              <h3>
                Revision {v.revision} · {resultLabel[v.result]}
              </h3>
              <p>{v.detail || "No factual detail added."}</p>
              <p>{v.reflection || "No reflection added."}</p>
            </section>
          ))}
      </details>
      <div className="actions">
        <button className="secondary" onClick={() => navigate("/app")}>
          Choose what comes next
        </button>
        <button className="text-button" onClick={() => navigate("/proof")}>
          Your Proof
        </button>
      </div>
    </main>
  );
}
