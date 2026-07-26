# Project Progress

> **Updated:** 2026-07-26 (KST) · **branch:** `main`  
> **Sources:** git · launch SEO Phase 1–3 · `ui-ux-final-verification.md`  
> **관련:** `docs/ui-ux-final-verification.md` · `docs/small-group-test-checklist.md`

## Now

출시 심사 후속 Phase 1–3 반영. canonical·마이페이지 로딩 분리에 이어 **한국어 다크 404**로 Next 기본 영문 페이지를 교체함.

## Done (최근)

- Phase 3: `not-found.tsx` 한국어 다크 404 · 홈/설문 CTA · HTTP 404 유지 · 레거시 URL 검증
- Phase 2: 마이페이지 로딩≠빈상태 · 원격 API 오류 분리 · 계정 전환 stale 가드
- Phase 1: 페이지별 self-canonical · 개인 noindex
- 라이브 전문가 감사 · UI/UX Pass 1–6 CONDITIONAL PASS

## Next (1–3)

1. **출시 후속 Phase** (결과 CTA 위계 등 잔여 P1)
2. CONDITIONAL: **Flow 3** 수동 + **키보드 Tab** 1회
3. 재배포 후 라이브 smoke + `small-group-test-checklist.md`

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| ui-ux backlog | Pass 1–6 ✅ · final CONDITIONAL | Flow 3·Tab 잔여 |
| launch SEO fix | Phase 1–3 ✅ · Phase 4+ 대기 | canonical · mypage · 404 |
| launch-readiness | Pass 1–3 ✅ · 배포 smoke 대기 | L12–L14 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | Phase 3 대기 · Phase 4 보류 | |
| catalog 1:1 | Phase 8 ✅ · 운영 유지 | |
| account-deletion | ✅ | — |
| Home revisit | 🔒 | Observe 표본 전 금지 |

## Blocked / Do-not

- 전면 UI 리디자인 / Desk Craft 전환 금지
- Home Dashboard · Login redirect · dual Hero · Compare 복원
- 표본 없이 Home revisit 제품 변경
- seed `--apply-to-seed` 자동 적용 금지 · layout diagram geometry 무단 수정 금지
- 가짜 Match % / 추천 알고리즘·질문 수 변경 금지

## Open questions

- 공개 URL을 staging 성격으로 둘지, production 분리할지
- CONDITIONAL 조건 충족 후 final verdict PASS 격상 여부 (owner)
