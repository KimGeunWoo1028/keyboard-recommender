import type { HTMLAttributes, ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

/**
 * Label + control + optional description/error wiring (DS-FORM-01).
 * Pass the same `htmlFor` / control `id`, and set `aria-invalid` on the control when `error` is set.
 */
export function Field({ label, htmlFor, description, error, className, children, ...props }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
