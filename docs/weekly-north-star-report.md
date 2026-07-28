# Weekly North-Star Report (draft)

**제품:** Keyboard Recommender  
**근거:** `docs/PROJECT_BACKLOG.md` · KPI-01 · Investment 북스타  
**작성:** 2026-07-28 (Sprint 3)  
**생성 방법:** `cd backend && python scripts/report_funnel_analytics.py --window-days 7 --csv funnel-week.csv`

---

## 북스타 (Investment)

**주간 「저장된 결과 재오픈」 수** = funnel CSV의 `north_star_reopen_count`  
(= `interaction.revisit` + `scenario_id=mypage_restore_v1`)

| 주차 | 재오픈 수 | 메모 |
|------|----------|------|
| YYYY-Www | _(CLI 값)_ | |

---

## 퍼널 3단 (KPI-01)

| Stage | 정의 | Funnel rate 키 |
|------:|------|----------------|
| 1 | 설문 시작 → 완주 | `rate.funnel_stage1_onboarding_viewed_to_completed` |
| 2 | 완주 → 저장 | `rate.funnel_stage2_completed_to_bookmark` |
| 3 | 저장 → 북스타 재오픈 | `rate.funnel_stage3_bookmark_to_north_star_reopen` |

보조: `count.onboarding.viewed` · `count.onboarding.completed` · `count.interaction.bookmark` · `count.interaction.outbound_click`

---

## 아웃바운드 (BIZ-01)

| 지표 | 키 |
|------|-----|
| 샵 클릭 수 | `count.interaction.outbound_click` |
| 완주 대비 클릭률 | `rate.outbound_click_given_onboarding_completed` |

메타: `surface` = `results` \| `catalog`, `domain`, `itemId`

---

## Founder 주간 체크 (1페이지)

1. 북스타 재오픈이 전주 대비 ↑/↓?  
2. Stage1–3 중 가장 큰 낙폭은?  
3. 아웃바운드 클릭이 0이면 샵 CTA·계측 점검.  
4. Contact 폼 접수 여부(운영 메일).  
5. Watch→Invest: 재오픈·클릭·공유(SHR-01 전) 신호 충분?

---

## 운영 명령

```powershell
cd backend
python scripts/report_funnel_analytics.py --window-days 7 --csv ../tmp/funnel-week.csv
python scripts/report_funnel_analytics.py --window-days 7 --json
```

이벤트 영속화가 꺼져 있으면 counts=0 — `ENABLE_EVALUATION_PERSISTENCE` / unified ingestion 확인.
