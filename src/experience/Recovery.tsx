import type { Snapshot } from "../data/types";
import { currentAction, currentReport, definition } from "../data/domain";
import { Page } from "./ui";
export function Recovery({
  snapshot: s,
  id,
  navigate,
}: {
  snapshot: Snapshot;
  id: string;
  navigate: (p: string) => void;
}) {
  const e = s.evidence.find((e) => e.id === id)!;
  const report = currentReport(s, e.id, e.revision);
  const previous = s.commitments.find((c) => c.id === e.commitment_id);
  const g = s.goals.find((g) => g.id === e.goal_id)!;
  const next = previous?.series_id
    ? s.commitments.find(
        (c) =>
          c.goal_id === g.id &&
          c.series_id === previous.series_id &&
          c.state === "active",
      )
    : currentAction(s, g.id);
  return (
    <Page
      title="Make room for progress."
      sub="Your check-in is saved. Your plan hasn’t changed."
      dark={false}
      back={() => navigate("/proof/" + id)}
      footer={
        <>
          <button
            className="button"
            onClick={() =>
              navigate(
                next
                  ? "/revise/" + g.id + "/" + next.id
                  : g.status === "draft"
                    ? "/plan/" + g.id
                    : "/commitment/" + g.id,
              )
            }
          >
            {next ? "Adjust my next step" : "Plan my next step"}
          </button>
          <button className="button secondary" onClick={() => navigate("/app")}>
            Keep my plan
          </button>
          {report?.reflection === "Ready to review my milestone" && (
            <button
              className="quiet"
              onClick={() => navigate("/milestone/" + g.id)}
            >
              Review my milestone
            </button>
          )}
        </>
      }
    >
      <section className="reflection-answer">
        <h2>Your adjustment</h2>
        <p>{report?.adjustment || "You can decide what to change next."}</p>
      </section>
      {next && (
        <section className="reflection-answer">
          <h2>Your next step</h2>
          <p>{definition(s, next.id, next.revision)?.action}</p>
        </section>
      )}
      <p>
        Choose whether to revise the action, what done means, or its time.
        Nothing changes until you save.
      </p>
      {next?.recurrence && (
        <p className="small">
          You’ll choose one occurrence or future repetitions.
        </p>
      )}
    </Page>
  );
}
