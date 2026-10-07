import { WorkshopPath } from "./WorkshopPath";
import { PlanFocus } from "./PlanFocus";
import { MilestonePath } from "./MilestonePath";
import { Paused } from "./Paused";
import { completedEvent, completionRecord } from "./ChallengeRecord";
import { Stage, Landscape } from "./Stage";
import { displaySchedule, displayDate } from "../data/time";
import { currentSchedule } from "../data/domain";
import { repeatLabel } from "../data/recurrence";
import { pendingSteps } from "./PlanStep";
import { useEffect, useState } from "react";
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
  const [showDetails, setShowDetails] = useState(false);
  const [focusedMilestone, setFocusedMilestone] = useState<string | null>(null);
  useEffect(() => {
    if (!showDetails || !focusedMilestone) return;
    const target = document.getElementById("milestone-" + focusedMilestone);
    target?.scrollIntoView({ block: "start" });
    target?.querySelector("summary")?.focus({ preventScroll: true });
  }, [showDetails, focusedMilestone]);
  const [editingVision, setEditingVision] = useState(false);
  const [vision, setVision] = useState(g.vision);
  const [section, setSection] = useState(
      location.pathname === "/manage/why" ? "preparation" : "overview",
    ),
    m = currentMilestone(s, g);
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    g.status,
  );
  return (
    <Stage
      title={section === "preparation" ? "Your preparation" : "Your Plan"}
      statement={
        section === "overview"
          ? "Every day, every step, every milestone brings progress"
          : undefined
      }
      navigate={navigate}
      back={
        section === "preparation" ? () => setSection("overview") : undefined
      }
      backLabel="Back to Your Plan"
    >
      {g.status === "paused" && <Paused goal={g} navigate={navigate} />}
      <details open className="challenge-breadcrumb">
        <summary>Challenge · {g.words}</summary>
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
      </details>
      {section === "overview" && (
        <section className="plan-overview">
          <WorkshopPath
            key={g.id}
            goal={g}
            snapshot={s}
            onReview={(id) => {
              setShowDetails(true);
              setFocusedMilestone(id);
            }}
          />
          <PlanFocus goal={g} snapshot={s} navigate={navigate} />
          <MilestonePath
            goal={g}
            snapshot={s}
            onReview={(id) => {
              setShowDetails(true);
              setFocusedMilestone(id);
            }}
          />
          <button
            className="quiet all-plan-link"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
          >
            {showDetails ? "Close planning details" : "All milestones & steps"}
          </button>
          <div hidden={!showDetails} className="plan-detail-tools">
            {!m && !ended && (
              <button
                className="button secondary"
                onClick={() => navigate("/milestone/" + g.id)}
              >
                Review milestones
              </button>
            )}
            <section
              className="all-plan-details"
              aria-label="All milestones & steps"
            >
              <h2>Milestones & steps</h2>
              {!g.milestones.length && <p>No milestones planned yet.</p>}
              <div className="milestone-path">
                {[...g.milestones]
                  .sort(
                    (a, b) => Number(b.id === m?.id) - Number(a.id === m?.id),
                  )
                  .map((m) => (
                    <details
                      className={
                        !ended && m.id === currentMilestone(s, g)?.id
                          ? "plan-stage current plan-focus"
                          : "plan-stage"
                      }
                      key={m.id}
                      id={"milestone-" + m.id}
                      open={
                        m.id === currentMilestone(s, g)?.id ||
                        m.id === focusedMilestone
                      }
                    >
                      <summary>
                        <span className="stage-number">
                          {g.milestones.findIndex((item) => item.id === m.id) +
                            1}
                        </span>
                        <span>
                          <small>
                            {s.events.some(
                              (e) =>
                                e.goal_id === g.id &&
                                e.kind === "milestone" &&
                                e.data.milestoneId === m.id,
                            )
                              ? "Completed"
                              : m.id === currentMilestone(s, g)?.id
                                ? g.status === "paused"
                                  ? "Paused milestone"
                                  : ended
                                    ? "Not completed"
                                    : "Current milestone"
                                : ended
                                  ? "Not completed"
                                  : "Upcoming"}
                          </small>
                          <strong>{m.title}</strong>
                        </span>
                      </summary>
                      <p>{m.criterion}</p>
                      <p className="small">
                        {displaySchedule(m.localDate, m.localTime, m.timeZone)}
                      </p>
                      {pendingSteps(s, g)
                        .filter((e) => e.data.milestoneId === m.id)
                        .map((e) => (
                          <div key={e.id}>
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
                      {s.commitments
                        .filter(
                          (c) =>
                            c.goal_id === g.id &&
                            c.milestone_id === m.id &&
                            c.state === "active",
                        )
                        .map((c) => (
                          <div
                            className={
                              currentAction(s, g.id)?.id === c.id
                                ? "plan-step-row plan-current-step"
                                : "plan-step-row"
                            }
                            key={c.id}
                          >
                            {currentAction(s, g.id)?.id === c.id && (
                              <small className="section-label">
                                Current step
                              </small>
                            )}
                            <button
                              className="quiet plan-step-title"
                              onClick={() =>
                                navigate(
                                  currentAction(s, g.id)?.id === c.id
                                    ? "/app"
                                    : "/revise/" + g.id + "/" + c.id,
                                )
                              }
                            >
                              {definition(s, c.id, c.revision)?.action}
                            </button>
                            <small className="step-state">
                              {c.state === "active"
                                ? g.status === "paused"
                                  ? "Paused · date retained"
                                  : "Scheduled"
                                : c.state === "cancelled"
                                  ? "Ended without a check-in"
                                  : "Check-in recorded"}
                            </small>
                            <small className="step-metadata">
                              {displaySchedule(
                                currentSchedule(s, c.id)?.local_date,
                                currentSchedule(s, c.id)?.local_time,
                                currentSchedule(s, c.id)?.time_zone,
                              )}{" "}
                              · {repeatLabel(c.recurrence)}
                            </small>
                            <button
                              className="button secondary"
                              onClick={() =>
                                navigate("/revise/" + g.id + "/" + c.id)
                              }
                            >
                              Revise this step
                            </button>
                            {c.state === "active" && c.recurrence && (
                              <button
                                className="button secondary"
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
                        ))}
                      {m.id === currentMilestone(s, g)?.id && (
                        <button
                          className="button secondary"
                          onClick={() => navigate("/milestone/" + g.id)}
                        >
                          Review milestone
                        </button>
                      )}
                      <p className="small">
                        {
                          s.commitments.filter(
                            (c) =>
                              c.goal_id === g.id &&
                              c.milestone_id === m.id &&
                              c.state === "reported",
                          ).length
                        }{" "}
                        check-ins recorded in Proof
                      </p>
                      {!s.events.some(
                        (e) =>
                          e.goal_id === g.id &&
                          e.kind === "milestone" &&
                          e.data.milestoneId === m.id,
                      ) && (
                        <button
                          className="button secondary"
                          onClick={() =>
                            navigate("/add-step/" + g.id + "?milestone=" + m.id)
                          }
                        >
                          Add step
                        </button>
                      )}
                    </details>
                  ))}
              </div>
            </section>
            {!["completed", "changed_direction", "abandoned"].includes(
              g.status,
            ) && (
              <button
                className="button secondary"
                onClick={() => navigate("/add-step/" + g.id)}
              >
                Add step
              </button>
            )}
            {!["completed", "changed_direction", "abandoned"].includes(
              g.status,
            ) && (
              <button
                className="button secondary"
                onClick={() => navigate("/add-milestone/" + g.id)}
              >
                Add milestone
              </button>
            )}
          </div>
        </section>
      )}
      {section === "overview" ? (
        <div className="plan-tools">
          <section className="preparation-card">
            <h2>Why & obstacles</h2>
            <p className="small">
              Keep your reason and your response within reach.
            </p>
            <button
              className="button secondary"
              onClick={() => setSection("preparation")}
            >
              My preparation
            </button>
            {g.status === "draft" && !currentAction(s, g.id) && (
              <button
                className="button secondary"
                onClick={() => navigate("/plan/" + g.id)}
              >
                Complete my preparation
              </button>
            )}
          </section>
          <button
            className="wallpaper-card"
            onClick={() => navigate("/wallpaper/" + g.id)}
          >
            <span>
              <strong>Take your vision with you</strong>
              <small>Create wallpaper →</small>
            </span>
          </button>
          <details className="manage-challenge">
            <summary>Manage challenge</summary>
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

            {!["completed", "changed_direction", "abandoned"].includes(
              g.status,
            ) && (
              <button
                className="button secondary"
                onClick={() => navigate("/decision/" + g.id)}
              >
                Pause, return or complete
              </button>
            )}
            {g.status !== "draft" && (
              <button
                className="button secondary"
                onClick={() => navigate("/history")}
              >
                Agreements and revisions
              </button>
            )}
          </details>
        </div>
      ) : (
        <>
          <h2>My reason</h2>
          <p>{g.meaning}</p>
          <h2>Constraints</h2>
          <p>{g.constraints}</p>
          <h2>What I am building</h2>
          <p>{g.capabilities}</p>
          <h2>Open questions</h2>
          <p>{g.unknowns}</p>
          <h2>My milestones</h2>
          {!g.milestones.length && <p>No milestones planned yet.</p>}
          {!m && (
            <button
              className="button secondary"
              onClick={() => navigate("/milestone/" + g.id)}
            >
              Review milestones
            </button>
          )}
          {g.milestones.map((m) => (
            <div className="first-proof" key={m.id}>
              <h3>{m.title}</h3>
              <p>{m.criterion}</p>
              <p className="small">
                {displaySchedule(m.localDate, m.localTime, m.timeZone)}
              </p>
            </div>
          ))}
        </>
      )}
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
  const [filter, setFilter] = useState("all");
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
  const ongoing = s.goals.filter(
    (g) =>
      g.status !== "completed" && (filter === "all" || g.status === filter),
  );
  return (
    <Stage
      title="Your Proof"
      statement="The evidence is stacking up, keep going"
      navigate={navigate}
      tone="proof"
    >
      {s.goals.find((g) => g.id === s.selectedGoal) && (
        <details className="challenge-breadcrumb">
          <summary>
            Challenge · {s.goals.find((g) => g.id === s.selectedGoal)?.words}
          </summary>
          <p>{s.goals.find((g) => g.id === s.selectedGoal)?.outcome}</p>
        </details>
      )}
      {!completed.length && (
        <div className="proof-introduction">
          <span className="section-label">
            {s.goals.find((g) => g.id === s.selectedGoal)?.status === "paused"
              ? "Paused"
              : focused?.status === "active"
                ? "In progress"
                : "Your record"}
          </span>
        </div>
      )}
      {!completed.length && <Landscape scene="proof" />}
      {completed.length > 0 && (
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
                    ? " · " + displayDate(record.event.recorded_at.slice(0, 10))
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
        <label className="proof-filter" hidden={!showAll}>
          Show supporting history
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All challenges</option>
            <option value="active">Current challenges</option>
            <option value="paused">Paused challenges</option>
            <option value="draft">Preparing</option>
          </select>
        </label>
        {(showAll
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
              limit={showAll ? undefined : 3}
            />
          </section>
        ))}
        {showAll &&
          filter === "all" &&
          completed.map((g) => (
            <details className="supporting-proof" key={g.id}>
              <summary>Supporting history: {g.words}</summary>
              <ProofHistory goal={g} snapshot={s} navigate={navigate} />
            </details>
          ))}
        {!s.goals.length && (
          <p>No Proof yet. Your recorded actions will appear here.</p>
        )}
        {filter !== "all" && !ongoing.length && (
          <p>No challenges match this filter.</p>
        )}
      </section>
      <button
        className="button proof-all-button"
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
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
  limit?: number;
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
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="evidence-timeline">
      {entries.slice(0, limit).map((item) => {
        if (item.evidence) {
          const e = item.evidence,
            r = currentReport(s, e.id, e.revision),
            d = definition(s, e.commitment_id, e.commitment_revision);
          return (
            <button
              className="proof-row"
              data-result={r?.result || "unknown"}
              key={e.id}
              onClick={() => navigate("/proof/" + e.id)}
            >
              <span className="evidence-marker" aria-hidden="true" />
              <span className="section-label">
                {r?.result === "done"
                  ? "Step completed"
                  : r?.result === "did_not_happen"
                    ? "Step missed"
                    : r?.result === "partly"
                      ? "Partly completed"
                      : "Earlier check-in"}
              </span>
              <strong>{d?.action || "Earlier step"}</strong>
              <small>
                {displayDate((r?.occurred_on || e.recorded_at).slice(0, 10))} ·{" "}
                <span className="evidence-link">View check-in</span> ›
              </small>
            </button>
          );
        }
        const e = item.event!;
        return (
          <details
            className="proof-attempt"
            data-result={e.kind === "milestone" ? "done" : "attempt"}
            key={e.id}
          >
            <summary>
              <span className="evidence-marker" aria-hidden="true" />
              <span className="section-label">
                {e.kind === "milestone"
                  ? "Milestone completed"
                  : "Milestone attempt"}
              </span>
              <strong>
                {g.milestones.find((m) => m.id === e.data.milestoneId)?.title ||
                  "Earlier milestone"}
              </strong>
              <small>
                {displayDate(e.recorded_at.slice(0, 10))} ·{" "}
                <span className="evidence-link">View reflection</span> ›
              </small>
            </summary>
            <p>{e.data.detail || "No reflection recorded."}</p>
          </details>
        );
      })}
      {!entries.length && <p>No Proof yet. Record a check-in when you act.</p>}
    </div>
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
