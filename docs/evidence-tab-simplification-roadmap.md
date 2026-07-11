# 추천 근거 탭(Evidence) 정리 — Phase 실행 가이드

> **대상:** `/results` 전체 IA — **결과 페이지 공통 신뢰 레이어** + **추천 근거** 탭  
> **제품 목표:** 결과 전체에서 «믿을 만한가» · Evidence에서 «왜 **이** 1순위인가»  
> **버전:** v1.4 — 2026-07-10 (KST) — UX 원칙·운영 기준·Non-goals 반영 (구현 착수용)  
> **관련:** `docs/results-ux-roadmap.md` · `docs/CHATGPT_FEEDBACK_BUNDLE.md` · Overview/대안 정리(2026-07-09~10 세션)

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **Cursor / 구현** | Phase별 **Cursor 실행** · §구현 가드레일 · §Non-goals |
| **PM / Tech Lead** | §UX 원칙 · 콘텐츠 예산 · Product Decision · Success / Failure |
| **ChatGPT 피드백** | §「ChatGPT에 넘길 때」· §「IA 확정 (v1.2)」 |

**한 Task = 한 PR = 한 Cursor 세션** (목표 diff ~250줄 이하)

**Phase 0~1 착수 전 확정 3건:** ✅ **2026-07-10 확정** — §「Phase 0~1 확정 (LOCKED)」

---

## Phase 0~1 확정 (LOCKED)

> 코드: `results-trait-display.ts` · `results-ranking-thresholds.ts` (+ tests)

### 1. 고정 6축 매핑

API `userTraitScores` (**14 v2 축**, `trait_engine/axes.py`) → UI **6축 고정** (순서·라벨 변경 금지).

| UI 라벨 | `id` | v2 축 가중합 |
|---------|------|----------------|
| 소음 | `noise` | `muted` +1 · `high_pitch` −0.65 · `deep_sound` +0.15 |
| 구분감 | `tactility` | `strong_tactile` +1 · `smooth` −0.55 |
| 반발감 | `bounce` | `poppy` +0.75 · `marbly` +0.35 |
| 무게감 | `heft` | `firm_bottom_out` +0.45 · `light_typing_force` −0.7 · `deep_sound` +0.25 |
| 탄성 | `flexibility` | `flexible` +1 · `stiff` −1 |
| 선명도 | `clarity` | `high_pitch` +0.55 · `scratchy` +0.35 · `smooth` −0.25 |

- 점수 정규화: raw ∈ **[−8, +8]** → bar 0–1 (`normalizeTraitScore`)
- 막대: **5칸** `■■■□□` (`filledSegments = round(value × 5)`)
- Microcopy: «당신의 취향을 대표하는 6가지 핵심 축이에요.»
- **동적 상위 N축 선정 금지**

### 2. Ranking why gap threshold + fixture

**MVP:** `switch` only · `scoreGapMin = 0.04` (절대 gap = `pick.score − alternatives[0].score`).

| Fixture | pick | runner-up | gap | `rankingWhyMode` |
|---------|------|-----------|-----|------------------|
| `switchFallback` (stable snapshot) | 0.6444 | 0.6360 | ≈0.008 | **fallback** |
| `switchConcrete` (synthetic) | 0.72 | 0.62 | 0.10 | **concrete** (≤2 bullet) |
| `noRunnerUp` | 0.65 | — | — | **hidden** |

**판정:**

- `gap ≥ 0.04` → 구체 bullet ≤2
- `gap < 0.04` → honest fallback («상위 후보가 매우 비슷해요»)
- runner-up 없음 → 블록 hidden
- `traitGapMin`: **MVP 미사용** (null) — 대안 trait 벡터 API 추가 후 Phase 3-2+

**근거:** stable snapshot 대부분 gap &lt; 0.02 → 억지 bullet 방지. layout gap ≈0.045는 **Plate 확장 시** 동일 threshold 검증용 참고.

