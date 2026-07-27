# Manus AI 컨텍스트 번들 — Keyboard Recommender

> **용도:** Manus에 프로젝트를 넘길 때 **이 파일 1개(+선택 보조)**로 전체 기능·구조·규칙을 전달  
> **경로:** `c:\Users\jeung\keyboard-recommender`  
> **작성일:** 2026-07-27 (KST) · **sync:** `PROJECT_PROGRESS.md` (`dd1f33c`)  
> **대체:** `PROJECT_CONTEXT.md` 전체(1,410줄) 붙여넣기 **불필요** — 이 번들에 UI/UX Phase 1–11 압축 포함

---

## 0. Manus에 넘기는 방법 (토큰 절약)

### 권장 패키지 — 기본 (대부분의 작업)

| 순서 | 파일 | 왜 |
|------|------|-----|
| 1 | **이 파일** `docs/MANUS_CONTEXT_BUNDLE.md` | 기능·API·파일 지도·LOCK·**UI/UX 현황(§10)** |
| 2 | `docs/PROJECT_PROGRESS.md` | Now/Next·로드맵 표 (≤80줄) |

**예상:** ~550줄 — 레포 전체 스캔 대비 **수십 배 적은 토큰**. UI/UX 백로그 전문은 §10에 압축되어 있어 `ui-ux-improvement-backlog.md` **불필요**(심화 시만).

### 시나리오별 추가 (1개만)

| 시나리오 | 추가 파일 |
|----------|-----------|
| 출시·운영 스모크 | `docs/small-group-test-checklist.md` |
| 버튼·카피·저장 상태 규칙 | `docs/ui-ux-system-guidelines.md` |
| 설문 UX 코드 | `frontend/src/lib/survey-definition.ts` |
| 결과 UI 코드 | `frontend/src/components/features/recommendation/results-view.tsx` |
| 추천 엔진 | `backend/docs/architecture-guide.md` |
| 카탈로그 1:1 | `docs/swagkey-catalog-1to1-roadmap.md` |
| UI/UX 백로그 원문(182줄) | `docs/ui-ux-improvement-backlog.md` — §10으로 대체 가능 |

### Manus에 넣지 말 것

| 제외 | 이유 |
|------|------|
| `node_modules/`, `.next/`, `backend/.venv/` | 노이즈·용량 |
| `.env`, API 키, Resend 토큰 | 보안 |
| `backend/data/swagkey_html_cache/` | 대용량 HTML |
| `swagkey_products.seed.json` 전체 | 329행 JSON — API 스키마만 이 문서 참고 |
| `recommendation-result-view.tsx` **전체** | 2,300줄+ — `results-view.tsx`로 충분 |
| `frontend/.next/**`, `backend/local-pass1.db` | 빌드·로컬 DB |

### Manus 프롬프트 템플릿

```
keyboard-recommender 모노레포.
첨부: MANUS_CONTEXT_BUNDLE.md + PROJECT_PROGRESS.md

현재: UI/UX Launch Phase 1–11 구현 완료 · 출시 판정 = 운영 확인 후 가능 (§10)
목표: [구체 목표]

규칙:
- LOCK/금지(§9) 위반 금지 · Home Dashboard·Compare 복원 금지 · 시각 방향은 Precision Editorial(§10)
- 저장 CTA·용어는 ui-ux-system-guidelines.md 패턴 준수
- 코드 변경 전 §7 파일 지도 확인
- seed --apply-to-seed 자동 실행 금지
```

---

## 1. 제품 한 줄 + 사용자 여정

**한 줄:** 커스텀 키보드(스위치·플레이트·폼·레이아웃·케이스·키캡) 6축 추천 웹앱. 설문+NL → FastAPI 엔진 → Next.js 결과. Swagkey 카탈로그 연동.

**여정:**

```
홈(/) → 인증(/auth) → 설문(/recommend) → 결과(/results) → 저장·구매 링크
       ↘ 카탈로그(/catalog) 공개 browse          ↘ 마이페이지(/mypage)
```

