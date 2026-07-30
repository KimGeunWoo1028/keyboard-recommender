# 02_Mobile_QA.md — Cursor QA Master Suite · Mobile Playbook

> **문서 등급:** ★★★★★ · 모바일 전용 QA 실행 매뉴얼  
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind CSS · Playwright  
> **기준 브라우저:** iOS Safari · Android Chrome · Chromium mobile emulation  
> **필수 뷰포트:** 320 · 360 · 375 · 390 · 393 · 412 · 430px  
> **독립성:** 이 문서는 `01_Core_QA.md` 없이도 단독으로 실행할 수 있다.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding과 모바일 인벤토리](#3-project-binding과-모바일-인벤토리)
4. [실행 파이프라인](#4-실행-파이프라인)
5. [Viewport Matrix](#5-viewport-matrix)
6. [Responsive Layout](#6-responsive-layout)
7. [Landscape와 Orientation](#7-landscape와-orientation)
8. [Safe Area](#8-safe-area)
9. [Touch Target과 Pointer](#9-touch-target과-pointer)
10. [Thumb Zone과 한 손 사용](#10-thumb-zone과-한-손-사용)
11. [Bottom Sheet](#11-bottom-sheet)
12. [Drawer와 Mobile Navigation](#12-drawer와-mobile-navigation)
13. [Virtual Keyboard와 Form](#13-virtual-keyboard와-form)
14. [Dynamic Viewport](#14-dynamic-viewport)
15. [iOS Safari](#15-ios-safari)
16. [Android Chrome](#16-android-chrome)
17. [Overscroll과 Bounce](#17-overscroll과-bounce)
18. [Fold Device](#18-fold-device)
19. [Mobile CLS와 Visual Stability](#19-mobile-cls와-visual-stability)
20. [Mobile Performance](#20-mobile-performance)
21. [Mobile Accessibility](#21-mobile-accessibility)
22. [Network·Offline·Installation](#22-networkofflineinstallation)
23. [Playwright 자동화 전략](#23-playwright-자동화-전략)
24. [Regression 절차](#24-regression-절차)
25. [Final Report](#25-final-report)
26. [부록 A — 실행 명령](#부록-a--실행-명령)
27. [부록 B — Agent 체크리스트](#부록-b--agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

이 문서를 실행하는 Cursor Agent는 단순히 브라우저 폭을 줄여 데스크톱 화면을 확인하지 않는다. 모바일을 별도의 입력·렌더링·네트워크·운영체제 환경으로 취급한다.

### 1.1 동시에 수행할 역할

- **Principal Frontend Engineer:** 반응형 구조, CSS 레이아웃, React 상태, App Router 전환이 모바일 조건에서도 안정적인지 분석한다.
- **Mobile UX Auditor:** 한 손 사용, 엄지 도달성, 입력 피로, 화면 전환, 오류 복구를 실제 사용자 여정으로 평가한다.
- **Accessibility Expert:** WCAG 2.2 AA, 44×44 CSS px 타깃, 포커스, 확대, 스크린리더 이름과 상태를 검증한다.
- **Performance Engineer:** 중급 모바일 CPU와 4G 조건에서 LCP·CLS·INP·전송량을 측정한다.
- **Playwright Engineer:** 발견된 S0~S2 결함에 실패 테스트를 먼저 만들고 수정 후 회귀 스위트에 편입한다.
- **QA Lead:** PASS / FAIL / BLOCKED만 사용하고 모든 판정에 재현 증거를 남긴다.

### 1.2 완료 조건

다음 조건을 모두 만족해야 모바일 QA를 완료했다고 보고한다.

```text
[ ] 필수 7개 portrait viewport에서 P0/P1 라우트를 검사했다.
[ ] 최소 3개 landscape viewport에서 P0 라우트를 검사했다.
[ ] iOS Safari와 Android Chrome에서 각각 실기기 또는 동등한 원격 브라우저 검증을 수행했다.
[ ] safe area, virtual keyboard, dynamic viewport를 실제 브라우저에서 검증했다.
[ ] 문서 레벨 가로 스크롤이 0건이다.
[ ] 핵심 동작의 터치 타깃이 44×44 CSS px 이상이다.
[ ] Bottom Sheet와 Drawer의 포커스·스크롤·뒤로가기 동작이 정상이다.
[ ] 모바일 LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms 목표를 측정했다.
[ ] S0/S1/S2 결함마다 자동 회귀 테스트가 있다.
[ ] 전체 Regression Gate를 실행하고 Final Report를 작성했다.
```

실기기에서만 검증 가능한 항목을 에뮬레이션 결과로 PASS 처리하지 않는다. 실기기가 없으면 `BLOCKED — real iOS/Android device unavailable`로 기록한다.

---

## 2. 절대 원칙

### M-P1. 에뮬레이션은 실기기를 대체하지 않는다

Playwright의 `iPhone 13` 디바이스 설정은 viewport, user agent, DPR, touch를 흉내 낼 뿐이다. Safari WebKit의 주소창 축소, 키보드, safe area, 스크롤 탄성, 입력 확대, 실제 GPU·메모리는 재현하지 못한다.

- 에뮬레이션: 빠른 회귀와 다중 폭 검사에 사용한다.
- WebKit 프로젝트: 브라우저 엔진 차이를 검출하는 데 사용한다.
- 실기기: 출시 판정에 사용한다.

### M-P2. 폭 하나가 통과해도 반응형 PASS가 아니다

375px만 검사하면 390px·412px에서 생기는 breakpoint 경계 결함과 320px의 극단적 제약을 놓친다. 필수 7개 폭을 모두 검사한다.

### M-P3. User Agent 분기로 레이아웃을 만들지 않는다

레이아웃은 CSS media/container query와 기능 탐지로 구성한다. UA 기반 `isMobile` 분기는 SSR/CSR 불일치, 태블릿 오분류, 폴드 기기 실패를 만든다.

### M-P4. `100vh`를 전체 화면 UI의 기본값으로 쓰지 않는다

모바일 브라우저 UI가 나타나고 사라질 때 `100vh`는 실제 가시 영역과 다르다. 전체 화면 Sheet·Drawer·채팅·온보딩은 `dvh`를 우선하고 `svh`/`lvh`의 의미를 의도적으로 선택한다.

### M-P5. 확대를 차단하지 않는다

`user-scalable=no`, `maximum-scale=1`은 금지한다. 저시력 사용자의 확대 수단을 제거하며 WCAG 1.4.4를 위반한다.

### M-P6. hover를 필수 상호작용으로 사용하지 않는다

정보와 동작은 탭·포커스·명시적 버튼으로 접근 가능해야 한다. hover는 보조 피드백일 뿐이다.

### M-P7. 터치 타깃과 시각 크기를 구분한다

아이콘은 20px이어도 버튼 hit area는 최소 44×44px이어야 한다. 인접 타깃 간 오작동을 방지할 간격을 둔다.

### M-P8. 고정 UI는 콘텐츠를 가리면 안 된다

하단 CTA, 쿠키 배너, 탭 바, 토스트, 키보드가 마지막 입력·오류·제출 버튼을 덮지 않게 한다.

### M-P9. 가로 스크롤을 `overflow-x-hidden`으로 은폐하지 않는다

문서에 `overflow-x-hidden`을 추가하는 것은 원인 수정이 아니다. 넘치는 요소를 찾아 폭·min-width·transform·긴 문자열 문제를 고친다.

### M-P10. 모바일 성능은 프로덕션 빌드와 스로틀 환경에서 측정한다

개발 서버나 고성능 데스크톱의 수치로 PASS하지 않는다. 프로덕션 빌드, 4× CPU throttle, 150ms latency, 약 1.6Mbps download를 기본 조건으로 한다.

---

## 3. Project Binding과 모바일 인벤토리

QA를 시작하기 전에 아래 블록을 실제 프로젝트 파일과 실행 환경으로 채운다.

```yaml
mobile_qa_binding:
  app_root:
  package_manager:
  dev_command:
  build_command:
  production_command:
  base_url:
  api_url:
  e2e_root:
  playwright_config:
  auth_fixture:
  p0_routes: []
  p1_routes: []
  fixed_ui:
    header:
    bottom_nav:
    sticky_cta:
    cookie_banner:
  overlays:
    drawers: []
    bottom_sheets: []
    dialogs: []
  forms:
    critical: []
  device_access:
    ios_device:
    ios_version:
    android_device:
    android_version:
  freeze_list: []
```

### 3.1 Repository Discovery

다음 명령을 프로젝트 구조에 맞게 실행한다.

```bash
cat package.json
ls next.config.* tailwind.config.* postcss.config.* playwright.config.*
rg --files src/app | rg "(page|layout|loading|error)\\.tsx$"
rg -n "viewport|themeColor|appleWebApp" src/app
rg -n "100vh|h-screen|min-h-screen|dvh|svh|lvh" src
rg -n "fixed|sticky|bottom-0|top-0" src --glob "*.tsx"
rg -n "overflow-hidden|overflow-x-hidden|touch-action|overscroll" src
rg -n "user-scalable|maximum-scale|viewport-fit" src
rg -n "env\\(safe-area-inset" src
```

각 히트는 버그가 아니라 조사 후보로 취급한다. 런타임에서 재현된 항목만 Finding으로 확정한다.

### 3.2 Mobile Surface Inventory

아래 표를 실제 화면으로 채운다.

| ID | Route | P0/P1 | 주요 입력 | 고정 UI | Overlay | 긴 콘텐츠 | 실기기 필요 |
|----|-------|-------|-----------|---------|---------|-----------|-------------|
| R01 | `/` | P0 | CTA | Header | Mobile Nav | Hero copy | Yes |
| R02 | `/signup` | P0 | Form | Submit CTA | Terms Sheet | Error text | Yes |
| R03 | `/dashboard` | P0 | Tabs/Search | Bottom Nav | Filter Sheet | Table/Card | Yes |

검사 순서는 다음과 같다.

1. 인증·결제·저장·삭제·온보딩 P0 플로우
2. 모바일 네비게이션과 모든 Overlay
3. 입력이 3개 이상인 Form
4. 표·차트·카드 그리드·긴 텍스트
5. 나머지 P1 라우트

---

## 4. 실행 파이프라인

```text
1. DISCOVER
   라우트, 고정 UI, Overlay, Form, 이미지, 성능 예산을 인벤토리화한다.

2. STATIC SWEEP
   vh, fixed, overflow, min-width, safe-area, viewport meta, touch 관련 위험 패턴을 찾는다.

3. MATRIX RUN
   필수 viewport × P0/P1 route를 자동 실행해 overflow·console·screenshot 증거를 수집한다.

4. REAL DEVICE RUN
   iOS Safari와 Android Chrome에서 키보드·주소창·safe area·뒤로가기·터치를 검증한다.

5. REPRODUCE
   각 후보를 최소 재현 경로와 기대/실제 결과로 확정한다.

6. ROOT CAUSE
   증상이 아니라 CSS/React/브라우저 동작의 실제 원인을 파일:라인으로 지목한다.

7. FIX
   최소 변경으로 원인을 고친다. overflow 은폐, UA 분기, 확대 차단을 금지한다.

8. VERIFY
   원래 재현 절차와 인접 viewport/route를 다시 실행한다.

9. REGRESSION
   Playwright 테스트를 추가하고 전체 게이트를 실행한다.

10. REPORT
    Final Report에 PASS/FAIL/BLOCKED, 수치, 증거, 배포 판정을 기록한다.
```

### 4.1 Severity

| 등급 | 모바일 기준 |
|------|-------------|
| **S0 Blocker** | 인증 우회, 결제 중복, 데이터 파괴, 전체 P0 플로우 불가 |
| **S1 Critical** | CTA/제출 버튼 가림, 키보드로 Form 완주 불가, Overlay 탈출 불가, 주요 viewport 화면 붕괴 |
| **S2 Major** | 가로 스크롤, 타깃 미달, 큰 CLS, landscape 사용 불가, 잘못된 빈/오류 상태 |
| **S3 Minor** | 간격·시각 리듬·비핵심 hover·미세한 bounce |
| **S4 Nit** | 기능 영향 없는 정리·네이밍·미세 개선 |

---

## 5. Viewport Matrix

### 5.1 필수 Portrait Viewport

| 폭 | 대표 위험 |
|----|-----------|
| **320** | 최악의 좁은 폭, 긴 한국어/영어, 두 버튼 배치, iPhone SE 계열 |
| **360** | Android 보편 폭, 3열 카드·탭 경계 |
| **375** | 구형/소형 iPhone 표준 |
| **390** | 현대 iPhone 표준 |
| **393** | Pixel/iPhone 중간 경계, 반올림·breakpoint 결함 |
| **412** | Android 대형 표준 |
| **430** | 대형 iPhone, `sm` 직전의 과도한 빈 공간 |

높이는 고정하지 않고 최소 세 가지를 사용한다.

- Short: `568px`
- Standard: `844px`
- Tall: `932px`

폭만 바꾸고 높이를 항상 900px로 두면 짧은 화면에서 발생하는 고정 CTA·키보드·모달 잘림을 놓친다.

### 5.2 M-VP-01 — 문서 레벨 가로 스크롤

**WHY**

가로 스크롤은 대개 하나의 자식 요소가 viewport보다 넓어서 발생한다. 사용자는 세로 스크롤 중 화면이 좌우로 흔들리고, 콘텐츠 일부를 보지 못하며, 고정 헤더가 어긋난다.

**DETECT**

```bash
rg -n "w-\\[[3-9][0-9]{2,}px\\]|min-w-\\[[3-9][0-9]{2,}px\\]" src
rg -n "whitespace-nowrap|translate-x|left-1/2|right-1/2" src
rg -n "grid-cols-[3-9]" src --glob "*.tsx"
rg -n "overflow-x-hidden" src
```

**REPRODUCE**

```ts
const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bad: document.documentElement.scrollWidth >
    document.documentElement.clientWidth + 1,
}));
expect(overflow.bad, JSON.stringify(overflow)).toBe(false);
```

원인 요소를 찾는다.

```ts
const culprits = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  return [...document.querySelectorAll<HTMLElement>('body *')]
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.left < -1 || r.right > vw + 1)
    .map(({ el, r }) => ({
      tag: el.tagName,
      className: String(el.className).slice(0, 150),
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
    }))
    .slice(0, 20);
});
```

**PASS / FAIL**

- PASS: 의도된 내부 스크롤 컨테이너 외에 document overflow가 1px 이하이다.
- FAIL: 어떤 필수 폭에서도 document scrollWidth가 clientWidth보다 1px 초과한다.

**FIX**

- Flex/Grid 자식에 `min-w-0`를 추가한다.
- 고정 폭을 `w-full max-w-*`로 바꾼다.
- 긴 문자열에 `break-words`, `overflow-wrap:anywhere`, 또는 의도적 `truncate`를 적용한다.
- 표는 표 컨테이너만 `overflow-x-auto`로 만든다.
- `overflow-x-hidden`으로 문서 전체를 가리지 않는다.

**BAD**

```tsx
<main className="overflow-x-hidden">
  <section className="w-[720px]">...</section>
</main>
```

**GOOD**

```tsx
<main className="min-w-0">
  <section className="w-full max-w-3xl">
    <div className="min-w-0 break-words">...</div>
  </section>
</main>
```

**REGRESSION**

```ts
const widths = [320, 360, 375, 390, 393, 412, 430];
for (const width of widths) {
  test(`문서 가로 스크롤 없음 @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth);
    expect(delta).toBeLessThanOrEqual(1);
  });
}
```

### 5.3 M-VP-02 — 콘텐츠 절단과 숨은 핵심 정보

**WHY**

`overflow-hidden`, 고정 높이, `line-clamp`가 핵심 설명·가격·오류·CTA를 잘라내면 사용자는 결정을 내릴 수 없다. 모바일에서는 번역·동적 글꼴·큰 텍스트 설정으로 줄 수가 크게 늘어난다.

**DETECT**

```bash
rg -n "h-\\[[0-9]+px\\]|max-h-|overflow-hidden|line-clamp" src
rg -n "truncate" src --glob "*.tsx"
```

**REPRODUCE**

1. OS/브라우저 글꼴을 200%로 확대한다.
2. 가장 긴 로케일 텍스트와 100자 이름을 주입한다.
3. 가격, 오류, CTA, 법적 고지가 잘리는지 확인한다.
4. `scrollHeight > clientHeight`인데 overflow가 hidden인 요소를 찾는다.

```ts
const clipped = await page.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('body *')]
    .filter(el => {
      const s = getComputedStyle(el);
      return (s.overflowY === 'hidden' || s.overflow === 'hidden') &&
        el.scrollHeight > el.clientHeight + 1 &&
        (el.textContent?.trim().length ?? 0) > 0;
    })
    .map(el => ({
      text: el.textContent?.trim().slice(0, 60),
      className: String(el.className).slice(0, 120),
    })));
```

**PASS / FAIL**

- PASS: 핵심 정보는 200% 확대와 긴 문자열에서도 읽을 수 있다.
- FAIL: 가격·오류·CTA·동의 문구가 잘리거나 접근할 방법이 없다.

**FIX**

- 콘텐츠 영역의 고정 높이를 제거하고 `min-h-*`로 바꾼다.
- 카드 요약을 clamp할 때 상세 진입 수단과 전체 accessible name을 제공한다.
- 버튼 라벨은 줄바꿈을 허용하거나 좁은 폭에서 세로 스택으로 전환한다.

**BAD**

```tsx
<div className="h-20 overflow-hidden">
  <p className="line-clamp-2">{criticalTerms}</p>
</div>
```

**GOOD**

```tsx
<div className="min-h-20">
  <p className="break-words">{criticalTerms}</p>
</div>
```

### 5.4 M-VP-03 — Breakpoint 경계와 중간 폭

**WHY**

개발자는 375와 768만 확인하기 쉽지만, 실제 결함은 breakpoint 직전·직후에서 발생한다. `sm:640px` 직전까지 모바일 카드가 지나치게 넓거나, 393px에서 두 버튼이 한 줄에 들어갈 듯하다가 1px 넘친다.

**REPRODUCE**

Tailwind breakpoint마다 `-1`, 정확한 값, `+1`을 검사한다.

```ts
const boundaryWidths = [639, 640, 641, 767, 768, 769, 1023, 1024, 1025];
```

각 폭에서 다음을 확인한다.

- 요소가 중복 렌더되지 않는가
- 모바일/데스크톱 네비게이션이 동시에 보이지 않는가
- display 전환 때 포커스가 숨은 요소에 남지 않는가
- grid 열 수 전환으로 카드 최소 폭이 무너지지 않는가
- 고정 UI 높이 변경으로 콘텐츠가 가려지지 않는가

**FIX**

CSS breakpoint를 레이아웃 공간이 실제로 부족해지는 지점에 맞춘다. 기기 이름을 기준으로 임의 breakpoint를 추가하지 않는다. 재사용 컴포넌트는 viewport media query보다 container query를 우선 검토한다.

**GOOD**

```tsx
<section className="@container">
  <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-3">
    ...
  </div>
</section>
```

### 5.5 M-VP-04 — Zoom 200%와 Reflow

**WHY**

WCAG 1.4.10은 320 CSS px 상당 폭에서 양방향 스크롤 없이 reflow할 것을 요구한다. 브라우저 200% 확대는 좁은 viewport와 유사하지만 글꼴·컨트롤이 함께 커져 별도 결함을 드러낸다.

**REPRODUCE**

1. 데스크톱 브라우저를 1280px에서 400% 확대하거나 320 CSS px 상당으로 만든다.
2. 모바일 브라우저 pinch zoom 200%를 실행한다.
3. 가로 스크롤, 고정 UI 겹침, 포커스 요소의 화면 밖 이동을 확인한다.

**PASS**

- 확대가 허용된다.
- 핵심 콘텐츠가 한 방향 스크롤로 읽힌다.
- 표·지도·코드처럼 본질적으로 2D인 예외만 자체 가로 스크롤을 가진다.

**BAD**

```tsx
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

**GOOD**

```tsx
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
```

---

## 6. Responsive Layout

### M-RSP-01 — Mobile-first 클래스 구조

**WHY**

데스크톱 레이아웃을 기본으로 만들고 `max-md:`로 되돌리는 방식은 우선순위 충돌과 누락을 만든다. Tailwind는 작은 화면 기본 → 큰 화면 확장의 mobile-first 모델에 최적화되어 있다.

**DETECT**

```bash
rg -n "max-(sm|md|lg|xl):" src
rg -n "grid-cols-[2-9]" src --glob "*.tsx" | rg -v "sm:|md:|lg:|xl:"
rg -n "flex-row" src --glob "*.tsx" | rg -v "sm:|md:|lg:"
```

**FIX**

```tsx
// BAD — 데스크톱 기본을 모바일에서 되돌린다.
<div className="grid grid-cols-4 max-md:grid-cols-1">

// GOOD — 모바일 기본에서 확장한다.
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

`max-*`는 특정 범위에만 적용해야 하는 예외에서 사용하고, 레이아웃의 기본 골격에는 남용하지 않는다.

### M-RSP-02 — Flex/Grid 최소 폭

**WHY**

Flex 자식의 기본 `min-width:auto`는 콘텐츠의 최소 폭보다 작아지는 것을 막는다. 긴 이메일·URL·badge가 있으면 부모가 viewport를 넘긴다.

**REPRODUCE**

다음 문자열을 주요 카드·헤더·테이블에 주입한다.

```text
averyveryverylongemailaddresswithoutbreaks@example-long-company-domain.test
https://example.com/a/very/long/path/without/expected/break/opportunities
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
```

**BAD**

```tsx
<div className="flex items-center gap-3">
  <Avatar className="shrink-0" />
  <div>
    <p>{user.email}</p>
  </div>
</div>
```

**GOOD**

```tsx
<div className="flex min-w-0 items-center gap-3">
  <Avatar className="shrink-0" />
  <div className="min-w-0 flex-1">
    <p className="truncate" title={user.email}>{user.email}</p>
  </div>
</div>
```

### M-RSP-03 — CTA 그룹 재배치

**WHY**

두 개 이상의 CTA를 좁은 폭에서 억지로 한 줄에 두면 타깃이 작아지고 라벨이 잘린다. Primary와 Secondary가 같은 시각 무게를 가지면 잘못된 선택을 유도한다.

**PASS**

- 320px에서 모든 라벨이 온전히 보인다.
- Primary CTA는 손가락으로 쉽게 누를 수 있다.
- 버튼이 3개 이상이면 우선순위가 낮은 동작은 메뉴로 이동한다.
- 취소/삭제가 Primary와 붙어 오작동하지 않는다.

**BAD**

```tsx
<div className="flex gap-2">
  <Button className="flex-1 truncate">변경사항 저장하기</Button>
  <Button className="flex-1 truncate">취소하고 돌아가기</Button>
</div>
```

**GOOD**

```tsx
<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
  <Button variant="ghost" className="min-h-11 w-full sm:w-auto">
    취소
  </Button>
  <Button className="min-h-11 w-full sm:w-auto">
    변경사항 저장
  </Button>
</div>
```

### M-RSP-04 — Table의 모바일 전략

**WHY**

데스크톱 표를 축소하면 열 너비가 무너지고 숫자·행 컨텍스트를 잃는다. 모든 표를 카드로 바꾸는 것도 비교 가능성을 해친다. 데이터 특성에 맞는 전략을 선택해야 한다.

**전략 선택**

| 데이터 성격 | 모바일 전략 |
|-------------|-------------|
| 행 간 비교가 핵심 | 내부 가로 스크롤 + 첫 열 sticky |
| 개별 항목 읽기가 핵심 | 카드/Description List로 전환 |
| 열이 많지만 일부만 핵심 | 핵심 열 유지 + 상세 Drawer |
| 편집 가능 | 행 단위 편집 Sheet |

**BAD**

```tsx
<table className="w-full text-xs">
  {/* 10개 열을 320px에 압축 */}
</table>
```

**GOOD**

```tsx
<div
  className="w-full overflow-x-auto overscroll-x-contain"
  role="region"
  aria-label="결제 내역 표, 좌우로 스크롤할 수 있습니다"
  tabIndex={0}
>
  <table className="min-w-[48rem]">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

스크롤 가능한 영역에 시각적 힌트(오른쪽 fade/“좌우로 스크롤”)를 제공하고 키보드 포커스를 허용한다.

### M-RSP-05 — Media와 Aspect Ratio

**WHY**

이미지·영상·지도·3D canvas가 viewport를 넘거나 높이를 예약하지 않으면 overflow와 CLS가 발생한다. 모바일 회전 후 canvas가 이전 크기를 유지하는 문제도 흔하다.

**FIX**

```tsx
<div className="relative aspect-video w-full overflow-hidden rounded-xl">
  <Image
    src={src}
    alt={alt}
    fill
    sizes="100vw"
    className="object-cover"
  />
</div>
```

Canvas/WebGL은 `ResizeObserver`로 실제 컨테이너 크기를 관찰하고 observer를 정리한다.

---

## 7. Landscape와 Orientation

### 7.1 필수 Landscape Matrix

최소 다음 크기를 검사한다.

| 크기 | 대표 환경 |
|------|-----------|
| 568×320 | 소형 iPhone landscape |
| 844×390 | 현대 iPhone landscape |
| 915×412 | Android 대형 landscape |

### M-ORI-01 — 짧은 높이에서 핵심 동작 접근

**WHY**

Landscape의 핵심 제약은 폭이 아니라 높이다. 고정 Header + Modal 제목 + Footer CTA가 합쳐지면 콘텐츠 영역이 100px 이하가 되고 제출 버튼에 접근할 수 없다.

**REPRODUCE**

1. Portrait에서 Form/Sheet를 연다.
2. 입력 중 landscape로 회전한다.
3. 포커스·입력값·스크롤 위치가 유지되는지 확인한다.
4. 모든 입력과 CTA에 스크롤로 접근 가능한지 확인한다.
5. 회전 중 Overlay가 잘못된 좌표에 남지 않는지 확인한다.

**PASS / FAIL**

- PASS: 콘텐츠가 내부 스크롤되고 Header/Footer는 필요한 경우 축소된다.
- FAIL: CTA 잘림, 닫기 버튼 접근 불가, 입력값 초기화, 화면 밖 포커스.

**BAD**

```tsx
<DialogContent className="h-[700px] overflow-hidden">
  ...
  <footer className="absolute bottom-0">...</footer>
</DialogContent>
```

**GOOD**

```tsx
<DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col">
  <header className="shrink-0">...</header>
  <div className="min-h-0 flex-1 overflow-y-auto">...</div>
  <footer className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
    ...
  </footer>
</DialogContent>
```

### M-ORI-02 — Orientation Lock 금지

**WHY**

특정 방향을 강제하면 기기를 고정 장치에 장착했거나 한 방향만 사용할 수 있는 장애 사용자를 차단한다. 영상·게임처럼 본질적 이유가 없다면 양방향을 지원한다.

**DETECT**

```bash
rg -n "orientation|screen\\.orientation\\.lock|manifest.*orientation" .
```

**PASS**

- 일반 SaaS 플로우는 portrait와 landscape 모두 사용할 수 있다.
- 방향 전환 후 상태·포커스·스크롤이 보존된다.
- 필수적인 lock은 명확한 이유와 대체 수단이 있다.

### M-ORI-03 — CSS Orientation Query 오용

`@media (orientation: landscape)`만으로 “모바일 landscape”를 판정하지 않는다. 넓고 낮은 데스크톱 창도 landscape이며, 폴드 기기는 자세가 복잡하다. 높이/폭 조건 또는 container query와 함께 사용한다.

**BAD**

```css
@media (orientation: landscape) {
  .mobile-nav { display: none; }
}
```

**GOOD**

```css
@media (orientation: landscape) and (max-height: 500px) and (pointer: coarse) {
  .mobile-header { min-height: 44px; }
}
```

---

## 8. Safe Area

### M-SAFE-01 — Notch와 Home Indicator

**WHY**

`viewport-fit=cover`를 사용할 때 콘텐츠는 notch·Dynamic Island·home indicator 영역까지 확장된다. padding을 주지 않으면 닫기 버튼과 하단 CTA가 물리적으로 가려지거나 누르기 어렵다.

**DETECT**

```bash
rg -n "viewportFit|viewport-fit" src
rg -n "safe-area-inset" src
rg -n "fixed.*bottom-0|bottom-0.*fixed" src --glob "*.tsx"
```

**REPRODUCE**

1. Notch가 있는 iPhone portrait와 landscape에서 실행한다.
2. Header 왼쪽/오른쪽 버튼이 sensor 영역과 겹치는지 확인한다.
3. Bottom Nav·Sheet CTA가 home indicator와 겹치는지 확인한다.
4. 배경은 edge-to-edge로 연장되되, 인터랙티브 콘텐츠는 inset 안쪽인지 확인한다.

**PASS / FAIL**

- PASS: 모든 핵심 컨트롤이 safe area 안쪽이며 최소 기본 간격과 inset 중 큰 값을 사용한다.
- FAIL: home indicator/Notch와 겹침, landscape 좌우 inset 누락.

**BAD**

```tsx
<nav className="fixed inset-x-0 bottom-0 h-14 bg-background">
  ...
</nav>
```

**GOOD**

```tsx
<nav className="
  fixed inset-x-0 bottom-0 z-sticky
  min-h-14 border-t bg-background
  px-[max(1rem,env(safe-area-inset-left))]
  pr-[max(1rem,env(safe-area-inset-right))]
  pb-[max(.5rem,env(safe-area-inset-bottom))]
">
  ...
</nav>
```

### M-SAFE-02 — Content Padding과 Fixed UI 높이

**WHY**

하단 Nav는 safe area만큼 실제 높이가 늘어난다. 본문에 고정된 `pb-16`만 주면 마지막 콘텐츠가 Nav 뒤에 숨는다.

**FIX**

고정 UI의 실제 높이를 CSS 변수로 관리한다.

```css
:root {
  --mobile-nav-height: 3.5rem;
  --mobile-nav-safe-height:
    calc(var(--mobile-nav-height) + env(safe-area-inset-bottom));
}
```

```tsx
<main className="pb-[calc(var(--mobile-nav-safe-height)+1rem)]">
  {children}
</main>
```

**REPRODUCE**

페이지 끝까지 스크롤하고 마지막 링크·입력·Footer가 완전히 보이며 탭 가능한지 확인한다.

### M-SAFE-03 — Safe Area Fallback

`env()`를 지원하지 않는 환경에서도 기본 padding이 남아야 한다.

```css
.safe-bottom {
  padding-bottom: 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

`padding-bottom: env(safe-area-inset-bottom)`만 사용하면 inset이 0인 기기에서 간격이 사라진다.

### M-SAFE-04 — Full-bleed 배경과 콘텐츠 분리

배경은 화면 가장자리까지 확장하고 콘텐츠만 inset을 적용한다. 전체 컨테이너에 inset을 주면 notch 기기에서 배경이 잘린 띠처럼 보인다.

**BAD**

```tsx
<footer className="bg-black px-[env(safe-area-inset-left)]">
  ...
</footer>
```

**GOOD**

```tsx
<footer className="bg-black text-white">
  <div className="
    mx-auto max-w-screen-xl
    px-[max(1rem,env(safe-area-inset-left))]
    pr-[max(1rem,env(safe-area-inset-right))]
    pb-[max(1rem,env(safe-area-inset-bottom))]
  ">
    ...
  </div>
</footer>
```

**REGRESSION**

Safe area는 Chromium desktop emulation만으로 판정하지 않는다. 자동 테스트는 클래스·viewport 설정의 정적 계약을 지키고, 실제 시각 판정은 iOS 실기기에 남긴다.

```ts
test('viewport가 edge-to-edge와 확대를 안전하게 허용한다', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/viewport-fit=cover/);
  expect(html).not.toMatch(/user-scalable=no|maximum-scale=1/);
});
```

---

## 9. Touch Target과 Pointer

### M-TOUCH-01 — 최소 터치 타깃

**WHY**

시각적으로 작은 아이콘을 정확히 탭하기는 어렵다. 이동 중, 한 손 사용, 운동 장애, 대형 손가락에서는 오작동이 더 늘어난다. WCAG 2.2의 Target Size 최소 기준은 24×24 CSS px이지만, 모바일 제품 품질 기준은 Apple/Google 관행에 맞춰 **44×44 CSS px 이상**을 사용한다.

**DETECT**

```bash
rg -n "size-[3-9]\\b|w-[3-9]\\b|h-[3-9]\\b" src --glob "*.tsx" |
  rg -i "button|icon|close|menu|delete"
rg -n "<button" src -A4 | rg -v "min-h-11|h-11|h-12|size-11|size-12|p-[3-9]"
```

**REPRODUCE**

```ts
const undersized = await page.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>(
    'button:not([disabled]),a[href],input:not([type=hidden]),select,[role=button],[role=checkbox]'
  )]
    .filter(el => el.offsetParent !== null)
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        name: el.getAttribute('aria-label') ||
          el.textContent?.trim().slice(0, 40) ||
          el.tagName,
        width: r.width,
        height: r.height,
      };
    })
    .filter(x => x.width < 44 || x.height < 44));
```

예외는 문장 안의 인라인 링크, 브라우저 기본 컨트롤, 같은 동작의 더 큰 대체 타깃이 있는 경우뿐이다. 예외도 인접 타깃과 24px 이상 간격을 확보한다.

**PASS / FAIL**

- PASS: 핵심·반복 컨트롤은 44×44 이상이고 인접 오작동이 없다.
- FAIL: 닫기·뒤로·삭제·메뉴·제출 중 하나라도 한 변이 44px 미만이다.

**FIX**

아이콘 자체를 키우기보다 버튼 hit area를 키운다.

**BAD**

```tsx
<button aria-label="닫기">
  <X className="size-4" />
</button>
```

**GOOD**

```tsx
<button
  type="button"
  aria-label="닫기"
  className="-m-2 inline-grid size-11 place-items-center rounded-full
             focus-visible:ring-2 focus-visible:ring-ring"
>
  <X className="size-5" aria-hidden />
</button>
```

`-m-2`처럼 hit area를 시각 상자 밖으로 확장할 때 인접 버튼과 겹치지 않는지 실제 좌표로 검사한다.

**REGRESSION**

```ts
test('핵심 터치 타깃이 44×44 이상이다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const targets = page.locator('[data-critical-touch-target]');
  for (let i = 0; i < await targets.count(); i++) {
    const box = await targets.nth(i).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
```

### M-TOUCH-02 — 인접 타깃 간격과 위험 동작

**WHY**

저장과 삭제, 이전과 다음처럼 반대 효과의 버튼이 붙어 있으면 잘못된 탭이 치명적인 결과를 만든다.

**REPRODUCE**

1. 모든 버튼의 사각형을 수집한다.
2. 서로 다른 위험 동작의 hit area가 겹치거나 간격이 8px 미만인지 확인한다.
3. 한 손으로 빠르게 10회 탭해 오작동을 관찰한다.

**PASS**

- 위험 동작은 Primary CTA와 분리되어 있다.
- 삭제는 destructive 스타일과 확인/Undo를 제공한다.
- 인접 타깃 hit area가 겹치지 않는다.

**BAD**

```tsx
<div className="flex">
  <Button>저장</Button>
  <Button variant="destructive">삭제</Button>
</div>
```

**GOOD**

```tsx
<div className="flex flex-col gap-3">
  <Button className="min-h-11">저장</Button>
  <Button variant="ghost" className="min-h-11 text-destructive">
    항목 삭제
  </Button>
</div>
```

### M-TOUCH-03 — Touch와 Click 중복 실행

**WHY**

`onTouchEnd`와 `onClick`을 모두 연결하면 한 번의 탭이 두 번 실행될 수 있다. 생성·결제·삭제에서는 S0/S1 결함이다.

**DETECT**

```bash
rg -n "onTouch(Start|End|Move)" src --glob "*.tsx" -B3 -A3 |
  rg "onClick"
rg -n "touchstart|touchend" src -A6
```

**REPRODUCE**

모바일 touch 컨텍스트에서 한 번 탭하고 Network 요청과 handler 호출을 센다.

**BAD**

```tsx
<button
  onTouchEnd={submit}
  onClick={submit}
>
  결제
</button>
```

**GOOD**

```tsx
<button type="button" onClick={submit}>
  결제
</button>
```

네이티브 click 이벤트는 터치를 지원한다. 제스처가 필요한 경우 Pointer Events를 사용하고 `pointerId`와 cancel 경로를 처리한다.

### M-TOUCH-04 — Pointer Cancellation과 Drag

**WHY**

사용자가 버튼에서 손가락을 누른 뒤 바깥으로 움직여 취소하려 해도 작업이 실행되면 의도치 않은 동작이 발생한다. 드래그 UI가 세로 스크롤을 가로채면 페이지를 움직일 수 없다.

**PASS**

- 동작은 `pointerup`/click에서 확정되고 이동 취소가 가능하다.
- drag handle만 드래그를 시작한다.
- 일반 카드 표면에서는 세로 스크롤이 유지된다.
- 취소 이벤트(`pointercancel`)가 상태를 원복한다.

**GOOD**

```tsx
function DragHandle() {
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      aria-label="순서 변경"
      className="size-11 touch-none"
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <GripVertical aria-hidden />
      <span className="sr-only">
        {dragging ? '이동 중' : '드래그하거나 키보드로 순서를 변경'}
      </span>
    </button>
  );
}
```

드래그에는 키보드 대체 수단(위로/아래로 이동 버튼)을 제공한다.

### M-TOUCH-05 — Hover 의존 제거

**DETECT**

```bash
rg -n "group-hover:|hover:" src --glob "*.tsx"
rg -n "onMouseEnter|onMouseLeave" src
```

**REPRODUCE**

Touch-only 컨텍스트에서 마우스 없이 다음을 찾는다.

- 카드 액션
- Tooltip 정보
- 메뉴
- 표 행 동작
- 이미지 캡션

**FAIL**

hover해야만 나타나는 정보나 동작이 있고 탭/포커스 대체가 없다.

**GOOD**

```tsx
<article>
  <h3>{title}</h3>
  <p>{summary}</p>
  <button
    type="button"
    aria-expanded={actionsOpen}
    aria-controls={`actions-${id}`}
    className="size-11"
  >
    <MoreHorizontal aria-hidden />
    <span className="sr-only">항목 작업 열기</span>
  </button>
  <ItemActions id={`actions-${id}`} open={actionsOpen} />
</article>
```

---

## 10. Thumb Zone과 한 손 사용

### M-THUMB-01 — Primary Action 위치

**WHY**

대형 모바일 화면에서 상단 반대편 모서리는 한 손으로 닿기 어렵다. 반복·Primary 동작이 상단에만 있으면 사용자는 그립을 바꾸고 기기를 떨어뜨릴 위험이 있다.

**검사 절차**

1. 오른손·왼손 각각으로 P0 플로우를 수행한다.
2. 기기 하단을 잡은 상태에서 Primary CTA에 닿는지 확인한다.
3. 10회 반복하는 동작(다음, 저장, 추가, 필터)이 어디에 있는지 기록한다.
4. 상단 동작에 하단 대체 또는 swipe만이 아닌 명시적 대체가 있는지 확인한다.

**PASS**

- 반복 Primary CTA는 화면 하단 중앙/좌우의 쉬운 영역에 있다.
- 파괴적 동작은 쉬운 영역에 우발적으로 노출하지 않는다.
- 하단 CTA는 safe area와 키보드를 고려한다.

### M-THUMB-02 — Sticky CTA의 가림

**WHY**

하단 sticky CTA는 도달성은 좋지만 본문·오류·마지막 입력을 가릴 수 있다. 키보드가 열렸을 때 CTA가 키보드 위로 떠 입력 영역을 절반 이상 덮기도 한다.

**REPRODUCE**

1. 페이지 끝까지 스크롤한다.
2. 마지막 콘텐츠와 Footer를 확인한다.
3. 각 입력을 포커스하고 키보드를 연다.
4. 오류 메시지를 발생시켜 CTA와 겹치는지 확인한다.
5. 200% 확대에서 반복한다.

**GOOD**

```tsx
<main className="pb-[calc(var(--sticky-cta-height)+env(safe-area-inset-bottom)+1rem)]">
  {children}
</main>

<div className="
  fixed inset-x-0 bottom-0 z-sticky border-t bg-background/95
  p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]
  backdrop-blur
">
  <Button className="min-h-12 w-full">계속</Button>
</div>
```

가상 키보드가 열린 동안 sticky CTA를 유지할지 숨길지는 플로우별로 결정한다. 유지하면 focused field를 가리지 않아야 하고, 숨기면 제출 경로가 사라지지 않아야 한다.

### M-THUMB-03 — Bottom Navigation

**PASS**

- 핵심 목적지 3~5개만 제공한다.
- 현재 탭은 색상뿐 아니라 아이콘/라벨/`aria-current="page"`로 표시한다.
- 라벨을 생략하지 않는다.
- hit area 44×44 이상이다.
- safe area 포함 실제 높이를 본문 padding에 반영한다.
- 키보드가 열렸을 때 의도에 따라 숨기거나 위치를 안전하게 유지한다.

**BAD**

```tsx
<Link href="/home">
  <HomeIcon />
</Link>
```

**GOOD**

```tsx
<Link
  href="/home"
  aria-current={active ? 'page' : undefined}
  className="flex min-h-12 min-w-16 flex-col items-center justify-center gap-1"
>
  <HomeIcon aria-hidden className="size-5" />
  <span className="text-xs">홈</span>
</Link>
```

---

## 11. Bottom Sheet

Bottom Sheet는 단순한 아래쪽 모달이 아니다. viewport, safe area, 키보드, drag gesture, focus trap, history를 동시에 다룬다.

### M-SHEET-01 — 열기·닫기·포커스

**WHY**

Sheet가 열렸는데 포커스가 배경에 남으면 스크린리더와 키보드 사용자는 Overlay가 열린 사실을 모른다. 닫은 뒤 트리거로 돌아오지 않으면 작업 흐름을 잃는다.

**REPRODUCE**

1. 트리거에 키보드 포커스를 둔다.
2. Enter로 Sheet를 연다.
3. `role="dialog"`, accessible name, `aria-modal="true"`를 확인한다.
4. Tab을 충분히 눌러 포커스가 Sheet 밖으로 나가는지 확인한다.
5. Esc와 닫기 버튼으로 각각 닫는다.
6. 트리거로 포커스가 복귀하는지 확인한다.

**PASS**

- 열림 시 제목/첫 컨트롤로 포커스 이동
- 포커스 trap
- Esc, 닫기 버튼, 명시적 backdrop 정책
- 닫힘 후 트리거 복귀
- 배경은 `inert` 또는 동등하게 비활성

검증된 Dialog/Sheet primitive를 우선 사용한다.

### M-SHEET-02 — 높이와 내부 스크롤

**WHY**

Sheet 자체와 내부 콘텐츠가 동시에 스크롤되면 scroll chaining과 bounce가 발생한다. 전체 높이가 100vh면 주소창·키보드에 잘린다.

**BAD**

```tsx
<div className="fixed inset-x-0 bottom-0 h-screen overflow-y-auto">
  ...
</div>
```

**GOOD**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="sheet-title"
  className="
    fixed inset-x-0 bottom-0 z-modal
    flex max-h-[min(90dvh,48rem)] flex-col
    rounded-t-2xl bg-background shadow-xl
  "
>
  <div className="shrink-0 px-4 pb-2 pt-3">
    <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
    <h2 id="sheet-title">필터</h2>
  </div>
  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
    ...
  </div>
  <footer className="
    shrink-0 border-t p-4
    pb-[max(1rem,env(safe-area-inset-bottom))]
  ">
    <Button className="min-h-12 w-full">적용</Button>
  </footer>
</div>
```

### M-SHEET-03 — Drag Gesture와 Snap Point

**WHY**

Sheet drag가 내부 목록 스크롤과 경쟁하면 목록 위로 스크롤하려다가 Sheet가 닫힌다. 손가락 속도·방향·시작 위치를 구분해야 한다.

**PASS**

- drag handle 영역에서만 Sheet drag가 시작된다.
- 내부 콘텐츠가 scrollTop > 0이면 아래 drag가 목록을 우선 스크롤한다.
- 충분한 거리/속도에서만 닫힌다.
- `pointercancel`에서 원위치로 복귀한다.
- reduced-motion에서 spring/큰 이동이 줄어든다.
- 닫기 버튼이 항상 존재해 drag가 유일한 수단이 아니다.

### M-SHEET-04 — Keyboard와 Form Sheet

**REPRODUCE**

1. Sheet 안의 첫·중간·마지막 입력을 각각 포커스한다.
2. iOS 키보드와 Android 키보드를 연다.
3. focused field와 연결된 오류가 모두 보이는지 확인한다.
4. Footer CTA가 키보드 뒤에 숨거나 입력을 가리지 않는지 확인한다.
5. 키보드의 Next/Done으로 Form을 완주한다.

**FIX**

- `100dvh` 기준 max-height
- `min-h-0` 내부 스크롤
- `scrollIntoView({ block:'center' })`는 keyboard resize 이후에만
- Footer CTA가 키보드와 충돌하면 Sheet 내부 flow에 두거나 Visual Viewport로 보정

### M-SHEET-05 — History와 Android Back

**WHY**

Android 시스템 Back을 눌렀을 때 Sheet가 아니라 페이지 전체가 뒤로 가면 사용자가 입력을 잃는다.

**PASS**

1. Sheet가 열려 있으면 Back은 Sheet를 닫는다.
2. Sheet가 닫혀 있으면 Back은 이전 라우트로 이동한다.
3. 딥링크 가능한 Sheet라면 URL 상태와 UI가 일치한다.

**GOOD**

Sheet를 중요한 상세/편집 흐름으로 사용할 때는 intercepting route 또는 query param으로 history에 표현한다. 단순 확인 Sheet는 history를 오염하지 않아도 된다. 제품 의도를 문서화한다.

**REGRESSION**

```ts
test('Bottom Sheet는 포커스를 가두고 닫은 뒤 복귀한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/items');
  const trigger = page.getByRole('button', { name: '필터' });
  await trigger.click();

  const sheet = page.getByRole('dialog', { name: '필터' });
  await expect(sheet).toBeVisible();

  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  expect(await sheet.evaluate(el => el.contains(document.activeElement))).toBe(true);

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

---

## 12. Drawer와 Mobile Navigation

### M-DRAW-01 — Drawer 크기와 방향

**WHY**

320px 화면에서 `w-80` Drawer는 viewport와 같아 닫기 affordance와 backdrop가 사라질 수 있다. 폭은 viewport 기반 최대값으로 제한한다.

**GOOD**

```tsx
<aside className="
  fixed inset-y-0 left-0 z-drawer
  flex w-[min(20rem,calc(100vw-3rem))] flex-col
  bg-background shadow-xl
  pl-[env(safe-area-inset-left)]
">
  ...
</aside>
```

Full-screen navigation이 제품에 더 적합하면 애매한 좁은 backdrop를 남기지 말고 명시적으로 전체 화면을 사용한다.

### M-DRAW-02 — 배경 스크롤 잠금

**WHY**

Drawer가 열린 상태에서 배경이 스크롤되면 닫을 때 사용자가 원래 위치를 잃는다. iOS에서는 `body { overflow:hidden }`만으로 충분하지 않을 수 있다.

**REPRODUCE**

1. 긴 페이지 중간으로 스크롤한다.
2. Drawer를 연다.
3. Drawer 내부와 backdrop에서 위아래 swipe한다.
4. 배경 scrollY가 변하는지 확인한다.
5. 닫은 뒤 원래 scrollY가 유지되는지 확인한다.

**GOOD**

```ts
function lockBodyScroll() {
  const y = window.scrollY;
  const body = document.body;
  const previous = {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
  };

  Object.assign(body.style, {
    position: 'fixed',
    top: `-${y}px`,
    width: '100%',
  });

  return () => {
    Object.assign(body.style, previous);
    window.scrollTo(0, y);
  };
}
```

검증된 Overlay library가 제공하는 scroll lock을 우선 사용하고 중복 잠금을 피한다.

### M-DRAW-03 — Navigation 상태와 라우트 전환

**PASS**

- 현재 라우트에 `aria-current="page"`
- 링크 탭 후 Drawer가 닫힘
- 전환 실패 시 무한 열린 상태가 아님
- 외부 링크는 새 창 여부 안내
- 계층 메뉴는 `aria-expanded`와 `aria-controls`
- 로그아웃/삭제를 일반 네비게이션과 분리

**REGRESSION**

```ts
test('모바일 Drawer 링크로 이동하면 Drawer가 닫힌다', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  const drawer = page.getByRole('dialog', { name: '주 메뉴' });
  await drawer.getByRole('link', { name: '요금제' }).click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(drawer).toBeHidden();
});
```

### M-DRAW-04 — Swipe Close

Swipe close는 보조 기능이다. 다음을 보장한다.

- 닫기 버튼과 Back 동작이 별도로 존재한다.
- Drawer 내부 가로 carousel/slider와 제스처가 충돌하지 않는다.
- 시작 영역, 거리, 방향이 명확하다.
- RTL에서 방향이 올바르게 뒤집힌다.
- reduced-motion에서 이동 애니메이션이 축소된다.

---

## 13. Virtual Keyboard와 Form

### M-KBD-01 — Focused Input 가림

**WHY**

가상 키보드는 viewport의 절반 이상을 차지한다. focused input과 오류 메시지가 키보드 뒤에 숨으면 사용자는 입력 내용을 확인할 수 없다.

**REPRODUCE**

각 Critical Form에서 다음을 수행한다.

1. 페이지 상단·중간·하단 입력을 각각 포커스한다.
2. iOS Safari와 Android Chrome 키보드를 실제로 연다.
3. 입력 라벨, 입력값, 오류, 다음 버튼이 보이는지 확인한다.
4. 키보드 suggestion bar가 켜진 상태에서도 확인한다.
5. landscape에서 반복한다.

**PASS**

- focused input이 visual viewport 안에 있다.
- 자동 스크롤 후 고정 Header/CTA에 가려지지 않는다.
- 키보드를 닫아도 페이지가 이상한 위치로 점프하지 않는다.

### M-KBD-02 — Visual Viewport API

**WHY**

일부 브라우저에서 키보드가 열려도 layout viewport는 그대로이고 visual viewport만 줄어든다. `window.innerHeight`만 보면 키보드 가림을 감지하지 못한다.

**GOOD**

```tsx
'use client';

function useVisualViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      document.documentElement.style.setProperty(
        '--visual-viewport-height',
        `${viewport.height}px`,
      );
      document.documentElement.style.setProperty(
        '--visual-viewport-offset-top',
        `${viewport.offsetTop}px`,
      );
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--visual-viewport-height');
      document.documentElement.style.removeProperty('--visual-viewport-offset-top');
    };
  }, []);
}
```

```css
.keyboard-aware-panel {
  max-height: var(--visual-viewport-height, 100dvh);
}
```

Visual Viewport 보정은 키보드와 브라우저 UI 문제를 실제로 재현한 후 적용한다. 일반 레이아웃에 JS 높이 동기화를 남용하지 않는다.

### M-KBD-03 — 입력 타입과 모바일 키보드

**WHY**

올바른 `type`, `inputMode`, `autoComplete`, `enterKeyHint`는 입력 속도와 오류율을 크게 줄인다.

| 데이터 | 권장 속성 |
|--------|-----------|
| 이메일 | `type="email" autoComplete="email" inputMode="email"` |
| 전화 | `type="tel" autoComplete="tel" inputMode="tel"` |
| 숫자 코드 | `inputMode="numeric" pattern="[0-9]*"` |
| 소수/금액 | `inputMode="decimal"`; 문자열 state 유지 |
| URL | `type="url" inputMode="url"` |
| 검색 | `type="search" enterKeyHint="search"` |
| 다음 필드 | `enterKeyHint="next"` |
| 제출 | `enterKeyHint="done"` |

**BAD**

```tsx
<input type="text" name="email" />
<input type="number" name="verificationCode" />
```

`type="number"`는 OTP의 선행 0을 제거하고 증감 UI를 노출할 수 있다.

**GOOD**

```tsx
<input
  id="email"
  name="email"
  type="email"
  inputMode="email"
  autoComplete="email"
  enterKeyHint="next"
  autoCapitalize="none"
  spellCheck={false}
/>

<input
  id="otp"
  name="otp"
  type="text"
  inputMode="numeric"
  autoComplete="one-time-code"
  pattern="[0-9]*"
  maxLength={6}
/>
```

### M-KBD-04 — iOS Input Zoom

**WHY**

iOS Safari는 16px 미만 입력 글꼴에 포커스하면 자동 확대한다. 화면이 확대된 채 돌아오지 않거나 fixed UI가 어긋날 수 있다.

**DETECT**

```bash
rg -n "text-(xs|sm)" src --glob "*.tsx" -B2 |
  rg -i "input|textarea|select"
```

**PASS**

모바일 입력의 computed font-size가 16px 이상이다. 시각적으로 작은 텍스트가 필요해도 입력 자체는 16px을 유지한다.

**GOOD**

```tsx
<input className="min-h-11 w-full rounded-md border px-3 text-base md:text-sm" />
```

### M-KBD-05 — IME·한글 조합

**WHY**

입력마다 정규화·검색·slug 변환을 수행하면 한글 조합 중간 상태를 깨뜨려 글자가 중복되거나 분리된다.

**REPRODUCE**

실제 한글 키보드로 다음을 입력한다.

```text
기계식 키보드 추천
한/영 전환을 포함한 문장
자음·모음 빠른 연속 입력
```

검색 자동 실행, 입력 포맷팅, 글자 수 제한에서 조합이 깨지는지 확인한다.

**GOOD**

```tsx
const [composing, setComposing] = useState(false);

<input
  value={query}
  onCompositionStart={() => setComposing(true)}
  onCompositionEnd={e => {
    setComposing(false);
    setQuery(e.currentTarget.value);
    runSearch(e.currentTarget.value);
  }}
  onChange={e => {
    setQuery(e.target.value);
    if (!composing) debouncedSearch(e.target.value);
  }}
/>
```

### M-KBD-06 — 키보드 다음/완료 흐름

**PASS**

- Enter가 의도치 않은 조기 제출을 하지 않는다.
- `Next`가 다음 입력으로 이동한다.
- 마지막 입력의 `Done` 또는 Enter가 폼을 제출한다.
- 제출 중 키보드를 닫거나 유지하는 정책이 일관된다.
- 오류 시 첫 오류 필드로 포커스가 이동하고 키보드가 적절히 열린다.

**REGRESSION**

Playwright desktop 키보드는 모바일 soft keyboard를 열지 못한다. 자동화에서는 속성·포커스 순서를 검사하고, 실제 키보드 시각 동작은 실기기 Gate로 남긴다.

```ts
test('Critical Form에 모바일 입력 힌트가 설정되어 있다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/signup');
  await expect(page.getByLabel('이메일')).toHaveAttribute('inputmode', 'email');
  await expect(page.getByLabel('이메일')).toHaveAttribute('autocomplete', 'email');
  await expect(page.getByLabel('인증 코드')).toHaveAttribute('inputmode', 'numeric');
  await expect(page.getByLabel('인증 코드')).toHaveAttribute('autocomplete', 'one-time-code');
});
```

---

## 14. Dynamic Viewport

### M-DVH-01 — `vh` 단위 선택

**개념**

- `svh`: 브라우저 UI가 모두 보일 때의 작은 viewport. 콘텐츠가 가려지지 않는 안정적 최소 높이.
- `lvh`: 브라우저 UI가 숨었을 때의 큰 viewport. 배경 확장에는 유용하지만 콘텐츠 가림 위험.
- `dvh`: 현재 가시 viewport 변화에 동적으로 반응. Full-screen UI의 일반적 선택.

**DETECT**

```bash
rg -n "100vh|h-screen|min-h-screen" src
rg -n "dvh|svh|lvh" src
```

**판정**

| UI | 권장 |
|----|------|
| 일반 페이지 최소 높이 | `min-h-svh` 또는 `min-h-dvh` |
| Dialog/Sheet 최대 높이 | `max-h-[calc(100dvh-...)]` |
| 배경 full bleed | `min-h-lvh` 가능 |
| 채팅 메시지 영역 | `100dvh` 기반 flex |
| Hero | 콘텐츠에 따라 `min-h-svh`; 고정 full screen 강제 금지 |

**BAD**

```tsx
<main className="h-screen overflow-hidden">
  ...
</main>
```

**GOOD**

```tsx
<main className="flex min-h-svh flex-col">
  <Header className="shrink-0" />
  <section className="min-h-0 flex-1">...</section>
</main>
```

### M-DVH-02 — 주소창 확장·축소

**REPRODUCE**

실기기에서:

1. 페이지를 천천히 아래로 스크롤해 주소창을 숨긴다.
2. 위로 스크롤해 다시 표시한다.
3. Full-screen 영역, sticky Header, bottom CTA가 점프하거나 빈 공간을 만들지 확인한다.
4. 화면 회전 후 반복한다.

**FAIL**

- 주소창이 사라질 때 콘텐츠가 갑자기 늘어나 버튼이 이동
- 다시 나타날 때 하단 CTA가 가려짐
- JS `innerHeight` style 갱신이 과도한 reflow를 유발

**FIX**

CSS `dvh`를 우선 사용한다. 구형 브라우저 fallback만 JS로 처리한다.

```css
.full-viewport {
  min-height: 100vh;
  min-height: 100dvh;
}
```

### M-DVH-03 — Full-screen Chat/Onboarding

**GOOD**

```tsx
<div className="flex h-dvh min-h-0 flex-col overflow-hidden">
  <header className="shrink-0">...</header>
  <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
    ...
  </main>
  <form className="
    shrink-0 border-t bg-background p-3
    pb-[max(.75rem,env(safe-area-inset-bottom))]
  ">
    ...
  </form>
</div>
```

메시지 영역만 스크롤하며 body는 스크롤되지 않게 한다. 새 메시지 도착 시 사용자가 하단 근처에 있을 때만 자동 스크롤한다.

---

## 15. iOS Safari

WebKit 프로젝트 통과를 iOS Safari 실기기 통과로 간주하지 않는다.

### M-IOS-01 — Safari 전용 실행 매트릭스

최소 다음을 검사한다.

```text
[ ] 첫 진입 / 새로고침 / 뒤로가기(BFCache)
[ ] 주소창 축소·확장
[ ] 키보드 열기·닫기
[ ] orientation 변경
[ ] 홈 화면에 추가된 standalone 모드(지원 시)
[ ] 프라이빗 모드
[ ] 추적 방지/콘텐츠 차단 환경
[ ] 200% 확대
[ ] 다크 모드
```

### M-IOS-02 — BFCache와 `pageshow`

**WHY**

Safari는 뒤로가기 시 페이지를 BFCache에서 복원한다. `load`/mount effect가 다시 실행되지 않아 오래된 인증·데이터·타이머 상태가 남을 수 있다.

**REPRODUCE**

1. 목록 → 상세 → 데이터 수정
2. Safari 뒤로가기
3. 목록이 최신인지 확인
4. 로그아웃 → 뒤로가기
5. 보호 화면이 다시 노출되는지 확인

**GOOD**

```tsx
useEffect(() => {
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      router.refresh();
    }
  };
  window.addEventListener('pageshow', onPageShow);
  return () => window.removeEventListener('pageshow', onPageShow);
}, [router]);
```

모든 페이지에서 무조건 refresh하지 않는다. 인증·고변경 데이터처럼 stale이 위험한 경로에서만 적용한다.

### M-IOS-03 — `position: fixed`와 키보드

**WHY**

iOS Safari의 fixed 요소는 키보드·visual viewport와 조합될 때 점프하거나 화면 중간에 남을 수 있다.

**REPRODUCE**

- fixed Header/Bottom Nav/Toast/Sheet가 있는 화면에서 입력 포커스
- 키보드 열기/닫기 5회
- 스크롤 중 포커스 전환
- orientation 변경

**FIX**

Form Overlay는 가능한 한 flex flow 안에서 Header/Body/Footer를 구성하고 fixed 중첩을 줄인다. Visual Viewport 보정은 재현된 영역에만 적용한다.

### M-IOS-04 — 날짜·시간·Select 컨트롤

네이티브 picker가 레이아웃과 값 포맷에 미치는 영향을 확인한다.

- `input[type=date]`의 min/max
- locale에 따른 표시
- 취소 후 값 유지
- Picker 닫힘 후 focus 복귀
- Select option의 긴 라벨
- 다크 모드에서 native control 대비

커스텀 picker를 사용할 경우 키보드·스크린리더·시간대 비용이 크게 증가하므로 명확한 필요가 없으면 native를 우선한다.

### M-IOS-05 — 자동재생·미디어

**PASS**

- 음소거 없는 비디오 자동재생을 기대하지 않는다.
- `playsInline`이 있어 전체 화면 강제 전환을 방지한다.
- 자막/대체 텍스트를 제공한다.
- 네트워크 절약을 위해 preload 정책을 명시한다.

```tsx
<video
  muted
  playsInline
  controls
  preload="metadata"
  poster="/video-poster.webp"
>
  <source src="/demo.mp4" type="video/mp4" />
  <track kind="captions" src="/demo-ko.vtt" srcLang="ko" label="한국어" />
</video>
```

### M-IOS-06 — Link·전화·이메일 자동 탐지

Safari가 숫자를 전화번호로 자동 스타일링해 디자인/동작을 바꾸지 않는지 확인한다. 필요한 경우 명시적 `<a href="tel:">`를 사용하고, 전역 자동 탐지 차단은 실제 요구가 있을 때만 한다.

### M-IOS-07 — Private Mode와 Storage

Storage·IndexedDB 접근 실패가 앱을 죽이지 않는지 확인한다. 프라이빗 모드에서 로그인·테마·초안이 어떻게 동작하는지 사용자에게 명확히 안내한다. 스토리지 접근은 try/catch와 기본값을 가져야 한다.

---

## 16. Android Chrome

### M-AND-01 — 시스템 Back

**WHY**

Android 사용자는 화면 내 뒤로 버튼보다 시스템 Back을 자주 사용한다. Overlay·검색·선택 상태가 history와 맞지 않으면 앱을 의도치 않게 종료하거나 입력을 잃는다.

**검사 순서**

```text
1. 열린 Dialog/Sheet/Drawer 닫기
2. 활성 검색/상세 상태 해제 또는 이전 URL 복원
3. 이전 라우트 이동
4. 앱 종료/브라우저 이전 문서는 마지막
```

각 Overlay를 열고 Android Back을 눌러 위 순서를 확인한다.

### M-AND-02 — 주소창과 브라우저 UI

iOS와 마찬가지로 스크롤 시 상단/하단 browser chrome이 변한다. `dvh`, sticky, bottom CTA를 실제 Chrome에서 확인한다. Android 버전과 제조사 WebView 차이도 기록한다.

### M-AND-03 — Font Scale과 Display Size

**WHY**

Android 사용자는 시스템 Font Size와 Display Size를 별도로 키울 수 있다. CSS 200% 확대와 다른 결과를 만든다.

**REPRODUCE**

1. Font Size를 최대에 가깝게 설정한다.
2. Display Size를 크게 설정한다.
3. 앱을 완전히 재시작한다.
4. Navigation, Card, Form, Toast, Sheet를 확인한다.

**PASS**

- 텍스트가 잘리지 않는다.
- 버튼은 높이가 늘어날 수 있다.
- fixed height를 쓰지 않는다.
- 핵심 정보가 line-clamp로 사라지지 않는다.

### M-AND-04 — Autofill과 Password Manager

**REPRODUCE**

- Chrome Autofill로 이메일·주소·결제 폼 채우기
- 비밀번호 관리자 로그인
- Autofill 배경색에서 텍스트 대비
- 값 주입 후 React state와 실제 input 값 일치
- OTP 자동 채움

**FIX**

표준 `name`, `type`, `autocomplete`를 정확히 사용한다. Autofill을 막지 않는다.

### M-AND-05 — WebView/Installed Mode

제품이 Android WebView, TWA, PWA standalone을 지원한다면 별도 환경으로 검사한다.

- 외부 링크 처리
- 파일 업로드/카메라 권한
- Back
- safe area/display cutout
- 인증 리다이렉트
- 다운로드

지원하지 않는다면 `BLOCKED/OUT OF SCOPE`를 명확히 적는다.

---

## 17. Overscroll과 Bounce

### M-SCROLL-01 — Scroll Chaining

**WHY**

Sheet/Drawer 내부 끝에서 계속 스크롤하면 배경 페이지가 움직이는 scroll chaining이 발생할 수 있다. 사용자는 Overlay가 불안정하다고 느끼고 위치를 잃는다.

**DETECT**

```bash
rg -n "overscroll-(auto|contain|none)|overscroll-behavior" src
rg -n "overflow-y-auto|overflow-auto" src --glob "*.tsx"
```

**GOOD**

```tsx
<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
  ...
</div>
```

`overscroll-none`은 pull-to-refresh 등 브라우저 동작까지 차단할 수 있으므로 국소적으로만 사용한다.

### M-SCROLL-02 — iOS Bounce

iOS의 탄성 스크롤은 플랫폼 기대 동작이다. 무조건 제거하지 않는다. 다음 경우에만 제어한다.

- Full-screen canvas/지도
- Modal 내부 scroll chaining
- drag Sheet와 충돌
- kiosk형 앱

body 전체에 `touch-action:none`을 적용하지 않는다. 확대와 스크롤을 모두 막는다.

### M-SCROLL-03 — Pull-to-refresh와 미저장 Form

**WHY**

Form 상단에서 아래로 당기다가 브라우저 새로고침이 발생해 입력을 잃을 수 있다.

**REPRODUCE**

1. 긴 Form에 값을 입력한다.
2. 페이지 상단에서 pull-to-refresh gesture를 시도한다.
3. 데이터 소실 여부와 경고/초안 복구를 확인한다.

**FIX**

- 중요 Form은 draft 저장과 이탈 경고를 제공한다.
- 브라우저 pull-to-refresh 자체를 전역 차단하기보다 데이터 손실을 방지한다.
- 설치형 앱에서만 필요하면 root에 `overscroll-behavior-y:none`을 검토한다.

### M-SCROLL-04 — Sticky와 Nested Scroll

Sticky는 가장 가까운 scroll container 기준으로 동작한다. 조상 `overflow:hidden/auto`가 예상치 못한 기준을 만들 수 있다.

**DETECT**

```bash
rg -n "sticky" src --glob "*.tsx" -B8
rg -n "overflow-(hidden|auto|scroll)" src --glob "*.tsx"
```

**REPRODUCE**

각 sticky 요소가 다음 조건에서 유지되는지 확인한다.

- 문서 스크롤
- 내부 panel 스크롤
- orientation 변경
- 키보드 열림
- safe area

---

## 18. Fold Device

폴드 기기는 단순히 넓은 모바일이 아니다. 접힘 경계, 두 viewport segment, 자세 변화, 앱 창 크기 변경이 있다.

### M-FOLD-01 — 연속 폭 Reflow

**WHY**

기기를 펼칠 때 페이지 reload 없이 viewport가 크게 바뀐다. 초기 폭만 읽어 state에 저장하면 레이아웃이 이전 상태로 남는다.

**DETECT**

```bash
rg -n "window\\.innerWidth" src
rg -n "useState\\([^)]*innerWidth|isMobile" src
```

**BAD**

```tsx
const [mobile] = useState(window.innerWidth < 768);
```

**GOOD**

CSS를 우선 사용한다.

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
  ...
</div>
```

JS 기능 분기가 꼭 필요하면 `matchMedia` change를 구독하고 정리한다.

### M-FOLD-02 — Hinge/Viewport Segment

두 segment를 지원하는 환경에서는 CTA·Dialog·중요 텍스트가 hinge 위에 놓이지 않게 한다. CSS 환경 변수 지원 여부를 기능 탐지한다.

```css
@media (horizontal-viewport-segments: 2) {
  .fold-layout {
    display: grid;
    grid-template-columns:
      env(viewport-segment-width 0 0)
      env(viewport-segment-width 1 0);
    column-gap:
      calc(
        env(viewport-segment-left 1 0) -
        env(viewport-segment-right 0 0)
      );
  }
}
```

지원 범위가 제한적이므로 기본 단일 열 레이아웃이 항상 안전하게 동작해야 한다.

### M-FOLD-03 — Posture와 Dual-pane

**검사 시나리오**

- 접힌 portrait
- 펼친 portrait
- 펼친 landscape
- tabletop posture
- 앱 분할 화면
- 폭을 연속으로 줄였다 늘리기

**PASS**

- 상태와 스크롤이 유지된다.
- 상세가 두 번째 pane에 열려도 Back/접근성 순서가 명확하다.
- Overlay가 hinge를 가로지르지 않는다.
- 두 pane이 불가능하면 안전한 단일 pane으로 폴백한다.

### M-FOLD-04 — Multi-window와 Resize

Android split-screen, iPad Stage Manager와 유사한 연속 resize를 고려한다. “기기 폭이 넓으니 데스크톱”이 아니라 **현재 앱 viewport**를 기준으로 레이아웃한다.

**REGRESSION**

Playwright에서 연속 resize로 상태 보존을 검사한다.

```ts
test('viewport 연속 변경에도 상태가 유지된다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/wizard');
  await page.getByLabel('회사명').fill('Acme');

  for (const size of [
    { width: 720, height: 900 },
    { width: 884, height: 1104 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(size);
    await expect(page.getByLabel('회사명')).toHaveValue('Acme');
  }
});
```

---

## 19. Mobile CLS와 Visual Stability

### M-CLS-01 — Mobile CLS 측정

**WHY**

모바일 화면은 좁아 작은 높이 변화도 아래 콘텐츠를 크게 밀어낸다. 사용자가 탭하려는 순간 CTA가 이동하면 잘못된 동작이 실행된다.

**REPRODUCE**

프로덕션 빌드와 모바일 스로틀에서 측정한다.

```ts
async function collectCls(page: Page, duration = 5000) {
  return page.evaluate(ms => new Promise<{
    value: number;
    sources: { value: number; nodes: string[] }[];
  }>(resolve => {
    let value = 0;
    const sources: { value: number; nodes: string[] }[] = [];

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries() as any[]) {
        if (entry.hadRecentInput) continue;
        value += entry.value;
        sources.push({
          value: entry.value,
          nodes: (entry.sources ?? []).map((s: any) => {
            const n = s.node as HTMLElement | null;
            return n
              ? `${n.tagName}.${String(n.className).slice(0, 80)}`
              : 'unknown';
          }),
        });
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => {
      observer.disconnect();
      resolve({ value, sources });
    }, ms);
  }), duration);
}
```

**판정**

- 목표: `CLS ≤ 0.1`
- 경고: `0.1 < CLS ≤ 0.25`
- 실패: `CLS > 0.25`
- Primary CTA 이동으로 오작동 가능성이 있으면 수치와 무관하게 S1/S2

### M-CLS-02 — 이미지·광고·Embed 공간 예약

**DETECT**

```bash
rg -n "<img " src
rg -n "<Image" src -A6 | rg -v "width=|height=|fill"
rg -n "iframe|video|canvas" src --glob "*.tsx"
```

**FIX**

- Image에 width/height 또는 부모 aspect ratio
- 광고/추천 슬롯에 예상 min-height
- iframe/video에 aspect ratio
- Canvas에 컨테이너 기반 크기

**BAD**

```tsx
{data && <img src={data.banner} alt="" />}
```

**GOOD**

```tsx
<div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
  {data ? (
    <Image src={data.banner} alt={data.alt} fill sizes="100vw" />
  ) : (
    <BannerSkeleton />
  )}
</div>
```

### M-CLS-03 — 폰트와 텍스트 재배치

모바일에서 한글 웹폰트가 늦게 도착하면 줄 수가 바뀌어 큰 CLS가 생긴다.

**PASS**

- `next/font` 또는 self-host
- `display: swap`/`optional`
- fallback metric 조정
- 필요한 weight만
- 긴 한글·영문 모두 줄 수 변화가 허용 범위

### M-CLS-04 — 비동기 배너·Toast·Consent

**WHY**

쿠키 배너·설치 배너·프로모션을 페이지 상단에 나중에 삽입하면 전체 화면이 이동한다.

**FIX**

- 레이아웃 공간을 초기부터 예약
- 또는 viewport overlay로 표시하되 콘텐츠와 CTA를 가리지 않음
- Toast는 문서 flow에 삽입하지 않음
- 배너 닫힘 상태를 SSR에서 알 수 있도록 cookie 사용

**BAD**

```tsx
{mounted && showBanner && <PromoBanner />}
```

**GOOD**

```tsx
// 서버가 cookie를 읽어 첫 HTML부터 일관되게 렌더
export default async function Layout({ children }: Props) {
  const dismissed = (await cookies()).has('promo-dismissed');
  return (
    <>
      {!dismissed && <PromoBanner />}
      {children}
    </>
  );
}
```

### M-CLS-05 — Skeleton → Content 일치

Skeleton의 행 수, 높이, gap, image aspect ratio가 실제 콘텐츠와 일치해야 한다. 높이 차이는 8~24px 이내를 목표로 한다.

**REGRESSION**

```ts
test('모바일 홈 CLS가 예산 이내다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const result = await collectCls(page);
  expect(result.value, JSON.stringify(result.sources, null, 2))
    .toBeLessThanOrEqual(0.1);
});
```

---

## 20. Mobile Performance

### 20.1 기본 예산

| 지표 | 목표 | FAIL |
|------|------|------|
| LCP | ≤ 2.5s | > 4.0s |
| CLS | ≤ 0.1 | > 0.25 |
| INP | ≤ 200ms | > 500ms |
| TTFB | ≤ 800ms | > 1.8s |
| 초기 JS | ≤ 200kB gzip 권장 | > 350kB |
| 첫 화면 이미지 | ≤ 1MB | > 2MB |
| Long Task | 50ms 초과 최소화 | 핵심 입력에서 200ms+ |

프로젝트 특성에 맞게 예산을 변경할 수 있지만, 변경 이유와 승인자를 기록한다. 현재 수치에 맞춰 예산을 느슨하게 바꾸지 않는다.

### M-PERF-01 — 실제 모바일 조건

**실행 조건**

```text
Build: production
CPU: 4× slowdown
Network: 150ms latency / 1.6Mbps down / 750Kbps up
Cache: cold와 warm 둘 다
Runs: 최소 3회, 중위값 보고
```

**Playwright CDP**

```ts
const session = await page.context().newCDPSession(page);
await session.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: 1.6e6 / 8,
  uploadThroughput: 750e3 / 8,
});
await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
```

WebKit에는 CDP 스로틀이 적용되지 않으므로 Chromium에서 성능 예산을 자동화하고 실기기 Safari에서 체감/필드 데이터를 보완한다.

### M-PERF-02 — LCP

**절차**

1. Performance trace에서 LCP 요소를 특정한다.
2. 리소스 발견 시점, 다운로드 시작, render delay를 분리한다.
3. 이미지면 크기·priority·preload·`sizes`를 확인한다.
4. 텍스트면 폰트와 서버 대기를 확인한다.
5. Server Component waterfall을 확인한다.

**BAD**

```tsx
const Hero = dynamic(() => import('./hero'), { ssr: false });
```

LCP Hero를 client-only dynamic import로 만들면 HTML → JS → chunk → render의 긴 경로가 생긴다.

**GOOD**

```tsx
export default async function Page() {
  const hero = await getCachedHeroCopy();
  return (
    <section>
      <h1>{hero.title}</h1>
      <Image
        src={hero.image}
        alt={hero.alt}
        width={1200}
        height={900}
        sizes="100vw"
        priority
      />
    </section>
  );
}
```

### M-PERF-03 — INP와 Main Thread

**REPRODUCE**

- 메뉴 열기
- 검색 입력
- 필터 변경
- Drawer/Sheet 열기
- Form 제출
- 대형 목록 스크롤

각 동작에서 50ms 이상 long task와 200ms 이상 반응 지연을 찾는다.

**FIX 순서**

1. 상단 `'use client'` 경계를 내린다.
2. 무거운 widget을 dynamic import한다.
3. 이벤트 핸들러 동기 작업을 분할한다.
4. 대형 목록을 페이지네이션/가상화한다.
5. 상태 범위를 줄인다.
6. 측정 후에만 memoization을 추가한다.

### M-PERF-04 — 모바일 이미지

**PASS**

- 정확한 `sizes`
- LCP 1개만 priority
- viewport 밖 lazy
- AVIF/WebP
- 모바일에 불필요한 desktop 원본 다운로드 없음
- 장식 이미지는 좁은 폭에서 숨길 경우 다운로드도 방지

`display:none`만으로 `<img>` 다운로드를 항상 막을 수 있다고 가정하지 않는다. `<picture>` 또는 서버 렌더 분기보다 반응형 Image source를 사용한다.

### M-PERF-05 — 3D·Canvas·Animation

모바일 GPU·배터리를 고려한다.

- viewport 밖이면 렌더 loop 정지
- `prefers-reduced-motion`에서 정적 fallback
- WebGL context loss 처리
- low-power 기기 fallback
- DPR 상한 설정
- 모델/텍스처 지연 로드

**GOOD**

```tsx
<Canvas
  dpr={[1, 1.5]}
  frameloop={visible ? 'always' : 'never'}
  gl={{ powerPreference: 'high-performance', antialias: false }}
  onCreated={({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', showFallback);
  }}
>
  ...
</Canvas>
```

fallback은 기능을 잃지 않도록 정적 이미지와 CTA를 제공한다.

### M-PERF-06 — 메모리와 장수 세션

저메모리 모바일에서 다음을 반복한다.

1. P0 라우트 왕복 20회
2. Sheet/Drawer 30회 열기/닫기
3. 이미지 목록 5페이지 로드
4. 앱 background → foreground
5. 브라우저 탭 전환

크래시, reload, 빈 canvas, 이벤트 중복, 메모리 단조 증가를 확인한다.

### M-PERF-07 — 필드 데이터

가능하면 RUM으로 실제 p75를 수집한다.

```tsx
'use client';

export function WebVitalsReporter() {
  useReportWebVitals(metric => {
    navigator.sendBeacon('/api/vitals', JSON.stringify({
      ...metric,
      path: location.pathname,
      connection: (navigator as any).connection?.effectiveType,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    }));
  });
  return null;
}
```

사용자 식별정보와 전체 URL query를 그대로 전송하지 않는다.

---

## 21. Mobile Accessibility

### M-A11Y-01 — 200% 확대

**REPRODUCE**

1. pinch zoom 200%
2. 각 P0 플로우 수행
3. 확대 상태에서 Drawer/Sheet 열기
4. 포커스·스크롤·CTA 접근 확인

**FAIL**

- 확대 차단
- 고정 UI가 대부분의 viewport를 차지
- Overlay 닫기 불가
- 입력이 화면 밖으로 이동

### M-A11Y-02 — 스크린리더 Touch Exploration

iOS VoiceOver와 Android TalkBack에서 검사한다.

```text
[ ] 페이지 제목과 첫 Heading을 찾을 수 있다.
[ ] Landmark/Heading 탐색이 가능하다.
[ ] 아이콘 버튼의 이름이 명확하다.
[ ] Bottom Nav 현재 상태를 읽는다.
[ ] Sheet/Drawer 열림이 안내되고 배경을 탐색하지 않는다.
[ ] Form 라벨·힌트·오류·필수 상태를 읽는다.
[ ] 저장/로딩/완료 상태를 live region으로 알린다.
[ ] Swipe 순서가 시각 순서와 일치한다.
```

자동 axe만으로 Touch Exploration을 PASS하지 않는다.

### M-A11Y-03 — Orientation

WCAG 1.3.4에 따라 콘텐츠는 본질적 이유가 없으면 한 방향으로 제한하지 않는다. Portrait-only 안내를 띄우고 기능을 차단하지 않는다.

### M-A11Y-04 — Target Size와 Spacing

§9의 44×44 제품 기준을 적용한다. WCAG 예외를 최소 기준 충족을 피하는 핑계로 사용하지 않는다.

### M-A11Y-05 — Gesture 대체

Swipe, pinch, drag, long press에 단순 pointer 대체를 제공한다.

| Gesture | 대체 |
|---------|------|
| Swipe delete | 삭제 버튼 |
| Pinch zoom map | +/- 버튼 |
| Drag reorder | 위/아래 이동 버튼 |
| Long press menu | 더보기 버튼 |
| Two-finger action | 단일 탭 메뉴 |

### M-A11Y-06 — Motion

`prefers-reduced-motion`에서 Sheet spring, parallax, auto carousel, scroll animation을 축소한다. 기능적 상태 변화는 유지한다.

### M-A11Y-07 — Contrast in Outdoor Conditions

WCAG 수치 외에 햇빛 아래 실제 기기에서 확인한다.

- muted text
- disabled state
- placeholder
- thin border
- focus ring
- Toast
- scrim 위 Sheet

정보를 색상으로만 구분하지 않는다.

---

## 22. Network·Offline·Installation

### M-NET-01 — Offline 중 입력 보존

**REPRODUCE**

```ts
await page.goto('/compose');
await page.getByLabel('본문').fill('보존해야 할 초안');
await page.context().setOffline(true);
await page.getByRole('button', { name: '저장' }).click();
await expect(page.getByRole('alert')).toContainText(/오프라인|연결/);
await expect(page.getByLabel('본문')).toHaveValue('보존해야 할 초안');
```

**PASS**

- 오류가 네트워크 문제임을 설명한다.
- 입력이 유지된다.
- 재시도 버튼이 있다.
- 온라인 복귀 후 수동/자동 재시도가 가능하다.
- 중복 저장을 방지한다.

### M-NET-02 — 느린 업로드

파일/이미지 업로드에서 확인한다.

- 진행률
- 취소
- background/foreground 복귀
- 네트워크 단절 후 재시도
- 대용량 거부
- 중복 업로드 방지
- 화면 잠금 중 상태

진행률을 알 수 없으면 indeterminate 상태와 예상 설명을 제공한다. 성공 전 완료 UI를 표시하지 않는다.

### M-NET-03 — Save-Data와 저속 연결

`navigator.connection.saveData`와 `effectiveType`은 보조 신호로 사용한다. 핵심 콘텐츠를 제거하지 말고 고비용 장식·자동재생·고해상도 이미지를 줄인다.

```tsx
const saveData =
  typeof navigator !== 'undefined' &&
  (navigator as any).connection?.saveData;

return saveData
  ? <Image src="/hero-static.webp" alt={alt} ... />
  : <HeroVideo />;
```

첫 렌더 분기를 브라우저 API로 만들면 hydration 문제가 생기므로 마운트 후 enhancement 또는 Client Hint/서버 정책을 사용한다.

### M-NET-04 — PWA/Standalone (지원 시)

지원하는 경우 다음을 검사한다.

```text
[ ] manifest 이름·아이콘·theme_color·background_color
[ ] iOS Add to Home Screen
[ ] Android Install
[ ] standalone safe area
[ ] 인증 redirect
[ ] 새 버전 업데이트 안내
[ ] service worker stale asset
[ ] offline fallback
[ ] 외부 링크 브라우저 전환
```

PWA를 지원하지 않으면 문서에 OUT OF SCOPE로 명시한다.

---

## 23. Playwright 자동화 전략

### 23.1 프로젝트 구성

모바일 자동화는 폭 매트릭스와 실제 device descriptor를 분리한다.

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: '.auth/user.json',
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 13'],
        storageState: '.auth/user.json',
      },
    },
    {
      name: 'mobile-guest',
      use: {
        ...devices['iPhone 13'],
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
});
```

### 23.2 Viewport Matrix Helper

```ts
export const MOBILE_PORTRAITS = [
  { name: 'w320-short', width: 320, height: 568 },
  { name: 'w360', width: 360, height: 800 },
  { name: 'w375', width: 375, height: 812 },
  { name: 'w390', width: 390, height: 844 },
  { name: 'w393', width: 393, height: 852 },
  { name: 'w412', width: 412, height: 915 },
  { name: 'w430', width: 430, height: 932 },
] as const;

export const MOBILE_LANDSCAPES = [
  { name: 'small-landscape', width: 568, height: 320 },
  { name: 'iphone-landscape', width: 844, height: 390 },
  { name: 'android-landscape', width: 915, height: 412 },
] as const;
```

### 23.3 공용 Mobile Audit Helper

```ts
import { expect, type Page } from '@playwright/test';

export async function auditMobileFrame(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;

    const overflow = root.scrollWidth - viewportWidth;

    const overflowElements =
      [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return el.offsetParent !== null &&
            (r.right > viewportWidth + 1 || r.left < -1);
        })
        .slice(0, 15)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 40),
          className: String(el.className).slice(0, 120),
        }));

    const undersized =
      [...document.querySelectorAll<HTMLElement>(
        '[data-critical-touch-target]'
      )]
        .filter(el => el.offsetParent !== null)
        .map(el => {
          const r = el.getBoundingClientRect();
          return {
            name: el.getAttribute('aria-label') ||
              el.textContent?.trim().slice(0, 40),
            width: r.width,
            height: r.height,
          };
        })
        .filter(x => x.width < 44 || x.height < 44);

    const hiddenFocused =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body &&
      document.activeElement.offsetParent === null;

    return { overflow, overflowElements, undersized, hiddenFocused };
  });

  expect(
    result.overflow,
    `Overflow elements:\n${JSON.stringify(result.overflowElements, null, 2)}`,
  ).toBeLessThanOrEqual(1);
  expect(result.undersized).toEqual([]);
  expect(result.hiddenFocused).toBe(false);
}
```

`data-critical-touch-target`는 테스트 편의를 위한 무차별 test id가 아니라 제품에서 중요 타깃으로 선언한 계약이다. 자동 탐색 결과도 별도 리포트로 남긴다.

### 23.4 Route × Viewport 자동 스모크

```ts
const ROUTES = ['/', '/pricing', '/signup', '/dashboard'];

