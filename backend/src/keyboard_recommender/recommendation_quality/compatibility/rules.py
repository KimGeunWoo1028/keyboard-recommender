"""Compatibility rules: metadata-grounded hard/soft/warning outcomes."""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Literal

from keyboard_recommender.catalog.metadata_models import (
    CaseMetadata,
    FoamMetadata,
    KeycapMetadata,
    LayoutMetadata,
    PlateMetadata,
)
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.trait_engine.models import KeyboardPart


@dataclass(frozen=True, slots=True)
class RuleOutcome:
    rule_id: str
    raw_penalty: float
    message: str
    severity: Literal["hard_incompatibility", "soft_penalty", "warning"]
    category: Literal[
        "plate_compatibility",
        "foam_compatibility",
        "layout_support",
        "mounting_compatibility",
        "case_support",
        "keycap_support",
        "acoustics",
        "general",
    ]

def _axis(part: KeyboardPart, axis: str) -> float:
    return float(part.traits.get(axis, 0.0))


def _excess_high(value: float, threshold: float, scale_max: float = 10.0) -> float:
    if value <= threshold:
        return 0.0
    span = max(1e-6, scale_max - threshold)
    return max(0.0, min(1.0, (value - threshold) / span))


def _excess_pair(a: float, b: float, threshold: float, scale_max: float = 10.0) -> float:
    return _excess_high(a, threshold, scale_max) * _excess_high(b, threshold, scale_max)


def _case_meta(case: KeyboardPart) -> CaseMetadata:
    node = case.metadata if isinstance(case.metadata, dict) else {}
    return CaseMetadata.model_validate(node)


def _keycap_meta(keycap: KeyboardPart) -> KeycapMetadata:
    node = keycap.metadata if isinstance(keycap.metadata, dict) else {}
    return KeycapMetadata.model_validate(node)


def _plate_meta(plate: KeyboardPart) -> PlateMetadata:
    node = plate.metadata if isinstance(plate.metadata, dict) else {}
    return PlateMetadata.model_validate(node)


def _foam_meta(foam: KeyboardPart) -> FoamMetadata:
    node = foam.metadata if isinstance(foam.metadata, dict) else {}
    return FoamMetadata.model_validate(node)


def _layout_meta(layout: KeyboardPart) -> LayoutMetadata:
    node = layout.metadata if isinstance(layout.metadata, dict) else {}
    return LayoutMetadata.model_validate(node)


def _layout_standard_set(lm: LayoutMetadata) -> set[str]:
    if lm.ansi_iso_support == "both":
        return {"ansi", "iso"}
    if lm.ansi_iso_support in {"ansi", "iso"}:
        return {str(lm.ansi_iso_support)}
    return {"ansi"}


def _plate_standard_set(pm: PlateMetadata) -> set[str]:
    vals = {str(x) for x in pm.compatible_standards if str(x)}
    return vals or {"ansi", "iso"}


def _h(rule_id: str, msg: str, cfg: QualityConfig, category: str) -> RuleOutcome:
    return RuleOutcome(
        rule_id=rule_id,
        raw_penalty=float(cfg.compat_rules.hard_incompatibility_penalty),
        message=msg,
        severity="hard_incompatibility",
        category=category,
    )


def _s(rule_id: str, raw: float, msg: str, category: str) -> RuleOutcome | None:
    if raw <= 0.0:
        return None
    return RuleOutcome(rule_id=rule_id, raw_penalty=float(raw), message=msg, severity="soft_penalty", category=category)


def _w(rule_id: str, msg: str, category: str) -> RuleOutcome:
    return RuleOutcome(rule_id=rule_id, raw_penalty=0.0, message=msg, severity="warning", category=category)


