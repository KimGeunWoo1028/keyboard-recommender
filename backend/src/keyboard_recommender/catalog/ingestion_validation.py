"""Validation framework for catalog ingestion."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Sequence
from typing import Any

from keyboard_recommender.catalog.metadata_mapping import (
    derive_case_traits,
    derive_foam_traits,
    derive_keycap_traits,
    derive_layout_traits,
    derive_plate_traits,
    derive_switch_traits,
)
from keyboard_recommender.catalog.metadata_models import (
    CaseMetadata,
    FoamMetadata,
    KeycapMetadata,
    LayoutMetadata,
    PlateMetadata,
    SwitchMetadata,
)
from keyboard_recommender.catalog.validation import validate_component_metadata
from keyboard_recommender.catalog.ingestion_models import NormalizedCatalogRecord, ValidationIssue


def _derive_traits_for_suspicion(row: NormalizedCatalogRecord) -> dict[str, float] | None:
    try:
        if row.family == "switch":
            return derive_switch_traits(SwitchMetadata.model_validate(row.metadata))
        if row.family == "plate":
            return derive_plate_traits(PlateMetadata.model_validate(row.metadata))
        if row.family == "foam":
            return derive_foam_traits(FoamMetadata.model_validate(row.metadata))
        if row.family == "layout":
            return derive_layout_traits(LayoutMetadata.model_validate(row.metadata))
        if row.family == "case":
            return derive_case_traits(CaseMetadata.model_validate(row.metadata))
        if row.family == "keycap":
            return derive_keycap_traits(KeycapMetadata.model_validate(row.metadata))
    except Exception:
        return None
    return None


def validate_records(rows: Sequence[NormalizedCatalogRecord]) -> tuple[list[ValidationIssue], list[ValidationIssue]]:
    errors: list[ValidationIssue] = []
    warnings: list[ValidationIssue] = []
    by_id: dict[tuple[str, str], int] = defaultdict(int)
    by_name: dict[tuple[str, str], list[str]] = defaultdict(list)

    for row in rows:
        by_id[(row.family, row.item_id)] += 1
        by_name[(row.family, row.name.lower())].append(row.item_id)

        if not row.item_id:
            errors.append(
                ValidationIssue(
                    level="error",
                    code="missing_id",
                    item_id=row.item_id,
                    family=row.family,
                    message="missing required field: id",
                ),
            )
        if not row.name:
            errors.append(
                ValidationIssue(
                    level="error",
                    code="missing_name",
                    item_id=row.item_id,
                    family=row.family,
                    message="missing required field: name",
                ),
            )
        meta_issues = validate_component_metadata(row.family, row.metadata)
        for msg in meta_issues:
            errors.append(
                ValidationIssue(
                    level="error",
                    code="invalid_metadata",
                    item_id=row.item_id,
                    family=row.family,
                    message=msg,
                ),
            )

        traits = _derive_traits_for_suspicion(row)
        if traits is None:
            warnings.append(
                ValidationIssue(
                    level="warning",
                    code="trait_derivation_failed",
                    item_id=row.item_id,
                    family=row.family,
                    message="trait derivation failed; check metadata completeness",
                ),
            )
            continue
        vals = list(traits.values())
        if vals and max(vals) - min(vals) < 0.4:
            warnings.append(
                ValidationIssue(
                    level="warning",
                    code="suspicious_flat_traits",
                    item_id=row.item_id,
                    family=row.family,
                    message="derived trait profile is unusually flat",
                ),
            )
        extreme_count = sum(1 for v in vals if v >= 9.5)
        if extreme_count >= 5:
            warnings.append(
                ValidationIssue(
                    level="warning",
                    code="suspicious_extreme_traits",
                    item_id=row.item_id,
                    family=row.family,
                    message="too many extreme trait outputs; verify source metadata",
                ),
            )

    for (family, item_id), count in by_id.items():
        if count > 1:
            errors.append(
                ValidationIssue(
                    level="error",
                    code="duplicate_id",
                    item_id=item_id,
                    family=family,
                    message=f"duplicate product id detected: {item_id}",
                ),
            )
    for (family, lowered_name), ids in by_name.items():
        if len(ids) > 1:
            warnings.append(
                ValidationIssue(
                    level="warning",
                    code="duplicate_name",
                    item_id=ids[0],
                    family=family,
                    message=f"duplicate display name detected: {lowered_name} ({', '.join(ids[:4])})",
                ),
            )
    return errors, warnings

