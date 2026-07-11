from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.ingestion_models import IngestionConfig
from keyboard_recommender.catalog.ingestion_pipeline import run_catalog_ingestion


def _seed_payload() -> dict:
    return {
        "switches": {
            "linear": [
                {
                    "id": "sw-001",
                    "name": "Old Switch",
                    "category": "switch",
                    "subtype": "linear",
                    "sourceUrl": "https://example.com/s1",
                    "metadata": {"spring_weight_g": 45},
                },
            ],
        },
        "plates": [],
        "foams": [],
        "layouts": [],
    }


def test_ingestion_requires_review_before_publish(tmp_path: Path) -> None:
    source_file = tmp_path / "source.json"
    source_file.write_text(
        json.dumps(
            {
                "switches": {
                    "linear": [
                        {
                            "id": "sw-001",
                            "name": "New Switch",
                            "sourceUrl": "https://example.com/s1",
                            "metadata": {"spring_weight_g": 48},
                        }
                    ]
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    manifest = tmp_path / "manifest.json"
    manifest.write_text(
        json.dumps({"vendor_pages": [{"path": str(source_file)}]}, ensure_ascii=False),
        encoding="utf-8",
    )

    original = _seed_payload()
    updated, report = run_catalog_ingestion(
        seed_payload=original,
        manifest_path=manifest,
        base_dir=tmp_path,
        cfg=IngestionConfig(require_review=True, review_approved=False),
    )
    assert report.published is False
    assert updated == original
    assert report.diff.changed_ids


def test_ingestion_publishes_when_review_approved(tmp_path: Path) -> None:
    source_file = tmp_path / "source.json"
    source_file.write_text(
        json.dumps(
            {
                "switches": {
                    "linear": [
                        {
                            "id": "sw-001",
                            "name": "Updated Switch",
                            "sourceUrl": "https://example.com/s1",
                            "metadata": {"spring_weight_g": 49},
                        },
                        {
                            "id": "sw-002",
                            "name": "New Switch",
                            "sourceUrl": "https://example.com/s2",
                            "metadata": {"spring_weight_g": 43},
                        },
                    ]
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    manifest = tmp_path / "manifest.json"
    manifest.write_text(
        json.dumps({"vendor_pages": [{"path": str(source_file)}]}, ensure_ascii=False),
        encoding="utf-8",
    )
    updated, report = run_catalog_ingestion(
        seed_payload=_seed_payload(),
        manifest_path=manifest,
        base_dir=tmp_path,
        cfg=IngestionConfig(require_review=True, review_approved=True),
    )
    assert report.published is True
    linear = updated["switches"]["linear"]
    by_id = {row["id"]: row for row in linear}
    assert by_id["sw-001"]["name"] == "Updated Switch"
    assert "sw-002" in by_id

