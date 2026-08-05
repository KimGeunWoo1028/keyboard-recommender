import { expect, test } from "@playwright/test";

import { installCatalogListFixture } from "./helpers/catalog-fixture";
import { stabilizeForScreenshot } from "./helpers/results-flow";

/**
 * DS-F005 stand-in for Storybook matrix: P0 overlay a11y smoke.
 * Run: npm run test:design-system (from e2e/)
 */
test.describe("Design system smoke", () => {
  test("catalog mobile filters dialog supports Escape", async ({ page }) => {
    await installCatalogListFixture(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/catalog?family=switch", { waitUntil: "domcontentloaded" });
    await stabilizeForScreenshot(page);

    await expect(page.getByText("Visual QA Switch Alpha").first()).toBeVisible({ timeout: 15_000 });

    const openFilters = page.getByRole("button", { name: /세부 필터/ });
    await expect(openFilters).toBeVisible();
    await openFilters.click();

    const dialog = page.getByRole("dialog", { name: "세부 필터" });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
});
