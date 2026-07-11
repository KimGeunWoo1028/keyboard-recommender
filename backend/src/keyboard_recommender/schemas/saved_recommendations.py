"""HTTP DTOs for saving and listing user-facing recommended builds."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field


class SaveRecommendationRequest(BaseModel):
    """Persist one saved recommendation bookmark as an interaction event."""

    model_config = ConfigDict(extra="forbid")

    request_id: str = Field(min_length=1, max_length=128)
    session_id: str | None = Field(default=None, max_length=128)
    scenario_id: str | None = Field(default=None, max_length=256)
    build_id: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(default="", max_length=400)
    components: dict[str, str] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SavedRecommendationItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    saved_at: datetime
    request_id: str
    session_id: str | None = None
    scenario_id: str | None = None
    build_id: str
    title: str
    summary: str = ""
    components: dict[str, str] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SaveRecommendationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    saved: bool = True
    reason: str | None = None


class RemoveSavedRecommendationRequest(BaseModel):
    """Delete one saved recommendation bookmark entry."""

    model_config = ConfigDict(extra="forbid")

    request_id: str = Field(min_length=1, max_length=128)
    build_id: str = Field(min_length=1, max_length=128)
    saved_at: datetime | None = None


class RemoveSavedRecommendationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    removed: bool = True
    reason: str | None = None


class UpdateSavedRecommendationRequest(BaseModel):
    """Update metadata fields for one saved recommendation bookmark entry."""

    model_config = ConfigDict(extra="forbid")

    request_id: str = Field(min_length=1, max_length=128)
    build_id: str = Field(min_length=1, max_length=128)
    saved_at: datetime | None = None
    note: str = Field(default="", max_length=400)


class UpdateSavedRecommendationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    updated: bool = True
    reason: str | None = None


class SavedRecommendationsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: Annotated[list[SavedRecommendationItem], Field(default_factory=list)]


class RecommendationActivityItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    occurred_at: datetime
    event_type: str
    request_id: str | None = None
    session_id: str | None = None
    scenario_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class RecommendationActivityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: Annotated[list[RecommendationActivityItem], Field(default_factory=list)]


class RemoveRecommendationActivityRequest(BaseModel):
    """Delete one recommendation activity row by request + event type."""

    model_config = ConfigDict(extra="forbid")

    request_id: str = Field(min_length=1, max_length=128)
    event_type: str = Field(min_length=1, max_length=64)
    occurred_at: datetime | None = None


class RemoveRecommendationActivityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    removed: bool = True
    reason: str | None = None

