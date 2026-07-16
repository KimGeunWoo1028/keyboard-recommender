"use client";

import type { SurveyStepDefinition } from "@/lib/survey-definition";
import type { SurveyAnswers, SurveyStepId } from "@/types/survey";
import { cn } from "@/lib/utils";

import { SurveyOptionIcon } from "@/components/features/recommendation/survey-option-icon";

type Props<T extends SurveyStepId> = {
  step: SurveyStepDefinition<T>;
  value: SurveyAnswers[T] | undefined;
  onChange: (answerId: SurveyAnswers[T]) => void;
  examples?: string[];
  className?: string;
};

function optionLayoutClass(optionCount: number): string {
  if (optionCount === 3) return "flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-3";
  if (optionCount === 4) {
    return "grid min-h-0 flex-1 auto-rows-auto grid-cols-1 gap-2 sm:h-full sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-4 lg:gap-3";
  }
  if (optionCount >= 5) {
    return "grid min-h-0 flex-1 auto-rows-auto grid-cols-1 gap-2 sm:h-full sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-5 lg:gap-3";
  }
  return "grid min-h-0 flex-1 auto-rows-auto grid-cols-1 gap-2 sm:h-full sm:auto-rows-fr";
}

/**
 * Curator option cards — fill available width and height evenly.
 */
export function SurveyQuestion<T extends SurveyStepId>({ step, value, onChange, className }: Props<T>) {
  const flexRow = step.options.length === 3;

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col gap-3", className)}>
      <div className="shrink-0 text-center">
        <h2 className="font-headline text-xl font-bold tracking-tight text-ca-on-surface sm:text-2xl">
          {step.title}
        </h2>
        <p className="mx-auto mt-1 max-w-4xl text-sm leading-snug text-ca-on-surface-variant sm:text-base">
          {step.description}
        </p>
      </div>

      <div
        className={optionLayoutClass(step.options.length)}
        role="radiogroup"
        aria-label={step.title}
      >
        {step.options.map((opt) => {
          const selected = value === opt.id;
          const shortTag = opt.label.match(/\(([^)]+)\)/)?.[1];
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={cn(
                "survey-option-tile group flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-center transition-all sm:gap-3 sm:p-5",
                flexRow && "sm:flex-1",
                !flexRow && "min-h-[9rem] sm:min-h-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-primary",
                selected
                  ? "survey-option-card--selected border-ca-primary bg-ca-primary/5"
                  : "border-ca-outline-variant/50 bg-ca-surface-container hover:border-ca-on-surface-variant/60",
              )}
            >
              <SurveyOptionIcon optionId={opt.id} selected={selected} className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
              <div className="w-full space-y-1.5">
                <span className="block font-headline text-sm font-semibold leading-tight text-ca-on-surface sm:text-base">
                  {opt.label}
                </span>
                <span className="block line-clamp-2 text-xs leading-snug text-ca-on-surface-variant sm:text-sm">
                  {opt.description}
                </span>
              </div>
              {selected && shortTag ? (
                <span className="rounded-full border border-ca-primary/30 bg-ca-primary/15 px-2.5 py-0.5 text-xs font-bold text-ca-primary">
                  {shortTag}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
