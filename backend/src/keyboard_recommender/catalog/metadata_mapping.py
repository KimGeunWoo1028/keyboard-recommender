"""Deterministic metadata -> trait profile mapping."""

from __future__ import annotations

from typing import Iterable

from keyboard_recommender.catalog.metadata_models import (
    CaseMetadata,
    FoamMetadata,
    KeycapMetadata,
    LayoutMetadata,
    PlateMetadata,
    SwitchMetadata,
)
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS


def _empty_centered() -> dict[str, float]:
    return {k: 5.0 for k in TRAIT_AXIS_IDS}


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, v))


def _clip(v: float) -> float:
    return max(0.0, min(10.0, v))


def _norm(value: float | None, lo: float, hi: float, default: float = 0.5) -> float:
    if value is None:
        return default
    if hi <= lo:
        return default
    return _clamp01((float(value) - lo) / (hi - lo))


def _bump(v: dict[str, float], key: str, delta: float) -> None:
    v[key] = _clip(v.get(key, 5.0) + delta)


def _has_tag(tags: Iterable[str], token: str) -> bool:
    t = token.lower().strip()
    return any(t in str(tag).lower() for tag in tags)


def derive_switch_traits(meta: SwitchMetadata) -> dict[str, float]:
    out = _empty_centered()

    spring = _norm(meta.spring_weight_g, 25.0, 85.0)
    bottom = _norm(meta.bottom_out_force_g, 35.0, 95.0)
    travel = _norm(meta.travel_distance_mm, 3.0, 4.2)
    pretravel = _norm(meta.pretravel_mm, 1.0, 2.2)

    firmness = 0.55 * bottom + 0.45 * spring
    _bump(out, "firm_bottom_out", (firmness - 0.5) * 5.0)
    _bump(out, "soft_bottom_out", (0.5 - firmness) * 4.5)
    _bump(out, "stiff", (firmness - 0.5) * 2.0)
    _bump(out, "light_typing_force", (0.5 - spring) * 5.0)

    _bump(out, "deep_sound", (travel - 0.5) * 3.0)
    _bump(out, "high_pitch", (0.5 - travel) * 2.5)
    _bump(out, "poppy", (0.5 - pretravel) * 2.0)

    if bool(meta.long_pole):
        _bump(out, "firm_bottom_out", 2.0)
        _bump(out, "high_pitch", 1.5)
        _bump(out, "poppy", 1.0)
        _bump(out, "soft_bottom_out", -1.4)

    mats = " ".join(
        [
            str(meta.housing_material_top or ""),
            str(meta.housing_material_bottom or ""),
            str(meta.stem_material or ""),
        ]
    ).lower()
    if "pom" in mats:
        _bump(out, "smooth", 1.8)
        _bump(out, "muted", 1.2)
        _bump(out, "scratchy", -1.2)
    if "pc" in mats or "polycarbonate" in mats:
        _bump(out, "soft_bottom_out", 1.2)
        _bump(out, "high_pitch", -0.8)
    if "nylon" in mats:
        _bump(out, "deep_sound", 1.0)
        _bump(out, "muted", 0.8)
    if "uhmwpe" in mats:
        _bump(out, "smooth", 1.2)
        _bump(out, "scratchy", -0.7)

    if meta.factory_lubed is True:
        _bump(out, "smooth", 1.2)
        _bump(out, "scratchy", -1.0)

    if meta.spring_type == "dual_stage":
        _bump(out, "poppy", 1.2)
        _bump(out, "firm_bottom_out", 0.8)
    elif meta.spring_type == "progressive":
        _bump(out, "firm_bottom_out", 1.5)
    elif meta.spring_type == "slow":
        _bump(out, "poppy", -0.6)
        _bump(out, "muted", 0.6)

    tags = [str(t).strip().lower() for t in meta.sound_signature_tags]
    if _has_tag(tags, "thock") or _has_tag(tags, "deep"):
        _bump(out, "deep_sound", 2.0)
        _bump(out, "muted", 1.0)
        _bump(out, "high_pitch", -1.5)
    if _has_tag(tags, "clacky") or _has_tag(tags, "bright"):
        _bump(out, "high_pitch", 2.0)
        _bump(out, "poppy", 1.0)
    if _has_tag(tags, "muted") or _has_tag(tags, "silent"):
        _bump(out, "muted", 2.2)
        _bump(out, "high_pitch", -1.6)
    if _has_tag(tags, "tactile"):
        _bump(out, "strong_tactile", 2.8)
        _bump(out, "smooth", -0.8)
    if _has_tag(tags, "linear"):
        _bump(out, "strong_tactile", -2.4)
        _bump(out, "smooth", 1.2)

    return out


