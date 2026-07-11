"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  data: unknown;
  defaultOpen?: boolean;
  className?: string;
};

export function CollapsibleJson({ label, data, defaultOpen = false, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const text = JSON.stringify(data, null, 2);

  return (
    <section className={cn("rounded-lg border border-border bg-muted/30", className)}>
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <pre
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-btn`}
          className="max-h-[min(70vh,32rem)] overflow-auto border-t border-border p-3 text-xs leading-relaxed"
        >
          {text}
        </pre>
      ) : null}
    </section>
  );
}
