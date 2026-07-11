"""Tunable knobs for the rule-based feedback MVP (no ML)."""

from __future__ import annotations

from dataclasses import dataclass

from keyboard_recommender.config.settings import Settings


@dataclass(frozen=True, slots=True)
class FeedbackLearningMvpConfig:
    """All deltas are small; multipliers are clamped for stability."""

    max_events: int = 400
    temporal_decay_per_step: float = 0.997
    min_weighted_mass_for_trait_hints: float = 2.5
    collection_hint_scale: float = 0.22
    acceptance_extra_boost: float = 0.006
    rejection_extra_penalty: float = 0.006
    refinement_diversity_strength_step: float = 0.002
    tactile_uncertainty_min_comparisons: float = 3.0
    tactile_uncertainty_min_family_clicks: float = 1.25
    tactile_uncertainty_nudge: float = 0.035
    click_score_delta: float = 0.012
    save_score_delta: float = 0.022
    comparison_score_delta: float = 0.008
    dislike_score_delta: float = 0.028
    max_part_multiplier: float = 1.1
    min_part_multiplier: float = 0.9
    max_trait_nudge_per_axis: float = 0.12
    family_click_axis_scale: float = 0.02
    diversity_strength_per_comparison_event: float = 0.0025
    max_diversity_strength_delta: float = 0.05


def feedback_learning_config_from_settings(settings: Settings) -> FeedbackLearningMvpConfig:
    return FeedbackLearningMvpConfig(
        max_events=settings.feedback_learning_max_events,
        temporal_decay_per_step=settings.feedback_learning_temporal_decay_per_step,
        min_weighted_mass_for_trait_hints=settings.feedback_learning_min_weighted_mass,
        collection_hint_scale=settings.feedback_learning_collection_hint_scale,
        acceptance_extra_boost=settings.feedback_learning_acceptance_extra_boost,
        rejection_extra_penalty=settings.feedback_learning_rejection_extra_penalty,
        refinement_diversity_strength_step=settings.feedback_learning_refinement_diversity_step,
        tactile_uncertainty_min_comparisons=settings.feedback_learning_tactile_uncertainty_min_comparisons,
        tactile_uncertainty_min_family_clicks=settings.feedback_learning_tactile_uncertainty_min_family,
        tactile_uncertainty_nudge=settings.feedback_learning_tactile_uncertainty_nudge,
        click_score_delta=settings.feedback_learning_click_boost,
        save_score_delta=settings.feedback_learning_save_boost,
        comparison_score_delta=settings.feedback_learning_comparison_boost,
        dislike_score_delta=settings.feedback_learning_dislike_penalty,
        max_part_multiplier=settings.feedback_learning_max_part_mult,
        min_part_multiplier=settings.feedback_learning_min_part_mult,
        max_trait_nudge_per_axis=settings.feedback_learning_trait_nudge_cap,
        family_click_axis_scale=settings.feedback_learning_family_axis_scale,
        diversity_strength_per_comparison_event=settings.feedback_learning_diversity_step,
        max_diversity_strength_delta=settings.feedback_learning_diversity_cap_delta,
    )
