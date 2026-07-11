"""
Lightweight negation handling for token-level glossary hits (no LLM).

Heuristics (v1):
* ``not`` / ``no`` / ``never`` / ``without`` in the few tokens **before** a matched term → flip that hit.
* ``not`` + ``too`` immediately before a match → **attenuate** (partial disagreement, not full inversion).
"""

from __future__ import annotations

_NEGATORS: frozenset[str] = frozenset({"not", "no", "never", "without", "안", "아니", "별로", "덜"})


def polarity_multiplier(tokens: list[str], match_index: int) -> float:
    """
    Return a scalar applied to a matched term's axis contributions.

    * ``1.0`` — default (affirmative).
    * ``-0.62`` — hard negation (``not creamy``).
    * ``0.42`` — ``not too`` + term (``not too muted`` softens the hit).
    """
    i = match_index
    if i >= 2 and ((tokens[i - 2] == "not" and tokens[i - 1] == "too") or (tokens[i - 2] == "안" and tokens[i - 1] == "너무")):
        return 0.42
    if i >= 1 and tokens[i - 1] in _NEGATORS:
        return -0.62
    if i >= 2 and tokens[i - 2] in _NEGATORS and tokens[i - 1] in {"really", "진짜"}:
        return -0.48
    return 1.0