def derive_plate_traits(meta: PlateMetadata) -> dict[str, float]:
    out = _empty_centered()
    flex = _norm(float(meta.flex_rating) if meta.flex_rating is not None else None, 1, 10)
    _bump(out, "flexible", (flex - 0.5) * 6.0)
    _bump(out, "stiff", (0.5 - flex) * 6.0)
    _bump(out, "soft_bottom_out", (flex - 0.5) * 4.5)
    _bump(out, "firm_bottom_out", (0.5 - flex) * 4.5)

    mat = str(meta.material or "").lower()
    if "fr4" in mat:
        _bump(out, "deep_sound", 1.4)
        _bump(out, "muted", 0.8)
        _bump(out, "high_pitch", -0.9)
    elif "pc" in mat or "polycarbonate" in mat:
        _bump(out, "soft_bottom_out", 1.6)
        _bump(out, "flexible", 1.2)
        _bump(out, "high_pitch", -0.8)
    elif "pom" in mat:
        _bump(out, "smooth", 1.4)
        _bump(out, "muted", 1.2)
    elif "aluminum" in mat or "alu" in mat:
        _bump(out, "stiff", 1.8)
        _bump(out, "high_pitch", 1.3)
    elif "brass" in mat:
        _bump(out, "stiff", 2.2)
        _bump(out, "high_pitch", 1.8)
        _bump(out, "firm_bottom_out", 1.5)

    if meta.mounting_bias == "gasket":
        _bump(out, "soft_bottom_out", 1.0)
        _bump(out, "muted", 0.8)
    elif meta.mounting_bias in {"top", "tray", "sandwich"}:
        _bump(out, "firm_bottom_out", 0.9)
        _bump(out, "high_pitch", 0.6)

    if meta.density_character == "dense":
        _bump(out, "deep_sound", 1.0)
        _bump(out, "muted", 0.9)
    elif meta.density_character == "light":
        _bump(out, "high_pitch", 0.9)
        _bump(out, "poppy", 0.8)

    return out


def derive_foam_traits(meta: FoamMetadata) -> dict[str, float]:
    out = _empty_centered()
    damp = _norm(float(meta.dampening_strength) if meta.dampening_strength is not None else None, 1, 10)
    _bump(out, "muted", (damp - 0.5) * 6.5)
    _bump(out, "high_pitch", (0.5 - damp) * 4.5)
    _bump(out, "soft_bottom_out", (damp - 0.5) * 4.0)
    _bump(out, "poppy", (0.5 - damp) * 2.5)

    if meta.compression_character == "soft":
        _bump(out, "soft_bottom_out", 1.3)
        _bump(out, "firm_bottom_out", -1.0)
    elif meta.compression_character == "firm":
        _bump(out, "firm_bottom_out", 1.0)
        _bump(out, "soft_bottom_out", -1.0)

    if meta.placement_type == "switch":
        _bump(out, "scratchy", -1.0)
        _bump(out, "smooth", 0.8)
    elif meta.placement_type == "spacebar":
        _bump(out, "muted", 0.8)
        _bump(out, "poppy", -0.6)
    elif meta.placement_type == "fullstack":
        _bump(out, "muted", 1.4)
        _bump(out, "high_pitch", -1.0)

    return out


