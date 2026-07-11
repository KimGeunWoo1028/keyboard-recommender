"""Merge inventory v4 + candidates into swagkey seed for catalog browse 1:1 (Phase 3)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id
from keyboard_recommender.catalog.swagkey_case_seed_builder import (
    assign_case_id,
    infer_case_metadata,
    load_inventory_index,
)
from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_keycap_seed_builder import infer_keycap_metadata
from keyboard_recommender.catalog.swagkey_new_in_crawl_seed_merge import (
    _append_list_row,
    _append_switch_row,
    build_stub_row,
    count_seed_items,
    enrich_stub_metadata,
    infer_switch_subtype,
)
from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url

BROWSE_MERGE_SCHEMA_VERSION = "1.0.0"

CandidateFamily = Literal["switch", "plate", "foam", "layout", "case_kit", "keycap"]
BROWSE_CANDIDATE_ORDER: tuple[CandidateFamily, ...] = (
    "plate",
    "foam",
    "layout",
    "switch",
    "case_kit",
    "keycap",
)

_BROWSE_ONLY_KEYCAP_SCOPES = frozenset({"addon", "alpha", "mod"})


@dataclass(slots=True)
class BrowseSeedMergeReport:
    schema_version: str = BROWSE_MERGE_SCHEMA_VERSION
    generated_at: str = ""
    dry_run: bool = True
    before_counts: dict[str, int] = field(default_factory=dict)
    after_counts: dict[str, int] = field(default_factory=dict)
    added: dict[str, int] = field(default_factory=dict)
    updated_existing: dict[str, int] = field(default_factory=dict)
    skipped_existing: list[str] = field(default_factory=list)
    skipped_archetype: int = 0
    rejected: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "dryRun": self.dry_run,
            "beforeCounts": self.before_counts,
            "afterCounts": self.after_counts,
            "added": self.added,
            "updatedExisting": self.updated_existing,
            "skippedExisting": self.skipped_existing,
            "skippedArchetype": self.skipped_archetype,
            "rejected": self.rejected,
        }


def _slug_suffix(text: str) -> str:
    cleaned = re.sub(r"[^\w가-힣]+", "-", text.strip().casefold()).strip("-")
    return cleaned[:36] or "item"


def _browse_fields(*, listed: bool = True, source: str = "inventory_v4") -> dict[str, Any]:
    return {"browse": {"listed": listed, "source": source}}


def _product_idx(row: dict[str, Any]) -> str:
    explicit = str(row.get("swagkeyProductId") or row.get("swagkey_product_id") or "").strip()
    if explicit.isdigit():
        return explicit
    return extract_product_id_from_url(str(row.get("sourceUrl") or row.get("source_url") or "")) or ""


def _attach_browse_policy(
    row: dict[str, Any],
    *,
    recommendation_eligible: bool,
    trait_confidence: str,
) -> dict[str, Any]:
    out = dict(row)
    out.update(_browse_fields())
    out["recommendationEligible"] = recommendation_eligible
    out["traitConfidence"] = trait_confidence
    return out


def _is_keycap_browse_only(meta: dict[str, Any]) -> bool:
    scope = str(meta.get("kit_scope") or "").strip().lower()
    return scope in _BROWSE_ONLY_KEYCAP_SCOPES


def _legacy_recommendation_eligible(row: dict[str, Any], *, family: str) -> bool:
    if is_layout_archetype_part_id(str(row.get("id") or "")):
        return True
    if family == "keycap" and row.get("inRecommendationPool") is True:
        return True
    if family == "keycap":
        meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
        return not _is_keycap_browse_only(meta)
    return True


def _needs_legacy_browse_annotation(row: dict[str, Any]) -> bool:
    """Only tag rows that predate Phase 3 browse policy fields."""
    return "traitConfidence" not in row or "browse" not in row


def _annotate_legacy_rows(payload: dict[str, Any]) -> int:
    """Tag pre-existing seed rows with browse + recommend policy (archetypes LOCK)."""
    updated = 0

    switches = payload.get("switches")
    if isinstance(switches, dict):
        for rows in switches.values():
            if not isinstance(rows, list):
                continue
            for index, row in enumerate(rows):
                if not isinstance(row, dict) or not _needs_legacy_browse_annotation(row):
                    continue
                eligible = _legacy_recommendation_eligible(row, family="switch")
                rows[index] = _attach_browse_policy(
                    row,
                    recommendation_eligible=eligible,
                    trait_confidence="manual_curated",
                )
                updated += 1

    for key, family in (("plates", "plate"), ("foams", "foam"), ("layouts", "layout")):
        rows = payload.get(key)
        if not isinstance(rows, list):
            continue
        for index, row in enumerate(rows):
            if not isinstance(row, dict) or not _needs_legacy_browse_annotation(row):
                continue
            part_id = str(row.get("id") or "")
            eligible = _legacy_recommendation_eligible(row, family="layout") if family == "layout" else True
            if is_layout_archetype_part_id(part_id):
                eligible = True
            rows[index] = _attach_browse_policy(
                row,
                recommendation_eligible=eligible,
                trait_confidence="manual_curated",
            )
            updated += 1

    for key, family in (("cases", "case"), ("keycaps", "keycap")):
        rows = payload.get(key)
        if not isinstance(rows, list):
            continue
        for index, row in enumerate(rows):
            if not isinstance(row, dict) or not _needs_legacy_browse_annotation(row):
                continue
            eligible = _legacy_recommendation_eligible(row, family=family)
            rows[index] = _attach_browse_policy(
                row,
                recommendation_eligible=eligible,
                trait_confidence="manual_curated",
            )
            updated += 1

    return updated


def _iter_seed_rows(payload: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    found: list[tuple[str, dict[str, Any]]] = []
    switches = payload.get("switches")
    if isinstance(switches, dict):
        for rows in switches.values():
            if isinstance(rows, list):
                for row in rows:
                    if isinstance(row, dict):
                        found.append(("switch", row))
    for family, key in (
        ("plate", "plates"),
        ("foam", "foams"),
        ("layout", "layouts"),
        ("case", "cases"),
        ("keycap", "keycaps"),
    ):
        rows = payload.get(key)
        if isinstance(rows, list):
            for row in rows:
                if isinstance(row, dict):
                    found.append((family, row))
    return found


def _build_seed_indexes(payload: dict[str, Any]) -> tuple[dict[str, str], dict[str, str]]:
    by_idx: dict[str, str] = {}
    by_inventory_id: dict[str, str] = {}
    for family, row in _iter_seed_rows(payload):
        part_id = str(row.get("id") or "").strip()
        if not part_id:
            continue
        idx = _product_idx(row)
        if idx:
            by_idx[idx] = part_id
        inv_id = str(row.get("inventoryId") or "").strip()
        if inv_id:
            by_inventory_id[inv_id] = part_id
    return by_idx, by_inventory_id


def _load_candidates(candidates_path: Path) -> dict[str, list[dict[str, Any]]]:
    payload = json.loads(candidates_path.read_text(encoding="utf-8"))
    grouped = payload.get("candidates")
    if not isinstance(grouped, dict):
        msg = "candidates json: missing candidates object"
        raise ValueError(msg)
    out: dict[str, list[dict[str, Any]]] = {}
    for family in BROWSE_CANDIDATE_ORDER:
        rows = grouped.get(family)
        out[family] = [r for r in rows if isinstance(r, dict)] if isinstance(rows, list) else []
    return out


def _load_layout_overrides(path: Path | None) -> dict[str, str]:
    if path is None or not path.is_file():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    overrides = payload.get("overrides")
    if not isinstance(overrides, list):
        return {}
    out: dict[str, str] = {}
    for row in overrides:
        if not isinstance(row, dict):
            continue
        inv_id = str(row.get("inventoryId") or "").strip()
        layout_size = str(row.get("layout_size") or "").strip()
        if inv_id and layout_size:
            out[inv_id] = layout_size
    return out


def _assign_new_id(family: str, product_idx: str, name: str, counters: dict[str, int]) -> str:
    if product_idx.isdigit():
        if family == "switch":
            return f"sw-idx-{product_idx}"
        if family == "plate":
            return f"plate-idx-{product_idx}"
        if family == "foam":
            return f"foam-idx-{product_idx}"
        if family == "layout":
            return f"layout-idx-{product_idx}"
    counters[family] = counters.get(family, 0) + 1
    if family == "case":
        return assign_case_id(counters[family])
    if family == "keycap":
        return f"kc-{counters[family]:03d}"
    return f"{family}-browse-{counters[family]:03d}-{_slug_suffix(name)}"


def _inventory_row_fields(inv: dict[str, Any]) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    image_url = str(inv.get("imageUrl") or inv.get("image_url") or "").strip()
    if image_url:
        fields["imageUrl"] = image_url
        if inv.get("imageSource"):
            fields["imageSource"] = inv.get("imageSource")
    return fields


def _build_switch_stub(
    candidate: dict[str, Any],
    inv: dict[str, Any],
    *,
    stub_id: str,
) -> dict[str, Any]:
    name = str(candidate.get("productName") or candidate.get("normalizedName") or "").strip()
    url = normalize_product_detail_url(str(inv.get("sourceUrl") or ""))
    target = {"id": stub_id, "name": name, "url": url}
    subtype = infer_switch_subtype(name)
    stub = build_stub_row(target, family="switch")
    stub["inventoryId"] = str(candidate.get("id") or "")
    stub.update(_inventory_row_fields(inv))
    return _attach_browse_policy(stub, recommendation_eligible=False, trait_confidence="name_inferred")


def _build_component_stub(
    candidate: dict[str, Any],
    inv: dict[str, Any],
    *,
    family: Literal["plate", "foam", "layout"],
    stub_id: str,
) -> dict[str, Any]:
    name = str(candidate.get("productName") or candidate.get("normalizedName") or "").strip()
    url = normalize_product_detail_url(str(inv.get("sourceUrl") or ""))
    target = {"id": stub_id, "name": name, "url": url}
    stub = build_stub_row(target, family=family)
    stub["inventoryId"] = str(candidate.get("id") or "")
    stub.update(_inventory_row_fields(inv))
    return _attach_browse_policy(stub, recommendation_eligible=False, trait_confidence="name_inferred")


def _build_case_stub(
    candidate: dict[str, Any],
    inv: dict[str, Any],
    *,
    stub_id: str,
    layout_overrides: dict[str, str],
) -> dict[str, Any]:
    inv_id = str(candidate.get("id") or "").strip()
    name = str(candidate.get("productName") or candidate.get("normalizedName") or "").strip()
    brand = str(candidate.get("brand") or "").strip()
    meta = infer_case_metadata(name, brand=brand)
    meta_dict = meta.model_dump(exclude_none=True)
    if inv_id in layout_overrides:
        meta_dict["layout_size"] = layout_overrides[inv_id]
    kit_type = str(meta.kit_type or "kit")
    row = {
        "id": stub_id,
        "inventoryId": inv_id,
        "name": name,
        "category": "case",
        "subtype": kit_type,
        "sourceUrl": normalize_product_detail_url(str(inv.get("sourceUrl") or "")),
        "metadata": meta_dict,
        "tags": [t for t in (brand, kit_type, meta_dict.get("layout_size") or "") if t],
    }
    row.update(_inventory_row_fields(inv))
    return _attach_browse_policy(row, recommendation_eligible=False, trait_confidence="name_inferred")


def _build_keycap_stub(
    candidate: dict[str, Any],
    inv: dict[str, Any],
    *,
    stub_id: str,
) -> dict[str, Any]:
    name = str(candidate.get("productName") or candidate.get("normalizedName") or "").strip()
    brand = str(candidate.get("brand") or "").strip()
    meta = infer_keycap_metadata(name)
    meta_dict = meta.model_dump(exclude_none=True)
    url = normalize_product_detail_url(str(inv.get("sourceUrl") or ""))
    if "idx=" not in url:
        raise ValueError("missing product idx URL")
    browse_only = _is_keycap_browse_only(meta_dict)
    row = {
        "id": stub_id,
        "name": name,
        "brand": brand,
        "subtype": str(meta.kit_scope or "base"),
        "sourceUrl": url,
        "inventoryId": str(candidate.get("id") or ""),
        "metadata": meta_dict,
        "inRecommendationPool": False,
    }
    row.update(_inventory_row_fields(inv))
    return _attach_browse_policy(row, recommendation_eligible=False, trait_confidence="name_inferred")


def _update_existing_row(existing: dict[str, Any], inv: dict[str, Any], candidate: dict[str, Any]) -> dict[str, Any]:
    row = dict(existing)
    url = normalize_product_detail_url(str(inv.get("sourceUrl") or ""))
    if url:
        row["sourceUrl"] = url
    inv_id = str(candidate.get("id") or "").strip()
    if inv_id:
        row["inventoryId"] = inv_id
    row.update(_inventory_row_fields(inv))
    if "browse" not in row:
        row.update(_browse_fields())
    if "traitConfidence" not in row:
        row["traitConfidence"] = "manual_curated"
    if "recommendationEligible" not in row:
        row["recommendationEligible"] = _legacy_recommendation_eligible(row, family="keycap" if row.get("metadata", {}).get("kit_scope") else "switch")
    return row


def merge_inventory_into_browse_seed(
    seed_payload: dict[str, Any],
    *,
    candidates_path: Path,
    inventory_path: Path,
    layout_overrides_path: Path | None = None,
    dry_run: bool = True,
) -> tuple[dict[str, Any], BrowseSeedMergeReport]:
    merged = json.loads(json.dumps(seed_payload))
    report = BrowseSeedMergeReport(
        generated_at=datetime.now(UTC).isoformat(),
        dry_run=dry_run,
        before_counts=count_seed_items(merged),
    )

    legacy_updated = _annotate_legacy_rows(merged)
    report.updated_existing["legacy_annotated"] = legacy_updated

    inventory = load_inventory_index(inventory_path)
    layout_overrides = _load_layout_overrides(layout_overrides_path)
    candidates_by_family = _load_candidates(candidates_path)
    by_idx, by_inventory_id = _build_seed_indexes(merged)
    existing_ids = {part_id for part_id in by_idx.values()} | set(by_inventory_id.values())
    counters: dict[str, int] = {"case": 0, "keycap": 0}

    cases = merged.setdefault("cases", [])
    if not isinstance(cases, list):
        cases = []
        merged["cases"] = cases
    keycaps = merged.setdefault("keycaps", [])
    if not isinstance(keycaps, list):
        keycaps = []
        merged["keycaps"] = keycaps

    for row in cases:
        if isinstance(row, dict):
            m = re.match(r"case-(\d+)$", str(row.get("id") or ""))
            if m:
                counters["case"] = max(counters["case"], int(m.group(1)))
    for row in keycaps:
        if isinstance(row, dict):
            m = re.match(r"kc-(\d+)$", str(row.get("id") or ""))
            if m:
                counters["keycap"] = max(counters["keycap"], int(m.group(1)))

    for family in BROWSE_CANDIDATE_ORDER:
        added = 0
        updated = 0
        for candidate in candidates_by_family.get(family, []):
            inv_id = str(candidate.get("id") or "").strip()
            inv = inventory.get(inv_id, {})
            product_idx = _product_idx(inv) or str(inv.get("swagkeyProductId") or "").strip()
            name = str(candidate.get("productName") or candidate.get("normalizedName") or "").strip()
            if not inv_id or not name:
                report.rejected.append({"family": family, "inventoryId": inv_id, "reason": "missing id or name"})
                continue
            if not product_idx:
                report.rejected.append({"family": family, "inventoryId": inv_id, "reason": "missing swagkey idx"})
                continue

            existing_id = by_inventory_id.get(inv_id) or by_idx.get(product_idx)
            if existing_id:
                if is_layout_archetype_part_id(existing_id):
                    report.skipped_archetype += 1
                    continue
                for _, row in _iter_seed_rows(merged):
                    if str(row.get("id") or "") != existing_id:
                        continue
                    updated_row = _update_existing_row(row, inv, candidate)
                    row.clear()
                    row.update(updated_row)
                    report.skipped_existing.append(existing_id)
                    updated += 1
                    break
                continue

            try:
                if family == "switch":
                    stub_id = _assign_new_id("switch", product_idx, name, counters)
                    stub = _build_switch_stub(candidate, inv, stub_id=stub_id)
                    _append_switch_row(merged, stub)
                elif family in {"plate", "foam", "layout"}:
                    stub_id = _assign_new_id(family, product_idx, name, counters)
                    stub = _build_component_stub(candidate, inv, family=family, stub_id=stub_id)
                    _append_list_row(merged, family, stub)
                elif family == "case_kit":
                    counters["case"] += 1
                    stub_id = _assign_new_id("case", product_idx, name, counters)
                    stub = _build_case_stub(candidate, inv, stub_id=stub_id, layout_overrides=layout_overrides)
                    cases.append(stub)
                elif family == "keycap":
                    counters["keycap"] += 1
                    stub_id = _assign_new_id("keycap", product_idx, name, counters)
                    stub = _build_keycap_stub(candidate, inv, stub_id=stub_id)
                    keycaps.append(stub)
                else:
                    continue
            except Exception as exc:  # noqa: BLE001
                report.rejected.append({"family": family, "inventoryId": inv_id, "reason": str(exc)})
                continue

            by_idx[product_idx] = stub["id"]
            by_inventory_id[inv_id] = stub["id"]
            existing_ids.add(stub["id"])
            added += 1

        report.added[family] = added
        if updated:
            report.updated_existing[family] = updated

    report.after_counts = count_seed_items(merged)
    return merged, report


def write_browse_merge_outputs(
    *,
    merged_payload: dict[str, Any] | None,
    report: BrowseSeedMergeReport,
    out_json: Path,
    report_json: Path,
    report_txt: Path,
) -> None:
    report_json.parent.mkdir(parents=True, exist_ok=True)
    report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "Swagkey inventory browse seed merge report",
        f"generated: {report.generated_at}",
        f"dry_run: {report.dry_run}",
        "",
        "counts (before -> after):",
    ]
    for key in ("switch", "plate", "foam", "layout", "case", "keycap"):
        before = report.before_counts.get(key, 0)
        after = report.after_counts.get(key, 0)
        added = report.added.get(key, 0) + report.added.get("case_kit" if key == "case" else key, 0)
        if key == "case":
            added = report.added.get("case_kit", 0)
        lines.append(f"  {key}: {before} -> {after} (+{added})")
    if report.skipped_existing:
        lines.append(f"\nskipped existing (by idx): {len(report.skipped_existing)}")
    if report.rejected:
        lines.append(f"\nrejected ({len(report.rejected)}):")
        for row in report.rejected[:40]:
            lines.append(f"  - [{row.get('family')}] {row.get('inventoryId')}: {row.get('reason')}")
    report_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")

    if merged_payload is not None:
        out_json.parent.mkdir(parents=True, exist_ok=True)
        out_json.write_text(json.dumps(merged_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
