# 08_Performance_QA.md — Cursor QA Master Suite · Performance Playbook

> **문서 등급:** ★★★★★ · Core Web Vitals부터 런타임까지 검증하는 성능 QA 실행 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind CSS · Playwright · Chrome DevTools Protocol
> **검사 대상:** LCP · INP · CLS · TTFB · 번들 · 코드 분할 · 이미지 · 폰트 · 렌더 · 하이드레이션 · 캐시 · 메모리 · 서버
> **핵심 전제:** 측정하지 않은 최적화는 추측이다. 프로덕션 빌드와 스로틀 환경에서만 판정한다.
> **독립성:** 이 문서는 `01_Core_QA.md` 없이 단독 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 수행하는 명령형 플레이북.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding과 예산](#3-project-binding과-예산)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [측정 인프라](#5-측정-인프라)
6. [LCP](#6-lcp)
7. [INP](#7-inp)
8. [CLS](#8-cls)
9. [TTFB와 서버 응답](#9-ttfb와-서버-응답)
10. [번들과 코드 분할](#10-번들과-코드-분할)
11. [이미지와 미디어](#11-이미지와-미디어)
12. [폰트](#12-폰트)
13. [네트워크와 캐시](#13-네트워크와-캐시)
14. [React 렌더 성능](#14-react-렌더-성능)
15. [하이드레이션과 상호작용 준비](#15-하이드레이션과-상호작용-준비)
16. [Suspense · Streaming · RSC](#16-suspense-streaming-rsc)
17. [메모리와 장수명 세션](#17-메모리와-장수명-세션)
18. [서버 · API · 데이터 페칭](#18-서버-api-데이터-페칭)
19. [모바일·저사양 성능](#19-모바일저사양-성능)
20. [RUM과 필드 데이터](#20-rum과-필드-데이터)
21. [예산과 회귀 탐지](#21-예산과-회귀-탐지)
22. [Playwright · Lighthouse 자동화](#22-playwright-lighthouse-자동화)
23. [Regression 절차](#23-regression-절차)
24. [Final Report](#24-final-report)
25. [부록 A — 측정 스크립트](#부록-a-측정-스크립트)
26. [부록 B — Agent 체크리스트](#부록-b-agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

성능 QA는 “빠르게 느껴진다”를 검증하는 일이 아니다. **어느 지표가, 어느 환경에서, 어떤 요소 때문에, 어느 임계값을 넘는가**를 입증하고, 수정이 그 지표를 실제로 개선했는지 재측정하는 일이다.

Lighthouse 점수만 올리는 작업은 성능 개선이 아닐 수 있다. 점수는 합성 점수이고, 사용자는 LCP·INP·CLS·TTFB로 고통받는다. Agent는 점수가 아니라 **사용자 체감에 연결된 지표와 원인**을 추적한다.

### 1.1 동시에 수행할 역할

- **Performance Engineer:** Lab/Field 측정, 예산, 회귀, 원인 분석을 주도한다.
- **Frontend Architect:** 번들 경계, RSC/Client 경계, 캐시 계층을 설계 관점에서 검증한다.
- **React Specialist:** 불필요 리렌더, hydration 비용, Suspense 경계를 진단한다.
- **Network Engineer:** 요청 폭포, 캐시 헤더, CDN, 이미지/폰트 전달을 검증한다.
- **RUM Analyst:** 필드 분포(p75)와 세그먼트(기기·네트워크·국가)를 해석한다.
- **Release Gate Owner:** 회귀를 차단하고 예외의 만료를 관리한다.

### 1.2 완료 조건

```text
[ ] 프로덕션 빌드로 측정을 수행했다 (dev 모드 판정 금지).
[ ] Desktop + Mobile, 스로틀 조건을 명시했다.
[ ] P0 라우트마다 LCP/INP/CLS/TTFB를 수집했다.
[ ] 각 실패 지표에 원인 요소·요청·스크립트를 귀속했다.
[ ] 번들 예산과 라우트별 JS 전송량을 측정했다.
[ ] 이미지·폰트·제3자 스크립트의 비용을 분리했다.
[ ] React 리렌더·hydration·메모리 누수 후보를 점검했다.
[ ] Lab과 Field(가능하면) 차이를 기록했다. 없으면 NO_DATA.
[ ] 예산을 baseline으로 저장하고 회귀 게이트를 실행했다.
[ ] Finding에 측정값·환경·원인·개선 원칙·재측정 방법을 붙였다.
[ ] 승인 전 애플리케이션 코드를 수정하지 않았다.
```

측정하지 않은 지표를 PASS로 쓰지 않는다. 도구가 없거나 필드 데이터가 없으면 `NO_DATA` / `BLOCKED`로 표기한다.

---

## 2. 절대 원칙

충돌 시 번호가 작은 쪽이 이긴다.

### PERF-P1. 프로덕션 빌드만 판정한다

`next dev`는 HMR, 소스맵, 비최적화 번들 때문에 의미가 없다. `next build && next start` 또는 배포 프리뷰에서만 PASS/FAIL을 내린다.

### PERF-P2. 환경을 기록하지 않은 수치는 없다

뷰포트, CPU throttle, network throttle, 캐시 상태(cold/warm), locale, auth 상태가 없으면 수치는 비교 불가능하다.

### PERF-P3. 원인 없는 최적화는 금지한다

“메모이제이션을 넣자”, “이미지를 줄이자”는 원인 귀속 전에는 추측이다. LCP 요소, long task, layout shift source, 번들 모듈을 먼저 지목한다.

### PERF-P4. Lab은 진단, Field는 판정

Lighthouse/Playwright는 재현과 회귀에 쓰인다. 실제 사용자 경험의 최종 판정은 CrUX/RUM p75가 우선한다. Field가 없으면 Lab을 쓰되 한계를 명시한다.

### PERF-P5. p75를 본다

평균은 낙관적으로 보인다. Core Web Vitals는 75번째 백분위수를 본다. “내 노트북에서는 빠르다”는 증거가 아니다.

### PERF-P6. 예산을 게이트로 만든다

예산 없는 성능 작업은 회귀를 막지 못한다. JS KB, LCP ms, CLS, 요청 수에 상한을 두고 CI에서 증가를 실패시킨다.

### PERF-P7. 체감 경로를 우선한다

P0 랜딩, 로그인 후 홈, 결제, 검색 결과처럼 **자주·중요한** 경로를 먼저 고친다. 관리자 전용 화면의 1KB 절감보다 홈 LCP 300ms가 먼저다.

### PERF-P8. 전송량과 메인스레드를 분리한다

네트워크가 빨라도 메인스레드가 막히면 INP가 깨진다. 번들 크기 개선만으로 상호작용을 고쳤다고 말하지 않는다.

### PERF-P9. 캐시는 정확성 위에 세운다

잘못된 캐시는 빠른 오답이다. `Cache-Control`, `revalidate`, `stale-while-revalidate`를 성능 이득만으로 느슨하게 만들지 않는다.

### PERF-P10. 제3자는 제품 예산에 포함된다

분석, 채팅, A/B, 광고 스크립트도 LCP/INP 예산에 들어간다. “우리 코드가 아니다”는 면책이 아니다.

### PERF-P11. 미세 최적화보다 구조 최적화를 택한다

`useMemo` 남발보다 컴포넌트 경계, 데이터 waterfall 제거, 이미지 우선순위가 효과가 크다.

### PERF-P12. 보고 후 수정한다

먼저 측정 리포트를 전달한다. 사용자가 QA와 수정을 함께 요청하지 않았다면 코드를 바꾸지 않는다.

---

## 3. Project Binding과 예산

```yaml
performance_binding:
  workspace_root: "."
  app_path: "apps/web"                 # 또는 frontend
  package_manager: "pnpm"
  commands:
    build: "pnpm --filter web build"
    start: "pnpm --filter web start"
    analyze: "ANALYZE=true pnpm --filter web build"
    typecheck: "pnpm --filter web typecheck"
    test_perf: "pnpm playwright test --project=performance"
  base_url: "http://127.0.0.1:3000"
  preview_url: null                    # Vercel/Cloudflare preview 등
  rum:
    provider: "none"                   # vercel-analytics | ga4 | sentry | posthog | none
    crux: false
  p0_routes:
    - path: "/"
      auth: false
      intent: "landing"
    - path: "/catalog"
      auth: false
      intent: "browse"
    - path: "/recommend"
      auth: false
      intent: "conversion"
    - path: "/dashboard"
      auth: true
      intent: "app-home"
  environments:
    lab_desktop:
      viewport: { width: 1440, height: 900 }
      cpu_throttle: 4
      network: "4G"                    # Playwright/CDP preset
      cache: "cold"
    lab_mobile:
      device: "Pixel 7"
      cpu_throttle: 6
      network: "Slow 4G"
      cache: "cold"
  budgets:
    lcp_ms: 2500
    inp_ms: 200
    cls: 0.1
    ttfb_ms: 800
    js_kb_transfer_p0: 180             # 초기 라우트 JS 전송(압축)
    js_kb_transfer_p0_mobile: 150
    image_kb_above_fold: 300
    font_kb: 100
    requests_initial: 50
  freeze_list: []
```

### 3.1 Binding 자동 탐색

```bash
# 앱·스크립트
rg -n '"build"|"start"|"analyze"' package.json apps/*/package.json frontend/package.json

# next 설정
fd "next.config.*" .
rg -n "images|experimental|bundlePagesRouterDependencies|optimizePackageImports" \
  next.config.* apps/*/next.config.* frontend/next.config.*

# 성능 관련 의존성
rg -n "web-vitals|@next/bundle-analyzer|lighthouse|playwright" package.json \
  apps/*/package.json frontend/package.json

# RUM/분석
rg -n "reportWebVitals|web-vitals|speedInsights|@vercel/analytics|gtag|sentry" \
  apps frontend src --glob '*.{ts,tsx}'
```

### 3.2 예산 책정 원칙

```text
1. 현재 p75(또는 Lab 중앙값)를 측정한다.
2. 목표를 "업계 최고"가 아니라 "현재 + 달성 가능한 개선"으로 잡는다.
3. CWV Good 임계값을 상한으로 둔다 (LCP 2.5s, INP 200ms, CLS 0.1).
4. 신규 기능은 예산 증가 PR 설명과 만료일 있는 예외를 요구한다.
5. 예산은 압축 전송량(transfer size)과 메인스레드 시간을 함께 본다.
```

현재가 이미 Good를 넘으면 예산을 “현상 유지 + 10%”로 잡지 않는다. 먼저 Good로 되돌리는 목표를 세운다.

---

## 4. 실행 파이프라인과 Severity

```text
1. BIND
   경로·명령·P0·예산을 채운다.

2. BUILD
   프로덕션 빌드를 만들고 분석 산출물(bundle analyzer)을 생성한다.

3. BASELINE
   cold cache Lab에서 P0 라우트 CWV·전송량을 측정해 baseline으로 저장한다.

4. ATTRIBUTION
   실패 지표마다 LCP 요소, shift source, long task, 모듈을 귀속한다.

5. STATIC
   import 그래프, 대형 의존성, 이미지/폰트, 제3자 스크립트를 정적 검사한다.

6. RUNTIME
   리렌더, hydration, 메모리, API waterfall을 점검한다.

7. FIELD CROSS-CHECK
   RUM/CrUX가 있으면 Lab과 대조한다. 없으면 NO_DATA.

8. BUDGET GATE
   baseline 대비 회귀와 절대 예산을 판정한다.

9. REPORT
   증거와 함께 보고한다. 수정은 승인 후.
```

### 4.1 Severity

| 등급 | 성능 기준 |
|------|-----------|
| **S0 Blocker** | P0 경로가 사용 불능에 가깝다. LCP > 6s, INP > 1s, 치명적 메모리 누수로 탭 사망. |
| **S1 Critical** | P0에서 CWV Poor. 결제/가입 전환 경로 성능 회귀. 번들 예산 대비 +30% 이상. |
| **S2 Major** | CWV Needs Improvement. 반복되는 waterfall/과다 리렌더. 예산 대비 +10~30%. |
| **S3 Minor** | 비P0 경로, 작은 예산 초과, 개선 여지는 있으나 체감 영향이 제한적. |
| **S4 Nit** | 미세한 전송량·미사용 export 등. 기능 영향 없음. |

**상향**

```text
- 전환 경로(가입·결제·추천 완료): +1
- 모바일 Slow 4G에서만 재현되어도 주 사용자층이 모바일이면 +1
- 회귀가 main 대비 명확히 악화: +1
- 제3자 스크립트가 원인인데 제거/지연 가능: 그대로 유지하되 owner를 마케팅/그로스와 공유
```

---

## 5. 측정 인프라

### PERF-MEAS-01 — Lab 환경 고정

**WHY**

캐시가 따뜻한 상태, CPU 미스로틀, 데스크톱 전용 측정은 낙관적 환상을 만든다. 비교 가능한 숫자만 남긴다.

**DETECT / SETUP**

```ts
// tests/performance/fixtures.ts
import { test as base, chromium, devices } from '@playwright/test';

type PerfFixtures = {
  perfPage: {
    page: import('@playwright/test').Page;
    collect: () => Promise<PerfMetrics>;
  };
};

export type PerfMetrics = {
  url: string;
  lcp: number | null;
  cls: number;
  ttfb: number | null;
  fcp: number | null;
  inp: number | null;
  transferJS: number;
  transferImg: number;
  transferFont: number;
  requests: number;
};

export const test = base.extend<PerfFixtures>({
  perfPage: async ({}, use, testInfo) => {
    const browser = await chromium.launch({
      args: ['--enable-precise-memory-info'],
    });
    const context = await browser.newContext({
      ...devices['Desktop Chrome'],
      viewport: { width: 1440, height: 900 },
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (4 * 1024 * 1024) / 8, // ~4Mbps
      uploadThroughput: (1 * 1024 * 1024) / 8,
      latency: 70,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    const metrics: Partial<PerfMetrics> = { cls: 0, transferJS: 0, transferImg: 0, transferFont: 0, requests: 0 };

    await page.addInitScript(() => {
      (window as any).__perf = { lcp: null, cls: 0, ttfb: null, fcp: null, inp: null };
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (e.entryType === 'largest-contentful-paint') {
            (window as any).__perf.lcp = e.startTime;
          }
          if (e.entryType === 'layout-shift' && !(e as any).hadRecentInput) {
            (window as any).__perf.cls += (e as any).value;
          }
          if (e.entryType === 'first-contentful-paint') {
            (window as any).__perf.fcp = e.startTime;
          }
          if (e.entryType === 'event' && (e as any).interactionId) {
            const d = (e as any).duration;
            const cur = (window as any).__perf.inp;
            if (cur == null || d > cur) (window as any).__perf.inp = d;
          }
        }
      }).observe({
        type: 'largest-contentful-paint',
        buffered: true,
      } as any);
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (!(e as any).hadRecentInput) (window as any).__perf.cls += (e as any).value;
        }
      }).observe({ type: 'layout-shift', buffered: true } as any);
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (e.name === 'first-contentful-paint') (window as any).__perf.fcp = e.startTime;
        }
      }).observe({ type: 'paint', buffered: true } as any);
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          const d = (e as any).duration;
          const cur = (window as any).__perf.inp;
          if (cur == null || d > cur) (window as any).__perf.inp = d;
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);
    });

    page.on('response', async res => {
      try {
        const url = res.url();
        const headers = res.headers();
        const len = Number(headers['content-length'] ?? 0);
        metrics.requests = (metrics.requests ?? 0) + 1;
        if (/\.m?js(\?|$)/.test(url) || headers['content-type']?.includes('javascript')) {
          metrics.transferJS = (metrics.transferJS ?? 0) + len;
        }
        if (/image\//.test(headers['content-type'] ?? '') || /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/.test(url)) {
          metrics.transferImg = (metrics.transferImg ?? 0) + len;
        }
        if (/font\//.test(headers['content-type'] ?? '') || /\.(woff2?|ttf|otf)(\?|$)/.test(url)) {
          metrics.transferFont = (metrics.transferFont ?? 0) + len;
        }
      } catch {}
    });

    const collect = async (): Promise<PerfMetrics> => {
      const nav = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const perf = (window as any).__perf;
        return {
          ttfb: n ? n.responseStart - n.requestStart : null,
          lcp: perf.lcp,
          cls: perf.cls,
          fcp: perf.fcp,
          inp: perf.inp,
        };
      });
      return {
        url: page.url(),
        lcp: nav.lcp,
        cls: nav.cls,
        ttfb: nav.ttfb,
        fcp: nav.fcp,
        inp: nav.inp,
        transferJS: metrics.transferJS ?? 0,
        transferImg: metrics.transferImg ?? 0,
        transferFont: metrics.transferFont ?? 0,
        requests: metrics.requests ?? 0,
      };
    };

    await use({ page, collect });
    await context.close();
    await browser.close();
  },
});
```

**PASS / FAIL**

- PASS: 모든 Lab 수치에 환경 메타데이터가 붙는다.
- FAIL: dev 서버 측정으로 판정(S2 — 측정 무효), 환경 미기록(S3).

---

### PERF-MEAS-02 — Cold vs Warm

**WHY**

첫 방문(cold)과 재방문(warm)은 다른 제품이다. CDN/브라우저 캐시가 있는 warm만 보고 안심하면 신규 사용자 경험을 놓친다.

**DETECT**

```ts
test('cold vs warm LCP', async ({ perfPage }) => {
  const { page, collect } = perfPage;

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const cold = await collect();

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const warm = await collect();

  console.table({ cold, warm });
  test.info().attach('cold-warm', {
    body: JSON.stringify({ cold, warm }, null, 2),
    contentType: 'application/json',
  });
});
```

**판정**

```text
- 예산 게이트는 cold를 기본으로 한다.
- warm이 cold와 비슷하면 캐시 헤더/immutable 자산이 약한 신호다.
- warm만 좋고 cold가 나쁘면 첫 방문 경로(HTML/TTFB/이미지 우선순위)를 고친다.
```

---

### PERF-MEAS-03 — 반복 측정의 중앙값

**WHY**

한 번의 Lab 측정은 노이즈다. 최소 3회, 가능하면 5회 측정 후 중앙값을 쓴다.

```ts
async function medianRun(run: () => Promise<number>, times = 5) {
  const values: number[] = [];
  for (let i = 0; i < times; i++) values.push(await run());
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}
```

분산이 크면(최대-최소 > 20%) 원인을 먼저 찾는다. 애니메이션, 실험 플래그, 비결정적 SSR, 원격 폰트가 흔하다.

---

### PERF-MEAS-04 — 성능 프로파일 산출물

매 Finding에 아래 중 하나 이상을 첨부한다.

```text
- Playwright trace (trace.zip)
- Chrome Performance profile (.json)
- Lighthouse JSON/HTML
- Bundle analyzer 스크린샷 또는 stats.json
- CWV attribution JSON (LCP element, CLS sources)
- Network HAR (필요 시)
```

저장 위치: `tmp/qa/performance/<날짜>/` — 커밋하지 않는다.

---

## 6. LCP

LCP(Largest Contentful Paint)는 뷰포트 안 가장 큰 콘텐츠가 렌더되는 시점이다. 사용자는 “페이지가 떴다”고 느끼는 순간과 가장 가깝다.

### PERF-LCP-01 — P0 라우트 LCP 예산

**WHY**

랜딩과 앱 홈의 LCP가 나쁘면 첫인상과 전환이 함께 무너진다.

**DETECT**

```ts
test('P0 LCP budgets', async ({ perfPage }) => {
  const routes = ['/', '/catalog', '/recommend'];
  const budget = 2500;
  const results = [];

  for (const path of routes) {
    await perfPage.page.goto(path, { waitUntil: 'load' });
    await perfPage.page.waitForTimeout(2000);
    const m = await perfPage.collect();
    results.push({ path, lcp: m.lcp });
    expect(m.lcp, `${path} LCP ${m.lcp}`).not.toBeNull();
    expect(m.lcp!, `${path} LCP ${m.lcp} > ${budget}`).toBeLessThanOrEqual(budget);
  }
  console.table(results);
});
```

**임계값**

| 등급 | LCP |
|------|-----|
| Good | ≤ 2.5s |
| Needs Improvement | ≤ 4.0s |
| Poor | > 4.0s |

**PASS / FAIL**

- PASS: P0 cold Lab 중앙값이 Good.
- FAIL: Poor면 S1(P0), Needs Improvement면 S2. 결제/가입이면 상향.

---

### PERF-LCP-02 — LCP 요소 귀속

**WHY**

LCP를 “페이지가 느리다”로만 적으면 고칠 수 없다. 요소 선택자, 리소스 URL, discovery 시간, download 시간, render 지연을 분해한다.

**DETECT**

```ts
async function getLcpAttribution(page: Page) {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType('largest-contentful-paint') as any[];
    const last = entries.at(-1);
    if (!last) return null;
    const el = last.element as Element | undefined;
    return {
      startTime: last.startTime,
      size: last.size,
      url: last.url,
      tag: el?.tagName,
      id: el?.id,
      className: (el as HTMLElement)?.className,
      text: el?.textContent?.slice(0, 80),
      outer: el?.outerHTML?.slice(0, 200),
    };
  });
}
```

```bash
# 히어로 이미지가 LCP인 경우 흔한 원인
rg -n "<Image|next/image|<img" app src --glob "*.tsx" | head
rg -n "priority|fetchPriority|loading=\"lazy\"" app src --glob "*.tsx" | head
```

**진단 트리**

```text
LCP가 이미지인가?
  ├─ URL이 늦게 발견된다 (HTML/CSS에 없음, JS로 주입)
  │    → 서버 HTML에 넣고 priority/fetchPriority="high"
  ├─ 다운로드가 느리다
  │    → 용량·포맷·CDN·우선순위·preload
  └─ 다운로드 후 렌더가 늦다
       → 메인스레드 점유, 폰트 차단, hydration 경합

LCP가 텍스트인가?
  ├─ 웹폰트 차단
  │    → font-display, preload, size-adjust
  └─ 서버 HTML이 비어 있고 클라이언트가 채움
       → RSC/SSR로 초기 HTML에 실제 텍스트 포함
```

**FIX**

```tsx
// ❌ LCP 후보 이미지를 lazy로
<Image src="/hero.webp" alt="" width={1200} height={800} />

// ✅ 최초 뷰포트 LCP 이미지
<Image
  src="/hero.webp"
  alt="제품 히어로"
  width={1200}
  height={800}
  priority
  fetchPriority="high"
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

```tsx
// ❌ 클라이언트에서만 히어로 제목을 넣음 — LCP가 늦어짐
'use client';
export function Hero() {
  const [title, setTitle] = useState('');
  useEffect(() => setTitle(cmsTitle), []);
  return <h1>{title}</h1>;
}

// ✅ 서버에서 텍스트를 즉시 렌더
export function Hero({ title }: { title: string }) {
  return <h1 className="text-5xl font-semibold">{title}</h1>;
}
```

**REGRESSION**

LCP 요소의 tag/url을 snapshot처럼 고정하지 말고, 예산과 “이미지는 priority” 같은 계약 테스트를 유지한다.

---

### PERF-LCP-03 — preload와 우선순위 남용

**WHY**

모든 자원에 `preload`/`priority`를 붙이면 네트워크 경쟁만 커진다. LCP에 필요한 소수만 높인다.

**DETECT**

```bash
rg -n "rel=\"preload\"|fetchPriority=\"high\"|priority[={\\{]" \
  app src --glob "*.{tsx,ts,html}" 
```

```ts
const highs = await page.locator('[fetchpriority="high"], link[rel="preload"]').count();
expect(highs, 'high priority resources too many').toBeLessThanOrEqual(4);
```

**FIX 원칙**

```text
- preload: LCP 이미지 1개, critical font 1~2개
- priority: 뷰포트 LCP 이미지에만
- 나머지 이미지는 lazy + 적절한 sizes
```

---

### PERF-LCP-04 — 클라이언트 전용 렌더가 LCP를 훔친다

**DETECT**

```bash
rg -n "use client" app src --glob "**/page.tsx"
rg -n "dynamic\(|ssr:\s*false" app src --glob "*.{ts,tsx}"
```

`ssr: false`로 큰 히어로/차트/맵을 불러오면 LCP가 JS 실행 뒤로 밀린다. 첫 페인트에 필요한 골격은 서버 HTML에 두고, 무거운 위젯만 지연 로드한다.

```tsx
// ✅ 서버 골격 + 지연 위젯
export default function Page() {
  return (
    <>
      <HeroTitle /> {/* 서버 */}
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </>
  );
}
```

---

## 7. INP

INP(Interaction to Next Paint)는 클릭·탭·키 입력 후 다음 페인트까지의 지연이다. FID를 대체하는 상호작용 지표다.

### PERF-INP-01 — P0 상호작용 예산

**WHY**

화면이 빨리 떠도 버튼이 늦게 반응하면 사용자는 “고장”으로 느낀다.

**DETECT**

```ts
test('primary CTA INP', async ({ perfPage }) => {
  const { page, collect } = perfPage;
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const cta = page.getByRole('link', { name: /시작|무료|추천/ }).first();
  await cta.click();
  // interaction 관찰을 위해 짧게 대기
  await page.waitForTimeout(500);

  const m = await collect();
  console.log('INP candidate', m.inp);
  expect(m.inp ?? 0).toBeLessThanOrEqual(200);
});
```

Chrome Performance/Profiler에서 Long Task(>50ms)와 강제 리플로우를 함께 본다.

**임계값**

| 등급 | INP |
|------|-----|
| Good | ≤ 200ms |
| Needs Improvement | ≤ 500ms |
| Poor | > 500ms |

---

### PERF-INP-02 — Long Task 분해

**WHY**

INP 악화의 대부분은 이벤트 핸들러·렌더·레이아웃이 한 프레임에 몰린 것이다.

**DETECT**

```ts
await page.evaluate(() => {
  (window as any).__longTasks = [];
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      (window as any).__longTasks.push({
        start: e.startTime,
        duration: e.duration,
        name: e.name,
      });
    }
  }).observe({ type: 'longtask', buffered: true } as any);
});

// 상호작용 후
const longTasks = await page.evaluate(() => (window as any).__longTasks);
console.table(longTasks.filter((t: any) => t.duration > 50));
```

```bash
# 무거운 클라이언트 후보
rg -n "from 'lodash'|from \"date-fns\"|from 'moment'|three|chart\.js|recharts|xlsx|pdf" \
  app src --glob "*.{ts,tsx}"
rg -n "JSON\.parse\(|\.map\(|while \(" app/src --glob "*.tsx" | head
```

**FIX**

```tsx
// ❌ 클릭 시 동기 대량 계산
function onFilter(next: Filter) {
  setFilter(next);
  const ranked = expensiveRank(allItems, next); // 80ms+
  setItems(ranked);
}

// ✅ 입력은 즉시, 무거운 일은 transition/deferred
import { startTransition, useDeferredValue } from 'react';

function onFilter(next: Filter) {
  setFilter(next); // 즉시 UI 반영
  startTransition(() => {
    setItems(expensiveRank(allItems, next));
  });
}

// 또는
const deferredFilter = useDeferredValue(filter);
const items = useMemo(() => expensiveRank(allItems, deferredFilter), [allItems, deferredFilter]);
```

```ts
// ✅ 큰 작업을 조각내어 양보
async function processInChunks<T>(items: T[], work: (item: T) => void) {
  const CHUNK = 100;
  for (let i = 0; i < items.length; i += CHUNK) {
    for (const item of items.slice(i, i + CHUNK)) work(item);
    await new Promise(requestAnimationFrame);
  }
}
```

---

### PERF-INP-03 — 불필요한 리렌더가 클릭을 막는다

**DETECT**

React Profiler(또는 `@welldone-software/why-did-you-render` in lab)로 클릭 시 커밋 시간을 본다.

```bash
rg -n "createContext|useContext" app src --glob "*.{ts,tsx}" | head
rg -n "value=\{\{|" app src --glob "*.tsx" | head
```

```tsx
// ❌ 매 렌더 새 객체 — 컨텍스트 소비자 전부 리렌더
<ThemeContext.Provider value={{ theme, setTheme }}>

// ✅ 안정화된 값
const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
```

컨텍스트를 쪼개거나 selector 패턴을 쓴다. 모든 곳에 `memo`를 뿌리기 전에 **props 정체성**과 **state 위치**를 먼저 고친다.

---

### PERF-INP-04 — 하이드레이션 전 클릭

**WHY**

SSR HTML은 보여도 이벤트가 붙기 전 클릭은 무시되거나 늦게 처리된다. 사용자는 “두 번 눌러야 한다”고 느낀다.

**DETECT**

```ts
test('CTA responds soon after first paint', async ({ page }) => {
  await page.goto('/');
  // FCP 직후 즉시 클릭 시도
  await page.waitForFunction(() =>
    performance.getEntriesByName('first-contentful-paint').length > 0);
  const t0 = Date.now();
  await page.getByRole('link', { name: /시작/ }).click();
  await page.waitForURL(/auth|recommend|signup|catalog/);
  expect(Date.now() - t0).toBeLessThan(1000);
});
```

**FIX**

- Client 경계를 좁힌다.
- 위 접힌 progressive enhancement: 링크는 실제 `<a href>`로 동작하게 둔다.
- 큰 providers를 루트에 몰지 않는다.

---

### PERF-INP-05 — 제3자 스크립트와 메인스레드

**DETECT**

```bash
rg -n "next/script|gtag|GTM|intercom|hotjar|clarity|facebook|tiktok" \
  app src --glob "*.{tsx,ts}"
```

```tsx
// ❌ afterInteractive로 큰 채팅 위젯을 모든 페이지에
<Script src="https://chat.example.com/widget.js" strategy="afterInteractive" />

// ✅ 지연: 사용자 제스처 또는 idle
<Script src="https://chat.example.com/widget.js" strategy="lazyOnload" />
```

마케팅 픽셀이 INP를 깨면 제품 코드만 고쳐서는 안 된다. owner와 로드 전략을 Finding에 명시한다.

---

## 8. CLS

CLS(Cumulative Layout Shift)는 사용자 입력과 무관한 레이아웃 이동의 합이다.

### PERF-CLS-01 — P0 CLS 예산

**임계값**

| 등급 | CLS |
|------|-----|
| Good | ≤ 0.1 |
| Needs Improvement | ≤ 0.25 |
| Poor | > 0.25 |

```ts
test('P0 CLS', async ({ perfPage }) => {
  for (const path of ['/', '/catalog']) {
    await perfPage.page.goto(path, { waitUntil: 'networkidle' });
    await perfPage.page.waitForTimeout(3000);
    const m = await perfPage.collect();
    expect(m.cls, `${path} CLS ${m.cls}`).toBeLessThanOrEqual(0.1);
  }
});
```

---

### PERF-CLS-02 — Shift source 귀속

```ts
const sources = await page.evaluate(() => {
  const out: any[] = [];
  new PerformanceObserver(() => {}).observe({ type: 'layout-shift', buffered: true } as any);
  for (const e of performance.getEntriesByType('layout-shift') as any[]) {
    if (e.hadRecentInput) continue;
    out.push({
      value: e.value,
      sources: (e.sources ?? []).map((s: any) => ({
        tag: s.node?.tagName,
        className: s.node?.className,
        previousRect: s.previousRect,
        currentRect: s.currentRect,
      })),
    });
  }
  return out;
});
```

흔한 원인:

```text
- 이미지/영상/iframe 크기 미지정
- 웹폰트 swap으로 텍스트 폭 변화
- 쿠키 배너·상단 알림이 뒤늦게 삽입
- 스켈레톤과 실제 콘텐츠 높이 불일치
- 광고 슬롯
- 아이콘/배지 비동기 삽입
```

**FIX**

```tsx
// ❌ 크기 없는 이미지
<img src="/product.png" alt="" />

// ✅ width/height 또는 aspect-ratio
<Image src="/product.png" alt="" width={640} height={480} />
// 또는
<div className="aspect-[4/3] relative">
  <Image src="/product.png" alt="" fill sizes="(max-width:768px) 100vw, 640px" />
</div>
```

```tsx
// ❌ 배너가 나중에 끼어들며 본문을 밀어냄
{showBanner && <TopBanner />}

// ✅ 예약 공간 또는 overlay
<header className="min-h-12">
  {showBanner ? <TopBanner /> : null}
</header>
```

```css
/* 폰트 메트릭 조정으로 swap 이동 감소 */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: swap;
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
```

---

### PERF-CLS-03 — 스켈레톤 정합

스켈레톤이 실제보다 작으면 교체 순간 CLS가 발생한다.

```tsx
// ✅ 최종 레이아웃과 같은 박스
function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 h-[104px]">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}
```

**REGRESSION**

Suspense fallback과 실제 컴포넌트의 bounding height를 비교하는 Playwright 테스트를 둔다. 차이가 8px 이하여야 한다.

---

### PERF-CLS-04 — 동적 삽입과 쿠키 동의

```bash
rg -n "cookie|consent|banner|ToastProvider" app src --glob "*.tsx" | head
```

동의 배너는 `position: fixed`로 콘텐츠를 밀지 않게 하거나, 서버에서 쿠키를 읽어 첫 HTML에 자리를 반영한다. 클라이언트 mount 후 갑자기 삽입하지 않는다.

---

## 9. TTFB와 서버 응답

### PERF-TTFB-01 — HTML TTFB 예산

**WHY**

TTFB가 늦으면 LCP 하한이 함께 늦어진다. 프론트만 만져서는 못 고친다.

**DETECT**

```ts
test('TTFB', async ({ perfPage }) => {
  await perfPage.page.goto('/', { waitUntil: 'commit' });
  const m = await perfPage.collect();
  expect(m.ttfb ?? 9999).toBeLessThanOrEqual(800);
});
```

```bash
# 서버에서 무거운 작업이 페이지 렌더를 막는지
rg -n "await .*prisma|await .*fetch|await .*db" app --glob "**/page.tsx" | head
rg -n "export const dynamic|revalidate|fetchCache" app --glob "*.{ts,tsx}"
```

**FIX**

```tsx
// ❌ 페이지에서 직렬 waterfall
export default async function Page() {
  const user = await getUser();
  const projects = await getProjects(user.id);
  const usage = await getUsage(user.id);
  return <Dashboard user={user} projects={projects} usage={usage} />;
}

// ✅ 병렬
export default async function Page() {
  const user = await getUser();
  const [projects, usage] = await Promise.all([
    getProjects(user.id),
    getUsage(user.id),
  ]);
  return <Dashboard user={user} projects={projects} usage={usage} />;
}

// ✅ 더 나은 분리: 느린 조각은 Suspense
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects />
      </Suspense>
    </>
  );
}
```

```ts
// 캐시 가능한 서버 fetch
const data = await fetch(url, {
  next: { revalidate: 60, tags: ['catalog'] },
});
```

동적 강제(`force-dynamic`)가 습관적으로 켜져 있으면 TTFB가 매번 원점이다. 정말 사용자별이어야 하는 부분만 동적 경계로 쪼갠다.

---

### PERF-TTFB-02 — 리다이렉트 체인

**DETECT**

```ts
const responses: { url: string; status: number }[] = [];
page.on('response', r => {
  if (r.request().resourceType() === 'document') {
    responses.push({ url: r.url(), status: r.status() });
  }
});
await page.goto('https://example.com');
console.table(responses);
```

```text
http → https → www → locale → app
```

체인 1회를 넘는 문서 리다이렉트는 S2. 광고/공유 진입 URL이 특히 위험하다.

---

### PERF-TTFB-03 — Edge/CDN 캐시 적중

```bash
curl -sI https://example.com/ | rg -i "age|cf-cache|x-cache|cache-control|server-timing"
```

정적 마케팅 페이지가 매번 `MISS`면 CDN 설정 Finding이다. 개인화 HTML은 캐시하지 말고, shell은 캐시하고 개인 데이터는 클라이언트/스트리밍으로 분리하는 패턴을 검토한다.

---

## 10. 번들과 코드 분할

### PERF-BUNDLE-01 — 초기 JS 전송 예산

**WHY**

압축 전송 JS가 커질수록 파싱·컴파일·실행이 늘고 LCP/INP가 함께 악화된다.

**DETECT**

```bash
# Next bundle analyzer
ANALYZE=true pnpm --filter web build

# 또는 산출물 직접
find .next/static/chunks -name "*.js" | head
# transfer size는 Playwright/HAR에서 재는 편이 현실적이다
```

```ts
test('initial JS transfer budget', async ({ perfPage }) => {
  await perfPage.page.goto('/');
  await perfPage.page.waitForLoadState('networkidle');
  const m = await perfPage.collect();
  const kb = m.transferJS / 1024;
  console.log('JS transfer KB', kb);
  expect(kb).toBeLessThanOrEqual(180);
});
```

**PASS / FAIL**

- PASS: P0 라우트 초기 JS ≤ 예산.
- FAIL: +10% S2, +30% S1. 신규 대형 lib 도입이 원인이면 상향.

---

### PERF-BUNDLE-02 — 대형 의존성 유입

**DETECT**

```bash
rg -n "from 'lodash'|from \"lodash\"|import _ from" app src --glob "*.{ts,tsx}"
rg -n "from 'moment'|from \"moment\"" app src
rg -n "from 'xlsx'|pdfmake|exceljs|three|@react-three|monaco-editor|codemirror" app src
rg -n "import\\(.*\\)" app src --glob "*.{ts,tsx}" | head
```

```tsx
// ❌ 전체 lodash
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ 함수 단위 또는 네이티브/작은 유틸
import debounce from 'lodash/debounce';
// 또는
import { useDebouncedCallback } from 'use-debounce';
```

```tsx
// ❌ 첫 페이지에 에디터/차트 정적 import
import Editor from '@monaco-editor/react';
import { HeavyChart } from '@/components/heavy-chart';

// ✅ 라우트/상호작용 후 동적 import
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
```

```js
// next.config.js — barrel import 최적화
experimental: {
  optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-icons'],
}
```

---

### PERF-BUNDLE-03 — Client boundary 과다

**WHY**

`'use client'`가 트리 상단에 있으면 하위가 전부 클라이언트 번들로 끌려간다.

**DETECT**

```bash
rg -l "^['\"]use client['\"]" app src --glob "*.tsx" | wc -l
rg -n "^['\"]use client['\"]" app --glob "**/layout.tsx"
rg -n "^['\"]use client['\"]" app --glob "**/page.tsx"
```

**FIX**

```tsx
// ❌ 페이지 전체가 client
'use client';
export default function Page() {
  return (
    <div>
      <StaticMarketingCopy />
      <LikeButton />
    </div>
  );
}

// ✅ 잎만 client
export default function Page() {
  return (
    <div>
      <StaticMarketingCopy />
      <LikeButton /> {/* 이 파일만 use client */}
    </div>
  );
}
```

Provider도 쪼갠다. 테마/인증/토스트를 하나의 거대 Client Provider로 감싸지 않는다.

---

### PERF-BUNDLE-04 — 중복 모듈과 청크 진단

Analyzer에서 확인할 것:

```text
[ ] 같은 라이브러리가 여러 청크에 중복되는가?
[ ] polyfill이 modern 브라우저에도 들어가는가?
[ ] 서버 전용 코드가 클라이언트 청크에 섞이는가? (fs, path, sharp)
[ ] moment locale 전체, icon pack 전체가 들어오는가?
```

```ts
// 서버 전용 가드
import 'server-only';
```

---

### PERF-BUNDLE-05 — Route-based splitting 실효

```ts
// 카탈로그 방문 시 대시보드 전용 코드가 따라오는지 HAR로 확인
const js = [];
page.on('response', r => {
  if (r.url().includes('/_next/static/chunks/')) js.push(r.url());
});
await page.goto('/catalog');
console.log(js.filter(u => /dashboard|settings|admin/i.test(u)));
```

불필요한 청크가 오면 공유 layout의 정적 import를 의한다.

---

## 11. 이미지와 미디어

### PERF-IMG-01 — 포맷·해상도·sizes

**DETECT**

```bash
# 큰 원본이 public에 그대로
fd -e png -e jpg -e jpeg public | while read f; do
  size=$(wc -c < "$f")
  [ "$size" -gt 300000 ] && echo "$size $f"
done | sort -rn | head

rg -n "<img |<Image" app src --glob "*.tsx" | rg -v "sizes=|fill|width="
```

```tsx
// ❌ 4K PNG를 CSS로만 축소
<img src="/hero-4000.png" className="w-full" />

// ✅ next/image + 현대 포맷 + sizes
<Image
  src="/hero.png"
  alt=""
  width={1200}
  height={800}
  sizes="(max-width: 768px) 100vw, 50vw"
  quality={75}
/>
```

```js
// next.config images
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
}
```

**PASS / FAIL**

- PASS: above-the-fold 이미지 합계 ≤ 예산, LCP 이미지는 현대 포맷.
- FAIL: 뷰포트에 수 MB 이미지(S1), sizes 누락으로 과대 해상도(S2).

---

### PERF-IMG-02 — Lazy와 Priority의 경계

```text
LCP/히어로: priority + fetchPriority high
접힌 아래: loading lazy (next/image 기본)
캐러셀 다음 슬라이드: lazy, 단 첫 슬라이드는 eager
```

```bash
rg -n "priority" app src --glob "*.tsx"
# priority가 5개 이상이면 남용 검토
```

---

### PERF-IMG-03 — CLS 없는 미디어

이미지뿐 아니라 iframe(지도·비디오·임베드)도 크기 예약.

```tsx
<div className="aspect-video overflow-hidden rounded-lg">
  <iframe
    title="제품 데모"
    src="https://www.youtube-nocookie.com/embed/..."
    className="h-full w-full"
    loading="lazy"
    allowFullScreen
  />
</div>
```

---

### PERF-IMG-04 — 배경 이미지 남용

CSS 배경으로 큰 히어로를 넣으면 priority/preload 제어가 어렵다. 의미 있는 이미지는 `<Image>`로 두고 장식만 CSS로 처리한다.

```bash
rg -n "background-image:|bg-\\[url" app src --glob "*.{css,tsx}" | head
```

---

### PERF-IMG-05 — 애니메이션·3D·비디오 비용

GLB/비디오는 JS·GPU·대역폭을 동시에 쓴다.

```bash
fd -e glb -e mp4 -e webm public apps
rg -n "react-three|@react-three/fiber|Spline|lottie" package.json app src
```

```tsx
// ✅ 뷰포트 진입 전엔 로드하지 않음 + reduced motion 대체
const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false });

export function HeroVisual() {
  const reduce = usePrefersReducedMotion();
  if (reduce) return <Image src="/hero-fallback.webp" alt="" priority width={1200} height={800} />;
  return (
    <Suspense fallback={<Image src="/hero-fallback.webp" alt="" priority width={1200} height={800} />}>
      <HeroScene />
    </Suspense>
  );
}
```

모바일 Lab에서 GPU/CPU throttle을 켠 채 FPS와 INP를 본다. 장식 3D가 LCP/INP를 깨면 fallback이 기본값이 되어야 한다.

---

## 12. 폰트

### PERF-FONT-01 — 폰트 파일 예산과 subset

**DETECT**

```bash
fd -e woff2 -e woff -e ttf public apps | while read f; do wc -c "$f"; done | sort -rn

rg -n "next/font|@font-face|Google.*font" app src --glob "*.{ts,tsx,css}"
```

```ts
import { Inter } from 'next/font/google';

export const sans = Inter({
  subsets: ['latin'], // 필요한 subset만
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  adjustFontFallback: true,
});
```

한글 서비스에서 Noto Sans KR 전체를 넣으면 수 MB가 된다. 가변 폰트·subset·unicode-range를 검토한다.

**PASS / FAIL**

- PASS: critical 폰트 합계 ≤ 예산(예: 100KB woff2).
- FAIL: 다중 weight 전부 preload(S2), FOUT/FOIT로 CLS/LCP 악화(S2).

---

### PERF-FONT-02 — font-display와 fallback 메트릭

```css
@font-face {
  font-family: "Pretendard";
  src: url("/fonts/pretendard-subset.woff2") format("woff2");
  font-display: swap; /* 또는 optional for non-critical */
  unicode-range: U+AC00-D7A3, U+0020-007E;
}
```

`font-display: optional`은 재방문 성능에 유리하지만 첫 방문에서 커스텀 폰트가 안 보일 수 있다. 브랜드 임계 텍스트만 swap+preload, 나머지는 optional도 선택지다.

---

### PERF-FONT-03 — 아이콘 폰트 금지에 가깝게

아이콘 폰트는 렌더 지연·접근성·트리 쉐이킹 실패가 잦다. SVG 아이콘을 쓰고 필요한 아이콘만 번들한다 (`optimizePackageImports: ['lucide-react']`).

```bash
rg -n "fontawesome|material-icons|glyphicon" package.json app src
```

---

## 13. 네트워크와 캐시

### PERF-NET-01 — 요청 폭포(Waterfall)

**WHY**

연쇄 `await fetch`는 대역폭이 남아도 체감이 느리다.

**DETECT**

Playwright trace 또는 DevTools Network waterfall에서 문서 → API1 → API2 → API3 사슬을 찾는다.

```tsx
// ❌ 클라이언트 waterfall
useEffect(() => {
  void (async () => {
    const user = await api.user();
    const orgs = await api.orgs(user.id);
    const projects = await api.projects(orgs[0].id);
    setProjects(projects);
  })();
}, []);

// ✅ 서버에서 병렬 + 필요한 최소 데이터
const orgs = await getOrgs();
const projects = await getProjects(orgs[0]?.id);
```

```ts
// 클라이언트가 필요하면 Promise.all
const [a, b] = await Promise.all([api.a(), api.b()]);
```

---

### PERF-NET-02 — 중복 요청

**DETECT**

```ts
const counts = new Map<string, number>();
page.on('request', req => {
  if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
    const u = req.url();
    counts.set(u, (counts.get(u) ?? 0) + 1);
  }
});
await page.goto('/dashboard');
await page.waitForTimeout(2000);
console.table([...counts.entries()].filter(([, n]) => n > 1));
```

```bash
rg -n "useEffect\(|fetch\(|axios" app src --glob "*.tsx" | head
# React Strict Mode double-fetch vs 실제 중복 로직 구분
```

**FIX**

- RSC/loader에서 한 번 fetch하고 props로 전달
- SWR/React Query dedupe
- `React.cache`로 서버 요청 중복 제거

```ts
import { cache } from 'react';
export const getUser = cache(async () => { ... });
```

---

### PERF-NET-03 — Cache-Control과 immutable 자산

```bash
curl -sI https://example.com/_next/static/chunks/main.js | rg -i "cache-control|etag|age"
curl -sI https://example.com/brand/logo.svg | rg -i "cache-control"
```

기대:

```text
/_next/static/*  → public, max-age=31536000, immutable
이미지/폰트 해시 파일 → 장기 캐시
HTML 문서 → 짧은 캐시 또는 private (개인화 정도에 따라)
API 개인 데이터 → private, no-store 또는 짧은 max-age
```

```ts
// next.config headers 예
{
  source: '/brand/:path*',
  headers: [
    { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
  ],
}
```

---

### PERF-NET-04 — HTTP/2·연결 수·도메인 분산

너무 많은 제3자 도메인은 DNS/TLS 비용을 늘다.

```ts
const origins = new Set();
page.on('request', r => origins.add(new URL(r.url()).origin));
await page.goto('/');
console.log([...origins]);
expect(origins.size).toBeLessThanOrEqual(12);
```

자체 자산을 여러 CDN 도메인으로 쪼개는 구시대 최적화는 HTTP/2/3에서는 이득이 적다.

---

### PERF-NET-05 — Prefetch/Preconnect 전략

```tsx
// ✅ 다음 확률이 높은 전환만
<link rel="preconnect" href="https://cdn.example.com" crossOrigin="" />
<link rel="dns-prefetch" href="https://analytics.example.com" />

// next/link는 뷰포트 링크를 자동 prefetch — 과도한 목록은 prefetch={false}
<Link href={`/items/${id}`} prefetch={false}>{title}</Link>
```

```bash
rg -n "rel=\"preconnect\"|rel=\"prefetch\"|rel=\"preload\"" app src
```

무분별한 prefetch는 대역폭을 훔쳐 LCP를 악화시킨다.

---

## 14. React 렌더 성능

### PERF-REACT-01 — 불필요한 리렌더

**WHY**

상태 한 칸이 큰 트리를 다시 그리면 INP와 스크롤 프레임이 깨진다.

**DETECT**

1. React DevTools Profiler에서 상호작용 기록
2. “왜 렌더됐는지” 하이라이트
3. 커밋 duration > 16ms(60fps) / > 50ms 주의

```bash
# 인라인 객체/함수 props 패턴
rg -n "onClick=\{\(\) =>|style=\{\{|value=\{\{" app src --glob "*.tsx" | head -40
```

**FIX 순서 (메모보다 구조)**

```text
1. state를 실제로 필요한 잎으로 내린다
2. 컨텍스트를 쪼갠다 (상태 vs 디스패치)
3. 목록은 항목 컴포넌트로 분리하고 key를 안정화한다
4. 그 다음 memo/useCallback/useMemo
```

```tsx
// ❌ 부모 타이핑이 리스트 전체를 리렌더
function Page() {
  const [q, setQ] = useState('');
  return (
    <>
      <input value={q} onChange={e => setQ(e.target.value)} />
      <ExpensiveList items={items} />
    </>
  );
}

// ✅ 검색 입력과 리스트 경계 분리 + deferred
function Page() {
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q);
  return (
    <>
      <SearchBox value={q} onChange={setQ} />
      <ExpensiveList query={deferredQ} items={items} />
    </>
  );
}
```

React Compiler를 쓰는 프로젝트는 수동 memo 남발을 피하고, 컴파일러가 놓치는 불안정 props만 고친다.

---

### PERF-REACT-02 — 큰 리스트와 가상화

```bash
rg -n "\.map\(" app/src --glob "*.tsx" | rg -i "row|item|result" | head
rg -n "virtua|react-window|react-virtual|@tanstack/react-virtual" package.json app src
```

```tsx
// 수백 행 이상 테이블/피드
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ rows }: { rows: Row[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(v => (
          <div
            key={v.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${v.start}px)`,
              height: v.size,
              width: '100%',
            }}
          >
            <RowView row={rows[v.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

가상화 전에 “정말 그 많은 DOM이 필요한가?”, “페이지네이션/무한스크롤로 충분한가?”를 묻는다.

---

### PERF-REACT-03 — 파생 상태와 고비용 계산

```tsx
// ❌ state에 파생값을 중복 저장 → 동기화 버그와 추가 렌더
const [items, setItems] = useState(raw);
const [filtered, setFiltered] = useState(raw);
useEffect(() => setFiltered(items.filter(...)), [items, q]);

// ✅ 렌더 중 파생 (또는 useMemo)
const filtered = useMemo(() => items.filter(i => i.name.includes(q)), [items, q]);
```

`useMemo`는 계산이 실제로 비쌀 때만. 의존성이 매 렌더 바뀌면 의미가 없다.

---

### PERF-REACT-04 — Effect 폭주

```bash
rg -n "useEffect\(" app src --glob "*.tsx" | wc -l
rg -n "useEffect\([\s\S]*?fetch" app src --glob "*.tsx" -U | head
```

```tsx
// ❌ mount마다 구독/타이머를 쌓음
useEffect(() => {
  const id = setInterval(poll, 1000);
  // cleanup 없음
}, []);

// ✅
useEffect(() => {
  const id = setInterval(poll, 1000);
  return () => clearInterval(id);
}, []);
```

데이터 로딩 Effect는 Server Component/loader로 옮길 수 있는지 먼저 검토한다.

---

## 15. 하이드레이션과 상호작용 준비

### PERF-HYD-01 — Hydration 비용

**WHY**

SSR HTML을 클라이언트가 다시 방문·이벤트 결합하는 비용이 크면 TTI/INP가 늦다.

**DETECT**

Performance 패널에서 “Hydration” 또는 큰 `commit` 구간을 찾는다. 또는:

```js
// React 19 / experimental timing marks — 환경에 따라 다름
performance.getEntriesByType('measure').filter(e => /hydraul|hydrate/i.test(e.name))
```

정적 탐지:

```bash
rg -n "suppressHydrationWarning|Date\.now\(\)|Math\.random\(\)|window\." \
  app src --glob "*.tsx" | head
```

서버/클라이언트 마크업 불일치는 hydration 실패 후 전체 재렌더로 비용이 폭증한다.

**FIX**

```tsx
// ❌ 서버와 클라이언트가 다른 텍스트
<span>{new Date().toLocaleString()}</span>

// ✅ 서버는 locale string을 props로, 또는 mount 후 갱신
<span suppressHydrationWarning>{formattedFromServer}</span>
// 또는
const [now, setNow] = useState<string | null>(null);
useEffect(() => setNow(new Date().toLocaleString()), []);
```

---

### PERF-HYD-02 — Selective hydration과 우선순위

큰 페이지를 하나의 Client root로 만들지 말고, 상호작용이 필요한 섬으로 나눈다. 사용자가 먼저 누르는 CTA 근처 섬이 먼저 hydrate 되도록 경계를 설계한다.

```tsx
export default function ProductPage() {
  return (
    <>
      <ProductHeader /> {/* RSC */}
      <Suspense fallback={<BuyBoxSkeleton />}>
        <BuyBox /> {/* 상호작용 섬 */}
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />
      </Suspense>
    </>
  );
}
```

---

### PERF-HYD-03 — 하이드레이션 mismatch 회귀

```ts
test('no hydration errors on P0', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (/hydrat/i.test(msg.text())) errors.push(msg.text());
  });
  for (const path of ['/', '/catalog', '/recommend']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(errors.filter(e => /hydrat/i.test(e))).toEqual([]);
});
```

---

## 16. Suspense · Streaming · RSC

### PERF-RSC-01 — Waterfall 없는 서버 트리

```tsx
// ❌ 부모 await가 자식을 막음
async function Parent() {
  const data = await getParent();
  return <Child parentId={data.id} />; // Child 내부 await가 직렬화
}

// ✅ 자식이 자체 fetch + Suspense
function Parent() {
  return (
    <Suspense fallback={<ChildSkeleton />}>
      <Child />
    </Suspense>
  );
}
```

같은 요청을 부모·자식이 중복하면 `React.cache`로 합친다.

---

### PERF-RSC-02 — Streaming이 체감을 돕는가

스트리밍은 TTFB를 줄이고 shell을 빨리 보여준다. 그러나 fallback이 빈 화면이면 이득이 없다.

```tsx
// ✅ shell 즉시 + 느린 패널 스트리밍
export default function Dashboard() {
  return (
    <main>
      <h1>대시보드</h1>
      <Suspense fallback={<PanelSkeleton />}>
        <SlowPanel />
      </Suspense>
    </main>
  );
}
```

`loading.tsx`가 전 페이지 스피너만 있으면 세그먼트 Suspense보다 거칠다. 라우트 세그먼트별로 의미 있는 fallback을 둔다.

---

### PERF-RSC-03 — 서버에서 클라이언트로의 직렬화 비용

RSC payload가 비대하면 네트워크와 파싱이 늘어난다.

```bash
# 과도한 props 전달 후보
rg -n "<[A-Z].*data=\{|initialData=|rows=\{" app --glob "*.tsx" | head
```

큰 테이블 원본을 Client 컴포넌트에 props로 통째이 넘기지 말고, 서버에서 필요한 열만 추리거나 페이지네이션한다.

---

### PERF-RSC-04 — Dynamic rendering 남용

```bash
rg -n "force-dynamic|force-no-store|revalidate\s*=\s*0|cache:\s*'no-store'" app --glob "*.{ts,tsx}"
```

정적/ISR로 충분한 페이지를 매 요청 렌더하면 TTFB와 서버 비용이 함께 오른다. 개인화 조각을 분리한다.

---

## 17. 메모리와 장수명 세션

### PERF-MEM-01 — 이탈 없는 리스너·옵저버

**DETECT**

```bash
rg -n "addEventListener|setInterval|setTimeout|MutationObserver|IntersectionObserver|ResizeObserver" \
  app src --glob "*.tsx" | head -50
```

```tsx
useEffect(() => {
  const onResize = () => { ... };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```

---

### PERF-MEM-02 — SPA 장기 세션 누수

대시보드를 열어둔 채 1시간 순회하는 시나리오:

```ts
test('memory does not grow unbounded', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await page.goto('/dashboard');

  const samples: number[] = [];
  for (let i = 0; i < 20; i++) {
    await page.getByRole('link', { name: '리포트' }).click();
    await page.getByRole('link', { name: '대시보드' }).click();
    const mem = await client.send('Runtime.getHeapUsage');
    samples.push(mem.usedSize);
  }
  console.log(samples.map(s => Math.round(s / 1e6) + 'MB'));
  const growth = samples.at(-1)! / samples[0]!;
  expect(growth).toBeLessThan(2.5); // 휴리스틱 — 앱에 맞게 조정
});
```

주의: headless 메모리 수치는 휴리스틱이다. 급격한 단조 증가와 Detached HTMLElement를 프로파일로 확인한다.

---

### PERF-MEM-03 — 전역 캐시 비대화

```bash
rg -n "Map\(|new Map|cache\.set|localStorage.setItem" app src --glob "*.{ts,tsx}" | head
```

무한 성장 Map에 응답을 쌓지 않는다. LRU/TTL 또는 React Query `gcTime`을 설정한다.

---

### PERF-MEM-04 — 미디어/WebGL 해제

```tsx
useEffect(() => {
  const renderer = new THREE.WebGLRenderer();
  return () => {
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };
}, []);
```

라우트 이동 시 캔버스·AudioContext·ObjectURL을 해제하지 않으면 모바일에서 탭이 죽는다.

```ts
const url = URL.createObjectURL(blob);
// ...
URL.revokeObjectURL(url);
```

---

## 18. 서버 · API · 데이터 페칭

### PERF-API-01 — Overfetch와 payload 크기

```ts
const sizes: { url: string; kb: number }[] = [];
page.on('response', async res => {
  if (!/\/api\//.test(res.url())) return;
  const buf = await res.body().catch(() => null);
  if (buf) sizes.push({ url: res.url(), kb: Math.round(buf.length / 1024) });
});
await page.goto('/dashboard');
console.table(sizes.sort((a, b) => b.kb - a.kb).slice(0, 10));
```

```text
[ ] 목록 API가 상세 필드를 전부 내려주는가?
[ ] N+1 요청이 있는가?
[ ] 페이지네이션 cursor/limit이 있는가?
[ ] gzip/br 압축이 적용되는가?
```

---

### PERF-API-02 — 서버 타이밍과 슬로우 쿼리

```bash
rg -n "Server-Timing|serverTiming" app src
# DB 쿼리 로그/APM — 프로젝트 도구에 바인딩
```

Finding에 `SELECT` 시간, 행 수, 인덱스를 적을 수 없으면 백엔드 협업으로 BLOCKED 처리하고 프론트 추정 최적화를 남발하지 않는다.

---

### PERF-API-03 — 낙관적 UI와 재검증 비용

```tsx
// 잦은 router.refresh()는 RSC 재fetch 폭주
await update();
router.refresh(); // 정말 전체 갱신이 필요할 때만
```

`revalidateTag` 범위를 최소로, 낙관적 업데이트로 체감을 먼저 맞춘다.

---

### PERF-API-04 — BFF/Route Handler 타임아웃

```bash
rg -n "export async function GET|POST" app/api --glob "*.ts" | head
rg -n "maxDuration|runtime\s*=\s*'edge'" app --glob "*.{ts,tsx}"
```

느린 외부 API를 요청 경로에 동기 연결하지 말고, 캐시·백그라운드 잡·부분 응답을 검토한다.

---

## 19. 모바일·저사양 성능

### PERF-MOB-01 — Slow 4G + 6x CPU Lab

```ts
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
});
await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });
```

데스크톱 Good가 모바일 Poor면 모바일 Finding을 별도로 올린다. 주 트래픽이 모바일이면 Severity 상향.

---

### PERF-MOB-02 — JS 예산 더 엄격

모바일은 파싱이 느리다. Binding의 `js_kb_transfer_p0_mobile`을 별도로 강제한다.

---

### PERF-MOB-03 — 배터리·레이어 폭주

```bash
rg -n "backdrop-blur|filter:|box-shadow|animate-|requestAnimationFrame" \
  app src --glob "*.{tsx,css}" | head
```

상시 `requestAnimationFrame` 루프, 큰 blur, 무한 애니메이션은 저사양에서 발열과 INP를 만든다. `prefers-reduced-motion`과 뷰포트 밖 pause를 적용한다.

---

## 20. RUM과 필드 데이터

### PERF-RUM-01 — web-vitals 수집

```ts
// app/instrumentation-client.ts 또는 provider
import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

function send(metric: { name: string; value: number; id: string; rating: string }) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    path: location.pathname,
    device: navigator.userAgent,
  });
  if (navigator.sendBeacon) navigator.sendBeacon('/api/rum', body);
  else void fetch('/api/rum', { method: 'POST', body, keepalive: true });
}

onLCP(send);
onINP(send);
onCLS(send);
onTTFB(send);
```

PII를 넣지 않는다. path는 정규화(`/reports/[id]` → `/reports/:id`).

---

### PERF-RUM-02 — Lab vs Field 괴리

```markdown
| 지표 | Lab p50 | Field p75 | 괴리 | 해석 |
|------|---------|-----------|------|------|
| LCP | 1.8s | 3.6s | 큼 | 저사양·지역 CDN·이미지 협상 |
| INP | 120ms | 280ms | 중간 | 제3자·확장 프로그램 |
| CLS | 0.03 | 0.12 | 중간 | 쿠키 배너·폰트 |
```

Field가 나쁘고 Lab이 좋으면 스로틀·실기기·제3자·지역을 재현한다. Field가 좋고 Lab만 나쁘면 Lab 환경이 과도하거나 캐시/CDN이 필드에서 도움이 되는 경우다.

---

### PERF-RUM-03 — 세그먼트

반드시 쪼개서 본다.

```text
- device: mobile / desktop
- country / CDN POP
- connection: 4g / 3g
- new vs returning
- route group
- A/B cohort
```

전체 p75만 보면 모바일 Poor가 데스크톱에 가려진다.

---

### PERF-RUM-04 — NO_DATA 처리

RUM이 없으면:

```markdown
NO_DATA: Field CWV
권장: web-vitals + /api/rum 또는 Vercel Analytics / GA4 이벤트
이번 감사는 Lab(프로덕션 빌드, 스로틀)으로 판정하며 한계를 인정한다.
```

---

## 21. 예산과 회귀 탐지

### PERF-BUDGET-01 — baseline 파일

```json
{
  "capturedAt": "2026-07-30",
  "commit": "abc123",
  "env": "lab_mobile_slow4g_cpu6",
  "routes": {
    "/": { "lcp_ms": 2100, "cls": 0.04, "ttfb_ms": 420, "js_kb": 160 },
    "/catalog": { "lcp_ms": 2300, "cls": 0.06, "ttfb_ms": 500, "js_kb": 175 }
  }
}
```

```ts
const baseline = JSON.parse(readFileSync('perf-baseline.json', 'utf8'));
const current = await measureAll();

for (const [route, b] of Object.entries(baseline.routes)) {
  const c = current[route];
  if (c.lcp_ms > b.lcp_ms * 1.1) throw new Error(`${route} LCP regression`);
  if (c.js_kb > b.js_kb * 1.1) throw new Error(`${route} JS regression`);
  if (c.cls > Math.max(0.1, b.cls * 1.2)) throw new Error(`${route} CLS regression`);
}
```

예산 **절대 상한**과 baseline **상대 회귀**를 동시에 본다.

---

### PERF-BUDGET-02 — 예외와 만료

```yaml
- route: /experiments/hero-video
  metric: lcp_ms
  until: 2026-09-01
  reason: Brand campaign video hero
  owner: growth
  followUp: PERF-221
```

만료된 예외는 CI 실패다. 예외를 baseline에 흡수해 조용히 올리지 않는다.

---

### PERF-BUDGET-03 — PR 성능 봇

```text
PR 코멘트에 포함할 것:
- 변경 라우트의 LCP/INP/CLS/JS KB delta
- bundle analyzer 상위 증가 모듈
- 예산 초과 여부
- 재현 명령
```

성능 수치가 없는 UI PR도 P0 라우트 스모크는 돌린다.

---

## 22. Playwright · Lighthouse 자동화

### PERF-AUTO-01 — 전용 Playwright project

```ts
// playwright.config.ts (발췌)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'performance',
      testDir: './tests/performance',
      retries: 0, // 성능 테스트는 재시도가 평균을 왜곡할 수 있음 — 중앙값 루프로 대체
      timeout: 120_000,
      use: {
        baseURL: process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000',
        ...devices['Desktop Chrome'],
        trace: 'on',
      },
    },
    {
      name: 'performance-mobile',
      testDir: './tests/performance',
      use: {
        baseURL: process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000',
        ...devices['Pixel 7'],
        trace: 'on',
      },
    },
  ],
  webServer: {
    command: 'pnpm --filter web start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

**반드시 프로덕션 서버**를 `webServer`로 띄운다. `next dev`를 연결하면 FAIL이 아니라 측정 무효다.

---

### PERF-AUTO-02 — Lighthouse CI

```bash
pnpm dlx @lhci/cli autorun --config=lighthouserc.json
```

```json
{
  "ci": {
    "collect": {
      "url": ["http://127.0.0.1:3000/", "http://127.0.0.1:3000/catalog"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "onlyCategories": ["performance"]
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-byte-weight": ["warn", { "maxNumericValue": 2000000 }],
        "interactive": ["warn", { "maxNumericValue": 3500 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

Lighthouse 점수만 보지 말고 **audit 항목**(render-blocking, unused-javascript, uses-responsive-images, font-display)을 Finding 단서로 쓴다. INP는 Lighthouse lab에서 약하므로 Playwright 상호작용 측정을 병행한다.

---

### PERF-AUTO-03 — 번들 통계 CI

```js
// scripts/check-bundle-budget.mjs
import { readFileSync } from 'node:fs';

const stats = JSON.parse(readFileSync('.next/analyze/client.json', 'utf8'));
// 프로젝트 analyzer 산출물 형식에 맞게 파싱
const totalKb = sumInitialJs(stats) / 1024;
const budget = Number(process.env.JS_BUDGET_KB ?? 180);

if (totalKb > budget) {
  console.error(`Initial JS ${totalKb.toFixed(1)}KB > budget ${budget}KB`);
  process.exit(1);
}
```

First Load JS가 Next 빌드 출력에 있으면 라우트별로 파싱해 회귀를 본다.

```bash
pnpm --filter web build | tee /tmp/next-build.txt
rg "First Load JS|Route \\(app\\)" /tmp/next-build.txt
```

---

### PERF-AUTO-04 — CWV attribution 리포트 생성

```ts
// tests/performance/report.spec.ts
test('write perf report', async ({ perfPage }, testInfo) => {
  const routes = ['/', '/catalog', '/recommend'];
  const report = [];

  for (const path of routes) {
    await perfPage.page.goto(path, { waitUntil: 'networkidle' });
    await perfPage.page.waitForTimeout(2000);
    const metrics = await perfPage.collect();
    const lcp = await perfPage.page.evaluate(() => {
      const e = performance.getEntriesByType('largest-contentful-paint').at(-1) as any;
      return e ? { time: e.startTime, url: e.url, tag: e.element?.tagName } : null;
    });
    report.push({ path, metrics, lcp });
  }

  await testInfo.attach('perf-report', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
});
```

---

### PERF-AUTO-05 — 성능 테스트 안정성

```text
[ ] 안티바이러스/동시 빌드가 CPU를 훔치지 않는 CI러너 사용
[ ] 브라우저 캐시 정책 cold/warm을 명시
[ ] 애니메이션·시계를 고정
[ ] 실험 플래그/배너를 측정 중 비활성
[ ] 3~5회 중앙값
[ ] 실패 시 trace/HAR 업로드
[ ] flaky하다고 threshold를 느슨하게 만들지 말 것 — 분산 원인을 고친다
```

```ts
await page.addStyleTag({
  content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
});
```

CLS/LCP 측정 중에 애니메이션을 끄면 실제와 달라질 수 있다. **레이아웃 안정성 측정**과 **모션 포함 체감 측정**을 분리한다.

---

## 23. Regression 절차

### Gate 1 — 빌드와 분석 산출물

```bash
pnpm --filter web build
ANALYZE=true pnpm --filter web build
```

```text
PASS  빌드 성공, analyzer 산출물 존재
FAIL  빌드 실패 또는 서버 전용 모듈이 클라이언트에 포함
BLOCKED 의존성 설치/인증 문제로 빌드 불가
```

### Gate 2 — 번들 예산

```bash
node scripts/check-bundle-budget.mjs
node scripts/compare-next-first-load.mjs --baseline perf-baseline.json
```

```text
[ ] P0 First Load JS ≤ 예산
[ ] baseline 대비 +10% 이상이면 FAIL
[ ] 신규 대형 의존성 유입 목록 첨부
```

### Gate 3 — Lab CWV (Desktop)

```bash
PERF_BASE_URL=http://127.0.0.1:3000 pnpm playwright test --project=performance
```

```text
[ ] LCP ≤ 2.5s (P0)
[ ] CLS ≤ 0.1
[ ] TTFB ≤ 예산
[ ] 중앙값 3회
```

### Gate 4 — Lab CWV (Mobile throttled)

```bash
pnpm playwright test --project=performance-mobile
```

```text
[ ] Slow 4G + CPU 6x
[ ] 모바일 JS 예산
[ ] LCP/INP/CLS
```

### Gate 5 — 상호작용 INP

```bash
pnpm playwright test tests/performance/inp.spec.ts
```

```text
[ ] P0 CTA 클릭/키 입력
[ ] Long Task 목록 첨부
[ ] INP ≤ 200ms 목표 (Poor면 FAIL)
```

### Gate 6 — 이미지·폰트·제3자

```bash
node scripts/audit-media-weight.mjs
node scripts/audit-third-party.mjs
```

```text
[ ] above-fold 이미지 합계
[ ] font KB
[ ] third-party origin 수 / 메인스레드 blocking
```

### Gate 7 — 정적 안티패턴

```bash
rg -n "ssr:\\s*false" app src --glob "*.{ts,tsx}"
rg -n "from 'lodash'|from \"moment\"" app src --glob "*.{ts,tsx}"
rg -n "^['\"]use client['\"]" app --glob "**/page.tsx"
rg -n "force-dynamic|cache:\\s*'no-store'" app --glob "*.{ts,tsx}"
```

허용 목록 밖 증가분은 FAIL.

### Gate 8 — Hydration·콘솔

```bash
pnpm playwright test tests/performance/hydration.spec.ts
```

### Gate 9 — Lighthouse CI (선택)

```bash
pnpm dlx @lhci/cli autorun
```

### Gate 10 — Field 대조 (가능 시)

```text
PASS   CrUX/RUM p75가 Lab 판정과 모순되지 않음
NO_DATA RUM 없음 — 리포트에 명시
FAIL    Field Poor인데 Lab만 보고 배포 강행하려 함
```

### Gate 11 — 최종 판정

```text
PASS     Gate 필수 항목 통과, 예산 회귀 없음
FAIL     CWV/번들/INP 중 하나 실패
BLOCKED  프로덕션 서버/필드 도구 부재로 일부 미실행 — 실행분과 미실행분을 분리 보고
```

QA-only 요청이면 여기서 보고하고 중단한다.

---

## 24. Final Report

### 24.1 리포트 형식

````markdown
# Performance QA Report

**대상:** `<app>@<commit>` · 프로덕션 빌드
**일시:** YYYY-MM-DD
**환경:** Desktop 1440 CPU×4 / Mobile Pixel7 Slow4G CPU×6 · cold cache
**Field:** NO_DATA | CrUX/RUM 요약

## 1. 결론

**최종 판정: FAIL**

P0 `/` 모바일 LCP p50 3.8s (예산 2.5s). LCP 요소는 `#hero-image`이며 priority 미설정 + 1800KB PNG가 원인이다.
Desktop은 예산 내이나 주 트래픽이 모바일이므로 배포 전 수정이 필요하다.

## 2. Gate 결과

| Gate | 판정 | 핵심 |
|------|------|------|
| Build/Analyze | PASS | |
| Bundle budget | FAIL | `/` First Load JS 210KB (예산 180) |
| CWV Desktop | PASS | LCP 1.9s · CLS 0.03 |
| CWV Mobile | FAIL | LCP 3.8s · INP 260ms |
| INP interactions | FAIL | CTA click longtask 180ms |
| Media/3P | FAIL | hero PNG 1.8MB |
| Static antipatterns | WARN | page-level use client 2 |
| Hydration | PASS | |
| Lighthouse | WARN | perf score 0.78 mobile |
| Field | NO_DATA | |

## 3. Finding

### PERF-F001 — 모바일 히어로 LCP 3.8s · S1

**환경:** Pixel 7 · Slow 4G · CPU×6 · cold · `/`

**관찰**
중앙값 LCP 3800ms (n=5). LCP 요소 `img#hero-image`, 리소스 `/brand/hero.png` 1.8MB.

**증거**
- `tmp/qa/performance/2026-07-30/PERF-F001-lcp.json`
- `tmp/qa/performance/2026-07-30/PERF-F001-network.har`
- screenshot of LCP element highlight

**원인 분해**
- Discovery: HTML에 존재 (양호)
- Download: 1.8MB PNG, AVIF/WebP 미협상
- Priority: `loading` 기본, `priority` 없음 → 경쟁
- Render delay: 폰트와 메인스레드 경합

**개선 원칙**
1. AVIF/WebP + 적절한 `sizes`
2. `priority` / `fetchPriority="high"`
3. 필요 시 `preload`
4. 3D/장식 레이어는 LCP 이후 로드

**예상 효과:** LCP 1.5~2.0s대 (재측정으로 확인)
**Regression:** `tests/performance/lcp.spec.ts`, 이미지 용량 audit

### PERF-F002 — 카탈로그 초기 JS 예산 초과 · S2

(동일 형식)

## 4. 지표 요약

| Route | LCP D | LCP M | CLS | TTFB | JS KB | INP |
|-------|-------|-------|-----|------|-------|-----|
| / | 1.9s | **3.8s** | 0.03 | 0.4s | **210** | **260** |
| /catalog | 2.1s | 2.7s | 0.06 | 0.5s | 175 | 180 |

## 5. 잘 되어 있는 점

- `/catalog` 이미지가 `next/image` + sizes 준수
- API waterfall이 서버 `Promise.all`로 정리됨
- font subset + `adjustFontFallback` 적용

## 6. 우선순위

1. PERF-F001 히어로 이미지 (배포 전)
2. PERF-F003 CTA long task 분리
3. PERF-F002 번들 분리 (이번 스프린트)

## 7. 한계

- Field RUM 없음 (NO_DATA)
- WebKit INP 계측 제한 — Chromium lab 기준
- 실기기 배터리 테스트 미실시

## 8. 재현

```bash
pnpm --filter web build && pnpm --filter web start
PERF_BASE_URL=http://127.0.0.1:3000 pnpm playwright test --project=performance-mobile
```
````

### 24.2 Finding 필수 필드

```text
ID / Severity
환경 (device, throttle, cache, route)
관찰 수치 (중앙값, n)
귀속 (요소/요청/모듈/핸들러)
원인 분해
개선 원칙 (추측성 팁 나열 금지)
재측정 방법
Owner
```

### 24.3 보고 원칙

- 결론과 배포 가능 여부를 먼저 쓴다.
- Lab과 Field를 섞어 쓰지 않는다.
- “최적화하면 좋을 것 같은 목록”이 아니라 **예산을 깨는 원인**을 적는다.
- 수정 전후 수치 없이 완료라고 쓰지 않는다.
- 리포트 파일을 저장소에 커밋하지 않는다. 증거는 `tmp/qa/performance/`에 둔다.

---

## 부록 A — 측정 스크립트

### A.1 빠른 정적 스캔

```bash
#!/usr/bin/env bash
set -uo pipefail

echo "=== PERF 1. page-level use client ==="
rg -n "^['\"]use client['\"]" app frontend/src --glob "**/page.tsx" || true

echo "=== PERF 2. ssr:false ==="
rg -n "ssr:\\s*false" app frontend/src --glob "*.{ts,tsx}" || true

echo "=== PERF 3. heavy libs ==="
rg -n "from 'lodash'|from \"moment\"|xlsx|monaco-editor|three|@react-three" \
  app frontend/src --glob "*.{ts,tsx}" || true

echo "=== PERF 4. force-dynamic / no-store ==="
rg -n "force-dynamic|revalidate\\s*=\\s*0|cache:\\s*'no-store'" \
  app frontend/src --glob "*.{ts,tsx}" || true

echo "=== PERF 5. images without sizes/priority review ==="
rg -n "<Image|next/image" app frontend/src --glob "*.tsx" | head -30

echo "=== PERF 6. next/script third parties ==="
rg -n "next/script|googletagmanager|hotjar|intercom|clarity" \
  app frontend/src --glob "*.{tsx,ts}" || true

echo "=== PERF 7. large public assets ==="
fd -e png -e jpg -e jpeg -e webp -e gif -e mp4 -e glb public \
  | while read f; do
      s=$(wc -c <"$f" | tr -d ' ')
      [ "$s" -gt 300000 ] && printf "%9s %s\n" "$s" "$f"
    done | sort -rn | head
```

### A.2 LCP/CLS 수집 헬퍼

```ts
// tests/performance/cwv.ts
import type { Page } from '@playwright/test';

export async function installCwvObservers(page: Page) {
  await page.addInitScript(() => {
    const state = { lcp: null as number | null, cls: 0, shifts: [] as any[] };
    (window as any).__cwv = state;

    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      state.lcp = last.startTime;
      (state as any).lcpEntry = {
        url: last.url,
        size: last.size,
        tag: last.element?.tagName,
        id: last.element?.id,
      };
    }).observe({ type: 'largest-contentful-paint', buffered: true } as any);

    new PerformanceObserver(list => {
      for (const e of list.getEntries() as any[]) {
        if (e.hadRecentInput) continue;
        state.cls += e.value;
        state.shifts.push({
          value: e.value,
          sources: (e.sources ?? []).map((s: any) => s.node?.tagName),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true } as any);
  });
}

export async function readCwv(page: Page) {
  return page.evaluate(() => (window as any).__cwv);
}
```

### A.3 미디어 용량 감사

```ts
// scripts/audit-media-weight.mjs
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push({ p, kb: Math.round(st.size / 1024) });
  }
  return out;
}

const files = walk('public')
  .filter(f => /\.(png|jpe?g|webp|gif|mp4|webm|glb|woff2?)$/i.test(f.p))
  .sort((a, b) => b.kb - a.kb);

console.table(files.slice(0, 30));
const tooBig = files.filter(f => f.kb > 300);
if (tooBig.length) {
  console.error(`Assets >300KB: ${tooBig.length}`);
  process.exitCode = 1;
}
```

### A.4 CI 예시

```yaml
name: performance

on:
  pull_request:
    paths:
      - "app/**"
      - "frontend/**"
      - "public/**"
      - "tests/performance/**"

jobs:
  perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
      - run: node scripts/check-bundle-budget.mjs
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm --filter web start &
      - run: npx wait-on http://127.0.0.1:3000
      - run: pnpm playwright test --project=performance --project=performance-mobile
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: perf-evidence
          path: |
            test-results/
            playwright-report/
            tmp/qa/performance/
```

---

## 부록 B — Agent 체크리스트

### B.1 시작

```text
[ ] Binding에 build/start/analyze/P0/예산을 채웠다.
[ ] 프로덕션 빌드로 서버를 띄웠다 (dev 금지).
[ ] Desktop/Mobile 스로틀 조건을 정했다.
[ ] QA-only vs QA+수정 요청을 구분했다.
[ ] Freeze List를 확인했다.
```

### B.2 측정

```text
[ ] cold cache 기준으로 P0 CWV를 3~5회 측정했다.
[ ] 중앙값과 분산을 기록했다.
[ ] LCP 요소·CLS source·Long Task를 귀속했다.
[ ] JS/이미지/폰트 전송량을 분리했다.
[ ] warm과의 차이를 기록했다.
[ ] Field가 없으면 NO_DATA로 표기했다.
```

### B.3 병목 분류

```text
[ ] 네트워크 제한인가, 메인스레드 제한인가?
[ ] 서버 TTFB인가, 클라이언트 실행인가?
[ ] 제품 코드인가, 제3자인가?
[ ] 모바일에서만인가, 전 환경인가?
[ ] 회귀인가, 고질인가?
```

### B.4 정적·구조

```text
[ ] client boundary와 heavy import를 검사했다.
[ ] 이미지 포맷/sizes/priority를 검사했다.
[ ] 폰트 subset/display를 검사했다.
[ ] 캐시 헤더와 중복 fetch를 검사했다.
[ ] force-dynamic 남용을 검사했다.
```

### B.5 런타임

```text
[ ] 리렌더/리스트 가상화 필요성을 검토했다.
[ ] hydration mismatch가 없다.
[ ] 리스너/WebGL/ObjectURL cleanup을 확인했다.
[ ] Suspense fallback이 레이아웃을 예약한다.
```

### B.6 게이트·보고

```text
[ ] Gate 1~11을 PASS/FAIL/BLOCKED로 판정했다.
[ ] Finding에 환경·수치·귀속·개선 원칙이 있다.
[ ] 잘된 점을 기록했다.
[ ] 미실행 검사를 PASS로 쓰지 않았다.
[ ] 리포트를 먼저 전달했다.
[ ] 승인 없이 코드를 수정하지 않았다.
```

### B.7 금지 사항

```text
✗ next dev 수치로 판정하지 않는다.
✗ 원인 귀속 없이 useMemo/useCallback을 뿌리지 않는다.
✗ Lighthouse 점수만 올리고 CWV를 무시하지 않는다.
✗ flake를 예산 완화로 숨기지 않는다.
✗ 제3자를 예산 밖으로 두지 않는다.
✗ Field Poor를 Lab Good로 덮지 않는다.
✗ 예외 baseline을 조용히 올리지 않는다.
✗ 증거 없이 “체감 개선”을 완료로 쓰지 않는다.
✗ QA 보고 전 애플리케이션 코드를 수정하지 않는다.
✗ tmp 산출물을 저장소에 커밋하지 않는다.
```

---

## 다음 문서

- `09_Accessibility_QA.md` — WCAG 2.2 AA, 키보드, 스크린리더, 인지·감각 접근성




