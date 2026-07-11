"""Offline backfill of Swagkey product images from cached HTML."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.ingestion_pipeline import _flatten_seed
from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_image_extractor import (
    OgImageResult,
    parse_og_image_from_html,
    parse_page_reference_url,
)
from keyboard_recommender.catalog.swagkey_source_url import shop_view_product_url

IMAGE_ARTIFACT_SCHEMA_VERSION = "1.0.0"

_SEED_ID_FROM_FILENAME_RE = re.compile(
    r"^(sw-(?:linear|tactile|silent|magnetic|click|other|new)-\d{3}|plate(?:-new)?-\d{3}|foam(?:-new)?-\d{3}|layout(?:-new)?-\d{3}|case(?:-new)?-\d{3}|keycap(?:-new)?-\d{3})",
    re.IGNORECASE,
)


@dataclass(slots=True)
class CacheImageFailure:
    cache_file: str
    seed_id_hint: str | None = None
    source_url_hint: str | None = None
    reason: str = "og_image_missing"
    detail: str = ""


@dataclass(slots=True)
class CacheImageItem:
    swagkey_product_id: str
    source_url: str
    image_url: str
    status: str = "ok"
    seed_ids: list[str] = field(default_factory=list)
    width: int | None = None
    height: int | None = None
    cache_file: str = ""
    match_method: str = "page_idx"
    image_source: str = "og:image"


def _item_to_dict(item: CacheImageItem) -> dict[str, Any]:
    return {
        "swagkeyProductId": item.swagkey_product_id,
        "sourceUrl": item.source_url,
        "imageUrl": item.image_url,
        "status": item.status,
        "seedIds": list(item.seed_ids),
        "width": item.width,
        "height": item.height,
        "cacheFile": item.cache_file,
        "matchMethod": item.match_method,
        "imageSource": item.image_source,
    }


def _failure_to_dict(failure: CacheImageFailure) -> dict[str, Any]:
    return {
        "cacheFile": failure.cache_file,
        "seedIdHint": failure.seed_id_hint,
        "sourceUrlHint": failure.source_url_hint,
        "reason": failure.reason,
        "detail": failure.detail,
    }


@dataclass(slots=True)
class CacheBackfillReport:
    schema_version: str = IMAGE_ARTIFACT_SCHEMA_VERSION
    generated_at: str = ""
    stats: dict[str, int] = field(default_factory=dict)
    items: list[CacheImageItem] = field(default_factory=list)
    failures: list[CacheImageFailure] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "stats": dict(self.stats),
            "items": [_item_to_dict(item) for item in self.items],
            "failures": [_failure_to_dict(failure) for failure in self.failures],
        }


def default_cache_roots(data_dir: Path) -> list[Path]:
    inventory = data_dir / "swagkey_inventory"
    return [
        data_dir / "swagkey_html_cache",
        inventory / "new_in_crawl_specs" / "switch_html_cache",
        inventory / "new_in_crawl_specs" / "compat_html_cache",
    ]


def discover_cache_html_files(roots: list[Path]) -> list[Path]:
    files: list[Path] = []
    seen: set[str] = set()
    for root in roots:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*.html")):
            key = str(path.resolve()).lower()
            if key in seen:
                continue
            seen.add(key)
            files.append(path)
    return files


def infer_seed_id_from_filename(path: Path) -> str | None:
    stem = path.stem
    match = _SEED_ID_FROM_FILENAME_RE.match(stem)
    if match:
        return match.group(1)
    return stem if stem else None


def build_seed_indexes(seed_payload: dict[str, Any]) -> tuple[dict[str, list[str]], dict[str, dict[str, Any]]]:
    by_product_idx: dict[str, list[str]] = {}
    by_seed_id: dict[str, dict[str, Any]] = {}
    for (_family, seed_id), wrapped in _flatten_seed(seed_payload).items():
        row = dict(wrapped.get("row") or {})
        by_seed_id[seed_id] = row
        source_url = str(row.get("sourceUrl") or "").strip()
        product_idx = extract_product_id_from_url(source_url)
        if not product_idx:
            continue
        by_product_idx.setdefault(product_idx, [])
        if seed_id not in by_product_idx[product_idx]:
            by_product_idx[product_idx].append(seed_id)
    return by_product_idx, by_seed_id


def _failure_reason(parsed: OgImageResult | None, *, html: str) -> str:
    if parsed is not None:
        return "ok"
    _og_url, canonical = parse_page_reference_url(html)
    ref_url = canonical or _og_url
    if ref_url and extract_product_id_from_url(ref_url) is None:
        return "legacy_category_cache"
    return "og_image_missing"


def _source_url_for_product(product_idx: str, *, parsed: OgImageResult) -> str:
    if parsed.canonical_url and extract_product_id_from_url(parsed.canonical_url):
        return parsed.canonical_url
    if parsed.og_url and extract_product_id_from_url(parsed.og_url):
        return parsed.og_url
    return shop_view_product_url(product_idx)


def extract_images_from_cache_files(
    cache_files: list[Path],
    *,
    seed_payload: dict[str, Any] | None = None,
    repo_root: Path | None = None,
) -> CacheBackfillReport:
    by_product_idx_seed, by_seed_id = build_seed_indexes(seed_payload or {})
    items_by_product: dict[str, CacheImageItem] = {}
    failures: list[CacheImageFailure] = []
    resolved_files = 0

    for cache_path in cache_files:
        rel_cache = _relative_path(cache_path, repo_root=repo_root)
        seed_hint = infer_seed_id_from_filename(cache_path)
        source_hint = ""
        if seed_hint and seed_hint in by_seed_id:
            source_hint = str(by_seed_id[seed_hint].get("sourceUrl") or "")

        try:
            html = cache_path.read_text(encoding="utf-8", errors="ignore")
        except OSError as exc:
            failures.append(
                CacheImageFailure(
                    cache_file=rel_cache,
                    seed_id_hint=seed_hint,
                    source_url_hint=source_hint or None,
                    reason="cache_read_error",
                    detail=str(exc),
                )
            )
            continue

        parsed = parse_og_image_from_html(html)
        if parsed is None:
            failures.append(
                CacheImageFailure(
                    cache_file=rel_cache,
                    seed_id_hint=seed_hint,
                    source_url_hint=source_hint or None,
                    reason=_failure_reason(parsed, html=html),
                )
            )
            continue

        ref_url = parsed.canonical_url or parsed.og_url
        product_idx = extract_product_id_from_url(ref_url or "")
        match_method = "page_idx"
        if not product_idx and seed_hint:
            product_idx = extract_product_id_from_url(source_hint)
            match_method = "filename_seed"
        if not product_idx:
            failures.append(
                CacheImageFailure(
                    cache_file=rel_cache,
                    seed_id_hint=seed_hint,
                    source_url_hint=source_hint or None,
                    reason="product_idx_unresolved",
                )
            )
            continue

        seed_ids = list(by_product_idx_seed.get(product_idx, []))
        if seed_hint and seed_hint in by_seed_id and seed_hint not in seed_ids:
            seed_ids.append(seed_hint)

        item = CacheImageItem(
            swagkey_product_id=product_idx,
            source_url=_source_url_for_product(product_idx, parsed=parsed),
            image_url=parsed.image_url,
            seed_ids=seed_ids,
            width=parsed.width,
            height=parsed.height,
            cache_file=rel_cache,
            match_method=match_method,
        )
        existing = items_by_product.get(product_idx)
        if existing is None or _should_replace_item(existing, item):
            items_by_product[product_idx] = item
        resolved_files += 1

    items = sorted(items_by_product.values(), key=lambda row: row.swagkey_product_id)
    stats = {
        "filesScanned": len(cache_files),
        "resolvedFiles": resolved_files,
        "resolved": len(items),
        "fromCache": len(items),
        "failed": len(failures),
        "uniqueProductIds": len(items),
    }
    return CacheBackfillReport(
        generated_at=datetime.now(UTC).isoformat(),
        stats=stats,
        items=items,
        failures=failures,
    )


def _should_replace_item(current: CacheImageItem, candidate: CacheImageItem) -> bool:
    if current.match_method != candidate.match_method:
        return candidate.match_method == "page_idx"
    return candidate.cache_file < current.cache_file


def _relative_path(path: Path, *, repo_root: Path | None) -> str:
    if repo_root is not None:
        try:
            return str(path.resolve().relative_to(repo_root.resolve()))
        except ValueError:
            pass
    return str(path)


def load_seed_payload(seed_path: Path) -> dict[str, Any]:
    if not seed_path.is_file():
        return {}
    return json.loads(seed_path.read_text(encoding="utf-8"))


def write_cache_backfill_report(report: CacheBackfillReport, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
