from __future__ import annotations

from keyboard_recommender.recommendation_quality.evaluation.scoring import evaluate_recommendation
from keyboard_recommender.trait_engine.pipeline import recommend_from_survey
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores
from tests.benchmark_validation.comparison_utils import (
    assert_metric_change_bounded,
    assert_metric_not_worse_than,
)
from tests.recommendation_regression.harness import deterministic_seed
from tests.support.regression import STABLE_SURVEY


def test_benchmark_metrics_are_deterministic_for_same_run() -> None:
    with deterministic_seed():
        engine = recommend_from_survey(dict(STABLE_SURVEY))
        user_scores = survey_answers_to_trait_scores(dict(STABLE_SURVEY))
        snap_a, metrics_a, _ = evaluate_recommendation(engine, user_scores, survey_answers=STABLE_SURVEY)
        snap_b, metrics_b, _ = evaluate_recommendation(engine, user_scores, survey_answers=STABLE_SURVEY)
    assert snap_a == snap_b
    assert metrics_a.as_dict() == metrics_b.as_dict()


def test_benchmark_validation_regression_guards() -> None:
    with deterministic_seed():
        baseline_engine = recommend_from_survey(dict(STABLE_SURVEY))
        baseline_scores = survey_answers_to_trait_scores(dict(STABLE_SURVEY))
        _, baseline_metrics, _ = evaluate_recommendation(
            baseline_engine,
            baseline_scores,
            survey_answers=STABLE_SURVEY,
        )
        treatment_engine = recommend_from_survey(dict(STABLE_SURVEY))
        treatment_scores = survey_answers_to_trait_scores(dict(STABLE_SURVEY))
        _, treatment_metrics, _ = evaluate_recommendation(
            treatment_engine,
            treatment_scores,
            survey_answers=STABLE_SURVEY,
        )

    before = baseline_metrics.as_dict()
    after = treatment_metrics.as_dict()
    assert_metric_not_worse_than(before, after, "trait_alignment", max_regression=0.000001)
    assert_metric_not_worse_than(before, after, "build_coherence", max_regression=0.000001)
    assert_metric_change_bounded(before, after, "compatibility_stability", max_absolute_change=0.000001)
