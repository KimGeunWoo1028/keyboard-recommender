"""
Lightweight trait signatures (no k-means, no embeddings).

Used only as a coarse duplicate detector for diversity reranking.
"""

from __future__ import annotations

from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.models import KeyboardPart


def dominant_axis_signature(part: KeyboardPart, top_n: int = 2) -> str:
    """
    Stable string from the strongest axes on the part (names only, sorted by strength).

    Two parts with the same signature are likely "same flavor" for diversity purposes.
    """
    pairs = [(k, float(part.traits.get(k, 0.0))) for k in TRAIT_AXIS_IDS]
    pairs.sort(key=lambda kv: kv[1], reverse=True)
    names = [p[0] for p in pairs[: max(1, top_n)]]
    return "|".join(names)
