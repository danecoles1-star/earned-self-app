import { useState } from "react";
import type { GrowthArea } from "../data/types";
import { areaLabel } from "./Areas";
import { Stage } from "./Stage";
import physical from "../assets/illustrations/illo-physical.webp";
import professional from "../assets/illustrations/illo-professional.webp";
import personal from "../assets/illustrations/illo-personal.webp";

const illustrations = { physical, professional, personal };

/** No sample data is sent to the adapter or saved as a user's challenge or Proof. */
export function ChallengeWelcome({
  area,
  hasOtherGoals,
  navigate,
  start,
}: {
  area: GrowthArea | null;
  hasOtherGoals: boolean;
  navigate: (path: string) => void;
  start: (intent: "goal" | "discover") => void;
}) {
  const [discover, setDiscover] = useState(false);
  const [preview, setPreview] = useState<"Now" | "Plan" | "Proof" | null>(null);
  const [activity, setActivity] = useState(false);
  return (
    <Stage
      title="Your next challenge"
      tone="focus"
      navigate={navigate}
      hero={
        <section className="stage-hero welcome-hero">
          <span className="section-label">
            {area ? areaLabel(area) : "Your own starting point"}
          </span>
          <h2>Become someone you believe in.</h2>
          <p>
            Choose something that matters. Build the ability to see it through.
          </p>
        </section>
      }
    >
      <section
        className="challenge-welcome"
        aria-label="Choose your starting point"
      >
        <div className="welcome-story">
          <div>
            <span className="section-label">Start with you</span>
            <h2>What could you become here?</h2>
            <p>
              You don’t need a perfect plan. Start with an ambition, or explore
              what would stretch you.
            </p>
            {hasOtherGoals && (
              <p className="small">
                Your challenges and Proof in other areas stay available.
              </p>
            )}
          </div>
          <img src={illustrations[area || "physical"]} alt="" />
        </div>
        <div className="welcome-paths">
          <button className="welcome-choice" onClick={() => start("goal")}>
            <span className="section-label">I know my direction</span>
            <strong>I have a challenge</strong>
            <span>
              Bring your ambition. Define why it matters and what finishing
              means.
            </span>
          </button>
          <button
            className="welcome-choice"
            aria-expanded={discover}
            onClick={() => setDiscover(!discover)}
          >
            <span className="section-label">I’m exploring</span>
            <strong>Help me find my challenge</strong>
            <span>
              Start with who you want to become and what feels just beyond you.
            </span>
          </button>
        </div>
        {discover && (
          <section
            className="welcome-discovery"
            aria-label="Explore your direction"
          >
            <h3>You don’t have to know yet.</h3>
            <p>
              What would you like to trust yourself to do? Think about something
              you avoid, a skill you want, or an experience you keep putting
              off.
            </p>
            <p>
              Choose a meaningful stretch from where you are today, with time
              and resources you can realistically commit.
            </p>
            <p className="small">
              These are reflection prompts. AI challenge recommendations are not
              connected in this preview yet.
            </p>
            <button className="button" onClick={() => start("discover")}>
              Explore my direction
            </button>
          </section>
        )}
        <button
          className="quiet welcome-preview-link"
          onClick={() => {
            setPreview("Now");
            setActivity(false);
          }}
        >
          Preview Now, Plan &amp; Proof
        </button>
        {preview && (
          <section className="welcome-demo" aria-label="Design preview">
            <div className="welcome-demo-heading">
              <div>
                <span className="section-label">
                  Illustrative example · Kings Peak
                </span>
                <p>
                  Read-only design preview. Nothing here is added to your
                  account.
                </p>
              </div>
              <button className="quiet" onClick={() => setPreview(null)}>
                Close preview
              </button>
            </div>
            <div
              className="welcome-preview-tabs"
              role="group"
              aria-label="Preview screens"
            >
              {(["Now", "Plan", "Proof"] as const).map((tab) => (
                <button
                  key={tab}
                  className="quiet"
                  aria-pressed={preview === tab}
                  onClick={() => setPreview(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {preview === "Now" && (
              <>
                <section
                  className="redesign-now-panel"
                  aria-label="Example Now panel"
                >
                  <span className="now-kicker">
                    Example step · Prepare for Kings Peak
                  </span>
                  <h2>Prepare for your next training hike.</h2>
                  <button
                    className="begin-button"
                    aria-expanded={activity}
                    onClick={() => setActivity(!activity)}
                  >
                    Begin
                  </button>
                </section>
                {activity && (
                  <div className="welcome-discovery">
                    <h3>Check your route and essentials</h3>
                    <p>
                      Review your planned route, available time, and equipment.
                      Note what you still need to prepare.
                    </p>
                    <p className="small">
                      Illustrative content only. This does not start or complete
                      a real session.
                    </p>
                    <button
                      className="quiet"
                      onClick={() => setActivity(false)}
                    >
                      Close example activity
                    </button>
                  </div>
                )}
              </>
            )}
            {preview === "Plan" && (
              <div className="welcome-discovery">
                <span className="section-label">Example plan</span>
                <h3>Build toward Kings Peak.</h3>
                <ol>
                  <li>
                    Establish your starting ability and available training time.
                  </li>
                  <li>Build consistency on suitable training hikes.</li>
                  <li>Review readiness and prepare for the goal hike.</li>
                </ol>
                <p>
                  This illustrates the plan’s structure, not a personalized
                  training prescription.
                </p>
              </div>
            )}
            {preview === "Proof" && (
              <div className="welcome-discovery">
                <span className="section-label">Example reflection</span>
                <h3>Keep the evidence of your effort.</h3>
                <p>
                  “I checked the route and packed my essentials. I found a
                  missing item and made time to get it before the hike.”
                </p>
                <p>
                  Real Proof comes from your actions, results, and reflections.
                  This example is not a completed step.
                </p>
              </div>
            )}
          </section>
        )}
      </section>
    </Stage>
  );
}
