"use client";

import type { ReactNode } from "react";

import { AuthHeaderProvider } from "@/components/layout/auth-controls";

/** Lifts auth session into the tree so header + page CTAs share one user state. */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <AuthHeaderProvider>{children}</AuthHeaderProvider>;
}
