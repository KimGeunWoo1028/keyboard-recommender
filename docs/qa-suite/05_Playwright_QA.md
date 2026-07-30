# 05_Playwright_QA.md — Cursor QA Master Suite · Playwright Automation Playbook

> **문서 등급:** ★★★★★ · E2E 테스트 아키텍처 설계와 운영 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · TypeScript · Playwright 1.4x+
> **검사 대상:** 제품 코드가 아니라 **테스트 코드와 테스트 인프라**
> **핵심 전제:** 신뢰할 수 없는 테스트는 없는 것보다 나쁘다. 팀이 실패를 무시하기 시작하면 스위트 전체가 죽는다.
> **독립성:** 이 문서는 `01_Core_QA.md` 없이도 단독으로 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 실행하는 명령형 매뉴얼.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding과 스위트 인벤토리](#3-project-binding과-스위트-인벤토리)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [테스트 아키텍처](#5-테스트-아키텍처)
6. [Configuration](#6-configuration)
7. [셀렉터 전략](#7-셀렉터-전략)
8. [대기 전략](#8-대기-전략)
9. [Fixture와 테스트 격리](#9-fixture와-테스트-격리)
10. [인증과 세션](#10-인증과-세션)
11. [테스트 데이터 관리](#11-테스트-데이터-관리)
12. [네트워크 제어](#12-네트워크-제어)
13. [Page Object와 추상화](#13-page-object와-추상화)
14. [어설션 전략](#14-어설션-전략)
15. [Flaky 진단과 제거](#15-flaky-진단과-제거)
16. [병렬성과 워커](#16-병렬성과-워커)
17. [디버깅과 트레이스](#17-디버깅과-트레이스)
18. [CI 통합과 샤딩](#18-ci-통합과-샤딩)
19. [리포팅과 관측](#19-리포팅과-관측)
20. [특수 시나리오](#20-특수-시나리오)
21. [Component Test와 API Test](#21-component-test와-api-test)
22. [스위트 유지보수](#22-스위트-유지보수)
23. [Regression 절차](#23-regression-절차)
24. [Final Report](#24-final-report)
25. [부록 A — 실행 명령](#부록-a--실행-명령)
26. [부록 B — Agent 체크리스트](#부록-b--agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

이 문서의 검사 대상은 제품이 아니라 **테스트 스위트 자체**다. 다른 QA 문서가 "제품에 결함이 있는가"를 묻는다면, 이 문서는 "그 결함을 잡아낼 수 있는 스위트인가, 그리고 그 스위트를 신뢰할 수 있는가"를 묻는다.

두 가지가 동시에 성립해야 한다.

1. **신뢰성** — 실패하면 실제로 문제가 있고, 통과하면 실제로 괜찮다. 거짓 양성(flaky)과 거짓 음성(무의미한 어설션)이 모두 없어야 한다.
2. **경제성** — 실행 시간, 유지보수 비용, 디버깅 시간이 스위트가 주는 가치보다 작아야 한다. 30분 걸리는 스위트는 아무도 로컬에서 돌리지 않는다.

신뢰성이 무너지면 팀은 실패를 무시하기 시작하고, 그 순간 스위트는 CI 시간만 소모하는 장식이 된다. 경제성이 무너지면 스위트는 방치되다가 삭제된다. 둘 중 하나라도 잃으면 결과는 같다.

### 1.1 동시에 수행할 역할

- **Test Architect:** 무엇을 E2E로, 무엇을 통합/단위/API 테스트로 할지 결정한다. E2E는 가장 비싼 도구이므로 아껴 쓴다.
- **Playwright Automation Engineer:** 자동 대기, 셀렉터, 픽스처, 병렬성을 프레임워크가 의도한 방식대로 사용한다. `waitForTimeout`으로 문제를 덮지 않는다.
- **Reliability Engineer:** flaky를 통계로 추적하고 원인별로 분류해 제거한다. `retries`를 늘려 숨기지 않는다.
- **Performance Engineer (CI):** 실행 시간을 예산 안에 유지한다. 샤딩, 병렬화, 불필요한 대기 제거로 대응한다.
- **QA Lead:** 커버리지 공백과 중복을 판단한다. 테스트 수가 아니라 **잡아낸 회귀 건수**로 스위트를 평가한다.

### 1.2 완료 조건

```text
[ ] 테스트 피라미드에서 E2E의 역할과 범위를 정의했다.
[ ] 전 스위트를 3회 반복 실행해 flaky 0을 확인했다.
[ ] 하드 대기(waitForTimeout)가 0건이거나 전부 사유가 있다.
[ ] 셀렉터가 역할/라벨 기반이며 CSS 구조 의존이 없다.
[ ] 테스트 간 상태 누수가 없다(임의 순서 실행에서 통과).
[ ] 인증이 storageState로 재사용되며 테스트마다 로그인하지 않는다.
[ ] 테스트 데이터가 격리되어 병렬 실행에서 충돌하지 않는다.
[ ] 조건부 분기(if)로 어설션을 건너뛰는 테스트가 없다.
[ ] 실패 시 트레이스로 원인을 5분 안에 특정할 수 있다.
[ ] CI 실행 시간이 예산 안에 있다.
[ ] P0 사용자 여정이 전부 커버된다.
[ ] 스위트가 최근 실제 회귀를 잡아낸 이력이 있다.
[ ] Regression Gate 전체를 실행하고 Final Report를 작성했다.
```

측정할 수 없는 항목은 `BLOCKED`로 기록한다. 특히 flaky 판정은 반드시 반복 실행 데이터로 하고, "체감상 안정적"으로 대체하지 않는다.

---

## 2. 절대 원칙

우선순위 순서이며, 충돌 시 번호가 작은 쪽이 이긴다.

### P-P1. 신뢰성이 커버리지보다 우선한다

flaky 테스트 100개보다 안정적인 테스트 20개가 낫다. 불안정한 테스트는 실제 회귀를 숨기고, 팀이 CI 실패를 무시하는 습관을 만든다. 커버리지를 늘리기 전에 기존 스위트의 flaky를 0으로 만든다.

### P-P2. 하드 대기를 쓰지 않는다

`page.waitForTimeout(2000)`은 (a) 느린 환경에서 여전히 실패하고, (b) 빠른 환경에서 시간을 낭비한다. Playwright의 자동 대기와 웹 우선 어설션이 이미 올바른 대기를 제공한다. 하드 대기가 필요하다고 느끼면 대기 조건을 잘못 표현한 것이다.

### P-P3. 사용자가 보는 것으로 요소를 찾는다

`page.locator('.css-1a2b3c > div:nth-child(3)')`는 CSS 한 줄만 바뀌어도 깨진다. `getByRole('button', { name: '저장' })`은 사용자가 인지하는 방식과 같고, 동시에 접근성을 검증한다. 셀렉터 선택은 테스트 안정성의 절반이다.

### P-P4. 테스트는 서로를 모른다

테스트 A가 만든 데이터에 테스트 B가 의존하면, 병렬 실행에서 깨지고 단독 실행에서도 깨진다. 각 테스트는 자기가 필요한 상태를 스스로 만들고 스스로 정리한다. `--shuffle`로 실행해도 통과해야 한다.

### P-P5. `retries`로 flaky를 숨기지 않는다

재시도는 통제 불가능한 외부 요인(네트워크 순단)에 대한 보험이지 결함 은폐 수단이 아니다. CI `retries: 1`을 상한으로 두고, 재시도로 통과한 테스트는 flaky로 기록해 원인을 추적한다.

### P-P6. 조건부 어설션은 어설션이 아니다

```ts
if (await el.isVisible()) { await expect(el).toHaveText('완료'); }
```
이 코드는 요소가 없으면 조용히 통과한다. 아무것도 검증하지 않는 테스트가 초록불을 켜는 것이 가장 위험하다.

### P-P7. E2E는 가장 비싼 도구다

로그인 폼 검증 로직 12가지를 E2E로 테스트하면 6분이 걸리지만, 단위 테스트로는 200ms다. E2E는 **여러 계층이 실제로 연결되는지**를 확인하는 용도로만 쓴다. 세부 분기는 아래 계층으로 내린다.

### P-P8. 실패 메시지가 원인을 말해야 한다

`expect(received).toBe(expected)`만 나오는 실패는 디버깅에 30분이 걸린다. 커스텀 메시지, 트레이스, 스크린샷을 갖추면 5분이면 된다. 실패 진단 시간도 스위트의 비용이다.

### P-P9. 프로덕션 빌드로 검증한다

개발 서버는 소스맵, HMR, 다른 번들링, 다른 에러 오버레이를 갖는다. 개발 모드에서만 통과하거나 실패하는 현상이 발생한다. E2E는 `next build && next start`로 실행한다.

### P-P10. 테스트 코드도 코드다

중복된 로그인 코드 40개, 500줄짜리 spec 파일, 의미 없는 이름은 제품 코드에서와 똑같이 부채다. 타입 검사와 린트를 테스트 코드에도 적용한다.

### P-P11. 리포트는 채팅에 남기고 산출물은 커밋하지 않는다

QA 리포트 파일을 저장소에 만들지 않는다. 트레이스·비디오·리포트는 `tmp/qa/e2e/<날짜>/` 또는 CI 아티팩트에 두고 커밋하지 않는다. `storageState` 파일과 `.env.test`도 커밋 금지다.

### P-P12. Freeze List를 존중한다

시각 기준선 스냅샷, 생성물, 좌표·기하 데이터, 프로젝트 룰이 잠근 파일은 QA 중 임의로 수정하지 않는다.

---

## 3. Project Binding과 스위트 인벤토리

QA 시작 전 아래 블록을 실측으로 채운다.

```yaml
playwright_qa_binding:
  app_root:
  package_manager:
  build_command:
  production_command:
  base_url:

  playwright_version:
  config_path:
  test_dir:
  projects: []                # 프로젝트명 + 브라우저 + 뷰포트

  suite_stats:
    spec_files:
    test_cases:
    avg_duration_local:
    avg_duration_ci:
    flaky_rate:               # 3회 반복 실행 기준

  auth:
    strategy:                 # storageState / API 로그인 / UI 로그인
    roles: []                 # admin, member, viewer, guest
    setup_project:            # 있음/없음

  test_data:
    strategy:                 # 시드 DB / API 생성 / 모킹 / 하이브리드
    isolation:                # 워커별 / 테스트별 / 공유
    cleanup:                  # afterEach / afterAll / 없음

  network:
    mocking:                  # page.route / MSW / 실 API
    third_party_blocked: []

  ci:
    provider:
    shards:
    workers:
    time_budget:
    artifact_retention:

  external_deps: []           # 결제, 이메일, OAuth, SMS

  freeze_list: []
```

### 3.1 Repository Discovery

```bash
cat package.json
cat playwright.config.*
pnpm playwright --version

# 스위트 규모
fd -e spec.ts -e spec.tsx . tests e2e 2>/dev/null | wc -l
rg -c "^\s*test\(" tests e2e 2>/dev/null | awk -F: '{s+=$2} END {print s" test cases"}'
rg -c "test\.describe\(" tests e2e 2>/dev/null | awk -F: '{s+=$2} END {print s" describes"}'

# 안티패턴 스캔
rg -n "waitForTimeout" tests e2e 2>/dev/null | wc -l
rg -n "page\.locator\(['\"]\." tests e2e 2>/dev/null | wc -l        # CSS 클래스 셀렉터
rg -n "nth-child|nth-of-type|>\s*div" tests e2e 2>/dev/null
rg -n "test\.only|\.only\(" tests e2e 2>/dev/null
rg -n "test\.skip|test\.fixme" tests e2e 2>/dev/null
rg -n "if\s*\(await" tests e2e 2>/dev/null                          # 조건부 어설션
rg -n "try\s*\{" tests e2e 2>/dev/null                              # 예외 삼키기

# 대기 방식
rg -n "waitForSelector|waitForLoadState|waitForURL|waitForResponse" tests e2e 2>/dev/null | wc -l
rg -n "networkidle" tests e2e 2>/dev/null

# 인증
rg -n "storageState|globalSetup|setup\b" playwright.config.* tests e2e 2>/dev/null
rg -n "fill.*password|getByLabel\('비밀번호'\)" tests e2e 2>/dev/null | wc -l

# 데이터
rg -n "page\.route|MSW|setupServer" tests e2e 2>/dev/null | wc -l
rg -n "faker|randomUUID|Date\.now\(\)" tests e2e 2>/dev/null

# 설정 위험 신호
rg -n "retries:|workers:|timeout:|fullyParallel" playwright.config.*
```

각 히트는 조사 후보다. 실제로 신뢰성이나 유지보수를 해치는 것만 Finding으로 확정한다.

### 3.2 Suite Inventory

```markdown
| Spec 파일 | 테스트 수 | 평균 시간 | 커버 여정 | 인증 | 데이터 | flaky | 비고 |
|-----------|-----------|-----------|-----------|------|--------|-------|------|
| `auth.spec.ts` | 8 | 42s | 로그인/가입/재설정 | 없음 | 고정 | 0 | |
| `checkout.spec.ts` | 6 | 3m 10s | 결제 전체 | admin | API 생성 | 2건 | 외부 결제 의존 |
| `members.spec.ts` | 14 | 1m 20s | 멤버 CRUD | admin | 워커별 | 0 | |
```

우선 조사 대상:

1. flaky 이력이 있는 spec
2. 실행 시간이 전체의 20%를 넘는 spec
3. 외부 의존이 있는 spec
4. `skip`/`fixme`가 있는 spec
5. 최근 6개월간 한 번도 실패한 적 없는 spec (가치 재평가)

---

## 4. 실행 파이프라인과 Severity

```text
1. DISCOVER
   스위트 규모, 설정, 안티패턴, 실행 시간을 측정한다.

2. BASELINE RUN
   프로덕션 빌드로 전 스위트를 실행하고 시간과 결과를 기록한다.

3. RELIABILITY GATE
   --repeat-each=3 으로 flaky를 측정한다.
   ★ flaky가 있으면 커버리지 작업보다 우선 처리한다.

4. ISOLATION CHECK
   --shuffle 과 단일 테스트 실행으로 상태 누수를 검증한다.

5. STATIC AUDIT
   셀렉터, 대기, 어설션, 조건부 분기, 중복을 정적 분석한다.

6. ARCHITECTURE REVIEW
   E2E로 하지 말아야 할 것이 E2E에 있는지 판단한다.

7. COVERAGE REVIEW
   P0 사용자 여정 대비 공백을 식별한다.

8. ROOT CAUSE
   각 문제의 원인을 파일:라인으로 지목한다.

9. FIX
   최소 변경으로 원인을 제거한다. retries 상향과 하드 대기 추가를 금지한다.

10. VERIFY
    수정 후 --repeat-each=5 로 재검증한다.

11. PERFORMANCE
    실행 시간을 예산 안으로 최적화한다.

12. REGRESSION
    Gate 전체를 실행한다.

13. REPORT
    신뢰성 지표, 결함 목록, 아키텍처 권고를 보고한다.
```

### 4.1 Severity 기준 (테스트 스위트)

| 등급 | 기준 |
|------|------|
| **S0 Blocker** | 스위트가 실행되지 않음, CI가 항상 실패 또는 항상 통과(검증 무효), 프로덕션 DB를 건드림 |
| **S1 Critical** | flaky율 10% 이상, 조건부 어설션으로 검증이 무효, P0 여정 미커버, 테스트 간 상태 누수로 순서 의존 |
| **S2 Major** | 하드 대기 다수, CSS 구조 셀렉터 의존, 인증을 매 테스트 UI로 수행, CI 시간 예산 초과, 실패 원인 추적 불가 |
| **S3 Minor** | 중복 코드, 네이밍 불명확, POM 과잉/부족, 리포터 미설정, 불필요한 대기 |
| **S4 Nit** | 스타일 일관성, 주석 |

**상향 규칙:** 문제가 결제·인증·데이터 삭제 경로의 테스트에 있거나, 스위트 전반에 퍼져 있으면 한 단계 올린다.

**하향 금지:** "원래 그랬다"는 이유로 등급을 낮추지 않는다.

---

## 5. 테스트 아키텍처

### 5.1 E2E의 역할 정의

E2E는 **여러 계층이 실제로 연결되는지** 확인하는 도구다. 브라우저, 네트워크, 서버, DB가 함께 동작하는 경로를 검증한다. 이 정의에서 벗어나는 것은 아래 계층으로 내려야 한다.

| 검증 대상 | 적합한 계층 | 이유 |
|-----------|-------------|------|
| 이메일 형식 검증 12가지 | 단위 테스트 | 순수 함수, 브라우저 불필요 |
| 폼 상태 전이 | 컴포넌트 테스트 | React 렌더링만 필요 |
| API 응답 스키마 | API 테스트 | 브라우저 불필요 |
| 권한별 응답 코드 | API 테스트 | 빠르고 조합이 많음 |
| 로그인 → 대시보드 → 로그아웃 | **E2E** | 세션·라우팅·서버가 연결됨 |
| 결제 전체 플로우 | **E2E** | 외부 연동 포함 |
| 파일 업로드 → 처리 → 다운로드 | **E2E** | 브라우저 API 필요 |
| 시각 회귀 | **E2E (시각)** | 실제 렌더 필요 |

### P-ARCH-01 — 테스트 피라미드 배분

**WHY**
E2E가 전체 테스트의 대부분을 차지하면 실행 시간이 폭발하고 디버깅이 어려워진다. 반대로 E2E가 거의 없으면 계층 간 통합 결함(잘못된 API 경로, 세션 만료, 라우팅 오류)을 놓친다. 배분이 잘못된 스위트는 비용은 높고 신뢰는 낮다.

**DETECT**

```bash
# 각 계층 테스트 수
rg -c "^\s*(test|it)\(" tests/unit src/**/*.test.ts 2>/dev/null | awk -F: '{s+=$2} END {print "unit: "s}'
rg -c "^\s*test\(" tests/e2e 2>/dev/null | awk -F: '{s+=$2} END {print "e2e: "s}'
rg -c "^\s*test\(" tests/api 2>/dev/null | awk -F: '{s+=$2} END {print "api: "s}'

# E2E 안에서 단위 테스트급 검증을 하는 곳 찾기
rg -n "toHaveValue|toBeInvalid|validation|검증 메시지" tests/e2e | head -20
rg -B3 -A3 "invalid|형식이 올바르지" tests/e2e | head -40
```

**진단**

E2E spec 하나를 열어 아래를 세어본다.

```text
- 이 테스트가 브라우저 없이 검증 가능한가?
- 서버 왕복 없이 검증 가능한가?
- 같은 로직을 다른 입력으로 반복 검증하는가? (파라미터화된 단위 테스트 후보)
```

셋 중 하나라도 "예"면 계층을 잘못 골랐을 가능성이 높다.

**PASS / FAIL**

- PASS: E2E가 사용자 여정 중심이고, 세부 분기·검증 로직은 아래 계층에 있다. E2E 테스트 수가 전체의 10~20% 범위다.
- FAIL: E2E가 세부 검증을 담당(S2 — 시간 낭비), E2E가 거의 없어 통합 결함 미탐지(S1).

**FIX**

**BAD**

```ts
// ❌ 이메일 검증 12케이스를 E2E로 — 6분 소요, 브라우저 불필요
const INVALID_EMAILS = ['a', 'a@', '@b.com', 'a b@c.com', /* … 8개 더 */];

for (const email of INVALID_EMAILS) {
  test(`잘못된 이메일 거부: ${email}`, async ({ page }) => {
    await page.goto('/auth/signup');
    await page.getByLabel('이메일').fill(email);
    await page.getByRole('button', { name: '가입' }).click();
    await expect(page.getByRole('alert')).toContainText('이메일 형식');
  });
}
```

**GOOD**

```ts
// ✅ 검증 로직은 단위 테스트로 — 12케이스 200ms
// src/lib/validation.test.ts
import { emailSchema } from './validation';

describe('emailSchema', () => {
  it.each(['a', 'a@', '@b.com', 'a b@c.com'])('거부: %s', (email) => {
    expect(emailSchema.safeParse(email).success).toBe(false);
  });

  it.each(['a@b.com', 'user.name+tag@sub.example.co.kr'])('허용: %s', (email) => {
    expect(emailSchema.safeParse(email).success).toBe(true);
  });
});
```

```ts
// ✅ E2E는 "검증이 UI에 연결되어 있는가"만 확인 — 대표 1케이스
test('잘못된 이메일 입력 시 폼이 제출되지 않고 오류가 표시된다', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.getByLabel('이메일').fill('invalid');
  await page.getByRole('button', { name: '가입' }).click();

  await expect(page.getByRole('alert')).toContainText('이메일 형식');
  await expect(page).toHaveURL(/\/auth\/signup/);   // 제출되지 않았다
});
```

12개 테스트가 1개로 줄고, 검증 로직 커버리지는 오히려 늘어난다.

**REGRESSION**

```bash
# E2E에 세부 검증이 다시 들어오는지 감시
rg -c "^\s*test\(" tests/e2e | awk -F: '{s+=$2} END {if (s > 60) print "E2E 테스트 수 초과: "s}'
```

---

### P-ARCH-02 — 사용자 여정 커버리지

**WHY**
테스트 수가 많아도 핵심 여정이 빠져 있으면 의미가 없다. 반대로 잘 쓰이지 않는 화면에 테스트가 몰려 있으면 비용만 든다. 커버리지는 코드 라인이 아니라 **사용자 여정** 단위로 판단해야 한다.

**DETECT**

```bash
# 커버되는 라우트 추출
rg -o "goto\(['\"]([^'\"]+)" tests/e2e -r '$1' | sort | uniq -c | sort -rn

# 제품의 전체 라우트
fd "page.tsx" src/app app | sed 's|.*/app||; s|/page.tsx||' | sort

# 두 목록을 비교해 미커버 라우트를 찾는다
```

**진단**

P0 여정을 정의하고 커버 여부를 표로 만든다.

```markdown
| 여정 | 단계 | 커버 | Spec | 비고 |
|------|------|------|------|------|
| 신규 가입 | 랜딩 → 가입 → 이메일 인증 → 온보딩 → 대시보드 | 부분 | `auth.spec.ts` | 이메일 인증 미커버 |
| 결제 | 요금제 → 카드 등록 → 결제 → 영수증 | 커버 | `checkout.spec.ts` | |
| 멤버 초대 | 설정 → 초대 → 수락 → 권한 확인 | 미커버 | — | **공백** |
| 데이터 삭제 | 목록 → 선택 → 확인 → 삭제 → 복구 불가 안내 | 부분 | `members.spec.ts` | 복구 안내 미검증 |
```

**PASS / FAIL**

- PASS: P0 여정이 전부 커버되고, 각 여정의 성공 경로와 최소 1개 실패 경로가 있다.
- FAIL: P0 여정 미커버(S1), 실패 경로 전무(S2 — 오류 처리 회귀를 못 잡음).

**FIX**

여정 기반으로 spec을 조직한다. 화면 단위가 아니라 **사용자가 달성하려는 목표** 단위다.

```ts
// ✅ tests/e2e/journeys/member-invitation.spec.ts
test.describe('멤버 초대 여정', () => {
  test('관리자가 멤버를 초대하고 초대받은 사용자가 수락한다', async ({ browser }) => {
    // 1. 관리자가 초대
    const adminContext = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/settings/members');
    await adminPage.getByRole('button', { name: '멤버 초대' }).click();

    const email = `invitee-${Date.now()}@example.test`;
    await adminPage.getByLabel('이메일').fill(email);
    await adminPage.getByLabel('권한').selectOption('member');
    await adminPage.getByRole('button', { name: '초대 보내기' }).click();
    await expect(adminPage.getByRole('status')).toContainText('초대를 보냈습니다');

    // 2. 초대 링크 획득 (테스트 전용 API)
    const invite = await getInviteToken(email);

    // 3. 초대받은 사용자가 수락
    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();
    await inviteePage.goto(`/invite/${invite.token}`);
    await inviteePage.getByLabel('이름').fill('초대된 사용자');
    await inviteePage.getByLabel('비밀번호').fill('Test1234!@');
    await inviteePage.getByRole('button', { name: '가입 완료' }).click();
    await expect(inviteePage).toHaveURL(/\/dashboard/);

    // 4. 관리자 화면에 반영 확인
    await adminPage.reload();
    await expect(adminPage.getByRole('row', { name: new RegExp(email) })).toBeVisible();

    await adminContext.close();
    await inviteeContext.close();
  });
});
```

여러 사용자가 등장하는 여정은 `browser.newContext()`로 세션을 분리한다. 이것이 E2E만이 할 수 있는 검증이다.

---

### P-ARCH-03 — 스위트 디렉토리 구조

**WHY**
`tests/` 아래에 spec 파일 40개가 평평하게 놓여 있으면 무엇이 어디 있는지 알 수 없고, 부분 실행(`--grep`)도 어렵다. 또 시각 테스트와 기능 테스트가 섞여 있으면 서로 다른 설정(애니메이션 정지 여부, 재시도 정책)을 적용할 수 없다.

**DETECT**

```bash
fd -e spec.ts . tests e2e 2>/dev/null | head -40
fd -t d . tests e2e -d 2 2>/dev/null
rg -n "testMatch|testDir|testIgnore" playwright.config.*
```

**PASS / FAIL**

- PASS: 목적별로 디렉토리가 분리되고, 프로젝트 설정과 매핑된다. 부분 실행이 쉽다.
- FAIL: 평평한 구조로 관리 불가(S3), 목적이 다른 테스트가 같은 설정을 공유(S2).

**FIX**

```text
tests/
├── setup/
│   ├── global.setup.ts           # 인증 storageState 생성
│   └── global.teardown.ts        # 테스트 데이터 정리
├── e2e/                          # 기능 E2E (사용자 여정)
│   ├── journeys/
│   │   ├── signup.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── member-invitation.spec.ts
│   ├── smoke/                    # 배포 후 즉시 실행 (1분 이내)
│   │   └── critical-paths.spec.ts
│   └── features/
│       ├── members.spec.ts
│       └── settings.spec.ts
├── visual/                       # 시각 회귀 (04 문서)
├── api/                          # API 계약 테스트
│   └── members.api.spec.ts
├── a11y/                         # 접근성 자동 검사
│   └── axe.spec.ts
├── fixtures/                     # 공용 픽스처
│   ├── base.ts                   # 확장된 test
│   ├── auth.ts
│   ├── data.ts
│   └── network.ts
├── pages/                        # Page Object (필요한 곳만)
│   ├── checkout.page.ts
│   └── members.page.ts
├── utils/
│   ├── api-client.ts
│   └── assertions.ts
└── .auth/                        # storageState (gitignore)
    ├── admin.json
    └── member.json
```

```gitignore
# .gitignore
tests/.auth/
test-results/
playwright-report/
blob-report/
tmp/qa/
```

`tests/.auth/`를 커밋하면 세션 토큰이 저장소에 남는다. 반드시 무시 목록에 넣는다.

---

### P-ARCH-04 — 스모크 테스트 분리

**WHY**
전체 스위트가 15분 걸리면 배포 직후 헬스체크로 쓸 수 없다. 배포가 정상인지 1분 안에 확인할 수 있는 최소 세트가 별도로 필요하다. 반대로 스모크가 너무 커지면 그 목적을 잃는다.

**DETECT**

```bash
rg -n "smoke|@smoke" tests | head -20
rg -n "grep:|grepInvert" playwright.config.*
```

**PASS / FAIL**

- PASS: 스모크 세트가 존재하고 60초 이내에 완료된다. 배포 파이프라인에 연결되어 있다.
- FAIL: 스모크 부재(S2 — 배포 검증 수단 없음), 스모크가 5분 초과(S3).

**FIX**

```ts
// tests/e2e/smoke/critical-paths.spec.ts
import { test, expect } from '../../fixtures/base';

test.describe('스모크: 배포 검증', () => {
  test('홈이 렌더되고 핵심 CTA가 동작한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: '무료로 시작하기' })).toBeVisible();
  });

  test('로그인 화면이 응답한다', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('이메일')).toBeVisible();
  });

  test('인증 사용자가 대시보드에 접근한다', async ({ authedPage }) => {
    await authedPage.goto('/dashboard');
    await expect(authedPage.getByRole('heading', { name: '대시보드' })).toBeVisible();
    // 데이터가 실제로 로드되는지 (빈 껍데기가 아닌지)
    await expect(authedPage.getByTestId('metric-card').first()).toBeVisible();
  });

  test('핵심 API가 응답한다', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});
```

```bash
# 배포 후 실행
pnpm playwright test tests/e2e/smoke --project=chromium --workers=4
```

스모크는 **깊이가 아니라 넓이**를 본다. 각 주요 영역이 살아 있는지만 확인하고 세부 검증은 하지 않는다.

---

### P-ARCH-05 — 외부 의존성 처리 정책

**WHY**
결제 게이트웨이, OAuth, 이메일 발송, SMS는 통제할 수 없다. 실제로 호출하면 (a) 느리고, (b) 요금이 발생하며, (c) 외부 장애로 스위트가 무너지고, (d) 테스트 계정 제한에 걸린다. 그러나 전부 모킹하면 실제 연동이 깨져도 모른다.

**DETECT**

```bash
rg -n "stripe|toss|iamport|portone|paypal" src tests | head -20
rg -n "oauth|google|kakao|naver.*login" src tests | head -20
rg -n "sendgrid|ses|mailgun|nodemailer" src | head -20
rg -n "page\.route.*(stripe|oauth|api\.)" tests
```

**PASS / FAIL**

- PASS: 외부 의존이 계층별로 분리되어 있다. 일상 스위트는 샌드박스/모킹, 별도 스위트가 실 연동을 주기적으로 검증한다.
- FAIL: 실 결제 API를 일상 스위트에서 호출(S2 — 비용·불안정), 전부 모킹해 연동 회귀 미탐지(S2).

**FIX**

3단 전략을 쓴다.

```ts
// 1. 일상 스위트: 모킹 — 빠르고 안정적
// tests/fixtures/network.ts
export async function mockPaymentGateway(page: Page) {
  await page.route('**/api/payments/intent', route =>
    route.fulfill({ json: { clientSecret: 'test_secret_123', amount: 29000 } }));

  await page.route('**://js.stripe.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: STRIPE_STUB }));
}
```

```ts
// 2. 통합 스위트: 샌드박스 — 하루 1회 또는 릴리스 전
// tests/integration/payment.spec.ts
test.describe('결제 샌드박스 연동', () => {
  test.skip(!process.env.RUN_SANDBOX_TESTS, '샌드박스 테스트는 명시적으로 활성화');

  test('테스트 카드로 결제가 완료된다', async ({ page }) => {
    await page.goto('/checkout');
    // 결제사 테스트 카드 번호 사용
    await fillTestCard(page, '4242424242424242');
    await page.getByRole('button', { name: '결제하기' }).click();
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 30_000 });
  });
});
```

```ts
// 3. 계약 테스트: 외부 API 스키마가 바뀌었는지만 확인
// tests/api/payment-contract.spec.ts
test('결제사 API 응답 스키마가 유지된다', async ({ request }) => {
  test.skip(!process.env.PAYMENT_SANDBOX_KEY);
  const res = await request.post('https://api.sandbox.example.com/v1/intents', {
    headers: { Authorization: `Bearer ${process.env.PAYMENT_SANDBOX_KEY}` },
    data: { amount: 1000, currency: 'krw' },
  });
  expect(res.ok()).toBe(true);
  const json = await res.json();
  expect(PaymentIntentSchema.safeParse(json).success).toBe(true);
});
```

이메일은 테스트 전용 인박스 서비스나 자체 테스트 엔드포인트를 쓴다.

```ts
// ✅ 테스트 전용 엔드포인트로 마지막 발송 메일 조회
// 프로덕션에서는 반드시 차단한다
async function getLastEmail(to: string) {
  const res = await fetch(`${BASE_URL}/api/test/emails?to=${encodeURIComponent(to)}`, {
    headers: { 'x-test-secret': process.env.TEST_SECRET! },
  });
  return res.json() as Promise<{ subject: string; body: string; links: string[] }>;
}
```

```ts
// middleware.ts — 테스트 엔드포인트 보호
if (request.nextUrl.pathname.startsWith('/api/test/')) {
  const secret = request.headers.get('x-test-secret');
  if (process.env.NODE_ENV === 'production' || secret !== process.env.TEST_SECRET) {
    return new NextResponse('Not Found', { status: 404 });
  }
}
```

---

## 6. Configuration

설정은 스위트 전체의 동작을 결정한다. 잘못된 설정 한 줄이 수백 개 테스트를 flaky하게 만들거나, 반대로 결함을 은폐한다.

### P-CFG-01 — 기준 설정

**WHY**
기본값을 그대로 쓰면 (a) 타임아웃이 너무 길어 실패 판정이 30초씩 걸리고, (b) 트레이스가 없어 CI 실패를 디버깅할 수 없으며, (c) 로케일·타임존이 환경마다 달라 날짜 관련 테스트가 흔들린다.

**DETECT**

```bash
cat playwright.config.*
rg -n "timeout|retries|workers|trace|screenshot|video" playwright.config.*
rg -n "timezoneId|locale" playwright.config.*
rg -n "webServer" playwright.config.* -A8
```

**진단**

아래가 명시되어 있지 않으면 조사 대상이다.

```text
[ ] testDir / testMatch
[ ] timeout (테스트 단위)
[ ] expect.timeout (어설션 단위)
[ ] retries (CI/로컬 구분)
[ ] workers
[ ] trace (실패 시 최소 보존)
[ ] baseURL
[ ] timezoneId / locale
[ ] webServer (로컬 실행용)
[ ] forbidOnly (CI에서 .only 차단)
```

**PASS / FAIL**

- PASS: 위 항목이 모두 명시되고, CI와 로컬이 구분된다. `forbidOnly`가 CI에서 활성화된다.
- FAIL: 트레이스 미설정으로 CI 디버깅 불가(S2), `forbidOnly` 없음(S2 — `.only` 유출 시 스위트가 조용히 축소됨), 타임존 미고정(S2).

**FIX**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // 전체 스위트 시간 상한 — 폭주 방지
  globalTimeout: IS_CI ? 30 * 60 * 1000 : undefined,

  // 테스트 하나의 상한. 너무 길면 hang을 늦게 발견한다.
  timeout: 45_000,

  expect: {
    // 어설션 재시도 상한. 기본 5초는 대부분 충분하다.
    timeout: 7_000,
  },

  fullyParallel: true,
  forbidOnly: IS_CI,            // .only가 CI에 들어가면 실패시킨다
  retries: IS_CI ? 1 : 0,       // flaky 은폐 방지: 상한 1
  workers: IS_CI ? 4 : undefined,

  reporter: IS_CI
    ? [['blob'], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,

    // 실패 시에만 보존 — 용량과 속도 균형
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: IS_CI ? 'retain-on-failure' : 'off',

    // 결정론: 환경 간 차이 제거
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',

    // 액션/네비게이션 개별 타임아웃
    actionTimeout: 10_000,
    navigationTimeout: 20_000,

    // 실패 시 원인 파악을 돕는 컨텍스트
    testIdAttribute: 'data-testid',
  },

  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/member.json' },
    },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: { baseURL: BASE_URL },   // 브라우저 불필요
    },
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
      dependencies: ['chromium'],
    },
  ],

  webServer: IS_CI ? undefined : {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
```

**핵심 판단 근거**

- `timeout: 45_000` — 대부분의 테스트는 10초 이내에 끝난다. 45초는 hang을 감지하기에 충분히 짧고, 느린 CI에서 오탐을 내지 않을 만큼 길다.
- `expect.timeout: 7_000` — 어설션 재시도는 짧아야 한다. 길면 실패 판정이 늦어지고, 실제로는 대기 조건이 잘못된 경우가 많다.
- `retries: 1` — 0이면 네트워크 순단에 취약하고, 2 이상이면 flaky가 통계에서 사라진다.
- `trace: 'retain-on-failure'` — `'on'`은 모든 테스트에서 트레이스를 남겨 속도와 용량을 크게 잡아먹는다.

**BAD**

```ts
// ❌ flaky를 은폐하고 실패 판정을 지연시키는 설정
{
  timeout: 300_000,        // 5분 — hang을 5분 뒤에야 안다
  expect: { timeout: 60_000 },
  retries: 3,              // flaky가 통계에서 사라진다
  workers: 1,              // 병렬성 포기
  trace: 'off',            // CI 실패 시 디버깅 불가
}
```

---

### P-CFG-02 — 프로젝트 분리와 의존성

**WHY**
인증 상태 생성, 기능 테스트, 시각 테스트, 정리 작업은 실행 조건이 다르다. 하나의 프로젝트에 몰아넣으면 (a) 시각 테스트에만 필요한 애니메이션 정지가 기능 테스트에도 적용되고, (b) 인증 준비가 매 테스트마다 반복되며, (c) 일부만 실행하기 어렵다.

**DETECT**

```bash
rg -n "projects:" playwright.config.* -A40
rg -n "dependencies:|teardown:" playwright.config.*
rg -n "globalSetup|globalTeardown" playwright.config.*
```

**PASS / FAIL**

- PASS: 목적별 프로젝트가 분리되고 `dependencies`로 순서가 보장된다. 인증 준비가 한 번만 실행된다.
- FAIL: 단일 프로젝트에 전부 혼재(S3), 인증을 매 테스트에서 수행(S2), 정리 작업이 없어 데이터 누적(S2).

**FIX**

```ts
projects: [
  // 1. 인증 상태 생성 — 모든 테스트 전에 한 번
  {
    name: 'setup',
    testMatch: /setup\/global\.setup\.ts/,
  },

  // 2. 기능 E2E
  {
    name: 'e2e-chromium',
    dependencies: ['setup'],
    testMatch: /e2e\/.*\.spec\.ts/,
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'e2e-mobile',
    dependencies: ['setup'],
    testMatch: /e2e\/.*\.spec\.ts/,
    testIgnore: /e2e\/desktop-only\/.*/,
    use: { ...devices['Pixel 7'] },
  },

  // 3. API — 브라우저 불필요, 가장 빠름
  {
    name: 'api',
    testMatch: /api\/.*\.spec\.ts/,
  },

  // 4. 접근성
  {
    name: 'a11y',
    dependencies: ['setup'],
    testMatch: /a11y\/.*\.spec\.ts/,
    use: { ...devices['Desktop Chrome'] },
  },

  // 5. 정리 — 모든 테스트 후
  {
    name: 'cleanup',
    testMatch: /setup\/global\.teardown\.ts/,
    dependencies: ['e2e-chromium', 'e2e-mobile', 'api', 'a11y'],
  },
],
```

`teardown` 속성을 쓰면 더 명확하다.

```ts
{
  name: 'setup',
  testMatch: /global\.setup\.ts/,
  teardown: 'cleanup',      // setup에 의존하는 모든 프로젝트 완료 후 실행
},
{
  name: 'cleanup',
  testMatch: /global\.teardown\.ts/,
},
```

`globalSetup`(함수 기반)보다 setup **프로젝트**(테스트 파일 기반)를 권장한다. 이유는 (a) 트레이스와 리포트에 나타나고, (b) 픽스처를 쓸 수 있으며, (c) 실패 시 원인이 명확하기 때문이다.

---

### P-CFG-03 — webServer와 빌드 모드

**WHY**
개발 서버(`next dev`)는 HMR 오버레이, 소스맵, 다른 번들, React Strict Mode 이중 렌더를 갖는다. 개발 모드에서 통과한 테스트가 프로덕션에서 실패하거나, 그 반대가 발생한다. 특히 하이드레이션 오류와 캐싱 동작은 빌드 모드에 따라 완전히 다르다.

**DETECT**

```bash
rg -n "webServer" playwright.config.* -A10
rg -n "next dev|npm run dev|pnpm dev" playwright.config.* package.json
rg -n "reuseExistingServer" playwright.config.*
```

`command: 'pnpm dev'`가 보이면 즉시 결함이다.

**진단**

```bash
# 개발 모드와 프로덕션 모드 결과를 비교
pnpm dev &
pnpm playwright test tests/e2e --reporter=list > /tmp/dev-result.txt
kill %1

pnpm build && pnpm start &
pnpm playwright test tests/e2e --reporter=list > /tmp/prod-result.txt
kill %1

diff /tmp/dev-result.txt /tmp/prod-result.txt
```

결과가 다르면 그 차이 자체가 조사 대상이다.

**PASS / FAIL**

- PASS: E2E가 프로덕션 빌드로 실행된다. CI에서 빌드 후 `start`로 서버를 띄운다.
- FAIL: 개발 서버로 실행(S2 — 검증 신뢰도 저하), 두 모드에서 결과가 다름(S1 — 실제 결함일 가능성).

**FIX**

```ts
// ✅ 프로덕션 빌드로 실행
webServer: process.env.CI ? undefined : {
  command: 'pnpm build && pnpm start',
  url: BASE_URL,
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,        // 빌드 시간 포함
  stdout: 'ignore',
  stderr: 'pipe',          // 서버 오류는 보이게 한다
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_E2E: '1',   // 테스트 전용 분기 활성화
  },
},
```

CI에서는 빌드와 서버 기동을 워크플로 단계로 분리하는 편이 낫다. 빌드 실패와 테스트 실패를 구분할 수 있기 때문이다.

```yaml
- run: pnpm build
- run: pnpm start &
- run: npx wait-on http://localhost:3000 --timeout 60000
- run: pnpm playwright test
```

`reuseExistingServer: true`는 로컬 반복 실행을 빠르게 하지만, **오래된 서버를 재사용해 최신 코드를 검증하지 않는 위험**이 있다. 코드를 수정했다면 서버를 재시작한다.

---

### P-CFG-04 — 환경 변수와 시크릿

**WHY**
테스트 계정 비밀번호를 소스에 하드코딩하면 저장소에 영구히 남는다. 반대로 환경 변수가 없을 때 조용히 `undefined`로 진행하면 원인을 알 수 없는 실패가 발생한다. 또 프로덕션 URL을 실수로 넣으면 실제 데이터를 파괴할 수 있다.

**DETECT**

```bash
rg -n "password|secret|token|api[_-]?key" tests --glob "*.ts" -i | rg -v "process\.env" | head -20
rg -n "process\.env\.[A-Z_]+" tests | rg -o "[A-Z_]{4,}" | sort -u
fd ".env*" -H | head
rg -n "\.env" .gitignore
rg -n "https://.*\.(com|io|app)" playwright.config.* tests | rg -v localhost | head
```

**PASS / FAIL**

- PASS: 시크릿이 환경 변수로만 주입되고, 누락 시 즉시 실패한다. 프로덕션 URL에 대한 안전장치가 있다.
- FAIL: 하드코딩된 자격증명(**S0** — 보안), 누락 시 조용히 진행(S2), 프로덕션 대상 실행 가능(**S0**).

**FIX**

```ts
// tests/utils/env.ts — 필수 변수를 시작 시점에 검증
import { z } from 'zod';

const EnvSchema = z.object({
  PLAYWRIGHT_BASE_URL: z.string().url(),
  TEST_USER_EMAIL: z.string().email(),
  TEST_USER_PASSWORD: z.string().min(8),
  TEST_ADMIN_EMAIL: z.string().email(),
  TEST_ADMIN_PASSWORD: z.string().min(8),
  TEST_SECRET: z.string().min(16),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`);
  throw new Error(
    `테스트 환경 변수가 올바르지 않습니다:\n${missing.join('\n')}\n\n` +
    `.env.test.example을 참고해 .env.test를 작성하세요.`,
  );
}

export const env = parsed.data;
```

```ts
// playwright.config.ts — 프로덕션 대상 실행 차단
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const PRODUCTION_HOSTS = ['app.example.com', 'www.example.com'];
if (PRODUCTION_HOSTS.some(h => BASE_URL.includes(h)) && !process.env.ALLOW_PRODUCTION_TESTS) {
  throw new Error(
    `프로덕션(${BASE_URL})을 대상으로 테스트를 실행하려 합니다.\n` +
    `데이터가 변경될 수 있습니다. 의도한 경우 ALLOW_PRODUCTION_TESTS=1을 설정하세요.`,
  );
}
```

```bash
# .env.test.example — 커밋 O
PLAYWRIGHT_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=member@example.test
TEST_USER_PASSWORD=change-me
TEST_ADMIN_EMAIL=admin@example.test
TEST_ADMIN_PASSWORD=change-me
TEST_SECRET=local-only-test-secret-value
```

```gitignore
.env.test
.env.test.local
tests/.auth/
```

---

### P-CFG-05 — 타임아웃 계층 이해

**WHY**
Playwright에는 최소 6종의 타임아웃이 있고 서로 다른 것을 제어한다. 어느 것이 발동했는지 모르면 엉뚱한 값을 늘려 문제를 키운다. "타임아웃이 나면 늘린다"는 대응은 대부분 잘못된 대기 조건을 은폐한다.

**타임아웃 계층**

| 타임아웃 | 제어 대상 | 기본값 | 초과 시 메시지 |
|----------|-----------|--------|----------------|
| `globalTimeout` | 전체 스위트 | 없음 | `Timed out waiting ... for the entire test run` |
| `timeout` | 테스트 1개 | 30s | `Test timeout of 30000ms exceeded` |
| `expect.timeout` | 어설션 1개 | 5s | `Timed out 5000ms waiting for expect(...)` |
| `actionTimeout` | 액션 1개 (click, fill) | 0(무제한→테스트 타임아웃) | `locator.click: Timeout ... exceeded` |
| `navigationTimeout` | 페이지 이동 | 0(무제한→테스트 타임아웃) | `page.goto: Timeout ... exceeded` |
| `webServer.timeout` | 서버 기동 | 60s | `Timed out waiting ... for the web server` |

**DETECT**

```bash
rg -n "timeout" playwright.config.*
rg -n "\{\s*timeout:\s*[0-9]+" tests | head -20
rg -o "timeout: [0-9]+" tests | sort | uniq -c | sort -rn
```

개별 테스트에 흩어진 타임아웃 오버라이드가 많으면 설계 문제다.

**진단**

실패 메시지에서 어느 타임아웃인지 먼저 식별한다.

```text
"Test timeout of 45000ms exceeded"
  → 테스트 전체가 오래 걸림. 어느 단계인지 트레이스로 확인.

"locator.click: Timeout 10000ms exceeded. waiting for locator('button')"
  → 요소를 못 찾거나 클릭 불가 상태. 셀렉터 또는 가림 문제.

"Timed out 7000ms waiting for expect(locator).toBeVisible()"
  → 요소가 나타나지 않음. 대기 조건 또는 실제 결함.
```

**PASS / FAIL**

- PASS: 타임아웃이 config에서 계층별로 설정되고, 개별 오버라이드에 사유가 있다.
- FAIL: 타임아웃을 늘려 문제를 은폐(S2), 계층을 잘못 이해해 엉뚱한 값 조정(S3).

**FIX**

```ts
// ✅ 정말로 오래 걸리는 작업에만 사유와 함께 오버라이드
test('대용량 CSV 내보내기', async ({ page }) => {
  // 10만 행 생성에 서버에서 최대 60초 소요 (성능 예산 문서 참조)
  test.setTimeout(120_000);

  await page.goto('/reports');
  await page.getByRole('button', { name: '전체 내보내기' }).click();

  const download = await page.waitForEvent('download', { timeout: 90_000 });
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
```

```ts
// ✅ 특정 어설션만 길게 (폴링이 필요한 비동기 처리)
await expect(page.getByRole('status')).toContainText('처리 완료', { timeout: 30_000 });
```

**BAD**

```ts
// ❌ 전역 타임아웃을 늘려 모든 실패 판정을 지연시킨다
export default defineConfig({ timeout: 300_000, expect: { timeout: 60_000 } });
```

전역 타임아웃을 늘리면 정상 실패도 5분을 기다리게 되어 CI 시간이 폭증한다.

---

### P-CFG-06 — 로컬과 CI 설정 동등성

**WHY**
로컬에서 통과하고 CI에서 실패하는 현상의 대부분은 설정 차이에서 온다. 워커 수, 재시도, 헤드리스 여부, 뷰포트, 환경 변수가 다르면 재현이 불가능해진다. 로컬에서 CI 조건을 재현할 수 있어야 디버깅이 가능하다.

**DETECT**

```bash
rg -n "process\.env\.CI" playwright.config.*
rg -n "headless" playwright.config.*
cat .github/workflows/*.yml | rg -n "playwright|workers|shard"
```

**진단**

```bash
# CI 조건을 로컬에서 재현
CI=1 pnpm playwright test tests/e2e --workers=4 --reporter=list

# 결과가 다르면 원인은 설정 또는 환경
```

**PASS / FAIL**

- PASS: `CI=1`로 로컬 실행 시 CI와 동일하게 동작한다. 차이가 있다면 문서화되어 있다.
- FAIL: 재현 불가로 CI 실패를 디버깅할 수 없음(S2).

**FIX**

```json
// package.json — CI 조건 재현 스크립트 제공
{
  "scripts": {
    "test:e2e": "playwright test tests/e2e",
    "test:e2e:ci": "cross-env CI=1 playwright test tests/e2e --workers=4",
    "test:e2e:headed": "playwright test tests/e2e --headed --workers=1",
    "test:e2e:debug": "playwright test tests/e2e --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:docker": "docker run --rm --ipc=host -v \"$PWD:/work\" -w /work mcr.microsoft.com/playwright:v1.50.0-noble bash -lc \"corepack enable && pnpm install --frozen-lockfile && pnpm build && CI=1 pnpm playwright test\""
  }
}
```

CI와 정확히 같은 컨테이너로 실행할 수 있게 해두면, "CI에서만 실패" 문제의 절반이 사라진다.

---

## 7. 셀렉터 전략

셀렉터는 테스트 안정성의 절반을 결정한다. 잘못된 셀렉터는 (a) 사소한 리팩터링에 깨지고, (b) 실패 메시지가 불명확하며, (c) 실제로는 사용자가 볼 수 없는 요소를 잡는다.

### 7.1 우선순위

```text
1. getByRole(role, { name })       ← 기본. 접근성 트리 기반, 사용자 인지와 일치
2. getByLabel(text)                ← 폼 요소
3. getByPlaceholder(text)          ← 라벨이 없는 입력 (라벨 추가가 더 낫다)
4. getByText(text)                 ← 비인터랙티브 텍스트
5. getByTestId(id)                 ← 위 방법이 불가능하거나 불안정할 때
6. CSS/XPath                       ← 최후의 수단. 사유 필수
```

`getByRole`을 기본으로 두는 이유는 세 가지다. 첫째, 사용자와 스크린리더가 요소를 인지하는 방식과 같다. 둘째, 접근성 이름이 없으면 셀렉터를 쓸 수 없으므로 접근성을 강제한다. 셋째, CSS 구조 변경에 영향받지 않는다.

### P-SEL-01 — 역할 기반 셀렉터

**WHY**
`page.locator('.btn-primary')`는 클래스명이 바뀌면 깨지고, `page.locator('button').nth(2)`는 버튼이 하나 추가되면 다른 요소를 잡는다. 둘 다 실패해도 "요소를 찾을 수 없음"만 알려줄 뿐, 무엇을 찾으려 했는지 모른다. 역할 기반 셀렉터는 실패 메시지에 의도가 드러난다.

**DETECT**

```bash
# CSS 클래스 셀렉터
rg -n "locator\(['\"]\." tests | wc -l
rg -n "locator\(['\"]#" tests | wc -l

# 구조 의존 셀렉터
rg -n "nth-child|nth-of-type|first-child|last-child" tests
rg -n "\.nth\([0-9]+\)|\.first\(\)|\.last\(\)" tests | head -20
rg -n ">\s*(div|span|p)\b" tests

# XPath
rg -n "xpath=|//\*\[" tests

# 역할 기반 사용률
rg -c "getByRole" tests | awk -F: '{s+=$2} END {print "getByRole: "s}'
rg -c "locator\(" tests | awk -F: '{s+=$2} END {print "locator(): "s}'
```

`getByRole` 대비 `locator()` 비율이 높으면 재작성 대상이다.

**진단**

셀렉터가 취약한지 확인하는 방법은 **CSS 클래스를 바꿔보는 것**이다.

```bash
# Tailwind 클래스를 한 컴포넌트에서 변경한 뒤 테스트 실행
# 깨지면 그 테스트는 구조에 의존하고 있다
```

**PASS / FAIL**

- PASS: 셀렉터의 80% 이상이 역할/라벨/텍스트 기반이다. CSS 셀렉터에는 사유 주석이 있다.
- FAIL: CSS 클래스 의존 다수(S2 — 리팩터링마다 깨짐), 인덱스 기반 셀렉터(S2 — 순서 변경에 취약), XPath(S3).

**FIX**

**BAD**

```ts
// ❌ 구조와 스타일에 의존 — 리팩터링 한 번에 전부 깨진다
await page.locator('.modal .form-group:nth-child(2) input').fill('test@example.com');
await page.locator('div.footer > button.btn.btn-primary').click();
await page.locator('table tbody tr').nth(2).locator('td').nth(3).click();
```

**GOOD**

```ts
// ✅ 사용자가 인지하는 방식으로
await page.getByRole('dialog', { name: '멤버 초대' })
  .getByLabel('이메일')
  .fill('test@example.com');

await page.getByRole('button', { name: '초대 보내기' }).click();

await page.getByRole('row', { name: /김민준/ })
  .getByRole('button', { name: '권한 변경' })
  .click();
```

행을 인덱스가 아니라 **내용**으로 찾으면 정렬 순서가 바뀌어도 동작한다.

**모호성 해소**

같은 이름의 요소가 여러 개면 스코프를 좁힌다.

```ts
// ❌ 페이지에 '삭제' 버튼이 5개 — strict mode violation
await page.getByRole('button', { name: '삭제' }).click();

// ✅ 컨테이너로 스코프 지정
await page.getByRole('row', { name: /김민준/ })
  .getByRole('button', { name: '삭제' })
  .click();

// ✅ 또는 정확한 이름으로
await page.getByRole('button', { name: '계정 삭제', exact: true }).click();
```

Playwright의 strict mode는 셀렉터가 여러 요소에 매칭되면 실패한다. 이것은 기능이지 버그가 아니다. `.first()`로 회피하지 말고 셀렉터를 구체화한다.

```ts
// ❌ 모호성을 회피 — 어느 요소인지 모른 채 진행
await page.getByRole('button', { name: '삭제' }).first().click();

// ✅ 의도를 명시
await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();
```

**REGRESSION**

```ts
// tests/meta/selector-policy.spec.ts — 스위트 자체를 검사
import { execSync } from 'node:child_process';

test('CSS 클래스 셀렉터가 도입되지 않는다', () => {
  const out = execSync(
    `rg -n "locator\\(['\\"]\\." tests/e2e || true`,
    { encoding: 'utf8' },
  ).trim();

  const lines = out ? out.split('\n') : [];
  // 사유 주석이 있는 줄은 허용
  const violations = lines.filter(l => !l.includes('selector-ok'));

  expect(violations, `CSS 셀렉터:\n${violations.join('\n')}`).toEqual([]);
});
```

---

### P-SEL-02 — testId 사용 기준

**WHY**
`data-testid`는 편리하지만 남용하면 (a) 접근성 검증 기회를 잃고, (b) 사용자가 볼 수 없는 것을 테스트하며, (c) 제품 코드가 테스트 전용 속성으로 오염된다. 그러나 역할이나 텍스트로 안정적으로 특정할 수 없는 경우에는 testId가 최선이다.

**testId가 적절한 경우**

```text
- 컨테이너/섹션 (역할이 없는 div)
- 텍스트가 자주 바뀌는 요소 (마케팅 카피)
- 동적 목록의 개별 항목 컨테이너
- 차트, 캔버스 등 접근성 이름이 없는 시각 요소
- 마스킹 대상 (시각 테스트)
```

**testId가 부적절한 경우**

```text
- 버튼, 링크 (getByRole로 가능하고 접근성도 검증됨)
- 폼 입력 (getByLabel이 라벨 연결까지 검증)
- 제목 (getByRole('heading'))
- 오류 메시지 (getByRole('alert'))
```

**DETECT**

```bash
rg -o "getByTestId\(['\"][^'\"]+" tests -r '$1' | sort | uniq -c | sort -rn | head -30
rg -c "getByTestId" tests | awk -F: '{s+=$2} END {print "testId: "s}'

# 버튼/입력에 testId를 쓰는 곳 = 재작성 후보
rg -n "getByTestId.*(btn|button|submit|input|field)" tests
rg -n "data-testid" src --glob "*.tsx" | rg -i "button|input|link" | head -20
```

**PASS / FAIL**

- PASS: testId 사용이 컨테이너와 접근성 이름이 없는 요소에 한정된다. 버튼·입력·제목에는 역할 기반 셀렉터를 쓴다.
- FAIL: 인터랙티브 요소에 testId 남용(S3 — 접근성 검증 기회 상실), testId 없이 CSS에 의존(S2).

**FIX**

```tsx
// ❌ 모든 요소에 testId — 접근성이 깨져도 테스트는 통과한다
<button data-testid="submit-btn" onClick={onSubmit}>
  <Icon />
</button>
```

```ts
// 이 테스트는 버튼에 접근 가능한 이름이 없어도 통과한다
await page.getByTestId('submit-btn').click();
```

```tsx
// ✅ 접근 가능한 이름을 부여 → 역할 기반 셀렉터가 가능해지고 접근성도 확보
<button aria-label="저장" onClick={onSubmit}>
  <Icon aria-hidden="true" />
</button>
```

```ts
// 이 테스트는 접근성 이름이 없으면 실패한다 — 이것이 의도다
await page.getByRole('button', { name: '저장' }).click();
```

```tsx
// ✅ 컨테이너에는 testId가 적절 (역할이 없다)
<section data-testid="metrics-grid" className="grid gap-4">
  {metrics.map(m => (
    <article key={m.id} data-testid="metric-card">…</article>
  ))}
</section>
```

```ts
// ✅ 컨테이너로 스코프를 좁히고 내부는 역할로
const grid = page.getByTestId('metrics-grid');
await expect(grid.getByRole('article')).toHaveCount(4);
await expect(grid.getByRole('heading', { name: '월 반복 매출' })).toBeVisible();
```

**testId 명명 규칙**

```text
<영역>-<대상>[-<변형>]

metrics-grid
metric-card
members-table
member-row
invite-dialog
relative-time            (마스킹 대상)
```

번호나 인덱스를 넣지 않는다(`card-1`, `row-3`). 순서가 바뀌면 의미가 달라진다.

---

### P-SEL-03 — 동적 목록과 행 선택

**WHY**
테이블이나 목록에서 특정 항목을 인덱스로 찾으면, 정렬 순서·필터·페이지네이션이 바뀔 때 다른 항목을 조작한다. 최악의 경우 잘못된 데이터를 삭제하는 테스트가 통과한다.

**DETECT**

```bash
rg -n "\.nth\([0-9]+\)" tests
rg -n "tr\)\.nth|row.*nth|item.*nth" tests
rg -n "getByRole\('row'\)" tests | head -20
```

**진단**

```ts
// 목록 순서를 바꿔도 테스트가 통과하는지 확인
test('정렬을 바꿔도 올바른 행을 조작한다', async ({ page }) => {
  await page.goto('/settings/members');
  await page.getByRole('columnheader', { name: '이름' }).click();   // 정렬 변경
  await page.getByRole('row', { name: /김민준/ })
    .getByRole('button', { name: '삭제' }).click();
  await expect(page.getByRole('dialog')).toContainText('김민준');    // 올바른 대상인가
});
```

**PASS / FAIL**

- PASS: 목록 항목을 내용(이름, ID)으로 찾는다. 정렬·필터 변경에도 올바른 대상을 조작한다.
- FAIL: 인덱스 기반 선택(S2 — 잘못된 대상 조작 위험), 삭제 등 파괴적 작업에서 인덱스 사용(**S1**).

**FIX**

```ts
// ❌ 순서에 의존 — 정렬이 바뀌면 다른 사람을 삭제한다
await page.getByRole('row').nth(2).getByRole('button', { name: '삭제' }).click();

// ✅ 내용으로 특정
const targetRow = page.getByRole('row', { name: /김민준/ });
await targetRow.getByRole('button', { name: '삭제' }).click();

// ✅ 더 견고하게: 고유 식별자를 노출
const targetRow = page.getByRole('row').filter({
  has: page.getByText('member-a1b2c3', { exact: true }),
});
```

```tsx
// ✅ 제품에서 안정적인 식별자를 제공
<tr data-testid="member-row" data-member-id={member.id}>
```

```ts
// ✅ 속성으로 정확히 지목
const row = page.locator(`[data-member-id="${memberId}"]`);   // selector-ok: 고유 식별자
await row.getByRole('button', { name: '삭제' }).click();
```

고유 식별자 기반 CSS 셀렉터는 예외적으로 허용된다. 구조가 아니라 데이터에 의존하기 때문이다. 사유 주석을 남긴다.

**filter를 활용한 조합**

```ts
// ✅ 여러 조건으로 좁히기
const adminRow = page.getByRole('row')
  .filter({ hasText: '김민준' })
  .filter({ has: page.getByRole('cell', { name: '관리자' }) });

await expect(adminRow).toHaveCount(1);
await adminRow.getByRole('button', { name: '권한 변경' }).click();
```

`toHaveCount(1)`을 먼저 확인하면 셀렉터가 의도한 하나만 잡는지 보장할 수 있다.

---

### P-SEL-04 — 텍스트 매칭 전략

**WHY**
`getByText('저장')`은 "저장", "저장하기", "임시저장"에 모두 매칭된다. 반대로 `exact: true`를 남용하면 공백이나 줄바꿈 차이로 실패한다. 다국어 프로젝트에서는 텍스트 자체가 바뀐다.

**DETECT**

```bash
rg -o "getByText\(['\"][^'\"]+" tests -r '$1' | sort | uniq -c | sort -rn | head -20
rg -n "exact: true" tests | wc -l
rg -n "getByText\(/" tests | wc -l          # 정규식 사용
rg -n "hasText:" tests | head -20
```

**PASS / FAIL**

- PASS: 짧은 텍스트에 `exact: true` 또는 정규식 앵커를 쓴다. 긴 문장은 핵심 부분만 매칭한다. i18n 프로젝트는 키 기반이거나 role 기반이다.
- FAIL: 부분 매칭으로 잘못된 요소 선택(S2), 전체 문장 정확 매칭으로 취약(S3).

**FIX**

```ts
// ❌ 부분 매칭 — '임시저장'에도 걸린다
await page.getByText('저장').click();

// ✅ 정확 매칭
await page.getByRole('button', { name: '저장', exact: true }).click();

// ✅ 정규식 앵커
await page.getByRole('button', { name: /^저장$/ }).click();
```

```ts
// ❌ 긴 문장 전체 매칭 — 카피 한 글자만 바뀌어도 실패
await expect(page.getByText('멤버를 초대하면 이메일로 초대장이 발송됩니다.')).toBeVisible();

// ✅ 핵심 부분만
await expect(page.getByRole('status')).toContainText('초대장이 발송');
```

```ts
// ✅ 공백·줄바꿈에 강한 매칭
// Playwright의 텍스트 매칭은 기본적으로 공백을 정규화하지만,
// 명시적으로 유연하게 하려면 정규식을 쓴다
await expect(page.getByTestId('summary')).toContainText(/총\s*12\s*명/);
```

**i18n 프로젝트**

```ts
// ✅ 메시지 카탈로그를 테스트에서도 참조
import messages from '../../messages/ko.json';

await page.getByRole('button', { name: messages.common.save }).click();
await expect(page.getByRole('status')).toContainText(messages.members.inviteSent);
```

카피가 바뀌면 카탈로그가 바뀌고 테스트도 자동으로 따라간다. 다만 카탈로그 자체가 잘못되면 테스트가 그것을 검증하지 못하므로, 대표 화면 1~2곳은 하드코딩된 문자열로 검증한다.

---

### P-SEL-05 — Locator 재사용과 지연 평가

**WHY**
Playwright의 Locator는 **즉시 요소를 찾지 않는다.** 사용 시점에 DOM을 조회하는 지연 평가 객체다. 이 특성을 모르면 (a) 불필요하게 매번 셀렉터를 재작성하거나, (b) `elementHandle`을 잡아두고 DOM이 갱신된 뒤 stale 참조로 실패한다.

**DETECT**

```bash
rg -n "\$\(|\$\$\(|elementHandle|\.elementHandle\(\)" tests
rg -n "await page\.\\\$" tests
rg -n "const .* = page\.getBy" tests | wc -l
```

`page.$()`와 `elementHandle`은 레거시 API이며 stale 문제를 일으킨다.

**PASS / FAIL**

- PASS: Locator를 변수에 담아 재사용하고, `elementHandle`을 쓰지 않는다.
- FAIL: `page.$()` 사용(S2 — stale 참조), 동일 셀렉터를 반복 작성(S3).

**FIX**

```ts
// ❌ elementHandle — DOM이 갱신되면 stale
const button = await page.$('button.submit');
await page.getByRole('button', { name: '새로고침' }).click();
await button!.click();   // Error: Element is not attached to the DOM

// ✅ Locator — 사용 시점에 다시 찾는다
const submit = page.getByRole('button', { name: '제출' });
await page.getByRole('button', { name: '새로고침' }).click();
await submit.click();    // 갱신된 DOM에서 다시 찾는다
```

```ts
// ✅ Locator를 조합해 재사용
test('멤버 목록 조작', async ({ page }) => {
  await page.goto('/settings/members');

  const table = page.getByRole('table', { name: '멤버 목록' });
  const rows = table.getByRole('row');
  const searchInput = page.getByRole('searchbox', { name: '멤버 검색' });

  await expect(rows).toHaveCount(11);   // 헤더 포함

  await searchInput.fill('김');
  await expect(rows).toHaveCount(4);    // 같은 Locator가 새 DOM을 조회

  await searchInput.clear();
  await expect(rows).toHaveCount(11);
});
```

같은 `rows` Locator가 매 어설션마다 현재 DOM을 다시 조회하므로, 필터링 후에도 올바르게 동작한다.

---

### P-SEL-06 — Shadow DOM과 iframe

**WHY**
서드파티 위젯(결제, 채팅, 지도)은 iframe 안에 있고, 웹 컴포넌트는 Shadow DOM을 쓴다. 일반 셀렉터로는 접근할 수 없어 `frameLocator`가 필요하다. 이를 모르면 "요소를 찾을 수 없음"의 원인을 한참 헤맨다.

**DETECT**

```bash
rg -n "<iframe" src --glob "*.tsx"
rg -n "frameLocator|frame\(" tests
rg -n "shadowRoot|attachShadow|custom-element" src
rg -n "stripe|iamport|channel-talk|intercom" src
```

**PASS / FAIL**

- PASS: iframe 내부 요소에 `frameLocator`를 사용한다. Shadow DOM은 Playwright가 자동 관통하므로 특별 처리가 불필요하다(open shadow root 기준).
- FAIL: iframe 내부를 일반 셀렉터로 접근 시도(S2 — 항상 실패), closed shadow root 의존(S2).

**FIX**

```ts
// ✅ iframe 내부 접근
const paymentFrame = page.frameLocator('iframe[title="결제 정보 입력"]');
await paymentFrame.getByLabel('카드 번호').fill('4242424242424242');
await paymentFrame.getByLabel('유효기간').fill('12/30');
await paymentFrame.getByLabel('CVC').fill('123');

// 중첩 iframe
const inner = page
  .frameLocator('#outer-frame')
  .frameLocator('#inner-frame');
await inner.getByRole('button', { name: '확인' }).click();
```

```ts
// ✅ iframe 로드 대기 — frameLocator는 자동 대기하지만 명시가 안전한 경우도 있다
await expect(page.locator('iframe[title="결제 정보 입력"]')).toBeVisible();
const frame = page.frameLocator('iframe[title="결제 정보 입력"]');
await expect(frame.getByLabel('카드 번호')).toBeVisible();
```

Shadow DOM은 Playwright가 자동으로 관통한다.

```ts
// ✅ open shadow root는 일반 셀렉터로 접근 가능
await page.getByRole('button', { name: '설정' }).click();   // 웹 컴포넌트 내부여도 동작
```

`closed` shadow root는 접근할 수 없다. 제품 코드에서 `mode: 'open'`을 쓰도록 요청한다.

---

## 8. 대기 전략

Playwright는 자동 대기(auto-waiting)를 제공한다. 이를 신뢰하지 못하고 하드 대기를 넣는 것이 flaky의 가장 큰 원인이다.

### 8.1 자동 대기가 이미 하는 일

액션 실행 전 Playwright는 대상 요소가 **actionable**해질 때까지 기다린다.

| 액션 | 대기 조건 |
|------|-----------|
| `click()` | attached, visible, stable(애니메이션 종료), enabled, receives events(가려지지 않음) |
| `fill()` | attached, visible, enabled, editable |
| `check()` | click 조건 + checkbox/radio |
| `selectOption()` | attached, visible, enabled |
| `hover()` | attached, visible, stable, receives events |

웹 우선 어설션(`expect(locator).toBeVisible()` 등)도 조건이 만족될 때까지 폴링한다. 즉 **대부분의 경우 명시적 대기가 필요 없다.**

### P-WAIT-01 — 하드 대기 제거

**WHY**
`waitForTimeout(2000)`은 두 방향으로 틀린다. 느린 CI에서는 2초로 부족해 실패하고, 빠른 환경에서는 1.9초를 낭비한다. 테스트 50개에 각 2초면 100초가 순수 대기다. 더 나쁜 것은, 하드 대기가 있으면 **실제 대기 조건이 무엇인지 아무도 모르게 된다.**

**DETECT**

```bash
rg -n "waitForTimeout" tests
rg -n "setTimeout|sleep\(" tests
rg -c "waitForTimeout" tests | awk -F: '{s+=$2} END {print "hard waits: "s}'
```

**진단**

하드 대기를 전부 제거하고 실행해본다.

```bash
# 임시로 waitForTimeout을 짧게 바꿔 실행
rg -l "waitForTimeout" tests | xargs sed -i.bak 's/waitForTimeout([0-9]*)/waitForTimeout(0)/g'
pnpm playwright test tests/e2e --repeat-each=3
# 실패하는 테스트가 진짜 대기 조건을 표현하지 못한 것들이다
rg -l "waitForTimeout" tests | xargs -I{} mv {}.bak {}
```

**PASS / FAIL**

- PASS: `waitForTimeout`이 0건이거나, 남은 것에 대체 불가 사유 주석이 있다.
- FAIL: 하드 대기 다수(S2 — flaky + 시간 낭비). 5건 이상이면 S2, 20건 이상이면 S1.

**FIX**

상황별 대체 방법.

```ts
// ❌ 요소가 나타나길 기다린다
await page.waitForTimeout(2000);
await page.getByRole('dialog').click();

// ✅ 어설션이 폴링한다
await expect(page.getByRole('dialog')).toBeVisible();
await page.getByRole('dialog').click();
```

```ts
// ❌ API 응답을 기다린다
await page.getByRole('button', { name: '저장' }).click();
await page.waitForTimeout(3000);
await expect(page.getByRole('status')).toContainText('저장됨');

// ✅ 결과 상태를 기다린다 (가장 좋음 — 사용자가 보는 것)
await page.getByRole('button', { name: '저장' }).click();
await expect(page.getByRole('status')).toContainText('저장됨');

// ✅ 또는 응답 자체를 기다린다 (응답 내용 검증이 필요할 때)
const responsePromise = page.waitForResponse(
  r => r.url().includes('/api/members') && r.request().method() === 'POST');
await page.getByRole('button', { name: '저장' }).click();
const response = await responsePromise;
expect(response.status()).toBe(201);
```

`waitForResponse`는 클릭 **전에** promise를 만들어야 한다. 클릭 후에 만들면 이미 지나간 응답을 놓친다.

```ts
// ❌ 애니메이션을 기다린다
await page.getByRole('button', { name: '열기' }).click();
await page.waitForTimeout(300);
await expect(drawer).toBeVisible();

// ✅ Playwright가 stable 상태를 자동으로 기다린다
await page.getByRole('button', { name: '열기' }).click();
await expect(drawer).toBeVisible();
await expect(drawer).toBeInViewport();
```

```ts
// ❌ 디바운스를 기다린다
await searchInput.fill('김');
await page.waitForTimeout(500);
await expect(rows).toHaveCount(4);

// ✅ 결과를 기다린다 — expect가 최대 7초까지 폴링한다
await searchInput.fill('김');
await expect(rows).toHaveCount(4);
```

**정당한 하드 대기**

거의 없지만, 존재한다.

```ts
// ✅ 사유가 명확한 경우: "일정 시간 동안 아무 일도 일어나지 않음"을 검증
test('입력 후 500ms 이내에는 요청을 보내지 않는다 (디바운스)', async ({ page }) => {
  let requestCount = 0;
  page.on('request', r => { if (r.url().includes('/api/search')) requestCount++; });

  await page.getByRole('searchbox').fill('김');
  // 디바운스 지연(500ms)보다 짧게 대기해 요청이 없음을 확인한다.
  // 이것은 "무언가를 기다리는" 것이 아니라 "일정 시간 경과"를 검증하는 것이므로 정당하다.
  await page.waitForTimeout(300);
  expect(requestCount).toBe(0);

  await expect(page.getByTestId('search-results')).toBeVisible();
  expect(requestCount).toBe(1);
});
```

---

### P-WAIT-02 — networkidle 오남용

**WHY**
`waitForLoadState('networkidle')`은 500ms 동안 네트워크 요청이 2개 이하인 상태를 기다린다. 그런데 (a) 폴링, WebSocket, 분석 스크립트가 있으면 영원히 도달하지 않고, (b) 도달해도 그것이 "화면이 준비됨"을 의미하지 않으며, (c) 불필요하게 느리다. Playwright 공식 문서도 이를 권장하지 않는다.

**DETECT**

```bash
rg -n "networkidle" tests
rg -c "networkidle" tests | awk -F: '{s+=$2} END {print "networkidle: "s}'
rg -n "waitForLoadState" tests
```

**진단**

```ts
// networkidle이 실제로 도달 가능한지 확인
test('networkidle 도달 시간 측정', async ({ page }) => {
  const start = Date.now();
  await page.goto('/dashboard');
  try {
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
    console.log(`networkidle 도달: ${Date.now() - start}ms`);
  } catch {
    console.log('networkidle 도달 실패 — 지속적 네트워크 활동 존재');
  }
});
```

**PASS / FAIL**

- PASS: `networkidle` 사용이 없거나, 시각 캡처처럼 정당한 용도에 한정된다.
- FAIL: 기능 테스트에서 `networkidle` 남용(S3 — 느림), 폴링이 있어 타임아웃(S2).

**FIX**

```ts
// ❌ "페이지가 준비될 때까지" 라는 모호한 의도
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
await expect(page.getByTestId('metric-card')).toBeVisible();

// ✅ 실제로 기다리는 것을 명시 — 더 빠르고 더 정확하다
await page.goto('/dashboard');
await expect(page.getByTestId('metric-card').first()).toBeVisible();
```

```ts
// ✅ 특정 요청 완료를 기다려야 한다면 그것을 명시
await page.goto('/dashboard');
await page.waitForResponse(r => r.url().includes('/api/metrics') && r.ok());
await expect(page.getByTestId('metric-card')).toHaveCount(4);
```

`page.goto()`는 기본적으로 `load` 이벤트를 기다린다. 대부분의 경우 그것으로 충분하고, 나머지는 어설션이 처리한다.

시각 회귀 테스트에서는 `networkidle`이 정당할 수 있다(모든 리소스 로드 후 캡처). 그 경우에도 폴링 요청을 차단한 뒤에 써야 한다.

---

### P-WAIT-03 — 네비게이션 대기

**WHY**
클릭 후 페이지가 이동하는데 곧바로 새 페이지 요소를 찾으면, 이전 페이지에서 찾다가 실패하거나(race) 이전 페이지의 동명 요소를 잘못 잡는다. 반대로 SPA 라우팅은 실제 네비게이션이 아니므로 `waitForNavigation`이 발동하지 않는다.

**DETECT**

```bash
rg -n "waitForNavigation" tests          # deprecated 패턴
rg -n "waitForURL" tests | wc -l
rg -n "toHaveURL" tests | wc -l
rg -n "click\(\).*goto|goto.*click" tests | head
```

**PASS / FAIL**

- PASS: 네비게이션 후 `toHaveURL` 또는 새 페이지의 고유 요소로 도착을 확인한다. `waitForNavigation`(deprecated)을 쓰지 않는다.
- FAIL: 네비게이션 확인 없이 진행(S2 — race), `waitForNavigation` 사용(S3).

**FIX**

```ts
// ❌ deprecated + race 위험
await Promise.all([
  page.waitForNavigation(),
  page.getByRole('link', { name: '설정' }).click(),
]);

// ✅ URL로 도착 확인
await page.getByRole('link', { name: '설정' }).click();
await expect(page).toHaveURL(/\/settings/);

// ✅ 또는 새 페이지의 고유 요소로 (더 강한 검증)
await page.getByRole('link', { name: '설정' }).click();
await expect(page.getByRole('heading', { name: '설정', level: 1 })).toBeVisible();
```

```ts
// ✅ 리디렉션이 여러 단계인 경우 최종 URL을 기다린다
await page.getByRole('button', { name: '로그인' }).click();
await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
```

```ts
// ✅ 새 탭이 열리는 경우
const pagePromise = page.context().waitForEvent('page');
await page.getByRole('link', { name: '문서 (새 창)' }).click();
const newPage = await pagePromise;
await newPage.waitForLoadState();
await expect(newPage).toHaveURL(/docs\.example\.com/);
```

---

### P-WAIT-04 — 비동기 상태 전이 대기

**WHY**
백그라운드 작업(파일 처리, 이메일 발송, 웹훅)은 완료까지 수 초~수십 초가 걸리고 시간이 일정하지 않다. 고정 대기로는 불안정하고, 무한정 기다리면 hang을 감지하지 못한다. 폴링 어설션이 정답이다.

**DETECT**

```bash
rg -n "polling|setInterval|retry" tests | head
rg -n "toPass\(" tests | wc -l
rg -n "timeout: [0-9]{5,}" tests
```

**PASS / FAIL**

- PASS: 장기 비동기 작업에 `expect.poll` 또는 `expect().toPass()`를 쓰고 상한 타임아웃이 있다.
- FAIL: 고정 대기로 처리(S2 — flaky), 상한 없이 대기(S2 — hang 미감지).

**FIX**

```ts
// ✅ expect.poll — 값이 조건을 만족할 때까지 폴링
await expect
  .poll(async () => {
    const res = await request.get(`/api/jobs/${jobId}`);
    return (await res.json()).status;
  }, {
    message: '작업이 완료 상태가 되지 않음',
    timeout: 60_000,
    intervals: [1000, 2000, 5000],   // 점진적 백오프
  })
  .toBe('completed');
```

```ts
// ✅ toPass — 여러 어설션 묶음을 재시도
await expect(async () => {
  await page.reload();
  await expect(page.getByRole('status')).toContainText('처리 완료');
  await expect(page.getByRole('link', { name: '결과 다운로드' })).toBeVisible();
}).toPass({
  timeout: 90_000,
  intervals: [2000, 5000, 10_000],
});
```

`toPass`는 내부 어설션이 전부 통과할 때까지 블록 전체를 재시도한다. 새로고침이 필요한 폴링 시나리오에 적합하다.

```ts
// ✅ 이메일 도착 대기
const email = await expect.poll(
  () => getLastEmail(userEmail),
  { message: '초대 이메일이 도착하지 않음', timeout: 30_000, intervals: [1000, 2000] },
).not.toBeNull().then(() => getLastEmail(userEmail));
```

---

### P-WAIT-05 — 요소 사라짐 대기

**WHY**
로딩 스피너가 사라지길 기다리지 않고 다음 액션을 하면, 스피너가 클릭을 가로채거나 아직 이전 데이터가 표시된 상태를 검증하게 된다. 반대로 스피너가 너무 빨리 사라지면 `toBeVisible()`이 먼저 실패한다(스피너를 본 적이 없어서).

**DETECT**

```bash
rg -n "toBeHidden|not\.toBeVisible|state: 'detached'" tests | wc -l
rg -n "toBeVisible.*spinner|loading" tests | head
rg -n "waitForSelector.*hidden" tests
```

**PASS / FAIL**

- PASS: 로딩 완료를 "스피너 사라짐"이 아니라 "결과 나타남"으로 판정한다. 사라짐 대기가 필요하면 `toBeHidden`을 쓴다.
- FAIL: 스피너 등장을 어설션(S2 — 빠른 응답에서 flaky), 사라짐을 기다리지 않고 진행(S2).

**FIX**

```ts
// ❌ 스피너가 빨리 사라지면 실패한다 (본 적이 없어서)
await page.getByRole('button', { name: '검색' }).click();
await expect(page.getByTestId('spinner')).toBeVisible();      // flaky
await expect(page.getByTestId('spinner')).toBeHidden();

// ✅ 결과를 기다린다 — 스피너를 봤든 안 봤든 무관
await page.getByRole('button', { name: '검색' }).click();
await expect(page.getByTestId('search-results')).toBeVisible();
await expect(page.getByRole('row')).toHaveCount(5);
```

```ts
// ✅ 스피너 사라짐이 정말 필요한 경우 (다음 액션이 가려질 수 있을 때)
await page.getByRole('button', { name: '적용' }).click();
await expect(page.getByTestId('overlay-spinner')).toBeHidden();
await page.getByRole('button', { name: '다음' }).click();
```

Playwright의 자동 대기는 `receives events`를 확인하므로 대부분 오버레이를 알아서 기다린다. 명시적 대기는 그것이 실패할 때만 추가한다.

```ts
// ✅ 이전 데이터가 남아 있는지 구분해야 할 때
const rows = page.getByRole('row');
await expect(rows).toHaveCount(11);           // 초기 상태

await page.getByRole('searchbox').fill('김');
// 이전 11행에서 4행으로 바뀌는 것을 기다린다.
// toHaveCount는 폴링하므로 중간 상태를 자연스럽게 통과한다.
await expect(rows).toHaveCount(4);
```

---

### P-WAIT-06 — 자동 대기가 실패하는 경우

**WHY**
자동 대기도 만능은 아니다. 요소가 DOM에 있고 보이지만 **JS 핸들러가 아직 붙지 않은** 상태에서 클릭하면 아무 일도 일어나지 않는다. Next.js의 하이드레이션 이전이 대표적이다. 이 경우 클릭은 성공했다고 나오지만 동작하지 않아 다음 어설션에서 실패한다.

**DETECT**

```bash
rg -n "click\(\)" tests | wc -l
rg -n "force: true" tests                      # 자동 대기 우회 — 위험 신호
rg -n "dispatchEvent|evaluate.*click" tests
rg -n "useEffect|'use client'" src/app/page.tsx 2>/dev/null
```

`force: true`는 actionability 검사를 건너뛰므로, 실제로는 클릭할 수 없는 요소를 클릭했다고 표시한다.

**진단**

```ts
// 하이드레이션 이전 클릭이 무시되는지 확인
test('하이드레이션 전 클릭이 유실되지 않는다', async ({ page }) => {
  await page.goto('/');
  // load 직후 즉시 클릭
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible({ timeout: 3000 });
});
```

이 테스트가 간헐적으로 실패하면 하이드레이션 문제다.

**PASS / FAIL**

- PASS: 하이드레이션 완료 후 상호작용이 보장된다. `force: true`가 없거나 사유가 있다.
- FAIL: 하이드레이션 전 클릭 유실(S2 — 테스트 flaky이자 실제 UX 결함), `force: true` 남용(S2 — 검증 무효화).

**FIX**

근본 해결은 제품 쪽이다. 하이드레이션 전에는 인터랙티브 요소를 비활성화하거나, 서버 렌더 상태에서도 동작하게 만든다(`01_Core_QA.md` 참조).

테스트 쪽 대응은 두 가지다.

```ts
// ✅ 방법 A: 하이드레이션 완료 신호를 기다린다
// 제품에서 신호를 노출
// app/providers.tsx
useEffect(() => { document.documentElement.dataset.hydrated = 'true'; }, []);

// 테스트
await page.goto('/');
await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
await page.getByRole('button', { name: '메뉴 열기' }).click();
```

```ts
// ✅ 방법 B: 재시도로 감싼다 (근본 해결이 아니므로 차선)
await expect(async () => {
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible({ timeout: 1000 });
}).toPass({ timeout: 10_000 });
```

**force: true 사용 기준**

```ts
// ❌ 요소가 가려져서 클릭이 안 되니 강제로
await page.getByRole('button', { name: '저장' }).click({ force: true });
// → 실제 사용자는 이 버튼을 클릭할 수 없다. 이것은 제품 결함이다.

// ✅ 정당한 경우: 의도적으로 actionability를 우회해야 하는 검증
test('비활성 버튼 클릭 시 아무 일도 일어나지 않는다', async ({ page }) => {
  const submit = page.getByRole('button', { name: '제출' });
  await expect(submit).toBeDisabled();
  // disabled 요소는 일반 click이 대기하다 타임아웃되므로 force가 필요하다
  await submit.click({ force: true });
  await expect(page).toHaveURL(/\/form/);   // 이동하지 않았다
});
```

---

## 9. Fixture와 테스트 격리

### P-FIX-01 — 픽스처로 준비 로직 통합

**WHY**
모든 테스트 상단에 로그인 5줄, 모킹 8줄, 초기화 3줄을 복사하면 (a) 40개 테스트에 640줄이 중복되고, (b) 준비 방식을 바꿀 때 40곳을 고쳐야 하며, (c) 어떤 테스트가 무엇을 준비했는지 파악하기 어렵다. Playwright의 픽스처는 이를 선언적으로 해결한다.

**DETECT**

```bash
rg -n "test\.beforeEach" tests | wc -l
rg -A6 "test\.beforeEach" tests | rg "goto|fill|click" | head -20
rg -n "base\.extend|test\.extend" tests
rg -n "import.*from.*fixtures" tests | wc -l

# 중복 준비 코드 탐지
rg -n "getByLabel\('이메일'\).*fill" tests | wc -l
```

로그인 코드가 여러 파일에 반복되면 픽스처 부재다.

**PASS / FAIL**

- PASS: 공통 준비가 픽스처로 추출되고, 테스트는 필요한 픽스처만 선언한다. `beforeEach`는 해당 describe 고유 준비에만 쓰인다.
- FAIL: 준비 로직 대량 중복(S3), 모든 테스트가 동일한 무거운 `beforeEach`를 공유(S2 — 불필요한 시간 소모).

**FIX**

```ts
// tests/fixtures/base.ts
import { test as base, expect, type Page, type APIRequestContext } from '@playwright/test';
import { mockApi } from './network';
import { createTestOrg, deleteTestOrg, type TestOrg } from './data';

type Fixtures = {
  /** 콘솔 오류를 수집하고 테스트 종료 시 검증한다 */
  consoleErrors: string[];
  /** 인증된 페이지 (member 권한) */
  memberPage: Page;
  /** 인증된 페이지 (admin 권한) */
  adminPage: Page;
  /** 워커별 격리된 조직 데이터 */
  org: TestOrg;
  /** 인증 헤더가 붙은 API 클라이언트 */
  api: APIRequestContext;
};

type WorkerFixtures = {
  /** 워커 단위로 한 번만 만들고 재사용하는 조직 */
  workerOrg: TestOrg;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));

    await use(errors);

    const IGNORABLE = [
      /ResizeObserver loop completed/,
      /Download the React DevTools/,
    ];
    const real = errors.filter(e => !IGNORABLE.some(re => re.test(e)));
    expect(real, `콘솔 오류 발생:\n${real.join('\n')}`).toEqual([]);
  },

  // 워커 단위 픽스처 — 워커당 1회만 실행
  workerOrg: [async ({}, use, workerInfo) => {
    const org = await createTestOrg({ suffix: `w${workerInfo.workerIndex}` });
    await use(org);
    await deleteTestOrg(org.id);
  }, { scope: 'worker' }],

  org: async ({ workerOrg }, use) => {
    await use(workerOrg);
  },

  memberPage: async ({ browser, consoleErrors }, use) => {
    const context = await browser.newContext({ storageState: 'tests/.auth/member.json' });
    const page = await context.newPage();
    await mockApi(page);
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
```

```ts
// ✅ 테스트는 필요한 것만 선언한다
import { test, expect } from '../fixtures/base';

test('관리자가 멤버를 삭제한다', async ({ adminPage, org }) => {
  await adminPage.goto(`/orgs/${org.slug}/members`);
  // …
});

test('일반 멤버는 삭제 버튼을 볼 수 없다', async ({ memberPage, org }) => {
  await memberPage.goto(`/orgs/${org.slug}/members`);
  await expect(memberPage.getByRole('button', { name: '삭제' })).toHaveCount(0);
});
```

픽스처는 **선언한 테스트에서만 실행**된다. `adminPage`를 선언하지 않은 테스트는 관리자 컨텍스트를 만들지 않으므로 시간이 절약된다. 이것이 `beforeEach`보다 나은 핵심 이유다.

**BAD**

```ts
// ❌ 모든 테스트가 무거운 준비를 공유 — 필요 없는 테스트도 비용을 낸다
test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);          // 3초
  await seedLargeDataset();          // 5초
  await page.goto('/dashboard');     // 2초
});

test('로그인 페이지가 렌더된다', async ({ page }) => {
  // 위 10초가 전혀 필요 없는데도 매번 실행된다
  await page.goto('/auth/login');
  await expect(page.getByLabel('이메일')).toBeVisible();
});
```

---

### P-FIX-02 — 픽스처 스코프 선택

**WHY**
매 테스트마다 테스트 조직을 만들고 지우면 안전하지만 느리다. 워커당 한 번만 만들면 빠르지만 테스트 간 간섭 위험이 생긴다. 스코프 선택은 **안전성과 속도의 트레이드오프**이며, 데이터 성격에 따라 달라야 한다.

| 스코프 | 생성 횟수 | 적합한 데이터 |
|--------|-----------|---------------|
| `test` (기본) | 테스트마다 | 테스트가 변경하는 데이터 (멤버, 주문) |
| `worker` | 워커당 1회 | 읽기 전용 또는 컨테이너 데이터 (조직, 계정) |

**DETECT**

```bash
rg -n "scope: 'worker'" tests
rg -n "beforeAll|afterAll" tests
rg -A10 "test\.extend" tests/fixtures | rg "scope"
```

**진단**

```bash
# 픽스처 생성 시간이 전체에서 차지하는 비중
pnpm playwright test tests/e2e --reporter=list 2>&1 | rg "passed|failed"
# 개별 테스트 시간을 보고 준비 비용이 큰지 판단
```

**PASS / FAIL**

- PASS: 변경되는 데이터는 test 스코프, 컨테이너/읽기 전용은 worker 스코프다. 스코프 선택 근거가 명확하다.
- FAIL: 모두 test 스코프로 느림(S3), 변경 데이터를 worker 스코프로 공유해 간섭(S1).

**FIX**

```ts
// ✅ 계층별로 스코프를 나눈다
export const test = base.extend<Fixtures, WorkerFixtures>({
  // 워커 스코프: 컨테이너. 테스트가 삭제하지 않는다.
  workerOrg: [async ({}, use, workerInfo) => {
    const org = await api.createOrg({ name: `E2E Org W${workerInfo.workerIndex}` });
    await use(org);
    await api.deleteOrg(org.id);   // 워커 종료 시 정리
  }, { scope: 'worker' }],

  // 테스트 스코프: 테스트가 CRUD하는 대상
  member: async ({ workerOrg }, use, testInfo) => {
    const member = await api.createMember({
      orgId: workerOrg.id,
      email: `member-${testInfo.testId}@example.test`,
    });
    await use(member);
    // 테스트가 삭제했을 수도 있으므로 실패를 무시한다
    await api.deleteMember(member.id).catch(() => {});
  },
});
```

```ts
test('멤버를 삭제하면 목록에서 사라진다', async ({ adminPage, workerOrg, member }) => {
  await adminPage.goto(`/orgs/${workerOrg.slug}/members`);

  const row = adminPage.getByRole('row', { name: new RegExp(member.email) });
  await row.getByRole('button', { name: '삭제' }).click();
  await adminPage.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

  await expect(row).toHaveCount(0);
});
```

이 테스트는 자기만의 멤버를 갖고 그것을 삭제하므로, 병렬로 10개가 동시에 실행돼도 서로 간섭하지 않는다.

---

### P-FIX-03 — 테스트 간 상태 누수

**WHY**
테스트 A가 만든 데이터, 변경한 설정, 남긴 쿠키가 테스트 B에 영향을 주면, 순서가 바뀌거나 병렬로 실행될 때 실패한다. 더 나쁜 것은 **A와 함께 실행할 때만 B가 통과**하는 경우다. B 단독으로는 실패하는데 아무도 모른다.

**DETECT**

```bash
rg -n "test\.describe\.serial" tests             # 순서 의존 선언
rg -n "beforeAll" tests -A8 | rg "create|insert|seed"
rg -n "localStorage|sessionStorage|cookie" tests | head -20
rg -n "test\.describe\.configure" tests
```

`describe.serial`은 순서 의존을 인정한 것이므로, 정당한 사유가 없으면 결함이다.

**진단**

```bash
# 1. 임의 순서 실행 — 순서 의존을 드러낸다
pnpm playwright test tests/e2e --shuffle

# 2. 각 테스트를 단독 실행 — 선행 의존을 드러낸다
pnpm playwright test tests/e2e/members.spec.ts --grep "멤버를 삭제하면"

# 3. 워커 1개로 순차 실행과 병렬 실행 결과 비교
pnpm playwright test tests/e2e --workers=1
pnpm playwright test tests/e2e --workers=4
```

세 결과가 모두 같아야 한다.

**PASS / FAIL**

- PASS: `--shuffle` 실행에서 전부 통과한다. 각 테스트가 단독으로 통과한다. 워커 수를 바꿔도 결과가 같다.
- FAIL: 순서 의존(S1 — 신뢰 불가), 단독 실행 실패(S1), 병렬에서만 실패(S1).

**FIX**

```ts
// ❌ 테스트 간 데이터 공유 — 순서에 의존
let createdMemberId: string;

test('멤버를 생성한다', async ({ adminPage }) => {
  await adminPage.goto('/settings/members');
  await adminPage.getByRole('button', { name: '초대' }).click();
  await adminPage.getByLabel('이메일').fill('new@example.test');
  await adminPage.getByRole('button', { name: '보내기' }).click();
  createdMemberId = await adminPage.getByTestId('new-member-id').innerText();
});

test('멤버를 삭제한다', async ({ adminPage }) => {
  // createdMemberId가 없으면 실패 — 앞 테스트에 의존
  await adminPage.goto(`/settings/members/${createdMemberId}`);
  // …
});
```

```ts
// ✅ 각 테스트가 자기 데이터를 준비한다
test('멤버를 생성하면 목록에 나타난다', async ({ adminPage, org }) => {
  const email = `new-${crypto.randomUUID()}@example.test`;

  await adminPage.goto(`/orgs/${org.slug}/members`);
  await adminPage.getByRole('button', { name: '초대' }).click();
  await adminPage.getByLabel('이메일').fill(email);
  await adminPage.getByRole('button', { name: '보내기' }).click();

  await expect(adminPage.getByRole('row', { name: new RegExp(email) })).toBeVisible();
});

test('멤버를 삭제하면 목록에서 사라진다', async ({ adminPage, org, member }) => {
  // member 픽스처가 API로 미리 만들어 둔다 — UI를 거치지 않아 빠르고 안정적
  await adminPage.goto(`/orgs/${org.slug}/members`);

  const row = adminPage.getByRole('row', { name: new RegExp(member.email) });
  await row.getByRole('button', { name: '삭제' }).click();
  await adminPage.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

  await expect(row).toHaveCount(0);
});
```

**준비는 API로, 검증은 UI로.** 삭제 테스트를 위해 UI로 멤버를 만들면 생성 기능이 깨졌을 때 삭제 테스트도 함께 실패해 원인 파악이 어려워진다.

**브라우저 상태 초기화**

Playwright는 테스트마다 새 `BrowserContext`를 만들므로 쿠키·스토리지가 자동으로 격리된다. 문제는 `storageState`로 공유하는 경우다.

```ts
// ✅ 로그인 상태는 공유하되 앱 상태는 초기화
memberPage: async ({ browser }, use) => {
  const context = await browser.newContext({ storageState: 'tests/.auth/member.json' });
  const page = await context.newPage();

  // 앱 고유 localStorage 상태 초기화 (온보딩 완료 플래그, 배너 닫기 등)
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('onboarding-dismissed');
      localStorage.removeItem('banner-closed');
      sessionStorage.clear();
    } catch {}
  });

  await use(page);
  await context.close();
},
```

**describe.serial 사용 기준**

```ts
// ✅ 정당한 경우: 본질적으로 순차적인 여정
// 다단계 위저드처럼 앞 단계 없이 뒤 단계가 성립하지 않을 때
test.describe.serial('온보딩 위저드', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext()).newPage();
  });
  test.afterAll(async () => { await page.close(); });

  test('1단계: 조직 정보 입력', async () => { /* … */ });
  test('2단계: 팀원 초대', async () => { /* … */ });
  test('3단계: 완료', async () => { /* … */ });
});
```

이 경우에도 **전체를 하나의 테스트로 합치는 것**이 더 나은 선택인 경우가 많다. 중간 단계가 실패하면 어차피 나머지가 skip되므로 분리 이득이 적다.

---

### P-FIX-04 — 정리(Cleanup) 보장

**WHY**
테스트가 만든 데이터를 정리하지 않으면 (a) DB가 무한히 커지고, (b) 목록 테스트가 예상과 다른 개수를 보며, (c) 유니크 제약에 걸린다. 그런데 테스트가 중간에 실패하면 정리 코드가 실행되지 않는 경우가 있다.

**DETECT**

```bash
rg -n "afterEach|afterAll" tests | wc -l
rg -n "delete|cleanup|teardown" tests/fixtures | head -20
rg -n "test\.afterEach" tests -A6 | rg "catch|try"
```

**진단**

```bash
# 테스트 전후 데이터 개수 비교
psql -c "SELECT count(*) FROM members WHERE email LIKE '%@example.test'"
pnpm playwright test tests/e2e/members.spec.ts
psql -c "SELECT count(*) FROM members WHERE email LIKE '%@example.test'"
# 증가했다면 정리 누락
```

**PASS / FAIL**

- PASS: 픽스처의 `use()` 이후 코드로 정리가 보장된다. 실패 시에도 정리된다. 잔여 데이터를 주기적으로 청소하는 수단이 있다.
- FAIL: 정리 없음(S2 — 데이터 누적), 실패 시 정리 누락(S3), 정리 실패가 테스트 실패로 오인됨(S3).

**FIX**

```ts
// ✅ 픽스처의 use() 이후는 테스트 실패 여부와 무관하게 실행된다
member: async ({ org }, use, testInfo) => {
  const member = await api.createMember({ orgId: org.id, email: uniqueEmail(testInfo) });

  await use(member);

  // 여기는 테스트가 실패해도 실행된다
  try {
    await api.deleteMember(member.id);
  } catch (e) {
    // 테스트가 이미 삭제했을 수 있다. 정리 실패로 테스트를 실패시키지 않는다.
    console.warn(`멤버 정리 실패 (무시): ${member.id}`, e);
  }
},
```

정리 실패를 테스트 실패로 만들면, 실제 결함과 정리 문제를 구분할 수 없게 된다. 경고만 남긴다.

```ts
// tests/setup/global.teardown.ts — 잔여 데이터 일괄 정리
import { test as teardown } from '@playwright/test';

teardown('테스트 데이터 정리', async ({ request }) => {
  const res = await request.delete('/api/test/cleanup', {
    headers: { 'x-test-secret': process.env.TEST_SECRET! },
    data: { olderThanMinutes: 60, emailPattern: '%@example.test' },
  });
  console.log('정리 결과:', await res.json());
});
```

```ts
// 또는 실행 ID로 태깅해 정확히 정리
const RUN_ID = process.env.PLAYWRIGHT_RUN_ID ?? `local-${Date.now()}`;

// 생성 시 태깅
await api.createMember({ email, metadata: { e2eRunId: RUN_ID } });

// teardown에서 해당 실행 데이터만 삭제
await request.delete('/api/test/cleanup', { data: { e2eRunId: RUN_ID } });
```

실행 ID 태깅은 여러 CI 실행이 동시에 돌 때 서로의 데이터를 지우는 사고를 막는다.

---

### P-FIX-05 — 자동 픽스처와 강제 검증

**WHY**
콘솔 오류 검사, 접근성 검사, 성능 측정 같은 횡단 관심사는 개별 테스트에 넣으면 반드시 누락된다. `auto: true` 픽스처를 쓰면 선언하지 않아도 모든 테스트에 적용되어 누락이 구조적으로 불가능해진다.

**DETECT**

```bash
rg -n "auto: true" tests/fixtures
rg -n "on\('console'\)|on\('pageerror'\)" tests | wc -l
rg -c "^\s*test\(" tests/e2e | awk -F: '{s+=$2} END {print "tests: "s}'
```

콘솔 오류 검사가 테스트 수보다 훨씬 적으면 누락이 있다.

**PASS / FAIL**

- PASS: 콘솔 오류·페이지 오류 검사가 모든 테스트에 자동 적용된다. 무시 목록이 명시적이다.
- FAIL: 일부 테스트만 검사(S3), 검사 없음(S2 — 런타임 오류를 통과시킴).

**FIX**

```ts
// tests/fixtures/base.ts
export const test = base.extend<Fixtures>({
  // auto: true → 선언하지 않아도 모든 테스트에서 실행된다
  pageGuard: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', m => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}\n${e.stack ?? ''}`));
    page.on('requestfailed', r => {
      const failure = r.failure()?.errorText ?? '';
      // 의도적 abort는 제외
      if (!/ERR_ABORTED|net::ERR_FAILED/.test(failure)) {
        failedRequests.push(`${r.method()} ${r.url()} — ${failure}`);
      }
    });

    await use();

    // 테스트가 이미 실패했다면 추가 실패로 원인을 흐리지 않는다
    if (testInfo.status !== testInfo.expectedStatus) return;

    const IGNORABLE = [
      /ResizeObserver loop completed with undelivered notifications/,
      /Download the React DevTools/,
      /\[Fast Refresh\]/,
    ];
    const realErrors = errors.filter(e => !IGNORABLE.some(re => re.test(e)));

    expect(realErrors, `콘솔/페이지 오류:\n${realErrors.join('\n---\n')}`).toEqual([]);
    expect(failedRequests, `실패한 요청:\n${failedRequests.join('\n')}`).toEqual([]);
  }, { auto: true }],
});
```

`testInfo.status !== testInfo.expectedStatus` 체크가 중요하다. 테스트가 이미 실패했는데 콘솔 오류까지 보고하면, 진짜 원인이 두 번째 실패에 가려진다.

```ts
// ✅ 특정 테스트에서만 오류를 허용해야 할 때
test('의도적 오류 상황에서 UI가 복구된다', async ({ page }) => {
  test.info().annotations.push({ type: 'allow-console-errors', description: 'API 500 테스트' });
  // 픽스처에서 이 annotation을 확인해 검사를 건너뛴다
});
```

---

## 10. 인증과 세션

### P-AUTH-01 — storageState 재사용

**WHY**
테스트마다 UI로 로그인하면 (a) 테스트당 3~5초가 추가되고, (b) 로그인 화면이 바뀌면 전 테스트가 깨지며, (c) 로그인 자체의 실패와 대상 기능의 실패를 구분할 수 없다. 40개 테스트 × 4초 = 160초가 순수 로그인 시간이다.

**DETECT**

```bash
rg -n "getByLabel\('비밀번호'\)|password.*fill" tests | wc -l
rg -n "storageState" playwright.config.* tests
rg -n "login\(|signIn\(" tests | wc -l
fd . tests/.auth 2>/dev/null
```

로그인 코드가 테스트 수만큼 있으면 즉시 개선 대상이다.

**PASS / FAIL**

- PASS: 인증이 setup 프로젝트에서 1회 수행되고 `storageState`로 재사용된다. 로그인 자체를 검증하는 테스트만 UI 로그인을 한다.
- FAIL: 매 테스트 UI 로그인(S2 — 시간 낭비 + 취약), 하드코딩 자격증명(**S0**).

**FIX**

```ts
// tests/setup/global.setup.ts
import { test as setup, expect } from '@playwright/test';
import { env } from '../utils/env';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '../.auth');

setup('member 인증 상태 생성', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('이메일').fill(env.TEST_USER_EMAIL);
  await page.getByLabel('비밀번호').fill(env.TEST_USER_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();

  // 로그인 완료를 확실히 확인한 뒤 저장한다
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole('button', { name: /계정 메뉴/ })).toBeVisible();

  await page.context().storageState({ path: path.join(AUTH_DIR, 'member.json') });
});

setup('admin 인증 상태 생성', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('이메일').fill(env.TEST_ADMIN_EMAIL);
  await page.getByLabel('비밀번호').fill(env.TEST_ADMIN_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole('link', { name: '관리자' })).toBeVisible();

  await page.context().storageState({ path: path.join(AUTH_DIR, 'admin.json') });
});
```

**저장 전 검증이 중요하다.** 로그인이 실패했는데 그 상태를 저장하면, 모든 후속 테스트가 비인증 상태로 실행되어 원인 불명의 실패가 쏟아진다.

```ts
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /setup\/global\.setup\.ts/ },
  {
    name: 'e2e',
    dependencies: ['setup'],
    use: { storageState: 'tests/.auth/member.json' },
  },
],
```

**더 빠른 방법: API 로그인**

UI를 거치지 않으면 3초가 300ms가 된다.

```ts
setup('API로 인증 상태 생성', async ({ request, browser }) => {
  const res = await request.post('/api/auth/login', {
    data: { email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD },
  });
  expect(res.ok(), `로그인 실패: ${res.status()}`).toBe(true);

  // 응답의 Set-Cookie를 컨텍스트에 적용
  const context = await browser.newContext();
  await context.request.post('/api/auth/login', {
    data: { email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD },
  });
  await context.storageState({ path: 'tests/.auth/member.json' });
  await context.close();
});
```

단, **로그인 플로우 자체를 검증하는 E2E 테스트는 반드시 UI로 수행해야 한다.** API 로그인만 쓰면 로그인 화면이 깨져도 아무도 모른다.

```ts
// tests/e2e/journeys/auth.spec.ts
test.use({ storageState: { cookies: [], origins: [] } });   // 비인증 상태로 시작

