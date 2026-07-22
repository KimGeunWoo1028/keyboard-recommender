from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.schemas.recommendation import RecommendationResponse
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_computation
from keyboard_recommender.trait_engine.catalog_sample import SWITCHES
from keyboard_recommender.trait_engine.explainable import build_explainable_pick
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores
from keyboard_recommender.trait_engine.weights import weights_for_switch

_SNAPSHOT_PATH = Path(__file__).parent / "snapshot_testing" / "snapshots" / "explanation_grounding.snapshot.json"

_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}


def _sample_switch():
    for part in SWITCHES:
        if part.id == "sw-linear-001":
            return part
    return SWITCHES[0]


def test_explanation_grounding_snapshot() -> None:
    user = survey_answers_to_trait_scores(_SURVEY)
    part = _sample_switch()
    exp = build_explainable_pick(user, part, weights_for_switch())
    actual = {
        "itemId": part.id,
        "summary": exp.summary,
        "whyTraits": list(exp.why_traits),
        "tradeOffs": list(exp.trade_offs),
        "sources": list(exp.sources),
    }
    expected = json.loads(_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    assert actual == expected


def test_explanation_is_consistent_for_same_inputs() -> None:
    user = survey_answers_to_trait_scores(_SURVEY)
    part = _sample_switch()
    first = build_explainable_pick(user, part, weights_for_switch())
    second = build_explainable_pick(user, part, weights_for_switch())
    assert first.summary == second.summary
    assert first.why_traits == second.why_traits
    assert first.trade_offs == second.trade_offs


def test_debug_trace_includes_metadata_and_trait_evidence() -> None:
    payload, _engine, _user, _answers = build_recommendation_computation(
        dict(_SURVEY),
        app_settings=Settings(app_environment="local", debug=True),
        include_explanation_debug=True,
    )
    recs = payload["recommendations"]
    assert recs and isinstance(recs, list)
    first = recs[0]
    assert "explanationDebug" in first
    dbg = first["explanationDebug"]
    assert isinstance(dbg.get("sources"), list)
    assert isinstance(dbg.get("strongestTraits"), list)
    assert "metadataFields" in dbg
    model = RecommendationResponse.model_validate(payload)
    dumped = model.model_dump(by_alias=True)
    first_serialized = dumped["recommendations"][0]
    assert "explanationDebug" in first_serialized


def test_explanation_sources_cover_tradeoff_and_compatibility() -> None:
    user = survey_answers_to_trait_scores(_SURVEY)
    winner = _sample_switch()
    alternative = SWITCHES[1] if len(SWITCHES) > 1 else winner
    exp = build_explainable_pick(
        user,
        winner,
        weights_for_switch(),
        compatibility_lines=("switch-plate stiffness mismatch penalty applied",),
        alternative_part=alternative,
    )
    assert "metadata-derived" in exp.sources or "trait-alignment" in exp.sources
    assert "compatibility-reasoning" in exp.sources
    assert "trade-off-reasoning" in exp.sources


def test_debug_trace_is_hidden_without_header_gate_flag() -> None:
    payload, _engine, _user, _answers = build_recommendation_computation(
        dict(_SURVEY),
        app_settings=Settings(app_environment="local", debug=True),
        include_explanation_debug=False,
    )
    model = RecommendationResponse.model_validate(payload)
    dumped = model.model_dump(by_alias=True)
    first_serialized = dumped["recommendations"][0]
    assert "explanationDebug" not in first_serialized

