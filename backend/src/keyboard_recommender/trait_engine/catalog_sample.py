"""Sample catalog — every part carries full-axis trait scores (0–10 scale)."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.metadata_mapping import (
    derive_case_traits,
    derive_foam_traits,
    derive_keycap_traits,
    derive_layout_traits,
    derive_plate_traits,
    derive_switch_traits,
)
from keyboard_recommender.catalog.manual_switch_curation import SWITCH_METADATA_OVERRIDES
from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id
from keyboard_recommender.catalog.metadata_models import (
    CaseMetadata,
    FoamMetadata,
    KeycapMetadata,
    LayoutMetadata,
    PlateMetadata,
    SwitchMetadata,
)
from keyboard_recommender.catalog.swagkey_case_seed_builder import infer_case_metadata, infer_layout_size
from keyboard_recommender.catalog.swagkey_keycap_seed_builder import infer_keycap_metadata
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import from_sparse

logger = logging.getLogger(__name__)

# fmt: off
SWITCHES: list[KeyboardPart] = [
    KeyboardPart(
        id="sw-longpole-linear",
        name="Long-pole linear (thock-leaning)",
        description="입력이 매끈하고 바닥 타건이 묵직한 편이라, 저음 중심 세팅에 자주 쓰이는 스위치입니다.",
        family="switch",
        traits=from_sparse({
            "deep_sound": 8, "smooth": 9, "muted": 3, "high_pitch": 2, "poppy": 2,
            "soft_bottom_out": 4, "firm_bottom_out": 5, "strong_tactile": 0, "light_typing_force": 4,
            "scratchy": 2, "marbly": 3, "flexible": 3, "stiff": 4,
        }),
        popularity_weight=1.05,
    ),
    KeyboardPart(
        id="sw-light-tactile",
        name="Light tactile (brown-class)",
        description="구분감이 과하지 않아 업무용으로 무난하고, Tactile 입문에 잘 맞는 성향입니다.",
        family="switch",
        traits=from_sparse({
            "strong_tactile": 4, "smooth": 5, "high_pitch": 4, "muted": 4, "soft_bottom_out": 5,
            "deep_sound": 3, "poppy": 2, "scratchy": 2, "firm_bottom_out": 4, "light_typing_force": 5,
            "marbly": 2, "flexible": 4, "stiff": 3,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="sw-strong-tactile",
        name="Strong tactile (POM / Durock)",
        description="입력 구분감이 뚜렷하고 반응이 또렷해, 단단한 플레이트와 조합 시 존재감이 커집니다.",
        family="switch",
        traits=from_sparse({
            "strong_tactile": 9, "scratchy": 5, "firm_bottom_out": 7, "high_pitch": 5, "poppy": 4,
            "smooth": 2, "deep_sound": 4, "muted": 2, "soft_bottom_out": 2, "stiff": 4,
            "light_typing_force": 2, "marbly": 2, "flexible": 2,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="sw-silent-linear",
        name="Silent linear",
        description="소음 억제가 잘 되어 조용하면서도 구분감 돌출 없이 부드럽게 입력되는 타입입니다.",
        family="switch",
        traits=from_sparse({
            "muted": 9, "smooth": 8, "high_pitch": 1, "soft_bottom_out": 8, "deep_sound": 3,
            "strong_tactile": 0, "scratchy": 1, "poppy": 1, "firm_bottom_out": 3, "light_typing_force": 5,
            "marbly": 2, "flexible": 4, "stiff": 2,
        }),
        popularity_weight=1.02,
    ),
    KeyboardPart(
        id="sw-speed-linear",
        name="Speed / short-travel linear",
        description="복귀가 빠르고 반응이 경쾌해, 게임 중심 사용자가 선호하는 매끈 키감 성향입니다.",
        family="switch",
        traits=from_sparse({
            "smooth": 9, "firm_bottom_out": 8, "high_pitch": 7, "poppy": 6, "stiff": 5,
            "strong_tactile": 0, "deep_sound": 2, "soft_bottom_out": 2, "scratchy": 4, "muted": 2,
            "light_typing_force": 4, "marbly": 1, "flexible": 2,
        }),
        popularity_weight=0.98,
    ),
]

PLATES: list[KeyboardPart] = [
    KeyboardPart(
        id="plate-fr4",
        name="FR4 plate",
        description="알루미늄 대비 소리가 조금 더 차분하고 균형적이라, 중간 성향 세팅에 잘 맞습니다.",
        family="plate",
        traits=from_sparse({
            "deep_sound": 8, "stiff": 6, "high_pitch": 4, "firm_bottom_out": 6, "flexible": 3,
            "muted": 3, "smooth": 4, "scratchy": 4, "soft_bottom_out": 3, "marbly": 3,
            "strong_tactile": 3, "poppy": 3, "light_typing_force": 4,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="plate-alu",
        name="Aluminum plate",
        description="단단하고 반응이 또렷해, 별도 튜닝이 적어도 밝고 선명한 느낌이 잘 살아납니다.",
        family="plate",
        traits=from_sparse({
            "stiff": 8, "high_pitch": 7, "firm_bottom_out": 7, "scratchy": 5, "poppy": 4,
            "smooth": 5, "deep_sound": 4, "flexible": 2, "muted": 2, "soft_bottom_out": 2,
            "strong_tactile": 3, "marbly": 2, "light_typing_force": 4,
        }),
        popularity_weight=1.05,
    ),
    KeyboardPart(
        id="plate-pc",
        name="Polycarbonate (PC) plate",
        description="바닥감이 부드럽고 유연성이 있어 장시간 타건 시 손 부담을 줄이는 데 유리합니다.",
        family="plate",
        traits=from_sparse({
            "flexible": 8, "soft_bottom_out": 9, "deep_sound": 7, "muted": 4, "smooth": 6,
            "firm_bottom_out": 3, "high_pitch": 3, "stiff": 2, "marbly": 3, "scratchy": 2,
            "strong_tactile": 2, "poppy": 2, "light_typing_force": 5,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="plate-pom",
        name="POM plate",
        description="소리가 과하게 튀지 않고 차분한 편이라 감쇠 중심의 정돈된 세팅에 잘 맞습니다.",
        family="plate",
        traits=from_sparse({
            "muted": 7, "deep_sound": 6, "high_pitch": 2, "smooth": 7, "firm_bottom_out": 4,
            "soft_bottom_out": 6, "stiff": 4, "flexible": 3, "scratchy": 2, "marbly": 3,
            "strong_tactile": 2, "poppy": 2, "light_typing_force": 4,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="plate-brass",
        name="Brass plate",
        description="무게감과 강성이 높아 바닥감이 단단하고, 배음이 또렷하게 드러나는 성향입니다.",
        family="plate",
        traits=from_sparse({
            "stiff": 9, "high_pitch": 8, "firm_bottom_out": 8, "deep_sound": 5, "poppy": 4,
            "smooth": 4, "soft_bottom_out": 1, "flexible": 1, "scratchy": 4, "muted": 2,
            "strong_tactile": 3, "marbly": 2, "light_typing_force": 3,
        }),
        popularity_weight=0.95,
    ),
]

FOAM: list[KeyboardPart] = [
    KeyboardPart(
        id="foam-case-poron",
        name="Case poron only",
        description="통울림을 줄이면서도 플레이트 특유의 반응감은 과하게 죽이지 않는 구성입니다.",
        family="foam",
        traits=from_sparse({
            "muted": 7, "soft_bottom_out": 6, "high_pitch": 3, "deep_sound": 5, "smooth": 5,
            "firm_bottom_out": 4, "marbly": 3, "scratchy": 2, "poppy": 2, "flexible": 3,
            "stiff": 3, "strong_tactile": 3, "light_typing_force": 4,
        }),
        popularity_weight=1.05,
    ),
    KeyboardPart(
        id="foam-case-plate",
        name="Case + thin plate foam",
        description="핑음 억제와 유연한 타건감의 균형을 노릴 때 무난하게 선택되는 조합입니다.",
        family="foam",
        traits=from_sparse({
            "muted": 7, "soft_bottom_out": 7, "high_pitch": 2, "deep_sound": 6, "smooth": 5,
            "firm_bottom_out": 4, "flexible": 4, "scratchy": 2, "poppy": 2, "marbly": 3,
            "stiff": 3, "strong_tactile": 3, "light_typing_force": 4,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="foam-minimal",
        name="Minimal / no foam",
        description="생동감과 개방감이 크게 살아나는 대신, 플레이트 선택에 따라 체감 차이가 커집니다.",
        family="foam",
        traits=from_sparse({
            "high_pitch": 8, "poppy": 6, "scratchy": 6, "firm_bottom_out": 5, "deep_sound": 4,
            "muted": 1, "soft_bottom_out": 1, "smooth": 6, "marbly": 3, "flexible": 4,
            "stiff": 4, "strong_tactile": 2, "light_typing_force": 4,
        }),
        popularity_weight=0.95,
    ),
    KeyboardPart(
        id="foam-heavy",
        name="Heavy damp",
        description="가장 조용한 쪽에 가깝지만, 너무 물컹하게 느껴질 수 있어 취향 확인이 필요합니다.",
        family="foam",
        traits=from_sparse({
            "muted": 9, "soft_bottom_out": 8, "high_pitch": 1, "deep_sound": 4, "smooth": 5,
            "firm_bottom_out": 3, "scratchy": 1, "marbly": 2, "flexible": 3, "stiff": 2,
            "strong_tactile": 2, "poppy": 1, "light_typing_force": 4,
        }),
        popularity_weight=1.0,
    ),
]

LAYOUTS: list[KeyboardPart] = [
    KeyboardPart(
        id="lay-65",
        name="65% compact",
        description="펑션열 없이 방향키를 유지해, 공간 절약과 실사용 편의의 균형이 좋은 타입입니다.",
        family="layout",
        traits=from_sparse({
            "flexible": 5, "stiff": 4, "firm_bottom_out": 4, "soft_bottom_out": 5, "smooth": 5,
            "deep_sound": 5, "high_pitch": 5, "muted": 4, "strong_tactile": 4, "light_typing_force": 5,
            "scratchy": 3, "poppy": 3, "marbly": 3,
        }),
        popularity_weight=1.1,
    ),
    KeyboardPart(
        id="lay-tkl",
        name="TKL (tenkeyless)",
        description="펑션열과 방향키는 유지하고 숫자패드를 제외해, 작업과 게임 모두에 무난한 구성입니다.",
        family="layout",
        traits=from_sparse({
            "stiff": 5, "flexible": 4, "firm_bottom_out": 5, "smooth": 5, "deep_sound": 5,
            "high_pitch": 5, "muted": 4, "soft_bottom_out": 4, "strong_tactile": 4, "light_typing_force": 5,
            "scratchy": 3, "poppy": 3, "marbly": 3,
        }),
        popularity_weight=1.05,
    ),
    KeyboardPart(
        id="lay-60",
        name="60% standard",
        description="책상 점유가 작고 미니멀하지만, 단축키 레이어 활용 비중이 상대적으로 높습니다.",
        family="layout",
        traits=from_sparse({
            "smooth": 6, "flexible": 5, "firm_bottom_out": 5, "high_pitch": 4, "deep_sound": 5,
            "soft_bottom_out": 4, "muted": 4, "strong_tactile": 3, "light_typing_force": 5,
            "scratchy": 3, "poppy": 3, "marbly": 3, "stiff": 4,
        }),
        popularity_weight=1.0,
    ),
    KeyboardPart(
        id="lay-full",
        name="Full-size",
        description="숫자패드를 포함한 완전형 배열로, 업무 입력 비중이 높은 사용자에게 익숙한 타입입니다.",
        family="layout",
        traits=from_sparse({
            "deep_sound": 6, "muted": 5, "soft_bottom_out": 6, "firm_bottom_out": 4, "stiff": 4,
            "high_pitch": 4, "smooth": 4, "strong_tactile": 3, "flexible": 3, "light_typing_force": 4,
            "scratchy": 3, "poppy": 2, "marbly": 3,
        }),
        popularity_weight=0.98,
    ),
]
# fmt: on

_SEED_PATH = Path(__file__).resolve().parents[1] / "catalog" / "swagkey_products.seed.json"

_EXTERNAL_DESCRIPTION_BY_FAMILY_SUBTYPE: dict[str, dict[str, str]] = {
    "switch": {
        "linear": "입력이 매끈하고 반응이 빨라, 부드러운 타건감과 안정적인 복귀감을 원하는 사용자에게 잘 맞는 타입입니다.",
        "tactile": "키를 누를 때 구분감이 분명하게 느껴져, 입력 피드백을 선호하는 사용자에게 잘 맞는 타입입니다.",
        "click": "입력 시 클릭감과 소리 존재감이 또렷해, 명확한 타건 피드백을 선호하는 성향에 어울리는 타입입니다.",
        "silent": "소음 억제가 잘 되어 조용하면서도, 일상 사용에서 부담이 적은 방향의 세팅에 적합한 타입입니다.",
        "magnetic": "빠른 반응과 깔끔한 입력감을 노릴 수 있어, 민감한 입력 제어를 선호하는 사용자에게 유리한 타입입니다.",
        "other": "사용 목적과 취향에 따라 폭넓게 선택할 수 있는 타입으로, 세팅 방향에 맞춰 유연하게 조합하기 좋습니다.",
    },
    "plate": {
        "plate": "보강판 특성에 따라 타건 강성, 소리 성향, 바닥감이 달라지므로 사용 취향에 맞춰 조정하는 핵심 요소입니다.",
    },
    "foam": {
        "dampening": "통울림과 잔향을 줄여 소리를 더 정돈하고, 바닥감을 부드럽게 다듬는 데 도움이 되는 흡음재 구성입니다.",
    },
    "layout": {
        "layout": "배열 크기와 키 배치 밀도에 따라 작업 동선과 사용감이 달라지므로, 사용 목적에 맞춘 선택이 중요한 구성입니다.",
    },
    "case": {
        "kit": "케이스·키트는 마운팅 방식과 재질에 따라 소리와 타건감의 기반이 되며, 레이아웃 크기와 함께 맞춰야 합니다.",
        "barebone": "베어본 키트는 PCB·케이스 중심 구성으로, 원하는 스위치·키캡을 직접 조합하기 좋습니다.",
        "complete": "완제품 키트는 조립 부담을 줄이고, 바로 사용 가능한 일체형 구성을 제공합니다.",
        "parts": "파츠·하우징은 기존 빌드에 맞춰 교체·보강할 때 선택하는 케이스 구성입니다.",
        "he_kit": "HE(홀 이펙트) 키트는 자석축 중심 구성으로, 빠른 입력 반응에 맞춰져 있습니다.",
    },
    "keycap": {
        "base": "키캡은 프로필·재질·각인 방식에 따라 소리 톤과 타건감이 달라지며, 레이아웃 호환도 함께 확인합니다.",
        "full": "키캡은 프로필·재질·각인 방식에 따라 소리 톤과 타건감이 달라지며, 레이아웃 호환도 함께 확인합니다.",
        "keycap": "키캡은 프로필·재질·각인 방식에 따라 소리 톤과 타건감이 달라지며, 레이아웃 호환도 함께 확인합니다.",
    },
}


def _as_metadata_dict(raw: dict[str, Any]) -> dict[str, Any]:
    node = raw.get("metadata")
    return dict(node) if isinstance(node, dict) else {}


def _infer_switch_metadata(raw: dict[str, Any], subtype: str) -> SwitchMetadata:
    part_id = str(raw.get("id") or "").strip()
    name = str(raw.get("name") or "").lower()
    sub = subtype.strip().lower()
    md = _as_metadata_dict(raw)
    tags = [str(t).strip().lower() for t in md.get("sound_signature_tags", []) if str(t).strip()]
    if sub and sub not in tags:
        tags.append(sub)
    if "silent" in name and "silent" not in tags:
        tags.append("silent")
    if "tactile" in name and "tactile" not in tags:
        tags.append("tactile")
    if "linear" in name and "linear" not in tags:
        tags.append("linear")
    if "thock" in name and "thocky" not in tags:
        tags.append("thocky")
    if "clacky" in name and "clacky" not in tags:
        tags.append("clacky")
    if "long-pole" in name or "long pole" in name or "롱폴" in name:
        md.setdefault("long_pole", True)

    if sub == "silent":
        md.setdefault("bottom_out_force_g", 52.0)
        md.setdefault("spring_weight_g", 45.0)
        md.setdefault("travel_distance_mm", 3.7)
    elif sub == "tactile":
        md.setdefault("bottom_out_force_g", 60.0)
        md.setdefault("spring_weight_g", 53.0)
        md.setdefault("travel_distance_mm", 3.8)
    elif sub == "linear":
        md.setdefault("bottom_out_force_g", 55.0)
        md.setdefault("spring_weight_g", 48.0)
        md.setdefault("travel_distance_mm", 3.8)
    elif sub == "click":
        md.setdefault("bottom_out_force_g", 62.0)
        md.setdefault("spring_weight_g", 55.0)
        md.setdefault("travel_distance_mm", 3.6)
    elif sub == "magnetic":
        md.setdefault("bottom_out_force_g", 50.0)
        md.setdefault("spring_weight_g", 42.0)
        md.setdefault("travel_distance_mm", 3.5)
        md.setdefault("pretravel_mm", 1.0)

    if "pom" in name:
        md.setdefault("housing_material_top", "POM")
        md.setdefault("stem_material", "POM")
    if "pc" in name:
        md.setdefault("housing_material_top", "PC")
    if "nylon" in name:
        md.setdefault("housing_material_bottom", "Nylon")
    if "factory_lubed" not in md and ("윤활" in name or "lub" in name):
        md["factory_lubed"] = True

    # Manual high-priority SKU overrides (wins over generic and name heuristics).
    if part_id and part_id in SWITCH_METADATA_OVERRIDES:
        md.update(SWITCH_METADATA_OVERRIDES[part_id])

    md["sound_signature_tags"] = tags
    if part_id and part_id in SWITCH_METADATA_OVERRIDES:
        forced_tags = SWITCH_METADATA_OVERRIDES[part_id].get("sound_signature_tags")
        if isinstance(forced_tags, list):
            md["sound_signature_tags"] = [str(t).strip().lower() for t in forced_tags if str(t).strip()]
    return SwitchMetadata.model_validate(md)


def _infer_plate_metadata(raw: dict[str, Any]) -> PlateMetadata:
    name = str(raw.get("name") or "").lower()
    md = _as_metadata_dict(raw)
    if "neo98" in name or "qk65" in name:
        md.setdefault("material", "FR4")
        md.setdefault("flex_rating", 5)
    if "fr4" in name:
        md.setdefault("material", "FR4")
    if "pom" in name:
        md.setdefault("material", "POM")
    if "pc" in name:
        md.setdefault("material", "PC")
    if "alu" in name or "aluminum" in name:
        md.setdefault("material", "Aluminum")
    md.setdefault("mounting_bias", "gasket")
    md.setdefault("density_character", "balanced")
    md.setdefault("flex_rating", 5)
    if "65" in name:
        md.setdefault("compatible_layout_sizes", ["65"])
    elif "75" in name:
        md.setdefault("compatible_layout_sizes", ["75"])
    elif "98" in name or "96" in name:
        md.setdefault("compatible_layout_sizes", ["96", "full"])
    elif "tkl" in name or "80" in name:
        md.setdefault("compatible_layout_sizes", ["80_tkl"])
    else:
        md.setdefault("compatible_layout_sizes", ["60", "65", "75"])
    standards = [str(x).strip().lower() for x in md.get("compatible_standards", []) if str(x).strip()]
    if not standards:
        md["compatible_standards"] = ["ansi", "iso"] if ("iso" in name and "ansi" in name) else ["ansi"]
    md.setdefault("supports_blockers", not any(x in name for x in ("standard only",)))
    md.setdefault("supports_exploded", True)
    md.setdefault("mounting_support", [md.get("mounting_bias") or "gasket"])
    return PlateMetadata.model_validate(md)


def _infer_foam_metadata(raw: dict[str, Any], subtype: str) -> FoamMetadata:
    name = str(raw.get("name") or "").lower()
    md = _as_metadata_dict(raw)
    md.setdefault("dampening_strength", 7 if subtype == "dampening" else 6)
    md.setdefault("compression_character", "soft")
    if "spacebar" in name:
        md.setdefault("placement_type", "spacebar")
    elif "switch" in name:
        md.setdefault("placement_type", "switch")
    elif "기보강" in name or "plate" in name:
        md.setdefault("placement_type", "plate")
    else:
        md.setdefault("placement_type", "case")
    md.setdefault("compatible_layout_sizes", ["60", "65", "75", "80_tkl", "96", "full", "alice", "split"])
    md.setdefault("mounting_compatibility", ["tray", "top", "gasket", "leaf_spring", "sandwich"])
    if md.get("dampening_strength", 0) >= 8:
        md.setdefault("tactile_preservation", "low")
    elif md.get("dampening_strength", 0) <= 4:
        md.setdefault("tactile_preservation", "high")
    else:
        md.setdefault("tactile_preservation", "medium")
    return FoamMetadata.model_validate(md)


def _infer_layout_metadata(raw: dict[str, Any]) -> LayoutMetadata:
    name = str(raw.get("name") or "").lower()
    md = _as_metadata_dict(raw)
    if "alice" in name:
        md.setdefault("layout_size", "alice")
        md.setdefault("typing_density", 6)
    elif "split" in name:
        md.setdefault("layout_size", "split")
        md.setdefault("typing_density", 4)
    if "full" in name or "100" in name:
        md.setdefault("layout_size", "full")
        md.setdefault("typing_density", 9)
    elif "tkl" in name or "80" in name:
        md.setdefault("layout_size", "80_tkl")
        md.setdefault("typing_density", 7)
    elif "65" in name:
        md.setdefault("layout_size", "65")
        md.setdefault("typing_density", 6)
    elif "60" in name:
        md.setdefault("layout_size", "60")
        md.setdefault("typing_density", 5)
    else:
        md.setdefault("layout_size", "75")
        md.setdefault("typing_density", 6)
    md.setdefault("ansi_iso_support", "both")
    md.setdefault("blocker_style", "standard")
    sz = str(md.get("layout_size") or "")
    md.setdefault("has_arrow_cluster", sz not in {"40", "60"})
    md.setdefault("has_function_row", sz in {"75", "80_tkl", "96", "full"})
    md.setdefault("is_exploded", "exploded" in name)
    md.setdefault("supports_blockers", str(md.get("blocker_style") or "standard") != "standard")
    md.setdefault("supported_mounting_styles", ["tray", "top", "gasket", "leaf_spring", "sandwich"])
    return LayoutMetadata.model_validate(md)


def _infer_case_metadata(raw: dict[str, Any], subtype: str) -> CaseMetadata:
    name = str(raw.get("name") or "").strip()
    md = _as_metadata_dict(raw)
    if not md:
        return infer_case_metadata(name)
    inferred = infer_case_metadata(name)
    for key, value in inferred.model_dump(exclude_none=True).items():
        md.setdefault(key, value)
    if not md.get("layout_size"):
        layout_size = infer_layout_size(name)
        if layout_size:
            md["layout_size"] = layout_size
    sub = subtype.strip().lower()
    if sub and not md.get("kit_type"):
        md["kit_type"] = sub if sub in {"barebone", "complete", "parts", "he_kit", "kit"} else "kit"
    return CaseMetadata.model_validate(md)


def _infer_keycap_metadata(raw: dict[str, Any], subtype: str) -> KeycapMetadata:
    name = str(raw.get("name") or "").strip()
    md = _as_metadata_dict(raw)
    if not md:
        return infer_keycap_metadata(name)
    inferred = infer_keycap_metadata(name)
    for key, value in inferred.model_dump(exclude_none=True).items():
        md.setdefault(key, value)
    sub = subtype.strip().lower()
    if sub and not md.get("kit_scope"):
        md["kit_scope"] = sub if sub in {"base", "noveset", "alpha", "mod", "addon", "full"} else "base"
    return KeycapMetadata.model_validate(md)


def _to_external_part(
    raw: dict[str, Any],
    *,
    family: str,
    subtype: str,
) -> KeyboardPart | None:
    part_id = str(raw.get("id") or "").strip()
    name = str(raw.get("name") or "").strip()
    if not part_id or not name:
        return None
    fam_key = family.strip().lower()
    sub_key = subtype.strip().lower()
    metadata_payload: dict[str, Any] = {}
    if fam_key == "switch":
        sm = _infer_switch_metadata(raw, sub_key)
        traits = derive_switch_traits(sm)
        metadata_payload = sm.model_dump(exclude_none=True)
    elif fam_key == "plate":
        pm = _infer_plate_metadata(raw)
        traits = derive_plate_traits(pm)
        metadata_payload = pm.model_dump(exclude_none=True)
    elif fam_key == "foam":
        fm = _infer_foam_metadata(raw, sub_key)
        traits = derive_foam_traits(fm)
        metadata_payload = fm.model_dump(exclude_none=True)
    elif fam_key == "layout":
        lm = _infer_layout_metadata(raw)
        traits = derive_layout_traits(lm)
        metadata_payload = lm.model_dump(exclude_none=True)
    elif fam_key == "case":
        cm = _infer_case_metadata(raw, sub_key)
        traits = derive_case_traits(cm)
        metadata_payload = cm.model_dump(exclude_none=True)
    elif fam_key == "keycap":
        km = _infer_keycap_metadata(raw, sub_key)
        traits = derive_keycap_traits(km)
        metadata_payload = km.model_dump(exclude_none=True)
    else:
        return None
    sub_key = subtype.strip().lower()
    description = _EXTERNAL_DESCRIPTION_BY_FAMILY_SUBTYPE.get(fam_key, {}).get(
        sub_key,
        _EXTERNAL_DESCRIPTION_BY_FAMILY_SUBTYPE.get(fam_key, {}).get(fam_key, "취향 기반 추천에 활용되는 구성 요소입니다."),
    )
    return KeyboardPart(
        id=part_id,
        name=name,
        description=description,
        family=family,
        traits=from_sparse(traits),
        popularity_weight=1.0,
        metadata=metadata_payload,
    )


def is_recommendation_eligible_row(raw: dict[str, Any], *, family: str) -> bool:
    """Recommend pool gate (Phase 6): browse stubs stay out unless promoted."""
    fam = family.strip().lower()
    if fam == "layout":
        return is_layout_archetype_part_id(str(raw.get("id") or ""))
    if raw.get("recommendationEligible") is False:
        return False
    return True


def _load_external_seed_parts(
    *,
    recommend_only: bool = False,
) -> tuple[
    list[KeyboardPart],
    list[KeyboardPart],
    list[KeyboardPart],
    list[KeyboardPart],
    list[KeyboardPart],
    list[KeyboardPart],
]:
    if not _SEED_PATH.exists():
        return [], [], [], [], [], []
    try:
        payload = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load swagkey seed catalog: %s", exc)
        return [], [], [], [], [], []

    external_switches: list[KeyboardPart] = []
    external_plates: list[KeyboardPart] = []
    external_foams: list[KeyboardPart] = []
    external_layouts: list[KeyboardPart] = []
    external_cases: list[KeyboardPart] = []
    external_keycaps: list[KeyboardPart] = []

    switches_node = payload.get("switches")
    if isinstance(switches_node, dict):
        for subtype, rows in switches_node.items():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if not isinstance(row, dict):
                    continue
                if recommend_only and not is_recommendation_eligible_row(row, family="switch"):
                    continue
                part = _to_external_part(row, family="switch", subtype=str(subtype))
                if part is not None:
                    external_switches.append(part)

    plates_node = payload.get("plates")
    if isinstance(plates_node, list):
        for row in plates_node:
            if not isinstance(row, dict):
                continue
            if recommend_only and not is_recommendation_eligible_row(row, family="plate"):
                continue
            part = _to_external_part(row, family="plate", subtype="plate")
            if part is not None:
                external_plates.append(part)

    foams_node = payload.get("foams")
    if isinstance(foams_node, list):
        for row in foams_node:
            if not isinstance(row, dict):
                continue
            if recommend_only and not is_recommendation_eligible_row(row, family="foam"):
                continue
            subtype = str(row.get("subtype") or "dampening").strip().lower()
            part = _to_external_part(row, family="foam", subtype=subtype)
            if part is not None:
                external_foams.append(part)

    layouts_node = payload.get("layouts")
    if isinstance(layouts_node, list):
        for row in layouts_node:
            if not isinstance(row, dict):
                continue
            if recommend_only and not is_recommendation_eligible_row(row, family="layout"):
                continue
            subtype = str(row.get("subtype") or "layout").strip().lower()
            part = _to_external_part(row, family="layout", subtype=subtype)
            if part is not None:
                external_layouts.append(part)

    cases_node = payload.get("cases")
    if isinstance(cases_node, list):
        for row in cases_node:
            if not isinstance(row, dict):
                continue
            if recommend_only and not is_recommendation_eligible_row(row, family="case"):
                continue
            subtype = str(row.get("subtype") or "kit").strip().lower()
            part = _to_external_part(row, family="case", subtype=subtype)
            if part is not None:
                external_cases.append(part)

    keycaps_node = payload.get("keycaps")
    if isinstance(keycaps_node, list):
        for row in keycaps_node:
            if not isinstance(row, dict):
                continue
            if recommend_only and not is_recommendation_eligible_row(row, family="keycap"):
                continue
            subtype = str(row.get("subtype") or "base").strip().lower()
            part = _to_external_part(row, family="keycap", subtype=subtype)
            if part is not None:
                external_keycaps.append(part)

    return (
        external_switches,
        external_plates,
        external_foams,
        external_layouts,
        external_cases,
        external_keycaps,
    )


_BROWSE_SWITCHES, _BROWSE_PLATES, _BROWSE_FOAMS, _BROWSE_LAYOUTS, _BROWSE_CASES, _BROWSE_KEYCAPS = (
    _load_external_seed_parts(recommend_only=False)
)
_EXT_SWITCHES, _EXT_PLATES, _EXT_FOAMS, _EXT_LAYOUTS, _EXT_CASES, _EXT_KEYCAPS = _load_external_seed_parts(
    recommend_only=True,
)
SWITCHES = _EXT_SWITCHES if _EXT_SWITCHES else SWITCHES
PLATES = _EXT_PLATES if _EXT_PLATES else PLATES
FOAM = _EXT_FOAMS if _EXT_FOAMS else FOAM
LAYOUTS = _EXT_LAYOUTS if _EXT_LAYOUTS else LAYOUTS
CASES: list[KeyboardPart] = _EXT_CASES
KEYCAPS: list[KeyboardPart] = _EXT_KEYCAPS


def load_browse_seed_parts() -> dict[str, list[KeyboardPart]]:
    """Full browse pool from seed (includes browse-only stubs)."""
    return {
        "switch": list(_BROWSE_SWITCHES),
        "plate": list(_BROWSE_PLATES),
        "foam": list(_BROWSE_FOAMS),
        "layout": list(_BROWSE_LAYOUTS),
        "case": list(_BROWSE_CASES),
        "keycap": list(_BROWSE_KEYCAPS),
    }


def recommendation_pool_counts() -> dict[str, int]:
    return {
        "switch": len(SWITCHES),
        "plate": len(PLATES),
        "foam": len(FOAM),
        "layout": len(LAYOUTS),
        "case": len(CASES),
        "keycap": len(KEYCAPS),
    }