test('사용자가 UI로 로그인한다', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('이메일').fill(env.TEST_USER_EMAIL);
  await page.getByLabel('비밀번호').fill(env.TEST_USER_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

---

### P-AUTH-02 — 역할별 세션 관리

**WHY**
권한 테스트는 여러 역할이 필요하다. 역할마다 로그인 코드를 복사하면 중복이 늘고, 하나의 storageState만 쓰면 권한 차이를 검증할 수 없다. 또 한 테스트 안에서 두 역할이 상호작용하는 시나리오(초대 → 수락)도 필요하다.

**DETECT**

```bash
fd . tests/.auth 2>/dev/null
rg -n "storageState:" playwright.config.* tests | sort -u
rg -n "admin|member|viewer|guest" tests/fixtures
rg -n "권한|permission|role" tests | head -20
```

**PASS / FAIL**

- PASS: 역할별 storageState가 있고 픽스처로 노출된다. 다중 역할 시나리오를 위한 컨텍스트 생성 수단이 있다.
- FAIL: 단일 역할만 테스트(S2 — 권한 회귀 미탐지), 역할 전환마다 재로그인(S3).

**FIX**

```ts
// tests/fixtures/auth.ts
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'node:path';

export type Role = 'admin' | 'member' | 'viewer';

const STATE_PATH = (role: Role) =>
  path.join(__dirname, `../.auth/${role}.json`);

type AuthFixtures = {
  adminPage: Page;
  memberPage: Page;
  viewerPage: Page;
  /** 임의 역할의 새 컨텍스트를 만든다 (다중 사용자 시나리오) */
  contextAs: (role: Role) => Promise<{ context: BrowserContext; page: Page }>;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: STATE_PATH('admin') });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  memberPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: STATE_PATH('member') });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  viewerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: STATE_PATH('viewer') });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  contextAs: async ({ browser }, use) => {
    const created: BrowserContext[] = [];

    await use(async (role: Role) => {
      const context = await browser.newContext({ storageState: STATE_PATH(role) });
      created.push(context);
      const page = await context.newPage();
      return { context, page };
    });

    await Promise.all(created.map(c => c.close()));
  },
});
```

```ts
// ✅ 권한 매트릭스 테스트
const PERMISSION_MATRIX = [
  { role: 'admin'  as const, canInvite: true,  canDelete: true,  canBilling: true },
  { role: 'member' as const, canInvite: true,  canDelete: false, canBilling: false },
  { role: 'viewer' as const, canInvite: false, canDelete: false, canBilling: false },
];

for (const { role, canInvite, canDelete, canBilling } of PERMISSION_MATRIX) {
  test(`${role} 권한 UI 노출`, async ({ contextAs }) => {
    const { page } = await contextAs(role);
    await page.goto('/settings/members');

    const invite = page.getByRole('button', { name: '멤버 초대' });
    await expect(invite, `${role}의 초대 버튼`).toHaveCount(canInvite ? 1 : 0);

    const del = page.getByRole('button', { name: '삭제' });
    await expect(del.first(), `${role}의 삭제 버튼`)
      .toBeVisible({ visible: canDelete });

    const billing = page.getByRole('link', { name: '결제' });
    await expect(billing, `${role}의 결제 링크`).toHaveCount(canBilling ? 1 : 0);
  });
}
```

UI 노출만 검증하면 부족하다. **서버가 실제로 차단하는지**를 API 테스트로 함께 확인한다.

```ts
// tests/api/permissions.api.spec.ts
for (const { role, canDelete } of PERMISSION_MATRIX) {
  test(`${role}의 삭제 API 권한`, async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      storageState: `tests/.auth/${role}.json`,
    });
    const res = await ctx.delete(`/api/members/${TEST_MEMBER_ID}`);
    expect(res.status()).toBe(canDelete ? 204 : 403);
    await ctx.dispose();
  });
}
```

UI에서 버튼을 숨기는 것은 편의이고, 실제 보안은 서버에 있다. 둘 다 검증해야 한다.

---

### P-AUTH-03 — 세션 만료와 갱신

**WHY**
`storageState`에 저장된 세션은 시간이 지나면 만료된다. 스위트 실행이 20분 걸리는데 세션이 15분이면 후반부 테스트가 전부 실패한다. 또 세션 만료 시 앱의 동작(로그인 화면으로 리디렉션, 데이터 유실 방지)도 검증 대상이다.

**DETECT**

```bash
rg -n "maxAge|expires|JWT_EXPIRES|SESSION_TIMEOUT" src backend .env.example 2>/dev/null
rg -n "401|unauthorized|세션이 만료" src tests | head -20
rg -n "refresh.*token|refreshToken" src | head
```

**진단**

```bash
# 세션 수명과 스위트 실행 시간을 비교
pnpm playwright test tests/e2e --reporter=list 2>&1 | tail -3
# 실행 시간 > 세션 수명이면 위험
```

```ts
// storageState의 쿠키 만료 시각 확인
import fs from 'node:fs';
const state = JSON.parse(fs.readFileSync('tests/.auth/member.json', 'utf8'));
for (const c of state.cookies) {
  if (c.expires > 0) {
    console.log(c.name, new Date(c.expires * 1000).toISOString());
  }
}
```

**PASS / FAIL**

- PASS: 세션 수명이 스위트 실행 시간보다 충분히 길거나, 만료 시 자동 갱신된다. 세션 만료 UX가 별도로 테스트된다.
- FAIL: 실행 중 세션 만료로 후반 실패(S1), 만료 UX 미검증(S2).

**FIX**

```ts
// ✅ 테스트 환경에서 세션 수명을 길게 (프로덕션과 분리)
// .env.test
SESSION_MAX_AGE=86400
```

```ts
// ✅ 또는 setup에서 만료 여부를 확인하고 필요 시 재생성
setup('인증 상태 생성 또는 갱신', async ({ page }) => {
  const statePath = 'tests/.auth/member.json';

  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const sessionCookie = state.cookies.find((c: any) => c.name === 'session');
    const expiresAt = (sessionCookie?.expires ?? 0) * 1000;
    // 30분 이상 남아 있으면 재사용
    if (expiresAt - Date.now() > 30 * 60 * 1000) {
      console.log('기존 인증 상태 재사용');
      return;
    }
  }

  // 재생성
  await page.goto('/auth/login');
  // …
});
```

세션 만료 UX는 별도 테스트로 검증한다.

```ts
test('세션 만료 시 로그인 화면으로 안내하고 원래 목적지를 기억한다', async ({ page }) => {
  await page.goto('/settings/members');
  await expect(page.getByRole('heading', { name: '멤버' })).toBeVisible();

  // 세션 쿠키 제거로 만료 시뮬레이션
  await page.context().clearCookies({ name: 'session' });

  // 보호된 액션 시도
  await page.getByRole('button', { name: '멤버 초대' }).click();

  await expect(page).toHaveURL(/\/auth\/login/);
  // 원래 목적지가 보존되는가
  expect(page.url()).toContain('redirect=%2Fsettings%2Fmembers');
  await expect(page.getByRole('alert')).toContainText(/세션이 만료|다시 로그인/);
});
```

---

### P-AUTH-04 — OAuth와 외부 인증

**WHY**
Google/Kakao 로그인을 실제로 수행하면 (a) 봇 감지에 걸리고, (b) 2FA 요구가 발생하며, (c) 외부 서비스 장애에 스위트가 좌우되고, (d) 계정 잠금 위험이 있다. 그러나 전부 우회하면 OAuth 연동이 깨져도 모른다.

**DETECT**

```bash
rg -n "next-auth|authjs|oauth|signIn\(" src | head -20
rg -n "google|kakao|naver|github" src/app/api/auth 2>/dev/null | head
rg -n "accounts.google.com|kauth.kakao.com" tests
```

**PASS / FAIL**

- PASS: 일상 스위트는 OAuth를 우회(세션 직접 주입 또는 모킹)하고, 별도 스위트가 실제 플로우를 주기적으로 검증한다.
- FAIL: 일상 스위트에서 실제 OAuth 수행(S2 — 불안정), 우회만 있고 실 검증 없음(S2).

**FIX**

```ts
// ✅ 방법 A: 테스트 전용 인증 엔드포인트로 세션 주입
// app/api/test/session/route.ts — 프로덕션 차단 필수
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  if (req.headers.get('x-test-secret') !== process.env.TEST_SECRET) {
    return new Response(null, { status: 404 });
  }

  const { userId } = await req.json();
  const session = await createSession(userId);
  return new Response(null, {
    status: 204,
    headers: { 'Set-Cookie': serializeSessionCookie(session) },
  });
}
```

```ts
setup('OAuth 사용자 세션 주입', async ({ request, browser }) => {
  const context = await browser.newContext();
  await context.request.post('/api/test/session', {
    headers: { 'x-test-secret': env.TEST_SECRET },
    data: { userId: 'oauth-test-user-id' },
  });
  await context.storageState({ path: 'tests/.auth/oauth-user.json' });
  await context.close();
});
```

```ts
// ✅ 방법 B: OAuth 제공자 응답을 모킹
test('Google 로그인 플로우', async ({ page }) => {
  // 인가 코드 콜백을 가로채 성공 응답으로 대체
  await page.route('**/api/auth/callback/google*', async route => {
    await route.fulfill({
      status: 302,
      headers: {
        location: '/dashboard',
        'set-cookie': `session=${TEST_SESSION_TOKEN}; Path=/; HttpOnly`,
      },
    });
  });

  await page.goto('/auth/login');
  await page.getByRole('button', { name: 'Google로 계속하기' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

```ts
// ✅ 실제 OAuth는 별도 스위트에서 수동 트리거
// tests/integration/oauth.spec.ts
test.describe('실제 OAuth 연동', () => {
  test.skip(!process.env.RUN_OAUTH_TESTS, 'OAuth 테스트는 수동 실행');
  test.describe.configure({ retries: 0, timeout: 120_000 });

  test('Google 계정으로 로그인한다', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Google로 계속하기' }).click();

    await page.waitForURL(/accounts\.google\.com/);
    await page.getByLabel('이메일 또는 휴대전화').fill(env.GOOGLE_TEST_EMAIL);
    await page.getByRole('button', { name: '다음' }).click();
    await page.getByLabel('비밀번호 입력').fill(env.GOOGLE_TEST_PASSWORD);
    await page.getByRole('button', { name: '다음' }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  });
});
```

OAuth 제공자의 UI는 예고 없이 바뀌므로 이 테스트는 본질적으로 취약하다. 일상 CI에서 제외하고 릴리스 전 수동 실행으로 운영한다.

---

### P-AUTH-05 — 인증 상태 파일 보안

**WHY**
`storageState` 파일에는 실제 세션 토큰이 들어 있다. 커밋하면 저장소 히스토리에 영구히 남고, 프로덕션 계정 토큰이라면 즉시 침해다. CI 아티팩트에 포함되면 다운로드 가능한 상태가 된다.

**DETECT**

```bash
git ls-files | rg "\.auth|storageState|session\.json"
rg -n "auth|storageState" .gitignore
git log --all --full-history -- "tests/.auth/*" | head
rg -n "path: .*\.json" playwright.config.* tests/setup

# CI 아티팩트에 포함되는지
rg -n "upload-artifact" .github/workflows/*.yml -A6
```

**PASS / FAIL**

- PASS: `tests/.auth/`가 gitignore에 있고 히스토리에도 없다. CI 아티팩트에 포함되지 않는다. 테스트 계정이 프로덕션과 분리되어 있다.
- FAIL: 인증 상태 커밋(**S0** — 자격증명 유출), CI 아티팩트 포함(S1), 프로덕션 계정 사용(**S0**).

**FIX**

```gitignore
# .gitignore
tests/.auth/
**/storageState.json
.env.test
.env.test.local
test-results/
playwright-report/
blob-report/
```

```yaml
# CI 아티팩트에서 제외
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: |
      playwright-report/
      !**/.auth/**
      !**/*storageState*
```

이미 커밋되었다면 히스토리에서 제거하고 **해당 계정의 세션을 즉시 무효화**한다.

```bash
# 히스토리 제거 (git-filter-repo 권장)
git filter-repo --path tests/.auth --invert-paths

# 그 후 테스트 계정 비밀번호 변경 + 전체 세션 무효화
```

테스트 계정은 프로덕션에서 접근 불가하도록 분리한다.

```text
[ ] 테스트 계정 이메일이 전용 도메인(@example.test)이다
[ ] 테스트 계정이 프로덕션 DB에 존재하지 않는다
[ ] 테스트 계정 권한이 테스트 조직으로 제한된다
[ ] 테스트 비밀번호가 프로덕션과 다르다
```

---

## 11. 테스트 데이터 관리

### P-DATA-01 — 데이터 전략 선택

**WHY**
데이터 전략은 스위트의 속도·안정성·검증 범위를 동시에 결정한다. 잘못 고르면 병렬 실행에서 충돌하거나, 실제 백엔드 결함을 놓치거나, 매 실행마다 다른 결과가 나온다.

| 전략 | 속도 | 격리 | 백엔드 검증 | 적합한 경우 |
|------|------|------|-------------|-------------|
| **전체 모킹** (`page.route`) | 매우 빠름 | 완벽 | 없음 | 시각 회귀, UI 상태 검증 |
| **시드 DB + 읽기 전용** | 빠름 | 좋음 | 부분 | 목록·조회 화면 |
| **API로 생성/정리** | 보통 | 좋음 | 높음 | CRUD 여정 |
| **UI로 생성** | 느림 | 좋음 | 최고 | 생성 플로우 자체 검증 |
| **공유 데이터** | 빠름 | 나쁨 | 부분 | 권장하지 않음 |

**원칙:** 검증 대상이 아닌 데이터는 API로 준비하고, 검증 대상만 UI로 조작한다.

**DETECT**

```bash
rg -n "page\.route" tests | wc -l
rg -n "prisma|drizzle|db\.|sql" tests | head
rg -n "request\.post|api\.create" tests | wc -l
fd . tests/fixtures/data 2>/dev/null
rg -n "seed|fixture" package.json
```

**PASS / FAIL**

- PASS: 전략이 테스트 목적에 맞게 선택되고 문서화되어 있다. 혼용 시 경계가 명확하다.
- FAIL: 전략 부재로 테스트마다 제각각(S3), 공유 데이터로 병렬 충돌(S1).

**FIX**

```ts
// ✅ 목적별 전략 분리
// 1. 시각/UI 상태 → 전체 모킹
test('빈 상태가 올바르게 표시된다', async ({ page }) => {
  await page.route('**/api/members*', r => r.fulfill({ json: { rows: [], total: 0 } }));
  await page.goto('/settings/members');
  await expect(page.getByText('아직 멤버가 없습니다')).toBeVisible();
});

// 2. CRUD 여정 → API 준비 + UI 조작 + API 검증
test('멤버 권한을 변경하면 서버에 반영된다', async ({ adminPage, org, api }) => {
  const member = await api.createMember({ orgId: org.id, role: 'member' });

  await adminPage.goto(`/orgs/${org.slug}/members`);
  const row = adminPage.getByRole('row', { name: new RegExp(member.email) });
  await row.getByRole('button', { name: '권한 변경' }).click();
  await adminPage.getByRole('option', { name: '관리자' }).click();
  await expect(adminPage.getByRole('status')).toContainText('변경되었습니다');

  // UI 표시만 믿지 않고 서버 상태를 확인한다
  const updated = await api.getMember(member.id);
  expect(updated.role).toBe('admin');
});

// 3. 생성 플로우 자체 → UI로 생성
test('초대 폼으로 멤버를 추가한다', async ({ adminPage, org }) => {
  await adminPage.goto(`/orgs/${org.slug}/members`);
  await adminPage.getByRole('button', { name: '멤버 초대' }).click();
  // … UI 전체 플로우
});
```

**UI 표시와 서버 상태를 모두 검증**하는 것이 E2E의 가치다. UI만 보면 낙관적 업데이트가 실패해도 통과할 수 있다.

---

### P-DATA-02 — 병렬 실행 데이터 격리

**WHY**
워커 4개가 동시에 같은 조직의 멤버 목록을 조작하면, A가 만든 멤버를 B가 세고, C가 삭제한 멤버를 D가 찾는다. 결과는 무작위 실패다. 격리 없이 병렬 실행하는 것은 flaky를 보장하는 가장 확실한 방법이다.

**DETECT**

```bash
rg -n "fullyParallel" playwright.config.*
rg -n "workerIndex|parallelIndex|testId" tests
rg -n "toHaveCount\([0-9]+\)" tests | head -20      # 절대 개수 어설션 = 충돌 위험
rg -n "example\.(com|test)" tests | rg -v "uuid|Date\.now|workerIndex" | head
```

고정 이메일 주소를 쓰는 테스트는 병렬에서 유니크 제약에 걸린다.

**진단**

```bash
# 병렬과 순차 결과 비교
pnpm playwright test tests/e2e --workers=1 --reporter=list > /tmp/serial.txt
pnpm playwright test tests/e2e --workers=4 --reporter=list > /tmp/parallel.txt
diff <(rg "✓|✘" /tmp/serial.txt) <(rg "✓|✘" /tmp/parallel.txt)
```

**PASS / FAIL**

- PASS: 각 테스트가 고유 데이터 네임스페이스를 갖는다. 워커 수를 바꿔도 결과가 같다.
- FAIL: 병렬에서만 실패(S1), 절대 개수 어설션으로 충돌(S2), 고정 식별자로 유니크 위반(S2).

**FIX**

```ts
// tests/fixtures/data.ts
import type { TestInfo } from '@playwright/test';

/** 테스트마다 충돌하지 않는 고유 식별자 */
export function uniqueId(testInfo: TestInfo, prefix = 'e2e') {
  // 워커 인덱스 + 테스트 ID + 타임스탬프
  return `${prefix}-w${testInfo.workerIndex}-${testInfo.testId.slice(0, 8)}-${Date.now().toString(36)}`;
}

export function uniqueEmail(testInfo: TestInfo, prefix = 'user') {
  return `${uniqueId(testInfo, prefix)}@example.test`;
}
```

```ts
// ✅ 워커별 조직 + 테스트별 멤버
export const test = base.extend<Fixtures, WorkerFixtures>({
  workerOrg: [async ({}, use, workerInfo) => {
    const org = await api.createOrg({
      name: `E2E W${workerInfo.workerIndex}`,
      slug: `e2e-w${workerInfo.workerIndex}-${Date.now().toString(36)}`,
    });
    await use(org);
    await api.deleteOrg(org.id).catch(() => {});
  }, { scope: 'worker' }],

  member: async ({ workerOrg }, use, testInfo) => {
    const member = await api.createMember({
      orgId: workerOrg.id,
      email: uniqueEmail(testInfo, 'member'),
    });
    await use(member);
    await api.deleteMember(member.id).catch(() => {});
  },
});
```

**절대 개수 어설션 회피**

```ts
// ❌ 다른 테스트가 멤버를 추가하면 실패한다
await expect(page.getByRole('row')).toHaveCount(11);

// ✅ 자기 데이터의 존재만 확인
await expect(page.getByRole('row', { name: new RegExp(member.email) })).toBeVisible();

// ✅ 개수가 중요하다면 격리된 컨테이너 안에서
const orgRows = page.getByTestId(`org-${org.id}-members`).getByRole('row');
await expect(orgRows).toHaveCount(3);   // 이 조직은 이 테스트만 사용
```

---

### P-DATA-03 — 시드 데이터 관리

**WHY**
목록·검색·페이지네이션 테스트에는 일정량의 데이터가 필요하다. 매번 API로 50건을 만들면 느리고, 개발 DB를 그대로 쓰면 데이터가 바뀔 때 테스트가 깨진다. 시드는 **결정적이고 재현 가능**해야 한다.

**DETECT**

```bash
rg -n "seed" package.json prisma 2>/dev/null
fd "seed*" prisma scripts src 2>/dev/null
rg -n "faker\." tests src | head -20
rg -n "Math\.random|Date\.now" tests/fixtures | head
```

`faker`를 시드에 쓰면서 seed 값을 고정하지 않으면 매번 다른 데이터가 생성된다.

**PASS / FAIL**

- PASS: 시드가 결정적(고정 seed 또는 하드코딩)이고, 테스트 전용 네임스페이스에 격리된다. 재실행 가능하다.
- FAIL: 비결정적 시드(S2 — 재현 불가), 개발 데이터 의존(S2), 시드 없이 매번 생성(S3 — 느림).

**FIX**

```ts
// prisma/seed-e2e.ts — 결정적 시드
import { faker } from '@faker-js/faker';

faker.seed(20260730);   // 고정 seed → 항상 같은 데이터

const E2E_ORG_ID = '00000000-0000-4000-8000-000000000001';

export async function seedE2E() {
  // 기존 E2E 데이터 정리 (멱등성)
  await prisma.member.deleteMany({ where: { orgId: E2E_ORG_ID } });
  await prisma.org.deleteMany({ where: { id: E2E_ORG_ID } });

  await prisma.org.create({
    data: {
      id: E2E_ORG_ID,
      name: 'E2E 고정 조직',
      slug: 'e2e-fixed',
      members: {
        create: Array.from({ length: 50 }, (_, i) => ({
          // 결정적 ID로 특정 레코드를 테스트에서 참조 가능하게
          id: `00000000-0000-4000-8000-${String(i + 100).padStart(12, '0')}`,
          email: `seed-${String(i + 1).padStart(3, '0')}@example.test`,
          name: faker.person.fullName(),      // seed 고정이므로 항상 동일
          role: ['admin', 'member', 'viewer'][i % 3],
          createdAt: new Date(2026, 0, 1 + i),
        })),
      },
    },
  });
}
```

```ts
// tests/fixtures/seed-constants.ts — 테스트에서 참조할 상수
export const SEED = {
  ORG_ID: '00000000-0000-4000-8000-000000000001',
  ORG_SLUG: 'e2e-fixed',
  MEMBER_COUNT: 50,
  FIRST_MEMBER_EMAIL: 'seed-001@example.test',
  ADMIN_EMAILS: ['seed-001@example.test', 'seed-004@example.test'],
} as const;
```

```ts
// ✅ 읽기 전용 시나리오에서 시드를 활용
test('멤버 목록이 페이지네이션된다', async ({ adminPage }) => {
  await adminPage.goto(`/orgs/${SEED.ORG_SLUG}/members`);

  await expect(adminPage.getByRole('row')).toHaveCount(21);   // 헤더 + 20건
  await expect(adminPage.getByText(`총 ${SEED.MEMBER_COUNT}명`)).toBeVisible();

  await adminPage.getByRole('button', { name: '다음 페이지' }).click();
  await expect(adminPage.getByRole('row', { name: /seed-021/ })).toBeVisible();
});
```

**시드 데이터는 절대 수정하지 않는다.** 수정이 필요한 테스트는 자기 데이터를 따로 만든다. 이 규칙을 지켜야 시드를 여러 테스트가 안전하게 공유할 수 있다.

```json
// package.json
{
  "scripts": {
    "db:seed:e2e": "tsx prisma/seed-e2e.ts",
    "pretest:e2e": "pnpm db:seed:e2e"
  }
}
```

---

### P-DATA-04 — API 클라이언트 추상화

**WHY**
테스트마다 `request.post('/api/members', { data: {...} })`를 직접 쓰면 (a) API 경로가 바뀔 때 전부 고쳐야 하고, (b) 인증 헤더를 빠뜨리며, (c) 응답 검증을 하지 않아 실패를 늦게 발견한다.

**DETECT**

```bash
rg -n "request\.(get|post|put|delete)" tests | wc -l
rg -o "request\.\w+\(['\"][^'\"]+" tests -r '$1' | sort | uniq -c | sort -rn | head -20
fd "api-client|api\.ts" tests
```

같은 엔드포인트가 여러 파일에서 직접 호출되면 추상화가 필요하다.

**PASS / FAIL**

- PASS: API 호출이 타입 안전한 클라이언트로 통합되고, 실패 시 명확한 오류를 던진다.
- FAIL: 직접 호출 산재(S3), 응답 검증 없음(S2 — 준비 실패를 테스트 실패로 오인).

**FIX**

```ts
// tests/utils/api-client.ts
import { request as pwRequest, type APIRequestContext } from '@playwright/test';
import { z } from 'zod';

const MemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'member', 'viewer']),
  orgId: z.string(),
});
export type Member = z.infer<typeof MemberSchema>;

