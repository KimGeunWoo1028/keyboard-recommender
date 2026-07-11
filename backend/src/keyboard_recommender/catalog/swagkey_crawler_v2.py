"""Swagkey product URL crawler helpers (HTTP/HTML parsing, no Selenium required)."""

from __future__ import annotations

import csv
import json
import re
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urljoin, urlparse, urlunparse

from keyboard_recommender.catalog.swagkey_inventory import normalize_product_name, normalize_whitespace
from keyboard_recommender.catalog.swagkey_seed_inventory_diff import build_match_key

CRAWLER_SCHEMA_VERSION = "1.0.0"
BASE_URL = "https://www.swagkey.kr"

CATEGORY_URLS: dict[str, str] = {
    "Main": f"{BASE_URL}/170",
    "Keyboards": f"{BASE_URL}/22",
    "Switches": f"{BASE_URL}/21",
    "Keycaps": f"{BASE_URL}/23",
    "Accessories": f"{BASE_URL}/24",
    "Deskpads": f"{BASE_URL}/25",
    "Gaming": f"{BASE_URL}/205",
}

_IDX_HREF_RE = re.compile(r'href="(?P<path>/\d+/\?idx=(?P<idx>\d+))"', re.IGNORECASE)
_SEARCH_IDX_HREF_RE = re.compile(
    r'href="(?P<path>(?:/\d+/\?idx=\d+|/shop_view/\?idx=\d+))"',
    re.IGNORECASE,
)
_H2_TITLE_RE = re.compile(r"<h2[^>]*>\s*(?P<name>[^<]+?)\s*</h2>", re.IGNORECASE)
_SEARCH_TITLE_RE = re.compile(
    r'<div class="text-16 text-bold">\s*(?P<name>[^<]+?)\s*</div>',
    re.IGNORECASE,
)
_SEARCH_BRAND_RE = re.compile(
    r'<p class="prod_brand0"[^>]*>\s*(?P<brand>[^<]+?)\s*</p>',
    re.IGNORECASE,
)
_BRAND_RE = re.compile(r'class="[^"]*brand[^"]*"[^>]*>\s*(?P<brand>[^<]+)', re.IGNORECASE)
_GB_PREFIX_RE = re.compile(r"^\[[^\]]+\]\s*")
_CANONICAL_RE = re.compile(r'rel="canonical"\s+href="(?P<url>[^"]+)"', re.IGNORECASE)
_PATH_SEGMENT_RE = re.compile(r"^/(\d+)/")

DEFAULT_SEARCH_KEYWORDS: tuple[str, ...] = (
    "Alice",
    "Split",
    "Arisu",
    "베어본",
    "GB",
    "Qwertykeys",
    "NEO",
    "Owlab",
    "KBDFANS",
)

# Keyword-specific category guard for search supplement (reduces accessory noise).
SEARCH_KEYWORD_ALLOW_CATEGORIES: dict[str, frozenset[str]] = {
    "Alice": frozenset({"Keyboards", "Keycaps", "Main"}),
    "Split": frozenset({"Keyboards", "Keycaps", "Main"}),
    "Arisu": frozenset({"Keyboards", "Keycaps", "Main"}),
    "베어본": frozenset({"Keyboards", "Main"}),
    "GB": frozenset({"Keyboards", "Keycaps", "Main"}),
    "Qwertykeys": frozenset({"Keyboards", "Keycaps", "Main"}),
    "NEO": frozenset({"Keyboards", "Keycaps", "Main"}),
    "Owlab": frozenset({"Keyboards", "Keycaps", "Main"}),
    "KBDFANS": frozenset({"Keyboards", "Keycaps", "Main"}),
}


@dataclass(frozen=True, slots=True)
class CrawledProductRecord:
    category: str
    brand: str
    product_name: str
    source_url: str
    swagkey_product_id: str
    normalized_name: str


@dataclass
class CrawlReport:
    schema_version: str = CRAWLER_SCHEMA_VERSION
    generated_at: str = ""
    categories_crawled: int = 0
    pages_fetched: int = 0
    raw_product_rows: int = 0
    unique_products: int = 0
    by_category: dict[str, int] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)


def clean_product_name(text: str) -> str:
    cleaned = normalize_product_name(text)
    for token in ("품절", "판매대기", "SOLD OUT", "텍스트"):
        cleaned = cleaned.replace(token, "")
    return normalize_whitespace(cleaned)


