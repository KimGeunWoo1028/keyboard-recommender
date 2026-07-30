# 04_Visual_QA.md — Cursor QA Master Suite · Visual Playbook

> **문서 등급:** ★★★★★ · 시각 회귀와 디자인 정합성 QA 실행 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind CSS · Playwright
> **핵심 전제:** 결정론 없는 시각 테스트는 노이즈 생성기다. 5장을 통과하지 못하면 6장 이후는 무의미하다.
> **판정 대상:** 픽셀 diff · 디자인 토큰 정합 · 상태 표현 · 테마 · 콘텐츠 변동 내성 · 인쇄/OG
> **독립성:** 이 문서는 `01_Core_QA.md` 없이도 단독으로 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 실행하는 명령형 매뉴얼.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding과 시각 인벤토리](#3-project-binding과-시각-인벤토리)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [결정론 확보](#5-결정론-확보)
6. [스냅샷 전략](#6-스냅샷-전략)
7. [Layout과 Spacing](#7-layout과-spacing)
8. [Typography](#8-typography)
9. [Color와 Theme](#9-color와-theme)
10. [Border · Radius · Shadow · Elevation](#10-border--radius--shadow--elevation)
11. [Image와 Media](#11-image와-media)
12. [Icon과 Logo](#12-icon과-logo)
13. [State 시각 검증](#13-state-시각-검증)
14. [Animation과 Transition](#14-animation과-transition)
15. [Component 시각 정합성](#15-component-시각-정합성)
16. [Content 변동 내성](#16-content-변동-내성)
17. [Responsive 시각 회귀](#17-responsive-시각-회귀)
18. [Cross Browser 시각 차이](#18-cross-browser-시각-차이)
19. [Print과 OG Image](#19-print과-og-image)
20. [Playwright 시각 자동화](#20-playwright-시각-자동화)
21. [Diff Triage 절차](#21-diff-triage-절차)
22. [Baseline 관리와 CI 운영](#22-baseline-관리와-ci-운영)
23. [Regression 절차](#23-regression-절차)
24. [Final Report](#24-final-report)
25. [부록 A — 실행 명령](#부록-a--실행-명령)
26. [부록 B — Agent 체크리스트](#부록-b--agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

시각 QA는 "스크린샷을 찍어 비교하는 작업"이 아니다. 픽셀 비교는 **도구**일 뿐이고, 실제 목표는 두 가지다.

1. **회귀 탐지** — 의도하지 않은 시각 변화를 코드 병합 전에 잡는다.
2. **정합성 검증** — 디자인 토큰·컴포넌트 규약·상태 표현이 설계대로 구현되었는지 확인한다.

이 둘은 방법이 다르다. 회귀 탐지는 스냅샷 비교가 맞지만, 정합성 검증은 **계산된 스타일 값 어설션**이 훨씬 정확하고 유지보수가 싸다. "간격이 24px여야 한다"를 픽셀 diff로 확인하는 것은 잘못된 도구 선택이다. 이 문서는 각 항목마다 어느 도구를 써야 하는지 명시한다.

### 1.1 동시에 수행할 역할

- **Principal Frontend Engineer:** 시각 결함의 원인을 CSS 계층·토큰·컴포넌트 구조에서 찾는다. 스냅샷 승인으로 문제를 덮지 않는다.
- **Design System Owner:** 하드코딩된 색·간격·반경·그림자를 찾아 토큰 위반으로 판정한다. 디자인 의도와 구현의 격차를 수치로 보고한다.
- **UX Auditor:** 정렬·리듬·시각 위계·여백 균형처럼 픽셀 diff가 잡지 못하는 정성 결함을 스크린샷 검토로 판정한다.
- **Playwright Automation Engineer:** 결정론적 스냅샷 파이프라인을 구축하고, flaky를 0에 수렴시킨다. flaky한 시각 테스트는 없느니만 못하다.
- **QA Lead:** 모든 diff를 "승인 / 결함 / 노이즈" 세 가지로 분류하고, 노이즈는 반드시 원인을 제거한다.

### 1.2 완료 조건

```text
[ ] 결정론 게이트(5장) 전 항목을 통과했다. 동일 커밋 3회 연속 실행에서 diff가 0이다.
[ ] 스냅샷 범위와 입도를 정의하고 기준선을 생성했다.
[ ] P0/P1 라우트를 필수 폭 매트릭스에서 캡처했다.
[ ] 라이트/다크 두 테마를 모두 캡처했다.
[ ] 컴포넌트 variant 매트릭스를 캡처했다.
[ ] 상태(hover/focus/active/disabled/loading/empty/error)를 캡처했다.
[ ] 디자인 토큰 정합성을 계산 스타일 어설션으로 검증했다.
[ ] 콘텐츠 극단값(긴 텍스트·빈 값·최대 데이터)에서 레이아웃 내성을 확인했다.
[ ] 최소 2개 엔진에서 시각 검사를 수행했다.
[ ] 인쇄 스타일과 OG 이미지를 확인했다.
[ ] 모든 diff를 승인/결함/노이즈로 분류하고 노이즈 원인을 제거했다.
[ ] S0/S1/S2 결함마다 회귀 테스트가 있다.
[ ] Regression Gate 전체를 실행하고 Final Report를 작성했다.
```

기준선 생성 환경(OS·브라우저 버전·폰트)이 CI와 다르면 그 사실을 명시하고 `BLOCKED — 기준선 환경 불일치`로 기록한다. 로컬에서만 통과하는 시각 테스트는 가치가 없다.

---

## 2. 절대 원칙

우선순위 순서이며, 충돌 시 번호가 작은 쪽이 이긴다.

### V-P1. 결정론이 먼저다

flaky한 시각 테스트는 팀이 diff를 무시하게 만들고, 그 순간 시각 QA 전체가 무력화된다. 재실행마다 결과가 달라지면 **테스트를 추가하지 말고 결정론부터 고친다.** 임계값을 올려 통과시키는 것은 결정론 확보가 아니라 탐지력 포기다.

### V-P2. 임계값을 올려 실패를 없애지 않는다

`maxDiffPixelRatio`를 0.05로 올리면 버튼 하나가 통째로 사라져도 통과한다. 임계값은 안티에일리어싱 수준의 노이즈만 흡수해야 하며(권장 0.001~0.01), 그 이상이 필요하면 원인이 노이즈이므로 마스킹이나 고정으로 해결한다.

### V-P3. 값 검증은 스냅샷이 아니라 어설션으로 한다

"패딩 16px", "색상 토큰 사용", "폰트 크기 14px"은 `getComputedStyle` 어설션이 맞다. 스냅샷은 원인을 알려주지 않지만 어설션은 실패 메시지에 기대값과 실제값을 담는다.

### V-P4. 스냅샷 승인은 코드 리뷰다

`--update-snapshots`를 무조건 실행하는 것은 결함을 기준선에 굽는 행위다. 모든 diff는 **눈으로 보고** 의도된 변경임을 확인한 뒤에만 승인한다. 승인 사유를 커밋 메시지나 PR에 남긴다.

### V-P5. 시각 결함의 원인은 시각이 아니다

간격이 어긋나면 CSS를 덧붙이는 대신 토큰·컴포넌트 규약·레이아웃 구조에서 원인을 찾는다. `mt-[13px]` 같은 임의값 추가는 수정이 아니라 부채다.

### V-P6. 하드코딩 색·간격·반경은 결함이다

디자인 토큰이 있는데 `#3B82F6`, `padding: 13px`, `border-radius: 7px`을 직접 쓰면 테마 전환·리브랜딩·다크 모드에서 반드시 깨진다. 발견 즉시 토큰 위반으로 기록한다.

### V-P7. 다크 모드는 색 반전이 아니다

다크 모드에서는 그림자가 거의 보이지 않고, 이미지가 배경과 충돌하며, 대비 관계가 뒤집힌다. 라이트에서 통과했다고 다크가 통과하지 않는다. **두 테마는 별도 검사 대상이다.**

### V-P8. 콘텐츠는 항상 예상보다 길거나 짧다

디자인 시안의 "김민준"은 실제로 "주식회사 대한민국종합기술개발공사 서울지사"가 된다. 시각 QA는 실 데이터가 아니라 **극단값**으로 해야 한다.

### V-P9. 스크린샷은 증거이지 판정이 아니다

"스크린샷상 괜찮아 보임"은 판정이 아니다. 무엇을 어떤 기준으로 확인했는지 명시하고, 정성 판정은 정성 판정이라고 밝힌다.

### V-P10. 기준선은 단일 환경에서 생성한다

로컬 Windows와 CI Linux는 폰트 렌더링이 달라 항상 diff가 난다. 기준선은 CI 또는 도커 컨테이너 한 곳에서만 생성하고, 로컬은 검토용으로만 쓴다.

### V-P11. 리포트는 채팅에 남기고 산출물은 커밋하지 않는다

QA 리포트 파일을 저장소에 만들지 않는다. diff 이미지·트레이스는 `tmp/qa/visual/<날짜>/`에 두고 커밋하지 않는다. 단 **기준선 스냅샷은 예외**이며 저장소에 커밋한다(22장).

### V-P12. Freeze List를 존중한다

기준선 스냅샷, 디자인 원본 자산, 생성물, 좌표·기하 데이터, 프로젝트 룰이 잠근 파일은 QA 중 임의로 수정하지 않는다. 기준선 갱신이 필요하면 사유와 함께 별도로 제안한다.

---

## 3. Project Binding과 시각 인벤토리

QA 시작 전 아래 블록을 실측으로 채운다.

```yaml
visual_qa_binding:
  app_root:
  package_manager:
  build_command:
  production_command:
  base_url:
  e2e_root:
  playwright_config:
  snapshot_dir:              # 예: tests/visual/__screenshots__
  baseline_env:              # 예: CI ubuntu-24.04 / docker mcr.microsoft.com/playwright:v1.4x
  auth_fixture:

  design_tokens:
    source:                  # 예: tailwind.config.ts + app/globals.css :root
    color_tokens: []         # --background, --foreground, --primary …
    spacing_scale:           # 예: 4px 기반 Tailwind 기본
    radius_tokens: []
    shadow_tokens: []
    font_families: []
    type_scale: []

  themes: [light, dark]
  theme_switch:              # class / data-attribute / media

  p0_routes: []
  p1_routes: []

  component_catalog:
    storybook:               # 있음/없음 + URL
    variant_source:          # cva / tailwind-variants / 수동

  visual_surfaces:
    charts: []
    images: []               # 히어로, 아바타, 로고, 썸네일
    videos: []
    maps: []
    embeds: []               # iframe, 결제 위젯

  volatile_content: []       # 상대시간, 랜덤, 카운터, 실시간 데이터

  budgets:
    max_diff_pixel_ratio: 0.01
    max_flaky_rate: 0        # 3회 반복 실행 기준
    snapshot_count_limit:    # 유지 가능한 상한

  freeze_list: []
```

### 3.1 Repository Discovery

```bash
cat package.json
cat playwright.config.* 
cat tailwind.config.*
rg -n ":root|\.dark|@theme" app/globals.css src/app/globals.css 2>/dev/null

# 기존 스냅샷 자산
fd -e png . --glob "**/__screenshots__/**" | wc -l
fd -e png . --glob "**/*-snapshots/**" | wc -l

# 하드코딩 색상
rg -n "#[0-9a-fA-F]{3,8}\b" src --glob "*.tsx" --glob "*.ts" | rg -v "\.svg" | head -40
rg -n "rgb\(|rgba\(|hsl\(" src --glob "*.tsx" | head -30

# 임의값 유틸리티 (토큰 이탈 후보)
rg -o "(p|m|gap|space|w|h|text|rounded|shadow)-\[[^\]]+\]" src | sort | uniq -c | sort -rn | head -40

# 테마 구현
rg -n "next-themes|useTheme|dark:|data-theme|prefers-color-scheme" src | head -30

# 폰트
rg -n "next/font|@font-face|font-family" src app

# 변동 콘텐츠
rg -n "Date\.now|new Date\(\)|Math\.random|toLocaleString|formatDistance|fromNow" src | head -30

# 미디어
rg -n "<Image|<img|<video|<iframe|background-image" src | head -30
```

각 히트는 조사 후보다. 실제로 시각 결함이나 노이즈를 유발하는 것만 Finding으로 확정한다.

### 3.2 Visual Surface Inventory

```markdown
| ID | Route/Component | P0/P1 | 테마 | 변동 요소 | 미디어 | 스냅샷 입도 | 비고 |
|----|-----------------|-------|------|-----------|--------|-------------|------|
| V01 | `/` | P0 | L/D | 없음 | 히어로 이미지 | full page | 마케팅 |
| V02 | `/dashboard` | P0 | L/D | 상대시간, 카운터 | 차트 4개 | element별 | 마스킹 필수 |
| V03 | `Button` | P0 | L/D | 없음 | 없음 | component grid | variant 24종 |
| V04 | `/settings/members` | P0 | L/D | 최근 접속 시각 | 아바타 | full page + row | 극단 데이터 |
```

검사 우선순위:

1. 디자인 시스템 컴포넌트(변경 파급이 가장 넓다)
2. P0 라우트의 라이트/다크 조합
3. 상태 변형이 많은 폼·테이블
4. 차트·미디어가 있는 화면
5. 정적 마케팅 페이지

---

## 4. 실행 파이프라인과 Severity

```text
1. DISCOVER
   토큰, 테마, 컴포넌트 카탈로그, 변동 콘텐츠, 미디어를 인벤토리화한다.

2. DETERMINISM GATE
   5장 전 항목을 통과시킨다. 동일 커밋 3회 실행 diff 0을 확인한다.
   ★ 이 게이트를 통과하지 못하면 이후 단계로 진행하지 않는다.

3. SCOPE
   스냅샷 범위와 입도를 정한다. 무엇을 스냅샷으로, 무엇을 어설션으로 검증할지 분리한다.

4. BASELINE
   지정된 단일 환경에서 기준선을 생성하고 사람이 검토한 뒤 커밋한다.

5. TOKEN AUDIT
   계산 스타일 어설션으로 색·간격·타이포·반경·그림자 정합성을 검사한다.

6. MATRIX RUN
   라우트 × 폭 × 테마 × 상태 조합을 캡처한다.

7. CONTENT STRESS
   긴 텍스트·빈 값·최대 데이터·i18n으로 내성을 검사한다.

8. TRIAGE
   모든 diff를 승인 / 결함 / 노이즈로 분류한다. 노이즈는 반드시 원인을 제거한다.

9. ROOT CAUSE
   결함의 원인을 토큰·컴포넌트·레이아웃 구조에서 파일:라인으로 지목한다.

10. FIX
    최소 변경으로 원인을 제거한다. 임계값 상향과 임의값 추가를 금지한다.

11. VERIFY
    수정 후 인접 조합(다른 폭·다른 테마·다른 variant)까지 재검사한다.

12. REGRESSION
    회귀 테스트를 추가하고 Gate 전체를 실행한다.

13. REPORT
    diff 통계, 승인 목록, 결함 목록, 배포 판정을 보고한다.
```

### 4.1 Severity 기준 (시각)

| 등급 | 시각 QA 기준 |
|------|--------------|
| **S0 Blocker** | 콘텐츠가 보이지 않음(흰 화면, 텍스트 색 = 배경 색), 핵심 CTA 시각적 소실, 다크 모드에서 폼 입력값 판독 불가 |
| **S1 Critical** | 레이아웃 붕괴로 정보 판독 불가, 대비 미달로 텍스트 읽기 불가, 이미지 전면 깨짐, 테마 전환 시 일부 영역 미적용, 상태 구분 완전 불가 |
| **S2 Major** | 정렬 어긋남이 명확히 인지됨, 토큰 위반으로 테마 불일치, 그림자·경계 소실로 구조 파악 어려움, 긴 콘텐츠에서 오버플로, 컴포넌트 variant 불일치 |
| **S3 Minor** | 간격 리듬 불일치(4px 이하 오차), 아이콘 정렬 미세 오차, 초광폭 여백 불균형, 애니메이션 타이밍 편차 |
| **S4 Nit** | 육안으로 거의 구분 불가한 차이, 코드 정리 수준 |

**상향 규칙:** 결함이 결제·인증·삭제 화면에 있거나, 두 테마 모두에서 발생하거나, 디자인 시스템 컴포넌트에 있어 파급이 넓으면 한 단계 올린다.

**하향 금지:** "재현이 어렵다"는 이유로 등급을 낮추지 않는다. 재현이 어려우면 결정론 문제이므로 5장으로 돌아간다.

---

## 5. 결정론 확보

**이 장은 게이트다.** 여기를 통과하지 못한 상태에서 스냅샷을 늘리면 flaky 테스트만 쌓인다. 시각 QA 실패의 90%는 결함이 아니라 결정론 부재다.

### 5.1 판정 기준

```bash
# 동일 커밋에서 3회 연속 실행 → diff 0이어야 한다
pnpm playwright test tests/visual --repeat-each=3
```

한 번이라도 diff가 발생하면 그 스냅샷은 신뢰할 수 없다. 원인을 아래 항목에서 찾는다.

### V-DET-01 — 애니메이션과 전환

**WHY**
캡처 시점에 전환이 진행 중이면 매번 다른 중간 프레임이 찍힌다. Playwright의 `animations: 'disabled'`는 CSS 애니메이션과 전환을 마지막 프레임으로 강제하지만, JS 기반 애니메이션(Framer Motion, GSAP, requestAnimationFrame 루프)과 스피너·스켈레톤의 무한 애니메이션은 잡지 못한다.

**DETECT**

```bash
rg -n "animate-|transition-|duration-" src --glob "*.tsx" | wc -l
rg -n "framer-motion|motion\.|useSpring|gsap|anime\(" src
rg -n "@keyframes|animation:" src --glob "*.css"
rg -n "requestAnimationFrame" src --glob "*.tsx"
rg -n "animate-spin|animate-pulse|animate-bounce" src
```

**REPRODUCE**

```ts
test('진행 중인 애니메이션 탐지', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const running = await page.evaluate(() =>
    document.getAnimations()
      .filter(a => a.playState === 'running')
      .map(a => ({
        // @ts-expect-error - target은 표준 타입에 없다
        target: (a.effect as any)?.target?.className?.toString().slice(0, 60) ?? '?',
        name: (a as any).animationName ?? (a as any).transitionProperty ?? 'unknown',
      })));

  expect(running, `실행 중 애니메이션 ${running.length}개:\n${JSON.stringify(running, null, 2)}`)
    .toEqual([]);
});
```

**PASS / FAIL**

- PASS: 캡처 직전 `document.getAnimations()`에 `running` 상태가 없다. 3회 반복 실행에서 diff 0.
- FAIL: 실행 중 애니메이션 잔류. 자체로는 제품 결함이 아니지만 시각 QA를 불가능하게 하므로 **최우선 처리**.

**FIX**

세 겹으로 차단한다.

```ts
// 1. 브라우저 레벨 — playwright.config.ts
use: {
  launchOptions: { args: ['--force-prefers-reduced-motion'] },
},
```

```ts
// 2. 스타일 레벨 — 전역 주입
export async function freezeAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        animation-play-state: paused !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
      /* 무한 애니메이션은 첫 프레임으로 고정 */
      .animate-spin, .animate-pulse, .animate-bounce, .animate-ping {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    `,
  });
}
```

```ts
// 3. Web Animations API 레벨 — JS 애니메이션까지 정지
export async function finishAllAnimations(page: Page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      animation.finish();  // 마지막 프레임으로
      animation.cancel();  // 재시작 방지
    }
  });
}
```

Playwright의 `animations: 'disabled'` 옵션도 함께 쓴다. 셋 중 하나만으로는 부족하다.

```ts
await expect(page).toHaveScreenshot('dashboard.png', { animations: 'disabled' });
```

**BAD**

```ts
// ❌ 임계값을 올려 애니메이션 노이즈를 흡수 → 실제 결함도 함께 통과
await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.08 });
```

**GOOD**

```ts
// ✅ 노이즈 원인을 제거하고 임계값은 낮게 유지
await freezeAnimations(page);
await finishAllAnimations(page);
await expect(page).toHaveScreenshot({ animations: 'disabled', maxDiffPixelRatio: 0.005 });
```

---

### V-DET-02 — 시간·타임존·로케일

**WHY**
"3분 전", "2026년 7월 30일", "₩12,480", "12,480.50"은 모두 실행 시점과 환경에 따라 달라진다. 상대 시간은 매 실행마다 바뀌고, 타임존이 다르면 날짜가 하루 밀리며, 로케일이 다르면 숫자 구분자와 통화 기호가 바뀐다. CI(UTC)와 로컬(KST)의 차이는 시각 테스트를 100% 실패시킨다.

**DETECT**

```bash
rg -n "new Date\(\)|Date\.now\(\)" src --glob "*.tsx" --glob "*.ts"
rg -n "toLocaleDateString|toLocaleTimeString|toLocaleString|Intl\." src
rg -n "formatDistance|fromNow|dayjs\(\)|moment\(\)" src
rg -n "timeZone|TZ" src next.config.* 2>/dev/null
```

**REPRODUCE**

```ts
// 고정하지 않은 상태에서 2회 캡처 후 diff → 시간 요소가 드러난다
test('시간 표시 요소 탐지', async ({ page }) => {
  await page.goto('/dashboard');
  const first = await page.getByTestId('activity-list').textContent();
  await page.waitForTimeout(65_000);
  await page.reload();
  const second = await page.getByTestId('activity-list').textContent();
  expect(first).not.toBe(second); // 변동 확인 → 마스킹 대상
});
```

**PASS / FAIL**

- PASS: 시간·타임존·로케일이 고정되어 동일 커밋 3회 실행에서 텍스트가 동일하다.
- FAIL: 실행 시점에 따라 표시가 달라짐. 결정론 위반이므로 최우선 처리.

**FIX**

```ts
// playwright.config.ts — 전역 고정
use: {
  timezoneId: 'Asia/Seoul',
  locale: 'ko-KR',
},
```

```ts
// 테스트 레벨 — 시계 고정 (Playwright 1.45+)
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-30T09:00:00+09:00'));
});
```

`page.clock`을 쓸 수 없는 버전이면 `addInitScript`로 `Date`를 덮는다.

```ts
await page.addInitScript(() => {
  const FIXED = new Date('2026-07-30T09:00:00+09:00').getTime();
  const OriginalDate = Date;
  // @ts-expect-error - 테스트 전용 오버라이드
  window.Date = class extends OriginalDate {
    constructor(...args: any[]) {
      // eslint-disable-next-line constructor-super
      return args.length ? new OriginalDate(...(args as [any])) : new OriginalDate(FIXED);
    }
    static now() { return FIXED; }
  };
  window.Date.prototype = OriginalDate.prototype;
});
```

고정할 수 없는 경우(서버가 시각을 생성)에는 마스킹한다.

```tsx
// ✅ 변동 요소에 안정적인 테스트 훅을 심는다
<time dateTime={iso} data-testid="relative-time">{formatRelative(iso)}</time>
```

```ts
await expect(page).toHaveScreenshot({
  mask: [page.getByTestId('relative-time')],
  maskColor: '#FF00FF',
});
```

---

### V-DET-03 — 랜덤·ID·순서

**WHY**
`Math.random()`, `crypto.randomUUID()`, `Date.now()` 기반 키, 정렬 기준이 없는 목록은 매 실행마다 다른 결과를 만든다. React의 `useId()`는 렌더 순서에 따라 값이 달라져 DOM 속성 diff를 만들 수 있고, 이는 스크린샷에는 안 보이지만 DOM 스냅샷 비교에서 문제가 된다.

**DETECT**

```bash
rg -n "Math\.random|randomUUID|nanoid\(|uuid\(" src
rg -n "\.sort\(\)" src --glob "*.tsx" --glob "*.ts"          # 비교 함수 없는 정렬
rg -n "Object\.keys|Object\.entries" src --glob "*.tsx" | head -20
rg -n "key=\{index\}|key=\{i\}" src --glob "*.tsx"
```

**REPRODUCE**

```ts
test('동일 조건 2회 로드에서 DOM 텍스트가 동일하다', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const a = await page.getByRole('main').innerText();

  await page.reload();
  await page.waitForLoadState('networkidle');
  const b = await page.getByRole('main').innerText();

  expect(a).toBe(b);
});
```

**PASS / FAIL**

- PASS: 동일 조건 반복 로드에서 렌더 결과가 동일하다. 목록 순서가 안정적이다.
- FAIL: 순서 변동, 랜덤 값 노출. 시각 diff의 원인.

**FIX**

```ts
// ✅ 테스트에서 랜덤 고정
await page.addInitScript(() => {
  let seed = 42;
  Math.random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
});
```

```ts
// ✅ 목록은 항상 결정적 정렬 기준을 갖는다
const sorted = [...items].sort((a, b) =>
  b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
```

동점 처리(tiebreaker)가 없으면 서버 응답 순서에 따라 결과가 달라진다. 두 번째 정렬 키를 반드시 둔다.

---

### V-DET-04 — 폰트 로딩

**WHY**
웹폰트가 로드되기 전에 캡처하면 폴백 폰트로 렌더된 화면이 찍힌다. 폴백은 글자 폭이 다르므로 줄바꿈 위치·요소 높이·전체 레이아웃이 전부 달라진다. `networkidle`만으로는 부족하다. 폰트는 CSS 파싱 후 필요 시점에 요청되므로 타이밍이 어긋난다.

**DETECT**

```bash
rg -n "next/font|@font-face" src app
rg -n "font-display|display: 'swap'|display: 'optional'" src app
rg -n "preload" src/app/layout.tsx 2>/dev/null
```

**REPRODUCE**

```ts
test('캡처 시점에 폰트가 모두 로드되어 있다', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const status = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      status: document.fonts.status,
      loaded: [...document.fonts].map(f => ({ family: f.family, status: f.status })),
    };
  });

  expect(status.status).toBe('loaded');
  const pending = status.loaded.filter(f => f.status !== 'loaded');
  expect(pending, JSON.stringify(pending)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 캡처 전 `document.fonts.ready`가 resolve되고 `document.fonts.status === 'loaded'`다.
- FAIL: 폴백 폰트 캡처. 레이아웃 전체가 흔들리므로 결정론 최우선 결함.

**FIX**

```ts
// ✅ 캡처 전 공통 대기 함수
export async function waitForVisualStability(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  // 폰트 적용 후 레이아웃이 안정될 때까지 2프레임 대기
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}
```

CI에서 폰트 파일이 없어 폴백이 쓰이는 경우도 흔하다. 자체 호스팅(`next/font/local`)을 쓰면 네트워크 의존이 사라져 결정론이 올라간다.

```ts
// ✅ 자체 호스팅 + 폴백 메트릭 조정 비활성화(스냅샷 안정성 우선)
import localFont from 'next/font/local';

export const sans = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-sans',
  preload: true,
});
```

---

### V-DET-05 — 이미지와 미디어 로딩

**WHY**
이미지가 아직 도착하지 않으면 빈 영역이 찍히고, lazy loading 이미지는 뷰포트에 들어와야 로드되므로 full page 캡처 시 하단이 비어 있다. `next/image`의 blur placeholder는 전환 중간 상태가 찍힐 수 있다. 외부 이미지(아바타 CDN, 지도 타일)는 응답 시간이 매번 달라진다.

**DETECT**

```bash
rg -n "loading=\"lazy\"|priority" src --glob "*.tsx"
rg -n "placeholder=\"blur\"|blurDataURL" src
rg -n "https?://" src --glob "*.tsx" | rg -i "img|avatar|image|cdn" | head -20
rg -n "<iframe|<video|<canvas" src
```

**REPRODUCE**

```ts
test('캡처 시점에 모든 이미지가 디코드되어 있다', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const notReady = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')];
    await Promise.all(imgs.map(img =>
      img.complete ? Promise.resolve() : img.decode().catch(() => {})));
    return imgs
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.currentSrc || img.src);
  });

  expect(notReady, `미로드 이미지:\n${notReady.join('\n')}`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 모든 이미지가 `complete && naturalWidth > 0`. full page 캡처 시 lazy 이미지까지 로드되어 있다.
- FAIL: 빈 이미지 영역 캡처, blur placeholder 중간 상태 캡처.

**FIX**

```ts
// ✅ full page 캡처 전 lazy 이미지 강제 로드 + 디코드 대기
export async function loadAllImages(page: Page) {
  // 1. lazy 해제
  await page.evaluate(() => {
    for (const img of document.querySelectorAll('img')) {
      img.loading = 'eager';
      img.removeAttribute('data-nimg-lazy');
    }
  });

  // 2. 전체 스크롤로 IntersectionObserver 트리거
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const total = document.body.scrollHeight;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });

  // 3. 디코드 완료 대기
  await page.evaluate(() => Promise.all(
    [...document.querySelectorAll('img')].map(img =>
      img.complete ? Promise.resolve() : img.decode().catch(() => {}))));
}
```

외부 이미지는 로컬 픽스처로 대체해 네트워크 변동을 제거한다.

```ts
// ✅ 외부 아바타를 고정 이미지로 라우팅
await page.route('**/avatars.example.com/**', route =>
  route.fulfill({ path: 'tests/fixtures/avatar.png', contentType: 'image/png' }));

// ✅ 지도 타일 등 통제 불가 리소스는 차단하고 대체 배경
await page.route('**/tiles.example.com/**', route =>
  route.fulfill({ status: 200, contentType: 'image/png', path: 'tests/fixtures/tile.png' }));
```

---

### V-DET-06 — 네트워크·데이터 고정

**WHY**
실제 API를 호출하면 데이터가 바뀔 때마다 스냅샷이 실패한다. 개발 DB의 레코드 하나가 추가되면 전체 시각 테스트가 무너진다. 또 응답 순서와 지연이 매번 달라 로딩 상태가 섞여 찍힌다. 시각 QA는 **고정된 데이터**에서 수행해야 한다.

**DETECT**

```bash
rg -n "fetch\(|axios|useQuery|useSWR" src | wc -l
rg -n "process.env.NEXT_PUBLIC_API" src
fd -e json . tests/fixtures 2>/dev/null | head -20
rg -n "msw|setupServer|page.route" tests 2>/dev/null | head -20
```

**REPRODUCE**

```ts
test('API 응답 고정 후 반복 캡처가 동일하다', async ({ page }) => {
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    const fixture = fixtureFor(url.pathname);
    if (!fixture) return route.continue();
    return route.fulfill({ json: fixture });
  });

  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-fixed.png');
});
```

**PASS / FAIL**

- PASS: 모든 시각 테스트가 고정 픽스처에서 실행되고, 데이터 변경 없이 3회 반복 diff 0.
- FAIL: 실 API 의존으로 데이터 변동 시 실패.

**FIX**

```ts
// tests/fixtures/api.ts — 경로별 픽스처 매핑
import dashboard from './data/dashboard.json';
import members from './data/members.json';

const FIXTURES: Record<string, unknown> = {
  '/api/metrics/summary': dashboard.summary,
  '/api/metrics/revenue': dashboard.revenue,
  '/api/members': members,
};

export async function mockApi(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = overrides[path] ?? FIXTURES[path];
    if (data === undefined) {
      // 정의되지 않은 엔드포인트는 명시적으로 실패시켜 누락을 드러낸다
      return route.fulfill({ status: 501, body: JSON.stringify({ error: `no fixture: ${path}` }) });
    }
    return route.fulfill({ json: data as any });
  });
}
```

정의되지 않은 엔드포인트를 조용히 통과시키면 어떤 데이터가 실 API에서 오는지 모르게 된다. 501로 실패시켜 픽스처 누락을 강제로 드러낸다.

---

### V-DET-07 — 스크롤 위치와 뷰포트 상태

**WHY**
이전 테스트에서 스크롤한 상태가 남거나, `scrollIntoView`가 비동기로 진행 중이면 캡처 위치가 달라진다. sticky 요소는 스크롤 위치에 따라 모양이 바뀌고, 스크롤 기반 애니메이션(패럴랙스, 헤더 축소)은 중간 상태를 만든다. full page 캡처는 Playwright가 내부적으로 스크롤하며 찍으므로 sticky 요소가 여러 번 나타나는 현상도 발생한다.

**DETECT**

```bash
rg -n "sticky|fixed" src --glob "*.tsx" | wc -l
rg -n "useScroll|scrollY|onScroll|IntersectionObserver" src
rg -n "scroll-behavior|scrollIntoView" src
```

**REPRODUCE**

```ts
test('full page 캡처에서 sticky 요소가 중복되지 않는다', async ({ page }) => {
  await page.goto('/dashboard');
  await waitForVisualStability(page);
  await expect(page).toHaveScreenshot('dashboard-full.png', { fullPage: true });
  // 결과 이미지를 눈으로 확인: 헤더가 여러 번 나타나면 FAIL
});
```

**PASS / FAIL**

- PASS: 캡처 전 스크롤이 항상 top으로 초기화된다. full page 캡처에서 sticky 요소가 한 번만 나타난다.
- FAIL: 스크롤 잔류로 캡처 위치 변동, sticky 중복 렌더.

**FIX**

```ts
// ✅ 캡처 전 스크롤 초기화
export async function resetScroll(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollTop) el.scrollTop = 0;
      if (el.scrollLeft) el.scrollLeft = 0;
    }
  });
  await page.waitForTimeout(50);
}
```

sticky 중복은 full page 캡처의 구조적 한계다. 두 가지 해법 중 선택한다.

```ts
// 해법 A: 캡처 중 sticky를 static으로 (권장)
await page.addStyleTag({
  content: `[data-sticky], .sticky, header { position: static !important; }`,
});

// 해법 B: full page 대신 뷰포트 캡처 + 섹션별 element 캡처
await expect(page.getByRole('banner')).toHaveScreenshot('header.png');
await expect(page.getByTestId('metrics-grid')).toHaveScreenshot('metrics.png');
```

해법 B가 유지보수에 유리하다. full page 스냅샷은 한 줄만 바뀌어도 전체가 실패하지만, element 스냅샷은 변경 범위를 정확히 알려준다(6장 참조).

---

### V-DET-08 — 렌더링 환경 차이

**WHY**
GPU 가속 여부, 안티에일리어싱 방식, 서브픽셀 렌더링, `deviceScaleFactor`가 다르면 같은 코드도 다른 픽셀을 만든다. 특히 텍스트 경계와 곡선(border-radius)에서 1~2px 차이가 발생한다. 로컬(Windows, GPU 있음)과 CI(Linux, headless, SwiftShader)는 거의 항상 다르다.

**DETECT**

```bash
# 기준선이 어느 환경에서 만들어졌는지 확인
git log --format="%H %ad %an" -1 -- tests/visual/__screenshots__ 
rg -n "channel:|headless|deviceScaleFactor" playwright.config.*
```

**REPRODUCE**

```ts
test('렌더링 환경 정보 기록', async ({ page, browserName }) => {
  await page.goto('/');
  const env = await page.evaluate(() => ({
    dpr: window.devicePixelRatio,
    ua: navigator.userAgent,
    platform: navigator.platform,
    // WebGL 렌더러 (GPU vs SwiftShader 판별)
    renderer: (() => {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a';
    })(),
  }));
  console.log(browserName, JSON.stringify(env, null, 2));
});
```

**PASS / FAIL**

- PASS: 기준선 생성 환경과 검증 환경이 동일하다(동일 도커 이미지 또는 동일 CI 러너).
- FAIL: 환경 불일치로 상시 diff 발생. **결함이 아니라 운영 문제**이며 22장에서 해결한다.

**FIX**

```yaml
# .github/workflows/visual.yml — 컨테이너로 환경 고정
jobs:
  visual:
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm playwright test tests/visual
```

로컬에서도 같은 이미지로 기준선을 갱신한다.

```bash
docker run --rm --ipc=host \
  -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  bash -lc "pnpm install --frozen-lockfile && pnpm build && pnpm playwright test tests/visual --update-snapshots"
```

`deviceScaleFactor`를 1로 고정하면 파일 크기와 diff 노이즈가 줄어든다. 고DPI 검증이 필요한 항목만 별도 프로젝트로 분리한다.

---

### V-DET-09 — 결정론 게이트 통합

앞선 8개 항목을 하나의 헬퍼로 묶어 모든 시각 테스트가 동일한 전처리를 거치게 한다.

```ts
// tests/visual/helpers/stabilize.ts
import type { Page } from '@playwright/test';

export type StabilizeOptions = {
  fixedTime?: string;
  loadImages?: boolean;
  disableSticky?: boolean;
};

/** 페이지 로드 전에 적용해야 하는 것들 */
export async function prepareDeterminism(page: Page, opts: StabilizeOptions = {}) {
  const { fixedTime = '2026-07-30T09:00:00+09:00' } = opts;

  await page.clock.setFixedTime(new Date(fixedTime));

  await page.addInitScript(() => {
    // 랜덤 고정
    let seed = 42;
    Math.random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    // UUID 고정
    let uuidCounter = 0;
    if (crypto && 'randomUUID' in crypto) {
      // @ts-expect-error - 테스트 전용
      crypto.randomUUID = () =>
        `00000000-0000-4000-8000-${String(uuidCounter++).padStart(12, '0')}`;
    }
  });
}

/** 캡처 직전에 적용해야 하는 것들 */
export async function stabilizeForCapture(page: Page, opts: StabilizeOptions = {}) {
  const { loadImages = true, disableSticky = false } = opts;

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
      .animate-spin, .animate-pulse, .animate-bounce, .animate-ping {
        animation: none !important;
      }
      ${disableSticky ? '.sticky, [data-sticky] { position: static !important; }' : ''}
    `,
  });

  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  if (loadImages) {
    await page.evaluate(() => {
      for (const img of document.querySelectorAll('img')) img.loading = 'eager';
    });
    await page.evaluate(() => Promise.all(
      [...document.querySelectorAll('img')].map(img =>
        img.complete ? Promise.resolve() : img.decode().catch(() => {}))));
  }

  await page.evaluate(() => {
    for (const a of document.getAnimations()) { a.finish(); a.cancel(); }
    window.scrollTo(0, 0);
  });

  await page.evaluate(() => new Promise<void>(r =>
    requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}
```

```ts
// tests/visual/fixtures.ts — 픽스처로 강제 적용
import { test as base, expect } from '@playwright/test';
import { prepareDeterminism, stabilizeForCapture } from './helpers/stabilize';
import { mockApi } from '../fixtures/api';

export const test = base.extend<{ visualPage: Page }>({
  visualPage: async ({ page }, use) => {
    await prepareDeterminism(page);
    await mockApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await use(page);
  },
});

export { expect, stabilizeForCapture };
```

**게이트 판정**

```bash
# 3회 연속 실행 diff 0을 확인한 뒤에만 6장으로 진행
pnpm playwright test tests/visual --repeat-each=3 --reporter=list
```

한 건이라도 flaky하면 그 테스트를 격리하고 원인을 V-DET-01~08에서 찾는다. flaky 상태로 두면 팀이 diff를 무시하기 시작한다.

---

## 6. 스냅샷 전략

### 6.1 스냅샷을 쓸 곳과 쓰지 말아야 할 곳

시각 QA 실패의 두 번째 원인은 **잘못된 도구 선택**이다. 아래 표를 기준으로 나눈다.

| 검증 대상 | 도구 | 이유 |
|-----------|------|------|
| "이 화면이 지난주와 달라졌는가" | 스냅샷 | 변화 자체가 관심사 |
| "버튼 패딩이 12px 16px인가" | 계산 스타일 어설션 | 실패 메시지에 기대/실제가 나온다 |
| "색상이 토큰을 쓰는가" | 계산 스타일 어설션 | 스냅샷은 어느 색인지 알려주지 않는다 |
| "다크 모드가 적용되는가" | 스냅샷 + 어설션 병행 | 전체 인상 + 개별 값 |
| "요소가 겹치는가" | 좌표 어설션 | 픽셀 diff보다 정확하고 원인을 알려준다 |
| "차트가 올바르게 그려지는가" | 스냅샷 | 값 어설션으로 표현 불가 |
| "아이콘이 렌더되는가" | 스냅샷 또는 DOM 어설션 | 상황에 따라 |
| "레이아웃이 무너지는가" | 좌표 어설션 우선 + 스냅샷 보조 | 원인 추적 가능성 |

**원칙:** 어설션으로 표현할 수 있으면 어설션을 쓴다. 스냅샷은 "말로 규칙을 쓸 수 없는 것"에만 쓴다.

### V-SNAP-01 — 스냅샷 입도 선택

**WHY**
full page 스냅샷 하나로 페이지 전체를 검증하면 편해 보이지만, 헤더의 한 픽셀이 바뀌어도 전체가 실패하고 diff 이미지에서 원인을 찾기 어렵다. 반대로 모든 요소를 개별 스냅샷으로 만들면 수백 개 파일이 생겨 유지가 불가능하고 리뷰가 무의미해진다. 입도는 **변경 단위**와 맞춰야 한다.

**입도 선택 기준**

| 입도 | 사용처 | 장점 | 단점 |
|------|--------|------|------|
| **Component** (Storybook/격리 렌더) | 디자인 시스템 컴포넌트 | 변경 원인이 명확, 빠름, 안정적 | 실제 조합 상황을 놓침 |
| **Element** (섹션 단위) | 헤더, 카드 그리드, 테이블, 차트 | 실패 범위가 좁음, 재사용 검증 | 섹션 간 관계를 놓침 |
| **Viewport** (첫 화면) | 랜딩, 대시보드 fold | 실제 첫인상 검증 | 아래 콘텐츠 미검증 |
| **Full page** | 마케팅 페이지, 문서 | 전체 흐름 검증 | 취약, 원인 추적 어려움 |

**DETECT**

```bash
rg -n "toHaveScreenshot" tests | wc -l
rg -n "fullPage: true" tests | wc -l
fd -e png . --glob "**/__screenshots__/**" | wc -l
# 가장 큰 스냅샷 = 가장 취약한 스냅샷
fd -e png . --glob "**/__screenshots__/**" -x ls -la {} | sort -k5 -rn | head -10
```

full page 비율이 50%를 넘으면 입도 재설계가 필요하다.

**REPRODUCE**

```ts
// 입도 비교 실험: 동일 변경에 대해 어느 쪽이 더 유용한 신호를 주는가
test('full page vs element 실패 범위 비교', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  // full page — 어디가 바뀌었는지 알기 어렵다
  await expect(page).toHaveScreenshot('dashboard-full.png', { fullPage: true });

  // element — 실패한 스냅샷 이름이 곧 원인 위치다
  await expect(page.getByRole('banner')).toHaveScreenshot('dashboard-header.png');
  await expect(page.getByTestId('metrics-grid')).toHaveScreenshot('dashboard-metrics.png');
  await expect(page.getByTestId('activity-feed')).toHaveScreenshot('dashboard-activity.png');
});
```

**PASS / FAIL**

- PASS: 입도가 변경 단위와 맞고, 실패 시 스냅샷 이름만으로 원인 영역을 특정할 수 있다. full page 비율이 30% 이하다.
- FAIL: full page 위주 구성으로 실패 원인 추적 불가(S3, 운영 품질 문제), 스냅샷 수가 관리 한계 초과.

**FIX**

```ts
// ✅ 권장 구성: 컴포넌트 + 섹션 중심, full page는 소수
// tests/visual/dashboard.spec.ts
const SECTIONS = [
  { id: 'header',   locator: (p: Page) => p.getByRole('banner') },
  { id: 'sidebar',  locator: (p: Page) => p.getByRole('complementary') },
  { id: 'metrics',  locator: (p: Page) => p.getByTestId('metrics-grid') },
  { id: 'chart',    locator: (p: Page) => p.getByTestId('revenue-chart') },
  { id: 'activity', locator: (p: Page) => p.getByTestId('activity-feed') },
];

for (const section of SECTIONS) {
  test(`대시보드 ${section.id} 시각 회귀`, async ({ visualPage: page }) => {
    await page.goto('/dashboard');
    await stabilizeForCapture(page);
    await expect(section.locator(page)).toHaveScreenshot(`dashboard-${section.id}.png`);
  });
}
```

**BAD**

```ts
// ❌ 모든 페이지를 full page 하나로 — 한 픽셀 변경에 전부 실패
test('전체 시각 회귀', async ({ page }) => {
  for (const route of ALL_ROUTES) {
    await page.goto(route);
    await expect(page).toHaveScreenshot(`${route}.png`, { fullPage: true });
  }
});
```

---

### V-SNAP-02 — 임계값 설정

**WHY**
Playwright의 스냅샷 비교에는 세 가지 파라미터가 있고 역할이 다르다. 혼동하면 탐지력을 잃거나 flaky를 얻는다.

| 파라미터 | 의미 | 권장값 |
|----------|------|--------|
| `threshold` | 픽셀 하나를 "다르다"고 판정할 색 차이 민감도 (0~1, YIQ 색공간) | `0.2` (기본값) |
| `maxDiffPixels` | 허용할 다른 픽셀의 **절대 개수** | 작은 요소에 유용 |
| `maxDiffPixelRatio` | 허용할 다른 픽셀의 **비율** | `0.005~0.01` |

`threshold`를 낮추면(0.05) 안티에일리어싱까지 잡아내 flaky해지고, 높이면(0.5) 색 변경을 놓친다. 기본값 0.2를 유지하고 비율로 노이즈를 흡수하는 것이 안정적이다.

**DETECT**

```bash
rg -n "maxDiffPixelRatio|maxDiffPixels|threshold" playwright.config.* tests
```

값이 테스트마다 제각각이면 기준이 없는 것이다.

**REPRODUCE**

임계값이 적절한지 확인하는 방법은 **일부러 작은 변경을 넣어보는 것**이다.

```bash
# 1. 버튼 색을 한 단계만 바꾼다 (예: primary-600 → primary-500)
# 2. 시각 테스트 실행
pnpm playwright test tests/visual
# 3. 실패해야 정상. 통과하면 임계값이 너무 관대하다.
```

**PASS / FAIL**

- PASS: 프로젝트 전역에 단일 기준이 설정되어 있고(config), 개별 예외에는 사유 주석이 있다. 색 한 단계 변경이 탐지된다.
- FAIL: 테스트마다 임의 임계값(S3), 명백한 변경을 놓치는 관대한 설정(S2 — 탐지력 상실).

**FIX**

```ts
// playwright.config.ts — 전역 단일 기준
expect: {
  toHaveScreenshot: {
    threshold: 0.2,
    maxDiffPixelRatio: 0.005,
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',        // deviceScaleFactor와 무관하게 CSS 픽셀 기준
  },
},
```

```ts
// ✅ 예외는 사유를 남긴다
await expect(chart).toHaveScreenshot('revenue-chart.png', {
  // 차트 라이브러리가 안티에일리어싱을 비결정적으로 처리해 곡선 경계에 노이즈 발생
  maxDiffPixelRatio: 0.02,
});
```

**BAD**

```ts
// ❌ 사유 없는 관대한 임계값 — 사실상 테스트 무력화
await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.1 });
```

---

### V-SNAP-03 — 마스킹 전략

**WHY**
상대 시간, 실시간 카운터, 아바타 이미지, 랜덤 그래픽처럼 통제할 수 없는 요소는 마스킹해야 한다. 그런데 마스킹을 남용하면 화면 절반이 가려져 검증 가치가 사라진다. 또 마스킹 영역의 **크기 변화**는 여전히 diff를 만들므로, 텍스트 길이가 변하는 요소는 마스킹만으로 부족하다.

**DETECT**

```bash
rg -n "mask:" tests | wc -l
rg -n "data-testid=\"(relative-time|live-|random-|avatar)" src
```

마스킹된 영역이 캡처 면적의 20%를 넘으면 재검토가 필요하다.

**REPRODUCE**

```ts
test('마스킹 면적 비율 측정', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const ratio = await page.evaluate(() => {
    const targets = [...document.querySelectorAll('[data-mask]')];
    const total = document.body.getBoundingClientRect();
    const masked = targets.reduce((s, el) => {
      const r = el.getBoundingClientRect();
      return s + r.width * r.height;
    }, 0);
    return masked / (total.width * total.height);
  });

  expect(ratio, `마스킹 면적 ${(ratio * 100).toFixed(1)}%`).toBeLessThan(0.2);
});
```

**PASS / FAIL**

- PASS: 마스킹 대상이 명시적 `data-testid`를 갖고, 면적이 20% 이하이며, 마스킹 요소의 크기가 고정되어 있다.
- FAIL: 과도한 마스킹으로 검증 가치 상실(S3), 마스킹 요소 크기 변동으로 여전히 flaky(결정론 문제).

**FIX**

마스킹보다 **값 고정**을 우선한다. 고정할 수 없을 때만 마스킹한다.

```tsx
// ✅ 1순위: 값을 고정 가능하게 만든다
<time dateTime={iso} data-testid="relative-time">
  {process.env.NEXT_PUBLIC_E2E === '1' ? '3분 전' : formatRelative(iso)}
</time>
```

```tsx
// ✅ 2순위: 크기가 고정된 마스킹 대상
<span
  data-testid="live-counter"
  className="inline-block w-16 text-right tabular-nums"  // 폭 고정 → 마스킹이 안정적
>
  {count}
</span>
```

```ts
// ✅ 3순위: 마스킹
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.getByTestId('relative-time'),
    page.getByTestId('live-counter'),
    page.getByTestId('user-avatar'),
  ],
  maskColor: '#FF00FF',  // 눈에 띄는 색 → 마스킹 범위를 리뷰에서 확인 가능
});
```

`maskColor`를 배경과 비슷한 색으로 두면 리뷰어가 무엇이 가려졌는지 모른다. 형광색을 써서 마스킹 범위 자체를 리뷰 대상으로 만든다.

**BAD**

```ts
// ❌ 문제가 생길 때마다 마스킹 추가 → 결국 아무것도 검증하지 않는다
mask: [
  page.locator('header'), page.locator('aside'),
  page.locator('.card'), page.locator('table'),
],
```

---

### V-SNAP-04 — 스냅샷 명명과 조직

**WHY**
`test-1.png`, `screenshot.png` 같은 이름은 실패했을 때 무엇인지 알 수 없다. 또 Playwright는 프로젝트명과 플랫폼을 파일명에 자동으로 붙이므로, 프로젝트를 많이 만들면 스냅샷 수가 곱연산으로 늘어난다. 200개 스냅샷 × 5개 프로젝트 = 1,000개 파일은 리뷰가 불가능하다.

**DETECT**

```bash
fd -e png . --glob "**/__screenshots__/**" | sed 's/.*\///' | head -30
fd -e png . --glob "**/__screenshots__/**" | wc -l
du -sh tests/visual/__screenshots__ 2>/dev/null
```

**REPRODUCE**

스냅샷 수를 추정한다.

```text
스냅샷 총수 = 테스트 케이스 수 × 프로젝트 수
예: 라우트 8 × 섹션 5 × 테마 2 = 80 케이스
    프로젝트: chromium-1440, chromium-390, webkit-1440 = 3
    → 240 파일
```

**PASS / FAIL**

- PASS: 이름이 `<영역>-<대상>-<변형>.png` 규칙을 따르고, 총 파일 수가 프로젝트 관리 한계(권장 300개) 이하이며, 저장소 용량 증가가 통제된다.
- FAIL: 의미 없는 이름(S3), 파일 수 폭증으로 리뷰 불가(S3), 저장소 비대화.

**FIX**

```ts
// ✅ 명명 규칙: 영역-대상-변형
await expect(el).toHaveScreenshot(`dashboard-metrics-${theme}.png`);
await expect(el).toHaveScreenshot(`button-primary-${size}-${state}.png`);
await expect(page).toHaveScreenshot(`marketing-home-${width}.png`);
```

```ts
// playwright.config.ts — 경로 템플릿으로 디렉토리 정리
snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
```

프로젝트 곱연산을 줄이는 방법:

```ts
// ✅ 시각 스냅샷은 대표 프로젝트에서만, 기능 테스트는 전 프로젝트에서
projects: [
  {
    name: 'visual',                       // 스냅샷 전용: 단일 환경
    testMatch: /visual\/.*\.spec\.ts/,
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  },
  {
    name: 'visual-mobile',
    testMatch: /visual\/mobile\/.*\.spec\.ts/,
    use: { ...devices['Pixel 7'] },
  },
  {
    name: 'functional-webkit',            // 기능 전용: 스냅샷 없음
    testMatch: /e2e\/.*\.spec\.ts/,
    use: { ...devices['Desktop Safari'] },
  },
],
```

크로스 브라우저 시각 검증(18장)은 별도 프로젝트로 분리하고, 대상을 P0 화면으로 제한한다.

---

### V-SNAP-05 — 컴포넌트 격리 렌더링

**WHY**
페이지 전체를 로드해 컴포넌트를 검증하면 (a) 느리고, (b) 페이지의 다른 변경에 영향을 받고, (c) 모든 variant 조합을 만들기 어렵다. 컴포넌트를 격리 렌더하면 24개 variant를 하나의 그리드 스냅샷으로 검증할 수 있어 속도와 커버리지가 동시에 올라간다.

**DETECT**

```bash
rg -n "storybook|@storybook" package.json
fd -e stories.tsx | wc -l
rg -n "experimental-ct|playwright-ct" package.json
fd . tests/visual -e spec.ts | head -20
```

**REPRODUCE**

세 가지 방법 중 프로젝트에 맞는 것을 선택한다.

**방법 A — 전용 QA 라우트 (가장 간단하고 의존성 없음)**

```tsx
// app/(dev)/visual-catalog/page.tsx
// 프로덕션 빌드에서 제외하거나 미들웨어로 차단한다
import { notFound } from 'next/navigation';

const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const SIZES = ['sm', 'default', 'lg', 'icon'] as const;

export default function VisualCatalog() {
  if (process.env.NEXT_PUBLIC_ENABLE_VISUAL_CATALOG !== '1') notFound();

  return (
    <main className="space-y-12 p-8">
      <section data-testid="catalog-button">
        <h2 className="mb-4 text-sm font-semibold">Button</h2>
        <div className="grid w-fit grid-cols-4 gap-4">
          {VARIANTS.flatMap(variant =>
            SIZES.map(size => (
              <div key={`${variant}-${size}`} className="flex flex-col items-start gap-1">
                <span className="text-[10px] text-muted-foreground">{variant}/{size}</span>
                <Button variant={variant} size={size}>
                  {size === 'icon' ? <PlusIcon className="size-4" /> : '버튼'}
                </Button>
              </div>
            )))}
        </div>
      </section>
    </main>
  );
}
```

```ts
// tests/visual/components.spec.ts
test('Button 전체 variant', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);
  await expect(page.getByTestId('catalog-button')).toHaveScreenshot('button-matrix.png');
});
```

**방법 B — Storybook + Playwright**

```ts
// tests/visual/storybook.spec.ts
import stories from '../../storybook-static/index.json';

const entries = Object.values(stories.entries as Record<string, any>)
  .filter(e => e.type === 'story');

for (const story of entries) {
  test(`story: ${story.id}`, async ({ visualPage: page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await stabilizeForCapture(page);
    await expect(page.locator('#storybook-root')).toHaveScreenshot(`${story.id}.png`);
  });
}
```

**방법 C — Playwright Component Testing**

```tsx
// tests/ct/button.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from '@/components/ui/button';

test('Button primary', async ({ mount }) => {
  const component = await mount(<Button>버튼</Button>);
  await expect(component).toHaveScreenshot('button-primary.png');
});
```

**PASS / FAIL**

- PASS: 디자인 시스템 컴포넌트의 모든 variant × size × state 조합이 격리 스냅샷으로 커버된다.
- FAIL: 컴포넌트 검증이 페이지 스냅샷에만 의존(S3 — 변경 파급을 놓침).

**FIX**
방법 A를 기본 권장한다. Storybook이 이미 있으면 방법 B가 낫다. 방법 C는 설정 비용이 크고 실제 스타일 환경과 미묘하게 달라질 수 있어 마지막 선택지다.

QA 라우트는 반드시 프로덕션에서 차단한다.

```ts
// middleware.ts
if (request.nextUrl.pathname.startsWith('/visual-catalog')
    && process.env.NODE_ENV === 'production'
    && process.env.ENABLE_VISUAL_CATALOG !== '1') {
  return NextResponse.rewrite(new URL('/404', request.url));
}
```

---

### V-SNAP-06 — 스냅샷 유지보수 비용 관리

**WHY**
스냅샷은 자산이 아니라 **부채**다. 하나 늘어날 때마다 (a) 저장소 용량, (b) 리뷰 부담, (c) 갱신 비용, (d) flaky 위험이 함께 늘어난다. 500개 스냅샷을 가진 프로젝트는 디자인 변경 한 번에 500개를 갱신해야 하고, 그 순간 아무도 diff를 보지 않는다.

**DETECT**

```bash
# 스냅샷 수와 크기 추이
fd -e png . --glob "**/__screenshots__/**" | wc -l
du -sh tests/visual/__screenshots__

# 최근 갱신 빈도 = 불안정 신호
git log --format="%ad" --date=short -- tests/visual/__screenshots__ | uniq -c | head -20

# 한 번도 실패한 적 없는 스냅샷 = 가치 낮음 (CI 로그 기반 판단)
```

**REPRODUCE**

분기마다 아래를 점검한다.

```text
[ ] 최근 6개월간 한 번도 실패하지 않은 스냅샷이 있는가 → 삭제 후보
[ ] 최근 6개월간 5회 이상 갱신된 스냅샷이 있는가 → 불안정, 어설션으로 대체 검토
[ ] 동일 컴포넌트를 여러 스냅샷이 중복 커버하는가 → 통합
[ ] full page 스냅샷을 element로 분해할 수 있는가
```

**PASS / FAIL**

- PASS: 스냅샷 수가 상한(권장 300) 이하이고, 갱신 빈도가 높은 스냅샷의 원인이 파악되어 있다.
- FAIL: 무한 증가, 갱신이 일상화되어 리뷰가 형식화됨(S3 — 운영 실패).

**FIX**

```text
스냅샷 삭제 기준
- 같은 컴포넌트를 다른 스냅샷이 이미 커버한다
- 변경 빈도가 극히 낮은 정적 요소이며 어설션으로 대체 가능하다
- 반복적으로 flaky하고 원인 제거가 어렵다 (어설션으로 전환)

스냅샷 유지 기준
- 디자인 시스템 컴포넌트 매트릭스
- P0 라우트의 첫 화면
- 차트·그래픽처럼 어설션으로 표현 불가한 것
- 과거에 실제 회귀를 잡아낸 이력이 있는 것
```

용량 관리는 파일 형식과 스케일로 해결한다.

```ts
// ✅ deviceScaleFactor 1 + CSS 스케일 → 파일 크기 1/4
use: { deviceScaleFactor: 1 },
expect: { toHaveScreenshot: { scale: 'css' } },
```

Git LFS를 쓰면 저장소 클론 속도는 개선되지만 diff 리뷰가 어려워진다. PNG 원본을 그대로 커밋하되 개수를 통제하는 편이 낫다.

---

## 7. Layout과 Spacing

### V-LAY-01 — 간격 토큰 정합성

**WHY**
`gap-4`, `p-6` 같은 토큰 대신 `mt-[13px]`, `padding: 18px`가 섞이면 화면의 리듬이 무너진다. 개별 화면에서는 눈에 띄지 않지만, 여러 화면을 나란히 놓으면 제품이 조립되지 않은 인상을 준다. 더 중요한 문제는 **디자인 변경 시 일괄 수정이 불가능**해진다는 것이다.

**DETECT**

```bash
# 임의값 간격 유틸리티
rg -o "(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-\[[^\]]+\]" src \
  | sort | uniq -c | sort -rn

# 인라인 스타일 간격
rg -n "style=\{\{[^}]*(padding|margin|gap)" src --glob "*.tsx"

# CSS 파일의 하드코딩
rg -n "(padding|margin|gap):\s*[0-9]+px" src --glob "*.css"
```

4px 배수가 아닌 임의값(13px, 18px, 22px)이 나오면 거의 확실한 이탈이다.

**REPRODUCE**

계산 스타일로 검증한다. 스냅샷이 아니다.

```ts
// tests/visual/tokens.spec.ts
const SPACING_SCALE = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];

test('간격이 스케일을 벗어나지 않는다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const offScale = await page.evaluate((scale) => {
    const results: any[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      if (el.offsetParent === null) continue;
      const cs = getComputedStyle(el);
      const props = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                     'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'gap'] as const;
      for (const p of props) {
        const raw = cs[p];
        if (!raw || raw === 'normal') continue;
        const v = parseFloat(raw);
        if (Number.isNaN(v) || v === 0) continue;
        // 소수점 값은 % 계산 결과일 수 있으므로 정수만 검사
        if (!Number.isInteger(v)) continue;
        if (!scale.includes(v)) {
          results.push({
            tag: el.tagName,
            className: String(el.className).slice(0, 70),
            prop: p,
            value: v,
          });
        }
      }
    }
    return results.slice(0, 30);
  }, SPACING_SCALE);

  expect(offScale, JSON.stringify(offScale, null, 2)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 모든 간격이 정의된 스케일 값이다. 임의값 유틸리티가 0건이거나 사유 주석이 있다.
- FAIL: 스케일 이탈 간격 존재. 단건이면 S3, 컴포넌트 전반에 퍼져 있으면 S2.

**FIX**

**BAD**

```tsx
// ❌ 시안에서 눈대중으로 측정한 값 → 스케일 이탈
<div className="mt-[13px] gap-[18px] p-[22px]">
  <Card className="mb-[7px]" />
</div>
```

**GOOD**

```tsx
// ✅ 스케일 값 사용
<div className="mt-3 gap-5 p-6">
  <Card className="mb-2" />
</div>
```

스케일에 없는 값이 정말 필요하면 **토큰을 추가**한다. 임의값을 흩뿌리지 않는다.

```js
// tailwind.config.ts
spacing: {
  // 기존 스케일 + 프로젝트 고유 값
  'card-gutter': '1.375rem',   // 22px — 카드 내부 전용, 디자인 승인됨
},
```

**REGRESSION**

```ts
test('임의값 간격 유틸리티가 도입되지 않는다', async () => {
  const { stdout } = await execAsync(
    `rg -o "(p|m|gap|space-[xy])-\\[[^\\]]+\\]" src --glob "*.tsx" || true`);
  const hits = stdout.trim().split('\n').filter(Boolean);
  const allowed = new Set(['gap-[1px]']); // 승인된 예외
  const violations = hits.filter(h => !allowed.has(h.trim()));
  expect(violations, violations.join('\n')).toEqual([]);
});
```

이 검사는 시각 테스트가 아니라 lint 규칙으로 옮기는 것이 더 낫다. `eslint-plugin-tailwindcss`의 `no-arbitrary-value` 규칙을 검토한다.

---

### V-LAY-02 — 정렬(Alignment) 일관성

**WHY**
같은 화면 안에서 어떤 카드는 왼쪽 24px, 어떤 카드는 왼쪽 26px에서 시작하면 눈은 "무언가 어긋났다"고 인지하지만 원인을 특정하지 못한다. 이런 미세 어긋남은 border 두께, `box-sizing`, 아이콘의 내부 여백, 서로 다른 컨테이너 패딩에서 생긴다. 픽셀 diff는 이를 "변경 없음"으로 통과시키므로 **좌표 어설션**이 필요하다.

**DETECT**

```bash
rg -n "items-|justify-|self-|place-" src --glob "*.tsx" | head -40
rg -n "border|ring-" src --glob "*.tsx" | rg -c "px-|pl-|pr-"
rg -n "text-left|text-center|text-right" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
test('섹션 제목들이 동일한 좌측 기준선에 정렬된다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const lefts = await page.getByRole('heading', { level: 2 }).evaluateAll(els =>
    els.map(el => ({
      text: (el.textContent ?? '').trim().slice(0, 24),
      left: Math.round(el.getBoundingClientRect().left * 10) / 10,
    })));

  const unique = [...new Set(lefts.map(l => l.left))];
  expect(unique.length, `제목 좌측 기준이 ${unique.length}종: ${JSON.stringify(lefts)}`).toBe(1);
});

