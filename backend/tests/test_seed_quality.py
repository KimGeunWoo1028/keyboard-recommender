"""Roadmap ⑪ — seed quality cleanup."""

from __future__ import annotations


from keyboard_recommender.catalog.seed_quality import (
    SEED_REMOVE_IDS,
    SEED_URL_IDX_OVERRIDES,
    apply_seed_quality_cleanup,
)
from keyboard_recommender.catalog.swagkey_source_url import is_product_detail_url, shop_view_product_url


def test_seed_url_idx_overrides_use_shop_view() -> None:
    for seed_id, idx in SEED_URL_IDX_OVERRIDES.items():
        url = shop_view_product_url(idx)
        assert is_product_detail_url(url)
        assert "/shop_view/" in url


def test_apply_seed_quality_cleanup_removes_discontinued_and_sets_urls() -> None:
    seed = {
        "switches": {
            "linear": [
                {
                    "id": "sw-linear-004",
                    "name": "스웨그키 Keygeek DingDing 키보드 스위치 리니어",
                    "sourceUrl": "https://www.swagkey.kr/39",
                },
                {
                    "id": "sw-linear-006",
                    "name": "Gateron X 리니어 스위치",
                    "sourceUrl": "https://www.swagkey.kr/39",
                },
            ],
            "silent": [
                {
                    "id": "sw-silent-001",
                    "name": "스웨그키 HMX Peach 반저소음 리니어 키보드 스위치",
                    "sourceUrl": "https://www.swagkey.kr/21/?idx=1765",
                },
            ],
        },
        "layouts": [{"id": "layout-001", "name": "60% Standard", "sourceUrl": ""}],
    }
    cleaned, report = apply_seed_quality_cleanup(seed, html_cache_dir=None)
    linear_ids = [row["id"] for row in cleaned["switches"]["linear"]]
    silent_ids = [row["id"] for row in cleaned["switches"]["silent"]]

    assert "sw-linear-004" not in linear_ids
    assert "sw-silent-001" not in silent_ids
    assert len(report.removed) == 2

    gateron = next(row for row in cleaned["switches"]["linear"] if row["id"] == "sw-linear-006")
    assert gateron["sourceUrl"] == "https://www.swagkey.kr/shop_view/?idx=1668"


def test_remove_ids_frozen_set_documents_roadmap_actions() -> None:
    assert "sw-silent-001" in SEED_REMOVE_IDS
    assert "sw-linear-004" in SEED_REMOVE_IDS
    assert len(SEED_REMOVE_IDS) == 5
