#!/usr/bin/env python3
"""Audit catalog browse 1:1 coverage vs Swagkey inventory (roadmap Phase 0 Task 0-1)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.catalog_1to1_coverage import (
    COVERAGE_GAP_THRESHOLD_PCT,
    audit_catalog_1to1_coverage,
    check_coverage_gap_thresholds,
    format_coverage_gap_violations,
    write_coverage_outputs,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    repo_backend = Path(__file__).resolve().parents[1]
    default_inventory_dir = repo_backend / "data" / "swagkey_inventory"
    default_seed = (
        repo_backend
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument(
        "--inventory",
        type=Path,
        default=None,
        help="Inventory JSON (default: latest swagkey_inventory.v*.json)",
    )
    parser.add_argument(
        "--candidates",
        type=Path,
        default=default_inventory_dir / "recommender_candidates.json",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=default_inventory_dir / "swagkey_products.csv",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_inventory_dir / "catalog_1to1_coverage_report.json",
    )
    parser.add_argument(
        "--report-txt",
        type=Path,
        default=default_inventory_dir / "catalog_1to1_coverage_report.txt",
    )
    parser.add_argument(
        "--check-threshold",
        action="store_true",
        help=f"Evaluate browse gap vs inventory (default threshold {COVERAGE_GAP_THRESHOLD_PCT:g}%%)",
    )
    parser.add_argument(
        "--threshold-pct",
        type=float,
        default=COVERAGE_GAP_THRESHOLD_PCT,
        help="Max allowed |gap| percent per family (layout uses real PCB counts)",
    )
    parser.add_argument(
        "--fail-on-gap",
        action="store_true",
        help="Exit 1 when any family exceeds --threshold-pct",
    )
    parser.add_argument(
        "--warn-only",
        action="store_true",
        help="With --check-threshold: print violations but exit 0 (CI warning stage)",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    candidates_path = args.candidates.resolve()
    if not seed_path.is_file():
        print(f"error: seed json not found: {seed_path}", file=sys.stderr)
        return 1
    if not candidates_path.is_file():
        print(f"error: candidates json not found: {candidates_path}", file=sys.stderr)
        print("hint: run scripts/classify_swagkey_inventory.py first", file=sys.stderr)
        return 1

    report = audit_catalog_1to1_coverage(
        seed_path=seed_path,
        inventory_path=args.inventory.resolve() if args.inventory else None,
        candidates_path=candidates_path,
        csv_path=args.csv.resolve(),
        inventory_dir=default_inventory_dir,
    )
    gap_check = None
    if args.check_threshold or args.fail_on_gap:
        gap_check = check_coverage_gap_thresholds(report, threshold_pct=args.threshold_pct)

    write_coverage_outputs(
        report,
        out_json=args.out.resolve(),
        report_txt=args.report_txt.resolve(),
        gap_check=gap_check,
    )

    print(json.dumps({"families": report.families, "layoutArchetype": report.layout_archetype}, ensure_ascii=False, indent=2))
    for line in report.summary_lines:
        print(line)
    if gap_check is not None:
        for line in format_coverage_gap_violations(gap_check):
            print(line)
    print(f"wrote json: {args.out.resolve()}")
    print(f"wrote txt: {args.report_txt.resolve()}")

    if gap_check is not None and not gap_check.passed:
        if args.fail_on_gap and not args.warn_only:
            return 1
        if args.fail_on_gap and args.warn_only:
            print("warning: coverage gap threshold exceeded (warn-only mode)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
