"""Explainable recommendation copy + confidence mapping."""

from __future__ import annotations

from keyboard_recommender.trait_engine.catalog_sample import SWITCHES
from keyboard_recommender.trait_engine.explainable import build_explainable_pick, confidence_from_weighted_cosine
from keyboard_recommender.trait_engine.matching import rank_parts
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores
from keyboard_recommender.trait_engine.weights import weights_for_switch


def test_confidence_from_cosine_is_bounded() -> None:
    assert 0.0 <= confidence_from_weighted_cosine(-1.0) <= 1.0
    assert 0.0 <= confidence_from_weighted_cosine(1.0) <= 1.0
    assert confidence_from_weighted_cosine(0.0) == 0.5


def test_explainable_pick_has_summary_and_traits() -> None:
    answers = {
        "sound_profile": "muted",
        "typing_pressure": "light",
        "switch_feel": "linear",
        "bottom_out": "soft",
        "volume": "quiet",
    }
    user = survey_answers_to_trait_scores(answers)
    ranked = rank_parts(user, SWITCHES, weights_for_switch())[0]
    exp = build_explainable_pick(user, ranked.part, weights_for_switch())
    assert ranked.part.name in exp.summary
    assert isinstance(exp.why_traits, tuple)
    assert len(exp.why_traits) >= 1
