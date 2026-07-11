"""Diversity reranking: greedy per-family lists with rank-1 fixed."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.diversity.config import DiversityConfig
from keyboard_recommender.recommendation_quality.diversity.rerank import rerank_family_lists
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.recommendation_quality.build_selection import pick_build_with_compatibility
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.matching import RankedPart
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import from_sparse


def _rp(part_id: str, traits: dict[str, float | int], raw: float, family: str = "switch") -> RankedPart:
    p = KeyboardPart(
        id=part_id,
        name=part_id,
        description="",
        family=family,
        traits=from_sparse(traits),
    )
    return RankedPart(part=p, score=raw * 1.0, raw_cosine=raw, explanation="")


def _six_lists(ranked: list[RankedPart], winner: RankedPart) -> tuple:
    winners = (winner, winner, winner, winner, winner, winner)
    lists = (ranked, ranked, ranked, ranked, ranked, ranked)
    return winners, lists


def test_rerank_preserves_winner_first() -> None:
    winner = _rp(
        "sw-winner",
        {"deep_sound": 8, "smooth": 8, "muted": 2, "high_pitch": 2},
        0.55,
    )
    near_dup = _rp(
        "sw-near",
        {"deep_sound": 8, "smooth": 8, "muted": 2, "high_pitch": 2},
        0.54,
    )
    different = _rp(
        "sw-diff",
        {"strong_tactile": 9, "scratchy": 6, "firm_bottom_out": 7, "high_pitch": 5},
        0.53,
    )
    ranked = [winner, near_dup, different]
    div = DiversityConfig(
        enabled=True,
        ranking_strength=0.9,
        trait_similarity_weight=1.2,
        same_id_prefix_weight=0.0,
        dominant_signature_weight=0.35,
    )
    sw_out, _, _, _, _, _, audit = rerank_family_lists(*_six_lists(ranked, winner), div)
    assert audit is not None
    assert sw_out[0].part.id == "sw-winner"


def test_rerank_is_deterministic() -> None:
    winner = _rp("a", {"deep_sound": 9}, 0.6)
    b = _rp("b", {"deep_sound": 8}, 0.59)
    c = _rp("c", {"muted": 9}, 0.58)
    ranked = [winner, b, c]
    div = DiversityConfig(enabled=True, ranking_strength=0.5)
    out1, _, _, _, _, _, _ = rerank_family_lists(*_six_lists(ranked, winner), div)
    out2, _, _, _, _, _, _ = rerank_family_lists(*_six_lists(ranked, winner), div)
    assert [r.part.id for r in out1] == [r.part.id for r in out2]


def test_diversity_disabled_returns_none_audit() -> None:
    winner = _rp("a", {"deep_sound": 5}, 0.4)
    b = _rp("b", {"deep_sound": 4}, 0.39)
    ranked = [winner, b]
    div = DiversityConfig(enabled=False)
    out, _, _, _, _, _, audit = rerank_family_lists(*_six_lists(ranked, winner), div)
    assert audit is None
    assert [r.part.id for r in out] == [r.part.id for r in ranked]


def test_pick_build_diversity_disabled_via_quality_config() -> None:
    cfg = QualityConfig(assembly_top_k=3, diversity=DiversityConfig(enabled=False))
    user = {k: 0.0 for k in TRAIT_AXIS_IDS}
    user["deep_sound"] = 1.0
    *_, _audit, div_audit, _fb, _conf = pick_build_with_compatibility(
        user,
        survey_answers={
            "sound_profile": "balanced",
            "typing_pressure": "medium",
            "switch_feel": "linear",
            "bottom_out": "medium",
            "volume": "moderate",
        },
        cfg=cfg,
    )
    assert div_audit is None


def test_similar_secondaries_reordered_when_strength_high() -> None:
    """With a strong trait-similarity penalty, a near-duplicate should not always stay at rank 2."""
    winner = _rp("w", {"deep_sound": 9, "smooth": 9, "muted": 1}, 0.9)
    dup = _rp("d1", {"deep_sound": 9, "smooth": 9, "muted": 1}, 0.89)
    alt = _rp("a1", {"strong_tactile": 9, "firm_bottom_out": 8, "scratchy": 5}, 0.88)
    ranked = [winner, dup, alt]
    div = DiversityConfig(
        enabled=True,
        ranking_strength=1.25,
        trait_similarity_weight=1.5,
        dominant_signature_weight=0.5,
    )
    out, _, _, _, _, _, audit = rerank_family_lists(*_six_lists(ranked, winner), div)
    assert audit is not None
    assert out[0].part.id == "w"
    # Pure cosine order was w, d1, a1 — diversity should not keep d1 at rank 2 when it is almost identical to w.
    assert [r.part.id for r in out] != ["w", "d1", "a1"]
