# Project Progress

> **Updated:** 2026-07-24 (KST) · **branch:** `main`  
> **Sources:** this session (Pass 2) · `ui-ux-improvement-backlog.md` · git (`87a10f4` + uncommitted Pass 2)  
> **관련:** `docs/ui-ux-improvement-backlog.md` · `docs/launch-readiness-roadmap.md` · `docs/small-group-test-checklist.md`

## Now

UI/UX backlog **Pass 2 구현 완료** (홈·설문 전환율 + 상세 스펙 gap-fill).  
lint / tsc / unit / build 통과. **아직 커밋·푸시 안 됨** (`main` working tree dirty).  
브라우저 1440/768/390/360 육안 smoke는 owner 확인 권장.

## Done (최근)

- Pass 2: HOME-01/02 · SURVEY-01/02 · LOADING-01 + gap-fill (3단계 프로세스 · 예시 배지 결과 프리뷰 · 성향 카드 키워드 · 전체 설문 대안 · 선택 체크 · 리셋 확인 · NL disclosure · 마지막 CTA 예고)
- Pass 2 Gate: frontend lint/tsc/unit(9)/build green
- Pass 1 Gate CLOSED + `save-reliability` E2E · CI 핫픽스 (`87a10f4`까지 push됨)
- Asia/Seoul 시간 · 저장 CTA/실패 메시지 · Launch Readiness Pass 1–3 · 회원탈퇴 ✅

## Next (1–3)

1. Pass 2 **커밋·푸시** (`git-sync`) 후 CI 확인
2. UI/UX backlog **Pass 3**: `RESULT-03` · `RESULT-04` (결과 CTA 중복·정보 밀도)
3. Vercel/Railway **재배포 후 라이브 smoke** + 소수 인원 테스트 (`small-group-test-checklist.md`)

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| ui-ux backlog | Pass 1–2 ✅ · Pass 3 대기 | Pass 2 uncommitted |
| launch-readiness | Pass 1–3 ✅ · 배포 smoke 대기 | L12–L14 출시 후 |
| remaining-work A–F | ✅ / B 표본 대기 | Home revisit 🔒 |
| deployment | Phase 3 🔄 · Phase 4 보류 | prod 분리는 테스트·표본 후 |
| catalog 1:1 | 운영 유지 | coverage 잔여만 |
| account-deletion | ✅ | — |
| Home revisit | 🔒 | Observe 표본 전 금지 |

## Blocked / Do-not

- L01으로 **전면 UI 리디자인 / Desk Craft 전환** 금지
- Home Dashboard · Login redirect · dual Hero · Compare 복원
- 표본 없이 Home revisit 제품 변경
- seed `merge_*` / `promote_*`에 `--apply-to-seed` 자동 적용 금지
- layout diagram geometry 무단 수정 금지
- Pass 1 Gate 재오픈 금지 (CLOSED · CI green)
- 가짜 Match % / 추천 알고리즘·질문 수 변경 금지 (Pass 2 범위)

## Open questions

- 공개 URL을 staging 성격으로 둘지, production 분리할지 (테스트·표본 후)
- Pass 2 프리뷰에 실제 Swagkey seed SKU를 붙일지 (지금은 샘플·설문 어휘)
