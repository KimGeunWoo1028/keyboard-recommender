# 03_Desktop_QA.md — Cursor QA Master Suite · Desktop Playbook

> **문서 등급:** ★★★★★ · 데스크톱 전용 QA 실행 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind CSS · Playwright
> **기준 브라우저:** Chrome · Edge · Firefox · Safari (macOS)
> **필수 CSS 폭:** 1024 · 1280 · 1366 · 1440 · 1536 · 1600 · 1920 · 2560 · 3840
> **필수 Windows 배율:** 100% · 125% · 150% · 175% · 200%
> **필수 브라우저 줌:** 80% · 90% · 100% · 110% · 125% · 150%
> **독립성:** 이 문서는 `01_Core_QA.md` 없이도 단독으로 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 실행하는 명령형 매뉴얼. 사람이 눈으로 훑는 체크리스트가 아니다.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding과 데스크톱 인벤토리](#3-project-binding과-데스크톱-인벤토리)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [Desktop Viewport Matrix](#5-desktop-viewport-matrix)
6. [Windows Display Scaling](#6-windows-display-scaling)
7. [Browser Zoom](#7-browser-zoom)
8. [Wide Screen과 Ultra Wide](#8-wide-screen과-ultra-wide)
9. [Pointer와 Hover](#9-pointer와-hover)
10. [Keyboard와 Focus](#10-keyboard와-focus)
11. [Dropdown · Select · Combobox](#11-dropdown--select--combobox)
12. [Mega Menu](#12-mega-menu)
13. [Tooltip과 Popover](#13-tooltip과-popover)
14. [Sticky와 Scroll](#14-sticky와-scroll)
15. [Sidebar](#15-sidebar)
16. [Dashboard Layout](#16-dashboard-layout)
17. [Data Table](#17-data-table)
18. [Layer와 Overlay Stacking](#18-layer와-overlay-stacking)
19. [Window · Monitor · Browser Chrome](#19-window--monitor--browser-chrome)
20. [Desktop Performance](#20-desktop-performance)
21. [Desktop Accessibility](#21-desktop-accessibility)
22. [Cross Browser](#22-cross-browser)
23. [Playwright 자동화 전략](#23-playwright-자동화-전략)
24. [Regression 절차](#24-regression-절차)
25. [Final Report](#25-final-report)
26. [부록 A — 실행 명령](#부록-a--실행-명령)
27. [부록 B — Agent 체크리스트](#부록-b--agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

데스크톱 QA는 "창을 넓혔을 때 예쁘게 보이는가"를 확인하는 작업이 아니다. 데스크톱은 **물리 해상도 · OS 배율 · 브라우저 줌 · 스크롤바 · 창 크기 · 포인터 정밀도 · 키보드**가 각각 독립적으로 변하는 환경이며, 이 축들이 곱해져 실제 사용 조건을 만든다. 1920×1080 모니터를 쓰는 사용자의 실제 CSS 폭이 1280px일 수 있다는 사실이 이 문서의 출발점이다.

### 1.1 동시에 수행할 역할

- **Principal Frontend Engineer:** 컨테이너 폭 정책, 그리드 규칙, 오버레이 포지셔닝, 스크롤 컨테이너 계층이 전 해상도 구간에서 일관되게 동작하는지 구조적으로 판단한다.
- **UX Auditor:** 넓은 화면에서의 시선 이동 거리, 정보 밀도, 커서 이동 비용, 한 화면에 담기는 작업량을 평가한다. 넓다는 것은 자동으로 좋은 것이 아니다.
- **Accessibility Expert:** 키보드 단독 완주, 포커스 가시성, 200% 줌 reflow, forced-colors 모드, 스크린리더 탐색을 WCAG 2.2 AA 기준으로 검증한다.
- **Performance Engineer:** 큰 DOM, 다수 위젯, 대형 테이블에서의 INP와 렌더 비용을 측정한다. 데스크톱은 CPU가 빠른 대신 **DOM과 데이터가 커진다**.
- **Playwright Automation Engineer:** 해상도 · 배율 · 줌 조합을 자동 매트릭스로 만들고, 발견된 결함마다 실패 테스트를 먼저 작성한다.
- **QA Lead:** PASS / FAIL / BLOCKED만 사용하며, 모든 판정에 재현 절차와 수치 증거를 남긴다.

### 1.2 완료 조건

```text
[ ] 필수 9개 CSS 폭에서 P0/P1 라우트를 검사했다.
[ ] 필수 5개 Windows 배율의 유효 CSS 폭을 계산하고 해당 폭을 검사했다.
[ ] 필수 6개 브라우저 줌 단계에서 P0 라우트를 검사했다.
[ ] 짧은 높이(600~720px) 조건에서 고정 UI와 모달을 검사했다.
[ ] Hover 의존 UI가 키보드·포커스로도 도달 가능함을 확인했다.
[ ] Dropdown · Mega Menu · Tooltip · Popover의 충돌 회피와 키보드 조작을 확인했다.
[ ] Sidebar 접힘/펼침/리사이즈와 상태 지속을 확인했다.
[ ] Dashboard 위젯이 1024~2560 구간에서 붕괴하지 않음을 확인했다.
[ ] Data Table의 sticky · 정렬 · 선택 · 가로 스크롤을 키보드로 검증했다.
[ ] Chrome/Edge/Firefox/Safari 중 최소 3개 엔진에서 P0 라우트를 검사했다.
[ ] 2560 이상 초광폭에서 레이아웃 정책이 의도적임을 확인했다.
[ ] Desktop INP/렌더 예산을 측정했다.
[ ] S0/S1/S2 결함마다 자동 회귀 테스트가 있다.
[ ] Regression Gate 전체를 실행하고 Final Report를 작성했다.
```

Windows 실기기(고배율) 또는 Safari(macOS)에 접근할 수 없으면 해당 항목을 `BLOCKED — 환경 없음`으로 기록한다. 에뮬레이션 결과로 PASS 처리하지 않는다.

---

## 2. 절대 원칙

우선순위 순서이며, 충돌 시 번호가 작은 쪽이 이긴다.

### D-P1. 물리 해상도와 CSS 폭을 절대 혼동하지 않는다

"1920 모니터에서 확인했다"는 정보량이 0이다. 배율과 줌을 곱한 **유효 CSS 폭**만이 레이아웃을 결정한다. 모든 리포트는 `물리 해상도 / 배율 / 줌 / 유효 CSS 폭` 4개를 함께 기록한다.

### D-P2. 넓은 화면을 채우는 것이 목표가 아니다

2560px에서 텍스트를 화면 끝까지 늘리면 한 줄이 200자가 되어 읽을 수 없다. 콘텐츠는 가독 폭으로 제한하고, 남는 공간은 **의도적으로** 여백 또는 병렬 정보로 사용한다.

### D-P3. Hover는 보조 채널이다

hover로만 나타나는 정보·동작은 키보드 사용자와 터치 노트북 사용자를 차단한다. 모든 hover 표현에는 focus 대응 또는 항상 보이는 대체 수단이 있어야 한다.

### D-P4. 데스크톱에서도 높이는 희소 자원이다

1366×768과 1920×1080@150%는 브라우저 크롬과 OS 작업 표시줄을 빼면 세로 600~640px 수준이다. `min-height: 100vh` 히어로, 큰 고정 헤더, 세로로 긴 모달은 이 구간에서 사용 불가가 된다.

### D-P5. 오버레이는 포털과 충돌 회피를 갖는다

Dropdown·Tooltip·Popover는 조상 `overflow`에 잘리지 않아야 하고, 화면 경계에서 flip/shift로 재배치되어야 한다. `z-[9999]`를 늘려가며 해결하는 것은 수정이 아니다.

### D-P6. 스크롤바 폭을 레이아웃에서 무시하지 않는다

Windows 클래식 스크롤바는 약 15~17px을 실제로 차지한다. 1024px 창의 실 사용 폭은 1007px 근처다. 스크롤바 등장/소멸로 레이아웃이 흔들리면 안 된다.

### D-P7. `overflow-x-hidden`으로 넘침을 은폐하지 않는다

문서에 `overflow-x-hidden`을 추가하는 것은 원인 제거가 아니다. 넘치는 요소를 좌표로 특정해 폭·min-width·transform·긴 문자열을 고친다.

### D-P8. 브라우저 줌과 확대는 차단하지 않는다

`user-scalable=no`, `maximum-scale=1`, JS 기반 줌 차단은 금지한다. 200% 줌에서 한 방향 스크롤로 콘텐츠를 읽을 수 있어야 한다(WCAG 1.4.10).

### D-P9. UA 분기로 데스크톱 레이아웃을 만들지 않는다

`isDesktop` UA 판정은 태블릿·폴드·분할 화면·창 축소에서 즉시 틀린다. 레이아웃은 CSS media/container query와 기능 탐지로 만든다.

### D-P10. 측정 없는 성능 주장 금지, 판정은 세 가지만

성능은 before/after 수치로만 말한다. 모든 검사 결과는 PASS / FAIL / BLOCKED 중 하나이며, "아마 괜찮음"이나 조용한 건너뛰기는 금지한다.

### D-P11. 리포트는 채팅에 남기고 리포지토리에 상주시키지 않는다

QA 결과 파일을 저장소에 쌓지 않는다. 스크린샷·트레이스 산출물은 `tmp/qa/desktop/<날짜>/`에 두고 커밋하지 않는다.

### D-P12. Freeze List를 존중한다

생성물, 시각 기준선 스냅샷, 좌표·기하 데이터, 디자인 원본 자산, 프로젝트 룰이 잠근 파일은 QA 중 수정하지 않는다. 문제를 발견하면 Finding으로만 보고한다.

---

## 3. Project Binding과 데스크톱 인벤토리

QA 시작 전 아래 블록을 실측으로 채운다. 추측 금지.

```yaml
desktop_qa_binding:
  app_root:
  package_manager:
  build_command:
  production_command:
  base_url:
  e2e_root:
  playwright_config:
  auth_fixture:

  container_policy:
    max_width_class:        # 예: max-w-screen-xl
    gutter:                 # 예: px-4 md:px-6 lg:px-8
    prose_max_width:        # 예: max-w-[70ch]
    breakpoints:            # tailwind.config 실측값

  p0_routes: []
  p1_routes: []

  desktop_surfaces:
    sidebar:                # 있음/없음 · 접힘 방식 · 상태 저장 위치
    top_nav:
    mega_menu:
    sticky_headers: []
    dashboards: []
    data_tables: []
    dropdowns: []
    tooltips: []
    modals: []

  environments:
    windows_device:         # 물리 해상도 + 배율 접근 가능?
    macos_device:
    safari_version:
    firefox_version:
    edge_version:

  budgets:
    inp_ms: 200
    cls: 0.1
    lcp_ms: 2500
    table_rows_max_dom:     # 가상화 없이 허용할 최대 행 수

  freeze_list: []
```

### 3.1 Repository Discovery

```bash
cat package.json
cat tailwind.config.* | rg -A20 "screens|container"
rg --files src/app | rg "(page|layout|loading|error)\.tsx$"

# 폭 정책
rg -n "max-w-|container|mx-auto" src --glob "*.tsx" | head -60
rg -n "w-\[[0-9]{3,}px\]|min-w-\[[0-9]{3,}px\]" src

# 높이 가정
rg -n "h-screen|min-h-screen|100vh|calc\(100vh" src

# 고정 UI와 레이어
rg -n "fixed|sticky" src --glob "*.tsx"
rg -n "z-\[?[0-9]+\]?" src | rg -o "z-\[?[0-9]+\]?" | sort | uniq -c | sort -rn

# 오버레이 구현
rg -n "Portal|createPortal|Popover|Tooltip|DropdownMenu|Select|HoverCard" src

# hover 의존
rg -n "hover:|group-hover:|onMouseEnter|onMouseLeave|onMouseOver" src

# 테이블
rg -n "<table|role=\"grid\"|aria-sort|colSpan|rowSpan" src

# 스크롤바·줌 관련
rg -n "scrollbar|scrollbar-gutter|overflow-x-hidden" src
rg -n "user-scalable|maximum-scale|devicePixelRatio|window\.innerWidth" src
```

각 히트는 조사 후보다. 런타임에서 재현된 것만 Finding으로 확정한다.

### 3.2 Desktop Surface Inventory

```markdown
| ID | Route | P0/P1 | Sidebar | Sticky | Overlay | Table | Chart | 최소 지원 폭 | 비고 |
|----|-------|-------|---------|--------|---------|-------|-------|--------------|------|
| R01 | `/` | P0 | 없음 | Header | Mega Menu | 없음 | 없음 | 1024 | 마케팅 |
| R02 | `/dashboard` | P0 | 있음(접힘) | Header+Toolbar | Dropdown/Tooltip | 있음 | 4개 | 1024 | 밀도 높음 |
| R03 | `/settings/members` | P0 | 있음 | Table Header | Dropdown/Modal | 있음(가로 스크롤) | 없음 | 1024 | 대량 행 |
```

검사 우선순위:

1. Sidebar + Table + Dropdown이 동시에 존재하는 화면 (결함 밀도 최상위)
2. Dashboard처럼 위젯이 많고 폭 변화에 민감한 화면
3. Mega Menu와 전역 네비게이션
4. Modal/Drawer가 있는 폼 화면
5. 정적 마케팅·문서 라우트

---

## 4. 실행 파이프라인과 Severity

```text
1. DISCOVER
   폭 정책, 고정 UI, 오버레이, 테이블, 차트, 스크롤 컨테이너를 인벤토리화한다.

2. COMPUTE MATRIX
   물리 해상도 × Windows 배율 × 브라우저 줌 → 유효 CSS 폭/높이 표를 만든다.
   이 표가 실제 검사 대상이다.

3. STATIC SWEEP
   100vh, 고정 폭, overflow, z-index, hover-only, portal 미사용, table 구조를 스캔한다.

4. MATRIX RUN
   자동화로 폭·높이 조합을 순회하며 overflow·console·스크린샷·좌표 증거를 수집한다.

5. INTERACTION RUN
   Hover, Dropdown, Mega Menu, Tooltip, Sidebar, Table을 마우스와 키보드 두 경로로 조작한다.

6. REPRODUCE
   각 후보를 "환경 + 절차 + 기대 + 실제"로 확정한다.

7. ROOT CAUSE
   CSS 계층·스크롤 컨테이너·포지셔닝·React 상태 중 실제 원인을 파일:라인으로 지목한다.

8. FIX
   최소 변경으로 원인을 제거한다. overflow 은폐, z-index 인플레이션, UA 분기를 금지한다.

9. VERIFY
   원래 조건 + 인접 폭(-1/+1 breakpoint) + 인접 배율/줌을 재검사한다.

10. REGRESSION
    Playwright 테스트를 추가하고 Gate 전체를 실행한다.

11. REPORT
    환경 4요소, 수치, 증거, 배포 판정을 포함해 보고한다.
```

### 4.1 Severity 기준 (데스크톱)

| 등급 | 데스크톱 기준 |
|------|---------------|
| **S0 Blocker** | 필수 지원 폭에서 P0 플로우 완주 불가, 데이터 파괴, 인증 우회, 테이블 조작으로 잘못된 대상 변경 |
| **S1 Critical** | 1366 또는 1920@150% 등 주요 실사용 조건에서 레이아웃 붕괴 · Dropdown/Modal 조작 불가 · 키보드로 핵심 작업 불가 · 200% 줌에서 콘텐츠 접근 불가 |
| **S2 Major** | 가로 스크롤 발생, sticky 겹침으로 콘텐츠 가림, hover-only 동작, 초광폭 레이아웃 붕괴, 테이블 헤더 정렬 깨짐, 큰 INP 저하 |
| **S3 Minor** | 여백 리듬 불일치, 초광폭 과도한 빈 공간, 툴팁 위치 미세 오차, 비핵심 정렬 |
| **S4 Nit** | 네이밍·정리·기능 영향 없는 미세 개선 |

**상향 규칙:** 결함이 인증·결제·삭제 경로에 있거나, 사용자 분포 상위 조건(1920@100%, 1920@125%, 1536, 1366)에서 발생하면 한 단계 올린다.

---

## 5. Desktop Viewport Matrix

### 5.1 필수 CSS 폭과 각 폭의 의미

| CSS 폭 | 실사용 맥락 | 대표 위험 |
|--------|-------------|-----------|
| **1024** | 태블릿 landscape, 분할 화면, 1280@125%, 노트북 최소 지원선 | Sidebar+Table 동시 배치 붕괴, Mega Menu 넘침, 3열 그리드 최소 폭 미달 |
| **1280** | 소형 노트북, 1600@125%, 2560@200% | 컨테이너 첫 확장 지점, Sidebar 접힘 임계 |
| **1366** | 여전히 흔한 노트북 패널(768 세로) | **세로 높이 부족**이 진짜 문제. 고정 헤더+모달 조합 |
| **1440** | MacBook 계열 기본 작업 폭 | 콘텐츠 폭 정책의 기준선. 여백 균형 |
| **1536** | 1920@125% (Windows 기본 배율에서 가장 흔한 조합) | 데스크톱 기본값으로 삼아야 하는 실사용 1순위 폭 |
| **1600** | 중형 모니터, 3840@240% 부근 | 4열 전환 경계 |
| **1920** | 1080p @100%, 2560@133% | 콘텐츠 폭 상한이 없으면 줄 길이 과다 |
| **2560** | QHD @100%, 4K@150% | 초광폭 정책 필요. 시선/커서 이동 비용 |
| **3840** | 4K @100% | 텍스트 미세화, 이미지 업스케일 흐림, 레이아웃 정책 부재가 드러남 |

### 5.2 필수 높이 조합

폭만 바꾸고 높이를 항상 900으로 두면 **데스크톱 결함의 절반을 놓친다.** 최소 세 가지 높이를 사용한다.

| 높이 | 유래 | 검사 목적 |
|------|------|-----------|
| **600** | 1366×768 - 브라우저 크롬 - 작업 표시줄 | 고정 UI 누적, 모달 세로 잘림, 짧은 뷰포트 CTA |
| **720** | 1920×1080@150% | 실사용 저높이 조건 |
| **900** | 1440~1920 표준 | 기본 레이아웃 |
| **1300** | 2560×1440 이상 | 세로로 늘어진 빈 공간, sticky 동작 |

권장 조합(자동 매트릭스 기본값):

```text
1024×600   1024×768
1280×720   1280×800
1366×600   1366×768
1440×900
1536×864
1600×900
1920×1080
2560×1300
3840×2000
```

### D-VP-01 — 문서 레벨 가로 스크롤

**WHY**
데스크톱에서 가로 스크롤은 대개 "최소 지원 폭 미고려"의 결과다. 1024px 또는 1280px에서 Sidebar 고정 폭 + 테이블 최소 폭 + 카드 고정 폭이 합쳐져 뷰포트를 넘긴다. 사용자는 콘텐츠 오른쪽을 보지 못하고, 고정 헤더는 스크롤과 어긋나며, 스크린샷·인쇄·공유가 모두 깨진다.

**DETECT**

```bash
rg -n "w-\[[0-9]{3,}px\]|min-w-\[[0-9]{3,}px\]|basis-\[[0-9]{3,}px\]" src
rg -n "grid-cols-[4-9]|grid-cols-1[0-2]" src --glob "*.tsx"
rg -n "whitespace-nowrap" src --glob "*.tsx"
rg -n "translate-x|left-1/2|w-screen|100vw" src
rg -n "overflow-x-hidden" src
```

`w-screen`과 `100vw`는 스크롤바가 있는 환경에서 문서 폭을 초과한다(D-P6). 데스크톱 가로 스크롤의 흔한 단일 원인이다.

**REPRODUCE**

```ts
const overflow = await page.evaluate(() => {
  const root = document.documentElement;
  return {
    scrollWidth: root.scrollWidth,
    clientWidth: root.clientWidth,
    delta: root.scrollWidth - root.clientWidth,
  };
});
expect(overflow.delta, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
```

원인 요소를 좌표로 특정한다.

```ts
const culprits = await page.evaluate(() => {
  const limit = document.documentElement.clientWidth;
  return [...document.querySelectorAll<HTMLElement>('body *')]
    .filter(el => {
      if (el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.right > limit + 1 || r.left < -1;
    })
    .slice(0, 20)
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: String(el.className).slice(0, 140),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      };
    });
});
```

**PASS / FAIL**

- PASS: 필수 9개 폭 전부에서 문서 `scrollWidth - clientWidth ≤ 1`. 의도된 내부 스크롤 컨테이너(테이블·코드블록·캐러셀)만 가로 스크롤을 갖는다.
- FAIL: 어느 폭에서든 문서 레벨 가로 스크롤 발생. 1024/1280에서 발생하면 S2, Sidebar가 있는 P0 화면이면 S1.

**FIX**

- Sidebar는 고정 px 대신 `w-[min(16rem,25vw)]` 또는 grid 트랙으로 정의하고, 본문 트랙에 `min-w-0`을 준다.
- 고정 폭 카드는 `w-full max-w-*` + `min-w-0`으로 바꾼다.
- 테이블은 컨테이너만 `overflow-x-auto`로 감싼다.
- `w-screen`/`100vw`는 `w-full` 또는 `100dvw` 검토 후 스크롤바 폭을 고려한 값으로 교체한다.
- 문서 전체 `overflow-x-hidden`으로 덮지 않는다.

**BAD**

```tsx
// ❌ 1024px에서 256 + 320×3 + gap > 1024 → 문서 가로 스크롤
<div className="flex">
  <aside className="w-64 shrink-0">...</aside>
  <main className="flex gap-6">
    <Card className="w-[320px]" />
    <Card className="w-[320px]" />
    <Card className="w-[320px]" />
  </main>
</div>
```

**GOOD**

```tsx
// ✅ grid 트랙 + min-w-0 + 반응형 열 수
<div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
  <aside className="hidden lg:block">...</aside>
  <main className="min-w-0">
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
      <Card className="min-w-0" />
      <Card className="min-w-0" />
      <Card className="min-w-0" />
    </div>
  </main>
</div>
```

`minmax(0,1fr)`은 grid 자식의 기본 `min-width:auto`가 트랙을 밀어내는 것을 막는다. 데스크톱 오버플로의 최대 원인이며 `min-w-0`과 함께 기본 규칙으로 삼는다.

**REGRESSION**

```ts
const DESKTOP_WIDTHS = [1024, 1280, 1366, 1440, 1536, 1600, 1920, 2560, 3840];

for (const width of DESKTOP_WIDTHS) {
  test(`문서 가로 스크롤 없음 @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 1366 ? 720 : 900 });
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();
    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta, `overflow ${delta}px at ${width}`).toBeLessThanOrEqual(1);
  });
}
```

---

### D-VP-02 — 짧은 높이에서의 고정 UI 누적

**WHY**
1366×768 노트북과 1920×1080@150%는 브라우저 크롬(약 90~130px)과 OS 작업 표시줄을 빼면 실제 뷰포트 높이가 **600~640px**이다. 여기에 고정 헤더 64px + 페이지 툴바 56px + 테이블 헤더 48px + 하단 배너 72px이 쌓이면 콘텐츠 영역이 360px 남는다. 사용자는 테이블에서 두 행만 볼 수 있고, 모달 저장 버튼은 화면 밖으로 나간다.

**DETECT**

```bash
rg -n "sticky|fixed" src --glob "*.tsx" -A2 | rg "top-0|top-\[|bottom-0|h-1[0-9]|h-[2-9][0-9]"
rg -n "h-screen|min-h-screen|max-h-\[[0-9]+px\]" src
rg -n "DialogContent|SheetContent|ModalContent" src -A6 | rg "h-\[|max-h-"
```

**REPRODUCE**

1. 뷰포트를 `1366×600`으로 설정한다.
2. P0 라우트를 로드하고 고정 UI 누적 높이를 측정한다.

```ts
const chrome = await page.evaluate(() => {
  const vh = window.innerHeight;
  const fixed = [...document.querySelectorAll<HTMLElement>('body *')]
    .filter(el => {
      const p = getComputedStyle(el).position;
      if (p !== 'fixed' && p !== 'sticky') return false;
      return el.offsetParent !== null || p === 'fixed';
    })
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: String(el.className).slice(0, 100),
        top: Math.round(r.top),
        height: Math.round(r.height),
      };
    })
    .filter(x => x.height > 0);

  const topStack = fixed.filter(x => x.top <= 8).reduce((s, x) => s + x.height, 0);
  const bottomStack = fixed
    .filter(x => x.top + x.height >= vh - 8)
    .reduce((s, x) => s + x.height, 0);

  return { vh, topStack, bottomStack, usable: vh - topStack - bottomStack, fixed };
});
```

3. 모달을 열고 제목·본문·푸터 버튼이 모두 보이는지 확인한다.
4. 세로 스크롤 없이 첫 번째 핵심 액션에 도달 가능한지 확인한다.

**PASS / FAIL**

- PASS: `1366×600`에서 고정 UI 누적이 뷰포트 높이의 **35% 이하**이고, 모달은 내부 스크롤로 모든 컨트롤에 도달 가능하며, 푸터 버튼이 항상 보인다.
- FAIL: 사용 가능 높이가 300px 미만, 모달 저장/취소 버튼 접근 불가, 고정 요소가 서로 겹침.

**FIX**

- 스크롤 시 헤더 높이를 축소하거나 하위 툴바를 병합한다.
- 모달은 `max-h-[calc(100vh-4rem)]` + `flex` + 본문 `min-h-0 overflow-y-auto` + 푸터 `shrink-0` 구조로 만든다.
- 하단 배너·쿠키 고지는 짧은 높이에서 축약 형태로 전환한다.
- `min-h-screen` 히어로는 `min-h-[min(100vh,44rem)]`처럼 상한을 둔다.

**BAD**

```tsx
// ❌ 600px 높이에서 푸터 버튼이 화면 밖으로 나간다
<DialogContent className="h-[720px] overflow-hidden">
  <header>...</header>
  <div>{longForm}</div>
  <footer className="absolute bottom-0 w-full">
    <Button>저장</Button>
  </footer>
</DialogContent>
```

**GOOD**

```tsx
// ✅ 뷰포트 기준 상한 + 내부 스크롤 + 항상 보이는 푸터
<DialogContent className="flex max-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col p-0">
  <header className="shrink-0 border-b px-6 py-4">
    <h2 className="text-lg font-semibold">멤버 초대</h2>
  </header>
  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
    {longForm}
  </div>
  <footer className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
    <Button variant="ghost">취소</Button>
    <Button>저장</Button>
  </footer>
</DialogContent>
```

**REGRESSION**

```ts
test('짧은 높이에서 모달 푸터 버튼에 접근 가능하다', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 600 });
  await page.goto('/settings/members');
  await page.getByRole('button', { name: '멤버 초대' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const save = dialog.getByRole('button', { name: '저장' });
  await expect(save).toBeVisible();
  await expect(save).toBeInViewport();

  const box = await dialog.boundingBox();
  expect(box!.height).toBeLessThanOrEqual(600);
});
```

---

### D-VP-03 — 스크롤바 폭과 레이아웃 안정성

**WHY**
macOS는 기본적으로 오버레이 스크롤바(폭 0)를 쓰지만, **Windows Chrome/Edge/Firefox는 약 15~17px을 실제로 차지**한다. 이를 무시하면 (a) 1024px 창에서 1007px만 사용 가능해 3열 그리드가 무너지고, (b) 콘텐츠 길이에 따라 스크롤바가 나타나며 레이아웃이 좌우로 흔들리고(중앙 정렬 요소가 점프), (c) `100vw`를 쓴 요소가 문서 폭을 초과해 가로 스크롤을 만든다.

**DETECT**

```bash
rg -n "100vw|w-screen" src
rg -n "scrollbar-gutter|scrollbar-width|::-webkit-scrollbar" src
rg -n "overflow-y-scroll|overflow-y-auto" src --glob "*.css"
```

**REPRODUCE**

1. Windows Chrome에서 콘텐츠가 짧은 라우트 → 긴 라우트로 이동한다.
2. 중앙 정렬된 로고·모달·탭이 좌우로 점프하는지 관찰한다.
3. 스크롤바 폭을 측정한다.

```ts
const scrollbar = await page.evaluate(() => ({
  width: window.innerWidth - document.documentElement.clientWidth,
  gutter: getComputedStyle(document.documentElement).scrollbarGutter,
}));
```

4. 모달을 열어 배경 스크롤 잠금 시 폭 보정이 되는지 확인한다(잠금 시 스크롤바가 사라지며 콘텐츠가 넓어지는 점프).

**PASS / FAIL**

- PASS: 페이지 전환·모달 열기/닫기에서 가로 방향 레이아웃 점프가 없다. `100vw` 사용처가 스크롤바를 고려한다. 커스텀 스크롤바가 있어도 폭이 명시되고 대비 3:1 이상이다.
- FAIL: 스크롤바 등장으로 중앙 정렬 요소가 점프, 모달 열림 시 배경이 넓어짐, `100vw`로 인한 가로 스크롤.

**FIX**

```css
/* ✅ 스크롤바 공간을 항상 예약 → 점프 제거 */
html {
  scrollbar-gutter: stable;
}
```

`scrollbar-gutter` 미지원 브라우저 대응이 필요하면 `overflow-y: scroll`을 대안으로 쓴다. 모달 스크롤 잠금은 라이브러리의 폭 보정(padding-right 주입) 기능을 사용하거나 직접 보정한다.

```ts
// ✅ 스크롤 잠금 시 폭 보정
const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
document.body.style.overflow = 'hidden';
document.body.style.paddingRight = `${scrollbarWidth}px`;
```

**BAD**

```tsx
// ❌ 스크롤바가 있으면 문서보다 넓어져 가로 스크롤 발생
<section className="relative left-1/2 w-screen -translate-x-1/2 bg-muted">
  ...
</section>
```

**GOOD**

```tsx
// ✅ full-bleed는 문서 폭 기준으로
<section className="w-full bg-muted">
  <div className="mx-auto max-w-screen-xl px-4 lg:px-8">...</div>
</section>
```

**REGRESSION**

```ts
test('스크롤바 등장이 레이아웃을 좌우로 흔들지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const before = await page.getByTestId('primary-logo').boundingBox();

  await page.goto('/docs/very-long-page');
  const after = await page.getByTestId('primary-logo').boundingBox();

  expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1);
});
```

---

### D-VP-04 — Breakpoint 경계와 중간 폭

**WHY**
실제 결함은 breakpoint 정확값이 아니라 **직전 1px**에서 발생한다. `lg:1024px`에서 Sidebar가 나타나도록 했다면 1023px에서는 모바일 Drawer가, 1024px에서는 고정 Sidebar가 보여야 한다. 두 개가 동시에 렌더되거나, 둘 다 사라지거나, 숨은 요소에 포커스가 남는 사고가 이 지점에서 나온다.

**DETECT**

```bash
cat tailwind.config.* | rg -A12 "screens"
rg -n "hidden lg:block|lg:hidden|hidden xl:flex" src --glob "*.tsx"
rg -n "useMediaQuery|matchMedia" src
```

**REPRODUCE**

프로젝트 breakpoint마다 `-1 / 0 / +1`을 순회한다.

```ts
const BOUNDARIES = [767, 768, 769, 1023, 1024, 1025, 1279, 1280, 1281, 1535, 1536, 1537];
```

각 폭에서 확인한다.

- 모바일 네비게이션과 데스크톱 네비게이션이 동시에 보이지 않는가
- 동일 컨트롤이 중복 렌더되어 접근성 트리에 두 번 나타나지 않는가
- `display:none`으로 숨겨진 요소에 포커스가 남지 않는가
- 그리드 열 수 전환으로 카드 최소 폭이 무너지지 않는가
- 고정 UI 높이 변경으로 콘텐츠가 가려지지 않는가

```ts
// 중복 컨트롤 탐지
const duplicates = await page.evaluate(() => {
  const names = [...document.querySelectorAll<HTMLElement>('nav a, nav button')]
    .filter(el => el.offsetParent !== null)
    .map(el => (el.getAttribute('aria-label') ?? el.textContent ?? '').trim())
    .filter(Boolean);
  const seen = new Map<string, number>();
  for (const n of names) seen.set(n, (seen.get(n) ?? 0) + 1);
  return [...seen].filter(([, c]) => c > 1);
});
expect(duplicates).toEqual([]);
```

**PASS / FAIL**

- PASS: 모든 경계에서 정확히 하나의 네비게이션 변형만 활성이며, 중복 접근가능 컨트롤이 없고, 숨은 요소가 포커스를 받지 않는다.
- FAIL: 중복 렌더, 양쪽 모두 숨김, 숨은 요소 포커스, 카드 붕괴.

**FIX**

- 한 컴포넌트를 두 번 렌더하고 CSS로 감추는 대신, 가능하면 **하나의 마크업**이 CSS로 두 형태를 표현하게 한다.
- 불가피한 이중 렌더는 숨겨진 쪽에 `hidden`(속성) 또는 렌더 자체를 제외해 접근성 트리에서 제거한다.
- 재사용 컴포넌트는 뷰포트 media query보다 **container query**를 우선 검토한다.

**GOOD**

```tsx
// ✅ 컨테이너 기준으로 판단 → 어떤 폭·어떤 배치에서도 일관
<section className="@container">
  <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
    ...
  </div>
</section>
```

---

### D-VP-05 — 콘텐츠 폭 정책과 줄 길이

**WHY**
1920px에서 본문을 컨테이너 없이 두면 한 줄이 180~220자가 된다. 사람의 눈은 줄 끝에서 다음 줄 시작으로 돌아오는 데 실패하고(줄 잃음), 읽기 속도와 이해도가 크게 떨어진다. 반대로 대시보드 표를 좁은 `max-w-3xl`에 넣으면 넓은 화면의 이점을 버린다. **콘텐츠 유형별로 다른 폭 정책이 필요하다.**

**폭 정책 표준**

| 콘텐츠 유형 | 권장 최대 폭 | 근거 |
|-------------|--------------|------|
| 본문 산문 | `65~75ch` | 줄당 45~90자 가독 범위 |
| 폼 단일 열 | `28~36rem` | 필드 스캔 거리, 라벨-입력 관계 |
| 카드 그리드 | 컨테이너 `max-w-screen-2xl` + 카드 최소 `18rem` | 카드가 지나치게 넓어지는 것 방지 |
| 데이터 테이블 | 제한 없음(컨테이너 폭) | 열 비교가 목적 |
| 대시보드 | `max-w-screen-2xl` 또는 무제한 + 열 수 증가 | 밀도 활용 |
| 코드/로그 | 무제한 + 가로 스크롤 | 줄바꿈이 의미를 해침 |

**DETECT**

```bash
rg -n "max-w-(screen|[0-9]|prose|\[)" src --glob "*.tsx" | head -50
rg -n "prose" src --glob "*.tsx"
```

**REPRODUCE**

```ts
// 1920/2560에서 본문 줄 길이(문자 수 근사) 측정
const lineLengths = await page.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('main p, article p')]
    .filter(el => el.offsetParent !== null && (el.textContent?.length ?? 0) > 80)
    .map(el => {
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      // 평균 글자 폭 ≈ 0.5em (라틴), 한글은 ≈ 1em
      const approxCharWidth = fontSize * 0.55;
      return {
        width: Math.round(el.getBoundingClientRect().width),
        approxChars: Math.round(el.getBoundingClientRect().width / approxCharWidth),
        text: el.textContent?.trim().slice(0, 40),
      };
    }));
```

**PASS / FAIL**

- PASS: 본문 단락의 근사 줄 길이가 1920/2560/3840에서 **90자 이하**로 유지된다. 폼은 단일 열 폭 상한을 갖는다. 대시보드·테이블은 폭을 활용한다.
- FAIL: 본문이 컨테이너 없이 전체 폭을 사용, 폼 입력이 1200px로 늘어남, 반대로 대시보드가 좁은 컨테이너에 갇힘.

**FIX**

**BAD**

```tsx
// ❌ 1920에서 한 줄 200자, 입력 필드 1800px
<article className="w-full px-8">
  <p>{longKoreanAndEnglishBody}</p>
  <input className="w-full" />
</article>
```

**GOOD**

```tsx
// ✅ 유형별 폭 정책
<article className="mx-auto w-full max-w-[70ch] px-6 lg:px-8">
  <p className="leading-relaxed">{longKoreanAndEnglishBody}</p>
</article>

<form className="mx-auto w-full max-w-lg space-y-4">
  <input className="w-full" />
</form>

<section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8">
  <DashboardGrid />
</section>
```

**REGRESSION**

```ts
test('초광폭에서도 본문 줄 길이가 제한된다', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1300 });
  await page.goto('/docs/getting-started');
  const width = await page.locator('article p').first().evaluate(el =>
    el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(900);
});
```

---

## 6. Windows Display Scaling

### 6.1 배율이 무엇을 바꾸는가

Windows의 "디스플레이 배율"은 `devicePixelRatio`를 바꾸고, 그 결과 **CSS px 뷰포트가 작아진다.** 배율이 올라가면 화면은 크게 보이지만 브라우저가 인식하는 폭은 줄어든다. 아래 표는 데스크톱 QA에서 가장 중요한 표다.

| 물리 해상도 | 100% | 125% | 150% | 175% | 200% |
|-------------|------|------|------|------|------|
| 1366×768 | 1366×768 | 1093×614 | 911×512 | 781×439 | 683×384 |
| 1600×900 | 1600×900 | 1280×720 | 1067×600 | 914×514 | 800×450 |
| **1920×1080** | 1920×1080 | **1536×864** | **1280×720** | 1097×617 | 960×540 |
| 2560×1440 | 2560×1440 | 2048×1152 | 1707×960 | 1463×823 | 1280×720 |
| 3840×2160 | 3840×2160 | 3072×1728 | 2560×1440 | 2194×1234 | 1920×1080 |

핵심 결론 세 가지.

1. **1920×1080 @125%는 1536×864이다.** Windows 노트북 다수의 권장 배율이 125~150%이므로, "가장 흔한 데스크톱 폭"은 1920이 아니라 **1536 또는 1280**이다.
2. **1920×1080 @150%는 1280×720이다.** 브라우저 크롬을 빼면 세로 약 600px. `min-h-screen` 히어로와 큰 고정 헤더가 여기서 무너진다.
3. **고배율 노트북은 "데스크톱 물리 화면 + 태블릿급 CSS 폭"이다.** 배율 175% 이상에서 1366 패널은 CSS 781px, 즉 **태블릿 레이아웃**을 만난다. 데스크톱 전용 UI만 준비하면 실패한다.

### 6.2 Playwright에서 배율 재현

배율은 `deviceScaleFactor`와 축소된 `viewport`의 조합으로 근사한다.

```ts
// tests/desktop/scaling.spec.ts
type ScalingCase = {
  label: string;
  physical: { width: number; height: number };
  scale: number;      // 1.25 = 125%
  chromeHeight: number; // 브라우저 UI + 작업 표시줄의 CSS px 추정
};

const SCALING_CASES: ScalingCase[] = [
  { label: '1920x1080@100%', physical: { width: 1920, height: 1080 }, scale: 1,    chromeHeight: 120 },
  { label: '1920x1080@125%', physical: { width: 1920, height: 1080 }, scale: 1.25, chromeHeight: 100 },
  { label: '1920x1080@150%', physical: { width: 1920, height: 1080 }, scale: 1.5,  chromeHeight: 92  },
  { label: '1920x1080@175%', physical: { width: 1920, height: 1080 }, scale: 1.75, chromeHeight: 84  },
  { label: '1366x768@125%',  physical: { width: 1366, height: 768  }, scale: 1.25, chromeHeight: 96  },
  { label: '2560x1440@150%', physical: { width: 2560, height: 1440 }, scale: 1.5,  chromeHeight: 92  },
];

export function toCssViewport(c: ScalingCase) {
  return {
    width: Math.floor(c.physical.width / c.scale),
    height: Math.floor(c.physical.height / c.scale) - c.chromeHeight,
  };
}

for (const c of SCALING_CASES) {
  test(`레이아웃 무결성 ${c.label}`, async ({ browser }) => {
    const viewport = toCssViewport(c);
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: c.scale,
    });
    const page = await context.newPage();
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();

    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta, `${c.label} → ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);

    await expect(page).toHaveScreenshot(`${c.label}.png`, { fullPage: false });
    await context.close();
  });
}
```

`deviceScaleFactor`는 래스터 해상도에만 영향을 준다. **레이아웃을 결정하는 것은 축소된 viewport 폭이다.** 두 값을 함께 설정해야 스크린샷과 이미지 선택(srcset)까지 실제 조건에 맞는다.

### D-DPI-01 — 고배율에서 유효 CSS 폭 미대응

**WHY**
배율 150% 사용자의 CSS 폭 1280px은 프로젝트가 "데스크톱"으로 간주하지 않을 수 있다. `xl:` 이상에서만 정의된 레이아웃, `2xl:`에서만 나타나는 필수 컬럼, `lg` 미만에서 숨겨지는 액션이 있으면 이 사용자는 기능 일부를 아예 볼 수 없다.

**DETECT**

```bash
# xl/2xl 이상에서만 나타나는 요소 = 고배율 사용자에게 보이지 않을 위험
rg -n "hidden xl:|hidden 2xl:|2xl:block|xl:flex" src --glob "*.tsx"
# 핵심 액션이 큰 breakpoint에만 있는지 확인
rg -n "hidden lg:inline-flex|hidden xl:inline" src --glob "*.tsx" -B3 | rg -i "저장|삭제|결제|submit|delete|checkout"
```

**REPRODUCE**

1. `1280×620` + `deviceScaleFactor: 1.5`로 컨텍스트를 만든다(1920@150% 근사).
2. P0 플로우를 완주한다.
3. 각 화면에서 "이 폭에서만 사라지는 컨트롤" 목록을 만든다.

```ts
const hiddenActions = await page.evaluate(() => {
  const critical = ['저장', '삭제', '결제', '초대', '내보내기'];
  return critical.filter(label => {
    const el = [...document.querySelectorAll<HTMLElement>('button, a')]
      .find(e => (e.textContent ?? '').trim().includes(label));
    return !el || el.offsetParent === null;
  });
});
expect(hiddenActions).toEqual([]);
```

**PASS / FAIL**

- PASS: 필수 배율 표의 모든 유효 CSS 폭(1536, 1280, 1097, 1093, 960)에서 P0 기능 전체에 도달 가능하다.
- FAIL: 특정 폭에서 핵심 액션이 사라지거나 오버플로 메뉴 없이 잘림. 1536 또는 1280에서 발생하면 S1.

**FIX**

- 핵심 액션은 폭이 부족할 때 숨기지 말고 **오버플로 메뉴(⋯)로 이동**시킨다.
- `lg` 이하에서도 완전한 대체 경로를 제공한다.
- 데스크톱 전용 UI의 기준선을 `xl`이 아니라 `lg`(1024)로 잡는다.

**BAD**

```tsx
// ❌ 1280px 사용자는 '내보내기'를 영구히 볼 수 없다
<div className="hidden 2xl:flex gap-2">
  <Button>내보내기</Button>
  <Button>초대</Button>
</div>
```

**GOOD**

```tsx
// ✅ 좁으면 오버플로 메뉴로 이동, 기능 자체는 유지
<div className="flex items-center gap-2">
  <Button className="hidden xl:inline-flex">내보내기</Button>
  <Button>초대</Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild className="xl:hidden">
      <Button variant="ghost" aria-label="추가 작업">⋯</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>내보내기</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

### D-DPI-02 — 고DPI 이미지와 아이콘 선명도

**WHY**
`deviceScaleFactor`가 1.5~2인 화면에서 1배 비트맵을 그리면 흐릿하게 보인다. 반대로 항상 3배 이미지를 내려주면 대역폭과 디코딩 비용이 폭증한다. 로고·아바타·차트 캔버스는 특히 눈에 띈다.

**DETECT**

```bash
rg -n "<img" src --glob "*.tsx" | rg -v "next/image"
rg -n "srcSet|sizes=" src --glob "*.tsx"
rg -n "getContext\('2d'\)|new Chart|canvas" src
rg -n "backgroundImage|url\(" src --glob "*.css"
```

**REPRODUCE**

```ts
test('고DPI에서 이미지가 충분한 해상도로 제공된다', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('/');

  const blurry = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter(img => img.complete && img.naturalWidth > 0)
      .map(img => ({
        src: img.currentSrc.slice(-80),
        cssWidth: Math.round(img.getBoundingClientRect().width),
        naturalWidth: img.naturalWidth,
        ratio: +(img.naturalWidth / Math.max(1, img.getBoundingClientRect().width)).toFixed(2),
      }))
      .filter(x => x.cssWidth > 0 && x.ratio < 1.5));

  expect(blurry, JSON.stringify(blurry, null, 2)).toEqual([]);
  await context.close();
});
```

Canvas는 별도로 확인한다.

```ts
const canvasScale = await page.evaluate(() =>
  [...document.querySelectorAll('canvas')].map(c => ({
    attrWidth: c.width,
    cssWidth: Math.round(c.getBoundingClientRect().width),
    dpr: window.devicePixelRatio,
    ok: c.width >= c.getBoundingClientRect().width * window.devicePixelRatio - 1,
  })));
```

**PASS / FAIL**

- PASS: DPR 2 조건에서 표시 이미지의 `naturalWidth / cssWidth ≥ 1.5`. Canvas 백킹 스토어가 `cssWidth × dpr`로 설정된다. 아이콘은 SVG 또는 아이콘 폰트다.
- FAIL: 로고·아바타·차트가 눈에 보이게 흐림, Canvas가 DPR을 반영하지 않음.

**FIX**

- `next/image`의 `sizes`를 정확히 지정해 브라우저가 DPR에 맞는 후보를 고르게 한다.
- 아이콘과 로고는 SVG로 제공한다.
- Canvas는 DPR 스케일링을 명시한다.

**GOOD**

```tsx
// ✅ 표시 폭을 sizes로 알려주면 DPR별 최적 후보가 선택된다
<Image
  src="/brand/logo.png"
  alt="회사 로고"
  width={160}
  height={40}
  sizes="160px"
  priority
/>
```

```ts
// ✅ Canvas DPR 스케일링 + 리사이즈 대응
function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
```

---

### D-DPI-03 — 1px 경계선과 하프픽셀 렌더링

**WHY**
DPR 1.25 / 1.5 / 1.75에서 `1px` 경계선은 물리 1.25~1.75px로 계산되어 브라우저가 반올림한다. 결과적으로 인접 카드의 선 두께가 서로 달라 보이고, 테이블 행 구분선이 들쭉날쭉해지며, `divide-y`가 일부 구간에서 사라진다. 기능 결함은 아니지만 제품이 조립되지 않은 느낌을 준다.

**DETECT**

```bash
rg -n "border(-[trbl])?( |$)|divide-[xy]|border-\[0?\.5px\]" src --glob "*.tsx" | head -40
rg -n "box-shadow: 0 0 0 1px|outline-width: 1px" src --glob "*.css"
```

**REPRODUCE**

1. `deviceScaleFactor: 1.5`로 테이블·카드 목록이 있는 화면을 캡처한다.
2. 스크린샷을 400% 확대해 인접 행의 선 두께를 비교한다.
3. `divide-y` 구간에서 선이 누락되는지 확인한다.

**PASS / FAIL**

- PASS: DPR 1.25/1.5/1.75 캡처에서 동일 역할의 경계선이 시각적으로 균일하고 누락이 없다.
- FAIL: 선 두께 불균일이 명확히 보이거나 특정 행 구분선이 사라짐. 대개 S3, 테이블 가독성을 해치면 S2.

**FIX**

- 하프픽셀 회피를 위해 요소 높이를 정수 px로 유지한다(소수 padding/line-height 누적을 피한다).
- 필요 시 경계선을 `box-shadow: inset 0 -1px 0` 또는 배경 그라디언트로 그려 서브픽셀 반올림 영향을 줄인다.
- 얇은 선 표현은 `border`와 `outline`을 섞지 말고 한 방식으로 통일한다.
- `divide-y`가 불안정한 목록은 각 항목에 `border-b`를 주고 마지막만 `last:border-b-0`으로 처리한다.

**GOOD**

```tsx
// ✅ 정수 높이 + 일관된 경계선 전략
<ul className="rounded-lg border">
  {rows.map(r => (
    <li key={r.id} className="flex h-12 items-center border-b px-4 last:border-b-0">
      {r.name}
    </li>
  ))}
</ul>
```

---

### D-DPI-04 — 배율 변경 중 상태 유지

**WHY**
사용자는 모니터를 옮기거나 배율을 바꾸는 중에 앱을 새로 고치지 않는다. DPR이 바뀌면 Canvas는 흐려지고, `ResizeObserver` 없는 차트는 잘리고, `window.innerWidth`를 한 번만 읽어 상태에 저장한 컴포넌트는 잘못된 레이아웃에 고정된다.

**DETECT**

```bash
rg -n "window\.innerWidth|window\.innerHeight|devicePixelRatio" src -A3
rg -n "useState.*innerWidth|useEffect.*resize" src
rg -n "ResizeObserver|matchMedia" src
```

**REPRODUCE**

1. 차트·Canvas가 있는 화면을 로드한다.
2. `deviceScaleFactor`가 다른 컨텍스트로 전환하는 대신, 실기기에서 배율을 100% → 150%로 변경한다.
3. 새로 고침 없이 차트 선명도와 크기, 레이아웃 분기를 확인한다.
4. 자동화에서는 창 크기 변경으로 부분 재현한다.

```ts
test('뷰포트 변경 시 차트가 재계산된다', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/dashboard');
  const chart = page.getByTestId('revenue-chart');
  const before = await chart.boundingBox();

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
  const after = await chart.boundingBox();

  expect(after!.width).toBeLessThan(before!.width);
  // 컨테이너를 넘치지 않아야 한다
  const overflow = await chart.evaluate(el =>
    el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
```

**PASS / FAIL**

- PASS: 새로 고침 없이 레이아웃 분기·차트 크기·Canvas 선명도가 갱신된다. DPR 변화 시 Canvas가 재렌더된다.
- FAIL: 차트가 컨테이너를 넘침, Canvas 흐림 유지, 레이아웃이 이전 폭에 고정.

**FIX**

**BAD**

```tsx
// ❌ 마운트 시 한 번만 읽고 저장 → 이후 변화에 무반응, SSR에서 crash
const [isWide] = useState(window.innerWidth >= 1280);
```

**GOOD**

```tsx
// ✅ matchMedia 구독 + SSR 안전
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
```

```ts
// ✅ DPR 변화 구독 (모니터 이동 대응)
useEffect(() => {
  let mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const onChange = () => {
    redrawCanvas();
    mql.removeEventListener('change', onChange);
    mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mql.addEventListener('change', onChange);
  };
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}, [redrawCanvas]);
```

레이아웃 의존은 가능하면 JS 없이 CSS media/container query로 처리한다. JS 측정은 Canvas·가상 스크롤처럼 불가피한 경우로 제한한다.

---

## 7. Browser Zoom

### 7.1 줌이 무엇을 바꾸는가

브라우저 줌(Ctrl + / Ctrl -)은 **CSS px의 물리 크기를 바꾼다.** 그 결과 유효 CSS 뷰포트 폭은 `물리폭 / (배율 × 줌)`이 된다. 배율과 곱해지므로 조합 폭이 급격히 좁아진다.

| 물리 폭 | 배율 | 줌 100% | 줌 125% | 줌 150% | 줌 200% |
|---------|------|---------|---------|---------|---------|
| 1920 | 100% | 1920 | 1536 | 1280 | 960 |
| 1920 | 125% | 1536 | 1229 | 1024 | 768 |
| 1920 | 150% | 1280 | 1024 | 853 | 640 |
| 1366 | 100% | 1366 | 1093 | 911 | 683 |

즉 **1920 모니터 · 배율 150% · 줌 150% 사용자는 CSS 853px에서 앱을 본다.** 저시력 사용자에게 흔한 조합이며, WCAG 1.4.10(Reflow)은 이 조건에서 두 방향 스크롤 없이 콘텐츠를 사용할 수 있어야 한다고 요구한다.

축소(80~90%)도 검사한다. 넓은 테이블을 보려고 축소하는 사용자가 많고, 이때 `min-height`와 고정 폭 가정이 드러난다.

### 7.2 Playwright에서 줌 재현

세 가지 방법이 있으며 목적에 따라 선택한다.

```ts
// 방법 1 (권장): 유효 폭 계산으로 재현 — 크로스 브라우저 안정
async function withZoom(browser: Browser, physical: { width: number; height: number }, zoom: number) {
  return browser.newContext({
    viewport: {
      width: Math.floor(physical.width / zoom),
      height: Math.floor(physical.height / zoom),
    },
    deviceScaleFactor: zoom, // 래스터 크기까지 실제와 유사하게
  });
}

// 방법 2: CSS zoom 주입 — 실제 줌과 미세하게 다르나 시각 확인에 유용
await page.addStyleTag({ content: `html { zoom: 1.5 }` });

// 방법 3: CDP (Chromium 전용) — 페이지 스케일 팩터
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.5 });
```

방법 1을 기본으로 쓰고, 시각 회귀 스냅샷은 방법 1로 고정한다. 방법 2/3은 보조 확인용이다.

### D-ZOOM-01 — 200% 줌에서 Reflow (WCAG 1.4.10)

**WHY**
저시력 사용자에게 200% 줌은 필수 접근 수단이다. 이 조건에서 가로·세로 양방향 스크롤이 필요하면 읽기가 사실상 불가능하다. 데스크톱 앱에서 이 문제가 나오는 전형적 원인은 고정 폭 Sidebar, 고정 폭 모달, 넘치는 툴바, `white-space: nowrap` 라벨이다.

**DETECT**

```bash
rg -n "w-\[[0-9]{3,}px\]|min-w-\[[0-9]{3,}px\]" src
rg -n "whitespace-nowrap" src --glob "*.tsx"
rg -n "user-scalable|maximum-scale" src app
```

**REPRODUCE**

1. `1280×720` 기준에서 줌 200% → 유효 뷰포트 `640×360`.
2. P0 라우트를 로드한다.
3. 다음을 확인한다.

```ts
test('200% 줌에서 양방향 스크롤이 필요하지 않다', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 640, height: 360 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();

  const delta = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(delta, `가로 오버플로 ${delta}px`).toBeLessThanOrEqual(1);

  // 핵심 컨트롤 접근 가능성
  await expect(page.getByRole('button', { name: '초대' })).toBeVisible();
  await context.close();
});
```

4. 폼 제출과 모달 확인까지 완주한다.

**PASS / FAIL**

- PASS: 유효 폭 640px(200% 줌 상당)에서 세로 스크롤만으로 모든 콘텐츠와 컨트롤에 도달한다. 텍스트 잘림·겹침이 없다.
- FAIL: 가로 스크롤 필요, 컨트롤 접근 불가, 텍스트 겹침. **S1 이상**(접근성 법적 요구 사항).

**FIX**

- 줌 상태를 별도 레이아웃으로 취급하지 않는다. 좁은 폭 대응이 곧 줌 대응이다. 반응형이 제대로 되어 있으면 줌은 자동으로 통과한다.
- 고정 폭 Sidebar는 좁은 폭에서 Drawer로 전환한다.
- 라벨의 `nowrap`을 제거하고 줄바꿈을 허용한다.
- 모달 폭은 `w-[min(32rem,calc(100vw-2rem))]` 형태로 상한과 여유를 함께 준다.

**BAD**

```tsx
// ❌ 유효 폭 640px에서 모달이 화면을 넘고 좌우가 잘린다
<DialogContent className="w-[720px]">...</DialogContent>
```

**GOOD**

```tsx
// ✅ 뷰포트를 존중하는 폭
<DialogContent className="w-[min(45rem,calc(100vw-2rem))] max-h-[calc(100vh-4rem)] overflow-y-auto">
  ...
</DialogContent>
```

**REGRESSION**

```ts
const ZOOM_LEVELS = [0.8, 0.9, 1, 1.1, 1.25, 1.5];

for (const zoom of ZOOM_LEVELS) {
  test(`줌 ${zoom * 100}%에서 레이아웃 무결성`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: Math.floor(1440 / zoom), height: Math.floor(900 / zoom) },
      deviceScaleFactor: zoom,
    });
    const page = await context.newPage();
    await page.goto('/dashboard');
    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta).toBeLessThanOrEqual(1);
    await context.close();
  });
}
```

---

### D-ZOOM-02 — 텍스트 전용 확대 (Text Spacing / 1.4.12)

**WHY**
Firefox의 "텍스트만 확대"와 브라우저 기본 글꼴 크기 변경(16px → 20px)은 레이아웃 컨테이너를 그대로 두고 글자만 키운다. `px` 고정 높이 버튼, 고정 높이 카드, `overflow: hidden` 컨테이너에서 텍스트가 잘리거나 넘친다. WCAG 1.4.12는 줄 간격 1.5배, 문단 간격 2배, 자간 0.12em, 단어 간격 0.16em을 적용해도 콘텐츠가 손실되지 않아야 한다고 요구한다.

**DETECT**

```bash
rg -n "h-\[[0-9]+px\]|h-8|h-9|h-10|h-11" src --glob "*.tsx" | rg -i "button|badge|chip|tab" | head -30
rg -n "overflow-hidden" src --glob "*.tsx" | head -30
rg -n "text-\[1[0-9]px\]|font-size: 1[0-9]px" src
rg -n "line-clamp-" src --glob "*.tsx"
```

**REPRODUCE**

WCAG 1.4.12 스타일을 강제 주입한다.

```ts
test('텍스트 간격 확대에서 콘텐츠가 손실되지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p { margin-bottom: 2em !important; }
    `,
  });

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a, [role="tab"], h1, h2, h3, td, th, label')]
      .filter(el => el.offsetParent !== null)
      .filter(el => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
      .filter(el => !el.className.includes('line-clamp')) // 의도적 클램프 제외
      .slice(0, 20)
      .map(el => ({
        tag: el.tagName,
        text: (el.textContent ?? '').trim().slice(0, 40),
        className: String(el.className).slice(0, 100),
        scrollW: el.scrollWidth, clientW: el.clientWidth,
        scrollH: el.scrollHeight, clientH: el.clientHeight,
      })));

  expect(clipped, JSON.stringify(clipped, null, 2)).toEqual([]);
});
```

브라우저 기본 글꼴 확대도 별도로 확인한다.

```ts
await page.addStyleTag({ content: `html { font-size: 20px }` });
```

**PASS / FAIL**

- PASS: 1.4.12 스타일 적용 후 잘림·겹침·기능 손실이 없다. 기본 글꼴 20px에서도 동일하다.
- FAIL: 버튼 텍스트 잘림, 탭 라벨 겹침, 카드 텍스트 잘림. S2, 핵심 라벨이면 S1.

**FIX**

- 컴포넌트 높이는 고정하지 않고 `min-h-*` + padding으로 만든다.
- 폰트 크기는 `rem`을 사용해 사용자 기본 글꼴 설정을 존중한다.
- 잘림 제어가 필요하면 `overflow: hidden`이 아니라 `line-clamp` + 전체 텍스트 접근 수단(툴팁/상세)을 제공한다.

**BAD**

```tsx
// ❌ 고정 높이 + hidden → 글자가 커지면 잘린다
<button className="h-9 overflow-hidden text-[13px]">
  구독 플랜 변경하기
</button>
```

**GOOD**

```tsx
// ✅ 내용에 따라 자라는 높이 + rem 기반 크기
<button className="inline-flex min-h-9 items-center rounded-md px-3 py-1.5 text-sm leading-normal">
  구독 플랜 변경하기
</button>
```

---

### D-ZOOM-03 — 축소(80~90%)에서의 레이아웃 가정

**WHY**
넓은 테이블이나 대시보드를 한눈에 보려고 축소하는 사용자가 많다. 축소하면 유효 CSS 폭이 커져 `2xl` 이상 분기가 처음으로 활성화되고, 여기서만 나타나는 결함이 드러난다. 또 축소 시 `min-height: 100vh` 영역 아래 빈 공간이 생기거나, 초광폭 정책 부재로 콘텐츠가 화면 중앙에 작게 뭉친다.

**DETECT**

```bash
rg -n "2xl:|min-\[1[5-9][0-9]{2}px\]" src --glob "*.tsx" | head -30
rg -n "min-h-screen|h-screen" src --glob "*.tsx"
```

**REPRODUCE**

1. `1920×1080` 기준 줌 80% → 유효 폭 2400px.
2. 대시보드·테이블 화면을 확인한다.
3. 다음을 관찰한다: 카드가 과도하게 늘어나는지, 차트 비율이 깨지는지, 푸터 아래 빈 공간이 남는지, 배경이 끊기는지.

**PASS / FAIL**

- PASS: 유효 폭 2400~2560에서 레이아웃 정책이 유지되고, 페이지 하단에 배경 미적용 빈 공간이 없다.
- FAIL: 카드 왜곡, 배경 끊김, 푸터 아래 흰 여백. 대개 S3, 브랜딩·가독성 훼손이 크면 S2.

**FIX**

```tsx
// ✅ 페이지가 짧아도 푸터를 아래에 고정하고 배경을 채운다
<div className="flex min-h-dvh flex-col bg-background">
  <SiteHeader />
  <main className="flex-1">{children}</main>
  <SiteFooter />
</div>
```

---

### D-ZOOM-04 — 줌 상태에서 오버레이 포지셔닝

**WHY**
줌은 좌표 계산에 소수점을 만들고, 뷰포트를 좁혀 오버레이의 충돌 회피를 처음으로 강제한다. 줌 150%에서 Dropdown이 화면 밖으로 나가거나, Tooltip이 트리거와 어긋나거나, `getBoundingClientRect` 기반 수동 포지셔닝이 1~3px 밀리는 현상이 나타난다.

**DETECT**

```bash
rg -n "getBoundingClientRect" src -A6 | rg "style.top|style.left|setPosition"
rg -n "position: absolute" src --glob "*.tsx" -B3 | rg -i "tooltip|dropdown|popover"
```

**REPRODUCE**

```ts
test('줌 150%에서 드롭다운이 뷰포트를 벗어나지 않는다', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 960, height: 600 }, // 1440 @150%
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();
  await page.goto('/settings/members');

  // 우측 끝 행의 액션 메뉴 = 충돌 가능성 최고
  await page.getByRole('row').nth(1).getByRole('button', { name: '작업' }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();

  const box = await menu.boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 1);
  await context.close();
});
```

**PASS / FAIL**

- PASS: 모든 줌 단계에서 오버레이가 뷰포트 안에 들어오고, 트리거와의 정렬 오차가 2px 이하다.
- FAIL: 오버레이가 화면 밖으로 나가 항목 선택 불가(S1), 또는 눈에 보이는 어긋남(S2/S3).

**FIX**

- 수동 좌표 계산을 버리고 Floating UI 기반 라이브러리(Radix Popover/DropdownMenu/Tooltip)를 사용한다. flip·shift·size 미들웨어가 충돌을 처리한다.
- 자체 구현이 필요하면 `collisionPadding`을 두고 스크롤·리사이즈 시 재계산한다.

**GOOD**

```tsx
// ✅ 충돌 회피와 사용 가능 높이 제약을 라이브러리에 위임
<DropdownMenuContent
  align="end"
  sideOffset={6}
  collisionPadding={12}
  className="max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto"
>
  {items.map(i => <DropdownMenuItem key={i.id}>{i.label}</DropdownMenuItem>)}
</DropdownMenuContent>
```

---

## 8. Wide Screen과 Ultra Wide

### D-WIDE-01 — 초광폭 레이아웃 정책 부재

**WHY**
2560px 이상에서 정책이 없으면 두 가지 실패 중 하나가 나온다. (a) 콘텐츠가 무제한으로 늘어나 줄 길이가 200자가 되고 좌우 시선 이동이 화면 전체를 횡단한다. (b) `max-w-4xl` 같은 좁은 상한 때문에 콘텐츠가 중앙에 뭉치고 좌우 900px씩 빈 공간이 남아 제품이 미완성처럼 보인다. **초광폭은 "무엇을 더 보여줄지" 결정하는 문제다.**

**DETECT**

```bash
rg -n "max-w-screen-2xl|max-w-\[1[4-9][0-9]{2}px\]|max-w-7xl|max-w-full" src --glob "*.tsx"
rg -n "2xl:grid-cols|3xl:|min-\[1920px\]" src --glob "*.tsx"
```

**REPRODUCE**

1. 뷰포트 `2560×1300`, `3440×1440`(21:9), `3840×2000`으로 P0/P1 라우트를 캡처한다.
2. 각 화면에 대해 판정한다.
   - 콘텐츠 영역이 전체 폭에서 차지하는 비율
   - 본문 줄 길이(D-VP-05 스크립트)
   - 좌우 빈 공간이 "의도된 여백"인지 "버려진 공간"인지
   - 첫 화면(fold)에 담긴 정보량이 1440 대비 실제로 늘었는지

```ts
const fill = await page.evaluate(() => {
  const main = document.querySelector('main')!;
  const content = main.querySelector('[data-content-root]') ?? main.firstElementChild!;
  return {
    viewport: window.innerWidth,
    contentWidth: Math.round(content.getBoundingClientRect().width),
    ratio: +(content.getBoundingClientRect().width / window.innerWidth).toFixed(2),
  };
});
```

**PASS / FAIL**

- PASS: 2560/3440/3840에서 레이아웃이 아래 정책 중 하나를 **명시적으로** 따른다. 그리고 1440 대비 정보량이 줄지 않는다.
  1. 컨테이너 상한 + 균형 잡힌 여백 (마케팅·문서)
  2. 열 수 증가 (카드 그리드·대시보드)
  3. 병렬 패널 (목록 + 상세 동시 표시)
- FAIL: 정책 없음. 본문 줄 길이 90자 초과 또는 콘텐츠 폭 비율 45% 미만이면서 대안 정보가 없음.

**FIX**

- 유형별 상한(D-VP-05)을 적용하고, 그리드는 `auto-fit`으로 열 수를 자연 증가시킨다.
- 넓은 화면에서만 목록-상세 병렬 패널을 노출한다.
- Tailwind에 초광폭 breakpoint를 추가해 의도를 코드로 남긴다.

```js
// tailwind.config.ts
screens: {
  sm: '640px', md: '768px', lg: '1024px', xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4xl': '2560px',
}
```

**BAD**

```tsx
// ❌ 3840px에서 카드 4개가 각각 900px로 늘어나 정보 밀도가 오히려 감소
<div className="grid grid-cols-4 gap-6 px-8">
  {cards.map(c => <Card key={c.id} {...c} />)}
</div>
```

**GOOD**

```tsx
// ✅ 카드 폭을 고정 범위로 두고 열 수가 자연 증가
<div
  className="grid gap-6 px-8"
  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 24rem))' }}
>
  {cards.map(c => <Card key={c.id} {...c} />)}
</div>
```

```tsx
// ✅ 초광폭에서만 병렬 패널로 전환
<div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
  <ItemList selectedId={selectedId} onSelect={setSelectedId} />
  <div className="hidden 2xl:block">
    <ItemDetail id={selectedId} />
  </div>
</div>
```

**REGRESSION**

```ts
test('3840px에서 카드 폭이 과도하게 늘어나지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2000 });
  await page.goto('/dashboard');
  const widths = await page.getByTestId('metric-card').evaluateAll(els =>
    els.map(el => el.getBoundingClientRect().width));
  for (const w of widths) expect(w).toBeLessThanOrEqual(520);
  expect(widths.length).toBeGreaterThanOrEqual(4);
});
```

---

### D-WIDE-02 — 커서 이동 거리와 조작 근접성

**WHY**
2560px 화면에서 왼쪽 Sidebar의 항목을 클릭한 뒤 오른쪽 끝 "저장" 버튼으로 이동하려면 마우스로 2000px 이상을 횡단해야 한다. Fitts의 법칙에 따라 이동 시간은 거리에 비례해 증가하고, 반복 작업에서는 피로와 오조작으로 이어진다. 또 화면 양 끝에 관련 정보를 배치하면 눈이 동시에 볼 수 없다.

**DETECT** — 정적 스캔으로 잡히지 않는다. 화면별 조작 흐름을 손으로 추적한다.

```bash
rg -n "justify-between" src --glob "*.tsx" | head -40   # 양 끝 배치 후보
```

**REPRODUCE**

1. `2560×1300`에서 P0 플로우를 수행한다.
2. 연속되는 조작 쌍의 중심 거리를 측정한다.

```ts
const distance = await page.evaluate(() => {
  const a = document.querySelector<HTMLElement>('[data-testid="row-checkbox"]')!;
  const b = document.querySelector<HTMLElement>('[data-testid="bulk-delete"]')!;
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  return Math.round(Math.hypot(
    (ra.left + ra.width / 2) - (rb.left + rb.width / 2),
    (ra.top + ra.height / 2) - (rb.top + rb.height / 2),
  ));
});
```

3. 관련 정보(입력 필드와 그 검증 메시지, 선택 항목과 액션 바)가 시야 안에 함께 있는지 확인한다.

**PASS / FAIL**

- PASS: 연속 조작 쌍의 거리가 2560px 뷰포트에서 **1200px 이하**이고, 선택 대상과 액션이 동일 시야에 있다.
- FAIL: 연속 조작 거리가 화면 폭의 70%를 초과하거나, 선택 항목과 액션 바가 반대편 끝에 있다. S2/S3.

**FIX**

- 폼의 제출 버튼은 폼 컨테이너 안, 마지막 필드 근처에 둔다. 화면 우측 끝 고정 배치를 피한다.
- 대량 선택 액션은 선택이 발생한 위치 근처에 **부동 액션 바**로 띄운다.
- 초광폭에서 툴바를 화면 전체로 늘리지 않고 콘텐츠 컨테이너 폭에 맞춘다.

**GOOD**

```tsx
// ✅ 선택된 대상 근처에 액션 바를 띄운다
{selectedCount > 0 && (
  <div
    role="region"
    aria-label={`${selectedCount}개 선택됨`}
    className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur"
  >
    <span className="text-sm">{selectedCount}개 선택</span>
    <Button size="sm" variant="destructive">삭제</Button>
    <Button size="sm" variant="ghost" onClick={clearSelection}>해제</Button>
  </div>
)}
```

---

### D-WIDE-03 — 이미지·미디어 업스케일 품질

**WHY**
초광폭 히어로에서 1600px 원본을 3840px 폭으로 늘리면 눈에 보이게 흐려진다. `next/image`의 `sizes`가 `100vw`로 설정되어 있어도 `deviceSizes`에 3840이 없으면 최대 후보가 부족하다. 반대로 모든 화면에 4K 이미지를 내려주면 LCP가 망가진다.

**DETECT**

```bash
rg -n "sizes=\"100vw\"|fill" src --glob "*.tsx" -B4
cat next.config.* | rg -A8 "images"
```

**REPRODUCE**

```ts
test('초광폭에서 히어로 이미지가 흐리지 않다', async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2000 });
  await page.goto('/');
  const hero = page.getByTestId('hero-image');
  const info = await hero.evaluate((img: HTMLImageElement) => ({
    currentSrc: img.currentSrc,
    natural: img.naturalWidth,
    css: Math.round(img.getBoundingClientRect().width),
  }));
  expect(info.natural / info.css).toBeGreaterThanOrEqual(0.9);
});
```

**PASS / FAIL**

- PASS: 3840 뷰포트에서 전체 폭 이미지의 `naturalWidth ≥ cssWidth × 0.9`. 1440에서는 과대 이미지를 받지 않는다(전송 바이트 확인).
- FAIL: 히어로가 명확히 흐림, 또는 좁은 화면에서 4K 이미지를 다운로드.

**FIX**

```js
// next.config.ts — 초광폭 후보 추가
images: {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
}
```

- 초광폭 히어로는 사진 대신 벡터/그라디언트/패턴으로 설계해 업스케일 문제를 근본적으로 회피하는 편이 낫다.
- `sizes`를 실제 표시 폭으로 정확히 지정한다. 컨테이너 상한이 1536px이면 `sizes="(min-width: 1536px) 1536px, 100vw"`.

---

### D-WIDE-04 — 세로로 짧고 가로로 긴 화면의 첫 화면 구성

**WHY**
3440×1440(21:9)이나 2560×1080 같은 울트라와이드는 **가로는 매우 넓고 세로는 평범하다.** 세로 여유를 전제로 만든 히어로(큰 제목 + 부제 + 이미지 + CTA를 수직 적층)는 이 비율에서 CTA가 접히고, 가로 공간은 텅 빈다.

**DETECT**

```bash
rg -n "flex-col|space-y-" src/components --glob "*hero*" -n
rg -n "min-h-\[|py-2[0-9]|py-3[0-9]" src --glob "*hero*"
```

**REPRODUCE**

1. 뷰포트 `3440×1000`, `2560×900`으로 홈과 랜딩을 캡처한다.
2. fold 안에 주 CTA가 들어오는지 확인한다.

```ts
await expect(page.getByRole('link', { name: '무료로 시작하기' })).toBeInViewport({ ratio: 1 });
```

3. 좌우 빈 공간에 배치할 수 있는 보조 정보(제품 스크린샷, 지표, 로고 스트립)가 활용되는지 판단한다.

**PASS / FAIL**

- PASS: 21:9 비율에서 주 CTA가 fold 안에 완전히 보이고, 가로 공간이 2열 히어로 등으로 활용된다.
- FAIL: CTA가 fold 밖, 또는 좌우 각각 800px 이상이 빈 상태.

**FIX**

```tsx
// ✅ 넓은 화면에서 수직 적층을 2열로 전환하고 세로 패딩을 뷰포트에 연동
<section className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-[min(8vh,6rem)]">
  <div className="max-w-[42ch] space-y-5">
    <h1 className="text-4xl font-bold lg:text-5xl">...</h1>
    <p className="text-lg text-muted-foreground">...</p>
    <div className="flex gap-3">
      <Button size="lg">무료로 시작하기</Button>
      <Button size="lg" variant="outline">데모 보기</Button>
    </div>
  </div>
  <ProductPreview className="hidden lg:block" />
</section>
```

---

### D-WIDE-05 — 고정 요소의 폭 비례

**WHY**
`fixed` 요소를 화면 전체 폭 기준으로 배치하면 초광폭에서 헤더 로고와 네비게이션이 양 끝으로 벌어져 서로 1500px 떨어진다. 토스트가 화면 우하단 끝에 나타나면 좌측에서 작업하던 사용자는 알아채지 못한다. 스크롤 진행 바나 하단 배너도 같은 문제를 갖는다.

**DETECT**

```bash
rg -n "fixed (inset-x-0|left-0 right-0)" src --glob "*.tsx"
rg -n "Toaster|toast" src --glob "*.tsx" | head -20
```

**REPRODUCE**

1. `2560×1300`에서 헤더·토스트·하단 배너·스크롤 진행바를 캡처한다.
2. 헤더 내부 요소 간 최대 거리와 토스트 위치를 측정한다.
3. 좌측 콘텐츠 작업 중 우하단 토스트가 주변시(peripheral vision) 범위 밖인지 판단한다.

**PASS / FAIL**

- PASS: 고정 헤더 내부는 콘텐츠 컨테이너 폭에 정렬된다. 토스트는 사용자 작업 영역 근처(상단 중앙 또는 컨테이너 우측)에 나타난다.
- FAIL: 헤더 요소가 화면 양 끝에 붙음, 토스트가 인지 불가 위치. S3(토스트가 오류 알림이면 S2).

**FIX**

**BAD**

```tsx
// ❌ 2560px에서 로고와 로그인 버튼이 2400px 떨어진다
<header className="fixed inset-x-0 top-0 flex justify-between px-6">
  <Logo />
  <UserMenu />
</header>
```

**GOOD**

```tsx
// ✅ 고정은 전체 폭, 내부 정렬은 컨테이너 기준
<header className="fixed inset-x-0 top-0 z-40 border-b bg-background/95 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6 lg:px-8">
    <Logo />
    <UserMenu />
  </div>
</header>
```

```tsx
// ✅ 토스트를 상단 중앙으로 → 넓은 화면에서도 인지 가능
<Toaster position="top-center" />
```

---

## 9. Pointer와 Hover

### D-HOVER-01 — Hover 전용 정보와 동작

**WHY**
데스크톱 UI는 hover에 기능을 얹는 습관이 강하다. 행 위에 올렸을 때만 나타나는 삭제 버튼, hover로만 보이는 전체 텍스트, hover로만 열리는 메뉴가 대표적이다. 이 패턴은 **키보드 사용자, 스크린리더 사용자, 터치 스크린 노트북 사용자, 태블릿 사용자**에게 기능을 완전히 차단한다. 게다가 hover 전용 UI는 존재 자체를 알 수 없어 발견 가능성(discoverability)이 낮다.

**DETECT**

```bash
# hover에만 반응하고 focus 대응이 없는 클래스 조합
rg -n "group-hover:(opacity-100|visible|flex|block)" src --glob "*.tsx"
rg -n "opacity-0 .*group-hover:opacity-100" src --glob "*.tsx"
rg -n "invisible .*hover:visible" src --glob "*.tsx"

# focus 대응이 함께 있는지 교차 확인
rg -n "group-focus-within:|focus-visible:opacity-100|focus-within:" src --glob "*.tsx"

# 마우스 이벤트만 있는 핸들러
rg -n "onMouseEnter|onMouseOver" src --glob "*.tsx" -A2 | rg -v "onFocus"
```

`group-hover:opacity-100`의 개수가 `group-focus-within:opacity-100`의 개수보다 크게 많으면 거의 확실한 결함이다.

**REPRODUCE**

1. 마우스를 전혀 쓰지 않고 Tab만으로 목록·테이블 행을 순회한다.
2. hover 시 나타나는 액션(편집·삭제·복사)이 포커스 시에도 나타나는지 확인한다.
3. 자동화로 검증한다.

```ts
test('행 액션이 포커스만으로도 노출된다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/settings/members');

  const row = page.getByRole('row').nth(1);
  const del = row.getByRole('button', { name: '삭제' });

  // hover 없이 키보드 포커스만으로
  await del.focus();
  await expect(del).toBeVisible();

  const opacity = await del.evaluate(el => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBeGreaterThan(0.9);

  // 포인터 이벤트가 차단되지 않아야 한다
  const pe = await del.evaluate(el => getComputedStyle(el).pointerEvents);
  expect(pe).not.toBe('none');
});
```

4. 터치 가능 노트북 조건을 에뮬레이션한다.

```ts
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  hasTouch: true,     // 터치 스크린 노트북
  isMobile: false,
});
```

터치로 탭했을 때 hover 상태가 "붙어서" 남지 않는지 확인한다(sticky hover).

**PASS / FAIL**

- PASS: hover로 노출되는 모든 액션이 `focus` 또는 `focus-within`으로도 노출된다. 스크린리더 접근성 트리에 항상 존재한다. 터치 입력에서 hover 상태가 잔류하지 않는다.
- FAIL: 포커스로 도달 불가한 액션 존재. 삭제·결제 등 핵심 동작이면 **S1**, 그 외 S2.

**FIX**

- `group-hover:` 뒤에 항상 `group-focus-within:`을 짝지어 붙인다.
- `opacity-0`으로 감추더라도 요소는 접근성 트리에 남으므로 스크린리더에서는 문제없다. 단 `pointer-events-none`을 함께 쓰면 포커스 후 클릭이 실패하므로 주의한다.
- hover 상태는 `@media (hover: hover) and (pointer: fine)`로 감싸 터치 기기에서의 sticky hover를 차단한다.
- 발견 가능성이 중요한 액션은 감추지 말고 항상 낮은 대비로 표시한 뒤 hover/focus에서 강조한다.

**BAD**

```tsx
// ❌ 키보드 사용자는 삭제 버튼에 도달할 수 없다 (pointer-events-none까지 겹침)
<tr className="group">
  <td>{member.name}</td>
  <td>
    <button className="pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100">
      삭제
    </button>
  </td>
</tr>
```

**GOOD**

```tsx
// ✅ focus-within 대응 + 포인터 이벤트 유지 + 항상 접근 가능한 이름
<tr className="group">
  <td>{member.name}</td>
  <td>
    <button
      aria-label={`${member.name} 삭제`}
      className="opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
    >
      삭제
    </button>
  </td>
</tr>
```

```css
/* ✅ 진짜 마우스 환경에서만 hover 효과 적용 */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}
```

**REGRESSION**

```ts
test('hover 전용 액션이 없다', async ({ page }) => {
  await page.goto('/settings/members');
  const hoverOnly = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a')]
      .filter(el => {
        const cs = getComputedStyle(el);
        return (Number(cs.opacity) < 0.05 || cs.visibility === 'hidden')
          && el.offsetParent !== null
          && el.getBoundingClientRect().width > 0;
      })
      .map(el => (el.getAttribute('aria-label') ?? el.textContent ?? '').trim()));

  // 완전 투명 상태로 대기하는 인터랙티브 요소는 focus 대응이 있어야 하므로
  // 여기서 검출되면 수동 확인 필요
  expect(hoverOnly, JSON.stringify(hoverOnly)).toEqual([]);
});
```

---

### D-HOVER-02 — Hover 의도(Intent)와 지연

**WHY**
마우스를 목표로 옮기는 경로에서 중간 요소들을 스쳐 지나간다. 지연이 없으면 메뉴가 연속으로 열리고 닫히며 화면이 깜빡이고(플리커), 실수로 열린 오버레이가 목표 요소를 가린다. 반대로 열기 지연이 너무 길면 반응이 둔하게 느껴진다.

**표준 타이밍**

| 동작 | 권장 지연 | 근거 |
|------|-----------|------|
| 메뉴 열기 | 100~150ms | 스쳐 지나감 필터링 |
| 메뉴 닫기 | 250~400ms | 대각선 이동 여유 |
| 툴팁 표시 | 300~500ms | 의도 확인 |
| 툴팁 숨김 | 100~200ms | 즉각성 |
| 키보드 조작 | 0ms | 명시적 의도 |

**DETECT**

```bash
rg -n "onMouseEnter" src --glob "*.tsx" -A4 | rg -v "setTimeout|delay"
rg -n "delayDuration|openDelay|closeDelay|skipDelayDuration" src
```

**REPRODUCE**

1. 마우스를 네비게이션 항목들 위로 빠르게 가로질러 이동한다.
2. 메뉴가 연달아 열리는지, 화면이 깜빡이는지 확인한다.
3. 열린 메뉴에서 대각선으로 서브메뉴로 이동할 때 도중에 닫히는지 확인한다.

```ts
test('빠른 마우스 이동에서 메뉴가 열리지 않는다', async ({ page }) => {
  await page.goto('/');
  const items = page.getByRole('navigation').getByRole('button');
  const count = await items.count();

  for (let i = 0; i < count; i++) {
    const box = await items.nth(i).boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(30); // 스쳐 지나감
  }
  await page.mouse.move(20, 600); // 네비게이션에서 벗어남
  await page.waitForTimeout(200);

  await expect(page.getByRole('menu')).toHaveCount(0);
});
```

**PASS / FAIL**

- PASS: 30ms 간격의 스침으로는 메뉴가 열리지 않는다. 키보드/클릭 조작은 지연 없이 즉시 반응한다. 대각선 이동 중 닫히지 않는다.
- FAIL: 스침으로 메뉴가 열려 화면이 깜빡임, 또는 지연이 400ms를 넘어 둔함. S2/S3.

**FIX**

```tsx
// ✅ 열기 지연 + 닫기 유예를 분리한 hover intent 훅
function useHoverIntent({ openDelay = 120, closeDelay = 300 } = {}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();

  const clear = () => window.clearTimeout(timer.current);

  const onEnter = useCallback(() => {
    clear();
    timer.current = window.setTimeout(() => setOpen(true), openDelay);
  }, [openDelay]);

  const onLeave = useCallback(() => {
    clear();
    timer.current = window.setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay]);

  // 키보드는 즉시
  const openNow = useCallback(() => { clear(); setOpen(true); }, []);
  const closeNow = useCallback(() => { clear(); setOpen(false); }, []);

  useEffect(() => clear, []);

  return { open, onEnter, onLeave, openNow, closeNow };
}
```

**BAD**

```tsx
// ❌ 즉시 열고 즉시 닫음 → 플리커와 대각선 이동 실패
<div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
```

---

### D-HOVER-03 — Hover 브리징(대각선 이동 문제)

**WHY**
드롭다운의 트리거와 패널 사이에 시각적 간격(`sideOffset`)이 있으면, 마우스가 그 틈을 지나는 순간 `mouseleave`가 발생해 메뉴가 닫힌다. 서브메뉴가 오른쪽 아래에 있을 때 사용자는 대각선으로 이동하는데, 그 경로가 부모 메뉴 항목을 벗어나 메뉴가 사라진다. 사용자는 "메뉴를 잡을 수 없다"고 느낀다.

**DETECT**

```bash
rg -n "sideOffset|mt-2|top-full" src --glob "*.tsx" | rg -i "menu|dropdown|submenu"
rg -n "onMouseLeave" src --glob "*.tsx" -B6 | rg -i "submenu|SubContent"
```

**REPRODUCE**

```ts
test('트리거와 패널 사이 간격을 지나도 메뉴가 유지된다', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: '제품' });
  const tb = await trigger.boundingBox();

  await page.mouse.move(tb!.x + tb!.width / 2, tb!.y + tb!.height / 2);
  const panel = page.getByRole('menu');
  await expect(panel).toBeVisible();

  const pb = await panel.boundingBox();
  // 간격 중간 지점을 통과
  await page.mouse.move(tb!.x + tb!.width / 2, tb!.y + tb!.height + 4);
  await page.mouse.move(pb!.x + 40, pb!.y + 20);
  await expect(panel).toBeVisible();

  // 서브메뉴 대각선 이동
  const sub = panel.getByRole('menuitem', { name: '통합' });
  const sb = await sub.boundingBox();
  await page.mouse.move(sb!.x + sb!.width - 8, sb!.y + sb!.height / 2);
  const subPanel = page.getByRole('menu').nth(1);
  await expect(subPanel).toBeVisible();
  const spb = await subPanel.boundingBox();
  await page.mouse.move(spb!.x + 30, spb!.y + spb!.height - 10); // 대각선
  await expect(subPanel).toBeVisible();
});
```

**PASS / FAIL**

- PASS: 트리거→패널 간격 통과와 서브메뉴 대각선 이동에서 메뉴가 유지된다.
- FAIL: 간격 통과 시 닫힘, 대각선 이동 중 서브메뉴 소멸. S2, 메가 메뉴 주 진입 경로면 S1.

**FIX**

세 가지 기법을 조합한다.

1. **닫기 유예(closeDelay 250~400ms)** — D-HOVER-02의 훅
2. **브리지 영역** — 트리거와 패널을 하나의 hover 영역으로 감싸거나 투명 패딩으로 틈을 메운다
3. **안전 삼각형(safe triangle)** — 커서에서 패널 두 모서리로 만든 삼각형 안에 있으면 유지

```tsx
// ✅ 브리지: 패널에 음수 마진 대신 투명 패딩으로 틈을 hover 영역에 포함
<div
  className="relative"
  onMouseEnter={onEnter}
  onMouseLeave={onLeave}
>
  <button aria-expanded={open} aria-haspopup="true">제품</button>

  {open && (
    // pt-2가 트리거와 패널 사이 8px 틈을 hover 가능 영역으로 만든다
    <div className="absolute left-0 top-full pt-2">
      <div className="rounded-lg border bg-popover p-2 shadow-lg">{children}</div>
    </div>
  )}
</div>
```

Radix UI를 쓰면 `sideOffset`이 있어도 내부적으로 브리지와 안전 영역을 처리한다. 자체 구현보다 라이브러리 사용을 우선한다.

**BAD**

```tsx
// ❌ mt-2가 실제 간격을 만들어 mouseleave가 발생한다
{open && <div className="absolute left-0 top-full mt-2 rounded border shadow">{children}</div>}
```

---

### D-HOVER-04 — Hover 상태의 레이아웃 이동과 성능

**WHY**
hover에서 폰트 굵기·패딩·border 두께를 바꾸면 요소 크기가 변해 인접 요소가 밀린다. 목록에서 이 현상이 일어나면 커서 아래 항목이 바뀌어 잘못된 항목을 클릭하게 된다. 또 큰 `box-shadow`나 `filter: blur()` 전환은 데스크톱에서도 페인트 비용이 크고, 많은 카드가 동시에 반응하면 프레임이 떨어진다.

**DETECT**

```bash
rg -n "hover:(font-bold|font-semibold|p-|px-|py-|border-2|text-lg)" src --glob "*.tsx"
rg -n "hover:(blur|backdrop-blur|shadow-2xl)" src --glob "*.tsx"
rg -n "transition-all" src --glob "*.tsx" | wc -l
```

`transition-all`은 예상 밖 속성까지 애니메이션해 비용을 키운다.

**REPRODUCE**

```ts
test('hover가 레이아웃을 이동시키지 않는다', async ({ page }) => {
  await page.goto('/pricing');
  const cards = page.getByTestId('plan-card');
  const before = await cards.evaluateAll(els =>
    els.map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));

  await cards.nth(1).hover();
  await page.waitForTimeout(400);

  const after = await cards.evaluateAll(els =>
    els.map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));

  expect(after).toEqual(before);
});
```

**PASS / FAIL**

- PASS: hover 전후 인접 요소 좌표가 동일하다. 전환은 `transform`·`opacity`·`color`·`background`·`box-shadow` 중심이고 `transition-all`을 남용하지 않는다.
- FAIL: hover로 항목이 밀림(S2, 클릭 오조작 유발), 또는 hover 애니메이션으로 프레임 저하(S3).

**FIX**

- 굵기 변화가 필요하면 사전 공간을 확보한다(투명 border, `text-shadow` 기반 위장 굵기, 또는 `font-variation-settings`).
- 크기 변화는 `transform: scale()`로 처리해 레이아웃에 영향을 주지 않는다.
- `transition-colors`, `transition-transform`처럼 대상을 명시한다.
- `prefers-reduced-motion`에서 전환을 제거한다.

**GOOD**

```tsx
// ✅ 레이아웃에 영향 없는 hover
<article className="rounded-lg border border-transparent p-6 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
  ...
</article>
```

---

### D-HOVER-05 — Hover 대비와 상태 구분

**WHY**
hover 배경이 기본 배경과 거의 같으면 사용자는 무엇이 활성인지 알 수 없다. 반대로 hover 시 텍스트 대비가 떨어지면(예: 배경이 어두워지는데 글자는 그대로) 가독성이 하락한다. 또 hover·focus·active·selected·disabled가 시각적으로 구분되지 않으면 상태 인지가 불가능하다.

**DETECT**

```bash
rg -n "hover:bg-" src --glob "*.tsx" | rg -o "hover:bg-[a-z-0-9/]+" | sort | uniq -c | sort -rn | head -20
rg -n "aria-selected|data-state=\"(active|selected|checked)\"" src
```

**REPRODUCE**

```ts
const contrast = await page.evaluate(() => {
  const el = document.querySelector<HTMLElement>('[data-testid="nav-item"]')!;
  const base = getComputedStyle(el).backgroundColor;
  return base;
});
// hover 후 배경/전경 색을 다시 읽어 대비를 계산한다
```

수동 확인 항목:

1. hover 배경과 기본 배경의 명도 차가 인지 가능한가(권장 대비 1.3:1 이상)
2. hover 상태에서 텍스트 대비가 4.5:1 이상 유지되는가
3. hover / focus-visible / active / selected가 서로 구별되는가
4. disabled 요소에 hover 효과가 적용되지 않는가

**PASS / FAIL**

- PASS: 위 4개 항목을 모두 충족한다. 다크 모드에서도 동일하다.
- FAIL: hover 인지 불가, hover에서 텍스트 대비 4.5:1 미달, disabled에도 hover 반응. S2/S3.

**FIX**

```tsx
// ✅ 상태별로 명확히 다른 표현 + disabled 제외
<button
  disabled={isDisabled}
  aria-current={isActive ? 'page' : undefined}
  className={cn(
    'rounded-md px-3 py-2 text-sm transition-colors',
    'hover:bg-accent hover:text-accent-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'active:bg-accent/80',
    'disabled:pointer-events-none disabled:opacity-50',
    isActive && 'bg-accent/60 font-medium text-accent-foreground',
  )}
>
  {label}
</button>
```

`disabled:pointer-events-none`은 hover 효과와 커서 변화를 함께 막는다. 단 툴팁으로 비활성 이유를 알려야 하는 경우에는 D-TIP-04를 따른다.

---

## 10. Keyboard와 Focus

### D-KEY-01 — 키보드 단독 완주

**WHY**
데스크톱은 키보드 사용 비중이 가장 높은 환경이다. 파워 유저는 Tab과 단축키로 작업하고, 운동 장애 사용자와 스크린리더 사용자는 키보드가 유일한 입력이다. 마우스로만 도달 가능한 컨트롤이 하나라도 있으면 그 기능은 존재하지 않는 것과 같다.

**DETECT**

```bash
# 클릭만 처리하는 비의미론적 요소
rg -n "<div[^>]*onClick|<span[^>]*onClick" src --glob "*.tsx"
# 포커스 제거
rg -n "outline-none|outline: none|focus:outline-none" src | rg -v "focus-visible:ring"
rg -n "tabIndex=\{-1\}|tabindex=\"-1\"" src
```

`focus:outline-none`이 `focus-visible:ring-*` 없이 단독으로 있으면 즉시 결함이다.

**REPRODUCE**

각 P0 라우트에서 마우스를 사용하지 않고 완주한다.

```ts
test('키보드만으로 멤버 초대를 완료할 수 있다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/settings/members');

  // Tab으로 초대 버튼까지 도달
  let found = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return (el?.getAttribute('aria-label') ?? el?.textContent ?? '').trim();
    });
    if (label.includes('멤버 초대')) { found = true; break; }
  }
  expect(found, '초대 버튼에 Tab으로 도달 불가').toBe(true);

  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // 포커스가 다이얼로그 안으로 이동했는지
  const inside = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]')!;
    return dlg.contains(document.activeElement);
  });
  expect(inside).toBe(true);

  await page.keyboard.type('teammate@example.com');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter'); // 저장
  await expect(page.getByRole('status')).toContainText('초대');
});
```

포커스 순서 전체를 덤프해 시각 순서와 비교한다.

```ts
const order = await page.evaluate(() => {
  const focusable = [...document.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.offsetParent !== null);
  return focusable.map(el => {
    const r = el.getBoundingClientRect();
    return {
      label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30),
      x: Math.round(r.x), y: Math.round(r.y),
      tabIndex: el.tabIndex,
    };
  });
});
// y 오름차순, 같은 행이면 x 오름차순이어야 한다
```

**PASS / FAIL**

- PASS: 모든 P0 플로우를 마우스 없이 완주할 수 있고, 포커스 순서가 시각 순서와 일치하며(같은 행 기준 ±40px 허용), `tabIndex > 0`이 없다.
- FAIL: 도달 불가 컨트롤 존재(**S1**), 포커스 순서 역행(S2), 양수 tabindex 사용(S2).

**FIX**

- 클릭 가능한 요소는 `<button>`/`<a>`를 사용한다. `div + onClick`은 `role`·`tabIndex`·`onKeyDown` 3개를 직접 구현해야 하며 대개 불완전하다.
- 시각 순서와 DOM 순서를 일치시킨다. `order-*`나 `flex-row-reverse`로 순서를 뒤집으면 포커스 순서가 어긋난다.
- 양수 tabindex를 쓰지 않는다.

**BAD**

```tsx
// ❌ 키보드로 도달 불가, 역할 없음, Enter/Space 미처리
<div onClick={() => openRow(row.id)} className="cursor-pointer">
  {row.name}
</div>

// ❌ 시각 순서와 DOM 순서 불일치 → 포커스가 역행
<div className="flex flex-row-reverse">
  <Button>다음</Button>
  <Button>이전</Button>
</div>
```

**GOOD**

```tsx
// ✅ 의미론적 요소 사용
<button type="button" onClick={() => openRow(row.id)} className="w-full text-left">
  {row.name}
</button>

// ✅ DOM 순서 = 시각 순서
<div className="flex gap-2">
  <Button variant="ghost">이전</Button>
  <Button>다음</Button>
</div>
```

---

### D-KEY-02 — Focus Visible

**WHY**
포커스 링이 없으면 키보드 사용자는 현재 위치를 알 수 없다. 데스크톱에서는 화면이 넓어 포커스가 어디로 갔는지 찾기가 더 어렵다. `outline: none`만 남기고 대체를 제공하지 않는 것이 가장 흔한 접근성 위반이며, WCAG 2.2의 2.4.11(Focus Not Obscured)과 2.4.13(Focus Appearance)까지 함께 위반한다.

**DETECT**

```bash
rg -n "outline-none|outline: none" src | rg -v "focus-visible:"
rg -n ":focus \{" src --glob "*.css" -A3
rg -n "focus-visible:ring" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('모든 포커스 가능 요소에 가시적 포커스 표시가 있다', async ({ page }) => {
  await page.goto('/dashboard');

  const invisible: string[] = [];
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1;
      const hasShadow = cs.boxShadow !== 'none';
      const hasBorderChange = cs.borderColor !== 'rgba(0, 0, 0, 0)';
      return {
        label: (el.getAttribute('aria-label') ?? el.textContent ?? el.tagName).trim().slice(0, 40),
        visible: hasOutline || hasShadow || hasBorderChange,
        outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        boxShadow: cs.boxShadow.slice(0, 60),
      };
    });
    if (info && !info.visible) invisible.push(info.label);
  }
  expect(invisible, JSON.stringify(invisible)).toEqual([]);
});
```

포커스가 고정 UI에 가려지는지도 확인한다(2.4.11).

```ts
const obscured = await page.evaluate(() => {
  const el = document.activeElement as HTMLElement;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  return { obscured: top !== el && !el.contains(top), topTag: top?.tagName };
});
expect(obscured.obscured).toBe(false);
```

**PASS / FAIL**

- PASS: 모든 포커스 가능 요소에 대비 3:1 이상, 두께 2px 이상의 포커스 표시가 있다. 포커스된 요소가 sticky 헤더/푸터에 가려지지 않는다. 다크 모드에서도 보인다.
- FAIL: 포커스 표시 없음(**S1**), 대비 부족 또는 sticky에 가려짐(S2).

**FIX**

```css
/* ✅ 전역 기본값: 포커스 링을 절대 제거하지 않고 통일 */
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: inherit;
}

/* ✅ sticky 헤더에 가려지지 않도록 스크롤 여유 확보 */
html {
  scroll-padding-top: var(--header-height, 4rem);
  scroll-padding-bottom: 2rem;
}

*:focus-visible {
  scroll-margin-top: calc(var(--header-height, 4rem) + 0.5rem);
  scroll-margin-bottom: 1rem;
}
```

**BAD**

```tsx
// ❌ 포커스 표시를 없애고 대체를 주지 않았다
<button className="outline-none">저장</button>
```

**GOOD**

```tsx
// ✅ 마우스 클릭에는 링이 안 보이고 키보드에는 보인다
<button className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  저장
</button>
```

---

### D-KEY-03 — Focus Trap과 복귀

**WHY**
모달·드로어·메뉴가 열렸을 때 포커스가 배경으로 새어 나가면 키보드 사용자는 보이지 않는 요소를 조작하게 된다. 닫힌 뒤 포커스가 `<body>`로 초기화되면 사용자는 화면 맨 위로 돌아가 작업 맥락을 잃는다. 긴 테이블에서 20번째 행의 메뉴를 닫았는데 포커스가 헤더로 가면 실질적으로 작업을 다시 시작해야 한다.

**DETECT**

```bash
rg -n "role=\"dialog\"|<Dialog|<Sheet|<Drawer|<Modal" src --glob "*.tsx"
rg -n "createPortal" src -A5 | rg -v "aria-modal|inert"
rg -n "aria-modal|inert|FocusTrap|useFocusTrap" src
```

**REPRODUCE**

```ts
test('모달이 포커스를 가두고 닫으면 트리거로 복귀한다', async ({ page }) => {
  await page.goto('/settings/members');
  const trigger = page.getByRole('button', { name: '멤버 초대' });
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');

  // Tab을 30번 눌러도 포커스가 다이얼로그를 벗어나지 않는다
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      document.querySelector('[role="dialog"]')!.contains(document.activeElement));
    expect(inside, `Tab #${i + 1}에서 포커스 유출`).toBe(true);
  }

  // Shift+Tab 역방향도 동일
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Shift+Tab');
    const inside = await page.evaluate(() =>
      document.querySelector('[role="dialog"]')!.contains(document.activeElement));
    expect(inside).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

