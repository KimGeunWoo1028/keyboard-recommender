import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  maxWidthClassName?: string;
};

/**
 * Full-bleed muted band with bottom border (Manus Results / MyPage / Recommend headers).
 * Place outside PageShell padding when possible; otherwise use inside with negative margins carefully.
 */
export function ManusBand({
  children,
  className,
  innerClassName,
  maxWidthClassName = "mx-auto w-full max-w-4xl",
}: Props) {
  return (
    <div className={cn("border-b border-border bg-ca-surface-container-low", className)}>
      <div className={cn(maxWidthClassName, "px-4 py-8 sm:px-6 sm:py-10", innerClassName)}>{children}</div>
    </div>
  );
}
