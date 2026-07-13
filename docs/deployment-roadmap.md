# Deployment — Phase 실행 로드맵

> **버전:** v1.0 — 2026-07-13 (KST)  
> **목적:** 기능 추가 없이 **staging → production 배포**까지 해야 할 일을 Phase 순서·Gate·체크리스트로 정리  
> **전제:** Product Next · Results · Evidence · Swagkey 1:1 · Remaining A–F **구현 완료** · localhost Phase 0–2 ✅  
> **관련:** `localhost-execution-roadmap.md` (Phase 3–6 상위 흐름) · `production-https.md` · `env-configuration.md` · `PROJECT_CONTEXT.md` §4.9

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Owner** | §Phase 순서 · §Do not · 각 Phase Owner Gate |
| **운영자** | Phase 0–4 Task · env · smoke · DB |
| **구현 / Cursor** | Phase별 Task · 명령어 · Gate 미충족 시 다음 Phase 착수 금지 |

```
[localhost ✅]  Phase 0 로컬 게이트 (recheck·ops·테스트)
                    ↓
[인프라]        Phase 1 결정 (호스팅·DB·도메인·시크릿)
                    ↓
[설정]          Phase 2 env · migrate · 미디어
                    ↓
[staging]       Phase 3 Staging 배포 + smoke
                    ↓
[production]    Phase 4 Production 배포 + smoke
                    ↓
[배포 후]       Phase 5 Observe 표본 → (Unlock 후) Home revisit 🔒
```

**한 Phase = 한 집중 구간.** Staging smoke 통과 전 Production 착수 금지.

---

## 환경 분기

| 환경 | 이 문서에서 해당 | 보류 |
|------|------------------|------|
| **localhost만** (개발 중) | — | 본 로드맵 전체 (Phase 0은 로컬 게이트만) |
| **배포 준비 중** | **Phase 0 → 2** | Phase 3–4 |
| **Staging live** | Phase 3 smoke · Phase 4 준비 | Phase 5 |
| **Production live** | Phase 4 smoke · Phase 5 | Home revisit (Unlock 전) |

**localhost 실행:** 카탈로그·regression 유지보수는 `localhost-execution-roadmap.md` Phase 2와 **병행**.

---

## 완료로 간주 (본 로드맵에서 제외)

| 항목 | 완료일 |
|------|--------|
| Product Next · Results · Evidence · Swagkey 1:1 · Remaining A–F 구현 | 2026-07-10 ~ 2026-07-12 |
| localhost Phase 0–2 (blocking 0 · regression green) | 2026-07-12 |
| Phase B Observe **인프라** (CLI · Unlock 기준 14일/50) | 2026-07-10 |
| HTTPS·cookie·env 검증 스크립트 (`check_production_https_config.py`) | 2026-07-10 |

---

## Do not (배포 Phase 공통)

- **기능 추가** — UI·API·설문·엔진 contract 변경 금지
- Home Dashboard / Login redirect / dual Hero (**Phase 5 Unlock 전**)
- Compare UI · activity 탭 · «빠른 추천» 복원
- 카탈로그 **DB 11테이블** 런타임 연결 (seed JSON 유지)
- `saved_builds` **전용 테이블** 신설 (`eval_events` bookmark로 충분)
- `ENABLE_FEEDBACK_LEARNING_MVP=true` on production (staging 검증 후에만)
- seed `merge_*` / `promote_*` **`--apply-to-seed` 자동 실행**
- `.env` · API key · webhook URL **커밋**
- localhost 트래픽만으로 Phase 5 Unlock 판정

---

## DB 요약 (배포 시 무엇이 필요한가)

| 기능 | DB 필요 | 테이블 | 배포 시 설정 |
|------|---------|--------|--------------|
| 로그인·회원가입·세션 | **항상** | `users`, `auth_sessions`, `auth_email_verifications`, `auth_password_resets` | `DATABASE_URL` + `alembic upgrade head` |
| 저장 빌드·활동·이벤트 | persistence on | `eval_events` (전용 `saved_builds` 없음) | `ENABLE_EVALUATION_PERSISTENCE=true` |
| 추천 품질 eval | persistence on | `eval_recommendation_runs`, `eval_snapshots`, `eval_metrics`, … | 동일 |
| Feedback learning | persistence + flag | `eval_events` 읽기 | prod **off** 유지 |
| 추천 계산·카탈로그 browse | **아니오** | — | `swagkey_products.seed.json` |
| 카탈로그 ORM 11테이블 | 스키마만 | `switches`, `plates`, … | 런타임 **미사용** |