test('카드 그리드가 균일한 간격을 갖는다', async ({ visualPage: page }) => {
  const boxes = await page.getByTestId('metric-card').evaluateAll(els =>
    els.map(el => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
    }));

  // 같은 행의 카드들
  const firstRow = boxes.filter(b => b.y === boxes[0].y).sort((a, b) => a.x - b.x);
  const gaps = firstRow.slice(1).map((b, i) => b.x - (firstRow[i].x + firstRow[i].w));
  const uniqueGaps = [...new Set(gaps)];
  expect(uniqueGaps.length, `간격 불균일: ${gaps}`).toBeLessThanOrEqual(1);
});
```

**PASS / FAIL**

- PASS: 동일 위계 요소의 정렬 기준선이 일치한다(±1px). 그리드 간격이 균일하다. 아이콘과 텍스트의 광학 중심이 맞는다.
- FAIL: 기준선 2종 이상(S2), 간격 불균일(S3), 아이콘-텍스트 수직 어긋남(S3).

**FIX**

가장 흔한 원인 세 가지와 해법.

```tsx
// ❌ 원인 1: border가 box 크기에 더해져 내부 콘텐츠가 밀린다
<div className="border-2 p-6">A</div>
<div className="p-6">B</div>   {/* A보다 2px 안쪽에서 시작 */}

// ✅ 투명 border로 공간을 예약해 정렬 유지
<div className="border-2 border-primary p-6">A</div>
<div className="border-2 border-transparent p-6">B</div>
```

```tsx
// ❌ 원인 2: 컨테이너마다 다른 패딩
<section className="px-6"><h2>지표</h2></section>
<section className="px-8"><h2>활동</h2></section>

