# Home IA — Principles LOCKED

> **대상:** `/` (홈)  
> **버전:** v2.0 — 2026-07-10 (KST)  
> **상태:** **LOCKED** — Home 신규 기능·대공사 중단. 잔여 작업만 최소 실행.  
> **근거 논의:** Cursor ↔ ChatGPT 합의 (Workspace 존폐 → Home 정체성 → Product stage)  
> **선행 구현 기록:** `docs/home-ux-roadmap.md` (Phase 1–3 완료분)

---

## 이 문서 쓰는 법

| 독자 | 읽을 곳 |
|------|---------|
| **PM / Tech Lead** | §HOME IA (LOCKED) · §Why · §Revisit When |
| **Cursor / 구현** | §잔여 구현 (최소) · §No Home Changes · §다음 집중 |

**원칙만 잠근다. UI 표현(애니메이션·카피 디테일·레이아웃 포크)은 열어 둔다.**

---

# HOME IA (LOCKED) — 2026-07

| | |
|--|--|
| **Purpose** | Landing — 제품을 이해하고 **설문을 시작**하는 페이지 |
| **Primary KPI** | Survey start (설문 시작) |
| **Not** | Dashboard · Continue 허브 · 저장 관리 본진 |

### Rules

1. **Workspace 제거** — Start 메뉴형 3카드 섹션을 두지 않는다.  
2. **Dashboard 도입하지 않음** — «최근 추천 / 저장 / 활동» 허브 섹션을 Home에 만들지 않는다.  
3. **Guest Preview** — 추천 **경험을 이해시키는** 역할. (표현 방식·카피·모션은 디자인 자유)  
4. **Login 개인화는 최소화** — 있어도 «최근 추천 한 줄 + 이어보기» 수준. 저장 수·활동·설문 히스토리·미니 대시보드 금지.  
5. **Redirect / Login Home 포크 / A/B** — 출시 후 · 재방문 데이터 확보 후에만.  
6. **가짜 Match·허위 점수** — Preview·데모에 쓰지 않는다. (신뢰 원칙)

### Why (결정 이유 — 함께 LOCK)

| 결정 | 이유 |
|------|------|
| Home = Landing | 현재 핵심 KPI는 **설문 시작 → 결과 이해 → 저장**. 재방문 Dashboard를 검증할 데이터가 없다. |
| Workspace 삭제 | 설문·카탈로그는 Hero/헤더/아래 Guide와 중복. 저장·Continue 본진은 **MyPage**. 섹션만의 독립 책임이 없다. |
| Dashboard 보류 | Compare 제거·Results/Evidence/MyPage가 아직 움직이는 단계에서 Home을 매일의 허브로 키우면 책임이 다시 분산된다. Dashboard는 «Home이 매일의 허브가 된 뒤»의 옵션. |
| Preview UI 디테일 미고정 | 로드맵은 **역할**만 잠근다. 카드/애니메이션/카피는 디자인 결정. UI까지 LOCK하면 같은 회의를 UI 변경마다 반복한다. |
| Login 개인화 최소화 | 로그인 사용자가 Home에 얼마나 오는지 모름. Status/Continue 본진은 MyPage. Home에 Snapshot을 키우면 Dashboard화가 시작된다. |
| Redirect 실험 보류 | Results·MyPage가 동시에 바뀌는 동안 Redirect A/B를 하면 KPI 인과 해석이 불가능하다. |

> 3개월 뒤 «Dashboard 넣자»가 나와도, **이 Why를 먼저 반박**해야 한다. 결정만 있고 이유가 없으면 같은 논의를 다시 한다.

---

## Site IA (역할 한 장)

| Surface | 책임 |
|---------|------|
| **Home** | Landing · Survey start · (얇은) 경험 이해 |
| **Recommend** | 설문 |
| **Results** | 추천 결과 · 이해(Evidence) · 저장 CTA |
| **Catalog** | 부품 탐색 |
| **MyPage** | 저장 · 히스토리 · Manage / Continue **본진** |
| **Header** | 전역 내비 (추천·카탈로그·결과·마이페이지) — Home CTA와 «중복»으로 지우지 않음 |

---

## 잔여 구현 (최소 · Workspace teardown만)

> Phase 1–3 카피/그리드/초기 Preview는 이미 반영됨 (`home-ux-roadmap.md`).  
> **남은 Home 코드 작업은 Workspace 삭제(+ 필요 시 Guest CTA 정리)뿐.** Preview 대공사·Login Hero 포크 금지.

### Task W-1 — WorkshopStrip 제거

**작업**

