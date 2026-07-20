import Link from "next/link";

import { catalogHref } from "@/lib/catalog-links";
import type { CatalogFamily } from "@/lib/api/catalog";

const items: { title: string; description: string; catalogFamily: CatalogFamily; tag: string }[] = [
  {
    title: "스위치",
    description: "매끈한·구분감·저소음 타입 중에서 소리 취향과 사용 목적에 맞는 스위치를 추천해요.",
    catalogFamily: "switch",
    tag: "SWITCH",
  },
  {
    title: "플레이트",
    description: "재질과 단단함에 따라 휘는 느낌, 소리, 타건 피드백이 달라져요.",
    catalogFamily: "plate",
    tag: "PLATE",
  },
  {
    title: "폼",
    description: "케이스·플레이트 폼으로 울림을 줄이거나 살려, 취향에 맞게 세팅할 수 있어요.",
    catalogFamily: "foam",
    tag: "FOAM",
  },
  {
    title: "레이아웃",
    description: "키 배열·크기·밀도에 따라 타이핑 경험과 호환 부품이 달라져요.",
    catalogFamily: "layout",
    tag: "LAYOUT",
  },
  {
    title: "케이스/키트",
    description: "레이아웃·마운팅에 맞는 키트와 베어본을 탐색할 수 있어요.",
    catalogFamily: "case",
    tag: "CASE",
  },
  {
    title: "키캡",
    description: "재질·프로필·각인 방식에 따라 소리·느낌 성향이 달라져요.",
    catalogFamily: "keycap",
    tag: "KEYCAP",
  },
];

export function FeatureGrid() {
  return (
    <section className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="ca-glass-panel flex h-full flex-col border-ca-outline-variant/40 p-5"
        >
          <span className="ca-chip w-fit">{item.tag}</span>
          <h3 className="mt-3 font-headline text-base font-semibold text-ca-on-surface">{item.title}</h3>
          <p className="mt-2 min-h-[3.5rem] break-keep text-sm leading-relaxed text-ca-on-surface-variant">
            {item.description}
          </p>
          <Link
            href={catalogHref({ family: item.catalogFamily })}
            className="mt-auto inline-block pt-4 font-label text-ca-label-sm font-medium text-ca-primary underline-offset-4 hover:underline"
          >
            카탈로그에서 보기 →
          </Link>
        </article>
      ))}
    </section>
  );
}
