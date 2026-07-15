# Next Execution Phases

> Version: v1.1
> Updated: 2026-07-16 (KST)
> Purpose: localhost QA PASS 이후, 실제 staging 운영과 observe, unlock, Home revisit까지 남은 실행 단계를 현재 기준으로 정리한다.

---

## 0. Current Status

- Local `ops` 포함 전체 QA는 PASS 상태다.
- `main`에는 QA 안정화 수정이 반영되어 있고 원격에도 push 되어 있다.
- 실제 인프라 방향은 이미 문서상 고정되어 있다.
  - Frontend: Vercel
  - Backend: Railway
  - DB: Supabase Postgres
  - Topology: 단일 Vercel 도메인 + `/api`, `/media` 프록시 → Railway
- `docs/PROJECT_CONTEXT.md` 기준으로 staging은 이미 live 상태다.
- 따라서 남은 일의 중심은 "구현"보다 "staging 운영 검증, 관측, unlock 판단"이다.

---

## 1. Priority Summary

| Priority | Phase | Goal | Current Status |
|---|---|---|---|
| P0 | Phase 0 | 로컬 정리 | Complete |
| P1 | Phase 1 | staging 배포 준비 고정 | Complete |
| P2 | Phase 2 | staging 수동 smoke 재검증 | Next |
| P3 | Phase 3 | observe 표본 수집 | Pending |
| P4 | Phase 4 | unlock 판단 | Pending |
| P5 | Phase 5 | Home revisit | Locked |

---

## Phase 0. 로컬 정리

> Goal: QA 산출물과 임시 로그를 정리해 배포 준비 기준 상태를 만든다.
> Status: Complete

### Completed

- QA 산출물 tracked diff 정리 완료
- `tmp/`, Playwright 로그 등 로컬 임시 산출물 정리 완료
- `git status` 기준 배포와 무관한 불필요 변경 제거 완료

### Exit Criteria

- [x] 불필요한 QA 로그/리포트 diff 없음
- [x] staging 준비 기준으로 설명 가능한 로컬 상태 확보

---

## Phase 1. Staging 배포 준비

> Goal: 실제 staging 배포 전에 필요한 인프라, env, 프록시 전략, migration 순서를 고정한다.
> Status: Complete

### Fixed Decisions

- Hosting
  - FE: Vercel
  - BE: Railway
  - DB: Supabase Postgres
- Public topology
  - 단일 Vercel 도메인 사용
  - `/api`, `/media` 는 frontend에서 backend로 프록시
- Auth / cookie strategy
  - same-origin 기반 운영
  - `AUTH_COOKIE_SECURE=true`
  - `AUTH_COOKIE_SAMESITE=lax`
  - `AUTH_COOKIE_DOMAIN` 은 기본적으로 비워 host-only 유지
- DB / persistence
  - staging과 production은 localhost DB 금지
  - `ENABLE_EVALUATION_PERSISTENCE=true` 유지
- Migration order
  - 배포 후 backend 기준 `alembic upgrade head`

### Required Environment Shape

#### Backend

- `APP_ENV=staging`
- `DATABASE_URL=<Supabase Postgres>`
- `CORS_ORIGINS=<Vercel staging origin exact match>`
- `PUBLIC_FRONTEND_BASE_URL=<Vercel staging origin>`
- `AUTH_COOKIE_SECURE=true`
- `ENABLE_EVALUATION_PERSISTENCE=true`
- `EMAIL_PROVIDER`
- `RESEND_API_KEY` or SMTP credentials

#### Frontend

- `NEXT_PUBLIC_API_URL=<same-origin or staging public origin>`
- `INTERNAL_API_PROXY_TARGET=<Railway backend origin>`

### Media / Routing Notes

- API health endpoint는 `/api/v1/health` 가 아니라 `/health` 다.
- public topology에서는 frontend에서 `/api/*`, `/media/*` 를 Railway로 프록시해야 한다.
- Swagkey image mirror는 Railway cold start에서도 준비되도록 entrypoint 전략을 유지해야 한다.

### Evidence

- `docs/PROJECT_CONTEXT.md` 4.9 기준
  - infra decision 완료
  - Railway / Vercel / Supabase 구조 확정
  - staging live
- `docs/production-https.md`
  - same-origin + `/api` 프록시가 권장 구조
