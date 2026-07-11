"""Diff Swagkey crawl inventory against swagkey_products.seed.json."""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Literal

DIFF_SCHEMA_VERSION = "1.1.0"

SeedFamily = Literal["switch", "plate", "foam", "layout"]
DiffStatus = Literal["matched", "new_in_crawl", "seed_only", "name_changed"]

SEED_FAMILIES: tuple[SeedFamily, ...] = ("switch", "plate", "foam", "layout")

# Seed bucket key → recommender family
_SEED_BUCKET_TO_FAMILY: dict[str, SeedFamily] = {
    "switches": "switch",
    "plates": "plate",
    "foams": "foam",
    "layouts": "layout",
}

_WS_RE = re.compile(r"\s+")
_GB_PREFIX_RE = re.compile(r"^\[[^\]]+\]\s*")
_NON_WORD_RE = re.compile(r"[^\w가-힣]+")
_DEFAULT_FUZZY_THRESHOLD = 0.86

# If both names contain distinct variant tokens, do not pair (prevents 갈축 ↔ 흑축 false positives).
_VARIANT_TOKEN_GROUPS: tuple[tuple[str, ...], ...] = (
    ("갈축", "흑축", "은축", "적축", "청축", "황축", "brown", "black", "silver", "red", "blue"),
)


@dataclass(frozen=True, slots=True)
class SeedCatalogItem:
    id: str
    name: str
    family: SeedFamily
    subtype: str
    source_url: str


@dataclass(frozen=True, slots=True)
class CrawlCandidateItem:
    id: str
    name: str
    family: SeedFamily
    category: str
    brand: str


@dataclass(frozen=True, slots=True)
class DiffPairRecord:
    status: DiffStatus
    family: SeedFamily
    similarity: float
    seed_id: str | None
    seed_name: str | None
    crawl_id: str | None
    crawl_name: str | None
    crawl_category: str | None
    crawl_brand: str | None
    match_key_seed: str | None = None
    match_key_crawl: str | None = None
    recommendation_eligible: bool | None = None


@dataclass
class SeedInventoryDiffReport:
    schema_version: str = DIFF_SCHEMA_VERSION
    seed_path: str = ""
    candidates_path: str = ""
    generated_at: str = ""
    fuzzy_threshold: float = _DEFAULT_FUZZY_THRESHOLD
    matched_count: int = 0
    new_in_crawl_count: int = 0
    seed_only_count: int = 0
    name_changed_count: int = 0
    by_family: dict[str, dict[str, int]] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)


def normalize_display_name(name: str) -> str:
    return _WS_RE.sub(" ", (name or "").strip())


def build_match_key(name: str) -> str:
    """Aggressive normalization for fuzzy catalog name matching."""
    text = normalize_display_name(name).casefold()
    text = _GB_PREFIX_RE.sub("", text)
    for prefix in (
        "스웨그키 ",
        "sw x ",
        "sw ",
        "swk ",
        "텍스트 ",
    ):
        if text.startswith(prefix):
            text = text[len(prefix) :]
    text = _NON_WORD_RE.sub("", text)
    return text


def name_similarity(left: str, right: str) -> float:
    a = build_match_key(left)
    b = build_match_key(right)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


def _folded_tokens(name: str) -> set[str]:
    folded = normalize_display_name(name).casefold()
    return {token for group in _VARIANT_TOKEN_GROUPS for token in group if token in folded}


def pairing_allowed(seed_name: str, crawl_name: str) -> bool:
    seed_tokens = _folded_tokens(seed_name)
    crawl_tokens = _folded_tokens(crawl_name)
    if not seed_tokens or not crawl_tokens:
        return True
    if seed_tokens & crawl_tokens:
        return True
    return False


