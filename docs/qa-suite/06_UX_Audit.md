# 06_UX_Audit.md — Cursor QA Master Suite · UX Audit Playbook

> **문서 등급:** ★★★★★ · 사용성 감사와 근거 기반 개선 매뉴얼
> **대상:** Next.js 14/15 App Router · React 18/19 · Tailwind · SaaS 제품
> **검사 대상:** 기능의 동작 여부가 아니라 **사용자가 목표를 달성할 수 있는가**
> **핵심 전제:** 취향은 근거가 아니다. 모든 지적에는 관찰 가능한 증거와 명명된 원칙이 있어야 한다.
> **독립성:** 이 문서는 `01_Core_QA.md` 없이도 단독으로 실행할 수 있다.
> **형식:** Cursor Agent가 그대로 실행하는 명령형 매뉴얼.

---

## 목차

1. [Agent 역할과 완료 조건](#1-agent-역할과-완료-조건)
2. [절대 원칙](#2-절대-원칙)
3. [Project Binding과 사용자 정의](#3-project-binding과-사용자-정의)
4. [실행 파이프라인과 Severity](#4-실행-파이프라인과-severity)
5. [평가 프레임워크](#5-평가-프레임워크)
6. [과업 흐름](#6-과업-흐름)
7. [정보 구조와 내비게이션](#7-정보-구조와-내비게이션)
8. [첫인상과 진입](#8-첫인상과-진입)
9. [온보딩과 빈 상태](#9-온보딩과-빈-상태)
10. [폼과 입력](#10-폼과-입력)
11. [피드백과 시스템 상태](#11-피드백과-시스템-상태)
12. [오류와 복구](#12-오류와-복구)
13. [마이크로카피와 콘텐츠](#13-마이크로카피와-콘텐츠)
14. [인지 부하와 정보 밀도](#14-인지-부하와-정보-밀도)
15. [신뢰와 투명성](#15-신뢰와-투명성)
16. [전환과 이탈](#16-전환과-이탈)
17. [제어권과 되돌리기](#17-제어권과-되돌리기)
18. [모바일 UX 특수성](#18-모바일-ux-특수성)
19. [접근성 관점의 사용성](#19-접근성-관점의-사용성)
20. [계측과 근거 수집](#20-계측과-근거-수집)
21. [벤치마크와 비교 감사](#21-벤치마크와-비교-감사)
22. [우선순위 결정](#22-우선순위-결정)
23. [Regression 절차](#23-regression-절차)
24. [Final Report](#24-final-report)
25. [부록 A — 감사 도구와 명령](#부록-a--감사-도구와-명령)
26. [부록 B — Agent 체크리스트](#부록-b--agent-체크리스트)

---

## 1. Agent 역할과 완료 조건

UX 감사는 다른 QA와 근본적으로 다르다. 기능 QA는 "명세대로 동작하는가"를 묻고 답이 참/거짓으로 나온다. UX 감사는 "사용자가 목표를 달성할 수 있는가, 그 과정이 합리적인가"를 묻고 답이 정도의 문제로 나온다.

이 차이 때문에 UX 감사는 **취향 논쟁으로 전락하기 쉽다.** "이 버튼이 파란색이면 좋겠다"는 감사 결과가 아니라 개인 선호다. 이 문서의 목적은 UX 판단을 검증 가능한 형태로 만드는 것이다.

모든 Finding은 세 가지를 갖춰야 한다.

```text
1. 관찰 — 무엇을 보았는가 (스크린샷, 측정값, 클릭 수, 소요 시간)
2. 원칙 — 어떤 휴리스틱을 위반하는가 (명명된 원칙 ID)
3. 결과 — 사용자에게 어떤 손해가 발생하는가 (과업 실패, 지연, 오류, 이탈)
```

셋 중 하나라도 없으면 그것은 의견이지 Finding이 아니다. 특히 3번이 없으면 "다르게 할 수도 있다"는 말일 뿐이다.

### 1.1 동시에 수행할 역할

- **UX Researcher:** 사용자와 과업을 정의하고, 실제 사용 데이터를 근거로 삼는다. 없으면 없다고 기록한다.
- **Usability Auditor:** 휴리스틱 기반으로 체계적으로 순회한다. 눈에 띄는 것만 지적하지 않는다.
- **Interaction Designer:** 문제의 원인을 상호작용 모델 수준에서 진단한다. 증상만 고치지 않는다.
- **Content Strategist:** 마이크로카피가 사용자의 언어인지, 다음 행동을 안내하는지 판단한다.
- **Conversion Analyst:** 이탈 지점을 식별하고 마찰의 원인을 구조적으로 설명한다.
- **Product Manager:** 발견을 영향도와 비용으로 우선순위화한다. 전부 고칠 수는 없다.

### 1.2 완료 조건

```text
[ ] P0 사용자와 P0 과업을 정의하고 문서화했다.
[ ] 각 P0 과업을 실제로 끝까지 수행하고 기록했다.
[ ] 과업별 클릭 수·화면 전환 수·소요 시간을 측정했다.
[ ] 휴리스틱 세트 전체를 각 핵심 화면에 적용했다.
[ ] 신규 사용자 관점(빈 상태, 온보딩)을 별도로 순회했다.
[ ] 오류·경계 상황을 의도적으로 유발하고 복구 가능성을 확인했다.
[ ] 모든 Finding에 관찰·원칙·결과 세 요소가 있다.
[ ] 모든 Finding에 스크린샷 또는 측정값 증거가 있다.
[ ] Severity를 빈도·영향·복구 가능성으로 산정했다.
[ ] 우선순위를 영향도와 구현 비용으로 정렬했다.
[ ] 데이터로 확인할 수 없는 항목을 ASSUMPTION으로 명시했다.
[ ] Final Report를 작성했다.
```

측정하지 않은 것을 측정했다고 쓰지 않는다. 실제 사용자 데이터가 없으면 `NO_DATA`로 기록하고, 추론임을 밝힌다.

---

## 2. 절대 원칙

우선순위 순서이며, 충돌 시 번호가 작은 쪽이 이긴다.

### UX-P1. 과업 완수가 최우선이다

아름다운 화면에서 목표를 달성하지 못하면 실패한 화면이다. 미적 개선보다 **막힌 흐름을 뚫는 것**이 항상 먼저다. 감사는 화면 단위가 아니라 과업 단위로 수행한다.

### UX-P2. 증거 없는 지적은 하지 않는다

"직관적이지 않다"는 관찰이 아니다. "5명 중 4명이 저장 버튼을 찾지 못했다", "이 과업에 11번의 클릭이 필요하다", "오류 메시지가 원인을 설명하지 않는다"가 관찰이다. 증거의 형태는 측정값, 스크린샷, 흐름 기록 중 하나다.

### UX-P3. 사용자의 언어로 말한다

`Error 422: Unprocessable Entity`는 시스템의 언어다. `이메일 주소 형식이 올바르지 않습니다`는 사용자의 언어다. 내부 용어(엔티티, 리소스, 워크스페이스 ID)가 화면에 노출되면 그것은 결함이다.

### UX-P4. 사용자를 기억에 의존하게 하지 않는다

이전 화면에서 본 값을 기억해 다음 화면에 입력하게 하는 설계는 실패한다. 필요한 정보는 필요한 순간에 화면에 있어야 한다. 인식이 회상보다 항상 쉽다.

### UX-P5. 시스템 상태를 항상 알려준다

버튼을 눌렀는데 아무 반응이 없으면 사용자는 다시 누른다. 그 결과가 중복 결제라면 심각한 결함이다. 100ms 이내에 반응, 1초 이내에 진행 표시, 10초 이상이면 진척률과 예상 시간이 필요하다.

### UX-P6. 되돌릴 수 있게 만든다

확인 대화상자보다 실행 취소가 낫다. 확인은 사용자를 지치게 하고 결국 읽지 않고 누르게 만든다. 되돌릴 수 없는 작업(영구 삭제, 결제)에만 확인을 쓰고, 그 경우 결과를 명확히 서술한다.

### UX-P7. 일관성이 창의성보다 중요하다

같은 개념은 같은 단어로, 같은 행동은 같은 위치에서. 화면마다 저장 버튼 위치가 다르면 매번 찾아야 한다. 플랫폼 관습(뒤로 가기, 스와이프, Esc)을 깨는 것은 거의 항상 손해다.

### UX-P8. 기본값이 설계다

대부분의 사용자는 기본값을 바꾸지 않는다. 따라서 기본값은 "가장 많은 사용자에게 가장 좋은 선택"이어야 한다. 설정 화면을 늘리는 것은 결정을 사용자에게 떠넘기는 것이다.

### UX-P9. 빈 상태가 첫 경험이다

모든 사용자는 데이터가 없는 상태에서 시작한다. 그런데 대부분의 설계는 데이터가 가득한 상태를 기준으로 이뤄진다. 빈 화면에 "데이터가 없습니다"만 있으면 사용자는 다음에 무엇을 할지 모른다.

### UX-P10. 마찰은 의도적일 때만 정당하다

가입 폼의 필드 하나를 늘릴 때마다 전환율이 떨어진다. 그 필드가 정말 지금 필요한가를 물어야 한다. 반대로 삭제 확인처럼 **의도적 마찰**이 필요한 곳도 있다. 문제는 의도 없이 생긴 마찰이다.

### UX-P11. 접근성은 UX의 부분집합이다

키보드로 조작할 수 없는 기능은 일부 사용자에게 존재하지 않는 기능이다. 대비가 낮은 텍스트는 밝은 곳에서 모두에게 읽히지 않는다. 접근성 결함은 접근성 문제이면서 동시에 사용성 문제다.

### UX-P12. 리포트는 채팅에 남기고 산출물은 커밋하지 않는다

UX 감사 리포트 파일을 저장소에 만들지 않는다. 스크린샷·녹화·측정 데이터는 `tmp/qa/ux/<날짜>/`에 두고 커밋하지 않는다. 프로젝트 룰이 잠근 파일(Freeze List)은 수정하지 않는다.

---

## 3. Project Binding과 사용자 정의

UX 감사는 "누가, 무엇을 하려는가"를 모르면 시작할 수 없다. 아래 블록을 실측과 문서 조사로 채운다.

```yaml
ux_audit_binding:
  product:
    name:
    category:                 # B2B SaaS / B2C / 내부 도구 / 마켓플레이스
    business_model:           # 구독 / 사용량 / 광고 / 프리미엄
    maturity:                 # MVP / 성장기 / 성숙기

  primary_users:
    - persona:
      role:                   # 역할/직무
      expertise:              # 초보 / 중급 / 전문가
      frequency:              # 매일 / 주간 / 월간 / 1회성
      context:                # 데스크톱 업무 / 이동 중 / 현장
      motivation:             # 왜 이 제품을 쓰는가
      alternative:            # 이 제품이 없으면 무엇을 쓰는가

  p0_tasks:                   # 실패하면 제품이 무의미해지는 과업
    - task:
      entry_point:
      success_criteria:       # 무엇이 보이면 성공인가
      current_steps:          # 측정값
      current_duration:       # 측정값
      frequency:              # 사용자당 발생 빈도

  p1_tasks: []                # 중요하지만 우회 가능

  key_screens: []             # 라우트 + 목적

  available_data:
    analytics:                # GA4 / Amplitude / PostHog / 없음
    session_replay:           # Hotjar / Clarity / 없음
    funnel_data:              # 있음 / 없음
    support_tickets:          # 접근 가능 / 불가
    user_interviews:          # 있음 / 없음

  constraints:
    brand_guideline:
    legal_required: []        # 약관 동의, 개인정보 고지 등
    technical: []

  freeze_list: []
```

### 3.1 사용자와 과업을 알 수 없을 때

대부분의 실무 상황에서 페르소나 문서는 없거나 오래되었다. 그럴 때는 제품 자체에서 역추론한다.

```bash
# 1. 라우트 구조에서 기능 영역 파악
fd "page.tsx" app src/app | sed 's|.*/app||; s|/page.tsx||' | sort

# 2. 내비게이션에서 우선순위 파악 (앞에 있을수록 중요)
rg -n "href=" src/components/layout src/components/nav* --glob "*.tsx" | head -30

# 3. 랜딩 페이지 카피에서 가치 제안 추출
rg -n "h1|h2|헤드라인|hero" src/app/page.tsx src/components/**/hero* --glob "*.tsx" -A5

# 4. 요금제에서 핵심 기능 파악 (돈을 받는 것이 핵심 가치)
rg -n "plan|pricing|feature" src/app/pricing --glob "*.tsx" -A10 | head -60

# 5. 온보딩 흐름에서 의도된 첫 과업 파악
rg -n "onboarding|welcome|getting-started|first" src app --glob "*.tsx" | head -20

# 6. 이메일/알림 템플릿에서 재방문 유도 지점 파악
fd "email|notification" src lib --glob "*.tsx" --glob "*.ts" | head
```

역추론한 내용은 반드시 **ASSUMPTION으로 표시**한다.

```markdown
## 사용자 정의 (역추론 — 검증 필요)

**ASSUMPTION-1:** 주 사용자는 5~50인 규모 팀의 관리자로 추정한다.
근거: 요금제가 시트 단위이고 최소 5시트, 멤버 권한이 3단계로 세분화됨.
검증 방법: 실제 계정의 평균 시트 수 조회, 영업팀 확인.

**ASSUMPTION-2:** P0 과업은 "리포트 생성 후 공유"로 추정한다.
근거: 내비게이션 첫 항목, 랜딩 히어로 카피의 핵심, 무료 플랜 제한 항목.
검증 방법: 분석 도구에서 기능별 사용 빈도 확인.
```

가정을 명시하면 리포트를 받는 사람이 틀린 부분을 바로잡을 수 있다. 가정을 사실처럼 쓰면 잘못된 우선순위로 이어진다.

### 3.2 과업 측정 기준선

감사 시작 전 P0 과업을 직접 수행하며 아래를 기록한다. 이것이 모든 Finding의 기준선이 된다.

```markdown
| 과업 | 진입점 | 클릭 수 | 화면 전환 | 입력 필드 | 소요 시간 | 막힌 지점 | 완수 |
|------|--------|---------|-----------|-----------|-----------|-----------|------|
| 계정 생성 후 첫 리포트 발행 | `/` | 23 | 7 | 11 | 6분 40초 | 팀 초대 강제 | 예 |
| 멤버 초대 | `/dashboard` | 6 | 2 | 1 | 45초 | — | 예 |
| 구독 취소 | `/settings` | 9 | 4 | 2 | 3분 10초 | 취소 링크 미발견 | 아니오 |
```

"막힌 지점"과 "완수" 열이 핵심이다. 완수하지 못한 과업이 있으면 그것이 최우선 Finding이다.

---

## 4. 실행 파이프라인과 Severity

```text
1. DEFINE
   사용자와 P0 과업을 정의한다. 없으면 역추론하고 ASSUMPTION으로 표시한다.

2. BASELINE WALKTHROUGH
   각 P0 과업을 신규 사용자 관점에서 끝까지 수행하고 측정한다.
   ★ 이 단계 없이 화면만 보는 감사는 유효하지 않다.

3. HEURISTIC SWEEP
   휴리스틱 세트를 각 핵심 화면에 체계적으로 적용한다.

4. EDGE WALKTHROUGH
   빈 상태, 오류, 권한 부족, 느린 네트워크, 대량 데이터에서 재순회한다.

5. CONTENT AUDIT
   마이크로카피, 라벨, 오류 메시지, 빈 상태 문구를 수집해 검토한다.

6. MEASURE
   클릭 수, 전환 수, 소요 시간, 스크롤 깊이, 폼 필드 수를 계측한다.

7. DATA CROSS-CHECK
   분석 데이터·세션 리플레이·지원 문의가 있으면 대조한다. 없으면 NO_DATA.

8. SEVERITY
   빈도 × 영향 × 복구 가능성으로 등급을 산정한다.

9. ROOT CAUSE
   증상이 아니라 상호작용 모델 수준의 원인을 지목한다.

10. PRIORITIZE
    영향도와 구현 비용으로 정렬한다.

11. RECOMMEND
    각 Finding에 구체적 개선안과 검증 방법을 붙인다.

12. REPORT
    증거와 함께 보고한다. 수정은 승인 후에 한다.
```

### 4.1 Severity 산정

UX Severity는 세 요소의 조합으로 정한다. 인상으로 정하지 않는다.

```text
빈도(Frequency)   — 얼마나 많은 사용자가, 얼마나 자주 마주치는가
영향(Impact)      — 마주쳤을 때 얼마나 방해받는가
지속성(Persistence) — 학습으로 극복되는가, 매번 반복되는가
```

| 등급 | 기준 |
|------|------|
| **S0 Blocker** | P0 과업을 완수할 수 없다. 데이터 손실이 발생한다. 사용자가 의도하지 않은 과금이 발생한다. |
| **S1 Critical** | P0 과업이 심각하게 지연되거나 다수가 실패한다. 되돌릴 수 없는 실수를 유발한다. 신뢰를 훼손한다. |
| **S2 Major** | 과업은 완수되지만 불필요한 마찰이 크다. 자주 발생하고 학습으로 극복되지 않는다. 오해를 유발한다. |
| **S3 Minor** | 마찰이 있으나 우회 가능하고, 학습으로 극복된다. 빈도가 낮다. |
| **S4 Nit** | 다듬으면 좋은 수준. 일관성, 미세한 카피. |

**상향 규칙**

```text
- 결제, 데이터 삭제, 권한 변경 경로에서 발생 → 한 단계 상향
- 신규 사용자가 첫 세션에서 마주침 → 한 단계 상향
- 되돌릴 수 없음 → 한 단계 상향
- 오류를 유발하고 오류 메시지가 원인을 설명하지 않음 → 한 단계 상향
```

**하향 규칙**

```text
- 명확한 대안 경로가 화면에 보임 → 한 단계 하향
- 전문가 사용자 전용 고급 기능 → 한 단계 하향 (초보 대상이면 적용 안 함)
```

**하향 금지:** "경쟁사도 그렇다", "원래 그랬다", "개발이 어렵다"는 Severity 조정 근거가 아니다. 구현 비용은 우선순위 결정(§22)에서 다루지 심각도에 반영하지 않는다.

### 4.2 Severity 판정 예시

```markdown
### 구독 취소 경로를 찾을 수 없다

- 빈도: 취소를 시도하는 모든 사용자 (전체의 3~5% 추정, NO_DATA)
- 영향: 과업 완수 불가. 지원 문의로 이어짐.
- 지속성: 매번 반복. 학습 불가(링크 자체가 없음).
- 상향: 결제 경로 → 한 단계
- **판정: S0**

근거 관찰: 설정 화면 4개 탭을 모두 열고 9번 클릭했으나 취소 링크 미발견.
`/settings/billing`에 "플랜 변경"만 있고 취소 항목 없음.
스크린샷: tmp/qa/ux/2026-07-30/cancel-not-found-01..04.png
```

---

## 5. 평가 프레임워크

### 5.1 휴리스틱 세트

Nielsen의 10가지 사용성 휴리스틱을 기반으로 하되, SaaS 제품에 필요한 4가지를 추가한다. 각 항목에 ID를 부여해 Finding에서 참조한다.

| ID | 휴리스틱 | 핵심 질문 |
|----|----------|-----------|
| **H1** | 시스템 상태 가시성 | 지금 무슨 일이 일어나는지 사용자가 아는가? |
| **H2** | 현실 세계와의 일치 | 사용자의 언어와 개념을 쓰는가? |
| **H3** | 사용자 제어와 자유 | 실수를 되돌리고 빠져나올 수 있는가? |
| **H4** | 일관성과 표준 | 같은 것을 같은 방식으로 표현하는가? |
| **H5** | 오류 예방 | 실수가 일어나기 전에 막는가? |
| **H6** | 회상보다 인식 | 기억에 의존하지 않게 하는가? |
| **H7** | 유연성과 효율성 | 숙련자가 빠르게 갈 수 있는가? |
| **H8** | 미학과 최소 설계 | 불필요한 정보가 중요한 정보를 가리지 않는가? |
| **H9** | 오류 인식·진단·복구 | 무엇이 잘못됐고 어떻게 고치는지 알려주는가? |
| **H10** | 도움말과 문서 | 필요한 순간에 도움을 받을 수 있는가? |
| **H11** | 첫 사용 가능성 | 데이터가 없는 상태에서 시작할 수 있는가? |
| **H12** | 신뢰와 투명성 | 무엇이 일어날지 사전에 알 수 있는가? |
| **H13** | 기본값의 적절성 | 아무것도 바꾸지 않아도 좋은 결과가 나오는가? |
| **H14** | 접근 경로의 평등성 | 마우스 없이도 모든 기능에 도달하는가? |

### 5.2 감사 실행 방식

휴리스틱을 화면마다 기계적으로 대입하면 표면적 지적만 나온다. 두 방향을 결합한다.

**과업 기반(Task-based)** — 사용자가 되어 목표를 향해 이동하며 마찰을 기록한다. 흐름 문제와 정보 구조 문제를 잡는다.

**화면 기반(Screen-based)** — 각 화면에 휴리스틱 14개를 적용한다. 개별 화면의 결함을 빠짐없이 잡는다.

둘 다 필요하다. 과업 기반만 하면 자주 쓰지 않는 화면을 놓치고, 화면 기반만 하면 화면 사이의 연결 문제를 놓친다.

### 5.3 관찰 기록 형식

감사 중 관찰은 즉시 기록한다. 나중에 정리하려 하면 맥락을 잃는다.

```markdown
### OBS-<번호> — <한 줄 요약>

- **화면:** `/settings/billing`
- **과업:** 구독 취소
- **단계:** 4/9
- **관찰:** 결제 탭에 "플랜 변경" 버튼만 있고 취소 관련 항목이 없다.
  하단 FAQ 링크를 눌러야 "취소는 고객센터로 문의"라는 안내가 나온다.
- **증거:** `tmp/qa/ux/2026-07-30/obs-012-billing-tab.png`
- **휴리스틱:** H3(제어와 자유), H12(투명성)
- **사용자 결과:** 자기 계정의 결제를 스스로 중단할 수 없다. 지원 문의 발생.
- **초기 Severity:** S0 (결제 경로 상향 적용)
```

`OBS-` 번호를 부여하면 리포트에서 Finding으로 승격할 때 추적이 가능하다. 모든 관찰이 Finding이 되지는 않는다.

### 5.4 감사 환경 표준화

관찰 조건이 다르면 결과를 비교할 수 없다.

```text
[ ] 프로덕션 빌드 (개발 모드의 경고 오버레이 제외)
[ ] 캐시·쿠키·로컬스토리지 초기화 (신규 사용자 재현)
[ ] 실제 사용자와 같은 권한 계정 (관리자 계정으로만 보지 않는다)
[ ] 데스크톱 1440×900 + 모바일 390×844 최소 2종
[ ] 축소 모션 해제 (실제 애니메이션 확인)
[ ] 느린 네트워크 조건 1회 순회 (Fast 3G)
[ ] 실제와 유사한 데이터 양 (빈 상태 / 소량 / 대량 3종)
```

```ts
// tests/ux/audit-context.ts — 감사 환경을 고정한다
import { chromium, devices } from '@playwright/test';

export async function createAuditContext(opts: {
  device?: 'desktop' | 'mobile';
  network?: 'fast' | 'slow3g';
  auth?: string;
}) {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });

  const context = await browser.newContext({
    ...(opts.device === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }),
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    storageState: opts.auth,
    recordVideo: { dir: 'tmp/qa/ux/videos' },
  });

  const page = await context.newPage();

  if (opts.network === 'slow3g') {
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }

  return { browser, context, page };
}
```

`slowMo: 200`으로 실행하면 사람이 관찰할 수 있는 속도로 진행되어, 자동화하면서도 눈으로 확인할 수 있다.

---

## 6. 과업 흐름

과업 흐름 감사는 UX 감사의 중심이다. 개별 화면이 아무리 좋아도 흐름이 끊기면 제품은 실패한다.

### UX-FLOW-01 — 과업 완수 가능성

**WHY**
가장 근본적인 질문이다. 사용자가 목표를 달성할 수 있는가. 완수할 수 없는 과업이 있다면 다른 모든 개선은 부차적이다. 그런데 이 확인이 의외로 자주 생략된다. 개발자와 디자이너는 경로를 알고 있어서 막힘을 인지하지 못한다.

**DETECT**

각 P0 과업을 **아무 사전 지식 없이** 수행한다. 코드를 읽거나 라우트를 직접 입력하지 않고, 화면에 보이는 것만으로 이동한다.

```bash
# 감사 전 사전 지식 차단: 진입점만 확인하고 코드는 보지 않는다
echo "진입점: https://app.example.com/"
```

```ts
// tests/ux/task-walkthrough.spec.ts — 과업 수행을 기록하며 측정
import { test, expect } from '@playwright/test';

test('P0-1: 신규 가입 후 첫 리포트 발행', async ({ page }, testInfo) => {
  const trace: { step: number; action: string; url: string; ms: number }[] = [];
  const start = Date.now();
  let step = 0;

  const record = async (action: string) => {
    trace.push({ step: ++step, action, url: page.url(), ms: Date.now() - start });
    await page.screenshot({ path: `tmp/qa/ux/p0-1/${String(step).padStart(2, '0')}.png`, fullPage: true });
  };

  await page.goto('/');
  await record('랜딩 도착');

  await page.getByRole('link', { name: /시작하기|가입/ }).first().click();
  await record('가입 진입');

  // … 과업 수행 …

  await testInfo.attach('task-trace', {
    body: JSON.stringify({ totalMs: Date.now() - start, steps: trace }, null, 2),
    contentType: 'application/json',
  });

  console.table(trace);
});
```

**진단**

막힘이 발생하면 그 지점에서 멈추고 아래를 기록한다.

```text
- 무엇을 하려 했는가
- 화면에서 무엇을 찾았는가
- 왜 찾지 못했는가 (없음 / 다른 이름 / 다른 위치 / 시각적으로 묻힘)
- 결국 어떻게 해결했는가 (검색 / URL 직접 입력 / 포기)
```

"URL을 직접 입력해 해결"은 곧 **일반 사용자는 해결할 수 없다**는 뜻이다.

**PASS / FAIL**

- PASS: 모든 P0 과업을 사전 지식 없이 완수한다. 각 단계에서 다음 행동이 명확하다.
- FAIL: 완수 불가(**S0**), 우회 경로로만 완수(**S1**), 완수했으나 30초 이상 헤맴(S2).

**FIX**

막힘의 원인은 대개 넷 중 하나다.

**1. 진입점이 없다**

```tsx
// ❌ 구독 취소 기능이 API에는 있는데 UI에 노출되지 않음
// app/settings/billing/page.tsx
<PlanCard plan={plan} />
<Button>플랜 변경</Button>
```

```tsx
// ✅ 명시적 진입점을 제공한다
<PlanCard plan={plan} />
<div className="flex gap-3">
  <Button>플랜 변경</Button>
  <Button variant="ghost" asChild>
    <Link href="/settings/billing/cancel">구독 취소</Link>
  </Button>
</div>
```

취소 경로를 숨기는 것은 단기 지표를 지키고 신뢰를 잃는 거래다. 규제 관점에서도 문제가 될 수 있다(일부 관할권에서 취소를 가입만큼 쉽게 만들 것을 요구한다).

**2. 이름이 사용자의 언어가 아니다**

```tsx
// ❌ 내부 개념이 노출됨
<Link href="/workspaces">워크스페이스 엔티티 관리</Link>

// ✅ 사용자가 쓰는 말로
<Link href="/workspaces">팀 관리</Link>
```

**3. 위치가 예상 밖이다**

```text
❌ 프로필 사진 변경 → 설정 > 일반 > 고급 > 계정 > 프로필
✅ 프로필 사진 변경 → 헤더의 아바타 클릭 → 프로필 편집
```

사용자는 **객체를 직접 조작**하려 한다. 아바타를 바꾸려면 아바타를 누른다. 메뉴 계층을 탐색하지 않는다.

**4. 시각적으로 묻혔다**

```tsx
// ❌ 주 행동이 보조 행동과 구분되지 않음
<Button variant="ghost">저장</Button>
<Button variant="ghost">취소</Button>

// ✅ 시각적 위계로 주 행동을 명시
<Button variant="default">저장</Button>
<Button variant="ghost">취소</Button>
```

**REGRESSION**

```ts
// P0 과업이 UI만으로 완수 가능한지 상시 검증
test('구독 취소 경로가 UI에 존재한다', async ({ page }) => {
  await page.goto('/settings');

  // URL 직접 입력 없이 링크를 따라 도달할 수 있는가
  const billingLink = page.getByRole('link', { name: /결제|구독|요금/ });
  await expect(billingLink, '설정에서 결제 영역 진입점 없음').toBeVisible();
  await billingLink.click();

  const cancelLink = page.getByRole('link', { name: /취소|해지/ });
  await expect(cancelLink, '결제 화면에 취소 진입점 없음').toBeVisible();
});
```

---

### UX-FLOW-02 — 단계 수와 마찰

**WHY**
같은 목표를 3단계로 달성할 수 있는데 9단계를 요구하면, 각 단계마다 이탈이 발생한다. 단계가 하나 늘 때마다 완료율이 떨어진다는 것은 널리 관찰되는 현상이다. 다만 단계를 무조건 줄이는 것이 답은 아니다. 한 화면에 20개 필드를 몰아넣으면 압도된다.

**DETECT**

```ts
// tests/ux/step-count.spec.ts
test('과업별 단계 수 측정', async ({ page }) => {
  const metrics = { clicks: 0, navigations: 0, inputs: 0, scrolls: 0 };

  page.on('framenavigated', f => { if (f === page.mainFrame()) metrics.navigations++; });

  await page.exposeFunction('__uxTrack', (type: string) => {
    if (type === 'click') metrics.clicks++;
    if (type === 'input') metrics.inputs++;
    if (type === 'scroll') metrics.scrolls++;
  });

  await page.addInitScript(() => {
    document.addEventListener('click', () => (window as any).__uxTrack?.('click'), true);
    document.addEventListener('input', () => (window as any).__uxTrack?.('input'), true);
    let scrollTimer: any;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => (window as any).__uxTrack?.('scroll'), 200);
    }, true);
  });

  // … 과업 수행 …

  console.log(metrics);
});
```

```bash
# 폼 필드 수 정적 분석
rg -c "<Input|<Select|<Textarea|<Checkbox|<RadioGroup" src/app/**/page.tsx | sort -t: -k2 -rn | head

# 다단계 위저드 탐지
rg -n "step|wizard|stage" src --glob "*.tsx" | rg -i "useState|currentStep" | head
```

**진단**

각 단계에 대해 묻는다.

```text
[ ] 이 단계가 없으면 무슨 일이 일어나는가?
[ ] 이 정보를 지금 받아야 하는가, 나중에 받아도 되는가?
[ ] 이 정보를 시스템이 알아낼 수는 없는가?
[ ] 이 단계를 다음/이전 단계와 합칠 수 있는가?
[ ] 기본값으로 대체할 수 있는가?
```

**PASS / FAIL**

- PASS: 각 단계가 필수적이거나, 인지 부하 분산을 위해 의도적으로 분리되었다. 진행 상황이 표시된다.
- FAIL: 불필요한 단계로 이탈 유발(S2), P0 과업이 10단계 초과(S2), 진행 표시 없는 다단계(S2).

**FIX**

**지연 수집(Progressive Disclosure)**

```tsx
// ❌ 가입 시 모든 정보를 요구 — 전환율이 크게 떨어진다
<form>
  <Input name="email" label="이메일" required />
  <Input name="password" label="비밀번호" required />
  <Input name="name" label="이름" required />
  <Input name="company" label="회사명" required />
  <Input name="jobTitle" label="직책" required />
  <Input name="phone" label="전화번호" required />
  <Select name="teamSize" label="팀 규모" required />
  <Select name="industry" label="업종" required />
  <Select name="referral" label="유입 경로" required />
</form>
```

```tsx
// ✅ 가입에 필요한 최소한만 받고, 나머지는 맥락이 생긴 뒤에
// 1단계: 가입
<form>
  <Input name="email" label="이메일" required autoComplete="email" />
  <Input name="password" label="비밀번호" required autoComplete="new-password" />
  <Button type="submit">계정 만들기</Button>
  <p className="text-sm text-muted-foreground">
    이름과 팀 정보는 나중에 설정할 수 있습니다.
  </p>
</form>
```

```tsx
// 2단계: 첫 사용 시점에 맥락과 함께 (건너뛰기 가능)
<Card>
  <CardHeader>
    <CardTitle>팀 이름을 정해주세요</CardTitle>
    <CardDescription>
      팀원을 초대할 때 표시됩니다. 나중에 바꿀 수 있습니다.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Input name="teamName" defaultValue={suggestedFromEmail} />
  </CardContent>
  <CardFooter className="justify-between">
    <Button variant="ghost" onClick={skip}>나중에 하기</Button>
    <Button onClick={save}>계속</Button>
  </CardFooter>
</Card>
```

`defaultValue={suggestedFromEmail}`처럼 **시스템이 추론할 수 있는 값은 미리 채운다.** 이메일이 `kim@acme.com`이면 팀 이름 기본값은 `Acme`가 합리적이다.

**시스템이 알아낼 수 있는 것은 묻지 않는다**

```tsx
// ❌ 사용자에게 묻는다
<Select name="timezone" label="시간대" required>
  {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
</Select>

// ✅ 감지하고 확인만 받는다
const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

<div className="flex items-center justify-between rounded-lg border p-3">
  <div>
    <p className="text-sm font-medium">시간대</p>
    <p className="text-sm text-muted-foreground">{formatTimezone(detected)}</p>
  </div>
  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>변경</Button>
</div>
```

**단계 병합 판단**

```text
합쳐야 할 때: 각 단계에 필드가 1~2개뿐이고 논리적으로 한 묶음
나눠야 할 때: 한 화면에 필드가 8개를 넘거나, 성격이 다른 정보가 섞임
```

**REGRESSION**

```ts
test('가입 폼 필드 수가 예산을 넘지 않는다', async ({ page }) => {
  await page.goto('/auth/signup');

  const required = await page.locator('input[required], select[required]').count();
  expect(required, `가입 필수 필드 ${required}개 — 마찰 증가`).toBeLessThanOrEqual(3);
});
```

---

### UX-FLOW-03 — 흐름 중단과 복귀

**WHY**
사용자는 흐름 도중에 이탈한다. 전화가 오고, 다른 탭을 보고, 브라우저를 닫는다. 돌아왔을 때 처음부터 다시 해야 한다면, 특히 긴 폼을 작성 중이었다면 그대로 포기한다.

**DETECT**

```bash
# 임시 저장 / 복구 로직 탐지
rg -n "localStorage|sessionStorage|draft|autosave|beforeunload" src --glob "*.tsx" | head -20
rg -n "useFormPersist|react-hook-form.*persist" src | head

# 이탈 경고
rg -n "beforeunload|onbeforeunload|useBeforeUnload" src | head
```

**진단**

각 다단계 흐름에서 실제로 시도한다.

```ts
test('폼 작성 중 이탈 후 복귀', async ({ page, context }) => {
  await page.goto('/reports/new');
  await page.getByLabel('제목').fill('분기 매출 분석');
  await page.getByLabel('설명').fill('2026년 2분기 실적 요약과 다음 분기 전망');
  await page.getByLabel('대상 기간').selectOption('2026-Q2');

  // 사용자가 실수로 뒤로 감
  await page.goBack();
  await page.goForward();

  // 입력이 남아 있는가
  await expect(page.getByLabel('제목')).toHaveValue('분기 매출 분석');
});

test('탭을 닫았다 다시 열기', async ({ page, context }) => {
  await page.goto('/reports/new');
  await page.getByLabel('제목').fill('분기 매출 분석');

  await page.close();
  const newPage = await context.newPage();
  await newPage.goto('/reports/new');

  await expect(newPage.getByLabel('제목')).toHaveValue('분기 매출 분석');
});
```

**PASS / FAIL**

- PASS: 긴 폼과 다단계 흐름에서 입력이 보존된다. 되돌아왔을 때 이어서 진행할 수 있다. 저장되지 않은 변경이 있으면 이탈 시 경고한다.
- FAIL: 입력 전체 유실(**S1** — 사용자가 작업을 잃음), 뒤로 가기로 유실(S2), 경고 없이 유실(S2).

**FIX**

```tsx
// ✅ 로컬 임시 저장 — 서버 저장 전 안전망
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const DRAFT_KEY = 'report-draft-v1';

export function ReportForm({ onSubmit }: Props) {
  const form = useForm<ReportInput>({
    defaultValues: () => {
      if (typeof window === 'undefined') return DEFAULTS;
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
      } catch {
        return DEFAULTS;
      }
    },
  });

  // 입력 변경 시 임시 저장 (디바운스)
  useEffect(() => {
    const sub = form.watch(values => {
      const id = setTimeout(() => {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(values)); } catch {}
      }, 500);
      return () => clearTimeout(id);
    });
    return () => sub.unsubscribe();
  }, [form]);

  const handleSubmit = form.handleSubmit(async values => {
    await onSubmit(values);
    localStorage.removeItem(DRAFT_KEY);   // 성공 시에만 제거
  });

  return <form onSubmit={handleSubmit}>{/* … */}</form>;
}
```

**복구 사실을 알려야 한다.** 조용히 복구하면 사용자는 이전 내용이 왜 있는지 몰라 혼란스러워한다.

```tsx
// ✅ 복구 안내와 취소 수단
{hasDraft && (
  <Alert className="mb-4">
    <AlertTitle>작성 중이던 내용을 불러왔습니다</AlertTitle>
    <AlertDescription className="flex items-center justify-between gap-4">
      <span>{formatRelative(draftSavedAt)}에 저장된 내용입니다.</span>
      <Button variant="outline" size="sm" onClick={discardDraft}>
        새로 시작
      </Button>
    </AlertDescription>
  </Alert>
)}
```

```tsx
// ✅ 저장되지 않은 변경이 있을 때 이탈 경고
'use client';

export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';   // 브라우저 기본 문구가 표시된다
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

`beforeunload`는 브라우저 탭 닫기만 막는다. Next.js 앱 내부 이동은 별도 처리가 필요하다.

```tsx
// ✅ 앱 내부 이동 차단
'use client';

import { useRouter } from 'next/navigation';

export function useNavigationGuard(isDirty: boolean, message: string) {
  const router = useRouter();

  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link || link.target === '_blank' || link.origin !== location.origin) return;

      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isDirty, message, router]);
}
```

`window.confirm`은 이상적이지 않다. 커스텀 다이얼로그로 "저장하고 나가기 / 저장하지 않고 나가기 / 취소" 세 선택지를 주는 편이 낫다. 두 선택지만 주면 사용자는 작업을 잃거나 갇힌다.

**REGRESSION**

```ts
test('긴 폼에서 뒤로 가기 후 입력이 유지된다', async ({ page }) => {
  await page.goto('/reports/new');
  await page.getByLabel('제목').fill('테스트 리포트');
  await page.goBack();
  await page.goForward();
  await expect(page.getByLabel('제목')).toHaveValue('테스트 리포트');
});
```

---

### UX-FLOW-04 — 상태 전이의 명확성

**WHY**
사용자가 어떤 행동을 했을 때 시스템이 어떤 상태로 바뀌었는지 알 수 없으면, 다음에 무엇을 할지 판단할 수 없다. 특히 "저장했는데 발행은 안 된 상태", "초대했는데 아직 수락 전인 상태" 같은 중간 상태가 흐릿하면 혼란이 생긴다.

**DETECT**

```bash
# 상태 값 정의 탐색
rg -n "status|state:|enum.*Status" src/types src/lib --glob "*.ts" | head -20
rg -o "'(draft|published|pending|active|archived|expired|cancelled)'" src -r '$1' | sort | uniq -c

# UI에서 상태를 표시하는가
rg -n "<Badge|StatusBadge|status" src/components --glob "*.tsx" | head -20
```

**진단**

각 객체(리포트, 멤버, 구독)의 가능한 상태를 나열하고, 각 상태가 UI에 어떻게 표현되는지 표로 만든다.

```markdown
| 객체 | 상태 | UI 표현 | 다음 행동 안내 | 판정 |
|------|------|---------|----------------|------|
| 리포트 | draft | "임시저장" 배지 | "발행하기" 버튼 | OK |
| 리포트 | published | 배지 없음 | — | **구분 불가** |
| 멤버 | invited | 회색 행 | 없음 | **재발송 불가** |
| 멤버 | active | 일반 행 | — | OK |
| 구독 | past_due | 표시 없음 | 없음 | **심각** |
```

"표시 없음"이 있으면 사용자가 그 상태를 인지할 수 없다는 뜻이다.

**PASS / FAIL**

- PASS: 모든 유의미한 상태가 시각적으로 구분되고, 각 상태에서 가능한 다음 행동이 제시된다.
- FAIL: 결제 실패 등 중요 상태 미표시(**S1**), 중간 상태 구분 불가(S2), 상태는 보이나 다음 행동 안내 없음(S2).

**FIX**

```tsx
// ❌ 상태를 색으로만 구분 — 색각 이상 사용자는 알 수 없고, 의미도 불명확
<tr className={member.status === 'invited' ? 'text-gray-400' : ''}>
  <td>{member.email}</td>
</tr>
```

```tsx
// ✅ 상태를 명시하고 다음 행동을 제공한다
const STATUS_CONFIG = {
  invited: {
    label: '초대됨',
    description: '아직 수락하지 않았습니다',
    variant: 'outline' as const,
    actions: ['resend', 'revoke'],
  },
  active: {
    label: '활성',
    description: null,
    variant: 'secondary' as const,
    actions: ['changeRole', 'remove'],
  },
  suspended: {
    label: '일시 중지',
    description: '로그인할 수 없습니다',
    variant: 'destructive' as const,
    actions: ['reactivate', 'remove'],
  },
} satisfies Record<MemberStatus, StatusConfig>;

function MemberRow({ member }: { member: Member }) {
  const config = STATUS_CONFIG[member.status];

  return (
    <tr>
      <td>{member.email}</td>
      <td>
        <Badge variant={config.variant}>{config.label}</Badge>
        {config.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{config.description}</p>
        )}
      </td>
      <td>
        {config.actions.includes('resend') && (
          <Button variant="ghost" size="sm" onClick={() => resend(member.id)}>
            초대 재발송
          </Button>
        )}
        {/* … */}
      </td>
    </tr>
  );
}
```

배지 색상만으로 구분하지 않고 **텍스트 라벨**을 함께 쓰는 것이 핵심이다. 색은 보조 신호여야 한다.

**중요 상태는 눈에 띄는 위치에**

```tsx
// ✅ 결제 실패처럼 조치가 시급한 상태는 전역 배너로
{subscription.status === 'past_due' && (
  <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>결제에 실패했습니다</AlertTitle>
    <AlertDescription className="flex flex-wrap items-center gap-3">
      <span>
        {formatDate(subscription.gracePeriodEndsAt)}까지 결제 수단을 갱신하지 않으면
        서비스 이용이 중단됩니다.
      </span>
      <Button size="sm" asChild>
        <Link href="/settings/billing/payment-method">결제 수단 변경</Link>
      </Button>
    </AlertDescription>
  </Alert>
)}
```

시급한 상태는 (a) 무엇이 잘못됐는지, (b) 언제까지 조치해야 하는지, (c) 어떻게 조치하는지 세 가지를 모두 담아야 한다.

---

### UX-FLOW-05 — 진행 상황 표시

**WHY**
다단계 흐름에서 "지금 어디쯤이고 얼마나 남았는지" 모르면 불안해진다. 사용자는 남은 시간을 예측할 수 없으면 도중에 그만둔다. 반대로 "3단계 중 2단계"라고 알려주면 끝까지 갈 확률이 올라간다.

**DETECT**

```bash
rg -n "Progress|Stepper|step.*of|단계" src/components --glob "*.tsx" | head -20
rg -n "currentStep|activeStep|stepIndex" src --glob "*.tsx" | head
```

**진단**

다단계 흐름을 순회하며 확인한다.

```text
[ ] 전체 단계 수를 알 수 있는가?
[ ] 현재 위치를 알 수 있는가?
[ ] 각 단계에서 무엇을 하는지 미리 알 수 있는가?
[ ] 이전 단계로 돌아갈 수 있는가?
[ ] 완료한 단계를 다시 볼 수 있는가?
[ ] 중간에 저장하고 나갈 수 있는가?
```

**PASS / FAIL**

- PASS: 3단계 이상 흐름에 진행 표시가 있고, 각 단계 이름이 내용을 예고한다. 뒤로 이동이 가능하다.
- FAIL: 진행 표시 없음(S2), 뒤로 이동 불가(S2), 단계 이름이 무의미(`1단계`, `2단계`)(S3).

**FIX**

```tsx
// ❌ 위치를 알 수 없다
<div>
  <h2>정보를 입력하세요</h2>
  <form>{/* … */}</form>
  <Button>다음</Button>
</div>
```

```tsx
// ✅ 진행 상황과 각 단계의 내용을 명시
const STEPS = [
  { id: 'account', label: '계정', description: '로그인 정보' },
  { id: 'team',    label: '팀 설정', description: '팀 이름과 도메인' },
  { id: 'invite',  label: '팀원 초대', description: '건너뛸 수 있습니다' },
] as const;

function OnboardingStepper({ current }: { current: number }) {
  return (
    <nav aria-label="온보딩 진행 상황">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-sm',
                  state === 'complete' && 'bg-primary text-primary-foreground',
                  state === 'current' && 'border-2 border-primary font-semibold',
                  state === 'upcoming' && 'border border-muted text-muted-foreground',
                )}
              >
                {state === 'complete' ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-medium">{step.label}</span>
                <span className="block text-xs text-muted-foreground">{step.description}</span>
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <p className="sr-only">전체 {STEPS.length}단계 중 {current + 1}단계: {STEPS[current].label}</p>
    </nav>
  );
}
```

`sr-only` 요약을 넣으면 스크린리더 사용자도 진행 상황을 파악할 수 있다. 시각적 스테퍼만으로는 전달되지 않는다.

**"건너뛸 수 있습니다"를 미리 알려주는 것**이 중요하다. 사용자는 3단계가 전부 필수라고 생각하면 부담을 느낀다.

```tsx
// ✅ 긴 작업의 진행률 — 남은 시간까지
<div role="status" aria-live="polite">
  <Progress value={progress} aria-label="가져오기 진행률" />
  <p className="mt-2 text-sm text-muted-foreground">
    {processed.toLocaleString()}/{total.toLocaleString()}건 처리 중
    {eta && ` · 약 ${formatDuration(eta)} 남음`}
  </p>
</div>
```

진행률만 있고 남은 시간이 없으면 사용자는 여전히 기다릴지 판단할 수 없다.

---

### UX-FLOW-06 — 대안 경로와 막다른 길

**WHY**
사용자가 어떤 화면에 도달했는데 원하는 것이 거기 없으면, 나갈 방법이 있어야 한다. 검색 결과가 없을 때, 권한이 부족할 때, 404일 때 "돌아가기" 외에 아무것도 없으면 그것이 막다른 길이다.

**DETECT**

```bash
# 오류/빈 결과 화면 탐색
fd "not-found|error|404|403" app src/app --glob "*.tsx"
rg -n "결과가 없|찾을 수 없|권한이 없" src --glob "*.tsx" -A5 | head -40

# 각 화면에 나가는 링크가 있는지
rg -L "Link|router.push|href" $(fd "not-found.tsx|error.tsx" app src/app) 2>/dev/null
```

**진단**

막다른 길이 생기는 대표 지점을 의도적으로 만든다.

```ts
test('막다른 길 점검', async ({ page }) => {
  const deadEndCandidates = [
    { url: '/nonexistent-page',        name: '404' },
    { url: '/admin/secret',            name: '권한 부족' },
    { url: '/search?q=zzzzqqqxxx',     name: '검색 결과 없음' },
    { url: '/reports/deleted-id',      name: '삭제된 리소스' },
  ];

  for (const { url, name } of deadEndCandidates) {
    await page.goto(url);

    const links = await page.getByRole('link').count();
    const buttons = await page.getByRole('button').count();

    expect(links + buttons, `${name} 화면에 이동 수단이 없다`).toBeGreaterThan(0);

    await page.screenshot({ path: `tmp/qa/ux/dead-end-${name}.png`, fullPage: true });
  }
});
```

**PASS / FAIL**

- PASS: 모든 막다른 지점에 최소 2개의 전진 경로가 있다(돌아가기 + 대안 행동).
- FAIL: 나갈 수단이 뒤로 가기뿐(S2), 아무 수단도 없음(**S1**).

**FIX**

```tsx
// ❌ 막다른 길
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
    </div>
  );
}
```

```tsx
// ✅ 전진 경로를 제공한다
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 py-20 text-center">
      <div>
        <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-muted-foreground">
          주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">검색하기</Link>
        </Button>
      </div>

      <div className="w-full border-t pt-6 text-left">
        <p className="mb-2 text-sm font-medium">자주 찾는 페이지</p>
        <ul className="space-y-1 text-sm">
          <li><Link href="/reports" className="text-primary hover:underline">리포트 목록</Link></li>
          <li><Link href="/settings/members" className="text-primary hover:underline">팀 관리</Link></li>
          <li><Link href="/help" className="text-primary hover:underline">도움말</Link></li>
        </ul>
      </div>
    </main>
  );
}
```

**검색 결과 없음**

```tsx
// ✅ 왜 없는지 설명하고 다음 행동을 제시
<div className="py-12 text-center">
  <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden />
  <h2 className="mt-4 text-lg font-medium">
    &lsquo;{query}&rsquo;에 대한 결과가 없습니다
  </h2>

  <div className="mx-auto mt-4 max-w-sm text-left text-sm text-muted-foreground">
    <p className="mb-2">다음을 시도해보세요:</p>
    <ul className="list-inside list-disc space-y-1">
      <li>검색어의 철자를 확인하세요</li>
      <li>더 일반적인 단어를 사용하세요</li>
      {activeFilters.length > 0 && (
        <li>
          적용된 필터 {activeFilters.length}개를 해제하세요
          <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0 pl-1">
            필터 모두 해제
          </Button>
        </li>
      )}
    </ul>
  </div>

  {suggestions.length > 0 && (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground">이런 검색어는 어떨까요?</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {suggestions.map(s => (
          <Button key={s} variant="outline" size="sm" onClick={() => search(s)}>
            {s}
          </Button>
        ))}
      </div>
    </div>
  )}
</div>
```

필터가 적용된 상태에서 결과가 없으면, **필터가 원인일 가능성**을 알려주고 해제 수단을 제공해야 한다. 이를 놓치면 사용자는 데이터가 없다고 오해한다.

**권한 부족**

```tsx
// ✅ 왜 안 되는지, 어떻게 해결하는지
<div className="mx-auto max-w-md py-16 text-center">
  <Lock className="mx-auto size-10 text-muted-foreground" aria-hidden />
  <h1 className="mt-4 text-xl font-semibold">이 페이지에 접근할 권한이 없습니다</h1>
  <p className="mt-2 text-muted-foreground">
    결제 정보는 관리자만 볼 수 있습니다. 현재 권한은 &lsquo;멤버&rsquo;입니다.
  </p>
  <div className="mt-6 flex justify-center gap-3">
    <Button asChild>
      <Link href="/dashboard">대시보드로</Link>
    </Button>
    <Button variant="outline" onClick={requestAccess}>
      관리자에게 권한 요청
    </Button>
  </div>
</div>
```

"권한 요청" 버튼이 있으면 막다른 길이 해결 경로가 된다.

---

### UX-FLOW-07 — 크로스 디바이스와 세션 연속성

**WHY**
사용자는 데스크톱에서 시작해 모바일에서 이어가고, 여러 탭을 동시에 연다. 한쪽에서 한 작업이 다른 쪽에 반영되지 않으면 데이터 충돌이나 혼란이 발생한다.

**DETECT**

```bash
rg -n "revalidate|router.refresh|mutate|invalidateQueries" src | head -20
rg -n "BroadcastChannel|storage.*event|visibilitychange" src | head
rg -n "optimistic|useOptimistic" src | head
```

**진단**

```ts
test('두 탭에서 같은 데이터를 볼 때 동기화', async ({ context }) => {
  const tabA = await context.newPage();
  const tabB = await context.newPage();

  await tabA.goto('/settings/members');
  await tabB.goto('/settings/members');

  // A에서 멤버 삭제
  await tabA.getByRole('row', { name: /김민준/ })
    .getByRole('button', { name: '삭제' }).click();
  await tabA.getByRole('alertdialog').getByRole('button', { name: '삭제' }).click();

  // B에서 같은 멤버를 조작하면?
  await tabB.getByRole('row', { name: /김민준/ })
    .getByRole('button', { name: '권한 변경' }).click();

  // 오류가 이해 가능한가
  await expect(tabB.getByRole('alert')).toContainText(/삭제된|더 이상 존재하지/);
  // 목록이 갱신되는가
  await expect(tabB.getByRole('row', { name: /김민준/ })).toHaveCount(0);
});
```

**PASS / FAIL**

- PASS: 다른 탭/기기의 변경이 반영되거나, 충돌 시 이해 가능한 안내가 나온다.
- FAIL: 낡은 데이터로 조작해 데이터 손상(**S1**), 원인 불명 오류(S2), 새로고침 전까지 갱신 안 됨(S3).

**FIX**

```tsx
// ✅ 탭 복귀 시 데이터 갱신
'use client';

export function useRefreshOnFocus(refresh: () => void, staleAfterMs = 30_000) {
  const lastActive = useRef(Date.now());

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        lastActive.current = Date.now();
        return;
      }
      // 오래 떠나 있었다면 갱신
      if (Date.now() - lastActive.current > staleAfterMs) refresh();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refresh, staleAfterMs]);
}
```

```ts
// ✅ 낙관적 동시성 제어 — 충돌을 감지하고 설명한다
// 서버
export async function updateMember(id: string, input: UpdateInput, version: number) {
  const result = await db.member.updateMany({
    where: { id, version },
    data: { ...input, version: version + 1 },
  });

  if (result.count === 0) {
    const current = await db.member.findUnique({ where: { id } });
    if (!current) {
      throw new ConflictError('DELETED', '이 멤버는 다른 사용자가 삭제했습니다.');
    }
    throw new ConflictError('STALE', '다른 사용자가 먼저 수정했습니다.', { current });
  }
}
```

```tsx
// ✅ 충돌을 사용자가 해결할 수 있게
{conflict && (
  <AlertDialog open>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>다른 사용자가 먼저 수정했습니다</AlertDialogTitle>
        <AlertDialogDescription>
          {conflict.updatedBy}님이 {formatRelative(conflict.updatedAt)}에 이 항목을 변경했습니다.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-sm font-medium">내 변경 사항</p>
          <p className="text-sm text-muted-foreground">{describeChanges(myChanges)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-sm font-medium">현재 저장된 내용</p>
          <p className="text-sm text-muted-foreground">{describeChanges(conflict.current)}</p>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={discardMine}>현재 내용 유지</AlertDialogCancel>
        <AlertDialogAction onClick={overwrite}>내 변경으로 덮어쓰기</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

충돌 시 "다시 시도하세요"만 보여주면 사용자는 자기 작업을 잃는다. **양쪽을 보여주고 선택하게** 하는 것이 최소한이다.

---

## 7. 정보 구조와 내비게이션

### UX-IA-01 — 내비게이션 구조의 예측 가능성

**WHY**
사용자는 원하는 기능이 어느 메뉴에 있을지 예측하고 그곳을 먼저 본다. 예측이 자주 빗나가면 매번 전체를 탐색해야 하고, 결국 검색에 의존하거나 포기한다. 내비게이션 구조는 제품의 내부 구조가 아니라 **사용자의 멘탈 모델**을 반영해야 한다.

**DETECT**

```bash
# 내비게이션 항목 추출
rg -n "href=" src/components/layout/*nav* src/components/layout/*sidebar* --glob "*.tsx" -o | head -30

# 라우트 계층 구조
fd "page.tsx" app src/app | sed 's|.*/app||; s|/page.tsx||' | sort | awk -F/ '{print NF-1, $0}' | sort -n

# 계층 깊이 (3단계 초과는 검토 대상)
fd "page.tsx" app src/app | awk -F/ '{print NF}' | sort -rn | head -3
```

**진단**

**역카드소팅(Reverse Card Sorting)** — 기능 목록을 만들고, 각 기능이 어느 메뉴에 있을 것 같은지 예측한 뒤 실제와 대조한다.

```markdown
| 기능 | 예상 위치 | 실제 위치 | 일치 |
|------|-----------|-----------|------|
| 비밀번호 변경 | 설정 > 계정 | 설정 > 보안 | 부분 |
| 팀원 초대 | 팀 | 설정 > 멤버 | 불일치 |
| 알림 설정 | 설정 > 알림 | 프로필 > 환경설정 | 불일치 |
| 청구서 다운로드 | 설정 > 결제 | 설정 > 결제 > 내역 | 일치 |
| API 키 발급 | 설정 > 개발자 | 설정 > 통합 > API | 부분 |
```

불일치가 30%를 넘으면 구조를 재검토한다.

**PASS / FAIL**

- PASS: 주요 기능의 위치를 70% 이상 예측할 수 있다. 계층이 3단계 이내다. 메뉴 라벨이 내용을 예고한다.
- FAIL: 예측 실패율 50% 초과(S2), 4단계 이상 계층(S2), 기능이 여러 곳에 중복(S3).

**FIX**

**구조를 사용자 과업 기준으로 정렬한다**

```tsx
// ❌ 시스템 구조를 그대로 노출
const NAV = [
  { label: 'Entities', href: '/entities' },
  { label: 'Workspaces', href: '/workspaces' },
  { label: 'Configurations', href: '/configs' },
  { label: 'Integrations', href: '/integrations' },
];
```

```tsx
// ✅ 사용자가 하려는 일 기준
const NAV = [
  { label: '대시보드', href: '/dashboard', description: '전체 현황' },
  { label: '리포트',   href: '/reports',   description: '작성과 공유' },
  { label: '데이터',   href: '/data',      description: '소스 연결과 관리' },
  { label: '팀',       href: '/team',      description: '멤버와 권한' },
];
```

**설정을 과업으로 그룹화한다**

```tsx
// ❌ 기술적 분류 — 사용자는 어디 있는지 모른다
const SETTINGS_NAV = [
  { label: 'General', href: '/settings/general' },
  { label: 'Advanced', href: '/settings/advanced' },
  { label: 'Misc', href: '/settings/misc' },
];
```

"Advanced"와 "Misc"는 **분류를 포기했다는 신호**다. 어디에도 속하지 않는 항목을 모아둔 서랍이며, 사용자는 절대 그곳을 먼저 찾지 않는다.

```tsx
// ✅ 대상 기준 그룹화
const SETTINGS_GROUPS = [
  {
    label: '내 계정',
    items: [
      { label: '프로필', href: '/settings/profile' },
      { label: '비밀번호와 보안', href: '/settings/security' },
      { label: '알림', href: '/settings/notifications' },
    ],
  },
  {
    label: '팀',
    items: [
      { label: '멤버', href: '/settings/members' },
      { label: '권한', href: '/settings/roles' },
      { label: '팀 프로필', href: '/settings/team' },
    ],
  },
  {
    label: '결제',
    items: [
      { label: '플랜', href: '/settings/billing/plan' },
      { label: '결제 수단', href: '/settings/billing/payment' },
      { label: '청구 내역', href: '/settings/billing/invoices' },
    ],
  },
  {
    label: '개발자',
    items: [
      { label: 'API 키', href: '/settings/api-keys' },
      { label: '웹훅', href: '/settings/webhooks' },
    ],
  },
];
```

"내 계정"과 "팀"을 구분하는 것이 중요하다. 사용자는 "내 알림 설정"과 "팀 전체 설정"을 다른 것으로 인식한다.

**같은 기능에 여러 경로를 제공한다**

예측이 빗나가도 도달할 수 있게 한다. 이는 중복이 아니라 **다중 진입점**이다.

```tsx
// ✅ 팀원 초대: 세 경로에서 도달 가능
// 1. 팀 페이지의 주 버튼
// 2. 설정 > 멤버
// 3. 빈 상태의 CTA
// 4. 커맨드 팔레트 (Cmd+K)
```

**REGRESSION**

```ts
test('내비게이션 계층이 3단계를 넘지 않는다', async () => {
  const routes = execSync(
    `fd "page.tsx" app src/app | sed 's|.*/app||; s|/page.tsx||'`,
    { encoding: 'utf8' },
  ).trim().split('\n');

  const deep = routes.filter(r => r.split('/').filter(Boolean).length > 3);
  expect(deep, `4단계 이상 라우트:\n${deep.join('\n')}`).toEqual([]);
});
```

---

### UX-IA-02 — 현재 위치 인지

**WHY**
사용자가 "지금 어디에 있는지" 모르면 다음 이동을 계획할 수 없다. 특히 깊은 계층에서 브레드크럼이 없으면 상위로 돌아가는 방법을 알 수 없고, 활성 메뉴 표시가 없으면 어느 섹션인지 헷갈린다.

**DETECT**

```bash
rg -n "usePathname|useSelectedLayoutSegment" src/components --glob "*.tsx" | head
rg -n "aria-current" src --glob "*.tsx" | wc -l
rg -n "Breadcrumb|breadcrumb" src --glob "*.tsx" | head
rg -n "generateMetadata|title:" app src/app --glob "*.tsx" | wc -l
```

**진단**

깊은 페이지에 직접 진입해 확인한다.

```ts
test('현재 위치 인지 수단', async ({ page }) => {
  const deepRoutes = [
    '/settings/billing/invoices',
    '/reports/rpt-123/edit',
    '/team/members/mem-456',
  ];

  for (const route of deepRoutes) {
    await page.goto(route);

    const checks = {
      브레드크럼: await page.getByRole('navigation', { name: /경로|breadcrumb/i }).count() > 0,
      활성메뉴: await page.locator('[aria-current="page"]').count() > 0,
      페이지제목: await page.getByRole('heading', { level: 1 }).count() > 0,
      문서제목: (await page.title()) !== '' && !(await page.title()).match(/^(App|Untitled)$/),
    };

    console.log(route, checks);
    expect(Object.values(checks).filter(Boolean).length,
      `${route}에 위치 인지 수단이 부족하다: ${JSON.stringify(checks)}`).toBeGreaterThanOrEqual(3);
  }
});
```

**PASS / FAIL**

- PASS: 활성 메뉴 표시, `<h1>` 페이지 제목, 문서 `<title>`이 모두 있다. 3단계 이상 깊이에는 브레드크럼이 있다.
- FAIL: 활성 표시 없음(S2), 페이지 제목 없음(S2), 깊은 계층에 브레드크럼 없음(S2).

**FIX**

```tsx
// ✅ 활성 메뉴 — aria-current로 접근성까지
'use client';

import { usePathname } from 'next/navigation';

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="주 메뉴">
      <ul className="space-y-1">
        {items.map(item => {
          // 정확 일치 또는 하위 경로 (단, 루트는 정확 일치만)
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    // 색뿐 아니라 좌측 인디케이터로도 표시 (색각 이상 대응)
                    ? 'bg-accent font-medium text-accent-foreground shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

활성 상태를 **색상만으로 표시하지 않는 것**이 중요하다. 굵기, 배경, 좌측 바 중 최소 두 가지를 조합한다.

```tsx
// ✅ 브레드크럼 — 상위로 돌아가는 경로 제공
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="현재 위치">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="font-medium">
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

```tsx
// ✅ 문서 제목 — 탭이 여러 개일 때 구분 가능하게
// app/settings/billing/invoices/page.tsx
export const metadata: Metadata = {
  title: '청구 내역 · 결제 설정',
};

// app/layout.tsx
export const metadata: Metadata = {
  title: { template: '%s | Acme', default: 'Acme' },
};
```

탭 제목은 **구체적인 것이 앞**에 와야 한다. `Acme | 설정 | 결제 | 청구 내역`은 탭이 좁아지면 `Acme | 설...`만 보여 구분이 안 된다.

---

### UX-IA-03 — 검색과 발견

**WHY**
제품이 커지면 내비게이션만으로는 원하는 것을 찾을 수 없다. 검색은 구조를 우회하는 지름길이자, 내비게이션 설계가 실패했을 때의 안전망이다. 그런데 검색이 있어도 기능만 찾고 콘텐츠는 못 찾거나, 반대인 경우가 많다.

**DETECT**

```bash
rg -n "cmdk|Command|searchbox|role=\"search\"" src --glob "*.tsx" | head
rg -n "Cmd\+K|⌘K|Ctrl\+K|meta.*k" src --glob "*.tsx" | head
rg -n "/api/search|searchParams.*q=" src app | head
```

**진단**

실제 검색어로 시도한다.

```markdown
| 검색어 | 의도 | 결과 | 판정 |
|--------|------|------|------|
| `초대` | 팀원 초대 기능 찾기 | 결과 없음 | 기능 미검색 |
| `김민준` | 특정 멤버 찾기 | 멤버 1건 | OK |
| `인보이스` | 청구서 (사용자 용어) | 결과 없음 | 동의어 미지원 |
| `청구서` | 청구서 | 3건 | OK |
| `Q2 리포트` | 특정 리포트 | 오탈자 없이만 동작 | 오타 미허용 |
| `설정` | 설정 페이지 | 결과 없음 | 페이지 미검색 |
```

**PASS / FAIL**

- PASS: 검색이 콘텐츠·기능·설정을 모두 포괄한다. 동의어와 오타를 어느 정도 허용한다. 결과에 유형이 표시된다.
- FAIL: 검색 부재(S2 — 제품 규모에 따라), 콘텐츠만 검색되고 기능은 안 됨(S2), 정확 일치만 지원(S3).

**FIX**

```tsx
// ✅ 커맨드 팔레트 — 기능과 콘텐츠를 함께
'use client';

import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const ACTIONS = [
  { id: 'invite',      label: '팀원 초대',      keywords: ['초대', '멤버', '추가', 'invite'], href: '/team?invite=1' },
  { id: 'new-report',  label: '새 리포트 만들기', keywords: ['리포트', '생성', '작성', 'new'], href: '/reports/new' },
  { id: 'billing',     label: '결제 설정',       keywords: ['결제', '청구', '인보이스', '요금', '구독'], href: '/settings/billing' },
  { id: 'api-keys',    label: 'API 키 관리',     keywords: ['api', '키', '토큰', '개발자'], href: '/settings/api-keys' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { data: results } = useSearch(deferred);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="검색하거나 명령을 입력하세요…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <p>&lsquo;{query}&rsquo;에 대한 결과가 없습니다.</p>
            <p className="mt-1 text-muted-foreground">
              다른 검색어를 시도하거나{' '}
              <Link href="/help" className="text-primary underline">도움말</Link>을 확인하세요.
            </p>
          </div>
        </CommandEmpty>

        {/* 기능은 항상 먼저 — 사용자가 "무언가 하려는" 의도가 많다 */}
        <CommandGroup heading="바로 실행">
          {ACTIONS.filter(a => matchesKeywords(a, deferred)).map(action => (
            <CommandItem key={action.id} onSelect={() => go(action.href)}>
              <Zap className="mr-2 size-4" aria-hidden />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {results?.reports?.length ? (
          <CommandGroup heading="리포트">
            {results.reports.map(r => (
              <CommandItem key={r.id} onSelect={() => go(`/reports/${r.id}`)}>
                <FileText className="mr-2 size-4" aria-hidden />
                <span className="flex-1">{r.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(r.updatedAt)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {results?.members?.length ? (
          <CommandGroup heading="멤버">{/* … */}</CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
```

**동의어 매핑이 실용적으로 중요하다.** 사용자는 제품 내부 용어를 모른다.

```ts
// lib/search-synonyms.ts
export const SYNONYMS: Record<string, string[]> = {
  결제: ['빌링', 'billing', '인보이스', 'invoice', '청구', '요금', '구독', '결제수단', '카드'],
  멤버: ['팀원', '사용자', 'user', 'member', '직원', '계정'],
  리포트: ['보고서', 'report', '문서', '자료'],
  권한: ['역할', 'role', 'permission', '접근'],
  삭제: ['제거', '지우기', 'delete', 'remove'],
};

export function expandQuery(query: string): string[] {
  const terms = [query.toLowerCase()];
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    if (aliases.some(a => query.toLowerCase().includes(a.toLowerCase()))) {
      terms.push(canonical);
    }
  }
  return [...new Set(terms)];
}
```

**단축키를 발견 가능하게 만든다.** `Cmd+K`가 있어도 아무도 모르면 없는 것과 같다.

```tsx
// ✅ 검색창에 단축키를 시각적으로 노출
<button
  onClick={() => setOpen(true)}
  className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"
>
  <Search className="size-4" aria-hidden />
  <span className="flex-1 text-left">검색…</span>
  <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-xs sm:inline-block">
    {isMac ? '⌘' : 'Ctrl'} K
  </kbd>
</button>
```

---

### UX-IA-04 — 라벨과 용어 일관성

**WHY**
같은 것을 화면마다 다른 이름으로 부르면 사용자는 다른 것이라고 생각한다. "멤버", "팀원", "사용자", "구성원"이 섞여 있으면 각각이 다른 개념인지 헷갈린다. 반대로 다른 것을 같은 이름으로 부르면 구분할 수 없다.

**DETECT**

```bash
# 유사 용어 혼용 탐지
for pair in "멤버:팀원:사용자:구성원" "삭제:제거:지우기" "저장:적용:확인" "리포트:보고서" "설정:환경설정:구성"; do
  echo "=== $pair ==="
  echo "$pair" | tr ':' '\n' | while read term; do
    count=$(rg -c "$term" src app --glob "*.tsx" 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
    echo "  $term: $count"
  done
done

# 버튼 라벨 목록화
rg -o "<Button[^>]*>([^<]+)</Button>" src app --glob "*.tsx" -r '$1' | tr -d ' \n\t' | sort | uniq -c | sort -rn | head -30

# 영문/한글 혼용
rg -n ">[A-Za-z ]{3,20}<" src/components/ui --glob "*.tsx" | rg -v "className|import" | head -20
```

**진단**

용어 사전을 만들고 실제 사용을 대조한다.

```markdown
| 개념 | 표준 용어 | 실제 사용 | 위치 | 판정 |
|------|-----------|-----------|------|------|
| 팀에 속한 사람 | 멤버 | 멤버(12) / 팀원(5) / 사용자(3) | 혼용 | **불일치** |
| 데이터 영구 제거 | 삭제 | 삭제(20) / 제거(4) | 혼용 | 부분 |
| 목록에서 빼기 | 제외 | 삭제(3) | 잘못된 용어 | **위험** |
| 변경 사항 반영 | 저장 | 저장(15) / 적용(6) / 확인(4) | 혼용 | **불일치** |
```

"목록에서 빼기"에 "삭제"를 쓰면 사용자는 데이터가 영구 삭제된다고 오해한다. 이것은 단순 불일치가 아니라 위험한 오해다.

**PASS / FAIL**

- PASS: 개념당 하나의 용어를 일관되게 사용한다. 파괴적 작업과 비파괴적 작업의 용어가 구분된다.
- FAIL: 파괴/비파괴 용어 혼동(**S1** — 데이터 손실 위험), 핵심 개념 용어 혼용(S2), 부수 용어 혼용(S3).

**FIX**

```ts
// lib/terminology.ts — 용어를 코드로 고정한다
export const TERMS = {
  // 사람
  member: '멤버',
  memberPlural: '멤버',
  admin: '관리자',
  owner: '소유자',

  // 조직
  team: '팀',
  workspace: '워크스페이스',

  // 동작 — 파괴적/비파괴적을 명확히 구분
  save: '저장',              // 변경 사항을 서버에 반영
  apply: '적용',             // 설정을 즉시 반영 (저장과 구분되는 경우만)
  remove: '제외',            // 목록/그룹에서 빼기 (데이터는 유지)
  delete: '삭제',            // 영구 제거 (되돌릴 수 없음)
  archive: '보관',           // 숨기지만 유지
  cancel: '취소',            // 진행 중인 작업 중단
  discard: '변경 취소',      // 저장하지 않고 버리기
} as const;
```

```tsx
// ✅ 용어를 참조해 사용
import { TERMS } from '@/lib/terminology';

<Button variant="outline" onClick={removeFromTeam}>
  팀에서 {TERMS.remove}
</Button>

<Button variant="destructive" onClick={deletePermanently}>
  계정 {TERMS.delete}
</Button>
```

**동작의 결과를 라벨에 반영한다**

```tsx
// ❌ 무엇이 일어나는지 모호
<Button>확인</Button>
<Button>OK</Button>
<Button>완료</Button>

// ✅ 동작을 서술
<Button>초대 보내기</Button>
<Button>리포트 발행</Button>
<Button>결제하고 구독 시작</Button>
```

버튼 라벨은 "이 버튼을 누르면 무엇이 일어나는가"에 답해야 한다. 대화상자에서 특히 중요하다.

```tsx
// ❌ 대화상자에서 "예/아니오"는 무엇에 대한 답인지 불명확
<AlertDialogAction>예</AlertDialogAction>
<AlertDialogCancel>아니오</AlertDialogCancel>

// ✅ 각 버튼이 자기 동작을 서술
<AlertDialogAction>멤버 3명 삭제</AlertDialogAction>
<AlertDialogCancel>취소</AlertDialogCancel>
```

**REGRESSION**

```ts
// tests/ux/terminology.spec.ts
test('금지된 용어 혼용이 없다', () => {
  const FORBIDDEN = [
    { term: '팀원', canonical: '멤버' },
    { term: '유저',  canonical: '사용자' },
    { term: '어카운트', canonical: '계정' },
  ];

  const violations: string[] = [];
  for (const { term, canonical } of FORBIDDEN) {
    const out = execSync(`rg -n "${term}" src app --glob "*.tsx" || true`, { encoding: 'utf8' }).trim();
    if (out) violations.push(`"${term}" → "${canonical}" 사용:\n${out}`);
  }

  expect(violations, violations.join('\n\n')).toEqual([]);
});
```

---

### UX-IA-05 — 목록의 스캔 가능성

**WHY**
목록은 SaaS에서 가장 많이 보는 화면이다. 사용자는 목록을 읽지 않고 **훑는다.** 원하는 항목을 빠르게 찾을 수 없으면 매 방문마다 시간을 잃는다. 정보 밀도, 정렬, 필터, 그룹화가 스캔 가능성을 결정한다.

**DETECT**

```bash
rg -n "<Table|DataTable|role=\"table\"" src --glob "*.tsx" | head
rg -n "sortBy|orderBy|sort=" src app --glob "*.tsx" | head
rg -n "filter|Filter" src/components --glob "*.tsx" | head
rg -n "pagination|Pagination|page=" src app | head
```

**진단**

각 목록 화면에서 실제 과업을 수행한다.

```text
과업: "지난주에 김민준이 만든 리포트를 찾으세요"

[ ] 정렬 기준을 바꿀 수 있는가?
[ ] 작성자로 필터할 수 있는가?
[ ] 기간으로 필터할 수 있는가?
[ ] 필터를 조합할 수 있는가?
[ ] 적용된 필터가 보이는가?
[ ] 필터 상태가 URL에 반영되는가? (공유·새로고침)
[ ] 목록에서 작성자와 날짜가 보이는가?
[ ] 몇 초 만에 찾았는가?
```

**PASS / FAIL**

- PASS: 필터·정렬·검색으로 30초 이내에 목표 항목을 찾는다. 필터 상태가 URL에 반영된다. 각 행에서 식별에 필요한 정보가 보인다.
- FAIL: 목표 항목을 찾을 수 없음(**S1**), 필터 부재로 수동 스캔 필요(S2), 필터 상태가 새로고침 시 소실(S2).

**FIX**

```tsx
// ✅ URL에 필터 상태 반영 — 공유·북마크·새로고침 가능
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function useListFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = {
    q: params.get('q') ?? '',
    author: params.get('author') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    sort: params.get('sort') ?? 'updatedAt',
    order: (params.get('order') ?? 'desc') as 'asc' | 'desc',
  };

  const setFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');   // 필터 변경 시 첫 페이지로
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const clearAll = () => router.replace(pathname, { scroll: false });

  const activeCount = ['q', 'author', 'from', 'to'].filter(k => params.get(k)).length;

  return { filters, setFilter, clearAll, activeCount };
}
```

```tsx
// ✅ 적용된 필터를 명시하고 개별 해제 수단 제공
{activeCount > 0 && (
  <div className="flex flex-wrap items-center gap-2 border-b py-3">
    <span className="text-sm text-muted-foreground">필터 {activeCount}개 적용됨</span>

    {filters.q && (
      <Badge variant="secondary" className="gap-1">
        검색: {filters.q}
        <button onClick={() => setFilter('q', null)} aria-label="검색어 필터 해제">
          <X className="size-3" aria-hidden />
        </button>
      </Badge>
    )}

    {filters.author && (
      <Badge variant="secondary" className="gap-1">
        작성자: {authorName}
        <button onClick={() => setFilter('author', null)} aria-label="작성자 필터 해제">
          <X className="size-3" aria-hidden />
        </button>
      </Badge>
    )}

    <Button variant="ghost" size="sm" onClick={clearAll}>모두 해제</Button>
  </div>
)}
```

**행에서 식별에 필요한 정보를 보여준다**

```tsx
// ❌ 제목만 보여 구분이 안 된다
<tr>
  <td>{report.title}</td>
  <td><Button>열기</Button></td>
</tr>
```

```tsx
// ✅ 주 정보 + 식별 보조 정보 + 상태
<tr className="group">
  <td className="py-3">
    <div className="flex items-start gap-3">
      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="truncate font-medium">{report.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {report.author.name} · {formatRelative(report.updatedAt)}
          {report.sharedWith.length > 0 && ` · ${report.sharedWith.length}명과 공유`}
        </p>
      </div>
    </div>
  </td>
  <td><StatusBadge status={report.status} /></td>
  <td className="text-right">
    {/* 행 호버 시 나타나는 액션은 키보드 포커스에서도 보여야 한다 */}
    <div className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <RowActions report={report} />
    </div>
  </td>
</tr>
```

`group-focus-within:opacity-100`이 없으면 키보드 사용자는 행 액션에 도달할 수 없다. 호버 전용 UI의 대표적 결함이다.

**대량 목록에는 그룹화가 스캔을 돕는다**

```tsx
// ✅ 날짜 그룹화 — 시간 순 목록에서 위치 파악이 쉬워진다
{Object.entries(groupByDate(reports)).map(([label, items]) => (
  <section key={label}>
    <h3 className="sticky top-0 z-10 bg-background/95 py-2 text-sm font-medium text-muted-foreground backdrop-blur">
      {label}
    </h3>
    <ul>{items.map(r => <ReportRow key={r.id} report={r} />)}</ul>
  </section>
))}

// groupByDate: 오늘 / 어제 / 이번 주 / 이번 달 / 2026년 6월 …
```

---

## 8. 첫인상과 진입

### UX-FIRST-01 — 가치 제안의 즉시성

**WHY**
방문자는 몇 초 안에 "이게 나에게 필요한가"를 판단하고 떠난다. 첫 화면에서 (a) 이것이 무엇인지, (b) 누구를 위한 것인지, (c) 무엇이 좋아지는지 알 수 없으면 나머지 콘텐츠는 읽히지 않는다.

**DETECT**

```bash
# 히어로 영역의 텍스트 추출
rg -n "h1|헤드라인" src/app/page.tsx src/components/**/hero*.tsx -A8 | head -40

# 메타 설명
rg -n "description:" src/app/layout.tsx src/app/page.tsx
```

```ts
// 첫 화면(fold)에 무엇이 보이는지 측정
test('첫 화면 콘텐츠 감사', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const aboveFold = await page.evaluate(() => {
    const fold = window.innerHeight;
    const visible: { tag: string; text: string; top: number }[] = [];

    document.querySelectorAll('h1, h2, h3, p, button, a').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < fold && rect.bottom > 0 && rect.height > 0) {
        const text = (el.textContent ?? '').trim().slice(0, 100);
        if (text) visible.push({ tag: el.tagName, text, top: Math.round(rect.top) });
      }
    });
    return visible.sort((a, b) => a.top - b.top);
  });

  console.table(aboveFold);
  await page.screenshot({ path: 'tmp/qa/ux/first-fold-desktop.png' });
});
```

**진단**

**5초 테스트** — 첫 화면을 5초만 보고 가린 뒤 답한다.

```text
1. 이 제품은 무엇을 하는가?
2. 누구를 위한 것인가?
3. 나는 무엇을 해야 하는가?
4. 이것을 쓰면 무엇이 좋아지는가?
```

네 질문에 답할 수 없으면 첫 화면이 실패한 것이다. 자신이 제품을 이미 알고 있으므로, 답을 아는 것과 화면에서 읽어낸 것을 구분해야 한다. 화면에 그 정보가 문자로 존재하는지 확인한다.

**PASS / FAIL**

- PASS: 첫 화면 텍스트만으로 무엇·누구·다음 행동을 알 수 있다. 주 CTA가 하나로 명확하다.
- FAIL: 제품 정체 불명(**S1** — 전환 손실), 추상적 카피만 존재(S2), CTA가 여러 개로 분산(S2).

**FIX**

```tsx
// ❌ 추상적이고 내부 지향적
<h1>혁신적인 데이터 인텔리전스 플랫폼</h1>
<p>차세대 기술로 비즈니스를 재정의하세요</p>
<div>
  <Button>시작하기</Button>
  <Button>데모 신청</Button>
  <Button>가격 보기</Button>
  <Button>문서</Button>
</div>
```

"혁신적", "차세대", "재정의"는 어떤 제품에도 붙일 수 있는 말이다. 정보량이 0이다. CTA 4개는 결정을 어렵게 만든다.

```tsx
// ✅ 구체적이고 사용자 지향적
<section className="mx-auto max-w-3xl py-20 text-center">
  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
    흩어진 매출 데이터를 매주 자동으로 리포트로 만듭니다
  </h1>
  <p className="mt-5 text-lg text-muted-foreground">
    구글 애널리틱스, 스프레드시트, 결제 시스템을 연결하면
    월요일 아침마다 팀 슬랙으로 요약이 도착합니다.
  </p>

  <div className="mt-8 flex flex-col items-center gap-3">
    <Button size="lg" asChild>
      <Link href="/auth/signup">무료로 시작하기</Link>
    </Button>
    {/* 마찰 제거 신호를 CTA 바로 아래에 */}
    <p className="text-sm text-muted-foreground">
      신용카드 없이 14일 무료 · 2분이면 첫 리포트 생성
    </p>
  </div>

  {/* 보조 CTA는 시각적 위계를 낮춰 하나만 */}
  <p className="mt-6 text-sm">
    <Link href="/demo" className="text-muted-foreground underline underline-offset-4">
      먼저 예시 리포트 보기
    </Link>
  </p>
</section>
```

**카피 작성 원칙**

```text
❌ 우리가 무엇인지         → ✅ 사용자에게 무엇이 좋아지는지
❌ 기술을 나열             → ✅ 결과를 서술
❌ 형용사로 수식           → ✅ 구체적 명사와 숫자
❌ 모두를 대상             → ✅ 특정 대상을 지목
```

**CTA 아래의 마찰 제거 문구**가 전환에 실질적으로 기여한다. "신용카드 없이", "2분", "언제든 취소"는 사용자가 클릭 직전에 갖는 걱정에 답한다.

**REGRESSION**

```ts
test('첫 화면에 가치 제안과 CTA가 존재한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toBeVisible();
  await expect(h1).toBeInViewport();

  const text = (await h1.textContent()) ?? '';
  expect(text.length, 'h1이 너무 짧아 가치 전달 불가').toBeGreaterThan(10);
  expect(text.length, 'h1이 너무 길어 스캔 불가').toBeLessThan(80);

  // 첫 화면의 주 CTA는 하나여야 한다
  const primaryCtas = await page.locator('a[href*="signup"], a[href*="start"]')
    .filter({ has: page.locator(':scope') })
    .evaluateAll(els => els.filter(el => el.getBoundingClientRect().top < window.innerHeight).length);

  expect(primaryCtas, `첫 화면 주 CTA ${primaryCtas}개 — 결정 부담`).toBeLessThanOrEqual(2);
});
```

---

### UX-FIRST-02 — 진입 마찰

**WHY**
가치를 이해했어도 시작하기가 어려우면 떠난다. 가입 전에 요구하는 정보가 많을수록, 확인 단계가 많을수록 이탈이 늘어난다. 반대로 지나치게 마찰을 없애면 낮은 품질의 가입이 늘어 실제 활성화율은 떨어질 수 있다.

**DETECT**

```bash
# 가입 흐름 단계 수
fd "page.tsx" app/auth src/app/auth 2>/dev/null

# 가입 폼 필수 필드
rg -n "required" src/app/auth/signup --glob "*.tsx" | wc -l

# 이메일 인증 강제 여부
rg -n "emailVerified|verifyEmail|verification" src middleware.ts | head

# 소셜 로그인
rg -n "google|kakao|github|oauth" src/app/auth --glob "*.tsx" | head
```

**진단**

가입부터 첫 가치 경험까지 실제로 측정한다.

```ts
test('가입 → 첫 가치 경험 시간 측정', async ({ page }) => {
  const t0 = Date.now();
  const milestones: Record<string, number> = {};

  await page.goto('/');
  await page.getByRole('link', { name: /무료로 시작/ }).click();
  milestones['가입 폼 도달'] = Date.now() - t0;

  const email = `ux-${Date.now()}@example.test`;
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill('Test1234!@');
  await page.getByRole('button', { name: /계정 만들기|가입/ }).click();
  milestones['가입 제출'] = Date.now() - t0;

  // 이메일 인증이 강제되는가?
  const needsVerification = await page.getByText(/이메일.*확인|인증/).count() > 0;
  if (needsVerification) {
    milestones['이메일 인증 요구'] = Date.now() - t0;
    console.warn('⚠ 이메일 인증이 첫 가치 경험을 차단한다');
  }

  await page.waitForURL(/dashboard|onboarding/, { timeout: 30_000 });
  milestones['앱 진입'] = Date.now() - t0;

  console.table(milestones);
});
```

**Time to Value(TTV)** — 가입부터 사용자가 "아, 이래서 쓰는구나"를 느끼기까지의 시간이 핵심 지표다.

**PASS / FAIL**

- PASS: 가입 필수 필드 3개 이하. 이메일 인증이 첫 사용을 막지 않는다. TTV가 5분 이내다.
- FAIL: 이메일 인증 없이 아무것도 못 함(**S1** — 이탈 급증), 필수 필드 6개 이상(S2), TTV 15분 초과(S2).

**FIX**

**이메일 인증을 차단이 아니라 유예로**

```tsx
// ❌ 인증 전까지 아무것도 못 한다
if (!user.emailVerified) {
  redirect('/auth/verify-email');
}
```

```tsx
// ✅ 사용은 허용하고, 중요 작업에서만 인증을 요구한다
// app/(app)/layout.tsx
{!user.emailVerified && (
  <div className="border-b bg-amber-50 dark:bg-amber-950/30">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
      <Mail className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">
        <strong>{user.email}</strong>로 인증 메일을 보냈습니다.
        인증하면 리포트를 외부에 공유할 수 있습니다.
      </span>
      <Button variant="outline" size="sm" onClick={resend}>메일 재발송</Button>
    </div>
  </div>
)}
```

인증이 필요한 이유("외부 공유")를 함께 알려주면 사용자가 인증할 동기를 갖는다. 이유 없이 요구하면 무시된다.

```ts
// ✅ 인증이 실제로 필요한 지점에서만 게이트
export async function shareReportPublicly(reportId: string) {
  const user = await getCurrentUser();
  if (!user.emailVerified) {
    throw new ActionError(
      'EMAIL_VERIFICATION_REQUIRED',
      '외부 공유는 이메일 인증 후 가능합니다.',
      { resendUrl: '/auth/verify-email' },
    );
  }
  // …
}
```

**소셜 로그인으로 마찰 제거**

```tsx
// ✅ 가장 마찰이 적은 방법을 먼저 제시
<div className="space-y-3">
  <Button variant="outline" className="w-full" onClick={() => signIn('google')}>
    <GoogleIcon className="mr-2 size-4" aria-hidden />
    Google로 계속하기
  </Button>

  <div className="relative">
    <Separator />
    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
      또는
    </span>
  </div>

  <form action={signUpWithEmail} className="space-y-3">
    <Input name="email" type="email" placeholder="이메일" required autoComplete="email" />
    <Input name="password" type="password" placeholder="비밀번호" required autoComplete="new-password" />
    <Button type="submit" className="w-full">이메일로 가입</Button>
  </form>
</div>
```

**로그인과 가입을 혼동하지 않게 한다**

```tsx
// ✅ 현재 화면이 무엇인지 명확히 하고, 전환 링크를 제공
<div className="text-center">
  <h1 className="text-2xl font-semibold">계정 만들기</h1>
  <p className="mt-2 text-sm text-muted-foreground">
    이미 계정이 있으신가요?{' '}
    <Link href="/auth/login" className="text-primary underline underline-offset-4">
      로그인
    </Link>
  </p>
</div>
```

로그인 화면에서 잘못된 비밀번호를 입력했을 때 "계정이 없나요? 가입하기"를 함께 보여주면, 실제로는 가입한 적 없는 사용자가 막히지 않는다.

---

### UX-FIRST-03 — 체험 가능성

**WHY**
가입해야만 제품을 볼 수 있으면, 가치를 확인하지 못한 채 개인정보를 넘겨야 한다. 많은 사용자가 이 지점에서 떠난다. 반대로 모든 것을 무료로 열면 전환 동기가 사라진다.

**DETECT**

```bash
rg -n "middleware|requireAuth|redirect.*login" src/middleware.ts src/lib | head -20
fd "page.tsx" app src/app | while read f; do
  grep -L "auth\|session\|getUser" "$f" >/dev/null 2>&1 && echo "공개: $f"
done | head -20

rg -n "demo|sandbox|playground|sample|guest" src app --glob "*.tsx" | head
```

**진단**

로그아웃 상태로 제품을 탐색한다.

```text
[ ] 실제 화면을 볼 수 있는가? (스크린샷이 아니라)
[ ] 샘플 데이터로 조작해볼 수 있는가?
[ ] 가격을 로그인 없이 볼 수 있는가?
[ ] 문서를 로그인 없이 볼 수 있는가?
[ ] 가입 전에 무엇을 얻는지 구체적으로 알 수 있는가?
```

**PASS / FAIL**

- PASS: 가입 전 실제 UI 또는 인터랙티브 데모를 경험할 수 있다. 가격과 문서가 공개되어 있다.
- FAIL: 가입 전 아무것도 볼 수 없음(S2 — 전환 손실), 가격 비공개(S2 — B2B 엔터프라이즈는 예외), 문서 비공개(S3).

**FIX**

```tsx
// ✅ 게스트 모드 — 샘플 데이터로 실제 UI 체험
// app/demo/page.tsx
export default function DemoPage() {
  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">
            샘플 데이터로 둘러보는 중입니다. 변경 사항은 저장되지 않습니다.
          </span>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/auth/signup?from=demo">내 데이터로 시작하기</Link>
          </Button>
        </div>
      </div>

      <DashboardView data={SAMPLE_DATA} readOnly={false} persistent={false} />
    </>
  );
}
```

데모에서 **조작을 허용하되 저장하지 않는 것**이 핵심이다. 읽기 전용 데모는 스크린샷과 다를 바 없다.

```tsx
// ✅ 데모에서 저장 시도 시 자연스럽게 전환 유도
function useDemoGuard() {
  return useCallback((action: string) => {
    toast({
      title: '데모 모드입니다',
      description: `${action}을(를) 저장하려면 계정이 필요합니다. 지금까지 만든 내용을 그대로 가져갈 수 있습니다.`,
      action: (
        <ToastAction altText="가입하기" asChild>
          <Link href={`/auth/signup?from=demo&restore=${encodeURIComponent(serializeState())}`}>
            가입하고 저장
          </Link>
        </ToastAction>
      ),
    });
  }, []);
}
```

데모에서 만든 것을 가입 후 복원해주면, 사용자는 작업을 잃지 않고 전환된다.

---

### UX-FIRST-04 — 로딩 첫인상

**WHY**
첫 방문에서 화면이 비어 있는 시간이 길면, 사용자는 제품이 느리다고 인식한다. 이 인식은 이후 경험 전체에 영향을 준다. 실제 로딩 시간만큼 **체감 시간**이 중요하다.

**DETECT**

```ts
test('첫 방문 로딩 인상', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });

  const shots: { ms: number; path: string }[] = [];
  const t0 = Date.now();

  const capture = setInterval(async () => {
    const ms = Date.now() - t0;
    const path = `tmp/qa/ux/loading/${String(ms).padStart(5, '0')}ms.png`;
    await page.screenshot({ path }).catch(() => {});
    shots.push({ ms, path });
  }, 300);

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  clearInterval(capture);

  console.table(shots);
  // 각 스크린샷을 순서대로 보며 "언제부터 의미 있는 것이 보이는가" 판단
});
```

**진단**

캡처한 스크린샷을 순서대로 보며 판단한다.

```text
[ ] 흰 화면이 1초 이상 지속되는가?
[ ] 첫 콘텐츠가 나타난 뒤 레이아웃이 크게 흔들리는가?
[ ] 스켈레톤이 실제 콘텐츠와 형태가 다른가?
[ ] 로딩 중에도 무엇을 기다리는지 알 수 있는가?
[ ] 이미지가 뒤늦게 나타나며 텍스트를 밀어내는가?
```

**PASS / FAIL**

- PASS: 1초 이내에 의미 있는 콘텐츠가 나타난다. 레이아웃 이동이 없다. 스켈레톤이 실제 형태와 일치한다.
- FAIL: 2초 이상 빈 화면(S2), 큰 레이아웃 이동(S2), 스켈레톤과 실제 형태 불일치(S3).

**FIX**

```tsx
// ❌ 전체를 하나의 Suspense로 감싸면 가장 느린 것에 맞춰 전부 대기한다
<Suspense fallback={<FullPageSpinner />}>
  <Dashboard />
</Suspense>
```

```tsx
// ✅ 정적인 것은 즉시, 느린 것만 개별 대기
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 서버에서 즉시 렌더 — 사용자는 곧바로 맥락을 파악한다 */}
      <header>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-muted-foreground">이번 주 팀 현황</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 각 카드가 독립적으로 도착한다 */}
        <Suspense fallback={<MetricCardSkeleton />}><RevenueCard /></Suspense>
        <Suspense fallback={<MetricCardSkeleton />}><UsersCard /></Suspense>
        <Suspense fallback={<MetricCardSkeleton />}><ChurnCard /></Suspense>
        <Suspense fallback={<MetricCardSkeleton />}><SignupsCard /></Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}><TrendChart /></Suspense>
    </div>
  );
}
```

```tsx
// ✅ 스켈레톤이 실제 형태와 일치해야 이동이 없다
function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      {/* 실제 카드의 라벨 위치·크기와 동일 */}
      <Skeleton className="h-4 w-24" />
      {/* 실제 숫자의 폰트 크기와 동일한 높이 */}
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}
```

스켈레톤의 목적은 "로딩 중임을 알리는 것"이 아니라 **"최종 레이아웃을 미리 확보하는 것"**이다. 크기가 다르면 스켈레톤을 쓰는 이유가 사라진다.

---

## 9. 온보딩과 빈 상태

### UX-ONB-01 — 빈 상태 설계

**WHY**
모든 사용자는 데이터가 0인 상태에서 시작한다. 그런데 설계는 대개 데이터가 채워진 상태를 기준으로 이뤄져서, 빈 상태는 "데이터가 없습니다"라는 한 줄로 남는다. 이 화면이 신규 사용자의 첫 경험이며, 여기서 다음 행동을 알 수 없으면 이탈한다.

**DETECT**

```bash
# 빈 상태 처리 탐색
rg -n "length === 0|length > 0 \?|isEmpty|\.length\s*\?" src --glob "*.tsx" | head -20
rg -n "데이터가 없|항목이 없|비어 있|아직 없|No data|Empty" src --glob "*.tsx" | head -20
rg -n "EmptyState|<Empty" src/components --glob "*.tsx" | head
```

```ts
// 모든 목록 화면의 빈 상태를 강제로 만들어 캡처
test('빈 상태 감사', async ({ page }) => {
  const listRoutes = ['/reports', '/team/members', '/data/sources', '/settings/api-keys'];

  for (const route of listRoutes) {
    // 빈 응답을 강제
    await page.route('**/api/**', r =>
      r.fulfill({ json: { rows: [], items: [], data: [], total: 0 } }));

    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const name = route.replace(/\//g, '-');
    await page.screenshot({ path: `tmp/qa/ux/empty${name}.png`, fullPage: true });

    // 빈 상태에 행동 유도가 있는가
    const actions = await page.getByRole('button').or(page.getByRole('link')).count();
    console.log(`${route}: 액션 ${actions}개`);
  }
});
```

**진단**

각 빈 상태에서 확인한다.

```text
[ ] 왜 비어 있는지 설명하는가? (아직 안 만듦 / 필터 결과 / 권한 없음 / 오류)
[ ] 여기서 무엇을 할 수 있는지 알려주는가?
[ ] 행동 버튼이 있는가?
[ ] 이 기능이 왜 유용한지 알려주는가?
[ ] 예시나 템플릿을 제공하는가?
```

**PASS / FAIL**

- PASS: 빈 상태가 원인을 설명하고, 명확한 다음 행동을 제시한다. 첫 항목 생성이 쉽다.
- FAIL: "데이터 없음"만 표시(S2 — 신규 사용자 상향 시 **S1**), 행동 수단 없음(S2), 원인 구분 없음(S2).

**FIX**

**빈 상태는 네 종류이며 각각 다르게 처리해야 한다.**

```tsx
// ✅ 빈 상태의 원인을 구분한다
type EmptyReason = 'first-time' | 'filtered' | 'no-permission' | 'error';

function ReportsList({ reports, filters, error, canCreate }: Props) {
  if (error) {
    return <ErrorEmptyState error={error} onRetry={refetch} />;
  }
  if (reports.length === 0 && hasActiveFilters(filters)) {
    return <FilteredEmptyState filters={filters} onClear={clearFilters} />;
  }
  if (reports.length === 0 && !canCreate) {
    return <NoPermissionEmptyState />;
  }
  if (reports.length === 0) {
    return <FirstTimeEmptyState />;
  }
  return <ReportGrid reports={reports} />;
}
```

**1. 첫 사용 — 가장 중요한 빈 상태**

```tsx
function FirstTimeEmptyState() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <FileText className="size-6 text-primary" aria-hidden />
      </div>

      <h2 className="mt-4 text-lg font-semibold">첫 리포트를 만들어보세요</h2>
      <p className="mt-2 text-muted-foreground">
        데이터 소스를 연결하면 매주 자동으로 요약 리포트가 생성됩니다.
        처음 만드는 데 2분이면 충분합니다.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/reports/new">리포트 만들기</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/reports/templates">템플릿에서 시작</Link>
        </Button>
      </div>

      {/* 예시를 보여주면 결과를 상상할 수 있다 */}
      <div className="mt-10 text-left">
        <p className="mb-3 text-sm font-medium">이런 리포트를 만들 수 있습니다</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {EXAMPLE_TEMPLATES.map(t => (
            <Link
              key={t.id}
              href={`/reports/new?template=${t.id}`}
              className="rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-accent/50"
            >
              <p className="text-sm font-medium">{t.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

템플릿을 제시하면 "무엇을 만들어야 할지 모르겠다"는 백지 상태의 부담이 사라진다.

**2. 필터 결과 없음 — 데이터가 없는 것이 아니다**

```tsx
function FilteredEmptyState({ filters, onClear }: Props) {
  return (
    <div className="py-12 text-center">
      <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 font-medium">조건에 맞는 리포트가 없습니다</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {describeFilters(filters)} 조건을 만족하는 항목이 없습니다.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        필터 해제하고 전체 보기
      </Button>
    </div>
  );
}
```

첫 사용 빈 상태와 이것을 구분하지 않으면, 필터를 걸어둔 기존 사용자에게 "첫 리포트를 만들어보세요"가 보인다. 이는 사용자를 혼란스럽게 하고 제품이 데이터를 잃었다고 오해하게 만든다.

**3. 오류 — 재시도 수단이 필요하다**

```tsx
function ErrorEmptyState({ error, onRetry }: Props) {
  return (
    <div className="py-12 text-center">
      <AlertCircle className="mx-auto size-8 text-destructive" aria-hidden />
      <h3 className="mt-3 font-medium">리포트를 불러오지 못했습니다</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onRetry}>다시 시도</Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/help/contact">문제 신고</Link>
        </Button>
      </div>
      {error.traceId && (
        <p className="mt-3 text-xs text-muted-foreground">참조 코드: {error.traceId}</p>
      )}
    </div>
  );
}
```

**REGRESSION**

```ts
test('모든 목록 빈 상태에 행동 수단이 있다', async ({ page }) => {
  const routes = ['/reports', '/team/members', '/data/sources'];

  for (const route of routes) {
    await page.route('**/api/**', r => r.fulfill({ json: { rows: [], total: 0 } }));
    await page.goto(route);

    const main = page.getByRole('main');
    const actions = await main.getByRole('button').or(main.getByRole('link')).count();
    expect(actions, `${route} 빈 상태에 행동 수단 없음`).toBeGreaterThan(0);

    // "데이터 없음"만 있는지 확인
    const text = (await main.textContent()) ?? '';
    expect(text.length, `${route} 빈 상태 설명 부족`).toBeGreaterThan(30);
  }
});
```

---

### UX-ONB-02 — 첫 성공까지의 경로

**WHY**
사용자가 제품을 계속 쓸지는 첫 세션에서 "성공 경험"을 했는지에 크게 좌우된다. 리포트 도구라면 첫 리포트를 만들어봐야 하고, 협업 도구라면 팀원과 무언가를 공유해봐야 한다. 이 경험을 **활성화(Activation)**라 하며, 여기 도달하지 못한 사용자는 대부분 돌아오지 않는다.

**DETECT**

```bash
# 온보딩 관련 코드
rg -n "onboarding|checklist|getting.?started|tour|walkthrough" src app --glob "*.tsx" | head -20
rg -n "hasCompletedOnboarding|onboardingStep|firstLogin" src | head

# 활성화 이벤트 추적
rg -n "track\(|analytics\.|posthog\.|amplitude\." src | rg -i "activat|first|complet" | head
```

**진단**

활성화 순간을 정의하고, 거기까지의 경로를 측정한다.

```markdown
## 활성화 정의

**활성화 = 첫 리포트를 발행하고 결과를 확인한 상태**

근거: 이 지점을 넘긴 사용자의 재방문율이 유의하게 높을 것으로 추정 (NO_DATA — 분석 도구 확인 필요)

## 경로 측정

| 단계 | 필요 행동 | 클릭 | 이탈 위험 | 관찰 |
|------|-----------|------|-----------|------|
| 1 | 데이터 소스 연결 | 6 | **높음** | OAuth 승인 화면에서 권한 목록이 길어 부담 |
| 2 | 리포트 템플릿 선택 | 2 | 낮음 | |
| 3 | 항목 설정 | 8 | 중간 | 기본값이 없어 전부 직접 선택 |
| 4 | 발행 | 2 | 낮음 | |
| **합계** | | **18** | | |
```

**PASS / FAIL**

- PASS: 활성화가 정의되어 있고, 첫 세션 내에 도달 가능하다. 시스템이 그 경로를 안내한다.
- FAIL: 활성화 경로가 안내되지 않음(S2), 첫 세션에 도달 불가(**S1**), 활성화 미정의(S2 — 개선 방향 판단 불가).

**FIX**

**체크리스트 방식 — 진행 상황을 보이게 한다**

```tsx
// ✅ 온보딩 체크리스트
const ONBOARDING_STEPS = [
  {
    id: 'connect-source',
    label: '데이터 소스 연결',
    description: '구글 애널리틱스나 스프레드시트를 연결하세요',
    href: '/data/sources/new',
    estimatedMin: 2,
  },
  {
    id: 'create-report',
    label: '첫 리포트 만들기',
    description: '템플릿을 고르면 바로 시작할 수 있습니다',
    href: '/reports/new',
    estimatedMin: 2,
    requires: 'connect-source',
  },
  {
    id: 'invite-member',
    label: '팀원 초대하기',
    description: '리포트를 함께 볼 사람을 추가하세요',
    href: '/team?invite=1',
    estimatedMin: 1,
    optional: true,
  },
] as const;

function OnboardingChecklist({ completed }: { completed: string[] }) {
  const done = ONBOARDING_STEPS.filter(s => completed.includes(s.id)).length;
  const total = ONBOARDING_STEPS.length;

  if (done === total) return null;   // 완료되면 사라진다

  const remainingMin = ONBOARDING_STEPS
    .filter(s => !completed.includes(s.id))
    .reduce((sum, s) => sum + s.estimatedMin, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">시작하기</CardTitle>
          <span className="text-sm text-muted-foreground">{done}/{total} 완료</span>
        </div>
        <Progress value={(done / total) * 100} className="mt-2" />
        <CardDescription className="mt-2">
          남은 단계는 약 {remainingMin}분이면 끝납니다.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-1">
        {ONBOARDING_STEPS.map(step => {
          const isDone = completed.includes(step.id);
          const isBlocked = step.requires && !completed.includes(step.requires);

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-md p-2',
                isDone && 'opacity-60',
                !isDone && !isBlocked && 'hover:bg-accent/50',
              )}
            >
              <span className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                isDone && 'border-primary bg-primary text-primary-foreground',
              )}>
                {isDone && <Check className="size-3" aria-hidden />}
              </span>

              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', isDone && 'line-through')}>
                  {step.label}
                  {step.optional && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">선택</span>
                  )}
                </p>
                {!isDone && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>

              {!isDone && (
                <Button
                  size="sm"
                  variant={isBlocked ? 'ghost' : 'outline'}
                  disabled={isBlocked}
                  asChild={!isBlocked}
                >
                  {isBlocked ? <span>이전 단계 필요</span> : <Link href={step.href}>시작</Link>}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>

      <CardFooter>
        <Button variant="ghost" size="sm" onClick={dismissOnboarding} className="text-muted-foreground">
          나중에 하기
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**소요 시간을 명시하는 것**이 완료율에 실질적으로 영향을 준다. "약 5분"을 알면 지금 할지 나중에 할지 판단할 수 있다.

**"나중에 하기"를 반드시 제공한다.** 온보딩을 강제하면 자기 방식으로 탐색하고 싶은 사용자가 갇힌다.

**샘플 데이터로 즉시 성공을 경험시킨다**

```tsx
// ✅ 데이터 연결 전에도 결과를 보여준다
function EmptyDashboard() {
  return (
    <div className="space-y-6">
      <Alert>
        <Sparkles className="size-4" aria-hidden />
        <AlertTitle>샘플 데이터로 미리 보는 중입니다</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>데이터 소스를 연결하면 실제 데이터로 바뀝니다.</span>
          <Button size="sm" asChild>
            <Link href="/data/sources/new">데이터 연결하기</Link>
          </Button>
        </AlertDescription>
      </Alert>

      {/* 실제 UI를 샘플 데이터로 렌더 — 사용자가 결과를 상상할 필요가 없다 */}
      <div className="pointer-events-none select-none opacity-75">
        <DashboardView data={SAMPLE_DATA} />
      </div>
    </div>
  );
}
```

---

### UX-ONB-03 — 안내 방식

**WHY**
제품 투어, 툴팁, 코치마크는 흔히 쓰이지만 대부분 효과가 낮다. 사용자는 빨리 넘기고 아무것도 기억하지 못한다. 안내는 **필요한 순간에, 그 자리에서** 제공될 때 효과가 있다.

**DETECT**

```bash
rg -n "driver.js|shepherd|intro.js|reactour|joyride" package.json
rg -n "Tooltip|Popover|coachmark|hint" src/components --glob "*.tsx" | head
rg -n "tour|walkthrough|onboarding.*modal" src --glob "*.tsx" | head
```

**진단**

```text
[ ] 투어가 몇 단계인가? (5단계 초과면 기억되지 않는다)
[ ] 투어를 건너뛸 수 있는가?
[ ] 투어를 다시 볼 수 있는가?
[ ] 투어 대신 그 자리에서 배울 수 있는 설계인가?
[ ] 안내가 사용자의 첫 행동을 방해하는가?
```

**PASS / FAIL**

- PASS: 안내가 맥락 안에서 제공된다. 강제 투어가 없거나 건너뛸 수 있다. 필요할 때 다시 볼 수 있다.
- FAIL: 강제 투어로 진입 차단(S2), 건너뛰기 불가(S2), 안내가 한 번만 보이고 다시 볼 수 없음(S3).

**FIX**

```tsx
// ❌ 진입하자마자 8단계 투어를 강제
<TourProvider steps={EIGHT_STEPS} isOpen={isFirstVisit} canSkip={false} />
```

```tsx
// ✅ 그 기능을 처음 쓰는 순간에, 그 자리에서
function ShareButton({ report }: Props) {
  const [showHint, setShowHint] = useState(false);
  const { hasSeenHint, markSeen } = useFeatureHints();

  return (
    <Popover open={showHint && !hasSeenHint('share')} onOpenChange={setShowHint}>
      <PopoverTrigger asChild>
        <Button variant="outline" onClick={() => setShowHint(true)}>
          <Share2 className="mr-2 size-4" aria-hidden />
          공유
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <p className="text-sm font-medium">링크로 공유하기</p>
        <p className="mt-1 text-sm text-muted-foreground">
          링크를 아는 사람은 누구나 볼 수 있습니다.
          팀원만 볼 수 있게 하려면 아래에서 &lsquo;팀 전용&rsquo;을 선택하세요.
        </p>
        <ShareOptions report={report} />
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => markSeen('share')}
        >
          알겠습니다
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

**설명이 필요 없는 설계가 최선이다.** 툴팁이 많이 필요하다는 것은 인터페이스가 스스로를 설명하지 못한다는 신호다.

```tsx
// ❌ 아이콘만 두고 툴팁으로 설명
<Button variant="ghost" size="icon" title="리포트 복제">
  <Copy className="size-4" />
</Button>

// ✅ 라벨을 함께 표시 (공간이 허용하면)
<Button variant="ghost" size="sm">
  <Copy className="mr-2 size-4" aria-hidden />
  복제
</Button>
```

```tsx
// ✅ 안내를 다시 볼 수 있게 한다
<DropdownMenuItem onSelect={restartOnboarding}>
  <HelpCircle className="mr-2 size-4" aria-hidden />
  시작 가이드 다시 보기
</DropdownMenuItem>
```

---

### UX-ONB-04 — 복귀 사용자 경험

**WHY**
온보딩 논의는 대개 첫 방문에 집중된다. 그러나 2주 만에 돌아온 사용자도 맥락을 잃은 상태다. 그 사이 무슨 일이 있었는지, 무엇이 바뀌었는지 알 수 없으면 다시 탐색해야 한다.

**DETECT**

```bash
rg -n "lastLoginAt|lastSeenAt|lastActiveAt" src prisma | head
rg -n "changelog|whatsnew|release.?note|새로운 기능" src app --glob "*.tsx" | head
rg -n "unread|notification|activity" src/components --glob "*.tsx" | head
```

**진단**

```text
[ ] 마지막 방문 이후 변화를 알 수 있는가?
[ ] 내가 관여한 항목의 변경을 알 수 있는가?
[ ] 새 기능이 추가되었을 때 알 수 있는가?
[ ] 오래 비운 사이 만료·실패한 것이 있으면 알려주는가?
```

**PASS / FAIL**

- PASS: 복귀 시 그동안의 변화를 요약해 보여준다. 조치가 필요한 항목이 강조된다.
- FAIL: 복귀 맥락 제공 없음(S3), 결제 실패 등 중요 변화 미고지(**S1**).

**FIX**

```tsx
// ✅ 복귀 사용자용 요약
function WelcomeBackSummary({ lastVisit, changes }: Props) {
  const daysAway = differenceInDays(new Date(), lastVisit);
  if (daysAway < 3 || !changes.hasAny) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {daysAway}일 만이네요. 그동안 이런 일이 있었습니다
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {/* 조치가 필요한 것을 가장 위에 */}
        {changes.needsAction.map(item => (
          <div key={item.id} className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span className="flex-1">{item.message}</span>
            <Button size="sm" variant="outline" asChild>
              <Link href={item.href}>처리하기</Link>
            </Button>
          </div>
        ))}

        {changes.reportsUpdated > 0 && (
          <p>· 내가 참여한 리포트 {changes.reportsUpdated}건이 업데이트되었습니다</p>
        )}
        {changes.newMembers > 0 && (
          <p>· 팀원 {changes.newMembers}명이 새로 합류했습니다</p>
        )}
        {changes.mentions > 0 && (
          <p>· 댓글에서 {changes.mentions}번 언급되었습니다</p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" onClick={dismiss}>확인했습니다</Button>
      </CardFooter>
    </Card>
  );
}
```

조치 필요 항목을 목록 위쪽에 두고 행동 버튼을 붙이는 것이 핵심이다. 정보만 나열하면 읽고 넘긴다.

---

## 10. 폼과 입력

폼은 사용자가 시스템에 무언가를 주는 지점이며, 마찰이 가장 크게 발생하는 곳이다. 필드 하나, 검증 메시지 하나가 완료율을 바꾼다.

### UX-FORM-01 — 필드 최소화와 순서

**WHY**
필드가 늘어날수록 완료율이 떨어진다. 그런데 단순히 줄이는 것이 답은 아니다. 나중에 반드시 필요한 정보를 안 받으면 나중에 더 큰 마찰이 생긴다. 판단 기준은 **"지금 이 정보가 없으면 다음 단계가 불가능한가"**다.

**DETECT**

```bash
# 폼별 필드 수
for f in $(fd -e tsx . src/app | xargs rg -l "<form|useForm"); do
  count=$(rg -c "<Input|<Select|<Textarea|<Checkbox|<RadioGroup|<Switch" "$f" 2>/dev/null || echo 0)
  echo "$count $f"
done | sort -rn | head -15

# 필수 필드 비율
rg -c "required" src/app/**/page.tsx | sort -t: -k2 -rn | head
```

**진단**

각 필드에 대해 답한다.

```markdown
| 필드 | 필수 | 지금 필요한 이유 | 나중에 받을 수 있나 | 추론 가능한가 | 판정 |
|------|------|------------------|---------------------|---------------|------|
| 이메일 | Y | 계정 식별자 | 아니오 | 아니오 | 유지 |
| 비밀번호 | Y | 인증 | 아니오 | 아니오 | 유지 |
| 이름 | Y | 표시용 | **예** | 이메일에서 부분 추론 | **지연** |
| 회사명 | Y | 청구서 | **예** | 이메일 도메인 | **지연** |
| 전화번호 | Y | 없음 | 예 | 아니오 | **제거** |
| 유입 경로 | Y | 마케팅 분석 | 예 | referrer 헤더 | **자동화** |
```

"지금 필요한 이유"에 "마케팅 분석"이나 "나중에 쓸 수도 있어서"가 들어가면 그 필드는 제거 또는 지연 대상이다.

**PASS / FAIL**

- PASS: 모든 필수 필드가 즉시 필요하다. 선택 필드가 명시된다. 순서가 논리적이다.
- FAIL: 불필요한 필수 필드(S2), 선택 필드가 필수처럼 보임(S2), 순서가 무작위(S3).

**FIX**

```tsx
// ❌ 필수/선택 구분이 없다 — 사용자는 전부 필수로 인식한다
<Input name="name" label="이름" />
<Input name="phone" label="전화번호" />
<Input name="company" label="회사명" />
```

```tsx
// ✅ 선택 필드를 명시하고, 왜 물어보는지 설명한다
<div className="space-y-4">
  <Field>
    <Label htmlFor="name">이름</Label>
    <Input id="name" name="name" required autoComplete="name" />
  </Field>

  <Field>
    <Label htmlFor="phone">
      전화번호
      <span className="ml-1 font-normal text-muted-foreground">(선택)</span>
    </Label>
    <Input id="phone" name="phone" type="tel" autoComplete="tel"
           aria-describedby="phone-help" />
    <p id="phone-help" className="text-sm text-muted-foreground">
      결제 문제가 생겼을 때만 연락합니다. 마케팅에는 사용하지 않습니다.
    </p>
  </Field>
</div>
```

선택 필드에 "왜 물어보는지"를 쓰면 응답률이 올라간다. 아무 설명 없이 전화번호를 요구하면 대부분 건너뛴다.

**필드 순서는 사용자의 사고 순서를 따른다**

```text
❌ 우편번호 → 이름 → 상세주소 → 이메일 → 도시
✅ 이름 → 이메일 → 우편번호 → 도시(자동) → 상세주소
```

주소는 큰 단위에서 작은 단위로, 개인 정보는 식별 정보부터. 한국 주소는 우편번호 검색이 먼저 오는 것이 관습이다.

**자동 완성을 반드시 지원한다**

```tsx
// ✅ autoComplete 속성 — 사용자의 입력 시간을 크게 줄인다
<Input name="email" type="email" autoComplete="email" />
<Input name="name" autoComplete="name" />
<Input name="phone" type="tel" autoComplete="tel" />
<Input name="address" autoComplete="street-address" />
<Input name="postalCode" autoComplete="postal-code" />
<Input name="cardNumber" autoComplete="cc-number" inputMode="numeric" />
<Input name="password" type="password" autoComplete="current-password" />
<Input name="newPassword" type="password" autoComplete="new-password" />
```

`autoComplete="new-password"`를 쓰면 브라우저가 강력한 비밀번호를 제안한다. `off`로 막으면 사용자가 약한 비밀번호를 쓰게 되어 보안이 오히려 나빠진다.

**REGRESSION**

```ts
test('폼 필드에 autoComplete가 설정되어 있다', async ({ page }) => {
  await page.goto('/auth/signup');

  const missing = await page.locator('input:not([type="hidden"]):not([type="checkbox"])')
    .evaluateAll(inputs =>
      inputs
        .filter(i => !i.getAttribute('autocomplete'))
        .map(i => i.getAttribute('name') ?? i.id ?? '(unnamed)'));

  expect(missing, `autoComplete 누락:\n${missing.join(', ')}`).toEqual([]);
});
```

---

### UX-FORM-02 — 라벨과 입력 안내

**WHY**
플레이스홀더를 라벨 대신 쓰면, 입력을 시작하는 순간 무엇을 입력하는 칸이었는지 사라진다. 검토할 때 각 값이 무엇인지 알 수 없고, 스크린리더 지원도 불완전하다. 이것은 접근성 문제이자 사용성 문제다.

**DETECT**

```bash
# 라벨 없이 플레이스홀더만 쓰는 입력
rg -n "<Input[^>]*placeholder" src app --glob "*.tsx" | rg -v "aria-label|<Label|id=" | head -20

# 라벨-입력 연결 확인
rg -n "<Label" src app --glob "*.tsx" | rg -v "htmlFor" | head
```

```ts
test('모든 입력에 접근 가능한 라벨이 있다', async ({ page }) => {
  const routes = ['/auth/signup', '/reports/new', '/settings/profile'];

  for (const route of routes) {
    await page.goto(route);

    const unlabeled = await page.locator('input:not([type="hidden"]), select, textarea')
      .evaluateAll(els => els.filter(el => {
        const id = el.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasAriaLabelledby = el.getAttribute('aria-labelledby');
        const wrappedInLabel = el.closest('label');
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledby && !wrappedInLabel;
      }).map(el => el.getAttribute('name') ?? el.outerHTML.slice(0, 80)));

    expect(unlabeled, `${route} 라벨 없는 입력:\n${unlabeled.join('\n')}`).toEqual([]);
  }
});
```

**PASS / FAIL**

- PASS: 모든 입력에 시각적 라벨이 있고 `htmlFor`로 연결된다. 플레이스홀더는 예시로만 쓰인다.
- FAIL: 플레이스홀더가 라벨 역할(S2 — 접근성 + 사용성), 라벨 미연결(S2).

**FIX**

```tsx
// ❌ 플레이스홀더가 라벨 역할 — 입력 시작하면 사라진다
<Input placeholder="이메일 주소" name="email" />
<Input placeholder="YYYY-MM-DD" name="birthDate" />
```

```tsx
// ✅ 라벨 + 플레이스홀더(형식 예시) + 도움말
<div className="space-y-1.5">
  <Label htmlFor="birthDate">생년월일</Label>
  <Input
    id="birthDate"
    name="birthDate"
    placeholder="1990-01-15"
    inputMode="numeric"
    aria-describedby="birthDate-help"
  />
  <p id="birthDate-help" className="text-sm text-muted-foreground">
    만 14세 이상만 가입할 수 있습니다.
  </p>
</div>
```

플레이스홀더는 **입력 예시**로만 쓴다. `YYYY-MM-DD` 같은 형식 표기보다 `1990-01-15` 같은 실제 예시가 이해하기 쉽다.

**입력 형식 제약은 미리 알린다**

```tsx
// ❌ 제출 후에야 규칙을 알려준다
<Input type="password" name="password" />
{error && <p className="text-destructive">비밀번호는 8자 이상, 특수문자를 포함해야 합니다</p>}
```

```tsx
// ✅ 규칙을 미리 보여주고 실시간으로 충족 여부를 표시
function PasswordField() {
  const [value, setValue] = useState('');
  const rules = [
    { id: 'length', label: '8자 이상', test: (v: string) => v.length >= 8 },
    { id: 'number', label: '숫자 포함', test: (v: string) => /\d/.test(v) },
    { id: 'special', label: '특수문자 포함', test: (v: string) => /[^\w\s]/.test(v) },
  ];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="password">비밀번호</Label>
      <Input
        id="password"
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={e => setValue(e.target.value)}
        aria-describedby="password-rules"
      />
      <ul id="password-rules" className="space-y-0.5 text-sm">
        {rules.map(rule => {
          const ok = rule.test(value);
          return (
            <li key={rule.id} className={cn('flex items-center gap-1.5',
              ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
              {ok
                ? <Check className="size-3.5" aria-hidden />
                : <Circle className="size-3.5" aria-hidden />}
              <span>{rule.label}</span>
              <span className="sr-only">{ok ? '충족' : '미충족'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

`sr-only`로 충족 여부를 텍스트로 제공하면 색과 아이콘에 의존하지 않는다.

**입력 방식을 최적화한다**

```tsx
// ✅ inputMode로 모바일 키보드를 최적화
<Input type="text" inputMode="numeric" pattern="[0-9]*" name="zipCode" />   {/* 숫자 키패드 */}
<Input type="email" inputMode="email" name="email" />                       {/* @ 포함 키보드 */}
<Input type="tel" inputMode="tel" name="phone" />                           {/* 전화 키패드 */}
<Input type="url" inputMode="url" name="website" />                         {/* .com 키 */}
<Input type="search" inputMode="search" name="q" />                         {/* 검색 키 */}
```

`type="number"`는 스피너가 붙고 스크롤로 값이 바뀌는 문제가 있어, 우편번호·카드번호 같은 "숫자로 된 문자열"에는 부적합하다. `inputMode="numeric"`을 쓴다.

---

### UX-FORM-03 — 검증 시점과 방식

**WHY**
너무 이른 검증(입력 첫 글자에 "이메일 형식이 아닙니다")은 아직 입력 중인 사용자를 방해하고 불쾌하게 한다. 너무 늦은 검증(제출 후 전체 오류)은 여러 번 왕복하게 만든다. 시점 선택이 경험을 크게 좌우한다.

**DETECT**

```bash
rg -n "mode:\s*['\"](onChange|onBlur|onSubmit|onTouched|all)" src --glob "*.tsx"
rg -n "reValidateMode" src --glob "*.tsx"
rg -n "onChange.*validate|validateOnChange" src | head
```

**진단**

각 폼에서 시도한다.

```text
[ ] 첫 글자 입력에 오류가 뜨는가? (조기 검증 — 나쁨)
[ ] 필드를 벗어날 때 검증되는가? (적절)
[ ] 오류를 수정하는 동안 즉시 사라지는가? (적절)
[ ] 제출 시 첫 오류 필드로 이동하는가?
[ ] 오류 메시지가 필드 옆에 있는가, 상단에 몰려 있는가?
[ ] 서버 검증 오류도 해당 필드에 표시되는가?
```

**PASS / FAIL**

- PASS: 최초 검증은 blur 또는 제출 시, 재검증은 입력 중 즉시. 오류가 필드 옆에 표시된다. 제출 시 첫 오류로 포커스가 이동한다.
- FAIL: 입력 중 조기 검증(S2 — 방해), 제출 후 상단에만 오류 표시(S2), 포커스 이동 없음(S2).

**FIX**

```ts
// ✅ react-hook-form 권장 설정
const form = useForm<SignupInput>({
  resolver: zodResolver(signupSchema),
  mode: 'onTouched',        // 최초 검증: 필드를 벗어난 뒤
  reValidateMode: 'onChange', // 재검증: 수정하는 즉시 (오류가 빨리 사라진다)
});
```

이 조합이 대부분의 경우 최선이다. 사용자가 입력 중일 때는 방해하지 않고, 오류를 고치는 순간에는 즉시 반응한다.

```tsx
// ✅ 오류를 필드 옆에 표시하고 접근성 속성을 연결
function FormField({ name, label, ...props }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        {...register(name)}
        {...props}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={cn(error && 'border-destructive focus-visible:ring-destructive')}
      />
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{String(error.message)}</span>
        </p>
      )}
    </div>
  );
}
```

`aria-invalid`와 `aria-describedby` 연결이 없으면 스크린리더 사용자는 오류를 인지하지 못한다.

```tsx
// ✅ 제출 시 첫 오류로 포커스 이동 + 요약 제공
const onSubmit = form.handleSubmit(
  async values => { /* … */ },
  errors => {
    const firstField = Object.keys(errors)[0];
    const el = document.querySelector<HTMLElement>(`[name="${firstField}"]`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  },
);
```

```tsx
// ✅ 오류가 많으면 상단 요약도 제공 (필드별 표시와 함께)
{Object.keys(errors).length > 2 && (
  <Alert variant="destructive" role="alert">
    <AlertTitle>{Object.keys(errors).length}개 항목을 확인해주세요</AlertTitle>
    <AlertDescription>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {Object.entries(errors).map(([field, err]) => (
          <li key={field}>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => document.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()}
            >
              {FIELD_LABELS[field]}: {String(err?.message)}
            </button>
          </li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

요약의 각 항목을 클릭하면 해당 필드로 이동하게 만들면, 긴 폼에서 특히 유용하다.

**서버 오류도 필드에 연결한다**

```tsx
// ✅ 서버 검증 결과를 필드 오류로 매핑
const onSubmit = form.handleSubmit(async values => {
  const result = await signUp(values);

  if (!result.ok) {
    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as keyof SignupInput, { type: 'server', message });
      }
      // 첫 오류 필드로 이동
      const first = Object.keys(result.fieldErrors)[0];
      form.setFocus(first as keyof SignupInput);
      return;
    }
    form.setError('root', { message: result.message });
  }
});
```

"이미 사용 중인 이메일입니다"가 폼 상단이 아니라 이메일 필드 아래에 나타나야 사용자가 어디를 고쳐야 할지 안다.

---

### UX-FORM-04 — 제출과 결과

**WHY**
제출 버튼을 눌렀는데 아무 반응이 없으면 사용자는 다시 누른다. 결제 폼이라면 중복 결제가 발생한다. 반대로 성공했는데 확인이 없으면 성공했는지 모르고 다시 시도한다.

**DETECT**

```bash
rg -n "isSubmitting|isPending|useFormStatus|disabled=\{" src --glob "*.tsx" | head -20
rg -n "toast|Toast|sonner" src --glob "*.tsx" | head
rg -n "type=\"submit\"" src --glob "*.tsx" | wc -l
```

**진단**

```ts
test('제출 중 중복 제출이 방지된다', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => {
    if (r.method() === 'POST') requests.push(r.url());
  });

  // 느린 응답 시뮬레이션
  await page.route('**/api/reports', async r => {
    await new Promise(res => setTimeout(res, 3000));
    await r.continue();
  });

  await page.goto('/reports/new');
  await page.getByLabel('제목').fill('테스트');

  const submit = page.getByRole('button', { name: '만들기' });
  await submit.click();

  // 즉시 비활성화되는가
  await expect(submit).toBeDisabled({ timeout: 500 });

  // 강제로 여러 번 눌러도
  await submit.click({ force: true }).catch(() => {});
  await submit.click({ force: true }).catch(() => {});

  await expect(page.getByRole('status')).toContainText(/생성|완료/, { timeout: 10_000 });
  expect(requests.length, `POST 요청 ${requests.length}회 — 중복 제출`).toBe(1);
});
```

**PASS / FAIL**

- PASS: 제출 즉시 버튼이 비활성화되고 진행 표시가 나타난다. 성공/실패가 명확히 전달된다. 중복 제출이 불가능하다.
- FAIL: 중복 제출 가능(**S1** — 결제 경로면 **S0**), 진행 표시 없음(S2), 결과 미고지(S2).

**FIX**

```tsx
// ✅ Server Action + useFormStatus
'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
      {pending ? '저장 중…' : children}
    </Button>
  );
}
```

버튼 텍스트를 "저장 중…"으로 바꾸면 스피너를 못 보는 사용자에게도 상태가 전달된다.

```tsx
// ✅ useActionState로 결과 처리
'use client';

import { useActionState } from 'react';

export function ReportForm() {
  const [state, formAction] = useActionState(createReport, { status: 'idle' });

  useEffect(() => {
    if (state.status === 'success') {
      toast({ title: '리포트를 만들었습니다', description: state.report.title });
      router.push(`/reports/${state.report.id}`);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>저장하지 못했습니다</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* 필드들 */}

      <SubmitButton>리포트 만들기</SubmitButton>
    </form>
  );
}
```

**성공 후 다음 행동을 제시한다**

```tsx
// ❌ "저장되었습니다"만 표시 — 다음에 뭘 하지?
toast({ title: '저장되었습니다' });

// ✅ 결과를 확인하거나 이어서 작업할 수단을 제공
toast({
  title: '리포트를 만들었습니다',
  description: `'${report.title}'이(가) 저장되었습니다.`,
  action: (
    <ToastAction altText="리포트 보기" onClick={() => router.push(`/reports/${report.id}`)}>
      보기
    </ToastAction>
  ),
});
```

**연속 작업을 고려한다**

멤버 초대처럼 여러 번 반복할 작업이면, 성공 후 폼을 초기화하고 계속 입력할 수 있게 한다.

```tsx
// ✅ 반복 작업에 최적화
<DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
  <Button variant="ghost" onClick={close}>닫기</Button>
  <Button variant="outline" onClick={submitAndContinue}>
    초대하고 계속 추가
  </Button>
  <Button onClick={submitAndClose}>초대하고 닫기</Button>
</DialogFooter>
```

한 명씩 초대할 때마다 대화상자를 다시 여는 것은 큰 마찰이다.

---

### UX-FORM-05 — 입력 지원과 관대함

**WHY**
사용자는 실수한다. 전화번호에 하이픈을 넣고, 카드번호에 공백을 넣고, 이메일 앞뒤에 공백이 붙는다. 시스템이 이를 거부하면 사용자는 "왜 안 되지?"라고 생각한다. 기계가 처리할 수 있는 것을 사람에게 요구하지 않아야 한다.

**DETECT**

```bash
rg -n "\.trim\(\)|replace\(/\\s/g" src/lib src/app --glob "*.ts" | head
rg -n "z\.string\(\)" src --glob "*.ts" | rg -v "trim|transform" | head -20
rg -n "pattern=|maxLength=" src --glob "*.tsx" | head
```

**진단**

관대함을 실제로 시험한다.

```markdown
| 입력 | 값 | 결과 | 판정 |
|------|-----|------|------|
| 이메일 | ` user@example.com ` | 오류 | **불필요한 거부** |
| 이메일 | `USER@EXAMPLE.COM` | 정상 | OK |
| 전화 | `010-1234-5678` | 오류 (숫자만 허용) | **불필요한 거부** |
| 전화 | `01012345678` | 정상 | OK |
| 카드 | `4242 4242 4242 4242` | 오류 | **불필요한 거부** |
| URL | `example.com` | 오류 (프로토콜 필수) | **개선 여지** |
| 금액 | `1,000` | 오류 | **불필요한 거부** |
```

**PASS / FAIL**

- PASS: 공백·구분자·대소문자 차이를 시스템이 정규화한다. 사용자가 형식을 맞추지 않아도 된다.
- FAIL: 정규화 가능한 입력을 거부(S2 — 불필요한 마찰), 오류 메시지가 형식만 반복(S2).

**FIX**

```ts
// ✅ 스키마에서 정규화한다
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('이메일 주소를 다시 확인해주세요'),

  phone: z.string()
    .transform(v => v.replace(/[\s()-]/g, ''))    // 하이픈·공백·괄호 제거
    .pipe(z.string().regex(/^01[0-9]\d{7,8}$/, '휴대전화 번호를 확인해주세요')),

  amount: z.string()
    .transform(v => v.replace(/,/g, ''))          // 천 단위 구분자 제거
    .pipe(z.coerce.number().positive('0보다 큰 금액을 입력해주세요')),

  website: z.string()
    .trim()
    .transform(v => (v && !/^https?:\/\//.test(v) ? `https://${v}` : v))   // 프로토콜 보완
    .pipe(z.string().url('올바른 주소를 입력해주세요').or(z.literal(''))),

  cardNumber: z.string()
    .transform(v => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{13,19}$/, '카드 번호를 확인해주세요')),
});
```

**입력 중 자동 포맷팅으로 가독성을 돕는다**

```tsx
// ✅ 카드번호를 4자리씩 끊어 보여준다
function CardNumberInput({ value, onChange }: Props) {
  const formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();

  return (
    <Input
      inputMode="numeric"
      autoComplete="cc-number"
      value={formatted}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 19))}
      placeholder="4242 4242 4242 4242"
      aria-label="카드 번호"
    />
  );
}
```

포맷은 표시용이고 저장은 정규화된 값으로 한다. 커서 위치가 튀지 않도록 주의가 필요하다.

**붙여넣기를 지원한다**

```tsx
// ✅ 인증 코드 6자리를 통째로 붙여넣을 수 있게
function OtpInput({ length = 6, onComplete }: Props) {
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length === length) {
      setDigits(pasted.split(''));
      onComplete(pasted);
    }
  };

  return <div onPaste={handlePaste}>{/* … */}</div>;
}
```

인증 코드를 한 칸씩 입력하게 만들면서 붙여넣기를 막으면, 문자에서 코드를 복사해 온 사용자가 6번 타이핑해야 한다.

**최대 길이를 강제로 자르지 않는다**

```tsx
// ❌ maxLength로 자르면 사용자는 왜 안 써지는지 모른다
<Input maxLength={50} name="title" />

// ✅ 남은 글자 수를 보여주고, 초과는 검증으로 안내
<div className="space-y-1.5">
  <div className="flex items-baseline justify-between">
    <Label htmlFor="title">제목</Label>
    <span className={cn('text-xs',
      value.length > 50 ? 'text-destructive' : 'text-muted-foreground')}>
      {value.length}/50
    </span>
  </div>
  <Input id="title" value={value} onChange={e => setValue(e.target.value)}
         aria-invalid={value.length > 50} />
  {value.length > 50 && (
    <p role="alert" className="text-sm text-destructive">
      제목은 50자 이내로 입력해주세요. 현재 {value.length}자입니다.
    </p>
  )}
</div>
```

---

## 11. 피드백과 시스템 상태

### UX-FB-01 — 반응 지연과 체감

**WHY**
사람의 인지에는 대략적인 시간 경계가 있다. 100ms 이내의 반응은 즉각적으로 느껴지고, 1초까지는 흐름이 유지되며, 10초를 넘으면 주의가 다른 곳으로 간다. 이 경계를 무시하면 실제 성능과 무관하게 제품이 느리다고 인식된다.

| 구간 | 사용자 인지 | 필요한 조치 |
|------|-------------|-------------|
| ~100ms | 즉각적 | 없음 (즉시 반영) |
| 100ms~1s | 지연 인지, 흐름 유지 | 시각적 반응(버튼 상태 변화) |
| 1s~10s | 기다림 인지 | 로딩 표시, 가능하면 진행률 |
| 10s~ | 주의 이탈 | 진행률 + 남은 시간 + 다른 작업 허용 |

**DETECT**

```ts
// tests/ux/response-time.spec.ts
test('주요 상호작용의 반응 시간', async ({ page }) => {
  await page.goto('/reports');

  const interactions = [
    { name: '필터 적용', action: async () => {
      await page.getByRole('combobox', { name: '상태' }).click();
      await page.getByRole('option', { name: '발행됨' }).click();
    }},
    { name: '검색', action: async () => {
      await page.getByRole('searchbox').fill('분기');
    }},
    { name: '정렬 변경', action: async () => {
      await page.getByRole('columnheader', { name: '수정일' }).click();
    }},
  ];

  for (const { name, action } of interactions) {
    const t0 = Date.now();
    await action();

    // 첫 시각적 반응까지
    const firstFeedback = await page.waitForFunction(() => {
      return document.querySelector('[aria-busy="true"], [data-loading], .animate-pulse') !== null
        || document.querySelector('[data-state="loading"]') !== null;
    }, null, { timeout: 2000 }).then(() => Date.now() - t0).catch(() => -1);

    // 최종 결과까지
    await page.waitForLoadState('networkidle');
    const complete = Date.now() - t0;

    console.log(`${name}: 첫 반응 ${firstFeedback}ms, 완료 ${complete}ms`);

    if (complete > 1000 && firstFeedback === -1) {
      console.error(`❌ ${name}: ${complete}ms 걸리는데 로딩 표시가 없다`);
    }
  }
});
```

**PASS / FAIL**

- PASS: 100ms 초과 작업에 시각적 반응이 있다. 1초 초과에 로딩 표시가 있다. 10초 초과에 진행률과 남은 시간이 있다.
- FAIL: 1초 이상 반응 없음(S2 — 사용자가 다시 클릭), 10초 이상 진행률 없음(S2), 결제·저장에서 반응 없음(**S1**).

**FIX**

```tsx
// ✅ 즉각 반응: 낙관적 업데이트
'use client';

import { useOptimistic, startTransition } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, update: { id: string; done: boolean }) =>
      state.map(t => (t.id === update.id ? { ...t, done: update.done } : t)),
  );

  const toggle = (todo: Todo) => {
    startTransition(async () => {
      addOptimistic({ id: todo.id, done: !todo.done });   // 즉시 반영
      await updateTodo(todo.id, { done: !todo.done });    // 서버 동기화
    });
  };

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id}>
          <Checkbox checked={todo.done} onCheckedChange={() => toggle(todo)} />
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
```

낙관적 업데이트는 **실패 시 롤백과 안내**가 반드시 따라야 한다. 조용히 되돌리면 사용자는 자기 조작이 반영된 줄 안다.

```tsx
// ✅ 실패 시 롤백을 알린다
startTransition(async () => {
  addOptimistic({ id: todo.id, done: !todo.done });
  const result = await updateTodo(todo.id, { done: !todo.done });
  if (!result.ok) {
    toast({
      variant: 'destructive',
      title: '변경하지 못했습니다',
      description: '연결을 확인하고 다시 시도해주세요.',
      action: <ToastAction altText="다시 시도" onClick={() => toggle(todo)}>다시 시도</ToastAction>,
    });
  }
});
```

```tsx
// ✅ 긴 작업: 진행률 + 남은 시간 + 백그라운드 전환
function ImportProgress({ jobId }: { jobId: string }) {
  const { data: job } = useJobStatus(jobId, { pollInterval: 1000 });
  if (!job) return null;

  const pct = Math.round((job.processed / job.total) * 100);
  const etaSec = job.processed > 0
    ? Math.round(((Date.now() - job.startedAt) / job.processed) * (job.total - job.processed) / 1000)
    : null;

  return (
    <div role="status" aria-live="polite" className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">데이터를 가져오는 중</p>
        <span className="text-sm text-muted-foreground">{pct}%</span>
      </div>

      <Progress value={pct} aria-label="가져오기 진행률" />

      <p className="text-sm text-muted-foreground">
        {job.processed.toLocaleString()}/{job.total.toLocaleString()}건 처리
        {etaSec !== null && etaSec > 5 && ` · 약 ${formatDuration(etaSec)} 남음`}
      </p>

      {/* 10초 이상 걸리면 기다리지 않아도 되게 한다 */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={runInBackground}>
          백그라운드에서 계속
        </Button>
        <Button variant="ghost" size="sm" onClick={cancelJob}>
          취소
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        완료되면 알림으로 알려드립니다. 다른 작업을 계속하셔도 됩니다.
      </p>
    </div>
  );
}
```

긴 작업에서 **사용자를 붙잡아두지 않는 것**이 중요하다. 백그라운드 전환과 완료 알림이 있으면 10분짜리 작업도 문제가 되지 않는다.

---

### UX-FB-02 — 알림 유형과 지속 시간

**WHY**
모든 피드백을 토스트로 처리하면 중요한 것과 사소한 것이 구분되지 않는다. 반대로 사소한 성공까지 모달로 확인받게 하면 흐름이 끊긴다. 정보의 중요도와 필요한 지속 시간에 따라 형태를 골라야 한다.

| 유형 | 적합한 상황 | 지속 |
|------|-------------|------|
| **인라인 표시** | 조작한 요소 자체의 상태 변화 | 영구 |
| **토스트** | 성공 확인, 되돌리기 제공 | 4~7초 |
| **인라인 알림(Alert)** | 화면 전체에 영향, 조치 필요 | 영구 |
| **배너** | 계정·결제 등 전역 상태 | 조치까지 영구 |
| **모달** | 진행 차단, 결정 필요 | 사용자 응답까지 |

**DETECT**

```bash
rg -n "toast\(|<Toast|sonner" src --glob "*.tsx" | wc -l
rg -n "duration:" src --glob "*.tsx" | rg -i "toast" | head
rg -n "<Dialog|<AlertDialog|Modal" src --glob "*.tsx" | wc -l
rg -n "<Alert |<Banner" src --glob "*.tsx" | wc -l
```

**진단**

```text
[ ] 성공 토스트가 너무 자주 뜨는가? (모든 저장마다)
[ ] 중요한 오류가 토스트로 사라지는가?
[ ] 토스트가 화면 콘텐츠를 가리는가?
[ ] 여러 토스트가 쌓이는가?
[ ] 되돌리기가 필요한 작업에 토스트 시간이 충분한가?
[ ] 모달이 단순 정보 전달에 쓰이는가?
```

**PASS / FAIL**

- PASS: 피드백 형태가 중요도에 맞다. 조치가 필요한 것은 사라지지 않는다. 토스트가 콘텐츠를 가리지 않는다.
- FAIL: 중요 오류가 토스트로 사라짐(S2), 모달 남용으로 흐름 차단(S2), 토스트 과다(S3).

**FIX**

```tsx
// ❌ 모든 것을 토스트로
toast({ title: '필터가 적용되었습니다' });        // 화면에 이미 보인다 — 불필요
toast({ title: '저장되었습니다' });                // 적절
toast({ title: '결제에 실패했습니다' });           // 사라지면 안 된다 — 부적절
```

```tsx
// ✅ 상황에 맞는 형태 선택

// 1. 화면에서 결과가 보이면 토스트 불필요
// 필터 적용 → 목록이 바뀐 것으로 충분. 대신 적용된 필터를 표시한다.

// 2. 결과가 화면 밖에 있으면 토스트
toast({
  title: '리포트를 보관함으로 옮겼습니다',
  action: <ToastAction altText="실행 취소" onClick={undo}>실행 취소</ToastAction>,
  duration: 8000,   // 되돌리기가 있으면 충분히 길게
});

// 3. 조치가 필요하면 인라인 알림
<Alert variant="destructive" role="alert">
  <AlertTitle>결제에 실패했습니다</AlertTitle>
  <AlertDescription className="space-y-2">
    <p>카드 한도를 초과했습니다. 다른 결제 수단을 사용해주세요.</p>
    <Button size="sm" asChild><Link href="/settings/billing/payment">결제 수단 변경</Link></Button>
  </AlertDescription>
</Alert>

// 4. 되돌릴 수 없는 결정에만 모달
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogTitle>워크스페이스를 영구 삭제할까요?</AlertDialogTitle>
    <AlertDialogDescription>
      리포트 47개, 데이터 소스 3개가 함께 삭제되며 복구할 수 없습니다.
    </AlertDialogDescription>
  </AlertDialogContent>
</AlertDialog>
```

**토스트 지속 시간을 내용에 맞춘다**

```ts
// ✅ 읽는 데 걸리는 시간을 고려
function toastDuration(message: string, hasAction: boolean): number {
  // 한국어 읽기 속도 대략 분당 500자 기준 + 인지 여유
  const readMs = (message.length / 500) * 60_000 + 1500;
  const base = Math.max(4000, Math.min(readMs, 10_000));
  return hasAction ? base + 3000 : base;   // 행동이 필요하면 더 길게
}
```

```tsx
// ✅ 토스트가 콘텐츠를 가리지 않게 배치
// 모바일: 하단 고정 UI가 있으면 그 위에
<Toaster
  position="bottom-right"
  className="pb-[calc(env(safe-area-inset-bottom)+var(--bottom-bar-height,0px))]"
  visibleToasts={3}      // 쌓이는 것을 제한
/>
```

**중요 상태는 스크린리더에도 전달한다**

```tsx
// ✅ 라이브 리전 — 시각 외 채널로도 알린다
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {liveMessage}
</div>

<div role="alert" aria-live="assertive" className="sr-only">
  {errorMessage}
</div>
```

`polite`는 현재 읽는 것을 끝낸 뒤 알리고, `assertive`는 즉시 끼어든다. 오류에만 `assertive`를 쓴다.

---

### UX-FB-03 — 파괴적 작업의 확인

**WHY**
확인 대화상자는 남용되기 쉽다. 모든 작업에 확인을 요구하면 사용자는 읽지 않고 누르는 습관이 생기고, 정작 중요한 확인도 무시된다. 확인은 **되돌릴 수 없는 작업**에만 쓰고, 되돌릴 수 있으면 실행 취소를 제공하는 편이 낫다.

**DETECT**

```bash
rg -n "AlertDialog|confirm\(|정말|하시겠습니까" src --glob "*.tsx" | head -20
rg -n "undo|실행 취소|되돌리기" src --glob "*.tsx" | head
```

**진단**

각 확인 대화상자에 대해 판단한다.

```markdown
| 작업 | 확인 있음 | 되돌리기 가능 | 판정 |
|------|-----------|---------------|------|
| 리포트 보관 | 있음 | 가능 | **확인 불필요 → 실행 취소로** |
| 리포트 영구 삭제 | 있음 | 불가 | 확인 적절 |
| 멤버 제외 | 없음 | 재초대 필요 | **확인 필요** |
| 워크스페이스 삭제 | 있음(단순) | 불가 | **강한 확인 필요** |
| 필터 초기화 | 있음 | 즉시 재적용 가능 | **확인 불필요** |
```

**PASS / FAIL**

- PASS: 확인이 되돌릴 수 없는 작업에만 있다. 확인 문구가 결과를 구체적으로 서술한다. 되돌릴 수 있는 작업에는 실행 취소가 있다.
- FAIL: 되돌릴 수 없는 삭제에 확인 없음(**S1**), 확인 남용으로 무감각화(S2), 확인 문구가 모호(S2).

**FIX**

```tsx
// ❌ 되돌릴 수 있는 작업에 확인 — 불필요한 마찰
<AlertDialog>
  <AlertDialogTitle>보관하시겠습니까?</AlertDialogTitle>
  <AlertDialogDescription>정말 보관하시겠습니까?</AlertDialogDescription>
</AlertDialog>
```

```tsx
// ✅ 즉시 실행하고 되돌릴 수단을 제공
async function archiveReport(report: Report) {
  await archive(report.id);

  toast({
    title: '보관함으로 옮겼습니다',
    description: report.title,
    duration: 8000,
    action: (
      <ToastAction altText="실행 취소" onClick={() => unarchive(report.id)}>
        실행 취소
      </ToastAction>
    ),
  });
}
```

```tsx
// ❌ 되돌릴 수 없는데 확인 문구가 모호
<AlertDialogTitle>삭제하시겠습니까?</AlertDialogTitle>
<AlertDialogDescription>이 작업은 취소할 수 없습니다.</AlertDialogDescription>
<AlertDialogAction>확인</AlertDialogAction>
```

```tsx
// ✅ 무엇이 사라지는지 구체적으로 서술
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        &lsquo;{workspace.name}&rsquo; 워크스페이스를 삭제할까요?
      </AlertDialogTitle>
      <AlertDialogDescription asChild>
        <div className="space-y-3">
          <p>다음 항목이 영구적으로 삭제되며 복구할 수 없습니다.</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>리포트 {stats.reports}개</li>
            <li>연결된 데이터 소스 {stats.sources}개</li>
            <li>멤버 {stats.members}명의 접근 권한</li>
          </ul>
          {stats.activeSubscription && (
            <p className="font-medium text-destructive">
              진행 중인 구독이 즉시 해지되며 환불되지 않습니다.
            </p>
          )}
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>

    {/* 심각한 삭제에는 의도적 마찰을 추가 */}
    <div className="space-y-2">
      <Label htmlFor="confirm-name">
        삭제하려면 워크스페이스 이름 <strong>{workspace.name}</strong>을 입력하세요
      </Label>
      <Input
        id="confirm-name"
        value={confirmText}
        onChange={e => setConfirmText(e.target.value)}
        autoComplete="off"
        placeholder={workspace.name}
      />
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction
        disabled={confirmText !== workspace.name}
        onClick={handleDelete}
        className={buttonVariants({ variant: 'destructive' })}
      >
        워크스페이스 영구 삭제
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**이름 입력 확인**은 가장 심각한 작업에만 쓴다. 남용하면 이것도 무감각해진다. 기준은 "이 작업이 실수로 실행되면 조직에 실질적 손해가 발생하는가"다.

**버튼 라벨이 동작을 서술해야 한다.** "확인"은 무엇을 확인하는지 알려주지 않는다. "워크스페이스 영구 삭제"는 명확하다.

**소프트 삭제로 되돌림 여지를 만든다**

```ts
// ✅ 즉시 파괴하지 않고 유예 기간을 둔다
export async function deleteWorkspace(id: string) {
  await db.workspace.update({
    where: { id },
    data: { deletedAt: new Date(), purgeAt: addDays(new Date(), 30) },
  });
  // 30일 뒤 배치 작업이 실제 삭제
}
```

```tsx
// ✅ 유예 기간을 사용자에게 알린다
<Alert>
  <AlertTitle>이 워크스페이스는 삭제 예정입니다</AlertTitle>
  <AlertDescription className="flex flex-wrap items-center gap-3">
    <span>{formatDate(workspace.purgeAt)}에 영구 삭제됩니다.</span>
    <Button size="sm" variant="outline" onClick={restore}>삭제 취소</Button>
  </AlertDescription>
</Alert>
```

---

### UX-FB-04 — 일괄 작업 피드백

**WHY**
100개 항목을 선택해 삭제할 때, 몇 개가 성공하고 몇 개가 실패했는지 알 수 없으면 사용자는 결과를 신뢰할 수 없다. 부분 실패가 조용히 넘어가면 데이터 불일치를 발견하지 못한다.

**DETECT**

```bash
rg -n "selectedIds|bulk|batch|checkedItems" src --glob "*.tsx" | head -20
rg -n "Promise.all|Promise.allSettled" src | head
```

**진단**

```ts
test('일괄 작업 부분 실패 처리', async ({ page }) => {
  let count = 0;
  // 3번째 요청만 실패시킨다
  await page.route('**/api/reports/*', async route => {
    count++;
    if (count === 3) return route.fulfill({ status: 500, json: { error: 'Failed' } });
    return route.continue();
  });

  await page.goto('/reports');
  await page.getByRole('checkbox', { name: '전체 선택' }).check();
  await page.getByRole('button', { name: /선택 항목 삭제/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '삭제' }).click();

  // 부분 실패가 사용자에게 전달되는가
  const message = await page.getByRole('alert').or(page.getByRole('status')).textContent();
  expect(message, `부분 실패 미고지: ${message}`).toMatch(/\d+건.*실패|일부/);
});
```

**PASS / FAIL**

- PASS: 성공/실패 건수가 명확히 보고된다. 실패 항목을 확인하고 재시도할 수 있다. 진행 중 취소가 가능하다.
- FAIL: 부분 실패 미고지(**S1** — 데이터 불일치 인지 불가), 진행률 없음(S2), 실패 항목 확인 불가(S2).

**FIX**

```ts
// ✅ allSettled로 부분 실패를 수집
async function bulkDelete(ids: string[], onProgress: (done: number) => void) {
  const results = await Promise.allSettled(
    ids.map(async (id, i) => {
      try {
        await deleteReport(id);
        return { id, ok: true as const };
      } finally {
        onProgress(i + 1);
      }
    }),
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results
    .map((r, i) => ({ r, id: ids[i] }))
    .filter(({ r }) => r.status === 'rejected')
    .map(({ r, id }) => ({ id, reason: (r as PromiseRejectedResult).reason?.message }));

  return { succeeded, failed };
}
```

```tsx
// ✅ 결과를 구체적으로 보고하고 재시도 수단을 제공
function BulkResultDialog({ result, onRetry, onClose }: Props) {
  const { succeeded, failed } = result;

  if (failed.length === 0) {
    return null;   // 전부 성공하면 토스트로 충분
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {succeeded}건 삭제, {failed.length}건 실패
          </DialogTitle>
          <DialogDescription>
            일부 항목을 삭제하지 못했습니다. 아래 항목은 그대로 남아 있습니다.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
          {failed.map(f => (
            <li key={f.id} className="text-sm">
              <span className="font-medium">{getTitle(f.id)}</span>
              <span className="block text-muted-foreground">{f.reason ?? '알 수 없는 오류'}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button onClick={() => onRetry(failed.map(f => f.id))}>
            실패한 {failed.length}건 다시 시도
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx
// ✅ 진행 중 취소 가능
function BulkProgress({ total, done, onCancel }: Props) {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <Progress value={(done / total) * 100} />
      <div className="flex items-center justify-between text-sm">
        <span>{done}/{total}건 처리 중</span>
        <Button variant="ghost" size="sm" onClick={onCancel}>중단</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        중단하면 이미 처리된 {done}건은 되돌아가지 않습니다.
      </p>
    </div>
  );
}
```

중단 시 이미 처리된 것이 어떻게 되는지 미리 알려야 한다. 이를 모르면 사용자는 중단을 두려워한다.

---

## 12. 오류와 복구

### UX-ERR-01 — 오류 메시지의 3요소

**WHY**
좋은 오류 메시지는 세 가지에 답한다. **무엇이 잘못됐는가, 왜 그런가, 어떻게 하면 되는가.** 하나라도 빠지면 사용자는 막힌다. 특히 "어떻게"가 없으면 메시지를 읽어도 아무 도움이 안 된다.

**DETECT**

```bash
# 오류 메시지 수집
rg -o "(message|error|description):\s*['\"]([^'\"]{5,120})" src --glob "*.ts*" -r '$2' | sort -u > /tmp/errors.txt
wc -l /tmp/errors.txt

# 나쁜 패턴
rg -n "오류가 발생했습니다|Error occurred|Something went wrong|알 수 없는 오류" src | head -20
rg -n "Error [0-9]{3}|status: [45][0-9][0-9]" src --glob "*.tsx" | head
rg -in "invalid|failed|denied|unauthorized|forbidden" src --glob "*.tsx" | head -20
```

**진단**

수집한 메시지를 3요소로 평가한다.

```markdown
| 메시지 | 무엇 | 왜 | 어떻게 | 판정 |
|--------|------|-----|--------|------|
| "오류가 발생했습니다" | ✗ | ✗ | ✗ | **최악** |
| "Error 403: Forbidden" | △ | ✗ | ✗ | 시스템 언어 |
| "이메일이 유효하지 않습니다" | ○ | ✗ | ✗ | 불충분 |
| "이미 사용 중인 이메일입니다. 로그인하시거나 다른 이메일을 사용해주세요." | ○ | ○ | ○ | **양호** |
| "파일이 너무 큽니다" | ○ | △ | ✗ | 크기 기준 누락 |
```

**PASS / FAIL**

- PASS: 모든 사용자 대면 오류가 3요소를 갖춘다. 시스템 용어와 오류 코드가 노출되지 않는다.
- FAIL: 일반 오류 메시지("오류가 발생했습니다")(S2), 시스템 코드 노출(S2), 해결 방법 부재(S2). 결제·데이터 손실 경로면 상향.

**FIX**

```tsx
// ❌ 세 요소가 모두 없다
<Alert variant="destructive">오류가 발생했습니다.</Alert>

// ❌ 시스템의 언어
<Alert variant="destructive">Error 413: Payload Too Large</Alert>

// ❌ 무엇만 있고 왜·어떻게가 없다
<Alert variant="destructive">파일을 업로드할 수 없습니다.</Alert>
```

```tsx
// ✅ 무엇 + 왜 + 어떻게
<Alert variant="destructive" role="alert">
  <AlertCircle className="size-4" aria-hidden />
  <AlertTitle>파일을 업로드하지 못했습니다</AlertTitle>
  <AlertDescription className="space-y-2">
    <p>
      선택한 파일이 {formatBytes(file.size)}입니다.
      업로드 가능한 최대 크기는 {formatBytes(MAX_SIZE)}입니다.
    </p>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={selectAnother}>
        다른 파일 선택
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link href="/help/file-limits">용량 줄이는 방법</Link>
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

**오류 카탈로그로 일관성을 확보한다**

```ts
// lib/errors/catalog.ts
type ErrorEntry = {
  title: string;
  description: (ctx?: any) => string;
  actions?: { label: string; href?: string; action?: string }[];
  severity: 'error' | 'warning';
};

export const ERROR_CATALOG = {
  EMAIL_ALREADY_EXISTS: {
    title: '이미 사용 중인 이메일입니다',
    description: () => '이 이메일로 가입된 계정이 있습니다.',
    actions: [
      { label: '로그인하기', href: '/auth/login' },
      { label: '비밀번호 재설정', href: '/auth/reset-password' },
    ],
    severity: 'error',
  },

  FILE_TOO_LARGE: {
    title: '파일이 너무 큽니다',
    description: (ctx: { size: number; max: number }) =>
      `선택한 파일은 ${formatBytes(ctx.size)}입니다. ` +
      `${formatBytes(ctx.max)} 이하 파일만 업로드할 수 있습니다.`,
    actions: [{ label: '용량 줄이는 방법', href: '/help/file-size' }],
    severity: 'error',
  },

  QUOTA_EXCEEDED: {
    title: '플랜 한도에 도달했습니다',
    description: (ctx: { used: number; limit: number; resource: string }) =>
      `현재 플랜에서는 ${ctx.resource}를 ${ctx.limit}개까지 만들 수 있습니다. ` +
      `(현재 ${ctx.used}개)`,
    actions: [
      { label: '플랜 업그레이드', href: '/settings/billing/plan' },
      { label: '기존 항목 정리', action: 'openCleanup' },
    ],
    severity: 'warning',
  },

  PAYMENT_DECLINED: {
    title: '결제가 거절되었습니다',
    description: (ctx: { reason?: string }) =>
      ctx.reason === 'insufficient_funds'
        ? '카드 잔액이 부족합니다.'
        : ctx.reason === 'expired_card'
        ? '카드 유효기간이 지났습니다.'
        : '카드사에서 결제를 거절했습니다. 카드사에 문의하시거나 다른 카드를 사용해주세요.',
    actions: [{ label: '다른 결제 수단 사용', href: '/settings/billing/payment' }],
    severity: 'error',
  },

  NETWORK_ERROR: {
    title: '서버에 연결하지 못했습니다',
    description: () => '인터넷 연결을 확인하고 다시 시도해주세요.',
    actions: [{ label: '다시 시도', action: 'retry' }],
    severity: 'error',
  },

  UNKNOWN: {
    title: '예상치 못한 문제가 발생했습니다',
    description: (ctx: { traceId?: string }) =>
      '문제가 계속되면 아래 참조 코드와 함께 문의해주세요.' +
      (ctx.traceId ? ` (참조: ${ctx.traceId})` : ''),
    actions: [
      { label: '다시 시도', action: 'retry' },
      { label: '문의하기', href: '/help/contact' },
    ],
    severity: 'error',
  },
} satisfies Record<string, ErrorEntry>;
```

카탈로그를 쓰면 (a) 메시지 품질이 일관되고, (b) 번역이 쉬우며, (c) 새 오류를 추가할 때 형식을 따르게 된다.

**알 수 없는 오류에는 추적 코드를 제공한다.** 사용자가 문의할 때 이 코드로 서버 로그를 찾을 수 있으면 해결이 빨라진다.

**REGRESSION**

```ts
test('금지된 오류 메시지 패턴이 없다', () => {
  const FORBIDDEN = [
    '오류가 발생했습니다',
    'Something went wrong',
    'An error occurred',
    'Unknown error',
  ];

  const violations: string[] = [];
  for (const phrase of FORBIDDEN) {
    const out = execSync(
      `rg -n "${phrase}" src app --glob "*.tsx" --glob "*.ts" || true`,
      { encoding: 'utf8' },
    ).trim();
    // 카탈로그 자체는 제외
    const lines = out.split('\n').filter(l => l && !l.includes('errors/catalog.ts'));
    if (lines.length) violations.push(`"${phrase}":\n${lines.join('\n')}`);
  }

  expect(violations, violations.join('\n\n')).toEqual([]);
});
```

---

### UX-ERR-02 — 오류의 어조

**WHY**
오류는 사용자가 이미 좌절한 순간에 나타난다. 여기서 사용자를 탓하거나, 과도하게 사과하거나, 농담을 하면 상황이 나빠진다. 어조는 차분하고 사실적이며 해결 지향적이어야 한다.

**DETECT**

```bash
# 비난하는 어조
rg -n "잘못|틀렸|실패했습니다|불가능|허용되지 않" src --glob "*.tsx" | head -20
rg -n "당신이|사용자가.*않았" src --glob "*.tsx" | head

# 과도한 사과
rg -n "죄송|죄송합니다|불편을 드려" src --glob "*.tsx" | head

# 부적절한 유머·감탄사
rg -n "이런!|앗!|어라|Oops|Whoops|😅|😢" src --glob "*.tsx" | head
```

**진단**

```markdown
| 원문 | 문제 | 개선 |
|------|------|------|
| "잘못된 이메일을 입력했습니다" | 사용자를 탓함 | "이메일 형식을 확인해주세요" |
| "이런! 문제가 생겼어요 😅" | 심각도와 어조 불일치 | "저장하지 못했습니다" |
| "죄송합니다. 정말 죄송합니다." | 과도한 사과, 정보 없음 | "일시적인 문제입니다. 다시 시도해주세요." |
| "허용되지 않는 작업입니다" | 차갑고 이유 없음 | "관리자만 할 수 있는 작업입니다" |
| "실패" | 정보 없음 | "연결이 끊겨 저장하지 못했습니다" |
```

**PASS / FAIL**

- PASS: 어조가 중립적이고 해결 지향적이다. 사용자를 탓하지 않는다. 심각도에 맞는 톤이다.
- FAIL: 비난조(S3), 심각한 오류에 가벼운 톤(S2 — 신뢰 훼손), 정보 없는 사과(S3).

**FIX**

```tsx
// ❌ 사용자를 주어로 두고 탓한다
'잘못된 형식을 입력하셨습니다'
'파일을 선택하지 않았습니다'
'권한이 없는 작업을 시도했습니다'

// ✅ 시스템 또는 상황을 주어로, 다음 행동을 안내
'이메일 형식을 확인해주세요'
'업로드할 파일을 선택해주세요'
'이 작업은 관리자 권한이 필요합니다'
```

```tsx
// ❌ 심각도와 톤이 맞지 않는다
toast({ title: '앗! 결제가 안 됐어요 😅' });

// ✅ 심각한 상황에는 차분한 톤
<Alert variant="destructive">
  <AlertTitle>결제를 완료하지 못했습니다</AlertTitle>
  <AlertDescription>
    금액은 청구되지 않았습니다. 다른 결제 수단으로 다시 시도해주세요.
  </AlertDescription>
</Alert>
```

"금액은 청구되지 않았습니다"처럼 **사용자가 가장 걱정하는 것에 먼저 답하는 것**이 중요하다. 결제 오류에서 사용자의 첫 질문은 "돈이 빠져나갔나?"다.

```tsx
// ✅ 시스템 잘못일 때는 명확히 인정하되 간결하게
<Alert variant="destructive">
  <AlertTitle>일시적인 서버 문제가 발생했습니다</AlertTitle>
  <AlertDescription>
    작성하신 내용은 임시 저장되었습니다. 잠시 후 다시 시도해주세요.
  </AlertDescription>
</Alert>
```

"작성하신 내용은 임시 저장되었습니다"가 핵심이다. 사용자의 가장 큰 걱정은 자기 작업을 잃는 것이다.

---

### UX-ERR-03 — 오류 예방

**WHY**
가장 좋은 오류 처리는 오류가 일어나지 않게 하는 것이다. 제약을 미리 알리고, 불가능한 선택을 막고, 위험한 조합을 방지하면 오류 메시지 자체가 필요 없어진다.

**DETECT**

```bash
# 사후 검증만 있고 사전 안내가 없는 곳
rg -n "throw new|return.*error" src/lib src/app/api --glob "*.ts" | wc -l
rg -n "disabled=\{" src --glob "*.tsx" | wc -l
rg -n "max=|min=|maxLength=|accept=" src --glob "*.tsx" | head

# 한도 안내
rg -n "quota|limit|남은|사용 가능" src --glob "*.tsx" | head
```

**진단**

각 오류에 대해 "이 오류를 사전에 막을 수 있었는가"를 묻는다.

```markdown
| 오류 | 예방 가능 | 방법 |
|------|-----------|------|
| 파일 용량 초과 | 예 | accept 속성 + 선택 즉시 크기 검사 |
| 플랜 한도 초과 | 예 | 남은 개수를 미리 표시 |
| 중복 이메일 | 부분 | 입력 중 비동기 확인 |
| 만료된 카드 | 예 | 만료 30일 전 알림 |
| 권한 부족 | 예 | 버튼을 비활성화하고 이유 표시 |
| 네트워크 오류 | 아니오 | 재시도 제공 |
```

**PASS / FAIL**

- PASS: 예방 가능한 오류에 사전 안내나 제약이 있다. 불가능한 작업은 시도 전에 차단된다.
- FAIL: 예방 가능한 오류가 사후 처리만 됨(S2), 한도를 초과한 뒤에야 알려줌(S2).

**FIX**

```tsx
// ❌ 시도한 뒤에 거부
<Button onClick={createReport}>리포트 만들기</Button>
// → 클릭 후 "플랜 한도를 초과했습니다"
```

```tsx
// ✅ 남은 한도를 미리 보여주고, 초과 시 이유와 함께 비활성화
function CreateReportButton({ quota }: { quota: Quota }) {
  const remaining = quota.limit - quota.used;
  const atLimit = remaining <= 0;

  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          {/* disabled 요소는 툴팁이 안 뜨므로 wrapper 필요 */}
          <span tabIndex={atLimit ? 0 : -1}>
            <Button disabled={atLimit} asChild={!atLimit}>
              {atLimit ? <span>리포트 만들기</span> : <Link href="/reports/new">리포트 만들기</Link>}
            </Button>
          </span>
        </TooltipTrigger>
        {atLimit && (
          <TooltipContent>
            현재 플랜의 리포트 한도({quota.limit}개)에 도달했습니다
          </TooltipContent>
        )}
      </Tooltip>

      {remaining <= 3 && (
        <p className="text-sm text-muted-foreground">
          {atLimit ? (
            <>
              한도에 도달했습니다.{' '}
              <Link href="/settings/billing/plan" className="text-primary underline">
                플랜 업그레이드
              </Link>
            </>
          ) : (
            <>{remaining}개 더 만들 수 있습니다</>
          )}
        </p>
      )}
    </div>
  );
}
```

**비활성화 버튼에는 반드시 이유를 제공한다.** 이유 없이 회색인 버튼은 사용자를 막다른 길에 세운다.

```tsx
// ✅ 파일 선택 즉시 검증 — 업로드 시도 전에
function FileInput({ maxSize, accept }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      setError(
        `선택한 파일이 ${formatBytes(file.size)}입니다. ` +
        `${formatBytes(maxSize)} 이하 파일만 업로드할 수 있습니다.`,
      );
      e.target.value = '';   // 선택 해제
      return;
    }
    setError(null);
    onSelect(file);
  };

  return (
    <div>
      <Input type="file" accept={accept} onChange={handleChange}
             aria-invalid={!!error} aria-describedby={error ? 'file-error' : 'file-help'} />
      <p id="file-help" className="mt-1 text-sm text-muted-foreground">
        PDF, PNG, JPG · 최대 {formatBytes(maxSize)}
      </p>
      {error && <p id="file-error" role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

제약을 **선택 전에** 표시하는 것이 핵심이다. `file-help`가 없으면 사용자는 큰 파일을 고르고 나서야 안다.

```tsx
// ✅ 만료 예정을 미리 알린다
{card.expiresWithinDays(30) && (
  <Alert>
    <CreditCard className="size-4" aria-hidden />
    <AlertTitle>결제 카드가 곧 만료됩니다</AlertTitle>
    <AlertDescription className="flex flex-wrap items-center gap-3">
      <span>
        {card.brand} •••• {card.last4} 카드가 {formatDate(card.expiresAt)}에 만료됩니다.
        갱신하지 않으면 다음 결제가 실패합니다.
      </span>
      <Button size="sm" asChild>
        <Link href="/settings/billing/payment">카드 갱신</Link>
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

### UX-ERR-04 — 부분 실패와 화면 유지

**WHY**
대시보드의 위젯 하나가 실패했다고 전체 화면이 오류로 바뀌면, 정상 동작하는 나머지 기능도 쓸 수 없다. 사용자 입장에서는 "전부 고장났다"고 인식된다.

**DETECT**

```bash
rg -n "error.tsx" app src/app | head
rg -n "ErrorBoundary|<Suspense" src --glob "*.tsx" | wc -l
rg -n "throw error|throw new Error" src/app --glob "*.tsx" | head
```

**진단**

```ts
test('개별 위젯 실패가 화면 전체를 무너뜨리지 않는다', async ({ page }) => {
  // 한 API만 실패시킨다
  await page.route('**/api/metrics/churn', r => r.fulfill({ status: 500, json: {} }));

  await page.goto('/dashboard');

  // 나머지 위젯은 살아 있는가
  await expect(page.getByRole('article', { name: '월 반복 매출' })).toBeVisible();
  await expect(page.getByRole('article', { name: '활성 사용자' })).toBeVisible();

  // 실패한 위젯만 오류 표시
  const churn = page.getByRole('article', { name: /이탈률/ });
  await expect(churn).toContainText(/불러오지 못|다시 시도/);

  // 내비게이션은 동작하는가
  await expect(page.getByRole('navigation')).toBeVisible();
});
```

**PASS / FAIL**

- PASS: 부분 실패가 해당 영역에만 국한된다. 셸(내비게이션, 헤더)이 유지된다. 실패 영역에 재시도가 있다.
- FAIL: 위젯 하나 실패로 전체 화면 오류(**S1**), 셸까지 사라짐(**S1**), 재시도 수단 없음(S2).

**FIX**

```tsx
// ✅ 위젯마다 독립적인 오류 경계
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <WidgetBoundary name="월 반복 매출">
        <Suspense fallback={<WidgetSkeleton />}><RevenueWidget /></Suspense>
      </WidgetBoundary>

      <WidgetBoundary name="이탈률">
        <Suspense fallback={<WidgetSkeleton />}><ChurnWidget /></Suspense>
      </WidgetBoundary>
    </div>
  );
}
```

```tsx
// components/widget-boundary.tsx
'use client';

import { ErrorBoundary } from 'react-error-boundary';

export function WidgetBoundary({ name, children }: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <article aria-label={name} className="rounded-lg border border-dashed p-4">
          <h3 className="text-sm font-medium">{name}</h3>
          <div className="mt-3 flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              이 항목을 불러오지 못했습니다. 다른 항목은 정상입니다.
            </p>
            <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
              다시 시도
            </Button>
          </div>
        </article>
      )}
      onError={(error, info) => {
        reportError(error, { widget: name, componentStack: info.componentStack });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

"다른 항목은 정상입니다"라는 문구가 사용자의 불안을 줄인다.

```tsx
// ✅ 라우트 오류 경계는 셸을 유지한다
// app/dashboard/error.tsx — layout은 유지되므로 내비게이션이 남는다
'use client';

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => { reportError(error); }, [error]);

  return (
    <div className="py-16 text-center">
      <h2 className="text-lg font-semibold">대시보드를 불러오지 못했습니다</h2>
      <p className="mt-2 text-muted-foreground">
        일시적인 문제일 수 있습니다.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="outline" asChild><Link href="/reports">리포트로 이동</Link></Button>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-muted-foreground">참조 코드: {error.digest}</p>
      )}
    </div>
  );
}
```

Next.js App Router에서 `error.tsx`는 해당 세그먼트의 `layout.tsx` **안쪽**에 렌더된다. 따라서 사이드바와 헤더는 유지된다. `global-error.tsx`는 루트 레이아웃까지 대체하므로 최후의 수단이다.

---

## 13. 마이크로카피와 콘텐츠

### UX-COPY-01 — 버튼과 액션 라벨

**WHY**
버튼 라벨은 사용자가 클릭 직전에 읽는 마지막 정보다. "확인", "제출", "완료"는 무엇이 일어날지 알려주지 않는다. 특히 파괴적 작업에서 모호한 라벨은 실수를 유발한다.

**DETECT**

```bash
# 버튼 라벨 수집
rg -o "<Button[^>]*>\s*([^<{][^<]{0,30})" src app --glob "*.tsx" -r '$1' \
  | sed 's/^[ \t]*//; s/[ \t]*$//' | sort | uniq -c | sort -rn | head -30

# 모호한 라벨
rg -n ">(확인|제출|완료|OK|Submit|계속|다음)<" src app --glob "*.tsx" | head -20
```

**진단**

```markdown
| 라벨 | 맥락 | 무엇이 일어나는가 | 판정 |
|------|------|-------------------|------|
| "확인" | 삭제 대화상자 | 삭제 실행 | **위험 — 명시 필요** |
| "제출" | 가입 폼 | 계정 생성 | 개선 여지 |
| "완료" | 온보딩 3단계 | 다음 단계로 | **오해 유발** |
| "저장" | 설정 화면 | 설정 저장 | OK |
| "초대 보내기" | 초대 모달 | 이메일 발송 | 양호 |
```

**PASS / FAIL**

- PASS: 버튼 라벨이 동작을 서술한다(동사 + 대상). 파괴적 작업은 결과를 명시한다.
- FAIL: 파괴적 작업에 모호한 라벨(**S1** — 실수 유발), 일반적 모호 라벨(S3).

**FIX**

```tsx
// ❌ 무엇이 일어나는지 모른다
<Button>확인</Button>
<Button>제출</Button>
<Button>완료</Button>
<Button>OK</Button>

// ✅ 동사 + 대상
<Button>멤버 3명 삭제</Button>
<Button>계정 만들기</Button>
<Button>다음 단계로</Button>
<Button>초대 보내기</Button>
<Button>변경 사항 저장</Button>
```

**대화상자에서 특히 중요하다**

```tsx
// ❌ "예/아니오"는 질문을 기억해야 답할 수 있다
<AlertDialogTitle>저장하지 않고 나가시겠습니까?</AlertDialogTitle>
<AlertDialogAction>예</AlertDialogAction>
<AlertDialogCancel>아니오</AlertDialogCancel>
```

```tsx
// ✅ 각 버튼이 자기 동작을 서술 — 질문을 다시 읽지 않아도 된다
<AlertDialogTitle>저장하지 않은 변경 사항이 있습니다</AlertDialogTitle>
<AlertDialogDescription>
  지금 나가면 작성 중인 내용이 사라집니다.
</AlertDialogDescription>
<AlertDialogFooter>
  <AlertDialogCancel>계속 편집</AlertDialogCancel>
  <Button variant="outline" onClick={saveAndLeave}>저장하고 나가기</Button>
  <AlertDialogAction onClick={discardAndLeave}>저장하지 않고 나가기</AlertDialogAction>
</AlertDialogFooter>
```

세 선택지를 제공하면 사용자가 작업을 잃지 않고도 나갈 수 있다.

**진행 중 상태도 라벨로 표현한다**

```tsx
// ✅ 상태 변화를 텍스트로도 전달
<Button disabled={isPending} aria-busy={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
      초대 보내는 중…
    </>
  ) : (
    '초대 보내기'
  )}
</Button>
```

**REGRESSION**

```ts
test('파괴적 대화상자에 모호한 버튼 라벨이 없다', async ({ page }) => {
  await page.goto('/settings/danger');
  await page.getByRole('button', { name: /삭제/ }).first().click();

  const dialog = page.getByRole('alertdialog');
  const buttons = await dialog.getByRole('button').allTextContents();

  const vague = buttons.filter(b => /^(확인|예|OK|Yes|제출)$/.test(b.trim()));
  expect(vague, `모호한 버튼 라벨: ${vague.join(', ')}`).toEqual([]);
});
```

---

### UX-COPY-02 — 사용자의 언어

**WHY**
개발 과정에서 만들어진 내부 용어(엔티티, 리소스, 인스턴스, 노드)가 UI에 새어 나오면 사용자는 이해할 수 없다. 사용자는 자신의 업무 언어로 생각하지, 시스템 구조로 생각하지 않는다.

**DETECT**

```bash
# 기술 용어 노출
rg -in ">(entity|resource|instance|node|payload|token|hash|uuid|null|undefined|object)" \
  src app --glob "*.tsx" | head -20

# 영문 그대로 노출 (한국어 서비스 기준)
rg -n ">[A-Z][a-z]+ [A-Za-z ]{3,}<" src/app src/components --glob "*.tsx" \
  | rg -v "className|import|export|aria-|data-" | head -20

# 축약어
rg -n ">(API|SDK|CRM|SLA|SSO|2FA|MFA|TTL|CDN)[^<]*<" src app --glob "*.tsx" | head
```

**진단**

```markdown
| 화면 표시 | 사용자 이해도 | 개선 |
|-----------|---------------|------|
| "엔티티가 생성되었습니다" | 낮음 | "항목을 만들었습니다" |
| "Payload가 유효하지 않습니다" | 매우 낮음 | "입력한 내용을 확인해주세요" |
| "SSO 구성" | 중간 (IT 담당자는 이해) | "회사 계정으로 로그인 설정" |
| "TTL: 3600" | 낮음 | "캐시 유지 시간: 1시간" |
| "null" | 없음 | "설정되지 않음" |
```

**PASS / FAIL**

- PASS: 화면 텍스트에 내부 구현 용어가 없다. 축약어는 첫 등장 시 풀어쓴다. `null`/`undefined`가 노출되지 않는다.
- FAIL: `null`/`undefined` 노출(S2 — 미완성 인상), 기술 용어 다수(S2), 축약어 미설명(S3).

**FIX**

```tsx
// ❌ 시스템 내부 표현이 그대로
<p>Entity ID: {entity.id}</p>
<p>Status: {status}</p>
<p>Created: {createdAt}</p>
<p>Owner: {owner ?? 'null'}</p>
```

```tsx
// ✅ 사용자 언어 + 안전한 폴백
<dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
  <dt className="text-muted-foreground">상태</dt>
  <dd><StatusBadge status={status} /></dd>

  <dt className="text-muted-foreground">만든 날짜</dt>
  <dd>
    <time dateTime={createdAt}>{formatDate(createdAt, 'yyyy년 M월 d일')}</time>
  </dd>

  <dt className="text-muted-foreground">담당자</dt>
  <dd>{owner?.name ?? <span className="text-muted-foreground">지정되지 않음</span>}</dd>
</dl>
```

`null` 대신 "지정되지 않음"을 쓰고, 시각적으로도 구분한다.

```ts
// ✅ 안전한 표시 헬퍼 — null/undefined가 절대 노출되지 않게
export function display(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number' && !Number.isFinite(value)) return fallback;
  return String(value);
}

export function displayCount(n: number | null | undefined, unit: string): string {
  if (n === null || n === undefined) return '—';
  return `${n.toLocaleString('ko-KR')}${unit}`;
}
```

**축약어는 첫 등장 시 풀어쓴다**

```tsx
// ✅ 맥락과 함께 설명
<div>
  <h3>SSO (통합 로그인) 설정</h3>
  <p className="text-sm text-muted-foreground">
    회사 계정(Google Workspace, Okta 등)으로 로그인할 수 있게 설정합니다.
    설정하면 팀원이 별도 비밀번호 없이 접속할 수 있습니다.
  </p>
</div>
```

**REGRESSION**

```ts
test('화면에 null/undefined가 노출되지 않는다', async ({ page }) => {
  const routes = ['/dashboard', '/reports', '/settings/profile'];

  for (const route of routes) {
    await page.goto(route);
    const text = await page.getByRole('main').textContent() ?? '';

    const leaks = ['null', 'undefined', 'NaN', '[object Object]']
      .filter(v => new RegExp(`\\b${v}\\b`).test(text));

    expect(leaks, `${route}에 노출: ${leaks.join(', ')}`).toEqual([]);
  }
});
```

---

### UX-COPY-03 — 날짜·숫자·단위 표기

**WHY**
`2026-07-30T12:00:00Z`는 사용자가 읽을 수 있는 형식이 아니다. `1234567`은 자릿수를 세야 한다. 표기 방식이 화면마다 다르면 비교와 이해가 어렵다. 특히 시간대 처리를 잘못하면 실제 오해가 발생한다.

**DETECT**

```bash
# 날짜 포맷 사용
rg -n "toLocaleDateString|toLocaleString|format\(|dayjs|date-fns" src --glob "*.tsx" | head -20
rg -n "toISOString|new Date\(\).toString" src --glob "*.tsx" | head

# 숫자 포맷
rg -n "toLocaleString\('ko|Intl.NumberFormat" src | head
rg -n "\{[a-zA-Z]+\.(count|total|amount|price)\}" src --glob "*.tsx" | head -20
```

```ts
// 화면의 날짜·숫자 표기를 수집
test('표기 형식 일관성', async ({ page }) => {
  const routes = ['/dashboard', '/reports', '/settings/billing/invoices'];
  const patterns = {
    date: /\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{4}년\s?\d{1,2}월\s?\d{1,2}일/g,
    isoLeak: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/g,
    bigNumber: /\b\d{4,}\b/g,
    currency: /[₩$]\s?[\d,]+|\d+원/g,
  };

  for (const route of routes) {
    await page.goto(route);
    const text = await page.getByRole('main').textContent() ?? '';

    for (const [name, re] of Object.entries(patterns)) {
      const matches = [...new Set(text.match(re) ?? [])];
      if (matches.length) console.log(`${route} ${name}:`, matches.slice(0, 8));
    }
  }
});
```

**PASS / FAIL**

- PASS: 날짜·숫자·통화 형식이 전 화면에서 일관된다. ISO 문자열이 노출되지 않는다. 천 단위 구분자가 있다. 시간대가 명확하다.
- FAIL: ISO 날짜 노출(S2), 형식 불일치(S3), 큰 숫자에 구분자 없음(S3), 시간대 모호(S2 — 일정 관련이면 **S1**).

**FIX**

```ts
// lib/format.ts — 표기를 한곳에서 관리한다
const KO = 'ko-KR';
const TZ = 'Asia/Seoul';

export const fmt = {
  /** 2026년 7월 30일 */
  date: (d: Date | string) =>
    new Intl.DateTimeFormat(KO, {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: TZ,
    }).format(new Date(d)),

  /** 2026. 7. 30. 오후 9:30 */
  dateTime: (d: Date | string) =>
    new Intl.DateTimeFormat(KO, {
      dateStyle: 'medium', timeStyle: 'short', timeZone: TZ,
    }).format(new Date(d)),

  /** 3일 전 / 방금 전 */
  relative: (d: Date | string) => {
    const diff = Date.now() - new Date(d).getTime();
    const rtf = new Intl.RelativeTimeFormat(KO, { numeric: 'auto' });
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31_536_000_000], ['month', 2_592_000_000], ['day', 86_400_000],
      ['hour', 3_600_000], ['minute', 60_000],
    ];
    for (const [unit, ms] of units) {
      if (Math.abs(diff) >= ms) return rtf.format(-Math.round(diff / ms), unit);
    }
    return '방금 전';
  },

  /** 1,234,567 */
  number: (n: number) => new Intl.NumberFormat(KO).format(n),

  /** ₩29,000 */
  currency: (n: number, currency = 'KRW') =>
    new Intl.NumberFormat(KO, {
      style: 'currency', currency,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(n),

  /** 12.3% */
  percent: (ratio: number, digits = 1) =>
    new Intl.NumberFormat(KO, {
      style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(ratio),

  /** 1.2 MB */
  bytes: (b: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0, v = b;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  },
};
```

```tsx
// ✅ 상대 시간 + 절대 시간을 함께 제공
<time dateTime={report.updatedAt} title={fmt.dateTime(report.updatedAt)}>
  {fmt.relative(report.updatedAt)}
</time>
```

상대 시간("3일 전")은 스캔하기 좋고, 절대 시간은 정확하다. `title` 속성으로 둘 다 제공하면 필요한 사람이 확인할 수 있다.

**시간대를 명시해야 하는 경우**

```tsx
// ✅ 일정·마감처럼 시각이 중요한 곳은 시간대를 표시
<p>
  마감: {fmt.dateTime(deadline)}
  <span className="ml-1 text-muted-foreground">(한국 시간)</span>
</p>
```

팀이 여러 시간대에 있으면 이 표시가 없을 때 실제 오해가 발생한다.

**단위와 맥락을 함께 표시한다**

```tsx
// ❌ 숫자만 있으면 의미를 알 수 없다
<p className="text-3xl font-bold">1234567</p>
<p className="text-sm text-muted-foreground">매출</p>

// ✅ 단위, 기간, 비교 기준까지
<div>
  <p className="text-sm text-muted-foreground">이번 달 매출</p>
  <p className="text-3xl font-bold tabular-nums">{fmt.currency(1234567)}</p>
  <p className="mt-1 flex items-center gap-1 text-sm">
    <TrendingUp className="size-3.5 text-emerald-600" aria-hidden />
    <span className="text-emerald-600">{fmt.percent(0.123)}</span>
    <span className="text-muted-foreground">지난달 대비</span>
  </p>
</div>
```

`tabular-nums`는 숫자 폭을 고정해 값이 변할 때 흔들리지 않게 한다. 실시간 갱신되는 숫자에 필수적이다.

**REGRESSION**

```ts
test('ISO 날짜 문자열이 화면에 노출되지 않는다', async ({ page }) => {
  const routes = ['/dashboard', '/reports', '/settings/billing/invoices'];

  for (const route of routes) {
    await page.goto(route);
    const text = await page.getByRole('main').textContent() ?? '';
    const iso = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/g) ?? [];
    expect(iso, `${route}에 ISO 날짜 노출: ${iso.join(', ')}`).toEqual([]);
  }
});
```

---

### UX-COPY-04 — 문장 길이와 스캔 가능성

**WHY**
사용자는 UI 텍스트를 읽지 않고 훑는다. 긴 문단은 통째로 건너뛴다. 중요한 정보가 세 번째 문장에 있으면 전달되지 않는다. 반대로 지나치게 짧으면 정보가 부족하다.

**DETECT**

```ts
// 화면 텍스트의 길이 분포를 측정
test('텍스트 길이 감사', async ({ page }) => {
  const routes = ['/dashboard', '/settings/billing', '/help'];

  for (const route of routes) {
    await page.goto(route);

    const longTexts = await page.evaluate(() => {
      const result: { tag: string; length: number; text: string }[] = [];
      document.querySelectorAll('p, li, dd, span').forEach(el => {
        // 자식 요소가 있으면 건너뛴다 (중복 계산 방지)
        if (el.children.length > 0) return;
        const text = (el.textContent ?? '').trim();
        if (text.length > 120) {
          result.push({ tag: el.tagName, length: text.length, text: text.slice(0, 100) + '…' });
        }
      });
      return result.sort((a, b) => b.length - a.length);
    });

    if (longTexts.length) {
      console.log(`\n=== ${route} 긴 텍스트 ===`);
      console.table(longTexts.slice(0, 10));
    }
  }
});
```

```bash
# 줄 길이(measure) 제한이 있는지
rg -n "max-w-prose|max-w-\[?[0-9]+ch|leading-relaxed" src --glob "*.tsx" | head
```

**진단**

```text
[ ] 첫 문장에 핵심이 있는가?
[ ] 한 문단이 3줄을 넘는가?
[ ] 한 줄이 화면 전체 폭을 차지하는가? (읽기 어려움)
[ ] 목록으로 만들 수 있는 나열을 문장으로 쓰는가?
[ ] 굵게 표시할 핵심어가 있는가?
```

**PASS / FAIL**

- PASS: 핵심이 첫 문장에 있다. 문단이 3줄 이내다. 줄 길이가 45~75자로 제한된다. 나열은 목록으로 표현된다.
- FAIL: 핵심 정보가 긴 문단에 묻힘(S2), 줄 길이 제한 없음(S3), 나열이 문장으로만 표현(S3).

**FIX**

```tsx
// ❌ 핵심이 마지막에 있고 문단이 길다
<p>
  저희 서비스를 이용해 주셔서 감사합니다. 고객님의 소중한 데이터를 안전하게 보관하기 위해
  최선을 다하고 있으며, 다양한 보안 조치를 통해 개인정보를 보호하고 있습니다. 이번에 정책이
  일부 변경되어 안내드립니다. 2026년 8월 1일부터 무료 플랜의 데이터 보관 기간이 90일에서
  30일로 변경됩니다.
</p>
```

```tsx
// ✅ 핵심을 먼저, 구조화해서
<div className="max-w-prose space-y-3">
  <p>
    <strong>2026년 8월 1일부터 무료 플랜의 데이터 보관 기간이 30일로 변경됩니다.</strong>
    (기존 90일)
  </p>
  <p className="text-sm text-muted-foreground">
    30일이 지난 데이터는 자동으로 삭제됩니다. 데이터를 계속 보관하려면 유료 플랜으로
    변경하거나 미리 내보내기 하세요.
  </p>
  <div className="flex flex-wrap gap-2">
    <Button size="sm" asChild><Link href="/settings/billing/plan">플랜 보기</Link></Button>
    <Button size="sm" variant="outline" onClick={exportData}>데이터 내보내기</Button>
  </div>
</div>
```

**나열은 목록으로**

```tsx
// ❌ 문장 속 나열은 스캔이 안 된다
<p>
  Pro 플랜에서는 무제한 리포트, 팀원 20명, API 접근, 우선 지원, 커스텀 도메인,
  데이터 무제한 보관을 사용할 수 있습니다.
</p>
```

```tsx
// ✅ 목록으로 만들면 비교와 스캔이 쉽다
<ul className="space-y-1.5 text-sm">
  {['무제한 리포트', '팀원 20명', 'API 접근', '우선 지원', '커스텀 도메인', '무제한 보관']
    .map(feature => (
      <li key={feature} className="flex items-center gap-2">
        <Check className="size-4 shrink-0 text-primary" aria-hidden />
        {feature}
      </li>
    ))}
</ul>
```

**줄 길이를 제한한다**

```tsx
// ✅ 읽기 좋은 줄 길이 (한글 기준 약 40~50자)
<div className="max-w-prose">   {/* 약 65ch */}
  <p className="leading-relaxed">…</p>
</div>

// 또는 명시적으로
<p className="max-w-[50ch] leading-relaxed">…</p>
```

와이드 모니터에서 텍스트가 화면 전체 폭으로 늘어나면, 다음 줄 시작점을 찾기 어려워 읽는 속도가 크게 떨어진다.

---

### UX-COPY-05 — 도움말 접근성

**WHY**
아무리 잘 설계해도 막히는 사용자는 있다. 그때 도움을 찾는 데 오래 걸리면 이탈하거나 지원 문의로 이어진다. 도움말은 **필요한 순간에 그 자리에서** 제공될 때 효과가 있다.

**DETECT**

```bash
rg -n "help|docs|support|문의|도움말|가이드" src/components/layout --glob "*.tsx" | head
rg -n "aria-describedby|<Tooltip|HelpCircle|InfoIcon" src --glob "*.tsx" | wc -l
fd "page.tsx" app/help app/docs src/app/help 2>/dev/null | head
```

**진단**

```text
[ ] 모든 화면에서 도움말에 접근할 수 있는가?
[ ] 복잡한 설정 옆에 설명이 있는가?
[ ] 도움말이 현재 맥락과 관련 있는가? (전체 문서로만 보내지 않는가)
[ ] 사람에게 문의할 방법이 있는가?
[ ] 응답 시간을 예상할 수 있는가?
```

**PASS / FAIL**

- PASS: 맥락별 도움말이 그 자리에서 제공된다. 전역 도움말 진입점이 있다. 문의 수단과 예상 응답 시간이 명시된다.
- FAIL: 도움말 부재(S2), 맥락 무관한 전체 문서로만 연결(S3), 문의 수단 없음(S2).

**FIX**

```tsx
// ✅ 설정 항목 옆의 맥락 도움말
function SettingRow({ label, description, learnMoreHref, children }: Props) {
  return (
    <div className="flex items-start justify-between gap-6 border-b py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Label className="font-medium">{label}</Label>
          {learnMoreHref && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={learnMoreHref}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`${label} 자세히 알아보기`}
                >
                  <HelpCircle className="size-3.5" aria-hidden />
                </Link>
              </TooltipTrigger>
              <TooltipContent>자세히 알아보기</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
```

```tsx
// ✅ 사용 예
<SettingRow
  label="2단계 인증"
  description="로그인할 때 비밀번호 외에 인증 앱의 코드를 추가로 요구합니다."
  learnMoreHref="/help/two-factor-auth"
>
  <Switch checked={enabled} onCheckedChange={toggle} />
</SettingRow>
```

설명이 있으면 툴팁이 필요 없는 경우가 많다. 툴팁은 **더 깊은 정보**로 가는 통로로 쓴다.

```tsx
// ✅ 문의 수단과 응답 시간 명시
<Card>
  <CardHeader>
    <CardTitle>도움이 필요하신가요?</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <Link href="/help" className="flex items-start gap-3 rounded-md p-2 hover:bg-accent">
      <BookOpen className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-medium">도움말 문서</p>
        <p className="text-xs text-muted-foreground">바로 확인 가능</p>
      </div>
    </Link>

    <button onClick={openChat} className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-accent">
      <MessageCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-medium">채팅 문의</p>
        <p className="text-xs text-muted-foreground">
          {isBusinessHours ? '보통 5분 이내 답변' : '평일 09:00~18:00 · 지금은 메시지를 남겨주세요'}
        </p>
      </div>
    </button>

    <Link href="/help/contact" className="flex items-start gap-3 rounded-md p-2 hover:bg-accent">
      <Mail className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-medium">이메일 문의</p>
        <p className="text-xs text-muted-foreground">보통 1영업일 이내 답변</p>
      </div>
    </Link>
  </CardContent>
</Card>
```

응답 시간을 명시하면 사용자가 기다릴지 다른 방법을 찾을지 판단할 수 있다. 명시하지 않으면 답이 없다고 생각하고 떠난다.

---

## 14. 인지 부하와 정보 밀도

### UX-COG-01 — 선택지 과다

**WHY**
선택지가 늘어나면 결정이 느려지고, 어느 시점을 넘으면 결정 자체를 미룬다. 요금제가 7개면 고르지 못하고, 설정이 40개면 아무것도 바꾸지 않는다. 선택을 늘리는 것은 사용자를 배려하는 것처럼 보이지만 실제로는 부담을 전가하는 것이다.

**DETECT**

```bash
# 화면당 인터랙티브 요소 수
rg -c "<Button|<Link|<Select|<Checkbox|<Switch|<Input" src/app/**/page.tsx \
  | sort -t: -k2 -rn | head -15

# 요금제 개수
rg -c "PlanCard|<Plan" src/app/pricing --glob "*.tsx" 2>/dev/null

# 설정 항목 수
rg -c "SettingRow|<Switch|<Select" src/app/settings --glob "*.tsx" 2>/dev/null | sort -t: -k2 -rn
```

```ts
// 첫 화면의 선택지 수 측정
test('선택지 밀도 측정', async ({ page }) => {
  const routes = ['/', '/pricing', '/dashboard', '/settings'];

  for (const route of routes) {
    await page.goto(route);

    const counts = await page.evaluate(() => {
      const fold = window.innerHeight;
      const inView = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.top < fold && r.bottom > 0 && r.height > 0;
      };
      return {
        buttons: [...document.querySelectorAll('button')].filter(inView).length,
        links: [...document.querySelectorAll('a')].filter(inView).length,
        inputs: [...document.querySelectorAll('input, select, textarea')].filter(inView).length,
      };
    });

    const total = counts.buttons + counts.links + counts.inputs;
    console.log(`${route}: 총 ${total}개 (버튼 ${counts.buttons}, 링크 ${counts.links}, 입력 ${counts.inputs})`);
  }
});
```

**진단**

```text
[ ] 첫 화면에 주 행동이 몇 개인가? (1개가 이상적)
[ ] 요금제가 몇 개인가? (3~4개가 일반적 한계)
[ ] 한 설정 화면에 항목이 몇 개인가?
[ ] 드롭다운 옵션이 몇 개인가? (10개 초과면 검색 필요)
[ ] 모든 선택지가 실제로 다른 결과를 내는가?
```

**PASS / FAIL**

- PASS: 화면마다 주 행동이 명확히 하나다. 요금제가 4개 이하다. 긴 목록에 검색·그룹화가 있다.
- FAIL: 주 행동이 여러 개로 경쟁(S2 — 전환 손실), 요금제 6개 이상(S2), 검색 없는 긴 드롭다운(S2).

**FIX**

**주 행동은 하나로**

```tsx
// ❌ 네 개가 동등한 무게로 경쟁한다
<div className="flex gap-3">
  <Button>무료 시작</Button>
  <Button>데모 예약</Button>
  <Button>영업팀 문의</Button>
  <Button>가격 보기</Button>
</div>
```

```tsx
// ✅ 시각적 위계로 하나를 부각하고 나머지는 낮춘다
<div className="flex flex-col items-center gap-4">
  <Button size="lg">무료로 시작하기</Button>
  <div className="flex items-center gap-4 text-sm">
    <Link href="/demo" className="text-muted-foreground underline underline-offset-4">
      데모 먼저 보기
    </Link>
    <span className="text-muted-foreground" aria-hidden>·</span>
    <Link href="/contact" className="text-muted-foreground underline underline-offset-4">
      영업팀 문의
    </Link>
  </div>
</div>
```

**추천을 제공해 결정을 돕는다**

```tsx
// ✅ 기본 선택을 제시하면 결정 부담이 줄어든다
<div className="grid gap-4 md:grid-cols-3">
  {PLANS.map(plan => (
    <Card
      key={plan.id}
      className={cn('relative', plan.recommended && 'border-primary shadow-lg')}
    >
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>가장 많이 선택</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        {/* 누구에게 적합한지 명시 */}
        <CardDescription>{plan.bestFor}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{fmt.currency(plan.price)}<span className="text-base font-normal text-muted-foreground">/월</span></p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {/* 차이점만 보여준다 — 공통 기능 나열은 비교를 방해한다 */}
          {plan.differentiators.map(f => (
            <li key={f} className="flex gap-2">
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={plan.recommended ? 'default' : 'outline'}>
          {plan.name} 시작하기
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

`bestFor`("5인 이하 팀에 적합")를 명시하면 사용자가 자기 상황과 대조해 빠르게 고를 수 있다. 기능 목록만 있으면 비교 계산을 해야 한다.

**긴 목록에는 검색을 제공한다**

```tsx
// ✅ 10개 초과 드롭다운은 검색 가능하게
<Combobox
  options={countries}         // 200개
  searchable
  placeholder="국가 선택"
  emptyMessage="일치하는 국가가 없습니다"
  // 자주 쓰는 항목을 상단에 고정
  pinnedOptions={['KR', 'US', 'JP']}
/>
```

**설정을 그룹화하고 고급 옵션을 접는다**

```tsx
// ✅ 기본 설정과 고급 설정을 분리
<div className="space-y-6">
  <section>
    <h2 className="mb-3 text-sm font-medium">기본 설정</h2>
    <div className="rounded-lg border">
      <SettingRow label="알림 받기" description="새 댓글과 멘션을 이메일로 받습니다">
        <Switch />
      </SettingRow>
      <SettingRow label="주간 요약" description="매주 월요일 아침에 요약을 보냅니다">
        <Switch />
      </SettingRow>
    </div>
  </section>

  <Collapsible>
    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ChevronRight className="size-4 transition-transform data-[state=open]:rotate-90" aria-hidden />
      고급 설정
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-3">
      <div className="rounded-lg border">
        {/* 대부분의 사용자가 건드리지 않는 항목들 */}
      </div>
    </CollapsibleContent>
  </Collapsible>
</div>
```

---

### UX-COG-02 — 기억 부담

**WHY**
이전 화면에서 본 정보를 기억해 다음 화면에서 써야 하면, 사용자는 메모하거나 왔다 갔다 해야 한다. 인간의 작업 기억은 짧고 좁다. 필요한 정보는 필요한 순간에 화면에 있어야 한다.

**DETECT**

```bash
# 다단계 흐름에서 이전 정보를 다시 보여주는가
rg -n "step|wizard|multi.?step" src --glob "*.tsx" | head
rg -n "summary|review|확인 화면" src --glob "*.tsx" | head

# 코드/ID를 사용자에게 기억시키는 곳
rg -n "복사|copy|clipboard" src --glob "*.tsx" | head
```

**진단**

다단계 흐름을 수행하며 확인한다.

```text
[ ] 이전 단계에서 입력한 값을 볼 수 있는가?
[ ] 이전 단계로 돌아가 수정할 수 있는가?
[ ] 최종 확인 화면에 모든 입력이 요약되는가?
[ ] 다른 화면의 정보를 참조해야 하는가?
[ ] 코드·ID를 손으로 옮겨 적어야 하는가?
```

**PASS / FAIL**

- PASS: 각 단계에서 필요한 이전 정보가 보인다. 최종 확인 화면이 있다. 코드는 복사 버튼으로 제공된다.
- FAIL: 이전 입력을 볼 수 없음(S2), 확인 화면 없이 최종 제출(S2 — 결제면 **S1**), 코드를 손으로 옮겨야 함(S2).

**FIX**

```tsx
// ✅ 다단계 흐름의 최종 확인 — 모든 입력을 요약하고 수정 링크 제공
function ReviewStep({ data, onEdit, onSubmit }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">입력하신 내용을 확인해주세요</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          결제 후에는 일부 항목을 변경할 수 없습니다.
        </p>
      </div>

      {REVIEW_SECTIONS.map(section => (
        <section key={section.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">{section.title}</h3>
            <Button variant="ghost" size="sm" onClick={() => onEdit(section.stepIndex)}>
              수정
            </Button>
          </div>
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
            {section.fields.map(f => (
              <Fragment key={f.key}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd>{f.format ? f.format(data[f.key]) : display(data[f.key])}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      ))}

      {/* 최종 금액은 별도로 강조 */}
      <div className="rounded-lg border-2 border-primary p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">결제 금액</span>
          <span className="text-2xl font-bold">{fmt.currency(data.total)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {fmt.date(data.nextBillingDate)}에 다음 결제가 진행됩니다.
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={onSubmit}>
        {fmt.currency(data.total)} 결제하기
      </Button>
    </div>
  );
}
```

버튼에 금액을 넣으면(`29,000원 결제하기`) 사용자가 마지막으로 확인할 기회를 갖는다.

**코드는 복사 가능하게**

```tsx
// ❌ 사용자가 손으로 옮겨 적어야 한다
<p>API 키: sk_live_a1b2c3d4e5f6g7h8i9j0</p>
```

```tsx
// ✅ 복사 버튼 + 피드백
function CopyableCode({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
        <code className="min-w-0 flex-1 truncate font-mono text-sm">{value}</code>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          <span className="sr-only">{copied ? '복사됨' : `${label} 복사`}</span>
        </Button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${label}를 복사했습니다` : ''}
      </span>
    </div>
  );
}
```

**맥락 정보를 유지한다**

```tsx
// ✅ 하위 화면에서도 상위 맥락을 보여준다
<header className="border-b pb-4">
  <Breadcrumbs items={[
    { label: '리포트', href: '/reports' },
    { label: report.title, href: `/reports/${report.id}` },
    { label: '공유 설정' },
  ]} />
  <div className="mt-2 flex items-baseline gap-3">
    <h1 className="text-xl font-semibold">공유 설정</h1>
    {/* 어느 리포트의 설정인지 명시 */}
    <span className="text-sm text-muted-foreground">{report.title}</span>
  </div>
</header>
```

---

### UX-COG-03 — 시각적 위계

**WHY**
모든 것이 강조되면 아무것도 강조되지 않는다. 화면에서 무엇을 먼저 봐야 할지 알 수 없으면 사용자는 좌상단부터 순서대로 훑어야 하고, 이는 느리고 피곤하다.

**DETECT**

```ts
// 강조 요소의 밀도를 측정
test('시각적 위계 감사', async ({ page }) => {
  const routes = ['/dashboard', '/reports', '/settings'];

  for (const route of routes) {
    await page.goto(route);

    const analysis = await page.evaluate(() => {
      const fold = window.innerHeight;
      const inView = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.top < fold && r.bottom > 0;
      };

      const els = [...document.querySelectorAll('*')].filter(inView);

      // 주 버튼(강조 배경) 개수
      const primaryButtons = [...document.querySelectorAll('button, a')]
        .filter(inView)
        .filter(el => {
          const bg = getComputedStyle(el).backgroundColor;
          const m = bg.match(/\d+/g);
          if (!m) return false;
          const [r, g, b, a = '1'] = m.map(Number);
          // 배경이 있고 투명하지 않음
          return Number(a) > 0.5 && (r + g + b) < 700;
        }).length;

      // 굵은 텍스트 비율
      const textEls = els.filter(el => el.children.length === 0 && el.textContent?.trim());
      const boldCount = textEls.filter(el => {
        const w = getComputedStyle(el).fontWeight;
        return Number(w) >= 600;
      }).length;

      // 폰트 크기 종류
      const sizes = new Set(textEls.map(el => getComputedStyle(el).fontSize));

      return {
        primaryButtons,
        boldRatio: textEls.length ? +(boldCount / textEls.length).toFixed(2) : 0,
        fontSizeVariants: sizes.size,
      };
    });

    console.log(route, analysis);
    if (analysis.primaryButtons > 2) console.warn(`  ⚠ 주 버튼 ${analysis.primaryButtons}개 — 경쟁`);
    if (analysis.boldRatio > 0.4) console.warn(`  ⚠ 굵은 텍스트 ${analysis.boldRatio * 100}% — 강조 희석`);
    if (analysis.fontSizeVariants > 6) console.warn(`  ⚠ 폰트 크기 ${analysis.fontSizeVariants}종 — 일관성 부족`);
  }
});
```

**PASS / FAIL**

- PASS: 화면당 주 버튼이 1~2개다. 굵은 텍스트 비율이 40% 미만이다. 폰트 크기가 6종 이하다. 시선 흐름이 명확하다.
- FAIL: 강조 요소 과다로 위계 붕괴(S2), 주 행동 식별 불가(S2).

**FIX**

```tsx
// ❌ 모든 버튼이 주 버튼
<Button>저장</Button>
<Button>취소</Button>
<Button>삭제</Button>
<Button>복제</Button>
<Button>공유</Button>
```

```tsx
// ✅ 3단계 위계
<div className="flex items-center gap-2">
  {/* 3순위: 보조 액션은 메뉴로 접는다 */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="더 보기">
        <MoreHorizontal className="size-4" aria-hidden />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onSelect={duplicate}>복제</DropdownMenuItem>
      <DropdownMenuItem onSelect={share}>공유</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={remove} className="text-destructive">
        삭제
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* 2순위 */}
  <Button variant="outline" onClick={cancel}>취소</Button>

  {/* 1순위: 주 행동 하나만 강조 */}
  <Button onClick={save}>저장</Button>
</div>
```

**타이포그래피 스케일을 제한한다**

```tsx
// ✅ 역할별로 고정된 스케일 사용
const TYPE_SCALE = {
  pageTitle: 'text-2xl font-semibold tracking-tight',       // h1
  sectionTitle: 'text-lg font-medium',                       // h2
  cardTitle: 'text-base font-medium',                        // h3
  body: 'text-sm',
  caption: 'text-xs text-muted-foreground',
  metric: 'text-3xl font-bold tabular-nums',                 // 강조 숫자
} as const;
```

**여백으로 그룹을 표현한다**

```tsx
// ❌ 균일한 여백 — 무엇이 한 묶음인지 알 수 없다
<div className="space-y-4">
  <Label>이름</Label>
  <Input />
  <Label>이메일</Label>
  <Input />
  <Label>회사</Label>
  <Input />
</div>
```

```tsx
// ✅ 근접성으로 그룹을 표현 — 라벨과 입력은 가깝게, 필드 사이는 멀게
<div className="space-y-5">
  <div className="space-y-1.5">
    <Label htmlFor="name">이름</Label>
    <Input id="name" />
  </div>
  <div className="space-y-1.5">
    <Label htmlFor="email">이메일</Label>
    <Input id="email" />
  </div>
</div>
```

관련된 것을 가깝게, 무관한 것을 멀게 배치하는 것만으로 구조가 전달된다. 선이나 상자보다 여백이 우선이다.

---

### UX-COG-04 — 데이터 밀도와 가독성

**WHY**
대시보드와 테이블은 정보를 많이 보여줘야 하지만, 밀도가 지나치면 아무것도 읽히지 않는다. 반대로 너무 성기면 스크롤이 늘어 전체를 파악할 수 없다. 밀도는 사용자 유형과 과업에 따라 달라야 한다.

**DETECT**

```ts
test('테이블 정보 밀도', async ({ page }) => {
  await page.goto('/reports');

  const density = await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return null;

    const rows = table.querySelectorAll('tbody tr');
    const cols = table.querySelectorAll('thead th');
    const firstRow = rows[0];
    const rowHeight = firstRow?.getBoundingClientRect().height ?? 0;
    const visibleRows = Math.floor(window.innerHeight / (rowHeight || 1));

    // 셀당 평균 텍스트 길이
    const cells = [...(firstRow?.querySelectorAll('td') ?? [])];
    const avgLen = cells.length
      ? cells.reduce((s, c) => s + (c.textContent?.trim().length ?? 0), 0) / cells.length
      : 0;

    return {
      columns: cols.length,
      rowHeight: Math.round(rowHeight),
      visibleRows,
      avgCellLength: Math.round(avgLen),
    };
  });

  console.log(density);
});
```

**진단**

```text
[ ] 한 화면에 몇 행이 보이는가? (10행 미만이면 비교가 어렵다)
[ ] 컬럼이 몇 개인가? (7개 초과면 가로 스크롤 발생)
[ ] 모든 컬럼이 실제로 필요한가?
[ ] 밀도를 사용자가 조절할 수 있는가?
[ ] 긴 텍스트가 잘리는가, 줄바꿈되는가?
```

**PASS / FAIL**

- PASS: 첫 화면에 10행 이상 보인다. 컬럼이 과업에 필요한 것으로 제한된다. 밀도 조절 또는 컬럼 선택이 가능하다.
- FAIL: 화면당 5행 미만(S3 — 비교 어려움), 가로 스크롤 필수(S2), 중요 정보가 잘림(S2).

**FIX**

```tsx
// ✅ 밀도 선택을 제공한다
const DENSITY = {
  compact:     { row: 'h-8',  text: 'text-xs',  padding: 'px-2' },
  comfortable: { row: 'h-11', text: 'text-sm',  padding: 'px-3' },
  spacious:    { row: 'h-14', text: 'text-sm',  padding: 'px-4' },
} as const;

function DensityToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={onChange} size="sm">
      <ToggleGroupItem value="compact" aria-label="촘촘하게">
        <Rows4 className="size-4" aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="comfortable" aria-label="보통">
        <Rows3 className="size-4" aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="spacious" aria-label="여유롭게">
        <Rows2 className="size-4" aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

밀도 선택은 `localStorage`에 저장해 다음 방문에도 유지한다. 매번 다시 설정하게 하면 기능이 무의미하다.

```tsx
// ✅ 컬럼 선택 — 필요한 것만 보게 한다
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Columns3 className="mr-2 size-4" aria-hidden />
      컬럼
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>표시할 컬럼</DropdownMenuLabel>
    <DropdownMenuSeparator />
    {ALL_COLUMNS.map(col => (
      <DropdownMenuCheckboxItem
        key={col.id}
        checked={visibleColumns.includes(col.id)}
        onCheckedChange={() => toggleColumn(col.id)}
        disabled={col.required}
      >
        {col.label}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

```tsx
// ✅ 좁은 화면에서는 테이블 대신 카드로
<div className="hidden md:block">
  <DataTable columns={columns} data={data} />
</div>

<div className="space-y-3 md:hidden">
  {data.map(item => (
    <Card key={item.id}>
      <CardContent className="p-4">
        {/* 우선순위 높은 2~3개 필드만 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {item.author} · {fmt.relative(item.updatedAt)}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

좁은 화면에서 테이블을 가로 스크롤로 밀어 넣으면 사용성이 크게 떨어진다. 카드 레이아웃으로 전환하는 편이 낫다.

---

## 15. 신뢰와 투명성

### UX-TRUST-01 — 결과 예고

**WHY**
클릭하기 전에 무엇이 일어날지 모르면 사용자는 클릭을 주저한다. 특히 결제, 데이터 공유, 외부 연동에서 예측 불가능성은 곧바로 신뢰 손실로 이어진다.

**DETECT**

```bash
# 결과 예고 문구
rg -n "즉시|바로|자동으로|나중에|이후에" src --glob "*.tsx" | head -20

# 외부 이동 표시
rg -n "target=\"_blank\"" src --glob "*.tsx" | rg -v "aria-label|sr-only|ExternalLink" | head

# 결제 관련 사전 고지
rg -n "결제|청구|과금|요금" src/app/settings/billing --glob "*.tsx" -A3 | head -30
```

**진단**

주요 행동 버튼마다 묻는다.

```text
[ ] 이 버튼을 누르면 무엇이 일어나는가?
[ ] 즉시 일어나는가, 확인 단계가 있는가?
[ ] 되돌릴 수 있는가?
[ ] 다른 사람에게 영향이 있는가? (알림 발송, 권한 변경)
[ ] 비용이 발생하는가? 얼마인가?
[ ] 외부 서비스로 이동하는가?
```

**PASS / FAIL**

- PASS: 비용·알림·권한·외부 이동이 사전에 고지된다. 즉시 실행 여부가 명확하다.
- FAIL: 예고 없는 과금(**S0**), 예고 없는 외부 알림 발송(**S1**), 외부 이동 미표시(S3).

**FIX**

```tsx
// ❌ 무엇이 일어날지 모른다
<Button onClick={upgrade}>업그레이드</Button>
```

```tsx
// ✅ 금액, 시점, 다음 결제일을 명시
<div className="rounded-lg border p-4">
  <h3 className="font-medium">Pro 플랜으로 변경</h3>

  <dl className="mt-3 space-y-2 text-sm">
    <div className="flex justify-between">
      <dt className="text-muted-foreground">지금 결제되는 금액</dt>
      <dd className="font-medium">{fmt.currency(proration)}</dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-muted-foreground">
        일할 계산 근거
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1 align-middle" aria-label="일할 계산 설명">
              <HelpCircle className="inline size-3.5 text-muted-foreground" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            현재 주기의 남은 {remainingDays}일에 해당하는 차액만 지금 청구됩니다.
          </TooltipContent>
        </Tooltip>
      </dt>
      <dd className="text-muted-foreground">{remainingDays}일분</dd>
    </div>
    <Separator />
    <div className="flex justify-between">
      <dt className="text-muted-foreground">다음 결제일</dt>
      <dd>{fmt.date(nextBillingDate)}</dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-muted-foreground">이후 매월</dt>
      <dd className="font-medium">{fmt.currency(monthlyPrice)}</dd>
    </div>
  </dl>

  <Button className="w-full mt-4" onClick={upgrade}>
    {fmt.currency(proration)} 결제하고 Pro로 변경
  </Button>

  <p className="mt-2 text-center text-xs text-muted-foreground">
    언제든 취소할 수 있으며, 남은 기간은 환불됩니다.
  </p>
</div>
```

**다른 사람에게 영향을 주는 행동을 알린다**

```tsx
// ✅ 알림이 발송된다는 사실을 명시
<div className="space-y-3">
  <Textarea placeholder="댓글을 입력하세요…" value={comment} onChange={…} />

  <div className="flex items-center justify-between">
    <p className="text-sm text-muted-foreground">
      {mentionedUsers.length > 0
        ? `${mentionedUsers.map(u => u.name).join(', ')}님에게 알림이 갑니다`
        : '이 리포트를 구독한 3명에게 알림이 갑니다'}
    </p>
    <Button onClick={submit}>댓글 남기기</Button>
  </div>
</div>
```

```tsx
// ✅ 권한 변경의 영향을 설명
<AlertDialogDescription>
  {member.name}님의 권한을 <strong>관리자</strong>로 변경합니다.
  관리자는 다음을 할 수 있습니다.
  <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm">
    <li>모든 리포트 조회 및 편집</li>
    <li>멤버 초대 및 제외</li>
    <li>결제 정보 조회 및 변경</li>
  </ul>
</AlertDialogDescription>
```

**외부 이동을 표시한다**

```tsx
// ✅ 새 창으로 열림을 시각과 텍스트로 모두 전달
<a
  href="https://docs.example.com"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
>
  개발자 문서
  <ExternalLink className="size-3.5" aria-hidden />
  <span className="sr-only">(새 창에서 열림)</span>
</a>
```

---

### UX-TRUST-02 — 데이터 처리 투명성

**WHY**
사용자는 자기 데이터가 어디에 저장되고 누가 볼 수 있는지 알고 싶어 한다. 특히 B2B에서는 고객사 데이터 취급이 계약 조건이다. 불투명하면 도입 자체가 막힌다.

**DETECT**

```bash
rg -n "개인정보|privacy|데이터 처리|약관|terms" src app --glob "*.tsx" | head
rg -n "analytics|tracking|cookie|GA4|gtag" src --glob "*.tsx" | head
fd "privacy|terms|policy" app src/app --glob "*.tsx"
rg -n "consent|동의" src --glob "*.tsx" | head
```

**진단**

```text
[ ] 어떤 데이터를 수집하는지 알 수 있는가?
[ ] 누가 내 데이터를 볼 수 있는지 알 수 있는가?
[ ] 데이터를 내보낼 수 있는가?
[ ] 계정과 데이터를 삭제할 수 있는가?
[ ] 삭제 후 얼마나 보관되는지 알 수 있는가?
[ ] 제3자 공유가 있으면 명시되는가?
```

**PASS / FAIL**

- PASS: 데이터 처리가 접근 가능한 위치에 설명된다. 내보내기와 삭제가 UI로 가능하다. 공유 범위가 명확하다.
- FAIL: 데이터 삭제 수단 없음(**S1** — 법적 리스크), 내보내기 없음(S2 — 락인), 공유 범위 불명확(S2).

**FIX**

```tsx
// ✅ 공유 범위를 명확히 표시
function ShareSettings({ report }: Props) {
  return (
    <RadioGroup value={report.visibility} onValueChange={setVisibility}>
      {[
        {
          value: 'private',
          label: '나만 보기',
          description: '나 외에는 아무도 볼 수 없습니다.',
          icon: Lock,
        },
        {
          value: 'team',
          label: '팀 전체',
          description: `팀원 ${teamSize}명이 볼 수 있습니다.`,
          icon: Users,
        },
        {
          value: 'link',
          label: '링크가 있는 모든 사용자',
          description: '링크를 아는 사람은 로그인 없이 볼 수 있습니다. 검색 엔진에는 노출되지 않습니다.',
          icon: Link2,
          warning: true,
        },
      ].map(option => (
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
            report.visibility === option.value && 'border-primary bg-accent/50',
          )}
        >
          <RadioGroupItem value={option.value} className="mt-0.5" />
          <option.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium">{option.label}</p>
            <p className={cn('mt-0.5 text-sm',
              option.warning ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
              {option.description}
            </p>
          </div>
        </label>
      ))}
    </RadioGroup>
  );
}
```

"검색 엔진에는 노출되지 않습니다" 같은 구체적 안심 문구가 판단을 돕는다.

```tsx
// ✅ 데이터 내보내기와 삭제를 제공
<section className="space-y-4">
  <div>
    <h2 className="font-medium">내 데이터</h2>
    <p className="mt-1 text-sm text-muted-foreground">
      계정에 저장된 모든 데이터를 관리합니다.
    </p>
  </div>

  <div className="rounded-lg border">
    <SettingRow
      label="데이터 내보내기"
      description="리포트, 설정, 활동 기록을 JSON 파일로 받습니다. 준비되면 이메일로 링크를 보내드립니다."
    >
      <Button variant="outline" onClick={requestExport}>내보내기 요청</Button>
    </SettingRow>

    <SettingRow
      label="계정 삭제"
      description="계정과 모든 데이터가 삭제됩니다. 삭제 후 30일간 복구할 수 있으며, 이후 영구 삭제됩니다."
    >
      <Button variant="outline" className="text-destructive" asChild>
        <Link href="/settings/account/delete">계정 삭제</Link>
      </Button>
    </SettingRow>
  </div>
</section>
```

"30일간 복구 가능"처럼 **삭제 후 처리 방식을 명시**하면 사용자가 안심하고 결정할 수 있다.

---

### UX-TRUST-03 — 자동화의 투명성

**WHY**
추천, 자동 분류, AI 생성 결과가 어떤 근거로 나왔는지 알 수 없으면 사용자는 신뢰하지 못하고, 틀렸을 때 고칠 방법도 모른다. 자동화는 편의를 주지만 통제감을 빼앗을 수 있다.

**DETECT**

```bash
rg -n "recommend|suggest|auto|AI|generated|predict" src --glob "*.tsx" | head -20
rg -n "openai|anthropic|llm|embedding" package.json src | head
rg -n "왜 이 추천|근거|based on" src --glob "*.tsx" | head
```

**진단**

```text
[ ] 자동 생성된 결과임이 표시되는가?
[ ] 왜 이런 결과가 나왔는지 알 수 있는가?
[ ] 결과를 수정할 수 있는가?
[ ] 자동화를 끌 수 있는가?
[ ] 정확도의 한계가 고지되는가?
```

**PASS / FAIL**

- PASS: 자동 생성 결과가 표시되고, 근거를 확인할 수 있으며, 수정과 비활성화가 가능하다.
- FAIL: 자동 생성임을 숨김(S2 — 신뢰 훼손), 수정 불가(S2), 근거 불명(S3).

**FIX**

```tsx
// ✅ 자동 생성 결과임을 명시하고 근거와 수정 수단을 제공
<Card>
  <CardHeader className="pb-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden />
          자동 생성된 요약
        </CardTitle>
        <CardDescription className="mt-1">
          내용을 확인하고 필요하면 수정하세요.
        </CardDescription>
      </div>
      <Button variant="ghost" size="sm" onClick={edit}>수정</Button>
    </div>
  </CardHeader>

  <CardContent>
    <p className="text-sm leading-relaxed">{summary.text}</p>

    <Collapsible className="mt-3">
      <CollapsibleTrigger className="text-xs text-muted-foreground underline underline-offset-2">
        어떻게 만들어졌나요?
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>다음 데이터를 바탕으로 생성했습니다.</p>
        <ul className="list-inside list-disc">
          {summary.sources.map(s => <li key={s.id}>{s.label}</li>)}
        </ul>
        <p className="pt-1">
          자동 생성된 내용은 부정확할 수 있습니다. 중요한 결정 전에 원본 데이터를 확인하세요.
        </p>
      </CollapsibleContent>
    </Collapsible>
  </CardContent>

  <CardFooter className="gap-2 border-t pt-3">
    <span className="text-xs text-muted-foreground">이 요약이 도움이 되었나요?</span>
    <Button variant="ghost" size="sm" onClick={() => feedback('up')} aria-label="도움됨">
      <ThumbsUp className="size-3.5" aria-hidden />
    </Button>
    <Button variant="ghost" size="sm" onClick={() => feedback('down')} aria-label="도움 안 됨">
      <ThumbsDown className="size-3.5" aria-hidden />
    </Button>
  </CardFooter>
</Card>
```

```tsx
// ✅ 추천의 근거를 표시
<div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
  <span>
    최근 30일간 조회한 리포트와 비슷한 주제라서 추천했습니다.{' '}
    <button onClick={hideRecommendations} className="underline underline-offset-2">
      추천 끄기
    </button>
  </span>
</div>
```

"추천 끄기"를 제공하면 사용자가 통제감을 유지한다. 끌 수 없는 자동화는 강요로 느껴진다.

---

### UX-TRUST-04 — 다크 패턴 점검

**WHY**
단기 지표를 올리기 위한 설계가 장기 신뢰를 파괴한다. 일부 다크 패턴은 규제 대상이기도 하다. 의도적이지 않게 다크 패턴이 되는 경우도 많으므로 점검이 필요하다.

**DETECT**

```bash
# 취소·해지 경로 은폐
rg -n "취소|해지|cancel|unsubscribe" src/app/settings --glob "*.tsx" | head

# 부정 동의 유도
rg -n "defaultChecked|checked={true}" src --glob "*.tsx" | rg -i "marketing|newsletter|동의|수신" | head

# 확인 유도 문구
rg -n "정말|아쉽|놓치|손해|후회" src --glob "*.tsx" | head

# 시각적 편향
rg -n "variant=\"ghost\".*취소|variant=\"destructive\".*취소" src --glob "*.tsx" | head
```

**점검 목록**

```markdown
| 패턴 | 설명 | 확인 |
|------|------|------|
| 로치 모텔 | 가입은 쉽고 해지는 어려움 | 해지 클릭 수 vs 가입 클릭 수 |
| 사전 체크 | 마케팅 동의가 기본 선택 | defaultChecked 검사 |
| 확인 수치심 | "아니요, 손해 보겠습니다" 같은 문구 | 거절 버튼 문구 확인 |
| 시각적 간섭 | 원하는 선택만 눈에 띄게 | 버튼 대비 비교 |
| 숨은 비용 | 마지막 단계에서 추가 요금 등장 | 결제 흐름 금액 추적 |
| 긴급성 조작 | 거짓 카운트다운, 가짜 재고 | 타이머 재현성 확인 |
| 강제 연속성 | 무료 체험 후 자동 결제 미고지 | 체험 시작 화면 확인 |
| 몰래 장바구니 | 동의 없이 항목 추가 | 결제 항목 대조 |
```

**PASS / FAIL**

- PASS: 위 패턴이 없다. 해지가 가입만큼 쉽다. 선택적 동의가 기본 해제다. 거절 선택지가 중립적으로 표현된다.
- FAIL: 다크 패턴 존재. 과금 관련이면 **S0**, 그 외 **S1**.

**FIX**

```tsx
// ❌ 마케팅 동의가 기본 선택 — 다수 관할권에서 위법
<Checkbox name="marketing" defaultChecked />
<Label>마케팅 정보 수신에 동의합니다</Label>
```

```tsx
// ✅ 선택 동의는 기본 해제, 필수/선택 구분
<div className="space-y-3">
  <div className="flex items-start gap-2">
    <Checkbox id="terms" name="terms" required />
    <Label htmlFor="terms" className="text-sm leading-snug">
      <span className="text-destructive">[필수]</span>{' '}
      <Link href="/terms" className="underline" target="_blank">이용약관</Link> 및{' '}
      <Link href="/privacy" className="underline" target="_blank">개인정보처리방침</Link>에 동의합니다
    </Label>
  </div>

  <div className="flex items-start gap-2">
    <Checkbox id="marketing" name="marketing" />
    <Label htmlFor="marketing" className="text-sm leading-snug text-muted-foreground">
      [선택] 새 기능과 활용 팁을 이메일로 받겠습니다 (언제든 해지 가능)
    </Label>
  </div>
</div>
```

```tsx
// ❌ 확인 수치심 — 거절을 감정적으로 어렵게 만든다
<Button onClick={subscribe}>네, 할인받을게요!</Button>
<button onClick={close} className="text-xs text-gray-400 underline">
  아니요, 저는 정가로 사겠습니다
</button>
```

```tsx
// ✅ 중립적 표현과 동등한 시각적 무게
<div className="flex gap-3">
  <Button variant="outline" onClick={close}>나중에 하기</Button>
  <Button onClick={subscribe}>할인 적용하기</Button>
</div>
```

```tsx
// ✅ 무료 체험은 자동 결제를 명확히 고지
<div className="rounded-lg border p-4">
  <h3 className="font-medium">14일 무료 체험 시작</h3>
  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
    <li className="flex gap-2">
      <Check className="size-4 shrink-0 text-primary" aria-hidden />
      오늘부터 {fmt.date(trialEnd)}까지 무료
    </li>
    <li className="flex gap-2">
      <Check className="size-4 shrink-0 text-primary" aria-hidden />
      체험 종료 3일 전 이메일로 안내
    </li>
    <li className="flex gap-2">
      <AlertCircle className="size-4 shrink-0 text-amber-600" aria-hidden />
      <span>
        {fmt.date(trialEnd)}에 자동으로 <strong>{fmt.currency(price)}</strong>가 결제됩니다.
        그 전에 언제든 취소할 수 있습니다.
      </span>
    </li>
  </ul>
  <Button className="mt-4 w-full">무료 체험 시작</Button>
</div>
```

**해지를 가입만큼 쉽게**

```ts
// ✅ 경로 길이를 대칭으로 유지한다
// 가입: 랜딩 → 가입 폼 → 완료 (3단계)
// 해지: 설정 → 결제 → 해지 → 완료 (4단계) — 허용 범위
// 해지: 설정 → 결제 → FAQ → 고객센터 → 채팅 대기 → … — 다크 패턴
```

```tsx
// ✅ 만류는 한 번만, 그리고 정직하게
function CancelFlow() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">구독을 취소하시겠습니까?</h1>

      <div className="rounded-lg border p-4 text-sm">
        <p className="font-medium">취소하면 이렇게 됩니다</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>{fmt.date(periodEnd)}까지는 계속 이용할 수 있습니다</li>
          <li>이후 무료 플랜으로 전환되며 리포트 3개까지만 유지됩니다</li>
          <li>데이터는 90일간 보관되며 언제든 다시 구독하면 복구됩니다</li>
        </ul>
      </div>

      {/* 대안 제시는 한 번만, 강요하지 않는다 */}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          잠시 쉬어가는 방법도 있습니다
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          최대 3개월간 구독을 일시 정지할 수 있습니다. 정지 기간에는 결제되지 않고
          데이터는 그대로 유지됩니다.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={pause}>
          구독 일시 정지
        </Button>
      </details>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack}>돌아가기</Button>
        <Button variant="destructive" onClick={confirmCancel}>구독 취소</Button>
      </div>
    </div>
  );
}
```

만류를 `<details>`로 접어두면 정보는 제공하되 강요하지 않는다. 취소 버튼이 화면에 함께 보이는 것이 중요하다.

---

## 16. 전환과 이탈

### UX-CONV-01 — 퍼널 이탈 지점

**WHY**
어디서 사용자가 떠나는지 모르면 무엇을 고쳐야 할지 알 수 없다. 감으로 개선하면 영향 없는 곳에 노력을 쓴다. 데이터가 없다면 최소한 구조적으로 마찰이 큰 지점을 식별해야 한다.

**DETECT**

```bash
# 분석 도구 연동 여부
rg -n "gtag|posthog|amplitude|mixpanel|analytics" src --glob "*.tsx" --glob "*.ts" | head

# 이벤트 추적 지점
rg -o "track\(['\"]([^'\"]+)" src -r '$1' | sort -u | head -30

# 퍼널 단계에 해당하는 라우트
fd "page.tsx" app/auth app/onboarding app/checkout 2>/dev/null
```

**진단**

데이터가 있으면 실제 퍼널을, 없으면 구조적 마찰을 분석한다.

```markdown
## 퍼널 분석 (데이터 있음)

| 단계 | 진입 | 이탈 | 이탈률 | 관찰 |
|------|------|------|--------|------|
| 랜딩 방문 | 10,000 | 8,200 | 82% | 정상 범위 |
| 가입 폼 진입 | 1,800 | 900 | 50% | **높음** |
| 가입 완료 | 900 | 100 | 11% | 정상 |
| 온보딩 1단계 | 800 | 320 | 40% | **높음** — 데이터 연결 |
| 온보딩 완료 | 480 | 80 | 17% | 정상 |
| 첫 리포트 생성 | 400 | — | — | 활성화 40% |
```

```markdown
## 구조적 마찰 분석 (데이터 없음 — ASSUMPTION)

| 단계 | 필드/클릭 | 마찰 요인 | 추정 영향 |
|------|-----------|-----------|-----------|
| 가입 폼 | 필수 7개 | 회사명·직책·전화번호가 즉시 필요하지 않음 | 높음 |
| 이메일 인증 | 앱 이탈 | 메일함으로 나갔다가 돌아와야 함 | 높음 |
| 데이터 연결 | OAuth 6클릭 | 권한 목록이 길고 설명 없음 | 높음 |
```

**PASS / FAIL**

- PASS: 퍼널 단계가 계측되고 이탈 지점이 식별된다. 각 이탈 지점에 개선 가설이 있다.
- FAIL: 계측 부재로 판단 불가(S2 — `NO_DATA`), 명백한 고마찰 지점 방치(S2).

**FIX**

```ts
// ✅ 퍼널 이벤트를 정의하고 일관되게 추적
// lib/analytics/events.ts
export const FUNNEL_EVENTS = {
  landing_viewed: {},
  signup_started: { source: '' as string },
  signup_field_error: { field: '' as string, error: '' as string },
  signup_completed: { method: '' as 'email' | 'google' },
  onboarding_step_viewed: { step: 0 as number, name: '' as string },
  onboarding_step_completed: { step: 0 as number, durationMs: 0 as number },
  onboarding_skipped: { step: 0 as number },
  activation_reached: { timeSinceSignupMs: 0 as number },
} as const;

export function track<K extends keyof typeof FUNNEL_EVENTS>(
  event: K,
  props: typeof FUNNEL_EVENTS[K],
) {
  if (typeof window === 'undefined') return;
  window.posthog?.capture(event, props);
}
```

**필드별 오류를 추적하면 폼의 어느 필드가 문제인지 알 수 있다.**

```tsx
// ✅ 검증 실패를 추적
const onSubmit = form.handleSubmit(
  values => { /* … */ },
  errors => {
    for (const [field, err] of Object.entries(errors)) {
      track('signup_field_error', { field, error: String(err?.message) });
    }
  },
);
```

특정 필드에서 오류가 집중되면 그 필드의 설명이나 검증 규칙에 문제가 있다는 신호다.

```ts
// ✅ 활성화까지의 시간 측정
useEffect(() => {
  if (justCreatedFirstReport) {
    const signupAt = Number(localStorage.getItem('signup_at') ?? 0);
    track('activation_reached', { timeSinceSignupMs: Date.now() - signupAt });
  }
}, [justCreatedFirstReport]);
```

---

### UX-CONV-02 — 마찰의 위치

**WHY**
같은 마찰이라도 어디에 있느냐에 따라 영향이 다르다. 사용자가 가치를 확인하기 **전**의 마찰은 이탈로 직결되고, 확인한 **후**의 마찰은 견딜 수 있다. 마찰을 없애기보다 뒤로 옮기는 것이 효과적인 경우가 많다.

**DETECT**

```bash
# 인증 게이트 위치
rg -n "requireAuth|redirect.*login|getServerSession" src/app --glob "*.tsx" | head -20
rg -n "matcher" src/middleware.ts -A10
```

**진단**

각 마찰 요소가 가치 확인 전인지 후인지 분류한다.

```markdown
| 마찰 | 위치 | 가치 확인 전/후 | 뒤로 옮길 수 있나 |
|------|------|-----------------|-------------------|
| 로그인 | 모든 화면 | **전** | 데모 모드로 일부 개방 가능 |
| 이메일 인증 | 가입 직후 | **전** | 외부 공유 시점으로 이동 가능 |
| 팀 이름 입력 | 온보딩 1단계 | **전** | 기본값 후 나중에 변경 가능 |
| 결제 정보 | 체험 시작 시 | **전** | 체험 종료 시점으로 이동 가능 |
| 프로필 사진 | 온보딩 | 전 | 완전히 제거 가능 |
```

**PASS / FAIL**

- PASS: 가치 확인 전의 마찰이 최소화되어 있다. 필수가 아닌 정보 수집이 뒤로 배치된다.
- FAIL: 가치 확인 전 과도한 마찰(S2), 체험 시작에 결제 정보 요구(S2 — 비즈니스 판단이나 전환 영향 큼).

**FIX**

```ts
// ✅ 미들웨어에서 공개 경로를 명시적으로 관리
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/demo',           // 데모는 로그인 없이
  '/help',           // 문서는 공개
  '/blog',
  '/auth/login',
  '/auth/signup',
];

const PUBLIC_PREFIXES = ['/help/', '/blog/', '/share/'];   // 공유 링크도 공개

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_ROUTES.includes(pathname)
    || PUBLIC_PREFIXES.some(p => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const session = req.cookies.get('session');
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    // 로그인 후 원래 목적지로 돌려보낸다
    url.searchParams.set('redirect', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

`redirect` 파라미터가 없으면 사용자가 링크를 타고 왔다가 로그인 후 홈으로 튕겨 원래 목적을 잃는다.

```tsx
// ✅ 가치 확인 후에 정보를 요구한다
// 리포트를 만든 직후 — 사용자가 가치를 경험한 시점
function PostCreationPrompt({ report }: Props) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">이 리포트를 팀과 공유할까요?</CardTitle>
        <CardDescription>
          팀원을 초대하면 매주 자동으로 업데이트된 리포트를 함께 볼 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input placeholder="팀원 이메일" type="email" />
          <Button>초대</Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" onClick={dismiss}>나중에 하기</Button>
      </CardFooter>
    </Card>
  );
}
```

가입 단계에서 "팀원을 초대하세요"라고 하면 무시되지만, 리포트를 만든 직후에는 공유할 이유가 생겨 응답률이 올라간다.

---

### UX-CONV-03 — 재방문 유도

**WHY**
SaaS는 반복 사용이 전제다. 첫 세션이 좋아도 돌아오지 않으면 의미가 없다. 그런데 재방문 유도가 과하면 알림 피로로 이어져 오히려 이탈한다.

**DETECT**

```bash
rg -n "email|notification|digest|reminder" src/lib src/jobs --glob "*.ts" | head -20
rg -n "unsubscribe|알림 설정|수신 거부" src --glob "*.tsx" | head
rg -n "cron|schedule|queue" src package.json | head
```

**진단**

```text
[ ] 사용자가 돌아올 이유가 제품 안에 있는가? (데이터 갱신, 협업, 알림)
[ ] 알림이 실제로 유용한가, 아니면 재방문 유도용인가?
[ ] 알림 빈도를 사용자가 조절할 수 있는가?
[ ] 알림에서 바로 행동할 수 있는가?
[ ] 수신 거부가 쉬운가?
```

**PASS / FAIL**

- PASS: 재방문 이유가 제품 가치에서 나온다. 알림 설정이 세분화되어 있다. 수신 거부가 1~2클릭이다.
- FAIL: 알림 설정 없음(S2), 수신 거부 어려움(**S1** — 법적 리스크), 무의미한 알림 남발(S2).

**FIX**

```tsx
// ✅ 알림 설정을 유형별·채널별로 세분화
const NOTIFICATION_TYPES = [
  {
    id: 'mentions',
    label: '나를 언급한 댓글',
    description: '누군가 댓글에서 나를 @로 언급했을 때',
    defaultChannels: ['email', 'inApp'],
  },
  {
    id: 'report_ready',
    label: '리포트 생성 완료',
    description: '예약한 리포트가 만들어졌을 때',
    defaultChannels: ['email', 'inApp'],
  },
  {
    id: 'weekly_digest',
    label: '주간 요약',
    description: '매주 월요일 아침, 지난주 활동 요약',
    defaultChannels: ['email'],
  },
  {
    id: 'product_updates',
    label: '새 기능 안내',
    description: '새로운 기능이 추가되었을 때',
    defaultChannels: [],   // 기본 해제
  },
] as const;

function NotificationSettings({ prefs, onChange }: Props) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b text-sm">
          <th scope="col" className="pb-2 text-left font-medium">알림 유형</th>
          <th scope="col" className="pb-2 font-medium">이메일</th>
          <th scope="col" className="pb-2 font-medium">앱 내</th>
        </tr>
      </thead>
      <tbody>
        {NOTIFICATION_TYPES.map(type => (
          <tr key={type.id} className="border-b last:border-0">
            <td className="py-3 pr-4">
              <p className="text-sm font-medium">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </td>
            <td className="text-center">
              <Switch
                checked={prefs[type.id]?.email ?? false}
                onCheckedChange={v => onChange(type.id, 'email', v)}
                aria-label={`${type.label} 이메일 알림`}
              />
            </td>
            <td className="text-center">
              <Switch
                checked={prefs[type.id]?.inApp ?? false}
                onCheckedChange={v => onChange(type.id, 'inApp', v)}
                aria-label={`${type.label} 앱 내 알림`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```tsx
// ✅ 전체 해제도 한 번에 가능하게
<div className="mt-6 flex items-center justify-between rounded-lg border p-4">
  <div>
    <p className="text-sm font-medium">모든 이메일 알림 끄기</p>
    <p className="text-xs text-muted-foreground">
      보안 관련 알림(로그인, 비밀번호 변경)은 계속 발송됩니다.
    </p>
  </div>
  <Switch checked={allEmailsOff} onCheckedChange={setAllEmailsOff} />
</div>
```

**이메일에서 바로 행동할 수 있게 한다**

```tsx
// ✅ 알림 이메일의 CTA는 목적지가 정확해야 한다
// ❌ "확인하기" → 대시보드로 이동 → 사용자가 다시 찾아야 함
// ✅ "댓글 확인하기" → 해당 댓글 위치로 직접 이동
const deepLink = `${BASE_URL}/reports/${reportId}#comment-${commentId}`;
```

---

## 17. 제어권과 되돌리기

### UX-CTRL-01 — 실행 취소

**WHY**
사용자는 실수한다. 실행 취소가 있으면 실수의 비용이 사라지고, 사용자는 과감하게 탐색할 수 있다. 실행 취소가 없으면 매 행동이 신중해지고, 확인 대화상자를 늘려야 하며, 그것이 다시 마찰이 된다.

**DETECT**

```bash
rg -n "undo|실행 취소|되돌리기|restore|복구" src --glob "*.tsx" --glob "*.ts" | head -20
rg -n "deletedAt|archivedAt|softDelete|trash" src prisma | head
rg -n "Cmd\+Z|ctrl.*z|metaKey.*z" src | head
```

**진단**

```markdown
| 작업 | 되돌리기 | 방법 | 유효 시간 |
|------|----------|------|-----------|
| 리포트 삭제 | 가능 | 휴지통 | 30일 |
| 멤버 제외 | 불가 | — | — |
| 설정 변경 | 불가 | 수동 재설정 | — |
| 일괄 삭제 | 불가 | — | — |
| 텍스트 편집 | 가능 | Cmd+Z | 세션 내 |
```

**PASS / FAIL**

- PASS: 파괴적 작업 대부분에 되돌리기가 있다. 방법이 발견 가능하다. 유효 시간이 명시된다.
- FAIL: 삭제 후 복구 불가(S2 — 데이터 양이 크면 **S1**), 되돌리기가 있으나 발견 불가(S2).

**FIX**

```tsx
// ✅ 즉시 되돌리기 — 토스트 액션
async function deleteReport(report: Report) {
  const undoToken = await softDelete(report.id);

  toast({
    title: '리포트를 삭제했습니다',
    description: report.title,
    duration: 10_000,   // 되돌릴 시간을 충분히
    action: (
      <ToastAction altText="실행 취소" onClick={() => restore(undoToken)}>
        실행 취소
      </ToastAction>
    ),
  });
}
```

```tsx
// ✅ 지속적 되돌리기 — 휴지통
// app/trash/page.tsx
export default async function TrashPage() {
  const items = await getDeletedItems();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">휴지통</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          삭제한 항목은 30일간 보관되며, 이후 영구 삭제됩니다.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">휴지통이 비어 있습니다</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map(item => {
            const daysLeft = differenceInDays(item.purgeAt, new Date());
            return (
              <li key={item.id} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {fmt.relative(item.deletedAt)} 삭제 ·{' '}
                    <span className={cn(daysLeft <= 3 && 'text-amber-600')}>
                      {daysLeft}일 후 영구 삭제
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => restore(item.id)}>
                    복원
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => purge(item.id)}>
                    영구 삭제
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

**설정 변경도 되돌릴 수 있게**

```tsx
// ✅ 변경 이력과 되돌리기
<div className="rounded-lg border p-4">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-medium">최근 변경</h3>
    <Button variant="ghost" size="sm" asChild>
      <Link href="/settings/audit-log">전체 기록</Link>
    </Button>
  </div>
  <ul className="mt-3 space-y-2">
    {recentChanges.map(change => (
      <li key={change.id} className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 flex-1">
          <span className="text-muted-foreground">{fmt.relative(change.at)}</span>{' '}
          {change.description}
        </span>
        {change.revertible && (
          <Button variant="ghost" size="sm" onClick={() => revert(change.id)}>
            되돌리기
          </Button>
        )}
      </li>
    ))}
  </ul>
</div>
```

---

### UX-CTRL-02 — 작업 중단

**WHY**
긴 작업을 시작했는데 멈출 수 없으면 사용자는 갇힌다. 잘못된 파일을 업로드했거나, 조건을 잘못 설정했는데도 끝날 때까지 기다려야 한다면 그 시간은 온전히 낭비된다.

**DETECT**

```bash
rg -n "AbortController|signal:|cancelToken" src | head
rg -n "취소|중단|cancel|abort" src/components --glob "*.tsx" | head -20
```

**진단**

```text
[ ] 업로드를 취소할 수 있는가?
[ ] 긴 조회를 중단할 수 있는가?
[ ] 일괄 작업을 중단할 수 있는가?
[ ] 중단 시 이미 처리된 부분이 어떻게 되는지 알려주는가?
[ ] 화면을 벗어나면 요청이 취소되는가?
```

**PASS / FAIL**

- PASS: 3초 이상 걸리는 작업에 중단 수단이 있다. 중단 결과가 명시된다. 이탈 시 요청이 정리된다.
- FAIL: 중단 불가(S2), 중단 결과 불명(S2), 이탈 후에도 요청 지속(S3 — 자원 낭비).

**FIX**

```tsx
// ✅ AbortController로 취소 가능한 요청
'use client';

function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) return;

    // 이전 요청 취소
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    // 언마운트 시에도 취소
    return () => controller.abort();
  }, [query]);

  return (
    <div>
      {loading && (
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span className="text-sm text-muted-foreground">검색 중…</span>
          <Button variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>
            중단
          </Button>
        </div>
      )}
      {/* … */}
    </div>
  );
}
```

```tsx
// ✅ 업로드 취소 + 진행률
function UploadItem({ file, onCancel }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <FileIcon className="size-8 shrink-0 text-muted-foreground" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <Progress value={file.progress} className="h-1.5 flex-1" />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {file.progress}%
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {fmt.bytes(file.uploaded)} / {fmt.bytes(file.size)}
          {file.speed && ` · ${fmt.bytes(file.speed)}/s`}
        </p>
      </div>

      <Button variant="ghost" size="icon" onClick={onCancel} aria-label={`${file.name} 업로드 취소`}>
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
```

---

### UX-CTRL-03 — 개인화와 상태 유지

**WHY**
사용자가 설정한 뷰(정렬, 필터, 컬럼, 밀도)가 다음 방문에 초기화되면 매번 다시 설정해야 한다. 이 반복 비용은 작아 보이지만 매일 쓰는 도구에서는 누적된다.

**DETECT**

```bash
rg -n "localStorage.setItem|cookies\(\)\.set" src --glob "*.tsx" --glob "*.ts" | head -20
rg -n "useLocalStorage|usePersistedState" src | head
rg -n "searchParams|URLSearchParams" src --glob "*.tsx" | wc -l
```

**진단**

각 화면에서 설정을 바꾼 뒤 새로고침하고 다시 방문한다.

```markdown
| 설정 | 새로고침 후 | 재방문 후 | 다른 기기 | 판정 |
|------|-------------|-----------|-----------|------|
| 목록 정렬 | 유지(URL) | 초기화 | 초기화 | 개선 여지 |
| 컬럼 선택 | 초기화 | 초기화 | 초기화 | **불편** |
| 사이드바 접힘 | 초기화 | 초기화 | 초기화 | **불편** |
| 테마 | 유지 | 유지 | 초기화 | OK |
| 언어 | 유지 | 유지 | 유지 | 양호 |
```

**PASS / FAIL**

- PASS: 뷰 설정이 재방문 시 유지된다. 공유 가능한 상태는 URL에, 개인 설정은 저장소에 있다.
- FAIL: 자주 쓰는 설정이 매번 초기화(S3, 빈도 높으면 S2), 상태가 URL에 없어 공유 불가(S2).

**FIX**

```ts
// ✅ 상태의 성격에 따라 저장 위치를 나눈다
// URL: 공유·북마크·뒤로 가기가 필요한 것 (필터, 검색, 페이지)
// localStorage: 개인 선호 (밀도, 컬럼, 사이드바)
// 서버: 기기 간 동기화가 필요한 것 (테마, 언어, 알림 설정)

export function useViewPreferences(key: string, defaults: Prefs) {
  const [prefs, setPrefs] = useState<Prefs>(defaults);

  // 하이드레이션 불일치를 피하려고 마운트 후에 읽는다
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`view-prefs:${key}`);
      if (saved) setPrefs({ ...defaults, ...JSON.parse(saved) });
    } catch {}
  }, [key]);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(`view-prefs:${key}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(`view-prefs:${key}`); } catch {}
    setPrefs(defaults);
  }, [key]);

  return { prefs, update, reset };
}
```

```tsx
// ✅ 사이드바 상태는 쿠키로 — 서버 렌더 시점에 알 수 있어 깜빡임이 없다
// app/layout.tsx
export default async function RootLayout({ children }: Props) {
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get('sidebar-collapsed')?.value === '1';

  return (
    <html lang="ko">
      <body>
        <SidebarProvider defaultCollapsed={sidebarCollapsed}>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
```

`localStorage`로 사이드바 상태를 관리하면 첫 렌더에서 펼쳐진 상태로 나왔다가 접히는 깜빡임이 발생한다. 쿠키를 쓰면 서버가 미리 알 수 있다.

```tsx
// ✅ 저장된 뷰(Saved View) — 반복 작업을 재사용 가능하게
<div className="flex items-center gap-2">
  <Select value={currentViewId} onValueChange={loadView}>
    <SelectTrigger className="w-52">
      <SelectValue placeholder="저장된 보기" />
    </SelectTrigger>
    <SelectContent>
      {savedViews.map(v => (
        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  {hasUnsavedChanges && (
    <Button variant="outline" size="sm" onClick={saveCurrentView}>
      현재 조건 저장
    </Button>
  )}
</div>
```

매일 같은 필터를 적용하는 사용자에게는 저장된 뷰가 큰 시간 절약이 된다.

---

## 18. 모바일 UX 특수성

> 모바일 레이아웃·뷰포트·터치 타깃의 기술적 검증은 `02_Mobile_QA.md`가 다룬다. 이 절은 **모바일에서만 달라지는 사용성 판단**에 집중한다.

### UX-MOB-01 — 과업의 모바일 적합성

**WHY**
모든 과업을 모바일에서 해야 하는 것은 아니다. 복잡한 리포트 편집은 데스크톱에서 하는 것이 자연스럽다. 문제는 (a) 모바일에서 자주 하는 과업이 모바일에 최적화되지 않았거나, (b) 모바일에서 할 수 없는 과업인데 그 사실을 알려주지 않는 경우다.

**DETECT**

```ts
test('모바일에서 P0 과업 수행 가능성', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();

  const tasks = [
    { name: '리포트 조회', url: '/reports' },
    { name: '리포트 생성', url: '/reports/new' },
    { name: '멤버 초대', url: '/team' },
    { name: '결제 수단 변경', url: '/settings/billing/payment' },
  ];

  for (const task of tasks) {
    await page.goto(task.url);

    const issues = await page.evaluate(() => {
      const problems: string[] = [];

      // 가로 스크롤
      if (document.documentElement.scrollWidth > window.innerWidth + 1) {
        problems.push(`가로 스크롤 (${document.documentElement.scrollWidth}px > ${window.innerWidth}px)`);
      }

      // 작은 터치 타깃
      const small = [...document.querySelectorAll('button, a, input, select')]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.width < 44 || r.height < 44);
        });
      if (small.length) problems.push(`44px 미만 타깃 ${small.length}개`);

      // 작은 폰트
      const tiny = [...document.querySelectorAll('p, span, li, td')]
        .filter(el => el.children.length === 0 && el.textContent?.trim())
        .filter(el => parseFloat(getComputedStyle(el).fontSize) < 14);
      if (tiny.length) problems.push(`14px 미만 텍스트 ${tiny.length}개`);

      return problems;
    });

    console.log(`${task.name}:`, issues.length ? issues : '문제 없음');
    await page.screenshot({ path: `tmp/qa/ux/mobile-${task.name}.png`, fullPage: true });
  }
});
```

**진단**

과업별로 모바일 사용 빈도와 적합성을 대조한다.

```markdown
| 과업 | 모바일 사용 추정 | 모바일 적합성 | 판정 |
|------|------------------|---------------|------|
| 리포트 조회 | **높음** (이동 중 확인) | 좋음 | OK |
| 알림 확인 | **높음** | 좋음 | OK |
| 댓글 작성 | 중간 | 보통 | OK |
| 리포트 생성 | 낮음 | **나쁨** (필드 20개) | 안내 필요 |
| 결제 수단 변경 | 낮음 | **나쁨** (테이블 가로 스크롤) | **개선 필요** |
```

**PASS / FAIL**

- PASS: 모바일 사용 빈도가 높은 과업이 모바일에 최적화되어 있다. 부적합한 과업은 안내가 있다.
- FAIL: 자주 쓰는 과업이 모바일에서 불가(**S1**), 가로 스크롤 발생(S2), 안내 없이 기능 부재(S2).

**FIX**

```tsx
// ✅ 모바일에 부적합한 기능은 이유와 대안을 안내
function ReportEditor() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <div className="mx-auto max-w-sm py-12 text-center">
        <Monitor className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-medium">리포트 편집은 큰 화면에서 하는 것이 편합니다</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          여러 항목을 배치하고 미리 보려면 넓은 화면이 필요합니다.
          데스크톱에서 이어서 작업하세요.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={sendLinkToEmail}>이 페이지 링크를 내 이메일로 보내기</Button>
          <Button variant="outline" asChild>
            <Link href={`/reports/${report.id}`}>미리 보기만 하기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <FullEditor report={report} />;
}
```

기능을 막을 때는 **대안**을 반드시 제공한다. "데스크톱에서 이용하세요"만 있으면 막다른 길이다. 링크를 이메일로 보내주면 사용자가 나중에 이어갈 수 있다.

```tsx
// ✅ 자주 쓰는 과업은 모바일 전용 레이아웃으로
// 결제 수단: 테이블 대신 카드 목록
<div className="space-y-3 md:hidden">
  {paymentMethods.map(pm => (
    <div key={pm.id} className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CardBrandIcon brand={pm.brand} className="size-8" aria-hidden />
          <div>
            <p className="text-sm font-medium">•••• {pm.last4}</p>
            <p className="text-xs text-muted-foreground">
              {pm.expMonth}/{pm.expYear} 만료
            </p>
          </div>
        </div>
        {pm.isDefault && <Badge variant="secondary">기본</Badge>}
      </div>

      {/* 터치하기 좋은 크기의 액션 */}
      <div className="mt-3 flex gap-2">
        {!pm.isDefault && (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setDefault(pm.id)}>
            기본으로 설정
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1" onClick={() => remove(pm.id)}>
          삭제
        </Button>
      </div>
    </div>
  ))}
</div>
```

---

### UX-MOB-02 — 한 손 조작과 도달 범위

**WHY**
모바일 사용자는 대부분 한 손으로 조작한다. 화면 상단은 엄지로 닿기 어렵고, 큰 화면일수록 더 그렇다. 주요 행동 버튼이 상단에만 있으면 매번 손을 바꾸거나 기기를 고쳐 잡아야 한다.

**DETECT**

```ts
test('주요 행동의 도달 범위', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  await page.goto('/reports');

  const reach = await page.evaluate(() => {
    const h = window.innerHeight;
    // 엄지 도달이 편한 영역: 화면 하단 약 55%
    const comfortableTop = h * 0.45;

    return [...document.querySelectorAll('button, a[href]')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.top < h;
      })
      .map(el => {
        const r = el.getBoundingClientRect();
        return {
          text: (el.textContent ?? '').trim().slice(0, 25),
          top: Math.round(r.top),
          zone: r.top < comfortableTop ? '도달 어려움' : '편함',
        };
      });
  });

  console.table(reach.filter(r => r.zone === '도달 어려움'));
});
```

**PASS / FAIL**

- PASS: 주 행동이 화면 하단 절반에 있거나, 하단에도 접근 수단이 있다. 파괴적 행동은 실수로 누르기 어려운 위치에 있다.
- FAIL: 주 행동이 상단에만 존재(S3, 빈도 높으면 S2), 파괴적 행동이 엄지 위치에 있음(S2).

**FIX**

```tsx
// ✅ 모바일에서는 주 행동을 하단 고정 바로
<>
  {/* 데스크톱: 헤더 우측 */}
  <div className="hidden md:block">
    <Button asChild><Link href="/reports/new">새 리포트</Link></Button>
  </div>

  {/* 모바일: 하단 고정 — 엄지로 닿는 위치 */}
  <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
    <Button className="w-full" size="lg" asChild>
      <Link href="/reports/new">새 리포트 만들기</Link>
    </Button>
  </div>

  {/* 고정 바에 콘텐츠가 가리지 않도록 여백 확보 */}
  <div className="pb-24 md:pb-0" />
</>
```

`env(safe-area-inset-bottom)`을 반영하지 않으면 홈 인디케이터가 있는 기기에서 버튼이 가려진다.

```tsx
// ✅ 파괴적 행동은 시트 안쪽에 배치해 실수를 줄인다
<Sheet>
  <SheetContent side="bottom">
    <SheetHeader><SheetTitle>리포트 옵션</SheetTitle></SheetHeader>
    <div className="mt-4 space-y-1">
      {/* 자주 쓰는 것을 아래에 (엄지에 가깝게) */}
      <SheetAction onClick={remove} destructive>삭제</SheetAction>
      <Separator className="my-2" />
      <SheetAction onClick={duplicate}>복제</SheetAction>
      <SheetAction onClick={share}>공유</SheetAction>
      <SheetAction onClick={edit}>편집</SheetAction>
    </div>
  </SheetContent>
</Sheet>
```

삭제를 목록 맨 위에 두고 구분선으로 분리하면, 엄지 위치와 멀어져 실수가 줄어든다.

---

### UX-MOB-03 — 입력 부담

**WHY**
모바일 타이핑은 데스크톱보다 훨씬 느리고 오타가 많다. 데스크톱에서 30초 걸리는 폼이 모바일에서는 3분이 걸릴 수 있다. 입력을 줄이는 것이 모바일에서 특히 중요하다.

**DETECT**

```bash
rg -n "inputMode|type=\"tel\"|type=\"email\"|type=\"number\"" src --glob "*.tsx" | wc -l
rg -n "<Input" src --glob "*.tsx" | rg -v "inputMode|type=" | head -20
rg -n "autoCapitalize|autoCorrect|spellCheck" src --glob "*.tsx" | head
```

**진단**

실제 모바일 기기 또는 에뮬레이션으로 폼을 채워본다.

```text
[ ] 각 필드에서 올바른 키보드가 뜨는가?
[ ] 자동완성이 동작하는가?
[ ] 자동 대문자화가 잘못 적용되지 않는가? (이메일에 대문자 시작)
[ ] 선택으로 대체할 수 있는 입력이 있는가?
[ ] 키보드가 입력 필드를 가리는가?
[ ] "다음" 키로 필드 간 이동이 되는가?
```

**PASS / FAIL**

- PASS: 필드마다 적절한 키보드와 자동완성이 설정된다. 키보드가 입력 필드를 가리지 않는다.
- FAIL: 키보드가 활성 필드를 가림(S2), 잘못된 키보드 타입(S3), 자동완성 미지원(S2).

**FIX**

```tsx
// ✅ 모바일 입력 최적화 속성 전체
<Input
  type="email"
  inputMode="email"
  autoComplete="email"
  autoCapitalize="none"     // 이메일에 대문자 시작 방지
  autoCorrect="off"         // 자동 수정 방지
  spellCheck={false}
  enterKeyHint="next"       // 키보드의 엔터 키를 "다음"으로
/>

<Input
  type="text"
  inputMode="numeric"
  autoComplete="postal-code"
  enterKeyHint="done"
/>
```

`autoCapitalize="none"`이 없으면 iOS에서 이메일 첫 글자가 대문자가 되어 사용자가 매번 고쳐야 한다.

```tsx
// ✅ 키보드가 필드를 가리지 않게
'use client';

export function useScrollIntoViewOnFocus() {
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el.matches('input, textarea, select')) return;

      // 키보드 애니메이션이 끝난 뒤 스크롤
      setTimeout(() => {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 300);
    };

    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);
}
```

```ts
// ✅ visualViewport로 키보드 높이를 반영
useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;

  const update = () => {
    const keyboardHeight = window.innerHeight - vv.height;
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
  };

  vv.addEventListener('resize', update);
  update();
  return () => vv.removeEventListener('resize', update);
}, []);
```

```css
/* 하단 고정 요소를 키보드 위로 올린다 */
.sticky-footer {
  bottom: calc(var(--keyboard-height, 0px) + env(safe-area-inset-bottom));
}
```

**입력을 선택으로 대체한다**

```tsx
// ❌ 모바일에서 날짜를 타이핑하게 한다
<Input placeholder="YYYY-MM-DD" name="date" />

// ✅ 네이티브 날짜 선택기 사용
<Input type="date" name="date" />

// ✅ 자주 쓰는 값은 버튼으로
<div className="flex flex-wrap gap-2">
  {['오늘', '어제', '지난 7일', '지난 30일', '이번 달'].map(preset => (
    <Button key={preset} variant="outline" size="sm" onClick={() => applyPreset(preset)}>
      {preset}
    </Button>
  ))}
</div>
```

---

## 19. 접근성 관점의 사용성

> 접근성의 기술적 검증(ARIA, 대비율, 스크린리더 호환)은 `09_Accessibility_QA.md`가 다룬다. 이 절은 **접근성 결함이 곧 사용성 결함인 지점**만 다룬다.

### UX-A11Y-01 — 키보드만으로 과업 완수

**WHY**
키보드로 할 수 없는 기능은 일부 사용자에게 존재하지 않는 기능이다. 이는 접근성 문제이면서, 키보드를 선호하는 숙련 사용자의 효율 문제이기도 하다.

**DETECT**

```ts
test('키보드만으로 P0 과업 완수', async ({ page }) => {
  await page.goto('/reports');

  // 마우스 없이 Tab만으로 주 행동에 도달 가능한가
  const reachable: string[] = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        text: (el.textContent ?? '').trim().slice(0, 30),
        tag: el.tagName,
        // 포커스 표시가 보이는가
        hasOutline: style.outlineStyle !== 'none' && style.outlineWidth !== '0px',
        hasRing: style.boxShadow !== 'none',
        visible: rect.width > 0 && rect.height > 0,
      };
    });
    if (!focused) break;
    reachable.push(`${focused.tag}: ${focused.text}`);

    if (!focused.hasOutline && !focused.hasRing) {
      console.error(`❌ 포커스 표시 없음: ${focused.tag} "${focused.text}"`);
    }
    if (!focused.visible) {
      console.error(`❌ 보이지 않는 요소에 포커스: ${focused.tag}`);
    }
  }

  console.log('Tab 순서:', reachable);
});
```

**PASS / FAIL**

- PASS: 모든 P0 과업을 키보드만으로 완수할 수 있다. 포커스 표시가 항상 보인다. Tab 순서가 시각 순서와 일치한다.
- FAIL: 키보드로 완수 불가(**S1**), 포커스 표시 없음(S2), 포커스가 보이지 않는 요소로 이동(S2).

**FIX**

```tsx
// ❌ 호버에서만 나타나는 액션 — 키보드로 도달 불가
<div className="group">
  <span>{item.title}</span>
  <div className="opacity-0 group-hover:opacity-100">
    <Button>편집</Button>
  </div>
</div>
```

```tsx
// ✅ 포커스에서도 나타나게
<div className="group">
  <span>{item.title}</span>
  <div className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
    <Button>편집</Button>
  </div>
</div>
```

```css
/* ✅ 포커스 표시를 절대 제거하지 않는다 */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* 어두운 배경 위에서도 보이게 이중 링 */
.dark :focus-visible {
  outline-color: hsl(var(--ring));
  box-shadow: 0 0 0 4px hsl(var(--background));
}
```

```tsx
// ✅ 건너뛰기 링크 — 반복 내비게이션을 지나칠 수 있게
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-ring"
>
  본문으로 건너뛰기
</a>
```

---

### UX-A11Y-02 — 색과 감각에 대한 의존

**WHY**
정보를 색으로만 전달하면 색각 이상 사용자와 흑백 출력에서 전달되지 않는다. 소리로만 알리면 무음 환경에서 놓친다. 감각 하나에만 의존하는 설계는 조건이 달라지면 실패한다.

**DETECT**

```ts
test('색에만 의존하는 정보 표현', async ({ page }) => {
  await page.goto('/reports');

  // 그레이스케일로 렌더해 구분 가능성 확인
  await page.addStyleTag({ content: 'html { filter: grayscale(1); }' });
  await page.screenshot({ path: 'tmp/qa/ux/grayscale.png', fullPage: true });

  // 상태 배지가 텍스트를 포함하는가
  const badges = await page.locator('[class*="badge"], [data-status]').evaluateAll(els =>
    els.map(el => ({
      text: (el.textContent ?? '').trim(),
      hasText: (el.textContent ?? '').trim().length > 0,
    })));

  const iconOnly = badges.filter(b => !b.hasText);
  expect(iconOnly.length, `텍스트 없는 상태 표시 ${iconOnly.length}개`).toBe(0);
});
```

**PASS / FAIL**

- PASS: 모든 상태·구분이 색 외에 텍스트·아이콘·형태로도 전달된다. 그레이스케일에서 구분된다.
- FAIL: 색으로만 상태 구분(S2), 오류를 붉은 테두리로만 표시(S2).

**FIX**

```tsx
// ❌ 색으로만 구분
<span className={status === 'ok' ? 'text-green-600' : 'text-red-600'}>●</span>
```

```tsx
// ✅ 색 + 아이콘 + 텍스트
const STATUS_DISPLAY = {
  ok:      { icon: CheckCircle, label: '정상', className: 'text-emerald-600' },
  warning: { icon: AlertTriangle, label: '주의', className: 'text-amber-600' },
  error:   { icon: XCircle, label: '오류', className: 'text-destructive' },
} as const;

function StatusIndicator({ status }: { status: keyof typeof STATUS_DISPLAY }) {
  const { icon: Icon, label, className } = STATUS_DISPLAY[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <Icon className="size-4" aria-hidden />
      {label}
    </span>
  );
}
```

```tsx
// ✅ 폼 오류: 테두리 색 + 아이콘 + 텍스트 + aria-invalid
<Input aria-invalid={hasError} aria-describedby={hasError ? 'field-error' : undefined}
       className={cn(hasError && 'border-destructive')} />
{hasError && (
  <p id="field-error" role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
    <AlertCircle className="size-3.5" aria-hidden />
    이메일 형식을 확인해주세요
  </p>
)}
```

---

### UX-A11Y-03 — 시간 제한과 자동 변화

**WHY**
자동으로 사라지는 알림, 자동 로그아웃, 자동 회전 캐러셀은 천천히 읽는 사용자, 보조 기술 사용자, 주의가 분산된 사용자에게 정보를 놓치게 한다.

**DETECT**

```bash
rg -n "setTimeout|setInterval" src --glob "*.tsx" | rg -i "close|hide|dismiss|logout|next" | head
rg -n "autoplay|autoPlay|carousel.*interval" src --glob "*.tsx" | head
rg -n "sessionTimeout|idleTimeout|expiresIn" src | head
```

**PASS / FAIL**

- PASS: 자동 사라짐이 있는 정보는 다른 곳에서도 확인할 수 있다. 세션 만료 전에 경고와 연장 수단이 있다. 자동 회전은 정지할 수 있다.
- FAIL: 중요 정보가 자동으로 사라지고 재확인 불가(S2), 세션 만료 경고 없음(**S1** — 작업 손실), 정지 불가한 자동 회전(S2).

**FIX**

```tsx
// ✅ 세션 만료 전 경고와 연장
function SessionTimeoutWarning() {
  const { expiresAt, extend } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(Math.round(left / 1000));
      setShowWarning(left > 0 && left < 5 * 60_000);   // 5분 전
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!showWarning) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>곧 자동으로 로그아웃됩니다</AlertDialogTitle>
          <AlertDialogDescription>
            보안을 위해 {Math.floor(remaining / 60)}분 {remaining % 60}초 후 로그아웃됩니다.
            작성 중인 내용은 임시 저장되어 있습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={logout}>지금 로그아웃</AlertDialogCancel>
          <AlertDialogAction onClick={extend}>로그인 유지</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

```tsx
// ✅ 자동 회전은 정지 가능하고, 호버·포커스 시 멈춘다
function Carousel({ items }: Props) {
  const [playing, setPlaying] = useState(!prefersReducedMotion());

  return (
    <div
      role="region"
      aria-label="추천 콘텐츠"
      aria-roledescription="캐러셀"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      onFocusCapture={() => setPlaying(false)}
    >
      {/* … */}
      <Button variant="ghost" size="sm" onClick={() => setPlaying(p => !p)}>
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        <span className="sr-only">{playing ? '자동 재생 정지' : '자동 재생 시작'}</span>
      </Button>
    </div>
  );
}
```

```tsx
// ✅ 사라진 알림을 다시 볼 수 있게
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" aria-label={`알림 ${unread}개`}>
      <Bell className="size-4" aria-hidden />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-80 p-0">
    <NotificationList />
  </PopoverContent>
</Popover>
```

토스트로 지나간 알림이 알림 센터에도 남아 있으면, 놓쳐도 확인할 수 있다.

---

## 20. 계측과 근거 수집

### UX-MEAS-01 — 과업 측정 자동화

**WHY**
"이 화면이 복잡하다"는 인상이지만, "이 과업에 클릭 23회, 화면 전환 7회, 4분 12초가 걸린다"는 사실이다. 측정은 감사 결과를 논쟁에서 데이터로 옮긴다. 또한 개선 후 비교가 가능해진다.

**DETECT / 구현**

```ts
// tests/ux/lib/task-recorder.ts
import type { Page, TestInfo } from '@playwright/test';

export type TaskStep = {
  index: number;
  action: string;
  url: string;
  elapsedMs: number;
  screenshot: string;
};

export class TaskRecorder {
  private steps: TaskStep[] = [];
  private startedAt = 0;
  private metrics = { clicks: 0, inputs: 0, keypresses: 0, scrolls: 0, navigations: 0 };

  constructor(
    private page: Page,
    private testInfo: TestInfo,
    private taskName: string,
  ) {}

  async start() {
    this.startedAt = Date.now();

    await this.page.exposeFunction('__uxEvent', (type: string) => {
      if (type in this.metrics) (this.metrics as any)[type]++;
    });

    await this.page.addInitScript(() => {
      const emit = (t: string) => (window as any).__uxEvent?.(t);
      document.addEventListener('click', () => emit('clicks'), true);
      document.addEventListener('input', () => emit('inputs'), true);
      document.addEventListener('keydown', e => {
        if (e.key.length === 1) emit('keypresses');
      }, true);

      let scrollTimer: any;
      document.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => emit('scrolls'), 250);
      }, true);
    });

    this.page.on('framenavigated', f => {
      if (f === this.page.mainFrame()) this.metrics.navigations++;
    });
  }

  /** 각 의미 있는 단계마다 호출한다 */
  async step(action: string) {
    const index = this.steps.length + 1;
    const dir = `tmp/qa/ux/${this.taskName}`;
    const screenshot = `${dir}/${String(index).padStart(2, '0')}-${slug(action)}.png`;

    await this.page.screenshot({ path: screenshot, fullPage: true });

    this.steps.push({
      index,
      action,
      url: this.page.url(),
      elapsedMs: Date.now() - this.startedAt,
      screenshot,
    });
  }

  async finish(completed: boolean, blocker?: string) {
    const report = {
      task: this.taskName,
      completed,
      blocker: blocker ?? null,
      totalMs: Date.now() - this.startedAt,
      metrics: this.metrics,
      steps: this.steps,
    };

    await this.testInfo.attach(`ux-task-${this.taskName}`, {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });

    console.log(`\n=== ${this.taskName} ===`);
    console.log(`완수: ${completed ? '예' : `아니오 (${blocker})`}`);
    console.log(`소요: ${(report.totalMs / 1000).toFixed(1)}초`);
    console.table(this.metrics);
    console.table(this.steps.map(s => ({ 단계: s.index, 행동: s.action, 경과초: (s.elapsedMs / 1000).toFixed(1) })));

    return report;
  }
}

const slug = (s: string) => s.replace(/[^\w가-힣]+/g, '-').toLowerCase().slice(0, 40);
```

```ts
// tests/ux/p0-tasks.spec.ts — 사용 예
import { test } from '@playwright/test';
import { TaskRecorder } from './lib/task-recorder';

test('P0-1: 가입 후 첫 리포트 발행', async ({ page }, testInfo) => {
  const rec = new TaskRecorder(page, testInfo, 'p0-1-first-report');
  await rec.start();

  await page.goto('/');
  await rec.step('랜딩 도착');

  await page.getByRole('link', { name: /무료로 시작/ }).click();
  await rec.step('가입 화면 진입');

  await page.getByLabel('이메일').fill(`ux-${Date.now()}@example.test`);
  await page.getByLabel('비밀번호').fill('Test1234!@');
  await page.getByRole('button', { name: /계정 만들기/ }).click();
  await rec.step('가입 완료');

  // … 이후 단계 …

  await rec.finish(true);
});
```

**PASS / FAIL**

- PASS: P0 과업이 자동 측정되고, 결과가 기준선으로 저장된다. 개선 전후를 비교할 수 있다.
- FAIL: 측정 없이 인상으로만 판단(S2 — 감사 품질 저하).

---

### UX-MEAS-02 — 사용 데이터 대조

**WHY**
감사자의 관찰과 실제 사용 패턴이 다를 수 있다. 감사자는 제품을 알고 있으므로 초보자가 겪는 어려움을 놓치고, 반대로 실제로는 거의 쓰이지 않는 기능에 시간을 쓸 수 있다.

**DETECT**

```bash
# 분석 도구 연동 확인
rg -n "posthog|amplitude|mixpanel|gtag|clarity|hotjar" src app package.json | head

# 추적되는 이벤트 목록
rg -o "capture\(['\"]([^'\"]+)|track\(['\"]([^'\"]+)" src -r '$1$2' | sort -u
```

**대조 항목**

```markdown
| 질문 | 데이터 출처 | 결과 | 감사자 예상과 일치 |
|------|-------------|------|--------------------|
| 가장 많이 쓰는 기능은? | 이벤트 빈도 | 리포트 조회 68% | 예 |
| 가장 이탈이 많은 단계는? | 퍼널 | 데이터 연결 40% | **아니오** (가입 폼 예상) |
| 오류가 가장 잦은 지점은? | 오류 로그 | 파일 업로드 | 예 |
| 가장 많은 문의 주제는? | 지원 티켓 | 구독 취소 방법 | **아니오** |
| 검색에서 결과 없는 검색어는? | 검색 로그 | "인보이스", "환불" | — |
```

**데이터가 없을 때**

```markdown
## 계측 부재 (NO_DATA)

다음 항목은 데이터가 없어 구조적 추론에 의존했다.

- 실제 이탈 지점: 분석 도구 미연동
- 기능별 사용 빈도: 이벤트 추적 없음
- 오류 발생 빈도: 클라이언트 오류 수집 없음

**권장:** 최소한 아래 이벤트를 추적하면 다음 감사부터 근거가 생긴다.
- 퍼널 단계 진입/완료
- 폼 필드별 검증 실패
- 클라이언트 오류 (전역 error 핸들러)
- 검색어와 결과 수
```

**FIX**

```tsx
// ✅ 최소 계측 세트 — 이것만 있어도 다음 감사의 질이 달라진다
'use client';

export function AnalyticsProvider({ children }: Props) {
  // 1. 클라이언트 오류
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      track('client_error', { message: e.message, source: e.filename, line: e.lineno });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      track('unhandled_rejection', { reason: String(e.reason).slice(0, 200) });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // 2. 페이지 체류 시간
  const pathname = usePathname();
  useEffect(() => {
    const enteredAt = Date.now();
    return () => {
      track('page_exit', { path: pathname, durationMs: Date.now() - enteredAt });
    };
  }, [pathname]);

  // 3. 격한 클릭 (rage click) — 반응 없는 UI의 신호
  useEffect(() => {
    let clicks: { t: number; x: number; y: number }[] = [];
    const onClick = (e: MouseEvent) => {
      const now = Date.now();
      clicks = clicks.filter(c => now - c.t < 1000);
      clicks.push({ t: now, x: e.clientX, y: e.clientY });

      // 1초 내 같은 지점(30px 이내) 3회 이상
      const near = clicks.filter(c =>
        Math.hypot(c.x - e.clientX, c.y - e.clientY) < 30);
      if (near.length >= 3) {
        const target = e.target as HTMLElement;
        track('rage_click', {
          path: location.pathname,
          element: target.tagName,
          text: (target.textContent ?? '').trim().slice(0, 50),
        });
        clicks = [];
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return <>{children}</>;
}
```

**격한 클릭(rage click)은 사용성 문제의 강력한 신호다.** 같은 곳을 반복해서 누른다는 것은 반응이 없거나, 눌리지 않거나, 기대와 다른 일이 일어났다는 뜻이다.

---

### UX-MEAS-03 — 증거 수집 표준

**WHY**
Finding에 증거가 없으면 반박당하고, 증거 형식이 제각각이면 리포트를 읽는 사람이 맥락을 재구성해야 한다.

**증거 표준**

```text
증거 저장 위치: tmp/qa/ux/<YYYY-MM-DD>/
파일명 규칙:     <FindingID>-<순번>-<설명>.<확장자>
예:              UX-F001-01-billing-tab-no-cancel.png

필수 증거 (Finding 유형별)
- 흐름 문제  → 단계별 스크린샷 전체 + 측정 데이터(JSON)
- 화면 문제  → 문제 지점 스크린샷 (전체 화면 + 확대)
- 카피 문제  → 원문 텍스트 인용 + 스크린샷
- 성능 문제  → 측정 수치 + 조건(네트워크·CPU) 명시
- 접근성 문제 → 재현 절차 + 자동 검사 결과
```

```ts
// tests/ux/lib/evidence.ts
export class Evidence {
  private dir: string;
  private count = 0;

  constructor(private findingId: string) {
    const date = new Date().toISOString().slice(0, 10);
    this.dir = `tmp/qa/ux/${date}`;
  }

  async capture(page: Page, description: string, opts?: { element?: Locator; fullPage?: boolean }) {
    this.count++;
    const name = `${this.findingId}-${String(this.count).padStart(2, '0')}-${slug(description)}.png`;
    const path = `${this.dir}/${name}`;

    if (opts?.element) {
      await opts.element.screenshot({ path });
    } else {
      await page.screenshot({ path, fullPage: opts?.fullPage ?? true });
    }

    return path;
  }

  async annotate(page: Page, selector: string, description: string) {
    // 문제 지점을 붉은 테두리로 표시한 뒤 캡처
    await page.locator(selector).evaluate(el => {
      el.setAttribute('data-ux-highlight', '1');
    });
    await page.addStyleTag({
      content: `[data-ux-highlight] { outline: 3px solid #ef4444 !important; outline-offset: 2px; }`,
    });
    const path = await this.capture(page, description);
    await page.locator(selector).evaluate(el => el.removeAttribute('data-ux-highlight'));
    return path;
  }
}
```

문제 지점에 테두리를 그려 캡처하면, 리포트를 읽는 사람이 어디를 봐야 하는지 즉시 안다.

---

## 21. 벤치마크와 비교 감사

### UX-BENCH-01 — 관습 대비 평가

**WHY**
사용자는 다른 제품에서 학습한 기대를 가지고 온다. 장바구니는 우상단에, 설정은 톱니바퀴 아이콘으로, 저장은 Cmd+S로. 관습을 깨는 것은 학습 비용을 발생시키며, 그럴 만한 이유가 있어야 정당하다.

**DETECT**

```bash
# 표준 단축키 지원
rg -n "metaKey|ctrlKey" src --glob "*.tsx" | head -20

# 표준 아이콘 사용
rg -n "Settings|Gear|Cog|User|Bell|Search|Menu" src/components --glob "*.tsx" | head

# 표준 위치
rg -n "header|nav" src/components/layout --glob "*.tsx" | head
```

**관습 점검표**

```markdown
| 관습 | 일반적 구현 | 이 제품 | 판정 |
|------|-------------|---------|------|
| 로고 클릭 → 홈 | 좌상단 로고 | 있음 | OK |
| 계정 메뉴 위치 | 우상단 아바타 | 있음 | OK |
| 검색 단축키 | Cmd+K | 없음 | 개선 |
| 저장 단축키 | Cmd+S | 없음 | 개선 |
| Esc로 모달 닫기 | 지원 | 지원 | OK |
| 뒤로 가기 동작 | 이전 화면 | **모달 안 닫힘** | **결함** |
| 목록 정렬 | 헤더 클릭 | 별도 드롭다운 | 개선 여지 |
| 새 항목 위치 | 목록 상단 또는 우상단 버튼 | 하단 | 개선 |
```

**PASS / FAIL**

- PASS: 플랫폼·업계 관습을 따른다. 벗어나는 경우 명확한 이유와 학습 지원이 있다.
- FAIL: 브라우저 뒤로 가기 동작 파괴(S2), 핵심 관습 위반(S2), 단축키 미지원(S3).

**FIX**

```tsx
// ✅ 표준 단축키 지원
'use client';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+K — 검색
      if (mod && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      // Cmd+S — 저장
      if (mod && e.key === 's') {
        e.preventDefault();
        saveCurrentDocument();
      }
      // Cmd+Enter — 제출
      if (mod && e.key === 'Enter') {
        const form = (document.activeElement as HTMLElement)?.closest('form');
        form?.requestSubmit();
      }
      // ? — 단축키 도움말
      if (e.key === '?' && !isTyping(e.target)) {
        e.preventDefault();
        openShortcutHelp();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement;
  return el?.matches?.('input, textarea, [contenteditable]');
}
```

`?` 키로 단축키 목록을 여는 것은 널리 쓰이는 관습이다. 단축키가 있어도 발견할 수 없으면 소용없다.

```tsx
// ✅ 모달이 브라우저 뒤로 가기를 존중하게
'use client';

export function useModalHistory(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    // 모달을 열 때 히스토리 항목 추가
    window.history.pushState({ modal: true }, '');

    const onPopState = () => onClose();
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      // 코드로 닫힌 경우 히스토리 정리
      if (window.history.state?.modal) window.history.back();
    };
  }, [open, onClose]);
}
```

모바일에서 특히 중요하다. 뒤로 가기로 모달을 닫을 수 없으면 사용자는 앱 전체에서 벗어난다.

---

### UX-BENCH-02 — 경쟁 제품 비교

**WHY**
사용자는 이 제품을 진공 상태에서 평가하지 않는다. 대안과 비교한다. 경쟁 제품이 3클릭으로 하는 것을 10클릭으로 한다면, 그 자체가 이탈 사유가 된다.

**진단 방법**

동일 과업을 경쟁 제품에서도 수행하고 측정한다. 스크린샷을 나란히 놓고 비교한다.

```markdown
## 과업: 팀원 초대

| 항목 | 우리 제품 | 경쟁 A | 경쟁 B |
|------|-----------|--------|--------|
| 진입 경로 | 설정 > 멤버 (2단계) | 헤더 버튼 (1단계) | 사이드바 (1단계) |
| 클릭 수 | 6 | 3 | 4 |
| 여러 명 동시 초대 | 불가 | 가능 (쉼표 구분) | 가능 (붙여넣기) |
| 역할 지정 | 초대 후 별도 | 초대 시 함께 | 초대 시 함께 |
| 소요 시간 (3명) | 2분 10초 | 40초 | 55초 |
| **판정** | **개선 필요** | 기준 | 양호 |
```

**PASS / FAIL**

- PASS: 핵심 과업에서 경쟁 대비 뒤처지지 않는다. 차이가 있으면 의도적 선택이다.
- FAIL: 핵심 과업에서 2배 이상 느림(S2), 경쟁이 지원하는 기본 기능 부재(S2).

**주의**

경쟁 제품을 그대로 따라하라는 뜻이 아니다. 차이가 **의도적 선택인지 방치인지** 구분하는 것이 목적이다. 경쟁이 하는 것을 안 하기로 했다면 그 이유가 있어야 한다.

**FIX 예시**

```tsx
// ✅ 여러 명 동시 초대 — 붙여넣기 지원
function InviteForm() {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addEmails = (raw: string) => {
    const parsed = raw
      .split(/[,;\n\s]+/)
      .map(s => s.trim())
      .filter(s => s && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
    setEmails(prev => [...new Set([...prev, ...parsed])]);
    setInput('');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="invite-emails">초대할 이메일</Label>
        <Input
          id="invite-emails"
          value={input}
          onChange={e => setInput(e.target.value)}
          onPaste={e => {
            e.preventDefault();
            addEmails(e.clipboardData.getData('text'));
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addEmails(input);
            }
          }}
          onBlur={() => input && addEmails(input)}
          placeholder="이메일 입력 후 Enter"
          aria-describedby="invite-help"
        />
        <p id="invite-help" className="text-sm text-muted-foreground">
          여러 개를 한 번에 붙여넣을 수 있습니다. 쉼표나 줄바꿈으로 구분됩니다.
        </p>
      </div>

      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map(email => (
            <Badge key={email} variant="secondary" className="gap-1">
              {email}
              <button onClick={() => setEmails(e => e.filter(x => x !== email))}
                      aria-label={`${email} 제거`}>
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 역할을 초대 시점에 함께 지정 */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="invite-role">역할</Label>
          <Select defaultValue="member">
            <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">멤버 — 리포트 조회와 댓글</SelectItem>
              <SelectItem value="editor">편집자 — 리포트 생성과 수정</SelectItem>
              <SelectItem value="admin">관리자 — 모든 권한</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button disabled={emails.length === 0}>
          {emails.length > 0 ? `${emails.length}명 초대` : '초대'}
        </Button>
      </div>
    </div>
  );
}
```

역할 옵션에 설명을 붙이면(`멤버 — 리포트 조회와 댓글`) 사용자가 별도 문서를 찾지 않아도 된다.

---

## 22. 우선순위 결정

### 22.1 Severity와 우선순위는 다르다

Severity는 **문제의 심각도**이고, 우선순위는 **지금 고칠 순서**다. S2 문제가 5분이면 고쳐지고 S1 문제가 3주 걸린다면, S2를 먼저 고치는 것이 합리적일 수 있다.

다만 **S0는 예외 없이 최우선**이다. 비용과 무관하게 즉시 처리한다.

### 22.2 우선순위 점수

```text
우선순위 점수 = (심각도 가중 × 영향 사용자 비율 × 발생 빈도) / 구현 비용

심각도 가중: S0=100, S1=40, S2=10, S3=3, S4=1
영향 비율:   해당 문제를 마주치는 사용자 비율 (0~1)
발생 빈도:   사용자당 월 발생 횟수 (로그 스케일: 1회=1, 10회=2, 100회=3)
구현 비용:   XS=1, S=2, M=5, L=13, XL=34 (피보나치)
```

```markdown
| Finding | Sev | 가중 | 영향 | 빈도 | 비용 | 점수 | 순위 |
|---------|-----|------|------|------|------|------|------|
| 구독 취소 경로 없음 | S0 | 100 | 0.05 | 1 | S(2) | 2.5 | **1** |
| 폼 이탈 시 입력 유실 | S1 | 40 | 0.30 | 2 | M(5) | 4.8 | **1** |
| 빈 상태에 행동 없음 | S2 | 10 | 0.80 | 1 | XS(1) | 8.0 | **1** |
| 오류 메시지 불명확 | S2 | 10 | 0.40 | 2 | S(2) | 4.0 | 2 |
| 검색 동의어 미지원 | S2 | 10 | 0.25 | 2 | M(5) | 1.0 | 3 |
| 날짜 형식 불일치 | S3 | 3 | 1.00 | 3 | S(2) | 4.5 | 2 |
| 아이콘 정렬 미세 어긋남 | S4 | 1 | 1.00 | 3 | XS(1) | 3.0 | 3 |
```

점수는 정렬 도구이지 결정 그 자체가 아니다. "빈 상태에 행동 없음"이 점수가 높은 이유는 **모든 신규 사용자가 겪고 고치기 쉽기 때문**이며, 이는 실제로 합리적인 판단이다.

### 22.3 실행 묶음

점수만으로 정렬하면 관련 없는 작업이 흩어진다. 같은 영역의 개선을 묶으면 효율이 올라간다.

```markdown
## 1차 (이번 주 — 빠른 승리)

비용 XS~S이면서 영향이 큰 것들. 코드 변경 범위가 작아 리스크가 낮다.

- [ ] 빈 상태 4곳에 CTA 추가 (UX-F003, XS)
- [ ] 구독 취소 링크 노출 (UX-F001, S)
- [ ] 오류 메시지 카탈로그 도입 + 상위 10개 교체 (UX-F007, S)
- [ ] 폼 autoComplete 속성 일괄 추가 (UX-F012, XS)

예상 효과: 신규 사용자 첫 화면 이탈 감소, 지원 문의 감소

## 2차 (이번 스프린트 — 구조 개선)

- [ ] 폼 임시 저장 도입 (UX-F002, M)
- [ ] 검색에 기능·동의어 포함 (UX-F009, M)
- [ ] 설정 IA 재구성 (UX-F005, M)

## 3차 (다음 스프린트 — 큰 변경)

- [ ] 온보딩 체크리스트 도입 (UX-F004, L)
- [ ] 데모 모드 구축 (UX-F011, L)

## 보류 (근거 부족)

- 요금제 개수 축소 — 비즈니스 판단 필요, 데이터로 검증 후 결정
- 대시보드 위젯 재배치 — 사용 데이터 계측 후 판단
```

"보류" 항목을 명시하는 것이 중요하다. 판단할 근거가 없다는 사실 자체가 정보이며, 무엇을 계측해야 하는지 알려준다.

---

## 23. Regression 절차

UX 개선은 되돌아가기 쉽다. 기능을 추가하다 보면 폼 필드가 다시 늘고, 빈 상태 처리가 빠지고, 오류 메시지가 대충 붙는다. 아래 게이트를 CI에 넣어 재발을 막는다.

### Gate 1 — 정적 검사

```bash
# 금지 문구
rg -n "오류가 발생했습니다|Something went wrong|An error occurred" src app \
  --glob "*.tsx" --glob "*.ts" -g '!**/errors/catalog.ts' && exit 1

# 용어 혼용
rg -n "팀원|유저|어카운트" src app --glob "*.tsx" && exit 1

# 라벨 없는 입력 (플레이스홀더만)
rg -n "<Input[^>]*placeholder" src app --glob "*.tsx" | rg -v "aria-label|id=" && exit 1

# 모호한 버튼 라벨
rg -n ">(확인|OK|예|아니오)<" src/components/ui --glob "*.tsx" && exit 1

echo "Gate 1 PASS"
```

### Gate 2 — 과업 완수

```ts
// tests/ux/regression/task-completion.spec.ts
const P0_TASKS = [
  { name: '가입', spec: 'signup' },
  { name: '첫 리포트 생성', spec: 'first-report' },
  { name: '멤버 초대', spec: 'invite-member' },
  { name: '구독 취소', spec: 'cancel-subscription' },
];

for (const task of P0_TASKS) {
  test(`P0 과업 완수: ${task.name}`, async ({ page }) => {
    const result = await runTaskScenario(page, task.spec);
    expect(result.completed, `${task.name} 완수 실패: ${result.blocker}`).toBe(true);
  });
}
```

### Gate 3 — 과업 비용 예산

```ts
// 개선한 과업이 다시 무거워지지 않게 상한을 건다
const TASK_BUDGETS = {
  'signup': { maxClicks: 8, maxFields: 3, maxMs: 90_000 },
  'invite-member': { maxClicks: 6, maxFields: 2, maxMs: 60_000 },
  'cancel-subscription': { maxClicks: 8, maxMs: 120_000 },
} as const;

for (const [taskId, budget] of Object.entries(TASK_BUDGETS)) {
  test(`과업 예산: ${taskId}`, async ({ page }, testInfo) => {
    const rec = new TaskRecorder(page, testInfo, taskId);
    await rec.start();
    await runTaskScenario(page, taskId, rec);
    const report = await rec.finish(true);

    expect(report.metrics.clicks, '클릭 수 초과').toBeLessThanOrEqual(budget.maxClicks);
    expect(report.totalMs, '소요 시간 초과').toBeLessThanOrEqual(budget.maxMs);
  });
}
```

### Gate 4 — 빈 상태

```ts
test('모든 목록에 유효한 빈 상태가 있다', async ({ page }) => {
  const LIST_ROUTES = ['/reports', '/team/members', '/data/sources', '/settings/api-keys'];

  for (const route of LIST_ROUTES) {
    await page.route('**/api/**', r => r.fulfill({ json: { rows: [], items: [], total: 0 } }));
    await page.goto(route);

    const main = page.getByRole('main');
    const text = (await main.textContent()) ?? '';
    const actions = await main.getByRole('button').or(main.getByRole('link')).count();

    expect(text.length, `${route}: 빈 상태 설명 부족`).toBeGreaterThan(30);
    expect(actions, `${route}: 빈 상태에 행동 수단 없음`).toBeGreaterThan(0);
  }
});
```

### Gate 5 — 오류 복구

```ts
test('주요 화면이 API 실패에서 복구 가능하다', async ({ page }) => {
  const ROUTES = ['/dashboard', '/reports', '/settings/billing'];

  for (const route of ROUTES) {
    await page.route('**/api/**', r => r.fulfill({ status: 500, json: { error: 'x' } }));
    await page.goto(route);

    // 셸이 유지되는가
    await expect(page.getByRole('navigation'), `${route}: 내비게이션 소실`).toBeVisible();

    // 재시도 수단이 있는가
    const retry = page.getByRole('button', { name: /다시 시도|재시도|새로고침/ });
    await expect(retry, `${route}: 재시도 수단 없음`).toBeVisible();
  }
});
```

### Gate 6 — 폼 안전성

```ts
test('폼이 중복 제출을 방지하고 입력을 보존한다', async ({ page }) => {
  const FORMS = [
    { route: '/reports/new', submit: '만들기' },
    { route: '/team?invite=1', submit: '초대' },
  ];

  for (const form of FORMS) {
    const posts: string[] = [];
    page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });

    await page.route('**/api/**', async r => {
      await new Promise(res => setTimeout(res, 2000));
      await r.continue();
    });

    await page.goto(form.route);
    await fillRequiredFields(page);

    const btn = page.getByRole('button', { name: form.submit });
    await btn.click();
    await expect(btn, `${form.route}: 제출 중 비활성화 안 됨`).toBeDisabled({ timeout: 500 });

    expect(posts.length, `${form.route}: 중복 제출 ${posts.length}회`).toBeLessThanOrEqual(1);
  }
});
```

### Gate 7 — 콘텐츠 위생

```ts
test('화면에 내부 값이 노출되지 않는다', async ({ page }) => {
  const ROUTES = ['/dashboard', '/reports', '/settings/profile', '/settings/billing'];

  for (const route of ROUTES) {
    await page.goto(route);
    const text = (await page.getByRole('main').textContent()) ?? '';

    const leaks = [
      /\bnull\b/, /\bundefined\b/, /\bNaN\b/, /\[object Object\]/,
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,        // ISO 날짜
      /\b[0-9a-f]{8}-[0-9a-f]{4}-/i,          // UUID
    ].filter(re => re.test(text));

    expect(leaks.map(String), `${route} 노출: ${leaks.join(', ')}`).toEqual([]);
  }
});
```

### Gate 8 — 키보드 접근

```ts
test('P0 과업을 키보드만으로 완수할 수 있다', async ({ page }) => {
  await page.goto('/reports');

  // 마우스 사용을 금지한 상태로 시나리오 실행
  await keyboardOnlyScenario(page, async kb => {
    await kb.tabUntil(/새 리포트/);
    await kb.press('Enter');
    await kb.tabUntil('제목');
    await kb.type('키보드 테스트');
    await kb.pressWithMod('Enter');   // Cmd+Enter로 제출
  });

  await expect(page.getByRole('status')).toContainText(/만들었습니다|생성/);
});
```

### Gate 9 — 다크 패턴

```ts
test('선택 동의가 기본 해제 상태다', async ({ page }) => {
  await page.goto('/auth/signup');

  const optional = page.locator('input[type="checkbox"]:not([required])');
  const count = await optional.count();

  for (let i = 0; i < count; i++) {
    const cb = optional.nth(i);
    const label = await cb.evaluate(el => {
      const id = el.id;
      return document.querySelector(`label[for="${id}"]`)?.textContent ?? '';
    });
    await expect(cb, `선택 항목이 기본 선택됨: ${label}`).not.toBeChecked();
  }
});

test('해지 경로가 가입 경로만큼 짧다', async ({ page }) => {
  const signupSteps = await countStepsToReach(page, '/', /가입|시작하기/);
  const cancelSteps = await countStepsToReach(page, '/settings', /취소|해지/);

  expect(cancelSteps,
    `해지 ${cancelSteps}단계 vs 가입 ${signupSteps}단계 — 로치 모텔 패턴`)
    .toBeLessThanOrEqual(signupSteps + 2);
});
```

### Gate 10 — 최종 검토

```text
[ ] Gate 1~9 전부 PASS
[ ] 개선한 Finding을 실제 흐름에서 재확인했다
[ ] 개선 과정에서 새로 생긴 문제가 없다
[ ] 과업 측정값이 개선 전보다 나빠지지 않았다
[ ] 리포트에 남은 항목과 보류 사유를 기록했다
```

---

## 24. Final Report

### 24.1 리포트 형식

````markdown
# UX Audit Report

**대상:** <제품명> <환경/빌드>
**일시:** YYYY-MM-DD
**범위:** P0 과업 4개 · 핵심 화면 12개 · 데스크톱(1440) + 모바일(390)
**감사 방식:** 과업 기반 워크스루 + 휴리스틱 순회 + 자동 계측
**데이터 가용성:** 분석 도구 없음 (NO_DATA) — 구조적 추론 병행

---

## 1. 요약

한 문단으로 제품의 현재 사용성 상태를 서술한다.
가장 큰 문제 하나와 가장 큰 강점 하나를 명시한다.

**과업 완수 현황**

| 과업 | 완수 | 클릭 | 소요 | 막힌 지점 |
|------|------|------|------|-----------|
| 가입 후 첫 리포트 | 예 | 23 | 6분 40초 | 데이터 연결 OAuth |
| 멤버 초대 | 예 | 6 | 45초 | — |
| 구독 취소 | **아니오** | 9+ | — | 취소 링크 미발견 |
| 리포트 공유 | 예 | 4 | 30초 | — |

**Severity 분포**

| S0 | S1 | S2 | S3 | S4 | 합계 |
|----|----|----|----|----|------|
| 1 | 3 | 11 | 8 | 5 | 28 |

---

## 2. 즉시 조치 (S0/S1)

### UX-F001 — 구독 취소 경로가 UI에 존재하지 않는다 · S0

**관찰**
설정의 4개 탭을 모두 열고 9번 클릭했으나 취소 관련 항목을 찾지 못했다.
`/settings/billing`에는 "플랜 변경"만 있고, 하단 FAQ 링크를 통해서야
"취소는 고객센터로 문의"라는 안내를 발견했다.

**증거**
- `tmp/qa/ux/2026-07-30/UX-F001-01-billing-tab.png`
- `tmp/qa/ux/2026-07-30/UX-F001-02-faq-only-mention.png`

**위반 휴리스틱**
H3(사용자 제어와 자유), H12(신뢰와 투명성)

**사용자 결과**
자기 계정의 결제를 스스로 중단할 수 없다. 고객센터 문의가 강제되며,
영업시간 외에는 대기해야 한다. 일부 관할권에서는 규제 위반 소지가 있다.

**Severity 산정**
- 빈도: 취소 시도자 전원 (전체의 3~5% 추정, NO_DATA)
- 영향: 과업 완수 불가
- 지속성: 매번 반복, 학습 불가
- 상향: 결제 경로 → 한 단계
- **판정: S0**

**개선안**
`/settings/billing`에 "구독 취소" 링크를 추가하고, 취소 흐름을 UI로 구현한다.
만류는 일시 정지 안내 한 번으로 제한하고, 취소 버튼을 함께 노출한다.

**비용:** S (2일)
**검증:** Gate 9의 해지 경로 길이 테스트 통과

---

### UX-F002 — 긴 폼에서 이탈하면 입력이 전부 사라진다 · S1

(같은 형식)

---

## 3. 주요 개선 (S2)

간결한 형식으로 나열한다. 각 항목에 관찰·휴리스틱·개선안·비용을 포함한다.

### UX-F003 — 목록 4곳의 빈 상태에 다음 행동이 없다 · S2

**관찰:** `/reports`, `/team/members`, `/data/sources`, `/settings/api-keys`의
빈 상태가 "항목이 없습니다" 한 줄뿐이다. 행동 버튼이 없다.

**증거:** `tmp/qa/ux/2026-07-30/UX-F003-01..04-*.png`

**휴리스틱:** H11(첫 사용 가능성)

**개선안:** 각 빈 상태에 (a) 왜 비어 있는지, (b) 첫 항목을 만드는 버튼,
(c) 가능하면 템플릿 예시를 추가한다. 필터 결과 없음과 첫 사용을 구분한다.

**비용:** XS (반나절)

---

## 4. 세부 개선 (S3/S4)

표로 압축한다.

| ID | 요약 | 위치 | 휴리스틱 | 비용 |
|----|------|------|----------|------|
| UX-F015 | 날짜 형식이 화면마다 다름 | 전역 | H4 | S |
| UX-F016 | 상대 시간에 절대 시간 병기 없음 | 목록 | H1 | XS |

---

## 5. 잘 되어 있는 점

개선점만 나열하면 무엇을 유지해야 할지 알 수 없다.
의도적으로 잘 설계된 부분을 기록한다.

- 리포트 편집 중 자동 저장이 동작하고 저장 시각이 표시된다 (H1)
- 오류 경계가 위젯 단위로 분리되어 부분 실패가 화면을 무너뜨리지 않는다 (H9)
- 모든 대화상자가 Esc로 닫히고 포커스가 트리거로 복귀한다 (H4, H14)

---

## 6. 우선순위와 실행 계획

| 순위 | Finding | Sev | 비용 | 점수 | 묶음 |
|------|---------|-----|------|------|------|
| 1 | UX-F003 빈 상태 | S2 | XS | 8.0 | 1차 |
| 2 | UX-F001 취소 경로 | S0 | S | — | 1차(무조건) |
| 3 | UX-F002 입력 유실 | S1 | M | 4.8 | 2차 |

**1차 (이번 주):** UX-F001, F003, F007, F012
**2차 (이번 스프린트):** UX-F002, F009, F005
**보류:** 요금제 개수(비즈니스 판단), 위젯 배치(계측 후 판단)

---

## 7. 가정과 한계

**ASSUMPTION**
- 주 사용자를 5~50인 팀 관리자로 추정했다 (근거: 시트 단위 요금제)
- P0 과업을 내비게이션 순서와 요금제 제한 항목에서 역추론했다

**NO_DATA**
- 실제 이탈 지점: 분석 도구 미연동으로 확인 불가
- 기능별 사용 빈도: 이벤트 추적 없음
- 오류 발생 빈도: 클라이언트 오류 수집 없음

**검증하지 못한 영역**
- 실제 사용자 테스트 미실시 (감사자 관찰에 의존)
- 스크린리더 실사용 테스트 미실시 (자동 검사만 수행)
- 태블릿 뷰포트 미점검

**권장 후속**
1. 최소 계측 세트 도입 (퍼널 이벤트, 클라이언트 오류, rage click)
2. 실사용자 5명 대상 과업 테스트
3. 계측 데이터 확보 후 3개월 뒤 재감사

---

## 8. 재현 방법

```bash
# 과업 측정 재실행
npx playwright test tests/ux/p0-tasks.spec.ts --headed

# 빈 상태 캡처
npx playwright test tests/ux/empty-states.spec.ts

# 리그레션 게이트
npx playwright test tests/ux/regression/
```

증거 파일: `tmp/qa/ux/2026-07-30/`
````

### 24.2 리포트 작성 원칙

**결론을 먼저 쓴다.** 요약 문단에서 가장 큰 문제를 밝힌다. 읽는 사람이 첫 문단만 읽어도 무엇이 문제인지 알아야 한다.

**Finding마다 세 요소를 갖춘다.** 관찰·원칙·결과가 없으면 그것은 의견이다.

**증거 경로를 명시한다.** 스크린샷 파일명을 정확히 쓴다. "스크린샷 참조"는 증거가 아니다.

**잘된 점을 기록한다.** 개선점만 나열하면 개선 과정에서 잘 되어 있던 부분이 함께 망가진다.

**가정과 한계를 숨기지 않는다.** 확인하지 못한 것을 확인한 것처럼 쓰면 잘못된 결정으로 이어진다.

**리포트 파일을 저장소에 만들지 않는다.** 채팅으로 전달하고, 증거는 `tmp/qa/ux/`에 두되 커밋하지 않는다.

---

## 부록 A — 감사 도구와 명령

### A.1 정적 분석 일괄 실행

```bash
#!/usr/bin/env bash
# tmp/qa/ux-static-scan.sh — 커밋하지 않는다
set -uo pipefail

echo "=== 1. 오류 메시지 품질 ==="
rg -n "오류가 발생했습니다|Something went wrong|An error occurred|Unknown error" \
  src app --glob "*.tsx" --glob "*.ts" -g '!**/catalog.ts' || echo "  (없음)"

echo -e "\n=== 2. 용어 혼용 ==="
for term in 팀원 유저 어카운트 인보이스; do
  n=$(rg -c "$term" src app --glob "*.tsx" 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  [ "$n" -gt 0 ] && echo "  $term: ${n}회"
done

echo -e "\n=== 3. 라벨 없는 입력 ==="
rg -n "<Input[^>]*placeholder" src app --glob "*.tsx" | rg -v "aria-label|id=" | head -10

echo -e "\n=== 4. 모호한 버튼 라벨 ==="
rg -n ">(확인|OK|예|아니오|제출|Submit)<" src app --glob "*.tsx" | head -10

echo -e "\n=== 5. 폼 필드 수 상위 ==="
for f in $(rg -l "<form|useForm" src app --glob "*.tsx" 2>/dev/null); do
  c=$(rg -c "<Input|<Select|<Textarea|<Checkbox|<RadioGroup" "$f" 2>/dev/null || echo 0)
  echo "$c $f"
done | sort -rn | head -8

echo -e "\n=== 6. 라우트 계층 깊이 ==="
fd "page.tsx" app src/app 2>/dev/null | sed 's|.*/app||; s|/page.tsx||' \
  | awk -F/ 'NF-1 > 3 {print "  깊이 " NF-1 ": " $0}' | head

echo -e "\n=== 7. 빈 상태 처리 누락 후보 ==="
rg -l "\.map\(" src/app --glob "page.tsx" 2>/dev/null | while read -r f; do
  rg -q "length === 0|isEmpty|EmptyState" "$f" || echo "  $f"
done | head -10

echo -e "\n=== 8. 되돌리기 수단 ==="
rg -c "undo|실행 취소|restore|복원" src --glob "*.tsx" 2>/dev/null \
  | awk -F: '{s+=$2} END {print "  총 " s+0 "회"}'

echo -e "\n=== 9. 자동완성 누락 ==="
rg -n "<Input" src app --glob "*.tsx" | rg -v "autoComplete|type=\"hidden\"" | wc -l \
  | xargs echo "  autoComplete 없는 Input:"

echo -e "\n=== 10. 다크 패턴 후보 ==="
rg -n "defaultChecked" src app --glob "*.tsx" | rg -i "marketing|newsletter|수신|동의" || echo "  (없음)"
```

### A.2 Playwright 감사 프로젝트 설정

```ts
// playwright.ux.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ux',
  // 감사는 사람이 보면서 진행하는 경우가 많다
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [['html', { outputFolder: 'tmp/qa/ux/report' }], ['list']],

  use: {
    baseURL: process.env.UX_BASE_URL ?? 'http://localhost:3000',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'ux-desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'ux-mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'ux-slow',      // 느린 환경에서의 체감 확인
      use: {
        viewport: { width: 1440, height: 900 },
        launchOptions: { slowMo: 100 },
      },
    },
  ],
});
```

### A.3 감사 시나리오 템플릿

```ts
// tests/ux/scenarios/_template.spec.ts
import { test, expect } from '@playwright/test';
import { TaskRecorder } from '../lib/task-recorder';
import { Evidence } from '../lib/evidence';

