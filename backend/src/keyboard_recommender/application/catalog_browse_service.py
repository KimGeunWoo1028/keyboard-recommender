"""Read-only catalog browse over in-memory seed parts (catalog_sample + cases seed)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.catalog_seed_images import resolve_seed_row_image_url
from keyboard_recommender.catalog.catalog_browse_policy import (
    apply_browse_list_policy,
    is_browse_listable_part,
    is_browse_listed_seed_row,
    is_layout_archetype_part_id,
    sanitize_layout_browse_detail,
)
from keyboard_recommender.catalog.metadata_mapping import derive_case_traits
from keyboard_recommender.catalog.metadata_models import CaseMetadata
from keyboard_recommender.catalog.swagkey_source_url import load_swagkey_url_resolver, resolve_source_url, seed_row_index
from keyboard_recommender.schemas.catalog import CatalogListResponse, CatalogPartDetail, CatalogPartSummary
from keyboard_recommender.trait_engine import catalog_sample
from keyboard_recommender.trait_engine.models import KeyboardPart

CatalogFamily = Literal["switch", "plate", "foam", "layout", "case", "keycap"]

_SEED_PATH = Path(__file__).resolve().parents[1] / "catalog" / "swagkey_products.seed.json"
_INVENTORY_PATH = Path(__file__).resolve().parents[3] / "data" / "swagkey_inventory" / "swagkey_inventory.v2.json"
_DIFF_PATH = Path(__file__).resolve().parents[3] / "data" / "swagkey_inventory" / "seed_inventory_diff.json"

_FAMILY_PARTS: dict[str, list[KeyboardPart]] = catalog_sample.load_browse_seed_parts()

_BROWSE_KEYCAP_DEFAULT_SCOPES = frozenset({"full", "base", "noveset"})
_BROWSE_KEYCAP_ADDON_SCOPES = frozenset({"addon", "alpha", "mod"})

_CASE_DESCRIPTIONS: dict[str, str] = {
    "kit": "베어본/키트 형태로 PCB·케이스 중심의 커스텀 키보드 구성입니다.",
    "barebone": "조립형 베어본 키트로, 스위치·키캡 등을 직접 선택해 완성하는 타입입니다.",
    "complete": "스위치·키캡 등이 포함된 완제품 또는 준완성 세트입니다.",
    "parts": "케이스 파츠·하우징 등 부분 교체/확장용 구성입니다.",
    "he_kit": "마그네틱(HE) 호환 키보드 킷/베어본 구성입니다.",
}


def _keycap_kit_scope(seed_row: dict[str, Any]) -> str:
    meta = seed_row.get("metadata")
    if isinstance(meta, dict):
        scope = str(meta.get("kit_scope") or "").strip().lower()
        if scope:
            return scope
    return str(seed_row.get("subtype") or "").strip().lower()


def _keycap_matches_subtype_filter(seed_row: dict[str, Any], subtype_filter: str) -> bool:
    scope = _keycap_kit_scope(seed_row)
    if subtype_filter == "all":
        return True
    if not subtype_filter:
        return scope in _BROWSE_KEYCAP_DEFAULT_SCOPES or scope == ""
    if subtype_filter == "full":
        return scope in {"full", "noveset"}
    if subtype_filter == "base":
        return scope == "base"
    if subtype_filter == "addon":
        return scope in _BROWSE_KEYCAP_ADDON_SCOPES
    return scope == subtype_filter


@lru_cache(maxsize=1)
def _swagkey_url_resolver():
    return load_swagkey_url_resolver(_INVENTORY_PATH, diff_path=_DIFF_PATH)


def _resolved_source_url(name: str, url: str, *, seed_id: str = "", inventory_id: str = "") -> str:
    return resolve_source_url(
        name,
        url,
        resolver=_swagkey_url_resolver(),
        seed_id=seed_id,
        inventory_id=inventory_id,
    )


@lru_cache(maxsize=1)
def _seed_payload() -> dict[str, Any]:
    if not _SEED_PATH.is_file():
        return {}
    try:
        return json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


@lru_cache(maxsize=1)
def _seed_row_index() -> dict[tuple[str, str], dict[str, Any]]:
    return seed_row_index()


@lru_cache(maxsize=1)
def _case_seed_rows() -> tuple[dict[str, Any], ...]:
    rows = _seed_payload().get("cases")
    if not isinstance(rows, list):
        return ()
    return tuple(row for row in rows if isinstance(row, dict) and str(row.get("id") or "").strip())


def _seed_row(family: CatalogFamily, part_id: str) -> dict[str, Any]:
    return dict(_seed_row_index().get((family, part_id), {}))


def _seed_image_url(row: dict[str, Any]) -> str:
    return resolve_seed_row_image_url(row)


def _part_subtype(part: KeyboardPart, seed_row: dict[str, Any]) -> str:
    explicit = str(seed_row.get("subtype") or "").strip()
    if explicit:
        return explicit
    return str(part.family)


def part_to_summary(part: KeyboardPart, *, seed_row: dict[str, Any] | None = None) -> CatalogPartSummary:
    row = seed_row or {}
    family = str(part.family)
    layout_size: str | None = None
    compatible_layout_sizes: list[str] = []
    if family == "case":
        layout_size, compatible_layout_sizes = _case_layout_tags(row)
    return CatalogPartSummary(
        id=part.id,
        name=part.name,
        description=part.description,
        family=part.family,  # type: ignore[arg-type]
        subtype=_part_subtype(part, row),
        source_url=_resolved_source_url(
            part.name,
            str(row.get("sourceUrl") or row.get("source_url") or "").strip(),
            seed_id=part.id,
            inventory_id=str(row.get("inventoryId") or "").strip(),
        ),
        image_url=_seed_image_url(row),
        popularity_weight=float(part.popularity_weight),
        layout_size=layout_size,
        compatible_layout_sizes=compatible_layout_sizes,
        reference_layout=is_layout_archetype_part_id(part.id) if family == "layout" else False,
    )


def part_to_detail(part: KeyboardPart, *, seed_row: dict[str, Any] | None = None) -> CatalogPartDetail:
    row = seed_row or {}
    summary = part_to_summary(part, seed_row=row)
    metadata = dict(part.metadata) if isinstance(part.metadata, dict) else {}
    traits = {str(k): float(v) for k, v in dict(part.traits).items()}
    return CatalogPartDetail(
        **summary.model_dump(by_alias=False),
        traits=traits,
        metadata=metadata,
    )


def _case_layout_tags(row: dict[str, Any]) -> tuple[str | None, list[str]]:
    metadata = row.get("metadata")
    if not isinstance(metadata, dict):
        return None, []
    primary = str(metadata.get("layout_size") or "").strip() or None
    compat_raw = metadata.get("compatible_layout_sizes")
    sizes: list[str] = []
    if isinstance(compat_raw, list):
        sizes = [str(item).strip() for item in compat_raw if str(item).strip()]
    if primary:
        if primary not in sizes:
            sizes = [primary, *sizes]
    elif sizes:
        primary = sizes[0]
    return primary, sizes


def _case_row_matches_layout_size(row: dict[str, Any], layout_size: str) -> bool:
    needle = str(layout_size or "").strip()
    if not needle:
        return True
    _, sizes = _case_layout_tags(row)
    return needle in sizes


def _case_row_to_summary(row: dict[str, Any]) -> CatalogPartSummary:
    subtype = str(row.get("subtype") or "kit").strip()
    layout_size, compatible_layout_sizes = _case_layout_tags(row)
    return CatalogPartSummary(
        id=str(row["id"]),
        name=str(row.get("name") or ""),
        description=_CASE_DESCRIPTIONS.get(subtype, _CASE_DESCRIPTIONS["kit"]),
        family="case",
        subtype=subtype,
        source_url=_resolved_source_url(
            str(row.get("name") or ""),
            str(row.get("sourceUrl") or "").strip(),
            seed_id=str(row.get("id") or ""),
            inventory_id=str(row.get("inventoryId") or "").strip(),
        ),
        image_url=_seed_image_url(row),
        popularity_weight=1.0,
        layout_size=layout_size,
        compatible_layout_sizes=compatible_layout_sizes,
        reference_layout=False,
    )


def _case_row_to_detail(row: dict[str, Any]) -> CatalogPartDetail:
    summary = _case_row_to_summary(row)
    metadata = dict(row.get("metadata") or {})
    meta = CaseMetadata.model_validate(metadata)
    traits = {str(k): float(v) for k, v in derive_case_traits(meta).items()}
    return CatalogPartDetail(
        **summary.model_dump(by_alias=False),
        traits=traits,
        metadata=meta.model_dump(exclude_none=True),
    )


def _normalize_query(q: str | None) -> str:
    return str(q or "").strip().lower()


def _text_matches(needle: str, *fields: str) -> bool:
    if not needle:
        return True
    hay = " ".join(str(f or "") for f in fields).lower()
    return needle in hay


def list_catalog_parts(
    family: CatalogFamily,
    *,
    subtype: str | None = None,
    layout_size: str | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> CatalogListResponse:
    subtype_filter = str(subtype or "").strip().lower()
    layout_size_filter = str(layout_size or "").strip()
    query = _normalize_query(q)
    safe_limit = max(1, min(int(limit), 200))
    safe_offset = max(0, int(offset))

    if family == "case":
        rows = list(_case_seed_rows())
        if subtype_filter:
            rows = [r for r in rows if str(r.get("subtype") or "").strip().lower() == subtype_filter]
        if query:
            rows = [
                r
                for r in rows
                if _text_matches(
                    query,
                    str(r.get("name") or ""),
                    str(r.get("id") or ""),
                    str(r.get("subtype") or ""),
                )
            ]
        if layout_size_filter:
            rows = [r for r in rows if _case_row_matches_layout_size(r, layout_size_filter)]
        rows = [
            r
            for r in rows
            if is_browse_listable_part("case", str(r.get("id") or ""), str(r.get("sourceUrl") or ""))
            and is_browse_listed_seed_row(r)
        ]
        summaries = [_case_row_to_summary(r) for r in rows]
        summaries = apply_browse_list_policy("case", summaries)
        total = len(summaries)
        page = summaries[safe_offset : safe_offset + safe_limit]
        return CatalogListResponse(
            family=family,
            items=page,
            total=total,
            limit=safe_limit,
            offset=safe_offset,
            subtype=subtype_filter or None,
            layout_size=layout_size_filter or None,
        )

    parts = list(_FAMILY_PARTS.get(family, []))
    if query:
        parts = [
            p
            for p in parts
            if _text_matches(query, p.name, p.id, p.description, _part_subtype(p, _seed_row(family, p.id)))
        ]

    parts = [
        p
        for p in parts
        if is_browse_listable_part(
            family,
            p.id,
            str(_seed_row(family, p.id).get("sourceUrl") or _seed_row(family, p.id).get("source_url") or ""),
        )
        and is_browse_listed_seed_row(_seed_row(family, p.id))
    ]
    summaries = [part_to_summary(p, seed_row=_seed_row(family, p.id)) for p in parts]
    summaries = apply_browse_list_policy(family, summaries)
    if family == "keycap":
        summaries = [
            summary
            for summary in summaries
            if _keycap_matches_subtype_filter(_seed_row(family, summary.id), subtype_filter)
        ]
    elif subtype_filter:
        summaries = [s for s in summaries if str(s.subtype or "").strip().lower() == subtype_filter]
    total = len(summaries)
    page = summaries[safe_offset : safe_offset + safe_limit]
    return CatalogListResponse(
        family=family,
        items=page,
        total=total,
        limit=safe_limit,
        offset=safe_offset,
        subtype=subtype_filter or None,
        layout_size=layout_size_filter or None if family == "case" else None,
    )


def resolve_catalog_source_url(domain: str, item_id: str, *, item_name: str = "") -> str:
    """Re-export for callers that import from catalog browse application layer."""
    from keyboard_recommender.catalog import swagkey_source_url

    return swagkey_source_url.resolve_catalog_source_url(domain, item_id, item_name=item_name)


def get_catalog_part(family: CatalogFamily, part_id: str) -> CatalogPartDetail | None:
    needle = str(part_id or "").strip()
    if not needle:
        return None
    if family == "case":
        for row in _case_seed_rows():
            if str(row.get("id") or "") == needle:
                if not is_browse_listable_part("case", needle, str(row.get("sourceUrl") or "")):
                    return None
                if not is_browse_listed_seed_row(row):
                    return None
                return _case_row_to_detail(row)
        return None
    for part in _FAMILY_PARTS.get(family, []):
        if part.id == needle:
            row = _seed_row(family, part.id)
            if not is_browse_listable_part(
                family,
                needle,
                str(row.get("sourceUrl") or row.get("source_url") or ""),
            ):
                return None
            if not is_browse_listed_seed_row(row):
                return None
            detail = part_to_detail(part, seed_row=row)
            if family == "layout" and is_layout_archetype_part_id(needle):
                return sanitize_layout_browse_detail(detail)
            return detail
    return None
