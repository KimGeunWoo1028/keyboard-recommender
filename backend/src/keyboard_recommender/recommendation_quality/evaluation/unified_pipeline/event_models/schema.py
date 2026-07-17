"""Canonical unified event envelope (versioned JSON, persisted under ``eval_events.payload``)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

UNIFIED_EVENT_SCHEMA_VERSION = "recommendation.unified_event.v1"

UnifiedEventType = Literal[
    "recommendation.request",
    "kpi.time_to_first_result",
    "interaction.click",
    "interaction.bookmark",
    "interaction.comparison",
    "interaction.feedback",
    "interaction.refinement",
    "interaction.retry",
    "interaction.degraded_fallback",
    "interaction.last_known_good_restore",
    "interaction.nl_vocab_signal",
    "interaction.acceptance",
    "interaction.rejection",
    "interaction.revisit",
    "interaction.repeated_view",
    "interaction.results_tab_click",
    "interaction.collection_tag",
    "onboarding.viewed",
    "onboarding.style_selected",
    "onboarding.prefilled_step_skipped",
    "onboarding.step_completed",
    "onboarding.generate_started",
    "onboarding.completed",
    "onboarding.abandoned",
    # Home Landing entry — Phase 5 data prerequisite (not a product unlock).
    "home.viewed",
]


class UnifiedRecommendationEvent(BaseModel):
    """
    Single envelope for client + server recommendation analytics.

    ``metadata`` holds extensible context (e.g. ``evalRunId``, ``targetId``, ``rating``).
    """

    model_config = ConfigDict(extra="forbid")

    schema_version: str = Field(default=UNIFIED_EVENT_SCHEMA_VERSION, min_length=1)
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    request_id: str = Field(min_length=1, max_length=128)
    session_id: str | None = Field(default=None, max_length=128)
    scenario_id: str | None = Field(default=None, max_length=256)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: UnifiedEventType
    metadata: dict[str, Any] = Field(default_factory=dict)
