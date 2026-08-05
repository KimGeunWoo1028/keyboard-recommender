import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EvidencePickSectionVariant = "default" | "muted" | "warning";

const SHELL: Record<EvidencePickSectionVariant, string> = {
  default: "border-border bg-white dark:bg-ca-surface-container",
  muted: "border-border bg-white dark:bg-ca-surface-container",
  warning: "border-warning/30 bg-warning-container/40 dark:bg-warning-container/50",
};

const LABEL: Record<EvidencePickSectionVariant, string> = {
  default: "text-ca-on-surface-variant",
  muted: "text-ca-on-surface-variant",
  warning: "text-warning-on-container dark:text-warning-on-container",
};

/** Matches `formatEvidenceDetailLines` max of 3 × text-sm leading-relaxed lines. */
export const EVIDENCE_PICK_SPEC_BODY_MIN_H = "min-h-[4.75rem]";

type ResultsEvidencePickSectionProps = {
  label: string;
  variant?: EvidencePickSectionVariant;
  testId?: string;
  className?: string;
  bodyClassName?: string;
  fillHeight?: boolean;
  children: ReactNode;
};

export function ResultsEvidencePickSection({
  label,
  variant = "default",
  testId,
  className,
  bodyClassName,
  fillHeight = false,
  children,
}: ResultsEvidencePickSectionProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        fillHeight && "flex h-full flex-col",
        SHELL[variant],
        className,
      )}
      data-testid={testId}
    >
      <p className={cn("text-sm font-medium", LABEL[variant])}>{label}</p>
      <div className={cn("mt-2", fillHeight && "flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}