**결론:** 배포 시 **관리형 Postgres 연결은 필수**. 저장·활동까지 서버에 남기려면 **`ENABLE_EVALUATION_PERSISTENCE=true`** 도 필수.

---

# Phase 0. 로컬 게이트 — **P0 · 배포 착수 전**

> **Status:** 🔄 **배포 직전마다 반복**

localhost Phase 2와 동일한 품질 게이트. **코드 변경 없이** green 확인 후 Phase 1 착수.

## Task 0-1 — fixture recheck (blocking 0)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
```

**Gate:** `catalog_change_alert.txt` — **blocking alerts = 0**

## Task 0-2 — ops 일괄 검증

```powershell
python scripts/verify_ops_quality_15.py
```

**Gate:** `⑮ verification OK`

## Task 0-3 — (seed/UI 변경 시) regression · Vitest

```powershell
python scripts/run_swagkey_catalog_regression.py
cd ..\frontend
npm test -- --run
```

**Gate:** regression **127 passed** · Vitest green

## Owner Gate

| 항목 | Gate |
|------|------|
| blocking alerts | **0** |
| `verify_ops_quality_15.py` | **OK** |
| 기능 추가 PR | **없음** (배포 준비 브랜치만) |

---

# Phase 1. 인프라 결정 — **P1**

> **Status:** ⏸ **배포 착수 시**

## Task 1-1 — 호스팅·토폴로지

| 레이어 | 선택 | 비고 |
|--------|------|------|
| **DB** | Supabase / Neon / RDS 등 **관리형 Postgres** | Supabase **Auth는 사용 안 함** (자체 auth) |
| **Backend** | Fly.io · Railway · Render · VPS+Uvicorn | 상시 실행 |
| **Frontend** | Vercel · 동일 VPS | `npm run build` |
| **TLS** | 플랫폼 SSL · nginx · Caddy | HTTPS 필수 |

**권장 토폴로지:** **한 도메인 + `/api` 프록시** (`docs/production-https.md`)

```
https://app.example.com/          → Next.js
https://app.example.com/api/v1/…  → FastAPI
```

- 쿠키 host-only · `SameSite=Lax` 유지 용이
- mixed content·CORS 이슈 최소

**서브도메인 분리** (`app.` + `api.`) 시: `AUTH_COOKIE_DOMAIN`, `CORS_ORIGINS`, `SameSite` 추가 설정 필수.

## Task 1-2 — 시크릿 저장소

- [ ] 호스팅 env 또는 GitHub Secrets / Doppler 등
- [ ] Staging / Production **DB·도메인·시크릿 분리**
- [ ] `.env` · `backend/.env` · `frontend/.env.local` 커밋 금지 재확인

## Owner Gate

| 항목 | Gate |
|------|------|
| 관리형 Postgres | **생성 완료** |
| Staging 도메인 + HTTPS | **확보** |
| 토폴로지 (단일 호스트 vs 서브도메인) | **결정·문서화** |

---

# Phase 2. env · DB · 미디어 — **P2**

> **Status:** ⏸ Phase 1 Gate 후**

## Task 2-1 — Backend env (staging 먼저)

템플릿: `backend/.env.example` · 상세: `docs/env-configuration.md`

### 필수

| 변수 | Staging / Production |
|------|----------------------|
| `APP_ENV` | `staging` → 검증 후 `production` |
| `DATABASE_URL` | 관리형 Postgres (`keyboard:keyboard` · localhost 금지) |
| `CORS_ORIGINS` | `https://…` SPA origin (정확히 일치) |
| `PUBLIC_FRONTEND_BASE_URL` | `https://…` |
| `AUTH_COOKIE_SECURE` | `true` |
| `EMAIL_PROVIDER` | `resend` (또는 `smtp`) |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | (또는 SMTP 4종) |

### 배포 시 강력 추천

| 변수 | 값 | 이유 |
|------|-----|------|
| `ENABLE_EVALUATION_PERSISTENCE` | `true` | 저장 빌드·활동·분석·Phase 5 표본 전제 |

### Production 기본 off 유지

| 변수 | 값 |
|------|-----|
| `ENABLE_FEEDBACK_LEARNING_MVP` | `false` |
| `DEBUG` | `false` |
| `INTERNAL_DEBUG_API_ENABLED` | `false` |

