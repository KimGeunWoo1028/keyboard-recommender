#!/usr/bin/env python3
"""Step ⑧: merge case_kit inventory candidates into swagkey seed as keyboard_cases."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_case_seed_builder import (
    count_cases_in_seed,
    merge_case_kits_into_seed,
)


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    data = backend / "data" / "swagkey_inventory"
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument("--candidates", type=Path, default=data / "recommender_candidates.json")
    parser.add_argument("--inventory", type=Path, default=data / "swagkey_inventory.v2.json")
    parser.add_argument("--out", type=Path, default=data / "swagkey_products.seed.with_cases.json")
    parser.add_argument("--report-json", type=Path, default=data / "keyboard_cases_seed_report.json")
    parser.add_argument("--apply-to-seed", action="store_true")
    parser.add_argument("--fail-on-reject", action="store_true")
    args = parser.parse_args()

    for label, path in (
        ("seed", args.seed),
        ("candidates", args.candidates),
        ("inventory", args.inventory),
    ):
        if not path.is_file():
            print(f"error: {label} not found: {path}", file=sys.stderr)
            return 1

    seed_payload = json.loads(args.seed.read_text(encoding="utf-8"))
    before = count_cases_in_seed(seed_payload)
    merged, report = merge_case_kits_into_seed(seed_payload, args.candidates, args.inventory)
    after = count_cases_in_seed(merged)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote: {args.out.resolve()}")
    print(f"cases: {before} -> {after} (+{report.added}, skipped={report.skipped_existing})")
    if report.rejected:
        print(f"warning: {len(report.rejected)} rejected — see {args.report_json.resolve()}", file=sys.stderr)
        if args.fail_on_reject:
            return 1

    if args.apply_to_seed:
        shutil.copy2(args.out, args.seed)
        print(f"applied merged seed -> {args.seed.resolve()}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
