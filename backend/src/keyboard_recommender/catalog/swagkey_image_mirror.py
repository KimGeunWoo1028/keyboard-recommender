"""Download Swagkey CDN thumbnails into backend/data/swagkey_images for local serving."""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

from keyboard_recommender.catalog.ingestion_pipeline import _flatten_seed
from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.catalog.swagkey_image_extractor import is_valid_swagkey_product_image_url
from keyboard_recommender.infrastructure.avatars import detect_image_extension
from keyboard_recommender.infrastructure.swagkey_images import ALLOWED_IMAGE_EXTENSIONS, find_local_image

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


@dataclass(slots=True)
class MirrorItemResult:
    seed_id: str
    idx: str
    image_url: str
    status: str
    local_file: str = ""
    reason: str = ""
    bytes_written: int = 0


@dataclass(slots=True)
class MirrorReport:
    generated_at: str
    seed_in: str
    images_dir: str
    total_candidates: int = 0
    downloaded: int = 0
    skipped_existing: int = 0
    failed: int = 0
    dry_run: bool = False
    items: list[MirrorItemResult] = field(default_factory=list)
    failures: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "generatedAt": self.generated_at,
            "seedIn": self.seed_in,
            "imagesDir": self.images_dir,
            "stats": {
                "totalCandidates": self.total_candidates,
                "downloaded": self.downloaded,
                "skippedExisting": self.skipped_existing,
                "failed": self.failed,
                "dryRun": self.dry_run,
            },
            "items": [asdict(item) for item in self.items],
            "failures": list(self.failures),
        }


def fetch_image_bytes(url: str, *, timeout_s: float = 30.0) -> bytes:
    req = Request(url=url, headers={"User-Agent": _USER_AGENT})
    with urlopen(req, timeout=timeout_s) as resp:  # noqa: S310 - controlled CDN URLs from seed
        data = resp.read()
    if not data:
        raise ValueError("empty_response")
    return data


def iter_seed_mirror_candidates(seed_payload: dict[str, Any]) -> list[dict[str, str]]:
    """Collect unique idx → imageUrl pairs from flattened seed rows."""
    seen_idx: set[str] = set()
    out: list[dict[str, str]] = []
    for (_family, seed_id), wrapped in _flatten_seed(seed_payload).items():
        row = dict(wrapped.get("row") or {})
        source_url = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        image_url = str(row.get("imageUrl") or row.get("image_url") or "").strip()
        idx = extract_product_id_from_url(source_url) or ""
        if not idx or idx in seen_idx:
            continue
        if not image_url or not is_valid_swagkey_product_image_url(image_url):
            continue
        seen_idx.add(idx)
        out.append({"seed_id": seed_id, "idx": idx, "image_url": image_url})
    return out


def mirror_seed_images(
    seed_payload: dict[str, Any],
    images_dir: Path,
    *,
    seed_in: str = "",
    force: bool = False,
    dry_run: bool = False,
    limit: int | None = None,
    sleep_ms: int = 0,
    timeout_s: float = 30.0,
) -> MirrorReport:
    images_dir.mkdir(parents=True, exist_ok=True)
    candidates = iter_seed_mirror_candidates(seed_payload)
    if limit is not None and limit >= 0:
        candidates = candidates[:limit]

    report = MirrorReport(
        generated_at=datetime.now(UTC).isoformat(),
        seed_in=seed_in,
        images_dir=str(images_dir.resolve()).replace("\\", "/"),
        total_candidates=len(candidates),
        dry_run=dry_run,
    )

    for row in candidates:
        idx = row["idx"]
        image_url = row["image_url"]
        seed_id = row["seed_id"]
        existing = find_local_image(idx, images_dir)
        if existing is not None and not force:
            report.skipped_existing += 1
            report.items.append(
                MirrorItemResult(
                    seed_id=seed_id,
                    idx=idx,
                    image_url=image_url,
                    status="skipped_existing",
                    local_file=existing.name,
                ),
            )
            continue

        if dry_run:
            report.items.append(
                MirrorItemResult(
                    seed_id=seed_id,
                    idx=idx,
                    image_url=image_url,
                    status="dry_run",
                ),
            )
            continue

        try:
            data = fetch_image_bytes(image_url, timeout_s=timeout_s)
            ext = detect_image_extension(data)
            if ext is None:
                raise ValueError("unsupported_image_format")
            if ext not in ALLOWED_IMAGE_EXTENSIONS:
                raise ValueError(f"unsupported_extension:{ext}")

            target = images_dir / f"{idx}.{ext}"
            for old in images_dir.glob(f"{idx}.*"):
                if old != target:
                    try:
                        old.unlink()
                    except OSError:
                        pass
            target.write_bytes(data)
            report.downloaded += 1
            report.items.append(
                MirrorItemResult(
                    seed_id=seed_id,
                    idx=idx,
                    image_url=image_url,
                    status="downloaded",
                    local_file=target.name,
                    bytes_written=len(data),
                ),
            )
        except Exception as exc:  # noqa: BLE001 - mirror CLI aggregates per-item failures
            report.failed += 1
            reason = str(exc) or exc.__class__.__name__
            report.failures.append(
                {
                    "seedId": seed_id,
                    "idx": idx,
                    "imageUrl": image_url,
                    "reason": reason,
                },
            )
            report.items.append(
                MirrorItemResult(
                    seed_id=seed_id,
                    idx=idx,
                    image_url=image_url,
                    status="failed",
                    reason=reason,
                ),
            )

        if sleep_ms > 0:
            time.sleep(sleep_ms / 1000.0)

    return report


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
