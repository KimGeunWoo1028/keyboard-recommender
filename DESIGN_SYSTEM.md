# DESIGN_SYSTEM.md

> Keyboard Recommender — component & token rules  
> Parent: [`DESIGN.md`](./DESIGN.md) (**Desk Craft**)  
> Status: **canonical spec** (not yet applied to pages)  
> Scope: design rules only. No page or code changes in this document’s adoption step.

This system replaces glass / glow / pill-default / English-eyebrow chrome with a single quiet toolkit.

---

## Typography

### Roles

| Role | Token | Use |
|------|-------|-----|
| **Brand** | `type.brand` | Product name in header / hero brand signal |
| **Display** | `type.display` | Rare marketing moments only (≤1 per landing) |
| **Title** | `type.title` | Page H1 |
| **Heading** | `type.heading` | Section H2 / card titles |
| **Body** | `type.body` | Default reading & UI copy |
| **Label** | `type.label` | Form labels, nav items, table headers |
| **Meta** | `type.meta` | Timestamps, SKU hints, helper text |
| **Mono** | `type.mono` | IDs, codes, debug — never marketing |

### Scale (rem @ 16px root)

| Token | Size | Line height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| `display` | 2.25rem (36) → 3rem (48) at `lg` | 1.15 | 600–700 | -0.02em |
| `title` | 1.5rem (24) → 1.875rem (30) | 1.25 | 600 | -0.015em |
| `heading` | 1.125rem (18) → 1.25rem (20) | 1.35 | 600 | -0.01em |
| `body` | 0.9375rem (15) → 1rem (16) | 1.55 | 400 | 0 |
| `label` | 0.875rem (14) | 1.4 | 500 | 0 |
| `meta` | 0.8125rem (13) | 1.4 | 400 | 0 |
| `brand` | 1.125rem (18) → 1.375rem (22) | 1.2 | 600 | -0.02em |

Do not invent sizes below `meta` (no 10–11px UI type).

### Families

- **Brand / display / title / heading:** one distinctive family with strong Korean support (not Inter-as-brand).
- **Body / label / meta:** one highly readable Korean-capable sans, paired deliberately with the display family.
- **Mono:** system UI mono stack.

### Rules

1. **One H1 (`title`) per page.**
2. **No gradient or clipped-fill text** on brand, titles, or headings.
3. **No English ALL-CAPS eyebrows.** Section structure uses Korean `heading` or `label`.
4. **Color is not hierarchy.** Ink for primary text; mute for meta; accent only for links / active / errors as specified.
5. **Line length:** body decision copy ≈ 35–65 Korean characters.
6. **Break keep** for Korean phrases where the layout allows (`break-keep` intent).

### Microcopy

- Loading: factual (“추천 결과를 불러오는 중”).
- Empty: name the next action (“설문을 완료하면 결과가 여기에 표시됩니다”).
- Errors: cause + recovery, not blame.

---

## Spacing Scale

Base unit: **4px**. Use only these steps.

| Token | px | rem | Typical use |
|-------|----|-----|-------------|
| `space.0` | 0 | 0 | Reset |
| `space.1` | 4 | 0.25 | Icon gaps, tight inline |
| `space.2` | 8 | 0.5 | Chip padding-y, compact stacks |
| `space.3` | 12 | 0.75 | Label → control |
| `space.4` | 16 | 1 | Control padding, list gaps |
| `space.5` | 20 | 1.25 | Dense card padding |
| `space.6` | 24 | 1.5 | Default section inner gap |
| `space.8` | 32 | 2 | Between related blocks |
| `space.10` | 40 | 2.5 | Page section gaps (tools) |
| `space.12` | 48 | 3 | Page section gaps (marketing) |
| `space.16` | 64 | 4 | Major band separation |
| `space.20` | 80 | 5 | Rare hero breathing only |

### Rules

1. No one-off spacing (`gap-[18px]`, `p-[22px]`).
2. Related actions cluster at `space.2`–`space.3`; unrelated blocks jump at least two steps.
3. Marketing vertical rhythm uses `space.12`–`space.16`; tool UIs use `space.6`–`space.10`.
4. Nested padding: outer ≥ inner; avoid card-in-card padding inflation.

---

## Grid System

### Breakpoints

| Name | Min width | Intent |
|------|-----------|--------|
| `sm` | 640px | Larger phones / small tablets |
| `md` | 768px | Tablet / compact desktop |
| `lg` | 1024px | Desktop with full nav |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Max comfort; content does not keep stretching forever |

