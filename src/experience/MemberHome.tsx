import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
} from "../data/domain";
import { Art, Page } from "./ui";
export function MemberHome({
  goal,
  snapshot,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const c = currentAction(snapshot, goal.id),
    d = c && definition(snapshot, c.id, c.revision),
    time = c && currentSchedule(snapshot, c.id),
    milestone = currentMilestone(snapshot, goal);
  const done = goal.status === "completed";
  return (
    <Page
      title={done ? "You did the work." : "Your next move."}
      sub={
        done
          ? "Let this accomplishment stand."
          : "Keep the larger ambition in view."
      }
      footer={
        <>
          <button
            className="button"
            onClick={() =>
              navigate(
                done
                  ? "/proof"
                  : goal.status === "draft"
                    ? "/plan/" + goal.id
                    : c
                      ? "/focus/" + goal.id
                      : "/commitment/" + goal.id,
              )
            }
          >
            {done
              ? "See my journey"
              : goal.status === "draft"
                ? "Prepare my ambition"
                : c
                  ? "Begin my move"
                  : "Choose my next move"}
          </button>
          <nav className="bottom-navigation" aria-label="Main navigation">
            <button
              className="quiet"
              onClick={() => navigate("/app")}
              aria-current="page"
            >
              Now
            </button>
            <button className="quiet" onClick={() => navigate("/manage")}>
              Ambition
            </button>
            <button className="quiet" onClick={() => navigate("/proof")}>
              Proof
            </button>
            <button className="quiet" onClick={() => navigate("/settings")}>
              Settings
            </button>
          </nav>
        </>
      }
    >
      {done ? (
        <>
          <Art kind="mountain" />
          <button className="button" onClick={() => navigate("/start")}>
            Choose my next ambition
          </button>
        </>
      ) : (
        <>
          <p className="small">Who I am becoming</p>
          <h2>{goal.vision || "Give your ambition a direction."}</h2>
          <p>{goal.words}</p>
          <div className="member-rows">
            <button onClick={() => navigate("/manage")}>
              <span>Your ambition</span>
              <strong>{milestone?.title || goal.words}</strong>
            </button>
            <button
              onClick={() =>
                navigate(c ? "/focus/" + goal.id : "/commitment/" + goal.id)
              }
            >
              <span>Current commitment</span>
              <strong>{d?.action || "Choose the next move"}</strong>
            </button>
            <button onClick={() => navigate("/commitment/" + goal.id)}>
              <span>When & where</span>
              <strong>
                {time
                  ? `${time.local_date} · ${time.local_time?.slice(0, 5)} · ${time.time_zone}`
                  : "Give your move a place"}
              </strong>
            </button>
            <button onClick={() => navigate("/proof")}>
              <span>Relevant Proof</span>
              <strong>
                {snapshot.evidence.filter((e) => e.goal_id === goal.id).length}{" "}
                recorded{" "}
                {snapshot.evidence.filter((e) => e.goal_id === goal.id)
                  .length === 1
                  ? "account"
                  : "accounts"}
              </strong>
            </button>
          </div>
        </>
      )}
      <button
        className="quiet"
        onClick={() => navigate("/wallpaper/" + goal.id)}
      >
        Take this with me
      </button>
      {c && (
        <button
          className="quiet"
          onClick={() => navigate("/calendar/" + goal.id)}
        >
          Add my move to a calendar
        </button>
      )}
    </Page>
  );
}