export class TestApiClient {
  private constructor(private ctx: APIRequestContext) {}

  static async create(role: 'admin' | 'member' = 'admin') {
    const ctx = await pwRequest.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL,
      storageState: `tests/.auth/${role}.json`,
    });
    return new TestApiClient(ctx);
  }

  private async call<T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    schema: z.ZodType<T> | null,
    body?: unknown,
  ): Promise<T> {
    const res = await this.ctx[method](path, body ? { data: body } : undefined);

    if (!res.ok()) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `[TestApiClient] ${method.toUpperCase()} ${path} 실패\n` +
        `  status: ${res.status()}\n` +
        `  body: ${text.slice(0, 500)}`,
      );
    }

    if (!schema) return undefined as T;

    const json = await res.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new Error(
        `[TestApiClient] ${path} 응답 스키마 불일치\n` +
        `  ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n  ')}\n` +
        `  received: ${JSON.stringify(json).slice(0, 300)}`,
      );
    }
    return parsed.data;
  }

  createMember(input: { orgId: string; email: string; role?: Member['role'] }) {
    return this.call('post', '/api/members', MemberSchema, input);
  }

  getMember(id: string) {
    return this.call('get', `/api/members/${id}`, MemberSchema);
  }

  deleteMember(id: string) {
    return this.call('delete', `/api/members/${id}`, null);
  }

  async dispose() {
    await this.ctx.dispose();
  }
}
```

오류 메시지에 method, path, status, body를 모두 담으면 준비 단계 실패를 즉시 진단할 수 있다. 이것이 P-P8의 실천이다.

```ts
// tests/fixtures/base.ts
api: async ({}, use) => {
  const client = await TestApiClient.create('admin');
  await use(client);
  await client.dispose();
},
```

응답 스키마 검증을 넣으면 **API 계약 변경을 테스트 준비 단계에서 잡아낼 수 있다.** 이것은 부수 효과가 아니라 의도된 이득이다.

---

### P-DATA-05 — 테스트 전용 엔드포인트 보안

**WHY**
데이터 준비·정리·세션 주입을 위한 테스트 엔드포인트는 편리하지만, 프로덕션에 노출되면 인증 우회와 데이터 삭제가 가능한 백도어가 된다. 실제 침해 사례가 다수 존재하는 패턴이다.

**DETECT**

```bash
rg -n "api/test|/test/|__test__" src/app/api src/pages/api 2>/dev/null
rg -n "NODE_ENV.*production" src/app/api src/middleware.ts 2>/dev/null
rg -n "x-test-secret|TEST_SECRET" src middleware.ts 2>/dev/null

