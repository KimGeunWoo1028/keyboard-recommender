from __future__ import annotations

from keyboard_recommender.recommendation_quality.compatibility.penalties import evaluate_build_compatibility
from keyboard_recommender.recommendation_quality.config import QualityConfig, default_quality_config
from keyboard_recommender.recommendation_quality.fallback.recovery import select_build_with_fallback
from keyboard_recommender.recommendation_quality.intent.explicit_intent import ExplicitBuildIntent
from keyboard_recommender.trait_engine.matching import RankedPart
from keyboard_recommender.trait_engine.models import KeyboardPart
from tests.support.case_fixtures import case_for_layout
from tests.support.keycap_fixtures import keycap_for_layout


def _rp(part: KeyboardPart, raw: float) -> RankedPart:
    return RankedPart(part=part, score=raw, raw_cosine=raw, explanation="")


def test_hard_incompatibility_plate_layout_standard_mismatch() -> None:
    cfg = default_quality_config()
    intent = ExplicitBuildIntent(extremes_preferred=0.0, confidence=0.0, evidence=())
    switch = KeyboardPart(
        id="sw",
        name="sw",
        description="",
        family="switch",
        traits={"strong_tactile": 2.0},
        metadata={"spring_weight_g": 45},
    )
    plate = KeyboardPart(
        id="pl",
        name="pl",
        description="",
        family="plate",
        traits={"stiff": 3.0},
        metadata={
            "compatible_layout_sizes": ["60"],
            "compatible_standards": ["ansi"],
            "mounting_bias": "gasket",
            "mounting_support": ["gasket"],
            "supports_exploded": False,
        },
    )
    foam = KeyboardPart(
        id="fo",
        name="fo",
        description="",
        family="foam",
        traits={"muted": 2.0},
        metadata={"compatible_layout_sizes": ["60", "65"], "mounting_compatibility": ["gasket"]},
    )
    layout = KeyboardPart(
        id="la",
        name="la",
        description="",
        family="layout",
        traits={},
        metadata={
            "layout_size": "75",
            "ansi_iso_support": "iso",
            "supported_mounting_styles": ["gasket"],
            "is_exploded": True,
        },
    )
    audit = evaluate_build_compatibility(
        switch, plate, foam, layout, case_for_layout("75"), keycap_for_layout("75"), intent, cfg,
    )
    assert audit.has_hard_incompatibility is True
    assert audit.hard_incompatibility_count >= 1
    assert any(ln.severity == "hard_incompatibility" for ln in audit.lines)


def test_warning_only_state_for_uncommon_layout() -> None:
    cfg = default_quality_config()
    intent = ExplicitBuildIntent(extremes_preferred=0.0, confidence=0.0, evidence=())
    switch = KeyboardPart(id="sw", name="sw", description="", family="switch", traits={"strong_tactile": 1.0})
    plate = KeyboardPart(
        id="pl",
        name="pl",
        description="",
        family="plate",
        traits={"stiff": 1.0},
        metadata={"compatible_layout_sizes": ["alice"], "compatible_standards": ["ansi", "iso"]},
    )
    foam = KeyboardPart(
        id="fo",
        name="fo",
        description="",
        family="foam",
        traits={"muted": 1.0},
        metadata={"compatible_layout_sizes": ["alice"]},
    )
    layout = KeyboardPart(
        id="la",
        name="la",
        description="",
        family="layout",
        traits={},
        metadata={"layout_size": "alice", "ansi_iso_support": "ansi", "supported_mounting_styles": ["gasket"]},
    )
    audit = evaluate_build_compatibility(
        switch, plate, foam, layout, case_for_layout("alice"), keycap_for_layout("alice"), intent, cfg,
    )
    assert any(ln.state == "warning" for ln in audit.lines)


def test_selection_avoids_hard_incompatible_combo_when_possible() -> None:
    cfg = QualityConfig(assembly_top_k=2)
    intent = ExplicitBuildIntent(extremes_preferred=0.0, confidence=0.0, evidence=())

    sw = _rp(
        KeyboardPart(id="sw", name="sw", description="", family="switch", traits={"smooth": 5.0}),
        raw=0.7,
    )
    foam = _rp(
        KeyboardPart(
            id="fo",
            name="fo",
            description="",
            family="foam",
            traits={"muted": 3.0},
            metadata={"compatible_layout_sizes": ["65", "75"], "mounting_compatibility": ["gasket"]},
        ),
        raw=0.6,
    )
    layout = _rp(
        KeyboardPart(
            id="la",
            name="la",
            description="",
            family="layout",
            traits={},
            metadata={"layout_size": "65", "ansi_iso_support": "ansi", "supported_mounting_styles": ["gasket"]},
        ),
        raw=0.6,
    )
    plate_bad = _rp(
        KeyboardPart(
            id="pl-bad",
            name="pl-bad",
            description="",
            family="plate",
            traits={"stiff": 6.0},
            metadata={"compatible_layout_sizes": ["60"], "compatible_standards": ["ansi"], "mounting_bias": "gasket"},
        ),
        raw=0.95,
    )
    plate_ok = _rp(
        KeyboardPart(
            id="pl-ok",
            name="pl-ok",
            description="",
            family="plate",
            traits={"stiff": 5.0},
            metadata={"compatible_layout_sizes": ["65"], "compatible_standards": ["ansi"], "mounting_bias": "gasket"},
        ),
        raw=0.55,
    )

    case = _rp(case_for_layout("65"), raw=0.5)
    keycap = _rp(keycap_for_layout("65"), raw=0.5)

    rs, rp, rf, rl, _rc, _rk, audit, _fb = select_build_with_fallback(
        [sw],
        [plate_bad, plate_ok],
        [foam],
        [layout],
        [case],
        [keycap],
        intent,
        cfg=cfg,
    )
    assert rs.part.id == "sw"
    assert rf.part.id == "fo"
    assert rl.part.id == "la"
    assert rp.part.id == "pl-ok"
    assert audit.has_hard_incompatibility is False

