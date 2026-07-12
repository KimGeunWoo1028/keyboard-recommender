from __future__ import annotations

from keyboard_recommender.catalog.layout_diagrams import (
    is_layout_archetype_without_swagkey_product,
    resolve_layout_archetype_diagram_url,
)


def test_resolve_layout_archetype_diagram_url_maps_all_seven() -> None:
    assert resolve_layout_archetype_diagram_url("layout-001") == "/layout-diagrams/60-standard.svg"
    assert resolve_layout_archetype_diagram_url("layout-007") == "/layout-diagrams/split-60.svg"


def test_resolve_layout_archetype_diagram_url_ignores_products() -> None:
    assert resolve_layout_archetype_diagram_url("layout-new-001-gdk-lab-dk1-tkl-기판") == ""


def test_layout_archetype_without_swagkey_product_only_split_60() -> None:
    assert is_layout_archetype_without_swagkey_product("layout-007") is True
    assert is_layout_archetype_without_swagkey_product("layout-006") is False
