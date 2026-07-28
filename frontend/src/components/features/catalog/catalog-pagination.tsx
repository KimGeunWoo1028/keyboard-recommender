"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export function buildPaginationItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 0) return [];
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const value = sorted[index]!;
    if (index > 0 && value - sorted[index - 1]! > 1) {
      items.push("ellipsis");
    }
    items.push(value);
  }

  return items;
}

const pageBtnClass =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 font-body text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]";

export function CatalogPagination({ page, totalPages, loading = false, onPageChange }: CatalogPaginationProps) {
  const items = useMemo(() => buildPaginationItems(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-col items-center gap-3 pt-4" aria-label="카탈로그 페이지">
      <p className="font-body text-sm text-ca-on-surface-variant">
        <span className="font-medium text-ca-on-surface">{page}</span>
        <span aria-hidden> / </span>
        <span className="sr-only">전체 </span>
        {totalPages} 페이지
      </p>
      <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className={cn(
            pageBtnClass,
            "border border-ca-outline-variant/50 text-ca-on-surface-variant hover:bg-ca-surface-container/60",
            (loading || page <= 1) && "pointer-events-none opacity-40",
          )}
          disabled={loading || page <= 1}
          aria-label="이전 페이지"
          onClick={() => {
            if (page <= 1 || loading) return;
            onPageChange(page - 1);
          }}
        >
          이전
        </button>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-10 min-w-8 select-none items-center justify-center font-body text-sm text-ca-on-surface-variant/50"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(
                pageBtnClass,
                item === page
                  ? "bg-ca-primary/15 font-semibold text-ca-primary"
                  : "text-ca-on-surface-variant hover:bg-ca-surface-container/60 hover:text-ca-on-surface",
                loading && "pointer-events-none opacity-60",
              )}
              disabled={loading}
              aria-label={`${item}페이지`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => {
                if (item === page || loading) return;
                onPageChange(item);
              }}
            >
              {String(item).padStart(2, "0")}
            </button>
          ),
        )}
        <button
          type="button"
          className={cn(
            pageBtnClass,
            "border border-ca-outline-variant/50 text-ca-on-surface-variant hover:bg-ca-surface-container/60",
            (loading || page >= totalPages) && "pointer-events-none opacity-40",
          )}
          disabled={loading || page >= totalPages}
          aria-label="다음 페이지"
          onClick={() => {
            if (page >= totalPages || loading) return;
            onPageChange(page + 1);
          }}
        >
          다음
        </button>
      </div>
    </nav>
  );
}
