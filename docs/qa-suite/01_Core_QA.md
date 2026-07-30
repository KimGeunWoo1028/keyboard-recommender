# 01_Core_QA.md — Cursor QA Master Suite · Core Playbook

> **문서 등급:** ★★★★★ (Suite 전체의 진입점 / 마스터 문서)
> **대상 스택:** Next.js 14/15 App Router · React 18/19 · TypeScript · Tailwind CSS · Playwright
> **적용 범위:** 모든 SaaS 프로젝트 (이 문서는 프로젝트 비종속적으로 작성됨. §0.3의 *Project Binding Block*만 채우면 즉시 사용 가능)
> **문서 형식:** Cursor Agent가 **그대로 실행하는 명령형 매뉴얼**. 사람이 읽는 체크리스트가 아니다.
> **독립성:** 이 문서는 단독으로 완결된다. 02~09 문서는 이 문서의 특정 축(모바일/데스크톱/비주얼/자동화/UX/디자인시스템/성능/접근성)을 확대한 위성 문서다.

---

## 목차

- [0. 이 문서를 사용하는 방법](#0-이-문서를-사용하는-방법)
  - [0.1 실행 파이프라인 (7단계)](#01-실행-파이프라인-7단계)
  - [0.2 Finding ID 체계 · Severity 정의](#02-finding-id-체계--severity-정의)
  - [0.3 Project Binding Block (필수 선행 작성)](#03-project-binding-block-필수-선행-작성)
  - [0.4 각 검사 항목의 표준 서식](#04-각-검사-항목의-표준-서식)
- [1. 역할 (Role)](#1-역할-role)
- [2. 절대 원칙 (Absolute Principles)](#2-절대-원칙-absolute-principles)
- [3. Phase 0 — Repository Discovery](#3-phase-0--repository-discovery)
- [4. Phase 1 — Route Discovery](#4-phase-1--route-discovery)
- [5. Phase 2 — Component Discovery](#5-phase-2--component-discovery)
- [6. App Router QA (`C-APP-*`)](#6-app-router-qa-c-app-)
- [7. React QA (`C-RCT-*`)](#7-react-qa-c-rct-)
- [8. Tailwind QA (`C-TW-*`)](#8-tailwind-qa-c-tw-)
- [9. State QA (`C-STA-*`)](#9-state-qa-c-sta-)
- [10. Server Components QA (`C-RSC-*`)](#10-server-components-qa-c-rsc-)
- [11. Client Components QA (`C-CLI-*`)](#11-client-components-qa-c-cli-)
- [12. Suspense QA (`C-SUS-*`)](#12-suspense-qa-c-sus-)
- [13. Error Boundary QA (`C-ERR-*`)](#13-error-boundary-qa-c-err-)
- [14. Hydration QA (`C-HYD-*`)](#14-hydration-qa-c-hyd-)
- [15. Loading QA (`C-LOD-*`)](#15-loading-qa-c-lod-)
- [16. Skeleton QA (`C-SKL-*`)](#16-skeleton-qa-c-skl-)
- [17. API QA (`C-API-*`)](#17-api-qa-c-api-)
- [18. Cache QA (`C-CCH-*`)](#18-cache-qa-c-cch-)
- [19. Security QA (`C-SEC-*`)](#19-security-qa-c-sec-)
- [20. Performance QA (`C-PRF-*`)](#20-performance-qa-c-prf-)
- [21. SEO QA (`C-SEO-*`)](#21-seo-qa-c-seo-)
- [22. Accessibility QA (`C-A11Y-*`)](#22-accessibility-qa-c-a11y-)
- [23. Playwright 전략](#23-playwright-전략)
- [24. Regression Test 절차](#24-regression-test-절차)
- [25. Final Report](#25-final-report)
- [Appendix A. 명령어 치트시트](#appendix-a-명령어-치트시트)
- [Appendix B. 재현 불가(Not Reproducible) 처리 규약](#appendix-b-재현-불가not-reproducible-처리-규약)
- [Appendix C. 문서 간 연계 맵](#appendix-c-문서-간-연계-맵)
- [부록 D. Agent 실행 체크리스트](#부록-d-agent-실행-체크리스트-복사해서-진행-상황-추적)

---

## 0. 이 문서를 사용하는 방법

이 문서는 **읽는 문서가 아니라 실행하는 문서**다. Agent는 아래 순서를 그대로 수행한다.

### 0.1 실행 파이프라인 (7단계)

```
[1] Discovery        레포/라우트/컴포넌트 지도 작성 (§3–§5)
      ↓              산출물: Route Inventory, Component Inventory, Freeze List
[2] Static Sweep     §6–§22 정적 검사 (grep/tsc/lint/build 기반)
      ↓              산출물: Finding 후보 목록 (ID·Severity 부여, 미확정)
[3] Reproduce        각 Finding 후보를 실제 런타임에서 재현 (Playwright/브라우저/curl)
      ↓              재현 실패 → Appendix B 규약으로 강등 또는 폐기
[4] Root Cause       코드 경로 추적 → "왜 발생하는가" 1문단 서술 (증상 서술 금지)
      ↓              산출물: 파일:라인 단위 원인 지목
[5] Fix              §각 항목의 "수정 원칙"에 따라 최소 변경으로 수정
      ↓              금지: 증상 은폐(try/catch 삼키기, suppressHydrationWarning 남용, any 캐스팅)
[6] Verify           수정한 항목만 재검증 → 실패 시 [4]로 복귀 (최대 3회, 이후 ESCALATE)
      ↓              산출물: 재현 절차가 이제 PASS임을 증명하는 로그/스크린샷
[7] Regression       §24 절차로 전체 회귀 → Final Report(§25) 작성
```

**단계 건너뛰기 금지.** 특히 `[3] Reproduce` 없이 `[5] Fix`로 가는 것을 절대 금지한다. 정적 grep 히트는 "가설"이고, 재현된 것만 "버그"다. 재현 없이 수정하면 (a) 존재하지 않는 버그를 고치고, (b) 회귀를 만들고, (c) 리포트 신뢰도를 파괴한다.

### 0.2 Finding ID 체계 · Severity 정의

**ID 형식:** `<DOC>-<AREA>-<NN>` → 예: `C-HYD-03`, `C-SEC-07`
`C` = Core(이 문서). 위성 문서는 `M`(Mobile), `D`(Desktop), `V`(Visual), `P`(Playwright), `U`(UX), `DS`(Design System), `PF`(Performance), `A`(A11y)를 쓴다.

**리포트에 기록할 실제 발견 항목은 `F-###` 순번을 별도로 부여**하고, 어떤 검사 항목(`C-*`)에서 나왔는지 연결한다.

| Severity | 정의 | 판단 기준 (하나라도 해당) | 처리 |
|----------|------|--------------------------|------|
| **S0 Blocker** | 핵심 플로우가 동작 불가 | 프로덕션 빌드 실패 · 주요 라우트 500/무한 로딩 · 인증 우회 · 데이터 파괴 · 결제 실패 | 즉시 수정. 다른 작업 중단 |
| **S1 Critical** | 핵심 플로우가 특정 조건에서 붕괴 | 제출 후 결과 유실 · hydration mismatch로 인터랙션 사망 · 시크릿 클라이언트 노출 · 키보드로 모달 탈출 불가 · LCP > 4s (모바일 4G) | 같은 QA 사이클 내 수정 |
| **S2 Major** | 사용 가능하지만 명확한 품질 결함 | 에러 메시지 없음 · 로딩 상태 없음(>500ms) · 레이아웃 깨짐(주요 뷰포트) · 대비 3:1 미만 본문 · 불필요 클라이언트 번들 대형화 | 계획된 수정 |
| **S3 Minor** | 일관성/폴리시 위반 | 토큰 미사용 하드코딩 색상 · 스켈레톤 형태 불일치 · alt 텍스트 품질 · 미세 정렬 | 백로그 |
| **S4 Nit** | 취향/미세 개선 | 네이밍, 주석, 미사용 export | 선택 |

**Severity 상향 규칙:** 동일 결함이 (a) 인증/결제/데이터 저장 경로에 있거나, (b) 모바일 최다 사용 뷰포트에서 발생하면 한 단계 올린다.

### 0.3 Project Binding Block (필수 선행 작성)

QA 시작 전, Agent는 아래 블록을 **실측으로** 채워 리포트 최상단에 붙인다. 추측 금지 — 파일을 열어 확인한다.

```yaml
# ── Project Binding (QA 시작 시 실측으로 채운다) ─────────────────
app_root:            # 예: frontend/
router:              # app | pages | hybrid
react_version:       # package.json 실측
next_version:        # package.json 실측
tailwind_version:    # 3.x | 4.x (설정 위치가 다름)
styling:             # tailwind + cva? tailwind-merge? css modules 병용?
state_lib:           # none | zustand | redux | jotai | react-query | swr ...
data_fetch:          # server fetch | route handler | 외부 API base URL
auth:                # none | cookie session | JWT | next-auth | 외부 IdP
package_manager:     # npm | pnpm | yarn | bun
commands:
  lint:              # 예: npm run lint
  typecheck:         # 예: npx tsc --noEmit  (typecheck 스크립트 없을 수 있음)
  unit:              # 예: npm test
  build:             # 예: npm run build
  e2e:               # 예: cd e2e && npm test
  dev:               # 예: npm run dev  (포트 명시)
ports:
  web:               # 예: 3000
  api:               # 예: 8000 (e2e) / 8010 (local dev)  ← 혼용 주의
e2e_root:            # 예: e2e/  (playwright.config.* 위치)
report_output:       # 채팅 리포트 우선. 파일이 필요하면 tmp/qa/<date>/ 하위
freeze_list:         # 손대면 안 되는 파일/디렉터리 (아래 규칙 참조)
  - # 예: **/layout-diagram-definitions.ts (기하학 데이터 — 운영자 명시 요청 없이 수정 금지)
  - # 예: public/**/*.svg (디자인 산출물)
  - # 예: *_generated.*, *.snap (생성물 — 원본을 고쳐라)
```

**Freeze List 규칙:** 아래는 QA 중 **절대 임의 수정 금지**. 문제를 발견하면 Finding으로만 보고한다.

1. 생성물(generated) 파일 — 원본 생성기를 수정한다.
2. 시각 기준선(baseline) 스냅샷 — 의도된 변경임을 사람이 승인한 뒤에만 갱신한다.
3. 좌표/기하학 데이터, 디자인 원본 자산(SVG/GLB/폰트).
4. 마이그레이션 히스토리, 시드/프로덕션 데이터 파일.
5. 프로젝트 룰(`.cursor/rules/**`)이 명시적으로 잠근 파일.

### 0.4 각 검사 항목의 표준 서식

§6부터 모든 검사 항목은 아래 6블록을 갖는다. Agent는 각 블록을 순서대로 수행한다.

| 블록 | 의미 | Agent 행동 |
|------|------|-----------|
| **WHY** | 왜 검사하는가 (실패 시 사용자에게 발생하는 실제 피해) | 읽고 Severity 판단 근거로 사용 |
| **DETECT** | 정적 탐지 절차 (grep/명령/파일 읽기) | 그대로 실행. 히트 = 가설 |
| **REPRODUCE** | 런타임 재현 절차 | 그대로 실행. 재현 = 확정 |
| **PASS/FAIL** | 판정 기준 (모호함 없는 문장) | 이 문장에 대입해서만 판정 |
| **FIX** | 수정 원칙 (무엇을 고치고 무엇을 고치지 않는가) | 최소 변경 원칙 준수 |
| **BAD / GOOD** | 잘못된 구현 / 올바른 구현 코드 | 수정 결과가 GOOD 형태에 수렴하는지 확인 |
| **REGRESSION HOOK** | 이 결함을 영구 차단하는 자동 테스트 | §24에 따라 테스트 추가 |

---

## 1. 역할 (Role)

너는 이 QA 세션 동안 아래 6개 역할을 **동시에** 수행한다. 역할별 판단이 충돌하면 §2의 우선순위로 해결한다.

### 1.1 Principal Frontend Engineer (15y+)

- 코드가 "동작하는가"가 아니라 **"6개월 뒤에도 안전하게 바뀔 수 있는가"**를 본다.
- 모든 Finding에 대해 파일:라인 단위 원인을 지목한다. "어딘가 상태 문제 같다" 는 금지.
- 프레임워크의 **의도된 사용법**(App Router의 서버 우선, RSC 경계, 캐시 계층)을 기준으로 판정한다. 개인 취향으로 판정하지 않는다.
- 수정은 **최소 표면적**으로. 리팩터링 욕구와 버그 수정을 분리한다. 리팩터링이 필요하면 별도 Finding(S3)으로 제안한다.

### 1.2 UX Auditor

- 화면을 "요소의 집합"이 아니라 **사용자 의도의 흐름**으로 본다: 진입 → 이해 → 행동 → 피드백 → 다음 행동.
- 모든 상태를 4종으로 강제 점검한다: **Empty / Loading / Error / Success**. 하나라도 미구현이면 Finding.
- "사용자가 지금 무슨 일이 일어나는지 아는가?", "실패했을 때 다음에 뭘 해야 하는지 아는가?" 두 질문에 답할 수 없으면 S2 이상.

### 1.3 QA Lead

- **재현 절차 없는 버그 리포트를 작성하지 않는다.** 재현 절차는 3자가 그대로 따라 할 수 있어야 한다.
- 각 검사에 PASS / FAIL / **BLOCKED**(실행 불가) 세 판정만 사용한다. "아마 괜찮음" 금지.
- FAIL이 나와도 독립적인 나머지 검사를 계속 수행해 **리포트를 완결**시킨다(조기 종료 금지).
- 수정 후에는 **수정 항목 + 인접 회귀면**을 재검증한다(§24).

### 1.4 Accessibility Expert

- 기준은 취향이 아니라 **WCAG 2.2 AA**다. 위반은 조항 번호로 인용한다(예: 2.4.7 Focus Visible).
- 마우스로 할 수 있는 모든 것은 **키보드로만** 가능해야 한다. 실제로 Tab/Shift+Tab/Enter/Space/Esc/화살표로 시도한다.
- 스크린리더 관점에서 **접근가능한 이름(accessible name)**과 **역할(role)**을 확인한다. 시각적 라벨만으로 통과시키지 않는다.

### 1.5 Performance Engineer

- 체감이 아니라 **측정값**으로 말한다: LCP / CLS / INP / TTFB / 전송 바이트 / 하이드레이션 대상 JS.
- 모바일 중위 기기(4x CPU throttle, Fast 3G~4G)를 기준선으로 삼는다. 개발 머신 로컬 수치를 근거로 PASS 하지 않는다.
- 최적화는 **가장 큰 병목 하나**부터. 마이크로 최적화 나열을 리포트에 넣지 않는다.

### 1.6 Playwright Automation Engineer

- 발견한 모든 S0/S1/S2 결함에 대해 **결함을 재현하는 실패 테스트를 먼저 작성**한다(red → green).
- 셀렉터는 `getByRole` > `getByLabel` > `getByTestId` 순으로 쓴다. CSS 클래스/nth-child 셀렉터 금지.
- `waitForTimeout` 금지. 웹 우선 assertion(`expect(locator).toBeVisible()`)과 명시적 조건 대기만 사용한다.
- 테스트는 **결정적(deterministic)**이어야 한다. 플레이크는 버그로 취급하고 원인을 제거한다(§23.6).

---

## 2. 절대 원칙 (Absolute Principles)

아래 원칙은 우선순위 순서다. 충돌 시 **번호가 작은 쪽이 이긴다.**

### P1. 재현 없는 수정 금지

정적 분석 히트는 가설이다. 런타임에서 재현하지 못한 항목은 `NOT_REPRODUCED`로 표기하고 코드를 건드리지 않는다(Appendix B).

- ❌ "grep으로 `useEffect` 안에 `setState`가 보이니 무한 루프일 것이다" → 수정
- ✅ 해당 화면을 열고 React DevTools / 콘솔 렌더 카운터로 렌더 폭주를 관측 → 수정

### P2. 증상 은폐 금지 (No Symptom Suppression)

경고/에러를 **끄는 것**은 수정이 아니다. 아래는 모두 원인 제거 없이 사용 금지:

```tsx
// ❌ 금지 목록
suppressHydrationWarning        // 원인 미제거 시 (예외: 의도된 시간/랜덤 노드 1곳)
// eslint-disable-next-line     // 사유 주석 없는 경우
@ts-ignore / @ts-expect-error   // 사유 주석 없는 경우
as any / as unknown as X        // 타입 불일치 은폐
try { ... } catch {}            // 빈 catch — 에러 삼키기
console.error 억제 / 필터링      // 테스트 통과 목적
```

허용되는 유일한 경로: **원인을 제거**하거나, 제거 불가 시 **사유 + 링크 + 만료 조건**을 주석으로 남기고 Finding으로 보고한다.

### P3. 최소 변경 (Minimal Diff)

한 Finding = 한 논리적 수정. 같은 커밋에 무관한 포맷팅/리네임/구조 개편을 섞지 않는다. 파일 전체 리포맷은 diff를 리뷰 불가능하게 만들어 회귀 원인이 된다.

### P4. Freeze List 존중

§0.3의 freeze 대상은 읽기만 한다. 문제 발견 시 Finding으로 보고하고 **운영자 승인 후**에만 수정한다.

### P5. 보고 우선, 수정은 그다음 (Report Before Fix)

전체 스윕이 끝나기 전에 코드를 고치기 시작하면 (a) 리포트가 편향되고 (b) 어떤 수정이 어떤 결과를 냈는지 추적 불가해진다. **예외:** S0 Blocker는 즉시 수정하되, 리포트에 "스윕 중 즉시 수정" 사실을 명시한다.

### P6. 데이터 파괴 금지

QA 중 아래 명령은 금지: 프로덕션/스테이징 DB 마이그레이션, 시드 덮어쓰기(`--apply`, `--write`, `--force` 계열), 강제 푸시, 브랜치 삭제, `rm -rf` 광역 삭제. dry-run/read-only 모드만 사용한다.

### P7. 측정 없는 성능 주장 금지

"이게 더 빠를 것이다"는 리포트에 쓰지 않는다. before/after 수치를 붙인다. 측정 불가면 `BLOCKED(측정 도구 없음)`으로 보고한다.

### P8. 판정은 세 가지만

`PASS` / `FAIL` / `BLOCKED`. 부분 통과는 FAIL이고, 실행 불가는 BLOCKED다. 조용히 건너뛰기 금지.

### P9. 리포트는 채팅에 (영구 파일 남기지 않기)

QA 결과 리포트는 §25 템플릿으로 **채팅에 출력**한다. 리포트 파일을 리포지토리에 상주시키지 않는다(오래된 QA 문서가 사실의 원천으로 오해되는 것을 막는다). 산출물(스크린샷/트레이스)이 필요하면 `tmp/qa/<YYYY-MM-DD>/`에 두고 커밋하지 않는다.

### P10. 사용자 언어로 보고

사용자가 한국어로 요청하면 리포트도 한국어. 기술 용어는 원어 유지(hydration, RSC, LCP 등).

---

## 3. Phase 0 — Repository Discovery

**목적:** 무엇을 QA하는지 모르는 상태로 검사하지 않는다. 이 단계 산출물이 이후 모든 판정의 기준이 된다.

### 3.1 절차

```bash
# 1) 스택 실측 — 추측 금지
cat package.json                       # deps/scripts/packageManager
ls next.config.* tailwind.config.* postcss.config.* tsconfig.json
cat tsconfig.json                      # strict, paths, moduleResolution
ls .eslintrc* eslint.config.*
ls .github/workflows/                  # CI가 무엇을 gate 하는지 = 최소 기준선

# 2) 라우터 판별
ls src/app app 2>/dev/null             # App Router
ls src/pages pages 2>/dev/null         # Pages Router (혼용 여부 확인)

# 3) 테스트 인프라 실측
ls vitest.config.* jest.config.* playwright.config.*
ls e2e tests __tests__ 2>/dev/null

# 4) 환경 변수 계약
cat .env.example                       # 필수 키 목록
rg -n "process\.env\.[A-Z_]+" --glob '!node_modules' -o | sort -u
#   → .env.example에 없는 키 = 문서화 누락 Finding 후보 (C-SEC-05)

# 5) 크기 파악 (검사 예산 배분용)
rg --files --glob '*.{ts,tsx}' | wc -l
rg -l "^\s*['\"]use client['\"]" --glob '*.{ts,tsx}' | wc -l
```

### 3.2 판정

| 항목 | PASS 기준 | 실패 시 |
|------|-----------|---------|
| `tsconfig.strict` | `true` | `C-RCT-01` Finding (S2) — strict 미적용은 전 검사 신뢰도를 떨어뜨림 |
| CI workflow 존재 | lint+typecheck+test+build 최소 4개 gate | Finding (S2). CI가 없으면 로컬 gate가 유일한 방어선 |
| `.env.example` 완전성 | 코드가 읽는 모든 `process.env` 키 존재 | `C-SEC-05` Finding |
| 라우터 혼용 | 단일 라우터 | 혼용은 캐시/레이아웃 이중 규칙 → 정밀 검사 필요 표시 |

### 3.3 산출물: Stack Fact Sheet

```markdown
### Stack Fact Sheet
| 항목 | 값 | 근거 |
|------|-----|------|
| Next | 15.1.0 | frontend/package.json:24 |
| React | 19.0.0 | frontend/package.json:25 |
| Router | app | frontend/src/app/ 존재, pages/ 없음 |
| Tailwind | 3.4.15 | tailwind.config.ts 존재 |
| strict | true | tsconfig.json:6 |
| CI gates | lint, tsc, vitest, build, e2e | .github/workflows/ci.yml |
| 'use client' 파일 수 | 41 / 210 (19.5%) | rg 카운트 |
```

**해석 규칙:** `'use client'` 비율이 40%를 넘으면 §10 Server Components 검사를 **정밀 모드**로 격상한다(RSC 이점을 잃고 있을 가능성이 높다).

---

## 4. Phase 1 — Route Discovery

**목적:** "모든 화면"을 검사한다는 말은 라우트 목록이 확정될 때만 성립한다. 라우트 인벤토리 없이 시작한 QA는 반드시 화면을 빠뜨린다.

### 4.1 절차

```bash
# 1) 정적 라우트 트리 추출 (App Router)
rg --files src/app app 2>/dev/null | rg "(page|layout|template|loading|error|not-found|route|default)\.(tsx?|jsx?)$" | sort

# 2) 동적 세그먼트 식별
rg --files src/app | rg "\[.+\]"        # [id], [...slug], [[...opt]]

# 3) 라우트 그룹 / 병렬 / 인터셉트
rg --files src/app | rg "\((\w|-)+\)"   # (marketing) 등 그룹
rg --files src/app | rg "@\w+"          # @modal 병렬 라우트
rg --files src/app | rg "\(\.\)|\(\.\.\)|\(\.\.\.\)"  # 인터셉트 라우트

# 4) 라우트 핸들러(API) 목록
rg --files src/app | rg "route\.(ts|js)$"

# 5) 미들웨어 보호 범위
cat middleware.ts src/middleware.ts 2>/dev/null   # matcher / 리다이렉트 규칙

# 6) 실제 빌드 결과와 교차 검증 (가장 신뢰도 높음)
npm run build    # 출력의 Route 표: ○ Static / ● SSG / ƒ Dynamic + First Load JS
```

`npm run build`의 라우트 표는 **정적 파일 목록보다 신뢰도가 높다.** 실제 렌더 모드와 번들 크기를 동시에 준다. 반드시 캡처한다.

### 4.2 산출물: Route Inventory (모든 후속 검사의 좌표계)

```markdown
### Route Inventory
| # | Path | 렌더모드 | Auth | loading.tsx | error.tsx | 상태 4종 | First Load JS | 검사 우선순위 |
|---|------|---------|------|-------------|-----------|----------|---------------|--------------|
| 1 | `/` | Static | public | – | ✅ | E:n/a L:✅ E:✅ S:✅ | 112 kB | P0 |
| 2 | `/pricing` | Static | public | – | ❌ | … | 98 kB | P1 |
| 3 | `/dashboard` | Dynamic | required | ✅ | ✅ | … | 184 kB | P0 |
| 4 | `/dashboard/[id]` | Dynamic | required | ❌ | ❌ | … | 190 kB | P0 |
| 5 | `/api/webhook` | Handler | signed | – | – | – | – | P0 |
```

**우선순위 규칙 (P0 → P2):**

- **P0:** 인증/결제/데이터 저장·삭제/온보딩 첫 화면/최다 트래픽 랜딩. 전 항목 정밀 검사.
- **P1:** 조회·탐색 화면(목록/상세/검색). 핵심 항목 검사.
- **P2:** 정적 문서/법적 고지/404. 스모크만.

### 4.3 라우트별 최소 스모크 (모든 라우트 예외 없이)

각 라우트에 대해 아래 6개를 수행하고 결과를 인벤토리에 기록한다.

```
[ ] 1. 콜드 로드: 새 시크릿 컨텍스트에서 직접 URL 진입 → 200 + 의미 있는 콘텐츠 렌더
[ ] 2. 콘솔: error/warning 0건 (특히 hydration, key, act, Maximum update depth)
[ ] 3. 새로고침(F5): 상태 유실로 인한 빈 화면/무한 로딩 없음
[ ] 4. 뒤로/앞으로: 스크롤 및 폼 상태가 기대대로 복원
[ ] 5. 딥링크: 클라이언트 내 이동이 아닌 직접 진입에서도 동일 화면 (SSR 전제 누락 탐지)
[ ] 6. 인증 경계: 비로그인 진입 시 리다이렉트/에러 처리 (보호 라우트) — 화면 깜빡임 후 노출 금지
```

> **`5. 딥링크`가 특히 중요한 이유:** 클라이언트 네비게이션으로만 도달하는 화면은 라우터가 앞 화면의 상태를 들고 있어 우연히 동작한다. 사용자는 링크를 공유하고 새로고침한다. 직접 진입 실패는 거의 항상 S1이다.

---

## 5. Phase 2 — Component Discovery

**목적:** 라우트가 "어디"라면 컴포넌트는 "무엇"이다. 결함은 대개 재사용 컴포넌트에 있고, 한 번 고치면 여러 라우트가 동시에 낫는다.

### 5.1 절차

```bash
# 1) 컴포넌트 목록과 경계 분류
rg --files --glob '*.tsx' src | sort
rg -l "^\s*['\"]use client['\"]" --glob '*.tsx' src | sort     # 클라이언트 경계
rg -l "^\s*['\"]use server['\"]" --glob '*.ts*' src | sort     # 서버 액션
rg -l "server-only|next/headers|cookies\(\)" src               # 서버 전용

# 2) 재사용도(중요도) 측정 — import 카운트 상위가 곧 QA 우선순위
rg -o "from ['\"][^'\"]*/(\w+)['\"]" -r '$1' src | sort | uniq -c | sort -rn | head -40

# 3) 위험 신호 정적 스캔 (각 히트는 §6~§22의 해당 항목으로 라우팅)
rg -n "useEffect\(" src | wc -l                       # → §7 C-RCT-04
rg -n "dangerouslySetInnerHTML" src                    # → §19 C-SEC-02
rg -n "window\.|document\.|localStorage|navigator\." src   # → §14 C-HYD-02
rg -n "new Date\(\)|Date\.now\(\)|Math\.random\(\)" src     # → §14 C-HYD-01
rg -n "useState<any>|: any\b|as any" src               # → §7 C-RCT-01
rg -n "z-\[?[0-9]{3,}" src                             # → §8 C-TW-05 (z-index 무정부)
rg -n "onClick" src --glob '*.tsx' | rg -v "button|Button|role=" # → §22 C-A11Y-02
rg -n "<img " src                                      # → §20 C-PRF-04
rg -n "process\.env\." src | rg -v "NEXT_PUBLIC_"      # → §19 C-SEC-01

# 4) 거대 컴포넌트 (결함 밀도 최상위)
for f in $(rg --files --glob '*.tsx' src); do echo "$(wc -l < $f) $f"; done | sort -rn | head -20
```

### 5.2 산출물: Component Inventory

```markdown
### Component Inventory (상위 위험도)
| 컴포넌트 | 경계 | LOC | import 횟수 | 위험 신호 | 담당 검사 |
|----------|------|-----|------------|-----------|-----------|
| `SurveyWizard` | client | 640 | 3 | useEffect×9, 로컬 상태 12개 | C-RCT-04, C-STA-02 |
| `Header` | client | 210 | 전역 | theme mismatch 위험 | C-HYD-03 |
| `ResultCard` | server | 180 | 12 | `<img>` 사용 | C-PRF-04 |
| `Modal` | client | 95 | 8 | focus trap 없음 | C-A11Y-03 |
```

### 5.3 검사 예산 배분 규칙

시간이 무한하지 않다. 아래 순서로 예산을 쓴다.

1. P0 라우트 × 상위 재사용 컴포넌트 교집합 (전체 결함의 대부분이 여기 있다)
2. LOC 상위 10 컴포넌트 (복잡도 = 결함 밀도)
3. 최근 변경 파일 (`git log --since='14 days' --name-only --pretty=format: | sort -u`) — 회귀는 신규 변경에서 온다
4. 나머지는 스모크

---

## 6. App Router QA (`C-APP-*`)

App Router는 "폴더 = 라우트"라는 단순한 규칙 뒤에 **렌더 모드 · 캐시 · 스트리밍 · 경계**라는 네 개의 암묵적 계약을 숨기고 있다. 이 계약 위반은 로컬에서는 조용하고 프로덕션에서 터진다. 여기가 Core QA에서 가장 높은 ROI 구간이다.

### C-APP-01 — 필수 특수 파일(loading/error/not-found) 존재

**WHY**
`error.tsx`가 없는 세그먼트에서 렌더 에러가 발생하면 상위 경계까지 올라가 **화면 전체가 날아간다**. 사용자는 흰 화면을 보고, 복구 수단(다시 시도 버튼)조차 없다. `loading.tsx`가 없는 dynamic 세그먼트는 데이터가 준비될 때까지 **아무 반응이 없다** — 사용자는 클릭이 씹혔다고 판단하고 이탈하거나 중복 클릭한다. `not-found.tsx`가 없으면 잘못된 ID 딥링크가 500처럼 보인다.

**DETECT**

```bash
# 라우트 세그먼트별 특수 파일 매트릭스 작성
rg --files src/app | rg "(page|layout|loading|error|not-found)\.tsx$" | sort
# dynamic 세그먼트 목록과 교차: 데이터를 await 하는 page에 loading/error가 있는지
rg -l "await\s+(fetch|db|prisma|sql|api)" src/app --glob 'page.tsx'
```

**REPRODUCE**

1. `error.tsx` 없는 세그먼트의 `page.tsx` 데이터 호출을 일시적으로 실패시킨다(잘못된 URL 또는 `throw new Error('QA')` 임시 삽입).
2. 브라우저로 해당 라우트 진입 → 화면이 완전히 비는지, 상위 레이아웃(헤더/네비)까지 사라지는지 관찰.
3. 임시 코드를 **반드시 원복**한다.
4. `loading` 검사: DevTools Network를 Slow 3G로 두고 해당 라우트로 클라이언트 네비게이션 → 500ms 이상 무반응이면 FAIL.

**PASS/FAIL**

- **PASS:** 데이터를 `await` 하는 모든 세그먼트에 `loading.tsx`(또는 상위 `Suspense`)가 있고, 사용자 데이터를 렌더하는 모든 세그먼트에 `error.tsx`가 있으며, 동적 ID 라우트에 `not-found` 경로가 있다.
- **FAIL:** 위 중 하나라도 없고 §REPRODUCE에서 흰 화면 또는 500ms+ 무반응이 관측된다.

**FIX**

- 루트에 전역 `error.tsx` + `not-found.tsx`를 두는 것은 **바닥선**이지, 세그먼트 대책이 아니다. 실패해도 나머지 UI가 살아야 하는 지점(대시보드 위젯, 결과 패널)마다 **국소 경계**를 둔다.
- `loading.tsx`는 §16 스켈레톤 규칙을 따른다(레이아웃 동일 형태). 스피너 하나로 전체 화면을 덮지 않는다.
- 전역 레이아웃 자체의 실패는 `global-error.tsx`로만 잡힌다 — 인증/테마 프로바이더가 레이아웃에 있으면 필수.

**BAD**

```tsx
// ❌ app/dashboard/[id]/page.tsx — 경계 없음. 실패하면 전 화면 소실
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetch(`${process.env.API}/items/${id}`).then(r => r.json());
  return <ItemDetail data={data} />;   // 404? 500? 파싱 실패? 전부 상위로 던져짐
}
```

**GOOD**

```tsx
// ✅ app/dashboard/[id]/page.tsx
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.API}/items/${id}`, { next: { revalidate: 60 } });

  if (res.status === 404) notFound();          // → not-found.tsx (의미 있는 4xx 분기)
  if (!res.ok) throw new Error(`items ${res.status}`);  // → error.tsx (복구 UI)

  return <ItemDetail data={await res.json()} />;
}

// ✅ app/dashboard/[id]/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="space-y-3 p-6">
      <h2 className="text-lg font-semibold">항목을 불러오지 못했습니다</h2>
      <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <button onClick={reset} className="rounded-md border px-3 py-2">다시 시도</button>
    </div>
  );
}

// ✅ app/dashboard/[id]/loading.tsx  — 실제 레이아웃과 같은 골격
export default function Loading() {
  return <ItemDetailSkeleton />;
}
```

**REGRESSION HOOK**

```ts
// e2e/tests/route-boundaries.spec.ts
test('존재하지 않는 항목은 not-found UI를 보여준다 (500 아님)', async ({ page }) => {
  const res = await page.goto('/dashboard/does-not-exist-999');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /찾을 수 없|not found/i })).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();  // 셸이 살아있다
});
```

---

### C-APP-02 — 레이아웃/템플릿 오용 (상태 유실 및 재마운트)

**WHY**
`layout.tsx`는 자식 라우트 전환 간 **상태를 유지**한다. `template.tsx`는 매 전환마다 **재마운트**한다. 이 둘을 잘못 고르면, (a) 유지되어야 할 사이드바 스크롤/폼 입력이 매번 초기화되거나, (b) 초기화되어야 할 진입 애니메이션/스텝 상태가 남아 다음 화면을 오염시킨다. 또한 레이아웃에 데이터 fetch를 넣으면 **모든 자식 라우트가 그 지연을 상속**한다.

**DETECT**

```bash
rg --files src/app | rg "(layout|template)\.tsx$"
rg -n "^\s*['\"]use client['\"]" src/app --glob 'layout.tsx'    # 레이아웃이 클라이언트면 트리 전체 영향
rg -n "await " src/app --glob 'layout.tsx'                      # 레이아웃 내 데이터 대기
```

**REPRODUCE**

1. 같은 레이아웃을 공유하는 두 라우트(`/dashboard/a` ↔ `/dashboard/b`)를 준비.
2. 레이아웃 영역(사이드바)을 스크롤하고 검색창에 텍스트 입력.
3. 라우트 전환 → 스크롤/입력이 유지되는가? 유지되어야 하는데 초기화되면 `template.tsx` 오용 또는 레이아웃 내 `key` 변경 의심.
4. 반대로, 스텝 위젯/애니메이션이 리셋되어야 하는데 이전 상태가 남아 있으면 `layout` 오용.
5. 레이아웃 fetch 검사: 레이아웃이 호출하는 API를 3초 지연시키고 **자식 라우트 전부**가 함께 늦어지는지 확인.

**PASS/FAIL**

- **PASS:** 전환 간 유지 대상(네비/사이드바/플레이어/토스트)은 유지되고, 초기화 대상(진입 애니메이션/스텝)은 초기화된다. 레이아웃은 전 자식이 공통으로 필요한 데이터만 await 한다.
- **FAIL:** 유지/초기화 기대가 어긋난다. 또는 특정 자식만 필요한 데이터를 레이아웃에서 await 해 전 라우트 TTFB가 늘어난다.

**FIX**

- 재마운트가 필요한 경우에만 `template.tsx`를 쓴다. "애니메이션을 다시 재생하려고" 레이아웃에 `key={pathname}`을 박는 것은 상태 유실의 흔한 원인 — 애니메이션은 자식 컴포넌트 레벨에서 처리한다.
- 레이아웃의 데이터는 **모든 자식에게 공통**이고 캐시 가능한 것만. 라우트 특화 데이터는 해당 `page.tsx`로 내린다.
- 레이아웃을 `'use client'`로 만들지 않는다. 필요한 인터랙션(테마/모바일 메뉴)은 작은 클라이언트 컴포넌트로 격리한다.

**BAD**

```tsx
// ❌ app/dashboard/layout.tsx — 클라이언트 + 라우트 특화 fetch + pathname key
'use client';
export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: billing } = useSWR('/api/billing');     // /settings에서만 필요한 데이터
  return (
    <div key={pathname}>                                 {/* 전환마다 사이드바 전체 재마운트 */}
      <Sidebar billing={billing} />
      {children}
    </div>
  );
}
```

**GOOD**

```tsx
// ✅ app/dashboard/layout.tsx — 서버 컴포넌트, 공통 데이터만, key 없음
import { Suspense } from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const nav = await getNavForUser();          // 전 자식 공통 + 캐시 가능
  return (
    <div className="grid grid-cols-[16rem_1fr]">
      <Sidebar nav={nav} />                    {/* 전환 간 상태 유지 */}
      <main id="main" className="min-w-0">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

// ✅ 라우트 특화 데이터는 해당 page에서
// app/dashboard/settings/page.tsx
export default async function Page() {
  const billing = await getBilling();
  return <BillingPanel billing={billing} />;
}
```

**REGRESSION HOOK**

```ts
test('라우트 전환 시 사이드바 검색 입력이 유지된다', async ({ page }) => {
  await page.goto('/dashboard/a');
  await page.getByRole('searchbox', { name: /검색/ }).fill('keep-me');
  await page.getByRole('link', { name: 'B' }).click();
  await expect(page.getByRole('searchbox', { name: /검색/ })).toHaveValue('keep-me');
});
```

---

### C-APP-03 — 네비게이션 수단 오용 (`<a>` vs `<Link>` vs `router.push`)

**WHY**
내부 이동에 생 `<a href>`를 쓰면 **전체 문서 리로드**가 발생한다. 클라이언트 상태·캐시가 날아가고, 체감 속도가 SPA 대비 수 배 느려지며, 스크롤 위치가 초기화된다. 반대로 외부 링크에 `<Link>`를 쓰면 불필요한 프리페치가 발생하고, `target="_blank"`에 `rel="noopener"`가 없으면 보안 문제(§19)가 된다. `router.push`를 버튼에 쓰면 링크가 아니게 되어 **새 탭으로 열기·복사·크롤링**이 모두 불가능해진다(§22 접근성 위반 동반).

**DETECT**

```bash
rg -n "<a\s+href=[\"']/" src --glob '*.tsx'                # 내부 경로에 생 <a>
rg -n "target=[\"']_blank[\"']" src -A1 | rg -v "noopener"  # rel 누락
rg -n "router\.push\(" src --glob '*.tsx'                   # 링크여야 할 것 확인
```

**REPRODUCE**

1. 의심 링크 클릭 → DevTools Network에서 **document 요청이 새로 발생**하면 전체 리로드(FAIL).
2. 링크에 우클릭 → "새 탭에서 열기"가 없거나 동작하지 않으면 링크가 아니다(FAIL).
3. `Cmd/Ctrl+클릭` → 새 탭이 열려야 한다.

**PASS/FAIL**

- **PASS:** 내부 이동은 `<Link>`(또는 `<Link>`로 렌더되는 컴포넌트), 외부는 `<a rel="noopener noreferrer" target="_blank">`, 프로그래매틱 이동은 폼 제출/조건 분기 등 **정말 링크가 아닌 경우**에만.
- **FAIL:** 내부 경로 전체 리로드, 또는 시각적으로 링크인데 `<button>`/`div onClick`.

**FIX**

- 내비게이션 의미가 있으면 무조건 앵커. "제출 후 이동"만 `router.push`/`redirect()`.
- 서버 액션 후 이동은 클라이언트 `router.push`보다 서버 `redirect()`를 우선(왕복 1회 절약, 캐시 무효화와 순서 보장).
- 프리페치 제어는 `prefetch={false}`로 명시(대량 목록에서 과도한 프리페치는 §20 대역폭 문제).

**BAD**

```tsx
// ❌ 전체 리로드 + 새 탭 열기 불가 + 스크린리더에 링크로 인식되지 않음
<a href="/dashboard">대시보드</a>
<div onClick={() => router.push('/pricing')} className="cursor-pointer underline">요금제</div>
<a href="https://x.com/acme" target="_blank">트위터</a>
```

**GOOD**

```tsx
import Link from 'next/link';

// ✅ 내부: 클라이언트 전환 + 프리페치
<Link href="/dashboard">대시보드</Link>

// ✅ 목록 등 대량 링크는 프리페치 억제
<Link href={`/items/${id}`} prefetch={false}>{title}</Link>

// ✅ 외부: 보안 rel + 새 창임을 알림
<a href="https://x.com/acme" target="_blank" rel="noopener noreferrer">
  트위터 <span className="sr-only">(새 창)</span>
</a>

// ✅ 프로그래매틱 이동은 "행동의 결과"일 때만 (서버 액션 내부)
'use server';
import { redirect } from 'next/navigation';
export async function createItem(fd: FormData) {
  const item = await db.items.create({ title: String(fd.get('title')) });
  redirect(`/items/${item.id}`);
}
```

**REGRESSION HOOK**

```ts
test('내부 네비게이션은 문서 리로드를 발생시키지 않는다', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { (window as any).__spa = true; });   // 리로드되면 사라짐
  await page.getByRole('link', { name: '대시보드' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  expect(await page.evaluate(() => (window as any).__spa)).toBe(true);
});
```

---

### C-APP-04 — Metadata / generateMetadata 누락 및 오류

**WHY**
메타데이터는 SEO만의 문제가 아니다. 브라우저 탭 제목, 공유 카드, 접근성 도구의 문서 식별, 히스토리 구분이 모두 여기에 의존한다. 동적 라우트에서 `generateMetadata`가 없으면 모든 상세 페이지가 **같은 제목**을 갖고, 사용자는 여러 탭을 구분할 수 없다. `generateMetadata` 내부에서 잡히지 않은 예외는 페이지 전체를 500으로 만든다.

**DETECT**

```bash
rg -l "export const metadata|export async function generateMetadata" src/app
# page.tsx 목록과 차집합 → 메타데이터 없는 라우트
rg -n "generateMetadata" src/app -A15 | rg "await" # 실패 처리 여부 확인
```

**REPRODUCE**

1. 각 라우트 진입 → 탭 제목 확인. 동일/기본값이면 FAIL.
2. `curl -s http://localhost:3000/<route> | rg "<title>|og:|description"` 로 SSR 출력 확인(클라이언트에서만 설정하면 크롤러가 못 본다).
3. `generateMetadata`가 의존하는 API를 실패시키고 페이지가 500이 되는지 확인.

**PASS/FAIL**

- **PASS:** 모든 인덱싱 대상 라우트가 고유 `title` + `description`을 SSR HTML에 포함. 동적 라우트는 리소스별 제목. 메타데이터 fetch 실패 시 페이지는 살아 있고 폴백 제목이 나온다.
- **FAIL:** 제목 중복/누락, 클라이언트 전용 제목 설정, 메타데이터 실패가 페이지를 죽임.

**FIX**

- 루트 `layout.tsx`에 `title.template`과 기본 `description`·`openGraph`를 정의하고, 각 페이지는 `title`만 덮어쓴다(중복 제거).
- `generateMetadata`의 fetch는 페이지 본문과 **동일한 캐시 키**를 쓰게 해 중복 호출을 없앤다(Next가 dedupe).
- 실패 시 throw 하지 말고 폴백 메타데이터를 반환한다.

**BAD**

```tsx
// ❌ 동적 라우트인데 정적 메타데이터 → 모든 상세가 같은 제목
export const metadata = { title: '상세' };

// ❌ 실패 시 페이지 전체 사망
export async function generateMetadata({ params }) {
  const item = await fetch(`${API}/items/${params.id}`).then(r => r.json()); // 404면 throw
  return { title: item.name };
}
```

**GOOD**

```tsx
// ✅ app/layout.tsx
export const metadata: Metadata = {
  title: { default: 'Acme', template: '%s · Acme' },
  description: '팀을 위한 프로젝트 관리',
  openGraph: { siteName: 'Acme', type: 'website', locale: 'ko_KR' },
  robots: { index: true, follow: true },
};

// ✅ app/items/[id]/page.tsx
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id).catch(() => null);   // 본문과 동일 함수 → dedupe
  if (!item) return { title: '항목을 찾을 수 없음', robots: { index: false } };
  return {
    title: item.name,                                  // → "item.name · Acme"
    description: item.summary?.slice(0, 150),
    openGraph: { title: item.name, images: item.ogImage ? [item.ogImage] : undefined },
    alternates: { canonical: `/items/${id}` },
  };
}
```

**REGRESSION HOOK**

```ts
test('상세 라우트는 고유한 SSR 제목을 갖는다', async ({ request }) => {
  const a = await (await request.get('/items/1')).text();
  const b = await (await request.get('/items/2')).text();
  const title = (h: string) => h.match(/<title>(.*?)<\/title>/)?.[1];
  expect(title(a)).toBeTruthy();
  expect(title(a)).not.toBe(title(b));
});
```

---

### C-APP-05 — `dynamic` / `revalidate` / `runtime` 설정 오용

**WHY**
Next.js는 기본적으로 정적화를 시도한다. 사용자별 데이터를 쓰는 페이지가 실수로 정적화되면 **한 사용자의 데이터가 다른 사용자에게 캐시되어 노출**된다(S0급 사고). 반대로 공용 마케팅 페이지가 `force-dynamic`이면 모든 요청이 SSR되어 TTFB와 서버 비용이 폭증한다. `runtime = 'edge'`인데 Node 전용 API(fs, crypto 일부, 특정 SDK)를 쓰면 프로덕션에서만 실패한다.

**DETECT**

```bash
rg -n "export const (dynamic|revalidate|runtime|fetchCache|preferredRegion)" src/app
rg -n "cookies\(\)|headers\(\)|noStore|connection\(\)" src/app     # 자동 dynamic 트리거
npm run build   # 라우트 표에서 ○(Static) / ƒ(Dynamic) 실제값 확인 ← 결정적 증거
```

**REPRODUCE**

1. 빌드 라우트 표에서 **사용자별 데이터를 렌더하는 라우트가 `○`(Static)** 인지 확인 → 그렇다면 즉시 S0 후보.
2. 프로덕션 빌드(`npm run build && npm start`)에서 사용자 A로 로그인해 해당 페이지 방문 → 로그아웃 → 사용자 B로 로그인해 같은 페이지 방문 → A의 데이터가 보이면 확정 S0.
3. 공용 페이지가 `ƒ`(Dynamic)인 경우, 왜 dynamic이 되었는지 추적한다(`cookies()`/`headers()` 호출이 하위 컴포넌트에 숨어 있는 경우가 많다).

**PASS/FAIL**

- **PASS:** 사용자별/시크릿 의존 라우트는 dynamic(또는 `cookies()`로 자동 dynamic)이며 캐시 헤더가 `private, no-store`. 공용 라우트는 static 또는 적절한 `revalidate`.
- **FAIL:** 사용자 데이터가 정적 캐시에 들어간다 / 공용 페이지가 이유 없이 dynamic / edge runtime에서 Node API 사용.

**FIX**

- 렌더 모드는 **의도를 코드로 선언**한다. 우연에 맡기지 않는다: 공용 → `export const revalidate = <초>`, 사용자별 → `export const dynamic = 'force-dynamic'` 또는 명시적 `noStore()`.
- 사용자별 데이터를 페이지 전체 dynamic으로 만들지 말고, **정적 셸 + 동적 섬**(`<Suspense>` 내부 dynamic 컴포넌트) 구조로 분리해 TTFB를 지킨다(§12).
- edge runtime은 의존성 호환을 확인한 라우트에만.

**BAD**

```tsx
// ❌ 사용자 대시보드가 정적화 대상 (빌드 시점 데이터가 모든 사용자에게)
export default async function Page() {
  const me = await fetch(`${API}/me`, { headers: { authorization: TOKEN } }).then(r => r.json());
  return <Dashboard user={me} />;
}
```

**GOOD**

```tsx
// ✅ 명시적 dynamic + 요청 스코프 인증
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';        // 의도를 선언
export const revalidate = 0;

export default async function Page() {
  const token = (await cookies()).get('session')?.value;
  if (!token) redirect('/login');
  const me = await fetch(`${API}/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).then(r => r.json());
  return <Dashboard user={me} />;
}

// ✅ 더 나은 형태: 정적 셸 + 동적 섬
export default function Page() {
  return (
    <>
      <DashboardChrome />                      {/* 정적, 즉시 렌더 */}
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats />                          {/* cookies() 사용 → 이 섬만 동적 */}
      </Suspense>
    </>
  );
}
```

**REGRESSION HOOK**

```ts
test('대시보드는 캐시되지 않는다 (사용자 데이터 격리)', async ({ request }) => {
  const res = await request.get('/dashboard');
  const cc = res.headers()['cache-control'] ?? '';
  expect(cc).toMatch(/no-store|private/);
});
```

---

### C-APP-06 — 서버 액션 안전성 (인증·검증·재검증)

**WHY**
서버 액션은 **공개 HTTP 엔드포인트**다. 폼에서만 호출된다는 보장이 없고, 누구나 액션 ID로 직접 호출할 수 있다. UI에서 버튼을 숨기는 것은 인가가 아니다. 또한 입력 검증 없이 DB에 쓰면 무결성이 깨지고, 성공 후 `revalidate*`를 호출하지 않으면 화면은 **성공했는데 옛 데이터를 보여준다**(사용자는 실패로 인지하고 재시도 → 중복 생성).

**DETECT**

```bash
rg -l "^\s*['\"]use server['\"]" src
# 각 액션에 대해 세 가지 존재 확인: 인증 / 스키마 검증 / revalidate
rg -n "use server" src -A30 | rg -n "auth|session|getUser|cookies\(\)"
rg -n "use server" src -A30 | rg -n "safeParse|parse\(|zod|valibot|yup"
rg -n "use server" src -A30 | rg -n "revalidatePath|revalidateTag|redirect"
```

**REPRODUCE**

1. 정상 플로우로 액션을 한 번 실행하고 DevTools Network에서 요청(POST, `Next-Action` 헤더)을 캡처.
2. 캡처한 요청을 **세션 쿠키 제거**하고 재전송(`copy as fetch` → 쿠키 삭제) → 200/변경 성공이면 **인증 우회 확정(S0)**.
3. 페이로드를 변조(다른 사용자의 리소스 ID, 음수 수량, 초장문 문자열, 타입 불일치) → 서버가 400 계열로 거부하지 않으면 FAIL.
4. 성공 후 목록 화면이 즉시 갱신되는가? 수동 새로고침이 필요하면 재검증 누락(FAIL).

**PASS/FAIL**

- **PASS:** 모든 액션이 (1) 서버에서 세션을 재확인하고, (2) 리소스 소유권을 검증하고, (3) 스키마로 입력을 검증하고, (4) 성공 시 관련 경로/태그를 재검증하며, (5) 실패를 구조화된 결과로 반환해 UI가 메시지를 띄운다.
- **FAIL:** 쿠키 없는 재전송이 성공 / 다른 사용자 리소스 변경 가능 / 검증 없음 / 화면 미갱신.

**FIX**

- 인증·인가·검증은 **액션 함수 최상단**에서 수행한다. 호출자를 신뢰하지 않는다.
- 공통 래퍼(`withAuth`, `defineAction`)로 강제해 개별 액션이 빠뜨릴 수 없게 만든다.
- 성공/실패를 예외 대신 **판별 유니온 결과**로 반환해 UI가 필드별 에러를 표시할 수 있게 한다.
- 캐시 재검증은 성공 직후, 리다이렉트 **이전**에.

**BAD**

```tsx
// ❌ 인증 없음 · 검증 없음 · 소유권 확인 없음 · 재검증 없음
'use server';
export async function deleteProject(id: string) {
  await db.project.delete({ where: { id } });     // 누구나 아무 프로젝트나 삭제 가능
}
```

**GOOD**

```tsx
// ✅ actions/project.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';         // 세션 없으면 throw/redirect

const DeleteInput = z.object({ id: z.string().uuid() });
type Result = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function deleteProject(raw: unknown): Promise<Result> {
  const user = await requireUser();                             // 1) 인증
  const parsed = DeleteInput.safeParse(raw);                    // 2) 입력 검증
  if (!parsed.success) {
    return { ok: false, message: '잘못된 요청입니다.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const project = await db.project.findUnique({ where: { id: parsed.data.id } });
  if (!project || project.ownerId !== user.id) {                // 3) 소유권(인가)
    return { ok: false, message: '권한이 없습니다.' };            //    존재 여부를 노출하지 않음
  }
  await db.project.delete({ where: { id: project.id } });
  revalidatePath('/projects');                                  // 4) 재검증
  return { ok: true };
}
```

**REGRESSION HOOK**

```ts
test('세션 없는 서버 액션 호출은 거부된다', async ({ request }) => {
  // auth.setup.ts로 저장한 요청을 쿠키 없이 재전송
  const res = await request.post('/projects', {
    headers: { 'Next-Action': ACTION_ID, 'content-type': 'text/plain;charset=UTF-8' },
    data: JSON.stringify([{ id: KNOWN_PROJECT_ID }]),
  });
  expect([401, 403, 302, 307]).toContain(res.status());
  // 그리고 리소스가 실제로 남아있음을 확인
});
```

---

### C-APP-07 — Route Handler 계약 (상태코드·검증·CORS·메서드)

**WHY**
`route.ts`는 프론트엔드의 공개 API 표면이다. 상태 코드를 아무렇게나 주면(항상 200 + `{error}`) 클라이언트가 실패를 성공으로 처리하고, 재시도/모니터링/캐시가 전부 오작동한다. 메서드 화이트리스트가 없으면 `GET`으로 변경 작업이 트리거될 수 있고(프리페치/크롤러가 데이터를 지운다), 와일드카드 CORS는 시크릿 유출 경로가 된다.

**DETECT**

```bash
rg --files src/app | rg "route\.ts$"
rg -n "export async function (GET|POST|PUT|PATCH|DELETE|OPTIONS)" src/app --glob 'route.ts'
rg -n "Access-Control-Allow-Origin" src | rg "\*"
rg -n "NextResponse\.json\(" src/app --glob 'route.ts' | rg -v "status"   # 상태코드 미지정
```

**REPRODUCE**

```bash
# 정상
curl -i -X POST localhost:3000/api/items -H 'content-type: application/json' -d '{"title":"a"}'
# 잘못된 바디 → 400 기대
curl -i -X POST localhost:3000/api/items -H 'content-type: application/json' -d '{"title":123}'
# 인증 없이 → 401 기대
curl -i -X POST localhost:3000/api/items -d '{}'
# 허용되지 않은 메서드 → 405 기대 (200/500이면 FAIL)
curl -i -X DELETE localhost:3000/api/items
# 큰 페이로드 → 413 또는 거부 기대
curl -i -X POST localhost:3000/api/items -H 'content-type: application/json' --data-binary @big.json
```

**PASS/FAIL**

- **PASS:** 성공 2xx, 검증 실패 400(+필드 정보), 미인증 401, 권한 없음 403, 없음 404, 미허용 메서드 405, 충돌 409, 레이트리밋 429, 서버 오류 500(+상관관계 ID). GET은 부수효과 없음. CORS는 명시적 허용 목록.
- **FAIL:** 오류에도 200 / 스택트레이스 노출 / GET이 상태를 변경 / `*` CORS with credentials.

**FIX**

- 응답 스키마를 하나로 통일한다(`{ data }` | `{ error: { code, message, fields? } }`).
- 예외는 상단 래퍼에서 잡아 상태코드로 변환하고, 내부 메시지는 **로그로만** 남긴다.
- 변경 작업은 POST/PATCH/DELETE로 한정하고, `GET`은 순수 조회 + 캐시 헤더 명시.

**BAD**

```ts
// ❌ 모든 것이 200, 내부 에러 노출, 메서드 무제한
export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get('id')!;
    await db.item.delete({ where: { id } });          // GET이 삭제한다(!)
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.stack });     // 200 + 내부 구조 노출
  }
}
```

**GOOD**

```ts
// ✅ app/api/items/[id]/route.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';

const Params = z.object({ id: z.string().uuid() });

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'id 형식 오류' } }, { status: 400 });
  }
  const user = await getSession();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });

  const item = await db.item.findUnique({ where: { id: parsed.data.id } });
  if (!item) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  if (item.ownerId !== user.id) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });

  try {
    await db.item.delete({ where: { id: item.id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const rid = crypto.randomUUID();
    console.error('[items.delete]', rid, e);                       // 내부 로그
    return NextResponse.json({ error: { code: 'INTERNAL', requestId: rid } }, { status: 500 });
  }
}

// GET은 조회만 + 캐시 정책 명시
export async function GET() { /* ... */ }
```

**REGRESSION HOOK**

```ts
test.describe('API 계약', () => {
  test('미허용 메서드는 405', async ({ request }) => {
    expect((await request.fetch('/api/items', { method: 'PUT' })).status()).toBe(405);
  });
  test('검증 실패는 400 + 필드 정보', async ({ request }) => {
    const res = await request.post('/api/items', { data: { title: 123 } });
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('BAD_REQUEST');
  });
});
```

---

### C-APP-08 — 미들웨어 보호 범위 및 성능

**WHY**
미들웨어는 **모든 요청**을 통과한다. matcher가 지나치게 넓으면 정적 자산까지 거치며 전 페이지 TTFB에 지연을 더한다. 반대로 좁으면 보호 라우트가 인증 없이 노출된다. 미들웨어에서만 인증을 검사하고 페이지/액션에서 재확인하지 않으면, matcher 실수 한 줄이 전체 인증을 무력화한다(방어선 단일화 금지).

**DETECT**

```bash
cat middleware.ts src/middleware.ts 2>/dev/null
rg -n "matcher" middleware.ts src/middleware.ts
# 보호 대상 라우트 목록 vs matcher 패턴 대조표 작성
```

**REPRODUCE**

1. 시크릿 창(비로그인)으로 보호 라우트 전부에 직접 진입 → 로그인으로 리다이렉트되어야 한다. 콘텐츠가 잠깐이라도 보이면 FAIL(S1).
2. 리다이렉트 후 로그인하면 **원래 목적지로 복귀**하는가? (`?next=` 보존)
3. 정적 자산 요청(`/_next/static/...`, `/favicon.ico`)이 미들웨어를 타는지 로그로 확인 → 타면 matcher 과대.
4. 미들웨어 추가 지연 측정: matcher에서 제외한 경로 vs 포함 경로의 TTFB 비교.

**PASS/FAIL**

- **PASS:** 보호 라우트는 100% 차단되고, 정적 자산/공개 라우트는 미들웨어를 우회하며, 페이지·액션에서 인증을 **재확인**한다.
- **FAIL:** 하나라도 비로그인 접근 가능 / 정적 자산이 미들웨어 통과 / 인증이 미들웨어에만 존재.

**FIX**

- matcher는 **부정 패턴으로 정적 자산을 배제**하고, 보호 대상은 명시적 프리픽스로 나열한다.
- 미들웨어는 "빠른 게이트"로만 쓴다(세션 쿠키 존재·만료 확인). 실제 권한 판단은 서버 컴포넌트/액션/핸들러에서.
- 리다이렉트에 원래 경로를 담아 UX 손실을 막는다.

**BAD**

```ts
// ❌ 모든 요청 통과 + DB 조회 + 재확인 없음
export async function middleware(req: NextRequest) {
  const user = await db.user.findFirst(...);   // 모든 정적 자산 요청마다 DB (!)
  if (!user) return NextResponse.redirect(new URL('/login', req.url));  // 공개 페이지도 막힘
}
```

**GOOD**

```ts
// ✅ middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/settings', '/billing'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  const token = req.cookies.get('session')?.value;
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname + req.nextUrl.search);   // 목적지 보존
    return NextResponse.redirect(url);
  }
  return NextResponse.next();          // 서명/권한 검증은 서버 레이어에서 다시 한다
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|svg|webp|woff2)$).*)'],
};
```

**REGRESSION HOOK**

```ts
for (const path of ['/dashboard', '/settings', '/billing/invoices']) {
  test(`비로그인 ${path} 접근은 로그인으로 리다이렉트되고 목적지를 보존한다`, async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
    await expect(page.getByText(/대시보드|설정|청구/)).toHaveCount(0);   // 내용 노출 0
  });
}
```

---

## 7. React QA (`C-RCT-*`)

React 결함은 대개 "동작은 하는데 가끔 이상하다"로 나타난다. 원인은 거의 항상 **불필요한 상태**, **잘못된 동기화(useEffect)**, **불안정한 아이덴티티(key/참조)** 셋 중 하나다.

### C-RCT-01 — 타입 안전성 붕괴 (`any` / 단정 / 미검증 외부 데이터)

**WHY**
`any`와 `as` 단정은 컴파일러의 방어선을 지역적으로 삭제한다. 특히 **API 응답을 단정으로 신뢰**하면, 백엔드가 필드명을 바꾼 날 런타임에서 `undefined.map is not a function`으로 화면이 죽는다. QA 관점에서 `any`가 많은 코드베이스는 **정적 검사로 잡을 수 있는 결함을 런타임으로 밀어낸 상태**이므로, 다른 모든 검사의 신뢰도가 함께 떨어진다.

**DETECT**

```bash
npx tsc --noEmit                                   # 0 error가 기준선
rg -n ":\s*any\b|as any|as unknown as|@ts-ignore|@ts-expect-error" src
rg -n "JSON\.parse\(" src                          # 파싱 결과 검증 여부
rg -n "\.json\(\)" src | rg -v "safeParse|parse\(" # 미검증 응답
rg -n "!\." src --glob '*.tsx' | rg -v "!==" | head -40   # non-null 단정 남용
```

**REPRODUCE**

1. 대상 API 응답을 의도적으로 변형(필드 제거/타입 변경)한다 — Playwright `page.route`로 목킹.
2. 화면이 크래시하거나 `NaN`/빈 값이 그대로 렌더되면 FAIL.

```ts
await page.route('**/api/items*', r => r.fulfill({ json: { items: null } }));
await page.goto('/items');
// 기대: 에러/빈 상태 UI. 실패: 크래시 또는 "undefined" 문자열 노출
```

**PASS/FAIL**

- **PASS:** `tsc --noEmit` 0 error, 외부 경계(API/URL 파라미터/localStorage/postMessage) 데이터는 모두 스키마 검증 후 사용, `any` 0건(불가피한 경우 사유 주석 + Finding 등록).
- **FAIL:** tsc 에러 존재 / 미검증 외부 데이터 / 사유 없는 `any`·`@ts-ignore`.

**FIX**

- 경계에서 한 번 검증하고, 내부는 검증된 타입만 흐르게 한다(parse, don't validate).
- `any`를 없애는 방향: `unknown` → 스키마 파싱 → 도메인 타입.
- 단정 제거가 어려운 서드파티는 **어댑터 모듈 하나**에 격리한다.

**BAD**

```tsx
// ❌ 응답을 그대로 신뢰
const data = (await res.json()) as ItemList;
return <ul>{data.items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
//           ^ items가 null이면 화면 사망
```

**GOOD**

```tsx
// ✅ lib/api/items.ts — 경계에서 검증
import { z } from 'zod';

const Item = z.object({ id: z.string(), name: z.string(), price: z.number().nonnegative() });
const ItemList = z.object({ items: z.array(Item).default([]), nextCursor: z.string().nullable() });
export type ItemList = z.infer<typeof ItemList>;

export async function getItems(): Promise<ItemList> {
  const res = await fetch(`${API}/items`, { next: { revalidate: 30 } });
  if (!res.ok) throw new ApiError('items', res.status);
  const parsed = ItemList.safeParse(await res.json());
  if (!parsed.success) throw new ApiError('items:schema', 502, parsed.error);  // 계약 위반을 즉시 드러냄
  return parsed.data;
}
```

**REGRESSION HOOK**

```ts
test('API 스키마 위반 시 크래시 대신 에러 UI', async ({ page }) => {
  await page.route('**/api/items*', r => r.fulfill({ json: { items: null } }));
  await page.goto('/items');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('undefined');
});
```

---

### C-RCT-02 — 리스트 `key` 오용 (인덱스/불안정 키)

**WHY**
`key={index}`는 리스트가 정렬·삽입·삭제될 때 React가 **다른 데이터에 기존 DOM/상태를 재사용**하게 만든다. 결과: 체크박스가 엉뚱한 행에 남고, 입력 중이던 텍스트가 다른 행으로 이동하고, 애니메이션이 뒤섞이고, 삭제한 항목의 잔상이 남는다. 이 계열 버그는 "재현이 어렵다"는 이유로 방치되는데, 원인은 항상 동일하다.

**DETECT**

```bash
rg -n "key=\{i\}|key=\{idx\}|key=\{index\}" src
rg -n "key=\{Math\.random|key=\{[^}]*Date\.now" src        # 매 렌더 새 키 → 전체 재마운트
rg -n "\.map\(" src --glob '*.tsx' -A2 | rg -B2 "key=" -c   # key 누락 탐색
```

**REPRODUCE**

1. 리스트 첫 행 입력란에 텍스트를 넣거나 체크박스를 선택한다.
2. 리스트 앞쪽에 항목을 추가하거나 정렬을 바꾼다.
3. 선택/입력이 **다른 행으로 옮겨가면** FAIL. `key={Math.random()}`인 경우 매 렌더 포커스가 튕기고 애니메이션이 재시작된다.

**PASS/FAIL**

- **PASS:** key는 데이터의 안정적 고유 식별자(서버 id, 복합 자연키). 정렬·삽입·삭제 후 행 상태가 데이터에 정확히 따라간다.
- **FAIL:** 인덱스/랜덤/불안정 키, 또는 상태가 잘못된 행에 남는다.

**FIX**

- 서버 id가 없으면 생성 시점에 클라이언트 id(`crypto.randomUUID()`)를 부여해 데이터에 저장한다. 렌더 중 생성하지 않는다.
- 순서만 있는 정적 리스트(절대 변하지 않음)에 한해 인덱스 허용 — 주석으로 근거를 남긴다.
- 리스트 항목 상태(수정 중 값)는 항목 컴포넌트 안이 아니라 **id 기반 맵**으로 올려 보관하는 편이 안전하다.

**BAD**

```tsx
// ❌ 정렬/삽입 시 상태가 뒤섞인다
{rows.map((row, i) => <Row key={i} row={row} />)}

// ❌ 매 렌더 재마운트 → 포커스 유실, 애니메이션 재시작, 성능 저하
{rows.map(row => <Row key={Math.random()} row={row} />)}
```

**GOOD**

```tsx
// ✅ 안정적 식별자
{rows.map(row => <Row key={row.id} row={row} />)}

// ✅ 서버 id가 없는 신규 항목은 생성 시점에 id 부여
function addRow(rows: Row[]) {
  return [...rows, { id: crypto.randomUUID(), title: '', done: false }];
}

// ✅ 항목 상태는 id 키 맵으로
const [drafts, setDrafts] = useState<Record<string, string>>({});
<input value={drafts[row.id] ?? row.title}
       onChange={e => setDrafts(d => ({ ...d, [row.id]: e.target.value }))} />
```

**REGRESSION HOOK**

```ts
test('정렬 변경 후에도 선택 상태가 올바른 행에 유지된다', async ({ page }) => {
  await page.goto('/items');
  const row = page.getByRole('row', { name: /Alpha/ });
  await row.getByRole('checkbox').check();
  await page.getByRole('button', { name: '이름 내림차순' }).click();
  await expect(page.getByRole('row', { name: /Alpha/ }).getByRole('checkbox')).toBeChecked();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(1);
});
```

---

### C-RCT-03 — 파생 상태를 state로 중복 보관

**WHY**
props나 다른 state에서 **계산 가능한 값**을 별도 state로 들고 있으면, 두 값이 반드시 어긋나는 순간이 온다(동기화 useEffect를 추가해도 한 프레임 늦거나 무한 루프를 만든다). 사용자에게는 "가격이 안 바뀐다", "필터를 바꿨는데 목록이 그대로다", "로그아웃했는데 이름이 남아 있다"로 보인다. 이것이 React 결함의 가장 흔한 근원이다.

**DETECT**

```bash
# props → state 복사 패턴
rg -n "useState\((props|[a-z]+\.[a-zA-Z]+)\)" src
# state를 다른 state로 동기화하는 useEffect
rg -n "useEffect\(\s*\(\)\s*=>\s*\{\s*set[A-Z]" src -A3
```

**REPRODUCE**

1. 원본(props/서버 데이터)을 변경한다 — 다른 항목 선택, 필터 변경, 재조회.
2. 파생 표시값이 즉시 따라오지 않거나 한 박자 늦으면 FAIL.
3. React DevTools Profiler로 렌더 횟수를 본다. 한 번의 입력에 2회 이상 커밋되면 동기화 이펙트가 있다는 신호.

**PASS/FAIL**

- **PASS:** 파생값은 렌더 중 계산되거나 `useMemo`로 캐시된다. 동기화 목적의 `useEffect`가 없다.
- **FAIL:** props 복사 state 존재, 또는 `setX`만 하는 `useEffect`로 상태를 맞추고 있다.

**FIX**

- 렌더 중 계산으로 바꾼다. 비용이 실제로 문제일 때만 `useMemo`(측정 후).
- "props로 초기화하고 이후 사용자가 편집" 패턴은 **`key`로 재마운트**하거나, 이전 props를 비교하는 명시적 패턴을 쓴다.
- 서버 데이터의 낙관적 갱신은 `useOptimistic`(React 19) 또는 데이터 레이어의 낙관적 API를 사용한다.

**BAD**

```tsx
// ❌ props 복사 + 동기화 이펙트: 한 프레임 지연 + 무한 루프 위험
function Total({ items }: { items: Item[] }) {
  const [total, setTotal] = useState(0);
  useEffect(() => { setTotal(items.reduce((s, i) => s + i.price, 0)); }, [items]);
  return <b>{total}</b>;    // items가 바뀐 첫 렌더에는 옛 값
}

// ❌ 편집 폼: 선택 항목이 바뀌어도 옛 값 유지
function Editor({ item }: { item: Item }) {
  const [name, setName] = useState(item.name);   // item 변경을 반영하지 못함
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

**GOOD**

```tsx
// ✅ 렌더 중 계산 — 항상 일치
function Total({ items }: { items: Item[] }) {
  const total = items.reduce((s, i) => s + i.price, 0);
  return <b>{total}</b>;
}

// ✅ 편집 폼: key로 아이덴티티를 명시 → 항목 전환 시 자연스럽게 초기화
<Editor key={item.id} item={item} />

function Editor({ item }: { item: Item }) {
  const [name, setName] = useState(item.name);   // key가 바뀌면 재마운트되어 안전
  return <input value={name} onChange={e => setName(e.target.value)} />;
}

// ✅ 비용이 측정된 경우에만 메모
const filtered = useMemo(
  () => rows.filter(r => r.name.includes(q)),   // rows 10k+ / 프로파일러로 확인된 경우
  [rows, q],
);
```

**REGRESSION HOOK**

```ts
test('항목 전환 시 편집 폼이 새 항목 값으로 초기화된다', async ({ page }) => {
  await page.goto('/items');
  await page.getByRole('link', { name: 'Alpha' }).click();
  await expect(page.getByLabel('이름')).toHaveValue('Alpha');
  await page.getByRole('link', { name: 'Beta' }).click();
  await expect(page.getByLabel('이름')).toHaveValue('Beta');
});
```

---

### C-RCT-04 — `useEffect` 오용 (불필요·의존성·정리 누락)

**WHY**
`useEffect`는 "React 외부 시스템과의 동기화" 도구다. 이를 데이터 변환·이벤트 처리·데이터 페칭 용도로 쓰면 (1) 렌더 두 번, (2) 경쟁 조건(응답 순서 뒤바뀜 → 옛 데이터 표시), (3) 정리 누락으로 인한 메모리 누수와 언마운트 후 setState 경고, (4) 의존성 누락으로 인한 stale closure가 발생한다. 특히 경쟁 조건은 **느린 네트워크의 실제 사용자에게만** 발생해 QA를 통과하고 프로덕션에서 데이터 오표시를 만든다.

**DETECT**

```bash
rg -n "useEffect\(" src -A12 | rg -n "fetch\(|axios|\.then\(" # 이펙트 내 페칭
rg -n "useEffect\(" src -A12 | rg -n "addEventListener|setInterval|setTimeout|subscribe|observe" -A6 \
  | rg -v "return \(\) =>|removeEventListener|clearInterval|clearTimeout|unsubscribe|disconnect"  # 정리 누락
rg -n "\}, \[\]\)" src -B12 | rg "props\.|\bstate\b"          # 빈 배열인데 외부 값 참조
rg -n "eslint-disable.*exhaustive-deps" src                     # 의존성 규칙 억제 = 즉시 Finding
```

**REPRODUCE**

- **경쟁 조건:** 요청을 지연시키고 빠르게 대상 전환.

```ts
let n = 0;
await page.route('**/api/items/*', async r => {
  n += 1;
  await new Promise(res => setTimeout(res, n === 1 ? 2000 : 100)); // 첫 요청만 느리게
  await r.continue();
});
// A 클릭 → 즉시 B 클릭 → 최종 화면에 A 데이터가 보이면 경쟁 조건 FAIL
```

- **정리 누락:** 해당 화면 진입/이탈을 20회 반복하고 콘솔의 언마운트 경고, `performance.memory` 증가, 남아있는 타이머(`window.__timers` 계측)를 확인.

**PASS/FAIL**

- **PASS:** 이펙트는 외부 시스템 동기화(구독/타이머/DOM API/애널리틱스)만 담당하고, 모두 정리 함수를 갖는다. 페칭이 이펙트에 있는 경우 `AbortController` 또는 stale 가드가 있다. `exhaustive-deps` 억제 0건.
- **FAIL:** 위 재현에서 오래된 데이터 표시, 언마운트 경고, 타이머/리스너 잔존, 의존성 억제 발견.

**FIX**

- 우선 **이펙트를 없애는 방향**을 검토한다: 서버 컴포넌트 fetch, 데이터 라이브러리(react-query/SWR), 이벤트 핸들러 내 처리, 렌더 중 계산.
- 남겨야 하는 이펙트는 항상 세 요소를 갖춘다: 정확한 의존성 · 정리 함수 · 취소/가드.
- 의존성 경고는 억제하지 않고 구조를 바꿔 해결한다(함수를 이펙트 안으로, 값은 ref로, 로직은 리듀서로).

**BAD**

```tsx
// ❌ 페칭 + 경쟁 조건 + 정리 없음 + 의존성 억제
function ItemPanel({ id }: { id: string }) {
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => {
    fetch(`/api/items/${id}`).then(r => r.json()).then(setItem);   // 취소 없음
    window.addEventListener('resize', onResize);                   // 해제 없음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);                                                          // id 변경 무시
  return <div>{item?.name}</div>;
}
```

**GOOD**

```tsx
// ✅ 최선: 서버 컴포넌트에서 데이터 전달 (이펙트 자체 제거)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const item = await getItem((await params).id);
  return <ItemPanel item={item} />;
}

// ✅ 클라이언트 페칭이 불가피한 경우: 취소 + stale 가드 + 정확한 의존성
function ItemPanel({ id }: { id: string }) {
  const [state, setState] = useState<{ status: 'loading' | 'error' | 'ok'; item?: Item }>({ status: 'loading' });

  useEffect(() => {
    const ac = new AbortController();
    setState({ status: 'loading' });
    (async () => {
      try {
        const res = await fetch(`/api/items/${id}`, { signal: ac.signal });
        if (!res.ok) throw new Error(String(res.status));
        setState({ status: 'ok', item: await res.json() });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error' });
      }
    })();
    return () => ac.abort();                 // 전환 시 이전 요청 취소 → 경쟁 조건 제거
  }, [id]);                                   // 정확한 의존성

  if (state.status === 'loading') return <ItemSkeleton />;
  if (state.status === 'error') return <InlineError onRetry={() => setState({ status: 'loading' })} />;
  return <div>{state.item!.name}</div>;
}

// ✅ 외부 시스템 구독은 정리 함수 필수
useEffect(() => {
  const onResize = () => setW(window.innerWidth);
  window.addEventListener('resize', onResize, { passive: true });
  return () => window.removeEventListener('resize', onResize);
}, []);
```

**REGRESSION HOOK**

```ts
test('빠른 항목 전환 시 오래된 응답이 화면을 덮지 않는다', async ({ page }) => {
  let first = true;
  await page.route('**/api/items/*', async route => {
    const delay = first ? 1500 : 50; first = false;
    await new Promise(r => setTimeout(r, delay));
    await route.continue();
  });
  await page.goto('/items');
  await page.getByRole('link', { name: 'Alpha' }).click();
  await page.getByRole('link', { name: 'Beta' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Beta');
  await page.waitForTimeout(2000);                       // 늦은 응답 도착 시점까지
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Beta');  // 여전히 Beta
});
```

> 위 테스트는 §23.4의 "느린 응답 도착 확인" 예외로만 `waitForTimeout`을 허용한다. 다른 곳에서는 금지다.

---

### C-RCT-05 — 렌더 폭주 / 무한 루프

**WHY**
렌더 중 `setState`, 매 렌더 새로 만드는 객체·함수를 의존성에 넣기, 이펙트가 자기 의존성을 갱신하기 — 이 셋은 `Maximum update depth exceeded` 또는 조용한 CPU 폭주를 만든다. 조용한 경우가 더 위험하다: 저사양 기기에서 입력이 밀리고(INP 악화), 배터리가 소모되며, 개발 머신에서는 눈치채기 어렵다.

**DETECT**

```bash
rg -n "set[A-Z]\w*\(" src --glob '*.tsx' | rg -v "=>|function|onClick|onChange|onSubmit|useEffect|useCallback"
#   → 렌더 본문에서 직접 setState 호출 후보
rg -n "useEffect\([^)]*\}, \[[^\]]*(\{|\[|=>)" src   # 의존성에 인라인 객체/배열/함수
```

**REPRODUCE**

1. 대상 화면에서 콘솔 렌더 카운터를 주입해 관측한다.

```ts
await page.addInitScript(() => {
  (window as any).__renders = 0;
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb) => { (window as any).__renders++; return raf(cb); };
});
```

2. 5초 유휴 상태 유지 후 `__renders` 증가량 확인 → 유휴 상태에서 계속 증가하면 폭주.
3. React DevTools Profiler에서 커밋 수, 또는 CPU 사용률(작업 관리자/Performance 패널)로 교차 확인.

**PASS/FAIL**

- **PASS:** 유휴 상태에서 렌더 커밋 0. 단일 사용자 입력에 커밋 1~2회. 콘솔에 update depth 경고 없음.
- **FAIL:** 유휴 렌더 발생, 입력당 커밋 5회 이상, depth 경고.

**FIX**

- 렌더 본문의 `setState`를 이벤트 핸들러 또는 이펙트로 옮기거나, 애초에 파생값으로 대체한다(C-RCT-03).
- 의존성으로 쓰는 객체/배열/함수는 `useMemo`/`useCallback`으로 아이덴티티를 고정하거나, 원시값으로 분해해 의존성에 넣는다.
- 이펙트가 자신의 의존성을 갱신하는 구조는 **리듀서**로 바꿔 한 번의 커밋으로 정리한다.

**BAD**

```tsx
// ❌ 렌더 중 setState → 즉시 무한 루프
function Bad({ items }) {
  const [count, setCount] = useState(0);
  if (items.length !== count) setCount(items.length);   // 렌더마다 갱신
  ...
}

// ❌ 매 렌더 새 객체 → 이펙트 매 렌더 실행
useEffect(() => { track(options); }, [{ page: 'home' }]);
```

**GOOD**

```tsx
// ✅ 파생값으로 대체 (state 제거)
const count = items.length;

// ✅ 의존성은 원시값 또는 고정된 아이덴티티
const options = useMemo(() => ({ page: 'home' }), []);
useEffect(() => { track(options); }, [options]);

// ✅ 상호 의존 상태는 리듀서로 한 번에
type S = { step: number; answers: Record<string, string>; valid: boolean };
function reducer(s: S, a: Action): S {
  switch (a.type) {
    case 'answer': {
      const answers = { ...s.answers, [a.key]: a.value };
      return { ...s, answers, valid: isValid(answers) };   // 파생값을 같은 커밋에서 계산
    }
    case 'next': return s.valid ? { ...s, step: s.step + 1 } : s;
  }
}
```

**REGRESSION HOOK**

```ts
test('유휴 상태에서 렌더 폭주가 없다', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__c = 0;
    const o = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => { (window as any).__c++; return o(cb); };
  });
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const a = await page.evaluate(() => (window as any).__c);
  await page.waitForTimeout(3000);
  const b = await page.evaluate(() => (window as any).__c);
  expect(b - a).toBeLessThan(10);          // 애니메이션 없는 화면 기준
});
```

---

### C-RCT-06 — 제어/비제어 입력 혼용 및 폼 정합성

**WHY**
`value`는 주는데 `onChange`가 없으면 입력이 **읽기 전용처럼 굳는다**(React 경고 발생, 사용자는 "타이핑이 안 된다"고 인지). `value={undefined}` ↔ 값 전환은 비제어에서 제어로 바뀌며 커서 위치가 초기화된다. 숫자 입력에서 `Number(e.target.value)`를 즉시 state로 넣으면 `"1."`, `""` 같은 중간 입력이 소실되어 사용자가 소수점을 입력할 수 없다.

**DETECT**

```bash
rg -n "<input" src -A3 | rg "value=" | rg -v "onChange|readOnly|type=[\"'](submit|button|hidden)"
rg -n "value=\{[^}]*\?\?\s*''\}|value=\{[^}]*\|\|\s*''\}" src   # 정상 패턴 확인용
rg -n "onChange=\{[^}]*Number\(" src                             # 숫자 즉시 변환
rg -n "defaultValue" src -A2 | rg "value="                       # 동시 사용 = 오류
```

**REPRODUCE**

1. 각 입력에 타이핑 → 값이 반영되는가, 콘솔 경고가 있는가.
2. 문자열 중간에 커서를 두고 입력 → 커서가 끝으로 튀면 FAIL(제어 전환/재마운트 의심).
3. 숫자 입력에 `1.5`, `-`, `0.05`, 빈 문자열 순으로 입력 → 중간 상태가 파괴되면 FAIL.
4. 한글 입력(IME): 조합 중 상태 갱신이 조합을 깨뜨리는지 확인 — 조합 문자가 중복/유실되면 FAIL.

**PASS/FAIL**

- **PASS:** 모든 입력이 명시적으로 제어 또는 비제어이며 혼용이 없다. 커서/IME 조합이 보존된다. 숫자·날짜 입력은 문자열로 보관하고 제출 시 변환한다.
- **FAIL:** React 제어 경고, 커서 점프, 소수점/음수 입력 불가, IME 깨짐.

**FIX**

- `value={x ?? ''}` + `onChange` 쌍을 규칙으로 삼는다. 초기값만 필요하면 `defaultValue`만 쓴다(둘 다 쓰지 않는다).
- 숫자는 **문자열 state**로 유지하고, 검증/변환은 제출 경계에서 한다.
- IME 사용 필드는 조합 중 파괴적 정규화(자동 대문자/치환)를 하지 않는다. 필요하면 `compositionend` 이후에 적용한다.

**BAD**

```tsx
// ❌ value만 있고 onChange 없음 → 입력 불가
<input value={form.email} />

// ❌ 숫자 즉시 변환 → "1." 입력 불가, 빈 값이 0으로
<input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} />

// ❌ undefined ↔ 값 전환 → 제어/비제어 경고 + 커서 리셋
<input value={data?.name} onChange={...} />
```

**GOOD**

```tsx
// ✅ 명시적 제어 + null 안전
<input
  id="email"
  type="email"
  value={form.email ?? ''}
  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
  autoComplete="email"
/>

// ✅ 숫자는 문자열로 보관, 경계에서 변환
const [qtyText, setQtyText] = useState('1');
<input
  type="text" inputMode="decimal" value={qtyText}
  onChange={e => setQtyText(e.target.value)}
  aria-invalid={!/^\d+(\.\d+)?$/.test(qtyText) || undefined}
/>
// 제출 시: const qty = Number(qtyText); if (!Number.isFinite(qty)) → 필드 에러

// ✅ 비제어가 적합한 경우 (제출 시 한 번만 읽음)
<form action={createItem}>
  <input name="title" defaultValue={item.title} />
</form>
```

**REGRESSION HOOK**

```ts
test('소수점과 커서 위치가 보존된다', async ({ page }) => {
  await page.goto('/checkout');
  const qty = page.getByLabel('수량');
  await qty.fill('');
  await qty.pressSequentially('1.5');
  await expect(qty).toHaveValue('1.5');
  await qty.press('Home'); await qty.press('2');
  await expect(qty).toHaveValue('21.5');       // 커서가 끝으로 튀지 않았다
});
```

---

### C-RCT-07 — Context 오용 (과대 범위 · 불안정 값 · 프로바이더 누락)

**WHY**
Context 값이 매 렌더 새 객체면 **모든 소비자가 리렌더**된다(성능 붕괴). 반대로 프로바이더가 특정 서브트리에만 있는데 다른 곳에서 소비하면 런타임 크래시 또는 조용한 기본값 사용(테마가 안 바뀜, 로그인 상태가 없다고 나옴)이 된다. Context는 "전역 상태 관리자"가 아니라 **의존성 주입 도구**다.

**DETECT**

```bash
rg -n "createContext" src
rg -n "<[A-Z]\w*Provider" src
rg -n "value=\{\{" src --glob '*.tsx'        # 인라인 객체 value → 불안정
rg -n "useContext\(" src                      # 소비 위치 vs 프로바이더 범위 대조
```

**REPRODUCE**

1. Context 소비 컴포넌트를 렌더 카운트 계측하고, 무관한 상태를 바꿔본다 → 함께 리렌더되면 value 불안정.
2. 프로바이더 밖 라우트로 직접 진입(딥링크) → 크래시 또는 기본값 표시 확인. 특히 `error.tsx`·`not-found.tsx`는 프로바이더 트리 밖일 수 있다.
3. 컨텍스트 기본값이 `undefined`인데 가드가 없으면 크래시가 정상 — 가드 여부 확인.

**PASS/FAIL**

- **PASS:** value는 `useMemo`로 안정화되거나 상태/디스패치를 분리한 두 컨텍스트로 나뉘어 있다. 소비 위치가 모두 프로바이더 범위 안이며, 범위 밖 사용은 명확한 에러를 던진다.
- **FAIL:** 인라인 객체 value + 다수 소비자 / 프로바이더 밖 소비 / 조용한 기본값 폴백.

**FIX**

- 자주 바뀌는 값과 거의 안 바뀌는 값을 **다른 컨텍스트로 분리**한다(예: `AuthUser`와 `AuthActions`).
- 커스텀 훅에서 `undefined` 검사 후 명확한 메시지를 throw 해 프로바이더 누락을 개발 시점에 잡는다.
- 서버 컴포넌트는 컨텍스트를 소비할 수 없다 — 데이터는 props로 내린다.

**BAD**

```tsx
// ❌ 인라인 value(매 렌더 새 객체) + 조용한 기본값
const AuthCtx = createContext({ user: null, login: () => {} });
<AuthCtx.Provider value={{ user, login }}>{children}</AuthCtx.Provider>
const { user } = useContext(AuthCtx);   // 프로바이더 없어도 조용히 null → "로그아웃 상태"로 오표시
```

**GOOD**

```tsx
// ✅ 상태/액션 분리 + 안정화 + 누락 감지
const AuthStateCtx = createContext<AuthState | undefined>(undefined);
const AuthActionsCtx = createContext<AuthActions | undefined>(undefined);

export function AuthProvider({ initial, children }: Props) {
  const [state, setState] = useState(initial);
  const actions = useMemo<AuthActions>(() => ({
    login: async (c) => setState(await login(c)),
    logout: async () => { await logout(); setState({ user: null }); },
  }), []);                                       // 액션은 아이덴티티 고정 → 소비자 리렌더 없음
  return (
    <AuthActionsCtx.Provider value={actions}>
      <AuthStateCtx.Provider value={state}>{children}</AuthStateCtx.Provider>
    </AuthActionsCtx.Provider>
  );
}

export function useAuthState() {
  const v = useContext(AuthStateCtx);
  if (!v) throw new Error('useAuthState must be used within <AuthProvider>');  // 누락 즉시 노출
  return v;
}
```

**REGRESSION HOOK**

```ts
test('error 화면에서도 테마/인증 프로바이더가 살아 있다', async ({ page }) => {
  await page.route('**/api/items*', r => r.fulfill({ status: 500, json: {} }));
  await page.goto('/items');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: /테마|theme/i })).toBeVisible();  // 프로바이더 범위 확인
});
```

---

### C-RCT-08 — 이벤트 핸들러 정합성 (중복 제출·전파·기본동작)

**WHY**
중복 제출 가드가 없으면 사용자의 더블클릭이 **주문 두 건**을 만든다. `preventDefault` 누락은 폼이 페이지를 리로드해 상태를 날린다. 카드 전체에 `onClick`을 걸고 내부에 버튼을 두면 전파로 두 동작이 함께 실행된다. 이 결함들은 "가끔 이상한 데이터가 생긴다"는 형태로 백엔드 사고로 이어진다.

**DETECT**

```bash
rg -n "onSubmit=" src -A5 | rg -v "preventDefault|action="   # 폼 기본동작
rg -n "onClick=\{[^}]*(submit|create|delete|pay|save)" src -i  # 위험 동작 버튼
rg -n "disabled=\{" src --glob '*.tsx' | wc -l                 # 가드 존재 여부 감각
rg -n "onClick" src --glob '*.tsx' -B3 | rg "role=\"button\"|<div|<span"  # 전파/시맨틱 위험
```

**REPRODUCE**

1. 제출 버튼을 **빠르게 3회 클릭**하고 Network에서 요청 수를 센다. 2건 이상이면 FAIL(S1 — 결제/생성 경로면 S0).
2. Enter 키로 폼 제출 → 페이지 리로드가 발생하면 FAIL.
3. 카드 내부 버튼 클릭 → 카드 네비게이션이 동시에 일어나면 FAIL.
4. 느린 네트워크에서 제출 → 버튼이 로딩/비활성 상태로 바뀌는지 확인.

**PASS/FAIL**

- **PASS:** 제출은 처리 중 비활성화(또는 idempotency key로 서버 보호)되고, 요청은 정확히 1건. 폼 기본동작이 의도대로 제어된다. 중첩 인터랙션의 전파가 명시적으로 처리된다.
- **FAIL:** 중복 요청, 예상치 못한 리로드, 전파로 인한 이중 동작.

**FIX**

- 서버 액션 + `useFormStatus`/`useTransition`의 pending으로 버튼을 비활성화한다.
- **클라이언트 가드만 신뢰하지 않는다.** 생성/결제는 서버에 idempotency key 또는 유니크 제약을 둔다.
- 중첩 클릭 영역은 카드 전체 링크 + 내부 버튼 `stopPropagation` 조합으로 명시 처리한다(또는 카드 링크를 제목에만 적용).

**BAD**

```tsx
// ❌ 중복 제출 가능 + 기본동작 미제어
<form onSubmit={async (e) => { await pay(); }}>
  <button type="submit">결제</button>
</form>

// ❌ 전파로 카드 이동 + 삭제가 동시 실행
<div onClick={() => router.push(`/items/${id}`)}>
  <button onClick={() => remove(id)}>삭제</button>
</div>
```

**GOOD**

```tsx
// ✅ 서버 액션 + pending 상태 + 서버측 멱등성
'use client';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="...">
      {pending ? '처리 중…' : '결제'}
    </button>
  );
}

export function PayForm({ orderId }: { orderId: string }) {
  return (
    <form action={pay}>
      <input type="hidden" name="idempotencyKey" value={orderId} />  {/* 서버가 중복 차단 */}
      <SubmitButton />
    </form>
  );
}

// ✅ 중첩 인터랙션 명시 처리
<article className="relative">
  <h3><Link href={`/items/${id}`} className="...">{title}</Link></h3>
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); remove(id); }}
    className="relative z-10"
  >삭제</button>
</article>
```

**REGRESSION HOOK**

```ts
test('빠른 3회 클릭에도 결제 요청은 1건', async ({ page }) => {
  const calls: string[] = [];
  await page.route('**/api/pay', async r => { calls.push(r.request().url()); await r.fulfill({ json: { ok: true } }); });
  await page.goto('/checkout');
  const btn = page.getByRole('button', { name: '결제' });
  await Promise.all([btn.click(), btn.click({ force: true }), btn.click({ force: true })]).catch(() => {});
  await expect(page.getByText('결제 완료')).toBeVisible();
  expect(calls).toHaveLength(1);
});
```

---

## 8. Tailwind QA (`C-TW-*`)

Tailwind의 실패 양상은 CSS 실패와 다르다. 문제는 대개 **동적 클래스가 빌드에서 사라짐**, **충돌 클래스의 승자 불명확**, **토큰 우회 하드코딩**, **z-index/overflow 무정부 상태**다. 시각적 세부는 `04_Visual_QA.md`, 토큰 체계는 `07_Design_System_QA.md`에서 확대한다.

### C-TW-01 — 동적 클래스 문자열 (JIT 미검출로 스타일 소실)

**WHY**
Tailwind는 소스에서 **문자열을 스캔**해 CSS를 생성한다. `` `text-${color}-500` `` 처럼 런타임에 조립된 클래스는 생성되지 않아, 개발 서버에서는 우연히 보이던 스타일이 프로덕션 빌드에서 **완전히 사라진다**. 이 결함은 "로컬은 되는데 배포하면 색이 없다"의 대표 원인이다.

**DETECT**

```bash
rg -n "className=\{\`[^`]*\$\{" src                    # 템플릿 리터럴 내 보간
rg -n "(bg|text|border|ring|from|to|w|h|p|m|gap)-\$\{" src
rg -n "\+ ['\"](bg|text|border)-" src                  # 문자열 연결로 조립
```

**REPRODUCE**

1. `npm run build && npm start`로 **프로덕션 빌드**를 띄운다(dev에서는 재현되지 않을 수 있다).
2. 해당 컴포넌트의 모든 variant를 렌더시키고 스타일이 적용되는지 확인.
3. 생성된 CSS에서 클래스 존재를 직접 검증: `rg "bg-emerald-500" .next/static/css/*.css`

**PASS/FAIL**

- **PASS:** 모든 클래스가 소스에 **완전한 문자열 리터럴**로 존재한다. variant는 매핑 객체(또는 `cva`)로 정의된다. 프로덕션 CSS에 필요한 클래스가 모두 존재한다.
- **FAIL:** 보간으로 조립된 클래스가 있고, 프로덕션에서 스타일 누락이 확인된다.

**FIX**

- variant → 완전한 클래스 문자열 **맵**으로 변환한다. 안전하고 타입도 보장된다.
- 진짜 임의값(사용자 지정 색상 등)은 클래스가 아니라 **인라인 스타일 또는 CSS 변수**로 처리한다.
- safelist는 최후 수단(번들이 커지고 의도가 코드에 남지 않는다).

**BAD**

```tsx
// ❌ 프로덕션에서 스타일 소실
function Badge({ tone }: { tone: 'green' | 'red' }) {
  return <span className={`bg-${tone}-100 text-${tone}-800 px-2 py-1 rounded`}>...</span>;
}
```

**GOOD**

```tsx
// ✅ 완전한 클래스 문자열 맵 (타입 안전 + JIT 검출 가능)
const TONE = {
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-rose-100 text-rose-800',
} as const satisfies Record<string, string>;

function Badge({ tone }: { tone: keyof typeof TONE }) {
  return <span className={cn('rounded px-2 py-1 text-xs font-medium', TONE[tone])}>...</span>;
}

// ✅ 진짜 동적 값은 CSS 변수/인라인 스타일
<div style={{ ['--brand' as string]: user.brandColor }} className="bg-[color:var(--brand)]" />
```

**REGRESSION HOOK**

```ts
test('배지 variant가 프로덕션 빌드에서 실제 배경색을 갖는다', async ({ page }) => {
  await page.goto('/styleguide');                       // 모든 variant를 렌더하는 내부 페이지 권장
  for (const name of ['green', 'red']) {
    const el = page.getByTestId(`badge-${name}`);
    const bg = await el.evaluate(n => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');            // 스타일 소실 감지
  }
});
```

---

### C-TW-02 — 클래스 충돌 및 병합 부재 (`cn`/`tailwind-merge` 미사용)

**WHY**
`className="p-4"` + 외부에서 넘어온 `"p-2"`가 같이 있으면 승자는 **CSS 파일 내 순서**가 결정한다 — 소스 순서가 아니다. 결과적으로 "props로 스타일을 덮어썼는데 안 먹는다", "어떤 화면에서만 간격이 다르다"가 발생하고, 개발자는 `!important`를 붙이기 시작해 시스템이 붕괴한다.

**DETECT**

```bash
rg -n "className=\{[^}]*\bclassName\b" src | rg -v "cn\(|twMerge|clsx"   # 병합 없이 합성
rg -n "!\w+-" src --glob '*.tsx' | head -30                              # important 남용
rg -n "\bcn\b|twMerge|clsx" src/lib src/utils 2>/dev/null                # 유틸 존재 확인
```

**REPRODUCE**

1. 재사용 컴포넌트에 `className="p-2"` 같은 오버라이드를 넘겨본다.
2. DevTools Computed에서 어떤 선언이 적용됐는지 확인. 의도한 오버라이드가 무시되면 FAIL.

**PASS/FAIL**

- **PASS:** 모든 재사용 컴포넌트가 `cn()`(clsx + tailwind-merge)로 클래스를 합성하고, 외부 `className`이 마지막에 병합되어 항상 승리한다. `!important` 0건(정당한 서드파티 오버라이드는 주석 필수).
- **FAIL:** 문자열 연결/템플릿으로 합성, 오버라이드 무효, `!` 접두사 남용.

**FIX**

- `cn` 유틸을 프로젝트 표준으로 두고 **모든** 컴포넌트가 사용하게 한다.
- 컴포넌트는 `base → variant → 외부 className` 순으로 병합한다(외부가 마지막).
- variant 다형성이 3개 이상이면 `cva`로 승격한다(§07 문서).

**BAD**

```tsx
// ❌ 순서 운에 맡김
export function Card({ className, ...p }: Props) {
  return <div className={'rounded-xl border p-4 ' + className} {...p} />;
}
```

**GOOD**

```tsx
// ✅ lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ✅ 항상 외부 className이 마지막
export function Card({ className, tone = 'default', ...p }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 text-card-foreground',   // base
        tone === 'danger' && 'border-destructive/40 bg-destructive/5',  // variant
        className,                                              // 외부 오버라이드 (승자)
      )}
      {...p}
    />
  );
}
```

**REGRESSION HOOK**

```tsx
// unit (vitest + @testing-library) — e2e보다 여기가 적합
it('외부 className이 기본 padding을 덮어쓴다', () => {
  render(<Card className="p-2" data-testid="c" />);
  const el = screen.getByTestId('c');
  expect(el.className).toContain('p-2');
  expect(el.className).not.toContain('p-4');   // tailwind-merge가 충돌 제거
});
```

---

### C-TW-03 — 디자인 토큰 우회 (임의값 하드코딩)

**WHY**
`text-[#1e293b]`, `p-[13px]`, `bg-white` 같은 하드코딩은 (1) 다크 모드에서 즉시 깨지고, (2) 브랜드 변경 시 전수 수정이 필요하고, (3) 리듬(4/8pt 그리드)을 파괴한다. Tailwind의 가치는 유틸리티가 아니라 **제약된 스케일**에 있다. 임의값은 그 제약을 무력화한다.

**DETECT**

```bash
rg -n "\[#[0-9a-fA-F]{3,8}\]" src                      # 하드코딩 색상
rg -n "\[(1[13579]|2[13579])px\]" src                   # 스케일 밖 간격
rg -n "\b(bg|text|border)-(white|black)\b" src           # 다크 모드 취약 (의도적일 수 있음)
rg -n "style=\{\{" src --glob '*.tsx' | rg -i "color|background|padding|margin"
```

**REPRODUCE**

1. 다크 모드로 전환하고 해당 요소를 확인 → 대비 붕괴/흰 박스가 보이면 FAIL(§09 대비 측정 병행).
2. 임의 간격 요소를 인접 요소와 비교 → 4px 그리드에서 이탈해 정렬이 어긋나면 FAIL(§04).

**PASS/FAIL**

- **PASS:** 색상은 시맨틱 토큰(`bg-background`, `text-foreground`, `border-border`, `bg-primary` …)만 사용. 간격은 Tailwind 스케일. 임의값은 정당한 예외(외부 스펙 준수 등)에 주석과 함께.
- **FAIL:** 하드코딩 hex/px, 다크 모드에서 깨지는 절대 색상.

**FIX**

- `tailwind.config`(v3) 또는 `@theme`(v4)에 시맨틱 토큰을 정의하고 컴포넌트는 토큰만 참조한다.
- 라이트/다크 값은 CSS 변수로 두 세트 정의 → 클래스는 하나로 유지(다크 대응 코드 중복 제거).
- 마이그레이션은 "가장 눈에 띄는 표면(버튼/카드/배경) 먼저" 순서로.

**BAD**

```tsx
// ❌ 다크 모드 붕괴 + 스케일 이탈
<div className="bg-white text-[#111827] p-[13px] shadow-[0_2px_6px_rgba(0,0,0,.12)]">
```

**GOOD**

```tsx
// ✅ 시맨틱 토큰만
<div className="bg-card text-card-foreground p-3 shadow-sm">

/* globals.css — 토큰 정의 (라이트/다크 한 쌍) */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --border: 220 13% 91%;
}
.dark {
  --background: 222 47% 6%;
  --foreground: 210 40% 96%;
  --card: 222 40% 9%;
  --card-foreground: 210 40% 96%;
  --border: 217 19% 22%;
}
```

**REGRESSION HOOK**

```ts
// 정적 가드: 유닛 테스트로 하드코딩 유입을 차단 (CI에서 가장 저렴하게 효과적)
import { execSync } from 'node:child_process';
it('소스에 하드코딩 hex 색상이 없다', () => {
  const out = execSync(`rg -n "\\[#[0-9a-fA-F]{3,8}\\]" src || true`).toString().trim();
  expect(out).toBe('');
});
```

---

### C-TW-04 — 반응형 클래스 누락 및 브레이크포인트 오용

**WHY**
Tailwind는 모바일 퍼스트다. `md:` 없는 클래스는 **모든** 뷰포트에 적용된다. 데스크톱 기준으로 쓰고 `sm:` 이하를 잊으면 모바일에서 가로 스크롤·텍스트 넘침·버튼 잘림이 발생한다. 반대로 `max-md:` 계열을 남용하면 규칙이 두 방향으로 갈려 유지가 불가능해진다.

**DETECT**

```bash
rg -n "\bw-\[[0-9]{3,}px\]|\bmin-w-\[[0-9]{3,}px\]" src   # 고정 대형 폭 → 모바일 오버플로
rg -n "whitespace-nowrap" src                              # 넘침 위험
rg -n "grid-cols-[3-9]|grid-cols-1[0-2]" src | rg -v "sm:|md:|lg:"  # 반응형 없는 다열 그리드
rg -n "max-(sm|md|lg):" src                                # 역방향 규칙 사용량
```

**REPRODUCE**

1. 320 / 360 / 390 / 430 / 768 / 1024 / 1440 / 1920 폭에서 각 P0·P1 라우트를 로드.
2. 가로 스크롤 발생 여부를 스크립트로 판정:

```ts
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
```

3. 넘치는 요소를 특정한다:

```ts
const culprits = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  return [...document.querySelectorAll<HTMLElement>('*')]
    .filter(el => el.getBoundingClientRect().right > vw + 1)
    .slice(0, 10)
    .map(el => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 160));
});
```

**PASS/FAIL**

- **PASS:** 320~2560 전 구간에서 가로 스크롤 0(의도된 스크롤 컨테이너 제외), 텍스트 잘림 없음, 터치 타깃 44×44 유지(§02).
- **FAIL:** 어떤 뷰포트에서든 문서 레벨 가로 스크롤 또는 콘텐츠 절단.

**FIX**

- 기본을 모바일로 쓰고 위로 올린다(`grid-cols-1 md:grid-cols-3`).
- 고정 폭 대신 `w-full max-w-*` + `min-w-0`. Flex/Grid 자식의 `min-w-0` 누락이 텍스트 넘침의 최대 원인이다.
- 긴 문자열(URL/코드/토큰)은 `break-words` 또는 `truncate` + `title`.
- 넘칠 수밖에 없는 표는 컨테이너에 `overflow-x-auto`를 명시해 **문서**가 아니라 **표**가 스크롤되게 한다.

**BAD**

```tsx
// ❌ 모바일에서 가로 스크롤 + 텍스트 넘침
<div className="grid grid-cols-3 gap-8 w-[1200px]">
  <div className="flex items-center gap-2">
    <Avatar />
    <span className="whitespace-nowrap">{veryLongUserEmail}</span>
  </div>
</div>
```

**GOOD**

```tsx
// ✅ 모바일 퍼스트 + min-w-0 + 절단 처리
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <div className="flex min-w-0 items-center gap-2">
    <Avatar className="shrink-0" />
    <span className="min-w-0 truncate" title={veryLongUserEmail}>{veryLongUserEmail}</span>
  </div>
</div>

// ✅ 표는 표가 스크롤한다
<div className="w-full overflow-x-auto">
  <table className="w-full min-w-[40rem]">…</table>
</div>
```

**REGRESSION HOOK**

```ts
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1440, 1920];
for (const w of WIDTHS) {
  test(`가로 스크롤 없음 @${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, `overflow at ${w}px`).toBe(false);
  });
}
```

---

### C-TW-05 — z-index / overflow / stacking context 무정부 상태

**WHY**
`z-[9999]`가 코드 곳곳에 생기는 순간 레이어 순서는 예측 불가가 된다. 실제 증상: 모달 뒤에 헤더가 떠 있음, 드롭다운이 카드에 잘림, 토스트가 모달 아래로 사라짐, sticky 헤더가 콘텐츠에 덮임. 원인은 대개 `overflow-hidden` 조상 또는 `transform`/`filter`가 만든 새 stacking context다.

**DETECT**

```bash
rg -n "z-\[?[0-9]+\]?" src | sort -t: -k3 | uniq -c | sort -rn   # z 값 분포
rg -n "overflow-hidden" src --glob '*.tsx'                        # 잘림 후보
rg -n "transform|backdrop-blur|filter|will-change|isolate" src     # stacking context 생성자
rg -n "fixed|sticky" src --glob '*.tsx'
```

**REPRODUCE**

1. 오버레이 조합을 실제로 겹쳐본다: 모달 열기 → 그 안에서 셀렉트/툴팁/날짜 선택 열기 → 토스트 발생 → sticky 헤더 스크롤.
2. 각 조합에서 (a) 잘림, (b) 잘못된 순서, (c) 클릭 불가 영역을 기록한다.
3. 잘림이 발생하면 조상 체인의 `overflow`/`transform`을 DevTools로 추적해 원인 노드를 특정한다.

**PASS/FAIL**

- **PASS:** 레이어 값이 **토큰화된 소수의 단계**(예: dropdown 10 / sticky 20 / drawer 30 / modal 40 / toast 50)로만 존재하고, 오버레이는 포털로 body에 렌더되어 조상 overflow에 영향받지 않는다. 모든 조합에서 순서와 클릭 가능성이 정상.
- **FAIL:** 임의 z 값, 오버레이 잘림, 순서 역전, 클릭 차단.

**FIX**

- z 스케일을 **설계**한다. Tailwind config에 `zIndex` 토큰을 정의하고 임의값을 금지한다.
- 팝오버/모달/토스트는 포털 사용(Radix 등 라이브러리는 기본 제공). 잘림이 생기면 `overflow-hidden` 조상을 제거하기보다 포털로 탈출한다.
- 겹침이 필요한 형제 그룹에는 `isolate`로 국소 stacking context를 명시해 전역 오염을 막는다.

**BAD**

```tsx
// ❌ 임의 z + 조상 overflow-hidden으로 드롭다운 잘림
<div className="overflow-hidden rounded-xl">
  <Dropdown className="absolute z-[9999]" />
</div>
```

**GOOD**

```ts
// ✅ tailwind.config.ts — 레이어를 토큰으로 설계
export default {
  theme: { extend: { zIndex: {
    base: '0', dropdown: '10', sticky: '20', drawer: '30', modal: '40', toast: '50',
  } } },
};
```

```tsx
// ✅ 포털 + 토큰 레이어
<Popover.Portal>
  <Popover.Content className="z-dropdown rounded-md border bg-popover p-2 shadow-md" />
</Popover.Portal>

// ✅ 겹침 그룹은 국소 컨텍스트로 격리
<section className="isolate relative">…</section>
```

**REGRESSION HOOK**

```ts
test('모달 위 셀렉트가 모달 안에서 잘리지 않는다', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: '프로필 편집' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: '국가' }).click();
  const option = page.getByRole('option', { name: '대한민국' });
  await expect(option).toBeVisible();
  await expect(option).toBeInViewport();          // 잘림/오프스크린 감지
  await option.click();
});
```

---

### C-TW-06 — 다크 모드 클래스 정합성

**WHY**
다크 모드는 "색을 반전"하는 작업이 아니라 **토큰 세트를 교체**하는 작업이다. `dark:` 를 개별 컴포넌트에 흩뿌리면 반드시 일부가 누락되어, 다크에서 흰 카드·읽을 수 없는 텍스트·보이지 않는 보더가 남는다. 또한 이미지/그림자/오버레이는 색 반전만으로 해결되지 않는다.

**DETECT**

```bash
rg -c "dark:" src --glob '*.tsx' | sort -t: -k2 -rn | head -20     # dark: 산포도
rg -n "\bbg-white\b|\bbg-gray-(50|100)\b|\btext-black\b" src        # 다크 취약 절대색
rg -n "shadow-(sm|md|lg|xl)" src | wc -l                            # 다크에서 그림자 무효 가능
```

**REPRODUCE**

1. 라이트/다크 각각에서 **모든 P0·P1 라우트**를 캡처하고 나란히 비교한다.
2. 자동 대비 검사: 다크 모드에서 텍스트/배경 대비를 측정(§09 스크립트 재사용). 4.5:1 미만 본문, 3:1 미만 UI 요소는 FAIL.
3. `prefers-color-scheme` 시스템 설정과 앱 토글의 상호작용을 확인(§14 C-HYD-03과 함께).

**PASS/FAIL**

- **PASS:** 컴포넌트는 시맨틱 토큰만 쓰고 `dark:` 사용이 예외적(이미지/일러스트 스왑 등)이다. 다크에서 전 화면 대비 기준 충족, 흰 박스/보이지 않는 보더 없음.
- **FAIL:** 다크에서 대비 위반 또는 미변환 표면 발견.

**FIX**

- 색은 CSS 변수 토큰 한 세트로 통합하고 `.dark`에서 값만 교체한다. 컴포넌트에서 `dark:` 제거가 목표.
- 그림자는 다크에서 잘 안 보인다 → 다크에서는 **보더/표면 밝기 차이**로 층을 표현한다.
- 이미지·로고·일러스트는 `dark:` 스왑 또는 `<picture>`로 명시 대응.

**BAD**

```tsx
// ❌ 컴포넌트마다 dark: 수동 관리 → 누락 필연
<div className="bg-white text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-gray-100">
  {/* 이 파일은 됐지만 옆 파일은 dark: 를 빠뜨렸다 */}
</div>
```

**GOOD**

```tsx
// ✅ 토큰만 사용 — 테마 전환은 CSS 변수가 처리
<div className="bg-card text-card-foreground border border-border">

// ✅ 다크에서 층 표현은 그림자 대신 표면/보더
<div className="rounded-xl border border-border bg-surface-1 shadow-sm dark:shadow-none dark:bg-surface-2">

// ✅ 이미지 스왑은 명시적으로
<Image src="/brand/logo-light.svg" alt="Acme" className="dark:hidden" width={120} height={32} />
<Image src="/brand/logo-dark.svg" alt="" aria-hidden className="hidden dark:block" width={120} height={32} />
```

**REGRESSION HOOK**

```ts
for (const scheme of ['light', 'dark'] as const) {
  test(`${scheme} 모드에서 본문 대비가 4.5:1 이상`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const bad = await page.evaluate(() => {
      // 실제 구현은 09_Accessibility_QA.md의 contrast 스크립트를 공유 헬퍼로 사용
      return (window as any).__auditContrast?.() ?? [];
    });
    expect(bad).toEqual([]);
  });
}
```

---

## 9. State QA (`C-STA-*`)

상태 결함은 "새로고침하면 사라진다", "뒤로 가면 이상해진다", "두 탭에서 다르다"로 나타난다. 판정 기준은 하나다: **상태는 그 성질에 맞는 저장소에 있는가.**

### C-STA-01 — 상태 배치 오류 (URL / 서버 / 클라이언트 / 저장소)

**WHY**
공유·복원되어야 하는 상태(필터, 탭, 페이지, 검색어)가 컴포넌트 로컬 state에 있으면 **링크 공유·새로고침·뒤로가기가 모두 깨진다**. 반대로 사용자 입력 중간값을 URL에 넣으면 히스토리가 오염되고 뒤로가기가 무용지물이 된다. 서버 데이터를 클라이언트 state에 복제하면 §C-RCT-03의 불일치가 발생한다.

**상태 배치 결정 규칙 (Agent는 이 표로 판정한다)**

| 상태 성질 | 올바른 위치 | 예시 |
|-----------|------------|------|
| 공유·복원 가능해야 함 | **URL** (`searchParams`) | 필터, 정렬, 페이지, 탭, 검색어, 모달 딥링크 |
| 서버가 진실의 원천 | **서버 fetch + 캐시** | 목록, 상세, 사용자 프로필, 권한 |
| 세션 간 유지 (기기 한정) | **cookie / localStorage** | 테마, 사이드바 접힘, 최근 본 항목, 온보딩 완료 |
| 순간적 UI | **로컬 state** | 열림/닫힘, 호버, 입력 중 값, 포커스 인덱스 |
| 요청 진행 | **transition / pending** | 제출 중, 낙관적 갱신 |

**DETECT**

```bash
rg -n "useState" src --glob '*.tsx' -B4 | rg -i "filter|sort|page|tab|query|search|category"
rg -n "useSearchParams|searchParams" src | wc -l
rg -n "localStorage|sessionStorage" src
```

**REPRODUCE**

1. 필터/탭/정렬/검색을 변경한다 → **URL이 바뀌는가?**
2. F5 새로고침 → 상태가 유지되는가?
3. URL을 복사해 새 시크릿 창에 붙여넣기 → 같은 화면이 나오는가?
4. 뒤로가기 → 이전 필터 상태로 돌아가는가? (입력 한 글자마다 히스토리가 쌓이면 FAIL)
5. 두 탭에서 서로 다른 조작 → 서로를 오염시키지 않는가?

**PASS/FAIL**

- **PASS:** 위 5개 전부 기대대로. 상태 배치가 위 표와 일치.
- **FAIL:** 새로고침·공유·뒤로가기 중 하나라도 깨짐.

**FIX**

- 공유 가능 상태는 `useSearchParams` + `router.replace`(히스토리 오염 방지) 또는 서버 컴포넌트의 `searchParams` prop으로 이동한다.
- 검색어는 디바운스 후 URL 반영, 히스토리에는 `replace`로 기록.
- 기기 설정은 쿠키(SSR에서 읽어 FOUC 방지) 우선, localStorage는 서버 렌더가 필요 없는 것만.

**BAD**

```tsx
// ❌ 필터가 로컬 state — 공유/새로고침/뒤로가기 전부 실패
'use client';
export function ItemList({ items }: { items: Item[] }) {
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const view = useMemo(() => filterSort(items, category, sort), [items, category, sort]);
  return <>…</>;
}
```

**GOOD**

```tsx
// ✅ 서버 컴포넌트가 searchParams를 읽고 서버에서 필터링
// app/items/page.tsx
export default async function Page({
  searchParams,
}: { searchParams: Promise<{ category?: string; sort?: string; page?: string }> }) {
  const sp = await searchParams;
  const data = await getItems({
    category: sp.category ?? 'all',
    sort: sp.sort === 'price' ? 'price' : 'recent',
    page: Number(sp.page ?? '1') || 1,
  });
  return <ItemList data={data} active={sp} />;
}

// ✅ 컨트롤은 URL을 갱신 (히스토리 오염 없이)
'use client';
function FilterBar({ active }: { active: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    value === null || value === 'all' ? next.delete(key) : next.set(key, value);
    next.delete('page');                                  // 필터 변경 시 페이지 초기화
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <select value={active.category ?? 'all'} onChange={e => setParam('category', e.target.value)} aria-label="카테고리">
      …
    </select>
  );
}
```

**REGRESSION HOOK**

```ts
test('필터 상태는 URL에 반영되고 새로고침/공유에서 복원된다', async ({ page, context }) => {
  await page.goto('/items');
  await page.getByLabel('카테고리').selectOption('switch');
  await expect(page).toHaveURL(/category=switch/);
  await page.reload();
  await expect(page.getByLabel('카테고리')).toHaveValue('switch');

  const url = page.url();
  const fresh = await context.newPage();
  await fresh.goto(url);
  await expect(fresh.getByLabel('카테고리')).toHaveValue('switch');
});
```

---

### C-STA-02 — 과대 로컬 상태 / 상태 머신 부재

**WHY**
`isLoading`, `isError`, `isSuccess`, `data`, `error`를 각각 boolean으로 들고 있으면 **불가능한 조합**이 표현 가능해진다: 로딩이면서 에러, 성공인데 데이터 없음. 실제 사용자 증상은 "스피너와 에러가 동시에 보인다", "성공 토스트 후 빈 화면"이다. 상태 수가 늘어날수록 조합 폭발로 QA가 불가능해진다.

**DETECT**

```bash
rg -n "useState\(false\)" src --glob '*.tsx' -B2 | rg -i "loading|error|success|submitting|open|done"
# 한 컴포넌트의 useState 개수 세기 (6개 이상이면 정밀 검사)
rg -c "useState" src --glob '*.tsx' | sort -t: -k2 -rn | head -15
```

**REPRODUCE**

1. 실패 → 재시도 → 성공 순서를 실행하고, 각 전이에서 **이전 상태 잔존**을 확인(에러 메시지가 성공 후에도 남아 있는지).
2. 제출 중 다른 조작(모달 닫기, 라우트 이동, 다시 제출)을 시도해 상태가 뒤엉키는지 확인.
3. 네트워크를 오프라인 → 온라인으로 토글하며 상태 전이를 관찰.

**PASS/FAIL**

- **PASS:** UI 상태가 **판별 유니온** 또는 명시적 상태 머신으로 표현되어 불가능한 조합이 타입 레벨에서 배제된다. 전이 시 이전 상태가 정리된다.
- **FAIL:** boolean 조합으로 상태 표현, 상충 UI 동시 노출, 잔존 에러.

**FIX**

- `type State = {k:'idle'} | {k:'loading'} | {k:'error', message} | {k:'ok', data}` 형태로 통합한다.
- 다단계 플로우(위저드/결제)는 리듀서 또는 상태 머신으로 전이 규칙을 코드화한다.
- 렌더는 `switch (state.k)`로 단일 분기 — 조건 중첩 삼항 금지.

**BAD**

```tsx
// ❌ 불가능한 조합이 가능 + 잔존 상태
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Item[] | null>(null);

async function load() {
  setLoading(true);
  try { setData(await getItems()); } catch (e) { setError(String(e)); }
  finally { setLoading(false); }          // error를 초기화하지 않음 → 성공 후에도 에러 표시
}
return <>{loading && <Spinner />}{error && <Alert>{error}</Alert>}{data && <List data={data} />}</>;
```

**GOOD**

```tsx
// ✅ 판별 유니온 — 불가능한 조합이 타입 레벨에서 제거
type State =
  | { k: 'idle' }
  | { k: 'loading' }
  | { k: 'error'; message: string; retry: () => void }
  | { k: 'empty' }
  | { k: 'ok'; data: Item[] };

const [state, setState] = useState<State>({ k: 'idle' });

async function load() {
  setState({ k: 'loading' });                      // 전이마다 이전 상태 폐기
  try {
    const data = await getItems();
    setState(data.length ? { k: 'ok', data } : { k: 'empty' });
  } catch (e) {
    setState({ k: 'error', message: toMessage(e), retry: load });
  }
}

switch (state.k) {
  case 'idle':
  case 'loading': return <ListSkeleton />;
  case 'error':   return <ErrorState message={state.message} onRetry={state.retry} />;
  case 'empty':   return <EmptyState action={<CreateButton />} />;
  case 'ok':      return <List data={state.data} />;
}
```

**REGRESSION HOOK**

```ts
test('실패 후 재시도 성공 시 에러가 사라진다', async ({ page }) => {
  let fail = true;
  await page.route('**/api/items*', r =>
    fail ? (fail = false, r.fulfill({ status: 500, json: {} })) : r.continue());
  await page.goto('/items');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('list')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);      // 잔존 에러 없음
});
```

---

### C-STA-03 — 스토리지 상태 (localStorage/cookie) 안전성

**WHY**
`localStorage`는 (1) 서버에 존재하지 않아 SSR/하이드레이션 불일치를 만들고(§14), (2) 스키마가 바뀌면 옛 데이터로 크래시하고, (3) 용량 초과/프라이빗 모드에서 throw 하고, (4) XSS 시 그대로 유출된다. 토큰 저장은 특히 위험하다(§19).

**DETECT**

```bash
rg -n "localStorage|sessionStorage" src -B2 -A2
rg -n "JSON\.parse\(localStorage" src                  # 검증 없는 파싱
rg -n "localStorage.*token|localStorage.*jwt" src -i    # 토큰 저장 = S1 이상
rg -n "document\.cookie" src                            # 클라이언트 쿠키 조작
```

**REPRODUCE**

1. DevTools에서 값을 **손상**시킨다: `localStorage.setItem('prefs', '{oops')`, 타입 변경, 미래 스키마 버전.
2. 새로고침 → 크래시하면 FAIL. 정상 폴백이어야 한다.
3. 저장 용량 초과 시뮬레이션(대량 write) → throw 처리 여부 확인.
4. 프라이빗/차단 환경(`page.addInitScript`로 접근 차단) → 앱이 동작하는지 확인.

```ts
await page.addInitScript(() => {
  Object.defineProperty(window, 'localStorage', {
    get() { throw new DOMException('blocked', 'SecurityError'); },
  });
});
```

**PASS/FAIL**

- **PASS:** 모든 스토리지 접근이 try/catch + 스키마 검증 + 버전 필드를 가진다. 접근 불가 환경에서도 앱이 동작한다. 토큰/시크릿은 저장하지 않는다(HttpOnly 쿠키 사용).
- **FAIL:** 손상 데이터로 크래시, 접근 차단 시 화이트 스크린, 토큰 저장.

**FIX**

- 스토리지 접근을 단일 모듈로 캡슐화한다(직접 호출 금지). 그 안에서 try/catch·파싱·버전 마이그레이션·기본값을 처리한다.
- 서버 렌더가 필요한 설정(테마, 언어)은 **쿠키**로 옮겨 하이드레이션 불일치를 원천 제거한다.
- 인증 토큰은 `HttpOnly; Secure; SameSite=Lax` 쿠키로만.

**BAD**

```tsx
// ❌ 검증/예외 처리 없음 + 토큰 저장 + SSR 불일치
const prefs = JSON.parse(localStorage.getItem('prefs') || '{}');
localStorage.setItem('accessToken', token);
```

**GOOD**

```ts
// ✅ lib/storage.ts — 단일 진입점, 안전 폴백, 버전 관리
import { z } from 'zod';

const V = 2;
const Prefs = z.object({ v: z.literal(V), sidebar: z.boolean(), locale: z.enum(['ko', 'en']) });
export type Prefs = z.infer<typeof Prefs>;
const DEFAULTS: Prefs = { v: V, sidebar: true, locale: 'ko' };

export function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem('prefs');
    if (!raw) return DEFAULTS;
    const parsed = Prefs.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    return migrate(JSON.parse(raw)) ?? DEFAULTS;         // 구버전 마이그레이션
  } catch {
    return DEFAULTS;                                      // 차단/손상/용량 → 기본값
  }
}

export function writePrefs(next: Prefs): void {
  try { window.localStorage.setItem('prefs', JSON.stringify({ ...next, v: V })); }
  catch { /* 용량 초과·프라이빗 모드: 조용히 포기 (기능은 계속 동작) */ }
}
```

```tsx
// ✅ 서버 렌더가 필요한 설정은 쿠키로 (FOUC/mismatch 제거)
// app/layout.tsx
const theme = (await cookies()).get('theme')?.value === 'dark' ? 'dark' : 'light';
return <html lang="ko" className={theme}>…</html>;
```

**REGRESSION HOOK**

```ts
test('손상된 localStorage에서도 앱이 동작한다', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('prefs', '{broken'));
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  expect(errors).toEqual([]);
});
```

---

### C-STA-04 — 낙관적 갱신과 롤백

**WHY**
낙관적 UI는 체감 속도를 크게 올리지만, **실패 롤백이 없으면 거짓말하는 UI**가 된다. 사용자는 저장됐다고 믿고 떠나고, 실제로는 저장되지 않았다. 이것은 신뢰를 가장 크게 훼손하는 결함 유형이다.

**DETECT**

```bash
rg -n "useOptimistic|optimisticData|mutate\(" src
rg -n "setState.*\.\.\.(prev|items)" src -A6 | rg -v "catch|rollback|revert"
```

**REPRODUCE**

1. 대상 동작(좋아요/삭제/이름 변경)을 실행하되 서버를 실패시킨다.

```ts
await page.route('**/api/items/*', r => r.fulfill({ status: 500, json: {} }));
```

2. UI가 즉시 반영 후 **원복되고 에러를 알리는가**? 반영 상태로 남으면 FAIL(S1).
3. 오프라인에서 동작 → 온라인 복귀 후 상태 정합성 확인.

**PASS/FAIL**

- **PASS:** 실패 시 이전 상태로 정확히 롤백 + 사용자에게 실패를 알림(재시도 수단 포함). 성공 시 서버 데이터로 최종 동기화.
- **FAIL:** 롤백 없음, 실패 무통보, 롤백 후 잔존 잔상.

**FIX**

- `useOptimistic`(React 19) 또는 데이터 라이브러리의 낙관적 API를 쓰고, 실패 경로를 **반드시** 구현한다.
- 실패 알림은 토스트만으로 끝내지 않고 **해당 항목 위치**에 상태를 표시한다(사용자가 토스트를 놓친다).
- 서버 응답으로 최종 상태를 덮어써 클라이언트 추정과의 드리프트를 제거한다.

**BAD**

```tsx
// ❌ 실패해도 UI는 성공 상태로 남는다
async function toggleLike(id: string) {
  setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  await fetch(`/api/items/${id}/like`, { method: 'POST' });   // 실패 무시
}
```

**GOOD**

```tsx
// ✅ 낙관적 갱신 + 롤백 + 사용자 통보
'use client';
import { useOptimistic, useTransition } from 'react';

export function LikeButton({ item }: { item: Item }) {
  const [optimistic, setOptimistic] = useOptimistic(item.liked);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  const onClick = () => start(async () => {
    setOptimistic(!optimistic);
    setFailed(false);
    const res = await likeAction(item.id, !optimistic);   // 서버 액션: Result 유니온 반환
    if (!res.ok) {
      setFailed(true);                                    // transition 종료 시 optimistic 자동 원복
      toast.error(res.message, { action: { label: '다시 시도', onClick } });
    }
  });

  return (
    <>
      <button onClick={onClick} aria-pressed={optimistic} aria-busy={pending}>
        {optimistic ? '좋아요 취소' : '좋아요'}
      </button>
      {failed && <span role="status" className="text-xs text-destructive">저장 실패</span>}
    </>
  );
}
```

**REGRESSION HOOK**

```ts
test('좋아요 실패 시 UI가 롤백되고 실패를 알린다', async ({ page }) => {
  await page.goto('/items');
  await page.route('**/like*', r => r.fulfill({ status: 500, json: {} }));
  const btn = page.getByRole('button', { name: '좋아요' }).first();
  await btn.click();
  await expect(page.getByText('저장 실패')).toBeVisible();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');   // 롤백 확인
});
```

---

### C-STA-05 — 폼 상태 유실 (이탈·새로고침·에러 후)

**WHY**
긴 폼(온보딩, 설문, 결제)에서 검증 실패나 뒤로가기로 입력이 **전부 사라지면** 사용자는 대부분 이탈한다. 이는 기능 결함이 아니라 매출 결함이다. 서버 액션 실패 후 필드가 비는 것도 같은 문제다.

**DETECT**

```bash
rg -n "<form" src -A10 | rg -v "defaultValue|value="      # 값 복원 수단 확인
rg -n "onBeforeUnload|beforeunload" src                    # 이탈 경고 존재 여부
rg -n "useFormState|useActionState" src                    # 실패 시 값 반환 패턴
```

**REPRODUCE**

1. 폼을 절반 채우고 검증 실패를 유발(필수 필드 비우고 제출) → 나머지 입력값이 유지되는가?
2. 절반 채우고 다른 라우트로 이동 후 뒤로가기 → 값이 유지되는가(또는 경고가 있었는가)?
3. 절반 채우고 F5 → 최소한 경고가 있었는가?
4. 다단계 위저드에서 이전 단계로 이동 → 답변이 유지되는가?

**PASS/FAIL**

- **PASS:** 서버 검증 실패 후 모든 입력이 유지되고 에러가 필드별로 표시된다. 다단계 진행 상태가 URL/스토리지에 보존된다. 미저장 이탈 시 경고.
- **FAIL:** 실패 후 필드 초기화, 뒤로가기 시 답변 소실, 경고 없음.

**FIX**

- 서버 액션은 실패 시 **입력값을 함께 반환**하고 `defaultValue`로 복원한다(`useActionState`).
- 위저드 단계는 URL(`?step=3`)에 두고 답변은 스토리지/서버 draft에 저장한다.
- `beforeunload` 경고는 실제 미저장 변경이 있을 때만(항상 띄우면 무시된다).

**BAD**

```tsx
// ❌ 실패 시 전 필드 초기화
export default function Page() {
  return (
    <form action={signup}>
      <input name="email" /><input name="company" /><input name="role" />
      <button>가입</button>
    </form>
  );
}
```

**GOOD**

```tsx
// ✅ useActionState로 값 + 필드 에러를 함께 복원
'use client';
import { useActionState } from 'react';

const initial = { values: { email: '', company: '' }, fieldErrors: {} as Record<string, string[]> };

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initial);
  return (
    <form action={action} noValidate>
      <label htmlFor="email">이메일</label>
      <input
        id="email" name="email" type="email"
        defaultValue={state.values.email}                       {/* 실패 후에도 유지 */}
        aria-invalid={!!state.fieldErrors.email || undefined}
        aria-describedby={state.fieldErrors.email ? 'email-err' : undefined}
      />
      {state.fieldErrors.email && (
        <p id="email-err" role="alert" className="text-sm text-destructive">
          {state.fieldErrors.email[0]}
        </p>
      )}
      {/* … */}
      <button disabled={pending} aria-busy={pending}>{pending ? '처리 중…' : '가입'}</button>
    </form>
  );
}
```

**REGRESSION HOOK**

```ts
test('검증 실패 후에도 입력값이 유지된다', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('회사').fill('Acme Inc');
  await page.getByRole('button', { name: '가입' }).click();     // 이메일 비움 → 실패
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('회사')).toHaveValue('Acme Inc');
});
```

---

## 10. Server Components QA (`C-RSC-*`)

RSC의 목적은 **클라이언트로 보내는 JS를 줄이고 데이터를 데이터 소스 가까이에서 가져오는 것**이다. 이 목적이 달성되지 않으면 App Router를 쓰는 이유가 없다. 여기서의 결함은 "동작은 하지만 App Router의 이점을 전부 버린 상태"로 나타난다.

### C-RSC-01 — `'use client'` 경계 과대 (트리 상단 오염)

**WHY**
`'use client'`는 **그 파일부터 아래 전체 import 그래프**를 클라이언트 번들로 끌어온다. 레이아웃이나 페이지 상단에 붙이면 서버 렌더 이점이 사라지고, 번들이 커지며(LCP·INP 악화), 서버 전용 데이터 접근이 불가능해져 API 왕복이 추가된다. 실무에서 가장 흔한 App Router 오용이다.

**DETECT**

```bash
# 경계 파일 목록과 위치
rg -l "^\s*['\"]use client['\"]" src --glob '*.tsx' | sort
# 상단(레이아웃/페이지)에 있는지 = 심각
rg -l "^\s*['\"]use client['\"]" src/app --glob 'layout.tsx'
rg -l "^\s*['\"]use client['\"]" src/app --glob 'page.tsx'
# 경계 비율
echo "client: $(rg -l "use client" src --glob '*.tsx' | wc -l) / total: $(rg --files src --glob '*.tsx' | wc -l)"
# 번들 실측
npm run build   # 라우트별 First Load JS ← 진짜 증거
```

**REPRODUCE**

1. `npm run build` 출력에서 라우트별 First Load JS를 기록한다.
2. 문제 라우트에서 `'use client'`를 하위로 내린 실험 브랜치를 만들어 다시 빌드 → 감소폭을 측정한다(측정 없이 주장 금지, P7).
3. 브라우저 Coverage 패널로 **사용되지 않은 JS 비율**을 확인한다(60% 이상 미사용이면 경계 과대 신호).

**PASS/FAIL**

- **PASS:** `'use client'`는 **인터랙션이 실제로 필요한 잎(leaf) 컴포넌트**에만 있다. `layout.tsx`/`page.tsx`에는 없다. P0 라우트 First Load JS가 프로젝트 예산 이내(권장: 초기 200kB gzip 이하).
- **FAIL:** 페이지/레이아웃이 클라이언트 컴포넌트 / 데이터 표시용 컴포넌트가 클라이언트 / First Load JS 예산 초과.

**FIX**

- 경계를 **아래로 밀어낸다**: 상태를 쓰는 최소 단위만 클라이언트로. 나머지는 서버.
- 클라이언트 컴포넌트에 서버 렌더 결과를 `children`으로 전달하는 패턴(“클라이언트 셸 + 서버 콘텐츠”)을 사용한다.
- 이벤트 핸들러 하나 때문에 전체가 클라이언트가 되는 경우, 그 버튼만 분리한다.

**BAD**

```tsx
// ❌ app/dashboard/page.tsx — 페이지 전체가 클라이언트로 전락
'use client';
import { HeavyChart } from '@/components/heavy-chart';   // 차트 라이브러리까지 초기 번들에
import { useState } from 'react';

export default function Page() {
  const [tab, setTab] = useState('overview');
  return (
    <>
      <Tabs value={tab} onChange={setTab} />
      <HeavyChart />
      <RecentActivity />      {/* 서버에서 렌더 가능한데 클라이언트로 */}
    </>
  );
}
```

**GOOD**

```tsx
// ✅ app/dashboard/page.tsx — 서버 컴포넌트 유지
import { Suspense } from 'react';
import { TabsClient } from './tabs-client';       // 잎 컴포넌트만 클라이언트
import { RecentActivity } from './recent-activity';   // 서버

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab ?? 'overview';   // 탭 상태는 URL (C-STA-01)
  return (
    <>
      <TabsClient active={tab} />                 {/* 작은 클라이언트 섬 */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartServer tab={tab} />                 {/* 데이터 + 렌더 모두 서버 */}
      </Suspense>
      <RecentActivity />                          {/* 서버 렌더, JS 0 */}
    </>
  );
}

// ✅ 무거운 클라이언트 위젯은 지연 로드
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  ssr: false, loading: () => <ChartSkeleton />,
});
```

**REGRESSION HOOK**

```ts
// e2e/tests/bundle-budget.spec.ts — 번들 회귀 차단 (가장 효과적인 성능 가드)
test('대시보드 초기 JS 예산 이내', async ({ page }) => {
  let bytes = 0;
  page.on('response', async res => {
    if (res.url().includes('/_next/static/') && res.url().endsWith('.js')) {
      bytes += Number(res.headers()['content-length'] ?? 0);
    }
  });
  await page.goto('/dashboard', { waitUntil: 'load' });
  expect(bytes, `initial JS ${Math.round(bytes / 1024)}kB`).toBeLessThan(320 * 1024);
});
```

---

### C-RSC-02 — 서버 전용 코드의 클라이언트 유출

**WHY**
DB 클라이언트, 시크릿 키, 서버 SDK가 클라이언트 번들에 들어가면 **시크릿이 브라우저에 노출**되거나 빌드가 실패한다. 더 나쁜 경우는 빌드가 성공하고 조용히 유출되는 것이다. `NEXT_PUBLIC_` 접두사가 없는 환경변수를 클라이언트 컴포넌트에서 읽으면 `undefined`가 되어 "로컬에서는 되는데" 류의 버그가 생긴다.

**DETECT**

```bash
# 클라이언트 파일이 서버 전용 모듈을 import 하는지
for f in $(rg -l "use client" src --glob '*.tsx'); do
  rg -l "from ['\"](@/lib/db|@/server|prisma|@prisma/client|node:|fs|crypto)" "$f";
done
rg -n "process\.env\.[A-Z_]+" src | rg -v "NEXT_PUBLIC_" | rg -f <(rg -l "use client" src --glob '*.tsx')
# 빌드 산출물에서 시크릿 문자열 직접 검색 (결정적 증거)
npm run build && rg -o "sk_live_\w+|AKIA\w+|-----BEGIN [A-Z ]*PRIVATE KEY" .next/static -l
```

**REPRODUCE**

1. 프로덕션 빌드 후 `.next/static/**/*.js`에서 시크릿 패턴을 검색한다(위 명령).
2. 브라우저에서 **View Source + JS 청크 검색**으로 교차 확인한다.
3. 발견되면 즉시 **S0**: 리포트에 표기하고, 해당 키는 유출로 간주해 **로테이션 필요**를 명시한다.

**PASS/FAIL**

- **PASS:** `server-only` 패키지로 서버 모듈이 보호되고, 클라이언트 번들에 시크릿 문자열이 0건. 클라이언트가 읽는 환경변수는 모두 `NEXT_PUBLIC_`이며 비민감.
- **FAIL:** 시크릿 1건이라도 번들에 존재(S0) / 서버 모듈이 클라이언트 트리에 포함.

**FIX**

- 서버 전용 모듈 최상단에 `import 'server-only'`를 넣어 **빌드 타임에 실패**하게 만든다.
- 클라이언트가 필요한 값은 서버 컴포넌트에서 props로 내리거나 라우트 핸들러를 경유한다.
- 유출된 키는 코드 수정만으로 끝내지 않고 **로테이션**을 리포트의 Action Item으로 남긴다.

**BAD**

```tsx
// ❌ 클라이언트 컴포넌트에서 서버 시크릿 사용
'use client';
const KEY = process.env.STRIPE_SECRET_KEY;      // undefined (다행) 또는 번들 인라인 (재앙)
export function Pay() { /* ... */ }
```

**GOOD**

```ts
// ✅ lib/stripe.server.ts
import 'server-only';                            // 클라이언트 import 시 빌드 실패
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

```tsx
// ✅ 클라이언트는 공개 키만, 결제 생성은 서버 액션/핸들러에서
'use client';
const PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PK!;   // 공개 가능 값만
export function Pay({ clientSecret }: { clientSecret: string }) { /* 서버가 발급 */ }
```

**REGRESSION HOOK**

```ts
// CI 유닛 테스트로 상시 차단
import { execSync } from 'node:child_process';
it('클라이언트 번들에 시크릿 패턴이 없다', () => {
  const out = execSync(
    `rg -l "sk_live_|SECRET_KEY|PRIVATE KEY|AKIA[0-9A-Z]{16}" .next/static || true`
  ).toString().trim();
  expect(out).toBe('');
});
```

---

### C-RSC-03 — 서버 컴포넌트에서 클라이언트 훅/브라우저 API 사용

**WHY**
서버 컴포넌트는 `useState`/`useEffect`/`window`를 쓸 수 없다. 잘못 쓰면 빌드 또는 런타임 에러가 나지만, 더 흔한 문제는 **경계를 흐리게 만들어** 개발자가 `'use client'`를 습관적으로 추가하는 것이다(→ C-RSC-01 악순환).

**DETECT**

```bash
# 'use client'가 없는 파일에서 클라이언트 훅 사용
for f in $(rg --files src --glob '*.tsx'); do
  rg -q "use client" "$f" || rg -l "useState|useEffect|useRef|useContext|window\.|document\." "$f";
done
```

**REPRODUCE** — `npm run build`가 결정적 판정자다. 빌드 에러 메시지의 파일:라인을 그대로 Finding에 기록한다.

**PASS/FAIL**

- **PASS:** 빌드 0 error. 서버 컴포넌트는 `async` + await 데이터만 사용한다.
- **FAIL:** 빌드 에러 또는 서버 파일에서 브라우저 API 참조.

**FIX**

- 훅이 필요한 부분만 잎 컴포넌트로 추출하고 `'use client'`를 그 파일에만 붙인다.
- 브라우저 API가 필요한 계산은 클라이언트로, 데이터 가공은 서버에 남긴다.

**BAD**

```tsx
// ❌ 서버 컴포넌트에서 클라이언트 훅
export default async function Page() {
  const data = await getData();
  const [open, setOpen] = useState(false);      // 빌드 실패
  return <Panel open={open} data={data} />;
}
```

**GOOD**

```tsx
// ✅ 서버: 데이터 / 클라이언트: 상태
export default async function Page() {
  const data = await getData();
  return <PanelClient data={data} />;           // 직렬화 가능한 데이터만 전달
}

// panel-client.tsx
'use client';
export function PanelClient({ data }: { data: Data }) {
  const [open, setOpen] = useState(false);
  return <>…</>;
}
```

**REGRESSION HOOK** — 빌드가 곧 회귀 테스트다. CI에 `npm run build`를 필수 gate로 유지한다.

---

### C-RSC-04 — 서버→클라이언트 props 직렬화 위반 및 과대 전달

**WHY**
서버 컴포넌트가 클라이언트에 넘기는 props는 **직렬화되어 HTML에 인라인**된다. 함수/클래스 인스턴스/Date(일부 케이스)/Map/Symbol은 전달할 수 없어 런타임 에러가 나고, **거대한 객체를 넘기면 HTML 페이로드가 부풀어** LCP가 악화된다. "필요한 필드만 넘긴다"는 원칙이 성능과 직결된다.

**DETECT**

```bash
rg -n "<[A-Z]\w*Client[^>]*=\{" src -A3            # 클라이언트 컴포넌트 호출부
rg -n "onSomething=\{|render=\{|component=\{" src   # 함수 props 전달 후보
# HTML 페이로드 실측
curl -s localhost:3000/dashboard | wc -c
curl -s localhost:3000/dashboard | rg -o 'self.__next_f.push' | wc -l
```

**REPRODUCE**

1. `curl`로 HTML을 받아 크기를 측정하고, RSC 페이로드(`__next_f`) 안에 **화면에 쓰이지 않는 필드**가 들어있는지 확인한다.
2 함수 props가 있으면 런타임 에러(“Functions cannot be passed directly to Client Components”)가 콘솔/서버 로그에 나타난다.

**PASS/FAIL**

- **PASS:** 직렬화 불가 값 전달 0건. 클라이언트 컴포넌트는 **렌더에 실제로 필요한 필드만** 받는다. HTML 페이로드에 미사용 데이터 없음.
- **FAIL:** 직렬화 에러 / 전체 엔티티(내부 필드·비밀 필드 포함) 전달 / 페이로드에 불필요 데이터 다량.

**FIX**

- 서버에서 **뷰 모델로 축약**해서 전달한다(선택, 매핑, 포맷팅을 서버에서).
- 콜백이 필요하면 서버 액션을 전달하거나(액션은 전달 가능), 클라이언트 내부에서 정의한다.
- 민감 필드(이메일 해시, 내부 플래그)는 절대 전달하지 않는다 — HTML에 그대로 남는다(§19).

**BAD**

```tsx
// ❌ 전체 엔티티 + 함수 전달
const user = await db.user.findUnique({ where: { id } });   // passwordHash, internalNotes 포함
return <ProfileClient user={user} onSave={(v) => db.user.update(v)} />;
```

**GOOD**

```tsx
// ✅ 뷰 모델 축약 + 서버 액션 전달
const u = await db.user.findUnique({ where: { id }, select: { id: true, name: true, avatarUrl: true } });
return (
  <ProfileClient
    user={{ id: u.id, name: u.name, avatarUrl: u.avatarUrl }}   // 필요한 필드만
    saveAction={saveProfile}                                    // 'use server' 액션은 전달 가능
  />
);
```

**REGRESSION HOOK**

```ts
test('대시보드 HTML에 민감 필드가 포함되지 않는다', async ({ request }) => {
  const html = await (await request.get('/dashboard')).text();
  for (const key of ['passwordHash', 'internalNotes', 'stripeCustomerSecret']) {
    expect(html, `leaked ${key}`).not.toContain(key);
  }
});
```

---

### C-RSC-05 — 데이터 페칭 위치와 워터폴

**WHY**
서버 컴포넌트에서 `await`를 순차로 나열하면 **직렬 워터폴**이 되어 TTFB가 합산된다(3개 × 300ms = 900ms). 부모가 자식 데이터를 기다리면 스트리밍 이점도 사라진다. 반대로 클라이언트에서 페칭하면 (요청 → HTML → JS → 요청 → 렌더)의 4단 왕복이 되어 모바일에서 체감이 크게 악화된다.

**DETECT**

```bash
rg -n "await " src/app --glob 'page.tsx' -c | sort -t: -k2 -rn | head
rg -n "const \w+ = await" src/app -A2 | rg "const \w+ = await"      # 연속 await 패턴
rg -n "Promise\.all" src/app | wc -l                                 # 병렬화 사용량
```

**REPRODUCE**

1. Server-Timing 또는 로그로 각 데이터 호출의 시작/종료를 기록한다.

```ts
const t = Date.now(); const a = await getA(); console.log('A', Date.now() - t);
```

2. 호출들이 **겹치지 않고 순차**로 실행되면 워터폴 확정.
3. 브라우저 Network 폭포수에서 HTML 이후 XHR이 이어지면 클라이언트 페칭 왕복 확인.

**PASS/FAIL**

- **PASS:** 상호 의존이 없는 데이터는 `Promise.all`(또는 각각 `<Suspense>` 섬)로 병렬 실행된다. 첫 바이트가 데이터 전체를 기다리지 않는다. 초기 렌더 데이터는 서버에서 온다.
- **FAIL:** 독립 데이터가 직렬 대기 / 초기 화면 데이터를 클라이언트에서 fetch.

**FIX**

- 독립 호출은 `Promise.all`. 의존 호출은 최소 단계로 줄인다.
- 느린 데이터는 **분리된 서버 컴포넌트 + Suspense**로 옮겨 스트리밍한다(§12).
- 같은 데이터를 여러 컴포넌트가 필요하면 `React.cache`로 요청 스코프 dedupe.

**BAD**

```tsx
// ❌ 직렬 워터폴: 총 지연 = 합산
export default async function Page() {
  const user = await getUser();          // 200ms
  const stats = await getStats();        // 400ms (user와 무관)
  const feed = await getFeed();          // 600ms (무관)
  return <Dashboard user={user} stats={stats} feed={feed} />;   // TTFB 1200ms
}
```

**GOOD**

```tsx
// ✅ 병렬 + 스트리밍
import { Suspense } from 'react';
import { cache } from 'react';

export const getUser = cache(async () => { /* 요청 스코프 dedupe */ });

export default async function Page() {
  const userP = getUser();               // 즉시 시작
  const statsP = getStats();
  const [user, stats] = await Promise.all([userP, statsP]);   // 병렬: max(200,400)

  return (
    <>
      <DashboardHeader user={user} stats={stats} />
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />                          {/* 느린 데이터는 스트리밍으로 분리 */}
      </Suspense>
    </>
  );
}
```

**REGRESSION HOOK**

```ts
test('대시보드 TTFB 예산 이내', async ({ page }) => {
  await page.goto('/dashboard');
  const ttfb = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return n.responseStart - n.requestStart;
  });
  expect(ttfb).toBeLessThan(800);      // 프로젝트 예산으로 조정
});
```

---

## 11. Client Components QA (`C-CLI-*`)

클라이언트 컴포넌트는 **비용을 지불하고 사는 인터랙티브함**이다. 지불한 만큼의 가치가 있는지, 그리고 지불 방식이 안전한지 검사한다.

### C-CLI-01 — 브라우저 API 직접 참조 (SSR 크래시)

**WHY**
`window`/`document`/`localStorage`/`matchMedia`를 컴포넌트 본문에서 참조하면 **서버 렌더 시점에 `ReferenceError`**가 발생한다. `'use client'`는 "클라이언트에서만 실행"을 의미하지 않는다 — 클라이언트 컴포넌트도 **SSR에서 한 번 렌더된다**. 이 오해가 App Router 초심자 결함 1위다.

**DETECT**

```bash
rg -n "window\.|document\.|localStorage|sessionStorage|navigator\.|matchMedia" src --glob '*.tsx' -B5 \
  | rg -v "useEffect|typeof window|isBrowser|globalThis\?\."
```

**REPRODUCE**

1. `npm run build` (프로덕션 프리렌더) → 서버 에러 발생 여부.
2. 브라우저 JS 비활성 또는 `curl`로 HTML을 받아 해당 섹션이 포함되는지 확인(SSR 실패 시 500 또는 섹션 누락).

**PASS/FAIL**

- **PASS:** 브라우저 API 참조가 전부 `useEffect`/이벤트 핸들러 내부 또는 가드 뒤에 있다. 빌드/프리렌더 에러 0.
- **FAIL:** 렌더 본문에서 직접 참조 / 빌드 에러 / SSR HTML 누락.

**FIX**

- 초기값이 필요하면 `useState(() => defaultForServer)` + `useEffect`에서 실제 값 반영, 또는 React 19 `useSyncExternalStore`의 `getServerSnapshot`을 제공한다.
- 미디어 쿼리는 CSS로 해결 가능한지 먼저 검토한다(JS 없이 처리하면 하이드레이션 문제도 사라진다).

**BAD**

```tsx
'use client';
// ❌ SSR에서 즉시 크래시
export function Sidebar() {
  const isWide = window.innerWidth > 1024;               // ReferenceError on server
  const collapsed = localStorage.getItem('collapsed');   // ReferenceError
  return <aside className={isWide ? 'w-64' : 'w-16'}>…</aside>;
}
```

**GOOD**

```tsx
'use client';
// ✅ 서버 스냅샷 제공 + 마운트 후 동기화
export function Sidebar({ initialCollapsed }: { initialCollapsed: boolean }) {   // 쿠키에서 서버가 전달
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setCollapsed(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return <aside className={cn('transition-[width]', collapsed ? 'w-16' : 'w-64')}>…</aside>;
}

// ✅ 더 나은 해법: CSS만으로 (JS·하이드레이션 비용 0)
<aside className="w-16 lg:w-64">…</aside>
```

**REGRESSION HOOK**

```ts
test('JS 없이도 핵심 콘텐츠가 SSR로 제공된다', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
});
```

---

### C-CLI-02 — 무거운 클라이언트 의존성 (동적 로드 부재)

**WHY**
차트/에디터/지도/3D/PDF 라이브러리는 각각 수백 kB다. 초기 번들에 포함되면 **화면에 보이지도 않는 기능** 때문에 첫 화면이 늦어진다(LCP/INP 악화, 모바일에서 치명적). 조건부로만 필요한 UI(모달 내부, 탭 안쪽, 스크롤 하단)는 반드시 지연 로드해야 한다.

**DETECT**

```bash
rg -n "from ['\"](recharts|chart.js|monaco|codemirror|three|mapbox|pdfjs|@tiptap|framer-motion)" src
rg -n "dynamic\(" src | wc -l
npm run build   # First Load JS 라우트별 확인
```

**REPRODUCE**

1. 브라우저 DevTools → Coverage → 초기 로드 후 **미사용 JS 비율** 측정.
2. 해당 라이브러리가 초기 청크에 있는지 Network의 청크 내용 검색으로 확인.
3. 지연 로드 적용 전/후 First Load JS와 LCP를 비교 측정(P7).

**PASS/FAIL**

- **PASS:** 초기 뷰포트에 보이지 않는 무거운 위젯은 `next/dynamic`(+ `ssr: false` 필요 시)으로 분리되고, 스켈레톤 폴백을 갖는다. 초기 미사용 JS 비율 < 40%.
- **FAIL:** 조건부 UI의 라이브러리가 초기 번들 포함 / 지연 로드 시 폴백 없이 레이아웃 점프(CLS).

**FIX**

- 지연 로드에는 **반드시 동일 크기의 폴백**을 준다(CLS 방지, §16).
- 모달/드로어 내부 컴포넌트는 열릴 때 로드한다.
- 애니메이션 라이브러리는 CSS 트랜지션으로 대체 가능한지 먼저 검토한다.

**BAD**

```tsx
// ❌ 모달 안에서만 쓰는 에디터가 초기 번들에
import { RichEditor } from '@tiptap/react';       // ~300kB
export function Page() {
  const [open, setOpen] = useState(false);
  return <>{open && <Modal><RichEditor /></Modal>}</>;
}
```

**GOOD**

```tsx
// ✅ 열릴 때 로드 + 크기 동일 폴백
const RichEditor = dynamic(() => import('@/components/rich-editor'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-md bg-muted" aria-hidden />,
});

export function Page() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>글 작성</button>
      {open && <Modal onClose={() => setOpen(false)}><RichEditor /></Modal>}
    </>
  );
}
```

**REGRESSION HOOK**

```ts
test('에디터 청크는 모달을 열기 전까지 로드되지 않는다', async ({ page }) => {
  const chunks: string[] = [];
  page.on('request', r => { if (r.url().includes('/_next/static/chunks/')) chunks.push(r.url()); });
  await page.goto('/posts');
  expect(chunks.some(u => /editor|tiptap/i.test(u))).toBe(false);
  await page.getByRole('button', { name: '글 작성' }).click();
  await expect(page.getByRole('textbox', { name: /본문/ })).toBeVisible();
  expect(chunks.some(u => /editor|tiptap/i.test(u))).toBe(true);
});
```

---

### C-CLI-03 — 이벤트 리스너·타이머·옵저버 정리 누락 (메모리 누수)

**WHY**
SPA에서 리스너/타이머/옵저버가 정리되지 않으면 **라우트 이동을 반복할수록 누적**되어, 장시간 세션에서 탭이 느려지고 결국 크래시한다. 특히 대시보드형 SaaS에서 사용자는 탭을 며칠 열어둔다. 로컬 5분 QA로는 절대 발견되지 않는 결함이므로 **의도적인 반복 테스트**가 필요하다.

**DETECT**

```bash
rg -n "addEventListener|setInterval|setTimeout|IntersectionObserver|ResizeObserver|MutationObserver|new WebSocket|EventSource" src -A8 \
  | rg -v "removeEventListener|clearInterval|clearTimeout|disconnect\(\)|close\(\)|return \(\) =>"
```

**REPRODUCE**

```ts
test('반복 네비게이션에서 리스너가 누적되지 않는다', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__lc = 0;
    const add = EventTarget.prototype.addEventListener;
    const rm = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (...a: any[]) { (window as any).__lc++; return add.apply(this, a as any); };
    EventTarget.prototype.removeEventListener = function (...a: any[]) { (window as any).__lc--; return rm.apply(this, a as any); };
  });
  await page.goto('/dashboard');
  const base = await page.evaluate(() => (window as any).__lc);
  for (let i = 0; i < 10; i++) {
    await page.getByRole('link', { name: '설정' }).click();
    await page.getByRole('link', { name: '대시보드' }).click();
  }
  const after = await page.evaluate(() => (window as any).__lc);
  expect(after - base).toBeLessThan(10);     // 왕복 10회에 순증 10 미만
});
```

추가로 `performance.memory.usedJSHeapSize`(Chromium)를 GC 유도 후 비교하고, DevTools Memory 패널의 Detached DOM 노드 수를 확인한다.

**PASS/FAIL**

- **PASS:** 모든 구독이 정리 함수를 갖고, 반복 네비게이션 후 리스너 순증이 0에 가깝다. 힙이 단조 증가하지 않는다.
- **FAIL:** 리스너/타이머 순증, Detached 노드 누적, 힙 단조 증가.

**FIX**

- 이펙트마다 **대칭 정리**를 작성한다(추가한 것을 정확히 되돌린다).
- `AbortController`를 리스너에도 사용하면 여러 구독을 한 번에 정리할 수 있다.
- WebSocket/EventSource는 재연결 로직과 함께 종료 경로를 명시한다.

**BAD**

```tsx
// ❌ 정리 없음 + 라우트 이동마다 누적
useEffect(() => {
  window.addEventListener('scroll', onScroll);
  const id = setInterval(poll, 5000);
  new ResizeObserver(onResize).observe(ref.current!);
}, []);
```

**GOOD**

```tsx
// ✅ AbortController로 일괄 정리
useEffect(() => {
  const ac = new AbortController();
  window.addEventListener('scroll', onScroll, { signal: ac.signal, passive: true });
  window.addEventListener('keydown', onKey, { signal: ac.signal });

  const id = setInterval(poll, 5000);
  const ro = new ResizeObserver(onResize);
  if (ref.current) ro.observe(ref.current);

  return () => {
    ac.abort();
    clearInterval(id);
    ro.disconnect();
  };
}, [onScroll, onKey, poll, onResize]);
```

**REGRESSION HOOK** — 위 REPRODUCE 테스트를 그대로 회귀 스위트에 편입한다(장수 세션 결함의 유일한 자동 방어선).

---

### C-CLI-04 — `ref` 오용 및 포커스/스크롤 제어

**WHY**
`ref.current`를 렌더 중 읽으면 첫 렌더에 `null`이라 조용히 아무 일도 일어나지 않는다(포커스 이동 실패, 스크롤 실패). 모달 열림 시 포커스를 옮기지 않으면 키보드 사용자는 배경에 갇히고(§22), 스크롤 잠금을 하지 않으면 배경이 스크롤되어 위치를 잃는다.

**DETECT**

```bash
rg -n "\.current" src --glob '*.tsx' -B3 | rg -v "useEffect|useLayoutEffect|onClick|onSubmit|onChange|if \("
rg -n "autoFocus" src                                   # 남용 시 모바일 키보드 강제 노출
rg -n "scrollIntoView|scrollTo" src -B3
rg -n "overflow-hidden" src | rg -i "body|html"          # 스크롤 잠금 구현 확인
```

**REPRODUCE**

1. 모달/드로어를 열고 **Tab을 계속 눌러** 포커스가 배경으로 새는지 확인.
2. 열린 상태에서 마우스 휠/터치로 배경이 스크롤되는지 확인(iOS는 특히 취약, §02).
3. 닫은 뒤 **원래 트리거로 포커스가 복귀**하는지 확인.
4. 에러 발생 시 첫 에러 필드로 포커스/스크롤이 이동하는지 확인.

**PASS/FAIL**

- **PASS:** 열림 시 컨테이너/첫 요소로 포커스 이동, 포커스 트랩 유지, Esc로 닫힘, 닫힘 시 트리거로 복귀, 배경 스크롤 잠금. 폼 에러 시 첫 오류로 포커스 이동.
- **FAIL:** 포커스 유출/미이동/미복귀, 배경 스크롤, Esc 무반응.

**FIX**

- 접근성 프리미티브 라이브러리(Radix/React Aria)를 쓰면 대부분 해결된다. 자체 구현이면 트랩·복귀·잠금·`aria-modal`을 모두 구현한다.
- 스크롤 잠금은 `overflow: hidden`만으로 부족하다(iOS). 스크롤 위치 보존 + `touch-action` 처리를 포함한다(상세는 `02_Mobile_QA.md`).

**BAD**

```tsx
// ❌ 렌더 중 ref 읽기 + 트랩/복귀/잠금 없음
export function Modal({ open, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  if (open) ref.current?.focus();                      // 첫 렌더에 null → 무동작
  return open ? <div ref={ref} className="fixed inset-0">{children}</div> : null;
}
```

**GOOD**

```tsx
'use client';
// ✅ 포커스 이동 + 복귀 + Esc + 스크롤 잠금 + 시맨틱
export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement;
    ref.current?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus.current?.focus();                       // 트리거로 복귀
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal grid place-items-center bg-black/50 p-4">
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-lg outline-none"
      >
        <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

**REGRESSION HOOK**

```ts
test('모달 포커스 관리와 복귀', async ({ page }) => {
  await page.goto('/settings');
  const trigger = page.getByRole('button', { name: '프로필 편집' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  for (let i = 0; i < 15; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((d, ) => d.contains(document.activeElement))).toBe(true);  // 트랩 유지

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();                   // 복귀 확인
});
```

---

### C-CLI-05 — 이벤트 성능 (스크롤/리사이즈/입력 핸들러)

**WHY**
스크롤·리사이즈 핸들러에서 레이아웃을 읽거나(강제 동기 리플로우) 상태를 갱신하면 **프레임 드롭**이 발생해 스크롤이 끊긴다. 입력마다 서버 요청을 보내면 요청 폭주와 함께 INP가 나빠진다. 저사양 기기와 트랙패드 사용자에게서 특히 심하게 나타난다.

**DETECT**

```bash
rg -n "addEventListener\('scroll'|onScroll=" src -A6 | rg -v "passive|rAF|requestAnimationFrame"
rg -n "getBoundingClientRect|offsetHeight|scrollTop" src -B5 | rg -i "scroll|resize"
rg -n "onChange=\{[^}]*fetch|onChange=\{[^}]*search\(" src        # 디바운스 없는 검색
```

**REPRODUCE**

1. DevTools Performance에서 CPU 4x 스로틀 + 스크롤 5초 녹화 → **long task(50ms+)** 및 FPS 확인.
2. 검색창에 10자를 빠르게 입력하고 Network 요청 수를 센다(디바운스 없으면 10건).
3. INP 측정: 상호작용 후 `PerformanceObserver('event')`로 지연 확인.

**PASS/FAIL**

- **PASS:** 스크롤 중 long task 없음(각 프레임 < 16ms 목표, 최소 50ms 초과 0). 리스너는 `passive`, 레이아웃 읽기는 rAF 내 일괄. 검색은 디바운스(200~400ms) + 이전 요청 취소.
- **FAIL:** 스크롤 중 long task, 입력당 요청, 스로틀 환경에서 체감 지연.

**FIX**

- 스크롤 기반 시각 효과는 CSS(`position: sticky`, `scroll-timeline`, `IntersectionObserver`)로 대체한다 — JS 핸들러 자체를 없애는 것이 최선이다.
- 불가피하면 `passive: true` + rAF 스로틀 + 읽기/쓰기 분리.
- 검색은 디바운스 + `AbortController` + 서버 페이지네이션.

**BAD**

```tsx
// ❌ 매 스크롤 이벤트마다 레이아웃 읽기 + setState
useEffect(() => {
  const onScroll = () => {
    const rect = el.current!.getBoundingClientRect();   // 강제 리플로우
    setProgress(window.scrollY / document.body.scrollHeight);
  };
  window.addEventListener('scroll', onScroll);          // passive 아님
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

**GOOD**

```tsx
// ✅ IntersectionObserver로 대체 (JS 작업 최소화)
useEffect(() => {
  const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
  if (ref.current) io.observe(ref.current);
  return () => io.disconnect();
}, []);

// ✅ 스크롤 값이 꼭 필요하면 passive + rAF 스로틀
useEffect(() => {
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; setY(window.scrollY); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
}, []);

// ✅ 검색 디바운스 + 취소
const [q, setQ] = useState('');
useEffect(() => {
  if (!q) return;
  const ac = new AbortController();
  const t = setTimeout(() => { search(q, ac.signal).then(setResults).catch(noopOnAbort); }, 300);
  return () => { clearTimeout(t); ac.abort(); };
}, [q]);
```

**REGRESSION HOOK**

```ts
test('검색 입력은 디바운스되어 요청이 폭주하지 않는다', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/search*', r => { calls++; return r.continue(); });
  await page.goto('/search');
  await page.getByRole('searchbox').pressSequentially('keyboard', { delay: 30 });
  await expect(page.getByRole('list')).toBeVisible();
  expect(calls).toBeLessThanOrEqual(2);
});
```

---

## 12. Suspense QA (`C-SUS-*`)

Suspense는 "로딩 표시 도구"가 아니라 **스트리밍 경계 설계 도구**다. 경계를 어디에 두는지가 사용자가 느끼는 속도를 결정한다.

### C-SUS-01 — 경계 배치 (전부 대기 vs 점진적 노출)

**WHY**
Suspense 경계를 페이지 최상단에 하나만 두면, **가장 느린 데이터가 전체 화면을 인질로 잡는다**. 사용자는 준비된 헤더·네비·요약조차 볼 수 없다. 반대로 경계를 지나치게 잘게 쪼개면 스켈레톤이 수십 개 깜빡여 시각적 소음(§04)이 된다.

**DETECT**

```bash
rg -n "<Suspense" src -A2 | rg -c "fallback"
rg --files src/app | rg "loading\.tsx$"
rg -n "await " src/app --glob 'page.tsx' -B5 | rg -c "Suspense"    # await가 경계 밖인지
```

**REPRODUCE**

1. 각 데이터 소스를 개별적으로 지연시킨다(`page.route` + delay).
2. 느린 소스 하나 때문에 **화면 전체가 비어 있는지** 관찰한다 → 그렇다면 경계 배치 실패.
3. 반대로 스켈레톤 개수를 센다. 한 화면에 5개 이상 동시 깜빡이면 과분할 후보(§16).

**PASS/FAIL**

- **PASS:** 정적 셸(헤더/네비/제목/레이아웃)이 즉시 표시되고, 느린 영역만 개별 스켈레톤을 보여준다. 경계 수는 시각적으로 의미 있는 영역 단위(보통 라우트당 1~4개).
- **FAIL:** 느린 하나가 전체를 막음 / 스켈레톤 난립 / 폴백 없는 경계.

**FIX**

- 경계는 **사용자가 인지하는 영역 단위**로 둔다(요약 카드 묶음, 차트, 리스트).
- 우선 표시할 콘텐츠(제목, 필터, 액션 버튼)는 경계 **밖**에 둬 즉시 렌더한다.
- `loading.tsx`는 라우트 전체 전환용, 세부 영역은 인라인 `<Suspense>`로.

**BAD**

```tsx
// ❌ 전체를 하나의 경계로 감싼다 → 가장 느린 데이터가 전체를 막음
export default function Page() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Header />       {/* 정적인데도 대기 */}
      <Summary />      {/* 200ms */}
      <SlowFeed />     {/* 3000ms — 전체를 인질로 */}
    </Suspense>
  );
}
```

**GOOD**

```tsx
// ✅ 셸 즉시 + 영역별 스트리밍
export default function Page() {
  return (
    <>
      <PageHeader title="대시보드" actions={<NewButton />} />     {/* 즉시 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<SummarySkeleton />}>
          <Summary />                                            {/* 빠름 → 먼저 채워짐 */}
        </Suspense>
        <Suspense fallback={<FeedSkeleton rows={5} />}>
          <SlowFeed />                                           {/* 느림 → 늦게 채워짐 */}
        </Suspense>
      </div>
    </>
  );
}
```

**REGRESSION HOOK**

```ts
test('느린 피드가 있어도 셸과 요약이 먼저 보인다', async ({ page }) => {
  await page.route('**/api/feed*', async r => { await new Promise(s => setTimeout(s, 3000)); await r.continue(); });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 1500 });
  await expect(page.getByTestId('summary')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('feed-skeleton')).toBeVisible();
});
```

---

### C-SUS-02 — 폴백 품질 (레이아웃 시프트·깜빡임)

**WHY**
폴백이 실제 콘텐츠와 다른 크기면 **CLS**가 발생해 사용자가 잘못된 버튼을 누른다. 반대로 데이터가 매우 빠를 때 폴백이 순간 노출되면 깜빡임(flash)으로 인지 품질이 떨어진다. 두 문제는 상반되므로 **경계별로 판단**해야 한다.

**DETECT**

```bash
rg -n "fallback=\{" src -A3 | rg -i "spinner|loading\.\.\.|null"    # 저품질 폴백 후보
rg -n "fallback=\{null\}" src                                        # 폴백 없음
```

**REPRODUCE**

1. 폴백과 실제 콘텐츠를 각각 캡처해 **같은 영역 높이/폭**인지 픽셀로 비교한다.
2. CLS 측정:

```ts
const cls = await page.evaluate(() => new Promise<number>(res => {
  let v = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) v += e.value; })
    .observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => res(v), 4000);
}));
expect(cls).toBeLessThan(0.1);
```

3. 빠른 응답(50ms)에서 폴백이 깜빡이는지 눈으로 확인한다.

**PASS/FAIL**

- **PASS:** 폴백이 실제 콘텐츠와 동일한 **영역 크기**를 예약하고, CLS < 0.1. 매우 빠른 데이터에는 폴백 지연(delay) 또는 이전 콘텐츠 유지가 적용된다.
- **FAIL:** 폴백/콘텐츠 높이 차이로 점프, `fallback={null}`로 갑작스러운 삽입, 깜빡임.

**FIX**

- 폴백은 §16 규칙에 따라 실제 레이아웃의 골격을 복제한다.
- 매우 빠른 데이터 영역은 `useDeferredValue`/이전 데이터 유지 또는 CSS `animation-delay`로 200ms 이후 폴백 표시.
- 이미지/차트 영역은 `aspect-ratio`로 공간을 미리 확보한다.

**BAD**

```tsx
<Suspense fallback={<p>Loading...</p>}>       {/* 20px → 실제 400px: 큰 점프 */}
  <Chart />
</Suspense>
```

**GOOD**

```tsx
<Suspense fallback={<div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-muted" aria-hidden />}>
  <Chart />                                    {/* 동일 비율 영역을 미리 예약 */}
</Suspense>
```

**REGRESSION HOOK** — 위 CLS 측정 스니펫을 P0 라우트마다 회귀 테스트로 편입한다(§20과 공유).

---

### C-SUS-03 — 클라이언트 전환의 `useTransition` 사용

**WHY**
필터·탭·페이지 전환 시 transition을 쓰지 않으면 **화면이 즉시 스켈레톤으로 교체**되어 사용자가 컨텍스트를 잃는다. Google/Linear 급 제품은 전환 중 **이전 콘텐츠를 유지하며 흐리게(pending) 표시**한다. 또한 전환 중 사용자가 다시 클릭할 수 있어야 한다(블로킹 금지).

**DETECT**

```bash
rg -n "useTransition|startTransition|useDeferredValue" src | wc -l
rg -n "router\.(push|replace)" src -B5 | rg -c "startTransition"
```

**REPRODUCE**

1. 느린 네트워크에서 필터를 변경 → 기존 목록이 사라지고 스켈레톤이 나오면 개선 대상(S2/S3).
2. 전환 중 다른 필터를 클릭 → 무시되거나 큐가 엉키면 FAIL.
3. 전환 중 pending 표시(진행 인디케이터, opacity, aria-busy)가 있는지 확인.

**PASS/FAIL**

- **PASS:** 목록/탭 전환에서 이전 콘텐츠가 유지되고 pending이 시각·보조기술 모두에 전달된다(`aria-busy`). 연속 조작이 최신 것으로 수렴한다.
- **FAIL:** 전환마다 화면 비움, pending 표시 없음, 연속 조작 시 잘못된 최종 상태.

**FIX**

- 클라이언트 라우팅 갱신은 `startTransition`으로 감싼다.
- pending 동안 `aria-busy="true"` + 낮은 대비 오버레이(콘텐츠 유지).
- 검색 입력 결과는 `useDeferredValue`로 입력 반응성을 지킨다.

**BAD**

```tsx
// ❌ 전환마다 화면이 비고 pending 표시가 없다
const onChange = (v: string) => router.replace(`?category=${v}`);
```

**GOOD**

```tsx
'use client';
export function FilterBar({ active }: { active: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onChange = (v: string) =>
    startTransition(() => router.replace(`?category=${v}`, { scroll: false }));

  return (
    <div aria-busy={pending} className={cn('transition-opacity', pending && 'opacity-60')}>
      <select value={active} onChange={e => onChange(e.target.value)} aria-label="카테고리">…</select>
      {pending && <span role="status" className="sr-only">목록을 갱신하는 중</span>}
    </div>
  );
}
```

**REGRESSION HOOK**

```ts
test('필터 전환 중 이전 목록이 유지된다', async ({ page }) => {
  await page.goto('/items');
  await expect(page.getByRole('listitem')).not.toHaveCount(0);
  await page.route('**/items?*', async r => { await new Promise(s => setTimeout(s, 1200)); await r.continue(); });
  await page.getByLabel('카테고리').selectOption('switch');
  await expect(page.getByRole('listitem').first()).toBeVisible();     // 즉시 비지 않는다
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
});
```

---

### C-SUS-04 — 스트리밍과 SEO/에러의 상호작용

**WHY**
스트리밍으로 늦게 도착하는 콘텐츠는 **크롤러가 볼 수도, 못 볼 수도 있다**. 핵심 SEO 콘텐츠(제목, 본문, 가격)를 Suspense 뒤에 두면 인덱싱이 불안정해진다. 또한 스트리밍 중 발생한 에러는 이미 전송된 HTML을 되돌릴 수 없으므로, 경계 없는 실패는 **깨진 반쪽 페이지**를 만든다.

**DETECT**

```bash
curl -s -N localhost:3000/items/1 | rg -c "핵심 문구"     # 초기 HTML에 포함되는지
rg -n "<Suspense" src/app -A5 | rg -i "price|title|description|h1"
```

**REPRODUCE**

1. `curl -s`(스트림 끝까지)와 `curl -s --max-time 1`(초기 청크만) 결과를 비교해 어떤 콘텐츠가 초기 HTML에 있는지 확인한다.
2. 스트리밍 중 데이터 소스를 실패시켜 페이지가 반쪽 상태로 남는지 확인한다.

**PASS/FAIL**

- **PASS:** SEO 핵심 콘텐츠는 초기 HTML(경계 밖)에 있다. 스트리밍 영역은 모두 자체 에러 경계를 가져 실패해도 나머지가 온전하다.
- **FAIL:** `h1`/가격/본문이 늦은 청크에만 존재 / 스트리밍 실패가 페이지를 깨뜨림.

**FIX**

- SEO/LCP 핵심은 경계 밖 + 서버에서 즉시 렌더. 부가 정보(추천, 리뷰 요약, 관련 항목)만 스트리밍.
- 각 스트리밍 섬에 `error.tsx` 또는 `<ErrorBoundary>`를 짝지어 부분 실패를 국소화한다(§13).

**BAD**

```tsx
// ❌ 제목·가격이 스트리밍 뒤에 → 인덱싱/LCP 모두 불리
<Suspense fallback={<Skeleton />}>
  <ProductHeader id={id} />        {/* h1 + price */}
</Suspense>
```

**GOOD**

```tsx
// ✅ 핵심은 즉시, 부가만 스트리밍
const product = await getProduct(id);            // 경계 밖: 초기 HTML에 포함
return (
  <>
    <h1 className="text-2xl font-bold">{product.name}</h1>
    <p className="text-xl">{formatPrice(product.price)}</p>

    <ErrorBoundaryClient fallback={<InlineError label="추천을 불러오지 못했습니다" />}>
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedItems id={id} />                 {/* 실패해도 페이지는 온전 */}
      </Suspense>
    </ErrorBoundaryClient>
  </>
);
```

**REGRESSION HOOK**

```ts
test('상품 핵심 정보는 초기 HTML에 포함된다', async ({ request }) => {
  const html = await (await request.get('/items/1')).text();
  expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
  expect(html).toMatch(/₩|원|\$/);                 // 가격이 초기 HTML에 존재
});
```

---

## 13. Error Boundary QA (`C-ERR-*`)

에러 처리의 목표는 "에러를 없애는 것"이 아니라 **에러가 났을 때 사용자가 계속 일할 수 있게 하는 것**이다.

### C-ERR-01 — 경계 계층 설계 (전역/라우트/컴포넌트)

**WHY**
경계가 전역에만 있으면 사소한 위젯 실패가 전 화면을 날린다. 경계가 없으면 흰 화면이 된다. 대시보드에서 위젯 하나가 실패했다고 전체를 잃는 것은 제품 신뢰를 크게 훼손한다(Stripe/Linear는 위젯 단위로 실패를 국소화한다).

**DETECT**

```bash
rg --files src/app | rg "(error|global-error)\.tsx$"
rg -n "class \w+ extends (React\.)?Component" src | rg -B2 "componentDidCatch|getDerivedStateFromError"
rg -n "ErrorBoundary" src | wc -l
```

**REPRODUCE**

1. 각 주요 위젯의 데이터 소스를 개별 실패시킨다(`page.route` per endpoint).
2. 실패 범위를 관찰: 해당 위젯만 에러 UI인가, 아니면 페이지/앱 전체가 사라지는가.
3. 레이아웃(프로바이더) 자체를 실패시켜 `global-error.tsx` 동작을 확인한다.

**PASS/FAIL**

- **PASS:** 3계층이 존재한다 — `global-error.tsx`(앱 셸 최후 방어), 라우트별 `error.tsx`(페이지 복구), 위젯별 경계(국소 실패). 위젯 실패가 페이지를 죽이지 않는다.
- **FAIL:** 한 계층이라도 없어 흰 화면 또는 과대 소실이 발생.

**FIX**

- 실패해도 나머지가 유용한 영역(차트, 추천, 코멘트, 서드파티 임베드)마다 경계를 둔다.
- 경계 UI는 **영역 크기를 유지**해 레이아웃 붕괴를 막는다.
- 서드파티 스크립트/임베드는 반드시 경계 + 타임아웃으로 감싼다.

**BAD**

```tsx
// ❌ 위젯 하나의 실패가 대시보드 전체를 날림
export default async function Page() {
  return (
    <>
      <Kpis />
      <Chart />          {/* 여기서 throw → 페이지 전체 error.tsx */}
      <Activity />
    </>
  );
}
```

**GOOD**

```tsx
// ✅ 위젯 단위 경계 (재사용 래퍼로 강제)
function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-h-[16rem] rounded-xl border p-4">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      <ErrorBoundaryClient fallback={<WidgetError title={title} />}>
        <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
      </ErrorBoundaryClient>
    </section>
  );
}

export default function Page() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Widget title="KPI"><Kpis /></Widget>
      <Widget title="추이"><Chart /></Widget>       {/* 실패해도 이 카드만 */}
      <Widget title="활동"><Activity /></Widget>
    </div>
  );
}
```

**REGRESSION HOOK**

```ts
test('차트 실패가 다른 위젯을 죽이지 않는다', async ({ page }) => {
  await page.route('**/api/chart*', r => r.fulfill({ status: 500, json: {} }));
  await page.goto('/dashboard');
  await expect(page.getByRole('alert')).toBeVisible();               // 차트 카드만
  await expect(page.getByTestId('kpis')).toBeVisible();
  await expect(page.getByTestId('activity')).toBeVisible();
});
```

---

### C-ERR-02 — 복구 경로 (reset·retry·안내)

**WHY**
에러 화면에 **다음 행동이 없으면** 사용자는 앱을 떠난다. "문제가 발생했습니다"만 있는 화면은 정보도 복구도 제공하지 않는다. 좋은 에러 UI는 (1) 무슨 일이 일어났는지, (2) 지금 무엇을 할 수 있는지, (3) 안 되면 어디로 가야 하는지를 준다.

**DETECT**

```bash
rg -n "error\.tsx" -l src/app | xargs rg -l "reset" || echo "reset 미사용 파일 존재"
rg -n "문제가 발생|Something went wrong|Error occurred" src -A5 | rg -c "button|Link"
```

**REPRODUCE**

1. 에러를 유발한 뒤 화면에서 **복구 버튼**을 찾는다. 없으면 FAIL.
2. `reset()`을 눌러 실제로 재시도되는지 확인(에러 원인이 일시적일 때 성공해야 한다).
3. 반복 실패 시 대안 경로(홈으로/지원 문의/상관관계 ID)가 제공되는지 확인.

**PASS/FAIL**

- **PASS:** 모든 에러 UI에 (a) 사람이 이해할 수 있는 설명, (b) 재시도, (c) 대안 이동 경로, (d) 지원 문의용 식별자(digest/requestId)가 있다. `role="alert"`로 보조기술에 전달된다.
- **FAIL:** 설명 없음/기술 스택 노출/복구 수단 없음/식별자 없음.

**FIX**

- `error.tsx`의 `reset`을 반드시 노출한다. 재시도로 해결 불가한 유형(권한/없음)은 다른 UI로 분기한다.
- 사용자에게 스택트레이스를 보여주지 않는다. `error.digest`만 표시하고 상세는 서버 로그로.
- 문구는 §06 UX Writing 원칙을 따른다(원인 + 다음 행동, 자책 유도 금지).

**BAD**

```tsx
'use client';
// ❌ 스택 노출 + 복구 수단 없음
export default function Error({ error }: { error: Error }) {
  return <pre>{error.stack}</pre>;
}
```

**GOOD**

```tsx
'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error); }, [error]);        // 관측(§20 모니터링)

  return (
    <div role="alert" className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">데이터를 불러오지 못했습니다</h1>
      <p className="text-sm text-muted-foreground">
        일시적인 문제일 수 있습니다. 다시 시도해 주세요.
      </p>
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
          다시 시도
        </button>
        <Link href="/dashboard" className="rounded-md border px-4 py-2">대시보드로</Link>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          문의 시 참조 코드: <code>{error.digest}</code>
        </p>
      )}
    </div>
  );
}
```

**REGRESSION HOOK**

```ts
test('에러 화면은 재시도와 참조 코드를 제공한다', async ({ page }) => {
  let fail = true;
  await page.route('**/api/items*', r => fail ? r.fulfill({ status: 500, json: {} }) : r.continue());
  await page.goto('/items');
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toContainText('at Object.');          // 스택 노출 금지
  fail = false;
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('list')).toBeVisible();
});
```

---

### C-ERR-03 — 비동기/이벤트 핸들러 에러 (경계가 못 잡는 영역)

**WHY**
React 에러 경계는 **렌더 중 에러만** 잡는다. 이벤트 핸들러, `setTimeout`, Promise rejection에서 발생한 에러는 경계를 통과해 콘솔로 사라진다 — 사용자는 **아무 반응 없음**을 경험한다("버튼을 눌렀는데 아무 일도 안 일어난다"가 가장 흔한 사용자 신고다).

**DETECT**

```bash
rg -n "onClick=\{async|onSubmit=\{async" src -A8 | rg -v "catch|try"
rg -n "\.then\(" src | rg -v "\.catch\(|catch:"
rg -n "unhandledrejection" src                  # 전역 핸들러 존재 여부
```

**REPRODUCE**

1. 버튼 동작의 API를 실패시키고 클릭한다.
2. **화면에 아무 변화가 없으면 FAIL**(콘솔 에러만 있는 경우 포함).
3. `page.on('pageerror')`와 `console` 리스너로 미처리 에러를 수집한다.

**PASS/FAIL**

- **PASS:** 모든 비동기 핸들러가 실패를 잡아 **사용자에게 보이는 피드백**(인라인 에러/토스트)을 준다. 전역 `unhandledrejection` 핸들러가 로깅한다. 미처리 rejection 0건.
- **FAIL:** 클릭 후 무반응, 콘솔에만 에러, 미처리 rejection 존재.

**FIX**

- 비동기 핸들러는 `try/catch/finally`로 감싸고 pending·error 상태를 UI에 반영한다.
- 공통 래퍼(`useAsyncAction`)로 실수를 구조적으로 차단한다.
- 전역 `unhandledrejection`은 로깅 목적으로만 두고, UI 피드백은 각 지점에서 처리한다.

**BAD**

```tsx
// ❌ 실패 시 완전 무반응
<button onClick={async () => { await save(); toast.success('저장됨'); }}>저장</button>
```

**GOOD**

```tsx
// ✅ 공통 훅으로 pending/에러/피드백을 강제
function useAsyncAction<T extends unknown[]>(fn: (...a: T) => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (...a: T) => {
    setPending(true); setError(null);
    try { await fn(...a); }
    catch (e) { setError(toUserMessage(e)); reportError(e); }
    finally { setPending(false); }
  }, [fn]);
  return { run, pending, error };
}

const { run, pending, error } = useAsyncAction(save);
return (
  <>
    <button onClick={() => run()} disabled={pending} aria-busy={pending}>
      {pending ? '저장 중…' : '저장'}
    </button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </>
);
```

**REGRESSION HOOK**

```ts
test('저장 실패는 사용자에게 보이는 에러를 만든다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/save', r => r.fulfill({ status: 500, json: {} }));
  await page.goto('/settings');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('alert')).toBeVisible();       // 무반응 아님
  expect(errors).toEqual([]);                                // 미처리 예외 없음
});
```

---

### C-ERR-04 — 에러 관측성 (로깅·상관관계·노이즈)

**WHY**
에러가 사용자에게만 보이고 팀에게 보고되지 않으면 **영원히 고쳐지지 않는다**. 반대로 모든 것을 로깅하면 노이즈에 묻혀 진짜 사고를 놓친다. 상관관계 ID가 없으면 "저 어제 에러 났어요" 신고를 추적할 수 없다.

**DETECT**

```bash
rg -n "console\.(error|warn)" src | wc -l               # 로깅 수단이 콘솔뿐인가
rg -n "Sentry|datadog|logtail|reportError|captureException" src | wc -l
rg -n "digest|requestId|correlationId|traceId" src | wc -l
```

**REPRODUCE**

1. 의도적으로 에러를 발생시키고 **모니터링 도구에 도달하는지** 확인한다(로컬은 콘솔/네트워크 요청으로).
2. 사용자에게 노출된 참조 코드로 서버 로그를 검색해 **실제로 찾을 수 있는지** 확인한다.
3. 정상 사용 5분간 발생하는 콘솔 경고 수를 센다(노이즈 기준선).

**PASS/FAIL**

- **PASS:** 에러가 중앙 수집기로 전송되고, 사용자 노출 ID로 서버 로그를 역추적할 수 있으며, 정상 사용 중 콘솔 에러/경고가 0이다.
- **FAIL:** 콘솔에만 존재 / 역추적 불가 / 정상 사용 중 경고 다발(노이즈로 실제 문제 은폐).

**FIX**

- 에러 리포터를 단일 모듈로 두고 `error.tsx`, `unhandledrejection`, 비동기 래퍼가 모두 그것을 호출하게 한다.
- 사용자 노출 ID = 서버 로그 키(digest/requestId)로 통일한다.
- 콘솔 경고는 "정상 상태 = 0건"을 기준선으로 삼고, 남은 경고는 Finding으로 등록해 제거한다.

**GOOD**

```ts
// ✅ lib/report-error.ts — 단일 진입점
type Ctx = { route?: string; userId?: string; digest?: string };

export function reportError(e: unknown, ctx: Ctx = {}) {
  const payload = {
    message: e instanceof Error ? e.message : String(e),
    stack: e instanceof Error ? e.stack : undefined,
    ...ctx,
    ts: new Date().toISOString(),
    release: process.env.NEXT_PUBLIC_RELEASE,
  };
  if (process.env.NODE_ENV === 'development') { console.error('[report]', payload); return; }
  navigator.sendBeacon?.('/api/telemetry/error', JSON.stringify(payload));
}

// 전역 안전망 (app/providers.tsx의 클라이언트 컴포넌트에서)
useEffect(() => {
  const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, { route: location.pathname });
  window.addEventListener('unhandledrejection', onRejection);
  return () => window.removeEventListener('unhandledrejection', onRejection);
}, []);
```

**REGRESSION HOOK**

```ts
// 모든 e2e 테스트에 공통 적용 (fixture) — 콘솔 청결도를 상시 가드
test.beforeEach(async ({ page }) => {
  const bad: string[] = [];
  page.on('console', m => { if (m.type() === 'error') bad.push(m.text()); });
  page.on('pageerror', e => bad.push(e.message));
  (test.info() as any).__bad = bad;
});
test.afterEach(async () => {
  const bad = (test.info() as any).__bad as string[];
  expect(bad.filter(t => !/ResizeObserver loop|third-party-known-noise/.test(t))).toEqual([]);
});
```

---

## 14. Hydration QA (`C-HYD-*`)

하이드레이션 불일치는 **가장 과소평가된 결함군**이다. 콘솔 경고 한 줄로 보이지만, 실제로는 React가 해당 서브트리를 폐기하고 클라이언트에서 다시 렌더한다 — 그 과정에서 이벤트 핸들러가 붙지 않아 **버튼이 죽고**, 레이아웃이 튀고(CLS), 상태가 초기화된다.

### C-HYD-01 — 비결정적 렌더 (시간·랜덤·로케일)

**WHY**
`new Date()`, `Math.random()`, `toLocaleString()`(서버/클라이언트 타임존·로케일 차이)는 서버와 클라이언트에서 **다른 결과**를 낸다. 서버는 UTC, 브라우저는 KST면 날짜가 하루 다르게 표시되고 하이드레이션이 깨진다. 이 결함은 배포 후 특정 시간대 사용자에게만 나타나 재현이 어렵다.

**DETECT**

```bash
rg -n "new Date\(\)|Date\.now\(\)|Math\.random\(\)|crypto\.randomUUID\(\)" src --glob '*.tsx'
rg -n "toLocaleString|toLocaleDateString|toLocaleTimeString|Intl\." src --glob '*.tsx'
rg -n "suppressHydrationWarning" src         # 은폐 흔적 = 즉시 Finding
```

**REPRODUCE**

1. 타임존을 바꿔 두 번 로드한다(같은 화면에서 날짜/시간 텍스트 비교).

```ts
const ctx = await browser.newContext({ timezoneId: 'America/New_York', locale: 'en-US' });
```

2. 콘솔에서 hydration 관련 경고를 수집한다(문구: "Hydration failed", "did not match", "Text content does not match").
3. HTML(SSR)과 하이드레이션 후 DOM의 해당 텍스트를 비교한다.

```ts
const ssr = (await (await request.get('/')).text()).match(/data-testid="published">([^<]+)/)?.[1];
await page.goto('/');
const csr = await page.getByTestId('published').textContent();
expect(csr).toBe(ssr);
```

**PASS/FAIL**

- **PASS:** 콘솔 hydration 경고 0. 시간/날짜/랜덤이 서버·클라이언트에서 동일하게 렌더된다(또는 클라이언트 전용으로 명시 처리).
- **FAIL:** 경고 발생, 타임존 변경 시 텍스트 불일치, `suppressHydrationWarning`으로 은폐된 지점.

**FIX**

- 시간 포맷팅은 **서버에서 확정**해 문자열로 내리거나, 타임존을 명시(`timeZone: 'Asia/Seoul'`)해 양쪽 결과를 동일하게 만든다.
- "N분 전" 상대 시간은 클라이언트 전용으로 처리하고, 초기 렌더는 절대 시간(또는 서버가 계산한 값)으로 한다.
- 랜덤/UUID는 렌더 중 생성하지 않는다. `useId()`(React) 또는 서버 생성 값을 사용한다.

**BAD**

```tsx
// ❌ 서버/클라이언트 결과 상이 → 하이드레이션 파괴
<span>{new Date(post.createdAt).toLocaleDateString()}</span>
<div id={`row-${Math.random()}`}>…</div>
<span>{formatRelative(new Date(), post.createdAt)}</span>
```

**GOOD**

```tsx
// ✅ 타임존 명시 → 양쪽 동일 결과
const fmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', dateStyle: 'medium',
});
<time dateTime={post.createdAt}>{fmt.format(new Date(post.createdAt))}</time>

// ✅ 상대 시간은 마운트 후에만 (초기 렌더는 절대 시간 → 불일치 없음)
'use client';
export function RelativeTime({ iso, absolute }: { iso: string; absolute: string }) {
  const [rel, setRel] = useState<string | null>(null);
  useEffect(() => { setRel(formatRelative(iso)); }, [iso]);
  return <time dateTime={iso} title={absolute}>{rel ?? absolute}</time>;
}

// ✅ 안정적 id는 useId
const id = useId();
<input id={`${id}-email`} />
```

**REGRESSION HOOK**

```ts
for (const tz of ['Asia/Seoul', 'America/New_York', 'UTC']) {
  test(`하이드레이션 경고 없음 @${tz}`, async ({ browser }) => {
    const ctx = await browser.newContext({ timezoneId: tz });
    const page = await ctx.newPage();
    const warn: string[] = [];
    page.on('console', m => { if (/hydrat|did not match|Text content/i.test(m.text())) warn.push(m.text()); });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(warn).toEqual([]);
  });
}
```

---

### C-HYD-02 — 브라우저 전용 상태를 첫 렌더에 사용

**WHY**
`localStorage`/`matchMedia`/`window.innerWidth` 기반 값을 첫 렌더에 쓰면 서버는 그 값을 모르므로 반드시 불일치한다. 흔한 증상: 사이드바가 열린 채 SSR → 접힌 상태로 점프, 모바일 레이아웃이 데스크톱으로 한 번 그려짐(CLS), 로그인 상태가 깜빡임(로그아웃 → 로그인).

**DETECT**

```bash
rg -n "typeof window !== ['\"]undefined['\"]" src --glob '*.tsx'      # 첫 렌더 분기 = 불일치 원인
rg -n "useState\(.*localStorage|useState\(.*window\." src
rg -n "matchMedia" src --glob '*.tsx'
```

**REPRODUCE**

1. 해당 값을 비기본으로 설정하고(사이드바 접힘, 다크 모드) 새로고침 → **첫 프레임에서 잘못된 상태가 보이고 점프**하는지 슬로우 모션 캡처로 확인.

```ts
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto('/');
await page.screenshot({ path: 'tmp/qa/first-paint.png' });   // 점프 전 캡처
```

2. CLS를 측정한다(§20 스니펫). 초기 점프는 CLS로 잡힌다.

**PASS/FAIL**

- **PASS:** 첫 렌더가 서버·클라이언트 동일하다. 기기 설정은 **쿠키**로 서버에 전달되어 SSR에 반영된다. 마운트 전후 시각적 점프 없음.
- **FAIL:** `typeof window` 분기로 첫 렌더가 갈림, 점프 발생, hydration 경고.

**FIX**

- 서버가 알아야 하는 설정은 **쿠키**로 저장한다(테마, 사이드바, 언어). localStorage는 서버 렌더가 필요 없는 것만.
- 불가피하게 클라이언트 전용이면, 서버·클라이언트 **첫 렌더를 동일한 폴백**으로 맞추고 마운트 후 갱신한다(점프를 CSS 트랜지션 없이 즉시 처리해 인지 비용을 줄인다).
- 미디어 쿼리 분기는 CSS로 처리한다(JS 분기 제거가 최선).

**BAD**

```tsx
'use client';
// ❌ 서버는 항상 false → 첫 프레임 불일치 + 점프
const [dark, setDark] = useState(
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
);
```

**GOOD**

```tsx
// ✅ 쿠키 기반 SSR (점프·불일치 원천 제거)
// app/layout.tsx
import { cookies } from 'next/headers';
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get('theme')?.value === 'dark' ? 'dark' : '';
  return (
    <html lang="ko" className={theme}>
      <body>{children}</body>
    </html>
  );
}

// ✅ 토글은 쿠키에 기록 (다음 SSR부터 반영)
'use client';
function ThemeToggle({ initial }: { initial: 'light' | 'dark' }) {
  const [theme, setTheme] = useState(initial);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  return <button onClick={toggle} aria-label={`${theme === 'dark' ? '라이트' : '다크'} 모드로 전환`}>…</button>;
}
```

**REGRESSION HOOK**

```ts
test('다크 모드 새로고침에서 첫 프레임이 밝게 깜빡이지 않는다', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: /모드로 전환/ }).click();      // 쿠키 기록
  await page.reload();
  const cls = await page.evaluate(() => new Promise<number>(res => {
    let v = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) v += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res(v), 2500);
  }));
  expect(cls).toBeLessThan(0.05);
});
```

---

### C-HYD-03 — 테마/인증 등 프로바이더 초기 상태 불일치 (FOUC·플래시)

**WHY**
테마·인증·기능 플래그 프로바이더가 클라이언트에서만 상태를 알면, 사용자는 **잘못된 화면을 먼저 본다**: 라이트 → 다크 플래시, 로그아웃 헤더 → 로그인 헤더, 유료 기능 잠금 → 해제. 이 플래시는 "제품이 조잡하다"는 인상을 만드는 가장 큰 원인이며, 로그인 상태 플래시는 **정보 노출**로도 볼 수 있다.

**DETECT**

```bash
rg -n "ThemeProvider|AuthProvider|FlagProvider" src -A10 | rg -n "useEffect|mounted"
rg -n "if \(!mounted\) return null" src            # 마운트 전 렌더 회피 = 셸 깜빡임
rg -n "next-themes" src
```

**REPRODUCE**

1. 다크 모드 + 로그인 상태로 새로고침을 20회 반복하고, 각 회차의 **첫 200ms 스크린샷**을 수집해 플래시를 확인한다.

```ts
await page.goto('/', { waitUntil: 'commit' });
await page.screenshot({ path: `tmp/qa/flash-${i}.png` });
```

2. 느린 CPU(4x throttle)에서 플래시가 커지는지 확인한다(실사용자 조건).

**PASS/FAIL**

- **PASS:** 첫 페인트가 최종 상태와 동일하다(테마·인증·플래그). `if (!mounted) return null` 패턴으로 인한 셸 소실이 없다.
- **FAIL:** 색상/헤더/기능 상태 플래시, 마운트 전 빈 화면.

**FIX**

- 서버가 상태를 결정한다: 테마는 쿠키(§C-HYD-02), 인증은 서버 세션을 읽어 초기 props로 내린다.
- `next-themes`류를 쓸 때도 초기 클래스를 서버에서 넣거나 인라인 스크립트로 **페인트 전에** 적용한다.
- `mounted` 게이팅은 최후 수단이며, 그 경우 **레이아웃을 유지하는 폴백**을 반환한다(null 금지).

**BAD**

```tsx
'use client';
// ❌ 마운트 전 아무것도 렌더하지 않음 → 셸 깜빡임 + CLS
export function Header() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;                     // 헤더가 늦게 나타남
  return <header>{user ? <Profile user={user} /> : <LoginButton />}</header>;
}
```

**GOOD**

```tsx
// ✅ 서버가 초기 상태를 결정 → 첫 페인트가 곧 최종 상태
// app/layout.tsx (server)
const session = await getSession();
return (
  <html lang="ko" className={theme}>
    <body>
      <AuthProvider initialUser={session?.user ?? null}>
        <Header />                                {/* 서버 렌더 시점에 이미 정확 */}
        {children}
      </AuthProvider>
    </body>
  </html>
);

// ✅ 페인트 전 테마 적용이 꼭 필요한 경우 (쿠키 사용 불가한 정적 라우트)
<script
  dangerouslySetInnerHTML={{ __html:
    `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`
  }}
/>
```

> 위 인라인 스크립트는 §19 CSP와 충돌할 수 있다. nonce를 부여하거나 쿠키 방식으로 대체한다. 둘 중 하나를 반드시 선택하고 리포트에 명시한다.

**REGRESSION HOOK**

```ts
test('로그인 상태에서 헤더가 로그아웃 상태로 깜빡이지 않는다', async ({ page }) => {
  await loginAs(page, 'user@acme.test');                 // storageState 사용 권장
  await page.goto('/dashboard', { waitUntil: 'commit' });
  const html = await page.content();                     // 첫 HTML
  expect(html).toContain('data-user-menu');              // SSR에 이미 로그인 UI
  expect(html).not.toContain('data-login-button');
});
```

---

### C-HYD-04 — 잘못된 HTML 중첩으로 인한 하이드레이션 실패

**WHY**
`<p>` 안의 `<div>`, `<a>` 안의 `<a>`, `<button>` 안의 `<button>`, `<ul>` 직계의 `<div>`는 브라우저가 **파싱 단계에서 DOM을 교정**한다. 서버 HTML과 클라이언트 트리 구조가 달라지므로 하이드레이션이 반드시 깨진다. 증상은 무작위적이다("특정 카드만 클릭이 안 된다").

**DETECT**

```bash
rg -n "<p[ >]" src -A5 | rg "<div|<section|<ul|<p[ >]"       # p 안 블록 요소
rg -n "<a\b" src -A5 | rg "<a\b"                              # 중첩 앵커
rg -n "<button" src -A5 | rg "<button|<a\b"                    # 중첩 인터랙티브
rg -n "<(ul|ol)>" src -A3 | rg -v "<li|\{.*map"                # 리스트 직계 비-li
```

**REPRODUCE**

1. 콘솔에서 hydration 경고와 함께 "In HTML, `<div>` cannot be a descendant of `<p>`" 류 메시지를 수집한다(React 19는 상세히 알려준다).
2. 해당 컴포넌트의 인터랙션이 작동하는지 확인한다(핸들러 유실 여부).
3. HTML 유효성 검사를 자동화한다(`html-validate` 등) — CI에 넣으면 영구 차단된다.

**PASS/FAIL**

- **PASS:** 하이드레이션/HTML 중첩 경고 0. 모든 인터랙티브 요소가 단독 중첩.
- **FAIL:** 중첩 위반 1건 이상 또는 관련 경고.

**FIX**

- 텍스트 래퍼를 `<p>` → `<div>`로 바꾸거나, 블록 자식을 밖으로 옮긴다.
- 카드 전체 클릭 + 내부 버튼은 **중첩 대신 오버레이 링크** 패턴으로 구현한다.
- 리스트는 `<li>`만 직계에 둔다(래퍼가 필요하면 `<li>` 안에).

**BAD**

```tsx
// ❌ p > div, a > button 중첩
<p className="text-sm">
  <div className="flex gap-2"><Badge />{summary}</div>
</p>

<Link href={`/items/${id}`}>
  <div>
    {title}
    <button onClick={remove}>삭제</button>       {/* a > button */}
  </div>
</Link>
```

**GOOD**

```tsx
// ✅ 유효한 중첩
<div className="text-sm">
  <div className="flex gap-2"><Badge />{summary}</div>
</div>

// ✅ 오버레이 링크 패턴: 카드 전체 클릭 + 독립 버튼 공존
<article className="relative rounded-xl border p-4">
  <h3 className="font-medium">
    <Link href={`/items/${id}`} className="after:absolute after:inset-0 after:content-['']">
      {title}
    </Link>
  </h3>
  <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
  <button type="button" onClick={remove} className="relative z-10 mt-3 text-sm underline">
    삭제
  </button>
</article>
```

**REGRESSION HOOK**

```ts
test('하이드레이션/HTML 중첩 경고가 없다', async ({ page }) => {
  const warn: string[] = [];
  page.on('console', m => { if (/cannot be a (child|descendant)|hydrat|validateDOMNesting/i.test(m.text())) warn.push(m.text()); });
  for (const p of ['/', '/items', '/dashboard']) {
    await page.goto(p);
    await page.waitForLoadState('networkidle');
  }
  expect(warn).toEqual([]);
});
```

---

### C-HYD-05 — 서드파티 스크립트/확장에 의한 DOM 변조

**WHY**
번역 확장, 광고 차단기, 분석 스크립트가 DOM을 수정하면 하이드레이션이 깨질 수 있다. 이것은 개발자 코드 문제가 아니지만 **사용자에게는 우리 제품의 버그**로 보인다. 대응 전략이 필요하다: 취약 영역 최소화, 국소 `suppressHydrationWarning`(여기서는 정당), 스크립트 로딩 전략.

**DETECT**

```bash
rg -n "next/script|<script" src
rg -n "strategy=" src | rg -o "strategy=\"\w+\""      # beforeInteractive 남용 확인
rg -n "suppressHydrationWarning" src                   # 사유 주석 존재 확인
```

**REPRODUCE**

1. 브라우저 확장(Google 번역, 다크 리더)을 켠 프로필로 주요 화면을 로드해 콘솔·동작을 확인한다.
2. 분석/채팅 위젯 스크립트를 차단(`page.route('**/analytics.js', r => r.abort())`)하고 앱이 정상인지 확인한다 — 서드파티 실패가 앱을 죽이면 FAIL.
3. `beforeInteractive` 스크립트가 첫 페인트를 지연시키는지 측정한다.

**PASS/FAIL**

- **PASS:** 서드파티 스크립트 실패/차단 시에도 핵심 기능이 동작한다. 스크립트는 적절한 `strategy`(대개 `afterInteractive`/`lazyOnload`)를 쓴다. 번역 확장으로 인한 크래시가 없다.
- **FAIL:** 서드파티 차단 시 화면 붕괴, `beforeInteractive` 남용으로 LCP 악화, 번역 확장에서 크래시.

**FIX**

- 서드파티는 `next/script`의 `afterInteractive`/`lazyOnload`로 로드하고 실패를 무시하도록 감싼다.
- 텍스트 노드만 있는 요소에 조건부 렌더를 걸지 않는다(번역 확장이 텍스트를 교체해도 구조가 유지되게).
- 정당한 경우에만 `suppressHydrationWarning`을 **한 노드에** 쓰고 사유를 주석으로 남긴다.

**GOOD**

```tsx
// ✅ 서드파티는 지연 로드 + 실패 무시
import Script from 'next/script';

<Script
  src="https://cdn.example.com/analytics.js"
  strategy="lazyOnload"
  onError={() => reportError(new Error('analytics load failed'))}   // 앱은 계속 동작
/>

// ✅ 정당한 국소 억제 (사유 명시)
{/* 브라우저 번역 확장이 이 텍스트 노드를 교체할 수 있음. 구조는 동일하므로 안전. */}
<span suppressHydrationWarning>{label}</span>
```

**REGRESSION HOOK**

```ts
test('서드파티 스크립트가 차단돼도 핵심 플로우가 동작한다', async ({ page }) => {
  await page.route(/analytics|gtag|hotjar|intercom/, r => r.abort());
  await page.goto('/checkout');
  await page.getByRole('button', { name: '결제' }).click();
  await expect(page.getByText('결제 완료')).toBeVisible();
});
```

---

## 15. Loading QA (`C-LOD-*`)

로딩 UI의 목적은 "기다리게 하는 것"이 아니라 **기다림을 이해하게 하는 것**이다. 판정 기준은 시간과 정보량이다.

### C-LOD-01 — 로딩 상태 존재 및 타이밍 임계값

**WHY**
100ms 이내 반응은 즉시로 느껴지고, 1초까지는 흐름이 유지되며, 그 이상은 **의심**이 생긴다(Nielsen). 로딩 표시가 없으면 사용자는 클릭이 씹혔다고 판단해 중복 조작하거나 이탈한다. 반대로 100ms 안에 끝나는 작업에 스피너를 띄우면 **깜빡임**이 인지 품질을 떨어뜨린다.

**타이밍 규칙 (Agent는 이 표로 판정한다)**

| 예상 소요 | 필요한 UI |
|-----------|-----------|
| < 100ms | 없음 (즉시 결과) |
| 100~300ms | 낙관적 갱신 또는 미세한 pending(버튼 비활성/아이콘) |
| 300ms~1s | 인라인 pending + 조작 차단 표시 |
| 1s~3s | 스켈레톤(§16) 또는 진행 인디케이터 |
| 3s~10s | 진행률 + 남은 시간 또는 단계 표시 + 취소 수단 |
| > 10s | 백그라운드 작업으로 전환 + 완료 알림 |

**DETECT**

```bash
rg -n "onClick=\{async|action=\{" src -A8 | rg -c "pending|isLoading|disabled|useFormStatus"
rg --files src/app | rg "loading\.tsx$"
rg -n "useFormStatus|useTransition|aria-busy" src | wc -l
```

**REPRODUCE**

1. 각 주요 인터랙션의 실제 소요 시간을 측정한다(Network 패널 또는 `performance.now()`).
2. Slow 3G + 4x CPU에서 각 인터랙션을 실행하고 **위 표와 대조**한다.
3. 3초 이상 걸리는 작업에 취소 수단이 있는지 확인한다.

**PASS/FAIL**

- **PASS:** 모든 인터랙션이 위 표의 요구 UI를 갖는다. 3초 이상 작업에 취소/이탈 가능. 로딩 중 중복 조작 차단.
- **FAIL:** 300ms 이상 무반응 구간 존재, 취소 불가한 장시간 대기, 100ms 작업의 스피너 깜빡임.

**FIX**

- 서버 액션은 `useFormStatus`, 클라이언트 전환은 `useTransition`, 데이터는 Suspense로 각각 표준화한다.
- 100~300ms 구간은 낙관적 UI(§C-STA-04)로 아예 대기를 없앤다.
- 장시간 작업은 잡 큐 + 폴링/웹소켓 + 완료 알림으로 전환한다.

**BAD**

```tsx
// ❌ 2초 걸리는 제출에 아무 표시 없음 → 사용자는 3번 누른다
<button onClick={() => submit()}>제출</button>
```

**GOOD**

```tsx
// ✅ pending 즉시 반영 + 중복 차단 + 보조기술 전달
const [pending, start] = useTransition();
<button
  onClick={() => start(submit)}
  disabled={pending}
  aria-busy={pending}
  className="inline-flex items-center gap-2"
>
  {pending && <Spinner className="size-4 animate-spin" aria-hidden />}
  {pending ? '제출 중…' : '제출'}
</button>
```

**REGRESSION HOOK**

```ts
test('느린 제출에서 pending 상태가 300ms 내에 나타난다', async ({ page }) => {
  await page.route('**/api/submit', async r => { await new Promise(s => setTimeout(s, 2000)); await r.continue(); });
  await page.goto('/form');
  const btn = page.getByRole('button', { name: '제출' });
  await btn.click();
  await expect(btn).toBeDisabled({ timeout: 300 });
  await expect(btn).toHaveAttribute('aria-busy', 'true');
});
```

---

### C-LOD-02 — 로딩 상태의 접근성 및 중복 방지

**WHY**
시각적 스피너는 스크린리더 사용자에게 **아무 정보도 주지 않는다**. `aria-busy`/`role="status"`가 없으면 화면이 바뀌었는지 알 수 없다. 또한 로딩 중 폼이 활성 상태로 남으면 중복 제출이 발생한다(§C-RCT-08).

**DETECT**

```bash
rg -n "animate-spin|Spinner|Loader" src -B3 -A3 | rg -c "aria-|role="
rg -n "role=\"status\"|aria-live" src | wc -l
rg -n "aria-busy" src | wc -l
```

**REPRODUCE**

1. 스크린리더(NVDA/VoiceOver) 또는 접근성 트리 검사로 로딩 시작·종료가 **읽히는지** 확인한다.
2. 키보드만으로 제출 후 상태 변화가 안내되는지 확인한다.
3. 로딩 중 Enter를 반복 입력해 중복 제출이 되는지 확인한다.

**PASS/FAIL**

- **PASS:** 로딩 시작/완료가 `role="status"`(polite)로 안내되고, 대상 영역에 `aria-busy="true"`가 설정되며, 완료 후 제거된다. 스피너 아이콘은 `aria-hidden`. 로딩 중 중복 제출 불가.
- **FAIL:** 보조기술에 무통보, 스피너가 텍스트로 읽힘("애니메이션"), 중복 제출 가능.

**FIX**

- 로딩 문구는 `sr-only` 텍스트 + `role="status"`로 제공한다(시각 사용자에게는 스피너, 보조기술에는 문장).
- 아이콘은 항상 `aria-hidden="true"`.
- 완료 시에도 결과를 안내한다(§06 Success Feedback).

**BAD**

```tsx
// ❌ 보조기술에 아무 정보 없음
{loading && <Spinner />}
```

**GOOD**

```tsx
// ✅ 시각 + 보조기술 모두 대응
<div aria-busy={loading || undefined}>
  {loading && (
    <>
      <Spinner className="size-4 animate-spin" aria-hidden="true" />
      <span role="status" className="sr-only">목록을 불러오는 중입니다</span>
    </>
  )}
  {!loading && <span role="status" className="sr-only">{items.length}개 항목을 불러왔습니다</span>}
</div>
```

**REGRESSION HOOK**

```ts
test('로딩 상태가 보조기술에 전달된다', async ({ page }) => {
  await page.route('**/api/items*', async r => { await new Promise(s => setTimeout(s, 1000)); await r.continue(); });
  await page.goto('/items');
  await expect(page.getByRole('status')).toContainText(/불러오는 중/);
  await expect(page.getByRole('status')).toContainText(/개 항목/, { timeout: 5000 });
});
```

---

### C-LOD-03 — 로딩 → 데이터/빈 상태 전환 정합성

**WHY**
로딩이 끝났는데 데이터가 0건일 때 **로딩 UI가 그대로 남거나 빈 화면**이 되면, 사용자는 고장으로 인식한다. 반대로 데이터가 도착했는데 스켈레톤이 잔존하면 이중 표시가 된다. 이 전환은 §C-STA-02의 상태 머신으로 해결된다.

**DETECT**

```bash
rg -n "\.length === 0|\.length > 0|isEmpty" src --glob '*.tsx' | wc -l
rg -n "EmptyState|빈 목록|아직 없" src | wc -l
```

**REPRODUCE**

1. 빈 응답을 목킹한다: `page.route('**/api/items*', r => r.fulfill({ json: { items: [] } }))`.
2. 로딩 종료 후 **빈 상태 UI**(설명 + 다음 행동)가 나오는지 확인. 빈 화면/잔존 스켈레톤이면 FAIL.
3. 검색 결과 0건과 데이터 자체가 없는 경우를 **구분해서** 보여주는지 확인(문구가 달라야 한다).

**PASS/FAIL**

- **PASS:** loading → (ok | empty | error) 전환이 배타적이며, empty는 원인별로 다른 문구와 행동(생성 CTA vs 필터 초기화)을 제공한다.
- **FAIL:** 빈 화면, 잔존 스켈레톤, 검색 0건과 최초 empty를 동일 문구로 처리.

**FIX**

- 상태 머신에 `empty`를 1급 상태로 포함한다(§C-STA-02).
- empty 문구는 §06 규칙: 무엇이 없는지 + 왜 없는지 + 무엇을 하면 되는지.
- 필터로 인한 0건은 "필터 초기화" 액션을 제공한다.

**BAD**

```tsx
// ❌ 0건이면 아무것도 없다
{loading ? <Skeleton /> : <List items={items} />}
```

**GOOD**

```tsx
// ✅ 원인별 빈 상태
if (state.k === 'loading') return <ListSkeleton rows={6} />;
if (state.k === 'error')   return <ErrorState onRetry={state.retry} />;
if (state.k === 'empty') {
  return hasActiveFilters
    ? <EmptyState
        title="조건에 맞는 항목이 없습니다"
        description="필터를 완화하거나 초기화해 보세요."
        action={<button onClick={clearFilters}>필터 초기화</button>} />
    : <EmptyState
        title="아직 항목이 없습니다"
        description="첫 항목을 만들면 여기에 표시됩니다."
        action={<Link href="/items/new" className="btn-primary">항목 만들기</Link>} />;
}
return <List items={state.data} />;
```

**REGRESSION HOOK**

```ts
test('빈 응답에서 빈 상태와 CTA가 표시된다', async ({ page }) => {
  await page.route('**/api/items*', r => r.fulfill({ json: { items: [] } }));
  await page.goto('/items');
  await expect(page.getByText('아직 항목이 없습니다')).toBeVisible();
  await expect(page.getByRole('link', { name: '항목 만들기' })).toBeVisible();
  await expect(page.getByTestId('list-skeleton')).toHaveCount(0);
});
```

---

## 16. Skeleton QA (`C-SKL-*`)

스켈레톤은 "회색 박스"가 아니라 **레이아웃 계약**이다. 실제 콘텐츠와 형태가 다르면 스켈레톤이 오히려 CLS와 인지 부조화를 만든다.

### C-SKL-01 — 스켈레톤/실제 레이아웃 일치

**WHY**
스켈레톤이 실제와 다른 높이·개수·간격이면, 콘텐츠 도착 시 화면이 튀고 사용자가 누르려던 버튼이 이동한다(오클릭). Google의 CLS 임계(0.1)는 대부분 이 문제에서 초과된다. 또한 형태가 다르면 사용자가 "다른 화면으로 바뀌었다"고 느낀다.

**DETECT**

```bash
rg -l "Skeleton" src | sort
rg -n "animate-pulse" src | wc -l
# 스켈레톤 컴포넌트와 실제 컴포넌트가 같은 레이아웃 상수를 공유하는지 확인
rg -n "h-\[|min-h-\[|aspect-" src | rg -i skeleton
```

**REPRODUCE**

1. 스켈레톤 상태와 로딩 완료 상태를 **동일 뷰포트에서 캡처**해 겹쳐 비교한다.

```ts
await page.route('**/api/items*', async r => { await new Promise(s => setTimeout(s, 5000)); await r.continue(); });
await page.goto('/items');
await page.getByTestId('list-skeleton').screenshot({ path: 'tmp/qa/skeleton.png' });
await page.unroute('**/api/items*');
await page.reload();
await page.getByRole('list').screenshot({ path: 'tmp/qa/loaded.png' });
```

2. 두 이미지의 높이 차이를 확인하고, CLS를 측정한다(§20).

**PASS/FAIL**

- **PASS:** 스켈레톤과 실제 콘텐츠의 컨테이너 높이 차이가 **8px 이내**, 항목 수·간격·주요 블록 위치가 동일. CLS < 0.1.
- **FAIL:** 높이/개수 불일치로 점프, 스켈레톤이 실제보다 현저히 작거나 큼.

**FIX**

- 스켈레톤과 실제 컴포넌트가 **같은 레이아웃 클래스**를 공유하게 만든다(높이 상수를 한 곳에서 관리).
- 항목 수는 실제 페이지 크기와 동일하게(페이지당 10개면 스켈레톤도 10개).
- 이미지 영역은 `aspect-ratio`로 예약한다.

**BAD**

```tsx
// ❌ 실제와 무관한 형태 → 도착 시 점프
export function ListSkeleton() {
  return <div className="h-8 w-full animate-pulse bg-muted" />;
}
```

**GOOD**

```tsx
// ✅ 레이아웃 상수 공유
const ROW = 'flex items-center gap-3 rounded-lg border p-4';       // 실제/스켈레톤 공용
const AVATAR = 'size-10 shrink-0 rounded-full';

export function ItemRow({ item }: { item: Item }) {
  return (
    <li className={ROW}>
      <Image src={item.avatar} alt="" width={40} height={40} className={AVATAR} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="truncate text-sm text-muted-foreground">{item.desc}</p>
      </div>
    </li>
  );
}

export function ListSkeleton({ rows = 10 }: { rows?: number }) {   // 실제 페이지 크기와 동일
  return (
    <ul data-testid="list-skeleton" className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={ROW}>
          <div className={cn(AVATAR, 'animate-pulse bg-muted')} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
```

**REGRESSION HOOK**

```ts
test('스켈레톤과 실제 목록의 높이가 유사하다 (CLS 방지)', async ({ page }) => {
  await page.route('**/api/items*', async r => { await new Promise(s => setTimeout(s, 3000)); await r.continue(); });
  await page.goto('/items');
  const sk = await page.getByTestId('list-skeleton').boundingBox();
  await expect(page.getByRole('list', { name: '항목 목록' })).toBeVisible({ timeout: 8000 });
  const real = await page.getByRole('list', { name: '항목 목록' }).boundingBox();
  expect(Math.abs((sk!.height) - (real!.height))).toBeLessThan(24);
});
```

---

### C-SKL-02 — 스켈레톤 접근성 및 모션

**WHY**
스켈레톤이 스크린리더에 읽히면 의미 없는 노이즈("빈 항목, 빈 항목…")가 된다. 또한 `animate-pulse`는 `prefers-reduced-motion` 사용자에게 불편/현기증을 유발할 수 있다(WCAG 2.3.3).

**DETECT**

```bash
rg -n "animate-pulse|animate-shimmer" src -B3 | rg -c "aria-hidden"
rg -n "motion-reduce:|prefers-reduced-motion" src | wc -l
```

**REPRODUCE**

1. 접근성 트리에서 스켈레톤 노드가 제외됐는지 확인한다.
2. `prefers-reduced-motion: reduce`로 로드해 펄스가 멈추는지 확인한다.

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
```

**PASS/FAIL**

- **PASS:** 스켈레톤 컨테이너에 `aria-hidden="true"`, 대체로 `role="status"` 문구 하나가 로딩을 안내한다. reduced-motion에서 애니메이션이 정지 또는 저강도로 대체된다.
- **FAIL:** 스켈레톤이 읽힘, reduced-motion 무시.

**FIX**

- 스켈레톤 트리는 `aria-hidden`, 안내는 `sr-only` + `role="status"` 한 곳.
- 전역 CSS에서 reduced-motion 시 애니메이션을 차단한다(§09).

**GOOD**

```tsx
<>
  <span role="status" className="sr-only">불러오는 중</span>
  <ul aria-hidden="true" className="space-y-2">{/* 스켈레톤 행 */}</ul>
</>
```

```css
/* globals.css — 전역 모션 정책 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**REGRESSION HOOK**

```ts
test('reduced-motion에서 스켈레톤 애니메이션이 사실상 정지한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/items*', async r => { await new Promise(s => setTimeout(s, 2000)); await r.continue(); });
  await page.goto('/items');
  const dur = await page.getByTestId('list-skeleton').locator('div').first()
    .evaluate(el => getComputedStyle(el).animationDuration);
  expect(parseFloat(dur)).toBeLessThan(0.05);
});
```

---

### C-SKL-03 — 스켈레톤 남용 (스켈레톤이 필요 없는 곳)

**WHY**
캐시된 데이터, 낙관적 갱신 가능한 조작, 100ms 이내 응답에 스켈레톤을 쓰면 **깜빡임**이 되어 오히려 느리게 느껴진다. Linear/Vercel 같은 제품은 재방문 시 스켈레톤을 거의 보여주지 않는다 — 이전 데이터를 유지하고 백그라운드에서 갱신한다(stale-while-revalidate).

**DETECT**

```bash
rg -n "Skeleton" src | wc -l
rg -n "loading\.tsx" -l src/app | wc -l           # 라우트 전체 스켈레톤 남용 확인
rg -n "keepPreviousData|placeholderData|useDeferredValue|startTransition" src | wc -l
```

**REPRODUCE**

1. 같은 화면을 두 번 방문(뒤로 → 앞으로)해 스켈레톤이 다시 나오는지 확인 → 캐시가 있는데 스켈레톤이면 개선 대상.
2. 빠른 응답(50ms)에서 스켈레톤 깜빡임을 슬로우 캡처로 확인한다.

**PASS/FAIL**

- **PASS:** 캐시된 재방문에서 즉시 콘텐츠가 보인다. 필터/페이지 전환은 이전 데이터 유지 + pending 표시(§C-SUS-03). 스켈레톤은 **최초 진입/캐시 없음**에만.
- **FAIL:** 재방문마다 스켈레톤, 빠른 응답에서 깜빡임.

**FIX**

- 라우터 캐시/데이터 캐시를 활용하고, 전환은 transition으로 감싼다.
- 200ms 이내 도착이 예상되는 경우 폴백 표시를 지연시킨다(CSS `animation-delay` 또는 지연 마운트).

**GOOD**

```tsx
// ✅ 폴백을 200ms 지연 노출 → 빠른 응답에서는 깜빡임 없음
function DelayedSkeleton({ children }: { children: React.ReactNode }) {
  return <div className="opacity-0 animate-[fadeIn_0ms_200ms_forwards]">{children}</div>;
}

<Suspense fallback={<DelayedSkeleton><ListSkeleton /></DelayedSkeleton>}>
  <List />
</Suspense>
```

**REGRESSION HOOK**

```ts
test('뒤로가기 재방문에서 스켈레톤이 다시 나오지 않는다', async ({ page }) => {
  await page.goto('/items');
  await expect(page.getByRole('list')).toBeVisible();
  await page.getByRole('link', { name: /Alpha/ }).click();
  await page.goBack();
  await expect(page.getByRole('list')).toBeVisible({ timeout: 500 });
  await expect(page.getByTestId('list-skeleton')).toHaveCount(0);
});
```

---

## 17. API QA (`C-API-*`)

프론트엔드 QA에서 API는 "남의 코드"가 아니다. **경계 계약을 검증하는 책임은 소비자에게 있다.**

### C-API-01 — 에러 응답 처리 (상태코드별 분기)

**WHY**
`fetch`는 4xx/5xx에서 **reject 하지 않는다**. `res.ok`를 확인하지 않으면 에러 본문을 데이터로 취급해 `data.items.map`에서 크래시하거나, 더 나쁘게는 **빈 화면을 정상으로 표시**한다. 상태코드별 분기가 없으면 401(재로그인)과 500(재시도)에 같은 메시지를 보여줘 사용자가 해결할 수 없다.

**DETECT**

```bash
rg -n "await fetch\(" src -A6 | rg -v "res\.ok|response\.ok|status"
rg -n "\.json\(\)" src -B3 | rg -v "ok|status"
rg -n "catch \(e\) \{\s*\}" src                    # 빈 catch
```

**REPRODUCE** — 상태코드별로 강제 주입한다.

```ts
for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
  await page.route('**/api/items*', r => r.fulfill({ status, json: { error: { code: 'X' } } }));
  await page.goto('/items');
  // 각 상태에서 화면이 무엇을 보여주는지 기록: 크래시? 빈 화면? 적절한 안내?
}
// 네트워크 자체 실패
await page.route('**/api/items*', r => r.abort('failed'));
```

**PASS/FAIL**

- **PASS:** 모든 상태코드에서 크래시 없음. 401 → 재로그인 유도, 403 → 권한 안내, 404 → 없음 UI, 409/422 → 필드 에러, 429 → 잠시 후 재시도(가능하면 대기 시간), 5xx → 재시도 + 참조 코드. 네트워크 실패 → 오프라인 안내.
- **FAIL:** 어느 코드에서든 크래시/빈 화면/동일 문구.

**FIX**

- fetch 래퍼 하나로 통일해 `res.ok` 검사, 상태코드 → 도메인 에러 매핑, 파싱 검증을 강제한다.
- UI는 도메인 에러 타입으로 분기한다(상태코드를 UI에 직접 노출하지 않는다).

**BAD**

```ts
// ❌ 실패를 데이터로 취급
const data = await fetch('/api/items').then(r => r.json());
setItems(data.items);          // 500 응답의 { error } → items undefined → 크래시
```

**GOOD**

```ts
// ✅ lib/http.ts — 단일 래퍼
export class ApiError extends Error {
  constructor(
    public kind: 'unauthorized' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'rateLimited' | 'server' | 'network' | 'schema',
    public status: number,
    public detail?: unknown,
    public retryAfterSec?: number,
  ) { super(kind); }
}

export async function api<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } });
  } catch {
    throw new ApiError('network', 0);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    const kind =
      res.status === 401 ? 'unauthorized' :
      res.status === 403 ? 'forbidden' :
      res.status === 404 ? 'notFound' :
      res.status === 409 ? 'conflict' :
      res.status === 422 || res.status === 400 ? 'validation' :
      res.status === 429 ? 'rateLimited' : 'server';
    throw new ApiError(kind, res.status, body, Number(res.headers.get('retry-after')) || undefined);
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new ApiError('schema', 502, parsed.error);
  return parsed.data;
}

// ✅ UI 분기 (사용자 언어로)
export function toUserMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return '알 수 없는 오류가 발생했습니다.';
  switch (e.kind) {
    case 'unauthorized': return '세션이 만료되었습니다. 다시 로그인해 주세요.';
    case 'forbidden':    return '이 작업을 수행할 권한이 없습니다.';
    case 'notFound':     return '요청한 항목을 찾을 수 없습니다.';
    case 'validation':   return '입력값을 확인해 주세요.';
    case 'conflict':     return '다른 곳에서 이미 변경되었습니다. 새로고침 후 다시 시도해 주세요.';
    case 'rateLimited':  return `요청이 많습니다. ${e.retryAfterSec ?? 30}초 후 다시 시도해 주세요.`;
    case 'network':      return '네트워크에 연결할 수 없습니다. 연결을 확인해 주세요.';
    default:             return '일시적인 오류가 발생했습니다. 다시 시도해 주세요.';
  }
}
```

**REGRESSION HOOK**

```ts
const CASES = [
  { status: 401, expect: /다시 로그인/ },
  { status: 403, expect: /권한/ },
  { status: 429, expect: /요청이 많습니다/ },
  { status: 500, expect: /일시적인 오류/ },
];
for (const c of CASES) {
  test(`API ${c.status} 응답이 적절한 안내로 표시된다`, async ({ page }) => {
    await page.route('**/api/items*', r => r.fulfill({ status: c.status, json: {} }));
    await page.goto('/items');
    await expect(page.getByRole('alert')).toContainText(c.expect);
  });
}
```

---

### C-API-02 — 타임아웃·재시도·취소

**WHY**
타임아웃이 없으면 느린 백엔드에서 **영원히 로딩**이 돌고 사용자는 앱이 죽었다고 판단한다. 재시도가 없으면 일시적 네트워크 오류가 실패로 확정된다. 반대로 무제한 재시도는 장애를 증폭시킨다(thundering herd). 취소가 없으면 이탈한 화면의 요청이 계속 서버를 때린다.

**DETECT**

```bash
rg -n "AbortSignal\.timeout|AbortController|signal:" src | wc -l
rg -n "retry|backoff" src | wc -l
rg -n "await fetch\(" src | wc -l                  # 타임아웃 없는 fetch 수와 비교
```

**REPRODUCE**

1. 응답을 60초 지연시키고 화면이 어떻게 되는지 관찰한다(무한 로딩이면 FAIL).

```ts
await page.route('**/api/items*', async r => { await new Promise(s => setTimeout(s, 60000)); });
```

2. 첫 요청만 실패시키고 재시도로 회복되는지 확인한다.
3. 요청 중 라우트를 이동해 요청이 취소되는지(`request.failure()`) 확인한다.

**PASS/FAIL**

- **PASS:** 모든 요청에 타임아웃(권장 8~15초, 사용자 대기 UI가 있는 경우 최대 30초)이 있고, 멱등 요청(GET)만 지수 백오프로 최대 2~3회 재시도하며, 화면 이탈 시 취소된다.
- **FAIL:** 무한 로딩, POST 자동 재시도(중복 생성 위험), 취소 없음.

**FIX**

- `AbortSignal.timeout()`을 fetch 래퍼에 기본 적용한다.
- 재시도는 **GET/멱등 요청 한정** + 지터가 있는 지수 백오프. `Retry-After`를 존중한다.
- POST 재시도가 필요하면 idempotency key를 사용한다(§C-RCT-08).

**GOOD**

```ts
// ✅ 타임아웃 + 조건부 재시도 + 취소 결합
export async function apiWithRetry<T>(
  path: string, schema: z.ZodType<T>,
  { retries = 2, timeoutMs = 10_000, signal, method = 'GET' }: Opts = {},
): Promise<T> {
  const idempotent = method === 'GET' || method === 'HEAD';
  let lastErr: unknown;

  for (let attempt = 0; attempt <= (idempotent ? retries : 0); attempt++) {
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      return await api(path, schema, { method, signal: combined });
    } catch (e) {
      lastErr = e;
      const retriable = e instanceof ApiError && ['network', 'server', 'rateLimited'].includes(e.kind);
      if (!retriable || attempt === retries) break;
      const base = e instanceof ApiError && e.retryAfterSec ? e.retryAfterSec * 1000 : 400 * 2 ** attempt;
      await new Promise(r => setTimeout(r, base + Math.random() * 200));   // 지터
    }
  }
  throw lastErr;
}
```

**REGRESSION HOOK**

```ts
test('응답이 지연되면 타임아웃 후 에러 UI가 나타난다', async ({ page }) => {
  await page.route('**/api/items*', () => { /* 응답하지 않음 */ });
  await page.goto('/items');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('list-skeleton')).toHaveCount(0);       // 무한 로딩 아님
});
```

---

### C-API-03 — 요청 중복 제거 및 N+1 호출

**WHY**
같은 데이터를 여러 컴포넌트가 각각 요청하면 동일 요청이 3~10회 발생해 서버 부하와 지연이 늘고, 응답 순서에 따라 **화면이 서로 다른 데이터를 표시**하기도 한다. 목록 각 항목이 개별 요청을 보내는 N+1 패턴은 모바일에서 치명적이다(요청 50개 = 지연 수 초).

**DETECT**

```bash
rg -n "React\.cache|cache\(" src | wc -l
rg -n "\.map\(" src -A6 | rg "fetch\(|api\("        # 항목마다 요청 = N+1
```

**REPRODUCE**

```ts
const counts = new Map<string, number>();
page.on('request', r => {
  const u = r.url().replace(/\?.*$/, '');
  if (u.includes('/api/')) counts.set(u, (counts.get(u) ?? 0) + 1);
});
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
console.log([...counts].sort((a, b) => b[1] - a[1]));
// 동일 엔드포인트 2회 이상 → 중복. 목록 크기에 비례해 증가 → N+1
```

**PASS/FAIL**

- **PASS:** 한 화면 로드에서 동일 엔드포인트 중복 호출 0(의도된 폴링 제외). 목록은 배치/포함(include) 조회로 처리. 총 API 요청 수가 화면 복잡도에 선형 비례하지 않는다.
- **FAIL:** 중복 호출, N+1, 항목 수에 비례한 요청 증가.

**FIX**

- 서버 컴포넌트는 `React.cache`로 요청 스코프 dedupe(Next의 fetch 캐시도 동일 URL을 dedupe한다).
- 클라이언트는 데이터 라이브러리(react-query/SWR)의 키 기반 dedupe를 사용한다.
- 목록은 서버에서 필요한 관계를 한 번에 조회하거나 배치 엔드포인트를 만든다.

**BAD**

```tsx
// ❌ 항목마다 요청 (N+1)
{items.map(i => <ItemRow key={i.id} item={i} />)}
function ItemRow({ item }) {
  const [owner, setOwner] = useState(null);
  useEffect(() => { fetch(`/api/users/${item.ownerId}`).then(r => r.json()).then(setOwner); }, [item.ownerId]);
  …
}
```

**GOOD**

```tsx
// ✅ 서버에서 한 번에 조회 + 요청 스코프 dedupe
import { cache } from 'react';
export const getItemsWithOwners = cache(async () =>
  db.item.findMany({ include: { owner: { select: { id: true, name: true, avatarUrl: true } } } }));

export default async function Page() {
  const items = await getItemsWithOwners();       // 요청 1건
  return <ul>{items.map(i => <ItemRow key={i.id} item={i} owner={i.owner} />)}</ul>;
}
```

**REGRESSION HOOK**

```ts
test('대시보드 로드 시 동일 API 중복 호출이 없다', async ({ page }) => {
  const counts = new Map<string, number>();
  page.on('request', r => {
    const u = r.url().replace(/\?.*$/, '');
    if (u.includes('/api/')) counts.set(u, (counts.get(u) ?? 0) + 1);
  });
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const dup = [...counts].filter(([, n]) => n > 1);
  expect(dup, `duplicated: ${JSON.stringify(dup)}`).toEqual([]);
});
```

---

### C-API-04 — 페이지네이션·정렬·필터 계약

**WHY**
페이지네이션이 잘못되면 항목이 **중복 표시되거나 누락**된다(offset 방식에서 데이터가 삽입될 때 흔함). "더 보기"가 같은 페이지를 다시 불러오거나, 필터 변경 시 페이지가 초기화되지 않아 빈 결과가 나오는 것도 자주 발생한다. 사용자는 "데이터가 이상하다"고 신뢰를 잃는다.

**DETECT**

```bash
rg -n "page=|offset=|cursor=|limit=|per_page=" src
rg -n "loadMore|infinite|IntersectionObserver" src -A8
rg -n "setPage\(1\)|page: 1" src -B5 | rg -i "filter|sort|search"   # 필터 변경 시 초기화 여부
```

**REPRODUCE**

1. 페이지 1→2→3 이동 후 **항목 id 집합의 교집합**이 비어 있는지 확인(중복 검출).
2. 무한 스크롤에서 끝까지 스크롤 → 총 개수가 서버 total과 일치하는지 확인.
3. 필터를 변경했을 때 페이지가 1로 초기화되는지 확인.
4. 마지막 페이지에서 "더 보기"가 사라지는지, 0건에서 무한 요청이 없는지 확인.

**PASS/FAIL**

- **PASS:** 페이지 간 중복·누락 0. 총 개수 일치. 필터/정렬 변경 시 페이지 초기화. 마지막 페이지에서 추가 요청 중단. URL에 페이지 상태 반영(§C-STA-01).
- **FAIL:** 중복/누락, 무한 요청, 필터 변경 후 빈 결과.

**FIX**

- 실시간성이 높은 목록은 **cursor 기반** 페이지네이션을 사용한다(offset은 삽입/삭제에 취약).
- 필터·정렬 변경 시 페이지/커서를 명시적으로 리셋한다.
- `hasNextPage`를 서버가 알려주게 하고, 클라이언트가 추측하지 않게 한다.

**GOOD**

```ts
// ✅ 커서 기반 + 명시적 종료 조건
const Page = z.object({ items: z.array(Item), nextCursor: z.string().nullable() });

async function loadMore(cursor: string | null) {
  if (cursor === null) return;                        // 서버가 끝을 알려준다
  const page = await api(`/api/items?limit=20${cursor ? `&cursor=${cursor}` : ''}`, Page);
  setItems(prev => {
    const seen = new Set(prev.map(i => i.id));         // 방어적 중복 제거
    return [...prev, ...page.items.filter(i => !seen.has(i.id))];
  });
  setCursor(page.nextCursor);
}
```

**REGRESSION HOOK**

```ts
test('무한 스크롤에서 항목이 중복되지 않는다', async ({ page }) => {
  await page.goto('/items');
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: '더 보기' }).click().catch(() => {});
    await page.waitForLoadState('networkidle');
  }
  const ids = await page.locator('[data-item-id]').evaluateAll(els => els.map(e => e.getAttribute('data-item-id')));
  expect(new Set(ids).size).toBe(ids.length);
});
```

---

### C-API-05 — 요청/응답 페이로드 위생 (과대 전송·민감 데이터)

**WHY**
필요 없는 필드를 주고받으면 모바일 대역폭과 파싱 시간이 낭비된다. 더 중요한 것은 **응답에 민감 필드가 포함되면 브라우저에 남는다** — UI에 안 보여도 DevTools/캐시/HTML에 존재한다. 이것은 UI 숨김으로 해결되지 않는 데이터 노출이다.

**DETECT**

```bash
# 응답 크기와 필드 확인
curl -s localhost:3000/api/items | wc -c
curl -s localhost:3000/api/items | python -c "import json,sys;print(sorted(json.load(sys.stdin)['items'][0].keys()))"
rg -n "select:|fields=|\.pick\(" src | wc -l          # 필드 제한 사용 여부
```

**REPRODUCE**

1. 각 주요 엔드포인트 응답을 받아 **UI에서 실제로 쓰는 필드**와 대조한다.
2. `passwordHash`, `internalNote`, `email`(불필요한 화면), 토큰류가 있는지 검색한다.
3. HTML/RSC 페이로드에도 같은 검사를 수행한다(§C-RSC-04).

**PASS/FAIL**

- **PASS:** 응답 필드가 화면에 필요한 것으로 한정되고, 민감 필드 0건. 목록 응답에 대용량 본문(전체 HTML/설명)이 포함되지 않는다.
- **FAIL:** 민감 필드 포함(S1~S0), UI 미사용 대용량 필드 다수.

**FIX**

- 서버에서 `select`/DTO로 필드를 제한한다. "나중에 필요할 수도"는 이유가 되지 않는다.
- 목록/상세를 분리한다(목록은 요약 필드만).
- 민감 필드는 스키마 레벨에서 응답 직렬화에서 제외한다(실수 방지).

**REGRESSION HOOK**

```ts
test('목록 API 응답에 민감 필드가 없다', async ({ request }) => {
  const body = await (await request.get('/api/items')).json();
  const keys = new Set(Object.keys(body.items?.[0] ?? {}));
  for (const forbidden of ['passwordHash', 'internalNote', 'ssn', 'token']) {
    expect(keys.has(forbidden), `leaked ${forbidden}`).toBe(false);
  }
});
```

---

### C-API-06 — 오프라인 / 불안정 네트워크 동작

**WHY**
모바일 사용자는 지하철·엘리베이터·지하에서 앱을 쓴다. 오프라인에서 무반응이거나 알 수 없는 에러를 보이면 사용자는 데이터를 잃었다고 생각한다. 특히 **작성 중인 내용이 사라지는 것**은 가장 큰 불만 요인이다.

**DETECT**

```bash
rg -n "navigator\.onLine|online|offline" src | wc -l
rg -n "localStorage.*draft|autosave|saveDraft" src | wc -l
```

**REPRODUCE**

```ts
await page.goto('/posts/new');
await page.getByLabel('본문').fill('중요한 초안 내용');
await page.context().setOffline(true);
await page.getByRole('button', { name: '저장' }).click();
// 기대: 오프라인 안내 + 입력 유지 + (가능하면) 로컬 초안 저장
await expect(page.getByText(/네트워크|오프라인|연결/)).toBeVisible();
await expect(page.getByLabel('본문')).toHaveValue('중요한 초안 내용');
await page.context().setOffline(false);
// 기대: 재시도 가능 또는 자동 재전송
```

**PASS/FAIL**

- **PASS:** 오프라인에서 명확한 안내가 나오고, 입력이 유지되며, 온라인 복귀 시 재시도 경로가 있다. 읽기 화면은 캐시된 콘텐츠를 보여줄 수 있다.
- **FAIL:** 무반응, 입력 소실, 알 수 없는 에러 문구, 복귀 후에도 복구 불가.

**FIX**

- 네트워크 에러를 별도 분기로 처리하고(§C-API-01 `network`), 재시도 버튼을 제공한다.
- 장문 입력은 디바운스 자동 저장(로컬 초안)으로 보호한다.
- `online` 이벤트에서 실패한 요청을 재시도하거나 재시도 배너를 띄운다.

**REGRESSION HOOK** — 위 REPRODUCE 스크립트를 회귀 스위트에 편입한다(모바일 결함 방어의 핵심).

---

## 18. Cache QA (`C-CCH-*`)

Next.js App Router는 4개의 캐시 계층(Request Memoization / Data Cache / Full Route Cache / Router Cache)을 갖는다. QA에서 반드시 확인할 것은 두 가지다: **오래된 데이터가 보이는가**, **다른 사용자 데이터가 섞이는가**. 후자는 S0다.

### C-CCH-01 — 사용자별 데이터의 캐시 격리

**WHY**
사용자별 응답이 공유 캐시(Full Route Cache, CDN)에 저장되면 **A의 개인정보가 B에게 노출**된다. 이는 즉시 S0이며, 사후 대응(캐시 퍼지 + 공지)이 필요한 사고다. 원인은 대개 `cache: 'no-store'` 누락, `Cache-Control` 미설정, 또는 CDN 설정 불일치다.

**DETECT**

```bash
rg -n "cache: ['\"]force-cache|revalidate: [0-9]" src | rg -i "me|user|profile|account|order|billing"
rg -n "Cache-Control" src
cat vercel.json next.config.* | rg -A5 "headers"
npm run build   # 사용자 데이터 라우트가 ○(Static)인지 확인
```

**REPRODUCE** (프로덕션 빌드 필수)

```ts
test('사용자 데이터가 캐시로 교차 노출되지 않는다', async ({ browser }) => {
  const a = await browser.newContext(); const pa = await a.newPage();
  await loginAs(pa, 'alice@acme.test');
  await pa.goto('/dashboard');
  await expect(pa.getByText('Alice')).toBeVisible();

  const b = await browser.newContext(); const pb = await b.newPage();
  await loginAs(pb, 'bob@acme.test');
  await pb.goto('/dashboard');
  await expect(pb.getByText('Bob')).toBeVisible();
  await expect(pb.getByText('Alice')).toHaveCount(0);       // 교차 노출 0

  // 비로그인 컨텍스트에서도 확인
  const c = await browser.newContext(); const pc = await c.newPage();
  const res = await pc.goto('/dashboard');
  expect([301, 302, 307, 401, 403]).toContain(res!.status());
});
```

추가로 응답 헤더를 직접 확인한다: `curl -I` 결과에 `x-vercel-cache: HIT`(또는 CDN HIT) + 개인 데이터 조합이면 즉시 S0.

**PASS/FAIL**

- **PASS:** 사용자별 응답은 `Cache-Control: private, no-store` (또는 dynamic + no-store)이며 CDN에서 캐시되지 않는다. 교차 노출 재현 0.
- **FAIL:** 개인 데이터 응답이 공유 캐시에 저장 / 교차 노출 관측.

**FIX**

- 개인 데이터 라우트는 `dynamic = 'force-dynamic'` + fetch `cache: 'no-store'` + 명시적 `Cache-Control: private, no-store`.
- CDN/프록시 설정도 함께 점검한다(코드만 고쳐도 엣지 설정이 캐시하면 무의미).
- 발견 시 리포트에 **캐시 퍼지 필요**를 Action Item으로 명시한다.

**GOOD**

```ts
// ✅ 개인 데이터 라우트 핸들러
export async function GET() {
  const user = await requireUser();
  return NextResponse.json({ user }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0, must-revalidate' },
  });
}
```

---

### C-CCH-02 — 변경 후 재검증 (오래된 화면)

**WHY**
생성·수정·삭제 후 목록이 갱신되지 않으면 사용자는 **작업이 실패했다고 판단**하고 재시도한다 → 중복 생성. 또는 삭제한 항목이 남아 있어 다시 삭제를 시도한다 → 에러. 이것은 캐시 결함이 데이터 결함으로 전이되는 경로다.

**DETECT**

```bash
rg -n "revalidatePath|revalidateTag|router\.refresh" src | wc -l
rg -l "use server" src | xargs rg -l "revalidate" || echo "재검증 없는 액션 존재"
rg -n "next: \{ tags:" src | wc -l                 # 태그 기반 캐시 사용
```

**REPRODUCE**

1. 항목을 생성 → **수동 새로고침 없이** 목록에 나타나는가?
2. 항목을 수정 → 목록과 상세 양쪽이 갱신되는가?
3. 삭제 → 목록에서 사라지는가? 뒤로가기로 돌아가도 사라진 상태인가?
4. 다른 탭에서 생성 → 이 탭에서 새로고침 시 보이는가?

**PASS/FAIL**

- **PASS:** 모든 변경이 관련된 모든 화면(목록/상세/카운터/사이드바 배지)에 즉시 반영된다. 뒤로가기에서도 최신 상태.
- **FAIL:** 수동 새로고침 필요, 뒤로가기 시 옛 데이터, 일부 화면만 갱신.

**FIX**

- 태그 기반 캐시(`next: { tags: ['items'] }` + `revalidateTag('items')`)로 관련 화면을 한 번에 무효화한다.
- 경로 기반이 필요하면 영향받는 **모든 경로**를 나열한다(목록, 상세, 대시보드 요약).
- 클라이언트 라우터 캐시는 `router.refresh()`로 갱신한다(서버 재검증만으로는 뒤로가기 캐시가 안 바뀔 수 있다).

**BAD**

```ts
// ❌ 생성했는데 목록은 옛 데이터
'use server';
export async function createItem(fd: FormData) {
  await db.item.create({ data: { title: String(fd.get('title')) } });
  redirect('/items');          // 캐시된 목록으로 이동 → 새 항목 없음
}
```

**GOOD**

```ts
// ✅ 태그 무효화 후 이동
'use server';
import { revalidateTag } from 'next/cache';

export async function createItem(fd: FormData) {
  const user = await requireUser();
  const parsed = CreateInput.safeParse({ title: fd.get('title') });
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors };

  await db.item.create({ data: { ...parsed.data, ownerId: user.id } });
  revalidateTag('items');                       // 목록·요약·배지 모두 무효화
  redirect('/items');
}

// 데이터 조회에 태그 부여
const items = await fetch(`${API}/items`, { next: { tags: ['items'], revalidate: 300 } });
```

**REGRESSION HOOK**

```ts
test('생성 직후 목록에 새 항목이 보인다 (수동 새로고침 없이)', async ({ page }) => {
  await page.goto('/items/new');
  const title = `QA-${Date.now()}`;
  await page.getByLabel('제목').fill(title);
  await page.getByRole('button', { name: '만들기' }).click();
  await expect(page).toHaveURL(/\/items$/);
  await expect(page.getByText(title)).toBeVisible();
  await page.goBack(); await page.goForward();
  await expect(page.getByText(title)).toBeVisible();        // 라우터 캐시도 최신
});
```

---

### C-CCH-03 — Router Cache로 인한 뒤로가기 stale

**WHY**
App Router는 클라이언트 라우터 캐시를 유지해 뒤로가기를 빠르게 한다. 그러나 변경 작업 후 뒤로가면 **삭제한 항목이 다시 보이거나** 옛 값이 나타난다. 사용자는 "삭제가 안 됐다"고 판단한다.

**DETECT**

```bash
rg -n "router\.refresh" src | wc -l
rg -n "staleTimes" next.config.*                  # 실험적 설정 사용 여부
```

**REPRODUCE**

1. 항목 삭제 → 다른 화면 이동 → **뒤로가기** → 삭제된 항목이 보이는지 확인.
2. 값 수정 → 상세 → 뒤로 → 목록의 값이 옛 값인지 확인.

**PASS/FAIL**

- **PASS:** 변경 후 뒤로가기에서도 최신 데이터가 보인다.
- **FAIL:** 뒤로가기에서 stale 데이터.

**FIX**

- 서버 액션 성공 후 `revalidateTag/Path` + 필요 시 `router.refresh()`를 함께 호출한다.
- 클라이언트 fetch로 변경한 경우 `router.refresh()`가 필수다.
- `staleTimes` 설정 변경은 전역 영향이 크므로 신중히(리포트에 근거 기록).

**GOOD**

```tsx
'use client';
const router = useRouter();
async function onDelete(id: string) {
  const res = await deleteItem({ id });          // 서버 액션 (revalidateTag 포함)
  if (res.ok) {
    router.refresh();                             // 라우터 캐시까지 갱신
    toast.success('삭제했습니다');
  } else toast.error(res.message);
}
```

**REGRESSION HOOK**

```ts
test('삭제 후 뒤로가기에서 항목이 다시 나타나지 않는다', async ({ page }) => {
  await page.goto('/items');
  const row = page.getByRole('listitem').first();
  const name = (await row.textContent())!.trim();
  await row.getByRole('button', { name: '삭제' }).click();
  await expect(page.getByText(name)).toHaveCount(0);
  await page.getByRole('link', { name: '설정' }).click();
  await page.goBack();
  await expect(page.getByText(name)).toHaveCount(0);
});
```

---

### C-CCH-04 — 정적 자산 캐시와 배포 무효화

**WHY**
해시가 없는 자산(`/logo.png`, `/data.json`)에 긴 캐시를 걸면 **배포 후에도 옛 파일**이 서비스된다. 반대로 해시 자산에 짧은 캐시를 걸면 매 방문마다 재다운로드로 성능을 잃는다. 또한 HTML에 긴 캐시를 걸면 배포가 사용자에게 도달하지 않는다.

**DETECT**

```bash
curl -sI localhost:3000/_next/static/chunks/main.js | rg -i "cache-control"     # immutable 기대
curl -sI localhost:3000/ | rg -i "cache-control"                                 # no-store 또는 짧게
curl -sI localhost:3000/logo.png | rg -i "cache-control"
rg -n "headers\(\)" next.config.* -A20
```

**REPRODUCE**

1. 자산을 변경하고 재배포(또는 재빌드) → 강제 새로고침 없이 새 자산이 보이는지 확인.
2. 각 자산군의 `Cache-Control`을 표로 정리한다.

**PASS/FAIL**

- **PASS:** 해시 자산 `public, max-age=31536000, immutable`. HTML/RSC 응답은 캐시되지 않거나 짧게. 해시 없는 공용 자산은 중간 값(예: `max-age=3600, must-revalidate`) 또는 파일명 버전.
- **FAIL:** 배포 후 옛 자산 노출, HTML 장기 캐시, 해시 자산 단기 캐시.

**FIX**

- 사용자 업로드/공용 이미지에도 버전 쿼리 또는 해시 파일명을 도입한다.
- `next.config.ts`의 `headers()`로 자산군별 정책을 명시한다.

**GOOD**

```ts
// ✅ next.config.ts
export default {
  async headers() {
    return [
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/fonts/:path*',        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/brand/:path*',        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' }] },
    ];
  },
};
```

---

### C-CCH-05 — 캐시 키 누락 (언어·테마·권한·디바이스)

**WHY**
응답이 언어/권한/디바이스에 따라 달라지는데 캐시 키에 그 축이 없으면 **한국어 사용자가 영어 페이지를 받고**, 무료 사용자가 유료 UI를 본다. `Vary` 헤더 누락이나 미들웨어 리라이트와 캐시의 조합에서 자주 발생한다.

**DETECT**

```bash
rg -n "Vary" src next.config.* | wc -l
rg -n "accept-language|x-locale|user-agent" src middleware.ts 2>/dev/null
rg -n "cookies\(\)\.get\(['\"](locale|theme|plan)" src
```

**REPRODUCE**

1. 서로 다른 `Accept-Language`/쿠키로 같은 URL을 요청해 응답이 올바르게 달라지는지 확인.

```bash
curl -s -H 'Accept-Language: en-US' localhost:3000/ | rg -o "<html[^>]*lang=\"[a-z-]+\""
curl -s -H 'Accept-Language: ko-KR' localhost:3000/ | rg -o "<html[^>]*lang=\"[a-z-]+\""
```

2. 캐시 HIT 이후에도 구분이 유지되는지 확인(두 번째 요청).

**PASS/FAIL**

- **PASS:** 응답을 분기시키는 모든 축이 캐시 키(경로 세그먼트, 쿠키 기반 dynamic, 또는 `Vary`)에 반영된다. 교차 오염 0.
- **FAIL:** 언어/권한/테마가 뒤섞인 응답.

**FIX**

- 언어는 **경로 세그먼트**(`/ko/...`)로 두는 것이 캐시 관점에서 가장 안전하다.
- 쿠키 기반 분기는 해당 라우트를 dynamic으로 만들고 공유 캐시를 끈다.
- 권한별 UI는 캐시된 셸 + 동적 섬으로 분리한다(§C-APP-05).

**REGRESSION HOOK**

```ts
test('언어별 응답이 캐시로 섞이지 않는다', async ({ request }) => {
  const en = await (await request.get('/', { headers: { 'Accept-Language': 'en-US' } })).text();
  const ko = await (await request.get('/', { headers: { 'Accept-Language': 'ko-KR' } })).text();
  const lang = (h: string) => h.match(/<html[^>]*lang="([a-z-]+)"/)?.[1];
  expect(lang(en)).not.toBe(lang(ko));
});
```

---

## 19. Security QA (`C-SEC-*`)

프론트엔드 보안 QA의 원칙은 하나다: **클라이언트에서 온 것은 전부 적대적이고, 클라이언트로 보낸 것은 전부 공개된다.** UI 숨김은 보안이 아니다.

### C-SEC-01 — 시크릿·환경변수 노출

**WHY**
`NEXT_PUBLIC_` 접두사가 붙은 값은 **번들에 그대로 인라인**된다. 실수로 API 시크릿, 서비스 롤 키, 관리자 토큰에 이 접두사를 붙이면 전 세계에 공개된다. 접두사 없이 클라이언트 컴포넌트에서 참조하면 `undefined`가 되어 조용히 오작동하며, 개발자는 접두사를 붙여 "해결"하려 한다 — 그 순간 유출된다.

**DETECT**

```bash
# 위험 조합: NEXT_PUBLIC_ + 시크릿 성격 이름
rg -n "NEXT_PUBLIC_\w*(SECRET|KEY|TOKEN|PASSWORD|PRIVATE|SERVICE_ROLE|ADMIN)" . -g '!node_modules'
cat .env.example .env.local 2>/dev/null | rg "NEXT_PUBLIC_"
# 빌드 산출물 직접 검색 (결정적)
npm run build
rg -o "sk_live_\w+|sk_test_\w+|AKIA[0-9A-Z]{16}|ghp_\w+|xox[baprs]-\w+|eyJ[\w-]{20,}\.[\w-]+\.[\w-]+" .next/static -l
rg -l "SERVICE_ROLE|-----BEGIN" .next/static
```

**REPRODUCE**

1. 프로덕션 빌드를 띄우고 브라우저에서 모든 JS 청크를 받아 시크릿 패턴을 검색한다.
2. HTML 소스와 RSC 페이로드(`__next_f`)도 같은 방식으로 검사한다.
3. 1건이라도 발견되면 **S0**. 리포트에 (a) 어떤 키가, (b) 어느 파일에서, (c) 로테이션 필요 여부를 명시한다.

**PASS/FAIL**

- **PASS:** 클라이언트 번들·HTML·RSC 페이로드에 시크릿 패턴 0건. `NEXT_PUBLIC_` 변수는 모두 공개 가능한 값(공개 키, base URL, 플래그)만.
- **FAIL:** 1건 이상 노출.

**FIX**

- 시크릿은 서버 전용 모듈(`import 'server-only'`)에서만 읽는다.
- 클라이언트가 필요한 동작은 라우트 핸들러/서버 액션 뒤로 옮긴다(키를 옮기지 말고 **동작을 옮긴다**).
- 노출된 키는 코드 수정과 무관하게 **즉시 로테이션** — 리포트 Action Item에 반드시 남긴다.
- `.env.example`에 모든 키를 문서화하고, 시크릿 값은 절대 커밋하지 않는다.

**BAD**

```ts
// ❌ 유출 확정
const KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { authorization: `Bearer ${KEY}` },       // 브라우저에서 키가 보인다
});
```

**GOOD**

```ts
// ✅ 서버 프록시: 키는 서버에만, 클라이언트는 우리 엔드포인트만 호출
// app/api/ai/route.ts
import 'server-only';
export async function POST(req: Request) {
  const user = await requireUser();                     // 인증
  await assertQuota(user.id);                           // 남용 방지 (§C-SEC-08)
  const { prompt } = ChatInput.parse(await req.json()); // 검증
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
  });
  return new Response(r.body, { headers: { 'content-type': 'application/json' } });
}
```

**REGRESSION HOOK**

```ts
// CI 필수 게이트 (유닛 테스트)
import { execSync } from 'node:child_process';
it('빌드 산출물에 시크릿 패턴이 없다', () => {
  const pattern = 'sk_live_|sk_test_|AKIA[0-9A-Z]{16}|ghp_|SERVICE_ROLE|-----BEGIN';
  const hits = execSync(`rg -l "${pattern}" .next/static || true`).toString().trim();
  expect(hits, `secret-like strings in bundle:\n${hits}`).toBe('');
});
```

---

### C-SEC-02 — XSS (`dangerouslySetInnerHTML`, URL 주입, 스크립트 삽입)

**WHY**
React는 기본적으로 텍스트를 이스케이프하지만, `dangerouslySetInnerHTML`, `href={userInput}`, `<script>`/`<iframe src>` 동적 생성, `style` 문자열 주입에서는 방어가 없다. XSS는 세션 탈취 → 계정 장악으로 직결되므로 **발견 즉시 S0~S1**이다. `javascript:` URL은 여전히 유효한 공격 벡터다.

**DETECT**

```bash
rg -n "dangerouslySetInnerHTML" src -B3 -A3
rg -n "href=\{[^}]*(user|input|data|props|params|query)" src -i
rg -n "src=\{[^}]*(user|input|data|props)" src -i
rg -n "innerHTML|outerHTML|insertAdjacentHTML|document\.write" src
rg -n "new Function|eval\(" src
rg -n "sanitize|DOMPurify|rehype-sanitize" src | wc -l     # 살균 수단 존재 여부
```

**REPRODUCE** — 사용자 입력이 렌더되는 모든 필드(이름, 코멘트, 프로필, 파일명, 검색어, URL 파라미터)에 아래 페이로드를 투입한다.

```
<img src=x onerror="window.__xss=1">
<svg/onload=window.__xss=1>
javascript:window.__xss=1
"><script>window.__xss=1</script>
{{constructor.constructor('window.__xss=1')()}}
```

```ts
await page.goto('/profile');
await page.getByLabel('이름').fill('<img src=x onerror="window.__xss=1">');
await page.getByRole('button', { name: '저장' }).click();
await page.reload();
expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();   // 실행되면 FAIL
```

**PASS/FAIL**

- **PASS:** 모든 주입 지점에서 페이로드가 **텍스트로 표시**되고 실행되지 않는다. HTML 렌더가 필요한 곳은 허용 목록 기반 살균을 통과한다. URL은 스킴 검증을 통과한다.
- **FAIL:** 1건이라도 실행(S0) / 살균 없는 HTML 렌더(S1) / `javascript:` 링크 허용(S1).

**FIX**

- 가능하면 HTML 렌더 자체를 없앤다(마크다운 → AST → React 노드 변환이 문자열 HTML보다 안전).
- 불가피하면 서버에서 허용 목록 기반 살균(`rehype-sanitize`, `DOMPurify`)을 적용하고, **클라이언트 살균만 신뢰하지 않는다**.
- URL은 스킴 화이트리스트(`http`, `https`, `mailto`)로 검증한다.
- CSP(§C-SEC-03)를 2차 방어선으로 둔다.

**BAD**

```tsx
// ❌ 저장형 XSS
<div dangerouslySetInnerHTML={{ __html: comment.body }} />

// ❌ javascript: 스킴 허용
<a href={profile.website}>웹사이트</a>
```

**GOOD**

```tsx
// ✅ 살균된 HTML (서버에서 처리 후 저장 또는 렌더)
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(comment.body, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
});
<div dangerouslySetInnerHTML={{ __html: clean }} />

// ✅ URL 스킴 검증
function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw, 'https://example.com');
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.toString() : null;
  } catch { return null; }
}

const site = safeUrl(profile.website);
{site && <a href={site} target="_blank" rel="noopener noreferrer nofollow">웹사이트</a>}
```

**REGRESSION HOOK**

```ts
const PAYLOADS = [
  '<img src=x onerror="window.__xss=1">',
  '<svg/onload=window.__xss=1>',
  '"><script>window.__xss=1</script>',
];
for (const p of PAYLOADS) {
  test(`XSS 페이로드가 실행되지 않는다: ${p.slice(0, 24)}`, async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent(p)}`);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });
}
```

---

### C-SEC-03 — 보안 헤더 / CSP

**WHY**
보안 헤더는 **결함이 있어도 피해를 줄이는 2차 방어선**이다. CSP가 있으면 XSS가 있어도 인라인 스크립트 실행이 차단된다. `X-Frame-Options`/`frame-ancestors`가 없으면 클릭재킹으로 사용자가 의도치 않은 조작을 하게 된다. HSTS가 없으면 첫 요청이 평문으로 나가 세션 탈취에 노출된다.

**DETECT**

```bash
curl -sI https://<staging-host>/ | rg -i "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy"
rg -n "headers\(\)" next.config.* -A30
rg -n "Content-Security-Policy" middleware.ts src 2>/dev/null
```

**REPRODUCE**

1. 각 헤더 존재와 값을 표로 기록한다.
2. CSP가 있으면 **위반 로그**를 확인한다(개발 중 `Content-Security-Policy-Report-Only`로 먼저 관측).
3. iframe 삽입 테스트: 다른 오리진 페이지에 앱을 iframe으로 넣어 차단되는지 확인.

**PASS/FAIL 기준표**

| 헤더 | 최소 기준 |
|------|-----------|
| `Content-Security-Policy` | `default-src 'self'`; 인라인 스크립트는 nonce/hash; `object-src 'none'`; `frame-ancestors 'none'`(또는 명시 허용) |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (HTTPS 환경) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` 이상 |
| `X-Frame-Options` 또는 CSP `frame-ancestors` | 클릭재킹 차단 |
| `Permissions-Policy` | 미사용 기능 차단(`camera=(), microphone=(), geolocation=()`) |

- **PASS:** 위 6개 모두 존재하고 기준 충족. CSP 위반 0(정상 사용 중).
- **FAIL:** 헤더 누락, `unsafe-inline`/`unsafe-eval` 상시 허용, CSP 위반 다발.

**FIX**

- Next.js에서는 미들웨어에서 nonce를 생성해 CSP에 주입하고, `next/script`에 nonce를 전달한다.
- 도입은 `Report-Only` → 위반 수집 → 정책 조정 → 강제 순서로 한다(한 번에 강제하면 앱이 깨진다).
- `unsafe-inline`이 필요한 지점(§C-HYD-03의 테마 스크립트)은 nonce로 대체한다.

**GOOD**

```ts
// ✅ middleware.ts — nonce 기반 CSP
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,               // Tailwind/인라인 스타일 현실 반영
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ''}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const headers = new Headers(req.headers);
  headers.set('x-nonce', nonce);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return res;
}
```

**REGRESSION HOOK**

```ts
test('보안 헤더가 모두 존재한다', async ({ request }) => {
  const h = (await request.get('/')).headers();
  expect(h['content-security-policy']).toBeTruthy();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toMatch(/strict-origin/);
  expect(h['content-security-policy']).not.toMatch(/unsafe-eval/);
});
```

---

### C-SEC-04 — 인증·세션·권한 (클라이언트 게이팅 금지)

**WHY**
"버튼을 숨겼으니 안전하다"는 가장 흔한 보안 착각이다. 클라이언트 조건부 렌더는 **DevTools로 우회**되고, API는 그대로 노출된다. 또한 로그아웃이 서버 세션을 무효화하지 않으면 탈취된 쿠키가 계속 유효하다.

**DETECT**

```bash
rg -n "user\.role === |isAdmin|hasPermission|canEdit" src --glob '*.tsx'    # 클라이언트 게이팅
rg -n "localStorage.*token|sessionStorage.*token" src -i                     # 토큰 저장 (S1)
rg -n "httpOnly|sameSite|secure:" src | wc -l                                # 쿠키 옵션
rg -n "logout|signOut" src -A10 | rg -c "delete|revoke|destroy|invalidate"
```

**REPRODUCE**

1. 일반 사용자로 로그인 → 관리자 전용 API/액션을 직접 호출(§C-APP-06 재현법) → 성공하면 **S0**.
2. 일반 사용자로 관리자 URL 직접 진입 → 콘텐츠가 보이면 FAIL.
3. 로그아웃 후 **이전 쿠키를 복원**해 요청 → 성공하면 세션 무효화 실패(S1).
4. 다른 사용자의 리소스 ID로 조회/수정 시도(IDOR) → 성공하면 S0.

```ts
// IDOR 확인
const res = await request.get(`/api/items/${OTHER_USERS_ITEM_ID}`);
expect([403, 404]).toContain(res.status());
```

**PASS/FAIL**

- **PASS:** 모든 권한 판단이 서버에서 이루어지고, IDOR 시도가 403/404로 차단되며, 로그아웃이 서버 세션을 무효화한다. 세션 쿠키는 `HttpOnly; Secure; SameSite=Lax`.
- **FAIL:** 클라이언트 게이팅에만 의존 / IDOR 성공 / 로그아웃 후 쿠키 재사용 성공 / 토큰 localStorage 저장.

**FIX**

- 인가는 데이터 접근 지점(쿼리/액션/핸들러)에서 수행한다. UI 게이팅은 UX 목적일 뿐이라고 코드 주석으로 명시한다.
- 조회 쿼리에 소유자 조건을 **항상** 포함한다(`where: { id, ownerId: user.id }`) — 이 패턴은 IDOR을 구조적으로 제거한다.
- 존재 여부 노출을 피하려면 403 대신 404를 반환하는 정책을 일관되게 적용한다.

**BAD**

```tsx
// ❌ UI만 숨김 — API는 열려 있다
{user.role === 'admin' && <DeleteAllButton />}

// ❌ 소유자 조건 없음 → IDOR
const item = await db.item.findUnique({ where: { id: params.id } });
```

**GOOD**

```ts
// ✅ 데이터 접근 자체에 소유권을 결합 (구조적 방어)
const item = await db.item.findFirst({
  where: { id: params.id, OR: [{ ownerId: user.id }, { org: { members: { some: { userId: user.id } } } }] },
});
if (!item) notFound();                       // 존재 여부를 노출하지 않음

// ✅ 권한은 서버에서 확인 후 UI에 힌트만 전달
const canDelete = await can(user, 'item:delete', item);
return <ItemActions canDelete={canDelete} />;   // 서버 액션도 동일 검사를 반복 수행
```

**REGRESSION HOOK**

```ts
test('다른 사용자 리소스에 접근할 수 없다 (IDOR)', async ({ browser }) => {
  const alice = await browser.newContext({ storageState: 'e2e/.auth/alice.json' });
  const res = await alice.request.get(`/api/items/${BOB_ITEM_ID}`);
  expect([403, 404]).toContain(res.status());
});

test('로그아웃 후 이전 세션 쿠키는 무효다', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: 'e2e/.auth/alice.json' });
  const cookies = await ctx.cookies();
  const page = await ctx.newPage();
  await page.goto('/dashboard');
  await page.getByRole('button', { name: '로그아웃' }).click();
  await ctx.addCookies(cookies);                      // 복원
  const res = await ctx.request.get('/api/me');
  expect([401, 403]).toContain(res.status());
});
```

---

### C-SEC-05 — 입력 검증 (클라이언트/서버 이중화)

**WHY**
클라이언트 검증은 UX이고, **서버 검증만이 보안**이다. HTML `required`/`maxlength`는 DevTools로 제거 가능하다. 서버 검증이 없으면 초장문 문자열로 DB를 채우고, 음수 수량으로 환불을 유도하고, 잘못된 타입으로 크래시를 만든다.

**DETECT**

```bash
rg -n "required|maxLength|pattern=" src --glob '*.tsx' | wc -l              # 클라이언트 검증
rg -l "use server" src | xargs rg -l "safeParse|\.parse\(" || echo "검증 없는 액션"
rg -n "route\.ts" -l src/app | xargs rg -l "safeParse|\.parse\(" || echo "검증 없는 핸들러"
```

**REPRODUCE** — 각 폼/엔드포인트에 아래를 투입한다.

| 입력 | 기대 |
|------|------|
| 빈 필수 필드 | 400 + 필드 에러 |
| 매우 긴 문자열(100k자) | 400 또는 413, 크래시 없음 |
| 음수/0/소수 (수량·금액) | 400 |
| 타입 불일치(문자열 자리에 객체/배열) | 400 |
| 유니코드/이모지/RTL/제어문자 | 정상 처리 또는 명확 거부 |
| SQL/NoSQL 주입 문자열 | 데이터로 처리, 쿼리 오류 없음 |
| 파일 업로드: 확장자 위조, 초대형, 0바이트 | 거부 |

**PASS/FAIL**

- **PASS:** 모든 케이스에서 서버가 4xx로 거부하고 사용자에게 필드 단위 안내가 표시된다. 500 발생 0. 클라이언트 우회 후에도 동일.
- **FAIL:** 500 발생, 검증 없이 저장, 우회 성공.

**FIX**

- 스키마를 **한 곳에 정의**하고 클라이언트/서버가 공유한다(중복 정의는 드리프트를 만든다).
- 길이·범위·형식·허용 목록을 모두 명시한다. `z.string()`만으로는 무제한 길이다.
- 파일은 MIME + 매직 바이트 + 크기 + 확장자를 함께 검증한다.

**GOOD**

```ts
// ✅ lib/schemas/item.ts — 공유 스키마
import { z } from 'zod';

export const ItemInput = z.object({
  title: z.string().trim().min(1, '제목을 입력해 주세요').max(120, '120자 이내로 입력해 주세요'),
  qty: z.coerce.number().int().positive().max(9_999),
  category: z.enum(['switch', 'keycap', 'case']),          // 허용 목록
  note: z.string().max(2_000).optional(),
});
export type ItemInput = z.infer<typeof ItemInput>;
```

```ts
// ✅ 서버 액션: 동일 스키마로 재검증
'use server';
export async function createItem(raw: unknown) {
  const user = await requireUser();
  const parsed = ItemInput.safeParse(raw);
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors };
  await db.item.create({ data: { ...parsed.data, ownerId: user.id } });
  revalidateTag('items');
  return { ok: true as const };
}
```

**REGRESSION HOOK**

```ts
const BAD_INPUTS = [
  { title: '', expect: 400 },
  { title: 'x'.repeat(100_000), expect: 400 },
  { title: 'ok', qty: -5, expect: 400 },
  { title: { $ne: null }, expect: 400 },
];
for (const [i, c] of BAD_INPUTS.entries()) {
  test(`서버가 잘못된 입력을 거부한다 #${i}`, async ({ request }) => {
    const res = await request.post('/api/items', { data: c, failOnStatusCode: false });
    expect(res.status()).toBe(c.expect);
  });
}
```

---

### C-SEC-06 — CSRF / SameSite / 오리진 검증

**WHY**
쿠키 기반 인증에서 CSRF 방어가 없으면 공격자 사이트가 사용자의 브라우저로 **의도치 않은 변경 요청**을 보낼 수 있다(비밀번호 변경, 결제, 삭제). `SameSite=Lax`는 상당한 방어를 제공하지만 완전하지 않다(GET으로 변경하는 엔드포인트, 서브도메인 문제).

**DETECT**

```bash
rg -n "sameSite" src | rg -o "sameSite:\s*['\"]\w+"
rg -n "origin|referer" src middleware.ts 2>/dev/null | rg -i "check|verify|assert"
rg -n "csrf" src -i | wc -l
rg -n "Access-Control-Allow-Origin" src | rg -v "\*" | wc -l
```

**REPRODUCE**

1. 다른 오리진에서 폼 제출을 시뮬레이션한다.

```ts
await page.setContent(`
  <form id="f" method="POST" action="http://localhost:3000/api/account/delete">
    <input name="confirm" value="yes">
  </form><script>document.getElementById('f').submit()</script>
`);
// 기대: 403 (오리진 불일치) — 성공하면 CSRF 취약 (S0)
```

2. `Origin` 헤더를 위조한 요청을 보내 서버가 검증하는지 확인한다.
3. GET으로 변경 가능한 엔드포인트가 있는지 확인한다(§C-APP-07).

**PASS/FAIL**

- **PASS:** 세션 쿠키가 `SameSite=Lax` 이상이고, 변경 요청은 오리진/CSRF 토큰 검증을 통과해야 하며, 크로스 오리진 폼 제출이 차단된다. CORS는 `*` + credentials 조합이 없다.
- **FAIL:** 크로스 오리진 변경 성공, `SameSite=None` without 정당한 사유, 와일드카드 CORS with credentials.

**FIX**

- 서버 액션은 Next가 오리진 검증을 수행하지만, 커스텀 라우트 핸들러는 **직접 검증**해야 한다.
- 민감 작업(계정 삭제, 비밀번호 변경, 결제)은 재인증(비밀번호/OTP 재확인)을 추가한다.
- CORS 허용 오리진은 환경변수로 명시 목록 관리.

**GOOD**

```ts
// ✅ 오리진 검증 유틸
const ALLOWED = new Set([process.env.NEXT_PUBLIC_SITE_URL!]);

function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED.has(origin)) {
    throw new Response(JSON.stringify({ error: { code: 'FORBIDDEN_ORIGIN' } }), { status: 403 });
  }
}

export async function POST(req: Request) {
  assertSameOrigin(req);
  const user = await requireUser();
  await requireRecentReauth(user);            // 민감 작업 재인증
  // …
}
```

**REGRESSION HOOK**

```ts
test('크로스 오리진 변경 요청은 차단된다', async ({ request }) => {
  const res = await request.post('/api/account/delete', {
    headers: { origin: 'https://evil.example' },
    data: { confirm: 'yes' },
    failOnStatusCode: false,
  });
  expect([403, 401]).toContain(res.status());
});
```

---

### C-SEC-07 — 의존성 취약점 및 공급망

**WHY**
프론트엔드 번들은 서드파티 코드로 가득하다. 취약한 패키지 하나가 XSS·프로토타입 오염·시크릿 유출 경로가 된다. 또한 유지되지 않는 패키지, 과도한 권한을 가진 postinstall 스크립트, 오타 유사 패키지(typosquat)는 실질적 위험이다.

**DETECT**

```bash
npm audit --omit=dev --audit-level=high
npm outdated
# 락파일 정합성 (CI에서 필수)
npm ci --dry-run
# 미사용/중복 의존성
npx depcheck 2>/dev/null || true
rg -n "\"postinstall\"|\"preinstall\"" package.json
```

**REPRODUCE / 판정**

1. `npm audit`의 high/critical 항목을 나열하고, **실제 사용 경로에 도달하는지** 확인한다(도달 불가면 Severity 하향, 근거 명시).
2. 각 항목에 대해 (a) 업그레이드 가능, (b) 패치 필요, (c) 대체 필요, (d) 수용(사유+기한) 중 하나로 결정한다.

**PASS/FAIL**

- **PASS:** 프로덕션 의존성에 high/critical 0(또는 도달 불가 + 문서화된 수용). 락파일이 커밋되어 있고 CI가 `npm ci`로 재현 가능한 설치를 한다.
- **FAIL:** 도달 가능한 high/critical, 락파일 없음/불일치.

**FIX**

- 우선순위: 직접 의존성 업그레이드 → 전이 의존성 `overrides` → 대체 패키지 → 수용(기한 명시).
- 번들 크기와 보안을 함께 본다: 무거운 유틸 패키지는 표준 API로 대체 가능한 경우가 많다.

**REGRESSION HOOK** — CI에 `npm audit --omit=dev --audit-level=high`를 게이트로 추가하고, 수용 항목은 명시적 예외 파일로 관리한다.

---

### C-SEC-08 — 레이트 리밋 및 남용 방어

**WHY**
로그인·회원가입·비밀번호 재설정·검색·AI 프록시·파일 업로드는 남용 대상이다. 제한이 없으면 크리덴셜 스터핑, 이메일 폭탄, 비용 폭증(AI/외부 API), DoS가 발생한다. 프론트엔드 디바운스는 방어가 아니다.

**DETECT**

```bash
rg -n "rateLimit|ratelimit|throttle|Retry-After|429" src | wc -l
rg --files src/app | rg "route\.ts$" | xargs rg -l "rateLimit" || echo "제한 없는 핸들러 존재"
```

**REPRODUCE**

```ts
test('로그인 시도가 제한된다', async ({ request }) => {
  const results: number[] = [];
  for (let i = 0; i < 30; i++) {
    const res = await request.post('/api/auth/login',
      { data: { email: 'a@b.c', password: 'wrong' }, failOnStatusCode: false });
    results.push(res.status());
  }
  expect(results).toContain(429);                    // 어느 시점에 제한
});
```

**PASS/FAIL**

- **PASS:** 인증/메일/AI/업로드 엔드포인트에 IP+계정 기준 제한이 있고, 429 + `Retry-After`를 반환하며, UI가 이를 사용자에게 안내한다(§C-API-01).
- **FAIL:** 무제한 시도 가능, 429 없음, 429를 UI가 처리하지 못함.

**FIX**

- 서버(또는 엣지)에서 슬라이딩 윈도우 제한을 적용한다. 계정 기준 + IP 기준을 함께 쓴다.
- 반복 실패에 지연/캡차를 단계적으로 도입한다.
- 비용이 큰 엔드포인트는 사용자별 쿼터를 둔다.

**REGRESSION HOOK** — 위 재현 테스트를 유지한다(단, CI에서 실제 메일 발송 등 부작용이 없는 엔드포인트로 한정).

---

## 20. Performance QA (`C-PRF-*`)

성능은 감각이 아니라 **측정 + 예산**이다. 예산 없는 성능 QA는 의미가 없다. 상세 확대는 `08_Performance_QA.md`에서 다루고, 여기서는 Core에서 반드시 통과해야 하는 기준선을 정의한다.

### 성능 예산 (프로젝트 기본값 — Binding Block에서 조정)

| 지표 | 목표(모바일 4G, 4x CPU) | 경고 | 실패 |
|------|------------------------|------|------|
| LCP | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| CLS | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| INP | ≤ 200ms | 200–500ms | > 500ms |
| TTFB | ≤ 800ms | 0.8–1.8s | > 1.8s |
| First Load JS (라우트) | ≤ 200kB gzip | 200–350kB | > 350kB |
| 이미지 총 전송 | ≤ 1MB (첫 화면) | 1–2MB | > 2MB |
| Lighthouse Performance | ≥ 90 | 75–89 | < 75 |

### C-PRF-01 — Core Web Vitals 실측

**WHY**
LCP/CLS/INP는 Google이 랭킹에 사용하며, 무엇보다 **사용자 이탈률과 직접 상관**한다. 로컬 개발 머신의 수치는 실사용자와 무관하므로, 스로틀 조건에서 측정해야 한다.

**DETECT / REPRODUCE**

```bash
# 1) 프로덕션 빌드로 측정 (dev 모드 측정은 무효)
npm run build && npm start

# 2) Lighthouse CLI (모바일 프리셋)
npx lighthouse http://localhost:3000/ --preset=mobile \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html --output-path=./tmp/qa/lh-home

# 3) 라우트별 반복 (P0 라우트 전부)
```

Playwright로 실측하는 방식(회귀 자동화에 적합):

```ts
async function vitals(page: Page) {
  return page.evaluate(() => new Promise<{ lcp: number; cls: number }>(res => {
    let lcp = 0, cls = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) lcp = (e as any).startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => {
      for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res({ lcp, cls }), 5000);
  }));
}

test('홈 LCP/CLS 예산', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8, latency: 150,
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/', { waitUntil: 'load' });
  const { lcp, cls } = await vitals(page);
  expect(lcp).toBeLessThan(4000);
  expect(cls).toBeLessThan(0.1);
});
```

**PASS/FAIL** — 위 예산 표 기준. 목표 초과 시 경고, 실패 구간은 FAIL.

**FIX 원칙 (순서를 지킨다)**

1. **LCP:** LCP 요소를 특정한다(DevTools > Performance > LCP 마커). 대개 히어로 이미지 또는 서버 대기.
   - 이미지면: `priority`, 적절한 포맷/크기, `preload`, CDN.
   - 서버 대기면: 워터폴 제거(§C-RSC-05), 캐시, 스트리밍.
2. **CLS:** 이미지·광고·임베드 크기 예약, 폰트 `swap` + `size-adjust`, 스켈레톤 크기 일치(§16), 동적 삽입 배너를 레이아웃에 미리 반영.
3. **INP:** long task 분해, 이벤트 핸들러 경량화, 하이드레이션 대상 축소(§C-RSC-01).
4. **TTFB:** 서버 로직 병렬화, 캐시, 엣지 배치.

**BAD / GOOD (LCP 이미지)**

```tsx
// ❌ 히어로가 lazy + 크기 미지정 → LCP 지연 + CLS
<img src="/hero.png" className="w-full" />

// ✅ 우선 로드 + 크기 예약 + 반응형 소스
<Image
  src="/hero.png" alt="제품 히어로"
  width={1600} height={900} priority sizes="100vw"
  className="h-auto w-full"
/>
```

**REGRESSION HOOK** — 위 vitals 테스트를 P0 라우트마다 유지하고, 예산 초과 시 CI를 실패시킨다.

---

### C-PRF-02 — 번들 크기와 코드 분할

**WHY**
JS는 다운로드 + 파싱 + 실행 비용을 모두 지불한다. 이미지보다 훨씬 비싸다. 번들 예산 없이 개발하면 기능이 늘어남에 따라 조용히 느려지고, 어느 날 "앱이 무겁다"는 피드백이 온다. 예산은 회귀를 **즉시** 잡는다.

**DETECT**

```bash
npm run build     # 라우트별 First Load JS 표 캡처
ANALYZE=true npm run build 2>/dev/null || true      # @next/bundle-analyzer 구성 시
# 대형 의존성 확인
npx source-map-explorer .next/static/chunks/*.js 2>/dev/null || true
```

**REPRODUCE**

1. 빌드 표에서 예산 초과 라우트를 나열한다.
2 각 초과 라우트의 최대 기여 모듈을 특정한다(analyzer 또는 Coverage).
3. 지연 로드/서버 이동/대체 라이브러리 적용 후 **재측정**해 감소를 증명한다.

**PASS/FAIL**

- **PASS:** 모든 라우트가 First Load JS 예산 이내. 공통 청크가 과도하게 크지 않다. 조건부 UI 라이브러리가 초기 청크에 없다.
- **FAIL:** 예산 초과, 단일 라이브러리가 초기 청크의 30% 이상.

**FIX**

- 서버 컴포넌트로 이동(가장 큰 효과) → 동적 import → 경량 대체 → 트리 셰이킹 가능한 import 형태로 변경.
- barrel import(`import { x } from '@/components'`)는 트리 셰이킹을 방해할 수 있다 — 직접 경로 import로 바꾼다.
- `moment` → `date-fns`/`Intl`, `lodash` → 개별 함수/표준 API 같은 치환을 검토한다.

**REGRESSION HOOK** — §C-RSC-01의 번들 예산 테스트를 라우트별로 확장한다.

---

### C-PRF-03 — 이미지 최적화

**WHY**
이미지는 전송 바이트의 대부분을 차지하고 LCP를 지배한다. 원본 4000px 이미지를 400px 슬롯에 넣는 것은 **10배 낭비**다. 크기 미지정은 CLS를 만든다. 잘못된 포맷(PNG 사진)은 수 배 비효율이다.

**DETECT**

```bash
rg -n "<img " src --glob '*.tsx'                       # next/image 미사용
rg -n "next/image" src | wc -l
rg -n "<Image" src -A5 | rg -v "width=|height=|fill"    # 크기 미지정
ls -lhS public/**/*.{png,jpg,jpeg,webp,avif} 2>/dev/null | head -20   # 대형 자산
rg -n "priority" src | wc -l                            # 히어로 우선 로드
```

**REPRODUCE**

1. Network에서 이미지별 전송 크기와 **표시 크기**를 비교한다(표시 대비 2배 초과 = 낭비).
2. 첫 화면 이미지 총 바이트를 합산해 예산과 비교한다.
3. 스크롤 전 뷰포트 밖 이미지가 즉시 로드되는지 확인(lazy 누락).

**PASS/FAIL**

- **PASS:** 모든 이미지가 `next/image`(또는 동등한 최적화 파이프라인)를 사용하고, 크기가 지정되며, 첫 화면 밖은 lazy, LCP 이미지는 `priority`. 전송 크기가 표시 크기에 합당하다(≤ 2x DPR 고려).
- **FAIL:** 생 `<img>` + 대형 원본, 크기 미지정으로 CLS, 뷰포트 밖 즉시 로드.

**FIX**

- `next/image` + `sizes`를 정확히 지정한다(`sizes` 누락은 과대 다운로드의 주원인).
- `fill` 사용 시 부모에 `position: relative` + `aspect-ratio`를 준다.
- 장식 이미지는 `alt=""` + `aria-hidden`, 정보 이미지는 의미 있는 `alt`(§22).
- SVG 아이콘은 컴포넌트로, 사진은 AVIF/WebP로.

**BAD**

```tsx
// ❌ 4000px 원본을 400px 슬롯에, 크기 미지정, lazy 없음
<img src="/photos/hero-4000.png" className="w-full rounded-xl" />
```

**GOOD**

```tsx
// ✅ 반응형 + 크기 예약 + 우선순위 명시
<Image
  src="/photos/hero.png"
  alt="키보드 스위치 클로즈업"
  width={1600} height={900}
  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
  priority                                  // LCP 요소일 때만
  className="h-auto w-full rounded-xl"
/>

// ✅ 목록 썸네일: lazy + 정확한 sizes
<Image src={item.thumb} alt="" width={80} height={80} sizes="80px" loading="lazy" className="rounded-md" />
```

**REGRESSION HOOK**

```ts
test('첫 화면 이미지 전송량이 예산 이내', async ({ page }) => {
  let bytes = 0;
  page.on('response', async r => {
    if (/image\//.test(r.headers()['content-type'] ?? '')) bytes += Number(r.headers()['content-length'] ?? 0);
  });
  await page.goto('/', { waitUntil: 'load' });
  expect(bytes, `${Math.round(bytes / 1024)}kB`).toBeLessThan(1024 * 1024);
});
```

---

### C-PRF-04 — 폰트 로딩 (FOIT/FOUT/CLS)

**WHY**
웹폰트는 텍스트 표시를 지연시키거나(FOIT: 보이지 않는 텍스트) 폰트 교체 시 레이아웃을 흔든다(CLS). 한글 폰트는 특히 크다(수백 kB~MB). 잘못 로드하면 LCP가 폰트에 묶인다.

**DETECT**

```bash
rg -n "next/font|@font-face|fonts.googleapis" src app 2>/dev/null
rg -n "font-display" src
ls -lh public/fonts/ 2>/dev/null
rg -n "preload" src | rg -i font
```

**REPRODUCE**

1. Slow 3G에서 첫 페인트 시 텍스트가 보이는지 확인(안 보이면 FOIT → FAIL).
2. 폰트 교체 시점의 레이아웃 이동을 CLS로 측정한다.
3. 폰트 파일 크기와 서브셋 여부를 확인한다(한글 전체 = 과대).

**PASS/FAIL**

- **PASS:** `font-display: swap`(또는 optional), 로컬 호스팅 + `preload`, 서브셋 적용, `size-adjust`/fallback 메트릭으로 교체 시 이동 최소화. CLS 기여 < 0.02.
- **FAIL:** FOIT 발생, 폰트 교체로 눈에 보이는 점프, 서브셋 없는 대형 한글 폰트.

**FIX**

- `next/font/local` 또는 `next/font/google`을 사용한다(자동 self-host + preload + fallback 메트릭 조정).
- 한글은 필요한 서브셋만(또는 가변 폰트) 사용하고, 굵기를 2~3개로 제한한다.
- 아이콘 폰트는 SVG로 교체한다.

**BAD**

```html
<!-- ❌ 외부 CDN + display 미지정 → FOIT + 추가 연결 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900" rel="stylesheet" />
```

**GOOD**

```ts
// ✅ app/fonts.ts — self-host + swap + 폴백 메트릭
import localFont from 'next/font/local';

export const sans = localFont({
  src: [
    { path: '../public/fonts/Pretendard-Regular.subset.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Pretendard-SemiBold.subset.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Apple SD Gothic Neo', 'sans-serif'],
  adjustFontFallback: 'Arial',                 // 교체 시 이동 최소화
  variable: '--font-sans',
});
```

**REGRESSION HOOK**

```ts
test('폰트 로딩으로 인한 레이아웃 이동이 작다', async ({ page }) => {
  await page.goto('/');
  const cls = await page.evaluate(() => new Promise<number>(res => {
    let v = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) v += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res(v), 4000);
  }));
  expect(cls).toBeLessThan(0.1);
});
```

---

### C-PRF-05 — 렌더 성능 (React 렌더 비용)

**WHY**
불필요한 리렌더는 INP를 악화시키고 저사양 기기에서 입력 지연을 만든다. 특히 큰 리스트, 차트, 테이블에서 부모 리렌더가 전체 자식을 다시 그리면 프레임이 깨진다. 다만 **측정 없는 메모이제이션은 오히려 해롭다**(비용 + 복잡도).

**DETECT**

```bash
rg -n "React\.memo|useMemo|useCallback" src | wc -l          # 과다/과소 파악
rg -n "\.map\(" src --glob '*.tsx' -B10 | rg -c "memo"        # 대형 리스트 메모 여부
rg -n "virtual|windowing|react-virtual" src | wc -l           # 가상화 사용
```

**REPRODUCE**

1. React DevTools Profiler로 대표 상호작용을 녹화하고 **커밋 수와 각 커밋 시간**을 기록한다.
2. 4x CPU 스로틀에서 long task(50ms+)를 찾는다.
3. 리스트 항목 수를 10 → 100 → 1000으로 늘려 상호작용 지연이 선형/초선형으로 늘어나는지 확인한다.

**PASS/FAIL**

- **PASS:** 대표 상호작용의 커밋 시간 < 50ms(4x 스로틀), 1000행 목록에서도 입력 지연 없음(가상화 또는 페이지네이션). 메모이제이션은 프로파일러 근거가 있는 곳에만.
- **FAIL:** long task 발생, 항목 수에 따라 상호작용이 급격히 느려짐.

**FIX**

- 먼저 **렌더 범위를 줄인다**(상태를 아래로 이동, 컴포넌트 분할, 서버 컴포넌트화).
- 그 다음 가상화(1000행 이상) 또는 페이지네이션.
- 마지막에 메모이제이션 — 측정으로 효과를 증명한 경우만.

**BAD**

```tsx
// ❌ 입력 상태가 최상단 → 타이핑마다 1000행 전체 리렌더
function Page() {
  const [q, setQ] = useState('');
  return (
    <>
      <input value={q} onChange={e => setQ(e.target.value)} />
      <BigTable rows={rows} highlight={q} />
    </>
  );
}
```

**GOOD**

```tsx
// ✅ 입력 상태를 격리 + 지연 값으로 테이블 갱신 분리
function Page() {
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q);           // 입력은 즉시, 테이블은 지연
  return (
    <>
      <SearchInput value={q} onChange={setQ} />
      <BigTable rows={rows} highlight={deferred} />
    </>
  );
}

const BigTable = memo(function BigTable({ rows, highlight }: Props) { /* … */ });
```

**REGRESSION HOOK**

```ts
test('대형 목록에서 입력 지연이 없다 (INP 근사)', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/items?perPage=200');
  const box = page.getByRole('searchbox');
  const t0 = Date.now();
  await box.pressSequentially('keyboard', { delay: 20 });
  expect(Date.now() - t0).toBeLessThan(2000);
});
```

---

### C-PRF-06 — 프리페치·프리로드 전략

**WHY**
프리페치는 체감 속도를 크게 개선하지만, 목록 100개 링크를 모두 프리페치하면 **대역폭과 서버를 낭비**하고 모바일 데이터를 소모한다. 반대로 핵심 경로(로그인 → 대시보드)에 프리페치가 없으면 전환이 느리다.

**DETECT**

```bash
rg -n "prefetch" src | wc -l
rg -n "<Link" src -A2 | rg -c "prefetch=\{false\}"
rg -n "rel=\"preload\"|<link rel" src app 2>/dev/null
```

**REPRODUCE**

1. 목록 화면 로드 후 Network에서 **RSC 프리페치 요청 수**를 센다(과다 여부).
2. 핵심 전환(주요 CTA)에서 클릭 후 체감 지연을 측정한다.

**PASS/FAIL**

- **PASS:** 핵심 경로는 프리페치되고, 대량 목록은 억제되거나 hover/viewport 기반이다. 프리페치 요청이 초기 로드 대역폭을 지배하지 않는다.
- **FAIL:** 목록 전체 프리페치로 수십 요청, 또는 핵심 경로 프리페치 없음.

**FIX**

- 대량 목록: `prefetch={false}` + hover 시 프리페치(`onMouseEnter`에서 `router.prefetch`).
- 데이터 절약 모드 존중: `navigator.connection.saveData` 확인.
- 폰트/히어로 이미지는 `preload`, 나머지는 하지 않는다(preload 남용은 경쟁을 유발).

**GOOD**

```tsx
'use client';
// ✅ 뷰포트/hover 기반 선택적 프리페치
export function ItemLink({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  return (
    <Link
      href={`/items/${id}`}
      prefetch={false}
      onMouseEnter={() => router.prefetch(`/items/${id}`)}
      onFocus={() => router.prefetch(`/items/${id}`)}
    >
      {title}
    </Link>
  );
}
```

**REGRESSION HOOK**

```ts
test('목록 화면이 과도한 프리페치를 하지 않는다', async ({ page }) => {
  let rsc = 0;
  page.on('request', r => { if (r.url().includes('_rsc=')) rsc++; });
  await page.goto('/items');
  await page.waitForLoadState('networkidle');
  expect(rsc).toBeLessThan(10);
});
```

---

### C-PRF-07 — 메모리 누수 (장수 세션)

**WHY**
SaaS 대시보드는 며칠간 열려 있다. 누수가 있으면 사용자는 "오후가 되면 느려진다"를 경험하고 원인을 모른다. 원인은 §C-CLI-03(구독 정리), 무한 누적 배열(로그/알림), 캐시 무제한 증가, Detached DOM이다.

**DETECT / REPRODUCE**

```ts
test('반복 사용 후 힙이 단조 증가하지 않는다', async ({ page }) => {
  await page.goto('/dashboard');
  const read = async () => {
    await page.evaluate(() => (globalThis as any).gc?.());        // --js-flags=--expose-gc 필요
    return page.evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);
  };
  const base = await read();
  for (let i = 0; i < 20; i++) {
    await page.getByRole('link', { name: '설정' }).click();
    await page.getByRole('link', { name: '대시보드' }).click();
  }
  const after = await read();
  expect((after - base) / Math.max(base, 1)).toBeLessThan(0.5);   // 50% 이상 증가면 조사
});
```

추가로 DevTools Memory 패널에서 힙 스냅샷 3개(초기/사용 후/GC 후)를 비교하고 Detached DOM 노드를 확인한다.

**PASS/FAIL**

- **PASS:** 반복 사용 후 GC 이후 힙이 기준선 근처로 복귀. Detached 노드 누적 없음. 리스너 순증 0(§C-CLI-03).
- **FAIL:** 단조 증가, Detached 노드 수천 개, 리스너 순증.

**FIX**

- 모든 구독에 정리 함수(§C-CLI-03).
- 누적 컬렉션에 상한을 둔다(최근 N개만 유지).
- 클라이언트 캐시는 TTL/최대 크기를 설정한다.
- 클로저가 큰 객체를 붙잡지 않게 한다(ref에 DOM을 오래 보관하지 않는다).

**REGRESSION HOOK** — 위 테스트를 nightly 스위트로 유지한다(매 PR 실행은 느리고 불안정하므로 별도 스위트).

---

## 21. SEO QA (`C-SEO-*`)

SaaS에서 SEO는 마케팅 라우트(랜딩/블로그/가격/문서)에 집중되지만, **앱 라우트가 잘못 인덱싱되는 것**을 막는 일도 SEO QA의 일부다.

### C-SEO-01 — 인덱싱 정책 (robots / noindex)

**WHY**
앱 내부 화면(대시보드, 설정, 결과 페이지)이 인덱싱되면 (a) 로그인 벽에 걸린 URL이 검색 결과에 노출되어 사용자 경험이 나빠지고, (b) 크롤 예산이 낭비되며, (c) 개인 데이터가 노출될 수 있다. 반대로 마케팅 페이지에 실수로 `noindex`가 남아 있으면 **트래픽이 0이 된다**(스테이징 설정이 프로덕션에 배포되는 사고가 흔하다).

**DETECT**

```bash
curl -s localhost:3000/robots.txt
rg -n "robots" src/app | rg -i "index|follow"
rg -n "noindex" src
curl -s localhost:3000/ | rg -o '<meta name="robots"[^>]*>'
```

**REPRODUCE**

1. 각 라우트의 SSR HTML에서 `robots` 메타를 추출해 표로 정리한다.
2. `robots.txt`와 `sitemap.xml`이 실제 라우트와 일치하는지 대조한다.
3. 스테이징/프로덕션 환경변수 차이로 정책이 바뀌는지 확인한다.

**PASS/FAIL**

- **PASS:** 공개 마케팅 라우트 = index/follow, 앱/인증 라우트 = noindex, `robots.txt`가 앱 경로를 disallow, sitemap에 공개 라우트만 포함. 프로덕션에 `noindex` 오설정 없음.
- **FAIL:** 앱 라우트 인덱싱 허용, 마케팅 라우트 noindex, sitemap 불일치.

**FIX**

- 라우트 그룹별 기본 정책을 레이아웃 metadata로 설정하고, 예외만 페이지에서 덮어쓴다.
- `robots.ts`/`sitemap.ts`를 코드로 생성해 라우트와 동기화한다.
- 스테이징은 환경변수로 전역 noindex를 강제한다(프로덕션 배포 시 자동 해제).

**GOOD**

```ts
// ✅ app/robots.ts
import type { MetadataRoute } from 'next';
const isProd = process.env.NEXT_PUBLIC_ENV === 'production';

export default function robots(): MetadataRoute.Robots {
  if (!isProd) return { rules: [{ userAgent: '*', disallow: '/' }] };    // 스테이징 전면 차단
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard/', '/settings/', '/api/', '/auth/'] }],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}

// ✅ app/(app)/layout.tsx — 앱 그룹 전체 noindex
export const metadata: Metadata = { robots: { index: false, follow: false } };
```

**REGRESSION HOOK**

```ts
test('앱 라우트는 noindex, 마케팅 라우트는 index', async ({ request }) => {
  const app = await (await request.get('/dashboard')).text();
  expect(app).toMatch(/noindex/);
  const marketing = await (await request.get('/pricing')).text();
  expect(marketing).not.toMatch(/noindex/);
});
```

---

### C-SEO-02 — 시맨틱 구조와 heading 계층

**WHY**
`h1`이 없거나 여러 개면 크롤러와 스크린리더 모두 문서 주제를 파악하지 못한다. heading 레벨 점프(h1 → h4)는 보조기술 사용자의 문서 탐색을 망가뜨린다(§22와 공유되는 관심사). 시각적 크기를 위해 heading 태그를 고르는 것이 근본 원인이다.

**DETECT**

```bash
rg -n "<h[1-6]" src --glob '*.tsx' | wc -l
rg -n "<h1" src --glob '*.tsx'
rg -c "<h1" src/app --glob 'page.tsx' | rg ":0$"        # h1 없는 페이지
```

**REPRODUCE**

```ts
const headings = await page.evaluate(() =>
  [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
    level: Number(h.tagName[1]), text: h.textContent?.trim().slice(0, 40),
  })));
// 판정: h1 정확히 1개, 레벨 점프(이전 레벨 +2 이상) 0
```

**PASS/FAIL**

- **PASS:** 페이지당 `h1` 1개, 레벨 점프 없음, heading 텍스트가 실제 섹션 주제를 서술한다. 랜드마크(`header/nav/main/footer/aside`)가 존재한다.
- **FAIL:** h1 없음/중복, 레벨 점프, 스타일 목적의 heading 사용.

**FIX**

- heading 레벨은 **문서 구조**로 정하고, 크기는 Tailwind 클래스로 조정한다.
- 시각적으로 heading이 필요 없으면 `sr-only` heading으로 구조를 유지한다.
- 페이지 컴포넌트에서 h1을 소유하고, 재사용 섹션은 h2부터 시작하도록 규칙화한다.

**BAD**

```tsx
// ❌ 크기 때문에 레벨 선택 + h1 없음
<h3 className="text-3xl font-bold">대시보드</h3>
<h6 className="text-sm">최근 활동</h6>
```

**GOOD**

```tsx
// ✅ 구조는 레벨, 크기는 클래스
<h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
<section aria-labelledby="recent">
  <h2 id="recent" className="text-sm font-medium text-muted-foreground">최근 활동</h2>
  …
</section>
```

**REGRESSION HOOK**

```ts
for (const path of ['/', '/pricing', '/dashboard']) {
  test(`heading 구조가 유효하다: ${path}`, async ({ page }) => {
    await page.goto(path);
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1])));
    expect(levels.filter(l => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });
}
```

---

### C-SEO-03 — canonical / 중복 URL / 리다이렉트

**WHY**
같은 콘텐츠가 여러 URL(`/items?page=1`, `/items/`, `www` 유무, http/https, 대소문자)로 접근되면 크롤 예산이 분산되고 순위가 희석된다. 리다이렉트 체인(3회 이상)은 지연을 만들고, 리다이렉트 루프는 페이지를 완전히 접근 불가로 만든다.

**DETECT**

```bash
rg -n "alternates|canonical" src/app | wc -l
rg -n "redirects\(\)" next.config.* -A20
for u in / /index /Items /items/ /items?page=1; do
  echo "== $u"; curl -sI "localhost:3000$u" | rg "HTTP/|location:";
done
```

**REPRODUCE**

1. 변형 URL 목록을 만들어 각각의 상태코드와 최종 URL을 기록한다.
2. 리다이렉트 홉 수를 센다(2 이하가 목표).
3. 각 페이지의 canonical이 정규 URL과 일치하는지 확인한다.

**PASS/FAIL**

- **PASS:** 한 콘텐츠 = 하나의 정규 URL. 변형은 301로 정규 URL로 수렴(홉 ≤ 2). 모든 인덱싱 대상 페이지에 절대 canonical 존재. 루프 0.
- **FAIL:** 중복 인덱싱 가능, 리다이렉트 체인 3+, canonical 누락/오류, 루프.

**FIX**

- `metadataBase` + `alternates.canonical`을 레이아웃/페이지에 설정한다.
- 도메인/트레일링 슬래시 정규화는 **엣지/호스팅 레벨 1회 리다이렉트**로 처리한다.
- 파라미터가 콘텐츠를 바꾸지 않으면 canonical에서 제외한다.

**GOOD**

```ts
// ✅ app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  alternates: { canonical: '/' },
};

// ✅ app/items/page.tsx — 페이지네이션 canonical 정책
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = Number((await searchParams).page ?? 1);
  return { alternates: { canonical: page > 1 ? `/items?page=${page}` : '/items' } };
}
```

**REGRESSION HOOK**

```ts
test('중복 URL이 정규 URL로 1회 리다이렉트된다', async ({ request }) => {
  const res = await request.get('/items/', { maxRedirects: 0 });
  expect([301, 308]).toContain(res.status());
  expect(res.headers()['location']).toMatch(/\/items$/);
});
```

---

### C-SEO-04 — Open Graph / 구조화 데이터

**WHY**
OG 태그가 없으면 Slack/카카오톡/트위터 공유 시 **제목 없는 회색 카드**가 나와 클릭률이 급락한다. SaaS의 상당한 유입이 공유 링크에서 온다. 구조화 데이터(JSON-LD)는 리치 결과(가격, FAQ, 평점)를 가능하게 하지만, 잘못된 스키마는 페널티가 될 수 있다.

**DETECT**

```bash
curl -s localhost:3000/ | rg -o '<meta property="og:[^>]*>'
curl -s localhost:3000/ | rg -o '<meta name="twitter:[^>]*>'
curl -s localhost:3000/pricing | rg -o 'application/ld\+json'
rg -n "opengraph-image|twitter-image" src/app
```

**REPRODUCE**

1. 주요 라우트의 OG 태그를 표로 정리한다(title, description, image, url, type).
2. OG 이미지 URL을 실제로 요청해 200 + 올바른 크기(권장 1200×630)인지 확인한다.
3. JSON-LD를 검증기(Google Rich Results Test 또는 스키마 검증 스크립트)로 확인한다.

**PASS/FAIL**

- **PASS:** 공개 라우트에 og:title/description/image/url + twitter:card 존재. OG 이미지 200 + 1200×630 근사. JSON-LD가 유효하고 실제 페이지 내용과 일치.
- **FAIL:** OG 누락, 이미지 404, JSON-LD 스키마 오류 또는 내용 불일치(위장).

**FIX**

- 루트 metadata에 기본 OG를 두고 페이지에서 덮어쓴다.
- 동적 OG 이미지는 `opengraph-image.tsx`(ImageResponse)로 생성한다.
- JSON-LD는 실제 표시 콘텐츠와 반드시 일치시킨다.

**GOOD**

```tsx
// ✅ app/items/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const item = await getItem(params.id);
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', padding: 64, background: '#0b1120', color: '#fff', fontSize: 64 }}>
      {item.name}
    </div>,
    size,
  );
}
```

```tsx
// ✅ JSON-LD (표시 내용과 일치)
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    image: [item.ogImage],
    offers: { '@type': 'Offer', price: item.price, priceCurrency: 'KRW', availability: 'https://schema.org/InStock' },
  }) }}
/>
```

> `dangerouslySetInnerHTML`은 JSON.stringify 결과만 넣고, 사용자 입력이 포함되면 `</script>` 이스케이프를 확인한다(§C-SEC-02).

**REGRESSION HOOK**

```ts
test('공유 카드용 OG 태그와 이미지가 유효하다', async ({ page, request }) => {
  await page.goto('/pricing');
  const og = async (p: string) => page.locator(`meta[property="og:${p}"]`).getAttribute('content');
  expect(await og('title')).toBeTruthy();
  expect(await og('description')).toBeTruthy();
  const img = await og('image');
  expect(img).toBeTruthy();
  expect((await request.get(img!)).status()).toBe(200);
});
```

---

### C-SEO-05 — sitemap / 크롤 가능성

**WHY**
sitemap이 없거나 오래되면 신규 콘텐츠 발견이 늦다. 반대로 sitemap에 404/noindex URL이 있으면 신뢰도가 떨어진다. JS 없이 콘텐츠가 렌더되지 않으면 일부 크롤러는 아무것도 보지 못한다.

**DETECT**

```bash
curl -s localhost:3000/sitemap.xml | rg -c "<loc>"
rg -n "sitemap" src/app
# JS 없이 렌더 확인
curl -s localhost:3000/pricing | rg -c "요금|Pricing"
```

**REPRODUCE**

1. sitemap의 모든 URL에 요청을 보내 상태코드를 확인한다(404/리다이렉트/noindex 검출).
2. JS 비활성 컨텍스트로 주요 마케팅 라우트를 로드해 콘텐츠 존재를 확인한다.

**PASS/FAIL**

- **PASS:** sitemap의 모든 URL이 200 + index 허용. 신규 콘텐츠가 자동 반영된다(코드 생성). JS 없이도 핵심 콘텐츠가 HTML에 존재.
- **FAIL:** sitemap에 죽은 URL, 수동 관리로 인한 누락, JS 필수 렌더.

**FIX**

- `sitemap.ts`로 데이터 소스에서 생성한다.
- `lastModified`를 실제 갱신 시각으로 설정한다.
- 마케팅 라우트는 서버 렌더를 유지한다(§C-RSC-01).

**GOOD**

```ts
// ✅ app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const items = await getPublicItems();                 // 공개 항목만
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    ...items.map(i => ({
      url: `${base}/items/${i.slug}`,
      lastModified: i.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
```

**REGRESSION HOOK**

```ts
test('sitemap의 모든 URL이 200을 반환한다', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).slice(0, 30);
  for (const u of urls) {
    const res = await request.get(u, { failOnStatusCode: false });
    expect(res.status(), u).toBe(200);
  }
});
```

---

### C-SEO-06 — 국제화 / 언어 속성

**WHY**
`<html lang>`이 없거나 틀리면 스크린리더가 잘못된 발음으로 읽고(접근성 3.1.1 위반), 검색엔진이 언어를 오판한다. 다국어 사이트에서 `hreflang`이 없으면 잘못된 언어 버전이 노출된다.

**DETECT**

```bash
curl -s localhost:3000/ | rg -o '<html[^>]*lang="[^"]*"'
rg -n "lang=" src/app --glob 'layout.tsx'
rg -n "hreflang|alternates.*languages" src | wc -l
```

**PASS/FAIL**

- **PASS:** `<html lang>`이 실제 콘텐츠 언어와 일치. 다국어면 `alternates.languages`(hreflang) + `x-default` 존재. 부분 다른 언어 구간에 `lang` 속성.
- **FAIL:** lang 누락/불일치, 다국어인데 hreflang 없음.

**FIX**

```tsx
// ✅ 로케일에 따라 동적 설정
export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <html lang={locale}>{/* … */}</html>;
}

// ✅ hreflang
export const metadata: Metadata = {
  alternates: {
    canonical: '/ko',
    languages: { 'ko-KR': '/ko', 'en-US': '/en', 'x-default': '/en' },
  },
};
```

**REGRESSION HOOK**

```ts
test('html lang이 콘텐츠 언어와 일치한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', /^ko/);
});
```

---

## 22. Accessibility QA (`C-A11Y-*`)

기준은 **WCAG 2.2 AA**다. 상세 확대는 `09_Accessibility_QA.md`에서 다루고, 여기서는 Core에서 반드시 통과해야 하는 항목을 정의한다. 접근성 결함은 "소수 사용자 문제"가 아니다 — 키보드 탐색 불가, 대비 부족, 포커스 소실은 **모든 사용자의 사용성 문제**이며 다수 국가에서 법적 요구사항이다.

### C-A11Y-01 — 키보드만으로 전체 플로우 완주

**WHY**
마우스 없이 완주할 수 없는 플로우는 (a) 스크린리더 사용자, (b) 운동 장애 사용자, (c) 파워 유저 모두를 차단한다. 실무에서 가장 흔한 차단 지점은 커스텀 드롭다운, 모달, 캐러셀, 드래그 정렬, 커스텀 체크박스다.

**DETECT**

```bash
rg -n "onClick" src --glob '*.tsx' -B3 | rg "<div|<span|role=\"button\"" | rg -v "onKeyDown|onKeyUp"
rg -n "tabIndex=\{-1\}" src                       # 포커스 제외 남용
rg -n "tabIndex=\{[1-9]" src                       # 양수 tabindex = 순서 파괴
rg -n "outline-none|outline: none" src             # 포커스 표시 제거 (§C-A11Y-02)
```

**REPRODUCE** — 마우스를 사용하지 않고 각 P0 플로우를 완주한다.

```
[ ] Tab / Shift+Tab 으로 모든 인터랙티브 요소에 도달 가능
[ ] 포커스 순서가 시각적 순서와 일치
[ ] Enter / Space 로 버튼·링크 활성화
[ ] Esc 로 모달·드로어·팝오버 닫기
[ ] 화살표 키로 메뉴·탭·라디오·리스트박스 이동
[ ] Home/End 로 목록 처음/끝 (해당 컴포넌트)
[ ] 모달 열림 시 포커스 진입, 닫힘 시 트리거 복귀 (§C-CLI-04)
[ ] 포커스가 화면 밖 요소로 가지 않음 (숨겨진 요소 포커스 금지)
[ ] Skip to content 링크 존재 및 동작
```

자동 탐지 스크립트:

```ts
test('키보드로 모든 인터랙티브 요소에 도달할 수 있다', async ({ page }) => {
  await page.goto('/');
  const total = await page.locator('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])').count();
  const reached = new Set<string>();
  for (let i = 0; i < total + 10; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      return `${el.tagName}:${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 20) ?? ''}`;
    });
    if (id) reached.add(id);
  }
  expect(reached.size).toBeGreaterThanOrEqual(Math.floor(total * 0.9));
});
```

**PASS/FAIL**

- **PASS:** 위 체크리스트 전부 통과. 키보드만으로 회원가입 → 핵심 작업 → 로그아웃 완주 가능.
- **FAIL:** 도달 불가 컨트롤, 포커스 순서 불일치, Esc 무반응, 트랩 탈출 불가/유출.

**FIX**

- 클릭 가능한 것은 `<button>`/`<a>`로 만든다. `div onClick`은 role + tabIndex + 키 핸들러를 모두 요구하므로 시작부터 잘못된 선택이다.
- 복합 위젯(탭/메뉴/콤보박스)은 WAI-ARIA APG 패턴을 따르거나 검증된 라이브러리를 사용한다.
- 양수 `tabindex`를 쓰지 않는다. DOM 순서를 시각 순서와 맞춘다.

**BAD**

```tsx
// ❌ 키보드 접근 불가 + 시맨틱 없음
<div className="cursor-pointer rounded bg-primary p-2" onClick={submit}>제출</div>

// ❌ 포커스 순서 강제 → 유지 불가
<input tabIndex={3} /><input tabIndex={1} /><input tabIndex={2} />
```

**GOOD**

```tsx
// ✅ 네이티브 시맨틱 (키보드·스크린리더 자동 지원)
<button type="button" onClick={submit} className="rounded bg-primary p-2 text-primary-foreground">
  제출
</button>

// ✅ 불가피하게 커스텀이면 전부 구현
<div
  role="button" tabIndex={0}
  onClick={submit}
  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); submit(); } }}
  aria-disabled={pending || undefined}
>
  제출
</div>

// ✅ Skip link (레이아웃 최상단)
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:ring-2">
  본문으로 건너뛰기
</a>
<main id="main" tabIndex={-1}>…</main>
```

**REGRESSION HOOK** — 위 도달 테스트 + 모달 트랩 테스트(§C-CLI-04)를 P0 라우트마다 유지한다.

---

### C-A11Y-02 — 포커스 표시 (Focus Visible)

**WHY**
`outline: none`은 접근성 파괴의 가장 흔한 한 줄이다(WCAG 2.4.7). 포커스가 보이지 않으면 키보드 사용자는 **자신이 어디 있는지 알 수 없다**. "디자인상 보기 싫어서" 제거하는 경우가 대부분인데, 해결책은 제거가 아니라 **디자인에 맞는 포커스 스타일**이다.

**DETECT**

```bash
rg -n "outline-none|outline: none|outline:0" src
rg -n "focus:outline-none" src -A1 | rg -v "focus-visible:ring|focus:ring"    # 대체 없음
rg -n "focus-visible" src | wc -l
```

**REPRODUCE**

1. Tab으로 순회하며 **매 스텝의 포커스 링이 보이는지** 확인한다(스크린샷 자동 수집 권장).
2. 다크 모드에서도 대비가 충분한지 확인한다.
3. 포커스 링이 조상 `overflow-hidden`에 잘리는지 확인한다.

```ts
test('모든 포커스 스텝에서 표시가 보인다', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, width: cs.outlineWidth, shadow: cs.boxShadow };
    });
    if (!s) continue;
    const visible = (s.outline !== 'none' && parseFloat(s.width) > 0) || s.shadow !== 'none';
    expect(visible, `step ${i} has no focus indicator`).toBe(true);
  }
});
```

**PASS/FAIL**

- **PASS:** 모든 포커스 가능 요소에 명확한 표시(최소 2px, 대비 3:1 이상, 요소와 인접 색 모두에 대해). 잘림 없음. 라이트/다크 모두 보임.
- **FAIL:** 표시 없음/미약함/잘림, `outline: none` 대체 없이 사용.

**FIX**

- 전역 기본 포커스 스타일을 정의하고 컴포넌트는 그것을 상속한다.
- `:focus-visible`을 사용해 마우스 클릭 시 링이 보이지 않게 하되, 키보드에서는 항상 보이게 한다.
- 링 색은 토큰(`--ring`)으로 두어 다크 모드에서도 대비를 확보한다.

**BAD**

```css
/* ❌ 전역 파괴 */
*:focus { outline: none; }
```

**GOOD**

```css
/* ✅ globals.css — 전역 기본 포커스 정책 */
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 4px;
}
```

```tsx
// ✅ 컴포넌트 레벨 (Tailwind)
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

**REGRESSION HOOK** — 위 포커스 표시 테스트 + `rg` 기반 `outline-none` 정적 가드를 함께 유지한다.

---

### C-A11Y-03 — 접근가능한 이름 (라벨·대체 텍스트)

**WHY**
아이콘만 있는 버튼은 스크린리더에서 "버튼"으로만 읽힌다 — 사용자는 무엇을 하는 버튼인지 알 수 없다. 라벨 없는 입력은 "편집 텍스트"로만 읽힌다. placeholder는 라벨이 아니다(입력 시 사라지고, 대비가 낮고, 일부 보조기술이 읽지 않는다).

**DETECT**

```bash
rg -n "<button" src -A3 | rg -v "aria-label|aria-labelledby|>[^<]*[가-힣A-Za-z]"   # 이름 없는 버튼 후보
rg -n "<input" src -A2 | rg -v "aria-label|id="                                     # 라벨 연결 없음
rg -n "placeholder=" src -B3 | rg -v "<label|aria-label"                            # placeholder만
rg -n "<Image|<img" src -A3 | rg -v "alt="                                          # alt 누락
rg -n 'alt=""' src | wc -l                                                          # 장식 이미지 (정당할 수 있음)
```

**REPRODUCE**

```ts
test('모든 인터랙티브 요소가 접근가능한 이름을 갖는다', async ({ page }) => {
  await page.goto('/');
  const nameless = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]), select, textarea')) {
      const name =
        el.getAttribute('aria-label') ??
        (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent) ??
        (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) ??
        el.closest('label')?.textContent ??
        el.textContent ??
        (el as HTMLInputElement).title ?? '';
      if (!name.trim()) out.push(`${el.tagName}.${el.className}`.slice(0, 80));
    }
    return out;
  });
  expect(nameless).toEqual([]);
});
```

**PASS/FAIL**

- **PASS:** 모든 버튼/링크/입력이 의미 있는 접근가능한 이름을 갖는다. 정보 이미지는 서술적 `alt`, 장식 이미지는 `alt=""`. placeholder는 보조 힌트로만.
- **FAIL:** 이름 없는 컨트롤 1개 이상, placeholder만 있는 입력, 이미지 alt 누락 또는 "image"/"사진" 같은 무의미 alt.

**FIX**

- 아이콘 버튼에는 `aria-label`을 붙이고, 툴팁 텍스트와 동일하게 유지한다.
- 입력은 `<label htmlFor>` 연결을 기본으로 한다(시각적 라벨 숨김이 필요하면 `sr-only`).
- 링크 텍스트는 "여기", "더 보기" 대신 목적지를 서술한다(문맥 없이도 이해 가능해야 한다).

**BAD**

```tsx
// ❌ 스크린리더: "버튼", "편집 텍스트", "링크"
<button onClick={remove}><TrashIcon /></button>
<input placeholder="이메일" />
<a href="/pricing">여기</a>
<Image src="/hero.png" />
```

**GOOD**

```tsx
// ✅ 명확한 이름
<button type="button" onClick={remove} aria-label={`${item.name} 삭제`}>
  <TrashIcon aria-hidden="true" className="size-4" />
</button>

<label htmlFor="email" className="text-sm font-medium">이메일</label>
<input id="email" type="email" placeholder="you@company.com" autoComplete="email" />

<a href="/pricing">요금제 자세히 보기</a>

<Image src="/hero.png" alt="적축 스위치가 장착된 87키 키보드 클로즈업" width={1600} height={900} />
<Image src="/deco-blob.svg" alt="" aria-hidden width={200} height={200} />   {/* 장식 */}
```

**REGRESSION HOOK** — 위 nameless 테스트를 P0 라우트마다 유지한다.

---

### C-A11Y-04 — 색상 대비

**WHY**
대비 부족은 저시력·고령 사용자뿐 아니라 **햇빛 아래 모바일 사용자 전원**에게 영향을 준다. 디자인 시스템의 `text-muted-foreground`가 배경과 3:1 밖에 안 되는 경우가 매우 흔하다(WCAG 1.4.3: 본문 4.5:1, 큰 텍스트 3:1, UI 컴포넌트/그래픽 3:1).

**DETECT / REPRODUCE**

```ts
// 자동 대비 감사 (라이트/다크 모두 실행)
const violations = await page.evaluate(() => {
  const lum = (c: string) => {
    const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number)
      .map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const bgOf = (el: Element): string => {
    let n: Element | null = el;
    while (n) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && !/rgba?\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
      n = n.parentElement;
    }
    return 'rgb(255,255,255)';
  };
  const out: { text: string; ratio: number; required: number }[] = [];
  for (const el of document.querySelectorAll<HTMLElement>('p,span,a,button,label,li,h1,h2,h3,h4,h5,h6,td,th,input,small')) {
    const t = el.textContent?.trim(); if (!t || el.offsetParent === null) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const required = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    const r = ratio(cs.color, bgOf(el));
    if (r < required) out.push({ text: t.slice(0, 40), ratio: Number(r.toFixed(2)), required });
  }
  return out;
});
expect(violations).toEqual([]);
```

**PASS/FAIL**

- **PASS:** 라이트/다크 양쪽에서 위반 0. 포커스 링, 보더, 아이콘, 차트 색도 3:1 이상. 비활성 요소도 판독 가능(권장 3:1).
- **FAIL:** 위반 1건 이상(본문 텍스트는 S2, 핵심 CTA/에러 메시지는 S1).

**FIX**

- 토큰 값을 조정한다(개별 컴포넌트에서 색을 덮어쓰지 않는다 — §C-TW-03).
- 반투명 배경 위 텍스트는 최악의 배경을 기준으로 계산한다.
- 정보를 색으로만 전달하지 않는다(§C-A11Y-05).

**BAD / GOOD**

```tsx
// ❌ 연한 회색 본문: 흰 배경에서 약 2.8:1
<p className="text-gray-400">이 항목은 재고가 없습니다</p>

// ✅ 토큰 기반 + 대비 충족 (4.5:1 이상)
<p className="text-muted-foreground">이 항목은 재고가 없습니다</p>
/* --muted-foreground 는 배경 대비 4.5:1 이상이 되도록 토큰에서 정의 */
```

**REGRESSION HOOK** — 위 감사 스크립트를 공유 헬퍼로 만들고 라이트/다크 × P0 라우트로 반복 실행한다.

---

### C-A11Y-05 — ARIA 정확성 및 상태 전달

**WHY**
잘못된 ARIA는 **없는 것보다 나쁘다**. `role="button"`을 링크에 붙이면 스크린리더가 링크임을 숨기고, `aria-hidden="true"`를 포커스 가능 요소에 붙이면 "존재하지 않는 요소에 포커스"라는 모순 상태가 된다. 상태 변경(선택/확장/체크/오류)이 ARIA로 전달되지 않으면 스크린리더 사용자는 자신의 조작 결과를 알 수 없다.

**DETECT**

```bash
rg -n "aria-hidden=\"true\"" src -A3 | rg "button|a href|input|tabIndex"   # 모순
rg -n "role=\"" src | rg -o 'role="\w+"' | sort | uniq -c | sort -rn
rg -n "aria-expanded|aria-selected|aria-checked|aria-current|aria-pressed|aria-invalid" src | wc -l
rg -n "aria-live|role=\"alert\"|role=\"status\"" src | wc -l
```

**REPRODUCE**

1. 접근성 트리(DevTools > Accessibility)에서 각 위젯의 role/name/state를 확인한다.
2. 토글/아코디언/탭/체크박스를 조작하며 상태 속성이 실제로 변하는지 확인한다.
3. 동적 메시지(검증 에러, 저장 완료, 검색 결과 수)가 라이브 리전으로 안내되는지 확인한다.

**PASS/FAIL**

- **PASS:** 네이티브 시맨틱 우선, ARIA는 보완만. 상태 속성이 실제 상태와 동기화. 동적 알림이 적절한 라이브 리전(오류 `alert`, 진행 `status`)으로 전달. `aria-hidden` 내부에 포커스 가능 요소 없음.
- **FAIL:** 모순 ARIA, 상태 미반영, 동적 메시지 무통보, 불필요한 role 남용.

**FIX**

- 규칙: **네이티브 요소로 표현 가능하면 ARIA를 쓰지 않는다.**
- 상태는 렌더 값과 같은 소스에서 파생시켜 어긋날 수 없게 만든다.
- 오류는 `role="alert"` + `aria-describedby`로 필드와 연결한다.

**BAD**

```tsx
// ❌ 상태 미반영 + 연결 없음 + 모순
<div role="button" aria-hidden="true" tabIndex={0} onClick={toggle}>메뉴</div>
<button onClick={() => setOpen(!open)}>상세</button>            {/* aria-expanded 없음 */}
<input aria-invalid />                                          {/* 에러 메시지와 연결 없음 */}
<p className="text-destructive">이메일 형식이 올바르지 않습니다</p>
```

**GOOD**

```tsx
// ✅ 상태 동기화 + 연결 + 라이브 리전
<button
  type="button"
  onClick={() => setOpen(o => !o)}
  aria-expanded={open}
  aria-controls="details-panel"
>
  상세 {open ? '접기' : '펼치기'}
</button>
<div id="details-panel" hidden={!open}>…</div>

<input
  id="email" type="email"
  aria-invalid={!!error || undefined}
  aria-describedby={error ? 'email-error' : 'email-hint'}
/>
<p id="email-hint" className="text-xs text-muted-foreground">회사 이메일을 입력해 주세요</p>
{error && <p id="email-error" role="alert" className="text-sm text-destructive">{error}</p>}

// ✅ 결과 수 안내
<p role="status" className="sr-only">{items.length}개 결과를 찾았습니다</p>
```

**REGRESSION HOOK**

```ts
test('토글 상태가 ARIA에 반영된다', async ({ page }) => {
  await page.goto('/items/1');
  const btn = page.getByRole('button', { name: /상세/ });
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
});

test('aria-hidden 내부에 포커스 가능 요소가 없다', async ({ page }) => {
  await page.goto('/');
  const bad = await page.locator('[aria-hidden="true"]')
    .locator('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])').count();
  expect(bad).toBe(0);
});
```

---

### C-A11Y-06 — 모션 및 reduced-motion

**WHY**
과도한 애니메이션(패럴랙스, 자동 재생 캐러셀, 큰 이동)은 전정기관 장애 사용자에게 **어지럼증·구토**를 유발할 수 있다(WCAG 2.3.3). 또한 자동 재생 콘텐츠는 인지 부하를 높이고 배터리를 소모한다. 5초 이상 자동 재생/반복 애니메이션에는 정지 수단이 필요하다(2.2.2).

**DETECT**

```bash
rg -n "prefers-reduced-motion|motion-reduce:" src | wc -l
rg -n "animate-|transition-|autoPlay|loop" src | wc -l
rg -n "autoPlay" src
```

**REPRODUCE**

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto('/');
// 1) 애니메이션이 정지/최소화되는지 계산된 스타일로 확인
// 2) 자동 재생 캐러셀/비디오가 멈추는지 확인
// 3) 정지 컨트롤이 존재하는지 확인
```

**PASS/FAIL**

- **PASS:** `prefers-reduced-motion: reduce`에서 장식 애니메이션이 정지/페이드로 축소되고, 자동 재생이 멈춘다. 5초 이상 반복 애니메이션에 정지 컨트롤이 있다. 기능은 그대로 동작한다.
- **FAIL:** reduced-motion 무시, 정지 불가 자동 재생, 큰 패럴랙스 유지.

**FIX**

- 전역 CSS 정책(§C-SKL-02)을 기본으로 두고, 필수 전환(포커스 표시 등)은 유지한다.
- 자동 재생 캐러셀은 기본 정지 또는 정지 버튼 제공.
- 애니메이션은 **transform/opacity** 위주로(성능 + 흔들림 최소화).

**GOOD**

```tsx
// ✅ 모션 감소 대응 + 정지 컨트롤
const reduce = useReducedMotion();                 // matchMedia 기반 훅
<Carousel autoPlay={!reduce} interval={6000}>
  …
</Carousel>
<button type="button" onClick={() => setPaused(p => !p)} aria-pressed={paused}>
  {paused ? '자동 재생 시작' : '자동 재생 정지'}
</button>
```

**REGRESSION HOOK**

```ts
test('reduced-motion에서 자동 재생이 멈춘다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const first = await page.getByTestId('carousel-index').textContent();
  await page.waitForTimeout(7000);
  expect(await page.getByTestId('carousel-index').textContent()).toBe(first);
});
```

---

### C-A11Y-07 — 자동 검사 도구 통합 (axe)

**WHY**
수동 검사는 깊지만 커버리지가 좁고, 자동 검사는 얕지만 넓다. **둘 다 필요하다.** axe는 WCAG 위반의 약 30~50%를 잡는다 — 나머지는 위 항목들의 수동 절차로 잡는다. 자동 검사를 CI에 넣으면 회귀가 영구 차단된다.

**DETECT / 설치**

```bash
cd e2e && npm i -D @axe-core/playwright
```

**REPRODUCE / 통합**

```ts
// e2e/tests/a11y.spec.ts
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/pricing', '/items', '/dashboard', '/settings'];
const SCHEMES = ['light', 'dark'] as const;

for (const route of ROUTES) {
  for (const scheme of SCHEMES) {
    test(`axe: ${route} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .disableRules([])                    // 규칙 비활성은 사유와 함께만
        .analyze();

      const serious = results.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''));
      expect(serious.map(v => ({ id: v.id, nodes: v.nodes.length, help: v.help }))).toEqual([]);
    });
  }
}
```

모달/드로어 등 **열린 상태**도 반드시 검사한다(닫힌 상태만 검사하면 절반을 놓친다).

```ts
test('axe: 모달 열린 상태', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: '프로필 편집' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''))).toEqual([]);
});
```

**PASS/FAIL**

- **PASS:** critical/serious 위반 0(라이트/다크 × 전 P0 라우트 × 주요 오버레이 상태). moderate/minor는 Finding으로 기록.
- **FAIL:** critical/serious 1건 이상. 또는 사유 없는 규칙 비활성화.

**FIX** — axe가 알려주는 `help`/`helpUrl`을 따르되, **근본 원인**을 고친다(개별 노드 회피 금지).

---

## 23. Playwright 전략

이 절은 Core QA에서 **회귀를 영구 차단**하기 위한 최소 자동화 전략이다. 전체 자동화 워크플로(버그 발견 → 수정 → 테스트 → PASS → 회귀)는 `05_Playwright_QA.md`에서 확대한다.

### 23.1 테스트 피라미드 (무엇을 어디서 테스트하는가)

잘못된 층에 테스트를 쓰면 느리고 불안정하다. 아래 배분을 지킨다.

| 층 | 도구 | 비중 | 무엇을 검증 | 예시 |
|----|------|------|-------------|------|
| 단위 | vitest | 60% | 순수 로직, 포맷터, 스키마, 유틸, 상태 리듀서 | 가격 계산, zod 스키마, `cn()` 병합, reducer 전이 |
| 컴포넌트 | vitest + Testing Library | 25% | 단일 컴포넌트의 상태·접근성·조건부 렌더 | 버튼 pending, 폼 에러 표시, variant 클래스 |
| E2E | Playwright | 15% | **여러 시스템을 통과하는 사용자 여정** | 회원가입 → 결제 → 결과 저장 |

**E2E로 쓰지 말아야 할 것:** 문자열 포맷, 유효성 규칙, 정렬 로직 — 단위 테스트로 100배 빠르게 검증된다.
**E2E로만 검증 가능한 것:** SSR/하이드레이션, 라우팅, 캐시/재검증, 실제 네트워크 실패, 포커스 관리, CLS/LCP.

### 23.2 프로젝트 표준 설정

```ts
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,          // CI에서 test.only 금지 (누락 방지)
  retries: process.env.CI ? 2 : 0,       // 로컬 재시도 0 → 플레이크를 즉시 인지
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',             // 실패 원인 분석의 핵심
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',            // 하이드레이션 결정성 (§C-HYD-01)
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
    { name: 'guest', use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },   // Safari 전용 결함 탐지
  ],
  webServer: process.env.PW_REUSE_SERVER
    ? undefined
    : { command: 'npm run build && npm start', url: BASE, timeout: 180_000, reuseExistingServer: !process.env.CI },
});
```

**중요:** E2E는 **프로덕션 빌드**를 대상으로 실행한다. dev 서버는 Fast Refresh·소스맵·미압축 번들로 인해 하이드레이션·캐시·성능 결함을 숨긴다.

### 23.3 인증 상태 재사용 (속도와 안정성의 핵심)

```ts
// e2e/tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const FILE = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(process.env.E2E_EMAIL!);
  await page.getByLabel('비밀번호').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByRole('button', { name: /계정|프로필/ })).toBeVisible();
  await page.context().storageState({ path: FILE });
});
```

매 테스트에서 UI 로그인을 반복하지 않는다(느리고, 로그인 화면 변경이 전 테스트를 깨뜨린다).

### 23.4 셀렉터 정책 (엄격 준수)

```
1순위  getByRole('button', { name: '저장' })       ← 접근성까지 동시 검증
2순위  getByLabel('이메일') / getByPlaceholder      ← 폼
3순위  getByText('결제 완료')                       ← 사용자에게 보이는 텍스트
4순위  getByTestId('summary-card')                 ← 위 방법이 불가능할 때만
금지   locator('.btn-primary'), locator('div > span:nth-child(3)'), XPath
```

**왜 role 우선인가:** role 셀렉터가 통과하면 그 요소는 보조기술에서도 식별 가능하다는 뜻이다. 즉 테스트가 접근성 회귀까지 막아준다. CSS 클래스 셀렉터는 스타일 변경마다 깨지고 아무것도 보증하지 않는다.

**대기 정책:**

```ts
// ❌ 금지 — 느리고 불안정
await page.waitForTimeout(3000);
await page.waitForSelector('.loaded');

// ✅ 웹 우선 assertion (자동 재시도)
await expect(page.getByRole('list')).toBeVisible();
await expect(page.getByRole('listitem')).toHaveCount(10);
await expect(page).toHaveURL(/\/items\/\d+/);
await page.waitForResponse(r => r.url().includes('/api/items') && r.ok());
```

`waitForTimeout`의 유일한 허용 예외: **"늦게 도착하는 응답이 화면을 덮지 않음"을 증명할 때**(§C-RCT-04). 이 경우 주석으로 사유를 남긴다.

### 23.5 네트워크 제어 (결함 재현의 주력 도구)

```ts
// 실패 주입
await page.route('**/api/items*', r => r.fulfill({ status: 500, json: { error: { code: 'INTERNAL' } } }));
// 지연 주입
await page.route('**/api/items*', async r => { await new Promise(s => setTimeout(s, 3000)); await r.continue(); });
// 스키마 위반
await page.route('**/api/items*', r => r.fulfill({ json: { items: null } }));
// 빈 응답
await page.route('**/api/items*', r => r.fulfill({ json: { items: [] } }));
// 네트워크 단절
await page.route('**/api/**', r => r.abort('failed'));
// 오프라인
await page.context().setOffline(true);
// 느린 네트워크 + 느린 CPU (실사용자 조건)
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8, latency: 150 });
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
```

**원칙:** 목킹은 **경계에서만**(HTTP). 앱 내부 함수를 목킹하면 테스트가 구현에 결합되어 리팩터링마다 깨진다.

### 23.6 공용 픽스처 (콘솔 청결 + 접근성 상시 가드)

```ts
// e2e/tests/fixtures.ts
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Fixtures = { checkA11y: () => Promise<void> };

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    const bad: string[] = [];
    const IGNORE = [/ResizeObserver loop/, /Extension context/];      // 알려진 무해 노이즈만
    page.on('console', m => { if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) bad.push(m.text()); });
    page.on('pageerror', e => bad.push(`pageerror: ${e.message}`));
    await use(page);
    expect(bad, `콘솔 에러 발생:\n${bad.join('\n')}`).toEqual([]);     // 모든 테스트가 콘솔을 감시
  },
  checkA11y: async ({ page }, use) => {
    await use(async () => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
      const serious = r.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''));
      expect(serious.map(v => v.id)).toEqual([]);
    });
  },
});
export { expect };
```

이 픽스처를 도입하면 **모든 E2E 테스트가 자동으로 콘솔 에러 회귀를 차단**한다. 가장 저렴한 고효율 가드다.

### 23.7 결정성 (플레이크 제거)

플레이크는 "테스트 문제"가 아니라 대개 **앱의 경쟁 조건**이다. 재시도로 덮지 않고 원인을 제거한다.

| 플레이크 증상 | 진짜 원인 | 조치 |
|---------------|-----------|------|
| 간헐적 요소 미발견 | 로딩 상태 미표시 / 늦은 하이드레이션 | 앱에 로딩 상태 추가(§15), 웹 우선 assertion |
| 순서에 따라 실패 | 테스트 간 데이터 공유 | 테스트별 고유 데이터(`QA-${Date.now()}`), 격리된 계정 |
| 시간대/날짜 의존 실패 | 비결정적 렌더(§C-HYD-01) | `timezoneId` 고정 + 앱에서 타임존 명시 |
| 애니메이션 중 클릭 실패 | 전환 중 좌표 이동 | `expect(...).toBeVisible()` 후 클릭, 또는 reducedMotion |
| CI에서만 실패 | 리소스 경쟁 / 느린 머신 | worker 조정, 타임아웃 상향은 **최후**, 원인 우선 |

```ts
// 데이터 격리 패턴
const RUN = `QA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
test(`항목 생성 (${RUN})`, async ({ page }) => { /* RUN을 이름에 사용 */ });
test.afterEach(async ({ request }) => { await request.post('/api/test/cleanup', { data: { prefix: RUN } }); });
```

### 23.8 실패 분석 절차 (Agent가 실패를 만났을 때)

```
1. 리포트 확인:  npx playwright show-report
2. 트레이스 열기: npx playwright show-trace test-results/<...>/trace.zip
   → 타임라인 / 네트워크 / 콘솔 / DOM 스냅샷을 순서대로 확인
3. 분류:
   (a) 앱 버그        → §0.1 [4] Root Cause 로 진행 (테스트는 옳다)
   (b) 테스트 버그    → 셀렉터/대기/전제 수정 (앱은 옳다)
   (c) 환경 문제      → BLOCKED 로 보고 (포트/시드/시크릿)
4. 절대 금지: 실패한 assertion을 약화시켜 통과시키기, test.skip 으로 숨기기
5. 재실행:  npx playwright test <file> --project=desktop-chromium --headed --debug
```

`--headed --debug`로 실제 화면을 보는 것이 가장 빠른 진단 경로다. 헤드리스 로그만으로 추측하지 않는다.

---

## 24. Regression Test 절차

수정 후 다른 곳이 깨지지 않았음을 **증명**하는 단계다. 이 단계를 건너뛴 QA는 리스크를 줄이지 않고 이동시킬 뿐이다.

### 24.1 회귀 원칙

1. **모든 S0/S1 수정은 실패하는 테스트를 먼저 남긴다** (red → fix → green). 테스트 없이 고친 결함은 반드시 재발한다.
2. **인접 회귀면**을 함께 검증한다. 수정한 파일의 역참조를 찾아 그 화면들을 모두 확인한다.
3. **수동 확인은 자동 테스트로 승격**한다. 같은 것을 두 번 수동 검증했다면 테스트로 만든다.
4. **회귀 스위트는 빨라야 한다.** 5분을 넘기면 아무도 돌리지 않는다. 느린 테스트는 nightly로 분리한다.

### 24.2 인접 회귀면 산출 (기계적 절차)

```bash
# 1) 수정된 파일 목록
git diff --name-only HEAD

# 2) 각 파일의 역참조 (누가 이 컴포넌트를 쓰는가)
rg -l "from ['\"].*<모듈명>" src

# 3) 그 참조들이 속한 라우트 식별 → Route Inventory(§4.2)에서 해당 행 표시
# 4) 표시된 라우트 전부 + P0 라우트 전부 = 이번 회귀 대상
```

**공통 컴포넌트(Button/Input/Modal/Card)를 수정했다면 회귀 대상은 전 라우트다.** 예외 없다.

### 24.3 회귀 게이트 (순서대로 실행, 실패 시 다음으로 넘어가지 않음)

```bash
# G1. 정적 — 가장 빠른 실패 신호
npm run lint
npx tsc --noEmit

# G2. 단위/컴포넌트
npm test

# G3. 프로덕션 빌드 (라우트 표 + 번들 예산 확인)
npm run build

# G4. E2E 핵심 (수정 영역 + P0 여정)
cd e2e && npx playwright test --project=desktop-chromium

# G5. E2E 확장 (모바일 + 게스트 + webkit)
npx playwright test --project=mobile-chromium --project=guest --project=webkit

# G6. 접근성 + 성능 예산
npx playwright test tests/a11y.spec.ts tests/perf-budget.spec.ts

# G7. 수동 스모크 (자동화 불가 영역만)
#     - 실기기 1대(iOS 또는 Android)에서 P0 여정 1회
#     - 다크 모드 시각 확인
#     - 새 기능의 첫인상 확인
```

각 게이트 결과를 §25 리포트의 표에 기록한다. 게이트를 건너뛰었다면 **BLOCKED + 사유**를 남긴다.

### 24.4 시각 회귀 (선택 — 도입 시 규칙)

```ts
// 안정적인 영역에만 적용. 애니메이션·동적 데이터가 있는 곳은 제외
await expect(page.getByTestId('pricing-table')).toHaveScreenshot('pricing-table.png', {
  maxDiffPixelRatio: 0.01,
  mask: [page.getByTestId('live-counter')],     // 동적 요소는 마스킹
  animations: 'disabled',
});
```

**규칙:** 기준선 갱신(`--update-snapshots`)은 **사람이 diff를 확인한 뒤에만** 한다. 실패했다고 자동 갱신하는 것은 시각 회귀 테스트를 무의미하게 만든다(§P4 freeze list).

### 24.5 회귀 완료 판정

아래를 모두 만족할 때만 "회귀 통과"로 판정한다.

```
[ ] 원래 결함의 재현 절차가 이제 기대 결과를 낸다 (증거: 로그/스크린샷)
[ ] 결함을 재현하던 테스트가 이제 통과한다 (수정 전 실패했음이 확인됨)
[ ] G1~G6 게이트 전부 통과 (또는 BLOCKED 사유 기록)
[ ] 인접 회귀면 라우트에서 새로운 콘솔 에러 0
[ ] 번들/성능 예산 초과 없음 (수정으로 인한 증가 확인)
[ ] 새로 추가한 테스트가 결정적이다 (3회 연속 통과 확인: --repeat-each=3)
```

---

## 25. Final Report

리포트는 **채팅에 출력**한다(§P9). 아래 템플릿을 그대로 채운다. 빈 섹션은 "해당 없음"으로 명시하고 삭제하지 않는다.

### 25.1 리포트 템플릿

````markdown
# Core QA Report — <프로젝트명>

- **일시:** <YYYY-MM-DD HH:mm KST>
- **브랜치 / 커밋:** `<branch>` @ `<short-sha>`
- **모드:** 전체 스윕 | 부분(범위 명시) | 회귀 전용
- **환경:** 프로덕션 빌드(`npm run build && npm start`) | dev
- **총평:** PASS | FAIL | BLOCKED
  (FAIL 1건 이상 → FAIL / FAIL 0 + BLOCKED 1건 이상 → BLOCKED / 그 외 PASS)

## 1. 요약 (3~5문장)
<무엇을 검사했고, 가장 중요한 발견 3가지가 무엇이며, 지금 배포 가능한 상태인지.
수치를 포함한다: "S0 1건, S1 3건, S2 7건. LCP 5.2s → 예산 초과.">

## 2. Project Binding
<§0.3 블록을 실측값으로 채워 붙인다>

## 3. Route Inventory
<§4.2 표. 검사한 라우트 전부. 검사하지 않은 라우트는 사유 명시>

## 4. 검사 결과 매트릭스

| 영역 | 검사 항목 | 판정 | 근거 / 비고 |
|------|-----------|------|-------------|
| App Router | C-APP-01 특수 파일 | FAIL | `/dashboard/[id]` error.tsx 없음 → 흰 화면 재현 |
| App Router | C-APP-02 레이아웃 | PASS | 전환 간 사이드바 상태 유지 확인 |
| React | C-RCT-04 useEffect | FAIL | 경쟁 조건 재현(F-003) |
| … | … | … | … |
| A11y | C-A11Y-07 axe | FAIL | serious 4건 (/items, /settings) |

<※ §6~§22의 모든 검사 항목이 이 표에 나타나야 한다. 미실행은 BLOCKED + 사유>

## 5. Findings (Severity 순)

### F-001 · S0 · 시크릿 클라이언트 노출
- **영역/항목:** Security / C-SEC-01
- **위치:** `src/components/ai-panel.tsx:12`
- **재현:**
  1. `npm run build`
  2. `rg -l "sk_live_" .next/static` → 3개 청크에서 발견
- **증상:** OpenAI 시크릿 키가 클라이언트 번들에 인라인됨
- **원인:** `NEXT_PUBLIC_OPENAI_API_KEY`로 정의되어 번들에 포함. 브라우저에서 직접 API 호출.
- **영향:** 키 탈취 → 무제한 과금, 데이터 접근
- **수정안:** 라우트 핸들러 프록시로 전환(§C-SEC-01 GOOD 예시) + **키 즉시 로테이션**
- **회귀 테스트:** `e2e/tests/secret-leak.spec.ts` (번들 시크릿 패턴 검사)
- **상태:** 미수정 | 수정 완료(커밋 `abc1234`) | 보류(사유)

### F-002 · S1 · …
<동일 구조 반복>

## 6. NOT_REPRODUCED (정적 히트 중 재현 실패)

| 후보 | 위치 | 재현 시도 | 결론 |
|------|------|-----------|------|
| `key={index}` | `list.tsx:44` | 정렬/삽입 후 상태 확인 | 정적 리스트로 순서 불변 → 폐기(S4로 기록) |

## 7. 성능 측정

| 라우트 | LCP | CLS | INP | TTFB | First Load JS | 판정 |
|--------|-----|-----|-----|------|---------------|------|
| `/` | 2.1s | 0.04 | 120ms | 420ms | 148 kB | PASS |
| `/dashboard` | 5.2s | 0.18 | 310ms | 1.9s | 412 kB | FAIL |

측정 조건: 프로덕션 빌드, 4x CPU throttle, 1.6Mbps/150ms latency, 3회 중위값

## 8. 접근성 요약

| 라우트 | axe critical | axe serious | 키보드 완주 | 대비 위반 |
|--------|--------------|-------------|-------------|-----------|
| `/` | 0 | 0 | PASS | 0 |
| `/settings` | 0 | 3 | FAIL(모달 트랩 없음) | 2 |

## 9. 회귀 게이트 결과

| 게이트 | 명령 | 결과 | 비고 |
|--------|------|------|------|
| G1 lint | `npm run lint` | PASS | |
| G1 tsc | `npx tsc --noEmit` | FAIL | 3 errors (F-007) |
| G2 unit | `npm test` | PASS | 142 passed |
| G3 build | `npm run build` | PASS | 경고 2건 |
| G4 e2e | `playwright test --project=desktop-chromium` | FAIL | 2 failed (F-003, F-005) |
| G5 e2e 확장 | mobile/guest/webkit | BLOCKED | webkit 미설치 |
| G6 a11y/perf | a11y.spec / perf-budget.spec | FAIL | serious 4건, 예산 1건 초과 |
| G7 수동 | 실기기 스모크 | PASS | iPhone 13, Safari 17 |

## 10. 추가된/수정된 테스트

| 파일 | 커버 대상 Finding | 종류 |
|------|-------------------|------|
| `e2e/tests/secret-leak.spec.ts` | F-001 | E2E/정적 |
| `e2e/tests/race-condition.spec.ts` | F-003 | E2E |
| `src/lib/__tests__/http.test.ts` | F-004 | 단위 |

## 11. 다음 액션 (우선순위 순)

1. **[S0] F-001** 시크릿 프록시 전환 + 키 로테이션 — 배포 차단 사유
2. **[S1] F-003** 경쟁 조건 수정 (AbortController) — 데이터 오표시
3. **[S1] F-005** 모달 포커스 트랩 — 접근성 차단
4. **[S2] F-008** `/dashboard` 번들 412kB → 서버 컴포넌트 전환
5. **[운영] webkit 설치**로 G5 BLOCKED 해제

## 12. 배포 판정

- **배포 가능:** 아니오 (S0 1건, S1 3건)
- **차단 사유:** F-001 (시크릿 노출)
- **최소 조건:** F-001, F-003, F-005 수정 + G1/G4/G6 재실행 PASS
````

### 25.2 리포트 작성 규칙

1. **모든 검사 항목이 표에 나타난다.** 실행하지 않았다면 BLOCKED + 사유. 조용한 누락 금지(§P8).
2. **Finding에는 재현 절차가 반드시 있다.** 3자가 그대로 따라 할 수 있어야 한다.
3. **원인과 증상을 구분한다.** "버튼이 안 눌린다"는 증상, "hydration mismatch로 핸들러 미부착"이 원인이다.
4. **수치를 붙인다.** "느리다" 금지, "LCP 5.2s(예산 2.5s)" 사용(§P7).
5. **수정하지 않은 것을 수정했다고 쓰지 않는다.** 상태 필드를 정확히 유지한다.
6. **배포 판정을 명시한다.** QA의 최종 산출물은 "지금 내보낼 수 있는가"에 대한 답이다.
7. **리포트 파일을 리포지토리에 상주시키지 않는다**(§P9). 산출물은 `tmp/qa/<날짜>/`, 커밋하지 않는다.

---

## Appendix A. 명령어 치트시트

프로젝트에 맞게 §0.3에서 확정한 명령으로 치환해 사용한다. 각 명령에 **기대 결과**를 함께 적는다.

```bash
# ── 정적 게이트 ──────────────────────────────────────────
npm run lint                  # 기대: exit 0, 경고 0
npx tsc --noEmit              # 기대: exit 0, "Found 0 errors"
npm test                      # 기대: exit 0, 모든 테스트 통과
npm run build                 # 기대: exit 0 + 라우트 표 출력(캡처 필수)

# ── 런타임 기동 (E2E/성능은 반드시 프로덕션 빌드) ─────────
npm run build && npm start    # 기대: http://localhost:3000 응답 200

# ── E2E ──────────────────────────────────────────────────
cd e2e && npx playwright install --with-deps     # 최초 1회
npx playwright test                              # 전체
npx playwright test tests/critical-flows.spec.ts --project=desktop-chromium
npx playwright test --headed --debug             # 디버깅
npx playwright test --repeat-each=3              # 결정성 확인
npx playwright show-report
npx playwright show-trace test-results/<dir>/trace.zip

# ── 성능 ─────────────────────────────────────────────────
npx lighthouse http://localhost:3000/ --preset=mobile \
  --output=html --output-path=./tmp/qa/lh-home.html    # 기대: Perf ≥ 90

# ── 보안 스캔 ────────────────────────────────────────────
npm audit --omit=dev --audit-level=high          # 기대: 0 high/critical
rg -l "sk_live_|SERVICE_ROLE|PRIVATE KEY" .next/static   # 기대: 출력 없음
curl -sI http://localhost:3000/ | rg -i "content-security-policy|x-content-type|referrer-policy"

# ── 라우트/HTML 검증 ─────────────────────────────────────
curl -s localhost:3000/ | rg -o "<title>.*</title>"
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml | rg -c "<loc>"
curl -sI localhost:3000/dashboard | rg -i "cache-control"   # 기대: private/no-store

# ── 위험 신호 정적 스캔 (§5.1 전체 목록) ─────────────────
rg -n "dangerouslySetInnerHTML" src
rg -n "key=\{(i|idx|index)\}" src
rg -n "\[#[0-9a-fA-F]{3,8}\]" src
rg -n "outline-none" src
rg -n "suppressHydrationWarning|@ts-ignore|as any" src
rg -n "z-\[?[0-9]{3,}" src
```

---

## Appendix B. 재현 불가(Not Reproducible) 처리 규약

정적 스캔 히트가 재현되지 않을 때, Agent는 아래 규약을 따른다. **임의로 수정하거나 조용히 버리지 않는다.**

```
1. 재현 시도를 최소 2가지 경로로 수행한다 (UI 조작 + 자동 스크립트/네트워크 주입)
2. 실패하면 아래 중 하나로 분류한다:

   (a) 조건부 결함  — 특정 조건에서만 발생 가능 (특정 데이터/권한/기기)
       → Finding으로 등록, Severity 유지, "재현 조건 미확보" 명시
       → 재현 조건을 확보할 방법을 제안 (시드 데이터, 계정, 기기)

   (b) 무해 패턴   — 해당 문맥에서는 안전 (예: 절대 변하지 않는 정적 리스트의 index key)
       → S4로 강등 + 안전 근거를 코드 주석 1줄로 남기는 것을 제안 (선택)
       → 리포트 §6 NOT_REPRODUCED 표에 기록

   (c) 이미 방어됨 — 상위 계층에서 처리됨 (예: 서버가 이미 검증)
       → 폐기하되 §6 표에 방어 지점을 명시 (다음 QA에서 중복 조사 방지)

   (d) 도구 한계   — 재현에 필요한 환경 없음 (실기기, 프로덕션 데이터, 외부 결제)
       → BLOCKED로 등록 + 필요한 것을 구체적으로 요청

3. 어떤 경우에도 §6 NOT_REPRODUCED 표에서 항목을 삭제하지 않는다
   (다음 QA 세션이 같은 조사를 반복하는 것을 막는다)
```

**금지 사항:** 재현되지 않은 히트를 "예방적으로" 수정하는 것. 검증되지 않은 변경은 새 결함의 원천이며, 회귀 테스트로 보호되지 않는다.

---

## Appendix C. 문서 간 연계 맵

이 문서(Core)는 각 축의 **최소 통과 기준**을 정의한다. 아래 상황에서 위성 문서로 확대한다.

| 상황 | 확대 문서 | Core에서 이미 다룬 범위 |
|------|-----------|------------------------|
| 모바일 특화 결함(safe area, 가상 키보드, 폴드, 바텀시트, thumb zone) | `02_Mobile_QA.md` | §C-TW-04 반응형, §C-API-06 오프라인 |
| 데스크톱 특화(윈도우 스케일링, 브라우저 줌, hover, 메가 메뉴, 와이드 스크린) | `03_Desktop_QA.md` | §C-TW-04 브레이크포인트 |
| 픽셀 단위 시각 품질(간격 리듬, 정렬, 타이포 계층, 시각 무게) | `04_Visual_QA.md` | §C-TW-03 토큰, §C-SKL-01 레이아웃 일치 |
| 자동화 워크플로 전체(버그→수정→테스트→PASS→회귀 루프) | `05_Playwright_QA.md` | §23 전략, §24 회귀 게이트 |
| 퍼널·전환·인지 부하·UX 라이팅·온보딩 | `06_UX_Audit.md` | §C-LOD-03 빈 상태, §C-ERR-02 복구 문구 |
| 컴포넌트별 계약(Button/Input/Modal/Toast…)·토큰·다크 모드 | `07_Design_System_QA.md` | §C-TW-02 병합, §C-TW-06 다크 모드 |
| 상세 성능 최적화(번들 분석, 렌더 프로파일링, 메모리) | `08_Performance_QA.md` | §20 예산과 기준선 |
| WCAG 2.2 전 조항, 스크린리더 시나리오, 색맹 | `09_Accessibility_QA.md` | §22 필수 항목 |

**충돌 시 우선순위:** Core(§2 절대 원칙) > 위성 문서의 세부 기준 > 개인 취향.

---

## 부록 D. Agent 실행 체크리스트 (복사해서 진행 상황 추적)

```
Core QA · <프로젝트> · <날짜>
[ ] 0  Project Binding Block 실측 작성 (§0.3)
[ ] 1  Phase 0 Repository Discovery → Stack Fact Sheet (§3)
[ ] 2  Phase 1 Route Discovery → Route Inventory + 라우트별 6개 스모크 (§4)
[ ] 3  Phase 2 Component Discovery → Component Inventory + 위험 스캔 (§5)
[ ] 4  App Router C-APP-01~08 (§6)
[ ] 5  React C-RCT-01~08 (§7)
[ ] 6  Tailwind C-TW-01~06 (§8)
[ ] 7  State C-STA-01~05 (§9)
[ ] 8  Server Components C-RSC-01~05 (§10)
[ ] 9  Client Components C-CLI-01~05 (§11)
[ ] 10 Suspense C-SUS-01~04 (§12)
[ ] 11 Error Boundary C-ERR-01~04 (§13)
[ ] 12 Hydration C-HYD-01~05 (§14)
[ ] 13 Loading C-LOD-01~03 (§15)
[ ] 14 Skeleton C-SKL-01~03 (§16)
[ ] 15 API C-API-01~06 (§17)
[ ] 16 Cache C-CCH-01~05 (§18)
[ ] 17 Security C-SEC-01~08 (§19)
[ ] 18 Performance C-PRF-01~07 (§20)
[ ] 19 SEO C-SEO-01~06 (§21)
[ ] 20 Accessibility C-A11Y-01~07 (§22)
[ ] 21 회귀 테스트 작성/보강 (§23, §24.1)
[ ] 22 회귀 게이트 G1~G7 실행 (§24.3)
[ ] 23 Final Report 작성 + 배포 판정 (§25)
```

**마지막 확인:** 리포트를 내기 전에 §2 절대 원칙 10개를 다시 읽고, 위반한 것이 없는지 확인한다. 특히 P1(재현 없는 수정), P2(증상 은폐), P5(보고 우선), P7(측정 없는 주장), P9(리포트 파일 상주 금지).

