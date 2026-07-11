#!/usr/bin/env python3
"""Diff Swagkey seed catalog vs recommender crawl candidates."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_seed_inventory_diff import (
    diff_seed_inventory_files,
    write_diff_outputs,
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
    parser.add_argument(
        "--seed",
        type=Path,
        default=default_seed,
        help="Path to swagkey_products.seed.json",
    )
    parser.add_argument(
        "--candidates",
        type=Path,
        default=default_inventory_dir / "recommender_candidates.json",
        help="Path to recommender_candidates.json (roadmap step 2 output)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_inventory_dir / "seed_inventory_diff.json",
        help="Diff JSON output",
    )
    parser.add_argument(
        "--report-txt",
        type=Path,
        default=default_inventory_dir / "seed_inventory_diff_report.txt",
        help="Human-readable diff report",
    )
    parser.add_argument(
        "--fuzzy-threshold",
        type=float,
        default=0.86,
        help="Minimum name similarity (0-1) to pair seed and crawl rows",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    candidates_path = args.candidates.resolve()
    if not seed_path.is_file():
        print(f"error: seed json not found: {seed_path}", file=sys.stderr)
        return 1
    if not candidates_path.is_file():
        print(f"error: candidates json not found: {candidates_path}", file=sys.stderr)
        print("hint: run scripts/classify_swagkey_inventory.py first (roadmap step 2)", file=sys.stderr)
        return 1
    if not 0.0 < args.fuzzy_threshold <= 1.0:
        print("error: --fuzzy-threshold must be in (0, 1]", file=sys.stderr)
        return 1

    records, report, payload = diff_seed_inventory_files(
        seed_path,
        candidates_path,
        fuzzy_threshold=float(args.fuzzy_threshold),
    )
    write_diff_outputs(
        payload=payload,
        report=report,
        records=records,
        out_json=args.out.resolve(),
        report_txt=args.report_txt.resolve(),
    )

    print(f"wrote diff json: {args.out.resolve()}")
    print(f"wrote report txt: {args.report_txt.resolve()}")
    for line in report.summary_lines:
        print(line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
