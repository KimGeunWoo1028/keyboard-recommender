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
    await wizard.getByTestId("e2e-survey-start-with-style").click();

    await expect(page.getByRole("heading", { name: "타건 압력" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/2 \/ 5 문항/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "선호 사운드 성향" })).not.toBeVisible();
  });

  test("recommendation: survey → results with ranked picks", async ({ page }) => {
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();
  });

  test("save build: overview CTA save without tab", async ({ page }) => {
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });

    await expect(page.getByTestId("e2e-save-build")).toBeVisible();
    await page.getByTestId("e2e-save-build").click();
    await expect(
      page.getByText(
        /계정에 저장했습니다|이미 계정에 저장된 결과입니다|이 브라우저에 저장했습니다|이미 이 브라우저에 저장된 결과입니다|북마크 목록에 저장되었습니다|브라우저에 로컬 저장되었습니다|이 브라우저\(게스트\)에만 저장되었습니다|게스트 세션에 로컬 저장되었습니다/,
      ),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("e2e-save-build")).toHaveText("저장됨", {
      timeout: 30_000,
    });
  });

  test("mobile 375px: ranked picks and save CTA", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });

    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "저장한 결과" })).toBeVisible();

    await page.getByRole("tab", { name: "계정 설정" }).click();
    await expect(page).toHaveURL(/section=account/);
    await expect(page.getByRole("heading", { name: "프로필" })).toBeVisible();
  });

  test("mypage legacy activity deep-link redirects to saved", async ({ page }) => {
    await page.goto("/mypage?section=activity");
    await expect(page.getByTestId("e2e-mypage-hub")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/section=saved/);
    await expect(page.getByRole("heading", { name: "저장한 결과" })).toBeVisible();
  });
});
