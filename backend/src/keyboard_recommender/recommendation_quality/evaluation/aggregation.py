"""Rollups, distributions, and JSON/JSONL-friendly aggregation (no database)."""

from __future__ import annotations

import json
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class DistributionStats:
    """Descriptive stats for one metric over many runs (deterministic rounding)."""

    count: int
    mean: float
    min: float
    max: float
    p50: float
    std: float

    def as_dict(self) -> dict[str, float | int]:
        return {
            "count": int(self.count),
            "mean": float(self.mean),
            "min": float(self.min),
            "max": float(self.max),
            "p50": float(self.p50),
            "std": float(self.std),
        }


def _percentile_sorted(sorted_vals: Sequence[float], q: float) -> float:
    """q in [0,1]; linear interpolation between closest ranks."""
    if not sorted_vals:
        return 0.0
    n = len(sorted_vals)
    if n == 1:
        return float(sorted_vals[0])
    pos = (n - 1) * q
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return float(sorted_vals[lo])
    w = pos - lo
    return float(sorted_vals[lo] * (1.0 - w) + sorted_vals[hi] * w)


def distribution_of(values: Sequence[float]) -> DistributionStats:
    if not values:
        return DistributionStats(0, 0.0, 0.0, 0.0, 0.0, 0.0)
    xs = sorted(float(x) for x in values)
    n = len(xs)
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / max(1, n)
    std = math.sqrt(var)
    p50 = _percentile_sorted(xs, 0.5)
    return DistributionStats(
        count=n,
        mean=round(mean, 6),
        min=round(xs[0], 6),
        max=round(xs[-1], 6),
        p50=round(p50, 6),
        std=round(std, 6),
    )


def rolling_means(values: Sequence[float], window: int) -> list[float]:
    """Trailing mean for each index (inclusive window ending at i). `window` ≥ 1."""
    if window < 1:
        raise ValueError("window must be >= 1")
    out: list[float] = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        chunk = [float(values[j]) for j in range(start, i + 1)]
        out.append(round(sum(chunk) / len(chunk), 6))
    return out


def aggregate_metric_maps(
    records: Sequence[Mapping[str, float]],
    *,
    metric_keys: Sequence[str] | None = None,
) -> dict[str, DistributionStats]:
    """One distribution per metric key present across records."""
    if not records:
        return {}
    if metric_keys is None:
        keys: set[str] = set()
        for r in records:
            keys.update(r.keys())
        metric_keys = sorted(keys)
    out: dict[str, DistributionStats] = {}
    for k in metric_keys:
        vals = [float(r[k]) for r in records if k in r]
        if vals:
            out[k] = distribution_of(vals)
    return out


def recommendation_stability_std(
    trait_alignment_series: Sequence[float],
) -> float:
    """Lower std → more stable trait_alignment across runs (same scenario)."""
    d = distribution_of([float(x) for x in trait_alignment_series])
    return float(d.std)


def build_aggregate_summary(
    records: Sequence[Mapping[str, Any]],
    *,
    scenario_id: str | None = None,
    label: str | None = None,
) -> dict[str, Any]:
    """
    JSON-serializable rollup for many evaluation rows.

    Each record should include `metrics` (mapping) and optional `recordedAt`, `runId`.
    """
    metrics_only: list[dict[str, float]] = []
    alignments: list[float] = []
    diversities: list[float] = []
    confidences: list[float] = []
    for rec in records:
        m = rec.get("metrics")
        if not isinstance(m, dict):
            continue
        md = {k: float(v) for k, v in m.items() if isinstance(v, (int, float))}
        metrics_only.append(md)
        if "trait_alignment" in md:
            alignments.append(md["trait_alignment"])
        if "winner_trait_diversity" in md:
            diversities.append(md["winner_trait_diversity"])
        snap = rec.get("snapshot")
        if isinstance(snap, dict):
            cf = snap.get("recommendationConfidence")
            if isinstance(cf, dict) and "overall" in cf:
                try:
                    confidences.append(float(cf["overall"]))
                except (TypeError, ValueError):
                    pass

    dists = {k: v.as_dict() for k, v in aggregate_metric_maps(metrics_only).items()}
    out: dict[str, Any] = {
        "schemaVersion": "evaluation.aggregate_summary.v1",
        "recordCount": len(records),
        "metricsParsed": len(metrics_only),
        "distributions": dists,
        "stability": {
            "traitAlignmentStd": round(recommendation_stability_std(alignments), 6) if alignments else 0.0,
        },
        "trendInputs": {
            "winnerTraitDiversitySeries": [round(x, 6) for x in diversities],
            "confidenceOverallSeries": [round(x, 6) for x in confidences],
        },
    }
    if scenario_id is not None:
        out["scenarioId"] = scenario_id
    if label is not None:
        out["label"] = label
    return out


def append_jsonl(path: Path | str, record: Mapping[str, Any]) -> None:
    """Append one JSON object per line (append-only local log)."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(dict(record), sort_keys=True, ensure_ascii=False) + "\n")


def read_jsonl(path: Path | str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    p = Path(path)
    if not p.is_file():
        return rows
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def write_metrics_json(path: Path | str, payload: Mapping[str, Any]) -> None:
    """Overwrite a single JSON file (e.g. latest aggregate snapshot for a dev bench)."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump(dict(payload), f, indent=2, sort_keys=True, ensure_ascii=False)
