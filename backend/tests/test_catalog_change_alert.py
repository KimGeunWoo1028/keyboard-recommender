"""Unit tests for catalog change alert (roadmap ⑮)."""

from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.catalog_change_alert import (
    build_catalog_change_alert,
    format_catalog_change_alert_text,
)


def test_build_catalog_change_alert_maps_statuses() -> None:
    diff = {
        "seed_path": "seed.json",
        "candidates_path": "candidates.json",
        "generated_at": "2026-07-08T00:00:00+00:00",
        "matched_count": 10,
        "new_in_crawl_count": 1,
        "seed_only_count": 1,
        "name_changed_count": 1,
        "pairs": [
            {
                "status": "matched",
                "family": "switch",
                "seed_id": "sw-1",
                "seed_name": "A",
                "crawl_id": "inv-1",
                "crawl_name": "A",
                "similarity": 1.0,
            },
            {
                "status": "new_in_crawl",
                "family": "switch",
                "seed_id": None,
                "seed_name": None,
                "crawl_id": "inv-2",
                "crawl_name": "New Switch",
                "similarity": 0.0,
                "recommendation_eligible": False,
            },
            {
                "status": "seed_only",
                "family": "plate",
                "seed_id": "plate-9",
                "seed_name": "Old Plate",
                "crawl_id": None,
                "crawl_name": None,
                "similarity": 0.0,
                "recommendation_eligible": True,
            },
            {
                "status": "name_changed",
                "family": "foam",
                "seed_id": "foam-1",
                "seed_name": "Old Foam",
                "crawl_id": "inv-3",
                "crawl_name": "New Foam Name",
                "similarity": 0.9,
                "recommendation_eligible": True,
            },
        ],
    }
    alert = build_catalog_change_alert(diff, generated_at="2026-07-08T12:00:00+00:00")
    assert alert["kind"] == "swagkey_catalog_change_alert"
    assert alert["hasAlerts"] is True
    assert alert["hasBlockingAlerts"] is True
    assert alert["counts"]["newInCrawl"] == 1
    assert alert["counts"]["possiblyDiscontinued"] == 1
    assert alert["counts"]["nameChanged"] == 1
    assert alert["counts"]["blockingAlertTotal"] == 2
    assert alert["counts"]["informationalTotal"] == 1
    assert alert["counts"]["alertTotal"] == 2
    assert alert["counts"]["imageUrlChanged"] == 0
    assert alert["newInCrawl"][0]["crawlName"] == "New Switch"
    assert alert["newInCrawl"][0]["alertTier"] == "informational"
    assert alert["possiblyDiscontinued"][0]["seedId"] == "plate-9"
    text = format_catalog_change_alert_text(alert)
    assert "BROWSE MERGE CANDIDATES" in text
    assert "BLOCKING" in text


def test_no_alerts_when_all_matched() -> None:
    alert = build_catalog_change_alert(
        {
            "matched_count": 5,
            "new_in_crawl_count": 0,
            "seed_only_count": 0,
            "name_changed_count": 0,
            "pairs": [{"status": "matched", "family": "switch", "seed_id": "a", "crawl_id": "b"}],
        }
    )
    assert alert["hasAlerts"] is False
    assert alert["hasBlockingAlerts"] is False
    assert alert["counts"]["alertTotal"] == 0


def test_build_from_committed_seed_inventory_diff_shape() -> None:
    path = Path(__file__).resolve().parents[1] / "data/swagkey_inventory/seed_inventory_diff.json"
    if not path.is_file():
        return
    payload = json.loads(path.read_text(encoding="utf-8"))
    alert = build_catalog_change_alert(payload)
    assert "stats" in payload or "pairs" in payload
    assert alert["counts"]["alertTotal"] == (
        alert["counts"]["blockingAlertTotal"]
        + alert["counts"].get("imageUrlChanged", 0)
    )
    assert len(alert["possiblyDiscontinued"]) == alert["counts"]["possiblyDiscontinued"]
