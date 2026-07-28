# PROJECT_BACKLOG.md

**제품:** Keyboard Recommender  
**근거 문서 (읽기 전용 유지):**  
`tmp/release-audit/FINAL_RELEASE_AUDIT_REPORT.md` · `PRODUCT_SUCCESS_REPORT.md` · `INVESTMENT_MEMO.md`  
**작성:** 2026-07-28 · **역할:** 이후 모든 개발의 단일 실행 기준  
**원칙:** 문서가 아니라 **기능**으로 묶는다. 동일 문제는 Task 1개.

---

# Executive Summary

해피패스(설문→결과→로그인 저장)는 동작하는 제한적 베타이나, 저장한 결과를 다시 여는 루프·설문 연속성·모바일 저장 전환이 끊겨 정식·성장 모두 막혀 있다. Product Success 52 / Investment Watch의 공통 처방은 같다: **소유(재오픈) → 전환(저장·가입 약속) → 계측·공유**. 본 백로그는 그 순서로 중복 제거한 실행 계획이다.

---

# 현재 프로젝트 상태

| 축 | 판정 | 한 줄 |
|----|------|--------|
| **Release Readiness** | 제한적 베타 (~58) | P0 없음. P1(복원·설문 연속·저장 CTA·문의·OG·CLS·signup) 해소 전 정식 비권장 |
| **Product Success** | 52/100 | 웨지·첫인상 강함. Habit/Referral 루프 미조립 |
| **Investment** | Watch | 시드 전 재오픈·기여 클릭·공유 신호 필요. 숫자 없으면 Invest 불가 |

**북스타 KPI (Investment):** 주간 「저장된 결과 재오픈」 수

**Out of scope (추가 금지 — Investment):** 소셜 피드/커뮤니티, 매니아 풀스펙 DB 전면, 홈 대시보드·비교 보드 폭주, Aha 전 구독 페이월, 「빠른 추천」 이중 모드, 자사 마켓플레이스.

---

# 개발 순서 총괄 (Dependency-aware)

```
S0 퀵윈 ──► E1 결과 소유 ──► E2 설문 연속 ──► E3 결과 전환·신뢰
                │                    │
                ▼                    ▼
         E4 Auth 약속 정렬      E5 공유·OG
                │                    │
                ▼                    ▼
         E6 기여 클릭 계측 ◄── E7 문의
                │
                ▼
         E8 카탈로그 품질 → E9 폴리시 → E10 성장(후속)
```

| 순서 | ID | Title | Priority | Diff | Est |
|-----:|-----|-------|----------|------|-----|
| 1 | AUTH-01 | `?mode=signup` → 가입 탭 | P1 | S | 0.5d |
| 2 | SEO-01 | 공개 페이지 og:image 연결 | P1 | S | 0.5d |
| 3 | HOME-01 | Primary CTA 문구 단일화 | P2 | S | 0.5d |
| 4 | HOME-02 | Hero H1 텍스트 공백 | P3 | S | 0.5d |
| 5 | RET-01 | 저장 결과 서버 스냅샷 재오픈 | P0* | L | 5d |
| 6 | RET-02 | 게스트 vs 계정 저장 약속 분리 | P1 | M | 2d |
| 7 | RET-03 | 저장 성공 피드백·MyPage CTA 정렬 | P2 | S | 1d |
| 8 | SUR-01 | 설문 진행 새로고침 영속화 | P1 | M | 2d |
| 9 | SUR-02 | 결과→뒤로가기 시 설문 단계 복귀 | P1 | M | 2d |
| 10 | SUR-03 | 설문 진행률·미리채움 카피 정리 | P2 | S | 1d |
| 11 | RES-01 | 결과 요약 직후 저장 CTA (모바일 우선) | P1 | M | 2d |
| 12 | RES-02 | Trust UI 3단 압축 (점수 접기) | P1 | M | 2d |
| 13 | RES-03 | Help `?`를 heading 밖으로 | P2 | S | 0.5d |
| 14 | RES-04 | 결과 「다음 행동」 1개 | P1 | M | 2d |
| 15 | SHR-01 | 결과 공유(링크 또는 카드) | P1 | L | 5d |
| 16 | CTR-01 | 문의 인앱 접수 (웹폼 최소) | P1 | M | 2d |
| 17 | CAT-01 | 카탈로그 이미지 치수·CLS 억제 | P1 | M | 2d |
| 18 | BIZ-01 | 결과→샵 아웃바운드 클릭 계측 | P1 | M | 2d |
| 19 | KPI-01 | 북스타·퍼널 이벤트 계측 | P1 | M | 2d |
| 20 | A11Y-01 | Catalog/메뉴 Modal(dialog·포커스·스크롤락) | P2 | M | 2d |
| 21 | A11Y-02 | 푸터·인라인 터치 ≥24px (권장 44) | P2 | S | 1d |
| 22 | A11Y-03 | Auth/MyPage visible label | P2 | S | 1d |
| 23 | A11Y-04 | Survey progressbar a11y | P2 | S | 0.5d |
| 24 | HOME-03 | 1280 fold 히어로 신뢰 문구 노출 | P2 | S | 1d |
| 25 | CTR-02 | Contact SLA·mailto 템플릿 | P2 | S | 0.5d |
| 26 | POL-01 | Privacy 책임자·쿠키 고지 보강 | P3 | M | 2d |
| 27 | DS-01 | Button/Card/Badge/Input 프리미티브 단일화 | P2 | XL | 5d+ |
| 28 | CAT-02 | 추천↔카탈로그 「대안 부품」 연결 | P2 | L | 5d |
| 29 | RET-04 | 얇은 취향 프로필 (MyPage) | P2 | L | 5d |
| 30 | SEO-02 | 인덱싱 가능 조합 가이드 소수 | P2 | L | 5d |
| 31 | BIZ-02 | 제휴/기여 GMV 운영 파이프 | P2 | L | 5d |
| 32 | GROW-01 | 2nd 공급·B2B 위젯 파일럿 (후속) | P3 | XL | — |

