import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  className?: string;
  actions?: ReactNode;
};

/** Precision Editorial page title block (Manus demo-final). */
export function ManusPageHeader({ eyebrow, title, description, className, actions }: Props) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        <p className="section-label">{eyebrow}</p>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-ca-on-surface sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <div className="max-w-2xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
