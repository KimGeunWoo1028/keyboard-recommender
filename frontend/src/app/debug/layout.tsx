import type { Metadata } from "next";

import { DebugChrome } from "@/components/internal-debug/debug-chrome";
import { ManusPageHeader } from "@/components/layout/manus-page-header";

export const metadata: Metadata = {
  title: "Internal debug",
  robots: { index: false, follow: false },
};

const DEBUG_LINKS = [
  { href: "/debug/recommendations", label: "Recommendations" },
  { href: "/debug/evaluation", label: "Evaluation" },
  { href: "/debug/snapshots", label: "Snapshots" },
  { href: "/debug/benchmarks", label: "Benchmarks" },
  { href: "/debug/drift", label: "Drift" },
  { href: "/debug/analytics", label: "Analytics" },
] as const;

export default function DebugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-4.25rem)] bg-ca-surface-container-low">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <ManusPageHeader
          eyebrow="Internal"
          title="Debug console"
          description="운영·품질 점검용 내부 도구입니다. 공개 제품 UI가 아닙니다."
        />
        <DebugChrome />
        <nav className="flex flex-wrap gap-2 border-b border-border pb-4" aria-label="Debug sections">
          {DEBUG_LINKS.map((link) => (
            <a
              key={link.href}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-ca-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary dark:bg-ca-surface-container"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-ca-surface-container sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
