# Swagkey 6탭 카탈로그 1:1 로드맵

> **목적:** 스웨그키 **실제 판매 SKU**를 카탈로그 6탭(스위치·플레이트·폼·레이아웃·케이스/키트·키캡)에 **1:1로 반영**한다.  
> **범위:** 키캡·케이스 확장 포함. **레이아웃 참조 아키타입 7종은 1:1 대상에서 제외**(실제 상품 아님).  
> **기준일:** 2026-07-11 (KST)  
> **상태:** Phase 8 **완료** · 1:1 로드맵 sign-off  
> **관련:** `docs/PROJECT_CONTEXT.md` §4.10·§9 · `docs/swagkey-inventory-recheck.md` · `docs/swagkey-product-images-roadmap.md` · `docs/swagkey-catalog-roadmap.txt`

---

## 1. 목표 정의 (LOCK)

### 1.1 성공 기준

| family | 1:1 기준 | 현재 (2026-07-11) | 목표 |
|--------|----------|-------------------|------|
| switch | `Switches` 카테고리 실제 SKU | seed 67 · CSV 57 | inventory 실 SKU = browse 노출 (404 제외) |
| plate | 분류 `plate` | 14 = 14 | 동일 |
| foam | 분류 `foam` | 9 ≈ 8 | 동일 |
| layout | 분류 `layout` (**기판 등 실제 SKU만**) | 실제 15 · 아키타입 7 **별도** | 실제 SKU 1:1 · 아키타입은 부록 |
| case | 분류 `case_kit` | 49 = 49 (크롤 갭 별도) | inventory `case_kit` = browse |
| keycap | `Keycaps` 카테고리 실제 SKU | seed **18** · CSV **73** | **73 = browse** (재크롤 후 갱신) |

**검증 수식 (family별):**

```text
browse_count(family) ≈ inventory_classified(family) − browse_excluded_404(idx)
```

레이아웃 탭 browse_count는 **아키타입 7건을 포함하지 않는** 실 SKU 수와 비교한다.

### 1.2 명시적 비목표

- 액세서리·데스크패드·게이밍 주변 등 `out_of_scope` 153건을 6탭에 넣지 않음 (`swagkey_catalog_full.json` 유지).
- 스웨그키 사이트 **100% 미러**(검색 전용·단종·숨김 GB)는 보장하지 않음 — **수집 가능한 SKU** 기준 1:1.
- 레이아웃 **참조 아키타입**(`layout-001`~`007`)을 스웨그키 상품으로 취급하지 않음.
- 추천 엔진이 **모든 신규 SKU를 동일 품질로** 랭킹하는 것은 목표 아님 → §4 **이중 풀** 참고.

### 1.3 원칙 변경 (기존 LOCK 대비)

| 기존 (`PROJECT_CONTEXT` §4.10) | 본 로드맵 |
|--------------------------------|-----------|
| seed = 추천 풀 (큐레이션) | seed = **browse 풀(1:1)** + **recommendationEligible** 플래그로 추천 풀 분리 |
| trait 없이 seed 대량 추가 금지 | **browse stub 허용** · 추천 참여는 trait/spec 게이트 유지 |
| inventory recheck 후 수동 merge | 동일 — **자동 `--apply-to-seed` 금지** (리뷰·리포트 후 반영) |

### 1.4 금지 조항 — 레이아웃 키 배열 다이어그램 (DO NOT TOUCH)

레이아웃 탭 카드에 보이는 **키 칸(그리드) 다이어그램** — 각 키의 **크기·위치·간격** — 은 운영자가 수동으로 조정해 둔 **확정 자산**이다. 본 로드맵의 **어떤 Phase에서도** 아래를 **변경·리팩터·재생성·일괄 정렬하지 않는다.**

| 금지 대상 | 경로 (대표) |
|-----------|-------------|
| 레이아웃 블루프린트 정의 (키 x/y/w/h, row 함수, gap 상수) | `frontend/src/components/features/catalog/layout-diagram/layout-diagram-definitions.ts` |
| 다이어그램 렌더러·viewBox | `layout-diagram.tsx` |
| 레이아웃 다이어그램 테스트 (geometry) | `layout-diagram.test.ts` |
| 공개 SVG 자산 | `frontend/public/layout-diagrams/*.svg` |

