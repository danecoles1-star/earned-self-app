import { useEffect, useRef, useState, type ReactNode } from "react";
import { Brand } from "./Brand";
import physical from "../assets/workshop/area-physical.webp";
import professional from "../assets/workshop/how-after-speech.webp";
import personal from "../assets/workshop/area-personal.webp";
import ridge from "../assets/illustrations/illo-physical.webp";
import { MountainMark, TabIcon } from "../experience/Earned";
import { NowCard } from "../experience/NowCard";

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
    focus: "50% 4%",
    alt: "A triathlon participant finishes the swim with other competitors",
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
    focus: "50% 16%",
    alt: "The speaker is warmly congratulated by audience members after her talk",
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
    focus: "50% 6%",
    alt: "A writer works on her story beside a window",
    challenge: "Finish my novella and share it with three readers.",
    milestone: "Complete the first draft.",
    step: "Write the central idea of my story.",
    setback:
      "Missed a writing session? Choose a time and scope you can protect.",
    reflection: "I can finish and share work that matters to me.",
  },
];
const faqs: [string, string][] = [
  [
    "Do I need an account to start?",
    "No. Choose your challenge and take your first small step first. Create an account at the end to save what you started.",
  ],
  [
    "How long does it take to begin?",
    "About three minutes to share where you want to grow and take a first step you can finish right away.",
  ],
  [
    "What does each step experience include?",
    "Everything that step needs: what to do and how to do it well, examples, images and tools made for where you are right now. It is ready before the step is due.",
  ],
  [
    "What if a step only partly happens, or not at all?",
    "Check in honestly with Partly or Not yet and say what got in the way. Your next steps adapt, and the check-in stays in your Proof as part of the story, never as a broken streak.",
  ],
  [
    "Who can see my Proof?",
    "Only you. Your writing and Proof are private to your account, and you can download all of it from Settings.",
  ],
  [
    "How do I add Earned Self to my Home Screen?",
    "On iPhone, open Earned Self in Safari, tap the Share button, then Add to Home Screen and Add. On Android, open it in Chrome, tap the ⋮ menu, then Add to Home screen or Install app. It opens full screen like any other app.",
  ],
];

/** A phone that renders the app's own screen markup at 390px, scaled down. */
function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="es-home-phone">
      <div className="es-home-phone-screen">
        <div className="es-home-phone-app" aria-hidden="true" inert>
          {children}
        </div>
      </div>
      <figcaption className="visually-hidden">
        {label}. Illustrative example, not a member’s data.
      </figcaption>
    </figure>
  );
}

