"""Audit Swagkey catalog browse 1:1 coverage vs inventory (roadmap Phase 0)."""

from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.application.catalog_browse_service import list_catalog_parts
from keyboard_recommender.catalog.catalog_browse_policy import (
    BROWSE_EXCLUDED_SWAGKEY_IDX,
    is_browse_excluded_source_url,
    is_browse_listed_seed_row,
)
from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id

COVERAGE_SCHEMA_VERSION = "1.0.0"
COVERAGE_GAP_THRESHOLD_PCT = 2.0

AuditFamily = Literal["switch", "plate", "foam", "layout", "case", "keycap"]

AUDIT_FAMILIES: tuple[AuditFamily, ...] = (
    "switch",
    "plate",
    "foam",
    "layout",
    "case",
    "keycap",
)

_CLASSIFIED_TO_AUDIT: dict[str, AuditFamily] = {
    "switch": "switch",
    "plate": "plate",
    "foam": "foam",
    "layout": "layout",
    "case_kit": "case",
    "keycap": "keycap",
}

_CSV_CATEGORY_BY_FAMILY: dict[AuditFamily, frozenset[str]] = {
    "switch": frozenset({"Switches"}),
    "keycap": frozenset({"Keycaps"}),
}

_INVENTORY_VERSION_RE = re.compile(r"swagkey_inventory\.v(\d+)\.json$")


@dataclass(frozen=True, slots=True)
class FamilyCoverage:
    family: AuditFamily
    csv_category_count: int | None
    inventory_classified_count: int
    seed_count: int
    seed_archetype_count: int | None
    seed_real_count: int | None
    browse_count: int
    browse_excluded_404: int
    expected_browse: int
    gap_inventory_vs_browse: int
    gap_inventory_vs_seed: int
    gap_pct_inventory_vs_browse: float


@dataclass(frozen=True, slots=True)
class CoverageGapViolation:
    family: AuditFamily
    inventory_count: int
    browse_count: int
    gap: int
    gap_pct: float
    threshold_pct: float


@dataclass(frozen=True, slots=True)
class CoverageGapCheckResult:
    threshold_pct: float
    passed: bool
    violations: tuple[CoverageGapViolation, ...]


@dataclass
class Catalog1to1CoverageReport:
    schema_version: str = COVERAGE_SCHEMA_VERSION
    generated_at: str = ""
    seed_path: str = ""
    inventory_path: str = ""
    candidates_path: str = ""
    csv_path: str = ""
    families: dict[str, dict[str, Any]] = field(default_factory=dict)
    layout_archetype: dict[str, int] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)


def _resolve_latest_inventory(inventory_dir: Path) -> Path:
    candidates = sorted(
        inventory_dir.glob("swagkey_inventory.v*.json"),
        key=lambda path: int(_INVENTORY_VERSION_RE.search(path.name).group(1))  # type: ignore[union-attr]
        if _INVENTORY_VERSION_RE.search(path.name)
        else 0,
    )
    if not candidates:
        msg = f"no swagkey_inventory.v*.json under {inventory_dir}"
        raise FileNotFoundError(msg)
    return candidates[-1]


def _read_csv_category_counts(csv_path: Path) -> dict[str, int]:
    if not csv_path.is_file():
        return {}
    counts: dict[str, int] = {}
    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            category = str(row.get("category") or "").strip()
            if not category:
                continue
            counts[category] = counts.get(category, 0) + 1
    return counts


def _inventory_items(inventory_path: Path) -> list[dict[str, Any]]:
    payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    rows = payload.get("items")
    if not isinstance(rows, list):
        msg = f"{inventory_path}: missing items array"
        raise ValueError(msg)
    return [row for row in rows if isinstance(row, dict)]


def _classified_counts(candidates_path: Path) -> dict[AuditFamily, int]:
    payload = json.loads(candidates_path.read_text(encoding="utf-8"))
    grouped = payload.get("candidates")
    if not isinstance(grouped, dict):
        msg = f"{candidates_path}: missing candidates object"
        raise ValueError(msg)

    counts: dict[AuditFamily, int] = {family: 0 for family in AUDIT_FAMILIES}
    for classified_family, rows in grouped.items():
        audit_family = _CLASSIFIED_TO_AUDIT.get(str(classified_family))
        if audit_family is None or not isinstance(rows, list):
            continue
        counts[audit_family] += len(rows)
    return counts