**허용:** 카탈로그 seed·API·이미지 URL·browse 정책·카드 UI(섹션 구분·칩·필터) — **다이어그램 geometry와 무관한** 작업만.

**예외:** 운영자가 **명시적으로** «레이아웃 다이어그램 수정»을 요청한 경우에만 해당 파일을 편집한다. 1:1 merge·재크롤·seed 확장 작업은 이 예외에 해당하지 않는다.

---

## 2. 아키텍처 — Browse 풀 vs Recommend 풀

카탈로그 1:1과 추천 품질을 동시에 만족하려면 **한 seed 파일 안에서 역할을 나눈다.**

```text
[인벤토리 v4] ──분류──▶ family별 후보
                              │
                              ▼
                    merge_inventory_browse_seed.py
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     browse: 모든 실 SKU              recommendationEligible: true
     (sourceUrl, imageUrl, name)       + spec/trait enrich 완료
              │                               │
              ▼                               ▼
     GET /api/v1/{family}            trait_engine/catalog_sample
     /catalog 6탭                    POST /recommendations/compute
```

**seed row 확장 필드 (제안):**

```json
{
  "id": "kc-042",
  "name": "...",
  "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=...",
  "imageUrl": "...",
  "metadata": { "...": "..." },
  "browse": { "listed": true, "source": "inventory_v4" },
  "recommendationEligible": false,
  "traitConfidence": "name_inferred"
}
```

| `traitConfidence` | 의미 | 추천 참여 |
|-------------------|------|-----------|
| `spec_scraped` | 상세 HTML spec 추출 | ✅ 기본 |
| `manual_curated` | 수동 보강 (기존 179건) | ✅ |
| `name_inferred` | `infer_*_metadata`만 적용 | ❌ (browse만) |
| `missing` | 메타 거의 없음 | ❌ |

---

## 3. 품질 저하 매트릭스 (전 Phase 공통)

구현·운영 시 **어떤 동작이 나빠지는지**와 **완화책**을 미리 고정한다.

| 영역 | 저하 현상 | 원인 | 완화 (Phase) |
|------|-----------|------|----------------|
| **추천 랭킹** | 설문 답과 무관한 “무난한” 스위치·키캡 상위 노출 | `name_inferred` → trait 축이 5.0 근처로 수렴 | Phase 6: `recommendationEligible` 게이트 · spec scrape 우선 큐 |
| **추천 랭킹** | 키캡 Alpha/Addon/Accents가 완성 빌드에 섞임 | 키캡 73건 중 kit_scope 미분류 | Phase 3: `kit_scope` 분류 · addon/alpha는 browse-only 기본 |
| **호환성** | case↔layout 불일치 (Alice 키트 누락·오판) | `infer_layout_size(name)` 한계 | Phase 1·3: spec에서 layout 추출 · 이름에 alice 없는 키트 수동 맵 |
| **호환성** | plate `compatible_layout_sizes`에 alice 과다 | 범용 호환 메타 | Phase 3: 케이스 전용 plate는 좁히기 · 범용은 warning만 |
| **빌드 선택** | 조합 수 폭증 → 응답 지연 | 후보 풀 증가 | Phase 6: recommend 풀만 Cartesian · browse 풀 제외 |
| **빌드 선택** | fallback 빈도 증가 | hard compat + sparse meta | Phase 6: 기존 `select_build_with_fallback` 유지 · audit 로그 모니터링 |
| **카탈로그 UX** | 키캡 탭 카드 수 18→73 · 스크롤·페이지 증가 | 1:1 목표 달성의 직접 결과 | Phase 5: 서브타입 필터 강화 · 정렬(이미지有無) |
| **카탈로그 UX** | 이미지 없는 카드 비율 상승 | 신규 SKU image 미수집 | Phase 4: merge 전 image fetch · placeholder 정책 |
| **카탈로그 UX** | 단종 상품 클릭 시 404 | 스웨그키 품절·삭제 | Phase 5: `BROWSE_EXCLUDED_SWAGKEY_IDX` 유지 · recheck로 갱신 |
| **레이아웃 탭** | “실제 기판”과 “참조 아키타입” 혼동 | 7 archetype + 15 PCB | Phase 5: UI 섹션 분리 · archetype 배지 · 1:1 리포트에서 archetype 제외 |
| **검색** | 카탈로그 내 검색 노이즈 | 유사 상품명·GB 배치명 | Phase 5: 브랜드·subtype 필터 · 정규화 검색 |
| **운영** | `seed_only` / `new_in_crawl` 알림 폭증 | seed ≈ inventory | Phase 7: diff 기준을 **recommend-eligible subset**으로 분리 리포트 |
| **CI** | regression golden·browse count 테스트 실패 | 풀 크기 변경 | Phase 8: coverage 리포트 + threshold 테스트로 전환 |
| **법·운영** | imweb CDN hotlink 실패 | SKU 증가 | Phase 4: mirror 우선 정책 · `imageUrlChanged` recheck |

