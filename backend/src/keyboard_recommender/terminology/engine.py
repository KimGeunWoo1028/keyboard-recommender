"""
Map community keyboard language → dense internal trait vectors.

**Algorithm (v1, rule-based)**:
1. Normalize text; extract tokens (letters, digits, hyphenated chunks).
2. Exact token lookup against synonym table (longest multi-word phrases can be added later
   via the same table by registering spaced synonyms).
3. For each hit, scale `TraitContribution` weights by `intrinsic_confidence` × options.
4. **Sum** contributions into the canonical `TRAIT_AXIS_IDS` vector (overlap = additive).
5. Optional **per-axis cap** to avoid runaway magnitude when many terms match.
6. Emit **conflicts** when two *different* terms push the same axis with meaningful opposite sign.

Future **NLP**: replace step 2–3 with a `TerminologySource` that returns weighted hypotheses
(e.g. embeddings → nearest glosses); keep steps 4–6 identical so the matcher stays stable.
"""

from __future__ import annotations

import re
from collections import defaultdict
from collections.abc import Mapping, Sequence

from keyboard_recommender.terminology.negation import polarity_multiplier
from keyboard_recommender.terminology.models import (
    CommunityTermDefinition,
    InterpretOptions,
    InterpretationResult,
    TraitConflict,
    TermMatch,
    contributions_to_dict,
)
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.vectors import add_scaled, empty_vector


_TOKEN_RE = re.compile(r"[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)?")

# Tokens not reported as "unknown" — reduces noise until an NLP tokenizer is plugged in.
_STOPWORDS: frozenset[str] = frozenset(
    {
        "a",
        "an",
        "the",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "from",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "i",
        "you",
        "we",
        "they",
        "it",
        "this",
        "that",
        "my",
        "your",
        "want",
        "like",
        "just",
        "really",
        "very",
        "some",
        "more",
        "less",
        "too",
        "not",
        "no",
        "yes",
        "keyboard",
        "switch",
        "switches",
        "build",
        "키보드",
        "스위치",
        "빌드",
        "느낌",
        "소리",
        "원해요",
        "원함",
        "좋아요",
        "선호",
        "그리고",
        "또는",
        "에서",
        "으로",
        "같은",
        "처럼",
        "조금",
        "많이",
        "너무",
        "정도",
        "느낌의",
        "타건",
        "타건감",
    },
)


def _tokenize(normalized: str) -> list[str]:
    return _TOKEN_RE.findall(normalized.lower())


def _synonym_index(lexicon: Sequence[CommunityTermDefinition]) -> dict[str, CommunityTermDefinition]:
    out: dict[str, CommunityTermDefinition] = {}
    for entry in lexicon:
        for syn in entry.synonyms:
            key = syn.strip().lower()
            if key:
                out[key] = entry
    return out


_KOREAN_SUFFIXES: tuple[str, ...] = (
    "하고",
    "하게",
    "한데",
    "한",
    "스럽게",
    "스러운",
    "스럽다",
    "느낌",
    "느낌의",
    "성향",
    "타건감",
    "타건",
    "소리",
    "스타일",
)


def _lookup_with_korean_variants(tok: str, index: Mapping[str, CommunityTermDefinition]) -> CommunityTermDefinition | None:
    entry = index.get(tok)
    if entry is not None:
        return entry
    for suf in _KOREAN_SUFFIXES:
        if tok.endswith(suf) and len(tok) > len(suf) + 1:
            stem = tok[: -len(suf)]
            entry = index.get(stem)
            if entry is not None:
                return entry
    return None


