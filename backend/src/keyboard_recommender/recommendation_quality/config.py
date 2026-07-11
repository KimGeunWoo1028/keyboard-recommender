"""Config-driven thresholds for recommendation quality (no scattered literals)."""

from __future__ import annotations

from dataclasses import dataclass, field

from keyboard_recommender.recommendation_quality.diversity.config import DiversityConfig
from keyboard_recommender.recommendation_quality.fallback.config import FallbackConfig


@dataclass(frozen=True, slots=True)
class IntentSignalsConfig:
    """How survey / NL / keywords move `extremes_preferred` toward allowing pair penalties to fade."""

    intensifier_boost: float = 0.14
    max_intensifier_stacking: float = 0.72
    survey_firm_bottom_out_boost: float = 0.22
    survey_bright_sound_boost: float = 0.18
    survey_clacky_sound_boost: float = 0.2
    survey_tactile_clear_boost: float = 0.12
    survey_heavy_pressure_boost: float = 0.1
    nl_extreme_term_boost: float = 0.16
    user_firm_vector_threshold: float = 2.0
    user_firm_vector_boost: float = 0.12
    user_stiff_vector_threshold: float = 2.0
    user_stiff_vector_boost: float = 0.1
    confidence_per_evidence: float = 0.11
    confidence_base: float = 0.38
    confidence_cap: float = 0.95


@dataclass(frozen=True, slots=True)
class CompatibilityRulesConfig:
    """Per-rule strength on a 0–1-ish raw penalty scale before intent + cap."""

    hard_incompatibility_penalty: float = 3.25
    stiff_plate_firm_switch: float = 0.42
    muted_foam_bright_attack: float = 0.32
    harsh_typing_stack: float = 0.36
    foam_overdamp_tactile: float = 0.28
    # Catalog traits are typically authored on a 0–10 scale in `catalog_sample`.
    part_axis_high: float = 6.75
    part_axis_very_high: float = 7.35


@dataclass(frozen=True, slots=True)
class QualityConfig:
    """Top-level knobs for phase-1 compatibility selection."""

    assembly_top_k: int = 5
    """How many top cosine hits per family participate in build search (small catalogs: cheap)."""

    penalty_strength: float = 0.55
    """How strongly effective compatibility penalty reduces the build score vs summed raw cosines."""

    max_effective_penalty: float = 0.95
    """Hard cap on *effective* total penalty after intent scaling (still soft — no rejection)."""

    intent: IntentSignalsConfig = field(default_factory=IntentSignalsConfig)
    compat_rules: CompatibilityRulesConfig = field(default_factory=CompatibilityRulesConfig)
    diversity: DiversityConfig = field(default_factory=DiversityConfig)
    fallback: FallbackConfig = field(default_factory=FallbackConfig)


def default_quality_config() -> QualityConfig:
    """Default production-ish profile; tests may construct `QualityConfig` variants."""
    return QualityConfig()
