#!/usr/bin/env python3
"""Clean Swagkey crawl CSV → swagkey_inventory.v1.json + cleaning reports."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_inventory import clean_inventory_csv_file, write_inventory_outputs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    parser.add_argument(
        "--csv",
        type=Path,
        default=default_dir / "swagkey_products.csv",
        help="Input crawl CSV (default: backend/data/swagkey_inventory/swagkey_products.csv)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_dir / "swagkey_inventory.v1.json",
        help="Cleaned inventory JSON output",
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        default=default_dir / "swagkey_inventory_cleaning_report.json",
        help="Machine-readable cleaning report JSON",
    )
    parser.add_argument(
        "--report-txt",
        type=Path,
        default=default_dir / "swagkey_inventory_cleaning_report.txt",
        help="Human-readable cleaning report text",
    )
    args = parser.parse_args()

    csv_path = args.csv.resolve()
    if not csv_path.is_file():
        print(f"error: csv not found: {csv_path}", file=sys.stderr)
        return 1

    _items, report, payload = clean_inventory_csv_file(csv_path)
    write_inventory_outputs(
        payload=payload,
        report=report,
        out_json=args.out.resolve(),
        report_json=args.report_json.resolve(),
        report_txt=args.report_txt.resolve(),
    )

    print(f"wrote inventory: {args.out.resolve()} ({report.kept_count} items)")
    print(f"wrote report json: {args.report_json.resolve()}")
    print(f"wrote report txt: {args.report_txt.resolve()}")
    for line in report.summary_lines:
        print(line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
