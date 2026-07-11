"""DTOs for seed-backed catalog browse APIs."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CatalogPartSummary(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    name: str
    description: str = ""
    family: str
    subtype: str = ""
    source_url: str = Field(default="", alias="sourceUrl")
    image_url: str = Field(default="", alias="imageUrl")
    popularity_weight: float = Field(default=1.0, alias="popularityWeight")
    layout_size: str | None = Field(default=None, alias="layoutSize")
    compatible_layout_sizes: list[str] = Field(default_factory=list, alias="compatibleLayoutSizes")
    reference_layout: bool = Field(default=False, alias="referenceLayout")


class CatalogPartDetail(CatalogPartSummary):
    traits: dict[str, float] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CatalogListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    family: str
    items: list[CatalogPartSummary] = Field(default_factory=list)
    total: int = 0
    limit: int = 50
    offset: int = 0
    subtype: str | None = None
    layout_size: str | None = Field(default=None, alias="layoutSize")
