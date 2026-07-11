# Results UX — Phase 4 Product Decision

> **날짜:** 2026-07-09  
> **프로세스:** Observe → Compare → Owner Decision  
> **상태:** Implemented (Remove `save_compare` · Defer `activity` tab removal)

## Observe (요약)

| 신호 | 관측 |
|------|------|
| Phase 2 CTA + Drawer | 저장·비교 주 경로가 Overview CTA + Compare Drawer로 이동 |
| `save_compare` 탭 | Phase 2에서 Drawer redirect만 수행 — 독립 UI 없음 |
| E2E | save/compare는 탭 없이 CTA·Drawer로 검증 (critical-flows) |
| Activity 탭 | 사용 데이터 충분 전 — accordion 후보로 유지 검토 |

## Compare (상대)

| 후보 | 장점 | 단점 |
|------|------|------|
| **save_compare Remove** | IA 단순화 · Drawer 단일 비교 UI · Phase 2와 일치 | 북마크 UI는 CTA/Drawer에만 존재 |
| **save_compare Keep (redirect)** | 기존 사용자 습관 | 탭·Drawer 이중 진입 · deprecated 혼란 |
| **activity Remove → accordion** | 탭 2개로 축소 | 활동 데이터 적을 때 빈 accordion |
| **activity Keep** | 전용 탭으로 활동 탐색 명확 | 탭 수 유지 |

## Owner Decision

| 항목 | 결정 | 근거 |
|------|------|------|
| `save_compare` 탭 | **Remove** | CTA + Drawer가 유일 저장·비교 UI (Phase 2 목표 달성) |
| `activity` 탭 | **Defer (Keep)** | Observe 기간 미충족 · accordion 이전은 Phase 5 백로그 |
| 탭 구성 (Backend) | `추천 요약` · `추천 근거` · `최근 활동` | activity Keep |

## Rollback

- **Keep:** `save_compare` 탭 + Drawer redirect 복원 PR (results-types · tab-shell · orchestrator)
- **Remove 후:** 탭 복원만으로 rollback — Drawer·CTA 유지 가능

## Dev Gate

- [x] Owner Decision 기록 (본 문서)
- [x] `save_compare` 탭 UI 제거
- [x] E2E Drawer-only (deprecated 탭 테스트 제거)
- [x] Vitest + E2E green
