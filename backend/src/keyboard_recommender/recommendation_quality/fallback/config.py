"""Fallback / recovery tuning (kept separate from `QualityConfig` file size)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class FallbackConfig:
    """
    Incremental recovery: relax *selection* scoring only; true compatibility audit stays unmodified.

    `relax_compatibility_steps` are multipliers in (0, 1] applied to `effective_penalty_total` when
    re-ranking candidate builds. 1.0 = baseline (full penalty influence on the selection score).
    """

    enabled: bool = True
    min_overall_confidence: float = 0.42
    min_mean_raw_cosine: float = -0.42
    max_effective_compat_penalty_trigger: float = 0.62
    """When effective compatibility penalty exceeds this *and* similarity is weak, allow recovery."""

    weak_similarity_threshold: float = 0.48
    """Similarity component at/below this with high penalty triggers recovery (see thresholds)."""

    relax_compatibility_steps: tuple[float, ...] = (0.86, 0.72, 0.58, 0.45)
    diversity_strength_relax_factors: tuple[float, ...] = (0.72, 0.5, 0.35, 0.2)
    """After a recovery tier > 0, multiply `DiversityConfig.ranking_strength` for the diversity pass."""

    confidence_weight_similarity: float = 0.52
    confidence_weight_compatibility: float = 0.34
    confidence_weight_diversity_distortion: float = 0.08
    confidence_penalty_per_fallback_tier: float = 0.055
