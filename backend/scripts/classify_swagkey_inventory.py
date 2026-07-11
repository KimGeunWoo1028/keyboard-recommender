#!/usr/bin/env python3
"""Classify cleaned Swagkey inventory → recommender_candidates.json."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_inventory_classifier import (
    classify_inventory_json_file,
    write_classification_outputs,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    parser.add_argument(
        "--inventory",
        type=Path,
        default=default_dir / "swagkey_inventory.v4.json",
        help="Cleaned inventory JSON (default: backend/data/swagkey_inventory/swagkey_inventory.v4.json)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_dir / "recommender_candidates.json",
        help="Recommender candidates JSON output",
    )
    parser.add_argument(
        "--report-txt",
        type=Path,
        default=default_dir / "recommender_classification_report.txt",
        help="Human-readable classification report",
    )
    args = parser.parse_args()

    inventory_path = args.inventory.resolve()
    if not inventory_path.is_file():
        print(f"error: inventory json not found: {inventory_path}", file=sys.stderr)
        print("hint: run scripts/clean_swagkey_inventory.py first (roadmap step 1)", file=sys.stderr)
        return 1

    classified, report, payload = classify_inventory_json_file(inventory_path)
    write_classification_outputs(
        payload=payload,
        report=report,
        classified=classified,
        out_json=args.out.resolve(),
        report_txt=args.report_txt.resolve(),
    )

    print(f"wrote candidates: {args.out.resolve()}")
    print(f"wrote report txt: {args.report_txt.resolve()}")
    for line in report.summary_lines:
        print(line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
