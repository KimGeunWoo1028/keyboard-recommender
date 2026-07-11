# Product Next — Phase 실행 로드맵

> **버전:** v1.0 — 2026-07-10 (KST)  
> **목적:** Home IA LOCK 이후 **다음에 무엇을 어떤 순서로** 할지의 단일 진입점  
> **원칙:** Home은 최소 teardown만 · 리소스는 **Results → Evidence → MyPage**

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Tech Lead** | §Phase 순서 · §Do not · §Revisit Home |
| **Cursor / 구현** | 해당 Phase의 **상세 문서**만 열고 Task 실행 |

**한 Phase = 한 집중 구간.** Home «조금만 더»로 Phase를 끼워 넣지 않는다.

```
0 Home teardown → 1 Results → 2 Evidence(유지) → 3 MyPage → 4 Launch·Data → 5 Home revisit(조건부)
```

---

## 상세 문서 맵

| Phase | 상세 로드맵 | 비고 |
|-------|-------------|------|
| **0** | `docs/home-ia-locked.md` §Task W-1 | Home **유일** 잔여 코드 |
| **1** | `docs/results-ux-roadmap.md` | 결과 이해·CTA·모바일 등 |
| **2** | `docs/evidence-tab-simplification-roadmap.md` | Phase 0–4 **완료**(2026-07-10). 회귀·갭만 |
| **3** | (문서 thin) · 코드 `frontend/src/components/features/mypage/*` | Continue/Manage 본진 안정화 |
| **4** | 출시·관찰 (Analytics / Phase 7류) | Redirect·Login Home **아직 금지** |
| **5** | `docs/home-ia-locked.md` §Revisit When | 조건 충족 전 **착수 금지** |

**이력(완료):** `docs/home-ux-roadmap.md` Phase 1–3 — 카피·그리드·초기 Preview. 방향은 `home-ia-locked.md` 우선.

**제품 원칙:** `docs/home-ia-locked.md` — Landing · Workspace 삭제 · Dashboard 보류 · Why · No Home Changes.

---

## Do not (전 Phase 공통)

- Home Dashboard / Workspace 부활(이름만 바꿔 부활 포함)
- Login redirect A/B · Guest/Login 레이아웃 포크
- Preview 대시보드화 · 가짜 Match %
- Compare UI 복원 (제거 확정)
- Results·MyPage가 흔들리는 동안 Home 신규 기능

---

# Phase 0. Home — Workspace teardown · **1 PR**

> Landing만 남긴다. **이것만** Home 코드 변경 허용.

## Cursor 실행

### Task 0-1 — WorkshopStrip 제거

**상세:** `docs/home-ia-locked.md` §Task W-1

**작업**

- `page.tsx`에서 `WorkshopStrip` 제거
- 미사용 시 `workshop-strip.tsx` 삭제
- Hero → 추천 구성 안내 → Footer

| Primary |
|---------|
| `frontend/src/app/page.tsx` |
| `frontend/src/components/features/home/workshop-strip.tsx` |

**Dev Gate**

- [x] 홈에 WORKSHOP / 빌드 워크스페이스 없음
- [x] 설문 CTA는 Hero(+ 헤더 «추천»)만

**Out of Scope:** Preview 리디자인 · Redirect · Dashboard 섹션

**Status:** ✅ 완료 — 2026-07-10 · `WorkshopStrip` 제거 · `workshop-strip.tsx` 삭제

**Rollback:** `WorkshopStrip` 복원

---

# Phase 1. Results · **감사 · 잔여 없음**

> 사용자가 가장 오래 머무는 화면. **Survey start → 결과 이해 → 저장** 퍼널의 본체.  
> **상세 이력:** `docs/results-ux-roadmap.md` (v6.2 · Phase 0–7 완료)

## Cursor 실행

### Task 1-0 — 로드맵 vs 코드 감사 (필수 · 구현 없음)

`results-ux-roadmap.md`에 «미완 Task»를 가정하고 재구현하지 말 것. 코드·문서 기준으로 확인:

| 로드맵 Phase | 코드 상태 (2026-07-10) |
|--------------|------------------------|
| 0 분리 | ✅ `results/*` 존재 |
| 1 Overview 6축 | ✅ `e2e-server-ranked` · Overview 카드 |
| 2 CTA | ✅ `e2e-save-build` (저장). **비교 CTA·Drawer는 이후 제품 결정으로 제거됨** |
| 3 Evidence | ✅ Evidence 탭 · terminology (전용 로드맵 Phase 0–4도 완료) |
| 4 IA | ✅ 탭 `overview` \| `evidence` only · `save_compare`/`activity` 없음 |
| 5–6 모바일·polish | ✅ (§4.15 포함) |
| 7 Validation | ✅ `results-ux-phase7-validation-report.md` |

