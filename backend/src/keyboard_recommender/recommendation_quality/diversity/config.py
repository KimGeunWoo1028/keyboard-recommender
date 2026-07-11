"""Diversity reranking knobs (separate from global `QualityConfig` to keep imports small)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class DiversityConfig:
    """
    Lightweight per-family list reranking after the winning build is fixed.

    Rank-1 (the chosen pick) is always preserved; lower ranks are diversified greedily.
    """

    enabled: bool = True
    """When false, ranked lists stay in pure cosine order."""

    ranking_strength: float = 0.38
    """How strongly diversity penalties reduce the greedy score for positions 2..K."""

    trait_similarity_weight: float = 1.0
    """Weight on unweighted cosine similarity between part trait vectors (0..1)."""

    same_id_prefix_weight: float = 0.14
    """Penalty if two parts share the same first two hyphen segments of `id` (family-ish proxy)."""

    dominant_signature_weight: float = 0.2
    """Penalty when top-2 dominant axes match another item already placed earlier in the list."""