def load_seed_catalog_items(seed_path: Path) -> list[SeedCatalogItem]:
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    items: list[SeedCatalogItem] = []

    switches = payload.get("switches")
    if isinstance(switches, dict):
        for subtype, rows in switches.items():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if not isinstance(row, dict):
                    continue
                item_id = str(row.get("id") or "").strip()
                name = str(row.get("name") or "").strip()
                if item_id and name:
                    items.append(
                        SeedCatalogItem(
                            id=item_id,
                            name=name,
                            family="switch",
                            subtype=str(subtype or "other"),
                            source_url=str(row.get("sourceUrl") or "").strip(),
                        ),
                    )

    for bucket, family in _SEED_BUCKET_TO_FAMILY.items():
        if bucket == "switches":
            continue
        rows = payload.get(bucket)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            item_id = str(row.get("id") or "").strip()
            name = str(row.get("name") or "").strip()
            if item_id and name:
                items.append(
                    SeedCatalogItem(
                        id=item_id,
                        name=name,
                        family=family,
                        subtype=str(row.get("subtype") or family),
                        source_url=str(row.get("sourceUrl") or "").strip(),
                    ),
                )
    return items


def load_crawl_candidate_items(candidates_path: Path) -> list[CrawlCandidateItem]:
    payload = json.loads(candidates_path.read_text(encoding="utf-8"))
    grouped = payload.get("candidates")
    if not isinstance(grouped, dict):
        msg = "candidates json: missing candidates object"
        raise ValueError(msg)

    items: list[CrawlCandidateItem] = []
    for family in SEED_FAMILIES:
        rows = grouped.get(family)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            item_id = str(row.get("id") or "").strip()
            name = str(row.get("productName") or row.get("product_name") or "").strip()
            if item_id and name:
                items.append(
                    CrawlCandidateItem(
                        id=item_id,
                        name=name,
                        family=family,
                        category=str(row.get("category") or "").strip(),
                        brand=str(row.get("brand") or "").strip(),
                    ),
                )
    return items


def build_seed_row_index(seed_path: Path) -> dict[str, dict[str, Any]]:
    """Map seed part id → raw seed row (switch/plate/foam/layout buckets only)."""
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    index: dict[str, dict[str, Any]] = {}

    switches = payload.get("switches")
    if isinstance(switches, dict):
        for rows in switches.values():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if isinstance(row, dict):
                    item_id = str(row.get("id") or "").strip()
                    if item_id:
                        index[item_id] = row

    for bucket in ("plates", "foams", "layouts"):
        rows = payload.get(bucket)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, dict):
                item_id = str(row.get("id") or "").strip()
                if item_id:
                    index[item_id] = row
    return index


def _resolve_recommendation_eligible(
    record: DiffPairRecord,
    seed_rows: dict[str, dict[str, Any]],
) -> bool | None:
    if record.status == "new_in_crawl":
        return False
    seed_id = str(record.seed_id or "").strip()
    if not seed_id:
        return None
    row = seed_rows.get(seed_id)
    if not row:
        return None
    from keyboard_recommender.trait_engine.catalog_sample import is_recommendation_eligible_row

    return is_recommendation_eligible_row(row, family=record.family)


def _annotate_recommendation_eligibility(
    records: list[DiffPairRecord],
    seed_rows: dict[str, dict[str, Any]],
) -> list[DiffPairRecord]:
    annotated: list[DiffPairRecord] = []
    for record in records:
        eligible = _resolve_recommendation_eligible(record, seed_rows)
        if eligible == record.recommendation_eligible:
            annotated.append(record)
            continue
        annotated.append(
            DiffPairRecord(
                status=record.status,
                family=record.family,
                similarity=record.similarity,
                seed_id=record.seed_id,
                seed_name=record.seed_name,
                crawl_id=record.crawl_id,
                crawl_name=record.crawl_name,
                crawl_category=record.crawl_category,
                crawl_brand=record.crawl_brand,
                match_key_seed=record.match_key_seed,
                match_key_crawl=record.match_key_crawl,
                recommendation_eligible=eligible,
            ),
        )
    return annotated


