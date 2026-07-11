"""Weighted cosine ranking over catalog parts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Sequence

from keyboard_recommender.trait_engine.explanations import explain_weighted_agreement
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import weighted_cosine_similarity


@dataclass(frozen=True)
class RankedPart:
    part: KeyboardPart
    score: float
    raw_cosine: float
    explanation: str


def rank_parts(
    user: dict[str, float],
    parts: Sequence[KeyboardPart],
    weights: Mapping[str, float],
    *,
    top_k: int | None = None,
    feedback_multipliers: Mapping[str, float] | None = None,
) -> list[RankedPart]:
    k = top_k if top_k is not None else len(parts)
    mult = feedback_multipliers or {}
    ranked: list[RankedPart] = []
    for p in parts:
        cos = weighted_cosine_similarity(user, dict(p.traits), weights)
        m = float(mult.get(p.id, 1.0))
        score = cos * p.popularity_weight * m
        expl = explain_weighted_agreement(user, dict(p.traits), weights)
        ranked.append(RankedPart(part=p, score=score, raw_cosine=cos, explanation=expl))
    ranked.sort(key=lambda r: r.score, reverse=True)
    return ranked[:k]