def iter_rule_penalties(
    switch: KeyboardPart,
    plate: KeyboardPart,
    foam: KeyboardPart,
    layout: KeyboardPart,
    case: KeyboardPart,
    keycap: KeyboardPart,
    cfg: QualityConfig,
) -> Iterator[RuleOutcome]:
    pm = _plate_meta(plate)
    fm = _foam_meta(foam)
    lm = _layout_meta(layout)
    cm = _case_meta(case)
    km = _keycap_meta(keycap)
    rc = cfg.compat_rules
    layout_size = str(lm.layout_size or "")
    layout_blocker = str(lm.blocker_style or "standard")
    case_size = str(cm.layout_size or "")

    if case_size and layout_size and case_size != layout_size:
        yield _h(
            "case_layout_size_mismatch",
            f"This case/kit is sized for {case_size} layouts; selected layout is {layout_size}.",
            cfg,
            "case_support",
        )

    case_mount = str(cm.mounting_style or "")
    support_mounts = {str(x) for x in lm.supported_mounting_styles if str(x)}
    if case_mount and support_mounts and case_mount not in support_mounts:
        yield _h(
            "case_mounting_mismatch",
            f"{case_mount} mounting on the case is not supported by the selected layout profile.",
            cfg,
            "case_support",
        )

    keycap_sizes = {str(x) for x in km.compatible_layout_sizes if str(x)}
    if keycap_sizes and layout_size and layout_size not in keycap_sizes:
        yield _h(
            "keycap_layout_size_mismatch",
            f"This keycap kit supports {', '.join(sorted(keycap_sizes))} layouts; selected layout is {layout_size}.",
            cfg,
            "keycap_support",
        )

    kit_scope = str(km.kit_scope or "").lower()
    if kit_scope in {"alpha", "mod", "addon"}:
        yield _w(
            "keycap_kit_scope_incomplete",
            f"This keycap kit is a '{kit_scope}' set and may not cover a full keyboard alone.",
            "keycap_support",
        )

    if pm.compatible_layout_sizes and layout_size and layout_size not in {str(x) for x in pm.compatible_layout_sizes}:
        yield _h(
            "plate_layout_mismatch",
            f"This plate only supports {', '.join(pm.compatible_layout_sizes)} layouts; current layout is {layout_size}.",
            cfg,
            "plate_compatibility",
        )
    if fm.compatible_layout_sizes and layout_size and layout_size not in {str(x) for x in fm.compatible_layout_sizes}:
        yield _h(
            "foam_layout_mismatch",
            f"This foam profile is not cut for {layout_size} layouts.",
            cfg,
            "foam_compatibility",
        )

    overlap = _plate_standard_set(pm) & _layout_standard_set(lm)
    if not overlap:
        yield _h(
            "plate_standard_mismatch",
            "This plate's ANSI/ISO support does not match the selected layout standard.",
            cfg,
            "plate_compatibility",
        )

    if bool(lm.is_exploded) and pm.supports_exploded is False:
        yield _h(
            "plate_exploded_mismatch",
            "This plate does not support exploded layout geometry.",
            cfg,
            "layout_support",
        )
    if layout_blocker != "standard" and pm.supports_blockers is False:
        yield _h(
            "plate_blocker_mismatch",
            f"This plate cannot support {layout_blocker} blocker style.",
            cfg,
            "layout_support",
        )

    mount = case_mount or str(pm.mounting_bias or "")
    support_mounts = {str(x) for x in lm.supported_mounting_styles if str(x)}
    if mount and support_mounts and mount not in support_mounts:
        yield _h(
            "mounting_support_mismatch",
            f"{mount} mounting is not supported by the selected case/layout profile.",
            cfg,
            "mounting_compatibility",
        )
    foam_mounts = {str(x) for x in fm.mounting_compatibility if str(x)}
    if mount and foam_mounts and mount not in foam_mounts:
        yield _w(
            "foam_mounting_warning",
            f"Foam tuning is uncommon with {mount} mounting and may need manual trimming.",
            "case_support",
        )

    stiff_p = _axis(plate, "stiff")
    firm_s = _axis(switch, "firm_bottom_out")
    harsh_raw = rc.stiff_plate_firm_switch * _excess_pair(stiff_p, firm_s, rc.part_axis_high)
    out = _s(
        "stiff_plate_firm_switch",
        harsh_raw,
        "Very rigid plate with firm switch can feel physically harsh.",
        "acoustics",
    )
    if out:
        yield out

    muted_f = _axis(foam, "muted")
    bright_attack = max(_axis(plate, "high_pitch"), _axis(switch, "high_pitch")) + 0.35 * max(
        _axis(plate, "poppy"),
        _axis(switch, "poppy"),
    )
    out = _s(
        "muted_foam_bright_attack",
        rc.muted_foam_bright_attack * _excess_pair(muted_f, bright_attack, rc.part_axis_very_high),
        "Acoustically conflicted: heavily muted foam with very bright attack.",
        "acoustics",
    )
    if out:
        yield out

    scratchy = _axis(switch, "scratchy")
    out = _s(
        "harsh_typing_stack",
        rc.harsh_typing_stack * (scratchy / 10.0) * _excess_pair(firm_s, stiff_p, rc.part_axis_high),
        "Scratchy + firm switch with stiff plate may fatigue long typing sessions.",
        "acoustics",
    )
    if out:
        yield out

    tactile_strength = _axis(switch, "strong_tactile")
    damp_strength = float(fm.dampening_strength or 0)
    overdamp = rc.foam_overdamp_tactile * _excess_pair(damp_strength, tactile_strength, rc.part_axis_high)
    out = _s(
        "foam_overdamp_tactile",
        overdamp,
        "This foam combination may overly dampen tactile response.",
        "foam_compatibility",
    )
    if out:
        yield out

    if layout_size in {"alice", "split"}:
        yield _w(
            "uncommon_layout_warning",
            "This is an uncommon but valid layout; plate/foam fit tolerance may vary by vendor.",
            "layout_support",
        )
