/**
 * Visual QA smoke — faster capture + style assertions.
 * Usage: BASE_URL=http://127.0.0.1:3002 node scripts/visual-qa-smoke.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "..", "tmp", "qa", "visual", "2026-08-04");
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ["/", "/recommend", "/results", "/catalog", "/auth", "/contact"];
const VIEWPORTS = [
  { name: "D1440", width: 1440, height: 900 },
  { name: "M390", width: 390, height: 844 },
];

function luminance(rgb) {
  const m = String(rgb || "").match(/(\d+(\.\d+)?)/g);
  if (!m || m.length < 3) return null;
  const [r, g, b] = m.slice(0, 3).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  if (a == null || b == null) return null;
  const L1 = Math.max(a, b);
  const L2 = Math.min(a, b);
  return (L1 + 0.05) / (L2 + 0.05);
}

async function stabilize(page) {
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    if (document.fonts?.ready) {
      try {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
      } catch {
        /* ignore */
      }
    }
    for (const a of document.getAnimations?.() ?? []) {
      try {
        a.finish();
      } catch {
        /* ignore */
      }
    }
  });
}

async function setTheme(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("kr-theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
  await page.evaluate((t) => {
    localStorage.setItem("kr-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
  }, theme);
}

async function measure(page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const header = document.querySelector("header");
    const muted = document.querySelector(".text-ca-on-surface-variant, .text-muted-foreground, p");
    const root = getComputedStyle(document.documentElement);
    return {
      fontsStatus: document.fonts?.status ?? "unknown",
      bodyBg: cs.backgroundColor,
      bodyColor: cs.color,
      headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
      mutedColor: muted ? getComputedStyle(muted).color : null,
      caPrimary: root.getPropertyValue("--ca-primary").trim(),
      runningAnims: (document.getAnimations?.() ?? []).filter((a) => a.playState === "running").length,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
      isDark: document.documentElement.classList.contains("dark"),
    };
  });
}

(async () => {
  console.log("launch", BASE);
  const browser = await chromium.launch();
  const findings = [];
  const captures = [];
  const styleRows = [];

  for (const vp of VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      console.log("matrix", vp.name, theme);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme === "dark" ? "dark" : "light",
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);

      for (const route of ROUTES) {
        const id = `${vp.name}-${theme}${route === "/" ? "-home" : route.replace(/\//g, "-")}`;
        process.stdout.write(`  ${id} ... `);
        try {
          await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
          await setTheme(page, theme);
          await page.waitForTimeout(100);
          await stabilize(page);
          const shot = path.join(OUT, `${id}.png`);
          await page.screenshot({ path: shot, fullPage: false, timeout: 10000 });
          const m = await measure(page);
          const mutedContrast = contrast(luminance(m.bodyBg), luminance(m.mutedColor));
          const bodyContrast = contrast(luminance(m.bodyBg), luminance(m.bodyColor));
          styleRows.push({
            id,
            route,
            theme,
            viewport: vp.name,
            fontsStatus: m.fontsStatus,
            headerH: m.headerH,
            runningAnims: m.runningAnims,
            caPrimary: m.caPrimary,
            bodyBg: m.bodyBg,
            mutedContrast: mutedContrast ? Number(mutedContrast.toFixed(2)) : null,
            bodyContrast: bodyContrast ? Number(bodyContrast.toFixed(2)) : null,
            ogImage: Boolean(m.ogImage),
            isDark: m.isDark,
          });
          captures.push({ id, ok: true, shot: path.basename(shot) });
          console.log("ok");

          if (theme === "dark" && !m.isDark) {
            findings.push({ id: "V-THEME-01", sev: "S1", msg: `dark class missing on ${id}` });
          }
          if (theme === "light" && m.isDark) {
            findings.push({ id: "V-THEME-01", sev: "S1", msg: `unexpected dark class on ${id}` });
          }
          if (theme === "dark") {
            const L = luminance(m.bodyBg);
            if (L != null && L > 0.85) {
              findings.push({ id: "V-COLOR-dark-bg", sev: "S1", msg: `dark body too bright ${id}: ${m.bodyBg}` });
            }
          }
          if (mutedContrast != null && mutedContrast < 3.0) {
            findings.push({
              id: "V-TYPO-contrast",
              sev: "S2",
              msg: `very low muted contrast ${mutedContrast.toFixed(2)} on ${id}`,
            });
          }
        } catch (e) {
          console.log("FAIL", e.message || e);
          captures.push({ id, ok: false, error: String(e.message || e) });
          findings.push({ id: "V-CAPTURE", sev: "S2", msg: `capture failed ${id}: ${e.message || e}` });
        }
      }
      await context.close();
    }
  }

  // Determinism: clip brand column only (exclude WebGL hero)
  {
    console.log("determinism check");
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const hashes = [];
    for (let i = 0; i < 2; i++) {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await setTheme(page, "light");
      await stabilize(page);
      const buf = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: 520, height: 700 },
      });
      hashes.push(crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16));
    }
    const detOk = hashes[0] === hashes[1];
    styleRows.push({ id: "DET-home-brand-clip", hashes, detOk });
    if (!detOk) {
      findings.push({
        id: "V-DET-flaky",
        sev: "S3",
        msg: `brand-column hash differed: ${hashes.join(" vs ")}`,
      });
    }
    await context.close();
  }

  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    captureCount: captures.filter((c) => c.ok).length,
    captureFail: captures.filter((c) => !c.ok).length,
    findings,
    styleRows,
    captures,
  };
  fs.writeFileSync(path.join(OUT, "visual-qa-smoke.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ captureCount: report.captureCount, captureFail: report.captureFail, findings }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
