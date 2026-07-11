"""Batch ingestion entrypoint (best-effort; callers own session lifecycle)."""

from __future__ import annotations

import logging
from collections.abc import Mapping, Sequence
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.safety.log_policy import redact_log_extra
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.evaluation_event_adapter.persist import (
    persist_unified_event_to_eval_table,
)
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_collector.normalize import (
    normalize_raw_unified_event,
)

logger = logging.getLogger(__name__)


def collect_and_persist_unified_events_best_effort(
    session: Session,
    settings: Settings,
    raw_events: Sequence[Mapping[str, Any]],
) -> int:
    """
    Normalize and append each event to ``eval_events`` inside the current transaction.

    Returns count successfully **staged** (flushed). Does **not** commit — the HTTP
    handler commits once. Failures per row are logged and skipped.
    """
    if not settings.enable_evaluation_persistence or not settings.enable_unified_event_ingestion:
        return 0
    stored = 0
    for raw in raw_events:
        try:
            ev = normalize_raw_unified_event(raw)
            persist_unified_event_to_eval_table(session, ev)
            stored += 1
        except Exception:
            logger.exception(
                "unified_event_normalize_or_stage_failed",
                extra=redact_log_extra({"request_id": raw.get("request_id"), "event_type": raw.get("event_type")}),
            )
    return stored


__all__ = ["collect_and_persist_unified_events_best_effort"]