### 오프라인 검증

```powershell
cd backend
python scripts/check_production_https_config.py --require-production
```

**Gate:** `OK: environment configuration valid …`

## Task 2-2 — Frontend env

| 변수 | 값 |
|------|-----|
| `NEXT_PUBLIC_API_URL` | `https://…` (same-origin 또는 API 서브도메인) |

- [ ] `npm run build` 성공
- [ ] `localhost` vs `127.0.0.1` 혼용 금지
- [ ] 시크릿을 `NEXT_PUBLIC_*`에 넣지 않음

## Task 2-3 — DB 마이그레이션

```powershell
cd backend
alembic upgrade head
```

- 마이그레이션: `001` → `007` (카탈로그 스키마 + eval + auth + `avatar_url`)
- (선택) staging E2E 유저: `python scripts/seed_e2e_user.py`

**Gate:** `check_migration_schema.py` 또는 CI schema smoke 통과

## Task 2-4 — 정적 미디어 (자주 누락)

Git에 **이미지 바이너리 없음** — 배포 시 서버에 채워야 함.

### Swagkey 썸네일 mirror (~15–30 MB)

```powershell
cd backend
python scripts/download_swagkey_images.py
```

- `backend/data/swagkey_images/` 존재 확인
- 정책: `backend/docs/swagkey-image-storage-policy.md`

### 프로필 아바타

- `backend/data/avatars/` — **영속 볼륨** 마운트 (ephemeral 디스크면 재시작 시 유실)

## Owner Gate

| 항목 | Gate |
|------|------|
| `check_production_https_config.py` | **통과** |
| `alembic upgrade head` (staging DB) | **완료** |
| `swagkey_images` mirror | **서버에 존재** |
| `ENABLE_EVALUATION_PERSISTENCE` | **staging/prod = true** |

---

# Phase 3. Staging 배포 + smoke — **P3**

> **Status:** ⏸ Phase 2 Gate 후**  
> **상세 HTTPS:** `docs/production-https.md`

## Task 3-1 — Staging 배포

- [ ] Backend 배포 + env 주입
- [ ] Frontend 배포 (`production build`)
- [ ] TLS live:

```bash
curl -sSI "https://app.staging.example.com/" | head
curl -sS "https://app.staging.example.com/api/v1/health"
```

## Task 3-2 — Staging smoke (수동 QA)

### 인프라

- [ ] HTTPS 페이지 — mixed content 경고 없음
- [ ] `/api/v1/health` OK

### 인증 (`docs/production-https.md` Validation checklist)

- [ ] 회원가입 · 이메일 인증 메일 수신
- [ ] 로그인 → **새로고침 후** 로그인 유지
- [ ] DevTools → `kr_session` 쿠키 **Secure**
- [ ] 로그아웃 → 쿠키 삭제

### Critical flow

- [ ] 홈 → 설문 → 결과
- [ ] 결과 **저장** → 마이페이지 `저장한 빌드`
- [ ] «추천 결과 다시 보기»
- [ ] 카탈로그 browse (이미지 포함)
- [ ] (선택) 아바타 업로드

### Persistence

- [ ] `ENABLE_EVALUATION_PERSISTENCE=true` 확인
- [ ] DB `eval_events`에 `interaction.bookmark` 적재 확인:

```sql
SELECT event_type, COUNT(*) FROM eval_events GROUP BY event_type;
```

### 모바일 (가능 시)

- [ ] Safari iOS / Chrome Android — 로그인 · 백그라운드 복귀 · 로그아웃

## Owner Gate

| 항목 | Gate |
|------|------|
| Staging critical flow smoke | **통과** |
| persistence DB 적재 | **확인** |
| Production 착수 | **Staging Gate 후만** |

**Out of Scope:** Home UI 변경 · Compare · 기능 추가

---

# Phase 4. Production 배포 + smoke — **P4**

> **Status:** ⏸ Phase 3 Gate 후**

## Task 4-1 — Production 배포

Staging과 **동일 구조**, 아래만 분리:

- [ ] **별도** Postgres DB (staging DB와 공유 금지)
- [ ] **별도** 도메인·시크릿
- [ ] `APP_ENV=production`
- [ ] `check_production_https_config.py --require-production` 재실행

## Task 4-2 — Production smoke

Phase 3 Task 3-2와 **동일 항목**, production URL 기준.

- [ ] Debug API 비활성 (`INTERNAL_DEBUG_API_ENABLED=false`)
- [ ] `ENABLE_FEEDBACK_LEARNING_MVP=false` 재확인

