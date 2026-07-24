import type { ReactNode } from "react";

import { HOME_RESULT_PREVIEW_EXAMPLE } from "@/components/features/home/home-result-preview-example";
import { cn } from "@/lib/utils";

export function HomeWorkshopPreviewShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Light guest panel — result-shaped experience preview (Home IA). No fake scores. */
export function HomeWorkshopGuestPreview() {
  const example = HOME_RESULT_PREVIEW_EXAMPLE;

  return (
    <HomeWorkshopPreviewShell>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-ca-outline-variant/50 px-1.5 py-0.5 text-xs font-medium text-ca-on-surface-variant">
          {example.badge}
        </span>
        <p
          data-testid="home-result-preview"
          className="text-xs font-medium tracking-wide text-ca-on-surface-variant sm:text-sm"
        >
          설문 후 받게 되는 결과 형태
        </p>
      </div>

      <p className="mt-3 font-headline text-base font-semibold text-ca-on-surface sm:text-lg">
        {example.title}
      </p>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="취향 태그 예시">
        {example.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-ca-outline-variant/40 px-2 py-0.5 text-xs text-ca-on-surface-variant sm:text-sm"
          >
            {tag}
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid gap-2 border-t border-ca-outline-variant/35 pt-4 text-sm sm:grid-cols-3">
        {example.parts.map((part) => (
          <div key={part.family} className="min-w-0">
            <dt className="text-xs text-ca-on-surface-variant">{part.family}</dt>
            <dd className="mt-0.5 font-medium text-ca-on-surface">{part.name}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
        {example.reason}
      </p>
      <p className="mt-2 break-keep text-xs leading-relaxed text-ca-on-surface-variant sm:text-sm">
        실제 제품명은 설문 후 맞춰집니다. 점수는 표시하지 않습니다.
      </p>
    </HomeWorkshopPreviewShell>
  );
}
