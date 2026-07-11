"""Catalog browse routes for keyboard cases / kits."""

from __future__ import annotations

from fastapi import APIRouter, Query

from keyboard_recommender.api.v1.catalog_handlers import catalog_detail_handler, catalog_list_handler
from keyboard_recommender.schemas.catalog import CatalogListResponse, CatalogPartDetail

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get(
    "",
    response_model=CatalogListResponse,
    summary="키보드 케이스/키트 카탈로그 목록",
)
def list_cases(
    subtype: str | None = Query(default=None, description="kit, barebone, complete, parts, he_kit"),
    layout_size: str | None = Query(
        default=None,
        alias="layoutSize",
        description="호환 레이아웃 크기 (60, 65, 75, 80_tkl, full, alice, split 등)",
    ),
    q: str | None = Query(default=None, min_length=1, max_length=120, description="이름·ID 검색"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> CatalogListResponse:
    return catalog_list_handler(
        "case",
        subtype=subtype,
        layout_size=layout_size,
        q=q,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{part_id}",
    response_model=CatalogPartDetail,
    summary="키보드 케이스/키트 상세",
)
def get_case(part_id: str) -> CatalogPartDetail:
    return catalog_detail_handler("case", part_id)
