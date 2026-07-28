# Sprint4_IMPLEMENTATION_PLAN.md

**기준:** `docs/PROJECT_BACKLOG.md` · Sprint 4 — Share + Polish + Gate Review  
**작성:** 2026-07-28  
**제외:** Done Task (Sprint 1–3) · Sprint 5+ · Out of scope · layout-diagram LOCK  
**원칙:** 이전 Sprint 코드 최소 변경 · Task 단일 구현 · 검증 후 다음

---

# Sprint Goal

바이럴 **최소 공유** + 정식 **a11y 바닥** + 1280 fold 신뢰 + Gate 리뷰용 체크리스트.

---

# Included Tasks (Done 제외)

| ID | 목적 | Priority | Est | Sprint 필수 |
|----|------|----------|-----|-------------|
| SHR-01 | 결과 공유 1액션 (링크 복사 + OG 랜딩) | P1 | 5d | ✅ |
| A11Y-01 | Catalog 상세·모바일 메뉴 dialog | P2 | 2d | ✅ |
| A11Y-02 | 푸터·인라인 터치 ≥24px | P2 | 1d | ✅ |
| A11Y-03 | Auth/MyPage visible label | P2 | 1d | ✅ |
| A11Y-04 | Survey progressbar a11y | P2 | 0.5d | ✅ |
| HOME-03 | 1280×720 CTA+게스트 안내 fold | P2 | 1d | ✅ |

**완료 조건**  
① 결과 공유 1액션 E2E ② Modal/터치/라벨/progress 충족 ③ Gate 리뷰 체크리스트 문서화

**Gate 리뷰 (코드 외):** D7 재오픈·저장률·아웃바운드 추세는 `docs/weekly-north-star-report.md` + funnel CLI로 점검 — Sprint4_COMPLETION에 Go/No-Go 메모.

---

# Dependency Graph

```
A11Y-04 → A11Y-03 → A11Y-02 → HOME-03
                              │
A11Y-01 (shared modal) ───────┤
                              ▼
                         SHR-01 (copy + public OG landing + share event)
```

---

# 개발 순서 (안전 재배치)

| # | Task | 이유 |
|---|------|------|
| 1 | A11Y-04 | 잔여만; 거의 Done |
| 2 | A11Y-03 | 라벨만 |
| 3 | A11Y-02 | CSS hit area |
| 4 | HOME-03 | 히어로 spacing |
| 5 | A11Y-01 | Modal 프리미티브 → catalog + mobile menu |
| 6 | SHR-01 | 주력 L: 비PII 랜딩 + 복사 + 이벤트 |

각 Task 후: **Lint → Typecheck → 관련 Unit Test → 통과 시 다음**.

---

# Task 상세

### A11Y-04
- Segmented progress 확인; submitting indeterminate bar에 aria 보완

### A11Y-03
- Auth emailCode + MyPage account 주요 입력에 visible Label

### A11Y-02
- Footer / shop inline / retake 등 `min-h-6` 이상 (권장 `min-h-11`)

### HOME-03
- Hero py/타입/간격 축소; 게스트 안내를 CTA 직근 배치

### A11Y-01
- `useDialog`/`Modal`: Esc, focus trap, scroll lock, aria-modal  
- Catalog detail + site-header mobile menu

### SHR-01
- MVP: 비PII 취향 요약 쿼리 → `/share` 공개 랜딩 (`publicPageMetadata` + OG)  
- Results: 「링크 복사」1액션; `/results` noindex 유지  
- `interaction.share_attempt` 이벤트  
- 이미지 카드 생성은 스코프 밖

---

# Risk

| Risk | 완화 |
|------|------|
| 공유 URL에 PII | 태그/성향 문구만; email/user id 금지 |
| Modal이 기존 overlay 깨짐 | catalog/mobile만 교체 |
| HOME-03이 브랜드 훼손 | spacing만; 카피 삭제 금지 |

---

# 검증

| Task | 검증 |
|------|------|
| A11Y-* / HOME | 관련 vitest + lint/tsc |
| SHR-01 | share page unit + copy button test + event schema |
| Sprint | Sprint4 변경분만 regression |
