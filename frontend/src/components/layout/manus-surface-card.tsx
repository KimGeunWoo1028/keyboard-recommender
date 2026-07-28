import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "md" | "lg";
};

const paddingClass = {
  none: "",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

/** White / surface card used across Manus auth, legal, and support pages. */
export function ManusSurfaceCard({ children, className, padding = "lg" }: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border-2 border-[rgb(220_220_238)] bg-white shadow-sm dark:border-border dark:bg-ca-surface-container dark:shadow-none",
        paddingClass[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
