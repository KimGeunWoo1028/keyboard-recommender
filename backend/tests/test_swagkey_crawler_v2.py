from __future__ import annotations

import json
from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_crawler_v2 import (
    build_category_page_url,
    build_search_page_url,
    crawl_category_pages,
    crawl_search_keyword,
    extract_product_id_from_url,
    merge_crawl_into_inventory_by_idx,
    merge_crawled_products_by_idx,
    merge_urls_into_inventory_items,
    normalize_source_url,
    parse_products_from_category_html,
    parse_products_from_search_html,
    resolve_canonical_product_url,
)
from keyboard_recommender.catalog.swagkey_new_in_crawl_targets import (
    assign_stub_id,
    build_new_in_crawl_target_rows,
    build_spec_targets_payload,
    generate_new_in_crawl_targets,
)


FIXTURE_HTML = (
    Path(__file__).resolve().parent / "fixtures" / "swagkey_category_switches_sample.html"
)


def test_parse_products_from_category_html_fixture() -> None:
    html = FIXTURE_HTML.read_text(encoding="utf-8")
    rows = parse_products_from_category_html(html, category="Switches")
    names = {row.product_name for row in rows}
    assert "Neo Rye 라이 리니어 스위치" in names
    assert "Keygeek 오트 리니어 스위치" in names
    assert all(row.swagkey_product_id for row in rows)
    assert all(row.source_url.startswith("https://www.swagkey.kr/") for row in rows)


def test_extract_product_id_and_normalize_source_url() -> None:
    url = normalize_source_url("/21/?idx=993")
    assert url == "https://www.swagkey.kr/21/?idx=993"
    assert extract_product_id_from_url(url) == "993"


def test_resolve_canonical_product_url() -> None:
    html = '<html><head><link rel="canonical" href="https://www.swagkey.kr/39/?idx=993"></head></html>'
    assert resolve_canonical_product_url(html, fallback_url="https://www.swagkey.kr/21/?idx=993") == (
        "https://www.swagkey.kr/39/?idx=993"
    )


def test_build_category_page_url() -> None:
    assert build_category_page_url("https://www.swagkey.kr/21", 1) == "https://www.swagkey.kr/21"
    assert build_category_page_url("https://www.swagkey.kr/21", 2) == "https://www.swagkey.kr/21?page=2"


def test_build_search_page_url() -> None:
    assert build_search_page_url("Alice") == "https://www.swagkey.kr/search?keyword=Alice"
    assert build_search_page_url("베어본", 2) == "https://www.swagkey.kr/search?keyword=%EB%B2%A0%EC%96%B4%EB%B3%B8&page=2"


def test_parse_products_from_search_html_live_snippet() -> None:
    from keyboard_recommender.catalog.swagkey_spec_scraper import fetch_html

    html = fetch_html("https://www.swagkey.kr/search?keyword=Alice")
    rows = parse_products_from_search_html(html, keyword="Alice")
    assert len(rows) >= 5
    assert any("Alice" in row.product_name for row in rows)
    assert all(row.swagkey_product_id for row in rows)


def test_merge_crawl_into_inventory_by_idx_appends_new() -> None:
    crawled = parse_products_from_category_html(FIXTURE_HTML.read_text(encoding="utf-8"), category="Switches")
    assert crawled
    inventory_items = [
        {
            "id": "inv-0001",
            "productName": crawled[0].product_name,
            "normalizedName": crawled[0].normalized_name,
            "sourceUrl": "https://www.swagkey.kr/21/?idx=999",
            "swagkeyProductId": crawled[0].swagkey_product_id,
        },
    ]
    merged, stats = merge_crawl_into_inventory_by_idx(inventory_items, crawled)
    assert stats["matched"] >= 1
    assert stats["appended_new"] >= len(crawled) - 1
    assert len(merged) == len(inventory_items) + stats["appended_new"]


def test_merge_crawled_products_by_idx_prefers_later_group() -> None:
    first = parse_products_from_category_html(FIXTURE_HTML.read_text(encoding="utf-8"), category="Switches")
    second = [
        first[0].__class__(
            category="Keyboards",
            brand=first[0].brand,
            product_name=first[0].product_name,
            source_url=first[0].source_url,
            swagkey_product_id=first[0].swagkey_product_id,
            normalized_name=first[0].normalized_name,
        ),
    ]
    merged = merge_crawled_products_by_idx(first, second)
    by_id = {row.swagkey_product_id: row for row in merged}
    assert by_id[first[0].swagkey_product_id].category == "Keyboards"


