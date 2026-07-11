# Frontend

Next.js 15 (App Router), TypeScript, Tailwind CSS. UI uses CSS variables for light/dark themes (`next-themes` toggles `class="dark"` on `<html>`).

## Run

```bash
npm install
```

Create `frontend/.env.local` (you can start from `.env.example`). Set `NEXT_PUBLIC_API_URL` to your API origin, then:

```bash
npm run dev
```

Open **either** [http://127.0.0.1:3000](http://127.0.0.1:3000) **or** [http://localhost:3000](http://localhost:3000), but use the **same host** in `NEXT_PUBLIC_API_URL` as in the address bar (see `.env.example`). Mixing `localhost` for the page and `127.0.0.1` for the API breaks session cookies.

## Folder map (component structure)

| Path | Purpose |
|------|---------|
| `src/app/` | Routes and layouts. |
| `src/app/globals.css` | Tailwind + light/dark design tokens. |
| `src/components/ui/` | Primitives: `Button`, `Card`, `Input`, `Label`, `Select`, `Badge`, **`ProgressBar`**. |
| `src/components/layout/` | `SiteHeader`, `ThemeToggle`, `PageShell`. |
| `src/components/providers/` | `ThemeProvider` (`next-themes`). |
| `src/components/features/home/` | Home sections. |
| `src/components/features/recommendation/` | **`SurveyWizard`** (state + steps), **`SurveyQuestion`** (reusable step UI), **`ResultsView`**, **`BuildResult`**. |
| `src/lib/survey-definition.ts` | Step copy + **per-option `traitDelta`** (maps answers → internal traits). |
| `src/lib/survey-logic.ts` | **`computeTraitsFromAnswers`**, completeness check. |
| `src/lib/survey-storage.ts` | `sessionStorage` for **`SurveySubmission`** (v2). |
| `src/lib/recommendation-mock.ts` | **`getMockBuildFromTraits`** — wraps the score-based **`src/recommendation-engine/`** and formats UI text. |
| `src/recommendation-engine/` | **Trait vector + catalog scoring**: traits, models, `user-vector` (survey → vector), `scoring`, `recommend`, `dataset.sample`. |
| `src/lib/trait-display.ts` | Human-readable labels for trait badges on results. |
| `src/types/survey.ts` | **`SurveyAnswers`** (type-safe per-step ids), **`SurveySubmission`**. |
| `src/types/traits.ts` | **`TraitAccumulator`** + merge helpers. |
| `src/types/recommendation.ts` | **`RecommendedBuild`** response shape. |

## Survey flow (mock only)

1. **`/recommend`** — multi-step survey, progress bar, `SurveyQuestion` per step.
2. On **See results**, answers are merged into **`TraitAccumulator`** via deltas in `survey-definition.ts`, then saved to `sessionStorage`.
3. **`/results`** loads **`SurveySubmission`**, runs **`getMockBuildFromTraits`**, renders **`BuildResult`** (answers + trait badges + mock build).

## Pages

- `/` — Home.
- `/recommend` — Preference survey (5 steps).
- `/results` — Mock recommendation from last survey.
