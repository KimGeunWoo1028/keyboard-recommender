/**
 * UX Audit task walkthrough recorder — evidence only, not committed as product code.
 * Usage: node scripts/ux-task-walkthrough.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "https://www.keyboard-recommender.com";
const OUT = path.join(__dirname, "..", "..", "tmp", "qa", "ux", "2026-08-04");
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

function recorder(page) {
  let clicks = 0;
  let navs = 0;
  const t0 = Date.now();
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navs += 1;
  });
  return {
    async click(locator, label) {
      await locator.click();
      clicks += 1;
      return label;
    },
    metrics() {
      return { clicks, navs, ms: Date.now() - t0 };
    },
  };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];

  // ---- T1: Guest home → survey entry → answer all → results (or fail) ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const rec = recorder(page);
    let completed = false;
    let blocker = null;
    try {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await shot(page, "T1-01-home");
      await rec.click(page.getByTestId("e2e-home-start-survey").or(page.getByRole("link", { name: /추천 설문 시작/ })).first(), "cta");
      await page.waitForURL(/\/recommend/, { timeout: 15000 });
      await shot(page, "T1-02-recommend-entry");

      // Style entry: pick first style card/button
      const style = page.getByRole("button").filter({ hasText: /조용|타건|클ack|경쾌|묵직|밸런스|취향|성향/i }).first();
      const styleAlt = page.locator("button").filter({ hasText: /.+/ }).nth(0);
      if (await page.getByText(/나의 타건 성향|스타일|성향/).first().isVisible().catch(() => false)) {
        // click first visible option in entry
        const entryBtns = page.locator('[data-testid], button').filter({ hasText: /조용한|경쾌한|균형|밸런스|묵직|선명|부드러운/ });
        if ((await entryBtns.count()) > 0) {
          await rec.click(entryBtns.first(), "style");
        } else {
          // fallback: any large choice button in main
          const choices = page.locator("main button").filter({ hasText: /.{2,20}/ });
          if ((await choices.count()) > 0) await rec.click(choices.first(), "style-fallback");
        }
      }

      // Answer up to 8 question steps (style may skip some)
      for (let i = 0; i < 8; i++) {
        await page.waitForTimeout(400);
        const onResults = page.url().includes("/results");
        if (onResults) {
          completed = true;
          break;
        }
        // option buttons inside survey
        const opts = page.locator("main button").filter({ hasNotText: /이전|다음|건너|다시|제출|결과|처음부터/ });
        const count = await opts.count();
        if (count === 0) {
          // maybe need explicit next
          const next = page.getByRole("button", { name: /다음|결과 보기|추천 받기|완료/ });
          if (await next.count()) {
            await rec.click(next.first(), "next");
            continue;
          }
          blocker = `no options at step loop ${i} url=${page.url()}`;
          break;
        }
        await rec.click(opts.first(), `opt-${i}`);
        // some UIs auto-advance; else click next
        await page.waitForTimeout(350);
        if (!page.url().includes("/results")) {
          const next = page.getByRole("button", { name: /다음|결과 보기|추천 받기|완료/ });
          if (await next.count()) {
            const disabled = await next.first().isDisabled().catch(() => false);
            if (!disabled) await rec.click(next.first(), "next");
          }
        }
      }

      // wait for results or error
      await page.waitForTimeout(2000);
      if (page.url().includes("/results")) {
        completed = true;
        await shot(page, "T1-03-results");
        const empty = await page.getByText(/아직 설문 결과가 없어요/).isVisible().catch(() => false);
        if (empty) {
          completed = false;
          blocker = "landed on results empty";
        }
        const err = await page.getByText(/연결할 수 없습니다|실패했습니다|다시 시도/).first().isVisible().catch(() => false);
        if (err && !(await page.getByText(/조합|추천|스위치/).first().isVisible().catch(() => false))) {
          completed = false;
          blocker = blocker || "error visible on results path";
        }
      } else {
        await shot(page, "T1-03-stuck");
        const errText = await page.locator("main").innerText().catch(() => "");
        if (/연결|실패|다시 시도/.test(errText)) blocker = blocker || "compute error on recommend";
        else blocker = blocker || `stuck at ${page.url()}`;
      }
    } catch (e) {
      blocker = String(e.message || e);
      await shot(page, "T1-error").catch(() => null);
    }
    results.push({ id: "T1", name: "Guest: home→survey→results", completed, blocker, ...rec.metrics() });
    await context.close();
  }

  // ---- T2: Direct /results empty (cleared storage) ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const rec = recorder(page);
    let completed = false;
    let blocker = null;
    let hasCta = false;
    try {
      await page.goto(`${BASE}/results`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await shot(page, "T2-01-results-empty");
      const empty = await page.getByText(/아직 설문 결과가 없어요/).isVisible();
      hasCta = await page.getByRole("link", { name: /설문 시작하기/ }).isVisible();
      if (empty && hasCta) {
        await rec.click(page.getByRole("link", { name: /설문 시작하기/ }), "start");
        await page.waitForURL(/\/recommend/, { timeout: 10000 });
        completed = true;
      } else {
        blocker = empty ? "empty without CTA" : "not empty or different copy";
      }
    } catch (e) {
      blocker = String(e.message || e);
    }
    results.push({ id: "T2", name: "Empty results → recover to survey", completed, blocker, hasCta, ...rec.metrics() });
    await context.close();
  }

  // ---- T3: Catalog find + empty search ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const rec = recorder(page);
    let completed = false;
    let blocker = null;
    try {
      await page.goto(`${BASE}/catalog`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await shot(page, "T3-01-catalog");
      const search = page.getByPlaceholder(/검색/);
      await search.fill("zzzznonexistent999");
      await search.press("Enter");
      await page.waitForTimeout(800);
      await shot(page, "T3-02-search-empty");
      const emptyMsg = await page.getByText(/검색 결과가 없습니다/).isVisible().catch(() => false);
      const clear = page.getByRole("button", { name: /검색 지우기|초기화/ }).or(page.getByRole("link", { name: /검색 지우기/ }));
      if (emptyMsg) {
        if (await clear.count()) await rec.click(clear.first(), "clear");
        completed = true;
      } else {
        // maybe live filter without message
        blocker = "search empty message not found";
        completed = emptyMsg;
      }
      // reset and open a family tab
      await page.goto(`${BASE}/catalog`, { waitUntil: "domcontentloaded" });
      const tab = page.getByRole("tab").or(page.getByRole("link").filter({ hasText: /스위치|키캡|플레이트/ })).first();
      if (await tab.count()) await rec.click(tab, "tab");
    } catch (e) {
      blocker = String(e.message || e);
    }
    results.push({ id: "T3", name: "Catalog search empty recovery", completed, blocker, ...rec.metrics() });
    await context.close();
  }

  // ---- T4: Nav discoverability — Results hidden until local result ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const rec = recorder(page);
    let resultsNavVisible = false;
    let completed = true;
    let blocker = null;
    try {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(500);
      resultsNavVisible = await page.getByRole("navigation", { name: /주요/ }).getByRole("link", { name: /^결과$/ }).isVisible().catch(() => false);
      await shot(page, "T4-01-nav-no-results");
      // guest can still open /results via URL — intentional
      await page.goto(`${BASE}/results`, { waitUntil: "domcontentloaded" });
      const empty = await page.getByText(/아직 설문 결과가 없어요/).isVisible();
      if (!empty) blocker = "expected empty results for fresh guest";
      completed = empty && resultsNavVisible === false;
    } catch (e) {
      completed = false;
      blocker = String(e.message || e);
    }
    results.push({
      id: "T4",
      name: "Fresh guest: Results nav hidden; /results empty recoverable",
      completed,
      blocker,
      resultsNavVisible,
      ...rec.metrics(),
    });
    await context.close();
  }

  // ---- T5: Mobile 390 home→recommend CTA ----
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const rec = recorder(page);
    let completed = false;
    let blocker = null;
    try {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await shot(page, "T5-01-mobile-home");
      const menu = page.getByRole("button", { name: /메뉴|menu|열기/i });
      if (await menu.count()) await rec.click(menu.first(), "menu");
      const survey = page.getByRole("link", { name: /설문/ }).first();
      if (await survey.isVisible().catch(() => false)) {
        await rec.click(survey, "nav-survey");
      } else {
        await rec.click(page.getByTestId("e2e-home-start-survey").or(page.getByRole("link", { name: /추천 설문 시작/ })).first(), "cta");
      }
      await page.waitForURL(/\/recommend/, { timeout: 15000 });
      completed = true;
      await shot(page, "T5-02-mobile-recommend");
    } catch (e) {
      blocker = String(e.message || e);
    }
    results.push({ id: "T5", name: "Mobile: reach survey", completed, blocker, ...rec.metrics() });
    await context.close();
  }

  // ---- T6: Auth entry friction (count fields, no submit) ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const rec = recorder(page);
    let completed = false;
    let blocker = null;
    let fieldCount = 0;
    let signupSteps = [];
    try {
      await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await shot(page, "T6-01-auth");
      const signupLink = page.getByRole("link", { name: /회원|가입|시작/ }).or(page.getByRole("button", { name: /회원|가입/ }));
      if (await signupLink.count()) await rec.click(signupLink.first(), "signup");
      else await page.goto(`${BASE}/auth/signup`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await shot(page, "T6-02-signup");
      fieldCount = await page.locator("input:visible").count();
      const progress = await page.locator('[role="group"], [role="progressbar"], ol, .step').allTextContents().catch(() => []);
      signupSteps = progress.slice(0, 6);
      // implied consent text
      const consent = await page.getByText(/이용약관|개인정보/).first().isVisible().catch(() => false);
      completed = fieldCount >= 1;
      results.push({
        id: "T6",
        name: "Signup entry: fields & consent visibility",
        completed,
        blocker,
        fieldCount,
        consentVisibleOnFirstStep: consent,
        signupSteps,
        ...rec.metrics(),
      });
    } catch (e) {
      results.push({ id: "T6", name: "Signup entry", completed: false, blocker: String(e.message || e), ...rec.metrics() });
    }
    await context.close();
  }

  // Heuristic spot: English "Empty" label
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/results`, { waitUntil: "domcontentloaded" });
    const emptyLabel = await page.getByText(/^Empty$/).isVisible().catch(() => false);
    await shot(page, "H-empty-label");
    results.push({ id: "H1", name: "Results empty shows English 'Empty' label", observed: emptyLabel });
    await context.close();
  }

  const report = { base: BASE, generatedAt: new Date().toISOString(), results };
  fs.writeFileSync(path.join(OUT, "ux-task-walkthrough.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
