import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Tailwind max-width utility, default max-w-3xl */
  maxWidthClassName?: string;
};

/**
 * Soft lavender page frame for support/legal/share/secondary auth —
 * matches Manus Precision Editorial mypage/results ground.
 */
export function ManusSecondaryShell({
  children,
  className,
  maxWidthClassName = "max-w-3xl",
}: Props) {
  return (
    <div className="bg-[rgb(248_248_252)] dark:bg-ca-surface-container-low">
      <PageShell
        className={cn(
          maxWidthClassName,
          "space-y-8 px-ca-margin-mobile pb-16 pt-8 sm:px-ca-margin sm:pb-20",
          className,
        )}
      >
        {children}
      </PageShell>
    </div>
  );
}
