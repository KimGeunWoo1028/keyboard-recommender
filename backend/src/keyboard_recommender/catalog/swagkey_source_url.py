"""Resolve Swagkey category/listing URLs to product detail pages (?idx=)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_without_swagkey_product
from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_seed_inventory_diff import build_match_key, name_similarity, pairing_allowed

SHOP_VIEW_ORIGIN = "https://www.swagkey.kr/shop_view/"


def shop_view_product_url(product_idx: str) -> str:
    """Imweb universal product page — avoids category slug mismatches (e.g. /132/ 404)."""
    needle = str(product_idx or "").strip()
    if not needle.isdigit():
        return ""
    return f"{SHOP_VIEW_ORIGIN}?idx={needle}"


def normalize_product_detail_url(url: str) -> str:
    """Map any Swagkey URL with ``idx`` to stable ``/shop_view/?idx=`` form."""
    current = str(url or "").strip()
    if not current:
        return ""
    product_idx = extract_product_id_from_url(current)
    if product_idx:
        return shop_view_product_url(product_idx)
    return current


def is_product_detail_url(url: str) -> bool:
    """True when URL points at a single product (has numeric ``idx`` query param)."""
    return extract_product_id_from_url(str(url or "").strip()) is not None


@dataclass(slots=True)
class SwagkeyUrlResolver:
    by_match_key: dict[str, str] = field(default_factory=dict)
    by_seed_id: dict[str, str] = field(default_factory=dict)
    by_inventory_id: dict[str, str] = field(default_factory=dict)
    by_product_idx: dict[str, str] = field(default_factory=dict)
    name_rows: list[tuple[str, str]] = field(default_factory=list)

    def _emit(self, url: str) -> str:
        return normalize_product_detail_url(url)

    def resolve(self, *, name: str, url: str, seed_id: str = "", inventory_id: str = "") -> str:
        current = str(url or "").strip()

        if seed_id and seed_id in self.by_seed_id:
            return self._emit(self.by_seed_id[seed_id])
        if inventory_id and inventory_id in self.by_inventory_id:
            return self._emit(self.by_inventory_id[inventory_id])

        product_idx = extract_product_id_from_url(current)
        if product_idx and product_idx in self.by_product_idx:
            return self._emit(self.by_product_idx[product_idx])

        if is_product_detail_url(current):
            return self._emit(current)

        product_name = str(name or "").strip()
        if product_name:
            exact = self.by_match_key.get(build_match_key(product_name))
            if exact:
                return self._emit(exact)

            best_url = ""
            best_score = 0.0
            for inv_name, inv_url in self.name_rows:
                if not is_product_detail_url(inv_url):
                    continue
                score = name_similarity(product_name, inv_name)
                if score > best_score and score >= 0.88 and pairing_allowed(product_name, inv_name):
                    best_score = score
                    best_url = inv_url
            if best_url:
                return self._emit(best_url)

        return self._emit(current)


def build_product_idx_url_index(inventory_payload: dict[str, Any]) -> dict[str, str]:
    """Map Swagkey ``idx`` query value → canonical crawled detail URL."""
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        return {}
    out: dict[str, str] = {}
    for row in items:
        if not isinstance(row, dict):
            continue
        url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        product_idx = extract_product_id_from_url(url)
        if product_idx and is_product_detail_url(url):
            out[product_idx] = url
    return out


def build_inventory_name_url_index(inventory_payload: dict[str, Any]) -> dict[str, str]:
    """Map normalized product name → detail URL from inventory v2 rows."""
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        return {}

    by_key: dict[str, str] = {}
    for row in items:
        if not isinstance(row, dict):
            continue
        name = str(row.get("productName") or row.get("normalizedName") or "").strip()
        url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        if not name or not is_product_detail_url(url):
            continue
        by_key[build_match_key(name)] = url
    return by_key


def build_inventory_id_url_index(inventory_payload: dict[str, Any]) -> dict[str, str]:
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        return {}
    out: dict[str, str] = {}
    for row in items:
        if not isinstance(row, dict):
            continue
        inv_id = str(row.get("id") or "").strip()
        url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        if inv_id and is_product_detail_url(url):
            out[inv_id] = url
    return out


def build_inventory_name_rows(inventory_payload: dict[str, Any]) -> list[tuple[str, str]]:
    items = inventory_payload.get("items")
    if not isinstance(items, list):
        return []
    rows: list[tuple[str, str]] = []
    for row in items:
        if not isinstance(row, dict):
            continue
        name = str(row.get("productName") or row.get("normalizedName") or "").strip()
        url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        if name and is_product_detail_url(url):
            rows.append((name, url))
    return rows


def build_seed_id_url_index(diff_payload: dict[str, Any], *, inventory_by_id: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for section in ("matched", "name_changed"):
        records = diff_payload.get(section)
        if not isinstance(records, list):
            continue
        for record in records:
            if not isinstance(record, dict):
                continue
            seed_id = str(record.get("seed_id") or "").strip()
            crawl_id = str(record.get("crawl_id") or "").strip()
            if not seed_id or not crawl_id:
                continue
            url = inventory_by_id.get(crawl_id)
            if url:
                out[seed_id] = url
    return out


def build_swagkey_url_resolver(
    inventory_payload: dict[str, Any],
    *,
    diff_payload: dict[str, Any] | None = None,
) -> SwagkeyUrlResolver:
    inventory_by_id = build_inventory_id_url_index(inventory_payload)
    return SwagkeyUrlResolver(
        by_match_key=build_inventory_name_url_index(inventory_payload),
        by_inventory_id=inventory_by_id,
        by_seed_id=build_seed_id_url_index(diff_payload or {}, inventory_by_id=inventory_by_id),
        by_product_idx=build_product_idx_url_index(inventory_payload),
        name_rows=build_inventory_name_rows(inventory_payload),
    )


def load_swagkey_url_resolver(
    inventory_path: Path,
    *,
    diff_path: Path | None = None,
) -> SwagkeyUrlResolver:
    if not inventory_path.is_file():
        return SwagkeyUrlResolver()
    try:
        inventory_payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return SwagkeyUrlResolver()

    diff_payload: dict[str, Any] | None = None
    if diff_path and diff_path.is_file():
        try:
            diff_payload = json.loads(diff_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            diff_payload = None
    return build_swagkey_url_resolver(inventory_payload, diff_payload=diff_payload)


def resolve_source_url(
    name: str,
    url: str,
    *,
    resolver: SwagkeyUrlResolver,
    seed_id: str = "",
    inventory_id: str = "",
) -> str:
    return resolver.resolve(name=name, url=url, seed_id=seed_id, inventory_id=inventory_id)


# Backward-compatible helpers used by scripts/tests.
def build_inventory_name_url_index_from_path(inventory_path: Path) -> dict[str, str]:
    if not inventory_path.is_file():
        return {}
    try:
        payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return build_inventory_name_url_index(payload)


@dataclass(slots=True)
class SeedUrlFixReport:
    scanned: int = 0
    already_detail: int = 0
    fixed: int = 0
    unresolved: int = 0
    fixes: list[dict[str, str]] = field(default_factory=list)
    unresolved_items: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "scanned": self.scanned,
            "alreadyDetail": self.already_detail,
            "fixed": self.fixed,
            "unresolved": self.unresolved,
            "fixes": self.fixes,
            "unresolvedItems": self.unresolved_items,
        }


def _iter_seed_rows_with_url(seed_payload: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    out: list[tuple[str, dict[str, Any]]] = []
    switches = seed_payload.get("switches")
    if isinstance(switches, dict):
        for subtype, rows in switches.items():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if isinstance(row, dict):
                    out.append((f"switches.{subtype}", row))

    for family_key in ("plates", "foams", "layouts", "cases", "keycaps"):
        rows = seed_payload.get(family_key)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, dict):
                out.append((family_key, row))
    return out


def fix_seed_source_urls(
    seed_payload: dict[str, Any],
    *,
    resolver: SwagkeyUrlResolver,
) -> tuple[dict[str, Any], SeedUrlFixReport]:
    """Replace category-only sourceUrl values in a seed payload copy."""
    out = json.loads(json.dumps(seed_payload, ensure_ascii=False))
    report = SeedUrlFixReport()

    for family_path, row in _iter_seed_rows_with_url(out):
        report.scanned += 1
        name = str(row.get("name") or "").strip()
        seed_id = str(row.get("id") or "").strip()
        inventory_id = str(row.get("inventoryId") or "").strip()
        before = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        if not before:
            if family_path == "layouts":
                report.already_detail += 1
                continue
            report.unresolved += 1
            report.unresolved_items.append({"family": family_path, "id": seed_id, "name": name, "sourceUrl": ""})
            continue
        if is_product_detail_url(before):
            after = normalize_product_detail_url(
                resolver.resolve(name=name, url=before, seed_id=seed_id, inventory_id=inventory_id),
            )
            if after != before and is_product_detail_url(after):
                row["sourceUrl"] = after
                report.fixed += 1
                report.fixes.append(
                    {
                        "family": family_path,
                        "id": seed_id,
                        "name": name,
                        "before": before,
                        "after": after,
                    },
                )
            else:
                report.already_detail += 1
            continue

        after = normalize_product_detail_url(
            resolver.resolve(name=name, url=before, seed_id=seed_id, inventory_id=inventory_id),
        )
        if after != before and is_product_detail_url(after):
            row["sourceUrl"] = after
            report.fixed += 1
            report.fixes.append(
                {
                    "family": family_path,
                    "id": seed_id,
                    "name": name,
                    "before": before,
                    "after": after,
                },
            )
        else:
            report.unresolved += 1
            report.unresolved_items.append(
                {"family": family_path, "id": seed_id, "name": name, "sourceUrl": before},
            )

    return out, report


def category_path_from_url(url: str) -> str | None:
    """Extract ``/NN`` category path segment (without idx) for diagnostics."""
    parsed = urlparse(str(url or "").strip())
    path = parsed.path.strip("/")
    if path.isdigit():
        return f"/{path}"
    return None


_CATALOG_PKG = Path(__file__).resolve().parent
_SEED_PATH = _CATALOG_PKG / "swagkey_products.seed.json"
_INVENTORY_PATH = _CATALOG_PKG.parents[2] / "data" / "swagkey_inventory" / "swagkey_inventory.v2.json"
_DIFF_PATH = _INVENTORY_PATH.parent / "seed_inventory_diff.json"


@lru_cache(maxsize=1)
def _default_url_resolver() -> SwagkeyUrlResolver:
    return load_swagkey_url_resolver(_INVENTORY_PATH, diff_path=_DIFF_PATH)


@lru_cache(maxsize=1)
def _seed_payload() -> dict[str, Any]:
    if not _SEED_PATH.is_file():
        return {}
    try:
        return json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


@lru_cache(maxsize=1)
def seed_row_index() -> dict[tuple[str, str], dict[str, Any]]:
    """Map (family, id) → raw seed row (includes sourceUrl, subtype)."""
    out: dict[tuple[str, str], dict[str, Any]] = {}
    payload = _seed_payload()
    switches = payload.get("switches")
    if isinstance(switches, dict):
        for bucket_subtype, rows in switches.items():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if not isinstance(row, dict):
                    continue
                part_id = str(row.get("id") or "").strip()
                if not part_id:
                    continue
                merged = dict(row)
                merged.setdefault("subtype", str(bucket_subtype))
                out[("switch", part_id)] = merged

    for family_key, family in (
        ("plates", "plate"),
        ("foams", "foam"),
        ("cases", "case"),
        ("layouts", "layout"),
        ("keycaps", "keycap"),
    ):
        rows = payload.get(family_key)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            part_id = str(row.get("id") or "").strip()
            if part_id:
                out[(family, part_id)] = dict(row)

    return out


def resolve_catalog_source_url(domain: str, item_id: str, *, item_name: str = "") -> str:
    """Resolve Swagkey product detail URL for a recommendation/catalog part id."""
    family = str(domain or "").strip().lower()
    if family not in ("switch", "plate", "foam", "layout", "case", "keycap"):
        return ""
    needle = str(item_id or "").strip()
    if not needle:
        return ""
    if family == "layout" and is_layout_archetype_without_swagkey_product(needle):
        return ""
    row = seed_row_index().get((family, needle), {})
    name = (item_name or str(row.get("name") or "")).strip()
    return resolve_source_url(
        name,
        str(row.get("sourceUrl") or row.get("source_url") or "").strip(),
        resolver=_default_url_resolver(),
        seed_id=needle,
        inventory_id=str(row.get("inventoryId") or "").strip(),
    )
