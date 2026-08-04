const { chromium } = require("playwright");
const path = require("path");

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "..", "tmp", "qa", "visual", "2026-08-04");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  await ctx.addInitScript(() => {
    localStorage.setItem("kr-theme", "dark");
  });
  const page = await ctx.newPage();
  const rows = [];
  for (const route of ["/", "/recommend", "/catalog", "/auth", "/results", "/contact"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(700);
    let isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (!isDark) {
      const toggle = page.getByRole("button", { name: "테마 전환" });
      if (await toggle.count()) {
        await toggle.first().click({ force: true });
        await page.waitForTimeout(500);
      }
    }
    const m = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      bg: getComputedStyle(document.body).backgroundColor,
      surface: getComputedStyle(document.documentElement).getPropertyValue("--ca-surface").trim(),
      anims: (document.getAnimations?.() || []).filter((a) => a.playState === "running").length,
    }));
    const name = `recheck-dark${route === "/" ? "-home" : route.replace(/\//g, "-")}.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    rows.push({ route, ...m, shot: name });
    console.log(JSON.stringify(rows[rows.length - 1]));
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
