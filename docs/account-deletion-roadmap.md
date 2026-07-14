# 회원탈퇴(Account Deletion) — Phase 실행 로드맵

> **버전:** v1.0 — 2026-07-14 (KST)  
> **목적:** 로그인 사용자 **회원탈퇴**를 권장 흐름(본인확인 → 연관 데이터 처리 → 계정·세션 삭제 → Resend 완료 메일 → 완료 페이지)으로 **단계 분할**해 구현  
> **진입점 UI:** `/mypage?section=account` (`MyPageAccount`)  
> **관련:** `PROJECT_CONTEXT.md` §Auth · `backend/.../api/v1/auth.py` · `infrastructure/notifications/email.py` · `frontend/src/lib/api/auth.ts` · `deployment-roadmap.md` (staging smoke)

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Owner** | §권장 흐름 · §Phase 0 LOCK · §Do not · 각 Phase Owner Gate |
| **구현 / Cursor** | Phase별 Task · 명령어 · **Gate 미충족 시 다음 Phase 착수 금지** |

```
Phase 0 LOCK → 1 API(재인증+삭제) → 2 연관데이터 → 3 FE 탈퇴 UI
    → 4 세션·쿠키·리다이렉트 → 5 Resend 완료메일 → 6 완료 페이지
    → 7 테스트·E2E → 8 문서·staging smoke
```

**한 Phase = 한 PR = 한 Cursor 세션** (목표 diff ~250줄 이하).  
**한 번에 Phase 1–6을 몰아서 만들지 말 것.**

---

## 권장 탈퇴 흐름 (제품 목표)

```
로그인 상태
  │
  ├─ ① 본인 여부 확인 (세션 = 현재 로그인 사용자)
  ├─ ② 재인증: 비밀번호 재입력  ★MVP 필수
  │         또는 이메일 인증코드  ◦ Phase 1b (LOCK에 따라)
  ├─ ③ 연관 데이터 처리 (프로필·아바타·저장 빌드/활동·auth 보조행)
  ├─ ④ users 행 삭제 (세션·password_reset CASCADE)
  ├─ ⑤ 응답에서 세션 쿠키 제거
  ├─ ⑥ Resend로 탈퇴 완료 이메일 발송 (계정 삭제 **직전**에 주소 확보)
  └─ ⑦ `/account-deleted` (또는 홈) 로 이동 · 로그인 상태 아님
```

---

## 현재 상태 (Baseline)

| 항목 | 상태 | 비고 |
|------|------|------|
| 로그인·로그아웃·전체 세션 종료 | ✅ | `POST /auth/logout` · `/logout-all` |
| 비밀번호 변경 (current_password 확인) | ✅ | `POST /auth/change-password` — **재인증 UX 패턴 재사용** |
| 이메일 인증 코드 (회원가입) | ✅ | `email-verification/send` · `verify` · Resend/SMTP |
| 비밀번호 재설정 메일 | ✅ | `send_password_reset_link_email` |
| 아바타 업로드·삭제 | ✅ | `DELETE /auth/avatar` · `delete_user_avatar_files` |
| **회원탈퇴 API / UI** | ❌ | 없음 |
| 커뮤니티 게시글 | ❌ | **제품에 게시판 없음** — 일반 권장 흐름의 «게시글»은 N/A |

### 이 프로젝트에서 «연관 데이터»란

| 데이터 | 저장소 | 삭제 시 처리 (Phase 0에서 LOCK) |
|--------|--------|--------------------------------|
| `users` | DB | hard delete |
| `auth_sessions` | DB | `ON DELETE CASCADE` (users) |
| `auth_password_resets` | DB | `ON DELETE CASCADE` |
| `auth_email_verifications` | DB (email 키) | 해당 **email** 행 수동 삭제 |
| 아바타 파일 | `data/avatars/` → `/media/avatars` | `delete_user_avatar_files` 호출 |
| 저장 빌드·활동 | `eval_events.payload.user_id` (FK 없음) | **삭제 또는 user_id null 익명화** — Phase 0 LOCK |
| 클라이언트 SessionStorage | 브라우저 | FE에서 관련 키 clear (있으면) |

---

## Phase 0 LOCK (착수 전 확정)

> Phase 1 코드 작성 전 Owner가 아래를 확정한다. 미확정 시 Phase 1 착수 금지.