- `docs/env-configuration.md`
  - staging / production env 검증 규칙 명시

### Exit Criteria

- [x] 플랫폼 결정 고정
- [x] env 핵심 변수 목록 정리
- [x] 프록시 전략 고정
- [x] migration 순서 확정

---

## Phase 2. Staging Smoke 재검증

> Goal: 현재 live staging에서 브라우저 기준 수동 검증을 마무리한다.
> Status: Next

### Why This Is Next

- `PROJECT_CONTEXT.md` 기준으로 staging은 live다.
- 남은 blocker는 배포 자체보다 Owner 브라우저 smoke 잔여 항목이다.

### Must Verify

- [ ] HTTPS 페이지에서 mixed content 경고 없음
- [ ] `/health` 응답 OK
- [ ] 회원가입 / 이메일 인증
- [ ] 로그인 후 새로고침해도 세션 유지
- [ ] DevTools에서 `kr_session` 쿠키가 `Secure`
- [ ] 로그아웃 시 쿠키 제거
- [ ] 설문 완료 후 결과 진입
- [ ] 결과에서 저장 빌드 마이페이지 반영
- [ ] 마이페이지 저장 빌드 노출
- [ ] 회원탈퇴 flow 확인
- [ ] `/catalog` 이미지 / 링크 정상
- [ ] `eval_events` 적재 확인

### DB Verification

```sql
SELECT event_type, COUNT(*)
FROM eval_events
GROUP BY event_type;
```

### Exit Criteria

- [ ] critical flow 수동 smoke 통과
- [ ] persistence 적재 확인
- [ ] production으로 넘길 blocker 없음

---

## Phase 3. Observe 표본 수집

> Goal: unlock 판단에 필요한 실제 사용 데이터 표본을 쌓는다.
> Status: Pending

### Preconditions

- [ ] Phase 2 완료
- [ ] `ENABLE_EVALUATION_PERSISTENCE=true`
- [ ] `home.viewed` 이벤트 적재 확인
- [ ] guest / authenticated 사용 모두 관측

### Commands

```powershell
cd backend
python scripts/report_observe_aggregates.py --window-days 14
python scripts/report_observe_aggregates.py --json
```

### Exit Criteria

- [ ] 일정 기간 누적 데이터 확보
- [ ] unlock 판단용 필드가 모두 채워짐

---

## Phase 4. Unlock 판단

> Goal: Home revisit를 열어도 되는지 데이터 기준으로 결정한다.
> Status: Pending

### Unlock Criteria

- [ ] `span_calendar_days >= 14`
- [ ] `home.viewed >= 50`
- [ ] guest 표본 존재
- [ ] authenticated 표본 존재
- [ ] 집계 결과에서 `unlock_ready` 판단 가능

### Rule

- 위 기준 전에는 Home Dashboard, redirect 구조 변경, Workspace 전개를 시작하지 않는다.

---

## Phase 5. Home Revisit

> Goal: unlock 이후에만 Home 경험을 다시 설계한다.
> Status: Locked

### Scope Questions

- Home을 계속 landing 중심으로 둘지
- 로그인 사용자 진입을 바꿀지
- 저장 빌드 / 최근 활동 / 재진입 CTA를 어떻게 노출할지
- 실제로 dashboard 구조가 필요한지

### Preconditions

- [ ] Phase 4에서 unlock 승인
- [ ] 변경 success metric 정의
- [ ] IA / redirect / logged-in Home 범위 확정

---

## Do Not

- [ ] `--apply-to-seed` 계열을 QA나 배포 흐름에 자동 실행하지 않는다.
- [ ] unlock 전 Home Dashboard / Workspace 구조를 넣지 않는다.
- [ ] `.env`, `.env.local`, API key, webhook URL을 commit 하지 않는다.
- [ ] localhost 결과만으로 unlock 판단을 하지 않는다.
- [ ] `/api/v1/health` 를 staging health 기준으로 착각하지 않는다.

---

## Recommended Order

```text
Done
1. Phase 0 local cleanup
2. Phase 1 staging prep decisions

Now
3. Phase 2 staging smoke recheck

After staging smoke
4. Phase 3 observe sample collection
5. Phase 4 unlock decision
6. Phase 5 Home revisit
```

---

## Immediate Next Actions

