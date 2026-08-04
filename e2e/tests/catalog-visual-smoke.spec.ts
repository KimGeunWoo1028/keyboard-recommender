/**
 * Catalog visual smoke — fixture-backed list (not loading skeletons).
 * Run: PW_REUSE_SERVER=1 PW_BASE_URL=http://127.0.0.1:3002 npx playwright test --project=chromium tests/catalog-visual-smoke.spec.ts
 */
import { expect, test } from "@playwright/test";

import { installCatalogListFixture } from "./helpers/catalog-fixture";
import { stabilizeForScreenshot } from "./helpers/results-flow";

test.describe("Catalog visual smoke (fixture)", () => {
  test("switch tab shows fixture cards (not skeleton)", async ({ page }) => {
    await installCatalogListFixture(page);
    await page.goto("/catalog?family=switch", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Visual QA Switch Alpha").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("불러오는 중")).toHaveCount(0);
    await stabilizeForScreenshot(page);
    await expect(page.getByText("총 4개")).toBeVisible();
  });
});
