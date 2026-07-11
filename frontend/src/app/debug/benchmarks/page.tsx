"use client";

import { useState } from "react";

import { CollapsibleJson } from "@/components/internal-debug/collapsible-json";
import { internalDebugFetch } from "@/lib/debug-api";

function parseSnapshot(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (parsed.schemaVersion === "debug.replay_bundle.v1" && parsed.snapshot) {
    return parsed.snapshot as Record<string, unknown>;
  }
  return parsed;
}

export default function DebugBenchmarksPage() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function compare() {
    setLoading(true);
    setError(null);
    try {
      const baseline_snapshot = parseSnapshot(a);
      const treatment_snapshot = parseSnapshot(b);
      const res = await internalDebugFetch("/benchmarks/compare-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseline_snapshot, treatment_snapshot }),
      });
      if (!res.ok) {
        setReport(null);
        setError(`${res.status} ${await res.text()}`);
        return;
      }
      const body = (await res.json()) as Record<string, unknown>;
      setReport(body.benchmarkReport as Record<string, unknown>);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Benchmark comparison</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two snapshots (or replay bundles) → <code className="rounded bg-muted px-1">compare-snapshots</code>{" "}
          narrative + metric deltas.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Baseline JSON</span>
          <textarea
            className="min-h-[14rem] rounded-md border border-input bg-background p-2 font-mono text-xs"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Treatment JSON</span>
          <textarea
            className="min-h-[14rem] rounded-md border border-input bg-background p-2 font-mono text-xs"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={() => void compare()}
      >
        {loading ? "Comparing…" : "Compare"}
      </button>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="space-y-3">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Narrative</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              {(report.narrativeLines as string[] | undefined)?.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <CollapsibleJson label="Metric comparison" data={report.metricComparison} defaultOpen />
          <CollapsibleJson label="Signal comparison" data={report.signalComparison} />
          <CollapsibleJson label="Full benchmark report" data={report} />
        </div>
      ) : null}
    </div>
  );
}