def _inventory_category_counts(items: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in items:
        category = str(row.get("category") or "").strip()
        if category:
            counts[category] = counts.get(category, 0) + 1
    return counts


def _count_excluded_404(
    items: list[dict[str, Any]],
    *,
    family: AuditFamily,
    classified_ids_by_family: dict[AuditFamily, set[str]],
) -> int:
    allowed_ids = classified_ids_by_family.get(family, set())
    excluded = 0
    for row in items:
        inv_id = str(row.get("id") or "").strip()
        if allowed_ids and inv_id not in allowed_ids:
            continue
        source_url = str(row.get("sourceUrl") or "")
        if is_browse_excluded_source_url(source_url):
            excluded += 1
    return excluded


def _classified_id_sets(candidates_path: Path) -> dict[AuditFamily, set[str]]:
    payload = json.loads(candidates_path.read_text(encoding="utf-8"))
    grouped = payload.get("candidates")
    if not isinstance(grouped, dict):
        return {family: set() for family in AUDIT_FAMILIES}

    out: dict[AuditFamily, set[str]] = {family: set() for family in AUDIT_FAMILIES}
    for classified_family, rows in grouped.items():
        audit_family = _CLASSIFIED_TO_AUDIT.get(str(classified_family))
        if audit_family is None or not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, dict):
                inv_id = str(row.get("id") or "").strip()
                if inv_id:
                    out[audit_family].add(inv_id)
    return out


def _iter_seed_rows(payload: dict[str, Any], bucket: str) -> list[dict[str, Any]]:
    value = payload.get(bucket)
    if bucket == "switches" and isinstance(value, dict):
        rows: list[dict[str, Any]] = []
        for group in value.values():
            if isinstance(group, list):
                rows.extend(row for row in group if isinstance(row, dict))
        return rows
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    return []


def _seed_counts(seed_path: Path) -> dict[str, Any]:
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    layout_rows = _iter_seed_rows(payload, "layouts")
    layout_archetype = sum(1 for row in layout_rows if is_layout_archetype_part_id(str(row.get("id") or "")))
    layout_real = sum(
        1
        for row in layout_rows
        if not is_layout_archetype_part_id(str(row.get("id") or "")) and is_browse_listed_seed_row(row)
    )
    return {
        "switch": len(_iter_seed_rows(payload, "switches")),
        "plate": len(_iter_seed_rows(payload, "plates")),
        "foam": len(_iter_seed_rows(payload, "foams")),
        "layout": len(layout_rows),
        "layout_archetype": layout_archetype,
        "layout_real": layout_real,
        "case": len(_iter_seed_rows(payload, "cases")),
        "keycap": len(_iter_seed_rows(payload, "keycaps")),
    }


def _csv_family_count(csv_categories: dict[str, int], family: AuditFamily) -> int | None:
    categories = _CSV_CATEGORY_BY_FAMILY.get(family)
    if not categories:
        return None
    return sum(csv_categories.get(category, 0) for category in categories)


def _gap_pct(gap: int, base: int) -> float:
    if base <= 0:
        return 0.0
    return round(100.0 * gap / base, 2)


