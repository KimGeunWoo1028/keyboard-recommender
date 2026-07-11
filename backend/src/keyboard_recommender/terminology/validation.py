"""Validate lexicon rows against canonical axis ids and sane metadata."""

from __future__ import annotations

from collections.abc import Iterable

from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.terminology.models import CommunityTermDefinition


def validate_term_definition(entry: CommunityTermDefinition) -> list[str]:
    """Return human-readable issues; empty list means OK."""
    issues: list[str] = []
    if not entry.id.strip():
        issues.append("empty term id")
    if not entry.synonyms:
        issues.append(f"{entry.id}: no synonyms")
    seen: set[str] = set()
    for syn in entry.synonyms:
        n = syn.strip().lower()
        if not n:
            issues.append(f"{entry.id}: empty synonym")
            continue
        if n in seen:
            issues.append(f"{entry.id}: duplicate synonym {n!r}")
        seen.add(n)
    if not (0.0 < entry.intrinsic_confidence <= 1.0):
        issues.append(f"{entry.id}: intrinsic_confidence must be in (0, 1]")
    axes = {c.axis for c in entry.trait_contributions}
    unknown = axes - set(TRAIT_AXIS_IDS)
    if unknown:
        issues.append(f"{entry.id}: unknown axes {sorted(unknown)}")
    if not entry.trait_contributions:
        issues.append(f"{entry.id}: no trait contributions")
    return issues


def validate_dictionary(entries: Iterable[CommunityTermDefinition]) -> list[str]:
    """Validate entire lexicon + global uniqueness of ids and synonym surfaces."""
    issues: list[str] = []
    entries_list = list(entries)
    ids = [e.id for e in entries_list]
    if len(ids) != len(set(ids)):
        issues.append("duplicate term ids across lexicon")

    synonym_owner: dict[str, str] = {}
    for e in entries_list:
        issues.extend(validate_term_definition(e))
        for syn in e.synonyms:
            n = syn.strip().lower()
            if not n:
                continue
            prev = synonym_owner.get(n)
            if prev and prev != e.id:
                issues.append(f"synonym collision: {n!r} used by {prev!r} and {e.id!r}")
            synonym_owner.setdefault(n, e.id)
    return issues
