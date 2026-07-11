import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { completeDeterministicSurvey } from "./survey-flow";

/** Deterministic survey → `/results` with ranked picks visible. */
export async function gotoDeterministicResults(page: Page): Promise<void> {
  await completeDeterministicSurvey(page);
  await page.getByTestId("e2e-submit-survey").click();
  await expect(page).toHaveURL(/\/results$/, { timeout: 60_000 });
  await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();
}

/** Reduce flaky pixels from CSS transitions / caret / scrollbars. */
export async function stabilizeForScreenshot(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}
