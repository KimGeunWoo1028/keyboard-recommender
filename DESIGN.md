# DESIGN.md

> Keyboard Recommender — product visual direction  
> Status: **canonical for launch (2026-07-22)** — live purple-dark UI  
> Scope: product principles for the shipped app. Implementation tokens live in `frontend/src/app/globals.css` and shared UI under `frontend/src/components/ui/`.

---

## Source of truth

When documents and implementation disagree, follow this order:

1. **Live shared tokens** — `frontend/src/app/globals.css` (`:root` / `.dark`)
2. **Shared UI components** — `frontend/src/components/ui/*` (Button, Input, Card, Select, …)
3. **`DESIGN_SYSTEM.md`** — component & token reference aligned to (1)–(2)
4. **`DESIGN.md`** (this file) — product visual principles
5. **Screen-local exceptions** — only with an explicit product reason

Process: change tokens/components first (or in the same PR as docs). Do not invent undocumented tokens in Markdown and then force a restyle.

---

## Current official direction (launch)

**Canonical look:** purple-accent **dark** SaaS UI as shipped on production (`defaultTheme="dark"`).

| Trait | Means | Does not mean |
|-------|--------|----------------|
| **Trustworthy tool** | Clear recommendation path, readable reasons, honest disclaimers | Neon cyberpunk cockpit, “analyzing your soul” theater |
| **Readable first** | Parts, layout diagrams, and survey→result copy outrank decoration | Glow, glass stacks, or badges as personality |
| **Restrained purple** | Primary CTA, selected state, brand accent | Every surface, every button, ambient purple fog |
| **Korean-first** | UI voice and structure in Korean | Decorative English ALL-CAPS eyebrows |
| **Honest** | Empty / loading / gated states tell the truth | Fake precision percentages as quality guarantees |

**Voice:** short, specific, adult. Prefer “묵직한 저음에 맞춘 스위치” over slogan fluff.

**Personality test:** After removing the logo, the first viewport should still feel like a keyboard recommendation tool — not a generic AI dashboard *and* not a material mock-shop that the live app does not ship.

---

## Design goals

1. **Understand the recommendation** — title, short reasons, then action.
2. **Explore real SKUs** — catalog and product imagery stay central.
3. **Clear CTA priority** — one primary action per decision moment.
4. **Transparent trust copy** — price/stock always visible; long disclaimers foldable.
5. **Mobile readability** — information order over chrome density.
6. **Keyboard accessibility** — visible `:focus-visible` rings on interactive controls.

---

## Visual character (as implemented)

Drawn from the live dark theme tokens and components — not aspirational mockups:

- Dark neutral surfaces (`--ca-surface*`, `--background`)
- Soft purple / lilac primary accent (`--ca-primary`, `--primary`)
- Rounded cards and controls (`--radius` ≈ 1rem cards; `--radius-btn` / `rounded-lg` buttons)
- Restrained elevation (`--ca-elevated-shadow`); no required neon glow
- Structured grids for catalog and six-axis builds
- Product photos + layout diagrams as the main visual anchors

Avoid declaring “neon everything” or “no purple” as official rules — both conflict with the live product.

---

## Avoid / discourage

- Filling every button with the same primary purple (Pass 2 hierarchy: primary / outline / ghost)
- Heavy neon glow or glassmorphism as default elevation
- Cards used only for decoration (prefer open surface + spacing unless the card is a unit of interaction)
- Low-contrast body text on dark surfaces
- Removing focus indicators
- Per-page arbitrary palettes
- Putting purchase/save CTAs **before** recommendation summary and short reasons on results
- Restyling the whole product to Desk Craft without a separate Owner redesign Phase

---

## Results information order (mobile)

Canonical results flow (see Pass 3 / L07):

```text
추천 요약
→ 핵심 추천 이유 (짧게)
→ 다음에 할 일 (CTA)
→ 탭 / 세부 근거
→ 부품·제품 상세
→ 가격·재고 핵심 고지 (+ 접을 수 있는 상세 면책)
```

Do not pin a sticky CTA over content by default. Primary save stays primary; secondary store link and post-detail save stay quieter.

---

## Desk Craft (historical / future option)

**Desk Craft** (material desk, anti-purple SaaS, light paper craft) was an earlier exploration and may inform a future rebrand.

```text
Desk Craft is NOT the launch canonical design.
Do not restyle live pages to Desk Craft without a separate Owner decision and redesign Phase.
Records remain under .design-ref/ and older doc revisions for history.
```

---

## Design principles (still in force)

1. **One primary action** per decision moment; secondary quieter.
2. **Korean labels** for human structure — no ornamental Latin eyebrows.
3. **Decoration must carry meaning** — if removing chrome does not hurt understanding, remove it.
4. **Hierarchy beats accent overload** — size/weight/proximity first; purple marks state and action.
5. **Accessibility is craft** — contrast, focus-visible, reduced motion, skip links.
6. **Motion explains change** — open/submit/tab; do not animate to look alive.
7. **System over local cleverness** — prefer shared tokens and `components/ui`.

---

## Change history

| Date | Change |
|------|--------|
| 2026-07-22 | Launch readiness L01: live purple-dark UI confirmed as canonical; Desk Craft reclassified as prior exploration / future option; docs aligned to implementation without a full UI redesign. |
| (earlier) | Desk Craft synthesis drafted as a proposed direction (not applied to production pages). |
