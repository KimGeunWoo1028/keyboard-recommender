# Localhost Execution — Phase 실행 로드맵

> **버전:** v1.0 — 2026-07-12 (KST)  
> **목적:** 구현 로드맵(Product Next · Results · Evidence · Swagkey 1:1 · Remaining A–F) **완료 이후**, **localhost만** 개발·검증하는 환경에서 **지금부터 할 일 전체**를 Phase 순서로 정리  
> **전제:** `localhost:3000` + API `8010` · seed **`--apply-to-seed` 자동 실행 금지** · Home 제품 UI LOCK  
> **관련:** `remaining-work-phases.md` · `swagkey-catalog-1to1-roadmap.md` · `PROJECT_CONTEXT.md` §4.9 · §4.10

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Owner** | §환경 분기 · §Phase 순서 · Phase 0 blocking 표 · §Do not |
| **운영자** | Phase 0–2 Task · dry-run → 승인 → apply 절차 |
| **구현 / Cursor** | 해당 Phase Task만 · Gate 미충족 시 `--apply-to-seed` 금지 |

```
[지금·로컬]  Phase 0 → Phase 1 → Phase 2 (반복)
                  ↓
[배포 결정]  Phase 3 Deploy
                  ↓
[배포 후]    Phase 4 Observe 표본 → Phase 5 Home revisit 🔒
                  ↓
[요청 시]    Phase 6 선택 백로그
```

**한 Phase = 한 집중 구간.** Phase 0 Gate 통과 전 seed `--apply-to-seed` 금지.

---

## 환경 분기 (이 로드맵의 핵심)

| 환경 | 이 문서에서 **지금** 해당 | 보류 |
|------|---------------------------|------|
| **localhost만** (현재) | **Phase 0–2** | Phase 3–5 |
| 스테이징 배포 후 | Phase 3 → 4 | Phase 5 (Unlock 전) |
| 프로덕션 + 트래픽 | Phase 3 → 4 → (Unlock 후) 5 | — |

**localhost만이면:** `remaining-work-phases.md` Phase B 표본(14일·50 `home.viewed`)은 **의미 없음** — 본 로드맵 **Phase 4**로 이관·보류.

---

## 완료로 간주 (이 로드맵에서 제외)

| 항목 | 완료일 |
|------|--------|
| Product Next Phase 0–4 | 2026-07-10 |
| Results UX Phase 0–7 · Evidence IA Phase 0–4 | 2026-07-10 |
| Swagkey ①~⑮ · 1:1 Phase 0–8 sign-off | 2026-07-12 |
| Remaining-work Phase A–F **구현** | 2026-07-10 |
| Phase B Observe **인프라** (CLI · Unlock 기준 14일/50) | 2026-07-10 |

---

## Do not (전 Phase 공통)

- `merge_*` / `promote_*` **`--apply-to-seed` 자동 실행** — 항상 `--dry-run` → 검토 → 운영자 승인
- Home Dashboard / Login redirect / dual Hero (**Phase 4 Unlock 전**)
- Compare UI · activity 탭 · «빠른 추천»
- layout diagram geometry 임의 수정 (`layout-diagram-definitions.ts` 등 LOCK)
- blocking 없이 informational layout `seed_only`만 보고 seed 대량 삭제
- localhost 트래픽만으로 Phase 4 Unlock 판정 시도

---

## 현재 baseline (2026-07-12)

| 지표 | 값 | 산출 |
|------|-----|------|
| browse seed rows | **329** | `swagkey_products.seed.json` (duplicate switch 2건 제거) |
| recommend pool (gated) | **150** | `audit_recommendation_pool.py` |
| **blocking alerts** | **0** | `catalog_change_alert.txt` (Phase 0 완료 후) |
| informational alerts | 34 | layout archetype·기판·단종 seed_only |
| coverage gap | switch +2 · keycap +5 · layout 0 | `catalog_1to1_coverage_report.txt` |

---

# Phase 0. Catalog blocking triage — **P0 · 즉시**