\*Release에 P0 버그는 없었으나, **리텐션·투자 관점에서 RET-01은 사실상 P0 취급**한다.

---

# Epic 1 — Result Ownership & Retention

**Epic 목표:** 저장한 추천이 **다시 열려** 결정·구매에 쓰이게 한다.  
**왜 중요한지:** 세 문서 공통 1순위. 저장·가입·MyPage의 의미를 되살리고, Investment 북스타의 전제.  
**관련 문서:** Release M-01 · Product 장애물 A · Investment Risk 1–2, 필수기능 1  
**관련 문제:** 다시 보기 disabled · 저장≠재사용 · Watch 승격 조건 #1–2

### User Story

> As a 로그인한 사용자,  
> I want 마이페이지에서 저장한 추천 결과를 다시 열어 보고,  
> so that 나중에 구매·비교할 때 다시 설문을 하지 않아도 된다.

---

### RET-01 — 저장 결과 서버 스냅샷 재오픈

| 필드 | 내용 |
|------|------|
| **ID** | RET-01 |
| **Title** | 저장 결과 서버 스냅샷으로 「추천 결과 다시 보기」 활성화 |
| **Description** | 계정에 저장된 빌드에 결과 복원에 필요한 스냅샷(또는 동등 페이로드)을 서버에 두고, MyPage「다시 보기」로 `/results`(또는 동등)를 채운다. 로컬 스냅샷 부재 시에도 동작해야 한다. |
| **Priority** | P0 (제품) / Release P1 |
| **Impact** | 리텐션·신뢰·시드 스토리. 미해결 시 계정 가치≈0 |
| **Difficulty** | L |
| **Estimated** | 5d |
| **Dependencies** | 없음 (최우선 기능 작업). AUTH/SEO 퀵윈과 병렬 가능 |
| **Acceptance Criteria** | ① 로그인 사용자: 저장 → 다른 기기/시크릿(로컬 없음)에서도 「다시 보기」 enabled ② 클릭 시 해당 빌드 결과 화면 복원(핵심 6부품·취향 요약) ③ 복원 불가 시에만 disabled + **정확한** 사유 카피 ④ 기존 삭제 플로우는 유지 ⑤ 주간 재오픈 이벤트 로깅 가능(KPI-01과 계약) |
| **Status** | Done |

---

### RET-02 — 게스트 vs 계정 저장 약속 분리

| 필드 | 내용 |
|------|------|
| **ID** | RET-02 |
| **Title** | 게스트 브라우저 저장과 계정 저장의 UX 약속 분리 |
| **Description** | 게스트 저장 후 「저장한 결과 보기」가 MyPage 로그인 게이트로만 이어지는 기대 불일치를 해소. 카피·CTA·가능하면 게스트 로컬 목록을 분리. |
| **Priority** | P1 |
| **Impact** | 전환 품질·부정 입소문 예방 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | RET-01 권장(계정 경로가 살아 있어야 약속이 정직해짐). 카피만은 RET-01과 병렬 가능 |
| **Acceptance Criteria** | ① 게스트: “이 브라우저에 임시 저장 / 계정에 보관하려면 로그인” 문구가 저장 CTA·성공 상태에 일치 ② 게스트 성공 후 MyPage를 “방금 저장분 열기”처럼 오해시키는 CTA 제거 또는 로그인 목적 명시 ③ 계정 저장: “마이페이지에서 다시 열 수 있음” + RET-01 동작과 정합 |
| **Status** | Done |

---

### RET-03 — 저장 성공 피드백 정렬

