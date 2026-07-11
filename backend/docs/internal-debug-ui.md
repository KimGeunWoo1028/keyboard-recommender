# Internal debug UI and API

Not a public product surface. Use on trusted networks / localhost only.

## Backend (`/api/v1/debug/*`)

Environment:

| Variable | Meaning |
|----------|--------|
| `APP_ENV` / `APP_ENVIRONMENT` | Deployment tier. When set to **`production`**, internal debug HTTP is **disabled** (coerced off + middleware + dependency checks) regardless of other flags. |
| `INTERNAL_DEBUG_API_ENABLED` | Must be `true` to mount routes. |
| `INTERNAL_DEBUG_TOKEN` | Optional. If set, every request needs header `X-Internal-Debug-Token` with the same value. If unset, only `DEBUG=true` may access the API. |
| `DEBUG` | FastAPI debug flag; when token is unset, debug routes require `DEBUG=true`. |

Examples:

```bash
# Local: no shared secret
INTERNAL_DEBUG_API_ENABLED=true DEBUG=true uvicorn keyboard_recommender.main:app --reload

# Staging-style: shared secret, DEBUG off
INTERNAL_DEBUG_API_ENABLED=true INTERNAL_DEBUG_TOKEN='choose-a-long-random' uvicorn ...
```

Routes (hidden from OpenAPI):

- `GET /api/v1/debug`
- `POST /api/v1/debug/recommendations/inspect` — body = same survey JSON as `POST /api/v1/recommendations/compute`
- `POST /api/v1/debug/recommendations/compare-surveys` — `{ "baseline": {...}, "treatment": {...} }`
- `POST /api/v1/debug/snapshots/analyze` — `{ "snapshot": { ... } }`
- `POST /api/v1/debug/benchmarks/compare-snapshots` — two snapshot objects
- `GET /api/v1/debug/drift/summary` — query `scenario_id` (optional), `window` (8–256); reads **evaluation persistence** tables for lightweight drift / trends (requires DB + persisted rows).

### Drift UI (Next)

With `NEXT_PUBLIC_INTERNAL_DEBUG=1`, open:

- `/debug/drift` — overview + trends + benchmark previews  
- `/debug/drift/confidence`, `/debug/drift/diversity`, `/debug/drift/families` — focused slices of the same API payload

## Frontend (`/debug/*`)

1. **Enable routes** — in `frontend/.env.local`:

   ```bash
   NEXT_PUBLIC_INTERNAL_DEBUG=1
   ```

   Without this, middleware returns **404** for `/debug` (pages are not linked in the header).

2. **API URL** — either:

   - `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`, or
   - `INTERNAL_API_PROXY_TARGET=http://127.0.0.1:8000` (Next rewrites `/api/*` to the backend during `next dev`).

3. **Token** — if the backend uses `INTERNAL_DEBUG_TOKEN`, paste it in the debug chrome bar (stored in `sessionStorage`).

## Tests

- Backend: `tests/test_internal_debug_api.py`
- Frontend: `npm run test` (Vitest + Testing Library)
