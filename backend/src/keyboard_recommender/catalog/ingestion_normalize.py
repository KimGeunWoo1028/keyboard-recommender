"""Normalization utilities for ingestion records."""

from __future__ import annotations

import re
from typing import Any

from keyboard_recommender.catalog.ingestion_models import NormalizedCatalogRecord, RawCatalogRecord

_SPACE_RE = re.compile(r"\s+")
_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")

_MATERIAL_MAP: dict[str, str] = {
    "aluminum": "Aluminum",
    "alu": "Aluminum",
    "fr4": "FR4",
    "fr-4": "FR4",
    "polycarbonate": "PC",
    "pc": "PC",
    "pom": "POM",
    "brass": "Brass",
    "nylon": "Nylon",
    "u4t": "U4T",
    "uhmwpe": "UHMWPE",
}

_LAYOUT_MAP: dict[str, str] = {
    "tkl": "80_tkl",
    "80%": "80_tkl",
    "full-size": "full",
    "fullsize": "full",
    "alice layout": "alice",
    "split layout": "split",
}


def normalize_name(name: str) -> str:
    return _SPACE_RE.sub(" ", str(name).strip())


def _as_float(v: Any) -> float | None:
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v or "").strip()
    if not s:
        return None
    m = _NUM_RE.search(s)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def normalize_material(value: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    key = raw.lower().replace("_", "").replace("-", "")
    if key in _MATERIAL_MAP:
        return _MATERIAL_MAP[key]
    return raw


def normalize_layout_name(value: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    lowered = raw.lower()
    if lowered in _LAYOUT_MAP:
        return _LAYOUT_MAP[lowered]
    return raw


def normalize_tags(values: Any) -> tuple[str, ...]:
    if not isinstance(values, list):
        return ()
    out: list[str] = []
    for v in values:
        s = str(v).strip().lower()
        if s and s not in out:
            out.append(s)
    return tuple(out)


def normalize_aliases(values: Any) -> tuple[str, ...]:
    if not isinstance(values, list):
        return ()
    out: list[str] = []
    for v in values:
        s = normalize_name(str(v))
        if s and s not in out:
            out.append(s)
    return tuple(out)


def normalize_metadata(family: str, metadata: dict[str, Any]) -> dict[str, Any]:
    out = dict(metadata)
    if "material" in out:
        mat = normalize_material(out.get("material"))
        if mat:
            out["material"] = mat
    if "housing_material_top" in out:
        mat = normalize_material(out.get("housing_material_top"))
        if mat:
            out["housing_material_top"] = mat
    if "housing_material_bottom" in out:
        mat = normalize_material(out.get("housing_material_bottom"))
        if mat:
            out["housing_material_bottom"] = mat
    if "stem_material" in out:
        mat = normalize_material(out.get("stem_material"))
        if mat:
            out["stem_material"] = mat
    for key in ("spring_weight_g", "bottom_out_force_g", "travel_distance_mm", "pretravel_mm"):
        if key in out:
            val = _as_float(out.get(key))
            if val is not None:
                out[key] = val
    if "layout_size" in out:
        layout_size = normalize_layout_name(out.get("layout_size"))
        if layout_size:
            out["layout_size"] = layout_size
    if "sound_signature_tags" in out:
        out["sound_signature_tags"] = list(normalize_tags(out.get("sound_signature_tags")))
    if family in {"plate", "foam"}:
        for key in ("compatible_layout_sizes",):
            if key in out and isinstance(out[key], list):
                out[key] = [normalize_layout_name(x) or str(x) for x in out[key]]
        if "compatible_standards" in out and isinstance(out["compatible_standards"], list):
            out["compatible_standards"] = [str(x).strip().lower() for x in out["compatible_standards"] if str(x).strip()]
    return out


def normalize_record(row: RawCatalogRecord) -> NormalizedCatalogRecord:
    return NormalizedCatalogRecord(
        source_type=row.source_type,
        source_path=row.source_path,
        family=row.family,
        item_id=str(row.item_id).strip(),
        name=normalize_name(row.name),
        subtype=str(row.subtype or row.family).strip().lower(),
        metadata=normalize_metadata(row.family, row.metadata),
        source_url=str(row.source_url or "").strip(),
        tags=normalize_tags(list(row.tags)),
        aliases=normalize_aliases(list(row.aliases)),
    )

