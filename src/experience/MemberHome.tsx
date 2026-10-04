import { useEffect } from "react";
import { Paused } from "./Paused";
import { displaySchedule } from "../data/time";
import { repeatLabel } from "../data/recurrence";
import { artwork } from "./ui";
import homeIcon from "../assets/icons/earned-basecamp.svg";
import planIcon from "../assets/icons/earned-plan.svg";
import proofIcon from "../assets/icons/earned-proof.svg";
import accountIcon from "../assets/icons/user-round.svg";
import { pendingSteps } from "./PlanStep";
import type { Goal, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
} from "../data/domain";
import { Brand } from "../components/Brand";
import { StepTimer, pauseTimer } from "./StepTimer";
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
  );

  const paused = goal.status === "paused";
  useEffect(() => {
    if (paused) {
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
    }
  }, [paused, goal.id, goal.owner_id, snapshot.commitments, snapshot.events]);
  const addStep = () =>
    navigate(
      goal.status === "draft" ? "/plan/" + goal.id : "/commitment/" + goal.id,
    );
  return (
    <div className="basecamp">
      <header className="basecamp-header">
        <Brand mineral />
        <button
          className="quiet account-button"
          aria-label="Account"
          onClick={() => navigate("/settings")}
        >
          <img src={accountIcon} alt="" />
        </button>
      </header>
      <main id="main" className="basecamp-main">
        <section className="challenge-heading">
          <div className="section-label">
            Your challenge{" "}
            <button className="quiet" onClick={() => navigate("/manage/why")}>
              Why & obstacles
            </button>
          </div>
          <h1 tabIndex={-1}>{goal.words}</h1>
          {goal.vision && (
            <>
              <span className="section-label">Who I am becoming</span>
              <p className="vision">{goal.vision}</p>
            </>
          )}
          {ended && (
            <p>
              {goal.status === "completed"
                ? "Challenge completed. Take your learning forward."
                : "This challenge has ended. Your Proof stays."}
            </p>
          )}
        </section>
        {paused && <Paused goal={goal} navigate={navigate} />}
        {goal.status === "completed" && (
          <button
            className="accomplishment-card"
            onClick={() => navigate("/proof/challenge/" + goal.id)}
          >
            <strong>Revisit your accomplishment</strong>
            <span>What changed. What you’ll carry forward. →</span>
          </button>
        )}
        <section className="milestone-summary">
          <div className="section-label">
            Current milestone
            <button
              className="quiet"
              onClick={() =>
                navigate(
                  milestone
                    ? "/milestone/" + goal.id
                    : ended
                      ? "/new"
                      : "/plan/" + goal.id,
                )
              }
            >
              {milestone
                ? "Review milestone"
                : ended
                  ? "Start a new challenge"
                  : "Plan my milestone"}
            </button>
          </div>
          <h2>
            {milestone?.title ||
              (ended ? "Your next chapter" : "Choose your first milestone")}
          </h2>
          {milestone && (
            <p className="small">
              {displaySchedule(
                milestone.localDate,
                milestone.localTime,
                milestone.timeZone,
              )}
            </p>
          )}
        </section>
        <section className="current-step">
          <div className="section-label">
            {c ? "Current step" : "Your next step"}
            {c && !paused && (
              <button
                className="quiet"
                onClick={() => {
                  pauseTimer(`${goal.owner_id}:${c.id}:${c.revision}`);
                  navigate("/report/" + goal.id);
                }}
              >
                Step check-in
              </button>
            )}
          </div>
          <h2>
            {d?.action ||
              (ended
                ? "Keep becoming."
                : goal.status === "draft"
                  ? "Prepare for something big."
                  : "Choose your next step.")}
          </h2>
          {d && <p>Done means: {d.criterion}</p>}
          {time && (
            <button
              className="schedule-link"
              onClick={() => navigate("/calendar/" + goal.id)}
            >
              {displaySchedule(
                time.local_date,
                time.local_time,
                time.time_zone,
              )}
              <small>Add to calendar</small>
            </button>
          )}
          {c && time && !time.local_time && (
            <p role="status">
              This session needs a time because the clock changes.{" "}
              <button
                className="button"
                onClick={() => navigate("/revise/" + goal.id)}
              >
                Choose session time
              </button>
            </p>
          )}
          {paused ? (
            <p>Resume when you’re ready. Your next step is saved.</p>
          ) : c && d ? (
            <>
              <p className="small">{repeatLabel(c.recurrence)}</p>
              <StepTimer
                key={c.id}
                identity={`${goal.owner_id}:${c.id}:${c.revision}`}
              />
              <button
                className="button secondary"
                onClick={() => {
                  pauseTimer(`${goal.owner_id}:${c.id}:${c.revision}`);
                  navigate("/report/" + goal.id);
                }}
              >
                Finish session
              </button>
            </>
          ) : (
            <>
              <p>
                {goal.status === "draft"
                  ? "Define the finish, plan for obstacles, and choose your first milestone."
                  : "Choose one preparation action and give it a date and time."}
              </p>
              <button
                className="button"
                onClick={ended ? () => navigate("/new") : addStep}
              >
                {ended
                  ? "Choose my next challenge"
                  : goal.status === "draft"
                    ? "Continue preparation"
                    : "Add a step"}
              </button>
            </>
          )}
        </section>
        <section className="basecamp-path">
          <div className="section-label">
            Your path{" "}
            <button
              className="quiet"
              disabled={ended}
              onClick={() => navigate("/add-milestone/" + goal.id)}
            >
              Add milestone
            </button>
          </div>
          {!goal.milestones.length && (
            <p>Your milestones will appear here as you plan them.</p>
          )}
          <p className="small">
            {pendingSteps(snapshot, goal).length +
              snapshot.commitments.filter(
                (step) =>
                  step.goal_id === goal.id &&
                  step.state === "active" &&
                  step.id !== c?.id,
              ).length}{" "}
            {pendingSteps(snapshot, goal).length +
              snapshot.commitments.filter(
                (step) =>
                  step.goal_id === goal.id &&
                  step.state === "active" &&
                  step.id !== c?.id,
              ).length ===
            1
              ? "step"
              : "steps"}{" "}
            planned ahead
          </p>
          <ol>
            {goal.milestones.map((m) => {
              const complete = snapshot.events.some(
                (e) =>
                  e.goal_id === goal.id &&
                  e.kind === "milestone" &&
                  e.data.milestoneId === m.id,
              );
              return (
                <li
                  key={m.id}
                  className={m.id === milestone?.id ? "current" : ""}
                >
                  <button onClick={() => navigate("/manage")}>
                    <strong>{m.title}</strong>
                    <small>
                      {complete
                        ? "Completed"
                        : m.id === milestone?.id
                          ? "Current milestone"
                          : "Ahead"}
                    </small>
                  </button>
                  {m.id === milestone?.id && d && (
                    <p className="path-step">{d.action}</p>
                  )}
                </li>
              );
            })}
          </ol>
          {!ended && (
            <button
              className="button secondary"
              onClick={() => navigate("/add-step/" + goal.id)}
            >
              Add step
            </button>
          )}
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
        </section>
      </main>
    </div>
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
