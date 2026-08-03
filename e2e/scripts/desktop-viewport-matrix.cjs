/**
 * Desktop QA D-VP-01 matrix — document overflow at required CSS widths.
 * Also samples short height (720) and zoom via CSS zoom (approx).
 * Run: node scripts/desktop-viewport-matrix.cjs
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseURL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";
const widths = [1024, 1280, 1366, 1440, 1536, 1600, 1920, 2560, 3840];
const routes = ["/", "/recommend", "/results", "/catalog", "/auth", "/mypage", "/contact"];
const shortHeight = 700;

async function measureOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const culprits = [...document.querySelectorAll("body *")]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.left < -1 || r.right > vw + 1))
      .map(({ el, r }) => ({
        tag: el.tagName,
        className: String(el.className || "").slice(0, 100),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      }))
      .slice(0, 6);
    const stickyHeader = document.querySelector("header");
    const headerH = stickyHeader ? Math.round(stickyHeader.getBoundingClientRect().height) : 0;
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      bad: de.scrollWidth > de.clientWidth + 1,
      culprits,
      headerH,
      bodyScrollHeight: de.scrollHeight,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const width of widths) {
    const height = width >= 2560 ? 1080 : 900;
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    for (const route of routes) {
      let verdict = "BLOCKED";
      let overflow = null;
      let status = "?";
      try {
        const res = await page.goto(`${baseURL}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        status = String(res?.status() ?? "?");
        await page.waitForTimeout(350);
        overflow = await measureOverflow(page);
        verdict = overflow.bad ? "FAIL" : "PASS";
      } catch (e) {
        overflow = { error: String(e.message || e) };
      }
      results.push({
        kind: "width",
        route,
        width,
        height,
        status,
        verdict,
        delta: overflow?.bad ? overflow.scrollWidth - overflow.clientWidth : 0,
        headerH: overflow?.headerH,
        culprits: overflow?.culprits ?? [],
        error: overflow?.error,
      });
      process.stdout.write(
        `${String(verdict).padEnd(7)} W${String(width).padStart(4)} ${route} http=${status}\n`,
      );
    }
    await context.close();
  }

  // Short height sample at 1366 and 1920
  for (const width of [1366, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: shortHeight } });
    const page = await context.newPage();
    for (const route of ["/", "/recommend", "/catalog", "/auth"]) {
      const res = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(300);
      const overflow = await measureOverflow(page);
      const headerOk = (overflow.headerH || 0) < shortHeight * 0.35;
      const verdict = overflow.bad || !headerOk ? "FAIL" : "PASS";
      results.push({
        kind: "short-height",
        route,
        width,
        height: shortHeight,
        status: String(res?.status() ?? "?"),
        verdict,
        headerH: overflow.headerH,
        headerOk,
        bad: overflow.bad,
      });
      process.stdout.write(
        `${verdict.padEnd(7)} SHORT ${width}x${shortHeight} ${route} headerH=${overflow.headerH}\n`,
      );
    }
    await context.close();
  }

  // Zoom approx via CSS zoom on 1280 viewport (D-ZOOM sample)
  const zooms = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
  const zContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const zPage = await zContext.newPage();
  for (const zoom of zooms) {
    await zPage.goto(`${baseURL}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await zPage.evaluate((z) => {
      document.documentElement.style.zoom = String(z);
    }, zoom);
    await zPage.waitForTimeout(250);
    const overflow = await measureOverflow(zPage);
    const verdict = overflow.bad ? "FAIL" : "PASS";
    results.push({ kind: "zoom", route: "/", width: 1280, zoom, verdict, bad: overflow.bad });
    process.stdout.write(`${verdict.padEnd(7)} ZOOM ${Math.round(zoom * 100)}% /\n`);
  }
  await zContext.close();
  await browser.close();

  const outDir = path.join(__dirname, "..", "..", "tmp", "qa", "desktop", "2026-08-04");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "desktop-viewport-matrix.json");
  fs.writeFileSync(outFile, JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), results }, null, 2));
  const fails = results.filter((r) => r.verdict === "FAIL");
  console.log(`\nWrote ${outFile}`);
  console.log(`PASS ${results.length - fails.length} · FAIL ${fails.length}`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
