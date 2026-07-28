# Sprint3_IMPLEMENTATION_PLAN.md

**기준:** `docs/PROJECT_BACKLOG.md` · Sprint 3 — Trust, Contact, Catalog, Measure  
**작성:** 2026-07-28  
**제외:** Done Task (Sprint 1–2) · Sprint 4+ · Out of scope · SUR-03/RES-03(S2 Skip 잔여, Sprint3 표에 없음)  
**원칙:** Sprint 1–2 코드 최소 변경 · Task 단일 구현 · 검증 후 다음

---

# Sprint Goal

결과 **결정 도우미**(Trust 3단 + next-action 1개) + **문의 인앱** + **카탈로그 CLS** + **아웃바운드·퍼널 숫자**.

---

# Included Tasks (Done 제외)

| ID | 목적 | Priority | Est | Sprint 필수 |
|----|------|----------|-----|-------------|
| RES-02 | Trust 3단: 결론+태그+짧은 왜 / 원시점수 접힘 | P1 | 2d | ✅ |
| RES-04 | 「다음에 할 일」 primary next-action 1개 (샵 보기 MVP) | P1 | 2d | ✅ |
| CTR-01 | Contact 최소 웹폼 + 접수 피드백 | P1 | 2d | ✅ |
| CTR-02 | SLA 카피 + mailto subject/body | P2 | 0.5d | ✅ |
| CAT-01 | 카탈로그 이미지 예약공간·CLS↓ | P1 | 2d | ✅ |
| BIZ-01 | 결과·카탈로그→샵 클릭 계측 | P1 | 2d | ✅ |
| KPI-01 | 퍼널 3단 + 북스타 주간 리포트 초안 (reopen Done 유지) | P1 | 잔여 | ✅ |

**완료 조건 (백로그)**  
① Trust 3단 + 점수 기본 접힘 ② Next-action 1개 ③ 문의 웹폼 제출→수신 검증 ④ Catalog lab CLS 유의미 개선 ⑤ 아웃바운드 클릭 주간 집계 가능 ⑥ 북스타 주간 리포트 초안

---

# Dependency Graph

```
RES-02 (trust compress)
   │
   ▼
RES-04 (single next-action = shop) ──► BIZ-01 (outbound emit on shop)
                                              │
CTR-01 (web form) ──► CTR-02 (SLA/mailto)     │
CAT-01 (CLS) ─────────────────────────────────┤
KPI-01 (funnel report + north-star draft) ◄───┘
```

---

# 개발 순서

| # | Task | 층 | 선행 | 예상 파일 |
|---|------|-----|------|-----------|
| 1 | RES-02 | Results trust UI | — | `shared-result-header.tsx`, `results-confidence-story*`, `results-trust-layer.tsx` |
| 2 | RES-04 | Next-actions | RES-02 권장 | `results-next-actions.tsx` (+ test). Save/RET 카피 유지 |
| 3 | CTR-01 | Contact API+form | — | backend `contact` router + `contact/page.tsx` |
| 4 | CTR-02 | Copy | CTR-01 | `contact/page.tsx` |
| 5 | CAT-01 | Catalog media | — | `catalog-part-thumbnail.tsx` (+ browse/detail wrappers). **layout-diagram* 금지** |
| 6 | BIZ-01 | Events | RES-04 | `swagkey-product-link.tsx` / next-actions / catalog links + funnel |
| 7 | KPI-01 | Report | — | `funnel_analytics` / `docs/` weekly draft; reopen emit 유지 |

각 Task 후: **Lint → Typecheck → 관련 Unit/API Test → 통과 시 다음**.

---

# Task 상세

### RES-02
- **목적:** 첫 화면에서 결론+태그+1짧은 왜; raw `0.xx` 기본 비노출/접힘; 점수≠구매만족 고지 유지  
- **접근:** header에 `deriveConfidenceStory.support` 한 줄 노출; trust layer에서 중복 why 축소; 원시점수 UI 접힘  
- **Risk:** RES-01 CTA 순서 변경 금지

### RES-04
- **MVP 선택:** 「이 조합 샵에서 보기」(기존 shop link) — 체크리스트/예산메모는 미구현(백로그 3옵션 중 1개)  
- **접근:** Save와 역할 구분 유지; shop을 유일한 next-action secondary; 「설문 다시 하기」는 ghost/text로 격하 또는 카드 밖  
- **Risk:** `e2e-save-build` / RET-02/03 testid·카피 유지

### CTR-01
- **목적:** mailto-only 탈피. 필수 필드 검증 + 성공/실패 UI + ops 메일 도달  
- **접근:** Resend/`_deliver_email` 재사용 POST API + 프론트 폼  
- **Risk:** auth email 모듈만 공유; 새 라우트 격리

### CTR-02
- Contact 본문 SLA(영업일 2일) + mailto subject/body 프리필

### CAT-01
- 썸네일 width/height 또는 고정 ratio 예약; lab CLS 목표 &lt;0.1 방향; LCP 회귀 가드  
- **LOCK:** `layout-diagram*` / `public/layout-diagrams/*` 미터치

### BIZ-01
- 외부 링크 클릭 1회 이벤트; `surface` results|catalog + domain 축  
- 기존 unified events 파이프 확장(메타데이터 또는 전용 타입)

### KPI-01
- 퍼널 3단 명시(설문시작→결과→저장) + 북스타(재오픈) 주간 1페이지 초안  
- Sprint1 `interaction.revisit` 계약 유지

---

# Risk

| Risk | 완화 |
|------|------|
| RES-04가 저장 CTA와 경쟁 | Save primary 유지, shop만 next-action |
| Contact 메일 env 미설정 | 실패 UI + 스테이징 검증 문서화 |
| BIZ-01이 mount `interaction.click`과 혼동 | outbound 전용 metadata/kind |
| CAT-01이 LCP 악화 | sizes/priority 유지, CLS만 보강 |

---

# Rollback

Task 단위 revert. Contact API는 라우트 unregister로 비활성.

---

# 검증 방법

| Task | 검증 |
|------|------|
| RES-02 | vitest trust/header/confidence |
| RES-04 | `results-next-actions.test.tsx` |
| CTR-01 | backend pytest + form unit/smoke |
| CTR-02 | contact page copy assert |
| CAT-01 | thumbnail unit + manual/lab note |
| BIZ-01 | emit unit + funnel allowlist |
| KPI-01 | funnel CLI / docs draft |
| Sprint | frontend lint/tsc + 관련 tests only |