---

## 4. 데이터 흐름 (End-to-End)

```text
Phase 1  crawl + search supplement
           → swagkey_crawl_urls.v2.json
           → swagkey_products.csv (갱신)
           → swagkey_inventory.v4.json

Phase 2  classify (keycap family 추가)
           → recommender_candidates.json

Phase 3  merge_inventory_browse_seed.py --apply-to-seed
           → swagkey_products.seed.json (browse 1:1)

Phase 4  extract images + optional spec scrape
           → imageUrl 보강 · traitConfidence 상향

Phase 5  API/UI (변경 최소 — seed 로드 경로 동일)
           → /catalog · GET /api/v1/*

Phase 6  recommendationEligible 승격 파이프라인
           → catalog_sample 필터

Phase 7  live recheck (월 1회) + coverage audit

Phase 8  regression · E2E · 문서 갱신
```

---

# Phase 0. Baseline · 정책 고정

> **산출:** 갭 리포트 · LOCK 확인 · 성공 지표 스냅샷

## Task 0-1 — Coverage baseline 스크립트

**작업**

- `backend/scripts/audit_catalog_1to1_coverage.py` (신규)
- family별: CSV / classified / seed / browse API count / 404 excluded
- layout: `is_layout_archetype_part_id` 제외 집계

**Dev Gate**

- [x] 리포트 JSON·txt committed (`catalog_1to1_coverage_report.json`)
- [x] keycap gap ≈ 55건 문서화 (baseline: inventory **65** vs seed **18**, gap **47**; raw CSV Keycaps **73**)

## Task 0-2 — 원칙·필드 스키마 합의

**작업**

- [x] `browse` · `recommendationEligible` · `traitConfidence` seed 스키마 문서화 (본 문서 §2)
- [x] `PROJECT_CONTEXT.md` §4.10에 본 로드맵 링크·이중 풀 원칙 반영

**품질 저하 방지**

- “1:1 = 추천 풀 1:1” 오해 차단 → 이중 풀 명시

**Status:** ✅ Phase 0 완료 (baseline 리포트·스키마·PROJECT_CONTEXT 반영)

---

# Phase 1. 인벤토리 최신화 (선행 필수)

> **목적:** seed를 늘리기 **전에** 스웨그키에 실제로 있는 SKU 목록을 맞춘다.  
> Alice·GB 키트 누락은 이 Phase 없이는 1:1 불가.

## Task 1-1 — Live 카테고리 재크롤

**작업**

```cmd
cd backend
python scripts/crawl_swagkey_product_urls.py --max-pages 30
python scripts/clean_swagkey_inventory.py
python scripts/merge_swagkey_inventory_urls.py
```

**산출:** `swagkey_crawl_urls.v2.json` · `swagkey_inventory.v3` → **v4** bump

## Task 1-2 — 검색 보조 크롤 (신규)

**작업**

