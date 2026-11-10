import { test, expect, type Page } from "@playwright/test";
import { applyLocal, type LocalStore } from "../../src/data/domain";
import { emptySnapshot, type Command } from "../../src/data/types";
import { foundation, action, mid } from "../fixtures";

// November 2026 redesign contract: Now preview card + in-card Begin, ink focus session,
// two-part check-in, Proof journal with milestone tracker, light and dark mode.
const owner = "local-preview-member";
function fixture(earned = false) {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) => {
    store = applyLocal(
      store,
      { kind, payload, actorId: owner, operationId: crypto.randomUUID() },
      owner,
    ).store;
  };
  send("goal", { ...foundation, id: "g", area: "physical" });
  send("commitment", { ...action, id: "done-step", location: "Studio" });
  send("outcome", {
    id: "e1",
    goalId: "g",
    commitmentId: "done-step",
    version: 1,
    result: "done",
    detail: "Six costs saved in the sheet.",
  });
  if (earned)
    send("milestone", {
      goalId: "g",
      version: store.snapshot.goals[0].version,
      milestoneId: mid,
      result: "done",
      detail: "Collection validated.",
    });
  send("commitment", {
    ...action,
    id: "c",
    milestoneId: earned ? "22222222-2222-4222-8222-222222222222" : mid,
    location: "Studio",
  });
  store.snapshot.selectedGoal = "g";
  return store;
}
async function seed(p: Page, s: LocalStore, path = "/app") {
  await p.goto("/");
  await p.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem(
      "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
      JSON.stringify(s),
    );
    localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
  }, s);
  await p.goto(path);
}
const noOverflow = async (p: Page, width: number) =>
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);

for (const scheme of ["light", "dark"] as const)
  for (const width of [320, 390, 1440]) {
    test(`redesign surfaces in ${scheme} mode at ${width}`, async ({
      page: p,
    }) => {
      await p.emulateMedia({ colorScheme: scheme });
      await p.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await seed(p, fixture());
      await expect(p.locator("body")).toHaveCSS(
        "background-color",
        scheme === "dark" ? "rgb(11, 18, 22)" : "rgb(246, 241, 232)",
      );
      if (scheme === "dark")
        await expect(p.locator(".account-button img")).toHaveCSS(
          "filter",
          "brightness(0) invert(1)",
        );
      // Now: experience-preview card with image, status tag and in-card Begin.
      const card = p.locator(".es-now-card");
      const begin = card.getByRole("button", { name: "Begin", exact: true });
      await expect(card.locator(".es-now-media img")).toBeVisible();
      await expect(card.locator(".es-now-tag")).toBeVisible();
      await expect(begin).toHaveCSS("box-shadow", /255, 91, 54/);
      await expect(p.getByRole("heading", { name: "Get ready" })).toBeVisible();
      await expect(p.getByText("Studio", { exact: true })).toBeVisible();
      const nav = p.getByRole("navigation", { name: "Main navigation" });
      await expect(nav).toHaveCSS("position", "fixed");
      await expect(nav).toHaveCSS("border-top-left-radius", "999px");
      await noOverflow(p, width);
      // Begin opens the ink focus session without the tab bar.
      await begin.click();
      await expect(p).toHaveURL(/\/focus\/g$/);
      await expect(p.locator(".es-focus")).toHaveCSS(
        "background-color",
        "rgb(16, 26, 32)",
      );
      await expect(p.getByText("How it goes")).toBeVisible();
      await expect(nav).toHaveCount(0);
      await noOverflow(p, width);
      // Check-in: Not yet is distinct by shape, not colour alone.
      await p.getByRole("button", { name: "Finish and check in" }).click();
      await expect(p).toHaveURL(/\/report\/g$/);
      await expect(
        p.getByRole("button", { name: "Not yet", exact: true }),
      ).toHaveCSS("border-top-style", "dashed");
      await noOverflow(p, width);
      expect(errors).toEqual([]);
    });
  }