## Owner Gate

| 항목 | Gate |
|------|------|
| Production smoke | **통과** |
| Launch 서명 | Owner (선택) |

---

# Phase 5. 배포 후 Observe — **P5 · 배포 직후 운영**

> **Status:** ⏸ Production live 후**  
> **상세:** `remaining-work-phases.md` Phase B · `localhost-execution-roadmap.md` Phase 4

본 Phase는 **배포 전 필수가 아님**. Production smoke 직후 시작.

## Task 5-1 — 이벤트 적재 모니터링

- `ENABLE_EVALUATION_PERSISTENCE=true` 유지
- `eval_events` row 증가 확인

## Task 5-2 — 14일 관측 · Unlock 판정

```powershell
cd backend
python scripts/report_observe_aggregates.py --window-days 14
python scripts/report_observe_aggregates.py --json
```

**Unlock 기준:** `span_calendar_days` ≥ 14 · `home.viewed` ≥ 50 · guest + auth 각 ≥ 1 → `unlock_ready: true`

## Task 5-3 — 운영 리듬 (선택)

- fixture inventory recheck 주간 (`.github/workflows/swagkey-inventory-recheck.yml`)
- `CATALOG_CHANGE_ALERT_WEBHOOK_URL` CI secret (선택)
- Feedback learning staging: `docs/staging-feedback-learning-mvp.md`

## Owner Gate

| 항목 | Gate |
|------|------|
| 14일 관측 | **완료** |
| `unlock_ready` | **true** (Home revisit 착수 전) |

**Home revisit (Login redirect · 개인화 · Dashboard):** `unlock_ready` + Owner Why — `product-next-phase5-home-revisit.md`

---

## Phase 순서 요약

| Phase | 이름 | 우선 | Gate |
|-------|------|------|------|
| **0** | 로컬 게이트 | P0 | blocking 0 · ops OK |
| **1** | 인프라 결정 | P1 | Postgres · 도메인 · 토폴로지 |
| **2** | env · DB · 미디어 | P2 | config check · migrate · images |
| **3** | Staging + smoke | P3 | critical flow · persistence |
| **4** | Production + smoke | P4 | staging Gate 후 |
| **5** | Observe (배포 후) | P5 | 14일 · unlock_ready |

```
localhost Phase 0–2 ✅
        ↓
Deploy Phase 0 (recheck) → 1 → 2 → 3 (staging) → 4 (prod)
        ↓
Phase 5 Observe → (Unlock) Home revisit 🔒
```

---

## 한 페이지 체크리스트 (복사용)

**배포 전**

- [ ] Phase 0: blocking 0 · `verify_ops_quality_15.py` OK
- [ ] 관리형 Postgres 생성
- [ ] 호스팅·도메인·HTTPS·시크릿 저장소
- [ ] Backend/Frontend env · `check_production_https_config.py`
- [ ] `alembic upgrade head` (staging)
- [ ] `download_swagkey_images.py` · avatar 볼륨
- [ ] `ENABLE_EVALUATION_PERSISTENCE=true`
- [ ] `npm run build` green

**Staging**

- [ ] 배포 · health · 로그인·설문·저장 smoke
- [ ] `eval_events` 적재 확인

**Production**

- [ ] 별도 DB·env
- [ ] 동일 smoke
- [ ] Debug off

**배포 후**

- [ ] 이벤트 모니터링
- [ ] 14일 후 `report_observe_aggregates.py`

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| `docs/localhost-execution-roadmap.md` | localhost Phase 0–6 상위 흐름 (본 문서 = Phase 3 상세) |
| `docs/production-https.md` | HTTPS · cookie · CORS · smoke 명령 |
| `docs/env-configuration.md` | env tier · 시크릿 규칙 |
| `docs/remaining-work-phases.md` | Phase B Observe · Analytics |
| `docs/staging-feedback-learning-mvp.md` | Feedback flag (prod off) |
| `backend/docs/swagkey-image-storage-policy.md` | 썸네일 mirror |
| `backend/.env.example` · `frontend/.env.example` | env 템플릿 |

---

*이 문서는 **배포 준비·실행의 단일 진입점**이다. Staging/Production URL·호스팅 결정·Gate 완료 시 `PROJECT_CONTEXT.md` §4.9와 `localhost-execution-roadmap.md` Phase 3 Status를 함께 갱신한다.*
