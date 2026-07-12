# Remaining Work — Phase 실행 로드맵

> **버전:** v1.6 — 2026-07-10 (KST) · Phase A–F 구현 ✅ · B 표본 🔄 · F-4 ⏸  
> **목적:** 구현 로드맵(Product Next 0–4 · Results · Evidence · Swagkey) **완료 이후** 남은 일을 **우선순위 Phase**로 정리  
> **전제:** Home = Landing LOCK · Compare 재도입 금지 · «빠른 추천」 재도입 금지  
> **관련:** `PROJECT_CONTEXT.md` §4.9 · §4.16 · `product-next-phases.md` · `results-ux-phase7-validation-report.md` · `home-ia-locked.md`

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Owner** | §Phase 순서 · §Do not · 각 Phase Owner Gate |
| **구현 / Cursor** | 해당 Phase Task만 실행 · 상위 Phase Gate 미충족 시 하위 착수 금지 |

```
A Close-out → B Observe 표본 → C Analytics → D Visual 회귀 → E Catalog 선택 → F Ops 선택
```

**한 Phase = 한 집중 구간.** Home Dashboard / Redirect는 **B 표본 충족 전 착수 금지**.  
**localhost만 개발 시:** 제품·표본 잔여는 Phase B 보류 → **`docs/localhost-execution-roadmap.md` Phase 0–2** 우선.

---

## 완료로 간주 (이 로드맵에서 제외)

| 항목 | 이유 |
|------|------|
| Product Next Phase 0–4 | ✅ 2026-07-10 |
| Results UX Phase 0–7 구현 | ✅ · Phase 7 **리포트 제출**까지 완료 |
| Evidence IA Phase 0–4 | ✅ |
| activity → Overview accordion | **대체 완료** — activity 탭 제거 · Continue = `/mypage?section=saved` (§4.15) |
| Compare / drawer_open UI | **폐기** — analytics 대상에서 제외 |
| Swagkey ①~⑮ · Stitch · Curator 설문 | ✅ |
| `home.viewed` **이벤트 배선** | ✅ (집계·표본은 Phase B) |
| **Phase A Close-out** | ✅ 2026-07-10 — Owner 재서명 · 375px QA |
| **Phase B Observe 인프라** | ✅ 2026-07-10 — CLI·기준 · 표본·제품 UI 🔒 |
| **Phase C Analytics** | ✅ 2026-07-10 — funnel CLI/CSV · Compare 성공지표 제외 |
| **Phase D Visual 375** | ✅ 2026-07-10 — 3 snapshots · visual-375 project |
| **Phase E Keycap** | ✅ 2026-07-10 — keycap 12→18 · NL/설문 축 |
| **Phase F Ops** | ✅ 2026-07-10 — live pipeline · webhook · Feedback dry-run (F-4 제외) |

---

## Do not (전 Phase 공통)

- Home Dashboard / Workspace 부활 · Login redirect A/B · dual Hero
- Compare UI / `save_compare` 탭 / activity 탭 복원
- «빠른 추천» / 사용자-facing `mode=quick`
- 표본·Owner 합의 없이 Phase E/F를 A–C보다 앞에 끼워 넣기
- 가짜 Match % · Preview 대시보드화

---

# Phase A. Close-out — Owner 합의 · 375px 수동 QA · **0~1 PR (문서)**

> **우선순위 1.** 코드보다 **닫기**. Phase 7 잔여 체크리스트를 정리하고 Iteration 백로그를 현재 IA에 맞게 재서명한다.  
> **Status:** ✅ **완료** — 2026-07-10 (A-1 서명 · A-2 코드+E2E 검증 · Dev Gate)

## 왜 먼저인가

- Phase 7 Dev Gate에 **Owner Top 3 합의**·**375px 수동 tick**이 미체크
- Iteration Top 3의 #1(activity accordion)은 이미 제품 결정으로 **대체 완료** → 서명란을 갱신하지 않으면 다음 스프린트가 잘못된 백로그를 쫓음

## Task A-1 — Owner Top 3 재합의 (서명)

**대상 문서:** `docs/results-ux-phase7-validation-report.md` §3 · 본 문서 §Phase C–D

