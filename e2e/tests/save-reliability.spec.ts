import { expect, test, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_USER_EMAIL ?? "keyboardrecommendertest@gmail.com";
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD ?? "testtest123!";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";
const DETERMINISTIC_ANSWERS = {
  sound_profile: "muted",
  typing_pressure: "light",
  switch_feel: "linear",
  bottom_out: "soft",
  volume: "quiet",
} as const;

async function login(page: Page, next = "/recommend"): Promise<void> {
  console.log(`login:start:${next}`);
  const response = await page.request.post(`${API_BASE}/api/v1/auth/login`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
  const setCookie = response.headers()["set-cookie"] ?? "";
  const tokenMatch = /kr_session=([^;]+)/.exec(setCookie);
  expect(tokenMatch).not.toBeNull();
  await page.context().addCookies([
    {
      name: "kr_session",
      value: tokenMatch![1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);
  await page.goto(next);
  const me = await page.evaluate(
    async ({ base }) => {
      const res = await fetch(`${base}/api/v1/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      return res.ok ? await res.json() : null;
    },
    { base: API_BASE },
  );
  expect(me?.user?.email).toBe(TEST_EMAIL);
  await expect(
    page,
  ).toHaveURL((url) => {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` === next;
  }, { timeout: 60_000 });
  console.log(`login:done:${next}`);
}

async function logout(page: Page): Promise<void> {
  console.log("logout:start");
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(
    page,
  ).toHaveURL((url) => {
    const parsed = new URL(url);
    return parsed.pathname === "/" || parsed.pathname === "/auth";
  }, { timeout: 30_000 });
  if (new URL(page.url()).pathname === "/") {
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible({ timeout: 30_000 });
  } else {
    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible({ timeout: 30_000 });
  }
  console.log("logout:done");
}

async function clearExistingSavedBuilds(page: Page): Promise<void> {
  console.log("saved:clear:start");
  const items = await page.evaluate(
    async ({ base }) => {
      const response = await fetch(`${base}/api/v1/recommendations/saved?limit=100`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`list saved failed: ${response.status}`);
      const json = (await response.json()) as {
        items?: Array<{ request_id: string; build_id: string; saved_at?: string }>;
      };
      return Array.isArray(json.items) ? json.items : [];
    },
    { base: API_BASE },
  );

  for (const item of items) {
    await page.evaluate(
      async ({ base, payload }) => {
        const response = await fetch(`${base}/api/v1/recommendations/saved/remove`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`remove saved failed: ${response.status}`);
      },
      {
        base: API_BASE,
        payload: {
          request_id: item.request_id,
          build_id: item.build_id,
          ...(item.saved_at ? { saved_at: item.saved_at } : {}),
        },
      },
    );
  }
  console.log(`saved:clear:done:${items.length}`);
}

async function openDeterministicResults(page: Page): Promise<void> {
  const response = await page.request.post(`${API_BASE}/api/v1/recommendations/compute`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    data: DETERMINISTIC_ANSWERS,
  });
  expect(response.ok()).toBeTruthy();
  const res = await response.json();
  const submission = {
    version: 2,
    answers: res.answers,
    traits: {},
    completedAtIso: res.completedAtIso,
    build: res.build,
    source: "api",
    apiUserVector: res.userVector,
    userTraitScores: res.userTraitScores,
    traitAxes: res.traitAxes,
    recommendations: res.recommendations,
    matchExplanations: res.matchExplanations,
    overallConfidence: res.overallConfidence,
    ...(res.compatibilityAudit ? { compatibilityAudit: res.compatibilityAudit } : {}),
    ...(res.diversityAudit ? { diversityAudit: res.diversityAudit } : {}),
    ...(res.fallbackAudit ? { fallbackAudit: res.fallbackAudit } : {}),
    ...(res.recommendationConfidence ? { recommendationConfidence: res.recommendationConfidence } : {}),
    ...(res.feedbackLearning ? { feedbackLearning: res.feedbackLearning } : {}),
    ...(res.confidenceGuidance ? { confidenceGuidance: res.confidenceGuidance } : {}),
    ...(res.degradedReason ? { degradedReason: res.degradedReason } : {}),
  };
  await page.goto("/");
  await page.evaluate((payload) => {
    window.sessionStorage.setItem("kr_survey_v2", JSON.stringify(payload));
    window.localStorage.setItem("kr_last_good_v2", JSON.stringify(payload));
  }, submission);
  await page.goto("/results");
  await expect(page.getByTestId("e2e-server-ranked")).toBeVisible({ timeout: 60_000 });
}

async function fetchLatestSavedAt(page: Page): Promise<string | null> {
  return page.evaluate(
    async ({ base }) => {
      const response = await fetch(`${base}/api/v1/recommendations/saved?limit=1`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`list saved failed: ${response.status}`);
      const json = (await response.json()) as { items?: Array<{ saved_at?: string }> };
      return json.items?.[0]?.saved_at ?? null;
    },
    { base: API_BASE },
  );
}

function isSavedPost(url: string, method: string): boolean {
  if (method !== "POST") return false;
  try {
    const pathname = new URL(url).pathname;
    return pathname === "/api/v1/recommendations/saved";
  } catch {
    return url.includes("/api/v1/recommendations/saved") && !url.includes("/saved/");
  }
}

test.describe("Save reliability", () => {
  test.describe.configure({ mode: "serial" });

  test("login -> save -> mypage -> reload -> logout -> relogin keeps saved build", async ({ page }) => {
    test.setTimeout(120_000);

    await login(page);
    await clearExistingSavedBuilds(page);
    console.log("flow:goto-results");
    await openDeterministicResults(page);

    const saveButton = page.getByTestId("e2e-save-build");
    console.log("assert:save-button-idle");
    await expect(saveButton).toHaveText("이 빌드 저장", { timeout: 30_000 });

    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/recommendations/saved") &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );

    await saveButton.click();
    console.log("action:save-clicked");
    await expect(saveButton).toHaveText("저장 중…", { timeout: 10_000 });

    const saveResponse = await saveResponsePromise;
    const saveBody = await saveResponse.json();
    expect(saveBody.saved).toBeTruthy();
    console.log("assert:save-response");

    await expect(saveButton).toHaveText("마이페이지에 저장됨", { timeout: 30_000 });
    await expect(page.getByText(/마이페이지에 저장했습니다|이미 마이페이지에 저장된 빌드입니다/)).toBeVisible({
      timeout: 30_000,
    });
    console.log("assert:save-ui-complete");

    await page.getByRole("link", { name: "저장한 빌드로 이동" }).click();
    await expect(page).toHaveURL(/\/mypage\?section=saved/, { timeout: 30_000 });
    // Hub may land on a recoverable load error; retry then assert the saved list.
    const retryLoad = page.getByRole("button", { name: "다시 시도" });
    if (await retryLoad.isVisible().catch(() => false)) {
      await retryLoad.click();
    }
    await page.getByRole("button", { name: "저장한 빌드" }).click();
    await expect(page.getByRole("listbox", { name: "저장한 빌드 목록" })).toBeVisible({ timeout: 30_000 });
    console.log("assert:mypage-visible");

    const firstItem = page.locator('[role="option"]').first();
    const savedAt = page.getByText(/^저장:/).first();
    await expect(firstItem).toBeVisible();
    await expect(savedAt).toBeVisible();

    const latestSavedAtIso = await fetchLatestSavedAt(page);
    expect(latestSavedAtIso).not.toBeNull();
    expect(Date.parse(latestSavedAtIso!)).toBeLessThanOrEqual(Date.now() + 60_000);

    const savedAtText = (await savedAt.textContent())?.trim() ?? "";
    expect(savedAtText).toMatch(/^저장:/);
    console.log("assert:time-visible");

    await page.reload();
    await expect(page.getByRole("listbox", { name: "저장한 빌드 목록" })).toBeVisible({ timeout: 30_000 });
    await expect(firstItem).toBeVisible();
    await expect(savedAt).toHaveText(savedAtText);
    console.log("assert:reload-visible");

    await logout(page);
    await login(page, "/mypage?section=saved");
    await expect(page).toHaveURL(/\/mypage\?section=saved/, { timeout: 30_000 });
    // Full navigation after cookie login can race the first extras fetch; ensure
    // the saved section is selected and data is present before asserting.
    await page.getByRole("button", { name: "저장한 빌드" }).click();
    const savedList = page.getByRole("listbox", { name: "저장한 빌드 목록" });
    if (!(await savedList.isVisible().catch(() => false))) {
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/v1/recommendations/saved") &&
            response.request().method() === "GET" &&
            response.ok(),
          { timeout: 30_000 },
        ).catch(() => null),
        page.reload(),
      ]);
      await page.getByRole("button", { name: "저장한 빌드" }).click();
    }
    await expect(savedList).toBeVisible({ timeout: 30_000 });
    await expect(firstItem).toBeVisible();
    await expect(savedAt).toHaveText(savedAtText);
    console.log("assert:relogin-visible");
  });

  test("save failure shows Korean recovery copy and retry succeeds", async ({ page }) => {
    test.setTimeout(120_000);

    await login(page);
    await clearExistingSavedBuilds(page);
    await openDeterministicResults(page);

    const saveButton = page.getByTestId("e2e-save-build");
    await expect(saveButton).toHaveText("이 빌드 저장", { timeout: 30_000 });

    let failOnce = true;
    await page.route("**/api/v1/recommendations/saved", async (route) => {
      const request = route.request();
      if (!isSavedPost(request.url(), request.method())) {
        await route.continue();
        return;
      }
      if (failOnce) {
        failOnce = false;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await saveButton.click();
    const errorAlert = page.getByTestId("e2e-server-ranked").getByRole("alert");
    await expect(errorAlert).toBeVisible({ timeout: 30_000 });
    await expect(errorAlert).toContainText("네트워크 연결을 확인한 뒤 다시 시도해 주세요");
    await expect(errorAlert).not.toContainText(/Failed to fetch/i);
    await expect(saveButton).toBeEnabled();
    await expect(saveButton).toHaveText("이 빌드 저장");

    const retryResponsePromise = page.waitForResponse(
      (response) =>
        isSavedPost(response.url(), response.request().method()) && response.status() === 200,
    );
    await saveButton.click();
    await retryResponsePromise;
    await expect(saveButton).toHaveText("마이페이지에 저장됨", { timeout: 30_000 });
    await expect(page.getByText(/마이페이지에 저장했습니다|이미 마이페이지에 저장된 빌드입니다/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("duplicate save clicks issue only one POST request", async ({ page }) => {
    test.setTimeout(120_000);

    await login(page);
    await clearExistingSavedBuilds(page);
    await openDeterministicResults(page);

    const saveButton = page.getByTestId("e2e-save-build");
    await expect(saveButton).toHaveText("이 빌드 저장", { timeout: 30_000 });

    let postCount = 0;
    await page.route("**/api/v1/recommendations/saved", async (route) => {
      const request = route.request();
      if (!isSavedPost(request.url(), request.method())) {
        await route.continue();
        return;
      }
      postCount += 1;
      // Keep the first request in-flight long enough for rapid extra clicks.
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          isSavedPost(response.url(), response.request().method()) && response.status() === 200,
      ),
      (async () => {
        await saveButton.click();
        await expect(saveButton).toHaveText("저장 중…", { timeout: 10_000 });
        await expect(saveButton).toBeDisabled();
        // Extra clicks while saving — UI + in-flight guard must drop these.
        await saveButton.click({ force: true }).catch(() => undefined);
        await saveButton.click({ force: true }).catch(() => undefined);
        const primary = page.getByTestId("e2e-save-build-primary");
        if (await primary.count()) {
          await primary.click({ force: true }).catch(() => undefined);
        }
      })(),
    ]);

    await expect(saveButton).toHaveText("마이페이지에 저장됨", { timeout: 30_000 });
    expect(postCount).toBe(1);
  });
});