### 3. 공통 레이어 콘텐츠 예산 (LOCKED)

| 우선순위 | 블록 | 예산 | 초과 시 |
|----------|------|------|---------|
| 1 | Confidence Story | 헤더 1 + bullet **≤4** (high 3 · balanced 2+링크) | bullet 축소 |
| 2 | 고정 6축 미니 | microcopy 1 + 막대 6 | — |
| 3 | highlights | bullet **≤2** | 블록 생략 |

**UX 기준 (로드맵):** Hero보다 작음 · **탭 라벨이 첫 화면에 보임** · Story+6축 한 눈에.

**축소 순서 (블록 추가 금지):** highlights 생략 → Story bullet 감소 → **4번째 블록 금지**

**CTA:** 저장·스웨그키 금지 · 저신뢰 **정교화 텍스트 링크 1줄**만 예외.

**Dev Gate 참고 px (부록 F):** 모바일 ~220–260px — 성공/실패 KPI에 단독 사용 금지.

---

## IA 확정 (v1.2 — 구조 변경 없음)

v1.2 **3계층 IA**는 확정. v1.3~v1.4는 **철학·운영·구현 가드레일**만 보강한다.

### 페이지 구조

```
┌─────────────────────────────────────────┐
│ Hero                                    │
│   (선택) highlights ≤2 bullet — §Decision│
├─────────────────────────────────────────┤
│ ★ 공통 신뢰 레이어 (탭 위 · 얇게)        │
│   · Confidence Story (≤4 bullet)        │
│   · 고정 6축 미니 + microcopy 1줄        │
│   · build.highlights ≤2 bullet (선택)   │
├─────────────────────────────────────────┤
│ [ Overview ]  [ Evidence ]              │
│                                         │
│ Overview: 무엇 · 행동 (짧게)             │
│                                         │
│ Evidence: pick별                        │
│   · 왜 추천했는가                         │
│   · 왜 1순위인가 (gap 충분 시) / honest fallback │
│   · 주의할 점 (있을 때만)                 │
│   · <details> 더 깊게                    │
└─────────────────────────────────────────┘
```

### 3계층 역할

| 계층 | 담당 | 사용자 질문 |
|------|------|-------------|
| **결과 페이지 공통** | 신뢰 · 취향 학습 (**행동 CTA 없음**) | «믿을 만한가?» «나는 어떤 타입?» |
| **Overview** | 무엇 · 저장·스웨그키 | «뭘 사면 되지?» |
| **Evidence** | pick 설득 | «왜 **이게** 1등이지?» |

### Evidence 탭 — 담당 범위

| Evidence에 **있음** | Evidence에 **없음** |
|--------------------|---------------------|
| Pick: 왜 추천 (가공 1~2줄) | Confidence Story |
| Pick: **왜 1순위** (gap 충분 시 ≤2 bullet · else fallback) | 고정 6축 미니 |
| Pick: tradeoff (**있을 때만**) | `build.highlights` |
| Pick: 대안 이름+링크 | MetricGuide |
| `<details>`: whyTraits · explanation · 18축 표 | |

### v1.3 → v1.4 변경 요약

| 항목 | v1.3 | v1.4 |
|------|------|------|
| Guardrails | 구현 규칙만 | **UX 원칙 + 구현 가드레일 이층** |
| 레이어 높이 | 본문 220~260px 강조 | **UX 기준 (본문) · px는 부록 Dev Gate만** |
| Confidence Story 톤 | 엔진 중심 예시 | **사용자 가치 중심 · tier별 분기** |
| ranking why 확장 | 스위치 only (종료 조건 없음) | **Expansion Criteria** |
| Success Metrics | Primary만 | **+ Failure Signals** |
| 스코프 | — | **§Non-goals** |

### 고정 6축 · 콘텐츠 예산

**§「Phase 0~1 확정 (LOCKED)」** 에 상세 확정. IA 다이어그램용 요약만 유지.

---