**PASS / FAIL**

- PASS: 열림 시 첫 유의미 요소로 포커스 이동, Tab/Shift+Tab 순환이 오버레이 내부로 제한, Esc로 닫힘, 닫힘 후 트리거로 복귀. 배경 요소는 `inert` 또는 `aria-hidden`으로 접근성 트리에서 제거.
- FAIL: 포커스 유출(**S1**), 복귀 실패(S2), Esc 미작동(S2).

**FIX**

- Radix Dialog 등 검증된 프리미티브를 사용한다. 자체 구현은 순환·복귀·중첩·`inert`를 모두 처리해야 한다.
- 자동 포커스 대상은 닫기 버튼이 아니라 **첫 입력 필드 또는 제목**으로 한다. 파괴적 작업 확인 모달은 안전한 쪽(취소)에 포커스한다.
- 트리거가 사라진 경우(행 삭제 등)에는 합리적 대체 위치(목록 컨테이너 또는 상태 메시지)로 포커스를 옮긴다.

**GOOD**

```tsx
// ✅ 복귀 대상을 명시적으로 관리
function DeleteRowDialog({ rowId, onDeleted }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      // 삭제로 트리거가 사라지면 목록으로 복귀
      onCloseAutoFocus={(e) => {
        if (!document.body.contains(triggerRef.current)) {
          e.preventDefault();
          document.getElementById('members-table')?.focus();
        }
      }}
    >
      <DialogTrigger ref={triggerRef} asChild>
        <Button variant="ghost">삭제</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>삭제하시겠습니까?</DialogTitle>
        <DialogFooter>
          {/* 파괴적 작업은 안전한 쪽에 초기 포커스 */}
          <Button autoFocus variant="ghost" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="destructive" onClick={onDeleted}>삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### D-KEY-04 — 복합 위젯의 키보드 규약

**WHY**
Tab만으로 모든 항목을 순회하게 만들면 100개 항목 리스트에서 Tab을 100번 눌러야 다음 섹션으로 갈 수 있다. ARIA 규약은 복합 위젯(메뉴·탭·트리·그리드·리스트박스)을 **하나의 Tab 정지점**으로 만들고 내부는 화살표 키로 이동하게 한다. 규약을 지키지 않으면 스크린리더 사용자의 기대와 어긋나 조작이 불가능해진다.

**위젯별 필수 키 규약**

| 위젯 | Tab | 화살표 | Home/End | Esc | 기타 |
|------|-----|--------|----------|-----|------|
| Menu / MenuBar | 진입/이탈(1정지점) | 상하 이동, 좌우 서브메뉴 | 첫/끝 항목 | 닫고 트리거 복귀 | 문자 타이핑 = typeahead |
| Tabs | 탭 목록 1정지점 → 패널 | 좌우 탭 이동 | 첫/끝 탭 | — | 자동/수동 활성화 정책 |
| Listbox / Select | 1정지점 | 상하 옵션 | 첫/끝 | 닫고 값 유지 | typeahead, Enter 확정 |
| Combobox | 입력에 정지 | 상하 옵션 | 텍스트 이동 | 팝업 닫기 | `aria-activedescendant` |
| Tree | 1정지점 | 상하 노드, 우 확장 좌 축소 | 첫/끝 | — | `*` 전체 확장 |
| Grid / Table | 1정지점 | 상하좌우 셀 | 행 시작/끝 | — | Ctrl+Home 첫 셀 |
| Radio Group | 선택된 항목 1정지점 | 상하좌우 이동 + 선택 | — | — | 이동 시 즉시 선택 |
| Slider | 1정지점 | 좌우 값 조절 | 최소/최대 | — | PageUp/Down 큰 단위 |

**DETECT**

```bash
rg -n "role=\"(menu|menubar|tablist|listbox|tree|grid|radiogroup)\"" src
rg -n "onKeyDown" src --glob "*.tsx" | head -30
rg -n "aria-activedescendant|roving" src
```

**REPRODUCE**

```ts
test('드롭다운 메뉴가 ARIA 키보드 규약을 따른다', async ({ page }) => {
  await page.goto('/dashboard');
  const trigger = page.getByRole('button', { name: '계정 메뉴' });

  await trigger.focus();
  await page.keyboard.press('Enter');

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  // 첫 항목에 포커스
  const items = menu.getByRole('menuitem');
  await expect(items.first()).toBeFocused();

  // 화살표 이동
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();

  // End → 마지막
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();

  // 순환
  await page.keyboard.press('ArrowDown');
  await expect(items.first()).toBeFocused();

  // typeahead
  await page.keyboard.press('s');
  const focusedText = await page.evaluate(() =>
    (document.activeElement?.textContent ?? '').trim());
  expect(focusedText.toLowerCase().startsWith('s')).toBe(true);

  // Esc → 닫고 복귀
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

**PASS / FAIL**

- PASS: 각 위젯이 위 표의 규약을 충족하고, 복합 위젯이 Tab 정지점을 하나만 갖는다.
- FAIL: 화살표 미작동(S2), Tab으로만 순회(S2), Esc 미작동(S2), `role`은 있으나 키보드 미구현(**S1** — 스크린리더 사용자에게 조작 불가).

**FIX**

- Radix / Headless UI / React Aria 등 규약이 구현된 프리미티브를 사용한다. 직접 구현하면 typeahead·순환·중첩·RTL을 모두 놓친다.
- 직접 구현이 필요하면 roving tabindex 패턴을 쓴다.

**GOOD**

```tsx
// ✅ roving tabindex: 컨테이너는 1정지점, 내부는 화살표 이동
function OptionList({ options, value, onChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex(o => o.id === value)));
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  const move = (next: number) => {
    const i = (next + options.length) % options.length;
    setActiveIndex(i);
    refs.current[i]?.focus();
  };

  return (
    <ul
      role="listbox"
      aria-activedescendant={`opt-${options[activeIndex].id}`}
      onKeyDown={(e) => {
        switch (e.key) {
          case 'ArrowDown': e.preventDefault(); move(activeIndex + 1); break;
          case 'ArrowUp':   e.preventDefault(); move(activeIndex - 1); break;
          case 'Home':      e.preventDefault(); move(0); break;
          case 'End':       e.preventDefault(); move(options.length - 1); break;
          case 'Enter':
          case ' ':         e.preventDefault(); onChange(options[activeIndex].id); break;
        }
      }}
    >
      {options.map((o, i) => (
        <li
          key={o.id}
          id={`opt-${o.id}`}
          ref={el => { refs.current[i] = el; }}
          role="option"
          aria-selected={o.id === value}
          tabIndex={i === activeIndex ? 0 : -1}
          onClick={() => onChange(o.id)}
          className="cursor-pointer px-3 py-2 aria-selected:bg-accent focus-visible:ring-2"
        >
          {o.label}
        </li>
      ))}
    </ul>
  );
}
```

---

### D-KEY-05 — 단축키 충돌과 안전성

**WHY**
데스크톱 앱은 단축키(`/` 검색, `Cmd+K` 팔레트, `?` 도움말)를 흔히 제공한다. 입력 필드에서 `/`를 누르면 검색이 열려 타이핑이 끊기고, 단일 문자 단축키는 음성 입력 사용자에게 오작동을 일으킨다(WCAG 2.1.4 Character Key Shortcuts). 브라우저·스크린리더 예약 키(`Ctrl+W`, `Alt+F4`, `Cmd+L`, `Insert` 조합)를 가로채면 사용자를 가둘 수 있다.

**DETECT**

```bash
rg -n "addEventListener\('keydown'|onKeyDown" src -A8 | rg -n "e\.key === |metaKey|ctrlKey"
rg -n "preventDefault" src --glob "*.tsx" | head -30
rg -n "useHotkeys|hotkey|shortcut" src
```

**REPRODUCE**

1. 입력 필드에 포커스를 두고 단축키 문자(`/`, `?`, `k`, `n`)를 타이핑한다.
2. 텍스트가 정상 입력되는지, 단축키가 발동하지 않는지 확인한다.
3. `contenteditable` 영역에서도 반복한다.
4. 브라우저 예약 키를 눌러 정상 동작하는지 확인한다.

```ts
test('입력 중에는 단일 문자 단축키가 발동하지 않는다', async ({ page }) => {
  await page.goto('/dashboard');
  const input = page.getByLabel('멤버 검색');
  await input.fill('');
  await input.type('a/b?c');
  await expect(input).toHaveValue('a/b?c');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
```

**PASS / FAIL**

- PASS: 입력·textarea·contenteditable·select 안에서 단일 문자 단축키가 발동하지 않는다. 단축키 목록이 문서화되어 있고(`?` 등으로 확인 가능) 비활성화 또는 재정의가 가능하다. 브라우저 예약 키를 가로채지 않는다.
- FAIL: 입력 중 단축키 발동(S2), 브라우저 예약 키 차단(S1), 단축키 발견 수단 없음(S3).

**FIX**

```ts
// ✅ 편집 컨텍스트 판별 후 단축키 처리
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    el.closest('[role="textbox"], [role="combobox"]') !== null
  );
}

useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (isEditableTarget(e.target)) return;
    if (e.altKey) return; // 스크린리더/브라우저 조합 회피

    // 수식어 있는 단축키는 안전
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    // 단일 문자 단축키는 설정으로 끌 수 있어야 한다
    if (!shortcutsEnabled) return;
    if (e.key === '/') { e.preventDefault(); focusSearch(); }
    if (e.key === '?') { e.preventDefault(); openShortcutHelp(); }
  };

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}, [shortcutsEnabled]);
```

---

### D-KEY-06 — Skip Link와 랜드마크 탐색

**WHY**
데스크톱 레이아웃은 헤더 + 메가 메뉴 + Sidebar를 합쳐 포커스 정지점이 40~80개에 달한다. Skip link가 없으면 키보드 사용자는 매 페이지에서 이 전부를 지나야 본문에 도달한다. 랜드마크(`banner`, `navigation`, `main`, `complementary`, `contentinfo`)가 없으면 스크린리더의 영역 점프도 불가능하다.

**DETECT**

```bash
rg -n "skip|본문으로|바로가기" src/app src/components --glob "*.tsx"
rg -n "<main|role=\"main\"|<nav|<aside|<footer|<header" src/app src/components
rg -n "aria-label" src/components/layout --glob "*.tsx"
```

**REPRODUCE**

```ts
test('첫 Tab에서 본문 건너뛰기 링크가 나타난다', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: /본문으로|건너뛰기|skip/i });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport(); // 시각적으로 보여야 한다

  await page.keyboard.press('Enter');
  const focusedIsMain = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.id === 'main-content' || el?.tagName === 'MAIN';
  });
  expect(focusedIsMain).toBe(true);
});

test('랜드마크가 고유하게 라벨링되어 있다', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);

  // 여러 navigation이 있으면 각각 라벨이 있어야 한다
  const navs = page.getByRole('navigation');
  const n = await navs.count();
  for (let i = 0; i < n; i++) {
    const label = await navs.nth(i).getAttribute('aria-label');
    expect(label, `navigation[${i}]에 aria-label 없음`).toBeTruthy();
  }
});
```

**PASS / FAIL**

- PASS: 첫 Tab에서 skip link가 시각적으로 나타나고 동작한다. `main`이 정확히 1개이며 포커스 가능하다. 복수 `navigation`에 고유 라벨이 있다.
- FAIL: skip link 없음(S2), 있으나 시각적으로 나타나지 않음(S2), main 중복 또는 없음(S2).

**FIX**

```tsx
// ✅ app/layout.tsx
<body>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
  >
    본문으로 건너뛰기
  </a>

  <header>
    <nav aria-label="주 메뉴">...</nav>
  </header>

  <div className="flex">
    <aside>
      <nav aria-label="사이드바 메뉴">...</nav>
    </aside>
    {/* tabIndex={-1}로 프로그램적 포커스를 허용 */}
    <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
      {children}
    </main>
  </div>

  <footer>
    <nav aria-label="푸터 메뉴">...</nav>
  </footer>
</body>
```

Sidebar가 긴 경우 "사이드바 건너뛰기" 링크를 추가로 제공한다.

---

## 11. Dropdown · Select · Combobox

### D-DROP-01 — 조상 overflow에 의한 잘림

**WHY**
`position: absolute`로 구현한 드롭다운은 조상 중 `overflow: hidden|auto|scroll`, `transform`, `filter`, `contain`을 가진 요소가 있으면 그 경계에서 잘린다. 카드 안의 액션 메뉴, 테이블 컨테이너(`overflow-x-auto`) 안의 행 메뉴, 스크롤 가능한 Sidebar의 하위 메뉴에서 반드시 발생한다. 잘린 메뉴는 항목 선택이 불가능해 기능 차단이다.

**DETECT**

```bash
# absolute 드롭다운
rg -n "absolute (top-full|right-0|left-0)" src --glob "*.tsx" -B6 | rg -i "menu|dropdown|select|options"
# 스크롤 컨테이너
rg -n "overflow-(hidden|auto|scroll|x-auto|y-auto)" src --glob "*.tsx"
# 포털 사용 여부
rg -n "createPortal|DropdownMenuPortal|SelectPortal|PopoverPortal" src
```

**REPRODUCE**

1. 테이블 컨테이너(`overflow-x-auto`) 안의 마지막 행 액션 메뉴를 연다.
2. 메뉴가 컨테이너 하단에서 잘리는지 확인한다.

```ts
test('스크롤 컨테이너 안의 메뉴가 잘리지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/settings/members');

  const rows = page.getByRole('row');
  const last = rows.nth(await rows.count() - 1);
  await last.getByRole('button', { name: '작업' }).click();

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();

  const clipped = await menu.evaluate(el => {
    const r = el.getBoundingClientRect();
    let node = el.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (/hidden|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        const pr = node.getBoundingClientRect();
        if (r.bottom > pr.bottom + 1 || r.right > pr.right + 1 || r.top < pr.top - 1) {
          return { by: node.className.slice(0, 80), menu: r, parent: pr };
        }
      }
      node = node.parentElement;
    }
    return null;
  });
  expect(clipped, JSON.stringify(clipped)).toBeNull();

  // 마지막 항목까지 실제로 클릭 가능해야 한다
  const items = menu.getByRole('menuitem');
  await expect(items.last()).toBeInViewport();
});
```

**PASS / FAIL**

- PASS: 모든 드롭다운이 포털로 `body`에 렌더되거나, 조상 경계에 잘리지 않는다. 모든 항목이 뷰포트 안에서 클릭 가능하다.
- FAIL: 항목이 잘려 선택 불가(**S1**), 부분 잘림(S2).

**FIX**

- 포털을 사용해 오버레이를 `body` 하위에 렌더한다.
- `transform`을 가진 조상이 있으면 `position: fixed` 기반 포지셔닝도 그 조상 기준이 되므로, 포털이 유일한 해법이다.
- 트리거가 스크롤될 때 위치를 갱신하거나 자동으로 닫는다.

**BAD**

```tsx
// ❌ overflow-x-auto 컨테이너 안 absolute → 잘린다
<div className="overflow-x-auto">
  <table>
    <td className="relative">
      {open && <ul className="absolute right-0 top-full w-40 border bg-white shadow">...</ul>}
    </td>
  </table>
</div>
```

**GOOD**

```tsx
// ✅ 포털 + 충돌 회피 + 사용 가능 높이 제약
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" aria-label={`${row.name} 작업`}>⋯</Button>
  </DropdownMenuTrigger>
  <DropdownMenuPortal>
    <DropdownMenuContent
      align="end"
      sideOffset={4}
      collisionPadding={12}
      className="z-50 max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto"
    >
      <DropdownMenuItem>편집</DropdownMenuItem>
      <DropdownMenuItem className="text-destructive">삭제</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuPortal>
</DropdownMenu>
```

**REGRESSION**

```ts
test('모든 행의 액션 메뉴가 뷰포트 안에 완전히 표시된다', async ({ page }) => {
  await page.goto('/settings/members');
  const triggers = page.getByRole('button', { name: /작업$/ });
  const count = Math.min(await triggers.count(), 10);

  for (let i = 0; i < count; i++) {
    await triggers.nth(i).click();
    const menu = page.getByRole('menu');
    const box = await menu.boundingBox();
    const vp = page.viewportSize()!;
    expect(box!.y + box!.height, `row ${i} 메뉴가 하단을 벗어남`).toBeLessThanOrEqual(vp.height + 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
    await page.keyboard.press('Escape');
  }
});
```

---

### D-DROP-02 — 충돌 회피와 사용 가능 높이

**WHY**
화면 하단 근처 트리거에서 아래로 열리는 메뉴는 뷰포트를 벗어난다. 항목이 40개인 국가 선택 드롭다운은 높이 제한 없이 열리면 화면을 넘고 스크롤도 되지 않는다. 사용자는 목록의 일부만 볼 수 있고 나머지는 도달 불가하다.

**DETECT**

```bash
rg -n "DropdownMenuContent|SelectContent|PopoverContent" src -A4 | rg -v "max-h|available-height"
rg -n "side=|align=|collisionPadding" src
```

**REPRODUCE**

1. 뷰포트를 `1440×620`(짧은 높이)으로 설정한다.
2. 페이지 하단 근처의 셀렉트를 연다.
3. 위쪽으로 flip되는지, 높이가 제한되고 내부 스크롤이 생기는지 확인한다.

```ts
test('하단 트리거의 셀렉트가 뷰포트 안에 맞춰진다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 620 });
  await page.goto('/settings/profile');

  const select = page.getByLabel('국가');
  await select.scrollIntoViewIfNeeded();
  await select.click();

  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();

  const box = await listbox.boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 1);

  // 마지막 옵션까지 스크롤해 선택 가능
  const options = listbox.getByRole('option');
  await options.last().scrollIntoViewIfNeeded();
  await expect(options.last()).toBeInViewport();
});
```

**PASS / FAIL**

- PASS: 공간이 부족하면 flip 또는 shift로 재배치되고, 높이가 뷰포트에 맞춰 제한되며 내부 스크롤로 모든 옵션에 도달한다.
- FAIL: 뷰포트를 벗어나 옵션 선택 불가(**S1**), 높이 무제한(S2).

**FIX**

```tsx
// ✅ 사용 가능 높이 CSS 변수 활용
<SelectContent
  position="popper"
  sideOffset={4}
  collisionPadding={12}
  className="max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-y-auto"
>
  {countries.map(c => (
    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
  ))}
</SelectContent>
```

옵션이 50개를 넘으면 검색 가능한 Combobox로 전환한다. 500개를 넘으면 가상화를 적용한다(D-PERF-03).

---

### D-DROP-03 — 열림 상태와 ARIA 상태 동기화

**WHY**
`aria-expanded`, `aria-haspopup`, `aria-controls`가 없거나 상태와 어긋나면 스크린리더 사용자는 메뉴가 열렸는지 알 수 없고, 열린 내용을 탐색할 방법도 알 수 없다. `role`만 붙이고 상태를 갱신하지 않는 것이 흔한 실수다.

**DETECT**

```bash
rg -n "aria-expanded" src --glob "*.tsx" | head -30
rg -n "aria-haspopup|aria-controls|aria-activedescendant" src
# 트리거 후보 중 aria-expanded가 없는 것
rg -n "setOpen\(|toggleOpen" src --glob "*.tsx" -B6 | rg "<button" | rg -v "aria-expanded"
```

**REPRODUCE**

```ts
test('드롭다운 ARIA 상태가 동기화된다', async ({ page }) => {
  await page.goto('/dashboard');
  const trigger = page.getByRole('button', { name: '계정 메뉴' });

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveAttribute('aria-haspopup', /menu|true/);

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menu')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
```

Combobox는 추가 검증이 필요하다.

```ts
test('콤보박스 ARIA 계약', async ({ page }) => {
  const input = page.getByRole('combobox', { name: '멤버 검색' });
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveAttribute('aria-autocomplete', /list|both/);

  await input.type('ki');
  await expect(input).toHaveAttribute('aria-expanded', 'true');

  const listboxId = await input.getAttribute('aria-controls');
  expect(listboxId).toBeTruthy();

  await page.keyboard.press('ArrowDown');
  const activeId = await input.getAttribute('aria-activedescendant');
  expect(activeId).toBeTruthy();
  await expect(page.locator(`#${activeId}`)).toHaveAttribute('aria-selected', 'true');
});
```

**PASS / FAIL**

- PASS: 트리거에 `aria-expanded`가 있고 열림/닫힘에 따라 갱신된다. `aria-haspopup`이 적절하다. Combobox는 `aria-controls`와 `aria-activedescendant`를 유지한다.
- FAIL: 상태 속성 없음 또는 미갱신. 스크린리더 사용자에게 조작 불가이므로 **S1~S2**.

**FIX**

```tsx
// ✅ 상태와 속성을 한 소스에서 파생
<button
  type="button"
  aria-expanded={open}
  aria-haspopup="menu"
  aria-controls={open ? menuId : undefined}
  onClick={() => setOpen(o => !o)}
