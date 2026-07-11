"""Detect Swagkey product imageUrl drift between seed baseline and refetched og:image."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable, Literal

from keyboard_recommender.catalog.ingestion_pipeline import _flatten_seed
from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_image_extractor import (
    fetch_html,
    is_valid_swagkey_product_image_url,
    parse_og_image_from_html,
)
from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url

ImageCheckMode = Literal["fixture", "live"]

FetchHtmlFn = Callable[[str], str]


@dataclass(slots=True, frozen=True)
class ImageUrlChange:
    seed_id: str
    family: str
    seed_name: str
    swagkey_product_id: str
    source_url: str
    previous_image_url: str
    current_image_url: str
    check_mode: str
    status: str = "image_url_changed"


@dataclass(slots=True)
class ImageUrlRecheckReport:
    generated_at: str
    mode: ImageCheckMode
    seed_path: str
    cache_dir: str
    checked: int = 0
    unchanged: int = 0
    changed: int = 0
    missing_baseline: int = 0
    missing_refetch: int = 0
    skipped_no_cache: int = 0
    failures: int = 0
    changes: list[ImageUrlChange] = field(default_factory=list)
    errors: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "generatedAt": self.generated_at,
            "mode": self.mode,
            "seedPath": self.seed_path,
            "cacheDir": self.cache_dir,
            "stats": {
                "checked": self.checked,
                "unchanged": self.unchanged,
                "changed": self.changed,
                "missingBaseline": self.missing_baseline,
                "missingRefetch": self.missing_refetch,
                "skippedNoCache": self.skipped_no_cache,
                "failures": self.failures,
            },
            "changes": [asdict(change) for change in self.changes],
            "errors": list(self.errors),
        }


def load_seed_payload(seed_path: Path) -> dict[str, Any]:
    return json.loads(seed_path.read_text(encoding="utf-8"))


def iter_seed_image_rows(seed_payload: dict[str, Any]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for (family, seed_id), wrapped in _flatten_seed(seed_payload).items():
        row = dict(wrapped.get("row") or {})
        source_url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        image_url = str(row.get("imageUrl") or row.get("image_url") or "").strip()
        idx = extract_product_id_from_url(source_url) or ""
        if not idx or not source_url:
            continue
        rows.append(
            {
                "family": family,
                "seed_id": seed_id,
                "seed_name": str(row.get("name") or "").strip(),
                "swagkey_product_id": idx,
                "source_url": source_url,
                "image_url": image_url,
            },
        )
    return rows


def _cache_html_path(cache_dir: Path, product_id: str) -> Path:
    return cache_dir / f"{product_id}.html"


def _read_fixture_html(cache_dir: Path, product_id: str) -> str | None:
    path = _cache_html_path(cache_dir, product_id)
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8", errors="ignore")


def _parse_image_url_from_html(html: str, *, require_product_page: bool = True) -> str:
    parsed = parse_og_image_from_html(html, require_product_page=require_product_page)
    if parsed is None:
        raise ValueError("og_image_missing")
    image_url = str(parsed.image_url or "").strip()
    if not image_url or not is_valid_swagkey_product_image_url(image_url):
        raise ValueError("og_image_missing")
    return image_url


def refetch_image_url(
    *,
    product_id: str,
    source_url: str,
    mode: ImageCheckMode,
    cache_dir: Path,
    fetcher: FetchHtmlFn | None = None,
) -> str:
    canonical = normalize_product_detail_url(source_url) or source_url
    if mode == "fixture":
        html = _read_fixture_html(cache_dir, product_id)
        if html is None:
            raise FileNotFoundError("fixture_cache_missing")
        return _parse_image_url_from_html(html, require_product_page=True)

    html_fetcher = fetcher or fetch_html
    html = html_fetcher(canonical)
    return _parse_image_url_from_html(html, require_product_page=True)


def run_image_url_recheck(
    seed_payload: dict[str, Any],
    *,
    mode: ImageCheckMode = "fixture",
    cache_dir: Path,
    seed_path: str = "",
    limit: int | None = None,
    fetcher: FetchHtmlFn | None = None,
) -> ImageUrlRecheckReport:
    report = ImageUrlRecheckReport(
        generated_at=datetime.now(UTC).replace(microsecond=0).isoformat(),
        mode=mode,
        seed_path=seed_path,
        cache_dir=str(cache_dir.resolve()).replace("\\", "/"),
    )
    rows = iter_seed_image_rows(seed_payload)
    if limit is not None and limit >= 0:
        rows = rows[:limit]

    for row in rows:
        baseline = row["image_url"]
        if not baseline:
            report.missing_baseline += 1
            continue

        product_id = row["swagkey_product_id"]
        if mode == "fixture" and not _cache_html_path(cache_dir, product_id).is_file():
            report.skipped_no_cache += 1
            continue

        try:
            current = refetch_image_url(
                product_id=product_id,
                source_url=row["source_url"],
                mode=mode,
                cache_dir=cache_dir,
                fetcher=fetcher,
            )
        except FileNotFoundError:
            report.skipped_no_cache += 1
            continue
        except Exception as exc:  # noqa: BLE001 - aggregate per-item failures for ops report
            report.failures += 1
            report.errors.append(
                {
                    "seedId": row["seed_id"],
                    "swagkeyProductId": product_id,
                    "reason": str(exc) or exc.__class__.__name__,
                },
            )
            continue

        report.checked += 1
        if current == baseline:
            report.unchanged += 1
            continue

        report.changed += 1
        report.changes.append(
            ImageUrlChange(
                seed_id=row["seed_id"],
                family=row["family"],
                seed_name=row["seed_name"],
                swagkey_product_id=product_id,
                source_url=row["source_url"],
                previous_image_url=baseline,
                current_image_url=current,
                check_mode=mode,
            ),
        )

    return report


def image_url_changes_for_alert(changes: list[ImageUrlChange]) -> list[dict[str, Any]]:
    return [
        {
            "family": change.family,
            "seedId": change.seed_id,
            "seedName": change.seed_name,
            "swagkeyProductId": change.swagkey_product_id,
            "sourceUrl": change.source_url,
            "previousImageUrl": change.previous_image_url,
            "currentImageUrl": change.current_image_url,
            "status": change.status,
            "checkMode": change.check_mode,
        }
        for change in changes
    ]


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
