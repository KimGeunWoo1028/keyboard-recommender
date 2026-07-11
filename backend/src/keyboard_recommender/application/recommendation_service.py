"""Compute recommendation from validated survey answers."""

from __future__ import annotations

from dataclasses import asdict
import logging
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.application.async_optimization import submit_evaluation_persistence_job
from keyboard_recommender.application.cache_layer import TtlCache, stable_json_key
from keyboard_recommender.application.evaluation_persistence_hook import (
    persist_recommendation_evaluation_best_effort,
)
from keyboard_recommender.config.settings import Settings, get_settings
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.recommendation_quality.operational_monitoring.runtime import (
    resolve_operational_runtime,
)
from keyboard_recommender.schemas.recommendation import RecommendationResponse, SurveyAnswersRequest
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_computation

_logger = logging.getLogger(__name__)
_RECOMMENDATION_CACHE: TtlCache | None = None
_RECOMMENDATION_CACHE_CFG: tuple[int, int] | None = None

# Response ``runMode: quick`` is retained for contract rev 7 — internal resilient degraded only.
_DEGRADED_RUN_MODE = "quick"
_FULL_RUN_MODE = "full"


def _get_recommendation_cache(cfg: Settings) -> TtlCache:
    global _RECOMMENDATION_CACHE, _RECOMMENDATION_CACHE_CFG
    target = (int(cfg.recommendation_cache_max_size), int(cfg.recommendation_cache_ttl_seconds))
    if _RECOMMENDATION_CACHE is None or _RECOMMENDATION_CACHE_CFG != target:
        _RECOMMENDATION_CACHE = TtlCache(max_size=target[0], ttl_seconds=target[1])
        _RECOMMENDATION_CACHE_CFG = target
    return _RECOMMENDATION_CACHE


def _resilient_degraded_flags() -> OperationalFeatureFlags:
    """Fallback path when full compute fails — not exposed as a user-facing quick recommendation."""
    return OperationalFeatureFlags(
        enable_reranking=False,
        enable_fallback=False,
        enable_feedback_weighting=False,
        model_version="resilient_degraded_v1",
    )


def compute_recommendation(
    body: SurveyAnswersRequest,
    *,
    settings: Settings | None = None,
    db_session: Session | None = None,
    request_id: str | None = None,
    scenario_id: str | None = None,
    session_id: str | None = None,
    include_explanation_debug: bool = False,
) -> RecommendationResponse:
    """
    Build the recommendation response, then optionally persist evaluation rows.

    Persistence is opt-in via settings and never affects the returned model.
    """
    cfg = settings or get_settings()
    data = body.model_dump()
    nl = data.pop("natural_language", None)
    op = resolve_operational_runtime(settings=cfg, db_session=db_session, scenario_id=scenario_id)
    runtime_flags = op.flags
    operational_notes = tuple(op.notes)
    cache_key = stable_json_key(
        {
            "answers": data,
            "naturalLanguage": nl,
            "mode": _FULL_RUN_MODE,
            "scenarioId": scenario_id,
            "appVersion": cfg.app_version,
            "runtimeFlags": asdict(runtime_flags),
            "responseContractRev": 7,
        },
    )
    if cfg.enable_recommendation_cache:
        cached_payload = _get_recommendation_cache(cfg).get(cache_key)
        if cached_payload is not None:
            return RecommendationResponse.model_validate(cached_payload)
    payload: dict[str, Any]
    try:
        payload, engine, user_trait_scores, answers = build_recommendation_computation(
            data,
            natural_language=nl,
            db_session=db_session if cfg.enable_feedback_learning_mvp else None,
            app_settings=cfg,
            scenario_id=scenario_id,
            runtime_flags=runtime_flags,
            operational_notes=operational_notes,
            include_explanation_debug=include_explanation_debug,
        )
        payload["runMode"] = _FULL_RUN_MODE
    except Exception:
        if not cfg.enable_resilient_compute_fallback:
            raise
        _logger.exception(
            "full_mode_compute_failed_fallback_to_degraded",
            extra={"request_id": request_id, "scenario_id": scenario_id},
        )
        degraded_notes = (
            *tuple(op.notes),
            "resilient degraded compute after full-mode failure",
        )
        payload, engine, user_trait_scores, answers = build_recommendation_computation(
            data,
            natural_language=nl,
            db_session=db_session if cfg.enable_feedback_learning_mvp else None,
            app_settings=cfg,
            scenario_id=scenario_id,
            runtime_flags=_resilient_degraded_flags(),
            operational_notes=degraded_notes,
            include_explanation_debug=include_explanation_debug,
        )
        payload["runMode"] = _DEGRADED_RUN_MODE
        payload["degradedReason"] = "full_mode_compute_failed"
    response = RecommendationResponse.model_validate(payload)
    if cfg.enable_recommendation_cache:
        _get_recommendation_cache(cfg).set(cache_key, response.model_dump(by_alias=True, mode="json"))

    if cfg.enable_evaluation_persistence and db_session is not None:
        nl_analysis_payload = response.nl_preference_analysis.model_dump(by_alias=True, mode="json")
        if cfg.enable_async_diagnostics_offload:
            submit_evaluation_persistence_job(
                settings=cfg,
                engine=engine,
                user_trait_scores=user_trait_scores,
                survey_answers=answers,
                request_id=request_id,
                scenario_id=scenario_id,
                session_id=session_id,
                api_completed_at_iso=response.completed_at_iso,
                nl_preference_analysis=nl_analysis_payload,
            )
        else:
            persist_recommendation_evaluation_best_effort(
                db_session,
                cfg,
                engine=engine,
                user_trait_scores=user_trait_scores,
                survey_answers=answers,
                request_id=request_id,
                scenario_id=scenario_id,
                session_id=session_id,
                api_completed_at_iso=response.completed_at_iso,
                nl_preference_analysis=nl_analysis_payload,
            )
    elif cfg.enable_evaluation_persistence and db_session is None:
        _logger.warning(
            "evaluation_persistence_enabled_without_db_session",
            extra={"request_id": request_id, "scenario_id": scenario_id},
        )

    return response
