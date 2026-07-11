"""Load recent interaction events and compile bounded learning adjustments."""

from __future__ import annotations

import logging
from collections.abc import Mapping, Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.safety.log_policy import redact_log_extra
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import EvalEvent
from keyboard_recommender.recommendation_quality.feedback_learning.config import (
    FeedbackLearningMvpConfig,
    feedback_learning_config_from_settings,
)
from keyboard_recommender.recommendation_quality.feedback_learning.types import LearningAdjustments, PersonalizationMetrics
from keyboard_recommender.recommendation_quality.popularity_tracker.aggregates import (
    aggregate_interaction_rows,
    recent_interaction_payloads,
)
from keyboard_recommender.recommendation_quality.weighting_engine.adjustments import (
    compile_learning_adjustments,
)

logger = logging.getLogger(__name__)

_INTERACTION_TYPES: frozenset[str] = frozenset(
    {
        "interaction.click",
        "interaction.bookmark",
        "interaction.comparison",
        "interaction.feedback",
        "interaction.refinement",
        "interaction.acceptance",
        "interaction.rejection",
        "interaction.revisit",
        "interaction.repeated_view",
        "interaction.collection_tag",
    },
)


def _empty_learning() -> LearningAdjustments:
    return LearningAdjustments(
        part_score_multipliers={},
        trait_nudges={},
        weight_overlay_switch={},
        weight_overlay_plate={},
        weight_overlay_foam={},
        weight_overlay_layout={},
        diversity_ranking_strength_delta=0.0,
        explanation_lines=(),
        personalization=PersonalizationMetrics(),
    )


def load_learning_adjustments(
    session: Session,
    settings: Settings,
    *,
    scenario_id: str | None,
    cfg: FeedbackLearningMvpConfig | None = None,
) -> LearningAdjustments:
    """
    Read recent ``eval_events`` rows and compile explainable nudges.

    Never raises — failures return an empty (no-op) bundle.
    """
    if not settings.enable_feedback_learning_mvp:
        return _empty_learning()
    cfg = cfg or feedback_learning_config_from_settings(settings)
    try:
        stmt = (
            select(EvalEvent.event_type, EvalEvent.payload)
            .where(EvalEvent.event_type.in_(_INTERACTION_TYPES))
            .order_by(EvalEvent.created_at.desc())
            .limit(cfg.max_events)
        )
        rows: Sequence[tuple[str, Mapping[str, Any]]] = session.execute(stmt).all()
        payloads = recent_interaction_payloads(rows, scenario_id=scenario_id)
        raw = aggregate_interaction_rows(
            payloads,
            temporal_decay_per_step=cfg.temporal_decay_per_step,
        )
        return compile_learning_adjustments(raw, cfg)
    except Exception:
        logger.exception(
            "feedback_learning_load_failed",
            extra=redact_log_extra({"scenario_id": scenario_id}),
        )
        return _empty_learning()
