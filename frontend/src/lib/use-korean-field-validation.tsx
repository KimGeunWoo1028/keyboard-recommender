"use client";

import {
  type FormEvent,
  type InvalidEvent,
  useCallback,
  useId,
  useState,
} from "react";

import {
  applyKoreanCustomValidity,
  clearKoreanCustomValidity,
  type ValidationFieldKind,
} from "@/lib/form-validation-ko";

/**
 * Per-field Korean HTML5 validation: native bubble + aria-describedby text.
 * Clears custom validity and inline error when the user edits the field.
 */
export function useKoreanFieldValidation(kind: ValidationFieldKind) {
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);

  const onInvalid = useCallback(
    (e: InvalidEvent<HTMLInputElement>) => {
      const message = applyKoreanCustomValidity(e.currentTarget, kind);
      setError(message || null);
    },
    [kind],
  );

  const onInput = useCallback((e: FormEvent<HTMLInputElement>) => {
    clearKoreanCustomValidity(e.currentTarget);
    setError(null);
  }, []);

  return {
    error,
    setError,
    errorId,
    inputProps: {
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? errorId : undefined,
      onInvalid,
      onInput,
    },
  };
}

export function FieldValidationError({
  id,
  message,
}: {
  id: string;
  message: string | null;
}) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="break-keep text-sm text-destructive">
      {message}
    </p>
  );
}