### Content widths

| Shell | Max width | Use |
|-------|-----------|-----|
| `shell.product` | 90rem (1440px) | Catalog, results, mypage, recommend |
| `shell.reading` | 42rem (672px) | Long evidence / policy-like reading |
| `shell.form` | 28rem (448px) | Auth and focused forms |

One product shell across product routes — no third ad-hoc max-width per page.

### Columns

| Context | Columns | Gutter |
|---------|---------|--------|
| Marketing / home bands | 12 | `space.6` (`md+`) |
| Catalog grid | 1 → 2 (`sm`) → 3 (`lg`) | `space.4`–`space.6` |
| Results primary | 12; build may span 8 + side 4 at `lg` | `space.6` |
| Mypage tools | 1 → 2 at `lg` when master/detail | `space.6` |

### Page gutters (horizontal padding)

| Breakpoint | Gutter |
|------------|--------|
| default | `space.4` (16px) |
| `sm` | `space.6` (24px) |
| `md+` | `space.10` (40px) |

### Rules

1. Align to the grid; do not center arbitrary soft rectangles as “layout.”
2. First viewport: **one composition** — no competing side preview column in the fold on marketing home.
3. Catalog images use a consistent aspect (prefer **4:3** part thumbnails) inside the grid cell.

---

## Buttons

### Variants

| Variant | When | Visual intent |
|---------|------|----------------|
| **Primary** | The one commit action on a view | Solid accent fill, ink-on-accent |
| **Secondary** | Alternative commit | Accent outline or soft surface + accent text |
| **Ghost** | Tertiary / cancel / low emphasis | Transparent; ink text; quiet hover surface |
| **Danger** | Destructive confirm | Signal-error fill or outline — never accent purple-as-danger |
| **Link-button** | Inline navigation that is not a form submit | Type-style; underline on hover |

### Sizes

| Size | Height | Padding-x | Type |
|------|--------|-----------|------|
| `sm` | 32px | `space.3` | `label` |
| `md` | 40px | `space.4` | `label` |
| `lg` | 48px | `space.6` | `label`–`body` |

Default: `md`.

### Shape

- Radius: **`radius.control`** (shared with inputs) — rectangular, not pill.
- Pill buttons are **forbidden** as the default primary/secondary/ghost.
- Icon + label: icon `space.2` from label; icon size 16–20px.

### Rules

1. **≤1 Primary** in a viewport decision cluster.
2. Full-width primary allowed on `sm` forms; `md+` prefers intrinsic width.
3. Disabled: reduced opacity + `not-allowed`; never rely on color alone — also `aria-disabled` / disabled attribute.
4. Loading: replace label with spinner + accessible name; keep width stable when possible.
5. Do not mix a second “skin” button system (legacy rounded-full / glow CTAs).

---

## Inputs

### Types covered

Text, email, password, search, textarea, checkbox, radio, switch (boolean).

### Anatomy

- Label above (`type.label`, ink)
- Control
- Helper / error below (`type.meta`)

### Control metrics

| Property | Value |
|----------|-------|
| Height (single-line) | 40px (`md`) |
| Padding-x | `space.4` |
| Radius | `radius.control` |
| Border | 1px `color.line` |
| Background | `color.surface` (or canvas on dense tools) |
| Text | `type.body`, `color.ink` |
| Placeholder | `color.mute` |

### States

| State | Rule |
|-------|------|
| Rest | Line border, no shadow |
| Hover | Slightly stronger line (still neutral) |
| Focus | Focus ring — see Focus States; no glow bloom |
| Error | Signal-error border + error text below |
| Disabled | Mute fill / mute text; no pointer |

### Rules

1. Labels are visible — placeholder is not a label.
2. Search fields use the **same radius as inputs**, not pills.
3. Password: show/hide is a quiet ghost control inside the field.
4. Checkbox / radio: 16–18px target; label clickable; focus on the control.
5. Textarea: min-height ≥ 3 lines; vertical resize optional; radius same as inputs.
6. Group related fields with `space.6`; label→input `space.2`–`space.3`.

---

## Dropdown

Covers select triggers, menus, and combobox lists.

### Trigger

- Looks like an input (height 40px, `radius.control`, line border).
- Chevron is meta-colored; rotates or swaps icon on open (optional, short motion).

### Menu panel

