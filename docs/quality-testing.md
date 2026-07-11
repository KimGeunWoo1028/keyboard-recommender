# Quality testing and CI

This repo splits automated checks so a failing run **names the area** (ranking vs compatibility vs API shape vs UI vs E2E).

## Pillar → job mapping

| CI job | Purpose | Typical failure means |
|--------|---------|----------------------|
| **Quality · regression** | Seeded engine runs, golden profiles, byte-stable snapshot, benchmark drift | **Ranking / diversity** drift, **compatibility** penalty drift, non-determinism |
| **Quality · API contract** | `POST /recommendations/compute` JSON + nested Pydantic (`compatibilityAudit`, `recommendationConfidence`, picks) | **Response schema** break, **explanation** field drift for clients |
| **Quality · unit** | Default `pytest` tree (minus the buckets above), Ruff, Alembic smoke | Logic regressions unrelated to golden profiles |
| **Quality · frontend** | ESLint, production build, Vitest | **UI / client parser** regressions |
| **Quality · E2E** | Playwright (auth setup + critical flows) | **End-to-end** breakage (routing, session, wizard) |

## Deterministic recommendation regression

- **Seed:** `tests/recommendation_regression/harness.py` uses `deterministic_seed()` (`random.seed(20260505)`).
- **Profiles:** `quiet_office`, `deep_thock`, `gaming_linear` (plus extra variance cases) with `ProfileExpectation` bounds.
- **Snapshot:** `tests/snapshot_testing/` — full canonical JSON for `STABLE_SURVEY`; update the snapshot only when the model change is intentional.

## API contract tests

- Location: `backend/tests/contract/`
- Validates OpenAPI-facing models and a live `TestClient` compute call, including nested audit objects.
- **Resilient fallback:** `tests/test_recommendation_resilient_fallback.py` — full failure → degraded response with `degradedReason`; request `mode=quick` → 422.

## Frontend tests

- **Vitest:** `frontend/src/**/*.test.{ts,tsx}`
- **Parser contract:** `recommendation-response.contract.test.ts` guards `parseRecommendationApiResponse` (`runMode`, `degradedReason`).
- **Smoke UI:** `recommendation-result-view.smoke.test.tsx` checks ranked picks + quality diagnostics render.
- **Survey wizard (engine unification):**
  - `survey-wizard.quick-removal.test.tsx` — no «빠른 추천» entry UI (Phase 1).
  - `survey-wizard.preset-skip.test.tsx` — preset jumps to first unanswered step (Phase 3).
  - `survey-step-navigation.test.ts` — `firstUnansweredStepIndex` helper.

## E2E

- **Auth:** `e2e/tests/auth.setup.ts` logs in once; storage state is written to `e2e/playwright/.auth/` (gitignored).
- **Seed user:** `backend/scripts/seed_e2e_user.py` (PostgreSQL, idempotent). Defaults: `e2e-ci@keyboard.local` / `E2e_test!9`.
- **Stack:** `e2e/scripts/start-stack.cjs` starts API + Next on **127.0.0.1:3000 / 127.0.0.1:8000**; pass **`DATABASE_URL`** in CI so login works. In `DATABASE_URL`, use **`/keyboard_recommender`** after the port, not **`\`** (Windows); the backend normalizes `:\d+\` to `:\d+/`, but fixing `.env` avoids confusion.
- **Flows:** `e2e/tests/critical-flows.spec.ts` — onboarding link, **preset skip to first unanswered step**, survey → results (preset-seeded helper), save, compare, mypage.
- **Helpers:** `e2e/tests/helpers/survey-flow.ts` — uses creamy_quiet preset then fills remaining step(s); no `mode=quick` path.

## Local commands

```bash
cd backend && pip install -e ".[dev]"
pytest -q tests/recommendation_regression tests/snapshot_testing tests/benchmark_validation
pytest -q tests/contract
pytest -q --ignore=tests/recommendation_regression --ignore=tests/snapshot_testing --ignore=tests/benchmark_validation --ignore=tests/contract
```

```bash
cd frontend && npm ci && npm run test -- --run
```

```bash
# PostgreSQL running + alembic upgrade + seed
cd backend && python -m alembic upgrade head && python scripts/seed_e2e_user.py
cd e2e && npm ci && npx playwright install chromium && npm test
```

## Flake avoidance

- Regression relies on **fixed RNG seed** and **stable survey inputs** — do not introduce wall-clock or network in those tests.
- E2E uses **retries: 1** on CI, **single worker**, and deterministic survey helpers.
- Prefer **structural + banded** assertions (confidence ranges) over exact floats unless covered by snapshot tests.
