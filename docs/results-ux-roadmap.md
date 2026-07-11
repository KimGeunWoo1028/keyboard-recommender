# Results UX — Master 실행 가이드

> **대상:** `/results` · **제품 목표:** 추천 이해 → 신뢰 → 저장 → 스웨그키
>
> **버전:** v6.2 — 2026-07-10 (KST)
>
> ### ✅ Phase 0–7 **완료** (2026-07-09) · 후속 §4.15 (2026-07-10)
> 신규 Results 작업은 **이 로드맵에 남은 미완 Task가 없다.**  
> 다음: `docs/product-next-phases.md` Phase 2(Evidence 유지) · Phase 3(MyPage).  
> **Compare Drawer / `save_compare` / activity 탭 재도입 금지.**

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **Cursor** | **`### Task N-M`** 블록만 복사 (L Phase) 또는 해당 Phase **`## Cursor 실행`** (나머지) |
| PM / Tech Lead | 원칙 · Product Decision · Success · DoD · 부록 |

**한 Task = 한 PR = 한 Cursor 세션** (목표 diff ~300줄 이하)

---

## 원칙 · 순서 · PR 요약

| 원칙 | |
|------|--|
| Phase 0 완료 후 UI | 리팩터링 ↔ UI 섞지 않음 |
| CTA는 6축 아래 | Hero = 정보 · CTA = 행동 |
| 비교 = Drawer | `save_compare` = deprecated redirect → Phase 4 Remove Candidate |
| Product Decision | **Phase 4만** |
| UI 끝 ≠ 제품 끝 | Phase 7 Validation |

**병목:** 6축이 밀림 · ENGINE OUTPUT · CTA/비교가 탭에 숨음 · monolith

| Phase | Expected PR | Task 분리 |
|-------|-------------|-----------|
| 0 | **2** | 0-1 · 0-2 |
| 1 | 1 | — |
| 2 | **2~3** | 2-1 · 2-2 · 2-3 · 2-4 |
| 3 | 1 | — |
| 4 | 0~1 | Decision 후 코드 |
| 5 | 1 | — |
| 6 | 1 | — |
| 7 | 0 | 리포트만 |

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
```

**Rollback (High-risk):** Phase **0 · 2 · 4** only

---

## Product Decision (Phase 4 전용)

```
Observe → Compare (상대 비교, % 없음) → Owner: Remove / Keep / Defer
```

관측: 스테이징 2주 또는 QA N≥30 세션.

---

# Phase 0. 컴포넌트 분리 · **2 PR**

> monolith 분리. UI 변화 없음.

## Cursor 실행

### Task 0-1 (PR-A) — Header + Overview

**작업:** `shared-result-header.tsx` · `results-overview-tab.tsx` 추출 · orchestrator 연결 · 동작·testid 동일

| Primary | Secondary |
|---------|-----------|
| `recommendation-result-view.tsx` | `recommendation-result-view.smoke.test.tsx` |
| `results/shared-result-header.tsx` | |
| `results/results-overview-tab.tsx` | |

**Dev Gate:** smoke + E2E green · **Checkpoint A** 후 0-2 착수

**Out of Scope:** UI 변경 · 나머지 탭 추출

---

### Task 0-2 (PR-B) — Evidence + SaveCompare + Activity + TabShell

**작업:** 4파일 추출 · orchestrator ~300줄 · `data-testid` 유지 (`e2e-server-ranked`, `e2e-save-build`, `e2e-compare-panel`, `e2e-pick-explanations`, `e2e-quality-diagnostics`)

| Primary | Secondary |
|---------|-----------|
| `recommendation-result-view.tsx` | `recommendation-result-view.smoke.test.tsx` |
| `results/results-evidence-tab.tsx` | |
| `results/results-save-compare-tab.tsx` | |
| `results/results-activity-tab.tsx` | |
| `results/results-tab-shell.tsx` | |

**Dev Gate:** smoke + E2E green · 4탭 수동 확인 · **Checkpoint B** → Phase 1 허용

**Out of Scope:** UI 변경 · Drawer

## 참고 (팀용)

**Rollback:** PR-A / PR-B 각각 revert · Risk: 대규모 회귀 → Checkpoint

---

# Phase 1. Overview 재정렬 · **1 PR** · **추천 이해**

## Cursor 실행

**작업:** Header → **6축** → CTA placeholder → 대안 → 배너 → accordion → refinement  
**삭제:** ENGINE OUTPUT · 신뢰도 중복 · MatchGauge `취향 매칭` · `e2e-server-ranked` → 6축 카드

| Primary | Secondary |
|---------|-----------|
| `results/results-overview-tab.tsx` | `results/shared-result-header.tsx` |

**Dev Gate:** 1280×800 6축 2행+ · `e2e-server-ranked` · E2E green

**Out of Scope:** CTA · Evidence · 탭

## 참고 (팀용)

Validation: First View 스크린샷 · swagkey click emit · Risk: discovery accordion 유지

---

# Phase 2. CTA + Drawer · **2~3 PR** · **저장 · 비교 · 스웨그키**

> 6축 직하 CTA. Drawer = 유일 비교 UI.

## Cursor 실행

### Task 2-1 — CTA 행

**작업:** 6축 직하 3버튼 — 저장(`e2e-save-build`) · 비교(트리거만) · 스웨그키. Hero 아님.

| Primary | Secondary |
|---------|-----------|
| `results/results-overview-tab.tsx` | |

**Dev Gate:** CTA 3버튼 visible

**Out of Scope:** Drawer 본체 · E2E 경로 변경

---

### Task 2-2 — Compare Drawer

**작업:** `compare-drawer.tsx` 신규 · `#comparison-hub` · 6축·대안 [비교하기] 연결

