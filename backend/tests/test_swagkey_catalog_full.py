from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from keyboard_recommender.app_factory import create_app
from keyboard_recommender.application.full_catalog_browse_service import (
    get_full_catalog_item,
    list_full_catalog_items,
)
from keyboard_recommender.catalog.swagkey_catalog_full import (
    build_swagkey_catalog_full,
    infer_full_catalog_category,
    validate_full_catalog_payload,
)

_DATA = Path(__file__).resolve().parents[1] / "data" / "swagkey_inventory"
_CANDIDATES = _DATA / "recommender_candidates.json"
_INVENTORY = _DATA / "swagkey_inventory.v2.json"
_FULL_CATALOG = _DATA / "swagkey_catalog_full.json"


def test_infer_full_catalog_category_keycaps() -> None:
    assert infer_full_catalog_category({"category": "Keycaps", "ruleId": "category:keycaps"}) == "keycap"


def test_infer_full_catalog_category_deskpad_keyword() -> None:
    assert infer_full_catalog_category({"category": "Keyboards", "productName": "GMK Deskmat"}) == "deskpad"


def test_build_swagkey_catalog_full_matches_out_of_scope_count() -> None:
    payload, report = build_swagkey_catalog_full(_CANDIDATES, _INVENTORY)
    candidates = json.loads(_CANDIDATES.read_text(encoding="utf-8"))
    expected = len(candidates["candidates"]["out_of_scope"])
    assert report.candidate_count == expected
    assert report.item_count == expected
    assert report.item_count >= 100
    assert validate_full_catalog_payload(payload) == []
    assert all(row.get("inRecommendationPool") is False for row in payload["items"])


def test_swagkey_catalog_full_json_exists_and_valid() -> None:
    assert _FULL_CATALOG.is_file(), "run scripts/build_swagkey_catalog_full.py first"
    payload = json.loads(_FULL_CATALOG.read_text(encoding="utf-8"))
    assert validate_full_catalog_payload(payload) == []
    assert payload["stats"]["total"] >= 100


def test_list_full_catalog_items() -> None:
    payload = list_full_catalog_items(limit=200)
    assert payload.total >= 100
    assert len(payload.items) <= 200
    assert payload.items[0].in_recommendation_pool is False


def test_list_full_catalog_category_filter() -> None:
    keycaps = list_full_catalog_items(catalog_category="keycap", limit=200)
    assert keycaps.total >= 60
    assert all(item.catalog_category == "keycap" for item in keycaps.items)


def test_list_full_catalog_search_by_brand() -> None:
    gmk = list_full_catalog_items(q="gmk", limit=200)
    assert gmk.total >= 1
    assert all("gmk" in (item.brand + item.name).lower() for item in gmk.items)


def test_get_full_catalog_item() -> None:
    listed = list_full_catalog_items(limit=1)
    assert listed.items
    detail = get_full_catalog_item(listed.items[0].id)
    assert detail is not None
    assert detail.inventory_id


def test_full_catalog_api_contract() -> None:
    client = TestClient(create_app())
    res = client.get("/api/v1/catalog/full?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 100
    assert isinstance(data["items"], list)
    assert len(data["items"]) <= 5
    row = data["items"][0]
    for key in ("id", "name", "brand", "swagkeyCategory", "catalogCategory", "sourceUrl", "inRecommendationPool"):
        assert key in row
    assert row["inRecommendationPool"] is False

    filtered = client.get("/api/v1/catalog/full?catalogCategory=keycap&limit=3")
    assert filtered.status_code == 200
    filtered_json = filtered.json()
    assert all(item["catalogCategory"] == "keycap" for item in filtered_json["items"])

    detail = client.get(f"/api/v1/catalog/full/{row['id']}")
    assert detail.status_code == 200
    assert detail.json()["inventoryId"]

    missing = client.get("/api/v1/catalog/full/does-not-exist")
    assert missing.status_code == 404
