#!/usr/bin/env python3
"""Merge product image URLs into swagkey_products.seed.json."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_merge import (
    apply_seed_merge,
    build_image_lookup,
    build_image_lookup_from_inventory_items,
    load_product_images_artifact,
    merge_image_lookups,
    merge_images_into_seed,
    write_json,
)


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    default_dir = backend / "data" / "swagkey_inventory"
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument("--images", type=Path, default=default_dir / "swagkey_product_images.json")
    parser.add_argument("--inventory", type=Path, default=default_dir / "swagkey_inventory.v4.json")
    parser.add_argument("--out", type=Path, default=default_dir / "swagkey_products.seed.with_images.json")
    parser.add_argument("--report-json", type=Path, default=default_dir / "image_seed_merge_report.json")
    parser.add_argument(
        "--apply-to-seed",
        action="store_true",
        help="Copy merged output over catalog swagkey_products.seed.json",
    )
    parser.add_argument(
        "--min-fill-rate",
        type=float,
        default=85.0,
        help="Exit 1 when seed fill rate is below this threshold (Phase 4 gate: 85%%)",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    images_path = args.images.resolve()
    for label, path in (("seed", seed_path), ("images", images_path)):
        if not path.is_file():
            print(f"missing {label}: {path}", file=sys.stderr)
            return 1

    inventory_items: list[dict[str, object]] = []
    inventory_path = args.inventory.resolve()
    if inventory_path.is_file():
        inventory_payload = json.loads(inventory_path.read_text(encoding="utf-8"))
        rows = inventory_payload.get("items")
        if isinstance(rows, list):
            inventory_items = [dict(row) for row in rows if isinstance(row, dict)]

    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))
    artifact_lookup = build_image_lookup(load_product_images_artifact(images_path))
    inventory_lookup = build_image_lookup_from_inventory_items(inventory_items)
    image_lookup = merge_image_lookups(artifact_lookup, inventory_lookup)
    merged_seed, report = merge_images_into_seed(
        seed_payload,
        image_lookup,
        inventory_items=inventory_items,
    )
    report.seed_in = str(seed_path).replace("\\", "/")
    report.images_in = str(images_path).replace("\\", "/")
    report.seed_out = str(args.out.resolve()).replace("\\", "/")

    write_json(args.out.resolve(), merged_seed)
    write_json(args.report_json.resolve(), report.to_dict())

    summary = {
        "seedTotal": report.seed_total,
        "withImage": report.with_image,
        "withoutImage": report.without_image,
        "fillRatePct": report.fill_rate_pct,
        "byMethod": report.by_method,
        "manualReviewCount": len(report.manual_review_queue),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"out={args.out.resolve()}")

    if args.apply_to_seed:
        apply_seed_merge(merged_seed_path=args.out.resolve(), seed_path=seed_path)
        print(f"applied_to_seed={seed_path}")

    if report.fill_rate_pct < args.min_fill_rate:
        print(
            f"fill_rate_below_threshold={report.fill_rate_pct} < {args.min_fill_rate}",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
