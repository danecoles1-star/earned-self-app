import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`How It Works leads directly into existing onboarding at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await expect(
      page.getByRole("heading", { name: "Become You." }),
    ).toBeVisible();
    const exampleSelector = page.getByRole("group", {
      name: "Choose an example",
    });
    await exampleSelector.scrollIntoViewIfNeeded();
    await page.locator(".example-story img").evaluate((image) => {
      if (!(image instanceof HTMLImageElement) || image.complete) return;
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    });
    const professional = exampleSelector.getByRole("button", {
      name: "Professional",
      exact: true,
    });
    await professional.click();
    await expect(professional).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText("Deliver a keynote at an industry conference."),
    ).toBeVisible();
    await exampleSelector
      .getByRole("button", { name: "Personal", exact: true })
      .click();
    await expect(
      page.getByText("Finish my novella and share it with three readers."),
    ).toBeVisible();
    await exampleSelector
      .getByRole("button", { name: "Physical", exact: true })
      .click();
    await expect(page.getByText("Complete my first triathlon.")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page
      .locator(".how-examples")
      .getByRole("button", { name: "Build my challenge" })
      .click();
    await expect(page).toHaveURL(/\/start$/);
    await expect(
      page.getByRole("heading", { name: "Where do you want to grow?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
