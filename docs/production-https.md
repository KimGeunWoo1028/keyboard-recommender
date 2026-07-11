# Production HTTPS, cookies, and CORS

This document describes how to deploy Keyboard Recommender over HTTPS without mixed content, with production-grade session cookies, while keeping local HTTP development working.

## TLS termination

- Terminate TLS at your edge (load balancer, reverse proxy, or platform ingress) so browsers talk **HTTPS** to both the Next.js frontend and the FastAPI API (or to a single host that proxies to both).
- The app does not need to terminate TLS inside Uvicorn if the proxy forwards `X-Forwarded-Proto: https` and you trust the chain; cookies are still **Secure** when `AUTH_COOKIE_SECURE=true`.

## Mixed content

- If the site is served at `https://`, every browser request that `fetch(..., credentials: "include")` makes must target **HTTPS** (or the same origin with a path-based proxy). An `http://` API URL from the page causes mixed content blocking or silent failures.
- Set **`NEXT_PUBLIC_API_URL`** to an `https://` API origin in staging/production (see `frontend/.env.example`).
- The frontend logs a **console warning** if the document is HTTPS and `NEXT_PUBLIC_API_URL` is HTTP.
- **CORS**: `CORS_ORIGINS` on the API must list the exact HTTPS origins of the SPA (scheme + host + port). Wildcards do not work with credentialed requests.

## Session cookie (`kr_session`)

| Setting | Role |
|---------|------|
| `AUTH_COOKIE_SECURE` | **`Secure` attribute** — send cookie only over HTTPS. Defaults to **true** when `APP_ENV` / `APP_ENVIRONMENT` is `staging` or `production` and this variable is **unset**. Still **false** by default for `local` / `development`. |
| `AUTH_COOKIE_SAMESITE` | **`SameSite`**: `lax` (default), `strict`, or `none`. Use **`none` only** when the SPA and API are on **different sites** (e.g. `app.example.com` and `api.other.com`); **`none` requires `AUTH_COOKIE_SECURE=true`** or browsers drop the cookie. For same registrable domain with subdomains, **`lax` plus optional `AUTH_COOKIE_DOMAIN`** is often enough. |
| `AUTH_COOKIE_DOMAIN` | Optional **`Domain`** attribute (e.g. `.example.com`) so one cookie is visible to `app.example.com` and `api.example.com`. Omit for **host-only** cookies (typical when frontend and API share one host via proxy). |
| HttpOnly | Always **on** for `kr_session` (not readable from JavaScript). |

**Logout** clears the cookie using the same path, domain, secure, httponly, and samesite values as login, so removal works in production.

### Environment matrix

| Tier | Typical `AUTH_COOKIE_SECURE` | Typical `AUTH_COOKIE_SAMESITE` | Notes |
|------|------------------------------|--------------------------------|-------|
| `APP_ENV=local` / `development` | `false` | `lax` | Plain `http://localhost` dev servers. |
| `staging` | `true` (default if unset) | `lax` or `none` | Match your real topology; use `none` only for cross-site API + HTTPS. |
| `production` | **`true` required** | `lax`, `strict`, or `none` | Settings validation **fails** if `production` and `AUTH_COOKIE_SECURE` is false. |

If you run `APP_ENV=production` on a lab host over HTTP (not recommended), you must still set **`AUTH_COOKIE_SECURE=true`**; use `staging` or `development` with an explicit `AUTH_COOKIE_SECURE=false` for deliberate HTTP labs.

## Cross-origin session behavior

- **Same origin** (recommended): one public HTTPS host; Next.js or nginx proxies `/api` to FastAPI. Cookie is host-only; `SameSite=Lax` is fine.
- **Subdomains** (`app` + `api` under `example.com`): set **`AUTH_COOKIE_DOMAIN=.example.com`**, HTTPS on both, **`AUTH_COOKIE_SECURE=true`**, `CORS_ORIGINS=https://app.example.com`, and keep **`SameSite=Lax`** unless you rely on cross-site embedding (then consider `none`).
- **Different registrable domains**: `SameSite=None` + `Secure` + precise CORS; confirm login flows with manual QA (Safari ITP / mobile WebView quirks).

## Example reverse proxy (nginx sketch)

Terminate TLS at the edge; forward HTTP to app containers. Trust `X-Forwarded-Proto`.

