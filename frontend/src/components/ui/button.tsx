import { forwardRef, type ButtonHTMLAttributes } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-[0.97] transition-all duration-150",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  outline: "border border-border bg-transparent shadow-xs hover:bg-muted text-foreground",
  ghost: "hover:bg-muted text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  /** Danger actions — never reuse primary fill. */
  destructive:
    "border border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10 active:bg-destructive/15",
} as const;

const sizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md gap-1.5 px-3",
  lg: "h-10 rounded-md px-6",
  icon: "size-9",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

const baseClass =
  "relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

/** Use on `<Link>` when you need a styled anchor that looks like a button. */
export function buttonClassName(options?: { variant?: Variant; size?: Size; className?: string }) {
  const variant = options?.variant ?? "primary";
  const size = options?.size ?? "default";
  return cn(baseClass, variants[variant], sizes[size], options?.className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /**
   * Locks the button and shows a centered overlay spinner.
   * Label width stays stable — keep idle label text (avoid swapping to longer “확인 중…” in tight rows).
   */
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "default", type = "button", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "invisible")}>{children}</span>
      {loading ? (
        <span className="pointer-events-none absolute inset-0 inline-flex items-center justify-center" aria-hidden="true">
          <Spinner className="text-[1rem]" />
        </span>
      ) : null}
    </button>
  );
});