for (const viewport of MOBILE_PORTRAITS) {
  for (const route of ROUTES) {
    test(`${route} mobile audit @${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);

      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', error => errors.push(error.message));

      await page.goto(route);
      await expect(page.getByRole('main')).toBeVisible();
      await auditMobileFrame(page);
      expect(errors).toEqual([]);

      await expect(page).toHaveScreenshot(
        `${route.replaceAll('/', '_') || 'home'}-${viewport.name}.png`,
        {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
        },
      );
    });
  }
}
```

시각 스냅샷은 안정적인 정적 영역에만 사용한다. 라이브 시간·랜덤 추천·애니메이션을 마스킹하고, 실패했다고 자동으로 기준선을 갱신하지 않는다.

### 23.5 Orientation Test

```ts
test('Form은 orientation 변경 후 값을 유지한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/signup');
  await page.getByLabel('회사명').fill('Acme');
  await page.getByLabel('이메일').fill('qa@acme.test');

  await page.setViewportSize({ width: 844, height: 390 });

  await expect(page.getByLabel('회사명')).toHaveValue('Acme');
  await expect(page.getByLabel('이메일')).toHaveValue('qa@acme.test');
  await auditMobileFrame(page);
  await expect(page.getByRole('button', { name: '가입' }))
    .toBeInViewport();
});
```

### 23.6 Fixed UI 가림 Test

```ts
test('하단 고정 UI가 마지막 콘텐츠를 가리지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/terms');
  const last = page.getByTestId('last-content');
  await last.scrollIntoViewIfNeeded();

  const overlap = await page.evaluate(() => {
    const content =
      document.querySelector<HTMLElement>('[data-testid="last-content"]')!
        .getBoundingClientRect();
    const fixed = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(el => {
        const p = getComputedStyle(el).position;
        return (p === 'fixed' || p === 'sticky') &&
          el.getBoundingClientRect().bottom >= innerHeight - 1;
      })
      .map(el => el.getBoundingClientRect());

    return fixed.some(r =>
      r.top < content.bottom &&
      r.bottom > content.top &&
      r.left < content.right &&
      r.right > content.left);
  });

  expect(overlap).toBe(false);
});
```

### 23.7 Touch Test

```ts
test('한 번의 tap은 요청을 한 번만 보낸다', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/items', async route => {
    if (route.request().method() === 'POST') calls++;
    await route.continue();
  });

  await page.goto('/items/new');
  await page.getByLabel('제목').fill('Mobile QA');
  await page.getByRole('button', { name: '만들기' }).tap();
  await expect(page.getByText('만들었습니다')).toBeVisible();
  expect(calls).toBe(1);
});
```

### 23.8 Offline과 느린 네트워크

```ts
test('오프라인 저장 실패에서 입력이 유지된다', async ({ page }) => {
  await page.goto('/compose');
  const body = page.getByLabel('본문');
  await body.fill('중요한 초안');

  await page.context().setOffline(true);
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('alert')).toContainText(/오프라인|연결/);
  await expect(body).toHaveValue('중요한 초안');

  await page.context().setOffline(false);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByText('저장했습니다')).toBeVisible();
});
```

### 23.9 Axe와 Mobile State

초기 화면만 검사하지 않는다. Drawer·Sheet·오류·로딩 상태를 각각 연 뒤 axe를 실행한다.

```ts
test('모바일 Sheet 열린 상태 axe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/items');
  await page.getByRole('button', { name: '필터' }).click();

  const results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();

  const serious = results.violations.filter(v =>
    ['critical', 'serious'].includes(v.impact ?? ''));
  expect(serious).toEqual([]);
});
```

### 23.10 자동화로 검증할 수 없는 항목

다음은 자동 PASS 판정을 금지한다.

- 실제 iOS 키보드 가림
- Notch/Dynamic Island의 물리적 겹침
- Android 시스템 Font Scale
- VoiceOver/TalkBack touch exploration
- 햇빛 아래 대비
- 실제 한 손 thumb reach
- iOS bounce 감각
- Fold hinge
- OS Autofill/Password Manager

자동 테스트는 해당 코드 계약과 근사 조건만 검증하고 Final Report에서는 실기기 결과를 별도 표로 기록한다.

---

## 24. Regression 절차

### 24.1 결함 수정 루프

```text
1. Finding을 동일 조건에서 재현한다.
2. 실패하는 Playwright 또는 unit test를 작성한다.
3. 테스트가 수정 전 실제로 FAIL하는지 확인한다.
4. 최소 변경으로 원인을 수정한다.
5. 새 테스트를 실행해 PASS를 확인한다.
6. 인접 폭: 문제 폭 -1/+1, 필수 7폭을 검사한다.
7. 인접 방향: portrait/landscape를 검사한다.
8. 인접 엔진: Chromium/WebKit을 검사한다.
9. 인접 상태: loading/error/empty/success를 검사한다.
10. 전체 Mobile Regression Gate를 실행한다.
```

### 24.2 Mobile Regression Gate

```bash
# G1 — 정적
npm run lint
npx tsc --noEmit

# G2 — 단위/컴포넌트
npm test

# G3 — 프로덕션 빌드
npm run build

# G4 — 모바일 Chromium
cd e2e
npx playwright test --project=mobile-chrome

# G5 — 모바일 WebKit
npx playwright test --project=mobile-webkit

# G6 — Guest/Auth 경계
npx playwright test --project=mobile-guest

# G7 — 모바일 접근성/성능
npx playwright test tests/mobile-a11y.spec.ts tests/mobile-perf.spec.ts

# G8 — 결정성
npx playwright test tests/mobile-critical.spec.ts --repeat-each=3

# G9 — 실기기
# iOS Safari P0 smoke
# Android Chrome P0 smoke
```

### 24.3 인접 회귀면

| 수정 영역 | 반드시 재검사 |
|-----------|---------------|
| Header | 모든 라우트, portrait/landscape, safe area, Drawer |
| Bottom Nav/CTA | 페이지 끝, 키보드, Sheet, safe area |
| Input | iOS zoom, IME, autofill, error focus, keyboard |
| `vh`/height | 주소창, keyboard, orientation, Sheet |
| overflow | 7개 폭, 긴 텍스트, table, zoom 200% |
| z-index | Drawer, Sheet, Toast, Tooltip, Header 조합 |
| breakpoint | 경계 -1/0/+1, fold resize |
| touch handler | 단일 실행, pointer cancel, scroll |

### 24.4 기준선 갱신 규칙

시각 snapshot 실패 시 다음 순서를 따른다.

1. diff를 연다.
2. 예상 변경인지 Finding인지 판단한다.
3. 예상 변경이면 사람 승인 근거를 남긴다.
4. 그 후에만 `--update-snapshots`.
5. snapshot 갱신을 결함 수정과 같은 논리 변경에 포함하되 무관한 기준선은 갱신하지 않는다.

### 24.5 Regression PASS

```text
[ ] 원래 재현 절차 PASS
[ ] 새 테스트가 수정 전 FAIL / 수정 후 PASS
[ ] 필수 7폭 PASS
[ ] landscape 3폭 PASS
[ ] Chromium/WebKit PASS
[ ] console/pageerror 0
[ ] CLS·LCP·INP 예산 회귀 없음
[ ] iOS/Android 실기기 P0 PASS 또는 명시적 BLOCKED
[ ] 3회 반복에서 flaky 0
```

---

## 25. Final Report

리포트는 채팅에 작성한다. 영구 QA 결과 파일을 리포지토리에 쌓지 않는다. 증거 이미지는 `tmp/qa/mobile/<date>/`처럼 비커밋 경로에 둔다.

````markdown
# Mobile QA Report — <프로젝트>

- **일시:** YYYY-MM-DD HH:mm KST
- **브랜치/커밋:** `<branch>` @ `<sha>`
- **환경:** production build | dev
- **Overall:** PASS | FAIL | BLOCKED
- **배포 판정:** 가능 | 불가

## 1. Executive Summary

<검사 범위, S0/S1/S2 수, 핵심 결함, 성능 수치, 실기기 상태를 4~6문장으로 작성>

## 2. Project Binding

<§3의 YAML을 실측값으로 채운다>

## 3. Device Matrix

| 환경 | OS/Engine | Viewport | P0 | P1 | 비고 |
|------|-----------|----------|----|----|------|
| Playwright Chromium | Chromium <ver> | 320~430 | PASS | PASS | 자동 |
| Playwright WebKit | WebKit <ver> | iPhone 13 | FAIL | PASS | F-003 |
| iPhone 15 | iOS 18 / Safari | 393×852 | PASS | PASS | 실기기 |
| Pixel 8 | Android 16 / Chrome | 412×915 | BLOCKED | BLOCKED | 기기 없음 |

## 4. Viewport Matrix

| Route | 320 | 360 | 375 | 390 | 393 | 412 | 430 | Landscape |
|-------|-----|-----|-----|-----|-----|-----|-----|-----------|
| `/` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/signup` | FAIL | PASS | PASS | PASS | PASS | PASS | PASS | FAIL |

## 5. Area Results

| Area | ID | Verdict | Evidence |
|------|----|---------|----------|
| Viewport | M-VP-01 | FAIL | `/signup` 320px overflow +18px |
| Safe Area | M-SAFE-01 | PASS | iPhone 15 portrait/landscape |
| Touch | M-TOUCH-01 | FAIL | close 32×32 |
| Keyboard | M-KBD-01 | FAIL | iOS keyboard가 submit 가림 |
| Dynamic Viewport | M-DVH-02 | PASS | 주소창 전환 점프 0 |
| Fold | M-FOLD-03 | BLOCKED | fold device/remote 없음 |
| CLS | M-CLS-01 | FAIL | `/` CLS 0.18 |

## 6. Findings

### F-001 · S1 · iOS 키보드가 가입 제출 버튼을 가림

- **검사 ID:** M-KBD-01
- **위치:** `src/app/signup/signup-form.tsx:142`
- **환경:** iPhone 15 / iOS 18 / Safari / portrait 393×852
- **재현:**
  1. `/signup` 진입
  2. 마지막 입력 포커스
  3. 키보드가 열린 상태에서 오류 제출
  4. 제출 버튼과 오류 메시지가 키보드 뒤에 위치
- **Expected:** 입력·오류·제출 버튼이 visual viewport 안에 보임
- **Actual:** 하단 112px가 가려지고 스크롤로 접근 불가
- **Root Cause:** Form container가 `h-screen overflow-hidden`; layout viewport 기준 높이 고정
- **Fix Principle:** `h-dvh` + `min-h-0` 내부 스크롤, Footer flow 배치
- **Regression:** `e2e/tests/mobile-signup.spec.ts`
- **Status:** Open | Fixed | Deferred

## 7. Performance

| Route | LCP | CLS | INP | TTFB | JS | Verdict |
|-------|-----|-----|-----|------|----|---------|
| `/` | 2.3s | 0.18 | 160ms | 510ms | 174kB | FAIL(CLS) |
| `/signup` | 1.9s | 0.04 | 140ms | 460ms | 132kB | PASS |

조건: production, 4× CPU, 150ms/1.6Mbps, 3회 중위값

## 8. Accessibility

| Check | iOS VoiceOver | Android TalkBack | Automation |
|-------|---------------|------------------|------------|
| Navigation | PASS | BLOCKED | PASS |
| Sheet focus | FAIL | BLOCKED | FAIL |
| Zoom 200% | PASS | BLOCKED | n/a |
| Target 44×44 | visual PASS | visual BLOCKED | FAIL 2개 |

## 9. Regression Gates

| Gate | Verdict | Evidence |
|------|---------|----------|
| G1 lint/tsc | PASS | exit 0 |
| G2 unit | PASS | 180 passed |
| G3 build | PASS | exit 0 |
| G4 mobile Chrome | PASS | 94 passed |
| G5 mobile WebKit | FAIL | 2 failed |
| G6 guest | PASS | 22 passed |
| G7 a11y/perf | FAIL | CLS 1, axe serious 1 |
| G8 repeat×3 | PASS | flaky 0 |
| G9 real devices | BLOCKED | Android 없음 |

## 10. Deployment Decision

- **배포 가능:** 아니오
- **차단 Finding:** F-001, F-003
- **최소 해제 조건:** S1 수정, WebKit/a11y gate PASS, iOS 재검증
- **남은 Blocker:** Android 실기기 검증
````

### 25.1 보고 규칙

1. 검사하지 않은 항목은 삭제하지 않고 BLOCKED/OUT OF SCOPE로 기록한다.
2. 에뮬레이션과 실기기 결과를 같은 행에 섞지 않는다.
3. “모바일 문제 있음” 대신 viewport·OS·브라우저·방향을 명시한다.
4. 성능은 3회 중위값과 조건을 기록한다.
5. 스크린샷만 첨부하지 않고 재현 절차와 root cause를 작성한다.
6. S0/S1이 하나라도 열려 있으면 배포 불가로 판정한다.

---

## 부록 A — 실행 명령

```bash
# 프로젝트 정적 검사
npm run lint
npx tsc --noEmit
npm test
npm run build

# 프로덕션 앱
npm run build && npm start

# 모바일 전체
cd e2e
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-webkit
npx playwright test --project=mobile-guest

# 특정 테스트
npx playwright test tests/mobile-layout.spec.ts --project=mobile-chrome
npx playwright test tests/mobile-keyboard.spec.ts --project=mobile-webkit --headed

# 디버깅
npx playwright test --project=mobile-webkit --headed --debug
npx playwright show-report
npx playwright show-trace test-results/<test>/trace.zip

# 결정성
npx playwright test tests/mobile-critical.spec.ts --repeat-each=3

# 정적 위험 스캔
rg -n "100vh|h-screen|min-h-screen" src
rg -n "overflow-x-hidden|overflow-hidden" src
rg -n "position: fixed|fixed.*bottom-0|bottom-0.*fixed" src
rg -n "user-scalable|maximum-scale" src
rg -n "safe-area-inset|viewportFit" src
rg -n "onTouch(Start|End)|touch-action" src
rg -n "window\\.innerWidth|isMobile" src
rg -n "text-(xs|sm)" src --glob "*.tsx"
```

---

## 부록 B — Agent 체크리스트

```text
Mobile QA · <project> · <date>

Discovery
[ ] Project Binding 작성
[ ] P0/P1 Route Inventory
[ ] Fixed UI Inventory
[ ] Overlay Inventory
[ ] Critical Form Inventory
[ ] 실기기 접근 가능 여부

Viewport
[ ] 320×568
[ ] 360×800
[ ] 375×812
[ ] 390×844
[ ] 393×852
[ ] 412×915
[ ] 430×932
[ ] breakpoint -1/0/+1
[ ] zoom 200%
[ ] 긴 문자열
[ ] font scale

Landscape / Orientation
[ ] 568×320
[ ] 844×390
[ ] 915×412
[ ] 입력값 유지
[ ] 포커스 유지
[ ] CTA 접근

Safe Area
[ ] viewport-fit=cover
[ ] notch portrait
[ ] notch landscape
[ ] home indicator
[ ] bottom nav padding
[ ] content bottom padding

Touch / Thumb
[ ] 핵심 44×44
[ ] 인접 타깃 겹침 0
[ ] destructive 분리
[ ] touch/click 중복 0
[ ] pointer cancel
[ ] hover-only 0
[ ] 한 손 Primary CTA

Overlay
[ ] Bottom Sheet focus trap
[ ] Sheet internal scroll
[ ] Sheet drag vs scroll
[ ] Sheet keyboard
[ ] Sheet Android Back
[ ] Drawer width
[ ] Drawer background lock
[ ] Drawer route close
[ ] 닫힘 후 focus 복귀

Keyboard / Form
[ ] first/middle/last input
[ ] iOS keyboard
[ ] Android keyboard
[ ] landscape keyboard
[ ] input font ≥16px iOS
[ ] inputMode/type/autocomplete
[ ] IME 한글
[ ] Next/Done
[ ] error focus
[ ] sticky CTA 충돌 0

Browser
[ ] iOS Safari real device
[ ] address bar
[ ] BFCache
[ ] private mode
[ ] date/select
[ ] Android Chrome real device
[ ] system Back
[ ] Font Scale/Display Size
[ ] Autofill/Password Manager

Scroll / Fold
[ ] scroll chaining
[ ] iOS bounce
[ ] pull-to-refresh draft
[ ] nested sticky
[ ] continuous resize
[ ] folded/unfolded
[ ] hinge BLOCKED 여부
[ ] split-screen

Quality
[ ] CLS ≤0.1
[ ] LCP ≤2.5s
[ ] INP ≤200ms
[ ] TTFB ≤800ms
[ ] initial JS budget
[ ] image budget
[ ] reduced motion
[ ] VoiceOver
[ ] TalkBack
[ ] axe overlay states
[ ] offline draft
[ ] slow upload

Regression
[ ] defect test red → green
[ ] 필수 7폭
[ ] landscape 3폭
[ ] Chromium
[ ] WebKit
[ ] Guest/Auth
[ ] repeat×3 flaky 0
[ ] real-device P0
[ ] Final Report
```

마지막으로 Agent는 모든 PASS 판정에 증거가 있는지 확인한다. “에뮬레이터에서 괜찮아 보임”은 실기기 항목의 증거가 아니다. 실제 기기에서 확인하지 못한 safe area, keyboard, browser chrome, VoiceOver/TalkBack, fold 항목은 반드시 BLOCKED로 남긴다.

