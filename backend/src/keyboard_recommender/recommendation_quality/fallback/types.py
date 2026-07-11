from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class FallbackRecoveryAudit:
    """Structured trace for incremental fallback (API / future UI hooks)."""

    recovered: bool
    tier: int
    """0 = baseline selection satisfied quality gates; >0 means a relaxation step was applied."""

    compatibility_relax_mult: float
    """Multiplier used for the *final* selection score (selection only, not audit values)."""

    diversity_strength_mult: float
    """Applied to diversity rerank strength after recovery (1.0 when tier 0)."""

    triggers: tuple[str, ...]
    confidence_before: float
    confidence_after: float
    overall_label: str
    notes: tuple[str, ...]
