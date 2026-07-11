"""Central logging policy: quieter production defaults, optional redaction helpers."""

from __future__ import annotations

import logging
from typing import Any

from keyboard_recommender.config.settings import Settings

_SENSITIVE_KEY_FRAGMENTS: tuple[str, ...] = (
    "password",
    "secret",
    "token",
    "authorization",
    "cookie",
    "set-cookie",
    "api_key",
    "apikey",
)


def redact_log_extra(extra: dict[str, Any] | None) -> dict[str, Any]:
    """
    Copy ``extra`` for ``Logger.*(..., extra=…)`` with obvious secret-like keys redacted.

    Safe to call on every log line; does not mutate the input dict.
    """
    if not extra:
        return {}
    out: dict[str, Any] = {}
    for key, value in extra.items():
        lk = str(key).lower().replace("-", "_")
        if any(frag in lk for frag in _SENSITIVE_KEY_FRAGMENTS):
            out[key] = "[REDACTED]"
        else:
            out[key] = value
    return out


def apply_runtime_log_policy(settings: Settings) -> None:
    """
    Apply process-wide log levels for production-like environments.

    Never raises: misconfiguration here must not prevent the app from starting.
    """
    try:
        if settings.app_environment != "production":
            return
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        # Keep app errors visible; reduce noisy access logs that may carry query strings.
        pkg = logging.getLogger("keyboard_recommender")
        if pkg.level == logging.NOTSET:
            pkg.setLevel(logging.INFO)
    except Exception:
        # Swallow — safety helpers must not break ASGI lifespan.
        logging.getLogger(__name__).exception("apply_runtime_log_policy_failed")
