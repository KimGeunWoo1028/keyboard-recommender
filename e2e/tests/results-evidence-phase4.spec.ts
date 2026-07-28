import { expect, test } from "@playwright/test";

import { gotoDeterministicResults } from "./helpers/results-flow";

test.describe("Results Evidence IA — Phase 4", () => {
  test("overview tab shows minimal body: parts grid, CTA band, footer links", async ({ page }) => {
    await gotoDeterministicResults(page);

    await expect(page.getByRole("tab", { name: "개요" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();
    await expect(page.getByTestId("e2e-overview-cta-band")).toBeVisible();
    await expect(page.getByTestId("e2e-save-login-link")).toBeVisible();
    await expect(page.getByTestId("e2e-results-retake-link")).toBeVisible();
    await expect(page.getByTestId("e2e-result-trust-summary")).toBeVisible();
    await expect(page.getByTestId("e2e-trust-short-why")).toBeVisible();
    await expect(page.getByTestId("e2e-results-tab-bar")).toBeVisible();
    await expect(page.getByTestId("e2e-quality-status")).toHaveCount(0);
    await expect(page.getByTestId("e2e-trust-layer")).toHaveCount(0);
    await expect(page.getByTestId("e2e-confidence-story")).toHaveCount(0);
    await expect(page.getByTestId("e2e-results-next-actions")).toHaveCount(0);
    await expect(page.getByTestId("e2e-overview-footer")).toHaveCount(0);
  });

  test("evidence tab pick persuasion and honest ranking why", async ({ page }) => {
    await gotoDeterministicResults(page);

    await page.getByRole("tab", { name: "근거" }).click();
    await expect(page.getByTestId("e2e-evidence-matching-table")).toBeVisible();
    await expect(page.getByTestId("e2e-evidence-confidence-callout")).toBeVisible();
    await expect(page.getByText("취향 매칭 분석")).toBeVisible();
    await expect(page.getByTestId("e2e-pick-explanations")).toBeVisible();
    await expect(page.getByRole("heading", { name: "후보별 추천 근거" })).toBeVisible();

    const evidence = page.getByTestId("e2e-pick-explanations");
    await expect(evidence.getByText("왜 추천했나요").first()).toBeVisible();
    await expect(evidence.getByTestId("e2e-pick-ranking-why")).toHaveCount(0);
    await expect(page.getByText("세부 취향 프로필")).toHaveCount(0);
    await expect(evidence).not.toContainText("특별히 주의할");
    await expect(evidence).not.toContainText("점수에 영향을 준 항목");
    await expect(evidence).not.toContainText("정합 기여");
    await expect(evidence).not.toContainText("지표 해석 가이드");
    await expect(evidence.getByText("순위 점수")).toHaveCount(0);
  });

  test("compare tab shows Manus-style build cards with current highlight", async ({ page }) => {
    await gotoDeterministicResults(page);

    await page.getByRole("tab", { name: "비교" }).click();
    await expect(page.getByTestId("e2e-results-compare-tab")).toBeVisible();
    await expect(page.getByTestId("e2e-compare-current-build")).toBeVisible();
    await expect(page.getByTestId("e2e-compare-current-build").getByText("현재 추천")).toBeVisible();
    await expect(page.getByText("취향 일치도").first()).toBeVisible();
    await expect(page.getByText("소음").first()).toBeVisible();
    await expect(page.getByText("타건감").first()).toBeVisible();
    await expect(page.getByText("바닥감").first()).toBeVisible();
    await expect(page.getByText("가격대")).toHaveCount(0);
  });

  test("mobile 375px: tab bar and overview minimal body remain visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoDeterministicResults(page);

    await expect(page.getByTestId("e2e-results-tab-bar")).toBeVisible();
    await expect(page.getByRole("tab", { name: "개요" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "근거" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "비교" })).toBeVisible();
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();
    await expect(page.getByTestId("e2e-overview-cta-band")).toBeVisible();
  });
});