def _pair_records_for_family(
    seed_rows: list[SeedCatalogItem],
    crawl_rows: list[CrawlCandidateItem],
    *,
    fuzzy_threshold: float,
) -> list[DiffPairRecord]:
    if not seed_rows and not crawl_rows:
        return []

    candidates: list[tuple[float, int, int]] = []
    for si, seed in enumerate(seed_rows):
        for ci, crawl in enumerate(crawl_rows):
            if not pairing_allowed(seed.name, crawl.name):
                continue
            score = name_similarity(seed.name, crawl.name)
            if score >= fuzzy_threshold:
                candidates.append((score, si, ci))
    candidates.sort(key=lambda row: row[0], reverse=True)

    used_seed: set[int] = set()
    used_crawl: set[int] = set()
    pairs: list[tuple[SeedCatalogItem, CrawlCandidateItem, float]] = []
    for score, si, ci in candidates:
        if si in used_seed or ci in used_crawl:
            continue
        used_seed.add(si)
        used_crawl.add(ci)
        pairs.append((seed_rows[si], crawl_rows[ci], score))

    records: list[DiffPairRecord] = []
    for seed, crawl, score in pairs:
        key_seed = build_match_key(seed.name)
        key_crawl = build_match_key(crawl.name)
        status: DiffStatus = "matched" if key_seed == key_crawl else "name_changed"
        records.append(
            DiffPairRecord(
                status=status,
                family=seed.family,
                similarity=round(score, 4),
                seed_id=seed.id,
                seed_name=seed.name,
                crawl_id=crawl.id,
                crawl_name=crawl.name,
                crawl_category=crawl.category,
                crawl_brand=crawl.brand,
                match_key_seed=key_seed,
                match_key_crawl=key_crawl,
            ),
        )

    for si, seed in enumerate(seed_rows):
        if si in used_seed:
            continue
        records.append(
            DiffPairRecord(
                status="seed_only",
                family=seed.family,
                similarity=0.0,
                seed_id=seed.id,
                seed_name=seed.name,
                crawl_id=None,
                crawl_name=None,
                crawl_category=None,
                crawl_brand=None,
                match_key_seed=build_match_key(seed.name),
                match_key_crawl=None,
            ),
        )

    for ci, crawl in enumerate(crawl_rows):
        if ci in used_crawl:
            continue
        records.append(
            DiffPairRecord(
                status="new_in_crawl",
                family=crawl.family,
                similarity=0.0,
                seed_id=None,
                seed_name=None,
                crawl_id=crawl.id,
                crawl_name=crawl.name,
                crawl_category=crawl.category,
                crawl_brand=crawl.brand,
                match_key_seed=None,
                match_key_crawl=build_match_key(crawl.name),
            ),
        )

    return records


def diff_seed_and_inventory(
    seed_items: list[SeedCatalogItem],
    crawl_items: list[CrawlCandidateItem],
    *,
    fuzzy_threshold: float = _DEFAULT_FUZZY_THRESHOLD,
) -> tuple[list[DiffPairRecord], SeedInventoryDiffReport]:
    report = SeedInventoryDiffReport(fuzzy_threshold=fuzzy_threshold)
    all_records: list[DiffPairRecord] = []
    by_family: dict[str, dict[str, int]] = {}

    for family in SEED_FAMILIES:
        seed_rows = [row for row in seed_items if row.family == family]
        crawl_rows = [row for row in crawl_items if row.family == family]
        family_records = _pair_records_for_family(
            seed_rows,
            crawl_rows,
            fuzzy_threshold=fuzzy_threshold,
        )
        all_records.extend(family_records)
        bucket = by_family.setdefault(family, {})
        for record in family_records:
            bucket[record.status] = bucket.get(record.status, 0) + 1

    report.matched_count = sum(1 for row in all_records if row.status == "matched")
    report.name_changed_count = sum(1 for row in all_records if row.status == "name_changed")
    report.new_in_crawl_count = sum(1 for row in all_records if row.status == "new_in_crawl")
    report.seed_only_count = sum(1 for row in all_records if row.status == "seed_only")
    report.by_family = by_family
    report.summary_lines = build_diff_summary(report)
    return all_records, report


def build_diff_summary(report: SeedInventoryDiffReport) -> list[str]:
    lines = [
        f"fuzzy threshold: {report.fuzzy_threshold}",
        f"matched: {report.matched_count}",
        f"name_changed: {report.name_changed_count}",
        f"new_in_crawl: {report.new_in_crawl_count}",
        f"seed_only: {report.seed_only_count}",
    ]
    if report.by_family:
        lines.append("by family:")
        for family in SEED_FAMILIES:
            stats = report.by_family.get(family)
            if not stats:
                continue
            parts = ", ".join(f"{status}={count}" for status, count in sorted(stats.items()))
            lines.append(f"  - {family}: {parts}")
    return lines


