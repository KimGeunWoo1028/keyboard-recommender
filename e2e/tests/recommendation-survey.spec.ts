import { expect, test } from "@playwright/test";

import { completeDeterministicSurvey } from "./helpers/survey-flow";

test.describe("Survey → API → results (deterministic)", () => {
  test("renders server-ranked picks, explanations, and evidence tab", async ({ page }) => {
    await completeDeterministicSurvey(page);

    await page.getByTestId("e2e-submit-survey").click();

    await expect(page).toHaveURL(/\/results$/);
    await expect(page.getByRole("heading", { name: /맞춤 추천 결과/i })).toBeVisible();

    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();

    await page.getByRole("button", { name: "추천 근거" }).click();
    await expect(page.getByTestId("e2e-pick-explanations")).toBeVisible();
    await expect(page.getByRole("heading", { name: "후보별 추천 근거" })).toBeVisible();
    await expect(page.getByTestId("e2e-pick-explanations").getByText("왜 추천했나요").first()).toBeVisible();
    await expect(page.getByTestId("e2e-pick-explanations").getByTestId("e2e-pick-ranking-why")).toHaveCount(0);
    await expect(page.getByText("지표 해석 가이드")).toHaveCount(0);
    await expect(page.getByTestId("e2e-pick-explanations").getByText("순위 점수")).toHaveCount(0);
  });
});
