"""Human- and machine-readable diagnostics built from snapshots + metrics (no re-ranking)."""

from __future__ import annotations

from typing import Any

from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics


def build_diagnostics_report(snapshot: dict[str, Any], metrics: EvaluationMetrics) -> dict[str, Any]:
    """
    Explain *why* numbers look the way they do by pointing at raw snapshot fields.

    Intended for debug logs / future dashboards — not persisted in phase 1.
    """
    lines: list[str] = []
    m = metrics.as_dict()

    if snapshot.get("diversityAudit"):
        lines.append(
            f"diversity: intervention_fraction={m['diversity_intervention']:.3f} "
            f"(fraction of families where rerank changed order).",
        )
    else:
        lines.append("diversity: no diversity audit (disabled or legacy run).")

    if snapshot.get("compatibilityAudit"):
        ca = snapshot["compatibilityAudit"]
        lines.append(
            "compatibility: "
            f"effective_penalty={float(ca['effectivePenaltyTotal']):.4f}, "
            f"stability_metric={m['compatibility_stability']:.3f}.",
        )
    else:
        lines.append("compatibility: no audit present.")

    if snapshot.get("fallbackAudit"):
        fb = snapshot["fallbackAudit"]
        lines.append(
            f"fallback: tier={fb['tier']}, recovered={fb['recovered']}, "
            f"compat_relax_mult={float(fb['compatibilityRelaxMult']):.3f}.",
        )

    if snapshot.get("recommendationConfidence"):
        cf = snapshot["recommendationConfidence"]
        lines.append(
            f"confidence_signal: label={cf['label']}, overall={float(cf['overall']):.3f} "
            f"(evaluation trait_alignment={m['trait_alignment']:.3f}).",
        )

    lines.append(
        "coherence: build_coherence reflects low spread across winners on key axes; "
        f"winner_trait_diversity={m['winner_trait_diversity']:.3f} measures part-to-part contrast.",
    )

    penalty_trace = []
    ca = snapshot.get("compatibilityAudit")
    if isinstance(ca, dict):
        for row in ca.get("lines", []):
            penalty_trace.append(
                {
                    "ruleId": row.get("ruleId"),
                    "effectivePenalty": row.get("effectivePenalty"),
                    "message": row.get("message"),
                },
            )

    rerank_trace = []
    da = snapshot.get("diversityAudit")
    if isinstance(da, dict):
        for fam in da.get("families", []):
            rerank_trace.append(
                {
                    "family": fam.get("family"),
                    "changed": fam.get("originalOrderIds") != fam.get("rerankedOrderIds"),
                    "notes": fam.get("notes", []),
                },
            )

    return {
        "summaryLines": lines,
        "metricValues": m,
        "penaltyTrace": penalty_trace,
        "rerankTrace": rerank_trace,
        "hooks": [
            "diagnostics_hook:explain_tradeoff_high_diversity_low_alignment",
            "diagnostics_hook:penalty_trace_for_compatibility_debug",
        ],
    }
