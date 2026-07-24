"use client";

import { useState } from "react";
import Link from "next/link";

import { catalogHref } from "@/lib/catalog-links";
import type { CatalogFamily } from "@/lib/api/catalog";

const items: { title: string; description: string; catalogFamily: CatalogFamily }[] = [
  {
    title: "스위치",
    description: "소리·타건감의 중심",
    catalogFamily: "switch",
  },
  {
    title: "플레이트",
    description: "휘는 느낌과 소리 톤",
    catalogFamily: "plate",
  },
  {
    title: "폼",
    description: "울림을 줄이거나 살림",
    catalogFamily: "foam",
  },
  {
    title: "레이아웃",
    description: "키 배열과 호환 범위",
    catalogFamily: "layout",
  },
  {
    title: "케이스/키트",
    description: "키트·베어본 탐색",
    catalogFamily: "case",
  },
  {
    title: "키캡",
    description: "재질·프로필·각인",
    catalogFamily: "keycap",
  },
];

const PREVIEW_COUNT = 3;

export function FeatureGrid() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hiddenCount = items.length - PREVIEW_COUNT;

  return (
    <div>
      <ul className="divide-y divide-ca-outline-variant/35 border-y border-ca-outline-variant/35">
        {visible.map((item) => (
          <li key={item.title}>
            <Link
              href={catalogHref({ family: item.catalogFamily })}
              prefetch={false}
              className="group flex flex-col gap-0.5 py-3.5 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:py-4"
            >
              <span className="font-headline text-base font-semibold text-ca-on-surface group-hover:text-ca-primary">
                {item.title}
              </span>
              <span className="min-w-0 flex-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:max-w-xl">
                {item.description}
              </span>
              <span className="shrink-0 text-sm font-medium text-ca-on-surface-variant underline-offset-4 group-hover:text-ca-primary group-hover:underline sm:pt-0.5">
                카탈로그
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm font-medium text-ca-on-surface-variant underline-offset-2 hover:text-ca-on-surface hover:underline"
        >
          나머지 부품 {hiddenCount}개 더보기
        </button>
      ) : null}
    </div>
  );
}