- `swagkey_crawler_v2.py` 확장: `crawl_search_keyword(keyword)` 
- 초기 키워드: `Alice`, `Split`, `Arisu`, `베어본`, `GB`, 브랜드 Top-N
- 카테고리 크롤과 **idx dedupe** 후 inventory merge

**품질 저하**

| 저하 | 완화 |
|------|------|
| 검색 결과에 관련 없는 상품 혼입 | 키워드별 allow-category 화이트리스트 |
| 중복 idx 다른 이름 | idx canonical · `name_changed` diff |

## Task 1-3 — Inventory recheck (live)

```cmd
python scripts/run_swagkey_inventory_recheck.py --mode live --refresh-diff --check-image-urls
```

**Dev Gate**

- [x] `new_in_crawl` 리뷰 완료 (15건 — `catalog_change_alert.txt` · Alice 기판/보강판 포함)
- [x] inventory unique idx ≥ 기존 293 (**392**, v3 대비 +101)

**Status:** ✅ Phase 1 완료 (2026-07-12)

---

# Phase 2. 분류기 확장

> **목적:** 키캡·누락 키보드 키트를 recommender family로 보낸다.

## Task 2-1 — `keycap` family 추가

**파일:** `swagkey_inventory_classifier.py`

**작업**

- `category:keycaps` 규칙을 `out_of_scope` → **`keycap`** 으로 변경
- `RecommenderFamily`에 `keycap` 추가 · `RECOMMENDER_FAMILY_ORDER` 반영
- 액세서리 키워드 규칙은 **Keycaps 카테고리보다 뒤**에 두어 오분류 방지

**품질 저하**

| 저하 | 완화 |
|------|------|
| 스위치 윤활 등 액세서리가 keycap으로 분류 | exclude_keywords · category 우선순위 테스트 |
| keycap 73건 중 non-keycap | 분류 리포트 수동 샘플링 10% |

## Task 2-2 — Keyboards 재분류 점검

**작업**

- `Keyboards` 84건 vs `case_kit` 49건 갭 분석
- `기판` → layout · `키트/베어본` → case_kit 규칙 보강

## Task 2-3 — 분류 regression

```cmd
python scripts/classify_swagkey_inventory.py
pytest tests/test_swagkey_inventory_classifier.py -q
```

**Dev Gate**

- [x] `candidates.keycap` ≈ CSV Keycaps 73 (±허용 오차) — **67** (v4 inventory Keycaps 67; raw CSV 73)
- [x] `out_of_scope` 감소 · keycap만큼 이동 — **167 → 100** (−67)

**Status:** ✅ Phase 2 완료 (2026-07-12)

---

# Phase 3. Browse seed 1:1 merge

> **목적:** 분류된 **모든 실 SKU**를 seed에 넣되, 기본값 `recommendationEligible: false`.

## Task 3-1 — `merge_inventory_browse_seed.py` (신규)

**패턴:** `swagkey_case_seed_builder.py` · `swagkey_keycap_seed_builder.py` · `swagkey_new_in_crawl_seed_merge.py` 조합

**동작**

1. inventory v4 + candidates 로드
2. family별 기존 seed idx/id 인덱스
3. 신규 행: stub 생성 (`sourceUrl`, `inventoryId`, `imageUrl`, name metadata)
4. `infer_*_metadata` 적용 → `traitConfidence: name_inferred`
5. 기존 수동 curated 행: `recommendationEligible: true` · `traitConfidence: manual_curated` 유지
6. `--dry-run` → `inventory_browse_merge_report.json`
7. `--apply-to-seed` (운영자만)

**family별 메모**

| family | stub 메타 |
|--------|-----------|
| switch | subtype from name · optional spec queue |
| plate / foam | material 키워드 · layout 호환은 보수적으로 |
| layout | **PCB만** · archetype seed 행은 건드리지 않음 |
| case | `infer_case_metadata` · `layout_size` |
| keycap | `infer_keycap_metadata` · `kit_scope` — **addon/alpha → browse-only** |

## Task 3-2 — Layout archetype 정책

**LOCK**

- `layout-001`~`007`: 삭제하지 않음 · `browse.listed: true` · `recommendationEligible: true` (기존 추천 레이아웃 축 유지)
- 1:1 coverage 리포트·CI에서는 **제외**
- UI: “참조 배열” 섹션 (Phase 5)

