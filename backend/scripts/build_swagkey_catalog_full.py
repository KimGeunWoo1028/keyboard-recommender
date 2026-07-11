#!/usr/bin/env python3
"""Step ⑨: build swagkey_catalog_full.json from out_of_scope inventory candidates."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_catalog_full import (
    build_swagkey_catalog_full,
    validate_full_catalog_payload,
    write_full_catalog_outputs,
)


def main() -> int:
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", type=Path, default=default_dir / "recommender_candidates.json")
    parser.add_argument("--inventory", type=Path, default=default_dir / "swagkey_inventory.v2.json")
    parser.add_argument("--out", type=Path, default=default_dir / "swagkey_catalog_full.json")
    parser.add_argument("--report-json", type=Path, default=default_dir / "swagkey_catalog_full_report.json")
    parser.add_argument("--report-txt", type=Path, default=default_dir / "swagkey_catalog_full_report.txt")
    args = parser.parse_args()

    for label, path in (("candidates", args.candidates), ("inventory", args.inventory)):
        if not path.is_file():
            print(f"error: {label} not found: {path}", file=sys.stderr)
            return 1

    payload, report = build_swagkey_catalog_full(args.candidates.resolve(), args.inventory.resolve())
    issues = validate_full_catalog_payload(payload)
    if issues:
        print("validation failed:", file=sys.stderr)
        for msg in issues[:20]:
            print(f"  - {msg}", file=sys.stderr)
        return 1

    write_full_catalog_outputs(
        payload=payload,
        report=report,
        out_json=args.out.resolve(),
        report_json=args.report_json.resolve(),
        report_txt=args.report_txt.resolve(),
    )
    print(f"wrote: {args.out.resolve()}")
    print(f"items: {report.item_count}, withUrl: {report.with_url}, missingUrl: {report.missing_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
