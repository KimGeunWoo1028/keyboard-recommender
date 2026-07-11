"use client";

type CompatLine = {
  ruleId?: string;
  effectivePenalty?: number;
  message?: string;
};

type DivFamily = {
  family?: string;
  originalOrderIds?: string[];
  rerankedOrderIds?: string[];
  changed?: boolean;
};

export function CompatibilityTable({ audit }: { audit: Record<string, unknown> | null | undefined }) {
  if (!audit || typeof audit !== "object") {
    return <p className="text-sm text-muted-foreground">No compatibility audit.</p>;
  }
  const lines = (audit.lines as CompatLine[] | undefined) ?? [];
  if (!lines.length) {
    return (
      <div className="space-y-1 text-sm">
        <p>
          Effective penalty: <code>{String(audit.effectivePenaltyTotal ?? 0)}</code> (no rule lines).
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-2 font-medium">Rule</th>
            <th className="py-2 pr-2 font-medium">Eff. penalty</th>
            <th className="py-2 font-medium">Message</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((ln) => (
            <tr key={`${ln.ruleId}-${ln.message}`} className="border-b border-border/60 align-top">
              <td className="py-1.5 pr-2 font-mono text-xs">{ln.ruleId}</td>
              <td className="py-1.5 pr-2">{ln.effectivePenalty}</td>
              <td className="py-1.5 text-muted-foreground">{ln.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DiversityTable({ audit }: { audit: Record<string, unknown> | null | undefined }) {
  if (!audit || typeof audit !== "object") {
    return <p className="text-sm text-muted-foreground">No diversity audit.</p>;
  }
  const families = (audit.families as DivFamily[] | undefined) ?? [];
  if (!families.length) {
    return <p className="text-sm text-muted-foreground">No per-family rerank rows.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-2 font-medium">Family</th>
            <th className="py-2 pr-2 font-medium">Changed</th>
            <th className="py-2 font-medium">Original → Reranked</th>
          </tr>
        </thead>
        <tbody>
          {families.map((f) => {
            const o = f.originalOrderIds ?? [];
            const r = f.rerankedOrderIds ?? [];
            const changed = o.join(",") !== r.join(",");
            return (
              <tr key={String(f.family)} className="border-b border-border/60 align-top">
                <td className="py-1.5 pr-2 font-mono text-xs">{f.family}</td>
                <td className="py-1.5 pr-2">{changed ? "yes" : "no"}</td>
                <td className="py-1.5 font-mono text-xs text-muted-foreground">
                  {o.join(", ")} → {r.join(", ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FallbackPanel({ audit }: { audit: Record<string, unknown> | null | undefined }) {
  if (!audit || typeof audit !== "object") {
    return <p className="text-sm text-muted-foreground">No fallback audit (no recovery path).</p>;
  }
  return (
    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Recovered</dt>
        <dd>{String(audit.recovered)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Tier</dt>
        <dd>{String(audit.tier)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Compat relax mult</dt>
        <dd>{String(audit.compatibilityRelaxMult)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Confidence before → after</dt>
        <dd>
          {String(audit.confidenceBefore)} → {String(audit.confidenceAfter)}
        </dd>
      </div>
      {Array.isArray(audit.notes) && audit.notes.length > 0 ? (
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Notes</dt>
          <dd>
            <ul className="list-inside list-disc">
              {(audit.notes as string[]).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
