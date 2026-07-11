"""Sample regression: weighted cosine + survey → stable top pick."""

from __future__ import annotations

from keyboard_recommender.trait_engine.matching import rank_parts
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores
from keyboard_recommender.trait_engine.catalog_sample import SWITCHES
from keyboard_recommender.trait_engine.weights import weights_for_switch


def test_weighted_cosine_prefers_silent_for_quiet_linear_soft() -> None:
    answers = {
        "sound_profile": "muted",
        "typing_pressure": "light",
        "switch_feel": "linear",
        "bottom_out": "soft",
        "volume": "quiet",
    }
    user = survey_answers_to_trait_scores(answers)
    ranked = rank_parts(user, SWITCHES, weights_for_switch())
    top_id = ranked[0].part.id
    top_name = ranked[0].part.name.lower()
    assert top_id.startswith("sw-silent") or "silent" in top_name or "저소음" in top_name
