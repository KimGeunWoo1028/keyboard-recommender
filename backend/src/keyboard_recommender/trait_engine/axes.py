"""
Canonical trait axes for the v2 engine.

Design:
- **Single ordered tuple** `TRAIT_AXIS_IDS` — add axes here; matching and catalog rows
  must supply the same keys (missing → 0).
- **Extensibility**: new axes are backward-compatible at the data layer (sparse dicts).
  Downstream UI may subset or group axes without changing the core matcher.
"""

from __future__ import annotations

TRAIT_AXIS_IDS: tuple[str, ...] = (
    "deep_sound",
    "high_pitch",
    "muted",
    "poppy",
    "marbly",
    "smooth",
    "scratchy",
    "soft_bottom_out",
    "firm_bottom_out",
    "flexible",
    "stiff",
    "strong_tactile",
    "light_typing_force",
)

AXIS_INDEX: dict[str, int] = {k: i for i, k in enumerate(TRAIT_AXIS_IDS)}


def axis_count() -> int:
    return len(TRAIT_AXIS_IDS)