def guess_brand(product_name: str) -> str:
    name = _GB_PREFIX_RE.sub("", clean_product_name(product_name))
    return name.split()[0] if name else ""


def extract_product_id_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    from urllib.parse import parse_qs

    query = parse_qs(parsed.query)
    idx_vals = query.get("idx") or []
    if idx_vals and str(idx_vals[0]).isdigit():
        return str(idx_vals[0])
    return None


def normalize_source_url(path_or_url: str, *, base_url: str = BASE_URL) -> str:
    raw = (path_or_url or "").strip()
    if not raw:
        return ""
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw
    return urljoin(base_url, raw if raw.startswith("/") else f"/{raw}")


def resolve_canonical_product_url(document: str, *, fallback_url: str) -> str:
    match = _CANONICAL_RE.search(document)
    if not match:
        return fallback_url
    canonical = normalize_source_url(match.group("url"))
    return canonical or fallback_url


def parse_products_from_category_html(html: str, *, category: str) -> list[CrawledProductRecord]:
    """Extract unique products from one Swagkey category listing page."""
    seen_idx: OrderedDict[str, CrawledProductRecord] = OrderedDict()

    for link_match in _IDX_HREF_RE.finditer(html):
        idx = link_match.group("idx")
        if idx in seen_idx:
            continue
        chunk = html[link_match.start() : link_match.start() + 3000]
        title_match = _H2_TITLE_RE.search(chunk)
        if not title_match:
            continue
        product_name = clean_product_name(title_match.group("name"))
        if not product_name:
            continue
        brand_match = _BRAND_RE.search(chunk)
        brand = clean_product_name(brand_match.group("brand")) if brand_match else guess_brand(product_name)
        path = link_match.group("path")
        source_url = normalize_source_url(path)
        seen_idx[idx] = CrawledProductRecord(
            category=category,
            brand=brand or guess_brand(product_name),
            product_name=product_name,
            source_url=source_url,
            swagkey_product_id=idx,
            normalized_name=normalize_product_name(product_name),
        )
    return list(seen_idx.values())


def infer_category_from_source_path(path_or_url: str, *, default: str = "Keyboards") -> str:
    raw = str(path_or_url or "").strip()
    if raw.startswith("http"):
        raw = urlparse(raw).path
    match = _PATH_SEGMENT_RE.match(raw if raw.startswith("/") else f"/{raw.lstrip('/')}")
    if not match:
        return default
    segment = match.group(1)
    for category, category_url in CATEGORY_URLS.items():
        if category_url.rstrip("/").endswith(f"/{segment}"):
            return category
    return default


def parse_products_from_search_html(
    html: str,
    *,
    keyword: str = "",
    default_category: str = "Keyboards",
) -> list[CrawledProductRecord]:
    """Extract unique products from Swagkey site search results HTML."""
    seen_idx: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    allow_categories = SEARCH_KEYWORD_ALLOW_CATEGORIES.get(keyword)

    for link_match in _SEARCH_IDX_HREF_RE.finditer(html):
        path = link_match.group("path")
        idx = extract_product_id_from_url(normalize_source_url(path)) or ""
        if not idx or idx in seen_idx:
            continue
        chunk = html[link_match.start() : link_match.start() + 4000]
        title_match = _SEARCH_TITLE_RE.search(chunk)
        if not title_match:
            img_match = re.search(r'<img[^>]+title="(?P<name>[^"]+)"', chunk, re.IGNORECASE)
            if not img_match:
                continue
            product_name = clean_product_name(img_match.group("name").replace(" 이미지", ""))
        else:
            product_name = clean_product_name(title_match.group("name"))
        if not product_name:
            continue
        category = infer_category_from_source_path(path, default=default_category)
        if allow_categories is not None and category not in allow_categories:
            folded_keyword = keyword.casefold()
            folded_name = product_name.casefold()
            if folded_keyword and folded_keyword not in folded_name:
                continue
        brand_match = _SEARCH_BRAND_RE.search(chunk)
        brand = clean_product_name(brand_match.group("brand")) if brand_match else guess_brand(product_name)
        source_url = normalize_source_url(path)
        seen_idx[idx] = CrawledProductRecord(
            category=category,
            brand=brand or guess_brand(product_name),
            product_name=product_name,
            source_url=source_url,
            swagkey_product_id=idx,
            normalized_name=normalize_product_name(product_name),
        )
    return list(seen_idx.values())


