"""Generate spec scrape targets for seed_inventory_diff `new_in_crawl` rows."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

SeedFamily = Literal["switch", "plate", "foam", "layout"]
TARGETS_SCHEMA_VERSION = "1.0.0"

_FAMILY_ORDER: tuple[SeedFamily, ...] = ("switch", "plate", "foam", "layout")
_ID_PREFIX: dict[SeedFamily, str] = {
    "switch": "sw-new",
    "plate": "plate-new",
    "foam": "foam-new",
    "layout": "layout-new",
}


@dataclass(frozen=True, slots=True)
class NewInCrawlRow:
    family: SeedFamily
    crawl_id: str
    crawl_name: str
    crawl_category: str
    crawl_brand: str
    source_url: str
    swagkey_product_id: str


@dataclass
class NewInCrawlTargetsReport:
    schema_version: str = TARGETS_SCHEMA_VERSION
    diff_path: str = ""
    inventory_path: str = ""
    generated_at: str = ""
    total_new_in_crawl: int = 0
    with_url: int = 0
    missing_url: int = 0
    by_family: dict[str, int] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)


def load_new_in_crawl_rows(diff_path: Path) -> list[dict[str, Any]]:
    payload = json.loads(diff_path.read_text(encoding="utf-8"))
    rows = payload.get("new_in_crawl")
    if not isinstance(rows, list):
        msg = "diff json: missing new_in_crawl list"
        raise ValueError(msg)
    return [row for row in rows if isinstance(row, dict)]


def _inventory_url_index(inventory_payload: dict[str, Any]) -> dict[str, dict[str, str]]:
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        return {}
    out: dict[str, dict[str, str]] = {}
    for row in items:
        if not isinstance(row, dict):
            continue
        item_id = str(row.get("id") or "").strip()
        if not item_id:
            continue
        out[item_id] = {
            "source_url": str(row.get("sourceUrl") or row.get("source_url") or "").strip(),
            "swagkey_product_id": str(row.get("swagkeyProductId") or row.get("swagkey_product_id") or "").strip(),
        }
    return out


def _slug_suffix(text: str) -> str:
    cleaned = re.sub(r"[^\w가-힣]+", "-", text.strip().casefold()).strip("-")
    return cleaned[:40] or "item"


def assign_stub_id(family: SeedFamily, index: int, product_name: str) -> str:
    prefix = _ID_PREFIX[family]
    return f"{prefix}-{index:03d}-{_slug_suffix(product_name)}"


def build_new_in_crawl_target_rows(
    diff_rows: list[dict[str, Any]],
    inventory_payload: dict[str, Any],
) -> tuple[list[NewInCrawlRow], NewInCrawlTargetsReport]:
    url_index = _inventory_url_index(inventory_payload)
    report = NewInCrawlTargetsReport(total_new_in_crawl=len(diff_rows))
    built: list[NewInCrawlRow] = []
    counters: dict[SeedFamily, int] = {family: 0 for family in _FAMILY_ORDER}

    for raw in diff_rows:
        family = str(raw.get("family") or "").strip()
        if family not in _FAMILY_ORDER:
            continue
        fam = family  # type: ignore[assignment]
        crawl_id = str(raw.get("crawl_id") or "").strip()
        crawl_name = str(raw.get("crawl_name") or "").strip()
        if not crawl_id or not crawl_name:
            continue
        url_meta = url_index.get(crawl_id, {})
        source_url = url_meta.get("source_url", "")
        product_id = url_meta.get("swagkey_product_id", "")
        if source_url and product_id:
            report.with_url += 1
        else:
            report.missing_url += 1
        counters[fam] = counters.get(fam, 0) + 1
        report.by_family[fam] = counters[fam]
        built.append(
            NewInCrawlRow(
                family=fam,
                crawl_id=crawl_id,
                crawl_name=crawl_name,
                crawl_category=str(raw.get("crawl_category") or "").strip(),
                crawl_brand=str(raw.get("crawl_brand") or "").strip(),
                source_url=source_url,
                swagkey_product_id=product_id,
            ),
        )

    report.summary_lines = [
        f"new_in_crawl rows: {report.total_new_in_crawl}",
        f"with url: {report.with_url}",
        f"missing url: {report.missing_url}",
    ]
    if report.by_family:
        report.summary_lines.append("by family:")
        for family in _FAMILY_ORDER:
            if family in report.by_family:
                report.summary_lines.append(f"  - {family}: {report.by_family[family]}")
    return built, report


def build_spec_targets_payload(
    rows: list[NewInCrawlRow],
    *,
    report: NewInCrawlTargetsReport,
) -> dict[str, Any]:
    switch_targets: list[dict[str, str]] = []
    plate_targets: list[dict[str, str]] = []
    foam_targets: list[dict[str, str]] = []
    layout_targets: list[dict[str, str]] = []
    missing_url_rows: list[dict[str, str]] = []

    counters: dict[SeedFamily, int] = {family: 0 for family in _FAMILY_ORDER}
    for row in rows:
        counters[row.family] += 1
        stub_id = assign_stub_id(row.family, counters[row.family], row.crawl_name)
        if not row.source_url:
            missing_url_rows.append(
                {
                    "stubId": stub_id,
                    "crawlId": row.crawl_id,
                    "name": row.crawl_name,
                    "family": row.family,
                },
            )
            continue
        target = {
            "id": stub_id,
            "url": row.source_url,
            "name": row.crawl_name,
            "crawlId": row.crawl_id,
            "swagkeyProductId": row.swagkey_product_id,
        }
        if row.family == "switch":
            switch_targets.append(target)
        elif row.family == "plate":
            plate_targets.append(target)
        elif row.family == "foam":
            foam_targets.append(target)
        elif row.family == "layout":
            layout_targets.append(target)

    return {
        "schemaVersion": TARGETS_SCHEMA_VERSION,
        "source": {
            "diffPath": report.diff_path.replace("\\", "/"),
            "inventoryPath": report.inventory_path.replace("\\", "/"),
            "generatedAt": report.generated_at or datetime.now(UTC).isoformat(),
        },
        "stats": {
            "totalNewInCrawl": report.total_new_in_crawl,
            "withUrl": report.with_url,
            "missingUrl": report.missing_url,
            "switchTargets": len(switch_targets),
            "plateTargets": len(plate_targets),
            "foamTargets": len(foam_targets),
            "layoutTargets": len(layout_targets),
            "missingUrlRows": len(missing_url_rows),
        },
        "switchTargets": {"switches": switch_targets},
        "compatTargets": {"plates": plate_targets, "foams": foam_targets},
        "layoutTargets": {"layouts": layout_targets},
        "missingUrlRows": missing_url_rows,
    }


def write_spec_target_files(payload: dict[str, Any], out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    written: dict[str, Path] = {}

    switch_path = out_dir / "new_in_crawl_switch_targets.json"
    switch_path.write_text(
        json.dumps(payload["switchTargets"], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written["switch"] = switch_path

    compat_path = out_dir / "new_in_crawl_compat_targets.json"
    compat_path.write_text(
        json.dumps(payload["compatTargets"], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written["compat"] = compat_path

    layout_path = out_dir / "new_in_crawl_layout_targets.json"
    layout_path.write_text(
        json.dumps(payload["layoutTargets"], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written["layout"] = layout_path

    manifest_path = out_dir / "new_in_crawl_targets_manifest.json"
    manifest_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    written["manifest"] = manifest_path
    return written


def generate_new_in_crawl_targets(
    diff_path: Path,
    inventory_path: Path,
    *,
    generated_at: datetime | None = None,
) -> tuple[dict[str, Any], NewInCrawlTargetsReport, dict[str, Any]]:
    diff_rows = load_new_in_crawl_rows(diff_path)
    inventory_payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    rows, report = build_new_in_crawl_target_rows(diff_rows, inventory_payload)
    report.diff_path = str(diff_path).replace("\\", "/")
    report.inventory_path = str(inventory_path).replace("\\", "/")
    report.generated_at = (generated_at or datetime.now(UTC)).isoformat()
    payload = build_spec_targets_payload(rows, report=report)
    return payload, report, payload
