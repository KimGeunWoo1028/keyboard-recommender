"""Read-only browse over swagkey_catalog_full.json (out_of_scope inventory, not in seed)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from keyboard_recommender.application.catalog_browse_service import _normalize_query, _text_matches
from keyboard_recommender.schemas.catalog_full import (
    FullCatalogCategory,
    FullCatalogItemDetail,
    FullCatalogItemSummary,
    FullCatalogListResponse,
)

_FULL_CATALOG_PATH = (
    Path(__file__).resolve().parents[3] / "data" / "swagkey_inventory" / "swagkey_catalog_full.json"
)


@lru_cache(maxsize=1)
def _full_catalog_payload() -> dict[str, Any]:
    if not _FULL_CATALOG_PATH.is_file():
        return {}
    try:
        return json.loads(_FULL_CATALOG_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


@lru_cache(maxsize=1)
def _full_catalog_rows() -> tuple[dict[str, Any], ...]:
    items = _full_catalog_payload().get("items")
    if not isinstance(items, list):
        return ()
    return tuple(row for row in items if isinstance(row, dict) and str(row.get("id") or "").strip())


@lru_cache(maxsize=1)
def _full_catalog_stats() -> dict[str, Any]:
    stats = _full_catalog_payload().get("stats")
    return dict(stats) if isinstance(stats, dict) else {}


def _row_to_summary(row: dict[str, Any]) -> FullCatalogItemSummary:
    return FullCatalogItemSummary(
        id=str(row["id"]),
        name=str(row.get("name") or ""),
        brand=str(row.get("brand") or ""),
        swagkey_category=str(row.get("swagkeyCategory") or ""),
        catalog_category=row.get("catalogCategory"),  # type: ignore[arg-type]
        source_url=str(row.get("sourceUrl") or ""),
        in_recommendation_pool=bool(row.get("inRecommendationPool")),
    )


def _row_to_detail(row: dict[str, Any]) -> FullCatalogItemDetail:
    summary = _row_to_summary(row)
    return FullCatalogItemDetail(
        **summary.model_dump(by_alias=False),
        inventory_id=str(row.get("inventoryId") or ""),
        rule_id=str(row.get("ruleId") or ""),
        matched_keywords=[str(k) for k in list(row.get("matchedKeywords") or [])],
    )


def list_full_catalog_items(
    *,
    catalog_category: FullCatalogCategory | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> FullCatalogListResponse:
    category_filter = str(catalog_category or "").strip().lower()
    query = _normalize_query(q)
    safe_limit = max(1, min(int(limit), 200))
    safe_offset = max(0, int(offset))

    rows = list(_full_catalog_rows())
    if category_filter:
        rows = [r for r in rows if str(r.get("catalogCategory") or "").strip().lower() == category_filter]
    if query:
        rows = [
            r
            for r in rows
            if _text_matches(
                query,
                str(r.get("name") or ""),
                str(r.get("brand") or ""),
                str(r.get("id") or ""),
                str(r.get("swagkeyCategory") or ""),
            )
        ]

    total = len(rows)
    page = rows[safe_offset : safe_offset + safe_limit]
    return FullCatalogListResponse(
        items=[_row_to_summary(r) for r in page],
        total=total,
        limit=safe_limit,
        offset=safe_offset,
        catalog_category=category_filter or None,
        stats=_full_catalog_stats(),
    )


def get_full_catalog_item(part_id: str) -> FullCatalogItemDetail | None:
    needle = str(part_id or "").strip()
    if not needle:
        return None
    for row in _full_catalog_rows():
        if str(row.get("id") or "") == needle:
            return _row_to_detail(row)
    return None
