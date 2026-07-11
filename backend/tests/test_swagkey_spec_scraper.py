from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_spec_scraper import (
    html_to_text,
    load_component_targets,
    parse_foam_spec_from_text,
    parse_plate_spec_from_text,
    parse_switch_spec_from_html,
    parse_switch_spec_from_text,
)


def test_html_to_text_removes_tags() -> None:
    src = "<html><body><h1>Title</h1><script>bad()</script><p>스프링 압 45g</p></body></html>"
    out = html_to_text(src)
    assert "Title" in out
    assert "45g" in out
    assert "bad()" not in out


def test_parse_switch_spec_from_text_extracts_core_metrics() -> None:
    text = """
    작동압: 45g
    바텀아웃: 58g
    총 트래블: 3.8mm
    입력 지점: 1.9mm
    롱폴
    factory lubed
    리니어 / 도각
    """
    out = parse_switch_spec_from_text(text)
    assert out["spring_weight_g"] == 45
    assert out["bottom_out_force_g"] == 58
    assert out["travel_distance_mm"] == 3.8
    assert out["pretravel_mm"] == 1.9
    assert out["long_pole"] is True
    assert out["factory_lubed"] is True
    assert "linear" in out["sound_signature_tags"]
    assert "thocky" in out["sound_signature_tags"]


def test_parse_switch_spec_from_html_detects_unlubed_and_materials() -> None:
    html = """
    <div>
      <p>비윤활 스위치</p>
      <p>Top Housing: POM</p>
      <p>Bottom Housing: Nylon</p>
      <p>Stem: LY</p>
      <p>Tactile</p>
    </div>
    """
    out = parse_switch_spec_from_html(html)
    assert out["factory_lubed"] is False
    assert out["housing_material_top"] == "POM"
    assert out["housing_material_bottom"] == "NYLON"
    assert out["stem_material"] == "LY"
    assert "tactile" in out["sound_signature_tags"]


def test_parse_plate_spec_from_text_extracts_layout_compat_fields() -> None:
    text = """
    Material: FR4
    Flex: 6
    ANSI / ISO support
    75% layout
    gasket mount
    exploded
    blocker
    """
    out = parse_plate_spec_from_text(text)
    assert out["material"] == "FR4"
    assert out["flex_rating"] == 6
    assert "75" in out["compatible_layout_sizes"]
    assert "ansi" in out["compatible_standards"]
    assert "iso" in out["compatible_standards"]
    assert out["supports_exploded"] is True
    assert out["supports_blockers"] is True


def test_parse_foam_spec_from_text_extracts_mount_and_tactile_preservation() -> None:
    text = """
    Dampening strength: 8
    soft compression
    plate foam
    TKL layout
    gasket mount
    """
    out = parse_foam_spec_from_text(text)
    assert out["dampening_strength"] == 8
    assert out["compression_character"] == "soft"
    assert out["placement_type"] == "plate"
    assert "80_tkl" in out["compatible_layout_sizes"]
    assert "gasket" in out["mounting_compatibility"]
    assert out["tactile_preservation"] in {"medium", "low"}


def test_load_component_targets_reads_family_list(tmp_path: Path) -> None:
    p = tmp_path / "targets.json"
    p.write_text(
        json.dumps(
            {
                "plates": [{"id": "plate-001", "url": "https://example.com/p1", "name": "plate"}],
                "foams": [{"id": "foam-001", "url": "https://example.com/f1", "name": "foam"}],
            },
        ),
        encoding="utf-8",
    )
    plates = load_component_targets(p, "plates")
    foams = load_component_targets(p, "foams")
    assert len(plates) == 1 and plates[0].id == "plate-001"
    assert len(foams) == 1 and foams[0].id == "foam-001"