| 구 Phase 7 Top 3 | 2026-07-10 결정 |
|------------------|-----------------|
| activity → accordion | **완료(대체)** — 추가 구현 없음 |
| 375px Playwright 스크린샷 회귀 | **Defer → Phase D** (선택) |
| Analytics 집계 | **→ Phase C** (bookmark·탭·Home; Compare 제외) |

**Owner Gate**

| 항목 | 결정 | 서명/날짜 |
|------|------|-----------|
| Top 3 재정의 (본 문서 A→F) | **승인** | Owner: Product Owner / 2026-07-10 |
| activity accordion | **완료(대체)로 종결** | 2026-07-10 · §4.15 |
| Phase 7 Validation close-out | **A-1 + A-2 완료** | 2026-07-10 |

- [x] Owner 서명란 기입 (PM/Tech Lead) — Phase 7 리포트 §3 갱신
- [x] Phase 7 리포트 Dev Gate «Owner Top 3 합의» 체크

## Task A-2 — 375px 수동 QA 체크리스트 tick

**대상:** 브라우저 DevTools **375px** · `/results` (로그인·설문 후 결과 세션)  
**검증 방식 (2026-07-10):** 코드 정적 확인 + Vitest recommendation **61** + Playwright `critical-flows` + `results-evidence-phase4` **11 passed** (375px 포함) · `PW_REUSE_SERVER=1`

> Phase 6 체크리스트는 Compare Drawer 기준이 남아 있음. **현재 IA** 기준으로 tick:

| # | 확인 | tick | 검증 근거 |
|---|------|------|-----------|
| 1 | Hero: 제목·PRIMARY BUILD 압축 · 취향 요약 details | [x] | `shared-result-header.tsx` — `sm:hidden` details · PRIMARY BUILD · E2E ranked 가시 |
| 2 | 탭 바: `overview` / `evidence` 2탭 · 가로 스크롤/fade · overflow 없음 | [x] | `results-types.ts` 2탭 · fade `sm:hidden` · E2E `e2e-results-tab-bar` 375px |
| 3 | 공통 신뢰 레이어(Trust Layer) 가독 · 탭 위 고정 | [x] | Hero → Trust → TabBar 순서 · E2E `e2e-trust-layer` 375px |
| 4 | 6축 1열 · description clamp | [x] | `grid-cols-1` · `line-clamp-3` · E2E `e2e-server-ranked` 375px |
| 5 | 저장 CTA full-width · «마이페이지에서 저장한 빌드 보기» 링크 | [x] | `w-full` CTA · `/mypage?section=saved` · E2E save |
| 6 | Evidence pick · ranking why(조건 시) · 제품 특징 | [x] | E2E evidence «왜 추천했나요» · ranking why concrete만 · MetricGuide는 lite fallback만 (backend Evidence 미표시 = 현재 IA) |
| 7 | Compare Drawer **없음** (회귀 금지) | [x] | `compare-drawer` / `e2e-open-compare` 코드 0건 · mypage 비교 탭 0 |
| 8 | `e2e-server-ranked` · `e2e-save-build` · `e2e-pick-explanations` 동작 | [x] | E2E 11/11 green |

**참고(구 체크리스트):** `docs/results-ux-phase6-completion.md` — Drawer/CTA 3버튼 항목은 **무시**하고 위 표만 사용.

**부수 수정 (검증 중):** `e2e/tests/results-evidence-phase4.spec.ts` — 존재하지 않는 `page.queryByTestId` → `getByTestId(...).toHaveCount(0)` (Playwright API 오류 수정)

**Dev Gate**

- [x] A-1 Owner 서명
- [x] A-2 375px 표 전부 tick
- [x] Phase 7 «수동 QA» / Dev Gate 문서 반영

**Out of Scope:** Playwright visual · analytics 대시보드 · Home 제품 변경

**Rollback:** 해당 없음 (문서·QA)

---

# Phase B. Observe 표본 — Home 재방문 집계 · **조건부 · 제품 UI 금지**

