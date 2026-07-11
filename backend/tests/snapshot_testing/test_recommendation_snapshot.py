from __future__ import annotations

import json
from pathlib import Path

from tests.recommendation_regression.harness import canonical_json, canonicalize_payload, deterministic_seed
from tests.support.regression import STABLE_SURVEY

from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result


SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "stable_recommendation.snapshot.json"


def test_stable_recommendation_matches_snapshot() -> None:
    expected = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    with deterministic_seed():
        payload = build_recommendation_result(dict(STABLE_SURVEY))
    actual = canonicalize_payload(payload)
    assert canonical_json(actual) == canonical_json(expected)
