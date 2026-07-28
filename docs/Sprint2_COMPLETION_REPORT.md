# Sprint2_COMPLETION_REPORT.md

**Sprint:** 2 — Continuity + Save Conversion  
**기준:** `docs/PROJECT_BACKLOG.md`  
**계획:** `docs/Sprint2_IMPLEMENTATION_PLAN.md`  
**완료일:** 2026-07-28

---

# Sprint Goal

설문 **투자 존중**(refresh/back) + 결과 **저장 전환**(요약 직후 CTA) + 게스트/계정 **저장 약속 정직화**.

**결과:** Goal 달성 (필수 완료 조건 전부 체크). SUR-03 / RES-03은 여유로 Skip.

---

# 완료된 Task

| ID | 결과 | 비고 |
|----|------|------|
| SUR-01 | Done | `kr_survey_wizard_draft_v1` mid-wizard persist + hydrate |
| SUR-02 | Done | submit 후에도 draft 유지 → back 시 직전 단계 복귀 (entry 리셋 아님). 규칙 문서화 |
| RES-01 | Done | backend 결과: `ResultsNextActions`를 header 직후·parts 앞으로 이동 |
| RET-02 | Done | 게스트: 임시 저장 + 로그인 CTA / MyPage「방금 연 결과」오해 제거 |
| RET-03 | Done | 계정: `role=status` + 「마이페이지에서 다시 보기」→ `/mypage?section=saved` |
| SUR-03 | Skip | Sprint 필수 외 |
| RES-03 | Skip | Sprint 필수 외 |

---

# 변경 파일

### Frontend
- `frontend/src/lib/survey-wizard-draft.ts` *(new)*
- `frontend/src/lib/survey-wizard-draft.test.ts` *(new)*
- `frontend/src/components/features/recommendation/survey-wizard.tsx`
- `frontend/src/components/features/recommendation/survey-wizard.draft-restore.test.tsx` *(new)*
- `frontend/src/components/features/recommendation/survey-wizard.preset-skip.test.tsx` *(beforeEach clear)*
- `frontend/src/components/features/recommendation/survey-wizard.pass2.test.tsx` *(beforeEach clear)*
- `frontend/src/components/features/recommendation/survey-wizard.quick-removal.test.tsx` *(beforeEach clear)*
- `frontend/src/components/features/recommendation/recommendation-result-view.tsx` *(CTA 배치만)*
- `frontend/src/components/features/recommendation/recommendation-result-view.smoke.test.tsx`
- `frontend/src/components/features/recommendation/results/results-next-actions.tsx`
- `frontend/src/components/features/recommendation/results/results-next-actions.test.tsx`
- `frontend/src/components/features/recommendation/results/results-overview-tab.tsx` *(게스트 MyPage 링크 분기)*

### Docs
- `docs/Sprint2_IMPLEMENTATION_PLAN.md`
- `docs/Sprint2_COMPLETION_REPORT.md` *(본 문서)*
- `docs/PROJECT_BACKLOG.md` *(Status / Sprint2 체크리스트)*

**Sprint 1 로직(저장 snapshot / revisit):** 의도적으로 미수정. RES-01은 JSX 순서만 변경.

---

# 테스트 결과 (Sprint 2 변경분만)

| 검증 | 결과 |
|------|------|
| Vitest (Sprint 2 관련 7 files) | **16 passed** |
| Frontend lint | **pass** |
| Frontend typecheck | **pass** |

전체 사이트 QA / 전체 e2e는 수행하지 않음 (지시: Sprint 2 regression only).

---

# 해결한 문제

1. 설문 중 refresh 시 진행 소실 (SUR-01)  
2. 결과→뒤로가기 시 설문 시작으로 리셋 (SUR-02) — **submit 시 draft 클리어 제거**가 핵심  
3. 모바일에서 저장 CTA가 parts 아래 깊은 스크롤에 있던 문제 (RES-01)  
4. 게스트 저장 후 MyPage를 “방금 저장분 열기”처럼 보이게 하던 CTA (RET-02)  
5. 계정 저장 성공 시 다음 행동(마이페이지 재오픈) 안내 부족 (RET-03)

---

# 정책 메모 (SUR-01 AC③)

제출 성공 후 draft는 **클리어하지 않음**. `/results` → browser back 복귀점으로 유지.  
클리어는 「처음부터」/reset 시에만. completed submission(`kr_survey_v2`)과 키 분리 유지.

---

# 남은 이슈

- SUR-03 진행률·미리채움 카피  
- RES-03 Help `?` heading 분리  
- Sprint 3: RES-02, RES-04, CTR-01, CAT-01, BIZ-01, KPI-01 잔여  
- 라이브 m390 fold·back 수동 확인은 배포 후 권장

---

# Sprint Review

- SUR-01과 SUR-02는 동일 draft 계약으로 묶여 있고, submit clear를 유지하면 SUR-02 AC가 깨짐 → 정책을 문서화해 정합.  
- RES-01은 저장 핸들러 비터치로 회귀 위험 최소화.  
- RET-02/03는 NextActions + overview 보조 링크까지 맞춰 약속 일관성 확보.

---

# Sprint Retrospective

| Keep | Improve |
|------|---------|
| Task 단위 lint/tsc/관련 vitest | wizard 테스트 beforeEach draft clear를 공통 setup으로 |
| S1 save 로직 비터치 | SUR submit↔draft 정책을 계획에 선명시 |
| 게스트/계정 CTA 분기 testid | overview-tab 보조 링크를 계획에 명시 |

---

# Commit Message (생성 · 미커밋)

```
feat(continuity): persist survey draft and honest save CTAs

Restore mid-wizard on refresh/back, move results save CTA above parts,
and split guest login vs account MyPage reopen copy.
```

커밋/푸시는 요청 시에만 수행 (git-sync 정책).

---

# 남은 Sprint 추천

| 다음 | 목표 | 핵심 Task |
|------|------|-----------|
| **Sprint 3** | Trust, Contact, Catalog, Measure | RES-02, RES-04, CTR-01, CAT-01, BIZ-01, KPI-01 잔여 |
| **Sprint 4** | Share + Polish + Gate | SHR-01, A11Y-*, HOME-03 |

다음 실행은 **Sprint 3**부터, `PROJECT_BACKLOG.md`만 기준으로.
