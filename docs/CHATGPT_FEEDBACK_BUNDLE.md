# ChatGPT 피드백 가이드 — Keyboard Recommender

> **용도:** ChatGPT(또는 다른 LLM)에 프로젝트·기능·화면별 피드백을 요청할 때 복사·붙여넣기용 패키지  
> **경로:** `c:\Users\jeung\keyboard-recommender`  
> **작성일:** 2026-07-10 (KST)  
> **상세 컨텍스트:** `docs/PROJECT_CONTEXT.md` (900줄+ 전체 지도 — **반드시 함께 사용**)

---

## 1. 빠른 시작 (3단계)

1. **ChatGPT 새 대화** 열기  
2. 아래 **「§8 범용 프롬프트」** 또는 **「§9 결과 페이지 전용 프롬프트」** 복사 → 붙여넣기  
3. **`docs/PROJECT_CONTEXT.md` 전체** 붙여넣기 + (선택) 스크린샷·코드 파일 첨부

> 레포 전체 zip은 넣지 마세요. `node_modules`, `.next`, `.venv`, `.env`는 제외합니다.

---

## 2. 넣으면 안 되는 것

| 제외 | 이유 |
|------|------|
| `node_modules/`, `.next/`, `backend/.venv/` | 용량·노이즈 |
| `.env`, `.env.local`, API 토큰 | 보안 |
| `backend/data/swagkey_html_cache/` | 대용량 HTML |
| `recommendation-result-view.tsx` **전체** (2,300줄+) | 토큰 낭비 — §6 참고 |

---

## 3. 제품 한눈에 (LLM용 요약)

**한 줄:** 커스텀 키보드(스위치·플레이트·폼·레이아웃·케이스·키캡) 추천 웹 서비스. 설문 + NL → FastAPI 6축 엔진 → Next.js 결과 UI. Swagkey 카탈로그 연동.

**핵심 사용자 여정**

```
홈(/) → 인증(/auth) → 설문(/recommend) → 결과(/results) → 저장·비교·스웨그키·카탈로그(/catalog) · 마이페이지(/mypage)
```

**추천 정책 (중요)**

- 모든 사용자 추천은 **FULL** 엔진
- 실패 시만 **resilient degraded** fallback → UI «안정 모드» (「빠른 추천」 아님)
- `runMode: "quick"`는 내부 contract 표기일 뿐

**주요 페이지**

| Route | 인증 | 역할 |
|-------|------|------|
| `/` | 공개 | Hero, Feature Grid, 카탈로그 유도 |
| `/recommend` | 필요 | 스타일 프리셋 3종 → 5단계 설문 + NL (Curator UI) |
| `/results` | 필요 | 6축 빌드, 근거, 저장/비교, 활동 |
| `/catalog` | 공개 | 5탭(스위치·플레이트·폼·케이스/키트·키캡) |
| `/mypage` | 필요 | 저장 빌드, 비교, 활동, 계정 |

---

## 4. 피드백 주제별 — 무엇을 넣을까

### 4.1 전체 제품 (제품 전략·IA·우선순위)

| 포함 | 파일/자료 |
|------|-----------|
| 필수 | `docs/PROJECT_CONTEXT.md` |
| 권장 | `docs/recommendation-engine-unification-roadmap.txt` |
| 권장 | `docs/swagkey-catalog-roadmap.txt` |
| 선택 | `e2e/tests/critical-flows.spec.ts` (E2E 사용자 플로우) |
| 선택 | 홈·설문·결과·카탈로그 스크린샷 각 1장 |

**질문 예시**

- MVP로서 설문 5단계 + 6축 추천이 과한가?
- 카탈로그와 추천 결과의 연결이 약한가?
- 게스트(로컬 저장) vs 로그인(동기화) 전략이 명확한가?

---

### 4.2 설문 (`/recommend`)

| 포함 | 파일/자료 |
|------|-----------|
| 필수 | `PROJECT_CONTEXT.md` §4.12 (설문 Curator UI) |
| 권장 | `frontend/src/lib/survey-definition.ts` (질문·옵션 카피) |
| 권장 | `survey-wizard.tsx`, `survey-question.tsx` |
| 필수 | 설문 입구·질문 단계·프리셋 배너 스크린샷 |

