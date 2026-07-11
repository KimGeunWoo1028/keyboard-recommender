"""Regenerate stable_recommendation.snapshot.json (roadmap ⑫)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result
from tests.recommendation_regression.harness import canonicalize_payload, deterministic_seed
from tests.support.regression import STABLE_SURVEY

SNAPSHOT_PATH = Path(__file__).resolve().parents[1] / "tests/snapshot_testing/snapshots/stable_recommendation.snapshot.json"


def main() -> None:
    with deterministic_seed():
        payload = build_recommendation_result(dict(STABLE_SURVEY))
    actual = canonicalize_payload(payload)
    SNAPSHOT_PATH.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    case_pick = next(x["itemId"] for x in actual["recommendations"] if x["domain"] == "case")
    print(f"wrote {SNAPSHOT_PATH} (case={case_pick})")


if __name__ == "__main__":
    main()
