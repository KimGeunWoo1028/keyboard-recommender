"""Pure metric helpers — consume snapshot *inputs* only (no ranking side effects)."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence

from keyboard_recommender.recommendation_quality.diversity.penalties import trait_cosine_similarity
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationConfig
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS


def mean_trait_vector(part_traits: Sequence[Mapping[str, float]]) -> dict[str, float]:
    """Component-wise mean over 1..N dense trait maps (missing axis → 0)."""
    if not part_traits:
        return {k: 0.0 for k in TRAIT_AXIS_IDS}
    n = float(len(part_traits))
    out = {k: 0.0 for k in TRAIT_AXIS_IDS}
    for m in part_traits:
        for k in TRAIT_AXIS_IDS:
            out[k] += float(m.get(k, 0.0))
    for k in TRAIT_AXIS_IDS:
        out[k] /= n
    return out


def trait_alignment_score(user: Mapping[str, float], build_mean: Mapping[str, float]) -> float:
    """0–1 mean agreement; penalizes large |user−build| relative to local scale."""
    vals: list[float] = []
    for k in TRAIT_AXIS_IDS:
        u = float(user.get(k, 0.0))
        b = float(build_mean.get(k, 0.0))
        denom = max(1.0, abs(u), abs(b))
        vals.append(max(0.0, 1.0 - min(1.0, abs(u - b) / denom)))
    return round(sum(vals) / max(1, len(vals)), 6)


def build_coherence_score(part_traits: Sequence[Mapping[str, float]], cfg: EvaluationConfig) -> float:
    """
    0–1 based on low variance across winners on a compact axis subset (sound + feel drivers).
    """
    axes = (
        "deep_sound",
        "high_pitch",
        "muted",
        "smooth",
        "strong_tactile",
        "firm_bottom_out",
        "soft_bottom_out",
    )
    if len(part_traits) < 2:
        return 1.0
    stds: list[float] = []
    for ax in axes:
        xs = [float(p.get(ax, 0.0)) for p in part_traits]
        m = sum(xs) / len(xs)
        var = sum((x - m) ** 2 for x in xs) / len(xs)
        stds.append(math.sqrt(var))
    mean_std = sum(stds) / len(stds)
    return round(max(0.0, min(1.0, 1.0 - mean_std / max(1e-6, cfg.build_coherence_axis_std_ref))), 6)


def compatibility_stability_score(effective_penalty: float, cfg: EvaluationConfig) -> float:
    """0–1 where 1 means negligible effective compatibility penalty."""
    ref = max(1e-6, float(cfg.max_effective_compat_penalty_ref))
    return round(max(0.0, min(1.0, 1.0 - max(0.0, float(effective_penalty)) / ref)), 6)


def diversity_intervention_score(diversity_families: Sequence[Mapping[str, object]] | None) -> float:
    """0–1 fraction of families whose reranked id list differs from the cosine-only order."""
    if not diversity_families:
        return 0.0
    changed = 0
    n = len(diversity_families)
    for fam in diversity_families:
        o = fam.get("originalOrderIds") or fam.get("original_order_ids")
        r = fam.get("rerankedOrderIds") or fam.get("reranked_order_ids")
        if isinstance(o, list) and isinstance(r, list) and o != r:
            changed += 1
    return round(changed / max(1, n), 6)


def winner_trait_diversity_score(part_traits: Sequence[Mapping[str, float]]) -> float:
    """0–1 mean pairwise (1 − cosine similarity) across unique part pairs among winners."""
    pts = list(part_traits)
    if len(pts) < 2:
        return 0.0
    pairs: list[float] = []
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            sim = trait_cosine_similarity(pts[i], pts[j])
            pairs.append(1.0 - sim)
    return round(sum(pairs) / len(pairs), 6)
