import { useState } from "react";
import type { EntryDraft } from "../data/drafts";
import {
  intakeProfile,
  newAIIntake,
  validTimezone,
  validWeeklyMinutes,
  type AIIntake,
} from "../data/aiIntake";
import { Page, Input, Choice } from "./ui";
import { areaLabel, areas } from "./Areas";
import { newEntryExperience } from "./Onboarding";
import physical from "../assets/illustrations/illo-physical.webp";
import professional from "../assets/illustrations/illo-professional.webp";
import personal from "../assets/illustrations/illo-personal.webp";
const artwork = { physical, professional, personal };
const titles = [
  "What will you grow into?",
  "Start where you are.",
  "Make room for the work.",
  "Your starting point.",
];
export function AIOnboarding({
  draft,
  change,
  back,
  error,
}: {
  draft: EntryDraft;
  change: (v: Partial<EntryDraft>) => void;
  back: () => void;
  error: string;
}) {
  const [initial] = useState(newAIIntake);
  const intake = draft.aiIntake ?? initial;
  const page =
    Number.isInteger(intake.page) && intake.page >= 0 && intake.page <= 3
      ? intake.page
      : 0;
  const intent = draft.experience?.entryIntent ?? "goal";
  const patch = (v: Partial<AIIntake>) =>
    change({ aiIntake: { ...intake, ...v } });
  const setIntent = (entryIntent: "goal" | "discover") =>
    change({
      experience: {
        ...(draft.experience ?? newEntryExperience()),
        entryIntent,
      },
    });
  const ready = [
    !!draft.area &&
      !!draft.vision.trim() &&
      (intent === "discover" || !!draft.words.trim()),
    !!intake.startingAbility.trim() && !!intake.interests.trim(),
    validWeeklyMinutes(intake.weeklyMinutes) &&
      !!intake.resources.trim() &&
      !!intake.limitations.trim() &&
      validTimezone(intake.timezone),
    false,
  ];
  let complete = false;
  try {
    intakeProfile(intake, draft.vision);
    complete = !!draft.area && (intent === "discover" || !!draft.words.trim());
  } catch {
    /* Incomplete drafts stay editable. */
  }
  return (
    <Page
      className="onboarding-flow ai-onboarding"
      title={titles[page]}
      sub={
        [
          "Bring an ambition, or explore what would be a meaningful stretch.",
          "A useful plan starts with what you can actually do today.",
          "Build a plan around your real life, with enough room to follow through.",
          "Check these answers before the AI helps shape your challenge.",
        ][page]
      }
      progress={[page + 1, 4]}
      back={() => (page ? patch({ page: page - 1 }) : back())}
      footer={
        <>
          {error && <p role="alert">{error}</p>}
          {page < 3 && (
            <button
              className="button"
              disabled={!ready[page] || !!error}
              onClick={() => patch({ page: page + 1 })}
            >
              Continue
            </button>
          )}
          <button className="quiet" disabled={!!error} onClick={back}>
            Save and exit
          </button>
          <p className="small">
            Development preview. Answers stay on this device; they are not yet
            saved to your account.
          </p>
        </>
      }
    >
      {page === 0 && (
        <>
          <div className="ai-entry-choices">
            <Choice
              selected={intent === "goal"}
              onClick={() => setIntent("goal")}
            >
              I have a challenge
            </Choice>
            <Choice
              selected={intent === "discover"}
              onClick={() => setIntent("discover")}
            >
              Help me find my challenge
            </Choice>
          </div>
          <div className="ai-area-choices">
            {areas.map((area) => (
              <button
                key={area}
                className="ai-area-choice"
                aria-pressed={draft.area === area}
                onClick={() => change({ area })}
              >
                <img src={artwork[area]} alt="" />
                <span>{areaLabel(area)}</span>
              </button>
            ))}
          </div>
          <Input
            label="Who do you want to become?"
            value={draft.vision}
            onChange={(vision) => change({ vision })}
            placeholder="I want to trust myself to…"
          />
          {intent === "goal" && (
            <Input
              label="What challenge do you have in mind?"
              value={draft.words}
              onChange={(words) => change({ words })}
              placeholder="It does not need to be perfectly defined yet."
            />
          )}
          {intent === "discover" && (
            <p>
              You do not need to name a challenge yet. Your interests and
              starting ability will help shape the possibilities.
            </p>
          )}
        </>
      )}
      {page === 1 && (
        <>
          <Input
            label="What can you do comfortably today?"
            value={intake.startingAbility}
            onChange={(startingAbility) => patch({ startingAbility })}
            placeholder={
              draft.area === "physical"
                ? "Describe a recent activity: how long or far, how it felt, and any relevant experience."
                : draft.area === "professional"
                  ? "What have you already tried or done? Where do you need practice?"
                  : "Describe your experience and something you can already do."
            }
          />
          <p className="small">
            Specific examples help. If you do not know your starting ability
            yet, say so. Do not guess a measurement.
          </p>
          <Input
            label="What interests or experiences would make this meaningful?"
            value={intake.interests}
            onChange={(interests) => patch({ interests })}
            placeholder="Add one interest per line, or tell us you are unsure."
          />
        </>
      )}
      {page === 2 && (
        <>
          <div className="open-input">
            <label htmlFor="ai-weekly-minutes">
              How many minutes can you realistically set aside each week?
            </label>
            <input
              id="ai-weekly-minutes"
              type="number"
              inputMode="numeric"
              min="1"
              max="10080"
              step="1"
              value={intake.weeklyMinutes}
              onChange={(e) => patch({ weeklyMinutes: e.target.value })}
            />
          </div>
          <p className="small">
            This is your total weekly budget, not the length of every step.
            Exact days and session times come next when scheduling is connected.
          </p>
          <Input
            label="What resources do you have access to?"
            value={intake.resources}
            onChange={(resources) => patch({ resources })}
            placeholder="Equipment, places, tools, or other resources. Write none or unsure if appropriate."
          />
          <Input
            label="What limitations should the plan respect?"
            value={intake.limitations}
            onChange={(limitations) => patch({ limitations })}
            placeholder="Time constraints, access, experience, or physical limitations. Write none known or unsure if appropriate."
          />
          <div className="open-input">
            <label htmlFor="ai-timezone">Your time zone</label>
            <input
              id="ai-timezone"
              value={intake.timezone}
              onChange={(e) => patch({ timezone: e.target.value })}
              aria-invalid={!validTimezone(intake.timezone)}
            />
          </div>
          {!validTimezone(intake.timezone) && (
            <p role="alert">Enter a valid time zone, such as America/Denver.</p>
          )}
        </>
      )}
      {page === 3 && (
        <>
          <dl className="ai-intake-review">
            {[
              ["Area", draft.area ? areaLabel(draft.area) : "Not chosen"],
              ["Who you want to become", draft.vision],
              [
                "Challenge",
                intent === "discover" ? "Help me discover one" : draft.words,
              ],
              ["Starting ability", intake.startingAbility],
              ["Interests", intake.interests],
              ["Weekly time", intake.weeklyMinutes + " minutes"],
              ["Resources", intake.resources],
              ["Limitations", intake.limitations],
              ["Time zone", intake.timezone],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <button className="quiet" onClick={() => patch({ page: 0 })}>
            Edit my answers
          </button>
          <div className="ai-connection-state" role="status">
            <h2>
              {complete
                ? "Your answers are ready for the next stage."
                : "Some answers still need attention."}
            </h2>
            <p>
              AI challenge recommendations and planning are not connected in
              this preview. No challenge, plan, or Proof has been created.
            </p>
            <p>
              Once connected, you will review the proposed challenge. After you
              confirm it, AI will create its milestones and steps. You will not
              need to choose or assemble those steps yourself.
            </p>
          </div>
        </>
      )}
    </Page>
  );
}
