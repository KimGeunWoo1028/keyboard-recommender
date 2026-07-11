"""Modular catalog ingestion/update pipeline."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.ingestion_models import (
    CatalogDiff,
    IngestionConfig,
    IngestionReport,
    NormalizedCatalogRecord,
    RawCatalogRecord,
    SourceFileRef,
    SourceType,
)
from keyboard_recommender.catalog.ingestion_normalize import normalize_record
from keyboard_recommender.catalog.ingestion_validation import validate_records


def detect_sources(manifest_path: Path) -> list[SourceFileRef]:
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    out: list[SourceFileRef] = []
    for source_type in ("vendor_pages", "structured_feeds", "manual_overrides"):
        rows = payload.get(source_type)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, str):
                out.append(SourceFileRef(source_type=source_type, path=row))
                continue
            if isinstance(row, dict):
                p = str(row.get("path") or "").strip()
                if p:
                    out.append(SourceFileRef(source_type=source_type, path=p))
    return out


def _extract_family_rows(
    source_type: SourceType,
    source_path: str,
    family: str,
    rows: Any,
) -> list[RawCatalogRecord]:
    out: list[RawCatalogRecord] = []
    if family == "switch" and isinstance(rows, dict):
        for subtype, switch_rows in rows.items():
            if not isinstance(switch_rows, list):
                continue
            for row in switch_rows:
                if not isinstance(row, dict):
                    continue
                out.append(
                    RawCatalogRecord(
                        source_type=source_type,
                        source_path=source_path,
                        family="switch",
                        item_id=str(row.get("id") or "").strip(),
                        name=str(row.get("name") or "").strip(),
                        subtype=str(subtype or "switch").strip().lower(),
                        metadata=dict(row.get("metadata") or {}),
                        source_url=str(row.get("sourceUrl") or "").strip(),
                        tags=tuple(row.get("tags") or ()),
                        aliases=tuple(row.get("aliases") or ()),
                    ),
                )
        return out
    if not isinstance(rows, list):
        return out
    for row in rows:
        if not isinstance(row, dict):
            continue
        out.append(
            RawCatalogRecord(
                source_type=source_type,
                source_path=source_path,
                family=family,  # type: ignore[arg-type]
                item_id=str(row.get("id") or "").strip(),
                name=str(row.get("name") or "").strip(),
                subtype=str(row.get("subtype") or family).strip().lower(),
                metadata=dict(row.get("metadata") or {}),
                source_url=str(row.get("sourceUrl") or "").strip(),
                tags=tuple(row.get("tags") or ()),
                aliases=tuple(row.get("aliases") or ()),
            ),
        )
    return out


def extract_sources(source_refs: list[SourceFileRef], *, base_dir: Path) -> list[RawCatalogRecord]:
    out: list[RawCatalogRecord] = []
    for source in source_refs:
        p = Path(source.path)
        full = p if p.is_absolute() else (base_dir / p)
        payload = json.loads(full.read_text(encoding="utf-8"))
        out.extend(_extract_family_rows(source.source_type, str(full), "switch", payload.get("switches")))
        out.extend(_extract_family_rows(source.source_type, str(full), "plate", payload.get("plates")))
        out.extend(_extract_family_rows(source.source_type, str(full), "foam", payload.get("foams")))
        out.extend(_extract_family_rows(source.source_type, str(full), "layout", payload.get("layouts")))
        out.extend(_extract_family_rows(source.source_type, str(full), "case", payload.get("cases")))
        out.extend(_extract_family_rows(source.source_type, str(full), "keycap", payload.get("keycaps")))
    return out


def normalize_records(raw_rows: list[RawCatalogRecord]) -> list[NormalizedCatalogRecord]:
    return [normalize_record(r) for r in raw_rows]


def _flatten_seed(seed_payload: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    out: dict[tuple[str, str], dict[str, Any]] = {}
    switches = seed_payload.get("switches")
    if isinstance(switches, dict):
        for subtype, rows in switches.items():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if isinstance(row, dict) and str(row.get("id") or "").strip():
                    out[("switch", str(row["id"]))] = {"subtype": str(subtype), "row": dict(row)}
    for family_key in ("plates", "foams", "layouts", "cases", "keycaps"):
        rows = seed_payload.get(family_key)
        if not isinstance(rows, list):
            continue
        if family_key == "cases":
            fam = "case"
        elif family_key == "keycaps":
            fam = "keycap"
        else:
            fam = family_key[:-1] if family_key != "layouts" else "layout"
        for row in rows:
            if isinstance(row, dict) and str(row.get("id") or "").strip():
                out[(fam, str(row["id"]))] = {"subtype": str(row.get("subtype") or fam), "row": dict(row)}
    return out


def detect_changes(seed_payload: dict[str, Any], rows: list[NormalizedCatalogRecord]) -> CatalogDiff:
    existing = _flatten_seed(seed_payload)
    incoming: dict[tuple[str, str], NormalizedCatalogRecord] = {(r.family, r.item_id): r for r in rows}
    new_ids: list[str] = []
    changed_ids: list[str] = []
    removed_ids: list[str] = []

    for key, row in incoming.items():
        old = existing.get(key)
        if old is None:
            new_ids.append(row.item_id)
            continue
        old_row = dict(old["row"])
        old_repr = json.dumps(old_row, sort_keys=True, ensure_ascii=False)
        new_repr = json.dumps(
            {
                "id": row.item_id,
                "name": row.name,
                "subtype": row.subtype,
                "metadata": row.metadata,
                "sourceUrl": row.source_url,
                "tags": list(row.tags),
                "aliases": list(row.aliases),
            },
            sort_keys=True,
            ensure_ascii=False,
        )
        if old_repr != new_repr:
            changed_ids.append(row.item_id)

    for key, old in existing.items():
        if key not in incoming:
            removed_ids.append(str(old["row"].get("id") or ""))

    return CatalogDiff(tuple(sorted(new_ids)), tuple(sorted(changed_ids)), tuple(sorted(x for x in removed_ids if x)))


def _upsert_seed(seed_payload: dict[str, Any], rows: list[NormalizedCatalogRecord], *, apply_removals: bool) -> dict[str, Any]:
    out = dict(seed_payload)
    switch_map: dict[str, list[dict[str, Any]]] = {
        str(k): [dict(r) for r in (v if isinstance(v, list) else [])]
        for k, v in (out.get("switches") if isinstance(out.get("switches"), dict) else {}).items()
    }
    plates = [dict(r) for r in (out.get("plates") if isinstance(out.get("plates"), list) else [])]
    foams = [dict(r) for r in (out.get("foams") if isinstance(out.get("foams"), list) else [])]
    layouts = [dict(r) for r in (out.get("layouts") if isinstance(out.get("layouts"), list) else [])]
    cases = [dict(r) for r in (out.get("cases") if isinstance(out.get("cases"), list) else [])]
    keycaps = [dict(r) for r in (out.get("keycaps") if isinstance(out.get("keycaps"), list) else [])]

    def upsert(rows_list: list[dict[str, Any]], row: NormalizedCatalogRecord) -> None:
        payload = {
            "id": row.item_id,
            "name": row.name,
            "category": row.family,
            "subtype": row.subtype,
            "sourceUrl": row.source_url,
            "metadata": row.metadata,
            "tags": list(row.tags),
            "aliases": list(row.aliases),
        }
        for i, existing in enumerate(rows_list):
            if str(existing.get("id") or "") == row.item_id:
                rows_list[i] = payload
                return
        rows_list.append(payload)

    for row in rows:
        if row.family == "switch":
            bucket = switch_map.setdefault(row.subtype or "other", [])
            upsert(bucket, row)
        elif row.family == "plate":
            upsert(plates, row)
        elif row.family == "foam":
            upsert(foams, row)
        elif row.family == "layout":
            upsert(layouts, row)
        elif row.family == "case":
            upsert(cases, row)
        elif row.family == "keycap":
            upsert(keycaps, row)

    if apply_removals:
        incoming_keys = {(r.family, r.item_id) for r in rows}
        for subtype in list(switch_map.keys()):
            switch_map[subtype] = [r for r in switch_map[subtype] if ("switch", str(r.get("id") or "")) in incoming_keys]
            if not switch_map[subtype]:
                switch_map.pop(subtype, None)
        plates = [r for r in plates if ("plate", str(r.get("id") or "")) in incoming_keys]
        foams = [r for r in foams if ("foam", str(r.get("id") or "")) in incoming_keys]
        layouts = [r for r in layouts if ("layout", str(r.get("id") or "")) in incoming_keys]
        cases = [r for r in cases if ("case", str(r.get("id") or "")) in incoming_keys]
        keycaps = [r for r in keycaps if ("keycap", str(r.get("id") or "")) in incoming_keys]

    out["switches"] = switch_map
    out["plates"] = plates
    out["foams"] = foams
    out["layouts"] = layouts
    out["cases"] = cases
    out["keycaps"] = keycaps
    return out


def run_catalog_ingestion(
    *,
    seed_payload: dict[str, Any],
    manifest_path: Path,
    base_dir: Path,
    cfg: IngestionConfig,
) -> tuple[dict[str, Any], IngestionReport]:
    report = IngestionReport(review_required=cfg.require_review)
    report.detected_sources = detect_sources(manifest_path)
    raw_rows = extract_sources(report.detected_sources, base_dir=base_dir)
    report.extracted_count = len(raw_rows)
    normalized = normalize_records(raw_rows)
    report.normalized_count = len(normalized)
    errors, warnings = validate_records(normalized)
    report.validation_errors = errors
    report.validation_warnings = warnings
    report.diff = detect_changes(seed_payload, normalized)
    has_changes = bool(report.diff.new_ids or report.diff.changed_ids or report.diff.removed_ids)

    report.summary_lines.extend(
        [
            f"sources detected: {len(report.detected_sources)}",
            f"records extracted: {report.extracted_count}",
            f"records normalized: {report.normalized_count}",
            f"validation errors: {len(report.validation_errors)}",
            f"validation warnings: {len(report.validation_warnings)}",
            f"changes: +{len(report.diff.new_ids)} ~{len(report.diff.changed_ids)} -{len(report.diff.removed_ids)}",
        ],
    )

    if report.validation_errors:
        report.summary_lines.append("publish skipped: validation errors present")
        return seed_payload, report

    if cfg.require_review and has_changes and not cfg.review_approved:
        report.summary_lines.append("publish skipped: review required and not approved")
        return seed_payload, report

    updated = _upsert_seed(seed_payload, normalized, apply_removals=cfg.apply_removals)
    report.published = True
    report.summary_lines.append("publish applied: seed payload updated")
    return updated, report

