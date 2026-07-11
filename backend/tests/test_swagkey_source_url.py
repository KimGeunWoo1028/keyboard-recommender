from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.application.catalog_browse_service import get_catalog_part
from keyboard_recommender.catalog.swagkey_source_url import (
    fix_seed_source_urls,
    is_product_detail_url,
    load_swagkey_url_resolver,
    resolve_source_url,
)

_DATA = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
_SEED = Path(__file__).resolve().parents[1] / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
_INVENTORY = _DATA / "swagkey_inventory.v2.json"
_DIFF = _DATA / "seed_inventory_diff.json"


def _resolver():
    return load_swagkey_url_resolver(_INVENTORY, diff_path=_DIFF)


def test_is_product_detail_url() -> None:
    assert is_product_detail_url("https://www.swagkey.kr/21/?idx=1765")
    assert not is_product_detail_url("https://www.swagkey.kr/39")
    assert not is_product_detail_url("https://www.swagkey.kr/21")


def test_resolve_source_url_uses_seed_diff_mapping() -> None:
    resolved = resolve_source_url(
        "스웨그키 HMX Peach 반저소음 리니어 키보드 스위치",
        "https://www.swagkey.kr/39",
        resolver=_resolver(),
        seed_id="sw-linear-003",
    )
    assert resolved == "https://www.swagkey.kr/shop_view/?idx=1765"


def test_fix_seed_source_urls_resolves_name_changed_rows() -> None:
    seed_payload = json.loads(_SEED.read_text(encoding="utf-8"))
    linear = seed_payload["switches"]["linear"]
    seed_payload["switches"]["linear"] = [
        {**row, "sourceUrl": "https://www.swagkey.kr/39"} if row.get("id") == "sw-linear-003" else row
        for row in linear
    ]
    fixed, report = fix_seed_source_urls(seed_payload, resolver=_resolver())
    assert report.fixed >= 1
    peach = next(row for row in fixed["switches"]["linear"] if row.get("id") == "sw-linear-003")
    assert peach["sourceUrl"].endswith("idx=1765")


def test_catalog_browse_resolves_category_url_at_runtime() -> None:
    detail = get_catalog_part("switch", "sw-linear-003")
    assert detail is not None
    assert is_product_detail_url(detail.source_url)
    assert "idx=1765" in detail.source_url


def test_resolve_foam_wrong_category_path_uses_inventory_canonical() -> None:
    """Foam seed rows used /132/?idx=… — emit stable shop_view URL."""
    resolved = resolve_source_url(
        "포론 하부 흡음재",
        "https://www.swagkey.kr/132/?idx=253",
        resolver=_resolver(),
        seed_id="foam-001",
    )
    assert resolved == "https://www.swagkey.kr/shop_view/?idx=253"


def test_normalize_product_detail_url_prefers_shop_view() -> None:
    from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url

    assert normalize_product_detail_url("https://www.swagkey.kr/24/?idx=524") == (
        "https://www.swagkey.kr/shop_view/?idx=524"
    )


def test_catalog_browse_foam_returns_shop_view_url() -> None:
    detail = get_catalog_part("foam", "foam-001")
    assert detail is not None
    assert detail.source_url == "https://www.swagkey.kr/shop_view/?idx=253"
