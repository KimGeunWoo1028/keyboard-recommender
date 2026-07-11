# Swagkey 제품 이미지 수집 로드맵

> **목적:** 기존 인벤토리(카테고리·브랜드·제품명·`sourceUrl`)에 **대표 이미지 URL**을 단계적으로 추가하고, 추천 풀·카탈로그 UI까지 연결한다.  
> **기준일:** 2026-07-10 (KST)  
> **상태:** Phase 0–7 — **✅ 완료** · Phase 8 — **✅ 완료** (2026-07-10)  
> **관련:** `docs/swagkey-catalog-roadmap.txt` · `docs/PROJECT_CONTEXT.md` §9 · `docs/swagkey-inventory-recheck.md`

---

## 1. 배경

### 현재 보유 데이터

| 필드 | 위치 | 비고 |
|------|------|------|
| category, brand, product_name | `swagkey_products.csv` | 원본 322행 → 정제 293건 |
| sourceUrl, swagkeyProductId | `swagkey_inventory.v2.json` | 293/293 URL merge 완료 |
| 추천 풀 메타 | `swagkey_products.seed.json` | **179건** (6 family) |
| 상품 상세 HTML 캐시 | `swagkey_html_cache/` (~64) · `new_in_crawl_specs/*_html_cache/` (~46) | spec 스크래핑 부산물 |

### 아직 없는 것

- inventory / seed / catalog API / 프론트 카탈로그 카드에 **`imageUrl` 필드 없음**
- 이미지 전용 스크립트·테스트 없음

### 이미지 출처 (검증됨)

스웨그키 상품 상세(`shop_view/?idx=`)는 **아임웹(imweb)** 페이지이며, `<head>`에 대표 이미지가 있다.

```html
<meta id="meta_og_image" property="og:image" content="https://cdn.imweb.me/thumbnail/20260602/5a04de0a2e707.jpg" />
```

캐시된 HTML(`swagkey_html_cache/`, `new_in_crawl_specs/`)에서 동일 패턴 확인. **Selenium 불필요** — 기존 `swagkey_spec_scraper.fetch_html()` HTTP 방식으로 충분.

---

## 2. 원칙 (LOCK)

1. **데이터 계층 유지** — CSV/JSON = 인벤토리 · seed = 추천 풀 · full catalog = ops 전용 (기존과 동일).
2. **trait 없이 seed 대량 추가 금지** — 이번 작업은 **이미지 URL 메타만** 추가. 추천 엔진·trait 파이프라인 변경 없음.
3. **canonical URL 우선** — 이미지 수집 입력은 `shop_view/?idx={id}` 형식 `sourceUrl` (기존 `swagkey_source_url` 정규화 재사용).
4. **단계적 배포** — URL 참조(MVP) → seed merge → API → UI. 로컬 파일 mirror는 **선택 Phase**.
5. **실패 허용** — 품절·404·`seed_only` 항목은 `imageUrl` 비움 + failures 리포트. placeholder는 UI Phase에서 처리.
6. **자동 seed merge 금지 (live)** — inventory recheck와 같이 alert·리뷰 후 `--apply`로 반영.
7. **이용·저작권** — MVP는 imweb CDN **URL 참조(hotlink)**. 로컬 mirror·재배포 전 스웨그키 이용 약관 확인.

---

## 3. 목표 데이터 모델

### 3.1 인벤토리 항목 (`swagkey_inventory.v3.json` — 신규 또는 v2 확장)

```json
{
  "id": "inv-0001",
  "swagkeyProductId": "1416",
  "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1416",
  "productName": "NEO65 Core Plus 기판",
  "imageUrl": "https://cdn.imweb.me/thumbnail/20251226/cf57e1862963e.png",
  "imageSource": "og:image",
  "imageFetchedAt": "2026-07-10T06:00:00+00:00"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `imageUrl` | 권장 | 절대 URL (`https://cdn.imweb.me/thumbnail/...`) |
| `imageSource` | 선택 | `og:image` \| `listing_thumb` \| `manual` |
| `imageFetchedAt` | 선택 | ISO8601 |
| `imageWidth` / `imageHeight` | 선택 | `og:image:width/height` 파싱 시 |

### 3.2 추출 산출물 (`swagkey_product_images.json` — 중간 artifact)

