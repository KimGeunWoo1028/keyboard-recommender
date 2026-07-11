from pathlib import Path

ROOT = Path(r"c:\Users\jeung\keyboard-recommender\frontend\src")


def multi_replace(path: Path, pairs: list[tuple[str, str]]) -> None:
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        count = text.count(old)
        if count == 0:
            print(f"WARN missing in {path.name}: {old[:70]!r}")
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    print(f"ok {path.relative_to(ROOT)}")


# ---- catalog browse card + shell classes ----
browse = ROOT / "components/features/catalog/catalog-browse-view.tsx"
multi_replace(
    browse,
    [
        (
            '''className={cn(
        "flex h-full min-h-[11.5rem] cursor-pointer flex-col border-border/80 transition hover:border-primary/40 hover:bg-muted/20",
        selected && "border-primary/50 ring-1 ring-primary/30",
      )}''',
            '''className={cn(
        "ca-glass-panel-interactive flex h-full min-h-[11.5rem] cursor-pointer flex-col border-ca-outline-variant/40 transition hover:border-ca-primary/40",
        selected && "border-ca-primary/50 shadow-ca-glow",
      )}''',
        ),
        (
            'className="line-clamp-2 min-h-[2.75rem] break-keep text-base leading-snug"',
            'className="line-clamp-2 min-h-[2.75rem] break-keep font-headline text-base leading-snug text-ca-on-surface"',
        ),
        (
            'className="line-clamp-2 min-h-[2.5rem] break-keep text-xs leading-relaxed"',
            'className="line-clamp-2 min-h-[2.5rem] break-keep text-xs leading-relaxed text-ca-on-surface-variant"',
        ),
        (
            'className="mt-auto flex flex-wrap items-center gap-2 pt-0 text-xs text-muted-foreground"',
            'className="mt-auto flex flex-wrap items-center gap-2 pt-0 text-xs text-ca-on-surface-variant"',
        ),
        (
            'className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground"',
            'className="ca-chip"',
        ),
        ('className="text-primary"', 'className="font-mono text-ca-label-sm text-ca-primary"'),
        (
            '<PageShell className="space-y-6">',
            '<PageShell className="max-w-ca space-y-6 px-ca-margin-mobile sm:px-ca-margin">',
        ),
        (
            '<h1 className="text-2xl font-semibold tracking-tight">부품 카탈로그</h1>',
            '''<p className="font-mono text-ca-label-sm text-ca-secondary">CATALOG</p>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface">부품 카탈로그</h1>''',
        ),
        (
            'className="text-sm text-muted-foreground"',
            'className="text-sm text-ca-on-surface-variant"',
        ),
        (
            '''variant={family === tab.id ? "primary" : "outline"}
              size="sm"
              onClick={() => {''',
            '''variant={family === tab.id ? "primary" : "outline"}
              size="sm"
              className={
                family === tab.id
                  ? "rounded-full"
                  : "rounded-full border-ca-outline-variant/60 text-ca-on-surface-variant hover:border-ca-primary/40 hover:bg-ca-primary/10"
              }
              onClick={() => {''',
        ),
        (
            'className={cn("h-8")}',
            'className={cn("h-8 rounded-full")}',
        ),
        (
            'className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"',
            'className="flex flex-wrap items-center justify-between gap-3 text-sm text-ca-on-surface-variant"',
        ),
    ],
)