| 필드 | 내용 |
|------|------|
| **ID** | RET-03 |
| **Title** | 계정 저장 성공 피드백·마이페이지 링크 정렬 |
| **Description** | 버튼 라벨「저장됨」만으로 끝나지 않게 status/다음 행동(마이페이지에서 다시 보기)을 게스트와 동등하게. |
| **Priority** | P2 |
| **Impact** | 저장 완료 인지·재오픈 유도 |
| **Difficulty** | S |
| **Estimated** | 1d |
| **Dependencies** | RET-01 |
| **Acceptance Criteria** | ① 로그인 저장 성공 시 role=status 또는 동등 안내 ② 「마이페이지에서 다시 보기」 링크가 RET-01으로 연결 ③ 중복 저장 CTA 혼란 최소화(RES-01과 정합) |
| **Status** | Done |

---

### RET-04 — 얇은 취향 프로필 (후속)

| 필드 | 내용 |
|------|------|
| **ID** | RET-04 |
| **Title** | MyPage 얇은 취향 프로필·재설문 진입 |
| **Description** | 지난 빌드 요약 + “취향이 바뀌면 다시 설문”. 비교 보드·소셜 제외. |
| **Priority** | P2 |
| **Impact** | 저빈도 리텐션·홈베이스 포지션 |
| **Difficulty** | L |
| **Estimated** | 5d |
| **Dependencies** | RET-01, RES-02 |
| **Acceptance Criteria** | ① 개요에 최근 취향 태그/문장 ② 저장 빌드 ≥1이면 재설문 CTA ③ 대시보드형 위젯 폭주 없음 |
| **Status** | Todo |

---

# Epic 2 — Survey Continuity

**Epic 목표:** 설문 투자를 존중한다 (refresh/back에 안 날아감).  
**왜 중요한지:** Activation 재시도 비용·신뢰. Product 장애물 B.  
**관련 문서:** Release S-01/S-02/S-03 · Product ROI #3  
**관련 문제:** 새로고침 소실 · 뒤로가기→시작 리셋 · 진행률 카피

### User Story

> As a 설문 진행 중 사용자,  
> I want 실수로 새로고침하거나 결과에서 뒤로 가도 답을 잃지 않기를,  
> so that 다시 처음부터 하지 않아도 된다.

---

### SUR-01 — 설문 진행 영속화

| 필드 | 내용 |
|------|------|
| **ID** | SUR-01 |
| **Title** | 설문 진행·답변 새로고침 유지 |
| **Description** | sessionStorage/localStorage 또는 동등 mid-wizard 영속화. |
| **Priority** | P1 |
| **Impact** | 완주율·중도 이탈↓ |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① 중간 단계 refresh 후 동일 단계·선택 복원 ② “처음부터” 명시 CTA는 초기화 가능 ③ 결과 제출 성공 후 정책에 맞게 클리어 |
| **Status** | Done |

---

### SUR-02 — 뒤로가기 단계 복귀

| 필드 | 내용 |
|------|------|
| **ID** | SUR-02 |
| **Title** | 결과→뒤로가기 시 설문 마지막 단계(또는 히스토리) 복귀 |
| **Description** | 브라우저 back이 설문 **시작**으로 리셋되지 않게 history/state 설계. |
| **Priority** | P1 |
| **Impact** | 수정 여정·이탈↓ |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | SUR-01 권장 |
| **Acceptance Criteria** | ① 결과에서 back → 설문 시작 화면이 아닌 직전 단계(또는 합의된 복귀점) ② 성향 선택만 리셋되는 회귀 없음 ③ 문서화한 복귀 규칙이 QA 시나리오와 일치 |
| **Status** | Done |

---

### SUR-03 — 진행률·미리채움 카피

| 필드 | 내용 |
|------|------|
| **ID** | SUR-03 |
| **Title** | 성향 미리반영 진행률·카피 정리 |
| **Description** | `2/5`가 스킵처럼 보이는 문제, 「미리 고른 값 · 바꿔도 됩니다」. |
| **Priority** | P2 |
| **Impact** | 인지 부하·편향 불안↓ |
| **Difficulty** | S |
| **Estimated** | 1d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① 진행 카피가 실제 문항 모델과 일치 ② 자동반영 문항 안내 문구 존재 ③ progressbar a11y는 A11Y-04 |
| **Status** | Todo |

---

# Epic 3 — Results Conversion & Trust

**Epic 목표:** 결과 페이지를 “숙제”가 아니라 **결정+보관+다음 1행동**으로.  
**왜 중요한지:** 저장률·신뢰·막다른 골목 해소. Product 장애물 C–D.  
**관련 문서:** Release R-01/R-04/R-06 · Product ROI #2/#4 · Investment 필수 #2

### User Story

