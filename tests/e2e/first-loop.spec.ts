import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
const output = process.env.ES_SCREENSHOTS_DIR ?? "test-results/screenshots";
async function bounds(p: Page) {
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
}
async function shot(p: Page, name: string) {
  fs.mkdirSync(output, { recursive: true });
  await bounds(p);
  await p.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
async function setup(p: Page) {
  await p.goto("/");
  await p
    .getByRole("button", { name: "Start a pursuit", exact: true })
    .first()
    .click();
  await p
    .getByLabel("Who do you want to become? (optional)", { exact: true })
    .fill("Become a working maker.");
  await p.getByRole("button", { name: "Keep my draft and continue" }).click();
  await p.reload();
  await p.getByRole("button", { name: "Enter local preview" }).click();
  await p.getByRole("button", { name: "Save pursuit draft" }).click();
  await expect(
    p.getByRole("heading", { name: "Make the plan real." }),
  ).toBeVisible();
}
async function plan(p: Page) {
  for (const [label, value] of [
    [
      "What significant accomplishment would move you toward that vision?",
      "Launch my ceramics business",
    ],
    ["What would completing it look like?", "Three paid orders fulfilled"],
    ["Why this matters now", "I have postponed this"],
    ["Important constraints or risks", "Keep my job"],
    ["Capabilities to develop", "Cost production"],
    ["Important unknowns to resolve", "Repeat demand"],
  ])
    await p.getByLabel(label + " (optional)", { exact: true }).fill(value);
  await p.getByRole("checkbox").check();
  await p.getByRole("button", { name: "Add milestone" }).click();
  await p
    .getByLabel("Milestone 1 title (optional)")
    .fill("Validate collection");
  await p
    .getByLabel("Milestone 1 completion criteria (optional)")
    .fill("Cost six pieces");
  await p
    .getByLabel("Milestone 1 deadline date", { exact: true })
    .fill("2030-12-01");
  await p
    .getByLabel("Milestone 1 deadline time", { exact: true })
    .fill("17:00");
  await p.getByLabel("Milestone 1 deadline time zone").fill("America/Denver");
  await p.getByRole("button", { name: "Save preparation draft" }).click();
  await p.getByRole("button", { name: "Schedule first action" }).click();
}
async function action(p: Page, date = "2000-01-01") {
  await p.getByLabel("Your next action").fill("Cost the collection");
  await p.getByLabel("Action done means").fill("Six costs saved");
  await p.getByLabel("Action date", { exact: true }).fill(date);
  await p.getByLabel("Action time", { exact: true }).fill("12:00");
  await p.getByLabel("Action time zone").fill("America/Denver");
}
for (const width of [375, 390, 430, 768, 1024, 1440])
  test(`structured pursuit and Proof at ${width}`, async ({ page: p }) => {
    await p.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("/");
    await shot(p, `homepage-${width}`);
    await setup(p);
    await shot(p, `draft-${width}`);
    await plan(p);
    await action(p);
    await shot(p, `action-${width}`);
    await p.getByRole("button", { name: "Activate pursuit" }).click();
    await expect(
      p.getByRole("heading", { name: "Your commitment needs an update." }),
    ).toBeVisible();
    await shot(p, `pursuit-${width}`);
    await p.getByRole("button", { name: "Didn’t happen", exact: true }).click();
    await p.getByLabel("What prevented it?").fill("Overloaded day");
    await p.getByLabel("What will you change?").fill("Protect lunch");
    await p.getByRole("button", { name: "Test next save failure" }).click();
    await p.getByRole("button", { name: "Save preparation result" }).click();
    await expect(p.getByRole("alert")).toContainText("save failed");
    await p.getByRole("button", { name: "Save preparation result" }).click();
    await expect(
      p.getByRole("heading", { name: "The result is part of your Proof." }),
    ).toBeVisible();
    await shot(p, `proof-detail-${width}`);
    await p.getByRole("button", { name: "Choose what comes next" }).click();
    await p.getByRole("button", { name: "Schedule next action" }).click();
    await action(p, "2030-10-01");
    await p.getByLabel("What will change in this plan?").fill("Protect lunch");
    await p.getByRole("button", { name: "Commit to this action" }).click();
    await p.getByRole("button", { name: "Done", exact: true }).click();
    await p.getByRole("button", { name: "Save preparation result" }).click();
    await p.getByRole("button", { name: "Choose what comes next" }).click();
    await p
      .getByText("Complete this preparation milestone", { exact: true })
      .click();
    await p
      .getByLabel("What completed this milestone?")
      .fill("Cost sheet complete");
    await p
      .getByRole("button", { name: "Complete milestone and advance" })
      .click();
    await expect(
      p.getByRole("heading", { name: "All planned milestones completed." }),
    ).toBeVisible();
    await p
      .getByText("Choose the pursuit’s next state", { exact: true })
      .click();
    await p
      .getByLabel("Your decision", { exact: true })
      .selectOption("completed");
    await p
      .getByLabel("What actually happened at the major accomplishment?")
      .fill("Three paid orders fulfilled");
    await p
      .getByLabel("Your own reflection")
      .fill("I launched it. Now test repeat demand.");
    await p.getByLabel("What comes next?").fill("Test production pace");
    await p.getByRole("button", { name: "Save pursuit decision" }).click();
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await expect(p.getByRole("heading", { name: "Your Proof." })).toBeVisible();
    await expect(p.locator("main")).toContainText("Didn’t happen");
    await expect(p.locator("main")).toContainText(
      "Major accomplishment completed",
    );
    await expect(p.locator("main")).not.toContainText("Maya");
    await shot(p, `proof-${width}`);
    await p.reload();
    await expect(p.getByRole("heading", { name: "Your Proof." })).toBeVisible();
    expect(errors).toEqual([]);
  });
test("keyboard, public example isolation and required scheduling", async ({
  page: p,
}) => {
  await p.goto("/");
  const open = p.getByRole("button", { name: "See this example" });
  await open.focus();
  await p.keyboard.press("Enter");
  await expect(p.getByRole("dialog")).toBeVisible();
  await p.keyboard.press("Tab");
  expect(
    await p.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await p.keyboard.press("Escape");
  await expect(open).toBeFocused();
  await p.getByRole("button", { name: "Sign in", exact: true }).click();
  await p.getByRole("button", { name: "Enter local preview" }).click();
  await expect(p.locator("main")).not.toContainText("Maya");
  await p.getByRole("button", { name: "Start a pursuit", exact: true }).click();
  const field = p.getByLabel("Who do you want to become? (optional)", {
    exact: true,
  });
  await field.focus();
  await p.keyboard.type("My vision");
  await p.keyboard.press("Tab");
  await expect(
    p.getByLabel(
      "What significant accomplishment would move you toward that vision? (optional)",
      { exact: true },
    ),
  ).toBeFocused();
  await p.getByRole("button", { name: "Save pursuit draft" }).click();
  await plan(p);
  await action(p, "2030-10-01");
  await p.getByLabel("Action time", { exact: true }).fill("");
  await p.getByRole("button", { name: "Activate pursuit" }).click();
  await expect(
    p.getByRole("heading", { name: "Put the work on the calendar." }),
  ).toBeVisible();
  expect(
    await p
      .getByLabel("Action time", { exact: true })
      .evaluate((e: HTMLInputElement) => e.validity.valueMissing),
  ).toBe(true);
});
test("reschedule, pause, resume and changed direction retain history", async ({
  page: p,
}) => {
  await setup(p);
  await plan(p);
  await action(p, "2030-10-01");
  await p.getByRole("button", { name: "Activate pursuit" }).click();
  await p.getByRole("button", { name: "Revise action and schedule" }).click();
  await p.getByLabel("Action date", { exact: true }).fill("2030-10-02");
  await p.getByLabel("What will change in this plan?").fill("Protected time");
  await p.getByRole("button", { name: "Save revised agreement" }).click();
  await expect(p.getByText(/The date changed 1 time/)).toBeVisible();
  await p.getByText("Choose the pursuit’s next state", { exact: true }).click();
  await p
    .getByLabel("Why are you making this decision?")
    .fill("Resolve blocker");
  await p.getByRole("button", { name: "Save pursuit decision" }).click();
  await expect(
    p.getByRole("heading", { name: "Paused pursuit" }),
  ).toBeVisible();
  await p.getByText("Choose the pursuit’s next state", { exact: true }).click();
  await p.getByLabel("Your decision", { exact: true }).selectOption("active");
  await p.getByLabel("Why are you making this decision?").fill("Ready");
  await p.getByRole("button", { name: "Save pursuit decision" }).click();
  await expect(
    p.getByRole("heading", { name: "Active pursuit" }),
  ).toBeVisible();
  await p.getByText("Choose the pursuit’s next state", { exact: true }).click();
  await p
    .getByLabel("Your decision", { exact: true })
    .selectOption("changed_direction");
  await p
    .getByLabel("Why are you making this decision?")
    .fill("Different ambition");
  await p.getByRole("button", { name: "Save pursuit decision" }).click();
  await expect(
    p.getByRole("heading", { name: "Changed direction" }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Proof", exact: true }).click();
  await expect(p.locator("main")).toContainText("Protected time");
  await expect(p.locator("main")).toContainText("Unreported");
});

test("homepage recognizes an authenticated returning member", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  const accountButton = page.getByRole("button", {
    name: "My pursuit",
    exact: true,
  });
  await expect(accountButton).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  await accountButton.click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
});
