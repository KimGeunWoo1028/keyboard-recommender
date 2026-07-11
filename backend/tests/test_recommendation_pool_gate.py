from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.application.catalog_browse_service import list_catalog_parts
from keyboard_recommender.trait_engine import catalog_sample


def test_recommendation_pool_excludes_browse_only_stubs() -> None:
    counts = catalog_sample.recommendation_pool_counts()
    assert counts["keycap"] <= 22
    assert counts["case"] <= 55
    assert counts["layout"] == 7
    assert counts["switch"] <= 70
    assert counts["keycap"] < len(catalog_sample.load_browse_seed_parts()["keycap"])


def test_browse_pool_still_lists_full_keycap_tab() -> None:
    payload = list_catalog_parts("keycap", limit=200)
    assert payload.total >= 50


def test_layout_recommend_pool_is_archetype_only() -> None:
    layout_ids = {part.id for part in catalog_sample.LAYOUTS}
    assert len(layout_ids) == 7
    assert all(part_id.startswith("layout-00") for part_id in layout_ids)


def test_is_recommendation_eligible_row_layout_real_pcb_false() -> None:
    row = {"id": "layout-idx-1416", "name": "PCB", "recommendationEligible": False}
    assert catalog_sample.is_recommendation_eligible_row(row, family="layout") is False


def test_is_recommendation_eligible_row_archetype_true() -> None:
    row = {"id": "layout-003", "name": "TKL archetype", "recommendationEligible": True}
    assert catalog_sample.is_recommendation_eligible_row(row, family="layout") is True


def test_recommendation_pool_counts_match_seed_policy() -> None:
    seed_path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    if not seed_path.is_file():
        return
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    expected_keycap = sum(
        1
        for row in payload.get("keycaps", [])
        if isinstance(row, dict) and catalog_sample.is_recommendation_eligible_row(row, family="keycap")
    )
    assert catalog_sample.recommendation_pool_counts()["keycap"] == expected_keycap
