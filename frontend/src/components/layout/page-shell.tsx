import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Centered column with responsive horizontal padding. */
export function PageShell({ children, className }: Props) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10", className)}>{children}</div>
  );
}
