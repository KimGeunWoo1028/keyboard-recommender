"""Map arbitrary JSON dicts (browser / internal) into :class:`UnifiedRecommendationEvent`."""

from __future__ import annotations

import uuid
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_models.schema import (
    UNIFIED_EVENT_SCHEMA_VERSION,
    UnifiedRecommendationEvent,
)


def normalize_raw_unified_event(raw: Mapping[str, Any]) -> UnifiedRecommendationEvent:
    """
    Coerce a loose mapping into a validated unified event.

    Fills ``event_id`` / ``occurred_at`` / ``schema_version`` when missing.
    """
    data: dict[str, Any] = dict(raw)
    data.setdefault("schema_version", UNIFIED_EVENT_SCHEMA_VERSION)
    if not data.get("event_id"):
        data["event_id"] = str(uuid.uuid4())
    if not data.get("occurred_at"):
        data["occurred_at"] = datetime.now(timezone.utc)
    return UnifiedRecommendationEvent.model_validate(data)


__all__ = ["normalize_raw_unified_event"]
