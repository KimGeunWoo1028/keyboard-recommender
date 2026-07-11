"""Core data structures for community-term → internal-trait interpretation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Sequence


@dataclass(frozen=True, slots=True)
class TraitContribution:
    """One axis influenced by a community term; `weight` is a signed relative strength."""

    axis: str
    weight: float


@dataclass(frozen=True, slots=True)
class CommunityTermDefinition:
    """
    Lexicon row: a surface form (or family of synonyms) maps to several internal axes.

    * `intrinsic_confidence` — lexicographer certainty for this gloss (0–1).
    * `trait_contributions` — relative shape in axis space; magnitudes are *relative*;
      the engine scales by match confidence and optional saturation.
    """

    id: str
    canonical_label: str
    synonyms: tuple[str, ...]
    trait_contributions: tuple[TraitContribution, ...]
    intrinsic_confidence: float = 0.75
    notes: str = ""
    tags: frozenset[str] = frozenset()


@dataclass(frozen=True, slots=True)
class TermMatch:
    """One occurrence of a known term in user text."""

    term_id: str
    surface: str
    intrinsic_confidence: float
    effective_confidence: float
    per_axis_scale: Mapping[str, float]  # how much this match moved each axis before merge


@dataclass(frozen=True, slots=True)
class TraitConflict:
    """
    Two matched terms pressure the same axis in opposite directions with non-trivial mass.

    Resolution is *not* automatic: callers may down-weight, ask the user, or keep both
    (transparent superposition) depending on product policy.
    """

    axis: str
    term_a: str
    term_b: str
    signed_impulse_a: float
    signed_impulse_b: float


@dataclass(slots=True)
class InterpretationResult:
    """Full output of interpreting free text through the terminology layer."""

    normalized_text: str
    trait_vector: dict[str, float]
    matches: tuple[TermMatch, ...] = ()
    conflicts: tuple[TraitConflict, ...] = ()
    unknown_tokens: tuple[str, ...] = ()
    warnings: tuple[str, ...] = ()
    # Heuristic 0–1: higher when more glossary hits and fewer unknown tokens vs length.
    parsing_confidence: float = 0.0


@dataclass(frozen=True, slots=True)
class InterpretOptions:
    """Tuning knobs for aggregation (stable defaults; extend for A/B or NLP backends)."""

    # Multiply each term's intrinsic confidence (e.g. down-rank fuzzy matches later).
    global_confidence_scale: float = 1.0
    # Cap per-axis absolute sum before optional soft saturation (0 = disabled).
    per_axis_abs_cap: float = 12.0
    # Axis pairs closer than this (after contributions) count as conflict candidates.
    conflict_opposition_threshold: float = 1.25


def contributions_to_dict(rows: Sequence[TraitContribution]) -> dict[str, float]:
    return {r.axis: float(r.weight) for r in rows}
