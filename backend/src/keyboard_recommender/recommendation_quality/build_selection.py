"""
Build selection: top-K per family → **fallback-aware** Cartesian selection (relevance − relaxed compat)
→ **diversity rerank** (strength may be relaxed after recovery) → confidence snapshot.
"""

from __future__ import annotations

from dataclasses import replace

from keyboard_recommender.recommendation_quality.config import QualityConfig, default_quality_config
from keyboard_recommender.recommendation_quality.diversity.types import DiversityRerankAudit
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.recommendation_quality.feedback_learning.nudge import apply_trait_nudges
from keyboard_recommender.recommendation_quality.feedback_learning.types import LearningAdjustments
from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.recommendation_quality.diversity.rerank import rerank_family_lists
from keyboard_recommender.recommendation_quality.fallback.confidence import BuildRecommendationConfidence, compute_build_confidence
from keyboard_recommender.recommendation_quality.fallback.recovery import select_build_with_fallback
from keyboard_recommender.recommendation_quality.fallback.types import FallbackRecoveryAudit
from keyboard_recommender.recommendation_quality.intent.explicit_intent import infer_explicit_build_intent
from keyboard_recommender.trait_engine.catalog_sample import CASES, FOAM, KEYCAPS, LAYOUTS, PLATES, SWITCHES
from keyboard_recommender.trait_engine.matching import RankedPart, rank_parts
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import from_sparse
from keyboard_recommender.trait_engine.weights import (
    merge_weights,
    weights_for_case,
    weights_for_foam,
    weights_for_keycap,
    weights_for_layout,
    weights_for_plate,
    weights_for_switch,
)

# Temporary placeholder only if KEYCAPS seed failed to load.
_KEYCAP_PLACEHOLDER = KeyboardPart(
    id="keycap-placeholder-universal",
    name="Universal keycap set",
    description="키캡 seed 로드 전 플레이스홀더입니다.",
    family="keycap",
    traits=from_sparse({"muted": 5, "deep_sound": 5, "high_pitch": 4, "poppy": 4}),
    popularity_weight=1.0,
    metadata={
        "profile": "cherry",
        "material": "PBT",
        "manufacturing": "dye_sub",
        "kit_scope": "base",
        "compatible_layout_sizes": [],
        "colorway_mood": "neutral",
    },
)


def _clamp_diversity_strength(x: float) -> float:
    return max(0.05, min(0.85, float(x)))


def pick_build_with_compatibility(
    user_trait_scores: dict[str, float],
    *,
    survey_answers: dict[str, str] | None = None,
    nl_normalized_text: str | None = None,
    nl_matched_term_ids: tuple[str, ...] | None = None,
    cfg: QualityConfig | None = None,
    learning: LearningAdjustments | None = None,
    runtime_flags: OperationalFeatureFlags | None = None,
) -> tuple[
    RankedPart,
    RankedPart,
    RankedPart,
    RankedPart,
    RankedPart,
    RankedPart,
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    BuildCompatibilityAudit,
    DiversityRerankAudit | None,
    FallbackRecoveryAudit,
    BuildRecommendationConfidence,
]:
    """
    Return the per-family `RankedPart` winners after a small Cartesian search over `top_k` lists.

    Build score (higher is better):
        sum(raw_cosine across the six picks)
        - penalty_strength * effective_compatibility_penalty
    """
    cfg = cfg or default_quality_config()
    flags = runtime_flags or OperationalFeatureFlags()
    if runtime_flags is not None:
        cfg = replace(
            cfg,
            fallback=replace(cfg.fallback, enabled=bool(flags.enable_fallback)),
            diversity=replace(cfg.diversity, enabled=bool(flags.enable_reranking)),
        )
    if learning and abs(learning.diversity_ranking_strength_delta) > 1e-12:
        d0 = cfg.diversity
        cfg = replace(
            cfg,
            diversity=replace(
                d0,
                ranking_strength=_clamp_diversity_strength(
                    float(d0.ranking_strength) + float(learning.diversity_ranking_strength_delta),
                ),
            ),
        )
    k = max(1, min(cfg.assembly_top_k, 12))

    active_learning = learning if (learning and flags.enable_feedback_weighting) else None
    user_vec = apply_trait_nudges(user_trait_scores, active_learning.trait_nudges if active_learning else None)
    part_mult = active_learning.part_score_multipliers if active_learning else {}

    intent = infer_explicit_build_intent(
        user_vec,
        survey_answers,
        nl_normalized_text,
        nl_matched_term_ids,
        cfg,
    )

    sw_w = merge_weights(weights_for_switch(), active_learning.weight_overlay_switch if active_learning else None)
    pl_w = merge_weights(weights_for_plate(), active_learning.weight_overlay_plate if active_learning else None)
    fo_w = merge_weights(weights_for_foam(), active_learning.weight_overlay_foam if active_learning else None)
    la_w = merge_weights(weights_for_layout(), active_learning.weight_overlay_layout if active_learning else None)
    ca_w = merge_weights(weights_for_case(), None)
    kc_w = merge_weights(weights_for_keycap(), None)

    keycap_pool = KEYCAPS if KEYCAPS else [_KEYCAP_PLACEHOLDER]

    sw = rank_parts(user_vec, SWITCHES, sw_w, top_k=k, feedback_multipliers=part_mult)
    pl = rank_parts(user_vec, PLATES, pl_w, top_k=k, feedback_multipliers=part_mult)
    fo = rank_parts(user_vec, FOAM, fo_w, top_k=k, feedback_multipliers=part_mult)
    la = rank_parts(user_vec, LAYOUTS, la_w, top_k=k, feedback_multipliers=part_mult)
    ca = rank_parts(user_vec, CASES, ca_w, top_k=k, feedback_multipliers=part_mult)
    kc = rank_parts(user_vec, keycap_pool, kc_w, top_k=k, feedback_multipliers=part_mult)

    rs, rp, rf, rl, rc, rk, best_audit, fb_audit = select_build_with_fallback(
        sw, pl, fo, la, ca, kc, intent, cfg=cfg,
    )

    if cfg.diversity.enabled:
        div_cfg = replace(
            cfg.diversity,
            ranking_strength=float(cfg.diversity.ranking_strength) * float(fb_audit.diversity_strength_mult),
        )
        sw2, pl2, fo2, la2, ca2, kc2, div_audit = rerank_family_lists(
            (rs, rp, rf, rl, rc, rk),
            (sw, pl, fo, la, ca, kc),
            div_cfg,
        )
    else:
        sw2, pl2, fo2, la2, ca2, kc2 = sw, pl, fo, la, ca, kc
        div_audit = None

    conf = compute_build_confidence(
        rs,
        rp,
        rf,
        rl,
        rc,
        rk,
        best_audit,
        div_audit,
        cfg=cfg,
        fallback_tier=fb_audit.tier,
    )
    fb_out = replace(
        fb_audit,
        confidence_after=round(conf.overall, 4),
        overall_label=conf.label,
    )
    return rs, rp, rf, rl, rc, rk, sw2, pl2, fo2, la2, ca2, kc2, best_audit, div_audit, fb_out, conf
