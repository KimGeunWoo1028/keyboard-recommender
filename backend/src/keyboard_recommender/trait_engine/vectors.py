"""Dense trait vectors, normalization, and sparse→dense conversion."""

from __future__ import annotations

import math
from typing import Mapping

from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS


def empty_vector() -> dict[str, float]:
    return {k: 0.0 for k in TRAIT_AXIS_IDS}


def from_sparse(raw: Mapping[str, float | int]) -> dict[str, float]:
    v = empty_vector()
    for k in TRAIT_AXIS_IDS:
        if k in raw:
            v[k] = float(raw[k])
    return v


def add_scaled(a: dict[str, float], b: Mapping[str, float], scale: float = 1.0) -> dict[str, float]:
    out = dict(a)
    for k in TRAIT_AXIS_IDS:
        out[k] = out[k] + float(b.get(k, 0.0)) * scale
    return out


def l2_norm_weighted(v: dict[str, float], weights: Mapping[str, float]) -> float:
    s = 0.0
    for k in TRAIT_AXIS_IDS:
        w = float(weights.get(k, 1.0))
        s += w * v[k] * v[k]
    return math.sqrt(s) if s > 0 else 0.0


def weighted_cosine_similarity(
    user: dict[str, float],
    item: dict[str, float],
    weights: Mapping[str, float],
) -> float:
    """
    cos_w(u, v) = (Σ w_i u_i v_i) / (||u||_w · ||v||_w)
    where ||x||_w = sqrt(Σ w_i x_i^2).

    **Why weighted cosine**: same as cosine on vectors (√w_i·u_i, √w_i·v_i); lets you
    emphasize axes (e.g. bottom-out feel for plates) without re-normalizing catalog data.
    """
    dot = 0.0
    for k in TRAIT_AXIS_IDS:
        w = float(weights.get(k, 1.0))
        dot += w * user[k] * item[k]
    nu = l2_norm_weighted(user, weights)
    nv = l2_norm_weighted(item, weights)
    if nu == 0 or nv == 0:
        return 0.0
    return dot / (nu * nv)


def min_max_normalize_inplace(v: dict[str, float]) -> dict[str, float]:
    """Optional [0,1] squash per request sample — not used in cosine path; kept for future calibration."""
    vals = [v[k] for k in TRAIT_AXIS_IDS]
    lo, hi = min(vals), max(vals)
    if hi - lo < 1e-9:
        return dict(v)
    return {k: (v[k] - lo) / (hi - lo) for k in TRAIT_AXIS_IDS}
