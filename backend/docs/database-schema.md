# Database schema (PostgreSQL)

## Overview

The catalog is normalized for **trait axes** (`recommendation_traits`) and **per-component scores** in junction tables. Each component family shares the same column pattern: metadata columns + `trait_scores` rows pointing at trait ids.

## Entity relationship (conceptual)

```text
recommendation_traits (1) ──< (N) switch_trait_scores >── (N) switches
                         ──< (N) plate_trait_scores   >── (N) plates
                         ──< (N) foam_config_trait_scores >── (N) foam_configs
                         ──< (N) keyboard_layout_trait_scores >── (N) keyboard_layouts
                         ──< (N) keyboard_case_trait_scores >── (N) keyboard_cases
```

- **Component → scores**: one switch (etc.) has many `SwitchTraitScore` rows (one per trait dimension).
- **Trait → scores**: one `RecommendationTrait` aggregates all junction rows that reference it (for admin / analytics).

## Tables

### `recommendation_traits`

| Column        | Type         | Notes                          |
|---------------|--------------|--------------------------------|
| `id`          | serial PK    |                                |
| `key`         | varchar(64)  | Stable id, e.g. `deep_sound`   |
| `name`        | varchar(255) | Display name                   |
| `description` | text       | Optional                       |

Seeds should align with the frontend recommendation engine trait keys.

### `switches`, `plates`, `foam_configs`, `keyboard_layouts`, `keyboard_cases`

| Column                    | Type            | Notes                                        |
|---------------------------|-----------------|----------------------------------------------|
| `id`                      | uuid PK         | Default `uuid4` in the app                   |
| `name`                    | varchar(255)    |                                              |
| `description`             | text            | Optional                                     |
| `tags`                    | `varchar[]`     | Search / filtering (e.g. `linear`, `silent`) |
| `sound_profile_metadata`  | `jsonb`         | Structured sound hints (e.g. `{"character": "thocky"}`) |
| `popularity_weight`       | numeric(8,4)    | Scoring bias (default 1.0)                   |
| `created_at`, `updated_at`| timestamptz     | Audit                                        |

### Junction tables

- `switch_trait_scores` — (`switch_id`, `trait_id`) PK, `score` numeric(8,4)
- `plate_trait_scores`
- `foam_config_trait_scores`
- `keyboard_layout_trait_scores`
- `keyboard_case_trait_scores`

Foreign keys: `ondelete=CASCADE` from junction to both parent and trait (deleting a switch removes its scores; deleting a trait removes all score rows for that trait).

## Migrations

From `backend/` with `DATABASE_URL` set (or `.env`):

```bash
pip install -r requirements.txt
alembic upgrade head
```

Create new revisions after model changes:

```bash
alembic revision -m "describe change"
# or
alembic revision --autogenerate -m "describe change"
```

## Extensibility

- **New trait axis**: insert into `recommendation_traits`, add scores in junction tables; migrate app + frontend engine keys together.
- **New component type**: new table + `*_trait_scores` mirroring the pattern above.
- **Richer sound metadata**: evolve `sound_profile_metadata` JSON schema without altering trait tables.