test.describe('과업: <과업명>', () => {
  test('신규 사용자 관점 워크스루', async ({ page }, testInfo) => {
    const rec = new TaskRecorder(page, testInfo, '<task-id>');
    const ev = new Evidence('UX-F000');
    await rec.start();

    // ① 진입
    await page.goto('/');
    await rec.step('진입');

    // ② 각 단계마다 rec.step()을 호출한다.
    //    막히면 ev.annotate()로 문제 지점을 표시해 캡처하고 기록한다.

    // 예: 찾을 수 없는 요소
    // const target = page.getByRole('link', { name: /구독 취소/ });
    // if (await target.count() === 0) {
    //   await ev.capture(page, 'cancel-link-not-found');
    //   await rec.finish(false, '구독 취소 링크를 찾을 수 없음');
    //   test.fail(true, '과업 완수 불가');
    //   return;
    // }

    await rec.finish(true);
  });
});
```

### A.4 감사 환경 초기화

```bash
# 신규 사용자 상태 재현
rm -rf tmp/qa/ux/state
mkdir -p tmp/qa/ux/$(date +%F)

# 프로덕션 빌드로 실행 (개발 오버레이 제외)
npm run build && npm run start &
npx wait-on http://localhost:3000

# 감사 실행
UX_BASE_URL=http://localhost:3000 npx playwright test --config playwright.ux.config.ts
```

---

## 부록 B — Agent 체크리스트

### B.1 감사 시작 전

```text
[ ] Project Binding 블록을 채웠다 (또는 역추론하고 ASSUMPTION 표기)
[ ] P0 사용자와 P0 과업을 정의했다
[ ] 감사 환경을 표준화했다 (프로덕션 빌드, 캐시 초기화, 실제 권한 계정)
[ ] 증거 저장 디렉터리를 만들었다 (tmp/qa/ux/<날짜>/)
[ ] Freeze List를 확인했다
[ ] 사용 가능한 데이터(분석·리플레이·티켓)를 확인했다
```

### B.2 감사 실행

```text
[ ] P0 과업을 사전 지식 없이 끝까지 수행했다
[ ] 각 과업의 클릭·전환·시간을 측정했다
[ ] 막힌 지점을 기록하고 원인을 분류했다
[ ] 휴리스틱 14개를 핵심 화면에 적용했다
[ ] 빈 상태를 강제로 만들어 4가지 유형을 확인했다
[ ] 오류를 의도적으로 유발하고 복구 가능성을 확인했다
[ ] 마이크로카피를 수집해 3요소로 평가했다
[ ] 모바일에서 P0 과업을 재수행했다
[ ] 키보드만으로 P0 과업을 시도했다
[ ] 다크 패턴 점검표를 확인했다
[ ] 느린 네트워크에서 1회 순회했다
[ ] 모든 관찰에 OBS 번호와 증거를 붙였다
```

### B.3 판정과 보고

```text
[ ] 각 Finding에 관찰·원칙·결과가 있다
[ ] Severity를 빈도·영향·지속성으로 산정했다
[ ] 상향/하향 규칙을 적용했다
[ ] 구현 비용을 추정했다
[ ] 우선순위 점수로 정렬하고 실행 묶음을 만들었다
[ ] 잘된 점을 기록했다
[ ] ASSUMPTION과 NO_DATA를 명시했다
[ ] 검증하지 못한 영역을 밝혔다
[ ] 재현 명령을 포함했다
[ ] 리포트를 채팅으로 전달했다 (파일 생성하지 않음)
```

### B.4 수정 단계 (승인 후)

```text
[ ] 사용자가 수정을 요청한 항목만 수정한다
[ ] 우선순위 1차 묶음부터 처리한다
[ ] 각 수정 후 해당 Finding을 재현해 해소를 확인한다
[ ] Regression Gate 1~9를 실행한다
[ ] 과업 측정값이 나빠지지 않았는지 확인한다
[ ] 수정 과정에서 새로 발견한 문제를 보고한다
[ ] Freeze List 파일을 건드리지 않았음을 확인한다
```

### B.5 금지 사항

```text
✗ 증거 없이 "직관적이지 않다"고 쓰지 않는다
✗ 측정하지 않은 수치를 쓰지 않는다
✗ 추론을 사실처럼 쓰지 않는다 (ASSUMPTION 표기)
✗ 개인 취향을 Finding으로 올리지 않는다
✗ 구현 비용을 이유로 Severity를 낮추지 않는다
✗ docs/에 리포트 파일을 만들지 않는다
✗ 승인 없이 애플리케이션 코드를 수정하지 않는다
✗ Freeze List 파일을 수정하지 않는다
✗ 증거 파일(tmp/qa/ux/)을 커밋하지 않는다
```

---

## 다음 문서

- `07_Design_System_QA.md` — 토큰, 컴포넌트 일관성, 테마 체계
- `08_Performance_QA.md` — Core Web Vitals, 번들, 렌더 성능
- `09_Accessibility_QA.md` — WCAG 2.2 AA, 스크린리더, 키보드
