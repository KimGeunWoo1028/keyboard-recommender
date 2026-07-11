"""Merge new_in_crawl targets + scraped specs into swagkey seed (step ⑤)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.metadata_mapping import (
    derive_foam_traits,
    derive_layout_traits,
    derive_plate_traits,
    derive_switch_traits,
)
from keyboard_recommender.catalog.spec_enrichment import (
    merge_component_specs_into_seed,
    merge_switch_specs_into_seed,
    normalize_foam_spec,
    normalize_plate_spec,
    normalize_switch_spec,
)
from keyboard_recommender.catalog.validation import validate_component_metadata
from keyboard_recommender.trait_engine.catalog_sample import (
    _infer_foam_metadata,
    _infer_layout_metadata,
    _infer_plate_metadata,
    _infer_switch_metadata,
)

SeedFamily = Literal["plate", "foam", "layout", "switch"]
MERGE_FAMILY_ORDER: tuple[SeedFamily, ...] = ("plate", "foam", "layout", "switch")
_MANIFEST_FAMILY_KEYS: dict[SeedFamily, tuple[str, str]] = {
    "plate": ("compatTargets", "plates"),
    "foam": ("compatTargets", "foams"),
    "layout": ("layoutTargets", "layouts"),
    "switch": ("switchTargets", "switches"),
}
_SWITCH_SUBTYPES = ("linear", "tactile", "click", "silent", "magnetic", "other")
_HE_RE = re.compile(r"\bhe\b|hall[\s-]?effect", re.IGNORECASE)


@dataclass(slots=True)
class MergeReport:
    schema_version: str = "1.0.0"
    generated_at: str = ""
    before_counts: dict[str, int] = field(default_factory=dict)
    after_counts: dict[str, int] = field(default_factory=dict)
    added: dict[str, int] = field(default_factory=dict)
    skipped_existing: list[str] = field(default_factory=list)
    rejected: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "beforeCounts": self.before_counts,
            "afterCounts": self.after_counts,
            "added": self.added,
            "skippedExisting": self.skipped_existing,
            "rejected": self.rejected,
        }


def infer_switch_subtype(name: str, metadata: dict[str, Any] | None = None) -> str:
    """Infer switch bucket from product name (+ optional scraped metadata)."""
    n = name.lower()
    tags = {
        str(t).strip().lower()
        for t in (metadata or {}).get("sound_signature_tags", [])
        if str(t).strip()
    }
    if tags & {"magnetic"} or any(tok in n for tok in ("자석", "자석축", "magnetic")) or _HE_RE.search(n):
        return "magnetic"
    if tags & {"silent"} or "저소음" in n or "silent" in n:
        return "silent"
    if tags & {"click"} or any(tok in n for tok in ("흑축", "청축", "클릭", "click")):
        return "click"
    if tags & {"tactile"} or any(tok in n for tok in ("갈축", "택타일", "tactile")):
        return "tactile"
    if tags & {"linear"} or "리니어" in n or "linear" in n:
        return "linear"
    return "linear"


def refine_switch_sound_tags(name: str, subtype: str, tags: list[str]) -> list[str]:
    """Drop scraper noise (all switch-type tags) and keep subtype-aligned tags."""
    canonical = {"linear", "tactile", "click", "silent", "magnetic", "thocky", "clacky"}
    cleaned = [str(t).strip().lower() for t in tags if str(t).strip()]
    if len(set(cleaned) & {"linear", "tactile", "click", "silent", "magnetic"}) >= 4:
        cleaned = []
    out: list[str] = []
    for candidate in (subtype, *cleaned):
        if candidate in canonical and candidate not in out:
            out.append(candidate)
    n = name.lower()
    if "thock" in n and "thocky" not in out:
        out.append("thocky")
    if "clack" in n and "clacky" not in out:
        out.append("clacky")
    return out or [subtype]


def count_seed_items(payload: dict[str, Any]) -> dict[str, int]:
    switches = payload.get("switches")
    switch_count = 0
    if isinstance(switches, dict):
        for rows in switches.values():
            if isinstance(rows, list):
                switch_count += len(rows)
    return {
        "switch": switch_count,
        "plate": len(payload.get("plates") or []) if isinstance(payload.get("plates"), list) else 0,
        "foam": len(payload.get("foams") or []) if isinstance(payload.get("foams"), list) else 0,
        "layout": len(payload.get("layouts") or []) if isinstance(payload.get("layouts"), list) else 0,
        "case": len(payload.get("cases") or []) if isinstance(payload.get("cases"), list) else 0,
        "keycap": len(payload.get("keycaps") or []) if isinstance(payload.get("keycaps"), list) else 0,
    }


def _existing_ids(payload: dict[str, Any]) -> set[str]:
    ids: set[str] = set()
    switches = payload.get("switches")
    if isinstance(switches, dict):
        for rows in switches.values():
            if isinstance(rows, list):
                for row in rows:
                    if isinstance(row, dict) and row.get("id"):
                        ids.add(str(row["id"]))
    for key in ("plates", "foams", "layouts"):
        rows = payload.get(key)
        if isinstance(rows, list):
            for row in rows:
                if isinstance(row, dict) and row.get("id"):
                    ids.add(str(row["id"]))
    return ids


def _spec_by_id(specs_payload: dict[str, Any], family: SeedFamily) -> dict[str, dict[str, Any]]:
    if family == "switch":
        rows = specs_payload.get("switches")
        normalizer = normalize_switch_spec
    elif family == "plate":
        rows = specs_payload.get("plates")
        normalizer = normalize_plate_spec
    elif family == "foam":
        rows = specs_payload.get("foams")
        normalizer = normalize_foam_spec
    else:
        return {}
    if not isinstance(rows, list):
        return {}
    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        sid = str(row.get("id") or "").strip()
        if sid:
            out[sid] = normalizer(row)
    return out


def _targets_from_manifest(manifest: dict[str, Any], family: SeedFamily) -> list[dict[str, Any]]:
    outer_key, inner_key = _MANIFEST_FAMILY_KEYS[family]
    node = manifest.get(outer_key)
    if not isinstance(node, dict):
        return []
    rows = node.get(inner_key)
    if not isinstance(rows, list):
        return []
    return [r for r in rows if isinstance(r, dict)]


def build_stub_row(
    target: dict[str, Any],
    *,
    family: SeedFamily,
    spec_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a seed stub (id, name, category, subtype, sourceUrl, metadata)."""
    part_id = str(target.get("id") or "").strip()
    name = str(target.get("name") or "").strip()
    url = str(target.get("url") or "").strip()
    metadata = dict(spec_meta or {})
    if family == "switch":
        subtype = infer_switch_subtype(name, metadata)
        tags = metadata.get("sound_signature_tags")
        if isinstance(tags, list):
            metadata["sound_signature_tags"] = refine_switch_sound_tags(name, subtype, tags)
        row = {
            "id": part_id,
            "name": name,
            "category": "switch",
            "subtype": subtype,
            "sourceUrl": url,
            "metadata": metadata,
        }
        return enrich_stub_metadata(row, family=family, subtype=subtype)
    if family == "plate":
        row = {
            "id": part_id,
            "name": name,
            "category": "plate",
            "subtype": "plate",
            "sourceUrl": url,
            "metadata": metadata,
        }
        return enrich_stub_metadata(row, family=family, subtype="plate")
    if family == "foam":
        row = {
            "id": part_id,
            "name": name,
            "category": "foam",
            "subtype": "dampening",
            "sourceUrl": url,
            "metadata": metadata,
        }
        return enrich_stub_metadata(row, family=family, subtype="dampening")
    row = {
        "id": part_id,
        "name": name,
        "category": "layout",
        "subtype": "layout",
        "sourceUrl": url,
        "metadata": metadata,
    }
    return enrich_stub_metadata(row, family=family, subtype="layout")


