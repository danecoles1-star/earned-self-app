import { test, expect, type Page } from "@playwright/test";
import { applyLocal, type LocalStore } from "../../src/data/domain";
import {
  emptySnapshot,
  type Command,
  type GrowthArea,
} from "../../src/data/types";
import { foundation, action } from "../fixtures";
const owner = "local-preview-member";
function fixture() {
  let s: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) => {
    s = applyLocal(
      s,
      { kind, payload, actorId: owner, operationId: crypto.randomUUID() },
      owner,
    ).store;
  };
  for (const area of ["physical", "professional", "personal"] as GrowthArea[]) {
    send("goal", {
      ...foundation,
      id: area,
      area,
      outcome: {
        physical: "Finish the swim, cycle and run of my event",
        professional: "Deliver the full talk and answer questions",
        personal: "Finish and share a complete novella",
      }[area],
      milestones: [
        {
          ...foundation.milestones[0],
          title: {
            physical: "Swim with confidence",
            professional: "Find my message",
            personal: "Find the story",
          }[area],
          criterion: "Complete a deliberate practice and review it",
        },
        {
          ...foundation.milestones[1],
          title: {
            physical: "Build endurance",
            professional: "Rehearse with peers",
            personal: "Finish the draft",
          }[area],
        },
        {
          ...foundation.milestones[1],
          id: "33333333-3333-4333-8333-333333333333",
          title: {
            physical: "Complete the triathlon",
            professional: "Deliver the talk",
            personal: "Share with readers",
          }[area],
        },
      ],
      words: {
        physical: "Complete my first triathlon",
        professional: "Deliver my keynote",
        personal: "Finish my novella",
      }[area],
      vision: {
        physical: "Become resilient in body and mind",
        professional: "Become a speaker who moves people",
        personal: "Become a writer who shares meaningful work",
      }[area],
    });
    send("commitment", {
      ...action,
      id: area + "-step",
      goalId: area,
      action: {
        physical: "Practise a relaxed swim stroke",
        professional: "Rehearse my opening aloud",
        personal: "Write the opening scene",
      }[area],
      criterion: "One deliberate practice finished",
    });
  }
  send("goal", {
    ...foundation,
    id: "completed",
    area: "professional",
    words: "Deliver my first public talk",
    vision: "Become a speaker who moves people",
    outcome: "Deliver a complete talk to an audience",
  });
  send("status", {
    goalId: "completed",
    version: 1,
    status: "completed",
    detail: "Delivered my talk to thirty attendees",
    reflection: "I can communicate clearly when I prepare",
    next: "Keep practising with real audiences",
  });
  send("select", { goalId: "physical" });
  return s;
}
async function seed(p: Page) {
  await p.goto("/");
  await p.evaluate((s) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(
      "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
      JSON.stringify(s),
    );
    localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
  }, fixture());
  await p.goto("/app");
}
for (const width of [320, 390, 1440])
  test(`Workshop area isolation, tools and Proof at ${width}`, async ({
    page: p,
  }) => {
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.setViewportSize({ width, height: 900 });
    await seed(p);
    const capture = async (name: string) => {
      await expect(p.locator("h1").first()).toBeAttached();
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.screenshot({
        path: `test-results/workshop-${name}-${width}-viewport.png`,
      });
      await p.screenshot({
        path: `test-results/workshop-${name}-${width}.png`,
        fullPage: true,
      });
      expect(
        await p.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    };
    const areas = p.getByRole("navigation", { name: "Area of growth" });
    await expect(
      p.getByRole("heading", {
        name: "Practise a relaxed swim stroke",
        exact: true,
      }),
    ).toBeVisible();
    await capture("now");
    const ring = await p.locator(".timer-face").boundingBox(),
      digits = await p.getByLabel("Elapsed time").boundingBox();
    expect(
      Math.abs(ring!.x + ring!.width / 2 - (digits!.x + digits!.width / 2)),
    ).toBeLessThan(2);
    expect(
      Math.abs(ring!.y + ring!.height / 2 - (digits!.y + digits!.height / 2)),
    ).toBeLessThan(40);
    await areas
      .getByRole("button", { name: "Professional", exact: true })
      .click();
    await expect(
      p.getByRole("heading", {
        name: "Rehearse my opening aloud",
        exact: true,
      }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Your Plan", exact: true }),
    ).toBeVisible();
    await capture("plan");
    await expect(
      p.getByRole("navigation", { name: "Your milestone path" }),
    ).toBeHidden();
    await p
      .getByRole("button", { name: "All milestones & steps", exact: true })
      .click();
    await expect(
      p.getByRole("navigation", { name: "Your milestone path" }),
    ).toBeVisible();
    await p
      .getByRole("button", { name: "Close planning details", exact: true })
      .click();
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await expect(
      p.getByText("No Proof yet. Record a check-in when you act."),
    ).toBeVisible();
    await capture("proof-building");
    await p
      .getByRole("button", { name: "View all evidence", exact: true })
      .click();
    await p.getByRole("button", { name: /Challenge completed/ }).click();
    await expect(
      p.getByText("I can communicate clearly when I prepare", { exact: true }),
    ).toBeVisible();
    await capture("proof-completed");
    await p
      .getByRole("button", { name: "Carry this forward", exact: true })
      .click();
    await expect(
      p.getByRole("button", { name: "Use my own reflection" }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Use my own reflection" }).click();
    for (const name of [
      "Courage",
      "Preparation",
      "Possibility",
      "Mineral",
      "Challenge Ember",
      "Mineral Paper",
      "Proof Ivory",
    ]) {
      await p.getByRole("button", { name, exact: true }).click();
      await expect(
        p.getByRole("button", { name: "Preview lock screen" }),
      ).toBeEnabled();
    }
    await capture("wallpapers");
    await p.getByRole("button", { name: "Preview lock screen" }).click();
    await expect(
      p.getByRole("img", { name: "Your lock-screen image preview" }),
    ).toBeVisible();
    await capture("wallpaper-preview");
    await p.getByRole("button", { name: "Now", exact: true }).click();
    await areas.getByRole("button", { name: "Personal", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Write the opening scene", exact: true }),
    ).toBeVisible();
    await expect(
      areas.getByRole("button", { name: "Personal", exact: true }),
    ).toBeEnabled();
    await p.reload();
    await expect(
      p.getByRole("heading", { name: "Write the opening scene", exact: true }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await expect(
      p.getByText("Delivered my talk to thirty attendees"),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });

for (const width of [390, 1440]) {
  test(`Workshop fidelity and legacy area at ${width}`, async ({ page: p }) => {
    await p.setViewportSize({ width, height: 900 });
    await seed(p);
    // A legacy challenge must not receive an inferred area or unrelated artwork.
    await p.evaluate(() => {
      const key = "earned-self:LOCAL-PREVIEW-ONLY:personal:v1";
      const state = JSON.parse(localStorage.getItem(key)!);
      state.snapshot.goals.find(
        (g: { id: string }) => g.id === "physical",
      ).area = null;
      localStorage.setItem(key, JSON.stringify(state));
    });
    await p.reload();
    // Legacy assignment is a deliberate Plan action, never repeated across screens.
    await expect(p.locator(".assign-area")).toHaveCount(0);
    await p.getByRole("button", { name: "Plan", exact: true }).click();
    await p.locator(".manage-challenge > summary").click();
    await expect(
      p.getByRole("heading", { name: "Choose this challenge’s area" }),
    ).toBeVisible();
    await p.screenshot({
      path: `test-results/workshop-legacy-${width}.png`,
      fullPage: true,
    });
    await p
      .locator(".assign-area")
      .getByRole("button", { name: "Physical", exact: true })
      .click();
    await expect(p.locator(".assign-area")).toHaveCount(0);
    await expect(
      p
        .getByRole("navigation", { name: "Area of growth" })
        .getByRole("button", { name: "Physical", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    // Active Proof is authored evidence, not a repeated decorative area illustration.
    await expect(p.locator(".landscape-proof")).toHaveCount(0);
    await expect(p.locator(".challenge-breadcrumb")).toContainText(
      "Complete my first triathlon",
    );
    await p.getByRole("button", { name: "Now", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Practise a relaxed swim stroke" }),
    ).toBeVisible();
    const title = await p.locator(".timer-step-title").boundingBox();
    const ring = await p.locator(".timer-face").boundingBox();
    expect(ring!.y - title!.y - title!.height).toBeGreaterThanOrEqual(40);
    expect(
      await p
        .locator(".timer-ring")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
    await p
      .locator(".timer-face")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    await p.screenshot({
      path: `test-results/workshop-timer-focus-${width}.png`,
    });
    await p.getByRole("button", { name: /Create wallpaper/ }).click();
    await expect(
      p.getByRole("heading", { name: "Words worth carrying." }),
    ).toBeVisible();
    const label = p.locator(".wallpaper-swatch.mineral span");
    await expect(label).toHaveCSS("color", "rgb(23, 35, 41)");
    await expect(label).toHaveCSS("background-color", "rgb(241, 243, 241)");
    await p.getByRole("button", { name: "Now", exact: true }).click();
    await p.getByRole("button", { name: "Add step ›", exact: true }).click();
    await expect(p.locator("h1")).toBeVisible();
    await p.screenshot({
      path: `test-results/workshop-add-step-${width}.png`,
      fullPage: true,
    });
    expect(
      await p.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
