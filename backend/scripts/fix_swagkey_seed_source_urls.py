#!/usr/bin/env python3
"""Fix seed sourceUrl values that point at Swagkey category pages instead of product detail (?idx=)."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_source_url import fix_seed_source_urls, load_swagkey_url_resolver


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    data = backend / "data" / "swagkey_inventory"
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument("--inventory", type=Path, default=data / "swagkey_inventory.v2.json")
    parser.add_argument("--diff", type=Path, default=data / "seed_inventory_diff.json")
    parser.add_argument("--out", type=Path, default=data / "swagkey_products.seed.urls_fixed.json")
    parser.add_argument("--report-json", type=Path, default=data / "swagkey_seed_url_fix_report.json")
    parser.add_argument("--apply-to-seed", action="store_true")
    args = parser.parse_args()

    for label, path in (("seed", args.seed), ("inventory", args.inventory), ("diff", args.diff)):
        if not path.is_file():
            print(f"error: {label} not found: {path}", file=sys.stderr)
            return 1

    seed_payload = json.loads(args.seed.read_text(encoding="utf-8"))
    resolver = load_swagkey_url_resolver(args.inventory.resolve(), diff_path=args.diff.resolve())
    fixed_payload, report = fix_seed_source_urls(seed_payload, resolver=resolver)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(fixed_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote: {args.out.resolve()}")
    print(
        f"scanned={report.scanned} already_detail={report.already_detail} "
        f"fixed={report.fixed} unresolved={report.unresolved}",
    )
    if report.unresolved:
        print(f"warning: {report.unresolved} rows still lack product detail URLs — see {args.report_json.resolve()}", file=sys.stderr)

    if args.apply_to_seed:
        shutil.copy2(args.out, args.seed)
        print(f"applied fixed seed -> {args.seed.resolve()}")

    return 0 if report.unresolved == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
