# Launch Readiness — Critical Path Roadmap

> **버전:** v1.0 — 2026-07-22 (KST)  
> **목적:** Launch Readiness Review(L01–L14)를 **출시 전 필수 / 출시 후 개선**으로 재분류하고, Cursor·Owner가 Phase(Pass) 단위로 실행·검증하기 위한 로드맵  
> **근거:** 라이브 실측(`tmp/launch-review/`) + Owner 재분류(소규모 베타 가능 · 정식 공개는 High 수정 후)  
> **관련:** `docs/small-group-test-checklist.md` · `docs/deployment-roadmap.md` · `DESIGN.md` · `DESIGN_SYSTEM.md`

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Owner** | §현재 판정 · §LOCK · Pass별 Owner Gate · §출시 기준 |
| **구현 / Cursor** | Pass별 Task · Do not · **Gate 미충족 시 다음 Pass 금지** |

```
LOCK(L01=A) → Pass 1 (L03→L02→L05→L04) → Gate 저장 루프
           → Pass 2 (L06·L08·L09·L11) → Gate 카피/IA
           → Pass 3 (L07·L10·L01 문서) → Gate 정합
           → 소규모 베타 / 정식 공개
```

**한 Pass = 한 작업 묶음 = 가능하면 한 PR.**  
Pass 1 Gate(저장→마이페이지→재로그인) 실패 시 Pass 2 UI/카피로 넘어가지 말 것.

---

## 현재 판정 (Baseline)

| 판정 | 상태 |
|------|------|
| 소규모 베타 | ✅ 가능 (코어 설문→결과→스웨그키 링크·법무면 동작) |
| 정식 광공개 | ⚠ Pass 1(+권장 Medium) Gate 통과 후 |
| UX/UI/Product 개선(이전 사이클) | ✅ 반영됨 (게스트 설문·약관·고지 등) |

### 이슈 재분류

| ID | 심각도(리뷰) | 출시 전? | Pass | 비고 |
|----|--------------|----------|------|------|
| **L03** | High | **필수** | 1 | 저장→마이페이지 — 핵심 루프 |
| **L02** | High | **필수** | 1 | 문의 이메일(test Gmail 제거) |
| **L05** | High | **필수** | 1 | Focus ring |
| **L04** | High | **필수** | 1 | 헤더「결과」조건부 노출 |
| **L06** | Medium | **권장** | 2 | 설문 진행 수 카피 |
| **L08** | Medium | **권장** | 2 | 검색창 이중 |
| **L09** | Medium | **권장** | 2 | 저장 status 중복 |
| **L11** | Medium | **권장** | 2 | 버튼 계층 |
| **L07** | Medium | 상황 판단 | 3 | CTA 위치(무조건 최상단 X) |
| **L10** | Medium | 상황 판단 | 3 | 고지 접기(핵심 문장 유지) |
| **L01** | High(성격 다름) | **결정만 선확정** | 3 | **A 채택** — 문서/토큰을 라이브에 맞춤. 전면 UI 리디자인 금지 |
| L12–L14 | Low | 출시 후 | Backlog | 404 안내·hit target·긴 결과 스크롤 |

---

## Phase 0 — LOCK (착수 전 확정)

> Pass 1 코드 작성 전 Owner가 확정. 미확정 시 Pass 1 중 L01 관련 작업만 보류(기능 High는 진행 가능).

| # | 결정 | 후보 | **확정** |
|---|------|------|----------|
| **D1** | 디자인 시스템 공식 방향 | A) 라이브 퍼플 다크를 공식으로 · B) Desk Craft로 전면 재디자인 | ✅ **A** (2026-07-22) — Pass 3에서 `DESIGN.md`/`DESIGN_SYSTEM.md`를 라이브에 맞춤. **전체 색상 리디자인 금지** |
| **D2** | 문의 이메일 | 도메인 메일 / 전용 Gmail(non-test) | Owner가 주소 확정 후 L02 적용 |
| **D3** | 「결과」내비 정책 | A) 최근 결과 있을 때만 · B) 라벨「최근 추천」+조건부 | ✅ **A 권장** (Pass 1 L04) |
| **D4** | 저장 루프 정의 | 계정 저장만 / 게스트 로컬은 별도 | ✅ 정식 Gate = **로그인 사용자 계정 저장 → 마이페이지 반영 → 재로그인 유지** |

### Do not (전 Pass 공통)

- 추천 알고리즘·API shape·DB schema·인증 아키텍처 전면 변경 금지(버그픽스에 필요한 최소 예외만).
- L01을 이유로 **전체 UI 색/토큰 일괄 교체 금지**.
- seed `merge_*` / `promote_*`에 `--apply-to-seed` 자동 실행 금지.
- layout diagram geometry 파일 무단 수정 금지.
- Pass 1 Gate 실패 상태에서 Pass 2/3로 진행 금지.
- Medium를 Critical처럼 한꺼번에 몰아 넣지 말 것.

---

