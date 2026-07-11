# Backend

FastAPI + SQLAlchemy 2 + PostgreSQL, with a clean split between API, domain, application, and infrastructure.

## Documentation map

- Architecture: `docs/architecture-guide.md`
- Developer onboarding: `docs/developer-guide.md`
- Debug procedures: `docs/debug-guide.md`
- Operational runbook: `docs/runbook.md`

## Quick start

Use **Python 3.11, 3.12, or 3.13** (see `requires-python` in `pyproject.toml`). **Python 3.14** often breaks with `ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'` because prebuilt `pydantic-core` wheels may not exist yet; recreate the venv with 3.12/3.13 (Windows: `py -0p` lists installs, then `py -3.12 -m venv .venv`).

From this `backend/` directory:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn keyboard_recommender.main:app --reload --app-dir src
```

- API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

Start PostgreSQL (e.g. repo root `docker compose up -d`), then copy `.env.example` to `.env` and set `DATABASE_URL`.

### Migrations

```bash
alembic upgrade head
```

See [docs/database-schema.md](docs/database-schema.md) for tables and relationships.

Community language → v2 trait axes: [docs/terminology-interpretation.md](docs/terminology-interpretation.md) and `POST /api/v1/terminology/interpret`.

Catalog L/M/H → engine vectors: [docs/catalog-data-architecture.md](docs/catalog-data-architecture.md) and package `keyboard_recommender.catalog`.

## Dev dependencies & tests

### Why imports sometimes break

The app lives in a **src layout** (`src/keyboard_recommender/`). Python only imports `keyboard_recommender` when either:

1. **`src/` is on `sys.path`** (pytest’s `pythonpath` option, or `PYTHONPATH=src`), or  
2. The package is **installed in editable mode** (recommended — same as production packaging).

If you run plain `pytest` from the **monorepo root**, pytest’s root directory is the repo root, not `backend/`, so settings in `backend/pyproject.toml` alone do not apply. The repo root **`pytest.ini`** adds `backend/src` to the path for that case.

### Recommended (works everywhere)

From `backend/`:

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e ".[dev]"
pytest
```

After `pip install -e .`, `keyboard_recommender` is importable from any working directory (local shells, CI, IDEs) without manual `PYTHONPATH`.

### Without editable install

- From **`backend/`**: `pytest` (uses `[tool.pytest.ini_options]` in `pyproject.toml`).
- From **repo root**: `pytest` or `pytest backend/tests` (uses root `pytest.ini`).

## Unified interaction events (optional)

When **`ENABLE_EVALUATION_PERSISTENCE=true`**, the API also accepts **`POST /api/v1/recommendations/events`** with a JSON body `{ "events": [ { "request_id", "event_type", "metadata", ... } ] }` using the unified schema under `recommendation_quality/evaluation/unified_pipeline/`. Successful **`POST /recommendations/compute`** may append a `recommendation.request` row to ``eval_events`` when **`ENABLE_UNIFIED_EVENT_INGESTION`** is left at its default (`true`). Disable with `ENABLE_UNIFIED_EVENT_INGESTION=false` if you only want legacy evaluation rows.

### Feedback learning MVP (rule-based, optional)

Set **`ENABLE_FEEDBACK_LEARNING_MVP=true`** to read recent `interaction.*` rows from ``eval_events`` and apply **small, bounded** adjustments: per-part score multipliers (clicks/saves vs dislikes), tiny trait-vector nudges from aggregated switch-family clicks, light switch-axis weight overlays, and a capped diversity rerank strength delta after comparison events. Tunables include `FEEDBACK_LEARNING_MAX_EVENTS`, `FEEDBACK_LEARNING_CLICK_BOOST`, `FEEDBACK_LEARNING_DISLIKE_PENALTY`, etc. API responses may include a ``feedbackLearning`` object with human-readable ``lines`` when the feature is on and a DB session is available.

### Operational automation (drift -> action, optional)