> **우선순위 1.** 추천 풀에 남은 **단종 후보·이름 불일치** SKU를 정리한다.  
> **Status:** ✅ **완료** — 2026-07-12 · blocking **15 → 0**

## 왜 먼저인가

- `recommendationEligible=true` 인데 크롤 인벤토리에 없는 SKU가 추천에 노출될 수 있음
- `swagkey-catalog-1to1-roadmap.md` Phase 7–8 **지속 운영**의 첫 단계
- Phase 1 seed merge **전에** 정책(유지 vs 제외)을 정해야 함

## Task 0-1 — fixture recheck & alert 읽기

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
```

**확인 파일:** `data/swagkey_inventory/catalog_change_alert.txt`

## Task 0-2 — blocking 15건 판정 (Owner)

각 건에 대해 **하나만** 선택:

| 판정 | 조치 |
|------|------|
| **단종** | recommend 풀에서 제외 (`recommendationEligible: false` 또는 seed 정리) |
| **유지** | 스웨그키 재확인 · inventory URL/분류 보강 후 diff 재실행 |
| **이름 변경** | seed 이름·매칭 갱신 |

### BLOCKING — POSSIBLY DISCONTINUED (14)

| family | seed id | 제품명 | Owner 판정 |
|--------|---------|--------|------------|
| foam | `foam-005` | 스웨그키 포론 기보강 흡음재 - 텐키리스용 | **단종** — idx 재사용(60% SKU) |
| switch | `sw-other-005` | Bsun 민트 키보드 스위치 | **단종** |
| switch | `sw-tactile-003` | Cherry MX2A 비윤활 갈축 … 450개 벌크 | **유지** — `inv-0128` |
| switch | `sw-linear-006` | Gateron X 리니어 스위치 | **단종** |
| switch | `sw-other-016` | HMX 망고 푸딩 키보드 스위치 | **단종** |
| switch | `sw-other-021` | Haimu 바다살구 스위치 | **단종** |
| switch | `sw-other-020` | SW x 게이트론 onyx : UHMWPE 스위치 | **단종** |
| switch | `sw-other-011` | SW 코코블랙 키보드 스위치 | **단종** |
| switch | `sw-silent-003` | TTC 피넛 라떼 저소음 택타일 스위치 | **유지** — `inv-0098` |
| switch | `sw-other-003` | Tecsee x SW Flow Black … | **단종** |
| switch | `sw-silent-002` | WEKT Kunzite 쿤자이트 저소음 리니어 스위치 | **중복** — `sw-linear-008` 유지 |
| switch | `sw-silent-004` | 오테뮤 크림 옐로우 저소음 … | **단종** |
| switch | `sw-other-008` | 체리 MX 3핀 키보드 스위치 | **단종** |
| switch | `sw-other-006` | 체리 MX RGB 키보드 스위치 | **단종** |

**추가 조치:** 중복 seed `sw-tactile-002`·`sw-tactile-007` **seed에서 제거** (`seed_quality.SEED_REMOVE_IDS`)

### BLOCKING — NAME CHANGED (1)

| seed id | seed 이름 | crawl 이름 | Owner 판정 |
|---------|-----------|------------|------------|
| `sw-linear-003` | 스웨그키 HMX Peach 반저소음 리니어 … | 스웨그키 HMX Peach **피치** 반저소음 … (`inv-0085`) | **이름 변경** ✅ |

**informational 22건** (layout archetype·실 PCB): **이 Phase에서 seed 삭제하지 않음**.

## Task 0-3 — dry-run merge 검토

```powershell
python scripts/merge_inventory_browse_seed.py --dry-run
```

**산출:** `inventory_browse_merge_report.{json,txt}`

## Task 0-4 — regression gate

```powershell
python scripts/audit_recommendation_pool.py
python scripts/run_swagkey_catalog_regression.py
```

**Owner Gate**

| 항목 | 결정 | 서명/날짜 |
|------|------|-----------|
| blocking 15건 판정 | **완료** (위 표) | 2026-07-12 |
| dry-run merge 검토 | **완료** — added 0 · rejected 5 | 2026-07-12 |
| regression 127 green | **완료** | 2026-07-12 |

**Dev Gate**

- [x] blocking 15건 Owner 판정 기록 (위 표)
- [x] `--dry-run` merge 리포트 검토
- [x] `run_swagkey_catalog_regression.py` **127 pytest** green
- [x] seed triage 반영 (`recommendationEligible` · 이름 · 중복 제거) — merge `--apply-to-seed` **불필요** (added 0)

**Out of Scope:** live crawl · webhook · Home UI

---

# Phase 1. Coverage gap 축소 — **P1 · Phase 0 Gate 후**

> **우선순위 2.** 1:1 coverage CI warning family를 줄인다.  
> **Status:** ✅ **완료** — 2026-07-12 · layout gap **0** · switch/keycap 잔여 gap 문서화

## Baseline gap

| family | gap (before) | gap (after) | 조치 |
|--------|-------------|-------------|------|
| **layout** | **-15** | **0** | `layout-new-*` 15건 `browse.listed: false` + browse 정책 반영 |
| **keycap** | +5 | +5 | idx 없음 3건 — live recrawl 대기 (`phase1_coverage_exceptions.txt`) |
| **switch** | +2 | +2 | idx 없음 2건 — live recrawl 대기 |
| plate / foam / case | 0 | 0 | merge 메타데이터 동기화 ✅ |

**목표:** gap ≤ **2%** per family — **layout ✅** · switch/keycap는 **idx enrichment 후** 재 audit

**예외 목록:** `backend/data/swagkey_inventory/phase1_coverage_exceptions.txt`

## Task 1-1 — coverage & image audit

```powershell
python scripts/audit_catalog_1to1_coverage.py --check-threshold --warn-only
python scripts/audit_browse_image_coverage.py
python scripts/audit_catalog_browse_issues.py
```

## Task 1-2 — (선택) recommend 풀 승격 후보

seed flag **179** vs gated recommend **164**:

```powershell
python scripts/promote_to_recommendation_pool.py
```

(기본 dry-run — `--apply-to-seed` 없이 리포트만)

**산출:** `recommendation_promotion_report.json`

## Task 1-3 — seed 반영 (조건부)

Phase 0·1 dry-run 검토 **완료 후**에만:

```powershell
python scripts/merge_inventory_browse_seed.py --apply-to-seed
python scripts/run_swagkey_catalog_regression.py
```

**Dev Gate**

- [x] Phase 0 완료
- [x] layout gap **0** (mislinked `layout-new-*` unlist)
- [x] merge `--apply-to-seed` — 메타데이터 동기화 (added 0)
- [x] regression **127** green
- [x] switch/keycap 잔여 gap **문서화** (live recrawl 전제)

**Out of Scope:** layout diagram geometry

---

# Phase 2. 로컬 유지보수 리듬 — **P2 · 상시**

> **우선순위 3.** 배포 전에도 반복하는 **fixture 기반** 운영.  
> **Status:** ✅ **완료** — 2026-07-12 · blocking **0 유지** · ops·Vitest·E2E green

## Task 2-1 — fixture recheck (권장: 주 1회)

```powershell
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
```

큰 seed 변경·PR 전에도 실행. `blocking alert total` 증가 시 **Phase 0 재개**.

## Task 2-2 — 품질 스모크 (변경 후)

```powershell
python scripts/verify_ops_quality_15.py
cd ..\frontend && npm test -- --run
cd ..\e2e && npm test
```

**Visual (선택):** `cd e2e && npm run test:visual`

## Task 2-3 — (선택) 로컬 이미지 mirror

```powershell
python scripts/download_swagkey_images.py
```

`data/swagkey_images/`는 gitignore.

**Dev Gate**

- [x] recheck 후 blocking 추이 기록 (`phase2_blocking_trend.txt`)
- [x] `verify_ops_quality_15.py` — ⑮ verification OK
- [x] frontend Vitest **127** passed
- [x] E2E functional **14** passed (chromium)
- [ ] (선택) `download_swagkey_images.py` — 미실행 · gitignore 대상

### Phase 2 CMD 검증 (backend → frontend → e2e)

```cmd
cd c:\Users\jeung\keyboard-recommender\backend
.\.venv\Scripts\activate.bat