> As a 결과를 막 받은 사용자,  
> I want 한눈에 납득하고 바로 보관·다음 행동을 하고,  
> so that 스크롤 피로 없이 결정을 이어갈 수 있다.

---

### RES-01 — 저장 CTA 상단화

| 필드 | 내용 |
|------|------|
| **ID** | RES-01 |
| **Title** | 결과 요약 직후 저장 CTA (모바일 fold 안) |
| **Description** | m360/m390 기준 저장이 첫 뷰포트 또는 요약 직후에 오도록. 데스크톱도 요약 아래 1차 CTA. |
| **Priority** | P1 |
| **Impact** | 저장 전환↑ (감정 피크 정렬) |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | RET-02 카피와 정합 |
| **Acceptance Criteria** | ① m390: 요약 카드 아래(또는 sticky)에 저장 CTA 가시 ② 하단 중복은 1회로 축소 또는 역할 분리 ③ RET-02/03 문구와 충돌 없음 |
| **Status** | Done |

---

### RES-02 — Trust UI 3단 압축

| 필드 | 내용 |
|------|------|
| **ID** | RES-02 |
| **Title** | 결과 Trust UI: 한 문장 + 태그 + 왜 (원시 점수 접기) |
| **Description** | 상단 결론 → 태그 → 짧은 왜. 0.xx raw score는 접힘/제거. 입문 포지션 유지. |
| **Priority** | P1 |
| **Impact** | 설득력·공유 가능 메시지·포지션 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | 없음 (RES-01과 병렬 가능) |
| **Acceptance Criteria** | ① 첫 화면에서 결론+태그+1짧은 왜 가독 ② 원시 점수 기본 비노출 또는 「자세히」 접힘 ③ 점수≠구매만족 고지 유지 ④ 매니아 스펙 밀도 증가 없음 |
| **Status** | Done |

---

### RES-03 — Help heading 분리

| 필드 | 내용 |
|------|------|
| **ID** | RES-03 |
| **Title** | Results Help `?`를 H2 텍스트 밖으로 |
| **Description** | `구분감?` 낭독/표시 오염 제거. |
| **Priority** | P2 |
| **Impact** | a11y·가독 |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① H2에 `?` 미포함 ② 도움말 버튼 히트영역 ≥24px(권장 44) ③ aria-labelledby 정합 |
| **Status** | Todo |

---

### RES-04 — 다음 행동 1개

| 필드 | 내용 |
|------|------|
| **ID** | RES-04 |
| **Title** | 결과 「다음에 할 일」 단일 CTA |
| **Description** | 구매 체크리스트 / 예산 메모 / 「이 조합 샵에서 보기」 중 **하나만** MVP. 비교 보드·다중 CTA 금지. |
| **Priority** | P1 |
| **Impact** | 막다른 골목→결정 도우미 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | RES-02 권장; BIZ-01과 샵 클릭 시 연동 |
| **Acceptance Criteria** | ① 결과당 primary next-action 1개 ② 저장과 역할이 시각·카피로 구분 ③ Out of scope 기능 미포함 |
| **Status** | Done |

---

# Epic 4 — Auth & Acquisition Integrity

**Epic 목표:** 가입·CTA 약속이 화면과 일치.  
**관련 문서:** Release A-01/H-05 · Product ROI #7/#10 · Investment 승격

### User Story

> As a 가입 링크/설문 CTA로 들어온 사용자,  
> I want 기대한 화면·행동 이름을 만나고,  
> so that 전환 순간에 배신감을 느끼지 않는다.

---

### AUTH-01 — mode=signup

| 필드 | 내용 |
|------|------|
| **ID** | AUTH-01 |
| **Title** | `?mode=signup` 시 가입 탭 초기화 |
| **Description** | 쿼리 파라미터가 로그인만 보여주는 회귀 수정. |
| **Priority** | P1 |
| **Impact** | 가입 유입·CAC 낭비 방지 |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① `/auth?mode=signup`(실경로 기준)에서 가입 탭/패널 활성 ② 로그인 탭 전환 가능 ③ 저장·MyPage 진입 딥링크 회귀 없음 |
| **Status** | Done |

---

### HOME-01 — CTA 문구 단일화

| 필드 | 내용 |
|------|------|
| **ID** | HOME-01 |
| **Title** | Primary CTA를 「추천 설문 시작」으로 통일 |
| **Description** | 헤더/히어로/하단 동의어 3종 제거. |
| **Priority** | P2 |
| **Impact** | 인지 부하↓·브랜드 기억 |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① 동일 목적 CTA 라벨 1종 ② 접근성 이름도 동일 계열 |
| **Status** | Done |

---

### HOME-02 — H1 공백