- `WorkshopStrip`을 홈에서 제거 (`page.tsx` import·렌더 삭제).
- 섹션 카피·3카드(설문/카탈로그/저장) 진입 제거.
- 사용처가 없으면 `workshop-strip.tsx` 삭제 또는 unused 허용 후 정리.

| Primary |
|---------|
| `frontend/src/app/page.tsx` |
| `frontend/src/components/features/home/workshop-strip.tsx` |

**Dev Gate**

- [x] 홈에 WORKSHOP / 빌드 워크스페이스 섹션 없음
- [x] Hero → 추천 구성 안내 → Footer 흐름
- [x] 설문 CTA는 Hero(+ 헤더 «추천»)만

**Out of Scope:** Preview 리디자인 · Redirect · Dashboard 섹션 신설 · Guest/Login 레이아웃 포크

**Status:** ✅ 완료 — 2026-07-10

---

## No Home Changes

다음이 끝나기 **전**에는 Home에 새 아이디어가 떠와도 **백로그만** 하고 구현하지 않는다.

| Future idea (백로그) | 지금 |
|----------------------|------|
| Home Dashboard | Do not implement |
| Login redirect (`/results` · `/mypage`) | Do not experiment yet |
| Personalized / dual Hero layout | Do not implement |
| Preview 대시보드화 · 저장 카운트 위젯 | Do not implement |
| «Home 조금만 더…» | **거절** — 이 문서 LOCK 인용 |

### Revisit When (모두 충족 후)

- [x] Results UX 완료 (관련: `docs/results-ux-roadmap.md`)
- [x] Evidence 정리 완료 (관련: `docs/evidence-tab-simplification-roadmap.md`)
- [x] MyPage UX 안정
- [x] Home 진입 **수집 배선** (`home.viewed` · `docs/product-next-phase5-home-revisit.md`)
- [x] Home 진입 **조회 경로·Unlock 숫자** (`docs/remaining-work-phases.md` Phase B · CLI)
- [ ] 실제 **재방문 / Home 진입** 표본이 Unlock 기준 충족 (`unlock_ready`) — 관측 기간

그 전에는 Redirect·Login Home·Dashboard를 다시 열지 않는다.

---

## 다음 집중 (Home 밖)

리소스는 전부 아래로. **실행 Phase 표:** [`docs/product-next-phases.md`](./product-next-phases.md)

```
Phase 0 Workspace teardown → 1 Results → 2 Evidence(유지) → 3 MyPage → 4 Data → 5 Home revisit(조건부)
```

| 화면 | 제품 가치 |
|------|-----------|
| Results | 추천 이해 · 신뢰 |
| Evidence | «왜 이 1순위인가» |
| MyPage | 저장 · Manage · Continue 본진 |

핵심 경쟁력: **추천 품질 · 결과 이해도 · 저장 경험 · (이후) 구매 전환** — Home 미세 조정이 아님.

---

## Success / Failure

| Success | Failure |
|---------|---------|
| Workspace 제거 후 Home이 Landing으로 읽힘 | Workspace를 Dashboard Section으로 «이름만 바꿔» 부활 |
| Home 원칙+Why가 문서에 남아 동일 논의 반복 없음 | Why 없이 «삭제했다»만 남아 3개월 뒤 Dashboard 회의 재생 |
| Results / Evidence / MyPage에 리소스 집중 | «Home 조금만 더»로 핵심 퍼널이 밀림 |

---

## Non-goals (지금)

- Home 전면 리디자인
- Guest/Login 레이아웃 이중 운영
- Preview에 가짜 Match % · 허위 점수
- Acoustic/가격/비교 위젯 복원
- Home을 Continue 허브로 키우기

---

## 관계 문서

| 문서 | 관계 |
|------|------|
| `docs/home-ux-roadmap.md` | Phase 1–3 **구현 이력** (카피·그리드·초기 Preview). **신규 Home 방향은 이 LOCK이 우선.** |
| `docs/results-ux-roadmap.md` | 다음 집중 |
| `docs/evidence-tab-simplification-roadmap.md` | 다음 집중 |
| MyPage (코드) | Continue / Manage 본진 |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v2.0 | 2026-07-10 | IA LOCK — Landing · Workspace 삭제 · Dashboard 보류 · Why 동봉 · No Home Changes · 다음=Results/Evidence/MyPage |
| v2.1 | 2026-07-10 | Task W-1 완료 — WorkshopStrip 제거 |
| v2.2 | 2026-07-10 | Phase 5 데이터 전제 — `home.viewed` · 제품 revisit LOCK 유지 |
| v2.3 | 2026-07-10 | Phase B — Observe CLI·Unlock 14일/50 · Revisit When 조회 경로 체크 |
