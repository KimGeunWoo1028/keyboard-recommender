"""
Runtime checks for deployment configuration (after :class:`Settings` is loaded).

``local`` / ``development`` keep light rules so day-to-day dev is unchanged.
``staging`` / ``production`` add stricter rules; running under ``pytest`` skips
deployment-only checks so tests can use localhost URLs and production tier together.
"""

from __future__ import annotations

import os

from keyboard_recommender.config.settings import Settings


class ConfigurationError(RuntimeError):
    """Process startup must abort when deployment configuration is invalid."""


def _running_pytest() -> bool:
    return bool(os.environ.get("PYTEST_CURRENT_TEST"))


def _production_issues(settings: Settings) -> list[str]:
    out: list[str] = []
    pfu = (settings.public_frontend_base_url or "").strip()
    if not pfu.lower().startswith("https://"):
        out.append("PUBLIC_FRONTEND_BASE_URL must use https:// in production.")
    for origin in settings.cors_origin_list:
        if not origin.lower().startswith("https://"):
            out.append(f"Every CORS origin must use HTTPS in production (got: {origin}).")
    db_low = settings.database_url.lower()
    if "localhost" in db_low or "127.0.0.1" in db_low:
        out.append("DATABASE_URL must not use localhost / 127.0.0.1 in production.")
    if "keyboard:keyboard@" in db_low:
        out.append("DATABASE_URL must not use default dev database user/password in production.")
    if settings.email_provider == "smtp":
        if not all(
            [
                (settings.smtp_host or "").strip(),
                (settings.smtp_username or "").strip(),
                (settings.smtp_password or "").strip(),
                (settings.smtp_from_email or "").strip(),
            ],
        ):
            out.append(
                "EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL in production.",
            )
    elif settings.email_provider == "resend":
        if not (settings.resend_api_key or "").strip() or not (settings.resend_from_email or "").strip():
            out.append("EMAIL_PROVIDER=resend requires RESEND_API_KEY and RESEND_FROM_EMAIL in production.")
    return out


def _staging_issues(settings: Settings) -> list[str]:
    """Staging: HTTPS for real hostnames; localhost stacks stay allowed."""
    out: list[str] = []
    pfu = (settings.public_frontend_base_url or "").strip()
    pl = pfu.lower()
    if not pfu:
        out.append("PUBLIC_FRONTEND_BASE_URL must be set for staging.")
        return out
    is_local_public = "localhost" in pl or "127.0.0.1" in pl
    if not is_local_public and not pl.startswith("https://"):
        out.append("PUBLIC_FRONTEND_BASE_URL must use https:// for staging unless using localhost / 127.0.0.1.")
    for origin in settings.cors_origin_list:
        ol = origin.lower()
        o_local = "localhost" in ol or "127.0.0.1" in ol
        if not o_local and not ol.startswith("https://"):
            out.append(f"CORS origin must use HTTPS for staging unless localhost (got: {origin}).")
    return out


def validate_environment_configuration(settings: Settings) -> None:
    """
    Fail fast on invalid deployment configuration.

    Called from FastAPI lifespan. Raises :class:`ConfigurationError` with a
    bullet list of problems.
    """
    errors: list[str] = []

    if not settings.cors_origin_list:
        errors.append("CORS_ORIGINS must list at least one origin (comma-separated, non-empty).")

    if settings.app_environment == "production" and not _running_pytest():
        errors.extend(_production_issues(settings))
    elif settings.app_environment == "staging" and not _running_pytest():
        errors.extend(_staging_issues(settings))

    if errors:
        joined = "\n- ".join(errors)
        msg = f"Invalid environment configuration:\n- {joined}"
        raise ConfigurationError(msg)