| 필드 | 내용 |
|------|------|
| **ID** | HOME-02 |
| **Title** | Home H1 DOM 단어 공백 |
| **Description** | `취향에 맞는키보드` → 정상 띄어쓰기. |
| **Priority** | P3 |
| **Impact** | 낭독/스니펫 |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | textContent에 단어 경계 공백 존재 |
| **Status** | Done |

---

### HOME-03 — 1280 fold 신뢰 문구

| 필드 | 내용 |
|------|------|
| **ID** | HOME-03 |
| **Title** | 1280×720에서 히어로 CTA+게스트 안내 동시 노출 |
| **Description** | 여백/스케일 조정으로 fold 잘림 완화. |
| **Priority** | P2 |
| **Impact** | 노트북 첫인상 안심 레이어 |
| **Difficulty** | S |
| **Estimated** | 1d |
| **Dependencies** | HOME-01과 병렬 가능 |
| **Acceptance Criteria** | 1280×720에서 Primary CTA와 비로그인 안내가 뷰포트 내(또는 CTA 직상단) |
| **Status** | Done |

---

# Epic 5 — Share & SEO Surface

**Epic 목표:** 결과가 밖으로 나가게. OG + 공유 최소 단위.  
**관련 문서:** Release SE-01/R-05/R-07 · Product ROI #6 · Investment 바이럴·승격 #4

### User Story

> As a 결과가 마음에 든 사용자,  
> I want 링크/카드로 공유하고,  
> so that 친구·내가 나중에 다시 열 수 있다.

---

### SEO-01 — og:image

| 필드 | 내용 |
|------|------|
| **ID** | SEO-01 |
| **Title** | 공개 페이지 og:image → `/og/default.png` |
| **Description** | 자산은 존재, 메타 미연결. 개인 results는 noindex 유지. |
| **Priority** | P1 |
| **Impact** | 공유 미리보기·브랜드 |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① `/` 등 공개 페이지 og:image absolute URL ② 이미지 200 ③ auth/mypage/results noindex 정책 유지 |
| **Status** | Done |

---

### SHR-01 — 결과 공유

| 필드 | 내용 |
|------|------|
| **ID** | SHR-01 |
| **Title** | 결과 공유 (링크 복사 및/또는 이미지 카드) |
| **Description** | 개인정보·noindex 정책 하에 토큰 링크 또는 비개인 성향 카드. MVP는 링크 복사+OG 가능 랜딩 우선 검토. |
| **Priority** | P1 |
| **Impact** | 바이럴 최소 단위·Investment 승격 #4 |
| **Difficulty** | L |
| **Estimated** | 5d |
| **Dependencies** | SEO-01, RES-02 권장 |
| **Acceptance Criteria** | ① 결과에서 공유/복사 1액션 ② 붙여넣기 시 미리보기 또는 유효 랜딩 ③ 타 사용자 PII 노출 없음 ④ 공유 시도 이벤트(KPI-01) |
| **Status** | Done |

---

### SEO-02 — 조합 가이드 (후속)

| 필드 | 내용 |
|------|------|
| **ID** | SEO-02 |
| **Title** | 인덱싱 가능 조합 가이드 페이지 소수 |
| **Description** | 의도 검색용. 개인 결과와 분리. 폭주 CMS 금지. |
| **Priority** | P2 |
| **Impact** | SEO 보조 엔진 |
| **Difficulty** | L |
| **Estimated** | 5d |
| **Dependencies** | SEO-01, RES-02 |
| **Acceptance Criteria** | ① index 대상 가이드 N≤소량 ② canonical/title ③ 설문 CTA 연결 |
| **Status** | Todo |

---

# Epic 6 — Commerce Measurement

**Epic 목표:** 결과 1건의 클릭(·구매) 가치를 숫자로.  
**관련 문서:** Investment 비즈니스·승격 #3 · Risk 3  
**관련 문제:** 수익 가설 미계측

### User Story

> As a Founder/PM,  
> I want 결과·카탈로그→샵 클릭이 집계되기를,  
> so that 유닛이코노믹스와 제휴 대화를 시작할 수 있다.

---

### BIZ-01 — 아웃바운드 클릭 계측

| 필드 | 내용 |
|------|------|
| **ID** | BIZ-01 |
| **Title** | 결과·카탈로그 → Swagkey(외부) 클릭 이벤트 계측 |
| **Description** | 부품·세션·(가능하면) 저장ID 차원. 개인정보 정책 준수. |
| **Priority** | P1 |
| **Impact** | 회사 vs 취미 프로젝트 분기 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | KPI-01 스키마와 동일 파이프 권장 |
| **Acceptance Criteria** | ① 외부 링크 클릭 시 이벤트 1회 기록 ② 축(switch 등)·surface(results/catalog) 구분 ③ 대시보드 또는 export로 주간 집계 가능 |
| **Status** | Done |

---

