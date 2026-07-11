"use client";

import { DriftBundleView } from "@/components/internal-debug/drift-bundle-view";

export default function DriftOverviewPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Operational drift</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reads persisted evaluation rows via <code className="rounded bg-muted px-1">GET /api/v1/debug/drift/summary</code>
          (internal API + DB). Empty until persistence has recorded runs.
        </p>
      </div>
      <DriftBundleView focus="overview" />
    </div>
  );
}
