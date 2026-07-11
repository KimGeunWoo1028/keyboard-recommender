"""
Best-effort persistence of recommendation evaluation after a successful compute.

Runs after the API payload is built. Failures are logged and swallowed so the HTTP
response is never affected. Designed for a future async queue (same call surface).
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from copy import deepcopy
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.application.cache_layer import TtlCache, stable_json_key
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.persistence.session import SessionLocal
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.scoring import evaluate_recommendation
from keyboard_recommender.recommendation_quality.evaluation.storage.ingestion import ingest_evaluated_recommendation
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.evaluation_event_adapter.persist import (
    emit_recommendation_request_unified_best_effort,
)
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult

logger = logging.getLogger(__name__)
_EVALUATION_COMPUTE_CACHE: TtlCache | None = None
_EVALUATION_COMPUTE_CACHE_CFG: tuple[int, int] | None = None


def _get_evaluation_compute_cache(settings: Settings) -> TtlCache:
    global _EVALUATION_COMPUTE_CACHE, _EVALUATION_COMPUTE_CACHE_CFG
    ttl = max(5, int(settings.recommendation_cache_ttl_seconds) * 2)
    size = max(128, int(settings.recommendation_cache_max_size) // 2)
    target = (size, ttl)
    if _EVALUATION_COMPUTE_CACHE is None or _EVALUATION_COMPUTE_CACHE_CFG != target:
        _EVALUATION_COMPUTE_CACHE = TtlCache(max_size=size, ttl_seconds=ttl)
        _EVALUATION_COMPUTE_CACHE_CFG = target
    return _EVALUATION_COMPUTE_CACHE


def _redacted_diagnostics(metrics: EvaluationMetrics) -> dict[str, Any]:
    return {
        "summaryLines": ["Diagnostics persistence disabled by configuration (metric values only)."],
        "metricValues": metrics.as_dict(),
        "penaltyTrace": [],
        "rerankTrace": [],
        "hooks": ["diagnostics_redacted_by_config"],
    }


def _maybe_truncate_snapshot(snap: dict[str, Any], *, full_snapshots: bool) -> dict[str, Any]:
    if full_snapshots:
        return snap
    slim = deepcopy(snap)
    slim.pop("rankedLists", None)
    meta = slim.setdefault("integrationMeta", {})
    if isinstance(meta, dict):
        meta["snapshotTruncated"] = True
        meta["truncationReason"] = "enable_evaluation_snapshots=false"
    return slim


def persist_recommendation_evaluation_best_effort(
    session: Session,
    settings: Settings,
    *,
    engine: TraitEngineResult,
    user_trait_scores: Mapping[str, float],
    survey_answers: Mapping[str, str],
    request_id: str | None,
    scenario_id: str | None,
    session_id: str | None = None,
    api_completed_at_iso: str | None = None,
    nl_preference_analysis: Mapping[str, Any] | None = None,
) -> None:
    """
    Persist snapshot + metrics + diagnostics (+ confidence row) inside ``session``.

    Commits on success; rolls back the session on failure (caller should use a
    dedicated session when other work shares the same transaction).
    """
    if not settings.enable_evaluation_persistence:
        return

    run_id = None
    try:
        if settings.evaluation_persistence_force_failure:
            raise RuntimeError("simulated evaluation persistence failure")

        eval_key = stable_json_key(
            {
                "surveyAnswers": dict(survey_answers),
                "userTraitScores": {k: float(v) for k, v in user_trait_scores.items()},
                "winners": {
                    "switch": engine.top_switch.part.id,
                    "plate": engine.top_plate.part.id,
                    "foam": engine.top_foam.part.id,
                    "layout": engine.top_layout.part.id,
                    "case": engine.top_case.part.id,
                    "keycap": engine.top_keycap.part.id,
                },
                "appVersion": settings.app_version,
                "enableDiagnosticsPersistence": settings.enable_diagnostics_persistence,
                "enableEvaluationSnapshots": settings.enable_evaluation_snapshots,
            },
        )
        cached = _get_evaluation_compute_cache(settings).get(eval_key)
        if cached is None:
            snap, metrics, diag = evaluate_recommendation(
                engine,
                user_trait_scores,
                survey_answers=dict(survey_answers),
            )
            _get_evaluation_compute_cache(settings).set(
                eval_key,
                {"snap": dict(snap), "metrics": metrics.as_dict(), "diag": dict(diag)},
            )
        else:
            snap = dict(cached["snap"])
            metrics = EvaluationMetrics(**dict(cached["metrics"]))
            diag = dict(cached["diag"])
        snap = dict(snap)
        snap.setdefault("integrationMeta", {})
        im = snap["integrationMeta"]
        if isinstance(im, dict):
            im.update(
                {
                    "requestId": request_id,
                    "scenarioId": scenario_id,
                    "appVersion": settings.app_version,
                    "apiCompletedAtIso": api_completed_at_iso,
                    "enableEvaluationSnapshots": settings.enable_evaluation_snapshots,
                    "enableDiagnosticsPersistence": settings.enable_diagnostics_persistence,
                },
            )

        snap = _maybe_truncate_snapshot(snap, full_snapshots=settings.enable_evaluation_snapshots)

        if not settings.enable_diagnostics_persistence:
            diag = _redacted_diagnostics(metrics)

        run_id = ingest_evaluated_recommendation(
            session,
            snap,
            metrics,
            diag,
            scenario_id=scenario_id,
            request_id=request_id,
            source="api.recommendations.compute",
            notes=None,
            config_fingerprint=f"app_version={settings.app_version}",
        )
        session.commit()
    except Exception:
        session.rollback()
        logger.exception(
            "evaluation_persistence_failed",
            extra={
                "request_id": request_id,
                "scenario_id": scenario_id,
                "app_version": settings.app_version,
            },
        )
        return

    assert run_id is not None
    emit_recommendation_request_unified_best_effort(
        session,
        settings,
        run_id=run_id,
        request_id=request_id,
        scenario_id=scenario_id,
        session_id=session_id,
        api_completed_at_iso=api_completed_at_iso,
        nl_preference_analysis=nl_preference_analysis,
    )


def persist_recommendation_evaluation_in_new_session_best_effort(
    *,
    settings: Settings,
    engine: TraitEngineResult,
    user_trait_scores: Mapping[str, float],
    survey_answers: Mapping[str, str],
    request_id: str | None,
    scenario_id: str | None,
    session_id: str | None = None,
    api_completed_at_iso: str | None = None,
    nl_preference_analysis: Mapping[str, Any] | None = None,
) -> None:
    session = SessionLocal()
    try:
        persist_recommendation_evaluation_best_effort(
            session,
            settings,
            engine=engine,
            user_trait_scores=user_trait_scores,
            survey_answers=survey_answers,
            request_id=request_id,
            scenario_id=scenario_id,
            session_id=session_id,
            api_completed_at_iso=api_completed_at_iso,
            nl_preference_analysis=nl_preference_analysis,
        )
    finally:
        session.close()
