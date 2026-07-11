"use client";

import { DriftBundleView } from "@/components/internal-debug/drift-bundle-view";

export default function DriftConfidencePage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold tracking-tight">Confidence drift</h1>
      <DriftBundleView focus="confidence" />
    </div>
  );
}
