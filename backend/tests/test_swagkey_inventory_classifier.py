from __future__ import annotations

from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_inventory import InventoryItem
from keyboard_recommender.catalog.swagkey_inventory_classifier import (
    RECOMMENDER_FAMILY_ORDER,
    classify_inventory_item,
    classify_inventory_items,
    classify_inventory_json_file,
    classify_product_name,
)


def _item(
    item_id: str,
    category: str,
    product_name: str,
    *,
    brand: str = "Test",
) -> InventoryItem:
    return InventoryItem(
        id=item_id,
        category=category,
        brand=brand,
        product_name=product_name,
        normalized_name=product_name,
    )


def test_classify_switch_plate_foam_layout_case_kit() -> None:
    assert classify_product_name("HMX Peach 리니어 스위치", category="Switches").family == "switch"
    assert classify_product_name("NEO65 Core Plus 보강판", category="Keyboards").family == "plate"
    assert classify_product_name("GDK Lab - DK1 TKL 여분 폼킷", category="Keyboards").family == "foam"
    assert classify_product_name("NEO65 Core Plus 기판", category="Keyboards").family == "layout"
    assert classify_product_name("NEO65 Cu 커스텀 기계식 키보드", category="Keyboards").family == "case_kit"


def test_classify_keycap_family_and_accessory_guard() -> None:
    assert classify_product_name("스웨그키 Calm Beige PBT 키캡", category="Keycaps").family == "keycap"
    assert classify_product_name("스웨그키 Calm Beige PBT 키캡", category="Keycaps").rule_id == "category:keycaps"
    assert classify_product_name("스웨그키 x Kyodiy 장패드", category="Deskpads").family == "out_of_scope"
    assert classify_product_name("크라이톡스 Krytox 205g0 5g", category="Accessories").family == "out_of_scope"
    assert classify_product_name("스웨그키 스위치 풀러", category="Accessories").family == "out_of_scope"
    assert classify_product_name("스웨그키 윤활제 키캡 클리너", category="Accessories").family == "out_of_scope"


def test_factory_lubed_switch_not_classified_as_lube() -> None:
    result = classify_product_name(
        "TTC 아이스 프로즌 저소음 V2 커스텀 기계식 키보드 스위치 공장윤활 사무용",
        category="Switches",
    )
    assert result.family == "switch"
    assert result.rule_id == "category:switches"


def test_classify_combo_plate_before_layout() -> None:
    result = classify_product_name("Bowl Oblique 기판 및 보강판", category="Keyboards")
    assert result.family == "plate"
    assert "보강판" in result.matched_keywords


def test_classify_english_plate_not_keyboards_fallback() -> None:
    result = classify_product_name("[In-Stock] Owlab Link65 Plate", category="Keyboards")
    assert result.family == "plate"
    assert result.rule_id == "keyword:plate"


def test_classify_keyboards_barebone_stays_case_kit() -> None:
    result = classify_product_name("[GB] QK Alice Duo Barebone Kit", category="Keyboards")
    assert result.family == "case_kit"


def test_classify_gaming_layout_and_mouse_out_of_scope() -> None:
    assert (
        classify_product_name("트랜지션 라이트 전용 MX 8K 게이밍 기판", category="Gaming").family == "layout"
    )
    assert classify_product_name("AM Infinity 무선 8K 게이밍 마우스", category="Gaming").family == "out_of_scope"


def test_classify_inventory_items_covers_all_families_once() -> None:
    items = [
        _item("1", "Switches", "Neo Rye 라이 리니어 스위치"),
        _item("2", "Keyboards", "NEO65 Core Plus 보강판"),
        _item("3", "Keyboards", "NEO65 Core Plus 기판"),
        _item("4", "Keyboards", "GDK Lab - DK1 TKL 여분 폼킷"),
        _item("5", "Keyboards", "NEO65 Cu 커스텀 기계식 키보드"),
        _item("6", "Keycaps", "SWG Euler ABS 키캡"),
    ]
    classified, report = classify_inventory_items(items)
    assert len(classified) == len(items)
    assert set(report.by_family) <= set(RECOMMENDER_FAMILY_ORDER)
    assert sum(report.by_family.values()) == len(items)
    assert report.by_family.get("keycap") == 1


def test_classify_inventory_json_file_on_v4_data() -> None:
    inventory_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "swagkey_inventory"
        / "swagkey_inventory.v4.json"
    )
    if not inventory_path.is_file():
        pytest.skip("inventory v4 json not generated yet")

    classified, report, payload = classify_inventory_json_file(inventory_path)
    assert report.total_items == 400
    assert report.by_family.get("keycap", 0) == 67
    assert report.by_rule.get("category:keycaps", 0) == 67
    assert report.by_family.get("out_of_scope", 0) == 100
    assert report.by_family.get("plate", 0) == 20
    assert report.by_family.get("case_kit", 0) == 126
    assert "keycap" in payload["candidates"]
    assert len(payload["candidates"]["keycap"]) == 67


def test_classify_inventory_json_file_on_project_data() -> None:
    inventory_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "swagkey_inventory"
        / "swagkey_inventory.v1.json"
    )
    if not inventory_path.is_file():
        pytest.skip("inventory v1 json not generated yet")

    classified, report, payload = classify_inventory_json_file(inventory_path)
    assert report.total_items == 293
    assert len(classified) == 293
    assert sum(report.by_family.values()) == 293
    assert report.by_family.get("switch", 0) == 54
    assert report.by_rule.get("category:switches", 0) == 54
    assert report.by_family.get("plate", 0) >= 14
    assert report.by_family.get("layout", 0) >= 15
    assert report.by_family.get("foam", 0) >= 3
    assert report.by_family.get("case_kit", 0) >= 25
    assert report.by_family.get("keycap", 0) == 65
    assert report.by_family.get("out_of_scope", 0) == 88

    for family in RECOMMENDER_FAMILY_ORDER:
        assert family in payload["candidates"]
    assert payload["stats"]["recommenderCandidateCount"] == sum(
        report.by_family.get(f, 0) for f in RECOMMENDER_FAMILY_ORDER if f != "out_of_scope"
    )
    assert classify_inventory_item(_item("x", "Switches", "Cherry MX2A Honey 택타일")).family == "switch"