> **우선순위 2.** `home.viewed` 배선은 끝남. **집계·표본**이 없으면 Phase 5 제품 revisit(Redirect/Dashboard)은 LOCK 유지.  
> **Status:** ✅ **인프라·기준 완료** — 2026-07-10 · 표본 숫자는 관측 기간 후 `unlock_ready`로 판정 (제품 UI 🔒)

## 전제

| 조건 | 상태 |
|------|------|
| `home.viewed` emit | ✅ |
| Results / Evidence / MyPage 안정 | ✅ |
| 조회 경로 (B-1) | ✅ CLI + 모듈 + SQL |
| Owner Unlock 기준 숫자 (B-2) | ✅ 기입 |
| N일·M세션 **실제 표본** | 🔄 관측 기간 · `unlock_ready=false` 유지 시 제품 UI 금지 |

**상세:** `docs/product-next-phase5-home-revisit.md` · `docs/home-ia-locked.md` §Revisit When

## Task B-1 — 집계 파이프라인 (최소) ✅

| 경로 | 위치 |
|------|------|
| 집계 모듈 | `backend/.../unified_pipeline/observe_aggregate.py` |
| CLI | `backend/scripts/report_observe_aggregates.py` |
| 스키마 수정 | `interaction.results_tab_click` → `UnifiedEventType` (저장 누락 버그 수정) |
| 테스트 | `backend/tests/test_observe_aggregate.py` |

**조회 이벤트:** `home.viewed` · `interaction.bookmark` · `interaction.results_tab_click` · `interaction.revisit` · `interaction.repeated_view`  
**guest vs auth:** `home.viewed` metadata `auth` (`guest` | `authenticated`)

**실행 (CMD, backend venv):**

```bat
cd backend
.\.venv\Scripts\activate.bat
python scripts\report_observe_aggregates.py --dry-run-local
python scripts\report_observe_aggregates.py --window-days 14
python scripts\report_observe_aggregates.py --json
```

**전제 (live):** `ENABLE_EVALUATION_PERSISTENCE=true` · DB에 `eval_events` 적재. persistence off면 카운트 0.

**SQL (참고):**

```sql
SELECT event_type, COUNT(*) AS n
FROM eval_events
WHERE event_type IN (
  'home.viewed', 'interaction.bookmark', 'interaction.results_tab_click',
  'interaction.revisit', 'interaction.repeated_view'
)
  AND created_at >= NOW() - INTERVAL '14 days'
GROUP BY event_type;
```

## Task B-2 — 관측 기간 · Unlock 기준 (Owner) ✅ 숫자 기입

| 기준 | Owner 확정 (2026-07-10) |
|------|-------------------------|
| 기간 | **N ≥ 14** calendar days (`span_calendar_days`) |
| Home 진입 | **M ≥ 50** `home.viewed` events |
| 신호 | guest **및** authenticated 각 ≥ 1 · Results 재방문(`revisit`/`repeated_view`)은 참고 카운트 |
| 판정 | CLI `unlock_ready` · blockers 목록 |

**Unlock 시만 백로그 후보 (구현은 별도 · Why 필수 — 본 Phase에서 UI 없음):**

- Login redirect
- Login Home 개인화
- Dashboard

**Dev Gate**

- [x] B-1 조회 경로 문서화 (모듈 · CLI · SQL)
- [x] B-2 Owner Unlock 기준 숫자 기입 (14일 · 50 home.viewed · guest+auth)
- [x] 표본 미달이면 **제품 UI 착수 없음** 재확인 (`product_ui_locked: true` · Do not)

**Out of Scope:** Redirect A/B · Dashboard UI · Preview 대시보드화

**검증 (2026-07-10):** pytest `test_observe_aggregate` + `test_unified_event_pipeline` **14 passed** · CLI `--dry-run-local` → `unlock_ready: False`

**Status:** 조회·기준 ✅ · 실제 표본 🔄 · 제품 revisit 🔒

---

# Phase C. Analytics 집계 — 전환·퍼널 · **인프라 있을 때**

> **우선순위 3.** Phase 7 Iteration #3 후속. Compare/`drawer_open`은 **집계 대상에서 제외**.  
> **Status:** ✅ **완료** — 2026-07-10 (C-1 전환율 · C-2 CSV/debug KPI · Dev Gate)

