import { StepTimer, pauseTimer } from "./StepTimer";
import { firstMoveExample } from "./guidance";
import { useState } from "react";
import type { EntryDraft } from "../data/drafts";
import { Art, Choice, Help, Input, Page } from "./ui";
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
export interface EntryExperience {
  step: number;
  flowVersion?: number;
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
  const [help, setHelp] = useState(false);
  const patch = (v: Partial<EntryExperience>) =>
    change({ experience: { ...x, ...v } });
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
  // Keep legacy numeric step identities so saved drafts never change meaning.
  const sequence = [0, 1, 3, 4, 7, 8, 9, 10];
  const step = sequence.includes(x.step) ? x.step : x.step === 2 ? 3 : 7;
  const go = (step: number) => patch({ step, flowVersion: 2 });
  const titles = [
    "What brings you here?",
    "Who will you become?",
    "Where will you stretch?",
    "Choose your challenge.",
    "Why this challenge?",
    "Make the stretch real.",
    "What gets in the way?",
    "What can you do now?",
    "Give it your attention.",
    "How did it go?",
    "Keep what you’ve started.",
  ];
  const subs = [
    "Choose what fits best right now.",
    "Picture yourself doing something difficult that matters to you. Who do you want to be in that moment?",
    "Choose a place to begin.",
    "What big accomplishment would help you become that person?",
    "Why does it matter to you, and how will it help you grow?",
    "Name the finish. See what it asks of you.",
    "Be honest about what could hold you back.",
    "Choose one useful preparation step you can finish in a minute or two.",
    "Do the action you chose. Come back and tell us how it went.",
    "Your honest account is the beginning of Proof.",
    "One real step. Something to build on.",
  ];
  const required = [
    x.pain,
    draft.vision,
    x.domain,
    draft.words,
    draft.meaning,
    draft.outcome.trim() && x.stretch,
    x.barrier,
    x.first.action.trim() && x.first.criterion,
    true,
    x.first.result &&
      x.first.detail.trim() &&
      (x.first.result === "done" ||
        (x.first.prevented.trim() && x.first.adjustment.trim())),
    true,
  ];
  const pick = (key: "pain" | "domain" | "barrier", values: string[]) => (
    <div className="choices">
      {values.map((v) => (
        <Choice
          key={v}
          selected={x[key] === v}
          onClick={() => patch({ [key]: v })}
        >
          {v}
        </Choice>
      ))}
      <Input
        label="In my own words"
        required={false}
        value={values.includes(x[key]) ? "" : x[key]}
        onChange={(v) => patch({ [key]: v })}
        placeholder="Tell us what brings you here..."
      />
    </div>
  );
  const input = (
    key: "vision" | "words" | "meaning" | "outcome",
    label: string,
    placeholder: string,
  ) => (
    <Input
      label={label}
      value={draft[key]}
      onChange={(v) => change({ [key]: v })}
      placeholder={placeholder}
    />
  );
  const next = () => {
    if (step === 10) {
      onFinish();
      return;
    }
    if (step === 9 && x.first.result !== "done") {
      onFinish();
      return;
    }
    go(sequence[sequence.indexOf(step) + 1]);
  };
  return (
    <Page
      title={titles[step] ?? titles[0]}
      sub={subs[step]}
      dark={[1, 3, 8, 10].includes(step)}
      progress={step < 8 ? [sequence.indexOf(step) + 1, 5] : undefined}
      back={() => (step ? go(sequence[sequence.indexOf(step) - 1]) : back())}
      footer={
        <>
          {error && <p role="alert">{error}</p>}
          {step === 8 ? (
            <>
              <button
                className="button"
                disabled={saving}
                onClick={() => {
                  pauseTimer(`entry:${draft.id}:${x.first.id}`);
                  go(9);
                }}
              >
                Check in
              </button>
              <button className="quiet" onClick={() => go(7)}>
                Choose a different step
              </button>
            </>
          ) : (
            <button
              className="button"
              disabled={
                saving ||
                !(typeof required[step] === "string"
                  ? String(required[step]).trim()
                  : required[step])
              }
              onClick={next}
            >
              {saving
                ? "Saving…"
                : step === 10
                  ? signedIn
                    ? "Open Basecamp"
                    : "Sign in to save"
                  : step === 9
                    ? "Record what happened"
                    : step === 7
                      ? "Do it now"
                      : "Continue"}
            </button>
          )}
          {step >= 7 && (
            <button
              className="quiet"
              disabled={
                saving ||
                !draft.words.trim() ||
                !draft.vision.trim() ||
                !draft.meaning.trim()
              }
              onClick={onFinish}
            >
              Save and finish later
            </button>
          )}
          <button
            className="quiet"
            onClick={() => setHelp(!help)}
            aria-expanded={help}
          >
            Help
          </button>
          {help && (
            <p className="small">
              Your words stay on this device until you choose to save them to
              your account. Each answer helps you prepare for the ambition you
              chose.
            </p>
          )}
        </>
      }
    >
      {step === 0 &&
        pick("pain", [
          "I’m ready to take on more",
          "I want to believe in myself",
          "I keep putting off something big",
          "I want to finish what I start",
          "I want to make time for myself",
          "I’m looking for direction",
        ])}
      {step === 1 && (
        <>
          {input("vision", "Your future self", "I want to become someone who…")}
          <Help
            ambition={draft.words}
            field="what would you trust yourself to do that you hesitate to do today?"
          />
        </>
      )}
      {step === 2 &&
        pick("domain", [
          "Body & adventure",
          "Work & creation",
          "Courage & expression",
          "Learning & mastery",
        ])}
      {step === 3 && (
        <>
          {input("words", "My challenge", "I will…")}
          <Help
            ambition={draft.vision}
            field="what accomplishment would give you real evidence of that change? Name what you would do or make."
          />
        </>
      )}
      {step === 4 &&
        input("meaning", "Your reason", "This matters to me because…")}
      {step === 5 && (
        <>
          {input(
            "outcome",
            "I will know I have done it when…",
            "Describe the observable finish...",
          )}
          <Input
            label="What makes this a stretch?"
            value={x.stretch}
            onChange={(v) => patch({ stretch: v })}
            placeholder="This will ask me to…"
          />
        </>
      )}
      {step === 6 &&
        pick("barrier", [
          "Time",
          "Confidence",
          "Skill",
          "Making room",
          "Fear of trying",
        ])}
      {step === 7 && (
        <>
          <Input
            label="What will you do now?"
            value={x.first.action}
            onChange={(v) => first({ action: v })}
            placeholder="My first action is..."
          />
          <Input
            label="What will be done?"
            value={x.first.criterion}
            onChange={(v) => first({ criterion: v })}
            placeholder="I’ll have finished this action when..."
          />
          <Help
            ambition={draft.words}
            example={firstMoveExample(draft.words)}
            field="what useful preparation can you finish in one or two minutes? Keep it specific and achievable now."
          />
        </>
      )}
      {step === 8 && (
        <div className="focus-move">
          <h2>{x.first.action}</h2>
          <StepTimer identity={`entry:${draft.id}:${x.first.id}`} />
          <p>Done means: {x.first.criterion}</p>
          {x.first.started && (
            <p role="status">
              Take the time you need. Come back when you have tried.
            </p>
          )}
        </div>
      )}
      {step === 9 && (
        <>
          <div className="choices">
            {(
              [
                ["done", "Done"],
                ["partly", "Partly"],
                ["did_not_happen", "Not yet"],
              ] as const
            ).map(([r, label]) => (
              <Choice
                key={r}
                selected={x.first.result === r}
                onClick={() => first({ result: r })}
              >
                {label}
              </Choice>
            ))}
          </div>
          <Input
            label="What happened?"
            value={x.first.detail}
            onChange={(v) => first({ detail: v })}
            placeholder="Write a short, factual account…"
          />
          {x.first.result && x.first.result !== "done" && (
            <>
              <Input
                label="What prevented it?"
                value={x.first.prevented}
                onChange={(v) => first({ prevented: v })}
              />
              <Input
                label="What will you change?"
                value={x.first.adjustment}
                onChange={(v) => first({ adjustment: v })}
              />
            </>
          )}
        </>
      )}
      {step === 10 && (
        <>
          <Art kind="path" />
          <p className="first-proof">{x.first.detail}</p>
          <p className="small">
            Your first account is kept on this device. Sign in to keep it in
            your Proof.
          </p>
        </>
      )}
    </Page>
  );
}
