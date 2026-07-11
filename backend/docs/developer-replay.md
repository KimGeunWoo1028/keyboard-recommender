# Developer replay and debugging

Lightweight CLI tools live under `scripts/`; shared logic is in `src/keyboard_recommender/debug_tools/` (not imported by the FastAPI app).

## Prerequisites

From `backend/`:

```bash
pip install -e ".[dev]"
```

## Replay bundle (`debug.replay_bundle.v1`)

`run_replay_bundle` (and `scripts/replay_recommendation.py`) produces:

| Field | Purpose |
|--------|--------|
| `inputs` | Survey + optional NLP text |
| `apiPayload` | API-shaped body (`completedAtIso` stripped by default) |
| `snapshot` | `evaluation.snapshot.v1` (ranked lists, audits, confidence) |
| `metrics` | Derived evaluation metrics |
| `diagnostics` | Narrative + penalty/rerank traces |
| `pipelineTrace` | Staged explanation (NL → cosine → compatibility → diversity → fallback → final) |

## Scripts

### `replay_recommendation.py`

```bash
python scripts/replay_recommendation.py fixtures/replay/example_survey.json
python scripts/replay_recommendation.py scenario.json -n "thocky linear" --out /tmp/replay.json --pretty
```

### `trace_pipeline.py`

Human-readable flat trace (default) or `--json` for structured `debug.pipeline_trace.v1`.

```bash
python scripts/trace_pipeline.py fixtures/replay/example_survey.json
python scripts/trace_pipeline.py scenario.json --json --pretty
```

### `inspect_snapshot.py`

Metrics + diagnostics + reranking/fallback summaries for a **snapshot** or **replay bundle**.

```bash
python scripts/inspect_snapshot.py replay.json
python scripts/inspect_snapshot.py replay.json --json
```

### `compare_recommendations.py`

Compare two frozen JSON files (snapshots or bundles) using `synthetic_metrics_from_snapshots` / benchmark narrative.

```bash
python scripts/compare_recommendations.py -b run_a.json -t run_b.json --pretty
```

## Survey JSON shape

Preferred:

```json
{
  "answers": { "sound_profile": "muted", "typing_pressure": "light" },
  "naturalLanguage": "optional free text"
}
```

Flat map of string fields is also accepted (same keys as API `answers`).

## Tests

`tests/test_debug_tools_replay.py` covers deterministic replay, trace shape, snapshot extraction, and identical-snapshot comparison.
