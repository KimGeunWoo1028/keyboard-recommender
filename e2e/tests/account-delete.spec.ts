import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Account deletion E2E — must NEVER use shared e2e-ci@keyboard.local.
 * Each run signs up a disposable user via API (requires DEBUG=true → debug_code).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PASSWORD = "E2e_del!9";
const PROTECTED_EMAIL = "e2e-ci@keyboard.local";

async function signupDisposableUser(request: APIRequestContext): Promise<{ email: string; password: string }> {
  const stamp = Date.now();
  const email = `e2e-del-${stamp}@keyboard.local`;
  expect(email).not.toBe(PROTECTED_EMAIL);

  const sendRes = await request.post(`${API_BASE}/api/v1/auth/email-verification/send`, {
    data: { email },
  });
  expect(sendRes.ok(), await sendRes.text()).toBeTruthy();
  const sendJson = (await sendRes.json()) as { debug_code?: string | null };
  expect(
    sendJson.debug_code,
    "debug_code missing — start-stack must set DEBUG=true for disposable signup",
  ).toBeTruthy();

  const verifyRes = await request.post(`${API_BASE}/api/v1/auth/email-verification/verify`, {
    data: { email, code: sendJson.debug_code },
  });
  expect(verifyRes.ok(), await verifyRes.text()).toBeTruthy();
  const { verification_token } = (await verifyRes.json()) as { verification_token: string };

  const signupRes = await request.post(`${API_BASE}/api/v1/auth/signup`, {
    data: {
      email,
      password: PASSWORD,
      display_name: `del${String(stamp).slice(-8)}`,
      verification_token,
    },
  });
  expect(signupRes.ok(), await signupRes.text()).toBeTruthy();
  return { email, password: PASSWORD };
}

test.describe("회원탈퇴 account delete", () => {
  // Do not reuse auth.setup storage (protects e2e-ci user).
  test.use({ storageState: { cookies: [], origins: [] } });

  test("temp user: mypage delete → /account-deleted → /mypage requires auth", async ({ page, request }) => {
    test.setTimeout(120_000);
    const { email, password } = await signupDisposableUser(request);

    await page.goto("/auth?force=1&next=/mypage?section=account");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((u) => new URL(u).pathname === "/mypage", { timeout: 60_000 });
    await expect(page.getByTestId("e2e-mypage-hub")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "회원탈퇴" })).toBeVisible();

    await page.getByRole("button", { name: "탈퇴하기" }).click();

    const sendPromise = page.waitForResponse(
      (r) => r.url().includes("/api/v1/auth/account/deletion-code/send") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "인증번호 발송" }).click();
    const sendRes = await sendPromise;
    expect(sendRes.ok(), await sendRes.text()).toBeTruthy();
    const sendJson = (await sendRes.json()) as { debug_code?: string | null };
    expect(sendJson.debug_code, "debug_code missing — DEBUG=true required").toBeTruthy();

    await page.getByPlaceholder("인증번호 6자리").fill(sendJson.debug_code!);
    await page.getByRole("button", { name: "인증 확인" }).click();
    await expect(page.getByText("이메일 인증이 완료되었습니다")).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder("현재 비밀번호").fill(password);
    await page.getByPlaceholder(/탈퇴/).fill("탈퇴");
    await page.getByRole("button", { name: "계정 영구 삭제" }).click();

    await expect(page).toHaveURL((u) => new URL(u).pathname === "/account-deleted", { timeout: 30_000 });
    await expect(page.getByTestId("e2e-account-deleted")).toBeVisible();
    await expect(page.getByRole("heading", { name: "회원탈퇴가 완료되었습니다" })).toBeVisible();

    await page.goto("/mypage");
    await expect(page).toHaveURL(/\/auth/, { timeout: 30_000 });
  });
});
