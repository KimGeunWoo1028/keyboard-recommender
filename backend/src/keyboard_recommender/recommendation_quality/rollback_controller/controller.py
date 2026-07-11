from __future__ import annotations

from dataclasses import replace

from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.recommendation_quality.operational_monitoring.threshold_evaluator import OperationalThresholdResult


def apply_rollback_policy(
    base_flags: OperationalFeatureFlags,
    *,
    threshold_result: OperationalThresholdResult,
) -> tuple[OperationalFeatureFlags, list[str]]:
    """Map drift breaches to reversible runtime toggles."""
    flags = base_flags
    lines: list[str] = []

    if threshold_result.breached_reranking_distortion and flags.enable_reranking:
        flags = replace(flags, enable_reranking=False)
        lines.append("Reranking disabled due to sustained distortion above threshold.")

    if threshold_result.breached_compatibility_instability and flags.enable_fallback:
        flags = replace(flags, enable_fallback=False)
        lines.append("Fallback disabled because compatibility stability dipped below threshold.")

    if threshold_result.breached_confidence_drop and threshold_result.breached_diversity_collapse:
        if flags.enable_feedback_weighting:
            flags = replace(flags, enable_feedback_weighting=False)
            lines.append("Feedback weighting disabled while confidence and diversity are jointly degraded.")
        if flags.model_version != "stable_v1":
            flags = replace(flags, model_version="stable_v1")
            lines.append("Model version switched to stable_v1 as conservative rollback.")

    return flags, lines
