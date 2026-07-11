"""Tests for Swagkey image URL recheck (Phase 8)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

from keyboard_recommender.catalog.catalog_change_alert import (
    build_catalog_change_alert,
    format_catalog_change_alert_text,
)
from keyboard_recommender.catalog.swagkey_image_url_recheck import (
    image_url_changes_for_alert,
    run_image_url_recheck,
)

_OG_HTML = """
<html><head>
<meta property="og:url" content="https://www.swagkey.kr/shop_view/?idx=1792" />
<meta property="og:image" content="https://cdn.imweb.me/thumbnail/20260710/new-image.jpg" />
</head><body></body></html>
"""

_SEED_PAYLOAD = {
    "switches": {
        "linear": [
            {
                "id": "sw-linear-001",
                "name": "Test Switch",
                "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1792",
                "imageUrl": "https://cdn.imweb.me/thumbnail/20260507/old-image.jpg",
            }
        ]
    }
}


def test_run_image_url_recheck_fixture_detects_change(tmp_path: Path) -> None:
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    (cache_dir / "1792.html").write_text(_OG_HTML, encoding="utf-8")

    report = run_image_url_recheck(
        _SEED_PAYLOAD,
        mode="fixture",
        cache_dir=cache_dir,
        seed_path="seed.json",
    )
    assert report.checked == 1
    assert report.changed == 1
    assert report.changes[0].previous_image_url.endswith("old-image.jpg")
    assert report.changes[0].current_image_url.endswith("new-image.jpg")


def test_run_image_url_recheck_fixture_skips_missing_cache(tmp_path: Path) -> None:
    report = run_image_url_recheck(
        _SEED_PAYLOAD,
        mode="fixture",
        cache_dir=tmp_path / "cache",
        seed_path="seed.json",
    )
    assert report.checked == 0
    assert report.skipped_no_cache == 1
    assert report.changed == 0


def test_image_url_changes_merge_into_catalog_alert(tmp_path: Path) -> None:
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    (cache_dir / "1792.html").write_text(_OG_HTML, encoding="utf-8")
    report = run_image_url_recheck(_SEED_PAYLOAD, mode="fixture", cache_dir=cache_dir)
    changes = image_url_changes_for_alert(report.changes)

    alert = build_catalog_change_alert(
        {
            "matched_count": 1,
            "new_in_crawl_count": 0,
            "seed_only_count": 0,
            "name_changed_count": 0,
            "pairs": [],
        },
        image_url_changes=changes,
        generated_at="2026-07-10T12:00:00+00:00",
    )
    assert alert["counts"]["imageUrlChanged"] == 1
    assert alert["counts"]["alertTotal"] == 1
    assert alert["hasAlerts"] is True
    assert alert["imageUrlChanged"][0]["status"] == "image_url_changed"
    text = format_catalog_change_alert_text(alert)
    assert "IMAGE URL CHANGED" in text
    assert "old-image.jpg" in text
    assert "new-image.jpg" in text


def test_run_image_url_recheck_live_uses_fetcher(tmp_path: Path) -> None:
    def fake_fetch(_url: str) -> str:
        return _OG_HTML

    with patch(
        "keyboard_recommender.catalog.swagkey_image_url_recheck.fetch_html",
        side_effect=AssertionError("should use injected fetcher"),
    ):
        report = run_image_url_recheck(
            _SEED_PAYLOAD,
            mode="live",
            cache_dir=tmp_path,
            fetcher=fake_fetch,
        )
    assert report.checked == 1
    assert report.changed == 1
