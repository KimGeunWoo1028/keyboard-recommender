import { expect, test } from "@playwright/test";

import { completeDeterministicSurvey } from "./helpers/survey-flow";

/**
 * Mobile / WebKit smoke — Core G5 stand-in (narrow viewport or WebKit engine).
 * Projects: mobile-chromium, webkit-smoke
 */
test.describe("Mobile smoke", () => {
  test("survey completes to ranked results", async ({ page }) => {
    test.setTimeout(120_000);
    await completeDeterministicSurvey(page);
    await page.getByTestId("e2e-submit-survey").click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("e2e-save-build")).toBeVisible();
  });
});