# 프로덕션에서 실제로 차단되는지 확인
curl -i https://app.example.com/api/test/cleanup
```

**PASS / FAIL**

- PASS: 테스트 엔드포인트가 프로덕션 빌드에서 제거되거나, 환경 + 시크릿 이중 검사로 차단된다. 404를 반환한다(403이 아니라).
- FAIL: 프로덕션에서 접근 가능(**S0** — 백도어), 시크릿 없이 환경 변수만으로 보호(S1).

**FIX**

```ts
// middleware.ts — 1차 차단
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/test/')) {
    const isProd = process.env.NODE_ENV === 'production';
    const secretOk = request.headers.get('x-test-secret') === process.env.TEST_SECRET;
    const secretConfigured = !!process.env.TEST_SECRET && process.env.TEST_SECRET.length >= 16;

    if (isProd || !secretConfigured || !secretOk) {
      // 403이 아니라 404 — 엔드포인트 존재 자체를 숨긴다
      return new NextResponse('Not Found', { status: 404 });
    }
  }
  return NextResponse.next();
}
```

```ts
// app/api/test/cleanup/route.ts — 2차 차단 (심층 방어)
export async function DELETE(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }
  if (req.headers.get('x-test-secret') !== process.env.TEST_SECRET) {
    return new Response('Not Found', { status: 404 });
  }

  const { e2eRunId } = await req.json();
  if (!e2eRunId || typeof e2eRunId !== 'string') {
    return Response.json({ error: 'e2eRunId 필수' }, { status: 400 });
  }

  // 삭제 범위를 엄격히 제한한다
  const deleted = await prisma.member.deleteMany({
    where: {
      metadata: { path: ['e2eRunId'], equals: e2eRunId },
      email: { endsWith: '@example.test' },   // 이중 안전장치
    },
  });

  return Response.json({ deleted: deleted.count });
}
```

**빌드 시점 제거가 가장 안전하다.**

```ts
// next.config.ts — 프로덕션 빌드에서 테스트 라우트 제외
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return { beforeFiles: [{ source: '/api/test/:path*', destination: '/404' }] };
    }
    return [];
  },
};
```

배포 후 반드시 확인한다.

```ts
// tests/e2e/smoke/security.spec.ts
test('테스트 엔드포인트가 프로덕션에서 차단된다', async ({ request }) => {
  test.skip(!process.env.CHECK_PRODUCTION, '프로덕션 대상 검사');

  for (const path of ['/api/test/cleanup', '/api/test/session', '/api/test/emails']) {
    const res = await request.get(`https://app.example.com${path}`);
    expect(res.status(), `${path}가 노출됨`).toBe(404);
  }
});
```

---

## 12. 네트워크 제어

### P-NET-01 — 모킹 범위 결정

**WHY**
전부 모킹하면 빠르고 안정적이지만 백엔드 결함을 전혀 잡지 못한다. 전부 실제로 호출하면 느리고 불안정하다. 무엇을 모킹할지는 **그 테스트가 무엇을 검증하려는가**에 따라 결정된다.

**DETECT**

```bash
rg -n "page\.route" tests | wc -l
rg -o "page\.route\(['\"][^'\"]+" tests -r '$1' | sort | uniq -c | sort -rn
rg -n "route\.continue|route\.fulfill|route\.abort" tests | sort | uniq -c
```

**판단 기준**

| 검증 대상 | 모킹 여부 |
|-----------|-----------|
| UI 상태(빈/로딩/오류) | 모킹 — 재현이 어렵거나 불가능 |
| 사용자 여정 | 실제 — 계층 연결이 검증 대상 |
| 시각 회귀 | 모킹 — 결정론 필요 |
| 서드파티 위젯 | 차단 — 통제 불가 |
| 분석/추적 스크립트 | 차단 — 불필요한 지연 |
| 결제 게이트웨이 | 모킹 또는 샌드박스 |
| 느린 엔드포인트 | 실제 + 타임아웃 조정 |

**PASS / FAIL**

- PASS: 모킹 범위가 테스트 목적과 일치한다. 핵심 여정은 실제 API를 사용한다.
- FAIL: 핵심 여정까지 전부 모킹(S2 — 통합 결함 미탐지), 통제 불가 서드파티를 실제 호출(S2).

**FIX**

```ts
// tests/fixtures/network.ts
const THIRD_PARTY_PATTERNS = [
  '**://*.googletagmanager.com/**',
  '**://*.google-analytics.com/**',
  '**://*.hotjar.com/**',
  '**://*.intercom.io/**',
  '**://*.sentry.io/**',
  '**://*.doubleclick.net/**',
];

/** 항상 차단: 테스트와 무관하고 지연만 유발 */
export async function blockThirdParty(page: Page) {
  for (const pattern of THIRD_PARTY_PATTERNS) {
    await page.route(pattern, route => route.abort());
  }
}

/** 선택적 모킹: 특정 엔드포인트만 */
export async function mockEndpoint<T>(
  page: Page,
  urlPattern: string,
  response: T | ((req: Request) => T),
  options: { status?: number; delayMs?: number } = {},
) {
  await page.route(urlPattern, async route => {
    if (options.delayMs) await new Promise(r => setTimeout(r, options.delayMs));
    const body = typeof response === 'function'
      ? (response as (req: Request) => T)(route.request() as any)
      : response;
    await route.fulfill({ status: options.status ?? 200, json: body as any });
  });
}
```

```ts
// ✅ 목적에 따라 다르게
// UI 상태 검증 → 모킹
test('API 오류 시 재시도 버튼이 나타난다', async ({ page }) => {
  await mockEndpoint(page, '**/api/members*', { error: 'Internal' }, { status: 500 });
  await page.goto('/settings/members');
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
});

// 여정 검증 → 실제 API
test('멤버를 초대하면 실제로 저장된다', async ({ adminPage, org, api }) => {
  await blockThirdParty(adminPage);   // 서드파티만 차단
  await adminPage.goto(`/orgs/${org.slug}/members`);
  // … 실제 API 호출
  const members = await api.listMembers(org.id);
  expect(members.some(m => m.email === email)).toBe(true);
});
```

---

### P-NET-02 — 실패·지연 시나리오 재현

**WHY**
API 실패, 타임아웃, 느린 네트워크는 실제로 발생하지만 재현이 어렵다. 재현하지 않으면 오류 처리 코드가 한 번도 실행되지 않은 채 배포된다. 실제 장애 때 처음 실행되는 코드는 대체로 동작하지 않는다.

**DETECT**

```bash
rg -n "status: (4|5)[0-9][0-9]" tests | wc -l
rg -n "route\.abort" tests | wc -l
rg -n "offline|setOffline" tests
rg -n "catch|error|isError" src --glob "*.tsx" | wc -l
```

제품에 오류 처리가 많은데 테스트에 실패 시나리오가 적으면 공백이다.

**PASS / FAIL**

- PASS: 주요 API마다 실패(500), 인증 만료(401), 권한 없음(403), 타임아웃, 오프라인 시나리오가 커버된다.
- FAIL: 성공 경로만 테스트(S2 — 오류 처리 미검증), 오류 시 화이트 스크린(S1).

**FIX**

```ts
// tests/fixtures/network.ts
export const FailureScenarios = {
  serverError: (page: Page, pattern: string) =>
    page.route(pattern, r => r.fulfill({ status: 500, json: { error: 'Internal Server Error' } })),

  unauthorized: (page: Page, pattern: string) =>
    page.route(pattern, r => r.fulfill({ status: 401, json: { error: 'Unauthorized' } })),

  forbidden: (page: Page, pattern: string) =>
    page.route(pattern, r => r.fulfill({ status: 403, json: { error: 'Forbidden' } })),

  rateLimited: (page: Page, pattern: string) =>
    page.route(pattern, r => r.fulfill({
      status: 429,
      headers: { 'retry-after': '30' },
      json: { error: 'Too Many Requests' },
    })),

  networkFailure: (page: Page, pattern: string) =>
    page.route(pattern, r => r.abort('failed')),

  timeout: (page: Page, pattern: string, ms = 60_000) =>
    page.route(pattern, async r => {
      await new Promise(resolve => setTimeout(resolve, ms));
      await r.abort('timedout');
    }),

  slow: (page: Page, pattern: string, ms = 3000) =>
    page.route(pattern, async r => {
      await new Promise(resolve => setTimeout(resolve, ms));
      await r.continue();
    }),

  malformed: (page: Page, pattern: string) =>
    page.route(pattern, r => r.fulfill({
      status: 200, contentType: 'application/json', body: '{"incomplete":',
    })),
};
```

```ts
// ✅ 실패 시나리오 매트릭스
const SCENARIOS = [
  { name: '서버 오류', setup: FailureScenarios.serverError, expect: /문제가 발생|다시 시도/ },
  { name: '권한 없음', setup: FailureScenarios.forbidden,   expect: /권한이 없|접근할 수 없/ },
  { name: '요청 제한', setup: FailureScenarios.rateLimited, expect: /잠시 후|너무 많은 요청/ },
  { name: '네트워크 실패', setup: FailureScenarios.networkFailure, expect: /연결|네트워크/ },
];

for (const scenario of SCENARIOS) {
  test(`${scenario.name} 시 사용자에게 안내한다`, async ({ page }) => {
    await scenario.setup(page, '**/api/members*');
    await page.goto('/settings/members');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await expect(alert).toContainText(scenario.expect);

    // 화이트 스크린이 아닌지 — 셸은 유지되어야 한다
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}
```

```ts
// ✅ 오프라인 시나리오
test('오프라인에서 안내하고 복구 시 재시도한다', async ({ page, context }) => {
  await page.goto('/settings/members');
  await expect(page.getByRole('table')).toBeVisible();

  await context.setOffline(true);
  await page.getByRole('button', { name: '새로고침' }).click();
  await expect(page.getByRole('alert')).toContainText(/오프라인|연결/);

  await context.setOffline(false);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('table')).toBeVisible();
});
```

---

### P-NET-03 — 요청 검증

**WHY**
UI가 올바르게 보인다고 서버에 올바른 요청을 보낸 것은 아니다. 필드를 빠뜨리거나, 잘못된 형식으로 보내거나, 중복 요청을 보내는 결함은 UI만 봐서는 알 수 없다. 특히 디바운스 실패로 인한 요청 폭주는 프로덕션에서 비용 문제가 된다.

**DETECT**

```bash
rg -n "waitForRequest|on\('request'" tests | wc -l
rg -n "postDataJSON|request\(\)\.postData" tests
rg -n "debounce|throttle" src | head -20
```

**PASS / FAIL**

- PASS: 핵심 변경 작업에서 요청 페이로드와 횟수를 검증한다. 디바운스·중복 방지가 확인된다.
- FAIL: 요청 내용 미검증(S3), 중복 요청 미탐지(S2 — 비용/데이터 문제).

**FIX**

```ts
// ✅ 요청 페이로드 검증
test('초대 요청이 올바른 페이로드를 보낸다', async ({ adminPage, org }) => {
  const requestPromise = adminPage.waitForRequest(
    r => r.url().includes('/api/invitations') && r.method() === 'POST');

  await adminPage.goto(`/orgs/${org.slug}/members`);
  await adminPage.getByRole('button', { name: '멤버 초대' }).click();
  await adminPage.getByLabel('이메일').fill('new@example.test');
  await adminPage.getByLabel('권한').selectOption('member');
  await adminPage.getByRole('button', { name: '보내기' }).click();

  const request = await requestPromise;
  expect(request.postDataJSON()).toMatchObject({
    email: 'new@example.test',
    role: 'member',
    orgId: org.id,
  });
  expect(request.headers()['content-type']).toContain('application/json');
});
```

```ts
// ✅ 중복 요청 방지 검증
test('저장 버튼 연타에도 요청이 한 번만 간다', async ({ adminPage }) => {
  const requests: string[] = [];
  adminPage.on('request', r => {
    if (r.url().includes('/api/settings') && r.method() === 'PATCH') {
      requests.push(r.url());
    }
  });

  await adminPage.goto('/settings/general');
  await adminPage.getByLabel('조직 이름').fill('새 이름');

  const save = adminPage.getByRole('button', { name: '저장' });
  await save.click();
  await save.click({ force: true }).catch(() => {});   // 이미 disabled일 수 있다
  await save.click({ force: true }).catch(() => {});

  await expect(adminPage.getByRole('status')).toContainText('저장');
  expect(requests, `요청 ${requests.length}회 발생`).toHaveLength(1);
});
```

```ts
// ✅ 디바운스 검증
test('검색 입력이 디바운스된다', async ({ page }) => {
  const searchRequests: string[] = [];
  page.on('request', r => {
    if (r.url().includes('/api/search')) searchRequests.push(r.url());
  });

  await page.goto('/search');
  const input = page.getByRole('searchbox');

  // 빠르게 연속 입력
  for (const ch of '키보드') {
    await input.press(ch);
    await page.waitForTimeout(50);
  }

  await expect(page.getByTestId('search-results')).toBeVisible();
  // 3글자를 입력했지만 요청은 1~2회여야 한다
  expect(searchRequests.length, `검색 요청 ${searchRequests.length}회`).toBeLessThanOrEqual(2);
});
```

---

### P-NET-04 — HAR 기록과 재생

**WHY**
복잡한 API 응답을 손으로 픽스처로 만들면 실제와 달라지고, 유지보수가 어렵다. HAR(HTTP Archive)로 실제 트래픽을 녹화해 재생하면 실제와 동일한 응답을 결정적으로 재현할 수 있다. 다만 HAR이 오래되면 실제 API와 괴리가 생긴다.

**DETECT**

```bash
fd -e har . tests 2>/dev/null
rg -n "routeFromHAR|recordHar" tests playwright.config.*
```

**PASS / FAIL**

- PASS: HAR을 쓴다면 갱신 주기가 정해져 있고, 실제 API 계약 테스트가 병행된다.
- FAIL: 오래된 HAR로 존재하지 않는 API를 테스트(S2 — 거짓 통과).

**FIX**

```bash
# HAR 녹화
pnpm playwright open --save-har=tests/fixtures/har/dashboard.har http://localhost:3000/dashboard
```

```ts
// ✅ HAR 재생
test('대시보드가 실제 응답 구조로 렌더된다', async ({ page }) => {
  await page.routeFromHAR('tests/fixtures/har/dashboard.har', {
    url: '**/api/**',
    update: false,              // true면 실행 시 HAR을 갱신한다
    notFound: 'abort',          // HAR에 없는 요청은 차단 → 누락을 드러낸다
  });

  await page.goto('/dashboard');
  await expect(page.getByTestId('metric-card')).toHaveCount(4);
});
```

`notFound: 'abort'`가 중요하다. `'fallback'`으로 두면 HAR에 없는 요청이 실제로 나가서 결정론이 깨진다.

```ts
// ✅ HAR 갱신 모드 — 주기적으로 실행해 최신화
// UPDATE_HAR=1 pnpm playwright test tests/e2e/dashboard.spec.ts
await page.routeFromHAR('tests/fixtures/har/dashboard.har', {
  url: '**/api/**',
  update: process.env.UPDATE_HAR === '1',
});
```

HAR에는 인증 토큰과 개인정보가 포함될 수 있다. 커밋 전 반드시 확인하고 민감 정보를 제거한다.

```bash
# HAR에서 민감 정보 검사
rg -o '"(authorization|cookie|set-cookie)"[^}]*' tests/fixtures/har/*.har | head
```

---

### P-NET-05 — 서비스 워커와 캐시

**WHY**
PWA의 서비스 워커는 요청을 가로채므로 `page.route`가 동작하지 않을 수 있다. 또 이전 테스트의 캐시가 남아 오래된 응답이 반환되면 원인 불명의 실패가 발생한다.

**DETECT**

```bash
rg -n "serviceWorker|sw\.js|workbox|next-pwa" src public next.config.*
rg -n "serviceWorkers:" playwright.config.*
rg -n "caches\.|CacheStorage" src
```

**PASS / FAIL**

- PASS: 서비스 워커 정책이 명시된다(`serviceWorkers: 'block'` 또는 의도적 활성화). 테스트 간 캐시가 격리된다.
- FAIL: 서비스 워커가 모킹을 무력화(S2 — 원인 파악 어려움), 캐시 잔류로 flaky(S2).

**FIX**

```ts
// playwright.config.ts — 대부분의 테스트에서는 차단
use: {
  serviceWorkers: 'block',
},
```

```ts
// ✅ 서비스 워커 자체를 테스트할 때만 허용
test.describe('오프라인 지원', () => {
  test.use({ serviceWorkers: 'allow' });

  test('서비스 워커 설치 후 오프라인에서 캐시된 페이지가 열린다', async ({ page, context }) => {
    await page.goto('/');
    // 설치 완료 대기
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null,
      { timeout: 15_000 });

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

```ts
// ✅ 캐시 초기화
async function clearAllCaches(page: Page) {
  await page.evaluate(async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  });
}
```

`BrowserContext`가 테스트마다 새로 생성되므로 캐시는 기본적으로 격리된다. `storageState`를 공유해도 Cache Storage는 공유되지 않는다. 문제가 생기면 컨텍스트 재사용이 있는지 확인한다.

---

## 13. Page Object와 추상화

### P-POM-01 — 추상화 수준 결정

**WHY**
Page Object는 만능이 아니다. 과하게 쓰면 (a) 테스트를 읽어도 무엇을 하는지 알 수 없고, (b) POM 메서드를 따라 3단계를 들어가야 실제 동작을 파악하며, (c) 재사용되지 않는 메서드가 쌓인다. 반대로 없으면 셀렉터가 40곳에 흩어져 UI 변경 시 전부 고쳐야 한다.

**판단 기준:** 같은 상호작용이 **3곳 이상**에서 반복되면 추출한다. 그 이하는 테스트 안에 두는 편이 읽기 쉽다.

**DETECT**

```bash
fd -e page.ts . tests 2>/dev/null | wc -l
rg -c "class .*Page" tests | wc -l
rg -n "new .*Page\(" tests | wc -l

# POM 메서드 중 실제로 여러 번 쓰이는 것 확인
rg -o "\.\w+\(" tests/pages/*.ts -r '$1' | sort -u | while read m; do
  count=$(rg -c "\.$m\(" tests/e2e 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  echo "$count $m"
done | sort -rn | head -20
```

사용 횟수가 1인 POM 메서드가 많으면 과잉 추상화다.

**PASS / FAIL**

- PASS: POM이 반복되는 상호작용에만 존재하고, 테스트를 읽으면 시나리오가 이해된다. 사용 횟수 1인 메서드가 거의 없다.
- FAIL: 과잉 추상화로 가독성 저하(S3), 추상화 부재로 셀렉터 산재(S2).

**FIX**

**과잉 추상화**

```ts
// ❌ 모든 것을 감싸 시나리오가 보이지 않는다
class MembersPage {
  async goto() { await this.page.goto('/settings/members'); }
  async clickInviteButton() { await this.page.getByRole('button', { name: '멤버 초대' }).click(); }
  async fillEmail(v: string) { await this.page.getByLabel('이메일').fill(v); }
  async selectRole(v: string) { await this.page.getByLabel('권한').selectOption(v); }
  async clickSend() { await this.page.getByRole('button', { name: '보내기' }).click(); }
  async expectToast(t: string) { await expect(this.page.getByRole('status')).toContainText(t); }
}

test('멤버 초대', async ({ adminPage }) => {
  const p = new MembersPage(adminPage);
  await p.goto();
  await p.clickInviteButton();
  await p.fillEmail('a@b.test');
  await p.selectRole('member');
  await p.clickSend();
  await p.expectToast('초대');
});
```

원본보다 길고, 각 메서드가 무엇을 클릭하는지 알려면 POM을 열어야 한다.

**적절한 추상화**

```ts
// ✅ 의미 있는 단위로만 묶는다
// tests/pages/members.page.ts
import { expect, type Page, type Locator } from '@playwright/test';

export class MembersPage {
  readonly table: Locator;
  readonly searchInput: Locator;
  readonly inviteButton: Locator;

  constructor(private page: Page, private orgSlug: string) {
    this.table = page.getByRole('table', { name: '멤버 목록' });
    this.searchInput = page.getByRole('searchbox', { name: '멤버 검색' });
    this.inviteButton = page.getByRole('button', { name: '멤버 초대' });
  }

  async goto() {
    await this.page.goto(`/orgs/${this.orgSlug}/members`);
    await expect(this.table).toBeVisible();
  }

  /** 여러 단계를 하나의 사용자 의도로 묶는다 */
  async invite(email: string, role: 'admin' | 'member' | 'viewer' = 'member') {
    await this.inviteButton.click();
    const dialog = this.page.getByRole('dialog', { name: '멤버 초대' });
    await dialog.getByLabel('이메일').fill(email);
    await dialog.getByLabel('권한').selectOption(role);
    await dialog.getByRole('button', { name: '보내기' }).click();
    await expect(dialog).toBeHidden();
  }

  /** 행을 내용으로 찾는 헬퍼 — 여러 테스트에서 재사용된다 */
  row(email: string): Locator {
    return this.table.getByRole('row', { name: new RegExp(escapeRegex(email)) });
  }

  async deleteMember(email: string) {
    await this.row(email).getByRole('button', { name: '삭제' }).click();
    const confirm = this.page.getByRole('alertdialog', { name: '멤버 삭제' });
    await expect(confirm).toContainText(email);
    await confirm.getByRole('button', { name: '삭제' }).click();
    await expect(confirm).toBeHidden();
  }
}
```

```ts
// ✅ 테스트를 읽으면 시나리오가 보인다
test('관리자가 멤버를 초대하고 삭제한다', async ({ adminPage, org }) => {
  const members = new MembersPage(adminPage, org.slug);
  await members.goto();

  const email = uniqueEmail(test.info());
  await members.invite(email, 'member');
  await expect(members.row(email)).toBeVisible();

  await members.deleteMember(email);
  await expect(members.row(email)).toHaveCount(0);
});
```

**원칙**

- Locator를 `readonly` 속성으로 노출해 테스트에서 직접 어설션할 수 있게 한다.
- 메서드는 **사용자 의도** 단위로 만든다(`invite`, `deleteMember`). 개별 클릭을 감싸지 않는다.
- POM 안에 어설션을 넣되, 그것은 **동작 완료 확인**용이다. 테스트의 검증 어설션은 테스트에 둔다.

---

### P-POM-02 — 컴포넌트 오브젝트

**WHY**
헤더, 사이드바, 모달, 토스트, 테이블은 여러 페이지에 나타난다. 페이지별 POM에 중복 정의하면 유지보수가 어렵다. 컴포넌트 단위 오브젝트를 만들어 조합한다.

**DETECT**

```bash
rg -n "getByRole\('banner'\)|getByRole\('navigation'\)" tests | wc -l
rg -n "getByRole\('dialog'\)" tests | wc -l
rg -n "getByRole\('status'\)|toast" tests | wc -l
```

같은 컴포넌트 셀렉터가 여러 파일에 반복되면 추출 대상이다.

**PASS / FAIL**

- PASS: 공통 UI 컴포넌트가 재사용 가능한 오브젝트로 추출되고, 페이지 오브젝트가 이를 조합한다.
- FAIL: 공통 컴포넌트 셀렉터 중복(S3).

**FIX**

```ts
// tests/pages/components/toast.ts
export class Toast {
  constructor(private page: Page) {}

