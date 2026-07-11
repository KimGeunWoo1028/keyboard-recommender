# Home UX 정리 — 실행 로드맵

> **대상:** `/` (홈) · `frontend/src/components/features/home/*` · `frontend/src/app/page.tsx`  
> **제품 목표:** 카피·CTA 정합성 → 섹션 역할 분리 → (선택) 히어로 패널 개인화  
> **버전:** v1.4 — 2026-07-10 (KST)  
> **관련:** 마이페이지 개요/계정 · `/recommend` · `/catalog` · `/results` · `/mypage`
>
> ### ⛔ supersede
> **Home 방향·잔여 작업은 [`docs/home-ia-locked.md`](./home-ia-locked.md)가 우선이다.**  
> 이 문서는 Phase 1–3 **구현 이력**으로만 유지한다. Workspace 삭제·No Home Changes·Revisit When은 LOCK 문서를 따른다.

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **Cursor / 구현** | Phase별 **Cursor 실행** · Out of Scope |
| **PM / Tech Lead** | §결정 요약 · Success / Failure · Non-goals |

**한 Phase = 한 PR = 한 Cursor 세션** (목표 diff ~200줄 이하)

```
Phase 1 (필수) → Phase 2 (선택·가벼움) → Phase 3 (나중)
```

---

## 결정 요약 (LOCKED)

| # | 이슈 | 결정 |
|---|------|------|
| 1 | 숫자 카피 불일치 (5축/5탭 vs 6카드) | **추천 = 6축 빌드** · **카탈로그 = 6개 부품 축** 으로 통일 |
| 2 | 내부 시안 변명 노출 | 제품 안내 문장으로 교체 |
| 3 | 저장 카드 구식 카피 (활동/비교) | 현재 마이페이지 저장 빌드 의미로 수정 |
| 4 | 로그인 후에도 `/auth?next=...` | 로그인 시 직행 라우트 |
| 5 | WORKSHOP PREVIEW 더미 | **Phase 3** — 이번 묶음에서 제외 |
| 6 | 워크스페이스 ↔ 카탈로그 역할 겹침 | 카피 수준으로 역할 분리 (레이아웃 대수술 없음) |
| 7 | xl 6열 가독성 | Phase 2 — 3열×2행 유지 |

**한 번에 1~7 전부:** 비권장. 1~4+6은 같은 패치, 7은 가벼우면 동봉 가능, **5는 분리**.

---

## 용어 고정

| 용어 | 의미 | UI에서 쓸 말 |
|------|------|----------------|
| **6축 빌드** | 취향 스냅샷 축 (소음·무게감·구분감·탄성·반발감·선명도) | «맞춤 추천 · 6축 빌드» |
| **6개 부품 축** | 카탈로그 패밀리 (스위치·플레이트·폼·레이아웃·케이스·키캡) | «6개 부품 축» |
| 금지 | «5탭» «5개 축» «5개 카탈로그 축» | — |

> 히어로 «6축»과 카탈로그 «6개 부품 축»은 **다른 개념**이다. 숫자를 맞추되, 한 문장에 섞어 쓰지 말 것.

---

## Success / Failure

| Success | Failure |
|---------|---------|
| 홈 어디에도 5축/5탭·시안 변명·활동 탭 언급이 없음 | 로그인 사용자가 설문 CTA에서 다시 `/auth`로 감 |
| 워크스페이스 = 행동, 카탈로그 섹션 = 부품 설명으로 읽힘 | PREVIEW를 어설픈 개인화로 바꿔 빈 상태/깨진 데이터가 노출됨 |
| Phase 1만으로도 «정리됐다»는 체감 | 홈 전면 리디자인·새 섹션 추가로 범위 팽창 |

---

## Non-goals

- 히어로 헤드라인/비주얼 전면 개편
- 새 마케팅 섹션·통계·배지 추가
- 헤더(닉네임·아바타·로그아웃) 재작업 (별도 완료분)
- Acoustic/가격 위젯 복원
- Phase 3 PREVIEW를 Phase 1에 끼워 넣기

---

# Phase 1. 카피 · CTA 정합성 · **1 PR (필수)**

> 신뢰·일관성. UI 구조는 유지하고 문구·링크만 고친다.

## Cursor 실행

### Task 1-1 — 용어·제품 카피·로그인 CTA

**작업**

1. **용어 통일** (`page.tsx`, `hero.tsx`, `workshop-strip.tsx`, `feature-grid.tsx` 관련 문구)
   - 카탈로그 섹션: «5개 카탈로그 축» → «6개 부품 축»
   - 워크스페이스 카탈로그 카드: «5탭» → «6개 부품 축» 또는 «스위치부터 키캡까지»
2. **내부 문구 제거** (`workshop-strip.tsx`)
   - 삭제: «시안의 Acoustic·가격 위젯은 데이터가 없어 생략…»
   - 대체 예: «설문으로 조합을 만들고, 카탈로그에서 부품을 보고, 마음에 드는 빌드를 저장하세요.»
3. **저장 카드 카피** (`workshop-strip.tsx`)
   - 삭제: «북마크·비교·활동 기록…»
   - 대체 예: «저장한 추천 빌드를 다시 보고 관리합니다.»
   - 링크: `/mypage` 유지 또는 `/mypage?section=saved` (기존 쿼리 규칙에 맞출 것)
4. **섹션 역할 카피** (레이아웃 변경 없음)
   - 워크스페이스 제목/부제 = **시작 행동**
   - 카탈로그 섹션 부제 = **부품 축 설명** (행동 CTA와 말 겹치지 않게)
