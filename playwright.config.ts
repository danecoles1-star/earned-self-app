import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: process.env.ES_BROWSER_EXECUTABLE
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
      },
    },
    { name: "firefox", use: { browserName: "firefox" } },
  ],
  webServer: {
    command: "npm run preview:local -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