Set **`ENABLE_OPERATIONAL_AUTOMATION=true`** to evaluate recent persisted metrics/confidence against thresholds and apply **reversible runtime controls**:

- disable reranking on sustained distortion breaches
- disable fallback on compatibility instability breaches
- disable feedback weighting + switch model tag to `stable_v1` when confidence and diversity degrade together

This layer is fail-open (never blocks `POST /recommendations/compute`). Optional alerting is controlled by `ENABLE_OPERATIONAL_ALERTING` plus `OPERATIONAL_ALERT_WEBHOOK_URL`. Thresholds/default flags are environment-configurable via `OPERATIONAL_THRESHOLD_*` and `OPERATIONAL_DEFAULT_*`.

### Traffic scaling profiles (cache + batch + async)

Set **`SCALING_PROFILE`** to quickly tune performance defaults for traffic and compute cost:

- `low`: smaller cache and faster flush for low-traffic environments
- `medium`: balanced defaults (recommended starting point)
- `high`: larger cache and bigger event batches for high load
- `custom`: keep explicit env values (no profile override)

Profile defaults:

- `low`
  - `RECOMMENDATION_CACHE_TTL_SECONDS=20`
  - `RECOMMENDATION_CACHE_MAX_SIZE=512`
  - `EVALUATION_BATCH_SIZE=24`
  - `EVALUATION_BATCH_FLUSH_INTERVAL_SECONDS=1`
- `medium`
  - `RECOMMENDATION_CACHE_TTL_SECONDS=45`
  - `RECOMMENDATION_CACHE_MAX_SIZE=1024`
  - `EVALUATION_BATCH_SIZE=64`
  - `EVALUATION_BATCH_FLUSH_INTERVAL_SECONDS=2`
- `high`
  - `RECOMMENDATION_CACHE_TTL_SECONDS=90`
  - `RECOMMENDATION_CACHE_MAX_SIZE=4096`
  - `EVALUATION_BATCH_SIZE=256`
  - `EVALUATION_BATCH_FLUSH_INTERVAL_SECONDS=3`

Copy-paste examples:

```bash
# balanced default
SCALING_PROFILE=medium

# high-traffic preset
SCALING_PROFILE=high
```

## Production safety (minimal)

- Set **`APP_ENV=production`** (or `APP_ENVIRONMENT=production`). This **disables** the internal `/api/v1/debug/*` HTTP API (coerced off + middleware + dependency checks), forces **`DEBUG=false`**, and applies quieter access logging via `apply_runtime_log_policy`.
- Internal debug in non-production: `INTERNAL_DEBUG_API_ENABLED=true` and either **`INTERNAL_DEBUG_TOKEN`** (clients send `X-Internal-Debug-Token`) or **`DEBUG=true`** for local-only tokenless use.
- CI is defined in **`.github/workflows/ci.yml`** (backend pytest + ruff, frontend lint + build).

## Layout (what each part does)

| Path | Role |
|------|------|
| `src/keyboard_recommender/main.py` | ASGI entry: exposes `app` for Uvicorn. |
| `src/keyboard_recommender/app_factory.py` | Builds FastAPI: CORS, lifespan, routers. |
| `src/keyboard_recommender/config/settings.py` | Env-based configuration (`DATABASE_URL`, etc.). |
| `src/keyboard_recommender/infrastructure/safety/` | Debug-route middleware + log policy helpers (must not break core API). |
| `src/keyboard_recommender/api/` | HTTP layer: health + versioned routers, `deps.py` for DB session. |
| `src/keyboard_recommender/api/v1/` | Version 1 route modules (empty until you add endpoints). |
| `src/keyboard_recommender/application/` | Use cases (no FastAPI imports). |
| `src/keyboard_recommender/domain/` | Core models and errors. |
| `src/keyboard_recommender/infrastructure/persistence/` | Engine, `Session`, ORM `Base`, `models/` catalog schema. |
| `alembic/` | Alembic migrations; `alembic.ini` at repo `backend/` root. |
| `requirements.txt` | Pinned runtime dependencies. |
