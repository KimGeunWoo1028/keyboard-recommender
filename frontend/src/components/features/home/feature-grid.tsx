import Link from "next/link";

import { catalogHref } from "@/lib/catalog-links";
import type { CatalogFamily } from "@/lib/api/catalog";

const items: { title: string; description: string; catalogFamily: CatalogFamily }[] = [
  {
    title: "스위치",
    description: "매끈한·구분감·저소음 타입 중에서 소리 취향과 사용 목적에 맞는 스위치를 고릅니다.",
    catalogFamily: "switch",
  },
  {
    title: "플레이트",
    description: "재질과 단단함에 따라 휘는 느낌, 소리, 타건 피드백이 달라집니다.",
    catalogFamily: "plate",
  },
  {
    title: "폼",
    description: "케이스·플레이트 폼으로 울림을 줄이거나 살려, 취향에 맞게 세팅합니다.",
    catalogFamily: "foam",
  },
  {
    title: "레이아웃",
    description: "키 배열·크기·밀도에 따라 타이핑 경험과 호환 부품이 달라집니다.",
    catalogFamily: "layout",
  },
  {
    title: "케이스/키트",
    description: "레이아웃·마운팅에 맞는 키트와 베어본을 탐색합니다.",
    catalogFamily: "case",
  },
  {
    title: "키캡",
    description: "재질·프로필·각인 방식에 따라 소리·느낌 성향이 달라집니다.",
    catalogFamily: "keycap",
  },
];

export function FeatureGrid() {
  return (
    <ul className="divide-y divide-ca-outline-variant/35 border-y border-ca-outline-variant/35">
      {items.map((item) => (
        <li key={item.title}>
          <Link
            href={catalogHref({ family: item.catalogFamily })}
            prefetch={false}
            className="group flex flex-col gap-1 py-5 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:py-6"
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
  );
}
