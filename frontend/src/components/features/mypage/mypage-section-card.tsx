import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export function MyPageSectionCard({
  title,
  description,
  eyebrow,
  children,
  className,
  headerClassName,
  contentClassName,
}: Props) {
  return (
    <section className={cn("ca-glass-panel border-ca-outline-variant/40", className)}>
      <header className={cn("border-b border-ca-outline-variant/30 px-5 py-4", headerClassName)}>
        {eyebrow ? <p className="font-label text-ca-label-sm font-medium text-ca-secondary">{eyebrow}</p> : null}
        <h2 className="font-headline text-base font-semibold text-ca-on-surface">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ca-on-surface-variant">{description}</p> : null}
      </header>
      <div className={cn("space-y-4 p-5", contentClassName)}>{children}</div>
    </section>
  );
}
