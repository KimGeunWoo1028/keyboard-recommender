# Project Progress

> **Updated:** 2026-08-05 (KST) · **branch:** `main`  
> **Sources:** git (`2ddbd5f`) · coverage DoD fix + Cerakey Pink · unused brand asset cleanup  
> **관련:** `docs/small-group-test-checklist.md` · `docs/qa-suite/` · `docs/LIGHT_MODE_COLOR_INVENTORY.md`

## Now

QA Master Suite·소그룹 피드백 완료. Catalog coverage WARN도 DoD(unique idx) 수정 +
Cerakey Pink(이미지 포함) 반영으로 해소 (`c520bc6` · `2ddbd5f`).
미사용 히어로 원본 PNG 2장 삭제. 출시 전 남은 건 수동 릴리스 게이트.

## Done (최근)

- 미사용 brand 에셋 삭제: `hero-keyboard.png`, `switches-hero.png` (cutout/glb만 유지)
- Catalog coverage DoD unique-idx + Pink seed/og:image (`c520bc6` · `2ddbd5f`)
- Playwright QA harden + Gate 2 27/27 · mobile-chromium smoke (`d8bd49c`)
- Design System · Visual · UX/Desktop/Mobile·A11y·Perf·Core
- 소그룹/공개 URL 피드백 반영 완료 (운영자)
- **V-F005 Accepted** · 실기기/4G/VoiceOver → **릴리스 게이트(수동)**

## Next (1–3)

1. 메이저 UI/출시 직전 — 아래 **릴리스 게이트(수동)** 1회 실행
2. (선택) 3D 히어로 모바일 성능·로딩 체감 추가 튜닝 여부 결정

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| Manus redesign | ✅ on main | 브랜드/다크/홈 후속도 main |
| 홈 비주얼 | ✅ 3D 안정화 | WebGL 폴백 · 컷아웃 폴백 · 미사용 PNG 정리 |
| 다크모드 팔레트 | ✅ | QA 스위트 대비 보강 포함 |
| ui-ux launch Phase 1–11 | ✅ | 소그룹 피드백 반영 |
| qa-suite Master (01–09) | ✅ | 심화 UI/UX · Finding 픽스 · sync |
| launch-readiness | Pass 1–3 ✅ | 출시 전 수동 게이트만 남김 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | 공개 URL=피드백 환경 | staging 분리 보류 |
| catalog 1:1 | Phase 8 ✅ · 운영 유지 | coverage DoD ✅ (unique idx) |
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

- 3D 히어로 모바일 성능·로딩 체감 추가 튜닝 필요 여부