스크래핑 1회 실행 결과. inventory merge 전 검토용.

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "...",
  "stats": { "total": 293, "resolved": 280, "fromCache": 95, "fetched": 185, "failed": 13 },
  "items": [
    { "swagkeyProductId": "1826", "sourceUrl": "...", "imageUrl": "...", "status": "ok" }
  ],
  "failures": [
    { "swagkeyProductId": "9999", "sourceUrl": "...", "reason": "og_image_missing" }
  ]
}
```

### 3.3 seed row (추천 풀 179건)

```json
{
  "id": "sw-linear-001",
  "name": "...",
  "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1792",
  "imageUrl": "https://cdn.imweb.me/thumbnail/..."
}
```

### 3.4 API (`CatalogPartSummary`)

```python
image_url: str = Field(default="", alias="imageUrl")
```

---

## 4. 데이터 흐름

```
[기존] swagkey_inventory.v2.json (293 × sourceUrl)
              │
              ├─ Phase 2: HTML 캐시 → og:image (오프라인)
              │
              └─ Phase 3: sourceUrl HTTP fetch → og:image
                        │
                        ▼
              swagkey_product_images.json
                        │
                        ▼ Phase 4
              swagkey_inventory.v3.json (+ imageUrl)
                        │
                        ├─ merge → swagkey_products.seed.json (179)
                        │
                        ▼ Phase 5–6
              GET /api/v1/{family} → Frontend /catalog 카드
```

**선택 (Phase 7):** CDN URL → `backend/data/swagkey_images/{idx}.{ext}` 로컬 mirror · API `/media/swagkey-images` ✅

---

## 5. Phase별 작업

### Phase 0 — 검증·스파이크 (반나절)

**목표:** 추출 방식 확정, 샘플 5~10건 수동 확인.

| Task | 산출 |
|------|------|
| 캐시 HTML 3종(switch/plate/foam)에서 `og:image` URL 수동 확인 | 이 문서 §1 근거 |
| 목록 페이지 `item-thumb` img vs 상세 `og:image` 품질 비교 | **상세 og:image 채택** (LOCK) |
| 품절·카테고리-only URL 실패 케이스 1~2건 기록 | failures 예시 |

**DoD:** 추출 소스 = `meta[property="og:image"]` 확정. Phase 1 착수 가능.

#### Phase 0 결과 (2026-07-10) ✅

**검증 스크립트:** `backend/scripts/spike_phase0_swagkey_images.py`  
**리포트:** `backend/data/swagkey_inventory/phase0_image_spike_report.json`  
**validation.all_passed:** `true`

| Step | 검증 | 결과 |
|------|------|------|
| 1 | 상품 상세 캐시(4건) `og:image` | ✅ foam-001 · new_in_crawl switch/plate/foam |
| 2 | live `shop_view/?idx=` 2건 `og:image` | ✅ idx=1792 · idx=1303 |
| 3 | live 상세 canonical에 `idx` | ✅ |
| 4 | 목록 vs 상세 비교 | ✅ 상세 `og:image` 확보 (목록 thumb는 lazy/구조상 null 가능) |
| 5 | failures 예시 ≥3 | ✅ synthetic layout · seed_only foam · legacy cache |
| 6 | legacy 캐시 리스크 기록 | ✅ sw-linear-001 · plate-001 = 카테고리 URL 캐시 |

**결정 (LOCK):**

- **추출 소스:** `shop_view/?idx=` 상품 상세의 `meta[property="og:image"]`
- **목록 `item-thumb` fallback:** 사용 안 함 — 상세 `og:image` 채택
- **캐시 신뢰 조건:** canonical 또는 `og:url`에 `idx=` 포함 시만 오프라인 backfill 허용
- **legacy `swagkey_html_cache/` 일부:** 카테고리 URL(`/39`, `/88`)로 스크래핑된 **generic og:image** — 재fetch 필수

**샘플 URL (live):**

| seed / 샘플 | sourceUrl | og:image |
|-------------|-----------|----------|
| sw-linear-001 | `shop_view/?idx=1792` | `cdn.imweb.me/thumbnail/20260507/f4d4a59fbeb2b.jpg` |
| sw-new-001 | `shop_view/?idx=1303` | `cdn.imweb.me/thumbnail/20250929/20e180cf66330.jpg` |
| foam-001 (cache) | `24/?idx=253` | `cdn.imweb.me/thumbnail/20250916/17413e2972115.jpg` |

**실패 케이스 예시 (Phase 3+ 처리):**

1. **legacy_cache_category_page** — `sw-linear-001.html` 캐시 og:image ≠ live 상세 og:image (generic upload path)
2. **seed_only_discontinued_candidate** — `foam-005` (idx=1572) crawl diff `seed_only`
3. **synthetic_layout_taxonomy** — `layout-002` 등 추상 레이아웃 — 제품 사진 아님, placeholder

**재실행:**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/spike_phase0_swagkey_images.py
```

