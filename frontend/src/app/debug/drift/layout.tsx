import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Drift",
};

const DRIFT_LINKS = [
  { href: "/debug/drift", label: "Overview" },
  { href: "/debug/drift/confidence", label: "Confidence" },
  { href: "/debug/drift/diversity", label: "Diversity" },
  { href: "/debug/drift/families", label: "Families" },
] as const;

export default function DriftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Drift sections">
        {DRIFT_LINKS.map((link) => (
          <Link
            key={link.href}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-ca-surface-container-low px-2.5 text-xs font-semibold text-ca-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
