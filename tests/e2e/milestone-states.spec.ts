import { test, expect } from "@playwright/test";
import { emptySnapshot, emptyFoundation } from "../../src/data/types";
import { foundation } from "../fixtures";

for (const width of [390, 1440]) {
  for (const mode of ["empty", "pending", "complete"] as const) {
    test(`milestones ${mode} at ${width}px`, async ({ page }) => {
      const s = emptySnapshot();
      const g = "11111111-1111-4111-8111-111111111111";
      s.selectedGoal = g;
      s.goals = [
        {
          ...emptyFoundation(),
          ...foundation,
          id: g,
          owner_id: "local-preview-member",
          kind: "goal",
          created_at: "2026-01-01",
          revision: 1,
          version: 1,
          status: mode === "empty" ? "draft" : "active",
          milestones: mode === "empty" ? [] : foundation.milestones,
        },
      ];
      if (mode === "complete") {
        s.events = foundation.milestones.map((m) => ({
          id: m.id,
          goal_id: g,
          kind: "milestone",
          data: { milestoneId: m.id, detail: "Verified completed work" },
          recorded_at: "2026-01-01",
        }));
      }
      await page.addInitScript((s) => {
        localStorage.setItem(
          "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
          JSON.stringify({ snapshot: s, receipts: {} }),
        );
        localStorage.setItem(
          "earned-self:LOCAL-PREVIEW-ONLY:session",
          "active",
        );
      }, s);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/manage");
      await expect(page).toHaveTitle("Earned Self");
      const label =
        mode === "empty"
          ? "None planned yet"
          : mode === "complete"
            ? "All completed"
            : foundation.milestones[0].title;
      await page
        .getByRole("button", { name: `Milestones · ${label}`, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/milestone/${g}$`));
      if (mode === "pending") {
        await expect(
          page.getByRole("heading", { name: "Did you reach it?" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Mark milestone complete" }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("heading", {
            name:
              mode === "empty"
                ? "No milestones yet."
                : "Every milestone reached.",
          }),
        ).toBeVisible();
        await expect(page.getByRole("textbox")).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Mark milestone complete" }),
        ).toHaveCount(0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.screenshot({
        path: `/tmp/es-milestones-${mode}-${width}.png`,
        fullPage: true,
      });
      if (mode === "empty") {
        await page
          .getByRole("button", { name: "Prepare my ambition", exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`/plan/${g}$`));
      }
      if (mode === "complete") {
        await page
          .getByRole("button", { name: "Return to my ambition", exact: true })
          .click();
        await expect(page).toHaveURL(/\/manage$/);
      }
      expect(errors).toEqual([]);
    });
  }
}