## Task C-1 — 핵심 전환율 ✅

| 지표 | 이벤트 | 용도 | 산출 |
|------|--------|------|------|
| 저장 전환 | `interaction.bookmark` / `onboarding.completed` | CTA 성공 | `rates.bookmark_given_onboarding_completed` |
| Evidence 체류 proxy | `interaction.results_tab_click` (tab=evidence) | 근거 탭 사용 | `evidence_tab_clicks` · `rates.evidence_tab_given_tab_clicks` |
| 결과 진입·재방문 | `interaction.click` · `revisit` · `repeated_view` | 퍼널 | counts + `revisit_given_onboarding_completed` |
| Home 진입 | `home.viewed` | Phase B와 공유 | counts · Phase B unlock 재사용 |
| 설문→결과 | `kpi.time_to_first_result` · `onboarding.*` | 퍼널 | avg TTF · completion rate |

| 경로 | 위치 |
|------|------|
| 모듈 | `backend/.../unified_pipeline/funnel_analytics.py` |
| CLI | `backend/scripts/report_funnel_analytics.py` |
| 테스트 | `backend/tests/test_funnel_analytics.py` |

**실행 (CMD, backend venv):**

```bat
cd backend
.\.venv\Scripts\activate.bat
python scripts\report_funnel_analytics.py --dry-run-local
python scripts\report_funnel_analytics.py --window-days 7
python scripts\report_funnel_analytics.py --window-days 7 --csv funnel-week.csv
```

## Task C-2 — 대시보드 / 내보내기 ✅

- Internal Debug `GET /api/v1/debug/analytics/kpis` — `save_conversion_rate` 유지 · **Comparison usage 성공 지표 제거** · `evidence_tab_share` 추가 · `excluded_success_metrics` 명시
- Frontend `/debug/analytics` — Comparison 카드 → Evidence tab share
- 주간 CSV — CLI `--csv path`
- Hotjar / Session Replay — **Optional** (미구현)

**Dev Gate**

- [x] bookmark 전환율을 CLI/CSV로 주 1회 이상 볼 수 있음 (`bookmark_given_onboarding_completed`)
- [x] Compare/`drawer_open`을 성공 지표로 쓰지 않음 (`excluded_from_success` · KPI `comparison_usage_rate=0`)
- [x] Phase B Unlock과 숫자 해석이 충돌하지 않음 (`phase_b_unlock_ready` / blockers 동봉 · 제품 UI LOCK)

**Out of Scope:** A/B 실험 플랫폼 · Home 제품 변경

**검증 (2026-07-10):** pytest funnel+observe **7 passed** · CLI dry-run · ruff clean

---

# Phase D. Visual 회귀 — 375px Playwright 스크린샷 · **선택**

> **우선순위 4.** Phase 7 Iteration #2 · Phase 6 defer. **기능 E2E는 이미 green** — visual은 릴리즈 회귀 방지용.  
> **Status:** ✅ **완료** — 2026-07-10 (3시나리오 baseline · `visual-375` project · functional green)

## Task D-1 — 375px 스크린샷 세트 ✅

| # | 시나리오 | snapshot |
|---|----------|----------|
| 1 | First View (hero + trust + ranked) | `results-375-first-view-*.png` |
| 2 | Trust Layer 영역 | `results-375-trust-layer-*.png` |
| 3 | Evidence 탭 영역 | `results-375-evidence-tab-*.png` |

| 경로 | 위치 |
|------|------|
| 스펙 | `e2e/tests/results-visual-375.spec.ts` |
| baseline | `e2e/tests/results-visual-375.spec.ts-snapshots/` (OS suffix, 예: `*-win32.png`) |
| 헬퍼 | `e2e/tests/helpers/results-flow.ts` |
| 프로젝트 | `playwright.config.cjs` → `visual-375` (기본 `npm test` = chromium만) |

**실행 (CMD, e2e · 스택 재사용):**

```bat
cd e2e
set PW_REUSE_SERVER=1
npm run test:visual
npm run test:visual:update
npm test -- tests/critical-flows.spec.ts tests/results-evidence-phase4.spec.ts
```

