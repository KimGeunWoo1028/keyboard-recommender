"""Assemble a single JSON bundle for the internal drift viewer (SQL read path)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.recommendation_quality.evaluation.drift.drift_metrics import (
    fallback_recovery_rate,
    max_share,
)
from keyboard_recommender.recommendation_quality.evaluation.drift.family_distribution import (
    family_counts_from_snapshot_rows,
)
from keyboard_recommender.recommendation_quality.evaluation.drift.trend_windows import summarize_series, window_trend
from keyboard_recommender.recommendation_quality.evaluation.storage.queries import (
    confidence_history_rows_scoped,
    list_benchmark_runs,
    metric_history_rows_scoped,
    recent_snapshots_for_drift,
)


def _narrative_lines(
    *,
    scenario_scope: str,
    family_counts: dict[str, int],
    diversity_trend: str,
    rerank_trend: str,
    confidence_trend: str,
    fallback: dict[str, float | int],
) -> list[str]:
    lines: list[str] = []
    if scenario_scope == "all_scenarios":
        lines.append("Scope: all persisted evaluation runs (no scenario filter).")
    else:
        lines.append(f"Scope: scenario_id={scenario_scope!r}.")

    top, share = max_share(family_counts)
    if top and share >= 0.45:
        lines.append(f"Switch family “{top}” dominated about {share * 100:.0f}% of recent winners — check catalog mix or popularity bias.")

    if diversity_trend == "down":
        lines.append("Diversity intervention drifted down in recent windows (reranking may be stabilizing or variety collapsed).")
    elif diversity_trend == "up":
        lines.append("Diversity intervention increased across recent windows.")

    if rerank_trend == "up":
        lines.append("Reranking distortion index rose — list reordering is more aggressive lately.")
    elif rerank_trend == "down":
        lines.append("Reranking distortion index eased — closer to cosine-only ordering.")

    if confidence_trend == "down":
        lines.append("Recommendation confidence decreased over recent recorded evaluations.")
    elif confidence_trend == "up":
        lines.append("Recommendation confidence increased over recent recorded evaluations.")

    if int(fallback.get("runsWithFallbackAudit") or 0) > 0 and float(fallback.get("recoveredRate") or 0) >= 0.35:
        lines.append("Fallback recovery fired on a sizable fraction of recent audited runs — watch confidence gating.")

    if not lines:
        lines.append("No strong drift heuristics fired for this window (data may be flat or sparse).")
    return lines


def build_operational_drift_bundle(
    session: Session,
    *,
    scenario_id: str | None,
    window: int = 48,
) -> dict[str, Any]:
    """
    Read recent metrics + snapshots + confidence samples and return compact tables + trends.

    ``scenario_id`` of ``None`` / empty string = all runs (operational aggregate).
    """
    window = max(8, min(int(window), 256))
    scope = scenario_id if (scenario_id is not None and str(scenario_id).strip() != "") else None
    scenario_label = scope if scope is not None else "all_scenarios"

    hist = metric_history_rows_scoped(session, scope, limit=window)
    if not hist:
        return {
            "schemaVersion": "evaluation.drift_bundle.v1",
            "scenarioId": scenario_label,
            "status": "empty",
            "message": "No evaluation rows found (persistence off or database empty for this scope).",
        }

    chrono = list(reversed(hist))
    div_s = [float(r["diversityIntervention"]) for r in chrono]
    rr_s = [float(r["rerankingDistortionIndex"]) for r in chrono]
    ta_s = [float(r["traitAlignment"]) for r in chrono]
    cs_s = [float(r["compatibilityStability"]) for r in chrono]
    wtd_s = [float(r["winnerTraitDiversity"]) for r in chrono]

    conf_rows = confidence_history_rows_scoped(session, scope, limit=window)
    conf_chrono = list(reversed(conf_rows))
    overall = [float(x["overall"]) for x in conf_chrono if x.get("overall") is not None]

    snap_rows = recent_snapshots_for_drift(session, scope, limit=min(window, 96))
    fam_counts = family_counts_from_snapshot_rows(snap_rows)
    fb = fallback_recovery_rate(snap_rows)

    div_tr = window_trend(div_s)
    rr_tr = window_trend(rr_s)
    co_tr = window_trend(overall) if len(overall) >= 2 else "insufficient_data"

    benchmarks = list_benchmark_runs(session, scenario_id=scope, limit=12)
    bench_out: list[dict[str, Any]] = []
    for b in benchmarks:
        rep = b.report if isinstance(b.report, dict) else {}
        narrative = rep.get("narrativeLines") if isinstance(rep.get("narrativeLines"), list) else []
        bench_out.append(
            {
                "id": str(b.id),
                "scenarioId": b.scenario_id,
                "createdAt": b.created_at.isoformat() if b.created_at else None,
                "baselineLabel": b.baseline_label,
                "treatmentLabel": b.treatment_label,
                "narrativePreview": [str(x) for x in narrative[:4]],
            },
        )

    summary_lines = _narrative_lines(
        scenario_scope=scenario_label,
        family_counts=fam_counts,
        diversity_trend=div_tr,
        rerank_trend=rr_tr,
        confidence_trend=co_tr,
        fallback=fb,
    )

    table_recent = list(reversed(hist[: min(24, len(hist))]))

    return {
        "schemaVersion": "evaluation.drift_bundle.v1",
        "scenarioId": scenario_label,
        "status": "ok",
        "window": window,
        "summaryLines": summary_lines,
        "trends": {
            "traitAlignment": summarize_series(ta_s, name="trait_alignment"),
            "diversityIntervention": summarize_series(div_s, name="diversity_intervention"),
            "rerankingDistortionIndex": summarize_series(rr_s, name="reranking_distortion_index"),
            "compatibilityStability": summarize_series(cs_s, name="compatibility_stability"),
            "winnerTraitDiversity": summarize_series(wtd_s, name="winner_trait_diversity"),
            "confidenceOverall": summarize_series(overall, name="confidence_overall") if overall else {"name": "confidence_overall", "count": 0},
        },
        "confidenceSeries": list(reversed(conf_rows[: min(32, len(conf_rows))])),
        "metricsTableRecent": table_recent,
        "switchFamilyCounts": fam_counts,
        "familyDominance": {"topFamily": max_share(fam_counts)[0], "share": max_share(fam_counts)[1]},
        "fallbackRecovery": fb,
        "benchmarkRuns": bench_out,
    }