```nginx
# TLS terminating at nginx; Next.js on 3000, FastAPI on 8010 (or path-proxy only /api).
server {
  listen 443 ssl http2;
  server_name app.example.com;

  # ssl_certificate / ssl_certificate_key ...

  location /api/ {
    proxy_pass http://127.0.0.1:8010/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

Caddy equivalent idea: `reverse_proxy` with `header_up X-Forwarded-Proto {scheme}`. Prefer **one public HTTPS host** + path proxy for `/api` to keep cookies host-only and `SameSite=Lax`.

## Required production / staging env (HTTPS)

| Variable | Production expectation |
|----------|------------------------|
| `APP_ENV` | `production` (or `staging`) |
| `PUBLIC_FRONTEND_BASE_URL` | `https://…` SPA origin |
| `CORS_ORIGINS` | Exact HTTPS SPA origin(s), comma-separated |
| `NEXT_PUBLIC_API_URL` | `https://…` API origin (or same-origin `/api` via proxy) |
| `AUTH_COOKIE_SECURE` | `true` (required when `APP_ENV=production`) |
| `AUTH_COOKIE_SAMESITE` | `lax` (same site) or `none` only with Secure + cross-site topology |
| `AUTH_COOKIE_DOMAIN` | Optional `.example.com` for subdomain sharing |
| `DATABASE_URL` | Non-localhost, non-default-dev credentials in production |

Startup validation: `backend/src/keyboard_recommender/config/env_validation.py`  
Frontend mixed-content warning: `frontend/src/lib/api/client.ts`

### Offline config check (CI / pre-deploy)

```bash
# Example production-shaped env (adjust secrets offline — does not call the network)
export APP_ENV=production
export AUTH_COOKIE_SECURE=true
export PUBLIC_FRONTEND_BASE_URL=https://app.example.com
export CORS_ORIGINS=https://app.example.com
export DATABASE_URL=postgresql+psycopg://app_user:secret@db.internal:5432/keyboard
export EMAIL_PROVIDER=resend
export RESEND_API_KEY=re_test_placeholder
export RESEND_FROM_EMAIL=noreply@example.com
cd backend
python scripts/check_production_https_config.py --require-production
```

Expect: `OK: environment configuration valid …`

## Deploy / browser verification commands

After TLS is live:

```bash
curl -sSI "https://app.example.com/" | head
curl -sS "https://app.example.com/api/v1/health"   # or https://api.example.com/health
```

Login cookie (look for `Secure` and correct `SameSite`):

```bash
curl -sSI -X POST "https://api.example.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}' | tr -d '\r' | grep -i set-cookie
```

Browser: open HTTPS site → DevTools console has **no mixed content** warnings for API calls; Application → Cookies shows `kr_session` with **Secure**.

## Failure matrix

| Symptom | Likely cause |
|---------|----------------|
| Console mixed content / blocked fetch | `NEXT_PUBLIC_API_URL` is `http://` on an `https://` page |
| Cookie missing after login | `SameSite=None` without `Secure`, or wrong `Domain` |
| CORS error on credentialed fetch | `CORS_ORIGINS` missing exact SPA origin |
| Startup abort in production | `env_validation` — localhost DB / HTTP public URL / insecure cookies |
| Login works on HTTP lab but not HTTPS | Edge not forwarding `X-Forwarded-Proto`, or cookie Secure mismatch |

## Validation checklist

Use this after each deployment or cookie-flag change:

1. **Offline** — `check_production_https_config.py` passes for the target env file.
2. **TLS / health** — `curl -I` HTTPS and `/health` succeed.
3. **Login persistence** — Sign in, hard refresh, confirm `/auth/me` (or the app shell) stays authenticated; `Set-Cookie` includes `Secure`.
4. **Logout** — Call logout; confirm cookie disappears (Application → Cookies in devtools) and `/auth/me` returns 401.
5. **Cross-origin** — If API is a different origin than the SPA, verify a credentialed `fetch` succeeds and `Set-Cookie` appears on login responses (no CORS errors).
6. **Mixed content** — HTTPS page never calls HTTP API.
7. **Mobile** — Smoke-test Safari iOS and Chrome Android: login, background tab, return, logout.

## Related files

- Backend settings: `backend/src/keyboard_recommender/config/settings.py`
- Env validation: `backend/src/keyboard_recommender/config/env_validation.py`
- Offline check: `backend/scripts/check_production_https_config.py`
- Cookie set/clear: `backend/src/keyboard_recommender/api/v1/auth.py`
- Frontend API base URL warning: `frontend/src/lib/api/client.ts`
- Examples: `backend/.env.example`, `frontend/.env.example`
- Env / secrets overview: [env-configuration.md](./env-configuration.md)
