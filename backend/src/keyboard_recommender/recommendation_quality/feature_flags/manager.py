from __future__ import annotations

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags


def base_operational_flags(settings: Settings) -> OperationalFeatureFlags:
    return OperationalFeatureFlags(
        enable_reranking=settings.operational_default_enable_reranking,
        enable_fallback=settings.operational_default_enable_fallback,
        enable_feedback_weighting=settings.operational_default_enable_feedback_weighting,
        model_version=settings.operational_default_model_version,
    )
