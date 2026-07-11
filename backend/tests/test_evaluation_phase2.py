"""Phase 2: aggregation, comparisons, trends, benchmarking (no DB)."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from keyboard_recommender.recommendation_quality.evaluation.aggregation import (
    aggregate_metric_maps,
    append_jsonl,
    build_aggregate_summary,
    distribution_of,
    read_jsonl,
    rolling_means,
)
from keyboard_recommender.recommendation_quality.evaluation.benchmarking import (
    build_benchmark_report,
    compatibility_penalty_impact,
    evaluate_paired_runs,
    reranking_impact_analysis,
    synthetic_metrics_from_snapshots,
)
from keyboard_recommender.recommendation_quality.evaluation.comparisons import (
    compare_aggregate_summaries,
    compare_metrics,
    compare_snapshots_signals,
    human_metric_comparison_lines,
)
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.scoring import compute_metrics_from_snapshot
from keyboard_recommender.trait_engine.pipeline import recommend_from_survey
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores
from keyboard_recommender.recommendation_quality.evaluation.trend_analysis import (
    analyze_metric_trends_from_records,
    diversity_confidence_trend_bundle,
    human_trend_lines,
    two_window_trend_label,
)


def test_distribution_and_rolling_stable() -> None:
    d = distribution_of([1.0, 2.0, 3.0, 4.0])
    assert d.count == 4
    assert d.mean == 2.5
    assert d.min == 1.0
    assert d.max == 4.0
    assert d.p50 == 2.5
    rm = rolling_means([10.0, 20.0, 30.0], window=2)
    assert rm == [10.0, 15.0, 25.0]


def test_aggregate_metric_maps_keys() -> None:
    rows = [
        {"trait_alignment": 0.5, "build_coherence": 0.8},
        {"trait_alignment": 0.6, "build_coherence": 0.7},
    ]
    agg = aggregate_metric_maps(rows)
    assert "trait_alignment" in agg
    assert agg["trait_alignment"].mean == 0.55
    assert agg["build_coherence"].mean == 0.75


def test_build_aggregate_summary_and_historical_compare() -> None:
    records = [
        {
            "runId": "1",
            "metrics": {"trait_alignment": 0.5, "winner_trait_diversity": 0.2},
            "snapshot": {"recommendationConfidence": {"overall": 0.5}},
        },
        {
            "runId": "2",
            "metrics": {"trait_alignment": 0.7, "winner_trait_diversity": 0.3},
            "snapshot": {"recommendationConfidence": {"overall": 0.6}},
        },
    ]
    s1 = build_aggregate_summary(records, scenario_id="s1", label="batch_a")
    s2 = build_aggregate_summary(records[:1], scenario_id="s1", label="batch_b")
    assert s1["schemaVersion"] == "evaluation.aggregate_summary.v1"
    assert s1["distributions"]["trait_alignment"]["mean"] == 0.6
    cmp = compare_aggregate_summaries(s2, s1)
    assert cmp["schemaVersion"] == "evaluation.compare_aggregate_summaries.v1"
    assert "trait_alignment" in cmp["perMetric"]


def test_jsonl_roundtrip() -> None:
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "runs.jsonl"
        append_jsonl(p, {"metrics": {"trait_alignment": 1.0}, "k": "a"})
        append_jsonl(p, {"metrics": {"trait_alignment": 1.0}, "k": "b"})
        rows = read_jsonl(p)
        assert len(rows) == 2
        assert rows[0]["k"] == "a"


def test_compare_metrics_reproducible() -> None:
    a = EvaluationMetrics(0.5, 0.0, 0.5, 0.8, 0.0, 0.3)
    b = EvaluationMetrics(0.6, 0.1, 0.55, 0.85, 0.1, 0.35)
    c1 = compare_metrics(a, b)
    c2 = compare_metrics(a, b)
    assert json.dumps(c1, sort_keys=True) == json.dumps(c2, sort_keys=True)
    lines = human_metric_comparison_lines(c1)
    assert any("trait_alignment" in ln for ln in lines)


def test_compare_snapshots_signals() -> None:
    base = {
        "compatibilityAudit": {"effectivePenaltyTotal": 0.5},
        "recommendationConfidence": {"overall": 0.4},
        "fallbackAudit": None,
    }
    cur = {
        "compatibilityAudit": {"effectivePenaltyTotal": 0.3},
        "recommendationConfidence": {"overall": 0.55},
        "fallbackAudit": {"recovered": True, "confidenceBefore": 0.3, "confidenceAfter": 0.55},
    }
    out = compare_snapshots_signals(base, cur)
    assert out["signals"]["effectiveCompatibilityPenalty"]["absoluteDelta"] == -0.2


def test_reranking_impact_analysis() -> None:
    snap = {
        "diversityAudit": {
            "families": [
                {
                    "family": "switches",
                    "originalOrderIds": ["a", "b", "c"],
                    "rerankedOrderIds": ["a", "b", "c"],
                },
                {
                    "family": "plates",
                    "originalOrderIds": ["x", "y"],
                    "rerankedOrderIds": ["y", "x"],
                },
            ],
        },
    }
    r = reranking_impact_analysis(snap)
    assert r["familiesChanged"] == 1
    assert r["fractionFamiliesChanged"] == 0.5
    assert r["meanFootrulePerChangedFamily"] == 2.0
    assert r["summaryLines"]


def test_compatibility_penalty_narrative() -> None:
    b = {"compatibilityAudit": {"effectivePenaltyTotal": 0.9}}
    t = {"compatibilityAudit": {"effectivePenaltyTotal": 0.2}}
    out = compatibility_penalty_impact(b, t)
    assert out["absoluteDelta"] == -0.7
    assert any("reduced" in ln.lower() for ln in out["summaryLines"])


def test_synthetic_benchmark_from_snapshots() -> None:
    snap_a = {
        "userTraitScores": {"deep_sound": 2.0},
        "winnerTraits": [{"deep_sound": 8.0, "smooth": 2.0}, {"deep_sound": 8.0, "smooth": 2.0}],
        "diversityAudit": {"families": []},
        "compatibilityAudit": {"effectivePenaltyTotal": 0.8},
    }
    snap_b = {
        "userTraitScores": {"deep_sound": 2.0},
        "winnerTraits": [{"deep_sound": 7.0, "smooth": 6.0}, {"deep_sound": 6.0, "smooth": 7.0}],
        "diversityAudit": {"families": []},
        "compatibilityAudit": {"effectivePenaltyTotal": 0.2},
    }
    report = synthetic_metrics_from_snapshots(snap_a, snap_b)
    assert report["schemaVersion"] == "evaluation.benchmark_report.v1"
    assert "narrativeLines" in report
    assert report["metricComparison"]["perMetric"]["compatibility_stability"]["current"] >= report[
        "metricComparison"
    ]["perMetric"]["compatibility_stability"]["baseline"]


def test_build_benchmark_report_lines() -> None:
    m_a = EvaluationMetrics(0.4, 0.5, 0.4, 0.5, 0.5, 0.2)
    m_b = EvaluationMetrics(0.5, 0.5, 0.5, 0.7, 0.5, 0.35)
    s_a: dict = {"compatibilityAudit": {"effectivePenaltyTotal": 0.6}, "diversityAudit": {"families": []}}
    s_b: dict = {"compatibilityAudit": {"effectivePenaltyTotal": 0.2}, "diversityAudit": {"families": []}}
    rep = build_benchmark_report(
        baseline_label="A",
        baseline_snapshot=s_a,
        baseline_metrics=m_a,
        treatment_label="B",
        treatment_snapshot=s_b,
        treatment_metrics=m_b,
    )
    assert rep["baselineLabel"] == "A"
    assert len(rep["narrativeLines"]) >= 3


def test_trend_analysis_from_records() -> None:
    recs = [
        {"metrics": {"trait_alignment": 0.1}},
        {"metrics": {"trait_alignment": 0.2}},
        {"metrics": {"trait_alignment": 0.35}},
        {"metrics": {"trait_alignment": 0.5}},
    ]
    t = analyze_metric_trends_from_records(recs, metric_key="trait_alignment")
    assert t["twoWindowTrend"] == "up"
    assert t["firstLastDelta"] > 0
    assert two_window_trend_label([1.0, 1.0, 1.0, 1.0]) == "flat"


def test_diversity_confidence_trend_bundle_human_lines() -> None:
    recs = [
        {
            "metrics": {"winner_trait_diversity": 0.1},
            "snapshot": {"recommendationConfidence": {"overall": 0.4}},
        },
        {
            "metrics": {"winner_trait_diversity": 0.5},
            "snapshot": {"recommendationConfidence": {"overall": 0.7}},
        },
    ]
    b = diversity_confidence_trend_bundle(recs)
    lines = human_trend_lines(b)
    assert any("diversity" in ln.lower() for ln in lines)


def test_evaluate_paired_runs_identical_engines() -> None:
    answers = {
        "sound_profile": "thocky",
        "typing_pressure": "medium",
        "switch_feel": "linear",
        "bottom_out": "medium",
        "volume": "moderate",
    }
    e1 = recommend_from_survey(answers)
    e2 = recommend_from_survey(answers)
    u = {k: float(v) for k, v in survey_answers_to_trait_scores(answers).items()}
    out = evaluate_paired_runs(e1, e2, u, survey_answers=answers)
    assert out["benchmarkReport"]["schemaVersion"] == "evaluation.benchmark_report.v1"
    assert out["baseline"]["metrics"] == out["treatment"]["metrics"]


def test_compute_metrics_aggregate_consistency() -> None:
    snap = {
        "userTraitScores": {"deep_sound": 1.0},
        "winnerTraits": [{"deep_sound": 5.0} for _ in range(4)],
        "diversityAudit": {"families": []},
        "compatibilityAudit": {"effectivePenaltyTotal": 0.0},
    }
    m = compute_metrics_from_snapshot(snap)
    summary = build_aggregate_summary([{"metrics": m.as_dict(), "snapshot": {}}])
    assert summary["distributions"]["trait_alignment"]["count"] == 1