**CI:** PR/`npm test`는 **functional chromium만**. Visual은 동일 OS baseline에서 수동·주간 실행 권장 (크로스 OS 픽셀 flaky).

**Do not:** Compare Drawer 스크린샷 · Home Dashboard · «빠른 추천»

**Dev Gate**

- [x] Phase A-2 완료 후 착수
- [x] 최소 3 viewport 시나리오 baseline
- [x] E2E functional green 유지 (critical-flows + evidence-phase4 **11 passed**)

**Out of Scope:** 전 페이지 visual · 디자인 리팩터

**검증 (2026-07-10):** `test:visual` **4 passed** (setup+3) · functional **11 passed** · Compare testid 0건

---

# Phase E. Catalog 선택 확장 · **선택 · 낮은 우선**

> **우선순위 5.** 제품 핵심 퍼널과 무관한 seed/설문 확장.  
> **Status:** ✅ **완료** — 2026-07-10 (keycap 12→18 · 설문/NL 키캡 축 강화 · regression green)

## Task E-1 — 키캡 seed 확대 ✅

- curated keycap **12 → 18** (`CURATED_FULL_CATALOG_IDS` + `apply_keycap_seed_merge.py`)
- 신규: `full-013`, `full-023`, `full-026`, `full-027`, `full-030`, `full-050`
- 전부: 모두 `shop_view/?idx=` + non-flat traits · Add-on/Alpha 제외
- seed 합계 **173 → 179** (switch 67 · plate 14 · foam 9 · layout 22 · case 49 · **keycap 18**)

## Task E-2 — 설문/NL 키캡 축 ✅

- **설문 단계 추가 없음** (E2E 5단계 유지) — muted/bright·volume 가중을 keycap trait(`muted`/`high_pitch`/`poppy`)에 더 맞춤
- Backend: `survey_profile.py` · `survey_deltas.py` · Frontend: `survey-definition.ts`
- NL: `word-boosts.ts` / `phrase-patterns.ts` — PBT·ABS·염료승화·이중사출·키캡 구문
- Vitest: `frontend/src/nl-preference/keycap-nl-mapping.test.ts`

**Dev Gate**

- [x] seed regression (`run_swagkey_catalog_regression.py`) green — extracted=179 · errors=0 · **94 passed**
- [x] `/api/v1/keycaps` total **18** · `/catalog` 키캡 탭 · results keycap 축 유지
- [x] stable snapshot regen (설문·풀 변경 반영)

**Out of Scope:** full catalog 액세서리 UI 노출 · 설문 6번째 단계(키캡 전용 질문)

**검증 (2026-07-10):** keycap/catalog pytest · catalog regression · contract/regression **11** · NL Vitest **3** · survey wizard **3**

---

# Phase F. Ops 선택 자동화 · **선택 · 낮은 우선** · ✅ 2026-07-10

> **우선순위 6.** ⑮ 운영은 fixture recheck·검증 스크립트까지 완료. **완전 자동화** (F-1~F-3) 완료. F-4는 사용자 요청 시에만.

## Task F-1 — (선택) live crawl 스케줄 · ✅

- `scripts/run_swagkey_live_inventory_pipeline.py` — crawl URLs → clean → classify → live recheck
- `.github/workflows/swagkey-inventory-recheck-live.yml` — 매월 1일 + `workflow_dispatch` · 실패 시 webhook
- 제품명 CSV는 외부 크롤 갱신 전제 (`SWAGKEY_PRODUCTS_CSV` / committed CSV)

## Task F-2 — (선택) catalog alert webhook · ✅

- `catalog_change_alert_webhook.py` · `--notify-webhook` / `--webhook-dry-run`
- Env: `CATALOG_CHANGE_ALERT_WEBHOOK_URL` (fallback `OPERATIONAL_ALERT_WEBHOOK_URL`)
- Fixture 주간 job도 secret 있으면 notify · Slack/Discord/json auto format

## Task F-3 — (선택) Feedback Learning MVP 스테이징 · ✅ (로컬 dry-run)

