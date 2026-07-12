"""Browse-only catalog policy: dedup by Swagkey idx, drop dead links, layout reference mode."""

from __future__ import annotations

import re

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id, resolve_layout_archetype_diagram_url
from keyboard_recommender.schemas.catalog import CatalogPartDetail, CatalogPartSummary

_IDX_RE = re.compile(r"idx=(\d+)", re.IGNORECASE)

# Live-verified Swagkey product pages that return HTTP 404 (discontinued / removed).
# Verified 2026-07-10: prior 3 (384, 1589, 1216) + switch remediation batch (8 no-image + Gateron X).
BROWSE_EXCLUDED_SWAGKEY_IDX: frozenset[str] = frozenset(
    {
        "384",
        "1187",
        "1206",
        "1216",
        "1340",
        "1496",
        "1589",
        "1658",
        "1667",
        "1668",
        "1673",
        "1677",
    }
)

_PRODUCT_FAMILIES = frozenset({"switch", "plate", "foam", "case", "keycap"})


def swagkey_product_idx(source_url: str) -> str:
    match = _IDX_RE.search(str(source_url or ""))
    return match.group(1) if match else ""


def is_browse_excluded_source_url(source_url: str) -> bool:
    idx = swagkey_product_idx(source_url)
    return bool(idx) and idx in BROWSE_EXCLUDED_SWAGKEY_IDX


def is_browse_listed_seed_row(row: dict) -> bool:
    """Respect seed ``browse.listed: false`` (operator unlist without deleting row)."""
    browse = row.get("browse")
    if isinstance(browse, dict) and browse.get("listed") is False:
        return False
    return True


def _canonical_rank(summary: CatalogPartSummary) -> tuple[int, int, int, int, str]:
    has_image = 0 if str(summary.image_url or "").strip() else 1
    legacy_id = 0 if "-new-" not in summary.id else 1
    name_noise = 1 if str(summary.name or "").startswith("텍스트") else 0
    return (has_image, legacy_id, name_noise, len(summary.id), summary.id)


def sort_browse_summaries(family: str, items: list[CatalogPartSummary]) -> list[CatalogPartSummary]:
    """Image-first browse ordering; layout archetypes before real PCB products."""
    if family == "layout":
        return sorted(
            items,
            key=lambda item: (
                0 if is_layout_archetype_part_id(item.id) else 1,
                *_canonical_rank(item),
            ),
        )
    return sorted(items, key=_canonical_rank)


def _dedup_key(summary: CatalogPartSummary) -> str:
    idx = swagkey_product_idx(summary.source_url)
    if idx:
        return f"idx:{idx}"
    return f"id:{summary.id}"


def dedupe_browse_summaries(items: list[CatalogPartSummary]) -> list[CatalogPartSummary]:
    """Keep one card per Swagkey product idx (fallback: unique id without idx)."""
    winners: dict[str, CatalogPartSummary] = {}
    order: list[str] = []
    for item in items:
        key = _dedup_key(item)
        existing = winners.get(key)
        if existing is None:
            winners[key] = item
            order.append(key)
            continue
        if _canonical_rank(item) < _canonical_rank(existing):
            winners[key] = item
    return [winners[key] for key in order]


def sanitize_layout_browse_summary(summary: CatalogPartSummary) -> CatalogPartSummary:
    """Layouts are reference archetypes — diagram only, no Swagkey purchase link in browse."""
    diagram = resolve_layout_archetype_diagram_url(summary.id)
    return summary.model_copy(update={"source_url": "", "image_url": diagram})


def sanitize_layout_browse_detail(detail: CatalogPartDetail) -> CatalogPartDetail:
    sanitized = sanitize_layout_browse_summary(detail)
    return detail.model_copy(
        update={
            "source_url": sanitized.source_url,
            "image_url": sanitized.image_url,
        },
    )


def apply_browse_list_policy(
    family: str,
    items: list[CatalogPartSummary],
) -> list[CatalogPartSummary]:
    visible = [item for item in items if not is_browse_excluded_source_url(item.source_url)]
    if family in _PRODUCT_FAMILIES:
        visible = dedupe_browse_summaries(visible)
    if family == "layout":
        visible = [
            sanitize_layout_browse_summary(item) if is_layout_archetype_part_id(item.id) else item
            for item in visible
        ]
    return sort_browse_summaries(family, visible)


def is_browse_listable_part(family: str, part_id: str, source_url: str = "") -> bool:
    if is_browse_excluded_source_url(source_url):
        return False
    return True
