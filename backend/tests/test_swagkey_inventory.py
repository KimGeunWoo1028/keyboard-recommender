from __future__ import annotations

from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_inventory import (
    clean_inventory_rows,
    clean_inventory_csv_file,
    guess_brand_from_product_name,
    is_discount_only,
    is_numeric_brand,
    parse_inventory_csv,
)


SAMPLE_CSV = """\
category,brand,product_name
Main,스웨그키,Keygeek 오트 리니어 스위치
Switches,스웨그키,Keygeek 오트 리니어 스위치
Switches,1,TTC 아이스 프로즌 저소음 V2 커스텀 기계식 키보드 스위치 공장윤활 사무용
Switches,Haimu 스노우 저소음 자석축 키보드 스위치,50%
Keyboards,스웨그키,트랜지션 라이트 전용 MX 8K 게이밍 기판
Gaming,스웨그키,트랜지션 라이트 전용 MX 8K 게이밍 기판
Accessories,247,스웨그키 윤활붓
Accessories,0,NANCH 난치 정밀 드라이버
"""


def test_discount_and_numeric_brand_helpers() -> None:
    assert is_discount_only("50%")
    assert is_discount_only("10")
    assert not is_discount_only("HMX Peach 스위치")
    assert is_numeric_brand("0")
    assert is_numeric_brand("247")
    assert not is_numeric_brand("HMX")
    assert guess_brand_from_product_name("[GB] KAP Santa LLum") == "KAP"


def test_clean_inventory_rows_rules() -> None:
    rows = parse_inventory_csv(SAMPLE_CSV)
    items, report = clean_inventory_rows(rows)

    names = {item.product_name for item in items}
    assert "Keygeek 오트 리니어 스위치" in names
    assert "TTC 아이스 프로즌 저소음 V2 커스텀 기계식 키보드 스위치 공장윤활 사무용" in names
    assert "트랜지션 라이트 전용 MX 8K 게이밍 기판" in names
    assert "스웨그키 윤활붓" in names
    assert "NANCH 난치 정밀 드라이버" in names

    assert "50%" not in names
    assert report.removals_by_reason.get("discount_only_product_name") == 1
    assert report.removals_by_reason.get("duplicate_cross_category") == 2
    assert report.brand_corrections >= 3

    switch_oat = next(i for i in items if i.product_name == "Keygeek 오트 리니어 스위치")
    assert switch_oat.category == "Switches"

    gaming_plate = next(i for i in items if "트랜지션 라이트 전용 MX" in i.product_name)
    assert gaming_plate.category == "Keyboards"

    lubing = next(i for i in items if i.product_name == "스웨그키 윤활붓")
    assert lubing.brand == "스웨그키"


def test_parse_inventory_csv_requires_header() -> None:
    with pytest.raises(ValueError, match="missing columns"):
        parse_inventory_csv("bad,header\n")


def test_clean_inventory_csv_file_on_project_copy() -> None:
    csv_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "swagkey_inventory"
        / "swagkey_products.csv"
    )
    if not csv_path.is_file():
        pytest.skip("inventory csv not copied yet")

    items, report, payload = clean_inventory_csv_file(csv_path)
    assert report.input_row_count == 322
    assert report.kept_count > 0
    assert report.kept_count + report.removed_count == report.input_row_count
    assert len(items) == report.kept_count
    assert len(payload["items"]) == report.kept_count
    assert payload["schemaVersion"] == "1.0.0"
    assert report.removals_by_reason.get("discount_only_product_name", 0) >= 20
    assert report.brand_corrections >= 40
