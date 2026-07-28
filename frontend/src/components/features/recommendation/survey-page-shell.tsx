import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SurveyPageHeader({ description }: { description?: string }) {
  return (
    <div className="border-b border-border bg-[#F8F9FA] dark:bg-[rgb(22_22_35)]">
      <div className="mx-auto max-w-ca px-ca-margin-mobile py-10 sm:px-ca-margin sm:py-12">
        <p className="section-label mb-3">Survey</p>
        <h1 className="font-headline text-4xl font-black tracking-tight text-ca-on-surface">
          취향에 맞는 키보드 찾기
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl break-keep text-ca-on-surface-variant">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SurveyPageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-ca flex-col px-ca-margin-mobile py-8 sm:px-ca-margin sm:py-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SurveyWizardShell({
  children,
  className,
  live,
}: {
  children: ReactNode;
  className?: string;
  live?: "polite" | "assertive" | "off";
}) {
  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-1 flex-col", className)}
      data-testid="e2e-survey-wizard"
      aria-live={live}
    >
      {children}
    </div>
  );
}
