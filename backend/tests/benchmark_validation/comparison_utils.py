"""Utilities to compare benchmark metric snapshots over time."""

from __future__ import annotations

from collections.abc import Mapping


def metric_delta(before: Mapping[str, float], after: Mapping[str, float], key: str) -> float:
    return float(after.get(key, 0.0)) - float(before.get(key, 0.0))


def assert_metric_not_worse_than(
    before: Mapping[str, float],
    after: Mapping[str, float],
    key: str,
    *,
    max_regression: float,
) -> None:
    delta = metric_delta(before, after, key)
    if delta < -abs(max_regression):
        msg = (
            f"metric regression for {key}: delta={delta:.6f} "
            f"(allowed >= {-abs(max_regression):.6f})"
        )
        raise AssertionError(msg)


def assert_metric_change_bounded(
    before: Mapping[str, float],
    after: Mapping[str, float],
    key: str,
    *,
    max_absolute_change: float,
) -> None:
    delta = abs(metric_delta(before, after, key))
    if delta > abs(max_absolute_change):
        msg = (
            f"metric drift for {key}: |delta|={delta:.6f} "
            f"(allowed <= {abs(max_absolute_change):.6f})"
        )
        raise AssertionError(msg)
