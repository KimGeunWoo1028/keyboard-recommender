"""Post catalog_change_alert (and pipeline failure) payloads to an ops webhook.

Secrets stay in env / CI secrets — never commit webhook URLs.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Literal
from urllib.error import URLError
from urllib.request import Request, urlopen

from keyboard_recommender.catalog.catalog_change_alert import format_catalog_change_alert_text

logger = logging.getLogger(__name__)

WebhookFormat = Literal["json", "slack", "discord", "auto"]

ENV_WEBHOOK_URL = "CATALOG_CHANGE_ALERT_WEBHOOK_URL"
ENV_FALLBACK_WEBHOOK_URL = "OPERATIONAL_ALERT_WEBHOOK_URL"


def resolve_catalog_alert_webhook_url(
    explicit: str | None = None,
    *,
    environ: dict[str, str] | None = None,
) -> str | None:
    """Prefer explicit CLI URL, then catalog env, then operational alert env."""
    if explicit and explicit.strip():
        return explicit.strip()
    env = environ if environ is not None else os.environ
    for key in (ENV_WEBHOOK_URL, ENV_FALLBACK_WEBHOOK_URL):
        value = (env.get(key) or "").strip()
        if value:
            return value
    return None


def redact_webhook_url(url: str) -> str:
    """Safe log fragment — host only, no path/query/token."""
    raw = (url or "").strip()
    if not raw:
        return "(empty)"
    try:
        from urllib.parse import urlparse

        parsed = urlparse(raw)
        host = parsed.hostname or "?"
        return f"{parsed.scheme or 'https'}://{host}/…"
    except ValueError:
        return "(unparseable)"


def detect_webhook_format(url: str) -> WebhookFormat:
    lower = (url or "").lower()
    if "hooks.slack.com" in lower or "slack.com/services" in lower:
        return "slack"
    if "discord.com/api/webhooks" in lower or "discordapp.com/api/webhooks" in lower:
        return "discord"
    return "json"


def build_catalog_alert_webhook_body(
    alert: dict[str, Any],
    *,
    webhook_format: WebhookFormat = "auto",
    webhook_url: str | None = None,
) -> dict[str, Any]:
    fmt: WebhookFormat = webhook_format
    if fmt == "auto":
        fmt = detect_webhook_format(webhook_url or "")
    text = format_catalog_change_alert_text(alert)
    if fmt == "slack":
        return {"text": text[:3500]}
    if fmt == "discord":
        return {"content": text[:1900]}
    return {
        "kind": alert.get("kind") or "swagkey_catalog_change_alert",
        "text": text,
        "alert": alert,
    }


def build_pipeline_failure_webhook_body(
    *,
    step: str,
    exit_code: int,
    mode: str,
    detail: str = "",
    webhook_format: WebhookFormat = "auto",
    webhook_url: str | None = None,
) -> dict[str, Any]:
    fmt: WebhookFormat = webhook_format
    if fmt == "auto":
        fmt = detect_webhook_format(webhook_url or "")
    summary = f"Swagkey inventory pipeline FAILED · mode={mode} · step={step} · exit={exit_code}"
    if detail:
        summary = f"{summary}\n{detail}"
    payload = {
        "kind": "swagkey_inventory_pipeline_failure",
        "mode": mode,
        "step": step,
        "exitCode": exit_code,
        "detail": detail,
        "text": summary,
    }
    if fmt == "slack":
        return {"text": summary[:3500]}
    if fmt == "discord":
        return {"content": summary[:1900]}
    return payload


def post_webhook_json(
    webhook_url: str,
    body: dict[str, Any],
    *,
    timeout_seconds: float = 5.0,
    dry_run: bool = False,
) -> dict[str, Any]:
    """
    POST JSON to webhook. Never raises for network errors when dry_run is False —
    returns a result dict. dry_run skips HTTP and returns would_post metadata.
    """
    url = (webhook_url or "").strip()
    if not url:
        return {"ok": False, "skipped": True, "reason": "missing_webhook_url"}
    if dry_run:
        return {
            "ok": True,
            "dryRun": True,
            "webhook": redact_webhook_url(url),
            "bodyKeys": sorted(body.keys()),
        }
    try:
        req = Request(
            url,
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps(body).encode("utf-8"),
        )
        with urlopen(req, timeout=timeout_seconds) as resp:  # nosec B310: operator webhook URL
            status = int(getattr(resp, "status", 200) or 200)
        return {"ok": True, "status": status, "webhook": redact_webhook_url(url)}
    except (URLError, TimeoutError, ValueError, OSError) as exc:
        logger.warning(
            "catalog_alert_webhook_failed",
            extra={"webhook": redact_webhook_url(url), "error": type(exc).__name__},
        )
        return {
            "ok": False,
            "webhook": redact_webhook_url(url),
            "error": type(exc).__name__,
            "message": str(exc)[:200],
        }


def maybe_notify_catalog_alert(
    alert: dict[str, Any],
    *,
    webhook_url: str | None,
    notify_when: Literal["always", "alerts", "never"] = "alerts",
    webhook_format: WebhookFormat = "auto",
    dry_run: bool = False,
) -> dict[str, Any]:
    if notify_when == "never":
        return {"ok": True, "skipped": True, "reason": "notify_when_never"}
    if notify_when == "alerts" and not alert.get("hasBlockingAlerts"):
        return {"ok": True, "skipped": True, "reason": "no_blocking_alerts"}
    url = resolve_catalog_alert_webhook_url(webhook_url)
    if not url:
        return {"ok": True, "skipped": True, "reason": "missing_webhook_url"}
    body = build_catalog_alert_webhook_body(alert, webhook_format=webhook_format, webhook_url=url)
    return post_webhook_json(url, body, dry_run=dry_run)
