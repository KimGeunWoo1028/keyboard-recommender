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
  if (optionCount === 3) return "flex flex-col gap-2 sm:flex-row sm:gap-3";
  if (optionCount === 4) {
    return "grid auto-rows-auto grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3";
  }
  if (optionCount >= 5) {
    return "grid auto-rows-auto grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3";
  }
  return "grid auto-rows-auto grid-cols-1 gap-2";
}

/** Survey option tiles — quiet selection (border/surface), no glow pulse. */
export function SurveyQuestion<T extends SurveyStepId>({ step, value, onChange, className }: Props<T>) {
  const flexRow = step.options.length === 3;

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="shrink-0 sm:max-w-2xl">
        <h2 className="whitespace-pre-line break-keep font-headline text-xl font-semibold tracking-tight text-ca-on-surface sm:text-2xl">
          {step.title}
        </h2>
        <p className="mt-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          {step.description}
        </p>
        <p className="mt-1.5 break-keep text-xs leading-relaxed text-ca-on-surface-variant/90 sm:text-sm">
          확신이 없어도 괜찮아요. 가장 가까운 쪽을 고르면 됩니다.
        </p>
      </div>

      <div className={optionLayoutClass(step.options.length)} role="radiogroup" aria-label={step.title}>
        {step.options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={cn(
                "group flex w-full min-w-0 flex-col items-start justify-start gap-2 rounded-xl border p-4 text-left transition-colors sm:p-4",
                flexRow && "sm:flex-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-primary",
                selected
                  ? "border-ca-on-surface bg-ca-surface-container-lowest"
                  : "border-ca-outline-variant/40 bg-ca-surface-container-lowest/60 hover:border-ca-on-surface/30",
              )}
            >
              <SurveyOptionIcon
                optionId={opt.id}
                selected={selected}
                className="h-6 w-6 shrink-0 sm:h-7 sm:w-7"
              />
              <div className="w-full space-y-1">
                <span className="block break-keep font-headline text-sm font-semibold leading-tight text-ca-on-surface sm:text-base">
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "block break-keep text-xs leading-snug text-ca-on-surface-variant sm:text-sm",
                    selected ? "line-clamp-4 sm:line-clamp-none" : "line-clamp-1 sm:line-clamp-3",
                  )}
                >
                  {opt.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