// ✅ 공통 레이아웃 컴포넌트로 패딩을 한 곳에서 관리
function Section({ title, children }: Props) {
  return (
    <section className="px-6 lg:px-8">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
```

```tsx
// ❌ 원인 3: 아이콘의 내부 여백 때문에 텍스트와 광학 중심이 어긋난다
<span className="flex items-center gap-2">
  <Icon className="size-4" />
  라벨
</span>

// ✅ 아이콘에 shrink-0 + 라인 정렬 보정
<span className="inline-flex items-center gap-2 leading-none">
  <Icon aria-hidden="true" className="size-4 shrink-0" />
  <span className="leading-normal">라벨</span>
</span>
```

---

### V-LAY-03 — 수직 리듬과 섹션 간격

**WHY**
섹션 간 간격이 48 / 52 / 44px로 제각각이면 스크롤할 때 화면이 불안정하게 느껴진다. 특히 여러 사람이 만든 페이지에서 각자 다른 `mb-*`를 붙이면 리듬이 사라진다. 또 인접 형제의 margin이 겹치는(margin collapse) 경우 예상보다 좁아지고, `space-y-*`와 개별 `mb-*`가 섞이면 이중 간격이 생긴다.

**DETECT**

```bash
rg -n "space-y-[0-9]+" src --glob "*.tsx" -A3 | rg "mb-[0-9]+"   # 이중 간격 후보
rg -o "mb-(1[0-9]|2[0-9]|3[0-9])" src | sort | uniq -c | sort -rn
rg -n "py-(1[0-9]|2[0-9])" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
test('섹션 간 수직 간격이 일관된다', async ({ visualPage: page }) => {
  await page.goto('/');
  await stabilizeForCapture(page);

  const gaps = await page.evaluate(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section')];
    const out: number[] = [];
    for (let i = 1; i < sections.length; i++) {
      const prev = sections[i - 1].getBoundingClientRect();
      const cur = sections[i].getBoundingClientRect();
      out.push(Math.round(cur.top - prev.bottom));
    }
    return out;
  });

  const unique = [...new Set(gaps)];
  expect(unique.length, `섹션 간격 ${unique.length}종: ${gaps}`).toBeLessThanOrEqual(2);
});
```

**PASS / FAIL**

- PASS: 섹션 간격이 1~2종으로 수렴한다. `space-y`와 개별 margin이 중복 적용되지 않는다.
- FAIL: 간격 3종 이상(S3), 이중 간격으로 예상의 2배(S2).

**FIX**

```tsx
// ❌ space-y와 개별 mb가 겹쳐 96px가 된다
<div className="space-y-12">
  <Section className="mb-12">A</Section>
  <Section>B</Section>
</div>

// ✅ 간격 책임을 부모 한 곳에 둔다
<div className="space-y-12">
  <Section>A</Section>
  <Section>B</Section>
</div>
```

```css
/* ✅ 리듬을 CSS 변수로 정의해 전역 조정 가능하게 */
:root {
  --section-gap: 4rem;
  --section-gap-lg: 6rem;
}

.page-sections > * + * {
  margin-top: var(--section-gap);
}

@media (min-width: 1024px) {
  .page-sections > * + * { margin-top: var(--section-gap-lg); }
}
```

---

### V-LAY-04 — 요소 겹침과 잘림

**WHY**
겹침은 픽셀 diff에서 "변경됨"으로 나오지만 어디가 무엇을 가리는지 알려주지 않는다. 좌표 기반 검사는 "요소 A의 우측 40px이 요소 B에 가려짐"처럼 원인을 직접 지목한다. 텍스트 잘림도 마찬가지로 `scrollWidth > clientWidth` 비교로 정확히 잡을 수 있다.

**DETECT**

```bash
rg -n "absolute|fixed" src --glob "*.tsx" | wc -l
rg -n "overflow-hidden" src --glob "*.tsx" | head -30
rg -n "whitespace-nowrap|truncate|line-clamp" src --glob "*.tsx" | head -30
rg -n "h-\[[0-9]+px\]|max-h-\[[0-9]+px\]" src --glob "*.tsx"
```

**REPRODUCE**

```ts
// 의도치 않은 텍스트 잘림 탐지
test('의도하지 않은 텍스트 잘림이 없다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,span,label,button,td,th,a')]
      .filter(el => el.offsetParent !== null && (el.textContent ?? '').trim().length > 0)
      .filter(el => {
        const cs = getComputedStyle(el);
        // 의도적 클램프/트렁케이트는 제외
        if (cs.textOverflow === 'ellipsis') return false;
        if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') return false;
        return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      })
      .slice(0, 20)
      .map(el => ({
        tag: el.tagName,
        text: (el.textContent ?? '').trim().slice(0, 40),
        className: String(el.className).slice(0, 70),
        overflowX: el.scrollWidth - el.clientWidth,
        overflowY: el.scrollHeight - el.clientHeight,
      })));

  expect(clipped, JSON.stringify(clipped, null, 2)).toEqual([]);
});
```

```ts
// 인터랙티브 요소 가림 탐지
test('버튼과 링크가 다른 요소에 가려지지 않는다', async ({ visualPage: page }) => {
  const obscured = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a[href], input')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        if (r.top < 0 || r.bottom > window.innerHeight) return false;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const top = document.elementFromPoint(cx, cy);
        return top !== el && !el.contains(top) && !top?.contains(el);
      })
      .slice(0, 15)
      .map(el => ({
        tag: el.tagName,
        label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30),
      })));

  expect(obscured, JSON.stringify(obscured)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 의도하지 않은 잘림 0건. 인터랙티브 요소가 가려지지 않는다.
- FAIL: 텍스트 잘림으로 정보 손실(S2), 버튼 가림으로 클릭 불가(**S1**).

**FIX**

- 고정 높이(`h-[40px]`)를 `min-h-*`로 바꿔 내용에 따라 자라게 한다.
- `whitespace-nowrap`이 필요한 곳에는 `min-w-0`과 컨테이너 폭 정책을 함께 둔다.
- 의도적 잘림에는 반드시 `truncate` 또는 `line-clamp-*`를 명시해 검사에서 제외되게 한다. 그래야 의도와 사고를 구분할 수 있다.

```tsx
// ✅ 의도를 코드로 표현: 잘림은 명시적으로
<span className="block truncate" title={fullName}>{fullName}</span>
<p className="line-clamp-2">{description}</p>
```

---

### V-LAY-05 — 컨테이너 폭과 중앙 정렬

**WHY**
같은 페이지 안에서 어떤 섹션은 `max-w-6xl`, 어떤 섹션은 `max-w-7xl`을 쓰면 스크롤할 때 콘텐츠 폭이 들쭉날쭉해진다. 사용자는 원인을 모른 채 "정돈되지 않았다"고 느낀다. 또 `mx-auto`를 빠뜨린 섹션 하나가 왼쪽에 붙어 전체 리듬을 깬다.

**DETECT**

```bash
rg -o "max-w-(screen-)?[a-z0-9]+" src --glob "*.tsx" | sort | uniq -c | sort -rn
rg -n "max-w-" src --glob "*.tsx" | rg -v "mx-auto" | head -20
```

`max-w-*`가 있는데 `mx-auto`가 없는 줄은 조사 후보다.

**REPRODUCE**

```ts
test('섹션 콘텐츠 폭과 중앙 정렬이 일관된다', async ({ visualPage: page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await stabilizeForCapture(page);

  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main > section')]
      .map(sec => {
        const inner = sec.firstElementChild as HTMLElement | null;
        const r = (inner ?? sec).getBoundingClientRect();
        return {
          label: (sec.getAttribute('data-section') ?? sec.className).slice(0, 40),
          left: Math.round(r.left),
          right: Math.round(window.innerWidth - r.right),
          width: Math.round(r.width),
        };
      }));

  // 폭 종류가 2종 이하
  const widths = [...new Set(boxes.map(b => b.width))];
  expect(widths.length, `콘텐츠 폭 ${widths.length}종: ${JSON.stringify(boxes)}`).toBeLessThanOrEqual(2);

  // 좌우 여백 대칭
  for (const b of boxes) {
    expect(Math.abs(b.left - b.right), `${b.label} 비대칭 (L${b.left}/R${b.right})`)
      .toBeLessThanOrEqual(2);
  }
});
```

**PASS / FAIL**

- PASS: 콘텐츠 폭이 1~2종으로 수렴하고, 좌우 여백이 대칭이다(±2px).
- FAIL: 폭 3종 이상(S3), 비대칭 정렬(S2 — 명확히 인지됨).

**FIX**

```tsx
// ✅ 컨테이너를 컴포넌트로 고정
function Container({ children, className, size = 'default' }: Props) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-screen-xl',
        size === 'wide' && 'max-w-screen-2xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
```

폭 종류를 3개(narrow / default / wide)로 제한하고 이름을 부여하면 사용처에서 의도가 드러나고 일관성이 유지된다.

---

### V-LAY-06 — 그리드와 카드 비율

**WHY**
카드 그리드에서 카드마다 높이가 다르면 하단이 들쭉날쭉해진다. 이미지 비율이 고정되지 않으면 로드 후 카드 높이가 변해 CLS가 발생한다. 또 마지막 행에 카드가 하나만 남으면 전체 폭으로 늘어나 다른 카드와 다른 크기가 되는 문제도 흔하다.

**DETECT**

```bash
rg -n "grid-cols|auto-fit|auto-fill" src --glob "*.tsx" | head -20
rg -n "aspect-|aspect-ratio" src --glob "*.tsx"
rg -n "items-stretch|items-start|h-full" src --glob "*card*"
```

**REPRODUCE**

```ts
test('카드 그리드의 높이와 폭이 균일하다', async ({ visualPage: page }) => {
  await page.goto('/blog');
  await stabilizeForCapture(page);

  const cards = await page.getByTestId('post-card').evaluateAll(els =>
    els.map(el => {
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width) };
    }));

  // 같은 행 카드들의 높이가 동일
  const rows = new Map<number, typeof cards>();
  for (const c of cards) {
    const arr = rows.get(c.y) ?? [];
    arr.push(c);
    rows.set(c.y, arr);
  }
  for (const [y, rowCards] of rows) {
    const heights = [...new Set(rowCards.map(c => c.h))];
    expect(heights.length, `y=${y} 행 높이 불균일: ${heights}`).toBe(1);
  }

  // 모든 카드 폭이 동일 (마지막 행 포함)
  const widths = [...new Set(cards.map(c => c.w))];
  expect(widths.length, `카드 폭 불균일: ${widths}`).toBe(1);
});
```

**PASS / FAIL**

- PASS: 같은 행 카드 높이가 동일하고, 마지막 행을 포함해 모든 카드 폭이 같다. 이미지 영역이 고정 비율을 갖는다.
- FAIL: 행 내 높이 불균일(S3), 마지막 행 카드가 늘어남(S2), 이미지 로드 후 높이 변동(S2 — CLS).

**FIX**

```tsx
// ✅ 카드 내부를 flex column으로 만들어 높이를 채우고 하단 정렬
<article className="flex h-full flex-col overflow-hidden rounded-lg border">
  {/* 이미지 비율 고정 → 로드 전후 높이 동일 */}
  <div className="relative aspect-[16/9] w-full bg-muted">
    <Image src={post.cover} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
  </div>
  <div className="flex flex-1 flex-col p-5">
    <h3 className="line-clamp-2 font-semibold">{post.title}</h3>
    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
    {/* mt-auto로 하단 고정 → 카드마다 다른 본문 길이에도 정렬 유지 */}
    <div className="mt-auto pt-4 text-xs text-muted-foreground">{post.date}</div>
  </div>
</article>
```

마지막 행 카드가 늘어나는 문제는 `auto-fit`을 `auto-fill`로 바꾸거나 최대 폭을 지정해 해결한다.

```tsx
// ❌ auto-fit: 항목이 적으면 남은 공간을 나눠 가져 카드가 커진다
grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));

// ✅ auto-fill: 빈 트랙을 유지해 카드 폭이 일정하다
grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));

// ✅ 또는 최대 폭을 함께 지정
grid-template-columns: repeat(auto-fit, minmax(18rem, 24rem));
```

---

## 8. Typography

### V-TYPO-01 — 타입 스케일 준수

**WHY**
글자 크기가 13, 14, 15, 16, 17px처럼 촘촘하게 흩어지면 시각 위계가 사라진다. 사용자는 "이것이 제목인지 본문인지" 순간적으로 판단할 수 없고, 화면이 평평하게 보인다. 타입 스케일은 보통 6~8단계로 제한되어야 하며, 그 이상은 관리 실패다.

**DETECT**

```bash
rg -o "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)" src --glob "*.tsx" \
  | sed 's/.*://' | sort | uniq -c | sort -rn

rg -o "text-\[[0-9.]+(px|rem)\]" src | sort | uniq -c | sort -rn
rg -n "font-size:\s*[0-9]" src --glob "*.css"
```

임의값 `text-[15px]`가 있으면 이탈이다.

**REPRODUCE**

```ts
test('폰트 크기가 타입 스케일 안에 있다', async ({ visualPage: page }) => {
  // Tailwind 기본 스케일 (프로젝트 설정에 맞춰 조정)
  const SCALE_PX = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];

  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const offScale = await page.evaluate((scale) => {
    const seen = new Map<number, string[]>();
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      if (el.offsetParent === null) continue;
      if (!el.textContent?.trim()) continue;
      // 직접 텍스트 노드를 가진 요소만
      const hasDirectText = [...el.childNodes].some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      if (!hasDirectText) continue;

      const size = Math.round(parseFloat(getComputedStyle(el).fontSize));
      if (!scale.includes(size)) {
        const arr = seen.get(size) ?? [];
        if (arr.length < 3) arr.push(String(el.className).slice(0, 60));
        seen.set(size, arr);
      }
    }
    return [...seen].map(([size, samples]) => ({ size, samples }));
  }, SCALE_PX);

  expect(offScale, JSON.stringify(offScale, null, 2)).toEqual([]);
});

test('한 화면의 폰트 크기 종류가 6개 이하다', async ({ visualPage: page }) => {
  const sizes = await page.evaluate(() => {
    const set = new Set<number>();
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      if (el.offsetParent === null || !el.textContent?.trim()) continue;
      set.add(Math.round(parseFloat(getComputedStyle(el).fontSize)));
    }
    return [...set].sort((a, b) => a - b);
  });
  expect(sizes.length, `폰트 크기 ${sizes.length}종: ${sizes}`).toBeLessThanOrEqual(6);
});
```

**PASS / FAIL**

- PASS: 모든 폰트 크기가 스케일 값이고, 한 화면에서 6종 이하를 사용한다.
- FAIL: 스케일 이탈(S3), 한 화면 8종 이상으로 위계 소실(S2).

**FIX**

```tsx
// ❌ 눈대중 크기 → 위계가 흐려진다
<h2 className="text-[19px]">지표</h2>
<p className="text-[15px]">최근 30일 기준</p>

// ✅ 스케일 사용 + 의미론적 컴포넌트
<h2 className="text-xl font-semibold">지표</h2>
<p className="text-sm text-muted-foreground">최근 30일 기준</p>
```

반복되는 조합은 컴포넌트나 유틸리티 클래스로 고정한다.

```css
/* app/globals.css */
@layer components {
  .text-heading-1 { @apply text-3xl font-bold tracking-tight lg:text-4xl; }
  .text-heading-2 { @apply text-2xl font-semibold tracking-tight; }
  .text-heading-3 { @apply text-lg font-semibold; }
  .text-body      { @apply text-base leading-relaxed; }
  .text-caption   { @apply text-sm text-muted-foreground; }
}
```

---

### V-TYPO-02 — 줄 높이와 자간

**WHY**
줄 높이가 너무 좁으면(1.1) 여러 줄 본문이 뭉쳐 읽기 어렵고, 너무 넓으면(2.0) 문단의 응집이 사라진다. 큰 제목은 줄 높이를 좁게, 본문은 넓게 하는 것이 원칙인데 전역 `leading-normal` 하나로 통일하면 제목이 뜨고 본문이 답답해진다. 자간도 큰 글자에서는 좁혀야(`tracking-tight`) 자연스럽다.

**DETECT**

```bash
rg -o "leading-[a-z0-9]+" src --glob "*.tsx" | sort | uniq -c | sort -rn
rg -o "tracking-[a-z]+" src --glob "*.tsx" | sort | uniq -c
rg -n "line-height:" src --glob "*.css"
```

**REPRODUCE**

```ts
test('본문과 제목의 줄 높이가 적절하다', async ({ visualPage: page }) => {
  await page.goto('/docs/guide');
  await stabilizeForCapture(page);

  const metrics = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('article h1, article h2, article h3, article p')]
      .filter(el => el.offsetParent !== null && (el.textContent ?? '').length > 10)
      .map(el => {
        const cs = getComputedStyle(el);
        const fontSize = parseFloat(cs.fontSize);
        const lineHeight = parseFloat(cs.lineHeight);
        return {
          tag: el.tagName,
          fontSize,
          lineHeight,
          ratio: +(lineHeight / fontSize).toFixed(2),
        };
      }));

  for (const m of metrics) {
    if (m.tag === 'P') {
      // 본문: 1.5~1.8
      expect(m.ratio, `본문 줄높이 비율 ${m.ratio}`).toBeGreaterThanOrEqual(1.5);
      expect(m.ratio).toBeLessThanOrEqual(1.9);
    } else {
      // 제목: 1.1~1.4
      expect(m.ratio, `${m.tag} 줄높이 비율 ${m.ratio}`).toBeGreaterThanOrEqual(1.05);
      expect(m.ratio).toBeLessThanOrEqual(1.45);
    }
  }
});
```

**PASS / FAIL**

- PASS: 본문 줄 높이 비율 1.5~1.8, 제목 1.1~1.4. 큰 제목에 `tracking-tight`가 적용된다. WCAG 1.4.12의 1.5배 확대에서도 잘리지 않는다(01/03 문서 참조).
- FAIL: 본문 1.4 이하로 답답함(S3), 제목 1.6 이상으로 흩어짐(S3), 한글 본문에 자간이 과도하게 넓음(S3).

**FIX**

```tsx
// ✅ 크기에 따라 줄 높이·자간을 함께 조정
<h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
  {title}
</h1>
<p className="text-base leading-relaxed text-muted-foreground">
  {body}
</p>
```

한글은 라틴보다 글자 밀도가 높아 줄 높이를 조금 더 넉넉하게(1.7~1.8) 잡는 편이 읽기 좋다. 프로젝트 기본값을 언어에 맞춰 조정한다.

```js
// tailwind.config.ts
fontSize: {
  base: ['1rem', { lineHeight: '1.75rem' }],   // 1.75 비율
  lg: ['1.125rem', { lineHeight: '1.875rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
},
```

---

### V-TYPO-03 — 폰트 폴백과 FOUT/FOIT

**WHY**
웹폰트 로드 전에 폴백 폰트로 렌더되면(FOUT) 글자 폭이 달라 레이아웃이 흔들리고, 아예 숨기면(FOIT) 텍스트가 잠깐 사라진다. 특히 한글 폰트는 파일이 크고(서브셋 없이 수 MB) 폴백과 메트릭 차이가 커서 전환이 눈에 띈다. 이는 CLS로 이어진다.

**DETECT**

```bash
rg -n "next/font" src app -A8
rg -n "font-display|display:\s*(swap|block|optional|fallback)" src app
rg -n "adjustFontFallback|fallback:" src app
rg -n "preload" src/app/layout.tsx 2>/dev/null
```

**REPRODUCE**

```ts
test('폰트 전환으로 인한 CLS가 없다', async ({ page }) => {
  // 캐시 없는 상태 + 느린 네트워크에서 폰트 전환이 드러난다
  const context = page.context();
  await context.clearCookies();

  const cls = await page.evaluate(() => new Promise<number>(resolve => {
    let total = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 3000);
  }));

  expect(cls, `폰트 전환 CLS ${cls}`).toBeLessThan(0.1);
});

test('폴백 체인이 한글을 포함한다', async ({ page }) => {
  await page.goto('/');
  const stack = await page.evaluate(() =>
    getComputedStyle(document.body).fontFamily);
  expect(stack).toMatch(/Apple SD Gothic Neo|Malgun Gothic|Noto Sans KR|Pretendard/i);
});
```

**PASS / FAIL**

- PASS: `font-display: swap` + 메트릭 조정으로 전환 시 CLS < 0.1. 폴백 체인에 플랫폼별 한글 폰트가 포함된다. 주요 폰트가 preload된다.
- FAIL: 폰트 전환으로 CLS 0.1 초과(S2), 폴백 누락으로 플랫폼별 글꼴 불일치(S3), FOIT로 텍스트 미표시(S2).

**FIX**

```ts
// ✅ next/font/local + 메트릭 조정 + preload
import localFont from 'next/font/local';

export const sans = localFont({
  src: [
    { path: './fonts/Pretendard-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Pretendard-Medium.woff2',  weight: '500', style: 'normal' },
    { path: './fonts/Pretendard-Bold.woff2',    weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  fallback: [
    '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
    'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'sans-serif',
  ],
});
```

`adjustFontFallback`은 폴백 폰트의 메트릭을 조정해 전환 시 레이아웃 이동을 줄인다. 다만 시각 스냅샷의 안정성 관점에서는 폰트가 항상 로드되게 하는 것(`preload: true` + 자체 호스팅)이 더 확실하다.

---

### V-TYPO-04 — 텍스트 색 대비

**WHY**
`text-gray-400`을 흰 배경에 쓰면 대비가 2.8:1로 WCAG AA(4.5:1)에 미달한다. 디자이너의 캘리브레이션된 모니터에서는 읽히지만 저가 패널이나 밝은 사무실에서는 보이지 않는다. 다크 모드에서는 반대 방향으로 같은 문제가 생긴다. 이것은 시각 QA와 접근성 QA가 겹치는 영역이며, 시각 QA에서 먼저 잡는 것이 싸다.

**DETECT**

```bash
rg -n "text-(gray|slate|zinc|neutral|stone)-(300|400)" src --glob "*.tsx"
rg -n "text-muted-foreground" src --glob "*.tsx" | wc -l
rg -n "opacity-(30|40|50|60)" src --glob "*.tsx" | rg -i "text|label|span|p " | head -20
rg -n "--muted-foreground|--foreground" app/globals.css src/app/globals.css 2>/dev/null
```

**REPRODUCE**

```ts
// tests/visual/contrast.spec.ts
function relativeLuminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test.describe('텍스트 대비', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} 모드 본문 대비 4.5:1 이상`, async ({ visualPage: page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/dashboard');
      await stabilizeForCapture(page);

      const low = await page.evaluate(() => {
        function parse(c: string): [number, number, number] {
          const m = c.match(/\d+(\.\d+)?/g)!;
          return [Number(m[0]), Number(m[1]), Number(m[2])];
        }
        function lum(rgb: [number, number, number]) {
          const [r, g, b] = rgb.map(v => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        function effectiveBg(el: HTMLElement): [number, number, number] {
          let node: HTMLElement | null = el;
          while (node) {
            const bg = getComputedStyle(node).backgroundColor;
            if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return parse(bg);
            node = node.parentElement;
          }
          return [255, 255, 255];
        }

        const out: any[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('main *')) {
          if (el.offsetParent === null) continue;
          const hasText = [...el.childNodes].some(
            n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
          if (!hasText) continue;

          const cs = getComputedStyle(el);
          const fg = parse(cs.color);
          const bg = effectiveBg(el);
          const l1 = lum(fg), l2 = lum(bg);
          const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

          const size = parseFloat(cs.fontSize);
          const bold = Number(cs.fontWeight) >= 700;
          const isLarge = size >= 24 || (size >= 18.66 && bold);
          const required = isLarge ? 3 : 4.5;

          if (ratio < required) {
            out.push({
              text: (el.textContent ?? '').trim().slice(0, 30),
              className: String(el.className).slice(0, 60),
              color: cs.color,
              ratio: +ratio.toFixed(2),
              required,
            });
          }
        }
        return out.slice(0, 20);
      });

      expect(low, JSON.stringify(low, null, 2)).toEqual([]);
    });
  }
});
```

**PASS / FAIL**

- PASS: 라이트·다크 두 테마에서 본문 4.5:1, 큰 텍스트 3:1 이상.
- FAIL: 대비 미달. 본문이면 S2, 오류 메시지나 필수 안내면 S1.

**FIX**

**개별 클래스가 아니라 토큰에서 고친다.**

```css
/* ❌ 화면마다 다른 회색을 골라 쓰기 */
.hint { color: #9CA3AF; }   /* 흰 배경 대비 2.8:1 → 미달 */

/* ✅ 토큰을 조정하면 전역이 해결된다 */
:root {
  --muted-foreground: 215 16% 40%;   /* 흰 배경 대비 5.2:1 */
}
.dark {
  --muted-foreground: 215 20% 68%;   /* 어두운 배경 대비 5.6:1 */
}
```

placeholder는 예외적으로 낮은 대비가 허용되지만, 그래서 **placeholder를 라벨 대신 쓰면 안 된다.**

---

### V-TYPO-05 — 텍스트 줄바꿈과 균형

**WHY**
제목이 "구독 플랜을 업그레이드하고 더 많은\n기능을" 처럼 어색한 위치에서 끊기면 읽기 흐름이 방해된다. 마지막 줄에 단어 하나만 남는 현상(orphan/widow)도 완성도를 떨어뜨린다. 한글은 어절 단위 줄바꿈이 기본이지만 긴 URL이나 영문 혼용에서 문제가 생긴다.

**DETECT**

```bash
rg -n "text-wrap|text-balance|text-pretty|break-words|break-all|word-break" src
rg -n "<h1|<h2" src --glob "*.tsx" | wc -l
rg -n "word-break: keep-all|overflow-wrap" src --glob "*.css"
```

**REPRODUCE**

```ts
test('제목이 균형 있게 줄바꿈된다', async ({ visualPage: page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/pricing');
  await stabilizeForCapture(page);

  const orphans = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('h1, h2, h3')]
      .filter(el => el.offsetParent !== null)
      .map(el => {
        const cs = getComputedStyle(el);
        const lineHeight = parseFloat(cs.lineHeight);
        const lines = Math.round(el.getBoundingClientRect().height / lineHeight);
        return {
          text: (el.textContent ?? '').trim().slice(0, 50),
          lines,
          textWrap: cs.textWrap ?? (cs as any).textWrapStyle ?? 'auto',
        };
      })
      .filter(x => x.lines >= 2 && x.textWrap !== 'balance'));

  // 2줄 이상 제목에는 balance 적용 권장
  expect(orphans, `균형 처리 없는 다중 줄 제목:\n${JSON.stringify(orphans, null, 2)}`)
    .toEqual([]);
});
```

**PASS / FAIL**

- PASS: 다중 줄 제목에 `text-balance`가 적용된다. 긴 URL·식별자가 컨테이너를 넘지 않는다. 한글이 어절 단위로 끊긴다.
- FAIL: 마지막 줄에 단어 하나(S3), 긴 문자열이 레이아웃을 밀어냄(S2).

**FIX**

```tsx
// ✅ 제목은 balance, 본문은 pretty
<h1 className="text-balance text-4xl font-bold">
  구독 플랜을 업그레이드하고 더 많은 기능을 사용하세요
</h1>
<p className="text-pretty text-muted-foreground">
  {longDescription}
</p>
```

`text-wrap: balance`는 줄 길이를 고르게 맞추고, `text-pretty`는 마지막 줄의 orphan을 방지한다. 지원되지 않는 브라우저에서는 무시되므로 안전하다(점진 향상).

```css
/* ✅ 한글 줄바꿈 + 긴 문자열 안전장치 */
:root {
  word-break: keep-all;      /* 한글 어절 단위 줄바꿈 */
  overflow-wrap: break-word; /* 긴 단어는 강제 줄바꿈 */
}

/* URL·코드·식별자 전용 */
.break-anywhere {
  overflow-wrap: anywhere;
  word-break: break-all;
}
```

`word-break: keep-all`을 전역으로 두면 한글 가독성이 크게 개선되지만, 긴 영문 단어가 넘칠 수 있으므로 `overflow-wrap: break-word`를 반드시 함께 둔다.

---

## 9. Color와 Theme

### V-COLOR-01 — 색상 토큰 정합성

**WHY**
`#3B82F6`을 직접 쓰면 다크 모드에서 그대로 남아 배경과 충돌하고, 브랜드 색이 바뀔 때 전수 검색으로 고쳐야 한다. 토큰(`--primary`)을 쓰면 테마 전환과 리브랜딩이 한 곳에서 끝난다. 하드코딩 색상은 시각 QA에서 가장 자주 나오는 결함이다.

**DETECT**

```bash
# HEX / RGB / HSL 직접 사용
rg -n "#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b" src --glob "*.tsx" --glob "*.ts" \
  | rg -v "svg|icon|placeholder|maskColor" | head -40
rg -n "rgb\(|rgba\(|hsl\(|hsla\(" src --glob "*.tsx" | head -30

# Tailwind 팔레트 직접 사용 (토큰 대신)
rg -o "(bg|text|border|ring|fill|stroke)-(red|blue|green|yellow|purple|pink|indigo|slate|gray|zinc)-[0-9]{2,3}" src \
  | sort | uniq -c | sort -rn | head -30

# 임의값 색상
rg -o "(bg|text|border)-\[#[0-9a-fA-F]+\]" src | sort | uniq -c
```

**REPRODUCE**

```ts
test('사용된 색상이 토큰 팔레트 안에 있다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const palette = await page.evaluate(() => {
    // :root에 정의된 토큰 값을 수집
    const root = getComputedStyle(document.documentElement);
    const tokens = new Map<string, string>();
    for (const name of [
      '--background', '--foreground', '--card', '--card-foreground',
      '--popover', '--popover-foreground', '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
      '--border', '--input', '--ring',
    ]) {
      const v = root.getPropertyValue(name).trim();
      if (v) tokens.set(name, v);
    }
    return [...tokens];
  });

  console.log('토큰 팔레트:', JSON.stringify(palette, null, 2));

  // 실제 사용 색상 수집
  const used = await page.evaluate(() => {
    const colors = new Map<string, number>();
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      if (el.offsetParent === null) continue;
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor'] as const) {
        const v = cs[prop];
        if (!v || /rgba\(0, 0, 0, 0\)/.test(v)) continue;
        colors.set(v, (colors.get(v) ?? 0) + 1);
      }
    }
    return [...colors].sort((a, b) => b[1] - a[1]);
  });

  // 색상 종류가 과도하면 토큰 이탈 신호
  expect(used.length, `사용 색상 ${used.length}종:\n${JSON.stringify(used.slice(0, 30))}`)
    .toBeLessThanOrEqual(24);
});
```

**PASS / FAIL**

- PASS: 소스에 하드코딩 색상이 없다(SVG 자산 제외). 한 화면의 색상 종류가 토큰 수 범위 안이다.
- FAIL: 하드코딩 색상 존재. 다크 모드에 영향을 주면 S2, 단순 라이트 전용이면 S3.

**FIX**

```tsx
// ❌ 하드코딩 — 다크 모드에서 그대로 남는다
<div className="bg-[#F9FAFB] text-[#111827] border-[#E5E7EB]">
<span style={{ color: '#EF4444' }}>오류</span>

// ✅ 시맨틱 토큰
<div className="bg-muted text-foreground border-border">
<span className="text-destructive">오류</span>
```

토큰은 **시맨틱 이름**으로 정의한다. `--blue-500`이 아니라 `--primary`여야 다크 모드에서 다른 값을 넣을 수 있다.

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 40%;
    --border: 214 32% 91%;
    --destructive: 0 72% 51%;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 68%;
    --border: 217 33% 24%;
    --destructive: 0 63% 51%;
  }
}
```

---

### V-COLOR-02 — 다크 모드 전면 적용

**WHY**
다크 모드에서 가장 흔한 사고는 **일부 영역만 라이트로 남는 것**이다. 원인은 하드코딩 배경(`bg-white`), 인라인 스타일, 서드파티 위젯, `<img>` 안의 흰 배경 이미지, 그리고 `dark:` 변형을 빠뜨린 컴포넌트다. 사용자는 어두운 화면에서 갑자기 흰 블록을 만나 눈이 부신다.

**DETECT**

```bash
rg -n "bg-white|bg-black|text-white|text-black" src --glob "*.tsx" | rg -v "dark:" | head -30
rg -n "style=\{\{[^}]*(background|color)" src --glob "*.tsx"
rg -n "dark:" src --glob "*.tsx" | wc -l
rg -n "prefers-color-scheme|color-scheme" src app
```

`bg-white`가 `dark:bg-*` 없이 쓰인 곳은 거의 확실한 결함이다.

**REPRODUCE**

```ts
test('다크 모드에서 밝은 영역이 남지 않는다', async ({ visualPage: page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/dashboard');
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await stabilizeForCapture(page);

  const bright = await page.evaluate(() => {
    function parse(c: string) {
      const m = c.match(/\d+(\.\d+)?/g);
      return m ? [Number(m[0]), Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 1] : null;
    }

    const out: any[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 2000) continue;  // 작은 요소는 배지 등일 수 있으므로 제외

      const bg = parse(getComputedStyle(el).backgroundColor);
      if (!bg || bg[3] < 0.5) continue;

      const luminance = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
      if (luminance > 0.8) {
        out.push({
          tag: el.tagName,
          className: String(el.className).slice(0, 70),
          bg: getComputedStyle(el).backgroundColor,
          area: Math.round(r.width * r.height),
        });
      }
    }
    return out.slice(0, 15);
  });

  expect(bright, `다크 모드에 밝은 영역:\n${JSON.stringify(bright, null, 2)}`).toEqual([]);
});
```

두 테마의 스냅샷도 함께 남긴다.

```ts
for (const theme of ['light', 'dark'] as const) {
  test(`대시보드 시각 회귀 (${theme})`, async ({ visualPage: page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/dashboard');
    await page.evaluate((t) => {
      document.documentElement.classList.toggle('dark', t === 'dark');
    }, theme);
    await stabilizeForCapture(page);
    await expect(page).toHaveScreenshot(`dashboard-${theme}.png`);
  });
}
```

**PASS / FAIL**

- PASS: 다크 모드에서 큰 밝은 영역이 없다. 모든 P0 화면의 두 테마 스냅샷이 존재하고 정상이다. 폼 입력 필드의 배경·텍스트·경계가 모두 다크 대응된다.
- FAIL: 밝은 블록 잔류(S1 — 눈부심), 폼 입력값이 보이지 않음(**S0**), 일부 컴포넌트 미대응(S2).

**FIX**

```tsx
// ❌ 라이트 전용
<div className="bg-white text-gray-900 border-gray-200">

// ✅ 토큰 사용 → 테마 자동 대응
<div className="bg-card text-card-foreground border-border">

// ✅ 토큰이 없는 예외적 경우에만 dark: 변형
<div className="bg-white dark:bg-zinc-900">
```

브라우저 기본 UI(스크롤바, 폼 컨트롤, 자동완성)도 테마를 알아야 한다.

```css
/* ✅ 브라우저에 테마를 알려 네이티브 UI까지 대응 */
:root { color-scheme: light; }
.dark { color-scheme: dark; }
```

`color-scheme`을 설정하면 스크롤바, `<select>` 드롭다운, 날짜 피커, 자동완성 배경이 자동으로 다크가 된다. 이것을 빠뜨리면 폼 화면에서 흰 스크롤바와 흰 자동완성 배경이 남는다.

---

### V-COLOR-03 — 테마 전환 시 깜빡임(FOUC)

**WHY**
테마를 `useEffect`에서 `localStorage`를 읽어 적용하면, 첫 렌더는 항상 라이트로 나가고 하이드레이션 후 다크로 바뀐다. 사용자는 페이지를 열 때마다 흰 화면이 번쩍이는 것을 본다. 다크 모드 사용자에게는 매우 거슬리는 결함이며, 밤에는 실제로 눈이 부시다.

**DETECT**

```bash
rg -n "useEffect" src --glob "*theme*" -A6 | rg "localStorage|classList"
rg -n "next-themes" package.json src
rg -n "suppressHydrationWarning" src/app/layout.tsx 2>/dev/null
rg -n "dangerouslySetInnerHTML" src/app/layout.tsx 2>/dev/null
```

**REPRODUCE**

```ts
test('다크 모드 사용자에게 흰 화면 깜빡임이 없다', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();

  // 첫 페인트 시점의 배경색을 확인
  await page.goto('/', { waitUntil: 'commit' });
  const earlyBg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).backgroundColor);

  await page.waitForLoadState('load');
  const finalBg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).backgroundColor);

  expect(earlyBg, `초기 ${earlyBg} → 최종 ${finalBg}`).toBe(finalBg);
  await context.close();
});
```

영상으로도 확인한다.

```ts
test('테마 깜빡임 육안 확인', async ({ page }) => {
  // playwright.config에서 video: 'on'으로 두고 영상 프레임을 검토
  await page.goto('/');
  await page.waitForTimeout(1500);
});
```

**PASS / FAIL**

- PASS: 첫 페인트부터 올바른 테마가 적용된다. 새로고침·라우트 이동에서 깜빡임이 없다.
- FAIL: 흰 화면 깜빡임. 다크 사용자 전원이 매번 겪으므로 **S1**.

**FIX**

하이드레이션 이전에 테마를 결정해야 한다. 방법은 두 가지다.

```tsx
// ✅ 방법 A: 인라인 스크립트로 첫 페인트 전에 클래스 적용
// app/layout.tsx
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = stored === 'light' || stored === 'dark' ? stored : system;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// ✅ 방법 B: next-themes (내부적으로 같은 기법을 사용)
import { ThemeProvider } from 'next-themes';

<html lang="ko" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  </body>
</html>
```

`disableTransitionOnChange`는 테마 전환 시 모든 요소가 각자 다른 속도로 색을 바꾸며 생기는 무지개 현상을 막는다.

**BAD**

```tsx
// ❌ 하이드레이션 후 적용 → 매번 흰 화면 깜빡임
useEffect(() => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') document.documentElement.classList.add('dark');
}, []);
```

---

### V-COLOR-04 — 상태 색상의 의미 일관성

**WHY**
성공은 초록, 오류는 빨강, 경고는 노랑이라는 관습이 화면마다 다르게 적용되면 사용자는 상태를 오독한다. 어떤 화면에서 파란 배지가 "진행 중"이고 다른 화면에서 "완료"면 신뢰가 무너진다. 또 색상만으로 상태를 전달하면 색각 이상 사용자(남성 약 8%)는 구분할 수 없다.

**DETECT**

```bash
rg -o "(bg|text|border)-(green|red|yellow|amber|orange|blue)-[0-9]{3}" src \
  | sort | uniq -c | sort -rn
rg -n "success|error|warning|info|pending|active" src --glob "*badge*" --glob "*status*"
rg -n "variant=\"(success|destructive|warning)\"" src | wc -l
```

**REPRODUCE**

상태 배지를 한 화면에 모아 캡처한다.

```tsx
// app/(dev)/visual-catalog/page.tsx 에 추가
<section data-testid="catalog-status">
  <div className="flex flex-wrap gap-3">
    <Badge variant="success">완료</Badge>
    <Badge variant="warning">대기</Badge>
    <Badge variant="destructive">실패</Badge>
    <Badge variant="info">진행 중</Badge>
    <Badge variant="secondary">보관</Badge>
  </div>
</section>
```

```ts
test('상태 배지 팔레트', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);
  await expect(page.getByTestId('catalog-status')).toHaveScreenshot('status-badges.png');
});

