# Project Progress

> **Updated:** 2026-07-30 (KST) · **branch:** `main`  
> **Sources:** git · full-project-qa mode=ops · `docs/deployment-roadmap.md` · `docs/remaining-work-phases.md`  
> **관련:** `docs/small-group-test-checklist.md` · `docs/LIGHT_MODE_COLOR_INVENTORY.md`

## Now

ops 포함 전체 QA **PASS**. `tsc` mypage smoke 타입 오류도 정리했고, Vercel 공개 URL
하나를 피드백·소그룹 환경으로 유지한다. 남은 큰 축은
**공개 URL 운영 스모크 · 소그룹 테스트**.

## Done (최근)

- Full Project QA mode=ops: backend/frontend/e2e/ops 전부 PASS (E2E 26 passed)
- `tsc --noEmit` PASS — mypage smoke `closest()` → `HTMLElement` 캐스트 3건
- Backend ruff · unit 386p/1s · quality 11p · fixture blocking 0 · Ops ⑮ OK · catalog 128p/1s
- 홈 3D WebGL 흰 박스 수정 · 다크 대비 보강 (`2c7b852`)
- `recommendation-survey` · `results-evidence-phase4` · 다크 육안 QA

## Next (1–3)

1. **운영 스모크 →** `docs/small-group-test-checklist.md` (`www.keyboard-recommender.com`)
2. Coverage WARN 후속 — switch 3.6% · keycap 7.5% (목표 ≤2%, 운영 유지)
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
| deployment | 공개 URL=피드백 환경 | staging 분리 보류 · Vercel 루프 |
| catalog 1:1 | Phase 8 ✅ · 운영 유지 | coverage WARN 잔여 |
| account-deletion | ✅ | |
| Home revisit | 🔒 | Observe 표본 전 금지 |

## Blocked / Do-not

- Home Dashboard · Login redirect · dual Hero · Compare 복원
- 표본 없이 Home revisit 제품 변경
- seed `--apply-to-seed` 자동 적용 금지 · layout diagram geometry 무단 수정 금지
- 가짜 Match % / 추천 알고리즘·질문 수 변경 금지
- API·auth·설문 로직·storage key 변경 금지

## Open questions

- 미사용 백업 에셋(`hero-*-prev.png`, `-dark`, `-white`) 정리 여부
- 3D 히어로 모바일 성능·로딩 체감 추가 튜닝 필요 여부
