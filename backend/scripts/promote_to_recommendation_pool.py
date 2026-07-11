#!/usr/bin/env python3
"""Promote spec-ready seed rows to recommendationEligible (Phase 6-2)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.catalog.swagkey_recommendation_promotion import (
    load_seed_payload,
    promote_recommendation_pool,
)
from keyboard_recommender.trait_engine.catalog_sample import recommendation_pool_counts


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    default_report = backend / "data" / "swagkey_inventory" / "recommendation_promotion_report.json"

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument("--report-json", type=Path, default=default_report)
    parser.add_argument("--seed-id", action="append", default=[], help="Promote only these seed ids (repeatable)")
    parser.add_argument("--apply-to-seed", action="store_true", help="Write promotion to seed after review")
    args = parser.parse_args()

    seed_path = args.seed.resolve()
    if not seed_path.is_file():
        print(f"error: seed not found: {seed_path}", file=sys.stderr)
        return 1

    before = recommendation_pool_counts()
    payload = load_seed_payload(seed_path)
    seed_ids = {str(item).strip() for item in args.seed_id if str(item).strip()} or None
    merged, report = promote_recommendation_pool(
        payload,
        seed_ids=seed_ids,
        dry_run=not args.apply_to_seed,
    )
    report.seed_path = str(seed_path).replace("\\", "/")

    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    print(f"wrote report: {args.report_json}")
    print(f"recommend_pool_before={before}")

    if args.apply_to_seed:
        seed_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"applied_to_seed={seed_path}")
        print("note: restart API process to reload catalog_sample module constants")
    elif not report.eligible:
        print("info: no rows currently meet promotion criteria", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
