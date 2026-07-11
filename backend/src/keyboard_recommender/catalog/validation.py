"""Validation helpers for catalog import / admin APIs."""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping

from pydantic import ValidationError

from keyboard_recommender.catalog.metadata_models import (
    CaseMetadata,
    FoamMetadata,
    KeycapMetadata,
    LayoutMetadata,
    PlateMetadata,
    SwitchMetadata,
)
from keyboard_recommender.catalog.trait_dictionary import FAMILY_TRAIT_ALLOWLIST, TRAIT_DICTIONARY
from keyboard_recommender.catalog.normalize import parse_tier


_SLUG_RE = re.compile(r"[^a-z0-9]+")


def normalize_component_slug(name: str) -> str:
    """Cheap duplicate-detection key (not i18n-perfect)."""
    return _SLUG_RE.sub("-", name.strip().lower()).strip("-")


def validate_tier_row(trait_id: str, tier: str) -> list[str]:
    issues: list[str] = []
    if trait_id not in TRAIT_DICTIONARY:
        issues.append(f"unknown trait_id: {trait_id!r}")
        return issues
    try:
        parse_tier(tier)
    except ValueError as e:
        issues.append(str(e))
    return issues


def validate_family_traits(family: str, traits: Mapping[str, str]) -> list[str]:
    """Ensure only known traits + family allowlist for tier-based rows."""
    issues: list[str] = []
    fam = family.strip().lower()
    allowed = FAMILY_TRAIT_ALLOWLIST.get(fam)
    if allowed is None:
        issues.append(f"unknown component family: {family!r}")
        return issues
    for tid, tier in traits.items():
        if tid not in TRAIT_DICTIONARY:
            issues.append(f"unknown trait: {tid!r}")
            continue
        if tid not in allowed:
            issues.append(f"trait {tid!r} not expected for family {fam!r}")
        issues.extend(validate_tier_row(tid, tier))
    return issues


def find_duplicate_slugs(names: Iterable[str]) -> dict[str, list[str]]:
    """Return slug -> list of names that collide (for importer warnings)."""
    buckets: dict[str, list[str]] = {}
    for n in names:
        s = normalize_component_slug(n)
        buckets.setdefault(s, []).append(n)
    return {k: v for k, v in buckets.items() if len(v) > 1}


def validate_component_metadata(family: str, metadata: Mapping[str, object] | None) -> list[str]:
    """Validate metadata payload against family-specific schema."""
    if metadata is None:
        return []
    fam = family.strip().lower()
    model = {
        "switch": SwitchMetadata,
        "plate": PlateMetadata,
        "foam": FoamMetadata,
        "layout": LayoutMetadata,
        "case": CaseMetadata,
        "keycap": KeycapMetadata,
    }.get(fam)
    if model is None:
        return [f"unsupported metadata family: {family!r}"]
    try:
        model.model_validate(dict(metadata))
    except ValidationError as exc:
        return [str(err["msg"]) for err in exc.errors()]
    return []