test('상태가 색상만으로 전달되지 않는다', async ({ visualPage: page }) => {
  await page.goto('/settings/members');
  const badges = await page.getByTestId('status-badge').evaluateAll(els =>
    els.map(el => ({
      text: (el.textContent ?? '').trim(),
      hasIcon: !!el.querySelector('svg'),
      ariaLabel: el.getAttribute('aria-label'),
    })));

  for (const b of badges) {
    const hasNonColorCue = b.text.length > 0 || b.hasIcon || !!b.ariaLabel;
    expect(hasNonColorCue, `색상만으로 상태 전달: ${JSON.stringify(b)}`).toBe(true);
  }
});
```

색각 이상 시뮬레이션도 수행한다.

```ts
test('색각 이상 조건에서 상태 구분 가능', async ({ visualPage: page }) => {
  await page.goto('/settings/members');
  // 적록색약 근사 필터
  await page.addStyleTag({
    content: `
      html {
        filter: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><filter id="d"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter></svg>#d');
      }
    `,
  });
  await stabilizeForCapture(page);
  await expect(page).toHaveScreenshot('members-deuteranopia.png');
  // 결과를 눈으로 확인: 상태 구분이 가능한가
});
```

**PASS / FAIL**

- PASS: 상태별 색상이 전 화면에서 일관되고, 각 상태에 텍스트 또는 아이콘이 함께 있다. 색각 이상 시뮬레이션에서 구분 가능하다.
- FAIL: 화면마다 다른 의미(S2), 색상 단독 전달(S2 — WCAG 1.4.1 위반).

**FIX**

```tsx
// ✅ 상태를 컴포넌트로 고정하고 아이콘을 함께 제공
const STATUS_CONFIG = {
  success: { label: '완료',    icon: CheckCircleIcon, className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900' },
  warning: { label: '대기',    icon: ClockIcon,       className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' },
  error:   { label: '실패',    icon: XCircleIcon,     className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900' },
  info:    { label: '진행 중', icon: LoaderIcon,      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' },
} as const;

export function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      data-testid="status-badge"
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', config.className)}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {config.label}
    </span>
  );
}
```

색상 매핑을 한 객체에 모으면 일관성이 구조적으로 보장된다.

---

### V-COLOR-05 — 투명도와 겹침

**WHY**
`bg-white/80` 같은 반투명 배경은 뒤 콘텐츠에 따라 실제 색이 달라진다. 텍스트 대비가 배경 콘텐츠에 좌우되므로, 밝은 이미지 위에서는 읽히고 어두운 이미지 위에서는 읽히지 않는다. `backdrop-blur`를 함께 쓰면 브라우저마다 결과가 달라 시각 스냅샷도 불안정해진다.

**DETECT**

```bash
rg -o "(bg|text|border)-[a-z]+(-[0-9]+)?/[0-9]+" src | sort | uniq -c | sort -rn | head -20
rg -n "backdrop-blur|backdrop-filter" src
rg -n "opacity-[0-9]+" src --glob "*.tsx" | head -20
rg -n "mix-blend|bg-blend" src
```

**REPRODUCE**

```ts
test('반투명 오버레이 위 텍스트가 읽힌다', async ({ visualPage: page }) => {
  await page.goto('/');
  await stabilizeForCapture(page);

  // 히어로 이미지 위 텍스트처럼 배경이 변하는 곳을 지정 검사
  const hero = page.getByTestId('hero-overlay-text');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveScreenshot('hero-overlay.png');

  // 스크롤 시 배경이 바뀌는 sticky 헤더
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  await expect(page.getByRole('banner')).toHaveScreenshot('header-scrolled.png');
});
```

**PASS / FAIL**

- PASS: 반투명 배경 위 텍스트가 최악의 배경 조건(가장 밝은/어두운 콘텐츠 위)에서도 대비 4.5:1을 유지한다. `backdrop-blur` 미지원 시 폴백 배경이 불투명하다.
- FAIL: 특정 스크롤 위치나 이미지에서 텍스트 판독 불가(S1), 브라우저별 결과 차이(S3).

**FIX**

```tsx
// ❌ 배경 이미지에 따라 텍스트가 안 보일 수 있다
<div className="absolute inset-0 flex items-center bg-black/20">
  <h1 className="text-white">{title}</h1>
</div>

// ✅ 그라디언트 스크림으로 최소 대비를 보장
<div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/40 to-transparent">
  <h1 className="p-8 text-white drop-shadow-sm">{title}</h1>
</div>
```

```css
/* ✅ backdrop-blur는 점진 향상으로 */
.glass-header {
  background: hsl(var(--background));   /* 폴백: 불투명 */
}

@supports (backdrop-filter: blur(12px)) {
  .glass-header {
    background: hsl(var(--background) / 0.8);
    backdrop-filter: blur(12px);
  }
}
```

시각 스냅샷에서 `backdrop-blur`가 노이즈를 만들면, 해당 요소만 캡처 시 blur를 끄거나 임계값 예외를 사유와 함께 둔다.

---

### V-COLOR-06 — 강제 색상 모드와 인쇄

**WHY**
Windows 고대비 모드(`forced-colors: active`)에서는 브라우저가 색을 시스템 팔레트로 교체한다. `background-image`로 그린 아이콘이 사라지고, `box-shadow` 경계가 없어지며, 배경색으로만 구분하던 상태가 동일해진다. 인쇄에서도 배경색이 기본적으로 출력되지 않아 같은 문제가 생긴다.

**DETECT**

```bash
rg -n "forced-colors|@media print" src --glob "*.css" --glob "*.tsx"
rg -n "background-image|bg-\[url\(" src
rg -n "box-shadow" src --glob "*.css" | rg -i "border|separator|divider"
rg -n "print:" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('강제 색상 모드에서 UI가 식별된다', async ({ visualPage: page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/dashboard');
  await stabilizeForCapture(page);
  await expect(page).toHaveScreenshot('dashboard-forced-colors.png');

  // background-image 아이콘은 고대비에서 사라진다
  const bgIcons = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('*')]
      .filter(el => el.offsetParent !== null)
      .filter(el => {
        const bg = getComputedStyle(el).backgroundImage;
        return bg !== 'none' && /url\(/.test(bg);
      })
      .map(el => String(el.className).slice(0, 70)));
  expect(bgIcons, `고대비에서 소실될 아이콘: ${JSON.stringify(bgIcons)}`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 강제 색상 모드에서 아이콘·경계·포커스 링·상태 구분이 모두 보인다.
- FAIL: 아이콘 소실(S2), 경계 소실로 구조 파악 불가(S2), 포커스 링 소실(S1).

**FIX**

```css
@media (forced-colors: active) {
  /* box-shadow 경계를 실제 border로 대체 */
  .card, .dialog-content, .dropdown-content {
    border: 1px solid CanvasText;
  }

  /* 포커스 링을 시스템 색으로 */
  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  /* 활성 상태를 색 외 단서로 */
  [aria-current='page'] {
    border-left: 3px solid Highlight;
    font-weight: 600;
  }
}
```

아이콘은 인라인 SVG + `fill="currentColor"`를 사용한다. 고대비 모드에서 `currentColor`는 시스템 텍스트 색으로 자동 교체된다.

---

## 10. Border · Radius · Shadow · Elevation

### V-ELEV-01 — 반경(radius) 토큰 정합성

**WHY**
같은 화면에서 카드는 8px, 버튼은 6px, 입력은 7px 반경을 쓰면 형태 언어가 흐트러진다. 특히 중첩 요소에서 안쪽 반경이 바깥보다 크면 시각적으로 어색한 틈이 생긴다(concentric radius 규칙 위반). 반경은 브랜드 인상을 결정하는 요소이므로 토큰으로 관리해야 한다.

**DETECT**

```bash
rg -o "rounded(-[a-z0-9]+)?" src --glob "*.tsx" | sort | uniq -c | sort -rn
rg -o "rounded-\[[^\]]+\]" src | sort | uniq -c
rg -n "border-radius" src --glob "*.css"
rg -n "--radius" app/globals.css src/app/globals.css 2>/dev/null
```

**REPRODUCE**

```ts
test('반경이 토큰 값만 사용한다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const radii = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      if (el.offsetParent === null) continue;
      const r = getComputedStyle(el).borderRadius;
      if (!r || r === '0px') continue;
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  });

  expect(radii.length, `반경 ${radii.length}종: ${JSON.stringify(radii)}`).toBeLessThanOrEqual(5);
});

test('중첩 요소의 반경이 동심 규칙을 따른다', async ({ visualPage: page }) => {
  const violations = await page.evaluate(() => {
    const out: any[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      const outer = parseFloat(getComputedStyle(el).borderTopLeftRadius);
      if (!outer) continue;
      for (const child of el.children) {
        const inner = parseFloat(getComputedStyle(child as HTMLElement).borderTopLeftRadius);
        if (!inner) continue;
        const cr = (child as HTMLElement).getBoundingClientRect();
        const pr = el.getBoundingClientRect();
        const isFlush = Math.abs(cr.left - pr.left) < 2 && Math.abs(cr.top - pr.top) < 2;
        // 부모 경계에 붙은 자식의 반경이 부모보다 크면 어색한 틈이 생긴다
        if (isFlush && inner > outer) {
          out.push({
            parent: String(el.className).slice(0, 50),
            child: String((child as HTMLElement).className).slice(0, 50),
            outer, inner,
          });
        }
      }
    }
    return out.slice(0, 10);
  });

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 반경 종류가 5개 이하이고 모두 토큰에서 파생된다. 중첩 시 안쪽 ≤ 바깥쪽.
- FAIL: 반경 6종 이상(S3), 임의값 사용(S3), 동심 규칙 위반으로 시각적 틈(S3).

**FIX**

```css
/* ✅ 반경을 단일 변수에서 파생 */
:root {
  --radius: 0.5rem;
}
```

```js
// tailwind.config.ts
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
},
```

`--radius` 하나를 바꾸면 전체 형태 언어가 일관되게 변한다. 중첩 시에는 `안쪽 반경 = 바깥 반경 - 간격` 규칙을 적용한다.

```tsx
// ✅ 카드(lg) 안의 이미지는 한 단계 작게(md)
<div className="rounded-lg border p-1">
  <img className="rounded-md" />
</div>
```

---

### V-ELEV-02 — 그림자와 고도(elevation) 체계

**WHY**
그림자가 요소마다 제각각이면 어떤 것이 위에 떠 있는지 알 수 없다. 카드가 모달보다 진한 그림자를 가지면 시각적 위계가 뒤집힌다. 또 다크 모드에서는 검은 배경 위 검은 그림자가 거의 보이지 않으므로, 그림자만으로 층을 구분하던 UI가 평평해진다. 다크 모드에서는 **밝기 차이 또는 경계선**으로 고도를 표현해야 한다.

**DETECT**

```bash
rg -o "shadow(-[a-z0-9]+)?" src --glob "*.tsx" | sort | uniq -c | sort -rn
rg -o "shadow-\[[^\]]+\]" src | sort | uniq -c
rg -n "box-shadow" src --glob "*.css"
rg -n "dark:shadow|dark:bg-" src --glob "*card*" --glob "*dialog*"
```

**REPRODUCE**

```ts
test('그림자 단계가 고도와 일치한다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const shadows = await page.evaluate(() => {
    const map = new Map<string, { count: number; samples: string[] }>();
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.offsetParent === null) continue;
      const s = getComputedStyle(el).boxShadow;
      if (!s || s === 'none') continue;
      const entry = map.get(s) ?? { count: 0, samples: [] };
      entry.count++;
      if (entry.samples.length < 2) entry.samples.push(String(el.className).slice(0, 50));
      map.set(s, entry);
    }
    return [...map].map(([shadow, v]) => ({ shadow: shadow.slice(0, 60), ...v }));
  });

  expect(shadows.length, `그림자 ${shadows.length}종`).toBeLessThanOrEqual(5);
});

test('다크 모드에서 고도가 구분된다', async ({ visualPage: page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/dashboard');
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await stabilizeForCapture(page);

  // 카드가 배경과 구분되는 단서를 갖는가
  const cards = await page.getByTestId('metric-card').evaluateAll(els =>
    els.map(el => {
      const cs = getComputedStyle(el);
      const parentBg = getComputedStyle(el.parentElement!).backgroundColor;
      return {
        bg: cs.backgroundColor,
        parentBg,
        hasBorder: parseFloat(cs.borderTopWidth) > 0,
        differsFromParent: cs.backgroundColor !== parentBg,
      };
    }));

  for (const c of cards) {
    expect(c.hasBorder || c.differsFromParent,
      `다크 모드에서 카드가 배경과 구분되지 않음: ${JSON.stringify(c)}`).toBe(true);
  }
});
```

**PASS / FAIL**

- PASS: 그림자 단계가 5개 이하이고 고도 위계(카드 < 드롭다운 < 모달)와 일치한다. 다크 모드에서 경계선 또는 배경 밝기 차이로 고도가 구분된다.
- FAIL: 그림자 8종 이상(S3), 위계 역전(S2), 다크 모드에서 층 구분 불가(S2).

**FIX**

```js
// tailwind.config.ts — 고도별 이름 부여
boxShadow: {
  'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'elevation-4': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
},
```

```tsx
// ✅ 다크 모드는 배경 밝기 차이로 고도 표현
<div className="rounded-lg border bg-card shadow-elevation-2 dark:border-border dark:bg-zinc-900 dark:shadow-none">
```

머티리얼 디자인의 다크 테마 원칙처럼, **고도가 높을수록 배경을 밝게** 하는 방식이 다크 모드에서 가장 효과적이다.

```css
/* ✅ 고도별 표면 색 (다크 모드) */
.dark {
  --surface-0: 222 47% 11%;   /* 페이지 배경 */
  --surface-1: 222 40% 14%;   /* 카드 */
  --surface-2: 222 36% 17%;   /* 드롭다운 */
  --surface-3: 222 32% 20%;   /* 모달 */
}
```

---

### V-ELEV-03 — 경계선 일관성

**WHY**
경계선 색이 화면마다 다르면 구조가 흐트러져 보인다. 또 `border`와 `outline`과 `box-shadow: 0 0 0 1px`를 섞어 쓰면 두께가 미묘하게 달라지고 hover/focus 상태에서 어긋난다. 다크 모드에서 라이트용 경계 색을 그대로 쓰면 아예 보이지 않거나 지나치게 강해진다.

**DETECT**

```bash
rg -o "border-[a-z]+(-[0-9]+)?" src --glob "*.tsx" | sort | uniq -c | sort -rn | head -20
rg -n "ring-1|ring-2|outline-1" src --glob "*.tsx" | head -20
rg -n "box-shadow:\s*0 0 0 1px" src --glob "*.css"
rg -n "divide-[xy]" src --glob "*.tsx"
```

**REPRODUCE**

```ts
test('경계선 색이 토큰으로 수렴한다', async ({ visualPage: page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/dashboard');
    await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
    await stabilizeForCapture(page);

    const colors = await page.evaluate(() => {
      const counts = new Map<string, number>();
      for (const el of document.querySelectorAll<HTMLElement>('main *')) {
        if (el.offsetParent === null) continue;
        const cs = getComputedStyle(el);
        if (parseFloat(cs.borderTopWidth) === 0) continue;
        counts.set(cs.borderTopColor, (counts.get(cs.borderTopColor) ?? 0) + 1);
      }
      return [...counts].sort((a, b) => b[1] - a[1]);
    });

    expect(colors.length, `${theme} 경계선 색 ${colors.length}종: ${JSON.stringify(colors)}`)
      .toBeLessThanOrEqual(4);
  }
});
```

**PASS / FAIL**

- PASS: 경계선 색이 테마당 4종 이하이고 토큰에서 파생된다. 경계 표현 방식(border / ring / shadow)이 용도별로 통일된다.
- FAIL: 색 6종 이상(S3), 다크 모드에서 경계 미표시(S2), 방식 혼용으로 두께 불일치(S3).

**FIX**

```tsx
// ✅ 용도별로 방식을 고정한다
// 구조 경계 → border
<div className="rounded-lg border border-border" />

// 포커스 표시 → ring (레이아웃에 영향 없음)
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />

// 선택 상태 → border 색 변경 (두께 유지)
<div className="border border-border data-[selected=true]:border-primary" />
```

선택 상태에서 두께를 바꾸면(`border` → `border-2`) 요소 크기가 변해 레이아웃이 흔들린다. 색만 바꾸거나 `ring`을 추가한다.

---

### V-ELEV-04 — 1px 경계선 렌더링

**WHY**
`deviceScaleFactor`가 1.25/1.5/1.75인 환경에서 1px 경계선은 물리 1.25~1.75px로 계산되어 반올림된다. 인접 요소의 선 두께가 서로 달라 보이고, `divide-y` 구간에서 일부 선이 사라진다. 시각 스냅샷에서도 DPR이 다르면 diff가 발생한다.

**DETECT**

```bash
rg -n "divide-[xy]" src --glob "*.tsx"
rg -n "border-t|border-b" src --glob "*table*" --glob "*list*"
rg -n "deviceScaleFactor" playwright.config.*
```

**REPRODUCE**

```ts
test('DPR 1.5에서 경계선이 균일하다', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();
  await page.goto('/settings/members');
  await stabilizeForCapture(page);
  await expect(page.getByRole('table')).toHaveScreenshot('table-dpr15.png');
  // 결과를 400% 확대해 인접 행 선 두께를 비교
  await context.close();
});
```

**PASS / FAIL**

- PASS: DPR 1.25/1.5/1.75 캡처에서 동일 역할의 선 두께가 균일하고 누락이 없다.
- FAIL: 두께 불균일이 명확히 보임(S3), 선 누락(S3, 테이블 가독성을 해치면 S2).

**FIX**

- 요소 높이를 정수 px로 유지해 소수 좌표 누적을 피한다.
- `divide-y`가 불안정하면 각 항목에 `border-b` + `last:border-b-0`을 쓴다.
- 시각 스냅샷은 `deviceScaleFactor: 1`로 고정해 이 변수를 제거하고, DPR 검증은 별도 프로젝트에서 수행한다.

```tsx
// ✅ 정수 높이 + 명시적 경계선
<ul className="rounded-lg border">
  {rows.map(r => (
    <li key={r.id} className="flex h-12 items-center border-b px-4 last:border-b-0">
      {r.name}
    </li>
  ))}
</ul>
```

---

## 11. Image와 Media

### V-IMG-01 — 이미지 종횡비와 CLS

**WHY**
이미지에 크기가 지정되지 않으면 로드 전 높이가 0이고 로드 후 갑자기 늘어나 아래 콘텐츠가 밀린다. 이는 CLS의 가장 흔한 원인이며, 사용자가 클릭하려던 버튼이 이동해 오조작을 유발한다. 시각 QA에서는 캡처 타이밍에 따라 완전히 다른 스크린샷이 나오는 문제도 함께 발생한다.

**DETECT**

```bash
rg -n "<img" src --glob "*.tsx" | rg -v "width=|height=" | head -20
rg -n "<Image" src --glob "*.tsx" -A4 | rg -v "width|height|fill"
rg -n "aspect-" src --glob "*.tsx" | wc -l
rg -n "object-cover|object-contain|object-fit" src
```

**REPRODUCE**

```ts
test('이미지에 크기 예약이 되어 있다', async ({ visualPage: page }) => {
  await page.goto('/');
  await stabilizeForCapture(page);

  const unreserved = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter(img => img.offsetParent !== null)
      .filter(img => {
        const hasAttrs = img.hasAttribute('width') && img.hasAttribute('height');
        const parent = img.parentElement!;
        const cs = getComputedStyle(parent);
        const hasAspect = cs.aspectRatio !== 'auto';
        const hasFixedH = parseFloat(cs.height) > 0 && cs.position === 'relative';
        return !hasAttrs && !hasAspect && !hasFixedH;
      })
      .map(img => ({ src: (img.currentSrc || img.src).slice(-60), alt: img.alt })));

  expect(unreserved, JSON.stringify(unreserved, null, 2)).toEqual([]);
});

test('이미지 로드로 인한 CLS가 없다', async ({ page }) => {
  await page.goto('/');
  const cls = await page.evaluate(() => new Promise<number>(resolve => {
    let total = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 3000);
  }));
  expect(cls).toBeLessThan(0.1);
});
```

**PASS / FAIL**

- PASS: 모든 이미지가 `width`/`height` 속성 또는 `aspect-ratio` 컨테이너로 공간을 예약한다. CLS < 0.1.
- FAIL: 예약 없는 이미지(S2), CLS 0.1 초과(S2), 0.25 초과(S1).

**FIX**

```tsx
// ❌ 크기 미지정 → 로드 후 레이아웃 점프
<img src="/hero.jpg" alt="제품 화면" className="w-full" />

// ✅ 방법 A: 명시적 크기
<Image src="/hero.jpg" alt="제품 화면" width={1200} height={675} className="h-auto w-full" />

// ✅ 방법 B: aspect-ratio 컨테이너 + fill
<div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
  <Image src="/hero.jpg" alt="제품 화면" fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
</div>
```

`bg-muted`를 컨테이너에 두면 로드 전에도 빈 흰 영역이 아니라 자리 표시가 보여 인지된 안정감이 올라간다.

---

### V-IMG-02 — 이미지 품질과 해상도

**WHY**
표시 크기보다 작은 원본을 늘리면 흐려지고, 필요보다 큰 원본을 내려주면 대역폭과 LCP가 나빠진다. 고DPI 화면에서는 CSS 폭의 2배 해상도가 필요하다. 특히 로고와 아바타는 작지만 흐릿함이 눈에 잘 띈다.

**DETECT**

```bash
rg -n "sizes=" src --glob "*.tsx" | head -20
rg -n "<Image" src --glob "*.tsx" | rg -v "sizes=" | head -20
cat next.config.* | rg -A10 "images"
rg -n "quality=" src --glob "*.tsx"
```

`fill`을 쓰면서 `sizes`가 없으면 브라우저가 항상 최대 후보를 받는다.

**REPRODUCE**

```ts
test('이미지 해상도가 표시 크기에 적절하다', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  const analysis = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter(img => img.complete && img.naturalWidth > 0 && img.offsetParent !== null)
      .map(img => {
        const cssW = img.getBoundingClientRect().width;
        return {
          src: (img.currentSrc || img.src).slice(-60),
          cssWidth: Math.round(cssW),
          naturalWidth: img.naturalWidth,
          ratio: +(img.naturalWidth / Math.max(1, cssW)).toFixed(2),
        };
      }));

  const blurry = analysis.filter(a => a.ratio < 1.5);
  expect(blurry, `저해상도 이미지:\n${JSON.stringify(blurry, null, 2)}`).toEqual([]);

  const wasteful = analysis.filter(a => a.ratio > 3.5);
  expect(wasteful, `과대 이미지:\n${JSON.stringify(wasteful, null, 2)}`).toEqual([]);

  await context.close();
});
```

**PASS / FAIL**

- PASS: DPR 2 조건에서 `naturalWidth / cssWidth`가 1.5~3.5 범위다. `sizes`가 실제 표시 폭을 정확히 반영한다.
- FAIL: 흐릿함(S2, 로고·히어로면 S1), 과대 전송(S3, LCP 예산 초과 시 S2).

**FIX**

```tsx
// ❌ sizes 없음 → 브라우저가 100vw로 가정, 항상 최대 이미지
<Image src={src} alt="" fill className="object-cover" />

// ✅ 실제 표시 폭을 정확히 알린다
<Image
  src={src}
  alt=""
  fill
  sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
  className="object-cover"
/>
```

로고와 아이콘은 SVG로 제공해 해상도 문제를 근본적으로 없앤다.

```tsx
// ✅ 로고는 SVG
<Logo className="h-8 w-auto" aria-label="회사 로고" />
```

---

### V-IMG-03 — 대체 텍스트와 장식 이미지 구분

**WHY**
시각 QA에서 alt 텍스트를 다루는 이유는, 이미지 로드 실패 시 alt가 화면에 표시되기 때문이다. alt가 없으면 깨진 아이콘만 보이고, alt가 파일명(`IMG_2024.jpg`)이면 사용자를 혼란스럽게 한다. 장식 이미지에 alt를 넣으면 스크린리더가 불필요한 내용을 읽는다.

**DETECT**

```bash
rg -n "<img" src --glob "*.tsx" | rg -v "alt=" | head -20
rg -n "alt=\"\"" src --glob "*.tsx" | wc -l
rg -n "alt=\{" src --glob "*.tsx" | head -20
rg -o 'alt="[^"]*\.(jpg|png|svg|webp)"' src
```

**REPRODUCE**

```ts
test('이미지 alt가 적절하다', async ({ visualPage: page }) => {
  await page.goto('/');
  await stabilizeForCapture(page);

  const issues = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter(img => img.offsetParent !== null)
      .map(img => {
        const alt = img.getAttribute('alt');
        const src = (img.currentSrc || img.src).slice(-50);
        if (alt === null) return { src, issue: 'alt 속성 없음' };
        if (/\.(jpg|jpeg|png|svg|webp|gif)$/i.test(alt)) return { src, alt, issue: '파일명이 alt' };
        if (/^(image|photo|이미지|사진)$/i.test(alt.trim())) return { src, alt, issue: '무의미한 alt' };
        return null;
      })
      .filter(Boolean));

  expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
});

test('이미지 로드 실패 시 화면이 무너지지 않는다', async ({ visualPage: page }) => {
  await page.route('**/*.{png,jpg,jpeg,webp}', route => route.abort());
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await stabilizeForCapture(page);

  await expect(page).toHaveScreenshot('home-images-failed.png');
  // 레이아웃이 유지되고 alt 텍스트가 읽히는지 확인
  const delta = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(delta).toBeLessThanOrEqual(1);
});
```

**PASS / FAIL**

- PASS: 정보 전달 이미지에 의미 있는 alt가 있고, 장식 이미지는 `alt=""`이다. 이미지 로드 실패 시 레이아웃이 유지된다.
- FAIL: alt 누락(S2), 파일명 alt(S3), 로드 실패 시 레이아웃 붕괴(S2).

**FIX**

```tsx
// ✅ 정보 전달 이미지: 내용을 설명
<Image src={chart} alt="2026년 상반기 월별 매출 추이. 1월 800만원에서 6월 1,240만원으로 증가" width={600} height={300} />

// ✅ 장식 이미지: 빈 alt로 스크린리더에서 제외
<Image src={pattern} alt="" width={1200} height={400} aria-hidden="true" />

// ✅ 링크 안 이미지: 링크 목적지를 설명
<Link href="/pricing">
  <Image src={icon} alt="요금제 안내" width={24} height={24} />
</Link>
```

로드 실패 대비로 컨테이너에 배경과 크기를 미리 준다.

```tsx
// ✅ 실패해도 자리와 배경이 유지된다
<div className="relative aspect-square w-12 overflow-hidden rounded-full bg-muted">
  <Image src={avatarUrl} alt={`${user.name} 프로필 사진`} fill sizes="48px" className="object-cover" />
</div>
```

---

### V-IMG-04 — 다크 모드와 이미지

**WHY**
흰 배경의 PNG 로고를 다크 모드에 그대로 두면 어두운 배경 위에 흰 사각형이 뜬다. 반대로 어두운 일러스트를 라이트 모드에 두면 검은 덩어리가 된다. 스크린샷 이미지도 라이트 UI를 담고 있으면 다크 모드에서 이질적이다.

**DETECT**

```bash
rg -n "<Image|<img" src --glob "*.tsx" | rg -i "logo|illustration|screenshot" | head -20
rg -n "dark:hidden|hidden dark:block|dark:invert" src --glob "*.tsx"
rg -n "\.svg" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
test('다크 모드에서 이미지가 배경과 충돌하지 않는다', async ({ visualPage: page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await stabilizeForCapture(page);

  await expect(page.getByTestId('brand-logo')).toHaveScreenshot('logo-dark.png');
  await expect(page.getByTestId('hero-illustration')).toHaveScreenshot('illustration-dark.png');
  // 결과를 눈으로 확인: 흰 사각형이 떠 있지 않은가
});
```

**PASS / FAIL**

- PASS: 로고·일러스트·스크린샷이 테마별로 적절히 전환되거나, 배경 투명 SVG로 테마 색을 따른다.
- FAIL: 다크 모드에서 흰 배경 이미지가 뜸(S2), 로고 판독 불가(S2).

**FIX**

```tsx
// ✅ 방법 A: 테마별 이미지 전환 (레이아웃 시프트 없이)
<>
  <Image src="/brand/logo-light.svg" alt="회사 로고" width={120} height={32} className="dark:hidden" />
  <Image src="/brand/logo-dark.svg" alt="" aria-hidden="true" width={120} height={32} className="hidden dark:block" />
</>
```

두 이미지를 모두 렌더하면 alt가 중복되므로 다크용에는 `aria-hidden`과 빈 alt를 준다.

```tsx
// ✅ 방법 B: 인라인 SVG + currentColor (가장 깔끔)
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={className} role="img" aria-label="회사 로고">
      <path fill="currentColor" d="..." />
    </svg>
  );
}
```

```css
/* ✅ 방법 C: 단색 이미지에 한해 invert (임시방편) */
.logo-mono {
  @apply dark:invert;
}
```

`invert`는 색이 있는 로고에는 쓰면 안 된다. 브랜드 색이 보색으로 바뀐다.

---

### V-IMG-05 — 비디오·iframe·서드파티 임베드

**WHY**
유튜브 임베드, 지도, 결제 위젯 같은 서드파티 iframe은 (a) 로드 시점이 통제되지 않아 스냅샷을 불안정하게 만들고, (b) 내부 스타일을 제어할 수 없어 다크 모드에 대응하지 못하며, (c) 종횡비가 고정되지 않으면 CLS를 만든다.

**DETECT**

```bash
rg -n "<iframe|<video" src --glob "*.tsx" -A4
rg -n "youtube|vimeo|maps.google|stripe|checkout" src | head -20
rg -n "aspect-video|padding-bottom.*56.25%" src
```

**REPRODUCE**

```ts
test('임베드가 종횡비를 유지하고 스냅샷을 오염시키지 않는다', async ({ visualPage: page }) => {
  // 서드파티는 차단하고 자리 표시로 대체
  await page.route('**://www.youtube.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<body style="background:#222"></body>' }));

  await page.goto('/features');
  await stabilizeForCapture(page);

  const box = await page.getByTestId('demo-video').boundingBox();
  const ratio = box!.width / box!.height;
  expect(Math.abs(ratio - 16 / 9), `종횡비 ${ratio.toFixed(2)}`).toBeLessThan(0.05);

  await expect(page.getByTestId('features-section')).toHaveScreenshot('features.png');
});
```

**PASS / FAIL**

- PASS: 임베드가 고정 종횡비 컨테이너 안에 있다. 시각 테스트에서 서드파티가 차단되고 자리 표시로 대체된다.
- FAIL: 종횡비 미고정으로 CLS(S2), 서드파티 로드가 스냅샷을 불안정하게 함(결정론 문제).

**FIX**

```tsx
// ✅ 종횡비 고정 컨테이너 + 지연 로드
<div data-testid="demo-video" className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
  <iframe
    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
    title="제품 데모 영상"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
    allowFullScreen
    className="absolute inset-0 h-full w-full border-0"
  />
</div>
```

시각 테스트에서는 서드파티를 일괄 차단한다.

```ts
// tests/visual/helpers/block-third-party.ts
const THIRD_PARTY = [
  '**://*.youtube.com/**', '**://*.youtube-nocookie.com/**',
  '**://*.vimeo.com/**', '**://*.google.com/maps/**',
  '**://*.googletagmanager.com/**', '**://*.google-analytics.com/**',
  '**://*.hotjar.com/**', '**://*.intercom.io/**',
];