| Primary | Secondary |
|---------|-----------|
| `results/compare-drawer.tsx` | `results/results-save-compare-tab.tsx` |
| `results/results-overview-tab.tsx` | |

**Dev Gate:** Drawer open → `e2e-compare-panel`

**Out of Scope:** 탭 redirect · E2E save 경로

---

### Task 2-3 — Deprecated Redirect

**작업:** `save_compare` 탭 deprecated + 클릭 → Drawer redirect · `drawer_open` · `results_tab_click` emit

| Primary | Secondary |
|---------|-----------|
| `results/results-tab-shell.tsx` | `lib/api/onboarding-events.ts` |

**Dev Gate:** 탭·Drawer 독립 UI 병행 없음

**Out of Scope:** 탭 Remove (Phase 4)

---

### Task 2-4 — E2E

**작업:** `critical-flows.spec.ts` — 탭 없이 save · Drawer compare

| Primary | Secondary |
|---------|-----------|
| `e2e/tests/critical-flows.spec.ts` | |

**Dev Gate:** critical-flows 전체 green

**Out of Scope:** comparison-hub 로직 · 북마크 API

> Task 2-3+2-4는 **1 PR**로 묶어도 됨.

## 참고 (팀용)

Validation: bookmark · comparison · click · drawer_open emit  
**Rollback:** Drawer off · deprecated redirect만 유지 · Risk: Drawer 발견성 → CTA+대안 이중 진입

---

# Phase 3. Evidence · **1 PR** · **추천 신뢰**

## Cursor 실행

**작업:** 3단 스토리 · trait 한국어 · HelpHint · `keyboard-terminology/` · MetricGuideCard 상단

| Primary | Secondary |
|---------|-----------|
| `results/results-evidence-tab.tsx` | `lib/keyboard-terminology/` |

**Dev Gate:** 용어 QA 100% · `e2e-pick-explanations` · E2E green

**Out of Scope:** 점수 알고리즘 · Overview 근거 복제

---

# Phase 4. IA — Product Decision · **0~1 PR**

> Owner 승인 없이 탭 삭제 금지.

## Cursor 실행

**Decision 먼저** (코드 없음 가능). Owner Remove 시만:

