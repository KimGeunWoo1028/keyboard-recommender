"""Phase-1 evaluation: snapshots, metrics, diagnostics (no DB)."""

from __future__ import annotations

import json

from keyboard_recommender.recommendation_quality.evaluation.diagnostics import build_diagnostics_report
from keyboard_recommender.recommendation_quality.evaluation.metrics import mean_trait_vector, trait_alignment_score
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationConfig, EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.scoring import compute_metrics_from_snapshot, evaluate_recommendation
from keyboard_recommender.recommendation_quality.evaluation.snapshots import build_recommendation_snapshot
from keyboard_recommender.trait_engine.pipeline import recommend_from_survey
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores


def test_evaluate_recommendation_deterministic() -> None:
    answers = {
        "sound_profile": "thocky",
        "typing_pressure": "medium",
        "switch_feel": "linear",
        "bottom_out": "medium",
        "volume": "moderate",
    }
    eng1 = recommend_from_survey(answers)
    eng2 = recommend_from_survey(answers)
    u1 = {k: float(v) for k, v in survey_answers_to_trait_scores(answers).items()}
    s1, m1, d1 = evaluate_recommendation(eng1, u1, survey_answers=answers)
    s2, m2, d2 = evaluate_recommendation(eng2, u1, survey_answers=answers)
    assert json.dumps(s1, sort_keys=True) == json.dumps(s2, sort_keys=True)
    assert m1.as_dict() == m2.as_dict()
    assert d1["summaryLines"] == d2["summaryLines"]


def test_snapshot_schema_version_and_keys() -> None:
    answers = {
        "sound_profile": "muted",
        "typing_pressure": "light",
        "switch_feel": "linear",
        "bottom_out": "soft",
        "volume": "quiet",
    }
    eng = recommend_from_survey(answers)
    u = survey_answers_to_trait_scores(answers)
    snap = build_recommendation_snapshot(eng, u, survey_answers=answers)
    assert snap["schemaVersion"] == "evaluation.snapshot.v1"
    for k in ("selected", "winnerTraits", "rankedLists", "userTraitScores"):
        assert k in snap
    assert snap["surveyAnswers"] == answers


def test_metrics_stable_for_fixed_snapshot() -> None:
    snap = {
        "userTraitScores": {"deep_sound": 2.0, "smooth": 1.0},
        "winnerTraits": [
            {"deep_sound": 8.0, "smooth": 8.0},
            {"deep_sound": 8.0, "smooth": 8.0},
            {"deep_sound": 7.0, "smooth": 7.0},
            {"deep_sound": 7.0, "smooth": 7.0},
        ],
        "diversityAudit": {
            "families": [
                {"originalOrderIds": ["a", "b"], "rerankedOrderIds": ["a", "b"]},
                {"originalOrderIds": ["x", "y"], "rerankedOrderIds": ["y", "x"]},
            ],
        },
        "compatibilityAudit": {"effectivePenaltyTotal": 0.4},
    }
    m1 = compute_metrics_from_snapshot(snap, eval_cfg=EvaluationConfig())
    m2 = compute_metrics_from_snapshot(snap, eval_cfg=EvaluationConfig())
    assert m1.as_dict() == m2.as_dict()
    assert m1.diversity_intervention == 0.5
    assert 0.0 <= m1.compatibility_stability <= 1.0


def test_trait_alignment_identical_vectors() -> None:
    part = {k: 0.0 for k in TRAIT_AXIS_IDS}
    part["deep_sound"] = 5.0
    part["smooth"] = 5.0
    bm = mean_trait_vector([part, part, part, part])
    s = trait_alignment_score(bm, bm)
    assert s == 1.0


def test_diagnostics_contains_traces() -> None:
    snap = {
        "compatibilityAudit": {
            "effectivePenaltyTotal": 0.2,
            "lines": [{"ruleId": "r1", "effectivePenalty": 0.1, "message": "m"}],
        },
        "diversityAudit": {"families": []},
        "recommendationConfidence": {"label": "balanced", "overall": 0.55},
    }
    m = EvaluationMetrics(0.5, 0.0, 0.5, 0.8, 0.0, 0.3)
    d = build_diagnostics_report(snap, m)
    assert d["penaltyTrace"]
    assert any("diagnostics_hook" in h for h in d["hooks"])
