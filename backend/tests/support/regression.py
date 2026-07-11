"""
Lightweight regression helpers (no large golden files).

Prefer **structural** checks + **canonical JSON** equality for deterministic engine paths.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

# Fixed survey used across contract / regression tests (do not mutate).
STABLE_SURVEY: dict[str, str] = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}

# Minimum top-level keys the public API must keep stable.
# Excluded from byte-stable equality checks (timestamp noise).
VOLATILE_RECOMMENDATION_KEYS: frozenset[str] = frozenset({"completedAtIso"})

RECOMMENDATION_API_TOP_LEVEL_KEYS: frozenset[str] = frozenset(
    {
        "answers",
        "legacyTraits",
        "userVector",
        "userTraitScores",
        "traitAxes",
        "recommendations",
        "matchExplanations",
        "overallConfidence",
        "build",
        "completedAtIso",
        "nlPreferenceAnalysis",
        "compatibilityAudit",
        "diversityAudit",
        "fallbackAudit",
        "recommendationConfidence",
    },
)


def canonical_json_dumps(obj: Any) -> str:
    """Deterministic JSON for equality (sorted keys, compact separators)."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def strip_volatile_recommendation_fields(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Drop keys that are expected to differ between runs with identical inputs."""
    return {k: v for k, v in dict(payload).items() if k not in VOLATILE_RECOMMENDATION_KEYS}


def assert_recommendation_api_shape(payload: Mapping[str, Any]) -> None:
    missing = sorted(RECOMMENDATION_API_TOP_LEVEL_KEYS - frozenset(payload.keys()))
    if missing:
        msg = f"recommendation API missing keys: {missing}"
        raise AssertionError(msg)


def assert_recommendations_match_explanations(payload: Mapping[str, Any]) -> None:
    if payload.get("recommendations") != payload.get("matchExplanations"):
        raise AssertionError("recommendations and matchExplanations must stay aligned")
