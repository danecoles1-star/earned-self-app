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
    await expect(p.getByRole("heading", { name: "Get ready" })).toBeVisible();
    await expect(p.getByLabel("Elapsed time")).toHaveCount(0);
    await expect(p.getByRole("button", { name: /Revise/ })).toHaveCount(0);
    // Now shows who the member is becoming, not a link back into Plan.
    await expect(p.locator(".es-becoming")).toBeVisible();
    await expect(p.locator(".es-becoming").getByRole("button")).toHaveCount(0);
    const begin = p.getByRole("button", { name: "Begin", exact: true });
    const beginBox = (await begin.boundingBox())!;
    const cardBox = (await p.locator(".es-now-card").boundingBox())!;
    expect(beginBox.width).toBeGreaterThan(cardBox.width - 60);
    expect(beginBox.height).toBeGreaterThanOrEqual(44);
    await expect(begin).toHaveCSS("background-color", "rgb(246, 241, 232)");
    await expect(begin).toHaveCSS("color", "rgb(16, 26, 32)");
    await capture(p, "basecamp", width);
    await begin.click();
    await expect(p.getByText("How it goes")).toBeVisible();
    await expect(
      p.getByRole("button", { name: "Finish and check in" }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Close session" }).click();
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
test("long step titles remain readable in the Now card", async ({
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
  const panel = p.locator(".es-now-card"),
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
  expect(
    await stepTitle.evaluate((el) => el.scrollHeight <= el.clientHeight),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("Now card Begin stays a full-width, in-card action on narrow screens", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await seed(p, fixture());
  const panel = p.locator(".es-now-card"),
    begin = p.getByRole("button", { name: "Begin", exact: true });
  const fits = async () => {
    const c = (await panel.boundingBox())!,
      b = (await begin.boundingBox())!;
    // Begin spans the card body and sits inside the card.
    expect(b.x).toBeGreaterThanOrEqual(c.x + 12);
    expect(b.x + b.width).toBeLessThanOrEqual(c.x + c.width - 12);
    expect(b.width).toBeGreaterThan(c.width - 60);
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.y + b.height).toBeLessThan(c.y + c.height);
  };
  await fits();
  await expect(begin).toHaveCSS("box-shadow", /255, 91, 54/);
  await p.setViewportSize({ width: 320, height: 844 });
  await fits();
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await capture(p, "now-card", 320);
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
