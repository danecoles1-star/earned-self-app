import { completedProgress } from "./progress";
import { AreaAssignment } from "./Areas";

import { Paused } from "./Paused";
import { completedEvent, completionRecord } from "./ChallengeRecord";
import { Stage, Landscape } from "./Stage";
import {
  MilestoneTracker,
  MountainMark,
  comebacks,
  earnedMilestones,
} from "./Earned";
import { EmptyState } from "./Notice";
import { displaySchedule, displayDate } from "../data/time";
import { currentSchedule } from "../data/domain";
import { repeatLabel } from "../data/recurrence";
import { pendingSteps } from "./PlanStep";
import { useState } from "react";
import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentReport,
  definition,
} from "../data/domain";
import { resultLabel } from "../data/types";
import { Page, Input } from "./ui";
import { useTextDraft, type Save } from "../components/PursuitScreens";
export function Ambition({
  goal: g,
  snapshot: s,
  navigate,
  save,
  saving,
}: {
  save: Save;
  saving: boolean;
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const [editingVision, setEditingVision] = useState(false);
  const [vision, setVision] = useState(g.vision);
  const [stepsOpen, setStepsOpen] = useState(true);
  const m = currentMilestone(s, g);
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    g.status,
  );
  const earned = earnedMilestones(s, g);
  const recorded = s.evidence.filter((e) => e.goal_id === g.id).length;
  const returns = comebacks(s, g);
  const current = ended ? undefined : m;
  const action = currentAction(s, g.id);
  return (
    <Stage title="Your Plan" tone="plan" navigate={navigate}>
      {g.status === "paused" && <Paused goal={g} navigate={navigate} />}
      <div id="es-plan" className="ep">
        {g.vision.trim() && <p className="ep-becoming">Becoming: {g.vision}</p>}
        <section className="challenge-breadcrumb plan-challenge ep-challenge">
          <span className="es-eyebrow">Your challenge</span>
          {g.words.trim() ? (
            <h2>{g.words}</h2>
          ) : (
            <h2 className="ep-pending">Your challenge will appear here.</h2>
          )}
          <p>
            Done means: {g.outcome || "Define your finish during preparation."}
          </p>
          {g.status === "completed" && (
            <button
              className="quiet"
              onClick={() => navigate("/proof/challenge/" + g.id)}
            >
              Revisit your accomplishment
            </button>
          )}
        </section>
        <section
          className="plan-overview workshop-path route-map-stage ep-path"
          aria-label="Your milestone progression"
        >
          <header className="ep-path-head">
            <span className="es-eyebrow">
              {g.status === "paused" ? "Paused" : "Your milestones"}
            </span>
            <p className="ep-totals">
              <span className="path-caption">
                {earned.size} of {g.milestones.length} milestones completed
              </span>
              <span>
                <strong>{recorded}</strong>{" "}
                {recorded === 1 ? "step recorded" : "steps recorded"}
              </span>
              <span>
                <strong>{returns}</strong>{" "}
                {returns === 1 ? "comeback" : "comebacks"}
              </span>
            </p>
          </header>
          {!m && !ended && g.milestones.length > 0 && (
            <button
              className="ep-ghost"
              onClick={() => navigate("/milestone/" + g.id)}
            >
              Review milestones
            </button>
          )}
          <section
            className="all-plan-details"
            aria-label="All milestones & steps"
          >
            <h2 className="visually-hidden">Milestones & steps</h2>
            {!g.milestones.length && (
              <EmptyState title="No milestones planned yet.">
                <p>
                  Your milestones and the steps toward each one will appear
                  here as a path.
                </p>
              </EmptyState>
            )}
            <ol className="milestone-path ep-milestones">
              {g.milestones.map((milestone, i) => {
                const done = earned.has(milestone.id);
                const isCurrent = !ended && milestone.id === m?.id;
                const state = done
                  ? "Completed"
                  : milestone.id === m?.id
                    ? g.status === "paused"
                      ? "Paused milestone"
                      : ended
                        ? "Not completed"
                        : "Current milestone"
                    : ended
                      ? "Not completed"
                      : "Upcoming";
                const pending = pendingSteps(s, g).filter(
                  (e) => e.data.milestoneId === milestone.id,
                );
                const active = s.commitments.filter(
                  (c) =>
                    c.goal_id === g.id &&
                    c.milestone_id === milestone.id &&
                    c.state === "active",
                );
                const checkIns = s.commitments.filter(
                  (c) =>
                    c.goal_id === g.id &&
                    c.milestone_id === milestone.id &&
                    c.state === "reported",
                ).length;
                const open = !isCurrent || stepsOpen;
                const heading = (
                  <>
                    <small>{state}</small>
                    <strong>{milestone.title}</strong>
                  </>
                );
                return (
                  <li
                    className={
                      "plan-stage ep-milestone" +
                      (isCurrent ? " current plan-focus" : "")
                    }
                    data-state={done ? "earned" : isCurrent ? "current" : "ahead"}
                    key={milestone.id}
                    id={isCurrent ? undefined : "milestone-" + milestone.id}
                    tabIndex={isCurrent ? undefined : -1}
                    aria-label={`Milestone ${i + 1} of ${g.milestones.length}, ${done ? "earned" : isCurrent ? "current" : "ahead"}: ${milestone.title}`}
                  >
                    <span className="ep-rail" aria-hidden="true">
                      <span className="ep-node stage-number">
                        {done ? <MountainMark /> : i + 1}
                      </span>
                    </span>
                    <div className="ep-milestone-body">
                      {current?.id === milestone.id ? (
                        <button
                          className="route-current milestone-heading ep-heading"
                          aria-current="step"
                          aria-expanded={stepsOpen}
                          aria-controls={"milestone-" + milestone.id}
                          onClick={() => setStepsOpen(!stepsOpen)}
                        >
                          {heading}
                        </button>
                      ) : (
                        <header className="milestone-heading ep-heading">
                          {heading}
                        </header>
                      )}
                      <div
                        className="ep-detail"
                        id={isCurrent ? "milestone-" + milestone.id : undefined}
                        hidden={!open}
                      >
                        {(isCurrent || done) && milestone.criterion && (
                          <p className="ep-criterion">{milestone.criterion}</p>
                        )}
                        <p className="small ep-date">
                          {displaySchedule(
                            milestone.localDate,
                            milestone.localTime,
                            milestone.timeZone,
                          )}
                        </p>
                        {active.map((c) => {
                          const isAction = action?.id === c.id;
                          const schedule = currentSchedule(s, c.id);
                          return (
                            <div
                              className={
                                isAction
                                  ? "plan-step-row plan-current-step ep-step ep-step-current"
                                  : "plan-step-row ep-step"
                              }
                              key={c.id}
                            >
                              {isAction && (
                                <small className="section-label">
                                  Current step
                                </small>
                              )}
                              {isAction ? (
                                <button
                                  className="quiet plan-step-title"
                                  onClick={() => navigate("/app")}
                                >
                                  {definition(s, c.id, c.revision)?.action}
                                </button>
                              ) : (
                                <strong className="plan-step-title">
                                  {definition(s, c.id, c.revision)?.action}
                                </strong>
                              )}
                              <small className="step-state">
                                {g.status === "paused"
                                  ? "Paused · date retained"
                                  : "Scheduled"}
                              </small>
                              <small className="step-metadata">
                                {displaySchedule(
                                  schedule?.local_date,
                                  schedule?.local_time,
                                  schedule?.time_zone,
                                )}{" "}
                                · {repeatLabel(c.recurrence)}
                              </small>
                              {c.recurrence && (
                                <button
                                  className="quiet stop-repeat"
                                  disabled={saving}
                                  onClick={() =>
                                    void save(
                                      "stop_repeat",
                                      {
                                        goalId: g.id,
                                        commitmentId: c.id,
                                        version: c.version,
                                      },
                                      () => {},
                                    )
                                  }
                                >
                                  Stop future repetitions
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {pending.map((e) => (
                          <div className="ep-step ep-step-pending" key={e.id}>
                            <p>{e.data.action}</p>
                            <button
                              className="quiet"
                              onClick={() =>
                                navigate(
                                  "/commitment/" + g.id + "/" + e.data.stepId,
                                )
                              }
                            >
                              Schedule this step
                            </button>
                          </div>
                        ))}
                        {isCurrent && !active.length && !pending.length && (
                          <p className="small ep-none">
                            No step is scheduled for this milestone yet.
                          </p>
                        )}
                        {(isCurrent || done || checkIns > 0) && (
                          <p className="small ep-count">
                            {checkIns} check-ins recorded in Proof
                          </p>
                        )}
                        {milestone.id === m?.id && (
                          <button
                            className="ep-ghost"
                            onClick={() => navigate("/milestone/" + g.id)}
                          >
                            Review milestone
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </section>
        <div className="plan-tools ep-tools">
          <section
            className="preparation-card plan-preparation ep-card"
            aria-labelledby="preparation-title"
          >
            <h2 id="preparation-title">My preparation</h2>
            <dl>
              {(
                [
                  ["My reason", g.meaning],
                  ["Constraints", g.constraints],
                  ["What I am building", g.capabilities],
                  ["Open questions", g.unknowns],
                ] as const
              ).map(([label, value]) => (
                <div key={label} data-empty={!value.trim() || undefined}>
                  <dt>{label}</dt>
                  <dd>{value.trim() || "Not written yet."}</dd>
                </div>
              ))}
            </dl>
            {g.status === "draft" && !currentAction(s, g.id) && (
              <button
                className="button secondary"
                onClick={() => navigate("/plan/" + g.id)}
              >
                Complete my preparation
              </button>
            )}
          </section>
          <details className="manage-challenge ep-manage">
            <summary>Review challenge</summary>
            <AreaAssignment />
            <button
              className="button secondary"
              onClick={() => {
                setVision(g.vision);
                setEditingVision(true);
              }}
            >
              Refine my vision
            </button>
            {editingVision ? (
              <section className="vision-editor">
                <Input
                  label="Who I am becoming"
                  value={vision}
                  onChange={setVision}
                />
                <p className="small">
                  Your challenge and Proof stay unchanged. Earlier wording
                  remains in history.
                </p>
                <button
                  className="button"
                  disabled={saving || !vision.trim()}
                  onClick={() =>
                    void save(
                      "vision",
                      { goalId: g.id, version: g.version, vision },
                      () => setEditingVision(false),
                    )
                  }
                >
                  Save vision
                </button>
                <button
                  className="button secondary"
                  onClick={() => setEditingVision(false)}
                >
                  Cancel
                </button>
                <details>
                  <summary>Earlier wording</summary>
                  {s.goalHistory
                    .filter((h) => h.goal_id === g.id && h.vision?.trim())
                    .map((h) => (
                      <button
                        key={h.revision}
                        className="experience-choice"
                        onClick={() => setVision(h.vision)}
                      >
                        {h.vision}
                      </button>
                    ))}
                </details>
              </section>
            ) : null}

            {!ended && (
              <button
                className="button secondary"
                onClick={() => navigate("/decision/" + g.id)}
              >
                Pause, return or complete
              </button>
            )}
          </details>
        </div>
      </div>
    </Stage>
  );
}
export function ProofList({
  snapshot: s,
  navigate,
}: {
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const [filter, setFilter] = useState<
    "all" | "steps" | "milestones" | "challenges"
  >("all");
  const [showAll, setShowAll] = useState(false);
  const focused = s.goals.find((g) => g.id === s.selectedGoal) || s.goals[0];
  const completed = s.goals
    .filter(
      (g) => g.status === "completed" && (showAll || g.id === focused?.id),
    )
    .sort((a, b) =>
      (completedEvent(s, b.id)?.recorded_at || b.created_at).localeCompare(
        completedEvent(s, a.id)?.recorded_at || a.created_at,
      ),
    );
  const ongoing = s.goals.filter((g) => g.status !== "completed");
  const totals = completedProgress(s);
  return (
    <Stage
      title="Your Proof"
      statement=""
      navigate={navigate}
      tone="proof"
      hero={
        <section className="es-proof-head" aria-label="Your Proof">
          <p className="es-proof-title" aria-hidden="true">
            Your Proof
          </p>
          {focused?.vision && (
            <p className="es-proof-identity">Becoming: {focused.vision}</p>
          )}
          {focused && <MilestoneTracker goal={focused} snapshot={s} />}
          <dl className="proof-totals visually-hidden">
            {(
              [
                ["Steps", totals.steps],
                ["Milestones", totals.milestones],
                ["Challenges", totals.challenges],
              ] as const
            ).map(([label, count]) => (
              <div key={label} data-earned={count > 0}>
                <dt>
                  {label}
                  <span>completed</span>
                </dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      }
    >
      <nav className="proof-kind-tabs" aria-label="Evidence type">
        {(["all", "steps", "milestones", "challenges"] as const).map((kind) => (
          <button
            key={kind}
            aria-pressed={filter === kind}
            onClick={() => setFilter(kind)}
          >
            {kind[0].toUpperCase() + kind.slice(1)}
          </button>
        ))}
      </nav>
      {completed.length > 0 &&
        (filter === "all" || filter === "challenges") && (
          <section
            className="completed-proof-list"
            aria-label="Completed challenges"
          >
            {completed.map((g) => {
              const record = completionRecord(s, g);
              return (
                <button
                  key={g.id}
                  className="completed-proof-entry"
                  onClick={() => navigate("/proof/challenge/" + g.id)}
                >
                  <span className="section-label completion-label">
                    Challenge completed
                    {record.event
                      ? " · " +
                        displayDate(record.event.recorded_at.slice(0, 10))
                      : ""}
                  </span>
                  <h2>{record.completed.words}</h2>
                  <Landscape scene="completed" area={g.area} />
                  <p className="proof-fact">
                    {record.event?.data.detail ||
                      "Accomplishment details were not recorded in this earlier entry."}
                  </p>
                  {record.event?.data.reflection?.trim() && (
                    <>
                      <span className="section-label">What this showed me</span>
                      <blockquote>{record.event.data.reflection}</blockquote>
                    </>
                  )}
                  <span className="record-link">Revisit what changed →</span>
                </button>
              );
            })}
            <button className="button" onClick={() => navigate("/new")}>
              Choose my next challenge
            </button>
          </section>
        )}
      <section
        className="proof-support"
        data-expanded={showAll}
        aria-label="Supporting history"
      >
        <h2 className="visually-hidden">
          {completed.length
            ? "The work behind your growth."
            : "The work you’re putting in."}
        </h2>
        {(filter === "challenges"
          ? []
          : showAll
            ? ongoing
            : ongoing.filter((g) => g.id === focused?.id).slice(0, 1)
        ).map((g) => (
          <section className="proof-group" key={g.id}>
            <span className="section-label">
              {g.status === "paused"
                ? "Paused"
                : g.status === "draft"
                  ? "Preparing"
                  : g.status === "active"
                    ? "In progress"
                    : "Ended"}
            </span>
            <h3>{g.words}</h3>
            <ProofHistory
              goal={g}
              snapshot={s}
              navigate={navigate}
              limit={showAll ? undefined : 12}
              kind={filter === "challenges" ? "all" : filter}
            />
          </section>
        ))}
        {(showAll || filter === "steps" || filter === "milestones") &&
          filter !== "challenges" &&
          completed.map((g) => (
            <details className="supporting-proof" key={g.id}>
              <summary>Supporting history: {g.words}</summary>
              <ProofHistory
                goal={g}
                snapshot={s}
                navigate={navigate}
                kind={filter}
              />
            </details>
          ))}
        {!s.goals.length && (
          <p className="es-empty-line">
            No Proof yet. Your recorded actions will appear here.
          </p>
        )}
        {filter === "challenges" && !completed.length && (
          <p className="es-empty-line">
            Your completed challenges will appear here.
          </p>
        )}
      </section>
      <button
        className="button secondary proof-all-button"
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? "Show recent evidence" : "View all evidence"}
      </button>
      <button className="quiet proof-back" onClick={() => navigate("/app")}>
        Back to Now
      </button>
    </Stage>
  );
}
export function ProofHistory({
  goal: g,
  snapshot: s,
  navigate,
  limit,
  kind = "all",
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
  limit?: number;
  kind?: "all" | "steps" | "milestones";
}) {
  const entries = [
    ...s.evidence
      .filter((e) => e.goal_id === g.id)
      .map((e) => ({ date: e.recorded_at, evidence: e, event: null })),
    ...s.events
      .filter(
        (e) =>
          e.goal_id === g.id &&
          ["milestone", "milestone_attempt"].includes(e.kind),
      )
      .map((e) => ({ date: e.recorded_at, evidence: null, event: e })),
  ]
    .filter(
      (item) =>
        kind === "all" || (kind === "steps" ? !!item.evidence : !!item.event),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  let lastWeek = "";
  return (
    <div className="evidence-timeline es-journal">
      {entries.slice(0, limit).map((item) => {
        const week = weekLabel(item.date);
        const heading =
          week !== lastWeek ? (
            <h4 className="es-week" key={"w" + week}>
              {week}
            </h4>
          ) : null;
        lastWeek = week;
        if (item.evidence) {
          const e = item.evidence,
            r = currentReport(s, e.id, e.revision),
            d = definition(s, e.commitment_id, e.commitment_revision);
          const day = (r?.occurred_on || e.recorded_at).slice(0, 10);
          return [
            heading,
            <button
              className="proof-row es-entry"
              data-result={r?.result || "unknown"}
              key={e.id}
              onClick={() => navigate("/proof/" + e.id)}
            >
              <span className="es-entry-top">
                <strong>{d?.action || "Earlier step"}</strong>
                <span className="es-chip" data-result={r?.result || "unknown"}>
                  {r?.result === "done"
                    ? "Done"
                    : r?.result === "did_not_happen"
                      ? "Not yet"
                      : r?.result === "partly"
                        ? "Partly"
                        : "Recorded"}
                </span>
              </span>
              {r?.detail && <span className="es-entry-words">“{r.detail}”</span>}
              <time className="proof-date" dateTime={day}>
                {displayDate(day)}
              </time>
              <span className="visually-hidden">View check-in</span>
            </button>,
          ];
        }
        const e = item.event!;
        return [
          heading,
          <details
            className="proof-attempt es-entry es-entry-milestone"
            data-result={e.kind === "milestone" ? "done" : "attempt"}
            key={e.id}
          >
            <summary>
              {e.kind === "milestone" && (
                <span className="es-entry-badge" aria-hidden="true">
                  <MountainMark size={18} />
                </span>
              )}
              <span className="es-entry-body">
                <span className="es-entry-kind">
                  {e.kind === "milestone"
                    ? "Milestone earned"
                    : "Milestone attempt"}
                </span>
                <strong>
                  {g.milestones.find((m) => m.id === e.data.milestoneId)
                    ?.title || "Earlier milestone"}
                </strong>
                <time
                  className="proof-date"
                  dateTime={e.recorded_at.slice(0, 10)}
                >
                  {displayDate(e.recorded_at.slice(0, 10))}
                </time>
              </span>
            </summary>
            <p>{e.data.detail || "No reflection recorded."}</p>
          </details>,
        ];
      })}
      {!entries.length && (
        <p className="es-empty-line">
          {kind === "milestones"
            ? "No milestone attempts recorded yet."
            : kind === "steps"
              ? "No step check-ins recorded yet."
              : "No Proof yet. Record a check-in when you act."}
        </p>
      )}
    </div>
  );
}
/** "This week", "Last week", or the week's Monday, in the viewer's time zone. */
export function weekLabel(iso: string, now = new Date()) {
  const monday = (d: Date) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  const date = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  const diff = Math.round(
    (monday(now).getTime() - monday(date).getTime()) / (7 * 86400000),
  );
  if (diff <= 0) return "This week";
  if (diff === 1) return "Last week";
  return (
    "Week of " +
    monday(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  );
}
export function ProofEntry({
  id,
  snapshot: s,
  save,
  saving,
  navigate,
}: {
  id: string;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
}) {
  const e = s.evidence.find((e) => e.id === id)!,
    r = currentReport(s, id, e.revision)!,
    d = definition(s, e.commitment_id, e.commitment_revision)!,
    g = s.goals.find((g) => g.id === e.goal_id)!;
  const [editing, setEditing] = useState(false),
    [history, setHistory] = useState(false);
  const {
    value: v,
    change,
    error,
  } = useTextDraft(`earned-self:proof-edit:${g.owner_id}:${id}:${e.revision}`, {
    detail: r.detail || "",
    reflection: r.reflection || "",
    reason: "",
  });
  return (
    <Page
      title={editing ? "Keep the record honest." : d.action}
      sub={
        resultLabel[r.result] +
        " · " +
        displayDate(r.occurred_on || e.recorded_at)
      }
      dark={false}
      back={() => (editing ? setEditing(false) : navigate("/proof"))}
      footer={
        editing ? (
          <>
            <button
              className="button"
              disabled={saving || !v.detail.trim() || !v.reason.trim()}
              onClick={() =>
                void save(
                  "detail",
                  {
                    goalId: g.id,
                    evidenceId: id,
                    version: e.version,
                    detail: v.detail,
                    reflection: [v.reflection, `Revision reason: ${v.reason}`]
                      .filter(Boolean)
                      .join("\n\n"),
                  },
                  () => setEditing(false),
                )
              }
            >
              {saving ? "Saving…" : "Save revision"}
            </button>
            <p className="small">The earlier record stays in your history.</p>
          </>
        ) : (
          <>
            <button className="button" onClick={() => navigate("/app")}>
              Return to Now
            </button>
            <button
              className="button secondary"
              onClick={() => setEditing(true)}
            >
              Update this entry
            </button>
          </>
        )
      }
    >
      <p className="small">{g.words}</p>
      <p className="small">
        {
          g.milestones.find(
            (m) =>
              m.id ===
              s.commitments.find((c) => c.id === e.commitment_id)?.milestone_id,
          )?.title
        }
      </p>
      <details>
        <summary>Session completion criterion</summary>
        <p>{d.criterion}</p>
      </details>
      {editing ? (
        <>
          <Input
            label="What happened?"
            value={v.detail}
            onChange={(detail) => change({ ...v, detail })}
          />
          <Input
            label="What I learned"
            required={false}
            value={v.reflection}
            onChange={(reflection) => change({ ...v, reflection })}
          />
          <Input
            label="Why this revision?"
            value={v.reason}
            onChange={(reason) => change({ ...v, reason })}
          />
          {error && <p role="alert">{error}</p>}
        </>
      ) : (
        <>
          <h2>What happened</h2>
          <p className="first-proof">{r.detail}</p>
          {r.reflection && (
            <>
              <h2>What I learned</h2>
              <p>{r.reflection}</p>
            </>
          )}
          {r.prevented && <p>What prevented it: {r.prevented}</p>}
          {r.adjustment && <p>What will change: {r.adjustment}</p>}
          <button
            className="button secondary"
            onClick={() => setHistory(!history)}
            aria-expanded={history}
          >
            View history
          </button>
          {history &&
            s.reports
              .filter((v) => v.evidence_id === id)
              .map((v) => (
                <section key={v.revision}>
                  <h3>Revision {v.revision}</h3>
                  <p>{v.detail}</p>
                  <p>{v.reflection}</p>
                </section>
              ))}
        </>
      )}
    </Page>
  );
}
