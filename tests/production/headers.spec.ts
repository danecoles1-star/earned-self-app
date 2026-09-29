import { test, expect } from "@playwright/test";
import { emptySnapshot, emptyFoundation } from "../../src/data/types";

test("production headers permit the real wallpaper preview and download without preview fixtures", async ({
  page,
}) => {
  const owner = "11111111-1111-4111-8111-111111111111",
    g = "22222222-2222-4222-8222-222222222222";
  const s = emptySnapshot();
  s.selectedGoal = g;
  s.goals = [
    {
      ...emptyFoundation(),
      id: g,
      owner_id: owner,
      kind: "goal",
      words: "My ambition",
      vision: "Become someone who follows through",
      meaning: "My own reason",
      status: "draft",
      version: 1,
      revision: 1,
      created_at: "2026-01-01",
    },
  ];
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") violations.push(msg.text());
  });
  page.on("pageerror", (e) => violations.push(e.message));
  await page.route("https://*.supabase.co/**", async (route) => {
    if (route.request().url().endsWith("/rest/v1/rpc/es_read_state"))
      await route.fulfill({ json: s });
    else await route.abort();
  });
  await page.addInitScript(
    ({ owner }) => {
      // Fake browser-only session; all backend calls are intercepted above.
      const token =
        btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) +
        "." +
        btoa(
          JSON.stringify({
            sub: owner,
            exp: 2524608000,
            role: "authenticated",
          }),
        ) +
        ".test-signature";
      localStorage.setItem(
        "sb-vovmkiuxmtnedfosoxds-auth-token",
        JSON.stringify({
          access_token: token,
          refresh_token: "test-only",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: 2524608000,
          user: {
            id: owner,
            aud: "authenticated",
            role: "authenticated",
            email: "test@example.invalid",
            app_metadata: {},
            user_metadata: {},
            created_at: "2026-01-01",
          },
        }),
      );
    },
    { owner },
  );
  const response = await page.goto("/wallpaper/" + g);
  expect(response!.headers()["content-security-policy"]).toContain(
    "img-src 'self' data: blob:",
  );
  await page
    .getByLabel("Words to carry", { exact: true })
    .fill("Keep showing up.");
  const picture = page.getByRole("img", {
    name: "Your lock-screen image preview",
  });
  await expect(picture).toBeVisible();
  await expect
    .poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(1170);
  await page
    .getByRole("button", { name: "Preview lock screen", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save image", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "Earned_Self_Lock_Screen.png",
  );
  await expect(
    page.getByText("Local preview · saved on this device"),
  ).toHaveCount(0);
  expect(violations).toEqual([]);
});
