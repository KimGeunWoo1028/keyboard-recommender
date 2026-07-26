# UI/UX Final Verification — Pass 1–6

> Date: **2026-07-26** (KST)  
> Scope: Launch regression after UI/UX Passes 1–6  
> Principle: verify first → record failures → fix only clear Pass regressions

---

## 1. Verdict

**CONDITIONAL PASS**

핵심 Flow·자동 검증·뷰포트 스모크는 통과했습니다. 다만 본 세션에서 **전체 수동 Tab 경로**와 **게스트→결과→로그인→저장(Flow 3) 전용 e2e**는 일부만 커버되어, 운영자 1회 스모크 후 정식 공개를 권장합니다.

출시 판단 문구: **`CONDITIONAL PASS — 아래 조건 완료 후 공개 가능`**

조건:

1. 프로덕션(또는 스테이징)에서 Flow 3을 1회 수동 확인 (게스트 결과 → 로그인 → `/results` 복귀 → 계정 저장 → 마이페이지)
2. Skip link → 저장 CTA까지 키보드 Tab 1회 확인 (Desktop + 390px 중 하나)

---

## 2. 테스트 환경

| Item | Value |
|------|--------|
| Branch | `main` |
| Base commit (Pass 6) | `5989a9d` — Unify save copy and document shared UI rules for UI/UX Pass 6. |
| Regression fix commit | *(pending — uncommitted unless synced)* survey NL clickability + e2e selectors |
| Date | 2026-07-26 |
| Browser | Playwright Chromium 147 (headless) |
| Viewports | 1440 / 1280 / 768 / 390 / 360 (route smoke); e2e also 375 |
| Account types | E2E auth user (setup), disposable delete user, guest paths in unit/static |
| API | Local FastAPI `127.0.0.1:8000` via `e2e/scripts/start-stack.cjs` |
| Frontend | Next.js `127.0.0.1:3000` |

---

## 3. Flow 결과

### Flow 1 — 게스트 추천

| | |
|--|--|
| Result | **PASS** |
| Evidence | `critical-flows` survey→results; guest save CTA labels unit/e2e; local save copy `이 브라우저에 저장` |
| Fail step | — |
| Fix | — |

### Flow 2 — 로그인 저장

| | |
|--|--|
| Result | **PASS** |
| Evidence | `save-reliability` login → save → mypage → reload → logout → relogin keeps saved build; Asia/Seoul time assert |
| Fail step | — |
| Fix | — |

### Flow 3 — 결과에서 로그인

| | |
|--|--|
| Result | **PARTIAL** |
| Evidence | `safeAuthNextPath` + `results_save` context copy (unit); RequireAuth next encoding; dedicated guest→login→save e2e **없음** |
| Fail step | Live end-to-end not executed this session |
| Fix | Operator smoke (조건 1) |

### Flow 4 — 카탈로그

| | |
|--|--|
| Result | **PASS** (static + viewport smoke) |
| Evidence | H1 `키보드 부품 둘러보기` at all viewports; search/filter/pagination code gates; `from=results` bridge |
| Fail step | — |
| Fix | — |
| Note | Full search→filter→detail→back interaction not in Playwright suite (no catalog e2e) |

### Flow 5 — 마이페이지

| | |
|--|--|
| Result | **PASS** |
| Evidence | `critical-flows` mypage hub; `mypage-saved-builds` smoke (restore/delete); save-reliability list/time; destructive variant |
| Fail step | — |
| Fix | — |

---

## 4. 화면별 Gate

### 홈

| Gate | Status |
|------|--------|
| 가치 3초 내 이해 | PASS (static + `/` 200) |
| 결과 프리뷰 | PASS (guest preview + 예시) |
| Primary CTA 1개 | PASS |
| Secondary 구분 | PASS |
| 로그인 없이 시작 | PASS |
| 모바일 첫 화면 CTA | PASS (360/390 smoke) |

### 설문 시작 / 진행 / 로딩

| Gate | Status |
|------|--------|
| 성향 차이·선택 | PASS (e2e + unit Pass 2) |
| 전체 설문 대안 | PASS (code) |
| 진행·다음·초기화 보호 | PASS |
| 추가 입력 (마지막 disclosure) | PASS after regression fix |
| 로딩·복구 | PASS (unit + survey e2e) |

### 결과

| Gate | Status |
|------|--------|
| 상단 요약·취향·저장 상태 | PASS |
| 단일 저장 CTA | PASS (`ResultsNextActions`) |
| 구매 링크·trust | PASS (evidence e2e) |
| 모바일 CTA | PASS (375 e2e) |

