"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-4 rounded-xl border-2 border-amber-500/35 bg-amber-50/80 p-5 text-sm dark:bg-amber-500/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="section-label !text-amber-800 dark:!text-amber-200">Debug token</p>
          <p className="mt-1 font-headline text-base font-bold text-amber-950 dark:text-amber-100">
            Internal debug (not public)
          </p>
        </div>
        <Link href="/" className="text-xs font-medium text-primary underline-offset-2 hover:underline">
          ← Back to site
        </Link>
      </div>
      <p className="break-keep text-ca-on-surface-variant">
        API:{" "}
        <code className="rounded-md border border-border bg-white px-1.5 py-0.5 font-mono text-xs dark:bg-ca-surface-container">
          {base || "same-origin /api (use NEXT_PUBLIC_API_URL or INTERNAL_API_PROXY_TARGET in next.config)"}
        </code>
        {" · "}
        Enable backend:{" "}
        <code className="rounded-md border border-border bg-white px-1.5 py-0.5 font-mono text-xs dark:bg-ca-surface-container">
          INTERNAL_DEBUG_API_ENABLED=true
        </code>{" "}
        and either{" "}
        <code className="rounded-md border border-border bg-white px-1.5 py-0.5 font-mono text-xs dark:bg-ca-surface-container">
          DEBUG=true
        </code>{" "}
        or set a shared{" "}
        <code className="rounded-md border border-border bg-white px-1.5 py-0.5 font-mono text-xs dark:bg-ca-surface-container">
          INTERNAL_DEBUG_TOKEN
        </code>{" "}
        and paste it below.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-xs">
          <span className="font-semibold uppercase tracking-wider text-ca-on-surface-variant">
            X-Internal-Debug-Token (optional if API runs with DEBUG=true)
          </span>
          <Input
            className="h-10 border-border font-mono text-xs"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="paste token"
          />
        </label>
        <Button type="button" className="h-10 font-semibold" onClick={save}>
          Save token
        </Button>
      </div>
    </div>
  );
}
