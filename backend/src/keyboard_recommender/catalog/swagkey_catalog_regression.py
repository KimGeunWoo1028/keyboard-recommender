"""Step ⑥ helpers: validate swagkey seed via catalog ingestion + report."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.ingestion_models import IngestionConfig
from keyboard_recommender.catalog.ingestion_pipeline import run_catalog_ingestion
from keyboard_recommender.catalog.swagkey_new_in_crawl_seed_merge import count_seed_items


@dataclass(slots=True)
class SwagkeyCatalogRegressionReport:
    schema_version: str = "1.0.0"
    generated_at: str = ""
    seed_path: str = ""
    manifest_path: str = ""
    seed_counts: dict[str, int] = field(default_factory=dict)
    extracted_count: int = 0
    validation_errors: int = 0
    validation_warnings: int = 0
    diff_new: int = 0
    diff_changed: int = 0
    diff_removed: int = 0
    published: bool = False
    summary_lines: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "seedPath": self.seed_path,
            "manifestPath": self.manifest_path,
            "seedCounts": self.seed_counts,
            "extractedCount": self.extracted_count,
            "validationErrors": self.validation_errors,
            "validationWarnings": self.validation_warnings,
            "diff": {
                "new": self.diff_new,
                "changed": self.diff_changed,
                "removed": self.diff_removed,
            },
            "published": self.published,
            "summaryLines": self.summary_lines,
        }


def validate_swagkey_catalog_ingestion(
    *,
    seed_path: Path,
    manifest_path: Path,
    base_dir: Path | None = None,
) -> tuple[SwagkeyCatalogRegressionReport, Any]:
    """
    Validate current swagkey seed through the ingestion pipeline (dry-run).

    Uses require_review without approval so normalization diff does not rewrite seed.
    """
    seed_path = seed_path.resolve()
    manifest_path = manifest_path.resolve()
    base = (base_dir or manifest_path.parent).resolve()
    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))

    out_report = SwagkeyCatalogRegressionReport(
        generated_at=datetime.now(UTC).isoformat(),
        seed_path=str(seed_path).replace("\\", "/"),
        manifest_path=str(manifest_path).replace("\\", "/"),
        seed_counts=count_seed_items(seed_payload),
    )

    _updated, ingestion = run_catalog_ingestion(
        seed_payload=seed_payload,
        manifest_path=manifest_path,
        base_dir=base,
        cfg=IngestionConfig(require_review=True, review_approved=False),
    )

    out_report.extracted_count = ingestion.extracted_count
    out_report.validation_errors = len(ingestion.validation_errors)
    out_report.validation_warnings = len(ingestion.validation_warnings)
    out_report.diff_new = len(ingestion.diff.new_ids)
    out_report.diff_changed = len(ingestion.diff.changed_ids)
    out_report.diff_removed = len(ingestion.diff.removed_ids)
    out_report.published = ingestion.published
    out_report.summary_lines = list(ingestion.summary_lines)
    out_report.summary_lines.append(
        f"seed counts: switch={out_report.seed_counts.get('switch', 0)} "
        f"plate={out_report.seed_counts.get('plate', 0)} "
        f"foam={out_report.seed_counts.get('foam', 0)} "
        f"layout={out_report.seed_counts.get('layout', 0)} "
        f"case={out_report.seed_counts.get('case', 0)} "
        f"keycap={out_report.seed_counts.get('keycap', 0)}",
    )
    return out_report, ingestion


def write_regression_report(
    report: SwagkeyCatalogRegressionReport,
    *,
    report_json: Path,
    report_txt: Path,
) -> None:
    report_json.parent.mkdir(parents=True, exist_ok=True)
    report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "Swagkey catalog regression (step ⑥) report",
        f"generated: {report.generated_at}",
        f"seed: {report.seed_path}",
        "",
        f"extracted: {report.extracted_count}",
        f"validation errors: {report.validation_errors}",
        f"validation warnings: {report.validation_warnings}",
        f"diff: +{report.diff_new} ~{report.diff_changed} -{report.diff_removed}",
        f"published: {report.published}",
        "",
        "seed counts:",
        f"  switch: {report.seed_counts.get('switch', 0)}",
        f"  plate: {report.seed_counts.get('plate', 0)}",
        f"  foam: {report.seed_counts.get('foam', 0)}",
        f"  layout: {report.seed_counts.get('layout', 0)}",
        f"  case: {report.seed_counts.get('case', 0)}",
        f"  keycap: {report.seed_counts.get('keycap', 0)}",
    ]
    if report.summary_lines:
        lines.extend(["", "ingestion summary:"])
        lines.extend(f"  {line}" for line in report.summary_lines)
    report_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")