### 인증

| Gate | Status |
|------|--------|
| 입력·autocomplete | PASS |
| 오류·제출 중 | PASS (code / account-delete path) |
| 복귀 next 가드 | PASS (unit) |
| 잘못된 비밀번호 live | 미검증 (본 세션) |

### 마이페이지

| Gate | Status |
|------|--------|
| 목록 식별·시간·삭제·빈 상태 | PASS |
| 즉시 반영·재로그인 | PASS (save-reliability) |

### 카탈로그

| Gate | Status |
|------|--------|
| 검색 1개·필터 위계·모바일 필터 | PASS (static) |
| 카드·fallback·페이지네이션 | PASS (static) |
| 상세/외부 링크 live | 미검증 (본 세션 전용 e2e 없음) |

---

## 5. 자동 테스트

| Check | Result | Notes |
|-------|--------|-------|
| `npm run lint` (frontend) | **PASS** | No ESLint errors |
| `npm run typecheck` | **PASS** | |
| `npm test` (vitest) | **PASS** | 144 tests |
| `npm run build` | **PASS** | Next 15.5.18 |
| `e2e` Playwright | **PASS** | **18/18** after regression fixes |
| Viewport smoke | **PASS** | 5×4 routes, status 200, skip link present, no overflowX, 0 pageerrors |

### E2E failures found → fixed (Pass regressions)

| ID | Failure | Cause | Fix |
|----|---------|-------|-----|
| REG-01 | `recommendation-nlp` click timeout | Pass 2 NL disclosure overlapped by survey radio (`pointer-events`) | `survey-wizard`: question area `overflow-auto`; NL block `shrink-0 relative z-10`; e2e clicks `summary` |
| REG-02 | save failure alert not found | Pass 3 moved save UI to `e2e-results-next-actions` | e2e selector + copy `저장된 조합` sync |

---

## 6. 남은 문제

| ID | 문제 | 심각도 | 출시 전 여부 | 권장 조치 |
| -- | --- | ------- | ----- | ----- |
| V-01 | Flow 3 전용 자동 e2e 없음 | P2 | 권장(조건) | 운영자 1회 스모크 또는 e2e 추가 |
| V-02 | 전체 수동 Tab/axe 스캔 미실행 | P2 | 권장(조건) | Skip→저장 1회 Tab; optional axe |
| V-03 | 카탈로그 상세·외부 링크 e2e 없음 | P3 | 아니오 | 백로그에 catalog e2e |
| V-04 | 홈 H1 `textContent`가 줄바꿈으로 공백 없이 이어짐 (SR) | P3 | 아니오 | 시각은 `<br>`로 정상; SR 공백은 백로그 |
| V-05 | 인증 만료·느린 네트워크 UI 본 세션 미유발 | P3 | 아니오 | 기존 한국어 복구 카피 유지·필요 시 재현 QA |
| V-06 | Playwright 브라우저 미설치 시 e2e BLOCKED | P3 | CI/로컬 셋업 | `npx playwright install chromium` |

---

## 7. 출시 판단

**`CONDITIONAL PASS — 아래 조건 완료 후 공개 가능`**

- 자동 게이트(lint / typecheck / unit / build / e2e 18) **PASS**
- Pass 회귀 2건 **수정 후 e2e 재통과**
- 뷰포트 스모크 **PASS**
- 남은 조건: Flow 3 수동 1회 + 키보드 Tab 1회

조건 충족 시 판단 격상: **`PASS — 정식 공개 가능`**

---

## Appendix A — Accessibility notes

| Item | Status |
|------|--------|
| Skip link `#main-content` | Present all smoke viewports |
| Focus ring tokens | `--focus-ring` on Button/Input; skip link updated Pass 6 |
| Save `aria-live` | `results-next-actions` |
| Dialog delete | `role="dialog"` mypage |
| Full Tab path | 미검증 (조건 2) |
| axe dedicated run | 미실행 (eslint transitive axe-core only) |

## Appendix B — Time policy check

| Item | Status |
|------|--------|
| Display TZ | `Asia/Seoul` (`date-time.ts`) |
| No `toLocaleDateString` in `frontend/src` | Confirmed |
| Save-reliability time stability | PASS (reload + relogin) |
| Untz ISO treated as UTC | Confirmed (`…Z` normalize) |

## Appendix C — Commands used

```bash
# frontend
npm run lint && npm run typecheck && npm test && npm run build

# e2e (after: npx playwright install chromium)
cd e2e && npm test

# viewport smoke
cd e2e && set PW_START_STACK=1&& node scripts/viewport-smoke.cjs
```
