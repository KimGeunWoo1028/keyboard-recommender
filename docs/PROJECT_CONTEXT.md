# Keyboard Recommender — 프로젝트 전체 컨텍스트

> **용도:** 새 AI Agent 세션을 열 때 이 파일 전체를 붙여넣으면, 지금까지의 작업·구조·규칙을 한 번에 전달할 수 있습니다.  
> **경로:** `c:\Users\jeung\keyboard-recommender`  
> **최종 정리일:** 2026-07-12 (KST)  
> **언어:** 한국어 UI (로그인, 마이페이지, 설문, 추천 근거, 카탈로그 등)  
> **남은 일 Phase:** `docs/remaining-work-phases.md` — **A–F 구현 ✅** · B 표본 🔄 (배포 후) · **localhost 실행:** `docs/localhost-execution-roadmap.md` **Phase 0–2 ✅** (2026-07-12) · Phase 3–6 = 배포·표본·Unlock 후

---

## 1. 프로젝트 한 줄 요약

**커스텀 키보드(스위치·플레이트·폼·레이아웃·케이스·키캡) 추천 웹 서비스** 모노레포.  
사용자 설문 + 자연어 선호 → FastAPI 추천 엔진(6축) → Next.js 결과 UI. Swagkey 카탈로그·인벤토리 파이프라인 포함.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, next-themes, **lucide-react**, Vitest |
| **Backend** | FastAPI 0.115 · SQLAlchemy 2.0 · PostgreSQL 16 · Alembic · Pydantic Settings · Ruff · pytest |
| **E2E** | Playwright (TypeScript), Chromium |
| **Infra (로컬)** | Docker Compose (PostgreSQL만) |
| **CI** | GitHub Actions — 5개 병렬 job + catalog 1:1 coverage audit (warning) · **Python 3.12** · **Node 22** |
| **Python** | 3.11–3.13 (`>=3.11,<3.14`; CI는 3.12 고정) |

---

## 3. 모노레포 디렉터리 구조

```
keyboard-recommender/
├── README.md
├── .design-ref/stitch_keyboard_curator/  # Curator 설문 시안 (§4.12)
├── pytest.ini                    # 루트에서 pytest → backend/tests
├── docker-compose.yml            # Postgres 16만 (backend/frontend 컨테이너 없음)
├── run_all_swagkey_pipeline.cmd  # Swagkey 스위치 spec 8단계 파이프라인 (Windows)
├── run_swagkey_compat_pipeline.cmd  # plate/foam compat spec 4단계 (targets→extract→retry→enrich)
├── .env.example                  # backend/.env + frontend/.env.local 안내
├── docs/
│   ├── PROJECT_CONTEXT.md        # ← 이 파일
│   ├── remaining-work-phases.md       # 남은 일 Phase A–F · B 표본(배포 후) · Home revisit 🔒
│   ├── localhost-execution-roadmap.md # localhost 실행 Phase 0–6 (catalog·deploy·observe·Home)
│   ├── product-next-phases.md    # Home IA LOCK 이후 Next Phases (0–5) 마스터
│   ├── product-next-phase4-launch.md   # Phase 4 Launch·DoD·Observe
│   ├── product-next-phase5-home-revisit.md  # Phase 5 데이터 전제 · 제품 LOCK
│   ├── home-ia-locked.md         # Home = Landing · Workspace 삭제 · Revisit When
│   ├── home-ux-roadmap.md        # Home Phase 1–3 구현 이력 (신규 방향은 LOCK 우선)
│   ├── CHATGPT_FEEDBACK_BUNDLE.md  # ChatGPT·LLM 피드백 가이드 (프롬프트·결과 페이지 지도)
│   ├── results-ux-roadmap.md       # /results UX 마스터 로드맵 (Phase 0–7)
│   ├── results-ux-phase4-decision.md
│   ├── results-ux-phase5-qa-backlog.md
│   ├── results-ux-phase6-completion.md
│   ├── results-ux-phase7-validation-report.md
│   ├── evidence-tab-simplification-roadmap.md  # Evidence IA v1.4 (Phase 0–4)
│   ├── evidence-tab-phase4-validation.md       # Evidence Guardrails · E2E 검증
│   ├── stitch-design-migration.txt  # Stitch(KeebSmith) UI 마이그레이션 Phase 0–7
│   ├── swagkey-catalog-roadmap.txt  # Phase 1(①~⑨) + Phase 2(⑩~⑮) 로드맵
│   ├── swagkey-product-images-roadmap.md  # 제품 이미지 Phase 0–8 **완료**
│   ├── swagkey-catalog-1to1-roadmap.md    # 6탭 실 SKU 1:1 · browse/recommend 이중 풀 (Phase 0–8 ✅)
│   ├── swagkey-inventory-recheck.md # ⑮ inventory recheck / 품절·신규·imageUrl 알림
│   ├── staging-feedback-learning-mvp.md # ⑮ feedback flag 스테이징 검증
│   ├── recommendation-engine-unification-roadmap.txt
│   ├── recommendation-engine-unification-phase0-baseline.txt
│   ├── recommendation-engine-unification-phase1-complete.txt
│   ├── recommendation-engine-unification-phase2-complete.txt
│   ├── recommendation-engine-unification-phase3-complete.txt
│   ├── recommendation-engine-unification-phase4-complete.txt
│   ├── env-configuration.md
│   ├── production-https.md       # ⑮ production HTTPS 체크리스트
│   └── quality-testing.md
├── .cursor/                      # gitignore — Agent 규칙·스킬 (로컬)
│   ├── rules/swagkey-catalog-1to1.mdc  # 1:1 카탈로그 LOCK (always-applied)
│   └── skills/git-sync/SKILL.md
├── .github/workflows/
│   ├── ci.yml                    # PR/push 5-job gate
│   ├── e2e.yml                   # schedule + path-filtered PR + workflow_dispatch
│   ├── swagkey-inventory-recheck.yml # 주간 fixture recheck + optional webhook
│   └── swagkey-inventory-recheck-live.yml # 월간 live pipeline + failure notify
├── backend/                      # FastAPI + 추천 엔진 + 카탈로그
│   ├── Makefile                  # Unix/WSL: test · validate · inventory-recheck 등
│   ├── alembic.ini
│   ├── .env.example
│   ├── README.md
│   ├── data/
│   │   ├── avatars/              # 업로드 프로필 사진 (gitignore · /media/avatars)
│   │   ├── catalog_ingestion_manifest.json (+ .template.json)
│   │   ├── swagkey_inventory/    # 크롤 CSV·정제 JSON·diff·alert·image·1:1 artifacts (§9.2–9.4)
│   │   ├── swagkey_images/       # mirror 썸네일 바이너리 (.gitignore · §9.4)
│   │   └── swagkey_html_cache/   # spec scrape HTML (~64)
│   └── scripts/                  # 52개 CLI — clean / classify / 1:1 audit / ops verify 포함
├── frontend/                     # Next.js 웹앱
│   ├── .env.example
│   ├── next.config.ts            # image remotePatterns · `/api`·`/media` dev proxy
│   ├── scripts/                  # Alice/Split diagram 튜닝·results 탭 추출 dev tools (*.mjs)
│   └── README.md
├── e2e/                          # Playwright E2E
│   └── README.md
```

---

## 4. 지금까지 구현된 기능 (작업 이력 요약)

### 4.1 핵심 제품 기능

> **추천 엔진 정책 (2026-07-09, Phase 1~4):** 모든 사용자 추천은 **FULL** 엔진을 사용한다. full compute 실패 시에만 **resilient degraded** 경로로 결과를 반환하며, 이는 «빠른 추천»이 아니라 **가용성 fallback**이다. 응답 `runMode: "quick"`는 contract rev 7 호환용 내부 표기일 뿐 사용자-facing quick mode가 아니다.

- [x] **5단계 선호 설문** (`/recommend`) — 사운드, 타이핑 압력, 스위치 감각, 바텀아웃, 볼륨 · **Stitch Curator UI** (2026-07-09, §4.12)
- [x] **자연어(NL) 선호 입력** — "thocky linear quiet" 등 → 서버 측 trait 벡터 반영
- [x] **추천 계산 API** — `POST /api/v1/recommendations/compute` → **6축** (스위치/플레이트/폼/레이아웃/케이스/키캡) + 순위 + 신뢰도 + 설명 + `sourceUrl`
- [x] **결과 페이지** (`/results`) — **Results UX Phase 0–7 (§4.13)** + **Evidence IA Phase 0–4 (§4.14)** + **§4.15 polish** + **§4.16 product-next 갭 수정**  
  · 탭: **추천 요약** · **추천 근거** 2개 (`save_compare`·`최근 활동` 탭 제거 — Continue는 `/mypage?section=saved`)  
  · **공통 신뢰 레이어** (Hero → 탭 사이): Confidence Story · 고정 6축 미니 · highlights ≤2  
  · Overview: 6축 First View · CTA(**저장**) · 대안 · «저장한 빌드 보기» 링크  
  · Evidence: pick 설득(why · ranking why concrete · tradeoff 조건부) · MetricGuide·18축 `<details>` 접힘  
  · **Compare Drawer 제거** (재도입 금지) · stale sessionStorage 재조회 (`responseContractRev: 7`)  
  · `degradedReason` 시 «안정 모드로 추천했어요» 배너
- [x] **홈 Landing** (`/`) — Hero + FeatureGrid · `WorkshopStrip` 삭제 · `home.viewed` 관측 (§4.16) · Dashboard/Redirect **LOCK**
- [x] **커뮤니티 용어 해석** — `POST /api/v1/terminology/interpret` + 프론트 `keyboard-terminology/` 모듈
- ~~커뮤니티 디스커버리~~ — **`GET /api/v1/builds/discovery` 제거** (WorkshopStrip/TrendingBuilds teardown · Phase 0)
- [x] **스타일 프리셋** — 설문 시작 시 «부드럽고 조용한 성향» 등 3종; `seedAnswers`로 답변 시드 후 **첫 미응답 단계**로 진입 (Phase 3)
- [x] **«빠른 추천»(mode=quick) UI 제거** (Phase 1) — 프리셋은 설문 시드만, compute 생략 없음

### 4.2 인증 & 계정

- [x] 회원가입 (이메일 인증 코드 필수)
- [x] 로그인 / 로그아웃 / 전체 세션 로그아웃
- [x] 비밀번호 재설정 (이메일 → 토큰 → 확인)
- [x] 표시 이름 변경 + 중복 확인
- [x] 비밀번호 변경, 보안 요약
- [x] **쿠키 기반 세션** (`kr_session`) — API origin에 설정, `credentials: "include"`
- [x] **프로필 아바타** — `POST/DELETE /api/v1/auth/avatar` · `users.avatar_url` · `data/avatars/` → `/media/avatars` (007)
- [x] DB 마이그레이션: users, auth_sessions, email_verifications, password_resets, avatar_url (004–007)

### 4.3 마이페이지

- [x] `/mypage` — **개요 · 저장한 빌드 · 계정** 3탭 (활동/비교 탭 제거 · Continue는 `?section=saved`)
- [x] 북마크 저장/목록/삭제 · master–detail · «추천 결과 다시 보기» (API + 게스트 localStorage 폴백)
- [x] **활동 API** (`GET /activity`) — Results 탭은 제거됐으나 backend·`saved-recommendations.ts` merge용 **유지**
- [x] 개요: 취향 6축 스냅샷 · 저장 허브 · 아바타
- [x] 계정: 프로필 사진·닉네임·비밀번호·세션 로그아웃
- [x] Vitest smoke (hub/overview/saved/build-stack) · E2E critical-flows mypage
- [x] `?section=activity` → `saved` 리다이렉트 (레거시 딥링크)
- ~~비교 워크스페이스 / 활동 타임라인 탭~~ — **제거** (복원 금지 · product-next Phase 3)

### 4.4 추천 엔진 (Backend)

- [x] **Trait Engine** — 가중 코사인 매칭, survey → trait vector
- [x] **Build Selection** — 6축(switch·plate·foam·layout·case·keycap), 호환성 규칙, 다양성 rerank, fallback 복구
- [x] **Explainable output** — confidence, pick explanations, quality diagnostics
- [x] **Compatibility matrix** — plate-layout · case-layout · keycap-layout 하드/소프트 규칙
- [x] **Resilient degraded fallback** (Phase 2) — full compute 예외 시 `_resilient_degraded_flags()` / `resilient_degraded_v1`; 요청 `mode=quick` → 422
- [x] **Feedback Learning MVP** (feature flag) — 규칙 기반 가중치 조정 · 스테이징 dry-run 스크립트
- [x] **Operational automation** — drift 임계값 → 런타임 플래그 자동 조정
- [x] **Scaling profiles** — `low|medium|high|custom` (캐시 TTL, 배치 크기 등)

### 4.5 평가·드리프트·디버그 (Backend)

- [x] Evaluation snapshots, metrics, diagnostics, benchmarking
- [x] Unified event pipeline (`eval_events`) — 북마크, 클릭, 온보딩 등
- [x] Drift detection + rollback controller
- [x] **Internal Debug API** (`/api/v1/debug/*`) — inspect, compare, drift, analytics KPIs
- [x] CLI debug tools — replay, trace, compare, inspect snapshot
- [x] Production에서 debug API 차단 middleware

### 4.6 카탈로그 & 데이터 파이프라인

- [x] L/M/H tier → 0/0.5/1.0 numeric trait score 정규화
- [x] `swagkey_products.seed.json` — **추천 엔진용** 주 카탈로그 시드 (스위치·플레이트·폼·레이아웃·케이스·키캡)
- [x] Swagkey HTML 스크래핑 파이프라인 (스위치 spec + plate/foam 호환)
- [x] ~64개 HTML 캐시 (`backend/data/swagkey_html_cache/`)
- [x] Catalog ingestion pipeline (detect → extract → normalize → validate → diff → ingest)
- [x] Alembic 마이그레이션 001–007 (카탈로그 + eval + auth + avatar)
- [x] **Swagkey 크롤 인벤토리 파이프라인 ①~⑨** (2026-07-06) — 아래 §9 참고
- [x] **Phase 2 ⑩~⑮** (2026-07-08) — 추천↔쇼핑 링크 · 품질 cleanup · case/keycap 축 · 카탈로그 UX · 운영·품질 — §4.10
- [x] **카탈로그 브라우징 UI** (`/catalog`) — **탭 6개**: 스위치 · 플레이트 · 폼 · **레이아웃** · 케이스/키트 · 키캡 (§4.15)
  · 검색·페이지네이션(`01` 형식 숫자)·상세 패널(traits/metadata/스웨그키 링크) · **4:3 썸네일** (`imageUrl` · placeholder · onError)
  · 개수 표시와 검색창 동일 행
  · 액세서리·데스크패드·게이밍·굿즈·기타 **UI 미노출** (`swagkey_catalog_full.json`은 ops/인벤토리 전용 유지)
- [x] **스웨그키 sourceUrl 보정** — shop_view/?idx= canonical · seed + API 런타임 정규화
- [x] **운영 ⑮** — inventory recheck→품절/신규 알림 · E2E schedule · feedback/HTTPS 검증 스크립트
- [x] **Phase F Ops 자동화** — live 월간 pipeline · catalog alert webhook · Feedback dry-run (`remaining-work-phases.md`)
- [x] **제품 이미지 파이프라인** (2026-07-10~11) — `docs/swagkey-product-images-roadmap.md` **Phase 0–8 완료**
  · **0–4:** `og:image` 추출 → `swagkey_product_images.json` (**392** unique) → inventory **v3** 287/293 → seed `imageUrl` **315/329** (raw) · browse **listable** **100%** (`audit_browse_image_coverage.py`)
  · **5–6:** API `imageUrl` · FE `catalog-part-thumbnail` · `cdn.imweb.me` remotePatterns
  · **6.5–6.6:** browse 정책 (`catalog_browse_policy.py`) — idx dedup · HTTP 404 **12 idx** 제외 · `browse.listed` · 레이아웃 archetype sanitize · fuzzy 이미지 merge 금지
  · **7:** 로컬 mirror `data/swagkey_images/{idx}.{ext}` · `/media/swagkey-images` · `download_swagkey_images.py` · 정책 `backend/docs/swagkey-image-storage-policy.md`
  · **8:** recheck `--check-image-urls` · `imageUrlChanged` alert (schema **1.1.0**) · `swagkey_image_url_recheck.py`
  · (선택) recommendation **picks** `imageUrl` · Overview 6축 썸네일 — **✅** (2026-07-11)
  · (선택 미착수) E2E 썸네일 스냅샷

- [x] **Swagkey 6탭 카탈로그 1:1** (2026-07-11~12) — `docs/swagkey-catalog-1to1-roadmap.md` **Phase 0–8 ✅** · browse/recommend **이중 풀** · §4.10
- [x] **레이아웃 다이어그램 (Blueprint)** (2026-07-10~12) — 정적 SVG → React `LayoutDiagram` 7종 · role 강조 · Alice 회전 튜닝 · Split 60 잭/케이블 · `layout-007` 참조 전용 정책 — §4.10

**현재 이중 풀 규모 (2026-07-12, `audit_recommendation_pool.py`):**

| family | browse (`/catalog`) | recommend (`/results`) | 비고 |
|--------|---------------------|------------------------|------|
| switch | 66 | 54 | Phase 0 단종·중복 정리 후 |
| plate | 20 | 14 | |
| foam | 10 | 8 | |
| layout | 30 | 7 | browse = archetype **7** + listed 실 PCB **23** · seed **45** (`browse.listed: false` 15) · recommend = archetype only |
| case | 126 | 49 | |
| keycap | 62 | 18 | UI 기본 필터 Full/Base **52** · `subtype=all` **62** |

