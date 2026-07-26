# UI/UX System Guidelines

> Keyboard Recommender — Pass 6 common UI / copy / state rules  
> Status: **canonical alongside** [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) (2026-07-26)  
> Scope: product-facing consistency after Passes 1–5. Not a redesign brief.

When this file and live code disagree, follow: `globals.css` → `components/ui/*` → this file / `DESIGN_SYSTEM.md` → screen-local exceptions.

---

## 1. Button hierarchy

Implemented in `frontend/src/components/ui/button.tsx`.

| Role | Variant | Use |
|------|---------|-----|
| Primary | `primary` (default) | **One** main action per decision moment |
| Secondary | `outline` (preferred) or `secondary` | Parallel quieter actions, external store links |
| Tertiary | `ghost` / `link` | Navigation, dismiss, low emphasis |
| Destructive | `destructive` | Delete, account deletion — never purple fill |
| Loading | `loading` prop | Spinner overlay; keep idle label width |
| Disabled | `disabled` / busy | Opacity + no pointer; do not fake-disable without reason |

### Rules

- Do not place two competing filled primaries in the same viewport for the same decision.
- Tabs may use `primary` for the **selected** tab surface; that is not a second CTA.
- External retailer links: `outline` (or link style), open in a new tab, disclose “(새 탭)” for SR when needed.
- Destructive always needs confirm (dialog or typed phrase) before irreversible effect.

### State labels (save CTA example)

| State | Label pattern |
|-------|----------------|
| Idle (account) | `이 조합 저장` |
| Idle (guest) | `이 브라우저에 저장` |
| Busy | `저장 중…` / auth `로그인 확인 중…` |
| Success | `마이페이지에 저장됨` / `이 브라우저에 저장됨` |
| Error | Keep prior idle label; show recovery message + retry |

---

## 2. Card roles

Do **not** force one visual recipe on every card.

| Role | Examples | Structure notes |
|------|----------|-----------------|
| Interaction card | Catalog product, survey style | Media → eyebrow → title → tags → footer actions; stable min-height |
| Information panel | Results “다음에 할 일”, trust blocks | Border + surface; no hover-as-button unless clickable |
| Selectable list row | Mypage saved list | Selected border/background; keyboard Enter/Space |
| Empty / dashed | Catalog empty, mypage empty | Dashed border; title + short body + recovery CTA |

Padding / radius: prefer `rounded-xl` panels, `p-4`–`p-6`, `border-ca-outline-variant/40`. Avoid stacking decorative shadows.

---

## 3. Typography

Fonts are fixed (Hanken Grotesk / Inter). Do not introduce new families.

| Level | Typical classes |
|-------|-----------------|
| Page title | `font-headline text-2xl sm:text-3xl font-semibold tracking-tight` |
| Section title | `font-headline text-base font-semibold` |
| Card title | `font-headline text-base font-semibold leading-snug` |
| Body | `text-sm` / `text-base` |
| Secondary | `text-sm text-ca-on-surface-variant` + `break-keep` for Korean |
| Caption / helper | `text-xs` muted — keep readable; avoid ultra-low contrast |

Status / error text: use `role="alert"` or `aria-live` on the message container, not tiny decorative chips alone.

---

## 4. Copy terminology (official)

User-facing glossary. Code identifiers (`build_id`, `SavedRecommendation`) stay as-is.

| Concept | Official term | Avoid in new copy |
|---------|---------------|-------------------|
| Product recommendation unit | **추천 조합** | 추천 빌드 (new UI) |
| Results page / chrome | **추천 결과** | — |
| Account bookmark list / nav | **저장한 빌드** | Keep for hub tab & list title (entrenched) |
| Account save CTA | **이 조합 저장** | 이 빌드 저장 |
| Guest / local save CTA | **이 브라우저에 저장** | 로컬에 저장 |
| Local success | **이 브라우저에 저장됨** | 이 기기에 저장됨 |
| Recent local snapshot | **최근 추천 결과** | 최근 결과 (ambiguous) |
| Survey entry | **추천 설문** / **설문** | 테스트 (unless A/B tooling) |
| Browse SKUs | **카탈로그** / **부품 둘러보기** | 제품 탐색 as primary nav label |
| Preference summary | **취향** / 취향 요약 | Inventing “취향 프로필” as a product feature name |

