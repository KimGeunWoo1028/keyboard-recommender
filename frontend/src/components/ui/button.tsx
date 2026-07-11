import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:opacity-100",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  outline: "border border-border bg-transparent hover:bg-muted",
  ghost: "hover:bg-muted",
  link: "text-primary underline-offset-4 hover:underline",
} as const;

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-lg px-8",
  icon: "h-10 w-10",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

/** Use on `<Link>` when you need a styled anchor that looks like a button. */
export function buttonClassName(options?: { variant?: Variant; size?: Size; className?: string }) {
  const variant = options?.variant ?? "primary";
  const size = options?.size ?? "default";
  return cn(baseClass, variants[variant], sizes[size], options?.className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
});
