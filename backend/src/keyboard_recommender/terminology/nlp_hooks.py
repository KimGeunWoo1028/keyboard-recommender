"""
Hooks for future NLP / embedding backends.

Implement `expand_hypotheses` to propose *soft* term hits (surface, term_id, confidence)
before vector aggregation; `interpret_community_text` stays the merge + conflict stage.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Protocol, runtime_checkable

if TYPE_CHECKING:
    pass


@dataclass(frozen=True, slots=True)
class SoftTermHypothesis:
    """One fuzzy or model-proposed match (not yet committed to the lexicon)."""

    surface: str
    term_id: str
    confidence: float
    rationale: str = ""


@runtime_checkable
class TerminologyExpander(Protocol):
    """Pluggable strategy: rules today, bi-encoder or LLM-reranker tomorrow."""

    def expand_hypotheses(self, normalized_text: str) -> list[SoftTermHypothesis]:
        """Return zero or more soft hits; keep confidences calibrated to [0, 1]."""
        ...


class RuleOnlyExpander:
    """Default no-op expander (dictionary pass is enough)."""

    def expand_hypotheses(self, normalized_text: str) -> list[SoftTermHypothesis]:
        return []
