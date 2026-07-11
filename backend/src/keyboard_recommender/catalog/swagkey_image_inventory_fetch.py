"""Fetch Swagkey product images for inventory rows not covered by cache backfill."""

from __future__ import annotations

import csv
import json
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_image_cache_backfill import (
    IMAGE_ARTIFACT_SCHEMA_VERSION,
    CacheImageItem,
    _item_to_dict,
    build_seed_indexes,
)
from keyboard_recommender.catalog.swagkey_image_extractor import (
    OgImageResult,
    fetch_html,
    parse_og_image_from_html,
)
from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url, shop_view_product_url

FetchHtmlFn = Callable[[str], str]


@dataclass(slots=True)
class InventoryImageFailure:
    inventory_id: str
    swagkey_product_id: str
    source_url: str
    stage: str
    reason: str
    detail: str = ""


@dataclass(slots=True)
class InventoryFetchReport:
    schema_version: str = IMAGE_ARTIFACT_SCHEMA_VERSION
    generated_at: str = ""
    stats: dict[str, int] = field(default_factory=dict)
    items: list[dict[str, Any]] = field(default_factory=list)
    failures: list[InventoryImageFailure] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "stats": dict(self.stats),
            "items": list(self.items),
            "failures": [
                {
                    "inventoryId": failure.inventory_id,
                    "swagkeyProductId": failure.swagkey_product_id,
                    "sourceUrl": failure.source_url,
                    "stage": failure.stage,
                    "reason": failure.reason,
                    "detail": failure.detail,
                }
                for failure in self.failures
            ],
        }


def load_inventory_items(inventory_path: Path) -> list[dict[str, Any]]:
    payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    rows = payload.get("items")
    if not isinstance(rows, list):
        return []
    out: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict) and str(row.get("swagkeyProductId") or "").strip():
            out.append(dict(row))
    return out


def load_product_images_artifact(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {
            "schemaVersion": IMAGE_ARTIFACT_SCHEMA_VERSION,
            "generatedAt": "",
            "stats": {},
            "items": [],
            "failures": [],
        }
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        return {"schemaVersion": IMAGE_ARTIFACT_SCHEMA_VERSION, "items": [], "failures": [], "stats": {}}
    payload.setdefault("items", [])
    payload.setdefault("failures", [])
    payload.setdefault("stats", {})
    return payload


def _resolved_product_ids(items: list[dict[str, Any]]) -> set[str]:
    out: set[str] = set()
    for row in items:
        if not isinstance(row, dict):
            continue
        product_id = str(row.get("swagkeyProductId") or "").strip()
        image_url = str(row.get("imageUrl") or "").strip()
        if product_id and image_url:
            out.add(product_id)
    return out


def collect_only_missing_product_ids(
    *,
    inventory_rows: list[dict[str, Any]],
    existing_items: list[dict[str, Any]],
    seed_payload: dict[str, Any] | None,
) -> set[str]:
    """Product idx values that still need an image fetch (artifact + seed gaps)."""
    resolved = _resolved_product_ids(existing_items)
    missing: set[str] = set()
    for inv_row in inventory_rows:
        product_id = str(inv_row.get("swagkeyProductId") or "").strip()
        if product_id and product_id not in resolved:
            missing.add(product_id)

    if seed_payload:
        by_product_idx_seed, _ = build_seed_indexes(seed_payload)
        for product_id, seed_ids in by_product_idx_seed.items():
            if product_id in resolved:
                continue
            for seed_id in seed_ids:
                row = _find_seed_row(seed_payload, seed_id)
                if row is None:
                    continue
                if str(row.get("imageUrl") or "").strip():
                    resolved.add(product_id)
                    missing.discard(product_id)
                    break
                if product_id:
                    missing.add(product_id)
    return missing


def _find_seed_row(seed_payload: dict[str, Any], seed_id: str) -> dict[str, Any] | None:
    switches = seed_payload.get("switches")
    if isinstance(switches, dict):
        for rows in switches.values():
            if not isinstance(rows, list):
                continue
            for row in rows:
                if isinstance(row, dict) and str(row.get("id") or "") == seed_id:
                    return row
    for key in ("plates", "foams", "layouts", "cases", "keycaps"):
        rows = seed_payload.get(key)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, dict) and str(row.get("id") or "") == seed_id:
                return row
    return None


