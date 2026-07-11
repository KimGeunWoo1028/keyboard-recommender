"""Resolve served image URLs for catalog browse and recommendation picks from seed rows."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id, resolve_layout_archetype_diagram_url
from keyboard_recommender.catalog.swagkey_source_url import seed_row_index
from keyboard_recommender.config.settings import get_settings
from keyboard_recommender.infrastructure.swagkey_images import resolve_served_image_url, swagkey_images_dir


@lru_cache(maxsize=1)
def _seed_row_index() -> dict[tuple[str, str], dict[str, Any]]:
    return seed_row_index()


def resolve_seed_row_image_url(row: dict[str, Any]) -> str:
    """Return local mirror or CDN URL for a seed row; empty when missing."""
    if not row:
        return ""
    cdn_url = str(row.get("imageUrl") or row.get("image_url") or "").strip()
    if not cdn_url:
        return ""
    source_url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
    return resolve_served_image_url(cdn_url, source_url, swagkey_images_dir(get_settings()))


def resolve_part_image_url(domain: str, part_id: str) -> str:
    """Lookup image URL: layout archetypes use diagrams; layout products use seed mirror/CDN."""
    family = str(domain or "").strip().lower()
    needle = str(part_id or "").strip()
    if not needle:
        return ""
    if family == "layout" and is_layout_archetype_part_id(needle):
        return resolve_layout_archetype_diagram_url(needle)
    row = dict(_seed_row_index().get((family, needle), {}))
    return resolve_seed_row_image_url(row)