def interpret_community_text(
    text: str,
    lexicon: Sequence[CommunityTermDefinition],
    options: InterpretOptions | None = None,
) -> InterpretationResult:
    """
    Interpret free-form user text into the same trait axis space as `survey_profile`.

    Unknown words are collected but do not contribute to the vector.
    """
    opts = options or InterpretOptions()
    index = _synonym_index(lexicon)
    normalized = text.strip().lower()
    tokens = _tokenize(normalized)

    matches_list: list[TermMatch] = []
    unknown: list[str] = []
    axis_impulses: dict[str, list[tuple[str, float]]] = defaultdict(list)

    seen_terms: set[str] = set()
    for i, tok in enumerate(tokens):
        entry = _lookup_with_korean_variants(tok, index)
        if entry is None:
            if tok not in _STOPWORDS and tok not in unknown:
                unknown.append(tok)
            continue
        eff = max(0.0, min(1.0, entry.intrinsic_confidence * opts.global_confidence_scale))
        if entry.id in seen_terms:
            # Same passage repeating a term: gently reinforce (diminishing).
            eff *= 0.55
        seen_terms.add(entry.id)

        pol = polarity_multiplier(tokens, i)
        raw = contributions_to_dict(entry.trait_contributions)
        scaled = {k: raw.get(k, 0.0) * eff * pol for k in TRAIT_AXIS_IDS}
        matches_list.append(
            TermMatch(
                term_id=entry.id,
                surface=tok,
                intrinsic_confidence=entry.intrinsic_confidence,
                effective_confidence=eff * abs(pol),
                per_axis_scale=scaled,
            ),
        )
        for axis, val in scaled.items():
            if abs(val) > 1e-9:
                axis_impulses[axis].append((entry.id, val))

    v = empty_vector()
    for m in matches_list:
        v = add_scaled(v, m.per_axis_scale, 1.0)

    if opts.per_axis_abs_cap > 0:
        for k in TRAIT_AXIS_IDS:
            cap = opts.per_axis_abs_cap
            if v[k] > cap:
                v[k] = cap
            elif v[k] < -cap:
                v[k] = -cap

    conflicts = _detect_conflicts(axis_impulses, opts.conflict_opposition_threshold)
    warnings: list[str] = []
    if conflicts:
        warnings.append(
            f"{len(conflicts)} axis-level terminology conflict(s): consider clarifying or splitting NL input.",
        )

    tok_len = max(len(tokens), 1)
    unk_ratio = len(unknown) / tok_len
    parsing_confidence = min(
        1.0,
        0.12 + 0.2 * float(len(matches_list)) + max(0.0, 0.35 - unk_ratio),
    )

    return InterpretationResult(
        normalized_text=normalized,
        trait_vector=v,
        matches=tuple(matches_list),
        conflicts=tuple(conflicts),
        unknown_tokens=tuple(unknown),
        warnings=tuple(warnings),
        parsing_confidence=round(parsing_confidence, 4),
    )


def _detect_conflicts(
    axis_impulses: Mapping[str, list[tuple[str, float]]],
    threshold: float,
) -> list[TraitConflict]:
    out: list[TraitConflict] = []
    for axis, pairs in axis_impulses.items():
        pos = [(t, x) for t, x in pairs if x > 0.15]
        neg = [(t, x) for t, x in pairs if x < -0.15]
        if not pos or not neg:
            continue
        t_a, v_a = max(pos, key=lambda p: abs(p[1]))
        t_b, v_b = min(neg, key=lambda p: abs(p[1]))
        if t_a == t_b:
            continue
        if abs(v_a) + abs(v_b) < threshold:
            continue
        out.append(TraitConflict(axis=axis, term_a=t_a, term_b=t_b, signed_impulse_a=v_a, signed_impulse_b=v_b))
    return out


def merge_with_survey_traits(
    nl_vector: Mapping[str, float],
    survey_vector: Mapping[str, float],
    nl_weight: float = 0.45,
) -> dict[str, float]:
    """
    Blend NL-derived terminology vector with structured survey traits (same axis basis).

    `nl_weight` in [0,1] is the fraction applied to the NL branch before re-adding survey.
    """
    w = max(0.0, min(1.0, nl_weight))
    out = empty_vector()
    for k in TRAIT_AXIS_IDS:
        out[k] = (1.0 - w) * float(survey_vector.get(k, 0.0)) + w * float(nl_vector.get(k, 0.0))
    return out
