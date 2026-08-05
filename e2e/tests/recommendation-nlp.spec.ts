import { expect, test } from "@playwright/test";

import { completeDeterministicSurvey } from "./helpers/survey-flow";

test.describe("NLP preference path", () => {
  test("parses NL on server and shows highlights / reranking context", async ({ page }) => {
    await completeDeterministicSurvey(page);

    const nlDisclosure = page.locator("summary").filter({ hasText: "추가로 알려주기 (선택)" });
    await expect(nlDisclosure).toBeVisible();
    await nlDisclosure.scrollIntoViewIfNeeded();
    await nlDisclosure.click();

    const nlField = page.getByTestId("e2e-nl-preference");
    await expect(nlField).toBeVisible();
    await nlField.fill("thocky linear quiet");

    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });

    await page.getByRole("tab", { name: "근거" }).click();
    await expect(page.getByText("자유 입력 취향")).toBeVisible();
    await expect(page.getByText(/서버에서 분석되어/)).toBeVisible();
    await expect(page.getByText("thocky linear quiet")).toBeVisible();
  });
});
