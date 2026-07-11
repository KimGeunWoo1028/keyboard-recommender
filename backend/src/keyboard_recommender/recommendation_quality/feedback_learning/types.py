"""Shared datatypes for the feedback MVP."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PersonalizationMetrics:
    """Small, JSON-serializable rollup for analytics (deterministic; no PII)."""

    window_events: int = 0
    weighted_mass: float = 0.0
    temporal_decay: float = 1.0
    trait_gate_factor: float = 1.0
    refinement_events: float = 0.0
    gated_trait_nudges: bool = False
    trait_nudge_l1: float = 0.0
    part_multiplier_spread: float = 0.0
    # (event_type, weighted_count)
    signal_mix: tuple[tuple[str, float], ...] = ()


@dataclass(frozen=True, slots=True)
class LearningAdjustments:
    """Immutable bundle applied by ``pick_build_with_compatibility`` / ``rank_parts``."""

    part_score_multipliers: dict[str, float]
    trait_nudges: dict[str, float]
    weight_overlay_switch: dict[str, float]
    weight_overlay_plate: dict[str, float]
    weight_overlay_foam: dict[str, float]
    weight_overlay_layout: dict[str, float]
    diversity_ranking_strength_delta: float
    explanation_lines: tuple[str, ...]
    personalization: PersonalizationMetrics
