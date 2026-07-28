"use client";

import { cn } from "@/lib/utils";

export type ResultsCompareScoreBarProps = {
  value: number;
  max?: number;
  className?: string;
};

export function ResultsCompareScoreBar({ value, max = 5, className }: ResultsCompareScoreBarProps) {
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <div className={cn("flex gap-0.5", className)} aria-hidden>
      {Array.from({ length: max }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 w-5 rounded-full",
            index < filled ? "bg-primary" : "bg-[rgb(220_220_238)] dark:bg-border",
          )}
        />
      ))}
    </div>
  );
}