- [ ] staging 브라우저 smoke 잔여 항목을 실제 환경에서 체크
- [ ] `/health` 와 cookie / logout / refresh persistence 확인
- [ ] `eval_events` 적재 확인
- [ ] observe 시작 가능 여부 결정

---

## Phase 2 Operator Runbook

> This section is the actual staging smoke execution order.
> From this point, live staging access is required.

### Before You Start

- [ ] Vercel staging URL 확인
- [ ] Railway backend URL 확인
- [ ] Supabase SQL Editor 접근 가능
- [ ] 테스트용 이메일 수신 가능
- [ ] 브라우저는 시크릿 창 또는 새 프로필 사용

### Step 1. Basic Reachability

1. staging frontend URL 접속
2. 브라우저 DevTools Console 열기
3. `https://<staging-domain>/health` 확인

Pass

- 페이지가 HTTPS로 열린다
- `/health` 가 200 응답을 준다
- Console에 mixed content 에러가 없다

Fail suspects

- Vercel env 누락
- Railway backend down
- `/api` 또는 `/media` 프록시 오설정

### Step 2. Signup and Email Verification

1. 새 계정으로 회원가입
2. 인증 메일 수신
3. 인증 코드 입력 또는 인증 완료 플로우 수행

Pass

- 회원가입 요청 성공
- 메일 수신 성공
- 인증 완료 후 로그인 가능 상태

Fail suspects

- `EMAIL_PROVIDER`
- `RESEND_API_KEY` 또는 SMTP credentials
- `PUBLIC_FRONTEND_BASE_URL`

### Step 3. Login Persistence and Cookie

1. 로그인
2. 로그인 직후 DevTools Application 또는 Storage에서 `kr_session` 확인
3. 페이지 새로고침
4. 로그인 상태 유지 확인

Pass

- `kr_session` 존재
- cookie에 `Secure` 포함
- 새로고침 후에도 로그인 상태 유지

Fail suspects

- `AUTH_COOKIE_SECURE`
- proxy / forwarded proto 처리
- `NEXT_PUBLIC_API_URL` 또는 same-origin 전략 불일치

### Step 4. Logout

1. 로그아웃 실행
2. `kr_session` 제거 여부 확인
3. 로그인 필요 페이지 재진입 확인

Pass

- 로그아웃 후 cookie 제거
- 인증 사용자 화면이 비로그인 상태로 전환

Fail suspects

- logout cookie clear 속성과 login cookie 속성 불일치

### Step 5. Recommendation Flow

1. 설문 시작
2. 설문 완료
3. 결과 페이지 진입
4. 콘솔 에러 확인

Pass

- 결과 페이지 진입 성공
- API 호출 실패 없음
- 주요 결과 카드와 추천 축 설명이 정상 노출

Fail suspects

- `/api` 프록시
- backend runtime error
- DB persistence 예외가 core flow를 방해하는 경우

### Step 6. Save Build and MyPage

1. 결과에서 저장 빌드 실행
2. 마이페이지로 이동
3. 저장 빌드가 실제로 보이는지 확인

Pass

- 저장 요청 성공
- 마이페이지 저장 빌드 목록에 방금 저장한 항목 노출

Fail suspects

- `ENABLE_EVALUATION_PERSISTENCE`
- authenticated session 누락
- saved recommendation query failure

### Step 7. Account Deletion

1. 마이페이지 계정 섹션 진입
2. 회원탈퇴용 이메일 인증 코드 발송
3. 코드 검증 + 비밀번호 입력
4. 회원탈퇴 완료 페이지 확인
5. 동일 세션에서 `/auth/me` 기준 비로그인 상태 확인

Pass

- 탈퇴 완료 페이지로 이동
- 로그아웃 상태 전환
- 동일 계정으로 즉시 로그인 불가

Fail suspects

- deletion code mail 발송
- purge transaction failure
- cookie clear failure

### Step 8. Catalog and Media

1. `/catalog` 진입
2. 각 탭 일부 탐색
3. 썸네일 이미지 로드
4. 외부 상품 링크 클릭 테스트

Pass

- `/catalog` 정상 렌더
- 이미지 깨짐 없음
- product link 이동 정상

Fail suspects

- `/media` 프록시
- Railway mirror 준비 실패
- `NEXT_PUBLIC_API_URL` / image URL resolve mismatch

### Step 9. DB Event Verification

