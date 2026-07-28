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

/** Evidence tab: pick grid heading and per-card reason label (legacy or deduped IA). */
export async function expectEvidencePickExplanations(page: Page): Promise<void> {
  await expect(page.getByTestId("e2e-pick-explanations")).toBeVisible();
  await expect(page.getByRole("heading", { name: /(후보별|부품별) 추천 근거/ })).toBeVisible();

  const evidence = page.getByTestId("e2e-pick-explanations");
  const pickWhy = evidence.getByText("왜 추천했나요").or(evidence.getByText("부품별 근거"));
  await expect(pickWhy.first()).toBeVisible();
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
