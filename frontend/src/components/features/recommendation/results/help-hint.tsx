"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function HelpHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; mobile: boolean }>({
    left: 12,
    top: 12,
    mobile: false,
  });
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mobile = window.innerWidth < 640;
    if (mobile) {
      const left = Math.min(Math.max(rect.left + rect.width / 2, 180), window.innerWidth - 180);
      const top = rect.bottom + 10;
      setCoords({ left, top, mobile: true });
      return;
    }
    const preferredLeft = rect.right + 10;
    const clampedLeft = Math.min(Math.max(preferredLeft, 12), window.innerWidth - 340);
    const clampedTop = Math.min(Math.max(rect.top + rect.height / 2, 20), window.innerHeight - 20);
    setCoords({ left: clampedLeft, top: clampedTop, mobile: false });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [open, updatePosition]);

  return (
    <span className="inline-flex shrink-0 items-center align-middle">
      <button
        ref={btnRef}
        type="button"
        aria-label="도움말 보기"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 bg-background text-[10px] font-bold leading-none text-muted-foreground transition-colors hover:bg-muted"
      >
        ?
      </button>
      {mounted && open
        ? createPortal(
            <span
              role="tooltip"
              className={`fixed z-[99999] w-72 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-background px-3 py-2 text-xs font-normal leading-relaxed text-foreground shadow-2xl sm:w-80 ${
                coords.mobile ? "-translate-x-1/2" : "-translate-y-1/2"
              }`}
              style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
