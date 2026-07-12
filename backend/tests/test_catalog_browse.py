from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from keyboard_recommender.app_factory import create_app
from keyboard_recommender.application.catalog_browse_service import get_catalog_part, list_catalog_parts
from keyboard_recommender.schemas.catalog import CatalogListResponse, CatalogPartDetail


def test_list_switches_returns_seed_backed_items() -> None:
    payload = list_catalog_parts("switch", limit=200)
    assert payload.total >= 50
    assert len(payload.items) == payload.total
    assert payload.family == "switch"
    assert payload.items[0].id
    assert payload.items[0].name


def test_get_switch_includes_source_url_and_traits() -> None:
    detail = get_catalog_part("switch", "sw-linear-003")
    assert detail is not None
    assert detail.source_url.startswith("https://")
    assert detail.traits
    assert isinstance(detail.metadata, dict)


def test_get_switch_includes_image_url_when_seed_has_it() -> None:
    detail = get_catalog_part("switch", "sw-linear-001")
    assert detail is not None
    assert detail.image_url.startswith("https://cdn.imweb.me/thumbnail/") or detail.image_url.startswith(
        "/media/swagkey-images/"
    )


def test_get_switch_uses_local_mirror_when_file_exists(monkeypatch, tmp_path) -> None:
    from keyboard_recommender.config.settings import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "swagkey_images_dir", str(tmp_path))
    (tmp_path / "1792.jpg").write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 64)
    detail = get_catalog_part("switch", "sw-linear-001")
    assert detail is not None
    assert detail.image_url == "/media/swagkey-images/1792.jpg"


def test_get_switch_returns_empty_image_url_when_seed_missing() -> None:
    assert get_catalog_part("switch", "sw-linear-008") is None


def test_get_layout_includes_traits_without_shop_link() -> None:
    detail = get_catalog_part("layout", "layout-002")
    assert detail is not None
    assert detail.family == "layout"
    assert detail.source_url == ""
    assert detail.image_url.startswith("/layout-diagrams/")
    assert detail.traits
    assert isinstance(detail.metadata, dict)


def test_list_cases_includes_layout_tags_on_summary() -> None:
    payload = list_catalog_parts("case", limit=200)
    assert payload.total >= 1
    neo65 = next((item for item in payload.items if item.id == "case-001"), None)
    assert neo65 is not None
    assert neo65.layout_size == "65"
    assert "65" in neo65.compatible_layout_sizes


def test_list_cases_filters_by_layout_size_alice() -> None:
    filtered = list_catalog_parts("case", layout_size="alice", limit=200)
    assert filtered.total >= 1
    assert all("alice" in item.compatible_layout_sizes for item in filtered.items)


def test_list_keycaps_default_filter_excludes_addon_scopes() -> None:
    default_view = list_catalog_parts("keycap", limit=200)
    all_view = list_catalog_parts("keycap", subtype="all", limit=200)
    assert default_view.total < all_view.total
    assert default_view.total >= 50


def test_list_cases_filters_by_layout_size() -> None:
    filtered = list_catalog_parts("case", layout_size="65", limit=200)
    assert filtered.total >= 1
    assert filtered.layout_size == "65"
    assert all("65" in item.compatible_layout_sizes for item in filtered.items)
    assert all(item.id != "case-002" or "65" in item.compatible_layout_sizes for item in filtered.items)


def test_list_switches_subtype_filter() -> None:
    linear = list_catalog_parts("switch", subtype="linear", limit=200)
    assert linear.total >= 1
    assert all(item.subtype == "linear" for item in linear.items)


def test_list_switches_pagination() -> None:
    page1 = list_catalog_parts("switch", limit=10, offset=0)
    page2 = list_catalog_parts("switch", limit=10, offset=10)
    assert page1.total == page2.total
    assert page1.total >= 20
    assert len(page1.items) == 10
    assert len(page2.items) == 10
    assert {i.id for i in page1.items}.isdisjoint({i.id for i in page2.items})


def test_list_switches_search_by_name() -> None:
    peach = list_catalog_parts("switch", q="peach", limit=200)
    assert peach.total >= 1
    assert all("peach" in item.name.lower() for item in peach.items)


def test_get_missing_part_returns_none() -> None:
    assert get_catalog_part("plate", "does-not-exist") is None


def test_catalog_list_response_rejects_unknown_keys() -> None:
    with pytest.raises(ValidationError):
        CatalogListResponse.model_validate(
            {
                "family": "switch",
                "items": [],
                "total": 0,
                "limit": 50,
                "offset": 0,
                "extra": 1,
            },
        )


def test_catalog_browse_api_contract() -> None:
    client = TestClient(create_app())
    for path, min_total in (
        ("/api/v1/switches", 50),
        ("/api/v1/plates", 14),
        ("/api/v1/foam", 8),
        ("/api/v1/layouts", 30),
        ("/api/v1/cases", 100),
        ("/api/v1/keycaps", 50),
    ):
        res = client.get(path)
        assert res.status_code == 200, path
        data = res.json()
        for key in ("family", "items", "total", "limit", "offset"):
            assert key in data, f"{path} missing {key}"
        assert data["total"] >= min_total, path
        assert isinstance(data["items"], list)
        if data["items"]:
            row = data["items"][0]
            for key in (
                "id",
                "name",
                "description",
                "family",
                "subtype",
                "sourceUrl",
                "imageUrl",
                "popularityWeight",
            ):
                assert key in row, f"{path} item missing {key}"
            CatalogPartDetail.model_validate({**row, "traits": {}, "metadata": {}})

    list_one = client.get("/api/v1/switches", params={"limit": 1})
    assert list_one.status_code == 200
    first_switch = list_one.json()["items"][0]
    assert "imageUrl" in first_switch

    detail = client.get("/api/v1/switches/sw-linear-003")
    assert detail.status_code == 200
    detail_json = detail.json()
    assert detail_json["sourceUrl"].startswith("https://")
    assert "imageUrl" in detail_json
    assert isinstance(detail_json["traits"], dict)
    assert isinstance(detail_json["metadata"], dict)

    with_image = client.get("/api/v1/switches/sw-linear-001")
    assert with_image.status_code == 200
    image_url = with_image.json()["imageUrl"]
    assert image_url.startswith("https://cdn.imweb.me/thumbnail/") or image_url.startswith("/media/swagkey-images/")

    without_image = client.get("/api/v1/switches/sw-linear-008")
    assert without_image.status_code == 404

    search = client.get("/api/v1/switches", params={"q": "peach", "limit": 200})
    assert search.status_code == 200
    search_data = search.json()
    assert search_data["total"] >= 1
    assert all("peach" in row["name"].lower() for row in search_data["items"])

    page = client.get("/api/v1/switches", params={"limit": 10, "offset": 10})
    assert page.status_code == 200
    page_data = page.json()
    assert page_data["limit"] == 10
    assert page_data["offset"] == 10
    assert len(page_data["items"]) == 10
    CatalogPartDetail.model_validate(detail_json)

    missing = client.get("/api/v1/plates/not-a-real-plate")
    assert missing.status_code == 404


def test_swagkey_images_static_mount(monkeypatch, tmp_path) -> None:
    from keyboard_recommender.config.settings import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "swagkey_images_dir", str(tmp_path))
    (tmp_path / "1792.jpg").write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 64)
    client = TestClient(create_app(settings=settings))
    res = client.get("/media/swagkey-images/1792.jpg")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("image/")
