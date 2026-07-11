from __future__ import annotations

import json
from pathlib import Path

import pytest

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id
from keyboard_recommender.catalog.swagkey_inventory_browse_seed_merge import (
    _iter_seed_rows,
    merge_inventory_into_browse_seed,
)
from keyboard_recommender.catalog.swagkey_new_in_crawl_seed_merge import count_seed_items

_PHASE3_MERGED_COUNTS = {
    "switch": 68,
    "plate": 20,
    "foam": 10,
    "layout": 45,
    "case": 126,
    "keycap": 62,
}


@pytest.fixture
def paths() -> tuple[Path, Path, Path, Path]:
    backend = Path(__file__).resolve().parents[1]
    inventory_dir = backend / "data" / "swagkey_inventory"
    seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    return (
        seed,
        inventory_dir / "swagkey_inventory.v4.json",
        inventory_dir / "recommender_candidates.json",
        inventory_dir / "case_layout_overrides.json",
    )


def test_browse_merge_idempotent_on_applied_seed(paths: tuple[Path, Path, Path, Path]) -> None:
    seed, inventory, candidates, overrides = paths
    if not all(p.is_file() for p in (seed, inventory, candidates)):
        pytest.skip("phase 3 fixtures missing")

    payload = json.loads(seed.read_text(encoding="utf-8"))
    before = count_seed_items(payload)
    merged, report = merge_inventory_into_browse_seed(
        payload,
        candidates_path=candidates,
        inventory_path=inventory,
        layout_overrides_path=overrides,
        dry_run=True,
    )
    after = count_seed_items(merged)
    assert after == before
    assert sum(report.added.values()) == 0
    assert after["keycap"] == _PHASE3_MERGED_COUNTS["keycap"]
    assert after["case"] == _PHASE3_MERGED_COUNTS["case"]


def test_browse_merge_preserves_layout_archetypes(paths: tuple[Path, Path, Path, Path]) -> None:
    seed, inventory, candidates, overrides = paths
    if not all(p.is_file() for p in (seed, inventory, candidates)):
        pytest.skip("phase 3 fixtures missing")

    payload = json.loads(seed.read_text(encoding="utf-8"))
    archetypes = {
        row["id"]: dict(row)
        for _, row in _iter_seed_rows(payload)
        if is_layout_archetype_part_id(str(row.get("id") or ""))
    }
    merged, _ = merge_inventory_into_browse_seed(
        payload,
        candidates_path=candidates,
        inventory_path=inventory,
        layout_overrides_path=overrides,
        dry_run=True,
    )
    after = {
        row["id"]: row
        for _, row in _iter_seed_rows(merged)
        if is_layout_archetype_part_id(str(row.get("id") or ""))
    }
    assert set(archetypes) == set(after)
    for part_id, before_row in archetypes.items():
        assert after[part_id]["name"] == before_row["name"]
        assert after[part_id].get("recommendationEligible") is True


def test_inventory_browse_stubs_default_recommendation_ineligible(
    paths: tuple[Path, Path, Path, Path],
) -> None:
    seed, inventory, candidates, overrides = paths
    if not all(p.is_file() for p in (seed, inventory, candidates)):
        pytest.skip("phase 3 fixtures missing")

    payload = json.loads(seed.read_text(encoding="utf-8"))
    inventory_stubs = [
        row
        for _, row in _iter_seed_rows(payload)
        if row.get("traitConfidence") == "name_inferred"
        and str(row.get("inventoryId") or "").startswith("inv-")
    ]
    assert len(inventory_stubs) >= 100
    assert all(row.get("recommendationEligible") is False for row in inventory_stubs)
