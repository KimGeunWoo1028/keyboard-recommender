#!/usr/bin/env python3
"""
Replay a saved survey (and optional NLP query) through the recommendation engine.

Usage (from ``backend/`` with package installed)::

    python scripts/replay_recommendation.py fixtures/replay/example_survey.json
    python scripts/replay_recommendation.py scenario.json --natural-language "thocky linear"
    python scripts/replay_recommendation.py scenario.json --out replay.json

JSON input: ``{ "answers": { ... }, "naturalLanguage": "..." }`` or a flat string map of answers.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from keyboard_recommender.debug_tools.io import load_json_document, parse_survey_document
from keyboard_recommender.debug_tools.replay import run_replay_bundle
from keyboard_recommender.debug_tools.stdio import ensure_utf8_stdio


def _dump(obj: object, *, pretty: bool) -> str:
    if pretty:
        return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("survey_path", help="Path to JSON survey (use - for stdin)")
    p.add_argument("--natural-language", "-n", default=None, help="Override / add NLP text (optional)")
    p.add_argument("--out", "-o", default=None, help="Write JSON here (default: stdout)")
    p.add_argument("--pretty", action="store_true", help="Indented JSON")
    p.add_argument(
        "--keep-volatile",
        action="store_true",
        help="Keep completedAtIso in apiPayload (default: strip for reproducible diffs)",
    )
    args = p.parse_args(argv)
    ensure_utf8_stdio()

    raw = load_json_document(args.survey_path)
    if not isinstance(raw, dict):
        print("expected JSON object", file=sys.stderr)
        return 2
    answers, nl_doc = parse_survey_document(raw)
    nl = args.natural_language if args.natural_language is not None else nl_doc

    bundle = run_replay_bundle(answers, natural_language=nl, strip_volatile=not args.keep_volatile)
    text = _dump(bundle, pretty=args.pretty)
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
