// Onboarding (November 2026): one continuous guided conversation, a plan
// reveal, then a first step. The questions are fixed; nobody chats with the AI.
// Answers save to the same draft fields as before. Parts the AI will fill in
// (the crafted challenge, milestones) are left blank until that service exists.
import { areas, areaLabel } from "./Areas";
import physical from "../assets/illustrations/illo-physical.webp";
import professional from "../assets/illustrations/illo-professional.webp";
import personal from "../assets/illustrations/illo-personal.webp";
const onboardingArt = { physical, professional, personal };
import { firstMoveExample } from "./guidance";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { EntryDraft } from "../data/drafts";
import { newAIIntake, validWeeklyMinutes, type AIIntake } from "../data/aiIntake";
import { Help, SupportMode } from "./ui";
import { TabIcon } from "./Earned";
import { DraftKept } from "./Notice";
export interface FirstMove {
  id: string;
  action: string;
  criterion: string;
  result: "" | "done" | "partly" | "did_not_happen";
  detail: string;
  prevented: string;
  adjustment: string;
  started: boolean;
}
export type EntryScreen =
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "q9"
  | "build"
  | "reveal"
  | "first"
  | "doing"
  | "checkin"
  | "keep";
export interface EntryExperience {
  step: number;
  flowVersion?: number;
  /** Where the member is in the conversation. Older drafts only have `step`. */
  screen?: EntryScreen;
  entryIntent?: "goal" | "discover";
  supportMode?: "guided" | "on_request";
  supportOperationId?: string;
  pain: string;
  domain: string;
  stretch: string;
  barrier: string;
  first: FirstMove;
}
export const newEntryExperience = (): EntryExperience => ({
  step: 0,
  flowVersion: 2,
  pain: "",
  domain: "",
  stretch: "",
  barrier: "",
  first: {
    id: crypto.randomUUID(),
    action: "",
    criterion: "",
    result: "",
    detail: "",
    prevented: "",
    adjustment: "",
    started: false,
  },
});

const questionScreens: EntryScreen[] = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
];
const order: EntryScreen[] = [
  ...questionScreens,
  "build",
  "reveal",
  "first",
  "doing",
  "checkin",
  "keep",
];
// Legacy numeric step identities are still written so older code and saved
// drafts never change meaning.
const legacyStep: Record<EntryScreen, number> = {
  q1: 0,
  q2: 1,
  q3: 1,
  q4: 3,
  q5: 4,
  q6: 4,
  q7: 4,
  q8: 4,
  q9: 4,
  build: 5,
  reveal: 5,
  first: 7,
  doing: 8,
  checkin: 9,
  keep: 10,
};
export function entryScreen(x: EntryExperience): EntryScreen {
  if (x.screen && order.includes(x.screen)) return x.screen;
  switch (x.step) {
    case 0:
      return "q1";
    case 1:
      return "q2";
    case 2:
    case 3:
      return "q4";
    case 4:
      return "q5";
    case 5:
    case 6:
      return "q6";
    case 8:
      return "doing";
    case 9:
      return "checkin";
    case 10:
      return "keep";
    default:
      return "first";
  }
}

export const weeklyTimeChoices: [string, string][] = [
  ["60", "About 1 hour"],
  ["120", "2 hours"],
  ["210", "3–4 hours"],
  ["300", "5+ hours"],
];
export const weeklyTimeLabel = (minutes: string) =>
  weeklyTimeChoices.find(([value]) => value === minutes)?.[1] ??
  (validWeeklyMinutes(minutes) ? `${minutes} minutes` : "");

/** The member's own time, limits, starting point and resources, joined for
 * the saved plan fields. Nothing is added that they did not write or choose. */
export function planInputs(draft: EntryDraft) {
  const intake = draft.aiIntake;
  if (!intake) return {};
  const time = weeklyTimeLabel(intake.weeklyMinutes);
  const lines = (values: (string | undefined)[]) =>
    values
      .map((v) => (v ?? "").trim())
      .filter(Boolean)
      .join("\n");
  return {
    constraints: lines([
      time ? `${time} a week` : "",
      intake.schedule,
      intake.limitations,
    ]),
    capabilities: lines([intake.startingAbility, intake.resources]),
  };
}