## Pass 1 — 출시 전 필수 High (L03 → L02 → L05 → L04)

**목표:** 핵심 재방문 루프·운영 신뢰·키보드 접근성·빈「결과」혼란을 닫는다.  
**순서 고정:** L03 원인 분석·수정이 끝나기 전에 L02/L04/L05만 병합해도 되나, **Owner Gate는 L03 포함 전체 Pass 1** 이다.

### 1.1 L03 — 저장 후 마이페이지 0건

**성격:** UI 토스트만으로 끝내지 말 것. 데이터 경로 검증.

**가능한 원인(체크리스트)**

- [ ] 저장 API 실패 / 4xx·5xx
- [ ] 성공 응답이나 DB 미반영
- [ ] `user_id` 미연결
- [ ] 게스트 로컬 vs 계정 저장 병합 실패
- [ ] 마이페이지 조회 캐시·쿼리 조건 불일치
- [ ] RLS / persistence 플래그
- [ ] 로그인 직후 세션 타이밍

**Task**

1. 로그인 → 설문 → 결과 →「이 빌드 저장」클릭.
2. Network에서 bookmark/save API 요청·응답 확인.
3. DB/`eval_events`(또는 해당 저장소)에서 `user_id`·payload 확인.
4. `/mypage?section=saved` · 새로고침 · 로그아웃 · 재로그인 · 목록 재확인.
5. 실패 지점별 최소 수정(FE 캐시 무효화 / API / 조회 필터 / 세션).
6. 실패 시 사용자에게 **명확한 에러**(성공 위장 금지).

**후보 파일**

- `frontend/src/components/features/recommendation/recommendation-result-view.tsx`
- `frontend/src/lib/api/saved-recommendations.ts` (또는 동등)
- `frontend/src/components/features/mypage/mypage-saved-builds.tsx` · `mypage-hub.tsx`
- backend auth/bookmark persistence 관련 모듈(원인에 따라)

**Gate (L03)**

- [ ] 로그인 사용자 저장 → 마이페이지에 **≥1건** 표시
- [ ] 새로고침 후 유지
- [ ] 로그아웃→재로그인 후 유지
- [ ] 실패 시 성공 카피 없음

---

### 1.2 L02 — 문의 이메일

**Task**

1. Owner가 운영 주소 확정(권장: `support@`/`contact@` 도메인, 없으면 전용 non-test Gmail).
2. `NEXT_PUBLIC_CONTACT_EMAIL`을 스테이징·프로덕션에 설정.
3. `/contact` 노출 문구가 test/개인 메일이 아님을 확인.
4. `frontend/.env.example` 주석에 운영 설정 안내 유지.

**후보 파일:** `frontend/src/app/contact/page.tsx` · 배포 env · `.env.example`

**Gate (L02)**

- [ ] 라이브 `/contact`에 `test`·임시 주소 미노출
- [ ] mailto 동작

---

### 1.3 L05 — Focus ring

**Task**

1. 전역 `--focus-ring`(또는 동등 토큰) 정의.
2. `:focus-visible`에 outline(+ offset) — 다크 대비 확보.
3. 버튼·링크·input·탭에 동일 정책(컴포넌트별 임의색 남발 금지).

**후보 파일:** `frontend/src/app/globals.css` · `components/ui/button.tsx` · input/link 공용

**Gate (L05)**

- [ ] Tab으로 홈→설문 CTA까지 이동 시 포커스 위치가 육안으로 구분됨
- [ ] mouse click 후 불필요한 두꺼운 focus 잔상 최소화(`:focus-visible`)

---

### 1.4 L04 — 헤더「결과」조건부 노출

**Task**

1. 이 브라우저에 최근 설문 결과(또는 last-known-good)가 **있을 때만**「결과」링크 표시.
2. 없으면 숨김(빈 `/results`로 유도하지 않음).
3. (옵션) 라벨을「최근 추천」으로 — D3에 따름. 기본은 숨김 우선.

**후보 파일:** `frontend/src/components/layout/site-header.tsx` · survey-storage 유틸

**Gate (L04)**

- [ ] 시크릿/신규 게스트: 헤더에「결과」없음
- [ ] 설문 완료 후:「결과」나타남 · 클릭 시 결과 로드

---

### Pass 1 — Owner Gate (정식 공개 최소선)

스테이징 또는 프로덕션에서 **직접** 통과:

```
로그인
→ 설문
→ 결과
→ 저장
→ 마이페이지(저장한 빌드 ≥1)
→ 새로고침
→ 로그아웃
→ 재로그인
→ 저장 목록 유지
```

추가:

- [ ] `/contact` 운영 메일
- [ ] Tab focus visible
- [ ] 결과 없는 세션에서 헤더「결과」없음

**Pass 1 미통과 시 Pass 2 착수 금지.**

---

## Pass 2 — 출시 전 권장 Medium (L06 · L08 · L09 · L11)

**목표:** 작은 수정으로 신뢰·IA·CTA 계층을 정리.

