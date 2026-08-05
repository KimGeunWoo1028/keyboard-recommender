import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const PAGE_ORIGIN = process.env.PW_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * Inject kr_session from API login (same contract as auth.setup).
 * Prefer this over UI login for disposable / role sessions.
 */
export async function loginViaApi(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(response.ok(), `login failed: ${response.status()} ${await response.text()}`).toBeTruthy();
  const setCookie = response.headers()["set-cookie"] ?? "";
  const tokenMatch = /kr_session=([^;]+)/.exec(setCookie);
  expect(tokenMatch, "kr_session cookie missing from login response").not.toBeNull();

  const cookieDomain = new URL(PAGE_ORIGIN).hostname;
  await page.context().addCookies([
    {
      name: "kr_session",
      value: tokenMatch![1],
      domain: cookieDomain,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);
}
