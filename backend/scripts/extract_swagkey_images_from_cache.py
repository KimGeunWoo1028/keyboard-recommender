#!/usr/bin/env python3
"""Extract Swagkey product images from local HTML caches (offline, no HTTP)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_cache_backfill import (
    default_cache_roots,
    discover_cache_html_files,
    extract_images_from_cache_files,
    load_seed_payload,
    write_cache_backfill_report,
)


def _default_out_path(data_dir: Path) -> Path:
    return data_dir / "swagkey_inventory" / "swagkey_product_images.json"


def _default_failures_path(out_path: Path) -> Path:
    return out_path.with_name(f"{out_path.stem}.failures.json")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        default="data",
        help="Backend data directory (default: data)",
    )
    parser.add_argument(
        "--seed",
        default="",
        help="Optional seed JSON for seedId/sourceUrl hints (default: src/.../swagkey_products.seed.json)",
    )
    parser.add_argument(
        "--cache-root",
        action="append",
        default=[],
        help="Additional cache root (repeatable). Defaults to swagkey_html_cache + new_in_crawl html caches.",
    )
    parser.add_argument(
        "--out",
        default="",
        help="Output JSON path (default: data/swagkey_inventory/swagkey_product_images.json)",
    )
    parser.add_argument(
        "--failures-out",
        default="",
        help="Optional failures JSON path (default: <out>.failures.json)",
    )
    args = parser.parse_args()

    backend_root = Path(__file__).resolve().parents[1]
    repo_root = backend_root.parent
    data_dir = (backend_root / args.data_dir).resolve()
    out_path = Path(args.out).resolve() if args.out else _default_out_path(data_dir)
    failures_out = Path(args.failures_out).resolve() if args.failures_out else _default_failures_path(out_path)

    seed_path = (
        Path(args.seed).resolve()
        if args.seed
        else backend_root / "src/keyboard_recommender/catalog/swagkey_products.seed.json"
    )
    cache_roots = [Path(p).resolve() for p in args.cache_root] if args.cache_root else default_cache_roots(data_dir)
    cache_files = discover_cache_html_files(cache_roots)
    report = extract_images_from_cache_files(
        cache_files,
        seed_payload=load_seed_payload(seed_path),
        repo_root=repo_root,
    )

    write_cache_backfill_report(report, out_path)
    failures_payload = {
        "schemaVersion": report.schema_version,
        "generatedAt": report.generated_at,
        "failures": [
            {
                "cacheFile": failure.cache_file,
                "seedIdHint": failure.seed_id_hint,
                "sourceUrlHint": failure.source_url_hint,
                "reason": failure.reason,
                "detail": failure.detail,
            }
            for failure in report.failures
        ],
    }
    failures_out.parent.mkdir(parents=True, exist_ok=True)
    failures_out.write_text(json.dumps(failures_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report.stats, ensure_ascii=False, indent=2))
    print(f"out={out_path}")
    print(f"failures={failures_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
