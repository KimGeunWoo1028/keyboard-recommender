"""Human-readable explanations for weighted matches."""

from __future__ import annotations

from typing import Mapping

from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS


def explain_weighted_agreement(
    user: dict[str, float],
    item: dict[str, float],
    weights: Mapping[str, float],
    *,
    top_n: int = 4,
) -> str:
    """
    Rank axes by |w · u · v| — large positive means both care in the same direction on that axis.

    **Why product u·v (not difference)**: cosine already captures direction; this highlights which
    axes *drove* the weighted dot product the most for this pair.
    """
    scored: list[tuple[str, float]] = []
    for k in TRAIT_AXIS_IDS:
        w = float(weights.get(k, 1.0))
        contrib = w * user[k] * item[k]
        if abs(contrib) > 1e-6:
            scored.append((k, contrib))
    scored.sort(key=lambda x: abs(x[1]), reverse=True)
    top = scored[:top_n]
    if not top:
        return "전반적으로 고르게 맞는 편이라 특정 축 하나가 크게 지배하지 않습니다. 비슷한 점수 구간에서는 인기/세부 점수 차이로 순위가 갈릴 수 있습니다."
    parts = [f"{k} ({c:+.2f})" for k, c in top]
    return "가중 기여 축 요약: " + "; ".join(parts) + "."
