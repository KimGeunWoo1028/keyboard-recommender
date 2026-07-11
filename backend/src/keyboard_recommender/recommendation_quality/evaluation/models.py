"""Typed evaluation outputs (JSON-friendly via `as_dict`)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class EvaluationConfig:
    """Tunable references for metric normalization (no hidden globals in metric functions)."""

    max_effective_compat_penalty_ref: float = 0.95
    build_coherence_axis_std_ref: float = 4.0
    """On catalog ~0–10 axes, std across four parts above this drives coherence toward 0."""


@dataclass(frozen=True, slots=True)
class EvaluationMetrics:
    """
    Interpretable metrics derived **only** from snapshot inputs (audits + vectors + picks).

    These are *evaluations* of signals like `recommendationConfidence`, not replacements for them.
    """

    trait_alignment: float
    """0–1 mean axis agreement between user vector and mean trait vector of the four winners."""

    diversity_intervention: float
    """0–1 fraction of families whose ranked list order changed after diversity rerank."""

    build_coherence: float
    """0–1 inverse spread of key axes across the four winners (tighter cluster → higher)."""

    compatibility_stability: float
    """0–1 headroom from effective compatibility penalty magnitude (lower penalty → higher)."""

    reranking_distortion_index: float
    """Alias clarity: same as diversity_intervention (fraction of lists reordered); kept for API wording."""

    winner_trait_diversity: float
    """0–1 mean pairwise (1 − cosine) among the four picked parts (higher → more varied parts)."""

    def as_dict(self) -> dict[str, float]:
        return {
            "trait_alignment": float(self.trait_alignment),
            "diversity_intervention": float(self.diversity_intervention),
            "build_coherence": float(self.build_coherence),
            "compatibility_stability": float(self.compatibility_stability),
            "reranking_distortion_index": float(self.reranking_distortion_index),
            "winner_trait_diversity": float(self.winner_trait_diversity),
        }
