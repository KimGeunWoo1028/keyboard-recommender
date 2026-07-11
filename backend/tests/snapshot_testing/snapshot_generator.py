"""Snapshot generator utilities for deterministic recommendation payloads."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result
from tests.recommendation_regression.harness import canonicalize_payload, deterministic_seed
from tests.support.regression import STABLE_SURVEY


def generate_stable_recommendation_snapshot(snapshot_path: Path) -> dict[str, Any]:
    with deterministic_seed():
        payload = build_recommendation_result(dict(STABLE_SURVEY))
    normalized = canonicalize_payload(payload)
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_path.write_text(json.dumps(normalized, sort_keys=True, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return normalized