def build_search_page_url(keyword: str, page: int = 1, *, base_url: str = BASE_URL) -> str:
    from urllib.parse import quote_plus

    query = quote_plus(keyword.strip())
    if page <= 1:
        return f"{base_url}/search?keyword={query}"
    return f"{base_url}/search?keyword={query}&page={page}"


def crawl_search_keyword(
    keyword: str,
    fetch_html_fn: Callable[[str], str],
    *,
    max_pages: int = 5,
    sleep_ms: int = 300,
    default_category: str = "Keyboards",
) -> tuple[list[CrawledProductRecord], int]:
    """Fetch paginated search results for one keyword."""
    merged: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    pages_fetched = 0
    for page in range(1, max(1, max_pages) + 1):
        page_url = build_search_page_url(keyword, page)
        html = fetch_html_fn(page_url)
        pages_fetched += 1
        batch = parse_products_from_search_html(html, keyword=keyword, default_category=default_category)
        new_count = 0
        for row in batch:
            if row.swagkey_product_id not in merged:
                merged[row.swagkey_product_id] = row
                new_count += 1
        if not batch or new_count == 0:
            break
        if sleep_ms > 0 and page < max_pages:
            time.sleep(sleep_ms / 1000.0)
    return list(merged.values()), pages_fetched


def crawl_search_keywords(
    fetch_html_fn: Callable[[str], str],
    keywords: list[str] | tuple[str, ...] | None = None,
    *,
    max_pages: int = 5,
    sleep_ms: int = 300,
) -> tuple[list[CrawledProductRecord], dict[str, int]]:
    """Run search supplement crawl for multiple keywords; dedupe by idx."""
    merged: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    pages_by_keyword: dict[str, int] = {}
    for keyword in keywords or DEFAULT_SEARCH_KEYWORDS:
        rows, pages = crawl_search_keyword(
            keyword,
            fetch_html_fn,
            max_pages=max_pages,
            sleep_ms=sleep_ms,
        )
        pages_by_keyword[keyword] = pages
        for row in rows:
            merged[row.swagkey_product_id] = row
    return list(merged.values()), pages_by_keyword


def merge_crawled_products_by_idx(
    *product_groups: list[CrawledProductRecord],
) -> list[CrawledProductRecord]:
    """Later groups win on idx collision (search supplement overrides category listing)."""
    merged: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    for group in product_groups:
        for row in group:
            merged[row.swagkey_product_id] = row
    return list(merged.values())


def build_category_page_url(category_url: str, page: int) -> str:
    if page <= 1:
        return category_url
    parsed = urlparse(category_url)
    query = parsed.query
    page_query = f"page={page}"
    merged_query = f"{query}&{page_query}" if query else page_query
    return urlunparse(parsed._replace(query=merged_query))


def crawl_category_pages(
    category: str,
    category_url: str,
    fetch_html_fn: Callable[[str], str],
    *,
    max_pages: int = 20,
    sleep_ms: int = 300,
) -> tuple[list[CrawledProductRecord], int]:
    """Fetch paginated category listing pages until no new products appear."""
    all_products: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    pages_fetched = 0

    for page in range(1, max(1, max_pages) + 1):
        page_url = build_category_page_url(category_url, page)
        html = fetch_html_fn(page_url)
        pages_fetched += 1
        batch = parse_products_from_category_html(html, category=category)
        new_count = 0
        for row in batch:
            if row.swagkey_product_id not in all_products:
                all_products[row.swagkey_product_id] = row
                new_count += 1
        if not batch or new_count == 0:
            break
        if sleep_ms > 0 and page < max_pages:
            time.sleep(sleep_ms / 1000.0)
    return list(all_products.values()), pages_fetched


def crawl_all_categories(
    fetch_html_fn: Callable[[str], str],
    *,
    category_urls: dict[str, str] | None = None,
    max_pages: int = 20,
    sleep_ms: int = 300,
) -> tuple[list[CrawledProductRecord], CrawlReport]:
    urls = category_urls or CATEGORY_URLS
    report = CrawlReport()
    merged: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    raw_rows = 0

    for category, url in urls.items():
        rows, pages = crawl_category_pages(
            category,
            url,
            fetch_html_fn,
            max_pages=max_pages,
            sleep_ms=sleep_ms,
        )
        report.pages_fetched += pages
        raw_rows += len(rows)
        report.by_category[category] = len(rows)
        for row in rows:
            merged[row.swagkey_product_id] = row

    products = list(merged.values())
    report.categories_crawled = len(urls)
    report.raw_product_rows = raw_rows
    report.unique_products = len(products)
    report.summary_lines = [
        f"categories crawled: {report.categories_crawled}",
        f"pages fetched: {report.pages_fetched}",
        f"raw rows (per category sum): {report.raw_product_rows}",
        f"unique products (by idx): {report.unique_products}",
    ]
    if report.by_category:
        report.summary_lines.append("by category:")
        for category, count in report.by_category.items():
            report.summary_lines.append(f"  - {category}: {count}")
    return products, report


