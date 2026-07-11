# Keyboard terminology interpretation system

This document describes the **community-term → internal-trait** layer under `keyboard_recommender/terminology/`.

## Why keyboard terminology is ambiguous

- **Same word, different rigs**: “thocky” on a plastic tray vs brass plate implies different harmonic stacks; one gloss cannot fit all boards.
- **Metaphor overlap**: “Creamy”, “thocky”, and “marbly” all touch **deep fundamentals** and **smooth attack** but stress different harmonics and texture.
- **Social drift**: Meanings shift in Discord/Reddit threads; written labels lag behind usage.
- **Contradiction as rhetoric**: “Clacky but muted” is common—users mean *relative* damping or context-switching, not a formal contradiction in logic.

Because of this, the system treats language as **soft evidence**: weighted contributions on shared axes, not boolean tags.

## Dictionary structure

Each `CommunityTermDefinition` (`terminology/models.py`) contains:

| Field | Role |
|--------|------|
| `id` | Stable key (e.g. `thocky`). |
| `canonical_label` | Display / logging. |
| `synonyms` | Token surfaces that map to this entry (lowercased for lookup). |
| `trait_contributions` | **Multiple axes per term**, signed relative weights. |
| `intrinsic_confidence` | Lexicographer certainty in \((0, 1]\); scales all contributions for that row. |
| `tags` | Optional buckets (`sound`, `setup`, …) for future NLP routing. |

Validation (`terminology/validation.py`) enforces:

- Every axis id exists in `trait_engine.axes.TRAIT_AXIS_IDS`.
- Synonyms are unique across the lexicon (no accidental collisions).
- Confidence bounds.

## Mapping algorithm (v1)

Implemented in `terminology/engine.py` as `interpret_community_text`:

1. **Normalize** input (trim, lowercase).
2. **Tokenize** with `[a-z0-9]+(?:-[a-z0-9]+)?` (hyphenated compounds like `clack-forward` if added to synonyms).
3. **Exact synonym lookup** against the lexicon index (O(1) per token).
4. **Scale** each term’s axis vector by `intrinsic_confidence` × optional `InterpretOptions.global_confidence_scale`.
5. **Sum** vectors (overlap = additive superposition).
6. **Optional cap** per axis (`per_axis_abs_cap`) to avoid blow-ups when many terms hit.
7. **Conflict detection**: if two *different* terms produce opposing impulses on the same axis above thresholds, emit `TraitConflict` rows (transparent; no silent winner).

## Handling conflicting meanings

We **do not** auto-resolve conflicts to a single winner by default—that hides uncertainty.

**Strategies** (pick in product code):

1. **Transparency**: show conflicts in UI / logs; let the user disambiguate.
2. **Confidence-weighted blend**: keep the summed vector but down-rank recommendations when `conflicts` is non-empty.
3. **Context split**: if you later add plate/switch/skill tags from structured survey, partition NL hits by tag before merging.
4. **NLP reranker**: a second stage proposes which glosses apply *given full sentence embedding*; still emit conflicts when the model’s entropy is high.

`merge_with_survey_traits` blends NL-derived vectors with `survey_answers_to_trait_scores` so structured answers can **anchor** ambiguous prose.

## Future NLP expansion

- **`terminology/nlp_hooks.py`** defines `TerminologyExpander` and `SoftTermHypothesis`: plug in embeddings, CRF, or LLM soft labels.
- Keep **aggregation + caps + conflict reporting** in `engine.py` so the matcher and API stay stable when the retriever changes.
- Add **phrase-level** synonyms (multi-token) by registering spaced strings in `synonyms` once tokenizer passes n-grams (not yet in v1).

## HTTP API

`POST /api/v1/terminology/interpret` with JSON `{ "text": "..." }` returns:

- `traitVector` — same axis keys as the v2 engine.
- `matches` — which lexicon rows fired.
- `conflicts` — opposing impulses across terms (may be empty).
- `unknownTokens` — tokens not in the lexicon (stopwords filtered).
- `warnings` — human-readable caveats.

## Example mappings

See `terminology/dictionary.py` for curated rows (`thocky`, `creamy`, `clacky`, `marbly`, `poppy`, `muted`, `foamy`, …).

## Validation strategy

1. **CI**: `validate_dictionary(COMMUNITY_TERMS)` in unit tests (must return no issues).
2. **Golden phrases**: extend `tests/test_terminology_engine.py` with expected axis ordering or snapshot ranges.
3. **API contract**: `TestClient` asserts stable JSON keys on `/terminology/interpret`.
4. **Manual**: Swagger `/docs` → try contradictory phrases and inspect `conflicts` / `traitVector`.
