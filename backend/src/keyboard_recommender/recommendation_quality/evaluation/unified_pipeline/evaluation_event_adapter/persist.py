"""Bridge unified events ↔ :class:`EvalEvent` rows (via :class:`EvaluationRepository`)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.safety.log_policy import redact_log_extra
from keyboard_recommender.recommendation_quality.evaluation.storage.repository import EvaluationRepository
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_models.schema import (
    UnifiedRecommendationEvent,
)

logger = logging.getLogger(__name__)


def _run_id_from_metadata(meta: dict[str, Any]) -> uuid.UUID | None:
    raw = meta.get("evalRunId") or meta.get("run_id")
    if raw is None:
        return None
    try:
        return uuid.UUID(str(raw))
    except (ValueError, TypeError):
        return None


def persist_unified_event_to_eval_table(session: Session, event: UnifiedRecommendationEvent) -> None:
    """Append one ``eval_events`` row; does not commit."""
    repo = EvaluationRepository(session)
    rid = _run_id_from_metadata(dict(event.metadata))
    payload = event.model_dump(mode="json")
    repo.append_event(
        str(event.event_type),
        payload,
        run_id=rid,
        correlation_id=event.request_id[:128],
        created_at=event.occurred_at,
    )


def emit_recommendation_request_unified_best_effort(
    session: Session,
    settings: Settings,
    *,
    run_id: uuid.UUID,
    request_id: str | None,
    scenario_id: str | None,
    session_id: str | None,
    api_completed_at_iso: str | None,
    nl_preference_analysis: dict[str, Any] | None = None,
) -> None:
    """
    After a successful evaluation commit, append a ``recommendation.request`` unified row.

    Separate try/except: failures here must not affect callers that already committed.
    """
    if not settings.enable_unified_event_ingestion:
        return
    try:
        nla = dict(nl_preference_analysis) if isinstance(nl_preference_analysis, dict) else {}
        matched = nla.get("matchedTermIds") if isinstance(nla.get("matchedTermIds"), list) else []
        unknown = nla.get("unknownTokens") if isinstance(nla.get("unknownTokens"), list) else []
        ev = UnifiedRecommendationEvent(
            request_id=(request_id or str(run_id))[:128],
            session_id=(session_id or None),
            scenario_id=(scenario_id or None),
            event_type="recommendation.request",
            metadata={
                "evalRunId": str(run_id),
                "apiCompletedAtIso": api_completed_at_iso,
                "source": "api.recommendations.compute",
                "nlApplied": bool(nla.get("applied", False)),
                "nlParsingConfidence": float(nla.get("parsingConfidence", 0.0) or 0.0),
                "nlMatchedTermIds": [str(x) for x in matched[:24]],
                "nlUnknownTokens": [str(x) for x in unknown[:24]],
            },
        )
        persist_unified_event_to_eval_table(session, ev)
        session.commit()
    except Exception:
        session.rollback()
        logger.exception(
            "unified_recommendation_request_event_failed",
            extra=redact_log_extra({"request_id": request_id, "scenario_id": scenario_id}),
        )


__all__ = ["emit_recommendation_request_unified_best_effort", "persist_unified_event_to_eval_table"]
