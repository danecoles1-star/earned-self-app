import { Paused } from "./Paused";
import { completedEvent } from "./ChallengeRecord";
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
  const [section, setSection] = useState(
      location.pathname === "/manage/why" ? "preparation" : "overview",
    ),
    m = currentMilestone(s, g);
  return (
    <Page
      title={section === "preparation" ? "Your preparation." : "Your plan."}
      sub={g.vision}
      dark={false}
      back={() =>
        section === "overview" ? navigate("/app") : setSection("overview")
      }
      footer={
        <button className="button" onClick={() => navigate("/app")}>
          Return to Basecamp
        </button>
      }
    >
      {g.status === "paused" && <Paused goal={g} navigate={navigate} />}
      {editingVision ? (
        <section className="vision-editor">
          <Input
            label="Who I am becoming"
            value={vision}
            onChange={setVision}
          />
          <p className="small">
            Your challenge and Proof stay unchanged. Earlier wording remains in
            history.
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
      ) : (
        <button
          className="button secondary"
          onClick={() => {
            setVision(g.vision);
            setEditingVision(true);
          }}
        >
          Edit vision
        </button>
      )}
      <section className="challenge-heading">
        <span className="section-label">Your challenge</span>
        <h2>{g.words}</h2>
        <p>{g.outcome || "Define your finish during preparation."}</p>
      </section>
      {section === "overview" && (
        <section className="plan-overview">
          <h2>Milestones & steps</h2>
          {!g.milestones.length && <p>No milestones planned yet.</p>}
          {g.milestones.map((m, i) => (
            <details
              className={
                m.id === currentMilestone(s, g)?.id
                  ? "plan-stage current"
                  : "plan-stage"
              }
              key={m.id}
              open={m.id === currentMilestone(s, g)?.id}
            >
              <summary>
                <span className="stage-number">{i + 1}</span>
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
                        ? "Current milestone"
                        : "Upcoming"}
                  </small>
                  <strong>{m.title}</strong>
                </span>
              </summary>
              <p>{m.criterion}</p>
              <p className="small">
                {displaySchedule(m.localDate, m.localTime)}
              </p>
              {pendingSteps(s, g)
                .filter((e) => e.data.milestoneId === m.id)
                .map((e) => (
                  <div key={e.id}>
                    <p>{e.data.action}</p>
                    <button
                      className="quiet"
                      onClick={() =>
                        navigate("/commitment/" + g.id + "/" + e.data.stepId)
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
                  <div className="plan-step-row" key={c.id}>
                    {definition(s, c.id, c.revision)?.action} ·{" "}
                    {c.state === "active"
                      ? g.status === "paused"
                        ? "Paused · date retained"
                        : "Scheduled"
                      : c.state === "cancelled"
                        ? "Ended without a check-in"
                        : "Check-in recorded"}
                    <small className="step-metadata">
                      {displaySchedule(
                        currentSchedule(s, c.id)?.local_date,
                        currentSchedule(s, c.id)?.local_time,
                      )}{" "}
                      · {repeatLabel(c.recurrence)}
                    </small>
                    <button
                      className="button secondary"
                      onClick={() => navigate("/revise/" + g.id + "/" + c.id)}
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
        </section>
      )}
      {section === "overview" ? (
        <div className="member-rows">
          <button
            disabled={["completed", "changed_direction", "abandoned"].includes(
              g.status,
            )}
            onClick={() => navigate("/add-milestone/" + g.id)}
          >
            Add milestone
          </button>
          <button
            disabled={["completed", "changed_direction", "abandoned"].includes(
              g.status,
            )}
            onClick={() => navigate("/add-step/" + g.id)}
          >
            Add step
          </button>
          <button onClick={() => setSection("preparation")}>
            My preparation
          </button>
          <button onClick={() => navigate("/milestone/" + g.id)}>
            Milestones ·{" "}
            {g.milestones.length
              ? m?.title || "All completed"
              : "None planned yet"}
          </button>
          {g.status === "draft" && !currentAction(s, g.id) && (
            <button onClick={() => navigate("/plan/" + g.id)}>
              Complete my preparation
            </button>
          )}
          {!["completed", "changed_direction", "abandoned"].includes(
            g.status,
          ) && (
            <button onClick={() => navigate("/decision/" + g.id)}>
              Pause, return or complete
            </button>
          )}
          <button onClick={() => navigate("/wallpaper/" + g.id)}>
            Create wallpaper
          </button>

          {g.status !== "draft" && (
            <button onClick={() => navigate("/history")}>
              Agreements and revisions
            </button>
          )}
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
          {g.milestones.map((m) => (
            <div className="first-proof" key={m.id}>
              <h3>{m.title}</h3>
              <p>{m.criterion}</p>
              <p className="small">
                {displaySchedule(m.localDate, m.localTime)} · {m.timeZone}
              </p>
            </div>
          ))}
        </>
      )}
    </Page>
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
  const goals = s.goals.filter((g) => filter === "all" || g.status === filter);
  return (
    <Page
      title="Your Proof."
      sub="What you’ve done. What you’re becoming."
      back={() => navigate("/app")}
    >
      <label>
        Show
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All challenges</option>
          <option value="active">Current challenges</option>
          <option value="completed">Completed challenges</option>
          <option value="paused">Paused challenges</option>
          <option value="draft">Preparing</option>
        </select>
      </label>
      {!s.evidence.length &&
        !s.events.some(
          (e) =>
            e.kind === "milestone" ||
            e.kind === "milestone_attempt" ||
            (e.kind === "status" && e.data.to === "completed"),
        ) && <p>No Proof yet.</p>}
      {goals.map((g) =>
        g.status === "completed" ? (
          <button
            key={g.id}
            className="accomplishment-card"
            onClick={() => navigate("/proof/challenge/" + g.id)}
          >
            <span className="section-label">Challenge completed</span>
            <strong>{g.words}</strong>
            <p>
              {completedEvent(s, g.id)?.data.detail ||
                "Your saved accomplishment"}
            </p>
            <span>Revisit what changed →</span>
          </button>
        ) : (
          <section className="proof-group" key={g.id}>
            <h2>{g.words}</h2>
            {g.vision && <p className="small">Who I am becoming: {g.vision}</p>}
            {s.evidence
              .filter((e) => e.goal_id === g.id)
              .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
              .map((e) => {
                const r = currentReport(s, e.id, e.revision),
                  d = definition(s, e.commitment_id, e.commitment_revision);
                return (
                  <button
                    className="experience-choice proof-card"
                    key={e.id}
                    onClick={() => navigate("/proof/" + e.id)}
                  >
                    <span>
                      <small className="section-label">Step check-in</small>
                      <strong>{d?.action}</strong>
                      <small style={{ display: "block" }}>
                        <span className={"result-badge result-" + r?.result}>
                          {r && resultLabel[r.result]}
                        </span>{" "}
                        · {displayDate(e.recorded_at)}
                      </small>
                    </span>
                  </button>
                );
              })}
            {s.events
              .filter(
                (e) =>
                  e.goal_id === g.id &&
                  ["milestone", "milestone_attempt", "status"].includes(e.kind),
              )
              .map((e) => (
                <div className="first-proof" key={e.id}>
                  <p>{e.data.detail}</p>
                  <p className="small">
                    {e.kind === "milestone"
                      ? "Milestone completed"
                      : e.kind === "milestone_attempt"
                        ? "Milestone attempted"
                        : e.data.to}{" "}
                    · {displayDate(e.recorded_at)}
                  </p>
                </div>
              ))}
          </section>
        ),
      )}
    </Page>
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
              Return to Basecamp
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