def audit_catalog_1to1_coverage(
    *,
    seed_path: Path,
    inventory_path: Path | None = None,
    candidates_path: Path,
    csv_path: Path | None = None,
    inventory_dir: Path | None = None,
) -> Catalog1to1CoverageReport:
    inv_dir = inventory_dir or candidates_path.parent
    resolved_inventory = inventory_path or _resolve_latest_inventory(inv_dir)
    resolved_csv = csv_path or (inv_dir / "swagkey_products.csv")

    inventory_items = _inventory_items(resolved_inventory)
    classified = _classified_counts(candidates_path)
    classified_ids = _classified_id_sets(candidates_path)
    seed = _seed_counts(seed_path)
    csv_categories = _read_csv_category_counts(resolved_csv)
    inv_categories = _inventory_category_counts(inventory_items)

    layout_list = list_catalog_parts("layout", limit=500)
    layout_browse_archetype = sum(1 for item in layout_list.items if item.reference_layout)
    layout_browse_real = layout_list.total - layout_browse_archetype

    report = Catalog1to1CoverageReport(
        generated_at=datetime.now(UTC).isoformat(),
        seed_path=str(seed_path.resolve()),
        inventory_path=str(resolved_inventory.resolve()),
        candidates_path=str(candidates_path.resolve()),
        csv_path=str(resolved_csv.resolve()) if resolved_csv.is_file() else "",
        layout_archetype={
            "seed_archetype_count": int(seed["layout_archetype"]),
            "seed_real_pcb_count": int(seed["layout_real"]),
            "browse_archetype_count": layout_browse_archetype,
            "browse_real_pcb_count": layout_browse_real,
            "classified_real_pcb_count": classified["layout"],
            "note": "1:1 layout coverage compares real PCB only; archetypes excluded",
        },
    )

    for family in AUDIT_FAMILIES:
        if family == "keycap":
            browse_count = list_catalog_parts("keycap", subtype="all", limit=500).total
        elif family == "layout":
            browse_count = layout_browse_real
        else:
            browse_count = list_catalog_parts(family, limit=500).total  # type: ignore[arg-type]
        excluded_404 = _count_excluded_404(
            inventory_items,
            family=family,
            classified_ids_by_family=classified_ids,
        )
        if family == "keycap":
            excluded_404 = sum(
                1
                for row in inventory_items
                if str(row.get("category") or "").strip() == "Keycaps"
                and is_browse_excluded_source_url(str(row.get("sourceUrl") or ""))
            )

        inventory_count = classified[family]
        seed_count = int(seed[family])
        if family == "layout":
            seed_count = int(seed["layout_real"])
            seed_archetype = int(seed["layout_archetype"])
            seed_real = int(seed["layout_real"])
        else:
            seed_archetype = None
            seed_real = None

        expected_browse = max(0, inventory_count - excluded_404)
        gap_browse = inventory_count - browse_count
        gap_seed = inventory_count - seed_count

        row = FamilyCoverage(
            family=family,
            csv_category_count=_csv_family_count(csv_categories, family),
            inventory_classified_count=inventory_count,
            seed_count=seed_count,
            seed_archetype_count=seed_archetype,
            seed_real_count=seed_real,
            browse_count=browse_count,
            browse_excluded_404=excluded_404,
            expected_browse=expected_browse,
            gap_inventory_vs_browse=gap_browse,
            gap_inventory_vs_seed=gap_seed,
            gap_pct_inventory_vs_browse=_gap_pct(gap_browse, inventory_count),
        )
        report.families[family] = asdict(row)

    report.summary_lines = _build_summary_lines(
        report,
        csv_categories=csv_categories,
        inv_categories=inv_categories,
    )
    return report


def _build_summary_lines(
    report: Catalog1to1CoverageReport,
    *,
    csv_categories: dict[str, int],
    inv_categories: dict[str, int],
) -> list[str]:
    lines = [
        f"catalog 1:1 coverage ({report.schema_version})",
        f"inventory: {report.inventory_path}",
        f"seed: {report.seed_path}",
        f"browse excluded idx ({len(BROWSE_EXCLUDED_SWAGKEY_IDX)}): {', '.join(sorted(BROWSE_EXCLUDED_SWAGKEY_IDX, key=int))}",
        "",
        "family | inv | seed | browse | 404ex | gap(inv-browse) | gap%",
    ]
    for family in AUDIT_FAMILIES:
        row = report.families[family]
        lines.append(
            f"{family:7} | {row['inventory_classified_count']:3} | {row['seed_count']:4} | "
            f"{row['browse_count']:6} | {row['browse_excluded_404']:5} | "
            f"{row['gap_inventory_vs_browse']:+4} | {row['gap_pct_inventory_vs_browse']:5.1f}%",
        )
    lines.extend(
        [
            "",
            f"layout archetype seed: {report.layout_archetype.get('seed_archetype_count')} "
            f"(browse {report.layout_archetype.get('browse_archetype_count')})",
            f"layout real PCB - classified: {report.layout_archetype.get('classified_real_pcb_count')} "
            f"seed: {report.layout_archetype.get('seed_real_pcb_count')}",
            "",
            f"CSV categories (raw rows): Switches={csv_categories.get('Switches', 0)} "
            f"Keycaps={csv_categories.get('Keycaps', 0)}",
            f"inventory keptByCategory: Switches={inv_categories.get('Switches', 0)} "
            f"Keycaps={inv_categories.get('Keycaps', 0)}",
        ],
    )
    keycap_gap = report.families["keycap"]["gap_inventory_vs_seed"]
    if keycap_gap:
        lines.append(f"keycap seed gap (documented baseline target): {keycap_gap} rows to merge in Phase 3")
    return lines


