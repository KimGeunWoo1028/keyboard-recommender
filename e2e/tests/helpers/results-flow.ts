import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { completeDeterministicSurvey } from "./survey-flow";

/** Deterministic survey → `/results` with ranked picks visible. */
export async function gotoDeterministicResults(page: Page): Promise<void> {
  await completeDeterministicSurvey(page);
  const submit = page.getByTestId("e2e-submit-survey");
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await Promise.all([
    page.waitForURL(/\/results$/, { timeout: 60_000 }),
    submit.click(),
  ]);
  // Do not OR with getByRole('alert') — Next.js route announcer also uses role=alert.
  await expect(page.getByTestId("e2e-server-ranked"), "expected ranked results after deterministic survey").toBeVisible({
    timeout: 60_000,
  });
}

/** Evidence tab: pick grid heading and per-card reason label (legacy or deduped IA). */
export async function expectEvidencePickExplanations(page: Page): Promise<void> {
  await expect(page.getByTestId("e2e-pick-explanations")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /(후보별|부품별) 추천 근거/ })).toBeVisible();

  const evidence = page.getByTestId("e2e-pick-explanations");
  const pickWhy = evidence.getByText("왜 추천했나요").or(evidence.getByText("부품별 근거"));
  await expect(pickWhy.first()).toBeVisible();
}

/** Reduce flaky pixels from CSS transitions / caret / scrollbars / Web Animations. */
export async function stabilizeForScreenshot(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        animation-duration: 0s !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    if (document.fonts?.ready) {
      try {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]);
      } catch {
        /* ignore */
      }
    }
    for (const anim of document.getAnimations?.() ?? []) {
      try {
        anim.finish();
      } catch {
        try {
          anim.cancel();
        } catch {
          /* ignore */
        }
      }
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}
