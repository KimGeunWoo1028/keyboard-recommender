# Project Progress

> **Updated:** 2026-07-28 (KST) · **branch:** `main` (local: `fix/e2e-tab-roles-after-manus`)  
> **Sources:** git (`41b526e`, PR #2 merged) · CI run `30287080114` · session  
> **관련:** `docs/MANUS_CONTEXT_BUNDLE.md` · `docs/small-group-test-checklist.md`

## Now

Manus **Precision Editorial**가 **main에 머지**됨 (`#1` / `41b526e`).  
탭 a11y(`role=tab`) 때문에 깨진 E2E는 `#2`로 수정·머지 — **E2E job PASS**.  
최신 CI overall은 regression job만 **Docker Hub pull timeout**으로 실패(인프라 flake, 코드 무관).  
출시 전: 운영 스모크 · 소그룹 테스트 남음.

## Done (최근)

- Manus redesign main 머지 (`#1`) — 홈·auth·설문·결과·마이페이지·legal/debug 등
- E2E 셀렉터 `button`→`tab` 수정 (`#2` / `429dd17`) — Playwright E2E green
- UI/UX Phase 1–11 · save-reliability 라벨 수정 (`dd1f33c`)
- 공유 `ManusPageHeader` / `ManusSurfaceCard` / `ManusBand`

## Next (1–3)

1. **CI regression job 재실행** — Docker Hub flake 해소 확인 (전체 green 목표)
2. **운영 스모크** — Flow 3(게스트→로그인→계정 저장→마이페이지) · 비번 재설정 메일
3. `docs/small-group-test-checklist.md` 소그룹 테스트 후 정식 공개

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| Manus redesign | ✅ on main | E2E 셀렉터 후속 `#2` 포함 |
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
- Manus 적용 후에도 API·auth·설문 로직·storage key 변경 금지

## Open questions

- regression CI flake를 재실행만 할지, Docker pull 재시도 정책 강화할지
- 공개 URL을 staging 성격으로 둘지, production 분리할지
