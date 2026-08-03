/**
 * Lightweight keyboard reachability smoke (not full P0 task completion).
 * Run: node scripts/a11y-keyboard-smoke.cjs
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseURL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  const skip = page.getByRole("link", { name: /본문으로 건너뛰기/ });
  await page.keyboard.press("Tab");
  const skipVisible = await skip.isVisible().catch(() => false);
  if (skipVisible) {
    await page.keyboard.press("Enter");
  }
  const mainFocused = await page.evaluate(() => {
    const main = document.getElementById("main-content");
    return !!main && (document.activeElement === main || main.contains(document.activeElement));
  });

  await page.goto(`${baseURL}/recommend`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  // Tab until style preset or start control is focused
  let foundStyle = false;
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "";
      return (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80);
    });
    if (/부드럽고 조용한|성향|설문/.test(label)) {
      foundStyle = true;
      break;
    }
  }

  await page.goto(`${baseURL}/auth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  let emailFocused = false;
  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press("Tab");
    emailFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && (el.id === "email" || el.getAttribute("name") === "email" || el.getAttribute("type") === "email");
    });
    if (emailFocused) break;
  }

  const report = {
    skipLinkWorks: skipVisible && mainFocused,
    recommendKeyboardReachesStyleControl: foundStyle,
    authKeyboardReachesEmail: emailFocused,
  };
  const outDir = path.join(__dirname, "..", "..", "tmp", "qa", "a11y", "2026-08-04");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "keyboard-smoke.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  const ok = report.skipLinkWorks && report.recommendKeyboardReachesStyleControl && report.authKeyboardReachesEmail;
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
