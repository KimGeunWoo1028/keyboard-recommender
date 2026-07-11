/**
 * Phase 0 baseline: capture /recommend entry screen (before quick-removal).
 * Usage: node scripts/capture-recommend-entry-baseline.cjs
 * Requires frontend on http://127.0.0.1:3000 and API on http://127.0.0.1:8000
 * (same as Playwright start-stack.cjs).
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const email = process.env.E2E_USER_EMAIL ?? "e2e-ci@keyboard.local";
const password = process.env.E2E_USER_PASSWORD ?? "E2e_test!9";
const baseURL = process.env.PW_BASE_URL ?? "http://localhost:3000";
const outDir = path.resolve(__dirname, "..", "..", "docs", "baselines", "recommendation-engine-unification");
const outFile = path.join(outDir, "phase0-recommend-entry-before.png");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/auth?next=/recommend`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("form").getByRole("button", { name: "로그인" }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/recommend", { timeout: 120_000 });
  await page.getByTestId("e2e-survey-wizard").waitFor({ state: "visible", timeout: 60_000 });
  await page.screenshot({ path: outFile, fullPage: true });
  console.log(`saved: ${outFile}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
