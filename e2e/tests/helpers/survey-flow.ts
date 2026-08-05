import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Option labels for each step, aligned with ``frontend/src/lib/survey-definition.ts`` and
 * ``e2e/fixtures/deterministic-survey.json`` / backend regression fixtures.
 */
const DETERMINISTIC_STEP_OPTION_PATTERNS = [
  /차분한 소리/,
  /가볍게 누름/,
  /매끈한 입력감/,
  /부드러운.*쿠션/,
  /가능한 조용하게/,
] as const;

async function ensureSurveyQuestionsPhase(page: Page) {
  const wizard = page.getByTestId("e2e-survey-wizard");
  await expect(wizard).toBeVisible({ timeout: 30_000 });

  const progress = wizard.getByRole("progressbar", { name: /설문/ });
  const stylePreset = wizard.getByRole("button", { name: /부드럽고 조용한 성향/ });

  await expect(progress.or(stylePreset)).toBeVisible({ timeout: 30_000 });
  if (await stylePreset.isVisible()) {
    await stylePreset.click();
    const start = wizard.getByTestId("e2e-survey-start-with-style");
    await expect(start).toBeEnabled({ timeout: 10_000 });
    await start.click();
  }
  await expect(progress).toBeVisible({ timeout: 15_000 });
  return page.getByTestId("e2e-survey-wizard");
}

/** Fixed answers aligned with ``e2e/fixtures/deterministic-survey.json`` and backend regression fixtures. */
export async function completeDeterministicSurvey(page: Page): Promise<void> {
  await page.goto("/recommend", { waitUntil: "domcontentloaded" });
  const wizard = await ensureSurveyQuestionsPhase(page);

  // Preset seeds 4/5 answers and lands on typing_pressure (first unanswered step).
  const typingPressure = wizard.getByRole("radio", { name: DETERMINISTIC_STEP_OPTION_PATTERNS[1] });
  await expect(typingPressure).toBeVisible({ timeout: 15_000 });
  await typingPressure.click();

  // Advance remaining pre-seeded steps (same count as historical helper).
  for (let i = 1; i < DETERMINISTIC_STEP_OPTION_PATTERNS.length - 1; i += 1) {
    await wizard.getByRole("button", { name: "다음", exact: true }).click();
  }
  await expect(page.getByTestId("e2e-submit-survey")).toBeEnabled({ timeout: 15_000 });
}