def filter_inventory_rows_for_product_ids(
    inventory_rows: list[dict[str, Any]],
    product_ids: set[str],
) -> list[dict[str, Any]]:
    if not product_ids:
        return []
    return [
        row
        for row in inventory_rows
        if str(row.get("swagkeyProductId") or "").strip() in product_ids
    ]


def _items_by_product_id(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for row in items:
        if not isinstance(row, dict):
            continue
        product_id = str(row.get("swagkeyProductId") or "").strip()
        if product_id:
            out[product_id] = dict(row)
    return out


def _cache_html_path(cache_dir: Path | None, product_id: str) -> Path | None:
    if cache_dir is None:
        return None
    return cache_dir / f"{product_id}.html"


def _read_optional_cache(cache_path: Path | None) -> str | None:
    if cache_path is None or not cache_path.is_file():
        return None
    return cache_path.read_text(encoding="utf-8", errors="ignore")


def _write_optional_cache(cache_path: Path | None, html: str) -> None:
    if cache_path is None:
        return
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(html, encoding="utf-8")


def retry_fetch_html(
    url: str,
    *,
    fetcher: FetchHtmlFn,
    timeout_s: float,
    max_retries: int,
    retry_backoff_ms: int,
) -> str:
    last_error: Exception | None = None
    attempts = max_retries + 1
    for attempt in range(1, attempts + 1):
        try:
            return fetcher(url) if timeout_s <= 0 else fetcher(url)
        except Exception as exc:  # noqa: BLE001 - propagate after retries
            last_error = exc
            if attempt >= attempts:
                break
            if retry_backoff_ms > 0:
                time.sleep((retry_backoff_ms * attempt) / 1000.0)
    raise RuntimeError(str(last_error) if last_error else "unknown fetch error")


def _build_fetch_item(
    inv_row: dict[str, Any],
    parsed: OgImageResult,
    *,
    seed_ids: list[str],
    match_method: str,
    cache_file: str = "",
) -> dict[str, Any]:
    product_id = str(inv_row.get("swagkeyProductId") or "").strip()
    source_url = normalize_product_detail_url(str(inv_row.get("sourceUrl") or "")) or shop_view_product_url(product_id)
    item = CacheImageItem(
        swagkey_product_id=product_id,
        source_url=source_url,
        image_url=parsed.image_url,
        seed_ids=list(seed_ids),
        width=parsed.width,
        height=parsed.height,
        cache_file=cache_file,
        match_method=match_method,
    )
    row = _item_to_dict(item)
    row["inventoryId"] = str(inv_row.get("id") or "")
    row["productName"] = str(inv_row.get("productName") or "")
    row["category"] = str(inv_row.get("category") or "")
    return row


def fetch_inventory_product_images(
    inventory_rows: list[dict[str, Any]],
    *,
    existing_items: list[dict[str, Any]] | None = None,
    seed_payload: dict[str, Any] | None = None,
    resume: bool = True,
    cache_dir: Path | None = None,
    fetcher: FetchHtmlFn | None = None,
    sleep_ms: int = 800,
    timeout_s: float = 20.0,
    max_retries: int = 2,
    retry_backoff_ms: int = 500,
    max_items: int | None = None,
    network_enabled: bool = True,
) -> InventoryFetchReport:
    by_product_idx_seed, _by_seed_id = build_seed_indexes(seed_payload or {})
    items_by_id = _items_by_product_id(existing_items or [])

    failures: list[InventoryImageFailure] = []
    skipped = 0
    fetched = 0
    cache_hits = 0
    processed = 0

    fetcher_fn = fetcher or fetch_html

    for inv_row in inventory_rows:
        if max_items is not None and processed >= max_items:
            break
        processed += 1

        product_id = str(inv_row.get("swagkeyProductId") or "").strip()
        inventory_id = str(inv_row.get("id") or "").strip()
        source_url = normalize_product_detail_url(str(inv_row.get("sourceUrl") or "")) or shop_view_product_url(
            product_id
        )
        if not product_id:
            failures.append(
                InventoryImageFailure(
                    inventory_id=inventory_id,
                    swagkey_product_id=product_id,
                    source_url=source_url,
                    stage="validate",
                    reason="missing_product_id",
                )
            )
            continue

        if resume and product_id in items_by_id:
            skipped += 1
            continue

        cache_path = _cache_html_path(cache_dir, product_id)
        html_doc = _read_optional_cache(cache_path)
        match_method = "http_fetch"
        cache_file = ""

        if html_doc is not None:
            match_method = "http_cache_file"
            cache_file = str(cache_path) if cache_path is not None else ""
            cache_hits += 1
        elif network_enabled:
            try:
                html_doc = retry_fetch_html(
                    source_url,
                    fetcher=fetcher_fn,
                    timeout_s=timeout_s,
                    max_retries=max(0, max_retries),
                    retry_backoff_ms=max(0, retry_backoff_ms),
                )
                _write_optional_cache(cache_path, html_doc)
            except Exception as exc:  # noqa: BLE001 - record per-row failure
                failures.append(
                    InventoryImageFailure(
                        inventory_id=inventory_id,
                        swagkey_product_id=product_id,
                        source_url=source_url,
                        stage="fetch",
                        reason="http_error",
                        detail=str(exc),
                    )
                )
                if sleep_ms > 0 and processed < len(inventory_rows):
                    time.sleep(sleep_ms / 1000.0)
                continue
        else:
            failures.append(
                InventoryImageFailure(
                    inventory_id=inventory_id,
                    swagkey_product_id=product_id,
                    source_url=source_url,
                    stage="fetch",
                    reason="network_disabled",
                )
            )
            continue

        parsed = parse_og_image_from_html(html_doc)
        if parsed is None:
            failures.append(
                InventoryImageFailure(
                    inventory_id=inventory_id,
                    swagkey_product_id=product_id,
                    source_url=source_url,
                    stage="parse",
                    reason="og_image_missing",
                )
            )
            if sleep_ms > 0 and processed < len(inventory_rows):
                time.sleep(sleep_ms / 1000.0)
            continue

        ref_product_id = extract_product_id_from_url(parsed.canonical_url or parsed.og_url or source_url) or product_id
        if ref_product_id != product_id:
            failures.append(
                InventoryImageFailure(
                    inventory_id=inventory_id,
                    swagkey_product_id=product_id,
                    source_url=source_url,
                    stage="parse",
                    reason="product_idx_mismatch",
                    detail=f"expected={product_id} parsed={ref_product_id}",
                )
            )
            if sleep_ms > 0 and processed < len(inventory_rows):
                time.sleep(sleep_ms / 1000.0)
            continue

        items_by_id[product_id] = _build_fetch_item(
            inv_row,
            parsed,
            seed_ids=by_product_idx_seed.get(product_id, []),
            match_method=match_method,
            cache_file=cache_file,
        )
        fetched += 1

        if sleep_ms > 0 and processed < len(inventory_rows):
            time.sleep(sleep_ms / 1000.0)

    items = sorted(items_by_id.values(), key=lambda row: str(row.get("swagkeyProductId") or ""))
    total = len(inventory_rows)
    resolved = len(items)
    from_cache = sum(1 for row in items if str(row.get("cacheFile") or "").strip())
    fetched_total = sum(1 for row in items if str(row.get("matchMethod") or "") == "http_fetch")
    stats = {
        "total": total,
        "resolved": resolved,
        "fromCache": from_cache,
        "fetched": fetched_total,
        "fetchedThisRun": fetched,
        "cacheHits": cache_hits,
        "skipped": skipped,
        "failed": len(failures),
        "uniqueProductIds": resolved,
        "resolvedPct": round((resolved / total) * 100, 2) if total else 0.0,
    }
    return InventoryFetchReport(
        generated_at=datetime.now(UTC).isoformat(),
        stats=stats,
        items=items,
        failures=failures,
    )


def write_inventory_fetch_report(report: InventoryFetchReport, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_fetch_failures_csv(path: Path, failures: list[InventoryImageFailure]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=["inventoryId", "swagkeyProductId", "sourceUrl", "stage", "reason", "detail"],
        )
        writer.writeheader()
        for failure in failures:
            writer.writerow(
                {
                    "inventoryId": failure.inventory_id,
                    "swagkeyProductId": failure.swagkey_product_id,
                    "sourceUrl": failure.source_url,
                    "stage": failure.stage,
                    "reason": failure.reason,
                    "detail": failure.detail,
                }
            )


def write_fetch_failures_json(path: Path, report: InventoryFetchReport) -> None:
    payload = {
        "schemaVersion": report.schema_version,
        "generatedAt": report.generated_at,
        "failures": report.to_dict()["failures"],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
