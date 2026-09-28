import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("first visit through first action, failure recovery, accomplishment and next ambition", async ({
  page: p,
}) => {
  test.setTimeout(90000);
  await p.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const click = async (n: string) =>
    p.getByRole("button", { name: n, exact: true }).click();
  const fill = async (n: string, v: string) =>
    p.getByLabel(n, { exact: true }).fill(v);
  const next = async () => click("Continue");
  const output = process.env.ES_SCREENSHOTS_DIR || "test-results/screenshots";
  fs.mkdirSync(output, { recursive: true });
  const shot = async (n: string) => {
    await p.screenshot({ path: `${output}/${n}.png`, fullPage: true });
    expect(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    ).toBe(false);
  };
  await p.goto("/");
  await shot("01-home-mobile");
  await click("Begin");
  assert(
    await p.getByRole("button", { name: "Continue", exact: true }).isDisabled(),
  );
  await click("I am ready for more");
  await next();
  await fill("Your future self", "Become a confident published writer");
  await shot("03-identity-mobile");
  await next();
  await click("Work & creation");
  await next();
  await fill("My big vision", "Publish a researched essay");
  await next();
  await fill("My reason", "Share a perspective I have kept to myself");
  await next();
  await fill(
    "I will know I have done it when…",
    "My essay is published and available to read",
  );
  await fill(
    "What makes this a stretch?",
    "I have never shared my writing publicly",
  );
  await next();
  await click("Confidence");
  await next();
  await fill("My first move", "Write one opening sentence");
  await fill("Done means", "One sentence is on the page");
  await click("Begin move");
  await click("Start");
  await click("I have tried it");
  await click("Done");
  await fill("What happened?", "I wrote one opening sentence");
  await click("Record what happened");
  await shot("12-first-proof-mobile");
  await click("Keep going");
  await click("Enter local preview");
  await click("Save my first Proof");
  await click("Save and prepare my ambition");
  await fill("My constraints", "Thirty minutes after work");
  await next();
  await fill("What I need to build", "Research and revise an argument");
  await next();
  await click("Nothing unresolved right now");
  await next();
  await fill(
    "When it gets difficult",
    "If I am tired, I will work on one paragraph before dinner",
  );
  await next();
  await click("Add a milestone");
  await fill("A turning point", "Finish the first draft");
  await fill("Evidence", "A complete essay draft");
  await fill("Milestone 1 deadline date", "2030-12-01");
  await fill("Milestone 1 deadline time", "17:00");
  await fill("Milestone 1 deadline time zone", "America/Denver");
  await next();
  await p.getByRole("checkbox").check();
  await click("Keep my preparation");
  await fill("My next move", "Draft the opening paragraph");
  await fill("Done means", "A complete opening paragraph");
  await next();
  await fill("Action date", "2030-11-01");
  await fill("Action time", "17:00");
  await fill("Action time zone", "America/Denver");
  await fill("Where?", "At my desk");
  await next();
  await click("Commit to this ambition");
  await shot("25-calendar-mobile");
  const download = p.waitForEvent("download");
  await click("Apple Calendar");
  const dl = await download;
  assert.equal(dl.suggestedFilename(), "Earned_Self_Move.ics");
  await click("Continue without adding");
  await shot("30-now-mobile");
  await click("Begin my move");
  await click("Report what happened");
  await click("Partly");
  await fill("What happened?", "Wrote two sentences");
  assert(
    await p
      .getByRole("button", { name: "Save to Proof", exact: true })
      .isDisabled(),
  );
  await fill("What prevented it?", "I did not have my sources");
  await fill("What will you change?", "Gather the sources first");
  await click("Test next save failure");
  await click("Save to Proof");
  await p.getByRole("alert").filter({ hasText: "this save failed" }).waitFor();
  assert.equal(
    await p.getByLabel("What happened?", { exact: true }).inputValue(),
    "Wrote two sentences",
  );
  await click("Save to Proof");
  await shot("35-proof-mobile");
  await click("Choose what comes next");
  await click("Ambition");
  await click("Milestones · Finish the first draft");
  await fill(
    "What shows it is complete?",
    "The full essay draft is written and reviewed",
  );
  await click("Mark milestone complete");
  await p
    .getByRole("heading", { name: "You reached a turning point." })
    .waitFor();
  await shot("38-milestone-mobile");
  await click("See what comes next");
  await click("Ambition");
  await click("Pause, return or complete");
  await click("I accomplished it");
  await fill("What actually happened?", "The essay has been published");
  await next();
  await fill("What has changed?", "I can share my writing despite uncertainty");
  await fill("What will you carry forward?", "Make time to write every week");
  await click("Confirm accomplishment");
  await p.getByRole("heading", { name: "You did the work." }).waitFor();
  await shot("45-accomplishment-mobile");
  await click("Take this with me");
  await fill("Words to carry", "Keep writing.");
  await click("Preview lock screen");
  const wallpaper = p.waitForEvent("download");
  await click("Save image");
  assert.equal(
    (await wallpaper).suggestedFilename(),
    "Earned_Self_Lock_Screen.png",
  );
  await shot("53-wallpaper-mobile");
  await click("Go back");
  await click("Go back");
  await click("Choose my next ambition");
  assert(
    await p.getByRole("button", { name: "Continue", exact: true }).isDisabled(),
  );
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.goto("/");
  await shot("01-home-desktop");
  assert.deepEqual(errors, []);
});

test("small screen keyboard entry, required answer and reload recovery", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 375, height: 812 });
  await p.goto("/");
  await p.getByRole("button", { name: "Begin", exact: true }).focus();
  await p.keyboard.press("Enter");
  await expect(
    p.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await p
    .getByRole("button", { name: "I am ready for more", exact: true })
    .click();
  await p.getByRole("button", { name: "Continue", exact: true }).click();
  await p.getByLabel("Your future self", { exact: true }).fill("   ");
  await expect(
    p.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await p
    .getByLabel("Your future self", { exact: true })
    .fill("Become someone who follows through");
  await p.reload();
  await expect(p.getByLabel("Your future self", { exact: true })).toHaveValue(
    "Become someone who follows through",
  );
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  ).toBe(false);
});

test("responsive opening keeps the primary action visible on phones and desktop", async ({
  page,
}) => {
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const begin = page.getByRole("button", { name: "Begin", exact: true });
    await expect(begin).toBeVisible();
    const box = await begin.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test("phone preview works when HTTP does not provide randomUUID", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page
    .getByRole("button", { name: "I am ready for more", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Your future self", { exact: true })
    .fill("Become someone who follows through");
  await page.reload();
  await expect(
    page.getByLabel("Your future self", { exact: true }),
  ).toHaveValue("Become someone who follows through");
});
