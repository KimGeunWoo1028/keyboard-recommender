# Debug Guide

Use this guide when recommendation results, evaluation rows, or drift behavior look wrong.

## Fast triage checklist

1. Confirm server and DB are up.
2. Confirm `.env` flags (`ENABLE_EVALUATION_PERSISTENCE`, `SCALING_PROFILE`, operational toggles).
3. Re-run deterministic tests.
4. Reproduce with a fixed request payload and fixed headers.

## Common debug commands

From `backend/`:

```bash
ruff check src tests
pytest -q tests/recommendation_regression tests/snapshot_testing tests/benchmark_validation
```

Run API:

```bash
uvicorn keyboard_recommender.main:app --app-dir src --port 8000
```

## Debug recommendation output mismatches

- Compare two calls with same input payload.
- If mismatch exists:
  - check runtime operational flags
  - check feature toggles (`ENABLE_FEEDBACK_LEARNING_MVP`, scaling settings)
  - check for stale server process on another port

## Debug evaluation persistence

Symptoms:

- no rows in `eval_*`
- compute succeeds but no analytics trail

Checks:

1. `ENABLE_EVALUATION_PERSISTENCE=true`
2. DB connection valid and migrations applied
3. no swallowed exception in server logs (`evaluation_persistence_failed`)

## Debug batch events path

Expected response for queued path:

```json
{"stored":1,"skipped":false,"reason":"queued_for_batch_persistence"}
```

If `reason` is empty:

1. verify runtime settings print as expected
2. fully stop old uvicorn processes
3. restart server in same shell where env vars were exported

## Debug drift and rollback behavior

1. enable operational automation
2. trigger representative traffic
3. inspect runtime notes in response highlights
4. inspect alert logs and threshold evaluator outputs

If rollbacks happen unexpectedly, inspect threshold values in `settings.py` and recent metric windows.
