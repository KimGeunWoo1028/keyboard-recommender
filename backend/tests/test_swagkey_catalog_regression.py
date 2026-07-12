from __future__ import annotations

import json
from pathlib import Path

import pytest

from keyboard_recommender.catalog.swagkey_catalog_regression import validate_swagkey_catalog_ingestion

_BACKEND = Path(__file__).resolve().parents[1]
_SEED = _BACKEND / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
_MANIFEST = _BACKEND / "data" / "catalog_ingestion_manifest.json"
_MERGED_COUNTS = {"switch": 66, "plate": 20, "foam": 10, "layout": 45, "case": 126, "keycap": 62}


def test_swagkey_catalog_ingestion_validates_seed() -> None:
    if not _SEED.is_file() or not _MANIFEST.is_file():
        pytest.skip("seed or catalog_ingestion_manifest.json missing")

    report, ingestion = validate_swagkey_catalog_ingestion(
        seed_path=_SEED,
        manifest_path=_MANIFEST,
    )

    assert report.validation_errors == 0
    assert report.extracted_count == sum(_MERGED_COUNTS.values())
    assert report.seed_counts == _MERGED_COUNTS
    assert report.published is False
    assert ingestion.validation_errors == []


def test_catalog_ingestion_manifest_points_at_seed() -> None:
    if not _MANIFEST.is_file():
        pytest.skip("catalog_ingestion_manifest.json missing")

    payload = json.loads(_MANIFEST.read_text(encoding="utf-8"))
    feeds = payload.get("structured_feeds")
    assert isinstance(feeds, list) and feeds
    path = str(feeds[0].get("path") if isinstance(feeds[0], dict) else feeds[0])
    assert "swagkey_products.seed.json" in path
