"""
Greedy diversity reranking for per-family ranked lists.

Pseudocode
----------
1. Fix winner `w` as rank 1 (the build-selected part).
2. `pool` = other candidates in original cosine order (stable tie-break: higher raw_cosine first, then id).
3. `out = [w]`
4. Repeat until `pool` empty:
     pick `c` in `pool` maximizing
         score(c) = c.raw_cosine - strength * diversity_penalty(c, out)
     append `c` to `out`, remove from `pool`
5. Return `out` (same length as input).

Rank-1 never moves; lower ranks trade small cosine drops for lower similarity to items above.
"""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.diversity.config import DiversityConfig
from keyboard_recommender.recommendation_quality.diversity.penalties import diversity_penalty_to_chosen
from keyboard_recommender.recommendation_quality.diversity.types import DiversityFamilyAudit, DiversityRerankAudit
from keyboard_recommender.trait_engine.matching import RankedPart


def _greedy_rerank_one_family(
    ranked: list[RankedPart],
    winner: RankedPart,
    family: str,
    div: DiversityConfig,
) -> tuple[list[RankedPart], DiversityFamilyAudit]:
    if not ranked:
        return ranked, DiversityFamilyAudit(family, (), (), ("empty_input",))

    orig_ids = tuple(r.part.id for r in ranked)
    by_id = {r.part.id: r for r in ranked}
    w = by_id.get(winner.part.id, ranked[0])
    pool = [r for r in ranked if r.part.id != w.part.id]
    # Deterministic pool order: cosine desc, then id asc
    pool.sort(key=lambda r: (-r.raw_cosine, r.part.id))

    out: list[RankedPart] = [w]
    chosen_parts = [w.part]
    notes: list[str] = []

    first_pick = True
    while pool:
        best: RankedPart | None = None
        best_key: tuple[float, float, str] | None = None
        for cand in pool:
            pen = diversity_penalty_to_chosen(
                cand.part,
                chosen_parts,
                trait_weight=div.trait_similarity_weight,
                prefix_weight=div.same_id_prefix_weight,
                signature_weight=div.dominant_signature_weight,
            )
            adj = float(cand.raw_cosine) - float(div.ranking_strength) * pen
            key = (adj, float(cand.raw_cosine), cand.part.id)
            if best is None or (best_key is not None and key > best_key):
                best = cand
                best_key = key
        assert best is not None and best_key is not None
        if first_pick:
            notes.append("diversity_hook:rank2_trait_distance_to_winner")
            first_pick = False
        out.append(best)
        chosen_parts.append(best.part)
        pool = [r for r in pool if r.part.id != best.part.id]

    rerank_ids = tuple(r.part.id for r in out)
    if orig_ids != rerank_ids:
        notes.append("diversity_reorder:applied")
    else:
        notes.append("diversity_reorder:no_change")

    return out, DiversityFamilyAudit(
        family=family,
        original_order_ids=orig_ids,
        reranked_order_ids=rerank_ids,
        notes=tuple(notes),
    )


def rerank_family_lists(
    winners: tuple[RankedPart, RankedPart, RankedPart, RankedPart, RankedPart, RankedPart],
    ranked: tuple[
        list[RankedPart],
        list[RankedPart],
        list[RankedPart],
        list[RankedPart],
        list[RankedPart],
        list[RankedPart],
    ],
    diversity: DiversityConfig,
) -> tuple[
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    list[RankedPart],
    DiversityRerankAudit | None,
]:
    """
    Rerank each family's cosine list using the corresponding winning part as anchor.

    When `diversity.enabled` is false, returns the input lists unchanged and `None` audit.
    """
    if not diversity.enabled:
        return ranked[0], ranked[1], ranked[2], ranked[3], ranked[4], ranked[5], None

    ws, wp, wf, wl, wc, wk = winners
    sw, pl, fo, la, ca, kc = ranked

    sw2, aud_sw = _greedy_rerank_one_family(sw, ws, "switch", diversity)
    pl2, aud_pl = _greedy_rerank_one_family(pl, wp, "plate", diversity)
    fo2, aud_fo = _greedy_rerank_one_family(fo, wf, "foam", diversity)
    la2, aud_la = _greedy_rerank_one_family(la, wl, "layout", diversity)
    ca2, aud_ca = _greedy_rerank_one_family(ca, wc, "case", diversity)
    kc2, aud_kc = _greedy_rerank_one_family(kc, wk, "keycap", diversity)

    audit = DiversityRerankAudit(families=(aud_sw, aud_pl, aud_fo, aud_la, aud_ca, aud_kc))
    return sw2, pl2, fo2, la2, ca2, kc2, audit
