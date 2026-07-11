"""
Project the **8-axis catalog vector** (0–1 floats, from L/M/H) into the engine's
`trait_engine.axes.TRAIT_AXIS_IDS` space for cosine matching.

Policy-only mapping — adjust as your catalog and reviewer consensus evolve.
"""

from __future__ import annotations

from typing import Mapping

from keyboard_recommender.catalog.trait_dictionary import CATALOG_TRAIT_IDS
from keyboard_recommender.trait_engine.vectors import empty_vector


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, float(x)))


def project_catalog_to_engine_vector(catalog: Mapping[str, float]) -> dict[str, float]:
    """
    Sparse catalog values default to **0.0** (unknown = no pull).

    **Loudness → muted**: catalog loudness HIGH means louder → engine `muted` should trend lower.
    We set `muted = 1.0 - loudness` when `loudness` is present; if absent, loudness defaults 0.5 (medium).
    """
    c = {k: _clamp01(catalog.get(k, 0.0)) for k in CATALOG_TRAIT_IDS}
    loud = _clamp01(catalog.get("loudness", 0.5))
    muted = 1.0 - loud

    v = empty_vector()
    v["deep_sound"] = c["deep_sound"] + 0.2 * c["bounce"]
    v["high_pitch"] = c["high_pitch"] + 0.25 * c["bounce"]
    v["muted"] = muted + 0.35 * c["deep_sound"]
    v["poppy"] = 0.55 * c["bounce"] + 0.2 * c["high_pitch"]
    v["marbly"] = 0.35 * c["high_pitch"] + 0.25 * c["deep_sound"]
    v["smooth"] = c["smooth"]
    v["scratchy"] = max(0.0, 0.55 * c["tactile_strength"] - 0.45 * c["smooth"])
    v["soft_bottom_out"] = c["soft_bottom_out"]
    v["firm_bottom_out"] = max(0.0, 0.65 * c["stiffness"] - 0.35 * c["soft_bottom_out"])
    v["flexible"] = max(0.0, 0.85 * (1.0 - c["stiffness"]))
    v["stiff"] = c["stiffness"]
    v["strong_tactile"] = c["tactile_strength"]
    v["light_typing_force"] = max(0.0, 0.35 * c["smooth"] + 0.2 * c["soft_bottom_out"])
    return v


def merge_survey_vector_with_catalog_hint(
    survey_engine_vector: Mapping[str, float],
    catalog_engine_vector: Mapping[str, float],
    catalog_weight: float = 0.25,
) -> dict[str, float]:
    """Blend survey-derived engine vector with a catalog projection (future SKU-aware paths)."""
    w = max(0.0, min(1.0, catalog_weight))
    out = empty_vector()
    for k in out:
        out[k] = (1.0 - w) * float(survey_engine_vector.get(k, 0.0)) + w * float(catalog_engine_vector.get(k, 0.0))
    return out
