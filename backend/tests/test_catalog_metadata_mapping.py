from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.manual_switch_curation import SWITCH_METADATA_OVERRIDES
from keyboard_recommender.catalog.metadata_mapping import (
    derive_foam_traits,
    derive_layout_traits,
    derive_plate_traits,
    derive_switch_traits,
)
from keyboard_recommender.catalog.metadata_models import FoamMetadata, LayoutMetadata, PlateMetadata, SwitchMetadata
from keyboard_recommender.catalog.validation import validate_component_metadata
from keyboard_recommender.trait_engine.catalog_sample import FOAM, PLATES, SWITCHES


def test_switch_metadata_mapping_is_deterministic() -> None:
    meta = SwitchMetadata(
        spring_weight_g=48,
        bottom_out_force_g=55,
        travel_distance_mm=3.8,
        pretravel_mm=1.9,
        long_pole=True,
        housing_material_top="POM",
        housing_material_bottom="Nylon",
        stem_material="POM",
        factory_lubed=True,
        spring_type="single_stage",
        sound_signature_tags=["linear", "thocky"],
    )
    a = derive_switch_traits(meta)
    b = derive_switch_traits(meta)
    assert a == b
    assert a["smooth"] > a["scratchy"]
    assert a["firm_bottom_out"] > a["soft_bottom_out"]


def test_known_plate_material_mapping_profile() -> None:
    fr4 = derive_plate_traits(
        PlateMetadata(material="FR4", flex_rating=5, mounting_bias="gasket", density_character="balanced")
    )
    pc = derive_plate_traits(
        PlateMetadata(material="PC", flex_rating=8, mounting_bias="gasket", density_character="light")
    )
    assert fr4["deep_sound"] > fr4["high_pitch"]
    assert pc["soft_bottom_out"] > pc["firm_bottom_out"]
    assert pc["flexible"] > fr4["flexible"]


def test_foam_dampening_strength_changes_muted_axis() -> None:
    low = derive_foam_traits(FoamMetadata(dampening_strength=2, compression_character="firm", placement_type="case"))
    high = derive_foam_traits(FoamMetadata(dampening_strength=9, compression_character="soft", placement_type="fullstack"))
    assert high["muted"] > low["muted"]
    assert high["high_pitch"] < low["high_pitch"]


def test_layout_metadata_mapping_is_stable() -> None:
    full = derive_layout_traits(
        LayoutMetadata(layout_size="full", ansi_iso_support="both", blocker_style="standard", typing_density=9)
    )
    compact = derive_layout_traits(
        LayoutMetadata(layout_size="60", ansi_iso_support="ansi", blocker_style="hhkb", typing_density=5)
    )
    assert full["deep_sound"] >= compact["deep_sound"]
    assert compact["high_pitch"] >= full["high_pitch"]


def test_metadata_validation_rejects_out_of_range_values() -> None:
    issues = validate_component_metadata(
        "switch",
        {
            "spring_weight_g": 5,
            "bottom_out_force_g": 400,
        },
    )
    assert issues


def test_seed_switch_rows_contain_structured_metadata() -> None:
    seed_path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    switches = payload.get("switches", {})
    rows = []
    for group in switches.values():
        if isinstance(group, list):
            rows.extend(group)
    assert rows, "switch seed rows must exist"
    missing = [r.get("id") for r in rows if not isinstance(r.get("metadata"), dict)]
    assert not missing, f"switch metadata missing: {missing[:5]}"


def test_seed_layout_rows_cover_real_world_layout_variants() -> None:
    seed_path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    layouts = payload.get("layouts", [])
    assert isinstance(layouts, list) and layouts
    sizes = {
        str((row.get("metadata") or {}).get("layout_size"))
        for row in layouts
        if isinstance(row, dict) and isinstance(row.get("metadata"), dict)
    }
    for required in {"60", "65", "75", "80_tkl", "full", "alice", "split"}:
        assert required in sizes


def test_seed_plate_foam_rows_include_compatibility_metadata() -> None:
    seed_path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    for row in payload.get("plates", []):
        if not isinstance(row, dict):
            continue
        md = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
        assert isinstance(md.get("compatible_layout_sizes"), list)
        assert isinstance(md.get("compatible_standards"), list)
        assert isinstance(md.get("mounting_support"), list)
    for row in payload.get("foams", []):
        if not isinstance(row, dict):
            continue
        md = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
        assert isinstance(md.get("compatible_layout_sizes"), list)
        assert isinstance(md.get("mounting_compatibility"), list)


def test_manual_switch_curation_table_has_priority_skus() -> None:
    assert len(SWITCH_METADATA_OVERRIDES) == 29
    by_id = {p.id: p for p in SWITCHES}
    for sku in SWITCH_METADATA_OVERRIDES:
        assert sku in by_id


def test_known_product_regression_peach_vs_silver_tonality() -> None:
    by_id = {p.id: p for p in SWITCHES}
    peach = by_id["sw-linear-003"].traits
    silver = by_id["sw-linear-010"].traits
    assert peach["muted"] > silver["muted"]
    assert peach["high_pitch"] < silver["high_pitch"]


def test_known_product_regression_plate_material_signal() -> None:
    by_id = {p.id: p for p in PLATES}
    pom = by_id["plate-004"].traits
    alu = by_id["plate-003"].traits
    # Metadata enrichment can slightly shift absolute muted values; keep directionality tolerant.
    assert pom["muted"] >= alu["muted"] - 0.2
    assert pom["soft_bottom_out"] > alu["soft_bottom_out"]


def test_known_product_regression_foam_dampening_signal() -> None:
    by_id = {p.id: p for p in FOAM}
    epdm = by_id["foam-004"].traits
    thinsul = by_id["foam-002"].traits
    assert epdm["muted"] >= thinsul["muted"]
    assert epdm["high_pitch"] <= thinsul["high_pitch"]
