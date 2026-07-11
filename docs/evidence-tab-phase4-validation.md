# Evidence Tab Simplification — Phase 4 Validation 리포트

> **날짜:** 2026-07-10  
> **유형:** 1 PR · Guardrails · Non-goals · E2E  
> **마스터 로드맵:** `docs/evidence-tab-simplification-roadmap.md` (v1.4)  
> **범위:** Phase 0–3 구현 완료 후 1회 검증

---

## 1. Phase 완료 요약

| Phase | Task | 상태 | 산출물 |
|-------|------|------|--------|
| 0 | 서브모듈 분리 · threshold/trait 파일 | ✅ | `results-evidence-*`, `results-trait-display.ts`, `results-ranking-thresholds.ts` |
| 1 | 공통 신뢰 레이어 · Evidence infra 접힘 | ✅ | `results-trust-layer.tsx`, Confidence Story, 6축 미니, highlights 이동 |
| 2 | Pick 카드 shell · 조건부 tradeoff | ✅ | `results-evidence-pick-card.tsx`, `e2e-pick-ranking-why` shell |
| 3-1 | Why · Tradeoff · Highlights · Story 톤 | ✅ | `formatEvidenceWhyLine`, `formatEvidenceTradeoff`, `formatBuildHighlights` |
| 3-2 | Ranking why (switch MVP) | ✅ | `formatEvidenceRankingWhy` → pick 카드 concrete UI · fallback 숨김 · `NEXT_PUBLIC_EVIDENCE_RANKING_WHY` opt-out |
| 4 | 문서 · E2E · Guardrails 체크 | ✅ | 본 리포트 · `PROJECT_CONTEXT` §4.14 · E2E 확장 |

---

## 2. 자동 검증 (2026-07-10)

| 단계 | 결과 |
|------|------|
| Frontend Vitest | ✅ 78 passed |
| `npm run build` | ✅ |
| E2E `results-evidence-phase4.spec.ts` | ⏳ 스펙 추가 — 로컬 port 3000 충돌로 미실행 (CI·`start-stack` fresh 권장) |
| E2E `recommendation-survey.spec.ts` | ⏳ 동일 |
| E2E `critical-flows.spec.ts` | ⏳ 동일 (회귀) |

**로컬 E2E 실행:** port 3000 비우기 → `cd e2e && npx playwright test results-evidence-phase4.spec.ts recommendation-survey.spec.ts critical-flows.spec.ts --project=chromium`

---

## 3. E2E 커버리지 (Evidence IA)

| `data-testid` / assertion | 검증 내용 |
|---------------------------|-----------|
| `e2e-trust-layer` | Hero 아래 · 탭 위 공통 레이어 |
| `e2e-confidence-story` | Confidence Story 카드 1개 |
| `e2e-trait-mini-profile` | 고정 6축 미니 프로필 |
| `e2e-quality-status` absent | Overview amber 품질 카드 중복 제거 |
| `e2e-pick-explanations` | Evidence pick 섹션 |
| `왜 추천했나요` | pick 카드 always-visible why |
| `e2e-pick-ranking-why` | switch ranking why (MVP) |
| `추천 엔진 v2` absent (trust layer) | raw highlights 필터 |
| `특별히 주의할` absent | tradeoff 억지 생성 금지 |

**스펙 파일:** `e2e/tests/results-evidence-phase4.spec.ts`

---

## 4. UX 원칙 Guardrails (제품 철학)

| # | 기준 | Phase 4 판정 |
|---|------|--------------|
| 1 | 30초 이해 실패 시 카피 우선 | ✅ why 1줄 · ranking fallback 정직 |
| 2 | 공통 레이어 = 신뢰만 (CTA 예외: 정교화 링크) | ✅ 저장·구매 CTA 없음 |
| 3 | Evidence = 설득, audit는 `<details>` | ✅ MetricGuide·18축·whyTraits 접힘 |
| 4 | Overview 짧게 · Evidence 설득 | ✅ Overview highlights 중복 제거 |
| 5 | 정직한 불확실성 | ✅ gap < 0.04 → fallback only |
| 6 | Failure Signals로 회고 | 📋 출시 후 4–6주 관측 (로드맵 §Success Metrics) |