**질문 예시**

- 스타일 프리셋 3종 + 5단계가 이탈을 유발하는가?
- NL 입력을 항상 노출하는 것이 적절한가?
- 카드가 화면을 채우는 레이아웃이 모바일에서도 괜찮은가?

---

### 4.3 결과 페이지 (`/results`) — **상세는 §7**

| 포함 | 파일/자료 |
|------|-----------|
| 필수 | `PROJECT_CONTEXT.md` + **§7 기능 지도** (이 문서) |
| 필수 | **탭별 스크린샷 4~6장** (§7.5) |
| 권장 | `results-view.tsx` (~190줄) |
| 권장 | `results/page.tsx` |
| 선택 | API `POST /recommendations/compute` 응답 JSON 1건 |
| **금지** | `recommendation-result-view.tsx` 전체 |

**질문 예시**

- MatchGauge + 4탭 구조가 첫 방문자에게 이해 가능한가?
- «추천 근거» 탭의 설명이 신뢰를 주는가?
- 저장/비교가 발견 가능한가? (`#comparison-hub`)
- 결과 본 뒤 다음 행동(구매·재설문·카탈로그)이 명확한가?

---

### 4.4 카탈로그 (`/catalog`)

| 포함 | 파일/자료 |
|------|-----------|
| 필수 | `PROJECT_CONTEXT.md` §4.6, §6.1 |
| 권장 | `catalog-browse-view.tsx`, `catalog-detail-panel.tsx` |
| 권장 | 카탈로그 목록·상세 패널 스크린샷 |

---

## 5. 첨부 파일 체크리스트 (복사용)

```
□ docs/PROJECT_CONTEXT.md                    ← 거의 모든 대화에 필수
□ docs/CHATGPT_FEEDBACK_BUNDLE.md            ← 이 파일 (피드백 방법)
□ docs/recommendation-engine-unification-roadmap.txt   (전체 제품 시)
□ docs/stitch-design-migration.txt             (UI/디자인 시)

설문 피드백:
□ frontend/src/lib/survey-definition.ts
□ frontend/src/components/features/recommendation/survey-wizard.tsx
□ frontend/src/components/features/recommendation/survey-question.tsx

결과 피드백:
□ frontend/src/app/results/page.tsx
□ frontend/src/components/features/recommendation/results-view.tsx
□ docs/evidence-tab-simplification-roadmap.md   (Evidence IA v1.4)
□ (스크린샷) overview / evidence / activity 탭 + 공통 신뢰 레이어
□ (선택) compute API 응답 JSON

E2E 플로우:
□ e2e/tests/critical-flows.spec.ts
□ e2e/tests/results-evidence-phase4.spec.ts
```

---

## 6. 코드 파일 — 얼마나 넣을까

| 파일 | 줄 수 | 권장 |
|------|-------|------|
| `results-view.tsx` | ~190 | **전체 붙여넣기 OK** |
| `results/page.tsx` | ~30 | 전체 OK |
| `survey-wizard.tsx` | ~560 | 전체 또는 입구+질문 구간 |
| `survey-definition.ts` | ~165 | 전체 OK |
| `recommendation-result-view.tsx` | **2,300+** | **전체 금지** — 아래 발췌만 |

**`recommendation-result-view.tsx` 발췌 권장 구간**

- L67~80: 탭 정의 (`BACKEND_RESULT_TABS`, `LITE_RESULT_TABS`)
- L527~555: `MatchGauge`
- L557~675: `SharedResultHeader` (요약 헤더)
- L676~705: state·탭 초기화
- ChatGPT에: «나머지는 비교 테이블·저장·discovery·refinement UI가 있다»고 **문장으로 보완**

---

## 7. `/results` 페이지 기능 지도 (피드백용)

### 7.1 데이터 흐름

```
/recommend «결과 보기»
    → POST /api/v1/recommendations/compute
    → sessionStorage (SurveySubmission v2)
    → /results → ResultsView hydrate
    → RecommendationResultView 렌더
```

