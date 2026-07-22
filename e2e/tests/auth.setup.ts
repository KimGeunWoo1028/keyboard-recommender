import { expect, test as setup } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const authDir = path.join(__dirname, "..", "playwright", ".auth");
const authFile = path.join(authDir, "user.json");

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";
const email = process.env.E2E_USER_EMAIL ?? "e2e-ci@keyboard.local";
const password = process.env.E2E_USER_PASSWORD ?? "E2e_test!9";

setup("authenticate", async ({ page, request }) => {
  setup.setTimeout(120_000);
  fs.mkdirSync(authDir, { recursive: true });

  // Prefer API login over /auth UI. Next 15 local/dev can leave the auth page
  // SSR-looking while client handlers are not yet reliable for tab clicks.
  const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(response.ok(), `login failed: ${response.status()} ${await response.text()}`).toBeTruthy();
  const setCookie = response.headers()["set-cookie"] ?? "";
  const tokenMatch = /kr_session=([^;]+)/.exec(setCookie);
  expect(tokenMatch, "kr_session cookie missing from login response").not.toBeNull();

  await page.context().addCookies([
    {
      name: "kr_session",
      value: tokenMatch![1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);

  await page.goto("/recommend");
  await expect(page).toHaveURL((u) => new URL(u).pathname === "/recommend", { timeout: 60_000 });
  await expect(page.getByTestId("e2e-survey-wizard")).toBeVisible({ timeout: 60_000 });
  await page.context().storageState({ path: authFile });
});
