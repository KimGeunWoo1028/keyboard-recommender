# CI and local validation

## GitHub Actions

Workflow: `.github/workflows/ci.yml`

On each **pull request** and push to **main/master**:

**Backend job**

1. Starts **PostgreSQL 16** (same credentials as `docker-compose.yml`).
2. Sets `DATABASE_URL` and **`ENABLE_EVALUATION_PERSISTENCE=false`** (deterministic tests, no DB writes from HTTP tests).
3. Runs **`ruff check src tests`** (lint).
4. Runs `alembic upgrade head`.
5. Runs `python scripts/check_migration_schema.py`.
6. Runs `pytest`.

**Frontend job**

1. `npm ci`
2. `npm run lint`
3. `npm run build`

## One command (local)

From `backend/` with Docker Postgres up and `DATABASE_URL` exported:

```bash
pip install -e ".[dev]"
export DATABASE_URL=postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender
python scripts/validate_system.py
```

PowerShell:

```powershell
cd backend
.\.venv\Scripts\activate
$env:DATABASE_URL="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"
python scripts/validate_system.py
```

`validate_system.py` runs migrations, schema smoke, then pytest with persistence disabled for the pytest subprocess.

## Makefile (optional)

From `backend/`:

- `make test` — pytest only  
- `make migrate-check` — schema script only  
- `make validate` — full `validate_system.py`

## Regression helpers

`tests/support/regression.py` defines `STABLE_SURVEY`, API key-set checks, and `strip_volatile_recommendation_fields` for deterministic JSON comparisons (timestamps excluded).

## Postgres-marked tests

`pytest -m postgres` runs only `@pytest.mark.postgres` tests. By default the full suite skips them when `DATABASE_URL` is unset or unreachable.
