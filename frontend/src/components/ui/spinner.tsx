import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  /**
   * When set, announces a polite status (standalone loaders).
   * Omit inside buttons that already expose `aria-busy` + visible text.
   */
  label?: string;
};

/** Compact CSS spinner for button/inline pending states. */
export function Spinner({ className, label }: SpinnerProps) {
  const icon = (
    <svg
      className={cn("h-[1em] w-[1em] animate-spin", !label && className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V1C5.373 1 0 6.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (!label) {
    return icon;
  }

  return (
    <span className={cn("inline-flex items-center justify-center", className)} role="status">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
