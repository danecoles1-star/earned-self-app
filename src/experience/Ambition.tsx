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
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const [section, setSection] = useState("overview"),
    m = currentMilestone(s, g);
  return (
    <Page
      title={section === "preparation" ? "Your preparation." : "Your ambition."}
      sub={g.vision}
      dark={false}
      back={() =>
        section === "overview" ? navigate("/app") : setSection("overview")
      }
      footer={
        <button className="button" onClick={() => navigate("/app")}>
          Return to my next move
        </button>
      }
    >
      <h2>{g.words}</h2>
      <p>{g.outcome}</p>
      {section === "overview" ? (
        <div className="member-rows">
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
            Take it with me
          </button>
          <button onClick={() => navigate("/proof")}>See my Proof</button>
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
                {m.localDate} · {m.localTime} · {m.timeZone}
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
      title="Your Proof stays."
      sub="A record of what you have done and learned."
      back={() => navigate("/app")}
    >
      <label>
        Show
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All ambitions</option>
          <option value="active">Current ambitions</option>
          <option value="completed">Completed ambitions</option>
          <option value="paused">Paused ambitions</option>
          <option value="draft">Preparing</option>
        </select>
      </label>
      {!s.evidence.length && <p>No Proof yet.</p>}
      {goals.map((g) => (
        <section key={g.id}>
          <h2>{g.words}</h2>
          {s.evidence
            .filter((e) => e.goal_id === g.id)
            .map((e) => {
              const r = currentReport(s, e.id, e.revision),
                d = definition(s, e.commitment_id, e.commitment_revision);
              return (
                <button
                  className="experience-choice"
                  key={e.id}
                  onClick={() => navigate("/proof/" + e.id)}
                >
                  <span>
                    {d?.action}
                    <small style={{ display: "block" }}>
                      {r && resultLabel[r.result]} ·{" "}
                      {new Date(e.recorded_at).toLocaleDateString()}
                    </small>
                  </span>
                </button>
              );
            })}
          {s.events
            .filter(
              (e) =>
                e.goal_id === g.id && ["milestone", "status"].includes(e.kind),
            )
            .map((e) => (
              <div className="first-proof" key={e.id}>
                <p>{e.data.detail}</p>
                <p className="small">
                  {e.kind === "milestone" ? "Milestone" : e.data.to} ·{" "}
                  {new Date(e.recorded_at).toLocaleDateString()}
                </p>
              </div>
            ))}
        </section>
      ))}
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
      title={editing ? "Keep the record honest." : "What you did matters."}
      sub={resultLabel[r.result]}
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
              Choose what comes next
            </button>
            <button className="quiet" onClick={() => setEditing(true)}>
              Add reflection or correct this entry
            </button>
          </>
        )
      }
    >
      <h2>{d.action}</h2>
      <p>Done means: {d.criterion}</p>
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
            className="quiet"
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
