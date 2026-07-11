# Results UX — Phase 5 QA 백로그 (→ Phase 6)

> **날짜:** 2026-07-09  
> Phase 5 Dev Gate에서 확인한 항목 중 Phase 6 polish로 이관.

| # | 항목 | 우선순위 | 비고 |
|---|------|----------|------|
| 1 | Hero 칩 5개 → 접이식 요약 (모바일) | P2 | Phase 5에서 패딩·타이포만 압축 |
| 2 | Tab bar scroll-snap · fade edge | P3 | Phase 5 overflow-x-auto만 |
| 3 | Drawer drag-to-dismiss (모바일) | P3 | Esc·backdrop으로 닫기 유지 |
| 4 | CTA 행 sticky (스크롤 시) | P3 | First View ≤1 scroll 우선 |
| 5 | 6축 카드 description line-clamp | P2 | 1열에서 세로 길이 제한 |
| 6 | activity 탭 → Overview accordion | P1 | Phase 4 Defer 유지 |
| 7 | Compare Drawer focus trap (Tab cycle) | P2 | Phase 5: open 시 닫기 포커스 |
| 8 | reduced-motion drawer transition | P3 | Phase 6 motion |
| 9 | 375px 스크린샷 회귀 세트 | P2 | 수동 QA 체크리스트 |
| 10 | tablet 768px 6축 2열 breakpoint tune | P3 | sm:grid-cols-2 유지 |
| 11 | SR live region for saveMessage | P2 | aria-live polite |
| 12 | 대안 카드 모바일 carousel | P3 | grid 1열로 충분 시 defer |
| 13 | discovery accordion default collapsed | — | 이미 collapsed |
| 14 | 품질 요약 카드 모바일 접기 | P3 | below fold |
| 15 | typo/spacing 토큰 정렬 (ca-*) | P2 | Phase 6 polish |

**Phase 5 완료 기준:** 위 항목은 defer 허용 · Dev Gate (overflow · 375 First View · focus/Esc · E2E) 통과.
