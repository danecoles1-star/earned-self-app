import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`How It Works leads directly into existing onboarding at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await expect(
      page.getByRole("heading", { name: "Become You." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Professional", exact: true })
      .click();
    await expect(
      page.getByText("Deliver a keynote at an industry conference."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Personal", exact: true }).click();
    await expect(
      page.getByText("Bring my scattered family together for a reunion."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Physical", exact: true }).click();
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
      page.getByRole("heading", { name: "What brings you here?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
