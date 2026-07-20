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
  if (await progress.isVisible().catch(() => false)) {
    return wizard;
  }

  await wizard.getByRole("button", { name: /부드럽고 조용한 성향/ }).click();
  await expect(progress).toBeVisible({ timeout: 15_000 });
  return page.getByTestId("e2e-survey-wizard");
}

/** Fixed answers aligned with ``e2e/fixtures/deterministic-survey.json`` and backend regression fixtures. */
export async function completeDeterministicSurvey(page: Page): Promise<void> {
  await page.goto("/recommend");
  const wizard = await ensureSurveyQuestionsPhase(page);

  // Preset seeds 4/5 answers and lands on typing_pressure (first unanswered step).
  await wizard.getByRole("radio", { name: DETERMINISTIC_STEP_OPTION_PATTERNS[1] }).click();
  for (let i = 1; i < DETERMINISTIC_STEP_OPTION_PATTERNS.length - 1; i += 1) {
    await wizard.getByRole("button", { name: "다음", exact: true }).click();
  }
}
