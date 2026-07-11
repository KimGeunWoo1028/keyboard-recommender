"use client";

import { useCallback, useEffect, useState } from "react";

import { internalDebugFetch } from "@/lib/debug-api";

type DriftBundle = Record<string, unknown>;

function MiniBars({ values, label }: { values: number[]; label: string }) {
  if (!values.length) {
    return <p className="text-xs text-muted-foreground">No series.</p>;
  }
  const mx = Math.max(...values.map((v) => Math.abs(v)), 1e-6);
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex h-8 items-end gap-px">
        {values.map((v, i) => (
          <div
            key={`${label}-${i}`}
            className="w-1.5 rounded-sm bg-primary/70"
            style={{ height: `${Math.max(8, (Math.abs(v) / mx) * 100)}%` }}
            title={String(v)}
          />
        ))}
      </div>
    </div>
  );
}

export function DriftBundleView({ focus }: { focus: "overview" | "confidence" | "diversity" | "families" }) {
  const [scenarioId, setScenarioId] = useState("");
  const [window, setWindow] = useState(48);
  const [bundle, setBundle] = useState<DriftBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (scenarioId.trim()) {
        q.set("scenario_id", scenarioId.trim());
      }
      q.set("window", String(window));
      const res = await internalDebugFetch(`/drift/summary?${q.toString()}`);
      if (!res.ok) {
        setBundle(null);
        setError(`${res.status} ${await res.text()}`);
        return;
      }
      setBundle((await res.json()) as DriftBundle);
    } catch (e) {
      setBundle(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [scenarioId, window]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>;
  }

  if (loading && !bundle) {
    return <p className="text-sm text-muted-foreground">Loading drift data…</p>;
  }

  if (!bundle || bundle.status === "empty") {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>{String(bundle?.message ?? "No data yet.")}</p>
        <p>Enable evaluation persistence and record some runs, or widen the scenario filter.</p>
      </div>
    );
  }

  const trends = bundle.trends as Record<string, Record<string, unknown>> | undefined;
  const metricsTable = (bundle.metricsTableRecent as Record<string, unknown>[]) ?? [];
  const confSeries = (bundle.confidenceSeries as Record<string, unknown>[]) ?? [];
  const fam = (bundle.switchFamilyCounts as Record<string, number>) ?? {};
  const lines = (bundle.summaryLines as string[]) ?? [];
  const bench = (bundle.benchmarkRuns as Record<string, unknown>[]) ?? [];

  const divSeries = metricsTable.map((r) => Number(r.diversityIntervention)).filter((x) => !Number.isNaN(x));
  const rrSeries = metricsTable.map((r) => Number(r.rerankingDistortionIndex)).filter((x) => !Number.isNaN(x));
  const confVals = confSeries.map((r) => Number(r.overall)).filter((x) => !Number.isNaN(x));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="text-muted-foreground">scenario_id (empty = all)</span>
          <input
            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs"
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
          />
        </label>
        <label className="flex w-32 flex-col gap-1 text-xs">
          <span className="text-muted-foreground">window</span>
          <input
            type="number"
            min={8}
            max={256}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
            value={window}
            onChange={(e) => setWindow(Number(e.target.value) || 48)}
          />
        </label>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {(focus === "overview" || focus === "confidence" || focus === "diversity") && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold">Summary</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {lines.map((ln) => (
              <li key={ln}>{ln}</li>
            ))}
          </ul>
        </div>
      )}

      {focus === "overview" && trends ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(trends).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border/70 bg-background/60 p-3 text-xs">
              <p className="font-semibold">{k}</p>
              <p className="mt-1 text-muted-foreground">trend: {String(v.twoWindowTrend)}</p>
              <p className="text-muted-foreground">cv: {String(v.coefficientOfVariation)}</p>
            </div>
          ))}
        </div>
      ) : null}

      {(focus === "overview" || focus === "confidence") && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Confidence samples</h2>
          <MiniBars values={confVals.slice(-32)} label="confidence overall (compact)" />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-2">recordedAt</th>
                  <th className="py-2 pr-2">overall</th>
                  <th className="py-2">label</th>
                </tr>
              </thead>
              <tbody>
                {confSeries.slice(0, 24).map((r) => (
                  <tr key={String(r.runId)} className="border-b border-border/60">
                    <td className="py-1.5 pr-2 font-mono">{String(r.recordedAt)}</td>
                    <td className="py-1.5 pr-2">{String(r.overall)}</td>
                    <td className="py-1.5">{String(r.label)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(focus === "overview" || focus === "diversity") && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Diversity intervention</h2>
            <MiniBars values={divSeries.slice(-32)} label="diversity_intervention" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Reranking distortion index</h2>
            <MiniBars values={rrSeries.slice(-32)} label="reranking_distortion_index" />
          </div>
        </section>
      )}

      {(focus === "overview" || focus === "families") && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Switch family frequency (winner)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-2">family</th>
                  <th className="py-2">count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fam).map(([k, v]) => (
                  <tr key={k} className="border-b border-border/60">
                    <td className="py-1.5 pr-2 font-mono">{k}</td>
                    <td className="py-1.5">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {focus === "overview" && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Recent benchmark runs</h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {bench.map((b) => (
              <li key={String(b.id)} className="rounded-md border border-border/60 bg-muted/20 p-2">
                <span className="font-mono text-foreground">{String(b.createdAt)}</span> — {String(b.baselineLabel)} vs{" "}
                {String(b.treatmentLabel)}
                <ul className="mt-1 list-inside list-disc">
                  {(b.narrativePreview as string[]).map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