def derive_layout_traits(meta: LayoutMetadata) -> dict[str, float]:
    out = _empty_centered()

    size = meta.layout_size or "65"
    if size in {"40", "60"}:
        _bump(out, "high_pitch", 0.8)
        _bump(out, "poppy", 0.6)
        _bump(out, "deep_sound", -0.6)
    elif size in {"80_tkl", "96", "full"}:
        _bump(out, "deep_sound", 1.0)
        _bump(out, "muted", 0.6)
        _bump(out, "high_pitch", -0.5)

    density = _norm(float(meta.typing_density) if meta.typing_density is not None else None, 1, 10)
    _bump(out, "stiff", (density - 0.5) * 2.0)
    _bump(out, "firm_bottom_out", (density - 0.5) * 1.6)

    if meta.blocker_style in {"hhkb", "winkeyless"}:
        _bump(out, "stiff", 0.6)
    elif meta.blocker_style in {"alice", "split"}:
        _bump(out, "flexible", 0.8)

    if meta.ansi_iso_support == "both":
        _bump(out, "flexible", 0.4)

    return out


def derive_case_traits(meta: CaseMetadata) -> dict[str, float]:
    out = _empty_centered()

    mat = str(meta.material or "").lower()
    if "aluminum" in mat or "alu" in mat or "brass" in mat:
        _bump(out, "stiff", 2.0)
        _bump(out, "deep_sound", 1.2)
        _bump(out, "high_pitch", -1.0)
        _bump(out, "firm_bottom_out", 1.0)
    elif "pc" in mat or "polycarbonate" in mat:
        _bump(out, "high_pitch", 1.4)
        _bump(out, "stiff", -1.2)
        _bump(out, "flexible", 1.0)
    elif "pom" in mat:
        _bump(out, "muted", 1.0)
        _bump(out, "deep_sound", 0.8)

    mount = str(meta.mounting_style or "").lower()
    if mount == "gasket":
        _bump(out, "soft_bottom_out", 1.5)
        _bump(out, "flexible", 1.2)
        _bump(out, "firm_bottom_out", -1.0)
    elif mount in {"tray", "top"}:
        _bump(out, "stiff", 1.4)
        _bump(out, "firm_bottom_out", 1.0)
    elif mount == "leaf_spring":
        _bump(out, "flexible", 1.6)
        _bump(out, "poppy", 0.8)

    acoustic = str(meta.acoustic_character or "").lower()
    if acoustic == "deep":
        _bump(out, "deep_sound", 1.8)
        _bump(out, "muted", 1.0)
        _bump(out, "high_pitch", -1.2)
    elif acoustic == "bright":
        _bump(out, "high_pitch", 1.6)
        _bump(out, "poppy", 0.8)

    kit = str(meta.kit_type or "").lower()
    if kit == "he_kit":
        _bump(out, "poppy", 1.0)
        _bump(out, "light_typing_force", 0.8)
    elif kit == "parts":
        _bump(out, "flexible", -0.8)

    size = str(meta.layout_size or "")
    if size in {"80_tkl", "96", "full"}:
        _bump(out, "deep_sound", 0.8)
        _bump(out, "muted", 0.5)
    elif size in {"40", "60"}:
        _bump(out, "high_pitch", 0.6)

    return out


def derive_keycap_traits(meta: KeycapMetadata) -> dict[str, float]:
    out = _empty_centered()

    material = str(meta.material or "").upper()
    manufacturing = str(meta.manufacturing or "").lower()
    if material == "ABS" and manufacturing in {"doubleshot", "other"}:
        _bump(out, "high_pitch", 1.6)
        _bump(out, "poppy", 1.0)
        _bump(out, "muted", -1.0)
    elif material == "PBT" or manufacturing in {"dye_sub", "double_shot_pbt"}:
        _bump(out, "muted", 1.4)
        _bump(out, "deep_sound", 1.0)
        _bump(out, "high_pitch", -1.0)

    profile = str(meta.profile or "").lower()
    if profile in {"cherry", "oem", "crp"}:
        _bump(out, "smooth", 0.6)
    elif profile in {"moa", "sa", "mt3"}:
        _bump(out, "soft_bottom_out", 0.8)
        _bump(out, "deep_sound", 0.5)
    elif profile in {"xda", "dsa", "asa"}:
        _bump(out, "poppy", 0.5)

    mood = str(meta.colorway_mood or "").lower()
    if mood == "colorful":
        _bump(out, "poppy", 0.4)
    elif mood == "dark":
        _bump(out, "deep_sound", 0.3)

    return out