export async function blockThirdParty(page: Page) {
  for (const pattern of THIRD_PARTY) {
    await page.route(pattern, route => route.abort());
  }
}
```

분석 스크립트까지 차단하면 시각 테스트가 빨라지고 안정성이 올라간다.

---

## 12. Icon과 Logo

### V-ICON-01 — 아이콘 크기와 광학 정렬

**WHY**
아이콘 크기가 16, 18, 20px로 섞이면 툴바가 들쭉날쭉해 보인다. 또 아이콘의 시각적 무게 중심은 기하학적 중심과 다르므로, 단순히 `items-center`만으로는 텍스트와 어긋나 보인다. 특히 화살표·삼각형처럼 비대칭 아이콘에서 두드러진다.

**DETECT**

```bash
rg -o "size-[0-9]+|(w|h)-[0-9]+" src --glob "*.tsx" | rg -B0 "Icon" | head -20
rg -n "<[A-Z][a-zA-Z]*Icon" src --glob "*.tsx" | wc -l
rg -n "lucide-react|@heroicons|react-icons" package.json
```

**REPRODUCE**

```ts
test('아이콘 크기가 통일된다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const sizes = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const svg of document.querySelectorAll('svg')) {
      const r = svg.getBoundingClientRect();
      if (r.width === 0) continue;
      const key = `${Math.round(r.width)}x${Math.round(r.height)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  });

  expect(sizes.length, `아이콘 크기 ${sizes.length}종: ${JSON.stringify(sizes)}`)
    .toBeLessThanOrEqual(4);
});

test('아이콘과 텍스트가 수직 정렬된다', async ({ visualPage: page }) => {
  const misaligned = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a')]
      .filter(el => el.querySelector('svg') && (el.textContent ?? '').trim())
      .map(el => {
        const svg = el.querySelector('svg')!.getBoundingClientRect();
        const textNode = [...el.childNodes].find(
          n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        if (!textNode) return null;
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const text = range.getBoundingClientRect();
        const svgCenter = svg.top + svg.height / 2;
        const textCenter = text.top + text.height / 2;
        return {
          label: (el.textContent ?? '').trim().slice(0, 24),
          offset: +(svgCenter - textCenter).toFixed(1),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && Math.abs(x.offset) > 1.5));

  expect(misaligned, JSON.stringify(misaligned, null, 2)).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 아이콘 크기가 4종 이하(예: 16/20/24/32)이고, 텍스트와의 수직 중심 오차가 1.5px 이하다.
- FAIL: 크기 6종 이상(S3), 정렬 오차 2px 초과(S3).

**FIX**

```tsx
// ✅ 아이콘 크기를 토큰화
const ICON_SIZE = {
  xs: 'size-3.5',   // 14px — 인라인 보조
  sm: 'size-4',     // 16px — 버튼 기본
  md: 'size-5',     // 20px — 네비게이션
  lg: 'size-6',     // 24px — 강조
} as const;

<Button>
  <PlusIcon aria-hidden="true" className={cn(ICON_SIZE.sm, 'shrink-0')} />
  추가
</Button>
```

```tsx
// ✅ 광학 정렬: inline-flex + items-center + leading 조정
<span className="inline-flex items-center gap-1.5">
  <Icon aria-hidden="true" className="size-4 shrink-0" />
  <span>라벨</span>
</span>
```

`shrink-0`이 없으면 좁은 공간에서 아이콘이 찌그러진다. 아이콘에는 항상 붙인다.

---

### V-ICON-02 — 아이콘 렌더링과 로딩

**WHY**
아이콘 폰트를 쓰면 폰트 로드 전에 네모 상자나 빈 공간이 보인다. 스프라이트 SVG를 외부 파일로 참조하면(`<use href="/sprite.svg#icon">`) 파일 로드 전까지 아무것도 안 보인다. 동적 임포트로 아이콘을 로드하면 지연이 발생해 시각 스냅샷이 불안정해진다.

**DETECT**

```bash
rg -n "font-family.*icon|icomoon|fontawesome" src --glob "*.css"
rg -n "<use href|xlink:href" src
rg -n "dynamic\(\(\) => import.*[Ii]con" src
rg -n "next/dynamic" src --glob "*icon*"
```

**REPRODUCE**

```ts
test('모든 아이콘이 렌더된다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const empty = await page.evaluate(() =>
    [...document.querySelectorAll('svg')]
      .filter(svg => {
        const r = svg.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return true;
        // 내용 없는 SVG (path/circle/rect/use 없음)
        return svg.children.length === 0;
      })
      .map(svg => ({
        class: svg.getAttribute('class')?.slice(0, 50),
        parent: svg.parentElement?.tagName,
      })));

  expect(empty, `빈 아이콘:\n${JSON.stringify(empty, null, 2)}`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 모든 SVG가 내용을 갖고 크기가 0이 아니다. 아이콘이 초기 번들에 인라인으로 포함되어 지연이 없다.
- FAIL: 빈 아이콘(S2), 로드 지연으로 깜빡임(S3, 결정론 문제이기도 함).

**FIX**

```tsx
// ✅ 트리 셰이킹 가능한 개별 임포트 (lucide-react)
import { Plus, Trash2, Settings } from 'lucide-react';

// ❌ 전체 임포트 — 번들 폭증
import * as Icons from 'lucide-react';
```

```tsx
// ❌ 동적 임포트로 아이콘 로드 → 깜빡임 + 스냅샷 불안정
const Icon = dynamic(() => import('lucide-react').then(m => m[iconName]));

// ✅ 정적 매핑
const ICONS = { plus: Plus, trash: Trash2, settings: Settings } as const;
const Icon = ICONS[iconName];
```

아이콘 폰트 대신 인라인 SVG를 쓴다. 폰트는 로딩 문제, 접근성 문제, 고대비 모드 소실 문제를 모두 갖는다.

---

### V-ICON-03 — 로고 규격과 클리어 스페이스

**WHY**
로고가 화면마다 다른 크기로 나타나거나, 주변 요소와 너무 붙어 있으면 브랜드 인상이 약해진다. 브랜드 가이드는 보통 로고 주변에 최소 여백(클리어 스페이스)을 요구하는데, 헤더가 좁아지면 이 규칙이 먼저 깨진다.

**DETECT**

```bash
rg -n "Logo|logo" src/components --glob "*.tsx" | head -20
rg -n "brand" src/app --glob "*.tsx" | head -20
fd . public/brand 2>/dev/null
```

**REPRODUCE**

```ts
test('로고 크기와 여백이 일관된다', async ({ visualPage: page }) => {
  const routes = ['/', '/pricing', '/dashboard', '/auth/login'];
  const sizes: any[] = [];

  for (const route of routes) {
    await page.goto(route);
    await stabilizeForCapture(page);
    const logo = page.getByTestId('brand-logo');
    if (await logo.count() === 0) continue;
    const box = await logo.boundingBox();
    sizes.push({ route, w: Math.round(box!.width), h: Math.round(box!.height) });
  }

  const uniqueHeights = [...new Set(sizes.map(s => s.h))];
  expect(uniqueHeights.length, `로고 높이 ${uniqueHeights.length}종: ${JSON.stringify(sizes)}`)
    .toBeLessThanOrEqual(2);
});
```

**PASS / FAIL**

- PASS: 로고 크기가 컨텍스트별로 1~2종이고, 최소 클리어 스페이스가 유지된다. 최소 크기 이하로 축소되지 않는다.
- FAIL: 화면마다 다른 크기(S3), 인접 요소와 붙어 판독 저하(S3), 최소 크기 미달로 깨짐(S2).

**FIX**

```tsx
// ✅ 로고를 컴포넌트로 고정하고 크기 프리셋 제공
const LOGO_SIZE = {
  sm: 'h-6',    // 24px — 모바일 헤더
  md: 'h-8',    // 32px — 데스크톱 헤더
  lg: 'h-10',   // 40px — 인증 화면
} as const;

export function BrandLogo({ size = 'md', className }: Props) {
  return (
    <Link
      href="/"
      data-testid="brand-logo"
      // 클리어 스페이스를 컴포넌트가 보장
      className={cn('inline-flex shrink-0 items-center px-2 py-1', className)}
      aria-label="홈으로 이동"
    >
      <LogoMark className={cn(LOGO_SIZE[size], 'w-auto')} />
    </Link>
  );
}
```

---

### V-ICON-04 — 아이콘 접근성과 시각 정보

**WHY**
아이콘만 있는 버튼에 `aria-label`이 없으면 스크린리더 사용자는 용도를 알 수 없다. 반대로 장식 아이콘에 `aria-hidden`이 없으면 SVG의 `<title>`이나 파일명이 읽혀 소음이 된다. 시각 QA에서 이를 함께 검사하는 이유는, 아이콘의 **의미 전달 여부**가 시각 설계의 일부이기 때문이다.

**DETECT**

```bash
rg -n "<svg" src --glob "*.tsx" | rg -v "aria-hidden|role=" | head -20
rg -n "<button" src --glob "*.tsx" -A3 | rg "Icon" | rg -v "aria-label|sr-only"
rg -n "aria-hidden=\"true\"" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('아이콘 버튼에 접근 가능한 이름이 있다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a[href]')]
      .filter(el => el.offsetParent !== null)
      .filter(el => {
        const hasText = (el.textContent ?? '').trim().length > 0;
        const hasLabel = !!el.getAttribute('aria-label')
          || !!el.getAttribute('aria-labelledby')
          || !!el.querySelector('.sr-only');
        return !hasText && !hasLabel;
      })
      .map(el => ({
        tag: el.tagName,
        html: el.outerHTML.slice(0, 100),
      })));

  expect(unnamed, JSON.stringify(unnamed, null, 2)).toEqual([]);
});

test('장식 아이콘이 접근성 트리에서 제외된다', async ({ visualPage: page }) => {
  const exposed = await page.evaluate(() =>
    [...document.querySelectorAll('svg')]
      .filter(svg => {
        const parent = svg.closest('button, a');
        const hasSiblingText = parent && (parent.textContent ?? '').trim().length > 0;
        // 텍스트와 함께 있는 아이콘은 장식이므로 숨겨야 한다
        return hasSiblingText
          && svg.getAttribute('aria-hidden') !== 'true'
          && svg.getAttribute('role') !== 'presentation';
      })
      .map(svg => svg.parentElement?.textContent?.trim().slice(0, 30)));

  expect(exposed, `장식 아이콘 미숨김: ${JSON.stringify(exposed)}`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 아이콘 단독 버튼에 `aria-label`이 있다. 텍스트와 함께 있는 아이콘은 `aria-hidden="true"`다. 의미를 전달하는 독립 아이콘에는 `role="img"` + `aria-label`이 있다.
- FAIL: 이름 없는 아이콘 버튼(**S1**), 중복 낭독(S3).

**FIX**

```tsx
// ✅ 패턴 1: 아이콘만 있는 버튼
<button aria-label="설정 열기">
  <SettingsIcon aria-hidden="true" className="size-5" />
</button>

// ✅ 패턴 2: 텍스트 + 장식 아이콘
<button>
  <PlusIcon aria-hidden="true" className="size-4" />
  멤버 추가
</button>

// ✅ 패턴 3: 의미를 전달하는 독립 아이콘 (상태 표시 등)
<CheckCircleIcon role="img" aria-label="인증됨" className="size-4 text-emerald-600" />
```

---

## 13. State 시각 검증

시각 QA에서 가장 자주 누락되는 영역이다. 기본 상태만 캡처하고 배포하면, 실제 사용자가 마주치는 화면의 절반을 검증하지 않은 셈이 된다.

### 13.1 상태 매트릭스

모든 인터랙티브 컴포넌트는 아래 상태를 갖는다. 캡처 대상에서 빠뜨리지 않는다.

| 상태 | 트리거 | 흔한 누락 |
|------|--------|-----------|
| default | — | — |
| hover | 마우스 오버 | 다크 모드 hover |
| focus-visible | 키보드 Tab | 커스텀 컴포넌트 |
| active / pressed | 클릭 중 | 거의 항상 누락 |
| disabled | 조건 미충족 | 대비, 커서 |
| loading | 비동기 진행 | 크기 변동 |
| selected / checked | 선택됨 | 다중 선택 |
| error / invalid | 검증 실패 | 메시지 위치 |
| readonly | 편집 불가 | disabled와 구분 |

화면 단위로는 아래가 추가된다.

| 상태 | 트리거 | 흔한 누락 |
|------|--------|-----------|
| empty | 데이터 0건 | 초기 vs 검색 0건 구분 |
| loading | 최초 로드 | 스켈레톤 크기 불일치 |
| error | API 실패 | 부분 실패 |
| partial | 일부만 로드 | 스트리밍 중간 상태 |
| offline | 네트워크 없음 | 미구현 |

### V-STATE-01 — 인터랙션 상태 캡처

**WHY**
hover와 focus 스타일은 코드 리뷰에서 눈으로 확인하기 어렵고, 디자인 시안에도 종종 빠진다. 그 결과 hover 시 배경이 거의 안 바뀌거나, focus 링이 요소에 가려지거나, active 상태가 아예 없어 클릭 피드백이 없는 상태로 배포된다.

**DETECT**

```bash
rg -o "hover:[a-z-]+" src --glob "*.tsx" | sort | uniq -c | sort -rn | head -20
rg -o "focus-visible:[a-z-]+" src --glob "*.tsx" | wc -l
rg -o "active:[a-z-]+" src --glob "*.tsx" | wc -l
rg -o "disabled:[a-z-]+" src --glob "*.tsx" | wc -l
```

`hover:` 대비 `active:`와 `focus-visible:` 개수가 현저히 적으면 상태 설계가 불완전하다.

**REPRODUCE**

```ts
// tests/visual/states.spec.ts
const STATES = ['default', 'hover', 'focus', 'active', 'disabled'] as const;

test.describe('Button 상태 매트릭스', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const state of STATES) {
      test(`Button ${state} (${theme})`, async ({ visualPage: page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto('/visual-catalog');
        await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
        await stabilizeForCapture(page);

        const button = page.getByTestId('catalog-button-primary');

        switch (state) {
          case 'hover':
            await button.hover();
            break;
          case 'focus':
            await button.focus();
            break;
          case 'active':
            // mouse.down으로 pressed 상태 유지
            const box = await button.boundingBox();
            await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
            await page.mouse.down();
            break;
          case 'disabled':
            await page.evaluate(() => {
              document.querySelector<HTMLButtonElement>('[data-testid="catalog-button-primary"]')!
                .disabled = true;
            });
            break;
        }

        await page.waitForTimeout(60);
        await expect(button).toHaveScreenshot(`button-${state}-${theme}.png`);

        if (state === 'active') await page.mouse.up();
      });
    }
  }
});
```

상태 간 실제 차이가 있는지도 검증한다.

```ts
test('상태별로 시각적 차이가 있다', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  const button = page.getByTestId('catalog-button-primary');

  const read = () => button.evaluate(el => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, outline: cs.outlineStyle };
  });

  const base = await read();
  await button.hover();
  const hover = await read();
  await button.focus();
  const focus = await read();

  expect(hover, 'hover 상태가 기본과 동일').not.toEqual(base);
  expect(focus.outline !== 'none' || focus.shadow !== base.shadow,
    'focus 표시가 없음').toBe(true);
});
```

**PASS / FAIL**

- PASS: 모든 인터랙션 상태가 시각적으로 구별되고, 두 테마에서 캡처되어 있다. focus 표시가 대비 3:1 이상이다.
- FAIL: 상태 미구분(S2), focus 표시 없음(**S1**), active 피드백 없음(S3).

**FIX**

```tsx
// ✅ 상태를 빠짐없이 정의 (cva 사용 예)
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        ghost:   'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
      },
      size: { sm: 'h-8 px-3', default: 'h-10 px-4', lg: 'h-11 px-6', icon: 'size-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
```

`active:` 상태를 빠뜨리면 클릭해도 아무 반응이 없어 "눌렸나?" 하는 불안을 준다. 모든 variant에 포함시킨다.

---

### V-STATE-02 — 로딩 상태와 스켈레톤

**WHY**
스켈레톤 높이가 실제 콘텐츠와 다르면 데이터 도착 시 레이아웃이 점프한다. 또 스피너가 콘텐츠 영역 중앙이 아니라 상단에 붙거나, 로딩 중에도 이전 콘텐츠가 남아 혼란을 주는 경우가 흔하다. 로딩 상태는 사용자가 반드시 보는 화면인데 디자인 검토에서 자주 빠진다.

**DETECT**

```bash
rg -n "Skeleton|animate-pulse" src --glob "*.tsx" | wc -l
rg -n "isLoading|isPending|loading\.tsx" src | head -20
fd loading.tsx src/app | head -20
rg -n "Suspense" src --glob "*.tsx" | wc -l
```

`loading.tsx`가 없는 라우트는 로딩 상태가 설계되지 않았을 가능성이 높다.

**REPRODUCE**

```ts
test('스켈레톤 크기가 실제 콘텐츠와 일치한다', async ({ visualPage: page }) => {
  // 응답을 지연시켜 스켈레톤 캡처
  await page.route('**/api/members*', async route => {
    await new Promise(r => setTimeout(r, 3000));
    await route.continue();
  });

  await page.goto('/settings/members');
  await page.waitForSelector('[data-testid="row-skeleton"]');
  await stabilizeForCapture(page, { loadImages: false });

  const skeletonBox = await page.getByTestId('members-table').boundingBox();
  await expect(page.getByTestId('members-table')).toHaveScreenshot('members-loading.png');

  // 데이터 도착 후
  await page.unroute('**/api/members*');
  await page.waitForSelector('[data-testid="row-skeleton"]', { state: 'detached', timeout: 10_000 });
  await stabilizeForCapture(page);
  const loadedBox = await page.getByTestId('members-table').boundingBox();

  expect(Math.abs(skeletonBox!.height - loadedBox!.height),
    `스켈레톤 ${skeletonBox!.height}px vs 실제 ${loadedBox!.height}px`).toBeLessThanOrEqual(8);
});
```

**PASS / FAIL**

- PASS: 스켈레톤 높이가 실제 콘텐츠와 ±8px 이내다. 스켈레톤이 실제 구조(행 수, 열 배치)를 반영한다. 두 테마에서 보인다.
- FAIL: 크기 불일치로 CLS(S2), 스켈레톤 없이 빈 화면(S3), 다크 모드에서 스켈레톤이 안 보임(S2).

**FIX**

```tsx
// ✅ 실제 구조를 반영한 스켈레톤 (같은 컴포넌트에서 파생)
function MemberRowSkeleton() {
  return (
    <tr data-testid="row-skeleton" className="border-t">
      <td className="px-4 py-3"><div className="size-4 animate-pulse rounded bg-muted" /></td>
      <th scope="row" className="px-4 py-3">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </th>
      <td className="px-4 py-3"><div className="h-5 w-48 animate-pulse rounded bg-muted" /></td>
      <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded bg-muted" /></td>
      <td className="px-4 py-3 text-right"><div className="ml-auto h-5 w-20 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}
```

행 높이를 실제 행과 동일하게 만드는 핵심은 **같은 패딩과 같은 텍스트 높이**를 쓰는 것이다. `py-3` + `h-5`가 실제 행의 `py-3` + `text-sm`(line-height 20px)과 일치한다.

```tsx
// ✅ 스켈레톤 행 수도 실제 페이지 크기와 맞춘다
{Array.from({ length: pageSize }).map((_, i) => <MemberRowSkeleton key={i} />)}
```

---

### V-STATE-03 — 빈 상태

**WHY**
데이터가 없을 때 빈 표나 흰 화면만 보이면 사용자는 "로딩 중인가, 오류인가, 정말 없는가"를 구분할 수 없다. 또 초기 상태(아직 만들지 않음)와 검색 0건은 필요한 안내가 완전히 다르다. 빈 상태는 신규 사용자가 가장 먼저 보는 화면이므로 온보딩 관점에서도 중요하다.

**DETECT**

```bash
rg -n "length === 0|\.length\s*\?|isEmpty|no.?data|데이터가 없" src --glob "*.tsx" | head -20
rg -n "EmptyState|Empty\b" src --glob "*.tsx"
```

**REPRODUCE**

```ts
test.describe('빈 상태 시각 검증', () => {
  test('초기 빈 상태', async ({ visualPage: page }) => {
    await page.route('**/api/members*', r => r.fulfill({ json: { rows: [], total: 0 } }));
    await page.goto('/settings/members');
    await stabilizeForCapture(page);
    await expect(page.getByTestId('members-table')).toHaveScreenshot('members-empty-initial.png');
    await expect(page.getByRole('button', { name: /초대|추가/ })).toBeVisible();
  });

  test('검색 결과 없음', async ({ visualPage: page }) => {
    await page.goto('/settings/members');
    await page.getByLabel('검색').fill('zzz-no-match');
    await page.waitForTimeout(600);
    await stabilizeForCapture(page);
    await expect(page.getByTestId('members-table')).toHaveScreenshot('members-empty-search.png');
    await expect(page.getByRole('button', { name: /초기화|지우기/ })).toBeVisible();
  });

  test('오류 상태', async ({ visualPage: page }) => {
    await page.route('**/api/members*', r => r.fulfill({ status: 500, body: '{}' }));
    await page.goto('/settings/members');
    await stabilizeForCapture(page);
    await expect(page.getByTestId('members-table')).toHaveScreenshot('members-error.png');
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });
});
```

**PASS / FAIL**

- PASS: 초기 빈 상태·검색 0건·오류가 서로 다른 시각 표현과 서로 다른 다음 행동을 제시한다. 세 상태가 모두 캡처되어 있다.
- FAIL: 상태 구분 없음(S2), 다음 행동 없음(S3), 빈 화면만 표시(S2).

**FIX**

```tsx
// ✅ 빈 상태 컴포넌트를 규격화
type EmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-base font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

```tsx
// ✅ 상황별로 다른 내용
{hasFilters ? (
  <EmptyState
    icon={SearchXIcon}
    title="검색 결과가 없습니다"
    description="다른 검색어를 시도하거나 필터를 조정해 보세요."
    action={<Button variant="ghost" onClick={clearFilters}>필터 지우기</Button>}
  />
) : (
  <EmptyState
    icon={UsersIcon}
    title="아직 멤버가 없습니다"
    description="팀원을 초대해 함께 작업을 시작하세요."
    action={<Button onClick={openInvite}>멤버 초대</Button>}
  />
)}
```

---

### V-STATE-04 — 오류와 검증 표시

**WHY**
폼 오류가 색상만으로 표시되면 색각 이상 사용자가 인지하지 못한다. 오류 메시지가 필드에서 멀리 떨어져 있으면 어떤 필드의 문제인지 알 수 없다. 오류 발생 시 레이아웃이 밀려 다른 필드 위치가 바뀌면 사용자가 혼란스러워한다.

**DETECT**

```bash
rg -n "aria-invalid|role=\"alert\"|aria-errormessage|aria-describedby" src --glob "*.tsx"
rg -n "text-red-|text-destructive|border-red-" src --glob "*.tsx" | head -20
rg -n "FormMessage|ErrorMessage|error &&" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
test('폼 오류 상태 시각 검증', async ({ visualPage: page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/auth/signup');
    await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);

    // 오류 유발
    await page.getByLabel('이메일').fill('invalid');
    await page.getByRole('button', { name: '가입' }).click();
    await page.waitForSelector('[aria-invalid="true"]');
    await stabilizeForCapture(page);

    await expect(page.getByTestId('signup-form')).toHaveScreenshot(`signup-error-${theme}.png`);
  }
});

test('오류 표시가 레이아웃을 밀지 않는다', async ({ visualPage: page }) => {
  await page.goto('/auth/signup');
  const submitBefore = await page.getByRole('button', { name: '가입' }).boundingBox();

  await page.getByLabel('이메일').fill('invalid');
  await page.getByRole('button', { name: '가입' }).click();
  await page.waitForSelector('[role="alert"]');
  const submitAfter = await page.getByRole('button', { name: '가입' }).boundingBox();

  // 메시지 공간이 예약되어 있으면 이동이 없다
  expect(Math.abs(submitAfter!.y - submitBefore!.y),
    `오류 표시로 버튼이 ${Math.abs(submitAfter!.y - submitBefore!.y)}px 이동`).toBeLessThanOrEqual(2);
});

test('오류가 색상 외 단서를 갖는다', async ({ visualPage: page }) => {
  const cues = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-invalid="true"]')].map(el => {
      const id = el.getAttribute('aria-describedby');
      const msg = id ? document.getElementById(id) : null;
      return {
        hasMessage: !!msg?.textContent?.trim(),
        hasIcon: !!msg?.querySelector('svg'),
      };
    }));
  for (const c of cues) expect(c.hasMessage, '오류 메시지 텍스트 없음').toBe(true);
});
```

**PASS / FAIL**

- PASS: 오류가 색상 + 아이콘 + 텍스트로 표시된다. 메시지가 해당 필드 바로 아래에 있다. 오류 표시로 레이아웃이 이동하지 않는다. 두 테마에서 대비가 충분하다.
- FAIL: 색상 단독 표시(S2 — WCAG 1.4.1), 레이아웃 밀림(S3), 다크 모드에서 오류 색 대비 미달(S2).

**FIX**

```tsx
// ✅ 메시지 공간 예약 + 다중 단서
function FormField({ label, error, children, id }: Props) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
        className: cn(
          children.props.className,
          error && 'border-destructive focus-visible:ring-destructive',
        ),
      })}
      {/* 항상 최소 높이를 확보해 오류 표시 시 레이아웃이 밀리지 않는다 */}
      <div className="min-h-5">
        {error && (
          <p id={errorId} role="alert" className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircleIcon aria-hidden="true" className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
```

---

### V-STATE-05 — 선택·활성 상태

**WHY**
목록에서 선택된 항목, 네비게이션에서 현재 페이지, 탭에서 활성 탭이 구별되지 않으면 사용자는 위치를 잃는다. 배경색 차이만으로 표현하면 다크 모드나 고대비 모드에서 사라진다. 또 hover와 selected가 같은 색이면 마우스를 올렸을 때 무엇이 선택된 것인지 알 수 없다.

**DETECT**

```bash
rg -n "aria-current|aria-selected|data-state=\"(active|selected|on)\"" src --glob "*.tsx"
rg -n "isActive|isSelected|selected &&" src --glob "*.tsx" | head -20
rg -n "data-\[state=active\]" src --glob "*.tsx"
```

**REPRODUCE**

```ts
test('선택 상태와 hover 상태가 구별된다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const nav = page.getByRole('navigation', { name: '사이드바 메뉴' });
  const active = nav.getByRole('link', { current: 'page' });
  const inactive = nav.getByRole('link').filter({ hasNot: page.locator('[aria-current]') }).first();

  const read = (loc: Locator) => loc.evaluate(el => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color, weight: cs.fontWeight, borderLeft: cs.borderLeftColor };
  });

  const activeStyle = await read(active);
  const baseStyle = await read(inactive);
  await inactive.hover();
  const hoverStyle = await read(inactive);

  expect(activeStyle, '활성 항목이 기본과 동일').not.toEqual(baseStyle);
  expect(activeStyle, '활성 항목과 hover가 동일 — 구분 불가').not.toEqual(hoverStyle);
});

test('선택 상태 시각 회귀', async ({ visualPage: page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/dashboard');
    await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
    await stabilizeForCapture(page);
    await expect(page.getByRole('navigation', { name: '사이드바 메뉴' }))
      .toHaveScreenshot(`sidebar-nav-${theme}.png`);
  }
});
```

**PASS / FAIL**

- PASS: 선택/활성 상태가 hover와 명확히 다르고, 배경색 외 단서(굵기, 좌측 바, 아이콘 채움)를 갖는다. 두 테마와 고대비 모드에서 구별된다.
- FAIL: 활성 상태 미표시(S2), hover와 동일(S2), 고대비 모드에서 소실(S2).

**FIX**

```tsx
// ✅ 다중 단서로 활성 상태 표현
<Link
  href={item.href}
  aria-current={isActive ? 'page' : undefined}
  className={cn(
    'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    'hover:bg-accent/60',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive && [
      'bg-accent font-medium text-accent-foreground',
      // 좌측 인디케이터: 색상 외 단서
      'before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary',
    ],
  )}
>
  <item.icon aria-hidden="true" className={cn('size-4 shrink-0', isActive && 'text-primary')} />
  <span>{item.label}</span>
</Link>
```

---

### V-STATE-06 — 상태 전이 조합

**WHY**
상태는 조합된다. "disabled + loading", "selected + hover", "error + focus"처럼 두 상태가 겹칠 때 스타일이 충돌해 이상하게 보이는 경우가 많다. 특히 Tailwind에서 클래스 순서에 따라 우선순위가 결정되므로, `disabled:opacity-50` 뒤에 `hover:opacity-100`이 오면 disabled인데도 hover에서 밝아진다.

**DETECT**

```bash
rg -n "disabled:.*hover:|hover:.*disabled:" src --glob "*.tsx"
rg -n "aria-disabled" src --glob "*.tsx"
rg -n "cn\(" src --glob "*.tsx" | wc -l
rg -n "tailwind-merge|twMerge|clsx" package.json
```

`tailwind-merge` 없이 조건부 클래스를 합치면 충돌이 예측 불가능해진다.

**REPRODUCE**

```ts
test('상태 조합에서 스타일이 충돌하지 않는다', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);

  const disabledBtn = page.getByTestId('catalog-button-disabled');
  const before = await disabledBtn.evaluate(el => getComputedStyle(el).opacity);

  await disabledBtn.hover({ force: true });
  await page.waitForTimeout(60);
  const after = await disabledBtn.evaluate(el => getComputedStyle(el).opacity);

  expect(after, 'disabled 요소가 hover에서 변경됨').toBe(before);
});

test('상태 조합 매트릭스 스냅샷', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);
  await expect(page.getByTestId('catalog-state-combinations'))
    .toHaveScreenshot('state-combinations.png');
});
```

**PASS / FAIL**

- PASS: disabled가 hover/focus/active보다 우선한다. loading 중에는 추가 클릭이 시각적으로도 차단된다. 조합 상태가 카탈로그에 캡처되어 있다.
- FAIL: disabled인데 hover 반응(S2), loading 중 크기 변동(S3), 조합에서 스타일 깨짐(S2).

**FIX**

```tsx
// ✅ tailwind-merge로 충돌 해결 + disabled 우선순위 보장
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
// ✅ disabled:pointer-events-none으로 hover 자체를 차단
className={cn(
  'transition-colors hover:bg-accent active:bg-accent/80',
  'disabled:pointer-events-none disabled:opacity-50',   // 마지막에 두어 우선 적용
)}
```

```tsx
// ✅ 로딩 중 크기 유지: 텍스트를 투명하게 하고 스피너를 겹친다
<Button disabled={isPending} className="relative">
  <span className={cn(isPending && 'invisible')}>저장</span>
  {isPending && (
    <span className="absolute inset-0 flex items-center justify-center">
      <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
      <span className="sr-only">저장 중</span>
    </span>
  )}
</Button>
```

텍스트를 스피너로 교체하면 버튼 폭이 변해 레이아웃이 흔들린다. `invisible`로 자리를 유지하는 것이 핵심이다.

---

## 14. Animation과 Transition

시각 QA에서 애니메이션은 두 가지 관점으로 다룬다. (a) 결정론 확보를 위해 **정지**시켜야 하고, (b) 별도 테스트에서 **동작 자체**를 검증해야 한다. 둘을 섞으면 안 된다.

### V-MOTION-01 — 전환 대상과 성능

**WHY**
`transition-all`은 예상하지 못한 속성까지 애니메이션해 비용을 키우고, 레이아웃 속성(`width`, `height`, `top`, `margin`)을 전환하면 매 프레임 레이아웃 재계산이 발생해 프레임이 떨어진다. GPU 가속되는 속성은 `transform`과 `opacity`뿐이다.

**DETECT**

```bash
rg -n "transition-all" src --glob "*.tsx" | wc -l
rg -o "transition-\[[^\]]+\]" src | sort | uniq -c
rg -n "transition:" src --glob "*.css" | rg -i "width|height|top|left|margin|padding"
rg -n "will-change" src
```

**REPRODUCE**

```ts
test('전환 대상이 GPU 친화적이다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const expensive = await page.evaluate(() => {
    const LAYOUT_PROPS = ['width', 'height', 'top', 'left', 'right', 'bottom',
                          'margin', 'padding', 'font-size'];
    const out: any[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.offsetParent === null) continue;
      const cs = getComputedStyle(el);
      const props = cs.transitionProperty.split(',').map(s => s.trim());
      const bad = props.filter(p => LAYOUT_PROPS.some(lp => p.includes(lp)) || p === 'all');
      if (bad.length) {
        out.push({ className: String(el.className).slice(0, 60), props: bad });
      }
    }
    return out.slice(0, 15);
  });

  expect(expensive, `레이아웃 전환:\n${JSON.stringify(expensive, null, 2)}`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 전환 대상이 `transform`, `opacity`, `color`, `background-color`, `border-color`, `box-shadow`로 제한된다. `transition-all` 사용이 없거나 사유가 있다.
- FAIL: 레이아웃 속성 전환(S3, 목록에서 프레임 저하 시 S2), `transition-all` 남용(S3).

**FIX**

```tsx
// ❌ 무엇이 전환되는지 모른다 + 비용이 크다
<div className="transition-all duration-300 hover:w-64 hover:p-8">

// ✅ 대상 명시 + GPU 친화 속성
<div className="transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md">
```

크기 변화가 꼭 필요하면 `transform: scale()`을 쓴다. 레이아웃에 영향을 주지 않으므로 인접 요소가 밀리지 않는다(V-LAY 참조).

---

### V-MOTION-02 — 축소 모션 대응

**WHY**
전정 장애 사용자에게 큰 이동·확대·시차 효과는 어지러움을 유발한다. `prefers-reduced-motion`을 무시하면 일부 사용자는 앱을 물리적으로 사용할 수 없다. 시각 QA에서 이를 검사하는 이유는, 축소 모션 상태의 화면도 **하나의 시각 상태**이기 때문이다.

**DETECT**

```bash
rg -n "prefers-reduced-motion|motion-reduce:|motion-safe:" src | wc -l
rg -n "animate-|transition-" src --glob "*.tsx" | wc -l
rg -n "autoPlay|loop" src --glob "*.tsx"
```

애니메이션 사용처 대비 `motion-reduce:` 대응이 현저히 적으면 결함이다.

**REPRODUCE**

```ts
test('축소 모션에서 장식 애니메이션이 제거된다', async ({ visualPage: page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  const animated = await page.evaluate(() =>
    document.getAnimations()
      .filter(a => {
        const timing = a.effect?.getTiming();
        return a.playState === 'running' && Number(timing?.duration ?? 0) > 200;
      })
      .map(a => ({
        // @ts-expect-error
        target: (a.effect as any)?.target?.className?.toString().slice(0, 50) ?? '?',
        duration: a.effect?.getTiming().duration,
      })));

  const allowed = /spinner|loading|skeleton|progress/;
  const unexpected = animated.filter(a => !allowed.test(String(a.target)));
  expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
});

test('축소 모션 상태 시각 회귀', async ({ visualPage: page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await stabilizeForCapture(page);
  await expect(page).toHaveScreenshot('home-reduced-motion.png');
});
```

**PASS / FAIL**

- PASS: 축소 모션에서 장식 애니메이션이 제거되거나 150ms 이하로 축소된다. 자동 재생 캐러셀·비디오가 정지한다. 화면 자체는 정상적으로 보인다(애니메이션 제거로 콘텐츠가 사라지지 않는다).
- FAIL: 애니메이션 그대로 재생(S2), 애니메이션 제거로 콘텐츠가 안 보임(**S1** — 진입 애니메이션의 `opacity: 0` 초기값이 남는 전형적 사고).

**FIX**

가장 위험한 패턴은 **진입 애니메이션이 제거되면서 초기 상태에 갇히는 것**이다.

```tsx
// ❌ 축소 모션에서 애니메이션이 제거되면 opacity: 0에 갇혀 영원히 안 보인다
<div className="animate-fade-in opacity-0 motion-reduce:animate-none">
  {content}
</div>

// ✅ 최종 상태를 기본값으로 두고 애니메이션이 초기값을 설정하게 한다
<div className="opacity-100 motion-safe:animate-fade-in">
  {content}
</div>
```

```css
/* ✅ 전역 안전망 — animation-fill-mode 문제를 함께 해결 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

`animation-duration: 0.01ms`는 애니메이션을 즉시 끝내되 **최종 프레임을 적용**하므로, `animation: none`보다 안전하다. `none`은 초기 상태에 갇히는 문제를 만들 수 있다.

```tsx
// ✅ Framer Motion
const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
/>
```

`initial={false}`는 초기 애니메이션을 건너뛰고 최종 상태로 렌더한다.

---

### V-MOTION-03 — 애니메이션 동작 검증

**WHY**
결정론을 위해 애니메이션을 정지시키면 "애니메이션이 실제로 동작하는가"는 검증하지 못한다. 전환이 아예 없어졌는데 아무도 모르는 상황이 생긴다. 애니메이션 동작은 **별도 테스트**에서 정지 없이 검증한다.

**DETECT**

```bash
rg -n "animate-in|animate-out|data-\[state=open\]:animate" src --glob "*.tsx"
rg -n "AnimatePresence|motion\." src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
// tests/visual/motion.spec.ts — 이 파일에서는 애니메이션을 정지시키지 않는다
import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('모달 진입 애니메이션이 동작한다', async ({ page }) => {
  await page.goto('/settings/members');
  await page.getByRole('button', { name: '멤버 초대' }).click();

  const dialog = page.getByRole('dialog');
  // 애니메이션 시작 직후 중간 상태
  await page.waitForTimeout(50);
  const mid = await dialog.evaluate(el => ({
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));

  // 완료 후 최종 상태
  await page.waitForTimeout(500);
  const final = await dialog.evaluate(el => ({
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));

  expect(final.opacity).toBe('1');
  expect(mid, '진입 애니메이션이 동작하지 않음').not.toEqual(final);
});

test('애니메이션 지속 시간이 적절하다', async ({ page }) => {
  await page.goto('/dashboard');
  const durations = await page.evaluate(() => {
    const out: number[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const cs = getComputedStyle(el);
      for (const d of cs.transitionDuration.split(',')) {
        const ms = parseFloat(d) * (d.includes('ms') ? 1 : 1000);
        if (ms > 0) out.push(ms);
      }
    }
    return [...new Set(out)].sort((a, b) => a - b);
  });

  // 500ms를 넘는 UI 전환은 느리게 느껴진다
  const tooSlow = durations.filter(d => d > 500);
  expect(tooSlow, `과도한 전환 시간: ${tooSlow}ms`).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 주요 전환(모달, 드롭다운, 토스트)이 실제로 동작한다. 지속 시간이 150~400ms 범위다. 이징이 일관된다.
- FAIL: 애니메이션 미동작(S3), 500ms 초과로 둔함(S3), 화면마다 다른 이징(S3).

**FIX**

```js
// tailwind.config.ts — 지속 시간과 이징을 토큰화
transitionDuration: {
  fast: '150ms',
  DEFAULT: '200ms',
  slow: '300ms',
},
transitionTimingFunction: {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
},
```

기준: 작은 요소(툴팁, 버튼) 150ms, 중간(드롭다운, 아코디언) 200ms, 큰 요소(모달, 드로어) 300ms. 나가는 애니메이션은 들어오는 것보다 짧게(약 2/3) 한다.

---

### V-MOTION-04 — 스크롤 연동 효과

**WHY**
스크롤에 따라 나타나는 애니메이션(fade-in on scroll)은 (a) JS가 실패하면 콘텐츠가 영원히 안 보이고, (b) 스크린샷 캡처 시 뷰포트 밖 요소가 `opacity: 0`으로 남아 full page 캡처가 빈 화면이 되며, (c) 축소 모션 대응이 누락되기 쉽다.

**DETECT**

```bash
rg -n "IntersectionObserver" src --glob "*.tsx" -A6
rg -n "useInView|whileInView|animate-on-scroll" src
rg -n "scroll-timeline|animation-timeline|view\(\)" src --glob "*.css"
rg -n "opacity-0" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
test('full page 캡처에서 스크롤 애니메이션 요소가 보인다', async ({ visualPage: page }) => {
  await page.goto('/');
  // 전체 스크롤로 IntersectionObserver 트리거
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await stabilizeForCapture(page);

  const invisible = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main section, main article')]
      .filter(el => Number(getComputedStyle(el).opacity) < 0.9)
      .map(el => String(el.className).slice(0, 60)));

  expect(invisible, `보이지 않는 섹션: ${JSON.stringify(invisible)}`).toEqual([]);
});

test('JS 비활성 상태에서도 콘텐츠가 보인다', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main section')]
      .filter(el => Number(getComputedStyle(el).opacity) < 0.5).length);
  expect(hidden, 'JS 없이 콘텐츠가 숨겨짐').toBe(0);
  await context.close();
});
```

**PASS / FAIL**

- PASS: 스크롤 애니메이션 요소가 전체 스크롤 후 모두 보인다. JS 비활성 시에도 콘텐츠가 표시된다. 축소 모션에서 즉시 표시된다.
- FAIL: full page 캡처에 빈 섹션(결정론 문제 + S2), JS 실패 시 콘텐츠 소실(**S1**).

**FIX**

```tsx
// ❌ JS 실패 시 영원히 opacity: 0
<div ref={ref} className={cn('opacity-0 transition-opacity', inView && 'opacity-100')}>

// ✅ 기본은 보이는 상태, JS가 애니메이션을 "추가"
<div
  ref={ref}
  data-animate={inView ? 'in' : 'out'}
  className="motion-safe:data-[animate=out]:opacity-0 motion-safe:data-[animate=out]:translate-y-4 transition-[opacity,transform] duration-500"
>
```

`motion-safe:`를 붙이면 축소 모션 설정에서 초기 숨김 자체가 적용되지 않아 항상 보인다. JS가 실패하면 `data-animate` 속성이 없으므로 기본 상태(보임)가 유지된다.

CSS 스크롤 주도 애니메이션을 쓰면 JS 없이 처리할 수 있다.

```css
/* ✅ 점진 향상: 지원 브라우저에서만 적용 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal-on-scroll {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 60%;
    }
    @keyframes reveal {
      from { opacity: 0; transform: translateY(1rem); }
      to   { opacity: 1; transform: none; }
    }
  }
}
```

---

## 15. Component 시각 정합성

### V-COMP-01 — Variant 매트릭스 커버리지

**WHY**
Button에 variant 6종 × size 4종 = 24개 조합이 있는데 페이지에서 3개만 쓰이면, 나머지 21개는 아무도 본 적 없는 상태로 코드에 존재한다. 누군가 새 화면에서 `variant="warning" size="lg"`를 쓰는 순간 깨진 UI가 배포된다. Variant 매트릭스는 **한 번의 스냅샷으로 전수 검증**할 수 있다.

**DETECT**

```bash
rg -n "cva\(|tv\(" src --glob "*.tsx" -A30 | rg "variants:" -A20
rg -o "variant: \{[^}]*\}" src --glob "*.tsx" | head -10
# 실제 사용되는 variant
rg -o 'variant="[a-z]+"' src | sort | uniq -c | sort -rn
```

정의된 variant와 사용되는 variant를 비교해 미검증 조합을 찾는다.

**REPRODUCE**

```tsx
// app/(dev)/visual-catalog/components/button-matrix.tsx
const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const SIZES = ['sm', 'default', 'lg', 'icon'] as const;
const STATES = ['normal', 'disabled', 'loading'] as const;

export function ButtonMatrix() {
  return (
    <div data-testid="catalog-button-matrix" className="w-fit space-y-6 p-6">
      {STATES.map(state => (
        <div key={state}>
          <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{state}</h3>
          <table className="border-separate border-spacing-3">
            <thead>
              <tr>
                <th />
                {SIZES.map(s => <th key={s} className="text-[10px] font-normal text-muted-foreground">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {VARIANTS.map(v => (
                <tr key={v}>
                  <th className="pr-2 text-right text-[10px] font-normal text-muted-foreground">{v}</th>
                  {SIZES.map(s => (
                    <td key={s}>
                      <Button
                        variant={v}
                        size={s}
                        disabled={state === 'disabled'}
                        aria-busy={state === 'loading'}
                      >
                        {s === 'icon' ? <PlusIcon className="size-4" /> : '버튼'}
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
```

```ts
test.describe('컴포넌트 매트릭스', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`Button 전체 매트릭스 (${theme})`, async ({ visualPage: page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/visual-catalog');
      await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
      await stabilizeForCapture(page);
      await expect(page.getByTestId('catalog-button-matrix'))
        .toHaveScreenshot(`button-matrix-${theme}.png`);
    });
  }
});
```

정의-사용 격차도 자동으로 검사할 수 있다.

```ts
test('정의된 모든 variant가 카탈로그에 있다', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  const rendered = await page.getByTestId('catalog-button-matrix')
    .locator('button').count();
  const expected = 6 * 4 * 3;  // variant × size × state
  expect(rendered).toBe(expected);
});
```

**PASS / FAIL**

- PASS: 디자인 시스템 컴포넌트의 모든 variant × size × state 조합이 매트릭스 스냅샷으로 커버된다. 두 테마 모두.
- FAIL: 미검증 조합 존재(S3), 특정 조합에서 깨짐(S2).

**FIX**
매트릭스 컴포넌트를 variant 정의에서 자동 생성하면 누락이 구조적으로 불가능해진다.

```tsx
// ✅ cva 정의에서 variant 목록을 추출
import { buttonVariants } from '@/components/ui/button';

// cva의 내부 config에 접근하거나, 별도로 export
export const BUTTON_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
export const BUTTON_SIZES = ['sm', 'default', 'lg', 'icon'] as const;
```

컴포넌트와 매트릭스가 같은 상수를 참조하면, variant를 추가할 때 매트릭스도 자동으로 늘어난다.

---

### V-COMP-02 — 컴포넌트 조합과 컨텍스트

**WHY**
격리 렌더에서 완벽한 컴포넌트가 실제 배치에서 깨지는 경우가 있다. 좁은 컨테이너 안, 다른 컴포넌트 옆, 중첩된 카드 안, 스크롤 영역 내부에서 다르게 보인다. 격리 테스트만으로는 이를 잡을 수 없다.

**DETECT**

```bash
rg -n "@container" src --glob "*.tsx" | wc -l
rg -n "min-w-0|shrink-0|flex-1" src --glob "*.tsx" | wc -l
rg -n "Card.*Card|nested" src --glob "*.tsx" | head -10
```

**REPRODUCE**

```tsx
// 조합 시나리오를 카탈로그에 추가
<section data-testid="catalog-compositions" className="space-y-8 p-6">
  {/* 좁은 컨테이너 */}
  <div className="w-48 rounded border p-3">
    <Button className="w-full">아주 긴 버튼 라벨 텍스트</Button>
  </div>

  {/* 나란히 배치 */}
  <div className="flex gap-2">
    <Button variant="outline">취소</Button>
    <Button>확인</Button>
    <DropdownMenu>...</DropdownMenu>
  </div>

  {/* 중첩 카드 */}
  <Card className="p-4">
    <Card className="p-3">
      <Badge>중첩</Badge>
    </Card>
  </Card>

  {/* 폼 안 */}
  <form className="max-w-sm space-y-3">
    <Input placeholder="이메일" />
    <Select>...</Select>
    <Button type="submit" className="w-full">가입</Button>
  </form>
</section>
```

```ts
test('컴포넌트 조합 시각 회귀', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);
  await expect(page.getByTestId('catalog-compositions'))
    .toHaveScreenshot('compositions.png');
});
```

**PASS / FAIL**

- PASS: 좁은 컨테이너·나란한 배치·중첩·폼 컨텍스트에서 컴포넌트가 정상 렌더된다.
- FAIL: 좁은 폭에서 텍스트 오버플로(S2), 중첩 시 반경/여백 어긋남(S3), 나란한 배치에서 높이 불일치(S3).

**FIX**

```tsx
// ✅ 컴포넌트가 스스로 방어한다
const buttonVariants = cva([
  'inline-flex items-center justify-center gap-2',
  'min-w-0',              // flex 자식으로서 축소 허용
  'whitespace-nowrap',    // 의도적: 버튼 텍스트는 줄바꿈하지 않는다
  '[&>span]:truncate',    // 넘치면 자른다
]);
```

나란한 배치의 높이 불일치는 대개 서로 다른 `size` 기본값 때문이다. 폼 요소들의 높이 토큰을 통일한다.

```js
// tailwind.config.ts
height: {
  'control-sm': '2rem',      // 32px
  'control':    '2.5rem',    // 40px — Input, Button, Select 기본
  'control-lg': '2.75rem',   // 44px
},
```

---

### V-COMP-03 — 컴포넌트 반응형 동작

**WHY**
컴포넌트가 뷰포트 media query에 의존하면, 사이드바가 접혔을 때나 병렬 패널 안에 있을 때 잘못된 레이아웃을 선택한다. 뷰포트는 1920px인데 컴포넌트가 실제로 차지하는 폭은 320px일 수 있다. Container query가 이 문제를 해결한다.

**DETECT**

```bash
rg -n "@container|container-type" src --glob "*.tsx" --glob "*.css"
rg -o "(sm|md|lg|xl|2xl):" src --glob "*.tsx" | wc -l
rg -o "@(sm|md|lg|xl):" src --glob "*.tsx" | wc -l
```

컴포넌트 파일에서 뷰포트 breakpoint 사용이 많고 container query가 0이면 검토 대상이다.

**REPRODUCE**

```tsx
// 동일 컴포넌트를 여러 폭에 배치해 한 화면에서 비교
<section data-testid="catalog-responsive" className="space-y-6 p-6">
  {[240, 320, 480, 640, 800].map(w => (
    <div key={w} style={{ width: w }} className="rounded border">
      <div className="border-b px-2 py-1 text-[10px] text-muted-foreground">{w}px</div>
      <MetricCard label="월 반복 매출" value="₩12,480,000" delta="+8.2%" />
    </div>
  ))}
</section>
```

```ts
test('컴포넌트가 컨테이너 폭에 반응한다', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);
  await expect(page.getByTestId('catalog-responsive'))
    .toHaveScreenshot('metric-card-widths.png');

  // 좁은 폭에서 오버플로가 없어야 한다
  const overflows = await page.getByTestId('catalog-responsive')
    .locator('[data-testid="metric-card"]').evaluateAll(els =>
      els.map(el => el.scrollWidth - el.clientWidth).filter(d => d > 1));
  expect(overflows).toEqual([]);
});
```

**PASS / FAIL**

- PASS: 컴포넌트가 240px~800px 컨테이너에서 모두 정상 렌더되고, 좁은 폭에서 내용이 적절히 축약된다.
- FAIL: 좁은 컨테이너에서 오버플로(S2), 넓은 컨테이너에서 요소가 과도하게 늘어남(S3).

**FIX**

```tsx
// ✅ container query로 자기 폭에 반응
<div data-testid="metric-card" className="@container rounded-lg border p-4">
  <div className="flex flex-col gap-1 @sm:flex-row @sm:items-baseline @sm:justify-between">
    <span className="truncate text-sm text-muted-foreground">{label}</span>
    <span className="text-2xl font-semibold tabular-nums @lg:text-3xl">{value}</span>
  </div>
  <div className="mt-2 flex items-center gap-2">
    <TrendBadge delta={delta} />
    <span className="hidden truncate text-xs text-muted-foreground @md:inline">
      전월 대비
    </span>
  </div>