5. **로그인 분기 CTA** (`hero.tsx`, `workshop-strip.tsx`)
   - 비로그인: `/auth?next=/recommend`, `/auth?next=/results` 유지 가능
   - 로그인: `/recommend`, `/results` (또는 저장은 `/mypage?section=saved`) 직행
   - 구현: 기존 `AuthHeaderProvider` / `fetchCurrentUser` 패턴 재사용. 홈만 위한 새 전역 상태 금지.

| Primary | Secondary |
|---------|-----------|
| `frontend/src/app/page.tsx` | `frontend/src/components/layout/auth-controls.tsx` (읽기만) |
| `frontend/src/components/features/home/hero.tsx` | |
| `frontend/src/components/features/home/workshop-strip.tsx` | |
| `frontend/src/components/features/home/feature-grid.tsx` | (문구만 필요 시) |

**Dev Gate**

- [x] 홈 소스에 `5탭` / `5개` 축 / `시안` / `활동 기록` 없음
- [x] 로그아웃 상태: 설문 CTA → auth 경유
- [x] 로그인 상태: 설문 CTA → `/recommend` 직행
- [ ] 모바일·데스크톱 홈 스크롤·링크 클릭 스모크 *(수동)*

**Status:** ✅ 구현 완료 — 2026-07-10 · `AuthSessionProvider`로 헤더·홈 CTA 세션 공유

**Out of Scope:** WORKSHOP PREVIEW 내용 교체 · 그리드 열 수 · 히어로 디자인

**Rollback:** 카피/href만 revert

---

# Phase 2. 카탈로그 그리드 가독성 · **0~1 PR (선택)**

> Phase 1과 같은 PR에 넣어도 됨. 단독으로 미룰 수도 있음.

## Cursor 실행

### Task 2-1 — FeatureGrid 열 수

**작업:** `feature-grid.tsx`에서 `xl:grid-cols-6` 제거 → `lg`/`xl` 모두 **3열** (2행).

| Primary |
|---------|
| `frontend/src/components/features/home/feature-grid.tsx` |

**Dev Gate:** xl 폭에서 카드 본문이 읽기 쉬운지 확인 *(수동 — 3열×2행)*

**Status:** ✅ 구현 완료 — 2026-07-10 · `xl:grid-cols-6` 제거, `lg:grid-cols-3` 유지

**Out of Scope:** 카드 내용·순서 변경

---

# Phase 3. WORKSHOP PREVIEW 개인화 · **1 PR (나중)**

> Phase 1 완료 + 마이페이지 개요 데이터(취향 스냅샷·최근 저장)가 안정된 뒤.

## Product Decision (착수 전)

| 상태 | PREVIEW 내용 |
|------|----------------|
| 비로그인 | 6축/6부품 한 줄 요약 (정적, 더미 «활성» 나열 금지) |
| 로그인 + 취향 있음 | 고정 6축 미니 스냅샷 또는 «마지막 추천 · 상대시간» |
| 로그인 + 저장 있음 | 최근 저장 빌드 제목 1줄 + 마이페이지 링크 |
| 로그인 + 데이터 없음 | «설문으로 첫 추천을 받아보세요» + `/recommend` |

**빈 상태를 어설픈 완료 UI로 위장하지 말 것.**

## Cursor 실행

### Task 3-1 — Hero 우측 패널 교체

**작업:** `hero.tsx` 우측 `WORKSHOP PREVIEW`를 위 표 기준으로 교체. 가능하면 마이페이지 개요와 **같은 스냅샷 소스** 재사용.

| Primary | Secondary |
|---------|-----------|
| `frontend/src/components/features/home/hero.tsx` | `mypage-overview.tsx` / survey-storage / saved API (읽기) |

**Dev Gate:** 네 가지 상태 각각 깨지지 않음 · 로딩 깜빡임 최소화

**Status:** ✅ 구현 완료 — 2026-07-10 · `home-workshop-preview.tsx`  
- 비로그인: 6축/6부품 정적 요약 (더미 «활성» 제거)  
- 로그인+취향: 고정 6축 미니 스냅샷 + 상대시간  
- 로그인+저장: 최근 저장 제목 + `/mypage?section=saved`  
- 로그인+데이터 없음: 첫 설문 CTA  
- 소스: `loadLastKnownGoodSubmission` + `listSavedBookmarksWithLocalFallback` (개요와 동일)

**Out of Scope:** 홈 전체 리디자인 · 새 API

**Rollback:** 정적 PREVIEW로 되돌리기

---

## 권장 일정

| 순서 | 내용 | 예상 |
|------|------|------|
| 1 | Phase 1 | 반나절 이내 |
| 2 | Phase 2 (원하면 Phase 1에 포함) | 30분 |
| 3 | Phase 3 | Phase 1 머지 후, 별도 세션 |

---

## 체크리스트 (전체 Done)

- [x] Phase 1 머지
- [x] Phase 2 적용 또는 명시적 Defer
- [x] Phase 3 Decision 표 확정 후 착수 (또는 Defer 기록)
- [x] Home IA LOCK 문서 (`docs/home-ia-locked.md`)
- [x] Workspace 삭제 — LOCK §잔여 구현 Task W-1
- [ ] `docs/PROJECT_CONTEXT.md` 홈 관련 한 줄 갱신 (선택)

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-07-10 | 초안 — 홈 리뷰 1~7항 반영, Phase 1 필수 / 5=Phase 3 분리 |
| v1.1 | 2026-07-10 | Phase 1 구현 — 용어/카피/로그인 CTA · `AuthSessionProvider` |
| v1.2 | 2026-07-10 | Phase 2 구현 — FeatureGrid 3열×2행 |
| v1.3 | 2026-07-10 | Phase 3 구현 — WORKSHOP PREVIEW 개인화 |
| v1.4 | 2026-07-10 | supersede → `home-ia-locked.md` (원칙 LOCK · Home 논의 종료) |
