// @ts-check
const path = require("path");
const { devices } = require("@playwright/test");

const authFile = path.join(__dirname, "playwright", ".auth", "user.json");
const reuseExistingServer = process.env.PW_REUSE_SERVER === "1";
const baseURL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";
// Ensure test workers (auth.setup, specs) share the same API origin as start-stack / CI.
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000";
}

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: path.join(__dirname, "tests"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      // Antialias / font raster only — keep ≤0.01 (Visual QA V-P2 / V-SNAP-02).
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  ...(reuseExistingServer
    ? {}
    : {
        webServer: {
          command: `node "${path.join(__dirname, "scripts", "start-stack.cjs")}"`,
          url: "http://127.0.0.1:3000",
          timeout: 300_000,
          env: {
            ...process.env,
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
            // Mirror start-stack: account save tests need persistence on.
            ENABLE_EVALUATION_PERSISTENCE: "true",
          },
        },
      }),
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: [/auth\.setup\.ts/, /results-visual-375\.spec\.ts/, /account-delete\.spec\.ts/, /catalog-visual-smoke\.spec\.ts/, /design-system-smoke\.spec\.ts/],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      /**
       * Phase 7 account deletion — disposable signup (no e2e-ci storage).
       * Does not depend on setup; never loads shared auth state.
       */
      name: "account-delete",
      testMatch: /account-delete\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      /** Phase D — optional visual; run via `npm run test:visual` (weekly / path-filtered). */
      name: "visual-375",
      testMatch: /results-visual-375\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
        viewport: { width: 375, height: 812 },
      },
    },
    {
      /** Catalog list fixture smoke — no auth / API required. */
      name: "catalog-visual",
      testMatch: /catalog-visual-smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      /** Design System overlay/contract smoke (Storybook stand-in). */
      name: "design-system",
      testMatch: /design-system-smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
};
