"""Resilient degraded fallback when full recommendation compute fails."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from keyboard_recommender.app_factory import create_app
from keyboard_recommender.application import recommendation_service
from keyboard_recommender.config.settings import get_settings
from keyboard_recommender.schemas.recommendation import SurveyAnswersRequest

_VALID_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}


def test_post_compute_rejects_mode_quick() -> None:
    client = TestClient(create_app())
    res = client.post(
        "/api/v1/recommendations/compute",
        json={**_VALID_SURVEY, "mode": "quick"},
    )
    assert res.status_code == 422


def test_post_compute_ignores_mode_full_legacy_field() -> None:
    client = TestClient(create_app())
    res = client.post(
        "/api/v1/recommendations/compute",
        json={**_VALID_SURVEY, "mode": "full"},
    )
    assert res.status_code == 200
    assert res.json().get("runMode", "full") == "full"


def test_full_compute_fallback_returns_degraded_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = {"n": 0}
    original = recommendation_service.build_recommendation_computation

    def flaky_build(*args, **kwargs):  # type: ignore[no-untyped-def]
        calls["n"] += 1
        if calls["n"] == 1:
            raise RuntimeError("simulated full compute failure")
        return original(*args, **kwargs)

    monkeypatch.setattr(recommendation_service, "build_recommendation_computation", flaky_build)

    cfg = get_settings().model_copy(
        update={"enable_resilient_compute_fallback": True, "enable_recommendation_cache": False},
    )
    monkeypatch.setattr(recommendation_service, "get_settings", lambda: cfg)

    body = SurveyAnswersRequest.model_validate(_VALID_SURVEY)
    out = recommendation_service.compute_recommendation(body, settings=cfg, db_session=None)

    assert out.run_mode == "quick"
    assert out.degraded_reason == "full_mode_compute_failed"
    assert out.build.id


def test_full_compute_failure_raises_when_fallback_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*_args, **_kwargs):  # type: ignore[no-untyped-def]
        raise RuntimeError("simulated full compute failure")

    monkeypatch.setattr(recommendation_service, "build_recommendation_computation", boom)

    cfg = get_settings().model_copy(
        update={"enable_resilient_compute_fallback": False, "enable_recommendation_cache": False},
    )
    body = SurveyAnswersRequest.model_validate(_VALID_SURVEY)

    with pytest.raises(RuntimeError, match="simulated full compute failure"):
        recommendation_service.compute_recommendation(body, settings=cfg, db_session=None)


def test_resilient_degraded_flags_use_internal_model_version() -> None:
    flags = recommendation_service._resilient_degraded_flags()
    assert flags.model_version == "resilient_degraded_v1"
    assert flags.enable_reranking is False
    assert flags.enable_fallback is False
