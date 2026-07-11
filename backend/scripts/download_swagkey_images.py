#!/usr/bin/env python3
"""Mirror Swagkey seed imageUrl values to backend/data/swagkey_images/{idx}.{ext}."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_mirror import mirror_seed_images, write_json
from keyboard_recommender.config.settings import get_settings
from keyboard_recommender.infrastructure.swagkey_images import swagkey_images_dir


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    default_report = backend / "data" / "swagkey_inventory" / "swagkey_image_mirror_report.json"

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument(
        "--images-dir",
        type=Path,
        default=None,
        help="Output directory (default: settings.swagkey_images_dir)",
    )
    parser.add_argument("--report-json", type=Path, default=default_report)
    parser.add_argument("--force", action="store_true", help="Re-download even when a local file exists")
    parser.add_argument("--dry-run", action="store_true", help="List candidates without downloading")
    parser.add_argument("--limit", type=int, default=None, help="Download at most N unique idx values")
    parser.add_argument("--sleep-ms", type=int, default=150, help="Delay between downloads")
    parser.add_argument("--timeout-s", type=float, default=30.0)
    parser.add_argument(
        "--max-failures",
        type=int,
        default=0,
        help="Exit 1 when failure count exceeds this threshold (0 = any failure fails)",
    )
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    if not seed_path.is_file():
        print(f"missing seed: {seed_path}", file=sys.stderr)
        return 1

    settings = get_settings()
    images_dir = args.images_dir.resolve() if args.images_dir else swagkey_images_dir(settings)
    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))

    report = mirror_seed_images(
        seed_payload,
        images_dir,
        seed_in=str(seed_path).replace("\\", "/"),
        force=args.force,
        dry_run=args.dry_run,
        limit=args.limit,
        sleep_ms=max(0, int(args.sleep_ms)),
        timeout_s=float(args.timeout_s),
    )
    write_json(args.report_json.resolve(), report.to_dict())

    print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    print(f"out={args.report_json.resolve()}")
    print(f"images_dir={images_dir.resolve()}")

    max_failures = int(args.max_failures)
    if report.failed > max_failures:
        print(f"failures={report.failed} exceeds max_failures={max_failures}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
