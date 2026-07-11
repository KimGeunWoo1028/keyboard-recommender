# Results UX — Phase 7 Validation 리포트

> **날짜:** 2026-07-09  
> **유형:** 0 PR · Observe → Feedback → Iteration  
> **범위:** `/results` Results UX Phase 0~6 완료 후 1회 검증

---

## 1. Observe — 이벤트·구현·테스트 집계

### 1.1 Results UX 관련 이벤트 (코드 기준)

| event_type | scenario_id | 발생 위치 | metadata (주요) | Success 연결 |
|------------|-------------|-----------|-----------------|--------------|
| `interaction.drawer_open` | `results_ux_v1` | `recommendation-result-view` · Compare Drawer 열기 | `source`, `buildId`, `compareLeft/Right` | #3 Drawer 비교 |
| `interaction.results_tab_click` | `results_ux_v1` | 탭 전환 | `tab`, `buildId` | 탭 IA 추적 |
| `interaction.bookmark` | (activity API) | 빌드 저장 | `buildId`, title 등 | #2 탭 없이 저장 |
| `interaction.comparison` | (activity API) | 비교 저장 | `leftItemId`, `rightItemId` | #3 비교 후속 |
| `interaction.click` | (activity API) | 스웨그키·부품 링크 클릭 | `buildId`, URL 등 | #5 스웨그키 경로 |
| `interaction.refinement` | `results_refinement_v1` | confidence refinement | step/answer | Evidence 신뢰 |
| `kpi.time_to_first_result` | `kpi_v1` | 설문 제출 → 결과 | duration | 퍼널 (설문 쪽) |

**전송:** `POST /api/v1/recommendations/events` · `emitResultsUxEventBestEffort` (best-effort, UI 비차단)

**Phase 7 한계 (Out of Scope):** 프로덕션 집계·전환율·A/B — analytics 스택 없음. 아래는 **구현·E2E 커버리지** 기준 Observe.

### 1.2 Success Definition (#1~8) 검증 상태

| # | 완료 기준 | 구현 | 자동 검증 | 수동 |
|---|-----------|------|-----------|------|
| 1 | 6축 First View | ✅ Overview 6축 카드 최상단 | `e2e-server-ranked` | 스크린샷 |
| 2 | 탭 없이 저장 | ✅ CTA `e2e-save-build` | critical-flows save | bookmark API |
| 3 | Drawer 비교 | ✅ `compare-drawer` + hub | `e2e-compare-panel`, drawer_open emit | — |
| 4 | Evidence 이해 | ✅ 3단 구조 + keyboard-terminology | `e2e-pick-explanations` | 용어 QA 100% |
| 5 | 스웨그키 경로 | ✅ CTA·6축·대안 링크 | click → activity (코드) | — |
| 6 | 모바일 동일 흐름 | ✅ Phase 5·6 | 375px E2E | 375px 체크리스트 |
| 7 | Owner Decision | ✅ Phase 4 문서 | — | `results-ux-phase4-decision.md` |
| 8 | Post-launch Validation | ✅ 본 리포트 | E2E green | Iteration Top 3 |

### 1.3 Phase 0~6 완료 요약

