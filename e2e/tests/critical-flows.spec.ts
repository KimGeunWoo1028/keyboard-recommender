import { expect, test } from "@playwright/test";

import { completeDeterministicSurvey } from "./helpers/survey-flow";

test.describe("Critical product flows", () => {
  test("onboarding: authenticated user reaches survey wizard", async ({ page }) => {
    await page.goto("/");
    // HOME-01 unified CTA label; page has multiple identical links — use hero primary.
    await page.getByTestId("e2e-home-start-survey").click();
    await expect(page).toHaveURL((u) => new URL(u).pathname === "/recommend");
    await expect(page.getByTestId("e2e-survey-wizard")).toBeVisible({ timeout: 30_000 });
  });

  test("recommendation: preset skips to first unanswered survey step", async ({ page }) => {
    await page.goto("/recommend");
    const wizard = page.getByTestId("e2e-survey-wizard");
    await expect(wizard).toBeVisible({ timeout: 30_000 });
    await wizard.getByRole("button", { name: /부드럽고 조용한 성향/ }).click();
    const start = wizard.getByTestId("e2e-survey-start-with-style");
    await expect(start).toBeEnabled({ timeout: 10_000 });
    await start.click();

    await expect(page.getByRole("heading", { name: "타건 압력" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/2 \/ 5 문항/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "선호 사운드 성향" })).not.toBeVisible();
  });

  test("recommendation: survey → results with ranked picks", async ({ page }) => {
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible({ timeout: 60_000 });
  });

  // Save click+toast is covered serially in save-reliability (shared e2e-ci + same
  // deterministic build races when this file runs in parallel with that suite).
  test("results: save CTA is visible after survey", async ({ page }) => {
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("e2e-save-build")).toBeVisible();
  });

  test("mobile 375px: ranked picks and save CTA", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });

    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("e2e-save-build")).toBeVisible();
  });

  test("mypage hub loads overview/saved/account", async ({ page }) => {
    await page.goto("/mypage");
    await expect(page.getByTestId("e2e-mypage-hub")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: "취향 요약" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "저장한 결과" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "계정 설정" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "비교 기록" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "활동" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "개요" })).toHaveCount(0);

    await page.getByRole("tab", { name: "저장한 결과" }).click();
    await expect(page).toHaveURL(/section=saved/);
    await expect(
      page.getByRole("list", { name: "저장한 결과 목록" }).or(page.getByText(/아직 저장한 결과/)),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "계정 설정" }).click();
    await expect(page).toHaveURL(/section=account/);
    await expect(page.getByRole("heading", { name: "프로필" })).toBeVisible();
  });

  test("mypage legacy activity deep-link redirects to saved", async ({ page }) => {
    await page.goto("/mypage?section=activity");
    await expect(page.getByTestId("e2e-mypage-hub")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/section=saved/);
    await expect(
      page.getByRole("list", { name: "저장한 결과 목록" }).or(page.getByText(/아직 저장한 결과/)),
    ).toBeVisible({ timeout: 15_000 });
  });
});
