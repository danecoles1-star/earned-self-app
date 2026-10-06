import { test, expect } from "@playwright/test";
import { emptySnapshot } from "../../src/data/types";
import { foundation } from "../fixtures";
for (const width of [390, 1440])
  test(`scheduled recurring preparation and Proof at ${width}`, async ({
    page: p,
  }) => {
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.setViewportSize({ width, height: 900 });
    const s = emptySnapshot();
    s.selectedGoal = "g";
    s.goals = [
      {
        ...foundation,
        id: "g",
        owner_id: "local-preview-member",
        kind: "goal",
        created_at: "2026-10-01",
        version: 1,
        revision: 1,
        status: "draft",
      },
    ];
    await p.goto("/");
    await p.evaluate((s) => {
      localStorage.clear();
      localStorage.setItem(
        "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
        JSON.stringify({ snapshot: s, receipts: {} }),
      );
      localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
    }, s);
    await p.goto("/add-step/g");
    await p
      .getByLabel("My next step", { exact: true })
      .fill("Morning stretching");
    await p
      .getByLabel("Done means", { exact: true })
      .fill("Complete ten minutes and note how I feel");
    await p.getByRole("button", { name: "Repeat", exact: true }).click();
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(p.getByLabel("Action date", { exact: true })).toHaveAttribute(
      "type",
      "date",
    );
    await expect(p.getByLabel("Action time", { exact: true })).toHaveAttribute(
      "type",
      "time",
    );
    await expect(p.locator('input[type="date"]')).toHaveCount(2);
    await p.getByLabel("Action date", { exact: true }).click();
    await p.keyboard.press("Escape");
    await p.getByLabel("Action date", { exact: true }).fill("2030-11-02");
    await p.getByLabel("Action time", { exact: true }).fill("06:00");
    await p.getByLabel("Where?", { exact: true }).fill("Bedroom");
    await expect(
      p.locator(".local-datetime-value").filter({ hasText: "11/02/2030" }),
    ).toBeVisible();
    await p.screenshot({
      path: `/tmp/picker-fields-${width}.png`,
      fullPage: true,
    });

    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(p.getByText("11/02/2030 · 6:00 AM")).toBeVisible();
    await p.getByRole("button", { name: "Save step", exact: true }).click();
    await expect(p).toHaveURL(/\/app$/);
    await expect(
      p.getByRole("heading", { name: "Morning stretching", exact: true }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Start timer", exact: true }).click();
    await p.waitForTimeout(1100);
    await p.reload();
    await expect(p.getByRole("button", { name: "Pause timer" })).toBeVisible();
    await p.getByRole("button", { name: "Step check-in" }).click();
    await p.getByRole("button", { name: "Done", exact: true }).click();
    await p
      .getByLabel("What happened?", { exact: true })
      .fill("Ten minutes completed");
    await p.getByRole("button", { name: "Keep preparing" }).click();
    await p.getByRole("button", { name: "Save to Proof" }).click();
    await expect(p).toHaveURL(/\/app$/);
    await expect(p.locator(".timer-schedule")).toHaveText(
      "11/03/2030 · 6:00 AM",
    );
    const padding = await p
      .getByRole("button", { name: "Why & obstacles", exact: true })
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));
    expect(padding).toBeGreaterThanOrEqual(14);
    await p.screenshot({
      path: `/tmp/pilot-basecamp-${width}.png`,
      fullPage: true,
    });
    await p.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(p.locator(".plan-focus-stage > .section-label")).toHaveText(
      "Current milestone",
    );
    await p.locator("summary").filter({ hasText: "Manage challenge" }).click();
    await p
      .getByRole("button", { name: "Refine my vision", exact: true })
      .click();
    await p
      .getByLabel("Who I am becoming", { exact: true })
      .fill("Healthy enough to climb mountains into my 70s");
    await p.getByRole("button", { name: "Save vision", exact: true }).click();
    await expect(
      p.getByRole("button", { name: "Refine my vision", exact: true }),
    ).toBeVisible();
    await expect(
      p.getByText("Saved on this device. Preview data only.", {
        exact: true,
      }),
    ).toBeVisible();
    await p.reload();
    await p.getByRole("button", { name: "Basecamp", exact: true }).click();
    await expect(
      p.getByText("Healthy enough to climb mountains into my 70s", {
        exact: true,
      }),
    ).toBeVisible();
    await p.screenshot({
      path: `/tmp/pilot-plan-${width}.png`,
      fullPage: true,
    });
    await p.getByRole("button", { name: "Proof", exact: true }).click();
    await p.getByRole("button", { name: /Morning stretching/ }).click();
    await expect(p.getByText("Ten minutes completed")).toBeVisible();
    await expect(
      p.getByRole("button", { name: "Return to Basecamp" }),
    ).toBeVisible();
    await p.screenshot({
      path: `/tmp/pilot-proof-${width}.png`,
      fullPage: true,
    });
    await p.getByRole("button", { name: "Return to Basecamp" }).click();
    await expect(
      p.getByRole("region", { name: "Step details & calendar" }),
    ).toBeVisible();
    await p.getByRole("button", { name: /Add to calendar/ }).click();
    await expect(
      p.getByRole("button", { name: "Return to Basecamp" }),
    ).toBeVisible();
    const download = p.waitForEvent("download");
    await p.getByRole("button", { name: "Apple Calendar" }).click();
    expect((await download).suggestedFilename()).toBe("Earned_Self_Move.ics");
    await p.getByRole("button", { name: "Return to Basecamp" }).click();
    await p.getByRole("button", { name: /Take your vision with you/ }).click();
    await p.getByRole("button", { name: "Use my own vision" }).click();
    await p.getByRole("button", { name: "Mineral", exact: true }).click();
    await p.getByRole("button", { name: "Preview lock screen" }).click();
    await expect(
      p.getByRole("img", { name: "Your lock-screen image preview" }),
    ).toBeVisible();
    await p.screenshot({
      path: `/tmp/pilot-wallpaper-${width}.png`,
      fullPage: true,
    });
    await p.evaluate(() => {
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: () => true,
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          throw new DOMException("Cancelled", "AbortError");
        },
      });
    });
    let downloads = 0;
    p.on("download", () => downloads++);
    await p.getByRole("button", { name: "Save to phone", exact: true }).click();
    await p.waitForTimeout(150);
    expect(downloads).toBe(0);
    const img = p.waitForEvent("download");
    await p
      .getByRole("button", { name: "Download image", exact: true })
      .click();
    expect((await img).suggestedFilename()).toBe("Earned_Self_Lock_Screen.png");
    expect(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    ).toBe(false);
    expect(errors).toEqual([]);
  });
