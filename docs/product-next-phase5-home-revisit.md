# Product Next — Phase 5 Home revisit (조건부)

> **날짜:** 2026-07-10  
> **마스터:** `docs/product-next-phases.md` Phase 5 · `docs/home-ia-locked.md`  
> **원칙:** Revisit When **전부** 충족 전 Redirect / Login Home / Dashboard **착수 금지**

---

## 1. Gate 판정

| AND 조건 | 상태 |
|----------|------|
| Results UX 완료 | ✅ |
| Evidence 정리 완료 | ✅ |
| MyPage UX 안정 | ✅ |
| 실제 재방문 / Home 진입 **데이터** | 🔄 **수집 배선만** — 집계·표본 확보 전 |

**제품 잠금 유지:** Login redirect · dual Hero · Dashboard · Preview 대시보드화 → **Do not implement**

**이번 Phase 5에서 한 일 (데이터 전제만):**

- `home.viewed` 이벤트 스키마 + Home Landing best-effort emit
- 세션당 1회 · guest/authenticated 태그
- Redirect/Dashboard UI **없음**

---

## 2. 데이터 신호

| event_type | scenario_id | 의미 |
|------------|-------------|------|
| `home.viewed` | `home_landing_v1` | Home Landing 진입 (세션당 1) |
| `interaction.revisit` / `repeated_view` | `results_view` | Results 재방문 (기존) |

**Unlock 기준 (Owner 확정 2026-07-10):**  
- 기간 **N ≥ 14** calendar days (`span_calendar_days`)  
- **M ≥ 50** `home.viewed`  
- guest **및** authenticated 각 ≥ 1  

판정: `python scripts/report_observe_aggregates.py` → `unlock_ready`.  
충족 전 Redirect/Login Home **논의만 백로그** · 구현 금지.  
모듈: `observe_aggregate.py` · `docs/remaining-work-phases.md` Phase B.

---

## 3. 검증

| # | 단계 | 결과 |
|---|------|------|
| 1 | LOCK 게이트 — 제품 착수 거부 | ✅ |
| 2 | `home.viewed` 스키마 수용 | ✅ backend test |
| 3 | HomeLandingObserve 세션 1회 emit | ✅ Vitest |
| 4 | Home Landing IA 유지 (Dashboard 없음) | ✅ phase4 gate + Observe 컴포넌트만 |
| 5 | Vitest + pytest 회귀 | ✅ Vitest 81 · pytest unified 10 |

---

## 4. Status

| 항목 | 상태 |
|------|------|
| Phase 5 **데이터 전제 배선** | ✅ 완료 |
| Phase 5 **제품 revisit (Redirect/Dashboard)** | 🔒 LOCKED — 데이터 표본 후 |

---

*2026-07-10*
