"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDebugApiBaseUrl } from "@/lib/debug-api";

export function DebugChrome() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(typeof window !== "undefined" ? window.sessionStorage.getItem("internalDebugToken") ?? "" : "");
  }, []);

  const save = () => {
    const t = token.trim();
    if (t) {
      window.sessionStorage.setItem("internalDebugToken", t);
    } else {
      window.sessionStorage.removeItem("internalDebugToken");
    }
  };

  const base = getDebugApiBaseUrl();

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-amber-950 dark:text-amber-100">Internal debug (not public)</p>
        <Link href="/" className="text-xs underline">
          ← Back to site
        </Link>
      </div>
      <p className="text-muted-foreground">
        API:{" "}
        <code className="rounded bg-muted px-1">
          {base || "same-origin /api (use NEXT_PUBLIC_API_URL or INTERNAL_API_PROXY_TARGET in next.config)"}
        </code>
        {" · "}
        Enable backend:{" "}
        <code className="rounded bg-muted px-1">INTERNAL_DEBUG_API_ENABLED=true</code> and either{" "}
        <code className="rounded bg-muted px-1">DEBUG=true</code> or set a shared{" "}
        <code className="rounded bg-muted px-1">INTERNAL_DEBUG_TOKEN</code> and paste it below.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="text-muted-foreground">X-Internal-Debug-Token (optional if API runs with DEBUG=true)</span>
          <input
            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="paste token"
          />
        </label>
        <button
          type="button"
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          onClick={save}
        >
          Save token
        </button>
      </div>
    </div>
  );
}
