from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_inventory_fetch import (
    fetch_inventory_product_images,
    load_inventory_items,
    load_product_images_artifact,
    write_inventory_fetch_report,
)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_BACKEND = _REPO_ROOT / "backend"
_DATA = _BACKEND / "data"
_INVENTORY = _DATA / "swagkey_inventory/swagkey_inventory.v2.json"
_ARTIFACT = _DATA / "swagkey_inventory/swagkey_product_images.json"
_SEED = _BACKEND / "src/keyboard_recommender/catalog/swagkey_products.seed.json"
_FOAM_HTML = _DATA / "swagkey_html_cache/foams/foam-001.html"


def _foam_html() -> str:
    return _FOAM_HTML.read_text(encoding="utf-8")


def test_fetch_inventory_product_images_resumes_existing(tmp_path: Path) -> None:
    existing = load_product_images_artifact(_ARTIFACT)
    inventory_rows = load_inventory_items(_INVENTORY)[:5]
    report = fetch_inventory_product_images(
        inventory_rows,
        existing_items=list(existing.get("items") or []),
        resume=True,
        network_enabled=False,
    )
    assert report.stats["skipped"] >= 0
    assert report.stats["resolved"] >= len(existing.get("items", []))


def test_fetch_inventory_product_images_mock_fetch(tmp_path: Path) -> None:
    inventory_rows = [
        {
            "id": "inv-test-1",
            "category": "Accessories",
            "productName": "Test Foam",
            "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=253",
            "swagkeyProductId": "253",
        }
    ]

    def _fake_fetch(url: str) -> str:
        assert "idx=253" in url
        return _foam_html()

    report = fetch_inventory_product_images(
        inventory_rows,
        existing_items=[],
        seed_payload={},
        resume=False,
        cache_dir=tmp_path / "cache",
        fetcher=_fake_fetch,
        sleep_ms=0,
        network_enabled=True,
    )
    assert report.stats["fetched"] == 1
    assert report.stats["resolved"] == 1
    assert report.failures == []
    item = report.items[0]
    assert item["swagkeyProductId"] == "253"
    assert item["imageUrl"].startswith("https://cdn.imweb.me/thumbnail/")
    assert item["matchMethod"] == "http_fetch"
    assert (tmp_path / "cache" / "253.html").is_file()


def test_fetch_inventory_product_images_parse_failure(tmp_path: Path) -> None:
    inventory_rows = [
        {
            "id": "inv-test-2",
            "productName": "Broken",
            "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=999999",
            "swagkeyProductId": "999999",
        }
    ]

    def _fake_fetch(url: str) -> str:
        return "<html><head><title>no og</title></head></html>"

    report = fetch_inventory_product_images(
        inventory_rows,
        existing_items=[],
        resume=False,
        fetcher=_fake_fetch,
        sleep_ms=0,
        network_enabled=True,
    )
    assert report.stats["fetched"] == 0
    assert report.stats["failed"] == 1
    assert report.failures[0].reason == "og_image_missing"


def test_write_inventory_fetch_report_roundtrip(tmp_path: Path) -> None:
    inventory_rows = [
        {
            "id": "inv-test-roundtrip",
            "productName": "Foam",
            "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=253",
            "swagkeyProductId": "253",
        }
    ]

    def _fake_fetch(url: str) -> str:
        return _foam_html()

    report = fetch_inventory_product_images(
        inventory_rows,
        existing_items=[],
        resume=False,
        fetcher=_fake_fetch,
        sleep_ms=0,
        network_enabled=True,
    )
    out_path = tmp_path / "swagkey_product_images.json"
    write_inventory_fetch_report(report, out_path)
    payload = json.loads(out_path.read_text(encoding="utf-8"))
    assert payload["schemaVersion"] == "1.0.0"
    assert payload["stats"]["resolved"] == 1
