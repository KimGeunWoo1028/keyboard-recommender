#!/usr/bin/env python3
"""Audit recommendation pool sizes vs browse seed (Phase 6 dev gate)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.trait_engine.catalog_sample import load_browse_seed_parts, recommendation_pool_counts

_PHASE6_RECOMMEND_MAX = {
    "switch": 70,
    "plate": 20,
    "foam": 12,
    "layout": 7,
    "case": 55,
    "keycap": 22,
}


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    default_out = backend / "data" / "swagkey_inventory" / "recommendation_pool_report.json"

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-json", type=Path, default=default_out)
    args = parser.parse_args()

    recommend = recommendation_pool_counts()
    browse = {family: len(parts) for family, parts in load_browse_seed_parts().items()}
    lines = ["recommendation pool vs browse seed:"]
    gate_passed = True
    families = {}
    for family in ("switch", "plate", "foam", "layout", "case", "keycap"):
        rec = recommend.get(family, 0)
        br = browse.get(family, 0)
        ceiling = _PHASE6_RECOMMEND_MAX.get(family, br)
        ok = rec <= ceiling
        gate_passed = gate_passed and ok
        families[family] = {
            "recommend": rec,
            "browse": br,
            "ceiling": ceiling,
            "gatePassed": ok,
        }
        lines.append(f"  {family}: recommend={rec} browse={br} ceiling={ceiling} ok={ok}")

    payload = {
        "schemaVersion": "1.0.0",
        "gatePassed": gate_passed,
        "families": families,
        "summaryLines": lines + [f"gate passed: {gate_passed}"],
    }
    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"wrote json: {args.report_json}")
    return 0 if gate_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
