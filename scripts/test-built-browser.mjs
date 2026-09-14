import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";

// Run after an UNCONFIGURED normal build. Starts its own loopback-only static server.
// Never uses a remote endpoint or real account. This checks fail-closed integration.
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4175",
    "--strictPort",
  ],
  { stdio: "ignore" },
);
process.on("exit", () => server.kill());
let online = false;
for (let i = 0; i < 40; i++) {
  try {
    await fetch("http://127.0.0.1:4175");
    online = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 100));
  }
}
assert.equal(online, true, "Local static server must start");
const browser = await chromium.launch(
  process.env.ES_BROWSER_EXECUTABLE
    ? {
        executablePath: process.env.ES_BROWSER_EXECUTABLE,
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--use-gl=angle",
          "--use-angle=swiftshader",
        ],
      }
    : {},
);
const output = process.env.ES_SCREENSHOTS_DIR ?? "test-results/screenshots";
fs.mkdirSync(output, { recursive: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
for (const width of [375, 390, 430, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://127.0.0.1:4175/?demo=maya&preview=true");
  await page.waitForSelector(".pursuit-photo img");
  assert.equal(
    await page.getByRole("button", { name: "Test next save failure" }).count(),
    0,
  );
  assert.equal(await page.locator("main>section").count(), 6);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const photo = page.locator(".pursuit-photo img");
  await photo.evaluate(async (e) => {
    if (!e.complete)
      await new Promise((r) => e.addEventListener("load", r, { once: true }));
  });
  assert.equal(
    await photo.evaluate((e) => getComputedStyle(e).objectPosition),
    "72% 50%",
  );
  await page.screenshot({
    path: `${output}/built-homepage-${width}.png`,
    fullPage: true,
  });
  await photo.screenshot({ path: `${output}/ceramics-${width}.png` });
  await page
    .getByRole("button", { name: "Start with a goal", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Your goal", { exact: true })
    .fill("My own goal, not a demonstration.");
  await page
    .getByRole("button", { name: "Keep my draft and continue" })
    .click();
  await page.reload();
  assert.equal(
    await page.getByRole("button", { name: "Enter local preview" }).count(),
    0,
  );
  const submit = page.getByRole("button", { name: "Email me a sign-in link" });
  await submit.waitFor();
  assert.equal(await submit.isDisabled(), true);
  assert.equal(
    await submit.evaluate((e) => getComputedStyle(e).backgroundColor),
    "rgb(117, 111, 108)",
  );
  assert.equal(
    await page
      .getByText("Account saving is not connected yet.", { exact: false })
      .count(),
    1,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: `${output}/unconnected-auth-${width}.png`,
    fullPage: true,
  });
  console.log(
    `PASS normal build ${width}: six sections, no overflow, image, retained draft, no preview bypass, disabled unconnected saving`,
  );
}
await browser.close();
server.kill();
