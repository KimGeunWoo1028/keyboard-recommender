import type { Metadata } from "next";
import Link from "next/link";

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
    <div className="min-h-[calc(100dvh-4.5rem)] bg-[rgb(248_248_252)] dark:bg-ca-surface-container-low">
      <div className="mx-auto max-w-5xl space-y-6 px-ca-margin-mobile py-8 sm:px-ca-margin">
        <ManusPageHeader
          eyebrow="Internal"
          title="Debug console"
          description="운영·품질 점검용 내부 도구입니다. 공개 제품 UI가 아닙니다."
        />
        <DebugChrome />
        <nav
          className="flex flex-wrap gap-1 border-b border-[rgb(220_220_238)] dark:border-border"
          aria-label="Debug sections"
        >
          {DEBUG_LINKS.map((link) => (
            <Link
              key={link.href}
              className="inline-flex h-11 items-center border-b-2 border-transparent px-4 text-sm font-semibold text-ca-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-sm border-2 border-[rgb(220_220_238)] bg-white p-4 shadow-sm dark:border-border dark:bg-ca-surface-container sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
