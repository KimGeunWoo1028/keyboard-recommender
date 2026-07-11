"use client";

import { DriftBundleView } from "@/components/internal-debug/drift-bundle-view";

export default function DriftDiversityPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold tracking-tight">Diversity &amp; reranking</h1>
      <DriftBundleView focus="diversity" />
    </div>
  );
}