| # | 결정 | 후보 | **권장(기본)** | **확정** |
|---|------|------|----------------|----------|
| L1 | 재인증 방식 | A) 비밀번호만 · B) 비밀번호 **또는** 이메일 코드 · C) 둘 다 필수 | **A → 이후 1b로 B 확장** | ✅ **A** (2026-07-14) |
| L2 | `eval_events` | A) 해당 user_id 이벤트 **hard delete** · B) `user_id`/`metadata.userId` **null 익명화** (집계 보존) · C) 북마크만 삭제 | **B (익명화)** — Observe/funnel 왜곡 최소화 | ✅ **B** (2026-07-14) |
| L3 | 완료 후 이동 | A) `/` · B) `/account-deleted` 전용 | **B** — 재가입·문의 카피 가능 | ✅ **B** (2026-07-14) |
| L4 | 탈퇴 완료 메일 실패 | A) 탈퇴 롤백 · B) 탈퇴 진행 + log fallback (기존 메일 패턴) | **B** — 기존 `send_*_email` best-effort와 동일 | ✅ **B** (2026-07-14) |
| L5 | 쿨링오프(유예) | A) 즉시 삭제 · B) N일 soft-delete 후 purge | **A (MVP)** — soft-delete 테이블 신설 금지 | ✅ **A** (2026-07-14) |
| L6 | 동일 이메일 재가입 | 허용 (email UNIQUE 해제 후 즉시 가능) | **허용** — hard delete면 자연스럽게 가능 | ✅ **허용** (2026-07-14) |

**Owner Gate (Phase 0):** ✅ **완료** — 2026-07-14 Owner «권장 LOCK으로 설정»

- [x] L1–L6 서명 (권장값 = 확정)
- [x] 마이페이지 계정 탭 «위험 구역» 카피 톤 합의

**Danger 카피 (LOCKED):**

> 탈퇴하면 계정·프로필·저장한 빌드 접근 권한이 즉시 사라집니다. 탈퇴 후에는 같은 이메일로 다시 가입할 수 있습니다.

---

## Success / Failure

| Success | Failure |
|---------|---------|
| 로그인 사용자가 비밀번호(또는 LOCK된 재인증) 후 계정이 사라지고 `/auth/me` = 401 | 비밀번호 없이·타 세션만으로 삭제 가능 |
| 탈퇴 후 아바타 파일·auth 보조행·본인 저장 빌드 노출 없음 | `users`만 지우고 `eval_events`에 PII/식별자가 남음 (L2=B 위반 시 null 미처리) |
| Resend(또는 log fallback)로 완료 메일 경로가 동작 | 메일 실패로 탈퇴 자체가 막히거나, 반대로 메일만 가고 계정 잔존 |
| Phase 단위 PR·테스트로 회귀 없이 쌓임 | 한 PR에 API+FE+메일+E2E 전부 |

---

## Do not (전 Phase 공통)

- **비밀번호 없이** `DELETE /users/{id}` 식 공개 엔드포인트
- admin/ops용 «임의 유저 삭제»를 사용자 탈퇴 API에 합치기
- `saved_builds` **전용 테이블** 신설 (기존: `eval_events` bookmark)
- soft-delete 컬럼·유예 워커를 MVP에 끼워 넣기 (L5=A)
- 탈퇴 UI를 홈·헤더·설문에 노출 (진입은 **마이페이지 계정**만)
- 엔진 · catalog seed · layout diagram · Home IA LOCK 변경
- `.env` · `RESEND_API_KEY` 커밋
- Phase Gate 실패 상태에서 다음 Phase 착수

---

## 용어

| 용어 | 의미 |
|------|------|
| **재인증** | 이미 로그인된 상태에서 탈퇴 직전에 비밀번호(또는 이메일 코드)로 한 번 더 확인 |
| **연관 데이터** | 아바타 파일 · auth 보조 테이블 · `eval_events` 내 해당 user 식별자 |
| **완료 페이지** | 탈퇴 직후 안내 전용 라우트 (`/account-deleted`) — 로그인 필요 없음 |

---

# Phase 0. 인벤토리 · 정책 LOCK · **0 PR (문서)**