**Dev Gate (감사)**

- [x] 탭 2개만 (`results-types.ts`)
- [x] `e2e-server-ranked` · `e2e-save-build` 존재
- [x] Compare 복원 금지 (`compare-drawer.tsx` 없음 · E2E compare 없음)
- [x] Overview 마이페이지 링크 → `/mypage?section=saved` (activity 아님)
- [x] recommendation Vitest green (58)

**Out of Scope:** Compare 재도입 · Home 변경 · Evidence 대공사 · MyPage 대공사

**Status:** ✅ 완료 — 2026-07-10 · **추가 Results 구현 Task 없음** → Phase 2·3로

**의존:** Phase 0 Home teardown 완료

---

# Phase 2. Evidence · **유지 / 갭만**

> `evidence-tab-simplification-roadmap.md` **Phase 0–4 완료** (2026-07-10).  
> 검증: `docs/evidence-tab-phase4-validation.md`

## Cursor 실행

### Task 2-1 — 회귀·갭만

- Results 작업 중 Evidence IA를 깨지 않기
- 로드맵 Non-goals 유지 (알고리즘·Match 계산식·Compare 복원 금지)
- **신규 Evidence 대공사 착수 금지** — 갭이 있으면 짧은 PR로 한정

**상세:** `docs/evidence-tab-simplification-roadmap.md`

**Status:** ✅ 완료 — 2026-07-10 · 갭 수정: pick 카드에 ranking-why(concrete) 재연결 · fallback UI 숨김(E2E·trust layer 정합) · `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0` opt-out

**검증 (step-by-step)**

| # | 단계 | 결과 |
|---|------|------|
| 1 | IA audit (trust · why · tradeoff · thresholds · Non-goals) | ✅ |
| 2 | 갭: `formatEvidenceRankingWhy` 존재하나 pick 카드 미연결 | ✅ 발견 → 수정 |
| 3 | Vitest ranking-why + pick-card | ✅ 18 passed |
| 4 | Vitest recommendation suite | ✅ 61 passed |
| 5 | E2E stable fixture → `e2e-pick-ranking-why` count 0 (fallback) | ✅ 스펙 유지 |

---

# Phase 3. MyPage 안정화 · **1~N PR**

> Continue / Manage **본진**. Home Snapshot·Workspace로 대체하지 않는다.

## Cursor 실행

### Task 3-1 — 저장·개요·계정 스모크

**범위 (의도적 얇음 — 별도 대공사 로드맵 없음)**

- 저장 목록 master–detail · 결과 다시 보기
- 개요(취향 스냅샷·저장 허브) · 계정(프로필·보안·아바타)
- 빈 상태·로그인 게이트·모바일

| Primary |
|---------|
| `frontend/src/components/features/mypage/*` |

**Dev Gate**

- [x] 저장 / 개요 / 계정 탭 깨지지 않음
- [x] Home이 아닌 MyPage에서 Continue 가능

**Out of Scope:** 활동 탭 복원 · Home Dashboard · Compare

**Status:** ✅ 완료 — 2026-07-10 · 스모크 테스트·E2E 보강 · `MyPageComingSoon` 제거 · activity→saved 딥링크 유지

**검증 (step-by-step)**

| # | 단계 | 결과 |
|---|------|------|
| 1 | IA audit (개요·저장·계정 3탭 · 활동/비교 없음 · Results→saved 링크) | ✅ |
| 2 | 갭: MyPage 단위 테스트 0 · ComingSoon 잔존 · E2E 얇음 | ✅ 발견 → 수정 |
| 3 | Vitest mypage (hub/overview/saved/build-stack) | ✅ 13 passed |
| 4 | Vitest features suite | ✅ 76 passed |
| 5 | E2E critical-flows mypage 탭·activity 리다이렉트 스펙 | ✅ 추가 |

---

# Phase 4. Launch · Data · **0 코드~관찰**

> 핵심 퍼널이 안정된 뒤.  
> 검증 리포트: `docs/product-next-phase4-launch.md`

## Cursor 실행

### Task 4-1 — 출시 체크 · 관찰 이벤트

- Results / Evidence / MyPage DoD 충족 여부 확인
- (인프라 있을 때) bookmark · results 체류 등 관찰 (`results-ux-roadmap` Phase 7류 참고)
- Compare 제거 반영: `drawer_open` / `comparison` UI emit **비활성** (스키마만 잔존 가능)

**Dev Gate**

- [x] 설문 → 결과 → 저장 플로우 수동 E2E (자동화: `critical-flows`)
- [x] Home에 Workspace/Dashboard 없음