---

### Phase 1 — 추출 모듈 + 단위 테스트 (1일)

**목표:** 재사용 가능한 파서. 네트워크 없이 테스트.

| Task | 파일 (예정) |
|------|-------------|
| `parse_og_image_from_html(html) -> OgImageResult \| None` | `catalog/swagkey_image_extractor.py` |
| 정규식: `og:image`, `og:image:width/height` | 동일 |
| `fetch_html` 재사용 (기존 `swagkey_spec_scraper`) | import only |
| Vitest 아님 — **pytest** | `tests/test_swagkey_image_extractor.py` |

**테스트 케이스:**

- 캐시 fixture HTML → URL 추출
- `og:image` 없음 → `None`
- site icon / favicon URL 혼동 방지 (`cdn.imweb.me/thumbnail`만 허용 등)

**DoD:** `pytest tests/test_swagkey_image_extractor.py` green. Phase 2 착수.

#### Phase 1 결과 (2026-07-10) ✅

**모듈:** `backend/src/keyboard_recommender/catalog/swagkey_image_extractor.py`

| API | 설명 |
|-----|------|
| `parse_og_image_from_html(html, *, require_product_page=True)` | `OgImageResult \| None` |
| `OgImageResult` | `image_url`, `width`, `height`, `og_url`, `canonical_url`, `has_product_idx`, `cache_trusted` |
| `is_valid_swagkey_product_image_url(url)` | `cdn.imweb.me/thumbnail/` 만 허용 |
| `page_has_product_idx(url)` | canonical/og:url에 `idx=` 또는 `shop_view` |
| `fetch_html` | `swagkey_spec_scraper` re-export |

**검증:**

```powershell
cd backend
python -m pytest tests/test_swagkey_image_extractor.py -v
# 8 passed
```

**테스트 커버:** foam/new_in_crawl 캐시 fixture · og:image 없음 · legacy 카테고리 캐시 거부 · generic `upload/` 거부 · width/height 파싱

---

### Phase 2 — 오프라인 backfill (캐시 우선) (0.5일)

**목표:** 네트워크 0으로 ~100건 채우기.

| 입력 | 경로 |
|------|------|
| seed 연결 HTML | `backend/data/swagkey_html_cache/**/*.html` |
| new_in_crawl HTML | `backend/data/swagkey_inventory/new_in_crawl_specs/**/*_html_cache/` |

| Task | 스크립트 (예정) |
|------|----------------|
| 캐시 디렉터리 순회 → `idx` 또는 seed id 매칭 | `scripts/extract_swagkey_images_from_cache.py` |
| 부분 `swagkey_product_images.json` 생성 | `data/swagkey_inventory/` |

**매칭 전략:**

1. HTML 내 `og:url` 또는 canonical의 `idx=` → `swagkeyProductId`
2. 실패 시 파일명·targets manifest와 seed id 매핑

**DoD:** `stats.fromCache` 리포트 · failures 목록. Phase 3에서 미해결만 fetch.

#### Phase 2 결과 (2026-07-10) ✅

**스크립트:** `backend/scripts/extract_swagkey_images_from_cache.py`  
**모듈:** `backend/src/keyboard_recommender/catalog/swagkey_image_cache_backfill.py`  
**산출물:**

| 파일 | 설명 |
|------|------|
| `data/swagkey_inventory/swagkey_product_images.json` | 캐시 backfill 35건 (unique product id) |
| `data/swagkey_inventory/swagkey_product_images.failures.json` | 실패 59건 (legacy 카테고리 캐시 등) |

**실행 결과 (2026-07-10):**

