from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class DiversityFamilyAudit:
    """Per-family rerank summary (deterministic, for API / future UI)."""

    family: str
    original_order_ids: tuple[str, ...]
    reranked_order_ids: tuple[str, ...]
    """Short machine-readable notes (e.g. hooks for future natural-language explanations)."""
    notes: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class DiversityRerankAudit:
    """Container for all families after diversity reranking."""

    families: tuple[DiversityFamilyAudit, ...]
