"""
Detect when users likely *want* extreme trait stacks so compatibility penalties shrink.

Signals are intentionally simple (beginner-friendly) and easy to extend with NLP later.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from keyboard_recommender.recommendation_quality.config import QualityConfig

_INTENSIFIERS: frozenset[str] = frozenset(
    {"very", "extremely", "super", "ultra", "insanely", "hyper", "max", "mega"},
)
# Terminology ids that imply the user is playing in "extreme expression" space.
_EXTREME_FLAVOR_TERM_IDS: frozenset[str] = frozenset(
    {
        "clacky",
        "sound_bright",
        "sound_deep",
        "thocky",
        "muted",
        "feel_tactile",
        "texture_scratchy",
    },
)


@dataclass(frozen=True, slots=True)
class ExplicitBuildIntent:
    """
    `extremes_preferred` ∈ [0,1]: higher → compatibility penalties are scaled down more.
    `confidence` ∈ [0,1]: how strongly we believe the intent signals (gates the scale-down).
    """

    extremes_preferred: float
    confidence: float
    evidence: tuple[str, ...]


def _tokenize_norm(text: str) -> list[str]:
    return [t for t in text.lower().split() if t]


def infer_explicit_build_intent(
    user_trait_scores: Mapping[str, float],
    survey_answers: Mapping[str, str] | None,
    nl_normalized_text: str | None,
    nl_matched_term_ids: tuple[str, ...] | None,
    cfg: QualityConfig,
) -> ExplicitBuildIntent:
    """Aggregate explicit-intent evidence from survey, NL text, NL term hits, and strong user-vector peaks."""
    sig = cfg.intent
    ep = 0.0
    evidence: list[str] = []

    if nl_normalized_text:
        toks = _tokenize_norm(nl_normalized_text)
        n_int = sum(1 for t in toks if t in _INTENSIFIERS)
        if n_int:
            bump = min(sig.max_intensifier_stacking, float(n_int) * sig.intensifier_boost)
            ep += bump
            evidence.append(f"nl_intensifiers:{n_int}")

    if nl_matched_term_ids:
        extreme_hits = [t for t in nl_matched_term_ids if t in _EXTREME_FLAVOR_TERM_IDS]
        if extreme_hits:
            bump = min(0.55, float(len(extreme_hits)) * sig.nl_extreme_term_boost)
            ep += bump
            evidence.append(f"nl_extreme_terms:{','.join(extreme_hits[:6])}")

    if survey_answers:
        bo = survey_answers.get("bottom_out", "")
        if bo == "firm":
            ep += sig.survey_firm_bottom_out_boost
            evidence.append("survey:bottom_out=firm")
        sp = survey_answers.get("sound_profile", "")
        if sp in ("bright", "clacky"):
            ep += sig.survey_bright_sound_boost if sp == "bright" else sig.survey_clacky_sound_boost
            evidence.append(f"survey:sound_profile={sp}")
        sf = survey_answers.get("switch_feel", "")
        if sf == "tactile_clear":
            ep += sig.survey_tactile_clear_boost
            evidence.append("survey:switch_feel=tactile_clear")
        tp = survey_answers.get("typing_pressure", "")
        if tp == "heavy":
            ep += sig.survey_heavy_pressure_boost
            evidence.append("survey:typing_pressure=heavy")

    firm_u = float(user_trait_scores.get("firm_bottom_out", 0.0))
    if firm_u >= sig.user_firm_vector_threshold:
        ep += sig.user_firm_vector_boost
        evidence.append(f"user_vector:firm_bottom_out>={sig.user_firm_vector_threshold}")
    stiff_u = float(user_trait_scores.get("stiff", 0.0))
    if stiff_u >= sig.user_stiff_vector_threshold:
        ep += sig.user_stiff_vector_boost
        evidence.append(f"user_vector:stiff>={sig.user_stiff_vector_threshold}")

    ep = max(0.0, min(1.0, ep))
    conf = min(
        sig.confidence_cap,
        sig.confidence_base + float(len(evidence)) * sig.confidence_per_evidence,
    )
    if not evidence:
        conf = 0.0

    return ExplicitBuildIntent(extremes_preferred=ep, confidence=conf, evidence=tuple(evidence))