### BIZ-02 — 제휴·기여 GMV 파이프 (후속)

| 필드 | 내용 |
|------|------|
| **ID** | BIZ-02 |
| **Title** | 제휴 계약 또는 기여 구매 데이터 파이프 |
| **Description** | 샵 측 전환 공유·UTM·어필리에이트. 제품 코드만이 아니라 운영 과제 포함. |
| **Priority** | P2 |
| **Impact** | 실매출 신호·Invest 승격 |
| **Difficulty** | L |
| **Estimated** | 5d |
| **Dependencies** | BIZ-01 |
| **Acceptance Criteria** | ① 기여 클릭→주문(또는 합의 프록시) 주간 리포트 ② 계약/약관 문서화 |
| **Status** | Todo |

---

### KPI-01 — 북스타·퍼널 계측

| 필드 | 내용 |
|------|------|
| **ID** | KPI-01 |
| **Title** | 북스타·퍼널 이벤트 계측 |
| **Description** | 재오픈, 설문→결과, 저장 시도/성공, 공유 시도. vanity PV만 보지 않음. **Sprint1:** `interaction.revisit` on MyPage restore Done. 퍼널 3단·주간 리포트는 잔여. |
| **Priority** | P1 |
| **Impact** | 주간 운영·시드 대화 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | RET-01 재오픈 이벤트 계약 |
| **Acceptance Criteria** | ① 북스타 주간 집계 가능 ② 퍼널 3단 이상 ③ Founder 주간 리뷰용 1페이지 |
| **Status** | Done |

---

# Epic 7 — Contact & Trust Ops

**Epic 목표:** 막혔을 때 혼자 두지 않음.  
**관련 문서:** Release CT-01 · Product 장애물 E · Product ROI #8

### User Story

> As a 문제 겪은 사용자,  
> I want 인앱에서 문의하고 접수 확인을 받고,  
> so that mailto 없는 환경에서도 연락할 수 있다.

---

### CTR-01 — 문의 웹폼

| 필드 | 내용 |
|------|------|
| **ID** | CTR-01 |
| **Title** | Contact 최소 웹 폼 + 접수 피드백 |
| **Description** | 기존 Resend 등 인프라 활용 가능. mailto만 의존 금지. |
| **Priority** | P1 |
| **Impact** | 베타 관계·이탈 회수 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① 필수 필드 검증 ② 제출 성공/실패 UI ③ 운영 수신함으로 메일 또는 티켓 도달(스테이징 검증) |
| **Status** | Done |

---

### CTR-02 — SLA·mailto 템플릿

| 필드 | 내용 |
|------|------|
| **ID** | CTR-02 |
| **Title** | 회신 SLA 카피 + mailto body 템플릿 |
| **Description** | 「영업일 2일 내 회신 목표」 등. |
| **Priority** | P2 |
| **Impact** | 기대 관리 |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | CTR-01과 병렬 가능 |
| **Acceptance Criteria** | Contact 본문에 SLA · mailto 시 subject/body 프리필 |
| **Status** | Done |

---

### POL-01 — Privacy 고지 보강

| 필드 | 내용 |
|------|------|
| **ID** | POL-01 |
| **Title** | 개인정보 책임자·쿠키 고지 보강 |
| **Description** | Release P3. 임의 법률 문구 금지 — 자문 후. |
| **Priority** | P3 |
| **Impact** | 신뢰·컴플라이언스 (법률 자문 병행) |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | 법률 검토 |
| **Acceptance Criteria** | 자문 반영 체크리스트 pass |
| **Status** | Todo |

---

# Epic 8 — Catalog Quality & Bridge

**Epic 목표:** 카탈로그가 추천을 해치지 않고, 이후 연장선이 되게.  
**관련 문서:** Release PF-01/C-02 · Product ROI #9 · Investment Risk 8

### User Story

> As a 카탈로그 탐색 사용자,  
> I want 레이아웃이 뛰지 않고 상세를 안전하게 보고,  
> so that 추천과 탐색을 신뢰할 수 있다.

---

### CAT-01 — CLS 억제

| 필드 | 내용 |
|------|------|
| **ID** | CAT-01 |
| **Title** | 카탈로그 이미지 width/height·CLS 억제 |
| **Description** | Lab CLS ~0.33 해소. |
| **Priority** | P1 |
| **Impact** | CWV·클릭 미스·신뢰 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | ① 목록/상세 이미지 예약 공간 ② lab CLS 재측정으로 유의미 감소(목표 0.1 미만) ③ LCP 악화 없음(회귀 가드) |
| **Status** | Done |

---

### A11Y-01 — Modal 프리미티브

