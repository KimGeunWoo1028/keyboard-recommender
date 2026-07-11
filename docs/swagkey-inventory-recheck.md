# Swagkey inventory recheck (roadmap ⑮ · Phase F)

Weekly / on-demand detection of **new crawl SKUs**, **possibly discontinued seed rows**, and **name drift**.

## Semantics

Crawl inventory has **no stock/품절 field**. Interpretation:

| Diff status | Alert meaning |
|-------------|---------------|
| `new_in_crawl` | New listing to review for seed merge |
| `seed_only` | Possibly discontinued / missing from latest crawl |
| `name_changed` | Rename drift between seed and crawl |
| `image_url_changed` | Seed `imageUrl` differs from refetched `og:image` (Phase 8) |

**Phase 7 alert tiers** (`catalog_change_alert` schema 1.2):

| Tier | Rows | Webhook / `--fail-on-alert` |
|------|------|-----------------------------|
| **informational** | `new_in_crawl` (browse merge candidates) · browse-only `seed_only` / `name_changed` | No |
| **blocking** | `recommendationEligible=true` on `seed_only` / `name_changed` · `imageUrlChanged` | Yes |

`seed_inventory_diff.json` rows include `recommendation_eligible` (diff schema 1.1).

## Fixture mode (CI-safe)

Uses committed `backend/data/swagkey_inventory/seed_inventory_diff.json` (no live Swagkey HTTP).

```cmd
cd backend
python scripts/run_swagkey_inventory_recheck.py --mode fixture --check-image-urls
```

Image check uses committed `product_image_html_cache/{idx}.html` only (no network).

Outputs:

- `data/swagkey_inventory/catalog_change_alert.json`
- `data/swagkey_inventory/catalog_change_alert.txt`
- `data/swagkey_inventory/image_url_recheck_report.json` (when `--check-image-urls`)

GitHub Actions: `.github/workflows/swagkey-inventory-recheck.yml` (Monday 09:00 UTC + `workflow_dispatch`).

Optional webhook (secret only): set repo secret `CATALOG_CHANGE_ALERT_WEBHOOK_URL`. The fixture job passes `--notify-webhook` when the secret is present; missing secret is a no-op skip.

## Live mode (operator / scheduled)

Full product-name refresh still needs a current `swagkey_products.csv` (external Selenium crawl may update it). In-repo automation:

1. HTTP product-URL crawl
2. clean → classify (from CSV)
3. optional URL merge
4. diff → `catalog_change_alert` → optional webhook
5. pipeline **failure** also posts when `--notify-webhook` is set

```cmd
cd backend
python scripts/run_swagkey_live_inventory_pipeline.py --notify-webhook
```

Or step-by-step:

```cmd
cd backend
python scripts/crawl_swagkey_product_urls.py
python scripts/clean_swagkey_inventory.py
python scripts/classify_swagkey_inventory.py
python scripts/run_swagkey_inventory_recheck.py --mode live --refresh-diff --notify-webhook
```

Do **not** auto-merge seed from this step — review the alert, then merge deliberately.

## Browse seed merge (Phase 3 · 1:1)

When `catalog_change_alert` lists **browse merge candidates** (`new_in_crawl`, informational tier):

```cmd
cd backend

REM 1) Inspect diff / alert (no seed write)
python scripts/diff_swagkey_seed_inventory.py
type data\swagkey_inventory\catalog_change_alert.txt

REM 2) Dry-run merge — review stdout + rejected rows
python scripts/merge_inventory_browse_seed.py --dry-run

REM 3) Operator only — after review
python scripts/merge_inventory_browse_seed.py --apply-to-seed

REM 4) Re-validate
python scripts/audit_catalog_1to1_coverage.py --check-threshold --warn-only
python scripts/audit_recommendation_pool.py
python scripts/run_swagkey_catalog_regression.py --skip-pytest
```

**Never** skip dry-run. `manual_curated` / `recommendationEligible` rows are not overwritten by merge scripts.

GitHub Actions: `.github/workflows/swagkey-inventory-recheck-live.yml` (monthly 1st 10:00 UTC + `workflow_dispatch`).

**Dev Gate:** live jobs must not change the fixture workflow’s committed-diff path; fixture recheck stays network-free aside from optional webhook POST.

## Catalog alert webhook (Phase F-2)

| Env | Role |
|-----|------|
| `CATALOG_CHANGE_ALERT_WEBHOOK_URL` | Preferred Slack/Discord/generic JSON hook |
| `OPERATIONAL_ALERT_WEBHOOK_URL` | Fallback if catalog URL unset |

```cmd
cd backend
python scripts/run_swagkey_inventory_recheck.py --mode fixture --webhook-dry-run --webhook-url https://example.invalid/hook --notify-when always
```

Formats: `--webhook-format auto|json|slack|discord` (auto detects Slack/Discord hosts). Logs redact path/token.

**Never commit webhook URLs or tokens.**

## Local verify

```cmd
cd backend
python scripts/verify_ops_quality_15.py
```