- `save_compare` Remove → CTA+Drawer만
- Activity Remove Candidate → accordion 검토 후 제거
- `critical-flows.spec.ts` Drawer-only

| Primary | Secondary |
|---------|-----------|
| `results/results-tab-shell.tsx` | `results/results-activity-tab.tsx` |
| | `results/results-save-compare-tab.tsx` |
| | `e2e/tests/critical-flows.spec.ts` |

**Dev Gate:** Owner Decision 기록 · Remove 시 E2E green

**Out of Scope:** 승인 없는 삭제 · feature flag · 엔진

## 참고 (팀용)

Product Decision 섹션 참고 · **Rollback:** Keep=redirect · Remove 후 탭 복원 PR

---

# Phase 5. 모바일 + QA · **1 PR**

## Cursor 실행

**작업:** Hero 압축 · 6축 1열 · CTA full-width · Drawer bottom sheet · 빠른 이동 카드 제거 · QA→Phase 6 백로그

| Primary | Secondary |
|---------|-----------|
| `results/results-overview-tab.tsx` | `results/shared-result-header.tsx` |
| `results/compare-drawer.tsx` | `results/results-tab-shell.tsx` |

**Dev Gate:** 4 viewport overflow 없음 · 375px First View ≤1 스크롤 · 키보드·focus·SR · E2E green

**Out of Scope:** polish (Phase 6)

---

# Phase 6. UI Polish · **1 PR**

## Cursor 실행

**작업:** Phase 5 백로그만 (≤15) — spacing · typo · motion · a11y polish

**Dev Gate:** 백로그 100% 또는 defer · E2E green

**Out of Scope:** 신규 기능 · 대규모 카피

---

# Phase 7. Validation · **0 PR**

## Cursor 실행

1. **Observe** — 기존 이벤트 집계 → 1회 리포트
2. **Feedback** — QA · 이슈 · 정성 코멘트
3. **Iteration** — Top 3 백로그 · Owner 합의

**Dev Gate:** 리포트 1회 · Iteration Top 3 · E2E green 유지

**Out of Scope:** analytics 스택 · A/B (부록 참고)

---

# Cursor 작업 원칙

- 엔진 · contract · SessionStorage 변경 금지
- `data-testid` 값 유지 · E2E 동기화
- Product Decision = Phase 4 only
- Task당 한 PR · Checkpoint 전 다음 Task 금지 (Phase 0)

---

# Success Definition (제품)

| # | 완료 | 검증 |
|---|------|------|
| 1 | 6축 First View | 스크린샷 · `e2e-server-ranked` |
| 2 | 탭 없이 저장 | `e2e-save-build` · bookmark |
| 3 | Drawer 비교 | `e2e-compare-panel` · drawer_open |
| 4 | Evidence 이해 | 용어 QA · `e2e-pick-explanations` |
| 5 | 스웨그키 경로 | CTA·6축 · click |
| 6 | 모바일 동일 흐름 | 375px QA |
| 7 | Owner Decision | Phase 4 기록 |
| 8 | Post-launch Validation | Phase 7 리포트 |

---

# Definition of Done (개발·릴리즈)

Phase/Task PR마다:

- [ ] PR merge · review 완료
- [ ] 해당 **Dev Gate** 통과
- [ ] **E2E green**
- [ ] Phase 4 코드 변경 시 **Owner 승인** 기록
- [ ] 해당 **Success #** tick (위 표)

---

# 부록

**Analytics (추후):** bookmark→전환율 · drawer_open→compare · evidence click→체류

**Optional Tools (인프라 있을 때):** Hotspot · Session Replay · Phase 7 Observe 보강

**Phase 7 Observe 이벤트 (갱신 2026-07-10):** `interaction.bookmark` · `interaction.click` · `interaction.results_tab_click` · `interaction.revisit`/`repeated_view` · `interaction.refinement` · `kpi.time_to_first_result`  
~~`comparison` · `drawer_open`~~ — Compare UI 제거로 **비활성** (상세: `docs/product-next-phase4-launch.md`)