>
  계정 메뉴
</button>
{open && <ul id={menuId} role="menu">...</ul>}
```

`useId()`로 ID를 생성해 SSR 하이드레이션 불일치를 피한다.

---

### D-DROP-04 — 외부 클릭·스크롤·라우트 변경 시 닫힘

**WHY**
드롭다운이 스크롤 시 트리거를 따라가지 않으면 화면 중간에 떠 있는 유령 메뉴가 된다. 라우트 이동 후에도 열려 있으면 잘못된 맥락의 메뉴가 남는다. 외부 클릭으로 닫히지 않으면 사용자는 메뉴를 치우는 방법을 모른다. 반대로 메뉴 내부 스크롤을 외부 클릭으로 오인해 닫으면 조작이 불가능하다.

**DETECT**

```bash
rg -n "addEventListener\('(click|mousedown|pointerdown)'" src -A6
rg -n "usePathname|useRouter" src --glob "*.tsx" -A6 | rg "setOpen\(false\)"
rg -n "onScroll|addEventListener\('scroll'" src
```

`click` 리스너로 외부 클릭을 감지하면 트리거 클릭과 경합해 토글이 즉시 되돌아가는 버그가 흔하다. `pointerdown`을 쓰고 트리거를 제외한다.

**REPRODUCE**

```ts
test('드롭다운 닫힘 조건', async ({ page }) => {
  await page.goto('/dashboard');
  const trigger = page.getByRole('button', { name: '계정 메뉴' });

  // 1. 외부 클릭
  await trigger.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.mouse.click(20, 400);
  await expect(page.getByRole('menu')).toBeHidden();

  // 2. Esc
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();

  // 3. 페이지 스크롤
  await trigger.click();
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  const menu = page.getByRole('menu');
  if (await menu.isVisible()) {
    // 열려 있다면 트리거를 정확히 따라가야 한다
    const tb = await trigger.boundingBox();
    const mb = await menu.boundingBox();
    expect(Math.abs(mb!.y - (tb!.y + tb!.height)), '스크롤 후 메뉴가 트리거를 따라가지 않음')
      .toBeLessThanOrEqual(12);
  }

  // 4. 라우트 이동
  await page.keyboard.press('Escape');
  await trigger.click();
  await page.getByRole('link', { name: '설정' }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
});
```

**PASS / FAIL**

- PASS: 외부 pointerdown, Esc, 라우트 변경에서 닫힌다. 스크롤 시 트리거를 따라가거나 닫힌다. 메뉴 내부 스크롤로는 닫히지 않는다. 트리거 재클릭이 정상 토글된다.
- FAIL: 유령 메뉴 잔류(S2), 외부 클릭 미작동(S2), 트리거 클릭이 토글되지 않음(S2).

**FIX**

```tsx
// ✅ 라우트 변경 시 자동 닫힘
const pathname = usePathname();
useEffect(() => { setOpen(false); }, [pathname]);
```

```ts
// ✅ pointerdown + 트리거/패널 제외
useEffect(() => {
  if (!open) return;
  const onPointerDown = (e: PointerEvent) => {
    const t = e.target as Node;
    if (panelRef.current?.contains(t)) return;
    if (triggerRef.current?.contains(t)) return; // 트리거는 토글이 처리
    setOpen(false);
  };
  document.addEventListener('pointerdown', onPointerDown);
  return () => document.removeEventListener('pointerdown', onPointerDown);
}, [open]);
```

---

### D-DROP-05 — 네이티브 Select와 커스텀 Select 선택 기준

**WHY**
커스텀 셀렉트는 스타일 자유도를 얻는 대신 키보드 규약·typeahead·폼 통합·자동완성·스크린리더 호환을 모두 직접 책임진다. 대부분의 자체 구현은 typeahead, `form` 제출 값, `required` 검증, 모바일 네이티브 피커 중 최소 하나를 놓친다. **단순 선택에는 네이티브가 더 안전하다.**

**선택 기준**

| 조건 | 권장 |
|------|------|
| 옵션 20개 이하, 단순 라벨 | 네이티브 `<select>` |
| 검색 필요, 옵션 다수 | Combobox (검증된 라이브러리) |
| 다중 선택 | 커스텀 또는 체크박스 목록 |
| 옵션에 아이콘·설명·그룹 필요 | 커스텀 (라이브러리) |
| 폼 제출·검증 통합 중요 | 네이티브 또는 hidden input 병행 |

**DETECT**

```bash
rg -n "<select" src --glob "*.tsx" | wc -l
rg -n "role=\"listbox\"|SelectTrigger|<Combobox" src | wc -l
# 커스텀 셀렉트가 폼 값을 제출하는지
rg -n "type=\"hidden\"" src --glob "*.tsx"
```

**REPRODUCE**

커스텀 셀렉트마다 확인한다.

```ts
test('커스텀 셀렉트가 폼과 통합된다', async ({ page }) => {
  await page.goto('/settings/profile');

  // 1. typeahead
  await page.getByRole('combobox', { name: '국가' }).click();
  await page.keyboard.type('한국');
  await expect(page.getByRole('option', { name: /한국/ })).toBeVisible();

  // 2. 선택 후 값 반영
  await page.keyboard.press('Enter');
  await expect(page.getByRole('combobox', { name: '국가' })).toContainText('한국');

  // 3. 폼 제출 payload 확인
  const [request] = await Promise.all([
    page.waitForRequest(r => r.url().includes('/api/profile') && r.method() === 'POST'),
    page.getByRole('button', { name: '저장' }).click(),
  ]);
  expect(request.postDataJSON()).toMatchObject({ country: 'KR' });

  // 4. 미선택 시 검증 메시지
  // 5. 브라우저 뒤로가기 후 값 복원
});
```

**PASS / FAIL**

- PASS: 커스텀 셀렉트가 typeahead·키보드 규약·폼 제출·검증·라벨 연결을 모두 만족한다. 만족하지 못하면 네이티브로 대체되어 있다.
- FAIL: typeahead 없음(S3), 폼 값 미제출(S1), 라벨 미연결(S2).

**GOOD**

```tsx
// ✅ 단순 선택은 네이티브 + Tailwind 스타일링으로 충분하다
<div className="space-y-1.5">
  <label htmlFor="role" className="text-sm font-medium">권한</label>
  <select
    id="role"
    name="role"
    required
    defaultValue={member.role}
    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <option value="admin">관리자</option>
    <option value="member">멤버</option>
    <option value="viewer">뷰어</option>
  </select>
</div>
```

---

## 12. Mega Menu

### D-MEGA-01 — 시맨틱과 역할 선택

**WHY**
메가 메뉴를 `role="menu"` + `role="menuitem"`으로 만드는 것은 대표적 오용이다. ARIA `menu`는 **애플리케이션 명령 메뉴**(파일 편집 메뉴 같은)를 위한 역할이며, 스크린리더는 이를 명령 목록으로 안내하고 링크로 읽지 않는다. 사이트 네비게이션은 링크 목록이므로 `nav` + `ul` + `a`가 맞다. 잘못된 역할은 "링크 목록"으로 탐색하려는 사용자에게 항목을 감춘다.

**DETECT**

```bash
rg -n "role=\"menu\"" src --glob "*.tsx" -A8 | rg "<a |href="
rg -n "role=\"menuitem\"" src --glob "*.tsx" -A2 | rg "href="
rg -n "MegaMenu|NavigationMenu" src
```

`role="menuitem"`과 `href`가 함께 있으면 대개 오용이다.

**REPRODUCE**

1. 스크린리더(NVDA/VoiceOver)로 메가 메뉴를 탐색한다.
2. 링크 목록 탐색(NVDA: `K`, VoiceOver: 링크 로터)으로 메뉴 항목이 나열되는지 확인한다.
3. 접근성 트리를 확인한다.

```ts
const tree = await page.accessibility.snapshot({
  root: await page.getByRole('navigation', { name: '주 메뉴' }).elementHandle() ?? undefined,
});
console.log(JSON.stringify(tree, null, 2));
```

**PASS / FAIL**

- PASS: 네비게이션이 `nav[aria-label]` + `ul`/`li` + `a`로 구성된다. 확장 트리거는 `button[aria-expanded]`다. 링크는 링크로 노출된다.
- FAIL: `role="menu"`로 감싼 링크 목록(S2), 트리거가 `div`(S2), 라벨 없는 `nav` 중복(S3).

**FIX**

**BAD**

```tsx
// ❌ 링크를 명령 메뉴로 위장
<div role="menu">
  <a role="menuitem" href="/features">기능</a>
  <a role="menuitem" href="/pricing">가격</a>
</div>
```

**GOOD**

```tsx
// ✅ 네비게이션 시맨틱 + 확장 상태
<nav aria-label="주 메뉴">
  <ul className="flex items-center gap-1">
    <li>
      <button
        type="button"
        aria-expanded={open === 'product'}
        aria-controls="mega-product"
        onClick={() => toggle('product')}
        className="rounded-md px-3 py-2 text-sm"
      >
        제품
      </button>

      <div
        id="mega-product"
        hidden={open !== 'product'}
        className="absolute left-0 top-full w-full border-b bg-popover shadow-lg"
      >
        <div className="mx-auto grid max-w-screen-xl grid-cols-2 gap-8 p-8 lg:grid-cols-4">
          <div>
            <h3 id="mega-analytics" className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              분석
            </h3>
            <ul aria-labelledby="mega-analytics" className="space-y-1">
              <li><a href="/features/dashboard" className="block rounded px-2 py-1.5 text-sm hover:bg-accent">대시보드</a></li>
              <li><a href="/features/reports" className="block rounded px-2 py-1.5 text-sm hover:bg-accent">리포트</a></li>
            </ul>
          </div>
        </div>
      </div>
    </li>
  </ul>
</nav>
```

`hidden` 속성을 쓰면 접근성 트리와 Tab 순서에서 함께 제거된다. `opacity-0`만으로 감추면 숨겨진 링크에 포커스가 들어가 "사라진 포커스" 버그가 된다.

---

### D-MEGA-02 — 키보드 접근과 포커스 관리

**WHY**
hover로만 열리는 메가 메뉴는 키보드 사용자에게 사이트 전체 네비게이션을 차단한다. 반대로 메가 메뉴에 포커스 트랩을 넣으면 Tab으로 빠져나갈 수 없어 페이지 나머지에 도달할 수 없다. 메가 메뉴는 **트랩하지 않되 Esc로 닫히고 포커스가 트리거로 돌아오는** 모델이 맞다.

**DETECT**

```bash
rg -n "onMouseEnter" src --glob "*mega*" -A4 | rg -v "onFocus|onKeyDown"
rg -n "FocusTrap|focus-trap" src --glob "*nav*"
```

**REPRODUCE**

```ts
test('메가 메뉴 키보드 조작', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const trigger = page.getByRole('button', { name: '제품' });
  await trigger.focus();

  // Enter/Space/ArrowDown으로 열림
  await page.keyboard.press('Enter');
  const panel = page.locator('#mega-product');
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  // Tab으로 패널 내부 링크 순회 가능
  await page.keyboard.press('Tab');
  const inPanel = await page.evaluate(() =>
    document.querySelector('#mega-product')!.contains(document.activeElement));
  expect(inPanel).toBe(true);

  // Esc로 닫고 트리거 복귀
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();

  // 패널 밖으로 Tab 이탈 시 자동 닫힘
  await page.keyboard.press('Enter');
  await expect(panel).toBeVisible();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      document.querySelector('#mega-product')?.contains(document.activeElement) ?? false);
    if (!inside) break;
  }
  await expect(panel).toBeHidden();
});
```

**PASS / FAIL**

- PASS: Enter/Space/ArrowDown으로 열리고, Tab으로 내부 링크를 순회하며, Esc로 닫히고 트리거로 복귀하고, Tab으로 패널을 벗어나면 자동 닫힌다. 좌우 화살표로 최상위 항목 간 이동이 가능하다(권장).
- FAIL: 키보드로 열 수 없음(**S1**), 포커스 트랩(S1), 닫힌 패널의 링크에 포커스 진입(S2).

**FIX**

```tsx
// ✅ 트랩 없이 focusout으로 닫기
function MegaMenuItem({ id, label, children }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <li
      ref={wrapRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      // 포커스가 이 서브트리를 벗어나면 닫는다 (트랩 없이)
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
        if (e.key === 'ArrowDown' && !open) {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
      >
        {label}
      </button>
      <div id={id} hidden={!open}>{children}</div>
    </li>
  );
}
```

---

### D-MEGA-03 — 패널 폭·높이와 짧은 뷰포트

**WHY**
메가 메뉴는 콘텐츠가 많아 세로로 길다. 4열 × 6항목 패널의 높이는 400~500px이다. 유효 높이 600px 환경(1920@150%)에서 헤더 64px을 빼면 패널이 화면 밖으로 나가고, 하단 링크는 도달 불가하다. 패널 자체에 스크롤이 없으면 기능 차단이다. 또 1024px에서 4열을 유지하면 각 열이 220px로 줄어 라벨이 깨진다.

**DETECT**

```bash
rg -n "grid-cols-[4-6]" src --glob "*mega*" --glob "*nav*"
rg -n "max-h|overflow-y" src --glob "*mega*"
```

**REPRODUCE**

```ts
test('짧은 뷰포트에서 메가 메뉴 항목에 모두 도달 가능하다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 620 });
  await page.goto('/');

  await page.getByRole('button', { name: '제품' }).click();
  const panel = page.locator('#mega-product');
  await expect(panel).toBeVisible();

  const box = await panel.boundingBox();
  const vp = page.viewportSize()!;
  const fitsOrScrolls = await panel.evaluate(el => {
    const cs = getComputedStyle(el);
    return /auto|scroll/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1;
  });

  expect(box!.y + box!.height <= vp.height + 1 || fitsOrScrolls,
    '패널이 뷰포트를 넘고 스크롤도 없음').toBe(true);

  // 마지막 링크가 실제로 클릭 가능
  const links = panel.getByRole('link');
  await links.last().scrollIntoViewIfNeeded();
  await expect(links.last()).toBeInViewport();
});
```

**PASS / FAIL**

- PASS: 유효 높이 600px에서 패널이 뷰포트에 맞춰 제한되고 내부 스크롤로 모든 링크에 도달한다. 1024px에서 열 수가 줄어 라벨이 깨지지 않는다.
- FAIL: 하단 링크 도달 불가(**S1**), 1024px에서 텍스트 깨짐(S2).

**FIX**

```tsx
// ✅ 뷰포트 기준 높이 상한 + 내부 스크롤 + 반응형 열
<div
  id="mega-product"
  hidden={!open}
  className="absolute inset-x-0 top-full border-b bg-popover shadow-lg"
