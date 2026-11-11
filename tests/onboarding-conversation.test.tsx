// November 2026 onboarding: a fixed nine-question conversation, a plan reveal
// whose AI parts stay blank until the plan service exists, then a first step.
import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  Onboarding,
  entryScreen,
  newEntryExperience,
  planInputs,
  type EntryScreen,
} from "../src/experience/Onboarding";
import { Notices } from "../src/experience/Notice";
import { newAIIntake } from "../src/data/aiIntake";
import { loadDraft, saveDraft, type EntryDraft } from "../src/data/drafts";
import { resumeEntry } from "../src/data/resumeEntry";
import { emptyFoundation, emptySnapshot, type Adapter } from "../src/data/types";

beforeEach(() => localStorage.clear());

const blank = (): EntryDraft => ({
  ...emptyFoundation(),
  id: "d",
  operationId: "o",
  boundOwner: null,
  experience: newEntryExperience(),
});
const at = (where: EntryScreen, extra: Partial<EntryDraft> = {}): EntryDraft => {
  const draft = { ...blank(), ...extra };
  draft.experience = { ...draft.experience!, screen: where, flowVersion: 3 };
  return draft;
};
function Harness({
  initial,
  seen,
  onFinish = () => {},
}: {
  initial: EntryDraft;
  seen: { draft: EntryDraft };
  onFinish?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  seen.draft = draft;
  return (
    <Onboarding
      draft={draft}
      change={(v) => setDraft((d) => ({ ...d, ...v }))}
      signedIn={false}
      saving={false}
      error=""
      onFinish={onFinish}
      back={() => {}}
    />
  );
}
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const press = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name, exact: true }));
const heading = (name: string) => screen.getByRole("heading", { name });

it("asks the nine questions in order and saves each answer to the existing draft fields", () => {
  const seen = { draft: blank() };
  render(<Harness initial={blank()} seen={seen} />);
  expect(heading("Where do you want to grow?")).toBeVisible();
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  press("Physical");
  press("Continue");
  expect(heading("Who will you become?")).toBeVisible();
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  type("Your future self", "Someone who climbs into my seventies");
  press("Continue");
  expect(heading("What lights you up?")).toBeVisible();
  type("What I love", "Trails before sunrise");
  press("Continue");
  expect(heading("Do you have a challenge in mind?")).toBeVisible();
  // Neither path is chosen for the member.
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  press("I have one");
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  type("My challenge", "Summit a 14er");
  press("Continue");
  expect(heading("Why does this matter to you?")).toBeVisible();
  type("Your reason", "To stay strong");
  press("Continue");
  expect(heading("Where are you starting from?")).toBeVisible();
  type("My starting point", "Five mile day hikes");
  press("Continue");
  expect(heading("How much time can you give it each week?")).toBeVisible();
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  press("3–4 hours");
  type("Days or times that work best", "Mornings");
  press("Continue");
  expect(heading("What do you have to work with?")).toBeVisible();
  type("What I have", "Boots and a pack");
  press("Continue");
  expect(heading("What should your plan work around?")).toBeVisible();
  press("Nothing I know of");
  press("Build my plan");
  expect(heading("Building your plan.")).toBeVisible();

  const d = seen.draft;
  expect(d.area).toBe("physical");
  expect(d.vision).toBe("Someone who climbs into my seventies");
  expect(d.words).toBe("Summit a 14er");
  expect(d.meaning).toBe("To stay strong");
  expect(d.experience?.entryIntent).toBe("goal");
  expect(d.aiIntake).toMatchObject({
    interests: "Trails before sunrise",
    startingAbility: "Five mile day hikes",
    weeklyMinutes: "210",
    schedule: "Mornings",
    resources: "Boots and a pack",
    limitations: "Nothing I know of",
  });
  expect(entryScreen(d.experience!)).toBe("build");
});

it("earlier answers stay in the thread and reopen their question", () => {
  const seen = { draft: blank() };
  render(
    <Harness
      initial={at("q3", { area: "personal", vision: "Someone who speaks up" })}
      seen={seen}
    />,
  );
  expect(screen.getByText("Who will you become?")).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Change your answer: Someone who speaks up",
    }),
  );
  expect(heading("Who will you become?")).toBeVisible();
  expect(screen.getByLabelText("Your future self")).toHaveValue(
    "Someone who speaks up",
  );
});

it("a member can ask for a challenge to be crafted without writing one", () => {
  const seen = { draft: blank() };
  render(
    <Harness
      initial={at("q4", { area: "personal", vision: "Someone who speaks up" })}
      seen={seen}
    />,
  );
  press("Help me craft one");
  expect(screen.queryByLabelText("My challenge")).toBeNull();
  expect(screen.getByText(/Your challenge will be shaped from/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  expect(seen.draft.experience?.entryIntent).toBe("discover");
  expect(seen.draft.words).toBe("");
});

it("the building screen leads to a reveal that invents nothing", () => {
  vi.useFakeTimers();
  try {
    const seen = { draft: blank() };
    render(
      <Harness
        initial={at("build", {
          area: "physical",
          vision: "Someone who climbs",
          experience: { ...newEntryExperience(), entryIntent: "discover" },
        })}
        seen={seen}
      />,
    );
    expect(heading("Building your plan.")).toBeVisible();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("A person worth challenging")).toBeVisible();
    // The crafted challenge and the milestones are the plan service's to fill.
    expect(screen.getByText("Your challenge will appear here.")).toBeDefined();
    expect(screen.getByText("Your milestones will appear here.")).toBeDefined();
    expect(screen.getByText("Someone who climbs")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Change/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Make it mine/ })).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});

