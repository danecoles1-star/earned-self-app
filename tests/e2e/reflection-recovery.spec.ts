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
  send("goal", {
    ...foundation,
    milestones: foundation.milestones.map((m, i) => ({
      ...m,
      title: i ? "Deliver a practice talk" : "Rehearse for two listeners",
      criterion: i
        ? "Finish within ten minutes"
        : "Complete the full rehearsal and answer two questions",
    })),
    id: "g",
    words: "Give a presentation at a business event",
    vision: "Become a confident speaker",
    outcome: "Deliver the full talk and answer audience questions",
  });
  return { send, get: () => store };
}
async function seed(p: Page, store: LocalStore, path: string) {
  await p.goto("/");
  await p.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem(
      "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
      JSON.stringify(s),
    );
    localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
  }, store);
  await p.goto(path);
}
async function snap(p: Page, name: string, width: number) {
  await expect(p.locator("h1")).toBeVisible();
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  ).toBe(false);
  await p.screenshot({
    path: `${process.env.ES_EVIDENCE_DIR || "test-results"}/${name}-${width}.png`,
    fullPage: true,
  });
}
async function state(p: Page) {
  return p.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("earned-self:LOCAL-PREVIEW-ONLY:personal:v1")!,
      ).snapshot,
  );
}
for (const width of [390, 1440]) {
  test(`completion record and older Proof at ${width}`, async ({ page: p }) => {
    await p.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const f = fixture();
    f.get().snapshot.goals[0].status = "active";
    f.send("milestone", {
      goalId: "g",
      version: 1,
      milestoneId: foundation.milestones[0].id,
      result: "attempted",
      detail: "My first rehearsal ran long.",
    });
    await seed(p, f.get(), "/decision/g");
    await p
      .getByRole("button", { name: "I accomplished it", exact: true })
      .click();
    await p
      .getByLabel("What actually happened?")
      .fill("I delivered the talk and answered three audience questions.");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p
      .getByLabel("What does this show you about yourself?")
      .fill("I can speak clearly even when I feel nervous.");
    await p
      .getByLabel("What will you carry forward?")
      .fill("Rehearse aloud and ask for honest feedback.");
    await p.getByRole("button", { name: "Confirm accomplishment" }).click();
    await expect(p).toHaveURL(/\/proof\/challenge\/g$/);
    await expect(
      p.getByText("I can speak clearly even when I feel nervous."),
    ).toBeVisible();
    await snap(p, "completed-record", width);
    await p
      .getByRole("heading", { name: "The vision I chose" })
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    await p.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await p.screenshot({
      path: `${process.env.ES_EVIDENCE_DIR || "test-results"}/transformation-detail-${width}.png`,
    });
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await p.getByRole("button", { name: /Revisit what changed/ }).click();
    await p.getByText("Steps and milestone attempts", { exact: true }).click();
    await expect(p.getByText("My first rehearsal ran long.")).toBeVisible();
    const stored = await state(p);
    const event = stored.events.find((e: any) => e.data.to === "completed");
    delete event.data.reflection;
    delete event.data.next;
    await seed(p, { snapshot: stored, receipts: {} }, "/proof/challenge/g");
    await expect(
      p.getByText("Not recorded in this earlier entry."),
    ).toHaveCount(2);
    await snap(p, "older-record", width);
    expect(errors).toEqual([]);
  });
  test(`missed recurring step recovery at ${width}`, async ({ page: p }) => {
    await p.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const f = fixture();
    f.send("commitment", {
      ...action,
      action: "Rehearse the opening",
      criterion: "Say the opening aloud once",
      location: "Office",
      recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
    });
    await seed(p, f.get(), "/app");
    await p.getByRole("button", { name: "Step check-in", exact: true }).click();
    await p
      .getByRole("button", { name: "Did not happen", exact: true })
      .click();
    await p
      .getByLabel("What happened?", { exact: true })
      .fill("I missed the rehearsal.");
    await p
      .getByRole("button", { name: "Keep preparing", exact: true })
      .click();
    await p.getByLabel("What prevented it?").fill("A meeting ran late.");
    await p
      .getByLabel("What will you change?")
      .fill("Use a shorter lunch rehearsal.");
    await p.getByRole("button", { name: "Save to Proof" }).click();
    await expect(p).toHaveURL(/\/recovery\/c$/);
    await snap(p, "recovery", width);
    await p.getByRole("button", { name: "Keep my plan" }).click();
    await expect(
      p.getByRole("heading", { name: "Rehearse the opening" }),
    ).toBeVisible();
    await p.goto("/recovery/c");
    await p.getByRole("button", { name: "Adjust my next step" }).click();
    await p
      .getByRole("button", { name: "This occurrence only", exact: true })
      .click();
    await p
      .getByLabel("My next step", { exact: true })
      .fill("Rehearse one sentence");
    await p
      .getByLabel("Each session is done when")
      .fill("One sentence spoken aloud");
    await snap(p, "recovery-scope", width);
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p.getByLabel("Action time", { exact: true }).fill("13:00");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p.getByLabel("What will change in this plan?").fill("Try lunch once");
    await p.getByRole("button", { name: "Save revised agreement" }).click();
    await expect(p).toHaveURL(/\/app$/);
    await expect(
      p.getByRole("heading", { name: "Rehearse one sentence" }),
    ).toBeVisible();
    let s = await state(p);
    expect(s.reports[0].result).toBe("did_not_happen");
    const next = s.commitments.find((c: any) => c.state === "active");
    expect(next.repeat_template.action).toBe("Rehearse the opening");
    expect(
      s.definitions.filter((d: any) => d.commitment_id === next.id),
    ).toHaveLength(2);
    await p.getByRole("button", { name: "Step check-in", exact: true }).click();
    await p.getByRole("button", { name: "Done", exact: true }).click();
    await p
      .getByLabel("What happened?", { exact: true })
      .fill("One sentence rehearsed");
    await p
      .getByRole("button", { name: "Keep preparing", exact: true })
      .click();
    await p.getByRole("button", { name: "Save to Proof" }).click();
    await expect(p).toHaveURL(/\/app$/);
    await expect(
      p.getByRole("heading", { name: "Rehearse the opening" }),
    ).toBeVisible();
    s = await state(p);
    const following = s.commitments.find((c: any) => c.state === "active");
    expect(
      s.schedules.find(
        (t: any) => t.commitment_id === following.id && t.state === "current",
      ).local_time,
    ).toBe("12:00");
    expect(errors).toEqual([]);
  });
  test(`pause, explicit resume, and both support modes at ${width}`, async ({
    page: p,
  }) => {
    await p.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const f = fixture();
    f.send("commitment", {
      ...action,
      action: "Rehearse the opening",
      criterion: "Say the opening aloud once",
      localDate: "2020-01-01",
      location: "Office",
    });
    await seed(p, f.get(), "/app");
    await p.getByRole("button", { name: "Start timer" }).click();
    await p.getByRole("button", { name: "Plan", exact: true }).click();
    await snap(p, "plan-navigation", width);
    await p.locator("summary").filter({ hasText: "Review challenge" }).click();
    await p.getByRole("button", { name: "Pause, return or complete" }).click();
    await p.getByRole("button", { name: "Pause for now" }).click();
    await p
      .getByLabel("Why are you making this decision?")
      .fill("Make space to review");
    await p.getByRole("button", { name: "Save my decision" }).click();
    await expect(
      p.getByRole("heading", { name: "Paused. Still yours." }),
    ).toBeVisible();
    await expect(p.getByRole("button", { name: "Start timer" })).toHaveCount(0);
    await expect(p.getByRole("button", { name: "Step check-in" })).toHaveCount(
      0,
    );
    await snap(p, "paused-basecamp", width);
    await p.getByRole("button", { name: "Review and resume" }).click();
    await expect(p.getByText(/Earlier date/)).toBeVisible();
    await snap(p, "resume-review", width);
    await p.getByRole("button", { name: "Review this agreement" }).click();
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p.getByLabel("Action date", { exact: true }).fill("2030-10-02");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p
      .getByLabel("What will change in this plan?")
      .fill("Reviewed the old date");
    await p.getByRole("button", { name: "Save revised agreement" }).click();
    expect((await state(p)).goals[0].status).toBe("paused");
    await p.getByRole("button", { name: "Review and resume" }).click();
    await expect(p.getByLabel("Why are you ready to return?")).toHaveValue("");
    await p
      .getByLabel("Why are you ready to return?")
      .fill("I reviewed my dates");
    await p
      .getByRole("button", { name: "Resume challenge", exact: true })
      .click();
    expect((await state(p)).evidence).toHaveLength(0);
    await p.goto("/settings");
    await expect(p.getByText("Signed in as")).toBeVisible();
    await snap(p, "account-identity", width);
    await p.goto("/commitment/g");
    await expect(
      p.getByText(/what action would give you evidence/),
    ).toBeVisible();
    await p.getByRole("button", { name: "Help me find the words" }).click();
    await expect(
      p.getByRole("region", { name: "Writing guidance" }),
    ).toContainText("Complete the full rehearsal and answer two questions");
    await snap(p, "guided-help", width);
    const saved = await state(p);
    saved.supportMode = "on_request";
    await seed(p, { snapshot: saved, receipts: {} }, "/commitment/g");
    await expect(
      p.getByRole("region", { name: "Writing guidance" }),
    ).toHaveCount(0);
    await expect(
      p.getByText(/what action would give you evidence/),
    ).toHaveCount(0);
    await p.getByRole("button", { name: "Help me find the words" }).click();
    await expect(
      p.getByRole("region", { name: "Writing guidance" }),
    ).toContainText("Complete the full rehearsal and answer two questions");
    expect(errors).toEqual([]);
  });
}