---

## 5. 구현 가드레일 (Cursor·PR)

| # | 기준 | Phase 4 판정 | 근거 |
|---|------|--------------|------|
| 1 | 공통 레이어 블록 ≤3 | ✅ | Story · 6축 미니 · highlights(≤2) |
| 2 | Confidence Story 카드 1개 | ✅ | `e2e-confidence-story` 단일 |
| 3 | Story ≤4 · highlights ≤2 · ranking ≤2 | ✅ | unit tests + slice |
| 4 | tradeoff 억지 생성 금지 | ✅ | `formatEvidenceTradeoff` null · E2E |
| 5 | gap 미달 시 구체 ranking bullet 금지 | ✅ | `switchTinyGap` fixture |
| 6 | 18축 표 기본 접힘 · pick 일치도 반복 금지 | ✅ | Evidence profile `<details>` |
| 7 | raw highlights/tradeOff/엔진 문자열 금지 | ✅ | `formatBuildHighlights` 필터 |
| 8 | Confidence·6축을 Evidence로 회귀 금지 | ✅ | trust layer only |
| 9 | 고정 6축 → 동적 N축 회귀 금지 | ✅ | `results-trait-display.ts` LOCKED |

### PR 리뷰 빠른 체크

| # | 질문 | 결과 |
|---|------|------|
| 1 | 모바일 첫 화면 — 탭 라벨 보이는가? | ✅ E2E 375px |
| 2 | gap 0.02 fixture — fallback인가? | ✅ `RANKING_WHY_FIXTURES.switchTinyGap` |
| 3 | tradeoff 없는 pick — 주의 섹션 없는가? | ✅ pick-card unit test |
| 4 | Story tier — gap 작은데 «차이 분명» 아닌가? | ✅ high+small gap → 보통 tier |

---

## 6. Non-goals 준수

| 항목 | Phase 4 판정 |
|------|--------------|
| 추천 알고리즘·scoring 변경 | ✅ 없음 |
| Match Score / confidence 계산식 변경 | ✅ 없음 |
| 6축·18축 trait 모델 변경 | ✅ 없음 |
| `explainable.py` 대개편 | ✅ 없음 |
| 카탈로그·Swagkey 연동 변경 | ✅ 없음 |
| 설문 플로우 변경 | ✅ 없음 |
| `recommendation-result-view` 전면 리라이트 | ✅ 없음 (점진 IA) |
| Compare UI 복원 | ✅ 없음 |
| 공통 레이어 저장·구매 CTA | ✅ 없음 |

---

## 7. 롤백·플래그

| 항목 | 방법 |
|------|------|
| Ranking why | `NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0` (기본 ON) |
| 전체 Evidence IA | Git revert Phase 0–3 PRs (로드맵 §Rollback 후보: Task 3-2) |

---

## 8. Post-launch 관측 (Out of Scope — Phase 4)

로드맵 §Success Metrics · §Failure Signals 참고. **4–6주** 후:

- 저장률 · 스웨그키 클릭률 · Overview-only 저장
- Evidence 방문 후 저장률 · ranking why 후 대안-only 클릭
- 정성: «30초 이해» 4/5 · «믿을 만한가» 4/5

---

## 9. 관련 파일

| 파일 | 역할 |
|------|------|
| `docs/evidence-tab-simplification-roadmap.md` | 마스터 IA v1.4 |
| `docs/PROJECT_CONTEXT.md` §4.14 | Agent 컨텍스트 |
| `results-trust-layer.tsx` | 공통 신뢰 레이어 |
| `results-evidence-pick-card.tsx` | pick 설득 |
| `results-evidence-ranking-why-content.ts` | ranking why 로직 |
| `results-text-utils.ts` | why/tradeoff 카피 |
| `e2e/tests/results-evidence-phase4.spec.ts` | Phase 4 E2E |

---

*Phase 4 완료 — 다음: 프로덕션 배포 후 Failure Signals 관측 (별도 이터레이션).*