  get region() {
    return this.page.getByRole('status');
  }

  async expectSuccess(text: string | RegExp) {
    await expect(this.region).toBeVisible();
    await expect(this.region).toContainText(text);
  }

  async expectError(text: string | RegExp) {
    const alert = this.page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(text);
  }

  async dismiss() {
    await this.region.getByRole('button', { name: '닫기' }).click();
    await expect(this.region).toBeHidden();
  }
}
```

```ts
// tests/pages/components/data-table.ts
export class DataTable {
  constructor(private root: Locator) {}

  get rows() { return this.root.getByRole('row').filter({ hasNot: this.root.getByRole('columnheader') }); }

  row(text: string | RegExp) {
    return this.root.getByRole('row', { name: text });
  }

  async sortBy(column: string) {
    const header = this.root.getByRole('columnheader', { name: column });
    await header.click();
    // 정렬 적용을 aria-sort로 확인
    await expect(header).toHaveAttribute('aria-sort', /ascending|descending/);
  }

  async expectSortedBy(column: string, direction: 'ascending' | 'descending') {
    await expect(this.root.getByRole('columnheader', { name: column }))
      .toHaveAttribute('aria-sort', direction);
  }

  async columnValues(columnIndex: number): Promise<string[]> {
    return this.rows.evaluateAll((rows, idx) =>
      rows.map(r => r.querySelectorAll('td')[idx]?.textContent?.trim() ?? ''), columnIndex);
  }
}
```

```ts
// ✅ 페이지 오브젝트가 컴포넌트를 조합한다
export class MembersPage {
  readonly table: DataTable;
  readonly toast: Toast;

  constructor(private page: Page, private orgSlug: string) {
    this.table = new DataTable(page.getByRole('table', { name: '멤버 목록' }));
    this.toast = new Toast(page);
  }
}
```

```ts
// ✅ 테스트에서 자연스럽게 조합된다
test('이름으로 정렬한다', async ({ adminPage, org }) => {
  const members = new MembersPage(adminPage, org.slug);
  await members.goto();

  await members.table.sortBy('이름');
  await members.table.expectSortedBy('이름', 'ascending');

  const names = await members.table.columnValues(1);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ko')));
});
```

---

### P-POM-03 — 픽스처와 POM 결합

**WHY**
테스트마다 `new MembersPage(page, org.slug)`를 작성하면 중복이고, 초기화 방식이 바뀔 때 전부 고쳐야 한다. POM을 픽스처로 노출하면 선언만으로 사용할 수 있다.

**DETECT**

```bash
rg -n "new .*Page\(" tests/e2e | wc -l
rg -n "Page:" tests/fixtures | head
```

**PASS / FAIL**

- PASS: 자주 쓰이는 POM이 픽스처로 노출되고, 테스트는 선언만 한다.
- FAIL: POM 인스턴스화 중복(S3).

**FIX**

```ts
// tests/fixtures/pages.ts
import { test as base } from './auth';
import { MembersPage } from '../pages/members.page';
import { CheckoutPage } from '../pages/checkout.page';
import { DashboardPage } from '../pages/dashboard.page';

type PageFixtures = {
  membersPage: MembersPage;
  checkoutPage: CheckoutPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<PageFixtures>({
  membersPage: async ({ adminPage, org }, use) => {
    const p = new MembersPage(adminPage, org.slug);
    await p.goto();          // 픽스처가 초기 상태까지 보장
    await use(p);
  },

  dashboardPage: async ({ memberPage }, use) => {
    const p = new DashboardPage(memberPage);
    await p.goto();
    await use(p);
  },

  checkoutPage: async ({ memberPage }, use) => {
    await use(new CheckoutPage(memberPage));   // goto는 테스트가 제어
  },
});

export { expect } from '@playwright/test';
```

```ts
// ✅ 테스트가 매우 짧아진다
import { test, expect } from '../fixtures/pages';

test('멤버를 초대한다', async ({ membersPage }) => {
  const email = uniqueEmail(test.info());
  await membersPage.invite(email);
  await expect(membersPage.row(email)).toBeVisible();
  await membersPage.toast.expectSuccess('초대를 보냈습니다');
});
```

픽스처에서 `goto()`까지 수행할지는 판단이 필요하다. 대부분의 테스트가 같은 진입점에서 시작하면 픽스처에 넣고, 진입 경로 자체가 다양하면 테스트에 맡긴다.

---

### P-POM-04 — POM 안티패턴

**WHY**
POM은 오용하기 쉬운 패턴이다. 흔한 실수를 미리 알면 리팩터링 비용을 줄일 수 있다.

**DETECT**

```bash
# POM 안에 테스트 어설션이 과다한지
rg -c "expect\(" tests/pages/*.ts | sort -t: -k2 -rn | head

# POM이 다른 POM을 반환하는 체이닝
rg -n "return new .*Page" tests/pages

# POM에 조건부 로직
rg -n "if\s*\(" tests/pages/*.ts | wc -l

# 상태를 보관하는 POM
rg -n "this\.\w+ =" tests/pages/*.ts | rg -v "readonly|constructor" | head
```

**안티패턴 목록**

**1. POM이 검증을 독점한다**

```ts
// ❌ 무엇을 검증하는지 테스트에 나타나지 않는다
class MembersPage {
  async verifyEverything() {
    await expect(this.table).toBeVisible();
    await expect(this.rows).toHaveCount(10);
    await expect(this.inviteButton).toBeEnabled();
    // … 20줄 더
  }
}

test('멤버 페이지', async ({ membersPage }) => {
  await membersPage.verifyEverything();   // 실패하면 무엇이 문제인지 모른다
});
```

```ts
// ✅ 검증은 테스트에, POM은 접근 수단만
test('멤버 목록이 표시된다', async ({ membersPage }) => {
  await expect(membersPage.table.rows).toHaveCount(10);
  await expect(membersPage.inviteButton).toBeEnabled();
});
```

**2. 조건부 분기를 품는다**

```ts
// ❌ 테스트마다 다른 경로를 타서 무엇을 검증했는지 모른다
async openInviteDialog() {
  if (await this.inviteButton.isVisible()) {
    await this.inviteButton.click();
  } else {
    await this.overflowMenu.click();
    await this.page.getByRole('menuitem', { name: '초대' }).click();
  }
}
```

```ts
// ✅ 화면 크기별로 명시적 메서드를 제공하거나, 테스트가 선택한다
async openInviteDialogFromToolbar() { await this.inviteButton.click(); }
async openInviteDialogFromMenu() {
  await this.overflowMenu.click();
  await this.page.getByRole('menuitem', { name: '초대' }).click();
}
```

**3. 상태를 보관한다**

```ts
// ❌ POM이 상태를 들고 있으면 실제 DOM과 어긋난다
class MembersPage {
  private memberCount = 0;
  async loadMembers() { this.memberCount = await this.rows.count(); }
  async expectCount(n: number) { expect(this.memberCount).toBe(n); }   // 낡은 값
}
```

```ts
// ✅ 항상 현재 DOM을 조회한다
async expectCount(n: number) { await expect(this.rows).toHaveCount(n); }
```

**4. 페이지 이동을 체이닝한다**

```ts
// ❌ 반환 타입 추적이 어렵고 실제 이동 여부가 불명확
const dashboard = await loginPage.login(email, password);   // DashboardPage 반환
const settings = await dashboard.goToSettings();
```

```ts
// ✅ 이동을 명시하고 도착을 검증한다
await loginPage.login(email, password);
await expect(page).toHaveURL(/\/dashboard/);

const settings = new SettingsPage(page);
await settings.goto();
```

**PASS / FAIL**

- PASS: POM에 조건부 분기·상태·검증 독점이 없다. Locator를 노출하고 테스트가 검증한다.
- FAIL: 위 안티패턴 존재(각 S3, 조건부 분기로 검증 무효화 시 S2).

---

## 14. 어설션 전략

### P-ASSERT-01 — 웹 우선 어설션

**WHY**
`expect(await locator.isVisible()).toBe(true)`는 **그 순간의 스냅샷**을 검사하므로 요소가 아직 나타나지 않았으면 즉시 실패한다. `expect(locator).toBeVisible()`은 조건이 만족될 때까지 폴링한다. 전자를 쓰면 하드 대기를 넣게 되고, 그것이 flaky의 시작이다.

**DETECT**

```bash
# 비웹 우선 어설션 탐지
rg -n "expect\(await .*\.(isVisible|isEnabled|isChecked|isDisabled|isHidden)\(\)\)" tests
rg -n "expect\(await .*\.(textContent|innerText|inputValue|getAttribute)\(" tests
rg -n "expect\(await .*\.count\(\)\)" tests

# 웹 우선 어설션 사용률
rg -c "expect\(page|expect\(.*locator|expect\(.*getBy" tests | awk -F: '{s+=$2} END {print s}'
```

**대응표**

| 잘못된 방식 | 올바른 방식 |
|-------------|-------------|
| `expect(await l.isVisible()).toBe(true)` | `await expect(l).toBeVisible()` |
| `expect(await l.textContent()).toBe('x')` | `await expect(l).toHaveText('x')` |
| `expect(await l.textContent()).toContain('x')` | `await expect(l).toContainText('x')` |
| `expect(await l.inputValue()).toBe('x')` | `await expect(l).toHaveValue('x')` |
| `expect(await l.count()).toBe(3)` | `await expect(l).toHaveCount(3)` |
| `expect(await l.isEnabled()).toBe(true)` | `await expect(l).toBeEnabled()` |
| `expect(await l.getAttribute('a')).toBe('b')` | `await expect(l).toHaveAttribute('a', 'b')` |
| `expect(page.url()).toContain('/x')` | `await expect(page).toHaveURL(/\/x/)` |
| `expect(await page.title()).toBe('t')` | `await expect(page).toHaveTitle('t')` |

**PASS / FAIL**

- PASS: 모든 DOM 어설션이 웹 우선 방식이다. `await expect(locator)` 형태다.
- FAIL: 비웹 우선 어설션 다수(S2 — flaky 원인).

**FIX**

```ts
// ❌ 스냅샷 검사 + 하드 대기 조합
await page.getByRole('button', { name: '저장' }).click();
await page.waitForTimeout(2000);
expect(await page.getByRole('status').textContent()).toContain('저장됨');

// ✅ 폴링 어설션 — 대기가 내장되어 있다
await page.getByRole('button', { name: '저장' }).click();
await expect(page.getByRole('status')).toContainText('저장됨');
```

```ts
// ✅ 부정 어설션도 폴링한다
await expect(page.getByRole('dialog')).toBeHidden();
await expect(page.getByText('로딩 중')).toHaveCount(0);
```

`toBeHidden()`과 `not.toBeVisible()`은 미묘하게 다르다. `toBeHidden()`은 요소가 없거나 숨겨진 상태를 모두 통과시키고, `not.toBeVisible()`도 동일하다. 요소가 DOM에서 제거되었는지 확인하려면 `toHaveCount(0)`을 쓴다.

```ts
// ✅ 값 자체가 필요한 경우에만 await로 추출 후 일반 어설션
const rowCount = await page.getByRole('row').count();
const names = await page.getByTestId('member-name').allTextContents();
expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ko')));
```

정렬 검증처럼 값을 가공해야 하는 경우는 추출이 불가피하다. 다만 그 앞에 안정 상태를 보장하는 어설션을 둔다.

```ts
// ✅ 안정 상태 확보 후 값 추출
await expect(page.getByRole('row')).toHaveCount(10);   // 로딩 완료 보장
const names = await page.getByTestId('member-name').allTextContents();
```

---

### P-ASSERT-02 — 조건부 어설션 제거

**WHY**
`if (await el.isVisible())` 안의 어설션은 요소가 없으면 실행되지 않고, 테스트는 초록불이 된다. 아무것도 검증하지 않는 테스트가 통과하는 것이 가장 위험한 상태다. 결함이 있어도 CI가 통과하므로 아무도 모른다.

**DETECT**

```bash
rg -n "if\s*\(await" tests
rg -B2 -A6 "if\s*\(await.*isVisible" tests | head -40
rg -n "\.catch\(\(\)\s*=>\s*\{?\s*\}?\)" tests           # 오류 삼키기
rg -n "try\s*\{" tests -A8 | rg "catch" -A3 | rg -v "throw" | head -20
```

**진단**

의심되는 테스트를 **의도적으로 깨뜨려** 실패하는지 확인한다.

```bash
# 검증 대상 요소를 제품에서 임시 제거하고 테스트 실행
# 통과하면 그 테스트는 아무것도 검증하지 않는다
```

**PASS / FAIL**

- PASS: 조건부 어설션이 없다. 모든 테스트가 대상을 제거했을 때 실패한다.
- FAIL: 조건부 어설션 존재(**S1** — 검증 무효), 예외 삼키기(S1).

**FIX**

```ts
// ❌ 요소가 없으면 조용히 통과
test('저장 성공 메시지', async ({ page }) => {
  await page.getByRole('button', { name: '저장' }).click();
  const toast = page.getByRole('status');
  if (await toast.isVisible()) {
    await expect(toast).toContainText('저장됨');
  }
});
```

```ts
// ✅ 항상 검증한다
test('저장 성공 메시지', async ({ page }) => {
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('status')).toContainText('저장됨');
});
```

**분기가 정말 필요한 경우**

환경이나 기능 플래그에 따라 UI가 다르면, 조건을 **테스트 밖에서** 결정한다.

```ts
// ❌ 런타임 조건으로 검증을 건너뛴다
if (await page.getByTestId('beta-banner').isVisible()) {
  await expect(page.getByTestId('beta-banner')).toContainText('베타');
}

// ✅ 기능 플래그를 테스트 조건으로 명시
test('베타 배너가 표시된다', async ({ page }) => {
  test.skip(process.env.FEATURE_BETA !== '1', '베타 기능 비활성 환경');

  await page.goto('/dashboard');
  await expect(page.getByTestId('beta-banner')).toContainText('베타');
});
```

```ts
// ✅ 또는 플래그를 테스트가 직접 제어
test('베타 배너가 표시된다', async ({ page, context }) => {
  await context.addCookies([{ name: 'ff_beta', value: '1', url: BASE_URL }]);
  await page.goto('/dashboard');
  await expect(page.getByTestId('beta-banner')).toBeVisible();
});
```

`test.skip`은 리포트에 skip으로 남아 가시적이지만, `if` 분기는 통과로 남아 보이지 않는다. 이 차이가 중요하다.

**예외 삼키기**

```ts
// ❌ 실패를 무시
try {
  await page.getByRole('button', { name: '닫기' }).click();
} catch {}

// ✅ 존재 여부를 명시적으로 다룬다
const closeButton = page.getByRole('button', { name: '닫기' });
if (await closeButton.count() > 0) {
  await closeButton.click();
}
// 또는 정리 작업이라면 의도를 주석으로
await closeButton.click().catch(() => {
  // 정리 단계: 다이얼로그가 이미 닫혔을 수 있으므로 실패를 허용한다
});
```

정리(cleanup) 단계의 실패 허용은 정당하지만, 검증 단계에서는 절대 안 된다.

---

### P-ASSERT-03 — 어설션 구체성

**WHY**
`await expect(page.getByRole('table')).toBeVisible()`는 테이블이 비어 있어도, 오류 메시지만 있어도 통과한다. "화면이 렌더되었다"는 사실상 아무것도 보장하지 않는다. 어설션은 **결함이 있을 때 실패할 만큼** 구체적이어야 한다.

**DETECT**

```bash
rg -n "toBeVisible\(\)" tests | wc -l
rg -n "toBeTruthy\(\)|toBeDefined\(\)|not\.toBeNull\(\)" tests
rg -c "expect" tests/e2e | sort -t: -k2 -n | head -10       # 어설션이 적은 테스트
```

테스트당 어설션이 1개뿐이고 그것이 `toBeVisible()`이면 검증 강도가 약하다.

**진단**

각 테스트에 대해 묻는다.

```text
- 이 기능이 완전히 깨졌을 때 이 테스트가 실패하는가?
- 부분적으로 깨졌을 때(데이터 누락, 잘못된 값)도 실패하는가?
- 반대로, 정상인데 실패할 여지가 있는가?
```

**PASS / FAIL**

- PASS: 어설션이 관찰 가능한 결과를 구체적으로 검증한다. 데이터 내용, 개수, 상태를 확인한다.
- FAIL: 존재 확인만(S2 — 빈 껍데기를 통과시킴), 지나치게 구체적이어 취약(S3).

**FIX**

```ts
// ❌ 빈 테이블도 통과한다
test('멤버 목록', async ({ adminPage }) => {
  await adminPage.goto('/settings/members');
  await expect(adminPage.getByRole('table')).toBeVisible();
});

// ✅ 실제 데이터가 있고 올바른지 검증
test('멤버 목록에 조직 구성원이 표시된다', async ({ adminPage, org, api }) => {
  const member = await api.createMember({ orgId: org.id, name: '김민준', role: 'admin' });
  await adminPage.goto(`/orgs/${org.slug}/members`);

  const row = adminPage.getByRole('row', { name: /김민준/ });
  await expect(row).toBeVisible();
  await expect(row.getByRole('cell', { name: member.email })).toBeVisible();
  await expect(row.getByRole('cell', { name: '관리자' })).toBeVisible();
});
```

```ts
// ❌ 지나치게 구체적 — 카피 한 글자만 바뀌어도 실패
await expect(page.getByRole('status')).toHaveText(
  '멤버 초대가 완료되었습니다. 초대장이 new@example.test로 발송되었습니다.');

// ✅ 핵심만 검증
await expect(page.getByRole('status')).toContainText('초대');
await expect(page.getByRole('status')).toContainText('new@example.test');
```

**소프트 어설션 활용**

여러 항목을 한 번에 확인하고 전체 결과를 보고 싶을 때 사용한다.

```ts
// ✅ 첫 실패에서 멈추지 않고 모든 문제를 한 번에 보고
test('대시보드 지표가 모두 표시된다', async ({ dashboardPage }) => {
  const cards = ['월 반복 매출', '활성 사용자', '이탈률', '신규 가입'];

  for (const label of cards) {
    await expect.soft(
      dashboardPage.page.getByRole('article', { name: label }),
      `${label} 카드`,
    ).toBeVisible();
  }

  // soft 어설션 실패가 있으면 여기서 테스트가 실패한다
});
```

소프트 어설션은 독립적인 여러 검증에 적합하다. 순차 의존이 있는 단계에는 쓰지 않는다(앞 단계가 실패했는데 계속 진행하면 무의미한 실패가 쌓인다).

---

### P-ASSERT-04 — 어설션 메시지

**WHY**
CI에서 `expect(received).toEqual(expected)` 실패만 보이면, 로그를 뒤지고 트레이스를 열어야 무엇이 문제인지 안다. 커스텀 메시지가 있으면 실패 목록만 보고 원인을 안다. 디버깅 시간도 스위트의 비용이다.

**DETECT**

```bash
rg -n "expect\([^,)]+\)\.(toEqual|toBe|toHaveLength)" tests | wc -l
rg -n "expect\([^,)]+, ['\"]" tests | wc -l        # 메시지가 있는 것
```

**PASS / FAIL**

- PASS: 실패 시 원인이 불분명한 어설션에 설명 메시지가 있다. 특히 배열·객체 비교와 조건 검증에.
- FAIL: 메시지 없는 복잡한 어설션(S3 — 디버깅 비용).

**FIX**

```ts
// ❌ 실패해도 무엇이 문제인지 모른다
expect(offScale).toEqual([]);
expect(names).toEqual(sorted);
expect(count).toBeLessThan(5);

// ✅ 실패 메시지에 진단 정보를 담는다
expect(offScale, `스케일 이탈 간격:\n${JSON.stringify(offScale, null, 2)}`).toEqual([]);

expect(names, `정렬 순서 불일치\n실제: ${names.join(', ')}\n기대: ${sorted.join(', ')}`)
  .toEqual(sorted);

expect(requests.length, `API 요청이 ${requests.length}회 발생 (중복 방지 실패)\n${requests.join('\n')}`)
  .toBeLessThan(2);
```

```ts
// ✅ 웹 우선 어설션에도 메시지를 붙인다
await expect(
  page.getByRole('button', { name: '결제하기' }),
  '결제 버튼이 활성화되지 않음 — 필수 입력이 누락되었을 수 있다',
).toBeEnabled();
```

```ts
// ✅ 실패 시 추가 컨텍스트를 첨부한다
test('결제가 완료된다', async ({ page }, testInfo) => {
  try {
    await expect(page).toHaveURL(/\/success/, { timeout: 30_000 });
  } catch (e) {
    // 실패 시 현재 상태를 리포트에 첨부
    await testInfo.attach('failure-state', {
      body: JSON.stringify({
        url: page.url(),
        errors: await page.getByRole('alert').allTextContents(),
        html: (await page.content()).slice(0, 5000),
      }, null, 2),
      contentType: 'application/json',
    });
    throw e;
  }
});
```

---

### P-ASSERT-05 — 커스텀 매처

**WHY**
프로젝트 고유의 검증(토스트 확인, 폼 오류 확인, 권한 확인)이 반복되면 매번 3~5줄을 쓰게 된다. 커스텀 매처로 만들면 의도가 명확해지고 실패 메시지도 일관된다.

**DETECT**

```bash
rg -n "expect.extend" tests
rg -n "async function expect|function assert" tests/utils
# 반복되는 어설션 패턴
rg -n "getByRole\('status'\)\).toContainText" tests | wc -l
```

**PASS / FAIL**

- PASS: 3회 이상 반복되는 검증 패턴이 커스텀 매처나 헬퍼로 추출된다.
- FAIL: 반복 어설션 중복(S3).

**FIX**

```ts
// tests/utils/matchers.ts
import { expect as baseExpect, type Page, type Locator } from '@playwright/test';

export const expect = baseExpect.extend({
  /** 토스트가 성공 메시지를 표시하는지 */
  async toShowSuccessToast(page: Page, expected: string | RegExp) {
    const toast = page.getByRole('status');
    try {
      await baseExpect(toast).toBeVisible({ timeout: 7000 });
      await baseExpect(toast).toContainText(expected);
      return { pass: true, message: () => '성공 토스트가 표시됨' };
    } catch (e) {
      const alerts = await page.getByRole('alert').allTextContents();
      return {
        pass: false,
        message: () =>
          `성공 토스트를 찾지 못함 (기대: ${expected})\n` +
          `화면의 alert: ${alerts.length ? alerts.join(' / ') : '없음'}\n` +
          `현재 URL: ${page.url()}`,
      };
    }
  },

  /** 폼 필드가 오류 상태인지 (aria-invalid + 메시지) */
  async toHaveFieldError(field: Locator, expected: string | RegExp) {
    try {
      await baseExpect(field).toHaveAttribute('aria-invalid', 'true');
      const describedBy = await field.getAttribute('aria-describedby');
      baseExpect(describedBy, 'aria-describedby가 없어 오류 메시지가 연결되지 않음').toBeTruthy();

      const message = field.page().locator(`#${describedBy}`);
      await baseExpect(message).toContainText(expected);
      return { pass: true, message: () => '필드 오류가 올바르게 표시됨' };
    } catch (e) {
      return {
        pass: false,
        message: () => `필드 오류 검증 실패 (기대: ${expected})\n${(e as Error).message}`,
      };
    }
  },

  /** 접근 가능한 이름을 갖는지 */
  async toHaveAccessibleName(locator: Locator, expected: string | RegExp) {
    const name = await locator.evaluate(el => {
      const label = el.getAttribute('aria-label');
      if (label) return label;
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        return labelledBy.split(' ')
          .map(id => document.getElementById(id)?.textContent ?? '')
          .join(' ').trim();
      }
      return el.textContent?.trim() ?? '';
    });

    const pass = typeof expected === 'string' ? name === expected : expected.test(name);
    return {
      pass,
      message: () => `접근 가능한 이름: "${name}" (기대: ${expected})`,
    };
  },
});
```

```ts
// ✅ 의도가 드러나고 실패 메시지가 풍부하다
import { expect } from '../utils/matchers';

test('초대 성공', async ({ membersPage, adminPage }) => {
  await membersPage.invite('new@example.test');
  await expect(adminPage).toShowSuccessToast('초대를 보냈습니다');
});

test('이메일 형식 오류', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.getByLabel('이메일').fill('invalid');
  await page.getByRole('button', { name: '가입' }).click();
  await expect(page.getByLabel('이메일')).toHaveFieldError(/이메일 형식/);
});
```

---

### P-ASSERT-06 — UI와 서버 상태 이중 검증

**WHY**
낙관적 업데이트(optimistic update)를 쓰면 서버 요청이 실패해도 UI에는 성공한 것처럼 보인다. UI만 검증하는 테스트는 이를 통과시킨다. 데이터 변경 작업에서는 **서버 상태를 함께 확인**해야 한다.

**DETECT**

```bash
rg -n "useOptimistic|optimisticUpdate|mutate\(" src | head -20
rg -n "api\.(get|list)" tests/e2e | wc -l
rg -n "revalidate|router\.refresh" src | head
```

낙관적 업데이트가 있는데 서버 검증이 없으면 공백이다.

**PASS / FAIL**

- PASS: 생성·수정·삭제 테스트에서 UI 반영과 서버 상태를 모두 확인한다. 새로고침 후에도 유지되는지 검증한다.
- FAIL: UI만 검증(S2 — 저장 실패를 통과시킴).

**FIX**

```ts
// ❌ 낙관적 업데이트가 롤백돼도 통과할 수 있다
test('권한 변경', async ({ membersPage, member }) => {
  await membersPage.changeRole(member.email, 'admin');
  await expect(membersPage.row(member.email)).toContainText('관리자');
});

// ✅ 서버 상태까지 확인
test('권한 변경이 서버에 반영된다', async ({ membersPage, adminPage, member, api }) => {
  await membersPage.changeRole(member.email, 'admin');
  await expect(membersPage.row(member.email)).toContainText('관리자');

  // 1. API로 서버 상태 확인
  const updated = await api.getMember(member.id);
  expect(updated.role, '서버에 권한 변경이 반영되지 않음').toBe('admin');

  // 2. 새로고침 후에도 유지되는지 (캐시 무효화 검증)
  await adminPage.reload();
  await expect(membersPage.row(member.email)).toContainText('관리자');
});
```

새로고침 검증은 캐시 무효화 결함을 잡는다. Next.js App Router에서 `revalidatePath`를 빠뜨리면 UI는 바뀌었는데 새로고침하면 되돌아간다.

```ts
// ✅ 낙관적 업데이트 롤백 검증
test('저장 실패 시 UI가 롤백된다', async ({ adminPage, membersPage, member }) => {
  await FailureScenarios.serverError(adminPage, '**/api/members/*');

  await membersPage.changeRole(member.email, 'admin');

  // 낙관적으로 잠깐 '관리자'가 보였다가
  // 실패 후 원래 값으로 돌아와야 한다
  await expect(membersPage.row(member.email)).toContainText('멤버');
  await expect(adminPage.getByRole('alert')).toContainText(/실패|오류/);
});
```

---

## 15. Flaky 진단과 제거

flaky는 결함이 아니라 **신뢰 붕괴**다. 하나가 방치되면 팀 전체가 CI 실패를 의심하지 않게 되고, 진짜 회귀가 통과한다.

### 15.1 원인 분류

| 유형 | 증상 | 주요 원인 |
|------|------|-----------|
| **타이밍** | 간헐적 요소 미발견 | 하드 대기, 비웹 우선 어설션, 하이드레이션 |
| **상태 누수** | 순서/병렬에 따라 실패 | 공유 데이터, 정리 누락 |
| **데이터 경합** | 개수 어설션 실패 | 절대 개수, 공유 리소스 |
| **네트워크** | 랜덤 타임아웃 | 실 API 의존, 외부 서비스 |
| **애니메이션** | 클릭이 빗나감 | 전환 중 좌표 변경 |
| **환경** | CI에서만 실패 | 리소스 부족, 워커 과다, 시간대 |
| **비결정 데이터** | 텍스트 불일치 | 시간, 랜덤, 정렬 미고정 |

### P-FLAKY-01 — Flaky 측정

**WHY**
"가끔 실패한다"는 인상만으로는 대응할 수 없다. 어떤 테스트가 몇 %의 확률로 실패하는지 수치화해야 우선순위를 정하고 개선 여부를 판단할 수 있다.

**DETECT**

```bash
# 반복 실행으로 flaky 측정
pnpm playwright test tests/e2e --repeat-each=5 --reporter=list 2>&1 | tee /tmp/flaky-run.txt
rg -c "✘|failed" /tmp/flaky-run.txt

# CI 리포트에서 flaky 추출 (retry로 통과한 것)
rg -n "flaky" playwright-report/index.html 2>/dev/null | head

# JSON 리포트 기반 분석
pnpm playwright test --reporter=json > /tmp/results.json
```

```js
// scripts/analyze-flaky.mjs — JSON 리포트에서 flaky 집계
import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('/tmp/results.json', 'utf8'));
const flaky = [];

function walk(suite) {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const results = t.results ?? [];
      const failed = results.filter(r => r.status === 'failed').length;
      if (failed > 0 && t.status === 'expected') {
        flaky.push({
          title: spec.title,
          file: spec.file,
          retries: failed,
          errors: results.filter(r => r.error).map(r => r.error.message?.slice(0, 200)),
        });
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child);
}
for (const s of report.suites ?? []) walk(s);

console.log(`Flaky 테스트 ${flaky.length}건`);
for (const f of flaky) {
  console.log(`\n[${f.retries}회 재시도] ${f.file} — ${f.title}`);
  for (const e of f.errors) console.log(`  ${e}`);
}
```

**PASS / FAIL**

- PASS: 5회 반복 실행에서 flaky 0건이다. 측정 수단이 상시 운영된다.
- FAIL: flaky 존재. 1건이면 S2, 전체의 5% 이상이면 S1.

**FIX**
측정 결과를 유형별로 분류하고 아래 항목(P-FLAKY-02~06)에서 원인을 제거한다. 임시로 `retries`를 올려 넘기지 않는다.

---

### P-FLAKY-02 — 타이밍 원인 제거

**WHY**
가장 흔한 flaky 원인이다. 요소가 나타나기 전에 조작하거나, 조작 후 결과를 기다리지 않고 검증하면 빠른 환경에서는 통과하고 느린 환경에서는 실패한다.

**DETECT**

```bash
rg -n "waitForTimeout" tests
rg -n "expect\(await .*\.(isVisible|textContent|count)\(\)" tests
rg -n "\.click\(\)\s*$" tests -A2 | rg "expect\(await" | head
```

**진단**

```bash
# CPU를 제한해 느린 환경을 재현
pnpm playwright test tests/e2e --workers=8       # 워커 과다 → CPU 경합
# 또는 CDP로 CPU 스로틀링
```

```ts
// 느린 환경 재현 픽스처
test.beforeEach(async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });
});
```

느린 조건에서 실패하는 테스트가 flaky 후보다.

**PASS / FAIL**

- PASS: 4배 CPU 스로틀링 + 느린 3G 조건에서도 통과한다.
- FAIL: 느린 환경에서 실패(S2 — CI에서 간헐 실패로 나타남).

**FIX**
P-WAIT 장의 원칙을 적용한다. 요약하면.

```ts
// ✅ 1. 웹 우선 어설션으로 전환
await expect(locator).toBeVisible();

// ✅ 2. 액션 후 결과를 기다린다
await saveButton.click();
await expect(page.getByRole('status')).toContainText('저장됨');

// ✅ 3. 상태 전이를 명시적으로 기다린다
await expect(saveButton).toBeDisabled();     // 저장 중
await expect(saveButton).toBeEnabled();      // 저장 완료

// ✅ 4. 하이드레이션 완료를 기다린다
await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
```

---

### P-FLAKY-03 — 데이터 경합 제거

**WHY**
여러 테스트가 같은 데이터를 읽고 쓰면 병렬 실행에서 서로의 결과에 영향을 준다. 특히 목록 개수 어설션은 다른 테스트가 항목을 추가/삭제하는 순간 실패한다.

**DETECT**

```bash
rg -n "toHaveCount\([0-9]+\)" tests
rg -n "allTextContents\(\)|allInnerTexts\(\)" tests | head
rg -n "first\(\)|last\(\)" tests | wc -l
```

**진단**

```bash
# 워커 수를 늘려 경합을 유발
pnpm playwright test tests/e2e --workers=8 --repeat-each=3
```

**PASS / FAIL**

- PASS: 워커 8개 × 3회 반복에서도 통과한다. 개수 어설션이 격리된 범위 안에서만 사용된다.
- FAIL: 병렬에서만 실패(S1).

**FIX**
P-DATA-02의 격리 전략을 적용한다.

```ts
// ❌ 전역 개수 — 다른 테스트의 영향을 받는다
await expect(page.getByRole('row')).toHaveCount(11);

// ✅ 자기 데이터만 확인
await expect(page.getByRole('row', { name: new RegExp(member.email) })).toHaveCount(1);

// ✅ 개수가 필요하면 격리된 컨테이너 안에서
const myOrgTable = page.getByTestId(`org-${org.id}-members`);
await expect(myOrgTable.getByRole('row')).toHaveCount(4);

