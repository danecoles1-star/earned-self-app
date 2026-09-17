import { useEffect, useRef, useState } from "react";
import { Brand, Mark } from "./Brand";
import ceramics from "../assets/business.webp";
// Marketing-only immutable illustration. No adapter, member IDs, import or save operations.
function Example() {
  return (
    <div className="example-detail">
      <p className="eyebrow">Maya's fictional ceramics example</p>
      <h2>Launch the business you kept postponing.</h2>
      <p>
        Launched a ceramics business and fulfilled three paid customer orders.
      </p>
      <div className="proof-passage">
        <p className="eyebrow">When I started</p>
        <blockquote>
          “I have talked about this for years. I do not know if anyone would
          pay.”
        </blockquote>
      </div>
      <div className="proof-passage chapter-after">
        <p className="eyebrow">What actually happened</p>
        <p>
          Tested production costs, made a saleable collection and opened an
          online shop. Missed a planned customer interview, revised the plan,
          and fulfilled three paid orders.
        </p>
      </div>
      <div className="proof-passage">
        <p className="eyebrow">What I learned</p>
        <p>
          “I launched it and served my first customers. I still need to test
          repeat demand and a sustainable production pace.”
        </p>
      </div>
    </div>
  );
}
export function Homepage({
  start,
  signIn,
  signedIn,
}: {
  start: (kind: "goal" | "vision") => void;
  signIn: () => void;
  signedIn: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const [motion, setMotion] = useState(true);
  function open() {
    opener.current = document.activeElement as HTMLElement;
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
    opener.current?.focus();
  }
  useEffect(() => {
    const d = dialog.current;
    const onClose = () => opener.current?.focus();
    d?.addEventListener("close", onClose);
    return () => d?.removeEventListener("close", onClose);
  }, []);
  return (
    <div
      className={
        "marketing reduced-home " + (motion ? "with-motion" : "no-motion")
      }
    >
      <div className="market-page">
        <header className="market-header">
          <a className="market-logo" href="/" aria-label="Earned Self homepage">
            <Brand />
          </a>
          <nav aria-label="Homepage">
            <a href="#how">How it works</a>
            <a href="#the-proof">The Proof</a>
            <button onClick={signIn}>
              {signedIn ? "My pursuit" : "Sign in"}
            </button>
          </nav>
        </header>
        <main id="main" tabIndex={-1}>
          <section
            className="market-hero market-wrap"
            aria-label="Choose a meaningful pursuit"
          >
            <div className="hero-writing">
              <p className="market-eyebrow">
                Personal growth, through real experience
              </p>
              <h1>
                Choose who you’ll become.
                <br />
                Take on something big.
                <br />
                <em>Build your Proof.</em>
              </h1>
              <p className="hero-description">
                Turn your vision into a demanding accomplishment. Prepare with
                purpose, put the work on the calendar, and see what you actually
                do.
              </p>
              <div className="hero-actions">
                <button
                  className="market-primary"
                  onClick={() => start("goal")}
                >
                  Start a pursuit
                </button>
                <a className="market-secondary" href="#how">
                  See how it works
                </a>
              </div>
              <p className="hero-terms">
                Private testing. No trial or charge starts here.
              </p>
            </div>
            <div className="hero-record">
              <div className="proof-demo-label">
                <Mark />
                <span>Public fictional example · Maya’s ceramics business</span>
              </div>
              <div className="proof-passage chapter-before">
                <p className="eyebrow">When I started</p>
                <blockquote>
                  “I have talked about this for years. I do not know if anyone
                  would pay.”
                </blockquote>
              </div>
              <div className="proof-passage chapter-after">
                <p className="eyebrow">What actually happened</p>
                <h2>
                  Launched a ceramics business and fulfilled three paid customer
                  orders.
                </h2>
              </div>
              <div className="proof-passage chapter-meaning">
                <p className="eyebrow">What I learned</p>
                <p>
                  “I built and launched something people paid for. Now I need to
                  find a pace I can sustain.”
                </p>
              </div>
            </div>
          </section>
          <section
            id="how"
            className="market-wrap experience-section"
            aria-label="How Earned Self works"
          >
            <div className="section-heading">
              <div>
                <p className="market-eyebrow">How Earned Self works</p>
                <h2>
                  Your vision.
                  <br />
                  <em>A goal worth preparing for.</em>
                </h2>
              </div>
              <p>
                Name the accomplishment that moves your vision forward. Define
                the result, build ordered milestones, and schedule the next
                action. Every ordinary session should serve something that
                matters.
              </p>
            </div>
            <p className="goal-categories">
              Physical goals <span>·</span> Business ideas <span>·</span>{" "}
              Personal growth
            </p>
            <div className="first-move">
              <figure className="pursuit-photo">
                <img
                  src={ceramics}
                  alt="A ceramic maker examining a cup at her worktable"
                />
                <figcaption>
                  Illustrative photograph. The person pictured is not the
                  fictional user.
                </figcaption>
              </figure>
              <div className="working-example">
                <p className="market-eyebrow">
                  Maya’s vision: become a working ceramics business owner
                </p>
                <h3>
                  Launch my ceramics business and fulfil three paid customer
                  orders.
                </h3>
                <div className="demo-step">
                  <p className="market-eyebrow">
                    Preparation milestone: validate a saleable collection
                  </p>
                  <h4>
                    Test production costs and interview three potential
                    customers.
                  </h4>
                  <p>
                    Milestone deadline: October 9, 2026 at 5:00 PM,
                    America/Denver. Next action: price the first collection on
                    October 5 at 12:30 PM, America/Denver. Done means a cost
                    sheet for six pieces.
                  </p>
                  <button className="market-primary" onClick={open}>
                    See this example
                  </button>
                </div>
              </div>
            </div>
            <div className="method-line">
              <p>
                <span>1. Prepare</span>Define the capabilities, unknowns and
                milestones that lead to your accomplishment.
              </p>
              <p>
                <span>2. Commit</span>Set a milestone deadline and a specific
                time for the next action.
              </p>
              <p>
                <span>3. Build Proof</span>Done, partly done, or didn’t happen.
                Report honestly. Decide what changes next.
              </p>
            </div>
          </section>
          <section
            className="return-section"
            aria-label="Missing a commitment and returning"
          >
            <div className="market-wrap return-layout">
              <div>
                <p className="market-eyebrow">When plans change</p>
                <h2>
                  The commitment
                  <br />
                  <em>didn’t happen.</em>
                </h2>
                <p>
                  You committed to this because it matters to you. What
                  prevented it, and what will you change before committing
                  again?
                </p>
                <button className="market-light" onClick={() => start("goal")}>
                  Make the plan real
                </button>
              </div>
              <div className="return-excerpt">
                <div className="proof-passage">
                  <p className="eyebrow">Missed</p>
                  <h3>The customer interview didn’t happen.</h3>
                  <p>
                    “I left the session at the end of an overloaded day.” Maya
                    reported the miss.
                  </p>
                </div>
                <div className="proof-passage">
                  <p className="eyebrow">Returned</p>
                  <h3>
                    A protected lunch session. Three interviews completed.
                  </h3>
                  <p>
                    She revised the schedule. The earlier miss and original date
                    stayed in her Proof.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section
            id="the-proof"
            className="market-wrap growing-proof"
            aria-label="The Proof over time"
          >
            <div className="proof-intro">
              <p className="market-eyebrow">The Proof over time</p>
              <h2>
                Earlier doubts.
                <br />
                Actual outcomes.
                <br />
                <em>Your own conclusions.</em>
              </h2>
              <p>
                Keep your starting words beside what happened. Your commitments
                and reports stay together, so the next decision can draw on
                experience.
              </p>
              <p>
                Add what you learned when it is useful. You do not need a daily
                essay or a positive interpretation of every attempt.
              </p>
            </div>
            <div className="proof-timeline">
              <ol>
                <li>
                  <span>Day 14</span>
                  <h3>A collection costed. An interview missed.</h3>
                  <p>
                    Preparation made progress. The missed session still needed a
                    decision.
                  </p>
                </li>
                <li>
                  <span>Day 45</span>
                  <h3>Business launched. Three orders fulfilled.</h3>
                  <p>
                    The defined accomplishment happened. Maya kept the actual
                    costs and work beside her starting words.
                  </p>
                </li>
                <li>
                  <span>Six months</span>
                  <h3>Could a larger batch fit?</h3>
                  <p>
                    Capacity was still a question. She kept her job while
                    testing.
                  </p>
                </li>
              </ol>
              <button className="market-text" onClick={open}>
                Open the example Proof
              </button>
            </div>
          </section>
          <section
            className="market-wrap edge-section"
            aria-label="Choosing what comes next"
          >
            <p className="market-eyebrow">Choosing what comes next</p>
            <h2>
              What could you
              <br />
              <em>take on next?</em>
            </h2>
            <p>
              Use what you have done to choose a meaningful next stretch. For
              Maya, that means testing a small batch without overcommitting.
            </p>
            <p>
              Earlier success informs preparation. It does not guarantee the
              next result. You choose the next commitment.
            </p>
            <button className="market-text" onClick={() => start("vision")}>
              Start with your vision
            </button>
          </section>
          <section
            id="membership"
            className="membership-section"
            aria-label="Membership and getting started"
          >
            <div className="market-wrap">
              <div className="membership-layout">
                <div>
                  <p className="market-eyebrow">Membership</p>
                  <h2>
                    Make room for
                    <br />
                    <em>a goal that matters.</em>
                  </h2>
                  <p>
                    A demanding goal, credible preparation and Proof you can use
                    again. Keep pursuing new goals with the experience of
                    earlier attempts close at hand.
                  </p>
                </div>
                <div className="membership-offer">
                  <p className="membership-price">
                    $8.99<span> / month, planned</span>
                  </p>
                  <p>
                    Planned membership includes a 14-day trial. This private
                    test is free. Billing and trial activation are not enabled.
                  </p>
                  <button
                    className="market-primary"
                    onClick={() => start("goal")}
                  >
                    Start a pursuit
                  </button>
                  <button
                    className="market-text"
                    onClick={() => start("vision")}
                  >
                    I have a vision for myself
                  </button>
                </div>
              </div>
              <div className="market-faq">
                <h3>Before you start</h3>
                <details>
                  <summary>What if my goal is not clear yet?</summary>
                  <p>
                    Save your vision as a draft. Define a significant
                    accomplishment, its observable outcome and its preparation
                    plan before activating it.
                  </p>
                </details>
                <details>
                  <summary>Do I need to check in every day?</summary>
                  <p>
                    Return when scheduled work needs an update. Report done,
                    partly done or didn’t happen. For a partial result or miss,
                    name what prevented it and what you will change.
                  </p>
                </details>
                <details>
                  <summary>What happens to my writing?</summary>
                  <p>
                    Your draft stays on this device before sign-in. After you
                    sign in and save, acknowledged work belongs to your private
                    account. Local preview is labeled separately.
                  </p>
                </details>
              </div>
              <p className="prototype-disclosure">
                Maya’s demonstration uses fictional data and illustrative
                photography, not a customer testimonial. It never becomes your
                personal history. This private test includes no live AI,
                billing, calendar connection, wallpaper tools or public sharing.
              </p>
            </div>
          </section>
        </main>
        <footer className="market-footer market-wrap">
          <Brand />
          <button className="market-text" onClick={() => setMotion(!motion)}>
            {motion ? "Pause motion" : "Enable motion"}
          </button>
        </footer>
      </div>
      <dialog
        ref={dialog}
        className="product-modal"
        aria-label="Fictional example Proof"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const items = [
            ...e.currentTarget.querySelectorAll<HTMLElement>(
              'button, a[href], input, select, textarea, [tabindex="0"]',
            ),
          ].filter((el) => !el.hasAttribute("disabled"));
          const first = items[0],
            last = items.at(-1);
          if (
            (e.shiftKey && document.activeElement === first) ||
            (!e.shiftKey && document.activeElement === last)
          ) {
            e.preventDefault();
            (e.shiftKey ? last : first)?.focus();
          }
        }}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <header>
          <Brand mineral />
          <button autoFocus onClick={close}>
            Close example
          </button>
        </header>
        <Example />
      </dialog>
    </div>
  );
}
