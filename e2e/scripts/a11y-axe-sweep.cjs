/**
 * Accessibility QA — axe sweep on P0 public routes (light + dark).
 * Run: node scripts/a11y-axe-sweep.cjs
 */
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("fs");
const path = require("path");

const baseURL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";
const routes = ["/", "/recommend", "/results", "/catalog", "/auth", "/auth/signup", "/contact", "/mypage"];

async function runAxe(page, route, scheme) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(500);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact || ""),
  );
  return {
    route,
    scheme,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target),
    })),
    seriousCount: serious.length,
    totalCount: results.violations.length,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const rows = [];
  for (const route of routes) {
    for (const scheme of ["light", "dark"]) {
      try {
        const row = await runAxe(page, route, scheme);
        rows.push(row);
        const mark = row.seriousCount ? "FAIL" : "PASS";
        console.log(
          `${mark} ${route} ${scheme} — serious ${row.seriousCount} / total ${row.totalCount}`,
        );
      } catch (e) {
        rows.push({ route, scheme, error: String(e.message || e), seriousCount: -1 });
        console.log(`BLOCKED ${route} ${scheme} — ${e.message || e}`);
      }
    }
  }
  await browser.close();
  const outDir = path.join(__dirname, "..", "..", "tmp", "qa", "a11y", "2026-08-04");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "axe-sweep.json");
  fs.writeFileSync(outFile, JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), rows }, null, 2));
  console.log(`\nWrote ${outFile}`);
  const fails = rows.filter((r) => r.seriousCount > 0);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
