#!/usr/bin/env python3
"""Run catalog ingestion pipeline (detect/extract/normalize/validate/diff/ingest)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from keyboard_recommender.catalog.ingestion_models import IngestionConfig
from keyboard_recommender.catalog.ingestion_pipeline import run_catalog_ingestion


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", required=True, help="Path to seed JSON")
    parser.add_argument("--manifest", required=True, help="Path to ingestion source manifest JSON")
    parser.add_argument("--base-dir", default="", help="Base dir for relative source files (default: manifest dir)")
    parser.add_argument("--out", default="", help="Output seed path (default: overwrite --seed when published)")
    parser.add_argument("--report", default="", help="Write pipeline report JSON to this path")
    parser.add_argument("--require-review", action="store_true", help="Require explicit approval before publish")
    parser.add_argument("--approve-review", action="store_true", help="Approve review step for this run")
    parser.add_argument("--apply-removals", action="store_true", help="Apply removals detected by diff")
    args = parser.parse_args()

    seed_path = Path(args.seed).resolve()
    manifest_path = Path(args.manifest).resolve()
    base_dir = Path(args.base_dir).resolve() if args.base_dir else manifest_path.parent
    out_path = Path(args.out).resolve() if args.out else seed_path

    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))
    cfg = IngestionConfig(
        require_review=bool(args.require_review),
        review_approved=bool(args.approve_review),
        apply_removals=bool(args.apply_removals),
    )
    updated, report = run_catalog_ingestion(
        seed_payload=seed_payload,
        manifest_path=manifest_path,
        base_dir=base_dir,
        cfg=cfg,
    )

    if report.published:
        out_path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"wrote seed: {out_path}")
    else:
        print("publish skipped")

    report_payload = {
        "detectedSources": [
            {"sourceType": row.source_type, "path": row.path}
            for row in report.detected_sources
        ],
        "extractedCount": report.extracted_count,
        "normalizedCount": report.normalized_count,
        "validationErrors": [
            {"code": x.code, "family": x.family, "itemId": x.item_id, "message": x.message}
            for x in report.validation_errors
        ],
        "validationWarnings": [
            {"code": x.code, "family": x.family, "itemId": x.item_id, "message": x.message}
            for x in report.validation_warnings
        ],
        "diff": {
            "new": list(report.diff.new_ids),
            "changed": list(report.diff.changed_ids),
            "removed": list(report.diff.removed_ids),
        },
        "published": report.published,
        "reviewRequired": report.review_required,
        "summaryLines": list(report.summary_lines),
    }
    if args.report:
        report_path = Path(args.report).resolve()
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"wrote report: {report_path}")
    else:
        print(json.dumps(report_payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

