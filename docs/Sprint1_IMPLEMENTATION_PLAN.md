# Sprint1_IMPLEMENTATION_PLAN.md

**기준:** `docs/PROJECT_BACKLOG.md` · Sprint 1 — Honest Loop Foundations  
**작성:** 2026-07-28  
**범위 밖:** Sprint 2+ Task, Out of scope 기능, 스타일-only 리팩터

---

# Sprint Goal

제품이 **거짓말하지 않기** 시작한다: 가입 딥링크·OG·CTA/H1 퀵윈을 고치고, **저장한 결과를 서버 스냅샷으로 다시 열며**, 재오픈 이벤트를 최소 기록한다.

---

# Included Tasks

| ID | 목적 | 사용자 영향 | Priority | 관련 파일 (예상) | 변경 범위 |
|----|------|-------------|----------|------------------|-----------|
| **AUTH-01** | `?mode=signup` → 가입 탭 | 가입 유입 복구 | P1 | `frontend/src/app/auth/auth-page-client.tsx` | S — query 초기화만 |
| **SEO-01** | 공개 페이지 og:image | SNS 미리보기 | P1 | `frontend/src/lib/seo/page-metadata.ts`, 테스트 | S — public metadata에 images |
| **HOME-01** | Primary CTA 「추천 설문 시작」통일 | 인지 부하↓ | P2 | `site-header.tsx`, `app/page.tsx` (히어로는 이미 통일) | S — 문자열 |
| **HOME-02** | H1 DOM 공백 | 낭독/스니펫 | P3 | `home/hero.tsx` | S — 공백 노드 |
| **RET-01** | 서버 스냅샷으로 다시 보기 | 리텐션·신뢰 | P0* | save UI, mypage restore, metadata | L — metadata+restore 경로 |
| **KPI-01** | 재오픈 이벤트 스키마(부분) | 북스타 측정 | P1 부분 | restore 핸들러 + `emitExplorationEvent` | S — revisit 이벤트 |

\*백로그: 리텐션 관점 P0 취급.

**코드 조사 메모 (계획 시점)**  
- Root `layout.tsx`에는 이미 og:image 있음. **페이지별 `publicPageMetadata`가 images 없이 openGraph를 덮어써** 공개 페이지에서 null로 관측됨 → SEO-01은 helper 수정.  
- 저장 API `metadata`는 임의 dict 허용 → **마이그레이션 없이** `resultSnapshot`을 metadata에 넣으면 됨.  
- 기존 저장분(스냅샷 없음)은 AC대로 disabled + 정확한 사유 유지.

---

# Dependency Graph

```
AUTH-01 ──┐
SEO-01  ──┼── (병렬 가능, 상호 무관)
HOME-01 ──┤
HOME-02 ──┘
              │
              ▼
           RET-01  (Foundation save/restore)
              │
              ▼
           KPI-01  (재오픈 이벤트 — RET-01 복원 성공 경로에 연결)
```

---

# 개발 순서 (안전 재배치)

| # | Task | 층 | 선행 | 후속 |
|---|------|-----|------|------|
| 1 | AUTH-01 | Foundation / UI | — | — |
| 2 | SEO-01 | Foundation / SEO | — | — |
| 3 | HOME-01 | Foundation / Copy | — | — |
| 4 | HOME-02 | Foundation / A11y copy | — | — |
| 5 | RET-01 | Business + UI | — | KPI-01 |
| 6 | KPI-01 (부분) | Analytics | RET-01 | — |

각 Task 후: **Build → Lint → Typecheck → 관련 Unit/Integration Test → 통과 시에만 다음**.

---

# Task 상세 (재배치)

### AUTH-01
- **목적:** `mode=signup` 쿼리 시 가입 탭  
- **변경 파일:** `auth-page-client.tsx` (+ 가능하면 단위 테스트)  
- **영향 범위:** `/auth` 초기 탭만. 로그인/가입 API 변경 없음  
- **선행 / 후속:** 없음 / 없음  

### SEO-01
- **목적:** `publicPageMetadata` openGraph에 default OG 이미지  
- **변경 파일:** `page-metadata.ts`, `page-metadata.test.ts`  
- **영향 범위:** 공개 페이지 OG. private noindex 정책 유지  
- **선행 / 후속:** 없음 / 없음  