**`SurveySubmission` 주요 필드:** `answers`, `traits`, `build`, `recommendations`/`matchExplanations`, `overallConfidence`, `degradedReason`, `nlPreferenceText`, `source` (`api` | mock)

**자동 갱신 (`results-view.tsx`):** case/keycap 누락, legacy 빌드 텍스트, Swagkey URL stale 시 **자동 re-compute**

---

### 7.2 페이지 셸 (`results/page.tsx`)

- 라벨: `RESULTS`
- 제목: «맞춤 추천 결과»
- 부제: «마지막 단계예요. 추천 후보를 확인하고 빌드를 저장하거나 대안을 비교해 보세요.»
- `PageShell` `max-w-ca`

---

### 7.3 Empty state

설문 결과 없을 때:

- «아직 설문 결과가 없습니다…»
- CTA: «설문 시작하기» (`/recommend`), «부품 카탈로그 둘러보기» (`/catalog`)

---

### 7.4 공통 헤더 (`SharedResultHeader`)

- **MatchGauge** — 원형 % (overall confidence)
- 사운드·타이핑 요약 (`soundProfileSummary`, `typingFeelSummary`)
- Trait 배지 (최대 6)
- `degradedReason` 시 **«안정 모드로 추천했어요»** 배너

---

### 7.5 탭 구조 (API 결과·backend scoring 사용 시)

**3계층 IA (2026-07-10, Evidence v1.4):** Hero → **공통 신뢰 레이어** (`e2e-trust-layer`) → 탭

| 계층 / 탭 | 라벨 | 주요 내용 |
|-----------|------|-----------|
| 공통 (탭 위) | — | Confidence Story · 고정 6축 미니 · highlights ≤2 (엔진 raw 문자열 필터) |
| `overview` | 추천 요약 | 6축 빌드 카드, 대안 후보(DISPLAY_K=4), 스웨그키 링크, discovery, 카탈로그 유도, quick refinement |
| `evidence` | 추천 근거 | pick별 **왜 추천** 1줄 · ranking why(switch, gap 조건부) · tradeoff(있을 때만) · `<details>` whyTraits·explanation · MetricGuide·18축 접힘 |
| `activity` | 최근 활동 | 본 빌드·비교·저장 메모, 접기/펼치기 |

> **`save_compare` 탭 제거됨** (Results UX Phase 4) — 저장·비교는 Overview CTA·Drawer.

**Lite 모드:** API picks 없거나 fallback 시 탭 2개만 (`overview`, `evidence`) — 신뢰 레이어 없을 수 있음

---

### 7.6 6축 빌드 표시

| 축 | 라벨 |
|----|------|
| switch | 스위치 |
| plate | 플레이트 |
| foam | 폼 |
| layout | 레이아웃 |
| case | 케이스/키트 |
| keycap | 키캡 |

각 파트: 이름·설명 분리, **«스웨그키에서 보기»** (`shop_view/?idx=` canonical)

---

### 7.7 주요 인터랙션

| 기능 | 설명 |
|------|------|
| **빌드 저장** | 로그인 → API 북마크 / 게스트 → localStorage |
| **빌드 비교** | 대안 2개 선택 → 점수·신뢰도·트레이드오프 표 |
| **비교 저장** | `interaction.comparison` 이벤트 |
| **Quick refinement** | 설문 답 일부 변경 → `postComputeRecommendation` 재호출 |
| **Discovery** | `GET /builds/discovery` — 인기 빌드·조합·성향·큐레이션 |
| **카탈로그 링크** | `catalogHref` — family/subtype deep link |
| **탐색 이벤트** | `interaction.click`, revisit, repeated_view |

---

### 7.8 E2E가 검증하는 결과 플로우

`e2e/tests/critical-flows.spec.ts`:

1. 설문 완료 → `/results` URL
2. Overview CTA `e2e-save-build` → 저장 확인 (탭 없이)
3. 375px 모바일 ranked + save CTA

`e2e/tests/recommendation-survey.spec.ts` · `results-evidence-phase4.spec.ts`:

1. 공통 신뢰 레이어 (`e2e-trust-layer`, Confidence Story, 6축 미니)
2. Evidence 탭 — `왜 추천했나요`, `e2e-pick-ranking-why`, tradeoff 억지 문구 없음
3. 375px 탭 바 · trust layer 노출

