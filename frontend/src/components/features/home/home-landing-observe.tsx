"use client";

import { useEffect, useRef } from "react";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { emitHomeViewedEventBestEffort } from "@/lib/api/onboarding-events";

const SESSION_KEY = "kr_home_viewed_session";

/**
 * Best-effort Home Landing entry signal for Phase 5 data prerequisite.
 * Does not change Home IA (no Redirect / Dashboard / dual Hero).
 */
export function HomeLandingObserve() {
  const { user, authChecked } = useAuthHeader();
  const sent = useRef(false);

  useEffect(() => {
    if (!authChecked || sent.current) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
      sent.current = true;
      return;
    }
    sent.current = true;
    window.sessionStorage.setItem(SESSION_KEY, "1");
    void emitHomeViewedEventBestEffort({
      path: "/",
      auth: user ? "authenticated" : "guest",
    });
  }, [authChecked, user]);

  return null;
}
