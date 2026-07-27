# Project Progress

> **Updated:** 2026-07-28 (KST) · **branch:** `feature/manus-redesign`  
> **Sources:** git (uncommitted Manus redesign) · demo-final 시안 · session sync  
> **관련:** `docs/MANUS_CONTEXT_BUNDLE.md` · `docs/small-group-test-checklist.md`

## Now

Manus **Precision Editorial** UI를 `feature/manus-redesign`에 적용 완료(홈·auth·설문·결과·마이페이지·약관/문의·디버그 등 세부 라우트 포함).  
기능(API·인증·설문·저장·라우트·메타)은 유지, 시각만 맞춤. FE typecheck/lint/build/unit **172/172 PASS**.  
아직 **main 미머지** · 원격 feature 브랜치 푸시 대상.

## Done (최근)

- Manus demo-final 톤: indigo 토큰·라이트 기본·Header/Footer·홈 2열 히어로
- 세부 라우트 PE 셸: forgot/reset · privacy/terms/contact · account-deleted
- 설문·결과 탭/카드 · 마이페이지 탭 · 카탈로그 상세 · debug/terminology chrome
- 공유 `ManusPageHeader` / `ManusSurfaceCard` / `ManusBand`
- UI/UX Phase 1–11 + E2E 셀렉터 수정 (`dd1f33c` on main)

## Next (1–3)

1. **PR 리뷰·머지** — `feature/manus-redesign` → `main` (시각 회귀·모바일 스모크)
2. **CI green 확인** — 푸시 후 lint/tsc/unit/e2e
3. **운영 스모크** — Flow 3 · 비번 재설정 메일 · 소그룹 테스트 후 공개

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| Manus redesign | ✅ on feature | main 머지 대기 |
| ui-ux launch Phase 1–11 | ✅ | 운영 확인 후 출시 |
| launch-readiness | Pass 1–3 ✅ · 배포 smoke 대기 | L12–L14 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | Phase 3 대기 · Phase 4 보류 | staging smoke 전 |
| catalog 1:1 | Phase 8 ✅ · 운영 유지 | |
| account-deletion | ✅ | |
| Home revisit | 🔒 | Observe 표본 전 금지 |

## Blocked / Do-not

- Home Dashboard · Login redirect · dual Hero · Compare 복원
- 표본 없이 Home revisit 제품 변경
- seed `--apply-to-seed` 자동 적용 금지 · layout diagram geometry 무단 수정 금지
- 가짜 Match % / 추천 알고리즘·질문 수 변경 금지
- Manus 적용 시에도 API·auth·설문 로직·storage key 변경 금지

## Open questions

- `feature/manus-redesign` PR를 바로 main에 올릴지, 시각 QA 후 올릴지
- 공개 URL을 staging 성격으로 둘지, production 분리할지
