import { test, expect } from "@playwright/test";
import { emptySnapshot, emptyFoundation } from "../../src/data/types";
import fs from "node:fs";

test("legacy draft with an outstanding move can report, then finish preparation on mobile and desktop", async ({
  page,
}) => {
  const s = emptySnapshot(),
    owner = "local-preview-member",
    g = "11111111-1111-4111-8111-111111111111",
    c = "22222222-2222-4222-8222-222222222222";
  s.selectedGoal = g;
  s.goals = [
    {
      ...emptyFoundation(),
      id: g,
      owner_id: owner,
      kind: "goal",
      words: "Finish my creative project",
      vision: "Become someone who follows through",
      meaning: "My own reason",
      created_at: "2026-01-01",
      revision: 1,
      version: 1,
      status: "draft",
    },
  ];
  s.commitments = [
    {
      id: c,
      owner_id: owner,
      goal_id: g,
      milestone_id: null,
      plan_revision: null,
      revision: 1,
      version: 1,
      state: "active",
      created_at: "2026-01-01",
    },
  ];
  s.definitions = [
    {
      commitment_id: c,
      goal_id: g,
      revision: 1,
      action: "Choose a working title",
      criterion: "One title selected",
      mode: "quick",
    },
  ];
  await page.addInitScript(
    ({ s }) => {
      if (!localStorage.getItem("pilot-fixture")) {
        localStorage.setItem(
          "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
          JSON.stringify({ snapshot: s, receipts: {} }),
        );
        localStorage.setItem(
          "earned-self:LOCAL-PREVIEW-ONLY:session",
          "active",
        );
        localStorage.setItem("pilot-fixture", "yes");
      }
    },
    { s },
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const output = process.env.ES_SCREENSHOTS_DIR || "test-results/screenshots";
  fs.mkdirSync(output, { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app");
    await expect(
      page.getByRole("button", { name: "Begin my move", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Prepare my ambition" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Add my move to a calendar" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: `${output}/pilot-legacy-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto("/plan/" + g);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Report what happened", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByLabel("What happened?", { exact: true })
    .fill("I selected the title for my project.");
  await page
    .getByRole("button", { name: "Save to Proof", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proof\//);
  await page.goto("/app");
  await page
    .getByRole("button", { name: "Prepare my ambition", exact: true })
    .click();
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("signed-out browser cannot reopen an account-bound onboarding draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "earned-self:preview-only:entry-draft:v2",
      JSON.stringify({
        id: "private",
        operationId: "private-op",
        boundOwner: "another-account",
        words: "Private writing",
        vision: "Private vision",
      }),
    );
  });
  await page.goto("/start");
  await expect(
    page.getByRole("heading", { name: "Sign in to open your saved draft." }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByText("Private vision", { exact: true })).toHaveCount(
    0,
  );
});