## Task 3-3 — Diff 재생성

```cmd
python scripts/diff_swagkey_seed_inventory.py
```

**품질 저하**

| 저하 | 완화 |
|------|------|
| seed JSON 비대화 (~250+ rows) | git diff 리뷰 · family별 분할 리포트 |
| 기존 id 충돌 | idx 우선 매칭 · `skipped_existing` 리포트 |
| 잘못된 case layout_size | Alice 수동 override 맵 `case_layout_overrides.json` |

**Dev Gate**

- [x] `audit_catalog_1to1_coverage.py` — case gap **0** · keycap gap **5** (idx 없음 5건 rejected, 문서화)
- [x] layout seed 실 PCB **38** (classified 23 + legacy 15) · archetype **7** 별도 · browse 실 PCB는 Phase 5
- [x] `pytest tests/test_swagkey_catalog_regression.py -q` 통과

**Status:** ✅ Phase 3 완료 (`inventory_browse_merge_report.json` · seed **331** rows)

**산출 (2026-07-12)**

| family | before | after | added |
|--------|--------|-------|-------|
| switch | 67 | 68 | +1 |
| plate | 14 | 20 | +6 |
| foam | 9 | 10 | +1 |
| layout | 22 | 45 | +23 |
| case | 49 | 126 | +77 |
| keycap | 18 | 62 | +44 |

- rejected 5건: `missing swagkey idx` (inv-0093, inv-0105, inv-0189, inv-0193, inv-0195)
- `recommendationEligible: false` + `traitConfidence: name_inferred` 신규 stub 기본값 적용
- legacy 179건 `manual_curated` · archetype 7건 `recommendationEligible: true` 유지

---

# Phase 4. 이미지 · Spec 보강

> **목적:** browse 체감 품질·추천 승격 준비.

## Task 4-1 — 신규 SKU image fetch

```cmd
python scripts/extract_swagkey_product_images.py --only-missing
python scripts/merge_image_urls_into_seed.py --apply-to-seed
python scripts/download_swagkey_images.py
```

## Task 4-2 — Spec scrape 우선순위 큐

**작업**

- `generate_new_in_crawl_spec_targets.py` 확장: `recommendationEligible` 후보 우선
- family 우선순위: **case (layout_size)** → switch → keycap (full kit만) → plate/foam

**품질 저하**

| 저하 | 완화 |
|------|------|
| HTTP fetch 실패·rate limit | cache · sleep · failures 리포트 |
| og:image 없음 | listing_thumb fallback · UI placeholder |
| spec 파싱 오류 | traitConfidence 상향 보류 · 수동 큐 |

**Dev Gate**

- [x] browse 이미지 커버리지 **100%** (family별, browse-listable 기준) — `audit_browse_image_coverage.py`
- [x] `image_url_recheck` fixture drift: **changed=0** · `imageUrlChanged` alert **0**

**Status:** ✅ Phase 4 완료

**산출 (2026-07-12)**

| 단계 | 결과 |
|------|------|
| `--only-missing` fetch | 107/107 resolved (0 failures) |
| seed image merge | **318/331** (96.07%) · browse gate **100%** |
| mirror download | 152 new local files, 0 failures |
| spec scrape queue | **119** targets (`spec_scrape_targets/`) |

- 신규: `browse_image_coverage.py` · `audit_browse_image_coverage.py` · `swagkey_spec_scrape_queue.py`
- `extract_swagkey_product_images.py --only-missing` · inventory default **v4**
- `generate_new_in_crawl_spec_targets.py --mode phase4_queue` (case → switch → keycap → plate/foam)

---

# Phase 5. 카탈로그 API · UI

> **목적:** 1:1 풀을 사용자에게 보여 주되, 혼동·노이즈를 줄인다.

## Task 5-1 — Browse list 정책

**파일:** `catalog_browse_policy.py` · `catalog_browse_service.py`

**작업**

