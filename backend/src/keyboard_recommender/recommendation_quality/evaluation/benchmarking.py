"""Paired runs, reranking impact, and narrative benchmark reports (builds on Phase 1)."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from keyboard_recommender.recommendation_quality.evaluation.comparisons import (
    compare_metrics,
    compare_snapshots_signals,
    human_metric_comparison_lines,
    human_signal_comparison_lines,
)
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationConfig, EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.scoring import compute_metrics_from_snapshot, evaluate_recommendation
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult


def _spearman_footrule(original_ids: Sequence[str], reranked_ids: Sequence[str]) -> int:
    """Sum of absolute rank moves for items present in both lists (same multiset)."""
    if len(original_ids) != len(reranked_ids):
        return -1
    im_o = {str(x): i for i, x in enumerate(original_ids)}
    im_r = {str(x): i for i, x in enumerate(reranked_ids)}
    total = 0
    for x, i in im_o.items():
        if x not in im_r:
            return -1
        total += abs(i - im_r[x])
    return total


def reranking_impact_analysis(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    """
    Inspect diversity audit: which families moved and how far (footrule).

    Does not re-run the engine; consumes snapshot only.
    """
    da = snapshot.get("diversityAudit")
    if not isinstance(da, dict):
        return {
            "schemaVersion": "evaluation.reranking_impact.v1",
            "familiesAnalyzed": 0,
            "familiesChanged": 0,
            "meanFootrulePerChangedFamily": 0.0,
            "perFamily": [],
            "summaryLines": ["diversity: no diversity audit on this snapshot."],
        }
    families = da.get("families")
    if not isinstance(families, list):
        families = []
    per: list[dict[str, Any]] = []
    changed = 0
    footrules: list[int] = []
    summary_lines: list[str] = []
    for fam in families:
        if not isinstance(fam, dict):
            continue
        o = fam.get("originalOrderIds") or []
        r = fam.get("rerankedOrderIds") or []
        if not isinstance(o, list) or not isinstance(r, list):
            continue
        o_ids = [str(x) for x in o]
        r_ids = [str(x) for x in r]
        is_changed = o_ids != r_ids
        if is_changed:
            changed += 1
        fr = _spearman_footrule(o_ids, r_ids)
        if is_changed and fr >= 0:
            footrules.append(fr)
        fname = fam.get("family", "?")
        per.append(
            {
                "family": fname,
                "changed": is_changed,
                "footrule": fr,
                "originalOrderIds": o_ids,
                "rerankedOrderIds": r_ids,
            },
        )
    mean_fr = sum(footrules) / len(footrules) if footrules else 0.0
    n = len(per)
    frac = round(changed / max(1, n), 6)
    summary_lines.append(
        f"diversity reranking: {changed}/{max(1, n)} families had order changes (fraction={frac:.3f}).",
    )
    if footrules:
        summary_lines.append(
            f"Among changed lists, mean Spearman footrule displacement is {mean_fr:.2f} "
            "(higher → more reordering).",
        )
    if frac > 0 and n:
        approx_pct = 100.0 * frac
        summary_lines.append(
            f"Interpretation: diversity stage altered ranking behavior on about {approx_pct:.0f}% of families.",
        )
    return {
        "schemaVersion": "evaluation.reranking_impact.v1",
        "familiesAnalyzed": n,
        "familiesChanged": changed,
        "fractionFamiliesChanged": frac,
        "meanFootrulePerChangedFamily": round(mean_fr, 6),
        "perFamily": per,
        "summaryLines": summary_lines,
    }


def compatibility_penalty_impact(
    baseline_snapshot: Mapping[str, Any],
    treatment_snapshot: Mapping[str, Any],
) -> dict[str, Any]:
    """Effective penalty delta + short narrative."""
    def eff(s: Mapping[str, Any]) -> float:
        ca = s.get("compatibilityAudit")
        if not isinstance(ca, dict):
            return 0.0
        try:
            return float(ca.get("effectivePenaltyTotal", 0.0))
        except (TypeError, ValueError):
            return 0.0

    b, t = eff(baseline_snapshot), eff(treatment_snapshot)
    delta = round(t - b, 6)
    lines: list[str] = []
    if delta < 0:
        lines.append("Compatibility penalties reduced harsh build combinations in the treatment run.")
    elif delta > 0:
        lines.append("Compatibility penalties increased vs baseline (treatment accepts more tension).")
    else:
        lines.append("Effective compatibility penalty unchanged between baseline and treatment.")
    return {
        "schemaVersion": "evaluation.compat_penalty_impact.v1",
        "baselineEffectivePenalty": b,
        "treatmentEffectivePenalty": t,
        "absoluteDelta": delta,
        "summaryLines": lines,
    }


def fallback_recovery_effectiveness(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    """Summarize fallback audit if present (confidence lift, recovered flag)."""
    fb = snapshot.get("fallbackAudit")
    if not isinstance(fb, dict):
        return {
            "schemaVersion": "evaluation.fallback_effectiveness.v1",
            "present": False,
            "summaryLines": ["fallback: no fallback audit (no recovery path triggered)."],
        }
    before = float(fb.get("confidenceBefore", 0.0))
    after = float(fb.get("confidenceAfter", 0.0))
    lift = round(after - before, 6)
    lines: list[str] = []
    if fb.get("recovered"):
        lines.append("Fallback recovery engaged and marked the run as recovered.")
    if lift > 1e-6:
        lines.append(f"Fallback recovery increased recommendation confidence (Δ≈{lift:+.4f}).")
    elif lift < -1e-6:
        lines.append(f"Confidence fell after fallback adjustments (Δ≈{lift:+.4f}).")
    else:
        lines.append("Fallback audit present with negligible confidence delta.")
    return {
        "schemaVersion": "evaluation.fallback_effectiveness.v1",
        "present": True,
        "recovered": bool(fb.get("recovered")),
        "tier": fb.get("tier"),
        "confidenceBefore": before,
        "confidenceAfter": after,
        "confidenceLift": lift,
        "summaryLines": lines,
    }


def build_coherence_delta_line(
    baseline_metrics: EvaluationMetrics | Mapping[str, float],
    treatment_metrics: EvaluationMetrics | Mapping[str, float],
) -> list[str]:
    b = baseline_metrics.as_dict() if isinstance(baseline_metrics, EvaluationMetrics) else dict(baseline_metrics)
    t = treatment_metrics.as_dict() if isinstance(treatment_metrics, EvaluationMetrics) else dict(treatment_metrics)
    db = float(b.get("build_coherence", 0.0))
    dt = float(t.get("build_coherence", 0.0))
    diff = round(dt - db, 6)
    if diff > 1e-6:
        return [f"Build coherence improved after treatment (Δ≈{diff:+.4f})."]
    if diff < -1e-6:
        return [f"Build coherence decreased vs baseline (Δ≈{diff:+.4f})."]
    return ["Build coherence unchanged between baseline and treatment."]


def build_benchmark_report(
    *,
    baseline_label: str,
    baseline_snapshot: Mapping[str, Any],
    baseline_metrics: EvaluationMetrics | Mapping[str, float],
    treatment_label: str,
    treatment_snapshot: Mapping[str, Any],
    treatment_metrics: EvaluationMetrics | Mapping[str, float],
) -> dict[str, Any]:
    """
    Single JSON-friendly object for local bench files or CI artifacts.

    Pairs are caller-defined (e.g. config A vs B, or pre/post code change).
    """
    mc = compare_metrics(baseline_metrics, treatment_metrics)
    sc = compare_snapshots_signals(baseline_snapshot, treatment_snapshot)
    rerank_treatment = reranking_impact_analysis(treatment_snapshot)
    compat = compatibility_penalty_impact(baseline_snapshot, treatment_snapshot)
    fb_t = fallback_recovery_effectiveness(treatment_snapshot)
    coh_lines = build_coherence_delta_line(baseline_metrics, treatment_metrics)

    narrative: list[str] = []
    narrative.extend(human_metric_comparison_lines(mc))
    narrative.extend(human_signal_comparison_lines(sc))
    narrative.extend(rerank_treatment.get("summaryLines", []))
    narrative.extend(compat.get("summaryLines", []))
    narrative.extend(fb_t.get("summaryLines", []))
    narrative.extend(coh_lines)

    wd_b = float(
        baseline_metrics.as_dict().get("winner_trait_diversity", 0.0)
        if isinstance(baseline_metrics, EvaluationMetrics)
        else float(dict(baseline_metrics).get("winner_trait_diversity", 0.0)),
    )
    wd_t = float(
        treatment_metrics.as_dict().get("winner_trait_diversity", 0.0)
        if isinstance(treatment_metrics, EvaluationMetrics)
        else float(dict(treatment_metrics).get("winner_trait_diversity", 0.0)),
    )
    if wd_t > wd_b + 1e-6:
        pct = 100.0 * (wd_t - wd_b) / max(wd_b, 1e-9)
        narrative.insert(
            0,
            f"Recommendation diversity (winner_trait_diversity) rose ~{abs(pct):.1f}% vs baseline.",
        )

    return {
        "schemaVersion": "evaluation.benchmark_report.v1",
        "baselineLabel": baseline_label,
        "treatmentLabel": treatment_label,
        "metricComparison": mc,
        "signalComparison": sc,
        "rerankingImpactTreatment": rerank_treatment,
        "compatibilityImpact": compat,
        "fallbackTreatment": fb_t,
        "narrativeLines": narrative,
    }


def evaluate_paired_runs(
    baseline_engine: TraitEngineResult,
    treatment_engine: TraitEngineResult,
    user_trait_scores: Mapping[str, float],
    *,
    baseline_label: str = "baseline",
    treatment_label: str = "treatment",
    survey_answers: Mapping[str, str] | None = None,
    eval_cfg: EvaluationConfig | None = None,
) -> dict[str, Any]:
    """
    Run `evaluate_recommendation` twice and return snapshots, metrics, diagnostics, plus benchmark report.
    """
    b_snap, b_met, b_diag = evaluate_recommendation(
        baseline_engine,
        user_trait_scores,
        survey_answers=survey_answers,
        eval_cfg=eval_cfg,
    )
    t_snap, t_met, t_diag = evaluate_recommendation(
        treatment_engine,
        user_trait_scores,
        survey_answers=survey_answers,
        eval_cfg=eval_cfg,
    )
    report = build_benchmark_report(
        baseline_label=baseline_label,
        baseline_snapshot=b_snap,
        baseline_metrics=b_met,
        treatment_label=treatment_label,
        treatment_snapshot=t_snap,
        treatment_metrics=t_met,
    )
    return {
        "baseline": {"snapshot": b_snap, "metrics": b_met.as_dict(), "diagnostics": b_diag},
        "treatment": {"snapshot": t_snap, "metrics": t_met.as_dict(), "diagnostics": t_diag},
        "benchmarkReport": report,
    }


def synthetic_metrics_from_snapshots(
    baseline_snapshot: Mapping[str, Any],
    treatment_snapshot: Mapping[str, Any],
    *,
    eval_cfg: EvaluationConfig | None = None,
) -> dict[str, Any]:
    """
    Compare two frozen snapshots without engines (e.g. replayed JSON from disk).

    Returns the same `benchmarkReport` shape as `build_benchmark_report` after computing metrics.
    """
    b_m = compute_metrics_from_snapshot(baseline_snapshot, eval_cfg=eval_cfg)
    t_m = compute_metrics_from_snapshot(treatment_snapshot, eval_cfg=eval_cfg)
    report = build_benchmark_report(
        baseline_label="snapshot_a",
        baseline_snapshot=baseline_snapshot,
        baseline_metrics=b_m,
        treatment_label="snapshot_b",
        treatment_snapshot=treatment_snapshot,
        treatment_metrics=t_m,
    )
    return report