## 공통 신뢰 레이어 — 콘텐츠 예산 (요약)

LOCKED 예산과 동일. **Hero보다 작음 · 탭 노출 · 블록 ≤3 · Story ≤4 · highlights ≤2.**

### highlights 위치

| 조건 | 위치 |
|------|------|
| **기본** | 공통 신뢰 레이어 |
| Hero 슬림 (제품명·태그라인·CTA만) | Hero 내 ≤2 bullet 허용 |
| Hero가 이미 길다 | Trust Layer만 |

---

## 문제 진단 · 원칙

(현재 audit UI 과밀 · 1순위 설득 부재 · 탭 밖 신뢰 공백 — v1.2와 동일)

**제품 원칙 (8줄):**

1. **3계층 분리** — 공통 신뢰 · Overview · Evidence.
2. **공통 레이어는 얇게** — 두 번째 Hero 금지.
3. **Evidence = 추천 설득** — 엔진 audit·교과서 아님 (`<details>`로만).
4. **30초 이해 실패 시** 기능 추가보다 **설명·카피 개선 우선** (§UX 원칙).
5. **ranking why는 정직하게** — gap 미달 → fallback only.
6. **tradeoff 없으면 숨김.**
7. **raw 엔진 문자열 노출 금지.**
8. **리팩터 PR과 UI 변경 PR 분리.**

---

## Phase 요약

```
0 → 1 → 2 → 3-1 → 3-2 → 4
```

| Phase / Task | 목표 | PR | 리스크 |
|--------------|------|-----|--------|
| **0** | 서브컴포넌트 분리 (**trait/threshold 파일은 확정 완료**) | 1~2 | Low |
| **1** | 공통 레이어 (예산) + Evidence infra | 1~2 | Low |
| **2** | Pick 설득 shell + tradeoff(조건부) | 1~2 | Medium |
| **3-1** | why · tradeoff · highlights · Story 톤 | 1 | Low |
| **3-2** | ranking why · 스위치 MVP | 1 | **High** |
| **4** | E2E · 문서 · Guardrails/Non-goals 체크 | 1 | Low |

**Rollback 후보:** Task 3-2

---

## Product Decision

| 항목 | v1.4 |
|------|------|
| 공통 레이어 | **Hero보다 작음 · 탭 노출 · 블록 ≤3** |
| Confidence Story | Hero 아래 · 탭 위 · **사용자 가치 톤** · tier별 분기 |
| 공통 레이어 CTA | **신뢰만** · 정교화 **링크 1줄** 예외 |
| 6축 microcopy | «대표 6가지 핵심 축» 1줄 |
| highlights | ≤2 bullet |
| ranking why | gap > threshold → ≤2 bullet · else fallback |
| ranking why MVP | **스위치 only** → §Expansion Criteria |
| tradeOff | 있을 때만 |
| Evidence | why + ranking(조건부) + tradeoff(조건부) + details |

### Expansion Criteria — ranking why 도메인 확장

**MVP 종료 (스위치):**

- [ ] Task 3-2 배포 · fixture green (bullet / fallback / no-runner-up)
- [ ] feature flag ON 후 **2주** 관측
- [ ] fallback 비율 **< 40%** (억지 bullet 과다 생성 아님)
- [ ] 정성 3건: «억지 설명» **0건**

**Plate 확장 (MVP 종료 + 아래):**

- [ ] Evidence 탭 방문 세션 **저장률 변화 없음 또는 ↑**
- [ ] «대안 스웨그키만 클릭·저장 없음» 비율 **증가하지 않음**
- [ ] Task 3-2 **롤백 0회**

**Case · Keycap · 기타 4도메인:**

- Plate **2주** 동일 조건 충족 후 순차 확장 (1 PR = 1~2 도메인)
- 백엔드 `evidenceRankingWhy[]` 도입 시 heuristic **교체** (확장과 동시 금지)

> «사용자 피드백»만으로 확장하지 않음 — **proxy + fallback 비율 + 정성** 병행.

