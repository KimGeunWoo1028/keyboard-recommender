# DESIGN_SYSTEM.md

> Keyboard Recommender — implementation-aligned design system  
> Parent: [`DESIGN.md`](./DESIGN.md) (Precision Editorial)  
> Status: **canonical (2026-07-27)** — documents what the app ships  
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
| Default theme | `light` (`ThemeProvider` `defaultTheme="light"`) |
| Light tokens | `:root` — Precision Editorial (launch default) |
| Dark tokens | `.dark` — deep indigo surfaces + amber accent |

RGB channels are stored **without** `rgb()` wrappers, e.g. `--ca-primary: 55 48 163` → `rgb(var(--ca-primary))`.

---

## Color tokens (light / default)

Values from `:root` in `globals.css` (space-separated RGB):

| Token | Value | Typical use |
|-------|-------|-------------|
| `--background` / `--ca-background` | `248 248 252` | Page background |
| `--foreground` / `--ca-on-surface` | `15 15 25` | Primary text |
| `--ca-on-surface-variant` / `--muted-foreground` | `75 75 100` / `80 80 100` | Secondary text |
| `--card` / `--ca-surface-container` | `255 255 255` / `235 235 250` | Cards / panels |
| `--primary` / `--ca-primary` | `55 48 163` | Primary fill / accent (indigo) |
| `--primary-foreground` / `--ca-on-primary` | `255 255 255` | Text on primary |
| `--ca-primary-container` | `79 70 229` | Stronger indigo container |
| `--secondary` / `--ca-secondary` | `245 158 11` | Amber accent |
| `--border` / `--ca-outline-variant` | `220 220 235` / `200 200 225` | Borders / dividers |
| `--ca-error` | `220 38 38` | Error text/surfaces |
| `--ca-viz-emerald` | `16 185 129` | Viz success accent |
| `--ca-viz-gold` | `245 158 11` | Viz / amber accent |
| `--focus-ring` | `55 48 163` | Keyboard focus outline (light) |
| `--focus-ring-offset` | `3px` | Focus offset |

Dark (`.dark`) uses deep navy surfaces (`13 13 28`) with softer indigo primary (`165 180 252`) and amber secondary — see `globals.css`.

Utility classes commonly used: `bg-ca-surface*`, `text-ca-on-surface`, `border-ca-outline-variant`, `bg-primary`, `text-ca-primary`, `ca-keycap-badge`, `ca-fade-in-up`.

---

## Typography

### Fonts (code)

| Role | CSS var | Source (`layout.tsx`) |
|------|---------|------------------------|
| Headline / titles | `--font-headline` | Hanken Grotesk |
| Body | `--font-body` | Inter |
| Korean body | `--font-korean` | Noto Sans KR |
| Mono | `--font-mono` | system UI mono stack |

Classes: `font-headline`, `font-body`. Body stack falls back through `--font-korean`.

### Usage patterns (not a rigid type ramp)

| Pattern | Typical classes |
|---------|-----------------|
| Page title | `font-headline text-4xl sm:text-5xl font-extrabold tracking-tight` |
| Section / card title | `font-headline text-base font-semibold` |
| Body | `text-sm` / `text-base` + `text-ca-on-surface-variant` for secondary |
| Caption / helper | `text-xs` / `text-sm` muted; keycap badges via `ca-keycap-badge` |

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
| `--radius` | `0.75rem` (cards often `rounded-xl`) |
| `--radius-btn` | `0.5rem` |
| Buttons | `rounded-lg` in `button.tsx` |
| `--ca-elevated-shadow` | Soft editorial shadow; `--ca-btn-glow` on primary hover |

---

## Button hierarchy

Implemented in `components/ui/button.tsx` (`variant`) — **token-based** (`bg-primary`, not hardcoded RGB):

| Role | Variant | When |
|------|---------|------|
| **Primary** | `primary` (default) | One main action per moment |
| **Secondary** | `outline` | Parallel but quieter |
| **Tertiary** | `ghost` / `link` | Low emphasis navigation |
| **Destructive** | `destructive` | Delete / account deletion — confirm required; never primary fill |

Pass policy: avoid two competing filled primaries in the same viewport. Full glossary + status rules: [`docs/ui-ux-system-guidelines.md`](./docs/ui-ux-system-guidelines.md).

---

## Focus

| Rule | Implementation |
|------|----------------|
| Token | `--focus-ring`, `--focus-ring-offset` |
| Global | `:focus-visible { outline: 2px solid rgb(var(--focus-ring)); outline-offset: var(--focus-ring-offset); }` |
| Controls | Button / Input / Select also use `focus-visible:ring-2` with `--focus-ring` |
| Skip link | Root layout → `#main-content`; ring uses `--focus-ring` |
| Mouse | `:focus:not(:focus-visible) { outline: none }` |

Do not remove focus styles for aesthetics.

---

## Date & time

Display helpers live in `frontend/src/lib/date-time.ts` (`Asia/Seoul`). See Pass 6 guidelines §7. Do not call bare `toLocaleDateString()` / `toLocaleString()` in UI.

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
- Prefer real product imagery over abstract gradients as the main visual idea.
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

## Change history

| Date | Change |
|------|--------|
| 2026-07-27 | Precision Editorial (Manus): light default, indigo+amber tokens, Noto Sans KR, dark tokens repaired, button stays token-based. |
| 2026-07-26 | Pass 6: `destructive` button variant; save glossary; date/time + guidelines pointer. |
| 2026-07-22 | L01: rewritten against prior purple-dark live tokens (now superseded). |
