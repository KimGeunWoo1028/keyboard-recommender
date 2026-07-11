import { PageShell } from "@/components/layout/page-shell";

export default function MyPageLoading() {
  return (
    <PageShell className="max-w-ca space-y-4 px-ca-margin-mobile sm:px-ca-margin">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-ca-surface-container/60" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-ca-surface-container/60 sm:w-96" />
      <div className="h-48 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40" />
      <div className="h-48 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40" />
    </PageShell>
  );
}
