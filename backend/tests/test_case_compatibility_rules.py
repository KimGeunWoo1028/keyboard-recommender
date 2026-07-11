"""Case ↔ layout compatibility rules (roadmap ⑫)."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.compatibility.penalties import evaluate_build_compatibility
from keyboard_recommender.recommendation_quality.config import default_quality_config
from keyboard_recommender.recommendation_quality.intent.explicit_intent import ExplicitBuildIntent
from keyboard_recommender.trait_engine.models import KeyboardPart
from tests.support.case_fixtures import case_for_layout
from tests.support.keycap_fixtures import keycap_for_layout


def _minimal_build(*, layout_size: str = "65", case_size: str = "65") -> tuple:
    switch = KeyboardPart(id="sw", name="sw", description="", family="switch", traits={})
    plate = KeyboardPart(
        id="pl",
        name="pl",
        description="",
        family="plate",
        traits={},
        metadata={"compatible_layout_sizes": [layout_size], "compatible_standards": ["ansi"], "mounting_bias": "gasket"},
    )
    foam = KeyboardPart(
        id="fo",
        name="fo",
        description="",
        family="foam",
        traits={},
        metadata={"compatible_layout_sizes": [layout_size], "mounting_compatibility": ["gasket"]},
    )
    layout = KeyboardPart(
        id="la",
        name="la",
        description="",
        family="layout",
        traits={},
        metadata={"layout_size": layout_size, "ansi_iso_support": "ansi", "supported_mounting_styles": ["gasket"]},
    )
    case = case_for_layout(case_size)
    keycap = keycap_for_layout(layout_size)
    return switch, plate, foam, layout, case, keycap


def test_case_layout_size_mismatch_is_hard_incompatibility() -> None:
    cfg = default_quality_config()
    intent = ExplicitBuildIntent(extremes_preferred=0.0, confidence=0.0, evidence=())
    sw, pl, fo, la, ca, kc = _minimal_build(layout_size="65", case_size="75")
    audit = evaluate_build_compatibility(sw, pl, fo, la, ca, kc, intent, cfg)
    assert any(ln.rule_id == "case_layout_size_mismatch" for ln in audit.lines)
    assert audit.has_hard_incompatibility is True


def test_matching_case_layout_passes_size_rule() -> None:
    cfg = default_quality_config()
    intent = ExplicitBuildIntent(extremes_preferred=0.0, confidence=0.0, evidence=())
    sw, pl, fo, la, ca, kc = _minimal_build(layout_size="65", case_size="65")
    audit = evaluate_build_compatibility(sw, pl, fo, la, ca, kc, intent, cfg)
    assert not any(ln.rule_id == "case_layout_size_mismatch" for ln in audit.lines)
