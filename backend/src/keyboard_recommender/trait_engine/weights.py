"""
Per-axis weights for similarity — tune without touching catalog rows.

Design:
- **Defaults 1.0** — pure cosine when weights uniform.
- **Family-specific profiles** — e.g. plates emphasize `stiff`/`flexible`; foam emphasizes `muted`/`soft_bottom_out`.
  Passed into `rank_components` so one catalog stays multi-purpose.
"""

from __future__ import annotations

from typing import Mapping

from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS

_DEFAULT: dict[str, float] = {k: 1.0 for k in TRAIT_AXIS_IDS}


def merge_weights(base: Mapping[str, float] | None, overrides: Mapping[str, float] | None) -> dict[str, float]:
    out = dict(_DEFAULT)
    if base:
        for k, v in base.items():
            if k in out:
                out[k] = float(v)
    if overrides:
        for k, v in overrides.items():
            if k in out:
                out[k] = float(v)
    return out


def weights_for_switch() -> dict[str, float]:
    """Switches: tactile + smooth + scratch vs muted matter most."""
    return merge_weights(
        None,
        {
            "strong_tactile": 1.35,
            "smooth": 1.2,
            "scratchy": 1.15,
            "poppy": 1.1,
            "light_typing_force": 1.1,
            "muted": 1.05,
        },
    )


def weights_for_plate() -> dict[str, float]:
    return merge_weights(
        None,
        {
            "stiff": 1.4,
            "flexible": 1.35,
            "firm_bottom_out": 1.2,
            "deep_sound": 1.15,
            "high_pitch": 1.1,
        },
    )


def weights_for_foam() -> dict[str, float]:
    return merge_weights(
        None,
        {
            "muted": 1.45,
            "soft_bottom_out": 1.35,
            "high_pitch": 1.1,
            "marbly": 1.05,
        },
    )


def weights_for_layout() -> dict[str, float]:
    return merge_weights(
        None,
        {
            "flexible": 1.25,
            "stiff": 1.2,
            "light_typing_force": 1.1,
            "firm_bottom_out": 1.05,
        },
    )


def weights_for_case() -> dict[str, float]:
    return merge_weights(
        None,
        {
            "stiff": 1.35,
            "flexible": 1.3,
            "deep_sound": 1.2,
            "muted": 1.15,
            "soft_bottom_out": 1.1,
            "firm_bottom_out": 1.05,
        },
    )


def weights_for_keycap() -> dict[str, float]:
    return merge_weights(
        None,
        {
            "muted": 1.4,
            "deep_sound": 1.25,
            "high_pitch": 1.2,
            "poppy": 1.15,
        },
    )


def default_user_axis_weights() -> dict[str, float]:
    """Slightly up-weight axes users articulate most often in reviews."""
    return merge_weights(
        None,
        {
            "deep_sound": 1.1,
            "soft_bottom_out": 1.1,
            "strong_tactile": 1.1,
            "muted": 1.05,
        },
    )
