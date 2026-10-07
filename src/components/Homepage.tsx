import { useState } from "react";
import { Brand } from "./Brand";
import physical from "../assets/workshop/area-physical.webp";
import professional from "../assets/workshop/area-professional.webp";
import personal from "../assets/workshop/area-personal.webp";
import ring from "../assets/workshop/timer-ring.png";
import basecamp from "../assets/workshop/nav-now.png";
import plan from "../assets/workshop/nav-plan.png";
import proof from "../assets/workshop/nav-proof.png";

export const illustrativeExamples = [
  {
    name: "Physical",
    image: physical,
    alt: "A swimmer prepares for open water",
    challenge: "Complete my first triathlon.",
    milestone: "Complete a 400 m open-water swim.",
    step: "Book a coached swim session.",
    setback:
      "Missed practice? Review what got in the way and choose an adjustment.",
    reflection: "I learned to return after a setback.",
  },
  {
    name: "Professional",
    image: professional,
    alt: "A speaker rehearses in an empty auditorium",
    challenge: "Deliver a keynote at an industry conference.",
    milestone: "Deliver the full talk to three peers.",
    step: "Record the first two minutes of my opening.",
    setback:
      "Lost your place? Review the recording and choose what to rehearse next.",
    reflection:
      "Preparation helped me speak with conviction. What could my next talk become?",
  },
  {
    name: "Personal",
    image: personal,
    alt: "A writer shares a manuscript with a reader",
    challenge: "Finish my novella and share it with three readers.",
    milestone: "Complete the first draft.",
    step: "Write the central idea of my story.",
    setback:
      "Missed a writing session? Choose a time and scope you can protect.",
    reflection: "I can finish and share work that matters to me.",
  },
];
export function Homepage({
  start,
  signIn,
  signedIn,
}: {
  start: (kind: "goal" | "vision") => void;
  signIn: () => void;
  signedIn: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const example = illustrativeExamples[selected];
  const begin = () => start("vision");
  return (
    <main id="main" className="how-page">
      <section className="how-opening" aria-labelledby="how-title">
        <img
          className="how-hero-image"
          src={example.image}
          alt=""
          fetchPriority="high"
        />
        <header className="how-header">
          <Brand mineral />
          <button className="how-login" onClick={signIn}>
            {signedIn ? "Return to Now" : "Log in"}
          </button>
        </header>
        <div className="how-hero-copy">
          <div className="area-tabs" aria-label="Explore an area">
            {illustrativeExamples.map((e, i) => (
              <button
                key={e.name}
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
              >
                {e.name}
              </button>
            ))}
          </div>
          <h1 id="how-title" tabIndex={-1}>
            Become You.
          </h1>
          <p className="how-promise">
            Who you become starts with what you dare to do.
          </p>
          <p className="how-description">
            Choose a meaningful challenge.
            <br />
            Prepare for it. Take action.
            <br />
            See what changes.
          </p>
          <button className="button how-primary" onClick={begin}>
            Build my challenge <span aria-hidden="true">›</span>
          </button>
        </div>
        <div className="how-hero-end">
          <p>A clear path. One next step.</p>
        </div>
      </section>
      <section className="how-method" aria-labelledby="method-title">
        <h2 id="method-title">
          Big challenge.
          <br />
          Clear next step.
        </h2>
        <ol className="method-list">
          <li>
            <span aria-hidden="true">01</span>
            <div>
              <h3>Choose what matters</h3>
              <p>
                Name who you want to become and a challenge that asks more of
                you.
              </p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <div>
              <h3>Prepare for reality</h3>
              <p>
                Build milestones over weeks or months. Give each preparation
                step a time and plan for obstacles.
              </p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <div>
              <h3>Act. Check in. Adjust.</h3>
              <p>
                Now brings your next step into focus. After a setback, reflect
                and choose what changes.
              </p>
            </div>
          </li>
        </ol>
        <div
          className="method-timer"
          aria-label="Illustrative timer: fifteen minutes"
        >
          <img src={ring} alt="" loading="lazy" />
          <i className="method-timer-marker" aria-hidden="true" />
          <div>
            <strong>15:00</strong>
            <span>
              Time for your
              <br />
              next step
            </span>
          </div>
        </div>
        <div className="method-last">
          <span aria-hidden="true">04</span>
          <div>
            <h3>Keep the proof</h3>
            <p>
              Revisit what happened, what changed, and what you will carry into
              your next challenge.
            </p>
          </div>
        </div>
        <div className="method-destinations" aria-label="Your workspace">
          {[
            [basecamp, "Now"],
            [plan, "Plan"],
            [proof, "Proof"],
          ].map(([src, label]) => (
            <span key={label}>
              <img src={src} alt="" />
              {label}
            </span>
          ))}
        </div>
        <button className="button method-cta" onClick={begin}>
          Take your first step <span aria-hidden="true">›</span>
        </button>
      </section>
      <section className="how-examples" aria-labelledby="examples-title">
        <h2 id="examples-title">Make it yours.</h2>
        <p className="section-label">Illustrative examples</p>
        <div
          className="example-selector"
          role="group"
          aria-label="Choose an example"
        >
          {illustrativeExamples.map((item, i) => (
            <button
              key={item.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <article
          className="example-story"
          aria-live="polite"
          aria-atomic="true"
        >
          <img
            src={example.image}
            alt={example.alt}
            loading="lazy"
            width="1200"
            height="800"
          />
          <h3>Become capable of more.</h3>
          <p className="example-intro">
            Months of preparation. One step at a time.
          </p>
          <dl>
            {[
              ["Challenge", example.challenge],
              ["Milestone", example.milestone],
              ["Next step", example.step],
              ["Setback", example.setback],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="section-label">Example reflection</p>
          <blockquote>“{example.reflection}”</blockquote>
        </article>
        <button className="button example-cta" onClick={begin}>
          Make it mine <span aria-hidden="true">›</span>
        </button>
        <div className="how-invitation">
          <h2>
            The challenge ends.
            <br />
            The evidence stays.
          </h2>
          <p>Keep what you learned. Choose what comes next.</p>
          <button className="button how-primary" onClick={begin}>
            Build my challenge <span aria-hidden="true">›</span>
          </button>
        </div>
      </section>
    </main>
  );
}
