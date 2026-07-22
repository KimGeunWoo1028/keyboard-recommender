# Next Steps Summary

> **버전:** v1.0 - 2026-07-16 (KST)  
> **목적:** 2026-07-16 현재 기준으로, 기능 구현 완료 이후 앞으로 남은 실질 작업을 짧게 정리  
> **전제:** 홈/추천/결과/마이페이지/카탈로그 핵심 기능은 구현 완료 상태이며, 현재 우선순위는 운영 검증과 배포 분기 정리  
> **관련:** `PROJECT_CONTEXT.md` · `deployment-roadmap.md` · `remaining-work-phases.md`

---

## 현재 상태

- 기능 구현은 대부분 완료
- `www.keyboard-recommender.com` 외부 접속 가능
- 프론트는 `Vercel`, 백엔드 경유 응답은 `Railway`로 보임
- 소수 인원 테스트를 먼저 진행하는 방향으로 결정
- Home revisit는 아직 잠금 상태

---

## 지금 가장 먼저 할 일

### 1. 소수 인원 테스트 운영

- 공개 URL에서 실제 사용자 흐름 검증
- 로그인, 설문, 결과, 저장, 카탈로그 중심으로 확인
- 버그 제보를 한 채널로 모음

### 2. 테스트 중 이벤트 적재 관찰

- `eval_events` 증가 확인
- `home.viewed` 적재 확인
- `interaction.bookmark` 적재 확인

### 3. 운영 이슈 우선 정리

- 치명적 오류는 즉시 수정
- 문구/정렬 등 비차단 이슈는 묶어서 후속 처리

---

## 단기 할 일

### A. 스모크 검증 마감

- 로그인 유지 확인
- 로그아웃 확인
- 저장 빌드와 다시 보기 확인
- 카탈로그 이미지와 링크 확인

### B. `/health` 노출 정보 축소

- 운영 정보 과다 노출 여부 점검
- production 공개용이라면 최소 응답만 남기기 검토

### C. switch/keycap coverage 잔여 보강

- 문서상 남은 예외 항목 재확인
- live recrawl 또는 idx enrichment 필요 여부 판단

---

## 중기 할 일

### 1. Observe 표본 확보

- 최소 14일 이상 관찰
- `home.viewed >= 50` 확인
- guest/authenticated 모두 표본 존재 확인

### 2. production 분리 여부 결정

- 현재 공개 URL이 staging 성격인지 production 성격인지 내부 확정
- 필요 시 별도 DB, 별도 시크릿, 별도 `APP_ENV=production`으로 분리

### 3. Production smoke

- production URL 기준으로 로그인/설문/결과/저장 재검증
- debug/실험 플래그 production 안전값 확인

---

## 아직 하지 말아야 할 일

- Home Dashboard 부활
- Login redirect 실험
- dual Hero
- Compare UI 복원
- 빠른 추천 모드 재도입
- 표본 없는 상태에서 Home revisit 제품 변경

---

## 의사결정 포인트

### 소수 테스트 후 바로 판단할 것

- P0/P1 이슈가 얼마나 나오는가
- 저장/재방문 플로우가 실제로 쓰이는가
- 이벤트 적재가 안정적인가

### 표본 확보 후 판단할 것

- Home revisit를 열 가치가 있는가
- production을 완전 분리할 시점인가
- 운영자용 관찰 리듬을 주간 기준으로 고정할 것인가

---

## 권장 진행 순서

1. 소수 인원 테스트 시작
2. 핵심 플로우 버그 수집
3. 이벤트 적재 확인
4. `/health` 운영 노출 정리 검토
5. 테스트 안정화
6. 14일 표본 관찰
7. production 분리 필요 시 실행
8. 그 다음 Home revisit 검토

---

## 한 줄 결론

지금 단계의 우선순위는 새 기능이 아니라, 실제 사용자 흐름을 작게 열어 보고 안정성과 데이터 수집을 확인하는 것입니다. 그 다음이 production 분리이고, Home revisit는 그 이후 판단 대상입니다.

