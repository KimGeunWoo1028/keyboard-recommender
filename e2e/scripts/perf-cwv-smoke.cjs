/**
 * Performance QA lab smoke — LCP/CLS via PerformanceObserver on production pages.
 * Conditions: no CPU throttle in this smoke (full throttle → 08 deep run); records lab values.
 * Run: node scripts/perf-cwv-smoke.cjs
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseURL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";
const routes = ["/", "/recommend", "/results", "/catalog", "/auth"];

async function measure(page, route, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1500);
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
    const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : null;
    let cls = 0;
    for (const e of performance.getEntriesByType("layout-shift")) {
      if (!e.hadRecentInput) cls += e.value;
    }
    const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
    return {
      lcpMs: lcp,
      fcpMs: fcp,
      cls,
      ttfbMs: nav ? nav.responseStart : null,
      transferSize: nav ? nav.transferSize : null,
    };
  });
  return metrics;
}

function verdict(m) {
  const lcpOk = m.lcpMs == null || m.lcpMs <= 2500;
  const clsOk = m.cls <= 0.1;
  if (m.lcpMs == null) return "BLOCKED";
  return lcpOk && clsOk ? "PASS" : "FAIL";
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  // Observe LCP/CLS
  await page.addInitScript(() => {
    try {
      new PerformanceObserver(() => {}).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(() => {}).observe({ type: "layout-shift", buffered: true });
    } catch (_) {}
  });

  const rows = [];
  const viewports = [
    { name: "mobile-390", width: 390, height: 844 },
    { name: "desktop-1280", width: 1280, height: 800 },
  ];
  for (const vp of viewports) {
    for (const route of routes) {
      try {
        const m = await measure(page, route, { width: vp.width, height: vp.height });
        const v = verdict(m);
        rows.push({ route, viewport: vp.name, ...m, verdict: v });
        console.log(
          `${v} ${vp.name} ${route} LCP=${m.lcpMs != null ? Math.round(m.lcpMs) : "n/a"}ms CLS=${m.cls.toFixed(3)} TTFB=${m.ttfbMs != null ? Math.round(m.ttfbMs) : "n/a"}ms`,
        );
      } catch (e) {
        rows.push({ route, viewport: vp.name, error: String(e.message || e), verdict: "BLOCKED" });
        console.log(`BLOCKED ${vp.name} ${route} ${e.message || e}`);
      }
    }
  }
  await browser.close();
  const outDir = path.join(__dirname, "..", "..", "tmp", "qa", "perf", "2026-08-04");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "cwv-smoke.json"),
    JSON.stringify({ baseURL, note: "Lab smoke without 4x CPU / network throttle", rows }, null, 2),
  );
  const fails = rows.filter((r) => r.verdict === "FAIL");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