// ✅ 또는 필터를 적용해 범위를 좁힌다
await page.getByRole('searchbox').fill(org.slug);
await expect(page.getByRole('row')).toHaveCount(4);
```

```ts
// ✅ first()를 쓸 때는 정렬을 고정한다
await page.getByRole('columnheader', { name: '생성일' }).click();   // 정렬 확정
await expect(page.getByRole('row').first()).toContainText(expectedNewest);
```

---

### P-FLAKY-04 — 애니메이션과 좌표 이동

**WHY**
드롭다운이 열리는 중에 항목을 클릭하면, 클릭 시점의 좌표와 실제 항목 위치가 달라 빗나간다. Playwright는 `stable` 상태를 기다리지만, JS 애니메이션이나 지속적 리렌더는 감지하지 못하는 경우가 있다.

**DETECT**

```bash
rg -n "framer-motion|react-spring|gsap" package.json
rg -n "animate-|transition-" src --glob "*.tsx" | wc -l
rg -n "reducedMotion" playwright.config.* tests
```

**진단**

```ts
// 클릭 시점에 요소가 움직이고 있는지 확인
test('클릭 대상이 안정적인지', async ({ page }) => {
  await page.goto('/dashboard');
  const menu = page.getByRole('button', { name: '계정 메뉴' });
  await menu.click();

  const item = page.getByRole('menuitem', { name: '설정' });
  const box1 = await item.boundingBox();
  await page.waitForTimeout(100);
  const box2 = await item.boundingBox();

  expect(box1, `요소가 이동 중: ${JSON.stringify(box1)} → ${JSON.stringify(box2)}`)
    .toEqual(box2);
});
```

**PASS / FAIL**

- PASS: 축소 모션 설정으로 애니메이션이 최소화되고, 클릭 대상이 안정적이다.
- FAIL: 애니메이션 중 클릭으로 간헐 실패(S2).

**FIX**

```ts
// playwright.config.ts — 기능 테스트에서는 모션을 줄인다
use: {
  reducedMotion: 'reduce',
},
```

제품이 `prefers-reduced-motion`을 존중하면 이것만으로 대부분 해결된다. 존중하지 않는다면 그 자체가 접근성 결함이다(`04_Visual_QA.md` V-MOTION-02).

```ts
// ✅ 그래도 남는 경우: 안정 상태를 명시적으로 확인
const menuItem = page.getByRole('menuitem', { name: '설정' });
await expect(menuItem).toBeVisible();
await expect(menuItem).toBeInViewport();
await menuItem.click();
```

```ts
// ✅ 최후 수단: 애니메이션 전역 비활성화 (시각 테스트가 아닌 경우에만)
test.beforeEach(async ({ page }) => {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }`,
  });
});
```

기능 테스트에서는 애니메이션 비활성화가 정당하다. 애니메이션 동작 자체는 별도 테스트에서 검증한다.

---

### P-FLAKY-05 — CI 환경 원인

**WHY**
로컬에서는 통과하고 CI에서만 실패하는 경우, 원인은 대개 리소스다. CI 러너는 CPU 2코어에 메모리 7GB인 경우가 많은데 워커를 8개 띄우면 각 브라우저가 자원을 두고 경합해 모든 동작이 느려진다.

**DETECT**

```bash
rg -n "workers" playwright.config.* .github/workflows/*.yml
nproc                                    # 로컬 코어 수
rg -n "runs-on" .github/workflows/*.yml  # CI 러너 사양
rg -n "shard" .github/workflows/*.yml
```

**진단**

```yaml
# CI에서 리소스 사용량 확인
- name: Resource info
  run: |
    nproc
    free -h
    df -h
```

```bash
# 로컬에서 CI 조건 재현
CI=1 pnpm playwright test --workers=4
docker run --cpus=2 --memory=7g --rm --ipc=host -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && CI=1 pnpm playwright test --workers=4"
```

**PASS / FAIL**

- PASS: CI 워커 수가 러너 코어 수 이하다. `--ipc=host`가 설정되어 있다. 로컬에서 CI 조건 재현이 가능하다.
- FAIL: 워커 과다로 타임아웃 다발(S2), 공유 메모리 부족으로 브라우저 크래시(S1).

**FIX**

```ts
// ✅ 워커 수를 러너 사양에 맞춘다
workers: process.env.CI ? 2 : undefined,   // 2코어 러너 기준
```

일반적으로 **워커 수 = 코어 수**가 상한이다. 브라우저는 CPU를 많이 쓰므로 코어보다 많은 워커는 역효과다. 더 빠르게 하려면 워커가 아니라 **샤딩**을 늘린다(P-CI-02).

```yaml
# ✅ Docker에서 --ipc=host 필수
# 없으면 Chromium이 공유 메모리 부족으로 크래시한다
container:
  image: mcr.microsoft.com/playwright:v1.50.0-noble
  options: --ipc=host
```

```yaml
# ✅ 또는 /dev/shm 크기 확대
options: --shm-size=2gb
```

```ts
// ✅ CI에서 타임아웃을 약간 여유 있게 (은폐가 아니라 환경 차이 보정)
timeout: process.env.CI ? 60_000 : 45_000,
```

이 조정은 "느린 환경 보정"이지 "flaky 은폐"가 아니다. 다만 늘려도 계속 실패하면 원인이 다른 곳에 있다.

---

### P-FLAKY-06 — 격리와 추적

**WHY**
원인을 즉시 제거할 수 없는 flaky는 방치하면 신뢰를 갉아먹는다. 격리해서 CI를 초록으로 유지하되, 반드시 추적 이슈를 만들고 기한을 정한다. 격리가 영구화되면 그냥 삭제하는 편이 낫다.

**DETECT**

```bash
rg -n "test\.fixme|test\.skip" tests -B2 | rg -v "process\.env" | head -20
rg -n "FLAKY|flaky" tests | head
git log --format="%ad %s" --date=short -20 -- tests | rg -i "flaky|skip"
```

**PASS / FAIL**

- PASS: 격리된 테스트에 사유·추적 이슈·기한이 주석으로 있다. 3개월 이상 방치된 격리가 없다.
- FAIL: 사유 없는 skip(S3), 장기 방치(S3 — 커버리지 착시).

**FIX**

```ts
// ✅ 격리에는 반드시 맥락을 남긴다
test.fixme(
  '결제 위젯 iframe 로드 후 카드 입력',
  // FLAKY (실패율 ~15%): 결제사 iframe이 간헐적으로 30초 이상 로드되지 않음.
  // 결제사에 문의 중. 추적: ISSUE-731. 기한: 2026-09-30.
  // 대안: tests/integration/payment.spec.ts에서 샌드박스로 커버 중.
  async ({ page }) => {
    // …
  },
);
```

`test.fixme`는 리포트에 명시적으로 표시되어 가시성이 유지된다. `test.skip`보다 선호한다(skip은 "의도적으로 해당 없음"의 의미로 쓴다).

```ts
// ✅ 조건부 skip은 사유를 명시
test('베타 기능', async ({ page }) => {
  test.skip(process.env.FEATURE_BETA !== '1', '베타 플래그 비활성 환경');
  // …
});

// ✅ 특정 브라우저에서만 미지원
test('클립보드 읽기', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit은 clipboard-read 권한을 지원하지 않는다');
  // …
});
```

```ts
// ✅ 격리 현황을 자동으로 감시
// tests/meta/quarantine.spec.ts
test('격리된 테스트에 추적 정보가 있다', () => {
  const out = execSync(`rg -n -A3 "test\\.fixme\\(" tests/e2e || true`, { encoding: 'utf8' });
  const blocks = out.split(/\n(?=tests\/)/).filter(Boolean);

  const missing = blocks.filter(b => !/ISSUE-\d+/.test(b));
  expect(missing, `추적 이슈가 없는 격리:\n${missing.join('\n')}`).toEqual([]);
});
```

---

## 16. 병렬성과 워커

### P-PAR-01 — 병렬 모델 이해

**WHY**
Playwright의 병렬성은 두 축으로 동작한다. 이를 이해하지 못하면 예상과 다른 실행 순서에 당황하거나, 병렬화 이득을 얻지 못한다.

```text
워커(worker) = 독립 프로세스
  └ 각 워커는 자기 브라우저 인스턴스를 갖는다
  └ 워커 스코프 픽스처는 워커당 1회 실행된다

fullyParallel: true   → 파일 내 테스트도 병렬 (기본 권장)
fullyParallel: false  → 파일 단위 병렬, 파일 내는 순차
describe.serial       → 해당 describe는 순차 + 실패 시 이후 skip
describe.parallel     → 해당 describe만 병렬 (fullyParallel: false일 때)
```

**DETECT**

```bash
rg -n "fullyParallel|describe\.serial|describe\.parallel|describe\.configure" playwright.config.* tests
rg -n "mode: 'serial'|mode: 'parallel'" tests
```

**PASS / FAIL**

- PASS: `fullyParallel: true`이고 `describe.serial` 사용에 정당한 사유가 있다.
- FAIL: 전체 순차 실행(S3 — 시간 낭비), 무분별한 serial(S2).

**FIX**

```ts
// playwright.config.ts
fullyParallel: true,
```

```ts
// ✅ 순차가 필요한 곳만 명시 + 사유
test.describe.configure({ mode: 'serial' });
// 이 describe는 단일 브라우저 컨텍스트를 공유하는 다단계 위저드이므로 순차 실행이 필요하다.
test.describe('온보딩 위저드', () => { /* … */ });
```

```ts
// ✅ 특정 파일만 순차
// tests/e2e/billing.spec.ts
test.describe.configure({ mode: 'serial' });
// 결제 테스트는 동일 테스트 카드를 사용하며 결제사 rate limit이 있어 순차 실행한다.
```

---

### P-PAR-02 — 워커 수 최적화

**WHY**
워커가 적으면 느리고, 많으면 리소스 경합으로 오히려 느려지고 flaky가 늘어난다. 최적값은 러너 사양과 테스트 성격에 따라 다르므로 **측정해서 정해야 한다.**

**DETECT**

```bash
nproc
rg -n "workers" playwright.config.* .github/workflows/*.yml
```

**진단**

```bash
# 워커 수별 실행 시간 측정
for w in 1 2 4 6 8; do
  echo "=== workers=$w ==="
  /usr/bin/time -f "%e초" pnpm playwright test tests/e2e --workers=$w --reporter=dot 2>&1 | tail -3
done
```

전형적인 결과: 코어 수까지는 선형에 가깝게 빨라지다가, 그 이상에서는 개선이 멈추거나 악화된다.

**PASS / FAIL**

- PASS: 워커 수가 측정에 근거해 설정되고, 그 값에서 flaky가 없다.
- FAIL: 근거 없는 값(S3), 과다 설정으로 flaky 유발(S2).

**FIX**

```ts
// ✅ 환경별로 다르게
workers: process.env.CI
  ? Number(process.env.PLAYWRIGHT_WORKERS ?? 2)   // CI 러너 사양에 맞춤
  : '75%',                                         // 로컬은 코어의 75%
```

Playwright는 `'50%'` 같은 백분율 문자열을 지원한다. 로컬 개발자 머신의 사양이 제각각일 때 유용하다.

```yaml
# ✅ CI에서 러너 사양에 맞춰 주입
env:
  PLAYWRIGHT_WORKERS: 2      # ubuntu-latest = 2 vCPU
```

큰 러너를 쓰면 워커를 늘릴 수 있다.

```yaml
runs-on: ubuntu-latest-8-cores
env:
  PLAYWRIGHT_WORKERS: 8
```

다만 워커 증가보다 **샤딩**이 확장성이 좋다. 워커는 단일 머신 안에서 경쟁하지만 샤드는 머신을 나눈다.

---

### P-PAR-03 — 병렬 안전성 검증

**WHY**
병렬로 안전한지는 실행해봐야 안다. 코드 리뷰로는 데이터 경합을 발견하기 어렵다. 정기적으로 병렬 스트레스 테스트를 수행해야 한다.

**DETECT**

```bash
# 병렬 안전성 종합 검사
pnpm playwright test tests/e2e --workers=8 --repeat-each=3 --shuffle
```

**PASS / FAIL**

- PASS: 워커 8개 × 3회 반복 × 임의 순서에서 전부 통과한다.
- FAIL: 실패 발생. 원인이 데이터 경합이면 S1.

**FIX**

실패한 테스트를 분석해 P-DATA-02와 P-FIX-03의 격리 전략을 적용한다.

```ts
// ✅ 병렬 안전성 회귀 방지: CI 야간 잡으로 상시 검증
```

```yaml
# .github/workflows/nightly-stress.yml
name: Nightly Parallel Stress

on:
  schedule:
    - cron: '0 18 * * *'   # 매일 03:00 KST
  workflow_dispatch:

jobs:
  stress:
    runs-on: ubuntu-latest-4-cores
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Parallel stress
        run: pnpm playwright test tests/e2e --workers=6 --repeat-each=3 --shuffle
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: stress-report
          path: playwright-report/
```

야간 스트레스 테스트는 일상 CI를 느리게 하지 않으면서 flaky를 조기에 발견한다.

---

### P-PAR-04 — 리소스 공유 지점

**WHY**
병렬 실행에서 충돌하는 것은 데이터만이 아니다. 파일 시스템(다운로드 경로), 포트, 외부 서비스 rate limit, 로그인 세션 개수 제한도 공유 자원이다.

**DETECT**

```bash
rg -n "downloadsPath|saveAs|writeFile" tests
rg -n "localhost:[0-9]+" tests playwright.config.*
rg -n "rate.?limit|429" src tests
rg -n "concurrent.?session|max.?session" src | head
```

**PASS / FAIL**

- PASS: 워커별로 파일 경로가 분리되고, rate limit이 있는 자원은 순차 처리된다.
- FAIL: 다운로드 파일 충돌(S2), rate limit 초과로 간헐 실패(S2).

**FIX**

```ts
// ✅ 워커별 다운로드 경로
test('CSV를 다운로드한다', async ({ page }, testInfo) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '내보내기' }).click();
  const download = await downloadPromise;

  // testInfo.outputPath는 테스트마다 고유한 디렉토리를 준다
  const filePath = testInfo.outputPath('members.csv');
  await download.saveAs(filePath);

  const content = fs.readFileSync(filePath, 'utf8');
  expect(content.split('\n')[0]).toBe('email,name,role');
});
```

`testInfo.outputPath()`는 `test-results/<project>-<test>-<retry>/` 아래 경로를 반환하므로 충돌이 구조적으로 불가능하다.

```ts
// ✅ rate limit이 있는 자원은 순차 처리
test.describe.configure({ mode: 'serial' });
// 결제사 샌드박스는 초당 1건으로 제한되어 순차 실행한다.
test.describe('결제 샌드박스', () => { /* … */ });
```

```ts
// ✅ 세션 개수 제한이 있으면 워커별 계정을 분리
workerAuth: [async ({ browser }, use, workerInfo) => {
  const account = TEST_ACCOUNTS[workerInfo.workerIndex % TEST_ACCOUNTS.length];
  const context = await browser.newContext();
  await loginViaApi(context, account);
  await use(context);
  await context.close();
}, { scope: 'worker' }],
```

---

## 17. 디버깅과 트레이스

### P-DEBUG-01 — 트레이스 활용

**WHY**
CI에서 실패했을 때 로그만으로는 원인을 알 수 없다. 트레이스는 각 액션의 스크린샷, DOM 스냅샷, 네트워크 요청, 콘솔 로그를 타임라인으로 보여준다. 트레이스가 없으면 "로컬에서 재현해보기"부터 시작해야 하고, 재현되지 않으면 막힌다.

**DETECT**

```bash
rg -n "trace:" playwright.config.*
fd -e zip . test-results 2>/dev/null | head
rg -n "upload-artifact" .github/workflows/*.yml -A8 | rg "test-results|trace"
```

**PASS / FAIL**

- PASS: 실패 시 트레이스가 남고 CI 아티팩트로 업로드된다. 팀이 트레이스 뷰어 사용법을 안다.
- FAIL: 트레이스 미설정(S2 — CI 디버깅 불가), 아티팩트 미업로드(S2).

**FIX**

```ts
// playwright.config.ts
use: {
  // 'on'은 모든 테스트에서 기록 → 느리고 용량이 크다
  // 'on-first-retry'는 첫 시도 실패를 놓친다
  // 'retain-on-failure'가 균형점
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: process.env.CI ? 'retain-on-failure' : 'off',
},
```

```bash
# 트레이스 열기
pnpm playwright show-trace test-results/e2e-members-멤버-삭제-chromium/trace.zip

# 웹에서 열기 (아티팩트 다운로드 후)
# https://trace.playwright.dev 에 드래그 앤 드롭
```

**트레이스에서 확인할 것**

```text
1. Actions 타임라인 — 어느 액션에서 멈췄는가
2. Before/After 스크린샷 — 액션 직전 화면 상태
3. DOM 스냅샷 — 요소가 실제로 있었는가, 어떤 속성이었는가
4. Network 탭 — 요청이 실패했는가, 응답이 무엇이었는가
5. Console 탭 — JS 오류가 있었는가
6. Source 탭 — 어느 테스트 코드 줄인가
```

DOM 스냅샷은 **실제로 클릭 가능한 상태였는지**를 보여준다. 요소 위에 오버레이가 있었는지, disabled였는지를 눈으로 확인할 수 있다.

```yaml
# CI 아티팩트 업로드
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-artifacts-${{ matrix.shard }}
    path: |
      playwright-report/
      test-results/
    retention-days: 14
```

---

### P-DEBUG-02 — 로컬 디버깅 도구

**WHY**
트레이스는 사후 분석용이다. 테스트를 작성하거나 수정할 때는 실시간 도구가 필요하다. Playwright는 세 가지를 제공하며 용도가 다르다.

| 도구 | 용도 |
|------|------|
| `--ui` | 테스트 목록·실행·타임라인·워치 모드. 일상 개발에 최적 |
| `--debug` | Inspector로 단계별 실행, 셀렉터 탐색 |
| `--headed` | 실제 브라우저 창에서 실행 관찰 |
| `page.pause()` | 특정 지점에서 멈추고 대화형 탐색 |
| `codegen` | 조작을 녹화해 코드 생성 |

**DETECT**

```bash
rg -n "page\.pause\(\)" tests            # 커밋되면 CI가 멈춘다
rg -n "\.only\(" tests
rg -n "headless: false" playwright.config.*
```

`page.pause()`가 커밋되면 CI가 타임아웃까지 멈춘다. `forbidOnly`처럼 차단 수단이 없으므로 리뷰에서 잡아야 한다.

**PASS / FAIL**

- PASS: 디버깅 코드(`page.pause`, `.only`, `headless: false`)가 커밋되지 않는다. 팀이 UI 모드를 사용한다.
- FAIL: 디버깅 코드 잔류(S2 — CI 중단 또는 커버리지 축소).

**FIX**

```bash
# ✅ UI 모드 — 가장 생산적인 개발 방법
pnpm playwright test --ui

# ✅ Inspector로 단계별 실행
pnpm playwright test tests/e2e/members.spec.ts --debug

# ✅ 특정 테스트만 헤디드로 관찰
pnpm playwright test -g "멤버를 삭제" --headed --workers=1

# ✅ 조작을 녹화해 초안 생성 (그대로 쓰지 말고 정리한다)
pnpm playwright codegen http://localhost:3000/settings/members
```

```ts
// ✅ 임시 디버깅: 반드시 제거한다
await page.pause();   // Inspector가 열리고 여기서 멈춘다
```

```bash
# ✅ 커밋 전 디버깅 코드 검사 (pre-commit hook)
#!/bin/sh
if rg -q "page\.pause\(\)|test\.only|describe\.only" tests; then
  echo "❌ 디버깅 코드가 남아 있습니다:"
  rg -n "page\.pause\(\)|test\.only|describe\.only" tests
  exit 1
fi
```

```ts
// ✅ 환경 변수로 조건부 일시정지 — 커밋해도 안전
if (process.env.PW_PAUSE) await page.pause();
```

---

### P-DEBUG-03 — 실패 컨텍스트 수집

**WHY**
트레이스가 있어도 애플리케이션 내부 상태(전역 스토어, 로컬스토리지, 기능 플래그)는 보이지 않는다. 실패 시 이를 자동으로 수집해 첨부하면 진단이 빨라진다.

**DETECT**

```bash
rg -n "testInfo\.attach" tests | wc -l
rg -n "afterEach" tests -A10 | rg "attach|screenshot"
```

**PASS / FAIL**

- PASS: 실패 시 애플리케이션 상태가 자동으로 수집되어 리포트에 첨부된다.
- FAIL: 실패 원인 추적에 반복적으로 시간이 소요됨(S3).

**FIX**

```ts
// tests/fixtures/base.ts — 실패 시 자동 수집
export const test = base.extend<Fixtures>({
  failureContext: [async ({ page }, use, testInfo) => {
    await use();

    if (testInfo.status === testInfo.expectedStatus) return;

    // 1. 현재 URL과 제목
    await testInfo.attach('page-info', {
      body: JSON.stringify({
        url: page.url(),
        title: await page.title().catch(() => 'n/a'),
      }, null, 2),
      contentType: 'application/json',
    });

    // 2. 화면의 오류 메시지
    const alerts = await page.getByRole('alert').allTextContents().catch(() => []);
    const statuses = await page.getByRole('status').allTextContents().catch(() => []);
    if (alerts.length || statuses.length) {
      await testInfo.attach('page-messages', {
        body: JSON.stringify({ alerts, statuses }, null, 2),
        contentType: 'application/json',
      });
    }

    // 3. 스토리지 상태
    const storage = await page.evaluate(() => {
      const dump = (s: Storage) => Object.fromEntries(
        Object.keys(s).map(k => [k, s.getItem(k)?.slice(0, 200)]));
      try {
        return { local: dump(localStorage), session: dump(sessionStorage) };
      } catch { return { error: 'storage 접근 불가' }; }
    }).catch(() => null);

    if (storage) {
      await testInfo.attach('storage', {
        body: JSON.stringify(storage, null, 2),
        contentType: 'application/json',
      });
    }

    // 4. 전체 페이지 스크린샷 (기본 스크린샷은 뷰포트만)
    const shot = await page.screenshot({ fullPage: true }).catch(() => null);
    if (shot) {
      await testInfo.attach('full-page-screenshot', { body: shot, contentType: 'image/png' });
    }
  }, { auto: true }],
});
```

`testInfo.attach`로 첨부한 내용은 HTML 리포트에서 테스트별로 표시된다. JSON은 접힌 상태로, 이미지는 인라인으로 렌더된다.

---

### P-DEBUG-04 — 서버 로그 연결

**WHY**
프론트엔드 테스트가 실패했을 때 원인이 서버에 있는 경우가 많다. 서버 로그를 함께 보지 못하면 "500 오류가 났다"까지만 알고 왜 났는지는 모른다.

**DETECT**

```bash
rg -n "stderr:|stdout:" playwright.config.*
rg -n "on\('response'" tests | head
rg -n "logs|server.log" .github/workflows/*.yml
```

**PASS / FAIL**

- PASS: 서버 로그가 수집되고 실패 시 접근 가능하다. 5xx 응답이 자동으로 기록된다.
- FAIL: 서버 오류 원인 추적 불가(S3).

**FIX**

```ts
// playwright.config.ts
webServer: {
  command: 'pnpm start',
  url: BASE_URL,
  stdout: 'pipe',      // 서버 로그를 콘솔로
  stderr: 'pipe',
},
```

```ts
// ✅ 5xx 응답을 자동으로 기록
export const test = base.extend<Fixtures>({
  serverErrors: [async ({ page }, use, testInfo) => {
    const errors: any[] = [];

    page.on('response', async res => {
      if (res.status() >= 500) {
        errors.push({
          url: res.url(),
          status: res.status(),
          body: await res.text().catch(() => '<읽기 실패>'),
          // 서버가 추적 ID를 헤더로 주면 로그 검색에 쓸 수 있다
          traceId: res.headers()['x-request-id'] ?? res.headers()['x-trace-id'],
        });
      }
    });

    await use();

    if (errors.length) {
      await testInfo.attach('server-errors', {
        body: JSON.stringify(errors, null, 2),
        contentType: 'application/json',
      });
      // 테스트가 성공했더라도 5xx는 문제다
      if (testInfo.status === testInfo.expectedStatus) {
        console.warn(`⚠ 5xx 응답 ${errors.length}건 발생 (테스트는 통과)`);
      }
    }
  }, { auto: true }],
});
```

`x-request-id`를 서버가 응답 헤더로 내려주면, 실패한 요청의 서버 로그를 정확히 찾을 수 있다. 제품에 이 기능이 없다면 추가를 제안한다.

```yaml
# CI에서 서버 로그를 파일로 남기고 아티팩트로
- run: pnpm start > server.log 2>&1 &
- run: npx wait-on http://localhost:3000
- run: pnpm playwright test
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: server-log
    path: server.log
```

---

### P-DEBUG-05 — 재현 절차 표준화

**WHY**
실패를 발견해도 재현 방법을 모르면 고칠 수 없다. CI 실패마다 사람이 다른 방법으로 접근하면 시간이 낭비된다. 표준 절차를 문서화하면 누구나 같은 순서로 진단할 수 있다.

**표준 재현 절차**

```bash
# 1. CI 아티팩트에서 트레이스 다운로드 후 확인
pnpm playwright show-trace <다운로드한 trace.zip>

# 2. 로컬에서 해당 테스트만 실행
pnpm playwright test -g "실패한 테스트 제목" --workers=1

# 3. 통과하면 → CI 조건 재현
CI=1 pnpm playwright test -g "실패한 테스트 제목" --workers=4 --repeat-each=5

# 4. 여전히 통과하면 → 컨테이너로 환경 통일
pnpm test:e2e:docker -- -g "실패한 테스트 제목" --repeat-each=5

# 5. 여전히 통과하면 → 리소스 제약 재현
docker run --cpus=2 --memory=7g --rm --ipc=host -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm build && CI=1 pnpm playwright test -g '제목' --workers=4 --repeat-each=10"

# 6. 여전히 통과하면 → 병렬 경합 재현
pnpm playwright test --workers=8 --repeat-each=3 --shuffle

# 7. 그래도 재현되지 않으면 → 트레이스 기반 정적 분석
#    P-FLAKY 장의 유형별 원인 체크리스트를 순회한다
```

**진단 결과별 조치**

| 재현 단계 | 원인 유형 | 조치 |
|-----------|-----------|------|
| 2번에서 재현 | 실제 결함 또는 테스트 오류 | 코드 수정 |
| 3번에서 재현 | 병렬/재시도 관련 | P-FLAKY-03 |
| 4번에서 재현 | 환경 차이 | 컨테이너 통일 |
| 5번에서 재현 | 리소스 부족 | 워커 조정, P-FLAKY-05 |
| 6번에서 재현 | 데이터 경합 | P-DATA-02 |
| 재현 안 됨 | 외부 요인 또는 저빈도 | 격리 + 추적, P-FLAKY-06 |

---

## 18. CI 통합과 샤딩

### P-CI-01 — 기본 워크플로

**WHY**
CI 설정이 잘못되면 (a) 브라우저를 매번 다운로드해 느리고, (b) 캐시 미스로 install이 반복되며, (c) 실패해도 아티팩트가 없어 진단할 수 없다.

**DETECT**

```bash
cat .github/workflows/*.yml
rg -n "playwright install|cache" .github/workflows/*.yml
rg -n "if: always\(\)|if: failure\(\)" .github/workflows/*.yml
```

**PASS / FAIL**

- PASS: 컨테이너 이미지 또는 브라우저 캐시로 설치 시간이 최소화된다. 실패 시 아티팩트가 업로드된다. PR에 결과가 표시된다.
- FAIL: 매 실행마다 브라우저 다운로드(S3 — 시간 낭비), 아티팩트 없음(S2).

**FIX**

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  # 같은 브랜치의 이전 실행을 취소해 자원을 아낀다
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    # 컨테이너를 쓰면 브라우저 설치가 불필요하다
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: e2e_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/e2e_test
      PLAYWRIGHT_BASE_URL: http://localhost:3000
      NODE_ENV: production
      TEST_SECRET: ${{ secrets.TEST_SECRET }}
      TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
      TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
      TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Prepare database
        run: |
          pnpm prisma migrate deploy
          pnpm db:seed:e2e

      - name: Build
        run: pnpm build

      - name: Start server
        run: |
          pnpm start &
          npx wait-on http://localhost:3000 --timeout 60000

      - name: Run E2E
        run: pnpm playwright test tests/e2e
        env:
          PLAYWRIGHT_WORKERS: 2

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 14
```

`concurrency` 설정으로 오래된 실행을 취소하면 러너 시간을 크게 아낄 수 있다.

**컨테이너를 쓰지 않는 경우 브라우저 캐시**

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: pw-cache
  with:
    path: ~/.cache/ms-playwright
    # 버전이 바뀌면 캐시를 무효화한다
    key: pw-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

- name: Install browsers
  if: steps.pw-cache.outputs.cache-hit != 'true'
  run: pnpm playwright install --with-deps chromium

- name: Install system deps (cache hit)
  if: steps.pw-cache.outputs.cache-hit == 'true'
  run: pnpm playwright install-deps chromium
```

캐시 히트여도 시스템 의존성은 설치해야 한다. 이를 빠뜨리면 브라우저가 실행되지 않는다.

---

### P-CI-02 — 샤딩

**WHY**
테스트가 늘어나면 단일 머신으로는 시간이 선형으로 증가한다. 샤딩은 테스트를 여러 머신에 나눠 병렬 실행하므로 거의 선형으로 시간을 줄인다. 워커 증가와 달리 CPU 경합이 없다.

**DETECT**

```bash
rg -n "shard" .github/workflows/*.yml
rg -n "blob|merge-reports" .github/workflows/*.yml package.json
# 현재 실행 시간
rg -n "Run E2E" .github/workflows/*.yml
```

**진단**

```text
실행 시간이 10분을 넘으면 샤딩을 검토한다.
샤드 수 = ceil(현재 실행 시간 / 목표 시간)
예: 20분 → 5분 목표 → 4샤드
```

**PASS / FAIL**

- PASS: 실행 시간이 목표(권장 10분) 이내다. 샤딩 시 리포트가 병합된다.
- FAIL: 실행 시간 초과로 개발 흐름 저해(S2), 샤드별 리포트 분산으로 확인 어려움(S3).

**FIX**

```yaml
jobs:
  e2e:
    strategy:
      fail-fast: false          # 한 샤드 실패로 나머지를 취소하지 않는다
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host
    steps:
      # … 준비 단계 …

      - name: Run E2E (shard ${{ matrix.shard }}/4)
        run: pnpm playwright test tests/e2e --shard=${{ matrix.shard }}/4
        env:
          PLAYWRIGHT_WORKERS: 2

      - name: Upload blob report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
          retention-days: 1

  merge-reports:
    if: ${{ !cancelled() }}
    needs: [e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge into HTML report
        run: pnpm playwright merge-reports --reporter=html,github ./all-blob-reports

      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 14
```

```ts
// playwright.config.ts — 샤딩 시 blob 리포터 필수
reporter: process.env.CI
  ? [['blob'], ['github'], ['list']]
  : [['html', { open: 'never' }], ['list']],
```

`blob` 리포터가 샤드별 결과를 병합 가능한 형태로 저장한다. 이것 없이는 샤드마다 별도 리포트가 생겨 전체 현황을 볼 수 없다.

**샤드 분배 균형**

Playwright는 테스트 파일 단위로 샤드를 나누므로, 파일 크기가 불균형하면 샤드 시간이 달라진다.

```bash
# 샤드별 예상 부하 확인
pnpm playwright test --list --reporter=json | jq -r '.suites[].file' | sort | uniq -c | sort -rn
```

큰 spec 파일을 분할하면 균형이 개선된다.

---

### P-CI-03 — 실행 시간 예산

**WHY**
CI가 느리면 개발자가 결과를 기다리지 않고 다음 작업으로 넘어가고, 실패를 늦게 발견한다. 30분 걸리는 E2E는 사실상 배포 후 검증이 된다. 예산을 정하고 초과하면 대응해야 한다.

**권장 예산**

| 단계 | 목표 |
|------|------|
| 스모크 | 1분 이내 |
| PR E2E | 10분 이내 |
| 전체 스위트(야간) | 30분 이내 |
| 로컬 단일 spec | 30초 이내 |

**DETECT**

```bash
# 테스트별 소요 시간 (느린 순)
pnpm playwright test --reporter=json > /tmp/r.json
jq -r '.suites[] | .. | objects | select(.title and .results) |
  "\(.results[0].duration // 0) \(.title)"' /tmp/r.json | sort -rn | head -20
```

**진단**

느린 테스트의 원인을 분류한다.

```text
- 하드 대기가 있는가 → P-WAIT-01
- UI로 데이터를 준비하는가 → API로 전환
- 불필요한 페이지 이동이 있는가
- 로그인을 반복하는가 → P-AUTH-01
- 대량 데이터를 매번 생성하는가 → 시드 활용
```

**PASS / FAIL**

- PASS: 각 단계가 예산 이내다. 상위 5개 느린 테스트의 원인이 파악되어 있다.
- FAIL: 예산 초과(S2), 원인 미파악(S3).

**FIX**

```ts
// ✅ 느린 테스트 자동 감시
// tests/meta/performance.spec.ts
test('개별 테스트가 예산을 초과하지 않는다', async () => {
  const report = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
  const BUDGET_MS = 30_000;
  const slow: string[] = [];

  function walk(suite: any) {
    for (const spec of suite.specs ?? []) {
      const duration = spec.tests?.[0]?.results?.[0]?.duration ?? 0;
      if (duration > BUDGET_MS) {
        slow.push(`${Math.round(duration / 1000)}s — ${spec.file} :: ${spec.title}`);
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  }
  for (const s of report.suites ?? []) walk(s);

  expect(slow, `예산(${BUDGET_MS / 1000}s) 초과 테스트:\n${slow.join('\n')}`).toEqual([]);
});
```

**최적화 기법**

```ts
// ✅ 1. API로 준비 (UI 대비 10배 빠름)
const member = await api.createMember({ orgId: org.id });   // 200ms
// vs UI로 생성: 5초

// ✅ 2. 불필요한 네비게이션 제거
// ❌ 홈 → 로그인 → 대시보드 → 설정
// ✅ storageState로 인증된 상태에서 설정으로 직행
await page.goto('/settings/members');

// ✅ 3. 서드파티 차단 (페이지 로드 30~50% 단축)
await blockThirdParty(page);

// ✅ 4. 이미지·폰트 차단 (기능 테스트에서만)
await page.route('**/*.{png,jpg,jpeg,webp,woff,woff2}', r => r.abort());
```

이미지 차단은 기능 테스트에서 유효하지만 시각 테스트에서는 절대 하면 안 된다.

```ts
// ✅ 5. 관련 없는 테스트를 PR에서 제외
// paths 필터로 변경된 영역만 실행
```

```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'app/**'
      - 'tests/**'
      - 'package.json'
```

---

### P-CI-04 — 실패 처리 정책

**WHY**
CI 실패를 무시하고 병합하는 문화가 자리 잡으면 스위트는 무의미해진다. 반대로 flaky 하나 때문에 배포가 막히면 팀이 스위트를 적대시한다. 명확한 정책이 필요하다.

**DETECT**

```bash
rg -n "continue-on-error" .github/workflows/*.yml
rg -n "required_status_checks|branch protection" .github 2>/dev/null
gh api repos/:owner/:repo/branches/main/protection 2>/dev/null | jq '.required_status_checks'
```

`continue-on-error: true`가 E2E 잡에 있으면 실패해도 병합된다.

**PASS / FAIL**

- PASS: E2E가 필수 체크이고, 실패 시 병합이 차단된다. flaky 대응 절차가 정의되어 있다.
- FAIL: 실패해도 병합 가능(S2 — 스위트 무력화), 정책 부재로 매번 논쟁(S3).

**FIX**

```yaml
# ✅ E2E를 필수 체크로 (branch protection)
# Settings → Branches → Require status checks to pass
#   - e2e (1/4), e2e (2/4), e2e (3/4), e2e (4/4)
#   - merge-reports
```

```yaml
# ❌ 실패를 무시
- name: Run E2E
  run: pnpm playwright test
  continue-on-error: true      # 이러면 아무 의미가 없다
```

**실패 대응 절차**

```text
1. 실패 확인
   - 트레이스로 원인 파악 (5분 이내 목표)

2. 분류
   a) 실제 결함 → 코드 수정 후 재실행
   b) 테스트 오류 → 테스트 수정 후 재실행
   c) flaky → 아래 절차

3. flaky 대응
   - 동일 커밋에서 재실행 (1회만)
   - 통과하면: 이슈 생성 + P-FLAKY 장으로 원인 추적, 병합 허용
   - 다시 실패하면: 실제 결함으로 간주, 병합 차단

4. 긴급 상황
   - 핫픽스가 필요한데 무관한 flaky가 막는 경우
   - 팀 리드 승인 하에 admin merge
   - 반드시 후속 이슈를 생성하고 24시간 내 처리
```

```yaml
# ✅ flaky 자동 리포팅
- name: Report flaky tests
  if: ${{ !cancelled() }}
  run: |
    if [ -f test-results/results.json ]; then
      node scripts/analyze-flaky.mjs >> $GITHUB_STEP_SUMMARY
    fi
```

---

### P-CI-05 — 배포 파이프라인 연결

**WHY**
E2E는 병합 전 검증뿐 아니라 배포 후 검증에도 쓰인다. 스테이징 배포 후 스모크를 돌려 실패하면 자동 롤백하는 것이 이상적이다. 프로덕션에서는 읽기 전용 스모크만 수행한다.

**DETECT**

```bash
rg -n "deploy|staging|production" .github/workflows/*.yml | head -20
rg -n "smoke" .github/workflows/*.yml
rg -n "rollback" .github/workflows/*.yml
```

**PASS / FAIL**

- PASS: 스테이징 배포 후 스모크가 자동 실행된다. 프로덕션 스모크는 읽기 전용이다.
- FAIL: 배포 후 검증 없음(S2), 프로덕션에서 데이터 변경 테스트 실행(**S0**).

**FIX**

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        id: deploy
        run: ./scripts/deploy.sh staging

  smoke-staging:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
      options: --ipc=host
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      - name: Smoke test
        run: pnpm playwright test tests/e2e/smoke --project=chromium
        env:
          PLAYWRIGHT_BASE_URL: https://staging.example.com
          TEST_USER_EMAIL: ${{ secrets.STAGING_TEST_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.STAGING_TEST_PASSWORD }}

  rollback:
    needs: [smoke-staging]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - run: ./scripts/rollback.sh staging
      - name: Notify
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"⚠ 스테이징 스모크 실패로 롤백했습니다: ${{ github.sha }}"}'
```

```ts
// ✅ 프로덕션 스모크: 읽기 전용만
// tests/e2e/smoke/production.spec.ts
test.describe('프로덕션 스모크 (읽기 전용)', () => {
  test.skip(!process.env.PRODUCTION_SMOKE, '프로덕션 스모크 전용');

  test('홈이 응답한다', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('헬스체크가 정상이다', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok' });
  });

  test('테스트 엔드포인트가 차단된다', async ({ request }) => {
    const res = await request.get('/api/test/cleanup');
    expect(res.status(), '테스트 엔드포인트가 프로덕션에 노출됨').toBe(404);
  });

  test('로그인 화면이 렌더된다', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('이메일')).toBeVisible();
    // 실제 로그인은 하지 않는다
  });
});
```

프로덕션 스모크는 **데이터를 만들거나 변경하지 않는다.** 로그인조차 하지 않는 것이 가장 안전하며, 필요하면 전용 모니터링 계정을 쓴다.

---

## 19. 리포팅과 관측

### P-REPORT-01 — 리포터 선택

**WHY**
리포터가 잘못 설정되면 (a) CI 로그가 수천 줄로 넘쳐 실패를 찾을 수 없거나, (b) 정보가 부족해 원인을 모른다. 환경별로 적합한 리포터가 다르다.

| 리포터 | 용도 |
|--------|------|
| `list` | 로컬 콘솔. 테스트별 결과를 순차 출력 |
| `dot` | CI 로그 최소화. 대규모 스위트에 적합 |
| `html` | 로컬 상세 분석. 트레이스·스크린샷 내장 |
| `blob` | 샤드 병합용. CI 필수 |
| `github` | PR에 어노테이션 표시 |
| `json` | 프로그램 처리용 |
| `junit` | 외부 도구 연동(Jenkins, GitLab) |

**DETECT**

```bash
rg -n "reporter" playwright.config.*
rg -n "reporter" .github/workflows/*.yml
```

**PASS / FAIL**

- PASS: 로컬은 html+list, CI는 blob+github(+list)로 설정된다. 샤딩 시 blob이 있다.
- FAIL: CI에서 html만 사용해 샤드 병합 불가(S3), 리포터 미설정(S3).

**FIX**

```ts
// playwright.config.ts
reporter: process.env.CI
  ? [
      ['blob'],                                    // 샤드 병합용
      ['github'],                                  // PR 어노테이션
      ['list', { printSteps: false }],             // 로그 (dot도 가능)
      ['json', { outputFile: 'test-results/results.json' }],  // 분석용
    ]
  : [
      ['html', { open: 'never' }],
      ['list'],
    ],
```

```bash
# HTML 리포트 열기
pnpm playwright show-report
```

`github` 리포터는 실패한 테스트를 PR의 해당 코드 줄에 인라인 어노테이션으로 표시한다. 리뷰어가 리포트를 열지 않아도 실패를 인지할 수 있다.

---

### P-REPORT-02 — 커스텀 리포터와 요약

**WHY**
기본 리포터는 개별 테스트 결과만 보여준다. 팀이 알아야 할 것은 "느린 테스트 상위 5개", "flaky 목록", "전체 소요 시간 추이" 같은 집계 정보다. GitHub Actions의 Step Summary에 이를 출력하면 클릭 없이 확인할 수 있다.

**DETECT**

```bash
rg -n "GITHUB_STEP_SUMMARY" .github/workflows/*.yml
fd "reporter" tests scripts 2>/dev/null
```

**PASS / FAIL**

- PASS: CI 실행 요약이 자동 생성되어 즉시 확인 가능하다.
- FAIL: 매번 리포트를 다운로드해 확인해야 함(S3).

**FIX**

```ts
// tests/reporters/summary-reporter.ts
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import fs from 'node:fs';

type Entry = { title: string; file: string; duration: number; status: string; retries: number };

export default class SummaryReporter implements Reporter {
  private entries: Entry[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    this.entries.push({
      title: test.title,
      file: test.location.file.replace(process.cwd() + '/', ''),
      duration: result.duration,
      status: result.status,
      retries: result.retry,
    });
  }

  onEnd(result: FullResult) {
    const passed = this.entries.filter(e => e.status === 'passed');
    const failed = this.entries.filter(e => e.status === 'failed');
    const flaky = this.entries.filter(e => e.status === 'passed' && e.retries > 0);
    const slow = [...this.entries].sort((a, b) => b.duration - a.duration).slice(0, 5);
    const totalMs = this.entries.reduce((s, e) => s + e.duration, 0);

    const lines = [
      `## E2E 실행 요약`,
      ``,
      `| 지표 | 값 |`,
      `|------|-----|`,
      `| 결과 | ${result.status} |`,
      `| 전체 | ${this.entries.length} |`,
      `| 통과 | ${passed.length} |`,
      `| 실패 | ${failed.length} |`,
      `| Flaky | ${flaky.length} |`,
      `| 총 소요 | ${(totalMs / 1000).toFixed(1)}초 |`,
      ``,
    ];

    if (failed.length) {
      lines.push(`### 실패`, ``);
      for (const f of failed) lines.push(`- \`${f.file}\` — ${f.title}`);
      lines.push(``);
    }

    if (flaky.length) {
      lines.push(`### Flaky (재시도 후 통과)`, ``);
      for (const f of flaky) lines.push(`- \`${f.file}\` — ${f.title} (${f.retries}회 재시도)`);
      lines.push(``);
    }

    lines.push(`### 느린 테스트 상위 5`, ``);
    for (const s of slow) {
      lines.push(`- ${(s.duration / 1000).toFixed(1)}초 — \`${s.file}\` ${s.title}`);
    }

    const summary = lines.join('\n');
    console.log('\n' + summary);

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
    }
  }
}
```

```ts
// playwright.config.ts
reporter: process.env.CI
  ? [['blob'], ['github'], ['./tests/reporters/summary-reporter.ts']]
  : [['html', { open: 'never' }], ['list']],
```

샤딩을 쓰면 샤드별로 요약이 나오므로, 병합 후 실행하는 별도 스크립트가 더 적합하다.

---

### P-REPORT-03 — 실행 이력 추적

**WHY**
단일 실행 결과만 보면 추세를 알 수 없다. "실행 시간이 3주 전보다 40% 늘었다", "이 테스트가 이번 달에 8번 flaky했다" 같은 정보가 있어야 개선 우선순위를 정할 수 있다.

**DETECT**

```bash
rg -n "junit|dashboard|report.*upload" .github/workflows/*.yml
fd "history|metrics" scripts tests 2>/dev/null
```

**PASS / FAIL**

- PASS: 실행 결과가 축적되어 추세를 볼 수 있다(외부 대시보드 또는 저장소 아티팩트).
- FAIL: 이력 없음(S3 — 개선 우선순위 판단 불가).

**FIX**

간단하게는 JSON 결과를 아티팩트로 축적하고 주기적으로 집계한다.

```yaml
- name: Record metrics
  if: ${{ !cancelled() }}
  run: |
    node -e "
      const fs = require('fs');
      const r = JSON.parse(fs.readFileSync('test-results/results.json','utf8'));
      const entry = {
        sha: process.env.GITHUB_SHA,
        ref: process.env.GITHUB_REF_NAME,
        timestamp: new Date().toISOString(),
        duration: r.stats?.duration ?? 0,
        expected: r.stats?.expected ?? 0,
        unexpected: r.stats?.unexpected ?? 0,
        flaky: r.stats?.flaky ?? 0,
      };
      fs.writeFileSync('metrics.json', JSON.stringify(entry));
    "

- uses: actions/upload-artifact@v4
  with:
    name: e2e-metrics-${{ github.run_id }}
    path: metrics.json
    retention-days: 90
```

더 나은 방법은 전용 서비스(Currents, Testomat, Allure TestOps)나 자체 대시보드로 전송하는 것이다. 규모가 작으면 위 방식으로 시작하고, 스위트가 200개를 넘으면 도구 도입을 검토한다.

```ts
// ✅ 리포터에서 직접 전송
export default class MetricsReporter implements Reporter {
  async onEnd(result: FullResult) {
    if (!process.env.METRICS_ENDPOINT) return;
    await fetch(process.env.METRICS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        project: 'saas-app',
        sha: process.env.GITHUB_SHA,
        status: result.status,
        duration: Date.now() - this.startTime,
        tests: this.entries,
      }),
    }).catch(e => console.warn('메트릭 전송 실패:', e));
  }
}
```

메트릭 전송 실패가 테스트를 실패시키면 안 된다. 반드시 `catch`로 감싼다.

---

### P-REPORT-04 — 스위트 건강 지표

**WHY**
"테스트 200개"는 품질 지표가 아니다. 의미 있는 지표는 신뢰성·경제성·유효성을 반영해야 한다.

**추적할 지표**

| 지표 | 목표 | 의미 |
|------|------|------|
| Flaky율 | 0% | 신뢰성 |
| 평균 실행 시간 | 예산 이내 | 경제성 |
| 실패 진단 시간 | 5분 이내 | 디버깅 비용 |
| 잡아낸 회귀 수 | 증가 | 유효성 |
| 거짓 양성 수 | 0 | 신뢰성 |
| 격리(fixme) 수 | 0에 수렴 | 부채 |
| P0 여정 커버리지 | 100% | 범위 |
| 하드 대기 수 | 0 | 코드 품질 |

**DETECT**

```bash
# 현재 상태 스냅샷
echo "테스트 수: $(rg -c '^\s*test\(' tests/e2e | awk -F: '{s+=$2} END {print s}')"
echo "격리 수: $(rg -c 'test\.fixme' tests | awk -F: '{s+=$2} END {print s+0}')"
echo "하드 대기: $(rg -c 'waitForTimeout' tests | awk -F: '{s+=$2} END {print s+0}')"
echo "조건부 어설션: $(rg -c 'if\s*\(await' tests | awk -F: '{s+=$2} END {print s+0}')"
echo "CSS 셀렉터: $(rg -c "locator\(['\"]\." tests | awk -F: '{s+=$2} END {print s+0}')"
```

**PASS / FAIL**

- PASS: 지표가 추적되고 목표 대비 개선 추세다.
- FAIL: 지표 부재(S3), 악화 추세 방치(S2).

**FIX**

```ts
// tests/meta/suite-health.spec.ts — 지표를 테스트로 강제
import { execSync } from 'node:child_process';

function count(pattern: string, path = 'tests/e2e'): number {
  try {
    const out = execSync(`rg -c "${pattern}" ${path} || true`, { encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean)
      .reduce((s, l) => s + Number(l.split(':').pop() ?? 0), 0);
  } catch { return 0; }
}

test.describe('스위트 건강 지표', () => {
  test('하드 대기가 없다', () => {
    expect(count('waitForTimeout'), '하드 대기 발견 — P-WAIT-01 참조').toBe(0);
  });

  test('조건부 어설션이 없다', () => {
    expect(count('if\\s*\\(await'), '조건부 어설션 발견 — P-ASSERT-02 참조').toBe(0);
  });

  test('CSS 클래스 셀렉터가 임계값 이하다', () => {
    expect(count("locator\\(['\\\"]\\."), 'CSS 셀렉터 과다 — P-SEL-01 참조')
      .toBeLessThanOrEqual(5);
  });

  test('비웹 우선 어설션이 없다', () => {
    expect(
      count('expect\\(await .*\\.(isVisible|textContent|count)\\(\\)\\)'),
      '비웹 우선 어설션 발견 — P-ASSERT-01 참조',
    ).toBe(0);
  });

  test('격리된 테스트가 임계값 이하다', () => {
    expect(count('test\\.fixme', 'tests'), '격리 과다 — P-FLAKY-06 참조')
      .toBeLessThanOrEqual(3);
  });
});
```

이 메타 테스트를 CI에 포함하면 스위트 품질이 자동으로 유지된다. 임계값은 현재 상태에서 시작해 점진적으로 낮춘다.

---

## 20. 특수 시나리오

### P-SPEC-01 — 파일 업로드

**WHY**
파일 업로드는 브라우저 API가 필요해 E2E로만 검증할 수 있다. 그런데 `input[type=file]`이 숨겨져 있거나(커스텀 UI), 드래그앤드롭만 지원하면 일반적인 방법으로는 조작할 수 없다.

**DETECT**

```bash
rg -n "type=\"file\"|setInputFiles|useDropzone|react-dropzone" src tests
rg -n "accept=|maxSize|multiple" src --glob "*.tsx" | head
```

**PASS / FAIL**

- PASS: 업로드 성공·용량 초과·형식 오류·다중 파일 시나리오가 커버된다.
- FAIL: 업로드 미검증(S2), 오류 시나리오 누락(S3).

**FIX**

```ts
// ✅ 기본 업로드
test('이미지를 업로드한다', async ({ page }) => {
  await page.goto('/settings/profile');
  await page.getByLabel('프로필 사진').setInputFiles('tests/fixtures/files/avatar.png');

  await expect(page.getByRole('img', { name: '프로필 사진 미리보기' })).toBeVisible();
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('status')).toContainText('업로드');
});
```

```ts
// ✅ 숨겨진 input (커스텀 UI)
test('드롭존을 통해 업로드한다', async ({ page }) => {
  await page.goto('/documents');

  // 파일 선택 대화상자를 가로챈다
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '파일 선택' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('tests/fixtures/files/report.pdf');

  await expect(page.getByText('report.pdf')).toBeVisible();
});
```

```ts
// ✅ 메모리에서 파일 생성 (픽스처 파일 불필요)
await page.getByLabel('첨부').setInputFiles({
  name: 'data.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('email,name\na@b.test,테스트\n'),
});
```

```ts
// ✅ 용량 초과 검증 — 실제 큰 파일 없이
test('10MB 초과 파일을 거부한다', async ({ page }) => {
  await page.goto('/documents');
  await page.getByLabel('파일').setInputFiles({
    name: 'large.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(11 * 1024 * 1024),   // 11MB
  });

  await expect(page.getByRole('alert')).toContainText(/10MB|용량/);
  await expect(page.getByRole('button', { name: '업로드' })).toBeDisabled();
});
```

```ts
// ✅ 드래그앤드롭 (실제 드롭 이벤트)
test('파일을 드래그앤드롭한다', async ({ page }) => {
  await page.goto('/documents');

  const buffer = Buffer.from('test content');
  const dataTransfer = await page.evaluateHandle(async ({ data, name, type }) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(data)], name, { type });
    dt.items.add(file);
    return dt;
  }, { data: Array.from(buffer), name: 'test.txt', type: 'text/plain' });

  await page.getByTestId('dropzone').dispatchEvent('drop', { dataTransfer });
  await expect(page.getByText('test.txt')).toBeVisible();
});
```

```ts
// ✅ 다중 파일 + 제거
await page.getByLabel('첨부').setInputFiles([
  'tests/fixtures/files/a.pdf',
  'tests/fixtures/files/b.pdf',
]);
await expect(page.getByTestId('file-item')).toHaveCount(2);

await page.getByRole('button', { name: 'a.pdf 제거' }).click();
await expect(page.getByTestId('file-item')).toHaveCount(1);

// 전체 제거
await page.getByLabel('첨부').setInputFiles([]);
await expect(page.getByTestId('file-item')).toHaveCount(0);
```

---

### P-SPEC-02 — 파일 다운로드

**WHY**
CSV 내보내기, PDF 생성, 백업 다운로드는 사용자에게 중요한 기능인데 검증이 누락되기 쉽다. 파일이 다운로드되었다는 사실뿐 아니라 **내용이 올바른지**도 확인해야 한다.

**DETECT**

```bash
rg -n "download|export|Content-Disposition" src | head -20
rg -n "waitForEvent\('download'\)" tests
```

**PASS / FAIL**

- PASS: 다운로드 파일명·형식·내용이 검증된다. 대용량 내보내기의 타임아웃이 조정되어 있다.
- FAIL: 다운로드 미검증(S2), 파일 내용 미확인(S3 — 빈 파일도 통과).

**FIX**

```ts
// ✅ 다운로드 + 내용 검증
test('멤버 목록을 CSV로 내보낸다', async ({ adminPage, org, api }, testInfo) => {
  await api.createMember({ orgId: org.id, name: '김민준', email: 'kim@example.test' });
  await adminPage.goto(`/orgs/${org.slug}/members`);

  const downloadPromise = adminPage.waitForEvent('download');
  await adminPage.getByRole('button', { name: 'CSV 내보내기' }).click();
  const download = await downloadPromise;

  // 1. 파일명
  expect(download.suggestedFilename()).toMatch(/members.*\.csv$/);

  // 2. 저장 (테스트별 격리 경로)
  const filePath = testInfo.outputPath('members.csv');
  await download.saveAs(filePath);

  // 3. 내용 검증
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');

  expect(lines[0], 'CSV 헤더').toBe('email,name,role,joinedAt');
  expect(lines.length, 'CSV 행 수').toBeGreaterThan(1);
  expect(content).toContain('kim@example.test');

  // 4. 한글 인코딩 (Excel 호환 BOM)
  const raw = fs.readFileSync(filePath);
  expect(raw.subarray(0, 3), 'UTF-8 BOM이 없어 Excel에서 한글이 깨진다')
    .toEqual(Buffer.from([0xEF, 0xBB, 0xBF]));
});
```

BOM 검증은 실무에서 자주 놓치는 부분이다. BOM이 없으면 Excel에서 한글이 깨져 사용자 불만으로 이어진다.

```ts
// ✅ 스트리밍 다운로드 (대용량)
test('대용량 데이터를 내보낸다', async ({ adminPage }, testInfo) => {
  test.setTimeout(120_000);   // 서버 생성에 최대 60초

  const downloadPromise = adminPage.waitForEvent('download', { timeout: 90_000 });
  await adminPage.getByRole('button', { name: '전체 내보내기' }).click();

  // 진행 표시가 나타나는가
  await expect(adminPage.getByRole('progressbar')).toBeVisible();

  const download = await downloadPromise;
  const path = await download.path();
  const stats = fs.statSync(path!);
  expect(stats.size, '다운로드 파일이 비어 있음').toBeGreaterThan(1000);
});
```

```ts
// ✅ 새 탭에서 열리는 PDF
test('영수증 PDF를 확인한다', async ({ page, context }) => {
  const pagePromise = context.waitForEvent('page');
  await page.getByRole('link', { name: '영수증 보기' }).click();
  const pdfPage = await pagePromise;

  await expect(pdfPage).toHaveURL(/\/receipts\/.*\.pdf/);
  // PDF 내용 검증은 API로
  const res = await page.request.get(pdfPage.url());
  expect(res.headers()['content-type']).toContain('application/pdf');
  const body = await res.body();
  expect(body.subarray(0, 4).toString()).toBe('%PDF');
});
```

---

### P-SPEC-03 — 새 탭·팝업·다중 컨텍스트

**WHY**
`target="_blank"` 링크, OAuth 팝업, 다중 사용자 시나리오는 여러 페이지·컨텍스트를 다뤄야 한다. 이벤트 리스너를 클릭 **전에** 등록하지 않으면 새 페이지를 놓친다.

**DETECT**

```bash
rg -n "target=\"_blank\"|window\.open" src | head -20
rg -n "waitForEvent\('page'\)|newContext" tests
```

**PASS / FAIL**

- PASS: 새 탭 시나리오가 커버되고 `rel="noopener"`가 검증된다. 다중 사용자 시나리오에 별도 컨텍스트를 쓴다.
- FAIL: 새 탭 미검증(S3), `noopener` 누락 미탐지(S2 — 보안).

**FIX**

```ts
// ✅ 새 탭 처리
test('문서 링크가 새 탭에서 열린다', async ({ page, context }) => {
  await page.goto('/help');

  const pagePromise = context.waitForEvent('page');   // 클릭 전에 등록
  await page.getByRole('link', { name: '전체 문서 (새 창)' }).click();
  const newPage = await pagePromise;

  await newPage.waitForLoadState();
  await expect(newPage).toHaveURL(/docs\.example\.com/);
  await expect(newPage.getByRole('heading', { level: 1 })).toBeVisible();

  // 원래 페이지는 그대로인가
  await expect(page).toHaveURL(/\/help/);

  await newPage.close();
});
```

```ts
// ✅ 외부 링크 보안 속성 검증
test('외부 링크에 noopener가 설정된다', async ({ page }) => {
  await page.goto('/help');

  const external = await page.getByRole('link').evaluateAll(links =>
    links
      .filter(l => (l as HTMLAnchorElement).target === '_blank')
      .filter(l => {
        const rel = l.getAttribute('rel') ?? '';
        return !rel.includes('noopener');
      })
      .map(l => (l as HTMLAnchorElement).href));

  expect(external, `noopener 누락 링크:\n${external.join('\n')}`).toEqual([]);
});
```

```ts
// ✅ 다중 사용자 실시간 협업
test('한 사용자의 변경이 다른 사용자에게 반영된다', async ({ browser }) => {
  const aliceCtx = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
  const bobCtx = await browser.newContext({ storageState: 'tests/.auth/member.json' });

  const alice = await aliceCtx.newPage();
  const bob = await bobCtx.newPage();

  await Promise.all([
    alice.goto('/documents/shared-doc'),
    bob.goto('/documents/shared-doc'),
  ]);

  await alice.getByRole('textbox', { name: '문서 제목' }).fill('새 제목');
  await alice.getByRole('button', { name: '저장' }).click();

  // Bob 화면에 실시간 반영 (WebSocket)
  await expect(bob.getByRole('textbox', { name: '문서 제목' }))
    .toHaveValue('새 제목', { timeout: 15_000 });
  await expect(bob.getByRole('status')).toContainText(/변경|업데이트/);

  await Promise.all([aliceCtx.close(), bobCtx.close()]);
});
```

---

### P-SPEC-04 — 대화상자와 권한

**WHY**
`window.confirm`, `alert`, `prompt`는 처리하지 않으면 테스트가 멈춘다. 위치·알림·카메라 권한 요청도 마찬가지로 사전 설정이 필요하다.

**DETECT**

```bash
rg -n "window\.confirm|window\.alert|window\.prompt|confirm\(" src
rg -n "navigator\.(geolocation|permissions|clipboard|mediaDevices)" src
rg -n "Notification\.requestPermission" src
rg -n "on\('dialog'\)|permissions:" tests playwright.config.*
```

**PASS / FAIL**

- PASS: 네이티브 대화상자가 처리되고, 권한이 컨텍스트 레벨에서 설정된다.
- FAIL: 대화상자로 테스트 hang(S2), 권한 미설정으로 기능 미검증(S3).

**FIX**

```ts
// ✅ 네이티브 대화상자 처리 (클릭 전에 핸들러 등록)
test('삭제 확인 대화상자를 수락한다', async ({ page }) => {
  await page.goto('/settings/danger');

  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('되돌릴 수 없습니다');
    await dialog.accept();
  });

  await page.getByRole('button', { name: '계정 삭제' }).click();
  await expect(page).toHaveURL(/\/goodbye/);
});
```

```ts
// ✅ 대화상자 거부
page.once('dialog', d => d.dismiss());

// ✅ prompt에 값 입력
page.once('dialog', d => d.accept('입력값'));
```

Playwright는 핸들러가 없으면 대화상자를 **자동으로 dismiss**한다. 따라서 hang은 발생하지 않지만, confirm이 거부되어 예상과 다른 결과가 나온다.

```ts
// ✅ 권한 설정
test.use({
  permissions: ['geolocation', 'notifications', 'clipboard-read', 'clipboard-write'],
  geolocation: { latitude: 37.5665, longitude: 126.9780 },   // 서울시청
  colorScheme: 'light',
});

test('현재 위치 기반 검색', async ({ page }) => {
  await page.goto('/stores');
  await page.getByRole('button', { name: '내 주변 매장' }).click();
  await expect(page.getByText(/서울|중구/)).toBeVisible();
});
```

```ts
// ✅ 권한 거부 시나리오
test('위치 권한 거부 시 수동 입력을 안내한다', async ({ page, context }) => {
  await context.clearPermissions();   // 모든 권한 제거
  await page.goto('/stores');
  await page.getByRole('button', { name: '내 주변 매장' }).click();
  await expect(page.getByRole('alert')).toContainText(/위치 권한|직접 입력/);
  await expect(page.getByLabel('지역 검색')).toBeVisible();
});
```

```ts
// ✅ 클립보드
test('초대 링크를 복사한다', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/settings/members');
  await page.getByRole('button', { name: '초대 링크 복사' }).click();

  await expect(page.getByRole('status')).toContainText('복사');

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/https:\/\/.*\/invite\/[\w-]+/);
});
```

클립보드 권한은 Chromium만 지원한다. WebKit/Firefox에서는 `test.skip`으로 제외한다.

---

### P-SPEC-05 — 키보드와 마우스 정밀 조작

**WHY**
드래그앤드롭 정렬, 단축키, 다중 선택(Shift/Ctrl 클릭), 커서 위치 조작은 일반 `click()`과 `fill()`로는 검증할 수 없다.

**DETECT**

```bash
rg -n "onKeyDown|useHotkeys|addEventListener\('key" src | head
rg -n "dnd-kit|react-beautiful-dnd|sortable" package.json
rg -n "shiftKey|ctrlKey|metaKey" src
rg -n "\.press\(|keyboard\.|mouse\." tests | wc -l
```

**PASS / FAIL**

- PASS: 단축키·드래그 정렬·다중 선택이 검증된다. 플랫폼별 수식 키가 처리된다.
- FAIL: 키보드 기능 미검증(S3), 드래그 기능 미검증(S2 — 수동 테스트에 의존).

**FIX**

```ts
// ✅ 단축키 (플랫폼 대응)
test('Cmd/Ctrl+K로 검색을 연다', async ({ page, browserName }) => {
  await page.goto('/dashboard');
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

  await page.keyboard.press(`${modifier}+KeyK`);
  await expect(page.getByRole('dialog', { name: '검색' })).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
```

```ts
// ✅ 다중 선택
test('Shift 클릭으로 범위 선택한다', async ({ page }) => {
  await page.goto('/settings/members');
  const rows = page.getByRole('row').filter({ has: page.getByRole('checkbox') });

  await rows.nth(0).getByRole('checkbox').check();
  await rows.nth(4).getByRole('checkbox').click({ modifiers: ['Shift'] });

  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(5);
  await expect(page.getByText('5개 선택됨')).toBeVisible();
});
```

```ts
// ✅ 드래그앤드롭 (라이브러리 기본 방식)
test('목록 순서를 드래그로 변경한다', async ({ page }) => {
  await page.goto('/settings/fields');

  const first = page.getByTestId('field-item').first();
  const third = page.getByTestId('field-item').nth(2);

  await first.dragTo(third);

  const order = await page.getByTestId('field-item').allTextContents();
  expect(order[0]).not.toBe('이름');   // 첫 항목이 이동했다
});
```

`dragTo`가 동작하지 않는 라이브러리(dnd-kit 등)에서는 수동 마우스 조작이 필요하다.

```ts
// ✅ 수동 드래그 (dnd-kit 등 센서 기반 라이브러리)
test('dnd-kit 목록을 재정렬한다', async ({ page }) => {
  await page.goto('/settings/fields');

  const source = page.getByTestId('field-item').first();
  const target = page.getByTestId('field-item').nth(2);

  const sBox = (await source.boundingBox())!;
  const tBox = (await target.boundingBox())!;

  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
  await page.mouse.down();
  // 센서 활성화 임계값을 넘기기 위한 작은 이동
  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2 + 10, { steps: 5 });
  // 목표 지점까지 여러 단계로 이동 (한 번에 이동하면 감지되지 않는다)
  await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, { steps: 20 });
  await page.mouse.up();

  await expect(page.getByRole('status')).toContainText('순서가 변경');
});
```

`steps` 옵션이 중요하다. 드래그 라이브러리는 연속적인 `mousemove` 이벤트를 기대하므로, 한 번에 점프하면 인식하지 않는다.

```ts
// ✅ 키보드 드래그 (접근성 대안 — 반드시 함께 검증)
test('키보드로 순서를 변경한다', async ({ page }) => {
  await page.goto('/settings/fields');

  await page.getByTestId('field-item').first().getByRole('button', { name: /이동/ }).focus();
  await page.keyboard.press('Space');     // 잡기
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');     // 놓기

  await expect(page.getByRole('status')).toContainText(/3번째 위치|순서가 변경/);
});
```

---

### P-SPEC-06 — 시간 의존 기능

**WHY**
세션 만료, 자동 저장, 폴링, 카운트다운, 예약 발행은 시간이 지나야 동작한다. 실제로 기다리면 테스트가 몇 분씩 걸린다. `page.clock`으로 시간을 조작하면 즉시 검증할 수 있다.

**DETECT**

```bash
rg -n "setInterval|setTimeout" src --glob "*.tsx" | head -20
rg -n "autosave|폴링|polling|countdown|expire" src | head
rg -n "page\.clock" tests
```

**PASS / FAIL**

- PASS: 시간 의존 기능이 `page.clock`으로 즉시 검증된다. 실제 대기로 테스트가 길어지지 않는다.
- FAIL: 실제 시간 대기(S2 — 느림), 시간 의존 기능 미검증(S3).

**FIX**

```ts
// ✅ 자동 저장 (30초 주기)
test('30초마다 자동 저장한다', async ({ page }) => {
  await page.clock.install();
  await page.goto('/documents/draft-1');

  let saveCount = 0;
  page.on('request', r => {
    if (r.url().includes('/api/documents') && r.method() === 'PATCH') saveCount++;
  });

  await page.getByRole('textbox', { name: '본문' }).fill('내용 작성 중');

  // 실제로 기다리지 않고 시간을 앞당긴다
  await page.clock.runFor('00:30');
  await expect(page.getByRole('status')).toContainText('자동 저장됨');
  expect(saveCount).toBe(1);

  await page.clock.runFor('00:30');
  expect(saveCount).toBe(2);
});
```

```ts
// ✅ 세션 만료 경고 (25분 후 경고, 30분 후 만료)
test('세션 만료 전 경고를 표시한다', async ({ page }) => {
  await page.clock.install();
  await page.goto('/dashboard');

  await page.clock.fastForward('24:00');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  await page.clock.fastForward('01:30');   // 25분 30초 경과
  await expect(page.getByRole('alertdialog', { name: /세션 만료/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '세션 연장' })).toBeVisible();
});
```

`runFor`는 타이머를 순차 실행하며 시간을 진행시키고, `fastForward`는 타이머를 건너뛰며 즉시 이동한다. 중간 상태를 검증하려면 `runFor`를 쓴다.

```ts
// ✅ 카운트다운
test('쿠폰 만료 카운트다운이 동작한다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-30T09:00:00+09:00'));
  await page.goto('/promo');

  await expect(page.getByTestId('countdown')).toContainText('23:59:59');

  await page.clock.install();
  await page.clock.runFor('01:00');
  await expect(page.getByTestId('countdown')).toContainText('23:58:59');
});
```

```ts
// ✅ 날짜 경계 (자정 넘김)
test('자정 이후 "오늘" 필터가 갱신된다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-30T23:59:00+09:00'));
  await page.goto('/reports?range=today');
  await expect(page.getByTestId('date-range')).toContainText('7월 30일');

  await page.clock.setFixedTime(new Date('2026-07-31T00:01:00+09:00'));
  await page.reload();
  await expect(page.getByTestId('date-range')).toContainText('7월 31일');
});
```

---

### P-SPEC-07 — 실시간 통신

**WHY**
WebSocket과 SSE로 구현된 실시간 기능(알림, 협업, 진행률)은 일반적인 요청/응답 모킹으로 제어할 수 없다. 검증하지 않으면 실시간 기능이 조용히 깨진 채 배포된다.

**DETECT**

```bash
rg -n "WebSocket|socket\.io|EventSource|pusher|ably" src package.json
rg -n "routeWebSocket|waitForEvent\('websocket'\)" tests
```

**PASS / FAIL**

- PASS: 실시간 기능이 실제 연결 또는 모킹으로 검증된다. 연결 끊김·재연결이 커버된다.
- FAIL: 실시간 기능 미검증(S2), 재연결 미검증(S3).

**FIX**

```ts
// ✅ WebSocket 모킹 (Playwright 1.48+)
test('실시간 알림이 표시된다', async ({ page }) => {
  await page.routeWebSocket('**/ws', ws => {
    ws.onMessage(message => {
      const msg = JSON.parse(String(message));
      if (msg.type === 'subscribe') {
        ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
      }
    });

    // 서버 푸시 시뮬레이션
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'notification',
        payload: { title: '새 멤버 가입', body: '김민준님이 참여했습니다' },
      }));
    }, 500);
  });

  await page.goto('/dashboard');
  await expect(page.getByRole('status')).toContainText('김민준님이 참여했습니다');
  await expect(page.getByTestId('notification-badge')).toHaveText('1');
});
```

```ts
// ✅ 실제 WebSocket 관찰
test('WebSocket 연결이 수립되고 하트비트를 보낸다', async ({ page }) => {
  const messages: string[] = [];

  page.on('websocket', ws => {
    expect(ws.url()).toMatch(/wss?:\/\/.*\/ws/);
    ws.on('framesent', f => messages.push(`→ ${f.payload}`));
    ws.on('framereceived', f => messages.push(`← ${f.payload}`));
    ws.on('close', () => messages.push('closed'));
  });

  await page.goto('/dashboard');
  await expect(page.getByTestId('connection-status')).toHaveText('연결됨');

  await expect.poll(() => messages.filter(m => m.includes('ping')).length,
    { timeout: 40_000 }).toBeGreaterThan(0);
});
```

```ts
// ✅ 연결 끊김과 재연결
test('연결이 끊기면 안내하고 자동 재연결한다', async ({ page, context }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('connection-status')).toHaveText('연결됨');

  await context.setOffline(true);
  await expect(page.getByTestId('connection-status')).toHaveText(/연결 끊김|재연결/, { timeout: 15_000 });
  await expect(page.getByRole('alert')).toContainText(/연결이 끊/);

  await context.setOffline(false);
  await expect(page.getByTestId('connection-status')).toHaveText('연결됨', { timeout: 30_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
});
```

```ts
// ✅ SSE (Server-Sent Events)
test('진행률이 실시간으로 갱신된다', async ({ page }) => {
  await page.route('**/api/jobs/*/stream', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
      body: [
        'data: {"progress":25}\n\n',
        'data: {"progress":50}\n\n',
        'data: {"progress":100,"status":"completed"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/jobs/job-1');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByRole('status')).toContainText('완료');
});
```

---

### P-SPEC-08 — 접근성 자동 검사 통합

**WHY**
접근성 검사를 별도 프로세스로 두면 실행되지 않는다. E2E 스위트에 통합하면 매 실행마다 자동으로 검증된다. 자동 검사는 WCAG 이슈의 30~40%만 잡지만, 그 30%는 확실히 잡는다.

**DETECT**

```bash
rg -n "axe-core|@axe-core/playwright" package.json
fd . tests/a11y 2>/dev/null
rg -n "AxeBuilder" tests
```

**PASS / FAIL**

- PASS: P0 라우트에 axe 검사가 자동 실행된다. 위반이 0이거나 문서화된 예외만 있다.
- FAIL: 접근성 검사 없음(S2), 위반 방치(S2).

**FIX**

```bash
pnpm add -D @axe-core/playwright
```

```ts
// tests/a11y/axe.spec.ts
import { test, expect } from '../fixtures/base';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  { path: '/', name: '홈' },
  { path: '/pricing', name: '요금제' },
  { path: '/auth/login', name: '로그인' },
  { path: '/dashboard', name: '대시보드', auth: true },
  { path: '/settings/members', name: '멤버 설정', auth: true },
];

