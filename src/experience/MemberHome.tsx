import { useState } from "react";
import { Paused } from "./Paused";
import homeIcon from "../assets/workshop/nav-now.png";
import planIcon from "../assets/workshop/nav-plan.png";
import proofIcon from "../assets/workshop/nav-proof.png";
import physicalIllustration from "../assets/illustrations/illo-physical.webp";
import professionalIllustration from "../assets/illustrations/illo-professional.webp";
import personalIllustration from "../assets/illustrations/illo-personal.webp";
import wallpaper01 from "../assets/wallpapers/wp-01-physical-hero.webp";
import wallpaper02 from "../assets/wallpapers/wp-02-physical-crop.webp";
import wallpaper03 from "../assets/wallpapers/wp-03-professional-hero.webp";
import wallpaper04 from "../assets/wallpapers/wp-04-professional-crop.webp";
import wallpaper05 from "../assets/wallpapers/wp-05-personal-hero.webp";
import wallpaper06 from "../assets/wallpapers/wp-06-personal-crop.webp";
import wallpaper07 from "../assets/wallpapers/wp-07-teal-sketched-field.webp";
import wallpaper08 from "../assets/wallpapers/wp-08-halo-on-ivory.webp";
import wallpaper09 from "../assets/wallpapers/wp-09-mineral-paper-texture.webp";
import wallpaper10 from "../assets/wallpapers/wp-10-ink-logo-mark-on-ivory.webp";
import wallpaper11 from "../assets/wallpapers/wp-11-evidence-path-mark-on-ivory.webp";
import wallpaper12 from "../assets/wallpapers/wp-12-deep-teal-field-feathered-edge.webp";
import wallpaper13 from "../assets/wallpapers/wp-13-ivory-graphite-border.webp";
import wallpaper14 from "../assets/wallpapers/wp-14-ink-field-ivory-vignette.webp";
import type { Goal, GrowthArea, Snapshot } from "../data/types";
import { currentAction, currentMilestone, definition } from "../data/domain";
import { pendingSteps } from "./PlanStep";
import { Stage } from "./Stage";

// Illustrative fallbacks copied verbatim from the approved production examples.
// Saved user data always takes precedence when it exists.
const illustrativeAreaContent: Record<
  GrowthArea,
  {
    becoming: string;
    challenge: string;
    nowStep: string;
    nextStep: string;
    illustration: string;
  }
> = {
  physical: {
    becoming: "Be capable of taking on a demanding endurance challenge.",
    challenge: "Complete my first triathlon.",
    nowStep: "Book a coached swim session.",
    nextStep: "Attend the coached swim session.",
    illustration: physicalIllustration,
  },
  professional: {
    becoming: "Be a confident voice in my field.",
    challenge: "Deliver a keynote at an industry conference.",
    nowStep: "Record the first two minutes of my opening.",
    nextStep: "Rehearse the opening with three peers.",
    illustration: professionalIllustration,
  },
  personal: {
    becoming:
      "Become someone who finishes and shares meaningful creative work.",
    challenge: "Finish my novella and share it with three readers.",
    nowStep: "Write the central idea of my story.",
    nextStep: "Draft the opening pages.",
    illustration: personalIllustration,
  },
};

const wallpapers = [
  [wallpaper01, "Physical hero"],
  [wallpaper02, "Physical crop"],
  [wallpaper03, "Professional hero"],
  [wallpaper04, "Professional crop"],
  [wallpaper05, "Personal hero"],
  [wallpaper06, "Personal crop"],
  [wallpaper07, "Teal sketched field"],
  [wallpaper08, "Halo on Ivory"],
  [wallpaper09, "Mineral paper texture"],
  [wallpaper10, "Ink logo mark on Ivory"],
  [wallpaper11, "Evidence Path mark on Ivory"],
  [wallpaper12, "Deep teal field with feathered edge"],
  [wallpaper13, "Ivory with graphite border"],
  [wallpaper14, "Summit Ink field with Ivory vignette"],
] as const;

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
  const example = illustrativeAreaContent[goal.area || "physical"];
  const commitment = currentAction(snapshot, goal.id);
  const currentDefinition =
    commitment && definition(snapshot, commitment.id, commitment.revision);
  const milestone = currentMilestone(snapshot, goal);
  const next = pendingSteps(snapshot, goal)[0];
  const ended = ["completed", "changed_direction", "abandoned"].includes(
    goal.status,
  );
  const currentStep = currentDefinition?.action || example.nowStep;
  const nextStep = next?.data.action || example.nextStep;
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
            <p>{goal.vision || example.becoming}</p>
          </section>
          <button
            className="quiet hero-challenge"
            onClick={() => navigate("/manage")}
          >
            <span className="visually-hidden">Challenge: </span>
            {goal.words || example.challenge}
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
          <section className="redesign-now-panel" aria-labelledby="today-step">
            <span className="now-kicker">Now · Today&apos;s step</span>
            <h2 id="today-step">{currentStep}</h2>
            <span className="now-divider" aria-hidden="true">
              — — —
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
            <h2 id="next-step-title">{nextStep}</h2>
            {nextMilestone && (
              <p className="next-step-context">
                Milestone: {nextMilestone.title}
              </p>
            )}
            <p className="next-step-criterion">Done means: {nextCriterion}</p>
            {recurring && (
              <p className="recurring-note">
                This recurring step already carries its schedule.
              </p>
            )}
            <div className="next-step-actions">
              {!recurring && (
                <button
                  className="button secondary"
                  onClick={() => navigate("/commitment/" + goal.id)}
                >
                  Schedule this step
                </button>
              )}
              <button
                className="button secondary"
                onClick={() => navigate("/calendar/" + goal.id)}
              >
                Add to calendar
              </button>
            </div>
          </section>

          <section
            className="redesign-wallpaper"
            aria-labelledby="wallpaper-title"
          >
            <span className="section-label">Carry it with you</span>
            <h2 id="wallpaper-title">A reminder of who you are becoming.</h2>
            <img
              className="featured-wallpaper"
              src={example.illustration}
              alt=""
            />
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
                  {wallpapers.map(([src, label]) => (
                    <button
                      key={label}
                      className="wallpaper-tile"
                      aria-label={`Use ${label} wallpaper`}
                      onClick={() => navigate("/wallpaper/" + goal.id)}
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
          <span className="section-label">Carry it with you</span>
          <h2 id="wallpaper-title">A reminder of who you are becoming.</h2>
          <img
            className="featured-wallpaper"
            src={example.illustration}
            alt=""
          />
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
                {wallpapers.map(([src, label]) => (
                  <button
                    key={label}
                    className="wallpaper-tile"
                    aria-label={`Use ${label} wallpaper`}
                    onClick={() => navigate("/wallpaper/" + goal.id)}
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
