"""Terminology lexicon validation + interpreter behaviour."""

from __future__ import annotations

from fastapi.testclient import TestClient

from keyboard_recommender.app_factory import create_app
from keyboard_recommender.terminology.dictionary import COMMUNITY_TERMS
from keyboard_recommender.terminology.engine import interpret_community_text, merge_with_survey_traits
from keyboard_recommender.terminology.negation import polarity_multiplier
from keyboard_recommender.terminology.validation import validate_dictionary
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores


def test_default_lexicon_validates() -> None:
    issues = validate_dictionary(COMMUNITY_TERMS)
    assert issues == [], issues


def test_interpret_hits_multiple_terms() -> None:
    r = interpret_community_text("I love thocky marbly linears", COMMUNITY_TERMS)
    ids = {m.term_id for m in r.matches}
    assert "thocky" in ids
    assert "marbly" in ids
    assert r.trait_vector["deep_sound"] > 0
    assert r.trait_vector["marbly"] > 0


def test_deep_and_creamy_register_without_unknown_deep() -> None:
    r = interpret_community_text("I want deep creamy", COMMUNITY_TERMS)
    ids = {m.term_id for m in r.matches}
    assert "sound_deep" in ids
    assert "creamy" in ids
    assert "deep" not in r.unknown_tokens
    assert r.trait_vector["deep_sound"] > 0


def test_interpret_clacky_muted_emits_conflict_or_strong_vector() -> None:
    """Community language often pulls opposite axes; engine should surface a conflict when both bite."""
    r = interpret_community_text("clacky but muted", COMMUNITY_TERMS)
    assert len(r.matches) >= 2
    # Either explicit conflict row or at least both terms registered on overlapping axes.
    if not r.conflicts:
        assert r.trait_vector["high_pitch"] != 0.0 and r.trait_vector["muted"] != 0.0
    else:
        axes = {c.axis for c in r.conflicts}
        assert axes  # non-empty


def test_merge_with_survey_traits_shape() -> None:
    survey = survey_answers_to_trait_scores(
        {
            "sound_profile": "balanced",
            "typing_pressure": "medium",
            "switch_feel": "linear",
            "bottom_out": "medium",
            "volume": "moderate",
        },
    )
    nl = interpret_community_text("creamy foamy", COMMUNITY_TERMS).trait_vector
    merged = merge_with_survey_traits(nl, survey, nl_weight=0.3)
    assert set(merged.keys()) == set(survey.keys())
    assert all(isinstance(v, float) for v in merged.values())


def test_not_too_muted_softens_muted_vector() -> None:
    """``not too`` + term uses attenuated polarity vs bare ``muted``."""
    plain = interpret_community_text("muted creamy", COMMUNITY_TERMS)
    softened = interpret_community_text("not too muted creamy", COMMUNITY_TERMS)
    assert abs(softened.trait_vector["muted"]) < abs(plain.trait_vector["muted"])


def test_polarity_multiplier_not_too() -> None:
    toks = "i want not too muted sound".split()
    idx = toks.index("muted")
    assert polarity_multiplier(toks, idx) == 0.42


def test_post_interpret_api_contract() -> None:
    client = TestClient(create_app())
    res = client.post(
        "/api/v1/terminology/interpret",
        json={"text": "thocky creamy muted"},
    )
    assert res.status_code == 200
    data = res.json()
    for key in (
        "normalizedText",
        "traitVector",
        "matches",
        "conflicts",
        "unknownTokens",
        "warnings",
        "parsingConfidence",
    ):
        assert key in data
    assert isinstance(data["traitVector"], dict)
    assert isinstance(data["matches"], list)
    assert isinstance(data["conflicts"], list)
    assert isinstance(data["unknownTokens"], list)
    assert isinstance(data["warnings"], list)
