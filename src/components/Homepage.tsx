import { useEffect, useRef, useState } from "react";
import { Brand, Mark } from "./Brand";
import ceramics from "../assets/business.webp";
// Marketing-only immutable illustration. No adapter, member IDs, import or save operations.
function Example() {
  return (
    <div className="example-detail">
      <p className="eyebrow">Maya's fictional ceramics example</p>
      <h2>Your first customer.</h2>
      <p>Received and fulfilled a first paid order.</p>
      <div className="record-passage">
        <p className="eyebrow">When I started</p>
        <blockquote>
          “I have talked about this for years. I do not know if anyone would
          pay.”
        </blockquote>
      </div>
      <div className="record-passage chapter-after">
        <p className="eyebrow">What actually happened</p>
        <p>
          Asked a customer a specific question. One message received no reply.
          Returned with a clearer offer and fulfilled one paid order.
        </p>
      </div>
      <div className="record-passage">
        <p className="eyebrow">What I learned</p>
        <p>
          One order showed someone would pay. Repeat demand and production
          capacity still needed testing.
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
            <a href="#the-record">The Record</a>
            <button onClick={signIn}>{signedIn ? "My goal" : "Sign in"}</button>
          </nav>
        </header>
        <main id="main" tabIndex={-1}>
          <section
            className="market-hero market-wrap"
            aria-label="Choose a goal"
          >
            <div className="hero-writing">
              <p className="market-eyebrow">
                Personal growth, through real experience
              </p>
              <h1>
                Choose a goal.
                <br />
                Make the next move.
                <br />
                <em>Keep the evidence.</em>
              </h1>
              <p className="hero-description">
                Earned Self helps you turn a meaningful goal into a clear
                commitment, make room for it, and record what happened.
              </p>
              <div className="hero-actions">
                <button
                  className="market-primary"
                  onClick={() => start("goal")}
                >
                  Start with a goal
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
              <div className="record-demo-label">
                <Mark />
                <span>Fictional example · Maya’s ceramics goal</span>
              </div>
              <div className="record-passage chapter-before">
                <p className="eyebrow">When I started</p>
                <blockquote>
                  “I have talked about this for years. I do not know if anyone
                  would pay.”
                </blockquote>
              </div>
              <div className="record-passage chapter-after">
                <p className="eyebrow">What actually happened</p>
                <h2>Received and fulfilled a first paid order.</h2>
              </div>
              <div className="record-passage chapter-meaning">
                <p className="eyebrow">What I learned</p>
                <p>
                  One order showed someone would pay. Repeat demand and
                  production capacity still needed testing.
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
                  Your goal.
                  <br />
                  <em>One clear commitment.</em>
                </h2>
              </div>
              <p>
                Choose something you have been putting off. Decide what you will
                do next and what will count as done. The larger goal stays
                visible as you prepare. After each attempt, choose the next
                action or leave it unscheduled.
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
                <p className="market-eyebrow">Maya’s goal</p>
                <h3>Launch a small ceramics business.</h3>
                <div className="demo-step">
                  <p className="market-eyebrow">The next commitment</p>
                  <h4>
                    Ask one potential customer about their last ceramics
                    purchase.
                  </h4>
                  <p>
                    After lunch, 15 minutes. Done means sending the question.
                    Getting a reply is a separate result.
                  </p>
                  <button className="market-primary" onClick={open}>
                    See this example
                  </button>
                </div>
              </div>
            </div>
            <div className="method-line">
              <p>
                <span>1. Prepare</span>Identify what you need to learn or
                arrange.
              </p>
              <p>
                <span>2. Make room</span>Choose a time that fits your day, or
                leave it open.
              </p>
              <p>
                <span>3. Record</span>Done, partly, or didn’t happen. Detail is
                optional.
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
                  The missed commitment stays in your Record. Choose a different
                  next action or return when you are ready.
                </p>
                <button className="market-light" onClick={() => start("goal")}>
                  Choose your next action
                </button>
              </div>
              <div className="return-excerpt">
                <div className="record-passage">
                  <p className="eyebrow">Missed</p>
                  <h3>The planned message was not sent.</h3>
                  <p>Work ran late. Maya recorded what happened.</p>
                </div>
                <div className="record-passage">
                  <p className="eyebrow">Returned</p>
                  <h3>A specific question, sent after lunch.</h3>
                  <p>The earlier miss stayed in her Record.</p>
                </div>
              </div>
            </div>
          </section>
          <section
            id="the-record"
            className="market-wrap growing-record"
            aria-label="The Record over time"
          >
            <div className="record-intro">
              <p className="market-eyebrow">The Record over time</p>
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
            <div className="record-timeline">
              <ol>
                <li>
                  <span>Day 14</span>
                  <h3>A question sent. No reply.</h3>
                  <p>
                    Maya kept sending the message separate from receiving an
                    answer.
                  </p>
                </li>
                <li>
                  <span>Day 45</span>
                  <h3>A first paid order fulfilled.</h3>
                  <p>She recorded the costs and time involved.</p>
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
                Open the example Record
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
                    Planning, short check-ins and a Record you can use again.
                    Keep pursuing new goals with the experience of earlier
                    attempts close at hand.
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
                    Start with a goal
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
                    Start with a goal or a vision in your own words. Choose a
                    useful first action and say what will count as done.
                  </p>
                </details>
                <details>
                  <summary>Do I need to check in every day?</summary>
                  <p>
                    No. Return after an action or when you need to choose your
                    next step. A quick status is enough. Reflection is optional.
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
        aria-label="Fictional example Record"
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
