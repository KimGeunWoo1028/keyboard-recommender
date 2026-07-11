# Environment configuration and secrets

This document describes how **Keyboard Recommender** splits configuration by tier, where secrets live, and what happens at **API startup**.

## Tier model (`APP_ENV` / `APP_ENVIRONMENT`)

| Tier | Typical use | Backend cookie `Secure` default | Startup checks |
|------|-------------|-----------------------------------|----------------|
| `local` / `development` | Laptop / Docker | `false` (HTTP dev) | Light: non-empty `CORS_ORIGINS` list |
| `staging` | Pre-prod | `true` if `AUTH_COOKIE_SECURE` unset | HTTPS for non-localhost URLs |
| `production` | Live | `true` if unset | HTTPS, remote DB, mail credentials |

Values are case-insensitive when read from the environment.

## Files (never commit secrets)

| File | Loaded by | Committed? |
|------|-----------|------------|
| `backend/.env` | FastAPI / Alembic (`Settings`) | **No** — gitignored |
| `frontend/.env.local` | Next.js dev & build | **No** — gitignored |
| `backend/.env.example` | — | Yes — templates only |
| `frontend/.env.example` | — | Yes |

Copy the `*.example` files, fill in real values locally, and inject production values via your host’s secret store (GitHub Actions secrets, Doppler, Vault, K8s secrets, etc.).

### `.gitignore` expectations

Repo root ignores `.env`, `.env.local`, and `backend/.env` is also listed under `backend/.gitignore`. If you add new secret files (e.g. `.env.production.local`), add them to `.gitignore` before committing.

## Backend: required and validated variables

`Settings` (Pydantic) loads `backend/.env`. On **application startup**, `validate_environment_configuration()` runs (see `keyboard_recommender/config/env_validation.py`).

**Always:**

- `CORS_ORIGINS` — comma-separated list; must include at least one origin (e.g. `http://localhost:3000` for local Next).

**Production only** (skipped when tests run under `pytest`, so CI can use localhost fixtures):

- `PUBLIC_FRONTEND_BASE_URL` — must start with `https://`.
- Every `CORS_ORIGINS` entry — must start with `https://`.
- `DATABASE_URL` — must not use `localhost`, `127.0.0.1`, or the default dev user/password `keyboard:keyboard`.
- Mail: if `EMAIL_PROVIDER=smtp`, set `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`. If `resend`, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

**Staging only** (also skipped under `pytest`):

- For non-localhost hosts, `PUBLIC_FRONTEND_BASE_URL` and each `CORS_ORIGINS` entry must use `https://`. Localhost stacks may stay on `http://`.

If validation fails, the process exits with `ConfigurationError` and a bullet list of fixes.

## Frontend: public vs server-only

Next.js inlines **only** variables whose names start with **`NEXT_PUBLIC_`** into the browser bundle. Treat every `NEXT_PUBLIC_*` value as **world-readable**.

| Variable | Scope | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_API_URL` | Browser | API origin (use `https://` in production). |
| `NEXT_PUBLIC_INTERNAL_DEBUG` | Browser | Feature flag only; **no secrets**. |
| `INTERNAL_DEBUG_TOKEN` | **Server only** | Read in `src/lib/debug-api-server.ts` (`import "server-only"`). Never prefix with `NEXT_PUBLIC_`. |
| `INTERNAL_API_PROXY_TARGET` | Server (Next) | Optional rewrite target for dev. |

Do **not** put database URLs, SMTP passwords, or internal API tokens in `NEXT_PUBLIC_*`.

## Example matrix (concise)

**Local**

- Backend: `APP_ENV=development`, `DATABASE_URL` → local Postgres, `CORS_ORIGINS=http://localhost:3000`, `AUTH_COOKIE_SECURE=false` on HTTP.
- Frontend: `NEXT_PUBLIC_API_URL=http://localhost:8010` (match your uvicorn port).

**Staging**

- Backend: `APP_ENV=staging`, HTTPS `PUBLIC_FRONTEND_BASE_URL`, HTTPS `CORS_ORIGINS`, real `DATABASE_URL`, mail as needed.
- Frontend: `NEXT_PUBLIC_API_URL=https://api.staging.example.com` (example).

**Production**

- Backend: `APP_ENV=production`, strong DB credentials, full mail config, `AUTH_COOKIE_SECURE=true` (enforced by settings if unset).

## Related

- HTTPS / cookies: [production-https.md](./production-https.md)
- Backend onboarding: [../backend/docs/developer-guide.md](../backend/docs/developer-guide.md)
