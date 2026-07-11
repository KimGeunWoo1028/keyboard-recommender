"""
Normalize **low / medium / high** authoring tiers into numeric scores for the vector engine.

Default mapping (explicit, boring, predictable):
    low = 0.0, medium = 0.5, high = 1.0

Finer numeric values later: store floats in DB and skip tier parsing, or add `tier_resolution`
when ingesting (e.g. medium+ → 0.62) without changing matcher code.
"""

from __future__ import annotations

from enum import Enum
from typing import Mapping


class TraitTier(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


TIER_TO_SCORE: dict[TraitTier, float] = {
    TraitTier.LOW: 0.0,
    TraitTier.MEDIUM: 0.5,
    TraitTier.HIGH: 1.0,
}


def parse_tier(raw: str) -> TraitTier:
    """Parse case-insensitive tier strings; raises ValueError if invalid."""
    key = raw.strip().lower()
    for tier in TraitTier:
        if tier.value == key:
            return tier
    msg = f"invalid trait tier: {raw!r} (expected low|medium|high)"
    raise ValueError(msg)


def tier_to_score(tier: TraitTier | str) -> float:
    if isinstance(tier, str):
        tier = parse_tier(tier)
    return TIER_TO_SCORE[tier]


def sparse_tiers_to_scores(tiers: Mapping[str, str]) -> dict[str, float]:
    """Convert {trait_id: 'low'|'medium'|'high'} → {trait_id: float}."""
    return {trait_id: tier_to_score(tier) for trait_id, tier in tiers.items()}


def score_to_display_tier(score: float, *, eps: float = 0.08) -> TraitTier:
    """Best-effort reverse mapping for admin UI (snap to nearest band)."""
    s = float(score)
    if s <= 0.0 + eps:
        return TraitTier.LOW
    if s >= 1.0 - eps:
        return TraitTier.HIGH
    if abs(s - 0.5) <= eps:
        return TraitTier.MEDIUM
    # fall back to nearest of the three anchors
    anchors = ((0.0, TraitTier.LOW), (0.5, TraitTier.MEDIUM), (1.0, TraitTier.HIGH))
    _, tier = min(anchors, key=lambda t: abs(t[0] - s))
    return tier
