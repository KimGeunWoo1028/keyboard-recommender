"""Pure drift helpers (no DB)."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.evaluation.drift.drift_metrics import fallback_recovery_rate, max_share
from keyboard_recommender.recommendation_quality.evaluation.drift.family_distribution import (
    family_counts_from_snapshot_rows,
    switch_family_from_snapshot,
)


def test_switch_family_from_snapshot() -> None:
    snap = {"selected": {"switch": {"family": "linear", "itemId": "sw-1"}}}
    assert switch_family_from_snapshot(snap) == "linear"


def test_family_counts() -> None:
    rows = [
        {"snapshot": {"selected": {"switch": {"family": "linear"}}}},
        {"snapshot": {"selected": {"switch": {"family": "linear"}}}},
        {"snapshot": {"selected": {"switch": {"family": "tactile"}}}},
    ]
    c = family_counts_from_snapshot_rows(rows)
    assert c["linear"] == 2
    assert c["tactile"] == 1


def test_max_share() -> None:
    k, s = max_share({"a": 7, "b": 3})
    assert k == "a"
    assert abs(s - 0.7) < 1e-6


def test_fallback_recovery_rate() -> None:
    rows = [
        {"snapshot": {"fallbackAudit": {"recovered": True}}},
        {"snapshot": {"fallbackAudit": {"recovered": False}}},
        {"snapshot": {}},
    ]
    r = fallback_recovery_rate(rows)
    assert r["runsWithFallbackAudit"] == 2
    assert r["recoveredCount"] == 1
