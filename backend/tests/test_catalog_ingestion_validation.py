from __future__ import annotations

from keyboard_recommender.catalog.ingestion_models import NormalizedCatalogRecord
from keyboard_recommender.catalog.ingestion_validation import validate_records


def _row(
    *,
    family: str = "switch",
    item_id: str = "sw-1",
    name: str = "A",
    metadata: dict | None = None,
) -> NormalizedCatalogRecord:
    return NormalizedCatalogRecord(
        source_type="vendor_pages",
        source_path="source.json",
        family=family,  # type: ignore[arg-type]
        item_id=item_id,
        name=name,
        subtype="linear" if family == "switch" else family,
        metadata=dict(metadata or {}),
    )


def test_validation_detects_duplicate_ids_and_invalid_metadata() -> None:
    rows = [
        _row(metadata={"spring_weight_g": 45}),
        _row(name="B", metadata={"spring_weight_g": 5}),  # duplicate id + invalid metadata range
    ]
    errors, warnings = validate_records(rows)
    assert any(x.code == "duplicate_id" for x in errors)
    assert any(x.code == "invalid_metadata" for x in errors)
    assert isinstance(warnings, list)


def test_validation_warns_on_duplicate_names() -> None:
    rows = [
        _row(item_id="sw-1", name="Same", metadata={"spring_weight_g": 45}),
        _row(item_id="sw-2", name="same", metadata={"spring_weight_g": 46}),
    ]
    errors, warnings = validate_records(rows)
    assert not errors
    assert any(x.code == "duplicate_name" for x in warnings)

