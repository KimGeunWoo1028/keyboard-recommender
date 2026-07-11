"""Tests for Swagkey local image mirror download and URL resolution."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

from keyboard_recommender.catalog.swagkey_image_mirror import (
    iter_seed_mirror_candidates,
    mirror_seed_images,
)
from keyboard_recommender.infrastructure.swagkey_images import resolve_served_image_url

_JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 64
_PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_iter_seed_mirror_candidates_dedupes_by_idx() -> None:
    payload = {
        "switches": {
            "linear": [
                {
                    "id": "sw-linear-001",
                    "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1792",
                    "imageUrl": "https://cdn.imweb.me/thumbnail/20260507/f4d4a59fbeb2b.jpg",
                },
                {
                    "id": "sw-linear-002",
                    "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1792",
                    "imageUrl": "https://cdn.imweb.me/thumbnail/20260507/other.jpg",
                },
            ]
        }
    }
    rows = iter_seed_mirror_candidates(payload)
    assert len(rows) == 1
    assert rows[0]["idx"] == "1792"


def test_mirror_seed_images_downloads_and_skips_existing(tmp_path: Path) -> None:
    payload = {
        "switches": {
            "linear": [
                {
                    "id": "sw-linear-001",
                    "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1792",
                    "imageUrl": "https://cdn.imweb.me/thumbnail/20260507/f4d4a59fbeb2b.jpg",
                }
            ]
        }
    }

    with patch(
        "keyboard_recommender.catalog.swagkey_image_mirror.fetch_image_bytes",
        return_value=_JPEG_BYTES,
    ):
        first = mirror_seed_images(payload, tmp_path)
    assert first.downloaded == 1
    assert (tmp_path / "1792.jpg").is_file()

    with patch(
        "keyboard_recommender.catalog.swagkey_image_mirror.fetch_image_bytes",
        side_effect=AssertionError("should not download when file exists"),
    ):
        second = mirror_seed_images(payload, tmp_path)
    assert second.skipped_existing == 1
    assert second.downloaded == 0


def test_mirror_seed_images_records_invalid_format(tmp_path: Path) -> None:
    payload = {
        "cases": [
            {
                "id": "case-001",
                "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1415",
                "imageUrl": "https://cdn.imweb.me/thumbnail/20251106/a78876b51f78c.png",
            }
        ]
    }
    with patch(
        "keyboard_recommender.catalog.swagkey_image_mirror.fetch_image_bytes",
        return_value=b"not-an-image",
    ):
        report = mirror_seed_images(payload, tmp_path)
    assert report.failed == 1
    assert report.failures[0]["reason"] == "unsupported_image_format"


def test_resolve_served_image_url_prefers_local_file(tmp_path: Path) -> None:
    cdn = "https://cdn.imweb.me/thumbnail/20260507/f4d4a59fbeb2b.jpg"
    source = "https://www.swagkey.kr/shop_view/?idx=1792"
    assert resolve_served_image_url(cdn, source, tmp_path) == cdn
    (tmp_path / "1792.png").write_bytes(_PNG_BYTES)
    assert resolve_served_image_url(cdn, source, tmp_path) == "/media/swagkey-images/1792.png"


def test_mirror_report_json_roundtrip(tmp_path: Path) -> None:
    seed_path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    with patch(
        "keyboard_recommender.catalog.swagkey_image_mirror.fetch_image_bytes",
        return_value=_JPEG_BYTES,
    ):
        report = mirror_seed_images(payload, tmp_path, limit=2, sleep_ms=0)
    data = report.to_dict()
    assert data["stats"]["totalCandidates"] == 2
    assert data["stats"]["downloaded"] == 2
