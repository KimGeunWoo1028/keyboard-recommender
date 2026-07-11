"""
End-to-end multi-axis recommendation from a user trait vector.

**Flow**: user scores (same axes as catalog) → family-specific weights → weighted cosine
→ popularity multiplier → **top-K per family** → **build-level compatibility penalties**
→ **diversity rerank** → **fallback recovery (incremental)** → confidence snapshot + per-family explanations.
"""

from __future__ import annotations

from dataclasses import dataclass

from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.recommendation_quality.diversity.types import DiversityRerankAudit
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.recommendation_quality.fallback.confidence import BuildRecommendationConfidence
from keyboard_recommender.recommendation_quality.fallback.types import FallbackRecoveryAudit
from keyboard_recommender.recommendation_quality.feedback_learning.types import LearningAdjustments
from keyboard_recommender.trait_engine.matching import RankedPart


@dataclass(frozen=True)
class TraitEngineResult:
    top_switch: RankedPart
    top_plate: RankedPart
    top_foam: RankedPart
    top_layout: RankedPart
    top_case: RankedPart
    top_keycap: RankedPart
    ranked_switches: list[RankedPart]
    ranked_plates: list[RankedPart]
    ranked_foams: list[RankedPart]
    ranked_layouts: list[RankedPart]
    ranked_cases: list[RankedPart]
    ranked_keycaps: list[RankedPart]
    compatibility_audit: BuildCompatibilityAudit | None = None
    diversity_audit: DiversityRerankAudit | None = None
    fallback_audit: FallbackRecoveryAudit | None = None
    recommendation_confidence: BuildRecommendationConfidence | None = None


def recommend_from_user_traits(
    user_trait_scores: dict[str, float],
    *,
    survey_answers: dict[str, str] | None = None,
    nl_normalized_text: str | None = None,
    nl_matched_term_ids: tuple[str, ...] | None = None,
    learning: LearningAdjustments | None = None,
    runtime_flags: OperationalFeatureFlags | None = None,
) -> TraitEngineResult:
    from keyboard_recommender.recommendation_quality.build_selection import pick_build_with_compatibility

    ts, tp, tf, tl, tc, tk, sw, pl, fo, la, ca, kc, audit, div_audit, fb_audit, conf = pick_build_with_compatibility(
        user_trait_scores,
        survey_answers=survey_answers,
        nl_normalized_text=nl_normalized_text,
        nl_matched_term_ids=nl_matched_term_ids,
        learning=learning,
        runtime_flags=runtime_flags,
    )
    return TraitEngineResult(
        top_switch=ts,
        top_plate=tp,
        top_foam=tf,
        top_layout=tl,
        top_case=tc,
        top_keycap=tk,
        ranked_switches=sw,
        ranked_plates=pl,
        ranked_foams=fo,
        ranked_layouts=la,
        ranked_cases=ca,
        ranked_keycaps=kc,
        compatibility_audit=audit,
        diversity_audit=div_audit,
        fallback_audit=fb_audit,
        recommendation_confidence=conf,
    )


def recommend_from_survey(answers: dict[str, str]) -> TraitEngineResult:
    from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores

    user = survey_answers_to_trait_scores(answers)
    return recommend_from_user_traits(user, survey_answers=answers)
