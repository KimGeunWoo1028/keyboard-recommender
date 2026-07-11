"""Deterministic parsing rules for unified interaction payloads (no ML)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any


def extract_domain_and_item(meta: Mapping[str, Any]) -> tuple[str | None, str | None]:
    domain = meta.get("domain") or meta.get("itemDomain")
    if domain is not None:
        domain = str(domain).strip().lower() or None
    item = (
        meta.get("itemId")
        or meta.get("targetId")
        or meta.get("switchId")
        or meta.get("plateId")
        or meta.get("foamId")
        or meta.get("layoutId")
    )
    if item is not None:
        item = str(item).strip() or None
    return domain, item


def extract_comparison_item_ids(meta: Mapping[str, Any]) -> tuple[str | None, str | None]:
    """Support legacy a/b ids and UI ``leftItemId``/``rightItemId``."""
    a = meta.get("baselineItemId") or meta.get("aItemId") or meta.get("leftItemId")
    b = meta.get("treatmentItemId") or meta.get("bItemId") or meta.get("rightItemId")
    if a is not None:
        a = str(a).strip() or None
    if b is not None:
        b = str(b).strip() or None
    return a, b


def extract_family(meta: Mapping[str, Any]) -> str | None:
    fam = meta.get("switchFamily") or meta.get("family") or meta.get("switch_family")
    if fam is None:
        return None
    s = str(fam).strip().lower()
    return s or None


def is_negative_feedback(meta: Mapping[str, Any]) -> bool:
    if str(meta.get("sentiment", "")).strip().lower() in {"dislike", "down", "negative"}:
        return True
    rating = meta.get("rating")
    try:
        return float(rating) <= 2.0
    except (TypeError, ValueError):
        return False