> 코드 없이 결정만. Cursor는 이슈/PR에 LOCK 표를 옮기거나 이 문서에 확정일을 적는다.  
> **Status:** ✅ **완료** (2026-07-14) — Task 0-1 · Owner Gate L1–L6 권장 LOCK

## Task 0-1 — 연관 데이터 목록 재확인

**작업**

1. `users` · `auth_*` · avatar · `eval_events` 경로를 코드에서 한 번 더 대조 (`auth.py`, `recommendations.py`, `avatars.py`).
2. 게시판·댓글·외부 스토리지 등 **없는 항목**은 N/A로 표기.

### Agent 검증 결과 (2026-07-14)

| 항목 | 경로 / 근거 | 탈퇴 시 처리 | 상태 |
|------|-------------|--------------|------|
| `users` | `models/user_auth.py` | hard delete | ✅ 존재 |
| `auth_sessions` | FK `users.id` **ON DELETE CASCADE** | CASCADE | ✅ |
| `auth_password_resets` | FK `users.id` **ON DELETE CASCADE** | CASCADE | ✅ |
| `auth_email_verifications` | **email 키만** (user_id FK 없음) | email 매칭 수동 삭제 필요 | ✅ |
| 아바타 파일 | `avatars.delete_user_avatar_files` · auth에서 import 사용 중 | 명시 호출 필요 | ✅ 헬퍼 있음 |
| 쿠키 clear | `auth._clear_auth_cookie` (logout 동일) | 삭제 응답에서 재사용 | ✅ |
| 재인증 패턴 | `POST /change-password` + `verify_password` | Phase 1 재사용 | ✅ |
| `eval_events` | `evaluation/storage/event_models.py` — **user_id 컬럼/FK 없음** · `payload.user_id` / `metadata.userId` | L2에 따라 익명화/삭제 | ✅ |
| 저장 빌드 API | `recommendations.py` bookmark · user_id 필터 | 세션 없으면 접근 불가 + L2 purge | ✅ |
| `POST /auth/account/delete` | `auth.py` | password 재인증 + hard delete + cookie clear | ✅ Phase 1 |
| 탈퇴 완료 메일 | `email.py` | — | ❌ **미구현** (Phase 5) |
| 회원탈퇴 UI | `mypage-account.tsx` | — | ❌ **미구현** (Phase 3) |
| 게시판·댓글·커뮤니티 포스트 | FE 스캔 (`게시판`/`community_post`/`/forum`) | — | **N/A** (hits: none) |
| 외부 object storage (S3 등) | avatar = 로컬 `data/avatars/` | N/A | **N/A** |

**Gate:** Phase 0 LOCK 표 L1–L6 Owner 체크 완료.

---

# Phase 1. Backend — 재인증 + 계정 삭제 API · **1 PR**

> **범위:** API·스키마·단위 테스트만. FE·Resend 완료 메일·완료 페이지 **금지** (메일은 Phase 5).  
> **Status:** ✅ **완료** (2026-07-14) — `POST /auth/account/delete` · `tests/test_auth_account_delete.py` 3 passed

## Cursor 실행

### Task 1-1 — 스키마 · 엔드포인트

**계약 (LOCKED)**

| Method | Path | Body | 응답 |
|--------|------|------|------|
| `POST` | `/api/v1/auth/account/delete` | `{ "password": "..." }` | `204` + Set-Cookie clear |

동작 순서 (서버):

1. `CurrentUser` 필수 (미로그인 → 401)
2. `verify_password(password, user.password_hash)` 실패 → 401 (change-password와 동일 톤)
3. email · user_id를 **먼저 로컬 변수에 보관** (삭제 후 메일용 — Phase 5에서 사용; Phase 1은 보관만 하거나 no-op 훅)
4. Phase 2 이전이면: **users hard delete만** + CASCADE로 세션·password_reset 정리 + 쿠키 clear  
   - *권장:* Phase 1에서도 아바타 파일 삭제는 같이 호출 (이미 `delete_user_avatar_files` 존재) — eval_events는 Phase 2
5. 세션 쿠키 clear (`logout`과 동일 헬퍼 재사용)

**파일 후보**

- `backend/src/keyboard_recommender/schemas/auth.py` — `DeleteAccountRequest`
- `backend/src/keyboard_recommender/api/v1/auth.py` — 라우트
- `backend/tests/...` — 성공·잘못된 비밀번호·미로그인

