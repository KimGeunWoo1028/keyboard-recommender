# Developer Guide

This guide is for first-time contributors and day-to-day development.

## Run locally

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e ".[dev]"
```

Start DB from repo root (example):

```bash
docker compose up -d
```

Set env (from `backend/`):

```bash
copy .env.example .env
```

Secrets and tier-specific values: see **Environment configuration** in the repo root [`docs/env-configuration.md`](../../docs/env-configuration.md).

Run API:

```bash
uvicorn keyboard_recommender.main:app --app-dir src --port 8000
```

### Local dev: login works but `/auth/me` returns 401

Browsers treat **`http://localhost:3000`** and **`http://127.0.0.1:3000`** (and the same for the API port) as **different sites**. The auth cookie is `SameSite=Lax` by default, so it is **not** attached to cross-site `fetch` calls. Symptom: `POST /auth/login` is **200**, then repeated **`GET /auth/me` → 401**.

**Fix (pick one, use the same host name everywhere):**

- Either open the app at **`http://127.0.0.1:3000`** and set `NEXT_PUBLIC_API_URL=http://127.0.0.1:<api-port>` (with `CORS_ORIGINS` including `http://127.0.0.1:3000`),  
- Or use **`http://localhost:3000`** and `NEXT_PUBLIC_API_URL=http://localhost:<api-port>` (with `CORS_ORIGINS` including `http://localhost:3000`).

Do **not** mix `localhost` on the SPA and `127.0.0.1` on the API in local HTTP dev.

## Core local checks

From `backend/`:

```bash
ruff check src tests
pytest -q
```

Determinism and regression guards only:

```bash
pytest -q tests/recommendation_regression tests/snapshot_testing tests/benchmark_validation
```

## Debug recommendations quickly

1. Call compute endpoint with fixed payload.
2. Confirm response fields: `build`, `recommendations`, `recommendationConfidence`.
3. Compare repeated calls for deterministic behavior when same input and settings are used.

PowerShell example:

```powershell
$body = @{
  sound_profile   = "muted"
  typing_pressure = "light"
  switch_feel     = "linear"
  bottom_out      = "soft"
  volume          = "quiet"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method POST `
  -Uri "http://127.0.0.1:8000/api/v1/recommendations/compute" `
  -ContentType "application/json" `
  -Body $body
```

## Enable evaluation logging/persistence

Set in `.env`:

```env
ENABLE_EVALUATION_PERSISTENCE=true
ENABLE_UNIFIED_EVENT_INGESTION=true
```

Optional controls:

```env
ENABLE_EVALUATION_SNAPSHOTS=true
ENABLE_DIAGNOSTICS_PERSISTENCE=true
```

## Inspect drift and operational behavior

Set in `.env`:

```env
ENABLE_OPERATIONAL_AUTOMATION=true
ENABLE_OPERATIONAL_ALERTING=true
```

Then verify notes in compute response highlights and server logs.  
For deeper analysis use trend/benchmark modules under `recommendation_quality/evaluation/`.

## Scaling profile setup

Use profile preset:

```env
SCALING_PROFILE=medium
ENABLE_BATCH_EVALUATION_PIPELINE=true
ENABLE_ASYNC_DIAGNOSTICS_OFFLOAD=true
```

Use `high` only after measuring queue throughput and DB write latency in your environment.

## Swagkey switch spec enrichment workflow

Generate scraping targets from seed:

```bash
python scripts/generate_swagkey_spec_targets.py ^
  --seed src/keyboard_recommender/catalog/swagkey_products.seed.json ^
  --out data/swagkey_switch_targets.json
```

Extract normalized specs from product URLs:

```bash
python scripts/extract_swagkey_specs.py ^
  --targets data/swagkey_switch_targets.json ^
  --out data/swagkey_switch_specs.json ^
  --cache-dir data/swagkey_html_cache ^
  --max-retries 3 ^
  --retry-backoff-ms 700
```

Extraction writes failure reports beside `--out` by default:

- `data/swagkey_switch_specs.failures.json`
- `data/swagkey_switch_specs.failures.csv`

Retry failed IDs only (merge into existing specs):

```bash
python scripts/retry_failed_swagkey_specs.py ^
  --targets data/swagkey_switch_targets.json ^
  --failures-csv data/swagkey_switch_specs.failures.csv ^
  --existing-specs data/swagkey_switch_specs.json ^
  --out data/swagkey_switch_specs.json ^
  --cache-dir data/swagkey_html_cache
```

Merge extracted specs into seed metadata:

```bash
python scripts/enrich_switch_specs.py ^
  --seed src/keyboard_recommender/catalog/swagkey_products.seed.json ^
  --specs data/swagkey_switch_specs.json
```

Plate/Foam compatibility enrichment (sourceUrl-based):

```bash
python scripts/generate_swagkey_compat_targets.py ^
  --seed src/keyboard_recommender/catalog/swagkey_products.seed.json ^
  --out data/swagkey_compat_targets.json

python scripts/extract_swagkey_compat_specs.py ^
  --targets data/swagkey_compat_targets.json ^
  --out data/swagkey_compat_specs.json ^
  --cache-dir data/swagkey_html_cache ^
  --max-retries 3 ^
  --retry-backoff-ms 700

python scripts/enrich_component_specs.py ^
  --seed src/keyboard_recommender/catalog/swagkey_products.seed.json ^
  --specs data/swagkey_compat_specs.json
```

Retry failed plate/foam IDs only (merge into existing compat specs):

```bash
python scripts/retry_failed_swagkey_compat_specs.py ^
  --targets data/swagkey_compat_targets.json ^
  --failures-csv data/swagkey_compat_specs.failures.csv ^
  --existing-specs data/swagkey_compat_specs.json ^
  --out data/swagkey_compat_specs.json ^
  --cache-dir data/swagkey_html_cache
```

One-shot command (repo root, CMD):

```bat
run_swagkey_compat_pipeline.cmd
```

Full one-shot command (switch + compat, repo root, CMD):

```bat
run_all_swagkey_pipeline.cmd
```

## Catalog ingestion/update automation

Run modular ingestion pipeline:

```bash
python scripts/run_catalog_ingestion.py ^
  --seed src/keyboard_recommender/catalog/swagkey_products.seed.json ^
  --manifest data/catalog_ingestion_manifest.json ^
  --report data/catalog_ingestion_report.json ^
  --require-review
```

Approve and publish:

```bash
python scripts/run_catalog_ingestion.py ^
  --seed src/keyboard_recommender/catalog/swagkey_products.seed.json ^
  --manifest data/catalog_ingestion_manifest.json ^
  --report data/catalog_ingestion_report.json ^
  --require-review ^
  --approve-review
```

Manifest format:

```json
{
  "vendor_pages": [{"path": "data/vendor_catalog.json"}],
  "structured_feeds": [{"path": "data/feed_catalog.json"}],
  "manual_overrides": [{"path": "data/manual_override_catalog.json"}]
}
```

## Quality testing and CI

See the repo root [quality-testing](../../docs/quality-testing.md) guide for regression profiles, API contract tests, Vitest, Playwright, and how CI jobs map to failure types.