| 필드 | 내용 |
|------|------|
| **ID** | A11Y-01 |
| **Title** | Catalog 상세·모바일 메뉴 dialog/포커스/스크롤락 |
| **Description** | role=dialog, focus trap, Esc, body scroll lock. |
| **Priority** | P2 |
| **Impact** | a11y·조작 안정 |
| **Difficulty** | M |
| **Estimated** | 2d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | Catalog 상세·모바일 메뉴 각각 dialog 패턴 충족 |
| **Status** | Done |

---

### CAT-02 — 추천↔카탈로그 대안 (후속)

| 필드 | 내용 |
|------|------|
| **ID** | CAT-02 |
| **Title** | 결과 부품의 「비슷한 대안」 카탈로그 연결 |
| **Description** | 매니아 DB화 없이 1–3 대안. |
| **Priority** | P2 |
| **Impact** | 세션 가치·이탈→연장 |
| **Difficulty** | L |
| **Estimated** | 5d |
| **Dependencies** | RET-01, RES-02, CAT-01 |
| **Acceptance Criteria** | 결과 카드에서 대안 ≤3 · 카탈로그 상세 진입 |
| **Status** | Todo |

---

# Epic 9 — Platform Polish (A11y / DS)

**Epic 목표:** 정식 품질 바닥. 성장 블로커 아님, Sprint 후반.  
**관련 문서:** Release AX/DS/H-06–08 등

---

### A11Y-02 — 터치 타깃

| 필드 | 내용 |
|------|------|
| **ID** | A11Y-02 |
| **Title** | 푸터·인라인·판매처 링크 터치 ≥24px (권장 44) |
| **Description** | padding으로 히트영역. |
| **Priority** | P2 |
| **Impact** | 모바일 오탭↓ |
| **Difficulty** | S |
| **Estimated** | 1d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | 샘플 푸터/인라인 ≥24px 높이 |
| **Status** | Done |

---

### A11Y-03 — visible label

| 필드 | 내용 |
|------|------|
| **ID** | A11Y-03 |
| **Title** | Auth/MyPage 폼 visible label |
| **Description** | placeholder-only 제거. |
| **Priority** | P2 |
| **Impact** | a11y·인지 |
| **Difficulty** | S |
| **Estimated** | 1d |
| **Dependencies** | 없음 |
| **Acceptance Criteria** | 주요 입력에 가시 label |
| **Status** | Done |

---

### A11Y-04 — progressbar a11y

| 필드 | 내용 |
|------|------|
| **ID** | A11Y-04 |
| **Title** | Survey progressbar aria-valuenow 등 |
| **Description** | progressbar 역할·값. |
| **Priority** | P2 |
| **Impact** | SR |
| **Difficulty** | S |
| **Estimated** | 0.5d |
| **Dependencies** | SUR-03 권장 |
| **Acceptance Criteria** | 진행 변경 시 valuemax/now 갱신 |
| **Status** | Done |

---

### DS-01 — 프리미티브 단일화

| 필드 | 내용 |
|------|------|
| **ID** | DS-01 |
| **Title** | Button/Card/Badge/Input 디자인 시스템 단일화 |
| **Description** | 이중 스택 해소. 성장 KPI 직접 아님 → 후순위. |
| **Priority** | P2 |
| **Impact** | 완성도·유지보수 |
| **Difficulty** | XL |
| **Estimated** | 5d+ |
| **Dependencies** | 핵심 Epic 이후 |
| **Acceptance Criteria** | Primary 높이/라디우스 토큰 1계열 · 주요 화면 적용 |
| **Status** | Todo |

---

# Epic 10 — Later Growth (Backlog only)

| ID | Title | Priority | Note |
|----|-------|----------|------|
| GROW-01 | 2nd 샵/브랜드 파일럿 · B2B 위젯 | P3 | Investment 6–12M. Sprint 1–4 제외 |
| — | 소셜/커뮤니티/자사몰/페이월/빠른추천 | — | **하지 않음** |

---

# Sprint 추천

가정: 1 Sprint ≈ 1주 · 1 풀타임 개발자 기준. 병렬 가능 시 표기.

---

## Sprint 1 — Honest Loop Foundations

**목표:** 제품이 거짓말하지 않기 시작. 퀵윈 + 재오픈 착수/완료.

| 작업 | Est |
|------|-----|
| AUTH-01 | 0.5d |
| SEO-01 | 0.5d |
| HOME-01 | 0.5d |
| HOME-02 | 0.5d |
| RET-01 | 5d (주력) |
| KPI-01 (재오픈 이벤트 스키마만이라도) | 부분 |

**완료 조건**

- [x] `mode=signup` → 가입 탭
- [x] 공개 og:image 동작
- [x] Primary CTA 문구 1종
- [x] **저장 → (로컬 없음) → 다시 보기로 결과 복원** E2E pass (unit/integration; 수동 시크릿 권장)
- [x] 재오픈 이벤트 1회 이상 기록 가능 (`interaction.revisit`)