### Task 1-2 — 단위 테스트

```powershell
cd c:\Users\jeung\keyboard-recommender\backend
.\.venv\Scripts\Activate.ps1
pytest tests -k "account_delete or delete_account" -q
```

**Gate**

- [ ] 올바른 비밀번호 → 204 · DB에 user 없음 · 쿠키 cleared
- [ ] 잘못된 비밀번호 → 401 · user 잔존
- [ ] 미로그인 → 401
- [ ] 기존 auth 테스트 회귀 없음

**Owner Gate:** API만 staging에 올릴지 / FE와 같은 릴리스로 묶을지 — FE 전엔 외부 노출 위험 낮음(비밀번호 필요).

---

# Phase 1b. (선택) 이메일 코드 재인증 · **1 PR**

> L1이 **A만**이면 **스킵**. L1=B일 때만.  
> **Status:** ⏭ **스킵** (2026-07-14) — Owner LOCK L1=A

## Cursor 실행

### Task 1b-1

- `POST /auth/account/deletion-code/send` — 로그인 사용자 email로 코드 (기존 verification 패턴 재사용; **회원가입용 테이블과 네임스페이스 분리** 권장)
- `POST /auth/account/delete` body: `{ "password"?: ..., "verification_token"?: ... }` — **둘 중 하나**

**Gate:** 코드 만료·재사용·타인 세션 불가. 비밀번호 경로(Phase 1) 회귀 없음.

---

# Phase 2. 연관 데이터 처리 · **1 PR**

> Phase 1 Gate 통과 후. 삭제 트랜잭션에 purge/익명화 포함.  
> **Status:** ✅ **완료** (2026-07-14) — `purge_user_associated_data` · L2=B 익명화 · email verification 삭제 · tests 5 passed

## Cursor 실행

### Task 2-1 — purge 헬퍼

한 함수로 묶기: `purge_user_associated_data(db, settings, user: User) -> None`  
경로: `infrastructure/persistence/account_purge.py`

| 순서 | 작업 |
|------|------|
| 1 | `delete_user_avatar_files(settings, user_id)` |
| 2 | L2=B → `eval_events` payload `user_id` / `metadata.userId` **null 익명화** |
| 3 | `auth_email_verifications` where email = user.email 삭제 |
| 4 | sessions 명시 삭제 (+ CASCADE on user delete) |
| 5 | `db.delete(user)` · commit |

### Task 2-2 — 테스트

- 탈퇴 후 세션 없음 → `GET /recommendations/saved` empty/unauth
- 익명화: 본인 이벤트 user_id null · 타 유저 이벤트 불변 · email verification 행 삭제

**Gate:** ✅ L2=B와 테스트 일치 · Phase 1 API 테스트 유지 + Phase 2 cases 추가 (`5 passed`)

---

# Phase 3. Frontend — 마이페이지 탈퇴 UI · **1 PR**

> **범위:** `/mypage` 계정 탭 Danger zone + API 호출. 완료 전용 페이지·메일 카피 상세는 Phase 5–6.  
> **Status:** ✅ **완료** (2026-07-14) — `deleteAccount` 클라이언트 · DANGER 카드 · mypage Vitest **13 passed**

## Cursor 실행

### Task 3-1 — API 클라이언트

`frontend/src/lib/api/auth.ts`에 `deleteAccount({ password })` 추가 (`credentials: "include"` · 204 · `emitAuthChanged`).

### Task 3-2 — `MyPageAccount` Danger zone

`mypage-account.tsx` SECURITY 카드 **아래** `MyPageSectionCard`:

- eyebrow `DANGER` · 제목 «회원탈퇴»
- LOCKED 경고 카피 (프로필·저장 빌드 · 재가입 가능)
- «탈퇴하기» 접는 패널: 비밀번호 · «탈퇴» 타이핑 확인 · 제출
- 성공 시: `emitAuthChanged` · `router.push("/")` (Phase 6에서 `/account-deleted`로 교체)
- 실패: 401 → «비밀번호가 올바르지 않습니다.»

**Do not:** 한 번의 클릭으로 즉시 삭제 · 헤더에 탈퇴 링크.

**Gate:** ✅

