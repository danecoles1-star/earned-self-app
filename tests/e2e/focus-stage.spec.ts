import { test, expect, type Page } from "@playwright/test";
import { applyLocal, type LocalStore } from "../../src/data/domain";
import { emptySnapshot, type Command } from "../../src/data/types";
import { foundation, action } from "../fixtures";
const owner = "local-preview-member";
function fixture() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) => {
    store = applyLocal(
      store,
      { kind, payload, actorId: owner, operationId: crypto.randomUUID() },
      owner,
    ).store;
  };
  send("goal", { ...foundation, id: "g" });
  send("status", {
    goalId: "g",
    version: 1,
    status: "completed",
    detail: "Three paid orders delivered",
    reflection: "I can make work that people value",
    next: "Keep testing ideas with real customers",
  });
  send("goal", {
    ...foundation,
    id: "next",
    words: "Exhibit a new collection",
    vision: "Become a maker who shares ambitious work",
  });
  send("commitment", {
    ...action,
    id: "next-step",
    goalId: "next",
    action: "Sketch three possibilities",
    criterion: "Three distinct sketches on paper",
  });
  store.snapshot.selectedGoal = "next";
  return store;
}
async function seed(p: Page, s: LocalStore) {
  await p.goto("/");
  await p.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem(
      "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
      JSON.stringify(s),
    );
    localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
  }, s);
  await p.goto("/app");
}
async function capture(p: Page, state: string, width: number) {
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
  await p.screenshot({
    path: `${process.env.ES_EVIDENCE_DIR || "test-results"}/focus-${state}-${width}.png`,
    fullPage: true,
  });
}
for (const width of [320, 390, 1440]) {
  test(`Focus Stage keeps action, Plan and completed transformation reachable at ${width}`, async ({
    page: p,
  }) => {
    await p.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await seed(p, fixture());
    await expect(
      p.getByText("Who I am becoming", { exact: true }),
    ).toBeVisible();
    await expect(p.getByLabel("Elapsed time")).toHaveCount(0);
    await expect(p.getByRole("button", { name: /Revise/ })).toHaveCount(0);
    await expect(p.locator(".now-hero .hero-challenge")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    const begin = p.getByRole("button", { name: "Begin", exact: true });
    const beginBox = (await begin.boundingBox())!;
    expect(Math.round(beginBox.width)).toBe(width >= 900 ? 118 : 117);
    expect(Math.round(beginBox.height)).toBe(width >= 900 ? 118 : 117);
    await expect(begin).toHaveCSS("background-color", "rgb(94, 119, 131)");
    await expect(begin).toHaveCSS("color", "rgb(246, 241, 232)");
    await capture(p, "basecamp", width);
    await begin.click();
    await expect(p.getByText("About 25 minutes")).toBeVisible();
    await expect(
      p.getByRole("button", { name: "Check in honestly" }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Your Plan", exact: true }),
    ).toBeVisible();
    await expect(p.getByText("Who I am becoming", { exact: true })).toHaveCount(
      0,
    );
    await expect(p.locator(".route-current strong")).toHaveText(
      "Validate collection",
    );
    await capture(p, "plan", width);
    await expect(
      p.getByRole("region", { name: "All milestones & steps" }),
    ).toBeVisible();
    await expect(
      p
        .getByRole("region", { name: "All milestones & steps" })
        .getByText("Launch shop", { exact: true }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Your Proof", exact: true }),
    ).toBeVisible();
    await p
      .getByRole("button", { name: "View all evidence", exact: true })
      .click();
    await expect(
      p.getByText("I can make work that people value"),
    ).toBeVisible();
    const types = p.getByRole("navigation", { name: "Evidence type" });
    await types.getByRole("button", { name: "Steps", exact: true }).click();
    await expect(p.getByText("I can make work that people value")).toHaveCount(
      0,
    );
    await types
      .getByRole("button", { name: "Challenges", exact: true })
      .click();
    await expect(
      types.getByRole("button", { name: "Challenges", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      p.getByText("I can make work that people value"),
    ).toBeVisible();
    await capture(p, "proof-overview", width);
    await p.getByRole("button", { name: /Revisit what changed/ }).click();
    await expect(
      p.getByText("Keep testing ideas with real customers"),
    ).toBeVisible();
    await expect(
      p.getByRole("heading", { name: "The vision I chose" }),
    ).toBeVisible();
    await capture(p, "completed-record", width);
    await expect(
      p.getByRole("button", { name: "Choose my next challenge" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test("long step titles remain readable in the Halo panel", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 320, height: 812 });
  const errors: string[] = [];
  p.on("pageerror", (error) => errors.push(error.message));
  p.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const s = fixture();
  const title =
    "Prepare three distinct sketches for my first public collection, compare the materials and note the cost of each option before deciding what to make.";
  s.snapshot.definitions.find((d) => d.commitment_id === "next-step")!.action =
    title;
  await seed(p, s);
  const panel = p.locator(".redesign-now-panel"),
    stepTitle = panel.getByRole("heading", { name: title });
  await expect(stepTitle).toBeVisible();
  const titleBox = (await stepTitle.boundingBox())!,
    panelBox = (await panel.boundingBox())!;
  expect(titleBox.x).toBeGreaterThanOrEqual(panelBox.x);
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(
    panelBox.x + panelBox.width,
  );
  const beginBox = (await panel
    .getByRole("button", { name: "Begin", exact: true })
    .boundingBox())!;
  expect(titleBox.y + titleBox.height).toBeLessThan(beginBox.y);
  await capture(p, "long-title", 320);
  await expect(stepTitle).toHaveText(title);
  expect(errors).toEqual([]);
});

test("locked Halo and Begin remain stable with reduced motion and narrow screens", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await p.emulateMedia({ reducedMotion: "no-preference" });
  await seed(p, fixture());
  const panel = p.locator(".redesign-now-panel"),
    begin = p.getByRole("button", { name: "Begin", exact: true });
  await expect(panel).toHaveCSS("background-image", /tex-halo\.webp/);
  await expect(begin).toHaveCSS("background-image", /begin-fibers/);
  let box = (await begin.boundingBox())!;
  expect(Math.round(box.width)).toBe(117);
  expect(Math.round(box.height)).toBe(117);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await expect(begin).toHaveCSS("animation-name", "none");
  await p.setViewportSize({ width: 320, height: 844 });
  box = (await begin.boundingBox())!;
  expect(Math.round(box.width)).toBe(117);
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await capture(p, "locked-halo", 320);
  await p.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(
    p.getByRole("region", { name: "All milestones & steps" }),
  ).toBeVisible();
  await expect(
    p.locator('.route-map-stage [aria-current="step"]'),
  ).toContainText("Validate collection");
  await expect(
    p.locator(".all-plan-details").getByText("Launch shop", { exact: true }),
  ).toBeVisible();
});
