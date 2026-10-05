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
    await expect(p.getByLabel("Elapsed time")).toHaveText("00:00");
    await expect(p.getByLabel("Elapsed time")).toHaveCSS(
      "white-space",
      "nowrap",
    );
    const timerText = await p.getByLabel("Elapsed time").evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));
    expect(timerText.scrollWidth).toBeLessThanOrEqual(timerText.clientWidth);
    expect(timerText.scrollHeight).toBeLessThanOrEqual(timerText.clientHeight);
    await expect(p.locator(".stage-context .quiet").first()).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(p.locator(".wallpaper-card")).toHaveCSS(
      "color",
      "rgb(16, 26, 32)",
    );
    const ring = p.locator(".timer-face"),
      start = p.getByRole("button", { name: "Start timer", exact: true });
    const rb = await ring.boundingBox(),
      sb = await start.boundingBox();
    expect(rb!.width).toBeGreaterThanOrEqual(280);
    expect(sb!.y - (rb!.y + rb!.height)).toBeGreaterThanOrEqual(32);
    await capture(p, "basecamp", width);
    await start.click();
    await expect(p.getByLabel("Elapsed time")).not.toHaveText("00:00");
    await p.reload();
    await p.getByRole("button", { name: "Pause timer" }).click();
    await expect(p.getByRole("button", { name: "Resume timer" })).toBeVisible();
    await p.getByText("Step details & calendar", { exact: true }).click();
    await expect(
      p.getByText("Done means: Three distinct sketches on paper"),
    ).toBeVisible();
    await p.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Your Plan", exact: true }),
    ).toBeVisible();
    await expect(p.getByText("Who I am becoming", { exact: true })).toHaveCount(
      0,
    );
    await expect(p.locator(".plan-focus h2")).toHaveText("Validate collection");
    await capture(p, "plan", width);
    await p.getByText("All milestones & steps", { exact: true }).click();
    await expect(p.getByText("Launch shop", { exact: true })).toBeVisible();
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Your Proof", exact: true }),
    ).toBeVisible();
    await expect(
      p.getByText("I can make work that people value"),
    ).toBeVisible();
    await p.getByLabel("Show supporting history").selectOption("active");
    await expect(
      p.getByText("I can make work that people value"),
    ).toBeVisible();
    await capture(p, "proof-overview", width);
    await p.getByRole("button", { name: /Revisit what changed/ }).click();
    await expect(
      p.getByText("Keep testing ideas with real customers"),
    ).toBeVisible();
    await expect(
      p.getByRole("heading", { name: "Your original vision" }),
    ).toBeVisible();
    await capture(p, "completed-record", width);
    await expect(
      p.getByRole("button", { name: "Choose my next challenge" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test("long step titles remain readable in details without squeezing the timer", async ({
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
  const timerTitle = p.locator(".timer-face h2"),
    timerOutput = p.getByLabel("Elapsed time");
  await expect(timerTitle).toHaveText(title);
  await expect(timerOutput).toBeVisible();
  const titleBox = (await timerTitle.boundingBox())!,
    outputBox = (await timerOutput.boundingBox())!;
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(outputBox.y);
  expect(
    await timerOutput.evaluate(
      (el) =>
        el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight,
    ),
  ).toBe(true);
  await capture(p, "long-title", 320);
  await p.getByText("Step details & calendar", { exact: true }).click();
  await expect(
    p.locator(".stage-details").getByText(title, { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
