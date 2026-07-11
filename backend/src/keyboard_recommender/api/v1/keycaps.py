"""Catalog browse routes for keycaps."""

from __future__ import annotations

from fastapi import APIRouter, Query

from keyboard_recommender.api.v1.catalog_handlers import catalog_detail_handler, catalog_list_handler
from keyboard_recommender.schemas.catalog import CatalogListResponse, CatalogPartDetail

router = APIRouter(prefix="/keycaps", tags=["keycaps"])


@router.get(
    "",
    response_model=CatalogListResponse,
    summary="키캡 카탈로그 목록",
)
def list_keycaps(
    subtype: str | None = Query(default=None, description="base, complete, …"),
    q: str | None = Query(default=None, min_length=1, max_length=120, description="이름·ID 검색"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> CatalogListResponse:
    return catalog_list_handler("keycap", subtype=subtype, q=q, limit=limit, offset=offset)


@router.get(
    "/{part_id}",
    response_model=CatalogPartDetail,
    summary="키캡 상세",
)
def get_keycap(part_id: str) -> CatalogPartDetail:
    return catalog_detail_handler("keycap", part_id)
