# Keyboard Recommender — 프로젝트 전체 컨텍스트

> **용도:** 새 AI Agent 세션을 열 때 이 파일 전체를 붙여넣으면, 지금까지의 작업·구조·규칙을 한 번에 전달할 수 있습니다.  
> **경로:** `c:\Users\jeung\keyboard-recommender`  
> **최종 정리일:** 2026-07-12 (KST)  
> **언어:** 한국어 UI (로그인, 마이페이지, 설문, 추천 근거, 카탈로그 등)  
> **남은 일 Phase:** `docs/remaining-work-phases.md` — **A–F 구현 ✅** · B 표본 🔄 · F-4 Git 요청 시 · Home 제품 revisit 🔒

---

## 1. 프로젝트 한 줄 요약

**커스텀 키보드(스위치·플레이트·폼·레이아웃·케이스·키캡) 추천 웹 서비스** 모노레포.  
사용자 설문 + 자연어 선호 → FastAPI 추천 엔진(6축) → Next.js 결과 UI. Swagkey 카탈로그·인벤토리 파이프라인 포함.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, next-themes, **lucide-react**, Vitest |
| **Backend** | FastAPI, SQLAlchemy 2, PostgreSQL 16, Alembic, Pydantic Settings, Ruff, pytest |
| **E2E** | Playwright (TypeScript), Chromium |
| **Infra (로컬)** | Docker Compose (PostgreSQL만) |
| **CI** | GitHub Actions — 5개 병렬 job + catalog 1:1 coverage audit (warning) |
| **Python** | 3.11–3.13 (`>=3.11,<3.14`) |

---

## 3. 모노레포 디렉터리 구조

