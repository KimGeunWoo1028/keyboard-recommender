"""API contract: `POST /recommendations/compute` schema + nested audit structures."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from keyboard_recommender.app_factory import create_app
from keyboard_recommender.schemas.recommendation import (
    CompatibilityAuditResponse,
    RecommendationConfidenceResponse,
    RecommendationPick,
    RecommendationResponse,
)

_VALID_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}

_MINIMAL_BUILD = {
    "id": "test-build",
    "title": "T",
    "tagline": "G",
    "switches": "S",
    "plate": "P",
    "foam": "F",
    "layout": "L",
    "case": "C",
    "keycap": "K",
    "highlights": [],
}


def test_recommendation_response_fills_empty_collections() -> None:
    """Missing list/map fields become empty containers (stable JSON contract)."""
    payload = {
        "answers": _VALID_SURVEY,
        "legacyTraits": {},
        "userVector": {"warm": 0.5, "bright": 0.1, "smooth": 0.2, "tactile": 0.1, "quiet": 0.3, "firm": 0.1},
        "build": {**_MINIMAL_BUILD, "engineScores": None},
        "completedAtIso": "2020-01-01T00:00:00Z",
    }
    out = RecommendationResponse.model_validate(payload)
    assert out.legacy_traits == {}
    assert out.user_trait_scores == {}
    assert out.trait_axes == []
    assert out.recommendations == []
    assert out.match_explanations == []


def test_recommendation_response_syncs_only_match_explanations() -> None:
    one = {
        "domain": "switch",
        "itemId": "sw-1",
        "score": 0.9,
        "explanation": "Because test.",
    }
    payload = {
        "answers": _VALID_SURVEY,
        "legacyTraits": {},
        "userVector": {"warm": 0.5, "bright": 0.1, "smooth": 0.2, "tactile": 0.1, "quiet": 0.3, "firm": 0.1},
        "matchExplanations": [one],
        "build": {**_MINIMAL_BUILD, "engineScores": None},
        "completedAtIso": "2020-01-01T00:00:00Z",
    }
    out = RecommendationResponse.model_validate(payload)
    assert len(out.recommendations) == 1
    assert len(out.match_explanations) == 1
    assert out.recommendations[0].item_id == "sw-1"
    assert out.match_explanations[0].item_id == "sw-1"


def test_recommendation_response_rejects_unknown_top_level_keys() -> None:
    payload = {
        "answers": _VALID_SURVEY,
        "legacyTraits": {},
        "userVector": {"warm": 0.5, "bright": 0.1, "smooth": 0.2, "tactile": 0.1, "quiet": 0.3, "firm": 0.1},
        "build": {**_MINIMAL_BUILD, "engineScores": None},
        "completedAtIso": "2020-01-01T00:00:00Z",
        "futureField": 1,
    }
    with pytest.raises(ValidationError):
        RecommendationResponse.model_validate(payload)


def test_post_compute_returns_stable_json_shape() -> None:
    client = TestClient(create_app())
    res = client.post("/api/v1/recommendations/compute", json=_VALID_SURVEY)
    assert res.status_code == 200
    data = res.json()

    for key in (
        "answers",
        "legacyTraits",
        "userVector",
        "userTraitScores",
        "traitAxes",
        "recommendations",
        "matchExplanations",
        "overallConfidence",
        "build",
        "completedAtIso",
        "nlPreferenceAnalysis",
        "compatibilityAudit",
        "diversityAudit",
        "fallbackAudit",
        "recommendationConfidence",
    ):
        assert key in data, f"missing top-level key: {key}"

    assert isinstance(data["userTraitScores"], dict)
    assert isinstance(data["traitAxes"], list)
    assert isinstance(data["recommendations"], list)
    assert isinstance(data["matchExplanations"], list)
    assert data["recommendations"] == data["matchExplanations"]

    build = data["build"]
    assert isinstance(build.get("highlights"), list)
    assert "engineScores" in build
    assert "sourceUrls" in build
    assert isinstance(build["sourceUrls"], dict)
    for domain in ("switch", "plate", "foam", "layout", "case", "keycap"):
        assert domain in build["sourceUrls"]

    RecommendationResponse.model_validate(data)

    first = data["recommendations"][0]
    assert "summary" in first and isinstance(first["summary"], str)
    assert "whyTraits" in first and isinstance(first["whyTraits"], list)
    assert "tradeOffs" in first and isinstance(first["tradeOffs"], list)
    assert "confidence" in first and isinstance(first["confidence"], (int, float))
    assert "sourceUrl" in first and isinstance(first["sourceUrl"], str)
    assert "imageUrl" in first and isinstance(first["imageUrl"], str)
    assert "explanationDebug" not in first
    RecommendationPick.model_validate(first)

    switch_pick = next(row for row in data["recommendations"] if row["domain"] == "switch")
    if switch_pick.get("alternatives"):
        alt0 = switch_pick["alternatives"][0]
        assert "sourceUrl" in alt0 and isinstance(alt0["sourceUrl"], str)
        assert "imageUrl" in alt0 and isinstance(alt0["imageUrl"], str)
        assert "description" in alt0 and isinstance(alt0["description"], str)

    layout_pick = next(row for row in data["recommendations"] if row["domain"] == "layout")
    assert layout_pick["imageUrl"]
    assert (
        layout_pick["imageUrl"].startswith("/media/swagkey-images/")
        or layout_pick["imageUrl"].startswith("https://cdn.imweb.me/thumbnail/")
        or layout_pick["imageUrl"].startswith("/layout-diagrams/")
    )

    nla = data["nlPreferenceAnalysis"]
    assert isinstance(nla, dict)
    assert nla.get("applied") is False

    CompatibilityAuditResponse.model_validate(data["compatibilityAudit"])
    RecommendationConfidenceResponse.model_validate(data["recommendationConfidence"])


def test_post_compute_natural_language_changes_trait_vector() -> None:
    """Optional `naturalLanguage` is blended into `userTraitScores` (same axes as survey)."""
    client = TestClient(create_app())
    base = client.post("/api/v1/recommendations/compute", json=_VALID_SURVEY)
    assert base.status_code == 200
    with_nl = client.post(
        "/api/v1/recommendations/compute",
        json={
            **_VALID_SURVEY,
            "naturalLanguage": "creamy deep thocky not too muted",
        },
    )
    assert with_nl.status_code == 200
    b = base.json()["userTraitScores"]
    w = with_nl.json()["userTraitScores"]
    nla = with_nl.json()["nlPreferenceAnalysis"]
    assert nla["applied"] is True
    assert nla["parsingConfidence"] > 0
    assert "creamy" in nla["matchedTermIds"] or "thocky" in nla["matchedTermIds"]
    assert b != w


def test_post_compute_run_mode_and_degraded_reason_contract() -> None:
    """Happy path returns runMode=full; degradedReason absent unless fallback fired."""
    client = TestClient(create_app())
    res = client.post("/api/v1/recommendations/compute", json=_VALID_SURVEY)
    assert res.status_code == 200
    data = res.json()
    assert data.get("runMode", "full") == "full"
    assert data.get("degradedReason") in (None, "")