```powershell
cd c:\Users\jeung\keyboard-recommender\frontend
npm test -- --run mypage
```

- [x] 계정 탭에서만 진입 가능 (`회원탈퇴` heading · hub smoke)
- [x] Vitest smoke 깨짐 없음 — **13 passed**

---

# Phase 4. 세션 · 쿠키 · 클라이언트 정리 · **0~1 PR**

> Phase 3에 이미 logout-equivalent가 있으면 **얇은 후속 PR** 또는 Phase 3에 흡수. 별도 PR이 필요하면 이 Phase.  
> **Status:** ✅ **완료** (2026-07-14) — Phase 1–3에 흡수 확인 + `/me` 401 테스트 고정 · storage wipe 없음

## Cursor 실행

### Task 4-1

1. ✅ 삭제 API가 `logout`과 동일하게 `_clear_auth_cookie` 호출
2. ✅ FE: `deleteAccount` → `emitAuthChanged` → `AuthHeaderProvider`가 `/me` 재조회 → user=null
3. ✅ 브라우저 저장소: sessionStorage/localStorage wipe **하지 않음** (주석 LOCK)

**Gate:** ✅ 탈퇴 직후 `GET /auth/me` → **401** (`test_delete_account_success_…` assert)

---

# Phase 5. Resend — 탈퇴 완료 이메일 · **1 PR**

> 계정 row 삭제 **전에** `to_email`을 캡처한 뒤, delete commit 성공 후 best-effort 발송.  
> **Status:** ✅ **완료** (2026-07-14) — `send_account_deleted_email` · L4=B · tests **8 passed**

## Cursor 실행

### Task 5-1 — `email.py`

```text
send_account_deleted_email(settings, *, to_email: str) -> str
```

- subject: `Keyboard Recommender 회원탈퇴 완료`
- body: 탈퇴 완료 · 동일 이메일 재가입 가능(L6) · 본인 미요청 시 문의
- provider: 기존 `_deliver_email` (Resend / SMTP / log fallback)
- L4=B: 예외 → `account_deleted_fallback_log` · 탈퇴 커밋 유지

### Task 5-2

`__init__.py` export · `DELETE /auth/account/delete`에서 purge **이후** 호출 · 테스트(log fallback · 호출 확인 · never raises)

**Gate:** ✅ local/smtp 미설정 시 `delivery == "log"` + `account_deleted_fallback_log` · Owner staging Resend 실수신은 Phase 8 smoke

---

# Phase 6. 탈퇴 완료 페이지 · **1 PR**

> **Status:** ✅ **완료** (2026-07-14) — `/account-deleted` · 탈퇴 후 리다이렉트 · smoke **14 passed** (mypage+page)

## Cursor 실행

### Task 6-1

- 라우트: `frontend/src/app/account-deleted/page.tsx` (공개)
- 카피: 탈퇴 완료 · 이용 감사 · «홈으로» CTA → `/`
- 카드/마케팅 섹션 없음 (쉘·토큰 톤)
- Phase 3 성공 리다이렉트 → `/account-deleted`

**Gate:** ✅ Vitest `account-deleted` + `mypage` — **14 passed**

---

# Phase 7. 테스트 · E2E · **1 PR**

> **Status:** ✅ **완료** (2026-07-14) — BE **8 passed** · E2E **1 passed** (Docker Postgres · disposable signup)  
> 탈퇴 후 `window.location.assign("/account-deleted")` — RequireAuth↔`emitAuthChanged` 경합 방지

## Cursor 실행

### Task 7-1 — Backend

삭제·잘못된 비밀번호·eval_events 익명화 · 이메일 verification 제거 · 완료 메일 best-effort — `tests/test_auth_account_delete.py`

**Gate:** ✅ `8 passed` (재검증 2026-07-14 · Docker Postgres)

### Task 7-2 — E2E

`e2e/tests/account-delete.spec.ts` — **매 실행 disposable signup** (공용 `e2e-ci@…` 미사용 · empty storageState)

1. API signup (DEBUG `debug_code`) → 로그인 → 마이페이지 계정 → 탈퇴 → `/account-deleted`
2. `/mypage` → `/auth` 유도

`playwright.config.cjs` project **`account-delete`** (setup 미의존) · `start-stack.cjs`에 `DEBUG=true` (debug_code)

