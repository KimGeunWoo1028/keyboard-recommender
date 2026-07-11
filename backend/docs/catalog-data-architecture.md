# Catalog data architecture (traits L/M/H → vectors)

## Goals

- **Authoring consistency**: humans + semi-auto pipelines only ever pick **low | medium | high**.
- **Engine unchanged**: still **dense numeric vectors + weighted cosine** in `trait_engine`.
- **No absolute truth**: scores are **relative** to catalog + reviewer consensus, not acoustic lab data.

## Why relative beats “absolute physics”

Keyboard feel depends on **board, plate, foam, mount, caps, lubing**. A single SKU cannot have one true “thock dB”. Relative modeling stores **“compared to other rows in our catalog, this leans warmer / louder / stiffer”**, which matches how buyers decide and how community language works.

## Why L/M/H helps maintainability

- Reduces **scale drift** (“7 vs 7.3” debates) during early data entry.
- Makes **QA + importer validation** trivial (enum check).
- Still maps to **numeric 0 / 0.5 / 1.0** so the matcher stays smooth; later you can store **finer floats** in `*_trait_scores.score` without changing the matcher — only the ingestion rules.

## Finer numeric expansion (future)

1. Allow `score` column to hold any `[0,1]` float (already `numeric`).
2. Keep optional `authoring_tier` audit column later if you want provenance.
3. Optionally learn a mapping from Korean review text → soft distributions, then **collapse** to floats before write.

## Folder layout (backend)

```text
src/keyboard_recommender/catalog/
  trait_dictionary.py   # 8 traits + L/M/H semantics + per-family allowlists
  normalize.py          # low/medium/high → 0.0/0.5/1.0
  projection.py       # catalog 8-vector → engine TRAIT_AXIS_IDS vector
  validation.py       # tier validation, family allowlist, slug duplicate helper
  import_models.py      # Pydantic import DTOs
data/examples/
  catalog_switch_import.example.json
```

## Database (existing + extension)

- **`recommendation_traits`**: one row per axis key (seed the 8 catalog ids over time; legacy keys can remain until migrated).
- **Component tables**: `switches`, `plates`, `foam_configs`, `keyboard_layouts`, **`keyboard_cases`** — same metadata pattern (`tags`, `sound_profile_metadata`, `popularity_weight`).
- **Junction `*_trait_scores`**: `score` stores **normalized numeric** (from tiers or future floats).
- **Community tags**: `tags text[]` today; optional later: `GIN` index + `community_tag_links` if you need taxonomy.

## Import architecture (recommended phases)

1. **Validate JSON** with `CatalogComponentImport` + `validate_family_traits`.
2. **Normalize** tiers → floats (`sparse_tiers_to_scores`).
3. **Upsert** component by `external_slug` (add column later) or by deterministic UUID5 from slug.
4. **Write** `*_trait_scores` rows joined to `recommendation_traits.id` by `key`.
5. **Optional**: store raw reviewer snippets in `sound_profile_metadata` for NLP v2.

## Engine bridge

`catalog.projection.project_catalog_to_engine_vector` maps the **8-axis catalog vector** into the current engine basis. Tune the blend table as your dataset grows — keep changes **data-driven** (config file) if needed.

## NLP / AI hooks

- Keep **free text** in JSON metadata or a future `component_notes` table.
- Run NLP **offline** to propose tier deltas; human approves → writes L/M/H or floats.
- The matcher still only sees **numbers**, so model churn stays out of the hot path.