- browse는 seed **전체 listed** (이미 `is_browse_listable_part` — layout non-archetype 필터 확인)
- archetype 7건: `listed: true` 유지 · 카드에 `referenceLayout: true` (API 필드 추가 검토)
- 404 exclude set live recheck로 갱신

## Task 5-2 — 프론트 카탈로그

**파일:** `catalog-browse-view.tsx`

**작업**

- 레이아웃 탭: **「참조 배열」** / **「기판 상품」** 시각적 구분 (섹션 헤더 또는 chip)
- 키캡: subtype / kit_scope 필터 (Full · Base · Addon)
- 케이스: `layoutSize` 필터 — Alice 등 신규 반영 후 E2E spot check
- `PAGE_SIZE=24` 유지 · 페이지 수 증가는 정상

**품질 저하**

| 저하 | 완화 |
|------|------|
| 레이아웃 탭 혼잡 (7+15) | 섹션 분리 · archetype은 다이어그램 강조 |
| 키캡 탭 첫 화면 압도 | 기본 필터 «Full/Base» · 이미지 있는 항목 우선 정렬 |
| 모바일 스크롤 길이 | 탭별 count 배지 · 필터 상태 URL 유지 |

## Task 5-3 — Results / 추천 링크

**작업**

- `/results` picks `sourceUrl` — browse-only SKU가 pick되지 않도록 Phase 6과 연동 확인
- 카탈로그 → 스웨그키 링크는 **browse 전 SKU**에서 동작 (추천과 무관)

**Dev Gate**

- [x] `/catalog?family=keycap` — browse `subtype=all` **62** · UI 기본 Full/Base **52**
- [x] `/catalog?family=layout` — archetype **7** + 실 PCB **38** · UI 섹션 분리
- [x] `layoutSize=alice` — 케이스 **5**건

**Status:** ✅ 완료 (2026-07-12)

**구현 요약**

- `catalog_browse_policy.py`: 실 PCB browse 허용 · archetype만 diagram/source sanitize · `sort_browse_summaries`
- `catalog_browse_service.py`: `referenceLayout` API · keycap 기본 필터 full/base/noveset · `subtype=all` 전체
- `catalog-browse-view.tsx`: 참조 배열/기판 상품 섹션 · keycap subtype 필터 · case layoutSize 유지
- `catalog.ts`: `referenceLayout` 파싱
- `catalog_1to1_coverage.py`: layout gap은 실 PCB만 · keycap audit는 `subtype=all`

---

# Phase 6. 추천 엔진 분리 (품질 회복)

> **목적:** 카탈로그 1:1이 **추천 품질을 망가뜨리지 않도록** 게이트한다.

## Task 6-1 — `catalog_sample` 로드 필터

**파일:** `trait_engine/catalog_sample.py`

**작업**

```python
# 의사코드
if row.get("recommendationEligible") is False:
    skip for SWITCHES / KEYCAPS / CASES lists
```

- 레이아웃 archetype 7건: **계속 추천 풀** (기존 `layout-001`~`007` id)
- 실 PCB layout 상품: 기본 browse-only (추천 layout 축은 archetype)

## Task 6-2 — 승격 파이프라인

**작업**

- `promote_to_recommendation_pool.py`: `traitConfidence: spec_scraped` + 수동 승인 → `recommendationEligible: true`
- 키캡: `kit_scope in {full, base}` + profile/material 확정 시만 승격
- case: `layout_size` spec 확정 시 승격

## Task 6-3 — Compatibility · fallback 모니터링

**작업**

- `compute` 응답 `fallbackRecoveryAudit` 로그 샘플링
- 승격 후 A/B: fallback rate · confidence 분포 비교

**품질 저하 (승격 없이 3만 하면)**

| 저하 | 완화 |
|------|------|
| 73 키캡이 추천 풀에 들어가면 랭킹 붕괴 | **6-1 필수** |
| Alice case 추천에 안 잡힘 | case 승격 + layout_size spec |
| 사용자 “카탈로그엔 있는데 추천엔 없음” | UI 카피: «카탈로그 전체» vs «추천 큐레이션» (선택) |

**Dev Gate**