| Property | Rule |
|----------|------|
| Surface | `color.surface` |
| Border | 1px `color.line` |
| Shadow | `shadow.raised` only |
| Radius | `radius.panel` |
| Max height | ~280–320px then scroll |
| Item height | 36–40px |
| Item padding-x | `space.4` |

### Behavior

1. Open below by default; flip up if clipped.
2. Keyboard: arrows, Enter/Space select, Esc closes, typeahead when applicable.
3. Selected item: weight or quiet accent mark — **not** glow.
4. Destructive items: signal-error text, separated by a hairline if needed.
5. Do not use translucent glass menus.

### Nested menus

Avoid when possible. If required, one level only; keep panel styling identical.

---

## Cards

Cards are **interactive units**, not default layout chrome.

### When to use

- Selectable catalog part
- Recommended build as a choosable/savable unit
- Account security block that is a discrete task

### When not to use

- Wrapping every page section
- Marketing feature walls of six equal glass tiles in the first viewport
- Evidence paragraphs that only need typography

### Anatomy

| Part | Rule |
|------|------|
| Container | `color.surface`, 1px `color.line`, `radius.panel` |
| Padding | `space.5`–`space.6` |
| Shadow at rest | **none** or `shadow.rest` (barely) |
| Media | Top-aligned; fixed aspect; no gradient overlays |
| Title | `type.heading` |
| Body | `type.body` or `type.meta` |
| Actions | Button row at bottom; primary quiet |

### Selection

- Selected: **stronger border** (`color.accent` or ink) + optional surface tint ≤ 8% — **no colored glow**.
- At most one “emphasized” card elevation per viewport.

### Rules

1. No glass blur fills (`backdrop-filter` panels as default card skin).
2. Equal-height grids: content tops align; actions pin to bottom with flex — without fake min-heights that create huge empty voids.
3. Nested cards: prefer flatten; if needed, inner uses line only, no second shadow.

---

## Tables

For dense data (saved builds lists, debug/ops, account logs). Product-facing preference remains cards/lists when scanning parts.

### Structure

| Element | Rule |
|---------|------|
| Header | `type.label`, mute or ink; bottom hairline |
| Row | `type.body`; row height ≥ 44px touch-friendly on mobile alternatives |
| Cell padding | `space.3`–`space.4` |
| Zebra | Optional very subtle surface shift — not required |
| Borders | Horizontal hairlines; avoid heavy grid cages |
| Alignment | Text left; numbers right; actions right |

### Behavior

1. Column headers stay short Korean labels.
2. Sortable columns: clear affordance; sorted state via icon + `aria-sort`.
3. Row hover: quiet surface tint; row click only if the whole row is the target.
4. Empty table: one row message + next action, not a decorative illustration wall.
5. On `sm`, prefer stacked definition list / card rows over horizontal scroll when possible; if scroll, keep sticky first column only when essential.

### Forbidden

- Glow on “top pick” rows
- Rainbow status pills in every cell

---

## Badges

Badges = compact **status or category** — not section titles.

### Variants

| Variant | Use |
|---------|-----|
| **Neutral** | Default meta tag |
| **Accent** | Active filter / in-progress (sparse) |
| **Success / Warning / Error** | True system status only |
| **Outline** | Quiet category |

### Metrics

| Property | Value |
|----------|-------|
| Height | 22–24px |
| Padding-x | `space.2` |
| Type | `type.meta` weight 500 |
| Radius | `radius.chip` (may be near-pill **only** for badges/chips) |
| Max per cluster | Prefer ≤5 visible; overflow “+N” or collapse |

### Rules

1. Badges do not replace headings.
2. Do not ALL-CAPS English badge wallpaper (`SWITCH`, `PRIMARY BUILD`).
3. Interactive chips (filters) share badge metrics but must have button/checkbox semantics and focus states.
4. Quality / confidence callouts prefer a short text banner over a jewelry badge row.

---

## Navigation

### Site header

| Zone | Content | Priority |
|------|---------|----------|
| Brand | Mark + Korean-capable product name (`type.brand`), solid ink — no gradient text | Always |
| Primary nav | Few destinations; Korean labels; underline or weight for active | `lg+` inline |
| Utilities | Search, theme, account | Collapse into menu on small screens |

**Rules**

