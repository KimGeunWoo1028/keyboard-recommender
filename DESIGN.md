# DESIGN.md

> Keyboard Recommender — product visual direction  
> Status: **canonical (2026-07-28)** — Precision Editorial (Manus demo-final)  
> Scope: product principles for the shipped app. Implementation tokens live in `frontend/src/app/globals.css` and shared UI under `frontend/src/components/ui/`.

---

## Source of truth

1. **Live shared tokens** — `frontend/src/app/globals.css` (`:root` / `.dark`)
2. **Shared UI components** — `frontend/src/components/ui/*`
3. **`DESIGN_SYSTEM.md`**
4. **`DESIGN.md`** (this file)
5. Screen-local exceptions

---

## Current official direction

**Canonical look:** Precision Editorial — **light-first** deep indigo (`#3730A3` / `55 48 163`) UI from Manus demo-final. Dark remains a supported toggle.

| Trait | Means |
|-------|--------|
| Trustworthy tool | Clear recommendation path, honest empty/loading states |
| Readable first | Parts and reasons outrank decoration |
| Restrained indigo | Primary CTA / selected / brand accent |
| Korean-first | Noto Sans KR + Hanken Grotesk / Inter |
| Honest | Example previews labeled 예시; no fake match % |

**Routes and APIs are unchanged** — redesign is visual only.

---

## Design goals

1. Understand the recommendation — title, short reasons, then action.
2. Explore real SKUs — catalog imagery stays central.
3. Clear CTA priority — one primary action per decision moment.
4. Mobile readability — information order over chrome density.
5. Keyboard accessibility — visible `:focus-visible` rings.

---

## Avoid

- Hardcoding RGB in components when tokens exist (`bg-primary`)
- Manus mock data / fake confidence % in production results
- Placeholder `#` links for legal pages
- Removing loading / error / empty / auth guards
- Changing API, storage keys, survey IDs, or routes

---

## Change history

| Date | Change |
|------|--------|
| 2026-07-28 | Manus demo-final Precision Editorial applied on `feature/manus-redesign` (UI only). |
| 2026-07-26 | Pass 6 guidelines pointer. |
| 2026-07-22 | Prior purple-dark launch canonical (superseded). |