**언어:** 한국어 UI (설문·결과·마이페이지·카탈로그·에러)

**배포 (staging, 2026-07):** FE Vercel · BE Railway · DB Supabase Postgres · 쿠키 세션 `kr_session`

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 App Router, React 19, TS, Tailwind 3, next-themes, lucide-react, Vitest |
| Backend | FastAPI, SQLAlchemy 2, PostgreSQL 16, Alembic, pytest, Ruff |
| E2E | Playwright (Chromium) |
| CI | GitHub Actions — backend/frontend/E2E 병렬 + catalog audit |
| 로컬 | Docker Compose (Postgres만), BE port **8010**, FE **3000** |

---

## 3. 모노레포 구조 (읽기 우선순위)

```
keyboard-recommender/
├── frontend/src/
│   ├── app/              # 페이지 (App Router)
│   ├── components/       # UI (features/* 가 핵심)
│   └── lib/              # API 클라이언트, 설문, trait 표시
├── backend/src/keyboard_recommender/
│   ├── api/v1/           # REST 엔드포인트
│   ├── application/      # recommendation_service, catalog_browse
│   ├── trait_engine/     # trait 벡터·매칭·pipeline
│   ├── recommendation_quality/  # build_selection, compatibility, drift
│   ├── catalog/          # seed, ingestion, swagkey 파이프라인
│   └── infrastructure/   # DB, email, avatars
├── backend/scripts/      # 50+ CLI (swagkey crawl, audit, seed merge)
├── backend/data/         # seed JSON, swagkey_inventory, images (대부분 gitignore)
├── e2e/tests/            # Playwright 스펙
└── docs/                 # 로드맵·컨텍스트 (이 파일)
```

---

## 4. 기능 전체 목록 (구현 상태)

### 4.1 핵심 제품

| 기능 | Route/API | 상태 | 메모 |
|------|-----------|------|------|
| 홈 Landing | `/` | ✅ | Hero + FeatureGrid 6카테고리. Dashboard/WorkshopStrip **삭제·복원 금지** |
| 5단계 설문 | `/recommend` | ✅ | Curator UI: 프리셋 3종 → 5단계 + NL 항상 표시 |
| 스타일 프리셋 | 설문 입구 | ✅ | `seedAnswers` 후 첫 미응답 단계 스킵. compute 생략 **없음** |
| NL 선호 | 설문 + BE | ✅ | "thocky linear quiet" → trait 벡터 |
| 6축 추천 compute | `POST /recommendations/compute` | ✅ | switch/plate/foam/layout/case/keycap |
| 결과 Overview | `/results` 탭1 | ✅ | 6축 First View, 저장 Primary CTA, MatchGauge |
| 결과 Evidence | `/results` 탭2 | ✅ | pick why, ranking why, 18축 `<details>` 접힘 |
| 신뢰 레이어 | 결과 Hero↔탭 | ✅ | Confidence Story, 6축 미니, highlights ≤2 |
| degraded fallback | compute 실패 시 | ✅ | «안정 모드» 배너. `runMode:"quick"`는 내부 표기 — «빠른 추천» **아님** |
| 북마크 저장 | `POST /saved` | ✅ | API + 게스트 localStorage 폴백 |
| 활동 타임라인 API | `GET /activity` | ✅ API만 | Results UI 탭 **제거** — saved merge용 유지 |
| 카탈로그 browse | `/catalog` | ✅ | **6탭**: switch/plate/foam/layout/case/keycap |
| 카탈로그 상세 | API `GET /{family}/{id}` | ✅ | traits, metadata, sourceUrl, 썸네일 |
| 스웨그키 구매 링크 | 결과·카탈로그 | ✅ | canonical `shop_view/?idx=` |
| 용어 해석 | `POST /terminology/interpret` | ✅ | 커뮤니티 용어 → trait |
| 다크/라이트 테마 | 전역 | ✅ | 기본 **라이트** (Precision Editorial) |
| Internal Debug UI | `/debug/*` | ✅ | `NEXT_PUBLIC_INTERNAL_DEBUG=1` 게이트 |
| Client lite fallback | results | ✅ | API unreachable 시 client engine — Compare Drawer **아님** |

