"""Normalize Swagkey crawl CSV into a cleaned inventory JSON payload."""

from __future__ import annotations

import csv
import io
import json
import re
from collections import OrderedDict
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

INVENTORY_SCHEMA_VERSION = "1.0.0"

# Lower index = preferred when the same product_name appears in multiple categories.
CATEGORY_PRIORITY: tuple[str, ...] = (
    "Switches",
    "Keyboards",
    "Main",
    "Keycaps",
    "Accessories",
    "Deskpads",
    "Gaming",
)

_DISCOUNT_ONLY_RE = re.compile(r"^\d+%?$")
_NUMERIC_BRAND_RE = re.compile(r"^\d+$")
_GB_PREFIX_RE = re.compile(r"^\[[^\]]+\]\s*")
_WS_RE = re.compile(r"\s+")


@dataclass(frozen=True, slots=True)
class RawInventoryRow:
    category: str
    brand: str
    product_name: str
    source_line: int


@dataclass(frozen=True, slots=True)
class InventoryItem:
    id: str
    category: str
    brand: str
    product_name: str
    normalized_name: str


@dataclass(frozen=True, slots=True)
class RemovalRecord:
    reason: str
    category: str
    brand: str
    product_name: str
    source_line: int
    detail: str = ""


@dataclass
class InventoryCleaningReport:
    schema_version: str = INVENTORY_SCHEMA_VERSION
    source_csv: str = ""
    generated_at: str = ""
    input_row_count: int = 0
    kept_count: int = 0
    removed_count: int = 0
    brand_corrections: int = 0
    removed: list[RemovalRecord] = field(default_factory=list)
    removals_by_reason: dict[str, int] = field(default_factory=dict)
    kept_by_category: dict[str, int] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)


def normalize_whitespace(text: str) -> str:
    return _WS_RE.sub(" ", (text or "").strip())


def normalize_product_name(name: str) -> str:
    cleaned = normalize_whitespace(name)
    cleaned = cleaned.rstrip(".")
    return cleaned


def is_discount_only(text: str) -> bool:
    return bool(_DISCOUNT_ONLY_RE.match(normalize_whitespace(text)))


def is_numeric_brand(brand: str) -> bool:
    return bool(_NUMERIC_BRAND_RE.match(normalize_whitespace(brand)))


def guess_brand_from_product_name(product_name: str) -> str:
    name = _GB_PREFIX_RE.sub("", normalize_product_name(product_name))
    if not name:
        return ""
    return name.split()[0]


def category_priority(category: str) -> int:
    normalized = normalize_whitespace(category)
    try:
        return CATEGORY_PRIORITY.index(normalized)
    except ValueError:
        return len(CATEGORY_PRIORITY)


def parse_inventory_csv(text: str) -> list[RawInventoryRow]:
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        msg = "inventory csv: missing header row"
        raise ValueError(msg)
    required = {"category", "brand", "product_name"}
    missing = required - {h.strip() for h in reader.fieldnames if h}
    if missing:
        msg = f"inventory csv: missing columns {sorted(missing)}"
        raise ValueError(msg)

    rows: list[RawInventoryRow] = []
    for line_no, row in enumerate(reader, start=2):
        rows.append(
            RawInventoryRow(
                category=normalize_whitespace(row.get("category") or ""),
                brand=normalize_whitespace(row.get("brand") or ""),
                product_name=normalize_whitespace(row.get("product_name") or ""),
                source_line=line_no,
            ),
        )
    return rows


def _record_removal(
    report: InventoryCleaningReport,
    *,
    reason: str,
    row: RawInventoryRow,
    detail: str = "",
) -> None:
    report.removed.append(
        RemovalRecord(
            reason=reason,
            category=row.category,
            brand=row.brand,
            product_name=row.product_name,
            source_line=row.source_line,
            detail=detail,
        ),
    )
    report.removals_by_reason[reason] = report.removals_by_reason.get(reason, 0) + 1