```json
{
  "filesScanned": 95,
  "resolvedFiles": 36,
  "resolved": 35,
  "fromCache": 35,
  "failed": 59,
  "uniqueProductIds": 35
}
```

**검증:**

```powershell
cd backend
python -m pytest tests/test_swagkey_image_cache_backfill.py -v
python scripts/extract_swagkey_images_from_cache.py
```

**해석:** `swagkey_html_cache/` switch·plate 대부분은 카테고리 URL 캐시 → `legacy_category_cache` 실패. `new_in_crawl_specs/` + foam 5건이 주요 성공 소스. Phase 3에서 inventory 293건 중 **미커버 ~258건** HTTP fetch.

---

### Phase 3 — HTTP fetch (나머지 URL) (0.5~1일)

**목표:** 293건 중 캐시 미커버분 `sourceUrl` fetch.

| Task | 스크립트 (예정) |
|------|----------------|
| `swagkey_inventory.v2.json` items 순회 | `scripts/extract_swagkey_product_images.py` |
| 이미 Phase 2에 있으면 skip | `--resume` / merge |
| rate limit: **0.5~1.0s** sleep (기존 spec extract와 동일) | |
| retry + `*.failures.json` / `*.failures.csv` | 기존 패턴 |

**CLI 예시 (참고 — 실행은 Phase 착수 시):**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/extract_swagkey_product_images.py `
  --inventory data/swagkey_inventory/swagkey_inventory.v2.json `
  --out data/swagkey_inventory/swagkey_product_images.json `
  --cache-dir data/swagkey_html_cache `
  --sleep-ms 800
