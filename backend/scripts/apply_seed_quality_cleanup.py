#!/usr/bin/env python3
"""Roadmap ⑪ — remove discontinued seed SKUs and apply verified Swagkey product URLs."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from keyboard_recommender.catalog.seed_quality import (
    SEED_REMOVE_IDS,
    apply_seed_quality_cleanup,
    filter_json_rows_by_ids,
)


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    default_seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    data = backend / "data"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=default_seed)
    parser.add_argument("--html-cache", type=Path, default=data / "swagkey_html_cache")
    parser.add_argument("--report-json", type=Path, default=data / "swagkey_inventory" / "seed_quality_cleanup_report.json")
    parser.add_argument("--switch-targets", type=Path, default=data / "swagkey_switch_targets.json")
    parser.add_argument("--switch-specs", type=Path, default=data / "swagkey_switch_specs.json")
    parser.add_argument("--apply", action="store_true", help="Write cleaned seed (and prune switch data files)")
    args = parser.parse_args()

    if not args.seed.is_file():
        print(f"error: seed not found: {args.seed}", file=sys.stderr)
        return 1

    seed_payload = json.loads(args.seed.read_text(encoding="utf-8"))
    cleaned, report = apply_seed_quality_cleanup(
        seed_payload,
        html_cache_dir=args.html_cache if args.html_cache.is_dir() else None,
    )
    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"removed={len(report.removed)} url_overrides={len(report.url_overrides)}")
    print(f"report: {args.report_json.resolve()}")

    if not args.apply:
        print("dry-run only — pass --apply to write seed")
        return 0

    out_path = args.seed.parent / "swagkey_products.seed.cleaned.json"
    out_path.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copy2(out_path, args.seed)
    print(f"applied seed -> {args.seed.resolve()}")

    for aux_path in (args.switch_targets, args.switch_specs):
        if not aux_path.is_file():
            continue
        aux = json.loads(aux_path.read_text(encoding="utf-8"))
        if "switches" in aux:
            before = len(aux["switches"]) if isinstance(aux["switches"], list) else 0
            filter_json_rows_by_ids(aux, "switches", SEED_REMOVE_IDS)
            after = len(aux["switches"]) if isinstance(aux["switches"], list) else 0
            aux_path.write_text(json.dumps(aux, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"pruned {aux_path.name}: {before} -> {after}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
