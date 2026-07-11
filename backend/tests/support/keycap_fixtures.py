"""Shared keyboard parts for keycap compatibility tests (6-axis builds)."""

from __future__ import annotations

from keyboard_recommender.trait_engine.models import KeyboardPart


def keycap_for_layout(
    layout_size: str = "65",
    *,
    kit_scope: str = "base",
    part_id: str = "kc",
    compatible_layout_sizes: list[str] | None = None,
) -> KeyboardPart:
    sizes = compatible_layout_sizes if compatible_layout_sizes is not None else [layout_size]
    return KeyboardPart(
        id=part_id,
        name=part_id,
        description="",
        family="keycap",
        traits={"muted": 5.0, "deep_sound": 4.0, "high_pitch": 3.0, "poppy": 3.0},
        metadata={
            "profile": "cherry",
            "material": "PBT",
            "manufacturing": "dye_sub",
            "kit_scope": kit_scope,
            "compatible_layout_sizes": sizes,
            "colorway_mood": "neutral",
        },
    )