| Phase | 상태 | 산출물 |
|-------|------|--------|
| 0 | ✅ | results/* 컴포넌트 분리 |
| 1 | ✅ | Overview 재정렬 |
| 2 | ✅ | CTA + Compare Drawer |
| 3 | ✅ | Evidence + terminology |
| 4 | ✅ | `save_compare` Remove · activity Keep |
| 5 | ✅ | 모바일 레이아웃 + QA 백로그 |
| 6 | ✅ | UI polish (9/15 완료, 4 defer) |

### 1.4 E2E 커버리지 (Results 관련)

| 스펙 | 테스트 수 | Results UX |
|------|-----------|------------|
| `critical-flows.spec.ts` | 7 | ranked · save CTA · drawer · 375px mobile |
| `recommendation-survey.spec.ts` | 1 | ranked · quality · evidence tab |

---

## 2. Feedback — QA · 이슈 · 정성

### 2.1 자동 검증 (2026-07-09 실행)

| 단계 | 결과 |
|------|------|
| `tsc --noEmit` | ✅ |
| `npm run lint` | ✅ |
| Vitest | ✅ 25 passed (`matchMedia` jsdom 가드 수정) |
| E2E (critical-flows + recommendation-survey) | ✅ 9 passed (fresh stack + `PW_REUSE_SERVER=1`) |

### 2.2 Phase 6 defer 잔여 (정성·우선순위)

| 항목 | 코멘트 |
|------|--------|
| activity → accordion | Phase 4 Owner Keep — 실사용 Observe 후 재검토 |
| Drawer drag-to-dismiss | Esc·backdrop으로 충분, 제스처는 Nice-to-have |
| CTA sticky | First View 개선 후 재평가 |
| 375px 스크린샷 회귀 | E2E functional OK, visual regression 미구축 |
| 대안 carousel | 1열 grid로 모바일 가독성 수용 |

### 2.3 수동 QA (Owner/PM)

Phase 6 체크리스트 (`results-ux-phase6-completion.md`) — **브라우저 375px** 에서 최종 tick 권장:

- [ ] Hero 취향 요약 details
- [ ] 탭 바 스크롤 + fade
- [ ] 품질 요약 접기
- [ ] Drawer bottom sheet + Esc

---

## 3. Iteration — Top 3 백로그 (Owner 합의)

> **프로세스:** Observe(본 리포트) → Compare → **Owner 승인** 후 착수  
> **재정의 (2026-07-10):** `docs/remaining-work-phases.md` Phase A–F가 후속 단일 진입점.

| 순위 | 구 Phase 7 항목 | 2026-07-10 결정 | 후속 |
|------|-----------------|-----------------|------|
| **1** | activity 탭 → Overview accordion | **완료(대체)** — activity 탭 제거 · Continue = `/mypage?section=saved` | 추가 구현 없음 |
| **2** | 375px Playwright 스크린샷 회귀 | **Defer** (선택) | `remaining-work-phases.md` **Phase D** |
| **3** | Analytics 집계 (bookmark·탭·Home; Compare 제외) | **후속** | `remaining-work-phases.md` **Phase C** (+ **Phase B** 표본) |

### Owner 합의 (기록)

| 항목 | 결정 | 서명/날짜 |
|------|------|-----------|
| Top 3 재정의 (remaining A→F) | **승인** | Owner: Product Owner / 2026-07-10 |
| activity accordion | **완료(대체)로 종결** | 2026-07-10 · §4.15 |
| Phase 7 Validation close-out | **A-1 + A-2 완료** | 2026-07-10 · `remaining-work-phases.md` Phase A |

---

## Dev Gate 체크리스트

- [x] Observe 리포트 1회 (본 문서)
- [x] Iteration Top 3 정의
- [x] E2E green 유지 (9 passed, 2026-07-09)
- [x] Owner Top 3 합의 (재정의 · remaining-work Phase A–F · 2026-07-10)
- [x] 375px 수동 QA (현재 IA) — `remaining-work-phases.md` Phase A-2 · 코드+E2E 검증 2026-07-10

---

## 부록 — Observe 이벤트 쿼리 (추후 인프라)

로드맵 부록 이벤트:

- `interaction.bookmark` → 저장 전환
- `interaction.comparison` → 비교 저장
- `interaction.click` → 스웨그키·카탈로그
- `interaction.drawer_open` → Drawer 발견성
- `interaction.results_tab_click` → Evidence 체류 proxy

**Optional:** Hotjar · Session Replay · `/api/v1/recommendations/events` 집계 파이프라인 연결 시 Phase 7 Observe 수치화 가능.
