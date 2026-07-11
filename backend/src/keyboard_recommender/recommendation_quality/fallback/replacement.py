"""Selection-score helpers (compatibility relaxation for ranking only)."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.trait_engine.matching import RankedPart


def selection_score(
    rs: RankedPart,
    rp: RankedPart,
    rf: RankedPart,
    rl: RankedPart,
    rc: RankedPart,
    rk: RankedPart,
    audit: BuildCompatibilityAudit,
    *,
    penalty_strength: float,
    compatibility_relax_mult: float,
) -> float:
    """
    Higher is better. `compatibility_relax_mult` scales only the influence of penalties on selection.

    The audit itself remains the true (unrelaxed) compatibility breakdown for the chosen build.
    """
    relevance = float(
        rs.raw_cosine + rp.raw_cosine + rf.raw_cosine + rl.raw_cosine + rc.raw_cosine + rk.raw_cosine
    )
    pen = float(audit.effective_penalty_total) * float(compatibility_relax_mult)
    return relevance - float(penalty_strength) * pen


def mean_raw_cosine_sext(
    rs: RankedPart,
    rp: RankedPart,
    rf: RankedPart,
    rl: RankedPart,
    rc: RankedPart,
    rk: RankedPart,
) -> float:
    return float(
        rs.raw_cosine + rp.raw_cosine + rf.raw_cosine + rl.raw_cosine + rc.raw_cosine + rk.raw_cosine
    ) / 6.0


# Backward-compatible aliases for tests referencing older helper names.
mean_raw_cosine_quint = mean_raw_cosine_sext
mean_raw_cosine_quad = mean_raw_cosine_sext
