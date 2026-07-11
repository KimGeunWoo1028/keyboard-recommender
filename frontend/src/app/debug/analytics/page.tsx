import type { Metadata } from "next";

import { getDebugApiBaseUrl } from "@/lib/debug-api";
import { getServerInternalDebugToken } from "@/lib/debug-api-server";

export const metadata: Metadata = {
  title: "Debug analytics",
};

async function fetchKpis() {
  const base = getDebugApiBaseUrl();
  const token = getServerInternalDebugToken();
  if (!base) return null;
  const res = await fetch(`${base}/api/v1/debug/analytics/kpis?window_hours=24`, {
    headers: token ? { "X-Internal-Debug-Token": token } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as any;
}

export default async function DebugAnalyticsPage() {
  const kpis = await fetchKpis();
  if (!kpis) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Backend debug analytics is not available. Enable internal debug API and set a debug token.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">KPI snapshot (last {kpis.window_hours}h)</p>
        <p className="mt-1 text-xs text-muted-foreground">Generated at {String(kpis.generated_at)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Completion rate", `${Math.round((kpis.recommendation_completion_rate ?? 0) * 100)}%`],
          ["Avg time to first result", kpis.avg_time_to_first_result_ms ? `${Math.round(kpis.avg_time_to_first_result_ms)} ms` : "—"],
          ["Save conversion", `${Math.round((kpis.save_conversion_rate ?? 0) * 100)}%`],
          [
            "Evidence tab share",
            typeof kpis.evidence_tab_share === "number"
              ? `${Math.round(kpis.evidence_tab_share * 100)}%`
              : "—",
          ],
          ["Retry frequency", `${Math.round((kpis.retry_frequency_rate ?? 0) * 100)}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border bg-muted/10 p-3">
            <p className="text-xs font-semibold text-muted-foreground">{k}</p>
            <p className="mt-1 text-lg font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Success KPIs exclude Compare / drawer_open (UI removed). Home Redirect/Dashboard stay locked until
        Phase B unlock.
      </p>      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">Top event types</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {(kpis.top_events ?? []).map((it: any) => (
            <li key={String(it.label)}>
              <span className="font-medium text-foreground">{String(it.label)}</span> · {String(it.value)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

