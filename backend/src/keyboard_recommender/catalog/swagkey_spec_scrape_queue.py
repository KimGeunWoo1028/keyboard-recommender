"""Build prioritized spec scrape queue from browse seed stubs (Phase 4)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.ingestion_pipeline import _flatten_seed
from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url

SPEC_QUEUE_SCHEMA_VERSION = "1.0.0"
QueueFamily = Literal["case", "switch", "keycap", "plate", "foam"]
_FAMILY_PRIORITY: dict[QueueFamily, int] = {
    "case": 0,
    "switch": 1,
    "keycap": 2,
    "plate": 3,
    "foam": 4,
}
_BROWSE_ONLY_KEYCAP_SCOPES = frozenset({"addon", "alpha", "mod"})


@dataclass(slots=True)
class SpecScrapeQueueReport:
    schema_version: str = SPEC_QUEUE_SCHEMA_VERSION
    generated_at: str = ""
    seed_path: str = ""
    total_candidates: int = 0
    queued: int = 0
    skipped_recommend_eligible: int = 0
    skipped_keycap_browse_only: int = 0
    skipped_missing_url: int = 0
    by_family: dict[str, int] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "seedPath": self.seed_path,
            "totalCandidates": self.total_candidates,
            "queued": self.queued,
            "skippedRecommendEligible": self.skipped_recommend_eligible,
            "skippedKeycapBrowseOnly": self.skipped_keycap_browse_only,
            "skippedMissingUrl": self.skipped_missing_url,
            "byFamily": dict(self.by_family),
            "summaryLines": self.summary_lines,
        }


def _keycap_scope(row: dict[str, Any]) -> str:
    meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
    return str(meta.get("kit_scope") or row.get("subtype") or "").strip().lower()


def _queue_family(family: str) -> QueueFamily | None:
    if family in _FAMILY_PRIORITY:
        return family  # type: ignore[return-value]
    return None


def build_spec_scrape_queue(
    seed_payload: dict[str, Any],
    *,
    prefer_recommendation_candidates: bool = True,
) -> tuple[dict[str, Any], SpecScrapeQueueReport]:
    report = SpecScrapeQueueReport(generated_at=datetime.now(UTC).isoformat())
    flat = _flatten_seed(seed_payload)
    report.total_candidates = len(flat)

    rows: list[dict[str, Any]] = []
    for (family, seed_id), wrapped in flat.items():
        queue_family = _queue_family(family)
        if queue_family is None:
            continue
        row = dict(wrapped.get("row") or {})
        if row.get("recommendationEligible") is True:
            report.skipped_recommend_eligible += 1
            continue
        if queue_family == "keycap" and _keycap_scope(row) in _BROWSE_ONLY_KEYCAP_SCOPES:
            report.skipped_keycap_browse_only += 1
            continue

        source_url = normalize_product_detail_url(str(row.get("sourceUrl") or ""))
        if not source_url or "idx=" not in source_url:
            report.skipped_missing_url += 1
            continue

        priority = _FAMILY_PRIORITY[queue_family]
        if prefer_recommendation_candidates:
            # Browse stubs awaiting enrichment sort before already-curated ineligible rows.
            recommend_rank = 0 if row.get("traitConfidence") == "name_inferred" else 1
        else:
            recommend_rank = 0
        rows.append(
            {
                "id": seed_id,
                "family": queue_family,
                "name": str(row.get("name") or "").strip(),
                "url": source_url,
                "inventoryId": str(row.get("inventoryId") or "").strip(),
                "traitConfidence": str(row.get("traitConfidence") or "").strip(),
                "recommendationEligible": bool(row.get("recommendationEligible")),
                "_sort": (priority, recommend_rank, seed_id),
            }
        )

    rows.sort(key=lambda item: item["_sort"])
    for row in rows:
        row.pop("_sort", None)
        family = str(row["family"])
        report.by_family[family] = report.by_family.get(family, 0) + 1
    report.queued = len(rows)
    report.summary_lines = [
        f"spec scrape queue: {report.queued} targets",
        f"skipped recommend-eligible: {report.skipped_recommend_eligible}",
        f"skipped keycap browse-only: {report.skipped_keycap_browse_only}",
        f"skipped missing url: {report.skipped_missing_url}",
    ]
    if report.by_family:
        report.summary_lines.append("by family:")
        for family in ("case", "switch", "keycap", "plate", "foam"):
            if family in report.by_family:
                report.summary_lines.append(f"  - {family}: {report.by_family[family]}")

    payload = {
        "schemaVersion": SPEC_QUEUE_SCHEMA_VERSION,
        "generatedAt": report.generated_at,
        "priorityOrder": ["case", "switch", "keycap", "plate", "foam"],
        "stats": report.to_dict(),
        "targets": rows,
    }
    return payload, report


def write_spec_scrape_queue(payload: dict[str, Any], out_path: Path) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out_path


def load_seed_payload(seed_path: Path) -> dict[str, Any]:
    return json.loads(seed_path.read_text(encoding="utf-8"))
