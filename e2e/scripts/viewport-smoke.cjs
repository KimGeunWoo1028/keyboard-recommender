/**
 * One-shot viewport smoke for launch verification (not part of CI).
 * Usage: node scripts/viewport-smoke.cjs  (from e2e/, stack must be reachable or started separately)
 */
const { chromium } = require("@playwright/test");
const { spawn } = require("child_process");
const path = require("path");

const BASE = process.env.PW_BASE_URL || "http://127.0.0.1:3000";
const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
  { w: 360, h: 800 },
];
const ROUTES = ["/", "/recommend", "/catalog", "/auth"];

async function waitForOk(url, attempts = 90) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function main() {
  const startStack = process.env.PW_START_STACK === "1";
  let child = null;
  if (startStack) {
    child = spawn("node", [path.join(__dirname, "start-stack.cjs")], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000" },
      stdio: "ignore",
      shell: true,
    });
  }

  const ok = await waitForOk(BASE + "/");
  if (!ok) {
    console.error("SERVER_NOT_READY", BASE);
    if (child) child.kill();
    process.exit(1);
  }

  const browser = await chromium.launch();
  const results = [];
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    const consoleErrors = [];
    page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));
    for (const route of ROUTES) {
      const before = consoleErrors.length;
      const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(400);
      const h1 = await page.locator("h1").first().textContent().catch(() => "");
      const skip = await page.locator('a[href="#main-content"]').count();
      const overflowX = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth > el.clientWidth + 2;
      });
      results.push({
        viewport: vp.w,
        route,
        status: res ? res.status() : 0,
        h1: (h1 || "").trim().slice(0, 48),
        skipLink: skip > 0,
        overflowX,
        newConsoleErrors: consoleErrors.length - before,
      });
    }
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify({ base: BASE, results }, null, 2));
  const bad = results.filter((r) => r.status >= 400 || r.newConsoleErrors > 0 || r.overflowX);
  if (child) child.kill();
  process.exit(bad.length ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
