import { test, expect } from "@playwright/test";
import { applyLocal, type LocalStore } from "../../src/data/domain";
import { emptySnapshot } from "../../src/data/types";
import { foundation, action } from "../fixtures";

// Local-only reference content, never imported by the application or sent to Supabase.
for (const width of [320, 390, 1440, 1680]) {
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
    const beginControl = page.getByRole("button", { name: "Begin", exact: true });
    await expect(beginControl).toHaveCSS("background-color", "rgb(94, 119, 131)");
    await expect(beginControl).toHaveCSS("color", "rgb(246, 241, 232)");
    await expect(beginControl).toHaveCSS("border-top-width", "3px");
    await expect(beginControl).toHaveCSS("border-top-color", "rgb(255, 91, 54)");
    await expect(beginControl).toHaveCSS("animation-name", "none");
    const pulse = () => beginControl.evaluate(el => getComputedStyle(el, "::after").animationName);
    expect(await pulse()).toBe("none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await pulse()).toBe("ppulse");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await pulse()).toBe("none");
    const frame = (await page.locator(".focus-stage").boundingBox())!;
    expect(Math.abs(frame.width - width)).toBeLessThan(1);
    await expect(page.locator(".statement-foot-band")).toBeHidden();
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
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    await expect(navigation).toHaveCSS("position", "fixed");
    const initialNav = (await navigation.boundingBox())!;
    expect(Math.abs(initialNav.y + initialNav.height - 900)).toBeLessThan(1);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const scrolledNav = (await navigation.boundingBox())!;
    expect(Math.abs(scrolledNav.y - initialNav.y)).toBeLessThan(1);
    const lastControl = (await page
      .getByRole("button", { name: "Create wallpaper", exact: true })
      .boundingBox())!;
    expect(lastControl.y + lastControl.height).toBeLessThanOrEqual(
      scrolledNav.y,
    );
    await page.screenshot({
      path: `test-results/statement-bottom-${width}.png`,
      fullPage: false,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/statement-now-${width}.png`,
      fullPage: false,
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
    for (const [route, name] of [["/manage", "plan"], ["/proof", "proof"]]) {
      await page.goto(route);
      const band = page.locator(".statement-foot-band");
      await expect(band).toBeVisible();
      await expect(band).toHaveCSS("height", width >= 900 ? "96px" : "88px");
      await expect(band).toHaveAttribute("aria-hidden", "true");
      expect(await band.textContent()).toBe("");
      expect(Math.abs((await band.boundingBox())!.width - width)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `test-results/board-${name}-${width}.png` });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const nav = (await page.getByRole("navigation", { name: "Main navigation" }).boundingBox())!;
      const bottom = (await band.boundingBox())!;
      expect(bottom.y + bottom.height).toBeLessThanOrEqual(nav.y);
      await page.screenshot({ path: `test-results/board-${name}-foot-${width}.png` });
    }
    await page.goto("/settings");
    await expect(page.getByRole("button", { name: /Guide me|Help when I ask/ })).toHaveCount(0);
    await page.goto("/app");
    await page.getByRole("button", { name: "Personal", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "I have a challenge", exact: false }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/statement-empty-${width}.png`,
      fullPage: false,
    });
  });
}
