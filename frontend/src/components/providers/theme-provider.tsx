"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * Wraps the app so `next-themes` can toggle `class="dark"` on `<html>`.
 * `enableSystem` stays off so SSR and the pre-hydration script agree on the default
 * dark launch theme without reading `prefers-color-scheme` (React #418 / html class).
 */
export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="kr-theme"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
