# Project Progress

> **Updated:** 2026-07-27 (KST) · **branch:** `main`  
> **Sources:** git · live expert audit · launch Phase 0–4 · `ui-ux-final-verification.md`  
> **관련:** `docs/ui-ux-final-verification.md` · `docs/ui-ux-improvement-backlog.md` · `docs/small-group-test-checklist.md`

## Now

출시 심사 후속 **Phase 0–4 완료** (결과 CTA: 저장 Primary / 스웨그키 Secondary).  
canonical · 마이페이지 로딩 · 한국어 404 · 결과 저장 위계까지 반영.

## Done (최근)

- Phase 4: 결과 CTA 저장 Primary · 구매 Secondary · 저장 중/완료/실패 상태 · 게스트·계정 안내 (`results-next-actions`)
- Phase 3: `not-found.tsx` 한국어 다크 404 · 홈/설문 CTA · HTTP 404 · 레거시 URL 검증 (`04cb11a`)
- Phase 2: 마이페이지 `SavedLoadState` · 스켈레톤 · 원격 오류≠빈목록 · 계정 전환 가드 (`44481c8`)
- Phase 1: 전역 홈 canonical 제거 · 페이지별 self-canonical · 개인 noindex (`bc10f6b`)
- Phase 0: 구조·라우트·메타 기준 상태 분석 (코드 변경 없음)
- 라이브 전문가 감사 · UI/UX Pass 1–6 **CONDITIONAL PASS** (`4ab213f`)

## Next (1–3)

1. **출시 후속 Phase** — 잔여 P1 (auth 에러 bleed · 폼 검증 한국어 등)
2. CONDITIONAL 조건: **Flow 3** 수동(게스트 결과→로그인→계정 저장) + **키보드 Tab** 1회
3. 재배포 후 라이브 smoke(canonical·404·마이페이지·결과 CTA) + `small-group-test-checklist.md`

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| ui-ux backlog | Pass 1–6 ✅ · final CONDITIONAL | Flow 3·Tab 잔여 |
| launch SEO fix | Phase 0–4 ✅ · Phase 5+ 대기 | canonical · mypage · 404 · results CTA |
| launch-readiness | Pass 1–3 ✅ · 배포 smoke 대기 | L12–L14 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | Phase 3 대기 · Phase 4 보류 | staging smoke 전 |
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
- CONDITIONAL 충족 후 final verdict를 PASS로 문서 격상할지 (owner)
