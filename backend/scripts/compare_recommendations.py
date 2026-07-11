#!/usr/bin/env python3
"""
Compare two frozen snapshots or replay bundles (metrics, signals, narrative).

Usage::

    python scripts/compare_recommendations.py --baseline a.json --treatment b.json
    python scripts/compare_recommendations.py --baseline a.json --treatment b.json --pretty
"""

from __future__ import annotations

import argparse
import json
import sys

from keyboard_recommender.debug_tools.compare import compare_snapshot_files
from keyboard_recommender.debug_tools.stdio import ensure_utf8_stdio


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--baseline", "-b", required=True)
    p.add_argument("--treatment", "-t", required=True)
    p.add_argument("--pretty", action="store_true")
    args = p.parse_args(argv)
    ensure_utf8_stdio()

    out = compare_snapshot_files(args.baseline, args.treatment)
    report = out["benchmarkReport"]
    if args.pretty:
        sys.stdout.write(json.dumps(report, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
    else:
        sys.stdout.write(json.dumps(report, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
