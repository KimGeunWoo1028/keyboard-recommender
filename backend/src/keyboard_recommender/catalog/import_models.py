"""Pydantic shapes for **import-ready** JSON (admin CLI, future UI, ETL)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from keyboard_recommender.catalog.metadata_models import FoamMetadata, LayoutMetadata, PlateMetadata, SwitchMetadata


class TraitTierRow(BaseModel):
    """One trait cell authored as L/M/H."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    trait_id: str = Field(min_length=2, max_length=64)
    tier: Literal["low", "medium", "high"]


class CatalogComponentImport(BaseModel):
    """Shared envelope for bulk catalog payloads."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    family: Literal["switch", "plate", "foam", "layout", "case"]
    external_slug: str = Field(
        min_length=1,
        max_length=128,
        description="Stable id from vendor or your own namespace (duplicate detection).",
    )
    display_name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] = Field(default_factory=list)
    popularity_weight: float = Field(default=1.0, ge=0.05, le=10.0)
    traits: list[TraitTierRow] = Field(default_factory=list)
    metadata: SwitchMetadata | PlateMetadata | FoamMetadata | LayoutMetadata | None = None
    provenance: str = Field(
        default="manual_expert",
        description="manual_expert | review_suggestion | community_seed | import_batch",
    )

    @model_validator(mode="after")
    def _validate_metadata_family(self) -> "CatalogComponentImport":
        if self.metadata is None:
            return self
        if self.family == "switch" and not isinstance(self.metadata, SwitchMetadata):
            raise ValueError("metadata must use SwitchMetadata for family='switch'")
        if self.family == "plate" and not isinstance(self.metadata, PlateMetadata):
            raise ValueError("metadata must use PlateMetadata for family='plate'")
        if self.family == "foam" and not isinstance(self.metadata, FoamMetadata):
            raise ValueError("metadata must use FoamMetadata for family='foam'")
        if self.family == "layout" and not isinstance(self.metadata, LayoutMetadata):
            raise ValueError("metadata must use LayoutMetadata for family='layout'")
        return self
