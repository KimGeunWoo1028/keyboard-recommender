# Project Progress

> **Updated:** 2026-07-30 (KST) · **branch:** `main`  
> **Sources:** git (`67be59b` … `8e9bfd0`) · session QA · `docs/deployment-roadmap.md` · `docs/remaining-work-phases.md`  
> **관련:** `docs/small-group-test-checklist.md` · `docs/LIGHT_MODE_COLOR_INVENTORY.md`

## Now

출시 전 E2E 재검증과 다크모드 육안 QA를 완료했다. 홈 3D의 원격 HDR/WebGL
컨텍스트 손실로 생기던 흰 박스를 제거하고 정적 컷아웃 폴백을 추가했으며, 결과·푸터·CTA
대비도 보강했다. 남은 큰 축은 **운영 스모크 · 소그룹 테스트**.

## Done (최근)

- `recommendation-survey` 단독 2 passed · `results-evidence-phase4` 단독 5 passed
- 다크 육안 QA: 홈/결과/카탈로그/설문/인증/마이페이지, 1440·390 캡처 완료
- 홈 3D: 원격 HDR 제거 · 조명 완화 · WebGL 손실/오류/15초 타임아웃 컷아웃 폴백
- 강제 `webglcontextlost` 검증: 컷아웃 표시 · 흰 캔버스/페이지 ErrorBoundary 방지
- 결과 뱃지·칩·CTA·푸터 대비 보강 (결과 mobile 측정 0 fail)
- frontend lint ✅ · Vitest 55 files/225 tests ✅ · production build ✅
- 홈 히어로 3D: GLB + R3F 드래그 회전 · CC-BY 푸터 크레딧 (`8e9bfd0`)
- 3D 확대 · 부품 카테고리 콜아웃 제거 (`bd25726`)

## Next (1–3)

1. **운영 스모크 →** `docs/small-group-test-checklist.md` 소그룹 테스트
2. **tsc 잔여 정리** — 마이페이지 smoke test의 기존 `Element` → `HTMLElement` 타입 오류 3건
3. 미사용 백업 에셋(`hero-*-prev.png` 등) 정리 여부 결정

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| Manus redesign | ✅ on main | 브랜드/다크/홈 후속도 main |
| 홈 비주얼 | ✅ 3D 안정화 | WebGL 폴백 · 컷아웃 폴백 |
| 다크모드 팔레트 | ✅ 육안 QA·대비 보강 | 결과 mobile 0 fail |
| ui-ux launch Phase 1–11 | ✅ | 운영 확인 후 출시 |
| launch-readiness | Pass 1–3 ✅ · 배포 smoke 대기 | L12–L14 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | Phase 3 대기 · Phase 4 보류 | staging smoke 전 |
| catalog 1:1 | Phase 8 ✅ · 운영 유지 | |
| account-deletion | ✅ | |
| Home revisit | 🔒 | Observe 표본 전 금지 |

## Blocked / Do-not

- `npx tsc --noEmit`: 마이페이지 smoke test 2파일의 기존 DOM 타입 오류 3건
- Home Dashboard · Login redirect · dual Hero · Compare 복원
- 표본 없이 Home revisit 제품 변경
- seed `--apply-to-seed` 자동 적용 금지 · layout diagram geometry 무단 수정 금지
- 가짜 Match % / 추천 알고리즘·질문 수 변경 금지
- API·auth·설문 로직·storage key 변경 금지

## Open questions

- 공개 URL을 staging 성격으로 둘지, production 분리할지
- 미사용 백업 에셋(`hero-*-prev.png`, `-dark`, `-white`) 정리 여부
- 3D 히어로 모바일 성능·로딩 체감 추가 튜닝 필요 여부