>
  <div className="mx-auto max-h-[calc(100vh-var(--header-height,4rem)-2rem)] max-w-screen-xl overflow-y-auto overscroll-contain p-6 lg:p-8">
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {sections.map(s => <MegaColumn key={s.id} {...s} />)}
    </div>
  </div>
</div>
```

패널 콘텐츠가 스크롤을 필요로 할 정도라면 정보 구조 자체를 재검토한다. 메가 메뉴는 20~30개 링크가 상한이다.

---

### D-MEGA-04 — 배경 스크롤과 페이지 상호작용

**WHY**
메가 메뉴가 열린 상태에서 페이지를 스크롤하면 패널이 트리거와 분리되어 떠 있거나, 헤더가 sticky가 아니면 패널만 남아 화면 중앙에 뜬다. 또 열린 패널이 페이지 콘텐츠를 덮는데 배경 클릭이 통과하면 사용자는 의도치 않은 요소를 클릭한다.

**DETECT**

```bash
rg -n "sticky top-0" src/components/layout --glob "*.tsx"
rg -n "overlay|backdrop|scrim" src --glob "*nav*" --glob "*mega*"
```

**REPRODUCE**

1. 메가 메뉴를 열고 마우스 휠로 스크롤한다.
2. 패널이 헤더와 함께 움직이거나 닫히는지 확인한다.
3. 열린 상태에서 패널 아래 콘텐츠를 클릭해 무슨 일이 일어나는지 확인한다.

```ts
test('스크롤 시 메가 메뉴가 닫히거나 헤더와 함께 움직인다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '제품' }).click();
  const panel = page.locator('#mega-product');
  await expect(panel).toBeVisible();

  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(200);

  if (await panel.isVisible()) {
    const headerBox = await page.getByRole('banner').boundingBox();
    const panelBox = await panel.boundingBox();
    expect(Math.abs(panelBox!.y - (headerBox!.y + headerBox!.height)))
      .toBeLessThanOrEqual(8);
  }
});
```

**PASS / FAIL**

- PASS: 스크롤 시 패널이 닫히거나 sticky 헤더에 정확히 붙어 이동한다. 배경 클릭은 패널을 닫고 콘텐츠 액션을 실행하지 않는다.
- FAIL: 유령 패널(S2), 배경 클릭이 통과되어 의도치 않은 동작(S2).

**FIX**

```tsx
// ✅ 스크롤 시 닫기 + 배경 클릭 차단
useEffect(() => {
  if (!open) return;
  const onScroll = () => setOpen(false);
  window.addEventListener('scroll', onScroll, { passive: true, once: true });
  return () => window.removeEventListener('scroll', onScroll);
}, [open]);
```

```tsx
// ✅ 클릭을 흡수하는 투명 스크림 (닫기 전용)
{open && (
  <div
    aria-hidden="true"
    className="fixed inset-0 top-[var(--header-height,4rem)] z-30 bg-black/10"
    onClick={() => setOpen(false)}
  />
)}
```

---

## 13. Tooltip과 Popover

### D-TIP-01 — 툴팁에 필수 정보를 두지 않는다

**WHY**
툴팁은 hover 또는 focus에서만 나타나고, 스크린리더 사용 방식에 따라 읽히지 않을 수 있으며, 터치 기기에서는 표시 자체가 불확실하다. 필수 정보(가격 조건, 필드 형식 요구, 오류 원인, 법적 고지)를 툴팁에만 두면 상당수 사용자가 그 정보를 얻지 못한다.

**DETECT**

```bash
rg -n "<Tooltip" src --glob "*.tsx" -A6 | rg -i "필수|required|형식|최소|최대|주의|경고|오류"
rg -n "title=\"" src --glob "*.tsx" | head -30
```

`title` 속성은 툴팁 대체가 아니다. 표시 지연을 제어할 수 없고, 키보드 포커스로는 나타나지 않으며, 터치에서 동작하지 않고, 스타일링이 불가능하다.

**REPRODUCE**

1. 각 툴팁의 내용을 목록화한다.
2. 툴팁 없이 화면만 보고 작업을 완료할 수 있는지 판단한다.
3. 필드 형식 요구·제약이 툴팁에만 있는지 확인한다.

**PASS / FAIL**

- PASS: 툴팁 내용은 모두 보조적이다(단축키 안내, 아이콘 이름 보강, 축약 값의 원본). 필수 정보는 화면에 상시 표시되거나 `aria-describedby`로 연결된 도움말 텍스트에 있다.
- FAIL: 필드 요구사항·오류 원인·중요 제약이 툴팁 전용. S2, 결제·계약 정보면 S1.

**FIX**

**BAD**

```tsx
// ❌ 비밀번호 규칙을 툴팁에만 둠
<Tooltip content="8자 이상, 대문자·숫자·특수문자 포함">
  <input type="password" />
</Tooltip>
```

**GOOD**

```tsx
// ✅ 상시 표시되는 도움말 + 프로그램적 연결
<div className="space-y-1.5">
  <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
  <input
    id="password"
    type="password"
    aria-describedby="password-hint"
    className="h-10 w-full rounded-md border px-3"
  />
  <p id="password-hint" className="text-xs text-muted-foreground">
    8자 이상, 대문자·숫자·특수문자를 포함하세요.
  </p>
</div>
```

---

### D-TIP-02 — WCAG 1.4.13 (Content on Hover or Focus)

**WHY**
WCAG 1.4.13은 hover/focus로 나타나는 콘텐츠가 세 조건을 만족해야 한다고 요구한다. **Dismissible**(포커스를 잃지 않고 Esc로 닫을 수 있음), **Hoverable**(마우스를 툴팁 위로 옮겨도 사라지지 않음), **Persistent**(포인터/포커스를 유지하는 동안 계속 표시). 화면 확대 사용자는 툴팁 텍스트를 읽기 위해 툴팁 위로 커서를 옮겨야 하는데, 그때 사라지면 내용을 읽을 수 없다.

**DETECT**

```bash
rg -n "onMouseLeave" src --glob "*tooltip*" -A4
rg -n "setTimeout.*hide|autoHide|duration" src --glob "*tooltip*"
rg -n "Escape" src --glob "*tooltip*"
```

**REPRODUCE**

```ts
test('툴팁이 WCAG 1.4.13을 만족한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  const trigger = page.getByRole('button', { name: 'MRR 설명' });
  await trigger.hover();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();

  // Persistent: 3초 후에도 유지
  await page.waitForTimeout(3000);
  await expect(tip).toBeVisible();

  // Hoverable: 툴팁 위로 커서 이동해도 유지
  const tb = await tip.boundingBox();
  await page.mouse.move(tb!.x + tb!.width / 2, tb!.y + tb!.height / 2);
  await page.waitForTimeout(300);
  await expect(tip).toBeVisible();

  // Dismissible: Esc로 닫히고 포커스는 유지
  await trigger.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

**PASS / FAIL**

- PASS: 세 조건 모두 충족. 자동 숨김 타이머가 없다.
- FAIL: 어느 하나라도 미충족. Hoverable 실패는 확대 사용자에게 정보 차단이므로 **S2**, 필수 정보를 담고 있으면 S1.

**FIX**

```tsx
// ✅ Radix Tooltip은 세 조건을 기본 지원한다
<TooltipProvider delayDuration={300} skipDelayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button aria-label="MRR 설명" className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
        ?
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      sideOffset={6}
      collisionPadding={12}
      className="max-w-xs text-sm"
    >
      월 반복 매출(MRR)은 구독 매출을 월 기준으로 정규화한 값입니다.
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

자동 숨김 타이머(`setTimeout(hide, 2000)`)는 Persistent 위반이므로 제거한다.

---

### D-TIP-03 — 접근 가능한 이름과 중복 낭독

**WHY**
아이콘 버튼에 `aria-label`과 툴팁을 동일 텍스트로 넣으면 스크린리더가 이름과 설명을 이어 읽어 같은 말을 두 번 듣는다. 반대로 아이콘 버튼에 `aria-label`이 없고 툴팁만 있으면, 툴팁이 `aria-describedby`로만 연결된 경우 버튼의 이름이 비어 "버튼"으로만 읽힌다.

**DETECT**

```bash
rg -n "TooltipTrigger" src --glob "*.tsx" -A6 | rg "aria-label"
rg -n "<button[^>]*>\s*<[A-Z][a-zA-Z]*Icon" src --glob "*.tsx"
rg -n "aria-describedby" src --glob "*.tsx"
```

**REPRODUCE**

```ts
test('아이콘 버튼 이름과 툴팁이 중복되지 않는다', async ({ page }) => {
  await page.goto('/dashboard');
  const btn = page.getByRole('button', { name: '새로고침' });

  const name = await btn.evaluate(el => el.getAttribute('aria-label'));
  await btn.hover();
  const tipText = (await page.getByRole('tooltip').textContent())?.trim();

  // 이름과 툴팁이 완전히 동일하면 중복 낭독
  if (name && tipText) {
    expect(name.trim()).not.toBe(tipText);
  }
});
```

접근성 트리로 최종 확인한다.

```ts
const snap = await page.accessibility.snapshot();
// 각 button 노드의 name/description을 확인
```

**PASS / FAIL**

- PASS: 모든 아이콘 버튼이 비어 있지 않은 접근 가능한 이름을 갖는다. 툴팁이 이름과 동일하면 툴팁은 순수 시각 보조로 처리(`aria-hidden`)되어 이중 낭독이 없다. 툴팁이 추가 정보를 담으면 이름과 다르고 `aria-describedby`로 연결된다.
- FAIL: 이름 없는 아이콘 버튼(**S1** — 스크린리더에서 용도 불명), 중복 낭독(S3).

**FIX**

```tsx
// ✅ 패턴 A: 툴팁 = 이름 보강(동일 텍스트) → 툴팁은 시각 전용
<Tooltip>
  <TooltipTrigger asChild>
    <button aria-label="새로고침">
      <RefreshIcon aria-hidden="true" className="size-4" />
    </button>
  </TooltipTrigger>
  <TooltipContent aria-hidden="true">새로고침</TooltipContent>
</Tooltip>

// ✅ 패턴 B: 툴팁 = 추가 설명 → 이름과 다르게, describedby로 연결
<Tooltip>
  <TooltipTrigger asChild>
    <button aria-label="데이터 새로고침" aria-describedby="refresh-hint">
      <RefreshIcon aria-hidden="true" className="size-4" />
    </button>
  </TooltipTrigger>
  <TooltipContent id="refresh-hint">
    마지막 동기화: 3분 전 · 단축키 R
  </TooltipContent>
</Tooltip>
```

---

### D-TIP-04 — 비활성 요소의 툴팁

**WHY**
`disabled` 버튼은 포커스를 받지 않고 포인터 이벤트도 받지 않으므로 툴팁이 나타나지 않는다. 그런데 비활성 이유("권한이 없습니다", "먼저 결제 정보를 등록하세요")를 알려주는 것이 가장 중요한 순간이다. 사용자는 버튼이 왜 눌리지 않는지 알 수 없어 막힌다.

**DETECT**

```bash
rg -n "disabled" src --glob "*.tsx" -B4 -A4 | rg -i "tooltip"
rg -n "disabled=\{" src --glob "*.tsx" | wc -l
rg -n "aria-disabled" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

1. 비활성 버튼이 있는 화면을 찾는다(권한 부족, 선행 조건 미충족).
2. hover와 키보드 포커스 각각으로 이유를 확인할 수 있는지 시도한다.

```ts
test('비활성 버튼의 이유를 확인할 수 있다', async ({ page }) => {
  await page.goto('/settings/billing');
  const btn = page.getByRole('button', { name: '플랜 업그레이드' });
  await expect(btn).toBeDisabled();

  // 키보드로 도달 가능해야 이유를 알 수 있다
  await btn.focus();
  const focused = await btn.evaluate(el => el === document.activeElement);
  expect(focused, '비활성 버튼에 포커스 불가 → 이유 확인 불가').toBe(true);

  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('결제 정보');
});
```

**PASS / FAIL**

- PASS: 비활성 이유가 hover와 키보드 포커스 모두에서 확인 가능하다. 또는 이유가 화면에 상시 표시된다.
- FAIL: 비활성 이유를 알 수 없음. S2, 결제·제출 차단이면 S1.

**FIX**

세 가지 해법이 있다.

1. **`aria-disabled` + 클릭 무효화** — 포커스는 유지되어 툴팁이 동작한다(권장)
2. **래퍼에 툴팁 부착** — `disabled`를 유지하고 부모 span에 hover 툴팁(키보드 대응 안 됨)
3. **상시 표시 안내** — 버튼 아래 설명 텍스트(가장 안전)

```tsx
// ✅ aria-disabled 패턴: 포커스 가능 + 클릭 무효 + 이유 전달
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      aria-disabled={!canUpgrade}
      aria-describedby={!canUpgrade ? 'upgrade-reason' : undefined}
      onClick={(e) => {
        if (!canUpgrade) { e.preventDefault(); return; }
        upgrade();
      }}
      className={cn(!canUpgrade && 'cursor-not-allowed opacity-50')}
    >
      플랜 업그레이드
    </Button>
  </TooltipTrigger>
  {!canUpgrade && (
    <TooltipContent id="upgrade-reason">
      먼저 결제 정보를 등록해 주세요.
    </TooltipContent>
  )}
</Tooltip>
```

`aria-disabled`는 시각적·의미적으로 비활성을 알리지만 포커스는 유지한다. 단 폼 제출을 막아야 하므로 핸들러에서 반드시 조기 반환하고, 서버에서도 검증한다.

---

### D-TIP-05 — 잘린 텍스트의 전체 값 노출

**WHY**
테이블 셀과 Sidebar 라벨은 `truncate`로 잘리는 경우가 많다. 전체 값을 확인할 수단이 없으면 이메일·파일명·조직명을 구별할 수 없다. 반대로 모든 셀에 무조건 툴팁을 붙이면 잘리지 않은 값에도 툴팁이 떠서 시야를 방해한다. **잘렸을 때만** 노출해야 한다.

**DETECT**

```bash
rg -n "truncate|line-clamp-1|text-ellipsis" src --glob "*.tsx" | head -40
rg -n "truncate" src --glob "*.tsx" -A2 | rg -i "tooltip|title="
```

**REPRODUCE**

```ts
test('잘린 셀에서 전체 값을 확인할 수 있다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/settings/members');

  const truncated = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('td, [data-cell]')]
      .filter(el => el.scrollWidth > el.clientWidth + 1)
      .map(el => ({
        text: (el.textContent ?? '').trim().slice(0, 40),
        hasTitle: el.hasAttribute('title'),
        hasDescribedBy: el.hasAttribute('aria-describedby'),
      })));

  const unreachable = truncated.filter(t => !t.hasTitle && !t.hasDescribedBy);
  expect(unreachable, JSON.stringify(unreachable)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 실제로 잘린 요소에만 전체 값 확인 수단(`title` 또는 조건부 툴팁)이 있다. 잘리지 않은 요소에는 없다.
- FAIL: 잘린 값의 전체를 확인할 수 없음(S2), 모든 셀에 무조건 툴팁(S3).

**FIX**

```tsx
// ✅ 실제 잘림을 측정해 조건부로 툴팁 부착
function TruncatedCell({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const content = (
    <span ref={ref} className="block truncate">
      {children}
    </span>
  );

  if (!isTruncated) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* 잘린 경우에만 포커스 가능하게 하여 키보드로도 확인 가능 */}
        <span tabIndex={0} className="block truncate focus-visible:ring-2 focus-visible:ring-ring">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md break-words">{children}</TooltipContent>
    </Tooltip>
  );
}
```

`ResizeObserver`로 폭 변화(창 크기, Sidebar 접힘, 열 리사이즈)에 대응해야 한다. 마운트 시 한 번만 측정하면 폭이 바뀐 뒤 잘못된 상태가 남는다.

---

## 14. Sticky와 Scroll

### D-STICKY-01 — 다중 Sticky 오프셋 관리

**WHY**
데스크톱 앱에는 sticky 요소가 겹겹이 쌓인다. 전역 헤더 → 페이지 헤더 → 필터 툴바 → 테이블 헤더. 각각이 `top-0`이면 모두 같은 위치에 겹쳐 아래 요소가 위 요소에 가려진다. 각 오프셋을 하드코딩하면(`top-[112px]`) 헤더 높이가 바뀌는 순간 전부 어긋나고, 반응형에서 높이가 달라지면 폭마다 다르게 깨진다.

**DETECT**

```bash
rg -n "sticky top-\[?[0-9]" src --glob "*.tsx" | sort -t: -k3
rg -n "sticky top-0" src --glob "*.tsx" | wc -l
rg -n "--header-height|headerHeight" src
```

`sticky top-0`이 3개 이상이면 겹침을 의심한다.

**REPRODUCE**

```ts
test('sticky 요소가 서로 겹치지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/settings/members');
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(300);

  const stickies = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('*')]
      .filter(el => getComputedStyle(el).position === 'sticky' && el.offsetParent !== null)
      .map(el => {
        const r = el.getBoundingClientRect();
        return {
          className: String(el.className).slice(0, 60),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          height: Math.round(r.height),
        };
      })
      .filter(s => s.height > 0)
      .sort((a, b) => a.top - b.top));

  // 상단에 붙은 요소들끼리 겹치는지
  for (let i = 1; i < stickies.length; i++) {
    const prev = stickies[i - 1];
    const cur = stickies[i];
    if (prev.top < 200 && cur.top < 200) {
      expect(cur.top, `${prev.className} 와 ${cur.className} 겹침`)
        .toBeGreaterThanOrEqual(prev.bottom - 1);
    }
  }
});
```

**PASS / FAIL**

- PASS: 스크롤 상태에서 상단 sticky 요소들이 수직으로 순차 배치되고 서로 겹치지 않는다. 폭·배율·줌이 바뀌어도 유지된다.
- FAIL: 겹쳐서 콘텐츠 가림(S2), 테이블 헤더가 전역 헤더에 가려져 열 이름 확인 불가(S2).

**FIX**

CSS 변수로 오프셋을 한 곳에서 관리하고, 실제 높이를 런타임에 반영한다.

```css
/* app/globals.css */
:root {
  --header-height: 4rem;
  --page-header-height: 0rem;
  --toolbar-height: 0rem;
}

