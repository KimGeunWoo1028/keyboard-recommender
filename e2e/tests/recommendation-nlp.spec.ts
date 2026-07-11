import { expect, test } from "@playwright/test";

import { completeDeterministicSurvey } from "./helpers/survey-flow";

test.describe("NLP preference path", () => {
  test("parses NL on server and shows highlights / reranking context", async ({ page }) => {
    await completeDeterministicSurvey(page);

    await page.getByRole("button", { name: /추가 선택 입력 \(고급\)/ }).click();
    await page.getByTestId("e2e-nl-preference").fill("thocky linear quiet");

    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/);

    await page.getByRole("button", { name: "추천 근거" }).click();
    await expect(page.getByText("자유 입력 취향")).toBeVisible();
    await expect(page.getByText(/서버에서 분석되어/)).toBeVisible();
    await expect(page.getByText("thocky linear quiet")).toBeVisible();
  });
});
