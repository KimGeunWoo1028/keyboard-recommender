"""Helpers for merging scraped switch specs into normalized seed metadata."""

from __future__ import annotations

import re
from typing import Any


_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    m = _NUM_RE.search(text)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def normalize_switch_spec(spec: dict[str, Any]) -> dict[str, Any]:
    """Convert scraped free-form spec into seed metadata keys."""
    out: dict[str, Any] = {}
    spring = _to_float(spec.get("spring_weight_g") or spec.get("spring_weight") or spec.get("spring"))
    bottom = _to_float(spec.get("bottom_out_force_g") or spec.get("bottom_out_force") or spec.get("bottom_out"))
    travel = _to_float(spec.get("travel_distance_mm") or spec.get("travel") or spec.get("total_travel"))
    pre = _to_float(spec.get("pretravel_mm") or spec.get("pretravel") or spec.get("actuation"))
    if spring is not None:
        out["spring_weight_g"] = spring
    if bottom is not None:
        out["bottom_out_force_g"] = bottom
    if travel is not None:
        out["travel_distance_mm"] = travel
    if pre is not None:
        out["pretravel_mm"] = pre

    for src, dst in (
        ("long_pole", "long_pole"),
        ("factory_lubed", "factory_lubed"),
        ("spring_type", "spring_type"),
        ("housing_material_top", "housing_material_top"),
        ("housing_material_bottom", "housing_material_bottom"),
        ("stem_material", "stem_material"),
    ):
        if src in spec and spec[src] is not None:
            out[dst] = spec[src]

    tags = spec.get("sound_signature_tags")
    if isinstance(tags, list):
        out["sound_signature_tags"] = [str(t).strip().lower() for t in tags if str(t).strip()]
    elif isinstance(spec.get("sound_signature"), str):
        raw = spec["sound_signature"].replace("/", ",")
        out["sound_signature_tags"] = [s.strip().lower() for s in raw.split(",") if s.strip()]
    return out


def merge_switch_specs_into_seed(seed_payload: dict[str, Any], specs_payload: dict[str, Any]) -> dict[str, Any]:
    """
    Merge external switch specs into seed JSON.

    specs_payload format:
    {
      "switches": [
        {"id": "sw-linear-001", ...spec fields...},
        ...
      ]
    }
    """
    switches = specs_payload.get("switches")
    if not isinstance(switches, list):
        return seed_payload

    by_id: dict[str, dict[str, Any]] = {}
    for row in switches:
        if not isinstance(row, dict):
            continue
        sid = str(row.get("id") or "").strip()
        if not sid:
            continue
        by_id[sid] = normalize_switch_spec(row)

    seed_switches = seed_payload.get("switches")
    if not isinstance(seed_switches, dict):
        return seed_payload

    for subtype_rows in seed_switches.values():
        if not isinstance(subtype_rows, list):
            continue
        for row in subtype_rows:
            if not isinstance(row, dict):
                continue
            sid = str(row.get("id") or "").strip()
            if not sid or sid not in by_id:
                continue
            existing = row.get("metadata")
            meta = dict(existing) if isinstance(existing, dict) else {}
            meta.update(by_id[sid])
            row["metadata"] = meta

    return seed_payload


def normalize_plate_spec(spec: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if isinstance(spec.get("material"), str):
        out["material"] = str(spec["material"]).strip()
    flex = _to_float(spec.get("flex_rating") or spec.get("flex"))
    if flex is not None:
        out["flex_rating"] = max(1, min(10, int(round(flex))))
    for src, dst in (
        ("mounting_bias", "mounting_bias"),
        ("density_character", "density_character"),
        ("supports_blockers", "supports_blockers"),
        ("supports_exploded", "supports_exploded"),
    ):
        if src in spec and spec[src] is not None:
            out[dst] = spec[src]
    for src, dst in (
        ("compatible_layout_sizes", "compatible_layout_sizes"),
        ("compatible_standards", "compatible_standards"),
        ("mounting_support", "mounting_support"),
    ):
        val = spec.get(src)
        if isinstance(val, list):
            out[dst] = [str(x).strip().lower() for x in val if str(x).strip()]
    return out


def normalize_foam_spec(spec: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    damp = _to_float(spec.get("dampening_strength"))
    if damp is not None:
        out["dampening_strength"] = max(1, min(10, int(round(damp))))
    for src, dst in (
        ("compression_character", "compression_character"),
        ("placement_type", "placement_type"),
        ("tactile_preservation", "tactile_preservation"),
    ):
        if src in spec and spec[src] is not None:
            out[dst] = spec[src]
    for src, dst in (
        ("compatible_layout_sizes", "compatible_layout_sizes"),
        ("mounting_compatibility", "mounting_compatibility"),
    ):
        val = spec.get(src)
        if isinstance(val, list):
            out[dst] = [str(x).strip().lower() for x in val if str(x).strip()]
    return out


def merge_component_specs_into_seed(seed_payload: dict[str, Any], specs_payload: dict[str, Any]) -> dict[str, Any]:
    for family, normalizer in (("plates", normalize_plate_spec), ("foams", normalize_foam_spec)):
        rows = specs_payload.get(family)
        if not isinstance(rows, list):
            continue
        by_id: dict[str, dict[str, Any]] = {}
        for row in rows:
            if not isinstance(row, dict):
                continue
            sid = str(row.get("id") or "").strip()
            if not sid:
                continue
            by_id[sid] = normalizer(row)
        seed_rows = seed_payload.get(family)
        if not isinstance(seed_rows, list):
            continue
        for row in seed_rows:
            if not isinstance(row, dict):
                continue
            sid = str(row.get("id") or "").strip()
            if not sid or sid not in by_id:
                continue
            existing = row.get("metadata")
            meta = dict(existing) if isinstance(existing, dict) else {}
            meta.update(by_id[sid])
            row["metadata"] = meta
    return seed_payload

