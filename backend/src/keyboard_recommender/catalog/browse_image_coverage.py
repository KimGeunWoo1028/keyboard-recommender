"""Browse-listable seed image coverage audit (Phase 4 dev gate)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.catalog_browse_policy import (
    is_browse_excluded_source_url,
    is_browse_listable_part,
)
from keyboard_recommender.catalog.ingestion_pipeline import _flatten_seed
from keyboard_recommender.catalog.layout_diagrams import (
    is_layout_archetype_part_id,
    resolve_layout_archetype_diagram_url,
)

BROWSE_IMAGE_COVERAGE_SCHEMA_VERSION = "1.0.0"
_BROWSE_FAMILIES = ("switch", "plate", "foam", "layout", "case", "keycap")
_PHASE4_MIN_COVERAGE_PCT = 85.0


@dataclass(slots=True)
class FamilyImageCoverage:
    family: str
    browse_listable: int = 0
    with_image: int = 0
    without_image: int = 0
    coverage_pct: float = 0.0
    missing_ids: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "family": self.family,
            "browseListable": self.browse_listable,
            "withImage": self.with_image,
            "withoutImage": self.without_image,
            "coveragePct": self.coverage_pct,
            "missingIds": self.missing_ids[:40],
            "missingIdsTruncated": len(self.missing_ids) > 40,
        }


@dataclass(slots=True)
class BrowseImageCoverageReport:
    schema_version: str = BROWSE_IMAGE_COVERAGE_SCHEMA_VERSION
    generated_at: str = ""
    seed_path: str = ""
    min_coverage_pct: float = _PHASE4_MIN_COVERAGE_PCT
    families: dict[str, FamilyImageCoverage] = field(default_factory=dict)
    gate_passed: bool = False
    summary_lines: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "seedPath": self.seed_path,
            "minCoveragePct": self.min_coverage_pct,
            "gatePassed": self.gate_passed,
            "families": {key: fam.to_dict() for key, fam in self.families.items()},
            "summaryLines": self.summary_lines,
        }


def _row_has_browse_image(family: str, seed_id: str, row: dict[str, Any]) -> bool:
    if family == "layout" and is_layout_archetype_part_id(seed_id):
        return bool(resolve_layout_archetype_diagram_url(seed_id))
    return bool(str(row.get("imageUrl") or "").strip())


def audit_browse_image_coverage(
    seed_payload: dict[str, Any],
    *,
    min_coverage_pct: float = _PHASE4_MIN_COVERAGE_PCT,
) -> BrowseImageCoverageReport:
    report = BrowseImageCoverageReport(
        generated_at=datetime.now(UTC).isoformat(),
        min_coverage_pct=min_coverage_pct,
    )
    flat = _flatten_seed(seed_payload)
    buckets: dict[str, FamilyImageCoverage] = {
        family: FamilyImageCoverage(family=family) for family in _BROWSE_FAMILIES
    }

    for (family, seed_id), wrapped in flat.items():
        row = dict(wrapped.get("row") or {})
        source_url = str(row.get("sourceUrl") or "")
        if is_browse_excluded_source_url(source_url):
            continue
        if not is_browse_listable_part(family, seed_id, source_url):
            continue

        bucket = buckets[family]
        bucket.browse_listable += 1
        if _row_has_browse_image(family, seed_id, row):
            bucket.with_image += 1
        else:
            bucket.without_image += 1
            bucket.missing_ids.append(seed_id)

    gate_passed = True
    summary_lines = ["browse image coverage by family:"]
    for family in _BROWSE_FAMILIES:
        bucket = buckets[family]
        if bucket.browse_listable:
            bucket.coverage_pct = round((bucket.with_image / bucket.browse_listable) * 100, 2)
        else:
            bucket.coverage_pct = 100.0
        report.families[family] = bucket
        line = (
            f"  {family}: {bucket.with_image}/{bucket.browse_listable} "
            f"({bucket.coverage_pct}%)"
        )
        summary_lines.append(line)
        if bucket.browse_listable and bucket.coverage_pct < min_coverage_pct:
            gate_passed = False

    report.gate_passed = gate_passed
    report.summary_lines = summary_lines + [f"gate >= {min_coverage_pct}%: {gate_passed}"]
    return report


def load_seed_payload(seed_path: Path) -> dict[str, Any]:
    return json.loads(seed_path.read_text(encoding="utf-8"))