```
keyboard-recommender/
├── README.md
├── pytest.ini                    # 루트에서 pytest → backend/tests
├── docker-compose.yml            # Postgres 16만 (backend/frontend 컨테이너 없음)
├── run_all_swagkey_pipeline.cmd  # Swagkey 전체 8단계 파이프라인 (Windows)
├── run_swagkey_compat_pipeline.cmd
├── .env.example                  # backend/.env + frontend/.env.local 안내
├── docs/
│   ├── PROJECT_CONTEXT.md        # ← 이 파일
│   ├── remaining-work-phases.md  # 남은 일 Phase A–F · 구현 ✅ · B 표본·F-4·Home revisit만 잔여
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
│   ├── env-configuration.md
│   ├── production-https.md       # ⑮ production HTTPS 체크리스트
│   └── quality-testing.md
├── .github/workflows/
│   ├── ci.yml                    # PR/push 5-job gate
│   ├── e2e.yml                   # schedule + path-filtered PR + workflow_dispatch
│   ├── swagkey-inventory-recheck.yml # 주간 fixture recheck + optional webhook
│   └── swagkey-inventory-recheck-live.yml # 월간 live pipeline + failure notify
├── backend/                      # FastAPI + 추천 엔진 + 카탈로그
│   ├── data/
│   │   ├── swagkey_inventory/    # 크롤 CSV·정제 JSON·diff·alert·image artifacts (§9.2–9.4)
│   │   ├── swagkey_images/       # mirror 썸네일 바이너리 (.gitignore · §9.4)
│   │   └── swagkey_html_cache/   # spec scrape HTML (~64)
│   └── scripts/                  # clean / classify / diff / ops verify 포함
├── frontend/                     # Next.js 웹앱
└── e2e/                          # Playwright E2E
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
  · Overview: 6축 First View · CTA(**저장**) · 대안 · discovery · «저장한 빌드 보기» 링크  
  · Evidence: pick 설득(why · ranking why concrete · tradeoff 조건부) · MetricGuide·18축 `<details>` 접힘  
  · **Compare Drawer 제거** (재도입 금지) · stale sessionStorage 재조회 (`responseContractRev: 7`)  
  · `degradedReason` 시 «안정 모드로 추천했어요» 배너
- [x] **홈 Landing** (`/`) — Hero + FeatureGrid · `WorkshopStrip` 삭제 · `home.viewed` 관측 (§4.16) · Dashboard/Redirect **LOCK**
- [x] **커뮤니티 용어 해석** — `POST /api/v1/terminology/interpret` + 프론트 `keyboard-terminology/` 모듈
- [x] **커뮤니티 디스커버리** — `GET /api/v1/builds/discovery` (트렌딩 빌드, 조합, 프로필)
- [x] **스타일 프리셋** — 설문 시작 시 «부드럽고 조용한 성향» 등 3종; `seedAnswers`로 답변 시드 후 **첫 미응답 단계**로 진입 (Phase 3)
- [x] **«빠른 추천»(mode=quick) UI 제거** (Phase 1) — 프리셋은 설문 시드만, compute 생략 없음

### 4.2 인증 & 계정

- [x] 회원가입 (이메일 인증 코드 필수)
- [x] 로그인 / 로그아웃 / 전체 세션 로그아웃
- [x] 비밀번호 재설정 (이메일 → 토큰 → 확인)
- [x] 표시 이름 변경 + 중복 확인
- [x] 비밀번호 변경, 보안 요약
- [x] **쿠키 기반 세션** (`kr_session`) — API origin에 설정, `credentials: "include"`
- [x] DB 마이그레이션: users, auth_sessions, email_verifications, password_resets (004–006)

### 4.3 마이페이지

- [x] `/mypage` — **개요 · 저장한 빌드 · 계정** 3탭 (활동/비교 탭 제거 · Continue는 `?section=saved`)
- [x] 북마크 저장/목록/삭제 · master–detail · «추천 결과 다시 보기» (API + 게스트 localStorage 폴백)
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
- [x] Alembic 마이그레이션 001–006 (카탈로그 + eval + auth)
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
  · **0–4:** `og:image` 추출 → `swagkey_product_images.json` (285) → inventory **v3** 287/293 → seed **167/179** `imageUrl`
  · **5–6:** API `imageUrl` · FE `catalog-part-thumbnail` · `cdn.imweb.me` remotePatterns
  · **6.5–6.6:** browse 정책 (`catalog_browse_policy.py`) — idx dedup · HTTP 404 **12 idx** 제외 · 레이아웃 archetype sanitize · fuzzy 이미지 merge 금지
  · **7:** 로컬 mirror `data/swagkey_images/{idx}.{ext}` · `/media/swagkey-images` · `download_swagkey_images.py` · 정책 `backend/docs/swagkey-image-storage-policy.md`
  · **8:** recheck `--check-image-urls` · `imageUrlChanged` alert (schema **1.1.0**) · `swagkey_image_url_recheck.py`
  · (선택) recommendation **picks** `imageUrl` · Overview 6축 썸네일 — **✅** (2026-07-11)
  · (선택 미착수) E2E 썸네일 스냅샷

- [x] **Swagkey 6탭 카탈로그 1:1** (2026-07-11~12) — `docs/swagkey-catalog-1to1-roadmap.md` **Phase 0–8 ✅** · browse/recommend **이중 풀** · §4.10
- [x] **레이아웃 다이어그램 (Blueprint)** (2026-07-10~12) — 정적 SVG → React `LayoutDiagram` 7종 · role 강조 · Alice 회전 튜닝 · Split 60 잭/케이블 · `layout-007` 참조 전용 정책 — §4.10

**현재 이중 풀 규모 (2026-07-12, `audit_recommendation_pool.py`):**

| family | browse (`/catalog`) | recommend (`/results`) | 비고 |
|--------|---------------------|------------------------|------|
| switch | 68 | 67 | browse = 404 idx 제외·dedup 후 |
| plate | 20 | 14 | |
| foam | 10 | 9 | |
| layout | 45 | 7 | browse = archetype **7** + 실 PCB **38** · recommend = archetype only |
| case | 126 | 49 | Phase 3 browse merge |
| keycap | 62 | 18 | UI 기본 필터 Full/Base **52** · `subtype=all` **62** |

- **seed ingestion:** `swagkey_products.seed.json` — **331** rows (`run_swagkey_catalog_regression.py`)
- **게이트:** `catalog_sample.is_recommendation_eligible_row` · `promote_to_recommendation_pool.py` (dry-run 기본)
- **검증:** `run_swagkey_catalog_regression.py` — **126** pytest passed (2026-07-12)

**이미지 (2026-07-10~11):** seed `imageUrl` **318/331** (96%) · local mirror `data/swagkey_images/` · `audit_browse_image_coverage.py`

**Full catalog JSON (ops 전용, UI 미노출):** `swagkey_catalog_full.json` **153**건 — API `GET /catalog/full` 유지 · 프론트 browse는 seed **6탭**만

**inventory vs browse gap (coverage warning CI):** switch/keycap/layout 일부 family는 inventory 재크롤 전 gap 존재 — `audit_catalog_1to1_coverage.py --check-threshold --warn-only` (Phase 7)

### 4.7 Frontend 부가 기능

- [x] **카탈로그 브라우징** (`/catalog`) — **6탭**(스위치·플레이트·폼·레이아웃·케이스/키트·키캡) · 카드 정렬/줄바꿈 UX · 페이지 전환 시 상단 스크롤
- [x] **홈 Feature Grid** — 동일 **6카테고리** 카드 → 카탈로그 deep link (`xl:grid-cols-6`)
- [x] 다크/라이트/시스템 테마 (`next-themes`, **기본 다크**)
- [x] Internal Debug UI (`/debug/*`) — `NEXT_PUBLIC_INTERNAL_DEBUG=1` 게이트
- [x] A/B 실험 할당 (`experiments.ts`) → 이벤트에 첨부
- [x] API 미연결 시 mock/engine 폴백
- [x] Mixed content 경고 (HTTPS 페이지 + HTTP API)

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

> **마스터 로드맵:** `docs/results-ux-roadmap.md` (v6.1)  
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
| 추천 요약 | 6축 · 저장 CTA · 대안 · discovery · **마이페이지 저장 링크** (`/mypage?section=saved`) |
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
| `results-overview-tab.tsx` | 6축 · CTA · 대안 · discovery |
| `results-evidence-tab.tsx` | Evidence pick·profile·context |
| `results-evidence-pick-card.tsx` | pick why · ranking why · tradeoff |
| `results-evidence-ranking-why-content.ts` | ranking gap 로직 · 카피 |
| `results-ranking-thresholds.ts` | gap threshold (LOCKED 0.04) |
| `results-trait-display.ts` | 14축 → 6축 매핑 (LOCKED) |
| `results-text-utils.ts` | `formatEvidenceWhyLine` · `formatEvidenceTradeoff` |
| `results-tab-shell.tsx` | Backend/Lite 탭 바 (`overview` \| `evidence` 2탭) |
| ~~`compare-drawer.tsx`~~ | **제거됨** — Compare 재도입 금지 |
| ~~`comparison-hub.tsx`~~ | **제거·미사용** |
| `results-quality-diagnostics.tsx` | 품질 요약 (`e2e-quality-diagnostics`, legacy) |

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

- [x] **6번째 탭 «레이아웃»** — `GET /api/v1/layouts` · seed 22건 · `?family=layout` · 홈 FeatureGrid·Overview «레이아웃 카탈로그» 링크
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
| **0** Home teardown | ✅ | `WorkshopStrip` 제거 · `workshop-strip.tsx` 삭제 · Hero → FeatureGrid → Footer |
| **1** Results | ✅ | 로드맵 vs 코드 감사 · 추가 구현 Task 없음 · Compare 미복원 |
| **2** Evidence | ✅ | 유지/갭만 · ranking-why **concrete**를 pick 카드에 재연결 · fallback UI 숨김 · `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0` |
| **3** MyPage | ✅ | 개요·저장·계정 스모크 · `MyPageComingSoon` 삭제 · Vitest + E2E hub |
| **4** Launch·Data | ✅ | DoD 확인 · Observe 목록 갱신 · Compare 이벤트 UI 비활성 명시 · `docs/product-next-phase4-launch.md` |
| **5** Home revisit | ⚠️ 부분 | 데이터 배선 ✅ · Observe 인프라 ✅ (remaining-work **B**) · **표본 🔄** · Redirect/Dashboard/dual Hero **🔒 LOCK** |

**Phase 5 상세**

- [x] `home.viewed` — unified event 스키마 + `emitHomeViewedEventBestEffort` · `HomeLandingObserve` (세션당 1 · guest/auth)
- [x] Home Landing IA 유지 (Dashboard/Workspace 없음)
- [x] Observe 집계 인프라 — `observe_aggregate.py` · `report_observe_aggregates.py` · Unlock 기준(14일/50) 문서화 (`remaining-work-phases.md` Phase B)
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

- [x] Backend: **90+** pytest (regression, snapshot, contract, catalog browse, keycaps, **swagkey/ops**)
- [x] Frontend: Vitest **catalog contract 등** (딥링크 `?family=` 형식)
- [x] E2E: Playwright — `e2e.yml` **주간 schedule + path-filtered PR + workflow_dispatch** (수동 전용 해제)
- [x] CI 5-pillar: regression / contract / unit / frontend / e2e
- [x] Deterministic regression (`random.seed(20260505)`)
- [x] Inventory recheck workflow — fixture 주간 (`swagkey-inventory-recheck.yml`) · live 월간 (`swagkey-inventory-recheck-live.yml`) · optional webhook secret

### 4.9 아직 스텁/미구현 · 잔여 관측

> **남은 일 Phase 마스터:** `docs/remaining-work-phases.md` (v1.6)  
> **구현 Task A–F:** ✅ 2026-07-10 완료. 아래는 **코딩 밖 잔여**만.

#### Remaining-work Phase 구현 상태

| Phase | 상태 | 비고 |
|-------|------|------|
| **A** Close-out | ✅ | Owner Top 3 재서명 · 375px QA (Vitest/E2E) |
| **B** Observe | ✅ 인프라 · 🔄 표본 | Unlock 14일/≥50 `home.viewed` · guest+auth · `unlock_ready` 전 **제품 UI LOCK** |
| **C** Analytics | ✅ | funnel CLI/CSV · Compare 성공지표 제외 |
| **D** Visual 375 | ✅ | `e2e/tests/results-visual-375.spec.ts` · `npm run test:visual` |
| **E** Keycap | ✅ | curated 12→18 · survey/NL 축 · seed 179 |
| **F** Ops | ✅ F-1~F-3 · ⏸ F-4 | live pipeline · webhook · Feedback dry-run · **F-4 Git은 요청 시만** |

#### 아직 남은 것 (이 섹션의 실질 잔여)

- [ ] **Phase B 표본** — `ENABLE_EVALUATION_PERSISTENCE=true`로 이벤트 축적 후 `report_observe_aggregates` / Unlock 기준 충족 대기
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

#### 1:1 browse 풀 (seed, 2026-07-12)

| family | browse | recommend | 비고 |
|--------|--------|-----------|------|
| switch | 68 | 67 | |
| plate | 20 | 14 | |
| foam | 10 | 9 | |
| layout | 45 | 7 | browse = archetype 7 + 실 PCB 38 · recommend = archetype only |
| case | 126 | 49 | |
| keycap | 62 | 18 | UI 기본 필터 Full/Base **52** |

- **seed:** `swagkey_products.seed.json` — ingestion **331** rows
- **게이트:** `catalog_sample.is_recommendation_eligible_row` · `audit_recommendation_pool.py`
- **운영:** `catalog_change_alert` tier (Phase 7) · `audit_catalog_1to1_coverage.py --check-threshold` (warning CI)
- **검증:** `python scripts/run_swagkey_catalog_regression.py` (126 pytest)

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
| **3** | `merge_inventory_browse_seed.py` — browse seed **331** (case 126 · keycap 62 등) |
| **4** | 이미지 mirror · spec scrape queue · `browse_image_coverage` |
| **5** | 카탈로그 UI — 레이아웃 「참조 배열」/「기판 상품」 · keycap Full/Base/Addon 필터 · `referenceLayout` API |
| **6** | `recommendationEligible` 게이트 · `audit_recommendation_pool.py` |
| **7** | alert tier (blocking/informational) · coverage threshold CI warning · diff `recommendation_eligible` |
| **8** | `run_swagkey_catalog_regression.py` 126 pytest · snapshot/contract 갱신 · 문서 마감 |

#### 카탈로그 UI (Phase 5, `/catalog`)

- 레이아웃 탭: `referenceLayout: true` → 참조 배열 7건 (다이어그램) · 실 PCB 38건 별도 섹션
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
| `layout-trait-chips.tsx` · `layout-diagram-callouts` | 카드 칩 · hover 교육 문구 |

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

#### Recommendations — `/api/v1/recommendations`
| Method | Path | 설명 |
|--------|------|------|
| POST | `/compute` | **핵심** — 설문 → 추천 빌드 |
| POST | `/events` | 통합 이벤트 수집 |
| POST | `/saved` | 북마크 저장 |
| GET | `/saved` | 북마크 목록 |
| POST | `/saved/remove` | 북마크 삭제 |
| POST | `/saved/update` | 북마크 메모 수정 |
| GET | `/activity` | 활동 타임라인 |
| GET | `/nl-vocab-candidates` | 미등록 NL 토큰 후보 |
| POST | `/activity/remove` | 활동 삭제 |

#### Terminology — `/api/v1/terminology`
| Method | Path |
|--------|------|
| POST | `/interpret` |

#### Builds — `/api/v1/builds`
| Method | Path |
|--------|------|
| GET | `/discovery` |

#### Catalog — `/api/v1/switches`, `/plates`, `/foam`, `/cases`, `/keycaps`
| Method | Path | 설명 |
|--------|------|------|
| GET | `/switches` | 스위치 목록 (`?subtype=linear` · `?q=` · limit/offset) |
| GET | `/switches/{id}` | 스위치 상세 (traits, metadata, sourceUrl) |
| GET | `/plates` | 플레이트 목록 |
| GET | `/plates/{id}` | 플레이트 상세 |
| GET | `/foam` | 폼 목록 |
| GET | `/foam/{id}` | 폼 상세 |
| GET | `/layouts` | 레이아웃 목록 (`?q=` · limit/offset) |
| GET | `/layouts/{id}` | 레이아웃 상세 |
| GET | `/cases` | 케이스/키트 목록 (`?subtype=kit` 등) |
| GET | `/cases/{id}` | 케이스/키트 상세 |
| GET | `/keycaps` | 키캡 목록 (seed curated **18**건) |
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

### 5.4 DB 모델 (24 테이블)

**카탈로그:**
- `recommendation_traits`, `switches`, `switch_trait_scores`
- `plates`, `plate_trait_scores`
- `foam_configs`, `foam_config_trait_scores`
- `keyboard_layouts`, `keyboard_layout_trait_scores`
- `keyboard_cases`, `keyboard_case_trait_scores`

**인증:**
- `users`, `auth_sessions`, `auth_email_verifications`, `auth_password_resets`

**평가 영속:**
- `eval_recommendation_runs`, `eval_snapshots`, `eval_metrics`, `eval_diagnostics`
- `eval_confidence_samples`, `eval_benchmark_runs`, `eval_events`

**마이그레이션:** `001` → `002` → `003` → `004` → `005` → `006`

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

### 5.6 Backend 테스트 (45+ 모듈)

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
| **Keycap seed / compat** | `test_keycap_seed_builder.py`, `test_keycap_compatibility_rules.py` |
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
| `/` | 공개 | 홈 Landing — Hero(«추천 설문 시작») + Feature Grid (WorkshopStrip 제거) |
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
| | `RecommendationResultView` | 오케스트레이터 · 탭·북마크·discovery · `degradedReason` (Compare Drawer 제거) |
| | `results/*` | Overview · Evidence · Trust Layer · Header · Quality (§4.13–4.16) |
| `features/mypage/` | `MyPageHub` | 개요·저장·계정 · `?section=` URL 동기화 · Continue 본진 (`activity`→`saved`) |
| `features/catalog/` | `CatalogBrowseView` | **6탭**·subtype 필터·검색(개수 행)·`CatalogPagination`·glass 카드 |
| | `CatalogPagination` | `01` 형식 숫자 페이지네이션 · ellipsis |
| | `CatalogDetailPanel` | traits · metadata · 스웨그키 링크 · 모달 닫기 |
| `features/home/` | `Hero`, `FeatureGrid`, `HomeLandingObserve`, `HomeWorkshopPreview` | Landing · CTA · `home.viewed` (§4.16) · WorkshopStrip 삭제 |
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
| `discovery.ts` | `GET /builds/discovery` |
| **`catalog.ts`** | **`GET /switches|plates|foam|layouts|cases|keycaps`** (seed browse만; full catalog 클라이언트 제거됨) |
| `catalog-links.ts` | `/catalog?family=&subtype=&q=` deep link |
| `onboarding-events.ts` | 온보딩/KPI/Results UX/`home.viewed` (`home_landing_v1` · `results_ux_v1`: `results_tab_click`) |
| `debug-api.ts` | Browser debug API (`X-Internal-Debug-Token`) |
| `debug-api-server.ts` | Server component debug API |

**Base URL:** `NEXT_PUBLIC_API_URL` (예: `http://localhost:8010`)  
**중요:** 브라우저 호스트와 API URL 호스트 일치 필수 (`localhost` vs `127.0.0.1` — 쿠키 공유 안 됨)

**Dev proxy 옵션:** `INTERNAL_API_PROXY_TARGET` → Next.js가 `/api/*`를 backend로 rewrite

### 6.4 클라이언트 사이드 엔진 (API 폴백용)

| 모듈 | 역할 |
|------|------|
| `recommendation-engine/` | trait → user vector → dot product scoring |
| `keyboard-terminology/` | 커뮤니티 용어 → trait delta · **결과 Evidence 24축 라벨** (`trait-axis-labels.ts`) |
| `nl-preference/` | NL 파서 → engine traits |
| `recommendation-mock.ts` | UI-facing `RecommendedBuild` 래퍼 |

### 6.5 Frontend 테스트 (Vitest)

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
├── playwright.config.cjs       # baseURL: 127.0.0.1:3000, CI: workers=1, retries=2
├── scripts/start-stack.cjs     # uvicorn + next; CI에서는 pip install skip
├── fixtures/deterministic-survey.json
└── tests/
    ├── auth.setup.ts           # e2e-ci@keyboard.local 로그인 → storage state 저장
    ├── critical-flows.spec.ts  # 온보딩→프리셋 스킵→설문→결과→저장→비교→마이페이지
    ├── recommendation-survey.spec.ts
    └── recommendation-nlp.spec.ts
```

**E2E 유저:** `e2e-ci@keyboard.local` / `E2e_test!9` (환경변수로 override 가능)

**E2E workflow (`.github/workflows/e2e.yml`):** schedule(주간) + path-filtered `pull_request` + `workflow_dispatch`  
**Inventory recheck:** fixture 주간 (`.github/workflows/swagkey-inventory-recheck.yml`) · live 월간 (`.github/workflows/swagkey-inventory-recheck-live.yml`) · secret `CATALOG_CHANGE_ALERT_WEBHOOK_URL`

### 7.2 CI Jobs (`.github/workflows/ci.yml`)

| Job | 검증 내용 |
|-----|-----------|
| `quality-regression` | recommendation_regression, snapshot, benchmark |
| `quality-contract` | API contract tests |
| `quality-unit` | Ruff, Alembic, schema smoke, unit/integration · ops scripts(alert/feedback/HTTPS) |
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
| `SCALING_PROFILE` | `medium` | low/medium/high/custom |
| `INTERNAL_DEBUG_API_ENABLED` | — | debug API 게이트 |
| `INTERNAL_DEBUG_TOKEN` | — | debug API 토큰 |
| `AUTH_COOKIE_SECURE` | tier별 자동 | |
| `EMAIL_PROVIDER` | smtp | smtp/resend |

> **주의:** Settings는 CWD 무관하게 `backend/.env` 절대경로 로드 (Alembic 포함)

### 8.2 Frontend (`frontend/.env.local`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | **Yes** | API origin (브라우저 호스트와 일치) |
| `INTERNAL_API_PROXY_TARGET` | Optional | dev proxy |
| `INTERNAL_DEBUG_TOKEN` | Optional | server-only debug token |
| `NEXT_PUBLIC_INTERNAL_DEBUG` | Optional | `1` → `/debug` 노출 |

---

## 9. Swagkey 데이터 파이프라인

Swagkey 연동은 **세 갈래**로 나뉩니다.

1. **인벤토리 파이프라인 ①~⑨ + Phase 2 ⑩~⑮ + 1:1 Phase 0–8** — 크롤 → browse seed 331 → 추천 풀 게이트 → 운영 알림  
2. **Spec 스크래핑 (§9.1)** — seed row의 `sourceUrl`로 HTML spec 추출·trait 보강  
3. **제품 이미지 파이프라인 (§9.4)** — `og:image` → seed/API/UI · browse 정책 · local mirror · recheck drift

```
[크롤 CSV/MD] ──①~③──▶ inventory / candidates / diff
                              │
                              ▼ (new_in_crawl → dry-run merge · never auto-apply)
[URL + spec scrape] ──④~⑥──▶ swagkey_products.seed.json (331 ingestion)
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
| `swagkey_product_images.json` | productId → `imageUrl` (**285** unique) |
| `product_image_html_cache/` | 이미지 fetch HTML 캐시 (`{idx}.html`) — fixture recheck 입력 |
| `data/swagkey_images/` | 로컬 mirror (**141** files · git 제외) |
| `swagkey_image_mirror_report.json` | mirror 다운로드 리포트 |
| `image_url_recheck_report.json` | seed vs refetched `og:image` diff |
| `catalog_browse_audit_report.json` | browse shared/missing image 감사 |

**핵심 모듈:** `swagkey_image_extractor.py` · `swagkey_image_merge.py` · `swagkey_image_mirror.py` · `swagkey_image_url_recheck.py` · `catalog_browse_policy.py` · `infrastructure/swagkey_images.py`

**browse 정책 (Phase 5–6):** `idx` dedup · `BROWSE_EXCLUDED_SWAGKEY_IDX` (404 12건) · layout archetype `referenceLayout` + diagram sanitize · 실 PCB browse 허용 · recommend는 archetype만

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
| `swagkey_product_images.json` | `extract_swagkey_images_from_cache.py` + `extract_swagkey_product_images.py` | productId → imageUrl (**285** unique) |
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
| `catalog_browse_policy.py` | browse dedup · 404 exclude · layout archetype |
| `swagkey_image_merge.py` | image artifact → seed merge (fuzzy_name 금지) |
| `infrastructure/swagkey_images.py` | local mirror path resolve · `/media/swagkey-images` |
| `swagkey_catalog_regression.py` | ⑥ ingestion dry-run 검증 + regression 리포트 |
| **`swagkey_source_url.py`** | **상품 상세 URL 판별·seed URL 보정 (`SwagkeyUrlResolver`)** |
| `application/catalog_browse_service.py` | seed → browse DTO (switch|plate|foam|**layout**|case|**keycap**) |
| `application/full_catalog_browse_service.py` | full catalog JSON → browse DTO (ops API) |
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
| ⑫~⑭ | case·keycap 엔진 축 · seed **179** (Phase E keycap 18) · `GET /keycaps` |
| ⑮ | inventory recheck alert · E2E schedule · feedback/HTTPS verify |

**① 정제 규칙:** 할인율-only 행 제거 · 숫자 브랜드 보정 · (category,name) dedupe · Gaming↔Keyboards cross-category dedupe  
**② 분류 family:** switch · plate · foam · layout · case_kit(⑧) · out_of_scope(⑨ ops)  
**③ diff 상태:** `matched` · `name_changed` · `new_in_crawl` · `seed_only`(품절/단종 후보)  
**④ URL:** canonical `https://www.swagkey.kr/shop_view/?idx={id}` — 카테고리만(`/39` 등) 금지  
**⑤ seed merge:** `merge_new_in_crawl_into_seed.py --apply-to-seed`  
**⑥ regression:** `run_swagkey_catalog_regression.py` — ingestion errors=0, extracted=**331**, pytest **126** passed  
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
| 잔여 seed_only | ≈21건 (layout·foam variant·미매칭 switch) — 알림 대상, 자동 삭제 아님 |

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
cd backend && pytest                          # backend 전체
cd frontend && npm test                       # vitest
cd e2e && npm ci && npx playwright install chromium && npm test  # E2E

# 5. (선택) Swagkey 파이프라인 — §9.2 로컬 실행 블록 참고
# 6. 카탈로그 UI 확인: http://localhost:3000/catalog (backend 8010 필요)
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
10. **추천 풀 규모:** seed **179** (switch 67 · plate 14 · foam 9 · layout 22 · case 49 · keycap 18)
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
25. **E2E 스택:** Playwright 기본은 `127.0.0.1:3000` + `127.0.0.1:8000` — dev가 다른 API 포트를 쓰면 로그인/설문 실패 가능
26. **설문 Curator UI (§4.12):** `/recommend` 레이아웃·아이콘·타이포 변경 시 E2E `data-testid`·프리셋 스킵·NL 항상 표시·FULL compute 정책 유지. 아이콘은 `lucide-react` — 커스텀 SVG path 재도입 지양
27. **Results UX (§4.13–4.15):** Phase 0–7 완료. 탭 **2개** (`overview`|`evidence`). `save_compare`·`activity` 탭·Compare Drawer 재도입 금지 — Continue는 `/mypage?section=saved`. 엔진 변경 금지. 로드맵: `docs/results-ux-roadmap.md` (v6.2)
28. **Evidence IA (§4.14):** Phase 0–4 완료. ranking why(switch) pick 카드 concrete · fallback 숨김. 롤백: `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0`
29. **Product Next (§4.16):** Phase 0–4 ✅ · Phase 5 데이터 배선(`home.viewed`) ✅ · 제품 Home revisit 🔒. 마스터: `docs/product-next-phases.md`. Home Dashboard/Workspace/Redirect **금지** until 집계 표본
30. **MyPage:** 개요·저장·계정만. `MyPageComingSoon` 제거. 활동/비교 탭 복원 금지
31. **타이포 (§4.15):** UI 라벨·eyebrow는 **`font-label`** (Hanken Grotesk). `font-mono`는 숫자·디버그만
32. **카탈로그 페이지네이션:** chevron·슬라이딩 라인·루프 애니메이션 재도입 시 infinite update 주의 — `buildPaginationItems` + guarded `setState` 패턴 유지
33. **Remaining Work (§4.9 · `remaining-work-phases.md`):** A–F **구현 ✅** (2026-07-10). 잔여 = B 표본 · F-4 Git(요청 시) · Home revisit(Unlock+Why). Do not: Compare·빠른 추천·가짜 Match%·표본 전 Home Dashboard
34. **Ops webhook:** `CATALOG_CHANGE_ALERT_WEBHOOK_URL` (또는 `OPERATIONAL_ALERT_WEBHOOK_URL`) — **커밋 금지** · CI secret / `.env`만. dry-run: `run_swagkey_inventory_recheck.py --webhook-dry-run`
35. **Feedback Learning:** 기본 `ENABLE_FEEDBACK_LEARNING_MVP=false`. 로컬 검증 `verify_feedback_learning_mvp.py --dry-run-local`. 실 API는 `--base-url http://localhost:8000` (로컬은 **http**, https 아님)
36. **제품 이미지 (§9.4):** seed `imageUrl`은 CDN source of truth · mirror는 `data/swagkey_images/` (**git 커밋 금지**) · browse/recommend **이중 풀**로 목록 건수 다름 · live `imageUrlChanged` 후 seed/mirror **수동** 갱신
37. **Swagkey 1:1 카탈로그 (§4.10):** browse = seed 전체(331) · recommend = `recommendationEligible`만 · **절대** `merge_* --apply-to-seed` 자동 실행 금지 — dry-run → 운영자 검토. 로드맵: `docs/swagkey-catalog-1to1-roadmap.md` (Phase 0–8 ✅). layout diagram geometry **LOCK** (Alice·Split 60 §4.10 예외 — 2026-07-12 반영)
38. **레이아웃 다이어그램 (§4.10):** `layout-001`~`007` = React Blueprint · `layout-new-*` = Swagkey 사진 · role 강조 유지 · 겹침 테스트 통과 필수
39. **Split 60 (`layout-007`):** 스웨그키 실제 상품 없음 · 참조 배열 전용 · 케이스/키트 링크·`sourceUrl` 없음 · 다이어그램 행별 분리·5행 스페이스·TRRS 잭/케이블 — §4.10
40. **Alice (`layout-006`):** 65% 기반 + 매크로열 · 행별 블록 회전·alignPx 상수 — 운영자 튜닝 반영(2026-07-12) · geometry 임의 변경 금지 — §4.10

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
| 결과 오케스트레이터 | `frontend/src/components/features/recommendation/recommendation-result-view.tsx` |
| **Results UX 컴포넌트** | `frontend/src/components/features/recommendation/results/` (§4.13–4.16) |
| **MyPage** | `frontend/src/components/features/mypage/` (hub/overview/saved/account) |
| **Unified event schema** | `backend/.../unified_pipeline/event_models/schema.py` (`home.viewed` 포함) |
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

- **Remaining Work Phases (남은 일 마스터):** `docs/remaining-work-phases.md` — A–F 구현 ✅ · B 표본 🔄 · F-4 Git 요청 시 · Home revisit 🔒
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

---

*이 문서는 keyboard-recommender 프로젝트의 전체 파일·구조·기능·설정을 AI Agent 컨텍스트용으로 정리한 것입니다. 코드 변경 시 이 파일도 함께 업데이트하세요.*  
*최종 갱신 (2026-07-12): **§4.10 레이아웃 다이어그램 Blueprint** — React 7종 geometry · Alice 회전 튜닝 · Split 60 잭/케이블 · `layout-007` 참조 전용 정책 · archetype vs `layout-new-*` 이미지 분리.*
*최종 갱신 (2026-07-12): **§4.6·§4.10 Swagkey 6탭 1:1 Phase 0–8 sign-off** — browse/recommend 이중 풀(331 ingestion) · Phase 5 UI · Phase 6–7 게이트·alert tier · Phase 8 regression 126 pytest · 주기 운영 절차 · `docs/swagkey-catalog-1to1-roadmap.md`.*  
*최종 갱신 (2026-07-11): **§9.4 Swagkey 제품 이미지 Phase 0–8 완료** — API/FE 썸네일 · browse 정책(6.5–6.6) · local mirror · `imageUrlChanged` recheck · `PROJECT_CONTEXT` 파일 인덱스·ops 명령 갱신.*  
*이전 (2026-07-10): **§4.16 Product Next Phases** — Phase 0–4 완료 · Phase 5 `home.viewed` 데이터 전제 · Home Landing LOCK · ranking-why pick 재연결 · MyPage 스모크.*  
*이전 (2026-07-10): **§4.15 Results·Catalog·Header UX Polish** — activity 탭 제거·탭 2개·`font-label`·헤더 인증 순서·카탈로그 6탭(레이아웃)·숫자 페이지네이션·검색·개수 동일 행.*  
*이전 (2026-07-10): **Evidence IA Phase 0–4 완료** — 공통 신뢰 레이어·pick 설득·ranking why (§4.14).*  
*이전 (2026-07-09): **Results UX Phase 0–7 완료** — 컴포넌트 분리·Overview·CTA·Drawer·Evidence·IA·모바일·polish·Validation 리포트 (§4.13).*  
*이전 (2026-07-09): 설문 Curator UI 리디자인 — 뷰포트 고정·가로/세로 채움·프리셋 2줄 배너·NL 항상 표시·Lucide 아이콘(`lucide-react`)·카드 타이포 확대 (§4.12).*  
*이전 (2026-07-09): 추천 엔진 단일화 Phase 1~4 · 프리셋 스킵 · resilient degraded · quick UI 제거.*  
*이전 (2026-07-09): Stitch UI Phase 0–6 · Phase 7 사이드바 제거 · Luminous 라이트 토큰 · 헤더/홈 CTA · error boundaries.*  
*이전 (2026-07-08): Phase 2 ⑩~⑮ · 추천 6축 · 카탈로그 5→6탭(레이아웃) · ops 검증 · 카드 UX.*
