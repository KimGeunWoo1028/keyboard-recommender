/**
 * Mobile QA M-VP-01 matrix — document-level horizontal overflow.
 * Run: node scripts/mobile-viewport-matrix.cjs
 * Expects frontend at PW_BASE_URL (default http://127.0.0.1:3000).
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseURL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";
const widths = [320, 360, 375, 390, 393, 412, 430];
const heights = { short: 568, standard: 844 };
const routes = [
  "/",
  "/recommend",
  "/results",
  "/catalog",
  "/auth",
  "/auth/signup",
  "/mypage",
  "/contact",
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const culprits = [...document.querySelectorAll("body *")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, r };
      })
      .filter(({ r }) => r.width > 0 && (r.left < -1 || r.right > vw + 1))
      .map(({ el, r }) => ({
        tag: el.tagName,
        className: String(el.className || "").slice(0, 120),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      }))
      .slice(0, 8);
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      bad: de.scrollWidth > de.clientWidth + 1,
      culprits,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const width of widths) {
    for (const [heightKey, height] of Object.entries(heights)) {
      if (heightKey === "short" && width !== 320 && width !== 375) continue;
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: width <= 393 ? 3 : 2.625,
      });
      const page = await context.newPage();
      for (const route of routes) {
        const url = `${baseURL}${route}`;
        let status = "ERR";
        let overflow = null;
        try {
          const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          status = String(res?.status() ?? "?");
          await page.waitForTimeout(400);
          overflow = await measureOverflow(page);
        } catch (e) {
          overflow = { error: String(e.message || e) };
        }
        const verdict =
          overflow?.bad === true ? "FAIL" : overflow?.error ? "BLOCKED" : "PASS";
        results.push({
          route,
          width,
          height,
          status,
          verdict,
          delta:
            overflow?.bad === true
              ? overflow.scrollWidth - overflow.clientWidth
              : 0,
          culprits: overflow?.culprits ?? [],
          error: overflow?.error,
        });
        process.stdout.write(
          `${verdict.padEnd(7)} ${String(width).padStart(3)}x${height} ${route} (http ${status})\n`,
        );
      }
      await context.close();
    }
  }
  await browser.close();

  const outDir = path.join(__dirname, "..", "..", "tmp", "qa", "mobile", "2026-08-04");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "viewport-overflow-matrix.json");
  fs.writeFileSync(outFile, JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), results }, null, 2));
  const fails = results.filter((r) => r.verdict === "FAIL");
  const blocked = results.filter((r) => r.verdict === "BLOCKED");
  console.log(`\nWrote ${outFile}`);
  console.log(`PASS ${results.length - fails.length - blocked.length} · FAIL ${fails.length} · BLOCKED ${blocked.length}`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