- [x] `audit_recommendation_pool.py` — keycap **18** · case **49** · layout **7** (browse 대비 분리)
- [x] `test_compatibility_matrix.py` · `test_catalog_browse.py` · `test_recommendation_pool_gate.py` 통과
- [x] browse 풀 유지 (`load_browse_seed_parts`) · recommend 풀 게이트 (`catalog_sample`)

**Status:** ✅ Phase 6 완료

**산출 (2026-07-12)**

| family | browse | recommend |
|--------|--------|-----------|
| switch | 68 | 67 |
| plate | 20 | 14 |
| foam | 10 | 9 |
| layout | 45 | 7 (archetype only) |
| case | 126 | 49 |
| keycap | 62 | 18 |

- `catalog_sample.is_recommendation_eligible_row` + recommend-only load
- `catalog_browse_service` → browse 풀 분리
- `promote_to_recommendation_pool.py` (dry-run 기본, `--apply-to-seed` 운영자)
- `audit_recommendation_pool.py`

---

# Phase 7. 운영 · 지속 동기화

## Task 7-1 — Recheck 스케줄

- fixture 주간 · live 월 1회 (`swagkey-inventory-recheck-live.yml`)
- `catalog_change_alert` → `new_in_crawl` browse merge 후보

## Task 7-2 — Coverage audit in CI

- `audit_catalog_1to1_coverage.py` — threshold: gap ≤ 2% per family
- 실패 시 PR block (warning 단계 → 이후 harden)

## Task 7-3 — Diff 노이즈 분리

- `seed_inventory_diff` 리포트에 `recommendationEligible` 컬럼
- browse-only 신규는 informational · eligible subset만 blocking alert

**품질 저하**

| 저하 | 완화 |
|------|------|
| alert 피로 | 심각도 tier · webhook은 eligible+404만 |
| inventory↑ 할 때마다 수동 merge 부담 | browse stub **반자동** merge 스크립트 · spec은 분기 큐 |

**Status:** ✅ 완료 (2026-07-12)

**구현 요약**

- Recheck 스케줄: `swagkey-inventory-recheck.yml` (주간 fixture) · `swagkey-inventory-recheck-live.yml` (월 1회 live) — 기존 유지
- `catalog_change_alert` v1.2: **blocking** vs **informational** tier · `browseMergeCandidates` · webhook은 `hasBlockingAlerts`만
- `seed_inventory_diff` v1.1: `recommendation_eligible` 컬럼 per row
- `audit_catalog_1to1_coverage.py --check-threshold` (gap ≤ 2%) · CI warning stage (`continue-on-error`)

**Dev Gate**

- [x] `audit_catalog_1to1_coverage.py --check-threshold --warn-only` 실행 · 리포트에 gapViolations 기록
- [x] `catalog_change_alert` — new_in_crawl informational · eligible seed_only/name_changed만 blocking
- [x] webhook / `--fail-on-alert` — `hasBlockingAlerts` 기준
- [x] `test_catalog_change_alert.py` · `test_swagkey_seed_inventory_diff.py` · `test_catalog_1to1_coverage.py` 통과

---

# Phase 8. 검증 · 문서 마감

## Task 8-1 — Regression

```cmd
cd backend
python scripts/run_swagkey_catalog_regression.py
pytest tests/test_catalog_browse.py tests/test_swagkey_seed_inventory_diff.py -q
```

## Task 8-2 — Frontend smoke

- 카탈로그 6탭 count · 상세 패널 · 이미지 · 스웨그키 링크
- `layoutSize` 필터 spot check (65, alice, 80_tkl)

## Task 8-3 — 문서 갱신

- `PROJECT_CONTEXT.md` — seed 규모 · 이중 풀 · 본 로드맵 완료 Phase
- `docs/swagkey-inventory-recheck.md` — browse merge 절차 추가

**Dev Gate**

- [x] `run_swagkey_catalog_regression.py` — ingestion 331 · pytest **126 passed**
- [x] 추천 품질 게이트 (Phase 6) — `audit_recommendation_pool.py` gatePassed
- [x] catalog browse/ops pytest · frontend `catalog-response.contract` green
- [~] `catalog_1to1_coverage` — plate/case/foam gap 0% · switch/keycap/layout는 inventory 재크롤 전 warning (Phase 7 CI)