REM 1) fixture recheck (주 1회·PR 전)
python scripts\run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
findstr "blocking alert total" data\swagkey_inventory\catalog_change_alert.txt
REM 기대: blocking alert total: 0

REM 2) ops 품질 (roadmap ⑮)
python scripts\verify_ops_quality_15.py
REM 기대: ⑮ verification OK

REM 3) blocking 추이
type data\swagkey_inventory\phase2_blocking_trend.txt

REM 4) catalog regression (seed 변경 시)
python scripts\run_swagkey_catalog_regression.py
REM 기대: 127 passed, 1 skipped

cd ..\frontend
npm test -- --run
REM 기대: 127 passed (31 files)

cd ..\e2e
npm test
REM 기대: 14 passed
REM 포트 3000/8000 사용 중이면: set PW_REUSE_SERVER=1 && npm test
```

**Owner Gate**

| 항목 | 결정 | 서명/날짜 |
|------|------|-----------|
| fixture recheck blocking 0 | **유지** | 2026-07-12 |
| ops·E2E smoke green | **완료** | 2026-07-12 |

---

# Phase 3. Deploy gate — **P3 · 배포 결정 시**

> **우선순위 4.** localhost를 벗어날 때.  
> **Status:** ⏸ **로컬만 환경 — 보류**  
> **상세 체크리스트:** `docs/deployment-roadmap.md` (Phase 0–5 전체)

## Task 3-1 — 스테이징/프로덕션 배포

**마스터:** `docs/deployment-roadmap.md` · **HTTPS:** `docs/production-https.md`

- Phase 0 로컬 게이트 (blocking 0 · `verify_ops_quality_15.py`)
- Phase 1 인프라 (관리형 Postgres · 도메인 · HTTPS 토폴로지)
- Phase 2 env · `alembic upgrade head` · `download_swagkey_images.py`
- Phase 3 Staging smoke → Phase 4 Production smoke

## Task 3-2 — 배포 smoke

- 로그인 · 설문 · 결과 · 저장 · 마이페이지 수동 확인
- `ENABLE_EVALUATION_PERSISTENCE=true` · `eval_events` 적재 확인

**Dev Gate**

- [ ] `deployment-roadmap.md` Phase 3 Gate (staging smoke)
- [ ] `deployment-roadmap.md` Phase 4 Gate (production smoke)

**Out of Scope:** Home UI 변경

---

# Phase 4. Observe 표본 & Unlock — **배포 후**

> **우선순위 5.** `remaining-work-phases.md` Phase B **표본 수집**에 해당.  
> **Status:** ⏸ **인프라 ✅ · 표본 🔄** — localhost만이면 **해당 없음**

## 전제

| 조건 | 상태 |
|------|------|
| `home.viewed` emit | ✅ |
| 집계 CLI (`report_observe_aggregates.py`) | ✅ |
| Unlock 기준 (14일 · ≥50 `home.viewed` · guest+auth) | ✅ 기입 |
| **실제 표본** | 🔄 Phase 3 배포 + persistence 후 |

## Task 4-1 — 이벤트 적재

```env
ENABLE_EVALUATION_PERSISTENCE=true
```

## Task 4-2 — 14일 관측 후 Unlock 판정

```powershell
python scripts/report_observe_aggregates.py --window-days 14
python scripts/report_observe_aggregates.py --json
```

**Unlock 기준:** `span_calendar_days` ≥ 14 · `home.viewed` ≥ 50 · guest + auth 각 ≥ 1 → `unlock_ready`

**Dev Gate**

- [ ] 14일 이상 관측
- [ ] `unlock_ready: true` 판정
- [ ] Unlock 전 **Phase 5 착수 금지** 재확인

**상세:** `remaining-work-phases.md` Phase B · `product-next-phase5-home-revisit.md`

---

# Phase 5. Home revisit — **🔒 Unlock + Owner Why 후**

> **우선순위 6.** 제품 UI 잔여. **구현 Task는 본 로드맵에 없음** — 별도 Why·서명 필수.  
> **Status:** 🔒 **LOCK** — Phase 4 `unlock_ready` 전 착수 금지

## 후보 (Unlock 시만 백로그)

- Login redirect
- Login Home 개인화
- Dashboard / Workspace

**관련:** `home-ia-locked.md` · `product-next-phase5-home-revisit.md`

**Do not:** dual Hero · Compare 복원 · Preview 대시보드화 · 가짜 Match %

---

# Phase 6. 선택 백로그 — **요청·환경 있을 때만**

> **우선순위 7.** 필수 아님.

| Task | 조건 | 문서 |
|------|------|------|
| F-4 Git repo 정리 | 사용자 요청 | `remaining-work-phases.md` F-4 |
| Feedback Learning staging | staging host + flag on | `staging-feedback-learning-mvp.md` |
| E2E 카탈로그 썸네일 스냅샷 | 선택 QA | `swagkey-product-images-roadmap.md` |
| live inventory pipeline | 월 1회 · secret | `swagkey-inventory-recheck-live.yml` |
| webhook notify | `CATALOG_CHANGE_ALERT_WEBHOOK_URL` | `remaining-work-phases.md` F-2 |

---

## Phase 순서 요약

| Phase | 이름 | 우선 (localhost) | 성격 | 착수 조건 |
|-------|------|------------------|------|-----------|
| **0** | Catalog blocking triage | **P0** | alert·seed 정책 | **즉시** |
| **1** | Coverage gap | **P1** | 1:1 gap·dry-run merge | Phase 0 Gate 권장 |
| **2** | Maintenance | **P2** | fixture recheck·E2E | 상시 |
| **3** | Deploy gate | **P3** | HTTPS·persistence | 배포 결정 시 · 상세 `deployment-roadmap.md` |
| **4** | Observe & Unlock | P4 | 표본·14일/50 | Phase 3 후 |
| **5** | Home revisit | P5 | 제품 UI | Phase 4 `unlock_ready` |
| **6** | 선택 백로그 | P6 | F-4·Feedback 등 | 요청 시 |

```
[로컬 지금]     Phase 0 ──► Phase 1 ──► Phase 2 (반복)
                     │
