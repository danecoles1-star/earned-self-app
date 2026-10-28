import { useState } from "react";
import { Paused } from "./Paused";
import homeIcon from "../assets/workshop/nav-now.png";
import planIcon from "../assets/workshop/nav-plan.png";
import proofIcon from "../assets/workshop/nav-proof.png";
import physicalIllustration from "../assets/illustrations/illo-physical.webp";
import professionalIllustration from "../assets/illustrations/illo-professional.webp";
import personalIllustration from "../assets/illustrations/illo-personal.webp";
import { wallpapers } from "./wallpapers";
import type { Goal, GrowthArea, Snapshot } from "../data/types";
import { currentAction, currentMilestone, definition } from "../data/domain";
import { pendingSteps } from "./PlanStep";
import { Stage } from "./Stage";

// Artwork is presentation; challenge and step copy must come from saved data.
const illustrations: Record<GrowthArea, string> = {
  physical: physicalIllustration,
  professional: professionalIllustration,
  personal: personalIllustration,
};

export function MemberHome({
  goal,
  snapshot,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const illustration = illustrations[goal.area || "physical"];
  const commitment = currentAction(snapshot, goal.id);
  const currentDefinition =
    commitment && definition(snapshot, commitment.id, commitment.revision);
  const milestone = currentMilestone(snapshot, goal);
  const next = pendingSteps(snapshot, goal)[0];
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    goal.status,
  );
  const currentStep = currentDefinition?.action || "Prepare your next step";
  const nextStep = next?.data.action;
  const nextCriterion =
    next?.data.criterion ||
    "Finish this step with clear evidence you can record.";
  const nextMilestone =
    goal.milestones.find((item) => item.id === next?.data.milestoneId) ||
    milestone;
  const recurring = Boolean(commitment?.recurrence);

  return (
    <Stage
      title="Now"
      tone="focus"
      navigate={navigate}
      hero={
        <section className="stage-hero now-hero" aria-label="Your direction">
          <section className="identity-reminder">
            <span className="section-label">Who I am becoming</span>
            <p>{goal.vision || "Give your direction a name."}</p>
          </section>
          <button
            className="quiet hero-challenge"
            onClick={() => navigate("/manage")}
          >
            <span className="visually-hidden">Challenge: </span>
            {goal.words || "Your challenge"}
          </button>
        </section>
      }
    >
      {goal.status === "paused" && <Paused goal={goal} navigate={navigate} />}
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
      ) : (
        <>
          <section
            className={`redesign-now-panel${currentStep.length > 85 ? " long-step" : ""}`}
            aria-labelledby="today-step"
          >
            <span className="now-kicker">Now · Today&apos;s step</span>
            <h2 id="today-step">{currentStep}</h2>
            <span className="now-divider" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <button
              className="begin-button"
              disabled={goal.status === "paused"}
              aria-expanded={sessionOpen}
              aria-controls="prepared-session"
              onClick={() => setSessionOpen((open) => !open)}
            >
              Begin
            </button>
          </section>

          {sessionOpen && goal.status !== "paused" && (
            <section
              id="prepared-session"
              className="prepared-session"
              aria-labelledby="prepared-session-title"
            >
              <span className="section-label">Prepared activity</span>
              <h2 id="prepared-session-title">{currentStep}</h2>
              <p className="activity-duration">About 25 minutes</p>
              <p>
                Settle into one focused attempt. Start with the smallest clear
                action, notice what changes, and stop when you have honest
                evidence to record.
              </p>
              <p className="session-note">
                This is illustrative prepared guidance. Live AI preparation is a
                separate workstream.
              </p>
              <button
                className="button"
                onClick={() =>
                  navigate(
                    commitment ? "/report/" + goal.id : "/plan/" + goal.id,
                  )
                }
              >
                {commitment ? "Check in honestly" : "Continue preparation"}
              </button>
              <button
                className="quiet session-close"
                onClick={() => setSessionOpen(false)}
              >
                Close prepared activity
              </button>
            </section>
          )}

          <section
            className="next-step-section"
            aria-labelledby="next-step-title"
          >
            <span className="section-label">Next Step</span>
            <h2 id="next-step-title">
              {nextStep || "Your next step is not prepared yet."}
            </h2>
            {next && nextMilestone && (
              <p className="next-step-context">
                Milestone: {nextMilestone.title}
              </p>
            )}
            {next && (
              <p className="next-step-criterion">Done means: {nextCriterion}</p>
            )}
            {!next && (
              <p className="next-step-criterion">
                Your plan will show the next step once it has been prepared.
              </p>
            )}
            {next && recurring && (
              <p className="recurring-note">
                This recurring step already carries its schedule.
              </p>
            )}
            {(next || commitment) && (
              <div className="next-step-actions">
                {next && !recurring && (
                  <button
                    className="button secondary"
                    onClick={() => navigate("/commitment/" + goal.id)}
                  >
                    Schedule this step
                  </button>
                )}
                {!next && (
                  <p className="next-step-context">
                    Keep your current step in your calendar.
                  </p>
                )}
                <button
                  className="button secondary"
                  onClick={() => navigate("/calendar/" + goal.id)}
                >
                  Add to calendar
                </button>
              </div>
            )}
          </section>

          <section
            className="redesign-wallpaper"
            aria-labelledby="wallpaper-title"
          >
            <span className="section-label">Wallpaper</span>
            <h2 id="wallpaper-title">Take your vision with you.</h2>
            <figure className="wallpaper-feature">
              <img className="featured-wallpaper" src={illustration} alt="" />
              {goal.vision && <figcaption>{goal.vision}</figcaption>}
            </figure>
            <button
              className="button secondary create-wallpaper"
              aria-expanded={wallpaperOpen}
              aria-controls="wallpaper-sheet"
              onClick={() => setWallpaperOpen((open) => !open)}
            >
              {wallpaperOpen ? "Hide wallpapers" : "Create wallpaper"}
            </button>
            {wallpaperOpen && (
              <section
                id="wallpaper-sheet"
                className="wallpaper-sheet"
                aria-label="Wallpaper variations"
              >
                <header>
                  <h3>Choose a wallpaper</h3>
                  <button
                    className="quiet"
                    onClick={() => setWallpaperOpen(false)}
                  >
                    Close
                  </button>
                </header>
                <div className="wallpaper-grid">
                  {wallpapers.map(([src, label], index) => (
                    <button
                      key={label}
                      className="wallpaper-tile"
                      aria-label={`Use ${label} wallpaper`}
                      onClick={() =>
                        navigate("/wallpaper/" + goal.id + "/tile/" + index)
                      }
                    >
                      <img src={src} alt="" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </section>
        </>
      )}
      {ended && (
        <section
          className="redesign-wallpaper"
          aria-labelledby="wallpaper-title"
        >
          <span className="section-label">Wallpaper</span>
          <h2 id="wallpaper-title">Take your vision with you.</h2>
          <img className="featured-wallpaper" src={illustration} alt="" />
          <button
            className="button secondary create-wallpaper"
            aria-expanded={wallpaperOpen}
            aria-controls="wallpaper-sheet"
            onClick={() => setWallpaperOpen((open) => !open)}
          >
            {wallpaperOpen ? "Hide wallpapers" : "Create wallpaper"}
          </button>
          {wallpaperOpen && (
            <section
              id="wallpaper-sheet"
              className="wallpaper-sheet"
              aria-label="Wallpaper variations"
            >
              <header>
                <h3>Choose a wallpaper</h3>
                <button
                  className="quiet"
                  onClick={() => setWallpaperOpen(false)}
                >
                  Close
                </button>
              </header>
              <div className="wallpaper-grid">
                {wallpapers.map(([src, label], index) => (
                  <button
                    key={label}
                    className="wallpaper-tile"
                    aria-label={`Use ${label} wallpaper`}
                    onClick={() =>
                      navigate("/wallpaper/" + goal.id + "/tile/" + index)
                    }
                  >
                    <img src={src} alt="" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </section>
      )}
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