def enrich_stub_metadata(row: dict[str, Any], *, family: SeedFamily, subtype: str) -> dict[str, Any]:
    """Fill metadata defaults and persist model-validated fields on the stub row."""
    if family == "switch":
        meta = _infer_switch_metadata(row, subtype)
        row["metadata"] = meta.model_dump(exclude_none=True)
        row["subtype"] = subtype
    elif family == "plate":
        meta = _infer_plate_metadata(row)
        row["metadata"] = meta.model_dump(exclude_none=True)
    elif family == "foam":
        meta = _infer_foam_metadata(row, subtype)
        row["metadata"] = meta.model_dump(exclude_none=True)
    elif family == "layout":
        meta = _infer_layout_metadata(row)
        row["metadata"] = meta.model_dump(exclude_none=True)
    return row


def validate_enriched_stub(row: dict[str, Any], *, family: SeedFamily, subtype: str) -> list[str]:
    """Ensure metadata validates and traits can be derived (no empty stubs)."""
    issues = validate_component_metadata(family, row.get("metadata"))
    if issues:
        return issues
    md = row.get("metadata") or {}
    if family == "switch":
        sm = _infer_switch_metadata(row, subtype)
        traits = derive_switch_traits(sm)
        if sm.spring_weight_g is None and sm.bottom_out_force_g is None:
            return ["switch metadata missing force fields after enrichment"]
    elif family == "plate":
        traits = derive_plate_traits(_infer_plate_metadata(row))
        if not md.get("material"):
            return ["plate metadata missing material after enrichment"]
    elif family == "foam":
        traits = derive_foam_traits(_infer_foam_metadata(row, subtype))
        if md.get("dampening_strength") is None:
            return ["foam metadata missing dampening_strength after enrichment"]
    elif family == "layout":
        traits = derive_layout_traits(_infer_layout_metadata(row))
        if not md.get("layout_size"):
            return ["layout metadata missing layout_size after enrichment"]
    else:
        return [f"unsupported family: {family}"]
    if not traits:
        return ["trait derivation returned empty profile"]
    if all(abs(v - 5.0) < 1e-9 for v in traits.values()):
        return ["trait profile is flat (all axes centered) — insufficient metadata"]
    return []


