"""Normalized confidence for the final selected build (frontend-friendly + hook strings)."""

from __future__ import annotations

from dataclasses import dataclass

from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.recommendation_quality.diversity.types import DiversityRerankAudit
from keyboard_recommender.recommendation_quality.fallback.replacement import mean_raw_cosine_sext


@dataclass(frozen=True, slots=True)
class BuildRecommendationConfidence:
    """0–1 overall score with coarse label + optional explanation hooks."""

    overall: float
    similarity_component: float
    compatibility_component: float
    diversity_distortion_component: float
    fallback_tier: int
    label: str
    hooks: tuple[str, ...]


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _diversity_distortion_score(div: DiversityRerankAudit | None) -> float:
    """
    Return a value in [0,1] where higher means *more* distortion (lists reordered).

    Used as a *small* downward pressure on confidence, not a hard gate.
    """
    if div is None:
        return 0.0
    changed = 0
    for fam in div.families:
        if fam.original_order_ids != fam.reranked_order_ids:
            changed += 1
    # 0..6 families → map to 0..1
    return _clamp01(changed / 6.0)


def compute_build_confidence(
    rs,
    rp,
    rf,
    rl,
    rc,
    rk,
    audit: BuildCompatibilityAudit,
    diversity_audit: DiversityRerankAudit | None,
    *,
    cfg: QualityConfig,
    fallback_tier: int,
) -> BuildRecommendationConfidence:
    fb = cfg.fallback
    mean_raw = mean_raw_cosine_sext(rs, rp, rf, rl, rc, rk)
    # Map mean raw cosine (typically ~[-1,1] per part, mean in ~[-1,1]) to 0..1
    similarity = _clamp01((mean_raw + 1.0) / 2.0)

    pen = float(audit.effective_penalty_total)
    pen_ref = max(1e-6, float(cfg.max_effective_penalty))
    compatibility = _clamp01(1.0 - min(1.0, pen / pen_ref))

    distortion = _diversity_distortion_score(diversity_audit)
    diversity_headroom = _clamp01(1.0 - 0.35 * distortion)

    overall = (
        fb.confidence_weight_similarity * similarity
        + fb.confidence_weight_compatibility * compatibility
        + fb.confidence_weight_diversity_distortion * diversity_headroom
    )
    overall -= float(fallback_tier) * float(fb.confidence_penalty_per_fallback_tier)
    overall = _clamp01(overall)

    if overall >= 0.72:
        label = "high"
    elif overall >= 0.48:
        label = "balanced"
    else:
        label = "experimental"

    hooks: list[str] = [
        f"confidence:similarity={similarity:.3f}",
        f"confidence:compatibility_headroom={compatibility:.3f}",
        f"confidence:diversity_distortion_index={distortion:.3f}",
    ]
    if fallback_tier > 0:
        hooks.append(f"confidence:fallback_tier={fallback_tier}")
    hooks.append(f"confidence:label={label}")

    return BuildRecommendationConfidence(
        overall=round(overall, 4),
        similarity_component=round(similarity, 4),
        compatibility_component=round(compatibility, 4),
        diversity_distortion_component=round(diversity_headroom, 4),
        fallback_tier=fallback_tier,
        label=label,
        hooks=tuple(hooks),
    )
