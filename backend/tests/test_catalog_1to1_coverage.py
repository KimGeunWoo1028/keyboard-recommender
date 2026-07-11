from __future__ import annotations

from pathlib import Path

import pytest

from keyboard_recommender.catalog.catalog_1to1_coverage import (
    COVERAGE_GAP_THRESHOLD_PCT,
    audit_catalog_1to1_coverage,
    check_coverage_gap_thresholds,
)


@pytest.fixture
def inventory_paths() -> tuple[Path, Path, Path]:
    backend = Path(__file__).resolve().parents[1]
    inventory_dir = backend / "data" / "swagkey_inventory"
    seed = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    return seed, inventory_dir / "swagkey_inventory.v3.json", inventory_dir / "recommender_candidates.json"


def test_audit_catalog_1to1_coverage_produces_all_families(inventory_paths: tuple[Path, Path, Path]) -> None:
    seed, inventory, candidates = inventory_paths
    report = audit_catalog_1to1_coverage(
        seed_path=seed,
        inventory_path=inventory,
        candidates_path=candidates,
    )
    assert set(report.families) == {"switch", "plate", "foam", "layout", "case", "keycap"}
    assert report.summary_lines
    assert report.layout_archetype["seed_archetype_count"] == 7


def test_keycap_browse_matches_seed_after_phase3(inventory_paths: tuple[Path, Path, Path]) -> None:
    seed, inventory, candidates = inventory_paths
    report = audit_catalog_1to1_coverage(
        seed_path=seed,
        inventory_path=inventory,
        candidates_path=candidates,
    )
    keycap = report.families["keycap"]
    assert keycap["seed_count"] >= 60
    assert keycap["browse_count"] == keycap["seed_count"]
    assert keycap["gap_inventory_vs_browse"] <= 10


def test_layout_browse_splits_archetype_and_real_pcb(inventory_paths: tuple[Path, Path, Path]) -> None:
    seed, inventory, candidates = inventory_paths
    report = audit_catalog_1to1_coverage(
        seed_path=seed,
        inventory_path=inventory,
        candidates_path=candidates,
    )
    layout = report.families["layout"]
    archetype = report.layout_archetype
    assert archetype["browse_archetype_count"] == 7
    assert layout["browse_count"] == archetype["browse_real_pcb_count"]
    assert layout["browse_count"] >= 30


def test_coverage_gap_threshold_check_runs(inventory_paths: tuple[Path, Path, Path]) -> None:
    seed, inventory, candidates = inventory_paths
    report = audit_catalog_1to1_coverage(
        seed_path=seed,
        inventory_path=inventory,
        candidates_path=candidates,
    )
    result = check_coverage_gap_thresholds(report, threshold_pct=COVERAGE_GAP_THRESHOLD_PCT)
    assert result.threshold_pct == COVERAGE_GAP_THRESHOLD_PCT
    assert isinstance(result.violations, tuple)
