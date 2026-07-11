"use client";

import { useCallback, useState } from "react";

import { CompatibilityTable, DiversityTable, FallbackPanel } from "@/components/internal-debug/audit-tables";
import { CollapsibleJson } from "@/components/internal-debug/collapsible-json";
import { internalDebugFetch } from "@/lib/debug-api";

type Survey = {
  sound_profile: string;
  typing_pressure: string;
  switch_feel: string;
  bottom_out: string;
  volume: string;
  natural_language?: string;
};

const DEFAULT_SURVEY: Survey = {
  sound_profile: "muted",
  typing_pressure: "light",
  switch_feel: "linear",
  bottom_out: "soft",
  volume: "quiet",
  natural_language: "",
};

export default function DebugRecommendationsPage() {
  const [survey, setSurvey] = useState<Survey>(DEFAULT_SURVEY);
  const [bundle, setBundle] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inspect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        ...survey,
        natural_language: survey.natural_language?.trim() || undefined,
      };
      const res = await internalDebugFetch("/recommendations/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setBundle(null);
        setError(`${res.status} ${await res.text()}`);
        return;
      }
      setBundle((await res.json()) as Record<string, unknown>);
    } catch (e) {
      setBundle(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [survey]);

  const api = bundle?.apiPayload as Record<string, unknown> | undefined;
  const conf = api?.recommendationConfidence as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Recommendation inspection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Runs <code className="rounded bg-muted px-1">POST /api/v1/debug/recommendations/inspect</code> (replay bundle +
          pipeline trace).
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
        {(
          [
            ["sound_profile", "Sound profile"],
            ["typing_pressure", "Typing pressure"],
            ["switch_feel", "Switch feel"],
            ["bottom_out", "Bottom out"],
            ["volume", "Volume"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <select
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={survey[key]}
              onChange={(e) => setSurvey((s) => ({ ...s, [key]: e.target.value }))}
            >
              {key === "sound_profile" ? (
                <>
                  <option value="thocky">thocky</option>
                  <option value="clacky">clacky</option>
                  <option value="muted">muted</option>
                  <option value="balanced">balanced</option>
                  <option value="bright">bright</option>
                </>
              ) : null}
              {key === "typing_pressure" ? (
                <>
                  <option value="light">light</option>
                  <option value="medium">medium</option>
                  <option value="heavy">heavy</option>
                </>
              ) : null}
              {key === "switch_feel" ? (
                <>
                  <option value="tactile_clear">tactile_clear</option>
                  <option value="tactile_light">tactile_light</option>
                  <option value="linear">linear</option>
                </>
              ) : null}
              {key === "bottom_out" ? (
                <>
                  <option value="soft">soft</option>
                  <option value="medium">medium</option>
                  <option value="firm">firm</option>
                </>
              ) : null}
              {key === "volume" ? (
                <>
                  <option value="quiet">quiet</option>
                  <option value="moderate">moderate</option>
                  <option value="loud">loud</option>
                </>
              ) : null}
            </select>
          </label>
        ))}
        <label className="sm:col-span-2 flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Natural language (optional)</span>
          <textarea
            className="min-h-[4rem] rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={survey.natural_language ?? ""}
            onChange={(e) => setSurvey((s) => ({ ...s, natural_language: e.target.value }))}
            placeholder="e.g. thocky linear quiet office"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={() => void inspect()}
      >
        {loading ? "Running…" : "Inspect"}
      </button>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {bundle ? (
        <div className="space-y-4">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Recommendation confidence</h2>
            {conf ? (
              <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                {JSON.stringify(conf, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No confidence block.</p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Compatibility</h2>
            <CompatibilityTable audit={api?.compatibilityAudit as Record<string, unknown> | undefined} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Diversity reranking</h2>
            <DiversityTable audit={api?.diversityAudit as Record<string, unknown> | undefined} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Fallback</h2>
            <FallbackPanel audit={api?.fallbackAudit as Record<string, unknown> | undefined} />
          </section>

          <CollapsibleJson label="Pipeline trace (flat lines)" data={bundle.pipelineTrace} />
          <CollapsibleJson label="Diagnostics" data={bundle.diagnostics} />
          <CollapsibleJson label="Metrics" data={bundle.metrics} />
          <CollapsibleJson label="Full replay bundle" data={bundle} />
        </div>
      ) : null}
    </div>
  );
}
