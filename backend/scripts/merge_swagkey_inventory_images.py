#!/usr/bin/env python3
"""Merge product image URLs from swagkey_product_images.json into inventory v3."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_merge import (
    build_image_lookup,
    load_product_images_artifact,
    merge_images_into_inventory,
    write_json,
)


def main() -> int:
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path, default=default_dir / "swagkey_inventory.v2.json")
    parser.add_argument("--images", type=Path, default=default_dir / "swagkey_product_images.json")
    parser.add_argument("--out", type=Path, default=default_dir / "swagkey_inventory.v3.json")
    parser.add_argument("--report-json", type=Path, default=default_dir / "image_inventory_merge_report.json")
    args = parser.parse_args()

    inventory_path = args.inventory.resolve()
    images_path = args.images.resolve()
    for label, path in (("inventory", inventory_path), ("images", images_path)):
        if not path.is_file():
            print(f"missing {label}: {path}", file=sys.stderr)
            return 1

    inventory_payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    image_lookup = build_image_lookup(load_product_images_artifact(images_path))
    merged, report = merge_images_into_inventory(inventory_payload, image_lookup)
    report.inventory_in = str(inventory_path).replace("\\", "/")
    report.images_in = str(images_path).replace("\\", "/")
    report.inventory_out = str(args.out.resolve()).replace("\\", "/")

    write_json(args.out.resolve(), merged)
    write_json(args.report_json.resolve(), report.to_dict())

    print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    print(f"out={args.out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