for (const route of ROUTES) {
  test(`${route.name} 접근성 위반이 없다`, async ({ page, memberPage }) => {
    const target = route.auth ? memberPage : page;
    await target.goto(route.path);
    await expect(target.getByRole('heading', { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page: target })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      // 서드파티 위젯은 제어할 수 없으므로 제외
      .exclude('#intercom-container')
      .exclude('iframe[title*="결제"]')
      .analyze();

    const summary = results.violations.map(v =>
      `[${v.impact}] ${v.id}: ${v.help}\n` +
      v.nodes.slice(0, 3).map(n => `    ${n.target.join(' ')}\n    ${n.failureSummary}`).join('\n'),
    ).join('\n\n');

    expect(results.violations, `${route.name} 접근성 위반:\n\n${summary}`).toEqual([]);
  });
}
```

```ts
// ✅ 상태별 검사 — 모달·드로어는 열린 상태에서 검사해야 한다
test('초대 모달 접근성', async ({ adminPage }) => {
  await adminPage.goto('/settings/members');
  await adminPage.getByRole('button', { name: '멤버 초대' }).click();
  await expect(adminPage.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page: adminPage })
    .include('[role="dialog"]')      // 모달만 검사
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

```ts
// ✅ 기존 위반이 많은 프로젝트: 점진 개선
const KNOWN_ISSUES = new Set([
  'color-contrast',       // ISSUE-812: 디자인 토큰 조정 예정 (2026-09)
  'landmark-unique',      // ISSUE-813: 레이아웃 리팩터링 예정
]);

const newViolations = results.violations.filter(v => !KNOWN_ISSUES.has(v.id));
expect(newViolations, '새로운 접근성 위반').toEqual([]);

// 알려진 이슈가 해결되면 목록에서 제거하도록 감시
const fixed = [...KNOWN_ISSUES].filter(
  id => !results.violations.some(v => v.id === id));
expect(fixed, `해결된 이슈를 KNOWN_ISSUES에서 제거하세요: ${fixed.join(', ')}`).toEqual([]);
```

해결된 이슈를 목록에서 제거하도록 강제하면, 예외 목록이 영구화되는 것을 막을 수 있다. 상세 접근성 검사는 `09_Accessibility_QA.md`를 따른다.

---

## 21. Component Test와 API Test

Playwright는 E2E 전용 도구가 아니다. API 테스트와 컴포넌트 테스트를 같은 도구·같은 문법으로 수행하면 계층 간 이동 비용이 줄어든다.

### P-CT-01 — API 테스트

**WHY**
권한 매트릭스, 입력 검증, 응답 스키마, 오류 코드는 브라우저 없이 검증할 수 있다. API 테스트는 E2E보다 10~50배 빠르므로, 조합이 많은 검증을 여기로 옮기면 전체 실행 시간이 크게 줄어든다.

**DETECT**

```bash
fd . tests/api 2>/dev/null | wc -l
rg -n "request\.(get|post|put|patch|delete)" tests | wc -l
rg -n "name: 'api'" playwright.config.*
fd "route.ts" src/app/api | wc -l          # API 엔드포인트 수
```

엔드포인트 수 대비 API 테스트가 현저히 적으면 공백이다.

**PASS / FAIL**

- PASS: 주요 엔드포인트의 성공·검증 실패·권한·오류 응답이 커버된다. 브라우저 없이 실행되는 별도 프로젝트다.
- FAIL: API 검증을 전부 E2E로 수행(S2 — 느림), API 테스트 부재(S2).

**FIX**

```ts
// playwright.config.ts — 브라우저 없는 프로젝트
{
  name: 'api',
  testMatch: /api\/.*\.spec\.ts/,
  use: { baseURL: BASE_URL },      // devices 없음 → 브라우저 미실행
},
```

```ts
// tests/api/members.api.spec.ts
import { test, expect } from '@playwright/test';
import { z } from 'zod';

const MemberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'member', 'viewer']),
  createdAt: z.string().datetime(),
});

test.describe('POST /api/members', () => {
  test.use({ storageState: 'tests/.auth/admin.json' });

  test('유효한 입력으로 멤버를 생성한다', async ({ request }) => {
    const res = await request.post('/api/members', {
      data: { email: `api-${Date.now()}@example.test`, name: '테스트', role: 'member' },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    const parsed = MemberSchema.safeParse(body);
    expect(parsed.success, `스키마 불일치: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    expect(res.headers()['location']).toMatch(/\/api\/members\/[\w-]+/);
  });

  // 입력 검증은 조합이 많으므로 여기서 처리 — E2E로 하면 12분이 12초가 된다
  const INVALID_INPUTS = [
    { input: { email: 'invalid' },                    field: 'email',   reason: '형식 오류' },
    { input: { email: '' },                           field: 'email',   reason: '빈 값' },
    { input: { email: 'a@b.test', role: 'superuser' },field: 'role',    reason: '허용되지 않는 값' },
    { input: { email: 'a@b.test', name: 'x'.repeat(300) }, field: 'name', reason: '길이 초과' },
    { input: {},                                      field: 'email',   reason: '필수 누락' },
  ];

  for (const { input, field, reason } of INVALID_INPUTS) {
    test(`잘못된 입력을 거부한다: ${field} ${reason}`, async ({ request }) => {
      const res = await request.post('/api/members', { data: input });
      expect(res.status()).toBe(400);

      const body = await res.json();
      expect(body.errors, `${field} 오류가 응답에 없음`).toHaveProperty(field);
    });
  }

  test('중복 이메일을 거부한다', async ({ request }) => {
    const email = `dup-${Date.now()}@example.test`;
    const first = await request.post('/api/members', { data: { email, name: 'A' } });
    expect(first.status()).toBe(201);

    const second = await request.post('/api/members', { data: { email, name: 'B' } });
    expect(second.status()).toBe(409);
  });
});
```

```ts
// ✅ 권한 매트릭스 — E2E로 하면 15분, API로는 20초
const ENDPOINTS = [
  { method: 'get',    path: '/api/members',            admin: 200, member: 200, viewer: 200, guest: 401 },
  { method: 'post',   path: '/api/members',            admin: 201, member: 201, viewer: 403, guest: 401 },
  { method: 'delete', path: '/api/members/:id',        admin: 204, member: 403, viewer: 403, guest: 401 },
  { method: 'get',    path: '/api/billing/invoices',   admin: 200, member: 403, viewer: 403, guest: 401 },
  { method: 'patch',  path: '/api/settings/general',   admin: 200, member: 403, viewer: 403, guest: 401 },
] as const;

