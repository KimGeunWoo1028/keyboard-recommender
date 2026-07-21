"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { catalogHref } from "@/lib/catalog-links";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function HeaderCatalogSearch({ className }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(catalogHref({ q: query }));
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn("relative w-full shrink-0 lg:w-56 xl:w-64", className)}
    >
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ca-on-surface-variant"
        aria-hidden
      >
        <SearchIcon className="h-4 w-4" />
      </span>
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="카탈로그에서 부품 검색…"
        aria-label="카탈로그에서 부품 검색"
        className={cn(
          "w-full rounded-btn border border-ca-outline-variant/40 bg-ca-surface-container-highest/50 py-2 pl-10 pr-4",
          "font-body text-sm text-ca-on-surface placeholder:text-ca-on-surface-variant/70",
          "transition-all focus:border-ca-primary/40 focus:outline-none focus:ring-2 focus:ring-ca-primary/40",
          "lg:w-56 xl:w-64",
        )}
      />
    </form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
