from __future__ import annotations

from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_seed_inventory_diff import (
    CrawlCandidateItem,
    SeedCatalogItem,
    build_match_key,
    diff_seed_and_inventory,
    diff_seed_inventory_files,
    load_seed_catalog_items,
    name_similarity,
    pairing_allowed,
)


def test_build_match_key_strips_vendor_prefix() -> None:
    assert build_match_key("스웨그키 HMX Peach 반저소음 리니어") == build_match_key(
        "HMX Peach 반저소음 리니어",
    )


def test_name_similarity_detects_peach_name_variant() -> None:
    seed = "스웨그키 HMX Peach 반저소음 리니어 키보드 스위치"
    crawl = "스웨그키 HMX Peach 피치 반저소음 리니어 키보드 스위치"
    assert name_similarity(seed, crawl) >= 0.86


def test_diff_exact_match_and_name_changed() -> None:
    seed_items = [
        SeedCatalogItem("sw-1", "Keygeek 오트 리니어 스위치", "switch", "linear", ""),
        SeedCatalogItem("plate-1", "Shelby65 보강판", "plate", "plate", ""),
    ]
    crawl_items = [
        CrawlCandidateItem("inv-1", "Keygeek 오트 리니어 스위치", "switch", "Switches", "Keygeek"),
        CrawlCandidateItem(
            "inv-2",
            "스웨그키 HMX Peach 피치 반저소음 리니어 키보드 스위치",
            "switch",
            "Switches",
            "HMX",
        ),
        CrawlCandidateItem("inv-3", "Shelby65 보강판", "plate", "Keyboards", "스웨그키"),
        CrawlCandidateItem("inv-4", "NEO65 Core Plus 보강판", "plate", "Keyboards", "NEO STUDIO"),
    ]
    seed_items.append(
        SeedCatalogItem(
            "sw-2",
            "스웨그키 HMX Peach 반저소음 리니어 키보드 스위치",
            "switch",
            "linear",
            "",
        ),
    )

    records, report = diff_seed_and_inventory(seed_items, crawl_items, fuzzy_threshold=0.86)
    statuses = {row.status for row in records}
    assert "matched" in statuses
    assert "name_changed" in statuses
    assert "new_in_crawl" in statuses
    assert report.matched_count >= 2
    assert report.name_changed_count >= 1
    assert report.new_in_crawl_count >= 1
    assert (
        report.matched_count
        + report.name_changed_count
        + report.new_in_crawl_count
        + report.seed_only_count
        == len(records)
    )


def test_pairing_rejects_conflicting_switch_variants() -> None:
    assert not pairing_allowed(
        "Cherry MX2A 비윤활 갈축 키보드 스위치 - 450개 벌크",
        "Cherry MX2A 비윤활 흑축 키보드 스위치 - 450개 벌크",
    )
    assert pairing_allowed(
        "스웨그키 HMX Peach 반저소음 리니어 키보드 스위치",
        "스웨그키 HMX Peach 피치 반저소음 리니어 키보드 스위치",
    )


def test_diff_seed_inventory_files_on_project_data() -> None:
    backend = Path(__file__).resolve().parents[1]
    seed_path = backend / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
    candidates_path = backend / "data" / "swagkey_inventory" / "recommender_candidates.json"
    if not seed_path.is_file() or not candidates_path.is_file():
        pytest.skip("seed or candidates json not available")

    seed_items = load_seed_catalog_items(seed_path)
    records, report, payload = diff_seed_inventory_files(seed_path, candidates_path)

    seed_size = len(seed_items)
    assert seed_size >= 100
    assert report.matched_count + report.name_changed_count >= 40
    if report.new_in_crawl_count:
        assert all(
            row.recommendation_eligible is False
            for row in records
            if row.status == "new_in_crawl"
        )
    assert report.seed_only_count >= 0
    assert payload["stats"]["matched"] == report.matched_count
    assert len(payload["matched"]) == report.matched_count
    assert len(payload["name_changed"]) == report.name_changed_count
    assert len(payload["new_in_crawl"]) == report.new_in_crawl_count
    assert len(payload["seed_only"]) == report.seed_only_count
    assert payload["matched"][0].get("recommendation_eligible") is not None or report.matched_count == 0
    assert (
        len(payload["matched"])
        + len(payload["name_changed"])
        + len(payload["new_in_crawl"])
        + len(payload["seed_only"])
        == len(records)
    )
