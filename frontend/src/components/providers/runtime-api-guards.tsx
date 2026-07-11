"use client";

import { warnIfHttpsPageCallsHttpApi } from "@/lib/api/client";
import { type ReactNode, useEffect } from "react";

/**
 * Client-only checks that help catch misconfiguration (e.g. HTTPS page + HTTP API) without affecting SSR.
 */
export function RuntimeApiGuards({ children }: { children: ReactNode }) {
  useEffect(() => {
    warnIfHttpsPageCallsHttpApi();
  }, []);
  return children;
}
