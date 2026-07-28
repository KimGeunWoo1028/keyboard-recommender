# Sprint2_IMPLEMENTATION_PLAN.md

**기준:** `docs/PROJECT_BACKLOG.md` · Sprint 2 — Continuity + Save Conversion  
**작성:** 2026-07-28  
**제외:** Done Task (AUTH/SEO/HOME/RET-01 등) · Sprint 3+ · Out of scope  
**원칙:** Sprint 1 코드 최소 변경 · Task 단일 구현 · 검증 후 다음

---

# Sprint Goal

설문 **투자 존중**(refresh/back) + 결과 **저장 전환**(모바일 CTA) + 게스트/계정 **저장 약속 정직화**.

---

# Included Tasks (Done 제외)

| ID | 목적 | Priority | Est | Sprint 필수 |
|----|------|----------|-----|-------------|
| SUR-01 | 설문 mid-wizard refresh 영속화 | P1 | 2d | ✅ |
| SUR-02 | 결과→back 시 설문 단계 복귀 | P1 | 2d | ✅ |
| RES-01 | 요약 직후 저장 CTA (m390 fold) | P1 | 2d | ✅ |
| RET-02 | 게스트 vs 계정 저장 약속 분리 | P1 | 2d | ✅ |
| RET-03 | 계정 저장 status + MyPage 링크 | P2 | 1d | ✅ |
| SUR-03 | 진행률·미리채움 카피 | P2 | 1d | 여유 시 |
| RES-03 | Help `?` heading 분리 | P2 | 0.5d | 여유 시 |

**완료 조건 (백로그)**  
① 설문 중 refresh 복원 ② 결과 back ≠ 시작 리셋 ③ m390 요약 직후 저장 CTA ④ 게스트/계정 저장 카피·플로우 분리

---

# Dependency Graph

```
SUR-01 (draft persist)
   │
   ▼
SUR-02 (back restore — largely via SUR-01 draft on remount)
   │
   ▼
RES-01 (move save CTA) ──► RET-02 (guest/account copy) ──► RET-03 (account status link)
                                                              │
SUR-03 / RES-03 (optional, no hard deps) ◄────────────────────┘
```

---

# 개발 순서 (안전 재배치)

| # | Task | 층 | 선행 | 후속 | 예상 파일 |
|---|------|-----|------|------|-----------|
| 1 | SUR-01 | Storage + Wizard state | — | SUR-02 | `survey-storage.ts`(또는 draft helper), `survey-wizard.tsx`, tests |
| 2 | SUR-02 | History/remount contract | SUR-01 | — | `survey-wizard.tsx` (+ 문서화 주석/테스트). Sprint1 파일 불필요 |
| 3 | RES-01 | Results layout | — | RET-02 | `recommendation-result-view.tsx` (배치만; S1 save 로직 최소 터치) |
| 4 | RET-02 | Copy/CTA | RES-01 권장 | RET-03 | `results-next-actions.tsx` (+ test) |
| 5 | RET-03 | Status/link | RET-02 | — | `results-next-actions.tsx` |
| 6 | SUR-03 | Copy | — | — | `survey-wizard.tsx` / progress (여유) |
| 7 | RES-03 | a11y structure | — | — | shared-result-header / HelpHint (여유) |

각 Task 후: **Lint → Typecheck → 관련 Unit Test → 통과 시 다음**.

---

# Task 상세

### SUR-01
- **목적:** mid-wizard `phase`/`stepIndex`/`answers`/style seed를 sessionStorage(또는 전용 draft 키)에 저장·복원  
- **영향:** `/recommend` refresh. 완료 submission(`kr_survey_v2`)과 **키 분리** 권장 → S1 결과 복원과 충돌 방지  
- **AC:** refresh 후 동일 단계·선택; 「처음부터」로 draft 클리어; submit 성공 시 draft는 **유지**(SUR-02 back 복귀점) — 「처음부터」에서만 클리어  
- **Risk:** 기존 `loadSurveySubmission`이 entry에서 answers만 채우는 경로와 혼동 — draft vs completed 명확히 분기 

### SUR-02
- **목적:** `/results` → browser back → `/recommend`에서 **entry가 아닌** 직전 질문 단계  
- **접근:** SUR-01 draft가 있으면 questions 위상으로 hydrate (추가 history.pushState는 최소). AC「합의된 복귀점」= 마지막 저장된 stepIndex  
- **Risk:** 성향 entry만 리셋되는 회귀 — draft에 phase=`questions` 필수  

### RES-01
- **목적:** backend 결과 레이아웃에서 `ResultsNextActions`를 `SharedResultHeader` 직후로 이동 (parts 그리드 앞)  
- **이유(기존 변경):** 저장 CTA가 parts 아래에 있어 m390 fold 밖 — 기능 삭제가 아니라 **배치만** 변경  
- **AC:** 요약 직후 1차 CTA; 하단 중복 제거(단일 CTA)  

### RET-02
- **목적:** 게스트 성공 시 `/mypage`를 “방금 연 결과”처럼 보이게 하는 CTA 제거/로그인 목적 명시  
- **AC:** 게스트 문구·링크 ≠ 계정 MyPage 바로가기; 계정은 마이페이지 다시 열기 유지  

### RET-03
- **목적:** 계정 저장 시 role=status 안내 + 「마이페이지에서 다시 보기」  
- **AC:** status 영역; 링크 `/mypage?section=saved` (RET-01)  

### SUR-03 / RES-03
- 여유 시에만. Sprint 필수 완료 조건에 없음 → 시간 없으면 Skip 문서화.

---

# Risk

| Risk | 완화 |
|------|------|
| draft가 completed submission을 덮어씀 | 별도 키 `kr_survey_draft_v1` |
| RES-01이 e2e save 셀렉터 깨짐 | `e2e-save-build` testid 유지, 위치만 변경 |
| RET-02가 게스트 mypage e2e 기대 변경 | save-reliability는 로그인 경로 — 게스트 링크만 분기 |
| S1 `recommendation-result-view` save 로직 회귀 | 핸들러/metadata 로직 미수정, JSX 순서만 |

---

# Rollback

- Task 단위 revert (draft helper / CTA 배치 / next-actions copy).  
- draft 키만 제거하면 SUR-01/02 이전 동작으로 복귀.

---

# 검증 방법

| Task | 검증 |
|------|------|
| SUR-01 | unit: draft save/load/clear; wizard hydrate |
| SUR-02 | unit/integration: draft phase=questions 복원 |
| RES-01 | unit/smoke: NextActions가 header 다음 형제에 존재 (가능하면) |
| RET-02/03 | `results-next-actions.test.tsx` 라벨·링크 분기 |
| Sprint | frontend lint, typecheck, 관련 vitest only (전체 e2e 필수 아님) |
