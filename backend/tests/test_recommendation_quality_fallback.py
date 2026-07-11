"""Fallback recovery: incremental compatibility relaxation for selection + confidence."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.build_selection import pick_build_with_compatibility
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.recommendation_quality.fallback.config import FallbackConfig
from keyboard_recommender.recommendation_quality.fallback.recovery import select_build_with_fallback
from keyboard_recommender.recommendation_quality.intent.explicit_intent import infer_explicit_build_intent
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.catalog_sample import CASES, FOAM, KEYCAPS, LAYOUTS, PLATES, SWITCHES
from keyboard_recommender.trait_engine.matching import rank_parts
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import from_sparse
from keyboard_recommender.trait_engine.weights import (
    weights_for_case,
    weights_for_foam,
    weights_for_keycap,
    weights_for_layout,
    weights_for_plate,
    weights_for_switch,
)


def _placeholder_keycap() -> KeyboardPart:
    return KeyboardPart(
        id="keycap-placeholder-universal",
        name="Universal keycap set",
        description="",
        family="keycap",
        traits=from_sparse({"muted": 5, "deep_sound": 5, "high_pitch": 4, "poppy": 4}),
        popularity_weight=1.0,
        metadata={
            "profile": "cherry",
            "material": "PBT",
            "manufacturing": "dye_sub",
            "kit_scope": "base",
            "compatible_layout_sizes": [],
            "colorway_mood": "neutral",
        },
    )


def test_fallback_disabled_skips_recovery_audit_tier() -> None:
    cfg = QualityConfig(
        assembly_top_k=3,
        fallback=FallbackConfig(enabled=False),
    )
    user = {k: 0.0 for k in TRAIT_AXIS_IDS}
    user["deep_sound"] = 1.0
    *_, fb, conf = pick_build_with_compatibility(
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
    assert fb.tier == 0
    assert fb.notes[0] == "fallback_hook:disabled"
    assert conf.overall > 0.0


def test_forced_low_confidence_triggers_recovery_tier_or_notes() -> None:
    """Impossibly strict gate should force at least one relaxation step to be considered."""
    cfg = QualityConfig(
        assembly_top_k=3,
        fallback=FallbackConfig(
            enabled=True,
            min_overall_confidence=0.99,
            min_mean_raw_cosine=10.0,
            relax_compatibility_steps=(0.5, 0.25),
            diversity_strength_relax_factors=(0.5, 0.25),
        ),
    )
    user = {k: 0.0 for k in TRAIT_AXIS_IDS}
    user["deep_sound"] = 1.0
    survey = {
        "sound_profile": "balanced",
        "typing_pressure": "medium",
        "switch_feel": "linear",
        "bottom_out": "medium",
        "volume": "moderate",
    }
    *_, fb, conf = pick_build_with_compatibility(user, survey_answers=survey, cfg=cfg)
    assert fb.tier >= 0
    assert "fallback_hook:compatibility_relax_for_selection" in fb.notes
    assert conf.label in ("high", "balanced", "experimental")


def test_select_build_with_fallback_deterministic() -> None:
    user = {k: 0.0 for k in TRAIT_AXIS_IDS}
    user["deep_sound"] = 2.0
    intent = infer_explicit_build_intent(user, None, None, None, QualityConfig())
    sw = rank_parts(user, SWITCHES, weights_for_switch(), top_k=3)
    pl = rank_parts(user, PLATES, weights_for_plate(), top_k=3)
    fo = rank_parts(user, FOAM, weights_for_foam(), top_k=3)
    la = rank_parts(user, LAYOUTS, weights_for_layout(), top_k=3)
    ca = rank_parts(user, CASES, weights_for_case(), top_k=3)
    keycap_pool = KEYCAPS if KEYCAPS else [_placeholder_keycap()]
    kc = rank_parts(user, keycap_pool, weights_for_keycap(), top_k=3)
    cfg = QualityConfig(fallback=FallbackConfig(min_overall_confidence=0.99))
    a1 = select_build_with_fallback(sw, pl, fo, la, ca, kc, intent, cfg=cfg)
    a2 = select_build_with_fallback(sw, pl, fo, la, ca, kc, intent, cfg=cfg)
    assert a1[0].part.id == a2[0].part.id
    assert a1[7].tier == a2[7].tier