---

### 7.9 스크린샷 체크리스트 (결과 페이지)

```
□ ① 전체 폭 — Hero + 공통 신뢰 레이어 + 탭
□ ② 추천 요약 — 6축 빌드 + 대안 1~2개 + 저장 CTA
□ ③ 추천 근거 — 왜 추천 · ranking why · tradeoff(있을 때)
□ ④ 최근 활동
□ ⑤ (선택) degraded «안정 모드» 배너
□ ⑥ (선택) empty state
□ ⑦ (선택) 모바일(375px) — 탭 라벨 + trust layer
```

---

## 8. 범용 프롬프트 (전체 제품)

아래를 ChatGPT 첫 메시지에 붙이고, 이어서 `PROJECT_CONTEXT.md` 전체를 붙여넣으세요.

```text
당신은 커스텀 키보드 추천 SaaS의 시니어 제품·UX 컨설턴트입니다.
대상 사용자: 한국어 UI, 커스텀 키보드 입문~중급자.

아래 PROJECT_CONTEXT와 첨부 자료를 기준으로 피드백해주세요.

## 답변 형식
각 항목마다: (1) 관찰 (2) 문제/리스크 (3) 구체적 개선안 (4) 우선순위 High/Med/Low

## 리뷰 항목
1. 핵심 가치 제안 — «왜 이 서비스인가»가 10초 안에 전달되는가
2. 사용자 여정 — 홈 → 인증 → 설문 → 결과 → 카탈로그/마이페이지 마찰 지점
3. 설문 UX — 프리셋 3종 + 5단계 + NL 항상 표시 (Curator UI)
4. 결과 UX — 6축 빌드·3탭·공통 신뢰 레이어·저장 CTA·스웨그키 연결
5. 신뢰 — FULL 엔진 only, «안정 모드» fallback 설명 가능성
6. 카탈로그 5탭과 추천의 관계
7. 게스트 vs 로그인 (로컬 저장 vs 동기화)
8. MVP 이후 로드맵 — impact × effort Top 7

한국어로 답변해주세요.

---
[여기에 docs/PROJECT_CONTEXT.md 붙여넣기]
```

---

## 9. 결과 페이지 전용 프롬프트

스크린샷 4~6장을 **이미지로 업로드**한 뒤, 아래 + §7 기능 지도 + `results-view.tsx`를 붙여넣으세요.

```text
당신은 B2C 제품 UX·정보 설계 컨설턴트입니다.
커스텀 키보드 추천 서비스의 /results(맞춤 추천 결과) 페이지 **전체** 피드백을 해주세요.

## 배경
- 사용자는 5단계 설문(+선택 NL) 직후 이 페이지에 도달합니다.
- 추천: 6축 FULL 엔진 (스위치·플레이트·폼·레이아웃·케이스·키캡).
- 목표: «왜 이 빌드인지 이해» → «저장/비교» → «스웨그키·카탈로그»로 이어지게.

## 첨부
- 스크린샷: overview / evidence / save_compare / activity 탭
- 기능 지도 + results-view.tsx (아래)

## 리뷰 항목
1. 첫 10초 이해 — MatchGauge·6축·탭이 직관적인가
2. 정보 밀도 — 과부하 vs 부족
3. 탭 IA — 4탭 유지 vs 통합(2탭) 제안
4. 초보자 난이도 — jargon·trait·confidence
5. «추천 근거» 신뢰감 — 설명 문구·구조
6. 저장/비교 발견성 — #comparison-hub, 탭 vs 인라인
7. 다음 행동 — 스웨그키·카탈로그·재설문(refinement)
8. 커뮤니티 discovery — 도움 vs 산만함
9. degraded «안정 모드» — 사용자 이해도
10. 모바일 — 깨질 요소·스크롤·탭

## 출력
- 항목별 문제 → 개선안
- **우선 개선 Top 5** (impact × effort, 1줄 근거)
- **와이어 수준**으로 요약 탭 재배치 스케치(텍스트)

한국어로 답변해주세요.

---
[§7 기능 지도 붙여넣기]
[results-view.tsx 붙여넣기]
[선택: PROJECT_CONTEXT.md §4.1 결과 관련 bullet만]
```

