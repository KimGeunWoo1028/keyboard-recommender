#!/usr/bin/env python3
"""
Inspect a frozen evaluation snapshot or a replay bundle (human summary + optional JSON).

Usage::

    python scripts/inspect_snapshot.py replay.json
    python scripts/inspect_snapshot.py replay.json --json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.debug_tools.io import extract_snapshot_dict, load_json_document
from keyboard_recommender.recommendation_quality.evaluation.benchmarking import (
    fallback_recovery_effectiveness,
    reranking_impact_analysis,
)
from keyboard_recommender.recommendation_quality.evaluation.scoring import compute_metrics_from_snapshot
from keyboard_recommender.recommendation_quality.evaluation.diagnostics import build_diagnostics_report
from keyboard_recommender.debug_tools.stdio import ensure_utf8_stdio


def _print_human(snap: dict, metrics_block: dict, diag: dict) -> None:
    print("--- metrics ---")
    for k in sorted(metrics_block.keys()):
        print(f"  {k}: {metrics_block[k]}")
    print("--- diagnostics ---")
    for ln in diag.get("summaryLines") or []:
        print(f"  {ln}")
    print("--- reranking ---")
    r = reranking_impact_analysis(snap)
    for ln in r.get("summaryLines") or []:
        print(f"  {ln}")
    print("--- fallback ---")
    f = fallback_recovery_effectiveness(snap)
    for ln in f.get("summaryLines") or []:
        print(f"  {ln}")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("path", help="JSON file (snapshot or replay bundle; - for stdin)")
    p.add_argument("--json", action="store_true", help="Emit full metrics+diagnostics JSON")
    args = p.parse_args(argv)
    ensure_utf8_stdio()

    doc = load_json_document(args.path)
    if not isinstance(doc, dict):
        print("expected JSON object", file=sys.stderr)
        return 2
    snap = extract_snapshot_dict(doc)
    metrics = compute_metrics_from_snapshot(snap)
    diag = build_diagnostics_report(snap, metrics)

    if args.json:
        out = {
            "schemaVersion": "debug.inspect.v1",
            "snapshot": snap,
            "metrics": metrics.as_dict(),
            "diagnostics": diag,
            "rerankingImpact": reranking_impact_analysis(snap),
            "fallbackEffectiveness": fallback_recovery_effectiveness(snap),
        }
        sys.stdout.write(json.dumps(out, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
    else:
        _print_human(snap, metrics.as_dict(), diag)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