Supabase SQL Editor에서 실행:

```sql
SELECT event_type, COUNT(*)
FROM eval_events
GROUP BY event_type
ORDER BY event_type;
```

Expected

- 로그인 이후 또는 결과/저장 빌드 이후 관련 이벤트가 증가
- 최소한 staging smoke 중 발생시킨 상호작용이 일부 반영

Fail suspects

- `ENABLE_EVALUATION_PERSISTENCE=false`
- backend DB 연결 문제
- best-effort event ingestion 예외

### Phase 2 Exit Decision

Mark Phase 2 complete only if all are true:

- [ ] `/health` OK
- [ ] mixed content 없음
- [ ] 로그인 후 새로고침 유지
- [ ] `kr_session` Secure 확인
- [ ] 로그아웃 시 cookie 제거
- [ ] 결과 진입 성공
- [ ] 저장 빌드가 마이페이지에 보임
- [ ] 회원탈퇴 성공
- [ ] `/catalog` 이미지 / 링크 정상
- [ ] `eval_events` 적재 확인

### What You Must Do Yourself

- [ ] 실제 staging URL 접속
- [ ] 브라우저 DevTools에서 cookie / console 확인
- [ ] 테스트 메일 수신 확인
- [ ] Supabase SQL Editor에서 `eval_events` 조회
- [ ] 실패 시 어떤 단계에서 깨졌는지 기록

### What I Can Do After Your Check

- [ ] 당신이 남긴 결과를 기준으로 blocker 분류
- [ ] 실패 원인 추정 우선순위 정리
- [ ] 필요한 코드 수정
- [ ] 수정 후 재검증 체크리스트 갱신

---

## References

- `docs/PROJECT_CONTEXT.md`
- `docs/deployment-roadmap.md`
- `docs/production-https.md`
- `docs/env-configuration.md`
- `docs/account-deletion-roadmap.md`
- `docs/remaining-work-phases.md`
- `docs/product-next-phase5-home-revisit.md`
- `docs/home-ia-locked.md`

---

## Production Release Phases

> This section covers the additional phases required before real external users can sign up, receive verification emails, and use the app.
> Current state is still staging-oriented. Do not treat the current live stack as public production until these phases are complete.

### Overview

| Phase | Goal | Why It Matters |
|---|---|---|
| PR-1 | staging / production 분리 | 테스트 환경과 실제 사용자 환경을 섞지 않기 위해 |
| PR-2 | 운영 메일 발송 구성 | 다른 실제 사용자가 인증 메일을 받을 수 있게 하기 위해 |
| PR-3 | production 도메인 연결 | 공개용 신뢰 가능한 URL과 same-origin 쿠키 전략을 만들기 위해 |
| PR-4 | production env 주입 | 운영 안전성, 쿠키, CORS, DB, 메일 설정을 production 기준으로 분리하기 위해 |
| PR-5 | production 배포 + DB migration + smoke | 실제 공개 전에 기능과 데이터 적재를 최종 검증하기 위해 |

### PR-1. Staging / Production Separation

> Goal: 현재 staging 스택과 별도로 public production 스택 기준을 확정한다.

#### Required

- [ ] production frontend domain 확정
- [ ] production backend endpoint 확정
- [ ] production DB를 staging DB와 별도로 생성
- [ ] production secrets를 staging secrets와 분리
- [ ] `APP_ENV=production` 으로 운영할 대상 스택 확정

#### Notes

- 현재 문서 기준 live URL은 staging이다.
- Railway 서비스명이 `production` 이어도 `APP_ENV=production` 이 아니면 production으로 간주하지 않는다.
- production DB를 staging과 공유하지 않는다.

#### Exit Criteria

- [ ] production용 도메인, DB, env 저장소가 모두 따로 준비됨

### PR-2. Production Email Delivery

> Goal: 본인 계정만이 아니라 실제 외부 사용자가 인증 메일과 탈퇴 메일을 받을 수 있게 한다.

#### Required

- [ ] Resend에 production 발신 도메인 추가
- [ ] DNS 인증 완료
  - [ ] SPF
  - [ ] DKIM
  - [ ] 필요시 DMARC
- [ ] 실제 발신 주소 결정
  - [ ] `noreply@your-domain`
  - [ ] 또는 `onboarding@your-domain`
