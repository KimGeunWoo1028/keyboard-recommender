# End-to-end (Playwright)

Minimal browser coverage for **survey → FastAPI → results rendering**.

## What runs

1. **Survey flow** — deterministic answers, `See results`, then asserts server-ranked picks, explanations, confidence, and the **Engine quality diagnostics** panel (compatibility block from API).
2. **NLP flow** — same survey + NL text `thocky linear quiet`, asserts server-side parse copy on `/results`.
3. **Fixture validation** — JSON fixture has required keys.

Persistence failure behaviour (API still 200 when DB write fails) is covered in **`backend/tests/test_recommendation_persistence_resilience.py`** with `evaluation_persistence_force_failure` — not duplicated in the browser suite to keep runtime small.

## Local

```bash
cd e2e
npm ci
npx playwright install chromium
npm test
```

The Playwright `webServer` runs `scripts/start-stack.cjs` (local: pip install backend → uvicorn :8000 → `next dev` :3000 with `NEXT_PUBLIC_API_URL`). In **CI**, `pip install` is skipped because the workflow already installed the package.

If ports 3000/8000 are already in use, stop those servers or set `PW_REUSE_SERVER=1` after a manual stack start.

## CI

| Workflow | When | Role |
|----------|------|------|
| `.github/workflows/ci.yml` → **Quality · E2E** | every PR / push to `main` | **merge gate** |
| `.github/workflows/e2e.yml` | weekly schedule, `workflow_dispatch`, or PR touching `e2e/**` · `frontend/**` · `backend/src/**` | standalone / focused runs |

Failures **block** merges (no `continue-on-error`).