.sticky-header      { position: sticky; top: 0; z-index: 40; }
.sticky-page-header { position: sticky; top: var(--header-height); z-index: 30; }
.sticky-toolbar     { position: sticky; top: calc(var(--header-height) + var(--page-header-height)); z-index: 20; }
.sticky-table-head  { position: sticky; top: calc(var(--header-height) + var(--page-header-height) + var(--toolbar-height)); z-index: 10; }

html {
  scroll-padding-top: calc(var(--header-height) + var(--page-header-height) + 1rem);
}
```

```tsx
// ✅ 실제 높이를 측정해 변수에 반영 (반응형·줌 대응)
function useMeasuredHeight(varName: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        varName, `${el.getBoundingClientRect().height}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty(varName); };
  }, [varName]);
  return ref;
}
```

**BAD**

```tsx
// ❌ 하드코딩된 오프셋 — 헤더 높이 변경 시 전부 깨진다
<thead className="sticky top-[112px]">
```

---

### D-STICKY-02 — Sticky가 동작하지 않는 조건

**WHY**
`position: sticky`는 조건이 까다롭다. (a) 스크롤 조상 중 `overflow: hidden|auto|scroll`이 있으면 그 컨테이너 기준으로 동작하며, 컨테이너가 스크롤되지 않으면 아예 붙지 않는다. (b) 부모의 높이가 콘텐츠와 같으면 붙어 있을 공간이 없어 즉시 벗어난다. (c) `display: flex` 부모에서 `align-items: stretch`가 기본이면 자식 높이가 늘어나 sticky가 무의미해진다. 디버깅이 어려워 "sticky가 안 먹는다"로 방치되기 쉽다.

**DETECT**

```bash
rg -n "sticky" src --glob "*.tsx" -B8 | rg "overflow-(hidden|auto|scroll|y-auto)"
rg -n "sticky" src --glob "*.tsx" -B4 | rg "flex |items-stretch"
```

**REPRODUCE**

```ts
test('sticky 요소가 실제로 고정된다', async ({ page }) => {
  await page.goto('/settings/members');
  const head = page.locator('thead');
  const before = await head.boundingBox();

  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  const after = await head.boundingBox();

  // 고정되었다면 뷰포트 기준 y가 크게 변하지 않아야 한다
  expect(Math.abs(after!.y - before!.y), 'sticky가 동작하지 않음').toBeLessThanOrEqual(120);
  await expect(head).toBeInViewport();
});
```

원인 진단 스크립트.

```ts
const diagnosis = await page.evaluate(() => {
  const el = document.querySelector<HTMLElement>('thead')!;
  const problems: string[] = [];
  let node = el.parentElement;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    if (/hidden|clip/.test(cs.overflow + cs.overflowY)) {
      problems.push(`overflow:${cs.overflowY} on ${node.tagName}.${String(node.className).slice(0, 40)}`);
    }
    if (cs.transform !== 'none') {
      problems.push(`transform on ${node.tagName}`);
    }
    if (cs.contain !== 'none') {
      problems.push(`contain:${cs.contain} on ${node.tagName}`);
    }
    node = node.parentElement;
  }
  return problems;
});
```

**PASS / FAIL**

- PASS: 의도한 sticky 요소가 스크롤 시 지정 오프셋에 고정된다.
- FAIL: 고정되지 않고 함께 스크롤됨(S2 — 긴 테이블에서 열 이름 상실).

**FIX**

- 조상의 `overflow: hidden`을 제거하거나, sticky 요소를 그 컨테이너 밖으로 옮긴다.
- 가로 스크롤이 필요한 테이블은 `overflow-x: auto`를 쓰되 **세로는 `visible`로 둔다.** `overflow: auto`(양방향)는 세로 sticky를 깨뜨린다.
- flex 부모에서는 `items-start`를 주어 자식이 늘어나지 않게 한다.

**GOOD**

```tsx
// ✅ 가로만 스크롤, 세로 sticky 유지
<div className="overflow-x-auto">
  <table className="w-full min-w-[720px]">
    <thead className="sticky top-[var(--table-head-offset)] z-10 bg-background">
      ...
    </thead>
  </table>
</div>
```

```tsx
// ✅ flex 부모에서 sticky 사이드바
<div className="flex items-start gap-8">
  <aside className="sticky top-20 w-64 shrink-0">...</aside>
  <main className="min-w-0 flex-1">...</main>
</div>
```

---

### D-STICKY-03 — 앵커 이동과 scroll-padding

**WHY**
`#section-3` 앵커로 이동하면 브라우저는 대상 요소를 뷰포트 최상단에 맞춘다. sticky 헤더가 있으면 대상이 헤더 뒤로 숨어 사용자는 엉뚱한 위치를 본다. 목차가 있는 문서 페이지, 폼 오류 필드로 점프, 키보드 포커스 시 스크롤 모두 같은 문제를 겪는다.

**DETECT**

```bash
rg -n "scroll-padding|scroll-margin|scrollIntoView" src
rg -n "href=\"#" src --glob "*.tsx" | head -20
rg -n "scrollIntoView" src -A2 | rg -v "block:"
```

**REPRODUCE**

```ts
test('앵커 이동 시 대상이 헤더에 가려지지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/guide');

  await page.getByRole('link', { name: '설치하기' }).click();
  await page.waitForTimeout(400);

  const heading = page.locator('#installation');
  await expect(heading).toBeInViewport();

  const covered = await heading.evaluate(el => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + 10, r.top + 5);
    return top !== el && !el.contains(top);
  });
  expect(covered, '앵커 대상이 sticky 요소에 가려짐').toBe(false);
});
```

폼 오류 점프도 확인한다.

```ts
await page.getByRole('button', { name: '저장' }).click();
const firstError = page.locator('[aria-invalid="true"]').first();
await expect(firstError).toBeInViewport();
```

**PASS / FAIL**

- PASS: 앵커 이동·폼 오류 점프·키보드 포커스 스크롤에서 대상이 완전히 보인다.
- FAIL: 대상이 sticky 헤더에 가려짐. S2(오류 필드면 S1 — 사용자가 무엇을 고쳐야 할지 모름).

**FIX**

```css
/* ✅ 전역 스크롤 여유 */
html {
  scroll-padding-top: calc(var(--header-height, 4rem) + 1rem);
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

/* ✅ 개별 앵커 대상에도 여유 */
:target,
[id] {
  scroll-margin-top: calc(var(--header-height, 4rem) + 1rem);
}
```

```ts
// ✅ 프로그램적 스크롤에도 동일 정책
element.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
```

`block: 'nearest'`는 이미 보이는 요소를 불필요하게 스크롤하지 않는다.

---

### D-STICKY-04 — 짧은 뷰포트에서의 Sticky 예산

**WHY**
sticky 요소는 뷰포트 높이를 영구적으로 소비한다. 헤더 64 + 툴바 56 + 테이블 헤더 48 = 168px이 유효 높이 620px 중 27%를 차지한다. 여기에 하단 액션 바 64px이 더해지면 실 콘텐츠 영역은 388px, 즉 테이블 행 8개다. 사용자는 스크롤을 계속 하면서도 정보를 조금씩만 본다.

**DETECT** — D-VP-02의 스크립트를 재사용한다.

**REPRODUCE**

```ts
test('sticky 예산이 뷰포트의 35%를 넘지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 620 });
  await page.goto('/settings/members');
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);

  const budget = await page.evaluate(() => {
    const vh = window.innerHeight;
    const els = [...document.querySelectorAll<HTMLElement>('*')]
      .filter(el => {
        const cs = getComputedStyle(el);
        return (cs.position === 'sticky' || cs.position === 'fixed') && el.offsetParent !== null;
      });
    const top = els.filter(el => el.getBoundingClientRect().top < vh * 0.3)
      .reduce((s, el) => s + el.getBoundingClientRect().height, 0);
    const bottom = els.filter(el => el.getBoundingClientRect().bottom > vh * 0.7)
      .reduce((s, el) => s + el.getBoundingClientRect().height, 0);
    return { vh, top, bottom, ratio: (top + bottom) / vh };
  });

  expect(budget.ratio, JSON.stringify(budget)).toBeLessThanOrEqual(0.35);
});
```

**PASS / FAIL**

- PASS: 유효 높이 620px에서 고정 UI 총합이 35% 이하다.
- FAIL: 40% 초과(S2), 50% 초과(S1).

**FIX**

- 스크롤 방향에 따라 헤더를 숨기거나 축소한다.
- 페이지 헤더와 툴바를 하나로 병합한다.
- 짧은 뷰포트에서만 sticky를 해제한다.

```css
/* ✅ 세로 여유가 없으면 sticky 포기 */
@media (max-height: 700px) {
  .sticky-page-header { position: static; }
}
```

```tsx
// ✅ 아래로 스크롤 시 헤더 축소
<header
  className={cn(
    'sticky top-0 z-40 border-b bg-background/95 backdrop-blur transition-[height] duration-200',
    scrolledDown ? 'h-12' : 'h-16',
  )}
>
```

---

## 15. Sidebar

### D-SIDE-01 — 접기/펼치기와 상태 지속

**WHY**
Sidebar 접힘 상태를 클라이언트에서만 관리하면 새로고침 시 항상 펼쳐진 상태로 렌더되고, 이후 `useEffect`에서 localStorage를 읽어 접힌다. 사용자는 매 페이지 로드마다 사이드바가 펼쳐졌다 접히는 깜빡임(FOUC)을 본다. 여기에 콘텐츠가 좌우로 밀리며 CLS까지 발생한다.

**DETECT**

```bash
rg -n "localStorage.*sidebar|sidebarCollapsed|isCollapsed" src
rg -n "useEffect" src --glob "*sidebar*" -A6 | rg "localStorage"
rg -n "cookies\(\)" src/app --glob "*.tsx" | rg -i "sidebar"
```

`useEffect` + `localStorage` 조합은 거의 항상 FOUC를 만든다.

**REPRODUCE**

```ts
test('사이드바 접힘 상태가 새로고침 후 깜빡임 없이 유지된다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  await page.getByRole('button', { name: /사이드바 (접기|축소)/ }).click();
  const sidebar = page.getByRole('complementary');
  await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  const collapsedWidth = (await sidebar.boundingBox())!.width;

  // 새로고침 직후 첫 프레임에서 이미 접혀 있어야 한다
  await page.reload();
  const initialWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
  expect(Math.abs(initialWidth - collapsedWidth), '새로고침 후 펼침 상태로 렌더됨')
    .toBeLessThanOrEqual(4);

  // CLS 확인
  const cls = await page.evaluate(() => new Promise<number>(resolve => {
    let total = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 1500);
  }));
  expect(cls).toBeLessThan(0.1);
});
```

**PASS / FAIL**

- PASS: 서버 렌더 첫 프레임부터 올바른 상태로 표시된다. 접힘 전환 애니메이션은 200~250ms 이하이며 CLS를 유발하지 않는다(`prefers-reduced-motion` 존중).
- FAIL: 새로고침 시 깜빡임(S2), CLS 0.1 초과(S2), 상태 미저장(S3).

**FIX**

쿠키에 저장해 서버 렌더 시점에 반영한다.

```tsx
// ✅ app/(app)/layout.tsx — 서버에서 초기 상태 결정
import { cookies } from 'next/headers';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get('sidebar_collapsed')?.value === '1';

  return (
    <div
      data-sidebar-collapsed={collapsed ? '1' : '0'}
      className="grid min-h-dvh grid-cols-[var(--sidebar-w)_minmax(0,1fr)] [--sidebar-w:16rem] data-[sidebar-collapsed=1]:[--sidebar-w:4rem]"
    >
      <AppSidebar defaultCollapsed={collapsed} />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
```

```tsx
// ✅ 토글 시 쿠키 갱신 (서버 왕복 없이 즉시 반영)
function toggleSidebar(next: boolean) {
  document.cookie = `sidebar_collapsed=${next ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`;
  setCollapsed(next);
}
```

grid 트랙 폭을 CSS 변수로 두면 전환이 한 속성으로 끝나고 본문이 자연스럽게 재배치된다.

---

### D-SIDE-02 — 아이콘 전용(접힘) 모드의 접근성

**WHY**
접힌 사이드바는 아이콘만 남는다. 텍스트 라벨을 DOM에서 제거하면 스크린리더 사용자는 각 링크의 목적을 알 수 없다. `hidden`이 아니라 `sr-only`로 처리해야 한다. 또 아이콘만으로는 시각 사용자도 구분이 어려우므로 hover/focus 툴팁이 필요하며, 이 툴팁은 키보드 포커스에서도 나타나야 한다.

**DETECT**

```bash
rg -n "collapsed" src --glob "*sidebar*" -A6 | rg "hidden|sr-only|aria-label"
rg -n "Icon" src --glob "*sidebar*" | rg -v "aria-hidden"
```

**REPRODUCE**

```ts
test('접힌 사이드바에서도 링크 이름이 유지된다', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /사이드바 접기/ }).click();

  const nav = page.getByRole('navigation', { name: '사이드바 메뉴' });
  const links = nav.getByRole('link');
  const count = await links.count();

  for (let i = 0; i < count; i++) {
    const name = await links.nth(i).evaluate(el =>
      (el.getAttribute('aria-label') ?? el.textContent ?? '').trim());
    expect(name, `접힌 상태에서 링크[${i}] 이름 없음`).not.toBe('');
  }

  // 키보드 포커스에서 툴팁 노출
  await links.first().focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
});
```

**PASS / FAIL**

- PASS: 접힌 상태에서 모든 링크가 비어 있지 않은 접근 가능한 이름을 갖는다. 키보드 포커스로 툴팁이 나타난다. 현재 페이지가 `aria-current="page"`로 표시된다.
- FAIL: 이름 없는 아이콘 링크(**S1**), 툴팁이 hover 전용(S2).

**FIX**

```tsx
// ✅ 라벨을 제거하지 않고 sr-only로 전환
<Tooltip>
  <TooltipTrigger asChild>
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-accent font-medium',
        collapsed && 'justify-center px-0',
      )}
    >
      <item.icon aria-hidden="true" className="size-5 shrink-0" />
      <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
    </Link>
  </TooltipTrigger>
  {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
</Tooltip>
```

`sr-only`는 시각적으로 숨기되 접근성 트리에 남긴다. `hidden`이나 조건부 렌더는 이름을 없앤다.

---

### D-SIDE-03 — 리사이즈 가능한 사이드바

**WHY**
드래그로 폭을 조절하는 사이드바는 (a) 키보드로 조절할 수 없으면 접근성 위반이고, (b) 최소/최대 제한이 없으면 사용자가 본문을 0px로 만들거나 사이드바로 화면을 다 채울 수 있으며, (c) 드래그 중 매 프레임 리렌더하면 큰 대시보드에서 프레임이 무너지고, (d) 폭 저장이 없으면 매번 다시 조절해야 한다.

**DETECT**

```bash
rg -n "onMouseDown|onPointerDown" src --glob "*resiz*" --glob "*sidebar*" -A10
rg -n "role=\"separator\"|aria-valuenow" src
rg -n "clientX|movementX" src
```

**REPRODUCE**

```ts
test('사이드바 리사이즈가 키보드로도 가능하고 제한을 지킨다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  const handle = page.getByRole('separator', { name: /사이드바 크기/ });
  await expect(handle).toBeVisible();
  await expect(handle).toHaveAttribute('aria-valuenow', /\d+/);

  const sidebar = page.getByRole('complementary');
  const before = (await sidebar.boundingBox())!.width;

  // 키보드 조절
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const after = (await sidebar.boundingBox())!.width;
  expect(after).toBeGreaterThan(before);

  // 최소 제한: 왼쪽으로 과도하게 드래그
  const hb = await handle.boundingBox();
  await page.mouse.move(hb!.x, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(0, hb!.y + hb!.height / 2, { steps: 10 });
  await page.mouse.up();
  const min = (await sidebar.boundingBox())!.width;
  expect(min).toBeGreaterThanOrEqual(48);

  // 최대 제한
  await page.mouse.move(hb!.x, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(1400, hb!.y + hb!.height / 2, { steps: 10 });
  await page.mouse.up();
  const max = (await sidebar.boundingBox())!.width;
  expect(max).toBeLessThanOrEqual(1440 * 0.5);
});
```

**PASS / FAIL**

- PASS: 핸들이 `role="separator"` + `aria-valuenow/min/max` + `aria-orientation`을 갖고 화살표 키로 조절된다. 최소/최대가 강제된다. 드래그가 60fps를 유지한다. 폭이 저장된다.
- FAIL: 키보드 불가(S2), 제한 없음(S2 — 본문 소멸 가능), 드래그 중 끊김(S3).

**FIX**

```tsx
// ✅ 접근 가능한 리사이즈 핸들 + CSS 변수로 리렌더 없는 드래그
function SidebarResizer({ min = 200, max = 480 }: { min?: number; max?: number }) {
  const [width, setWidth] = useState(256);
  const dragging = useRef(false);

  const applyWidth = (w: number) => {
    const clamped = Math.min(max, Math.max(min, w));
    // 드래그 중에는 CSS 변수만 갱신 → React 리렌더 없음
    document.documentElement.style.setProperty('--sidebar-w', `${clamped}px`);
    return clamped;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      applyWidth(e.clientX);
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const final = applyWidth(e.clientX);
      setWidth(final); // 종료 시 한 번만 상태 반영
      document.cookie = `sidebar_w=${final}; path=/; max-age=31536000; samesite=lax`;
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [min, max]);

  return (
    <div
      role="separator"
      aria-label="사이드바 크기 조절"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={() => {
        dragging.current = true;
        document.body.style.userSelect = 'none';
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 32 : 8;
        if (e.key === 'ArrowRight') { e.preventDefault(); setWidth(applyWidth(width + step)); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setWidth(applyWidth(width - step)); }
        if (e.key === 'Home')       { e.preventDefault(); setWidth(applyWidth(min)); }
        if (e.key === 'End')        { e.preventDefault(); setWidth(applyWidth(max)); }
      }}
      className="w-1 cursor-col-resize bg-border transition-colors hover:bg-primary focus-visible:bg-primary focus-visible:outline-none"
    />
  );
}
```

핵심은 드래그 중 React 상태를 갱신하지 않고 CSS 변수만 바꾸는 것이다. 대시보드처럼 무거운 트리에서 매 프레임 리렌더하면 즉시 끊긴다.

---

### D-SIDE-04 — 사이드바 내부 스크롤과 중첩

**WHY**
사이드바 메뉴가 길면 자체 스크롤이 필요하다. 그런데 (a) 사이드바 전체가 스크롤되면 하단 사용자 프로필/로그아웃이 밀려 보이지 않고, (b) 내부 스크롤 컨테이너가 오버레이를 자르며(D-DROP-01), (c) 사이드바 스크롤 끝에서 휠을 계속 굴리면 페이지 본문이 스크롤되는 스크롤 체이닝이 발생해 맥락이 튄다.

**DETECT**

```bash
rg -n "overflow-y-auto" src --glob "*sidebar*"
rg -n "overscroll" src --glob "*.tsx" --glob "*.css"
```

**REPRODUCE**

1. 사이드바 메뉴 항목을 30개로 늘려 스크롤을 만든다.
2. 하단 고정 영역(프로필/로그아웃)이 항상 보이는지 확인한다.
3. 사이드바 끝까지 스크롤한 뒤 휠을 더 굴려 본문이 스크롤되는지 확인한다.

```ts
test('사이드바 스크롤이 본문으로 전파되지 않는다', async ({ page }) => {
  await page.goto('/dashboard');
  const nav = page.getByRole('navigation', { name: '사이드바 메뉴' });
  const box = await nav.boundingBox();

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 3000); // 사이드바 끝까지
  await page.mouse.wheel(0, 1000); // 추가 스크롤
  await page.waitForTimeout(200);

  const bodyScroll = await page.evaluate(() => window.scrollY);
  expect(bodyScroll, '스크롤 체이닝 발생').toBe(0);

  await expect(page.getByTestId('sidebar-footer')).toBeInViewport();
});
```

**PASS / FAIL**

- PASS: 메뉴 영역만 스크롤되고 헤더/푸터는 고정된다. `overscroll-behavior: contain`으로 체이닝이 차단된다. 내부 드롭다운이 잘리지 않는다.
- FAIL: 프로필/로그아웃 접근 불가(S2), 스크롤 체이닝(S3), 드롭다운 잘림(S1).

**FIX**

```tsx
// ✅ 3분할 구조: 헤더 고정 / 메뉴 스크롤 / 푸터 고정
<aside className="flex h-dvh flex-col border-r">
  <div className="shrink-0 border-b px-4 py-3">
    <Logo />
  </div>

  <nav
    aria-label="사이드바 메뉴"
    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3"
  >
    {items.map(i => <SidebarLink key={i.href} {...i} />)}
  </nav>

  <div data-testid="sidebar-footer" className="shrink-0 border-t p-3">
    <UserMenu />
  </div>
</aside>
```

`min-h-0`이 없으면 flex 자식의 기본 `min-height: auto` 때문에 스크롤이 생기지 않고 컨테이너가 늘어난다. D-VP-01의 `min-w-0`과 같은 원리다.

---

### D-SIDE-05 — 좁은 폭에서의 사이드바 전환

**WHY**
1024px 미만에서 고정 사이드바를 유지하면 본문이 700px 이하로 줄어 테이블과 폼이 무너진다. 반대로 전환 시 Drawer로 바뀌는데 열림 상태에서 창을 넓히면 Drawer가 남아 있거나, 고정 사이드바와 Drawer가 동시에 렌더되어 중복 네비게이션이 생긴다(D-VP-04).

**DETECT**

```bash
rg -n "lg:block|lg:hidden|hidden lg:" src --glob "*sidebar*" --glob "*layout*"
rg -n "Sheet|Drawer" src --glob "*sidebar*"
```

**REPRODUCE**

```ts
test('폭 변경 시 사이드바 모드 전환이 안전하다', async ({ page }) => {
  // 좁은 폭에서 Drawer 열기
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // 넓힘 → Drawer는 닫히고 고정 사이드바만 남아야 한다
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const navs = page.getByRole('navigation', { name: '사이드바 메뉴' });
  await expect(navs).toHaveCount(1);

  // 배경 스크롤 잠금이 해제되어야 한다
  const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(overflow).not.toBe('hidden');
});
```

**PASS / FAIL**

- PASS: 전환 시 Drawer가 자동으로 닫히고, 네비게이션이 하나만 존재하며, 스크롤 잠금이 해제되고, 포커스가 유효한 요소에 남는다.
- FAIL: Drawer 잔류(S2), 중복 네비게이션(S2), 스크롤 잠금 해제 실패(**S1** — 페이지 사용 불가).

**FIX**

```tsx
// ✅ 데스크톱 진입 시 Drawer 강제 종료
const isDesktop = useMediaQuery('(min-width: 1024px)');

useEffect(() => {
  if (isDesktop) setDrawerOpen(false);
}, [isDesktop]);

return (
  <>
    {/* 고정 사이드바: 데스크톱에서만 마운트 */}
    {isDesktop && <DesktopSidebar />}

    {/* Drawer: 모바일에서만 마운트 */}
    {!isDesktop && (
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarNav />
        </SheetContent>
      </Sheet>
    )}
  </>
);
```

CSS로만 숨기지 않고 조건부 마운트를 쓰면 중복 네비게이션과 유령 포커스를 함께 제거할 수 있다. 단 `useMediaQuery`는 첫 렌더에서 `false`이므로 SSR 깜빡임을 피하려면 CSS 기반 전환 + Drawer 상태만 JS로 제어하는 하이브리드가 더 안전하다.

---

## 16. Dashboard Layout

### D-DASH-01 — 위젯 그리드의 폭 적응

**WHY**
대시보드는 데스크톱 폭 변화에 가장 민감하다. 고정 `grid-cols-4`는 1024px에서 각 위젯을 220px로 만들어 차트 축 라벨과 KPI 숫자가 겹치고, 3840px에서는 각 위젯을 900px로 만들어 정보 밀도가 오히려 떨어진다. 위젯은 **자신에게 필요한 최소 폭**을 알고 있어야 한다.

**DETECT**

```bash
rg -n "grid-cols-[0-9]" src --glob "*dashboard*" --glob "*widget*"
rg -n "col-span-[0-9]" src --glob "*.tsx" | head -30
rg -n "auto-fit|auto-fill|minmax" src --glob "*.tsx"
```

**REPRODUCE**

```ts
const WIDTHS = [1024, 1280, 1440, 1536, 1920, 2560, 3840];

for (const width of WIDTHS) {
  test(`대시보드 위젯 폭 정합성 @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const widgets = await page.getByTestId('widget').evaluateAll(els =>
      els.map(el => {
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-widget-id'),
          width: Math.round(r.width),
          overflowX: el.scrollWidth - el.clientWidth,
          overflowY: el.scrollHeight - el.clientHeight,
        };
      }));

    for (const w of widgets) {
      expect(w.width, `${w.id} 너무 좁음 @${width}`).toBeGreaterThanOrEqual(280);
      expect(w.width, `${w.id} 너무 넓음 @${width}`).toBeLessThanOrEqual(900);
      expect(w.overflowX, `${w.id} 내용 넘침 @${width}`).toBeLessThanOrEqual(1);
    }
    await expect(page).toHaveScreenshot(`dashboard-${width}.png`);
  });
}
```

**PASS / FAIL**

- PASS: 모든 필수 폭에서 위젯 폭이 최소 280px 이상 최대 900px 이하이고 내용이 넘치지 않는다. 1024에서 1~2열, 1920에서 3~4열로 자연 증가한다.
- FAIL: 위젯 내용 잘림(S2), 라벨 겹침(S2), 초광폭에서 위젯 3개만 표시(S3).

**FIX**

```tsx
// ✅ auto-fit + minmax: 폭에 따라 열 수가 자동 결정된다
<div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
  {widgets.map(w => (
    <Widget
      key={w.id}
      data-widget-id={w.id}
      // 넓은 위젯은 span으로 표현하되 좁은 폭에서는 해제
      className={cn('min-w-0', w.wide && 'xl:col-span-2')}
    />
  ))}
</div>
```

위젯 자체는 container query로 내부 밀도를 조절한다.

```tsx
// ✅ 위젯이 자기 폭에 반응 (부모 배치와 무관하게 항상 옳다)
<div className="@container rounded-lg border p-4">
  <div className="flex flex-col gap-1 @sm:flex-row @sm:items-baseline @sm:justify-between">
    <span className="text-sm text-muted-foreground">월 반복 매출</span>
    <span className="text-2xl font-semibold tabular-nums @lg:text-3xl">₩12,480,000</span>
  </div>
  <TrendChart className="mt-3 h-24 @lg:h-32" />
</div>
```

container query는 데스크톱 대시보드에서 특히 강력하다. 같은 위젯이 사이드바 접힘 여부, 병렬 패널 유무에 따라 다른 폭을 갖는데, 뷰포트 기준 media query로는 이를 알 수 없다.

---

### D-DASH-02 — 차트 리사이즈와 종횡비

**WHY**
차트 라이브러리는 대부분 마운트 시 컨테이너 크기를 읽어 캔버스/SVG를 그린다. 사이드바를 접거나 창을 리사이즈하면 컨테이너는 바뀌는데 차트는 그대로여서 잘리거나 여백이 남는다. `window.resize`만 구독하면 사이드바 접힘(창 크기 불변)을 놓친다. 또 높이를 고정하지 않으면 데이터 로드 후 차트가 나타나며 CLS가 발생한다.

**DETECT**

```bash
rg -n "ResponsiveContainer|useResizeObserver|ResizeObserver" src
rg -n "addEventListener\('resize'" src -A4
rg -n "<canvas|Chart\.|recharts|nivo|echarts|visx" src | head -20
rg -n "aspect-|h-\[[0-9]+px\]" src --glob "*chart*"
```

**REPRODUCE**

```ts
test('사이드바 접힘 시 차트가 재계산된다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const chart = page.getByTestId('revenue-chart');
  const before = await chart.boundingBox();

  await page.getByRole('button', { name: /사이드바 접기/ }).click();
  await page.waitForTimeout(500);

  const after = await chart.boundingBox();
  expect(after!.width).toBeGreaterThan(before!.width);

  // SVG/Canvas 내부 크기도 따라와야 한다
  const inner = await chart.evaluate(el => {
    const svg = el.querySelector('svg');
    const canvas = el.querySelector('canvas');
    if (svg) return svg.getBoundingClientRect().width;
    if (canvas) return canvas.getBoundingClientRect().width;
    return 0;
  });
  expect(Math.abs(inner - after!.width), '차트 내부가 컨테이너를 따라오지 않음')
    .toBeLessThanOrEqual(32);
});
```

CLS도 함께 측정한다.

```ts
const cls = await page.evaluate(() => new Promise<number>(resolve => {
  let total = 0;
  new PerformanceObserver(list => {
    for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) total += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => resolve(total), 3000);
}));
expect(cls).toBeLessThan(0.1);
```

**PASS / FAIL**

- PASS: 컨테이너 폭 변화(창 리사이즈, 사이드바 접힘, 패널 전환)에 차트가 200ms 내에 재계산된다. 로딩 중 차트 영역이 최종 높이를 차지해 CLS < 0.1이다.
- FAIL: 차트가 컨테이너를 넘거나 여백 발생(S2), 로드 시 CLS 0.1 초과(S2).

**FIX**

```tsx
// ✅ ResizeObserver 기반 컨테이너 + 예약된 높이
function ChartFrame({ children, height = 240 }: { children: React.ReactNode; height?: number }) {
  return (
    // 높이를 미리 확보 → 로딩 전후 CLS 0
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
```

```ts
// ✅ 자체 차트라면 ResizeObserver + rAF 디바운스
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  let raf = 0;
  const ro = new ResizeObserver(entries => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const { width, height } = entries[0].contentRect;
      redraw(width, height);
    });
  });
  ro.observe(el);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}, [redraw]);
```

`ResizeObserver` 콜백에서 동기적으로 레이아웃을 바꾸면 "ResizeObserver loop limit exceeded" 오류가 난다. `requestAnimationFrame`으로 미룬다.

---

### D-DASH-03 — 위젯별 독립 로딩과 오류 격리

**WHY**
대시보드는 여러 데이터 소스를 조합한다. 전체를 하나의 로딩 상태로 묶으면 가장 느린 위젯이 전체를 붙잡아 사용자는 3초 동안 빈 화면을 본다. 반대로 한 위젯의 API가 실패했을 때 전체가 오류 화면이 되면 정상 데이터까지 잃는다. 위젯은 **독립적으로 로드되고 독립적으로 실패**해야 한다.

**DETECT**

```bash
rg -n "Suspense" src --glob "*dashboard*"
rg -n "ErrorBoundary|error\.tsx" src/app
rg -n "Promise.all|await Promise" src/app --glob "*dashboard*"
rg -n "isLoading &&|if \(loading\) return" src --glob "*dashboard*"
```

`Promise.all`로 모든 데이터를 모아 한 번에 렌더하면 최장 지연에 묶인다.

**REPRODUCE**

```ts
test('한 위젯 API 실패가 대시보드 전체를 무너뜨리지 않는다', async ({ page }) => {
  await page.route('**/api/metrics/churn', route => route.fulfill({ status: 500, body: '{}' }));
  await page.goto('/dashboard');

  // 실패 위젯은 자체 오류 상태
  const failed = page.getByTestId('widget-churn');
  await expect(failed).toContainText(/불러오지 못했|다시 시도/);
  await expect(failed.getByRole('button', { name: '다시 시도' })).toBeVisible();

  // 나머지 위젯은 정상
  await expect(page.getByTestId('widget-mrr')).toContainText('₩');
  await expect(page.getByTestId('widget-users')).toBeVisible();

  // 재시도 성공
  await page.unroute('**/api/metrics/churn');
  await failed.getByRole('button', { name: '다시 시도' }).click();
  await expect(failed).not.toContainText('불러오지 못했');
});

test('느린 위젯이 전체를 막지 않는다', async ({ page }) => {
  await page.route('**/api/metrics/cohort', async route => {
    await new Promise(r => setTimeout(r, 4000));
    await route.continue();
  });
  const start = Date.now();
  await page.goto('/dashboard');
  await expect(page.getByTestId('widget-mrr')).toBeVisible();
  expect(Date.now() - start, '빠른 위젯이 느린 위젯에 묶임').toBeLessThan(2500);
});
```

**PASS / FAIL**

- PASS: 각 위젯이 독립 Suspense 경계와 Error Boundary를 갖는다. 실패 위젯에 재시도 수단이 있다. 빠른 위젯이 느린 위젯을 기다리지 않는다. 스켈레톤이 최종 크기와 일치한다.
- FAIL: 전체 페이지 로딩(S2), 한 위젯 실패로 전체 오류(**S1**), 재시도 불가(S2).

**FIX**

```tsx
// ✅ app/dashboard/page.tsx — 위젯별 스트리밍
export default function DashboardPage() {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
      <WidgetBoundary id="mrr" title="월 반복 매출">
        <MrrWidget />
      </WidgetBoundary>
      <WidgetBoundary id="users" title="활성 사용자">
        <UsersWidget />
      </WidgetBoundary>
      <WidgetBoundary id="churn" title="이탈률">
        <ChurnWidget />
      </WidgetBoundary>
    </div>
  );
}

function WidgetBoundary({ id, title, children }: Props) {
  return (
    <section data-testid={`widget-${id}`} data-widget-id={id} className="min-w-0 rounded-lg border">
      <h2 className="border-b px-4 py-3 text-sm font-medium">{title}</h2>
      <ErrorBoundary fallback={<WidgetError id={id} />}>
        <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
      </ErrorBoundary>
    </section>
  );
}
```

스켈레톤 높이는 실제 콘텐츠 높이와 같아야 한다. 다르면 로드 완료 시 CLS가 발생한다.

---

### D-DASH-04 — 정보 밀도와 시각 계층

**WHY**
데스크톱 대시보드에서 가장 흔한 실패는 "모든 위젯이 똑같이 중요해 보이는 것"이다. 12개 카드가 동일 크기·동일 스타일로 나열되면 사용자는 무엇을 먼저 봐야 할지 모른다. 반대로 여백만 넓게 두면 스크롤이 길어져 한 화면에 아무것도 담기지 않는다. 데스크톱의 장점은 **한 화면에서 비교**할 수 있다는 것이다.

**DETECT** — 정적 스캔으로 판정 불가. 스크린샷 기반 검토가 필요하다.

```bash
rg -n "text-(xs|sm|base|lg|xl|2xl|3xl)" src --glob "*dashboard*" | rg -o "text-[a-z0-9]+" | sort | uniq -c | sort -rn
rg -n "gap-|space-y-|p-[0-9]" src --glob "*dashboard*" | rg -o "(gap|space-y|p)-[0-9]+" | sort | uniq -c
```

**REPRODUCE**

1. `1920×1080`에서 대시보드를 캡처한다.
2. 다음을 평가한다.
   - fold 안에 핵심 지표 몇 개가 들어오는가 (목표: 4~6개)
   - 가장 중요한 지표가 시각적으로 구별되는가 (크기·위치·색)
   - 사용 중인 글자 크기 단계가 5개 이하인가
   - 여백 값이 4px 배수 스케일을 따르는가
   - 첫 스크롤 없이 "오늘 상태가 정상인가"를 판단할 수 있는가

```ts
const foldWidgets = await page.evaluate(() => {
  const vh = window.innerHeight;
  return [...document.querySelectorAll<HTMLElement>('[data-widget-id]')]
    .filter(el => el.getBoundingClientRect().top < vh)
    .map(el => el.dataset.widgetId);
});
```

**PASS / FAIL**

- PASS: 1920×1080 fold에 핵심 지표 4개 이상이 들어오고, 주 지표가 시각적으로 구별되며, 타이포 스케일이 5단계 이하로 통제된다.
- FAIL: fold에 지표 2개 이하(S3), 모든 위젯이 동일 위계(S3), 타이포 스케일 8단계 이상(S3).

**FIX**

```tsx
// ✅ 위계를 명시적으로 표현: 주 지표는 크게, 보조는 작게
<div className="grid gap-4 lg:grid-cols-4">
  {/* 주 지표: 2칸 차지 + 큰 숫자 */}
  <MetricCard
    className="lg:col-span-2"
    label="월 반복 매출"
    value="₩12,480,000"
    valueClassName="text-4xl"
    delta="+8.2%"
    trend="up"
  />
  {/* 보조 지표 */}
  <MetricCard label="신규 가입" value="342" valueClassName="text-2xl" />
  <MetricCard label="이탈률" value="2.1%" valueClassName="text-2xl" />
