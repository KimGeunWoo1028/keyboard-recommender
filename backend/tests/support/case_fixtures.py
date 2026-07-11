"""Shared keyboard parts for compatibility/fallback tests (6-axis builds)."""

from __future__ import annotations

from keyboard_recommender.trait_engine.models import KeyboardPart


def case_for_layout(
    layout_size: str = "65",
    *,
    mounting_style: str = "gasket",
    part_id: str = "ca",
) -> KeyboardPart:
    return KeyboardPart(
        id=part_id,
        name=part_id,
        description="",
        family="case",
        traits={"stiff": 3.0, "flexible": 2.0},
        metadata={
            "kit_type": "kit",
            "layout_size": layout_size,
            "mounting_style": mounting_style,
            "ansi_iso_support": "both",
            "includes_pcb": True,
            "includes_plate": True,
            "includes_foam": False,
            "includes_switches": False,
            "includes_keycaps": False,
            "weight_class": "balanced",
            "acoustic_character": "balanced",
        },
    )
