"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

import { catalogHref } from "@/lib/catalog-links";
import type { CatalogFamily } from "@/lib/api/catalog";

const items: {
  title: string;
  subtitle: string;
  description: string;
  catalogFamily: CatalogFamily;
  spec: string;
}[] = [
  {
    title: "스위치",
    subtitle: "소리·타건감의 중심",
    description: "리니어, 택타일, 클리키 — 타건의 모든 것이 스위치에서 시작됩니다.",
    catalogFamily: "switch",
    spec: "LINEAR / TACTILE / CLICKY",
  },
  {
    title: "플레이트",
    subtitle: "휘는 느낌과 소리 톤",
    description: "알루미늄, 폴리카보네이트, 황동 — 소재가 타건음의 톤을 결정합니다.",
    catalogFamily: "plate",
    spec: "AL / PC / BRASS",
  },
  {
    title: "폼",
    subtitle: "울림을 줄이거나 살림",
    description: "케이스 폼, PCB 폼 — 공명을 제어해 원하는 소리를 만듭니다.",
    catalogFamily: "foam",
    spec: "CASE / PCB / SWITCH",
  },
  {
    title: "레이아웃",
    subtitle: "키 배열과 호환 범위",
    description: "크기와 형태가 사용감을 바꿉니다.",
    catalogFamily: "layout",
    spec: "60 / 65 / 75 / TKL",
  },
  {
    title: "케이스/키트",
    subtitle: "무게와 소리의 기반",
    description: "알루미늄, 아크릴, 폴리카보네이트 — 케이스가 전체 소리의 기반입니다.",
    catalogFamily: "case",
    spec: "AL / PC / ACRYLIC",
  },
  {
    title: "키캡",
    subtitle: "촉감과 시각적 완성",
    description: "PBT, ABS — 소재와 프로파일이 손끝의 느낌을 바꿉니다.",
    catalogFamily: "keycap",
    spec: "PBT / ABS / SA / OEM",
  },
];

const PREVIEW_COUNT = 3;

export function FeatureGrid() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hiddenCount = items.length - PREVIEW_COUNT;

  return (
    <div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <li key={item.title}>
            <Link
              href={catalogHref({ family: item.catalogFamily })}
              prefetch={false}
              className="card-lift group block h-full border border-border border-l-4 border-l-primary bg-white p-6 dark:bg-ca-surface-container"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ca-on-surface-variant">
                    {item.spec}
                  </p>
                  <h3 className="font-headline text-xl font-black text-ca-on-surface">{item.title}</h3>
                </div>
                <span className="ca-keycap-badge shrink-0 text-[10px]">CAT</span>
              </div>
              <div className="mb-4 h-px bg-border" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{item.subtitle}</p>
              <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">{item.description}</p>
              <div className="mt-5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                카탈로그 보기 <ArrowRight className="h-3 w-3" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {!expanded && hiddenCount > 0 ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mx-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            나머지 부품 {hiddenCount}개 더보기
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
