import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drift",
};

export default function DriftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 text-xs">
        <a className="rounded border border-border px-2 py-1 hover:bg-muted" href="/debug/drift">
          Overview
        </a>
        <a className="rounded border border-border px-2 py-1 hover:bg-muted" href="/debug/drift/confidence">
          Confidence
        </a>
        <a className="rounded border border-border px-2 py-1 hover:bg-muted" href="/debug/drift/diversity">
          Diversity
        </a>
        <a className="rounded border border-border px-2 py-1 hover:bg-muted" href="/debug/drift/families">
          Families
        </a>
      </nav>
      {children}
    </div>
  );
}
