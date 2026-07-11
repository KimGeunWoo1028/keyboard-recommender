"""Deterministic harness for recommendation regression and snapshot tests."""

from __future__ import annotations

import json
import random
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any

from tests.support.regression import STABLE_SURVEY, strip_volatile_recommendation_fields

DEFAULT_SEED = 20260505


@contextmanager
def deterministic_seed(seed: int = DEFAULT_SEED) -> Iterator[None]:
    """Stabilize Python RNG state for deterministic test execution."""
    state = random.getstate()
    random.seed(seed)
    try:
        yield
    finally:
        random.setstate(state)


def canonicalize_payload(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Drop known volatile keys and return a JSON-friendly dict."""
    return strip_volatile_recommendation_fields(payload)


def canonical_json(payload: Mapping[str, Any]) -> str:
    """Deterministic JSON string for exact comparisons."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


@dataclass(frozen=True, slots=True)
class RegressionCase:
    name: str
    answers: dict[str, str]


@dataclass(frozen=True, slots=True)
class ProfileExpectation:
    """Golden bounds for a fixed survey profile (update intentionally when the model changes)."""

    expected_winner_switch_id: str
    allowed_top5_switch_ids: frozenset[str]
    overall_confidence: tuple[float, float]
    recommendation_confidence_overall: tuple[float, float]
    max_effective_penalty_total: float
    min_diversity_families: int


# Canonical product profiles for regression documentation + CI.
PROFILE_QUIET_OFFICE: dict[str, str] = dict(STABLE_SURVEY)
PROFILE_DEEP_THOCK: dict[str, str] = {
    "sound_profile": "thocky",
    "typing_pressure": "heavy",
    "switch_feel": "linear",
    "bottom_out": "firm",
    "volume": "moderate",
}
PROFILE_GAMING_LINEAR: dict[str, str] = {
    "sound_profile": "bright",
    "typing_pressure": "medium",
    "switch_feel": "linear",
    "bottom_out": "firm",
    "volume": "loud",
}


REGRESSION_CASES: tuple[RegressionCase, ...] = (
    RegressionCase(name="quiet_office", answers=PROFILE_QUIET_OFFICE),
    RegressionCase(name="deep_thock", answers=PROFILE_DEEP_THOCK),
    RegressionCase(name="gaming_linear", answers=PROFILE_GAMING_LINEAR),
    RegressionCase(
        name="loud_tactile",
        answers={
            "sound_profile": "bright",
            "typing_pressure": "heavy",
            "switch_feel": "tactile_clear",
            "bottom_out": "firm",
            "volume": "loud",
        },
    ),
    RegressionCase(
        name="balanced_linear",
        answers={
            "sound_profile": "balanced",
            "typing_pressure": "medium",
            "switch_feel": "linear",
            "bottom_out": "medium",
            "volume": "medium",
        },
    ),
)

# Tuned to DEFAULT_SEED + current catalog (May 2026). Widen bands slightly to reduce brittle CI.
PROFILE_EXPECTATIONS: dict[str, ProfileExpectation] = {
    "quiet_office": ProfileExpectation(
        expected_winner_switch_id="sw-linear-003",
        allowed_top5_switch_ids=frozenset(
            {
                "sw-linear-003",
                "plate-004",
                "foam-005",
                "layout-004",
                "layout-new-001-gdk-lab-dk1-tkl-기판",
            },
        ),
        overall_confidence=(0.72, 0.81),
        recommendation_confidence_overall=(0.77, 0.83),
        max_effective_penalty_total=0.05,
        min_diversity_families=6,
    ),
    "deep_thock": ProfileExpectation(
        expected_winner_switch_id="sw-linear-001",
        allowed_top5_switch_ids=frozenset(
            {
                "sw-linear-001",
                "plate-003",
                "foam-004",
                "layout-004",
            },
        ),
        overall_confidence=(0.76, 0.84),
        recommendation_confidence_overall=(0.79, 0.84),
        max_effective_penalty_total=0.05,
        min_diversity_families=6,
    ),
    "gaming_linear": ProfileExpectation(
        expected_winner_switch_id="sw-linear-006",
        allowed_top5_switch_ids=frozenset(
            {
                "sw-linear-006",
                "plate-003",
                "foam-003",
                "layout-001",
            },
        ),
        overall_confidence=(0.74, 0.81),
        recommendation_confidence_overall=(0.78, 0.83),
        max_effective_penalty_total=0.05,
        min_diversity_families=6,
    ),
}
