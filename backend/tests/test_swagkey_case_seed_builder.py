from __future__ import annotations

import json
from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_case_seed_builder import (
    infer_kit_type,
    infer_layout_size,
    load_case_kit_candidates,
    merge_case_kits_into_seed,
    validate_case_stub,
    build_case_stub_row,
)

_DATA = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
_SEED = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "keyboard_recommender"
    / "catalog"
    / "swagkey_products.seed.json"
)


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("NEO65 Core Plus 커스텀 기계식 키보드", "kit"),
        ("[GB] Agar Micro 파츠", "parts"),
        ("NEO65 Sonic He+ 키보드", "he_kit"),
        ("베어본 키보드 킷", "barebone"),
    ],
)
def test_infer_kit_type(name: str, expected: str) -> None:
    assert infer_kit_type(name) == expected


def test_infer_layout_size_from_name() -> None:
    assert infer_layout_size("NEO65 Core Plus") == "65"
    assert infer_layout_size("DP104 알루미늄") == "full"


def test_build_case_stub_validates() -> None:
    stub = build_case_stub_row(
        {"id": "inv-0002", "productName": "NEO65 Core Plus 커스텀 기계식 키보드", "brand": "NEO STUDIO"},
        index=1,
        inventory_row={"sourceUrl": "https://www.swagkey.kr/22/?idx=1415"},
    )
    assert stub["id"] == "case-001"
    assert stub["sourceUrl"].startswith("https://")
    assert not validate_case_stub(stub)


def test_merge_case_kits_integration() -> None:
    candidates_path = _DATA / "recommender_candidates.json"
    inventory_path = _DATA / "swagkey_inventory.v2.json"
    if not candidates_path.is_file() or not inventory_path.is_file():
        pytest.skip("inventory artifacts missing")

    seed_payload = json.loads(_SEED.read_text(encoding="utf-8"))
    before = len(seed_payload.get("cases") or [])
    merged, report = merge_case_kits_into_seed(seed_payload, candidates_path, inventory_path)
    after = len(merged.get("cases") or [])

    assert report.rejected == []
    if before == 0:
        assert report.added == 49
        assert after == 49
    else:
        assert report.added == 0
        assert after == before

    candidates = load_case_kit_candidates(candidates_path)
    assert len(candidates) >= 49

    first = (merged.get("cases") or [])[0]
    assert first.get("metadata", {}).get("kit_type")
    assert not validate_case_stub(first)
