from __future__ import annotations

from keyboard_recommender.catalog.spec_enrichment import (
    merge_component_specs_into_seed,
    merge_switch_specs_into_seed,
    normalize_plate_spec,
    normalize_switch_spec,
)


def test_normalize_switch_spec_parses_numeric_strings() -> None:
    row = {
        "id": "sw-linear-001",
        "spring": "45g",
        "bottom_out": "58g",
        "total_travel": "3.8mm",
        "actuation": "1.9 mm",
        "sound_signature": "Muted/Thocky",
    }
    norm = normalize_switch_spec(row)
    assert norm["spring_weight_g"] == 45.0
    assert norm["bottom_out_force_g"] == 58.0
    assert norm["travel_distance_mm"] == 3.8
    assert norm["pretravel_mm"] == 1.9
    assert "muted" in norm["sound_signature_tags"]


def test_merge_switch_specs_into_seed_updates_matching_ids() -> None:
    seed = {
        "switches": {
            "linear": [
                {"id": "sw-linear-001", "name": "A", "metadata": {"spring_weight_g": 40}},
                {"id": "sw-linear-002", "name": "B", "metadata": {"spring_weight_g": 50}},
            ]
        }
    }
    specs = {
        "switches": [
            {"id": "sw-linear-001", "spring_weight_g": 47, "sound_signature_tags": ["thocky"]},
        ]
    }
    out = merge_switch_specs_into_seed(seed, specs)
    rows = out["switches"]["linear"]
    by_id = {r["id"]: r for r in rows}
    assert by_id["sw-linear-001"]["metadata"]["spring_weight_g"] == 47
    assert "thocky" in by_id["sw-linear-001"]["metadata"]["sound_signature_tags"]
    assert by_id["sw-linear-002"]["metadata"]["spring_weight_g"] == 50


def test_normalize_plate_spec_lowercases_compat_lists() -> None:
    row = {
        "id": "plate-001",
        "material": "FR4",
        "flex_rating": 6,
        "compatible_layout_sizes": ["65", "75"],
        "compatible_standards": ["ANSI", "ISO"],
        "mounting_support": ["Gasket", "Top"],
    }
    out = normalize_plate_spec(row)
    assert out["material"] == "FR4"
    assert out["flex_rating"] == 6
    assert out["compatible_standards"] == ["ansi", "iso"]
    assert out["mounting_support"] == ["gasket", "top"]


def test_merge_component_specs_into_seed_updates_plate_and_foam_metadata() -> None:
    seed = {
        "plates": [{"id": "plate-001", "metadata": {"material": "Aluminum"}}],
        "foams": [{"id": "foam-001", "metadata": {"dampening_strength": 5}}],
    }
    specs = {
        "plates": [{"id": "plate-001", "material": "FR4", "compatible_layout_sizes": ["75"]}],
        "foams": [{"id": "foam-001", "dampening_strength": 8, "tactile_preservation": "low"}],
    }
    out = merge_component_specs_into_seed(seed, specs)
    assert out["plates"][0]["metadata"]["material"] == "FR4"
    assert out["plates"][0]["metadata"]["compatible_layout_sizes"] == ["75"]
    assert out["foams"][0]["metadata"]["dampening_strength"] == 8
    assert out["foams"][0]["metadata"]["tactile_preservation"] == "low"