def _append_switch_row(payload: dict[str, Any], row: dict[str, Any]) -> None:
    switches = payload.setdefault("switches", {})
    if not isinstance(switches, dict):
        raise TypeError("seed switches must be a dict")
    subtype = str(row.get("subtype") or "other").strip().lower()
    if subtype not in _SWITCH_SUBTYPES:
        subtype = "other"
    bucket = switches.setdefault(subtype, [])
    if not isinstance(bucket, list):
        switches[subtype] = []
        bucket = switches[subtype]
    bucket.append(row)


def _append_list_row(payload: dict[str, Any], family: SeedFamily, row: dict[str, Any]) -> None:
    key = {"plate": "plates", "foam": "foams", "layout": "layouts"}[family]
    rows = payload.setdefault(key, [])
    if not isinstance(rows, list):
        payload[key] = []
        rows = payload[key]
    rows.append(row)


def merge_new_in_crawl_into_seed(
    seed_payload: dict[str, Any],
    manifest: dict[str, Any],
    switch_specs: dict[str, Any],
    compat_specs: dict[str, Any],
) -> tuple[dict[str, Any], MergeReport]:
    """
    Append new_in_crawl stubs in priority order: plate → foam → layout → switch.

    Specs are merged into stub metadata, then enriched for trait derivation.
    """
    merged = json.loads(json.dumps(seed_payload))
    report = MergeReport(
        generated_at=datetime.now(UTC).isoformat(),
        before_counts=count_seed_items(merged),
    )
    existing = _existing_ids(merged)
    specs_by_family: dict[SeedFamily, dict[str, dict[str, Any]]] = {
        "plate": _spec_by_id(compat_specs, "plate"),
        "foam": _spec_by_id(compat_specs, "foam"),
        "layout": {},
        "switch": _spec_by_id(switch_specs, "switch"),
    }

    for family in MERGE_FAMILY_ORDER:
        added = 0
        for target in _targets_from_manifest(manifest, family):
            part_id = str(target.get("id") or "").strip()
            if not part_id:
                report.rejected.append({"id": "", "family": family, "reason": "missing id"})
                continue
            if part_id in existing:
                report.skipped_existing.append(part_id)
                continue
            spec_meta = specs_by_family.get(family, {}).get(part_id)
            subtype = (
                infer_switch_subtype(str(target.get("name") or ""), spec_meta)
                if family == "switch"
                else ("dampening" if family == "foam" else family)
            )
            try:
                stub = build_stub_row(target, family=family, spec_meta=spec_meta)
            except Exception as exc:  # noqa: BLE001 — collect per-row failures
                report.rejected.append({"id": part_id, "family": family, "reason": str(exc)})
                continue
            issues = validate_enriched_stub(stub, family=family, subtype=str(subtype))
            if issues:
                report.rejected.append(
                    {"id": part_id, "family": family, "reason": "; ".join(issues)},
                )
                continue
            if family == "switch":
                _append_switch_row(merged, stub)
            else:
                _append_list_row(merged, family, stub)
            existing.add(part_id)
            added += 1
        report.added[family] = added

    merged = merge_component_specs_into_seed(merged, compat_specs)
    merged = merge_switch_specs_into_seed(merged, switch_specs)
    report.after_counts = count_seed_items(merged)
    return merged, report


def write_merge_outputs(
    *,
    merged_payload: dict[str, Any],
    report: MergeReport,
    out_seed: Path,
    report_json: Path,
    report_txt: Path,
) -> None:
    out_seed.parent.mkdir(parents=True, exist_ok=True)
    out_seed.write_text(json.dumps(merged_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_json.parent.mkdir(parents=True, exist_ok=True)
    report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "Swagkey new_in_crawl → seed merge report",
        f"generated: {report.generated_at}",
        "",
        "counts (before → after):",
    ]
    for key in ("plate", "foam", "layout", "switch"):
        before = report.before_counts.get(key, 0)
        after = report.after_counts.get(key, 0)
        added = report.added.get(key, 0)
        lines.append(f"  {key}: {before} → {after} (+{added})")
    if report.skipped_existing:
        lines.extend(["", f"skipped existing ({len(report.skipped_existing)}):"])
        lines.extend(f"  - {sid}" for sid in report.skipped_existing[:20])
        if len(report.skipped_existing) > 20:
            lines.append(f"  ... and {len(report.skipped_existing) - 20} more")
    if report.rejected:
        lines.extend(["", f"rejected ({len(report.rejected)}):"])
        for row in report.rejected:
            lines.append(f"  - [{row.get('family')}] {row.get('id')}: {row.get('reason')}")
    report_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")
