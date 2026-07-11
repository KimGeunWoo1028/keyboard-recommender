"""Preference aggregation: decay, bounding, determinism."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.feedback_learning.config import FeedbackLearningMvpConfig
from keyboard_recommender.recommendation_quality.popularity_tracker.aggregates import (
    RawInteractionSignals,
    aggregate_interaction_rows,
)
from keyboard_recommender.recommendation_quality.weighting_engine.adjustments import compile_learning_adjustments


def test_temporal_decay_reduces_old_click_weight() -> None:
    # Order matches DB fetch (newest first): new-part then old-part.
    payloads = [
        {"event_type": "interaction.click", "metadata": {"itemId": "new-part"}},
        {"event_type": "interaction.click", "metadata": {"itemId": "old-part"}},
    ]
    raw_neutral = aggregate_interaction_rows(payloads, temporal_decay_per_step=1.0)
    raw_decay = aggregate_interaction_rows(payloads, temporal_decay_per_step=0.5)
    assert raw_neutral.part_clicks["old-part"] == 1.0
    assert raw_decay.part_clicks["old-part"] == 0.5
    assert raw_decay.part_clicks["new-part"] == 1.0


def test_sparse_signals_gate_trait_hints_not_multipliers() -> None:
    cfg = FeedbackLearningMvpConfig(
        min_weighted_mass_for_trait_hints=10.0,
        collection_hint_scale=1.0,
        max_trait_nudge_per_axis=0.5,
    )
    raw = aggregate_interaction_rows(
        [
            {
                "event_type": "interaction.collection_tag",
                "metadata": {"collection": "저소음 사무용"},
            },
        ],
        temporal_decay_per_step=1.0,
    )
    assert raw.weighted_mass == 1.0
    assert raw.trait_hints.get("muted", 0) > 0
    adj = compile_learning_adjustments(raw, cfg)
    # multiplier bucket empty; trait nudges scaled by gate
    assert adj.part_score_multipliers == {}
    assert all(abs(v) < 0.2 for v in adj.trait_nudges.values())
    assert adj.personalization.gated_trait_nudges is True


def test_bounded_part_multipliers() -> None:
    cfg = FeedbackLearningMvpConfig(
        max_part_multiplier=1.05,
        min_part_multiplier=0.95,
        click_score_delta=0.5,
    )
    raw = RawInteractionSignals(part_clicks={"x": 50.0})
    adj = compile_learning_adjustments(raw, cfg)
    assert 0.95 <= adj.part_score_multipliers["x"] <= 1.05


def test_comparison_left_right_ids_aggregate() -> None:
    raw = aggregate_interaction_rows(
        [
            {
                "event_type": "interaction.comparison",
                "metadata": {"leftItemId": "a", "rightItemId": "b"},
            },
        ],
        temporal_decay_per_step=1.0,
    )
    assert raw.comparison_pairs == 1.0
    assert raw.part_clicks["a"] == 0.5
    assert raw.part_clicks["b"] == 0.5


def test_determinism_same_payloads_same_adjustments() -> None:
    cfg = FeedbackLearningMvpConfig()
    payloads = [
        {"event_type": "interaction.bookmark", "metadata": {"itemId": "p1", "collection": "저소음"}},
        {"event_type": "interaction.comparison", "metadata": {"leftItemId": "p1", "rightItemId": "p2"}},
    ]
    a = compile_learning_adjustments(aggregate_interaction_rows(payloads, temporal_decay_per_step=0.99), cfg)
    b = compile_learning_adjustments(aggregate_interaction_rows(payloads, temporal_decay_per_step=0.99), cfg)
    assert a.part_score_multipliers == b.part_score_multipliers
    assert a.trait_nudges == b.trait_nudges
    assert a.diversity_ranking_strength_delta == b.diversity_ranking_strength_delta


def test_refinement_increases_diversity_delta() -> None:
    cfg = FeedbackLearningMvpConfig(refinement_diversity_strength_step=0.01, max_diversity_strength_delta=0.08)
    raw0 = aggregate_interaction_rows([], temporal_decay_per_step=1.0)
    raw1 = aggregate_interaction_rows(
        [{"event_type": "interaction.refinement", "metadata": {"traitHints": {"muted": 0.1}}}],
        temporal_decay_per_step=1.0,
    )
    a0 = compile_learning_adjustments(raw0, cfg)
    a1 = compile_learning_adjustments(raw1, cfg)
    assert a1.diversity_ranking_strength_delta >= a0.diversity_ranking_strength_delta
