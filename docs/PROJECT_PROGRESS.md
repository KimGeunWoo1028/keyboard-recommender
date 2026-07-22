# Project Progress

> **Updated:** 2026-07-22 (KST) · **branch:** `main`  
> **Sources:** git status · `ui-ux-improvement-backlog.md` · Pass 1 E2E (`save-reliability.spec.ts`) · this session  
> **관련:** `docs/ui-ux-improvement-backlog.md` · `docs/launch-readiness-roadmap.md` · `docs/small-group-test-checklist.md`

## Now

UI/UX backlog **Pass 1 (상태·시간·저장 신뢰성) Gate CLOSED**.  
Codex PARTIAL이던 실패 상태·중복 클릭 1회 요청을 E2E로 닫았고, 저장→마이페이지→reload→재로그인 핵심 플로도 green.  
다음 작업은 backlog **Pass 2 (홈·설문 전환율)** 또는 launch 배포 smoke.

## Done (최근)

- Pass 1 잔여 Gate: 실패 한국어 복구 + 재시도 E2E · 중복 클릭 POST 1회 E2E ✅
- Pass 1 보강: `mapSaveErrorMessage` raw English 차단 · mypage `security-summary` 실패가 저장 목록을 막지 않도록 분리 · auth.setup API 쿠키 로그인
- Pass 1 (Codex): 시간대 `date-time.ts` · 저장 중 최소 표시 · 중복 성공 메시지 제거 · save-reliability 핵심 플로
- Launch Readiness Pass 1–3 코드 `main` push됨 (`e9a7c95`)
- Product Next / Results / Evidence / Remaining A–F · 회원탈퇴 Phase 0–8 ✅

## Next (1–3)

1. UI/UX backlog **Pass 2** 시작: `HOME-01` · `HOME-02` · `SURVEY-01` · `SURVEY-02` · `LOADING-01`
2. (병행 가능) Vercel/Railway **재배포 후 라이브 smoke** + 소수 인원 테스트 (`small-group-test-checklist.md`)
3. Pass 1 미커밋 변경 커밋/푸시 시점 결정 (`git-sync`)

## Roadmaps

| Track | Status | Note |
|-------|--------|------|
| ui-ux backlog | Pass 1 ✅ · Pass 2 대기 | SYSTEM-01 · RESULT-01 · RESULT-02 |
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
- Pass 2로 넘어가기 전 Pass 1 Gate 재오픈 금지 (이미 CLOSED)

## Open questions

- 공개 URL을 staging 성격으로 둘지, production 분리할지 (테스트·표본 후)
- Pass 1 워크트리 변경(프론트/e2e/백엔드 실험 파일)을 언제 커밋할지