def _record_to_dict(record: DiffPairRecord) -> dict[str, Any]:
    return asdict(record)


def build_diff_payload(
    records: list[DiffPairRecord],
    *,
    report: SeedInventoryDiffReport,
) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = {
        "matched": [],
        "name_changed": [],
        "new_in_crawl": [],
        "seed_only": [],
    }
    for record in records:
        grouped[record.status].append(_record_to_dict(record))

    for key in grouped:
        grouped[key].sort(key=lambda row: (row.get("family") or "", row.get("seed_name") or row.get("crawl_name") or ""))

    return {
        "schemaVersion": DIFF_SCHEMA_VERSION,
        "source": {
            "seedPath": report.seed_path.replace("\\", "/"),
            "candidatesPath": report.candidates_path.replace("\\", "/"),
            "generatedAt": report.generated_at or datetime.now(UTC).isoformat(),
        },
        "stats": {
            "fuzzyThreshold": report.fuzzy_threshold,
            "matched": report.matched_count,
            "nameChanged": report.name_changed_count,
            "newInCrawl": report.new_in_crawl_count,
            "seedOnly": report.seed_only_count,
            "byFamily": report.by_family,
        },
        "matched": grouped["matched"],
        "name_changed": grouped["name_changed"],
        "new_in_crawl": grouped["new_in_crawl"],
        "seed_only": grouped["seed_only"],
    }


def format_diff_report_text(report: SeedInventoryDiffReport, records: list[DiffPairRecord]) -> str:
    lines = ["Swagkey seed vs inventory diff report", "====================================", ""]
    lines.extend(report.summary_lines)

    def append_section(title: str, status: DiffStatus, limit: int = 25) -> None:
        rows = [row for row in records if row.status == status]
        if not rows:
            return
        lines.extend(["", f"{title} ({len(rows)}):"])
        for row in rows[:limit]:
            if status in {"matched", "name_changed"}:
                eligible = row.recommendation_eligible
                eligible_label = "?" if eligible is None else ("yes" if eligible else "no")
                lines.append(
                    f"  [{row.family}] {row.similarity:.3f} | eligible={eligible_label} | "
                    f"seed: {row.seed_name}  <->  crawl: {row.crawl_name}",
                )
            elif status == "new_in_crawl":
                lines.append(
                    f"  [{row.family}] eligible=no (browse merge) | {row.crawl_name} ({row.crawl_id})",
                )
            else:
                eligible = row.recommendation_eligible
                eligible_label = "?" if eligible is None else ("yes" if eligible else "no")
                lines.append(
                    f"  [{row.family}] eligible={eligible_label} | {row.seed_name} ({row.seed_id})",
                )
        if len(rows) > limit:
            lines.append(f"  ... and {len(rows) - limit} more")

    append_section("name_changed", "name_changed", 20)
    append_section("new_in_crawl (step 4-5 targets)", "new_in_crawl", 25)
    append_section("seed_only (review queue)", "seed_only", 25)
    lines.append("")
    return "\n".join(lines)


def diff_seed_inventory_files(
    seed_path: Path,
    candidates_path: Path,
    *,
    fuzzy_threshold: float = _DEFAULT_FUZZY_THRESHOLD,
    generated_at: datetime | None = None,
) -> tuple[list[DiffPairRecord], SeedInventoryDiffReport, dict[str, Any]]:
    seed_items = load_seed_catalog_items(seed_path)
    crawl_items = load_crawl_candidate_items(candidates_path)
    records, report = diff_seed_and_inventory(
        seed_items,
        crawl_items,
        fuzzy_threshold=fuzzy_threshold,
    )
    records = _annotate_recommendation_eligibility(records, build_seed_row_index(seed_path))
    report.seed_path = str(seed_path).replace("\\", "/")
    report.candidates_path = str(candidates_path).replace("\\", "/")
    report.generated_at = (generated_at or datetime.now(UTC)).isoformat()
    payload = build_diff_payload(records, report=report)
    return records, report, payload


def write_diff_outputs(
    *,
    payload: dict[str, Any],
    report: SeedInventoryDiffReport,
    records: list[DiffPairRecord],
    out_json: Path,
    report_txt: Path,
) -> None:
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_txt.write_text(format_diff_report_text(report, records), encoding="utf-8")
