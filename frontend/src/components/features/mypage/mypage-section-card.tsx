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
        "overflow-hidden rounded-sm border-2 border-[rgb(220_220_238)] bg-white shadow-sm dark:border-border dark:bg-ca-surface-container dark:shadow-none",
        className,
      )}
    >
      <header
        className={cn(
          "border-b border-[rgb(220_220_238)] bg-[rgb(248_248_252)] px-5 py-3 dark:border-border dark:bg-ca-surface-container-low sm:px-6",
          headerClassName,
        )}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-[rgb(100_100_120)] dark:text-ca-on-surface-variant">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">{description}</p>
        ) : null}
      </header>
      <div className={cn("space-y-4 p-5 sm:p-6", contentClassName)}>{children}</div>
    </section>
  );
}
