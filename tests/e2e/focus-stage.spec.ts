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
    const timerFaceBounds = (await p.locator(".timer-face").boundingBox())!;
    const timerTextBounds = (await p.getByLabel("Elapsed time").boundingBox())!;
    expect(timerTextBounds.y).toBeGreaterThanOrEqual(timerFaceBounds.y);
    expect(timerTextBounds.y + timerTextBounds.height).toBeLessThanOrEqual(
      timerFaceBounds.y + timerFaceBounds.height,
    );
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
    expect(rb!.width).toBeGreaterThanOrEqual(250);
    expect(sb!.y - (rb!.y + rb!.height)).toBeGreaterThanOrEqual(32);
    await capture(p, "basecamp", width);
    await start.click();
    await expect(p.getByLabel("Elapsed time")).not.toHaveText("00:00");
    await p.reload();
    await p.getByRole("button", { name: "Pause timer" }).click();
    await expect(p.getByRole("button", { name: "Resume timer" })).toBeVisible();
    await expect(
      p.getByRole("region", { name: "Step details & calendar" }),
    ).toBeVisible();
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
    await expect(p.locator(".plan-focus-stage > h2")).toHaveText(
      "Validate collection",
    );
    await capture(p, "plan", width);
    await expect(
      p.getByRole("navigation", { name: "Your milestone path" }),
    ).toBeVisible();
    await expect(
      p
        .getByRole("navigation", { name: "Your milestone path" })
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
  const timerTitle = p.locator(".timer-step-title h2"),
    timerOutput = p.getByLabel("Elapsed time");
  await expect(timerTitle).toHaveText(title);
  await expect(timerOutput).toBeVisible();
  const titleBox = (await timerTitle.boundingBox())!,
    outputBox = (await timerOutput.boundingBox())!,
    faceBox = (await p.locator(".timer-face").boundingBox())!;
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(outputBox.y);
  expect(
    await timerOutput.evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  expect(outputBox.y).toBeGreaterThanOrEqual(faceBox.y);
  expect(outputBox.y + outputBox.height).toBeLessThanOrEqual(
    faceBox.y + faceBox.height,
  );
  await capture(p, "long-title", 320);
  await expect(
    p.getByRole("region", { name: "Step details & calendar" }),
  ).toBeVisible();
  await expect(p.locator(".timer-step-title h2")).toHaveText(title);
  expect(errors).toEqual([]);
});

test("Ivory orb follows timer state, respects reduced motion and keeps every digit in bounds", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await p.emulateMedia({ reducedMotion: "no-preference" });
  await seed(p, fixture());
  const orb = p.locator(".timer-orbit");
  const initialAngle = await orb.evaluate(
    (el) => (el as HTMLElement).style.transform,
  );
  await expect(p.locator(".stage-focus")).toHaveCSS(
    "background-color",
    "rgb(246, 241, 232)",
  );
  await expect(p.locator(".stage-focus")).toHaveCSS("background-image", "none");
  await expect(p.locator(".stage-details")).not.toHaveJSProperty(
    "tagName",
    "DETAILS",
  );
  await p.getByRole("button", { name: "Start timer", exact: true }).click();
  await expect
    .poll(() => orb.evaluate((el) => (el as HTMLElement).style.transform))
    .not.toBe(initialAngle);
  await expect(p.getByLabel("Elapsed time")).not.toHaveText("00:00");
  await p.reload();
  await expect(
    p.getByRole("button", { name: "Pause timer", exact: true }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Pause timer", exact: true }).click();
  const pausedAngle = await orb.evaluate(
    (el) => (el as HTMLElement).style.transform,
  );
  await p.waitForTimeout(200);
  expect(await orb.evaluate((el) => (el as HTMLElement).style.transform)).toBe(
    pausedAngle,
  );
  await p.getByRole("button", { name: "Resume timer", exact: true }).click();
  await expect
    .poll(() => orb.evaluate((el) => (el as HTMLElement).style.transform))
    .not.toBe(pausedAngle);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await expect(orb).toHaveCSS("animation-name", "none");
  await p.evaluate(() =>
    localStorage.setItem(
      "earned-self:timer:local-preview-member:next-step:1",
      JSON.stringify({ elapsed: 360000000, started: null }),
    ),
  );
  await p.setViewportSize({ width: 320, height: 844 });
  await p.reload();
  await expect(p.getByLabel("Elapsed time")).toHaveText("100:00:00");
  const face = await p.locator(".timer-face").boundingBox();
  const digits = await p.getByLabel("Elapsed time").boundingBox();
  expect(digits!.x).toBeGreaterThanOrEqual(face!.x);
  expect(digits!.x + digits!.width).toBeLessThanOrEqual(face!.x + face!.width);
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await capture(p, "100-hour", 320);
  await p.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(
    p.getByRole("navigation", { name: "Your milestone path" }),
  ).toBeVisible();
  await expect(p.locator('.journey-path [aria-current="step"]')).toContainText(
    "Validate collection",
  );
  await expect(
    p.locator(".journey-path").getByText("Launch shop", { exact: true }),
  ).toBeVisible();
});