---

# Phase 0. 컴포넌트 분리 · **1~2 PR**

### Task 0-1 — Evidence 서브모듈

- `results-evidence-*.tsx` · `data-testid="e2e-pick-explanations"`

### Task 0-2 — 공통 신뢰 레이어 shell

- `results-trust-layer.tsx` · `results-confidence-story.tsx`
- `results-trait-mini-profile.tsx` · `results-build-highlights.tsx`
- `results-trait-display.ts` stub
- `recommendation-result-view.tsx` — `<ResultsTrustLayer />`

### Task 0-3 — ranking gap 상수

- `results-ranking-thresholds.ts` · fixture 3건 (bullet / fallback / no-runner-up)

**Dev Gate:** smoke + E2E green

---

# Phase 1. 공통 신뢰 레이어 + Evidence infra · **1~2 PR**

### Task 1-1 — Confidence Story

**위치:** Hero 직후 · 탭 위

**톤: 사용자 가치 중심 (엔진·순위 비교 용어 지양)**

**high (gap 충분 · stable):**

```
추천 신뢰도: 높음
✓ 선호가 일관되게 나타났어요
✓ 비슷한 후보보다 더 잘 맞는 조합이 확인됐어요
✓ 큰 호환성 문제는 없어요
```

**balanced / gap 작음:**

```
추천 신뢰도: 보통
✓ 일부 응답이 엇갈렸어요
· 후보가 비슷해서 취향에 따라 선택이 달라질 수 있어요
→ 취향 정교화하기 (링크 1줄)
```

- bullet ≤4 · tier는 `recommendationConfidence` + gap 신호로 분기
- **high일 때만** «더 잘 맞는 조합» — gap 작으면 «후보가 비슷» (honest fallback과 일치)
- `ResultsQualityStatus` + Overview amber **통합**
- `e2e-confidence-story`

### Task 1-2 — 고정 6축 + microcopy

### Task 1-3 — highlights ≤2 bullet

### Task 1-4 — Evidence infra 접기

**Dev Gate:**

- **UX:** 모바일 첫 화면에서 **탭 라벨 visible** (수동 1장)
- 블록 ≤3 · 탭 전환 후 Story·6축 visible
- (참고) 부록 F px 가이드

---

# Phase 2. Evidence pick 설득 · **1~2 PR**

### Task 2-1 — Pick 카드

- 항상: 도메인 · 제품 · 스웨그키 · **왜 추천**
- ranking 블록 shell · **스위치 only** · `e2e-pick-ranking-why`
- tradeoff **있을 때만**
- `<details>`: whyTraits · explanation
- 대안: 이름+링크

**Dev Gate:** tradeoff absent assert

---

# Phase 3. 카피·가공 · **2 PR**

### Task 3-1 — Why · Tradeoff · Highlights · Story 톤 · **1 PR**

- `formatEvidenceWhyLine` · `formatEvidenceTradeoff` · `formatBuildHighlights`
- Story tier 분기 테스트 (high / balanced / experimental)
- Overview 중복 제거

### Task 3-2 — Ranking Why · **1 PR**

**gap > threshold:**

```
1순위로 선택한 이유
✓ 선호하는 구분감과 가장 잘 맞아요
✓ 2순위보다 타이핑 감이 더 안정적이에요
```

**else:**

```
상위 후보가 매우 비슷해요
취향 차이에 따라 2순위도 충분히 좋은 선택일 수 있어요
```

- 구체 bullet ≤2 · gap 0.02 → fallback assert
- `EVIDENCE_RANKING_WHY` feature flag
- MVP **스위치 only** — 확장은 §Expansion Criteria

---

# Phase 4. 검증 · **1 PR**

- `PROJECT_CONTEXT.md` · `CHATGPT_FEEDBACK_BUNDLE.md`
- E2E + `evidence-tab-phase4-validation.md` (Guardrails · Non-goals 체크리스트)