def test_crawl_search_keyword_uses_fetcher() -> None:
    from keyboard_recommender.catalog.swagkey_spec_scraper import fetch_html

    rows, pages = crawl_search_keyword("Alice", fetch_html, max_pages=1, sleep_ms=0)
    assert pages == 1
    assert len(rows) >= 1


def test_merge_urls_into_inventory_items() -> None:
    html = FIXTURE_HTML.read_text(encoding="utf-8")
    crawled = parse_products_from_category_html(html, category="Switches")
    inventory_items = [
        {"id": "inv-1", "productName": "Neo Rye 라이 리니어 스위치", "normalizedName": "Neo Rye 라이 리니어 스위치"},
        {"id": "inv-2", "productName": "없는 제품", "normalizedName": "없는 제품"},
    ]
    merged, stats = merge_urls_into_inventory_items(inventory_items, crawled)
    assert stats["matched"] == 1
    assert stats["unmatched"] == 1
    assert merged[0]["sourceUrl"].endswith("idx=1281")
    assert merged[0]["swagkeyProductId"] == "1281"


def test_crawl_category_pages_uses_fetcher() -> None:
    html = FIXTURE_HTML.read_text(encoding="utf-8")

    def fetcher(_url: str) -> str:
        return html

    rows, pages = crawl_category_pages("Switches", "https://www.swagkey.kr/21", fetcher, max_pages=2, sleep_ms=0)
    assert pages == 2
    assert len(rows) == 3


def test_new_in_crawl_target_generation() -> None:
    diff_rows = [
        {
            "family": "switch",
            "crawl_id": "inv-0086",
            "crawl_name": "TTC 아이스 프로즌 저소음 V2",
            "crawl_category": "Switches",
            "crawl_brand": "TTC",
        },
        {
            "family": "plate",
            "crawl_id": "inv-0003",
            "crawl_name": "NEO65 Core Plus 보강판",
            "crawl_category": "Keyboards",
            "crawl_brand": "NEO STUDIO",
        },
    ]
    inventory_payload = {
        "items": [
            {
                "id": "inv-0086",
                "productName": "TTC 아이스 프로즌 저소음 V2",
                "sourceUrl": "https://www.swagkey.kr/21/?idx=596",
                "swagkeyProductId": "596",
            },
            {"id": "inv-0003", "productName": "NEO65 Core Plus 보강판"},
        ],
    }
    rows, report = build_new_in_crawl_target_rows(diff_rows, inventory_payload)
    assert report.with_url == 1
    assert report.missing_url == 1
    payload = build_spec_targets_payload(rows, report=report)
    assert len(payload["switchTargets"]["switches"]) == 1
    assert payload["switchTargets"]["switches"][0]["url"].endswith("idx=596")
    assert assign_stub_id("switch", 1, "TTC Test").startswith("sw-new-001-")


def test_generate_new_in_crawl_targets_on_project_data() -> None:
    data_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    diff_path = data_dir / "seed_inventory_diff.json"
    inventory_path = data_dir / "swagkey_inventory.v4.json"
    if not inventory_path.is_file():
        inventory_path = data_dir / "swagkey_inventory.v2.json"
    if not diff_path.is_file():
        pytest.skip("seed_inventory_diff.json missing")
    if not inventory_path.is_file():
        pytest.skip("swagkey inventory json missing (run crawler v2 pipeline first)")

    diff_payload = json.loads(diff_path.read_text(encoding="utf-8"))
    expected_new = int(diff_payload.get("stats", {}).get("newInCrawl", -1))
    assert expected_new in (0, 15, 46), f"unexpected newInCrawl in diff: {expected_new}"

    payload, report, _ = generate_new_in_crawl_targets(diff_path, inventory_path)
    assert report.total_new_in_crawl == expected_new

    if expected_new == 46:
        assert report.with_url >= 40
        stats = payload["stats"]
        assert stats["switchTargets"] >= 15
        assert stats["plateTargets"] + stats["foamTargets"] >= 10
    elif expected_new == 15:
        assert report.with_url >= 10
        assert payload["stats"]["totalNewInCrawl"] == 15
    else:
        assert report.with_url == 0
        assert payload["stats"]["totalNewInCrawl"] == 0