</div>
```

```js
// tailwind.config.ts — container query 활성화
plugins: [require('@tailwindcss/container-queries')],
```

---

### V-COMP-04 — 컴포넌트 스타일 오버라이드 안전성

**WHY**
`className` prop으로 스타일을 덮어쓸 수 있게 만든 컴포넌트는 유연하지만, 오버라이드가 내부 스타일과 충돌하면 예측 불가능해진다. Tailwind는 클래스 순서가 아니라 CSS 생성 순서로 우선순위가 결정되므로, `cn()` 없이 문자열을 이어붙이면 의도한 오버라이드가 적용되지 않는다.

**DETECT**

```bash
rg -n "className=\{`" src --glob "*.tsx" | head -20        # 템플릿 리터럴 병합
rg -n "className=\{.*\+ .*className" src --glob "*.tsx"    # 문자열 연결
rg -n "cn\(|twMerge" src --glob "*.tsx" | wc -l
rg -n "!important|!\[" src --glob "*.tsx"
```

`!` 접두사(`!bg-red-500`)가 많으면 우선순위 문제를 억지로 해결하고 있다는 신호다.

**REPRODUCE**

```tsx
// 오버라이드 시나리오를 카탈로그에 추가
<section data-testid="catalog-overrides" className="space-y-3 p-6">
  <Button>기본</Button>
  <Button className="bg-emerald-600 hover:bg-emerald-700">색상 오버라이드</Button>
  <Button className="h-14 px-8 text-lg">크기 오버라이드</Button>
  <Button className="rounded-full">반경 오버라이드</Button>
  <Button variant="outline" className="border-2 border-dashed">경계 오버라이드</Button>
</section>
```

```ts
test('스타일 오버라이드가 예측대로 적용된다', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);
  await expect(page.getByTestId('catalog-overrides')).toHaveScreenshot('button-overrides.png');

  // 실제로 오버라이드가 적용되었는지 값으로 검증
  const bg = await page.locator('[data-testid="catalog-overrides"] button')
    .nth(1).evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgb(0, 0, 0)');  // 기본 primary가 아닌 emerald여야 한다
});
```

**PASS / FAIL**

- PASS: `className` 오버라이드가 의도대로 적용된다. `!important`나 `!` 접두사가 필요 없다. `cn()`(tailwind-merge)을 일관되게 사용한다.
- FAIL: 오버라이드 미적용(S3), `!` 남용(S3 — 구조 문제 신호).

**FIX**

```tsx
// ❌ 문자열 병합 — 중복 클래스가 남아 우선순위가 CSS 순서에 좌우된다
<button className={`px-4 py-2 bg-primary ${className}`}>

// ✅ tailwind-merge가 충돌 클래스를 제거하고 뒤쪽을 남긴다
<button className={cn('px-4 py-2 bg-primary', className)}>
```

```tsx
// ✅ 오버라이드를 허용하되 필수 스타일은 보호
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        className,                                    // 사용자 오버라이드
        'disabled:pointer-events-none disabled:opacity-50',  // 보호: 항상 마지막
      )}
      {...props}
    />
  ),
);
```

접근성이나 안전성에 관련된 스타일은 오버라이드 뒤에 두어 보호한다.

---

### V-COMP-05 — 컴포넌트 간 시각 일관성

**WHY**
Button의 높이는 40px인데 Input은 38px, Select는 42px이면 폼이 들쭉날쭉해진다. Badge와 Chip이 서로 다른 반경을 쓰고, Card와 Dialog가 다른 그림자를 쓰면 같은 제품처럼 보이지 않는다. 컴포넌트별로 따로 만들면 반드시 발생하는 문제다.

**DETECT**

```bash
rg -n "h-9|h-10|h-11" src/components/ui --glob "*.tsx"
rg -o "rounded-[a-z]+" src/components/ui --glob "*.tsx" | sort | uniq -c
rg -o "px-[0-9]+" src/components/ui --glob "*.tsx" | sort | uniq -c
```

**REPRODUCE**

```tsx
// 폼 컨트롤을 나란히 배치해 높이를 비교
<section data-testid="catalog-form-alignment" className="p-6">
  <div className="flex items-center gap-2">
    <Input placeholder="입력" className="w-32" />
    <Select><SelectTrigger className="w-32"><SelectValue placeholder="선택" /></SelectTrigger></Select>
    <Button>버튼</Button>
    <Button variant="outline">외곽선</Button>
    <DatePicker />
  </div>
</section>
```

```ts
test('폼 컨트롤 높이가 통일된다', async ({ visualPage: page }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);

  const heights = await page.locator('[data-testid="catalog-form-alignment"] > div > *')
    .evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().height)));

  const unique = [...new Set(heights)];
  expect(unique.length, `폼 컨트롤 높이 ${unique.length}종: ${heights}`).toBe(1);

  await expect(page.getByTestId('catalog-form-alignment'))
    .toHaveScreenshot('form-alignment.png');
});
```

**PASS / FAIL**

- PASS: 같은 크기 등급의 폼 컨트롤 높이가 동일하다. 반경·그림자·경계가 컴포넌트 간 일관된다.
- FAIL: 높이 불일치(S2 — 폼에서 명확히 인지됨), 반경/그림자 불일치(S3).

**FIX**

```tsx
// ✅ 공통 기본 클래스를 공유
const controlBase = 'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'ring-offset-background placeholder:text-muted-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

// Input, SelectTrigger, Textarea(min-h), DatePicker 등이 모두 이 기반을 사용
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, 'w-full', className)} {...props} />
));
```

---

## 16. Content 변동 내성

### V-CONTENT-01 — 긴 텍스트

**WHY**
디자인 시안의 "김민준"은 실제로 "주식회사 대한민국종합기술개발공사"가 되고, "대시보드"는 "Comprehensive Analytics Dashboard"가 된다. 이름·제목·설명이 예상보다 길면 오버플로, 줄바꿈, 레이아웃 붕괴가 발생한다. 실 데이터로만 테스트하면 이 결함은 배포 후에 발견된다.

**DETECT**

```bash
rg -n "truncate|line-clamp|text-ellipsis" src --glob "*.tsx" | wc -l
rg -n "whitespace-nowrap" src --glob "*.tsx" | wc -l
rg -n "w-\[[0-9]+px\]|max-w-\[[0-9]+px\]" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
// tests/visual/content-stress.spec.ts
const LONG_KO = '주식회사 대한민국종합기술개발공사 서울특별시지사 기술연구소';
const LONG_EN = 'Comprehensive Enterprise Analytics and Reporting Dashboard Platform';
const LONG_EMAIL = 'very.long.email.address.for.testing@subdomain.example-company.co.kr';
const NO_SPACE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

test('긴 콘텐츠에서 레이아웃이 유지된다', async ({ visualPage: page }) => {
  await page.route('**/api/members*', route => route.fulfill({
    json: {
      rows: [
        { id: '1', name: LONG_KO, email: LONG_EMAIL, role: 'admin', lastSeen: '2026-07-30' },
        { id: '2', name: LONG_EN, email: 'a@b.co', role: 'member', lastSeen: '2026-07-29' },
        { id: '3', name: NO_SPACE, email: NO_SPACE + '@example.com', role: 'viewer', lastSeen: '2026-07-28' },
      ],
      total: 3,
    },
  }));

  await page.goto('/settings/members');
  await stabilizeForCapture(page);

  // 문서 가로 오버플로 없음
  const delta = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(delta, `가로 오버플로 ${delta}px`).toBeLessThanOrEqual(1);

  await expect(page.getByTestId('members-table')).toHaveScreenshot('members-long-content.png');
});
```

**PASS / FAIL**

- PASS: 긴 한글·영문·이메일·공백 없는 문자열에서 가로 오버플로가 없고, 잘림이 의도적으로 처리된다(truncate + 전체 값 확인 수단).
- FAIL: 문서 가로 스크롤(S2), 열 폭 붕괴(S2), 컨테이너 밖으로 텍스트 삐져나옴(S2).

**FIX**

```tsx
// ✅ 테이블 셀: 고정 폭 + truncate + 전체 값 확인
<td className="max-w-0 px-4 py-3">
  <span className="block truncate" title={member.email}>{member.email}</span>
</td>
```

`max-w-0`은 `table-layout: fixed`와 함께 쓸 때 셀이 콘텐츠에 의해 늘어나는 것을 막는 관용구다.

```css
/* ✅ 공백 없는 긴 문자열 대비 전역 안전망 */
:root {
  overflow-wrap: break-word;
  word-break: keep-all;    /* 한글 어절 단위 */
}

/* URL·토큰·해시 전용 */
.break-anywhere {
  overflow-wrap: anywhere;
}
```

---

### V-CONTENT-02 — 빈 값과 누락 데이터

**WHY**
`null`, `undefined`, 빈 문자열이 화면에 그대로 나오면 "undefined", "null", "NaN"이 표시되거나 레이아웃이 무너진다. 아바타가 없으면 깨진 이미지가, 설명이 없으면 카드 높이가 달라진다. API가 항상 완전한 데이터를 준다고 가정하면 안 된다.

**DETECT**

```bash
rg -n "\{[a-zA-Z.]+\}" src --glob "*.tsx" | rg -v "\?\?|\|\||\?\." | head -30
rg -n "toFixed|toLocaleString" src | rg -v "\?\?|\|\|" | head -20
rg -n "\.length" src --glob "*.tsx" | rg -v "\?\." | head -20
```

**REPRODUCE**

```ts
test('빈 값에서 화면이 무너지지 않는다', async ({ visualPage: page }) => {
  await page.route('**/api/members*', route => route.fulfill({
    json: {
      rows: [
        { id: '1', name: '', email: null, role: undefined, lastSeen: null, avatar: null },
        { id: '2', name: '정상', email: 'ok@example.com', role: 'admin', lastSeen: '2026-07-30' },
        { id: '3' },  // 필드 자체가 없음
      ],
      total: 3,
    },
  }));

  await page.goto('/settings/members');
  await stabilizeForCapture(page);

  // undefined/null/NaN 문자열 노출 검사
  const text = await page.getByTestId('members-table').innerText();
  expect(text).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]/);

  await expect(page.getByTestId('members-table')).toHaveScreenshot('members-empty-values.png');
});
```

**PASS / FAIL**

- PASS: 빈 값이 대체 표현(`—`, `이름 없음`, 이니셜 아바타)으로 표시된다. "undefined"/"null"/"NaN" 문자열이 노출되지 않는다. 행 높이가 유지된다.
- FAIL: 원시 값 노출(S2), 레이아웃 붕괴(S2), 이미지 깨짐(S3).

**FIX**

```tsx
// ✅ 표시 계층에서 방어
function displayValue(v: unknown, fallback = '—'): string {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'number' && !Number.isFinite(v)) return fallback;
  return String(v);
}

<td className="px-4 py-3 text-muted-foreground">{displayValue(member.email)}</td>
```

```tsx
// ✅ 아바타 폴백: 이니셜
function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
  const initials = (name ?? '?').trim().slice(0, 2).toUpperCase();
  return (
    <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
      {src ? (
        <Image src={src} alt="" fill sizes="32px" className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}
```

근본 해결은 스키마 검증이다. Zod로 API 응답을 파싱하면 누락 필드가 런타임에 드러난다.

```ts
const MemberSchema = z.object({
  id: z.string(),
  name: z.string().default('이름 없음'),
  email: z.string().nullable().default(null),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});
```

---

### V-CONTENT-03 — 극단적 수치와 포맷

**WHY**
`₩1,234,567,890,123`, `-99.99%`, `0`, `1,000,000+`처럼 예상 범위를 벗어나는 값이 들어오면 카드가 넘치거나 숫자가 잘린다. 특히 대시보드 KPI는 고정 폭에서 큰 폰트로 표시되므로 자릿수가 늘어나면 즉시 깨진다.

**DETECT**

```bash
rg -n "toLocaleString|Intl.NumberFormat|formatCurrency|formatNumber" src | head -20
rg -n "text-3xl|text-4xl|text-5xl" src --glob "*metric*" --glob "*card*"
rg -n "tabular-nums" src | wc -l
```

**REPRODUCE**

```ts
const EXTREME_VALUES = [
  { label: '0', value: 0 },
  { label: '큰 수', value: 1234567890123 },
  { label: '음수', value: -9876543 },
  { label: '소수', value: 0.00001234 },
  { label: '긴 퍼센트', value: -99.99 },
];

test('극단 수치에서 카드가 깨지지 않는다', async ({ visualPage: page }) => {
  await page.route('**/api/metrics/**', route => route.fulfill({
    json: {
      mrr: 1234567890123,
      growth: -99.99,
      users: 0,
      churn: 0.00001234,
    },
  }));

  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const overflows = await page.getByTestId('metric-card').evaluateAll(els =>
    els.map(el => ({
      text: (el.textContent ?? '').trim().slice(0, 30),
      overflow: el.scrollWidth - el.clientWidth,
    })).filter(x => x.overflow > 1));

  expect(overflows, JSON.stringify(overflows)).toEqual([]);
  await expect(page.getByTestId('metrics-grid')).toHaveScreenshot('metrics-extreme.png');
});
```

**PASS / FAIL**

- PASS: 극단 수치에서 카드가 넘치지 않고, 큰 수는 축약 표기(1.2조, 1.2B)되거나 폰트가 축소된다. 숫자에 `tabular-nums`가 적용된다.
- FAIL: 카드 오버플로(S2), 숫자 잘림(S2), 자릿수에 따라 열 정렬이 흔들림(S3).

**FIX**

```ts
// ✅ 큰 수 축약 + 로케일 대응
export function formatCompact(value: number, locale = 'ko-KR') {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
// 1234567890123 → "1.2조"
```

```tsx
// ✅ 자릿수에 따라 폰트 크기 조정 + 등폭 숫자
function MetricValue({ value }: { value: string }) {
  const size = value.length > 12 ? 'text-xl' : value.length > 8 ? 'text-2xl' : 'text-3xl';
  return (
    <span className={cn('block truncate font-semibold tabular-nums', size)} title={value}>
      {value}
    </span>
  );
}
```

`tabular-nums`는 숫자 글리프 폭을 균일하게 만들어 값이 바뀌어도 열 정렬이 유지된다. 대시보드와 테이블의 모든 숫자에 적용한다.

---

### V-CONTENT-04 — 다국어와 문자 집합

**WHY**
한국어 UI를 영어로 번역하면 텍스트 길이가 평균 30~50% 늘어난다. 독일어는 100%까지 늘어나고, 일본어·중국어는 짧아지지만 글자 높이가 달라진다. 아랍어·히브리어는 RTL이다. 고정 폭 버튼과 탭이 가장 먼저 깨진다.

**DETECT**

```bash
rg -n "next-intl|react-i18next|i18n" package.json
fd -e json . messages locales 2>/dev/null | head -10
rg -n "dir=|rtl:" src --glob "*.tsx"
rg -n "lang=" src/app/layout.tsx 2>/dev/null
```

**REPRODUCE**

```ts
const LOCALE_SAMPLES = {
  ko: { save: '저장', cancel: '취소', dashboard: '대시보드' },
  en: { save: 'Save', cancel: 'Cancel', dashboard: 'Dashboard' },
  de: { save: 'Speichern', cancel: 'Abbrechen', dashboard: 'Übersichtsseite' },
  ja: { save: '保存', cancel: 'キャンセル', dashboard: 'ダッシュボード' },
};

for (const [locale, messages] of Object.entries(LOCALE_SAMPLES)) {
  test(`${locale} 로케일 레이아웃`, async ({ visualPage: page }) => {
    await page.route('**/api/messages*', r => r.fulfill({ json: messages }));
    await page.goto(`/${locale}/dashboard`);
    await stabilizeForCapture(page);

    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta, `${locale} 가로 오버플로`).toBeLessThanOrEqual(1);

    await expect(page).toHaveScreenshot(`dashboard-${locale}.png`);
  });
}
```

i18n이 없는 프로젝트에서도 **의사 로컬라이제이션**으로 길이 내성을 검사할 수 있다.

```ts
test('의사 로컬라이제이션 (텍스트 40% 확장)', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if (n.textContent?.trim()) nodes.push(n as Text);
    }
    for (const node of nodes) {
      const t = node.textContent!;
      // 40% 늘리고 경계를 표시
      node.textContent = `[${t}${'～'.repeat(Math.ceil(t.length * 0.4))}]`;
    }
  });
  await stabilizeForCapture(page);

  const delta = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(delta, '텍스트 확장 시 오버플로').toBeLessThanOrEqual(1);
  await expect(page).toHaveScreenshot('dashboard-pseudo-loc.png');
});
```

**PASS / FAIL**

- PASS: 텍스트 40% 확장에서 오버플로가 없다. 지원 로케일 전부에서 레이아웃이 유지된다. RTL 지원 시 방향이 올바르게 반전된다.
- FAIL: 특정 로케일에서 버튼 텍스트 잘림(S2), 탭 오버플로(S2), RTL 미대응(S2).

**FIX**

```tsx
// ❌ 고정 폭 — 번역하면 넘친다
<Button className="w-24">저장</Button>

// ✅ 최소 폭 + 자연 확장
<Button className="min-w-24">저장</Button>
```

```tsx
// ✅ RTL 대응: 논리 속성 사용
// ❌ ml-4, pl-2, text-left, left-0
// ✅ ms-4, ps-2, text-start, start-0
<div className="ms-4 ps-2 text-start">
```

Tailwind의 논리 속성(`ms`, `me`, `ps`, `pe`, `start`, `end`)은 `dir="rtl"`에서 자동으로 반전된다.

---

### V-CONTENT-05 — 대량 데이터와 밀도

**WHY**
테이블에 3개 행이 있을 때와 500개 행이 있을 때 화면 인상이 완전히 다르다. 페이지네이션이 밀려나거나, sticky 헤더가 깨지거나, 스크롤바 등장으로 레이아웃이 흔들린다. 반대로 데이터가 하나뿐일 때 카드가 화면 전체로 늘어나는 문제도 흔하다.

**DETECT**

```bash
rg -n "pageSize|limit|take" src | rg -o "[0-9]+" | sort -n | uniq | tail -5
rg -n "grid-cols|auto-fit|auto-fill" src --glob "*.tsx" | head -20
rg -n "virtual|useVirtualizer" src
```

**REPRODUCE**

```ts
const DATA_SIZES = [0, 1, 3, 25, 100];

