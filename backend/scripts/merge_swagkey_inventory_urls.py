#!/usr/bin/env python3
"""Merge crawled product URLs into cleaned inventory JSON (idx-aware, Phase 1 v4)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_crawler_v2 import (
    enrich_inventory_payload_with_crawl,
    load_crawl_payload,
)


def _copy_image_fields_by_idx(
    target_items: list[dict],
    prior_items: list[dict],
) -> int:
    by_idx: dict[str, dict] = {}
    for row in prior_items:
        idx = str(row.get("swagkeyProductId") or "").strip()
        if idx:
            by_idx[idx] = row
    copied = 0
    for index, row in enumerate(target_items):
        idx = str(row.get("swagkeyProductId") or "").strip()
        if not idx:
            continue
        prior = by_idx.get(idx)
        if prior is None:
            continue
        merged = dict(row)
        changed = False
        for field in ("imageUrl", "imageWidth", "imageHeight", "imageSource"):
            if field in prior and prior.get(field) and not merged.get(field):
                merged[field] = prior[field]
                changed = True
        if changed:
            target_items[index] = merged
            copied += 1
    return copied


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    parser.add_argument(
        "--inventory",
        type=Path,
        default=default_dir / "swagkey_inventory.v1.json",
        help="Cleaned inventory JSON base (step 1 output)",
    )
    parser.add_argument(
        "--prior-inventory",
        type=Path,
        default=default_dir / "swagkey_inventory.v3.json",
        help="Prior inventory for image field copy by idx (optional)",
    )
    parser.add_argument(
        "--crawl",
        type=Path,
        default=default_dir / "swagkey_crawl_urls.v2.json",
        help="Crawl URLs JSON (crawler v2 output)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=default_dir / "swagkey_inventory.v4.json",
        help="Crawl-merged inventory output",
    )
    args = parser.parse_args()

    inventory_path = args.inventory.resolve()
    crawl_path = args.crawl.resolve()
    if not inventory_path.is_file():
        print(f"error: inventory not found: {inventory_path}", file=sys.stderr)
        print("hint: run scripts/clean_swagkey_inventory.py first", file=sys.stderr)
        return 1
    if not crawl_path.is_file():
        print(f"error: crawl json not found: {crawl_path}", file=sys.stderr)
        print("hint: run scripts/crawl_swagkey_product_urls.py first", file=sys.stderr)
        return 1

    inventory_payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    crawled = load_crawl_payload(crawl_path)
    enriched, stats = enrich_inventory_payload_with_crawl(inventory_payload, crawled)

    prior_path = args.prior_inventory.resolve()
    images_copied = 0
    if prior_path.is_file():
        prior_payload = json.loads(prior_path.read_text(encoding="utf-8"))
        prior_items = prior_payload.get("items")
        if isinstance(prior_items, list):
            items = enriched.get("items")
            if isinstance(items, list):
                images_copied = _copy_image_fields_by_idx(items, prior_items)
                source = dict(enriched.get("source") if isinstance(enriched.get("source"), dict) else {})
                prior_source = prior_payload.get("source") if isinstance(prior_payload.get("source"), dict) else {}
                if prior_source.get("imageMergedAt"):
                    source["imageMergedAt"] = prior_source["imageMergedAt"]
                enriched["source"] = source

    out_path = args.out.resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote inventory: {out_path}")
    print(f"crawl merge matched: {stats.get('matched', 0)}")
    print(f"crawl merge appended_new: {stats.get('appended_new', 0)}")
    print(f"crawl merge name_changed: {stats.get('name_changed', 0)}")
    print(f"crawl merge unmatched_inventory: {stats.get('unmatched_inventory', 0)}")
    print(f"image fields copied from prior: {images_copied}")
    if stats.get("matched", 0) == 0 and stats.get("appended_new", 0) == 0:
        print("warning: crawl merge made no changes", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
