"""Shared handlers for seed-backed catalog browse routes."""

from __future__ import annotations

from fastapi import HTTPException, Query

from keyboard_recommender.application.catalog_browse_service import (
    CatalogFamily,
    get_catalog_part,
    list_catalog_parts,
)
from keyboard_recommender.schemas.catalog import CatalogListResponse, CatalogPartDetail


def catalog_list_handler(
    family: CatalogFamily,
    *,
    subtype: str | None = None,
    layout_size: str | None = None,
    q: str | None = Query(default=None, min_length=1, max_length=120, description="이름·ID 검색"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> CatalogListResponse:
    return list_catalog_parts(
        family,
        subtype=subtype,
        layout_size=layout_size,
        q=q,
        limit=limit,
        offset=offset,
    )


def catalog_detail_handler(family: CatalogFamily, part_id: str) -> CatalogPartDetail:
    detail = get_catalog_part(family, part_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"{family} part not found: {part_id}")
    return detail
