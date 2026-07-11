"""Heuristic low-quality / instability detection for fallback triggers."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.recommendation_quality.fallback.confidence import BuildRecommendationConfidence
from keyboard_recommender.recommendation_quality.fallback.replacement import mean_raw_cosine_sext
from keyboard_recommender.trait_engine.matching import RankedPart


def collect_fallback_triggers(
    rs: RankedPart,
    rp: RankedPart,
    rf: RankedPart,
    rl: RankedPart,
    rc: RankedPart,
    rk: RankedPart,
    audit: BuildCompatibilityAudit,
    conf: BuildRecommendationConfidence,
    *,
    cfg: QualityConfig,
) -> tuple[str, ...]:
    """Return human/machine-readable trigger ids (deterministic ordering)."""
    fb = cfg.fallback
    triggers: list[str] = []
    mean_raw = mean_raw_cosine_sext(rs, rp, rf, rl, rc, rk)

    if conf.overall < fb.min_overall_confidence:
        triggers.append("low_overall_confidence")
    if mean_raw < fb.min_mean_raw_cosine:
        triggers.append("low_mean_raw_cosine")
    if float(audit.effective_penalty_total) >= fb.max_effective_compat_penalty_trigger and conf.similarity_component <= fb.weak_similarity_threshold:
        triggers.append("high_compatibility_penalty_with_weak_similarity")

    return tuple(sorted(set(triggers)))
