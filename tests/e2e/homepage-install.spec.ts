import { test, expect } from "@playwright/test";

for (const colorScheme of ["light", "dark"] as const)
  for (const width of [320, 390, 1440]) {
    test(`homepage and install assets: ${colorScheme} ${width}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Become You." }),
      ).toBeVisible();
      await expect(
        page.locator(".es-home-phone-app[inert][aria-hidden=true]"),
      ).toHaveCount(3);
      await expect(
        page.getByRole("button", { name: "Begin", exact: true }),
      ).toHaveCount(0);
      await expect(page.locator(".es-home-dock")).not.toBeInViewport();
      for (const area of ["Physical", "Professional", "Personal"]) {
        await page.getByRole("button", { name: area, exact: true }).click();
        const photo = page.locator(".es-home-example img");
        await expect(photo).toBeVisible();
        await expect
          .poll(() =>
            photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
          )
          .toBeGreaterThan(0);
        if (width !== 320)
          await page.locator(".es-home-example").screenshot({
            path: `docs/homepage-review/${colorScheme}-${width}-${area.toLowerCase()}.png`,
            style: ".es-home-dock { visibility: hidden !important; }",
          });
      }
      if (width < 900) {
        await expect(page.locator(".es-home-dock")).toBeInViewport();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      if (width !== 320) {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
        await expect(page.locator(".es-home-dock")).not.toBeInViewport();
        await page.screenshot({
          path: `docs/homepage-review/${colorScheme}-${width}-homepage.png`,
          fullPage: true,
        });
      }
      const manifestURL = await page
        .locator('link[rel="manifest"]')
        .getAttribute("href");
      const response = await page.request.get(manifestURL!);
      expect(response.ok()).toBeTruthy();
      const manifest = await response.json();
      expect(manifest.start_url).toBe("/app");
      expect(manifest.display).toBe("standalone");
      for (const icon of manifest.icons) {
        const asset = await page.request.get(icon.src);
        expect(asset.ok()).toBeTruthy();
        expect(asset.headers()["content-type"]).toContain("image/png");
      }
      await page.getByRole("button", { name: "Make it mine" }).click();
      await expect(
        page.getByLabel("Step 1 of 6", { exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
