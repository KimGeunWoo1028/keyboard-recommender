"""DTOs for out-of-scope Swagkey full catalog browse APIs."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

FullCatalogCategory = Literal["keycap", "accessory", "deskpad", "gaming", "merch", "other"]


class FullCatalogItemSummary(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    name: str
    brand: str = ""
    swagkey_category: str = Field(default="", alias="swagkeyCategory")
    catalog_category: FullCatalogCategory = Field(alias="catalogCategory")
    source_url: str = Field(default="", alias="sourceUrl")
    in_recommendation_pool: bool = Field(default=False, alias="inRecommendationPool")


class FullCatalogItemDetail(FullCatalogItemSummary):
    inventory_id: str = Field(default="", alias="inventoryId")
    rule_id: str = Field(default="", alias="ruleId")
    matched_keywords: list[str] = Field(default_factory=list, alias="matchedKeywords")


class FullCatalogListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    items: list[FullCatalogItemSummary] = Field(default_factory=list)
    total: int = 0
    limit: int = 50
    offset: int = 0
    catalog_category: str | None = Field(default=None, alias="catalogCategory")
    stats: dict[str, int | dict[str, int]] = Field(default_factory=dict)
