# DESIGN.md

> Keyboard Recommender — design philosophy & system rules  
> Status: **canonical** (replaces Stitch / “Luminous Artisan” / “Cyber-Artisan” visual direction)  
> Scope: product UI principles only. Do not copy Apple, Linear, Stripe, Notion, Arc, or Vercel visuals — borrow *discipline*, not *look*.

---

## Brand Personality

We are a **quiet curator for mechanical keyboards** — not a cyber dashboard, not a luxury slogan machine, not a generic “AI recommender.”

| Trait | Means | Does not mean |
|-------|--------|----------------|
| **Tactile** | Decisions feel concrete: sound, bottom-out, layout, parts you can buy | Skeuomorphic keys everywhere, emoji, playful noise |
| **Exact** | One clear recommendation path; claims match catalog & evidence | Fake “precision” adjectives, glow to signal importance |
| **Calm** | Surfaces stay still so parts and copy can speak | Glassmorphism, neon bloom, pulse as personality |
| **Material** | Color & type evoke resin, aluminum, ink, paper — shop & desk | Purple-lilac SaaS gradients, “cyber” dark by default |
| **Korean-first** | UI language & product voice lead in Korean | English ALL-CAPS eyebrows as decoration (`CATALOG`, `WORKSHOP`) |
| **Honest** | Empty, loading, and gated states tell the truth | Theatrical “analyzing your soul” loading theater |

**Voice:** short, specific, adult. Prefer “묵직한 저음에 맞춘 스위치” over “기계식 마스터리.” Prefer “저장한 빌드” over “WORKSHOP.”

**Personality test:** If the first viewport could belong to any AI SaaS after removing the logo, the brand failed.

---

## Design Philosophy

Reference-grade products share *habits*, not palettes:

- **Apple** — one focal point; hierarchy from type and space, not chrome.
- **Linear** — density without clutter; every control earns its pixels.
- **Stripe** — explain complex systems with plain structure and confidence.
- **Notion** — content is the interface; frames stay quiet.
- **Arc** — opinionated structure; character in small, intentional places.
- **Vercel** — restraint, typography, and motion that never performs.

**Our synthesis — “Desk Craft”:**

1. **The board is the hero, not the UI.** Catalog photos, layout diagrams, and build composition outrank panels, chips, and glow.
2. **One job per surface.** Landing promises one path. Results decide one build. Catalog browses one family. Account manages one identity.
3. **Journey over app chrome.** Recommend → result → save is a story. Primary nav must not pretend every chapter is equally “home.”
4. **Evidence without a cockpit.** Trust comes from readable reasons and real SKUs — not trait dashboards, badge piles, or analytics theater.
5. **Templates are debt.** Dual component systems, decorative English labels, and default Inter/purple stacks are regressions, not “design systems.”

We optimize for **recognition, trust, and next action** — never for “looking advanced.”

---

## Design Principles

1. **Brand before headline**  
   On branded views, the product name is a hero-level signal. Marketing lines never overpower the brand.

2. **One composition in the first viewport**  
   Brand (or clear page purpose), one headline, one supporting sentence, one primary action. No side preview cards, stat strips, or feature grids competing in the fold.

3. **One primary action**  
   Secondary actions are visually quieter and fewer. Three equal CTAs is a failure.

4. **Korean labels for human structure**  
   Section titles describe purpose in the user’s language. No ornamental Latin eyebrows.

5. **Decoration must carry meaning**  
   If removing a border, shadow, blur, gradient, pill, or chip does not hurt understanding or interaction, remove it.

6. **Cards are for interaction, not layout**  
   Default to open surface + spacing. Cards appear when the user selects, compares, or edits a unit of work.

7. **Hierarchy beats accent color**  
   Size, weight, and proximity establish importance. Accent color marks *state* and *action*, not every label.

8. **Density with breath**  
   Tools (catalog, results detail) may be dense; marketing and decision moments stay airy. Never one rhythm for every page.

9. **System over local cleverness**  
   One radius scale, one shadow scale, one type scale, one button family. Exceptions need a product reason.

10. **Accessibility is part of craft**  
    Contrast, focus, reduced motion, and skip paths are design requirements — not polish.

11. **Motion explains change**  
    Animate state transitions (open, submit, tab). Do not animate to look alive.

12. **Never ship the AI-default look**  
    Ban as defaults: purple-lilac identity, cream-serif terracotta clichés, newspaper hairline layouts, omnipresent glass, glow shadows, and `rounded-full` as the universal control shape.