test("done check-in hands off to scheduling the next step", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await seed(p, fixture(), "/report/g");
  await p.getByRole("button", { name: "Done", exact: true }).click();
  await p
    .getByLabel("What happened?", { exact: true })
    .fill("All costs saved.");
  await p.getByRole("button", { name: "Keep preparing" }).click();
  await expect(p.getByText(/Next: schedule your next step/)).toBeVisible();
  await p.getByRole("button", { name: "Save to Proof", exact: true }).click();
  await expect(p).toHaveURL(/\/add-step\/g\?after=checkin$/);
  await expect(
    p.getByRole("heading", { name: "What’s your next step?" }),
  ).toBeVisible();
});

test("Can’t make it today opens check-in with Not yet selected", async ({
  page: p,
}) => {
  await seed(p, fixture());
  await p.getByRole("button", { name: "Can’t make it today?" }).click();
  await expect(p).toHaveURL(/\/report\/g\?result=did_not_happen$/);
  await expect(
    p.getByRole("button", { name: "Not yet", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Proof shows the milestone tracker and a weekly journal; milestone earned screen", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await seed(p, fixture(true), "/proof");
  const tracker = p.getByRole("region", { name: "Milestones" });
  await expect(tracker.getByLabel(/Milestone 1 of 2, earned/)).toBeVisible();
  await expect(tracker.getByLabel(/Milestone 2 of 2, ahead/)).toBeVisible();
  await expect(p.getByRole("heading", { name: "This week" })).toBeVisible();
  await expect(p.getByText("“Six costs saved in the sheet.”")).toBeVisible();
  await expect(p.getByText("Milestone earned").first()).toBeVisible();
  await p.goto("/milestone-done/g");
  await expect(
    p.getByRole("heading", { name: "Validate collection" }),
  ).toBeVisible();
  await expect(p.getByText("Milestone 1 of 2 · earned")).toBeVisible();
  await expect(
    p.getByRole("button", { name: "Keep it in Proof" }),
  ).toBeVisible();
  await expect(
    p.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
});

// Review evidence uses disposable local fixtures; no hosted records are written.
for (const scheme of ["light", "dark"] as const)
  for (const width of [390, 1440])
    test(`release review journey ${scheme} ${width}`, async ({ page: p }) => {
      await p.emulateMedia({ colorScheme: scheme });
      await p.setViewportSize({ width, height: 900 });
      const capture = async (screen: string) => {
        await p.evaluate(() => document.fonts.ready);
        await p.screenshot({
          path: `docs/release-review/${scheme}-${width}-${screen}.png`,
          fullPage: true,
        });
      };
      await seed(p, fixture());
      await expect(
        p.getByRole("button", { name: "Begin", exact: true }),
      ).toBeVisible();
      await capture("now");
      await p.getByRole("button", { name: "Begin", exact: true }).click();
      await expect(p).toHaveURL(/\/focus\/g$/);
      await capture("session");
      await p.getByRole("button", { name: "Finish and check in" }).click();
      await p.getByRole("button", { name: "Done", exact: true }).click();
      await p
        .getByLabel("What happened?", { exact: true })
        .fill("All six costs saved in the sheet.");
      await p.getByRole("button", { name: "Keep preparing" }).click();
      await capture("check-in");
      await p
        .getByRole("button", { name: "Save to Proof", exact: true })
        .click();
      await expect(p).toHaveURL(/\/add-step\/g\?after=checkin$/);
      await p
        .getByLabel("My next step", { exact: true })
        .fill("Compare the six suppliers");
      await p
        .getByLabel("Done means", { exact: true })
        .fill("Select two suppliers and record why");
      await p.getByRole("button", { name: "Continue", exact: true }).click();
      await p.getByLabel("Action date", { exact: true }).fill("2030-11-12");
      await p.getByLabel("Action time", { exact: true }).fill("09:00");
      await p.getByLabel("Where?", { exact: true }).fill("Studio");
      await capture("schedule-next");
      await p.getByRole("button", { name: "Continue", exact: true }).click();
      await p.getByRole("button", { name: "Save step", exact: true }).click();
      await expect(p).toHaveURL(/\/app$/);
      await p.reload();
      await expect(
        p.getByRole("heading", {
          name: "Compare the six suppliers",
          exact: true,
        }),
      ).toBeVisible();
      await seed(p, fixture(true), "/proof");
      await expect(p.getByRole("region", { name: "Milestones" })).toBeVisible();
      await capture("proof");
      await p.goto("/milestone-done/g");
      await expect(
        p.getByRole("heading", { name: "Validate collection" }),
      ).toBeVisible();
      const footer = (await p.locator(".es-earned-footer").boundingBox())!;
      expect(Math.abs(footer.x + footer.width / 2 - width / 2)).toBeLessThan(
        0.5,
      );
      await capture("milestone-earned");
    });

// Audit changes preserve navigation boundaries and the calendar duration control.
test("audit navigation and calendar choices", async ({ page: p }) => {
  const store = fixture();
  await seed(p, store);
  await expect(p.locator(".es-becoming")).toContainText(foundation.vision);
  await expect(p.locator(".es-challenge-link")).toHaveCount(0);
  const nav = p.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.locator("svg")).toHaveCount(3);
  await p.goto("/manage");
  await expect(nav).toBeVisible();
  await expect(p.getByRole("button", { name: "Revise this step" })).toHaveCount(
    0,
  );
  await p.goto("/proof/" + store.snapshot.evidence[0].id);
  await expect(nav).toHaveCount(0);
  await expect(
    p.getByRole("heading", { name: action.action, exact: true }),
  ).toBeVisible();
  await p.goto("/calendar/g");
  await expect(nav).toHaveCount(0);
  await expect(p.getByRole("group", { name: "How long" })).toBeVisible();
  await p.getByRole("button", { name: "1.5 hours", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "1.5 hours", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

for (const scheme of ["light", "dark"] as const)
  for (const width of [320, 390, 1440])
    test(`prepared card and segmented session ${scheme} ${width}`, async ({
      page: p,
    }) => {
      await p.emulateMedia({ colorScheme: scheme });
      await p.setViewportSize({ width, height: 900 });
      const s = fixture();
      s.snapshot.prepared = [
        {
          commitment_id: "c",
          commitment_revision: 1,
          image_url: null,
          image_alt: null,
          parts: [
            { label: "Review options", minutes: 3 },
            { label: "Compare costs", minutes: 12 },
            { label: "Record findings", minutes: 5 },
          ],
        },
      ];
      await seed(p, s);
      const card = p.locator(".es-now-card");
      await expect(
        card.getByRole("list", { name: "Session parts" }),
      ).toBeVisible();
      await expect
        .poll(() =>
          card
            .locator("img")
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
      const box = (await card.boundingBox())!;
      for (const item of await card.locator("li, .es-begin").all()) {
        const b = (await item.boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(box.x);
        expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width);
      }
      await noOverflow(p, width);
      await p.screenshot({
        path: `docs/release-review/${scheme}-${width}-prepared-now.png`,
        fullPage: true,
      });
      await card.getByRole("button", { name: "Begin", exact: true }).click();
      await expect(p.locator(".timer-seg-track")).toHaveCount(3);
      await expect(p.locator('.timer-parts [aria-current="step"]')).toHaveText(
        "Review options · 3 min",
      );
      await p.getByRole("button", { name: "Start timer" }).click();
      await p.getByRole("button", { name: "Pause timer" }).click();
      await p.reload();
      await expect(p.locator(".timer-seg-track")).toHaveCount(3);
      await noOverflow(p, width);
      await p.screenshot({
        path: `docs/release-review/${scheme}-${width}-segmented-session.png`,
        fullPage: true,
      });
      await p.getByRole("button", { name: "Finish and check in" }).click();
      await expect(
        p.getByRole("button", { name: "Not yet", exact: true }),
      ).toBeVisible();
    });
