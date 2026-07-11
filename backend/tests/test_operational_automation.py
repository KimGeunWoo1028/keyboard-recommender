"""Operational automation: thresholds -> flags/rollback (safe-by-default)."""

from __future__ import annotations

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.recommendation_quality.build_selection import pick_build_with_compatibility
from keyboard_recommender.recommendation_quality.feature_flags.manager import base_operational_flags
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.recommendation_quality.operational_monitoring.runtime import resolve_operational_runtime
from keyboard_recommender.recommendation_quality.operational_monitoring.threshold_evaluator import (
    OperationalThresholdResult,
    OperationalSignalSummary,
    OperationalThresholds,
    evaluate_thresholds,
)
from keyboard_recommender.recommendation_quality.rollback_controller.controller import apply_rollback_policy
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS


def _pg_settings(**kwargs: object) -> Settings:
    base: dict[str, object] = {
        "database_url": "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
    }
    base.update(kwargs)
    return Settings(**base)


def test_threshold_evaluator_flags_breaches() -> None:
    th = OperationalThresholds(
        confidence_min_mean=0.58,
        diversity_min_mean=0.2,
        compatibility_min_mean=0.6,
        reranking_max_mean=0.5,
    )
    out = evaluate_thresholds(
        confidence_values=[0.52, 0.49, 0.51],
        diversity_values=[0.1, 0.12, 0.11],
        compatibility_values=[0.55, 0.5, 0.58],
        reranking_values=[0.61, 0.57, 0.59],
        thresholds=th,
    )
    assert out.breached_any is True
    assert out.breached_confidence_drop is True
    assert out.breached_diversity_collapse is True
    assert out.breached_compatibility_instability is True
    assert out.breached_reranking_distortion is True


def test_rollback_policy_disables_modules_reversibly() -> None:
    base = OperationalFeatureFlags(
        enable_reranking=True,
        enable_fallback=True,
        enable_feedback_weighting=True,
        model_version="stable_v2",
    )
    tr = OperationalThresholdResult(
        breached_confidence_drop=True,
        breached_diversity_collapse=True,
        breached_compatibility_instability=True,
        breached_reranking_distortion=True,
        summary=OperationalSignalSummary(0.49, 0.11, 0.54, 0.58, 24),
    )
    flags, lines = apply_rollback_policy(base, threshold_result=tr)
    assert flags.enable_reranking is False
    assert flags.enable_fallback is False
    assert flags.enable_feedback_weighting is False
    assert flags.model_version == "stable_v1"
    assert lines


def test_runtime_disabled_is_safe_default() -> None:
    s = _pg_settings(enable_operational_automation=False)
    out = resolve_operational_runtime(settings=s, db_session=None, scenario_id=None)
    assert out.flags == base_operational_flags(s)
    assert "disabled" in out.notes[0]


def test_build_selection_respects_disable_reranking_flag() -> None:
    user = {axis: 0.0 for axis in TRAIT_AXIS_IDS}
    user["deep_sound"] = 2.4
    user["strong_tactile"] = 2.2
    user["firm_bottom_out"] = 1.6

    *_rest, div_on, _fb_on, _conf_on = pick_build_with_compatibility(user)
    assert div_on is not None
    assert len(div_on.families) > 0

    *_rest2, div_off, _fb_off, _conf_off = pick_build_with_compatibility(
        user,
        runtime_flags=OperationalFeatureFlags(enable_reranking=False),
    )
    assert div_off is None

