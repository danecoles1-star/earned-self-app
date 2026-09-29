import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/production",
  timeout: 30000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    headless: true,
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
  webServer: {
    command: "node scripts/serve-test-build.mjs",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