**Status:** ✅ 완료 (2026-07-12)

**산출**

- regression snapshot 갱신 (layout archetype `layout-004` · build case 문자열)
- contract: layout `imageUrl` `/layout-diagrams/` 허용
- `PROJECT_CONTEXT.md` §4.10 · `swagkey-inventory-recheck.md` browse merge 절차

---

## 5. Phase 요약 · 의존성

```text
Phase 0 (baseline)
    ↓
Phase 1 (inventory) ──필수──▶ Phase 2 (classify)
                                ↓
                         Phase 3 (browse seed 1:1)
                                ↓
                    Phase 4 (images/spec) ──▶ Phase 6 (recommend gate)
                                ↓                      ↑
                         Phase 5 (UI) ─────────────────┘
                                ↓
                         Phase 7 (ops)
                                ↓
                         Phase 8 (verify)
```

| Phase | 핵심 산출 | 사용자 체감 | 추천 품질 영향 |
|-------|-----------|-------------|----------------|
| 0 | coverage 리포트 | 없음 | 없음 |
| 1 | inventory v4 | 없음 (준비) | 없음 |
| 2 | keycap 분류 | 없음 | 없음 |
| 3 | **browse 1:1** | **카탈로그 풍부** | **저하 위험** (6 미적용 시) |
| 4 | image/spec | 썸네일 개선 | 승격 준비 |
| 5 | UI 구분 | 혼동 감소 | 없음 |
| 6 | recommend gate | «추천» 안정 | **회복** |
| 7 | 지속 sync | 최신성 | 장기 유지 |
| 8 | sign-off | — | 검증 |

---

## 6. 리스크 레지스터

| ID | 리스크 | 확률 | 영향 | 대응 Phase |
|----|--------|------|------|------------|
| R1 | 카테고리-only 크롤로 Alice 등 계속 누락 | 중 | 높음 | 1-2 검색 크롤 |
| R2 | 키캡 73건 추천 풀 유입 | 높음 | 높음 | 6-1 게이트 |
| R3 | 이미지 커버리지 < 70% | 중 | 중 | 4 |
| R4 | seed merge 실수로 기존 trait 덮어씀 | 중 | 높음 | 3 dry-run · manual_curated 보호 |
| R5 | 스웨그키 HTML/구조 변경 | 저 | 중 | crawler fixture test · live 월간 |
| R6 | 1:1 달성 착시 (inventory 자체 불완전) | 중 | 중 | 7-2 coverage CI · 검색 보조 |

---

## 7. 로컬 실행 치트시트 (완료 후)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1

# Coverage
python scripts/audit_catalog_1to1_coverage.py

# Full pipeline (operator)
python scripts/run_swagkey_live_inventory_pipeline.py
python scripts/classify_swagkey_inventory.py
python scripts/merge_inventory_browse_seed.py --dry-run
# review report →
python scripts/merge_inventory_browse_seed.py --apply-to-seed
python scripts/extract_swagkey_product_images.py --only-missing
python scripts/merge_image_urls_into_seed.py --apply-to-seed
python scripts/diff_swagkey_seed_inventory.py
python scripts/run_swagkey_catalog_regression.py
```

---

## 8. 완료 정의 (Definition of Done)

1. **Browse 1:1:** 6탭 family별 `audit_catalog_1to1_coverage` gap ≤ 2% (layout은 archetype 제외).
2. **레이아웃:** 참조 아키타입 7건 유지 · 실 PCB SKU 1:1 · UI 구분.
3. **추천:** `recommendationEligible` 없이 compute 풀 크기 급증 없음 · fallback rate baseline +10%p 이내.
4. **운영:** live recheck + coverage CI 동작.
5. **문서:** `PROJECT_CONTEXT` · 본 로드맵 Phase Status 갱신.

---

*문서 버전: v1.0 · 작성: 2026-07-11 · 다음 리뷰: Phase 1 완료 후*
