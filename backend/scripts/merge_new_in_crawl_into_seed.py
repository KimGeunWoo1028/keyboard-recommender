#!/usr/bin/env python3
"""Step ⑤: merge new_in_crawl targets + specs into swagkey seed (stub → enrich → traits)."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_new_in_crawl_seed_merge import (
    count_seed_items,
    merge_new_in_crawl_into_seed,
    write_merge_outputs,
)


def main() -> int:
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    default_seed = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed, help="Base swagkey_products.seed.json")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=default_dir / "new_in_crawl_targets" / "new_in_crawl_targets_manifest.json",
    )
    parser.add_argument(
        "--switch-specs",
        type=Path,
        default=default_dir / "new_in_crawl_specs" / "new_in_crawl_switch_specs.json",
    )
    parser.add_argument(
        "--compat-specs",
        type=Path,
        default=default_dir / "new_in_crawl_specs" / "new_in_crawl_compat_specs.json",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_dir / "swagkey_products.seed.merged.json",
        help="Merged seed output (default: data/swagkey_inventory/swagkey_products.seed.merged.json)",
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        default=default_dir / "seed_merge_report.json",
    )
    parser.add_argument(
        "--report-txt",
        type=Path,
        default=default_dir / "seed_merge_report.txt",
    )
    parser.add_argument(
        "--apply-to-seed",
        action="store_true",
        help="Copy merged output over catalog swagkey_products.seed.json (use after reviewing report)",
    )
    parser.add_argument(
        "--fail-on-reject",
        action="store_true",
        help="Exit 1 if any target row is rejected",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    for label, path in (
        ("seed", seed_path),
        ("manifest", args.manifest.resolve()),
        ("switch-specs", args.switch_specs.resolve()),
        ("compat-specs", args.compat_specs.resolve()),
    ):
        if not path.is_file():
            print(f"error: {label} not found: {path}", file=sys.stderr)
            return 1

    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    switch_specs = json.loads(args.switch_specs.read_text(encoding="utf-8"))
    compat_specs = json.loads(args.compat_specs.read_text(encoding="utf-8"))

    merged, report = merge_new_in_crawl_into_seed(seed_payload, manifest, switch_specs, compat_specs)
    write_merge_outputs(
        merged_payload=merged,
        report=report,
        out_seed=args.out.resolve(),
        report_json=args.report_json.resolve(),
        report_txt=args.report_txt.resolve(),
    )

    before = count_seed_items(seed_payload)
    after = count_seed_items(merged)
    print(f"wrote merged seed: {args.out.resolve()}")
    print(f"wrote report: {args.report_json.resolve()}")
    print(
        "counts:",
        ", ".join(f"{k} {before[k]}→{after[k]}" for k in ("plate", "foam", "layout", "switch")),
    )
    if report.rejected:
        print(f"warning: {len(report.rejected)} row(s) rejected — see {args.report_txt.resolve()}", file=sys.stderr)
        if args.fail_on_reject:
            return 1

    if args.apply_to_seed:
        shutil.copy2(args.out.resolve(), seed_path)
        print(f"applied merged seed → {seed_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