### 4.2 인증·계정

| 기능 | API | 상태 |
|------|-----|------|
| 회원가입 (이메일 코드) | `/auth/signup`, verification | ✅ |
| 로그인/로그아웃/전체 로그아웃 | `/auth/login`, logout, logout-all | ✅ |
| 비밀번호 재설정 | forgot/reset-password 페이지 | ✅ |
| 표시 이름·중복 확인 | `/display-name`, availability | ✅ |
| 비밀번호 변경 (이메일 코드) | change-password-code/* | ✅ |
| 프로필 아바타 | `POST/DELETE /avatar` | ✅ |
| 회원탈퇴 | deletion-code + password + delete | ✅ |
| 쿠키 세션 | `kr_session`, credentials include | ✅ |
| 탈퇴 완료 페이지 | `/account-deleted` | ✅ |

### 4.3 마이페이지

| 섹션 | `?section=` | 상태 |
|------|-------------|------|
| 개요 | `overview` | ✅ 취향 6축 스냅샷 |
| 저장 빌드 | `saved` | ✅ master-detail, 재조회 |
| 계정 | `account` | ✅ 아바타·닉·비번·탈퇴 Danger zone |
| ~~활동~~ / ~~비교~~ | `activity`→`saved` 리다이렉트 | **제거·복원 금지** |

### 4.4 Backend 추천 엔진

| 모듈 | 역할 |
|------|------|
| Trait Engine | survey → trait vector, 가중 코사인 매칭 |
| Build Selection | 6축 조합, compatibility, diversity rerank |
| Compatibility | plate-layout, case-layout, keycap-layout 규칙 |
| Resilient degraded | full 실패 시 fallback (`enable_resilient_compute_fallback`) |
| Feedback Learning MVP | feature flag, 규칙 기반 가중 (기본 off) |
| Evaluation/Drift | snapshots, metrics, `eval_events`, drift controller |
| Debug API | `/api/v1/debug/*` (production 차단) |

### 4.5 카탈로그·데이터 파이프라인

| 항목 | 상태 | 메모 |
|------|------|------|
| `swagkey_products.seed.json` | ✅ 329 rows | 추천+ browse 주 시드 |
| browse vs recommend **이중 풀** | ✅ | browse 전 SKU / recommend = `recommendationEligible` 게이트 |
| recommend 풀 | ~150건 | switch54 plate14 foam8 layout7 case49 keycap18 |
| browse 풀 (정책 listable) | family별 상이 | layout 30 (archetype7+실PCB23) |
| Swagkey crawl→classify→diff | ✅ ①~⑨ | CLI `backend/scripts/` |
| 제품 이미지 파이프라인 | ✅ Phase 0–8 | og:image → seed imageUrl → mirror |
| catalog 1:1 audit | ✅ Phase 0–8 | `audit_catalog_1to1_coverage.py` |
| inventory recheck | ✅ | 주간 fixture + 월간 live CI |
| `swagkey_catalog_full.json` | ops 전용 | UI **미노출** |

### 4.6 테스트·CI

| 계층 | 도구 | 규모 |
|------|------|------|
| Backend | pytest | ~77 모듈 |
| Frontend | Vitest | ~31 파일 |
| E2E | Playwright | critical-flows, survey, evidence, account-delete 등 |
| CI | GitHub Actions | ruff, alembic, contract, build, e2e |

### 4.7 미구현·운영 잔여 (코드 Phase 1–11 이후)

- Home revisit / Dashboard — **🔒 LOCK** (표본 전 제품 변경 금지)
- Compare Drawer / comparison-hub — **제거·재도입 금지**
- «빠른 추천» UI / `mode=quick` 요청 — **금지**
- `GET /builds/discovery` — **삭제됨**, 재도입 시 Home IA LOCK 필요
- **운영 확인 대기:** CI E2E 25/25 green · Flow 3 수동 · 비밀번호 재설정 메일 1회 · 소그룹 테스트
- **미검증(문서):** 닉네임/비번 변경·아바타·탈퇴 실플로우 전수, 전역 에러 페이지 강제 재현

---

## 5. API 엔드포인트 (압축)

**Base:** `/api/v1` · **Health:** `GET /health`

### Auth `/auth`
`signup` · `email-verification/send|verify` · `password-reset/request|confirm` · `login` · `logout` · `logout-all` · `me` · `security-summary` · `display-name` · `display-name-availability` · `avatar` (POST/DELETE) · `change-password-code/send|verify` · `change-password` · `account/deletion-code/send|verify` · `account/delete`

### Recommendations `/recommendations`
`POST /compute` (**핵심**) · `POST /events` · `POST /saved` · `GET /saved` · `POST /saved/remove|update` · `GET /activity` · `POST /activity/remove` · `GET /nl-vocab-candidates`

### Catalog (6 families)
`GET /switches|plates|foam|layouts|cases|keycaps` + `GET /{id}` · query: `q`, `subtype`, limit/offset  
`GET /catalog/full` (+ `/{id}`) — **ops 전용**

### Terminology
`POST /terminology/interpret`

### Debug (production 차단)
`GET /debug` · `POST /recommendations/inspect|compare-surveys` · `POST /snapshots/analyze` · `GET /drift/summary` · `GET /analytics/kpis` · `POST /benchmarks/compare-snapshots`

---

## 6. Frontend 페이지

| Route | 인증 | 역할 |
|-------|------|------|
| `/` | 공개 | Landing |
| `/auth`, `/auth/forgot-password`, `/auth/reset-password` | 공개 | 인증 |
| `/account-deleted` | 공개 | 탈퇴 완료 |
| `/recommend` | 필요 | 설문 Curator |
| `/results` | 필요 | 결과 2탭 |
| `/mypage` | 필요 | overview/saved/account |
| `/catalog` | 공개 | 6탭 browse |
| `/terminology-demo` | 공개 | 데모 (noindex) |
| `/debug/*` | 플래그 | 내부 디버그 |
| `/terms`, `/privacy`, `/contact` | 공개 | 정적 |

---

## 7. 핵심 파일 지도 (Manus가 코드 열 때)

### Frontend — 페이지
| 파일 | 역할 |
|------|------|
| `frontend/src/app/page.tsx` | 홈 |
| `frontend/src/app/recommend/page.tsx` | 설문 shell |
| `frontend/src/app/results/page.tsx` | 결과 |
| `frontend/src/app/mypage/page.tsx` | 마이페이지 |
| `frontend/src/app/catalog/page.tsx` | 카탈로그 |
| `frontend/src/app/auth/page.tsx` | 로그인/회원가입 |
| `frontend/src/app/auth/auth-page-client.tsx` | auth 폼·validation·오류 분리 (Phase 6·8) |
| `frontend/src/app/auth/forgot-password/page.tsx` | 비밀번호 찾기 (Phase 9) |
| `frontend/src/app/not-found.tsx` | 한국어 404 (Phase 3) |

### Frontend — 기능 컴포넌트
| 경로 | 역할 |
|------|------|
| `components/features/recommendation/survey-wizard.tsx` | 설문 로직·Curator 레이아웃 |
| `components/features/recommendation/survey-question.tsx` | 질문·옵션 카드 |
| `components/features/recommendation/results-view.tsx` | sessionStorage hydration |
| `components/features/recommendation/recommendation-result-view.tsx` | 결과 오케스트레이터 (크다 — 필요 부분만) |
| `components/features/recommendation/results/*` | Overview, Evidence, Confidence 등 |
| `components/features/mypage/mypage-hub.tsx` | 마이페이지 탭 |
| `components/features/mypage/mypage-saved-builds.tsx` | 저장 목록 |
| `components/features/mypage/mypage-account.tsx` | 계정·탈퇴 |
| `components/features/catalog/catalog-browse-view.tsx` | 카탈로그 6탭 |
| `components/features/catalog/catalog-detail-panel.tsx` | 상세 패널 |
| `components/features/catalog/layout-diagram/` | 레이아웃 다이어그램 (**geometry LOCK**) |
| `components/layout/site-header.tsx` | 헤더·네비 |
| `components/providers/auth-session-provider.tsx` | 세션 |

### Frontend — lib
| 파일 | 역할 |
|------|------|
| `lib/survey-definition.ts` | 설문 질문·옵션 정의 |
| `lib/survey-logic.ts` | 단계·검증 |
| `lib/api/recommendations.ts` | compute API |
| `lib/api/auth.ts` | 인증 API |
| `lib/api/catalog.ts` | 카탈로그 API |
| `lib/saved-result-snapshots.ts` | results sessionStorage (`responseContractRev:7`) |
| `lib/recommendation-api-map.ts` | API→UI 매핑 |
| `lib/keyboard-terminology/` | Evidence 24축 라벨 |
| `lib/recommendation-engine/` | client fallback 엔진 |
| `app/globals.css` | Precision Editorial 토큰·설문 CSS |

### Backend — 진입·서비스
| 파일 | 역할 |
|------|------|
| `main.py` / `app_factory.py` | 앱 생성 |
| `application/recommendation_service.py` | compute 오케스트레이션 |
| `trait_engine/pipeline.py` | trait 매칭 |
| `recommendation_quality/build_selection.py` | 6축 빌드 선택 |
| `trait_engine/api_envelope.py` | 응답 envelope |
| `application/catalog_browse_service.py` | browse API |
| `catalog/catalog_browse_policy.py` | listable 정책 |
| `catalog/swagkey_products.seed.json` | **주 카탈로그 시드** |
| `api/v1/recommendations.py` | 추천 API |
| `api/v1/auth.py` | 인증 API |
| `config/settings.py` | 환경 설정 |

### E2E
| 파일 | 역할 |
|------|------|
| `e2e/tests/critical-flows.spec.ts` | 메인 사용자 플로우 |
| `e2e/tests/helpers/survey-flow.ts` | 설문 헬퍼 |
| `e2e/tests/account-delete.spec.ts` | 탈퇴 (disposable 유저) |
| `e2e/tests/results-evidence-phase4.spec.ts` | Evidence E2E |
| `e2e/tests/save-reliability.spec.ts` | 저장·재시도·시간대 (Phase 1·11) |
| `e2e/tests/hydration-smoke.spec.ts` | hydration #418 (Phase 10) |

---

## 8. 아키텍처 (Backend)

```
API routes → Application services
  → Trait Engine (pipeline, vectors, weights)
  → Recommendation Quality (compatibility, diversity, fallback, drift)
  → Catalog (seed, ingestion, swagkey)
  → Terminology
→ Infrastructure (PostgreSQL, email, middleware)
```

**Compute 파이프라인:** validate survey → trait ranks → build_selection (6축) → envelope (`runMode:full`) → (optional) cache, eval persistence

**DB:** users, auth_*, catalog tables (switches/plates/foam/layouts/cases), eval_* — Alembic 001–008

---

## 9. LOCK / 금지 (Manus 제안 시 반드시 준수)

| 금지 | 이유 |
|------|------|
| Home Dashboard / WorkshopStrip / dual Hero 복원 | Home IA LOCK |
| Compare Drawer / comparison-hub / 비교 탭 | product-next Phase 3 제거 |
| «빠른 추천» UI / `mode=quick` 요청 | 엔진 단일화 Phase 1–4 |
| 가짜 Match % / 알고리즘·질문 수 임의 변경 | 제품 정책 |
| seed `merge_*` / `promote_*` **--apply-to-seed 자동** | 운영자 dry-run→검토→수동 |
| layout diagram geometry 무단 수정 | `layout-diagram-definitions.ts`, `layout-diagram.tsx`, `public/layout-diagrams/*.svg` |
| `docs/QA_REPORT.md` 생성 | full-project-qa 스킬 규칙 |
| `.env` 커밋 | 보안 |
| `e2e-ci@keyboard.local` 탈퇴 테스트 | E2E 공유 계정 |

---

## 10. 현재 상태 + UI/UX 작업 맥락 (2026-07-27)

> **Now:** UI/UX Launch **Phase 1–11 ✅** + **Precision Editorial 리디자인 적용 (Manus, 2026-07-27)** · light-first indigo+amber · `defaultTheme="light"`  
> **시각 SoT:** `DESIGN.md` / `DESIGN_SYSTEM.md` / `frontend/src/app/globals.css`  
> **HEAD:** (로컬 미커밋 가능) · **branch:** `main`

### 10.0 Visual direction (2026-07-27)

| 항목 | 값 |
|------|-----|
| Canonical | **Precision Editorial** (light default) |
| Primary | Deep indigo (`55 48 163` light) |
| Secondary | Amber |
| Fonts | Hanken Grotesk + Inter + Noto Sans KR |
| Superseded | purple-dark SaaS launch look |

IA LOCK(Home Dashboard / Compare / 빠른 추천 등 §9)은 **유지**. 시각 토큰·화면 스타일만 Editorial로 교체됨.

### 10.1 Next (운영 — 코드 작업 아님)

1. CI E2E **25/25 green** — `dd1f33c` 이후 재확인
2. **운영 스모크:** Flow 3(게스트→로그인→계정 저장→마이페이지) · 비밀번호 재설정 메일 1회
3. `docs/small-group-test-checklist.md` 소그룹 테스트 → 정식 공개

### 10.2 UI/UX Launch Phase 1–11 (구현 완료)

| Phase | 내용 | 커밋 참고 |
|-------|------|-----------|
| 1 | 전역 홈 canonical 제거 · 페이지 self-canonical · 개인 noindex | `bc10f6b` |
| 2 | 마이페이지 `SavedLoadState` · 스켈레톤 · 원격 오류≠빈목록 | `44481c8` |
| 3 | `not-found.tsx` 한국어 다크 404 | `04cb11a` |
| 4 | 결과 저장 CTA Primary · 구매 Secondary · 저장 상태 | `d9668a6` |
| 5 | 결과 정보 순서 제품→저장→근거 · 취향 반영도 축약 | `4a9ce07` |
| 6 | 로그인↔회원가입 오류 분리 (auth bleed 방지) | `1b97b4a` |
| 7 | 저장 용어 통일 (결과·마이페이지) | `a1d291a` |
| 8 | auth 폼 HTML5 validation 한국어 | `9be26ed` |
| 9 | 비밀번호 찾기 copy·noindex·마스킹 성공 | `b71d314` |
| 10 | hydration #418 — theme/auth placeholder/copyright SSR | `78cd5dd` |
| 11 | 전체 회귀·출시 재심사 · E2E 셀렉터 수정 | `4ea5b4e`, `dd1f33c` |

### 10.3 UI/UX Pass 1–6 (백로그 — 구현 완료 2026-07-26)

| Pass | 항목 | 상태 |
|------|------|------|
| 1 | 날짜·시간대 · 저장 실패 한국어 · 저장 성공 CTA | ✅ |
| 2 | 홈 예고 · 설문 액션 위계 · NL 위치 · 로딩 카피 | ✅ |
| 3 | 결과 CTA 중복 제거 · 첫 화면 정보 밀도 | ✅ |
| 4 | auth autocomplete · 마이페이지 식별성·재활용 | ✅ |
| 5 | 카탈로그 상단 압축 · 모바일 메뉴 | ✅ |
| 6 | 저장 용어 체계 · destructive · `ui-ux-system-guidelines.md` | ✅ |
| Final | **CONDITIONAL PASS** — Flow 3·Tab 키보드 1회 운영 확인 잔여 | `ui-ux-final-verification.md` |

### 10.4 백로그 ID → 주요 파일 (Manus가 UI 손댈 때)

| ID | 주제 | 파일 |
|----|------|------|
| SYSTEM-01 | 날짜·시간 | `mypage-saved-builds.tsx`, `mypage-account.tsx` |
| RESULT-01/02 | 저장 실패·성공 | `recommendation-result-view.tsx`, `results-overview-tab.tsx`, `results-next-actions.tsx` |
| SURVEY-01/02 | 설문 UX | `survey-wizard.tsx` |
| AUTH-01 | 로그인 폼 | `auth-page-client.tsx` |
| MYPAGE-01/02 | 저장 목록 | `mypage-saved-builds.tsx` |
| CATALOG-01 | 카탈로그 | `catalog-browse-view.tsx` |
| MOBILE-01 | 모바일 메뉴 | `components/layout/*`, `components/navigation/*` |
| SYSTEM-02 | 용어·카피 | `ui-ux-system-guidelines.md` · results/mypage/home |

원문 백로그·화면별 평가: `docs/ui-ux-improvement-backlog.md` (182줄 — §10으로 대체 가능)

### 10.5 저장 CTA·용어 규칙 (요약)

`docs/ui-ux-system-guidelines.md` — Manus가 카피/버튼 제안 시 준수:

| 상태 | 라벨 |
|------|------|
| 계정 저장 idle | `이 결과 저장` |
| 게스트 idle | `이 브라우저에 저장` |
| busy | `저장 중…` |
| success | `저장됨` |
| error | `다시 저장` + 한국어 복구 메시지 |

- Primary 1개 per decision · destructive = primary indigo fill 금지 · 외부 링크 = outline

### 10.6 Roadmaps (압축)

| Track | Status |
|-------|--------|
| ui-ux launch Phase 1–11 | ✅ 운영 확인 후 출시 가능 |
| launch-readiness | Pass 1–3 ✅ · 배포 smoke 대기 |
| catalog 1:1 | Phase 8 ✅ |
| account-deletion | ✅ |
| deployment | Phase 3 대기 |
| Home revisit | 🔒 표본 전 금지 |

상세·갱신: `docs/PROJECT_PROGRESS.md`

---

## 11. 로컬 실행 (Manus가 명령 제안할 때)

```bash
docker compose up -d
cd backend && pip install -e ".[dev]" && alembic upgrade head
uvicorn keyboard_recommender.main:app --reload --app-dir src --port 8010
cd frontend && npm install && npm run dev
# NEXT_PUBLIC_API_URL=http://localhost:8010
# localhost vs 127.0.0.1 혼용 금지 (쿠키)
```

**테스트:** `cd backend && pytest` · `cd frontend && npm test` · `cd e2e && npm test`

---

## 12. 더 깊이 필요할 때만 열 파일

| 깊이 | 파일 |
|------|------|
| 전체 지도 (긴) | `docs/PROJECT_CONTEXT.md` |
| ChatGPT용 피드백 가이드 | `docs/CHATGPT_FEEDBACK_BUNDLE.md` |
| BE 아키텍처 | `backend/docs/architecture-guide.md` |
| BE 개발자 가이드 | `backend/docs/developer-guide.md` |
| 결과 UX 로드맵 | `docs/results-ux-roadmap.md` |
| Evidence IA | `docs/evidence-tab-simplification-roadmap.md` |
| Stitch UI | `docs/stitch-design-migration.txt` |
| 배포 | `docs/deployment-roadmap.md` |
| env | `docs/env-configuration.md` |
| UI/UX 백로그 원문 | `docs/ui-ux-improvement-backlog.md` |
| UI/UX 검증 | `docs/ui-ux-final-verification.md` |
| UI/UX 시스템 규칙 | `docs/ui-ux-system-guidelines.md` |
| 소그룹 테스트 | `docs/small-group-test-checklist.md` |

---

*이 번들은 `PROJECT_CONTEXT.md` + `PROJECT_PROGRESS.md` + UI/UX 백로그를 압축한 Manus 전용 패키지입니다. 수치·상태는 `PROJECT_PROGRESS.md`와 충돌 시 후자를 우선합니다.*
