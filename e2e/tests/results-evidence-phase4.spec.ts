import { expect, test } from "@playwright/test";

import { gotoDeterministicResults } from "./helpers/results-flow";

test.describe("Results Evidence IA — Phase 4", () => {
  test("trust layer visible above tabs without duplicate quality card", async ({ page }) => {
    await gotoDeterministicResults(page);

    await expect(page.getByTestId("e2e-trust-layer")).toBeVisible();
    await expect(page.getByTestId("e2e-confidence-story")).toBeVisible();
    await expect(page.getByTestId("e2e-results-tab-bar")).toBeVisible();
    await expect(page.getByTestId("e2e-quality-status")).toHaveCount(0);

    const trustLayer = page.getByTestId("e2e-trust-layer");
    const traitMiniProfile = page.getByTestId("e2e-trait-mini-profile");
    await expect(trustLayer).not.toContainText("추천 엔진 v2");
    await expect(trustLayer).not.toContainText("주요 성향 축:");
    if ((await traitMiniProfile.count()) > 0) {
      // Mini-profile lives inside a collapsed <details>; expand before visibility check.
      await trustLayer.getByText("취향 스냅샷").click();
      await expect(traitMiniProfile).toBeVisible();
    }
  });

  test("evidence tab pick persuasion and honest ranking why", async ({ page }) => {
    await gotoDeterministicResults(page);

    await page.getByRole("button", { name: "추천 근거" }).click();
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

  test("mobile 375px: tab bar and trust layer remain visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoDeterministicResults(page);

    await expect(page.getByTestId("e2e-results-tab-bar")).toBeVisible();
    await expect(page.getByRole("button", { name: "추천 요약" })).toBeVisible();
    await expect(page.getByRole("button", { name: "추천 근거" })).toBeVisible();
    await expect(page.getByTestId("e2e-trust-layer")).toBeVisible();
  });
});