def clean_inventory_rows(rows: list[RawInventoryRow]) -> tuple[list[InventoryItem], InventoryCleaningReport]:
    report = InventoryCleaningReport(input_row_count=len(rows))
    brand_corrections = 0

    # Pass 1: row-level filters + brand correction.
    candidates: list[tuple[RawInventoryRow, str, str]] = []
    for row in rows:
        product_name = normalize_product_name(row.product_name)
        if not product_name:
            _record_removal(report, reason="empty_product_name", row=row)
            continue
        if is_discount_only(product_name):
            _record_removal(report, reason="discount_only_product_name", row=row)
            continue

        brand = normalize_whitespace(row.brand)
        if is_numeric_brand(brand) or is_discount_only(brand):
            corrected = guess_brand_from_product_name(product_name)
            if corrected:
                brand_corrections += 1
                brand = corrected
            else:
                _record_removal(
                    report,
                    reason="unrecoverable_brand",
                    row=row,
                    detail=f"brand={row.brand!r}",
                )
                continue

        candidates.append((row, brand, product_name))

    # Pass 2: dedupe within (category, normalized_name).
    within_category: OrderedDict[tuple[str, str], tuple[RawInventoryRow, str, str]] = OrderedDict()
    for row, brand, product_name in candidates:
        norm = normalize_product_name(product_name).casefold()
        key = (row.category, norm)
        if key in within_category:
            _record_removal(
                report,
                reason="duplicate_within_category",
                row=row,
                detail=f"kept_line={within_category[key][0].source_line}",
            )
            continue
        within_category[key] = (row, brand, product_name)

    # Pass 3: cross-category dedupe by normalized_name (Gaming vs Keyboards, Main vs Switches, ...).
    best_by_name: dict[str, tuple[RawInventoryRow, str, str]] = {}
    for row, brand, product_name in within_category.values():
        norm = normalize_product_name(product_name).casefold()
        existing = best_by_name.get(norm)
        if existing is None:
            best_by_name[norm] = (row, brand, product_name)
            continue
        existing_row, _, _ = existing
        if category_priority(row.category) < category_priority(existing_row.category):
            _record_removal(
                report,
                reason="duplicate_cross_category",
                row=existing_row,
                detail=f"replaced_by_line={row.source_line}; kept_category={row.category}",
            )
            best_by_name[norm] = (row, brand, product_name)
        else:
            _record_removal(
                report,
                reason="duplicate_cross_category",
                row=row,
                detail=f"kept_category={existing_row.category}; kept_line={existing_row.source_line}",
            )

    kept_rows = sorted(best_by_name.values(), key=lambda item: item[0].source_line)
    items: list[InventoryItem] = []
    kept_by_category: dict[str, int] = {}
    for idx, (row, brand, product_name) in enumerate(kept_rows, start=1):
        item_id = f"inv-{idx:04d}"
        items.append(
            InventoryItem(
                id=item_id,
                category=row.category,
                brand=brand,
                product_name=product_name,
                normalized_name=normalize_product_name(product_name),
            ),
        )
        kept_by_category[row.category] = kept_by_category.get(row.category, 0) + 1

    report.brand_corrections = brand_corrections
    report.kept_count = len(items)
    report.removed_count = len(report.removed)
    report.kept_by_category = kept_by_category
    report.summary_lines = build_summary_lines(report)
    return items, report


def build_inventory_payload(
    items: list[InventoryItem],
    *,
    source_csv: str,
    report: InventoryCleaningReport,
) -> dict[str, Any]:
    return {
        "schemaVersion": INVENTORY_SCHEMA_VERSION,
        "source": {
            "vendor": "Swagkey",
            "rawCsv": Path(source_csv).name,
            "sourceCsvPath": source_csv.replace("\\", "/"),
            "cleanedAt": report.generated_at or datetime.now(UTC).isoformat(),
        },
        "stats": {
            "inputRowCount": report.input_row_count,
            "keptCount": report.kept_count,
            "removedCount": report.removed_count,
            "brandCorrections": report.brand_corrections,
            "keptByCategory": report.kept_by_category,
            "removalsByReason": report.removals_by_reason,
        },
        "items": [
            {
                "id": item.id,
                "category": item.category,
                "brand": item.brand,
                "productName": item.product_name,
                "normalizedName": item.normalized_name,
            }
            for item in items
        ],
    }


def build_summary_lines(report: InventoryCleaningReport) -> list[str]:
    lines = [
        f"input rows: {report.input_row_count}",
        f"kept: {report.kept_count}",
        f"removed: {report.removed_count}",
        f"brand corrections: {report.brand_corrections}",
    ]
    if report.removals_by_reason:
        lines.append("removals by reason:")
        for reason, count in sorted(report.removals_by_reason.items()):
            lines.append(f"  - {reason}: {count}")
    if report.kept_by_category:
        lines.append("kept by category:")
        for category in CATEGORY_PRIORITY:
            if category in report.kept_by_category:
                lines.append(f"  - {category}: {report.kept_by_category[category]}")
        for category, count in sorted(report.kept_by_category.items()):
            if category not in CATEGORY_PRIORITY:
                lines.append(f"  - {category}: {count}")
    return lines


def report_to_json_dict(report: InventoryCleaningReport) -> dict[str, Any]:
    payload = asdict(report)
    payload["removed"] = [asdict(row) for row in report.removed]
    return payload


def format_report_text(report: InventoryCleaningReport) -> str:
    lines = ["Swagkey inventory cleaning report", "================================", ""]
    lines.extend(report.summary_lines)
    if report.removed:
        lines.extend(["", "removed rows (sample up to 30):"])
        for row in report.removed[:30]:
            detail = f" ({row.detail})" if row.detail else ""
            lines.append(
                f"  line {row.source_line}: [{row.reason}] {row.category} | {row.brand} | {row.product_name}{detail}",
            )
        if len(report.removed) > 30:
            lines.append(f"  ... and {len(report.removed) - 30} more")
    lines.append("")
    return "\n".join(lines)


def clean_inventory_csv_file(
    csv_path: Path,
    *,
    generated_at: datetime | None = None,
) -> tuple[list[InventoryItem], InventoryCleaningReport, dict[str, Any]]:
    text = csv_path.read_text(encoding="utf-8-sig")
    rows = parse_inventory_csv(text)
    items, report = clean_inventory_rows(rows)
    report.source_csv = str(csv_path).replace("\\", "/")
    report.generated_at = (generated_at or datetime.now(UTC)).isoformat()
    payload = build_inventory_payload(items, source_csv=report.source_csv, report=report)
    return items, report, payload


def write_inventory_outputs(
    *,
    payload: dict[str, Any],
    report: InventoryCleaningReport,
    out_json: Path,
    report_json: Path,
    report_txt: Path,
) -> None:
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_json.write_text(
        json.dumps(report_to_json_dict(report), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    report_txt.write_text(format_report_text(report), encoding="utf-8")
