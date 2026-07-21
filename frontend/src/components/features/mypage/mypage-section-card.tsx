import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export function MyPageSectionCard({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
}: Props) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest",
        className,
      )}
    >
      <header className={cn("border-b border-ca-outline-variant/30 px-5 py-4 sm:px-6", headerClassName)}>
        <h2 className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface">{title}</h2>
        {description ? (
          <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">{description}</p>
        ) : null}
      </header>
      <div className={cn("space-y-4 p-5 sm:p-6", contentClassName)}>{children}</div>
    </section>
  );
}