</div>
```

---

### D-DASH-05 — 데이터 새로고침과 라이브 업데이트

**WHY**
대시보드는 주기적으로 갱신되는 경우가 많다. 갱신 시 (a) 전체가 스켈레톤으로 돌아가면 화면이 깜빡여 읽던 값을 잃고, (b) 값이 소리 없이 바뀌면 스크린리더 사용자는 변화를 모르며, (c) 사용자가 드롭다운이나 텍스트를 선택한 상태에서 리렌더되면 조작이 취소된다. (d) 30초 폴링을 백그라운드 탭에서도 유지하면 배터리와 서버 자원을 낭비한다.

**DETECT**

```bash
rg -n "setInterval|refetchInterval|revalidate:" src
rg -n "visibilitychange|document.hidden" src
rg -n "aria-live|role=\"status\"" src --glob "*dashboard*"
```

**REPRODUCE**

1. 대시보드를 열고 30초 이상 관찰한다.
2. 갱신 시점에 화면이 깜빡이는지, 값만 조용히 바뀌는지 확인한다.
3. 드롭다운을 연 상태에서 갱신을 기다려 메뉴가 닫히는지 확인한다.
4. 탭을 백그라운드로 보내고 네트워크 탭에서 요청이 계속되는지 확인한다.

```ts
test('백그라운드 탭에서는 폴링이 멈춘다', async ({ page, context }) => {
  let requests = 0;
  await page.route('**/api/metrics/**', route => { requests++; route.continue(); });
  await page.goto('/dashboard');
  await page.waitForTimeout(2000);
  const baseline = requests;

  // 탭 숨김 시뮬레이션
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(5000);

  expect(requests - baseline, '백그라운드에서 폴링 계속됨').toBeLessThanOrEqual(1);
});
```

**PASS / FAIL**

- PASS: 갱신 시 기존 값이 유지되고 새 값으로 부드럽게 교체된다(스켈레톤 복귀 없음). 갱신 시각이 표시된다. 중요한 변화는 `aria-live="polite"`로 알린다. 백그라운드 탭에서 폴링이 중단된다.
- FAIL: 갱신마다 전체 깜빡임(S2), 조작 중 리셋(S2), 백그라운드 폴링 지속(S3).

**FIX**

```tsx
// ✅ 이전 데이터 유지 + 조용한 갱신 표시
const { data, isFetching, dataUpdatedAt } = useQuery({
  queryKey: ['metrics'],
  queryFn: fetchMetrics,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false, // 백그라운드 중단
  placeholderData: (prev) => prev,     // 이전 값 유지 → 깜빡임 없음
});

return (
  <section aria-busy={isFetching}>
    <header className="flex items-center justify-between">
      <h2>지표</h2>
      <span className="text-xs text-muted-foreground">
        {isFetching ? '갱신 중…' : `${formatRelative(dataUpdatedAt)} 업데이트`}
      </span>
    </header>
    <MetricGrid data={data} />
    <p className="sr-only" role="status" aria-live="polite">
      {isFetching ? '' : '지표가 업데이트되었습니다.'}
    </p>
  </section>
);
```

---

## 17. Data Table

### D-TBL-01 — 테이블 시맨틱과 스크린리더

**WHY**
`div` 기반 그리드는 스타일링이 쉽지만 스크린리더에게는 의미 없는 상자 더미다. 셀 이동 시 열 이름이 읽히지 않아 "3", "활성", "2024-01-05"만 들리고 무엇에 대한 값인지 알 수 없다. 데이터 테이블은 반드시 `table` 시맨틱 또는 완전한 `role="grid"` 구현이어야 한다.

**DETECT**

```bash
rg -n "<table|<thead|<tbody|<th |<td " src --glob "*.tsx" | wc -l
rg -n "role=\"(table|grid|row|columnheader|cell|gridcell)\"" src
rg -n "grid-cols-\[.*\]" src --glob "*table*"   # div 기반 테이블 의심
rg -n "<caption|aria-labelledby|aria-describedby" src --glob "*table*"
rg -n "scope=\"(col|row)\"" src
```

**REPRODUCE**

```ts
test('테이블 시맨틱이 올바르다', async ({ page }) => {
  await page.goto('/settings/members');

  const table = page.getByRole('table');
  await expect(table).toHaveCount(1);

  // 접근 가능한 이름
  const name = await table.evaluate(el =>
    el.getAttribute('aria-label') ?? el.querySelector('caption')?.textContent ?? '');
  expect(name.trim(), '테이블에 이름 없음').not.toBe('');

  // 열 헤더
  const headers = page.getByRole('columnheader');
  expect(await headers.count()).toBeGreaterThan(0);

  // 셀 개수가 헤더 수의 배수
  const cols = await headers.count();
  const cells = await page.getByRole('cell').count();
  expect(cells % cols).toBe(0);

  // 행 헤더(첫 열)가 scope="row"를 갖는지 (권장)
  const rowHeaders = await page.locator('th[scope="row"]').count();
  expect(rowHeaders).toBeGreaterThan(0);
});
```

**PASS / FAIL**

- PASS: `table`/`thead`/`th[scope]`/`tbody`/`td` 구조를 쓰거나 완전한 ARIA grid를 구현한다. 테이블에 이름(`caption` 또는 `aria-label`)이 있다. 행 식별자 열이 `th[scope="row"]`다.
- FAIL: div 기반이며 role 미부여(**S1** — 스크린리더 사용 불가), 이름 없음(S2), 헤더 없음(S2).

**FIX**

```tsx
// ✅ 시맨틱 테이블 + Tailwind
<div className="overflow-x-auto rounded-lg border">
  <table className="w-full min-w-[720px] caption-bottom text-sm">
    <caption className="border-t px-4 py-3 text-left text-xs text-muted-foreground">
      전체 {total}명 중 {rows.length}명 표시
    </caption>
    <thead className="sticky top-[var(--table-head-offset,0px)] bg-muted/50">
      <tr>
        <th scope="col" className="w-10 px-4 py-3">
          <span className="sr-only">선택</span>
        </th>
        <th scope="col" className="px-4 py-3 text-left font-medium">이름</th>
        <th scope="col" className="px-4 py-3 text-left font-medium">이메일</th>
        <th scope="col" className="px-4 py-3 text-left font-medium">권한</th>
        <th scope="col" className="px-4 py-3 text-right font-medium">최근 접속</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(r => (
        <tr key={r.id} className="border-t hover:bg-muted/40">
          <td className="px-4 py-3">
            <Checkbox aria-label={`${r.name} 선택`} />
          </td>
          <th scope="row" className="px-4 py-3 text-left font-normal">{r.name}</th>
          <td className="px-4 py-3">{r.email}</td>
          <td className="px-4 py-3">{r.role}</td>
          <td className="px-4 py-3 text-right tabular-nums">{r.lastSeen}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

CSS Grid 레이아웃이 꼭 필요하면 `display: grid`를 `table` 요소에 적용하되 `role`을 명시적으로 복원한다. 다만 대부분의 경우 `table-layout: fixed` + `colgroup`으로 충분하다.

---

### D-TBL-02 — 정렬 상태와 조작

**WHY**
정렬 가능한 열 헤더가 단순 `div`이면 키보드로 정렬할 수 없다. `aria-sort`가 없으면 스크린리더 사용자는 현재 정렬 기준과 방향을 알 수 없다. 정렬 후 포커스가 사라지면 연속 정렬이 불가능하다. 또 정렬 상태가 URL에 반영되지 않으면 공유·새로고침 시 초기화된다.

**DETECT**

```bash
rg -n "aria-sort" src | wc -l
rg -n "onClick.*sort|handleSort|setSortBy" src --glob "*.tsx" -B4 | rg "<th|<div"
rg -n "searchParams|useSearchParams" src --glob "*table*"
```

**REPRODUCE**

```ts
test('테이블 정렬이 접근 가능하다', async ({ page }) => {
  await page.goto('/settings/members');

  const header = page.getByRole('columnheader', { name: /이름/ });
  await expect(header).toHaveAttribute('aria-sort', 'none');

  // 헤더 안의 버튼으로 키보드 조작 가능
  const sortBtn = header.getByRole('button');
  await sortBtn.focus();
  await page.keyboard.press('Enter');

  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(sortBtn).toBeFocused(); // 포커스 유지

  await page.keyboard.press('Enter');
  await expect(header).toHaveAttribute('aria-sort', 'descending');

  // URL 반영
  expect(page.url()).toContain('sort=name');

  // 새로고침 후 유지
  await page.reload();
  await expect(page.getByRole('columnheader', { name: /이름/ }))
    .toHaveAttribute('aria-sort', 'descending');

  // 실제로 정렬되었는지
  const names = await page.locator('th[scope="row"]').allTextContents();
  const sorted = [...names].sort((a, b) => b.localeCompare(a, 'ko'));
  expect(names).toEqual(sorted);
});
```

**PASS / FAIL**

- PASS: 정렬 가능한 헤더가 버튼이며 키보드로 조작된다. `aria-sort`가 정확히 하나의 열에만 `ascending`/`descending`으로 설정된다. 정렬 후 포커스가 유지되고 URL에 반영된다. 실제 데이터 순서가 표시와 일치한다.
- FAIL: 키보드 정렬 불가(S2), `aria-sort` 없음(S2), 정렬 후 포커스 상실(S2), 표시와 실제 순서 불일치(**S1**).

**FIX**

```tsx
// ✅ 접근 가능한 정렬 헤더
function SortableHeader({ column, label, currentSort, currentDir }: Props) {
  const isActive = currentSort === column;
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc';
  const params = new URLSearchParams(useSearchParams());
  params.set('sort', column);
  params.set('dir', nextDir);

  return (
    <th
      scope="col"
      aria-sort={isActive ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="px-4 py-3 text-left font-medium"
    >
      <Link
        href={`?${params}`}
        scroll={false}
        className="inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <SortIcon
          aria-hidden="true"
          direction={isActive ? currentDir : undefined}
          className="size-3.5 opacity-60"
        />
        <span className="sr-only">
          {isActive
            ? `현재 ${currentDir === 'asc' ? '오름차순' : '내림차순'} 정렬됨. ${nextDir === 'asc' ? '오름차순' : '내림차순'}으로 변경`
            : '오름차순으로 정렬'}
        </span>
      </Link>
    </th>
  );
}
```

정렬 결과 변경은 `aria-live` 영역으로 알린다.

```tsx
<p role="status" aria-live="polite" className="sr-only">
  {`${sortLabel} 기준 ${dirLabel} 정렬, ${rows.length}개 항목`}
</p>
```

---

### D-TBL-03 — Sticky 헤더와 첫 열 고정

**WHY**
20열짜리 테이블을 가로 스크롤하면 어느 행을 보고 있는지 알 수 없다. 100행을 세로 스크롤하면 어느 열인지 알 수 없다. 헤더 sticky와 첫 열 sticky를 조합하면 두 문제가 해결되지만, 교차 지점(좌상단 셀)의 z-index와 배경 처리를 놓치면 스크롤 시 셀이 겹쳐 읽힌다.

**DETECT**

```bash
rg -n "sticky left-0" src --glob "*table*"
rg -n "sticky top-0" src --glob "*table*"
rg -n "bg-" src --glob "*table*" | rg "sticky" -B1
```

sticky 요소에 배경색이 없으면 아래 콘텐츠가 비쳐 보인다.

**REPRODUCE**

```ts
test('가로·세로 스크롤에서 헤더와 첫 열이 고정된다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/reports/wide-table');

  const container = page.getByTestId('table-scroll');
  await container.evaluate(el => { el.scrollLeft = 600; });
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);

  // 첫 열이 보이는가
  const firstCell = page.locator('tbody th[scope="row"]').first();
  await expect(firstCell).toBeInViewport();
  const x = (await firstCell.boundingBox())!.x;
  expect(x).toBeLessThan(200); // 왼쪽에 고정

  // 헤더가 보이는가
  await expect(page.locator('thead')).toBeInViewport();

  // 교차 셀이 다른 셀 위에 있는가
  const overlap = await page.evaluate(() => {
    const corner = document.querySelector<HTMLElement>('thead th:first-child')!;
    const r = corner.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return corner.contains(top);
  });
  expect(overlap, '교차 셀이 다른 셀에 가려짐').toBe(true);
});
```

**PASS / FAIL**

- PASS: 세로 스크롤에서 헤더 유지, 가로 스크롤에서 첫 열 유지, 교차 셀이 최상단에 불투명 배경으로 표시된다. 고정 열 경계에 구분선 또는 그림자가 있다.
- FAIL: 겹쳐 읽힘(S2), 배경 투명으로 텍스트 중첩(S2), 첫 열 미고정으로 맥락 상실(S3).

**FIX**

```tsx
// ✅ 헤더 + 첫 열 + 교차 셀의 z-index/배경 3단 정리
<div data-testid="table-scroll" className="relative max-h-[70vh] overflow-auto rounded-lg border">
  <table className="w-full min-w-[1400px] border-separate border-spacing-0 text-sm">
    <thead>
      <tr>
        {/* 교차 셀: 가장 높은 z-index */}
        <th
          scope="col"
          className="sticky left-0 top-0 z-30 border-b border-r bg-background px-4 py-3 text-left"
        >
          이름
        </th>
        {columns.map(c => (
          <th
            key={c.id}
            scope="col"
            className="sticky top-0 z-20 border-b bg-background px-4 py-3 text-left whitespace-nowrap"
          >
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(r => (
        <tr key={r.id}>
          <th
            scope="row"
            className="sticky left-0 z-10 border-b border-r bg-background px-4 py-3 text-left font-normal"
          >
            {r.name}
          </th>
          {columns.map(c => (
            <td key={c.id} className="border-b px-4 py-3 tabular-nums">{r[c.id]}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

`border-separate border-spacing-0`을 쓰는 이유는 `border-collapse: collapse`에서 sticky 셀의 border가 사라지는 브라우저 버그를 피하기 위함이다. 배경은 반드시 불투명(`bg-background`)이어야 한다.

---

### D-TBL-04 — 가로 스크롤의 발견 가능성과 키보드 접근

**WHY**
가로 스크롤 가능한 테이블에서 (a) 스크롤 가능하다는 사실을 알리는 시각적 단서(그림자·페이드)가 없으면 사용자는 오른쪽 열의 존재를 모른다. (b) 스크롤 컨테이너가 키보드 포커스를 받지 못하면 키보드 사용자는 가로 스크롤을 할 수 없다. WCAG 2.1.1 위반이다. (c) 마우스 휠만으로는 가로 스크롤이 안 되는 환경이 많다.

**DETECT**

```bash
rg -n "overflow-x-auto" src --glob "*.tsx" -A2 | rg -v "tabIndex|role="
rg -n "shadow.*scroll|mask-image|gradient.*fade" src
```

**REPRODUCE**

```ts
test('가로 스크롤 영역이 키보드로 접근 가능하다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/reports/wide-table');

  const region = page.getByRole('region', { name: /표|table/i });
  await expect(region).toBeVisible();

  // 포커스 가능해야 한다
  await region.focus();
  const focused = await region.evaluate(el => el === document.activeElement);
  expect(focused, '스크롤 영역에 포커스 불가 → 키보드 가로 스크롤 불가').toBe(true);

  // 화살표 키로 스크롤
  const before = await region.evaluate(el => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const after = await region.evaluate(el => el.scrollLeft);
  expect(after).toBeGreaterThan(before);
});
```

**PASS / FAIL**

- PASS: 스크롤 컨테이너가 `role="region"` + `aria-label` + `tabIndex={0}`을 갖고 화살표 키로 스크롤된다. 스크롤 가능 방향에 시각적 단서가 있다.
- FAIL: 키보드 스크롤 불가(**S1** — WCAG 2.1.1), 단서 없음(S3).

**FIX**

```tsx
// ✅ 포커스 가능한 스크롤 영역 + 방향 단서
function ScrollableTable({ children, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={update}
        className="overflow-x-auto rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </div>

      {edges.left && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      )}
      {edges.right && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
      )}
    </div>
  );
}
```

`tabIndex={0}`을 준 컨테이너에는 반드시 `role`과 `aria-label`이 있어야 한다. 이름 없는 포커스 정지점은 스크린리더 사용자를 혼란스럽게 한다.

---

### D-TBL-05 — 행 선택과 대량 작업

**WHY**
테이블 행 선택은 실수의 비용이 가장 큰 인터랙션이다. (a) 체크박스에 접근 가능한 이름이 없으면 스크린리더 사용자는 무엇을 선택하는지 모른다. (b) "전체 선택"이 현재 페이지만 선택하는지 전체 데이터를 선택하는지 불명확하면 의도치 않은 대량 삭제가 발생한다. (c) 선택 후 필터를 바꿨을 때 선택이 유지되면 보이지 않는 행에 작업이 적용된다. (d) Shift+클릭 범위 선택이 없으면 100개 선택에 100번 클릭해야 한다.

**DETECT**

```bash
rg -n "Checkbox|type=\"checkbox\"" src --glob "*table*" -A3 | rg -v "aria-label"
rg -n "selectAll|toggleAll|indeterminate" src
rg -n "selectedIds|selection" src --glob "*table*" -A6 | rg "filter|search"
```

**REPRODUCE**

```ts
test('행 선택과 대량 작업이 안전하다', async ({ page }) => {
  await page.goto('/settings/members');

  // 1. 체크박스 이름
  const first = page.getByRole('checkbox').nth(1);
  const name = await first.getAttribute('aria-label');
  expect(name, '체크박스에 이름 없음').toBeTruthy();

  // 2. 전체 선택 → indeterminate 처리
  const all = page.getByRole('checkbox', { name: /전체 선택/ });
  await all.check();
  const count = await page.getByRole('checkbox', { checked: true }).count();
  expect(count).toBeGreaterThan(1);

  await first.uncheck();
  const mixed = await all.evaluate((el: HTMLInputElement) => el.indeterminate);
  expect(mixed, '부분 선택 상태가 표시되지 않음').toBe(true);

  // 3. 선택 개수 명시
  await expect(page.getByRole('region', { name: /선택/ })).toContainText(/\d+개/);

  // 4. 필터 변경 시 선택 초기화 또는 명시적 경고
  await page.getByLabel('검색').fill('nomatch-xyz');
  await page.waitForTimeout(500);
  const stillSelected = await page.getByRole('checkbox', { checked: true }).count();
  expect(stillSelected, '보이지 않는 행이 선택된 채 유지됨').toBe(0);

  // 5. 파괴적 작업은 확인 단계
  await page.getByLabel('검색').fill('');
  await all.check();
  await page.getByRole('button', { name: '삭제' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/\d+명/); // 대상 개수 명시
});
```

**PASS / FAIL**

- PASS: 각 체크박스가 행을 식별하는 이름을 갖는다. 전체 선택의 범위가 명시된다. 부분 선택이 `indeterminate`로 표시된다. 필터 변경 시 선택이 초기화되거나 명시적으로 경고한다. 파괴적 작업은 대상 개수를 포함한 확인 단계를 거친다. Shift+클릭 범위 선택을 지원한다(권장).
- FAIL: 이름 없는 체크박스(S2), 보이지 않는 행에 작업 적용(**S0** — 데이터 손실), 확인 없는 대량 삭제(**S0**).

**FIX**

```tsx
// ✅ 안전한 선택 모델
<Checkbox
  checked={isSelected(row.id)}
  onCheckedChange={(v, e) => {
    // Shift+클릭 범위 선택
    if ((e as MouseEvent)?.shiftKey && lastSelectedIndex != null) {
      selectRange(lastSelectedIndex, index);
    } else {
      toggle(row.id);
      setLastSelectedIndex(index);
    }
  }}
  aria-label={`${row.name} 선택`}
/>
```

```tsx
// ✅ 선택 범위를 명시하고 필터 변경 시 정리
useEffect(() => {
  // 현재 결과에 없는 선택 항목 제거
  setSelected(prev => prev.filter(id => visibleIds.has(id)));
}, [visibleIds]);

{selectedCount > 0 && (
  <div role="region" aria-label={`${selectedCount}개 선택됨`} className="...">
    <span>현재 페이지에서 {selectedCount}개 선택</span>
    {selectedCount === pageSize && totalCount > pageSize && (
      <button onClick={selectAllMatching} className="underline">
        검색 결과 전체 {totalCount}개 선택
      </button>
    )}
    <Button variant="destructive" onClick={confirmDelete}>삭제</Button>
  </div>
)}
```

---

### D-TBL-06 — 열 폭·정렬·긴 값 처리

**WHY**
열 폭이 콘텐츠에 따라 매 렌더 달라지면 페이지네이션마다 표가 흔들린다. 숫자를 좌측 정렬하면 자릿수 비교가 불가능하다. 비례 폰트에서 숫자 폭이 달라 열이 지그재그로 보인다. 이메일·URL 같은 긴 값이 줄바꿈 없이 열을 밀어내면 테이블이 화면을 넘는다.

**DETECT**

```bash
rg -n "table-fixed|table-auto|<colgroup" src --glob "*table*"
rg -n "tabular-nums|font-variant-numeric" src
rg -n "text-right|text-left" src --glob "*table*"
rg -n "break-all|break-words|truncate" src --glob "*table*"
```

**REPRODUCE**

```ts
test('페이지 전환 시 열 폭이 유지된다', async ({ page }) => {
  await page.goto('/settings/members');
  const widths1 = await page.getByRole('columnheader').evaluateAll(els =>
    els.map(el => Math.round(el.getBoundingClientRect().width)));

  await page.getByRole('button', { name: '다음 페이지' }).click();
  await page.waitForTimeout(400);
  const widths2 = await page.getByRole('columnheader').evaluateAll(els =>
    els.map(el => Math.round(el.getBoundingClientRect().width)));

  widths1.forEach((w, i) => {
    expect(Math.abs(w - widths2[i]), `열 ${i} 폭 변동`).toBeLessThanOrEqual(2);
  });
});
```

**PASS / FAIL**

- PASS: `table-fixed` 또는 `colgroup`으로 열 폭이 고정되어 페이지 전환 시 변동이 2px 이하다. 숫자·통화·날짜는 우측 정렬 + `tabular-nums`다. 긴 값은 `truncate` + 전체 값 확인 수단(D-TIP-05)을 갖는다.
- FAIL: 페이지마다 열 폭 변동(S2), 숫자 비교 불가(S3), 긴 값이 테이블을 밀어냄(S2).

**FIX**

```tsx
// ✅ colgroup으로 폭 고정 + 정렬 규칙 + 긴 값 처리
<table className="w-full min-w-[880px] table-fixed text-sm">
  <colgroup>
    <col className="w-10" />
    <col className="w-[22%]" />
    <col className="w-[30%]" />
    <col className="w-[15%]" />
    <col className="w-[18%]" />
    <col className="w-[15%]" />
  </colgroup>
  <thead>...</thead>
  <tbody>
    {rows.map(r => (
      <tr key={r.id}>
        <td className="px-3 py-3"><Checkbox aria-label={`${r.name} 선택`} /></td>
        <th scope="row" className="truncate px-3 py-3 text-left font-normal">{r.name}</th>
        <td className="truncate px-3 py-3">{r.email}</td>
        <td className="px-3 py-3">{r.role}</td>
        {/* 숫자·통화는 우측 정렬 + 등폭 숫자 */}
        <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(r.spend)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{formatDate(r.lastSeen)}</td>
      </tr>
    ))}
  </tbody>
</table>
```

`tabular-nums`(`font-variant-numeric: tabular-nums`)는 숫자 글리프 폭을 균일하게 만들어 자릿수 정렬을 가능하게 한다. 대시보드 지표에도 동일하게 적용한다.

---

### D-TBL-07 — 빈 상태·로딩·오류

**WHY**
데이터가 없을 때 빈 표만 보이면 사용자는 "로딩 중인가, 필터가 잘못됐나, 정말 데이터가 없나"를 구분할 수 없다. 검색 결과 0건과 데이터 자체가 없는 초기 상태는 완전히 다른 안내가 필요하다. 로딩 스켈레톤이 실제 행 높이와 다르면 데이터 도착 시 레이아웃이 점프한다.

**DETECT**

```bash
rg -n "length === 0|isEmpty|no data|데이터가 없" src --glob "*table*"
rg -n "Skeleton" src --glob "*table*" -A3
```

**REPRODUCE**

세 가지 상태를 각각 만든다.

```ts
test('테이블 빈 상태가 맥락에 맞게 구분된다', async ({ page }) => {
  // 1. 초기 데이터 없음
  await page.route('**/api/members*', r => r.fulfill({ json: { rows: [], total: 0 } }));
  await page.goto('/settings/members');
  await expect(page.getByText(/첫 멤버를 초대/)).toBeVisible();
  await expect(page.getByRole('button', { name: '멤버 초대' })).toBeVisible();

  // 2. 검색 결과 없음
  await page.unroute('**/api/members*');
  await page.reload();
  await page.getByLabel('검색').fill('zzzz-no-match');
  await expect(page.getByText(/검색 결과가 없습니다/)).toBeVisible();
  await expect(page.getByRole('button', { name: /검색 초기화|필터 지우기/ })).toBeVisible();

  // 3. 오류
  await page.route('**/api/members*', r => r.fulfill({ status: 500, body: '{}' }));
  await page.reload();
  await expect(page.getByText(/불러오지 못했/)).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
});

test('로딩 스켈레톤 높이가 실제 행과 일치한다', async ({ page }) => {
  await page.route('**/api/members*', async r => {
    await new Promise(x => setTimeout(x, 1500));
    await r.continue();
  });
  await page.goto('/settings/members');

  const skeletonHeight = await page.getByTestId('row-skeleton').first()
    .evaluate(el => el.getBoundingClientRect().height);
  await page.waitForResponse('**/api/members*');
  await page.waitForTimeout(300);
  const rowHeight = await page.locator('tbody tr').first()
    .evaluate(el => el.getBoundingClientRect().height);

  expect(Math.abs(skeletonHeight - rowHeight)).toBeLessThanOrEqual(4);
});
```

**PASS / FAIL**

- PASS: 초기 빈 상태·검색 0건·오류가 서로 다른 메시지와 서로 다른 다음 행동을 제시한다. 스켈레톤 높이가 실제 행과 ±4px 이내다. 상태 변화가 `aria-live`로 전달된다.
- FAIL: 상태 구분 없음(S2), 다음 행동 없음(S3), 스켈레톤 불일치로 CLS(S2).

**FIX**

```tsx
// ✅ 상태별 분기
function TableBody({ status, rows, hasFilters, onRetry, onClearFilters }: Props) {
  if (status === 'loading') {
    return (
      <tbody aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <tr key={i} data-testid="row-skeleton" className="border-t">
            <td colSpan={6} className="px-4 py-3">
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  if (status === 'error') {
    return (
      <tbody>
        <tr><td colSpan={6} className="px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">멤버 목록을 불러오지 못했습니다.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>다시 시도</Button>
        </td></tr>
      </tbody>
    );
  }

  if (rows.length === 0) {
    return (
      <tbody>
        <tr><td colSpan={6} className="px-4 py-16 text-center">
          {hasFilters ? (
            <>
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={onClearFilters}>
                필터 지우기
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">아직 멤버가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">첫 멤버를 초대해 협업을 시작하세요.</p>
              <Button size="sm" className="mt-4">멤버 초대</Button>
            </>
          )}
        </td></tr>
      </tbody>
    );
  }

  return <tbody>{rows.map(r => <Row key={r.id} row={r} />)}</tbody>;
}
```

---

## 18. Layer와 Overlay Stacking

### D-LAYER-01 — z-index 스케일 통제

**WHY**
`z-[9999]`, `z-[10000]`, `z-[99999]`가 코드베이스에 흩어져 있으면 어떤 요소가 위에 오는지 예측할 수 없다. 새 오버레이를 추가할 때마다 숫자를 올리는 군비 경쟁이 벌어지고, 결국 모달이 토스트를 가리거나 드롭다운이 헤더 뒤로 숨는다. 게다가 `z-index`는 stacking context 안에서만 비교되므로 큰 값이 항상 이기지도 않는다.

**DETECT**

```bash
rg -o "z-\[?[0-9]+\]?" src | sort | uniq -c | sort -rn
rg -n "z-\[[0-9]{4,}\]" src
# stacking context 생성 요인
rg -n "transform|opacity-[0-9]|filter|backdrop-blur|will-change|isolate|contain:" src --glob "*.tsx" | wc -l
```

값의 종류가 6개를 넘거나 4자리 z-index가 있으면 통제가 필요하다.

**REPRODUCE**

```ts
test('레이어 순서가 의도대로다', async ({ page }) => {
  await page.goto('/settings/members');

  // 모달 위에 토스트가 보여야 한다
  await page.getByRole('button', { name: '멤버 초대' }).click();
  await page.getByRole('button', { name: '저장' }).click(); // 검증 오류 → 토스트

  const toast = page.getByRole('status').first();
  await expect(toast).toBeVisible();

  const onTop = await toast.evaluate(el => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el.contains(top);
  });
  expect(onTop, '토스트가 모달에 가려짐').toBe(true);

  // 모달 안의 드롭다운이 모달 위에 열려야 한다
  await page.getByRole('combobox', { name: '권한' }).click();
  const listbox = page.getByRole('listbox');
  const listOnTop = await listbox.evaluate(el => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + 10, r.top + 10);
    return el.contains(top);
  });
  expect(listOnTop, '드롭다운이 모달에 가려짐').toBe(true);
});
```

**PASS / FAIL**

- PASS: z-index 값이 정의된 스케일(6~8단계)에서만 사용된다. 모달 > 드롭다운 > 토스트 관계가 의도대로 동작한다. 4자리 임의 값이 없다.
- FAIL: 오버레이 상호 가림(S2), 모달 안 드롭다운이 가려져 선택 불가(**S1**).

**FIX**

레이어 스케일을 토큰으로 정의한다.

```js
// tailwind.config.ts
zIndex: {
  base: '0',
  raised: '10',      // 카드 hover, sticky 셀
  sticky: '20',      // sticky 헤더/툴바
  nav: '30',         // 전역 헤더, 사이드바
  overlay: '40',     // 드로어/모달 스크림
  modal: '50',       // 모달 콘텐츠
  popover: '60',     // 드롭다운/툴팁/팝오버 (모달 안에서도 위)
  toast: '70',       // 알림
  devtool: '80',
}
```

```tsx
// ✅ 의도를 이름으로 표현
<header className="sticky top-0 z-nav">...</header>
<DialogOverlay className="z-overlay" />
<DialogContent className="z-modal" />
<DropdownMenuContent className="z-popover" />
<Toaster className="z-toast" />
```

stacking context 함정도 함께 점검한다.

```tsx
// ❌ 부모의 transform이 새 stacking context를 만들어
//    자식의 z-popover가 형제 헤더의 z-nav를 이기지 못한다
<div className="transform-gpu">
  <DropdownMenuContent className="z-popover" />
</div>

// ✅ 포털로 body 하위에 렌더 → stacking context 탈출
<DropdownMenuPortal>
  <DropdownMenuContent className="z-popover" />
</DropdownMenuPortal>
```

---

### D-LAYER-02 — 중첩 오버레이

**WHY**
모달 안에서 확인 다이얼로그를 열거나, 드로어 안에서 셀렉트를 여는 상황은 흔하다. 이때 Esc가 어떤 것을 닫는지, 포커스가 어디로 복귀하는지, 배경 스크롤 잠금이 몇 번 걸리고 몇 번 풀리는지가 문제가 된다. 스크롤 잠금이 중첩 카운트를 관리하지 않으면 안쪽 오버레이를 닫는 순간 바깥 모달이 열려 있는데도 배경 스크롤이 풀린다.

**DETECT**

```bash
rg -n "body.style.overflow|overflow: hidden" src -B4
rg -n "Dialog" src --glob "*.tsx" -A4 | rg "Dialog" | wc -l
rg -n "onOpenChange" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('중첩 오버레이의 Esc와 스크롤 잠금이 올바르다', async ({ page }) => {
  await page.goto('/settings/members');

  await page.getByRole('button', { name: '멤버 초대' }).click();
  const outer = page.getByRole('dialog');
  await expect(outer).toBeVisible();

  // 안쪽 확인 다이얼로그
  await outer.getByRole('button', { name: '취소' }).click();
  const inner = page.getByRole('alertdialog');
  await expect(inner).toBeVisible();

  // Esc 1회 → 안쪽만 닫힘
  await page.keyboard.press('Escape');
  await expect(inner).toBeHidden();
  await expect(outer).toBeVisible();

  // 배경 스크롤은 여전히 잠겨 있어야 한다
  const locked = await page.evaluate(() =>
    getComputedStyle(document.body).overflow === 'hidden');
  expect(locked, '안쪽 닫힘으로 스크롤 잠금이 조기 해제됨').toBe(true);

  // Esc 2회 → 바깥 닫힘 + 잠금 해제
  await page.keyboard.press('Escape');
  await expect(outer).toBeHidden();
  const unlocked = await page.evaluate(() =>
    getComputedStyle(document.body).overflow !== 'hidden');
  expect(unlocked).toBe(true);
});
```

**PASS / FAIL**

- PASS: Esc가 최상단 오버레이만 닫는다. 포커스가 한 단계씩 복귀한다. 스크롤 잠금이 참조 카운트로 관리된다. 최종 닫힘 후 `body` 스타일이 원상 복구된다.
- FAIL: Esc가 전부 닫음(S2), 스크롤 잠금 잔류(**S1** — 페이지 사용 불가), 조기 해제(S2).

**FIX**

```ts
// ✅ 참조 카운트 기반 스크롤 잠금
let lockCount = 0;
let savedPaddingRight = '';

export function lockBodyScroll() {
  if (lockCount === 0) {
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    savedPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
  }
  lockCount++;
}

export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
    document.body.style.paddingRight = savedPaddingRight;
  }
}
```

Radix Dialog는 이 카운트를 내부적으로 관리한다. 자체 구현과 라이브러리를 섞으면 카운트가 어긋나므로 하나로 통일한다.

---

### D-LAYER-03 — 오버레이와 배경 접근성

**WHY**
모달이 열려 있는 동안 배경 콘텐츠가 접근성 트리에 남아 있으면 스크린리더 사용자는 모달 밖 요소를 계속 읽고 조작할 수 있다. 시각 사용자는 스크림 때문에 그것을 볼 수 없으므로 완전히 다른 경험이 된다. `inert` 속성 또는 `aria-hidden`으로 배경을 제거해야 한다.

**DETECT**

```bash
rg -n "aria-hidden|inert" src --glob "*.tsx"
rg -n "role=\"dialog\"" src -A3 | rg -v "aria-modal"
```

**REPRODUCE**

```ts
test('모달 열림 시 배경이 접근성 트리에서 제거된다', async ({ page }) => {
  await page.goto('/settings/members');
  await page.getByRole('button', { name: '멤버 초대' }).click();

  const hidden = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')!;
    const siblings = [...document.body.children]
      .filter(el => !el.contains(dialog) && el !== dialog);
    return siblings.map(el => ({
      tag: el.tagName,
      ariaHidden: el.getAttribute('aria-hidden'),
      inert: el.hasAttribute('inert'),
    }));
  });

  const exposed = hidden.filter(h => h.ariaHidden !== 'true' && !h.inert);
  expect(exposed, `배경이 노출됨: ${JSON.stringify(exposed)}`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 모달 열림 시 배경 형제 요소가 `inert` 또는 `aria-hidden="true"`다. 다이얼로그에 `aria-modal="true"`와 `aria-labelledby`가 있다.
- FAIL: 배경 노출(S2), `aria-modal` 없음(S2), 이름 없는 다이얼로그(S2).

**FIX**

```tsx
// ✅ 이름과 설명을 명시한 다이얼로그
<DialogContent aria-labelledby="invite-title" aria-describedby="invite-desc">
  <DialogTitle id="invite-title">멤버 초대</DialogTitle>
  <DialogDescription id="invite-desc">
    이메일 주소를 입력하면 초대 링크가 발송됩니다.
  </DialogDescription>
  ...
</DialogContent>
```

`inert`는 접근성 트리 제거와 포커스 차단을 동시에 처리하므로 `aria-hidden`보다 낫다. 브라우저 지원이 충분하지 않은 환경에서는 폴리필 또는 라이브러리 기본 동작을 사용한다.

---

## 19. Window · Monitor · Browser Chrome

### D-WIN-01 — 창 리사이즈 연속 대응

**WHY**
데스크톱 사용자는 창을 자주 리사이즈한다. 스냅(좌우 반쪽), 최대화, 복원, 드래그 리사이즈가 모두 일상이다. 리사이즈 중 레이아웃이 깨지거나, 리사이즈 핸들러가 무거워 창이 끊기며 따라오거나, 특정 폭에서만 발생하는 오류가 콘솔에 쌓이면 품질 문제가 즉시 드러난다.

**DETECT**

```bash
rg -n "addEventListener\('resize'" src -A6
rg -n "debounce|throttle" src | head -20
rg -n "ResizeObserver" src | wc -l
```

리사이즈 핸들러에 디바운스가 없고 상태 갱신이 있으면 성능 문제가 발생한다.

**REPRODUCE**

```ts
test('연속 리사이즈에서 레이아웃과 콘솔이 안정적이다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const widths = [1920, 1600, 1280, 1024, 1440, 900, 1366, 2560, 1440];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(180);
    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta, `가로 오버플로 @${w}`).toBeLessThanOrEqual(1);
  }

  const relevant = errors.filter(e => !/ResizeObserver loop/.test(e));
  expect(relevant, JSON.stringify(relevant)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 모든 중간 폭에서 오버플로가 없고 콘솔 오류가 없다. 리사이즈 중 프레임 저하가 체감되지 않는다.
- FAIL: 특정 폭에서 오류(S2), 리사이즈 중 심한 끊김(S2), 리사이즈 후 레이아웃이 복구되지 않음(S2).

**FIX**

```ts
// ✅ 리사이즈 상태 갱신은 rAF 디바운스
useEffect(() => {
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => setViewportWidth(window.innerWidth));
  };
  window.addEventListener('resize', onResize, { passive: true });
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
}, []);
```

가능하면 JS 리사이즈 구독 자체를 제거하고 CSS media/container query로 대체한다. 리사이즈 핸들러가 없으면 성능 문제도 없다.

---

### D-WIN-02 — 최소 창 크기와 극단적 축소

**WHY**
사용자는 창을 400px 폭까지 줄일 수 있다. 데스크톱 브라우저에서 좁은 창은 모바일 뷰포트와 다르다. `hasTouch`가 false이고, 모바일 전용 UI로 전환되지만 터치 대상 크기 규칙은 다르게 적용될 수 있다. 이 구간에서 레이아웃이 완전히 무너지면 화면 분할로 두 앱을 나란히 쓰는 사용자를 잃는다.

**DETECT** — 반응형 하한 breakpoint 확인.

```bash
cat tailwind.config.* | rg -A10 "screens"
rg -n "min-w-\[[0-9]{3,}px\]" src
```

**REPRODUCE**

```ts
const NARROW = [320, 375, 480, 640, 768, 900];