for (const ep of ENDPOINTS) {
  for (const role of ['admin', 'member', 'viewer', 'guest'] as const) {
    test(`${ep.method.toUpperCase()} ${ep.path} — ${role}`, async ({ playwright }) => {
      const ctx = await playwright.request.newContext({
        baseURL: BASE_URL,
        storageState: role === 'guest' ? undefined : `tests/.auth/${role}.json`,
      });

      const path = ep.path.replace(':id', TEST_MEMBER_ID);
      const res = await ctx[ep.method](path, ep.method === 'get' || ep.method === 'delete'
        ? undefined
        : { data: SAMPLE_PAYLOAD[ep.path] });

      expect(res.status(), `${role}의 ${ep.method} ${ep.path} 응답`).toBe(ep[role]);
      await ctx.dispose();
    });
  }
}
```

20개 조합이 20초에 끝난다. 같은 것을 E2E로 하면 15분 이상이다.

---

### P-CT-02 — Component Test

**WHY**
컴포넌트 하나의 상태 조합(로딩·빈·오류·데이터·비활성)을 E2E로 검증하려면 매번 그 상태를 만들 서버 조건이 필요하다. 컴포넌트 테스트는 props로 직접 상태를 주입하므로 훨씬 간단하고 빠르다.

**DETECT**

```bash
rg -n "@playwright/experimental-ct-react|vitest.*browser" package.json
fd -e ct.spec.tsx . 2>/dev/null | wc -l
fd "playwright-ct.config" . 2>/dev/null
```

**주의:** Playwright Component Testing은 실험적 기능이다. 프로젝트가 이미 Vitest + Testing Library를 쓰고 있다면 그쪽이 성숙도가 높다. 새로 도입할 때만 검토한다.

**PASS / FAIL**

- PASS: 컴포넌트 상태 조합이 E2E가 아닌 컴포넌트 테스트로 검증된다(도구는 무관).
- FAIL: 컴포넌트 상태를 전부 E2E로 검증(S2 — 비효율).

**FIX**

```bash
pnpm create playwright --ct
```

```ts
// playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.ct\.spec\.tsx/,
  snapshotDir: './__snapshots__',
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    ctViteConfig: {
      resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

```tsx
// src/components/member-card.ct.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { MemberCard } from './member-card';

const BASE = {
  id: '1', email: 'kim@example.test', name: '김민준',
  role: 'admin' as const, avatarUrl: null,
};

test('데이터 상태를 렌더한다', async ({ mount }) => {
  const component = await mount(<MemberCard member={BASE} />);
  await expect(component.getByRole('heading', { name: '김민준' })).toBeVisible();
  await expect(component.getByText('관리자')).toBeVisible();
});

test('로딩 상태에 접근 가능한 표시가 있다', async ({ mount }) => {
  const component = await mount(<MemberCard isLoading />);
  await expect(component.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  await expect(component.getByRole('status')).toContainText(/불러오는 중/);
});

test('아바타가 없으면 이니셜을 표시한다', async ({ mount }) => {
  const component = await mount(<MemberCard member={{ ...BASE, avatarUrl: null }} />);
  await expect(component.getByText('김')).toBeVisible();
  // 장식용 이니셜은 스크린리더에서 제외되어야 한다
  await expect(component.getByTestId('avatar-initial')).toHaveAttribute('aria-hidden', 'true');
});

test('삭제 콜백이 호출된다', async ({ mount }) => {
  let deletedId: string | null = null;
  const component = await mount(
    <MemberCard member={BASE} onDelete={(id) => { deletedId = id; }} />,
  );

  await component.getByRole('button', { name: '삭제' }).click();
  expect(deletedId).toBe('1');
});

test('긴 이름이 잘리고 전체 이름이 title로 제공된다', async ({ mount }) => {
  const longName = '김'.repeat(50);
  const component = await mount(<MemberCard member={{ ...BASE, name: longName }} />);

  const heading = component.getByRole('heading');
  await expect(heading).toHaveAttribute('title', longName);

  const overflow = await heading.evaluate(el => el.scrollWidth > el.clientWidth);
  expect(overflow, '긴 이름이 잘리지 않아 레이아웃이 깨질 수 있다').toBe(true);
});
```

컴포넌트 테스트는 실제 브라우저에서 실행되므로 `scrollWidth` 같은 레이아웃 측정이 가능하다. jsdom 기반 도구로는 할 수 없는 검증이다.

---

## 22. 스위트 유지보수

### P-MAINT-01 — 테스트 코드 품질 게이트

**WHY**
테스트 코드에 타입 검사와 린트를 적용하지 않으면, 잘못된 API 사용(`await` 누락 등)이 런타임까지 발견되지 않는다. 특히 `await`를 빠뜨린 어설션은 **항상 통과**하므로 매우 위험하다.

**DETECT**

```bash
rg -n "include|exclude" tsconfig.json
rg -n "tests" .eslintrc* eslint.config.* 2>/dev/null
rg -n "eslint-plugin-playwright" package.json
pnpm tsc --noEmit 2>&1 | rg "tests/" | head

# await 누락 탐지 (매우 위험)
rg -n "^\s+expect\(page|^\s+expect\(.*getBy" tests | rg -v "await|const|return|\.soft" | head
```

**PASS / FAIL**

- PASS: 테스트 코드가 tsconfig에 포함되고 타입 검사를 통과한다. `eslint-plugin-playwright`가 적용된다.
- FAIL: `await` 누락으로 어설션 무효(**S1**), 타입 검사 제외(S2).

**FIX**

```bash
pnpm add -D eslint-plugin-playwright
```

```js
// eslint.config.mjs
import playwright from 'eslint-plugin-playwright';

export default [
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // await 누락 방지 — 가장 중요
      'playwright/missing-playwright-await': 'error',
      'playwright/no-standalone-expect': 'error',

      // 안티패턴 차단
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'warn',
      'playwright/no-force-option': 'warn',
      'playwright/no-page-pause': 'error',
      'playwright/no-focused-test': 'error',      // .only 차단
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-conditional-expect': 'error',
      'playwright/no-useless-await': 'error',

      // 권장 패턴 강제
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/prefer-to-have-length': 'warn',
      'playwright/prefer-to-be': 'warn',
      'playwright/expect-expect': 'error',        // 어설션 없는 테스트 차단
      'playwright/valid-expect': 'error',
      'playwright/require-top-level-describe': 'off',
    },
  },
];
```

`playwright/missing-playwright-await`와 `no-conditional-expect`가 이 문서에서 가장 중요한 두 규칙이다. 전자는 무효한 어설션을, 후자는 조건부 어설션을 정적으로 차단한다.

```json
// tsconfig.json — 테스트 포함
{
  "include": ["src/**/*", "app/**/*", "tests/**/*", "*.config.ts"]
}
```

```json
// package.json
{
  "scripts": {
    "lint:tests": "eslint tests --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "check:tests": "pnpm typecheck && pnpm lint:tests"
  }
}
```

```yaml
# CI에서 테스트 실행 전에 검사
- run: pnpm check:tests
- run: pnpm playwright test
```

---

### P-MAINT-02 — 중복과 데드 코드

**WHY**
같은 시나리오를 검증하는 테스트가 3개 있으면 실행 시간만 3배가 된다. 사용되지 않는 헬퍼와 픽스처는 읽는 사람을 혼란스럽게 한다. 스위트도 리팩터링이 필요하다.

**DETECT**

```bash
# 유사 제목 탐지
rg -o "^\s*test\(['\"]([^'\"]+)" tests -r '$1' | sort | uniq -c | sort -rn | head -20

# 같은 URL을 방문하는 테스트
rg -o "goto\(['\"]([^'\"]+)" tests -r '$1' | sort | uniq -c | sort -rn | head

# 사용되지 않는 export
npx ts-prune 2>/dev/null | rg "tests/" | head -20

# 사용되지 않는 픽스처 파일
fd -e ts . tests/fixtures tests/pages | while read f; do
  base=$(basename "$f" .ts)
  count=$(rg -c "from.*$base" tests 2>/dev/null | wc -l)
  [ "$count" -eq 0 ] && echo "미사용: $f"
done
```

**PASS / FAIL**

- PASS: 중복 시나리오가 없다. 미사용 헬퍼·픽스처·POM이 없다.
- FAIL: 명백한 중복(S3), 데드 코드 다수(S3).

**FIX**

```ts
// ❌ 같은 것을 세 번 검증
test('로그인 성공', async ({ page }) => { /* … */ });
test('올바른 자격증명으로 로그인', async ({ page }) => { /* 동일 */ });
test('사용자가 대시보드에 접근', async ({ page }) => { /* 로그인 후 대시보드 */ });

// ✅ 하나로 통합하고 검증을 강화
test('올바른 자격증명으로 로그인하면 대시보드로 이동한다', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('이메일').fill(env.TEST_USER_EMAIL);
  await page.getByLabel('비밀번호').fill(env.TEST_USER_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('button', { name: /계정 메뉴/ })).toBeVisible();
  // 세션 쿠키가 설정되었는가
  const cookies = await page.context().cookies();
  expect(cookies.some(c => c.name === 'session' && c.httpOnly)).toBe(true);
});
```

**가치가 낮은 테스트 판단**

```text
아래에 해당하면 삭제를 검토한다.

[ ] 최근 12개월간 한 번도 실패한 적 없다 (그리고 관련 코드는 변경되었다)
[ ] 다른 테스트가 같은 경로를 이미 커버한다
[ ] 검증 대상 기능이 제거되었거나 사용되지 않는다
[ ] 유지보수 비용이 잡아낼 결함의 기대 가치보다 크다
[ ] 6개월 이상 fixme 상태다
```

"한 번도 실패한 적 없음"만으로 삭제하면 안 된다. 회귀를 예방하고 있을 수도 있다. 관련 코드가 활발히 변경되는데도 실패한 적이 없다면 검증이 약한 것일 수 있으므로, 삭제 대신 **강화**를 먼저 검토한다.

---

### P-MAINT-03 — 버전 업그레이드

**WHY**
Playwright는 빠르게 발전하며 새 API가 기존 문제를 해결한다(`page.clock`, `routeWebSocket`, `toPass` 등). 반면 브라우저 버전이 함께 올라가므로 시각 스냅샷이 깨지거나 동작이 미묘하게 달라질 수 있다.

**DETECT**

```bash
pnpm playwright --version
rg -n "@playwright/test" package.json
rg -n "mcr.microsoft.com/playwright" .github/workflows/*.yml Dockerfile 2>/dev/null
pnpm outdated @playwright/test
```

**PASS / FAIL**

- PASS: Playwright 버전과 CI 컨테이너 이미지 태그가 일치한다. 업그레이드 절차가 있다.
- FAIL: 버전 불일치로 브라우저 다운로드 발생(S3), 장기 미업데이트(S3).

**FIX**

```yaml
# ✅ 컨테이너 이미지 태그를 package.json 버전과 일치시킨다
container:
  image: mcr.microsoft.com/playwright:v1.50.0-noble    # @playwright/test 1.50.0
```

버전이 어긋나면 컨테이너의 브라우저를 쓰지 못하고 런타임에 다운로드해 매 실행마다 1~2분이 추가된다.

```bash
# ✅ 업그레이드 절차
# 1. 패키지 업데이트
pnpm add -D @playwright/test@latest
pnpm playwright install --with-deps

# 2. CI 이미지 태그 동기화
#    .github/workflows/*.yml의 image 태그를 새 버전으로

# 3. 전체 스위트 실행 (반복 포함)
pnpm playwright test --repeat-each=2

# 4. 시각 스냅샷 확인 — 브라우저 렌더링이 바뀌었을 수 있다
pnpm playwright test tests/visual

# 5. 변경 로그에서 breaking change 확인
#    https://github.com/microsoft/playwright/releases

# 6. deprecated API 사용 확인
rg -n "waitForNavigation|page\.\\\$|elementHandle" tests
```

```yaml
# ✅ 버전 일치를 자동 검증
- name: Verify Playwright version matches container
  run: |
    PKG_VERSION=$(node -p "require('./package.json').devDependencies['@playwright/test'].replace(/[^0-9.]/g,'')")
    CLI_VERSION=$(pnpm playwright --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    if [ "$PKG_VERSION" != "$CLI_VERSION" ]; then
      echo "❌ 버전 불일치: package.json=$PKG_VERSION, 컨테이너=$CLI_VERSION"
      exit 1
    fi
```

---

### P-MAINT-04 — 신규 테스트 작성 가이드

**WHY**
팀원마다 다른 스타일로 테스트를 작성하면 스위트가 일관성을 잃고, 리뷰 때마다 같은 논의가 반복된다. 템플릿과 체크리스트가 있으면 처음부터 올바른 형태로 작성된다.

**FIX**

```ts
// tests/templates/journey.spec.template.ts
/**
 * [여정 이름] E2E
 *
 * 커버 범위: 사용자가 X를 달성하는 전체 경로
 * 전제 조건: 인증된 admin, 조직 데이터
 * 데이터 전략: API로 준비, UI로 조작, API로 검증
 */
import { test, expect } from '../../fixtures/base';

test.describe('[여정 이름]', () => {
  test('[사용자 관점의 성공 시나리오]', async ({ adminPage, org, api }) => {
    // Arrange — API로 빠르게 준비
    const resource = await api.createResource({ orgId: org.id });

    // Act — UI로 사용자 동작 재현
    await adminPage.goto(`/orgs/${org.slug}/resources`);
    await adminPage.getByRole('button', { name: '...' }).click();

    // Assert — UI 반영 + 서버 상태 + 지속성
    await expect(adminPage.getByRole('status')).toContainText('...');
    const updated = await api.getResource(resource.id);
    expect(updated.field).toBe('expected');

    await adminPage.reload();
    await expect(adminPage.getByText('...')).toBeVisible();
  });

  test('[실패 경로 — 오류 처리]', async ({ adminPage }) => {
    await FailureScenarios.serverError(adminPage, '**/api/resources*');
    // …
  });
});
```

**작성 체크리스트**

```text
[ ] 제목이 사용자 관점의 결과를 서술한다 ("...하면 ...된다")
[ ] getByRole/getByLabel을 우선 사용했다
[ ] waitForTimeout을 쓰지 않았다
[ ] 모든 어설션이 await + 웹 우선 방식이다
[ ] 조건부(if)로 어설션을 감싸지 않았다
[ ] 자기 데이터를 스스로 준비하고 정리한다
[ ] 절대 개수 어설션을 쓰지 않았거나 격리된 범위 안이다
[ ] 데이터 변경 시 서버 상태도 검증한다
[ ] 실패 경로가 하나 이상 있다
[ ] --repeat-each=3 --shuffle 로 통과를 확인했다
[ ] 실행 시간이 30초 이내다
[ ] page.pause / .only / console.log 를 제거했다
```

**리뷰 체크리스트**

```text
[ ] 이 검증이 E2E 계층에 적합한가? (단위/API로 내릴 수 없는가)
[ ] 기존 테스트와 중복되지 않는가?
[ ] 이 기능이 깨졌을 때 반드시 실패하는가?
[ ] 관련 없는 변경으로 깨질 여지가 있는가?
[ ] 실패 메시지만으로 원인을 알 수 있는가?
```

---

## 23. Regression 절차

수정 후 아래 Gate를 순서대로 실행한다. 하나라도 실패하면 다음으로 넘어가지 않는다.

### Gate 1 — 정적 검사

```bash
pnpm typecheck
pnpm lint:tests

# 안티패턴 0 확인
rg -c "waitForTimeout" tests | awk -F: '{s+=$2} END {print "hard waits: "s+0}'
rg -c "if\s*\(await" tests | awk -F: '{s+=$2} END {print "conditional: "s+0}'
rg -c "expect\(await .*\.(isVisible|textContent|count)\(\)\)" tests | awk -F: '{s+=$2} END {print "non-web-first: "s+0}'
rg -n "page\.pause\(\)|test\.only|describe\.only" tests
```

**기대:** 타입·린트 통과, 하드 대기 0, 조건부 어설션 0, 비웹 우선 어설션 0, 디버깅 코드 0.

### Gate 2 — 기본 실행

```bash
pnpm build
pnpm start &
npx wait-on http://localhost:3000

pnpm playwright test tests/e2e --reporter=list
```

**기대:** 전체 통과. 실행 시간이 예산 이내.

### Gate 3 — 신뢰성

```bash
pnpm playwright test tests/e2e --repeat-each=5 --reporter=list
```

**기대:** flaky 0건. 재시도로 통과한 테스트가 없음.

### Gate 4 — 격리

```bash
pnpm playwright test tests/e2e --shuffle --workers=1
pnpm playwright test tests/e2e --workers=8 --shuffle
```

**기대:** 두 실행 모두 통과. 순서와 병렬성에 무관.

### Gate 5 — 느린 환경

```bash
# CPU 스로틀링 픽스처를 활성화하고 실행
SLOW_ENV=1 pnpm playwright test tests/e2e --workers=2
```

**기대:** 통과. 타이밍 의존이 없음.

### Gate 6 — CI 동등성

```bash
CI=1 pnpm playwright test tests/e2e --workers=2

# 컨테이너에서 실행
pnpm test:e2e:docker
```

**기대:** 로컬 결과와 동일.

### Gate 7 — 커버리지

```bash
# 라우트 커버리지
rg -o "goto\(['\"]([^'\"]+)" tests/e2e -r '$1' | sort -u > /tmp/covered.txt
fd "page.tsx" app src/app 2>/dev/null | sed 's|.*/app||; s|/page.tsx||; s|^$|/|' | sort -u > /tmp/all.txt
comm -13 /tmp/covered.txt /tmp/all.txt
```

**기대:** P0 여정에 해당하는 미커버 라우트 없음.

### Gate 8 — 스위트 건강

```bash
pnpm playwright test tests/meta
```

**기대:** 건강 지표 테스트 전부 통과.

### Gate 9 — 보안

```bash
git ls-files | rg "\.auth|storageState|\.env\.test$"
rg -n "password|secret|token" tests --glob "*.ts" -i | rg -v "process\.env|env\." | head
```

**기대:** 자격증명 커밋 0. 하드코딩 시크릿 0.

### Gate 10 — 접근성

```bash
pnpm playwright test tests/a11y
```

**기대:** 신규 위반 0.

### Gate 11 — 최종 확인

```bash
pnpm playwright test --reporter=html
pnpm playwright show-report
```

**기대:** 리포트에 실패·flaky·skip이 없거나 전부 문서화됨.

---

## 24. Final Report

### 24.1 리포트 형식

````markdown
# Playwright QA Report — <프로젝트> / <브랜치> / <날짜>

## 1. 요약

- 스위트 규모: spec <N>개 / 테스트 <N>개
- 실행 결과: 통과 <N> / 실패 <N> / flaky <N> / skip <N>
- 실행 시간: 로컬 <N>분 / CI <N>분 (예산 <N>분)
- 발견 결함: S0 <N> / S1 <N> / S2 <N> / S3 <N>
- 신뢰성 판정: <신뢰 가능 / 조건부 / 신뢰 불가>
- 최종 판정: <PASS / CONDITIONAL PASS / FAIL>

## 2. 신뢰성 지표

| 지표 | 현재 | 목표 | 판정 |
|------|------|------|------|
| Flaky율 (5회 반복) | | 0% | |
| 하드 대기 | | 0 | |
| 조건부 어설션 | | 0 | |
| 비웹 우선 어설션 | | 0 | |
| CSS 구조 셀렉터 | | ≤5 | |
| 격리(fixme) | | ≤3 | |
| 병렬 안전성 | | PASS | |
| 순서 독립성 | | PASS | |

## 3. Gate 결과

| Gate | 내용 | 결과 | 비고 |
|------|------|------|------|
| 1 | 정적 검사 | PASS/FAIL/BLOCKED | |
| 2 | 기본 실행 | | |
| 3 | 신뢰성 (repeat-each=5) | | |
| 4 | 격리 (shuffle, workers=8) | | |
| 5 | 느린 환경 | | |
| 6 | CI 동등성 | | |
| 7 | 커버리지 | | |
| 8 | 스위트 건강 | | |
| 9 | 보안 | | |
| 10 | 접근성 | | |
| 11 | 최종 확인 | | |

## 4. 결함 목록

### [P-XXX-NN] 제목 — S<n>

- **위치:** `파일:라인`
- **증상:** 관찰된 현상
- **원인:** 근본 원인
- **영향:** 신뢰성 / 실행 시간 / 커버리지 중 무엇이 손상되는가
- **재현:**
  ```bash
  <명령>
  ```
- **수정:** 적용한 변경
- **검증:** 수정 후 실행 결과

## 5. 아키텍처 권고

| 항목 | 현재 | 권고 | 근거 |
|------|------|------|------|
| 계층 배분 | E2E <N>% | E2E 15% | 검증 <N>건이 API 계층 적합 |
| 실행 시간 | <N>분 | <N>분 | 샤딩 <N>개 도입 |
| 데이터 전략 | | | |

## 6. 커버리지 현황

| P0 여정 | 커버 | Spec | 실패 경로 |
|---------|------|------|-----------|
| | | | |

**공백:**
- <미커버 여정과 권장 대응>

## 7. 실행 시간 분석

| Spec | 시간 | 비중 | 개선 여지 |
|------|------|------|-----------|
| | | | |

## 8. Flaky 이력

| 테스트 | 실패율 | 원인 유형 | 조치 | 상태 |
|--------|--------|-----------|------|------|
| | | | | |

## 9. 잔여 리스크

| 항목 | Severity | 사유 | 추적 |
|------|----------|------|------|
| | | | |

## 10. 다음 단계

1. <우선순위 순>
````

### 24.2 판정 기준

| 판정 | 조건 |
|------|------|
| **PASS** | S0·S1 없음. Gate 1~11 전부 PASS. flaky 0. |
| **CONDITIONAL PASS** | S1 없음. S2 이하만 존재하며 전부 추적 중. Gate 3·4 PASS. |
| **FAIL** | S0 또는 S1 존재. 또는 Gate 3·4 실패. |

Gate 3(신뢰성)과 Gate 4(격리)는 **면제할 수 없다.** 이 둘이 실패하면 스위트 결과 전체를 신뢰할 수 없으므로 다른 Gate의 PASS도 의미가 없다.

### 24.3 보고 원칙

```text
1. 수정 전에 먼저 보고한다.
2. 측정하지 않은 항목은 BLOCKED로 명시한다. 추정으로 채우지 않는다.
3. flaky는 반드시 반복 실행 수치로 보고한다. "체감상 안정적"은 근거가 아니다.
4. 결함마다 파일:라인을 지목한다.
5. 리포트 파일을 저장소에 만들지 않는다. 채팅으로 전달한다.
6. 산출물은 tmp/qa/e2e/<날짜>/ 또는 CI 아티팩트에 두고 커밋하지 않는다.
```

---

## 부록 A — 실행 명령

### A.1 기본 실행

```bash
# 전체
pnpm playwright test

# 특정 파일 / 디렉토리
pnpm playwright test tests/e2e/members.spec.ts
pnpm playwright test tests/e2e/journeys

# 제목으로 필터
pnpm playwright test -g "멤버를 삭제"
pnpm playwright test --grep-invert "@slow"

# 프로젝트 지정
pnpm playwright test --project=chromium
pnpm playwright test --project=api

# 실패한 것만 재실행
pnpm playwright test --last-failed
```

### A.2 진단

```bash
# flaky 측정
pnpm playwright test --repeat-each=5

# 격리 검증
pnpm playwright test --shuffle
pnpm playwright test --workers=8 --shuffle --repeat-each=3

# 단일 워커 (순차)
pnpm playwright test --workers=1

# 첫 실패에서 중단
pnpm playwright test -x
pnpm playwright test --max-failures=3

# 목록만 출력 (실행 안 함)
pnpm playwright test --list
```

### A.3 디버깅

```bash
pnpm playwright test --ui                    # UI 모드 (권장)
pnpm playwright test --debug                 # Inspector
pnpm playwright test --headed --workers=1    # 브라우저 관찰
pnpm playwright show-trace <trace.zip>       # 트레이스 뷰어
pnpm playwright show-report                  # HTML 리포트
pnpm playwright codegen <url>                # 코드 생성
```

### A.4 CI

```bash
# CI 조건 재현
CI=1 pnpm playwright test --workers=2

# 샤딩
pnpm playwright test --shard=1/4

# 리포트 병합
pnpm playwright merge-reports --reporter=html ./all-blob-reports

# 컨테이너 실행
docker run --rm --ipc=host -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm build && CI=1 pnpm playwright test"
```

### A.5 정적 감사

```bash
# 안티패턴 일괄 스캔
echo "=== 하드 대기 ==="        && rg -n "waitForTimeout" tests
echo "=== networkidle ==="      && rg -n "networkidle" tests
echo "=== 조건부 어설션 ==="     && rg -n "if\s*\(await" tests
echo "=== 비웹 우선 ==="        && rg -n "expect\(await .*\.(isVisible|textContent|count)\(\)\)" tests
echo "=== CSS 셀렉터 ==="       && rg -n "locator\(['\"]\." tests
echo "=== 인덱스 셀렉터 ==="     && rg -n "\.nth\([0-9]+\)" tests
echo "=== elementHandle ==="    && rg -n "page\.\\\$|elementHandle" tests
echo "=== force 옵션 ==="       && rg -n "force: true" tests
echo "=== 디버깅 잔류 ==="       && rg -n "page\.pause\(\)|\.only\(|console\.log" tests
echo "=== 격리 ==="             && rg -n "test\.fixme|test\.skip" tests
echo "=== 시크릿 ==="           && rg -n "password|secret|token" tests -i | rg -v "process\.env|env\."

# 규모 지표
echo "spec: $(fd -e spec.ts . tests | wc -l)"
echo "test: $(rg -c '^\s*test\(' tests | awk -F: '{s+=$2} END {print s}')"
```

### A.6 성능 측정

```bash
# 워커 수별 시간 비교
for w in 1 2 4 8; do
  echo "workers=$w"; /usr/bin/time -f "  %e초" pnpm playwright test tests/e2e --workers=$w --reporter=dot
done

# 느린 테스트 상위 20
pnpm playwright test --reporter=json > /tmp/r.json
jq -r '.. | objects | select(.title and .results) |
  "\(.results[0].duration // 0) \(.title)"' /tmp/r.json | sort -rn | head -20
```

---

## 부록 B — Agent 체크리스트

### B.1 아키텍처

```text
[ ] P-ARCH-01 E2E 비중이 적정하고 세부 검증이 아래 계층에 있다
[ ] P-ARCH-02 P0 사용자 여정이 전부 커버된다
[ ] P-ARCH-03 디렉토리가 목적별로 분리된다
[ ] P-ARCH-04 60초 이내 스모크 세트가 있다
[ ] P-ARCH-05 외부 의존이 계층별로 분리된다
```

### B.2 설정

```text
[ ] P-CFG-01 타임아웃·트레이스·로케일·forbidOnly가 명시된다
[ ] P-CFG-02 프로젝트가 분리되고 dependencies로 순서가 보장된다
[ ] P-CFG-03 프로덕션 빌드로 실행된다
[ ] P-CFG-04 시크릿이 환경 변수이고 누락 시 즉시 실패한다
[ ] P-CFG-05 타임아웃 계층을 이해하고 오버라이드에 사유가 있다
[ ] P-CFG-06 CI 조건을 로컬에서 재현할 수 있다
```

### B.3 셀렉터

```text
[ ] P-SEL-01 역할/라벨 기반 셀렉터가 기본이다
[ ] P-SEL-02 testId가 컨테이너와 비접근성 요소에 한정된다
[ ] P-SEL-03 목록 항목을 내용으로 찾는다
[ ] P-SEL-04 텍스트 매칭이 적절한 구체성을 갖는다
[ ] P-SEL-05 Locator를 재사용하고 elementHandle을 쓰지 않는다
[ ] P-SEL-06 iframe에 frameLocator를 쓴다
```

### B.4 대기

```text
[ ] P-WAIT-01 하드 대기가 0이거나 사유가 있다
[ ] P-WAIT-02 networkidle을 남용하지 않는다
[ ] P-WAIT-03 네비게이션 후 도착을 확인한다
[ ] P-WAIT-04 장기 비동기에 expect.poll / toPass를 쓴다
[ ] P-WAIT-05 로딩 완료를 결과 등장으로 판정한다
[ ] P-WAIT-06 하이드레이션 이후 상호작용이 보장된다
```

### B.5 픽스처와 격리

```text
[ ] P-FIX-01 공통 준비가 픽스처로 통합된다
[ ] P-FIX-02 스코프가 데이터 성격에 맞다
[ ] P-FIX-03 순서·병렬 무관하게 통과한다
[ ] P-FIX-04 정리가 실패 시에도 보장된다
[ ] P-FIX-05 콘솔 오류 검사가 자동 적용된다
```

### B.6 인증과 데이터

```text
[ ] P-AUTH-01 storageState로 인증을 재사용한다
[ ] P-AUTH-02 역할별 세션이 준비된다
[ ] P-AUTH-03 세션 수명이 실행 시간보다 길다
[ ] P-AUTH-04 OAuth가 일상 스위트에서 우회된다
[ ] P-AUTH-05 인증 상태 파일이 커밋되지 않는다
[ ] P-DATA-01 데이터 전략이 목적에 맞다
[ ] P-DATA-02 병렬 실행에서 데이터가 격리된다
[ ] P-DATA-03 시드가 결정적이고 재실행 가능하다
[ ] P-DATA-04 API 클라이언트가 응답을 검증한다
[ ] P-DATA-05 테스트 엔드포인트가 프로덕션에서 차단된다
```

### B.7 네트워크

```text
[ ] P-NET-01 모킹 범위가 테스트 목적과 일치한다
[ ] P-NET-02 실패·지연 시나리오가 커버된다
[ ] P-NET-03 요청 페이로드와 횟수를 검증한다
[ ] P-NET-04 HAR을 쓴다면 갱신 주기가 있다
[ ] P-NET-05 서비스 워커 정책이 명시된다
```

### B.8 구조와 어설션

```text
[ ] P-POM-01 추상화 수준이 적정하다
[ ] P-POM-02 공통 컴포넌트가 추출된다
[ ] P-POM-03 POM이 픽스처로 노출된다
[ ] P-POM-04 POM 안티패턴이 없다
[ ] P-ASSERT-01 모든 DOM 어설션이 웹 우선이다
[ ] P-ASSERT-02 조건부 어설션이 없다
[ ] P-ASSERT-03 어설션이 결함을 잡을 만큼 구체적이다
[ ] P-ASSERT-04 실패 메시지가 원인을 말한다
[ ] P-ASSERT-05 반복 검증이 커스텀 매처로 추출된다
[ ] P-ASSERT-06 UI와 서버 상태를 모두 검증한다
```

### B.9 신뢰성과 실행

```text
[ ] P-FLAKY-01 flaky가 수치로 측정된다
[ ] P-FLAKY-02 타이밍 원인이 제거된다
[ ] P-FLAKY-03 데이터 경합이 제거된다
[ ] P-FLAKY-04 애니메이션 간섭이 제거된다
[ ] P-FLAKY-05 CI 리소스가 적정하다
[ ] P-FLAKY-06 격리에 추적 정보가 있다
[ ] P-PAR-01 병렬 모델이 올바르게 설정된다
[ ] P-PAR-02 워커 수가 측정에 근거한다
[ ] P-PAR-03 병렬 안전성이 정기 검증된다
[ ] P-PAR-04 공유 자원이 격리된다
```

### B.10 운영

```text
[ ] P-DEBUG-01 실패 시 트레이스가 남고 업로드된다
[ ] P-DEBUG-02 디버깅 코드가 커밋되지 않는다
[ ] P-DEBUG-03 실패 컨텍스트가 자동 수집된다
[ ] P-DEBUG-04 서버 로그에 접근할 수 있다
[ ] P-DEBUG-05 재현 절차가 표준화되어 있다
[ ] P-CI-01 브라우저 설치가 최적화되고 아티팩트가 업로드된다
[ ] P-CI-02 실행 시간이 예산 이내이고 샤딩 시 병합된다
[ ] P-CI-03 실행 시간 예산이 지켜진다
[ ] P-CI-04 E2E가 필수 체크이고 실패 정책이 있다
[ ] P-CI-05 배포 후 스모크가 실행된다
[ ] P-REPORT-01 리포터가 환경에 맞게 설정된다
[ ] P-REPORT-02 실행 요약이 자동 생성된다
[ ] P-REPORT-03 실행 이력이 추적된다
[ ] P-REPORT-04 스위트 건강 지표가 강제된다
```

### B.11 특수·유지보수

```text
[ ] P-SPEC-01 파일 업로드가 검증된다
[ ] P-SPEC-02 다운로드 내용이 검증된다
[ ] P-SPEC-03 새 탭·다중 사용자가 검증된다
[ ] P-SPEC-04 대화상자와 권한이 처리된다
[ ] P-SPEC-05 키보드·드래그 조작이 검증된다
[ ] P-SPEC-06 시간 의존 기능이 clock으로 검증된다
[ ] P-SPEC-07 실시간 통신이 검증된다
[ ] P-SPEC-08 접근성 검사가 통합된다
[ ] P-CT-01 API 테스트가 조합 검증을 담당한다
[ ] P-CT-02 컴포넌트 상태가 하위 계층에서 검증된다
[ ] P-MAINT-01 테스트 코드에 타입·린트가 적용된다
[ ] P-MAINT-02 중복과 데드 코드가 없다
[ ] P-MAINT-03 버전과 CI 이미지가 일치한다
[ ] P-MAINT-04 작성·리뷰 가이드가 있다
```

### B.12 최종 확인

```text
[ ] Gate 1~11 전부 실행했다
[ ] Gate 3(신뢰성)과 Gate 4(격리)가 PASS다
[ ] 모든 결함에 파일:라인과 Severity를 부여했다
[ ] 측정하지 못한 항목을 BLOCKED로 명시했다
[ ] retries 상향이나 하드 대기 추가로 문제를 덮지 않았다
[ ] Freeze List를 위반하지 않았다
[ ] 리포트 파일을 저장소에 만들지 않았다
[ ] 산출물을 커밋하지 않았다
```

---

**문서 끝.** 다음 문서: `06_UX_Audit.md`

