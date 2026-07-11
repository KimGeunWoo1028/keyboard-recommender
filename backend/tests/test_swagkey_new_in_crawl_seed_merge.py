from __future__ import annotations

import json
from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_new_in_crawl_seed_merge import (
    MERGE_FAMILY_ORDER,
    build_stub_row,
    count_seed_items,
    infer_switch_subtype,
    merge_new_in_crawl_into_seed,
    refine_switch_sound_tags,
    validate_enriched_stub,
)

_DATA = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
_SEED = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "keyboard_recommender"
    / "catalog"
    / "swagkey_products.seed.json"
)
_BASELINE_COUNTS = {"switch": 55, "plate": 4, "foam": 5, "layout": 7}
_MERGED_COUNTS = {"switch": 67, "plate": 14, "foam": 9, "layout": 22}
_NEW_IN_CRAWL_ADDED = {"switch": 17, "plate": 10, "foam": 4, "layout": 15}
_NEW_IN_CRAWL_TOTAL = sum(_NEW_IN_CRAWL_ADDED.values())


def _manifest_new_in_crawl_count(manifest: dict) -> int:
    stats = manifest.get("stats")
    if isinstance(stats, dict) and stats.get("totalNewInCrawl") is not None:
        return int(stats["totalNewInCrawl"])
    total = 0
    switch_targets = manifest.get("switchTargets")
    if isinstance(switch_targets, dict):
        total += len(switch_targets.get("switches") or [])
    compat_targets = manifest.get("compatTargets")
    if isinstance(compat_targets, dict):
        total += len(compat_targets.get("plates") or [])
        total += len(compat_targets.get("foams") or [])
    layout_targets = manifest.get("layoutTargets")
    if isinstance(layout_targets, dict):
        total += len(layout_targets.get("layouts") or [])
    return total


def test_merge_family_priority_order() -> None:
    assert MERGE_FAMILY_ORDER == ("plate", "foam", "layout", "switch")


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Cherry MX2A Blossom 리니어 스위치", "linear"),
        ("TTC 아이스 프로즌 저소음 V2 스위치", "silent"),
        ("Cherry MX2A 비윤활 흑축 키보드 스위치", "click"),
        ("Wuque Flux HE 자석축 키보드 스위치 (N극)", "magnetic"),
        ("Haimu 스노우 저소음 자석축 키보드 스위치", "magnetic"),
    ],
)
def test_infer_switch_subtype(name: str, expected: str) -> None:
    assert infer_switch_subtype(name) == expected


def test_refine_switch_sound_tags_strips_scraper_noise() -> None:
    noisy = ["click", "linear", "magnetic", "silent", "tactile"]
    refined = refine_switch_sound_tags("Cherry MX2A Blossom 리니어 스위치", "linear", noisy)
    assert refined == ["linear"]


def test_build_plate_stub_enriches_metadata() -> None:
    target = {
        "id": "plate-new-test",
        "name": "NEO65 Core Plus 보강판",
        "url": "https://www.swagkey.kr/22/?idx=1520",
    }
    stub = build_stub_row(target, family="plate", spec_meta={"material": "PC"})
    assert stub["category"] == "plate"
    assert stub["metadata"]["material"] == "PC"
    assert stub["metadata"].get("flex_rating") is not None
    assert not validate_enriched_stub(stub, family="plate", subtype="plate")


def test_merge_new_in_crawl_integration_adds_46_rows() -> None:
    manifest_path = _DATA / "new_in_crawl_targets" / "new_in_crawl_targets_manifest.json"
    if not manifest_path.is_file():
        pytest.skip("new_in_crawl manifest not generated yet")

    seed_payload = json.loads(_SEED.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    switch_specs = json.loads(
        (_DATA / "new_in_crawl_specs" / "new_in_crawl_switch_specs.json").read_text(encoding="utf-8"),
    )
    compat_specs = json.loads(
        (_DATA / "new_in_crawl_specs" / "new_in_crawl_compat_specs.json").read_text(encoding="utf-8"),
    )

    merged, report = merge_new_in_crawl_into_seed(seed_payload, manifest, switch_specs, compat_specs)
    before = count_seed_items(seed_payload)
    after = count_seed_items(merged)
    manifest_count = _manifest_new_in_crawl_count(manifest)

    assert report.rejected == []

    if before == _BASELINE_COUNTS and manifest_count == _NEW_IN_CRAWL_TOTAL:
        assert report.added == _NEW_IN_CRAWL_ADDED
        assert after == {k: before[k] + _NEW_IN_CRAWL_ADDED[k] for k in before}
    elif before == _MERGED_COUNTS and manifest_count == _NEW_IN_CRAWL_TOTAL:
        assert sum(report.added.values()) == 0
        assert len(report.skipped_existing) == _NEW_IN_CRAWL_TOTAL
        assert after == before
    elif manifest_count == 0:
        assert sum(report.added.values()) == 0
        assert report.skipped_existing == []
        assert after == before
    else:
        pytest.fail(
            f"unexpected state: seed={before}, manifest_targets={manifest_count}; "
            f"expected baseline+46, merged+46, or empty manifest",
        )

    if before != _MERGED_COUNTS and manifest_count == 0:
        pytest.skip("manifest empty and seed not merged yet — run ③④ before ⑤")

    new_id = "plate-new-001-bowl-oblique-기판-및-보강판"
    plates = merged.get("plates") or []
    match = next((r for r in plates if r.get("id") == new_id), None)
    assert match is not None
    assert match.get("sourceUrl")
    assert match.get("metadata", {}).get("material") == "FR4"
    assert not validate_enriched_stub(match, family="plate", subtype="plate")


def test_merge_skips_existing_ids() -> None:
    seed_payload = json.loads(_SEED.read_text(encoding="utf-8"))
    manifest = {
        "compatTargets": {"plates": [{"id": "plate-001", "name": "dup", "url": "https://example.com"}]},
        "layoutTargets": {"layouts": []},
        "switchTargets": {"switches": []},
    }
    merged, report = merge_new_in_crawl_into_seed(seed_payload, manifest, {"switches": []}, {})
    assert report.skipped_existing == ["plate-001"]
    assert count_seed_items(merged) == count_seed_items(seed_payload)
