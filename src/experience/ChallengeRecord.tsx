import type { Goal, Snapshot } from "../data/types";
import { resultLabel } from "../data/types";
import { currentReport, definition } from "../data/domain";
import { displayDate } from "../data/time";
import { Stage, Landscape } from "./Stage";
export function completedEvent(s: Snapshot, id: string) {
  return s.events
    .filter(
      (e) =>
        e.goal_id === id && e.kind === "status" && e.data.to === "completed",
    )
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
}
export function completionRecord(s: Snapshot, g: Goal) {
  const event = completedEvent(s, g.id);
  const history = s.goalHistory
    .filter((h) => h.goal_id === g.id)
    .sort((a, b) => a.revision - b.revision);
  const original = history[0];
  const completed =
    history.find((h) => String(h.revision) === event?.data.goalRevision) ||
    history.filter((h) => event && h.recorded_at <= event.recorded_at).at(-1) ||
    g;
  return { event, original, completed };
}
export function ChallengeRecord({
  goal: g,
  snapshot: s,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const { event, original, completed } = completionRecord(s, g);
  const field = (label: string, value?: string) => (
    <section className="reflection-answer">
      <h2>{label}</h2>
      <p>{value?.trim() || "Not recorded in this earlier entry."}</p>
    </section>
  );
  return (
    <Stage
      title="Your Proof"
      tone="completed"
      navigate={navigate}
      back={() => navigate("/proof")}
    >
      <section className="accomplishment-summary">
        <span className="section-label">
          Challenge completed
          {event ? " · " + displayDate(event.recorded_at.slice(0, 10)) : ""}
        </span>
        <h2>{completed.words}</h2>
        <p>Done meant: {completed.outcome || "Criterion not recorded."}</p>
      </section>
      <Landscape scene="completed" />
      <div className="transformation-highlight">
        {field("What changed", event?.data.reflection)}
        {field("What you’ll carry forward", event?.data.next)}
      </div>
      <button className="button" onClick={() => navigate("/new")}>
        Choose my next challenge
      </button>
      <section
        className="transformation-details"
        aria-label="Your full transformation record"
      >
        <p className="vision-distinction">
          Your vision describes who you wanted to become. Your reflections below
          describe what you recorded.
        </p>
        {field(
          original ? "Your original vision" : "Your saved vision",
          original?.vision ?? g.vision,
        )}
        {field("What actually happened", event?.data.detail)}
      </section>
      <details className="supporting-proof">
        <summary>Steps and milestone attempts</summary>
        <p className="small">
          The full path includes completed work, missed steps, and attempts.
        </p>
        {s.evidence
          .filter((e) => e.goal_id === g.id)
          .map((e) => {
            const r = currentReport(s, e.id, e.revision);
            return (
              <button
                className="proof-row"
                key={e.id}
                onClick={() => navigate("/proof/" + e.id)}
              >
                <strong>
                  {definition(s, e.commitment_id, e.commitment_revision)
                    ?.action || "Earlier step"}
                </strong>
                <small>
                  {r ? resultLabel[r.result] : "Earlier check-in"} ·{" "}
                  {displayDate(e.recorded_at.slice(0, 10))}
                </small>
              </button>
            );
          })}
        {s.events
          .filter(
            (e) =>
              e.goal_id === g.id &&
              ["milestone", "milestone_attempt"].includes(e.kind),
          )
          .map((e) => (
            <section className="reflection-answer" key={e.id}>
              <h3>
                {e.kind === "milestone"
                  ? "Milestone completed"
                  : "Milestone attempted"}
              </h3>
              <p>
                {g.milestones.find((m) => m.id === e.data.milestoneId)?.title}
              </p>
              <p>{e.data.detail}</p>
            </section>
          ))}
        {!s.evidence.some((e) => e.goal_id === g.id) &&
          !s.events.some(
            (e) =>
              e.goal_id === g.id &&
              ["milestone", "milestone_attempt"].includes(e.kind),
          ) && <p>No supporting entries were recorded.</p>}
      </details>
      <div className="record-next">
        <button className="quiet" onClick={() => navigate("/proof")}>
          Return to Your Proof
        </button>
      </div>
    </Stage>
  );
}
