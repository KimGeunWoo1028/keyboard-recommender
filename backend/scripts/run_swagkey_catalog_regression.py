#!/usr/bin/env python3
"""Step ⑥: validate swagkey seed via catalog ingestion (dry-run report)."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_catalog_regression import (
    validate_swagkey_catalog_ingestion,
    write_regression_report,
)


def _default_paths() -> tuple[Path, Path, Path, Path, Path]:
    backend = Path(__file__).resolve().parents[1]
    data = backend / "data"
    return (
        backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json",
        data / "catalog_ingestion_manifest.json",
        data / "swagkey_catalog_regression_report.json",
        data / "swagkey_catalog_regression_report.txt",
        backend,
    )


def main() -> int:
    seed_default, manifest_default, report_json_default, report_txt_default, backend = _default_paths()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=seed_default)
    parser.add_argument("--manifest", type=Path, default=manifest_default)
    parser.add_argument("--report-json", type=Path, default=report_json_default)
    parser.add_argument("--report-txt", type=Path, default=report_txt_default)
    parser.add_argument(
        "--skip-pytest",
        action="store_true",
        help="Only run ingestion validation (skip backend pytest suites)",
    )
    parser.add_argument(
        "--with-frontend",
        action="store_true",
        help="Also run frontend npm test (contract/smoke)",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    manifest_path = args.manifest.resolve()
    for label, path in (("seed", seed_path), ("manifest", manifest_path)):
        if not path.is_file():
            print(f"error: {label} not found: {path}", file=sys.stderr)
            return 1

    report, ingestion = validate_swagkey_catalog_ingestion(
        seed_path=seed_path,
        manifest_path=manifest_path,
        base_dir=manifest_path.parent,
    )
    write_regression_report(
        report,
        report_json=args.report_json.resolve(),
        report_txt=args.report_txt.resolve(),
    )

    print(f"wrote report: {args.report_json.resolve()}")
    print(
        f"ingestion: extracted={report.extracted_count} "
        f"errors={report.validation_errors} warnings={report.validation_warnings}",
    )
    if report.validation_errors:
        for err in ingestion.validation_errors[:10]:
            print(f"  error [{err.family}] {err.item_id}: {err.message}", file=sys.stderr)
        return 1

    if args.skip_pytest:
        return 0

    pytest_targets = [
        "tests/recommendation_regression/",
        "tests/snapshot_testing/",
        "tests/test_catalog_metadata_mapping.py",
        "tests/test_catalog_ingestion_pipeline.py",
        "tests/contract/",
        "tests/test_catalog_browse.py",
        "tests/test_catalog_browse_policy.py",
        "tests/test_recommendation_pool_gate.py",
        "tests/test_catalog_1to1_coverage.py",
        "tests/test_swagkey_inventory.py",
        "tests/test_swagkey_inventory_classifier.py",
        "tests/test_swagkey_seed_inventory_diff.py",
        "tests/test_swagkey_crawler_v2.py",
        "tests/test_swagkey_new_in_crawl_seed_merge.py",
        "tests/test_swagkey_case_seed_builder.py",
        "tests/test_keycap_seed_builder.py",
        "tests/test_keycap_compatibility_rules.py",
        "tests/test_catalog_change_alert.py",
        "tests/test_swagkey_catalog_full.py",
        "tests/test_swagkey_catalog_regression.py",
    ]
    cmd = [sys.executable, "-m", "pytest", *pytest_targets, "-q"]
    print("running:", " ".join(cmd))
    result = subprocess.run(cmd, cwd=backend, check=False)
    if result.returncode != 0:
        return result.returncode

    if args.with_frontend:
        frontend = backend.parent / "frontend"
        if not (frontend / "package.json").is_file():
            print(f"warning: frontend not found at {frontend}", file=sys.stderr)
            return 0
        npm_cmd = ["npm", "test", "--", "--run"]
        print("running:", " ".join(npm_cmd))
        npm_result = subprocess.run(npm_cmd, cwd=frontend, check=False, shell=True)
        if npm_result.returncode != 0:
            return npm_result.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
