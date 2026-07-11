"""Thin wrappers around :mod:`trend_analysis` for drift windows (deterministic)."""

from __future__ import annotations

from collections.abc import Sequence

from keyboard_recommender.recommendation_quality.evaluation.trend_analysis import (
    analyze_series,
    two_window_trend_label,
)


def window_trend(values: Sequence[float]) -> str:
    return two_window_trend_label(values)


def summarize_series(values: Sequence[float], *, name: str) -> dict[str, object]:
    return analyze_series(values, name=name)