def _family_gap_pct_for_threshold(
    family: AuditFamily,
    row: dict[str, Any],
    *,
    layout_archetype: dict[str, Any],
) -> tuple[int, int, float]:
    """Return (inventory baseline, gap, abs gap %) for threshold checks."""
    inventory_count = int(row["inventory_classified_count"])
    browse_count = int(row["browse_count"])
    if family == "layout":
        inventory_count = int(layout_archetype.get("classified_real_pcb_count") or inventory_count)
        browse_count = int(layout_archetype.get("browse_real_pcb_count") or browse_count)
    gap = inventory_count - browse_count
    baseline = max(inventory_count, 1)
    return inventory_count, gap, abs(gap) / baseline * 100.0


def check_coverage_gap_thresholds(
    report: Catalog1to1CoverageReport,
    *,
    threshold_pct: float = COVERAGE_GAP_THRESHOLD_PCT,
) -> CoverageGapCheckResult:
    violations: list[CoverageGapViolation] = []
    for family in AUDIT_FAMILIES:
        row = report.families[family]
        inventory_count, gap, gap_pct = _family_gap_pct_for_threshold(
            family,
            row,
            layout_archetype=report.layout_archetype,
        )
        if inventory_count <= 0:
            continue
        if gap_pct > threshold_pct:
            violations.append(
                CoverageGapViolation(
                    family=family,
                    inventory_count=inventory_count,
                    browse_count=int(row["browse_count"]),
                    gap=gap,
                    gap_pct=round(gap_pct, 2),
                    threshold_pct=threshold_pct,
                ),
            )
    return CoverageGapCheckResult(
        threshold_pct=threshold_pct,
        passed=not violations,
        violations=tuple(violations),
    )


def format_coverage_gap_violations(result: CoverageGapCheckResult) -> list[str]:
    if result.passed:
        return [f"coverage gap check passed (threshold <= {result.threshold_pct:g}%)"]
    lines = [f"coverage gap violations (threshold <= {result.threshold_pct:g}%):"]
    for row in result.violations:
        lines.append(
            f"  - {row.family}: gap={row.gap:+d} ({row.gap_pct:.1f}%) "
            f"inventory={row.inventory_count} browse={row.browse_count}",
        )
    return lines


def write_coverage_outputs(
    report: Catalog1to1CoverageReport,
    *,
    out_json: Path,
    report_txt: Path,
    gap_check: CoverageGapCheckResult | None = None,
) -> None:
    payload = {
        "schemaVersion": report.schema_version,
        "generatedAt": report.generated_at,
        "sources": {
            "seedPath": report.seed_path,
            "inventoryPath": report.inventory_path,
            "candidatesPath": report.candidates_path,
            "csvPath": report.csv_path or None,
        },
        "layoutArchetype": report.layout_archetype,
        "families": report.families,
        "summaryLines": report.summary_lines,
        "gapThresholdPct": gap_check.threshold_pct if gap_check else COVERAGE_GAP_THRESHOLD_PCT,
        "gapCheckPassed": gap_check.passed if gap_check else None,
        "gapViolations": [asdict(row) for row in gap_check.violations] if gap_check else [],
    }
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    txt_lines = list(report.summary_lines)
    if gap_check is not None:
        txt_lines.extend(["", *format_coverage_gap_violations(gap_check)])
    report_txt.write_text("\n".join(txt_lines) + "\n", encoding="utf-8")