| ID | Task 요약 | 후보 파일 | Gate |
|----|-----------|-----------|------|
| **L06** | 「N/M 단계」와「남은 ~」카피 정합(남은 문항 수 = M−N+0 또는「남은 k문항」으로 통일) | `survey-wizard.tsx` | 2/5일 때 남은 표현이 모순 없음 |
| **L08** | 헤더 검색 vs 카탈로그 본문 검색 **하나만** 유지 | `site-header.tsx`, `catalog-browse-view.tsx` | 카탈로그에서 검색 UI 1개 |
| **L09** | 저장 status **단일 메시지**(이어붙임 금지) | `results-overview-tab.tsx` | 저장 1회 → status 1문장 |
| **L11** | Primary / Secondary / Tertiary 역할 분리(로그인≠설문 Primary 동일 필 지양) | 헤더·히어로·결과 CTA 사용처 | 한 화면에 Primary 경쟁 ≤1 |

**Pass 2 Owner Gate**

- [ ] 설문 진행 문구 모순 없음
- [ ] 카탈로그 검색 단일
- [ ] 저장 토스트/status 단일
- [ ] lint · typecheck · build PASS

---

## Pass 3 — 상황형 Medium + L01 문서 정합 (L07 · L10 · L01)

**목표:** 전환·고지 밀도·문서/구현 일치. **전면 UI 리디자인 없음.**

### 3.1 L07 — 모바일 CTA 위치

**원칙:** 무조건 sticky 최상단 금지.

권장 정보 구조:

```
추천 요약
→ 핵심 추천 이유 2~3줄
→ 다음에 할 일 CTA
→ 세부 근거
→ 고지
```

**Gate:** 모바일에서 CTA가 요약·짧은 이유 **이후**, 긴 고지·6카드 **이전**에 위치.

### 3.2 L10 — 고지 접기

- **항상 노출:** 가격·재고는 판매처 기준·변동 가능(한 줄).
- **접기 가능:** 긴 면책·출처·링크 헬스 상세.

### 3.3 L01 — 문서 정합 (방향 A)

1. `DESIGN.md` / `DESIGN_SYSTEM.md`에 **현재 라이브(퍼플 다크)를 canonical**로 명시.
2. Desk Craft를「참고/이전 제안」또는 향후 옵션으로 격하·이력 남김.
3. 토큰 문서의 「퍼플 금지」등 라이브와 충돌하는 문장 정리.
4. **페이지 전면 restyle 금지.**

**Pass 3 Owner Gate**

- [ ] DESIGN 문서와 라이브 기본 테마 서술 일치
- [ ] L07/L10 반영 시 핵심 고지 1줄은 접히지 않음
- [ ] build PASS

---

## Backlog (출시 후 / Low)

| ID | 내용 | 메모 |
|----|------|------|
| L12 | `/compare` 등 404에「결과 내 비교」안내 | 전용 비교 앱 만들지 말 것 |
| L13 | 헤더 아이콘 터치 44px | |
| L14 | 결과 스크롤 피로 | 접기·우선순위만 |
| — | 멀티 판매처·알림·공유 카드 | 전략 합의 후 별도 로드맵 |
| — | 계정 설문 스냅샷 서버 동기화 | API/DB 범위 — 별도 Phase |

---

## 출시 기준

### 소규모 베타 (지금~Pass 1 전에도)

- 코어: 홈 → 설문 → 결과 → 스웨그키 링크
- 법무: `/privacy` `/terms` `/contact`(메일은 Pass 1에서 교체)
- 버그 제보 채널 1개 (`small-group-test-checklist.md`)

### 정식 광공개

- [ ] **Pass 1 Owner Gate** 통과
- [ ] Pass 2 권장 항목 통과(또는 Owner가 명시적 이월)
- [ ] L02 운영 메일 라이브 반영
- [ ] `deployment-roadmap` smoke + critical e2e 1회

---

## Cursor 실행 프롬프트 (복붙)

**Pass 1**

```
docs/launch-readiness-roadmap.md Pass 1 진행해줘.
순서: L03(원인 분석·데이터 검증 포함) → L02 → L05 → L04.
L01 전체 UI 리디자인 금지. Pass 1 Gate 통과 전 Pass 2 금지.
step-by-step으로 검증하고, 저장→마이페이지→재로그인 루프를 직접 확인해.
```

**Pass 2**

```
docs/launch-readiness-roadmap.md Pass 2 진행해줘. L06 L08 L09 L11만.
알고리즘/API/DS 전면 변경 금지.
```

**Pass 3**

```
docs/launch-readiness-roadmap.md Pass 3 진행해줘.
L01은 방향 A(문서를 라이브 퍼플 다크에 맞춤). 전체 색상 리디자인 금지.
L07은 CTA를 요약·짧은 이유 직후 배치. L10은 가격·재고 한 줄은 항상 노출.
```

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-22 | v1.0 — Launch Review 재분류·Pass 1–3·L01=A LOCK |