**layout seed 구조 (45 rows):** archetype **7** + listed 실 PCB **23** + `browse.listed: false` mislinked **15** (`layout-new-*` · Phase 1) → API/UI browse **30**

- **seed ingestion:** `swagkey_products.seed.json` — **329** rows (`run_swagkey_catalog_regression.py`)
- **게이트:** `catalog_sample.is_recommendation_eligible_row` · `promote_to_recommendation_pool.py` (dry-run 기본)
- **게이트 후 recommend 풀:** **150** (`audit_recommendation_pool.py` · `gatePassed: true`)
- **blocking alerts:** **0** · informational **34** (`catalog_change_alert.txt` · Phase 0 triage 후)
- **검증:** `run_swagkey_catalog_regression.py` — **127** pytest passed · **1** skipped · ingestion warnings **24** (2026-07-12)

**이미지 (2026-07-10~12):** `audit_browse_image_coverage.py` = browse **정책 listable** 행 기준 **100%** (family별 · raw seed 건수와 다를 수 있음) · local mirror `data/swagkey_images/` (gitignore)

**Full catalog JSON (ops 전용, UI 미노출):** `swagkey_catalog_full.json` **153**건 — API `GET /catalog/full` 유지 · 프론트 browse는 seed **6탭**만

**inventory vs browse gap (coverage warning CI):** layout **0%** ✅ · switch **+2** · keycap **+5** (문서화 예외 — `phase1_coverage_exceptions.txt` · live recrawl 전) — `audit_catalog_1to1_coverage.py --check-threshold --warn-only`. **browse 건수 3종:** (1) seed browse pool (`audit_recommendation_pool.py`) (2) 정책 listable (`catalog_browse_policy.py` · 404/dedup · `browse.listed`) (3) image audit listable (`audit_browse_image_coverage.py`) — family별로 다를 수 있음

### 4.7 Frontend 부가 기능

- [x] **카탈로그 브라우징** (`/catalog`) — **6탭**(스위치·플레이트·폼·레이아웃·케이스/키트·키캡) · 카드 정렬/줄바꿈 UX · 페이지 전환 시 상단 스크롤
- [x] **홈 Feature Grid** — 동일 **6카테고리** 카드 → 카탈로그 deep link (`xl:grid-cols-6`)
- [x] 다크/라이트/시스템 테마 (`next-themes`, **기본 다크**)
- [x] Internal Debug UI (`/debug/*`) — `NEXT_PUBLIC_INTERNAL_DEBUG=1` 게이트
- [x] A/B 실험 할당 (`experiments.ts`) → 이벤트에 첨부
- [x] API 미연결 시 **client lite fallback** — `recommendation-engine/` + `results-lite-compare.tsx` (서버 ranked 경로와 별도; Compare Drawer 아님)
- [x] Mixed content 경고 (`RuntimeApiGuards` — HTTPS 페이지 + HTTP API)

### 4.11 Stitch(KeebSmith) UI 마이그레이션 (2026-07-08~09)

> 상세 체크리스트: `docs/stitch-design-migration.txt`  
> 원칙: **기능·API·설문·compute·sessionStorage·responseContractRev 변경 없음** — 스타일·마크업만.

| Phase | 상태 | 내용 |
|-------|------|------|
| 0 | **완료** | Cyber-Artisan 토큰 (`ca-*`) · `globals.css` · `tailwind.config.ts` · Hanken Grotesk / Inter / JetBrains Mono |
| 1 | **완료** | `SiteHeader` · `SiteFooter` · `HeaderCatalogSearch` · `AuthControls` · `ThemeToggle` |
| 2 | **완료 → 후속 teardown** | 홈 Hero · FeatureGrid · ~~WorkshopStrip~~ · ~~TrendingBuilds~~ — **§4.16 Phase 0에서 WorkshopStrip 삭제** · Landing만 |
| 3 | **완료** | `/results` — Stitch glass 톤 · **후속 Results UX §4.13–4.15** (Compare Drawer는 이후 제거) |
| 4 | **완료** | `/mypage` — hub/overview/saved/account (activity·comparisons 제거) |
| 5 | **완료 → 제거** | 비교 워크스페이스 (`#comparison-hub`) — **Compare UI 제거됨** (재도입 금지) |
| 6 | **완료** | `/catalog` · `/recommend`(SurveyWizard) · `/auth*` — 동일 쉘·토큰 톤만 · **설문은 2026-07-09 Curator 전용 레이아웃으로 후속 개편** (§4.12) |
| 7 | **도입 후 제거** | Workshop 좌측 rail / 모바일 BottomNav — **2026-07-09 사용자 요청으로 삭제** (`workshop-nav.tsx` 제거) |

**디자인 시스템 (테마):**

| 모드 | 토큰 소스 | 비고 |
|------|-----------|------|
| **다크 (기본)** | Stitch `cyber_artisan/DESIGN.md` | 글래스·glow·네온 톤 |
| **라이트** | `Downloads/DESIGN.md` (Luminous Artisan) | `:root` — Electric Violet `#7C3AED` · Mint · Rose(tertiary) · ambient shadow (glow 없음) |

**UI 정리 (2026-07-09, 마이그레이션 후속):**

- 홈 Hero CTA: **«추천 설문 시작»** (로그인 시 `/recommend`, 게스트 `/auth?next=/recommend`)
- 홈: **Landing** — Hero + FeatureGrid + (얇은) Workshop Preview · `WorkshopStrip` **삭제** (§4.16)
- 헤더: 로고(`font-headline`) + 네비·검색(`font-body`) · 우측 **검색 → 테마 → 닉네임 → 로그인/로그아웃** (§4.15) · 밑줄은 `::after`로 글자 밖 배치
- 마이페이지: 탭 ↔ `?section=` 딥링크 (`overview` | `saved` | `account` · `activity`→`saved`)
- 카탈로그 상세 패널 «닫기» 버튼: `shrink-0 whitespace-nowrap`
- 에러 경계: `app/error.tsx` (세그먼트) · `app/global-error.tsx` (루트, 인라인 스타일 최소)
- **미포함(의도):** Acoustic/$/Credits/알림 아이콘 · Stitch 가짜 메트릭 · 전역 Workshop 사이드바

**Dev 주의 (Next.js 15):** `React Client Manifest` / `global-error` 오류 시 → `next dev` 완전 종료 · `frontend\.next` 삭제 · 재시작 · 브라우저 하드 리프레시

### 4.12 설문 Curator UI 리디자인 (2026-07-09)

> **참고 시안:** `.design-ref/stitch_keyboard_curator/` (`stitch_keyboard_curator` zip · `code.html` + `DESIGN.md`)  
> **원칙:** 설문 로직·API·이벤트·E2E `data-testid`·FULL compute 경로 **변경 없음** — 레이아웃·타이포·아이콘만.

**레이아웃·UX**

- [x] **뷰포트 고정** — `/recommend` `PageShell` 높이 `calc(100dvh - 4.25rem)`, `overflow: hidden` (한 화면 내 스크롤 최소화)
- [x] **가로·세로 채움** — `.survey-curator-shell` `max-width` 제한 해제 · `PageShell` `max-w-ca` · 옵션 카드 `flex-1` / `auto-rows-fr`로 영역 분할
- [x] **입구(Step 01)** — 스타일 프리셋 3카드 (세로·가로 균등) · Lucide 아이콘 · 카드 맞춤 타이포
- [x] **질문 단계** — 세그먼트 진행바 (`3 / 5 단계`) + 우측 `약 1분` · 질문·카드·NL·하단 네비 flex column
- [x] **프리셋 배너** — 2줄: «스타일 프리셋에서 이미 선택됨» / 선택값(괄호 영문 제외, 예: `구분감이 은은함`)
- [x] **NL 입력** — «추가 취향 입력 (선택)» **항상 표시** (토글 숨김 없음) · textarea `flex-1`
- [x] **하단 네비** — `[이전] [스타일 선택으로 pill] [처음부터 다시 pill] [다음|결과 보기]` · 중앙 pill은 `.survey-nav-secondary`
- [x] **옵션 카드** — 3옵션 `flex-row`+`flex-1` · 4/5옵션 responsive grid · 선택 시 `.survey-option-card--selected` glow

