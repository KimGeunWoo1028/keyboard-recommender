"""Serialize recommendation engine outputs into JSON-ready snapshots (raw signals only)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.recommendation_quality.diversity.types import DiversityRerankAudit
from keyboard_recommender.recommendation_quality.fallback.confidence import BuildRecommendationConfidence
from keyboard_recommender.recommendation_quality.fallback.types import FallbackRecoveryAudit
from keyboard_recommender.trait_engine.matching import RankedPart
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult


def _ranked_row(r: RankedPart) -> dict[str, Any]:
    return {
        "itemId": r.part.id,
        "family": r.part.family,
        "rawCosine": round(float(r.raw_cosine), 6),
        "score": round(float(r.score), 6),
    }


def _serialize_compat(a: BuildCompatibilityAudit) -> dict[str, Any]:
    return {
        "intentMultiplier": float(a.intent_multiplier),
        "rawPenaltyTotal": float(a.raw_penalty_total),
        "effectivePenaltyTotal": float(a.effective_penalty_total),
        "lines": [
            {
                "ruleId": ln.rule_id,
                "rawPenalty": float(ln.raw_penalty),
                "effectivePenalty": float(ln.effective_penalty),
                "message": ln.message,
            }
            for ln in a.lines
        ],
    }


def _serialize_diversity(d: DiversityRerankAudit) -> dict[str, Any]:
    return {
        "families": [
            {
                "family": f.family,
                "originalOrderIds": list(f.original_order_ids),
                "rerankedOrderIds": list(f.reranked_order_ids),
                "notes": list(f.notes),
            }
            for f in d.families
        ],
    }


def _serialize_fallback(f: FallbackRecoveryAudit) -> dict[str, Any]:
    return {
        "recovered": f.recovered,
        "tier": f.tier,
        "compatibilityRelaxMult": float(f.compatibility_relax_mult),
        "diversityStrengthMult": float(f.diversity_strength_mult),
        "triggers": list(f.triggers),
        "confidenceBefore": float(f.confidence_before),
        "confidenceAfter": float(f.confidence_after),
        "overallLabel": f.overall_label,
        "notes": list(f.notes),
    }


def _serialize_confidence(c: BuildRecommendationConfidence) -> dict[str, Any]:
    return {
        "overall": float(c.overall),
        "similarityComponent": float(c.similarity_component),
        "compatibilityComponent": float(c.compatibility_component),
        "diversityDistortionComponent": float(c.diversity_distortion_component),
        "fallbackTier": int(c.fallback_tier),
        "label": c.label,
        "hooks": list(c.hooks),
    }


def build_recommendation_snapshot(
    engine: TraitEngineResult,
    user_trait_scores: Mapping[str, float],
    *,
    survey_answers: Mapping[str, str] | None = None,
) -> dict[str, Any]:
    """
    Raw-signal snapshot suitable for JSON dumps.

    Does **not** embed computed evaluation metrics — compute those separately via `scoring`.
    """
    winners = (
        engine.top_switch,
        engine.top_plate,
        engine.top_foam,
        engine.top_layout,
        engine.top_case,
        engine.top_keycap,
    )
    snap: dict[str, Any] = {
        "schemaVersion": "evaluation.snapshot.v1",
        "userTraitScores": {k: float(user_trait_scores.get(k, 0.0)) for k in sorted(user_trait_scores.keys())},
        "surveyAnswers": dict(survey_answers) if survey_answers else None,
        "selected": {
            "switch": _ranked_row(engine.top_switch),
            "plate": _ranked_row(engine.top_plate),
            "foam": _ranked_row(engine.top_foam),
            "layout": _ranked_row(engine.top_layout),
            "case": _ranked_row(engine.top_case),
            "keycap": _ranked_row(engine.top_keycap),
        },
        "winnerTraits": [dict(p.part.traits) for p in winners],
        "rankedLists": {
            "switches": [_ranked_row(r) for r in engine.ranked_switches],
            "plates": [_ranked_row(r) for r in engine.ranked_plates],
            "foams": [_ranked_row(r) for r in engine.ranked_foams],
            "layouts": [_ranked_row(r) for r in engine.ranked_layouts],
            "cases": [_ranked_row(r) for r in engine.ranked_cases],
            "keycaps": [_ranked_row(r) for r in engine.ranked_keycaps],
        },
        "compatibilityAudit": _serialize_compat(engine.compatibility_audit)
        if engine.compatibility_audit
        else None,
        "diversityAudit": _serialize_diversity(engine.diversity_audit) if engine.diversity_audit else None,
        "fallbackAudit": _serialize_fallback(engine.fallback_audit) if engine.fallback_audit else None,
        "recommendationConfidence": _serialize_confidence(engine.recommendation_confidence)
        if engine.recommendation_confidence
        else None,
    }
    return snap