for (const size of DATA_SIZES) {
  test(`데이터 ${size}건 레이아웃`, async ({ visualPage: page }) => {
    await page.route('**/api/members*', r => r.fulfill({
      json: {
        rows: Array.from({ length: size }, (_, i) => ({
          id: String(i),
          name: `사용자 ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: ['admin', 'member', 'viewer'][i % 3],
          lastSeen: '2026-07-30',
        })),
        total: size,
      },
    }));

    await page.goto('/settings/members');
    await stabilizeForCapture(page);

    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta).toBeLessThanOrEqual(1);

    await expect(page.getByTestId('members-page'))
      .toHaveScreenshot(`members-${size}-rows.png`);
  });
}
```

**PASS / FAIL**

- PASS: 0/1/3/25/100건 모두에서 레이아웃이 자연스럽다. 항목이 적을 때 요소가 과도하게 늘어나지 않는다. 많을 때 스크롤바 등장으로 레이아웃이 흔들리지 않는다.
- FAIL: 1건일 때 카드가 화면 전체로 늘어남(S3), 100건에서 sticky 깨짐(S2), 스크롤바로 인한 흔들림(S2 — V-XB-04와 연계).

**FIX**

```css
/* ✅ 스크롤바 공간 예약으로 데이터 양에 따른 흔들림 제거 */
html { scrollbar-gutter: stable; }
```

```tsx
// ✅ 항목이 적어도 카드 폭 상한 유지 (auto-fill + max)
<div
  className="grid gap-4"
  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 24rem))' }}
>
```

`auto-fit`은 항목이 적으면 남은 공간을 나눠 가져 카드가 커진다. `auto-fill`과 최대 폭 지정으로 일정한 크기를 유지한다.

---

## 17. Responsive 시각 회귀

### 17.1 폭 매트릭스 선택

모든 폭을 캡처하면 스냅샷이 폭발한다. **breakpoint 경계 중심**으로 대표 폭을 고른다.

| 폭 | 목적 | 캡처 대상 |
|-----|------|-----------|
| **375** | 모바일 기준 (iPhone SE~13 mini) | P0 전부 |
| **390** | 모바일 주류 | P0 전부 |
| **768** | 태블릿 세로 / md 경계 | P0 |
| **1024** | 태블릿 가로 / lg 경계 · 데스크톱 최소 | P0 전부 |
| **1280** | 소형 노트북 / xl 경계 | P0 |
| **1440** | 데스크톱 기준 | P0 전부 |
| **1920** | 대형 모니터 | P0 |
| **2560** | 초광폭 정책 확인 | P0 일부 |

**최소 구성:** 390 / 1024 / 1440 세 폭. 여기에 프로젝트 특성에 따라 추가한다.

### V-RESP-01 — 폭별 시각 회귀 캡처

**WHY**
데스크톱에서만 캡처하면 모바일 회귀를 전혀 잡지 못한다. 반대로 모든 폭을 full page로 캡처하면 스냅샷 수가 관리 불가능해진다. 폭 × 라우트 × 테마 조합을 의도적으로 설계해야 한다.

**DETECT**

```bash
rg -n "setViewportSize|viewport:" tests | head -20
rg -n "devices\[" playwright.config.*
fd -e png . --glob "**/__screenshots__/**" | sed 's/.*\///' | rg -o "[0-9]{3,4}" | sort -n | uniq -c
```

**REPRODUCE**

```ts
// tests/visual/responsive.spec.ts
const WIDTHS = [
  { w: 390,  h: 844,  name: 'mobile' },
  { w: 768,  h: 1024, name: 'tablet' },
  { w: 1024, h: 768,  name: 'laptop-min' },
  { w: 1440, h: 900,  name: 'desktop' },
  { w: 1920, h: 1080, name: 'desktop-lg' },
];

const ROUTES = [
  { path: '/',                 id: 'home',      themes: ['light', 'dark'] },
  { path: '/pricing',          id: 'pricing',   themes: ['light'] },
  { path: '/dashboard',        id: 'dashboard', themes: ['light', 'dark'] },
  { path: '/settings/members', id: 'members',   themes: ['light'] },
];

for (const route of ROUTES) {
  for (const vp of WIDTHS) {
    for (const theme of route.themes) {
      test(`${route.id} @${vp.name} (${theme})`, async ({ visualPage: page }) => {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' });
        await page.goto(route.path);
        await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
        await stabilizeForCapture(page);

        // 오버플로 어설션을 먼저 (원인 추적 가능)
        const delta = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(delta, `가로 오버플로 ${delta}px`).toBeLessThanOrEqual(1);

        await expect(page).toHaveScreenshot(`${route.id}-${vp.name}-${theme}.png`);
      });
    }
  }
}
```

**PASS / FAIL**

- PASS: P0 라우트가 최소 3개 폭 × 필요한 테마에서 캡처된다. 모든 폭에서 가로 오버플로가 없다.
- FAIL: 특정 폭 미검증(S3), 오버플로 발생(S2).

**FIX**
스냅샷 수를 통제하려면 **폭별로 캡처 범위를 다르게** 한다.

```ts
// ✅ 모바일은 full page, 데스크톱은 섹션 단위
if (vp.w < 768) {
  await expect(page).toHaveScreenshot(`${route.id}-${vp.name}.png`, { fullPage: true });
} else {
  for (const section of SECTIONS) {
    await expect(section.locator(page)).toHaveScreenshot(`${route.id}-${section.id}-${vp.name}.png`);
  }
}
```

---

### V-RESP-02 — Breakpoint 경계 전환

**WHY**
결함은 breakpoint 정확값이 아니라 **직전 1px**에서 발생한다. `lg:1024px`에서 사이드바가 나타난다면 1023px과 1024px 둘 다 확인해야 한다. 두 레이아웃이 동시에 렌더되거나 둘 다 사라지는 사고가 이 지점에서 나온다.

**DETECT**

```bash
cat tailwind.config.* | rg -A12 "screens"
rg -n "hidden (sm|md|lg|xl):block|(sm|md|lg|xl):hidden" src --glob "*.tsx" | head -20
```

**REPRODUCE**

```ts
const BOUNDARIES = [639, 640, 767, 768, 1023, 1024, 1279, 1280, 1535, 1536];

test('breakpoint 경계에서 레이아웃 전환이 안전하다', async ({ visualPage: page }) => {
  for (const width of BOUNDARIES) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dashboard');
    await stabilizeForCapture(page);

    // 오버플로
    const delta = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta, `@${width} 오버플로 ${delta}px`).toBeLessThanOrEqual(1);

    // 중복 네비게이션
    const navCount = await page.getByRole('navigation', { name: '사이드바 메뉴' }).count();
    expect(navCount, `@${width} 네비게이션 ${navCount}개`).toBeLessThanOrEqual(1);
  }
});

// 경계 폭 스냅샷은 대표 지점만
for (const width of [1023, 1024]) {
  test(`경계 스냅샷 @${width}`, async ({ visualPage: page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dashboard');
    await stabilizeForCapture(page);
    await expect(page).toHaveScreenshot(`dashboard-boundary-${width}.png`);
  });
}
```

**PASS / FAIL**

- PASS: 모든 경계에서 오버플로가 없고 중복 요소가 나타나지 않는다. 전환이 자연스럽다.
- FAIL: 경계에서 오버플로(S2), 중복 렌더(S2), 양쪽 모두 숨김(S1).

**FIX**
경계 검사는 **어설션 중심**으로 하고 스냅샷은 대표 2개만 남긴다. 10개 경계 × 스냅샷은 유지 비용이 크다.

---

### V-RESP-03 — 모바일 전용 시각 요소

**WHY**
바텀 시트, 하단 탭 바, 스와이프 캐러셀, 풀스크린 드로어는 모바일에서만 나타나므로 데스크톱 캡처로는 전혀 검증되지 않는다. 또 safe area(노치, 홈 인디케이터) 대응이 없으면 콘텐츠가 시스템 UI에 가린다.

**DETECT**

```bash
rg -n "safe-area-inset|env\(safe-area" src --glob "*.css" --glob "*.tsx"
rg -n "BottomSheet|Drawer|SheetContent.*bottom" src --glob "*.tsx"
rg -n "fixed bottom-0|inset-x-0 bottom-0" src --glob "*.tsx"
rg -n "100dvh|100svh|100lvh" src
```

**REPRODUCE**

```ts
import { devices } from '@playwright/test';

test.describe('모바일 전용 UI', () => {
  test.use({ ...devices['iPhone 13'] });

  test('바텀 시트 시각 회귀', async ({ page }) => {
    await prepareDeterminism(page);
    await page.goto('/settings/members');
    await page.getByRole('button', { name: '필터' }).click();
    await page.waitForSelector('[role="dialog"]');
    await stabilizeForCapture(page);
    await expect(page).toHaveScreenshot('bottom-sheet-ios.png');
  });

  test('하단 고정 UI가 safe area를 존중한다', async ({ page }) => {
    await page.goto('/checkout');
    await stabilizeForCapture(page);

    const padding = await page.getByTestId('sticky-cta').evaluate(el =>
      getComputedStyle(el).paddingBottom);
    // env(safe-area-inset-bottom)이 적용되면 0보다 크다 (실기기 기준)
    console.log('하단 패딩:', padding);

    await expect(page.getByTestId('sticky-cta')).toHaveScreenshot('checkout-cta-ios.png');
  });
});
```

**PASS / FAIL**

- PASS: 모바일 전용 컴포넌트가 실제 모바일 디바이스 프로필에서 캡처된다. safe area 패딩이 적용된다.
- FAIL: 모바일 전용 UI 미검증(S3), safe area 미대응으로 콘텐츠 가림(S2).

**FIX**

```css
/* ✅ safe area 대응 */
.sticky-cta {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
```

상세 모바일 검사는 `02_Mobile_QA.md`를 따른다. 이 문서에서는 **시각 회귀 캡처 대상에 모바일 전용 UI가 포함되어 있는지**만 확인한다.

---

### V-RESP-04 — 초광폭 시각 정책

**WHY**
2560px 이상에서 콘텐츠가 무제한 늘어나면 줄 길이가 200자가 되고, 반대로 좁은 컨테이너에 갇히면 좌우에 900px씩 빈 공간이 남는다. 두 경우 모두 시각적으로 미완성이며, 데스크톱 캡처를 1440px에서만 하면 발견되지 않는다.

**DETECT**

```bash
rg -o "max-w-(screen-)?[a-z0-9]+" src --glob "*.tsx" | sort | uniq -c | sort -rn
rg -n "2xl:|3xl:|min-\[1920px\]" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('초광폭에서 레이아웃 정책이 유지된다', async ({ visualPage: page }) => {
  await page.setViewportSize({ width: 2560, height: 1300 });
  await page.goto('/');
  await stabilizeForCapture(page);

  // 본문 줄 길이
  const widths = await page.locator('main p').evaluateAll(els =>
    els.filter(el => (el.textContent ?? '').length > 80)
       .map(el => Math.round(el.getBoundingClientRect().width)));
  for (const w of widths) {
    expect(w, `본문 폭 ${w}px — 줄 길이 과다`).toBeLessThanOrEqual(900);
  }

  // 콘텐츠 영역 비율
  const ratio = await page.evaluate(() => {
    const main = document.querySelector('main')!;
    const content = main.firstElementChild!;
    return content.getBoundingClientRect().width / window.innerWidth;
  });
  expect(ratio, `콘텐츠 비율 ${(ratio * 100).toFixed(0)}%`).toBeGreaterThan(0.4);

  await expect(page).toHaveScreenshot('home-ultrawide.png');
});
```

**PASS / FAIL**

- PASS: 2560px에서 본문 줄 길이가 900px 이하이고 콘텐츠 영역이 40% 이상을 차지한다. 여백이 의도적으로 보인다.
- FAIL: 줄 길이 과다(S3), 콘텐츠가 화면 중앙에 뭉침(S3).

**FIX**
상세 정책은 `03_Desktop_QA.md`의 D-WIDE 항목을 따른다. 시각 QA에서는 2560px 스냅샷을 P0 라우트 2~3개에만 두고 정성 검토한다.

---

## 18. Cross Browser 시각 차이

### V-XB-01 — 엔진별 렌더 차이 판별

**WHY**
Chromium과 WebKit, Firefox는 폰트 렌더링, 곡선 안티에일리어싱, 스크롤바, 폼 컨트롤이 모두 다르다. 이 차이를 "결함"으로 보고하면 노이즈가 되고, 무시하면 실제 결함을 놓친다. **엔진 간 스냅샷을 직접 비교하지 말고, 엔진별 독립 기준선**을 유지하는 것이 원칙이다.

**DETECT**

```bash
rg -n "projects:" playwright.config.* -A30 | rg "name:|browserName"
fd -e png . --glob "**/__screenshots__/**" | rg -o "(chromium|firefox|webkit)" | sort | uniq -c
```

**REPRODUCE**

```ts
// playwright.config.ts — 엔진별 프로젝트 분리
projects: [
  {
    name: 'visual-chromium',
    testMatch: /visual\/.*\.spec\.ts/,
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  },
  {
    name: 'visual-webkit',
    // 크로스 엔진은 P0만 — 스냅샷 폭증 방지
    testMatch: /visual\/critical\/.*\.spec\.ts/,
    use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  },
  {
    name: 'visual-firefox',
    testMatch: /visual\/critical\/.*\.spec\.ts/,
    use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
  },
],
```

Playwright는 프로젝트별로 스냅샷 파일을 분리하므로 각 엔진이 자기 기준선을 갖는다.

**PASS / FAIL**

- PASS: 엔진별 독립 기준선이 있고, 각 엔진에서 회귀가 없다. 크로스 엔진 스냅샷 대상이 P0로 제한된다.
- FAIL: 엔진 기준선 미분리로 상시 실패(운영 문제), 특정 엔진 미검증(S3).

**FIX**
엔진 간 차이를 "비교"하고 싶다면 스냅샷이 아니라 **기능·좌표 어설션**으로 한다.

```ts
// ✅ 엔진 간 레이아웃 동등성은 좌표로 검증
test('레이아웃 구조가 엔진과 무관하다', async ({ page, browserName }) => {
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const layout = await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="metrics-grid"]')!;
    return {
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      cardCount: grid.children.length,
    };
  });

  expect(layout.columns, `${browserName}에서 열 수 다름`).toBe(4);
  expect(layout.cardCount).toBe(4);
});
```

---

### V-XB-02 — 엔진별 알려진 차이 목록

**WHY**
어떤 diff가 정상적인 엔진 차이이고 어떤 것이 결함인지 판별 기준이 없으면 triage에서 매번 논쟁이 생긴다. 알려진 차이를 문서화하면 판단이 빨라진다.

**정상 차이 (결함 아님)**

| 항목 | 차이 | 조치 |
|------|------|------|
| 폰트 안티에일리어싱 | macOS가 두껍게 보임 | 기준선 분리 |
| 스크롤바 | Windows는 폭 차지, macOS는 오버레이 | `scrollbar-gutter: stable` |
| 폼 컨트롤 기본 스타일 | select 화살표, checkbox 모양 | `appearance-none` + 커스텀 |
| 곡선 안티에일리어싱 | border-radius 경계 1~2px | 임계값으로 흡수 |
| `<input type="date">` | 네이티브 UI 완전히 다름 | 기능 검증으로 대체 |
| 텍스트 커서 | 깜빡임 | `caret-color: transparent` |

**결함으로 봐야 할 차이**

| 항목 | 증상 | 원인 |
|------|------|------|
| 레이아웃 붕괴 | 열 수가 다름, 요소가 겹침 | `:has()`, container query, `gap` 미지원 |
| 색상 불일치 | 명확히 다른 색 | `color-mix()`, `oklch()` 미지원 |
| 요소 미표시 | 특정 엔진에서만 안 보임 | `backdrop-filter`, `mask` 미지원 |
| 폰트 폴백 | 완전히 다른 글꼴 | 폰트 형식 미지원, 폴백 체인 누락 |
| sticky 미동작 | 고정되지 않음 | Safari의 `overflow` 조상 처리 차이 |

**DETECT**

```bash
rg -n ":has\(|@container|color-mix|oklch|backdrop-filter|mask-image|text-wrap" src
rg -n "@supports" src --glob "*.css" | wc -l
```

**REPRODUCE**

```ts
test('최신 CSS 기능이 폴백을 갖는다', async ({ page, browserName }) => {
  await page.goto('/dashboard');
  const support = await page.evaluate(() => ({
    has: CSS.supports('selector(:has(a))'),
    containerQuery: CSS.supports('container-type: inline-size'),
    colorMix: CSS.supports('color: color-mix(in srgb, red, blue)'),
    backdropFilter: CSS.supports('backdrop-filter: blur(4px)'),
    textWrapBalance: CSS.supports('text-wrap: balance'),
  }));
  console.log(browserName, support);

  // 미지원 기능이 있어도 레이아웃은 유지되어야 한다
  const delta = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(delta).toBeLessThanOrEqual(1);
});
```

**PASS / FAIL**

- PASS: 최신 CSS 기능이 `@supports`로 감싸져 있거나 미지원 시 자연스럽게 저하된다.
- FAIL: 미지원 엔진에서 레이아웃 붕괴(S1), 요소 미표시(S1).

**FIX**

```css
/* ✅ 점진 향상 패턴 */
.panel {
  background: hsl(var(--popover));      /* 기본: 불투명 */
}

@supports (backdrop-filter: blur(8px)) {
  .panel {
    background: hsl(var(--popover) / 0.85);
    backdrop-filter: blur(8px);
  }
}
```

```tsx
// ✅ container query 폴백: 뷰포트 기준을 기본으로, container를 향상으로
<div className="@container">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 @2xl:grid-cols-3">
```

미지원 브라우저는 `md:` 규칙을, 지원 브라우저는 `@2xl:` 규칙을 함께 적용받는다. `@2xl:`이 뒤에 오므로 지원 환경에서 우선한다.

---

### V-XB-03 — 폼 컨트롤 렌더링

**WHY**
`<select>`, `<input type="checkbox">`, `<input type="date">`, `<input type="range">`는 엔진마다 완전히 다르게 렌더된다. 높이를 고정하면 어느 한쪽에서 반드시 잘리고, 커스텀 스타일을 부분적으로만 적용하면 엔진별로 기괴한 혼합이 나온다.

**DETECT**

```bash
rg -n "appearance-none|appearance: none" src
rg -n "<select|type=\"(checkbox|radio|date|time|range|color|file)\"" src --glob "*.tsx"
rg -n "::-webkit-|::-moz-" src --glob "*.css"
```

**REPRODUCE**

```tsx
// 카탈로그에 네이티브 컨트롤 모음 추가
<section data-testid="catalog-native-controls" className="space-y-3 p-6">
  <select className="h-10 rounded-md border px-3"><option>선택</option></select>
  <input type="checkbox" />
  <input type="radio" />
  <input type="date" className="h-10 rounded-md border px-3" />
  <input type="range" />
  <input type="file" />
  <progress value={40} max={100} />
</section>
```

```ts
test('네이티브 폼 컨트롤이 잘리지 않는다', async ({ visualPage: page, browserName }) => {
  await page.goto('/visual-catalog');
  await stabilizeForCapture(page);

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('select, input, progress')]
      .filter(el => el.offsetParent !== null)
      .filter(el => el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)
      .map(el => ({ tag: el.tagName, type: (el as HTMLInputElement).type })));

  expect(clipped, `${browserName}에서 잘린 컨트롤: ${JSON.stringify(clipped)}`).toEqual([]);

  await expect(page.getByTestId('catalog-native-controls'))
    .toHaveScreenshot('native-controls.png');
});
```

**PASS / FAIL**

- PASS: 네이티브 컨트롤이 어느 엔진에서도 잘리지 않고, 대비 3:1 이상으로 식별된다. 엔진별 기준선이 각각 존재한다.
- FAIL: 특정 엔진에서 잘림(S2), 커스텀 스타일 부분 적용으로 기괴한 혼합(S2).

**FIX**

```tsx
// ✅ 완전히 커스텀하거나, 완전히 네이티브를 두거나 — 중간은 피한다
// 방법 A: 네이티브 유지 + 최소 스타일
<select className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">

// 방법 B: 완전 커스텀 (Radix Select 등)
<Select>
  <SelectTrigger className="h-10 w-full">
    <SelectValue placeholder="선택" />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

체크박스는 `appearance-none` + 커스텀 렌더가 안전하다.

```tsx
// ✅ 커스텀 체크박스 (엔진 차이 제거)
<label className="inline-flex items-center gap-2">
  <input type="checkbox" className="peer sr-only" />
  <span
    aria-hidden="true"
    className="flex size-4 items-center justify-center rounded border border-input
               peer-checked:border-primary peer-checked:bg-primary
               peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
  >
    <CheckIcon className="size-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
  </span>
  <span className="text-sm">동의합니다</span>
</label>
```

---

### V-XB-04 — 스크롤바 스타일

**WHY**
Firefox는 `scrollbar-width`/`scrollbar-color`를, Chromium/WebKit은 `::-webkit-scrollbar`를 쓴다. 한쪽만 구현하면 나머지에서 기본 스크롤바가 나와 디자인이 어긋난다. 또 Windows의 클래식 스크롤바는 폭을 차지해 레이아웃에 영향을 준다.

**DETECT**

```bash
rg -n "::-webkit-scrollbar" src --glob "*.css"
rg -n "scrollbar-width|scrollbar-color|scrollbar-gutter" src --glob "*.css"
rg -n "overflow-y-auto|overflow-auto" src --glob "*.tsx" | wc -l
```

**REPRODUCE**

```ts
test('스크롤바 스타일이 두 문법 모두로 정의된다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  const styles = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-scroll-area]');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      scrollbarWidth: cs.scrollbarWidth,
      scrollbarColor: cs.scrollbarColor,
    };
  });
  console.log('스크롤바 설정:', styles);

  // 문서 레벨 gutter 예약
  const gutter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollbarGutter);
  expect(gutter, 'scrollbar-gutter 미설정 → 레이아웃 흔들림').toContain('stable');
});
```

**PASS / FAIL**

- PASS: 스크롤바가 두 문법으로 정의되거나 기본값을 그대로 쓴다. `scrollbar-gutter: stable`로 레이아웃 흔들림이 없다. 다크 모드에서 스크롤바도 어둡다.
- FAIL: 한쪽 문법만 구현(S3), 스크롤바 등장으로 레이아웃 흔들림(S2), 다크 모드에서 흰 스크롤바(S3).

**FIX**

```css
/* ✅ 두 문법 모두 제공 + gutter 예약 + 테마 대응 */
html {
  scrollbar-gutter: stable;
}

:root { color-scheme: light; }
.dark { color-scheme: dark; }   /* 네이티브 스크롤바 자동 다크 */

.custom-scroll {
  scrollbar-width: thin;                                    /* Firefox */
  scrollbar-color: hsl(var(--border)) transparent;
}

.custom-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
  background-clip: content-box;
}
```

`color-scheme`만 설정해도 네이티브 스크롤바가 테마를 따르므로, 커스텀이 꼭 필요한 경우가 아니면 기본을 쓰는 편이 안전하다.

---

## 19. Print과 OG Image

### V-PRINT-01 — 인쇄 스타일

**WHY**
사용자는 청구서, 리포트, 계약서를 인쇄하거나 PDF로 저장한다. 인쇄 스타일이 없으면 네비게이션·사이드바·버튼이 그대로 출력되고, 배경색이 빠져 대비가 사라지며, 어두운 테마가 잉크를 낭비한다. 페이지 나눔이 제어되지 않으면 표가 중간에 잘린다.

**DETECT**

```bash
rg -n "@media print|print:" src --glob "*.css" --glob "*.tsx" | wc -l
rg -n "break-inside|break-before|break-after|page-break" src
rg -n "print:hidden|print:block" src --glob "*.tsx"
```

인쇄 스타일이 0건이면 아예 고려되지 않은 것이다.

**REPRODUCE**

```ts
test('인쇄 스타일이 적절하다', async ({ visualPage: page }) => {
  await page.goto('/invoices/inv-2026-001');
  await page.emulateMedia({ media: 'print' });
  await stabilizeForCapture(page);

  // 불필요한 UI가 숨겨졌는가
  await expect(page.getByRole('navigation')).toBeHidden();
  await expect(page.getByRole('button', { name: '인쇄' })).toBeHidden();

  await expect(page).toHaveScreenshot('invoice-print.png', { fullPage: true });
});

test('PDF 출력이 생성된다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'visual-chromium', 'PDF는 Chromium만 지원');

  await page.goto('/invoices/inv-2026-001');
  await stabilizeForCapture(page);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  expect(pdf.byteLength).toBeGreaterThan(1000);
  await testInfo.attach('invoice.pdf', { body: pdf, contentType: 'application/pdf' });
});
```

**PASS / FAIL**

- PASS: 인쇄 시 네비게이션·버튼·광고가 숨겨진다. 배경이 흰색·글자가 검정으로 강제된다. 표와 카드가 페이지 경계에서 잘리지 않는다. 링크 URL이 표시된다(선택).
- FAIL: 인쇄 스타일 없음(S3, 청구서·리포트 화면이면 S2), 다크 모드가 그대로 출력(S2), 표 중간 잘림(S3).

**FIX**

```css
/* app/globals.css */
@media print {
  /* 인쇄 시 항상 라이트 */
  :root, .dark {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --muted-foreground: 0 0% 30%;
    --border: 0 0% 80%;
    color-scheme: light;
  }

  /* 불필요한 UI 제거 */
  nav, aside, header button, footer,
  [data-print="hide"], .no-print {
    display: none !important;
  }

  /* 배경·그림자 제거로 잉크 절약 */
  * {
    background: transparent !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* 페이지 나눔 제어 */
  table, figure, .card, .avoid-break {
    break-inside: avoid;
  }
  h1, h2, h3 {
    break-after: avoid;
  }
  thead {
    display: table-header-group;   /* 페이지마다 헤더 반복 */
  }

  /* 링크 URL 표시 (외부 링크만) */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #555;
  }

  /* 페이지 설정 */
  @page {
    size: A4;
    margin: 20mm 15mm;
  }
}
```

```tsx
// ✅ 컴포넌트에서 인쇄 제외를 명시
<aside data-print="hide" className="print:hidden">
```

---

### V-PRINT-02 — 페이지 나눔과 다중 페이지

**WHY**
표가 페이지 경계에서 잘리면 헤더 없이 데이터만 다음 장에 나타나 무슨 값인지 알 수 없다. 카드가 반으로 잘리거나, 제목만 페이지 끝에 남고 내용이 다음 장으로 넘어가면 읽기가 어렵다.

**DETECT**

```bash
rg -n "break-inside|break-before|break-after" src --glob "*.css" --glob "*.tsx"
rg -n "display: table-header-group|<thead" src
```

**REPRODUCE**

```ts
test('여러 페이지 인쇄에서 표 헤더가 반복된다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'visual-chromium');

  // 긴 표를 만든다
  await page.route('**/api/transactions*', r => r.fulfill({
    json: { rows: Array.from({ length: 80 }, (_, i) => ({
      id: String(i), date: '2026-07-30', amount: 12000 + i, memo: `거래 ${i + 1}`,
    })) },
  }));

  await page.goto('/reports/transactions');
  await stabilizeForCapture(page);

  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await testInfo.attach('transactions.pdf', { body: pdf, contentType: 'application/pdf' });
  // PDF를 열어 각 페이지에 헤더가 있는지 눈으로 확인
});
```

**PASS / FAIL**

- PASS: 표 헤더가 각 페이지에 반복된다. 카드·이미지·표 행이 경계에서 잘리지 않는다. 제목이 내용과 분리되지 않는다.
- FAIL: 헤더 미반복(S3), 요소 잘림(S3). 청구서·계약서면 S2.

**FIX**

```css
@media print {
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { break-inside: avoid; }

  /* 고아/과부 줄 방지 */
  p, li {
    orphans: 3;   /* 페이지 끝에 최소 3줄 */
    widows: 3;    /* 다음 페이지 시작에 최소 3줄 */
  }
}
```

---

### V-PRINT-03 — OG 이미지와 소셜 카드

**WHY**
링크를 공유하면 소셜 미디어가 OG 이미지를 표시한다. 이 이미지가 깨지거나, 텍스트가 잘리거나, 브랜드와 무관하면 공유 효과가 사라진다. Next.js의 `ImageResponse`로 동적 생성하는 경우 폰트 로딩·긴 제목·특수 문자에서 자주 깨진다.

**DETECT**

```bash
fd "opengraph-image|twitter-image" src/app
rg -n "ImageResponse|next/og" src
rg -n "openGraph|twitter" src/app --glob "*.tsx" | head -20
rg -n "metadataBase" src/app/layout.tsx 2>/dev/null
```

`metadataBase`가 없으면 상대 경로 OG 이미지가 깨진다.

**REPRODUCE**

```ts
test('OG 이미지가 생성되고 규격을 만족한다', async ({ request }) => {
  const res = await request.get('/opengraph-image');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/image\/(png|jpeg)/);

  const body = await res.body();
  expect(body.byteLength, 'OG 이미지가 비어 있음').toBeGreaterThan(5000);
  expect(body.byteLength, 'OG 이미지가 8MB 초과').toBeLessThan(8 * 1024 * 1024);
});

test('동적 OG 이미지가 긴 제목에서 깨지지 않는다', async ({ page }) => {
  const longTitle = encodeURIComponent('아주 긴 게시글 제목입니다 '.repeat(6));
  await page.goto(`/api/og?title=${longTitle}`);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('og-long-title.png');
});

test('OG 메타태그가 올바르다', async ({ page }) => {
  await page.goto('/blog/sample-post');
  const meta = await page.evaluate(() => ({
    title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    width: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content'),
    height: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content'),
  }));

  expect(meta.title).toBeTruthy();
  expect(meta.image, 'OG 이미지가 절대 URL이 아님').toMatch(/^https?:\/\//);
  expect(meta.width).toBe('1200');
  expect(meta.height).toBe('630');
});
```

**PASS / FAIL**

- PASS: OG 이미지가 1200×630으로 생성되고, 긴 제목이 잘림 처리되며, 절대 URL로 노출된다. 8MB 이하다.
- FAIL: 이미지 생성 실패(S2), 텍스트 오버플로(S2), 상대 URL로 소셜에서 미표시(S2).

**FIX**

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function OgImage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  // 폰트를 명시적으로 로드 (기본 폰트는 한글 미지원)
  const fontData = await fetch(
    new URL('./Pretendard-Bold.woff', import.meta.url)
  ).then(res => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 80,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          fontFamily: 'Pretendard',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#3b82f6' }} />
          <span style={{ fontSize: 28, color: '#94a3b8' }}>회사 이름</span>
        </div>
        <div
          style={{
            fontSize: 64, fontWeight: 700, color: '#f8fafc', lineHeight: 1.2,
            // 3줄로 제한해 긴 제목 대응
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.title}
        </div>
        <div style={{ fontSize: 28, color: '#94a3b8' }}>{post.date}</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Pretendard', data: fontData, weight: 700, style: 'normal' }],
    },
  );
}
```

```ts
// app/layout.tsx — metadataBase 필수
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'),
  openGraph: { type: 'website', locale: 'ko_KR', siteName: '회사 이름' },
  twitter: { card: 'summary_large_image' },
};
```

`ImageResponse`는 Satori 기반이라 **flexbox만 지원**하고 `display: block`, `float`, `position: absolute` 일부가 동작하지 않는다. 모든 컨테이너에 `display: flex`를 명시해야 한다.

---

### V-PRINT-04 — 파비콘과 앱 아이콘

**WHY**
파비콘이 없거나 기본 Next.js 아이콘이 남아 있으면 브라우저 탭에서 제품이 식별되지 않는다. 다크 모드 탭 배경에서 어두운 파비콘은 보이지 않는다. PWA 아이콘 규격이 맞지 않으면 홈 화면 추가 시 깨진다.

**DETECT**

```bash
fd "favicon|icon|apple-icon|manifest" src/app public | head -20
rg -n "icons:" src/app/layout.tsx 2>/dev/null -A10
cat public/manifest.json 2>/dev/null
```

**REPRODUCE**

```ts
test('파비콘과 앱 아이콘이 존재한다', async ({ request }) => {
  const assets = [
    { path: '/favicon.ico', minSize: 500 },
    { path: '/icon.png', minSize: 1000 },
    { path: '/apple-icon.png', minSize: 1000 },
  ];

  for (const asset of assets) {
    const res = await request.get(asset.path);
    expect(res.status(), `${asset.path} 없음`).toBe(200);
    const body = await res.body();
    expect(body.byteLength, `${asset.path} 크기 부족`).toBeGreaterThan(asset.minSize);
  }
});

test('아이콘 메타태그가 선언된다', async ({ page }) => {
  await page.goto('/');
  const icons = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({
      rel: l.getAttribute('rel'),
      href: l.getAttribute('href'),
      sizes: l.getAttribute('sizes'),
    })));
  expect(icons.length).toBeGreaterThan(0);
});
```

**PASS / FAIL**

- PASS: 파비콘·애플 아이콘·PWA 아이콘이 존재하고 규격에 맞는다. 다크 탭 배경에서도 보인다.
- FAIL: 기본 아이콘 잔류(S3), 다크 배경에서 판독 불가(S3), PWA 아이콘 규격 불일치(S3).

**FIX**

```tsx
// app/icon.tsx — 동적 생성도 가능
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#3b82f6', color: '#fff', fontSize: 20, fontWeight: 700,
        borderRadius: 6,
      }}>
        K
      </div>
    ),
    size,
  );
}
```

다크 모드 대응 파비콘은 SVG로 제공한다.

```svg
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .fg { fill: #0f172a; }
    @media (prefers-color-scheme: dark) { .fg { fill: #f8fafc; } }
  </style>
  <path class="fg" d="..." />
</svg>
```

---

## 20. Playwright 시각 자동화

### 20.1 전체 설정

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,   // 시각 테스트는 재시도를 최소화 (flaky 은폐 방지)
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 40_000,

  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.005,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
    colorScheme: 'light',
    launchOptions: {
      args: ['--force-prefers-reduced-motion', '--font-render-hinting=none'],
    },
  },

  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },

    // 시각 회귀: 단일 기준 환경
    {
      name: 'visual-desktop',
      dependencies: ['setup'],
      testMatch: /visual\/.*\.spec\.ts/,
      testIgnore: /visual\/mobile\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        storageState: 'tests/.auth/user.json',
      },
    },
    {
      name: 'visual-mobile',
      dependencies: ['setup'],
      testMatch: /visual\/mobile\/.*\.spec\.ts/,
      use: { ...devices['Pixel 7'], storageState: 'tests/.auth/user.json' },
    },

    // 크로스 엔진: P0만
    {
      name: 'visual-webkit',
      dependencies: ['setup'],
      testMatch: /visual\/critical\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
        storageState: 'tests/.auth/user.json',
      },
    },

    // 애니메이션 동작 검증: 정지시키지 않는다
    {
      name: 'motion',
      dependencies: ['setup'],
      testMatch: /visual\/motion\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        reducedMotion: 'no-preference',
        launchOptions: { args: [] },
      },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
```

`--font-render-hinting=none`은 Chromium의 폰트 힌팅을 끄고 렌더링을 더 결정적으로 만든다.

### 20.2 디렉토리 구조

```text
tests/
├── visual/
│   ├── fixtures.ts                  # visualPage 픽스처
│   ├── helpers/
│   │   ├── stabilize.ts             # 결정론 헬퍼
│   │   ├── themes.ts                # 테마 전환
│   │   └── block-third-party.ts
│   ├── critical/                    # 크로스 엔진 대상 (P0)
│   │   ├── home.spec.ts
│   │   └── checkout.spec.ts
│   ├── mobile/
│   │   └── responsive.spec.ts
│   ├── components.spec.ts           # 컴포넌트 매트릭스
│   ├── states.spec.ts               # 상태 매트릭스
│   ├── tokens.spec.ts               # 토큰 어설션 (스냅샷 아님)
│   ├── content-stress.spec.ts       # 콘텐츠 극단값
│   ├── themes.spec.ts               # 라이트/다크
│   ├── motion.spec.ts               # 애니메이션 동작 (별도 프로젝트)
│   ├── print.spec.ts
│   └── __screenshots__/
│       ├── visual-desktop/
│       ├── visual-mobile/
│       └── visual-webkit/
└── fixtures/
    ├── api.ts
    ├── data/
    └── images/
```

### 20.3 테마 헬퍼

```ts
// tests/visual/helpers/themes.ts
import type { Page } from '@playwright/test';

export type Theme = 'light' | 'dark';

export async function setTheme(page: Page, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.style.colorScheme = t;
    try { localStorage.setItem('theme', t); } catch {}
  }, theme);
  // 테마 전환 후 리페인트 대기
  await page.evaluate(() => new Promise<void>(r =>
    requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

/** 두 테마를 순회하며 콜백 실행 */
export async function forEachTheme(
  page: Page,
  fn: (theme: Theme) => Promise<void>,
) {
  for (const theme of ['light', 'dark'] as const) {
    await setTheme(page, theme);
    await fn(theme);
  }
}
```

### 20.4 스냅샷 헬퍼

```ts
// tests/visual/helpers/snapshot.ts
import { expect, type Page, type Locator } from '@playwright/test';
import { stabilizeForCapture } from './stabilize';

type SnapOptions = {
  mask?: Locator[];
  maxDiffPixelRatio?: number;
  fullPage?: boolean;
  reason?: string;   // 임계값 예외 사유
};

/** 안정화 + 캡처를 한 번에 */
export async function snap(
  target: Page | Locator,
  name: string,
  opts: SnapOptions = {},
) {
  const page = 'goto' in target ? target : target.page();
  await stabilizeForCapture(page);

  const options: Parameters<typeof expect.prototype.toHaveScreenshot>[1] = {
    animations: 'disabled',
    caret: 'hide',
    mask: opts.mask,
    maskColor: '#FF00FF',
  };

  if (opts.maxDiffPixelRatio !== undefined) {
    if (!opts.reason) {
      throw new Error(`임계값 예외에는 reason이 필요합니다: ${name}`);
    }
    options.maxDiffPixelRatio = opts.maxDiffPixelRatio;
  }

  if ('goto' in target && opts.fullPage) {
    (options as any).fullPage = true;
  }

  await expect(target as any).toHaveScreenshot(name, options);
}
```

임계값 예외에 `reason`을 강제하면 무분별한 완화를 구조적으로 막을 수 있다.

### 20.5 공용 픽스처 통합

```ts
// tests/visual/fixtures.ts
import { test as base, expect, type Page } from '@playwright/test';
import { prepareDeterminism, stabilizeForCapture } from './helpers/stabilize';
import { blockThirdParty } from './helpers/block-third-party';
import { mockApi } from '../fixtures/api';

type VisualFixtures = {
  visualPage: Page;
  consoleErrors: string[];
};

export const test = base.extend<VisualFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    await use(errors);
  },

  visualPage: async ({ page, consoleErrors }, use) => {
    await prepareDeterminism(page);
    await blockThirdParty(page);
    await mockApi(page);

    await use(page);

    // 시각 테스트에서도 콘솔 오류는 결함이다
    const ignorable = [/ResizeObserver loop/, /Download the React DevTools/];
    const real = consoleErrors.filter(e => !ignorable.some(re => re.test(e)));
    expect(real, `콘솔 오류:\n${real.join('\n')}`).toEqual([]);
  },
});

export { expect, stabilizeForCapture };
```

### 20.6 CI 통합

```yaml
# .github/workflows/visual.yml
name: Visual Regression

on:
  pull_request:
    paths:
      - 'src/**'
      - 'app/**'
      - 'tailwind.config.*'
      - 'tests/visual/**'
      - 'package.json'

jobs:
  visual:
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Run visual tests
        run: pnpm playwright test tests/visual
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload diffs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diffs
          path: test-results/**/*-diff.png
          retention-days: 14
```

기준선 갱신은 별도 워크플로로 분리해 수동 승인을 강제한다.

```yaml
# .github/workflows/visual-update.yml
name: Update Visual Baselines

on:
  workflow_dispatch:   # 수동 실행만

jobs:
  update:
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm playwright test tests/visual --update-snapshots
      - uses: peter-evans/create-pull-request@v7
        with:
          branch: chore/update-visual-baselines
          title: 'chore: 시각 기준선 갱신'
          body: |
            자동 생성된 기준선 갱신 PR입니다.

            **리뷰어는 모든 이미지 diff를 확인하고 의도된 변경인지 판단해 주세요.**
          commit-message: 'chore: update visual baselines'
```

기준선 갱신을 PR로 만들면 diff가 GitHub UI에서 이미지로 표시되어 리뷰가 가능해진다. 이것이 V-P4를 구조적으로 강제하는 방법이다.

---

## 21. Diff Triage 절차

### 21.1 세 가지 분류

모든 diff는 반드시 아래 셋 중 하나로 분류한다. "일단 승인"은 없다.

| 분류 | 정의 | 조치 |
|------|------|------|
| **승인 (Approved)** | 의도된 디자인 변경 | 기준선 갱신 + 사유 기록 |
| **결함 (Defect)** | 의도하지 않은 시각 변화 | 코드 수정 후 재검증 |
| **노이즈 (Noise)** | 결정론 부재로 인한 무의미한 diff | **원인 제거** (5장으로 회귀) |

노이즈를 승인으로 처리하면 기준선이 오염되고, 다음 실행에서 또 diff가 난다. 반드시 원인을 제거한다.

### 21.2 판별 절차

```text
1. diff 이미지를 연다 (test-results/**/*-diff.png)

2. 변경 위치를 확인한다
   - 예상한 컴포넌트/영역인가?
   - 전혀 관계없는 영역인가? → 결함 가능성 높음

3. 변경 성격을 판단한다
   - 색/간격/크기가 명확히 바뀜 → 승인 또는 결함
   - 1~2px 경계 흐림, 텍스트 미세 이동 → 노이즈 의심
   - 전체가 미세하게 다름 → 환경 차이 (노이즈)
   - 특정 요소만 사라지거나 나타남 → 결함 또는 결정론 문제

4. 재현성을 확인한다
   pnpm playwright test <해당 테스트> --repeat-each=3
   - 3회 모두 동일한 diff → 실제 변화 (승인/결함)
   - 매번 다른 diff → 노이즈 (결정론 문제)

5. 최근 커밋과 대조한다
   git log --oneline -10 -- src/components/ui
   - 관련 변경이 있는가?
   - 없는데 diff가 났다면 의존성 업데이트나 환경 변화를 의심

