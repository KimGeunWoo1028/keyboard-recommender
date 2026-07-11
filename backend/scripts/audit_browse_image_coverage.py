#!/usr/bin/env python3
"""Audit browse-listable catalog image coverage (Phase 4 dev gate)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.browse_image_coverage import (
    audit_browse_image_coverage,
    load_seed_payload,
)


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    default_out = backend / "data" / "swagkey_inventory" / "browse_image_coverage_report.json"

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument("--report-json", type=Path, default=default_out)
    parser.add_argument("--report-txt", type=Path, default=default_out.with_suffix(".txt"))
    parser.add_argument("--min-coverage-pct", type=float, default=85.0)
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    if not seed_path.is_file():
        print(f"error: seed not found: {seed_path}", file=sys.stderr)
        return 1

    report = audit_browse_image_coverage(
        load_seed_payload(seed_path),
        min_coverage_pct=args.min_coverage_pct,
    )
    report.seed_path = str(seed_path).replace("\\", "/")

    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.report_txt.write_text("\n".join(report.summary_lines) + "\n", encoding="utf-8")

    print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    print(f"wrote json: {args.report_json}")
    print(f"wrote txt: {args.report_txt}")
    return 0 if report.gate_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