1. Journey-aware IA: do not give equal always-on weight to every chapter if it creates empty/gated traps (see `DESIGN.md`).
2. Active state: type weight + underline or quiet surface — not neon pill tabs.
3. Sticky header: solid/canvas translucent **without** heavy blur theater; keep border-bottom hairline.
4. Provide **Skip to content**.
5. Mobile menu: full-width sheet or stacked list; same active rules; theme inside menu OK.

### In-page tabs / section switchers

- Shape: **rectangular** or **underline tabs**, height 40px, `radius.control` on enclosed segments.
- Not `rounded-full` candy pills as the default language.
- One selected tab; peer views only (not a second IA).

### Footer

- Quiet meta + sparse links.
- Not a duplicate mega-nav of the header.
- Copyright and product name in Korean-first voice; no hollow English taglines (“Precision Crafted”).

### Breadcrumbs (if used)

- `type.meta`; separators muted; current page ink without link.

---

## Dialogs

### Types

| Type | Use |
|------|-----|
| **Modal dialog** | Auth-critical, destructive confirm, blocking forms |
| **Non-modal panel / drawer** | Catalog detail, compare, secondary inspect |
| **Popover** | Short menus anchored to a control |

### Modal metrics

| Property | Rule |
|----------|------|
| Width | `shell.form`–480px typical; rare large ≤720px |
| Radius | `radius.panel` |
| Surface | Opaque `color.surface` |
| Shadow | `shadow.raised` |
| Scrim | Neutral dim 40–60% — **not** colored glow |
| Padding | `space.6` |

### Behavior

1. Focus trap while open; return focus on close.
2. Esc and scrim click dismiss when safe; destructive flows may require explicit cancel.
3. Title = `type.heading` Korean; body = `type.body`.
4. Actions: primary right (or full-width stacked on mobile); ghost/cancel opposite.
5. Drawers: edge-aligned; same surface language as dialogs; no glass.

### Forbidden

- Glass modal festival
- Autofocus into destructive primary without warning text

---

## Animation

### Timing tokens

| Token | Duration | Easing | Use |
|-------|----------|--------|-----|
| `motion.instant` | 0ms | — | Reduced motion / theme snap |
| `motion.fast` | 120–160ms | standard ease-out | Hover fades, button feedback |
| `motion.base` | 180–240ms | ease-out | Panels, tabs, step change |
| `motion.slow` | 280–320ms | ease-in-out | Rare page-level reveal |

### Allowed moments

1. Survey step enter/exit (opacity + small Y)
2. Dialog / drawer open-close
3. Tab content swap
4. Toast / inline status appear
5. Progress value change (width)

### Forbidden

1. Infinite glow/pulse on selection
2. Ambient hero blob motion
3. Default hover `scale` on avatars/cards
4. Blur-heavy transitions
5. Decorative loading phrase carousels as brand personality

### Reduced motion

When `prefers-reduced-motion: reduce`:

- Durations → `motion.instant`
- No transform travel; opacity optional or instant
- Spinners may remain if essential, or replace with static “로딩 중”

### Budget

Ship **2–3 intentional** motion moments product-wide for presence — not dozens of micro-interactions.

---

## Hover States

### Principles

- Hover **hints** affordance; it does not sell importance.
- Prefer **surface tint**, **line strength**, or **underline** over scale/glow.
- No hover-only information (touch devices must access the same actions).

### By control

| Control | Hover |
|---------|-------|
| Primary button | Slightly darker/deeper accent fill |
| Secondary / ghost | Quiet surface tint (`≤6%` ink) |
| Links | Underline + ink (or accent) |
| Nav item | Ink color; underline preview optional |
| Card (interactive) | Stronger line; optional surface tint |
| Table row | Surface tint |
| Icon button | Surface tint in `radius.control` hit area |

### Rules

1. Hover contrast must still pass text contrast if text color changes.
2. Disabled controls have no hover affordance.
3. Do not combine hover scale + shadow lift + glow.

---

## Focus States

### Principles

- Focus is **mandatory craft**, visible on keyboard navigation.
- Focus ≠ hover; focus is stronger and clearer.
- Never replace focus with colored glow shadows.

### Token intent

| Property | Rule |
|----------|------|
| Width | 2px solid |
| Offset | 2px |
| Color | Accent or ink — **WCAG visible** against adjacent surfaces |
| Shape | Follows control radius |

### Rules

1. `:focus-visible` preferred (avoid mouse click rings when platform allows).
2. All interactive components: buttons, links, inputs, tabs, menu items, card-as-button, dialog close.
3. Skip link: first focusable; visible on focus.
4. Modal open: focus moves to initial control or dialog container per pattern.
5. Do not set `outline: none` without an equivalent ring.

