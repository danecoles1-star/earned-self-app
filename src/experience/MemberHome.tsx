import plus from "../assets/icons/plus.svg";
import { completedProgress } from "./progress";
import { WallpaperCard } from "./WallpaperCard";
import { useEffect } from "react";
import { Paused } from "./Paused";
import { displaySchedule } from "../data/time";
import { repeatLabel } from "../data/recurrence";
import { artFor } from "./workshopArt";
import homeIcon from "../assets/workshop/nav-now.png";
import planIcon from "../assets/workshop/nav-plan.png";
import proofIcon from "../assets/workshop/nav-proof.png";
import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
} from "../data/domain";
import { StepTimer, pauseTimer } from "./StepTimer";
import { Stage, Landscape } from "./Stage";

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
    <Stage
      title="Now"
      tone="focus"
      navigate={navigate}
      hero={
        <section
          className="stage-hero now-hero"
          aria-label="Your next step and progress"
        >
          {goal.vision && (
            <section className="identity-reminder">
              <span className="section-label">Who I am becoming</span>
              <p>{goal.vision}</p>
            </section>
          )}
          <button
            className="quiet hero-challenge"
            onClick={() => navigate("/manage")}
          >
            <span className="visually-hidden">Challenge: </span>
            {goal.words}
          </button>
          <div className="hero-progress">
            <p className="completed-step-count">
              {completedProgress(snapshot, [goal.id]).steps} steps completed
            </p>
            <span className="section-label">
              {ended
                ? "Your recorded work"
                : paused
                  ? "Your saved step"
                  : "Current step"}
            </span>
            <h2>
              {ended
                ? goal.status === "completed"
                  ? "Challenge completed"
                  : "Your Proof stays with you"
                : d?.action || "Choose your next step"}
            </h2>
          </div>
        </section>
      }
    >
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
                title={d.action}
                identity={`${goal.owner_id}:${c.id}:${c.revision}`}
                schedule={
                  time &&
                  displaySchedule(
                    time.local_date,
                    time.local_time,
                    time.time_zone,
                  )
                }
              />
              <button
                className="button secondary focus-check-in"
                onClick={checkIn}
              >
                Step check-in
              </button>
            </>
          ) : (
            <>
              <h2>{d.action}</h2>
              <p>{d.criterion}</p>
              <p>Resume when you’re ready. Your next step is saved.</p>
            </>
          )}
          {time && !time.local_time && (
            <p role="status">
              This session needs a time because the clock changes. Choose Revise
              this step below.
            </p>
          )}
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
      {!ended && (
        <div
          className="plan-create-actions now-create-actions"
          aria-label="Add to your plan"
        >
          <button
            className="add-control"
            onClick={() => navigate("/add-step/" + goal.id)}
          >
            <img src={plus} alt="" />
            Add step
          </button>
          <button
            className="add-control"
            onClick={() => navigate("/add-milestone/" + goal.id)}
          >
            <img src={plus} alt="" />
            Add milestone
          </button>
        </div>
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
      </div>
      {c && d && !ended && (
        <section className="stage-details" aria-label="Step details & calendar">
          <h3>Step details & calendar</h3>
          {milestone && (
            <p className="step-milestone-context">
              Milestone:{" "}
              <button
                className="quiet"
                onClick={() => navigate("/milestone/" + goal.id)}
              >
                {milestone.title}
              </button>
            </p>
          )}
          {time?.starts_at &&
            new Date(time.starts_at).getTime() < Date.now() && (
              <p className="notice">
                This scheduled time has passed. Check in on what happened, or
                revise the next session.
              </p>
            )}
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
        </section>
      )}
      <WallpaperCard goal={goal} navigate={navigate} />
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
        ["/app", "Now", homeIcon],
        ["/manage", "Plan", planIcon],
        ["/proof", "Proof", proofIcon],
      ].map(([href, label, icon]) => (
        <button
          key={href}
          className={href === "/app" ? "nav-now" : undefined}
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
