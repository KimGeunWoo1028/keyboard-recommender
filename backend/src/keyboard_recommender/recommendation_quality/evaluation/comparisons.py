"""Pairwise and historical comparisons between evaluation metrics and raw signals (no re-ranking)."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics

_METRIC_KEYS = tuple(EvaluationMetrics.__dataclass_fields__.keys())


def _as_metric_map(m: EvaluationMetrics | Mapping[str, float]) -> dict[str, float]:
    if isinstance(m, EvaluationMetrics):
        return m.as_dict()
    return {k: float(m[k]) for k in _METRIC_KEYS if k in m}


def relative_delta(baseline: float, current: float, *, eps: float = 1e-9) -> float:
    """Signed fractional change: (current − baseline) / max(|baseline|, eps)."""
    denom = max(abs(float(baseline)), eps)
    return (float(current) - float(baseline)) / denom


def pct_change(baseline: float, current: float, *, eps: float = 1e-9) -> float:
    """Percent change vs baseline magnitude: `100 * relative_delta`."""
    return 100.0 * relative_delta(baseline, current, eps=eps)


def compare_metrics(
    baseline: EvaluationMetrics | Mapping[str, float],
    current: EvaluationMetrics | Mapping[str, float],
    *,
    eps: float = 1e-9,
) -> dict[str, Any]:
    """
    Per-metric absolute delta, relative delta, and percent change.

    Interpretation is left to callers (e.g. higher trait_alignment is “better”).
    """
    b = _as_metric_map(baseline)
    c = _as_metric_map(current)
    per: dict[str, Any] = {}
    for k in _METRIC_KEYS:
        bv, cv = b.get(k, 0.0), c.get(k, 0.0)
        per[k] = {
            "baseline": bv,
            "current": cv,
            "absoluteDelta": round(cv - bv, 6),
            "relativeDelta": round(relative_delta(bv, cv, eps=eps), 6),
            "percentChange": round(pct_change(bv, cv, eps=eps), 4),
        }
    return {
        "schemaVersion": "evaluation.compare_metrics.v1",
        "perMetric": per,
    }


def _float_signal(snapshot: Mapping[str, Any], path: tuple[str, ...], default: float = 0.0) -> float:
    cur: Any = dict(snapshot)
    for p in path:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(p)
    try:
        return float(cur) if cur is not None else default
    except (TypeError, ValueError):
        return default


def compare_snapshots_signals(
    baseline: Mapping[str, Any],
    current: Mapping[str, Any],
    *,
    eps: float = 1e-9,
) -> dict[str, Any]:
    """Compare raw signals used in benchmarks (confidence, penalties, fallback)."""
    specs = {
        "confidenceOverall": ("recommendationConfidence", "overall"),
        "effectiveCompatibilityPenalty": ("compatibilityAudit", "effectivePenaltyTotal"),
        "confidenceBeforeFallback": ("fallbackAudit", "confidenceBefore"),
        "confidenceAfterFallback": ("fallbackAudit", "confidenceAfter"),
    }
    out: dict[str, Any] = {}
    for name, path in specs.items():
        bv = _float_signal(baseline, path)
        cv = _float_signal(current, path)
        out[name] = {
            "baseline": bv,
            "current": cv,
            "absoluteDelta": round(cv - bv, 6),
            "relativeDelta": round(relative_delta(bv, cv, eps=eps), 6),
            "percentChange": round(pct_change(bv, cv, eps=eps), 4),
        }
    bfb = baseline.get("fallbackAudit") if isinstance(baseline.get("fallbackAudit"), dict) else None
    cfb = current.get("fallbackAudit") if isinstance(current.get("fallbackAudit"), dict) else None
    out["fallbackRecovered"] = {
        "baseline": bool(bfb.get("recovered")) if bfb else False,
        "current": bool(cfb.get("recovered")) if cfb else False,
    }
    return {"schemaVersion": "evaluation.compare_snapshots_signals.v1", "signals": out}


def compare_aggregate_summaries(
    baseline: Mapping[str, Any],
    current: Mapping[str, Any],
    *,
    eps: float = 1e-9,
) -> dict[str, Any]:
    """
    Compare two `build_aggregate_summary` blobs (mean/min/max per metric).

    Expects shapes produced by `aggregation.build_aggregate_summary`.
    """
    bd = baseline.get("distributions") or {}
    cd = current.get("distributions") or {}
    if not isinstance(bd, dict) or not isinstance(cd, dict):
        return {
            "schemaVersion": "evaluation.compare_aggregate_summaries.v1",
            "error": "missing_distributions",
            "perMetric": {},
        }
    keys = sorted(set(bd.keys()) & set(cd.keys()))
    per: dict[str, Any] = {}
    for k in keys:
        bm = bd[k].get("mean") if isinstance(bd[k], dict) else None
        cm = cd[k].get("mean") if isinstance(cd[k], dict) else None
        if bm is None or cm is None:
            continue
        bv, cv = float(bm), float(cm)
        per[k] = {
            "baselineMean": bv,
            "currentMean": cv,
            "absoluteDelta": round(cv - bv, 6),
            "relativeDelta": round(relative_delta(bv, cv, eps=eps), 6),
            "percentChange": round(pct_change(bv, cv, eps=eps), 4),
        }
    return {"schemaVersion": "evaluation.compare_aggregate_summaries.v1", "perMetric": per}


def human_metric_comparison_lines(
    comparison: Mapping[str, Any],
    *,
    higher_is_better: Sequence[str] = (
        "trait_alignment",
        "build_coherence",
        "compatibility_stability",
        "winner_trait_diversity",
    ),
) -> list[str]:
    """Short benchmark-oriented sentences from `compare_metrics` output."""
    per = comparison.get("perMetric")
    if not isinstance(per, dict):
        return []
    lines: list[str] = []
    better_set = frozenset(higher_is_better)
    for name, row in sorted(per.items()):
        if not isinstance(row, dict):
            continue
        pct = row.get("percentChange")
        ab = row.get("absoluteDelta")
        if pct is None or ab is None:
            continue
        direction = "increased" if float(ab) > 0 else "decreased" if float(ab) < 0 else "unchanged"
        qual = ""
        if float(ab) != 0.0 and name in better_set:
            qual = " (improvement)" if float(ab) > 0 else " (regression)"
        lines.append(
            f"{name}: {direction} by about {abs(float(pct)):.1f}% vs baseline{qual}.",
        )
    return lines


def human_signal_comparison_lines(signal_comparison: Mapping[str, Any]) -> list[str]:
    """Narrate confidence / penalty deltas from `compare_snapshots_signals`."""
    sig = signal_comparison.get("signals")
    if not isinstance(sig, dict):
        return []
    lines: list[str] = []
    co = sig.get("confidenceOverall")
    if isinstance(co, dict) and co.get("percentChange") is not None:
        p = float(co["percentChange"])
        if p != 0.0:
            lines.append(
                f"Recommendation confidence overall moved by about {abs(p):.1f}% "
                f"({'up' if p > 0 else 'down'}) vs baseline.",
            )
    pen = sig.get("effectiveCompatibilityPenalty")
    if isinstance(pen, dict) and pen.get("absoluteDelta") is not None:
        d = float(pen["absoluteDelta"])
        if d != 0.0:
            lines.append(
                "Compatibility penalties "
                f"{'increased' if d > 0 else 'reduced'} effective pressure on the build "
                f"(Δ≈{d:+.4f}).",
            )
    fb = sig.get("fallbackRecovered")
    if isinstance(fb, dict) and fb.get("current") and not fb.get("baseline"):
        lines.append("Fallback recovery reduced low-confidence outputs in the treatment run.")
    return lines
