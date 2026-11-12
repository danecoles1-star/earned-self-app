import { test, expect } from "@playwright/test";
import { applyLocal } from "../../src/data/domain";
import { emptySnapshot } from "../../src/data/types";
import { foundation } from "../fixtures";

for (const width of [320, 390, 1440])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Wallpaper words, colors and export at ${width} ${colorScheme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      const owner = "local-preview-member";
      const store = applyLocal(
        { snapshot: emptySnapshot(), receipts: {} },
        {
          actorId: owner,
          operationId: "wallpaper-fixture",
          kind: "goal",
          payload: { ...foundation, id: "g", area: "professional" },
        },
        owner,
      ).store;
      await page.goto("/");
      await page.evaluate((store) => {
        localStorage.setItem(
          "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
          JSON.stringify(store),
        );
        localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
      }, store);
      await page.goto("/wallpaper/g");
      await expect(
        page.getByLabel("Words to carry", { exact: true }),
      ).toHaveValue(foundation.words);
      await page
        .getByRole("button", { name: "Milestone", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Launch shop", exact: true })
        .click();
      await expect(
        page.getByLabel("Words to carry", { exact: true }),
      ).toHaveValue("Launch shop");
      await page.getByRole("button", { name: "Becoming", exact: true }).click();
      await expect(
        page.getByLabel("Words to carry", { exact: true }),
      ).toHaveValue(foundation.vision);
      await expect(page.locator(".wallpaper-swatch")).toHaveCount(5);
      await page
        .getByRole("button", { name: "Prepared Mineral", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Preview lock screen", exact: true }),
      ).toBeEnabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      // A successful screenshot must have functioning typography, not just loaded images.
      expect((await page.locator("h1").boundingBox())!.height).toBeGreaterThan(
        20,
      );
      await expect(page.locator(".skip")).not.toBeInViewport();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      await page.screenshot({
        path: testInfo.outputPath("editor.png"),
        fullPage: true,
        style: ".skip { visibility: hidden !important; }",
      });
      await page
        .getByRole("button", { name: "Preview lock screen", exact: true })
        .click();
      const preview = page.getByRole("img", {
        name: "Your wallpaper image preview",
      });
      await expect(preview).toBeVisible();
      expect(
        await preview.evaluate((img: HTMLImageElement) => [
          img.naturalWidth,
          img.naturalHeight,
        ]),
      ).toEqual([1170, 2532]);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await page.screenshot({
        path: testInfo.outputPath("export.png"),
        fullPage: true,
        style: ".skip { visibility: hidden !important; }",
      });
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Save to phone", exact: true })
        .click();
      const downloaded = await download;
      expect(downloaded.suggestedFilename()).toBe(
        "Earned_Self_Lock_Screen.png",
      );
      await downloaded.saveAs(testInfo.outputPath("wallpaper.png"));
    });
  }
