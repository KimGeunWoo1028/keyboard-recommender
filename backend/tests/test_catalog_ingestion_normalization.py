from __future__ import annotations

from keyboard_recommender.catalog.ingestion_models import RawCatalogRecord
from keyboard_recommender.catalog.ingestion_normalize import (
    normalize_aliases,
    normalize_material,
    normalize_name,
    normalize_record,
    normalize_tags,
)


def test_basic_normalizers() -> None:
    assert normalize_name("  A   B  ") == "A B"
    assert normalize_material("alu") == "Aluminum"
    assert normalize_material("fr-4") == "FR4"
    assert normalize_tags([" A ", "a", "B"]) == ("a", "b")
    assert normalize_aliases(["  Foo ", "Foo", " Bar"]) == ("Foo", "Bar")


def test_normalize_record_normalizes_metadata_values() -> None:
    raw = RawCatalogRecord(
        source_type="vendor_pages",
        source_path="x.json",
        family="switch",
        item_id="sw-1",
        name="  Example   Switch ",
        subtype="linear",
        metadata={
            "spring_weight_g": "45g",
            "housing_material_top": "alu",
            "sound_signature_tags": [" Thocky ", "thocky", "Muted"],
        },
        tags=("Linear", "linear"),
        aliases=(" ex ", "ex"),
    )
    out = normalize_record(raw)
    assert out.name == "Example Switch"
    assert out.metadata["spring_weight_g"] == 45.0
    assert out.metadata["housing_material_top"] == "Aluminum"
    assert out.metadata["sound_signature_tags"] == ["thocky", "muted"]
    assert out.tags == ("linear",)
    assert out.aliases == ("ex",)