interface SpeechResult {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechResult) => void) | null;
  onend: (() => void) | null;
  onerror: ((e?: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
}
/** False when the page's Permissions-Policy header forbids the microphone
 * (as the production headers do today), so no dead button is shown. */
function microphoneAllowed() {
  if (typeof document === "undefined") return false;
  const policy = (
    document as unknown as {
      featurePolicy?: { allowsFeature?: (name: string) => boolean };
    }
  ).featurePolicy;
  try {
    return policy?.allowsFeature ? policy.allowsFeature("microphone") : true;
  } catch {
    return true;
  }
}
/** Voice input where the browser supports and allows it; hidden otherwise. */
function useDictation(onText: (text: string) => void) {
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : ((
          window as unknown as {
            SpeechRecognition?: new () => Recognition;
            webkitSpeechRecognition?: new () => Recognition;
          }
        ).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: new () => Recognition })
          .webkitSpeechRecognition);
  const active = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [blocked, setBlocked] = useState(() => !microphoneAllowed());
  useEffect(() => () => active.current?.stop(), []);
  if (!Ctor || blocked) return null;
  return {
    listening,
    toggle() {
      if (active.current) {
        active.current.stop();
        return;
      }
      try {
        const r = new Ctor();
        r.lang = navigator.language || "en-US";
        r.interimResults = false;
        r.onresult = (e) => {
          const text = Array.from(e.results)
            .map((result) => result[0]?.transcript ?? "")
            .join(" ")
            .trim();
          if (text) onText(text);
        };
        r.onend = () => {
          active.current = null;
          setListening(false);
        };
        r.onerror = (e) => {
          active.current = null;
          setListening(false);
          // Refused by the browser or the site policy: stop offering it.
          if (e?.error === "not-allowed" || e?.error === "service-not-allowed")
            setBlocked(true);
        };
        active.current = r;
        setListening(true);
        r.start();
      } catch {
        active.current = null;
        setListening(false);
      }
    },
  };
}