detail = ROOT / "components/features/catalog/catalog-detail-panel.tsx"
multi_replace(
    detail,
    [
        (
            'className="rounded-md border border-border/60 bg-muted/15 px-3 py-2"',
            'className="rounded-md border border-ca-outline-variant/40 bg-ca-surface-container/40 px-3 py-2"',
        ),
        (
            'className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"',
            'className="font-mono text-ca-label-sm text-ca-secondary"',
        ),
        ('className="mt-1 text-foreground"', 'className="mt-1 text-ca-on-surface"'),
        (
            'className="text-sm text-muted-foreground"',
            'className="text-sm text-ca-on-surface-variant"',
        ),
        (
            'className="inline-flex h-9 items-center rounded-md border border-primary/30 bg-primary/5 px-3 text-sm font-medium text-primary underline-offset-4 hover:bg-primary/10 hover:underline"',
            'className="inline-flex h-9 items-center rounded-full border border-ca-primary/40 bg-ca-primary/10 px-3 font-mono text-ca-label-sm font-medium text-ca-primary underline-offset-4 hover:bg-ca-primary/20 hover:underline"',
        ),
        (
            'className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"',
            'className="fixed inset-0 z-50 flex items-end justify-center bg-ca-base/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"',
        ),
        (
            'className={cn("max-h-[90vh] w-full overflow-y-auto border-border/80 sm:max-w-2xl")}',
            'className={cn("ca-glass-elevated max-h-[90vh] w-full overflow-y-auto border-ca-outline-variant/40 sm:max-w-2xl")}',
        ),
        (
            'className="sticky top-0 z-10 border-b border-border/60 bg-card/95 backdrop-blur"',
            'className="sticky top-0 z-10 border-b border-ca-outline-variant/40 bg-ca-surface-container/95 backdrop-blur"',
        ),
        (
            'className="text-lg leading-snug"',
            'className="font-headline text-lg leading-snug text-ca-on-surface"',
        ),
        (
            'className="text-xs text-muted-foreground"',
            'className="font-mono text-ca-label-sm text-ca-on-surface-variant"',
        ),
        (
            'className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"',
            'className="mb-2 font-mono text-ca-label-sm text-ca-secondary"',
        ),
    ],
)

# survey wizard common class restyles
survey = ROOT / "components/features/recommendation/survey-wizard.tsx"
multi_replace(
    survey,
    [
        ('className="max-w-content border-border/80"', 'className="ca-glass-panel max-w-content border-ca-outline-variant/40"'),
        ('className="text-sm font-medium text-foreground"', 'className="text-sm font-medium text-ca-on-surface"'),
        ('className="h-3 w-11/12 animate-pulse rounded-md bg-muted"', 'className="h-3 w-11/12 animate-pulse rounded-md bg-ca-surface-container"'),
        ('className="h-3 w-10/12 animate-pulse rounded-md bg-muted"', 'className="h-3 w-10/12 animate-pulse rounded-md bg-ca-surface-container"'),
        ('className="h-3 w-9/12 animate-pulse rounded-md bg-muted"', 'className="h-3 w-9/12 animate-pulse rounded-md bg-ca-surface-container"'),
        (
            'className="h-24 animate-pulse rounded-xl border border-border/70 bg-muted/30"',
            'className="h-24 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40"',
        ),
        ('className="text-xs text-muted-foreground"', 'className="text-xs text-ca-on-surface-variant"'),
        (
            'className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"',
            'className="space-y-3 rounded-xl border border-ca-primary/30 bg-ca-primary/10 p-4"',
        ),
        ('className="text-sm font-semibold text-foreground"', 'className="font-headline text-sm font-semibold text-ca-on-surface"'),
        (
            'className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"',
            'className="ca-input mt-1"',
        ),
        ('className="text-xs text-muted-foreground"', 'className="ca-label"'),
        (
            'className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"',
            'className="ca-glass-panel-interactive border-ca-outline-variant/40 p-4 text-left"',
        ),
        ('className="mt-2 text-xs leading-relaxed text-muted-foreground"', 'className="mt-2 text-xs leading-relaxed text-ca-on-surface-variant"'),
        ("text-muted-foreground", "text-ca-on-surface-variant"),
        ("text-foreground", "text-ca-on-surface"),
        ("border-border", "border-ca-outline-variant/50"),
        ("bg-muted", "bg-ca-surface-container"),
    ],
)

# auth pages
for rel in [
    "app/auth/auth-page-client.tsx",
    "app/auth/forgot-password/page.tsx",
    "app/auth/reset-password/reset-password-client.tsx",
]:
    path = ROOT / rel
    if not path.exists():
        print(f"skip missing {rel}")
        continue
    multi_replace(
        path,
        [
            ("border-border/80", "border-ca-outline-variant/40"),
            ("border-border", "border-ca-outline-variant/50"),
            ("text-muted-foreground", "text-ca-on-surface-variant"),
            ("text-foreground", "text-ca-on-surface"),
            ("bg-muted", "bg-ca-surface-container"),
            ("bg-card", "bg-ca-surface-container"),
            ('className="rounded-xl border', 'className="ca-glass-panel rounded-xl border'),
        ],
    )

print("done")
