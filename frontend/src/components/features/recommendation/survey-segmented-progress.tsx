import { cn } from "@/lib/utils";

type Props = {
  currentStep: number;
  totalSteps: number;
  timeEstimate?: string;
  className?: string;
};

/** Segmented step bar — Stitch Keyboard Curator survey mock. */
export function SurveySegmentedProgress({
  currentStep,
  totalSteps,
  timeEstimate,
  className,
}: Props) {
  const stepLabel = `${currentStep} / ${totalSteps} 단계`;

  return (
    <div className={cn("flex shrink-0 flex-col items-stretch", className)}>
      <div className="mb-2 flex w-full items-baseline justify-between gap-3 px-0.5">
        <span className="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-ca-primary sm:text-xs">
          {stepLabel}
        </span>
        {timeEstimate ? (
          <span className="text-[10px] text-ca-on-surface-variant sm:text-xs">{timeEstimate}</span>
        ) : null}
      </div>
      <div
        className="flex h-1 w-full overflow-hidden rounded-full bg-ca-outline-variant/40"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`설문 ${stepLabel}`}
      >
        {Array.from({ length: totalSteps }, (_, i) => {
          const filled = i < currentStep;
          const active = i === currentStep - 1;
          return (
            <div
              key={i}
              className={cn(
                "h-full flex-1 transition-colors duration-300",
                i > 0 && "border-l border-ca-surface-container-lowest/80",
                filled
                  ? active
                    ? "bg-ca-primary shadow-[0_0_8px_rgb(var(--ca-primary)/0.6)]"
                    : "bg-ca-on-surface-variant/50"
                  : "bg-transparent",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
