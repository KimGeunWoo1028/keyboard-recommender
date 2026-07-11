// @ts-check
const path = require("path");
const { devices } = require("@playwright/test");

const authFile = path.join(__dirname, "playwright", ".auth", "user.json");

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
      // Phase D visual — tolerate minor AA / font raster differences.
      maxDiffPixelRatio: 0.04,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: `node "${path.join(__dirname, "scripts", "start-stack.cjs")}"`,
    url: "http://127.0.0.1:3000",
    /** Avoid attaching to a hand-run Next dev missing NEXT_PUBLIC_API_URL; opt in via PW_REUSE_SERVER=1. */
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 300_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
    },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: [/auth\.setup\.ts/, /results-visual-375\.spec\.ts/],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
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
  ],
};
