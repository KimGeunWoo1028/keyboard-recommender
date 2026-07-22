"""Internal gated ``/api/v1/debug/*`` HTTP API."""

from __future__ import annotations

import importlib

import pytest
from fastapi.testclient import TestClient

from keyboard_recommender.api.deps import get_settings_dep
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings

_VALID_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}

_PG = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"


def _client_with_settings(s: Settings) -> TestClient:
    app = create_app(settings=s)
    app.dependency_overrides[get_settings_dep] = lambda: s
    return TestClient(app)


def _debug_settings(**kwargs: object) -> Settings:
    """Build Settings for debug API tests; always pin local tier (deploy-shaped .env safe)."""
    return Settings(database_url=_PG, app_environment="local", **kwargs)  # type: ignore[arg-type]


def test_debug_inspect_disabled_returns_404() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=False,
        debug=True,
    )
    client = _client_with_settings(s)
    r = client.post("/api/v1/debug/recommendations/inspect", json=_VALID_SURVEY)
    assert r.status_code == 404


def test_debug_inspect_enabled_without_token_requires_debug_mode() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        internal_debug_token=None,
        debug=False,
    )
    client = _client_with_settings(s)
    r = client.post("/api/v1/debug/recommendations/inspect", json=_VALID_SURVEY)
    assert r.status_code == 404


def test_debug_inspect_ok_when_debug_and_flag() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        internal_debug_token=None,
        debug=True,
    )
    client = _client_with_settings(s)
    r = client.post("/api/v1/debug/recommendations/inspect", json=_VALID_SURVEY)
    assert r.status_code == 200
    data = r.json()
    assert data.get("schemaVersion") == "debug.replay_bundle.v1"
    assert "pipelineTrace" in data
    assert "completedAtIso" not in data.get("apiPayload", {})


def test_debug_inspect_requires_token_when_configured() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        internal_debug_token="unit-test-secret-debug-token",
        debug=False,
    )
    client = _client_with_settings(s)
    r = client.post("/api/v1/debug/recommendations/inspect", json=_VALID_SURVEY)
    assert r.status_code == 401
    r2 = client.post(
        "/api/v1/debug/recommendations/inspect",
        json=_VALID_SURVEY,
        headers={"X-Internal-Debug-Token": "unit-test-secret-debug-token"},
    )
    assert r2.status_code == 200


def test_debug_compare_surveys_returns_benchmark() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        debug=True,
    )
    client = _client_with_settings(s)
    body = {"baseline": _VALID_SURVEY, "treatment": {**_VALID_SURVEY, "sound_profile": "thocky"}}
    r = client.post("/api/v1/debug/recommendations/compare-surveys", json=body)
    assert r.status_code == 200
    out = r.json()
    assert out["schemaVersion"] == "debug.compare_surveys.v1"
    assert "benchmarkReport" in out


def test_debug_analyze_snapshot() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        debug=True,
    )
    client = _client_with_settings(s)
    insp = client.post("/api/v1/debug/recommendations/inspect", json=_VALID_SURVEY).json()
    snap = insp["snapshot"]
    r = client.post("/api/v1/debug/snapshots/analyze", json={"snapshot": snap})
    assert r.status_code == 200
    assert r.json()["schemaVersion"] == "debug.snapshot_analyze.v1"
    assert "metrics" in r.json()


def test_debug_compare_snapshots() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        debug=True,
    )
    client = _client_with_settings(s)
    a = client.post("/api/v1/debug/recommendations/inspect", json=_VALID_SURVEY).json()["snapshot"]
    b = client.post(
        "/api/v1/debug/recommendations/inspect",
        json={**_VALID_SURVEY, "sound_profile": "bright"},
    ).json()["snapshot"]
    r = client.post(
        "/api/v1/debug/benchmarks/compare-snapshots",
        json={"baseline_snapshot": a, "treatment_snapshot": b},
    )
    assert r.status_code == 200
    assert r.json()["benchmarkReport"]["schemaVersion"] == "evaluation.benchmark_report.v1"


def test_debug_drift_summary(monkeypatch: pytest.MonkeyPatch) -> None:
    def _fake_bundle(_session: object, *, scenario_id: str | None, window: int) -> dict[str, object]:
        return {
            "schemaVersion": "evaluation.drift_bundle.v1",
            "status": "ok",
            "scenarioId": scenario_id or "all_scenarios",
            "window": window,
            "summaryLines": ["test drift line"],
        }

    # ``debug/__init__.py`` exposes ``router`` (APIRouter), so the dotted string
    # ``keyboard_recommender.api.v1.debug.router`` resolves to that object, not
    # the ``router.py`` module. Patch the submodule loaded from ``router.py``.
    dbg_router_mod = importlib.import_module("keyboard_recommender.api.v1.debug.router")
    monkeypatch.setattr(dbg_router_mod, "build_operational_drift_bundle", _fake_bundle)
    s = _debug_settings(
        internal_debug_api_enabled=True,
        debug=True,
    )
    client = _client_with_settings(s)
    r = client.get("/api/v1/debug/drift/summary", params={"window": 32})
    assert r.status_code == 200
    data = r.json()
    assert data["schemaVersion"] == "evaluation.drift_bundle.v1"
    assert data["summaryLines"] == ["test drift line"]


def test_debug_index() -> None:
    s = _debug_settings(
        internal_debug_api_enabled=True,
        debug=True,
    )
    client = _client_with_settings(s)
    assert client.get("/api/v1/debug").status_code == 200
