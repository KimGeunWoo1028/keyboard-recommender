# Project Progress

> **Updated:** 2026-08-05 (KST) · **branch:** `main`  
> **Sources:** git (`d8bd49c`) · qa-suite 01–09 closeout · operator decision on deferred Visual/device gates  
> **관련:** `docs/small-group-test-checklist.md` · `docs/qa-suite/` · `docs/LIGHT_MODE_COLOR_INVENTORY.md`

## Now

`docs/qa-suite` Master Suite(01–09) 심화 QA·필수 픽스·git-sync 완료 (`d8bd49c`).
소그룹/공개 URL 피드백은 운영자 기준으로 완료. Visual CI 풀 baseline(V-F005)과
상시 실기기 BLOCKED는 **미완이 아니라 정책 결정으로 종결**함.

## Done (최근)

- Playwright QA harden + Gate 2 27/27 · mobile-chromium smoke (`d8bd49c`)
- Design System contracts · Visual fixture/tokens · UX/Desktop/Mobile·A11y·Perf·Core
- 소그룹/공개 URL 피드백 반영 완료 (운영자)
- **V-F005 Accepted** — fixture/`visual-375` 동일-OS 게이트 유지; 풀 CI PNG 매트릭스 보류
- **실기기·4G·VoiceOver** → 상시 BLOCKED 해제, **릴리스 게이트(수동)** 로 이전

## Next (1–3)

1. Coverage WARN 후속 — switch/keycap 목표 ≤2% (catalog 1:1 운영 유지)
2. 메이저 UI/출시 직전 — 아래 **릴리스 게이트(수동)** 1회 실행
3. 미사용 백업 에셋(`hero-*-prev.png` 등) 정리 여부 결정

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| Manus redesign | ✅ on main | 브랜드/다크/홈 후속도 main |
| 홈 비주얼 | ✅ 3D 안정화 | WebGL 폴백 · 컷아웃 폴백 |
| 다크모드 팔레트 | ✅ | QA 스위트 대비 보강 포함 |
| ui-ux launch Phase 1–11 | ✅ | 소그룹 피드백 반영 |
| qa-suite Master (01–09) | ✅ | 심화 UI/UX · Finding 픽스 · sync |
| launch-readiness | Pass 1–3 ✅ | 출시 전 수동 게이트만 남김 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | 공개 URL=피드백 환경 | staging 분리 보류 |
| catalog 1:1 | Phase 8 ✅ · 운영 유지 | coverage WARN 잔여 |
| account-deletion | ✅ | |
| Home revisit | 🔒 | Observe 표본 전 금지 |

## 릴리스 게이트 (수동) — 출시/메이저 UI 직전 30–60분

매 PR·상시 CI에 넣지 않음. 이슈 재발 시에만 재실행.

1. **실기기** iOS Safari + Android Chrome — `/` → 설문 → 결과 → 저장/로그인
2. **4G 스로틀** (Chrome DevTools) — `/results` LCP/CLS 스모크 1회
3. **VoiceOver 또는 TalkBack** — 설문 1스텝 + 결과 탭 이동만

**Visual 후속 (나중):** 회귀가 반복되거나 DS가 자주 바뀔 때만 Docker Chromium
baseline **단일 축**을 CI에 추가. full OS×테마 PNG 매트릭스는 비목표.

## Blocked / Do-not

- Home Dashboard · Login redirect · dual Hero · Compare 복원
- 표본 없이 Home revisit 제품 변경
- seed `--apply-to-seed` 자동 적용 금지 · layout diagram geometry 무단 수정 금지
- 가짜 Match % / 추천 알고리즘·질문 수 변경 금지
- API·auth·설문 로직·storage key 변경 금지
- V-F005 풀 CI baseline을 “미완 QA”로 재오픈하지 않음 (Accepted; 필요 시 별도 인프라 작업)

## Open questions

- 미사용 백업 에셋(`hero-*-prev.png`, `-dark`, `-white`) 정리 여부
- 3D 히어로 모바일 성능·로딩 체감 추가 튜닝 필요 여부
