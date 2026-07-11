import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max?: number;
  className?: string;
  label?: string;
};

/** Linear progress for multi-step flows (0–100 by default). */
export function ProgressBar({ value, max = 100, className, label = "Progress" }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
