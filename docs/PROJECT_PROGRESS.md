# Project Progress

> **Updated:** 2026-07-26 (KST) · **branch:** `main`  
> **Sources:** git · live expert audit · Phase 0–1 SEO session · `ui-ux-final-verification.md`  
> **관련:** `docs/ui-ux-final-verification.md` · `docs/small-group-test-checklist.md`

## Now

UI/UX Pass 1–6는 완료·조건부 출시 상태. 라이브 전문가 감사 후 **SEO Phase 1**로 전역 홈 canonical을 제거하고 페이지별 self-canonical·개인 페이지 noindex를 적용함.

## Done (최근)

- SEO Phase 1: `page-metadata` 헬퍼 · 루트 홈 canonical 제거 · 공개/개인 페이지 meta · forgot-password 서버 래퍼 · sitemap slash 정합
- 라이브 전문가 감사(게스트 설문→결과·뷰포트·문의 도메인화 확인) · 출시 판정「제한적 베타」
- UI/UX Pass 1–6 + final CONDITIONAL PASS (`4ab213f`)
- Pass 6 용어/`destructive`/guidelines · Pass 5 카탈로그·모바일 메뉴
- Pass 4 auth·마이페이지 · Pass 3 결과 위계 · Pass 2 홈·설문 · Pass 1 저장 신뢰성

## Next (1–3)

1. **SEO/출시 후속 Phase** (마이페이지 빈상태 오표시 · 커스텀 404 · 결과 CTA 위계 등 P1)
2. CONDITIONAL: **Flow 3** 수동 + **키보드 Tab** 1회 → 충족 시 PASS 격상
3. 재배포 후 라이브 smoke (`canonical` 포함) + `small-group-test-checklist.md`

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| ui-ux backlog | Pass 1–6 ✅ · final CONDITIONAL | Flow 3·Tab 잔여 |
| launch SEO fix | Phase 1 ✅ · Phase 2+ 대기 | canonical 수정됨 |
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