**아이콘 ([Lucide](https://lucide.dev/icons/), `lucide-react`)**

| 구분 | ID | 아이콘 |
|------|-----|--------|
| 입구 프리셋 | `creamy_quiet` | `Moon` |
| | `crisp_expressive` | `Zap` |
| | `balanced` | `Scale` |
| 설문 옵션 | `thocky` / `clacky` / `muted` / `balanced` / `bright` | `AudioWaveform` / `Zap` / `VolumeOff` / `Scale` / `Sparkles` |
| | `light` / `medium` / `heavy` | `Feather` / `Gauge` / `Weight` |
| | `tactile_clear` / `tactile_light` / `linear` | `Mountain` / `TrendingUp` / `ArrowRight` |
| | `soft` / `firm` | `Cloud` / `Box` |
| | `quiet` / `moderate` / `loud` | `VolumeX` / `Volume1` / `Volume2` |

**유지·회귀 금지**

- 프리셋 `seedAnswers` → `firstUnansweredStepIndex` 스킵 (Phase 3)
- 온보딩/KPI 이벤트 (`onboarding.prefilled_step_skipped` 등)
- E2E: `e2e-survey-wizard`, `e2e-prefilled-step-banner`, `e2e-nl-preference`, `e2e-submit-survey` · 버튼 «다음»/«이전»/«결과 보기» 정확 매칭
- «빠른 추천» UI·`mode=quick` 요청 재도입 금지

**주요 파일**

| 파일 | 역할 |
|------|------|
| `frontend/src/app/recommend/page.tsx` | 뷰포트 높이·`max-w-ca` PageShell |
| `frontend/src/components/features/recommendation/survey-wizard.tsx` | 입구·질문·제출 로직·Curator 레이아웃 |
| `survey-question.tsx` | 질문 제목·옵션 카드 그리드/flex |
| `survey-segmented-progress.tsx` | 단계 진행 + `timeEstimate` |
| `survey-option-icon.tsx` | `SurveyOptionIcon` · `SurveyOnboardingStyleIcon` |
| `frontend/src/app/globals.css` | `.survey-curator-shell`, `.survey-option-card--selected`, `.survey-curator-nav-next`, `.survey-nav-secondary`, `.survey-prefilled-banner` |
| `e2e/tests/helpers/survey-flow.ts` | 프리셋 경로·progressbar 대기 |

**검증 (2026-07-09):** Vitest survey 6 passed · `npm run build` 성공

### 4.13 Results UX 마이그레이션 (2026-07-09, Phase 0–7 **완료**)

> **마스터 로드맵:** `docs/results-ux-roadmap.md` (v6.2)  
> **원칙:** 엔진·contract·sessionStorage 변경 없음 · `data-testid` 유지 · Product Decision은 Phase 4만

| Phase | 상태 | 내용 |
|-------|------|------|
| 0 | **완료** | `recommendation-result-view.tsx` → `results/*` 컴포넌트 분리 (UI 동일) |
| 1 | **완료** | Overview 재정렬 — 6축 First View · ENGINE OUTPUT·MatchGauge 제거 |
| 2 | **완료** | CTA(저장·비교·스웨그키) + `compare-drawer.tsx` · `interaction.drawer_open` |
| 3 | **완료** | Evidence 3단 · `lib/keyboard-terminology/` (24축 QA 테스트) |
| 4 | **완료** | IA: `save_compare` 탭 **Remove** · activity 탭 **Keep** (당시) — `results-ux-phase4-decision.md` · **후속 §4.15에서 activity 탭 제거** |
| 5 | **완료** | 모바일 — Hero 압축 · 6축 1열 · CTA full-width · Drawer bottom sheet · 빠른 이동 카드 제거 |
| 6 | **완료** | UI polish — 접이식 칩 · tab snap/fade · focus trap · 품질 요약 모바일 접기 · ca-* 토큰 |
| 7 | **완료** | Validation 리포트 1회 · Iteration Top 3 · E2E green — `results-ux-phase7-validation-report.md` |

**현재 `/results` IA (2026-07-10, §4.15 반영)**

| 계층 | 역할 |
|------|------|
| Hero | 빌드 제목 · MatchGauge · trait 배지 |
| **공통 신뢰 레이어** (§4.14) | Confidence Story · 6축 미니 · highlights — 탭 위 고정 |
| 추천 요약 | 6축 · 저장 CTA · 대안 · **마이페이지 저장 링크** (`/mypage?section=saved`) |
| 추천 근거 | pick 설득 · MetricGuide·18축 접힘 (`e2e-pick-explanations`) |

**탭 바:** `h-10` · `text-base` · `px-5` pill (§4.15)

**주요 컴포넌트 (`frontend/src/components/features/recommendation/results/`)**

| 파일 | 역할 |
|------|------|
| `recommendation-result-view.tsx` | 오케스트레이터 |
| `shared-result-header.tsx` | Hero · PRIMARY BUILD |
| `results-trust-layer.tsx` | 공통 신뢰 레이어 (`e2e-trust-layer`) |
| `results-confidence-story.tsx` | Confidence Story (`e2e-confidence-story`) |
| `results-trait-mini-profile.tsx` | 고정 6축 미니 (`e2e-trait-mini-profile`) |
| `results-build-highlights.tsx` | highlights ≤2 (`e2e-build-highlights`) |
| `results-overview-tab.tsx` | 6축 · CTA · 대안 |
| `results-evidence-tab.tsx` | Evidence pick·profile·context |
| `results-evidence-pick-card.tsx` | pick why · ranking why · tradeoff |
| `results-evidence-ranking-why-content.ts` | ranking gap 로직 · 카피 |
| `results-ranking-thresholds.ts` | gap threshold (LOCKED 0.04) |
| `results-trait-display.ts` | 14축 → 6축 매핑 (LOCKED) |
| `results-text-utils.ts` | `formatEvidenceWhyLine` · `formatEvidenceTradeoff` |
| `results-tab-shell.tsx` | Backend/Lite 탭 바 (`overview` \| `evidence` 2탭) |
| `results-lite-compare.tsx` | **API 미연결 lite fallback** — client engine 비교 카드 (`LiteResultTabBar` 경로) |
| ~~`compare-drawer.tsx`~~ | **제거됨** — Compare Drawer 재도입 금지 (lite fallback과 별개) |
| ~~`comparison-hub.tsx`~~ | **제거·미사용** |
| `results-quality-status.tsx` | 품질 상태 derive (`deriveQualityStatus`) — Trust Layer·Confidence Story에서 재사용 · **독립 UI 카드 미노출** (`e2e-quality-status` count 0) |

**이벤트 (`scenario_id: results_ux_v1`)**

- `interaction.results_tab_click` — 탭 전환
- (`interaction.drawer_open` — Compare 제거로 **현재 UI에서 미사용**)

**E2E (`data-testid` 유지)**

- `e2e-trust-layer` · `e2e-confidence-story` · `e2e-trait-mini-profile`
- `e2e-server-ranked` · `e2e-save-build`
- ~~`e2e-open-compare` · `e2e-compare-panel`~~ (Compare 제거 — E2E에도 없음)
- `e2e-pick-explanations` · `e2e-pick-ranking-why` · `e2e-results-tab-bar`
- `critical-flows.spec.ts` · `recommendation-survey.spec.ts` · `results-evidence-phase4.spec.ts`

**검증 (2026-07-10):** Vitest recommendation/features **80+** · Evidence Phase 4 — `evidence-tab-phase4-validation.md` · product-next Phase 2 ranking-why 재연결

**Iteration Top 3 (갱신 · remaining-work A–F · 2026-07-10)**

1. ~~activity 탭 → Overview accordion~~ → **§4.15 완료** (마이페이지 Continue)
2. **재방문 / Home 진입 집계** — 배선·Observe 인프라 ✅ · **실제 표본만 🔄** (`unlock_ready` 전 Home UI 금지 · §4.16 Phase 5)
3. ~~bookmark·퍼널 analytics~~ → **Phase C ✅** · ~~drawer_open~~ Compare 폐기
4. ~~375px Playwright 스크린샷~~ → **Phase D ✅** (`npm run test:visual`)

### 4.14 Evidence Tab Simplification (2026-07-10, Phase 0–4 **완료**)

> **마스터 로드맵:** `docs/evidence-tab-simplification-roadmap.md` (v1.4)  
> **검증 리포트:** `docs/evidence-tab-phase4-validation.md`  
> **원칙:** 3계층 IA — Hero → **공통 신뢰 레이어** → Overview | Evidence · 엔진 변경 없음

| Phase | 상태 | 내용 |
|-------|------|------|
| 0 | **완료** | Evidence 서브모듈 분리 · `results-trait-display.ts` · `results-ranking-thresholds.ts` |
| 1 | **완료** | Trust Layer (Story · 6축 미니 · highlights) · Evidence infra 접힘 |
| 2 | **완료** | Pick 카드 IA — why · ranking shell · 조건부 tradeoff · 대안 이름+링크 |
| 3-1 | **완료** | 카피 파이프라인 · Story tier 테스트 · Overview 중복 제거 |
| 3-2 | **완료** | Ranking why (switch MVP) · gap ≥ 0.04 → pick 카드 concrete bullets · fallback UI 숨김 · `NEXT_PUBLIC_EVIDENCE_RANKING_WHY` opt-out |
| 4 | **완료** | 문서 · E2E · Guardrails 체크리스트 |

**Product Decision (LOCKED)**

| 항목 | v1.4 |
|------|------|
| 공통 레이어 | 블록 ≤3 · Hero 아래 탭 위 · 정교화 링크만 |
| 6축 미니 | noise · tactility · bounce · heft · flexibility · clarity (14 v2 축 매핑) |
| ranking why | switch only · gap ≥ 0.04 → ≤2 bullet · else fallback |
| tradeoff | `tradeOffs` 있을 때만 (억지 «주의점 없음» 금지) |
| Evidence pick | always: why 1줄 · details: whyTraits · explanation |

**롤백:** `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0` · Failure Signals 4–6주 관측 (로드맵 §Success Metrics)

### 4.15 Results·Catalog·Header UX Polish (2026-07-10)

> **범위:** `/results` IA 정리 · 타이포 통일 · 헤더 인증 UX · `/catalog` 6탭·페이지네이션·검색 레이아웃  
> **원칙:** API·엔진·`data-testid` 변경 최소 · 마이페이지가 활동 기록의 단일 진입점

**Results (`/results`)**

- [x] **「최근 활동」 탭 제거** — `BackendResultTabId` → `"overview" | "evidence"` · `results-activity-tab.tsx` 삭제 · activity API fetch 제거
- [x] **Overview** — 저장 CTA 아래 «마이페이지에서 저장한 빌드 보기» → `/mypage?section=saved`
- [x] **탭 버튼 크기** — `results-tab-shell.tsx`: `h-10` · `text-base` · `px-5` · `gap-2.5`

**타이포 (`font-label`)**

- [x] **`font-label` 추가** — `tailwind.config.ts` (Hanken Grotesk = `--font-headline`) · `.ca-label` / `.ca-chip` / `.ca-text-label-sm` in `globals.css`
- [x] UI 섹션 라벨·eyebrow·chip: `font-mono` → **`font-label`** (숫자·디버그용 `font-mono` 유지)

**헤더 (`site-header.tsx`)**

- [x] **`AuthHeaderProvider`** — 세션 상태 공유 · `AuthNickname` + `AuthSessionAction` 분리
- [x] **우측 순서:** 검색 → 테마 → 닉네임 → 로그인/로그아웃
- [x] **로그인** — auth 확인 전에도 즉시 표시 (`opacity-80`만, invisible placeholder 없음)
- [x] **테마 토글** — mount 전 Moon 아이콘 표시 (빈 버튼 방지)
- [x] 닉네임 `font-body` · 로그인/로그아웃 `font-headline`

**카탈로그 (`/catalog`)**

- [x] **6번째 탭 «레이아웃»** — `GET /api/v1/layouts` · browse **30건** (archetype 7 + 실 PCB 23 · Phase 1 `browse.listed`) · `?family=layout` · 홈 FeatureGrid·Overview «레이아웃 카탈로그» 링크
- [x] **카테고리 탭 타이포** — family pill `font-headline text-sm font-semibold` · subtype `font-body`
- [x] **페이지네이션** — `catalog-pagination.tsx`: `01` `02` `03` 숫자만 · 활성=밝음/비활성=muted · 5페이지 초과 시 ellipsis · chevron·슬라이딩 라인 없음 · `buildPaginationItems()` + Vitest
- [x] **페이지 전환 스크롤** — `catalogTopRef` + `scroll-mt-24` · 클릭 즉시 `window.scrollTo(0,0)` + `scrollIntoView`
- [x] **검색 레이아웃** — «이름·ID 검색»을 **「총 N개 · 1–24 표시」** 와 동일 행 (좌 개수 · 우 검색 · 모바일 세로 스택)

**주요 파일**

| 파일 | 변경 |
|------|------|
| `results/results-types.ts` | 탭 ID 2개 |
| `recommendation-result-view.tsx` | activity 탭·fetch 제거 |
| `results-overview-tab.tsx` | 마이페이지 저장 링크 (`/mypage?section=saved`) |
| `results-tab-shell.tsx` | 탭 pill 크기 |
| `layout/auth-controls.tsx` | Provider·Nickname·SessionAction |
| `layout/site-header.tsx` | 헤더 우측 순서 |
| `layout/theme-toggle.tsx` | mount 전 Moon |
| `catalog/catalog-browse-view.tsx` | 6탭·레이아웃 섹션·keycap 필터·검색·페이지네이션 |
| `catalog/catalog-pagination.tsx` | 숫자 페이지네이션 |
| `catalog/catalog-pagination.test.ts` | `buildPaginationItems` |
| `api/v1/layouts.py` | layout browse API |
| `lib/api/catalog.ts` | `CatalogFamily` + `layout` endpoint |

**검증:** Vitest **87+** passed · `npm run build` 성공 (세션 기준)

### 4.16 Product Next Phases — Home IA LOCK 이후 (2026-07-10)

> **마스터:** `docs/product-next-phases.md` (v1.6)  
> **Home 원칙:** `docs/home-ia-locked.md` — Home = Landing · Workspace 삭제 · Dashboard 보류 · Why 동봉  
> **순서:** 0 teardown → 1 Results → 2 Evidence(유지) → 3 MyPage → 4 Launch·Data → 5 Home revisit(조건부)

| Phase | 상태 | 내용 |
|-------|------|------|
| **0** Home teardown | ✅ | `WorkshopStrip` 제거 · `workshop-strip.tsx` 삭제 · Hero(**`HomeWorkshopPreview` 장식 포함**) → FeatureGrid → Footer |
| **1** Results | ✅ | 로드맵 vs 코드 감사 · 추가 구현 Task 없음 · Compare 미복원 |
| **2** Evidence | ✅ | 유지/갭만 · ranking-why **concrete**를 pick 카드에 재연결 · fallback UI 숨김 · `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0` |
| **3** MyPage | ✅ | 개요·저장·계정 스모크 · `MyPageComingSoon` 삭제 · Vitest + E2E hub |
| **4** Launch·Data | ✅ | DoD 확인 · Observe 목록 갱신 · Compare 이벤트 UI 비활성 명시 · `docs/product-next-phase4-launch.md` |
| **5** Home revisit | ⚠️ 부분 | 데이터 배선 ✅ · Observe 인프라 ✅ (remaining-work **B**) · **표본 🔄** · Redirect/Dashboard/dual Hero **🔒 LOCK** |

**Phase 5 상세**

- [x] `home.viewed` — unified event 스키마 + `emitHomeViewedEventBestEffort` · `HomeLandingObserve` (세션당 1 · guest/auth)
- [x] Home Landing IA 유지 (Dashboard/Workspace 없음)
- [x] Observe 집계 인프라 — `recommendation_quality/evaluation/unified_pipeline/observe_aggregate.py` · `scripts/report_observe_aggregates.py` · Unlock 기준(14일/50) 문서화 (`remaining-work-phases.md` Phase B)
- [ ] 실제 재방문 / Home 진입 **표본** (관측 기간 · persistence on · `unlock_ready`)
- 🔒 제품 백로그 (표본 후만): Login redirect · Login Home 개인화 · Dashboard (**Why 반박 필수**)

**Observe (활성 · 2026-07-10)**

| event | 용도 |
|-------|------|
| `home.viewed` | Home Landing 진입 (`home_landing_v1`) |
| `interaction.bookmark` | 저장 CTA |
| `interaction.results_tab_click` | Evidence 체류 proxy |
| `interaction.click` / `revisit` / `repeated_view` | Results 진입·재방문 |
| `interaction.refinement` · `kpi.time_to_first_result` · `onboarding.*` | 퍼널·정교화 |
| ~~`drawer_open` / `comparison`~~ | Compare 제거 · UI 미사용 |

**Do not (전 Phase 공통)**

- Home Dashboard / Workspace 부활 · Login redirect A/B · Preview 대시보드화 · 가짜 Match % · Compare 복원

**검증 (2026-07-10):** Vitest features **81** · pytest unified events **10** · Home Landing gate · Phase 4/5 리포트

**관련 문서:** `product-next-phases.md` · `product-next-phase4-launch.md` · `product-next-phase5-home-revisit.md` · `home-ia-locked.md`

### 4.8 테스트 & CI

- [x] Backend: **77** `test_*.py` 모듈 + regression/snapshot/contract/benchmark 버킷 (catalog browse, keycaps, **swagkey/ops**)
- [x] Backend catalog regression: `run_swagkey_catalog_regression.py` — ingestion + **20개 pytest 타깃** (subset) · **127** passed · 1 skipped (2026-07-12)
- [x] Frontend: Vitest **31** 파일 (catalog contract 등) · 딥링크 `?family=` 형식
- [x] E2E: Playwright — `e2e.yml` **주간 schedule + path-filtered PR + workflow_dispatch** (수동 전용 해제)
- [x] CI 5-pillar: regression / contract / unit / frontend / e2e
- [x] Deterministic regression (`random.seed(20260505)`)
- [x] Inventory recheck workflow — fixture 주간 (`swagkey-inventory-recheck.yml`) · live 월간 (`swagkey-inventory-recheck-live.yml`) · optional webhook secret

### 4.9 아직 스텁/미구현 · 잔여 관측

> **남은 일 Phase 마스터:** `docs/remaining-work-phases.md` (v1.6)  
> **localhost 실행 로드맵:** `docs/localhost-execution-roadmap.md` (v1.0) — **Phase 0–2 ✅** (2026-07-12) · **Phase 2 상시 반복** · Phase 3–4 = 배포 후 · Phase 5 = Unlock 후  
> **구현 Task A–F:** ✅ 2026-07-10 완료. 아래는 **코딩 밖 잔여**만.

#### Remaining-work Phase 구현 상태

| Phase | 상태 | 비고 |
|-------|------|------|
| **A** Close-out | ✅ | Owner Top 3 재서명 · 375px QA (Vitest/E2E) |
| **B** Observe | ✅ 인프라 · 🔄 표본 | Unlock 14일/≥50 `home.viewed` · guest+auth · `unlock_ready` 전 **제품 UI LOCK** |
| **C** Analytics | ✅ | funnel CLI/CSV · Compare 성공지표 제외 |
| **D** Visual 375 | ✅ | `e2e/tests/results-visual-375.spec.ts` · `npm run test:visual` |
| **E** Keycap | ✅ | curated 12→18 · survey/NL 축 · recommend keycap **18** (browse **62**) |
| **F** Ops | ✅ F-1~F-3 · ⏸ F-4 | live pipeline · webhook · Feedback dry-run · **F-4 Git은 요청 시만** |

#### Localhost 실행 Phase 0–2 (2026-07-12 ✅)

| Phase | 핵심 결과 |
|-------|-----------|
| **0** | blocking **15 → 0** — 단종 `recommendationEligible: false` · 이름 변경(`sw-linear-003`) · 중복 seed 제거 · regression **127** green |
| **1** | layout coverage gap **0** — mislinked `layout-new-*` 15건 `browse.listed: false` · `browse.listed` 정책 코드 반영 · merge 메타 동기화 (added 0) · switch/keycap 잔여 gap **문서화** (`phase1_coverage_exceptions.txt`) |
| **2** | fixture recheck·ops·regression·Vitest·E2E smoke green · blocking 추이 `phase2_blocking_trend.txt` · **주 1회·PR 전 반복** |

**로컬 지금 할 일:** Phase **2** 유지보수 리듬만 반복. **Phase 3–5는 배포 전 보류** (localhost만으로 Phase 4 Unlock 판정 금지).

#### 아직 남은 것 (이 섹션의 실질 잔여)

- [x] **localhost 실행 Phase 0–2** — `docs/localhost-execution-roadmap.md` — ✅ 2026-07-12
- [ ] **Phase 2 상시** — fixture recheck · `verify_ops_quality_15.py` · (seed/UI 변경 시) regression·E2E
- [ ] **switch/keycap coverage 잔여** — live recrawl·idx enrichment (`inv-0093`, `inv-0105`, `inv-0189`, `inv-0193`, `inv-0195`)
- [ ] **Phase B 표본** — **배포 후** · `ENABLE_EVALUATION_PERSISTENCE=true` · `report_observe_aggregates` / Unlock (14일/≥50 `home.viewed`)
- 🔒 **Home 제품 revisit** — Dashboard / Login redirect / dual Hero 등 · Unlock + Owner Why 필수 (`product-next-phase5-home-revisit.md`) · 본 로드맵에 UI Task 없음
- [ ] **F-4 Git** — `keyboard-recommender` 단독 repo 커밋/원격 정리 — **사용자 요청 시에만**
- [ ] **Feedback Learning 실 staging host** — 로컬 dry-run·기본 off ✅ · 운영자가 `--base-url http://…` + `ENABLE_FEEDBACK_LEARNING_MVP=true`로 선택 검증 (production 기본 off 유지)

#### 완료로 종결 (체크만 유지)

- [x] **Phase A–F 구현 Task** (위 표) — ✅ 2026-07-10
- [x] ~~마이페이지 일부 섹션 — `MyPageComingSoon` placeholder~~ — 제거 (2026-07-10). 허브는 개요·저장·계정만
- [x] ~~activity → Overview accordion~~ — activity 탭 제거로 **대체 완료** (§4.15)

### 4.10 Swagkey 카탈로그 연동 로드맵 진행 상황

> **후속 (2026-07-11~12):** 6탭 스웨그키 실 SKU 1:1 · browse/recommend 이중 풀 — `docs/swagkey-catalog-1to1-roadmap.md` (**Phase 0–8 ✅**, 2026-07-12 sign-off)

> 상세: `docs/swagkey-catalog-roadmap.txt` (기준일 2026-07-08, Phase 2 ⑩~⑮ 완료) · **1:1 마감:** `docs/swagkey-catalog-1to1-roadmap.md`

#### 1:1 browse 풀 (seed, 2026-07-12 · localhost Phase 0–2 반영)

| family | browse | recommend | 비고 |
|--------|--------|-----------|------|
| switch | 66 | 54 | Phase 0 triage 후 |
| plate | 20 | 14 | |
| foam | 10 | 8 | |
| layout | 30 | 7 | browse = archetype 7 + listed 실 PCB **23** · seed **45** (`browse.listed: false` 15) · recommend = archetype only |
| case | 126 | 49 | |
| keycap | 62 | 18 | UI 기본 필터 Full/Base **52** |

- **seed:** `swagkey_products.seed.json` — ingestion **329** rows
- **게이트:** `catalog_sample.is_recommendation_eligible_row` · `audit_recommendation_pool.py` — **150** recommend · `gatePassed: true`
- **운영:** `catalog_change_alert` — blocking **0** · informational **34** · `phase2_blocking_trend.txt` 추이 기록
- **coverage:** layout gap **0** · switch **+2** · keycap **+5** (예외 목록 `phase1_coverage_exceptions.txt`)
- **검증:** `python scripts/run_swagkey_catalog_regression.py` (**127** pytest · 1 skipped)

| 단계 | 상태 | 내용 |
|------|------|------|
| ① CSV 정제 | **완료** | `clean_swagkey_inventory.py` → `swagkey_inventory.v1.json` |
| ② 제품명 분류 | **완료** | `classify_swagkey_inventory.py` → `recommender_candidates.json` |
| ③ seed diff | **완료** | `diff_swagkey_seed_inventory.py` → `seed_inventory_diff.json` |
| ④ 크롤러 v2 (URL) | **완료** | 293 SKU URL · new_in_crawl 46건 spec scrape (failures 0) |
| ⑤ stub seed + trait | **완료** | `merge_new_in_crawl_into_seed.py` → merged seed |
| ⑥ ingestion + regression | **완료** | `run_swagkey_catalog_regression.py` |
| ⑦ catalog browse API | **완료** | `GET /api/v1/switches|plates|foam` + `/catalog` UI |
| ⑧ keyboard_cases seed | **완료** | case_kit 49건 → seed `cases` + `/api/v1/cases` |
| ⑨ full catalog | **완료** | out_of_scope 153건 → `swagkey_catalog_full.json` + `/api/v1/catalog/full` (ops) |
| ⑩ 추천↔쇼핑 링크 | **완료** | picks·build·alternatives `sourceUrl` · `/results` 스웨그키 링크 |
| ⑪ seed 품질 cleanup | **완료** | 단종/중복 제거 · shop_view URL · seed_only 정리 |
| ⑫ case 5축 추천 | **완료** | case↔layout 호환 · API `build.case` · responseContractRev |
| ⑬ 카탈로그 UX | **완료** | 검색·페이지네이션·상세 패널 · 홈/results 유도 · **후속 §4.15: 6탭·페이지네이션·검색 행** |
| ⑭ keycap 6축 | **완료** | curated **18**키캡 (Phase E) · 엔진/API/`/results` 키캡 · `GET /keycaps` |
| ⑮ 운영·품질 | **완료** | inventory recheck 알림 · **imageUrlChanged** (Phase 8) · E2E 주기화 · feedback/HTTPS 검증 |

**UI 정리 (2026-07-08, ⑮ 이후):** 추천풀/키캡·기타 이중 모드 제거 → **카탈로그 6탭** (§4.15). full catalog 액세서리류는 앱에 노출하지 않음.

**원칙:** Backend/Frontend/추천 엔진 아키텍처 유지. MD/CSV = **인벤토리**, seed JSON = **browse 풀(1:1)** + `recommendationEligible`로 **추천 풀** 분리 (`docs/swagkey-catalog-1to1-roadmap.md` §2). trait/spec 없이 browse stub 허용; 추천 참여는 spec/trait 게이트 유지. 상품 링크는 `https://www.swagkey.kr/shop_view/?idx={id}` canonical. **seed 자동 merge 금지** — 항상 `--dry-run` → 운영자 검토 → `--apply-to-seed`.

#### 1:1 로드맵 Phase 0–8 (2026-07-12 sign-off)

| Phase | 핵심 산출 |
|-------|-----------|
| **0** | `audit_catalog_1to1_coverage.py` baseline · gap 리포트 |
| **1** | inventory v4 · candidates 분류 |
| **2** | keycap/case_kit 분류 정교화 |
| **3** | `merge_inventory_browse_seed.py` — browse seed **331** (현재 **329** — localhost Phase 0 triage 후) |
| **4** | 이미지 mirror · spec scrape queue · `browse_image_coverage` |
| **5** | 카탈로그 UI — 레이아웃 「참조 배열」/「기판 상품」 · keycap Full/Base/Addon 필터 · `referenceLayout` API |
| **6** | `recommendationEligible` 게이트 · `audit_recommendation_pool.py` |
| **7** | alert tier (blocking/informational) · coverage threshold CI warning · diff `recommendation_eligible` |
| **8** | `run_swagkey_catalog_regression.py` **127** pytest (1 skipped) · snapshot/contract 갱신 · 문서 마감 |

#### 카탈로그 UI (Phase 5, `/catalog`)

- 레이아웃 탭: `referenceLayout: true` → 참조 배열 7건 (다이어그램) · listed 실 PCB **23**건 별도 섹션 (`browse.listed: false` 15건은 seed만 유지)
- 키캡 탭: 기본 **Full/Base 52** · `subtype=all` **62** · Addon 필터
- 케이스 탭: `layoutSize` 필터 (alice **5**, 65 **15**, 80_tkl **7**)
- 상세 패널: traits · metadata · 스웨그키 링크 · 레이아웃 다이어그램(참조만)

**레이아웃 다이어그램 geometry LOCK:** `layout-diagram-definitions.ts` · `layout-diagram.tsx` · `public/layout-diagrams/*.svg` — 운영자 명시 요청 없이 수정 금지. **예외 (2026-07-12 운영자 튜닝 반영):** **Alice** (`alice` / `layout-006`) · **Split 60** (`split-60` / `layout-007`) — 아래 §.

#### 레이아웃 다이어그램 아키텍처 (2026-07-10~12)

**이미지 정책 (아키타입 vs 실제 기판):**

| 종류 | ID | 카탈로그/추천 이미지 |
|------|-----|---------------------|
| **추상 아키타입** | `layout-001`…`007` | React **배열 다이어그램** (제품 사진 금지) |
| **실제 PCB/기판** | `layout-new-*` | Swagkey **제품 사진** (mirror/CDN, 다른 축과 동일) |

- 백엔드 `layout_diagrams.py` — archetype → `/layout-diagrams/*.svg` fallback 경로 (`resolve_part_image_url`)
- 프론트 `resolveLayoutDiagramId(partId, imageUrl, layoutSize)` — ID 해석되면 **React `LayoutDiagram` 우선** (`layout-diagram-panel.tsx` · 카탈로그 카드 썸네일)
- `catalog_seed_images.py` — archetype은 diagram URL · `layout-new-*`는 mirror/CDN

**React Blueprint 렌더러:**

| 모듈 | 역할 |
|------|------|
| `layout-diagram-definitions.ts` | 7종 `BLUEPRINTS` · 키 좌표(u 단위) · Alice 블록 분리·회전 |
| `layout-diagram.tsx` | SVG 렌더 · 블록 `transform` · role 스타일 · `jacks`/`connectors` |
| `layout-diagram-types.ts` | `LayoutKeyDef` · `LayoutBlueprint` · `LayoutJackDef` · `LayoutConnectorDef` |
| `layout-diagram-id.ts` | `layout-00x` / `layoutSize` / diagram path → `LayoutDiagramId` |
| `layout-archetype-metadata.ts` | browse 카드 trait 칩용 seed 메타 (list API 미포함 필드) |
| `layout-trait-chips.tsx` · `layout-diagram-panel.tsx` (`layoutDiagramCallouts`) | 카드 칩 · 상세 교육 callout |

**키 role 강조 (단색 Blueprint):** `accent`(ESC) · `enter` · `space` · `arrow` — `ca-primary` fill · 나머지 `default`는 stroke 와이어프레임.

**겹침 방지:** `layout-diagram.test.ts` — 7 blueprint 전부 키 rect 겹침 없음 검증.

#### 7종 참조 배열 geometry (`layout-001`~`007`)

| diagramId | layout ID | geometry 요약 |
|-----------|-----------|---------------|
| `60-standard` | `layout-001` | 15u×5행 · ISO Enter(2.2u) · Space 6.25u · viewBox `220×92` |
| `65-compact` | `layout-002` | 60% + 우측열 + 4·5행 방향키 클러스터 · 짧은 스페이스 |
| `tkl` | `layout-003` | F행 + 알파 + **분리 네비 섬**(Ins/Home/PgUp…) + 방향키 · 2블록 |
| `full-size` | `layout-004` | TKL + 우측 넘패드(세로 Enter) · 3블록 |
| `75-exploded` | `layout-005` | ESC 분리 · F행 2덩어리 · 알파 15열 · 우측 네비·방향키 간격 |
| `alice` | `layout-006` | 65% 기반 + 좌 매크로열 · **행별 블록 회전** (아래 §) |
| `split-60` | `layout-007` | 60% 기반 · 1~4행 분리 · 5행 스페이스 병합 · TRRS 잭/케이블 (아래 §) |

#### Alice Ergonomic 다이어그램 (`alice` / `layout-006`, 2026-07-12)

- **베이스:** `sixtyFiveCore`에서 우측열·방향키 제거 → 좌측 **매크로열 4키** 추가 · 1행 8번 뒤 `0.25u` 갭
- **우측 블록:** `x >= 9` (`ALICE_RIGHT_BLOCK_MIN_X`) 키에 `+0.5u` 수평 시프트 (`ALICE_RIGHT_BLOCK_X_SHIFT_U`)
- **회전 (블록 단위 SVG `transform`):**
  - **좌측 1~5행:** pivot = 해당 행 첫 키 **왼쪽 아래** · 시계 **+10°** (`ALICE_*_LEFT_ROTATE_DEG`)
  - **우측 1~4행:** pivot = 행 내 **3번째 키 오른쪽 아래** · 반시계 **−10°** + `translate(0, alignPx)` 수직 보정
  - **우측 5행 3·4번:** pivot 3번 **왼쪽 아래** · 반시계 **−10°**
- **행별 alignPx 상수:** 기본 `−2.6px` · 1행 `−3.9px` · 2~4행 추가 `u` 오프셋 (`ALICE_RIGHT_ROW*_EXTRA_SHIFT_U`)
- **role:** `applyAliceKeyRoles` — ESC·Enter·Space·Arrow (65%와 동일 규칙)
- **viewBox:** `0 0 220 92` (bounds 자동 계산)

#### Split 60 참조 배열 (`layout-007`, 2026-07-12)

스웨그키 크롤에 **실제 Split 60 키보드(Corne/Lily58 등) 없음** — `layout-007`은 추천·다이어그램용 **참조 아키타입**으로 유지. Shy60(`idx=1504`)·Alice Duo 등과 **1:1 매핑 금지**.

| 영역 | 정책 |
|------|------|
| **추천 풀** | `layout-007` 유지 · `recommendationEligible: true` |
| **browse** | `referenceLayout: true` · diagram sanitize (`sourceUrl` 비움) |
| **seed** | `sourceUrl: ""` (잘못된 Shy60 링크 제거) |
| **추천 `sourceUrl`** | `is_layout_archetype_without_swagkey_product` → `layout-007` 빈 문자열 |
| **Alice Duo** | `layout-idx-1286` · `case-033` 등 → `layout_size: alice` (Split 60과 분리) |
| **alert** | `layout-001`~`007` `seed_only` → **informational** (blocking 제외, `catalog_change_alert.py`) |

**카탈로그 UI (참조 전용 Split 60):**

- 카드·상세: `스웨그키 판매 제품 없음 · 배열 참고용` (`isReferenceOnlyLayoutArchetype` → `layout-007`만)
- **「케이스/키트 보기」 링크 숨김** — `layoutSize=split` 케이스 0건이라 빈 목록 방지
- 추천 결과 Overview에서도 split 레이아웃 시 동일 링크 숨김

**Split 60 다이어그램 geometry (`split-60`, 운영자 튜닝 2026-07-12):**

- **베이스:** 60% Standard (`sixtyPercentCore`) 단일 블록
- **행별 분리** (간격 **1.5u**, 해당 행만):
  - 1행: 7·8번 키 사이 (`x=7`)
  - 2행: 6·7번 (`x=6.5`)
  - 3행: 6·7번 (`x=6.8`)
  - 4행: 6·7번 (`x=7.3`)
  - 5행: 분리 없음
- **5행 스페이스:** 1.25u×5 분할 후 **4·5·6번 합침 `w=3.125`** · **5·6번 합침 `w=3.125`** · 5번째 칸부터 우측 정렬 (`rightEdge=16.5u`)
- **TRRS 잭·케이블** (`layout-diagram.tsx` · blueprint `jacks`):
  - 1행 **6·9번** 키 중심 위 작은 네모 (`0.5u×0.25u`, 키 상단 **0.1u**)
  - 네모 **상단 중앙**에서 위로 올린 뒤 가운데 **둥근 아치**로 연결 (선 굵기 `1`)

**관련 파일:** `frontend/.../layout-diagram/` (`definitions` · `layout-diagram.tsx` · `types` · `id` · `panel` · `test`) · `layout-catalog-links.ts` (`isReferenceOnlyLayoutArchetype`) · `catalog-part-thumbnail.tsx` · `catalog-browse-view.tsx` · `catalog-detail-panel.tsx` · `results-overview-tab.tsx` · `catalog_seed_images.py` · `swagkey_source_url.py` · `layout_diagrams.py` · `public/layout-diagrams/*.svg`

#### 이후 주기 운영 (자동 merge 아님)

스웨그키 쇼핑몰은 계속 변하므로, 아래를 **월 1회 또는 alert 시** 반복한다.

1. **live recheck** — `run_swagkey_live_inventory_pipeline.py` (GitHub Actions 월 1회)
2. **alert 확인** — `data/swagkey_inventory/catalog_change_alert.txt`
   - `new_in_crawl` → browse merge **후보** (informational)
   - `seed_only` / `name_changed` + `recommendationEligible` → **blocking** (webhook 대상)
   - layout archetype `seed_only` 7건 → **informational** (`catalog_change_alert.py` — blocking 제외, 단종 아님)
3. **dry-run merge** — `merge_inventory_browse_seed.py --dry-run` → 검토 → `--apply-to-seed`
4. **재검증** — `audit_recommendation_pool.py` · `run_swagkey_catalog_regression.py`
5. **gap 축소** — inventory **재크롤** 후 ①~③ 반복 (`docs/swagkey-inventory-recheck.md`)

```cmd
cd backend
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
python scripts/merge_inventory_browse_seed.py --dry-run
python scripts/audit_recommendation_pool.py
python scripts/audit_catalog_1to1_coverage.py --check-threshold --warn-only
python scripts/run_swagkey_catalog_regression.py
```

---

## 5. Backend 상세

### 5.1 레이어 아키텍처

```
API (FastAPI routes)
  → Application (recommendation_service, cache, persistence hook)
    → Trait Engine (pipeline, matching, vectors, weights)
    → Recommendation Quality (compatibility, diversity, fallback, feedback, evaluation, drift)
    → Catalog (normalization, ingestion, Swagkey scraper, **inventory/classifier/diff**)
    → Terminology (community terms → trait axes)
  → Infrastructure (PostgreSQL ORM, email, safety middleware)
```

**진입점:** `backend/src/keyboard_recommender/main.py` → `create_app()`  
**실행:** `uvicorn keyboard_recommender.main:app --reload --app-dir src`

### 5.2 추천 파이프라인 (`POST /recommendations/compute`)

**Happy path (항상 시도):**

1. FastAPI route → `SurveyAnswersRequest` 검증 (요청 `mode` 필드 없음; `mode=quick` → 422)
2. `compute_recommendation()` — operational runtime flags 해석
3. Trait engine — switch/plate/foam/layout/case/keycap 순위 계산
4. Build selection — compatibility, diversity, fallback, feedback learning (6축)
5. API envelope — `runMode: "full"` + 안정적 응답 payload (`build.keycap`, `sourceUrls`, picks domain)
6. (선택) 캐시, evaluation persistence, unified events

**Resilient degraded (full 실패 시만, `enable_resilient_compute_fallback=true`):**

- full 경로 예외 → `_resilient_degraded_flags()` (`resilient_degraded_v1`, rerank/feedback off)로 재시도
- 응답: `runMode: "quick"` (contract rev 7), `degradedReason: "full_mode_compute_failed"`
- 사용자 UI: «안정 모드» — «빠른 추천»이 아님

상세 다이어그램: `backend/docs/architecture-guide.md` § Recommendation compute paths

**핵심 파일:**
- `application/recommendation_service.py`
- `trait_engine/pipeline.py`
- `recommendation_quality/build_selection.py`
- `trait_engine/api_envelope.py`

### 5.3 API 엔드포인트 전체 목록

#### Meta
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 서비스 인덱스 |
| GET | `/health` | Liveness probe |

#### Auth — `/api/v1/auth`
| Method | Path |
|--------|------|
| POST | `/signup` |
| POST | `/email-verification/send` |
| POST | `/email-verification/verify` |
| POST | `/password-reset/request` |
| POST | `/password-reset/confirm` |
| POST | `/login` |
| POST | `/logout` |
| POST | `/logout-all` |
| GET | `/me` |
| GET | `/security-summary` |
| POST | `/display-name` |
| POST | `/change-password` |
| GET | `/display-name-availability` |
| POST | `/avatar` |
| DELETE | `/avatar` |

#### Recommendations — `/api/v1/recommendations`
| Method | Path | 설명 |
|--------|------|------|
| POST | `/compute` | **핵심** — 설문 → 추천 빌드 |
| POST | `/events` | 통합 이벤트 수집 |
| POST | `/saved` | 북마크 저장 |
| GET | `/saved` | 북마크 목록 |
| POST | `/saved/remove` | 북마크 삭제 |
| POST | `/saved/update` | 북마크 메모 수정 |
| GET | `/activity` | 활동 타임라인 (**Results UI 제거 · API 유지** — saved/클라이언트 merge용) |
| GET | `/nl-vocab-candidates` | 미등록 NL 토큰 후보 |
| POST | `/activity/remove` | 활동 삭제 |

#### Terminology — `/api/v1/terminology`
| Method | Path |
|--------|------|
| POST | `/interpret` |

#### Catalog — `/api/v1/switches`, `/plates`, `/foam`, `/layouts`, `/cases`, `/keycaps`
| Method | Path | 설명 |
|--------|------|------|
| GET | `/switches` | 스위치 목록 (`?subtype=linear` · `?q=` · limit/offset) |
| GET | `/switches/{id}` | 스위치 상세 (traits, metadata, sourceUrl) |
| GET | `/plates` | 플레이트 목록 |
| GET | `/plates/{id}` | 플레이트 상세 |
| GET | `/foam` | 폼 목록 |
| GET | `/foam/{id}` | 폼 상세 |
| GET | `/layouts` | 레이아웃 목록 — browse **30건** (archetype 7 + 실 PCB 23) (`?q=` · limit/offset) |
| GET | `/layouts/{id}` | 레이아웃 상세 |
| GET | `/cases` | 케이스/키트 목록 (`?subtype=kit` 등) — browse **126건** |
| GET | `/cases/{id}` | 케이스/키트 상세 |
| GET | `/keycaps` | 키캡 목록 — browse **62건** (recommend **18**) |
| GET | `/keycaps/{id}` | 키캡 상세 |
| GET | `/catalog/full` | ops용 full catalog (`?catalogCategory=…`) — **프론트 browse 미사용** |
| GET | `/catalog/full/{id}` | full catalog 항목 상세 — **프론트 browse 미사용** |

Frontend: `/catalog` — **6탭** (`?family=switch|plate|foam|layout|case|keycap`) · 레거시 `mode=full&category=keycap` → keycap 탭으로 흡수

#### Internal Debug — `/api/v1/debug` (OpenAPI 숨김, production 차단)
| Method | Path |
|--------|------|
| GET | `` |
| POST | `/recommendations/inspect` |
| POST | `/recommendations/compare-surveys` |
| POST | `/snapshots/analyze` |
| GET | `/drift/summary` |
| GET | `/analytics/kpis` |
| POST | `/benchmarks/compare-snapshots` |

### 5.4 DB 모델 (22 테이블)

> **키캡 browse/recommend:** PostgreSQL 테이블 없음 — `swagkey_products.seed.json` + `catalog_sample.py` / `GET /keycaps` (seed-only 런타임).

**카탈로그 (DB):**
- `recommendation_traits`, `switches`, `switch_trait_scores`
- `plates`, `plate_trait_scores`
- `foam_configs`, `foam_config_trait_scores`
- `keyboard_layouts`, `keyboard_layout_trait_scores`
- `keyboard_cases`, `keyboard_case_trait_scores`

**인증:**
- `users` (`avatar_url` nullable), `auth_sessions`, `auth_email_verifications`, `auth_password_resets`

**평가 영속:**
- `eval_recommendation_runs`, `eval_snapshots`, `eval_metrics`, `eval_diagnostics`
- `eval_confidence_samples`, `eval_benchmark_runs`, `eval_events`

**마이그레이션:** `001` → `002` → `003` → `004` → `005` → `006` → `007` (`users.avatar_url`)

**정적 미디어 (런타임):** `/media/avatars` (`data/avatars/`) · `/media/swagkey-images` (`data/swagkey_images/`)

### 5.5 Backend 스크립트 (`backend/scripts/`)

| 스크립트 | 용도 |
|----------|------|
| `run_catalog_ingestion.py` | 카탈로그 ingestion 전체 파이프라인 |
| `generate_swagkey_spec_targets.py` | 스위치 스크래핑 대상 생성 |
| `generate_swagkey_compat_targets.py` | 플레이트/폼 스크래핑 대상 생성 |
| `extract_swagkey_specs.py` | 스위치 spec HTML 추출 |
| `extract_swagkey_compat_specs.py` | plate/foam 호환 spec 추출 |
| `retry_failed_swagkey_specs.py` | 실패 스위치 재시도 |
| `retry_failed_swagkey_compat_specs.py` | 실패 plate/foam 재시도 |
| `enrich_switch_specs.py` | 스위치 spec → seed 병합 |
| `enrich_component_specs.py` | plate/foam spec → seed 병합 |
| `seed_e2e_user.py` | E2E 테스트 유저 시드 (CI) |
| `replay_recommendation.py` | 설문 replay → JSON bundle |
| `trace_pipeline.py` | 파이프라인 trace |
| `inspect_snapshot.py` | 스냅샷 metrics/diagnostics |
| `compare_recommendations.py` | 두 snapshot/bundle 비교 |
| `validate_system.py` | alembic + schema + pytest 일괄 검증 |
| `check_migration_schema.py` | 마이그레이션 후 스키마 smoke |
| **`clean_swagkey_inventory.py`** | **크롤 CSV 정제 → `swagkey_inventory.v1.json` (로드맵 ①)** |
| **`classify_swagkey_inventory.py`** | **인벤토리 family 분류 → `recommender_candidates.json` (②)** |
| **`diff_swagkey_seed_inventory.py`** | **seed vs 크롤 fuzzy diff → `seed_inventory_diff.json` (③)** |
| **`crawl_swagkey_product_urls.py`** | **HTTP crawler v2 → product URL 수집 (④)** |
| **`merge_swagkey_inventory_urls.py`** | **크롤 URL → `swagkey_inventory.v2.json` merge (④)** |
| **`generate_new_in_crawl_spec_targets.py`** | **new_in_crawl → spec scrape targets (④)** |
| **`extract_new_in_crawl_specs.py`** | **new_in_crawl spec extract wrapper (④)** |
| **`merge_new_in_crawl_into_seed.py`** | **new_in_crawl → seed 병합 (⑤)** |
| **`merge_case_kits_into_seed.py`** | **case_kit 49건 → seed `cases` (⑧)** |
| **`build_swagkey_catalog_full.py`** | **out_of_scope → `swagkey_catalog_full.json` (⑨)** |
| **`fix_swagkey_seed_source_urls.py`** | **카테고리 URL → 상품 상세 URL (`?idx=` / shop_view) 보정** |
| **`apply_keycap_seed_merge.py`** | **⑭ curated keycap → seed `keycaps[]`** |
| **`run_swagkey_inventory_recheck.py`** | **⑮ crawl/diff → catalog_change_alert (fixture\|live) + `--check-image-urls` + webhook** |
| **`download_swagkey_images.py`** | **제품 이미지 CDN → `data/swagkey_images/` mirror (Phase 7)** |
| **`audit_catalog_browse_issues.py`** | **browse 이미지 품질 감사 (missing/shared image)** |
| **`merge_image_urls_into_seed.py`** | **image artifact → seed `imageUrl` merge** |
| **`extract_swagkey_product_images.py`** | **live/cache HTTP → `swagkey_product_images.json`** |
| **`run_swagkey_live_inventory_pipeline.py`** | **Phase F live: crawl URLs → clean → classify → recheck** |
| **`verify_feedback_learning_mvp.py`** | **⑮ ENABLE_FEEDBACK_LEARNING_MVP dry-run / staging** |
| **`check_production_https_config.py`** | **⑮ production HTTPS env offline check** |
| **`verify_ops_quality_15.py`** | **⑮ 운영·품질 일괄 로컬 검증** |
| **`run_swagkey_catalog_regression.py`** | **⑥ ingestion + pytest + (선택) frontend test** |
| **`merge_inventory_browse_seed.py`** | **1:1 Phase 3 browse seed merge (`--dry-run` 기본)** |
| **`audit_catalog_1to1_coverage.py`** | **1:1 inventory↔browse gap · CI `--check-threshold --warn-only`** |
| **`audit_recommendation_pool.py`** | **recommend vs browse 풀 게이트 리포트** |
| **`promote_to_recommendation_pool.py`** | **`recommendationEligible` 승격 후보 (`--dry-run` 기본)** |
| **`audit_browse_image_coverage.py`** | **browse `imageUrl` 커버리지 감사** |
| **`merge_swagkey_inventory_images.py`** | **v2 + imageUrl → `swagkey_inventory.v3.json`** |
| **`extract_swagkey_images_from_cache.py`** | **HTML 캐시에서 `og:image` 추출 (이미지 Phase 0)** |
| **`apply_seed_quality_cleanup.py`** | **⑪ seed 품질 cleanup (단종·중복·URL)** |
| **`apply_layout_source_urls.py`** | **레이아웃 archetype `sourceUrl` 정책 적용** |
| **`spike_phase0_swagkey_images.py`** | **이미지 파이프라인 Phase 0 스파이크** |
| **`record_switch_image_remediation.py`** | **스위치 이미지 수동 보정 기록** |
| **`report_funnel_analytics.py`** | **Phase C 퍼널 분석 CLI** |
| **`report_observe_aggregates.py`** | **Phase B Observe 집계 (`home.viewed` 등)** |
| **`regen_stable_snapshot.py`** | **regression/snapshot golden 재생성** |

> **Makefile** (`backend/Makefile`): `make test` · `validate` · `migrate-check` · `inventory-recheck` · `feedback-verify` · `https-config-check` (Unix/WSL; Windows는 `python scripts/…` 직접 실행)

### 5.6 Backend 테스트 (~77 모듈 + 4 버킷)

| 영역 | 파일 예시 |
|------|-----------|
| Trait engine | `test_trait_engine_matching.py`, `test_explainable.py` |
| API contract | `contract/test_recommendation_compute_contract.py` |
| Recommendation quality | `test_recommendation_quality_compatibility.py`, `test_recommendation_quality_diversity.py` |
| Evaluation | `test_evaluation_phase1.py`, `test_evaluation_storage.py` |
| Catalog | `test_catalog_layer.py`, `test_swagkey_spec_scraper.py` |
| **Swagkey inventory** | `test_swagkey_inventory.py`, `test_swagkey_inventory_classifier.py`, `test_swagkey_seed_inventory_diff.py`, `test_swagkey_crawler_v2.py`, `test_swagkey_new_in_crawl_seed_merge.py`, `test_swagkey_case_seed_builder.py`, `test_swagkey_catalog_full.py`, `test_swagkey_catalog_regression.py`, **`test_swagkey_source_url.py`** |
| **Catalog browse** | **`test_catalog_browse.py`** · **`test_catalog_browse_policy.py`** (switches·plates·foam·**layouts**·cases·**keycaps**) |
| **Catalog change alert** | **`test_catalog_change_alert.py`** · **`test_catalog_change_alert_webhook.py`** |
| **Swagkey product images** | **`test_swagkey_image_extractor.py`** · **`test_swagkey_image_merge.py`** · **`test_swagkey_image_mirror.py`** · **`test_swagkey_image_url_recheck.py`** |
| **Catalog 1:1 / pool gate** | **`test_catalog_1to1_coverage.py`** · **`test_recommendation_pool_gate.py`** · **`test_swagkey_recommendation_promotion.py`** · **`test_swagkey_inventory_browse_seed_merge.py`** · **`test_browse_image_coverage.py`** |
| **Catalog metadata / scrape queue** | **`test_catalog_metadata_mapping.py`** · **`test_swagkey_spec_scrape_queue.py`** |
| **Case / explanation** | **`test_case_compatibility_rules.py`** · **`test_explanation_grounding.py`** |
| **Observe / funnel** | **`test_observe_aggregate.py`** · **`test_funnel_analytics.py`** · **`test_unified_event_pipeline.py`** |
| **Layout diagrams** | **`test_layout_diagrams.py`** |
| **Keycap seed / compat** | `test_keycap_seed_builder.py`, `test_keycap_compatibility_rules.py` |
| **Resilience / source URL** | `test_recommendation_resilient_fallback.py`, `test_recommendation_source_url.py`, `test_seed_quality.py` |
| **Swagkey image fetch** | `test_swagkey_image_inventory_fetch.py`, `test_swagkey_image_cache_backfill.py` |
| **E2E fixture alignment** | `test_e2e_survey_fixture_alignment.py` |
| Auth/Safety | `test_auth_cookie_settings.py`, `test_safety_layer.py` |
| Regression | `recommendation_regression/test_recommendation_regression.py` |
| Snapshot | `snapshot_testing/test_recommendation_snapshot.py` |

### 5.7 Backend 문서 (`backend/docs/`)

| 파일 | 내용 |
|------|------|
| `architecture-guide.md` | 시스템 맵, 파이프라인, evaluation, drift, scaling |
| `developer-guide.md` | 온보딩, editable install, CORS localhost 함정 |
| `debug-guide.md` | 추천/evaluation/drift 트러블슈팅 |
| `runbook.md` | 인시던트 대응, env flag 롤백 |
| `database-schema.md` | ER 다이어그램, 컬럼 스펙 |
| `catalog-data-architecture.md` | L/M/H tier, ingestion 파이프라인 |
| **`swagkey-image-storage-policy.md`** | **mirror 디렉터리·git·운영 정책 (Phase 7)** |
| `terminology-interpretation.md` | 커뮤니티 용어 → trait 매핑 |
| `developer-replay.md` | CLI replay bundle 스키마 |
| `internal-debug-ui.md` | Debug API + Frontend `/debug` 설정 |
| `ci-and-local-validation.md` | CI job, validate_system.py |

---

## 6. Frontend 상세

### 6.1 페이지/라우트

| Route | 인증 | 설명 |
|-------|------|------|
| `/` | 공개 | 홈 Landing — Hero(«추천 설문 시작» · 우측 `HomeWorkshopPreview` 장식) + Feature Grid (WorkshopStrip 제거) |
| `/auth` | 공개 | 로그인/회원가입 |
| `/auth/forgot-password` | 공개 | 비밀번호 재설정 요청 |
| `/auth/reset-password` | 공개 | 비밀번호 재설정 확인 |
| `/recommend` | **필요** | 설문 — **Curator UI** (§4.12): 스타일 프리셋 3종 → 5단계(프리셋 스킵) · NL 항상 표시 · 뷰포트 고정 · Lucide 카드 아이콘 |
| `/results` | **필요** | 추천 결과 — **§4.13–4.16** 탭 **2개** · 6축 First View · 저장 CTA · Evidence · Compare **없음** |
| `/mypage` | **필요** | 개요 · 저장 빌드 · 계정 · `?section=` 딥링크 (`activity`→`saved`) |
| `/catalog` | 공개 | 부품 카탈로그 — **6탭**, glass 카드, **썸네일**, 상세 패널, 스웨그키 링크, 숫자 페이지네이션 |
| `/terminology-demo` | 공개 | 용어 해석 데모 (noindex) |
| `/debug/*` | 플래그 | Internal debug UI (`NEXT_PUBLIC_INTERNAL_DEBUG=1`) |

**Debug 하위:** `/debug/recommendations`, `/evaluation`, `/snapshots`, `/benchmarks`, `/drift`, `/drift/confidence`, `/drift/diversity`, `/drift/families`, `/analytics`

### 6.2 주요 컴포넌트

| 경로 | 컴포넌트 | 역할 |
|------|----------|------|
| `features/recommendation/` | `SurveyWizard` | 스타일 프리셋 → 설문(프리셋 스킵) → FULL compute · Curator 레이아웃 |
| | `SurveyQuestion` | 질문·옵션 카드 (가로/세로 채움, Lucide 아이콘) |
| | `SurveySegmentedProgress` | `N / 5 단계` 세그먼트 바 + `약 1분` |
| | `SurveyOptionIcon` / `SurveyOnboardingStyleIcon` | 설문·입구 카드 Lucide 아이콘 (`survey-option-icon.tsx`) |
| | `ResultsView` | sessionStorage hydration + API refresh |
| | `RecommendationResultView` | 오케스트레이터 · 탭·북마크 · `degradedReason` · backend ranked vs lite fallback 분기 |
| | `results/*` | Overview · Evidence · Trust Layer · Header · Quality (§4.13–4.16) |
| `features/mypage/` | `MyPageHub` | 개요·저장·계정 · `?section=` URL 동기화 · Continue 본진 (`activity`→`saved`) |
| `features/catalog/` | `CatalogBrowseView` | **6탭**·subtype 필터·검색(개수 행)·`CatalogPagination`·glass 카드 |
| | `CatalogPagination` | `01` 형식 숫자 페이지네이션 · ellipsis |
| | `CatalogDetailPanel` | traits · metadata · 스웨그키 링크 · 모달 닫기 |
| | `CompatibleLayoutChips` | 케이스↔레이아웃 호환 칩 (`compatible-layout-chips.tsx`) |
| `features/home/` | `Hero`, `FeatureGrid`, `HomeLandingObserve`, `HomeWorkshopPreview` | Landing · CTA · Hero 우측 **장식 preview** (`home-workshop-preview.tsx`) · `home.viewed` (§4.16) · WorkshopStrip 삭제 |
| `providers/` | `AuthSessionProvider`, `ThemeProvider`, `RuntimeApiGuards` | `components/providers/` — 세션·테마·API 미연결/mixed-content 경고 |
| `auth/` | `RequireAuth` | `GET /auth/me` → 미인증 시 redirect |
| `layout/` | `SiteHeader`, `SiteFooter`, `HeaderCatalogSearch`, `AuthControls`(`AuthHeaderProvider`·`AuthNickname`·`AuthSessionAction`), `ThemeToggle` | TopNav·푸터·카탈로그 검색·인증·테마 (§4.15) |
| `app/` | `error.tsx`, `global-error.tsx` | 세그먼트/루트 에러 경계 |
| `internal-debug/` | `DebugChrome`, `DriftBundleView`, `AuditTables` | 디버그 UI |

### 6.3 API 연동 (`src/lib/api/`)

| 모듈 | Backend 경로 |
|------|-------------|
| `auth.ts` | `/api/v1/auth/*` |
| `recommendations.ts` | `POST /recommendations/compute` (9s timeout, 12s retry; **mode 필드 없음**) |
| `recommendation-response.ts` | 응답 파싱/검증 |
| `saved-recommendations.ts` | `/saved`, `/activity`, `/events` |
| **`catalog.ts`** | **`GET /switches|plates|foam|layouts|cases|keycaps`** (seed browse만; full catalog 클라이언트 제거됨) |
| `onboarding-events.ts` | 온보딩/KPI/Results UX/`home.viewed` (`home_landing_v1` · `results_ux_v1`: `results_tab_click`) |
| `debug-api.ts` | Browser debug API (`X-Internal-Debug-Token`) |
| `debug-api-server.ts` | Server component debug API |

**클라이언트 유틸 (`src/lib/`)**

| 모듈 | 역할 |
|------|------|
| `saved-result-snapshots.ts` | `/results` sessionStorage hydration (`responseContractRev: 7`) |
| `survey-storage.ts` | 설문 답변 localStorage persist |
| `survey-logic.ts` | 설문 단계·검증 헬퍼 |
| `recommendation-api-map.ts` | API compute 응답 → UI `RecommendedBuild` 매핑 |
| `recommendation-summaries.ts` | 빌드·축 요약 문자열 derive |
| `trait-display.ts` | trait 값 표시 포맷 (카탈로그·결과 공용) |
| `catalog-links.ts` | `/catalog?family=&subtype=&q=` deep link |
| `avatar.ts` | 프로필 사진 URL resolve |
| `experiments.ts` | A/B 실험 할당 → 이벤트 첨부 |

**Base URL:** `NEXT_PUBLIC_API_URL` (예: `http://localhost:8010`)  
**중요:** 브라우저 호스트와 API URL 호스트 일치 필수 (`localhost` vs `127.0.0.1` — 쿠키 공유 안 됨)

**Dev proxy 옵션:** `INTERNAL_API_PROXY_TARGET` → Next.js `next.config.ts`가 `/api/*` **및 `/media/*`** (avatars·swagkey mirror)를 backend로 rewrite

### 6.4 클라이언트 사이드 엔진 (API 폴백용)

| 모듈 | 역할 |
|------|------|
| `recommendation-engine/` | trait → user vector → dot product scoring |
| `nl-preference/` | NL 파서 → engine traits · **Phase E** keycap 토큰 (`keycap-nl-mapping`) |
| `keyboard-terminology/` | 커뮤니티 용어 → trait delta · **결과 Evidence 24축 라벨** (`trait-axis-labels.ts`) |
| `recommendation-mock.ts` | UI-facing `RecommendedBuild` 래퍼 |

### 6.5 Frontend 테스트 (Vitest, **31** 파일)

- `recommendation-response.contract.test.ts` — API 응답 파싱 contract (`runMode`, `degradedReason`)
- **`catalog-response.contract.test.ts`** — catalog list/detail 파싱 · `catalogHref({ family })` · layout family
- **`catalog-pagination.test.ts`** — `buildPaginationItems` ellipsis 로직
- `recommendation-result-view.smoke.test.tsx` — 결과 UI smoke
- `trait-axis-labels.test.ts` — Evidence 24축 용어 QA (100%)
- `survey-wizard.quick-removal.test.tsx` — «빠른 추천» UI 없음 (Phase 1)
- `survey-wizard.preset-skip.test.tsx` — 프리셋 후 첫 미응답 단계 진입 (Phase 3)
- `survey-step-navigation.test.ts` — `firstUnansweredStepIndex` (Phase 3)
- `drift-bundle-view.test.tsx` — drift UI
- `collapsible-json.test.tsx` — JSON viewer toggle
- **Results/Evidence:** `results-evidence-pick-card.test.tsx` · `results-evidence-ranking-why-content.test.ts` · `results-confidence-story-content.test.ts` · `results-ranking-thresholds.test.ts` · `results-trait-display.test.ts` · `results-quality-status.test.ts` · `results-text-utils.test.ts` · `results-build-utils.test.ts`
- **기타:** `mypage-*.smoke.test.tsx` · `layout-diagram.test.ts` · `layout-catalog-links.test.ts` · `layout-size.test.ts` · `swagkey-source-links.test.ts` · `home-landing.phase4.test.ts` · `home-landing-observe.test.tsx` · `phase4-observe-events.test.ts` · `keycap-nl-mapping.test.ts` · `saved-recommendations.activity.test.ts` 등

**카탈로그 UX 규칙 (2026-07-08, §4.15 보강):**
- 카드: 제목·설명 2줄 고정 높이 · `break-keep`(띄어쓰기 기준 줄바꿈) · 하단 태그 `mt-auto` 정렬 · `CardHeader` border 없음
- 홈 FeatureGrid: 동일 규칙 · «카탈로그에서 보기» 하단 정렬 · **6카테고리** (`xl:grid-cols-6`)
- **개수·검색 행:** `총 N개 · start–end 표시` (좌) + `이름·ID 검색` (우) · `sm:flex-row sm:justify-between`
- **페이지네이션:** `01` zero-pad 숫자 · 활성/비활성 색 대비 · 5페이지 초과 ellipsis · 페이지 클릭 시 카탈로그 상단 즉시 스크롤

**빌드 주의:** `npm run build`로 타입 검사 통과 확인. dev 중 `ChunkLoadError` / `React Client Manifest` / `global-error` 오류 시 `frontend\.next` 삭제 후 `npm run dev` 재시작 (PowerShell: `Remove-Item -Recurse -Force .next` / cmd: `rmdir /s /q .next`) · 포트 3000 점유 시 해당 `node` 프로세스 종료.

### 6.6 디자인 시스템 (Stitch / Cyber-Artisan)

**토큰 파일:** `frontend/src/app/globals.css` · `frontend/tailwind.config.ts`

| 유틸/클래스 | 용도 |
|-------------|------|
| `ca-glass-panel` | 카드·패널 (라이트: paper+shadow · 다크: glass) |
| `ca-btn-primary` / `ca-btn-ghost` | 주요/보조 버튼 |
| `ca-input` | 입력·`<select>` (다크: `color-scheme: dark`) |
| `ca-chip` | 태그·예시 칩 |
| `font-headline` | Hanken Grotesk — 로고·제목·로그인/로그아웃 |
| `font-body` | Inter — 본문·헤더 네비·검색·닉네임 |
| `font-label` | Hanken Grotesk — 섹션 eyebrow·chip·UI 라벨 (`CATALOG`·`RESULTS`·도메인 라벨 등) |
| `font-mono` | JetBrains Mono — 숫자·디버그·코드 메타만 |
| `text-ca-*` / `bg-ca-*` | Cyber-Artisan / Luminous 팔레트 |
| `.survey-curator-shell` | 설문 전체 너비 (`max-width: none`) |
| `.survey-curator-viewport` | 설문 영역 `height: 100%` · `overflow: hidden` |
| `.survey-option-tile` / `.survey-option-card--selected` | 옵션 카드 · 선택 glow 애니메이션 |
| `.survey-curator-nav-next` | 보라 pill «다음»/«결과 보기» |
| `.survey-nav-secondary` | «스타일 선택으로»/«처음부터 다시» pill |
| `.survey-prefilled-banner` | 프리셋 2줄 배너 (`min-height: 4.25rem`) |

**성공·활성 표시:** 라이트에서 `tertiary`가 Rose(경고)이므로 «활성»·«✓» 등은 `text-ca-viz-emerald` 사용.

**브랜드:** UI 표기 **Keyboard Recommender** (시안 KeebSmith는 톤 참고만).

---

## 7. E2E & CI

### 7.1 E2E 구조 (`e2e/`)

```
e2e/
├── package.json                # test · test:visual · test:visual:update · test:all
├── playwright.config.cjs       # baseURL: 127.0.0.1:3000 · projects: chromium, visual-375
├── scripts/start-stack.cjs     # uvicorn + next; CI에서는 pip install skip
├── fixtures/deterministic-survey.json
└── tests/
    ├── auth.setup.ts           # e2e-ci@keyboard.local 로그인 → storage state 저장
    ├── critical-flows.spec.ts  # 온보딩→프리셋 스킵→설문→결과→저장→마이페이지 (Compare UI 없음)
    ├── recommendation-survey.spec.ts
    ├── recommendation-nlp.spec.ts
    ├── results-evidence-phase4.spec.ts   # Evidence pick·ranking-why E2E
    ├── results-visual-375.spec.ts        # 375px 스크린샷 (`npm run test:visual`)
    ├── fixture-validation.spec.ts
    └── helpers/
        ├── survey-flow.ts
        └── results-flow.ts
```

**E2E 스크립트:** `npm test` (chromium) · `npm run test:visual` (visual-375) · `npm run test:all`

**E2E 유저:** `e2e-ci@keyboard.local` / `E2e_test!9` (환경변수로 override 가능)

**E2E workflow (`.github/workflows/e2e.yml`):** Mon **06:00 UTC** schedule + path-filtered `pull_request` + `workflow_dispatch`  
**Inventory recheck:** fixture Mon **09:00 UTC** (`.github/workflows/swagkey-inventory-recheck.yml` · `workflow_dispatch`: `fail_on_alert`, `notify_webhook`, `check_image_urls`) · live 월간 (`swagkey-inventory-recheck-live.yml`) · secret `CATALOG_CHANGE_ALERT_WEBHOOK_URL`

**E2E API 포트:** Playwright `start-stack.cjs`는 backend **8000** · 로컬 dev 기본 **8010** (§10) — `NEXT_PUBLIC_API_URL`을 모드에 맞게 설정

### 7.2 CI Jobs (`.github/workflows/ci.yml`)

| Job | 검증 내용 |
|-----|-----------|
| `quality-regression` | recommendation_regression, snapshot, benchmark |
| `quality-contract` | API contract tests |
| `quality-unit` | Ruff, Alembic, schema smoke, unit/integration · catalog 1:1 coverage audit (warning, `continue-on-error`) · ops scripts(alert/feedback/HTTPS) |
| `frontend` | ESLint, Vitest, production build |
| `quality-e2e` | Alembic + seed_e2e_user + Playwright |

**CI DB:** `postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender`

---

## 8. 환경 변수

### 8.1 Backend (`backend/.env`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `APP_ENV` | `local` | local/development/staging/production |
| `DATABASE_URL` | `postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender` | |
| `CORS_ORIGINS` | `http://localhost:3000` | 쉼표 구분 |
| `PUBLIC_FRONTEND_BASE_URL` | `http://localhost:3000` | |
| `DEBUG` | `false` | production에서 강제 false |
| `ENABLE_EVALUATION_PERSISTENCE` | false | eval DB 저장 |
| `ENABLE_FEEDBACK_LEARNING_MVP` | false | 피드백 학습 |
| `ENABLE_UNIFIED_EVENT_INGESTION` | true | persistence on 시 `eval_events` 수집 (best-effort) |
| `ENABLE_RESILIENT_COMPUTE_FALLBACK` | true | full compute 실패 시 degraded 재시도 |
| `ENABLE_RECOMMENDATION_CACHE` | true | compute 응답 캐시 |
| `SCALING_PROFILE` | `custom` (코드) | low/medium/high/custom · `.env.example`는 `medium` 권장 |
| `SWAGKEY_IMAGES_DIR` | `backend/data/swagkey_images` | mirror 썸네일 경로 |
| `CATALOG_CHANGE_ALERT_WEBHOOK_URL` | — | inventory recheck blocking 알림 (커밋 금지) |
| `OPERATIONAL_ALERT_WEBHOOK_URL` | — | 운영 알림 대체 env alias |
| `SWAGKEY_PRODUCTS_CSV` | — | 외부 크롤 CSV 경로 override |
| `INTERNAL_DEBUG_API_ENABLED` | — | debug API 게이트 |
| `INTERNAL_DEBUG_TOKEN` | — | debug API 토큰 |
| `AUTH_COOKIE_SECURE` | tier별 자동 | |
| `EMAIL_PROVIDER` | smtp | smtp/resend |
| `avatar_upload_dir` | `backend/data/avatars` | 프로필 사진 저장 경로 |
| `avatar_max_bytes` | 2097152 (2MB) | 아바타 업로드 최대 크기 |

> **주의:** Settings는 CWD 무관하게 `backend/.env` 절대경로 로드 (Alembic 포함)

### 8.2 Frontend (`frontend/.env.local`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | **Yes** | API origin (브라우저 호스트와 일치) |
| `INTERNAL_API_PROXY_TARGET` | Optional | dev proxy |
| `INTERNAL_DEBUG_TOKEN` | Optional | server-only debug token |
| `NEXT_PUBLIC_INTERNAL_DEBUG` | Optional | `1` → `/debug` 노출 |
| `NEXT_PUBLIC_EVIDENCE_RANKING_WHY` | Optional | `0` → Evidence ranking-why concrete 비활성 (롤백) · `frontend/.env.example`에는 미포함 |

> 전체 플래그·튜닝: `backend/src/keyboard_recommender/config/settings.py` · `backend/.env.example` · `docs/env-configuration.md`

---

## 9. Swagkey 데이터 파이프라인

Swagkey 연동은 **세 갈래**로 나뉩니다.

1. **인벤토리 파이프라인 ①~⑨ + Phase 2 ⑩~⑮ + 1:1 Phase 0–8 + localhost Phase 0–2** — 크롤 → browse seed **329** → 추천 풀 **150** → blocking **0** · 주기 recheck  
2. **Spec 스크래핑 (§9.1)** — seed row의 `sourceUrl`로 HTML spec 추출·trait 보강  
3. **제품 이미지 파이프라인 (§9.4)** — `og:image` → seed/API/UI · browse 정책 · local mirror · recheck drift

```
[크롤 CSV/MD] ──①~③──▶ inventory / candidates / diff
                              │
                              ▼ (new_in_crawl → dry-run merge · never auto-apply)
[URL + spec scrape] ──④~⑥──▶ swagkey_products.seed.json (329 ingestion)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  catalog_sample.py      /catalog UI (6탭)    swagkey_catalog_full.json
  (recommend pool)       browse pool 전체      (ops only)
  → trait_engine 6축     /switches|…|keycaps
  → 추천 API             layout archetype+PCB
                              │
                              ▼ ⑮ + Phase 7
                     inventory recheck → catalog_change_alert (tier)
                              │
                              ▼
                     image_url_recheck → imageUrlChanged (blocking)
```

### 9.4 제품 이미지 파이프라인 (Phase 0–8 **완료**, 2026-07-10~11)

> 마스터: `docs/swagkey-product-images-roadmap.md` · 스토리지: `backend/docs/swagkey-image-storage-policy.md`

```
seed.sourceUrl + inventory HTML
        │
        ├─ extract (cache / HTTP) → swagkey_product_images.json
        ├─ merge → seed.imageUrl + inventory.v3
        ├─ download_swagkey_images.py → data/swagkey_images/{idx}.{ext}
        │
        ▼
catalog_browse_service.imageUrl  (local mirror 우선 → /media/swagkey-images)
        │
        ▼
/catalog 카드·상세 (catalog-part-thumbnail · resolveCatalogImageUrl)
        │
        ▼
run_swagkey_inventory_recheck.py --check-image-urls
        → image_url_recheck_report.json + catalog_change_alert.imageUrlChanged
```

| 산출 / 경로 | 설명 |
|-------------|------|
| `swagkey_product_images.json` | productId → `imageUrl` (**392** unique) |
| `product_image_html_cache/` | 이미지 fetch HTML 캐시 (`{idx}.html`) — fixture recheck 입력 |
| `data/swagkey_images/` | 로컬 mirror (gitignore · clone마다 건수 상이) |
| `swagkey_image_mirror_report.json` | mirror 다운로드 리포트 |
| `image_url_recheck_report.json` | seed vs refetched `og:image` diff |
| `catalog_browse_audit_report.json` | browse shared/missing image 감사 |

**핵심 모듈:** `swagkey_image_extractor.py` · `swagkey_image_merge.py` · `swagkey_image_mirror.py` · `swagkey_image_url_recheck.py` · `catalog_browse_policy.py` · `infrastructure/swagkey_images.py`

**browse 정책 (Phase 5–6):** `idx` dedup · `BROWSE_EXCLUDED_SWAGKEY_IDX` (404 **12 idx**) · layout archetype `referenceLayout` + diagram sanitize · 실 PCB browse 허용 · recommend는 archetype만 · **image audit** = listable 행 기준 (`audit_browse_image_coverage.py` · layout은 unlisted 15건 포함해 seed **45** 전체 검사)

**로컬 검증:**

```powershell
cd backend
python scripts/download_swagkey_images.py
python scripts/audit_catalog_browse_issues.py
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
pytest tests/test_swagkey_image_mirror.py tests/test_swagkey_image_url_recheck.py tests/test_catalog_browse_policy.py -q
```

**잔여 ops (자동 merge 아님):** live recheck `imageUrlChanged` drift 시 seed/mirror 수동 갱신 · 404 스위치 **browse만** 제외(seed 풀 제거는 별도 결정)

### 9.1 Spec 스크래핑 파이프라인 (기존, seed 보강용)

**전체 (8단계):** `run_all_swagkey_pipeline.cmd`

1. `generate_swagkey_spec_targets.py` → switch targets JSON
2. `extract_swagkey_specs.py` → switch specs JSON
3. `retry_failed_swagkey_specs.py`
4. `enrich_switch_specs.py` → seed 병합
5. `generate_swagkey_compat_targets.py` → plate/foam targets
6. `extract_swagkey_compat_specs.py` → compat specs
7. `retry_failed_swagkey_compat_specs.py`
8. `enrich_component_specs.py` → seed 병합

**시드 파일:** `backend/src/keyboard_recommender/catalog/swagkey_products.seed.json`  
**HTML 캐시:** `backend/data/swagkey_html_cache/` (~64 files)  
**주의:** spec scrape 대상은 seed row의 `sourceUrl` 필요 — 크롤러 v2(④)에서 URL 수집 후 연결

### 9.2 크롤 인벤토리 파이프라인 (①~⑨ 완료)

**데이터 디렉터리:** `backend/data/swagkey_inventory/`

| 파일 | 생성 스크립트 | 설명 |
|------|---------------|------|
| `swagkey_products.csv` | (외부 크롤) | 원본: category, brand, product_name |
| `swagkey_inventory.v1.json` | `clean_swagkey_inventory.py` | 정제 인벤토리 293건 |
| `swagkey_inventory_cleaning_report.{json,txt}` | ↑ | 할인율 행 제거, 브랜드 보정, 중복 제거 리포트 |
| `recommender_candidates.json` | `classify_swagkey_inventory.py` | family별 추천 후보 |
| `recommender_classification_report.txt` | ↑ | 분류 요약 |
| `seed_inventory_diff.json` | `diff_swagkey_seed_inventory.py` | seed ↔ 크롤 매칭 diff |
| `seed_inventory_diff_report.txt` | ↑ | diff 요약 |
| `swagkey_crawl_urls.v1.json` | `crawl_swagkey_product_urls.py` | URL 크롤 293건 (`?idx=` 포함) |
| `swagkey_products_with_urls.csv` | ↑ | source_url + swagkey_product_id 포함 |
| `swagkey_inventory.v2.json` | `merge_swagkey_inventory_urls.py` | v1 + URL 필드 (293/293 merge) |
| `swagkey_inventory.v3.json` | `merge_swagkey_inventory_images.py` | v2 + `imageUrl` (**287/293**) |
| `swagkey_product_images.json` | `extract_swagkey_images_from_cache.py` + `extract_swagkey_product_images.py` | productId → imageUrl (**392** unique) |
| `image_seed_merge_report.json` | `merge_image_urls_into_seed.py` | seed imageUrl merge 리포트 |
| `new_in_crawl_targets/` | `generate_new_in_crawl_spec_targets.py` | spec scrape targets (⑤ 전 46건) |
| `new_in_crawl_specs/` | `extract_new_in_crawl_specs.py` | 추출된 spec JSON |
| `swagkey_products.seed.merged.json` | `merge_new_in_crawl_into_seed.py` | 기본 seed + new_in_crawl (117건) |
| `seed_merge_report.json` | `merge_new_in_crawl_into_seed.py` | 병합 통계·거부 목록 |
| `swagkey_products.seed.with_cases.json` | `merge_case_kits_into_seed.py` | ⑧ cases 병합 미리보기 |
| `keyboard_cases_seed_report.json` | ↑ | case seed 리포트 |
| `swagkey_catalog_full.json` | `build_swagkey_catalog_full.py` | ⑨ full catalog 153건 (**ops 전용**) |
| `swagkey_catalog_full_report.{json,txt}` | ↑ | full catalog 빌드 리포트 |
| `swagkey_products.seed.urls_fixed.json` | `fix_swagkey_seed_source_urls.py` | sourceUrl 상세 URL 보정 미리보기 |
| `swagkey_seed_url_fix_report.json` | ↑ | URL 보정 리포트 (fixed/unresolved) |
| `catalog_change_alert.{json,txt}` | `run_swagkey_inventory_recheck.py` | ⑮ 품절/신규/이름변경/**imageUrlChanged** 알림 (schema 1.1.0) |
| `image_url_recheck_report.json` | ↑ `--check-image-urls` | seed vs refetched `og:image` |
| `catalog_browse_audit_report.json` | `audit_catalog_browse_issues.py` | browse missing/shared image |
| `swagkey_image_mirror_report.json` | `download_swagkey_images.py` | CDN → local mirror 리포트 |
| `product_image_html_cache/` | `extract_swagkey_product_images.py` | 이미지 fetch HTML (`{idx}.html`) |
| `swagkey_inventory.v4.json` | `classify_swagkey_inventory.py` (1:1 Phase 1) | v3 + 1:1 refresh 분류 입력 |
| `swagkey_crawl_urls.v2.json` | `crawl_swagkey_product_urls.py` | URL 크롤 v2 (1:1 재크롤) |
| `phase0_image_spike_report.json` | `spike_phase0_swagkey_images.py` | 이미지 Phase 0 스파이크 |
| `phase1_inventory_refresh_report.json` | (1:1 Phase 1) | inventory v4 refresh 리포트 |
| `phase2_classification_report.json` | `classify_swagkey_inventory.py` | 1:1 keycap/case_kit 분류 정교화 |
| `swagkey_products.seed.browse_merged.json` | `merge_inventory_browse_seed.py` | browse merge dry-run/미리보기 |
| `inventory_browse_merge_report.{json,txt}` | ↑ | browse merge 통계 |
| `catalog_1to1_coverage_report.{json,txt}` | `audit_catalog_1to1_coverage.py` | inventory↔browse gap (CI warning) |
| `phase1_coverage_exceptions.txt` | (수동) | Phase 1 잔여 switch/keycap gap · merge rejected idx |
| `phase2_blocking_trend.txt` | (수동) | localhost Phase 2 blocking 추이 (fixture recheck) |
| `browse_image_coverage_report.{json,txt}` | `audit_browse_image_coverage.py` | browse `imageUrl` 커버리지 |
| `recommendation_pool_report.json` | `audit_recommendation_pool.py` | recommend vs browse 풀 게이트 |
| `recommendation_promotion_report.json` | `promote_to_recommendation_pool.py` | `recommendationEligible` 승격 후보 |
| `case_layout_overrides.json` | (수동) | case↔layout 호환 수동 오버라이드 |
| `seed_quality_cleanup_report.json` | `apply_seed_quality_cleanup.py` | ⑪ seed 품질 cleanup |
| `seed_quality_review.txt` | ↑ | cleanup 검토 요약 |
| `switch_image_remediation_report.json` | `record_switch_image_remediation.py` | 스위치 이미지 수동 보정 |
| `image_inventory_merge_report.json` | `merge_swagkey_inventory_images.py` | v2→v3 imageUrl merge |
| `swagkey_products.seed.with_images.json` | `merge_image_urls_into_seed.py` | imageUrl merge 미리보기 |
| `swagkey_product_images.failures.{json,csv}` | `extract_swagkey_product_images.py` | 이미지 추출 실패 목록 |
| `spec_scrape_targets/` | `generate_swagkey_spec_targets.py` 등 | spec scrape 대상 JSON |
| `swagkey_catalog_regression_report.{json,txt}` | `run_swagkey_catalog_regression.py` | ingestion + pytest regression 리포트 (루트 `backend/data/`) |

**`backend/data/` (루트, inventory 외):** `catalog_ingestion_manifest.json` · `swagkey_catalog_regression_report.json` · `swagkey_switch_targets.json` / `swagkey_switch_specs.json` · `swagkey_compat_targets.json` / `swagkey_compat_specs.json` · `examples/catalog_switch_import.example.json`

**시드 변형:** `catalog/swagkey_products.seed.json` (canonical) · `swagkey_products.seed.cleaned.json` (정제본)

**핵심 모듈 (`backend/src/keyboard_recommender/catalog/` + application):**

| 모듈 | 역할 |
|------|------|
| `swagkey_inventory.py` | CSV 정제, `InventoryItem`, cleaning report |
| `swagkey_inventory_classifier.py` | 한국어 키워드 → switch/plate/foam/layout/case_kit/out_of_scope |
| `swagkey_seed_inventory_diff.py` | seed vs candidates fuzzy match (기본 threshold 0.86) |
| `swagkey_crawler_v2.py` | HTTP listing parser → idx·URL·제품명 |
| `swagkey_new_in_crawl_targets.py` | new_in_crawl → spec scrape target 생성 |
| `swagkey_new_in_crawl_seed_merge.py` | new_in_crawl stub → spec enrich → trait derive → seed merge |
| `swagkey_case_seed_builder.py` | ⑧ case_kit → seed `cases` |
| `swagkey_catalog_full.py` | ⑨ out_of_scope → `swagkey_catalog_full.json` |
| `swagkey_keycap_seed_builder.py` | ⑭ full catalog curated IDs → seed keycaps |
| `catalog_change_alert.py` | ⑮ seed_inventory_diff + **imageUrlChanged** → 알림 DTO (schema 1.1.0) |
| `swagkey_image_url_recheck.py` | Phase 8 seed `imageUrl` vs live/fixture `og:image` diff |
| `swagkey_image_mirror.py` | Phase 7 CDN thumbnail download |
| `catalog_browse_policy.py` | browse dedup · 404 exclude · `browse.listed` · layout archetype |
| `catalog_seed_images.py` | archetype diagram URL · `layout-new-*` mirror/CDN resolve |
| `browse_image_coverage.py` | listable 행 `imageUrl` 커버리지 계산 (layout seed 45 포함) |
| `swagkey_spec_scrape_queue.py` | 1:1 Phase 4 spec scrape 대상 큐 |
| `seed_quality.py` | seed 품질 검증·cleanup 헬퍼 |
| `manual_switch_curation.py` | 스위치 수동 큐레이션 오버라이드 |
| `swagkey_image_merge.py` | image artifact → seed merge (fuzzy_name 금지) |
| `infrastructure/swagkey_images.py` | local mirror path resolve · `/media/swagkey-images` |
| `swagkey_catalog_regression.py` | ⑥ ingestion dry-run 검증 + regression 리포트 |
| **`catalog_1to1_coverage.py`** | **1:1 inventory↔browse gap 계산** |
| **`swagkey_inventory_browse_seed_merge.py`** | **inventory → browse seed merge 로직** |
| **`swagkey_recommendation_promotion.py`** | **`recommendationEligible` 승격 게이트** |
| **`swagkey_source_url.py`** | **상품 상세 URL 판별·seed URL 보정 (`SwagkeyUrlResolver`)** |
| `application/catalog_browse_service.py` | seed → browse DTO (switch|plate|foam|**layout**|case|**keycap**) |
| `application/full_catalog_browse_service.py` | full catalog JSON → browse DTO (ops API) |
| `api/v1/catalog_handlers.py` | catalog list/detail 공통 핸들러 |
| `api/v1/catalog_full.py` | `GET /catalog/full` 라우트 (ops) |
| `api/v1/cases.py`, `switches.py`, `plates.py`, `foam.py`, **`layouts.py`**, **`keycaps.py`** | catalog browse 라우트 |

**단계별 요약:**

| 단계 | 핵심 산출 |
|------|-----------|
| ①~③ | 갭 가시화 (정제·분류·diff) |
| ④~⑥ | 추천 풀 71→117 (+46), regression golden |
| ⑦ | `GET /api/v1/switches|plates|foam|layouts`, `/catalog` UI |
| ⑧ | seed +49 cases, `GET /api/v1/cases` |
| ⑨ | `swagkey_catalog_full.json` **153**, `GET /catalog/full` (이후 UI에서는 미사용) |
| ⑩~⑪ | 추천/결과 sourceUrl · seed 품질 · shop_view canonical |
| ⑫~⑭ | case·keycap 엔진 축 · recommend **150** / browse **329** (Phase E keycap recommend 18) · `GET /keycaps` |
| ⑮ | inventory recheck alert · E2E schedule · feedback/HTTPS verify · **localhost Phase 2** maintenance rhythm |

**① 정제 규칙:** 할인율-only 행 제거 · 숫자 브랜드 보정 · (category,name) dedupe · Gaming↔Keyboards cross-category dedupe  
**② 분류 family:** switch · plate · foam · layout · case_kit(⑧) · out_of_scope(⑨ ops)  
**③ diff 상태:** `matched` · `name_changed` · `new_in_crawl` · `seed_only`(품절/단종 후보)  
**④ URL:** canonical `https://www.swagkey.kr/shop_view/?idx={id}` — 카테고리만(`/39` 등) 금지  
**⑤ seed merge:** `merge_new_in_crawl_into_seed.py --apply-to-seed`  
**⑥ regression:** `run_swagkey_catalog_regression.py` — ingestion errors=0, extracted=**329**, warnings=**24**, pytest **127** passed (1 skipped)  
**⑧ cases:** `merge_case_kits_into_seed.py` / `merge_inventory_browse_seed.py` — **126** browse cases  
**⑨ full catalog:** `build_swagkey_catalog_full.py` — `inRecommendationPool: false` · **앱 카탈로그 탭에 안 씀**  
**⑭ keycaps:** browse **62** · recommend **18** · `GET /keycaps` · UI 기본 Full/Base **52**  
**⑮ ops:** `verify_ops_quality_15.py` · `audit_recommendation_pool.py` · `audit_catalog_1to1_coverage.py`

### 9.3 스웨그키 링크(sourceUrl) 보정

**문제:** 초기 seed 일부가 `https://www.swagkey.kr/39`처럼 **서브카테고리 목록** URL만 저장 → «스웨그키에서 보기» 클릭 시 상품 그리드만 표시.  
**해결:** `shop_view/?idx=` **상품 상세 URL**로 통일.

| 계층 | 동작 |
|------|------|
| seed 파일 | `fix_swagkey_seed_source_urls.py --apply-to-seed` + 품질 cleanup |
| API 런타임 | `catalog_browse_service` / recommendation `sourceUrls` resolve |
| 잔여 seed_only | fixture recheck 기준 informational **34건** (`catalog_change_alert.txt` · blocking **0**) — layout archetype·단종 후보·미매칭 variant 등 · 자동 삭제 아님 |

**로컬 실행 (DB 불필요, PowerShell):**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
# ①~③
python scripts/clean_swagkey_inventory.py
python scripts/classify_swagkey_inventory.py
python scripts/diff_swagkey_seed_inventory.py
# ④
python scripts/crawl_swagkey_product_urls.py
python scripts/merge_swagkey_inventory_urls.py
python scripts/generate_new_in_crawl_spec_targets.py
python scripts/extract_new_in_crawl_specs.py
# ⑤
python scripts/merge_new_in_crawl_into_seed.py --apply-to-seed
# ⑧
python scripts/merge_case_kits_into_seed.py --apply-to-seed
# ⑨ (ops artifact)
python scripts/build_swagkey_catalog_full.py
# sourceUrl 보정
python scripts/fix_swagkey_seed_source_urls.py --apply-to-seed
# ⑮ 운영 검증 / recheck
python scripts/verify_ops_quality_15.py
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
# 제품 이미지 (§9.4)
python scripts/download_swagkey_images.py
python scripts/audit_catalog_browse_issues.py
# ⑥ 최종 검증
python scripts/run_swagkey_catalog_regression.py --with-frontend
python -m pytest tests -k swagkey -q
```

**외부 크롤 원본 (프로젝트 밖):** `c:\Users\jeung\swagkey_products.csv`, `swagkey_crawler.py` (Selenium, category URL 기반)

---

## 10. 로컬 개발 빠른 시작

```bash
# 1. Postgres
docker compose up -d

# 2. Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt && pip install -e ".[dev]"
copy .env.example .env
alembic upgrade head
uvicorn keyboard_recommender.main:app --reload --app-dir src --port 8010

# 3. Frontend
cd frontend
npm install
copy .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8010 설정
npm run dev

# 4. 테스트
cd backend && pytest                          # 77 test_*.py 모듈 + 버킷
cd frontend && npm test                       # vitest (31 파일)
cd e2e && npm ci && npx playwright install chromium && npm test  # E2E (API 8000)

# 5. (선택) Swagkey 파이프라인 — §9.2 로컬 실행 블록 참고
# 6. 카탈로그 UI 확인: http://localhost:3000/catalog (backend 8010 필요)
# 7. E2E만: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 (start-stack.cjs 기본)
```

---

## 11. Agent 작업 시 주의사항

1. **쿠키/CORS:** `localhost:3000` ↔ `localhost:8010` 조합 사용 (127.0.0.1 혼용 금지)
2. **Production safety:** `APP_ENV=production` → debug API 차단, DEBUG=false 강제
3. **비밀값:** `.env`, `.env.local` 커밋 금지. `NEXT_PUBLIC_*`는 브라우저에 노출됨
4. **Python import:** src layout — `pip install -e ".[dev]"` 또는 `PYTHONPATH=src` 필요
5. **Deterministic tests:** regression/snapshot은 RNG seed 고정 — 임의 변경 시 golden 파일 업데이트 필요
6. **Evaluation persistence:** 기본 off — 테스트에서 override하여 사용
7. **한국어 UI:** 설문 옵션, 버튼, 네비 라벨 등은 한국어
8. **Git:** 커밋은 사용자 요청 시에만
9. **Swagkey 데이터 계층:** 크롤 CSV/MD = 인벤토리 · seed JSON = 추천 풀(trait/spec 포함) · full catalog JSON = **ops 전용**(앱 카탈로그 미노출)
10. **이중 풀 규모 (2026-07-12 localhost Phase 0–2):** browse seed **329** · **게이트 후 recommend** **150** (switch 54 · plate 14 · foam 8 · layout **7** · case 49 · keycap 18) · blocking **0** — `audit_recommendation_pool.py` · browse listable은 `catalog_browse_policy.py` (404/dedup · `browse.listed`)로 family별 상이 — layout browse **30** (archetype 7 + 실 PCB 23)
11. **추천 엔진:** build_selection **6축** (switch·plate·foam·layout·case·keycap) · `responseContractRev: 7`
12. **카탈로그 UI:** `/catalog` **6탭** (스위치·플레이트·폼·**레이아웃**·케이스/키트·키캡) · `GET /layouts` · 액세서리류 UI 금지
13. **인벤토리 파이프라인:** ①~⑨ + Phase 2 ⑩~⑮ 완료 · regression `run_swagkey_catalog_regression.py` · ops `verify_ops_quality_15.py`
14. **스웨그키 링크:** canonical `shop_view/?idx=` — seed + API + frontend normalize
15. **공장윤활 스위치:** 분류 시 `공장윤활`이 윤활 액세서리 키워드와 혼동되지 않도록 Switches category 우선 규칙 적용됨
16. **diff fuzzy match:** 갈축↔흑축 등 variant 충돌 시 pairing 거부 (`pairing_allowed`)
17. **Windows pytest:** `pytest tests/test_swagkey_*.py` glob 실패 시 `python -m pytest tests -k swagkey -q` 사용
18. **Frontend dev:** cmd에서는 `Remove-Item` 대신 `rmdir /s /q .next` — §6.5 참고
19. **카탈로그 카드 UX:** `break-keep` · 제목/설명 고정 높이 · 하단 정렬 · CardHeader `border-b` 제거 (홈 FeatureGrid 동일)
20. **Stitch UI:** Phase 0–6 완료 · Phase 7 Workshop 사이드바 **제거됨** — 상세 `docs/stitch-design-migration.txt`
21. **테마:** 기본 다크(Cyber-Artisan) · 라이트(Luminous Artisan, `Downloads/DESIGN.md`)
22. **헤더:** 네비·검색 `font-body` · 로고·로그인/로그아웃 `font-headline` · 우측 **검색→테마→닉네임→로그인/로그아웃** · Workshop 전역 사이드바 없음
23. **Next dev:** Manifest/`global-error` 오류 → `.next` 삭제 + dev 재시작 + 하드 리프레시
24. **추천 엔진 단일화 (Phase 1~4):** 사용자 «빠른 추천»/ `mode=quick` UI·요청 금지. 프리셋은 `seedAnswers`만. 응답 `runMode: "quick"`는 내부 degraded fallback 표기 — 새 UI/문구에 «빠른 추천» 쓰지 말 것. 로드맵: `docs/recommendation-engine-unification-roadmap.txt`
25. **E2E 스택:** Playwright 기본 `127.0.0.1:3000` + API **8000** (`start-stack.cjs`) · 로컬 dev는 backend **8010** — `NEXT_PUBLIC_API_URL` 혼용 금지
26. **Results lite fallback:** API unreachable 시 `results-lite-compare.tsx` + client engine — **Compare Drawer와 별개** · happy path = backend ranked tabs only
27. **설문 Curator UI (§4.12):** `/recommend` 레이아웃·아이콘·타이포 변경 시 E2E `data-testid`·프리셋 스킵·NL 항상 표시·FULL compute 정책 유지. 아이콘은 `lucide-react` — 커스텀 SVG path 재도입 지양
28. **Results UX (§4.13–4.15):** Phase 0–7 완료. 탭 **2개** (`overview`|`evidence`). `save_compare`·`activity` 탭·Compare Drawer 재도입 금지 — Continue는 `/mypage?section=saved`. 엔진 변경 금지. 로드맵: `docs/results-ux-roadmap.md` (v6.2)
29. **Evidence IA (§4.14):** Phase 0–4 완료. ranking why(switch) pick 카드 concrete · fallback 숨김. 롤백: `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0`
30. **Product Next (§4.16):** Phase 0–4 ✅ · Phase 5 데이터 배선(`home.viewed`) ✅ · 제품 Home revisit 🔒. 마스터: `docs/product-next-phases.md`. Home Dashboard/Workspace/Redirect **금지** until 집계 표본
31. **MyPage:** 개요·저장·계정만. `MyPageComingSoon` 제거. 활동/비교 탭 복원 금지
32. **타이포 (§4.15):** UI 라벨·eyebrow는 **`font-label`** (Hanken Grotesk). `font-mono`는 숫자·디버그만
33. **카탈로그 페이지네이션:** chevron·슬라이딩 라인·루프 애니메이션 재도입 시 infinite update 주의 — `buildPaginationItems` + guarded `setState` 패턴 유지
34. **Remaining Work (§4.9 · `remaining-work-phases.md`):** A–F **구현 ✅** (2026-07-10). 잔여 = B 표본 · F-4 Git(요청 시) · Home revisit(Unlock+Why). Do not: Compare·빠른 추천·가짜 Match%·표본 전 Home Dashboard
35. **Ops webhook:** `CATALOG_CHANGE_ALERT_WEBHOOK_URL` (또는 `OPERATIONAL_ALERT_WEBHOOK_URL`) — **커밋 금지** · CI secret / `.env`만. dry-run: `run_swagkey_inventory_recheck.py --webhook-dry-run`
36. **Feedback Learning:** 기본 `ENABLE_FEEDBACK_LEARNING_MVP=false`. 로컬 검증 `verify_feedback_learning_mvp.py --dry-run-local`. 실 API는 `--base-url http://localhost:8000` (로컬은 **http**, https 아님)
37. **제품 이미지 (§9.4):** browse image audit = **listable** 행 기준 **100%** · mirror `data/swagkey_images/` (**git 커밋 금지**)
38. **Swagkey 1:1 카탈로그 (§4.10):** browse **329** ingestion · recommend 게이트 **150** · blocking **0** · **절대** `merge_* --apply-to-seed` 자동 실행 금지 — dry-run → 운영자 검토. 로드맵: `docs/swagkey-catalog-1to1-roadmap.md` (Phase 0–8 ✅). layout diagram geometry **LOCK** (Alice·Split 60 §4.10 예외 — 2026-07-12 반영)
39. **레이아웃 다이어그램 (§4.10):** `layout-001`~`007` = React Blueprint · mislinked `layout-new-*` 15건은 `browse.listed: false` (Phase 1) · role 강조 유지 · 겹침 테스트 통과 필수
40. **Split 60 (`layout-007`):** 스웨그키 실제 상품 없음 · 참조 배열 전용 · 케이스/키트 링크·`sourceUrl` 없음 · 다이어그램 행별 분리·5행 스페이스·TRRS 잭/케이블 — §4.10
41. **Alice (`layout-006`):** 65% 기반 + 매크로열 · 행별 블록 회전·alignPx 상수 — 운영자 튜닝 반영(2026-07-12) · geometry 임의 변경 금지 — §4.10
42. **Discovery API:** `/api/v1/builds/discovery` **없음** — 재도입 시 Home IA LOCK·Phase 0 Why 필요
43. **Localhost 실행 (§4.9):** `docs/localhost-execution-roadmap.md` — Phase **0–2 ✅** · **지금** = Phase 2 반복(recheck·ops·E2E) · Phase 3–5 = 배포·표본·Unlock 후 · `phase2_blocking_trend.txt`에 blocking 추이 기록 · E2E 연속 실행 시 `PW_REUSE_SERVER=1`

---

## 12. 핵심 파일 인덱스

| 목적 | 파일 |
|------|------|
| Backend 진입점 | `backend/src/keyboard_recommender/main.py` |
| App factory | `backend/src/keyboard_recommender/app_factory.py` |
| 추천 서비스 | `backend/src/keyboard_recommender/application/recommendation_service.py` |
| Trait engine | `backend/src/keyboard_recommender/trait_engine/pipeline.py` |
| Build selection | `backend/src/keyboard_recommender/recommendation_quality/build_selection.py` |
| Settings | `backend/src/keyboard_recommender/config/settings.py` |
| **Avatar upload/storage** | `infrastructure/avatars.py` · `api/v1/auth.py` (`/avatar`) · `data/avatars/` |
| **Avatar (FE)** | `frontend/src/lib/avatar.ts` · `mypage-account.tsx` |
| 카탈로그 시드 | `backend/src/keyboard_recommender/catalog/swagkey_products.seed.json` |
| **인벤토리 정제** | `backend/src/keyboard_recommender/catalog/swagkey_inventory.py` |
| **인벤토리 분류** | `backend/src/keyboard_recommender/catalog/swagkey_inventory_classifier.py` |
| **seed diff** | `backend/src/keyboard_recommender/catalog/swagkey_seed_inventory_diff.py` |
| **crawler v2** | `backend/src/keyboard_recommender/catalog/swagkey_crawler_v2.py` |
| **sourceUrl 보정** | `backend/src/keyboard_recommender/catalog/swagkey_source_url.py` |
| **case seed builder** | `backend/src/keyboard_recommender/catalog/swagkey_case_seed_builder.py` |
| **catalog browse (API)** | `backend/src/keyboard_recommender/application/catalog_browse_service.py` |
| **catalog browse policy** | `backend/src/keyboard_recommender/catalog/catalog_browse_policy.py` |
| **product image mirror** | `backend/scripts/download_swagkey_images.py`, `catalog/swagkey_image_mirror.py` |
| **image URL recheck** | `backend/src/keyboard_recommender/catalog/swagkey_image_url_recheck.py` |
| **local image static** | `app_factory.py` `/media/swagkey-images` · `infrastructure/swagkey_images.py` |
| **catalog thumbnail (UI)** | `frontend/src/components/features/catalog/catalog-part-thumbnail.tsx` |
| **keycaps browse route** | `backend/src/keyboard_recommender/api/v1/keycaps.py` |
| **layouts browse route** | `backend/src/keyboard_recommender/api/v1/layouts.py` |
| **catalog browse (UI)** | `frontend/src/app/catalog/page.tsx`, `frontend/src/components/features/catalog/catalog-browse-view.tsx` |
| **catalog pagination** | `frontend/src/components/features/catalog/catalog-pagination.tsx`, `catalog-pagination.test.ts` |
| **catalog detail panel** | `frontend/src/components/features/catalog/catalog-detail-panel.tsx` |
| **layout diagram** | `frontend/src/components/features/catalog/layout-diagram/` (`definitions` · `layout-diagram.tsx` · `layout-diagram-types.ts`) |
| **layout reference-only helpers** | `frontend/src/lib/layout-catalog-links.ts` (`isReferenceOnlyLayoutArchetype`) |
| **Split 60 sourceUrl policy** | `backend/src/keyboard_recommender/catalog/swagkey_source_url.py` · `layout_diagrams.py` |
| **catalog deep links** | `frontend/src/lib/catalog-links.ts` |
| **home feature grid** | `frontend/src/components/features/home/feature-grid.tsx` |
| **keycap seed builder** | `backend/src/keyboard_recommender/catalog/swagkey_keycap_seed_builder.py` |
| **catalog change alert** | `backend/src/keyboard_recommender/catalog/catalog_change_alert.py` |
| **1:1 coverage audit** | `backend/scripts/audit_catalog_1to1_coverage.py`, `catalog/catalog_1to1_coverage.py` |
| **recommend pool audit** | `backend/scripts/audit_recommendation_pool.py` |
| **browse seed merge** | `backend/scripts/merge_inventory_browse_seed.py` |
| **recommend promote** | `backend/scripts/promote_to_recommendation_pool.py` |
| **catalog regression** | `backend/scripts/run_swagkey_catalog_regression.py` |
| **ops ⑮ verify** | `backend/scripts/verify_ops_quality_15.py` |
| **new_in_crawl targets** | `backend/src/keyboard_recommender/catalog/swagkey_new_in_crawl_targets.py` |
| **인벤토리 데이터** | `backend/data/swagkey_inventory/` |
| **카탈로그 로드 (런타임)** | `backend/src/keyboard_recommender/trait_engine/catalog_sample.py` |
| API v1 router | `backend/src/keyboard_recommender/api/v1/router.py` |
| **Catalog handlers** | `backend/src/keyboard_recommender/api/v1/catalog_handlers.py` |
| **Compatible layout chips** | `frontend/src/components/features/catalog/compatible-layout-chips.tsx` |
| **Runtime API guards** | `frontend/src/components/providers/runtime-api-guards.tsx` |
| **Next config** | `frontend/next.config.ts` (images · `/api`·`/media` proxy) |
| **Swagkey source links** | `frontend/src/lib/swagkey-source-links.ts` |
| **Results lite fallback** | `frontend/src/components/features/recommendation/results/results-lite-compare.tsx` |
| **Session/survey storage** | `frontend/src/lib/saved-result-snapshots.ts` · `survey-storage.ts` · `survey-logic.ts` |
| **NL preference (keycap)** | `frontend/src/nl-preference/` (`keycap-nl-mapping` · Phase E) |
| **Layout page shell** | `frontend/src/components/layout/page-shell.tsx` |
| Frontend layout | `frontend/src/app/layout.tsx` |
| **Design tokens** | `frontend/src/app/globals.css`, `frontend/tailwind.config.ts` |
| **Site header/footer** | `frontend/src/components/layout/site-header.tsx`, `site-footer.tsx`, `header-catalog-search.tsx`, `auth-controls.tsx`, `theme-toggle.tsx` |
| **Home hero** | `frontend/src/components/features/home/hero.tsx` |
| **Home Landing observe** | `frontend/src/components/features/home/home-landing-observe.tsx` (`home.viewed`) |
| **Home page** | `frontend/src/app/page.tsx` (Hero + FeatureGrid · WorkshopStrip 없음) |
| Error boundaries | `frontend/src/app/error.tsx`, `frontend/src/app/global-error.tsx` |
| 설문 정의 | `frontend/src/lib/survey-definition.ts` |
| 설문 wizard | `frontend/src/components/features/recommendation/survey-wizard.tsx` |
| 설문 질문 카드 | `frontend/src/components/features/recommendation/survey-question.tsx` |
| 설문 진행바 | `frontend/src/components/features/recommendation/survey-segmented-progress.tsx` |
| 설문 Lucide 아이콘 | `frontend/src/components/features/recommendation/survey-option-icon.tsx` |
| 설문 페이지 쉘 | `frontend/src/app/recommend/page.tsx` |
| 설문 단계 네비 | `frontend/src/lib/survey-step-navigation.ts` |
| E2E 설문 헬퍼 | `e2e/tests/helpers/survey-flow.ts` |
| E2E results 헬퍼 | `e2e/tests/helpers/results-flow.ts` |
| E2E visual 375 | `e2e/tests/results-visual-375.spec.ts` · `e2e/package.json` `test:visual` |
| 결과 오케스트레이터 | `frontend/src/components/features/recommendation/recommendation-result-view.tsx` |
| **Results UX 컴포넌트** | `frontend/src/components/features/recommendation/results/` (§4.13–4.16) |
| **MyPage** | `frontend/src/components/features/mypage/` (hub/overview/saved/account) |
| **Unified event schema** | `backend/.../unified_pipeline/event_models/schema.py` (`home.viewed` 포함) |
| **Observe aggregate** | `backend/.../unified_pipeline/observe_aggregate.py` · `scripts/report_observe_aggregates.py` |
| **Catalog seed images** | `backend/.../catalog/catalog_seed_images.py` |
| **Evidence 용어** | `frontend/src/lib/keyboard-terminology/trait-axis-labels.ts` |
| API client | `frontend/src/lib/api/client.ts` |
| **Catalog API client** | `frontend/src/lib/api/catalog.ts` |
| E2E survey fixture | `e2e/fixtures/deterministic-survey.json` |
| Regression stable survey | `backend/tests/support/regression.py` |
| CI workflow | `.github/workflows/ci.yml` |
| E2E workflow | `.github/workflows/e2e.yml` |
| Inventory recheck (fixture) | `.github/workflows/swagkey-inventory-recheck.yml` |
| Inventory recheck (live) | `.github/workflows/swagkey-inventory-recheck-live.yml` |
| Catalog alert webhook | `backend/.../catalog/catalog_change_alert_webhook.py` |
| Live inventory pipeline | `backend/scripts/run_swagkey_live_inventory_pipeline.py` |
| Remaining work phases | `docs/remaining-work-phases.md` |

---

## 13. 관련 문서 링크 (repo 내부)

- **Remaining Work Phases (남은 일 마스터):** `docs/remaining-work-phases.md` — A–F 구현 ✅ · B 표본 🔄 (배포 후) · Home revisit 🔒
- **Localhost Execution Roadmap:** `docs/localhost-execution-roadmap.md` — **Phase 0–2 ✅** (2026-07-12) · Phase 2 상시 · Phase 3–6 deploy/observe/Home
- **Product Next Phases (마스터):** `docs/product-next-phases.md` — Phase 0–4 ✅ · Phase 5 데이터 배선 ✅ · 제품 revisit 🔒 (표본 후)
- **Phase 4 Launch 리포트:** `docs/product-next-phase4-launch.md`
- **Phase 5 Home revisit:** `docs/product-next-phase5-home-revisit.md`
- **Home IA LOCK:** `docs/home-ia-locked.md` (Landing · Workspace 삭제 · Revisit When)
- **Home UX 이력:** `docs/home-ux-roadmap.md` (Phase 1–3 · 신규 방향은 LOCK 우선)
- **ChatGPT 피드백 가이드:** `docs/CHATGPT_FEEDBACK_BUNDLE.md` (프롬프트·결과 페이지 기능 지도·첨부 체크리스트)
- **Results UX 로드맵:** `docs/results-ux-roadmap.md` (Phase 0–7 **완료**)
- **Results UX Phase 4 Decision:** `docs/results-ux-phase4-decision.md`
- **Results UX Phase 7 Validation:** `docs/results-ux-phase7-validation-report.md`
- **Evidence Tab Simplification:** `docs/evidence-tab-simplification-roadmap.md` (v1.4, Phase 0–4 **완료**)
- **Evidence Phase 4 Validation:** `docs/evidence-tab-phase4-validation.md`
- **추천 엔진 단일화 로드맵:** `docs/recommendation-engine-unification-roadmap.txt` (Phase 0~4)
- **추천 엔진 단일화 Phase 완료 리포트:** `docs/recommendation-engine-unification-phase0-baseline.txt` · `phase1-complete.txt` · `phase2-complete.txt` · `phase3-complete.txt` · `phase4-complete.txt`
- **Stitch UI 마이그레이션:** `docs/stitch-design-migration.txt` (Phase 0–7)
- **Swagkey 카탈로그 로드맵:** `docs/swagkey-catalog-roadmap.txt` (①~⑮)
- **Swagkey 6탭 1:1 로드맵:** `docs/swagkey-catalog-1to1-roadmap.md` (**Phase 0–8 ✅**, 2026-07-12)
- **Swagkey 제품 이미지 로드맵:** `docs/swagkey-product-images-roadmap.md` (Phase 0–8 **완료**)
- **이미지 mirror 스토리지 정책:** `backend/docs/swagkey-image-storage-policy.md`
- Inventory recheck: `docs/swagkey-inventory-recheck.md`
- Feedback staging: `docs/staging-feedback-learning-mvp.md`
- 환경 설정: `docs/env-configuration.md`
- HTTPS 배포: `docs/production-https.md`
- 테스트 전략: `docs/quality-testing.md`
- Backend 아키텍처: `backend/docs/architecture-guide.md`
- Backend 개발: `backend/docs/developer-guide.md`
- Backend 디버그: `backend/docs/debug-guide.md`
- Backend 운영: `backend/docs/runbook.md`
- DB 스키마: `backend/docs/database-schema.md`
- 카탈로그: `backend/docs/catalog-data-architecture.md`
- Frontend README: `frontend/README.md`
- E2E README: `e2e/README.md`
- **Cursor Agent 규칙 (로컬, gitignore):** `.cursor/rules/swagkey-catalog-1to1.mdc` — 1:1 카탈로그 LOCK · dry-run before seed apply

---

*이 문서는 keyboard-recommender 프로젝트의 전체 파일·구조·기능·설정을 AI Agent 컨텍스트용으로 정리한 것입니다. 코드 변경 시 이 파일도 함께 업데이트하세요.*

**최종 갱신 (2026-07-12, 3차 감사):** localhost Phase 0–2 완료 반영 · browse **329** / recommend **150** / blocking **0** · layout seed **45** (browse **30**) · 이미지 **315/329** raw · listable **100%** · layout PCB **23**건(38 오기 수정) · `observe_aggregate` 경로 · §6.3 클라이언트 유틸 · 누락 테스트·catalog 모듈 · footer 수치 정리(구 331/164 제거).

**이전 주요 마일스톤:** Swagkey 1:1 Phase 0–8 (2026-07-12) · 제품 이미지 Phase 0–8 (2026-07-11) · Product Next 0–4 · Results UX 0–7 · Evidence IA 0–4 (2026-07-10) · Curator 설문 · Stitch UI · 추천 엔진 단일화 · Swagkey ①~⑮.