---

## Typography Rules

**Role of type:** Type *is* the brand. Color and effects are secondary.

### Voice & script
- **Primary UI language:** Korean.  
- **English:** only for proper nouns, SKUs, or established product terms — never as section decoration.  
- **No ALL-CAPS English eyebrows** (`RESULTS`, `PRIMARY BUILD`, `AUTH`, etc.).

### Families (principles, not vendor lock-in)
- **Display / brand:** Distinctive, confident, excellent Korean support. Not a default Inter/Roboto/Arial stack used as “personality.”
- **Body:** Highly readable Korean at small sizes; neutral enough for long evidence copy.
- **Mono:** System mono for IDs, codes, debug — never for marketing.

Avoid using a single global “SaaS sans” as both brand and body without a deliberate pairing.

### Scale
- Maintain a **short scale** (roughly 5–7 steps): label · body · title · display.  
- Prefer tokens over one-off `text-[10px]` / `text-[11px]`.  
- Page titles and section titles share one consistent weight strategy (do not mix “semibold catalog” vs “bold results” without reason).

### Hierarchy
- **One H1 per page.**  
- Gradient or clipped-fill text is **not** a hierarchy tool — ban for brand wordmark and primary headlines.  
- Emphasis through weight and size; color emphasis reserved for links, errors, and active states.

### Line length
- Decision and reading copy: roughly **35–65 Korean characters** per line where possible.  
- Do not stretch marketing blurbs full bleed.

### Microcopy
- Specific > poetic.  
- Loading states describe **what the system is doing**, not faux intelligence.  
- Empty states name the **next action**.

---

## Color Philosophy

Color comes from **desk and material**, not from “AI product purple.”

### Intent
- **Light-first product default** for catalog honesty (part color, photography, ink). Dark is a respected option, not the brand’s identity.
- Surfaces read as **paper / aluminum / soft resin** — quiet neutrals with one decisive accent.
- Accent means **go / selected / focus** — never “every eyebrow and chip.”

### Roles
| Role | Job |
|------|-----|
| **Canvas** | Page background; lowest chroma |
| **Surface** | Grouped content; slight lift from canvas without glass blur |
| **Ink** | Primary text; near-black / near-white with strong contrast |
| **Mute** | Secondary text, meta — still WCAG-safe against surface |
| **Line** | Hairlines for structure; low contrast but visible |
| **Accent** | Primary actions, active nav, key selection |
| **Signal** | Success / warning / error — sparse, never decorative |

### Forbidden as brand identity
- Purple-to-lilac or purple-to-cyan gradient identity  
- Ambient purple glow as “elevation”  
- Rainbow viz accents competing with content  
- Using accent color for large display text fills  

### Thematic guidance (direction, not hex lock)
- Prefer **warm or cool neutrals** grounded in real keycap/case materials.  
- Accent may nod to a single craft cue (e.g. deep ink, oxidized metal, switch stem) — **one** accent family, used sparingly.  
- Secondary color, if any, is for charts/status only — not twin branding.

### Contrast
- Body and labels meet strong contrast on both themes.  
- Do not rely on alpha-lavender text on dark purple surfaces.

---

## Spacing System

Space is structure. Guesswork padding is visual noise.

### Rules
1. **One spacing scale** (e.g. 4-based): use named steps only.  
2. **One content max-width** for product pages; marketing may differ — but not a third ad-hoc shell per route.  
3. **Page padding** (gutter) is consistent across breakpoints; do not invent per-feature margins.  
4. **Vertical rhythm:** marketing sections breathe; tool UIs tighten. Same page should not use identical `space-y` everywhere.  
5. **Group by proximity:** related actions share a tight cluster; unrelated blocks separate by a full step jump (not +2px tweaks).  
6. **Chips and meta rows** may not push the primary decision below the fold — trim or collapse before adding padding.

### Layout philosophy
- Prefer **open bands** over nested padded cards.  
- Alignment to an invisible grid beats centering everything in soft rectangles.

---

## Border Radius Rules

Radius signals **family of object**, not fashion.

| Object | Radius intent |
|--------|----------------|
| Page / large panels | Slightly soft or near-square — calm, product-like |
| Inputs / buttons (rect) | Shared medium radius — one value for all rectangular controls |
| Images / thumbnails | Match panel or slightly tighter; stay consistent per media type |
| Avatars / icon wells | Circle only when the object is truly circular |
| Chips | Pill **only** if the chip is a compact filter/tag; not for primary nav or main CTAs |

