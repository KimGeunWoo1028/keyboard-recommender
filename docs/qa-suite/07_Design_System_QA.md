# 07_Design_System_QA.md — Cursor QA Master Suite · Design System Playbook

> **문서 등급:** ★★★★★ · 토큰부터 배포까지 검증하는 디자인 시스템 QA 실행 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind CSS · Storybook · Playwright
> **검사 대상:** 디자인 토큰 · 테마 · 컴포넌트 API · 상태 · 합성 · 문서 · 배포 · 채택률
> **핵심 전제:** 디자인 시스템은 UI 모음이 아니라 **제품과 구현 사이의 버전된 계약**이다.
> **독립성:** 이 문서는 `01_Core_QA.md` 없이 단독 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 수행하는 명령형 플레이북.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding](#3-project-binding)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [시스템 인벤토리와 기준선](#5-시스템-인벤토리와-기준선)
6. [토큰 아키텍처](#6-토큰-아키텍처)
7. [색상 토큰](#7-색상-토큰)
8. [타이포그래피 토큰](#8-타이포그래피-토큰)
9. [간격과 레이아웃 토큰](#9-간격과-레이아웃-토큰)
10. [Radius · Border · Shadow · Elevation](#10-radius--border--shadow--elevation)
11. [Motion 토큰](#11-motion-토큰)
12. [테마와 모드](#12-테마와-모드)
13. [컴포넌트 API](#13-컴포넌트-api)
14. [상태 매트릭스](#14-상태-매트릭스)
15. [합성과 레이아웃](#15-합성과-레이아웃)
16. [폼 컴포넌트](#16-폼-컴포넌트)
17. [Overlay와 Layer](#17-overlay와-layer)
18. [Icon · Illustration · Asset](#18-icon--illustration--asset)
19. [Responsive와 국제화 내성](#19-responsive와-국제화-내성)
20. [접근성 계약](#20-접근성-계약)
21. [문서화와 발견 가능성](#21-문서화와-발견-가능성)
22. [버전 · 변경 · 마이그레이션](#22-버전--변경--마이그레이션)
23. [거버넌스와 채택률](#23-거버넌스와-채택률)
24. [자동화와 Playwright](#24-자동화와-playwright)
25. [Regression 절차](#25-regression-절차)
26. [Final Report](#26-final-report)
27. [부록 A — 정적 감사 스크립트](#부록-a--정적-감사-스크립트)
28. [부록 B — Agent 체크리스트](#부록-b--agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

디자인 시스템 QA의 목적은 “스토리가 예쁘게 보이는가”가 아니다. 시스템이 제품 전체에서 같은 의도를 같은 방식으로 표현하고, 우회 구현을 줄이며, 변경을 안전하게 전파하는지를 검증하는 것이다.

컴포넌트 하나가 정상이어도 다음 중 하나가 발생하면 시스템은 실패한다.

```text
- 제품 코드가 토큰 대신 원시 값을 반복한다.
- 같은 이름의 컴포넌트가 서로 다른 API와 동작을 가진다.
- 라이트 모드만 정의되고 다크·고대비 모드에서 의미가 무너진다.
- 새 variant가 추가되었지만 loading/error/focus 상태가 빠진다.
- breaking change가 공지 없이 배포되어 소비 앱이 조용히 깨진다.
- 문서가 낡아 개발자가 시스템을 우회한다.
```

### 1.1 동시에 수행할 역할

- **Design System Architect:** primitive·semantic·component 토큰 계층과 의존 방향을 검증한다.
- **Frontend Platform Engineer:** 컴포넌트 API, 타입, 패키지 경계, tree-shaking을 검증한다.
- **Visual QA Engineer:** 상태·테마·뷰포트 매트릭스와 시각 회귀를 운영한다.
- **Accessibility Engineer:** 접근성을 선택 옵션이 아니라 컴포넌트 계약으로 고정한다.
- **Developer Experience Auditor:** 발견·학습·도입·마이그레이션 비용을 측정한다.
- **Governance Owner:** 기여, 리뷰, 폐기, 버전 정책과 채택률을 점검한다.

### 1.2 완료 조건

```text
[ ] 토큰 소스와 생성 산출물, Tailwind 매핑, CSS 변수의 단일 흐름을 그렸다.
[ ] 원시 색상·간격·radius·shadow 누출을 수치화했다.
[ ] primitive → semantic → component 토큰 의존 방향을 확인했다.
[ ] 라이트·다크·고대비·reduced-motion 테마 계약을 검증했다.
[ ] P0 컴포넌트의 variant × size × state 매트릭스를 캡처했다.
[ ] loading·empty·error·disabled·focus-visible 상태 누락을 찾았다.
[ ] 컴포넌트 API의 타입 안전성, ref, polymorphism, controlled/uncontrolled 계약을 확인했다.
[ ] 중복·로컬 복제·우회 구현을 인벤토리화했다.
[ ] Storybook 문서와 실제 API의 drift를 검사했다.
[ ] breaking change와 deprecation 경로를 확인했다.
[ ] 소비 앱의 채택률과 예외 목록을 수치화했다.
[ ] 정적 검사, 단위 테스트, 접근성, 시각 회귀 게이트를 실행했다.
[ ] Finding을 보고하고 승인 전 애플리케이션 코드를 수정하지 않았다.
```

---

## 2. 절대 원칙

충돌할 때 번호가 작은 원칙이 우선한다.

### DS-P1. 의미가 값보다 우선이다

`blue-600`은 값이고 `action-primary`는 의미다. 제품 코드는 값이 아니라 의미를 참조해야 한다. 브랜드 색상이 바뀌어도 “주 행동”이라는 의미는 유지된다.

### DS-P2. 토큰에는 단일 소유자가 있다

JSON, Tailwind config, CSS 변수, TypeScript 상수가 서로 독립적으로 같은 값을 소유하면 drift가 발생한다. 하나를 source of truth로 정하고 나머지는 생성하거나 참조한다.

### DS-P3. 접근성은 기본 계약이다

키보드, 이름, 역할, 상태, focus-visible, 대비, reduced motion은 variant가 아니다. 소비자가 별도로 켜지 않아도 동작해야 한다.

### DS-P4. 상태가 없는 컴포넌트는 미완성이다

default 스크린샷만 통과한 컴포넌트는 완료가 아니다. hover, focus-visible, active, disabled, loading, invalid, selected, read-only 상태를 명시한다.

### DS-P5. API는 외형보다 오래 산다

패딩은 쉽게 바꾸지만 prop 이름과 상태 모델은 수백 개 소비 지점에 퍼진다. 시각 변경보다 API 변경을 더 엄격하게 심사한다.

### DS-P6. 우회가 반복되면 소비자가 아니라 시스템이 문제다

같은 예외가 세 번 생기면 새 토큰이나 variant가 필요한 신호다. `className` 탈출구를 막기 전에 왜 우회했는지 조사한다.

### DS-P7. 파생 값은 생성한다

색상 스케일, 타입 스케일, CSS 변수 타입, 문서 표는 사람이 여러 곳에 복사하지 않는다. 생성하고 생성물에 “직접 수정 금지”를 표시한다.

### DS-P8. 시각 동일성과 의미 동일성을 구분한다

같은 회색이라도 `text-muted`, `border-subtle`, `surface-disabled`는 다른 의미다. 현재 값이 같다는 이유로 하나의 토큰으로 합치지 않는다.

### DS-P9. 컴포넌트는 컨테이너를 가정하지 않는다

재사용 컴포넌트가 페이지 폭, 배경, 부모 flex 방향을 암묵적으로 가정하면 합성에서 깨진다. 외부 레이아웃은 슬롯과 wrapper가 소유한다.

### DS-P10. 변경에는 소비자 경로가 있다

breaking change에는 deprecation, codemod 또는 명시적 마이그레이션 문서가 필요하다. “릴리스 노트를 읽으세요”만으로는 부족하다.

### DS-P11. 예외는 만료된다

원시 값과 로컬 컴포넌트 예외에는 owner, reason, expiry가 있어야 한다. 영구 allowlist는 기술 부채를 숨기는 파일이다.

### DS-P12. 보고 후 수정한다

먼저 PASS/FAIL/BLOCKED와 증거를 보고한다. 사용자가 QA와 수정을 함께 요청하지 않았다면 시스템·제품 코드를 변경하지 않는다.

---

## 3. Project Binding

감사 전에 실제 저장소 구조를 아래 블록에 바인딩한다. 추정값을 명령에 하드코딩하지 않는다.

```yaml
design_system_binding:
  workspace_root: "."
  package_manager: "pnpm"       # npm | yarn | pnpm
  app_paths:
    - "apps/web"
  design_system:
    package: "@acme/ui"
    source: "packages/ui/src"
    entry: "packages/ui/src/index.ts"
    styles: "packages/ui/src/styles"
    stories: "packages/ui/src/**/*.stories.tsx"
  tokens:
    source: "packages/tokens/tokens.json"
    generated_css: "packages/ui/src/styles/tokens.css"
    generated_ts: "packages/tokens/dist/index.d.ts"
    generator_command: "pnpm tokens:build"
  tailwind:
    config: "apps/web/tailwind.config.ts"
    global_css: "apps/web/app/globals.css"
  storybook:
    config: ".storybook"
    build_command: "pnpm storybook:build"
    test_command: "pnpm test-storybook"
  tests:
    unit: "pnpm test"
    typecheck: "pnpm typecheck"
    lint: "pnpm lint"
    visual: "pnpm playwright test --project=design-system"
  themes:
    selector: "[data-theme]"
    values: ["light", "dark", "high-contrast"]
  consumer_scan:
    include: ["apps/web/**/*.{ts,tsx,css}"]
    exclude: ["**/*.stories.tsx", "**/*.test.tsx", "**/generated/**"]
  p0_components:
    - Button
    - Input
    - Select
    - Dialog
    - Toast
    - Table
  freeze_list: []
```

### 3.1 Binding 자동 탐색

```bash
# 패키지와 Storybook
rg -n '"(@storybook|storybook|tailwindcss|class-variance-authority|tailwind-merge)"' \
  package.json packages/*/package.json apps/*/package.json

# 토큰 후보
rg -l --glob '*.{css,json,ts}' \
  '(--color-|--space-|--radius-|--shadow-|designTokens|semanticTokens)' .

# UI barrel과 컴포넌트
rg -l 'export \* from|export \{' packages src/components --glob 'index.ts'
rg -l 'forwardRef|cva\(|VariantProps' packages src/components --glob '*.tsx'

# 테마 진입점
rg -n 'ThemeProvider|data-theme|className=.*dark|prefers-color-scheme' \
  apps packages src --glob '*.{ts,tsx,css}'
```

명령 결과가 여러 후보를 보이면 임의로 하나를 선택하지 않는다. import graph와 package exports를 확인해 실제 소비 경로를 결정한다.

### 3.2 Freeze List

브랜드 자산, 승인된 로고, 외부 공급자 코드, 생성 파일은 수정 금지일 수 있다. Freeze List의 항목은 검사하되 수정하지 않는다.

```markdown
| 경로 | 이유 | 검사 | 수정 |
|------|------|------|------|
| `public/brand/*` | 승인된 브랜드 원본 | 가능 | 금지 |
| `src/generated/tokens.css` | 생성 산출물 | drift 검사 | 직접 수정 금지 |
| `vendor/*` | 외부 코드 | 소비 영향만 | 금지 |
```

---

## 4. 실행 파이프라인과 Severity

```text
1. BIND
   실제 경로·명령·테마·P0 컴포넌트를 바인딩한다.

2. INVENTORY
   토큰, 컴포넌트, 로컬 복제, 원시 값, 문서, 소비 지점을 수집한다.

3. SOURCE-OF-TRUTH
   어떤 파일이 원본이고 무엇이 생성물인지 의존 그래프로 확인한다.

4. STATIC CONTRACT
   타입·exports·토큰 참조·금지 패턴·API drift를 검사한다.

5. MATRIX
   P0 컴포넌트의 variant × size × state × theme 매트릭스를 만든다.

6. RUNTIME
   ref·focus·keyboard·portal·controlled state·hydration을 검증한다.

7. VISUAL
   결정론을 확보한 뒤 컴포넌트 단위 시각 회귀를 수행한다.

8. CONSUMER
   실제 제품에서 채택률, 우회, 중복, 레이아웃 내성을 검사한다.

9. GOVERNANCE
   문서 drift, deprecation, changelog, migration, owner를 검사한다.

10. REPORT
   먼저 보고하고 승인된 범위만 수정한다.
```

### 4.1 Severity

| 등급 | 디자인 시스템 기준 |
|------|----------------------|
| **S0 Blocker** | 패키지 배포가 소비 앱을 빌드 불가로 만든다. 주요 테마에서 전역 UI가 판독 불가다. |
| **S1 Critical** | P0 컴포넌트의 핵심 동작·접근성·상태 계약이 깨진다. 데이터 입력이나 결제에 영향을 준다. |
| **S2 Major** | 다수 소비 지점에 불일치·우회·시각 회귀가 생긴다. migration 없이 breaking API가 예정된다. |
| **S3 Minor** | 제한된 variant, 문서, 비핵심 토큰의 불일치다. 명확한 우회가 있다. |
| **S4 Nit** | 기능 영향 없는 정렬·설명·예시의 미세 개선이다. |

**상향 규칙**

```text
- Button/Input/Dialog 등 P0 primitive에 발생: +1
- 모든 소비 앱에 전파되는 토큰 문제: +1
- 키보드·스크린리더 사용자가 기능을 수행할 수 없음: 최소 S1
- 결제·삭제·인증 화면에 영향: +1
- 문서와 구현이 달라 잘못된 API 사용을 유도: +1
```

---

## 5. 시스템 인벤토리와 기준선

### DS-INV-01 — 공개 컴포넌트 인벤토리

**WHY**

공개 표면을 모르면 무엇을 호환성 계약으로 취급해야 하는지 알 수 없다. 파일이 존재한다고 공개 API인 것도 아니고, barrel에서 export한다고 실제 소비되는 것도 아니다.

**DETECT**

```bash
# package exports와 barrel
node -e "const p=require('./packages/ui/package.json'); console.log(p.exports)"
rg -n '^export (type )?(\*|\{)' packages/ui/src --glob 'index.ts'

# 실제 소비 import
rg -o "from ['\"]@acme/ui(?:/[^'\"]*)?['\"]" apps --glob '*.{ts,tsx}' \
  | sort | uniq -c | sort -rn

# deep import — 공개 경계를 우회한다
rg -n "from ['\"]@acme/ui/src|from ['\"].*packages/ui/src" apps --glob '*.{ts,tsx}'
```

**PASS / FAIL**

- PASS: 모든 공개 export에 owner, status, story, test가 연결된다. deep import가 없다.
- FAIL: deep import로 내부 API 의존(S2), export되었지만 문서·테스트 없음(S2), 실제 미사용 공개 API 누적(S3).

**FIX**

```ts
// packages/ui/src/index.ts — 공개 표면을 의도적으로 좁힌다
export { Button, buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';

export { Dialog, DialogContent, DialogTrigger } from './components/dialog';
export type { DialogContentProps } from './components/dialog';

// 내부 구현은 export하지 않는다.
// export { useDialogMachine } from './internal/dialog-machine'; // 금지
```

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  }
}
```

**REGRESSION**

```ts
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

test('consumer does not deep-import UI internals', () => {
  const offenders = globSync('apps/**/*.{ts,tsx}').flatMap(file => {
    const source = readFileSync(file, 'utf8');
    return source.includes('@acme/ui/src/') ? [file] : [];
  });
  expect(offenders).toEqual([]);
});
```

---

### DS-INV-02 — 중복과 로컬 복제

**WHY**

디자인 시스템과 이름이 같은 `Button`, `Modal`, `Badge`가 앱 안에 따로 있으면 버그 수정과 접근성 개선이 한쪽에만 적용된다. 외형이 비슷하다고 동일한 컴포넌트는 아니므로 구조와 소비 목적을 함께 확인한다.

**DETECT**

```bash
# 이름 중복
rg -n 'export (default )?(function|const) (Button|Input|Modal|Dialog|Badge|Card|Select)' \
  apps packages src --glob '*.tsx'

# 시스템 import 없이 button을 반복 구현
rg -l '<button' apps --glob '*.tsx' \
  | while read f; do rg -q "from ['\"]@acme/ui['\"]" "$f" || echo "$f"; done

# 유사한 클래스 조합
rg -o 'className="[^"]*(rounded-md|inline-flex)[^"]*"' apps --glob '*.tsx' \
  | sort | uniq -c | sort -rn
```

**PASS / FAIL**

- PASS: 로컬 구현은 시스템이 의도적으로 제공하지 않는 도메인 컴포넌트뿐이다.
- FAIL: P0 primitive 복제(S2), 접근성 로직을 복제한 modal/select(S1), owner 없는 예외(S3).

**FIX**

복제를 무조건 치환하지 않는다. 차이를 먼저 분류한다.

```markdown
| 로컬 구현 | 차이 | 조치 |
|-----------|------|------|
| `CheckoutButton` | 결제 pending 문구만 다름 | 시스템 Button 합성 |
| `DangerButton` | destructive 색상 | 시스템 variant 추가 또는 기존 사용 |
| `CanvasToolbarButton` | 24px 초밀도, 토글 상태 | 별도 도메인 primitive 검토 |
| `LegacyModal` | focus trap 없음 | 즉시 Dialog로 이전 |
```

```tsx
// ❌ 시스템 Button을 복사
export function CheckoutButton(props: Props) {
  return <button className="rounded-md bg-blue-600 px-4 py-2 text-white" {...props} />;
}

// ✅ 도메인 의미만 합성
export function CheckoutButton({ pending, amount, ...props }: Props) {
  return (
    <Button loading={pending} {...props}>
      {pending ? '결제 처리 중…' : `${formatCurrency(amount)} 결제`}
    </Button>
  );
}
```

---

### DS-INV-03 — 채택률 기준선

**WHY**

좋은 시스템도 제품에서 쓰이지 않으면 가치가 없다. “컴포넌트 수”보다 “적용 가능한 소비 지점 중 시스템을 쓰는 비율”이 중요하다.

**DETECT**

```ts
// scripts/audit-design-system-adoption.ts
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const files = globSync('apps/web/**/*.{tsx,ts}', {
  ignore: ['**/*.test.*', '**/*.stories.*', '**/node_modules/**'],
});

const metrics = {
  nativeButtons: 0,
  systemButtons: 0,
  nativeInputs: 0,
  systemInputs: 0,
  rawDialogs: 0,
};

for (const file of files) {
  const s = readFileSync(file, 'utf8');
  metrics.nativeButtons += (s.match(/<button\b/g) ?? []).length;
  metrics.systemButtons += (s.match(/<Button\b/g) ?? []).length;
  metrics.nativeInputs += (s.match(/<input\b/g) ?? []).length;
  metrics.systemInputs += (s.match(/<Input\b/g) ?? []).length;
  metrics.rawDialogs += (s.match(/role=["']dialog["']/g) ?? []).length;
}

const buttonAdoption =
  metrics.systemButtons / Math.max(1, metrics.systemButtons + metrics.nativeButtons);
const inputAdoption =
  metrics.systemInputs / Math.max(1, metrics.systemInputs + metrics.nativeInputs);

console.log(JSON.stringify({ metrics, buttonAdoption, inputAdoption }, null, 2));
```

**판정**

```text
90% 이상   — PASS. 예외만 검토한다.
70~89%     — WARN. 신규 코드 우회 차단과 상위 반복 패턴 이전이 필요하다.
70% 미만   — FAIL(S2). 시스템을 채택하기 어렵게 만드는 원인을 조사한다.
```

분모에 캔버스, 지도, headless editor처럼 네이티브 요소가 정당한 영역을 무조건 넣지 않는다. 예외는 owner와 reason이 있는 manifest로 관리한다.

```json
{
  "exceptions": [
    {
      "path": "apps/web/features/canvas/**",
      "primitive": "button",
      "reason": "pointer-event optimized canvas controls",
      "owner": "editor-platform",
      "expires": "2026-12-31"
    }
  ]
}
```

---

## 6. 토큰 아키텍처

### DS-TOK-01 — 계층 분리

**WHY**

primitive 토큰은 팔레트와 수치이고, semantic 토큰은 의도이며, component 토큰은 특정 부품의 계약이다. 제품 코드가 primitive를 직접 쓰면 브랜드 변경과 테마 전환의 영향이 소비자 전체로 퍼진다.

```text
Primitive          Semantic                 Component
blue.600      →     action.primary      →    button.primary.background
gray.900      →     text.default        →    input.value.foreground
space.3       →     control.paddingY    →    button.md.paddingY
```

**DETECT**

```bash
# 소비 앱의 primitive 직접 사용
rg -n '(bg|text|border)-(slate|gray|zinc|red|blue|green|amber)-[0-9]{2,3}' \
  apps --glob '*.{ts,tsx}'

# CSS 변수 primitive 직접 사용
rg -n 'var\(--(blue|gray|red|space-[0-9]|radius-[0-9])' apps --glob '*.{css,tsx}'

# semantic이 primitive를 참조하는지 확인
rg -n -- '--(color|surface|text|border)-[^:]+:\s*(#[0-9a-f]|rgb|hsl\()' \
  packages/ui/src/styles --glob '*.css'
```

**PASS / FAIL**

- PASS: 제품은 semantic 또는 component 토큰만 참조한다. primitive는 토큰 패키지 내부에 갇힌다.
- FAIL: 제품에서 primitive 직접 사용이 반복(S2), semantic 토큰이 원시 값 직접 소유(S2), 계층 순환(S1).

**FIX**

```css
/* tokens/primitives.css — 값 */
:root {
  --palette-indigo-600: 79 70 229;
  --palette-slate-950: 2 6 23;
  --palette-white: 255 255 255;
}

/* tokens/semantic.css — 의미 */
:root {
  --color-action-primary: var(--palette-indigo-600);
  --color-on-action-primary: var(--palette-white);
  --color-text-default: var(--palette-slate-950);
}

/* tokens/components.css — 필요한 경우에만 컴포넌트 계약 */
:root {
  --button-primary-bg: var(--color-action-primary);
  --button-primary-fg: var(--color-on-action-primary);
}
```

```tsx
// ❌ 제품이 팔레트 결정을 소유
<Button className="bg-indigo-600 text-white hover:bg-indigo-700" />

// ✅ 의미 기반 variant
<Button variant="primary" />
```

component token을 모든 속성에 만들지 않는다. semantic 토큰으로 충분하면 직접 참조한다. component token은 한 컴포넌트가 semantic 값을 조합·재정의해야 할 때만 추가한다.

**REGRESSION**

```bash
if rg -n '(bg|text|border)-(slate|gray|zinc|red|blue|green|amber)-[0-9]{2,3}' \
  apps --glob '*.{ts,tsx}' -g '!**/*.stories.tsx'; then
  echo "FAIL: primitive palette leaked into product code"
  exit 1
fi
```

---

### DS-TOK-02 — 단일 Source of Truth와 생성 drift

**WHY**

토큰 JSON과 CSS를 모두 손으로 편집하면 값은 반드시 달라진다. 생성물이 오래되면 로컬에서는 맞고 배포 패키지에서는 틀리는 종류의 결함이 생긴다.

**DETECT**

```bash
# 생성 전후 diff가 생기면 저장소 산출물이 stale
git diff --exit-code
pnpm tokens:build
git diff --exit-code -- packages/tokens/dist packages/ui/src/styles/tokens.css

# 생성물 직접 수정 흔적
git log -p -- packages/ui/src/styles/tokens.css | rg '^\+.*--' -n
```

**PASS / FAIL**

- PASS: generator 실행 후 diff 0. 원본과 생성물이 명시된다.
- FAIL: 생성 drift(S1 — 배포 영향), 여러 원본이 동일 토큰 소유(S2), 생성물 수동 수정(S2).

**FIX**

```json
{
  "$schema": "https://json.schemastore.org/design-tokens.json",
  "color": {
    "primitive": {
      "indigo": {
        "600": { "$type": "color", "$value": "#4f46e5" }
      }
    },
    "semantic": {
      "action": {
        "primary": {
          "$type": "color",
          "$value": "{color.primitive.indigo.600}"
        }
      }
    }
  }
}
```

```css
/*
 * GENERATED FILE — DO NOT EDIT.
 * Source: packages/tokens/tokens.json
 * Command: pnpm tokens:build
 */
:root {
  --color-action-primary: 79 70 229;
}
```

```yaml
# CI
- name: Verify generated design tokens
  run: |
    pnpm tokens:build
    git diff --exit-code -- packages/tokens/dist packages/ui/src/styles/tokens.css
```

---

### DS-TOK-03 — 이름 규칙과 alias 깊이

**WHY**

`primary2`, `newGray`, `cardBgFinal` 같은 이름은 의도를 설명하지 못하고 시간이 지나면 더 이상 정리할 수 없다. 반대로 alias가 5단계를 넘으면 실제 값과 영향 범위를 추적하기 어렵다.

**DETECT**

```bash
# 의심스러운 이름
rg -n -- '--[^:]*(new|old|final|temp|test|v2|[0-9]+)[^:]*:' packages/tokens packages/ui

# 값이 같은 토큰 후보
node scripts/report-duplicate-token-values.mjs

# alias graph와 최대 깊이
node scripts/audit-token-alias-depth.mjs
```

**PASS / FAIL**

- PASS: 이름이 `category.role.state` 의미를 가진다. alias 깊이 3 이하. 순환 참조가 없다.
- FAIL: 순환 참조(S0), alias 깊이 5 이상(S2), 임시·버전 이름(S2).

**FIX**

```text
❌ --blue-main
❌ --primary2
❌ --card-bg-new
❌ --gray-for-disabled-button

✅ --color-action-primary
✅ --color-action-primary-hover
✅ --color-surface-raised
✅ --color-text-disabled
```

상태는 suffix로 일관되게 둔다.

```text
--color-action-primary
--color-action-primary-hover
--color-action-primary-active
--color-action-primary-disabled
```

상태 토큰이 실제로 별도 값이 필요하지 않으면 억지로 만들지 않는다. opacity나 overlay 규칙으로 일관되게 파생할 수 있다면 규칙을 문서화한다.

---

### DS-TOK-04 — 타입 안전성과 자동완성

**WHY**

문자열로 아무 토큰 이름이나 받을 수 있으면 오타가 런타임까지 살아남는다. TypeScript 타입과 IDE 자동완성이 시스템 채택 비용을 낮춘다.

**DETECT**

```bash
rg -n 'token:\s*string|color:\s*string|space:\s*string' packages/ui/src --glob '*.{ts,tsx}'
rg -n 'as any|as string' packages/tokens packages/ui/src --glob '*.{ts,tsx}'
```

**FIX**

```ts
// 생성된 타입
export const tokens = {
  color: {
    text: {
      default: 'var(--color-text-default)',
      muted: 'var(--color-text-muted)',
      danger: 'var(--color-text-danger)',
    },
  },
  space: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
  },
} as const;

export type TextColorToken = keyof typeof tokens.color.text;
export type SpaceToken = keyof typeof tokens.space;
```

```tsx
type TextProps = {
  tone?: TextColorToken;
};

const toneClass = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  danger: 'text-destructive',
} satisfies Record<TextColorToken, string>;
```

**REGRESSION**

```ts
import { expectTypeOf, test } from 'vitest';
import type { TextColorToken } from '@acme/tokens';

test('token names remain a closed union', () => {
  expectTypeOf<TextColorToken>().toEqualTypeOf<'default' | 'muted' | 'danger'>();
});
```

---

## 7. 색상 토큰

### DS-COLOR-01 — Semantic coverage

**WHY**

팔레트가 많아도 제품의 의미를 충분히 표현하지 못하면 개발자는 원시 색상을 쓴다. text, surface, border, action, status, focus, overlay 역할을 모두 점검한다.

**DETECT**

```bash
# semantic 역할 목록
rg -o -- '--color-[a-z0-9-]+(?=:)' packages/ui/src/styles --glob '*.css' \
  | sort -u

# Tailwind arbitrary color와 hex
rg -n '(#[0-9a-fA-F]{3,8}\b|(?:bg|text|border)-\[[^\]]*(#|rgb|hsl))' \
  apps packages/ui/src --glob '*.{ts,tsx,css}'

# opacity로 색상 의미를 임의 생성
rg -n '(text|bg|border)-[a-z-]+/[0-9]+' apps --glob '*.{tsx,ts}'
```

필수 역할의 최소 집합:

```text
text.default / muted / subtle / inverse / disabled / link / danger
surface.canvas / default / raised / sunken / overlay / selected / disabled
border.default / subtle / strong / focus / danger
action.primary / secondary / ghost / danger (+ hover / active / disabled)
status.info / success / warning / danger (+ container / foreground)
```

**PASS / FAIL**

- PASS: 제품의 반복 의미를 semantic 토큰으로 표현한다. raw color 예외가 0 또는 승인 목록뿐이다.
- FAIL: 동일 의미를 여러 원시 색상으로 표현(S2), 상태가 색상만으로 구분(S1), arbitrary color 누적(S2).

**FIX**

```css
:root {
  --color-text-default: 15 23 42;
  --color-text-muted: 71 85 105;
  --color-surface-canvas: 248 250 252;
  --color-surface-default: 255 255 255;
  --color-border-default: 203 213 225;

  --color-status-danger: 185 28 28;
  --color-status-danger-container: 254 226 226;
  --color-on-status-danger-container: 127 29 29;
}
```

상태 토큰은 foreground와 container를 쌍으로 정의한다. 배경만 바꾸고 텍스트 대비를 소비자에게 맡기지 않는다.

---

### DS-COLOR-02 — 대비를 토큰 쌍으로 검증

**WHY**

개별 색상은 접근 가능하거나 불가능하지 않다. foreground/background **쌍**이 대비를 만든다. 팔레트 테스트만 하면 실제 조합의 실패를 놓친다.

**DETECT**

```ts
// tests/design-system/color-pairs.test.ts
import { wcagContrast } from 'culori';

const pairs = [
  ['text.default', 'surface.default', 4.5],
  ['text.muted', 'surface.default', 4.5],
  ['on.action.primary', 'action.primary', 4.5],
  ['on.status.danger.container', 'status.danger.container', 4.5],
  ['border.focus', 'surface.default', 3],
] as const;

for (const [fg, bg, minimum] of pairs) {
  test(`${fg} on ${bg} >= ${minimum}:1`, () => {
    const ratio = wcagContrast(resolveToken(fg), resolveToken(bg));
    expect(ratio, `${fg}/${bg}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
  });
}
```

**PASS / FAIL**

- PASS: 본문 텍스트 4.5:1, 큰 텍스트·UI 경계·focus indicator 3:1 이상이다.
- FAIL: P0 조합 대비 부족(S1), 비핵심 muted 조합 부족(S2).

**FIX 원칙**

1. 소비 컴포넌트에서 색을 덮지 말고 토큰을 수정한다.
2. foreground만 어둡게 할지 background를 바꿀지 모든 소비 쌍을 보고 결정한다.
3. disabled를 “안 보이게” 만들지 않는다. 비활성 여부는 대비 저하 외 신호도 사용한다.

```css
/* ❌ disabled를 거의 투명하게 */
.control:disabled { opacity: .25; }

/* ✅ 판독 가능성을 유지하고 상태를 커서·배경·아이콘으로 함께 표현 */
.control:disabled {
  color: rgb(var(--color-text-disabled));
  background: rgb(var(--color-surface-disabled));
  cursor: not-allowed;
}
```

---

### DS-COLOR-03 — 상태 색상의 비색상 신호

**WHY**

성공=초록, 오류=빨강만으로 표현하면 색각 이상·저채도 화면·강제 색상 모드에서 의미가 사라진다.

**DETECT**

```tsx
// ❌ 텍스트와 아이콘 없이 색 점만
<span className={status === 'error' ? 'bg-red-500' : 'bg-green-500'} />

// ✅ 아이콘 + 텍스트 + 색
<Status tone="danger" icon={CircleAlert}>동기화 실패</Status>
```

```ts
test('status components expose text', async ({ page }) => {
  await page.goto('/iframe.html?id=feedback-status--matrix');
  const statuses = page.locator('[data-status]');
  for (let i = 0; i < await statuses.count(); i++) {
    await expect(statuses.nth(i)).not.toHaveText('');
  }
});
```

**PASS / FAIL**

- PASS: 모든 상태에 text 또는 accessible name과 형태 신호가 있다.
- FAIL: 오류·성공을 색으로만 전달(S1).

---

### DS-COLOR-04 — 하드코딩 색상 예외 관리

브랜드 로고, 데이터 시각화 팔레트, 외부 서비스 브랜드는 semantic UI 토큰과 다른 규칙이 필요할 수 있다. “hex 금지”로 뭉뚱그리지 않는다.

```ts
// design-system-exceptions.ts
export const rawColorExceptions = [
  {
    glob: 'apps/web/features/integrations/brand-icons.tsx',
    reason: 'Third-party trademark colors',
    owner: 'integrations',
    expires: null,
  },
  {
    glob: 'apps/web/features/charts/palette.ts',
    reason: 'Categorical chart palette; contrast tested separately',
    owner: 'data-viz',
    expires: '2026-12-31',
  },
] as const;
```

차트 색상은 인접 색 구분, 명도 차이, 패턴·마커 대체를 별도로 검사한다. semantic UI 색상으로 억지로 통합하지 않는다.

---

## 8. 타이포그래피 토큰

### DS-TYPE-01 — 타입 스케일과 역할

**WHY**

`text-[17px]`, `font-[550]` 같은 임의 값이 늘면 계층과 리듬이 무너진다. 크기만이 아니라 size, line-height, weight, letter-spacing을 하나의 역할로 묶는다.

**DETECT**

```bash
rg -n 'text-\[[0-9.]+(px|rem)\]|leading-\[[^\]]+\]|tracking-\[[^\]]+\]|font-\[[0-9]+\]' \
  apps packages/ui/src --glob '*.{tsx,ts,css}'

rg -o 'text-(xs|sm|base|lg|xl|[2-9]xl)' apps --glob '*.tsx' \
  | sort | uniq -c
```

**FIX**

```css
:root {
  --font-size-body-sm: 0.875rem;
  --line-height-body-sm: 1.25rem;
  --font-weight-body-sm: 400;

  --font-size-heading-lg: 1.875rem;
  --line-height-heading-lg: 2.25rem;
  --font-weight-heading-lg: 650;
  --letter-spacing-heading-lg: -0.02em;
}
```

```tsx
const textVariants = cva('', {
  variants: {
    variant: {
      bodySm: 'text-sm/5 font-normal',
      bodyMd: 'text-base/6 font-normal',
      labelSm: 'text-sm/5 font-medium',
      headingLg: 'text-3xl/9 font-semibold tracking-tight',
      code: 'font-mono text-sm/5',
    },
  },
  defaultVariants: { variant: 'bodyMd' },
});
```

`Text` 컴포넌트를 모든 문장에 강제할 필요는 없다. 타입 역할 클래스 또는 토큰이 일관되게 쓰이면 충분하다. wrapper 과잉은 DOM과 API 비용을 만든다.

**PASS / FAIL**

- PASS: 제품 타이포의 95% 이상이 승인된 역할을 사용한다.
- FAIL: 임의 크기 반복(S2), heading 계층과 외형 역할 혼동(S2), 줄높이 누락으로 잘림(S1).

---

### DS-TYPE-02 — 폰트 로딩과 fallback 정합

**WHY**

fallback과 webfont의 metrics가 다르면 로딩 시 텍스트가 움직이고 버튼·탭 폭이 바뀐다. 토큰이 맞아도 실제 시스템은 불안정하다.

**DETECT**

```bash
rg -n 'next/font|font-display|@font-face|size-adjust|ascent-override' \
  apps packages --glob '*.{ts,tsx,css}'
```

```ts
test('font swap does not change control size materially', async ({ page }) => {
  await page.goto('/iframe.html?id=foundation-typography--matrix');
  const before = await page.locator('[data-measure]').evaluateAll(els =>
    els.map(el => el.getBoundingClientRect().width));

  await page.evaluate(() => document.fonts.ready);
  const after = await page.locator('[data-measure]').evaluateAll(els =>
    els.map(el => el.getBoundingClientRect().width));

  before.forEach((width, i) => {
    expect(Math.abs(after[i] - width)).toBeLessThanOrEqual(2);
  });
});
```

**FIX**

```ts
import { Inter } from 'next/font/google';

export const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['Arial', 'sans-serif'],
  adjustFontFallback: true,
});
```

로컬 폰트는 실제 fallback metrics를 측정해 `size-adjust`, `ascent-override`, `descent-override`를 생성한다.

---

### DS-TYPE-03 — 의미 구조와 시각 variant 분리

**WHY**

`Text variant="heading"`이 항상 `<div>`로 렌더되거나, 큰 글자를 만들기 위해 `<h2>`를 쓰면 문서 구조가 깨진다.

```tsx
// ✅ 의미 요소와 시각 역할을 분리
type HeadingProps<T extends React.ElementType = 'h2'> = {
  as?: T;
  size?: 'sm' | 'md' | 'lg';
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'size'>;

export function Heading<T extends React.ElementType = 'h2'>({
  as,
  size = 'md',
  className,
  ...props
}: HeadingProps<T>) {
  const Comp = as ?? 'h2';
  return <Comp className={cn(headingVariants({ size }), className)} {...props} />;
}

<Heading as="h1" size="lg">결제 설정</Heading>
<Heading as="h2" size="sm">결제 수단</Heading>
```

`as`를 제공한다고 아무 요소나 허용하는 polymorphism이 좋은 것은 아니다. `Heading`은 `h1`~`h6`으로 타입 범위를 좁히는 편이 안전하다.

---

## 9. 간격과 레이아웃 토큰

### DS-SPACE-01 — 간격 스케일 준수

**WHY**

임의 간격은 개별 화면에서는 미세하지만 제품 전체에서는 리듬을 파괴한다. 4px 기반이라고 선언해도 `13px`, `22px`가 반복되면 실제 시스템은 다른 스케일을 가진다.

**DETECT**

```bash
rg -n '(p|m|gap|space|top|right|bottom|left)-\[[0-9.]+(px|rem)\]' \
  apps packages/ui/src --glob '*.tsx'

rg -n '(padding|margin|gap):\s*[0-9.]+px' apps packages --glob '*.css'
```

**PASS / FAIL**

- PASS: 95% 이상이 승인 스케일을 사용하고 optical adjustment만 문서화된다.
- FAIL: 임의 간격 반복(S2), 같은 패턴이 서로 다른 간격 사용(S2).

**FIX**

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4 */
  --space-2: 0.5rem;   /* 8 */
  --space-3: 0.75rem;  /* 12 */
  --space-4: 1rem;     /* 16 */
  --space-5: 1.25rem;  /* 20 */
  --space-6: 1.5rem;   /* 24 */
  --space-8: 2rem;     /* 32 */
  --space-10: 2.5rem;  /* 40 */
  --space-12: 3rem;    /* 48 */
}
```

1px 아이콘 optical alignment처럼 수학 스케일로 해결할 수 없는 예외는 허용하되 컴포넌트 내부에 캡슐화한다. 제품 코드에서 반복하지 않는다.

---

### DS-SPACE-02 — 내부·외부 간격 소유권

**WHY**

컴포넌트가 외부 margin을 소유하면 어떤 컨테이너에 넣느냐에 따라 간격이 중첩된다. 컴포넌트는 내부 padding을, 레이아웃은 형제 간 gap을 소유한다.

```tsx
// ❌ Card가 외부 margin을 강제
function Card(props: Props) {
  return <section className="mb-6 rounded-lg border p-4" {...props} />;
}

// ✅ Card는 자기 경계 안쪽만 소유
function Card(props: Props) {
  return <section className="rounded-lg border p-4" {...props} />;
}

// ✅ 외부 리듬은 Stack이 소유
<Stack gap="6">
  <Card />
  <Card />
</Stack>
```

**DETECT**

```bash
rg -n "className=.*\b(m[trblxy]?-[0-9])" packages/ui/src/components --glob '*.tsx'
```

margin이 모두 결함은 아니다. `DialogContent` 중앙 정렬의 `mx-auto`, 음수 margin을 이용한 구조 등 의도적 내부 레이아웃은 제외한다.

---

### DS-SPACE-03 — 밀도와 control height

P0 control의 size 이름과 실제 높이를 표로 고정한다.

```text
sm: 32px — 밀도 높은 테이블·툴바
md: 40px — 기본
lg: 48px — 모바일·주 CTA
```

```ts
test.describe('control size contract', () => {
  for (const [size, expected] of Object.entries({ sm: 32, md: 40, lg: 48 })) {
    test(`${size} is ${expected}px`, async ({ page }) => {
      await page.goto(`/iframe.html?id=button--${size}`);
      const box = await page.getByRole('button').boundingBox();
      expect(box?.height).toBe(expected);
    });
  }
});
```

아이콘 버튼도 같은 size 계약을 따른다. 아이콘 자체 크기와 hit area를 혼동하지 않는다.

---

## 10. Radius · Border · Shadow · Elevation

### DS-SHAPE-01 — Radius 계층

**DETECT**

```bash
rg -n 'rounded-\[[^\]]+\]|border-radius:\s*[0-9.]' apps packages --glob '*.{tsx,css}'
rg -o 'rounded-(none|sm|md|lg|xl|2xl|full)' apps --glob '*.tsx' | sort | uniq -c
```

**원칙**

```text
radius.sm   — 작은 badge, checkbox 내부
radius.md   — button, input
radius.lg   — card, popover
radius.xl   — modal, sheet
radius.full — avatar, pill
```

부모와 자식의 radius가 겹칠 때 `inner = outer - padding`에 가까운 시각적 관계를 유지한다. 모든 것을 `rounded-xl`로 통일하지 않는다.

---

### DS-SHAPE-02 — Border 의미

```text
border.subtle  — 구역 분리, 카드 내부
border.default — control 경계
border.strong  — 선택·강조
border.focus   — keyboard focus
border.danger  — invalid
```

```tsx
// ❌ border-gray-200를 모든 역할에 사용
// ✅ 역할 토큰
<Input className="border-border focus-visible:border-ring aria-invalid:border-destructive" />
```

focus border가 layout을 1px 밀지 않게 outline/ring 또는 동일 border width를 사용한다.

---

### DS-SHAPE-03 — Elevation과 stacking 의미

**WHY**

shadow가 장식으로 무분별하게 쓰이면 어느 요소가 위에 있는지 전달하지 못한다. elevation은 z-index와 함께 공간 관계를 표현해야 한다.

```css
:root {
  --shadow-raised: 0 1px 2px rgb(0 0 0 / .06), 0 1px 3px rgb(0 0 0 / .10);
  --shadow-overlay: 0 10px 25px rgb(0 0 0 / .14);
  --shadow-dialog: 0 24px 48px rgb(0 0 0 / .20);

  --z-base: 0;
  --z-sticky: 100;
  --z-dropdown: 300;
  --z-popover: 400;
  --z-toast: 500;
  --z-modal: 600;
}
```

```bash
rg -n '(shadow-\[[^\]]+\]|z-\[[0-9]+\])' apps packages --glob '*.tsx'
```

**PASS / FAIL**

- PASS: elevation과 layer가 명명된 단계에 있다.
- FAIL: 임의 z-index 경쟁(S1 — overlay 상호작용), shadow variant 폭증(S3).

---

## 11. Motion 토큰

### DS-MOTION-01 — Duration과 easing 역할

**WHY**

모든 애니메이션이 `duration-300 ease-in-out`이면 micro interaction은 느리고 큰 panel은 급하다. 거리와 목적에 따라 역할을 나눈다.

```css
:root {
  --duration-instant: 80ms;
  --duration-fast: 140ms;
  --duration-normal: 220ms;
  --duration-slow: 360ms;

  --ease-enter: cubic-bezier(.16, 1, .3, 1);
  --ease-exit: cubic-bezier(.7, 0, .84, 0);
  --ease-move: cubic-bezier(.4, 0, .2, 1);
}
```

```text
hover/focus feedback: fast
popover enter: normal + enter easing
popover exit: fast + exit easing
sheet movement: slow + move easing
```

```bash
rg -n 'duration-\[[^\]]+\]|transition:\s*[^;]*[0-9]+ms|cubic-bezier\(' \
  apps packages/ui/src --glob '*.{tsx,css}'
```

---

### DS-MOTION-02 — reduced motion 계약

**WHY**

소비자가 각자 `motion-reduce`를 추가하게 하면 누락된다. 시스템 primitive가 기본으로 동작을 줄여야 한다.

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 1ms;
    --duration-normal: 1ms;
    --duration-slow: 1ms;
  }

  .ds-motion-essential {
    /* 진행 표시처럼 상태 전달에 필요한 opacity 변화만 유지 */
    transition-duration: 80ms;
    transform: none !important;
  }
}
```

```ts
test('reduced motion removes transform animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/iframe.html?id=overlay-dialog--default');
  await page.getByRole('button', { name: '열기' }).click();

  const content = page.getByRole('dialog');
  const duration = await content.evaluate(el => getComputedStyle(el).transitionDuration);
  expect(duration).toMatch(/0s|0.001s|0.01s/);
});
```

---

### DS-MOTION-03 — Layout animation 안정성

width, height, top, left를 프레임마다 애니메이션하면 layout thrashing이 생긴다. transform과 opacity를 우선한다.

```bash
rg -n 'transition-(all|\\[.*(?:width|height|top|left))|animate.*(width|height)' \
  apps packages/ui/src --glob '*.{tsx,css}'
```

`transition-all`은 편하지만 새 속성이 의도치 않게 애니메이션되는 결함을 만든다. `transition-colors`, `transition-opacity`, `transition-transform`처럼 범위를 명시한다.

---

## 12. 테마와 모드

### DS-THEME-01 — 의미 parity

**WHY**

다크 모드는 색 반전이 아니라 같은 의미의 다른 값이다. 한 모드에만 토큰이 있거나 status 위계가 달라지면 컴포넌트 계약이 깨진다.

**DETECT**

```ts
// scripts/audit-theme-parity.ts
const light = parseCustomProperties('themes/light.css');
const dark = parseCustomProperties('themes/dark.css');
const high = parseCustomProperties('themes/high-contrast.css');

for (const [name, theme] of Object.entries({ dark, high })) {
  const missing = [...light.keys()].filter(k => !theme.has(k));
  const extra = [...theme.keys()].filter(k => !light.has(k));
  console.log(name, { missing, extra });
  if (missing.length || extra.length) process.exitCode = 1;
}
```

**PASS / FAIL**

- PASS: 모든 테마가 동일 token key 집합을 가진다.
- FAIL: P0 토큰 누락(S1), fallback으로 우연히 동작(S2), 의미가 테마마다 다른 이름(S2).

---

### DS-THEME-02 — 초기 테마와 hydration

**WHY**

서버는 light, 클라이언트는 dark로 렌더하면 flash와 hydration mismatch가 생긴다. `mounted` 뒤 전체 UI를 보여주는 방식은 문제를 숨기지만 첫 화면을 늦춘다.

**DETECT**

```bash
rg -n 'mounted|hasMounted|suppressHydrationWarning|ThemeProvider' apps --glob '*.tsx'
rg -n 'localStorage.*theme|matchMedia.*prefers-color-scheme' apps --glob '*.{ts,tsx}'
```

```ts
test('dark preference has no light flash', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));

  const samples: string[] = [];
  await page.exposeFunction('recordTheme', (value: string) => samples.push(value));
  await page.addInitScript(() => {
    new MutationObserver(() =>
      (window as any).recordTheme(document.documentElement.className))
      .observe(document.documentElement, { attributes: true });
  });

  await page.goto('/');
  expect(samples.some(v => !v.includes('dark'))).toBe(false);
});
```

**FIX**

```tsx
// 서버가 cookie를 읽어 초기 속성을 렌더
export default async function RootLayout({ children }: Props) {
  const store = await cookies();
  const theme = store.get('theme')?.value ?? 'system';

  return (
    <html
      lang="ko"
      data-theme={theme === 'system' ? undefined : theme}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
```

system 테마의 즉시 결정이 필요하면 blocking inline script를 최소 크기로 제공하고 CSP nonce를 적용한다. 전체 앱을 `mounted` 전 숨기지 않는다.

---

### DS-THEME-03 — 이미지·아이콘·shadow 테마 대응

색 토큰만 바뀌어도 asset가 밝은 배경을 포함하거나 그림자가 검게 뭉치면 다크 모드가 실패한다.

```ts
test.describe('theme component matrix', () => {
  for (const theme of ['light', 'dark', 'high-contrast']) {
    test(theme, async ({ page }) => {
      await page.goto('/iframe.html?id=foundation-theme--matrix');
      await page.locator('html').evaluate((element, value) => {
        element.setAttribute('data-theme', value);
      }, theme);
      await expect(page.locator('#storybook-root')).toHaveScreenshot(`theme-${theme}.png`);
    });
  }
});
```

로고가 테마별 자산을 가져야 하면 CSS로 두 이미지를 모두 다운로드하지 말고 `<picture>` 또는 서버/클라이언트 조건을 신중히 사용한다.

```tsx
<picture>
  <source srcSet="/brand/logo-dark.svg" media="(prefers-color-scheme: dark)" />
  <img src="/brand/logo-light.svg" alt="Acme" width={120} height={32} />
</picture>
```

사용자가 앱 내 테마를 강제로 선택할 수 있으면 media query만으로 부족하다. CSS mask + currentColor 로고 또는 `data-theme` 기반 source 전략을 쓴다.

---

### DS-THEME-04 — forced colors

**WHY**

Windows High Contrast/forced-colors에서는 사용자 팔레트가 적용된다. box-shadow와 배경색만으로 경계를 표현하면 요소가 사라진다.

```css
@media (forced-colors: active) {
  .button {
    border: 1px solid ButtonText;
    forced-color-adjust: auto;
  }

  .button[aria-pressed='true'] {
    outline: 2px solid Highlight;
  }

  .status-icon {
    fill: currentColor;
  }
}
```

```ts
test('forced colors preserves controls', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/iframe.html?id=controls-button--matrix');
  await expect(page.getByRole('button').first()).toBeVisible();
  await expect(page.locator('#storybook-root')).toHaveScreenshot('button-forced-colors.png');
});
```

---

## 13. 컴포넌트 API

### DS-API-01 — Props 표면과 variant 모델

**WHY**

`primary`, `isPrimary`, `type="primary"`, `kind="main"`처럼 같은 개념을 다르게 표현하면 학습 비용과 실수가 증가한다. boolean prop가 늘면 불가능한 조합도 늘어난다.

**DETECT**

```bash
rg -n 'isPrimary|isSecondary|isDanger|primary\?: boolean|danger\?: boolean' \
  packages/ui/src --glob '*.tsx'
rg -n '(variant|kind|tone|intent|appearance)\?:' packages/ui/src --glob '*.tsx'
```

```tsx
// ❌ 불가능한 조합이 타입상 가능
<Button primary secondary danger small large />

// ✅ 닫힌 union으로 한 축을 표현
<Button variant="primary" tone="danger" size="sm" />
```

`variant`와 `tone`을 분리할지는 실제 조합을 기준으로 결정한다.

```ts
type ButtonProps = {
  variant?: 'solid' | 'outline' | 'ghost';
  tone?: 'neutral' | 'brand' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};
```

모든 variant × tone 조합을 지원하지 않는다면 타입으로 제한한다.

```ts
type ButtonAppearance =
  | { variant?: 'solid'; tone?: 'brand' | 'neutral' | 'danger' }
  | { variant: 'outline'; tone?: 'neutral' | 'danger' }
  | { variant: 'ghost'; tone?: 'neutral' | 'danger' };
```

**PASS / FAIL**

- PASS: 같은 개념의 prop 이름이 시스템 전체에서 일관된다. 불가능한 조합이 타입에서 차단된다.
- FAIL: boolean variant 폭증(S2), 이름 drift(S2), 무효 조합이 런타임에서만 실패(S2).

---

### DS-API-02 — Native props와 ref 전달

**WHY**

Button이 `aria-*`, `data-*`, `name`, `form`, `onPointerDown`을 전달하지 않거나 ref가 실제 DOM에 도달하지 않으면 소비자는 접근성·폼·포커스 요구를 해결하려고 우회한다.

**DETECT**

```bash
rg -L 'forwardRef|ref=' packages/ui/src/components/*.tsx
rg -n 'type .*Props = \{' packages/ui/src/components --glob '*.tsx' \
  | rg '(Button|Input|Textarea|Select)'
```

**FIX**

```tsx
export type ButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
```

`{...props}`의 위치를 확인한다. 내부 필수 속성을 소비자가 덮으면 안 되는 경우 spread를 앞에 둔다. 반대로 `aria-label`처럼 소비자가 의도적으로 지정해야 하는 속성은 보존한다.

```ts
test('Button forwards ref and native attributes', () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref} name="save" form="profile" data-track="save">저장</Button>);
  expect(ref.current?.tagName).toBe('BUTTON');
  expect(ref.current).toHaveAttribute('name', 'save');
  expect(ref.current).toHaveAttribute('form', 'profile');
  expect(ref.current).toHaveAttribute('data-track', 'save');
});
```

---

### DS-API-03 — Polymorphism와 `asChild`

**WHY**

버튼처럼 보이는 링크를 `<button onClick={() => router.push()}>`로 만들면 새 탭, URL 복사, 브라우저 상태가 깨진다. 반대로 polymorphic API가 ref·이벤트·disabled 의미를 조용히 바꾸면 더 위험하다.

```tsx
// ❌ 이동을 button으로
<Button onClick={() => router.push('/pricing')}>요금제 보기</Button>

// ✅ 링크 의미 유지
<Button asChild>
  <Link href="/pricing">요금제 보기</Link>
</Button>
```

**검사**

```ts
test('asChild preserves anchor semantics', async ({ page }) => {
  await page.goto('/iframe.html?id=controls-button--as-link');
  const link = page.getByRole('link', { name: '요금제 보기' });
  await expect(link).toHaveAttribute('href', '/pricing');
  await expect(page.getByRole('button', { name: '요금제 보기' })).toHaveCount(0);
});
```

`disabled` 링크는 네이티브 속성이 아니다. 클릭 방지, `aria-disabled`, focus 정책을 명시한다. 가능한 경우 링크 자체를 렌더하지 않는 것이 더 명확하다.

---

### DS-API-04 — Controlled/Uncontrolled 계약

**WHY**

`value`를 넘겼는데 내부 state가 따로 움직이거나, 렌더 중 controlled ↔ uncontrolled 전환이 발생하면 폼 상태가 예측 불가능해진다.

```tsx
type DisclosureProps =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      defaultOpen?: never;
    }
  | {
      open?: never;
      onOpenChange?: (open: boolean) => void;
      defaultOpen?: boolean;
    };
```

```ts
test('controlled state follows owner', async () => {
  const user = userEvent.setup();
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>열기</DialogTrigger>
          <DialogContent>내용</DialogContent>
        </Dialog>
        <button onClick={() => setOpen(false)}>외부 닫기</button>
      </>
    );
  }
  render(<Harness />);
  await user.click(screen.getByText('열기'));
  expect(screen.getByRole('dialog')).toBeVisible();
  await user.click(screen.getByText('외부 닫기'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

---

### DS-API-05 — Event naming과 payload

표준 DOM 이벤트는 `onChange`, 상태 API는 `onOpenChange`, 명령은 `onValueChange`처럼 이름 규칙을 고정한다. `onClickItem(item)`과 `onSelect(id)`가 섞이지 않게 한다.

```text
상태 변화: on{State}Change(nextValue)
사용자 의도: onSelect(value), onRemove(id)
DOM 이벤트: onClick(event), onBlur(event)
완료 이벤트: onComplete(result)
```

콜백이 원본 DOM event만 주고 유용한 값은 소비자가 다시 추출하게 하지 않는다.

```tsx
// ✅ 값과 필요 시 event를 제공
type SelectProps = {
  onValueChange?: (value: string, meta: { source: 'keyboard' | 'pointer' }) => void;
};
```

---

## 14. 상태 매트릭스

### DS-STATE-01 — 필수 상태 coverage

모든 interactive component는 적용 가능한 상태를 명시한다.

| 상태 | Button | Input | Select | Dialog | Table row |
|------|--------|-------|--------|--------|-----------|
| default | ✓ | ✓ | ✓ | open/closed | ✓ |
| hover | ✓ | ✓ | ✓ | — | ✓ |
| focus-visible | ✓ | ✓ | ✓ | trap | ✓ |
| active/pressed | ✓ | — | open | — | selected |
| disabled | ✓ | ✓ | ✓ | trigger | action |
| loading | ✓ | async | async | submit | skeleton |
| invalid | — | ✓ | ✓ | form | row error |
| read-only | — | ✓ | ✓ | — | — |
| empty | — | — | ✓ | — | ✓ |

**DETECT**

```bash
rg -n 'hover:|focus-visible:|active:|disabled:|aria-invalid|aria-selected|data-\[state' \
  packages/ui/src/components --glob '*.tsx'
```

누락 여부를 코드 문자열 개수로 확정하지 않는다. story matrix와 런타임 계산 스타일을 함께 본다.

---

### DS-STATE-02 — Button loading 계약

**WHY**

loading 중 버튼 폭이 바뀌거나 클릭이 유지되면 layout shift와 중복 제출이 생긴다. spinner에 이름을 주면 스크린리더가 버튼 이름 대신 “로딩”만 읽을 수 있다.

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={cn('inline-flex items-center', loading && 'invisible')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner aria-hidden />
        </span>
      )}
    </button>
  ),
);
```

내용을 `invisible`로 유지하면 폭이 보존된다. 문맥상 “저장 중…”이 더 유용하면 텍스트를 바꾸되 min-width 또는 기존 폭을 유지한다.

```ts
test('loading preserves size and blocks activation', async ({ page }) => {
  await page.goto('/iframe.html?id=controls-button--loading-toggle');
  const button = page.getByRole('button', { name: '저장' });
  const before = await button.boundingBox();
  await page.getByTestId('toggle-loading').click();
  const after = await button.boundingBox();
  expect(after?.width).toBe(before?.width);
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute('aria-busy', 'true');
});
```

---

### DS-STATE-03 — Disabled vs read-only

disabled는 focus·제출·조작에서 제외되고, read-only는 값을 읽고 복사할 수 있다. 둘을 opacity 하나로 처리하지 않는다.

```tsx
// 값 복사가 필요한 API key
<Input value={apiKey} readOnly aria-describedby="api-key-help" />

// 조건 미충족으로 제출 불가
<Button disabled aria-describedby="submit-disabled-reason">발행</Button>
<p id="submit-disabled-reason">제목과 데이터 소스를 먼저 선택하세요.</p>
```

disabled control의 이유는 인접 텍스트로 제공한다. disabled 요소에만 Tooltip을 걸면 pointer/focus 이벤트가 발생하지 않아 설명을 볼 수 없다.

---

### DS-STATE-04 — Focus-visible 일관성

```ts
test('P0 controls expose visible keyboard focus', async ({ page }) => {
  await page.goto('/iframe.html?id=controls-focus--matrix');
  const controls = page.locator('[data-focus-contract]');

  for (let i = 0; i < await controls.count(); i++) {
    const control = controls.nth(i);
    await control.focus();
    const style = await control.evaluate(el => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, width: s.outlineWidth, shadow: s.boxShadow };
    });
    expect(
      (style.outline !== 'none' && style.width !== '0px') || style.shadow !== 'none',
      `No focus indicator at index ${i}`,
    ).toBe(true);
  }
});
```

mouse click에는 과한 ring을 숨기되 keyboard focus는 절대 제거하지 않는다. `:focus` 전체를 `outline: none`으로 초기화하지 않는다.

---

## 15. 합성과 레이아웃

### DS-COMP-01 — Slot 기반 합성

**WHY**

`Card`가 header/body/footer의 모든 조합을 props로 받기 시작하면 API가 비대해지고 새로운 배치마다 시스템 변경이 필요하다.

```tsx
// ❌ prop bag
<Card
  title="플랜"
  subtitle="현재 플랜"
  icon={<Crown />}
  action={<Button>변경</Button>}
  footerText="다음 결제일..."
/>

// ✅ compound composition
<Card>
  <CardHeader>
    <CardTitle>플랜</CardTitle>
    <CardDescription>현재 플랜</CardDescription>
    <CardAction><Button>변경</Button></CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>다음 결제일…</CardFooter>
</Card>
```

compound component는 DOM 구조와 접근성 관계를 보장하면서 콘텐츠는 소비자가 합성하게 한다.

---

### DS-COMP-02 — Layout primitive의 책임

Stack, Inline, Grid, Container가 있다면 CSS의 작은 부분집합을 안정적으로 표현해야 한다. 모든 CSS prop를 노출해 새 DSL을 만들지 않는다.

```tsx
type StackProps = React.ComponentPropsWithoutRef<'div'> & {
  gap?: '1' | '2' | '3' | '4' | '6' | '8';
  align?: 'start' | 'center' | 'end' | 'stretch';
};

const gaps = {
  1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6', 8: 'gap-8',
} as const;

export function Stack({ gap = '4', align = 'stretch', className, ...props }: StackProps) {
  return <div className={cn('flex flex-col', gaps[gap], aligns[align], className)} {...props} />;
}
```

`paddingTop`, `paddingBottom`, `marginLeft` 등을 전부 prop로 추가하지 않는다. 일반 CSS가 더 명확하다.

---

### DS-COMP-03 — className escape hatch

**WHY**

`className`을 금지하면 정당한 레이아웃 요구를 해결할 수 없고, 무제한 허용하면 variant 계약이 쉽게 깨진다.

정책:

```text
- 외부 레이아웃(width, flex, grid placement)은 허용한다.
- 내부 구조를 깨는 selector([&>svg], arbitrary descendant)는 경고한다.
- color/size를 className으로 반복 재정의하면 variant gap으로 분류한다.
- P0 컴포넌트는 tailwind-merge로 충돌 결과를 결정론적으로 만든다.
```

```tsx
export const Button = ({ className, variant, size, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
```

```bash
# 시스템 컴포넌트의 시각 계약 우회 후보
rg -n '<(Button|Input|Badge)[^>]*className="[^"]*(bg-|text-|border-|h-|rounded-)' \
  apps --glob '*.tsx'
```

세 번 이상 같은 우회가 있으면 새 variant를 검토한다. 한 번뿐인 도메인 배치라면 예외가 더 낫다.

---

### DS-COMP-04 — Container 내성

```ts
test.describe('component container resilience', () => {
  for (const width of [240, 320, 480, 768]) {
    test(`card at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width: width + 40, height: 700 });
      await page.goto(`/iframe.html?id=content-card--stress&args=containerWidth:${width}`);

      const overflow = await page.locator('[data-test-container]').evaluate(el =>
        el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
```

flex child에는 `min-w-0`, 긴 식별자에는 `overflow-wrap:anywhere`, 이미지에는 고정 aspect ratio를 적용한다. viewport breakpoint만 보지 말고 container 폭으로 검사한다.

---

## 16. 폼 컴포넌트

### DS-FORM-01 — Label · Description · Error 관계

**WHY**

폼 접근성 관계를 매 화면이 조립하게 하면 누락된다. Field primitive가 ID 생성과 `aria-describedby`, `aria-invalid`를 소유해야 한다.

```tsx
function Field({ name, label, description, error, children }: FieldProps) {
  const id = useId();
  const inputId = name ?? `field-${id}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5" data-invalid={!!error || undefined}>
      <Label htmlFor={inputId}>{label}</Label>
      {React.cloneElement(children, {
        id: inputId,
        'aria-invalid': !!error || undefined,
        'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
      })}
      {description && <p id={descriptionId} className="text-sm text-muted-foreground">{description}</p>}
      {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

cloneElement는 자식 타입과 ref 합성에 주의해야 한다. context + `FieldControl` slot 구조가 라이브러리에서는 더 안전할 수 있다.

```ts
test('Field wires accessible description and error', () => {
  render(
    <Field label="이메일" description="업무용 이메일" error="형식을 확인하세요">
      <Input />
    </Field>,
  );
  const input = screen.getByRole('textbox', { name: '이메일' });
  expect(input).toHaveAccessibleDescription('업무용 이메일 형식을 확인하세요');
  expect(input).toHaveAttribute('aria-invalid', 'true');
});
```

---

### DS-FORM-02 — Form library 독립성

Input이 react-hook-form에 직접 의존하면 다른 상태 모델이나 Server Action에서 재사용하기 어렵다. primitive는 native contract를 지키고 adapter를 별도로 둔다.

```tsx
// primitive
<Input name="email" defaultValue="" />

// optional adapter
function RHFInput<T extends FieldValues>({ control, name, ...props }: RHFProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field label={props.label} error={fieldState.error?.message}>
          <Input {...field} />
        </Field>
      )}
    />
  );
}
```

---

### DS-FORM-03 — Select/Combobox 의미 구분

native select, custom Select, searchable Combobox는 다른 도구다.

```text
Select: 제한된 옵션(대략 10개 이하), 검색 불필요
Combobox: 긴 옵션, 검색·비동기 결과
Autocomplete: 자유 입력 + 제안
```

모든 것을 custom combobox로 만들지 않는다. 모바일과 접근성에서는 native select가 더 나을 수 있다.

```ts
test('combobox keyboard contract', async ({ page }) => {
  await page.goto('/iframe.html?id=forms-combobox--default');
  const combo = page.getByRole('combobox', { name: '국가' });
  await combo.focus();
  await page.keyboard.press('ArrowDown');
  await expect(combo).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected');
  await page.keyboard.press('Escape');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await expect(combo).toBeFocused();
});
```

---

### DS-FORM-04 — Checkbox · Radio · Switch 선택

```text
Checkbox — 독립적인 다중 선택 또는 동의
Radio    — 상호 배타적인 선택 중 하나
Switch   — 즉시 적용되는 on/off 설정
```

저장 버튼을 눌러야 반영되는 설정에 Switch를 쓰면 즉시 적용될 것이라는 기대와 충돌한다. Checkbox 또는 Select를 쓴다.

indeterminate checkbox는 `aria-checked="mixed"`와 DOM `indeterminate`를 모두 설정한다.

```tsx
useEffect(() => {
  if (ref.current) ref.current.indeterminate = checked === 'indeterminate';
}, [checked]);
```

---

## 17. Overlay와 Layer

### DS-OVERLAY-01 — Portal과 stacking

**WHY**

popover가 overflow container에 잘리거나 modal이 sticky header 아래에 나오면 시스템 layer 계약이 실패한 것이다.

```tsx
// Portal root를 명시하고 z token 사용
<Portal container={document.getElementById('overlay-root')}>
  <div className="z-popover">…</div>
</Portal>
```

```ts
test('popover escapes clipping container', async ({ page }) => {
  await page.goto('/iframe.html?id=overlay-popover--inside-overflow');
  await page.getByRole('button', { name: '열기' }).click();
  const popover = page.getByRole('dialog');
  await expect(popover).toBeVisible();
  expect(await popover.evaluate(el => el.closest('[data-clipping-container]'))).toBeNull();
});
```

---

### DS-OVERLAY-02 — Focus lifecycle

**계약**

```text
열기: dialog 내부 첫 의미 있는 control로 focus
열린 동안: modal이면 focus trap
닫기: trigger 또는 명시된 복귀 대상
Escape: 닫기 (파괴적 진행 중 작업은 예외를 문서화)
중첩: 최상위 overlay만 Escape에 반응
```

```ts
test('dialog focus lifecycle', async ({ page }) => {
  await page.goto('/iframe.html?id=overlay-dialog--default');
  const trigger = page.getByRole('button', { name: '설정 열기' });
  await trigger.click();
  await expect(page.getByRole('dialog').getByLabel('이름')).toBeFocused();

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() =>
      !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
```

---

### DS-OVERLAY-03 — Scroll lock와 layout shift

modal 열 때 scrollbar가 사라져 페이지가 움직이거나 iOS에서 배경이 스크롤되면 실패다.

```ts
test('modal does not shift page or scroll background', async ({ page }) => {
  await page.goto('/iframe.html?id=overlay-dialog--long-page');
  await page.evaluate(() => scrollTo(0, 500));
  const beforeX = await page.locator('[data-anchor]').evaluate(el => el.getBoundingClientRect().x);
  const beforeScroll = await page.evaluate(() => scrollY);

  await page.getByRole('button', { name: '열기' }).click();
  const afterX = await page.locator('[data-anchor]').evaluate(el => el.getBoundingClientRect().x);
  await page.mouse.wheel(0, 500);
  const afterScroll = await page.evaluate(() => scrollY);

  expect(Math.abs(afterX - beforeX)).toBeLessThanOrEqual(1);
  expect(afterScroll).toBe(beforeScroll);
});
```

`scrollbar-gutter: stable`과 검증된 overlay primitive를 사용한다. 각 modal이 body style을 직접 수정하지 않는다.

---

### DS-OVERLAY-04 — Dialog · AlertDialog · Popover 구분

```text
Dialog      — 복합 입력·정보, modal 또는 non-modal
AlertDialog — 즉시 결정이 필요하고 취소가 명확한 위험 작업
Popover     — 현재 맥락의 보조 정보·가벼운 조작
Tooltip     — 짧은 설명, interactive content 금지
```

Tooltip 안에 버튼과 링크를 넣지 않는다. hover를 유지할 수 없고 키보드 탐색 모델과 맞지 않는다. interactive content는 Popover를 쓴다.

---

## 18. Icon · Illustration · Asset

### DS-ASSET-01 — 아이콘 크기와 stroke

```bash
rg -n '<(svg|[A-Z][A-Za-z]+Icon)[^>]*(width|height)=["\'][0-9]+' \
  apps packages/ui/src --glob '*.tsx'
rg -n 'strokeWidth=\{?[0-9.]+' apps packages/ui/src --glob '*.tsx'
```

```text
icon.xs = 12
icon.sm = 16
icon.md = 20
icon.lg = 24
```

버튼 size와 icon size 매핑을 고정한다. 외부 아이콘 라이브러리의 서로 다른 viewBox/stroke를 섞으면 optical size가 달라지므로 wrapper에서 정규화한다.

```tsx
function Icon({ icon: Comp, size = 'md', decorative = true, label, ...props }: IconProps) {
  return (
    <Comp
      className={iconSize[size]}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      focusable="false"
      {...props}
    />
  );
}
```

---

### DS-ASSET-02 — 아이콘 접근성

```tsx
// 텍스트 버튼의 아이콘은 장식
<Button><Save aria-hidden />저장</Button>

// 아이콘 단독 버튼은 버튼에 이름
<Button size="icon" aria-label="리포트 삭제">
  <Trash2 aria-hidden />
</Button>

// 의미 이미지에는 구체적 대체 텍스트
<img src={chart} alt="지난 6개월 매출이 18% 증가한 막대그래프" />
```

SVG 내부 `<title>`만 접근 가능한 이름으로 의존하지 않는다. 브라우저·조합별 일관성이 떨어진다.

---

### DS-ASSET-03 — Asset 중복과 최적화

```bash
# 같은 이름/크기의 이미지 후보
fd -e png -e jpg -e jpeg -e webp -e svg public apps packages

# inline SVG 반복
rg -l '<svg' apps --glob '*.tsx' | wc -l

# 거대한 raster
python scripts/report-large-assets.py --threshold-kb 250
```

브랜드 원본을 자동 최적화로 덮지 않는다. 파생본을 생성하고 원본/사용본 관계를 manifest로 관리한다.

```json
{
  "hero-keyboard": {
    "source": "brand/source/hero-keyboard.psd",
    "outputs": [
      "public/brand/hero-keyboard-1280.webp",
      "public/brand/hero-keyboard-640.webp"
    ],
    "owner": "brand"
  }
}
```

---

## 19. Responsive와 국제화 내성

### DS-RES-01 — Container query 우선 판단

컴포넌트 배치가 viewport가 아니라 **자기 컨테이너 폭**에 따라 달라져야 하면 container query를 쓴다.

```css
.card-region { container-type: inline-size; }

@container (min-width: 30rem) {
  .profile-card { grid-template-columns: auto 1fr auto; }
}
```

같은 viewport에서 sidebar와 main 영역에 각각 놓아 테스트한다.

---

### DS-RES-02 — 콘텐츠 스트레스

```ts
const stressCases = [
  { name: 'empty', title: '', description: '' },
  { name: 'long-ko', title: '매우 긴 한국어 제목이 여러 줄로 표시되는 경우를 확인합니다'.repeat(2) },
  { name: 'long-unbroken', title: 'A'.repeat(160) },
  { name: 'emoji', title: '👨‍👩‍👧‍👦 ✅ 🚀 상태' },
  { name: 'rtl', title: 'إعدادات الحساب والفوترة' },
];
```

```ts
for (const data of stressCases) {
  test(data.name, async ({ page }) => {
    await page.goto(`/iframe.html?id=content-card--stress&args=case:${data.name}`);
    const root = page.locator('#storybook-root');
    const overflow = await root.evaluate(el => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(root).toHaveScreenshot(`card-${data.name}.png`);
  });
}
```

긴 문자열을 전부 truncate하지 않는다. 사용자가 식별해야 하는 값은 wrap 또는 tooltip/확장 수단을 제공한다.

---

### DS-RES-03 — RTL logical properties

```bash
rg -n '(margin-left|margin-right|padding-left|padding-right|left:|right:)' \
  packages/ui/src --glob '*.{css,tsx}'
rg -n '\b(ml|mr|pl|pr|left|right)-' packages/ui/src --glob '*.tsx'
```

```css
/* ❌ 물리 방향 */
margin-left: .5rem;
border-left: 2px solid;

/* ✅ 논리 방향 */
margin-inline-start: .5rem;
border-inline-start: 2px solid;
```

아이콘은 모두 mirror하지 않는다. 화살표·진행 방향은 mirror하고, 재생·브랜드·전화 아이콘은 유지할 수 있다.

---

## 20. 접근성 계약

### DS-A11Y-01 — 접근성은 primitive에서 보장

소비자가 매번 ARIA를 조립하도록 설계하지 않는다.

```text
Dialog: role, aria-modal, label 관계, focus trap, Escape, focus return
Tabs: role, aria-selected, roving tabindex, arrow keys
Accordion: heading, button, aria-expanded, aria-controls
Toast: live region, dismiss, 시간 정책
Tooltip: describedby, hover/focus, Escape
```

```bash
rg -n 'role=|aria-' packages/ui/src/components --glob '*.tsx'
```

ARIA 개수가 많다고 좋은 것이 아니다. native element로 해결 가능한데 role을 재구현하면 결함 가능성이 높다.

---

### DS-A11Y-02 — axe story gate

```ts
// .storybook/test-runner.ts
import { injectAxe, checkA11y } from 'axe-playwright';

export const preVisit = async page => {
  await injectAxe(page);
};

export const postVisit = async page => {
  await checkA11y(page, '#storybook-root', {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
};
```

axe PASS가 접근성 완료를 뜻하지 않는다. keyboard interaction, name/role/value, announcement는 별도 테스트한다.

---

### DS-A11Y-03 — Accessible name 안정성

아이콘 교체나 loading 상태에서 accessible name이 바뀌지 않아야 한다.

```ts
test('button accessible name survives states', async ({ page }) => {
  await page.goto('/iframe.html?id=controls-button--state-cycle');
  const button = page.getByRole('button', { name: '보고서 저장' });
  await page.getByTestId('loading').click();
  await expect(button).toHaveAccessibleName('보고서 저장');
  await page.getByTestId('success').click();
  await expect(button).toHaveAccessibleName('보고서 저장');
});
```

상태 변화는 `aria-busy`와 별도 live region으로 알리고 control의 이름은 안정적으로 유지한다.

---

### DS-A11Y-04 — Touch target 계약

시각 아이콘이 16px여도 hit area는 최소 44×44px를 권장한다. 밀도 높은 desktop table에서는 32px 예외를 허용할 수 있지만 mobile에서 확대한다.

```ts
test('mobile controls meet target size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/iframe.html?id=controls-mobile--matrix');
  const small = await page.locator('button, a, input').evaluateAll(els =>
    els.flatMap(el => {
      const r = el.getBoundingClientRect();
      return r.width < 44 || r.height < 44
        ? [{ name: el.getAttribute('aria-label') ?? el.textContent, w: r.width, h: r.height }]
        : [];
    }));
  expect(small).toEqual([]);
});
```

---

## 21. 문서화와 발견 가능성

### DS-DOC-01 — Story completeness

**WHY**

문서에 default story 하나만 있으면 개발자는 어떤 size·state·조합이 지원되는지 알 수 없다. 문서에 없는 API는 사실상 발견 불가능하다.

P0 컴포넌트 story의 최소 집합:

```text
Overview        — 목적, 언제 쓰는지, 언제 쓰지 않는지
Variants        — 모든 variant
Sizes           — 모든 size
States          — hover/focus/active/disabled/loading/invalid
Composition     — 실제 조합
Content stress  — 긴 텍스트, 아이콘, 빈 값
Themes          — light/dark/high-contrast
Accessibility   — keyboard와 name/role contract
Do/Don't        — 흔한 오용
```

**DETECT**

```bash
# 컴포넌트와 story 대응
for f in packages/ui/src/components/*.tsx; do
  base="${f%.tsx}"
  [ -f "${base}.stories.tsx" ] || echo "MISSING STORY: $f"
done

# play function 없는 interactive story
rg -L '\bplay:\s*async|play:\s*\(' packages/ui/src --glob '*.stories.tsx'
```

**FIX**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

const meta = {
  title: 'Controls/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: '저장', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component:
          '즉시 실행되는 행동에 사용합니다. 페이지 이동에는 Button asChild + Link를 사용하세요.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };

export const KeyboardActivation: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: '저장' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
```

---

### DS-DOC-02 — 문서와 타입 drift

**WHY**

문서 표를 손으로 유지하면 새 prop·variant가 추가될 때 누락된다. 타입 또는 source에서 생성하고, 설명만 사람이 소유한다.

```bash
# Story args가 존재하지 않는 prop를 참조하면 typecheck에서 잡힌다
pnpm storybook:typecheck

# build 자체가 문서 링크·MDX import drift를 잡는다
pnpm storybook:build
```

```ts
// variant 목록을 구현과 story가 같은 상수에서 참조
export const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
```

```tsx
export const VariantMatrix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {BUTTON_VARIANTS.map(variant => (
        <Button key={variant} variant={variant}>{variant}</Button>
      ))}
    </div>
  ),
};
```

**PASS / FAIL**

- PASS: 구현의 variant가 matrix story에 자동 반영된다. Storybook build와 typecheck가 통과한다.
- FAIL: 존재하지 않는 prop 문서(S2), 신규 variant 문서 누락(S2), 깨진 MDX(S3).

---

### DS-DOC-03 — 사용 지침과 Do/Don't

API 문서만으로는 올바른 선택을 알려주지 못한다.

```markdown
## Button

### 사용
- 현재 화면에서 즉시 실행되는 행동
- 하나의 영역에 primary action은 하나만
- 파괴적 행동은 `tone="danger"`

### 사용하지 않음
- 페이지 이동: Link 사용
- on/off 상태: Switch 또는 Toggle 사용
- 메뉴 열기: MenuTrigger 사용

### Content
- 동사 + 대상: "초대 보내기", "변경 사항 저장"
- "확인", "OK", "제출"처럼 결과가 불명확한 라벨 금지
```

Do/Don't 예시는 스크린샷만 쓰지 않는다. 왜 잘못인지 텍스트로 설명하고 접근 가능한 코드 예시를 제공한다.

---

### DS-DOC-04 — 검색과 발견 시간

새 개발자에게 다음 과업을 주고 시간을 측정한다.

```text
1. 파괴적 확인 대화상자를 찾고 구현한다.
2. 검색 가능한 100개 옵션 선택기를 찾는다.
3. loading 버튼의 올바른 API를 찾는다.
4. 다크 모드에서 쓸 success container 토큰을 찾는다.
```

```markdown
| 과업 | 목표 | 실제 | 막힘 |
|------|------|------|------|
| AlertDialog 찾기 | 2분 | 6분 | Dialog와 차이 설명 없음 |
| Combobox 찾기 | 3분 | 실패 | Select 문서에서 연결 없음 |
```

5분 안에 적절한 primitive를 찾지 못하면 문서 IA 또는 naming Finding으로 기록한다. 개발자에게 “문서를 더 읽으라”고 하지 않는다.

---

## 22. 버전 · 변경 · 마이그레이션

### DS-VER-01 — Semantic versioning

**WHY**

컴포넌트의 시각 변경도 사용자 행동·스크린샷·레이아웃을 깨뜨릴 수 있다. 타입만 안 깨졌다고 patch는 아니다.

```text
PATCH
- 버그 수정, 접근성 개선
- 의도된 범위 안의 작은 시각 수정
- 새 optional prop (기본 동작 불변)

MINOR
- 새 컴포넌트·variant·토큰
- opt-in 가능한 새 동작
- deprecation 추가

MAJOR
- prop 제거·이름 변경
- 기본 variant·size·DOM 구조·focus 동작 변경
- 토큰 제거 또는 의미 변경
- CSS reset처럼 전역 영향이 있는 변경
```

기본값 변경은 타입 오류가 없어도 behavioral breaking change다.

---

### DS-VER-02 — Changeset과 changelog 품질

```markdown
---
"@acme/ui": minor
---

`Button`에 `loading` 상태를 추가합니다.

- loading 중 버튼 폭을 유지합니다.
- native `disabled`와 `aria-busy="true"`가 적용됩니다.
- spinner는 accessible name에서 제외됩니다.

Migration: 기존 로컬 spinner wrapper를 `loading` prop로 바꿀 수 있습니다.
```

```bash
# 변경된 공개 패키지에 changeset이 있는지
pnpm changeset status --since=origin/main

# package version과 tag 일치
git tag --points-at HEAD
npm view @acme/ui version
```

“Button updated” 같은 changelog는 무효다. 소비자가 영향과 행동을 판단할 수 있어야 한다.

---

### DS-VER-03 — Deprecation 수명주기

```text
1. 대체 API를 먼저 제공한다.
2. JSDoc @deprecated에 대체 API와 제거 버전을 쓴다.
3. 개발 모드 경고는 한 번만 출력한다.
4. codemod 또는 migration example을 제공한다.
5. 최소 한 minor 주기 후 major에서 제거한다.
```

```ts
export type ButtonProps = {
  /**
   * @deprecated `variant="danger"`를 사용하세요. v4에서 제거됩니다.
   */
  destructive?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

const warned = new Set<string>();
export function warnOnce(key: string, message: string) {
  if (process.env.NODE_ENV === 'production' || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}
```

```tsx
if (destructive) {
  warnOnce(
    'Button.destructive',
    '[UI] Button `destructive` is deprecated. Use `variant="danger"`. Removed in v4.',
  );
}
```

production bundle에 경고 문자열이 남지 않는지 확인한다.

```bash
pnpm build
rg -n 'Button `destructive` is deprecated' packages/ui/dist && exit 1 || true
```

---

### DS-VER-04 — Codemod

반복 가능한 기계적 변경은 문서만 주지 말고 codemod를 제공한다.

```ts
// transforms/button-destructive-to-variant.ts
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.JSXOpeningElement, { name: { name: 'Button' } })
    .forEach(path => {
      const attrs = path.node.attributes ?? [];
      const index = attrs.findIndex(a =>
        a.type === 'JSXAttribute' && a.name.name === 'destructive');
      if (index === -1) return;

      attrs.splice(index, 1,
        j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('danger')));
    });

  return root.toSource({ quote: 'single' });
}
```

```bash
# dry-run과 diff를 먼저
pnpm jscodeshift apps/web \
  -t packages/ui/transforms/button-destructive-to-variant.ts \
  --dry --print
```

codemod에 idempotence test를 작성한다. 두 번 실행해도 두 번째 diff가 없어야 한다.

---

### DS-VER-05 — Consumer contract test

패키지 자체 테스트만 통과해도 소비 앱의 bundler, RSC, CSS order에서 깨질 수 있다.

```yaml
# CI 개념
jobs:
  ui-package:
    steps:
      - run: pnpm --filter @acme/ui test
      - run: pnpm --filter @acme/ui build

  consumer-canary:
    needs: ui-package
    steps:
      - run: pnpm --filter web typecheck
      - run: pnpm --filter web build
      - run: pnpm playwright test --project=consumer-smoke
```

Next.js Server Component에서 import 가능한 entry와 client-only entry를 구분한다. package root가 무조건 `'use client'`가 되면 tree 전체가 client boundary가 될 수 있다.

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./client": "./dist/client.js",
    "./tokens": "./dist/tokens.js"
  }
}
```

---

## 23. 거버넌스와 채택률

### DS-GOV-01 — Owner와 lifecycle

모든 공개 컴포넌트에 상태를 부여한다.

```yaml
components:
  Button:
    status: stable
    owner: ui-platform
    since: 2.0.0
    replacement: null
  LegacySelect:
    status: deprecated
    owner: forms-platform
    replacement: Combobox
    removeIn: 4.0.0
  DateRangePicker:
    status: beta
    owner: analytics-ui
```

```text
experimental — API 변경 가능, 제한된 소비
beta         — 기능 완성, feedback 수집
stable       — semver 계약
deprecated   — 신규 사용 금지, 대체 경로 존재
retired      — package에서 제거
```

owner 없는 stable 컴포넌트는 FAIL(S2)이다. 결함이 생겨도 결정할 사람이 없기 때문이다.

---

### DS-GOV-02 — 기여 절차

새 컴포넌트 제안은 코드부터 시작하지 않는다.

```markdown
## Component RFC

### 문제
현재 어떤 사용자·개발자 문제가 반복되는가?

### 증거
- 로컬 구현 수:
- 소비 팀:
- 현재 우회:

### 기존 primitive로 해결할 수 없는 이유

### API 초안

### 상태 매트릭스

### 접근성 모델
name/role/value, keyboard, focus, announcement

### Responsive·i18n 내성

### Migration·채택 계획

### Owner
```

한 번만 쓰이는 도메인 UI는 디자인 시스템에 넣지 않는다. 두 제품/세 기능에서 반복되거나 명백한 primitive gap일 때 승격을 검토한다.

---

### DS-GOV-03 — 신규 코드 우회 차단

기존 부채를 한 번에 0으로 만들 수 없으면 baseline 방식으로 **새 위반만 차단**한다.

```json
{
  "rawColors": 143,
  "nativeButtons": 37,
  "deepImports": 4,
  "arbitrarySpacing": 62,
  "capturedAt": "2026-07-30"
}
```

```ts
const baseline = JSON.parse(readFileSync('design-system-baseline.json', 'utf8'));
const current = audit();

for (const key of Object.keys(baseline)) {
  if (key === 'capturedAt') continue;
  if (current[key] > baseline[key]) {
    throw new Error(`${key} regressed: ${baseline[key]} -> ${current[key]}`);
  }
}
```

baseline 감소는 허용하고 증가만 실패시킨다. 분기마다 baseline을 낮추는 목표를 세운다. 숫자를 새 현재값으로 올려 CI를 통과시키지 않는다.

---

### DS-GOV-04 — 예외 심사

예외에는 아래가 모두 필요하다.

```yaml
path: apps/web/features/editor/toolbar.tsx
rule: no-raw-spacing
reason: 2px optical alignment required by 16px custom glyph
owner: editor-platform
approvedBy: design-systems
created: 2026-07-30
expires: 2026-10-30
followUp: DS-482
```

CI에서 만료된 예외를 실패시킨다.

```ts
for (const exception of exceptions) {
  if (exception.expires && new Date(exception.expires) < new Date()) {
    errors.push(`Expired DS exception: ${exception.path} (${exception.rule})`);
  }
}
```

---

### DS-GOV-05 — 시스템 건강 지표

```markdown
| 지표 | 계산 | 목표 |
|------|------|------|
| P0 adoption | 시스템 primitive / 적용 가능 지점 | ≥ 90% |
| raw token leak | raw 값 수 / UI 파일 | 분기별 감소 |
| story coverage | story 있는 공개 컴포넌트 / 전체 | 100% |
| interaction coverage | play test 있는 interactive component / 전체 | ≥ 90% |
| a11y pass | axe PASS story / 전체 story | 100% |
| visual flake | 재실행에서 결과가 바뀐 test / 전체 | < 0.5% |
| doc freshness | 최근 API 변경 후 문서 갱신 시간 | 같은 PR |
| migration age | deprecated 후 남은 소비 지점 | 매 release 감소 |
| issue lead time | S1 접수→수정 | 합의된 SLA |
```

숫자를 목표로 만들면 왜곡될 수 있다. 예를 들어 story 수를 늘리려고 무의미한 story를 만들지 않도록 quality sample review를 병행한다.

---

### DS-GOV-06 — 기술 부채 분류

```text
Adoption debt    — 시스템이 있는데 제품이 우회
Coverage debt    — variant/state/story/test 누락
API debt         — 모호한 props, 중복 모델
Token debt       — raw 값, 의미 부족, 계층 위반
Migration debt   — deprecated 소비가 남음
Governance debt  — owner·문서·release 절차 누락
```

리포트에서 “디자인 시스템 부채”로 뭉뚱그리지 않고 위 범주로 나눈다. 해결 주체와 방법이 다르다.

---

## 24. 자동화와 Playwright

### DS-AUTO-01 — 테스트 층 분리

| 계약 | 최적 도구 | 예 |
|------|-----------|----|
| 토큰 key·alias·테마 parity | Node/Vitest | 누락 key, 순환 참조 |
| TypeScript API | tsd/expectTypeOf | 무효 prop 조합 |
| DOM·이벤트·ARIA | Testing Library | ref, label, callback |
| Story interaction | Storybook play | keyboard, 상태 변화 |
| 접근성 규칙 | axe | role, contrast 일부 |
| 좌표·portal·focus lifecycle | Playwright | clipping, trap, return |
| 전체 appearance | Playwright screenshot | variant/theme matrix |
| 소비 앱 호환 | app build + E2E | RSC, CSS order |

모든 것을 screenshot으로 검증하지 않는다. “높이 40px”은 좌표 assertion이 실패 원인을 더 잘 알려준다.

---

### DS-AUTO-02 — 전용 Playwright project

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'design-system-chromium',
      testDir: './tests/design-system',
      use: {
        browserName: 'chromium',
        baseURL: 'http://127.0.0.1:6006',
        viewport: { width: 1280, height: 900 },
        colorScheme: 'light',
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        reducedMotion: 'reduce',
      },
      snapshotPathTemplate:
        '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
    },
    {
      name: 'design-system-webkit',
      testDir: './tests/design-system/contracts',
      use: {
        browserName: 'webkit',
        baseURL: 'http://127.0.0.1:6006',
      },
    },
  ],
  webServer: {
    command: 'pnpm storybook --ci --port 6006',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Chromium은 전체 matrix, WebKit/Firefox는 동작과 알려진 렌더 차이를 중심으로 제한한다. 모든 브라우저에서 모든 픽셀 baseline을 유지하면 비용이 폭증한다.

---

### DS-AUTO-03 — Matrix story 생성기

```tsx
type Axis<T extends string> = readonly T[];

export function ComponentMatrix<
  V extends string,
  S extends string,
  Z extends string,
>({
  variants,
  states,
  sizes,
  render,
}: {
  variants: Axis<V>;
  states: Axis<S>;
  sizes: Axis<Z>;
  render: (props: { variant: V; state: S; size: Z }) => React.ReactNode;
}) {
  return (
    <div className="grid gap-6 p-6">
      {states.map(state => (
        <section key={state} aria-label={state}>
          <h2 className="mb-3 text-sm font-medium">{state}</h2>
          <div className="flex flex-wrap items-center gap-4">
            {variants.flatMap(variant =>
              sizes.map(size => (
                <div key={`${variant}-${size}`} data-cell={`${variant}-${size}-${state}`}>
                  {render({ variant, state, size })}
                </div>
              )),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
```

```tsx
export const Matrix: Story = {
  render: () => (
    <ComponentMatrix
      variants={BUTTON_VARIANTS}
      sizes={BUTTON_SIZES}
      states={['default', 'disabled', 'loading'] as const}
      render={({ variant, size, state }) => (
        <Button
          variant={variant}
          size={size}
          disabled={state === 'disabled'}
          loading={state === 'loading'}
        >
          저장
        </Button>
      )}
    />
  ),
};
```

hover/focus/active는 동시에 matrix DOM에 표현하지 말고 Playwright가 실제 pseudo-state를 트리거해 별도 캡처한다.

---

### DS-AUTO-04 — 결정론 helper

```ts
// tests/design-system/stabilize.ts
import type { Page } from '@playwright/test';

export async function stabilizeComponent(page: Page) {
  await page.clock.setFixedTime(new Date('2026-01-15T09:00:00+09:00'));

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        caret-color: transparent !important;
        animation-delay: 0s !important;
      }
    `,
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    await Promise.all(images.map(img =>
      img.complete ? img.decode().catch(() => {}) : new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      }),
    ));
  });

  await page.evaluate(() => scrollTo(0, 0));
}
```

같은 commit에서 3회 실행해 diff가 0인지 먼저 검증한다.

```bash
for i in 1 2 3; do
  pnpm playwright test --project=design-system-chromium
done
```

diff가 흔들리면 threshold를 올리지 말고 font, animation, random, image decode 원인을 제거한다.

---

### DS-AUTO-05 — State screenshot

```ts
import { test, expect } from '@playwright/test';
import { stabilizeComponent } from './stabilize';

test.describe('Button visual contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=controls-button--matrix&viewMode=story');
    await stabilizeComponent(page);
  });

  test('default matrix', async ({ page }) => {
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-matrix.png');
  });

  test('hover', async ({ page }) => {
    const target = page.locator('[data-cell="primary-md-default"] button');
    await target.hover();
    await expect(target).toHaveScreenshot('button-primary-hover.png');
  });

  test('keyboard focus', async ({ page }) => {
    const target = page.locator('[data-cell="primary-md-default"] button');
    await target.focus();
    await expect(target).toHaveScreenshot('button-primary-focus.png');
  });

  test('pressed', async ({ page }) => {
    const target = page.locator('[data-cell="primary-md-default"] button');
    await target.hover();
    await page.mouse.down();
    await expect(target).toHaveScreenshot('button-primary-pressed.png');
    await page.mouse.up();
  });
});
```

active 캡처 후 반드시 mouse up을 보장한다. `try/finally`로 정리하면 후속 테스트 오염을 막는다.

---

### DS-AUTO-06 — Console과 page error gate

```ts
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

  (page as any).__dsErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as any).__dsErrors).toEqual([]);
});
```

React controlled/uncontrolled 경고, missing key, invalid DOM nesting이 story에서 조용히 지나가지 않게 한다. 외부 라이브러리의 알려진 경고는 exact match + issue + expiry로 제한한다.

---

### DS-AUTO-07 — Coverage manifest

```ts
export const componentCoverage = {
  Button: {
    p0: true,
    stories: true,
    interaction: true,
    a11y: true,
    visual: true,
    themes: ['light', 'dark', 'high-contrast'],
    owner: 'ui-platform',
  },
  DateRangePicker: {
    p0: false,
    stories: true,
    interaction: true,
    a11y: false,
    visual: true,
    themes: ['light', 'dark'],
    owner: 'analytics-ui',
  },
} as const;
```

```ts
test('P0 components have complete coverage', () => {
  const incomplete = Object.entries(componentCoverage)
    .filter(([, c]) => c.p0)
    .filter(([, c]) =>
      !c.stories || !c.interaction || !c.a11y || !c.visual ||
      !['light', 'dark', 'high-contrast'].every(t => c.themes.includes(t as never)))
    .map(([name]) => name);

  expect(incomplete).toEqual([]);
});
```

manifest를 현실과 수동으로 중복 관리하지 않는 것이 이상적이다. story tags와 test file convention에서 생성 가능하면 생성한다.

---

## 25. Regression 절차

### Gate 1 — Binding과 생성물

```bash
pnpm tokens:build
git diff --exit-code -- packages/tokens/dist packages/ui/src/styles/tokens.css
pnpm --filter @acme/ui build
```

판정:

```text
PASS    generator 후 diff 0, package build 성공
FAIL    stale generated token, package build 실패
BLOCKED binding 경로·명령을 결정할 수 없음
```

### Gate 2 — 토큰 구조

```bash
node scripts/audit-token-alias-depth.mjs
node scripts/audit-theme-parity.mjs
pnpm vitest run tests/design-system/tokens
```

```text
[ ] 순환 alias 0
[ ] alias 최대 깊이 ≤ 3
[ ] 테마 key parity 100%
[ ] 필수 foreground/background 대비 통과
[ ] raw 값 수가 baseline보다 증가하지 않음
```

### Gate 3 — Type/API contract

```bash
pnpm --filter @acme/ui typecheck
pnpm vitest run tests/design-system/types
pnpm publint packages/ui
pnpm attw --pack packages/ui
```

`publint`와 Are the types wrong?을 사용하면 package exports, ESM/CJS, declaration 해석 결함을 배포 전에 잡을 수 있다.

### Gate 4 — Unit와 interaction

```bash
pnpm --filter @acme/ui test
pnpm storybook:build
pnpm test-storybook
```

```text
[ ] ref/native props 전달
[ ] controlled/uncontrolled
[ ] keyboard interaction
[ ] accessible name/description
[ ] loading/disabled/invalid
[ ] console/pageerror 0
```

### Gate 5 — 접근성

```bash
pnpm test-storybook -- --tags a11y
pnpm playwright test tests/design-system/accessibility
```

axe만 통과하고 keyboard test가 실패하면 FAIL이다.

### Gate 6 — 시각 매트릭스

```bash
pnpm playwright test tests/design-system/visual \
  --project=design-system-chromium
```

```text
[ ] P0 variant × size × state
[ ] light/dark/high-contrast
[ ] hover/focus/active
[ ] long content/LTR/RTL
[ ] representative container widths
```

baseline 갱신은 실패 해결이 아니다. diff를 분류하고 의도된 변경 증거와 리뷰를 남긴 뒤 별도 PR에서 갱신한다.

### Gate 7 — Cross-browser behavior

```bash
pnpm playwright test tests/design-system/contracts \
  --project=design-system-chromium \
  --project=design-system-webkit \
  --project=design-system-firefox
```

픽셀 동일성이 아니라 focus, portal, form, scroll lock, layout overflow의 동작 계약을 검증한다.

### Gate 8 — Consumer canary

```bash
pnpm --filter web typecheck
pnpm --filter web build
pnpm playwright test tests/e2e/design-system-consumer-smoke.spec.ts
```

### Gate 9 — Adoption과 신규 부채

```bash
node scripts/audit-design-system-adoption.mjs --compare-baseline
node scripts/check-design-system-exceptions.mjs
```

```text
[ ] deep import 증가 0
[ ] raw color 증가 0
[ ] native primitive 우회 증가 0
[ ] arbitrary spacing 증가 0
[ ] 만료 예외 0
```

### Gate 10 — Release readiness

```bash
pnpm changeset status --since=origin/main
pnpm pack --filter @acme/ui
node scripts/verify-package-contents.mjs
```

```text
[ ] 변경 유형에 맞는 semver
[ ] changelog에 영향·migration 기재
[ ] deprecated API 제거 시 major
[ ] pack에 source map·types·CSS 포함
[ ] 비밀·story·fixture가 package에 불필요하게 포함되지 않음
```

### Gate 11 — 최종 판정

```text
PASS    Gate 1~10 모두 통과
FAIL    하나 이상 실패. 증거와 영향 범위를 보고
BLOCKED 외부 registry/auth/환경 문제로 실행 불가. 확인한 범위와 명령 보고
```

QA 요청만 받은 경우 여기서 보고하고 멈춘다. 애플리케이션 수정은 별도 승인 후 수행한다.

---

## 26. Final Report

### 26.1 보고서 형식

````markdown
# Design System QA Report

**대상:** `@acme/ui@3.8.0` · consumer `web@<commit>`
**일시:** YYYY-MM-DD
**범위:** 토큰 284개 · 공개 컴포넌트 42개 · P0 8개
**환경:** Chromium/WebKit/Firefox · Storybook static build

## 1. 결론

**최종 판정: FAIL**

토큰 생성·타입·단위 테스트는 통과했지만, P0 `Dialog`의 WebKit focus return과
dark theme danger container 대비가 실패했다. 현재 버전 배포를 중단한다.

## 2. Gate 결과

| Gate | 판정 | 핵심 결과 |
|------|------|-----------|
| 생성물 | PASS | generator 후 diff 0 |
| 토큰 | FAIL | danger container 3.82:1 |
| Type/API | PASS | publint/attw 포함 |
| Unit/Story | PASS | 428 tests |
| 접근성 | FAIL | Dialog focus return |
| 시각 | PASS | 의도되지 않은 diff 0 |
| Cross-browser | FAIL | WebKit 1건 |
| Consumer | PASS | Next build + smoke |
| Adoption | WARN | Button 86%, 목표 90% |
| Release | BLOCKED | 위 FAIL로 실행 중단 |

## 3. Finding

### DS-F001 — Dark danger container 대비 부족 · S1

**관찰**
`--color-on-status-danger-container` / `--color-status-danger-container` 조합이
dark theme에서 3.82:1이다. 일반 크기 오류 메시지에 사용된다.

**증거**
- `tmp/qa/design-system/DS-F001-danger-contrast.json`
- `tmp/qa/design-system/DS-F001-danger-dark.png`

**영향**
오류·결제 실패 메시지 판독성이 떨어진다. 전역 토큰이므로 17개 소비 지점에 전파된다.

**원인**
dark theme foreground가 primitive red-300을 직접 alias하며 container 쌍 검증이 없었다.

**개선 원칙**
소비 컴포넌트를 개별 수정하지 않는다. semantic foreground token을 조정하고
모든 등록된 조합의 대비 회귀 테스트를 통과시킨다.

**Regression**
`tests/design-system/color-pairs.test.ts`

### DS-F002 — WebKit에서 Dialog 종료 후 focus 미복귀 · S1

(동일 형식)

## 4. 시스템 건강

| 지표 | 현재 | 목표 | 추세 |
|------|------|------|------|
| Button adoption | 86% | ≥90% | +4%p |
| Input adoption | 93% | ≥90% | +1%p |
| raw colors | 37 | 0 또는 승인 예외 | -12 |
| story coverage | 100% | 100% | 유지 |
| interaction coverage | 88% | ≥90% | +6%p |
| expired exceptions | 2 | 0 | 악화 |

## 5. 우선순위

1. **배포 전:** DS-F001, DS-F002
2. **이번 스프린트:** 만료 예외 2건 정리, DateRangePicker a11y story
3. **분기 목표:** Button adoption 90%, raw colors 20 이하

## 6. 잘 되어 있는 점

- 토큰 generator drift gate가 안정적으로 동작한다.
- P0 컴포넌트 matrix story가 타입 상수에서 자동 생성된다.
- deprecated `destructive` prop에 codemod와 제거 버전이 있다.

## 7. 한계와 BLOCKED

- 실제 npm registry publish는 수행하지 않았다.
- Windows forced-colors는 Chromium emulation만 수행했고 실기기 수동 확인은 BLOCKED.
- 브랜드 원본은 Freeze List로 수정하지 않았다.

## 8. 재현

```bash
pnpm tokens:build
pnpm test-storybook
pnpm playwright test tests/design-system
node scripts/audit-design-system-adoption.mjs --compare-baseline
```
````

### 26.2 Finding 필수 필드

```text
ID / Severity
관찰
증거
영향 범위
원인 계층 (token/API/component/consumer/governance)
개선 원칙
Regression 경로
Owner
```

“색이 이상하다”가 아니라 어떤 토큰 쌍, 어떤 테마, 몇 소비 지점, 어떤 계약이 실패했는지 쓴다.

### 26.3 보고 원칙

- 결론과 배포 가능 여부를 첫 화면에 쓴다.
- 토큰 문제와 소비자 override 문제를 구분한다.
- 시스템이 없는 문제와 시스템이 채택되지 않은 문제를 구분한다.
- 숫자는 실행 결과만 쓴다. 미실행 항목은 `NOT RUN` 또는 `BLOCKED`다.
- 잘된 계약을 적어 수정 과정에서 보존하게 한다.
- 리포트는 채팅으로 전달하고 영구 QA 리포트를 저장소에 만들지 않는다.

---

## 부록 A — 정적 감사 스크립트

### A.1 빠른 스캔

```bash
#!/usr/bin/env bash
set -uo pipefail

echo "=== DS 1. primitive palette leak ==="
rg -n '(bg|text|border)-(slate|gray|zinc|red|blue|green|amber)-[0-9]{2,3}' \
  apps --glob '*.{ts,tsx}' -g '!**/*.stories.tsx' || true

echo "=== DS 2. raw colors ==="
rg -n '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' \
  apps packages/ui/src --glob '*.{ts,tsx,css}' -g '!**/tokens/**' || true

echo "=== DS 3. arbitrary spacing ==="
rg -n '(p|m|gap|space|top|right|bottom|left)-\[[0-9.]+(px|rem)\]' \
  apps packages/ui/src --glob '*.tsx' || true

echo "=== DS 4. arbitrary shape/layer ==="
rg -n 'rounded-\[[^\]]+\]|shadow-\[[^\]]+\]|z-\[[0-9]+\]' \
  apps packages/ui/src --glob '*.tsx' || true

echo "=== DS 5. deep imports ==="
rg -n "from ['\"]@acme/ui/src|from ['\"].*packages/ui/src" \
  apps --glob '*.{ts,tsx}' || true

echo "=== DS 6. local primitive copies ==="
rg -n 'export (default )?(function|const) (Button|Input|Modal|Dialog|Badge|Select)' \
  apps --glob '*.tsx' || true

echo "=== DS 7. boolean variants ==="
rg -n 'isPrimary|isSecondary|isDanger|primary\?: boolean|danger\?: boolean' \
  packages/ui/src --glob '*.tsx' || true

echo "=== DS 8. transition-all ==="
rg -n 'transition-all' apps packages/ui/src --glob '*.{tsx,css}' || true

echo "=== DS 9. physical direction ==="
rg -n '\b(ml|mr|pl|pr|left|right)-' packages/ui/src --glob '*.tsx' || true

echo "=== DS 10. missing stories ==="
for f in packages/ui/src/components/*.tsx; do
  base="${f%.tsx}"
  [ -f "${base}.stories.tsx" ] || echo "$f"
done
```

결과가 나온다고 자동 FAIL은 아니다. 생성 파일, 브랜드, 차트, 도메인 예외를 분류하고 baseline과 비교한다.

### A.2 토큰 alias graph 검사

```ts
// scripts/audit-token-alias-depth.mjs
import { readFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync('packages/tokens/tokens.json', 'utf8'));
const flat = flatten(tokens);
const alias = /^\{(.+)\}$/;
const errors = [];

function depth(name, path = []) {
  if (path.includes(name)) {
    errors.push(`cycle: ${[...path, name].join(' -> ')}`);
    return Infinity;
  }

  const value = flat.get(name)?.$value;
  const match = typeof value === 'string' && value.match(alias);
  if (!match) return 0;
  if (!flat.has(match[1])) {
    errors.push(`missing alias: ${name} -> ${match[1]}`);
    return Infinity;
  }
  return 1 + depth(match[1], [...path, name]);
}

for (const name of flat.keys()) {
  const d = depth(name);
  if (d > 3 && Number.isFinite(d)) errors.push(`deep alias (${d}): ${name}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

function flatten(value, prefix = '', out = new Map()) {
  if (value && typeof value === 'object' && '$value' in value) {
    out.set(prefix, value);
    return out;
  }
  for (const [key, child] of Object.entries(value ?? {})) {
    flatten(child, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}
```

### A.3 Raw value baseline

```ts
// scripts/audit-ds-baseline.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseline = JSON.parse(readFileSync('design-system-baseline.json', 'utf8'));

function count(pattern, globs) {
  const args = ['-n', pattern, ...globs, '--glob', '*.{ts,tsx,css}'];
  try {
    return execFileSync('rg', args, { encoding: 'utf8' })
      .split('\n').filter(Boolean).length;
  } catch (error) {
    if (error.status === 1) return 0; // no matches
    throw error;
  }
}

const current = {
  rawColors: count('#[0-9a-fA-F]{3,8}\\b', ['apps']),
  arbitrarySpacing: count(
    '(p|m|gap|space)-\\[[0-9.]+(px|rem)\\]',
    ['apps', 'packages/ui/src'],
  ),
  deepImports: count(
    "from ['\"]@acme/ui/src",
    ['apps'],
  ),
};

const regressions = Object.entries(current)
  .filter(([key, value]) => value > baseline[key])
  .map(([key, value]) => `${key}: ${baseline[key]} -> ${value}`);

console.table({ baseline, current });
if (regressions.length) {
  console.error(`Design-system debt increased:\n${regressions.join('\n')}`);
  process.exit(1);
}
```

Shell 문자열을 직접 연결하지 않고 `execFileSync` argument 배열을 사용한다. 경로·패턴을 외부 입력에서 받는다면 allowlist로 검증한다.

### A.4 CI 예시

```yaml
name: design-system

on:
  pull_request:
    paths:
      - "packages/ui/**"
      - "packages/tokens/**"
      - "apps/web/**"
      - "tests/design-system/**"

concurrency:
  group: ds-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  static:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm tokens:build
      - run: git diff --exit-code
      - run: pnpm --filter @acme/ui typecheck
      - run: pnpm --filter @acme/ui test
      - run: node scripts/audit-ds-baseline.mjs

  storybook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm storybook:build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test-storybook
      - run: pnpm playwright test --project=design-system-chromium
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: design-system-evidence
          path: |
            test-results/
            playwright-report/
```

---

## 부록 B — Agent 체크리스트

### B.1 시작

```text
[ ] Project Binding을 실제 경로로 채웠다.
[ ] Freeze List와 생성 파일을 확인했다.
[ ] 공개 package exports와 실제 소비 import를 확인했다.
[ ] P0 컴포넌트와 지원 테마를 확정했다.
[ ] QA-only 요청인지 QA+수정 요청인지 구분했다.
```

### B.2 인벤토리

```text
[ ] 공개 컴포넌트, story, test, owner를 매핑했다.
[ ] deep import와 로컬 primitive 복제를 찾았다.
[ ] 채택률 기준선을 계산했다.
[ ] raw color/spacing/radius/shadow/z-index를 수치화했다.
[ ] 예외 manifest의 owner/reason/expiry를 확인했다.
```

### B.3 토큰

```text
[ ] 단일 source of truth와 생성 흐름을 확인했다.
[ ] primitive → semantic → component 방향을 확인했다.
[ ] alias 순환 0, 깊이 3 이하를 확인했다.
[ ] theme key parity를 확인했다.
[ ] foreground/background 쌍의 대비를 검사했다.
[ ] generator 후 git diff 0을 확인했다.
```

### B.4 컴포넌트

```text
[ ] variant/size/tone API가 닫힌 타입이다.
[ ] native props와 ref가 실제 DOM에 전달된다.
[ ] controlled/uncontrolled 계약이 명시된다.
[ ] default/hover/focus/active/disabled/loading/invalid를 확인했다.
[ ] accessible name이 상태 변화 중 유지된다.
[ ] 외부 margin을 컴포넌트가 소유하지 않는다.
[ ] container 폭과 긴 콘텐츠에서 overflow가 없다.
```

### B.5 특수 primitive

```text
[ ] Field가 label/description/error 관계를 보장한다.
[ ] Select/Combobox/Autocomplete를 의미에 맞게 구분한다.
[ ] Dialog focus trap·Escape·focus return을 확인했다.
[ ] portal이 overflow clipping을 피한다.
[ ] scroll lock이 layout shift와 배경 스크롤을 막는다.
[ ] icon-only control에 accessible name이 있다.
```

### B.6 문서·배포

```text
[ ] P0에 overview/variants/states/themes/a11y story가 있다.
[ ] interactive story에 play test가 있다.
[ ] 문서 variant가 구현 상수에서 파생된다.
[ ] changeset의 semver와 영향 설명이 정확하다.
[ ] deprecation에 대체 API·제거 버전·migration이 있다.
[ ] package pack 결과에 types/CSS가 포함된다.
[ ] 소비 앱 build와 smoke가 통과한다.
```

### B.7 최종

```text
[ ] Gate 1~10을 PASS/FAIL/BLOCKED로 판정했다.
[ ] 모든 Finding에 증거·영향 범위·원인 계층이 있다.
[ ] 잘된 계약을 기록했다.
[ ] 실행하지 않은 검사를 PASS로 쓰지 않았다.
[ ] 리포트를 먼저 전달했다.
[ ] 승인 없이 제품 코드를 수정하지 않았다.
```

### B.8 금지 사항

```text
✗ raw 값이 발견됐다는 이유만으로 자동 치환하지 않는다.
✗ 시각 diff를 보지 않고 baseline을 갱신하지 않는다.
✗ threshold 상향으로 flake를 숨기지 않는다.
✗ 동일 값이라는 이유로 의미가 다른 토큰을 합치지 않는다.
✗ 한 번 쓰는 도메인 UI를 성급하게 시스템에 넣지 않는다.
✗ className 우회를 금지하기 전에 반복 원인을 조사한다.
✗ breaking default 변경을 patch로 배포하지 않는다.
✗ 생성 CSS를 직접 편집하지 않는다.
✗ 만료일 없는 임시 예외를 만들지 않는다.
✗ QA 보고 전에 애플리케이션 코드를 수정하지 않는다.
```

---

## 다음 문서

- `08_Performance_QA.md` — Core Web Vitals, 번들, 서버·클라이언트 렌더 성능
- `09_Accessibility_QA.md` — WCAG 2.2 AA, 키보드, 스크린리더, 인지 접근성




