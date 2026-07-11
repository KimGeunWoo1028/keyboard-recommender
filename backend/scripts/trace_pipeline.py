#!/usr/bin/env python3
"""
Emit pipeline trace for a survey scenario (why compatibility / rerank / fallback / final picks).

Usage::

    python scripts/trace_pipeline.py fixtures/replay/example_survey.json
    python scripts/trace_pipeline.py scenario.json --natural-language "quiet office" --json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.debug_tools.io import load_json_document, parse_survey_document
from keyboard_recommender.debug_tools.replay import run_replay_bundle
from keyboard_recommender.debug_tools.stdio import ensure_utf8_stdio


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("survey_path")
    p.add_argument("--natural-language", "-n", default=None)
    p.add_argument("--json", action="store_true", help="Full structured trace JSON")
    p.add_argument("--out", "-o", default=None)
    p.add_argument("--pretty", action="store_true")
    args = p.parse_args(argv)
    ensure_utf8_stdio()

    raw = load_json_document(args.survey_path)
    if not isinstance(raw, dict):
        print("expected JSON object", file=sys.stderr)
        return 2
    answers, nl_doc = parse_survey_document(raw)
    nl = args.natural_language if args.natural_language is not None else nl_doc

    bundle = run_replay_bundle(answers, natural_language=nl, strip_volatile=True)
    trace = bundle["pipelineTrace"]

    if args.json:
        if args.pretty:
            text = json.dumps(trace, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
        else:
            text = json.dumps(trace, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n"
    else:
        lines = trace.get("flatSummaryLines") or []
        text = "\n".join(str(x) for x in lines) + "\n"

    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