[배포 후]            └──► Phase 3 ──► Phase 4 ──► (Unlock) Phase 5
                                              │
[요청 시]                                     └──► Phase 6
```

---

## 기존 로드맵과의 관계

| 문서 | 역할 | 본 로드맵과의 관계 |
|------|------|-------------------|
| `remaining-work-phases.md` | 제품 잔여 A–F | A–F 구현 ✅ · B 표본 = **본 Phase 4** |
| `swagkey-catalog-1to1-roadmap.md` | 1:1 sign-off | Phase 0–1 = **지속 운영** 후속 |
| `product-next-phase5-home-revisit.md` | Home 데이터 전제 | **본 Phase 5** 상세 |
| `home-ia-locked.md` | Landing LOCK | Phase 5 Revisit When |
| `PROJECT_CONTEXT.md` | 전체 컨텍스트 | §4.9 잔여 체크리스트 |

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| `docs/PROJECT_CONTEXT.md` | 전체 컨텍스트 · §4.9 · §4.10 |
| `docs/remaining-work-phases.md` | Remaining A–F · B 인프라 상세 |
| `docs/swagkey-catalog-1to1-roadmap.md` | 1:1 sign-off · coverage 정책 |
| `docs/swagkey-inventory-recheck.md` | recheck · alert tier |
| `docs/deployment-roadmap.md` | **배포 Phase 0–5** (staging · prod · DB · smoke) |
| `docs/production-https.md` | HTTPS · cookie · CORS 상세 |
| `docs/home-ia-locked.md` | Phase 5 LOCK |

---

*이 문서는 **localhost 환경에서의 실행 Phase 단일 진입점**이다. 배포·Unlock·카탈로그 alert 변경 시 이 파일과 `PROJECT_CONTEXT.md` §4.9를 함께 갱신한다.*
