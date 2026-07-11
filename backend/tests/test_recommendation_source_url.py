"""Recommendation compute responses include Swagkey sourceUrl (roadmap ⑩)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from keyboard_recommender.app_factory import create_app
from keyboard_recommender.application.catalog_browse_service import resolve_catalog_source_url
from keyboard_recommender.catalog.swagkey_source_url import is_product_detail_url
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result
from tests.support.regression import STABLE_SURVEY

_VALID_SURVEY = dict(STABLE_SURVEY)


def test_resolve_catalog_source_url_matches_browse_rules() -> None:
    url = resolve_catalog_source_url("switch", "sw-linear-003", item_name="HMX Peach")
    assert url == "https://www.swagkey.kr/shop_view/?idx=1765"


def test_build_recommendation_result_includes_source_urls() -> None:
    payload = build_recommendation_result(_VALID_SURVEY)
    build_urls = payload["build"]["sourceUrls"]
    assert set(build_urls.keys()) == {"switch", "plate", "foam", "layout", "case", "keycap"}
    for pick in payload["recommendations"]:
        assert "sourceUrl" in pick
        assert isinstance(pick["sourceUrl"], str)
        assert "imageUrl" in pick
        assert isinstance(pick["imageUrl"], str)
        for alt in pick.get("alternatives") or []:
            assert "sourceUrl" in alt
            assert isinstance(alt["sourceUrl"], str)
            assert "imageUrl" in alt
            assert isinstance(alt["imageUrl"], str)

    switch_pick = next(p for p in payload["recommendations"] if p["domain"] == "switch")
    assert switch_pick["sourceUrl"] == build_urls["switch"]
    if is_product_detail_url(switch_pick["sourceUrl"]):
        assert "swagkey" in switch_pick["sourceUrl"].lower()


def test_post_compute_source_url_aligns_with_catalog_resolver() -> None:
    client = TestClient(create_app())
    res = client.post("/api/v1/recommendations/compute", json=_VALID_SURVEY)
    assert res.status_code == 200
    data = res.json()
    switch_pick = next(row for row in data["recommendations"] if row["domain"] == "switch")
    expected = resolve_catalog_source_url("switch", switch_pick["itemId"], item_name=switch_pick.get("itemName", ""))
    assert switch_pick["sourceUrl"] == expected
    assert data["build"]["sourceUrls"]["switch"] == expected
