# Product Next — Phase 4 Launch · Data 검증 리포트

> **날짜:** 2026-07-10  
> **유형:** 0~소수 문서 PR · DoD 확인 · Observe 이벤트 재목록화  
> **마스터:** `docs/product-next-phases.md` Phase 4  
> **관련:** `docs/results-ux-phase7-validation-report.md` · `docs/evidence-tab-phase4-validation.md`

---

## 1. DoD — Results / Evidence / MyPage

| 영역 | DoD | 상태 | 근거 |
|------|-----|------|------|
| **Results** | 추천 이해 · 탭 없이 저장 · 모바일 | ✅ | `results-ux-roadmap` Phase 0–7 · product-next Phase 1 audit |
| **Evidence** | 신뢰 레이어 · pick 설득 · ranking-why(switch) | ✅ | Evidence Phase 0–4 · product-next Phase 2 (concrete UI 재연결) |
| **MyPage** | 개요·저장·계정 · Continue 본진 | ✅ | product-next Phase 3 · Vitest smoke · E2E hub |
| **Home** | Landing only · Workspace/Dashboard 없음 | ✅ | `page.tsx` = Hero + FeatureGrid · `WorkshopStrip` 파일 없음 |

**Out of Scope (준수):** Login redirect 실험 · Home A/B · Dashboard · Compare 복원

---

## 2. Observe — 활성 이벤트 (2026-07-10 코드 기준)

> Compare Drawer 제거 이후 `drawer_open` / `comparison` UI emit은 **비활성**. 백엔드 스키마에 타입이 남아 있어도 프론트 Results UI는 발행하지 않음.

| event_type | 경로 | 용도 | Phase 4 관찰 |
|------------|------|------|----------------|
| `interaction.bookmark` | `emitExplorationEvent` · 저장 CTA | 저장 전환 | ✅ Primary |
| `interaction.results_tab_click` | `emitResultsUxEventBestEffort` · 탭 전환 | Evidence 체류 proxy | ✅ Primary |
| `interaction.click` | Results view mount | 결과 진입 | ✅ |
| `interaction.revisit` / `repeated_view` | session visit count | 재방문 | ✅ Home revisit 전제 데이터 |
| `interaction.refinement` | confidence refinement | 신뢰 정교화 | ✅ |
| `kpi.time_to_first_result` | 설문 → 결과 | 퍼널 | ✅ |
| `onboarding.*` | SurveyWizard | 온보딩 퍼널 | ✅ |
| ~~`interaction.drawer_open`~~ | — | Compare 제거 | ❌ UI 미사용 |
| ~~`interaction.comparison`~~ | — | Compare 제거 | ❌ UI 미사용 |

**전송:** `POST /api/v1/recommendations/events` · best-effort (UI 비차단)

**한계:** 프로덕션 집계 대시보드·전환율 리포트는 analytics 스택 부재로 **미구축**. Phase 4는 **이벤트 배선·DoD·퍼널 E2E**까지. 수치 집계는 인프라 후속.

---

## 3. Dev Gate

| # | 게이트 | 결과 |
|---|--------|------|
| 1 | 설문 → 결과 → 저장 플로우 | ✅ 자동화: `critical-flows` (survey→results, save CTA, 375px) |
| 2 | Home에 Workspace/Dashboard 없음 | ✅ `frontend/src/app/page.tsx` · WorkshopStrip 파일 0 |
| 3 | Results/Evidence/MyPage DoD | ✅ §1 |
| 4 | Observe 이벤트 목록 최신화 | ✅ §2 (Compare 이벤트 폐기 명시) |

---

## 4. 자동 검증 (본 세션)

| 단계 | 결과 |
|------|------|
| Home Landing 정적 검사 (WorkshopStrip/Dashboard) | ✅ |
| Vitest features (Results+Evidence+MyPage) | ✅ 80 passed (2026-07-10) |
| Observe 이벤트 단위 테스트 | ✅ `phase4-observe-events` + Home Landing gate |
| E2E critical-flows | 스펙 유지 · 로컬 스택 있을 때 재실행 권장 |

---

## 5. Iteration — Phase 4 이후 Top 3 (갱신)

| 순위 | 항목 | 비고 |
|------|------|------|
| **1** | **재방문 / Home 진입 데이터 수집** | Phase 5 착수 AND 조건 · `revisit`/`repeated_view` + 서버 집계 |
| **2** | **bookmark → 저장 전환율 집계** | debug 이벤트 존재 · 대시보드/쿼리만 후속 |
| **3** | **375px visual regression (선택)** | functional E2E OK · 스크린샷 회귀는 Nice-to-have |

~~activity → accordion~~ — **완료** (activity 탭 제거, Continue=`/mypage?section=saved`)  
~~drawer_open 분석~~ — **폐기** (Compare 미복원)

---

## 6. Phase 5 게이트와의 관계

Phase 4 완료 = Results/Evidence/MyPage DoD + Home Landing 유지 + Observe 목록 정리.

Phase 5 (Home revisit)는 여전히:

- [x] Results / Evidence / MyPage
- [ ] **실제 재방문 / Home 진입 데이터** ← 유일한 잔여 AND 조건

---

*Phase 4 Launch 체크 완료 — 2026-07-10*
