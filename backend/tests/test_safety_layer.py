"""Production safety: settings coercion, debug middleware, log redaction helpers."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from keyboard_recommender.api.deps import get_settings_dep
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.safety.log_policy import redact_log_extra


def _settings_no_dotenv(monkeypatch: pytest.MonkeyPatch, **kwargs: object) -> Settings:
    """Avoid ``backend/.env`` (often ``APP_ENV=local``) overriding explicit production tests."""
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("APP_ENVIRONMENT", raising=False)
    merged: dict[str, object] = {
        "database_url": "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
        "_env_file": None,
    }
    merged.update(kwargs)
    return Settings(**merged)  # type: ignore[arg-type]


def test_production_coerces_unsafe_flags_off(monkeypatch: pytest.MonkeyPatch) -> None:
    s = _settings_no_dotenv(
        monkeypatch,
        app_environment="production",
        internal_debug_api_enabled=True,
        debug=True,
        evaluation_persistence_force_failure=True,
    )
    assert s.internal_debug_api_enabled is False
    assert s.debug is False
    assert s.evaluation_persistence_force_failure is False


def test_production_debug_http_is_blocked(monkeypatch: pytest.MonkeyPatch) -> None:
    s = _settings_no_dotenv(
        monkeypatch,
        app_environment="production",
        internal_debug_api_enabled=True,
        internal_debug_token="should-not-matter",
        debug=True,
    )
    app = create_app(settings=s)
    app.dependency_overrides[get_settings_dep] = lambda: s
    client = TestClient(app)
    r = client.get("/api/v1/debug", headers={"X-Internal-Debug-Token": "should-not-matter"})
    assert r.status_code == 404


def test_redact_log_extra_masks_secrets() -> None:
    out = redact_log_extra({"request_id": "abc", "api_token": "secret", "nested": 1})
    assert out["request_id"] == "abc"
    assert out["api_token"] == "[REDACTED]"
    assert out["nested"] == 1
