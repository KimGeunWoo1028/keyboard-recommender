"""Simple, interpretable trends over ordered metric samples (no time-series DB)."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Any


def coefficient_of_variation(values: Sequence[float], *, eps: float = 1e-9) -> float:
    if not values:
        return 0.0
    xs = [float(x) for x in values]
    mean = sum(xs) / len(xs)
    if abs(mean) < eps:
        return 0.0
    var = sum((x - mean) ** 2 for x in xs) / len(xs)
    return round(math.sqrt(var) / mean, 6)


def first_last_delta(values: Sequence[float]) -> float:
    if len(values) < 2:
        return 0.0
    return round(float(values[-1]) - float(values[0]), 6)


def two_window_trend_label(
    values: Sequence[float],
    *,
    threshold: float = 1e-4,
) -> str:
    """
    Compare mean of first half vs second half of the series.

    Returns `up`, `down`, `flat`, or `insufficient_data`.
    """
    xs = [float(x) for x in values]
    n = len(xs)
    if n < 2:
        return "insufficient_data"
    mid = n // 2
    first = xs[:mid] if mid else xs[:1]
    second = xs[mid:] if mid else xs[1:]
    a = sum(first) / len(first)
    b = sum(second) / len(second)
    diff = b - a
    if diff > threshold:
        return "up"
    if diff < -threshold:
        return "down"
    return "flat"


def analyze_series(values: Sequence[float], *, name: str) -> dict[str, Any]:
    """Single-series summary for dashboards / JSON dumps."""
    xs = [float(x) for x in values]
    return {
        "name": name,
        "count": len(xs),
        "firstLastDelta": first_last_delta(xs),
        "twoWindowTrend": two_window_trend_label(xs),
        "coefficientOfVariation": coefficient_of_variation(xs),
    }


def analyze_metric_trends_from_records(
    records: Sequence[Mapping[str, Any]],
    *,
    metric_key: str,
) -> dict[str, Any]:
    """
    Pull `metric_key` from each record's `metrics` map, in list order.

    Record shape matches `aggregation.append_jsonl` rows.
    """
    series: list[float] = []
    for rec in records:
        m = rec.get("metrics")
        if isinstance(m, dict) and metric_key in m:
            try:
                series.append(float(m[metric_key]))
            except (TypeError, ValueError):
                continue
    base = analyze_series(series, name=metric_key)
    base["schemaVersion"] = "evaluation.trend_metric.v1"
    return base


def diversity_confidence_trend_bundle(records: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """Convenience rollup for diversity + confidence trends from the same run log."""
    div = analyze_metric_trends_from_records(records, metric_key="winner_trait_diversity")
    conf_series: list[float] = []
    for rec in records:
        snap = rec.get("snapshot")
        if isinstance(snap, dict):
            cf = snap.get("recommendationConfidence")
            if isinstance(cf, dict) and "overall" in cf:
                try:
                    conf_series.append(float(cf["overall"]))
                except (TypeError, ValueError):
                    pass
    conf = analyze_series(conf_series, name="confidence_overall")
    return {
        "schemaVersion": "evaluation.trend_bundle.v1",
        "winnerTraitDiversity": {k: v for k, v in div.items() if k != "name"},
        "recommendationConfidenceOverall": {k: v for k, v in conf.items() if k != "name"},
    }


def human_trend_lines(bundle: Mapping[str, Any]) -> list[str]:
    """Readable lines from `diversity_confidence_trend_bundle` or per-metric `analyze_series`."""
    lines: list[str] = []
    w = bundle.get("winnerTraitDiversity") if isinstance(bundle, dict) else None
    if isinstance(w, dict):
        t = w.get("twoWindowTrend")
        d = w.get("firstLastDelta")
        if t and t != "insufficient_data":
            lines.append(
                f"Winner trait diversity trend is {t} (first-to-last delta ≈ {d}).",
            )
    c = bundle.get("recommendationConfidenceOverall") if isinstance(bundle, dict) else None
    if isinstance(c, dict):
        t = c.get("twoWindowTrend")
        d = c.get("firstLastDelta")
        if t and t != "insufficient_data":
            lines.append(
                f"Recommendation confidence trend is {t} (first-to-last delta ≈ {d}).",
            )
    return lines
