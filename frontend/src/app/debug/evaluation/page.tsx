"use client";

import { useState } from "react";

import { CollapsibleJson } from "@/components/internal-debug/collapsible-json";
import { internalDebugFetch } from "@/lib/debug-api";

export default function DebugEvaluationPage() {
  const [raw, setRaw] = useState("");
  const [out, setOut] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      let snap: Record<string, unknown>;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed.schemaVersion === "debug.replay_bundle.v1" && parsed.snapshot) {
        snap = parsed.snapshot as Record<string, unknown>;
      } else {
        snap = parsed;
      }
      const res = await internalDebugFetch("/snapshots/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: snap }),
      });
      if (!res.ok) {
        setOut(null);
        setError(`${res.status} ${await res.text()}`);
        return;
      }
      setOut((await res.json()) as Record<string, unknown>);
    } catch (e) {
      setOut(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Evaluation summary</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a replay bundle from <a className="underline" href="/debug/recommendations">Recommendations</a> or a raw{" "}
          <code className="rounded bg-muted px-1">evaluation.snapshot.v1</code> JSON, then analyze (no engine re-run).
        </p>
      </div>

      <textarea
        className="min-h-[12rem] w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder='{ "schemaVersion": "evaluation.snapshot.v1", ... }'
      />

      <button
        type="button"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={() => void analyze()}
      >
        {loading ? "Analyzing…" : "Analyze snapshot"}
      </button>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {out ? (
        <div className="space-y-3">
          <CollapsibleJson label="Diagnostics summary" data={out.diagnostics} defaultOpen />
          <CollapsibleJson label="Metrics" data={out.metrics} defaultOpen />
          <CollapsibleJson label="Reranking impact" data={out.rerankingImpact} />
          <CollapsibleJson label="Fallback effectiveness" data={out.fallbackEffectiveness} />
          <CollapsibleJson label="Full response" data={out} />
        </div>
      ) : null}
    </div>
  );
}
