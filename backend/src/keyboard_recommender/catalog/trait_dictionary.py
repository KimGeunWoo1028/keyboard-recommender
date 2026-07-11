"""
Central trait dictionary for **catalog authoring** (≈8 stable axes).

Human input uses **low / medium / high** only; see `catalog.normalize` for numeric mapping.
These ids are the **canonical catalog keys** stored in `recommendation_traits.key` over time;
the live matcher still consumes `trait_engine.axes.TRAIT_AXIS_IDS` — bridge via `catalog.projection`.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TraitBandSemantics:
    """What L / M / H means for this axis (relative taste, not physics)."""

    trait_id: str
    display_name: str
    low: str
    medium: str
    high: str
    notes: str = ""


# Ordered stable set (max ~8).
CATALOG_TRAIT_IDS: tuple[str, ...] = (
    "deep_sound",
    "high_pitch",
    "smooth",
    "tactile_strength",
    "soft_bottom_out",
    "stiffness",
    "loudness",
    "bounce",
)

TRAIT_DICTIONARY: dict[str, TraitBandSemantics] = {
    "deep_sound": TraitBandSemantics(
        trait_id="deep_sound",
        display_name="Deep sound (warm / thock-leaning)",
        low="Bright / thin fundamental; less low-mid body.",
        medium="Balanced low-mid presence.",
        high="Stronger low-mid body; warmer, deeper-leaning presentation.",
        notes="Relative to other switches in the catalog, not dB.",
    ),
    "high_pitch": TraitBandSemantics(
        trait_id="high_pitch",
        display_name="High pitch / articulation",
        low="Softer treble edge; less ping-forward.",
        medium="Neutral top-end.",
        high="More articulate / brighter edge; more 'clack-forward' tendency.",
        notes="Not a frequency measurement — perceptual ranking.",
    ),
    "smooth": TraitBandSemantics(
        trait_id="smooth",
        display_name="Smoothness (travel texture)",
        low="More texture / grain in motion (still relative).",
        medium="Typical smoothness for the class.",
        high="Very glide-forward, minimal scratch narrative.",
        notes="Separate from tactile peak strength.",
    ),
    "tactile_strength": TraitBandSemantics(
        trait_id="tactile_strength",
        display_name="Tactile strength",
        low="Linear-leaning or very soft bump.",
        medium="Moderate tactile event.",
        high="Strong, obvious tactile event.",
        notes="For linears, keep low unless marketing claims a 'sharp' pre-travel story.",
    ),
    "soft_bottom_out": TraitBandSemantics(
        trait_id="soft_bottom_out",
        display_name="Soft bottom-out",
        low="Firmer / more abrupt bottom.",
        medium="Middle bottom-out feel.",
        high="Cushioned / deeper bottom-out feel.",
        notes="Board & plate still change real feel — this is SKU-relative.",
    ),
    "stiffness": TraitBandSemantics(
        trait_id="stiffness",
        display_name="Stiffness (plate / stack feel when relevant)",
        low="More flex / forgiving stack (relative).",
        medium="Neutral stiffness.",
        high="Stiffer, more rigid feel (relative).",
        notes="Primarily for plates; may be unused for some SKUs.",
    ),
    "loudness": TraitBandSemantics(
        trait_id="loudness",
        display_name="Loudness (perceived noise)",
        low="Quieter presentation in typical builds.",
        medium="Average loudness for the class.",
        high="Louder / more present in typical builds.",
        notes="Community-relative, not an SPL meter.",
    ),
    "bounce": TraitBandSemantics(
        trait_id="bounce",
        display_name="Bounce / return energy",
        low="Damped return; less lively rebound.",
        medium="Neutral bounce.",
        high="Livelier return / more energetic rebound feel.",
        notes="Overlaps narratively with 'poppy' — keep definitions stable in docs.",
    ),
}


# Which traits are expected for manual / semi-auto authoring (sparse allowed).
FAMILY_TRAIT_ALLOWLIST: dict[str, frozenset[str]] = {
    "switch": frozenset(
        {"deep_sound", "high_pitch", "smooth", "tactile_strength", "soft_bottom_out", "loudness", "bounce"},
    ),
    "plate": frozenset({"deep_sound", "high_pitch", "stiffness", "bounce", "smooth"}),
    "foam": frozenset({"deep_sound", "high_pitch", "smooth", "loudness", "soft_bottom_out"}),
    "layout": frozenset({"stiffness", "smooth", "bounce", "loudness"}),
    "case": frozenset({"deep_sound", "high_pitch", "stiffness", "loudness", "bounce"}),
    "keycap": frozenset({"deep_sound", "high_pitch", "muted", "poppy", "smooth", "soft_bottom_out"}),
}
