#!/usr/bin/env python3
"""Merge inventory v4 candidates into swagkey seed for catalog browse 1:1 (Phase 3)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_inventory_browse_seed_merge import (
    merge_inventory_into_browse_seed,
    write_browse_merge_outputs,
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
        default=default_inventory_dir / "swagkey_inventory.v4.json",
    )
    parser.add_argument(
        "--candidates",
        type=Path,
        default=default_inventory_dir / "recommender_candidates.json",
    )
    parser.add_argument(
        "--layout-overrides",
        type=Path,
        default=default_inventory_dir / "case_layout_overrides.json",
        help="Optional manual case layout_size overrides by inventoryId",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_inventory_dir / "swagkey_products.seed.browse_merged.json",
        help="Merged seed output (dry-run preview or --apply-to-seed target copy)",
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        default=default_inventory_dir / "inventory_browse_merge_report.json",
    )
    parser.add_argument(
        "--report-txt",
        type=Path,
        default=default_inventory_dir / "inventory_browse_merge_report.txt",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Write report only (default when --apply-to-seed is omitted)",
    )
    parser.add_argument(
        "--apply-to-seed",
        action="store_true",
        help="Write merged payload to --seed (operator only; review report first)",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    inventory_path = args.inventory.resolve()
    candidates_path = args.candidates.resolve()
    dry_run = not args.apply_to_seed if not args.dry_run else True
    if args.apply_to_seed:
        dry_run = False

    for label, path in (("seed", seed_path), ("inventory", inventory_path), ("candidates", candidates_path)):
        if not path.is_file():
            print(f"error: {label} not found: {path}", file=sys.stderr)
            return 1

    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))
    overrides = args.layout_overrides.resolve() if args.layout_overrides else None
    merged, report = merge_inventory_into_browse_seed(
        seed_payload,
        candidates_path=candidates_path,
        inventory_path=inventory_path,
        layout_overrides_path=overrides,
        dry_run=dry_run,
    )

    out_seed = seed_path if args.apply_to_seed else args.out.resolve()
    write_browse_merge_outputs(
        merged_payload=merged if not dry_run else None,
        report=report,
        out_json=out_seed if not dry_run else args.out.resolve(),
        report_json=args.report_json.resolve(),
        report_txt=args.report_txt.resolve(),
    )

    if dry_run:
        preview = args.out.resolve()
        preview.parent.mkdir(parents=True, exist_ok=True)
        preview.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"wrote dry-run preview: {preview}")

    print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    print(f"wrote report json: {args.report_json.resolve()}")
    print(f"wrote report txt: {args.report_txt.resolve()}")
    if args.apply_to_seed:
        print(f"applied merged seed: {seed_path}")
    else:
        print("dry-run only - re-run with --apply-to-seed after review")
    if report.rejected:
        print(f"warning: {len(report.rejected)} rejected rows", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
