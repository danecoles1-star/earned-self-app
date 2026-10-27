import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { createPreviewAdapter } from "../src/preview/adapter";
import {
  aiIntakeEnabled,
  intakeProfile,
  newAIIntake,
  validWeeklyMinutes,
} from "../src/data/aiIntake";
import { loadDraft } from "../src/data/drafts";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
  history.replaceState({}, "", "/start");
  vi.stubEnv("VITE_AI_ONBOARDING_PREVIEW", "true");
  vi.stubEnv("VITE_SUPABASE_URL", "https://sujfjefijybvywchibbk.supabase.co");
});
afterEach(() => vi.unstubAllEnvs());
it("only enables intake on the explicitly configured development project", () => {
  expect(
    aiIntakeEnabled("true", "https://sujfjefijybvywchibbk.supabase.co"),
  ).toBe(true);
  expect(
    aiIntakeEnabled("true", "https://vovmkiuxmtnedfosoxds.supabase.co"),
  ).toBe(false);
  expect(
    aiIntakeEnabled(undefined, "https://sujfjefijybvywchibbk.supabase.co"),
  ).toBe(false);
});
it("rejects invented or invalid weekly budgets and preserves explicit unknowns", () => {
  for (const value of ["", "0", "-1", "1.5", "10081", "Infinity"])
    expect(validWeeklyMinutes(value)).toBe(false);
  const intake = {
    ...newAIIntake(),
    startingAbility: "Unknown",
    weeklyMinutes: "90",
    resources: "None",
    limitations: "Unsure",
    interests: "Walking\nHiking",
    timezone: "America/Denver",
  };
  expect(intakeProfile(intake, "Build confidence")).toEqual({
    desired_growth: "Build confidence",
    starting_ability: "Unknown",
    weekly_minutes: 90,
    resources: ["None"],
    limitations: ["Unsure"],
    interests: ["Walking", "Hiking"],
    timezone: "America/Denver",
    locale: intake.locale,
  });
  expect(() =>
    intakeProfile({ ...intake, timezone: "not-a-zone" }, "Build confidence"),
  ).toThrow();
});
it("persists discovery answers across remounts without requiring a challenge or creating Proof", async () => {
  const u = userEvent.setup();
  const adapter = createPreviewAdapter();
  const execute = vi.spyOn(adapter, "execute");
  let view = render(<App adapter={adapter} />);
  await screen.findByRole("heading", { name: "What will you grow into?" });
  await u.click(
    screen.getByRole("button", { name: "Help me find my challenge" }),
  );
  await u.click(screen.getByRole("button", { name: "Physical", exact: true }));
  await u.type(
    screen.getByLabelText("Who do you want to become?"),
    "Someone who can hike confidently",
  );
  expect(
    screen.queryByLabelText("What challenge do you have in mind?"),
  ).toBeNull();
  await u.click(screen.getByRole("button", { name: "Continue", exact: true }));
  await u.type(
    screen.getByLabelText("What can you do comfortably today?"),
    "I can walk for 20 minutes on level ground.",
  );
  await u.type(
    screen.getByLabelText(
      "What interests or experiences would make this meaningful?",
    ),
    "Hiking",
  );
  view.unmount();
  view = render(<App adapter={adapter} />);
  await screen.findByRole("heading", { name: "Start where you are." });
  expect(
    screen.getByLabelText("What can you do comfortably today?"),
  ).toHaveValue("I can walk for 20 minutes on level ground.");
  await u.click(screen.getByRole("button", { name: "Continue", exact: true }));
  expect(
    screen.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await u.type(screen.getByLabelText(/How many minutes/), "90");
  await u.type(
    screen.getByLabelText("What resources do you have access to?"),
    "Walking shoes and nearby trails",
  );
  await u.type(
    screen.getByLabelText("What limitations should the plan respect?"),
    "Weekends only",
  );
  await u.click(screen.getByRole("button", { name: "Continue", exact: true }));
  expect(
    screen.getByRole("heading", { name: "Your starting point." }),
  ).toBeVisible();
  expect(
    screen.getByText(/No challenge, plan, or Proof has been created/),
  ).toBeVisible();
  expect(loadDraft().aiIntake?.weeklyMinutes).toBe("90");
  expect(loadDraft().boundOwner).toBe((await adapter.getUser())?.id);
  expect(loadDraft().words).toBe("");
  expect(execute).not.toHaveBeenCalled();
  expect((await adapter.read()).evidence).toHaveLength(0);
});
it("requires an existing challenge only on that entry path", async () => {
  const u = userEvent.setup();
  render(<App adapter={createPreviewAdapter()} />);
  await screen.findByRole("heading", { name: "What will you grow into?" });
  await u.click(screen.getByRole("button", { name: "Personal", exact: true }));
  await u.type(
    screen.getByLabelText("Who do you want to become?"),
    "More confident",
  );
  expect(
    screen.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await u.type(
    screen.getByLabelText("What challenge do you have in mind?"),
    "Deliver a speech",
  );
  expect(
    screen.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
});
