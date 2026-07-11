"""Assemble snapshots + metrics + diagnostics (single call site for tests / tooling)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from keyboard_recommender.recommendation_quality.evaluation.diagnostics import build_diagnostics_report
from keyboard_recommender.recommendation_quality.evaluation.metrics import (
    build_coherence_score,
    compatibility_stability_score,
    diversity_intervention_score,
    mean_trait_vector,
    trait_alignment_score,
    winner_trait_diversity_score,
)
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationConfig, EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.snapshots import build_recommendation_snapshot
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult


def compute_metrics_from_snapshot(
    snapshot: Mapping[str, Any],
    *,
    eval_cfg: EvaluationConfig | None = None,
) -> EvaluationMetrics:
    """Derive metrics from a `build_recommendation_snapshot` dict (deterministic)."""
    cfg = eval_cfg or EvaluationConfig()
    user = {k: float(v) for k, v in (snapshot.get("userTraitScores") or {}).items()}
    wt = snapshot.get("winnerTraits")
    if not isinstance(wt, list) or not wt:
        part_maps: list[dict[str, float]] = []
    else:
        part_maps = [dict(x) for x in wt if isinstance(x, dict)]

    build_mean = mean_trait_vector(part_maps)
    t_align = trait_alignment_score(user, build_mean)
    coh = build_coherence_score(part_maps, cfg)

    ca = snapshot.get("compatibilityAudit") or {}
    eff = float(ca.get("effectivePenaltyTotal", 0.0)) if isinstance(ca, dict) else 0.0
    c_stab = compatibility_stability_score(eff, cfg)

    da = snapshot.get("diversityAudit") or {}
    fams = da.get("families") if isinstance(da, dict) else None
    div_inter = diversity_intervention_score(fams if isinstance(fams, list) else None)
    win_div = winner_trait_diversity_score(part_maps)

    return EvaluationMetrics(
        trait_alignment=t_align,
        diversity_intervention=div_inter,
        build_coherence=coh,
        compatibility_stability=c_stab,
        reranking_distortion_index=div_inter,
        winner_trait_diversity=win_div,
    )


def evaluate_recommendation(
    engine: TraitEngineResult,
    user_trait_scores: Mapping[str, float],
    *,
    survey_answers: Mapping[str, str] | None = None,
    eval_cfg: EvaluationConfig | None = None,
) -> tuple[dict[str, Any], EvaluationMetrics, dict[str, Any]]:
    """
    Returns `(snapshot, metrics, diagnostics)`.

    - `snapshot`: raw signals only
    - `metrics`: derived interpretable scores
    - `diagnostics`: developer-oriented narrative + traces
    """
    snap = build_recommendation_snapshot(engine, user_trait_scores, survey_answers=survey_answers)
    metrics = compute_metrics_from_snapshot(snap, eval_cfg=eval_cfg)
    diag = build_diagnostics_report(snap, metrics)
    return snap, metrics, diag
