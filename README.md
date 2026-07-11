# keyboard-recommender

Monorepo for a custom keyboard recommendation web service.

- **frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **backend**: FastAPI + SQLAlchemy + PostgreSQL

## Quick onboarding

- Environment and secrets: [`docs/env-configuration.md`](docs/env-configuration.md)
- Start here: `backend/README.md`
- Architecture guide: `backend/docs/architecture-guide.md`
- Developer guide: `backend/docs/developer-guide.md`
- Debug guide: `backend/docs/debug-guide.md`
- Operational runbook: `backend/docs/runbook.md`

### Backend tests

From the repo root, `pytest` uses `pytest.ini` so `backend/tests` runs with `backend/src` on the path. For the most reliable setup (matches CI), use an editable install from `backend/` — see **Dev dependencies & tests** in `backend/README.md`.
