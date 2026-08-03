const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  ).newPage();

  await page.goto("http://127.0.0.1:3000/auth/signup", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = axe.violations.filter((v) => ["critical", "serious"].includes(v.impact || ""));
  console.log("AXE_SIGNUP_SERIOUS", serious.length, serious.map((v) => v.id).join(",") || "(none)");

  await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const sizes = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const menu = buttons.find((b) => /메뉴/.test(b.getAttribute("aria-label") || ""));
    const theme = buttons.find((b) => /테마|모드/.test(b.getAttribute("aria-label") || ""));
    const box = (el) =>
      el
        ? {
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height),
          }
        : null;
    return { menu: box(menu), theme: box(theme) };
  });
  console.log("TOUCH", JSON.stringify(sizes));

  await page.goto("http://127.0.0.1:3000/results", { waitUntil: "load" });
  const cls = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let value = 0;
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (!e.hadRecentInput) value += e.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
        } catch (_) {
          /* ignore */
        }
        setTimeout(() => resolve(value), 3000);
      }),
  );
  console.log("RESULTS_CLS", Number(cls).toFixed(3), cls <= 0.1 ? "PASS" : "FAIL");

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
