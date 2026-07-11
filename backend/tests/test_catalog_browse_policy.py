from __future__ import annotations

from keyboard_recommender.application.catalog_browse_service import list_catalog_parts
from keyboard_recommender.catalog.catalog_browse_policy import BROWSE_EXCLUDED_SWAGKEY_IDX


def test_browse_excludes_all_verified_404_switch_idx() -> None:
    payload = list_catalog_parts("switch", limit=200)
    visible_idx = {
        part.source_url.split("idx=")[-1].split("&")[0]
        for part in payload.items
        if "idx=" in part.source_url
    }
    for blocked in ("384", "1589", "1216", "1668", "1677"):
        assert blocked in BROWSE_EXCLUDED_SWAGKEY_IDX
        assert blocked not in visible_idx


def test_browse_switch_has_no_shared_image_across_different_idx() -> None:
    payload = list_catalog_parts("switch", limit=200)
    by_image: dict[str, set[str]] = {}
    for item in payload.items:
        if not item.image_url:
            continue
        idx = item.source_url.split("idx=")[-1].split("&")[0] if "idx=" in item.source_url else item.id
        by_image.setdefault(item.image_url, set()).add(idx)
    assert all(len(idxs) == 1 for idxs in by_image.values())


def test_browse_excludes_verified_404_switches() -> None:
    payload = list_catalog_parts("switch", limit=200)
    ids = {item.id for item in payload.items}
    for seed_id in (
        "sw-linear-008",
        "sw-linear-017",
        "sw-silent-002",
        "sw-silent-004",
        "sw-linear-006",
        "sw-other-003",
        "sw-other-005",
        "sw-other-006",
        "sw-other-008",
        "sw-other-011",
        "sw-other-016",
        "sw-other-020",
        "sw-other-021",
    ):
        assert seed_id not in ids


def test_browse_dedupes_same_swagkey_product_once() -> None:
    payload = list_catalog_parts("switch", limit=200)
    ids = {item.id for item in payload.items}
    assert "sw-tactile-002" not in ids
    assert "sw-tactile-003" in ids
    assert "sw-tactile-007" not in ids
    assert "sw-silent-003" in ids


def test_browse_layout_shows_archetypes_and_real_pcb_products() -> None:
    from keyboard_recommender.application.catalog_browse_service import get_catalog_part

    payload = list_catalog_parts("layout", limit=200)
    assert payload.total == 45
    archetypes = [item for item in payload.items if item.reference_layout]
    products = [item for item in payload.items if not item.reference_layout]
    assert len(archetypes) == 7
    assert all(item.source_url == "" for item in archetypes)
    assert all(item.image_url.startswith("/layout-diagrams/") for item in archetypes)
    assert products
    assert all(item.source_url.startswith("https://") for item in products)
    detail = get_catalog_part("layout", "layout-001")
    assert detail is not None
    assert detail.reference_layout is True
    assert detail.image_url == "/layout-diagrams/60-standard.svg"
    assert detail.source_url == ""
    pcb = next((item for item in payload.items if not item.reference_layout), None)
    assert pcb is not None
    pcb_detail = get_catalog_part("layout", pcb.id)
    assert pcb_detail is not None
    assert pcb_detail.reference_layout is False
    assert pcb_detail.source_url.startswith("https://")


def test_dedupe_prefers_image_and_legacy_id() -> None:
    from keyboard_recommender.catalog.catalog_browse_policy import dedupe_browse_summaries
    from keyboard_recommender.schemas.catalog import CatalogPartSummary

    items = dedupe_browse_summaries(
        [
            CatalogPartSummary(
                id="foam-new-003",
                name="new",
                family="foam",
                subtype="foam",
                source_url="https://www.swagkey.kr/shop_view/?idx=1572",
                image_url="",
            ),
            CatalogPartSummary(
                id="foam-005",
                name="legacy",
                family="foam",
                subtype="foam",
                source_url="https://www.swagkey.kr/shop_view/?idx=1572",
                image_url="https://cdn.imweb.me/thumbnail/x.jpg",
            ),
        ],
    )
    assert len(items) == 1
    assert items[0].id == "foam-005"
