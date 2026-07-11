/**
 * Phase D — 375px visual regression for `/results` (optional weekly / path-filtered).
 *
 * Scenarios (3): First View · Trust Layer · Evidence tab.
 * Do not: Compare Drawer · Home Dashboard · «빠른 추천».
 *
 * Update baselines: `npx playwright test --project=visual-375 --update-snapshots`
 */
import { expect, test } from "@playwright/test";

import { gotoDeterministicResults, stabilizeForScreenshot } from "./helpers/results-flow";

const VIEWPORT = { width: 375, height: 812 } as const;

const shotOpts = {
  animations: "disabled" as const,
  caret: "hide" as const,
  /** Font / antialias variance across machines. */
  maxDiffPixelRatio: 0.04,
};

test.describe("Results visual regression — 375px", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  test("375px First View: hero + trust + ranked", async ({ page }) => {
    await gotoDeterministicResults(page);
    await stabilizeForScreenshot(page);

    await expect(page.getByTestId("e2e-trust-layer")).toBeVisible();
    await expect(page.getByTestId("e2e-server-ranked")).toBeVisible();
    await expect(page.getByTestId("e2e-results-tab-bar")).toBeVisible();
    // Compare must stay gone (Do not).
    await expect(page.getByTestId("e2e-open-compare")).toHaveCount(0);
    await expect(page.getByTestId("e2e-compare-panel")).toHaveCount(0);

    await expect(page).toHaveScreenshot("results-375-first-view.png", {
      ...shotOpts,
      fullPage: false,
    });
  });

  test("375px Trust Layer region", async ({ page }) => {
    await gotoDeterministicResults(page);
    await stabilizeForScreenshot(page);

    const trust = page.getByTestId("e2e-trust-layer");
    await expect(trust).toBeVisible();
    await expect(page.getByTestId("e2e-confidence-story")).toBeVisible();
    await expect(page.getByTestId("e2e-trait-mini-profile")).toBeVisible();

    await expect(trust).toHaveScreenshot("results-375-trust-layer.png", shotOpts);
  });

  test("375px Evidence tab region", async ({ page }) => {
    await gotoDeterministicResults(page);
    await page.getByRole("button", { name: "추천 근거" }).click();
    await expect(page.getByTestId("e2e-pick-explanations")).toBeVisible();
    await stabilizeForScreenshot(page);

    const evidence = page.getByTestId("e2e-pick-explanations");
    await expect(evidence.getByText("왜 추천했나요").first()).toBeVisible();

    await expect(evidence).toHaveScreenshot("results-375-evidence-tab.png", shotOpts);
  });
});
