#!/usr/bin/env python3
"""Crawl Swagkey category pages and collect product URLs (crawler v2, HTTP)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from keyboard_recommender.catalog.swagkey_crawler_v2 import (
    build_crawl_payload,
    crawl_all_categories,
    crawl_search_keywords,
    dedupe_crawled_products,
    merge_crawled_products_by_idx,
    save_crawl_csv,
)
from keyboard_recommender.catalog.swagkey_spec_scraper import fetch_html


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_dir = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
    parser.add_argument(
        "--out-json",
        type=Path,
        default=default_dir / "swagkey_crawl_urls.v2.json",
        help="Crawl output JSON",
    )
    parser.add_argument(
        "--out-csv",
        type=Path,
        default=default_dir / "swagkey_products_with_urls.csv",
        help="Crawl output CSV",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=20,
        help="Max pages per category",
    )
    parser.add_argument(
        "--sleep-ms",
        type=int,
        default=300,
        help="Delay between page fetches",
    )
    parser.add_argument(
        "--search",
        action="store_true",
        help="Run search supplement crawl and merge by idx (Phase 1 Task 1-2)",
    )
    parser.add_argument(
        "--search-max-pages",
        type=int,
        default=5,
        help="Max pages per search keyword",
    )
    parser.add_argument(
        "--search-keyword",
        action="append",
        default=[],
        dest="search_keywords",
        help="Search keyword (repeatable). Default: roadmap keyword set.",
    )
    args = parser.parse_args()

    category_products, report = crawl_all_categories(
        fetch_html,
        max_pages=max(1, args.max_pages),
        sleep_ms=max(0, args.sleep_ms),
    )
    search_pages: dict[str, int] = {}
    if args.search:
        search_products, search_pages = crawl_search_keywords(
            fetch_html,
            args.search_keywords or None,
            max_pages=max(1, args.search_max_pages),
            sleep_ms=max(0, args.sleep_ms),
        )
        products = merge_crawled_products_by_idx(category_products, search_products)
        report.unique_products = len(products)
        report.summary_lines.append(f"search keywords: {len(search_pages)}")
        report.summary_lines.append(f"search-only idx added: {max(0, len(products) - len(category_products))}")
    else:
        products = dedupe_crawled_products(category_products)

    report.generated_at = datetime.now(UTC).isoformat()
    payload = build_crawl_payload(products, report=report)
    if search_pages:
        payload["searchSupplement"] = {
            "keywords": list(search_pages.keys()),
            "pagesByKeyword": search_pages,
        }

    out_json = args.out_json.resolve()
    out_csv = args.out_csv.resolve()
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    save_crawl_csv(products, out_csv)

    print(f"wrote crawl json: {out_json} ({report.unique_products} products)")
    print(f"wrote crawl csv: {out_csv}")
    for line in report.summary_lines:
        print(line)
    if search_pages:
        for keyword, pages in search_pages.items():
            print(f"  search {keyword}: {pages} page(s)")
    if report.unique_products == 0:
        print("warning: no products collected", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