---

## Responsive Rules

### Layout

1. **Mobile first:** single column; stack primary action full-width when it helps tap success.
2. **`md`:** side-by-side only when both columns have a job (not decorative preview).
3. **`lg`:** expose primary nav; denser catalog grids.
4. Do not hide critical actions solely behind hover icons on touch breakpoints.

### Navigation

- `< lg`: hamburger or overflow menu for primary nav + utilities.
- Search may move into the menu or a dedicated expandable field.

### Type & space

- Step up `title` / `display` at `lg`, not continuously.
- Gutters follow the Grid System table.
- Touch targets ≥ **44×44px** where primary actions live.

### Media

- Images fluid within grid; no CLS — reserve aspect ratio.
- Layout diagrams: readable without forcing desktop-only geometry changes (diagram geometry lock remains a product constraint).

### Results / catalog density

- On small screens: progressive disclosure (summary first, evidence collapsed).
- Avoid horizontal pill tab overflow theater; prefer wrap, select, or fewer tabs.

---

## Accessibility Rules

### Baseline

1. **WCAG 2.2 AA** contrast for body, labels, and interactive text on both light and dark themes.
2. `lang="ko"` on document; page titles unique and Korean-first.
3. Semantic HTML: one `h1`, landmark `header` / `main` / `footer` / `nav`.
4. **Skip to content** on all product pages.
5. Keyboard: all actions reachable; no keyboard traps outside modals; modals trap correctly.

### Name, role, value

- Icon-only buttons have accessible names (Korean).
- Tabs: `role="tablist"` pattern or native semantics with `aria-selected`.
- Expandables: `aria-expanded`.
- Live regions (`aria-live="polite"`) for submit/loading results — not for decorative chatter.

### Motion & vestibular

- Honor `prefers-reduced-motion` (see Animation).
- No infinite pulsing selection styles.

### Forms

- Errors linked via `aria-describedby` / announced on submit.
- Required fields indicated in text, not color alone.

### Images

- Informative images: meaningful `alt`.
- Decorative: empty `alt` + `aria-hidden` when appropriate.
- Brand mark: if adjacent text presents the name, decorative mark is OK.

### Theming

- Light default; dark optional.
- Focus and borders remain visible in both themes.
- Do not convey state by color alone — pair with text/icon/weight.

### Testing expectations (design acceptance)

- Grayscale hierarchy still readable.
- Keyboard-only walkthrough of recommend → results → save.
- Screen reader: page purpose and primary CTA announced without English eyebrow noise.

---

## Shared foundation tokens (reference)

These names bind the sections above. Hex values are chosen in a later tokens pass; **roles are fixed now**.

### Radius

| Token | Intent | Approx |
|-------|--------|--------|
| `radius.control` | Buttons, inputs, tab segments | 8px |
| `radius.panel` | Cards, menus, dialogs | 12px |
| `radius.chip` | Badges / filter chips only | 9999px allowed |
| `radius.media` | Thumbnails | 8–12px consistent |
| `radius.avatar` | Circular avatars only | 9999px |

### Shadow

| Token | Use |
|-------|-----|
| `shadow.none` | Default resting UI |
| `shadow.rest` | Optional whisper on resting panels |
| `shadow.raised` | Menus, dialogs, popovers |

No `shadow.glow`.

### Color roles

`canvas` · `surface` · `ink` · `mute` · `line` · `accent` · `accent-ink` · `signal-success` · `signal-warning` · `signal-error`

Accent is **one** family, material-inspired — not purple-lilac identity.

---

## Component checklist (spec compliance)

Before a component is considered “on system”:

- [ ] Uses spacing / type / radius tokens only  
- [ ] Rectangular controls by default (pill only for chips/avatars)  
- [ ] No glass fill, gradient text, or glow shadow  
- [ ] Hover quiet; focus visible  
- [ ] Korean labels; no decorative English eyebrows  
- [ ] Reduced-motion safe  
- [ ] Single component API (no dual skins)  

---

## Document relationship

| Doc | Role |
|-----|------|
| `DESIGN.md` | Why — philosophy & brand |
| `DESIGN_SYSTEM.md` | What — rules for type, space, components, states |
| Future tokens / implementation | How — CSS variables, component code |

Pages remain unchanged until an explicit implementation step is requested.
