import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "public",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: [],
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        // Fresh server so E2E_BYPASS_AUTH is applied (CI always; local too)
        reuseExistingServer: !process.env.CI && process.env.E2E_BYPASS_AUTH === "0",
        timeout: 180_000,
        env: {
          ...process.env,
          // Logged-in e2e only — never set on production hosts
          E2E_BYPASS_AUTH:
            process.env.E2E_BYPASS_AUTH === "0" ? "0" : "1",
          NODE_ENV: process.env.NODE_ENV ?? "development",
        },
      },
});
