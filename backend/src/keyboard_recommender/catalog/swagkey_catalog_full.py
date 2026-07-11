"""Build full Swagkey catalog inventory from out_of_scope classified items (step ⑨)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

FullCatalogCategory = Literal["keycap", "accessory", "deskpad", "gaming", "merch", "other"]
FULL_CATALOG_SCHEMA_VERSION = "1.0.0"
_CATEGORY_ORDER: tuple[FullCatalogCategory, ...] = ("keycap", "accessory", "deskpad", "gaming", "merch", "other")


@dataclass(slots=True)
class FullCatalogBuildReport:
    schema_version: str = FULL_CATALOG_SCHEMA_VERSION
    generated_at: str = ""
    source_candidates_path: str = ""
    source_inventory_path: str = ""
    candidate_count: int = 0
    item_count: int = 0
    with_url: int = 0
    missing_url: int = 0
    by_catalog_category: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "sourceCandidatesPath": self.source_candidates_path,
            "sourceInventoryPath": self.source_inventory_path,
            "candidateCount": self.candidate_count,
            "itemCount": self.item_count,
            "withUrl": self.with_url,
            "missingUrl": self.missing_url,
            "byCatalogCategory": self.by_catalog_category,
        }


def infer_full_catalog_category(row: dict[str, Any]) -> FullCatalogCategory:
    """Map out_of_scope inventory row to browse-friendly full-catalog bucket."""
    swagkey_category = str(row.get("category") or "").strip()
    name = str(row.get("productName") or row.get("normalizedName") or "").casefold()
    rule_id = str(row.get("ruleId") or row.get("rule_id") or "").strip()

    if swagkey_category == "Keycaps" or rule_id == "category:keycaps":
        return "keycap"
    if swagkey_category == "Deskpads" or rule_id == "category:deskpads":
        return "deskpad"
    if swagkey_category == "Gaming":
        return "gaming"
    if swagkey_category == "Accessories" or rule_id == "category:accessories_fallback":
        return "accessory"

    if any(tok in name for tok in ("키캡", "keycap")):
        return "keycap"
    if any(tok in name for tok in ("장패드", "데스크매트", "deskmat", "mousepad", "마우스패드")):
        return "deskpad"
    if any(tok in name for tok in ("마우스", "mouse", "게이밍")):
        return "gaming"
    if any(tok in name for tok in ("굿즈", "콜라보", "phone case", "가방", "bag")):
        return "merch"
    if any(
        tok in name
        for tok in (
            "윤활",
            "krytox",
            "lubricant",
            "스테빌",
            "stabilizer",
            "스프링",
            "spring",
            "케이블",
            "cable",
            "풀러",
            "puller",
            "오프너",
            "핀셋",
            "드라이버",
            "붓",
            "brush",
            "키링",
            "keyring",
            "테스터",
            "tester",
            "무게추",
            "스위치 필름",
        )
    ):
        return "accessory"

    if rule_id == "keyword:accessory_or_merch":
        return "accessory"
    return "other"


def assign_full_catalog_id(index: int) -> str:
    return f"full-{index:03d}"


def load_out_of_scope_candidates(candidates_path: Path) -> list[dict[str, Any]]:
    payload = json.loads(candidates_path.read_text(encoding="utf-8"))
    rows = payload.get("candidates", {}).get("out_of_scope")
    if not isinstance(rows, list):
        return []
    return sorted(
        [r for r in rows if isinstance(r, dict)],
        key=lambda r: str(r.get("id") or ""),
    )


def load_inventory_index(inventory_path: Path) -> dict[str, dict[str, Any]]:
    payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    items = payload.get("items")
    if not isinstance(items, list):
        return {}
    out: dict[str, dict[str, Any]] = {}
    for row in items:
        if isinstance(row, dict) and row.get("id"):
            out[str(row["id"])] = row
    return out


def build_full_catalog_item(
    candidate: dict[str, Any],
    *,
    index: int,
    inventory_row: dict[str, Any] | None,
) -> dict[str, Any]:
    inv_id = str(candidate.get("id") or "").strip()
    inv = inventory_row or {}
    source_url = str(inv.get("sourceUrl") or inv.get("source_url") or "").strip()
    catalog_category = infer_full_catalog_category(candidate)
    return {
        "id": assign_full_catalog_id(index),
        "inventoryId": inv_id,
        "name": str(candidate.get("productName") or candidate.get("normalizedName") or "").strip(),
        "brand": str(candidate.get("brand") or inv.get("brand") or "").strip(),
        "swagkeyCategory": str(candidate.get("category") or inv.get("category") or "").strip(),
        "catalogCategory": catalog_category,
        "sourceUrl": source_url,
        "ruleId": str(candidate.get("ruleId") or "").strip(),
        "matchedKeywords": list(candidate.get("matchedKeywords") or []),
        "inRecommendationPool": False,
    }


def build_swagkey_catalog_full(
    candidates_path: Path,
    inventory_path: Path,
    *,
    generated_at: datetime | None = None,
) -> tuple[dict[str, Any], FullCatalogBuildReport]:
    candidates = load_out_of_scope_candidates(candidates_path)
    inventory = load_inventory_index(inventory_path)
    report = FullCatalogBuildReport(
        generated_at=(generated_at or datetime.now(UTC)).isoformat(),
        source_candidates_path=str(candidates_path).replace("\\", "/"),
        source_inventory_path=str(inventory_path).replace("\\", "/"),
        candidate_count=len(candidates),
    )

    items: list[dict[str, Any]] = []
    by_category: dict[str, int] = {cat: 0 for cat in _CATEGORY_ORDER}

    for idx, candidate in enumerate(candidates, start=1):
        item = build_full_catalog_item(candidate, index=idx, inventory_row=inventory.get(str(candidate.get("id") or "")))
        items.append(item)
        cat = str(item.get("catalogCategory") or "other")
        by_category[cat] = by_category.get(cat, 0) + 1
        if item.get("sourceUrl"):
            report.with_url += 1
        else:
            report.missing_url += 1

    report.item_count = len(items)
    report.by_catalog_category = {k: by_category.get(k, 0) for k in _CATEGORY_ORDER if by_category.get(k, 0)}

    payload = {
        "schemaVersion": FULL_CATALOG_SCHEMA_VERSION,
        "source": {
            "candidatesPath": report.source_candidates_path,
            "inventoryPath": report.source_inventory_path,
            "generatedAt": report.generated_at,
            "note": "out_of_scope only — not part of swagkey_products.seed.json recommendation pool",
        },
        "stats": {
            "total": report.item_count,
            "withUrl": report.with_url,
            "missingUrl": report.missing_url,
            "byCatalogCategory": report.by_catalog_category,
        },
        "items": items,
    }
    return payload, report


def write_full_catalog_outputs(
    *,
    payload: dict[str, Any],
    report: FullCatalogBuildReport,
    out_json: Path,
    report_json: Path,
    report_txt: Path,
) -> None:
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "Swagkey full catalog build report (step ⑨)",
        f"generated: {report.generated_at}",
        f"items: {report.item_count} (candidates={report.candidate_count})",
        f"with url: {report.with_url}",
        f"missing url: {report.missing_url}",
        "",
        "by catalog category:",
    ]
    for cat, count in report.by_catalog_category.items():
        lines.append(f"  {cat}: {count}")
    report_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")


def validate_full_catalog_payload(payload: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    items = payload.get("items")
    if not isinstance(items, list) or not items:
        return ["items must be a non-empty list"]
    ids: set[str] = set()
    for row in items:
        if not isinstance(row, dict):
            issues.append("item row must be object")
            continue
        part_id = str(row.get("id") or "")
        if not part_id:
            issues.append("item missing id")
            continue
        if part_id in ids:
            issues.append(f"duplicate id: {part_id}")
        ids.add(part_id)
        if row.get("inRecommendationPool") is not False:
            issues.append(f"{part_id}: inRecommendationPool must be false")
        if not str(row.get("name") or "").strip():
            issues.append(f"{part_id}: missing name")
        cat = str(row.get("catalogCategory") or "")
        if cat not in _CATEGORY_ORDER:
            issues.append(f"{part_id}: invalid catalogCategory {cat!r}")
    return issues
