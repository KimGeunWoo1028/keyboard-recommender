import { expect, test as setup } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const authDir = path.join(__dirname, "..", "playwright", ".auth");
const authFile = path.join(authDir, "user.json");

const email = process.env.E2E_USER_EMAIL ?? "e2e-ci@keyboard.local";
const password = process.env.E2E_USER_PASSWORD ?? "E2e_test!9";

setup("authenticate", async ({ page }) => {
  setup.setTimeout(120_000);
  fs.mkdirSync(authDir, { recursive: true });
  await page.goto("/auth?next=/recommend");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('form button[type="submit"]').click();
  // Do not use /\/recommend/ — it matches /auth?next=/recommend in the query string.
  await expect(page).toHaveURL((u) => new URL(u).pathname === "/recommend", { timeout: 60_000 });
  await expect(page.getByTestId("e2e-survey-wizard")).toBeVisible({ timeout: 60_000 });
  await page.context().storageState({ path: authFile });
});
