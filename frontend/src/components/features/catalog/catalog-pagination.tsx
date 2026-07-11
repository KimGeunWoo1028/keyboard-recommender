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

export function CatalogPagination({ page, totalPages, loading = false, onPageChange }: CatalogPaginationProps) {
  const items = useMemo(() => buildPaginationItems(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center pt-3" aria-label="카탈로그 페이지">
      <div className="inline-flex items-center gap-5">
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="select-none font-body text-sm text-ca-on-surface-variant/50"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(
                "inline-flex min-w-[1.75rem] justify-center font-body text-sm font-medium tabular-nums leading-none transition-colors duration-300 ease-out",
                item === page
                  ? "text-ca-on-surface"
                  : "text-ca-on-surface-variant/45 hover:text-ca-on-surface-variant/80",
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
      </div>
    </nav>
  );
}
