"""
Sample calculations for manual verification.

From ``backend/`` after ``pip install -e ".[dev]"`` (or ``pip install -e .``):

    python -m keyboard_recommender.trait_engine.examples
"""

from __future__ import annotations

from keyboard_recommender.trait_engine.pipeline import recommend_from_survey
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores


def main() -> None:
    answers = {
        "sound_profile": "thocky",
        "typing_pressure": "light",
        "switch_feel": "linear",
        "bottom_out": "soft",
        "volume": "quiet",
    }
    user = survey_answers_to_trait_scores(answers)
    print("User trait scores:", user)
    eng = recommend_from_survey(answers)
    print("Top switch:", eng.top_switch.part.id, eng.top_switch.score)
    print("Explain:", eng.top_switch.explanation)


if __name__ == "__main__":
    main()
