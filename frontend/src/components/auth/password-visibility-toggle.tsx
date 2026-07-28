"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Accessible label when password is visible (hide action). */
  hideLabel?: string;
  /** Accessible label when password is hidden (show action). */
  showLabel?: string;
  className?: string;
};

/** Eye / eye-off toggle matching mypage password fields. */
export function PasswordVisibilityToggle({
  visible,
  onToggle,
  disabled = false,
  hideLabel = "비밀번호 숨기기",
  showLabel = "비밀번호 보기",
  className,
}: Props) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:bg-transparent hover:text-ca-on-surface",
        className,
      )}
      aria-label={visible ? hideLabel : showLabel}
      onClick={onToggle}
      disabled={disabled}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
          <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-3.17 4.59" />
          <path d="M6.61 6.61A11.8 11.8 0 0 0 1 12c1.04 2.94 3.1 5.2 5.74 6.46" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </Button>
  );
}
