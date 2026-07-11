"""Diversity penalty helpers (trait similarity + cheap id/signature heuristics)."""

from __future__ import annotations

import math
from collections.abc import Mapping

from keyboard_recommender.recommendation_quality.diversity.clustering import dominant_axis_signature
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.models import KeyboardPart


def _id_prefix_two(part_id: str) -> str:
    parts = part_id.lower().split("-")
    if len(parts) >= 2:
        return f"{parts[0]}-{parts[1]}"
    return parts[0] if parts else part_id


def trait_cosine_similarity(a: Mapping[str, float], b: Mapping[str, float]) -> float:
    """Unweighted cosine on the canonical axis basis (catalog parts use ~0–10 per axis)."""
    dot = 0.0
    na = 0.0
    nb = 0.0
    for k in TRAIT_AXIS_IDS:
        x = float(a.get(k, 0.0))
        y = float(b.get(k, 0.0))
        dot += x * y
        na += x * x
        nb += y * y
    if na <= 1e-12 or nb <= 1e-12:
        return 0.0
    return max(-1.0, min(1.0, dot / (math.sqrt(na) * math.sqrt(nb))))


def same_prefix_penalty(id_a: str, id_b: str) -> float:
    """1.0 when the first two hyphen segments match (cheap family proxy), else 0.0."""
    return 1.0 if _id_prefix_two(id_a) == _id_prefix_two(id_b) else 0.0


def signature_match_penalty(part_a: KeyboardPart, part_b: KeyboardPart) -> float:
    """1.0 when dominant axis signatures match."""
    return 1.0 if dominant_axis_signature(part_a) == dominant_axis_signature(part_b) else 0.0


def diversity_penalty_to_chosen(
    candidate: KeyboardPart,
    chosen_parts: list[KeyboardPart],
    *,
    trait_weight: float,
    prefix_weight: float,
    signature_weight: float,
) -> float:
    """Sum of penalties vs every part already placed in the reranked output."""
    if not chosen_parts:
        return 0.0
    total = 0.0
    for other in chosen_parts:
        total += trait_weight * trait_cosine_similarity(candidate.traits, other.traits)
        total += prefix_weight * same_prefix_penalty(candidate.id, other.id)
        total += signature_weight * signature_match_penalty(candidate, other)
    return total
