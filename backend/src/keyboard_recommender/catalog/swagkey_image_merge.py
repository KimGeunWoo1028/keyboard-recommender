"""Merge Swagkey product image URLs into inventory v3 and recommendation seed."""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.ingestion_pipeline import _flatten_seed
from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url

IMAGE_MERGE_SCHEMA_VERSION = "1.0.0"

MatchMethod = Literal["product_id", "source_url", "missing"]


@dataclass(slots=True)
class ImageRecord:
    swagkey_product_id: str
    image_url: str
    source_url: str = ""
    width: int | None = None
    height: int | None = None
    product_name: str = ""


@dataclass(slots=True)
class SeedImageMergeRow:
    seed_id: str
    family: str
    name: str
    source_url: str
    image_url: str = ""
    match_method: MatchMethod = "missing"
    match_score: float = 0.0
    matched_product_id: str = ""


@dataclass(slots=True)
class InventoryImageMergeReport:
    schema_version: str = IMAGE_MERGE_SCHEMA_VERSION
    generated_at: str = ""
    inventory_in: str = ""
    images_in: str = ""
    inventory_out: str = ""
    total_items: int = 0
    with_image: int = 0
    without_image: int = 0
    summary_lines: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "inventoryIn": self.inventory_in,
            "imagesIn": self.images_in,
            "inventoryOut": self.inventory_out,
            "totalItems": self.total_items,
            "withImage": self.with_image,
            "withoutImage": self.without_image,
            "summaryLines": self.summary_lines,
        }


@dataclass(slots=True)
class SeedImageMergeReport:
    schema_version: str = IMAGE_MERGE_SCHEMA_VERSION
    generated_at: str = ""
    seed_in: str = ""
    images_in: str = ""
    seed_out: str = ""
    seed_total: int = 0
    with_image: int = 0
    without_image: int = 0
    fill_rate_pct: float = 0.0
    by_method: dict[str, int] = field(default_factory=dict)
    rows: list[SeedImageMergeRow] = field(default_factory=list)
    manual_review_queue: list[dict[str, Any]] = field(default_factory=list)
    summary_lines: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "seedIn": self.seed_in,
            "imagesIn": self.images_in,
            "seedOut": self.seed_out,
            "seedTotal": self.seed_total,
            "withImage": self.with_image,
            "withoutImage": self.without_image,
            "fillRatePct": self.fill_rate_pct,
            "byMethod": dict(self.by_method),
            "rows": [
                {
                    "seedId": row.seed_id,
                    "family": row.family,
                    "name": row.name,
                    "sourceUrl": row.source_url,
                    "imageUrl": row.image_url,
                    "matchMethod": row.match_method,
                    "matchScore": row.match_score,
                    "matchedProductId": row.matched_product_id,
                }
                for row in self.rows
            ],
            "manualReviewQueue": list(self.manual_review_queue),
            "summaryLines": self.summary_lines,
        }


