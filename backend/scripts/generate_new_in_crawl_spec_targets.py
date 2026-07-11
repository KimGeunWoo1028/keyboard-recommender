#!/usr/bin/env python3
"""Build spec scrape target JSON files for seed diff or Phase 4 browse queue."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from keyboard_recommender.catalog.swagkey_new_in_crawl_targets import (
    generate_new_in_crawl_targets,
    write_spec_target_files,
)
from keyboard_recommender.catalog.swagkey_spec_scrape_queue import (
    build_spec_scrape_queue,
    load_seed_payload,
    write_spec_scrape_queue,
)


def _write_phase4_queue_files(payload: dict[str, Any], out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    written: dict[str, Path] = {}
    queue_path = out_dir / "spec_scrape_queue.json"
    write_spec_scrape_queue(payload, queue_path)
    written["queue"] = queue_path

    by_family: dict[str, list[dict[str, str]]] = {
        "case": [],
        "switch": [],
        "keycap": [],
        "plate": [],
        "foam": [],
    }
    for row in payload.get("targets") or []:
        if not isinstance(row, dict):
            continue
        family = str(row.get("family") or "")
        target = {
            "id": str(row.get("id") or ""),
            "url": str(row.get("url") or ""),
            "name": str(row.get("name") or ""),
            "inventoryId": str(row.get("inventoryId") or ""),
        }
        if family in by_family:
            by_family[family].append(target)

    case_path = out_dir / "spec_scrape_case_targets.json"
    case_path.write_text(
        json.dumps({"cases": by_family["case"]}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written["case"] = case_path

    switch_path = out_dir / "spec_scrape_switch_targets.json"
    switch_path.write_text(
        json.dumps({"switches": by_family["switch"]}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written["switch"] = switch_path

    keycap_path = out_dir / "spec_scrape_keycap_targets.json"
    keycap_path.write_text(
        json.dumps({"keycaps": by_family["keycap"]}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written["keycap"] = keycap_path

    compat_path = out_dir / "spec_scrape_compat_targets.json"
    compat_path.write_text(
        json.dumps(
            {"plates": by_family["plate"], "foams": by_family["foam"]},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    written["compat"] = compat_path
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    default_seed = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    parser.add_argument(
        "--mode",
        choices=("new_in_crawl", "phase4_queue"),
        default="phase4_queue",
        help="phase4_queue: browse stubs for spec enrichment (default)",
    )
    parser.add_argument(
        "--diff",
        type=Path,
        default=default_dir / "seed_inventory_diff.json",
        help="seed_inventory_diff.json (new_in_crawl mode)",
    )
    parser.add_argument(
        "--inventory",
        type=Path,
        default=default_dir / "swagkey_inventory.v4.json",
        help="URL-enriched inventory JSON (new_in_crawl mode)",
    )
    parser.add_argument(
        "--seed",
        type=Path,
        default=default_seed,
        help="Seed JSON (phase4_queue mode)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=default_dir / "spec_scrape_targets",
        help="Directory for target JSON files",
    )
    args = parser.parse_args()

    if args.mode == "phase4_queue":
        seed_path = args.seed.resolve()
        if not seed_path.is_file():
            print(f"error: seed not found: {seed_path}", file=sys.stderr)
            return 1
        payload, report = build_spec_scrape_queue(load_seed_payload(seed_path))
        report.seed_path = str(seed_path).replace("\\", "/")
        payload["stats"] = report.to_dict()
        written = _write_phase4_queue_files(payload, args.out_dir.resolve())
        print(f"wrote targets dir: {args.out_dir.resolve()}")
        for key, path in written.items():
            print(f"  - {key}: {path.name}")
        for line in report.summary_lines:
            print(line)
        if report.queued == 0:
            print("error: empty spec scrape queue", file=sys.stderr)
            return 1
        return 0

    diff_path = args.diff.resolve()
    inventory_path = args.inventory.resolve()
    if not diff_path.is_file():
        print(f"error: diff json not found: {diff_path}", file=sys.stderr)
        print("hint: run scripts/diff_swagkey_seed_inventory.py first", file=sys.stderr)
        return 1
    if not inventory_path.is_file():
        print(f"error: inventory not found: {inventory_path}", file=sys.stderr)
        return 1

    payload, report, _ = generate_new_in_crawl_targets(
        diff_path,
        inventory_path,
        generated_at=datetime.now(UTC),
    )
    written = write_spec_target_files(payload, args.out_dir.resolve())

    print(f"wrote targets dir: {args.out_dir.resolve()}")
    for key, path in written.items():
        print(f"  - {key}: {path.name}")
    for line in report.summary_lines:
        print(line)
    stats = payload.get("stats") if isinstance(payload.get("stats"), dict) else {}
    missing = int(stats.get("missingUrlRows") or 0)
    if missing > 0:
        print(f"warning: {missing} new_in_crawl rows still missing URLs", file=sys.stderr)
    switch_count = int(stats.get("switchTargets") or 0)
    compat_count = int(stats.get("plateTargets") or 0) + int(stats.get("foamTargets") or 0)
    if switch_count + compat_count == 0:
        print("error: no scrape targets with URLs were generated", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
