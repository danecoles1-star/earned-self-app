import { useEffect } from "react";
import { Paused } from "./Paused";
import { displaySchedule } from "../data/time";
import { repeatLabel } from "../data/recurrence";
import { artwork } from "./ui";
import homeIcon from "../assets/icons/earned-basecamp.svg";
import planIcon from "../assets/icons/earned-plan.svg";
import proofIcon from "../assets/icons/earned-proof.svg";
import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
} from "../data/domain";
import { StepTimer, pauseTimer } from "./StepTimer";
import { Stage } from "./Stage";

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
  const ended = ["completed", "changed_direction", "abandoned"].includes(
      goal.status,
    ),
    paused = goal.status === "paused";
  useEffect(() => {
    if (!paused) return;
    const event = snapshot.events
      .filter(
        (e) =>
          e.goal_id === goal.id &&
          e.kind === "status" &&
          e.data.to === "paused",
      )
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
    snapshot.commitments
      .filter((c) => c.goal_id === goal.id && c.state === "active")
      .forEach((c) =>
        pauseTimer(
          `${goal.owner_id}:${c.id}:${c.revision}`,
          event ? new Date(event.recorded_at).getTime() : Date.now(),
        ),
      );
  }, [paused, goal.id, goal.owner_id, snapshot.commitments, snapshot.events]);
  const checkIn = () => {
    if (!c) return;
    pauseTimer(`${goal.owner_id}:${c.id}:${c.revision}`);
    navigate("/report/" + goal.id);
  };
  return (
    <Stage title="Basecamp" tone="focus" navigate={navigate}>
      {goal.vision && (
        <section className="identity-reminder">
          <span className="section-label">Who I am becoming</span>
          <p>{goal.vision}</p>
        </section>
      )}
      <div className="stage-context">
        <button className="quiet" onClick={() => navigate("/manage")}>
          <span>Challenge</span> {goal.words}
          <span aria-hidden="true"> ›</span>
        </button>
        {milestone && !ended && (
          <button
            className="quiet milestone-context"
            onClick={() => navigate("/milestone/" + goal.id)}
          >
            {milestone.title}
            <span aria-hidden="true"> ›</span>
          </button>
        )}
      </div>
      {paused && <Paused goal={goal} navigate={navigate} />}
      {ended ? (
        <section className="stage-ended">
          <h2>
            {goal.status === "completed"
              ? "You did the work."
              : "Keep becoming."}
          </h2>
          <p>
            {goal.status === "completed"
              ? "Revisit what changed and what you’ll carry forward."
              : "Your recorded work stays in Proof."}
          </p>
          <button
            className="button"
            onClick={() =>
              navigate(
                goal.status === "completed"
                  ? "/proof/challenge/" + goal.id
                  : "/proof",
              )
            }
          >
            {goal.status === "completed"
              ? "Revisit your accomplishment"
              : "View your Proof"}
          </button>
          <button className="button secondary" onClick={() => navigate("/new")}>
            Choose my next challenge
          </button>
        </section>
      ) : c && d ? (
        <section className="focus-action">
          {!paused ? (
            <>
              <StepTimer
                key={c.id}
                identity={`${goal.owner_id}:${c.id}:${c.revision}`}
              >
                <h2>{d.action}</h2>
                {time && (
                  <span className="timer-schedule">
                    {displaySchedule(
                      time.local_date,
                      time.local_time,
                      time.time_zone,
                    )}
                  </span>
                )}
              </StepTimer>
              <button className="quiet focus-check-in" onClick={checkIn}>
                Step check-in <span aria-hidden="true">›</span>
              </button>
            </>
          ) : (
            <>
              <h2>{d.action}</h2>
              <p>Resume when you’re ready. Your next step is saved.</p>
            </>
          )}
          {time && !time.local_time && (
            <p role="status">
              This session needs a time because the clock changes. Open Step
              details & calendar to revise it.
            </p>
          )}
          <details className="stage-details">
            <summary>Step details & calendar</summary>
            <p>{d.action}</p>
            <p>Done means: {d.criterion}</p>
            <p>{repeatLabel(c.recurrence)}</p>
            {time && (
              <button
                className="button secondary"
                onClick={() => navigate("/calendar/" + goal.id)}
              >
                {displaySchedule(
                  time.local_date,
                  time.local_time,
                  time.time_zone,
                )}{" "}
                · Add to calendar
              </button>
            )}

            <button
              className="button secondary"
              onClick={() => navigate("/revise/" + goal.id)}
            >
              Revise this step
            </button>
          </details>
        </section>
      ) : (
        <section className="stage-ended">
          <h2>
            {goal.status === "draft"
              ? "Prepare for something big."
              : "Choose your next step."}
          </h2>
          <button
            className="button"
            onClick={() =>
              navigate(
                (goal.status === "draft" ? "/plan/" : "/add-step/") + goal.id,
              )
            }
          >
            {goal.status === "draft" ? "Continue preparation" : "Add a step"}
          </button>
        </section>
      )}
      <div className="stage-secondary-links">
        <button className="quiet" onClick={() => navigate("/manage")}>
          View my plan ›
        </button>
        <button
          className="quiet"
          aria-label="Why & obstacles"
          onClick={() => navigate("/manage/why")}
        >
          Why & obstacles ›
        </button>
        {!ended && (
          <button
            className="quiet"
            onClick={() => navigate("/add-step/" + goal.id)}
          >
            Add step ›
          </button>
        )}
      </div>
      <button
        className="wallpaper-card"
        onClick={() => navigate("/wallpaper/" + goal.id)}
      >
        <img src={artwork.mountain} alt="" />
        <span>
          <strong>Take your vision with you</strong>
          <small>Create wallpaper →</small>
        </span>
      </button>
    </Stage>
  );
}
export function AppNavigation({
  path,
  navigate,
}: {
  path: string;
  navigate: (p: string) => void;
}) {
  return (
    <nav className="app-tabs" aria-label="Main navigation">
      {[
        ["/app", "Basecamp", homeIcon],
        ["/manage", "Plan", planIcon],
        ["/proof", "Proof", proofIcon],
      ].map(([href, label, icon]) => (
        <button
          key={href}
          aria-current={
            path === href || (href !== "/app" && path.startsWith(href + "/"))
              ? "page"
              : undefined
          }
          onClick={() => navigate(href)}
        >
          <img src={icon} alt="" />
          {label}
        </button>
      ))}
    </nav>
  );
}