def dedupe_crawled_products(products: list[CrawledProductRecord]) -> list[CrawledProductRecord]:
    unique: OrderedDict[str, CrawledProductRecord] = OrderedDict()
    for row in products:
        unique[row.swagkey_product_id] = row
    return list(unique.values())


def build_crawl_payload(
    products: list[CrawledProductRecord],
    *,
    report: CrawlReport,
) -> dict[str, Any]:
    return {
        "schemaVersion": CRAWLER_SCHEMA_VERSION,
        "source": {
            "vendor": "Swagkey",
            "baseUrl": BASE_URL,
            "generatedAt": report.generated_at or datetime.now(UTC).isoformat(),
        },
        "stats": {
            "categoriesCrawled": report.categories_crawled,
            "pagesFetched": report.pages_fetched,
            "rawProductRows": report.raw_product_rows,
            "uniqueProducts": report.unique_products,
            "byCategory": report.by_category,
        },
        "products": [
            {
                "category": row.category,
                "brand": row.brand,
                "productName": row.product_name,
                "normalizedName": row.normalized_name,
                "sourceUrl": row.source_url,
                "swagkeyProductId": row.swagkey_product_id,
            }
            for row in products
        ],
    }


def save_crawl_csv(products: list[CrawledProductRecord], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=["category", "brand", "product_name", "source_url", "swagkey_product_id"],
        )
        writer.writeheader()
        for row in products:
            writer.writerow(
                {
                    "category": row.category,
                    "brand": row.brand,
                    "product_name": row.product_name,
                    "source_url": row.source_url,
                    "swagkey_product_id": row.swagkey_product_id,
                },
            )


def load_crawl_payload(path: Path) -> list[CrawledProductRecord]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("products")
    if not isinstance(rows, list):
        msg = "crawl payload: missing products list"
        raise ValueError(msg)
    out: list[CrawledProductRecord] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        product_name = str(row.get("productName") or row.get("product_name") or "").strip()
        product_id = str(row.get("swagkeyProductId") or row.get("swagkey_product_id") or "").strip()
        source_url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        if not product_name or not product_id or not source_url:
            continue
        out.append(
            CrawledProductRecord(
                category=str(row.get("category") or "").strip(),
                brand=str(row.get("brand") or "").strip(),
                product_name=product_name,
                source_url=source_url,
                swagkey_product_id=product_id,
                normalized_name=str(row.get("normalizedName") or row.get("normalized_name") or product_name).strip(),
            ),
        )
    return out