---

## Success Metrics

### Primary (성공 신호)

| 지표 | 해석 |
|------|------|
| 저장률 | 이해·신뢰 ↑ |
| 스웨그키 클릭률 | 확신 ↑ |
| 저신뢰 → 정교화 후 재설문 감소 | Story 효과 |
| **Overview만 본 세션에서도 저장** | 공통 레이어 효과 |

### Secondary

- Evidence 스크롤 depth (과도한 깊이만 감소)
- 18축 표 / MetricGuide open rate (소수 OK)
- refine 링크 클릭 (저신뢰)

### Failure Signals (설계 실패 판단)

출시 후 **4~6주** 관측. 아래 **2개 이상** 지속 시 IA·카피 회고 (알고리즘 변경 아님):

| 신호 | 의미 |
|------|------|
| Evidence 탭 방문 후 **저장률 변화 없음·감소** | pick 설득 실패 |
| ranking why 도입 후 **대안 스웨그키만 증가·저장 정체** | 비교만 하고 확신 못 줌 |
| Confidence Story 배포 후 **저신뢰 재설문 비율 변화 없음** | Story가 신뢰 전달 실패 |
| 공통 레이어 확장 PR 후 **Overview-only 저장률 감소** | 레이어 비대화·탭 가림 |
| 정성: «30초 이해» **3/5 미만** 2회 연속 | 설명 레이어 전면 개선 |

> 체류 시간 감소는 단독 KPI·Failure Signal **아님**

### 정성

- «왜 1순위인지 30초 안에?» — 4/5 Yes
- «믿을 만한가?» (Overview-only) — 4/5 Yes

---

## ChatGPT에 넘길 때

```
/results v1.4 — IA 확정, 구현 착수
· UX 원칙 Guardrails · Expansion Criteria · Failure Signals · Non-goals

구현·카피·threshold 검토만. 구조 변경 제안은 범위 밖.
```

---

## 부록 A. 블록 → 계층 · Phase

( v1.3과 동일 — 생략 없이 유지 )

| 블록 | 계층 | Phase |
|------|------|-------|
| Confidence Story | 공통 | 1 |
| 고정 6축 + microcopy | 공통 | 1 |
| highlights | 공통/Hero | 1·3-1 |
| ranking why | Evidence | 2·3-2 |
| MetricGuide · 18축 표 | Evidence | 1 접힘 |
| tradeOffs | Evidence | 2·3-1 조건부 |

---

## 부록 B. 3계층 비교

| | 공통 | Overview | Evidence |
|--|------|----------|----------|
| 목적 | 신뢰·취향 | 행동 | pick 설득 |
| CTA | 정교화 링크만 | 저장·스웨그키 | 스웨그키( pick) |
| ranking why | — | — | gap 조건부 |

---

## 부록 C. ranking why — threshold (LOCKED)

| 도메인 | `scoreGapMin` | MVP ranking why |
|--------|---------------|-----------------|
| switch | **0.04** | ✅ |
| plate · case · keycap · layout · stabilizer | 0.04 | Expansion Criteria 충족 후 |

**판정:** `pick.score − alt[0].score ≥ 0.04` → ≤2 bullet · else fallback · runner-up 없음 → hidden

**Fixture:** `results-ranking-thresholds.ts` → `RANKING_WHY_FIXTURES`

---

## 부록 D. Confidence Story — tier 분기

| Tier | 조건 | bullet 톤 |
|------|------|-----------|
| high | confidence 높음 + gap 충분 | «더 잘 맞는 조합» |
| balanced | confidence 보통 또는 gap 작음 | «후보가 비슷» |
| low | `confidenceGuidance` | «정교화» 링크 |

**금지:** high tier인데 gap 작을 때 «1·2순위 차이 분명» (Story와 ranking why 모순)

---

## 부록 E. 관련 파일