for (const width of NARROW) {
  test(`좁은 데스크톱 창 @${width}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      hasTouch: false,       // 데스크톱 브라우저 축소
      isMobile: false,
    });
    const page = await context.newPage();
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();

    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta).toBeLessThanOrEqual(1);

    // 핵심 기능 접근 가능
    await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
    await context.close();
  });
}
```

**PASS / FAIL**

- PASS: 320px까지 콘텐츠가 읽히고 핵심 기능에 도달할 수 있다. 가로 스크롤이 없다.
- FAIL: 640px 미만에서 레이아웃 붕괴(S2), 콘텐츠 접근 불가(S1).

**FIX**
모바일 대응(02_Mobile_QA.md)과 동일한 원칙을 적용한다. 데스크톱 브라우저의 좁은 창은 별도 처리가 아니라 같은 반응형 정책의 연장이다. 단 `hasTouch: false`이므로 hover 기반 UI가 여전히 활성이라는 점을 확인한다.

---

### D-WIN-03 — 다중 모니터와 DPR 전환

**WHY**
노트북(DPR 2)과 외부 모니터(DPR 1)를 함께 쓰는 사용자는 창을 모니터 간에 드래그한다. 이때 `devicePixelRatio`가 실시간으로 바뀐다. Canvas는 다시 그리지 않으면 흐려지거나 지나치게 선명해지고, 한 번만 계산한 픽셀 기반 레이아웃은 어긋난다. `window.screen` 값을 캐시한 코드도 틀리게 된다.

**DETECT**

```bash
rg -n "devicePixelRatio" src -A4
rg -n "window\.screen" src
rg -n "getContext\('2d'\)|WebGLRenderingContext|drawImage" src
```

**REPRODUCE** — 실기기 필요(자동화 불가).

1. 서로 다른 배율의 두 모니터를 연결한다.
2. 앱을 열고 차트·Canvas·이미지를 확인한다.
3. 창을 다른 모니터로 드래그한다.
4. 새로 고침 없이 선명도와 레이아웃을 확인한다.
5. 되돌려도 정상인지 확인한다.

자동화가 불가능하므로 접근 가능한 환경이 없으면 `BLOCKED — 다중 모니터 환경 없음`으로 기록한다.

**PASS / FAIL**

- PASS: 모니터 이동 후 Canvas가 새 DPR로 재렌더되고, 레이아웃과 이미지 선명도가 유지된다.
- FAIL: Canvas 흐림 지속(S2), 레이아웃 어긋남(S2), 오류 발생(S1).

**FIX** — D-DPI-04의 DPR 구독 패턴을 적용한다.

---

### D-WIN-04 — 브라우저 UI 변화와 뷰포트

**WHY**
사용자가 개발자 도구를 열거나(하단/우측 도킹), 확장 프로그램 사이드 패널을 열거나, 북마크 바를 토글하면 뷰포트가 즉시 변한다. 특히 개발자 도구 우측 도킹은 폭을 30~50% 줄여 예상치 못한 breakpoint로 진입시킨다. 이 상태에서 레이아웃이 깨지면 개발·QA 과정에서 잘못된 판단을 유발한다.

**REPRODUCE**

1. 앱을 1920 폭에서 연다.
2. 개발자 도구를 우측에 도킹하고 폭을 조절한다.
3. 하단 도킹으로 전환해 높이를 줄인다.
4. 각 상태에서 레이아웃과 고정 UI를 확인한다.
5. 북마크 바를 토글해 높이 변화에 대응하는지 확인한다.

**PASS / FAIL**

- PASS: 모든 중간 폭/높이에서 D-VP-01과 D-VP-02 기준을 만족한다.
- FAIL: 특정 중간 상태에서만 깨짐. 이는 반응형 정책의 구멍을 뜻하므로 S2.

**FIX** — 별도 처리가 아니라 D-VP-04(경계 폭 검사) 범위를 넓힌다. 브라우저 UI 변화는 결국 뷰포트 변화이므로 연속 폭 검사로 커버된다.

---

### D-WIN-05 — 새 탭·팝업·외부 링크

**WHY**
`target="_blank"`에 `rel="noopener"`가 없으면 열린 페이지가 `window.opener`로 원본 창을 조작할 수 있어 보안 위험이다(최신 브라우저는 기본 적용하지만 명시가 안전하다). 또 새 탭으로 열린다는 사실을 알리지 않으면 스크린리더 사용자와 키보드 사용자가 맥락을 잃는다. 결제·OAuth 팝업이 차단되면 플로우가 조용히 멈춘다.

**DETECT**

```bash
rg -n "target=\"_blank\"" src --glob "*.tsx" | rg -v "rel="
rg -n "window\.open" src -A3
rg -n "rel=\"noopener|noreferrer\"" src | wc -l
```

**REPRODUCE**

```ts
test('외부 링크가 안전하고 명시적이다', async ({ page }) => {
  await page.goto('/');
  const external = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')]
      .map(a => ({
        href: a.href,
        rel: a.rel,
        hasHint: /새 창|새 탭|external|opens in new/i.test(
          a.textContent + (a.getAttribute('aria-label') ?? '')),
      })));

  const unsafe = external.filter(e => !e.rel.includes('noopener'));
  expect(unsafe, `rel=noopener 누락: ${JSON.stringify(unsafe)}`).toEqual([]);

  const unlabeled = external.filter(e => !e.hasHint);
  expect(unlabeled.length, '새 탭 안내 없는 링크').toBe(0);
});

test('팝업 차단 시 대체 경로가 있다', async ({ page }) => {
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto('/settings/billing');
  await page.getByRole('button', { name: '결제 관리' }).click();
  await expect(page.getByText(/팝업이 차단|새 창에서 열기/)).toBeVisible();
});
```

**PASS / FAIL**

- PASS: 모든 `target="_blank"`에 `rel="noopener noreferrer"`가 있다. 새 탭 열림이 텍스트 또는 아이콘+`sr-only`로 안내된다. 팝업 차단 시 대체 안내가 나타난다.
- FAIL: `noopener` 누락(S2 — 보안), 새 탭 안내 없음(S3), 팝업 차단 시 무반응(**S1** — 결제 중단).

**FIX**

```tsx
// ✅ 안전하고 명시적인 외부 링크
<a
  href={externalUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1 underline"
>
  API 문서
  <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
  <span className="sr-only">(새 탭에서 열림)</span>
</a>
```

```ts
// ✅ 팝업 차단 감지 후 대체 경로
function openBillingPortal(url: string) {
  const win = window.open(url, '_blank', 'noopener');
  if (!win || win.closed) {
    setBlockedUrl(url); // "여기를 클릭해 새 창에서 열기" 링크 표시
  }
}
```

---

## 20. Desktop Performance

데스크톱은 CPU와 네트워크가 빠르지만 **DOM과 데이터가 크다.** 모바일과 반대 방향의 문제를 갖는다. 3,000행 테이블, 12개 차트, 무한 스크롤 목록, 하루 종일 열려 있는 탭이 데스크톱 성능 문제의 전형이다.

### 20.1 Desktop 성능 예산

| 지표 | 목표 | 측정 조건 |
|------|------|-----------|
| LCP | ≤ 2.0s | 프로덕션 빌드, Fast 3G 없이 기본 네트워크, CPU 4x 스로틀 |
| INP | ≤ 200ms | 대시보드·테이블에서 실제 조작 |
| CLS | ≤ 0.1 | 초기 로드 + 사이드바 토글 + 데이터 갱신 |
| DOM 노드 수 | ≤ 3,000 | 최대 데이터 상태 |
| 메인 스레드 롱태스크 | 없음 (>200ms) | 상호작용 중 |
| JS 힙 증가 | 30분 세션에서 +50% 이하 | 반복 조작 후 |

**측정은 반드시 프로덕션 빌드에서 한다.** 개발 모드는 소스맵·HMR·React Strict Mode 이중 렌더 때문에 수치가 완전히 다르다.

```bash
pnpm build && pnpm start
# 별도 터미널에서
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm playwright test tests/desktop/perf.spec.ts
```

### D-PERF-01 — 대형 DOM과 렌더 비용

**WHY**
데스크톱은 화면이 넓어 한 번에 많은 요소를 렌더한다. 100행 × 12열 테이블은 셀만 1,200개이고, 각 셀에 버튼·배지·툴팁이 있으면 노드 수가 5,000을 넘는다. 브라우저의 스타일 계산과 레이아웃 비용은 노드 수에 비례하므로, 이 상태에서 한 셀만 바뀌어도 전체 재계산이 발생할 수 있다.

**DETECT**

```bash
rg -n "\.map\(" src --glob "*table*" --glob "*list*" | wc -l
rg -n "pageSize|limit|take" src | rg -o "(pageSize|limit|take)[:= ]+[0-9]+" | sort | uniq -c
rg -n "virtual|useVirtualizer|react-window|react-virtual" src
```

**REPRODUCE**

```ts
test('최대 데이터 상태에서 DOM 노드 수가 예산 안에 있다', async ({ page }) => {
  await page.goto('/settings/members?pageSize=100');
  await page.waitForLoadState('networkidle');

  const stats = await page.evaluate(() => ({
    nodes: document.querySelectorAll('*').length,
    depth: (function maxDepth(el: Element, d = 0): number {
      let m = d;
      for (const c of el.children) m = Math.max(m, maxDepth(c, d + 1));
      return m;
    })(document.body),
    listeners: (performance as any).eventCounts?.size ?? -1,
  }));

  expect(stats.nodes, `DOM 노드 ${stats.nodes}개`).toBeLessThanOrEqual(3000);
  expect(stats.depth, `DOM 깊이 ${stats.depth}`).toBeLessThanOrEqual(32);
});
```

렌더 비용을 직접 측정한다.

```ts
const timing = await page.evaluate(async () => {
  const t0 = performance.now();
  document.getElementById('sort-name')!.click();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return performance.now() - t0;
});
expect(timing).toBeLessThan(200);
```

**PASS / FAIL**

- PASS: 최대 데이터 상태에서 노드 3,000개 이하, 깊이 32 이하. 정렬·필터 조작이 200ms 내에 반영된다.
- FAIL: 노드 5,000개 초과(S2), 조작 반응 500ms 초과(S2), 1초 초과(S1).

**FIX**

- 페이지네이션을 기본으로 하고, 무한 스크롤이 필요하면 가상화를 함께 쓴다.
- 셀 내부 컴포넌트를 단순화한다. 각 셀의 툴팁·드롭다운은 필요할 때만 마운트한다.
- 래퍼 `div` 중첩을 줄인다. 깊이가 깊으면 스타일 계산 비용이 커진다.

**BAD**

```tsx
// ❌ 모든 셀에 항상 마운트된 툴팁 → 노드 수 3배
<td>
  <Tooltip>
    <TooltipTrigger asChild><span>{value}</span></TooltipTrigger>
    <TooltipContent>{value}</TooltipContent>
  </Tooltip>
</td>
```

**GOOD**

```tsx
// ✅ 잘린 경우에만 툴팁 마운트 (D-TIP-05)
<td><TruncatedCell>{value}</TruncatedCell></td>
```

---

### D-PERF-02 — INP와 상호작용 지연

**WHY**
데스크톱에서 INP가 나쁜 전형적 원인은 대형 목록의 필터링을 입력 이벤트마다 동기 실행하는 것이다. 3,000개 항목을 매 키 입력마다 필터링하고 리렌더하면 각 입력이 300~800ms 지연되어 타이핑이 밀린다. 사용자는 "느리다"가 아니라 "고장났다"고 느낀다.

**DETECT**

```bash
rg -n "onChange" src --glob "*.tsx" -A5 | rg "filter\(|sort\(|map\("
rg -n "useDeferredValue|useTransition|startTransition" src
rg -n "useMemo" src --glob "*table*" | wc -l
```

**REPRODUCE**

```ts
test('대형 목록 필터링의 INP가 예산 안에 있다', async ({ page }) => {
  await page.goto('/settings/members?pageSize=500');
  await page.waitForLoadState('networkidle');

  // CPU 스로틀로 저사양 데스크톱 근사
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.evaluate(() => {
    (window as any).__inp = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as any[]) {
        (window as any).__inp = Math.max((window as any).__inp, e.duration);
      }
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as any);
  });

  const input = page.getByLabel('멤버 검색');
  await input.click();
  for (const ch of '김민준입니다') {
    await page.keyboard.type(ch, { delay: 60 });
  }
  await page.waitForTimeout(600);

  const inp = await page.evaluate(() => (window as any).__inp);
  expect(inp, `최대 상호작용 지연 ${Math.round(inp)}ms`).toBeLessThanOrEqual(200);

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});
```

**PASS / FAIL**

- PASS: CPU 4x 스로틀 조건에서 최대 상호작용 지연 200ms 이하. 타이핑이 밀리지 않는다.
- FAIL: 200~500ms(S2), 500ms 초과(S1).

**FIX**

```tsx
// ✅ 입력은 즉시 반영, 무거운 목록은 지연 계산
function MemberSearch({ members }: { members: Member[] }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const filtered = useMemo(
    () => members.filter(m => m.name.includes(deferredQuery) || m.email.includes(deferredQuery)),
    [members, deferredQuery],
  );

  return (
    <>
      <input
        value={query}                       // 즉시 반영 → 타이핑 지연 없음
        onChange={e => setQuery(e.target.value)}
        aria-label="멤버 검색"
        aria-describedby="search-status"
      />
      <p id="search-status" role="status" aria-live="polite" className="sr-only">
        {`${filtered.length}명 검색됨`}
      </p>
      <div className={cn('transition-opacity', isStale && 'opacity-60')}>
        <MemberTable rows={filtered} />
      </div>
    </>
  );
}
```

`useDeferredValue`는 입력 자체를 우선 처리하고 무거운 렌더를 양보한다. 서버 필터링이라면 디바운스 + `AbortController`로 이전 요청을 취소한다.

---

### D-PERF-03 — 가상화 도입 기준과 함정

**WHY**
가상화는 강력하지만 접근성과 기능을 쉽게 망가뜨린다. DOM에 없는 행은 Ctrl+F로 찾을 수 없고, 스크린리더가 전체 개수를 알 수 없으며, 인쇄 시 일부만 출력되고, 키보드 포커스가 스크롤 밖으로 나가면 요소가 언마운트되어 포커스를 잃는다. **필요할 때만** 쓴다.

**도입 기준**

| 항목 수 | 권장 |
|---------|------|
| ~200 | 그냥 렌더 |
| 200~1,000 | 페이지네이션 |
| 1,000+ (스크롤 필수) | 가상화 + 접근성 보완 |

**DETECT**

```bash
rg -n "useVirtualizer|FixedSizeList|VariableSizeList|react-window|@tanstack/react-virtual" src
rg -n "aria-rowcount|aria-rowindex|aria-setsize|aria-posinset" src
```

가상화를 쓰면서 `aria-rowcount`가 없으면 결함이다.

**REPRODUCE**

```ts
test('가상 목록이 접근성 정보를 유지한다', async ({ page }) => {
  await page.goto('/logs');
  const grid = page.getByRole('grid');

  // 전체 개수를 알려야 한다
  const rowCount = await grid.getAttribute('aria-rowcount');
  expect(Number(rowCount)).toBeGreaterThan(1000);

  // 각 행이 전체 기준 인덱스를 갖는다
  const firstIndex = await page.getByRole('row').nth(1).getAttribute('aria-rowindex');
  expect(Number(firstIndex)).toBeGreaterThanOrEqual(1);

  // 키보드로 아래로 이동해도 포커스를 잃지 않는다
  await page.getByRole('row').nth(1).getByRole('gridcell').first().focus();
  for (let i = 0; i < 60; i++) await page.keyboard.press('ArrowDown');

  const stillFocused = await page.evaluate(() =>
    document.activeElement !== document.body && document.activeElement !== null);
  expect(stillFocused, '스크롤 중 포커스 상실').toBe(true);
});
```

**PASS / FAIL**

- PASS: `aria-rowcount`/`aria-rowindex`가 전체 데이터 기준으로 설정된다. 키보드 이동 시 포커스가 유지된다. 검색 기능이 별도로 제공된다(Ctrl+F 대체). 인쇄·내보내기 경로가 있다.
- FAIL: 접근성 속성 없음(S2), 스크롤 중 포커스 상실(S2), 데이터 접근 수단 없음(S2).

**FIX**

```tsx
// ✅ 가상 그리드의 접근성 보완
<div
  role="grid"
  aria-rowcount={totalCount}
  aria-label="로그 목록"
  ref={parentRef}
  className="h-[600px] overflow-auto"
>
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
    {virtualizer.getVirtualItems().map(v => (
      <div
        key={v.key}
        role="row"
        aria-rowindex={v.index + 1}   // 1-based, 전체 기준
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%',
          height: v.size, transform: `translateY(${v.start}px)`,
        }}
      >
        <span role="gridcell" tabIndex={-1}>{rows[v.index].message}</span>
      </div>
    ))}
  </div>
</div>
```

가상화된 목록에는 반드시 자체 검색/필터를 제공한다. 브라우저 기본 찾기가 동작하지 않기 때문이다.

---

### D-PERF-04 — 장시간 세션의 메모리 누수

**WHY**
데스크톱 사용자는 SaaS 탭을 하루 종일 열어 둔다. 30초 폴링, 라우트 전환, 모달 열고 닫기가 수백 번 반복된다. `useEffect` 정리 누락, 해제되지 않은 `ResizeObserver`/`IntersectionObserver`, 제거되지 않은 전역 리스너, 취소되지 않은 `setInterval`이 쌓이면 힙이 계속 증가하고 결국 탭이 느려지거나 크래시한다.

**DETECT**

```bash
rg -n "addEventListener" src --glob "*.tsx" -A8 | rg -B8 "removeEventListener" -c
rg -n "setInterval|setTimeout" src --glob "*.tsx" -A6 | rg -v "clearInterval|clearTimeout"
rg -n "new (ResizeObserver|IntersectionObserver|MutationObserver)" src -A8 | rg -v "disconnect"
rg -n "useEffect\(\(\) => \{" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('반복 조작 후 메모리가 과도하게 증가하지 않는다', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const measure = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: '(performance as any).memory.usedJSHeapSize',
      returnByValue: true,
    });
    return result.value as number;
  };

  const baseline = await measure();

  // 라우트 전환 + 모달 개폐 30회
  for (let i = 0; i < 30; i++) {
    await page.getByRole('link', { name: '설정' }).click();
    await page.waitForURL('**/settings**');
    await page.getByRole('button', { name: '멤버 초대' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: '대시보드' }).click();
    await page.waitForURL('**/dashboard**');
  }

  const after = await measure();
  const growth = (after - baseline) / baseline;
  expect(growth, `힙 증가율 ${(growth * 100).toFixed(1)}%`).toBeLessThan(0.5);

  // 리스너·타이머 잔류 확인
  const leaks = await page.evaluate(() => ({
    intervals: (window as any).__activeIntervals ?? -1,
    observers: (window as any).__activeObservers ?? -1,
  }));
  console.log('leak counters', leaks);
});
```

개발 환경에서 카운터를 노출하면 진단이 쉬워진다.

```ts
// dev 전용 계측
if (process.env.NODE_ENV !== 'production') {
  const origSetInterval = window.setInterval;
  (window as any).__activeIntervals = 0;
  window.setInterval = ((...args: any[]) => {
    (window as any).__activeIntervals++;
    return origSetInterval(...(args as [any, any]));
  }) as any;
  const origClear = window.clearInterval;
  window.clearInterval = ((id: any) => {
    (window as any).__activeIntervals--;
    return origClear(id);
  }) as any;
}
```

**PASS / FAIL**

- PASS: 30회 반복 후 힙 증가율 50% 미만. 타이머·옵저버 잔류 없음. DOM 노드 수가 초기값으로 돌아온다.
- FAIL: 힙 증가율 100% 초과(S2), 지속 증가로 탭 크래시(S1).

**FIX**

```ts
// ✅ 모든 구독에 정리 함수
useEffect(() => {
  const controller = new AbortController();

  window.addEventListener('resize', onResize, { signal: controller.signal });
  document.addEventListener('keydown', onKeyDown, { signal: controller.signal });

  const id = window.setInterval(poll, 30_000);
  const ro = new ResizeObserver(onResize);
  ro.observe(el);

  return () => {
    controller.abort();     // 리스너 일괄 해제
    window.clearInterval(id);
    ro.disconnect();
  };
}, [onResize, onKeyDown, poll]);
```

`AbortSignal`을 `addEventListener`에 넘기면 여러 리스너를 한 번에 정리할 수 있어 누락 위험이 크게 줄어든다.

---

### D-PERF-05 — 번들과 초기 로드

**WHY**
데스크톱은 네트워크가 빠르다는 이유로 번들 크기를 방치하기 쉽다. 그러나 (a) 회사 네트워크는 프록시·VPN으로 느릴 수 있고, (b) JS는 다운로드보다 파싱·실행 비용이 크며, (c) 대시보드에 차트 라이브러리 3종이 모두 포함되면 초기 실행에 수백 ms가 든다. 데스크톱에서도 코드 분할은 유효하다.

**DETECT**

```bash
pnpm build
rg -n "next/dynamic|React.lazy" src | wc -l
rg -n "^import .* from 'recharts'|from 'chart.js'|from 'echarts'|from 'monaco-editor'" src
rg -n "import \* as" src | head -20
```

`import * as`는 트리 셰이킹을 방해할 수 있다.

**REPRODUCE**

```bash
# Next.js 빌드 출력의 First Load JS 확인
pnpm build | rg -A40 "Route \(app\)"

# 번들 분석
ANALYZE=true pnpm build
```

```ts
test('초기 JS 전송량이 예산 안에 있다', async ({ page }) => {
  let jsBytes = 0;
  page.on('response', async res => {
    if (res.url().endsWith('.js') && res.status() === 200) {
      const buf = await res.body().catch(() => null);
      if (buf) jsBytes += buf.length;
    }
  });
  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  expect(jsBytes / 1024, `초기 JS ${Math.round(jsBytes / 1024)}KB`).toBeLessThan(400);
});
```

**PASS / FAIL**

- PASS: 주요 라우트의 First Load JS가 프로젝트 예산(권장 250KB gzip) 이내. 차트·에디터·PDF 등 무거운 의존성이 동적 임포트로 분리된다.
- FAIL: 예산 30% 초과(S3), 100% 초과(S2).

**FIX**

```tsx
// ✅ 무거운 위젯은 지연 로드 + 자리 확보
const RevenueChart = dynamic(() => import('@/components/charts/revenue-chart'), {
  ssr: false,
  loading: () => <div className="h-60 animate-pulse rounded bg-muted" />,
});

const CodeEditor = dynamic(() => import('@/components/code-editor'), { ssr: false });
```

`loading` 스켈레톤 높이를 실제 컴포넌트와 맞춰야 CLS가 발생하지 않는다.

---

## 21. Desktop Accessibility

10장(Keyboard/Focus)과 중복되지 않는 데스크톱 고유 항목을 다룬다.

### D-A11Y-01 — 자동 검사(axe) 통합

**WHY**
자동 검사는 접근성 문제의 30~40%만 잡지만, 그 30%는 대비 부족·라벨 누락·중복 ID·잘못된 ARIA처럼 기계적으로 확실히 판정 가능한 것들이다. 사람의 시간을 나머지 60%(키보드 흐름, 논리적 순서, 대체 텍스트 품질)에 쓰기 위해 자동화가 필요하다.

**DETECT**

```bash
rg -n "@axe-core/playwright|axe-core" package.json
ls tests/**/a11y*.spec.ts 2>/dev/null
```

**REPRODUCE**

```ts
// tests/desktop/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/dashboard', '/settings/members', '/settings/billing', '/pricing'];
const WIDTHS = [1024, 1440, 1920];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`axe: ${route} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const violations = results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map(n => n.html.slice(0, 120)),
      }));

      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
}
```

오버레이가 열린 상태도 반드시 검사한다. 닫힌 상태만 검사하면 모달·드롭다운의 문제를 전부 놓친다.

```ts
test('axe: 모달 열린 상태', async ({ page }) => {
  await page.goto('/settings/members');
  await page.getByRole('button', { name: '멤버 초대' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 모든 P0 라우트와 주요 오버레이 상태에서 critical/serious 위반 0건.
- FAIL: critical 위반(S1), serious 위반(S2), moderate 위반(S3).

**FIX** — 위반 ID별로 대응한다. 자주 나오는 것들.

| axe 규칙 | 원인 | 수정 |
|----------|------|------|
| `color-contrast` | 대비 4.5:1 미달 | 디자인 토큰 조정. 임의로 색만 바꾸지 말고 팔레트에서 해결 |
| `button-name` | 아이콘 버튼에 이름 없음 | `aria-label` 추가 (D-TIP-03) |
| `aria-required-children` | `role="list"` 안에 `li` 아님 | 구조 수정 또는 role 제거 |
| `duplicate-id-aria` | `useId` 미사용 | `useId()`로 생성 |
| `landmark-unique` | 라벨 없는 중복 nav | `aria-label` 부여 (D-KEY-06) |
| `nested-interactive` | 버튼 안 버튼 | 구조 분리 |

---

### D-A11Y-02 — Windows 고대비 모드 (forced-colors)

**WHY**
Windows 고대비 모드는 저시력 사용자가 실제로 쓰는 기능이다. 이 모드에서 브라우저는 사용자가 지정한 색 팔레트로 모든 색을 강제 교체한다. 그 결과 (a) `background-image`로 그린 아이콘이 사라지고, (b) 배경색으로만 구분하던 상태(선택됨, 활성)가 구별되지 않고, (c) `box-shadow`로 만든 경계선이 사라져 카드 구분이 없어지고, (d) 투명 배경 버튼이 배경과 동일해진다.

**DETECT**

```bash
rg -n "forced-colors|@media \(forced-colors" src --glob "*.css" --glob "*.tsx"
rg -n "background-image.*svg|bg-\[url\(" src
rg -n "box-shadow" src --glob "*.css" | rg -i "border|outline"
rg -n "outline-none" src
```

**REPRODUCE**

```ts
test('강제 색상 모드에서 UI가 식별 가능하다', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  await expect(page).toHaveScreenshot('forced-colors-dashboard.png');

  // 아이콘이 사라지지 않았는지 (SVG는 유지, background-image는 소실)
  const bgImageIcons = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('*')]
      .filter(el => {
        const bg = getComputedStyle(el).backgroundImage;
        return bg !== 'none' && /url\(/.test(bg) && el.offsetParent !== null;
      })
      .map(el => String(el.className).slice(0, 80)));
  expect(bgImageIcons, `background-image 아이콘은 고대비에서 사라짐: ${JSON.stringify(bgImageIcons)}`)
    .toEqual([]);

  // 선택 상태 구분: 배경색 외 단서 필요
  const activeItem = page.getByRole('link', { current: 'page' });
  const hasNonColorCue = await activeItem.evaluate(el => {
    const cs = getComputedStyle(el);
    return cs.borderLeftWidth !== '0px' || cs.outlineStyle !== 'none' || cs.fontWeight >= '600';
  });
  expect(hasNonColorCue, '활성 상태가 색상으로만 표현됨').toBe(true);
});
```

**PASS / FAIL**

- PASS: 고대비 모드에서 모든 아이콘·경계선·포커스 링·상태 구분이 보인다. 스크린샷 검토에서 사라진 요소가 없다.
- FAIL: 아이콘 소실(S2), 경계선 소실로 구조 파악 불가(S2), 포커스 링 소실(S1).

**FIX**

```css
/* ✅ 강제 색상 모드 대응 */
@media (forced-colors: active) {
  /* 포커스 링을 시스템 색으로 */
  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  /* box-shadow 경계선을 실제 border로 대체 */
  .card,
  .dropdown-content,
  .dialog-content {
    border: 1px solid CanvasText;
  }

  /* 활성 상태를 색 외 단서로 */
  [aria-current='page'] {
    border-left: 3px solid Highlight;
    font-weight: 600;
  }

  /* 시스템 색상 강제 적용을 허용해야 하는 요소 */
  .status-badge {
    forced-color-adjust: auto;
  }

  /* 브랜드 색이 반드시 필요한 곳만 예외 (신중히) */
  .brand-logo {
    forced-color-adjust: none;
  }
}
```

아이콘은 `background-image`가 아니라 인라인 SVG로 렌더하고 `fill="currentColor"`를 쓴다. 고대비 모드에서 `currentColor`는 시스템 텍스트 색으로 교체되어 자동으로 보인다.

---

### D-A11Y-03 — 축소 모션과 애니메이션

**WHY**
전정 장애가 있는 사용자에게 큰 이동·확대·시차 효과는 어지러움과 메스꺼움을 유발한다. 데스크톱은 화면이 커서 같은 애니메이션도 시야에서 차지하는 비율이 크므로 영향이 더 강하다. `prefers-reduced-motion`을 무시하면 일부 사용자는 앱을 물리적으로 사용할 수 없다.

**DETECT**

```bash
rg -n "prefers-reduced-motion|motion-reduce:|motion-safe:" src | wc -l
rg -n "animate-|transition-|framer-motion|@keyframes" src | wc -l
rg -n "autoPlay|loop" src --glob "*.tsx"
```

애니메이션 사용처 대비 `motion-reduce:` 대응이 현저히 적으면 결함이다.

**REPRODUCE**

```ts
test('축소 모션 설정을 존중한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dashboard');

  const animated = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('*')]
      .filter(el => el.offsetParent !== null)
      .map(el => {
        const cs = getComputedStyle(el);
        return {
          className: String(el.className).slice(0, 60),
          animationDuration: cs.animationDuration,
          transitionDuration: cs.transitionDuration,
        };
      })
      .filter(x =>
        (parseFloat(x.animationDuration) > 0.15 && x.animationDuration !== '0s') ||
        parseFloat(x.transitionDuration) > 0.15));

  // 로딩 스피너 등 필수 애니메이션은 예외 허용 목록으로 관리
  const unexpected = animated.filter(a => !/spinner|loading|skeleton/.test(a.className));
  expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);

  // 자동 재생 캐러셀 정지
  await expect(page.getByTestId('hero-carousel')).toHaveAttribute('data-autoplay', 'false');
});
```

**PASS / FAIL**

- PASS: 축소 모션에서 장식 애니메이션이 제거되거나 150ms 이하로 축소된다. 자동 재생·시차 효과·자동 캐러셀이 정지된다. 상태 전달에 필요한 최소 전환(opacity)은 유지 가능하다.
- FAIL: 애니메이션 그대로 재생(S2), 자동 재생 지속(S2).

**FIX**

```css
/* ✅ 전역 안전망 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// ✅ JS 애니메이션도 설정을 읽는다
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
/>
```

전역 `!important` 안전망은 최후 수단이며, 개별 컴포넌트에서 `motion-reduce:` 유틸리티로 의도를 표현하는 편이 낫다.

---

### D-A11Y-04 — 스크린리더 수동 검증

**WHY**
자동 검사는 "라벨이 있다"는 확인할 수 있지만 "라벨이 유용한가"는 판단할 수 없다. 데스크톱 스크린리더(NVDA + Firefox/Chrome, JAWS + Chrome, VoiceOver + Safari)는 브라우징 모드와 포커스 모드를 오가며, 이 전환이 복합 위젯에서 자주 실패한다. 수동 검증이 필요한 영역이다.

**검증 시나리오** (환경마다 최소 1회)

```markdown
[ ] 페이지 진입 시 제목이 읽히고 맥락을 파악할 수 있다
[ ] 랜드마크 목록(NVDA: D, VO: 로터)으로 주요 영역을 이동할 수 있다
[ ] 제목 목록(NVDA: H)이 논리적 계층(h1 → h2 → h3)을 이룬다
[ ] 링크 목록에서 링크 텍스트만으로 목적지를 알 수 있다 ("여기 클릭" 금지)
[ ] 폼 필드가 라벨·필수 여부·형식 요구·오류를 모두 읽는다
[ ] 오류 발생 시 aria-live로 즉시 전달된다
[ ] 테이블에서 셀 이동 시 열/행 헤더가 함께 읽힌다
[ ] 모달 열림이 announce되고 제목이 읽힌다
[ ] 드롭다운 열림·항목 수·현재 선택이 읽힌다
[ ] 로딩 완료와 데이터 갱신이 announce된다
[ ] 이미지 대체 텍스트가 맥락에 맞다 (장식 이미지는 alt="")
```

**부분 자동화** — 접근성 트리 스냅샷으로 명백한 문제를 사전 제거한다.

```ts
test('접근성 트리에 이름 없는 인터랙티브 요소가 없다', async ({ page }) => {
  await page.goto('/dashboard');
  const snapshot = await page.accessibility.snapshot({ interestingOnly: true });

  const unnamed: string[] = [];
  (function walk(node: any) {
    if (!node) return;
    const needsName = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'tab', 'menuitem'];
    if (needsName.includes(node.role) && !node.name?.trim()) {
      unnamed.push(`${node.role} (${JSON.stringify(node).slice(0, 100)})`);
    }
    (node.children ?? []).forEach(walk);
  })(snapshot);

  expect(unnamed, JSON.stringify(unnamed, null, 2)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 최소 1개 스크린리더 조합에서 위 시나리오 전부 통과.
- FAIL: 조작 불가 위젯(S1), 맥락 없는 라벨(S2). 환경이 없으면 `BLOCKED — 스크린리더 환경 없음`.

---

### D-A11Y-05 — 색상 대비와 비텍스트 대비

**WHY**
데스크톱 모니터는 밝기·색온도·패널 품질 편차가 크고, 사무실 조명 환경도 다양하다. 디자이너의 캘리브레이션된 모니터에서 충분해 보이는 대비가 저가 TN 패널에서는 읽히지 않는다. 텍스트 4.5:1(WCAG 1.4.3)뿐 아니라 UI 컴포넌트와 그래픽 객체도 3:1(1.4.11)이 필요하다.

**DETECT**

```bash
rg -n "text-(gray|slate|zinc|neutral)-(300|400)" src --glob "*.tsx"
rg -n "opacity-(40|50|60)" src --glob "*.tsx" | rg -i "text|label"
rg -n "border-(gray|slate)-(100|200)" src
```

**REPRODUCE**

axe의 `color-contrast` 규칙이 텍스트를 커버한다. 비텍스트 대비는 별도 확인이 필요하다.

```ts
test('UI 컴포넌트 경계 대비가 3:1 이상이다', async ({ page }) => {
  await page.goto('/settings/members');

  const lowContrast = await page.evaluate(() => {
    function luminance(rgb: string) {
      const [r, g, b] = rgb.match(/\d+/g)!.slice(0, 3).map(Number).map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function ratio(a: string, b: string) {
      const la = luminance(a), lb = luminance(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }

    return [...document.querySelectorAll<HTMLElement>('input, select, textarea, button, [role="checkbox"]')]
      .filter(el => el.offsetParent !== null)
      .map(el => {
        const cs = getComputedStyle(el);
        const parentBg = getComputedStyle(el.parentElement!).backgroundColor;
        const border = cs.borderColor;
        return {
          tag: el.tagName,
          label: (el.getAttribute('aria-label') ?? '').slice(0, 30),
          ratio: +ratio(border, parentBg).toFixed(2),
        };
      })
      .filter(x => x.ratio < 3 && x.ratio > 0);
  });

  expect(lowContrast, JSON.stringify(lowContrast, null, 2)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 본문 텍스트 4.5:1, 큰 텍스트(18.66px bold 또는 24px) 3:1, UI 컴포넌트 경계·아이콘·차트 요소 3:1 이상. 라이트·다크 모드 모두.
- FAIL: 본문 대비 미달(S2), 입력 필드 경계 식별 불가(S2), 차트 계열 색 구분 불가(S2).

**FIX**

- 대비 문제는 개별 클래스가 아니라 **디자인 토큰**에서 고친다. `text-muted-foreground` 하나를 조정하면 전체가 해결된다.
- 차트는 색상만으로 계열을 구분하지 않는다. 패턴·선 스타일·직접 라벨을 병용한다.
- placeholder를 라벨 대신 쓰지 않는다. placeholder는 대비가 낮은 것이 정상이므로 필수 정보를 담으면 안 된다.

---

## 22. Cross Browser

### 22.1 검사 대상과 우선순위

| 브라우저 | 엔진 | 우선순위 | 데스크톱 고유 위험 |
|----------|------|----------|--------------------|
| Chrome | Blink | P0 | 기준 브라우저. 여기서만 테스트하면 나머지가 전부 위험 |
| Edge | Blink | P0 | 기업 환경 기본. IE 모드, 스크롤바, 폼 자동완성 UI 차이 |
| Safari | WebKit | P0 | 가장 많은 차이. sticky, backdrop-filter, `:has()`, date input, 폰트 렌더링 |
| Firefox | Gecko | P1 | 스크롤바 폭, 폼 컨트롤 렌더링, 텍스트 전용 확대, `scrollbar-width` |

### D-XB-01 — 엔진별 렌더 차이

**WHY**
Playwright의 WebKit은 실제 Safari와 다르지만 대부분의 CSS 차이는 잡아낸다. 크로스 브라우저 검사를 생략하면 Safari 사용자에게만 발생하는 레이아웃 붕괴를 배포 후에 발견하게 된다. 특히 macOS 사용자 비중이 높은 SaaS에서는 치명적이다.

**DETECT**

```bash
# 지원 편차가 큰 기능
rg -n ":has\(|@container|:is\(|:where\(" src --glob "*.css" --glob "*.tsx"
rg -n "backdrop-blur|backdrop-filter" src
rg -n "aspect-ratio|gap:" src --glob "*.css"
rg -n "scrollbar-gutter|scrollbar-width|::-webkit-scrollbar" src
rg -n "type=\"(date|time|datetime-local|color|range)\"" src
rg -n "text-wrap: balance|text-wrap-balance" src
```

**REPRODUCE**

```ts
// playwright.config.ts
projects: [
  { name: 'chromium-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  { name: 'chromium-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  { name: 'firefox-1440',  use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
  { name: 'webkit-1440',   use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  { name: 'edge-1440',     use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } } },
],
```

```bash
pnpm playwright test --project=chromium-1440 --project=firefox-1440 --project=webkit-1440
```

**PASS / FAIL**

- PASS: P0 라우트가 3개 이상 엔진에서 기능적으로 동일하게 동작한다. 시각 차이는 렌더링 수준(폰트 안티에일리어싱, 스크롤바 폭)에 그친다.
- FAIL: 특정 엔진에서 레이아웃 붕괴(S1), 기능 미작동(S1), 눈에 띄는 시각 불일치(S2).

**FIX** — 브라우저별 분기(`@supports` 제외)를 늘리지 말고 공통으로 안전한 구현을 택한다.

```css
/* ✅ 지원 여부로 점진 향상 */
.panel {
  background: hsl(var(--popover));
}

@supports (backdrop-filter: blur(8px)) {
  .panel {
    background: hsl(var(--popover) / 0.85);
    backdrop-filter: blur(8px);
  }
}
```

---

### D-XB-02 — 스크롤바 스타일과 폼 컨트롤

**WHY**
Firefox는 `scrollbar-width`/`scrollbar-color`를, Chromium/WebKit은 `::-webkit-scrollbar`를 쓴다. 한쪽만 구현하면 나머지 브라우저에서 기본 스크롤바가 나와 디자인이 어긋난다. 또 `<select>`, `<input type="date">`, 체크박스·라디오의 네이티브 렌더링은 엔진마다 크게 다르다. 높이를 고정하면 어느 한쪽에서 반드시 잘린다.

**DETECT**

```bash
rg -n "::-webkit-scrollbar" src --glob "*.css"
rg -n "scrollbar-width|scrollbar-color" src --glob "*.css"
rg -n "appearance-none|appearance: none" src
rg -n "h-10.*select|select.*h-10" src
```

**REPRODUCE**

```ts
test('폼 컨트롤이 엔진과 무관하게 잘리지 않는다', async ({ page }) => {
  await page.goto('/settings/profile');

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('select, input, textarea')]
      .filter(el => el.offsetParent !== null)
      .filter(el => el.scrollHeight > el.clientHeight + 2)
      .map(el => ({
        tag: el.tagName,
        type: (el as HTMLInputElement).type,
        clientH: el.clientHeight,
        scrollH: el.scrollHeight,
      })));

  expect(clipped, JSON.stringify(clipped)).toEqual([]);
});
```

각 프로젝트(chromium/firefox/webkit)에서 스크린샷을 비교한다.

**PASS / FAIL**

- PASS: 스크롤바 스타일이 두 문법 모두로 정의되거나 기본값을 그대로 쓴다. 폼 컨트롤이 어느 엔진에서도 잘리지 않고 대비 3:1 이상이다.
- FAIL: 특정 엔진에서 스크롤바가 디자인과 불일치(S3), 폼 컨트롤 텍스트 잘림(S2).

**FIX**

```css
/* ✅ 두 문법을 모두 제공 */
.custom-scroll {
  scrollbar-width: thin;                                   /* Firefox */
  scrollbar-color: hsl(var(--border)) transparent;
}

.custom-scroll::-webkit-scrollbar {                        /* Chromium, WebKit */
  width: 10px;
  height: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
```

```tsx
// ✅ 고정 높이 대신 최소 높이 + 패딩
<select className="min-h-10 w-full rounded-md border px-3 py-2 text-sm">
```

---

### D-XB-03 — Safari 고유 이슈

**WHY**
Safari는 데스크톱 브라우저 중 가장 많은 예외를 갖는다. 흔한 것들: (a) `position: sticky`가 `overflow` 조상에서 다르게 동작, (b) `100vh`가 특정 조건에서 다름, (c) `input[type=date]`의 네이티브 UI가 없거나 다름, (d) `gap`이 flexbox에서 구버전 미지원, (e) 폰트 렌더링이 두껍게 보임, (f) `backdrop-filter` 성능 저하, (g) 스크롤 관성으로 인한 좌표 측정 차이.

**DETECT**

```bash
rg -n "100vh|100dvh" src
rg -n "type=\"date\"|type=\"time\"|type=\"datetime-local\"" src
rg -n "-webkit-|@supports (-webkit-" src --glob "*.css"
rg -n "position: sticky|sticky " src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```bash
pnpm playwright test --project=webkit-1440 --reporter=html
```

WebKit 프로젝트에서 다음을 중점 확인한다.

```ts
test.describe('WebKit 중점 검사', () => {
  test.skip(({ browserName }) => browserName !== 'webkit', 'WebKit 전용');

  test('sticky 헤더가 동작한다', async ({ page }) => {
    await page.goto('/settings/members');
    const head = page.locator('thead');
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    await expect(head).toBeInViewport();
  });

  test('날짜 입력이 사용 가능하다', async ({ page }) => {
    await page.goto('/reports');
    const date = page.getByLabel('시작일');
    await date.fill('2026-01-15');
    await expect(date).toHaveValue('2026-01-15');
  });

  test('backdrop-blur 영역이 콘텐츠를 가리지 않는다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page).toHaveScreenshot('webkit-header.png');
  });
});
```

**PASS / FAIL**

- PASS: WebKit 프로젝트에서 P0 테스트 전부 통과. 실기기 Safari에서 스모크 확인 완료.
- FAIL: WebKit 전용 실패(S1~S2). 실기기 접근 불가 시 `BLOCKED — Safari 실기기 없음`을 명시하되 WebKit 자동 테스트는 반드시 수행한다.

**FIX**

- `100vh` 대신 `100dvh`를 쓰되 폴백을 둔다.
- 날짜 입력은 네이티브를 우선하되 형식 안내 텍스트를 함께 제공한다.
- `backdrop-filter`는 `@supports`로 감싸고 폴백 배경을 불투명하게 둔다.

```css
/* ✅ dvh 폴백 */
.full-height {
  min-height: 100vh;
}
@supports (min-height: 100dvh) {
  .full-height { min-height: 100dvh; }
}
```

---

### D-XB-04 — 폰트 렌더링과 텍스트 메트릭

**WHY**
같은 폰트라도 macOS와 Windows의 렌더링 엔진이 달라 실제 텍스트 폭이 3~8% 차이 난다. 버튼 폭을 텍스트에 딱 맞춰 설계하면 한쪽에서 줄바꿈이 생기거나 잘린다. 한글은 특히 폰트 폴백에 따라 폭 차이가 커서, `font-family`에 한글 폰트가 명시되지 않으면 플랫폼별로 다른 글꼴이 적용된다.

**DETECT**

```bash
rg -n "font-family" src --glob "*.css"
rg -n "next/font" src
rg -n "w-\[[0-9]+px\]" src --glob "*.tsx" | rg -i "button|badge|tab"
rg -n "whitespace-nowrap" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('버튼 텍스트가 엔진과 무관하게 한 줄에 들어간다', async ({ page }) => {
  await page.goto('/pricing');
  const wrapped = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, [role="tab"]')]
      .filter(el => el.offsetParent !== null)
      .filter(el => {
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
        return el.clientHeight > lh * 1.8; // 2줄 이상
      })
      .map(el => (el.textContent ?? '').trim().slice(0, 30)));
  expect(wrapped, JSON.stringify(wrapped)).toEqual([]);
});
```

브라우저별 스크린샷을 비교해 텍스트 폭 차이를 확인한다.

**PASS / FAIL**

- PASS: 세 엔진에서 버튼·탭·배지 텍스트가 의도한 줄 수로 표시된다. 폰트 폴백 체인이 한글을 포함한다.
- FAIL: 특정 엔진에서 줄바꿈·잘림(S2), 폰트 폴백 누락으로 글꼴 불일치(S3).

**FIX**

```ts
// ✅ next/font로 폰트를 자체 호스팅 + 폴백 명시
import { Pretendard } from 'next/font/local';

export const sans = Pretendard({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-sans',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
             'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
  adjustFontFallback: false,
});
```

버튼 폭은 고정하지 않고 `min-w-*` + `px-*`로 두어 텍스트 폭 변동을 흡수한다.

---

## 23. Playwright 자동화 전략

### 23.1 프로젝트 구성

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 5_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 데스크톱 QA는 항상 애니메이션을 끄고 결정론적으로
    launchOptions: { args: ['--force-prefers-reduced-motion'] },
  },

  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },

    // 폭 매트릭스 (동일 엔진, 다른 폭)
    ...[1024, 1280, 1366, 1440, 1536, 1920, 2560].map(width => ({
      name: `desktop-${width}`,
      dependencies: ['setup'],
      testMatch: /desktop\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width, height: width <= 1366 ? 720 : 900 },
        storageState: 'tests/.auth/user.json',
      },
    })),

    // 배율 조합
    {
      name: 'scaling-1920x125',
      dependencies: ['setup'],
      testMatch: /desktop\/(viewport|layout)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1536, height: 760 },
        deviceScaleFactor: 1.25,
        storageState: 'tests/.auth/user.json',
      },
    },
    {
      name: 'scaling-1920x150',
      dependencies: ['setup'],
      testMatch: /desktop\/(viewport|layout)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 628 },
        deviceScaleFactor: 1.5,
        storageState: 'tests/.auth/user.json',
      },
    },

    // 크로스 엔진
    { name: 'firefox', dependencies: ['setup'], use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 }, storageState: 'tests/.auth/user.json' } },
    { name: 'webkit',  dependencies: ['setup'], use: { ...devices['Desktop Safari'],  viewport: { width: 1440, height: 900 }, storageState: 'tests/.auth/user.json' } },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
```

### 23.2 공용 픽스처

```ts
// tests/fixtures/desktop.ts
import { test as base, expect, type Page } from '@playwright/test';

type DesktopFixtures = {
  desktopPage: Page;
  noOverflow: (page: Page) => Promise<void>;
  cleanConsole: string[];
};

export const test = base.extend<DesktopFixtures>({
  // 콘솔 오류를 자동 수집하고 테스트 종료 시 검증
  cleanConsole: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    await use(errors);
  },

  desktopPage: async ({ page, cleanConsole }, use) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await use(page);

    const ignorable = [
      /ResizeObserver loop/,
      /Download the React DevTools/,
    ];
    const real = cleanConsole.filter(e => !ignorable.some(re => re.test(e)));
    expect(real, `콘솔 오류:\n${real.join('\n')}`).toEqual([]);
  },

  noOverflow: async ({}, use) => {
    await use(async (page: Page) => {
      const delta = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(delta, `문서 가로 오버플로 ${delta}px`).toBeLessThanOrEqual(1);
    });
  },
});

export { expect };
```

### 23.3 매트릭스 스모크 테스트

```ts
// tests/desktop/matrix.spec.ts
import { test, expect } from '../fixtures/desktop';

const ROUTES = [
  { path: '/',                  name: '홈',      landmark: 'main' },
  { path: '/dashboard',         name: '대시보드', landmark: 'main' },
  { path: '/settings/members',  name: '멤버',    landmark: 'table' },
  { path: '/settings/billing',  name: '결제',    landmark: 'main' },
];

for (const route of ROUTES) {
  test(`${route.name} 스모크`, async ({ desktopPage: page, noOverflow }, testInfo) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole(route.landmark as any).first()).toBeVisible();
    await noOverflow(page);

    // 고정 UI가 콘텐츠를 가리지 않는지
    const usable = await page.evaluate(() => {
      const vh = window.innerHeight;
      const fixed = [...document.querySelectorAll<HTMLElement>('*')]
        .filter(el => {
          const p = getComputedStyle(el).position;
          return (p === 'fixed' || p === 'sticky') && el.getBoundingClientRect().height > 0;
        });
      const top = fixed.filter(el => el.getBoundingClientRect().top < 8)
        .reduce((s, el) => s + el.getBoundingClientRect().height, 0);
      return (vh - top) / vh;
    });
    expect(usable, '사용 가능 높이 비율').toBeGreaterThan(0.6);

    await expect(page).toHaveScreenshot(`${testInfo.project.name}-${route.name}.png`, {
      fullPage: false,
      animations: 'disabled',
      mask: [page.getByTestId('relative-time'), page.getByTestId('avatar')],
    });
  });
}
```

### 23.4 시각 회귀 안정화

데스크톱 시각 회귀는 폭 조합이 많아 노이즈에 취약하다. 아래를 반드시 적용한다.

```ts
// tests/desktop/visual.spec.ts
test.beforeEach(async ({ page }) => {
  // 1. 애니메이션·전환 제거
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }`,
  });

  // 2. 시간 고정
  await page.clock.setFixedTime(new Date('2026-07-30T09:00:00+09:00'));

  // 3. 랜덤 고정
  await page.addInitScript(() => { Math.random = () => 0.42; });

  // 4. 폰트 로딩 완료 대기
  await page.evaluate(() => document.fonts.ready);
});

test('대시보드 시각 회귀', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot({
    fullPage: true,
    animations: 'disabled',
    // 변동 요소는 마스킹
    mask: [
      page.getByTestId('last-updated'),
      page.getByTestId('live-counter'),
    ],
    maxDiffPixelRatio: 0.01,
  });
});
```

기준 스냅샷은 **CI와 동일한 OS·브라우저 버전**에서 생성한다. 로컬(Windows)과 CI(Linux)의 폰트 렌더링이 달라 매번 실패한다면, 스냅샷 생성을 CI 전용 또는 도커 컨테이너로 통일한다.

### 23.5 유용한 헬퍼 모음

```ts
// tests/helpers/desktop.ts
import type { Page, Locator } from '@playwright/test';

/** 문서 가로 오버플로 원인 요소 목록 */
export async function findOverflowingElements(page: Page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(el => el.offsetParent !== null)
      .map(el => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.right > limit + 1 || r.left < -1)
      .slice(0, 20)
      .map(({ el, r }) => ({
        tag: el.tagName,
        className: String(el.className).slice(0, 120),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      }));
  });
}