function Arrow() {
  return (
    <svg
      className="eo-arrow"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="eo-back" aria-label="Go back" onClick={onClick}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>
  );
}
/** A written answer: a labelled field with voice input where supported. */
function Answer({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const id = useId();
  const latest = useRef(value);
  latest.current = value;
  const voice = useDictation((text) =>
    onChange(latest.current.trim() ? `${latest.current.trim()} ${text}` : text),
  );
  return (
    <div className="eo-field">
      <label htmlFor={id}>{label}</label>
      <div className="eo-field-box">
        <textarea
          id={id}
          rows={rows}
          maxLength={10000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {voice && (
          <button
            type="button"
            className="eo-mic"
            aria-label={voice.listening ? "Stop listening" : "Speak your answer"}
            aria-pressed={voice.listening}
            onClick={voice.toggle}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
function Pick({
  selected,
  onClick,
  children,
  shape = "pill",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  shape?: "pill" | "block";
}) {
  return (
    <button
      type="button"
      className={shape === "pill" ? "eo-chip" : "eo-choice"}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Onboarding({
  draft,
  change,
  signedIn,
  saving,
  error,
  onFinish,
  back,
}: {
  draft: EntryDraft;
  change: (v: Partial<EntryDraft>) => void;
  signedIn: boolean;
  saving: boolean;
  error: string;
  onFinish: () => void;
  back: () => void;
}) {
  const x = draft.experience ?? newEntryExperience();
  const [freshIntake] = useState(newAIIntake);
  const intake = draft.aiIntake ?? freshIntake;
  const screen = entryScreen(x);
  const intent = x.entryIntent;
  const heading = useRef<HTMLHeadingElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const patch = (v: Partial<EntryExperience>) =>
    change({ experience: { ...x, ...v } });
  const answer = (v: Partial<AIIntake>) =>
    change({ aiIntake: { ...intake, ...v } });
  const go = (next: EntryScreen) =>
    patch({ screen: next, step: legacyStep[next], flowVersion: 3 });
  const first = (v: Partial<FirstMove>) =>
    patch({
      first: {
        ...x.first,
        ...(v.action !== undefined || v.criterion !== undefined
          ? {
              started: false,
              result: "" as const,
              detail: "",
              prevented: "",
              adjustment: "",
            }
          : {}),
        ...v,
      },
    });
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    // Keep the newest question in view; earlier ones slide up and out.
    const el = thread.current;
    if (!el || typeof el.scrollTo !== "function") return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: still ? "auto" : "smooth" });
    // The thread gets shorter when an answer field appears; stay pinned.
    if (typeof ResizeObserver === "undefined") return;
    const pin = new ResizeObserver(() => {
      el.scrollTop = el.scrollHeight;
    });
    pin.observe(el);
    return () => pin.disconnect();
  }, [screen]);
  // The plan service is not connected yet: show the building screen for a
  // moment, then the reveal with its AI parts left blank.
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    if (screen !== "build") return;
    const timer = window.setTimeout(() => goRef.current("reveal"), 2600);
    return () => window.clearTimeout(timer);
  }, [screen]);

  const time = weeklyTimeLabel(intake.weeklyMinutes);
  const questions: Record<
    string,
    { title: string; note: string; said: string; ready: boolean }
  > = {
    q1: {
      title: "Where do you want to grow?",
      note: "Start with one area. You can add the others later.",
      said: draft.area ? areaLabel(draft.area) : "",
      ready: !!draft.area,
    },
    q2: {
      title:
        intent === "discover"
          ? "What would you like to trust yourself to do?"
          : "Who will you become?",
      note: "Everything else is built from this answer. Your challenge, your milestones and every step are designed to move you toward this person. It can be who you believe you can be, or who you have always wished you could be.",
      said: draft.vision.trim(),
      ready: !!draft.vision.trim(),
    },
    q3: {
      title: "What lights you up?",
      note: "Things you love doing, used to love, or have always been curious about. They are how the challenge becomes yours.",
      said: intake.interests.trim(),
      ready: !!intake.interests.trim(),
    },
    q4: {
      title: "Do you have a challenge in mind?",
      note: "What big accomplishment would help you become that person? Bring your own, or have one crafted from your answers.",
      said: intent === "discover" ? "Help me craft one" : draft.words.trim(),
      ready: intent === "discover" || (intent === "goal" && !!draft.words.trim()),
    },
    q5: {
      title: "Why does this matter to you?",
      note: "Say it plainly. It keeps the plan pointed at what you care about.",
      said: draft.meaning.trim(),
      ready: !!draft.meaning.trim(),
    },
    q6: {
      title: "Where are you starting from?",
      note: "What can you comfortably do today? A recent example helps. If you don’t know yet, say so. Don’t guess a number.",
      said: intake.startingAbility.trim(),
      ready: !!intake.startingAbility.trim(),
    },
    q7: {
      title: "How much time can you give it each week?",
      note: "Be honest, not ambitious. A plan you can keep beats a bigger one you can’t.",
      said: [time, intake.schedule?.trim()].filter(Boolean).join(" · "),
      ready: validWeeklyMinutes(intake.weeklyMinutes),
    },
    q8: {
      title: "What do you have to work with?",
      note: "Places, equipment, people, a budget. “Not much yet” is a fine answer.",
      said: intake.resources.trim(),
      ready: !!intake.resources.trim(),
    },
    q9: {
      title: "What should your plan work around?",
      note: "Injuries, health, travel, family, anything that sets a real limit. Every step is designed to respect it.",
      said: intake.limitations.trim(),
      ready: !!intake.limitations.trim(),
    },
  };
  const index = order.indexOf(screen);
  const previous = () => (index > 0 ? go(order[index - 1]) : back());
  const canSaveLater =
    !!draft.vision.trim() &&
    !!draft.meaning.trim() &&
    (!!draft.words.trim() || intent === "discover");
  const alert = error && (
    <p className="eo-alert" role="alert">
      {error}
    </p>
  );

  let content: ReactNode;
  if (questionScreens.includes(screen)) {
    const q = questions[screen];
    const n = questionScreens.indexOf(screen) + 1;
    const history = questionScreens
      .slice(0, n - 1)
      .map((s) => ({ screen: s, ...questions[s] }))
      .filter((h) => h.said);
    content = (
      <>
        <header className="eo-top">
          <BackButton onClick={previous} />
          <div className="eo-progress" aria-hidden="true">
            <span style={{ width: `${(n / questionScreens.length) * 100}%` }} />
          </div>
          <p className="eo-count" aria-label={`Question ${n} of ${questionScreens.length}`}>
            {n} of {questionScreens.length}
          </p>
        </header>
        <main id="main" className="eo-main">
          <div className="eo-thread" ref={thread}>
            {history.map((h) => (
              <div className="eo-turn" key={h.screen}>
                <p className="eo-asked">{h.title}</p>
                <button
                  className="eo-said"
                  aria-label={`Change your answer: ${h.said}`}
                  onClick={() => go(h.screen)}
                >
                  {h.said}
                </button>
              </div>
            ))}
            <div className="eo-guide" key={screen}>
              <span className="eo-avatar" aria-hidden="true">
                <TabIcon name="now" />
              </span>
              <div className="eo-bubbles">
                <span className="eo-typing" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <div className="eo-bubble eo-question">
                  <h1 ref={heading} tabIndex={-1}>
                    {q.title}
                  </h1>
                </div>
                <div className="eo-bubble eo-note">
                  <p>{q.note}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="eo-answer" key={"a-" + screen}>
            {screen === "q1" && (
              <div className="eo-areas" role="group" aria-label="Choose an area">
                {areas.map((a) => (
                  <button
                    aria-label={areaLabel(a)}
                    className="eo-area"
                    key={a}
                    aria-pressed={draft.area === a}
                    onClick={() => change({ area: a })}
                  >
                    <span>
                      <strong>{areaLabel(a)}</strong>
                      <small>
                        {
                          {
                            physical: "A stronger, more resilient you.",
                            professional: "A more purposeful, impactful you.",
                            personal: "A more courageous, connected you.",
                          }[a]
                        }
                      </small>
                    </span>
                    <img src={onboardingArt[a]} alt="" />
                  </button>
                ))}
              </div>
            )}
            {screen === "q2" && (
              <>
                {!draft.vision.trim() && (
                  <div className="eo-chips" role="group" aria-label="Ways to begin">
                    {[
                      "I know I can be",
                      "I’ve always wished I could",
                      "I want to trust myself to",
                    ].map((starter) => (
                      <Pick
                        key={starter}
                        selected={false}
                        onClick={() => change({ vision: starter + " " })}
                      >
                        {starter}…
                      </Pick>
                    ))}
                  </div>
                )}
                <Answer
                  label="Your future self"
                  value={draft.vision}
                  onChange={(vision) => change({ vision })}
                  placeholder="I know I can be…"
                />
                <Help
                  ambition={draft.words}
                  field="what would you trust yourself to do that you hesitate to do today?"
                />
              </>
            )}
            {screen === "q3" && (
              <Answer
                label="What I love"
                value={intake.interests}
                onChange={(interests) => answer({ interests })}
                placeholder="Add a few, or say you’re not sure."
              />
            )}
            {screen === "q4" && (
              <>
                <div
                  className="eo-pair"
                  role="group"
                  aria-label="Do you have a challenge in mind?"
                >
                  <Pick
                    shape="block"
                    selected={intent === "goal"}
                    onClick={() => patch({ entryIntent: "goal" })}
                  >
                    I have one
                  </Pick>
                  <Pick
                    shape="block"
                    selected={intent === "discover"}
                    onClick={() => patch({ entryIntent: "discover" })}
                  >
                    Help me craft one
                  </Pick>
                </div>
                {intent === "goal" && (
                  <>
                    <Answer
                      label="My challenge"
                      value={draft.words}
                      onChange={(words) => change({ words })}
                      placeholder="I will…"
                    />
                    <Help
                      ambition={draft.vision}
                      field="what accomplishment would give you real evidence of that change? Name what you would do or make."
                    />
                  </>
                )}
                {intent === "discover" && (
                  <p className="eo-reply">
                    Good. Your challenge will be shaped from who you want to
                    become, what lights you up and where you are today. You’ll
                    see it with your plan.
                  </p>
                )}
              </>
            )}
            {screen === "q5" && (
              <Answer
                label="Your reason"
                value={draft.meaning}
                onChange={(meaning) => change({ meaning })}
                placeholder="This matters to me because…"
              />
            )}
            {screen === "q6" && (
              <Answer
                label="My starting point"
                value={intake.startingAbility}
                onChange={(startingAbility) => answer({ startingAbility })}
                placeholder="A recent example: how long or far, and how it felt."
              />
            )}
            {screen === "q7" && (
              <>
                <div className="eo-chips" role="group" aria-label="Time each week">
                  {weeklyTimeChoices.map(([value, label]) => (
                    <Pick
                      key={value}
                      selected={intake.weeklyMinutes === value}
                      onClick={() => answer({ weeklyMinutes: value })}
                    >
                      {label}
                    </Pick>
                  ))}
                </div>
                <Answer
                  label="Days or times that work best"
                  value={intake.schedule ?? ""}
                  onChange={(schedule) => answer({ schedule })}
                  placeholder="Mornings, lunch breaks, weekends…"
                  rows={1}
                />
              </>
            )}
            {screen === "q8" && (
              <Answer
                label="What I have"
                value={intake.resources}
                onChange={(resources) => answer({ resources })}
                placeholder="Places, equipment, people…"
              />
            )}
            {screen === "q9" && (
              <>
                {!intake.limitations.trim() && (
                  <div className="eo-chips">
                    <Pick
                      selected={false}
                      onClick={() => answer({ limitations: "Nothing I know of" })}
                    >
                      Nothing I know of
                    </Pick>
                  </div>
                )}
                <Answer
                  label="My limits"
                  value={intake.limitations}
                  onChange={(limitations) => answer({ limitations })}
                  placeholder="Anything the plan must respect."
                />
              </>
            )}
            {alert}
            <button
              className="button eo-primary"
              disabled={saving || !q.ready}
              onClick={() => go(order[index + 1])}
            >
              {screen === "q9" ? "Build my plan" : "Continue"}
              <Arrow />
            </button>
            <div className="eo-foot">
              <DraftKept />
              <button className="eo-quiet" disabled={saving} onClick={back}>
                Save and exit
              </button>
            </div>
          </div>
        </main>
      </>
    );
  } else if (screen === "build") {
    content = (
      <main id="main" className="eo-main eo-building">
        <div className="eo-build" role="status">
          <span className="eo-build-mark" aria-hidden="true">
            <TabIcon name="now" />
          </span>
          <h1 ref={heading} tabIndex={-1}>
            Building your plan.
          </h1>
          <p>
            Milestones and steps, designed around your answers. This takes a
            moment.
          </p>
          <dl className="eo-card eo-build-inputs">
            <dt>Built around</dt>
            <dd className="eo-build-vision">{draft.vision}</dd>
            {(time || intake.schedule?.trim()) && (
              <dd>
                {[time ? `${time} a week` : "", intake.schedule?.trim()]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            )}
            {intake.limitations.trim() && <dd>{intake.limitations}</dd>}
          </dl>
        </div>
        <div className="eo-answer eo-answer-plain">
          <DraftKept label="Your answers are kept on this device" />
        </div>
      </main>
    );
  } else if (screen === "reveal") {
    const own = intent !== "discover" && draft.words.trim();
    content = (
      <main id="main" className="eo-main eo-reveal">
        <div className="eo-hero">
          <img src={onboardingArt[draft.area ?? "physical"]} alt="" />
          <BackButton onClick={() => go("q9")} />
        </div>
        <div className="eo-reveal-body">
          <p className="es-eyebrow eo-eyebrow">A person worth challenging</p>
          {own ? (
            <h1 ref={heading} tabIndex={-1}>
              {draft.words}
            </h1>
          ) : (
            <>
              <h1 ref={heading} tabIndex={-1} className="visually-hidden">
                Your challenge
              </h1>
              <div className="eo-blank eo-blank-title" aria-hidden="true">
                <span />
                <span />
              </div>
              <p className="visually-hidden">
                Your challenge will appear here.
              </p>
            </>
          )}
          <dl className="eo-becoming">
            <dt>Becoming</dt>
            <dd>{draft.vision}</dd>
          </dl>
          <section className="eo-card eo-milestones" aria-label="Your milestones">
            <h2>Your milestones</h2>
            <p className="visually-hidden">Your milestones will appear here.</p>
            <ol aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>
                  <span className="eo-blank">
                    <span />
                    <span />
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <p className="eo-small">
            This plan is built for where you are today. As you check in, it
            adjusts to how you grow.
          </p>
        </div>
        <div className="eo-answer eo-answer-plain">
          {alert}
          <button
            className="button eo-primary"
            disabled={saving}
            onClick={() =>
              change({
                ...planInputs(draft),
                experience: {
                  ...x,
                  screen: "first",
                  step: legacyStep.first,
                  flowVersion: 3,
                },
              })
            }
          >
            Make it mine
            <Arrow />
          </button>
        </div>
      </main>
    );
  } else {
    const titles: Record<string, [string, string]> = {
      first: [
        "What can you do now?",
        "Choose one useful preparation step you can finish in a minute or two.",
      ],
      doing: [
        "Give it your attention.",
        "Go and do it now. Come back when you have tried.",
      ],
      checkin: ["How did it go?", "Your honest account is the beginning of Proof."],
      keep: ["Keep what you’ve started.", "One real step. Something to build on."],
    };
    const [title, sub] = titles[screen];
    const recorded =
      x.first.result &&
      x.first.detail.trim() &&
      (x.first.result === "done" ||
        (x.first.prevented.trim() && x.first.adjustment.trim()));
    content = (
      <>
        <header className="eo-top">
          <BackButton
            onClick={() =>
              screen === "first" ? go("reveal") : go(order[index - 1])
            }
          />
          <p className="es-eyebrow eo-eyebrow">Your first step</p>
        </header>
        <main id="main" className="eo-main">
          <div className="eo-page">
            <h1 ref={heading} tabIndex={-1} className="eo-title">
              {title}
            </h1>
            <p className="eo-sub">{sub}</p>
            {screen === "first" && (
              <>
                <Answer
                  label="What will you do now?"
                  value={x.first.action}
                  onChange={(v) => first({ action: v })}
                  placeholder="My first action is..."
                  rows={1}
                />
                <Answer
                  label="What will be done?"
                  value={x.first.criterion}
                  onChange={(v) => first({ criterion: v })}
                  placeholder="I’ll have finished this action when..."
                  rows={1}
                />
                <Help
                  ambition={draft.words}
                  example={firstMoveExample(draft.words)}
                  field="what useful preparation can you finish in one or two minutes? Keep it specific and achievable now."
                />
              </>
            )}
            {screen === "doing" && (
              <div className="eo-card eo-doing">
                <h2>{x.first.action}</h2>
                <p>Done means: {x.first.criterion}</p>
              </div>
            )}
            {screen === "checkin" && (
              <>
                <div className="eo-results" role="group" aria-label="Result">
                  {(
                    [
                      ["done", "Done"],
                      ["partly", "Partly"],
                      ["did_not_happen", "Not yet"],
                    ] as const
                  ).map(([r, label]) => (
                    <button
                      type="button"
                      key={r}
                      className="eo-result"
                      data-result={r}
                      aria-pressed={x.first.result === r}
                      onClick={() => first({ result: r })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Answer
                  label="What happened?"
                  value={x.first.detail}
                  onChange={(v) => first({ detail: v })}
                  placeholder="Write a short, factual account…"
                  rows={3}
                />
                {x.first.result && x.first.result !== "done" && (
                  <>
                    <Answer
                      label="What prevented it?"
                      value={x.first.prevented}
                      onChange={(v) => first({ prevented: v })}
                    />
                    <Answer
                      label="What will you change?"
                      value={x.first.adjustment}
                      onChange={(v) => first({ adjustment: v })}
                    />
                  </>
                )}
              </>
            )}
            {screen === "keep" && (
              <>
                <div className="eo-card eo-kept">
                  {x.first.action.trim() && <h2>{x.first.action}</h2>}
                  <p className="first-proof">{x.first.detail}</p>
                </div>
                <DraftKept label="Your first account is kept on this device. Sign in to keep it in your Proof." />
              </>
            )}
          </div>
          <div className="eo-answer eo-answer-plain">
            {alert}
            {screen === "first" && (
              <button
                className="button eo-primary"
                disabled={
                  saving || !x.first.action.trim() || !x.first.criterion.trim()
                }
                onClick={() => go("doing")}
              >
                Do it now
                <Arrow />
              </button>
            )}
            {screen === "doing" && (
              <>
                <button
                  className="button eo-primary"
                  disabled={saving}
                  onClick={() => go("checkin")}
                >
                  Check in
                  <Arrow />
                </button>
                <button className="eo-quiet" onClick={() => go("first")}>
                  Choose a different step
                </button>
              </>
            )}
            {screen === "checkin" && (
              <button
                className="button eo-primary"
                disabled={saving || !recorded}
                onClick={() =>
                  x.first.result === "done" ? go("keep") : onFinish()
                }
              >
                {saving ? "Saving…" : "Record what happened"}
                <Arrow />
              </button>
            )}
            {screen === "keep" && (
              <button
                className="button eo-primary"
                disabled={saving}
                onClick={onFinish}
              >
                {saving ? "Saving…" : signedIn ? "Open Now" : "Sign in to save"}
                <Arrow />
              </button>
            )}
            {screen !== "keep" && (
              <button
                className="eo-quiet"
                disabled={saving || !canSaveLater}
                onClick={onFinish}
              >
                Save and finish later
              </button>
            )}
          </div>
        </main>
      </>
    );
  }
  return (
    <SupportMode.Provider value={x.supportMode || "on_request"}>
      <div id="es-entry" className="eo" data-screen={screen}>
        {content}
      </div>
    </SupportMode.Provider>
  );
}
