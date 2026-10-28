import { test, expect } from "@playwright/test";
import { applyLocal, type LocalStore } from "../../src/data/domain";
import { emptySnapshot } from "../../src/data/types";
import { foundation, action } from "../fixtures";

// Local-only reference content, never imported by the application or sent to Supabase.
for (const width of [320, 390, 1440]) {
  test(`Statement reference and wallpaper export at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const owner = "local-preview-member";
    let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
    for (const command of [
      {
        kind: "goal" as const,
        payload: {
          ...foundation,
          id: "g",
          area: "physical" as const,
          vision: "Be capable of taking on a demanding endurance challenge.",
          words: "Complete my first triathlon",
        },
      },
      {
        kind: "commitment" as const,
        payload: { ...action, action: "Book a coached swim session" },
      },
    ])
      store = applyLocal(
        store,
        { ...command, actorId: owner, operationId: crypto.randomUUID() },
        owner,
      ).store;
    await page.goto("/");
    await page.evaluate((value) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(
        "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
        JSON.stringify(value),
      );
      localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
    }, store);
    await page.goto("/app");
    await expect(page.locator(".redesign-now-panel")).toHaveCSS(
      "height",
      width >= 900 ? "434px" : "530px",
    );
    await expect(page.locator(".stage-main")).toHaveCSS(
      "background-color",
      "rgb(246, 241, 232)",
    );
    await expect(page.locator(".plan-mineral-surface")).toHaveCount(0);
    const panel = (await page.locator(".redesign-now-panel").boundingBox())!;
    const begin = (await page
      .getByRole("button", { name: "Begin", exact: true })
      .boundingBox())!;
    expect(
      Math.abs(begin.x + begin.width / 2 - (panel.x + panel.width / 2)),
    ).toBeLessThan(1);
    expect(
      Math.abs(
        begin.y +
          begin.height / 2 -
          (panel.y + panel.height * (width >= 900 ? 0.56 : 0.569)),
      ),
    ).toBeLessThan(1);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((i) => i.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: `test-results/statement-now-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Create wallpaper", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Use Halo on Ivory wallpaper", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Halo on Ivory", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Use my own vision", exact: true })
      .click();
    await expect(page.locator(".wallpaper-image")).toBeVisible();
    await page
      .getByRole("button", { name: "Preview lock screen", exact: true })
      .click();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download image", exact: true })
      .click();
    expect((await downloading).suggestedFilename()).toBe(
      "Earned_Self_Lock_Screen.png",
    );
    await page.goto("/app");
    await page.getByRole("button", { name: "Personal", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "I have a challenge", exact: false }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/statement-empty-${width}.png`,
      fullPage: true,
    });
  });
}
