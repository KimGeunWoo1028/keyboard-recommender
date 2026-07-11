"""Manual SKU-level metadata overrides for high-priority switch products."""

from __future__ import annotations

from typing import Any

_LINEAR_SMOOTH: dict[str, Any] = {
    "spring_weight_g": 47,
    "bottom_out_force_g": 55,
    "travel_distance_mm": 3.8,
    "pretravel_mm": 2.0,
    "factory_lubed": True,
    "sound_signature_tags": ["linear", "balanced"],
}
_LINEAR_THOCK: dict[str, Any] = {
    "spring_weight_g": 48,
    "bottom_out_force_g": 56,
    "travel_distance_mm": 3.8,
    "long_pole": True,
    "housing_material_top": "POM",
    "stem_material": "POM",
    "sound_signature_tags": ["linear", "thocky", "muted"],
}
_LINEAR_BRIGHT: dict[str, Any] = {
    "spring_weight_g": 50,
    "bottom_out_force_g": 61,
    "travel_distance_mm": 3.5,
    "factory_lubed": False,
    "sound_signature_tags": ["linear", "clacky", "bright"],
}
_SILENT: dict[str, Any] = {
    "spring_weight_g": 43,
    "bottom_out_force_g": 51,
    "travel_distance_mm": 3.7,
    "pretravel_mm": 1.9,
    "factory_lubed": True,
    "sound_signature_tags": ["silent", "muted", "linear"],
}
_TACTILE_BALANCED: dict[str, Any] = {
    "spring_weight_g": 55,
    "bottom_out_force_g": 62,
    "travel_distance_mm": 4.0,
    "pretravel_mm": 2.0,
    "factory_lubed": False,
    "sound_signature_tags": ["tactile", "balanced"],
}
_TACTILE_SHARP: dict[str, Any] = {
    "spring_weight_g": 58,
    "bottom_out_force_g": 66,
    "travel_distance_mm": 3.8,
    "pretravel_mm": 1.8,
    "factory_lubed": False,
    "sound_signature_tags": ["tactile", "clacky"],
}
_MAGNETIC_FAST: dict[str, Any] = {
    "spring_weight_g": 41,
    "bottom_out_force_g": 49,
    "travel_distance_mm": 3.5,
    "pretravel_mm": 1.0,
    "sound_signature_tags": ["magnetic", "linear", "fast"],
}
_OTHER_GENERAL: dict[str, Any] = {
    "spring_weight_g": 50,
    "bottom_out_force_g": 58,
    "travel_distance_mm": 3.8,
    "pretravel_mm": 2.0,
    "sound_signature_tags": ["linear", "balanced"],
}


def _with(base: dict[str, Any], **updates: Any) -> dict[str, Any]:
    out = dict(base)
    out.update(updates)
    return out


# Priority 40 SKUs: curated to improve precision over generic subtype defaults.
SWITCH_METADATA_OVERRIDES: dict[str, dict[str, Any]] = {
    # Linear (18)
    "sw-linear-001": _LINEAR_THOCK,
    "sw-linear-002": _with(_LINEAR_SMOOTH, spring_weight_g=45, bottom_out_force_g=53, sound_signature_tags=["linear", "muted", "creamy"]),
    "sw-linear-003": _with(_SILENT, spring_weight_g=44, bottom_out_force_g=52, sound_signature_tags=["silent", "muted", "linear", "thocky"]),
    "sw-linear-005": _LINEAR_SMOOTH,
    "sw-linear-006": _with(_LINEAR_BRIGHT, spring_type="dual_stage", sound_signature_tags=["linear", "bright", "poppy"]),
    "sw-linear-007": _LINEAR_SMOOTH,
    "sw-linear-008": _with(_SILENT, spring_weight_g=43, bottom_out_force_g=51),
    "sw-linear-009": _with(_LINEAR_SMOOTH, spring_weight_g=45, bottom_out_force_g=53, housing_material_top="POM", sound_signature_tags=["linear", "creamy", "muted"]),
    "sw-linear-010": _LINEAR_BRIGHT,
    "sw-linear-011": _LINEAR_SMOOTH,
    "sw-linear-012": _with(_LINEAR_THOCK, long_pole=False),
    "sw-linear-013": _LINEAR_SMOOTH,
    "sw-linear-015": _LINEAR_SMOOTH,
    "sw-linear-016": _with(_LINEAR_THOCK, long_pole=False),
    "sw-linear-017": _LINEAR_SMOOTH,
    "sw-linear-018": _with(_LINEAR_SMOOTH, spring_type="dual_stage", sound_signature_tags=["linear", "poppy"]),
    # Tactile (7)
    "sw-tactile-001": _TACTILE_BALANCED,
    "sw-tactile-002": _TACTILE_BALANCED,
    "sw-tactile-003": _TACTILE_BALANCED,
    "sw-tactile-004": _TACTILE_SHARP,
    "sw-tactile-005": _with(_TACTILE_BALANCED, sound_signature_tags=["tactile", "muted"]),
    "sw-tactile-006": _TACTILE_BALANCED,
    "sw-tactile-007": _with(_TACTILE_BALANCED, spring_weight_g=47, bottom_out_force_g=56, sound_signature_tags=["tactile", "silent", "muted"]),
    # Click (1)
    "sw-click-001": _with(_TACTILE_SHARP, sound_signature_tags=["click", "clacky"]),
    # Silent (3)
    "sw-silent-002": _SILENT,
    "sw-silent-003": _with(_SILENT, spring_weight_g=47, bottom_out_force_g=56, sound_signature_tags=["silent", "muted", "tactile"]),
    "sw-silent-004": _with(_SILENT, spring_weight_g=42, bottom_out_force_g=50, factory_lubed=False),
    # Magnetic (4)
    "sw-magnetic-001": _MAGNETIC_FAST,
    "sw-magnetic-002": _MAGNETIC_FAST,
    "sw-magnetic-003": _with(_MAGNETIC_FAST, spring_weight_g=40, bottom_out_force_g=48, sound_signature_tags=["magnetic", "linear", "fast", "bright"]),
    "sw-magnetic-004": _with(_MAGNETIC_FAST, spring_weight_g=42, bottom_out_force_g=50, sound_signature_tags=["magnetic", "linear", "fast", "muted"]),
    # Other selected (6)
    "sw-other-001": _with(_OTHER_GENERAL, sound_signature_tags=["linear", "thocky"]),
    "sw-other-003": _with(_OTHER_GENERAL, spring_type="dual_stage", sound_signature_tags=["linear", "balanced", "poppy"]),
    "sw-other-010": _with(_OTHER_GENERAL, housing_material_top="POM", sound_signature_tags=["linear", "thocky"]),
    "sw-other-017": _with(_LINEAR_BRIGHT, sound_signature_tags=["linear", "clacky"]),
    "sw-other-020": _with(_LINEAR_THOCK, housing_material_top="UHMWPE", stem_material="UHMWPE", long_pole=False, sound_signature_tags=["linear", "smooth", "thocky"]),
}