### HOME-01
- **목적:** 헤더·홈 하단 Primary를 「추천 설문 시작」으로  
- **변경 파일:** `site-header.tsx`, `app/page.tsx`  
- **영향 범위:** 홈/헤더 CTA 라벨. 라우트 `/recommend` 유지  
- **선행 / 후속:** 없음 / 없음  

### HOME-02
- **목적:** H1 `취향에 맞는` + `키보드` 사이 공백  
- **변경 파일:** `hero.tsx`  
- **영향 범위:** 홈 H1 텍스트만  
- **선행 / 후속:** 없음 / 없음  

### RET-01
- **목적:** 계정 저장 시 SurveySubmission을 서버 metadata에 저장; MyPage에서 로컬 없어도 복원  
- **변경 파일:** `recommendation-result-view.tsx`, `mypage-saved-builds.tsx`, 필요 시 `saved-result-snapshots.ts` / 테스트  
- **영향 범위:** 계정 저장 payload 크기↑, 다시 보기 enable 조건, `/results` hydration. **기존 로컬 스냅샷 경로 유지.** 스냅샷 없는 구 저장분은 disabled 유지(파괴적 강제 복원 없음)  
- **선행 / 후속:** 퀵윈과 독립 / KPI-01  
- **위험 이유:** metadata에 submission을 넣으면 EvalEvent payload가 커짐 → 최소 필드로 충분하면 전체 submission 유지(결과 화면이 요구). 기존 북마크 dedupe(`already_saved`)는 스냅샷 없는 옛 row를 반환할 수 있음 → 새 저장 시에만 스냅샷 보장; 구 row는 사유 카피.

### KPI-01 (Sprint1 부분)
- **목적:** 다시 보기 성공 시 `interaction.revisit`(또는 동등) 1회 best-effort  
- **변경 파일:** `mypage-saved-builds.tsx` (+ 타입에 이미 있는 event)  
- **영향 범위:** 분석 이벤트만. UI 차단 없음  
- **선행 / 후속:** RET-01 / —  

---

# Risk

| Risk | 완화 |
|------|------|
| 큰 metadata / DB payload | submission 직렬화만; 불필요 복제 금지. 실패 시 저장 자체는 기존과 동일하게 동작해야 함 |
| 구 저장분 복원 불가 | AC: disabled + 정확한 사유 (신규 저장부터 복원) |
| already_saved가 스냅샷 없는 row 반환 | 복원 불가 안내; 필요 시 사용자가 결과에서 재저장(Sprint1에서 upsert 강제 확장은 백로그 밖이면 하지 않음) |
| OG 중복/절대 URL | `metadataBase` 있는 layout과 helper images 경로 `/og/default.png` 정합 |
| 회귀 | Task별 lint/tsc/vitest; Sprint 끝 관련 테스트만 |

---

# Rollback 방법

- Git: Sprint 커밋 revert 또는 Task 단위 파일 restore.  
- RET-01만 문제 시: metadata에서 `resultSnapshot` 기록/읽기 제거 → 이전 로컬-only 동작으로 복귀(구 UI 카피 유지).  
- SEO-01: `publicPageMetadata` images 제거.  
- AUTH/HOME: 문자열·query 초기화 원복.

---

# 검증 방법

| Task | 검증 |
|------|------|
| AUTH-01 | `/auth?mode=signup` → 가입 탭; `mode` 없음 → 로그인 |
| SEO-01 | `publicPageMetadata` 결과에 `openGraph.images` 존재 (unit) |
| HOME-01 | 헤더·홈 하단 라벨 「추천 설문 시작」 |
| HOME-02 | H1 textContent에 `맞는 키보드` 공백 |
| RET-01 | 저장 후 localStorage 스냅샷 삭제 → MyPage 다시 보기 → 결과 복원 (수동/가능하면 unit) |
| KPI-01 | 복원 클릭 시 events API 호출 시도 (best-effort, 네트워크 mock 가능) |
| Sprint | frontend lint, tsc, 관련 vitest; backend 관련 pytest if touched |

**전체 사이트 QA는 하지 않는다** (백로그 지시).
