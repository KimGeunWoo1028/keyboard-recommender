# DESIGN_SYSTEM.md

> Keyboard Recommender — implementation-aligned design system  
> Parent: [`DESIGN.md`](./DESIGN.md) (launch purple-dark canonical)  
> Status: **canonical for launch (2026-07-22)** — documents what the app ships  
> Code sources: `frontend/src/app/globals.css`, `frontend/src/components/ui/*`

---

## Source of truth

1. CSS variables in `globals.css`
2. Shared components in `components/ui`
3. This file
4. `DESIGN.md`
5. Screen-local exceptions

Do not invent token names here that do not exist in code. Prefer documenting current usage patterns over designing a second parallel scale.

---

## Theme

| Item | Live behavior |
|------|----------------|
| Default theme | `dark` (`ThemeProvider` `defaultTheme="dark"`) |
| Light tokens | Present under `:root` (supported, not the launch default) |
| Dark tokens | `.dark` — production default look |

RGB channels are stored **without** `rgb()` wrappers, e.g. `--ca-primary: 208 188 255` → `rgb(var(--ca-primary))`.

---

## Color tokens (dark / launch default)

Values from `.dark` in `globals.css` (space-separated RGB):

| Token | Value | Typical use |
|-------|-------|-------------|
| `--background` / `--ca-background` | `13 13 21` / `21 18 27` | Page background |
| `--foreground` / `--ca-on-surface` | `231 224 237` | Primary text |
| `--ca-on-surface-variant` / `--muted-foreground` | `203 195 215` | Secondary text |
| `--card` / `--ca-surface-container` | `33 30 39` | Cards / panels |
| `--ca-surface-container-lowest` | `15 13 21` | Elevated low panels |
| `--ca-surface-container-high` | `44 40 50` | Higher surface steps |
| `--primary` / `--ca-primary` | `208 188 255` | Primary fill / accent |
| `--primary-foreground` / `--ca-on-primary` | `60 0 145` | Text on primary |
| `--ca-primary-container` | `160 120 255` | Stronger purple container |
| `--secondary` / `--ca-secondary` | `137 206 255` | Secondary accent (cyan) |
| `--border` / `--ca-outline-variant` | `73 68 84` | Borders / dividers |
| `--ca-error` | `255 180 171` | Error text/surfaces |
| `--ca-viz-emerald` | `16 185 129` | Viz success accent |
| `--ca-viz-gold` | `245 158 11` | Viz warning accent |
| `--focus-ring` | `137 206 255` | Keyboard focus outline (dark) |
| `--focus-ring-offset` | `3px` | Focus offset |

Light (`:root`) keeps a violet primary (`--primary: 124 58 237`, `--focus-ring: 99 14 212`) for theme toggle — not the default launch surface.

Utility classes commonly used: `bg-ca-surface*`, `text-ca-on-surface`, `border-ca-outline-variant`, `bg-primary`, `text-ca-primary`.

---

## Typography

### Fonts (code)

| Role | CSS var | Source (`layout.tsx`) |
|------|---------|------------------------|
| Headline / titles | `--font-headline` | Hanken Grotesk |
| Body | `--font-body` | Inter |
| Mono | `--font-mono` | system UI mono stack |

Classes: `font-headline`, `font-body`.

### Usage patterns (not a rigid type ramp)

| Pattern | Typical classes |
|---------|-----------------|
| Page title | `font-headline text-2xl sm:text-3xl font-semibold tracking-tight` |
| Section / card title | `font-headline text-base font-semibold` |
| Body | `text-sm` / `text-base` + `text-ca-on-surface-variant` for secondary |
| Caption / helper | `text-xs` / `text-sm` muted |

Do not require a separate unused token ladder (`type.display`, etc.) unless implemented in CSS.

---

## Spacing & layout

- Tailwind spacing scale in use (`gap-2`, `p-4`, `space-y-6`, …).
- Page shell: `px-ca-margin-mobile` / `sm:px-ca-margin`, `max-w-ca`.
- Section stacks on results: `space-y-6 sm:space-y-8`.
- Prefer 4px-aligned Tailwind steps; avoid one-off magic margins.

---

