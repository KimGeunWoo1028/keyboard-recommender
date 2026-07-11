"""Read-side helpers for operational analytics (interpretable, SQL-first)."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalConfidenceSample,
    EvalDiagnostics,
    EvalMetrics,
    EvalRecommendationRun,
    EvalSnapshot,
)
from keyboard_recommender.recommendation_quality.evaluation.trend_analysis import two_window_trend_label


def runs_for_scenario(
    session: Session,
    scenario_id: str,
    *,
    limit: int = 100,
) -> Sequence[EvalRecommendationRun]:
    stmt = (
        select(EvalRecommendationRun)
        .where(EvalRecommendationRun.scenario_id == scenario_id)
        .order_by(EvalRecommendationRun.created_at.desc())
        .limit(limit)
    )
    return session.execute(stmt).scalars().all()


def _scenario_filter(scenario_id: str | None):
    if scenario_id is None or scenario_id == "":
        return True
    return EvalRecommendationRun.scenario_id == scenario_id


def metric_history_rows_scoped(
    session: Session,
    scenario_id: str | None,
    *,
    limit: int = 200,
) -> list[dict[str, Any]]:
    """
    Same shape as :func:`metric_history_rows`, but ``scenario_id`` may be ``None`` / empty
    to include **all** persisted runs (newest-first).
    """
    stmt = (
        select(
            EvalRecommendationRun.id,
            EvalRecommendationRun.scenario_id,
            EvalRecommendationRun.created_at,
            EvalMetrics.trait_alignment,
            EvalMetrics.diversity_intervention,
            EvalMetrics.build_coherence,
            EvalMetrics.compatibility_stability,
            EvalMetrics.winner_trait_diversity,
            EvalMetrics.reranking_distortion_index,
        )
        .join(EvalMetrics, EvalMetrics.run_id == EvalRecommendationRun.id)
        .where(_scenario_filter(scenario_id))
        .order_by(EvalRecommendationRun.created_at.desc())
        .limit(limit)
    )
    rows = session.execute(stmt).all()
    out: list[dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "runId": str(r.id),
                "scenarioId": r.scenario_id,
                "createdAt": r.created_at.isoformat() if isinstance(r.created_at, datetime) else r.created_at,
                "traitAlignment": float(r.trait_alignment),
                "diversityIntervention": float(r.diversity_intervention),
                "buildCoherence": float(r.build_coherence),
                "compatibilityStability": float(r.compatibility_stability),
                "winnerTraitDiversity": float(r.winner_trait_diversity),
                "rerankingDistortionIndex": float(r.reranking_distortion_index),
            },
        )
    return out


def metric_history_rows(
    session: Session,
    scenario_id: str,
    *,
    limit: int = 200,
) -> list[dict[str, Any]]:
    """
    Join run + metrics for analytics exports / Phase-2 style rollups.

    Ordered newest-first.
    """
    return metric_history_rows_scoped(session, scenario_id, limit=limit)


def confidence_history_rows_scoped(
    session: Session,
    scenario_id: str | None,
    *,
    limit: int = 200,
) -> list[dict[str, Any]]:
    stmt = (
        select(
            EvalRecommendationRun.id,
            EvalRecommendationRun.scenario_id,
            EvalRecommendationRun.created_at,
            EvalConfidenceSample.overall,
            EvalConfidenceSample.label,
            EvalConfidenceSample.recorded_at,
        )
        .join(EvalConfidenceSample, EvalConfidenceSample.run_id == EvalRecommendationRun.id)
        .where(_scenario_filter(scenario_id))
        .order_by(EvalConfidenceSample.recorded_at.desc())
        .limit(limit)
    )
    rows = session.execute(stmt).all()
    return [
        {
            "runId": str(r.id),
            "scenarioId": r.scenario_id,
            "runCreatedAt": r.created_at.isoformat() if isinstance(r.created_at, datetime) else r.created_at,
            "overall": float(r.overall) if r.overall is not None else None,
            "label": r.label,
            "recordedAt": r.recorded_at.isoformat() if isinstance(r.recorded_at, datetime) else r.recorded_at,
        }
        for r in rows
    ]


def confidence_history_rows(
    session: Session,
    scenario_id: str,
    *,
    limit: int = 200,
) -> list[dict[str, Any]]:
    return confidence_history_rows_scoped(session, scenario_id, limit=limit)


def recent_snapshots_for_drift(
    session: Session,
    scenario_id: str | None,
    *,
    limit: int = 64,
) -> list[dict[str, Any]]:
    """
    Newest-first lightweight rows for switch-family / fallback frequency drift.

    Pulls only ``EvalSnapshot.body`` plus run timestamps (no giant ranked lists in SQL).
    """
    stmt = (
        select(
            EvalRecommendationRun.id,
            EvalRecommendationRun.scenario_id,
            EvalRecommendationRun.created_at,
            EvalSnapshot.body,
        )
        .join(EvalSnapshot, EvalSnapshot.run_id == EvalRecommendationRun.id)
        .where(_scenario_filter(scenario_id))
        .order_by(EvalRecommendationRun.created_at.desc())
        .limit(limit)
    )
    rows = session.execute(stmt).all()
    return [
        {
            "runId": str(r.id),
            "scenarioId": r.scenario_id,
            "createdAt": r.created_at.isoformat() if isinstance(r.created_at, datetime) else r.created_at,
            "snapshot": dict(r.body) if isinstance(r.body, dict) else {},
        }
        for r in rows
    ]


def diagnostics_for_run(session: Session, run_id: uuid.UUID) -> dict[str, Any] | None:
    stmt = select(EvalDiagnostics.body).where(EvalDiagnostics.run_id == run_id).limit(1)
    row = session.execute(stmt).scalar_one_or_none()
    return dict(row) if row is not None else None


def snapshot_for_run(session: Session, run_id: uuid.UUID) -> dict[str, Any] | None:
    stmt = select(EvalSnapshot.body).where(EvalSnapshot.run_id == run_id).limit(1)
    row = session.execute(stmt).scalar_one_or_none()
    return dict(row) if row is not None else None


def list_benchmark_runs(
    session: Session,
    scenario_id: str | None = None,
    *,
    limit: int = 50,
) -> Sequence[EvalBenchmarkRun]:
    stmt = select(EvalBenchmarkRun)
    if scenario_id is not None:
        stmt = stmt.where(EvalBenchmarkRun.scenario_id == scenario_id)
    stmt = stmt.order_by(EvalBenchmarkRun.created_at.desc()).limit(limit)
    return session.execute(stmt).scalars().all()


def operational_trend_bundle(
    session: Session,
    scenario_id: str,
    *,
    limit: int = 64,
) -> dict[str, Any]:
    """
    Developer-oriented bundle: chronological series + simple two-window trend labels.

    Chronological order for series (oldest → newest) for stable trend labels.
    """
    hist = metric_history_rows(session, scenario_id, limit=limit)
    hist_chrono = list(reversed(hist))
    align = [r["traitAlignment"] for r in hist_chrono]
    div = [r["winnerTraitDiversity"] for r in hist_chrono]
    compat = [r["compatibilityStability"] for r in hist_chrono]
    conf = confidence_history_rows(session, scenario_id, limit=limit)
    conf_chrono = list(reversed(conf))
    overall = [float(x["overall"]) for x in conf_chrono if x.get("overall") is not None]

    def pack(name: str, series: list[float]) -> dict[str, Any]:
        return {
            "metric": name,
            "count": len(series),
            "twoWindowTrend": two_window_trend_label(series) if len(series) >= 2 else "insufficient_data",
            "first": series[0] if series else None,
            "last": series[-1] if series else None,
        }

    lines: list[str] = []
    ta = pack("trait_alignment", align)
    wd = pack("winner_trait_diversity", div)
    cs = pack("compatibility_stability", compat)
    co = pack("confidence_overall", overall)

    if co["twoWindowTrend"] == "down":
        lines.append("Recommendation confidence decreased over recent recorded evaluations in this scenario.")
    elif co["twoWindowTrend"] == "up":
        lines.append("Recommendation confidence increased over recent recorded evaluations in this scenario.")

    if wd["twoWindowTrend"] == "up":
        lines.append("Winner-level trait diversity increased across recent runs (check reranking / catalog mix).")
    if cs["twoWindowTrend"] == "up":
        lines.append("Compatibility stability improved over time (effective penalties likely eased).")

    return {
        "schemaVersion": "evaluation.operational_trend_bundle.v1",
        "scenarioId": scenario_id,
        "seriesLength": len(hist_chrono),
        "traitAlignment": ta,
        "winnerTraitDiversity": wd,
        "compatibilityStability": cs,
        "confidenceOverall": co,
        "summaryLines": lines,
    }


def recommendation_drift_summary(
    session: Session,
    scenario_id: str,
    *,
    window: int = 16,
) -> dict[str, Any]:
    """
    Lightweight drift: compare mean of first vs second half of recent ``traitAlignment`` samples.

    Not a statistical test — developer signal only.
    """
    hist = list(reversed(metric_history_rows(session, scenario_id, limit=window)))
    xs = [r["traitAlignment"] for r in hist]
    if len(xs) < 4:
        return {
            "schemaVersion": "evaluation.drift_summary.v1",
            "scenarioId": scenario_id,
            "status": "insufficient_data",
            "message": "Need at least four recorded evaluations for a split-window drift view.",
        }
    mid = len(xs) // 2
    a = sum(xs[:mid]) / len(xs[:mid])
    b = sum(xs[mid:]) / len(xs[mid:])
    delta = round(b - a, 6)
    return {
        "schemaVersion": "evaluation.drift_summary.v1",
        "scenarioId": scenario_id,
        "status": "ok",
        "firstWindowMean": round(a, 6),
        "secondWindowMean": round(b, 6),
        "deltaSecondMinusFirst": delta,
        "interpretation": (
            "trait_alignment shifted upward in more recent evaluations."
            if delta > 1e-6
            else "trait_alignment shifted downward in more recent evaluations."
            if delta < -1e-6
            else "trait_alignment is flat between the two recent windows."
        ),
    }