### Hard rules
- **Do not** use pill (`rounded-full`) as the default for tabs, primary buttons, and search fields.  
- **Do not** mix four unrelated radii on one screen (`sm` + `md` + `xl` + `full`) without role mapping.  
- Logo marks may use a dedicated radius; UI controls do not inherit logo radius.

---

## Shadow Rules

Shadows describe **elevation and modality**, not brand sparkle.

### Allowed
- **Resting:** barely-there soft shadow or none — prefer border + surface shift.  
- **Raised:** short, neutral shadow for popovers, menus, dialogs.  
- **Modal scrim:** dimming overlay, not colored glow.

### Forbidden
- Colored glow shadows (`accent` bloom) as selection or “premium”  
- Stacked glam shadows on static cards  
- Glow as focus ring substitute (focus must be clear outline / ring with contrast)

### Selection & emphasis
- Selected catalog/result items use **border, surface, or type weight** — not luminous aura.  
- At most **one** emphasized elevation per viewport.

---

## Motion Principles

Motion is documentation of change.

### Principles
1. **Earn every animation.** If it does not clarify enter/exit, feedback, or spatial relationship, cut it.  
2. **Short and decisive** (snappy, not floaty). Prefer opacity/transform over blur and shadow pulses.  
3. **Ship a few intentional moments** (e.g. survey step change, result reveal, dialog) — not micro-scales on every avatar.  
4. **Honor `prefers-reduced-motion`.** Replace pulses and decorative loops with instant state.  
5. **No infinite glow/pulse** on selected options as personality.  
6. **Theme changes** may be instant or brief; never a light show.  
7. **Loading:** skeleton or quiet progress; rotating poetic phrases are optional and must stay humble.

### Anti-patterns
- Hover `scale` as default feedback  
- Ambient blob motion in heroes  
- Tab bars that feel like neon switches  

---

## Component Philosophy

Components exist to **encode the principles**, not to showcase a kit.

### Single system
- One button API, one surface language, one chip language.  
- Legacy dual stacks (generic primitives vs themed “glass” skins) must converge; divergence is a bug.

### What components are for
| Component | Purpose |
|-----------|---------|
| **Button** | Commit to an action — clear primary vs quiet secondary |
| **Input** | Enter data — legible, boring, trustworthy |
| **Tabs / segmented** | Switch peer views — rectangular or underline; not candy pills by default |
| **Panel** | Optional grouping for interactive units |
| **Chip** | Filter, tag, or compact status — interactive or informative, never wallpaper |
| **Dialog / sheet** | Focus a task; dismiss clearly |
| **Empty / error** | Explain and recover |

### What components are not for
- Decorating empty hierarchy  
- Wrapping every paragraph in glass  
- Recreating a analytics dashboard for trust  

### Navigation chrome
- Header: brand + few primary destinations + account. Tools (search, theme) compress on small screens.  
- Footer: supporting links and legal quietness — not a second competing mega-nav.  
- “Result” and account areas follow the journey; they do not need equal weight to “start recommend” at all times.

### Results & evidence
- Lead with **the build** and **one reason layer**.  
- Extra evidence, quality notes, and trait detail are progressive — not a default cockpit.  
- Trait visualizations, if used, explain in words first; glyphs/bars second.

### Catalog
- Photography and part identity dominate.  
- Filters are tools; they should not out-shout the grid.  
- Detail panels feel like a shop drawer, not a glass modal festival.

### Auth & account
- Calm, form-first, Korean-clear.  
- Gate when the product must remember someone — not as a branded “AUTH” poster.

### Composition checklist (before shipping a screen)
- [ ] First viewport has one job  
- [ ] Brand/purpose readable without decorative English  
- [ ] One primary action  
- [ ] No glow, glass, or pill used as default chrome  
- [ ] Hierarchy works in grayscale  
- [ ] Reduced-motion path exists for any motion  
- [ ] Components match the single system  

---

## Out of scope (for this document)

- Hex token tables, Tailwind maps, and implementation chores (belong in a later tokens/spec pass).  
- Copying competitor layouts, illustrations, or component skins.  
- Marketing campaigns unrelated to product UI.

---

## Success criteria

The UI feels like a **well-made keyboard desk**: quiet materials, clear choices, trustworthy parts — memorable without shouting.  
A designer familiar with Linear or Stripe should recognize the *discipline*; a user should never think we borrowed their skin.  
A stranger should not classify the product as “another purple AI app.”
