import { test, expect } from "@playwright/test";
import { emptySnapshot, emptyFoundation } from "../../src/data/types";

test("production calendar form opens an inline response under deployed CSP", async ({
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
  const c = "33333333-3333-4333-8333-333333333333";
  s.commitments = [
    {
      id: c,
      owner_id: owner,
      goal_id: g,
      milestone_id: null,
      plan_revision: 1,
      revision: 1,
      version: 1,
      state: "active",
      created_at: "2026-01-01",
    },
  ];
  s.definitions = [
    {
      commitment_id: c,
      goal_id: g,
      revision: 1,
      action: "Draft the opening paragraph",
      criterion: "One complete paragraph",
      mode: "deliberate",
    },
  ];
  s.schedules = [
    {
      id: "44444444-4444-4444-8444-444444444444",
      commitment_id: c,
      goal_id: g,
      commitment_revision: 1,
      local_date: "2030-11-01",
      local_time: "17:00",
      time_zone: "America/Denver",
      starts_at: "2030-11-01T23:00:00.000Z",
      location: "At my desk",
      state: "current",
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
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/calendar/" + g);
    expect(response!.headers()["content-security-policy"]).toContain(
      "form-action 'self'",
    );
    await expect(page).toHaveTitle("Earned Self");
    await expect(
      page.getByRole("heading", { name: "Make room for it." }),
    ).toBeVisible();
    await page.getByLabel("Duration").selectOption("45");
    const google = new URL(
      (await page
        .getByRole("link", { name: "Google Calendar" })
        .getAttribute("href")) as string,
    );
    expect(google.searchParams.get("dates")).toBe(
      "20301101T230000Z/20301101T234500Z",
    );
    await page.screenshot({
      path: `test-results/calendar-${width}.png`,
      fullPage: true,
    });
    const pending = page
      .context()
      .waitForEvent("request", {
        predicate: (r) => r.url().endsWith("/calendar-event.ics"),
      });
    await page
      .getByRole("button", { name: "Apple Calendar", exact: true })
      .click();
    const request = await pending;
    expect(request.method()).toBe("POST");
    expect(request.url()).not.toContain("?");
    const result = await request.response();
    expect(result?.status()).toBe(200);
    expect(result?.headers()["content-disposition"]).toContain("inline;");
    expect(result?.headers()["cache-control"]).toContain("no-store");
    expect(new URLSearchParams(request.postData()!).get("minutes")).toBe("45");
    await expect(
      page.getByRole("heading", { name: "Make room for it." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.getByRole("button", { name: "Continue without adding" }).click();
    await expect(page).toHaveURL(/\/app$/);
  }
  expect(violations).toEqual([]);
});