Legal / privacy pages may keep longer phrasing; align new UI with this table first.

---

## 5. Status message structure

Every non-transient status should aim for:

1. **Title** — what happened  
2. **Short explanation** — why / what to check  
3. **Recovery action** — retry, clear filters, go to survey, sign in  
4. **Semantics** — `role="alert"` for errors; `aria-live="polite"` for progress/success  
5. **No raw engine codes** — map `Failed to fetch`, HTTP status, etc. to Korean product copy

Examples:

```text
저장하지 못했습니다.
네트워크 상태를 확인한 뒤 다시 시도해 주세요.
[다시 시도]
```

```text
검색 결과가 없습니다.
다른 키워드를 시도하거나 검색을 지워 보세요.
[검색 지우기]
```

Loading copy should preview value (“곧 추천 조합이 준비됩니다”) when the wait is user-visible.

---

## 6. Empty states

| Surface | Minimum recovery |
|---------|------------------|
| Mypage saved = 0 | 추천 설문 시작 (+ 최근 추천 결과 if local snapshot exists) |
| Mypage saved search miss | 검색 지우기 |
| Catalog search miss | 검색 지우기 + hint keywords |
| Catalog filter miss | 필터 초기화 |
| Results missing submission | 설문 / 카탈로그 / 저장한 빌드 |
| Image missing | Neutral category + name (no broken-image icon, no fake product photo) |

---

## 7. Date and time

Source of truth: `frontend/src/lib/date-time.ts`.

| Policy | Value |
|--------|--------|
| Display timezone | `Asia/Seoul` (`APP_TIME_ZONE`) |
| API timestamps without offset | Treated as UTC (`…Z`) then shown in Seoul |
| Absolute date | `formatAbsoluteDate` — e.g. `2026년 7월 22일` |
| Absolute date-time | `formatAbsoluteDateTime` |
| Relative | `formatRelativeKo` — `방금 전`, `N분 전`, … |
| SSR / hydration | Prefer absolute strings from shared formatters; avoid bare `toLocaleDateString()` in components |
| Storage | Prefer ISO-8601 with timezone from server; local snapshots may store ISO strings |

Do not add parallel formatters. Relative labels are client-time based; absolute labels must not show a “future” calendar day due to missing `Z`.

---

## 8. Accessibility

| Topic | Rule |
|-------|------|
| Skip link | Present in root layout → `#main-content`; use `--focus-ring` tokens |
| Focus | Visible `:focus-visible` rings on controls; do not remove for aesthetics |
| Headings | One logical `h1` per page; sections descend without skipping for decoration |
| Forms | Visible `Label` + `htmlFor` / `aria-label` on every input |
| Tabs | Selected state via variant + `aria-current` / tab pattern where implemented |
| Dialogs | `role="dialog"`, `aria-modal`, labelled title, Esc/cancel available |
| Live regions | Save/auth progress polite; errors assertive or `role="alert"` |
| Touch | Prefer ≥40px targets on primary mobile controls (pagination, filter sheet) |
| Contrast | Prefer `text-ca-on-surface` / `…-variant` tokens over ad-hoc gray |

Manual Tab order should match visual reading order on auth, survey, results save, mypage delete confirm.

---

## 9. Responsive principles

- Mobile: stack CTAs; collapse secondary filters (catalog sheet) and low-priority header chrome (“더보기”).
- Catalog: **one** search field on `/catalog`.
- Mypage saved: list → detail on small screens; side-by-side on desktop.
- Do not introduce infinite scroll for catalog pagination.

---

## Change history

| Date | Change |
|------|--------|
| 2026-07-26 | Pass 6: initial guidelines — button/destructive, glossary, status/empty, Asia/Seoul time, a11y. |