- `ENABLE_FEEDBACK_LEARNING_MVP` 기본 **off** · `docs/staging-feedback-learning-mvp.md`
- `verify_feedback_learning_mvp.py --dry-run-local` · `verify_ops_quality_15.py`에 포함
- 실제 staging host 검증은 운영자가 `--base-url`로 수행 (production off 유지)

## Task F-4 — (메타) Git 단독 repo 정리

- `keyboard-recommender` 커밋/원격 정리 — **사용자 요청 시에만** · 미착수

**Dev Gate**

- [x] live 모드가 fixture 알림을 깨지 않음 (`verify_ops_quality_15` · fixture + live skip-network dry-run)
- [x] 비밀값·webhook URL 커밋 금지 (env/CI secrets · redact · `.env.example` 주석만)

**검증 (2026-07-10):** webhook unit · fixture recheck · live pipeline dry-run · feedback dry-run · ops ⑮ verify

---

## Phase 순서 요약

| Phase | 이름 | 우선 | 성격 | 착수 조건 |
|-------|------|------|------|-----------|
| **A** | Close-out | P0 | 문서·수동 QA·서명 | ✅ 2026-07-10 |
| **B** | Observe 표본 | P1 | 집계·관측 | ✅ 인프라·기준 2026-07-10 · 표본 🔄 |
| **C** | Analytics | P2 | 전환율 | ✅ 2026-07-10 |
| **D** | Visual 회귀 | P3 | 선택 E2E | ✅ 2026-07-10 |
| **E** | Catalog 확장 | P4 | 선택 제품 | ✅ 2026-07-10 |
| **F** | Ops 자동화 | P4 | 선택 운영 | ✅ 2026-07-10 (F-4 제외) |

```
[완료]  A Close-out ✅
          ↓
[인프라] B 표본 ✅ (unlock_ready 전 UI 금지) ──┬── C Analytics ✅
          ↓      │
     (Unlock?)   └── D Visual (선택)
          ↓
     Home 제품 revisit — 별도 문서·Why 필수 (본 로드맵에 UI Task 없음)
          │
     E ✅ / F ✅ (F-4 Git은 요청 시)
```

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| `docs/PROJECT_CONTEXT.md` | 전체 컨텍스트 · §4.9 미구현 · §4.16 Phase 5 |
| `docs/product-next-phases.md` | Home LOCK 이후 0–5 (구현 Phase **완료·부분**) |
| `docs/product-next-phase5-home-revisit.md` | Home 데이터 전제 · 제품 LOCK |
| `docs/home-ia-locked.md` | Landing · Revisit When |
| `docs/localhost-execution-roadmap.md` | **localhost** 실행 Phase 0–6 (catalog · deploy · observe · Home) |
| `docs/results-ux-phase7-validation-report.md` | Phase 7 Observe · 구 Iteration Top 3 |
| `docs/results-ux-phase6-completion.md` | 구 375px 체크리스트 (Compare 항목 obsolete) |
| `docs/swagkey-inventory-recheck.md` | ⑮ recheck |
| `docs/staging-feedback-learning-mvp.md` | Feedback flag |
| `docs/production-https.md` | HTTPS 체크리스트 |

---

*이 문서는 «남은 일»의 단일 진입점이다. Phase 완료 시 이 파일과 `PROJECT_CONTEXT.md` §4.9 / Iteration 목록을 함께 갱신한다.*  
*최종 반영 (2026-07-10): **Phase F Ops** — live pipeline · webhook · Feedback dry-run · `PROJECT_CONTEXT.md` §4.9 동기화. 잔여 = B 표본 · F-4 · Home revisit.*  
*이전: **Phase E Keycap** — seed 18 · survey/NL 축 · catalog regression 179.*  
*이전: **Phase D Visual** — results-visual-375 · 3 baseline.*  
*이전: **Phase C Analytics** — funnel CLI/CSV · Compare 성공지표 제외.*  
*이전: **Phase B 인프라** — observe_aggregate · Unlock 14일/50 · 제품 UI LOCK.*  
*이전: **Phase A 완료** — Owner Top 3 재서명 · 375px QA(Vitest 61 · E2E 11).*