function MockTabs({ active }: { active: "now" | "plan" | "proof" }) {
  return (
    <nav className="es-tabbar es-mock-tabbar">
      {(
        [
          ["now", "Now"],
          ["plan", "Plan"],
          ["proof", "Proof"],
        ] as const
      ).map(([name, label]) => (
        <button
          key={name}
          aria-current={active === name ? "page" : undefined}
        >
          <TabIcon name={name} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function MockHeader() {
  return (
    <>
      <div className="es-mock-header">
        <Brand mineral />
        <span className="es-mock-avatar" />
      </div>
      <div className="es-mock-areas">
        <span className="on">Physical</span>
        <span>Professional</span>
        <span>Personal</span>
      </div>
    </>
  );
}

function NowScreen() {
  return (
    <div className="es-mock es-mock-light">
      <MockHeader />
      <div className="es-mock-body">
        <section className="es-now-greeting">
          <p className="es-date">Tuesday, November 10</p>
          <p className="es-greeting">Good morning.</p>
          <p className="es-becoming">
            <span>Becoming</span>
            Someone who can still climb big mountains in my seventies.
          </p>
        </section>
        <NowCard
          inert
          state="ready"
          image={ridge}
          tag="Ready now · prepared for you"
          when="Today · 6:30 AM · 40 min"
          title="Hill intervals: six climbs, steady breathing"
          parts={[
            { label: "Warm up", minutes: 8 },
            { label: "Six climbs", minutes: 18 },
            { label: "Walk downs", minutes: 12 },
            { label: "Cool down", minutes: 2 },
          ]}
          action="Begin"
          foot="Milestone 1 of 4 · Hike 8 miles with 2,000 ft of gain"
        />
        <section className="es-ready">
          <h2>Get ready</h2>
          <dl className="es-card es-list">
            <div>
              <dt>Where</dt>
              <dd>A hill about 3 minutes to walk up, or a stairwell</dd>
            </div>
            <div>
              <dt>Done when</dt>
              <dd>Six climbs, or as many as you can safely do</dd>
            </div>
          </dl>
        </section>
      </div>
      <MockTabs active="now" />
    </div>
  );
}

function ExperienceScreen() {
  return (
    <div className="es-mock es-focus">
      <div className="es-focus-header">
        <span className="es-icon-button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
        <span className="es-focus-meta">40 min · 4 parts</span>
        <span className="es-icon-spacer" />
      </div>
      <div className="es-focus-main">
        <p className="es-eyebrow es-eyebrow-ember">How it goes</p>
        <h1>Hill intervals: six climbs, steady breathing</h1>
        <div className="es-exp-visual">
          <img src={ridge} alt="" />
          <span>Visual guide · your climbing posture</span>
        </div>
        <ol className="es-exp-steps">
          <li>
            <b>Warm up · 8 min</b>
            <span>Easy walk on flat ground until your breathing settles.</span>
          </li>
          <li className="on">
            <b>Six climbs · 3 min each</b>
            <span>Short steps, upright chest, steady pace.</span>
          </li>
          <li>
            <b>Walk down · 2 min each</b>
            <span>Your recovery. Go slowly and land softly.</span>
          </li>
        </ol>
        <div className="es-exp-tool">
          <b>Tool: the talk test</b>
          <div>
            <span>
              Too easy<small>Full sentences</small>
            </span>
            <span className="on">
              Right here<small>Short phrases</small>
            </span>
            <span>
              Ease off<small>Can’t speak</small>
            </span>
          </div>
        </div>
      </div>
      <div className="es-focus-footer">
        <span className="es-button es-button-light">Start the timer</span>
      </div>
    </div>
  );
}

function ProofScreen() {
  // Shown scrolled past the app header, as a member sees it mid-scroll.
  return (
    <div className="es-mock es-mock-light">
      <div className="es-mock-body es-mock-scrolled">
        <section className="es-proof-head">
          <p className="es-proof-title">Your Proof</p>
          <p className="es-proof-identity">
            Becoming: Someone who can still climb big mountains in my seventies.
          </p>
          <section className="es-tracker">
            <ol className="es-tracker-path">
              <li className="es-badge es-badge-earned">
                <MountainMark />
              </li>
              <li className="es-badge">2</li>
              <li className="es-badge">3</li>
              <li className="es-badge">4</li>
            </ol>
            <p className="es-tracker-totals">
              <span>
                <strong>1 of 4</strong> milestones
              </span>
              <span>
                <strong>15</strong> steps recorded
              </span>
              <span>
                <strong>2</strong> comebacks
              </span>
            </p>
          </section>
        </section>
        <div className="es-journal">
          <h4 className="es-week">This week</h4>
          <div className="es-entry es-entry-milestone">
            <div className="es-mock-summary">
              <span className="es-entry-badge">
                <MountainMark size={18} />
              </span>
              <span className="es-entry-body">
                <span className="es-entry-kind">Milestone earned</span>
                <strong>Hike 8 miles with 2,000 ft of gain</strong>
                <span className="proof-date">01/09/2027</span>
              </span>
            </div>
          </div>
          <div className="es-entry" data-result="partly">
            <span className="es-entry-top">
              <strong>Leg strength, 30 min</strong>
              <span className="es-chip" data-result="partly">
                Partly
              </span>
            </span>
            <span className="es-entry-words">
              “Skipped the last set of lunges. Knee felt tight.”
            </span>
            <span className="proof-date">01/08/2027</span>
          </div>
          <div className="es-entry" data-result="done">
            <span className="es-entry-top">
              <strong>Hill intervals: six climbs</strong>
              <span className="es-chip" data-result="done">
                Done
              </span>
            </span>
            <span className="es-entry-words">
              “All six climbs. Calves held up this time.”
            </span>
            <span className="proof-date">01/06/2027</span>
          </div>
        </div>
      </div>
      <MockTabs active="proof" />
    </div>
  );
}

export function Homepage({
  start,
  signIn,
  signedIn,
}: {
  start: (
    kind: "goal" | "vision",
    area?: "physical" | "professional" | "personal",
  ) => void;
  signIn: () => void;
  signedIn: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [showDock, setShowDock] = useState(false);
  const heroCta = useRef<HTMLButtonElement>(null);
  const finalCta = useRef<HTMLElement>(null);
  const example = illustrativeExamples[selected];
  const begin = () => start("vision");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const seen = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setShowDock(![...seen.values()].some(Boolean));
    });
    if (heroCta.current) observer.observe(heroCta.current);
    if (finalCta.current) observer.observe(finalCta.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="es-home">
      <header className="es-home-header">
        <Brand mineral />
        <nav aria-label="Account">
          <button className="es-text-button" onClick={signIn}>
            {signedIn ? "Return to Now" : "Log in"}
          </button>
        </nav>
      </header>
      <main id="main">
        <section className="es-home-hero" aria-labelledby="how-title">
          <div className="es-home-hero-copy">
            <h1 id="how-title" tabIndex={-1}>
              Become You.
            </h1>
            <p className="es-home-lede">
              You already know who you want to become. Earned Self turns it into
              a challenge worth earning, prepares every step so you know exactly
              how to move forward, and shows you the proof that you’re becoming
              that person.
            </p>
            <button
              ref={heroCta}
              className="es-button es-home-cta"
              onClick={begin}
            >
              Build my challenge
            </button>
            <p className="es-home-micro">
              About 3 minutes · No account needed to start
            </p>
          </div>
          <Phone label="The Now screen with today’s prepared step">
            <NowScreen />
          </Phone>
        </section>

        <section className="es-home-experience" aria-labelledby="exp-title">
          <div className="es-home-experience-copy">
            <p className="es-eyebrow es-eyebrow-ember">
              The heart of Earned Self
            </p>
            <h2 id="exp-title">Every step arrives prepared for you.</h2>
            <p>
              Before each step you schedule, your guide builds an experience for
              exactly where you are: what to do, how to do it well, and the
              examples, images and tools that step needs. Tap Begin and move
              forward with confidence.
            </p>
            <ul className="es-home-ticks">
              <li>Made for this step, not a generic plan</li>
              <li>Adapts to every check-in you make</li>
              <li>Ready before you are</li>
            </ul>
          </div>
          <Phone label="A prepared step experience">
            <ExperienceScreen />
          </Phone>
        </section>

        <section className="es-home-steps" aria-labelledby="steps-title">
          <h2 id="steps-title">How it works</h2>
          <ol>
            <li>
              <span className="es-home-step-n">1</span>
              <h3>Share who you want to become</h3>
              <p>
                A short guided conversation about where you are and where you
                want to grow. Bring a challenge, or let your guide suggest one
                worth earning.
              </p>
            </li>
            <li>
              <span className="es-home-step-n">2</span>
              <h3>Get a path built for you</h3>
              <p>
                Milestones and every step, designed around your starting point
                and your week. You choose when each step happens.
              </p>
            </li>
            <li>
              <span className="es-home-step-n">3</span>
              <h3>Step into each experience</h3>
              <p>
                Each step opens a guided experience with instructions, examples,
                images and tools for that moment, so you always know your next
                move.
              </p>
            </li>
          </ol>
        </section>

        <section className="es-home-examples" aria-labelledby="examples-title">
          <h2 id="examples-title">Make it yours.</h2>
          <p className="es-home-section-sub">
            See how a challenge becomes a path. Choose an area to start from.
          </p>
          <div
            className="es-home-seg"
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
            className="es-home-example es-card"
            aria-live="polite"
            aria-atomic="true"
          >
            <img
              src={example.image}
              alt={example.alt}
              style={{ objectPosition: example.focus }}
              loading="lazy"
              width="1200"
              height="800"
            />
            <div className="es-home-example-body">
              <p className="es-eyebrow">Illustrative example</p>
              <p className="es-home-vision">{example.vision}</p>
              <dl>
                <div>
                  <dt>Challenge</dt>
                  <dd>{example.challenge}</dd>
                </div>
              </dl>
              <ol className="es-home-path" aria-label="Milestones">
                {example.milestones.map((m, i) => (
                  <li key={m} data-current={i === 0}>
                    {m}
                  </li>
                ))}
              </ol>
              <dl>
                <div>
                  <dt>First step</dt>
                  <dd>{example.step}</dd>
                </div>
              </dl>
              <button
                className="es-button es-home-cta"
                onClick={() =>
                  start(
                    "vision",
                    (["physical", "professional", "personal"] as const)[
                      selected
                    ],
                  )
                }
              >
                Make it mine
              </button>
            </div>
          </article>
        </section>

        <section className="es-home-proof" aria-labelledby="proof-title">
          <div className="es-home-proof-copy">
            <p className="es-eyebrow es-eyebrow-gold">Proof, not streaks</p>
            <h2 id="proof-title">See who you’re becoming.</h2>
            <p>
              Every check-in, whether Done, Partly or Not yet, becomes part of
              an honest record in your own words. Milestones you earn are marked
              in gold, and you can look back at how far you’ve come.
            </p>
          </div>
          <Phone label="The Proof screen with milestones and recent check-ins">
            <ProofScreen />
          </Phone>
        </section>

        <section className="es-home-trust" aria-label="Your privacy">
          <div>
            <h3>Private by default</h3>
            <p>
              Your writing and Proof belong to you. No public profile, no feed.
            </p>
          </div>
          <div>
            <h3>Your words stay yours</h3>
            <p>
              Download everything you’ve recorded from Settings at any time.
            </p>
          </div>
          <div>
            <h3>Made for your phone</h3>
            <p>
              Add it to your Home Screen and it opens like an app, in light or
              dark.
            </p>
          </div>
        </section>

        <section className="es-home-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Questions</h2>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        <section
          ref={finalCta}
          className="es-home-final"
          aria-labelledby="final-title"
        >
          <h2 id="final-title">Start becoming who you know you can be.</h2>
          <p>Name the challenge. Take your first step today.</p>
          <button
            className="es-button es-button-light es-home-cta"
            onClick={begin}
          >
            Build my challenge
          </button>
          <p className="es-home-micro">No account needed to start</p>
        </section>
      </main>
      <footer className="es-home-footer">
        <Brand mineral />
        <p>Private by default.</p>
      </footer>
      <div
        className="es-home-dock"
        data-visible={showDock}
        aria-hidden={!showDock}
      >
        <button
          className="es-button es-home-cta"
          tabIndex={showDock ? 0 : -1}
          onClick={begin}
        >
          Build my challenge
        </button>
      </div>
    </div>
  );
}
