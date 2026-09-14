import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
const widths = [375, 390, 430, 768, 1024, 1440];
const evidenceRoot =
  process.env.ES_SCREENSHOTS_DIR ?? "test-results/screenshots";
async function bounds(p: Page) {
  const info = await p.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    wide: [...document.querySelectorAll("main *")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width &&
          r.right > innerWidth + 1 &&
          getComputedStyle(e).position !== "absolute"
        );
      })
      .map((e) => ({ tag: e.tagName, cls: e.className }))
      .slice(0, 10),
  }));
  expect(info.scroll, JSON.stringify(info)).toBeLessThanOrEqual(info.width);
}
async function start(p: Page) {
  await p.goto("/");
  await p
    .getByRole("button", { name: "Start with a goal", exact: true })
    .first()
    .click();
  await p
    .getByLabel("Your goal", { exact: true })
    .fill("Finish and share my essay.");
  await p.getByRole("button", { name: "Keep my draft and continue" }).click();
  await p.reload();
  await p.getByRole("button", { name: "Enter local preview" }).click();
  await p.getByRole("button", { name: "Save my goal" }).click();
  await expect(
    p.getByRole("heading", { name: "Make the next move clear." }),
  ).toBeVisible();
}
test("homepage recognizes an authenticated returning member", async ({
  page,
}) => {
  await start(page);
  await page.goto("/");
  const accountButton = page.getByRole("button", {
    name: "My goal",
    exact: true,
  });
  await expect(accountButton).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  await accountButton.click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
});
for (const width of widths) {
  test(`first loop and responsive ${width}`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page).toHaveTitle("Earned Self | Private test");
    await expect(page.locator("main>section")).toHaveCount(6);
    await bounds(page);
    const photo = page.locator(".pursuit-photo img");
    await expect(photo).toHaveCSS("object-position", "72% 50%");
    const shape = await photo.evaluate((e: HTMLImageElement) => ({
      w: e.getBoundingClientRect().width,
      h: e.getBoundingClientRect().height,
      loaded: e.complete && e.naturalWidth > 0,
    }));
    expect(shape.loaded).toBe(true);
    expect(shape.w / shape.h).toBeCloseTo(1.5, 1);
    fs.mkdirSync(evidenceRoot, { recursive: true });
    if (browserName === "chromium")
      await page.screenshot({
        path: `${evidenceRoot}/homepage-${width}.png`,
        fullPage: true,
      });
    await start(page);
    await bounds(page);
    await page
      .getByLabel("Your action", { exact: true })
      .fill("Write the opening paragraph.");
    await page
      .getByLabel("Done means", { exact: true })
      .fill("One paragraph saved in my draft.");
    await page
      .getByText("Timing and location, optional", { exact: true })
      .click();
    await page.getByLabel("Date", { exact: true }).fill("2020-01-10");
    await page.getByLabel("Time zone", { exact: true }).fill("America/Denver");
    await page.getByLabel("Location", { exact: true }).fill("My desk");
    if (browserName === "chromium")
      await page.screenshot({
        path: `${evidenceRoot}/commitment-${width}.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Review my commitment" }).click();
    await bounds(page);
    await expect(
      page.getByRole("heading", { name: "I’m choosing this." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save my commitment" }).click();
    await expect(
      page.getByRole("heading", { name: "Write the opening paragraph." }),
    ).toBeVisible();
    await expect(
      page.getByText("No outcome reported yet.", { exact: false }),
    ).toBeVisible();
    await bounds(page);
    if (browserName === "chromium")
      await page.screenshot({
        path: `${evidenceRoot}/pursuit-${width}.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Test next save failure" }).click();
    await page
      .getByRole("button", { name: "Didn’t happen", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("save failed");
    await expect(
      page.getByRole("button", { name: "Didn’t happen", exact: true }),
    ).toBeVisible();
    if (browserName === "chromium" && width === 390)
      await page.screenshot({
        path: `${evidenceRoot}/failed-save-390.png`,
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Didn’t happen", exact: true })
      .click();
    await expect(
      page.getByText("Your reported outcome · Didn’t happen"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Add factual detail or reflection" })
      .click();
    await page
      .getByLabel("What happened (optional)", { exact: true })
      .fill("Work ran late.");
    await page
      .getByLabel("What I learned (optional)", { exact: true })
      .fill("I want to try after lunch.");
    await page.getByRole("button", { name: "Save optional detail" }).click();
    await expect(
      page.getByRole("button", { name: "Edit factual detail or reflection" }),
    ).toBeVisible();
    await expect(
      page
        .locator(".record-passage")
        .getByText("I want to try after lunch.", { exact: true }),
    ).toBeVisible();
    await bounds(page);
    if (browserName === "chromium")
      await page.screenshot({
        path: `${evidenceRoot}/record-detail-${width}.png`,
        fullPage: true,
      });
    await page.reload();
    await expect(
      page.getByText("I want to try after lunch.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Make another commitment" }).click();
    await expect(
      page.getByRole("button", { name: "Quick", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByLabel("Your action", { exact: true })
      .fill("Write for ten minutes after lunch.");
    await page
      .getByLabel("Done means", { exact: true })
      .fill("Ten minutes spent writing.");
    await page.getByRole("button", { name: "Save this step" }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Record", exact: true }).click();
    await expect(page.locator(".entry-link")).toHaveCount(2);
    await bounds(page);
    if (browserName === "chromium")
      await page.screenshot({
        path: `${evidenceRoot}/record-index-${width}.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("button", { name: "Enter local preview" }).click();
    await page.getByRole("button", { name: "Record", exact: true }).click();
    await expect(page.locator(".entry-link")).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}
test("homepage dialog contains keyboard focus and restores opener", async ({
  page,
}) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "See this example" });
  await open.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  const focus = await open.evaluate((e) => ({
    outline: getComputedStyle(e).outlineStyle,
    width: getComputedStyle(e).outlineWidth,
  }));
  expect(focus.outline).toBe("solid");
  expect(focus.width).toBe("3px");
});
test("long Unicode and unbroken text wraps without silent truncation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await start(page);
  const text = "My words 自分の言葉 ✨ " + "a".repeat(650) + "\nA second line.";
  await page.getByLabel("Your action", { exact: true }).fill(text);
  await page
    .getByLabel("Done means", { exact: true })
    .fill("A finished draft.");
  await page.getByRole("button", { name: "Review my commitment" }).click();
  await bounds(page);
  await page.getByRole("button", { name: "Save my commitment" }).click();
  await expect(page.getByRole("heading", { name: text })).toBeVisible();
  await bounds(page);
  await page.getByRole("button", { name: "Partly", exact: true }).click();
  await bounds(page);
  await expect(page.locator(".record-detail h1")).toHaveText(text);
});
test("CTA colors and calculated contrast", async ({ page }) => {
  await page.goto("/");
  const b = page
    .getByRole("button", { name: "Start with a goal", exact: true })
    .first();
  await expect(b).toHaveCSS("background-color", "rgb(189, 67, 45)");
  await expect(b).toHaveCSS("color", "rgb(255, 255, 255)");
  await b.hover();
  await expect(b).toHaveCSS("background-color", "rgb(175, 62, 41)");
  const L = (rgb: number[]) =>
    rgb
      .map((c) => c / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  expect(1.05 / (L([189, 67, 45]) + 0.05)).toBeGreaterThanOrEqual(4.5);
  await page.mouse.down();
  await expect(b).toHaveCSS("background-color", "rgb(166, 59, 40)");
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await b.focus();
  await expect(b).toBeFocused();
  expect(await b.evaluate((e) => getComputedStyle(e).outlineWidth)).toBe("3px");
});

test("empty account, vision draft and keyboard entry remain separate from the public example", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/?demo=maya&fixture=alex");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Enter local preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Your goal belongs here." }),
  ).toBeVisible();
  await bounds(page);
  await page.screenshot({
    path: `${evidenceRoot}/empty-home-390.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No outcomes recorded yet." }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Maya");
  await page.screenshot({
    path: `${evidenceRoot}/empty-record-390.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "My goal", exact: true }).click();
  await page
    .getByRole("button", { name: "Start with a goal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "I have a vision for myself" })
    .click();
  const field = page.getByLabel("Your vision", { exact: true });
  await field.focus();
  await page.keyboard.type("Share the work I keep to myself.");
  await page.keyboard.press("Tab");
  await expect(
    page.getByLabel("Why this matters to you (optional)"),
  ).toBeFocused();
  await page.screenshot({
    path: `${evidenceRoot}/vision-entry-390.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save my goal" }).click();
  await expect(
    page.getByRole("heading", { name: "Make the next move clear." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.screenshot({
    path: `${evidenceRoot}/preview-auth-390.png`,
    fullPage: true,
  });
});