/** 요소가 다른 요소에 가려졌는지 */
export async function isObscured(locator: Locator) {
  return locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + Math.min(r.height / 2, 8);
    const top = document.elementFromPoint(cx, cy);
    return top !== el && !el.contains(top);
  });
}

/** 오버레이가 뷰포트 안에 완전히 들어오는지 */
export async function assertWithinViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const vp = page.viewportSize()!;
  if (!box) throw new Error('요소를 찾을 수 없음');
  return {
    ok: box.x >= -1 && box.y >= -1
      && box.x + box.width <= vp.width + 1
      && box.y + box.height <= vp.height + 1,
    box, vp,
  };
}

/** 현재 CLS 값 */
export async function getCLS(page: Page, waitMs = 2000) {
  return page.evaluate((ms) => new Promise<number>(resolve => {
    let total = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), ms);
  }), waitMs);
}

/** Tab 순서 덤프 */
export async function dumpTabOrder(page: Page, steps = 40) {
  const order: { label: string; x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      return {
        label: (el.getAttribute('aria-label') ?? el.textContent ?? el.tagName).trim().slice(0, 40),
        x: Math.round(r.x), y: Math.round(r.y),
      };
    });
    if (info) order.push(info);
  }
  return order;
}
```

### 23.6 자동화하지 말아야 할 것

아래는 자동화 비용 대비 가치가 낮거나 신뢰할 수 없다. 수동 검토로 남긴다.

- 정보 위계와 시각 균형 판단 (D-DASH-04, D-WIDE-01의 정성 부분)
- 애니메이션의 자연스러움
- 스크린리더 낭독의 이해 가능성 (D-A11Y-04)
- 실기기 Safari·다중 모니터·Windows 고배율 (에뮬레이션은 근사일 뿐)
- 색상의 미적 적절성

이 항목들은 스크린샷과 체크리스트로 검토하고 리포트에 수동 검증임을 명시한다.

---

## 24. Regression 절차

### 24.1 수정 후 필수 재검증

결함을 고칠 때마다 아래 순서를 그대로 실행한다. 하나라도 건너뛰면 회귀를 만든다.

```text
1. 원래 조건에서 재현이 사라졌는지 확인
   → 발견 당시의 정확한 폭·배율·줌·라우트·절차

2. 인접 폭에서 회귀가 없는지 확인
   → 발견 폭의 이전/다음 breakpoint (예: 1280에서 고쳤으면 1024와 1440)

3. 인접 조건에서 회귀가 없는지 확인
   → 배율 한 단계 위/아래, 줌 한 단계 위/아래

4. 반대 상태 확인
   → 다크 모드, 사이드바 접힘/펼침, 로그인/비로그인, 빈 데이터/최대 데이터

5. 같은 컴포넌트를 쓰는 다른 화면 확인
   → rg로 사용처를 찾아 전부 점검

6. 자동 테스트 추가
   → 수정 전 코드에서 반드시 실패하는 테스트여야 한다

7. Gate 전체 실행
```

**6번이 핵심이다.** 새 테스트를 작성했으면 수정을 임시로 되돌려(`git stash`) 테스트가 실패하는지 확인한다. 실패하지 않는 테스트는 회귀를 잡지 못한다.

```bash
git stash push -- src/
pnpm playwright test tests/desktop/regression-D-DROP-01.spec.ts   # 반드시 FAIL이어야 함
git stash pop
pnpm playwright test tests/desktop/regression-D-DROP-01.spec.ts   # PASS
```

### 24.2 Regression Gate

```bash
# G1. 정적 검사
pnpm lint
pnpm typecheck

# G2. 단위·컴포넌트 테스트
pnpm test -- --run

# G3. 프로덕션 빌드
pnpm build

# G4. 데스크톱 폭 매트릭스
pnpm playwright test --project=desktop-1024 --project=desktop-1280 \
  --project=desktop-1440 --project=desktop-1920 --project=desktop-2560

# G5. 배율 조합
pnpm playwright test --project=scaling-1920x125 --project=scaling-1920x150

# G6. 크로스 엔진
pnpm playwright test --project=firefox --project=webkit

# G7. 접근성
pnpm playwright test tests/desktop/a11y.spec.ts

# G8. 성능 (프로덕션 서버 필요)
pnpm playwright test tests/desktop/perf.spec.ts

# G9. 시각 회귀
pnpm playwright test tests/desktop/visual.spec.ts
```

| Gate | 통과 기준 | 실패 시 |
|------|-----------|---------|
| G1 | 오류 0 | 즉시 수정 |
| G2 | 전부 통과 | 즉시 수정 |
| G3 | 빌드 성공, 번들 예산 초과 없음 | 즉시 수정 |
| G4 | 전 폭에서 오버플로 0, 콘솔 오류 0 | S1/S2로 등록 |
| G5 | 배율 조합에서 레이아웃 무결 | S1/S2로 등록 |
| G6 | 3개 엔진 P0 통과 | 엔진별 결함 등록 |
| G7 | critical/serious 위반 0 | S1/S2로 등록 |
| G8 | INP ≤ 200ms, CLS ≤ 0.1 | S2로 등록 |
| G9 | 의도한 변경만 diff | 스냅샷 검토 후 승인/수정 |

### 24.3 회귀 테스트 명명과 배치

```text
tests/desktop/
├── matrix.spec.ts              # 전 폭 스모크
├── viewport.spec.ts            # D-VP-*
├── scaling.spec.ts             # D-DPI-*, D-ZOOM-*
├── interaction.spec.ts         # D-HOVER-*, D-DROP-*, D-MEGA-*, D-TIP-*
├── keyboard.spec.ts            # D-KEY-*
├── layout.spec.ts              # D-STICKY-*, D-SIDE-*, D-DASH-*, D-LAYER-*
├── table.spec.ts               # D-TBL-*
├── a11y.spec.ts                # D-A11Y-*
├── perf.spec.ts                # D-PERF-*
├── visual.spec.ts              # 시각 회귀
└── regressions/
    ├── D-DROP-01-table-menu-clipped.spec.ts
    └── D-SIDE-01-collapse-flicker.spec.ts
```

개별 결함 회귀 테스트는 `regressions/`에 체크 ID를 파일명에 포함해 배치한다. 나중에 "이 테스트가 왜 있는가"를 추적할 수 있다.

```ts
/**
 * 회귀 방지: D-DROP-01
 * 발견: 2026-07-30, 1440x900, overflow-x-auto 안의 행 액션 메뉴가 하단에서 잘림
 * 원인: absolute 포지셔닝 + 스크롤 컨테이너 조상
 * 수정: DropdownMenuPortal 적용 (components/data-table/row-actions.tsx)
 */
test('테이블 행 메뉴가 스크롤 컨테이너에 잘리지 않는다', async ({ page }) => {
  // ...
});
```

---

## 25. Final Report

### 25.1 리포트 원칙

- 채팅에 작성한다. 리포지토리에 QA 리포트 파일을 만들지 않는다(D-P11).
- 모든 Finding에 **물리 해상도 / 배율 / 줌 / 유효 CSS 폭** 4개를 기록한다(D-P1).
- 수치 없는 성능 주장을 쓰지 않는다.
- 검사하지 못한 항목은 숨기지 말고 BLOCKED로 명시한다.
- 스크린샷은 `tmp/qa/desktop/<날짜>/`에 저장하고 커밋하지 않는다.

### 25.2 리포트 템플릿

```markdown
# Desktop QA Report

## 1. 요약

- 대상: <프로젝트명> / <브랜치> / <커밋 SHA>
- 빌드: production (`pnpm build && pnpm start`)
- 실행 일시: YYYY-MM-DD HH:mm (KST)
- 검사 라우트: N개 (P0 M개)
- 검사 조합: 폭 9종 × 높이 3종 + 배율 5종 + 줌 6종 + 엔진 3종
- 결과: S0 n건 / S1 n건 / S2 n건 / S3 n건 / S4 n건
- 배포 판정: **GO** | **CONDITIONAL GO** | **NO GO**
- 판정 근거: <한 문장>

## 2. 검사 환경

| 항목 | 값 |
|------|-----|
| OS | Windows 11 26H1 / macOS 15.x |
| Chrome | 1xx.x |
| Firefox | 1xx.x |
| WebKit (Playwright) | 1x.x |
| Edge | 1xx.x |
| Node / 패키지 매니저 | 22.x / pnpm 9.x |
| 실기기 고배율 | 있음 / 없음 |
| 다중 모니터 | 있음 / 없음 |
| 스크린리더 | NVDA 2026.x / VoiceOver / 없음 |

## 3. 조합별 결과

| 물리 해상도 | 배율 | 줌 | 유효 CSS | 홈 | 대시보드 | 멤버 | 결제 |
|-------------|------|-----|----------|-----|----------|------|------|
| 1366×768 | 100% | 100% | 1366×648 | PASS | FAIL(D-02) | PASS | PASS |
| 1920×1080 | 100% | 100% | 1920×960 | PASS | PASS | PASS | PASS |
| 1920×1080 | 125% | 100% | 1536×764 | PASS | PASS | FAIL(D-05) | PASS |
| 1920×1080 | 150% | 100% | 1280×628 | PASS | FAIL(D-02) | FAIL(D-05) | PASS |
| 1920×1080 | 100% | 150% | 1280×720 | PASS | PASS | PASS | PASS |
| 1920×1080 | 100% | 200% | 960×540 | PASS | FAIL(D-08) | PASS | PASS |
| 2560×1440 | 100% | 100% | 2560×1340 | WARN | PASS | PASS | PASS |
| 3840×2160 | 150% | 100% | 2560×1340 | WARN | PASS | PASS | PASS |

## 4. Findings

### D-01 [S1] 1920@150%에서 대시보드 필터 툴바가 콘텐츠를 가림

- **체크 ID:** D-VP-02, D-STICKY-04
- **환경:** 1920×1080 / 배율 150% / 줌 100% / 유효 1280×628 / Chrome 1xx
- **라우트:** `/dashboard`
- **재현 절차:**
  1. 배율 150% 환경에서 `/dashboard` 접속
  2. 아래로 400px 스크롤
  3. 고정 헤더(64) + 페이지 헤더(56) + 필터 툴바(56)가 누적
- **기대:** 고정 UI 누적이 뷰포트 높이의 35% 이하
- **실제:** 176px / 628px = **28%**이나, 하단 액션 바 72px 포함 시 **39.5%**. 첫 위젯이 절반만 보임
- **증거:** `tmp/qa/desktop/2026-07-30/d01-1920x150-dashboard.png`, 측정 로그 첨부
- **원인:** `components/layout/page-header.tsx:24` — 짧은 뷰포트 대응 없이 항상 sticky
- **수정 제안:** `@media (max-height: 700px)`에서 페이지 헤더를 static으로, 필터 툴바를 헤더에 병합
- **회귀 테스트:** `tests/desktop/regressions/D-VP-02-sticky-budget.spec.ts`
- **영향 범위:** 배율 150% 이상 사용자 전체 (추정 트래픽 12%)

### D-02 [S2] ...

## 5. 자동 검사 결과

| Gate | 결과 | 비고 |
|------|------|------|
| G1 lint / typecheck | PASS | |
| G2 unit | PASS | 142 tests |
| G3 build | PASS | First Load JS 218KB |
| G4 폭 매트릭스 | FAIL | 7건 (D-01, D-05 …) |
| G5 배율 조합 | FAIL | 3건 |
| G6 크로스 엔진 | PASS | webkit 1건 flaky (재시도 통과) |
| G7 a11y (axe) | FAIL | serious 2건 |
| G8 perf | PASS | INP 148ms, CLS 0.04 |
| G9 visual | PASS | 의도된 diff 3건 승인 |

## 6. BLOCKED 항목

| 체크 ID | 사유 | 필요 조건 |
|---------|------|-----------|
| D-WIN-03 | 다중 모니터 환경 없음 | DPR이 다른 외부 모니터 |
| D-A11Y-04 | 스크린리더 환경 없음 | NVDA 또는 VoiceOver |
| D-XB-03 | Safari 실기기 없음 | macOS 기기 (WebKit 자동 테스트는 수행) |

## 7. 수정 우선순위

| 순서 | ID | 등급 | 예상 작업량 | 사유 |
|------|----|------|-------------|------|
| 1 | D-05 | S1 | S | 배율 125% 사용자에게 저장 버튼 접근 불가 |
| 2 | D-01 | S1 | M | 고배율 사용자 대시보드 사용성 심각 |
| 3 | D-08 | S2 | S | 200% 줌 WCAG 1.4.10 위반 |

## 8. 판정

**CONDITIONAL GO** — S1 2건(D-01, D-05)을 수정하고 G4/G5/G7 재실행 후 배포 가능.
S2 이하는 다음 스프린트로 이관 가능하나, D-08은 접근성 법적 요구사항이므로 2주 내 처리 권장.
```

### 25.3 Finding 작성 규칙

- **제목은 결과를 말한다.** "드롭다운 문제"가 아니라 "1440px에서 테이블 행 메뉴 하단 항목 클릭 불가".
- **환경은 4요소를 모두 쓴다.** "데스크톱에서"는 정보가 아니다.
- **기대와 실제를 수치로 대비한다.** "잘림"이 아니라 "메뉴 하단이 컨테이너 경계보다 48px 아래".
- **원인을 파일:라인으로 지목한다.** 지목하지 못하면 "원인 미확정"이라고 쓰고 조사 범위를 남긴다.
- **영향 범위를 추정한다.** 어떤 사용자 조건에서 몇 %가 겪는가.

---

## 부록 A — 실행 명령

### A.1 정적 스캔 일괄

```bash
# 폭 정책과 고정 크기
rg -n "max-w-|container|mx-auto" src --glob "*.tsx" | head -60
rg -n "w-\[[0-9]{3,}px\]|min-w-\[[0-9]{3,}px\]" src
rg -n "w-screen|100vw" src

# 높이 가정
rg -n "h-screen|min-h-screen|100vh|calc\(100vh" src

# 고정 UI와 레이어
rg -n "fixed|sticky" src --glob "*.tsx"
rg -o "z-\[?[0-9]+\]?" src | sort | uniq -c | sort -rn

# 오버레이
rg -n "createPortal|DropdownMenuPortal|PopoverPortal|TooltipContent|SelectContent" src
rg -n "absolute (top-full|right-0|left-0)" src --glob "*.tsx"

# hover 의존
rg -n "group-hover:(opacity-100|visible|flex|block)" src
rg -n "group-focus-within:|focus-visible:opacity-100" src
rg -n "onMouseEnter|onMouseOver" src --glob "*.tsx"

# 키보드·포커스
rg -n "outline-none|outline: none" src | rg -v "focus-visible:"
rg -n "<div[^>]*onClick|<span[^>]*onClick" src --glob "*.tsx"
rg -n "tabIndex=\{[1-9]" src

# 테이블
rg -n "<table|role=\"grid\"|aria-sort|scope=\"(col|row)\"" src
rg -n "table-fixed|<colgroup|tabular-nums" src

# 접근성
rg -n "aria-expanded|aria-haspopup|aria-controls|aria-modal|inert" src
rg -n "prefers-reduced-motion|motion-reduce:|forced-colors" src

# 성능
rg -n "setInterval|setTimeout" src --glob "*.tsx" -A6 | rg -v "clear"
rg -n "new (ResizeObserver|IntersectionObserver)" src -A8 | rg -v "disconnect"
rg -n "useDeferredValue|useTransition|useMemo" src | wc -l
rg -n "next/dynamic|React.lazy" src

# 크로스 브라우저
rg -n ":has\(|@container|backdrop-filter|scrollbar-gutter|scrollbar-width" src
rg -n "type=\"(date|time|datetime-local|color|range)\"" src
rg -n "target=\"_blank\"" src | rg -v "rel="
```

### A.2 테스트 실행

```bash
# 프로덕션 빌드로 서버 기동
pnpm build && pnpm start

# 전체 데스크톱 매트릭스
pnpm playwright test tests/desktop

# 특정 폭만
pnpm playwright test --project=desktop-1440

# 배율 조합
pnpm playwright test --project=scaling-1920x125 --project=scaling-1920x150

# 크로스 엔진
pnpm playwright test --project=firefox --project=webkit

# 접근성만
pnpm playwright test tests/desktop/a11y.spec.ts

# 시각 회귀 기준 갱신 (검토 후에만)
pnpm playwright test tests/desktop/visual.spec.ts --update-snapshots

# 디버깅
pnpm playwright test tests/desktop/table.spec.ts --debug
pnpm playwright test --ui
pnpm playwright show-report
pnpm playwright show-trace test-results/**/trace.zip
```

### A.3 임시 산출물 정리

```bash
# 스크린샷 저장 위치 (커밋하지 않는다)
mkdir -p tmp/qa/desktop/$(date +%Y-%m-%d)

# .gitignore 확인
rg -n "^tmp/|^test-results/|^playwright-report/" .gitignore
```

---

## 부록 B — Agent 체크리스트

작업 순서대로 실행하고, 각 항목의 결과를 PASS / FAIL / BLOCKED로 기록한다.

### B.1 준비

```text
[ ] Project Binding 블록을 실측으로 채웠다
[ ] P0/P1 라우트를 확정했다
[ ] Desktop Surface Inventory 표를 작성했다
[ ] 물리 해상도 × 배율 × 줌 매트릭스를 계산했다
[ ] 프로덕션 빌드로 서버를 기동했다
[ ] Freeze List를 확인했다
```

### B.2 해상도·배율·줌

```text
[ ] D-VP-01 문서 가로 스크롤 (9개 폭)
[ ] D-VP-02 짧은 높이 고정 UI (600 / 720)
[ ] D-VP-03 스크롤바 폭과 레이아웃 안정성
[ ] D-VP-04 breakpoint 경계 ±1px
[ ] D-VP-05 콘텐츠 폭 정책과 줄 길이
[ ] D-DPI-01 고배율 유효 CSS 폭 대응
[ ] D-DPI-02 고DPI 이미지·Canvas 선명도
[ ] D-DPI-03 1px 경계선 렌더링
[ ] D-DPI-04 배율 변경 중 상태 유지
[ ] D-ZOOM-01 200% 줌 Reflow (WCAG 1.4.10)
[ ] D-ZOOM-02 텍스트 간격 확대 (WCAG 1.4.12)
[ ] D-ZOOM-03 축소(80~90%) 레이아웃
[ ] D-ZOOM-04 줌 상태 오버레이 포지셔닝
[ ] D-WIDE-01 초광폭 레이아웃 정책
[ ] D-WIDE-02 커서 이동 거리
[ ] D-WIDE-03 이미지 업스케일 품질
[ ] D-WIDE-04 21:9 첫 화면 구성
[ ] D-WIDE-05 고정 요소 폭 비례
```

### B.3 인터랙션

```text
[ ] D-HOVER-01 hover 전용 정보·동작
[ ] D-HOVER-02 hover 의도와 지연
[ ] D-HOVER-03 hover 브리징(대각선)
[ ] D-HOVER-04 hover 레이아웃 이동·성능
[ ] D-HOVER-05 hover 대비와 상태 구분
[ ] D-KEY-01 키보드 단독 완주
[ ] D-KEY-02 focus visible
[ ] D-KEY-03 focus trap과 복귀
[ ] D-KEY-04 복합 위젯 키보드 규약
[ ] D-KEY-05 단축키 충돌과 안전성
[ ] D-KEY-06 skip link와 랜드마크
[ ] D-DROP-01 조상 overflow 잘림
[ ] D-DROP-02 충돌 회피와 사용 가능 높이
[ ] D-DROP-03 ARIA 상태 동기화
[ ] D-DROP-04 외부 클릭·스크롤·라우트 닫힘
[ ] D-DROP-05 네이티브 vs 커스텀 select
[ ] D-MEGA-01 시맨틱과 역할
[ ] D-MEGA-02 키보드 접근과 포커스
[ ] D-MEGA-03 패널 폭·높이
[ ] D-MEGA-04 배경 스크롤과 상호작용
[ ] D-TIP-01 툴팁 필수 정보 배제
[ ] D-TIP-02 WCAG 1.4.13
[ ] D-TIP-03 접근 가능한 이름·중복 낭독
[ ] D-TIP-04 비활성 요소 툴팁
[ ] D-TIP-05 잘린 텍스트 전체 값
```

### B.4 레이아웃

```text
[ ] D-STICKY-01 다중 sticky 오프셋
[ ] D-STICKY-02 sticky 미동작 조건
[ ] D-STICKY-03 앵커 이동과 scroll-padding
[ ] D-STICKY-04 짧은 뷰포트 sticky 예산
[ ] D-SIDE-01 접기/펼치기 상태 지속
[ ] D-SIDE-02 아이콘 전용 모드 접근성
[ ] D-SIDE-03 리사이즈 가능 사이드바
[ ] D-SIDE-04 내부 스크롤과 중첩
[ ] D-SIDE-05 좁은 폭 전환
[ ] D-DASH-01 위젯 그리드 폭 적응
[ ] D-DASH-02 차트 리사이즈와 종횡비
[ ] D-DASH-03 위젯별 로딩·오류 격리
[ ] D-DASH-04 정보 밀도와 시각 계층
[ ] D-DASH-05 데이터 새로고침·라이브 업데이트
[ ] D-TBL-01 테이블 시맨틱
[ ] D-TBL-02 정렬 상태와 조작
[ ] D-TBL-03 sticky 헤더·첫 열
[ ] D-TBL-04 가로 스크롤 접근성
[ ] D-TBL-05 행 선택과 대량 작업
[ ] D-TBL-06 열 폭·정렬·긴 값
[ ] D-TBL-07 빈 상태·로딩·오류
[ ] D-LAYER-01 z-index 스케일
[ ] D-LAYER-02 중첩 오버레이
[ ] D-LAYER-03 배경 접근성
[ ] D-WIN-01 창 리사이즈 연속 대응
[ ] D-WIN-02 최소 창 크기
[ ] D-WIN-03 다중 모니터 DPR 전환
[ ] D-WIN-04 브라우저 UI 변화
[ ] D-WIN-05 새 탭·팝업·외부 링크
```

### B.5 품질

```text
[ ] D-PERF-01 대형 DOM과 렌더 비용
[ ] D-PERF-02 INP와 상호작용 지연
[ ] D-PERF-03 가상화 기준과 함정
[ ] D-PERF-04 장시간 세션 메모리 누수
[ ] D-PERF-05 번들과 초기 로드
[ ] D-A11Y-01 axe 자동 검사
[ ] D-A11Y-02 Windows 고대비 모드
[ ] D-A11Y-03 축소 모션
[ ] D-A11Y-04 스크린리더 수동 검증
[ ] D-A11Y-05 색상·비텍스트 대비
[ ] D-XB-01 엔진별 렌더 차이
[ ] D-XB-02 스크롤바·폼 컨트롤
[ ] D-XB-03 Safari 고유 이슈
[ ] D-XB-04 폰트 렌더링과 텍스트 메트릭
```

### B.6 마무리

```text
[ ] 모든 S0/S1/S2에 회귀 테스트를 추가했다
[ ] 각 회귀 테스트가 수정 전 코드에서 실패함을 확인했다
[ ] Regression Gate G1~G9를 실행했다
[ ] BLOCKED 항목과 사유를 명시했다
[ ] Final Report를 채팅에 작성했다
[ ] 리포지토리에 QA 리포트 파일을 만들지 않았다
[ ] 스크린샷을 tmp/qa/desktop/<날짜>/에 두고 커밋하지 않았다
[ ] Freeze List 파일을 수정하지 않았다
```

---

**다음 문서:** `04_Visual_QA.md` — 시각 회귀, 디자인 정합성, 스냅샷 전략
