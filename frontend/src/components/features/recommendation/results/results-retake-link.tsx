"use client";

import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Soft secondary exit below the overview save CTA (not header/tab chrome). */
export function ResultsRetakeLink({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-end", className)}>
      <Link
        href="/recommend"
        className={cn(
          buttonClassName({ variant: "outline", size: "default" }),
          "min-h-10 w-full justify-center border-border bg-[#F8F9FA] font-medium text-ca-on-surface-variant",
          "hover:bg-muted hover:text-ca-on-surface dark:bg-[rgb(22_22_35)] sm:w-auto",
        )}
        data-testid="e2e-results-retake-link"
      >
        설문 다시 하기
      </Link>
    </div>
  );
}
