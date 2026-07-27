import { expect, test } from "@playwright/test";

const HYDRATION_ROUTES = ["/", "/recommend", "/results", "/catalog", "/mypage", "/auth"] as const;

function isHydrationIssue(message: string): boolean {
  return /hydration|#418|did not match|server rendered/i.test(message);
}

test.describe("Hydration safety smoke", () => {
  for (const route of HYDRATION_ROUTES) {
    test(`no React hydration pageerror on ${route}`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);

      expect(pageErrors.filter(isHydrationIssue)).toEqual([]);
    });
  }

  test("home reload in dark color scheme stays hydration-clean", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const darkPage = await context.newPage();
    const pageErrors: string[] = [];
    darkPage.on("pageerror", (error) => pageErrors.push(error.message));

    await darkPage.goto("/", { waitUntil: "domcontentloaded" });
    await darkPage.reload({ waitUntil: "domcontentloaded" });
    await darkPage.waitForTimeout(900);

    expect(pageErrors.filter(isHydrationIssue)).toEqual([]);
    await context.close();
  });
});
