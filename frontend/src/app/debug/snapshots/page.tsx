"use client";

import { useState } from "react";

import { CompatibilityTable, DiversityTable, FallbackPanel } from "@/components/internal-debug/audit-tables";
import { CollapsibleJson } from "@/components/internal-debug/collapsible-json";
import { internalDebugFetch } from "@/lib/debug-api";

export default function DebugSnapshotsPage() {
  const [raw, setRaw] = useState("");
  const [snap, setSnap] = useState<Record<string, unknown> | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      let s = parsed;
      if (parsed.schemaVersion === "debug.replay_bundle.v1" && parsed.snapshot) {
        s = parsed.snapshot as Record<string, unknown>;
      }
      setSnap(s);
      const res = await internalDebugFetch("/snapshots/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: s }),
      });
      if (!res.ok) {
        setAnalysis(null);
        setError(`${res.status} ${await res.text()}`);
        return;
      }
      setAnalysis((await res.json()) as Record<string, unknown>);
    } catch (e) {
      setSnap(null);
      setAnalysis(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Snapshot viewer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste JSON, resolve embedded snapshot if needed, then render audits + diagnostics side by side.
        </p>
      </div>

      <textarea
        className="min-h-[14rem] w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      <button
        type="button"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={() => void load()}
      >
        {loading ? "Loading…" : "Parse & analyze"}
      </button>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {snap ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Snapshot audits</h2>
            <CompatibilityTable audit={snap.compatibilityAudit as Record<string, unknown> | undefined} />
            <DiversityTable audit={snap.diversityAudit as Record<string, unknown> | undefined} />
            <FallbackPanel audit={snap.fallbackAudit as Record<string, unknown> | undefined} />
            <CollapsibleJson label="Raw snapshot JSON" data={snap} />
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Derived analysis</h2>
            {analysis ? (
              <>
                <CollapsibleJson label="Diagnostics" data={analysis.diagnostics} defaultOpen />
                <CollapsibleJson label="Metrics" data={analysis.metrics} defaultOpen />
                <CollapsibleJson label="Reranking impact" data={analysis.rerankingImpact} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No analysis yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