## Radius & elevation

| Token / class | Value / note |
|---------------|--------------|
| `--radius` | `1rem` (cards often `rounded-xl`) |
| `--radius-btn` | `0.5rem` |
| Buttons | `rounded-lg` in `button.tsx` |
| `--ca-elevated-shadow` | Soft dark shadow; `--ca-btn-glow` / `--ca-focus-glow` are `none` |

---

## Button hierarchy

Implemented in `components/ui/button.tsx` (`variant`):

| Role | Variant | When |
|------|---------|------|
| **Primary** | `primary` (default) | One main action per moment (e.g. results「이 빌드 저장」, survey start) |
| **Secondary** | `outline` | Parallel but quieter (e.g. Swagkey link, header「로그인」, results tabs selected surface) |
| **Tertiary** | `ghost` / `link` | Low emphasis navigation |
| **Destructive** | Prefer error tokens + confirm patterns; do not reuse primary purple for danger |

Pass 2 policy: avoid two competing filled primaries in the same viewport. Results bottom save uses `outline` after the primary next-actions block.

---

## Focus

| Rule | Implementation |
|------|----------------|
| Token | `--focus-ring`, `--focus-ring-offset` |
| Global | `:focus-visible { outline: 2px solid rgb(var(--focus-ring)); outline-offset: var(--focus-ring-offset); }` |
| Controls | Button / Input / Select also use `focus-visible:ring-2` with `--focus-ring` |
| Mouse | `:focus:not(:focus-visible) { outline: none }` |

Do not remove focus styles for aesthetics.

---

## Results & trust (IA)

### Mobile / desktop information order

1. Recommendation summary (`SharedResultHeader`)
2. Short reasons (`ResultsTrustLayer` / confidence story)
3. **다음에 할 일** (`ResultsNextActions`) — non-sticky
4. Tabs (요약 / 근거)
5. Part cards
6. Purchase trust (`PurchaseTrustBlock`)

### Purchase trust (`PurchaseTrustBlock`)

- **Always visible:** price/stock expectation (`PriceExpectationDisclosure`)
- **Foldable `<details>`:** recommendation limits, retailer scope, link health (`summary`: 추천 기준과 구매 전 확인사항)
- Do not hide the price/stock line inside the fold
- Do not invent new legal claims; reuse existing disclosure components

---

## Responsive

| Breakpoint habit | Use |
|------------------|-----|
| `sm:` (~640px) | Preference lists expand; denser grids |
| `md:` / `lg:` | Header desktop nav; multi-column cards |
| Mobile | Stack CTAs full width; collapse secondary survey preference / explore blocks |

Catalog: keep a **single** search UI on `/catalog` (body search; header search hidden on catalog routes).

---

## Images & diagrams

- Catalog / result thumbnails: `CatalogPartThumbnail` with consistent media framing (`uniformCardMedia` where used).
- Layout diagrams: SVG under `public/layout-diagrams/` — **do not change geometry** unless Owner explicitly requests (project lock).
- Prefer real product imagery over abstract purple gradients as the main visual idea.
- Fallbacks: keep alt text and empty states honest when image URLs fail.

---

## Shared components (map)

| Component | Path |
|-----------|------|
| Button | `components/ui/button.tsx` |
| Input | `components/ui/input.tsx` |
| Select | `components/ui/select.tsx` |
| Card | `components/ui/card.tsx` |
| Badge | `components/ui/badge.tsx` |
| Theme | `components/providers/theme-provider.tsx` |

---

## Desk Craft note

Older revisions of this file described a material “Desk Craft” system (anti-purple defaults, paper craft light). That content is **not** launch canonical. See `DESIGN.md` § Desk Craft and `.design-ref/` for history. Applying Desk Craft requires a separate redesign Phase — do not treat those rules as blocking the live purple-dark UI.

---

## Change history

| Date | Change |
|------|--------|
| 2026-07-22 | L01: rewritten against live tokens/components; purple-dark default documented; Desk Craft demoted; focus, button hierarchy, and results IA from Pass 1–3 recorded. |
| (earlier) | Desk Craft aspirational spec drafted (status noted as not yet applied to pages). |
