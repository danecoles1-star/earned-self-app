import { test, expect } from "@playwright/test";
import { applyLocal, type LocalStore } from "../../src/data/domain";
import { emptySnapshot } from "../../src/data/types";
import { foundation, action } from "../fixtures";

// Disposable local data only. Covers the supporting surfaces of the approved redesign.
for (const width of [320, 390, 1440]) {
  test(`supporting design surfaces at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const owner = "local-preview-member";
    let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
    for (const command of [
      {
        kind: "goal" as const,
        payload: { ...foundation, id: "g", area: "professional" as const },
      },
      { kind: "commitment" as const, payload: action },
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
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, route] of Object.entries({
      now: "/app",
      plan: "/manage",
      proof: "/proof",
      account: "/settings",
      calendar: "/calendar/g",
      wallpaper: "/wallpaper/g",
      preparation: "/plan/g",
      step: "/commitment/g",
      milestone: "/add-milestone/g",
      checkin: "/report/g",
      decision: "/decision/g",
      resume: "/resume/g",
      history: "/history",
      unavailable: "/proof/missing",
      notfound: "/unknown-screen",
    })) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeAttached();
      await expect(
        page.getByRole("heading", { name: /Opening your/ }),
      ).toHaveCount(0);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((i) => i.decode().catch(() => {})),
        );
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        name,
      ).toBeLessThanOrEqual(width);
      expect(
        await page
          .locator("img")
          .evaluateAll(
            (images) =>
              images.filter((i) => !i.complete || !i.naturalWidth).length,
          ),
        name,
      ).toBe(0);
      await page.screenshot({
        path: `test-results/design-${name}-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}
