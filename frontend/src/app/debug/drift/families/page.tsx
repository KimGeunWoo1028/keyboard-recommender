"use client";

import { DriftBundleView } from "@/components/internal-debug/drift-bundle-view";

export default function DriftFamiliesPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold tracking-tight">Switch family distribution</h1>
      <DriftBundleView focus="families" />
    </div>
  );
}
