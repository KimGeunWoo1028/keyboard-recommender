"""Phase-1 recommendation quality: compatibility penalties + explicit intent gating."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.build_selection import pick_build_with_compatibility
from keyboard_recommender.recommendation_quality.compatibility.penalties import (
    compatibility_intent_multiplier,
    evaluate_build_compatibility,
)
from keyboard_recommender.recommendation_quality.config import QualityConfig, default_quality_config
from keyboard_recommender.recommendation_quality.intent.explicit_intent import (
    ExplicitBuildIntent,
    infer_explicit_build_intent,
)
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import from_sparse
from tests.support.case_fixtures import case_for_layout
from tests.support.keycap_fixtures import keycap_for_layout


def test_intent_multiplier_full_penalty_without_confidence() -> None:
    intent = ExplicitBuildIntent(extremes_preferred=0.9, confidence=0.0, evidence=())
    assert compatibility_intent_multiplier(intent) == 1.0


def test_intent_multiplier_reduces_with_explicit_extremes() -> None:
    intent = ExplicitBuildIntent(extremes_preferred=1.0, confidence=1.0, evidence=("x",))
    assert compatibility_intent_multiplier(intent) == 0.0


def test_infer_intent_boosts_from_nl_intensifiers() -> None:
    cfg = default_quality_config()
    u = {k: 0.0 for k in ("firm_bottom_out", "stiff")}
    intent = infer_explicit_build_intent(
        u,
        survey_answers=None,
        nl_normalized_text="i want extremely clacky super bright",
        nl_matched_term_ids=None,
        cfg=cfg,
    )
    assert intent.extremes_preferred > 0.2
    assert intent.confidence > 0.0


def test_stiff_plate_firm_switch_rule_nonzero() -> None:
    cfg = default_quality_config()
    switch = KeyboardPart(
        id="sw-x",
        name="X",
        description="",
        family="switch",
        traits=from_sparse({"firm_bottom_out": 9, "scratchy": 2}),
    )
    plate = KeyboardPart(
        id="pl-x",
        name="Y",
        description="",
        family="plate",
        traits=from_sparse({"stiff": 9}),
    )
    foam = KeyboardPart(
        id="fo-x",
        name="Z",
        description="",
        family="foam",
        traits=from_sparse({"muted": 3}),
    )
    layout = KeyboardPart(
        id="la-x",
        name="L",
        description="",
        family="layout",
        traits=from_sparse({}),
    )
    low = ExplicitBuildIntent(0.0, 0.0, ())
    high = ExplicitBuildIntent(1.0, 1.0, ("forced",))

    a_low = evaluate_build_compatibility(
        switch, plate, foam, layout, case_for_layout("75"), keycap_for_layout("75"), low, cfg,
    )
    a_high = evaluate_build_compatibility(
        switch, plate, foam, layout, case_for_layout("75"), keycap_for_layout("75"), high, cfg,
    )

    assert any(line.rule_id == "stiff_plate_firm_switch" for line in a_low.lines)
    assert a_low.effective_penalty_total > a_high.effective_penalty_total


def test_pick_build_with_compatibility_runs_on_sample_catalog() -> None:
    cfg = QualityConfig(assembly_top_k=3)
    user = {k: 0.0 for k in TRAIT_AXIS_IDS}
    user["deep_sound"] = 2.0
    user["strong_tactile"] = 2.0
    ts, tp, tf, tl, tc, tk, *_rest, audit, div_audit, _fb, _conf = pick_build_with_compatibility(
        user,
        survey_answers={
            "sound_profile": "balanced",
            "typing_pressure": "medium",
            "switch_feel": "linear",
            "bottom_out": "medium",
            "volume": "moderate",
        },
        nl_normalized_text=None,
        nl_matched_term_ids=None,
        cfg=cfg,
    )
    assert ts.part.family == "switch"
    assert audit is not None
    assert audit.intent_multiplier >= 0.0
    assert div_audit is not None
    assert tc.part.family == "case"
    assert tk.part.family == "keycap"
    assert len(div_audit.families) == 6