def merge_urls_into_inventory_items(
    inventory_items: list[dict[str, Any]],
    crawled_products: list[CrawledProductRecord],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    by_key: dict[str, CrawledProductRecord] = {}
    for row in crawled_products:
        by_key[build_match_key(row.normalized_name)] = row

    stats = {"matched": 0, "unmatched": 0}
    merged: list[dict[str, Any]] = []
    for item in inventory_items:
        copy = dict(item)
        norm = str(copy.get("normalizedName") or copy.get("productName") or "").strip()
        crawl_row = by_key.get(build_match_key(norm))
        if crawl_row is None:
            stats["unmatched"] += 1
            merged.append(copy)
            continue
        copy["sourceUrl"] = crawl_row.source_url
        copy["swagkeyProductId"] = crawl_row.swagkey_product_id
        stats["matched"] += 1
        merged.append(copy)
    return merged, stats


def _inventory_item_idx(item: dict[str, Any]) -> str:
    explicit = str(item.get("swagkeyProductId") or "").strip()
    if explicit.isdigit():
        return explicit
    return extract_product_id_from_url(str(item.get("sourceUrl") or "")) or ""


def merge_crawl_into_inventory_by_idx(
    inventory_items: list[dict[str, Any]],
    crawled_products: list[CrawledProductRecord],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Match by Swagkey idx (or normalized name fallback); update URLs; append crawl-only SKUs."""
    by_idx_crawl: dict[str, CrawledProductRecord] = {}
    by_name_crawl: dict[str, CrawledProductRecord] = {}
    for row in crawled_products:
        by_idx_crawl[row.swagkey_product_id] = row
        by_name_crawl[build_match_key(row.normalized_name)] = row

    stats = {
        "matched": 0,
        "matched_by_name": 0,
        "name_changed": 0,
        "appended_new": 0,
        "unmatched_inventory": 0,
    }
    out: list[dict[str, Any]] = []
    matched_crawl_idx: set[str] = set()
    next_id_num = 0
    for item in inventory_items:
        raw = str(item.get("id") or "").strip()
        if raw.startswith("inv-") and raw[4:].isdigit():
            next_id_num = max(next_id_num, int(raw[4:]))

    for item in inventory_items:
        copy = dict(item)
        idx = _inventory_item_idx(copy)
        crawl_row: CrawledProductRecord | None = None
        if idx and idx in by_idx_crawl:
            crawl_row = by_idx_crawl[idx]
        else:
            name_key = build_match_key(str(copy.get("normalizedName") or copy.get("productName") or ""))
            crawl_row = by_name_crawl.get(name_key)
            if crawl_row is not None and not idx:
                stats["matched_by_name"] += 1

        if crawl_row is None:
            stats["unmatched_inventory"] += 1
            out.append(copy)
            continue

        matched_crawl_idx.add(crawl_row.swagkey_product_id)
        prior_name = str(copy.get("productName") or copy.get("normalizedName") or "").strip()
        copy["sourceUrl"] = crawl_row.source_url
        copy["swagkeyProductId"] = crawl_row.swagkey_product_id
        if prior_name and build_match_key(prior_name) != build_match_key(crawl_row.product_name):
            stats["name_changed"] += 1
            copy["productName"] = crawl_row.product_name
            copy["normalizedName"] = crawl_row.normalized_name
        stats["matched"] += 1
        out.append(copy)

    for crawl_row in crawled_products:
        if crawl_row.swagkey_product_id in matched_crawl_idx:
            continue
        next_id_num += 1
        out.append(
            {
                "id": f"inv-{next_id_num:04d}",
                "category": crawl_row.category,
                "brand": crawl_row.brand,
                "productName": crawl_row.product_name,
                "normalizedName": crawl_row.normalized_name,
                "sourceUrl": crawl_row.source_url,
                "swagkeyProductId": crawl_row.swagkey_product_id,
                "crawlSource": "http_crawl_v2",
            },
        )
        matched_crawl_idx.add(crawl_row.swagkey_product_id)
        stats["appended_new"] += 1

    return out, stats


def enrich_inventory_payload_with_crawl(
    inventory_payload: dict[str, Any],
    crawled_products: list[CrawledProductRecord],
) -> tuple[dict[str, Any], dict[str, int]]:
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        msg = "inventory payload: missing items"
        raise ValueError(msg)
    merged_items, stats = merge_crawl_into_inventory_by_idx(items, crawled_products)
    out = dict(inventory_payload)
    out["items"] = merged_items
    source = dict(out.get("source") if isinstance(out.get("source"), dict) else {})
    source["urlEnrichedAt"] = datetime.now(UTC).isoformat()
    source["crawlMergedAt"] = datetime.now(UTC).isoformat()
    out["source"] = source
    stats_node = dict(out.get("stats") if isinstance(out.get("stats"), dict) else {})
    stats_node["crawlMerge"] = stats
    stats_node["keptCount"] = len(merged_items)
    out["stats"] = stats_node
    return out, stats


def enrich_inventory_payload_with_urls(
    inventory_payload: dict[str, Any],
    crawled_products: list[CrawledProductRecord],
) -> tuple[dict[str, Any], dict[str, int]]:
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        msg = "inventory payload: missing items"
        raise ValueError(msg)
    merged_items, stats = merge_urls_into_inventory_items(items, crawled_products)
    out = dict(inventory_payload)
    out["items"] = merged_items
    source = dict(out.get("source") if isinstance(out.get("source"), dict) else {})
    source["urlEnrichedAt"] = datetime.now(UTC).isoformat()
    out["source"] = source
    stats_node = dict(out.get("stats") if isinstance(out.get("stats"), dict) else {})
    stats_node["urlMerge"] = stats
    out["stats"] = stats_node
    return out, stats
