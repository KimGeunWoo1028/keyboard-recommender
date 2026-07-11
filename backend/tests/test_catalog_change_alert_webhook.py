"""Unit tests for catalog change alert webhook helpers (Phase F)."""

from __future__ import annotations

from keyboard_recommender.catalog.catalog_change_alert_webhook import (
    build_catalog_alert_webhook_body,
    build_pipeline_failure_webhook_body,
    detect_webhook_format,
    maybe_notify_catalog_alert,
    post_webhook_json,
    redact_webhook_url,
    resolve_catalog_alert_webhook_url,
)


def test_resolve_prefers_explicit_then_catalog_env() -> None:
    assert resolve_catalog_alert_webhook_url(" https://hooks.example/a ") == "https://hooks.example/a"
    assert (
        resolve_catalog_alert_webhook_url(
            None,
            environ={"CATALOG_CHANGE_ALERT_WEBHOOK_URL": "https://hooks.example/catalog"},
        )
        == "https://hooks.example/catalog"
    )
    assert (
        resolve_catalog_alert_webhook_url(
            None,
            environ={"OPERATIONAL_ALERT_WEBHOOK_URL": "https://hooks.example/ops"},
        )
        == "https://hooks.example/ops"
    )
    assert resolve_catalog_alert_webhook_url(None, environ={}) is None


def test_redact_webhook_url_hides_path_and_token() -> None:
    redacted = redact_webhook_url("https://hooks.slack.com/services/T00/B00/secret-token")
    assert "hooks.slack.com" in redacted
    assert "secret-token" not in redacted
    assert "T00" not in redacted


def test_detect_webhook_format() -> None:
    assert detect_webhook_format("https://hooks.slack.com/services/T/B/X") == "slack"
    assert detect_webhook_format("https://discord.com/api/webhooks/1/abc") == "discord"
    assert detect_webhook_format("https://example.com/hook") == "json"


def test_build_bodies_by_format() -> None:
    alert = {
        "kind": "swagkey_catalog_change_alert",
        "hasAlerts": True,
        "generatedAt": "2026-07-10T00:00:00+00:00",
        "counts": {
            "matched": 1,
            "newInCrawl": 1,
            "possiblyDiscontinued": 0,
            "nameChanged": 0,
            "alertTotal": 1,
        },
        "newInCrawl": [],
        "possiblyDiscontinued": [],
        "nameChanged": [],
        "notes": [],
    }
    slack = build_catalog_alert_webhook_body(alert, webhook_format="slack")
    assert "text" in slack and "alert" not in slack
    discord = build_catalog_alert_webhook_body(alert, webhook_format="discord")
    assert "content" in discord
    raw = build_catalog_alert_webhook_body(alert, webhook_format="json")
    assert raw["alert"]["hasAlerts"] is True

    fail = build_pipeline_failure_webhook_body(
        step="crawl_urls",
        exit_code=1,
        mode="live",
        webhook_format="json",
    )
    assert fail["kind"] == "swagkey_inventory_pipeline_failure"
    assert fail["step"] == "crawl_urls"


def test_maybe_notify_skips_without_blocking_alerts_and_dry_run() -> None:
    alert_ok = {
        "hasAlerts": True,
        "hasBlockingAlerts": False,
        "kind": "swagkey_catalog_change_alert",
        "counts": {"informationalTotal": 1},
        "notes": [],
    }
    skipped = maybe_notify_catalog_alert(
        alert_ok,
        webhook_url="https://example.com/hook",
        notify_when="alerts",
        dry_run=True,
    )
    assert skipped.get("skipped") is True
    assert skipped.get("reason") == "no_blocking_alerts"

    alert_hit = {
        "hasAlerts": True,
        "hasBlockingAlerts": True,
        "kind": "swagkey_catalog_change_alert",
        "generatedAt": "2026-07-10T00:00:00+00:00",
        "counts": {
            "matched": 0,
            "newInCrawl": 0,
            "possiblyDiscontinued": 1,
            "nameChanged": 0,
            "blockingAlertTotal": 1,
            "alertTotal": 1,
        },
        "newInCrawl": [],
        "possiblyDiscontinued": [],
        "nameChanged": [],
        "notes": [],
    }
    dry = maybe_notify_catalog_alert(
        alert_hit,
        webhook_url="https://example.com/hook",
        notify_when="alerts",
        dry_run=True,
    )
    assert dry.get("ok") is True
    assert dry.get("dryRun") is True
    assert "secret" not in str(dry)


def test_post_webhook_json_dry_run_and_missing() -> None:
    assert post_webhook_json("", {"a": 1})["skipped"] is True
    dry = post_webhook_json("https://example.com/h", {"a": 1}, dry_run=True)
    assert dry["dryRun"] is True
    assert dry["ok"] is True
