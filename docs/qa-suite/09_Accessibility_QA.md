# 09_Accessibility_QA.md — Cursor QA Master Suite · Accessibility Playbook

> **문서 등급:** ★★★★★ · WCAG 2.2 AA를 제품 계약으로 고정하는 접근성 QA 실행 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind · Playwright · axe-core
> **검사 대상:** 의미 구조 · Name/Role/Value · 키보드 · 포커스 · 대비 · 폼 · 미디어 · 오버레이 · 라이브 리전 · 인지
> **핵심 전제:** axe PASS는 시작점이다. 키보드로 완수할 수 없고, 이름이 없으며, 상태가 전달되지 않으면 기능이 없다.
> **독립성:** 이 문서는 `01_Core_QA.md` 없이 단독 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 수행하는 명령형 플레이북.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding](#3-project-binding)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [WCAG 2.2 매핑](#5-wcag-22-매핑)
6. [의미 있는 구조](#6-의미-있는-구조)
7. [Name · Role · Value](#7-name-role-value)
8. [키보드 접근](#8-키보드-접근)
9. [포커스 관리](#9-포커스-관리)
10. [색 · 대비 · 시각](#10-색-대비-시각)
11. [이미지 · 아이콘 · 미디어](#11-이미지-아이콘-미디어)
12. [폼과 입력](#12-폼과-입력)
13. [오류 · 상태 · 피드백](#13-오류-상태-피드백)
14. [모션 · 시간 · 애니메이션](#14-모션-시간-애니메이션)
15. [오버레이 · 대화상자 · 메뉴](#15-오버레이-대화상자-메뉴)
16. [테이블 · 목록 · 데이터 뷰](#16-테이블-목록-데이터-뷰)
17. [라이브 리전과 동적 업데이트](#17-라이브-리전과-동적-업데이트)
18. [모바일 · 터치 · 확대](#18-모바일-터치-확대)
19. [인지 · 읽기 · 언어](#19-인지-읽기-언어)
20. [ARIA 사용과 남용](#20-aria-사용과-남용)
21. [스크린리더 검증](#21-스크린리더-검증)
22. [자동화와 Playwright](#22-자동화와-playwright)
23. [Regression 절차](#23-regression-절차)
24. [Final Report](#24-final-report)
25. [부록 A — 감사 스크립트](#부록-a-감사-스크립트)
26. [부록 B — Agent 체크리스트](#부록-b-agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

접근성 QA는 “장애인을 위한 추가 기능”을 검사하는 일이 아니다. **모든 사용자가 같은 과업을 완수할 수 있는 경로가 존재하는가**를 검증한다. 키보드만으로, 스크린리더로, 저대비·확대·축소 모션 환경에서 P0 과업이 막히면 그 기능은 일부 사용자에게 존재하지 않는다.

자동 검사(axe)는 알려진 패턴의 일부만 잡는다. Name 누락, 대비, landmark 같은 것은 잘 잡지만, 포커스 순서의 논리, 대화상자 복귀, “저장됨” 안내의 적절성, 인지 부하 문제는 사람이 과업을 수행해야 드러난다.

### 1.1 동시에 수행할 역할

- **Accessibility Engineer:** WCAG 판정, ARIA 계약, 스크린리더 시나리오를 주도한다.
- **Frontend Engineer:** 시맨틱 HTML, 포커스, 폼 관계, 컴포넌트 API를 검증한다.
- **UX Auditor:** 과업 완수 관점에서 막힘·혼란·복구 불가를 기록한다. (`06_UX_Audit.md`와 경계 공유)
- **Design System Auditor:** primitive가 접근성 계약을 기본으로 보장하는지 확인한다. (`07_Design_System_QA.md`)
- **QA Automation Engineer:** axe + Playwright 키보드/상태 게이트를 운영한다.
- **Content Reviewer:** 대체 텍스트, 오류 문구, 언어, 읽기 수준을 검토한다.

### 1.2 완료 조건

```text
[ ] 준수 목표(WCAG 2.2 AA)와 P0 과업·라우트를 Binding에 적었다.
[ ] axe(또는 동등 도구)를 P0 라우트·주요 상태에 실행했다.
[ ] 키보드만으로 P0 과업을 완수했다.
[ ] 포커스 표시·순서·트랩·복귀를 확인했다.
[ ] 모든 인터랙티브 요소의 accessible name을 확인했다.
[ ] 폼 label/error/description 관계를 확인했다.
[ ] 텍스트·UI 대비를 측정했다.
[ ] 이미지/아이콘/미디어의 대체 정보를 확인했다.
[ ] Dialog/Menu/Disclosure의 키보드·ARIA 계약을 확인했다.
[ ] reduced motion · 확대 200% · 강제 색상 중 가능한 환경을 점검했다.
[ ] 스크린리더 시나리오를 수행했거나 BLOCKED로 명시했다.
[ ] Finding에 기준(SC), 재현, 영향, 수정을 적었다.
[ ] 승인 전 애플리케이션 코드를 수정하지 않았다.
```

스크린리더를 실행할 수 없는 환경이면 `BLOCKED`로 쓰고, 자동·키보드 검사만으로 PASS를 선언하지 않는다.

---

## 2. 절대 원칙

충돌 시 번호가 작은 쪽이 이긴다.

### A11Y-P1. 시맨틱 HTML이 ARIA보다 먼저다

버튼은 `<button>`, 링크는 `<a href>`, 제목은 heading이다. ARIA로 div를 재구성하는 것은 예외이며, 네이티브가 불가능할 때만 쓴다.

### A11Y-P2. 이름 없는 컨트롤은 없는 컨트롤이다

accessible name이 없으면 스크린리더 사용자는 그 조작을 찾을 수 없다. 아이콘 버튼, 입력, 탭, 메뉴 항목 모두 이름이 있어야 한다.

### A11Y-P3. 키보드로 완수 못 하면 실패다

마우스로만 가능한 기능은 AA 실패다. 모든 P0 과업에 키보드 경로가 있어야 한다.

### A11Y-P4. 포커스는 보이며, 논리적이며, 갇히지 않는다

`:focus-visible` 제거, 숨은 요소 포커스, 모달 밖 탭 유출, 닫은 뒤 복귀 실패는 각각 결함이다.

### A11Y-P5. 색만으로 의미를 전달하지 않는다

오류·선택·상태 변화는 텍스트·아이콘·패턴과 함께 전달한다.

### A11Y-P6. 상태는 프로그램적으로 노출한다

펼침/접힘, 선택, 바쁨, 무효, 현재 페이지는 DOM 상태와 ARIA로 전달되어야 한다. 시각만 바꾸면 실패다.

### A11Y-P7. 자동 검사 PASS ≠ 접근성 PASS

axe 0 violations는 필요조건이지 충분조건이 아니다. 키보드·이름·과업·스크린리더를 함께 본다.

### A11Y-P8. 위젯은 디자인 패턴을 따른다

Tabs, Dialog, Combobox, Menu는 WAI-ARIA APG의 키보드·역할 계약을 따른다. “비슷한 UI”를 즉흥 구현하지 않는다.

### A11Y-P9. 움직임과 시간은 사용자가 통제한다

자동 재생, 짧은 타임아웃, 깜빡임은 정지·연장·감소 수단이 필요하다.

### A11Y-P10. 오류는 찾고, 이해하고, 고칠 수 있어야 한다

제출 실패 후 무엇이 틀렸는지, 어디에 있는지, 어떻게 고치는지가 필드와 연결되어 있어야 한다.

### A11Y-P11. 접근성은 회귀한다

새 variant, 포털, 커스텀 셀렉트, 마케팅 배너가 계약을 깨기 쉽다. 게이트 없는 접근성은 시간이 지나면 후퇴한다.

### A11Y-P12. 보고 후 수정한다

먼저 Finding을 보고한다. 사용자가 QA+수정을 요청하지 않았다면 코드를 바꾸지 않는다.

---

## 3. Project Binding

```yaml
accessibility_binding:
  workspace_root: "."
  app_path: "apps/web"              # 또는 frontend
  package_manager: "pnpm"
  standard:
    target: "WCAG 2.2 AA"
    exceptions: []                  # 법적/일시 예외만
  commands:
    build: "pnpm --filter web build"
    start: "pnpm --filter web start"
    test_a11y: "pnpm playwright test --project=accessibility"
    storybook_a11y: "pnpm test-storybook"
  base_url: "http://127.0.0.1:3000"
  p0_routes:
    - path: "/"
      auth: false
    - path: "/auth/login"
      auth: false
    - path: "/catalog"
      auth: false
    - path: "/recommend"
      auth: false
    - path: "/settings"
      auth: true
  p0_tasks:
    - "로그인"
    - "검색/필터로 항목 찾기"
    - "폼 제출 및 오류 수정"
    - "모달 열고 저장/닫기"
    - "주요 CTA 활성화"
  components_p0:
    - Button
    - Input
    - Select/Combobox
    - Dialog
    - DropdownMenu
    - Tabs
    - Toast
  screen_readers:
    windows: ["NVDA + Chrome"]
    mac: ["VoiceOver + Safari"]
    mobile: ["TalkBack", "VoiceOver iOS"]
  tools:
    axe: true
    playwright: true
    storybook_addon_a11y: true
  freeze_list: []
```

### 3.1 Binding 자동 탐색

```bash
rg -n "axe-core|@axe-core/playwright|eslint-plugin-jsx-a11y|storybook.*a11y" \
  package.json apps/*/package.json frontend/package.json

rg -n "aria-|role=|sr-only|VisuallyHidden" app src frontend --glob "*.tsx" | head

fd "page.tsx" app frontend/src/app | head -40
```

### 3.2 지원 환경 선언

감사 전에 “어디까지 수동 검증하는가”를 적는다.

```markdown
| 환경 | 이번 감사 | 비고 |
|------|-----------|------|
| Keyboard Chromium | 예 | P0 전체 |
| axe | 예 | P0 + 주요 상태 |
| NVDA + Chrome | 예/BLOCKED | |
| VoiceOver + Safari | BLOCKED | mac 없음 |
| 200% zoom | 예 | |
| forced-colors | 예 (emulation) | |
| reduced-motion | 예 | |
```

---

## 4. 실행 파이프라인과 Severity

```text
1. BIND
   표준·P0·도구·SR 환경을 확정한다.

2. BUILD
   프로덕션 빌드로 실행한다. (dev overlay가 결과를 오염시킬 수 있음)

3. AUTOMATED SWEEP
   axe를 P0 라우트와 주요 상태(모달 open, 탭 선택, 폼 error)에 실행한다.

4. KEYBOARD WALKTHROUGH
   마우스 없이 P0 과업을 완수한다. 막힘·포커스·순서를 기록한다.

5. NAME/ROLE/VALUE
   인터랙티브·상태 요소의 접근 가능한 이름을 전수에 가깝게 확인한다.

6. SENSORY
   대비, 색만 의존, 확대, forced-colors, reduced-motion을 점검한다.

7. WIDGET CONTRACTS
   Dialog/Menu/Tabs/Combobox 등 복합 위젯의 APG 계약을 검증한다.

8. SCREEN READER
   핵심 시나리오를 SR로 수행한다. 불가면 BLOCKED.

9. CONTENT
   대체 텍스트, 언어, 오류 문구, 지시문을 검토한다.

10. REPORT
    SC 기준으로 보고한다. 수정은 승인 후.
```

### 4.1 Severity

| 등급 | 접근성 기준 |
|------|-------------|
| **S0 Blocker** | P0 과업을 보조 기술/키보드로 완수 불가. 깜빡임 발작 위험. |
| **S1 Critical** | 핵심 컨트롤 이름 없음, 키보드 트랩, 모달 포커스 실패, 본문 대비 미달, 폼 오류 연결 없음. |
| **S2 Major** | landmark/heading 구조 불량, 일부 위젯 APG 위반, 상태 미노출, 비P0 경로 장애. |
| **S3 Minor** | 중복 이름, 사소한 순서, 장식 이미지 alt 정리 등. 우회 가능. |
| **S4 Nit** | 문구 다듬기, 관례적 개선. 기준 위반 아님. |

**상향**

```text
- 인증·결제·삭제·동의 경로: +1
- 신규 사용자 첫 화면: +1
- 동일 패턴이 디자인 시스템에 있어 전역 전파: +1
```

WCAG Level A 실패는 보통 S1 이상이다. AA 실패는 영향 범위에 따라 S1~S2다.

---

## 5. WCAG 2.2 매핑

이 문서의 검사 ID와 주요 SC를 연결한다. Finding에는 반드시 SC를 적는다.

| 영역 | 대표 SC (2.2) | 문서 섹션 |
|------|----------------|-----------|
| 비텍스트 콘텐츠 | 1.1.1 | §11 |
| 정보와 관계 | 1.3.1 | §6, §12 |
| 색에만 의존 금지 | 1.4.1 | §10 |
| 대비(최소) | 1.4.3 | §10 |
| 텍스트 크기 조정 | 1.4.4 | §18 |
| 텍스트 간격 | 1.4.12 | §18 |
| 키보드 | 2.1.1 / 2.1.2 | §8, §9 |
| 타이밍 조절 | 2.2.1 | §14 |
| 깜빡임 | 2.3.1 | §14 |
| 건너뛰기 | 2.4.1 | §6 |
| 페이지 제목 | 2.4.2 | §6 |
| 포커스 순서 | 2.4.3 | §9 |
| 링크 목적 | 2.4.4 | §7 |
| 포커스 표시 | 2.4.7 / 2.4.11 / 2.4.13 | §9 |
| 포커스 가리지 않음 | 2.4.11 | §9 |
| 일관된 도움말 | 3.2.6 | §19 |
| 레이블/지시 | 3.3.2 | §12 |
| 오류 식별·제안 | 3.3.1 / 3.3.3 | §13 |
| 접근 가능 인증 | 3.3.8 | §12 |
| 이름·역할·값 | 4.1.2 | §7, §20 |
| 상태 메시지 | 4.1.3 | §17 |

2.2에서 강조되는 **Focus Not Obscured**, **Focus Appearance**, **Dragging Movements**, **Accessible Authentication**, **Target Size**를 P0 컴포넌트에서 빠뜨리지 않는다.

---

## 6. 의미 있는 구조

### A11Y-STR-01 — 페이지 언어과 문서 언어

**WHY**

탭이 여러 개일 때 제목이 같으면 위치를 알 수 없다. `html lang`이 틀리면 스크린리더 발음·하이픈이 깨진다.

**DETECT**

```bash
rg -n "lang=|generateMetadata|title:" app frontend --glob "*.{tsx,ts}" | head
```

```ts
test('document language and title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', /ko|en/);
  const title = await page.title();
  expect(title.length).toBeGreaterThan(3);
  expect(title).not.toMatch(/^(App|Untitled|Next)/i);
});
```

**FIX**

```tsx
// app/layout.tsx
<html lang="ko">

// app/settings/billing/page.tsx
export const metadata = { title: '결제 설정' };
// root template: '%s | Acme'
```

---

### A11Y-STR-02 — Landmark와 스킵 링크

**DETECT**

```ts
test('landmarks and skip link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner').or(page.locator('header'))).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: /본문|skip|건너뛰/i });
  if (await skip.count()) {
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused()
      .catch(async () => {
        // main이 tabindex=-1이면 포커스 가능해야 함
        await expect(page.locator('#main, main')).toBeFocused();
      });
  } else {
    test.info().annotations.push({ type: 'issue', description: 'skip link missing' });
  }
});
```

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3">
  본문으로 건너뛰기
</a>
<main id="main" tabIndex={-1}>...</main>
```

여러 `navigation` landmark에는 이름을 붙인다: `aria-label="주 메뉴"`.

---

### A11Y-STR-03 — Heading 계층

**DETECT**

```ts
const headings = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(els =>
  els.map(el => ({ level: Number(el.tagName[1]), text: el.textContent?.trim().slice(0, 60) })));
console.table(headings);
expect(headings.filter(h => h.level === 1).length).toBe(1);
for (let i = 1; i < headings.length; i++) {
  expect(headings[i].level - headings[i - 1].level).toBeLessThanOrEqual(1);
}
```

스타일만 큰 텍스트를 heading처럼 쓰지 말고, heading을 시각적으로만 작게 만들 때도 의미를 유지한다.

---

### A11Y-STR-04 — 리스트·문단·강조의 의미

```bash
rg -n "<div[^>]*>\s*•|<br\s*/?>\s*<br" app src --glob "*.tsx" | head
```

관련 항목은 `<ul>/<ol>`, 정의는 `<dl>`, 강조는 CSS 크기만이 아니라 필요 시 시맨틱을 검토한다. 레이아웃용 테이블은 금지에 가깝다.

---

## 7. Name · Role · Value

### A11Y-NRV-01 — Accessible Name 전수

**WHY**

이름이 없는 버튼/링크/입력은 스크린리더 로터와 음성 제어에서 사라진다.

**DETECT**

```ts
test('interactive elements have accessible names', async ({ page }) => {
  await page.goto('/');

  const unnamed = await page.evaluate(() => {
    const selectors = [
      'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
      '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]',
      '[role="checkbox"]', '[role="switch"]', '[role="combobox"]',
    ];
    const isVisible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const out: string[] = [];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        if (!isVisible(el)) return;
        const name = (el as HTMLElement).accessibleName
          ?? (window as any).getComputedAccessibleNode?.(el)?.name;
        // fallback approximation
        const aria = el.getAttribute('aria-label')
          || el.getAttribute('aria-labelledby')
          || (el as HTMLInputElement).labels?.[0]?.textContent
          || el.textContent
          || el.getAttribute('title')
          || el.getAttribute('alt')
          || '';
        if (!aria.trim()) {
          out.push(`${el.tagName.toLowerCase()}#${el.id || ''} .${(el as HTMLElement).className?.toString().slice(0, 40)}`);
        }
      });
    }
    return out;
  });

  // Playwright 권장: getByRole로 샘플링 + evaluate 보조
  expect(unnamed, unnamed.join('\n')).toEqual([]);
});
```

더 정확히는 Playwright의 `ariaSnapshot` 또는 각 컨트롤에 대해 `toHaveAccessibleName`을 사용한다.

```ts
for (const button of await page.getByRole('button').all()) {
  const name = await button.getAttribute('aria-label')
    ?? await button.innerText();
  expect((name ?? '').trim().length, await button.evaluate(e => e.outerHTML.slice(0, 120)))
    .toBeGreaterThan(0);
}
```

**FIX**

```tsx
// ❌
<button><Trash2 /></button>
<a href="/next"><ChevronRight /></a>

// ✅
<button type="button" aria-label="리포트 삭제"><Trash2 aria-hidden /></button>
<a href="/next" aria-label="다음 페이지"><ChevronRight aria-hidden /></a>

// ✅ 텍스트가 보이면 그것으로 충분
<button type="button"><Trash2 aria-hidden />삭제</button>
```

---

### A11Y-NRV-02 — Role의 정확성

**DETECT**

```bash
rg -n "role=\"button\"|role='button'|onClick=\{" app src --glob "*.tsx" | head
rg -n "<div[^>]*onClick|<span[^>]*onClick" app src --glob "*.tsx" | head
```

```tsx
// ❌
<div onClick={save}>저장</div>

// ✅
<button type="button" onClick={save}>저장</button>

// 페이지 이동
<Link href="/pricing">요금제</Link>
// 또는
<a href="/pricing">요금제</a>
```

커스텀 role을 쓸 때는 APG 키보드 지원을 함께 구현해야 한다. role만 붙이고 동작을 안 넣으면 4.1.2 실패다.

---

### A11Y-NRV-03 — Value와 상태 노출

펼침, 선택, 현재 페이지, pressed, busy, invalid가 시각에만 있으면 실패다.

```tsx
<button aria-expanded={open} aria-controls="filters-panel">필터</button>
<a href="/settings" aria-current="page">설정</a>
<button aria-pressed={on}>굵게</button>
<button aria-busy={loading} disabled={loading}>저장</button>
<input aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined} />
```

```ts
test('disclosure exposes expanded state', async ({ page }) => {
  const btn = page.getByRole('button', { name: '필터' });
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
});
```

---

### A11Y-NRV-04 — 링크 목적

“여기”, “더보기”, “클릭”만 있는 링크는 2.4.4 실패 가능성이 높다.

```bash
rg -n ">\s*(더보기|여기|클릭|read more|click here)\s*<" app src --glob "*.tsx"
```

```tsx
// ❌
<a href="/posts/1">더보기</a>

// ✅
<a href="/posts/1">연간 리포트 더보기</a>
// 또는 주변 제목과 연결
<a href="/posts/1" aria-describedby="post-1-title">더보기</a>
```

---

### A11Y-NRV-05 — aria-label이 보이는 라벨을 덮어쓰지 않게

보이는 텍스트와 다른 `aria-label`은 음성 제어 사용자에게 혼란을 준다. 가능하면 보이는 이름을 그대로 쓰고, 보충은 `aria-describedby`.

```tsx
// 위험: 화면은 "삭제", SR은 "Remove item 12"
<button aria-label="Remove item 12">삭제</button>

// 더 나은 예
<button aria-label="견적서 삭제">삭제</button>
// 또는 화면에 구체적 텍스트
<button>견적서 삭제</button>
```

---

## 8. 키보드 접근

### A11Y-KBD-01 — P0 과업 키보드 완수

**DETECT**

```ts
test('complete login with keyboard only', async ({ page }) => {
  await page.goto('/auth/login');
  await page.keyboard.press('Tab'); // skip link or first field
  // 실제 순서에 맞게
  await page.getByLabel('이메일').focus();
  await page.keyboard.type('user@example.com');
  await page.keyboard.press('Tab');
  await page.keyboard.type('password123!');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/dashboard|home|catalog/);
});
```

마우스를 쓰지 않는 규칙을 테스트 코드 리뷰로 강제한다. `page.mouse` / `locator.click` 대신 `focus` + `keyboard` 또는 `getByRole(...).press('Enter')`.

**PASS / FAIL**

- PASS: 모든 P0 과업이 키보드로 완수된다.
- FAIL: 완수 불가 S0/S1, 과도한 탭(논리 순서 불량) S2.

---

### A11Y-KBD-02 — 키보드 트랩

**WHY**

포커스가 위젯 밖으로 나가지 못하면 2.1.2 실패다. 모달의 focus trap은 **의도적**이며 Esc/닫기로 탈출 가능해야 한다.

**DETECT**

```ts
test('no accidental keyboard trap on page', async ({ page }) => {
  await page.goto('/catalog');
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const key = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? `${el.tagName}:${el.id}:${el.className}:${el.getAttribute('aria-label')}` : 'null';
    });
    seen.add(key);
  }
  // 동일 요소만 반복되면 트랩 의심 (모달이 아닐 때)
  expect(seen.size).toBeGreaterThan(3);
});
```

커스텀 임베드(지도, 에디터, 결제 iframe)는 Tab으로 빠져나올 수 있는지 확인한다. 안 되면 우회 링크를 제공한다.

---

### A11Y-KBD-03 — 표준 키 계약

| 위젯 | 필수 키 |
|------|---------|
| Button | Enter/Space 활성화 |
| Link | Enter |
| Checkbox | Space |
| Radio | Arrow |
| Tabs | Arrow + 선택 정책 |
| Menu | Arrow / Enter / Esc / Home / End |
| Dialog | Esc 닫기, Tab 순환 |
| Combobox | 문자 입력, Arrow, Enter, Esc |
| Disclosure | Enter/Space |

```ts
test('menu keyboard', async ({ page }) => {
  await page.goto('/iframe.html?id=menu--default'); // 또는 제품 페이지
  await page.getByRole('button', { name: '계정' }).press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.getByRole('button', { name: '계정' })).toBeFocused();
});
```

---

### A11Y-KBD-04 — 드래그 전용 조작 (WCAG 2.2)

드래그로만 가능한 정렬/이동은 2.5.7 실패다. 같은 결과를 버튼(위로/아래로) 또는 입력으로 제공해야 한다.

```tsx
<div className="flex items-center gap-2">
  <button type="button" aria-label="항목을 위로 이동" onClick={moveUp}>▲</button>
  <button type="button" aria-label="항목을 아래로 이동" onClick={moveDown}>▼</button>
  <div draggable onDragStart={...}>{title}</div>
</div>
```

---

### A11Y-KBD-05 — 단축키와 단일 키 문자

단일 문자 단축키(예: `?`, `/`)는 입력 중이 아닐 때만 동작해야 하며, 끄거나 재매핑할 수 있으면 가장 안전하다(2.1.4).

```ts
function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el?.closest('input, textarea, select, [contenteditable="true"]');
}
```

---

## 9. 포커스 관리

### A11Y-FOCUS-01 — 보이는 포커스 표시

**DETECT**

```bash
rg -n "outline:\s*none|outline-none|ring-0" app src --glob "*.{css,tsx}" | head
```

```ts
test('focused control has visible indicator', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link').first().focus();
  const visible = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    const outline = s.outlineStyle !== 'none' && s.outlineWidth !== '0px';
    const ring = s.boxShadow !== 'none';
    return outline || ring;
  });
  expect(visible).toBe(true);
});
```

**FIX**

```css
:focus { outline: none; }                 /* ❌ 전역 제거 */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

WCAG 2.2 Focus Appearance(2.4.13 AAA에 가깝지만 실무에서 권장) — 대비와 두께가 충분한지 확인한다.

---

### A11Y-FOCUS-02 — 포커스 순서와 시각 순서

`tabIndex > 0`은 거의 항상 해롭다.

```bash
rg -n "tabIndex=\{?[1-9]|tabindex=\"[1-9]" app src --glob "*.tsx"
```

DOM 순서를 시각 순서에 맞춘다. CSS로 시각만 재배치(`order`, 절대 위치)하면 2.4.3 실패가 난다.

---

### A11Y-FOCUS-03 — 포커스 가리지 않음 (2.4.11)

고정 헤더·쿠키 배너·채팅 위젯이 포커스된 요소를 가리면 실패다.

```ts
test('focused element not covered by sticky UI', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('link');
  for (let i = 0; i < Math.min(await links.count(), 15); i++) {
    const link = links.nth(i);
    await link.focus();
    const ok = await link.evaluate(el => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      return !!top && (top === el || el.contains(top) || top.contains(el));
    });
    expect(ok, `covered: ${await link.accessibleName()}`).toBe(true);
  }
});
```

```css
html { scroll-padding-top: var(--header-height, 4rem); }
```

---

### A11Y-FOCUS-04 — 라우트 전환 후 포커스

SPA/Next 앱에서 페이지 이동 후 포커스가 남아 있거나 `<body>`로만 가면 맥락을 잃는다.

```tsx
// 새 페이지 로드 시 주 heading으로 이동
'use client';
export function RouteFocus() {
  const pathname = usePathname();
  useEffect(() => {
    const h1 = document.querySelector('h1');
    if (h1 instanceof HTMLElement) {
      h1.tabIndex = -1;
      h1.focus();
    }
  }, [pathname]);
  return null;
}
```

---

### A11Y-FOCUS-05 — 숨김 요소에 포커스 금지

`display:none`, `visibility:hidden`, `hidden`, `inert` 처리된 패널 안의 컨트롤이 탭 순서에 있으면 실패다. 닫힌 모바일 메뉴를 `off-screen`만 하고 포커스 가능하게 두지 않는다.

```tsx
{open ? <nav>...</nav> : null}
// 또는
<nav hidden={!open} inert={!open || undefined}>...</nav>
```

---

## 10. 색 · 대비 · 시각

### A11Y-COLOR-01 — 텍스트 대비 (1.4.3)

**임계값**

| 유형 | 최소 대비 |
|------|-----------|
| 일반 텍스트 | 4.5:1 |
| 큰 텍스트 (≈18pt/14pt bold 이상) | 3:1 |
| UI 컴포넌트·그래픽 경계 (1.4.11) | 3:1 |

**DETECT**

```ts
import { getContrast } from 'polished'; // 또는 culori / colorjs.io

test('primary text contrast', async ({ page }) => {
  await page.goto('/');
  const samples = await page.evaluate(() => {
    const pick = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { fg: s.color, bg: s.backgroundColor, text: el.textContent?.slice(0, 40) };
    };
    return [
      pick('main p'),
      pick('main h1'),
      pick('button'),
      pick('a'),
    ].filter(Boolean);
  });
  // 실제 대비 계산은 Node 쪽에서 getContrast로
  console.table(samples);
});
```

토큰 쌍을 단위 테스트로 고정하는 편이 회귀에 강하다. (`07_Design_System_QA.md` DS-COLOR-02와 연계)

**PASS / FAIL**

- PASS: P0 텍스트·버튼·입력 경계가 임계값 이상.
- FAIL: 본문 미달 S1, muted 보조 텍스트 미달 S2, placeholder만 미달 S2.

placeholder 대비만 맞추고 레이블을 없애지 않는다. placeholder는 레이블 대체재가 아니다.

---

### A11Y-COLOR-02 — 색에만 의존하지 않음 (1.4.1)

```tsx
// ❌
<span className={ok ? 'text-green-600' : 'text-red-600'}>●</span>

// ✅
<span className="inline-flex items-center gap-1 text-red-700">
  <CircleAlert aria-hidden /> 동기화 실패
</span>
```

폼 오류를 빨간 테두리만으로 표시하지 말고 텍스트·아이콘·`aria-invalid`를 함께 쓴다. 차트는 패턴·직접 라벨을 병행한다.

```ts
test('status is not color-only', async ({ page }) => {
  await page.addStyleTag({ content: 'html { filter: grayscale(1) !important; }' });
  await page.goto('/orders');
  await expect(page.getByText(/실패|완료|대기/)).toBeVisible();
});
```

---

### A11Y-COLOR-03 — Focus·선택 표시 대비 (1.4.11)

포커스 링과 선택 배경이 인접색과 3:1을 유지하는지 확인한다. 다크 모드·고대비를 별도 측정한다.

---

### A11Y-COLOR-04 — forced-colors

```css
@media (forced-colors: active) {
  .card { border: 1px solid CanvasText; }
  .button[aria-pressed='true'] { outline: 2px solid Highlight; }
  .icon { fill: currentColor; }
}
```

```ts
await page.emulateMedia({ forcedColors: 'active' });
```

배경/그림자로만 구분하던 UI가 사라지지 않는지 본다.

---

## 11. 이미지 · 아이콘 · 미디어

### A11Y-MEDIA-01 — 의미 있는 이미지의 대체 텍스트 (1.1.1)

```bash
rg -n "<img |<Image" app src --glob "*.tsx" | rg -v "alt="
```

```tsx
// 정보 이미지
<Image src={product} alt="청색 알루미늄 케이스의 60% 키보드" width={640} height={400} />

// 장식
<Image src={divider} alt="" width={200} height={8} />
// 또는 aria-hidden
<svg aria-hidden focusable="false">...</svg>
```

```text
❌ alt="image", alt="사진", alt="screenshot"
❌ 파일명 그대로
✅ 이미지의 목적/내용을 사용자 과업 기준으로 서술
```

---

### A11Y-MEDIA-02 — 아이콘 버튼

텍스트 없는 아이콘은 부모 컨트롤에 이름을 둔다. SVG에 `<title>`만 의존하지 않는다.

```tsx
<button type="button" aria-label="장바구니 열기">
  <ShoppingCart aria-hidden className="size-5" />
</button>
```

---

### A11Y-MEDIA-03 — 복합 이미지·차트

복잡한 차트는 짧은 alt + 데이터 테이블/요약 텍스트를 제공한다.

```tsx
<figure>
  <img src="/chart.png" alt="지난 6개월 매출 추이 차트" />
  <figcaption>
    1월 1200만 원에서 6월 1800만 원으로 상승했습니다.
    <a href="#chart-data">데이터 표 보기</a>
  </figcaption>
</figure>
```

---

### A11Y-MEDIA-04 — 비디오·오디오

```text
[ ] 자막(캡션) — 녹음된 음성
[ ] 오디오 설명 또는 원고 — 시각 정보 중요 시
[ ] 자동재생 금지 또는 즉시 정지 컨트롤 (1.4.2)
[ ] 키보드로 재생/정지/시크 가능
```

```tsx
<video controls>
  <source src="/demo.mp4" type="video/mp4" />
  <track kind="captions" src="/demo-ko.vtt" srcLang="ko" label="한국어" default />
</video>
```

---

### A11Y-MEDIA-05 — CAPTCHA와 비텍스트 챌린지

접근 가능 인증(3.3.8) — 인지 퍼즐·이미지 문자만으로 로그인하지 않는다. 이메일 링크, WebAuthn, OAuth 등 대안을 제공한다.

---

## 12. 폼과 입력

### A11Y-FORM-01 — Label 연결 (3.3.2 / 1.3.1)

**DETECT**

```ts
test('inputs have labels', async ({ page }) => {
  await page.goto('/auth/signup');
  const inputs = page.locator('input:not([type="hidden"]), select, textarea');
  for (let i = 0; i < await inputs.count(); i++) {
    const input = inputs.nth(i);
    const id = await input.getAttribute('id');
    const aria = await input.getAttribute('aria-label');
    const labelledby = await input.getAttribute('aria-labelledby');
    const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() : 0;
    expect(
      hasLabel || aria || labelledby,
      await input.evaluate(e => e.outerHTML.slice(0, 160)),
    ).toBeTruthy();
  }
});
```

```tsx
// ❌ placeholder only
<input placeholder="이메일" />

// ✅
<label htmlFor="email">이메일</label>
<input id="email" name="email" type="email" autoComplete="email" />
```

---

### A11Y-FORM-02 — 지시문과 필수 표시

필수 필드만 `*`로 표시하고 범례를 제공한다. 색만으로 필수를 표시하지 않는다.

```tsx
<p className="text-sm text-muted-foreground">* 표시는 필수 항목입니다.</p>
<label htmlFor="name">이름 *</label>
<input id="name" required aria-required="true" />
```

형식 지시(`YYYY-MM-DD`)는 입력 **전**에 `aria-describedby`로 제공한다.

---

### A11Y-FORM-03 — 자동완성·입력 목적 (1.3.5)

```tsx
<input name="email" type="email" autoComplete="email" />
<input name="name" autoComplete="name" />
<input name="new-password" type="password" autoComplete="new-password" />
<input name="cc-number" autoComplete="cc-number" inputMode="numeric" />
```

---

### A11Y-FORM-04 — 그룹화

라디오/체크박스 그룹은 `fieldset/legend` 또는 `role="group"` + 이름을 사용한다.

```tsx
<fieldset>
  <legend>배송 방법</legend>
  <label><input type="radio" name="ship" value="parcel" /> 택배</label>
  <label><input type="radio" name="ship" value="pickup" /> 방문수령</label>
</fieldset>
```

---

### A11Y-FORM-05 — Accessible Authentication (3.3.8)

비밀번호 붙여넣기를 막지 않는다. 인지 테스트(퍼즐, 암기)를 강제하지 않는다.

```bash
rg -n "onPaste=.*preventDefault|autocomplete=\"off\"" app src --glob "*.tsx" | head
```

---

## 13. 오류 · 상태 · 피드백

### A11Y-ERR-01 — 오류 식별과 연결 (3.3.1 / 3.3.3)

```tsx
<label htmlFor="email">이메일</label>
<input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
/>
<p id="email-hint">회사 메일을 권장합니다.</p>
{errors.email && (
  <p id="email-error" role="alert" className="text-sm text-destructive">
    이메일 형식을 확인해주세요. 예: name@company.com
  </p>
)}
```

제출 실패 시:

1. 요약(여러 오류) + 필드로 이동 링크
2. 첫 오류 필드로 포커스
3. 수정 방법 제시 (단순 “유효하지 않습니다” 금지)

```ts
test('submit focuses first invalid field', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.getByRole('button', { name: /가입|만들기/ }).click();
  await expect(page.locator('[aria-invalid="true"]').first()).toBeFocused();
});
```

---

### A11Y-ERR-02 — 성공/진행 상태

성공 토스트는 `role="status"`/`aria-live="polite"`로 전달한다. loading 버튼은 `aria-busy`와 안정된 accessible name을 유지한다.

```tsx
<button aria-busy={pending || undefined} disabled={pending}>
  {pending ? '저장 중…' : '저장'}
</button>
```

이름 전체를 “Loading”으로 바꿔 버리면 어떤 버튼인지 잃는다. 가능하면 원래 이름을 유지하고 상태를 추가로 알린다.

---

### A11Y-ERR-03 — 비활성 이유

`disabled`만 있고 이유가 없으면 막다른 길이다. 인접 텍스트 또는 활성화 조건을 제공한다. disabled 컨트롤에만 호버 툴팁을 걸지 않는다(포커스/포인터 이벤트가 없을 수 있음).

```tsx
<span tabIndex={0} className="inline-flex">
  <button disabled aria-describedby="why">결제</button>
</span>
<p id="why">약관에 동의해야 결제할 수 있습니다.</p>
```

---

## 14. 모션 · 시간 · 애니메이션

### A11Y-MOTION-01 — prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

장식 패럴랙스/자동 캐러셀은 중단한다. 상태 전달에 필요한 짧은 opacity는 유지할 수 있다.

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
```

---

### A11Y-MOTION-02 — 자동 재생·이동 (2.2.2)

5초 이상 자동으로 움직이거나 깜빡이는 UI에는 정지 컨트롤이 필요하다.

```tsx
<button type="button" onClick={() => setPaused(p => !p)}>
  {paused ? '슬라이드 재생' : '슬라이드 정지'}
</button>
```

---

### A11Y-MOTION-03 — 시간 제한 (2.2.1)

세션 만료 전 경고 + 연장. 짧게 사라지는 토스트에만 중요한 오류를 담지 않는다.

```tsx
// 만료 2분 전
<AlertDialog>
  <AlertDialogTitle>곧 로그아웃됩니다</AlertDialogTitle>
  <AlertDialogAction onClick={extend}>로그인 유지</AlertDialogAction>
</AlertDialog>
```

---

### A11Y-MOTION-04 — 깜빡임 (2.3.1)

초당 3회 이상 깜빡이는 콘텐츠를 만들지 않는다. 로딩 스피너는 예외적으로 허용되나 광과민 패턴의 큰 영역 깜빡임은 금지.

---

## 15. 오버레이 · 대화상자 · 메뉴

### A11Y-OVL-01 — Dialog 계약

**필수**

```text
[ ] role="dialog" (또는 alertdialog)
[ ] aria-modal="true" (모달인 경우)
[ ] 접근 가능한 이름 (aria-labelledby → 제목)
[ ] 열릴 때 내부로 포커스 이동
[ ] Tab이 다이얼로그 안에서 순환
[ ] Esc로 닫기 (파괴적 진행 중이면 예외를 문서화)
[ ] 닫힌 뒤 트리거로 포커스 복귀
[ ] 배경은 inert/aria-hidden으로 상호작용 차단
```

```ts
test('dialog focus lifecycle', async ({ page }) => {
  await page.goto('/settings');
  const trigger = page.getByRole('button', { name: '멤버 초대' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toBeVisible();

  // trap
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() =>
      !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

```tsx
<Dialog.Content aria-labelledby="invite-title" aria-describedby="invite-desc">
  <Dialog.Title id="invite-title">멤버 초대</Dialog.Title>
  <Dialog.Description id="invite-desc">이메일로 초대 링크를 보냅니다.</Dialog.Description>
  ...
</Dialog.Content>
```

---

### A11Y-OVL-02 — AlertDialog vs Dialog

파괴적 확인은 `role="alertdialog"`와 즉시 결정에 필요한 질문·버튼을 담는다. 장문 폼을 alertdialog에 넣지 않는다.

버튼 라벨은 “확인”이 아니라 “워크스페이스 삭제”처럼 동작을 서술한다.

---

### A11Y-OVL-03 — Menu / Disclosure

```tsx
// Menu
<button aria-haspopup="menu" aria-expanded={open}>더보기</button>
<div role="menu">
  <div role="menuitem" tabIndex={-1}>복제</div>
  <div role="menuitem" tabIndex={-1}>삭제</div>
</div>

// Disclosure
<button aria-expanded={open} aria-controls="panel-1">상세</button>
<div id="panel-1" hidden={!open}>...</div>
```

Menu는 roving tabindex, Arrow 탐색, Esc 닫기, 문자 키 검색(가능하면)을 구현한다. Radix/shadcn을 쓰더라도 제품 래핑이 계약을 깨지 않았는지 테스트한다.

---

### A11Y-OVL-04 — Popover / Tooltip

```text
Tooltip: 짧은 설명, hover/focus, Esc로 닫기, 인터랙티브 콘텐츠 금지
Popover: 포커스 가능한 콘텐츠 허용, 열림 상태 명시
```

툴팁만으로 필수 정보를 전달하지 않는다. 아이콘 버튼의 이름은 `aria-label`로, 부가 설명만 tooltip.

---

### A11Y-OVL-05 — 중첩 오버레이

Esc는 최상위만 닫아야 한다. 포커스 트랩이 겹칠 때 스택을 관리한다. 토스트가 모달 위에 떠도 포커스를 훔치지 않는다(`aria-live`만).

---

## 16. 테이블 · 목록 · 데이터 뷰

### A11Y-TABLE-01 — 데이터 테이블 마크업

```tsx
<table>
  <caption>2026년 7월 청구 내역</caption>
  <thead>
    <tr>
      <th scope="col">날짜</th>
      <th scope="col">금액</th>
      <th scope="col" aria-sort="descending">상태</th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

레이아웃용 `<table>` 금지. 정렬 가능한 헤더는 `aria-sort`와 버튼으로 키보드 활성화.

---

### A11Y-TABLE-02 — 행 액션

호버에만 나타나는 행 액션은 `group-focus-within`으로 키보드에서도 보이게 한다.

```tsx
<tr className="group">
  <td>...</td>
  <td>
    <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
      <Button size="sm">편집</Button>
    </div>
  </td>
</tr>
```

---

### A11Y-TABLE-03 — 리스트·그리드 대안 (모바일)

좁은 화면에서 카드 리스트로 바꿀 때도 각 카드의 제목·상태·액션 이름을 유지한다. 체크박스 일괄 선택 시 `aria-checked="mixed"`(indeterminate)를 지원한다.

---

## 17. 라이브 리전과 동적 업데이트

### A11Y-LIVE-01 — 상태 메시지 (4.1.3)

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

<div role="alert" aria-live="assertive">
  {criticalError}
</div>
```

```text
polite     — 저장 완료, 검색 결과 n건
assertive  — 제출 실패, 연결 끊김 (남용 금지)
```

라이브 리전을 매 키 입력마다 갱신하지 않는다. 디바운스된 결과만 알린다.

---

### A11Y-LIVE-02 — 로딩과 결과 교체

검색 중이면 `aria-busy`를 영역에 걸고, 결과가 바뀌면 요약 문구를 라이브로 보낸다.

```tsx
<div aria-busy={loading || undefined}>
  {loading ? <Spinner aria-hidden /> : null}
  <p role="status">{`검색 결과 ${count}건`}</p>
  <ul>{...}</ul>
</div>
```

---

### A11Y-LIVE-03 — 토스트

```tsx
// 토스트 컨테이너
<div aria-live="polite" aria-relevant="additions text">
  {toasts.map(t => (
    <div key={t.id} role="status">
      {t.title}
      {t.actionLabel && (
        <button type="button" onClick={t.onAction}>{t.actionLabel}</button>
      )}
    </div>
  ))}
</div>
```

토스트가 포커스를 강제로 가져가지 않는다. 액션이 필요하면 충분한 시간 또는 알림 센터에 남긴다.

---

## 18. 모바일 · 터치 · 확대

### A11Y-MOB-01 — 대상 크기 (2.5.8)

WCAG 2.2 AA 타깃 크기 최소 **24×24 CSS px**, 권장 44×44(모바일 UX).

```ts
test('touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const small = await page.locator('a, button, input, summary, [role="button"]').evaluateAll(els =>
    els.flatMap(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return [];
      return (r.width < 24 || r.height < 24)
        ? [{ name: (el.textContent || el.getAttribute('aria-label') || '').trim(), w: r.width, h: r.height }]
        : [];
    }));
  expect(small).toEqual([]);
});
```

인접 타깃 사이 간격도 확인한다. 작은 아이콘이라도 hit area padding으로 확장한다.

---

### A11Y-MOB-02 — 확대 200% (1.4.4 / 1.4.10)

```ts
test('readable at 200% zoom equivalent', async ({ page }) => {
  await page.setViewportSize({ width: 1280 / 2, height: 800 / 2 }); // 근사
  await page.goto('/');
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(5);
});
```

`viewport`의 `user-scalable=no` / `maximum-scale=1` 금지.

```bash
rg -n "user-scalable=no|maximum-scale=1" app frontend public
```

---

### A11Y-MOB-03 — 포인터 제스처 대안 (2.5.1)

스와이프만으로 삭제/닫기 하지 않는다. 버튼 대안을 제공한다.

---

### A11Y-MOB-04 — 스크린 방향

가로/세로 중 하나만 강제하지 않는다(1.3.4). 예외는 필수 사유가 있을 때만.

---

## 19. 인지 · 읽기 · 언어

### A11Y-COG-01 — 언어 전환

페이지 일부 언어가 다르면 `lang`을 지정한다.

```tsx
<p>브랜드 슬로건: <span lang="en">Build faster</span></p>
```

---

### A11Y-COG-02 — 일관된 도움말 (3.2.6)

도움말/문의 진입점이 페이지마다 다른 위치에 두지 않는다. 반복 영역에서는 상대 순서를 유지한다(3.2.3).

---

### A11Y-COG-03 — 불필요한 인지 부하

한 번에 너무 많은 동시 알림, 모호한 아이콘만의 UI, 제한 시간 암기 요구를 피한다. 비밀번호 규칙이 있으면 입력 중에 체크리스트로 보여준다(회상보다 인식).

---

### A11Y-COG-04 — 읽기 순서

CSS 시각 순서와 DOM 순서가 어긋나 스크린리더가 다른 이야기를 하면 실패다. 다단·카드 그리드를 점검한다.

---

## 20. ARIA 사용과 남용

### A11Y-ARIA-01 — 첫 규칙

**가능하면 네이티브.** ARIA는 힘을 빌리는 도구이지 기본값이 아니다.

```text
금지에 가까운 패턴
- <div role="button"> without key handlers
- aria-label on non-interactive text that hides children
- role="presentation" on focusable elements incorrectly
- 중복 role that conflicts with native semantics
- aria-hidden="true" on focused/ancestor of focused node
```

```bash
rg -n "aria-hidden=\"true\"" app src --glob "*.tsx" | head
rg -n "role=\"button\"" app src --glob "*.tsx" | head
```

---

### A11Y-ARIA-02 — 관계형 속성

`aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`는 **존재하는 ID**를 가리켜야 한다.

```ts
const broken = await page.evaluate(() => {
  const attrs = ['aria-labelledby', 'aria-describedby', 'aria-controls'];
  const miss: string[] = [];
  document.querySelectorAll(attrs.map(a => `[${a}]`).join(',')).forEach(el => {
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (!v) continue;
      for (const id of v.split(/\s+/)) {
        if (id && !document.getElementById(id)) miss.push(`${a}=${id}`);
      }
    }
  });
  return miss;
});
expect(broken).toEqual([]);
```

---

### A11Y-ARIA-03 — 숨김과 inert

```tsx
// 모달 배경
<div inert aria-hidden="true">{app}</div>
```

`aria-hidden`만 쓰고 포커스 가능 요소가 남아 있으면 모순이다. `inert`를 우선 검토한다.

---

### A11Y-ARIA-04 — APG 패턴 준수

커스텀 Tabs/Combobox/Tree를 구현했다면 [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) 체크리스트를 그대로 Finding 기준으로 붙인다. “비슷하게 동작”은 증거가 아니다.

---

## 21. 스크린리더 검증

### A11Y-SR-01 — 최소 시나리오

환경이 되면 아래를 **소리로** 확인한다. 불가하면 BLOCKED.

```markdown
| # | 시나리오 | 기대 |
|---|----------|------|
| 1 | 페이지 진입 | 제목·언어·메인 landmark |
| 2 | 주 내비 | 링크 이름·현재 페이지 |
| 3 | 폼 작성 | 레이블·필수·오류 읽힘 |
| 4 | 모달 | 대화상자 이름·포커스·Esc |
| 5 | 토스트/저장 | 상태 메시지 발표 |
| 6 | 테이블 | 헤더와 셀 관계 |
```

### A11Y-SR-02 — 환경 매트릭스

```text
Windows: NVDA + Chrome/Firefox
macOS: VoiceOver + Safari (우선), Chrome 보조
iOS: VoiceOver
Android: TalkBack
```

한 환경만 통과했다고 전 환경 PASS로 쓰지 않는다. 확인한 조합을 리포트에 명시한다.

### A11Y-SR-03 — 기록 방법

```text
- 기대 발표 vs 실제 발표
- 모드 (browse/focus)
- SR/브라우저/OS 버전
- 짧은 음성 메모 또는 텍스트 트랜스크립트 (개인정보 주의)
- 증거 경로: tmp/qa/a11y/<date>/
```

---

## 22. 자동화와 Playwright

### A11Y-AUTO-01 — axe 스위프

```ts
// tests/accessibility/axe.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/catalog', '/auth/login', '/recommend'];

for (const path of routes) {
  test(`axe ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const violations = results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
    }));

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}
```

상태별:

```ts
test('axe dialog open', async ({ page }) => {
  await page.goto('/settings/members');
  await page.getByRole('button', { name: '초대' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations).toEqual([]);
});
```

알려진 예외는 `disableRules`보다 **수정**을 우선한다. 불가피하면 ID·이유·만료일을 manifest에 남긴다.

---

### A11Y-AUTO-02 — 전용 project

```ts
// playwright.config.ts 발췌
{
  name: 'accessibility',
  testDir: './tests/accessibility',
  use: {
    baseURL: process.env.A11Y_BASE_URL ?? 'http://127.0.0.1:3000',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
}
```

프로덕션 빌드 서버에 연결한다.

---

### A11Y-AUTO-03 — eslint-plugin-jsx-a11y

```js
// eslint.config 발췌
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.configs.strict.rules,
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
    },
  },
];
```

정적 규칙은 PR에서 조기 차단용이다. 런타임 계약을 대체하지 않는다.

---

### A11Y-AUTO-04 — Storybook a11y

```ts
// .storybook/test-runner.ts
import { injectAxe, checkA11y } from 'axe-playwright';

export const preVisit = async page => injectAxe(page);
export const postVisit = async page => {
  await checkA11y(page, '#storybook-root', {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
};
```

P0 컴포넌트의 state matrix story에 axe + play(keyboard)를 붙인다.

---

### A11Y-AUTO-05 — aria snapshot 회귀

Playwright `toMatchAriaSnapshot`으로 landmark/heading 골격을 고정할 수 있다.

```ts
await expect(page.locator('body')).toMatchAriaSnapshot(`
  - banner:
    - link "홈"
    - navigation:
      - link "카탈로그"
  - main:
    - heading "카탈로그" [level=1]
`);
```

시각 스냅샷보다 구조 회귀에 적합하다. 카피 변경이 잦은 영역은 느슨하게 둔다.

---

### A11Y-AUTO-06 — 콘솔의 a11y 경고

```ts
page.on('console', msg => {
  if (/a11y|aria|accessible/i.test(msg.text())) {
    errors.push(msg.text());
  }
});
```

React/Radix 경고를 무시하지 않는다.

---

## 23. Regression 절차

### Gate 1 — 정적

```bash
pnpm lint   # jsx-a11y 포함
rg -n "user-scalable=no|maximum-scale=1" app frontend public && exit 1 || true
rg -n "outline-none|outline:\\s*none" app src --glob "*.{css,tsx}" | head
```

### Gate 2 — axe P0

```bash
pnpm playwright test tests/accessibility/axe.spec.ts
```

```text
[ ] wcag2a/aa + 2.1/2.2 aa 태그
[ ] 모달·탭·오류 상태 포함
[ ] violations 0 (또는 승인된 만료 예외만)
```

### Gate 3 — 키보드 과업

```bash
pnpm playwright test tests/accessibility/keyboard.spec.ts
```

```text
[ ] 로그인/검색/폼/모달/CTA
[ ] 트랩 없음 (의도적 dialog trap 제외)
[ ] Esc/포커스 복귀
```

### Gate 4 — Name/Label

```bash
pnpm playwright test tests/accessibility/names.spec.ts
```

### Gate 5 — 대비·테마

```bash
pnpm vitest run tests/a11y/contrast.spec.ts
pnpm playwright test tests/accessibility/themes.spec.ts
```

light/dark/forced-colors.

### Gate 6 — 폼·오류

```bash
pnpm playwright test tests/accessibility/forms.spec.ts
```

### Gate 7 — 복합 위젯

```bash
pnpm playwright test tests/accessibility/widgets.spec.ts
```

Dialog, Menu, Tabs, Combobox, Disclosure.

### Gate 8 — 모바일 타깃·확대

```bash
pnpm playwright test tests/accessibility/mobile.spec.ts
```

### Gate 9 — Storybook

```bash
pnpm test-storybook
```

### Gate 10 — 스크린리더

```text
PASS     최소 시나리오 수행·기록
BLOCKED  환경 없음 — 자동/키보드만으로 최종 PASS 선언 금지
FAIL     시나리오 중 과업 실패
```

### Gate 11 — 최종

```text
PASS     Gate 1~9 통과 + Gate 10 PASS 또는 명시적 BLOCKED with residual risk
FAIL     A/AA 위반으로 P0 저해
BLOCKED  도구/환경 제한 — 실행분 분리 보고
```

---

## 24. Final Report

### 24.1 리포트 형식

````markdown
# Accessibility QA Report

**대상:** `<app>@<commit>`
**표준:** WCAG 2.2 AA
**일시:** YYYY-MM-DD
**도구:** axe-core · Playwright keyboard · NVDA+Chrome (또는 BLOCKED)

## 1. 결론

**최종 판정: FAIL**

P0 결제 모달이 Esc로 닫히지 않고 포커스가 배경으로 유출된다 (2.1.2 / 2.4.3).
axe는 로그인·카탈로그에서 0 violations이나, 자동 검사만으로는 발견되지 않았다.

## 2. Gate 결과

| Gate | 판정 | 메모 |
|------|------|------|
| Static lint | PASS | |
| axe P0 | PASS | 0 violations |
| Keyboard tasks | FAIL | 결제 모달 트랩/Esc |
| Names/Labels | WARN | 아이콘 버튼 2개 |
| Contrast/Theme | PASS | |
| Forms | PASS | |
| Widgets | FAIL | Dialog |
| Mobile/Zoom | PASS | |
| Storybook | PASS | |
| Screen reader | BLOCKED | mac 없음 · NVDA만 부분 |

## 3. Finding

### A11Y-F001 — 결제 확인 다이얼로그 포커스 유출 · S1

**SC:** 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 4.1.2 Name Role Value

**재현**
1. `/checkout`에서 “결제” 활성화
2. Tab을 반복하면 배경 링크에 포커스가 이동
3. Esc가 동작하지 않음

**관찰**
커스텀 모달이 `role="dialog"`만 있고 focus trap/`inert`가 없다.

**증거**
- `tmp/qa/a11y/2026-07-30/A11Y-F001-trace.zip`
- 스크린샷/키보드 로그

**영향**
키보드·SR 사용자가 결제 확인을 완료하거나 취소하기 어렵다.

**개선 원칙**
검증된 Dialog primitive로 교체하거나 APG 모달 패턴을 구현한다. 열기 시 포커스 이동, 닫기 시 트리거 복귀, Esc, `aria-modal`, 배경 `inert`.

**Regression:** `tests/accessibility/widgets.spec.ts`

### A11Y-F002 — 헤더 아이콘 버튼 이름 없음 · S1

**SC:** 4.1.2 / 2.4.4

(동일 형식)

## 4. 통과·강점

- 로그인 폼 label/`aria-invalid` 연결이 견고하다
- 스킵 링크와 `main` landmark가 존재한다
- 다크 모드 본문 대비 토큰 테스트가 있다

## 5. 잔여 위험

- VoiceOver/Safari 미검증 (BLOCKED)
- 차트 페이지 데이터 테이블 대안은 다음 스프린트

## 6. 우선순위

1. A11Y-F001 Dialog (배포 전)
2. A11Y-F002 아이콘 이름
3. SR 시나리오 보강

## 7. 재현

```bash
pnpm --filter web build && pnpm --filter web start
A11Y_BASE_URL=http://127.0.0.1:3000 pnpm playwright test --project=accessibility
```
````

### 24.2 Finding 필수 필드

```text
ID / Severity
WCAG SC
재현 절차 (입력 장치 명시)
관찰
증거
영향 사용자·과업
개선 원칙
Regression 테스트
```

“axe에 안 잡힘”도 관찰의 일부로 남겨 자동 검사의 공백을 문서화한다.

### 24.3 보고 원칙

- 결론과 배포 가능 여부를 먼저 쓴다.
- 자동 PASS를 최종 PASS로 포장하지 않는다.
- BLOCKED 환경은 잔여 위험으로 명시한다.
- 디자인 시스템 원인이면 소비자 수정이 아니라 primitive 수정을 권고한다.
- 리포트는 채팅으로 전달하고 `tmp/qa/a11y/` 증거는 커밋하지 않는다.

---

## 부록 A — 감사 스크립트

### A.1 빠른 정적 스캔

```bash
#!/usr/bin/env bash
set -uo pipefail

echo "=== A11Y 1. images missing alt ==="
rg -n "<img |<Image" app frontend/src --glob "*.tsx" | rg -v "alt=" || true

echo "=== A11Y 2. outline removed ==="
rg -n "outline-none|outline:\\s*none" app frontend/src --glob "*.{tsx,css}" || true

echo "=== A11Y 3. positive tabindex ==="
rg -n "tabIndex=\{?[1-9]|tabindex=\"[1-9]" app frontend/src --glob "*.tsx" || true

echo "=== A11Y 4. div/span click handlers ==="
rg -n "<(div|span)[^>]*onClick" app frontend/src --glob "*.tsx" || true

echo "=== A11Y 5. zoom blocked ==="
rg -n "user-scalable=no|maximum-scale=1" app frontend public || true

echo "=== A11Y 6. autofocus ==="
rg -n "autoFocus|autofocus" app frontend/src --glob "*.tsx" || true

echo "=== A11Y 7. aria-hidden usage ==="
rg -n "aria-hidden" app frontend/src --glob "*.tsx" | head

echo "=== A11Y 8. role=button ==="
rg -n "role=\"button\"" app frontend/src --glob "*.tsx" || true
```

### A.2 axe + 키보드 스모크

```ts
// tests/accessibility/smoke.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('p0 smoke a11y', async ({ page }) => {
  await page.goto('/');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);

  await page.keyboard.press('Tab');
  const tag = await page.evaluate(() => document.activeElement?.tagName);
  expect(tag).toBeTruthy();

  const unnamedButtons = await page.getByRole('button').evaluateAll(async els => {
    // simplified: empty text and no aria-label
    return els
      .filter(el => !(el.getAttribute('aria-label') || el.textContent)?.trim())
      .map(el => el.outerHTML.slice(0, 100));
  });
  expect(unnamedButtons).toEqual([]);
});
```

### A.3 대비 토큰 테스트 스케치

```ts
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// 프로젝트 토큰 resolve 유틸에 맞게 교체
import { contrast } from 'colorjs.io';

const pairs = [
  ['--color-text-default', '--color-surface-default', 4.5],
  ['--color-text-muted', '--color-surface-default', 4.5],
  ['--color-on-action-primary', '--color-action-primary', 4.5],
];

test.each(pairs)('%s on %s', (fg, bg, min) => {
  const ratio = contrast(resolveCssColor(fg), resolveCssColor(bg), 'WCAG21');
  expect(Math.abs(ratio)).toBeGreaterThanOrEqual(min);
});
```

### A.4 CI

```yaml
name: accessibility

on:
  pull_request:
    paths:
      - "app/**"
      - "frontend/**"
      - "packages/ui/**"
      - "tests/accessibility/**"

jobs:
  a11y:
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
      - run: pnpm --filter web start &
      - run: npx wait-on http://127.0.0.1:3000
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm playwright test --project=accessibility
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: a11y-evidence
          path: |
            test-results/
            playwright-report/
            tmp/qa/a11y/
```

---

## 부록 B — Agent 체크리스트

### B.1 시작

```text
[ ] WCAG 2.2 AA와 P0 과업/라우트를 Binding에 적었다.
[ ] 프로덕션 빌드로 서버를 띄웠다.
[ ] SR 환경 가능 여부를 선언했다.
[ ] QA-only vs QA+수정을 구분했다.
```

### B.2 자동

```text
[ ] axe를 P0와 주요 상태에 실행했다.
[ ] jsx-a11y/lint를 확인했다.
[ ] Storybook a11y가 있으면 실행했다.
[ ] 예외는 ID·만료일과 함께만 허용했다.
```

### B.3 키보드·포커스

```text
[ ] P0 과업을 키보드로 완수했다.
[ ] 트랩·Esc·복귀를 확인했다.
[ ] 포커스 표시가 보인다.
[ ] sticky UI에 포커스가 가리지 않는다.
[ ] tabindex>0이 없다.
```

### B.4 이름·폼·상태

```text
[ ] 아이콘 버튼에 이름이 있다.
[ ] 입력에 label이 있다.
[ ] 오류가 aria-describedby/alert로 연결된다.
[ ] expanded/selected/current/invalid이 노출된다.
```

### B.5 감각·미디어

```text
[ ] 본문·UI 대비를 확인했다.
[ ] 색만 의존 상태를 제거/표시했다.
[ ] 이미지 alt 정책을 확인했다.
[ ] reduced-motion·확대·forced-colors를 점검했다.
```

### B.6 위젯·SR

```text
[ ] Dialog/Menu/Tabs/Combobox 계약을 확인했다.
[ ] 라이브 리전이 남용되지 않는다.
[ ] SR 시나리오를 수행했거나 BLOCKED로 남겼다.
```

### B.7 최종

```text
[ ] Gate 1~11을 판정했다.
[ ] Finding에 SC·재현·증거가 있다.
[ ] 자동 PASS를 최종 PASS로 쓰지 않았다.
[ ] 리포트를 먼저 전달했다.
[ ] 승인 없이 코드를 수정하지 않았다.
```

### B.8 금지 사항

```text
✗ div onClick으로 버튼을 대체하지 않는다.
✗ outline을 전역 제거하지 않는다.
✗ placeholder를 label로 쓰지 않는다.
✗ aria-label로 보이는 이름을 모순되게 덮지 않는다.
✗ axe 0 = 완료라고 쓰지 않는다.
✗ SR 미실행을 숨기지 않는다.
✗ 드래그 전용 과업을 남기지 않는다.
✗ user-scalable=no를 넣지 않는다.
✗ 예외 baseline을 조용히 늘리지 않는다.
✗ QA 보고 전 애플리케이션 코드를 수정하지 않는다.
```

---

## 스위트 완료 안내

이 문서로 **Cursor QA Master Suite** 9권이 완성된다.

| # | 문서 | 초점 |
|---|------|------|
| 01 | Core QA | App Router·React·보안·SEO 기초 |
| 02 | Mobile QA | 뷰포트·터치·Safe Area·모바일 특유 |
| 03 | Desktop QA | 스케일·줌·포인터·고밀도 레이아웃 |
| 04 | Visual QA | 결정론·스냅샷·토큰 시각 회귀 |
| 05 | Playwright QA | E2E 신뢰성·픽스처·CI |
| 06 | UX Audit | 과업·휴리스틱·근거 기반 사용성 |
| 07 | Design System QA | 토큰·컴포넌트 계약·거버넌스 |
| 08 | Performance QA | CWV·번들·렌더·예산 |
| 09 | Accessibility QA | WCAG 2.2 AA·키보드·SR |

각 문서는 독립 실행 가능하며, 교차 참조는 경계를 나눌 때만 사용한다. 리포트는 채팅에 남기고 저장소에 QA 리포트 파일을 만들지 않는다.