```

**DoD:**

- `resolved / total` ≥ **90%** (목표; 미달 시 failures 원인 분류)
- failures 리포트 커밋 가능 상태

#### Phase 3 결과 (2026-07-10) ✅

**스크립트:** `backend/scripts/extract_swagkey_product_images.py`  
**모듈:** `backend/src/keyboard_recommender/catalog/swagkey_image_inventory_fetch.py`  
**HTML 캐시 (재실행용):** `data/swagkey_inventory/product_image_html_cache/{productId}.html`

**실행 결과:**

```json
{
  "total": 293,
  "resolved": 285,
  "fromCache": 35,
  "fetched": 250,
  "skipped": 37,
  "failed": 6,
  "resolvedPct": 97.27
}
```

**DoD:** `resolvedPct` **97.27%** ≥ 90% ✅ · failures 6건 (전부 **404** 품절/삭제 페이지)

**실패 6건 (`http_error` 404):** idx=384 · 1589 · 1337 · 1456 · 1457 · 1827

**산출물:**

| 파일 | 설명 |
|------|------|
| `swagkey_product_images.json` | **285건** imageUrl (캐시 35 + HTTP 250) |
| `swagkey_product_images.failures.json` | fetch 실패 6건 |
| `swagkey_product_images.failures.csv` | 동일 failures CSV |

**검증:**

```powershell
cd backend
python -m pytest tests/test_swagkey_image_inventory_fetch.py -v
python scripts/extract_swagkey_product_images.py --sleep-ms 800
# target_resolved_pct_90=True
```

**재실행:** Phase 2 산출물이 `--out`에 있으면 `--resume`(기본)으로 기존 35건 skip 후 미커버만 fetch.

---

### Phase 4 — inventory·seed merge (1일)

**목표:** 추천 풀 179건 + 인벤토리 293건에 `imageUrl` 반영.

| Task | 스크립트 (예정) |
|------|----------------|
| v2 + `swagkey_product_images.json` → **v3** | `scripts/merge_swagkey_inventory_images.py` |
| seed merge (`swagkeyProductId` / fuzzy name / sourceUrl) | `scripts/merge_image_urls_into_seed.py` |
| merge 리포트 | `image_seed_merge_report.json` |

**merge 규칙 (LOCK):**

1. `swagkeyProductId` 일치 우선
2. `sourceUrl` canonical idx 일치
3. fuzzy name은 **threshold 0.86** (기존 diff와 동일) + 수동 리뷰 큐
4. seed에만 있고 이미지 없음 → **유지** (imageUrl 빈 문자열)

**DoD:**

- seed 179건 중 imageUrl 채움률 리포트 (목표 **≥95%** for recommendation pool)
- `run_swagkey_catalog_regression.py` green (ingestion·pytest)
- `PROJECT_CONTEXT.md` §4.6 / §9 갱신

#### Phase 4 결과 (2026-07-10) ✅

**스크립트:**

| 스크립트 | 산출 |
|----------|------|
| `merge_swagkey_inventory_images.py` | `swagkey_inventory.v3.json` · `image_inventory_merge_report.json` |
| `merge_image_urls_into_seed.py` | `swagkey_products.seed.with_images.json` · `image_seed_merge_report.json` · `--apply-to-seed` |

**모듈:** `catalog/swagkey_image_merge.py`

**결과:**

| 대상 | total | imageUrl | 비고 |
|------|-------|----------|------|
| inventory v3 | 293 | **287** | Phase 3 404 6건 제외 |
| seed (추천 풀) | 179 | **167** (93.3%) | 목표 95% **미달** — 스위치 12건 404/미수집 |

**seed 미매칭 12건:** `sw-linear-008` · `sw-linear-017` · `sw-other-003/005/006/008/011/016/020/021` · `sw-silent-002/004` — placeholder 유지

**검증:**

```powershell
cd backend
python -m pytest tests/test_swagkey_image_merge.py -v
python scripts/merge_swagkey_inventory_images.py
python scripts/merge_image_urls_into_seed.py --apply-to-seed
python scripts/run_swagkey_catalog_regression.py --skip-pytest
# ingestion: extracted=179 errors=0
```

---

### Phase 5 — Backend API (0.5일)

**목표:** catalog browse 응답에 `imageUrl` 노출.

| Task | 파일 |
|------|------|
| `CatalogPartSummary` + `CatalogPartDetail` 필드 추가 | `schemas/catalog.py` |
| `catalog_browse_service` seed row → DTO | `application/catalog_browse_service.py` |
| contract test | `tests/test_catalog_browse.py` |
| (선택) recommendation compute picks에 `imageUrl` | 별도 Task — 결과 UI 썸네일용 |

**DoD:** `GET /api/v1/switches?limit=1` 응답에 `imageUrl` (있는 항목). contract test green.

#### Phase 5 결과 (2026-07-10) ✅

| Task | 파일 | 상태 |
|------|------|------|
| `CatalogPartSummary` + `CatalogPartDetail` `imageUrl` 필드 | `schemas/catalog.py` | ✅ |
| seed row `imageUrl` → DTO | `application/catalog_browse_service.py` | ✅ |
| contract test (`imageUrl` assert) | `tests/test_catalog_browse.py` | ✅ 11 passed |
| recommendation compute picks `imageUrl` | `api_envelope.py` · Overview UI | ✅ (2026-07-11) |

**검증:**

```powershell
cd backend
pytest tests/test_catalog_browse.py -v
# GET /api/v1/switches?limit=1 → items[0].imageUrl (sw-linear-001, cdn.imweb.me/thumbnail/…)
```

---

### Phase 6 — Frontend 카탈로그 UI (1일)

**목표:** `/catalog` 카드·상세 패널에 썸네일.

| Task | 파일 |
|------|------|
| API 타입·파서 | `frontend/src/lib/api/catalog.ts` |
| 카드 상단 `<Image>` 또는 `<img>` | `catalog-browse-view.tsx` |
| `imageUrl` 없을 때 placeholder (family 아이콘 / 회색 박스) | 동일 |
| Next.js `images.remotePatterns` | `next.config.ts` — `cdn.imweb.me` |
| contract test | `catalog-response.contract.test.ts` |

**UX 규칙:**

- 카드: 고정 aspect ratio (예: 4:3), `object-contain`, glass 패널 톤 유지
- lazy load · layout shift 방지 (`width`/`height` 또는 aspect box)
- 이미지 로드 실패 → placeholder fallback

**DoD:** Vitest green · `npm run build` · 수동으로 `/catalog` 6탭 썸네일 확인.

#### Phase 6 결과 (2026-07-10) ✅

| Task | 파일 | 상태 |
|------|------|------|
| API 타입·파서 `imageUrl` | `frontend/src/lib/api/catalog.ts` | ✅ |
| 썸네일 컴포넌트 (4:3 · placeholder · onError) | `catalog-part-thumbnail.tsx` | ✅ |
| 카드 썸네일 | `catalog-browse-view.tsx` | ✅ |
| 상세 패널 썸네일 | `catalog-detail-panel.tsx` | ✅ |
| `images.remotePatterns` (`cdn.imweb.me/thumbnail/**`) | `next.config.ts` | ✅ |
| contract test | `catalog-response.contract.test.ts` | ✅ 6 tests |

**검증:**

```powershell
cd frontend
npm test
npm run build
# 수동: http://localhost:3000/catalog — 6탭 카드·상세 썸네일 (backend 8010 필요)
```

---

### Phase 6.5 — Catalog browse 정리 (중복·404·레이아웃) ✅

**목표:** browse UI 혼동 제거 — 추천 seed는 유지, **목록 API만** 정리.

| 정책 | 구현 |
|------|------|
| `idx`당 카드 1장 (스위치·플레이트·폼·케이스·키캡) | `catalog_browse_policy.py` dedup |
| HTTP 404 확인 `idx` browse 제외 | `384`, `1589`, `1216` |
| 레이아웃 = 참고 정보 (사진·스웨그키 링크 없음) | archetype 7건만 (`layout-001`…`007`) |
| 추천 풀 seed | **변경 없음** |

**산출:** `catalog/catalog_browse_policy.py` · `catalog_browse_service.py` · `test_catalog_browse_policy.py` · FE layout 상세 안내

**browse 건수 (예):** switch 61 · foam 8 · layout 7 (이전 67 · 9 · 22)

**검증:**

```powershell
cd backend
pytest tests/test_catalog_browse.py tests/test_catalog_browse_policy.py -v
python scripts/audit_catalog_browse_issues.py
# summary.sharedImageCount == 0
```

---

### Phase 6.6 — 스위치 이미지 품질 보정 (2026-07-10) ✅

**목표:** 잘못된 fuzzy 이미지 제거 · 404 스위치 browse 제외 · 감사 자동화.

| Task | 산출 |
|------|------|
| `fuzzy_name` 이미지 merge **금지** | `swagkey_image_merge.py` |
| HTTP 404 확인 9건 browse 제외 (`idx` 12개 누적) | `catalog_browse_policy.py` |
| `sw-linear-006` 잘못된 이미지 제거 | seed + merge 재적용 |
| 감사 스크립트 | `scripts/audit_catalog_browse_issues.py` |
| 404 기록 | `switch_image_remediation_report.json` |

**browse 스위치:** 61 → **52** (404 9건 추가 제외) · **sharedImageCount=0**

**검증:**

```powershell
cd backend
python scripts/record_switch_image_remediation.py
python scripts/merge_image_urls_into_seed.py --apply-to-seed --min-fill-rate 88
python scripts/audit_catalog_browse_issues.py
pytest tests/test_swagkey_image_merge.py tests/test_catalog_browse_policy.py -v
```

---

### Phase 7 — 로컬 이미지 mirror ✅

**목표:** CDN 의존·차단 완화. **Phase 6 안정 후**만.

| Task | 산출 |
|------|------|
| `download_swagkey_images.py` | `imageUrl` → `data/swagkey_images/{idx}.{ext}` |
| static route `/media/swagkey-images` | `app_factory.py` + `settings.swagkey_images_dir` |
| runtime CDN → local fallback | `catalog_browse_service._seed_image_url` + `swagkey_images.py` |
| disk · git 정책 | `.gitignore` · `backend/docs/swagkey-image-storage-policy.md` |
| FE mirror URL resolve | `resolveCatalogImageUrl()` · `next.config.ts` remotePatterns |

**DoD:** 운영자 결정 + 스토리지 정책 문서화 ✅

**검증:**

```powershell
cd backend
python scripts/download_swagkey_images.py --dry-run
python scripts/download_swagkey_images.py
pytest tests/test_swagkey_image_mirror.py tests/test_catalog_browse.py -v
# GET http://localhost:8010/media/swagkey-images/{idx}.jpg
python scripts/audit_catalog_browse_issues.py
```

---

### Phase 8 — 운영·recheck 연동 ✅

**목표:** 재크롤 시 이미지 변경 감지.

| Task | 산출 |
|------|------|
| seed `imageUrl` vs refetched `og:image` | `swagkey_image_url_recheck.py` |
| `imageUrlChanged` alert 타입 | `catalog_change_alert.py` (schema 1.1.0) |
| recheck CLI `--check-image-urls` | `run_swagkey_inventory_recheck.py` |
| CI workflow 플래그 | `swagkey-inventory-recheck.yml` · `swagkey-inventory-recheck-live.yml` |
| 리포트 | `image_url_recheck_report.json` |

**DoD:** fixture 모드 테스트 · webhook dry-run ✅

**검증:**

```powershell
cd backend
pytest tests/test_swagkey_image_url_recheck.py tests/test_catalog_change_alert.py -v
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls --webhook-dry-run --notify-when always
```

---

## 6. 검증 체크리스트

| 단계 | 명령 | 기대 |
|------|------|------|
| Phase 1 | `pytest tests/test_swagkey_image_extractor.py` | green |
| Phase 3 | `extract_swagkey_product_images.py` 리포트 | failures JSON |
| Phase 4 | `python scripts/run_swagkey_catalog_regression.py` | errors=0 |
| Phase 4 | `pytest tests -k swagkey -q` | green |
| Phase 5 | `pytest tests/test_catalog_browse.py` | `imageUrl` assert |
| Phase 6 | `cd frontend && npm test && npm run build` | green |
| E2E (선택) | catalog 카드 `img` 또는 placeholder | 스냅샷 1회 |

---

## 7. 실패 사유 코드 (초안)

| code | 의미 | UI 처리 |
|------|------|---------|
| `og_image_missing` | HTML에 og:image 없음 | placeholder |
| `http_error` | 4xx/5xx | placeholder + recheck |
| `invalid_url` | 파싱 결과가 imweb thumbnail 아님 | skip + 리뷰 |
| `cache_miss` | 캐시·fetch 모두 실패 | placeholder |
| `unmatched_seed` | inventory에는 있으나 seed merge 실패 | ops 리뷰 |

---

## 8. 하지 말 것 (Do not)

- trait·추천 엔진 스코어 변경
- full catalog 153건 UI 노출 (기존 정책 유지)
- live crawl 후 **무심코** `--apply-to-seed` (이미지도 동일)
- `og:image` 없을 때 임의 placeholder URL을 seed에 넣기
- Phase 6 전에 프론트만 CDN hotlink (API contract 없이)

---

## 9. 권장 진행 순서 (한 줄)

```
Phase 0 → 1 → 2 → 3 → 4 → 5 → 6  (필수 경로)
                              ↘ 7, 8 (선택)
```

**예상 일정 (집중 작업):** 필수 Phase 0–6 ≈ **3~4일**.  
**다음 착수 Task:** Phase 0 샘플 검증 → Phase 1 `swagkey_image_extractor.py` + pytest.

---

## 10. 완료 후 문서 갱신

- `docs/PROJECT_CONTEXT.md` — §4.6 카탈로그, §9 파이프라인, §12 파일 인덱스
- `docs/swagkey-catalog-roadmap.txt` — Phase 3 후속에 이미지 항목 체크
- (선택) `backend/docs/catalog-data-architecture.md` — imageUrl 필드

---

## 11. 참고 파일 (현재 repo)

| 용도 | 경로 |
|------|------|
| 인벤토리 + URL | `backend/data/swagkey_inventory/swagkey_inventory.v2.json` |
| 추천 seed | `backend/src/keyboard_recommender/catalog/swagkey_products.seed.json` |
| HTTP fetch | `backend/src/keyboard_recommender/catalog/swagkey_spec_scraper.py` |
| spec extract CLI 패턴 | `backend/scripts/extract_swagkey_specs.py` |
| URL 정규화 | `backend/src/keyboard_recommender/catalog/swagkey_source_url.py` |
| catalog API | `backend/src/keyboard_recommender/application/catalog_browse_service.py` |
| catalog UI | `frontend/src/components/features/catalog/catalog-browse-view.tsx` |
| og:image 샘플 HTML | `backend/data/swagkey_html_cache/sw-linear-001.html` |

---

*이 로드맵은 단계별 구현 시 Agent·개발자 공통 컨텍스트용이다. Phase 완료 시 상단 **상태** 줄과 체크박스를 갱신한다.*
