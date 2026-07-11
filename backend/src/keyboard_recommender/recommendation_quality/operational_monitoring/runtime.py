from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.recommendation_quality.alerting.notifier import emit_operational_alert
from keyboard_recommender.recommendation_quality.evaluation.storage.queries import (
    confidence_history_rows_scoped,
    metric_history_rows_scoped,
)
from keyboard_recommender.recommendation_quality.feature_flags.manager import base_operational_flags
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.recommendation_quality.operational_monitoring.threshold_evaluator import (
    OperationalThresholdResult,
    OperationalThresholds,
    evaluate_thresholds,
)
from keyboard_recommender.recommendation_quality.rollback_controller.controller import apply_rollback_policy

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class OperationalRuntimeDecision:
    flags: OperationalFeatureFlags
    notes: tuple[str, ...]
    threshold_result: OperationalThresholdResult | None = None


def _thresholds_from_settings(settings: Settings) -> OperationalThresholds:
    return OperationalThresholds(
        confidence_min_mean=settings.operational_threshold_confidence_min_mean,
        diversity_min_mean=settings.operational_threshold_diversity_min_mean,
        compatibility_min_mean=settings.operational_threshold_compatibility_min_mean,
        reranking_max_mean=settings.operational_threshold_reranking_max_mean,
    )


def resolve_operational_runtime(
    *,
    settings: Settings,
    db_session: Session | None,
    scenario_id: str | None,
) -> OperationalRuntimeDecision:
    base_flags = base_operational_flags(settings)
    if not settings.enable_operational_automation:
        return OperationalRuntimeDecision(flags=base_flags, notes=("operational automation disabled",))
    if db_session is None or not settings.enable_evaluation_persistence:
        return OperationalRuntimeDecision(flags=base_flags, notes=("operational automation skipped: persistence/db unavailable",))

    try:
        window = max(8, min(int(settings.operational_monitor_window), 256))
        metric_rows = metric_history_rows_scoped(db_session, scenario_id, limit=window)
        conf_rows = confidence_history_rows_scoped(db_session, scenario_id, limit=window)

        confidence_vals = [float(r["overall"]) for r in conf_rows if r.get("overall") is not None]
        diversity_vals = [float(r["winnerTraitDiversity"]) for r in metric_rows]
        compatibility_vals = [float(r["compatibilityStability"]) for r in metric_rows]
        reranking_vals = [float(r["rerankingDistortionIndex"]) for r in metric_rows]

        tr = evaluate_thresholds(
            confidence_values=confidence_vals,
            diversity_values=diversity_vals,
            compatibility_values=compatibility_vals,
            reranking_values=reranking_vals,
            thresholds=_thresholds_from_settings(settings),
        )
        flags, lines = apply_rollback_policy(base_flags, threshold_result=tr)
        notes = list(lines)
        if not notes:
            notes.append("operational thresholds within safe range")
        if tr.breached_any:
            emit_operational_alert(settings, scenario_id=scenario_id, threshold_result=tr, action_lines=notes)
        return OperationalRuntimeDecision(flags=flags, notes=tuple(notes), threshold_result=tr)
    except Exception:
        logger.exception("operational_runtime_resolution_failed")
        return OperationalRuntimeDecision(flags=base_flags, notes=("operational automation failed open",))