def load_product_images_artifact(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_image_lookup_from_inventory_items(inventory_items: list[dict[str, Any]]) -> dict[str, ImageRecord]:
    lookup: dict[str, ImageRecord] = {}
    for row in inventory_items:
        if not isinstance(row, dict):
            continue
        product_id = str(row.get("swagkeyProductId") or "").strip()
        image_url = str(row.get("imageUrl") or "").strip()
        if not product_id or not image_url:
            continue
        lookup[product_id] = ImageRecord(
            swagkey_product_id=product_id,
            image_url=image_url,
            source_url=str(row.get("sourceUrl") or "").strip(),
            width=row.get("imageWidth") if isinstance(row.get("imageWidth"), int) else None,
            height=row.get("imageHeight") if isinstance(row.get("imageHeight"), int) else None,
            product_name=str(row.get("productName") or "").strip(),
        )
    return lookup


def merge_image_lookups(*lookups: dict[str, ImageRecord]) -> dict[str, ImageRecord]:
    merged: dict[str, ImageRecord] = {}
    for lookup in lookups:
        merged.update(lookup)
    return merged


def build_image_lookup(artifact: dict[str, Any]) -> dict[str, ImageRecord]:
    lookup: dict[str, ImageRecord] = {}
    items = artifact.get("items")
    if not isinstance(items, list):
        return lookup
    for row in items:
        if not isinstance(row, dict):
            continue
        product_id = str(row.get("swagkeyProductId") or "").strip()
        image_url = str(row.get("imageUrl") or "").strip()
        if not product_id or not image_url:
            continue
        lookup[product_id] = ImageRecord(
            swagkey_product_id=product_id,
            image_url=image_url,
            source_url=str(row.get("sourceUrl") or "").strip(),
            width=row.get("width") if isinstance(row.get("width"), int) else None,
            height=row.get("height") if isinstance(row.get("height"), int) else None,
            product_name=str(row.get("productName") or "").strip(),
        )
    return lookup


def build_inventory_name_index(inventory_items: list[dict[str, Any]], lookup: dict[str, ImageRecord]) -> list[tuple[str, ImageRecord]]:
    """Deprecated: kept for API compatibility; fuzzy image merge is disabled."""
    _ = (inventory_items, lookup)
    return []


def _apply_image_fields(target: dict[str, Any], image: ImageRecord) -> None:
    target["imageUrl"] = image.image_url
    if image.width is not None:
        target["imageWidth"] = image.width
    if image.height is not None:
        target["imageHeight"] = image.height
    target["imageSource"] = "og:image"


def merge_images_into_inventory(
    inventory_payload: dict[str, Any],
    image_lookup: dict[str, ImageRecord],
) -> tuple[dict[str, Any], InventoryImageMergeReport]:
    out = json.loads(json.dumps(inventory_payload))
    items = out.get("items")
    if not isinstance(items, list):
        items = []
        out["items"] = items

    with_image = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        product_id = str(item.get("swagkeyProductId") or "").strip()
        image = image_lookup.get(product_id)
        if image is None:
            item.pop("imageUrl", None)
            item.pop("imageWidth", None)
            item.pop("imageHeight", None)
            item.pop("imageSource", None)
            continue
        _apply_image_fields(item, image)
        with_image += 1

    total = len([row for row in items if isinstance(row, dict)])
    report = InventoryImageMergeReport(
        generated_at=datetime.now(UTC).isoformat(),
        total_items=total,
        with_image=with_image,
        without_image=total - with_image,
        summary_lines=[
            f"inventory items: {total}",
            f"with imageUrl: {with_image}",
            f"without imageUrl: {total - with_image}",
        ],
    )
    stats = dict(out.get("stats") or {})
    stats["imageMerge"] = {
        "withImage": with_image,
        "withoutImage": total - with_image,
        "mergedAt": report.generated_at,
    }
    out["stats"] = stats
    out["schemaVersion"] = "1.1.0"
    source = dict(out.get("source") or {})
    source["imageMergedAt"] = report.generated_at
    out["source"] = source
    return out, report


def _match_seed_image(
    *,
    seed_row: dict[str, Any],
    image_lookup: dict[str, ImageRecord],
    inventory_name_index: list[tuple[str, ImageRecord]],
) -> SeedImageMergeRow:
    seed_id = str(seed_row.get("id") or "").strip()
    name = str(seed_row.get("name") or "").strip()
    source_url = normalize_product_detail_url(str(seed_row.get("sourceUrl") or "").strip())
    family = str(seed_row.get("category") or seed_row.get("family") or "").strip()

    product_id = extract_product_id_from_url(source_url)
    if product_id and product_id in image_lookup:
        image = image_lookup[product_id]
        return SeedImageMergeRow(
            seed_id=seed_id,
            family=family,
            name=name,
            source_url=source_url,
            image_url=image.image_url,
            match_method="product_id",
            match_score=1.0,
            matched_product_id=product_id,
        )

    if source_url:
        source_product_id = extract_product_id_from_url(source_url)
        for image in image_lookup.values():
            if normalize_product_detail_url(image.source_url) != source_url:
                continue
            if source_product_id and image.swagkey_product_id != source_product_id:
                continue
            return SeedImageMergeRow(
                    seed_id=seed_id,
                    family=family,
                    name=name,
                    source_url=source_url,
                    image_url=image.image_url,
                    match_method="source_url",
                    match_score=1.0,
                    matched_product_id=image.swagkey_product_id,
                )

    return SeedImageMergeRow(
        seed_id=seed_id,
        family=family,
        name=name,
        source_url=source_url,
        image_url="",
        match_method="missing",
    )


def merge_images_into_seed(
    seed_payload: dict[str, Any],
    image_lookup: dict[str, ImageRecord],
    *,
    inventory_items: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], SeedImageMergeReport]:
    out = json.loads(json.dumps(seed_payload))
    flat = _flatten_seed(out)
    inventory_name_index = build_inventory_name_index(inventory_items or [], image_lookup)

    rows: list[SeedImageMergeRow] = []
    by_method: dict[str, int] = {}
    manual_review_queue: list[dict[str, Any]] = []

    for (family, seed_id), wrapped in flat.items():
        seed_row = dict(wrapped.get("row") or {})
        merge_row = _match_seed_image(
            seed_row=seed_row,
            image_lookup=image_lookup,
            inventory_name_index=inventory_name_index,
        )
        rows.append(merge_row)
        by_method[merge_row.match_method] = by_method.get(merge_row.match_method, 0) + 1

        if merge_row.image_url:
            seed_row["imageUrl"] = merge_row.image_url
            seed_row["imageSource"] = "og:image"
        else:
            seed_row.pop("imageUrl", None)
            seed_row.pop("imageSource", None)

        if merge_row.match_method == "missing" and seed_row.get("sourceUrl"):
            manual_review_queue.append(
                {
                    "seedId": seed_id,
                    "family": family,
                    "name": merge_row.name,
                    "sourceUrl": merge_row.source_url,
                    "reason": "no_image_match",
                }
            )

        subtype = str(wrapped.get("subtype") or family)
        if family == "switch":
            switches = out.setdefault("switches", {})
            bucket = switches.setdefault(subtype, [])
            _replace_seed_row(bucket, seed_id, seed_row)
        else:
            family_key = {
                "plate": "plates",
                "foam": "foams",
                "layout": "layouts",
                "case": "cases",
                "keycap": "keycaps",
            }.get(family, f"{family}s")
            bucket = out.setdefault(family_key, [])
            _replace_seed_row(bucket, seed_id, seed_row)

    seed_total = len(rows)
    with_image = sum(1 for row in rows if row.image_url)
    fill_rate = round((with_image / seed_total) * 100, 2) if seed_total else 0.0
    target_fill_rate_pct = 95.0
    report = SeedImageMergeReport(
        generated_at=datetime.now(UTC).isoformat(),
        seed_total=seed_total,
        with_image=with_image,
        without_image=seed_total - with_image,
        fill_rate_pct=fill_rate,
        by_method=by_method,
        rows=sorted(rows, key=lambda row: row.seed_id),
        manual_review_queue=manual_review_queue,
        summary_lines=[
            f"seed total: {seed_total}",
            f"with imageUrl: {with_image}",
            f"without imageUrl: {seed_total - with_image}",
            f"fill rate: {fill_rate}%",
            f"target fill rate: {target_fill_rate_pct}%",
            f"target met: {fill_rate >= target_fill_rate_pct}",
            f"by method: {by_method}",
        ],
    )
    source = dict(out.get("source") or {})
    source["imageMergedAt"] = report.generated_at
    out["source"] = source
    return out, report


def _replace_seed_row(bucket: list[Any], seed_id: str, seed_row: dict[str, Any]) -> None:
    for index, existing in enumerate(bucket):
        if isinstance(existing, dict) and str(existing.get("id") or "").strip() == seed_id:
            bucket[index] = seed_row
            return
    bucket.append(seed_row)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def apply_seed_merge(*, merged_seed_path: Path, seed_path: Path) -> None:
    shutil.copyfile(merged_seed_path, seed_path)