```powershell
cd c:\Users\jeung\keyboard-recommender\e2e
npm run test:account-delete
REM 또는: npx playwright test --project=account-delete
REM 기대: 1 passed (Postgres + seed 불필요 — 임시 가입)
```

**Gate (Owner/CI):** ✅ `npm run test:account-delete` → **1 passed** (2026-07-14) · `e2e-ci` 미사용

---

# Phase 8. 문서 · staging smoke · **0~1 PR (문서)**

> **Status:** ✅ Task 8-1 문서 완료 (2026-07-14) · 🔄 Task 8-2 Owner staging smoke **pending**

## Task 8-1 — 문서

- [x] `PROJECT_CONTEXT.md` Auth에 `POST /account/delete` · `/account-deleted` · §4.2/4.3 반영
- [x] 이 로드맵 Phase 체크 ✅
- [x] `roadmap-phase-execute` 스킬 표에 `account-deletion-roadmap.md` 행 추가

**Gate (문서):** ✅

## Task 8-2 — Staging smoke (Owner)

| # | 확인 | 상태 |
|---|------|------|
| 1 | staging Resend로 탈퇴 완료 메일 수신 | ⬜ Owner |
| 2 | 탈퇴 계정으로 재로그인 불가 · 동일 이메일 재가입 가능(L6) | ⬜ Owner |
| 3 | 아바타 URL 404 · 저장 빌드 목록 비어 있음 | ⬜ Owner |

**Gate:** Owner smoke 체크리스트 통과 후 production 노출. (Agent는 staging Resend/실계정 접근 불가 — Owner 서명 필요)

---

## Phase × 산출물 요약

| Phase | 산출물 | 사용자에게 보이는가 |
|-------|--------|---------------------|
| 0 | LOCK 결정 | 아니오 |
| 1 | `POST /auth/account/delete` | 아니오 (API only) |
| 1b | 이메일 코드 재인증 | 선택 |
| 2 | purge/익명화 | 아니오 |
| 3 | 마이페이지 탈퇴 UI | **예** |
| 4 | 쿠키·헤더 정리 | 예 |
| 5 | Resend 완료 메일 | 예 (메일함) |
| 6 | `/account-deleted` | 예 |
| 7 | 테스트·E2E | 아니오 |
| 8 | 문서·staging | 운영 |

---

## CMD 검증 치트시트 (구현 후)

```cmd
cd c:\Users\jeung\keyboard-recommender\backend
.\.venv\Scripts\activate.bat

REM Auth 회귀 + 탈퇴
pytest tests -k "auth or account_delete or delete_account" -q
REM 기대: passed

cd c:\Users\jeung\keyboard-recommender\frontend
npm test -- --run mypage
REM 기대: passed
```

탈퇴 API 수동 (cookie 필요):

```cmd
REM 로그인으로 Set-Cookie 획득 후
curl -s -o NUL -w "%%{http_code}" -X POST "http://127.0.0.1:8000/api/v1/auth/account/delete" ^
  -H "Content-Type: application/json" ^
  -H "Cookie: <session>" ^
  -d "{\"password\":\"YourPass1!\"}"
REM 기대: 204
```

---

## 진행 체크리스트

| Phase | 상태 | 완료일 |
|-------|------|--------|
| 0 LOCK | ✅ | 2026-07-14 |
| 1 API | ✅ | 2026-07-14 |
| 1b 이메일 재인증 | ⏭ 스킵 (L1=A) | 2026-07-14 |
| 2 연관 데이터 | ✅ | 2026-07-14 |
| 3 FE UI | ✅ | 2026-07-14 |
| 4 세션·쿠키 | ✅ (Phase 3 흡수 + /me 401) | 2026-07-14 |
| 5 Resend 메일 | ✅ | 2026-07-14 |
| 6 완료 페이지 | ✅ | 2026-07-14 |
| 7 테스트·E2E | ✅ BE 8 · E2E 1 passed | 2026-07-14 |
| 8 문서·staging | ✅ 문서 · 🔄 Owner smoke | 2026-07-14 (docs) |

---

## 다음 액션

1. **Owner:** staging에서 Task 8-2 smoke 3항목 확인 후 이 문서 체크.
2. smoke 통과 후 production 배포·노출.