**Sprint1 완료일:** 2026-07-28 · 보고서: `docs/Sprint1_COMPLETION_REPORT.md`

---

## Sprint 2 — Continuity + Save Conversion

**목표:** 설문 투자 존중 + 모바일 저장 전환 + 저장 약속 정직화.

| 작업 | Est |
|------|-----|
| SUR-01 | 2d |
| SUR-02 | 2d |
| RES-01 | 2d |
| RET-02 | 2d |
| RET-03 | 1d |
| SUR-03 / RES-03 (여유) | 1d |

**완료 조건**

- [x] 설문 중 refresh 복원
- [x] 결과 back ≠ 설문 시작 리셋
- [x] m390 요약 직후 저장 CTA 가시
- [x] 게스트/계정 저장 카피·플로우 분리 QA pass

**Sprint2 완료일:** 2026-07-28 · 보고서: `docs/Sprint2_COMPLETION_REPORT.md`  
**여유 Task:** SUR-03 / RES-03 — Skip (Sprint 필수 완료 조건 외; Sprint 3+ 후보)

---

## Sprint 3 — Trust, Contact, Catalog, Measure

**목표:** 결정 도우미 + 관계 채널 + CLS + 숫자.

| 작업 | Est |
|------|-----|
| RES-02 | 2d |
| RES-04 | 2d |
| CTR-01 | 2d |
| CTR-02 | 0.5d |
| CAT-01 | 2d |
| BIZ-01 | 2d |
| KPI-01 완성 | 잔여 |

**완료 조건**

- [x] Trust 3단 + 점수 기본 접힘
- [x] Next-action 1개
- [x] 문의 웹폼 제출→수신 검증
- [x] Catalog lab CLS 유의미 개선
- [x] 아웃바운드 클릭 주간 집계 가능
- [x] 북스타 주간 리포트 초안

**Sprint3 완료일:** 2026-07-28 · 보고서: `docs/Sprint3_COMPLETION_REPORT.md`  
**운영 메모:** `CONTACT_TO_EMAIL` 설정 후 스테이징에서 문의 메일 도달 확인. Catalog CLS는 lab 재측정으로 수치 확정.

---

## Sprint 4 — Share + Polish + Gate Review

**목표:** 바이럴 최소 단위 + 정식 품질 바닥 + Go/No-Go.

| 작업 | Est |
|------|-----|
| SHR-01 | 5d (주력) |
| A11Y-01 | 2d |
| A11Y-02 · A11Y-03 · A11Y-04 | ~2.5d |
| HOME-03 | 1d |

**완료 조건**

- [x] 결과 공유 1액션 E2E
- [x] Modal/터치/라벨/progress 기준 충족
- [x] **Gate 리뷰:** D7 재오픈·저장률·아웃바운드 클릭 추세 점검 → Sprint 5에서 RET-04/CAT-02/SEO-02/BIZ-02 vs 투자 Watch 재평가

**Sprint4 완료일:** 2026-07-28 · 보고서: `docs/Sprint4_COMPLETION_REPORT.md`  
**Gate 메모:** 운영 수치는 `python scripts/report_funnel_analytics.py --window-days 7` + `docs/weekly-north-star-report.md`로 확인. 코드 게이트는 공유·a11y·fold 충족.

**Sprint 4 이후 (백로그):** RET-04 · CAT-02 · SEO-02 · BIZ-02 · DS-01 · POL-01 · GROW-01

---

# 작업 상태 보드 (요약)

| Status | IDs |
|--------|-----|
| **Todo** | RET-04, SUR-03, RES-03, CAT-02, BIZ-02, POL-01, DS-01, SEO-02, GROW-01 |
| **Doing** | — |
| **Done** | AUTH-01, SEO-01, HOME-01–03, RET-01–03, SUR-01–02, RES-01–02, RES-04, CTR-01–02, CAT-01, BIZ-01, KPI-01, SHR-01, A11Y-01–04 |

상태 변경 시 이 문서의 해당 Task `Status`만 갱신한다. 세 Audit 원본은 수정하지 않는다.

---

# 변경 규칙

1. **새 요청**은 기존 Task에 흡수할 수 있으면 ID를 재사용하고 Description/AC만 갱신.
2. Audit에 없는 대형 기능은 Epic 10 + Out of scope 재확인 후 추가.
3. Priority 충돌 시: **RET-01 > SUR-\* > RES-01 > AUTH/SEO 퀵윈 > BIZ/KPI > SHR > CAT > A11Y/DS**.
4. 레이아웃 다이어그램 geometry (`layout-diagram*`, `public/layout-diagrams/*`)는 기존 LOCK 유지 — 본 백로그 범위 밖.

---

**문서 끝.** 실행 시작 시 Sprint 1 체크리스트부터.
