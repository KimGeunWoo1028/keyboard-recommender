import { cn } from "@/lib/utils";

type Props = {
  currentStep: number;
  totalSteps: number;
  timeEstimate?: string;
  className?: string;
};

/** Quiet segmented progress — fill without glow. */
export function SurveySegmentedProgress({
  currentStep,
  totalSteps,
  timeEstimate,
  className,
}: Props) {
  const stepLabel = `${currentStep} / ${totalSteps} 단계`;

  return (
    <div className={cn("flex shrink-0 flex-col items-stretch", className)}>
      <div className="mb-2 flex w-full items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ca-on-surface">{stepLabel}</span>
        {timeEstimate ? <span className="text-sm text-ca-on-surface-variant">{timeEstimate}</span> : null}
      </div>
      <div
        className="flex h-1 w-full overflow-hidden rounded bg-ca-outline-variant/35"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`설문 ${stepLabel}`}
      >
        {Array.from({ length: totalSteps }, (_, i) => {
          const filled = i < currentStep;
          return (
            <div
              key={i}
              className={cn(
                "h-full flex-1 transition-colors duration-200 motion-reduce:transition-none",
                i > 0 && "border-l border-ca-surface/80",
                filled ? "bg-ca-on-surface" : "bg-transparent",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