| 파일 | 역할 |
|------|------|
| `recommendation-result-view.tsx` | Hero · Trust Layer |
| `results/results-trust-layer.tsx` | 공통 레이어 |
| `results/results-ranking-thresholds.ts` | gap |
| `results/results-text-utils.ts` | 가공 |

---

## 부록 F. Dev Gate 참고 (px — 내부용)

Phase 1 수동 체크 **참고치만**. 로드맵 성공/실패 판단에 **단독 사용 금지**.

| 뷰포트 | 참고 상한 |
|--------|-----------|
| 모바일 (~390px) | ~220–260px |
| 태블릿·데스크톱 | **UX 기준**(탭 노출) 우선 |

---

## UX 원칙 (Guardrails — 제품 철학)

> 몇 달 뒤 리팩터링해도 흔들리지 않는 기준. **PM·디자인 판단의 최상위.**

- [ ] 사용자가 **«왜 추천됐는지» 30초 안에 이해하지 못하면**, 기능 추가보다 **설명·카피를 먼저** 개선한다.
- [ ] **공통 신뢰 레이어는 신뢰만** 담당한다. 저장·구매 **행동 CTA는 넣지 않는다** (정교화 텍스트 링크 1줄 예외).
- [ ] **Evidence는 엔진을 설명하는 곳이 아니라 추천을 설득하는 곳**이다. audit·교과서는 `<details>` / `/debug`.
- [ ] **Overview는 짧게, Evidence는 설득** — Evidence를 Overview처럼만 만들지 않는다.
- [ ] **정직한 불확실성**이 억지 확신보다 낫다 (honest fallback · tier 분기).
- [ ] **이해·신뢰 proxy가 오르지 않으면** 레이아웃을 더 채우지 않고 §Failure Signals로 회고한다.

---

## 구현 가드레일 (Guardrails — Cursor·PR용)

> 이번 IA 붕괴 방지. **UX 원칙 아래** 적용.

- [ ] 공통 레이어 **독립 블록 ≤3** · 두 번째 Hero 금지
- [ ] Confidence Story **카드 1개** (동일 정보 중복 금지)
- [ ] Story bullet ≤4 · highlights ≤2 · ranking bullet ≤2
- [ ] tradeoff **억지 생성 금지** («주의점 없음» 포함)
- [ ] ranking why **gap 미달 시 구체 비교 bullet 금지**
- [ ] 18축 표 **기본 접힘** · pick 카드 일치도/페널티 반복 금지
- [ ] raw `highlights` / `tradeOff` / 엔진 버전 문자열 노출 금지
- [ ] Confidence · 6축 미니를 **Evidence 탭으로 되돌리지 않음**
- [ ] 고정 6축 → 동적 상위 N축 **회귀 금지**

### PR 리뷰 빠른 체크

1. 모바일 첫 화면 — **탭 라벨 보이는가?**
2. gap 0.02 fixture — fallback인가?
3. tradeoff 없는 pick — 주의 섹션 없는가?
4. Story tier — gap 작은데 «차이 분명» 아닌가?

---

## Non-goals (이번 리팩터링에서 하지 않는 것)

> Cursor·ChatGPT scope creep 방지. **예외는 별도 로드맵.**

- 추천 **알고리즘** · scoring 가중치 변경
- **Match Score** · `recommendationConfidence` **계산식** 변경
- **6축·18축 정의** · trait 모델 변경
- 백엔드 **`explainable.py` 모델·스키마** 대개편 (옵션 B 필드 추가는 Task 3-2 이후 별도 합의)
- **카탈로그** 구조 · Swagkey 연동 변경
- **설문** 문항·플로우 변경
- `recommendation-result-view` **전면 리라이트** (본 로드맵 IA 범위 밖 부분)
- **Compare UI** 복원 (제거 완료)
- 공통 레이어에 **저장·구매 CTA** 추가

---

*v1.4 Phase 0–4 **완료** (2026-07-10). 검증: `docs/evidence-tab-phase4-validation.md`*