- [ ] production `RESEND_API_KEY` 발급
- [ ] production `RESEND_FROM_EMAIL` 확정

#### Notes

- `onboarding@resend.dev` 같은 테스트 발신 설정으로는 실제 공개 운영 기준이 아니다.
- 운영 공개 전에는 production 발신 도메인 인증이 끝나 있어야 한다.

#### Exit Criteria

- [ ] 외부 일반 이메일 주소로 인증 메일 수신 테스트 성공

### PR-3. Production Domain and Topology

> Goal: 공개용 사용자 URL을 확정하고 same-origin 배포 구조를 production에 연결한다.

#### Recommended Topology

```text
https://your-domain.com or https://app.your-domain.com  -> Vercel frontend
/api/*                                                  -> Railway backend proxy
/media/*                                                -> Railway backend proxy
/health                                                 -> Railway backend proxy
```

#### Required

- [ ] production 도메인 구매 또는 준비
- [ ] Vercel에 production domain 연결
- [ ] DNS 레코드 설정
- [ ] production frontend URL 확정
- [ ] `/api`, `/media`, `/health` 프록시 전략 유지 확인

#### Notes

- same-origin 전략을 유지하면 쿠키와 CORS가 단순해진다.
- 공개용으로는 임시 preview URL보다 production domain이 우선이다.

#### Exit Criteria

- [ ] production URL에서 frontend 접속 가능
- [ ] proxy 경로가 production에서도 동일하게 동작

### PR-4. Production Environment Injection

> Goal: production 전용 env를 staging과 분리해서 정확히 주입한다.

#### Backend Required

- [ ] `APP_ENV=production`
- [ ] `DATABASE_URL=<production postgres>`
- [ ] `CORS_ORIGINS=https://<production frontend domain>`
- [ ] `PUBLIC_FRONTEND_BASE_URL=https://<production frontend domain>`
- [ ] `AUTH_COOKIE_SECURE=true`
- [ ] `ENABLE_EVALUATION_PERSISTENCE=true`
- [ ] `EMAIL_PROVIDER=resend`
- [ ] `RESEND_API_KEY=<production key>`
- [ ] `RESEND_FROM_EMAIL=<production sender>`

#### Frontend Required

- [ ] `NEXT_PUBLIC_API_URL=https://<production frontend domain>`
- [ ] `INTERNAL_API_PROXY_TARGET=https://<production railway domain>`

#### Safety Checks

- [ ] debug API가 production에서 차단되는지 확인
- [ ] staging secrets가 production에 섞이지 않았는지 확인
- [ ] `.env`, `.env.local` 을 git에 올리지 않았는지 확인

#### Exit Criteria

- [ ] production env 값이 frontend / backend 모두 분리 주입됨

### PR-5. Production Deploy, Migration, and Smoke

> Goal: production을 실제로 올리고, 공개 전에 마지막 smoke를 완료한다.

#### Deploy Steps

1. production env를 반영한 상태로 frontend 배포
2. production env를 반영한 상태로 backend 배포
3. production DB 대상 migration 실행

```powershell
cd backend
alembic upgrade head
```

#### Production Smoke Checklist

- [ ] `/health` OK
- [ ] mixed content 없음
- [ ] 회원가입 가능
- [ ] 이메일 인증 메일 수신
- [ ] 로그인 후 새로고침 유지
- [ ] `kr_session` Secure 확인
- [ ] 로그아웃 시 cookie 제거
- [ ] 설문 → 결과 진입 성공
- [ ] 저장 빌드 성공
- [ ] 마이페이지 반영 성공
- [ ] 회원탈퇴 성공
- [ ] `/catalog` 이미지 / 링크 정상
- [ ] `eval_events` 적재 확인

#### DB Verification

```sql
SELECT event_type, COUNT(*)
FROM eval_events
GROUP BY event_type
ORDER BY event_type;
```

#### Exit Criteria

- [ ] production smoke 전체 통과
- [ ] 실제 외부 사용자 공개 가능한 상태라고 설명 가능

### Public Release Rule

- [ ] PR-1 ~ PR-5 완료 전에는 현재 staging URL을 공개 운영 링크로 간주하지 않는다.
- [ ] staging과 production의 DB, 도메인, secrets를 공유하지 않는다.
- [ ] production smoke 통과 전에는 불특정 다수 사용자에게 링크를 배포하지 않는다.
