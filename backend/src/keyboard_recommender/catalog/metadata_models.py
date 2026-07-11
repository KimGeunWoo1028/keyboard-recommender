"""Normalized catalog metadata models for deterministic trait grounding."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SwitchMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    spring_weight_g: float | None = Field(default=None, ge=20.0, le=120.0)
    bottom_out_force_g: float | None = Field(default=None, ge=30.0, le=130.0)
    travel_distance_mm: float | None = Field(default=None, ge=2.5, le=5.0)
    pretravel_mm: float | None = Field(default=None, ge=0.8, le=3.0)
    long_pole: bool | None = None
    housing_material_top: str | None = None
    housing_material_bottom: str | None = None
    stem_material: str | None = None
    factory_lubed: bool | None = None
    spring_type: Literal["single_stage", "dual_stage", "progressive", "slow"] | None = None
    sound_signature_tags: list[str] = Field(default_factory=list)


class PlateMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    material: str | None = None
    flex_rating: int | None = Field(default=None, ge=1, le=10)
    mounting_bias: Literal["tray", "top", "gasket", "leaf_spring", "sandwich"] | None = None
    density_character: Literal["light", "balanced", "dense"] | None = None
    compatible_layout_sizes: list[Literal["40", "60", "65", "75", "80_tkl", "96", "full", "alice", "split"]] = (
        Field(default_factory=list)
    )
    compatible_standards: list[Literal["ansi", "iso"]] = Field(default_factory=list)
    supports_blockers: bool | None = None
    supports_exploded: bool | None = None
    mounting_support: list[Literal["tray", "top", "gasket", "leaf_spring", "sandwich"]] = Field(default_factory=list)


class FoamMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    dampening_strength: int | None = Field(default=None, ge=1, le=10)
    compression_character: Literal["soft", "balanced", "firm"] | None = None
    placement_type: Literal["case", "plate", "switch", "spacebar", "fullstack"] | None = None
    compatible_layout_sizes: list[Literal["40", "60", "65", "75", "80_tkl", "96", "full", "alice", "split"]] = (
        Field(default_factory=list)
    )
    mounting_compatibility: list[Literal["tray", "top", "gasket", "leaf_spring", "sandwich"]] = Field(
        default_factory=list,
    )
    tactile_preservation: Literal["high", "medium", "low"] | None = None


class LayoutMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    layout_size: Literal["40", "60", "65", "75", "80_tkl", "96", "full", "alice", "split"] | None = None
    ansi_iso_support: Literal["ansi", "iso", "both"] | None = None
    blocker_style: Literal["standard", "winkeyless", "hhkb", "alice", "split"] | None = None
    typing_density: int | None = Field(default=None, ge=1, le=10)
    has_arrow_cluster: bool | None = None
    has_function_row: bool | None = None
    is_exploded: bool | None = None
    supports_blockers: bool | None = None
    supported_mounting_styles: list[Literal["tray", "top", "gasket", "leaf_spring", "sandwich"]] = Field(
        default_factory=list,
    )


class CaseMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    kit_type: Literal["barebone", "complete", "parts", "he_kit", "kit"] | None = None
    material: str | None = None
    mounting_style: Literal["tray", "top", "gasket", "leaf_spring", "sandwich"] | None = None
    layout_size: Literal["40", "60", "65", "75", "80_tkl", "96", "full", "alice", "split"] | None = None
    ansi_iso_support: Literal["ansi", "iso", "both"] | None = None
    includes_pcb: bool | None = None
    includes_plate: bool | None = None
    includes_foam: bool | None = None
    includes_switches: bool | None = None
    includes_keycaps: bool | None = None
    weight_class: Literal["light", "balanced", "heavy"] | None = None
    acoustic_character: Literal["bright", "balanced", "deep"] | None = None


class KeycapMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    profile: (
        Literal["cherry", "oem", "asa", "sa", "xda", "dsa", "mt3", "moa", "crp", "kat", "other"] | None
    ) = None
    material: Literal["ABS", "PBT", "other"] | None = None
    manufacturing: Literal["doubleshot", "dye_sub", "double_shot_pbt", "other"] | None = None
    kit_scope: Literal["base", "noveset", "alpha", "mod", "addon", "full"] | None = None
    compatible_layout_sizes: list[
        Literal["40", "60", "65", "75", "80_tkl", "96", "full", "alice", "split"]
    ] = Field(default_factory=list)
    colorway_mood: Literal["dark", "light", "colorful", "neutral"] | None = None

