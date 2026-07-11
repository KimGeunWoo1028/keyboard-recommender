"""Browse routes for out-of-scope Swagkey full catalog (keycaps, accessories, etc.)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from keyboard_recommender.application.full_catalog_browse_service import (
    get_full_catalog_item,
    list_full_catalog_items,
)
from keyboard_recommender.schemas.catalog_full import (
    FullCatalogCategory,
    FullCatalogItemDetail,
    FullCatalogListResponse,
)

router = APIRouter(prefix="/catalog/full", tags=["catalog-full"])


@router.get(
    "",
    response_model=FullCatalogListResponse,
    summary="키캡·액세서리 등 full catalog 목록 (추천 풀 제외)",
)
def list_full_catalog(
    catalog_category: FullCatalogCategory | None = Query(
        default=None,
        alias="catalogCategory",
        description="keycap, accessory, deskpad, gaming, merch, other",
    ),
    q: str | None = Query(default=None, min_length=1, max_length=120, description="이름·브랜드 검색"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> FullCatalogListResponse:
    return list_full_catalog_items(catalog_category=catalog_category, q=q, limit=limit, offset=offset)


@router.get(
    "/{part_id}",
    response_model=FullCatalogItemDetail,
    summary="full catalog 항목 상세",
)
def get_full_catalog(part_id: str) -> FullCatalogItemDetail:
    detail = get_full_catalog_item(part_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"full catalog item not found: {part_id}")
    return detail
