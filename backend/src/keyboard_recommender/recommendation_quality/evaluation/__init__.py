"""
Recommendation evaluation: Phase 1 (metrics, snapshots, diagnostics) and Phase 2
(aggregation, benchmarking, trends, comparisons) — code-only, no production analytics DB.
"""

from keyboard_recommender.recommendation_quality.evaluation.aggregation import (
    DistributionStats,
    aggregate_metric_maps,
    append_jsonl,
    build_aggregate_summary,
    distribution_of,
    read_jsonl,
    rolling_means,
    write_metrics_json,
)
from keyboard_recommender.recommendation_quality.evaluation.benchmarking import (
    build_benchmark_report,
    compatibility_penalty_impact,
    evaluate_paired_runs,
    fallback_recovery_effectiveness,
    reranking_impact_analysis,
    synthetic_metrics_from_snapshots,
)
from keyboard_recommender.recommendation_quality.evaluation.comparisons import (
    compare_aggregate_summaries,
    compare_metrics,
    compare_snapshots_signals,
    human_metric_comparison_lines,
    human_signal_comparison_lines,
    pct_change,
    relative_delta,
)
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationConfig, EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.scoring import evaluate_recommendation
from keyboard_recommender.recommendation_quality.evaluation.trend_analysis import (
    analyze_metric_trends_from_records,
    analyze_series,
    diversity_confidence_trend_bundle,
    human_trend_lines,
    two_window_trend_label,
)

__all__ = [
    "DistributionStats",
    "EvaluationConfig",
    "EvaluationMetrics",
    "aggregate_metric_maps",
    "analyze_metric_trends_from_records",
    "analyze_series",
    "append_jsonl",
    "build_aggregate_summary",
    "build_benchmark_report",
    "compare_aggregate_summaries",
    "compare_metrics",
    "compare_snapshots_signals",
    "compatibility_penalty_impact",
    "diversity_confidence_trend_bundle",
    "distribution_of",
    "evaluate_paired_runs",
    "evaluate_recommendation",
    "fallback_recovery_effectiveness",
    "human_metric_comparison_lines",
    "human_signal_comparison_lines",
    "human_trend_lines",
    "pct_change",
    "read_jsonl",
    "relative_delta",
    "reranking_impact_analysis",
    "rolling_means",
    "synthetic_metrics_from_snapshots",
    "two_window_trend_label",
    "write_metrics_json",
]
