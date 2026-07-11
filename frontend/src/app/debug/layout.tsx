import type { Metadata } from "next";

import { DebugChrome } from "@/components/internal-debug/debug-chrome";

export const metadata: Metadata = {
  title: "Internal debug",
  robots: { index: false, follow: false },
};

export default function DebugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <DebugChrome />
      <nav className="flex flex-wrap gap-2 text-sm">
        <a className="rounded-md border border-border px-2 py-1 hover:bg-muted" href="/debug/recommendations">
          Recommendations
        </a>
        <a className="rounded-md border border-border px-2 py-1 hover:bg-muted" href="/debug/evaluation">
          Evaluation
        </a>
        <a className="rounded-md border border-border px-2 py-1 hover:bg-muted" href="/debug/snapshots">
          Snapshots
        </a>
        <a className="rounded-md border border-border px-2 py-1 hover:bg-muted" href="/debug/benchmarks">
          Benchmarks
        </a>
        <a className="rounded-md border border-border px-2 py-1 hover:bg-muted" href="/debug/drift">
          Drift
        </a>
        <a className="rounded-md border border-border px-2 py-1 hover:bg-muted" href="/debug/analytics">
          Analytics
        </a>
      </nav>
      {children}
    </div>
  );
}
