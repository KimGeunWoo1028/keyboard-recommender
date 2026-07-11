from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PenaltyLine:
    """One soft compatibility adjustment with a stable `rule_id` for tests and UI."""

    rule_id: str
    raw_penalty: float
    effective_penalty: float
    message: str
    severity: str = "soft_penalty"  # hard_incompatibility | soft_penalty | warning
    state: str = "soft"  # hard | soft | warning
    category: str = "general"


@dataclass(frozen=True, slots=True)
class BuildCompatibilityAudit:
    """Aggregated compatibility outcome for a single (switch, plate, foam, layout) build."""

    lines: tuple[PenaltyLine, ...]
    intent_multiplier: float
    raw_penalty_total: float
    effective_penalty_total: float
    has_hard_incompatibility: bool = False
    hard_incompatibility_count: int = 0
    soft_penalty_count: int = 0
    warning_count: int = 0
    summary_lines: tuple[str, ...] = ()