---

## 10. 설문 페이지 전용 프롬프트

```text
/recommend 설문 페이지 UX 피드백을 해주세요.

컨텍스트:
- 입구: 스타일 프리셋 3종 (Lucide Moon/Zap/Scale)
- 질문: 5단계, 프리셋 시드 답은 스킵 + 2줄 배너
- NL 입력 항상 표시, 뷰포트 고정(스크롤 최소)
- Lucide 아이콘, 카드 가로/세로 채움

리뷰:
1. 입구→질문 전환
2. 프리셋 스킵이 혼란을 주는가
3. 카드·글씨 크기·한 화면 레이아웃
4. 이탈 지점
5. 결과 페이지로 이어지는 기대 설정

한국어. PROJECT_CONTEXT §4.12 + 스크린샷 기준.

---
[PROJECT_CONTEXT.md §4.12 + survey-definition.ts]
```

---

## 11. 후속 질문 (1차 답변 후)

**결과 페이지**

- «4탭을 2탭으로 줄인다면 라벨과 콘텐츠 배치는?»
- «MatchGauge 대신 초보자에게 보여줄 더 나은 요약은?»
- «저장/비교를 요약 탭 하단 고정 CTA로 빼면?»
- «추천 근거를 요약 탭에 3줄만 노출하고 상세는 접기?»
- «스웨그키 링크를 6축 각각 vs 빌드당 1개 — 어느 쪽이 나은가?»

**전체 제품**

- «설문 5단계를 3단계로 줄이면 어떤 질문을 합칠까?»
- «카탈로그에서 추천 결과로 돌아오는 루프는?»
- «경쟁 서비스 대비 차별점 문구 3개 제안»

---

## 12. Custom GPT Knowledge 업로드 (반복 피드백용)

ChatGPT Custom GPT **Knowledge**에 고정 업로드 권장:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CHATGPT_FEEDBACK_BUNDLE.md` (이 파일)
3. `docs/recommendation-engine-unification-roadmap.txt`
4. `frontend/src/lib/survey-definition.ts`
5. `frontend/src/components/features/recommendation/results-view.tsx`
6. `e2e/tests/critical-flows.spec.ts`

이후 대화마다 **스크린샷만** 올리고 §9·§10 프롬프트로 시작하면 됩니다.

---

## 13. API 응답 샘플 넣는 법 (근거·카피 피드백)

1. 로컬에서 설문 완료 → DevTools → Network  
2. `POST .../recommendations/compute` 응답 JSON 복사  
3. ChatGPT에: «이 응답을 바탕으로 추천 근거 문구가 초보자에게 적절한지 리뷰해줘»

민감 정보(세션·이메일)는 제거 후 첨부.

---

## 14. Cursor와 역할 나누기

| 도구 | 역할 |
|------|------|
| **ChatGPT + 이 문서** | 제품 감각, IA, 카피, 우선순위, 와이어 수준 제안 |
| **Cursor** | 피드백 반영 코드 수정, Vitest/E2E 검증 |

ChatGPT Top 5 → Cursor에 «§9 항목 3 반영해서 results 탭 구조 개선»처럼 넘기면 됩니다.

---

## 15. 관련 문서

| 문서 | 용도 |
|------|------|
| `docs/PROJECT_CONTEXT.md` | 전체 프로젝트 지도 (Agent·ChatGPT 공통) |
| `docs/evidence-tab-simplification-roadmap.md` | Evidence IA v1.4 (Phase 0–4 완료) |
| `docs/evidence-tab-phase4-validation.md` | Guardrails · E2E 검증 리포트 |
| `docs/results-ux-roadmap.md` | /results UX Phase 0–7 |
| `docs/stitch-design-migration.txt` | UI 마이그레이션 Phase 0–7 |
| `docs/recommendation-engine-unification-roadmap.txt` | FULL 엔진 단일화 |
| `docs/quality-testing.md` | 테스트·E2E |

---

*이 문서는 ChatGPT 피드백 요청용입니다. 코드·기능 변경 시 `PROJECT_CONTEXT.md`와 함께 업데이트하세요.*
