#!/usr/bin/env python3
"""Fetch Swagkey product images for inventory rows (merge with cache backfill artifact)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_inventory_fetch import (
    collect_only_missing_product_ids,
    fetch_inventory_product_images,
    filter_inventory_rows_for_product_ids,
    load_inventory_items,
    load_product_images_artifact,
    write_fetch_failures_csv,
    write_fetch_failures_json,
    write_inventory_fetch_report,
)
from keyboard_recommender.catalog.swagkey_image_cache_backfill import load_seed_payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--inventory",
        default="data/swagkey_inventory/swagkey_inventory.v4.json",
        help="Inventory JSON with sourceUrl rows",
    )
    parser.add_argument(
        "--out",
        default="data/swagkey_inventory/swagkey_product_images.json",
        help="Merged product images artifact JSON",
    )
    parser.add_argument(
        "--seed",
        default="",
        help="Optional seed JSON for seedIds hints",
    )
    parser.add_argument(
        "--cache-dir",
        default="data/swagkey_inventory/product_image_html_cache",
        help="Optional per-product HTML cache directory ({productId}.html)",
    )
    parser.add_argument("--sleep-ms", type=int, default=800, help="Delay between fetch attempts")
    parser.add_argument("--timeout-s", type=float, default=20.0, help="Request timeout seconds")
    parser.add_argument("--max-retries", type=int, default=2, help="Retries per URL when fetch fails")
    parser.add_argument("--retry-backoff-ms", type=int, default=500, help="Backoff base milliseconds")
    parser.add_argument("--max-items", type=int, default=0, help="Optional limit for smoke runs (0 = all)")
    parser.add_argument("--no-resume", action="store_true", help="Ignore existing --out items")
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Fetch only product idx missing from artifact or seed imageUrl",
    )
    parser.add_argument("--no-network", action="store_true", help="Do not fetch HTTP (cache files only)")
    parser.add_argument("--failures-json-out", default="", help="Failures JSON path")
    parser.add_argument("--failures-csv-out", default="", help="Failures CSV path")
    args = parser.parse_args()

    backend_root = Path(__file__).resolve().parents[1]
    inventory_path = (backend_root / args.inventory).resolve()
    out_path = (backend_root / args.out).resolve()
    cache_dir = (backend_root / args.cache_dir).resolve() if args.cache_dir else None
    seed_path = (
        Path(args.seed).resolve()
        if args.seed
        else backend_root / "src/keyboard_recommender/catalog/swagkey_products.seed.json"
    )
    failures_json = (
        Path(args.failures_json_out).resolve()
        if args.failures_json_out
        else out_path.with_name(f"{out_path.stem}.failures.json")
    )
    failures_csv = (
        Path(args.failures_csv_out).resolve()
        if args.failures_csv_out
        else out_path.with_name(f"{out_path.stem}.failures.csv")
    )

    existing = load_product_images_artifact(out_path)
    inventory_rows = load_inventory_items(inventory_path)
    seed_payload = load_seed_payload(seed_path)
    if args.only_missing:
        missing_ids = collect_only_missing_product_ids(
            inventory_rows=inventory_rows,
            existing_items=list(existing.get("items") or []),
            seed_payload=seed_payload,
        )
        inventory_rows = filter_inventory_rows_for_product_ids(inventory_rows, missing_ids)
        print(f"only_missing product_ids={len(missing_ids)} inventory_rows={len(inventory_rows)}")

    report = fetch_inventory_product_images(
        inventory_rows,
        existing_items=list(existing.get("items") or []),
        seed_payload=seed_payload,
        resume=not args.no_resume,
        cache_dir=cache_dir,
        sleep_ms=max(0, args.sleep_ms),
        timeout_s=max(0.0, args.timeout_s),
        max_retries=max(0, args.max_retries),
        retry_backoff_ms=max(0, args.retry_backoff_ms),
        max_items=args.max_items if args.max_items > 0 else None,
        network_enabled=not args.no_network,
    )

    write_inventory_fetch_report(report, out_path)
    write_fetch_failures_json(failures_json, report)
    write_fetch_failures_csv(failures_csv, report.failures)

    print(json.dumps(report.stats, ensure_ascii=False, indent=2))
    print(f"out={out_path}")
    print(f"failures_json={failures_json}")
    print(f"failures_csv={failures_csv}")

    if args.only_missing:
        requested = int(report.stats.get("total") or 0)
        resolved_this_run = int(report.stats.get("fetchedThisRun") or 0)
        failed_this_run = int(report.stats.get("failed") or 0)
        attempted = resolved_this_run + failed_this_run
        pct = round((resolved_this_run / attempted) * 100, 2) if attempted else 100.0
        print(f"only_missing_attempted={attempted} resolved_this_run={resolved_this_run} pct={pct}")
        target_met = attempted == 0 or pct >= 80.0
    else:
        target_met = report.stats.get("resolvedPct", 0) >= 90.0
    print(f"target_met={target_met}")
    return 0 if target_met else 1


if __name__ == "__main__":
    raise SystemExit(main())
