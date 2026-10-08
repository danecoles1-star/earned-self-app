import { useState } from "react";
import { Brand } from "./Brand";
import physical from "../assets/workshop/area-physical.webp";
import professional from "../assets/workshop/area-professional.webp";
import personal from "../assets/workshop/area-personal.webp";
import hero from "../assets/workshop/hero-professional.webp";
import { proofArt } from "../experience/workshopArt";
import notebook from "../assets/workshop/method-notebook.webp";
import ring from "../assets/workshop/timer-ring.webp";
import basecamp from "../assets/workshop/nav-now.png";
import plan from "../assets/workshop/nav-plan.png";
import proof from "../assets/workshop/nav-proof.png";

export const illustrativeExamples = [
  {
    name: "Physical",
    vision: "Be capable of taking on a demanding endurance challenge.",
    milestones: [
      "Build a consistent swim, bike and run routine.",
      "Complete a 400 m open-water swim.",
      "Complete a full practice course.",
    ],
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
    vision: "Be a confident voice in my field.",
    milestones: [
      "Shape the full talk.",
      "Rehearse with three peers.",
      "Deliver the keynote.",
    ],
    image: professional,
    alt: "A speaker with her notes in a small, dark auditorium",
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
    vision: "Become someone who finishes and shares meaningful creative work.",
    milestones: [
      "Complete the first draft.",
      "Revise with reader feedback.",
      "Share the finished novella.",
    ],
    image: personal,
    alt: "A writer works on her story beside a window",
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
        <header className="how-header">
          <Brand mineral />
          <button className="how-login" onClick={signIn}>
            {signedIn ? "Return to Now" : "Log in"}
          </button>
        </header>
        <div className="how-hero-copy">
          <h1 id="how-title" tabIndex={-1}>
            Become You.
          </h1>
          <p className="how-promise">
            Who you become starts with what you dare to do.
          </p>
          <button className="button how-primary" onClick={begin}>
            Build my challenge <span aria-hidden="true">›</span>
          </button>
        </div>
        <img
          className="how-hero-image"
          src={hero}
          alt=""
          fetchPriority="high"
        />
      </section>
      <section className="how-method" aria-labelledby="method-title">
        <h2 id="method-title">
          Big challenge.
          <br />
          Clear next step.
        </h2>
        <p>Break what you want to become into a plan you can work on now.</p>
        <div
          className="method-plan"
          aria-label="Illustrative challenge, milestone and step"
        >
          <span className="section-label">Illustrative plan</span>
          <ol>
            <li>
              <span className="section-label">Challenge</span>
              <p>Deliver my first keynote.</p>
            </li>
            <li>
              <span className="section-label">Current milestone</span>
              <p>Present to three peers.</p>
            </li>
            <li>
              <span className="section-label">Next step</span>
              <p>Record a full rehearsal.</p>
            </li>
          </ol>
          <button className="button method-cta" onClick={begin}>
            Build my plan
          </button>
        </div>
        <img
          className="method-image"
          src={notebook}
          alt="Illustration of preparation"
          loading="lazy"
        />
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
          <div className="example-plan">
            <dl>
              <div>
                <dt>Who I am becoming</dt>
                <dd>{example.vision}</dd>
              </div>
              <div>
                <dt>Challenge</dt>
                <dd>{example.challenge}</dd>
              </div>
            </dl>
            <span className="section-label">Milestones</span>
            <ol className="example-milestones">
              {example.milestones.map((milestone) => (
                <li key={milestone}>{milestone}</li>
              ))}
            </ol>
            <dl>
              <div>
                <dt>First step</dt>
                <dd>{example.step}</dd>
              </div>
            </dl>
          </div>
        </article>
        <button className="button example-cta" onClick={begin}>
          Make it mine <span aria-hidden="true">›</span>
        </button>
      </section>
      <section className="how-method" aria-labelledby="attention-title">
        <h2 id="attention-title">Give it your attention.</h2>
        <p>Start your work. Check in when you’re done.</p>
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
        <div className="method-recovery">
          <span className="section-label">A setback is part of the record</span>
          <h3>Missed a step?</h3>
          <p>Reflect on what got in the way. Choose what changes next.</p>
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
      <section className="how-examples" aria-label="Your evidence">
        <div className="how-invitation">
          <h2>The evidence is stacking up, keep going.</h2>
          <p>Reflect on what changed. Choose what comes next.</p>
          <section
            className="illustrative-proof"
            aria-label="Illustrative Proof record"
          >
            <span className="section-label">
              Illustrative example, not a member story
            </span>
            <div className="illustrative-proof-row">
              <span className="section-label">Step completed</span>
              <p>{example.step}</p>
            </div>
            <div className="illustrative-proof-row">
              <span className="section-label">A later step was missed</span>
              <p>{example.setback}</p>
            </div>
            <div className="illustrative-proof-row">
              <span className="section-label">What changed</span>
              <p>{example.reflection}</p>
            </div>
          </section>
          <img
            className="method-image"
            src={
              proofArt[
                (["physical", "professional", "personal"] as const)[selected]
              ]
            }
            alt="Illustrative accomplishment"
            loading="lazy"
          />
          <button className="button how-primary" onClick={begin}>
            Build my challenge <span aria-hidden="true">›</span>
          </button>
        </div>
      </section>
    </main>
  );
}