it("making the plan mine carries the member's own time and limits into the saved plan fields", () => {
  const seen = { draft: blank() };
  const intake = {
    ...newAIIntake(),
    startingAbility: "Five mile day hikes",
    weeklyMinutes: "210",
    schedule: "Mornings",
    resources: "Boots and a pack",
    limitations: "A tight left knee",
  };
  const initial = at("reveal", {
    area: "physical",
    vision: "Someone who climbs",
    words: "Summit a 14er",
    aiIntake: intake,
    experience: { ...newEntryExperience(), entryIntent: "goal" },
  });
  expect(planInputs(initial)).toEqual({
    constraints: "3–4 hours a week\nMornings\nA tight left knee",
    capabilities: "Five mile day hikes\nBoots and a pack",
  });
  render(<Harness initial={initial} seen={seen} />);
  expect(heading("Summit a 14er")).toBeVisible();
  press("Make it mine");
  expect(heading("What can you do now?")).toBeVisible();
  expect(seen.draft.constraints).toBe(
    "3–4 hours a week\nMornings\nA tight left knee",
  );
  expect(seen.draft.capabilities).toBe("Five mile day hikes\nBoots and a pack");
  // A first step still needs both answers before it can begin.
  expect(screen.getByRole("button", { name: "Do it now" })).toBeDisabled();
  type("What will you do now?", "Choose which 14er");
  type("What will be done?", "One peak written down");
  press("Do it now");
  expect(heading("Choose which 14er")).toBeVisible();
  expect(screen.queryByLabelText("Elapsed time")).toBeNull();
});

it("a first step that did not happen still needs what prevented it and what will change", () => {
  const onFinish = vi.fn();
  const seen = { draft: blank() };
  const x = newEntryExperience();
  x.first.action = "Choose which 14er";
  x.first.criterion = "One peak written down";
  render(
    <Harness
      initial={at("checkin", {
        vision: "Someone who climbs",
        words: "Summit a 14er",
        meaning: "To stay strong",
        experience: x,
      })}
      seen={seen}
      onFinish={onFinish}
    />,
  );
  press("Not yet");
  type("What happened?", "Ran out of time");
  expect(
    screen.getByRole("button", { name: "Record what happened" }),
  ).toBeDisabled();
  type("What prevented it?", "A late meeting");
  type("What will you change?", "Do it before work");
  press("Record what happened");
  expect(onFinish).toHaveBeenCalledOnce();
  expect(seen.draft.experience?.first).toMatchObject({
    result: "did_not_happen",
    detail: "Ran out of time",
    prevented: "A late meeting",
    adjustment: "Do it before work",
  });
});

it("drafts saved by the earlier onboarding open at the matching screen", () => {
  const x = newEntryExperience();
  expect(entryScreen({ ...x, step: 0 })).toBe("q1");
  expect(entryScreen({ ...x, step: 1 })).toBe("q2");
  expect(entryScreen({ ...x, step: 3 })).toBe("q4");
  expect(entryScreen({ ...x, step: 7 })).toBe("first");
  expect(entryScreen({ ...x, step: 8 })).toBe("doing");
  expect(entryScreen({ ...x, step: 9 })).toBe("checkin");
  expect(entryScreen({ ...x, step: 10 })).toBe("keep");
});

it("a crafted-challenge draft saves on its vision alone; a blank challenge otherwise does not", async () => {
  const draft = {
    ...loadDraft(),
    vision: "Someone who speaks up",
    experience: { ...newEntryExperience(), entryIntent: "discover" as const },
  };
  saveDraft(draft);
  const state = emptySnapshot();
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: async () => ({ id: "a" }),
    subscribe: () => () => {},
    signIn: async () => {},
    signOut: async () => {},
    read: async () => state,
    execute: vi.fn(async (c) => {
      if (c.kind === "goal")
        state.goals.push({
          ...draft,
          owner_id: "a",
          kind: "goal",
          status: "draft",
          revision: 1,
          version: 1,
          created_at: "now",
        });
      return { id: String(c.payload.id), version: 1 };
    }),
  };
  await resumeEntry(adapter, draft);
  expect(state.goals).toHaveLength(1);
  expect(vi.mocked(adapter.execute).mock.calls[0][0].payload.words).toBe("");

  localStorage.clear();
  const own = {
    ...loadDraft(),
    vision: "Someone who speaks up",
    experience: { ...newEntryExperience(), entryIntent: "goal" as const },
  };
  saveDraft(own);
  await expect(resumeEntry(adapter, own)).rejects.toThrow(
    "Finish your vision and challenge before saving.",
  );
});

it("save and error notices share one status region and the error can be dismissed", () => {
  const dismiss = vi.fn();
  const view = render(<Notices notice="Saving…" error="" onDismiss={dismiss} />);
  expect(screen.getByRole("status")).toHaveTextContent("Saving…");
  expect(screen.getByRole("status")).toHaveAttribute("data-tone", "saving");
  view.rerender(
    <Notices
      notice="Not saved. Your input is still here."
      error="Connection interrupted."
      onDismiss={dismiss}
    />,
  );
  expect(screen.getByRole("status")).toHaveAttribute("data-tone", "failed");
  expect(screen.getByRole("alert")).toHaveTextContent("Connection interrupted.");
  fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));
  expect(dismiss).toHaveBeenCalledOnce();
  view.rerender(
    <Notices notice="Saved to your account." error="" onDismiss={dismiss} />,
  );
  expect(screen.getByRole("status")).toHaveAttribute("data-tone", "saved");
  expect(screen.queryByRole("alert")).toBeNull();
});