6. 분류를 확정하고 조치한다
```

### 21.3 노이즈 원인 체크리스트

```text
[ ] 애니메이션/전환이 진행 중인가 → V-DET-01
[ ] 시간/날짜가 표시되는가 → V-DET-02
[ ] 랜덤 값이나 순서 변동이 있는가 → V-DET-03
[ ] 폰트가 로드되기 전인가 → V-DET-04
[ ] 이미지가 로드되기 전인가 → V-DET-05
[ ] API 데이터가 변했는가 → V-DET-06
[ ] 스크롤 위치가 다른가 → V-DET-07
[ ] 실행 환경(OS/브라우저 버전/DPR)이 다른가 → V-DET-08
[ ] 서드파티 스크립트가 로드되었는가 → V-IMG-05
[ ] 캐럿(텍스트 커서)이 보이는가 → caret: 'hide'
[ ] 스크롤바가 나타났다 사라지는가 → scrollbar-gutter: stable
```

### 21.4 Triage 기록 양식

각 diff에 대해 아래를 기록한다.

```markdown
| 스냅샷 | 분류 | diff 비율 | 판단 근거 | 조치 |
|--------|------|-----------|-----------|------|
| `button-matrix-light.png` | 승인 | 2.1% | primary 색상 토큰 변경 (#2563EB → #3B82F6), 디자인 승인됨 (DESIGN-142) | 기준선 갱신 |
| `dashboard-metrics-dark.png` | 결함 | 8.4% | 다크 모드에서 카드 배경이 흰색으로 렌더 — `bg-white` 하드코딩 | `components/metric-card.tsx:18` 수정 |
| `home-hero-desktop.png` | 노이즈 | 0.3% | 3회 실행 시 매번 다른 위치에 diff. 히어로 애니메이션 미정지 | `stabilizeForCapture` 적용 |
```

### 21.5 승인 기준

승인은 아래를 **모두** 만족할 때만 한다.

```text
[ ] diff가 의도된 변경과 정확히 일치한다
[ ] 변경 범위가 예상 범위를 벗어나지 않는다 (다른 화면에 파급되지 않음)
[ ] 두 테마 모두에서 확인했다
[ ] 대비·가독성이 저하되지 않았다
[ ] 관련 디자인 승인(이슈/PR)이 있거나 명백히 개선이다
[ ] 승인 사유를 커밋 메시지 또는 PR에 기록했다
```

```bash
# ✅ 특정 테스트만 선택적으로 갱신 (전체 갱신 금지)
pnpm playwright test tests/visual/components.spec.ts --update-snapshots

# ❌ 전체 무차별 갱신
pnpm playwright test --update-snapshots
```

전체 갱신은 결함을 기준선에 굽는 가장 빠른 방법이다. 반드시 파일 또는 테스트 단위로 좁힌다.

### 21.6 대량 변경 처리

디자인 시스템 토큰을 바꾸면 수십~수백 개 스냅샷이 한꺼번에 실패한다. 이때 절차는 다르다.

```text
1. 변경의 의도와 범위를 먼저 문서화한다
   "primary 색상 토큰 변경으로 버튼·링크·포커스 링·배지가 영향받음"

2. 영향 범위를 예측하고 실제 실패 목록과 대조한다
   예측하지 못한 스냅샷이 실패했다면 그것이 결함이다

3. 대표 스냅샷 5~10개를 골라 눈으로 정밀 검토한다
   - 컴포넌트 매트릭스 (light/dark)
   - P0 라우트 1~2개
   - 대비가 걱정되는 화면

4. 대표 검토가 통과하면 일괄 갱신하되, PR로 만들어 diff를 남긴다

5. 대비 검사를 반드시 재실행한다
   pnpm playwright test tests/visual/contrast.spec.ts
```

색상 토큰 변경 시 대비 검증(V-TYPO-04)을 건너뛰면 접근성 회귀가 조용히 들어간다.

---

## 22. Baseline 관리와 CI 운영

### V-BASE-01 — 기준선 생성 환경 통일

**WHY**
로컬 Windows에서 만든 기준선은 CI Linux에서 100% 실패한다. 폰트 렌더링, 안티에일리어싱, 기본 폰트 폴백이 모두 다르기 때문이다. 이를 임계값으로 흡수하려 하면 탐지력을 잃는다. 유일한 해법은 **단일 환경 고정**이다.

**DETECT**

```bash
# 기준선을 만든 환경 추적
git log --format="%H %an %ad" -3 -- tests/visual/__screenshots__
rg -n "container:|runs-on:" .github/workflows/visual.yml 2>/dev/null
rg -n "@playwright/test" package.json
```

**REPRODUCE**

```bash
# 로컬에서 CI와 동일한 컨테이너로 실행
docker run --rm --ipc=host \
  -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm build && pnpm playwright test tests/visual"
```

**PASS / FAIL**

- PASS: 기준선이 CI와 동일한 컨테이너 이미지에서 생성된다. 로컬 도커 실행 결과가 CI와 일치한다.
- FAIL: 환경 불일치로 상시 diff. 시각 QA 자체가 성립하지 않으므로 최우선 처리.

**FIX**

```json
// package.json — 도커 실행 스크립트를 제공해 팀 전체가 같은 방법을 쓰게 한다
{
  "scripts": {
    "test:visual": "playwright test tests/visual",
    "test:visual:docker": "docker run --rm --ipc=host -v \"$PWD:/work\" -w /work mcr.microsoft.com/playwright:v1.50.0-noble bash -lc \"corepack enable && pnpm install --frozen-lockfile && pnpm build && pnpm playwright test tests/visual\"",
    "test:visual:update": "pnpm test:visual:docker -- --update-snapshots"
  }
}
```

Playwright 버전과 컨테이너 이미지 태그를 **정확히 일치**시킨다. 버전이 다르면 브라우저 빌드가 달라 렌더링이 바뀐다.

```bash
# 버전 확인
pnpm playwright --version
# → 이 버전과 동일한 태그의 이미지를 사용
```

---

### V-BASE-02 — 기준선 커밋과 리뷰

**WHY**
기준선 이미지를 커밋하지 않으면 CI에서 비교 대상이 없어 항상 통과한다(첫 실행 시 자동 생성). 반대로 리뷰 없이 커밋하면 결함이 기준이 된다. 기준선은 **코드와 동일하게 리뷰 대상**이다.

**DETECT**

```bash
rg -n "__screenshots__|snapshots" .gitignore
git ls-files "tests/visual/__screenshots__" | wc -l
du -sh tests/visual/__screenshots__ 2>/dev/null
```

`.gitignore`에 스냅샷 디렉토리가 있으면 시각 QA가 작동하지 않는다.

**REPRODUCE**

```bash
# 기준선이 없는 상태에서 CI가 통과하는지 확인 (실패해야 정상)
git stash push -- tests/visual/__screenshots__
pnpm playwright test tests/visual
# → "A snapshot doesn't exist ... writing actual" 경고와 함께 통과한다면
#   CI에서 --ci 플래그로 이를 실패시켜야 한다
git stash pop
```

**PASS / FAIL**

- PASS: 기준선이 저장소에 커밋되어 있고, CI에서 누락 시 실패한다. 갱신이 PR로 이루어진다.
- FAIL: 기준선 미커밋(시각 QA 무효), 리뷰 없는 직접 커밋(V-P4 위반).

**FIX**

```ts
// playwright.config.ts — CI에서 기준선 누락을 실패로 처리
expect: {
  toHaveScreenshot: {
    // CI에서는 기준선이 없으면 실패
    ...(process.env.CI ? { } : {}),
  },
},
// Playwright는 CI 환경변수를 감지해 자동으로 --ci 동작을 한다.
// 명시적으로는 아래 플래그를 사용한다.
```

```bash
# CI에서 기준선 누락 시 실패
pnpm playwright test tests/visual --ignore-snapshots=false
```

PR 템플릿에 시각 변경 확인 항목을 넣는다.

```markdown
<!-- .github/pull_request_template.md -->
## 시각 변경 (해당 시)
- [ ] 시각 기준선 변경이 포함되어 있다
- [ ] 모든 diff 이미지를 확인했다
- [ ] 변경이 의도된 것임을 확인했다
- [ ] 라이트/다크 두 테마를 확인했다
- [ ] 대비 검사가 통과한다
```

---

### V-BASE-03 — 저장소 용량 관리

**WHY**
PNG 스냅샷 300개 × 200KB = 60MB이고, 갱신할 때마다 Git 히스토리에 새 버전이 쌓인다. 1년 뒤 저장소가 수 GB가 되어 클론이 느려진다. 용량을 통제하지 않으면 결국 팀이 시각 테스트를 버린다.

**DETECT**

```bash
du -sh tests/visual/__screenshots__
git count-objects -vH
# 히스토리에서 가장 큰 파일들
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '/^blob/ {print $3, $4}' | sort -rn | head -20
```

**PASS / FAIL**

- PASS: 스냅샷 디렉토리가 100MB 이하이고, 증가 속도가 통제된다.
- FAIL: 무한 증가로 클론 속도 저하(운영 문제).

**FIX**

용량을 줄이는 세 가지 방법.

```ts
// 1. deviceScaleFactor 1 고정 → 파일 크기 1/4
use: { deviceScaleFactor: 1 },
expect: { toHaveScreenshot: { scale: 'css' } },
```

```ts
// 2. full page 대신 element 캡처 → 면적 감소
await expect(page.getByTestId('metrics-grid')).toHaveScreenshot('metrics.png');
```

```ts
// 3. 뷰포트 크기 축소 (검증 가치를 해치지 않는 범위에서)
use: { viewport: { width: 1280, height: 800 } },   // 1920×1080 대비 45% 감소
```

PNG 최적화도 효과가 있다.

```bash
# oxipng으로 무손실 압축 (기준선 갱신 후 실행)
fd -e png . tests/visual/__screenshots__ -x oxipng -o 4 --strip safe {}
```

압축을 CI 갱신 워크플로에 포함시키면 자동으로 유지된다. 단 압축이 픽셀을 바꾸지 않는 **무손실**인지 반드시 확인한다.

---

### V-BASE-04 — Flaky 감시와 격리

**WHY**
flaky 시각 테스트를 방치하면 팀이 "또 그거네" 하며 실패를 무시하기 시작하고, 진짜 회귀가 섞여도 알아채지 못한다. flaky는 발견 즉시 격리하고 원인을 제거해야 한다.

**DETECT**

```bash
# CI 리포트에서 flaky 목록 확인
rg -n "flaky" playwright-report/index.html 2>/dev/null | head

# 로컬 반복 실행으로 확인
pnpm playwright test tests/visual --repeat-each=5 --reporter=list
```

**REPRODUCE**

```bash
# 특정 테스트가 안정적인지 검증
pnpm playwright test tests/visual/dashboard.spec.ts --repeat-each=10
# 10회 모두 통과해야 안정적이라고 판단한다
```

**PASS / FAIL**

- PASS: 시각 테스트의 flaky 비율이 0이다. `retries`를 0 또는 1로 두어도 안정적이다.
- FAIL: flaky 존재. 결함이 아니라 **운영 실패**이며 최우선 처리한다.

**FIX**

```ts
// ✅ flaky 테스트를 즉시 격리 (삭제하지 않고 이유를 남긴다)
test.fixme(
  '대시보드 차트 시각 회귀',
  // FLAKY: 차트 라이브러리의 애니메이션이 getAnimations()에 잡히지 않음.
  // 추적: ISSUE-482. 해결 전까지 격리.
  async ({ visualPage: page }) => {
    // ...
  },
);
```

격리는 임시 조치다. 반드시 이슈를 만들고 기한을 정한다. 격리된 테스트가 3개월 이상 방치되면 삭제하고 다른 검증 수단(어설션)으로 대체한다.

```ts
// ✅ 대안: 스냅샷을 어설션으로 전환
// 차트 이미지 대신 데이터 렌더 결과를 검증
test('차트가 올바른 데이터 포인트를 그린다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  const points = await page.locator('[data-testid="revenue-chart"] circle').count();
  expect(points).toBe(12);   // 12개월
  const path = await page.locator('[data-testid="revenue-chart"] path.line')
    .getAttribute('d');
  expect(path).toBeTruthy();
});
```

**retries 설정 주의**

```ts
// ❌ 재시도를 늘려 flaky를 숨긴다
retries: 3,

// ✅ 시각 테스트는 재시도를 최소화해 flaky를 드러낸다
retries: process.env.CI ? 1 : 0,
```

기능 테스트는 네트워크 변동 때문에 재시도가 정당하지만, 시각 테스트의 재시도는 결정론 부재를 은폐한다.

---

## 23. Regression 절차

### 23.1 결함 유형별 회귀 테스트 선택

시각 결함을 고친 뒤 "스냅샷을 갱신했으니 끝"으로 처리하면 같은 결함이 다시 들어온다. 회귀 테스트는 **결함의 원인**을 겨냥해야 하며, 원인에 따라 도구가 다르다.

| 결함 원인 | 회귀 테스트 | 이유 |
|-----------|-------------|------|
| 하드코딩 색상 | 정적 분석 (`rg`) + 계산 스타일 어설션 | 재발을 코드 레벨에서 차단 |
| 간격 스케일 이탈 | 계산 스타일 어설션 + lint 규칙 | 값이 명확 |
| 다크 모드 미대응 | 두 테마 스냅샷 + 밝은 영역 어설션 | 시각 + 값 병행 |
| 오버플로 | `scrollWidth` 어설션 | 원인 위치를 알려줌 |
| 컴포넌트 variant 깨짐 | 매트릭스 스냅샷 | 전수 커버 |
| 대비 미달 | 대비 계산 어설션 | 수치 판정 |
| 레이아웃 붕괴 | 좌표 어설션 + 스냅샷 | 원인 + 전체 인상 |
| 콘텐츠 오버플로 | 극단값 픽스처 + 오버플로 어설션 | 재현 조건 고정 |
| flaky | 결정론 헬퍼 적용 + `--repeat-each=3` | 원인 제거 확인 |

### 23.2 수정 후 확인 범위

시각 수정은 파급이 넓다. 한 컴포넌트를 고치면 그것을 쓰는 모든 화면이 영향받는다.

```text
[ ] 수정한 컴포넌트의 매트릭스 스냅샷 (light/dark)
[ ] 그 컴포넌트를 사용하는 모든 P0 라우트
[ ] 인접 폭 (수정이 특정 폭에서 이루어졌다면 위아래 breakpoint)
[ ] 반대 테마 (라이트에서 고쳤다면 다크)
[ ] 상태 변형 (hover/focus/disabled)
[ ] 극단 콘텐츠 (긴 텍스트, 빈 값)
[ ] 대비 검사 (색을 건드렸다면 필수)
```

```bash
# 컴포넌트를 사용하는 화면 찾기
rg -l "MetricCard" src app

# 해당 화면들의 시각 테스트만 실행
pnpm playwright test tests/visual --grep "dashboard|reports|home"
```

### 23.3 Regression Gate

시각 QA 종료 전 아래를 순서대로 실행하고 전부 통과해야 한다.

```bash
# 1. 타입·린트 (시각 테스트 코드 포함)
pnpm tsc --noEmit
pnpm lint

# 2. 프로덕션 빌드 — 개발 모드로 시각 QA하지 않는다
pnpm build

# 3. 결정론 게이트 — 3회 반복 diff 0
pnpm playwright test tests/visual --repeat-each=3 --reporter=list

# 4. 토큰 어설션 (스냅샷 아님)
pnpm playwright test tests/visual/tokens.spec.ts

# 5. 대비 검사
pnpm playwright test tests/visual/contrast.spec.ts

# 6. 컴포넌트 매트릭스
pnpm playwright test tests/visual/components.spec.ts

# 7. 상태 매트릭스
pnpm playwright test tests/visual/states.spec.ts

# 8. 테마 (라이트/다크)
pnpm playwright test tests/visual/themes.spec.ts

# 9. 반응형
pnpm playwright test tests/visual/responsive.spec.ts

# 10. 콘텐츠 극단값
pnpm playwright test tests/visual/content-stress.spec.ts

# 11. 크로스 엔진 (P0)
pnpm playwright test --project=visual-webkit

# 12. 애니메이션 동작 (별도 프로젝트)
pnpm playwright test --project=motion

# 13. 인쇄·OG
pnpm playwright test tests/visual/print.spec.ts

# 14. 전체 통합 실행
pnpm playwright test tests/visual
```

3번(`--repeat-each=3`)에서 실패하면 나머지 결과는 신뢰할 수 없다. 결정론부터 복구한다.

### 23.4 회귀 테스트 작성 원칙

```ts
// ❌ 결함을 재현하지 않는 회귀 테스트
test('대시보드가 정상 렌더된다', async ({ visualPage: page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();
});

// ✅ 결함 조건을 정확히 재현하고 그 지점을 검증
test('REG: 다크 모드에서 메트릭 카드 배경이 흰색이 되지 않는다 (ISSUE-317)', async ({ visualPage: page }) => {
  await setTheme(page, 'dark');
  await page.goto('/dashboard');
  await stabilizeForCapture(page);

  const backgrounds = await page.getByTestId('metric-card').evaluateAll(els =>
    els.map(el => getComputedStyle(el).backgroundColor));

  for (const bg of backgrounds) {
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    expect(luminance, `다크 모드 카드 배경이 밝음: ${bg}`).toBeLessThan(0.3);
  }
});
```

회귀 테스트 제목에 `REG:` 접두사와 이슈 번호를 넣으면, 나중에 왜 이 테스트가 존재하는지 알 수 있다.

---

## 24. Final Report

### 24.1 리포트 원칙

- 채팅으로 전달한다. 저장소에 리포트 파일을 만들지 않는다(V-P11).
- diff 통계를 먼저, 결함 목록을 그 다음, 배포 판정을 마지막에 둔다.
- 각 결함에 파일:라인, 재현 절차, 수정 방향, 회귀 테스트를 포함한다.
- 확인하지 못한 항목은 `BLOCKED`로 명시하고 이유를 쓴다. 조용히 빠뜨리지 않는다.
- 정성 판정은 정성 판정이라고 밝힌다(V-P9).

### 24.2 리포트 템플릿

```markdown
# Visual QA Report — <프로젝트명>

**일시:** 2026-07-30
**커밋:** `abc1234`
**환경:** 프로덕션 빌드 / mcr.microsoft.com/playwright:v1.50.0-noble
**기준선 환경:** 동일 (CI ubuntu-24.04 컨테이너)
**대상:** P0 라우트 6개, 디자인 시스템 컴포넌트 12종

---

## 1. 요약

| 지표 | 값 |
|------|-----|
| 실행 스냅샷 | 184 |
| 통과 | 171 |
| diff 발생 | 13 |
| └ 승인 | 8 |
| └ 결함 | 4 |
| └ 노이즈 | 1 (해결됨) |
| 어설션 검사 | 42건 / 실패 3건 |
| flaky | 0 (3회 반복 실행) |

**배포 판정:** 조건부 승인 — S1 1건 수정 후 재검증 필요

---

## 2. 결정론 게이트

| 항목 | 상태 | 비고 |
|------|------|------|
| V-DET-01 애니메이션 | PASS | `stabilizeForCapture` 적용 |
| V-DET-02 시간·로케일 | PASS | `page.clock` 고정 |
| V-DET-03 랜덤·순서 | PASS | seed 고정 |
| V-DET-04 폰트 | PASS | 자체 호스팅 + `document.fonts.ready` |
| V-DET-05 이미지 | PASS | 외부 아바타 픽스처 대체 |
| V-DET-06 네트워크 | PASS | 전 엔드포인트 픽스처 |
| V-DET-07 스크롤 | PASS | sticky를 static으로 전환 |
| V-DET-08 환경 | PASS | 도커 이미지 통일 |
| 3회 반복 diff 0 | PASS | 184/184 안정 |

---

## 3. 결함 목록

### V-COLOR-02 / S1 / 다크 모드에서 메트릭 카드가 흰 배경으로 렌더

- **위치:** `src/components/metric-card.tsx:18`
- **원인:** `bg-white` 하드코딩. `dark:` 변형 없음
- **재현:**
  1. 다크 모드로 전환
  2. `/dashboard` 접속
  3. 상단 지표 카드 4개가 흰 배경으로 표시됨
- **증거:** `dashboard-metrics-dark.png` (diff 8.4%)
- **영향:** 다크 모드 사용자 전원. 어두운 화면에서 눈부심
- **수정:** `bg-white` → `bg-card`
- **회귀:** `REG: 다크 모드 메트릭 카드 배경 (ISSUE-317)` — 휘도 어설션
- **인접 확인:** `/reports`, `/analytics`에서도 동일 컴포넌트 사용 → 함께 수정

### V-TYPO-04 / S2 / 보조 텍스트 대비 미달 (라이트)

- **위치:** `app/globals.css:24` (`--muted-foreground`)
- **원인:** 토큰 값이 `215 16% 47%`로 흰 배경 대비 3.9:1
- **재현:** `pnpm playwright test tests/visual/contrast.spec.ts`
- **증거:** 12개 요소에서 4.5:1 미달
- **수정:** 토큰을 `215 16% 40%`로 조정 (5.2:1)
- **회귀:** 기존 `contrast.spec.ts`가 커버
- **주의:** 토큰 변경으로 스냅샷 다수 갱신 필요 → 21.6 절차 적용

### V-CONTENT-01 / S2 / 긴 이메일에서 테이블 가로 오버플로

- **위치:** `src/components/members-table.tsx:52`
- **원인:** 이메일 셀에 `truncate` 없음, `table-layout` 미지정
- **재현:** 65자 이메일 픽스처로 `/settings/members` 로드 → 문서 가로 스크롤 24px
- **수정:** `table-fixed` + 셀에 `max-w-0` + `truncate` + `title`
- **회귀:** `content-stress.spec.ts`에 케이스 추가

### V-STATE-01 / S3 / Ghost 버튼의 active 상태 없음

- **위치:** `src/components/ui/button.tsx:21`
- **원인:** `ghost` variant에 `active:` 정의 누락
- **수정:** `active:bg-accent/80` 추가
- **회귀:** `states.spec.ts` 매트릭스가 커버

---

## 4. 승인된 변경

| 스냅샷 | diff | 사유 |
|--------|------|------|
| `button-matrix-light.png` | 2.1% | primary 토큰 변경 (DESIGN-142) |
| `button-matrix-dark.png` | 2.4% | 동일 |
| `home-hero-desktop.png` | 5.8% | 히어로 카피 변경 (PROD-88) |
| … | | |

---

## 5. 미검증 / BLOCKED

| 항목 | 사유 | 대안 |
|------|------|------|
| Firefox 시각 회귀 | CI 러너에 Firefox 미설치 | 다음 스프린트에 프로젝트 추가 |
| 실기기 iOS Safari | 디바이스 팜 없음 | Playwright WebKit으로 근사 |
| 실제 프린터 출력 | 물리 장비 없음 | PDF 생성으로 대체 확인 |
| 색각 이상 정밀 검증 | SVG 필터는 근사치 | 정성 판정으로 기록 |

---

## 6. 정성 판정 (스냅샷으로 판정 불가)

- `/pricing` 3열 카드에서 중앙 카드 강조가 약하다. 그림자와 경계만으로는 위계가 충분하지 않다. (S3, 디자인 논의 필요)
- 대시보드 상단 여백이 다른 화면보다 넓어 일관성이 떨어진다. 섹션 간격 토큰 재검토 권장. (S3)

---

## 7. 다음 조치

1. S1 결함 수정 후 `tests/visual/themes.spec.ts` 재실행
2. `--muted-foreground` 토큰 변경 → 21.6 대량 변경 절차 적용
3. 기준선 갱신 PR 생성 (`workflow_dispatch`)
4. Firefox 프로젝트 추가 검토
```

### 24.3 배포 판정 기준

| 판정 | 조건 |
|------|------|
| **승인** | S0/S1 없음. S2가 있어도 회피 수단이 있고 일정이 정해짐 |
| **조건부 승인** | S1이 있으나 수정 범위가 명확하고 즉시 처리 가능 |
| **보류** | S0 존재, 또는 S1이 여러 화면에 걸침, 또는 결정론 게이트 미통과 |

**결정론 게이트를 통과하지 못했다면 판정 자체를 내리지 않는다.** 신뢰할 수 없는 데이터로 배포를 승인하는 것이 가장 위험하다.

---

## 부록 A — 실행 명령

### A.1 정적 분석

```bash
# 하드코딩 색상
rg -n "#[0-9a-fA-F]{6}\b" src --glob "*.tsx" --glob "*.ts" | rg -v "\.svg"
rg -n "rgb\(|rgba\(|hsl\(" src --glob "*.tsx"

# 임의값 유틸리티 (토큰 이탈)
rg -o "(p|m|gap|space|w|h|text|rounded|shadow|border)-\[[^\]]+\]" src | sort | uniq -c | sort -rn

# 다크 모드 미대응
rg -n "bg-white|bg-black|text-white|text-black" src --glob "*.tsx" | rg -v "dark:"

# 타입 스케일 이탈
rg -o "text-\[[0-9.]+(px|rem)\]" src | sort | uniq -c

# 상태 정의 누락
rg -o "hover:[a-z-]+" src --glob "*.tsx" | wc -l
rg -o "active:[a-z-]+" src --glob "*.tsx" | wc -l
rg -o "focus-visible:[a-z-]+" src --glob "*.tsx" | wc -l
rg -o "disabled:[a-z-]+" src --glob "*.tsx" | wc -l

# 변동 콘텐츠 (결정론 위험)
rg -n "Date\.now|new Date\(\)|Math\.random|randomUUID" src
rg -n "formatDistance|fromNow|toLocaleString" src

# 애니메이션
rg -n "animate-|transition-all" src --glob "*.tsx"
rg -n "framer-motion|gsap" src

# 축소 모션 대응
rg -n "prefers-reduced-motion|motion-reduce:|motion-safe:" src | wc -l

# 이미지 크기 예약
rg -n "<img" src --glob "*.tsx" | rg -v "width=|height="
rg -n "<Image" src --glob "*.tsx" | rg -v "sizes="

# 인쇄 스타일
rg -n "@media print|print:" src | wc -l

# 스냅샷 자산 현황
fd -e png . --glob "**/__screenshots__/**" | wc -l
du -sh tests/visual/__screenshots__
```

### A.2 시각 테스트 실행

```bash
# 전체
pnpm playwright test tests/visual

# 결정론 검증 (게이트)
pnpm playwright test tests/visual --repeat-each=3 --reporter=list

# 특정 영역
pnpm playwright test tests/visual/components.spec.ts
pnpm playwright test tests/visual --grep "dark"
pnpm playwright test tests/visual --grep-invert "mobile"

# 프로젝트별
pnpm playwright test --project=visual-desktop
pnpm playwright test --project=visual-mobile
pnpm playwright test --project=visual-webkit
pnpm playwright test --project=motion

# 디버깅
pnpm playwright test tests/visual/dashboard.spec.ts --headed --debug
pnpm playwright show-report
pnpm playwright show-trace test-results/**/trace.zip

# 기준선 갱신 (선택적으로만)
pnpm playwright test tests/visual/components.spec.ts --update-snapshots

# 도커 환경 (기준선 생성 표준)
docker run --rm --ipc=host -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm build && pnpm playwright test tests/visual"
```

### A.3 스크린샷 수동 캡처

```bash
# 특정 URL을 여러 폭·테마로 캡처 (임시 검토용)
pnpm playwright screenshot --viewport-size=1440,900 http://localhost:3000/ tmp/qa/visual/home-1440.png
pnpm playwright screenshot --viewport-size=390,844 http://localhost:3000/ tmp/qa/visual/home-390.png
pnpm playwright screenshot --full-page --viewport-size=1440,900 http://localhost:3000/pricing tmp/qa/visual/pricing-full.png

# 다크 모드
pnpm playwright screenshot --color-scheme=dark --viewport-size=1440,900 http://localhost:3000/ tmp/qa/visual/home-dark.png
```

수동 캡처 결과는 `tmp/qa/visual/<날짜>/`에 두고 커밋하지 않는다.

### A.4 이미지 비교 도구

```bash
# ImageMagick으로 두 이미지 diff
magick compare -metric AE baseline.png actual.png diff.png

# 픽셀 차이 비율 계산
magick compare -metric FUZZ baseline.png actual.png null: 2>&1

# 스냅샷 PNG 최적화 (무손실)
fd -e png . tests/visual/__screenshots__ -x oxipng -o 4 --strip safe {}
```

---

## 부록 B — Agent 체크리스트

### B.1 시작 전

```text
[ ] Project Binding 블록을 실측으로 채웠다
[ ] 디자인 토큰 소스(tailwind.config, globals.css)를 확인했다
[ ] 테마 구현 방식(class/attribute/media)을 확인했다
[ ] 변동 콘텐츠(시간, 랜덤, 실시간)를 목록화했다
[ ] 미디어와 서드파티 임베드를 목록화했다
[ ] 기준선 생성 환경을 확인했다 (CI와 일치하는가)
[ ] Freeze List를 확인했다
[ ] 프로덕션 빌드로 실행할 준비를 했다
```

### B.2 결정론 게이트 (필수)

```text
[ ] V-DET-01 애니메이션·전환을 3중으로 차단했다
[ ] V-DET-02 시간·타임존·로케일을 고정했다
[ ] V-DET-03 랜덤·UUID·정렬 순서를 고정했다
[ ] V-DET-04 폰트 로드를 대기한다
[ ] V-DET-05 이미지 로드·디코드를 대기한다
[ ] V-DET-06 API를 픽스처로 고정했다
[ ] V-DET-07 스크롤을 초기화하고 sticky를 처리했다
[ ] V-DET-08 실행 환경이 기준선 환경과 일치한다
[ ] 3회 반복 실행에서 diff 0을 확인했다  ← 이것이 통과 조건
```

### B.3 스냅샷 설계

```text
[ ] 스냅샷과 어설션의 역할을 분리했다
[ ] 입도를 컴포넌트/섹션 중심으로 잡았다 (full page 30% 이하)
[ ] 임계값이 전역 단일 기준이다 (예외에는 사유가 있다)
[ ] 마스킹 면적이 20% 이하이고 크기가 고정되어 있다
[ ] 명명 규칙(영역-대상-변형)을 따른다
[ ] 컴포넌트 격리 렌더 수단을 마련했다
[ ] 총 스냅샷 수가 관리 한계 이하다
```

### B.4 검사 항목

```text
레이아웃
[ ] V-LAY-01 간격이 스케일 안에 있다
[ ] V-LAY-02 정렬 기준선이 일치한다
[ ] V-LAY-03 수직 리듬이 일관된다
[ ] V-LAY-04 겹침·잘림이 없다
[ ] V-LAY-05 컨테이너 폭과 중앙 정렬이 일관된다
[ ] V-LAY-06 그리드·카드 비율이 균일하다

타이포그래피
[ ] V-TYPO-01 타입 스케일을 지킨다
[ ] V-TYPO-02 줄 높이·자간이 적절하다
[ ] V-TYPO-03 폰트 폴백과 CLS를 처리했다
[ ] V-TYPO-04 대비 4.5:1 이상 (두 테마)
[ ] V-TYPO-05 줄바꿈이 균형 있다

색상·테마
[ ] V-COLOR-01 하드코딩 색상이 없다
[ ] V-COLOR-02 다크 모드가 전면 적용된다
[ ] V-COLOR-03 테마 깜빡임이 없다
[ ] V-COLOR-04 상태 색상이 일관되고 색상 단독이 아니다
[ ] V-COLOR-05 반투명 위 텍스트가 읽힌다
[ ] V-COLOR-06 강제 색상 모드에서 식별된다

고도·경계
[ ] V-ELEV-01 반경이 토큰에서 파생된다
[ ] V-ELEV-02 그림자가 고도 위계와 일치한다 (다크 대응 포함)
[ ] V-ELEV-03 경계선이 일관된다
[ ] V-ELEV-04 1px 선이 균일하게 렌더된다

이미지·아이콘
[ ] V-IMG-01 크기가 예약되어 CLS가 없다
[ ] V-IMG-02 해상도가 적절하다
[ ] V-IMG-03 alt가 적절하고 실패 시 레이아웃이 유지된다
[ ] V-IMG-04 다크 모드에서 이미지가 충돌하지 않는다
[ ] V-IMG-05 임베드가 종횡비를 유지하고 차단된다
[ ] V-ICON-01 아이콘 크기·정렬이 통일된다
[ ] V-ICON-02 모든 아이콘이 렌더된다
[ ] V-ICON-03 로고 규격이 일관된다
[ ] V-ICON-04 아이콘 접근성 이름이 있다

상태
[ ] V-STATE-01 hover/focus/active/disabled가 캡처되었다
[ ] V-STATE-02 스켈레톤 크기가 실제와 일치한다
[ ] V-STATE-03 빈 상태 3종(초기/검색/오류)이 구분된다
[ ] V-STATE-04 오류가 다중 단서로 표시되고 레이아웃을 밀지 않는다
[ ] V-STATE-05 선택·활성 상태가 hover와 구별된다
[ ] V-STATE-06 상태 조합에서 충돌이 없다

모션
[ ] V-MOTION-01 전환 대상이 GPU 친화적이다
[ ] V-MOTION-02 축소 모션에서 콘텐츠가 사라지지 않는다
[ ] V-MOTION-03 애니메이션이 실제로 동작한다 (별도 프로젝트)
[ ] V-MOTION-04 스크롤 애니메이션이 JS 없이도 안전하다

컴포넌트
[ ] V-COMP-01 variant 매트릭스를 전수 커버했다
[ ] V-COMP-02 조합·컨텍스트에서 정상이다
[ ] V-COMP-03 컨테이너 폭에 반응한다
[ ] V-COMP-04 오버라이드가 예측대로 적용된다
[ ] V-COMP-05 컴포넌트 간 높이·형태가 일관된다

콘텐츠
[ ] V-CONTENT-01 긴 텍스트에서 오버플로가 없다
[ ] V-CONTENT-02 빈 값에서 원시 값이 노출되지 않는다
[ ] V-CONTENT-03 극단 수치에서 카드가 깨지지 않는다
[ ] V-CONTENT-04 텍스트 40% 확장에서 레이아웃이 유지된다
[ ] V-CONTENT-05 데이터 0/1/3/25/100건에서 자연스럽다

반응형·크로스브라우저
[ ] V-RESP-01 최소 3개 폭에서 캡처했다
[ ] V-RESP-02 breakpoint 경계가 안전하다
[ ] V-RESP-03 모바일 전용 UI를 검증했다
[ ] V-RESP-04 초광폭 정책이 유지된다
[ ] V-XB-01 엔진별 독립 기준선이 있다
[ ] V-XB-02 최신 CSS에 폴백이 있다
[ ] V-XB-03 네이티브 폼 컨트롤이 잘리지 않는다
[ ] V-XB-04 스크롤바가 두 문법으로 처리된다

인쇄·OG
[ ] V-PRINT-01 인쇄 스타일이 적절하다
[ ] V-PRINT-02 페이지 나눔이 제어된다
[ ] V-PRINT-03 OG 이미지가 규격을 만족한다
[ ] V-PRINT-04 파비콘·앱 아이콘이 존재한다
```

### B.5 Triage와 마무리

```text
[ ] 모든 diff를 승인/결함/노이즈로 분류했다
[ ] 노이즈의 원인을 제거했다 (기준선 갱신으로 덮지 않았다)
[ ] 승인에 사유를 기록했다
[ ] 결함마다 파일:라인을 지목했다
[ ] 임계값을 올려 실패를 없애지 않았다
[ ] 기준선을 전체 무차별 갱신하지 않았다
[ ] S0/S1/S2 결함마다 회귀 테스트를 추가했다
[ ] 수정 후 인접 조합(다른 폭·테마·variant)을 재검사했다
[ ] Regression Gate 전체를 실행했다
[ ] flaky 0을 확인했다
[ ] 미검증 항목을 BLOCKED로 명시했다
[ ] 정성 판정을 정성 판정으로 표기했다
[ ] Final Report를 채팅으로 전달했다 (파일 생성 안 함)
[ ] 임시 산출물이 tmp/에만 있고 커밋되지 않았다
```

### B.6 금지 사항 재확인

```text
[ ] 결정론 게이트를 건너뛰지 않았다
[ ] maxDiffPixelRatio를 사유 없이 올리지 않았다
[ ] --update-snapshots를 전체 범위로 실행하지 않았다
[ ] 값 검증을 스냅샷으로 대체하지 않았다
[ ] 시각 결함을 임의값(mt-[13px])으로 덮지 않았다
[ ] 다크 모드를 라이트 결과로 추정하지 않았다
[ ] 실 데이터만으로 콘텐츠 내성을 판단하지 않았다
[ ] 개발 모드 결과로 판정하지 않았다
[ ] Freeze List 파일을 수정하지 않았다
[ ] 저장소에 QA 리포트 파일을 만들지 않았다
```

---

## 문서 연계

| 상황 | 참조 문서 |
|------|-----------|
| 하이드레이션·캐시·API·보안 등 기반 결함 | `01_Core_QA.md` |
| 터치 타깃·가상 키보드·safe area·bfcache | `02_Mobile_QA.md` |
| 디스플레이 스케일링·브라우저 줌·호버·데이터 테이블 | `03_Desktop_QA.md` |
| Playwright 아키텍처·픽스처·CI 전략 심화 | `05_Playwright_QA.md` |
| 사용자 여정·정보 구조·카피 | `06_UX_Audit.md` |
| 토큰 체계·컴포넌트 API·문서화 | `07_Design_System_QA.md` |
| Core Web Vitals·번들·렌더 성능 | `08_Performance_QA.md` |
| WCAG 준거·스크린리더·키보드 | `09_Accessibility_QA.md` |

시각 QA에서 발견한 대비 결함은 `09_Accessibility_QA.md`, 토큰 위반은 `07_Design_System_QA.md`, 이미지 최적화 결함은 `08_Performance_QA.md`와 중복된다. 중복 보고를 피하려면 **결함의 근본 원인이 속한 문서**에 기록하고 시각 QA 리포트에서는 참조만 남긴다.

