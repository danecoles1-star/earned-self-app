import { useState } from "react";
import { Paused } from "./Paused";
import halo from "../assets/panel/tex-halo.webp";
import { TabIcon } from "./Earned";
import physicalIllustration from "../assets/illustrations/illo-physical.webp";
import professionalIllustration from "../assets/illustrations/illo-professional.webp";
import personalIllustration from "../assets/illustrations/illo-personal.webp";
import { wallpapers } from "./wallpapers";
import type { Goal, GrowthArea, Snapshot } from "../data/types";
import {
  currentAction,
  currentMilestone,
  currentSchedule,
  definition,
} from "../data/domain";
import { displaySchedule } from "../data/time";
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

  const schedule = commitment ? currentSchedule(snapshot, commitment.id) : null;
  const stepMilestone =
    goal.milestones.find((m) => m.id === commitment?.milestone_id) || milestone;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Stage
      title="Now"
      tone="focus"
      navigate={navigate}
      hero={
        <section className="es-now-greeting" aria-label="Your direction">
          <p className="es-date">{today}</p>
          <p className="es-greeting">{greeting}</p>
          {goal.vision && (
            <p className="es-becoming">
              <span>Becoming</span>
              {goal.vision}
            </p>
          )}
        </section>
      }
    >
      {goal.status === "paused" && <Paused goal={goal} navigate={navigate} />}
      {ended ? (
        <section className="stage-ended es-card es-ended">
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
            className={`es-now-card${currentStep.length > 70 ? " es-long-step" : ""}`}
            aria-labelledby="today-step"
          >
            <img className="es-now-halo" src={halo} alt="" aria-hidden="true" />
            <div className="es-now-top">
              <span className="es-now-tag">
                <i aria-hidden="true" />
                {commitment
                  ? displaySchedule(
                      schedule?.local_date,
                      schedule?.local_time,
                      schedule?.time_zone,
                    ) || "Ready when you are"
                  : "Next step not scheduled"}
              </span>
              <h2 id="today-step">{currentStep}</h2>
            </div>
            <button
              className="es-begin"
              disabled={goal.status === "paused"}
              onClick={() =>
                navigate(
                  commitment
                    ? "/focus/" + goal.id
                    : goal.status === "draft"
                      ? "/plan/" + goal.id
                      : "/add-step/" + goal.id,
                )
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
              </svg>
              {commitment ? "Begin" : "Prepare"}
            </button>
            {stepMilestone && (
              <span className="es-now-foot">
                Milestone {goal.milestones.indexOf(stepMilestone) + 1} of{" "}
                {goal.milestones.length} · {stepMilestone.title}
              </span>
            )}
          </section>

          {commitment && currentDefinition && (
            <section className="es-ready" aria-labelledby="get-ready">
              <h2 id="get-ready">Get ready</h2>
              <dl className="es-card es-list">
                {schedule?.location && (
                  <div>
                    <dt>Where</dt>
                    <dd>{schedule.location}</dd>
                  </div>
                )}
                <div>
                  <dt>When</dt>
                  <dd>
                    {displaySchedule(
                      schedule?.local_date,
                      schedule?.local_time,
                      schedule?.time_zone,
                    ) || "Not scheduled yet"}
                    {recurring ? " · repeats" : ""}
                  </dd>
                </div>
                <div>
                  <dt>Done when</dt>
                  <dd>{currentDefinition.criterion}</dd>
                </div>
              </dl>
              <div className="es-ready-links">
                <button
                  className="es-text-button"
                  onClick={() =>
                    navigate("/report/" + goal.id + "?result=did_not_happen")
                  }
                >
                  Can’t make it today?
                </button>
                <button
                  className="es-text-button"
                  onClick={() => navigate("/calendar/" + goal.id)}
                >
                  Add to calendar
                </button>
              </div>
            </section>
          )}

          {nextStep && (
            <section className="es-coming" aria-labelledby="next-step-title">
              <h2 id="next-step-title" className="es-section-label">
                Coming up
              </h2>
              <div className="es-card es-coming-card">
                <strong>{nextStep}</strong>
                <span>Done when: {nextCriterion}</span>
                {nextMilestone && <span>Milestone: {nextMilestone.title}</span>}
              </div>
            </section>
          )}

          <WallpaperSection
            goal={goal}
            illustration={illustration}
            open={wallpaperOpen}
            setOpen={setWallpaperOpen}
            navigate={navigate}
          />
        </>
      )}
      {ended && (
        <WallpaperSection
          goal={goal}
          illustration={illustration}
          open={wallpaperOpen}
          setOpen={setWallpaperOpen}
          navigate={navigate}
        />
      )}
    </Stage>
  );
}

function WallpaperSection({
  goal,
  illustration,
  open,
  setOpen,
  navigate,
}: {
  goal: Goal;
  illustration: string;
  open: boolean;
  setOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  navigate: (p: string) => void;
}) {
  return (
    <section className="redesign-wallpaper es-wallpaper" aria-labelledby="wallpaper-title">
      <h2 id="wallpaper-title">Take your vision with you.</h2>
      <figure className="wallpaper-feature">
        <img className="featured-wallpaper" src={illustration} alt="" />
        {goal.vision && <figcaption>{goal.vision}</figcaption>}
      </figure>
      <button
        className="button secondary create-wallpaper"
        aria-expanded={open}
        aria-controls="wallpaper-sheet"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide wallpapers" : "Create wallpaper"}
      </button>
      {open && (
        <section
          id="wallpaper-sheet"
          className="wallpaper-sheet"
          aria-label="Wallpaper variations"
        >
          <header>
            <h3>Choose a wallpaper</h3>
            <button className="quiet" onClick={() => setOpen(false)}>
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
    <nav className="app-tabs es-tabbar" aria-label="Main navigation">
      {(
        [
          ["/app", "Now", "now"],
          ["/manage", "Plan", "plan"],
          ["/proof", "Proof", "proof"],
        ] as const
      ).map(([href, label, icon]) => (
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
          <TabIcon name={icon} />
          {label}
        </button>
      ))}
    </nav>
  );
}