**Out of Scope:** Login redirect 실험 · Home A/B · Dashboard

**Status:** ✅ 완료 — 2026-07-10 · DoD 확인 · Observe 목록 갱신 · Home Landing 게이트 테스트 · 집계 대시보드는 후속(인프라)

**검증 (step-by-step)**

| # | 단계 | 결과 |
|---|------|------|
| 1 | Results / Evidence / MyPage DoD | ✅ Phase 1–3 완료 상태 재확인 |
| 2 | Home Landing (WorkshopStrip/Dashboard 없음) | ✅ `page.tsx` + 파일 삭제 확인 |
| 3 | Observe 이벤트 재목록 (Compare 폐기) | ✅ `product-next-phase4-launch.md` §2 |
| 4 | Vitest Phase 4 inventory + Home gate | ✅ 4 passed |
| 5 | Vitest features + Phase 4 | ✅ 80 passed |

---

# Phase 5. Home revisit · **조건부만**

> `docs/home-ia-locked.md` §Revisit When **전부** 충족 후에만 **제품** 논의를 연다.  
> 검증: `docs/product-next-phase5-home-revisit.md`

## 착수 조건 (AND)

- [x] Results UX 완료
- [x] Evidence 정리 완료(유지)
- [x] MyPage UX 안정
- [x] Home 진입 데이터 **수집 배선** (`home.viewed`) — 2026-07-10
- [ ] 실제 재방문 / Home 진입 **집계·표본** (인프라·관측 기간)

## Cursor 실행 (데이터 전제만 — 제품 unlock 아님)

### Task 5-0 — Home entry observe

- `home.viewed` → `POST /api/v1/recommendations/events` (세션당 1 · guest/auth 태그)
- Home IA 변경 금지 (Redirect · Dashboard · dual Hero)

**Dev Gate**

- [x] `home.viewed` 스키마·emit·세션 중복 방지
- [x] Home에 Dashboard/Workspace 없음

## 그때 논의 후보 (지금은 백로그 — 표본 후)

- Login redirect (`/results` · `/mypage`)
- Login Home / Preview 개인화 정도
- (데이터 근거 있을 때만) Dashboard 여부 — **Why 반박 필수**

**Status:** ✅ 데이터 전제 배선 완료 · 🔒 제품 revisit (Redirect/Dashboard) LOCKED

**검증 (step-by-step)**

| # | 단계 | 결과 |
|---|------|------|
| 1 | LOCK 게이트 — Redirect/Dashboard 미착수 | ✅ |
| 2 | `home.viewed` 스키마 수용 (backend) | ✅ |
| 3 | HomeLandingObserve 세션 1회 | ✅ Vitest |
| 4 | Home Landing IA 유지 | ✅ |
| 5 | Vitest + pytest 회귀 | ✅ Vitest 81 · pytest unified 10 |

---

## 권장 일정 (상대)

| Phase | 언제 |
|-------|------|
| 0 | 다음 작업 세션 · 짧게 |
| 1 | Phase 0 직후 · 주력 |
| 2 | Phase 1과 병행 시 회귀만 |
| 3 | Phase 1과 병행 또는 직후 |
| 4 | 1–3 안정 후 |
| 5 | 데이터 후 |

---

## Success (제품)

| # | 완료 |
|---|------|
| 1 | Workspace 제거 · Home = Landing |
| 2 | Results에서 추천 이해·저장이 됨 |
| 3 | Evidence가 Results 신뢰를 해치지 않음 |
| 4 | MyPage가 Continue/Manage 본진으로 동작 |
| 5 | Home «조금만 더»에 리소스가 새지 않음 |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-07-10 | 초안 — LOCK 이후 Next Phases (0 teardown → Results → Evidence 유지 → MyPage → Data → Home revisit) |
| v1.1 | 2026-07-10 | Phase 0 완료 — WorkshopStrip teardown |
| v1.2 | 2026-07-10 | Phase 1 감사 완료 — Results UX 잔여 구현 없음 · Compare 미복원 |
| v1.3 | 2026-07-10 | Phase 2 완료 — ranking-why pick 카드 재연결(concrete) · Vitest 61 green |
| v1.4 | 2026-07-10 | Phase 3 완료 — MyPage 스모크·E2E 보강 · ComingSoon 제거 |
| v1.5 | 2026-07-10 | Phase 4 완료 — Launch DoD·Observe 목록 · `product-next-phase4-launch.md` |
| v1.6 | 2026-07-10 | Phase 5 데이터 전제 — `home.viewed` 배선 · 제품 revisit LOCK 유지 |
