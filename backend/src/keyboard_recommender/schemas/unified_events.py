"""HTTP payloads for unified recommendation event ingestion."""

from __future__ import annotations

from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field


class UnifiedEventsIngestBody(BaseModel):
    """Batch POST body for ``POST /recommendations/events``."""

    model_config = ConfigDict(extra="forbid")

    events: Annotated[list[dict[str, Any]], Field(min_length=1, max_length=64)]


class UnifiedEventsIngestResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stored: int = Field(ge=0)
    skipped: bool = False
    reason: str | None = None
